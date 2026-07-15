/**
 * Codon data + consequence engine for the central-dogma view.
 * CDS: full coding sequence of NCBI RefSeq NM_003919.3 (epsilon-sarcoglycan,
 * NP_003910.1, 437 aa + stop = 1314 nt). Verified 2026-07-15.
 *
 * deriveConsequence() translates the mutant CDS for ANY structured variant edit
 * and reports truncation / novel-residue / NMD outcomes, so the app is no longer
 * hardcoded to the patient's c.108dup.
 */
import type {
  Codon,
  NMDSubStep,
  NarrationScript,
  Variant,
  DerivedConsequence,
} from "@/types";
import { MUTATION } from "@/constants/protein-data";

// Genetic code table
const CODON_TABLE: Record<string, string> = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L",
  CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M",
  GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S",
  CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T",
  GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
  CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K",
  GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W",
  CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R",
  GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

function translate(codon: string): string {
  return CODON_TABLE[codon] ?? "?";
}

// Full CDS of NM_003919.3 (1314 nt incl. terminal stop codon).
// prettier-ignore
export const CDS_SEQUENCE =
  "ATGCAATTGCCCCGGTGGTGGGAGCTGGGAGACCCCTGTGCTTGGACGGGACAGGGTCGG" +
  "GGGACACGCAGGATGAGCCCCGCGACCACTGGCACATTCTTGCTGACAGTGTACAGTATT" +
  "TTCTCCAAGGTACACTCCGATCGGAATGTATACCCATCAGCAGGTGTCCTCTTTGTTCAT" +
  "GTTTTGGAAAGAGAATATTTTAAGGGGGAATTTCCACCTTACCCAAAACCTGGCGAGATT" +
  "AGTAATGATCCCATAACATTTAATACAAATTTAATGGGTTACCCAGACCGACCTGGATGG" +
  "CTTCGATATATCCAAAGGACACCATATAGTGATGGAGTCCTATATGGGTCCCCAACAGCT" +
  "GAAAATGTGGGGAAGCCAACAATCATTGAGATAACTGCCTACAACAGGCGCACCTTTGAG" +
  "ACTGCAAGGCATAATTTGATAATTAATATAATGTCTGCAGAAGACTTCCCGTTGCCATAT" +
  "CAAGCAGAATTCTTCATTAAGAATATGAATGTAGAAGAAATGTTGGCCAGTGAGGTTCTT" +
  "GGAGACTTTCTTGGCGCAGTGAAAAATGTGTGGCAGCCAGAGCGCCTGAACGCCATAAAC" +
  "ATCACATCGGCCCTAGACAGGGGTGGCAGGGTGCCACTTCCCATTAATGACCTGAAGGAG" +
  "GGCGTTTATGTCATGGTTGGTGCAGATGTCCCGTTTTCTTCTTGTTTACGAGAAGTTGAA" +
  "AATCCACAGAATCAATTGAGATGTAGTCAAGAAATGGAGCCTGTAATAACATGTGATAAA" +
  "AAATTTCGTACTCAATTTTACATTGACTGGTGCAAAATTTCATTGGTTGATAAAACAAAG" +
  "CAAGTGTCCACCTATCAGGAAGTGATTCGTGGAGAGGGGATTTTACCTGATGGTGGAGAA" +
  "TACAAACCCCCTTCTGATTCTTTGAAAAGCAGAGACTATTACACGGATTTCCTAATTACA" +
  "CTGGCTGTGCCCTCGGCAGTGGCACTGGTCCTTTTTCTAATACTTGCTTATATCATGTGC" +
  "TGCCGACGGGAAGGCGTGGAAAAGAGAAACATGCAAACACCAGACATCCAACTGGTCCAT" +
  "CACAGTGCTATTCAGAAATCTACCAAGGAGCTTCGAGACATGTCCAAGAATAGAGAGATA" +
  "GCATGGCCCCTGTCAACGCTTCCTGTGTTCCACCCTGTGACTGGGGAAATCATACCTCCT" +
  "TTACACACAGACAACTATGATAGCACAAACATGCCATTGATGCAAACGCAGCAGAACTTG" +
  "CCACATCAGACTCAGATTCCCCAACAGCAGACTACAGGTAAATGGTATCCCTGA";

/** Wild-type protein length in amino acids (excludes the terminal stop). */
export const WT_PROTEIN_LENGTH = CDS_SEQUENCE.length / 3 - 1; // 437

