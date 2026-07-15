import type { ClinicalSignificance, ConsequenceClass } from "@/types";
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

/** Vertical tier for the lollipop (severe on top). */
export function significanceTier(s: ClinicalSignificance): number {
  if (s === "pathogenic" || s === "likely-pathogenic") return 0;
  if (s === "vus" || s === "unclassified") return 1;
  return 2;
}
