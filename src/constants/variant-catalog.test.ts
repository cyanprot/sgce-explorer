import { describe, it, expect } from "vitest";
import { VARIANT_CATALOG, CATALOG_STATS } from "./variant-catalog";
import { deriveConsequence } from "./codon-data";

describe("variant-catalog", () => {
  it("has a substantial number of variants", () => {
    expect(VARIANT_CATALOG.length).toBeGreaterThan(500);
  });

  it("leads with the patient index variant", () => {
    expect(VARIANT_CATALOG[0].isPatient).toBe(true);
    expect(VARIANT_CATALOG[0].cNotation).toBe("c.108dup");
  });

  it("every entry has position, consequence and significance", () => {
    for (const v of VARIANT_CATALOG) {
      expect(v.aaPosition).toBeGreaterThan(0);
      expect(v.consequence).toBeTruthy();
      expect(v.significance).toBeTruthy();
    }
  });

  it("engine-ready (edited) variants derive a consequence without throwing", () => {
    const edited = VARIANT_CATALOG.filter((v) => v.edit).slice(0, 50);
    expect(edited.length).toBeGreaterThan(0);
    for (const v of edited) {
      const c = deriveConsequence(v);
      expect(typeof c.mutantProteinLength).toBe("number");
    }
  });

  it("browse-only variants (no edit) still derive a declared consequence", () => {
    const noEdit = VARIANT_CATALOG.find((v) => !v.edit && v.consequence === "frameshift");
    if (noEdit) {
      expect(() => deriveConsequence(noEdit)).not.toThrow();
    }
  });

  it("stats are coherent", () => {
    expect(CATALOG_STATS.total).toBe(VARIANT_CATALOG.length);
    expect(CATALOG_STATS.engineReady).toBeGreaterThan(0);
    expect(CATALOG_STATS.pathogenic).toBeGreaterThan(0);
  });
});
