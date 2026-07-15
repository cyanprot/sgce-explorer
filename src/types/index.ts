export interface ProteinDomain {
  start: number;
  end: number;
  label: string;
  color: string;
}

export type ConsequenceClass =
  | "frameshift"
  | "nonsense"
  | "missense"
  | "synonymous"
  | "inframe-deletion"
  | "inframe-insertion"
  | "large-deletion";

export type ClinicalSignificance =
  | "pathogenic"
  | "likely-pathogenic"
  | "vus"
  | "likely-benign"
  | "benign"
  | "unclassified";

/** Structured edit describing the change in CDS coordinates, consumed by
 *  deriveConsequence(). Kept separate from HGVS strings so the engine never
 *  has to parse notation. All positions are 1-indexed CDS coordinates. */
export interface VariantEdit {
  kind: "dup" | "del" | "ins" | "sub";
  cdsStart: number;
  cdsEnd?: number;   // inclusive; defaults to cdsStart (dup/del ranges)
  insSeq?: string;   // inserted nucleotides (ins)
  altBase?: string;  // replacement base(s) (sub)
}

export interface Variant {
  id: string;                       // stable key (cNotation, ClinVar VCV, or rsID)
  cNotation: string;                // HGVS c. (e.g. "c.108dup")
  notation: string;                 // HGVS p. (e.g. "p.Val37SerfsTer32")
  cdsPosition: number;              // CDS coordinate of the change (1-indexed)
  aaPosition: number;               // first affected amino acid (1-indexed)
  consequence: ConsequenceClass;
  significance: ClinicalSignificance;
  exon?: number;                    // clinical exon (13-exon SGCE gene model)
  edit?: VariantEdit;               // present when the exact CDS change is known
  truncationAt?: number;            // cached PTC codon position; also derivable
  wildType?: string;                // WT amino acid (1-letter)
  mutatedType?: string;             // variant amino acid (1-letter) or "*"
  isPatient?: boolean;              // the DYT-SGCE index variant
  source?: string;                  // "ClinVar", "UniProt", ...
  citation?: string;
  xrefs?: string[];                 // e.g. ["ClinVar:VCV...", "dbSNP:rs..."]
}

/** @deprecated use Variant. Kept as an alias during the migration. */
export type MutationInfo = Variant;

/** Everything deriveConsequence() computes for a variant against the CDS. */
export interface DerivedConsequence {
  truncated: boolean;
  ptcPosition: number | null;       // aa position of the premature stop
  truncatedLength: number | null;   // aa count of the truncated product
  mutantProteinLength: number;      // final protein length (aa)
  novelAaCount: number;             // aberrant residues introduced before the PTC
  fractionOfWT: number;             // mutantProteinLength / PROTEIN_LENGTH
  nmdPredicted: boolean;
}

export interface GlycosylationSite {
  position: number;
  residue: string;
  type: "N-linked" | "O-linked";
}

export interface CentralDogmaStep {
  title: string;
  subtitle: string;
  detail: string;
  mutationNote: string;
}

export interface Codon {
  position: number;       // 1-indexed amino acid position
  nucleotides: string;    // 3-letter codon (e.g. "GTG")
  aminoAcid: string;      // single-letter AA or "*" for stop
  isFrameshifted: boolean;
  isMutationStart: boolean;
  isPTC: boolean;
}

export interface NMDSubStep {
  id: string;
  label: string;
  detail: string;
}

export interface NarrationScript {
  stepIndex: number;
  text: string;
}

export type TabId = "structure" | "variants" | "dogma" | "imprinting" | "research";
export type ViewMode = "wt" | "mutant";
export type AlleleHighlight = "both" | "paternal" | "maternal";
