import type { ProteinDomain, MutationInfo, GlycosylationSite, CentralDogmaStep } from "@/types";

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

// ── Mutation ──
export const MUTATION: MutationInfo = {
  cdsPosition: 108,
  aaPosition: 37,
  truncationAt: 68,
  notation: "p.Val37SerfsTer32",
  cNotation: "c.108dup",
  type: "frameshift",
  exon: 3,
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
export const DGC_PARTNERS = [
  { name: "β-Sarcoglycan",  gene: "SGCB", color: "#06b6d4", uniprot: "Q16585", xOffset: -30 },
  { name: "γ-Sarcoglycan",  gene: "SGCG", color: "#a78bfa", uniprot: "Q13326", xOffset: -10 },
  { name: "δ-Sarcoglycan",  gene: "SGCD", color: "#fb923c", uniprot: "Q92629", xOffset:  30 },
  { name: "Dystrophin",     gene: "DMD",  color: "#f472b6" },
  { name: "Dystroglycan-α", gene: "DAG1", color: "#38bdf8" },
  { name: "Dystroglycan-β", gene: "DAG1", color: "#2dd4bf" },
] as const;

// ε-SG positioning when in DGC complex view
export const SGCE_DGC_OFFSET = 10; // xOffset in Å

// ── Central Dogma Steps ──
export const CENTRAL_DOGMA_STEPS: CentralDogmaStep[] = [
  {
    title: "1. DNA — SGCE Gene (chr7q21.3)",
    subtitle: "13 exons spanning ~81kb genomic region",
    detail: "The SGCE gene encodes ε-sarcoglycan. The mutation c.108dup is a 1bp duplication in exon 3. The gene shares a bidirectional CpG island promoter with PEG10.",
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
    detail: "Transcription produces pre-mRNA containing all 13 exons plus introns. Exon 10 is typically skipped; exon 11b is brain-specific.",
    mutationNote: "The 1bp duplication is faithfully transcribed — the error is now in the RNA",
  },
  {
    title: "4. Splicing → mature mRNA",
    subtitle: "Introns removed, exons joined (brain isoform: +exon 11b)",
    detail: "Spliceosome removes introns. Major transcript skips exon 10. Brain-specific isoform includes exon 11b for pre/post-synaptic localization.",
    mutationNote: "Splicing is unaffected — the frameshift is within exon 3 coding sequence, not at a splice site.",
  },
  {
    title: "5. Translation — Ribosome Reads mRNA",
    subtitle: "80S ribosome synthesizes polypeptide chain",
    detail: "Normal: ribosome reads 1,311 nucleotides (437 codons) → full-length ε-sarcoglycan with signal sequence → ER co-translational insertion.",
    mutationNote: "At codon 37 (Val→Ser): reading frame shifts. 32 aberrant amino acids added before PTC at position 68. Only 15.6% of protein produced.",
  },
  {
    title: "6. mRNA Surveillance — NMD",
    subtitle: "Nonsense-Mediated Decay destroys mutant mRNA",
    detail: "PTC at position 68 (exon 3) is far upstream of the last exon-exon junction. The exon junction complex (EJC) downstream triggers NMD via UPF1/UPF2/UPF3.",
    mutationNote: "PTC in exon 3 with 10+ downstream EJCs → strong NMD trigger. Most mutant mRNA degraded. Any escaped mRNA → 68aa fragment → ER degradation.",
  },
  {
    title: "7. Result — No Functional ε-Sarcoglycan",
    subtitle: "DGC complex lacks ε-SG → myoclonus-dystonia",
    detail: "Without ε-sarcoglycan, the sarcoglycan subcomplex cannot assemble at the neuronal membrane. This disrupts DGC signaling in striatal neurons → DYT-SGCE.",
    mutationNote: "Imprinting (no maternal backup) + frameshift (no paternal protein) = COMPLETE LOSS OF FUNCTION. Gene replacement therapy (AAV-SGCE cDNA) is the logical strategy.",
  },
];
