import { describe, it, expect } from "vitest";
import { VARIANT_CATALOG, CATALOG_STATS } from "./variant-catalog";
import { deriveConsequence, WT_PROTEIN_LENGTH } from "./codon-data";

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
      expect(v.reportedConsequence).toBeTruthy();
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
    const noEdit = VARIANT_CATALOG.find((v) => !v.edit && v.reportedConsequence === "frameshift");
    if (noEdit) {
      expect(() => deriveConsequence(noEdit)).not.toThrow();
    }
  });

  it("stats are coherent", () => {
    expect(CATALOG_STATS.total).toBe(VARIANT_CATALOG.length);
    expect(CATALOG_STATS.engineReady).toBeGreaterThan(0);
    expect(CATALOG_STATS.pathogenic).toBeGreaterThan(0);
  });

  // The UI credits `fromUniProt` to the feed by name, so it must never include a
  // row the feed did not supply. Exactly one row here is local: the patient's.
  it("fromUniProt excludes the locally-added patient variant", () => {
    expect(CATALOG_STATS.total - CATALOG_STATS.fromUniProt).toBe(1);
    expect(VARIANT_CATALOG.filter((v) => v.isPatient)).toHaveLength(1);
    expect(VARIANT_CATALOG.filter((v) => !v.isPatient).every((v) => v.source === "UniProt")).toBe(
      true,
    );
  });

  it("all ids are unique (distinct variants never collapse into one row)", () => {
    const ids = VARIANT_CATALOG.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no aaPosition exceeds the protein length (stop-lost events dropped)", () => {
    for (const v of VARIANT_CATALOG) {
      expect(v.aaPosition).toBeLessThanOrEqual(WT_PROTEIN_LENGTH);
    }
  });

  it("distinct frameshifts at one residue keep distinct ids", () => {
    // Group frameshift ids by residue; each group must have as many unique ids as entries.
    const byPos = new Map<number, string[]>();
    for (const v of VARIANT_CATALOG.filter((x) => x.reportedConsequence === "frameshift")) {
      const arr = byPos.get(v.aaPosition) ?? [];
      arr.push(v.id);
      byPos.set(v.aaPosition, arr);
    }
    for (const [, ids] of byPos) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
