import { useMemo } from "react";
import type { Variant, ConsequenceClass, ClinicalSignificance } from "@/types";
import { VARIANT_CATALOG } from "@/constants/variant-catalog";

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
      if (consequence !== "all" && v.consequence !== consequence) return false;
      if (significance !== "all" && v.significance !== significance) return false;
      if (q) {
        const hay = `${v.cNotation} ${v.notation} ${v.aaPosition} ${v.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, consequence, significance]);
}
