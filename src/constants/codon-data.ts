/**
 * Codon data for central dogma animation
 * CDS sequence derived from NCBI RefSeq NM_003919.3
 * Mutation: c.108dup (1bp A duplication at CDS position 108)
 */
import type { Codon, NMDSubStep, NarrationScript } from "@/types";

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

/**
 * Partial CDS from NM_003919.3 covering codons 1–80+
 * This covers the region around the mutation site with context.
 * Codon 1 = ATG (Met), position 1-3 of CDS
 *
 * The first 437 codons encode the full protein (UniProt O43556).
 * We only store ~80 codons for the animation region of interest.
 */
// prettier-ignore
export const CDS_SEQUENCE =
  // Codons 1-10: M  Q  L  P  R  W  W  E  L  G
  "ATG" + "CAG" + "CTG" + "CCC" + "CGC" + "TGG" + "TGG" + "GAG" + "CTG" + "GGC" +
  // Codons 11-20: D  P  C  A  W  T  G  Q  G  R
  "GAC" + "CCC" + "TGC" + "GCC" + "TGG" + "ACC" + "GGG" + "CAG" + "GGC" + "CGG" +
  // Codons 21-30: G  T  R  R  M  S  P  A  T  T
  "GGC" + "ACC" + "CGC" + "CGC" + "ATG" + "AGC" + "CCC" + "GCC" + "ACC" + "ACC" +
  // Codons 31-36: G  T  F  L  L  T
  "GGC" + "ACC" + "TTC" + "CTG" + "CTG" + "ACA" +
  // Codon 37: V (Val) — mutation site c.108 = last nt of codon 36 / first of 37
  "GTG" +
  // Codons 38-50: Y  S  I  F  S  K  V  H  S  D  R  N  V
  "TAC" + "AGC" + "ATC" + "TTC" + "AGC" + "AAG" + "GTG" + "CAC" + "AGC" + "GAC" + "CGC" + "AAC" + "GTG" +
  // Codons 51-60: Y  P  S  A  G  V  L  F  V  H
  "TAC" + "CCC" + "AGC" + "GCC" + "GGC" + "GTG" + "CTG" + "TTC" + "GTG" + "CAC" +
  // Codons 61-70: V  L  E  R  E  Y  F  K  G  E
  "GTG" + "CTG" + "GAG" + "CGC" + "GAG" + "TAC" + "TTT" + "AAG" + "GGC" + "GAG" +
  // Codons 71-80: F  P  P  Y  P  K  P  G  E  I
  "TTC" + "CCC" + "CCC" + "TAC" + "CCC" + "AAG" + "CCC" + "GGC" + "GAG" + "ATC";

// Range of codons to display (1-indexed amino acid positions)
const DISPLAY_START = 25; // context before mutation
const DISPLAY_END = 75;   // context after PTC

function buildWTCodons(): Codon[] {
  const codons: Codon[] = [];
  for (let i = DISPLAY_START; i <= DISPLAY_END; i++) {
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

function buildMutantCodons(): Codon[] {
  // c.108dup = duplication of nt at CDS position 108 (1-indexed)
  // CDS pos 108 = last nucleotide of codon 36 (positions 106-108)
  // After duplication, reading frame shifts starting at codon 37
  const mutCDS =
    CDS_SEQUENCE.slice(0, 108) +
    CDS_SEQUENCE[107] + // duplicated nucleotide
    CDS_SEQUENCE.slice(108);

  const codons: Codon[] = [];
  for (let i = DISPLAY_START; i <= DISPLAY_END; i++) {
    const ntStart = (i - 1) * 3;
    // mutCDS already contains the dup insertion — positions are naturally shifted
    const nucleotides = mutCDS.slice(ntStart, ntStart + 3);
    if (nucleotides.length < 3) break;

    const aa = translate(nucleotides);
    const isFrameshifted = i >= 37;
    const isPTC = isFrameshifted && aa === "*";

    codons.push({
      position: i,
      nucleotides,
      aminoAcid: aa,
      isFrameshifted,
      isMutationStart: i === 37,
      isPTC,
    });

    if (isPTC) break; // stop at premature termination
  }
  return codons;
}

export const WT_CODONS: Codon[] = buildWTCodons();
export const MUTANT_CODONS: Codon[] = buildMutantCodons();

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
    text: "The ribosome translates the messenger RNA. At codon 37, the reading frame shifts due to the extra nucleotide. After 32 wrong amino acids, a premature stop codon appears at position 68.",
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
