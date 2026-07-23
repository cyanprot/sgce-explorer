import type {
  ClinicalSignificance,
  ConsequenceClass,
  DerivedConsequence,
  Variant,
} from "@/types";
import { COLORS } from "./protein-data";

/** Colors + labels shared by the lollipop, list and detail card. */
export const SIG_COLOR: Record<ClinicalSignificance, string> = {
  pathogenic: COLORS.danger,
  "likely-pathogenic": "#f97316",
  vus: COLORS.textDim,
  "likely-benign": "#60a5fa",
  benign: COLORS.success,
  unclassified: COLORS.silenced,
};

export const SIG_LABEL: Record<ClinicalSignificance, string> = {
  pathogenic: "Pathogenic",
  "likely-pathogenic": "Likely pathogenic",
  vus: "VUS",
  "likely-benign": "Likely benign",
  benign: "Benign",
  unclassified: "Unclassified",
};

export const CONSEQUENCE_LABEL: Record<ConsequenceClass, string> = {
  frameshift: "Frameshift",
  nonsense: "Nonsense",
  missense: "Missense",
  synonymous: "Synonymous",
  "inframe-deletion": "In-frame deletion",
  "inframe-insertion": "In-frame insertion",
  "large-deletion": "Large deletion",
};

/**
 * Vertical tier for the lollipop (severe on top).
 *
 * Unknown values land in the middle tier with VUS, never in the benign tier —
 * the fall-through used to reach `return 2`, so anything the map did not
 * recognise was drawn as if it had been assessed and found harmless.
 */
export function significanceTier(s: ClinicalSignificance): number {
  if (s === "pathogenic" || s === "likely-pathogenic") return 0;
  if (s === "likely-benign" || s === "benign") return 2;
  return 1;
}

/** Everything a component needs to name a variant, resolved in one place. */
export interface VariantFacts {
  /** Consequence class to show. Derived from the sequence whenever the exact
   *  CDS change is known; only then does it fall back to the catalog's label. */
  classLabel: string;
  /** Which of the two `classLabel` is, so the UI can attribute it. */
  classEvidence: "computed" | "reported";
  /** Attribution to render beside a class we did not derive ourselves. */
  evidenceNote: string | null;
  /** One sentence on the protein-level outcome — including "unknown". */
  outcome: string;
  /** Short protein-length statement, or null when it cannot be computed. */
  lengthLabel: string | null;
  truncated: boolean;
}

/**
 * Single source of truth for how a variant is described.
 *
 * The Structure tab, the detail card, the list and the lollipop each used to
 * decide this for themselves, reading `variant.consequence` directly. They drifted:
 * the 3D view branched three ways on the available evidence while the detail card
 * branched two, so a variant whose declared class disagreed with its own edit was
 * captioned "Single-residue change; no premature stop. Full-length product" in one
 * place and drawn as a truncated chain in the other. Route every caption through
 * here so they cannot diverge again.
 */
export function describeVariant(v: Variant, derived: DerivedConsequence): VariantFacts {
  const cls = derived.derivedClass ?? v.reportedConsequence;
  const classLabel = CONSEQUENCE_LABEL[cls];
  const truncated = derived.truncated === true;

  if (derived.evidence === "reported") {
    return {
      classLabel,
      classEvidence: "reported",
      evidenceNote: `as reported by ${v.source || "the source database"}`,
      outcome:
        "The exact coding change for this variant is not in the source feed, so the protein " +
        "outcome is not computed here. The class shown is the one reported by the database.",
      lengthLabel: null,
      truncated: false,
    };
  }

  const pct =
    derived.fractionOfWT !== null ? `${(derived.fractionOfWT * 100).toFixed(1)}% of WT` : null;
  const lengthLabel =
    derived.mutantProteinLength !== null ? `${derived.mutantProteinLength} aa` : null;

  if (truncated) {
    const novel =
      derived.novelAaCount && derived.novelAaCount > 0
        ? ` ${derived.novelAaCount} aberrant residues precede it.`
        : "";
    return {
      classLabel,
      classEvidence: "computed",
      evidenceNote: null,
      outcome:
        `Premature stop at codon ${derived.ptcPosition} gives a ${derived.truncatedLength} aa ` +
        `product (${pct}).${novel}`,
      lengthLabel,
      truncated: true,
    };
  }

  return {
    classLabel,
    classEvidence: "computed",
    evidenceNote: null,
    outcome: `No premature stop; translation runs to full length (${lengthLabel}).`,
    lengthLabel,
    truncated: false,
  };
}