/**
 * Exon boundaries of NM_003919.3 in CDS coordinates.
 * NOTE: this RefSeq transcript has 11 exons; the *clinical* SGCE annotation
 * uses a 13-exon gene model (where c.108dup is reported in "exon 3"). The
 * Variant.exon field carries the clinical number; this map is used only for
 * NMD junction geometry.
 */
export const EXON_MAP_CDS: { exon: number; cdsStart: number; cdsEnd: number }[] = [
  { exon: 1, cdsStart: 1, cdsEnd: 109 },
  { exon: 2, cdsStart: 110, cdsEnd: 232 },
  { exon: 3, cdsStart: 233, cdsEnd: 390 },
  { exon: 4, cdsStart: 391, cdsEnd: 463 },
  { exon: 5, cdsStart: 464, cdsEnd: 662 },
  { exon: 6, cdsStart: 663, cdsEnd: 825 },
  { exon: 7, cdsStart: 826, cdsEnd: 1037 },
  { exon: 8, cdsStart: 1038, cdsEnd: 1064 },
  { exon: 9, cdsStart: 1065, cdsEnd: 1253 },
  { exon: 10, cdsStart: 1254, cdsEnd: 1297 },
  { exon: 11, cdsStart: 1298, cdsEnd: 1314 },
];

// Last exon-exon junction (CDS nt of the final splice boundary).
const LAST_JUNCTION_CDS = EXON_MAP_CDS[EXON_MAP_CDS.length - 1].cdsStart - 1; // 1297
// EJC deposits ~20-24 nt upstream of a junction; the 50-55 nt rule is standard.
const NMD_DISTANCE_RULE = 50;

/** Apply a structured variant edit to the CDS, returning the mutant CDS. */
export function applyEdit(cds: string, edit: Variant["edit"]): string {
  const { kind, cdsStart, cdsEnd = cdsStart, insSeq = "", altBase = "" } = edit;
  const s = cdsStart - 1; // 0-indexed start
  const e = cdsEnd;       // slice-exclusive end == inclusive 1-indexed cdsEnd
  switch (kind) {
    case "dup":
      return cds.slice(0, e) + cds.slice(s, e) + cds.slice(e);
    case "del":
      return cds.slice(0, s) + cds.slice(e);
    case "ins":
      return cds.slice(0, cdsStart) + insSeq + cds.slice(cdsStart);
    case "sub":
      return cds.slice(0, s) + altBase + cds.slice(s + altBase.length);
    default:
      return cds;
  }
}

function firstStopCodon(seq: string): number | null {
  for (let i = 0; i + 3 <= seq.length; i += 3) {
    if (translate(seq.slice(i, i + 3)) === "*") return i / 3 + 1;
  }
  return null;
}

/**
 * Translate the mutant CDS for a variant and report the consequence.
 * Works for frameshift, nonsense, missense, in-frame indels and synonymous.
 */
export function deriveConsequence(
  variant: Variant,
  cds: string = CDS_SEQUENCE,
): DerivedConsequence {
  const mut = applyEdit(cds, variant.edit);
  const normalStopCodon = cds.length / 3; // 438
  const stop = firstStopCodon(mut);
  // Only frameshift/nonsense truncate. In-frame indels shift the natural stop
  // without producing a PTC, so comparing against the WT stop codon would
  // misflag them — gate truncation on the consequence class instead.
  const isTruncatingClass =
    variant.consequence === "frameshift" || variant.consequence === "nonsense";
  const truncated =
    isTruncatingClass && stop !== null && stop < normalStopCodon;
  const ptcPosition = truncated ? (stop as number) : null;
  const truncatedLength = truncated ? (stop as number) - 1 : null;
  // Protein length = codons translated before the first stop.
  const mutantProteinLength = truncated
    ? (truncatedLength as number)
    : stop !== null
      ? stop - 1
      : Math.floor(mut.length / 3);
  const novelAaCount =
    variant.consequence === "frameshift" && truncated
      ? (ptcPosition as number) - variant.aaPosition
      : 0;
  const ptcNt = truncated ? ((ptcPosition as number) - 1) * 3 + 1 : Infinity;
  const nmdPredicted = truncated && ptcNt < LAST_JUNCTION_CDS - NMD_DISTANCE_RULE;
  return {
    truncated,
    ptcPosition,
    truncatedLength,
    mutantProteinLength,
    novelAaCount,
    fractionOfWT: mutantProteinLength / WT_PROTEIN_LENGTH,
    nmdPredicted,
  };
}

// Range of codons to display (1-indexed amino acid positions)
const DISPLAY_START = 25; // context before mutation
const DISPLAY_END = 75;   // context after PTC

