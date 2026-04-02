export interface ProteinDomain {
  start: number;
  end: number;
  label: string;
  color: string;
}

export interface MutationInfo {
  cdsPosition: number;    // c.108
  aaPosition: number;     // Val37
  truncationAt: number;   // position 68
  notation: string;       // "p.Val37SerfsTer32"
  cNotation: string;      // "c.108dup"
  type: "frameshift";
  exon: number;           // exon 3
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

export type TabId = "structure" | "dogma" | "imprinting";
export type ViewMode = "wt" | "mutant";
export type AlleleHighlight = "both" | "paternal" | "maternal";
