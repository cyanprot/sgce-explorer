import type { Variant } from "@/types";
import rawCatalog from "@/data/variant-catalog.json";
import { MUTATION } from "./protein-data";

/**
 * Known SGCE variants. The bulk is a build-time snapshot of the UniProt
 * Proteins API (see scripts/fetch-variants.mjs); the patient's index variant
 * is prepended and flagged. Missense/nonsense entries carry an inferred CDS
 * edit so the consequence engine can recompute them; frameshift/indel entries
 * are browse-only (no exact c. change in the source feed).
 */
const imported = rawCatalog as unknown as Variant[];

export const VARIANT_CATALOG: Variant[] = [
  MUTATION,
  // Drop any imported frameshift at the patient's own position to avoid a duplicate marker.
  ...imported.filter(
    (v) => !(v.aaPosition === MUTATION.aaPosition && v.consequence === "frameshift"),
  ),
];

export const CATALOG_STATS = {
  total: VARIANT_CATALOG.length,
  pathogenic: VARIANT_CATALOG.filter(
    (v) => v.significance === "pathogenic" || v.significance === "likely-pathogenic",
  ).length,
  engineReady: VARIANT_CATALOG.filter((v) => v.edit).length,
};
