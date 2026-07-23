import type { ProteinDomain, Variant, GlycosylationSite, CentralDogmaStep } from "@/types";

// ── Color Palette ──
export const COLORS = {
  bg: "#0b0e19",
  panel: "#131826",
  panelBorder: "#1e3555",
  accent: "#60a5fa",
  accentDim: "#1e3a5f",
  danger: "#ef4444",
  dangerDim: "#7f1d1d",
  success: "#34d399",
  warn: "#fbbf24",
  text: "#e2e8f0",
  textDim: "#8aa0bd",
  extracellular: "#3b82f6",
  transmembrane: "#f59e0b",
  cytoplasmic: "#8b5cf6",
  mutant: "#ef4444",
  methylation: "#ef4444",
  active: "#22c55e",
  silenced: "#6b7280",
  overlay: "#000000",
  mrna: "#14b8a6",
  ribosome: "#d946ef",
} as const;

// ── Protein Domains (UniProt O43556) ──
export const PROTEIN_LENGTH = 437;

export const DOMAINS: Record<string, ProteinDomain> = {
  extracellular: { start: 1, end: 317, label: "Extracellular", color: COLORS.extracellular },
  transmembrane: { start: 318, end: 338, label: "Transmembrane", color: COLORS.transmembrane },
  cytoplasmic:   { start: 339, end: 437, label: "Cytoplasmic",   color: COLORS.cytoplasmic },
};

// ── Mutation (patient index variant) ──
export const MUTATION: Variant = {
  id: "c.108dup",
  cdsPosition: 108,
  aaPosition: 37,
  truncationAt: 68,
  notation: "p.Val37SerfsTer32",
  cNotation: "c.108dup",
  reportedConsequence: "frameshift",
  significance: "pathogenic",
  exon: 3,
  edit: { kind: "dup", cdsStart: 108, cdsEnd: 108 },
  wildType: "V",
  mutatedType: "S",
  isPatient: true,
  source: "patient (DYT-SGCE)",
};

// ── Post-translational modifications ──
export const GLYCOSYLATION_SITES: GlycosylationSite[] = [
  { position: 200, residue: "Asn", type: "N-linked" },
];

// ── Full amino acid sequence (UniProt O43556) ──
export const SEQUENCE =
  "MQLPRWWELGDPCAWTGQGRGTRRMSPATTGTFLLTVYSIFSKVHSDRNVYPSAGVLFVH" +
  "VLEREYFKGEFPPYPKPGEISNDPITFNTNLMGYPDRPGWLRYIQRTPYSDGVLYGSPTA" +
  "ENVGKPTIIEITAYNRRTFETARHNLIINIMSAEDFPLPYQAEFFIKNMNVEEMLASEVL" +
  "GDFLGAVKNVWQPERLNAINITSALDRGGRVPLPINDLKEGVYVMVGADVPFSSCLREVE" +
  "NPQNQLRCSQEMEPVITCDKKFRTQFYIDWCKISLVDKTKQVSTYQEVIRGEGILPDGGE" +
  "YKPPSDSLKSRDYYTDFLITLAVPSAVALVLFLILAYIMCCRREGVEKRNMQTPDIQLVH" +
  "HSAIQKSTKELRDMSKNREIAWPLSTLPVFHPVTGEIIPPLHTDNYDSTNMPLMQTQQNL" +
  "PHQTQIPQQQTTGKWYP";

// ── DGC Complex Partners ──
//
// The BRAIN complex, which is the tissue this whole site is about. Waite et al.
// 2016 (PMID 27535350) purified ε-sarcoglycan directly from brain and found it
// copurifies with "β-, δ-, and ζ-sarcoglycan, β-dystroglycan, and dystrophin
// Dp71".
//
// This list previously described the MUSCLE complex: γ-sarcoglycan instead of
// ζ, generic full-length dystrophin instead of the Dp71 isoform, and α-
// dystroglycan, which is not among the brain copurifying partners. γ-SG belongs
// to the limb-girdle muscular dystrophy complex — the contrast the paper is
// about, not the complex ε-SG sits in here.
export const DGC_PARTNERS = [
  { name: "β-Sarcoglycan",  gene: "SGCB", color: "#06b6d4", uniprot: "Q16585", xOffset: -30 },
  { name: "ζ-Sarcoglycan",  gene: "SGCZ", color: "#a78bfa", uniprot: "Q96LD1", xOffset: -10 },
  { name: "δ-Sarcoglycan",  gene: "SGCD", color: "#fb923c", uniprot: "Q92629", xOffset:  30 },
  // No uniprot => not fetched as a structure, shown in the legend only.
  { name: "Dystrophin Dp71", gene: "DMD",  color: "#f472b6" },
  { name: "Dystroglycan-β",  gene: "DAG1", color: "#2dd4bf" },
] as const;

