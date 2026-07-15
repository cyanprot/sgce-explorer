import { describe, it, expect, beforeEach } from "vitest";
import { useVariantStore } from "./variantStore";
import { MUTATION } from "@/constants/protein-data";
import type { Variant } from "@/types";

const missense: Variant = {
  id: "test-missense",
  cNotation: "c.5C>T",
  notation: "p.Ala2Val",
  cdsPosition: 6,
  aaPosition: 2,
  consequence: "missense",
  significance: "vus",
  exon: 1,
  edit: { kind: "sub", cdsStart: 6, altBase: "T" },
};

describe("variantStore", () => {
  beforeEach(() => {
    useVariantStore.getState().resetToPatient();
  });

  it("defaults to the patient variant with derived consequence", () => {
    const s = useVariantStore.getState();
    expect(s.selected).toBe(MUTATION);
    expect(s.consequence.truncated).toBe(true);
    expect(s.consequence.truncatedLength).toBe(67);
  });

  it("setSelected swaps the variant and recomputes the consequence", () => {
    useVariantStore.getState().setSelected(missense);
    const s = useVariantStore.getState();
    expect(s.selected.id).toBe("test-missense");
    expect(s.consequence.truncated).toBe(false);
    expect(s.consequence.mutantProteinLength).toBe(437);
  });

  it("resetToPatient restores the index variant", () => {
    useVariantStore.getState().setSelected(missense);
    useVariantStore.getState().resetToPatient();
    expect(useVariantStore.getState().selected).toBe(MUTATION);
  });
});
