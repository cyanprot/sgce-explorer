import { useMemo } from "react";
import type { Variant, ConsequenceClass, ClinicalSignificance } from "@/types";
import { VARIANT_CATALOG } from "@/constants/variant-catalog";
import { effectiveClass } from "@/constants/codon-data";

export interface VariantFilter {
  query?: string;
  consequence?: ConsequenceClass | "all";
  significance?: ClinicalSignificance | "all";
}

/** Filtered view over the static SGCE variant catalog. */
export function useVariants(filter: VariantFilter = {}): Variant[] {
  const { query, consequence = "all", significance = "all" } = filter;
  return useMemo(() => {
    const q = query?.trim().toLowerCase();
    return VARIANT_CATALOG.filter((v) => {
      // Filter on the class the row actually DISPLAYS, not the catalog's label —
      // otherwise "Nonsense" misses 8 real stop-gains and returns 1 that is not one.
      if (consequence !== "all" && effectiveClass(v) !== consequence) return false;
      if (significance !== "all" && v.significance !== significance) return false;
      if (q) {
        // Both HGVS forms: a patient pastes `p.Arg102Ter` off their lab report,
        // an existing link carries `p.R102*`. Either must find the variant.
        const hay =
          `${v.cNotation} ${v.notation} ${v.notationShort ?? ""} ${v.aaPosition} ${v.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, consequence, significance]);
}
