import type { Variant, VariantCatalogMeta } from "@/types";
import rawCatalog from "@/data/variant-catalog.json";
import { CDS_SEQUENCE } from "./codon-data";
import { MUTATION } from "./protein-data";

/**
 * Known SGCE variants. The bulk is a build-time snapshot of the UniProt
 * Proteins API (see scripts/fetch-variants.mjs); the patient's index variant
 * is prepended and flagged.
 *
 * Consequence class and HGVS notation come from the feed's own `locations[]`
 * HGVS strings, never from its `consequenceType` label (which contradicts them
 * on 13 features) and never synthesized locally. Entries carry an engine-ready
 * `edit` only when the exact CDS change is known and validates against
 * CDS_SEQUENCE; the rest are `browseOnly` and no numbers are derived for them.
 *
 * The cast is unchecked, as JSON imports always are. The check is
 * src/data/variant-catalog.invariants.test.ts, which runs the assertions the
 * type cannot express — that a row's declared class matches what its edit
 * actually translates to, and that it matches the source feed.
 */
const payload = rawCatalog as unknown as { meta: VariantCatalogMeta; variants: Variant[] };
const imported = payload.variants;

export const CATALOG_META = payload.meta;

/**
 * Every `edit.cdsStart` in the catalog is a coordinate into the CDS the build
 * script scraped out of codon-data.ts. If that sequence changes without a
 * catalog rebuild, all of them silently point at the wrong nucleotide — so fail
 * loudly at import time instead.
 */
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

if (CATALOG_META.cdsChecksum !== fnv1a(CDS_SEQUENCE)) {
  throw new Error(
    `variant-catalog.json was built against a different CDS ` +
      `(catalog ${CATALOG_META.cdsChecksum}, current ${fnv1a(CDS_SEQUENCE)}). ` +
      `Run: npm run fetch-variants`,
  );
}

export const VARIANT_CATALOG: Variant[] = [
  MUTATION,
  // Drop the imported record for the patient's own variant, if the feed carries
  // one, so the list and lollipop show a single marker. Matched on the exact
  // nucleotide change — matching on (position, class) would also swallow a
  // future, genuinely distinct frameshift at codon 37.
  ...imported.filter(
    (v) => !(v.cNotation === MUTATION.cNotation || (v.xrefs ?? []).some((x) => x === MUTATION.id)),
  ),
];

export const CATALOG_STATS = {
  total: VARIANT_CATALOG.length,
  // Kept separate from `total` because the two are not the same provenance and
  // the UI was attributing both to UniProt. The feed carries no record for the
  // patient's c.108dup, so it is prepended here and `total` is one higher than
  // anything UniProt actually published.
  fromUniProt: VARIANT_CATALOG.filter((v) => !v.isPatient).length,
  pathogenic: VARIANT_CATALOG.filter(
    (v) => v.significance === "pathogenic" || v.significance === "likely-pathogenic",
  ).length,
  engineReady: VARIANT_CATALOG.filter((v) => v.edit).length,
};