/** Source for the brain complex composition above. */
export const DGC_CITATION = {
  pmid: "27535350",
  text: "Waite AJ et al., Mov Disord 2016;31(11):1694-1703 — ε-sarcoglycan is part of the dystrophin-associated protein complex in brain",
} as const;

// ε-SG positioning when in DGC complex view
export const SGCE_DGC_OFFSET = 10; // xOffset in Å

// ── Central Dogma Steps ──
export const CENTRAL_DOGMA_STEPS: CentralDogmaStep[] = [
  {
    title: "1. DNA — SGCE Gene (chr7q21.3)",
    subtitle: "12 coding exons in the clinical gene model",
    detail: "The SGCE gene encodes ε-sarcoglycan. The mutation c.108dup is a 1bp duplication in exon 3 of the clinical (variant-reporting) numbering; the RefSeq transcript NM_003919.3 used elsewhere in this app has 11 exons, so exon numbers differ between the two models. The gene shares a bidirectional CpG island promoter with PEG10.",
    mutationNote: "c.108dup: adenine insertion at position 108 of CDS → reading frame shift from this point forward",
  },
  {
    title: "2. Imprinting — Maternal Silencing",
    subtitle: "Only the paternal allele is expressed",
    detail: "The shared PEG10-SGCE CpG island is methylated on the maternal allele (H3K9me3, H4K20me3). The paternal allele is unmethylated and active (H3K4me2, H3K9ac). Only ONE copy of SGCE is ever expressed.",
    mutationNote: "Paternal allele carries c.108dup. Maternal allele is permanently silenced → no backup copy → complete loss of function",
  },
  {
    title: "3. Transcription → pre-mRNA",
    subtitle: "RNA Pol II transcribes paternal allele only",
    detail: "Transcription produces pre-mRNA containing all exons plus introns. Alternative exons give several isoforms, including a brain-specific one (see step 4).",
    mutationNote: "The 1bp duplication is faithfully transcribed — the error is now in the RNA",
  },
  {
    title: "4. Splicing → mature mRNA",
    subtitle: "Introns removed, exons joined (brain isoform: +exon 11b)",
    detail: "Spliceosome removes introns. A brain-specific isoform includes exon 11b, replacing the last four residues of the canonical protein (UniProt O43556-3, PMID 15193417). Yokoi et al. (PMID 27890709) report the major isoform as predominantly post-synaptic and the brain isoform as pre-synaptic; no animal model yet establishes which isoform drives the DYT11 phenotype.",
    mutationNote: "Splicing is unaffected — the frameshift is within exon 3 coding sequence, not at a splice site.",
  },
  {
    title: "5. Translation — Ribosome Reads mRNA",
    subtitle: "80S ribosome synthesizes polypeptide chain",
    detail: "Normal: ribosome reads 1,311 coding nucleotides (437 codons, plus the stop codon = 1,314 nt of CDS) → full-length ε-sarcoglycan → ER co-translational insertion. UniProt annotates no cleavable signal peptide; membrane targeting uses an uncleaved signal anchor.",
    mutationNote: "At codon 37 (Val→Ser): reading frame shifts. 31 aberrant amino acids added before PTC at position 68. Only 15.3% of protein produced.",
  },
  {
    title: "6. mRNA Surveillance — NMD",
    subtitle: "Nonsense-Mediated Decay destroys mutant mRNA",
    detail: "The PTC at codon 68 sits 1,096 nt upstream of the last exon-exon junction — far beyond the 50-55 nt rule. The exon junction complexes (EJC) downstream trigger NMD via UPF1/UPF2/UPF3.",
    mutationNote: "PTC at codon 68 with 9 downstream exon-exon junctions (NM_003919.3) → strong NMD trigger. Most mutant mRNA degraded. Any escaped mRNA → 67aa fragment → ER degradation.",
  },
  {
    title: "7. Result — No Functional ε-Sarcoglycan",
    subtitle: "DGC complex lacks ε-SG → myoclonus-dystonia",
    detail: "Without ε-sarcoglycan, the sarcoglycan subcomplex cannot assemble properly. How this produces myoclonus-dystonia is not fully established — a leading hypothesis is disrupted DGC-related signaling in striatal neurons.",
    mutationNote: "Imprinting (no maternal backup) + frameshift (no paternal protein) = COMPLETE LOSS OF FUNCTION. Gene replacement therapy (AAV-SGCE cDNA) is the logical strategy.",
  },
];
