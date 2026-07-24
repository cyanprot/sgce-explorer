/**
 * Pure mapping functions for the SGCE variant catalog build.
 *
 * Extracted from fetch-variants.mjs so they can be unit-tested: the script
 * itself performs `await fetch` and `writeFileSync` at module scope, which makes
 * every rule inside it unreachable from a test.
 *
 * No I/O, no network, no filesystem. Everything here is a pure function of its
 * arguments.
 *
 * ── Why classification reads `locations[].loc` ──────────────────────────────
 * UniProt's `consequenceType` contradicts its own `locations` HGVS string on 13
 * of 611 SGCE features, in both directions:
 *
 *   begin 102 | consequenceType "missense"    | locations p.Arg102Ter      <- really nonsense
 *   begin 289 | consequenceType "stop gained" | locations p.Ile289SerfsTer4 <- really frameshift
 *
 * Trusting `consequenceType` shipped `c.304C>T (p.Arg102*)` — a canonical
 * pathogenic DYT11 stop-gain — to patients as "Missense / no premature stop /
 * full-length product". Trusting `alternativeSequence` instead would relabel the
 * pathogenic frameshift at 289 as a missense, because for a frameshift that
 * field holds the first *novel* residue, not a substituted one.
 *
 * `locations[].loc` carries a real HGVS p. string on 611/611 features and is the
 * only field that is right in both cases. It is the arbiter here; the other two
 * are tie-breakers for a feed that stops providing it.
 */

export const CODON_TABLE = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L", CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M", GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S", CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T", GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*", CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K", GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W", CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R", GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

export function translateCodon(codon) {
  return CODON_TABLE[codon] ?? "?";
}

/** Amino acid encoded at 1-indexed protein position `pos`. */
export function residueAt(cds, pos) {
  return translateCodon(cds.slice((pos - 1) * 3, (pos - 1) * 3 + 3));
}

/**
 * Pull CDS_SEQUENCE out of codon-data.ts.
 *
 * This parses TypeScript with a regex, so it is fragile by construction: a
 * reformat that changes the string-concatenation style silently yields a short
 * or empty CDS, and every inferred `edit.cdsStart` in the catalog would then be
 * computed against the wrong sequence. The assertions below turn that into a
 * build failure instead of silent corruption. `assertCdsIntegrity` is the second
 * half of the guard and callers must run it.
 */
export function parseCdsFromSource(src) {
  const m = src.match(/CDS_SEQUENCE\s*=\s*([\s\S]*?);/);
  if (!m) throw new Error("Could not locate CDS_SEQUENCE in codon-data.ts");
  const cds = (m[1].match(/"[ATGC]+"/g) || []).map((s) => s.slice(1, -1)).join("");
  if (!cds) throw new Error("CDS_SEQUENCE parsed to an empty string (source format changed?)");
  return cds;
}

/** Structural checks the CDS must satisfy before anything is computed against it. */
export function assertCdsIntegrity(cds, expectedLength = 1314) {
  if (cds.length !== expectedLength) {
    throw new Error(`CDS length ${cds.length} != expected ${expectedLength} — refusing to build`);
  }
  if (cds.length % 3 !== 0) throw new Error(`CDS length ${cds.length} is not a multiple of 3`);
  if (translateCodon(cds.slice(0, 3)) !== "M") throw new Error("CDS does not start with ATG");
  if (translateCodon(cds.slice(-3)) !== "*") throw new Error("CDS does not end with a stop codon");
  const internalStop = [...Array(cds.length / 3 - 1).keys()].find(
    (i) => translateCodon(cds.slice(i * 3, i * 3 + 3)) === "*",
  );
  if (internalStop !== undefined) {
    throw new Error(`CDS has an internal stop at codon ${internalStop + 1}`);
  }
  return cds;
}

/** FNV-1a, so the catalog can pin the exact CDS its coordinates were built against. */
export function checksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// ── Classification ──────────────────────────────────────────────────────────

/**
 * Pick the p. HGVS string to classify from. The feed often carries both forms
 * (`p.R97*` and `p.Arg97Ter`); the 3-letter form is the canonical one and the
 * one a patient sees on their own lab report, so prefer it.
 */
