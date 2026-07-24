/**
 * Build the SGCE variant catalog from the UniProt Proteins API (no auth).
 * Source: https://www.ebi.ac.uk/proteins/api/variation/O43556
 *
 * UniProt variation positions are numbered against the O43556 canonical
 * sequence, which is identical to the app's SEQUENCE / NM_003919.3 CDS
 * translation (verified), so protein positions map directly onto our codons.
 *
 * Classification reads `locations[].loc` — the feed's own HGVS p. string —
 * because `consequenceType` contradicts it on 13 of 611 features (see
 * scripts/lib/variant-mapping.mjs for the two worked examples).
 *
 * HGVS notation is taken from the feed, never synthesized. A `c.` becomes an
 * engine-ready `edit` only when it is a simple substitution AND it validates
 * against the local CDS. Anything else is browse-only: the lollipop, the list
 * and the detail panel still show it, but no numbers are computed for it.
 *
 * Run: npm run fetch-variants [-- --out path/to/file.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import {
  assertCdsIntegrity,
  checksum,
  classifyFeature,
  collectXrefs,
  distinctToken,
  inferSub,
  makeId,
  mapSignificance,
  moreSevere,
  parseCdsFromSource,
  parseSimpleSub,
  residueAt,
  selectCdsHgvs,
  selectProteinHgvs,
  selectShortProteinHgvs,
  SIG_ORDER,
  validateSub,
} from "./lib/variant-mapping.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UNIPROT = "https://www.ebi.ac.uk/proteins/api/variation/O43556";
const TRANSCRIPT = "NM_003919.3";

// --out lets a test or a CI dry-run write somewhere other than the tracked catalog.
const outFlag = process.argv.indexOf("--out");
const OUT =
  outFlag !== -1 && process.argv[outFlag + 1]
    ? resolve(process.cwd(), process.argv[outFlag + 1])
    : join(ROOT, "src", "data", "variant-catalog.json");

const CDS = assertCdsIntegrity(
  parseCdsFromSource(readFileSync(join(ROOT, "src", "constants", "codon-data.ts"), "utf8")),
);
const PROTEIN_LEN = CDS.length / 3 - 1; // 437; UniProt positions past this are stop-lost

// --feed reads a saved copy of the response instead of calling EBI. Used by the
// unit tests and by repeated local runs; the tracked catalog is always built
// from the live feed.
const feedFlag = process.argv.indexOf("--feed");
const FEED_FILE = feedFlag !== -1 ? resolve(process.cwd(), process.argv[feedFlag + 1]) : null;

async function loadFeed() {
  if (FEED_FILE) return JSON.parse(readFileSync(FEED_FILE, "utf8"));
  // EBI drops long connections intermittently; a single timeout should not cost
  // a full rebuild.
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(UNIPROT, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`UniProt HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastErr = e;
      console.error(`  fetch attempt ${attempt}/3 failed: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, attempt * 2000));
    }
  }
  console.error(`Could not fetch the UniProt variation feed: ${lastErr?.message}`);
  process.exit(1);
}

const data = await loadFeed();
const features = data.features || [];
if (!features.length) throw new Error("Feed returned no features — refusing to write an empty catalog");

// Every path that loses a record is counted. The previous build reported 611 in
// and 599 out while accounting for only 2 of the 12 losses.
const dropped = { stopLost: 0, unclassifiable: 0, noPosition: 0, dedupMerged: 0 };
const unclassifiable = [];
const catalog = [];

for (const f of features) {
  const pos = Number(f.begin);
  if (!pos) {
    dropped.noPosition++;
    continue;
  }
  if (pos > PROTEIN_LEN) {
    // Stop-lost (*438). Outside the protein and outside ConsequenceClass.
    dropped.stopLost++;
    continue;
  }

  const consequence = classifyFeature(f);
  if (!consequence || consequence === "stop-lost") {
    // Never fall back to a clinical class we did not derive. A feed shape we do
    // not understand must fail the build, not ship as a plausible-looking row.
    dropped.unclassifiable++;
    unclassifiable.push(
      `aa ${f.begin}-${f.end} consequenceType="${f.consequenceType}" locations=${JSON.stringify(
        (f.locations || []).map((l) => l.loc),
      )}`,
    );
    continue;
  }

  // wildType/mutatedType are documented as single residues. Multi-residue events
  // (begin !== end) carry things like "IN" or "Y*", which are not that — leave
  // the fields off rather than overload them, and let `notation` carry the truth.
  const rawWt = f.wildType || "";
  const rawMut = f.alternativeSequence || f.mutatedType || "";
  const wildType = rawWt.length === 1 ? rawWt : "";
  const mutatedType = rawMut.length === 1 ? rawMut : "";

  const notation = selectProteinHgvs(f.locations) || "";
  // The feed gives the 1-letter form on only some records. Construct it when it
  // is missing so a search for `p.R102*` — the string this catalog used to
  // display, and what existing links carry — keeps working alongside the
  // 3-letter `p.Arg102Ter` a patient reads off their own lab report.
  const notationShort =
    selectShortProteinHgvs(f.locations) ||
    (wildType && mutatedType ? `p.${wildType}${pos}${mutatedType}` : "");
  const feedC = selectCdsHgvs(f.locations);

  // ── The exact CDS change ──────────────────────────────────────────────
  // Sourced first: a simple substitution from the feed, checked against our CDS.
  // Inferred second: only when the feed carries no `c.` at all.
  // Never fabricated: a feed `c.` that is an indel stays browse-only, even
  // though a substitution reproducing the same residue could be constructed.
  let edit;
  let cNotation = "";
  let cSource = null;
  let cAmbiguous = false;

  // Only a genuine single-residue substitution can be expressed as a `sub` edit.
  // Without this gate `p.Ile148_Asn149insTer` — a stop *inserted between* two
  // residues, whose `alternativeSequence` is the single character "*" — infers a
  // substitution at 148 that no database reports. Six such rows exist.
  const substitutable =
    f.begin === f.end &&
    (consequence === "missense" || consequence === "nonsense" || consequence === "synonymous");

  const sub = parseSimpleSub(feedC);
  if (substitutable && sub && validateSub(CDS, sub, pos, mutatedType)) {
    edit = { kind: "sub", cdsStart: sub.cdsStart, altBase: sub.altBase };
    cNotation = feedC;
    cSource = "Ensembl";
  } else if (substitutable && !feedC && mutatedType) {
    const inferred = inferSub(CDS, pos, mutatedType);
    if (inferred) {
      edit = { kind: "sub", cdsStart: inferred.cdsStart, altBase: inferred.altBase };
      cAmbiguous = inferred.ambiguous;
      cSource = "inferred";
      // Suppressed when several nucleotide paths give the same residue: the
      // amino-acid change is certain, the exact nucleotide is not.
      cNotation = inferred.ambiguous
        ? ""
        : `c.${inferred.cdsStart}${CDS[inferred.cdsStart - 1]}>${inferred.altBase}`;
    }
  }

  const xrefs = collectXrefs(f);
  catalog.push({
    // The id uses the first residue of the event even for multi-residue rows
    // (where `wildType` itself is left off, being more than one residue): the
    // event does start at `pos`, and "?148*" reads like missing data.
    id: makeId({
      wildType: wildType || rawWt[0] || "",
      aaPosition: pos,
      mutatedType,
      token: distinctToken(xrefs),
    }),
    cNotation,
    notation,
    notationShort,
    cdsPosition: edit ? edit.cdsStart : (pos - 1) * 3 + 1,
    aaPosition: pos,
    reportedConsequence: consequence,
    significance: mapSignificance(f.clinicalSignificances),
    ...(wildType ? { wildType } : {}),
    ...(mutatedType ? { mutatedType } : {}),
    ...(edit ? { edit } : {}),
    ...(cSource ? { cSource } : {}),
    ...(cAmbiguous ? { cAmbiguous } : {}),
    ...(edit ? {} : { browseOnly: true }),
    source: "UniProt",
    ...(xrefs.length ? { xrefs } : {}),
  });
}

if (unclassifiable.length) {
  console.error(`Refusing to build: ${unclassifiable.length} feature(s) could not be classified.`);
  for (const u of unclassifiable) console.error(`  ${u}`);
  process.exit(1);
}

// ── Dedupe ────────────────────────────────────────────────────────────────
// Same id reported by several sources. Merge by severity rather than keeping
// whichever record the feed happened to emit first (that is why T424S shipped
// as `vus`), and prefer the member that carries an engine-ready edit.
const byId = new Map();
const classConflicts = [];
for (const v of catalog) {
  const existing = byId.get(v.id);
  if (!existing) {
    byId.set(v.id, v);
    continue;
  }
  dropped.dedupMerged++;
  if (existing.reportedConsequence !== v.reportedConsequence) {
    classConflicts.push(`${v.id}: ${existing.reportedConsequence} vs ${v.reportedConsequence}`);
  }
  existing.xrefs = [...new Set([...(existing.xrefs || []), ...(v.xrefs || [])])];
  existing.significance = moreSevere(existing.significance, v.significance);
  if (!existing.edit && v.edit) {
    existing.edit = v.edit;
    existing.cNotation = v.cNotation;
    existing.cdsPosition = v.cdsPosition;
    existing.cSource = v.cSource;
    if (v.cAmbiguous) existing.cAmbiguous = true;
    delete existing.browseOnly;
  }
}
if (classConflicts.length) {
  console.error("Refusing to build: ids collide across different consequence classes.");
  for (const c of classConflicts) console.error(`  ${c}`);
  process.exit(1);
}

const deduped = [...byId.values()];
deduped.sort(
  (a, b) => a.aaPosition - b.aaPosition || SIG_ORDER.indexOf(a.significance) - SIG_ORDER.indexOf(b.significance),
);

const engineReady = deduped.filter((v) => v.edit).length;
const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    source: UNIPROT,
    transcript: TRANSCRIPT,
    // Every edit.cdsStart is a coordinate into this exact sequence. Pinning its
    // checksum means a reformat or transcript bump is detectable rather than
    // silently invalidating all of them.
    cdsChecksum: checksum(CDS),
    cdsLength: CDS.length,
    featureCount: features.length,
    recordCount: deduped.length,
    engineReady,
    dropped,
  },
  variants: deduped,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");

const byClass = {};
const bySig = {};
const bySource = {};
for (const v of deduped) {
  byClass[v.reportedConsequence] = (byClass[v.reportedConsequence] || 0) + 1;
  bySig[v.significance] = (bySig[v.significance] || 0) + 1;
  bySource[v.cSource || "browse-only"] = (bySource[v.cSource || "browse-only"] || 0) + 1;
}
const totalDropped = Object.values(dropped).reduce((a, b) => a + b, 0);
console.log(`Wrote ${deduped.length} variants -> ${OUT}`);
console.log(`  features in: ${features.length}  |  dropped: ${totalDropped}  |  out: ${deduped.length}`);
console.log(`  drop reasons:`, dropped);
console.log(`  engine-ready edit: ${engineReady}`);
console.log(`  c. provenance:`, bySource);
console.log(`  by class:`, byClass);
console.log(`  by significance:`, bySig);
if (features.length !== deduped.length + totalDropped) {
  console.error(`  ACCOUNTING ERROR: ${features.length} != ${deduped.length} + ${totalDropped}`);
  process.exit(1);
}