export function buildWTCodons(start = DISPLAY_START, end = DISPLAY_END): Codon[] {
  const codons: Codon[] = [];
  for (let i = start; i <= end; i++) {
    const ntStart = (i - 1) * 3;
    const nucleotides = CDS_SEQUENCE.slice(ntStart, ntStart + 3);
    if (nucleotides.length < 3) break;
    codons.push({
      position: i,
      nucleotides,
      aminoAcid: translate(nucleotides),
      isFrameshifted: false,
      isMutationStart: false,
      isPTC: false,
    });
  }
  return codons;
}

/** Mutant codon strip for a variant across the display window (stops at PTC). */
export function buildMutantCodons(
  variant: Variant,
  start = DISPLAY_START,
  end = DISPLAY_END,
): Codon[] {
  const mut = applyEdit(CDS_SEQUENCE, variant.edit);
  const fsCodon = variant.aaPosition;
  const isFs = variant.consequence === "frameshift";
  const codons: Codon[] = [];
  for (let i = start; i <= end; i++) {
    const ntStart = (i - 1) * 3;
    const nucleotides = mut.slice(ntStart, ntStart + 3);
    if (nucleotides.length < 3) break;
    const aa = translate(nucleotides);
    const isPTC = aa === "*" && i >= fsCodon;
    codons.push({
      position: i,
      nucleotides,
      aminoAcid: aa,
      isFrameshifted: isFs && i >= fsCodon,
      isMutationStart: i === fsCodon,
      isPTC,
    });
    if (isPTC) break; // stop at premature termination
  }
  return codons;
}

export const WT_CODONS: Codon[] = buildWTCodons();
export const MUTANT_CODONS: Codon[] = buildMutantCodons(MUTATION);

/** Derived consequence of the patient's index variant (c.108dup). */
export const PATIENT_CONSEQUENCE: DerivedConsequence = deriveConsequence(MUTATION);

// ── NMD Sub-steps ──
export const NMD_SUB_STEPS: NMDSubStep[] = [
  {
    id: "ptc-recognition",
    label: "PTC Recognition",
    detail:
      "Ribosome encounters premature stop codon at position 68 in exon 3. Downstream exon-exon junctions still carry EJC complexes.",
  },
  {
    id: "upf1-recruitment",
    label: "UPF1 Recruitment",
    detail:
      "Release factors eRF1/eRF3 recruit UPF1 to the ribosome. UPF1 interacts with downstream EJC-bound UPF2/UPF3B, confirming the PTC is premature.",
  },
  {
    id: "upf1-phosphorylation",
    label: "UPF1 Phosphorylation",
    detail:
      "SMG1 kinase phosphorylates UPF1, triggering recruitment of SMG5/SMG6/SMG7 decay factors.",
  },
  {
    id: "mrna-degradation",
    label: "mRNA Degradation",
    detail:
      "SMG6 endonuclease cleaves the mRNA near the PTC. 5'→3' (XRN1) and 3'→5' (exosome) exonucleases degrade the fragments. Mutant mRNA is eliminated.",
  },
];

// ── Narration Scripts (one per central dogma step) ──
export const NARRATION_SCRIPTS: NarrationScript[] = [
  {
    stepIndex: 0,
    text: "The SGCE gene is located on chromosome 7. It contains 13 exons spanning about 81 kilobases. Our patient has a one base-pair duplication at position 108 of the coding sequence, in exon 3.",
  },
  {
    stepIndex: 1,
    text: "SGCE is maternally imprinted. The maternal copy is silenced by DNA methylation. Only the paternal allele is expressed. Unfortunately, the paternal allele carries the c.108dup mutation.",
  },
  {
    stepIndex: 2,
    text: "RNA polymerase two transcribes only the paternal allele, producing pre-messenger RNA. The one base-pair duplication is faithfully copied from DNA to RNA.",
  },
  {
    stepIndex: 3,
    text: "The spliceosome removes introns and joins exons. Splicing is normal because the mutation is in the coding region of exon 3, not at a splice site.",
  },
  {
    stepIndex: 4,
    text: "The ribosome translates the messenger RNA. At codon 37, the reading frame shifts due to the extra nucleotide. After 31 wrong amino acids, a premature stop codon appears at position 68.",
  },
  {
    stepIndex: 5,
    text: "The premature stop codon in exon 3 triggers nonsense-mediated decay. UPF1 recognizes downstream exon junction complexes and marks the messenger RNA for destruction.",
  },
  {
    stepIndex: 6,
    text: "The result is complete loss of epsilon-sarcoglycan. No functional protein is produced. The dystrophin-glycoprotein complex cannot assemble properly in the brain, causing myoclonus-dystonia.",
  },
];