export function selectProteinHgvs(locations = []) {
  const ps = locations.map((l) => l.loc).filter((l) => /^p\./.test(l));
  if (!ps.length) return null;
  const threeLetter = ps.filter((p) => /^p\.[A-Z][a-z]{2}\d/.test(p));
  return (threeLetter[0] ?? ps[0]);
}

/** The 1-letter form (`p.R97*`) if the feed supplies one. */
export function selectShortProteinHgvs(locations = []) {
  const ps = locations.map((l) => l.loc).filter((l) => /^p\./.test(l));
  return ps.find((p) => /^p\.[A-Z]\d/.test(p)) ?? null;
}

export function selectCdsHgvs(locations = []) {
  return locations.map((l) => l.loc).find((l) => /^c\./.test(l)) ?? null;
}

/**
 * Consequence class from an HGVS p. string.
 *
 * ORDER IS LOAD-BEARING. The truncating tests must run before dup/ins/del:
 * `p.Ile148_Asn149insTer` and `p.Thr257_Cys258insTer` insert a *stop codon*, and
 * matching `ins` first would file two truncating pathogenic variants under the
 * benign-sounding label "insertion". Likewise `p.Cys258_Asp259delinsTer`
 * contains both `del` and `ins` and is neither.
 *
 * Returns null when the string matches no known shape — callers must treat that
 * as a build failure, never as a default clinical class.
 */
export function classFromProteinHgvs(p) {
  if (!p) return null;
  const s = String(p);
  if (/fs/i.test(s)) return "frameshift";
  if (/ext/i.test(s)) return "stop-lost";
  if (/(?:Ter|\*)\d*$/.test(s)) return "nonsense";
  if (/dup|ins/i.test(s)) return "inframe-insertion";
  if (/del/i.test(s)) return "inframe-deletion";
  if (/=$/.test(s)) return "synonymous";
  if (/^p\.(?:[A-Z][a-z]{2}|[A-Z])\d+(?:[A-Z][a-z]{2}|[A-Z])$/.test(s)) return "missense";
  return null;
}

/** Tie-breaker only, for a future feed that stops emitting `locations`. */
export function classFromConsequenceType(ct) {
  const c = String(ct || "").toLowerCase();
  if (c.includes("frameshift")) return "frameshift";
  if (c.includes("stop gained") || c.includes("stop_gained")) return "nonsense";
  if (c.includes("stop lost") || c.includes("stop_lost")) return "stop-lost";
  if (c.includes("inframe deletion") || c === "deletion") return "inframe-deletion";
  if (c.includes("insertion")) return "inframe-insertion";
  if (c.includes("synonymous")) return "synonymous";
  if (c.includes("missense")) return "missense";
  return null;
}

/**
 * The catalog's class for a feature. `locations` first; `consequenceType` and a
 * `*` in `alternativeSequence` only as fallbacks. Never guesses.
 */
export function classifyFeature(feature) {
  const fromHgvs = classFromProteinHgvs(selectProteinHgvs(feature.locations));
  if (fromHgvs) return fromHgvs;
  if (feature.alternativeSequence === "*") return "nonsense";
  return classFromConsequenceType(feature.consequenceType);
}

// ── Clinical significance ───────────────────────────────────────────────────

const SIG_RANK = {
  Pathogenic: "pathogenic",
  "Likely pathogenic": "likely-pathogenic",
  "Variant of uncertain significance": "vus",
  "Likely benign": "likely-benign",
  Benign: "benign",
  "Conflicting interpretations of pathogenicity": "conflicting",
  "Conflicting classifications of pathogenicity": "conflicting",
};

export const SIG_ORDER = [
  "pathogenic",
  "likely-pathogenic",
  "conflicting",
  "vus",
  "likely-benign",
  "benign",
  "unclassified",
];

/**
 * Most severe reported significance. An unrecognized ClinVar vocabulary string
 * throws rather than folding into `unclassified` — silently downgrading a new
 * "Pathogenic, low penetrance" to "no clinical data" is exactly the failure this
 * catalog cannot afford. A vocabulary addition should be a decision, not a diff.
 */
export function mapSignificance(sigs) {
  if (!sigs || !sigs.length) return "unclassified";
  const mapped = sigs.map((s) => {
    const hit = SIG_RANK[s.type];
    if (!hit) throw new Error(`Unrecognized clinicalSignificance type: "${s.type}"`);
    return hit;
  });
  mapped.sort((a, b) => SIG_ORDER.indexOf(a) - SIG_ORDER.indexOf(b));
  return mapped[0];
}

