/**
 * Build the SGCE variant catalog from the UniProt Proteins API (no auth).
 * Source: https://www.ebi.ac.uk/proteins/api/variation/O43556
 *
 * UniProt variation positions are numbered against the O43556 canonical
 * sequence, which is identical to the app's SEQUENCE / NM_003919.3 CDS
 * translation (verified), so protein positions map directly onto our codons.
 *
 * For missense / nonsense / synonymous we infer the exact single-base CDS
 * edit against the local CDS, so the consequence engine can recompute them.
 * Frameshift / indels are catalogued for browse + lollipop but carry no edit
 * (their exact c. change isn't in the protein-level feed).
 *
 * Run: npm run fetch-variants
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "variant-catalog.json");
const UNIPROT = "https://www.ebi.ac.uk/proteins/api/variation/O43556";

const CODON_TABLE = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L", CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M", GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S", CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T", GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*", CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K", GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W", CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R", GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

function readCDS() {
  const src = readFileSync(join(ROOT, "src", "constants", "codon-data.ts"), "utf8");
  const block = src.match(/CDS_SEQUENCE\s*=\s*([\s\S]*?);/)[1];
  return (block.match(/"[ATGC]+"/g) || []).map((s) => s.slice(1, -1)).join("");
}

const CDS = readCDS();

// Infer the single-base substitution in codon `pos` (1-indexed aa) that yields
// `targetAA`. Returns { cdsStart, refBase, altBase } or null.
function inferSub(pos, targetAA) {
  const start = (pos - 1) * 3;
  const codon = CDS.slice(start, start + 3);
  if (codon.length < 3) return null;
  for (let i = 0; i < 3; i++) {
    for (const base of ["A", "C", "G", "T"]) {
      if (base === codon[i]) continue;
      const mut = codon.slice(0, i) + base + codon.slice(i + 1);
      if (CODON_TABLE[mut] === targetAA) {
        return { cdsStart: start + i + 1, refBase: codon[i], altBase: base };
      }
    }
  }
  return null;
}

const SIG_RANK = {
  Pathogenic: "pathogenic",
  "Likely pathogenic": "likely-pathogenic",
  "Variant of uncertain significance": "vus",
  "Likely benign": "likely-benign",
  Benign: "benign",
};
const SIG_ORDER = ["pathogenic", "likely-pathogenic", "vus", "likely-benign", "benign", "unclassified"];

function mapSignificance(sigs) {
  if (!sigs || !sigs.length) return "unclassified";
  const mapped = sigs.map((s) => SIG_RANK[s.type] || "unclassified");
  mapped.sort((a, b) => SIG_ORDER.indexOf(a) - SIG_ORDER.indexOf(b));
  return mapped[0];
}

function mapConsequence(ct) {
  const c = (ct || "").toLowerCase();
  if (c.includes("missense")) return "missense";
  if (c.includes("frameshift")) return "frameshift";
  if (c.includes("stop gained") || c.includes("stop_gained")) return "nonsense";
  if (c.includes("inframe deletion") || c === "deletion") return "inframe-deletion";
  if (c.includes("insertion")) return "inframe-insertion";
  if (c.includes("synonymous")) return "synonymous";
  return "missense";
}

function collectXrefs(feature) {
  const out = [];
  for (const x of feature.xrefs || []) {
    if (x.name && x.id) out.push(`${x.name}:${x.id}`);
  }
  return out;
}

const res = await fetch(UNIPROT, { headers: { Accept: "application/json" } });
if (!res.ok) throw new Error(`UniProt ${res.status}`);
const data = await res.json();
const features = data.features || [];

const catalog = [];
let withEdit = 0;
for (const f of features) {
  const pos = Number(f.begin);
  if (!pos || f.begin !== f.end) continue; // single-residue events only
  const wt = f.wildType || "";
  const mut = f.alternativeSequence || f.mutatedType || "";
  const consequence = mapConsequence(f.consequenceType);
  const significance = mapSignificance(f.clinicalSignificances);

  let edit;
  if ((consequence === "missense" || consequence === "nonsense" || consequence === "synonymous") && mut) {
    const inferred = inferSub(pos, mut);
    if (inferred) {
      edit = { kind: "sub", cdsStart: inferred.cdsStart, altBase: inferred.altBase };
      withEdit++;
    }
  }

  const xrefs = collectXrefs(f);
  const pNotation = wt && mut ? `p.${wt}${pos}${mut}` : `p.?${pos}`;
  catalog.push({
    id: xrefs.find((x) => x.startsWith("dbSNP:")) || `${wt}${pos}${mut}`,
    cNotation: edit ? `c.${edit.cdsStart}${CDS[edit.cdsStart - 1]}>${edit.altBase}` : "",
    notation: pNotation,
    cdsPosition: edit ? edit.cdsStart : (pos - 1) * 3 + 1,
    aaPosition: pos,
    consequence,
    significance,
    wildType: wt,
    mutatedType: mut,
    ...(edit ? { edit } : {}),
    source: "UniProt",
    ...(xrefs.length ? { xrefs } : {}),
  });
}

// Sort by position, then significance severity
catalog.sort(
  (a, b) => a.aaPosition - b.aaPosition || SIG_ORDER.indexOf(a.significance) - SIG_ORDER.indexOf(b.significance),
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");

const byClass = {};
const bySig = {};
for (const v of catalog) {
  byClass[v.consequence] = (byClass[v.consequence] || 0) + 1;
  bySig[v.significance] = (bySig[v.significance] || 0) + 1;
}
console.log(`Wrote ${catalog.length} variants -> ${OUT}`);
console.log(`  with engine-ready edit: ${withEdit}`);
console.log(`  by class:`, byClass);
console.log(`  by significance:`, bySig);
