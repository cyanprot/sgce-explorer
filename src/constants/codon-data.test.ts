import { describe, it, expect } from "vitest";
import {
  WT_CODONS,
  MUTANT_CODONS,
  NMD_SUB_STEPS,
  NARRATION_SCRIPTS,
  CDS_SEQUENCE,
  WT_PROTEIN_LENGTH,
  deriveConsequence,
  applyEdit,
  PATIENT_CONSEQUENCE,
} from "./codon-data";
import { MUTATION } from "./protein-data";
import type { Variant, ConsequenceClass } from "@/types";

// Minimal Variant builder for engine tests
function mkVariant(
  consequence: ConsequenceClass,
  aaPosition: number,
  edit: Variant["edit"],
): Variant {
  return {
    id: "test",
    cNotation: "c.test",
    notation: "p.test",
    cdsPosition: edit.cdsStart,
    aaPosition,
    consequence,
    significance: "vus",
    exon: 1,
    edit,
  };
}

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

  describe("CDS is full-length", () => {
    it("is 1314 nt (437 aa + stop)", () => {
      expect(CDS_SEQUENCE.length).toBe(1314);
      expect(WT_PROTEIN_LENGTH).toBe(437);
    });
    it("terminal codon is a stop", () => {
      expect(["TAA", "TAG", "TGA"]).toContain(CDS_SEQUENCE.slice(-3));
    });
  });

  describe("applyEdit", () => {
    it("dup inserts a duplicate of the target nucleotide", () => {
      const mut = applyEdit(CDS_SEQUENCE, { kind: "dup", cdsStart: 108, cdsEnd: 108 });
      expect(mut.length).toBe(CDS_SEQUENCE.length + 1);
      // codon 37 shifts from Val(GTG) to Ser(AGT)
      expect(mut.slice(108, 111)).toBe("AGT");
    });
    it("sub replaces a single base", () => {
      const mut = applyEdit(CDS_SEQUENCE, { kind: "sub", cdsStart: 18, altBase: "A" });
      expect(mut.length).toBe(CDS_SEQUENCE.length);
      expect(mut.slice(15, 18)).toBe("TGA"); // codon 6 -> stop
    });
    it("del removes the target range", () => {
      const mut = applyEdit(CDS_SEQUENCE, { kind: "del", cdsStart: 10, cdsEnd: 12 });
      expect(mut.length).toBe(CDS_SEQUENCE.length - 3);
    });
  });

  describe("deriveConsequence", () => {
    it("patient c.108dup: PTC 68, 67 aa, 31 novel, NMD", () => {
      expect(PATIENT_CONSEQUENCE.truncated).toBe(true);
      expect(PATIENT_CONSEQUENCE.ptcPosition).toBe(68);
      expect(PATIENT_CONSEQUENCE.truncatedLength).toBe(67);
      expect(PATIENT_CONSEQUENCE.novelAaCount).toBe(31);
      expect(PATIENT_CONSEQUENCE.mutantProteinLength).toBe(67);
      expect(PATIENT_CONSEQUENCE.nmdPredicted).toBe(true);
      expect((PATIENT_CONSEQUENCE.fractionOfWT * 100).toFixed(1)).toBe("15.3");
      expect(deriveConsequence(MUTATION)).toEqual(PATIENT_CONSEQUENCE);
    });

    it("nonsense (early stop): truncates, no novel residues", () => {
      const v = mkVariant("nonsense", 6, { kind: "sub", cdsStart: 18, altBase: "A" });
      const c = deriveConsequence(v);
      expect(c.truncated).toBe(true);
      expect(c.ptcPosition).toBe(6);
      expect(c.truncatedLength).toBe(5);
      expect(c.novelAaCount).toBe(0);
      expect(c.nmdPredicted).toBe(true);
    });

    it("missense: not truncated, full length", () => {
      const v = mkVariant("missense", 2, { kind: "sub", cdsStart: 6, altBase: "T" });
      const c = deriveConsequence(v);
      expect(c.truncated).toBe(false);
      expect(c.ptcPosition).toBe(null);
      expect(c.mutantProteinLength).toBe(437);
      expect(c.nmdPredicted).toBe(false);
    });

    it("in-frame deletion: not truncated, one residue shorter", () => {
      const v = mkVariant("inframe-deletion", 4, { kind: "del", cdsStart: 10, cdsEnd: 12 });
      const c = deriveConsequence(v);
      expect(c.truncated).toBe(false);
      expect(c.mutantProteinLength).toBe(436);
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