export function moreSevere(a, b) {
  return SIG_ORDER.indexOf(a) <= SIG_ORDER.indexOf(b) ? a : b;
}

// ── Cross-references ────────────────────────────────────────────────────────

export function collectXrefs(feature) {
  const out = [];
  for (const x of feature.xrefs || []) {
    if (x.name && x.id) out.push(`${x.name}:${x.id}`);
  }
  return [...new Set(out)];
}

/**
 * A stable, class-free distinguishing token.
 *
 * NOTE an rsID is position-level, not allele-level: the feed hands
 * `rs559353446` to BOTH `p.S325*` (c.974C>A) and `p.S325L` (c.974C>T). The token
 * alone therefore does NOT identify a variant — callers must combine it with the
 * residue change. Nothing here may embed the consequence class: the id would
 * then change whenever a reclassification lands, breaking every shared deep link.
 */
export function distinctToken(xrefs) {
  const pick = (prefix) => {
    const hit = xrefs.find((x) => x.startsWith(`${prefix}:`));
    return hit ? hit.slice(prefix.length + 1) : null;
  };
  return pick("dbSNP") ?? pick("ClinVar") ?? pick("ClinGen") ?? null;
}

/**
 * Catalog id. Class-free by construction (see distinctToken).
 *
 * Substitutions keep the compact `R102*` form that existing deep links use.
 * Everything else gets `<wt><pos>_<token>`, with the class suffix that used to
 * live here (`fs`/`del`/`ins`) removed.
 */
export function makeId({ wildType, aaPosition, mutatedType, token }) {
  const wt = wildType || "?";
  if (mutatedType && mutatedType.length === 1) return `${wt}${aaPosition}${mutatedType}`;
  return token ? `${wt}${aaPosition}_${token}` : `${wt}${aaPosition}`;
}

// ── CDS edits ───────────────────────────────────────────────────────────────

const SIMPLE_SUB = /^c\.(\d+)([ACGT])>([ACGT])$/;

/** Parse `c.304C>T`. Returns null for anything that is not a single-base substitution. */
export function parseSimpleSub(cNotation) {
  const m = SIMPLE_SUB.exec(String(cNotation || ""));
  if (!m) return null;
  return { cdsStart: Number(m[1]), refBase: m[2], altBase: m[3] };
}

/**
 * A feed-sourced `c.` is only trusted once it is checked against our own CDS:
 * the reference base must match, and applying it must actually produce the
 * residue the feed says it produces. 476/601 SGCE features pass; 0 fail.
 */
export function validateSub(cds, sub, aaPosition, expectedResidue) {
  if (!sub) return false;
  if (sub.cdsStart < 1 || sub.cdsStart > cds.length) return false;
  if (cds[sub.cdsStart - 1] !== sub.refBase) return false;
  if (Math.floor((sub.cdsStart - 1) / 3) + 1 !== aaPosition) return false;
  if (!expectedResidue) return false;
  const mut = cds.slice(0, sub.cdsStart - 1) + sub.altBase + cds.slice(sub.cdsStart);
  return residueAt(mut, aaPosition) === expectedResidue;
}

/**
 * Last resort for the 122 features that carry no `c.` at all: find the
 * single-base change in codon `pos` that yields `targetAA`. Several paths can
 * give the same residue (routine for Leu/Arg/Ser/Gly) — the amino-acid change is
 * then certain but the exact nucleotide is not, which `ambiguous` records.
 */
export function inferSub(cds, pos, targetAA) {
  const start = (pos - 1) * 3;
  const codon = cds.slice(start, start + 3);
  if (codon.length < 3) return null;
  const solutions = [];
  for (let i = 0; i < 3; i++) {
    for (const base of ["A", "C", "G", "T"]) {
      if (base === codon[i]) continue;
      const mut = codon.slice(0, i) + base + codon.slice(i + 1);
      if (CODON_TABLE[mut] === targetAA) {
        solutions.push({ cdsStart: start + i + 1, refBase: codon[i], altBase: base });
      }
    }
  }
  if (!solutions.length) return null;
  return { ...solutions[0], ambiguous: solutions.length > 1 };
}
