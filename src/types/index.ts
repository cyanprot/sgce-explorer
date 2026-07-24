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

/** Where a variant's `c.` notation came from — the difference between a string
 *  a database reports and one this repo computed. Absent means neither: the
 *  exact nucleotide change is not known and the entry is browse-only. */
export type CNotationSource = "Ensembl" | "inferred";

export interface Variant {
  id: string;                       // stable key (cNotation, ClinVar VCV, or rsID)
  cNotation: string;                // HGVS c. (e.g. "c.108dup"); "" when unknown
  notation: string;                 // HGVS p., 3-letter (e.g. "p.Val37SerfsTer32")
  notationShort?: string;           // HGVS p., 1-letter (e.g. "p.R102*")
  cdsPosition: number;              // CDS coordinate of the change (1-indexed)
  aaPosition: number;               // first affected amino acid (1-indexed)
  /**
   * The consequence class as REPORTED by the source database. This is a third
   * party's label, not a coordinate, and it has been wrong: UniProt types
   * p.Arg102Ter as "missense" and p.Ile289SerfsTer4 as "stop gained".
   *
   * Do not render or filter on this directly — call `effectiveClass(variant)`
   * from `@/constants/codon-data`, which recomputes from the sequence whenever
   * the exact CDS change is known and only falls back to this field otherwise.
   */
  reportedConsequence: ConsequenceClass;
  significance: ClinicalSignificance;
  exon?: number;                    // clinical exon (13-exon SGCE gene model)
  edit?: VariantEdit;               // present when the exact CDS change is known
  truncationAt?: number;            // cached PTC codon position; also derivable
  wildType?: string;                // WT amino acid (1-letter)
  mutatedType?: string;             // variant amino acid (1-letter) or "*"
  cSource?: CNotationSource;        // provenance of cNotation/edit
  cAmbiguous?: boolean;             // several nucleotide paths give this residue
  browseOnly?: boolean;             // no exact CDS change: nothing may be computed
  isPatient?: boolean;              // the DYT-SGCE index variant
  source?: string;                  // "ClinVar", "UniProt", ...
  citation?: string;
  xrefs?: string[];                 // e.g. ["ClinVar:VCV...", "dbSNP:rs..."]
}

/** Provenance envelope written alongside the catalog by scripts/fetch-variants.mjs. */
export interface VariantCatalogMeta {
  generatedAt: string;
  source: string;
  transcript: string;
  cdsChecksum: string;
  cdsLength: number;
  featureCount: number;
  recordCount: number;
  engineReady: number;
  dropped: Record<string, number>;
}

/** @deprecated use Variant. Kept as an alias during the migration. */
export type MutationInfo = Variant;

/**
 * Everything deriveConsequence() computes for a variant against the CDS.
 *
 * EVERY verdict is nullable, and null means "not known", never "no". A catalog
 * entry without an exact CDS change (`browseOnly`) cannot have its protein
 * length, PTC or NMD outcome computed — this type used to report 437 aa / 100%
 * of WT / no NMD for 58 pathogenic frameshifts, which reads as a reassuring
 * result rather than an absent one. Consumers must narrow before rendering a
 * number; `evidence` says which case they are in.
 */
export interface DerivedConsequence {
  evidence: "computed" | "reported";
  /** The class the mutant sequence actually produces. Null when `evidence` is
   *  "reported" — there is no sequence to read it off. This, not
   *  `Variant.consequence`, is what the UI must display when it is available:
   *  the catalog's class is a third party's label and has been wrong. */
  derivedClass: ConsequenceClass | null;
  truncated: boolean | null;
  ptcPosition: number | null;       // aa position of the premature stop
  truncatedLength: number | null;   // aa count of the truncated product
  mutantProteinLength: number | null; // final protein length (aa)
  novelAaCount: number | null;      // aberrant residues introduced before the PTC
  fractionOfWT: number | null;      // mutantProteinLength / PROTEIN_LENGTH
  nmdPredicted: boolean | null;
  ptcExon: number | null;           // exon containing the PTC (transcript model)
  downstreamJunctions: number | null; // exon-exon junctions after the PTC
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
