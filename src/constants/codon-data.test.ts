import { describe, it, expect } from "vitest";
import {
  WT_CODONS,
  MUTANT_CODONS,
  NMD_SUB_STEPS,
  NARRATION_SCRIPTS,
  CDS_SEQUENCE,
} from "./codon-data";

describe("codon-data", () => {
  describe("CDS_SEQUENCE", () => {
    it("starts with ATG (start codon)", () => {
      expect(CDS_SEQUENCE.slice(0, 3)).toBe("ATG");
    });

    it("is divisible by 3 (complete codons)", () => {
      expect(CDS_SEQUENCE.length % 3).toBe(0);
    });

    it("contains only valid nucleotides", () => {
      expect(CDS_SEQUENCE).toMatch(/^[ATGC]+$/);
    });

    it("position 108 is the mutation site (0-indexed: 107)", () => {
      // c.108dup = duplication of nucleotide at CDS position 108
      // CDS position 108 is 1-indexed → 0-indexed = 107
      expect(typeof CDS_SEQUENCE[107]).toBe("string");
    });
  });

  describe("WT_CODONS", () => {
    it("codon at position 37 is Val (GTG or GTC or GTA or GTT)", () => {
      const codon37 = WT_CODONS.find((c) => c.position === 37);
      expect(codon37).toBeDefined();
      expect(codon37!.aminoAcid).toBe("V");
      expect(codon37!.isFrameshifted).toBe(false);
      expect(codon37!.isMutationStart).toBe(false);
      expect(codon37!.isPTC).toBe(false);
    });

    it("has no frameshifted codons", () => {
      const frameshifted = WT_CODONS.filter((c) => c.isFrameshifted);
      expect(frameshifted).toHaveLength(0);
    });

    it("has no PTC", () => {
      const ptc = WT_CODONS.filter((c) => c.isPTC);
      expect(ptc).toHaveLength(0);
    });

    it("starts from a position that includes context around mutation", () => {
      // Should include codons before position 37
      const minPos = Math.min(...WT_CODONS.map((c) => c.position));
      expect(minPos).toBeLessThanOrEqual(30);
    });
  });

  describe("MUTANT_CODONS", () => {
    it("frameshift starts at position 37 (mutation start)", () => {
      const codon37 = MUTANT_CODONS.find((c) => c.position === 37);
      expect(codon37).toBeDefined();
      expect(codon37!.isMutationStart).toBe(true);
      expect(codon37!.isFrameshifted).toBe(true);
    });

    it("codons before position 37 are NOT frameshifted", () => {
      const before37 = MUTANT_CODONS.filter((c) => c.position < 37);
      before37.forEach((c) => {
        expect(c.isFrameshifted).toBe(false);
      });
    });

    it("codons 38–67 are frameshifted (aberrant region)", () => {
      const aberrant = MUTANT_CODONS.filter(
        (c) => c.position >= 38 && c.position <= 67
      );
      aberrant.forEach((c) => {
        expect(c.isFrameshifted).toBe(true);
      });
      expect(aberrant.length).toBeGreaterThan(0);
    });

    it("has PTC at position 68", () => {
      const ptc = MUTANT_CODONS.find((c) => c.position === 68);
      expect(ptc).toBeDefined();
      expect(ptc!.isPTC).toBe(true);
      expect(ptc!.aminoAcid).toBe("*");
    });

    it("no codons after position 68", () => {
      const after68 = MUTANT_CODONS.filter((c) => c.position > 68);
      expect(after68).toHaveLength(0);
    });
  });

  describe("NMD_SUB_STEPS", () => {
    it("has 4 sub-steps", () => {
      expect(NMD_SUB_STEPS).toHaveLength(4);
    });

    it("each has id, label, and detail", () => {
      NMD_SUB_STEPS.forEach((s) => {
        expect(s.id).toBeDefined();
        expect(s.label).toBeTruthy();
        expect(s.detail).toBeTruthy();
      });
    });
  });

  describe("NARRATION_SCRIPTS", () => {
    it("has 7 scripts (one per central dogma step)", () => {
      expect(NARRATION_SCRIPTS).toHaveLength(7);
    });

    it("each has stepIndex (0–6) and text", () => {
      NARRATION_SCRIPTS.forEach((s, i) => {
        expect(s.stepIndex).toBe(i);
        expect(s.text.length).toBeGreaterThan(0);
      });
    });
  });
});
