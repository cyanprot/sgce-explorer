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
    cdsPosition: edit?.cdsStart ?? 0,
    aaPosition,
    reportedConsequence: consequence,
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
      expect(PATIENT_CONSEQUENCE.evidence).toBe("computed");
      expect(PATIENT_CONSEQUENCE.derivedClass).toBe("frameshift");
      expect(((PATIENT_CONSEQUENCE.fractionOfWT ?? 0) * 100).toFixed(1)).toBe("15.3");
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

    it("browse-only frameshift (no edit): reports nothing rather than a full-length placeholder", () => {
      // A catalogued frameshift with no exact CDS edit cannot have its PTC
      // computed. The engine must not answer the question it cannot answer:
      // this used to return mutantProteinLength 437 / fractionOfWT 1 /
      // nmdPredicted false for 58 pathogenic frameshifts, which reads as
      // "full-length protein, no NMD" — a reassuring result, and a fabricated
      // one. Null is the only honest value.
      const c = deriveConsequence(mkVariant("frameshift", 300, undefined));
      expect(c.evidence).toBe("reported");
      expect(c.derivedClass).toBe(null);
      expect(c.truncated).toBe(null);
      expect(c.ptcPosition).toBe(null);
      expect(c.mutantProteinLength).toBe(null);
      expect(c.fractionOfWT).toBe(null);
      expect(c.nmdPredicted).toBe(null);
    });

    it("a mislabelled stop-gain still truncates: the sequence overrules the catalog", () => {
      // The bug this whole pass exists for. UniProt ships c.304C>T (p.Arg102Ter)
      // typed `consequenceType: "missense"`, and the engine used to gate
      // truncation on that label — finding the stop at codon 102 and discarding
      // it, while still reporting a 101 aa product.
      const v = mkVariant("missense", 102, { kind: "sub", cdsStart: 304, altBase: "T" });
      const c = deriveConsequence(v);
      expect(c.derivedClass).toBe("nonsense");
      expect(c.truncated).toBe(true);
      expect(c.ptcPosition).toBe(102);
      expect(c.truncatedLength).toBe(101);
      expect(c.novelAaCount).toBe(0);
      expect(c.nmdPredicted).toBe(true);
    });

    it("in-frame indels are not misflagged now that the class gate is gone", () => {
      // The reason the gate existed: comparing the mutant stop against the WT
      // stop codon (438) would call every in-frame indel a truncation. Comparing
      // against the mutant's own expected stop separates them without consulting
      // any label.
      const del = deriveConsequence(mkVariant("missense", 4, { kind: "del", cdsStart: 10, cdsEnd: 12 }));
      expect(del.truncated).toBe(false);
      expect(del.derivedClass).toBe("inframe-deletion");
      expect(del.mutantProteinLength).toBe(436);

      const ins = deriveConsequence(
        mkVariant("missense", 4, { kind: "ins", cdsStart: 12, insSeq: "GCA" }),
      );
      expect(ins.truncated).toBe(false);
      expect(ins.derivedClass).toBe("inframe-insertion");
      expect(ins.mutantProteinLength).toBe(438);
    });

    it("applyEdit rejects out-of-range coordinates instead of inventing a protein", () => {
      // cdsStart 0 used to derive to "875 aa, 200.2% of WT".
      expect(() => applyEdit(CDS_SEQUENCE, { kind: "sub", cdsStart: 0, altBase: "A" })).toThrow(
        RangeError,
      );
      expect(() =>
        applyEdit(CDS_SEQUENCE, { kind: "sub", cdsStart: CDS_SEQUENCE.length + 1, altBase: "A" }),
      ).toThrow(RangeError);
      // An unknown kind used to return the wild-type sequence unchanged.
      expect(() =>
        applyEdit(CDS_SEQUENCE, { kind: "bogus" as never, cdsStart: 10 }),
      ).toThrow();
    });
  });

  // The engine's edges were entirely uncovered. An inverted comparison in the
  // NMD rule flips a clinical prognosis ("mRNA is destroyed" vs "a truncated
  // protein is made"), and nothing tested it.
  describe("deriveConsequence — boundaries", () => {
    it("a late PTC escapes NMD — this is Q423*, a real catalog variant", () => {
      const v = mkVariant("missense", 423, { kind: "sub", cdsStart: 1267, altBase: "T" });
      const c = deriveConsequence(v);
      expect(c.derivedClass).toBe("nonsense");
      expect(c.truncated).toBe(true);
      expect(c.ptcPosition).toBe(423);
      // Inverting this comparison would flip a clinical prognosis: "the mRNA is
      // destroyed" vs "a truncated protein is made and has to be dealt with".
      expect(c.nmdPredicted).toBe(false);
    });

    it("straddles the 50-nt rule: 1243 triggers NMD, 1249 does not", () => {
      // Last junction 1297, rule 50 -> boundary at 1247. Two real stop-gains sit
      // either side of it, six nucleotides apart.
      const before = deriveConsequence(mkVariant("missense", 415, { kind: "sub", cdsStart: 1243, altBase: "T" }));
      const after = deriveConsequence(mkVariant("missense", 417, { kind: "sub", cdsStart: 1249, altBase: "T" }));
      expect(before.truncated).toBe(true);
      expect(before.nmdPredicted).toBe(true);
      expect(after.truncated).toBe(true);
      expect(after.nmdPredicted).toBe(false);
    });

    it("a PTC far upstream of the last junction triggers NMD", () => {
      expect(PATIENT_CONSEQUENCE.ptcPosition).toBe(68);
      expect(PATIENT_CONSEQUENCE.nmdPredicted).toBe(true);
    });

    it("first codon", () => {
      const c = deriveConsequence(mkVariant("missense", 1, { kind: "sub", cdsStart: 1, altBase: "T" }));
      expect(c.evidence).toBe("computed");
      expect(c.mutantProteinLength).toBeGreaterThan(0);
    });

    it("last codon", () => {
      const c = deriveConsequence(mkVariant("missense", 437, { kind: "sub", cdsStart: 1311, altBase: "T" }));
      expect(c.truncated).toBe(false);
      expect(c.mutantProteinLength).toBe(437);
    });

    it("stop-lost: no stop anywhere, so nothing is reported as truncated", () => {
      // The null-stop branch was completely uncovered.
      const v = mkVariant("missense", 438, { kind: "sub", cdsStart: 1312, altBase: "C" });
      const c = deriveConsequence(v);
      expect(c.ptcPosition).toBe(null);
      expect(c.truncated).toBe(false);
      expect(c.mutantProteinLength).toBe(438);
    });

    it("synonymous: no catalog instance exists, so pin the behaviour here", () => {
      // CDS codon 5 is CGG (Arg); CGA is also Arg.
      const wt = CDS_SEQUENCE.slice(12, 15);
      expect(wt).toBe("CGG");
      const c = deriveConsequence(mkVariant("missense", 5, { kind: "sub", cdsStart: 15, altBase: "A" }));
      expect(c.derivedClass).toBe("synonymous");
      expect(c.truncated).toBe(false);
      expect(c.mutantProteinLength).toBe(437);
    });

    it("every class returns nulls, not numbers, when there is no edit", () => {
      const classes = [
        "frameshift",
        "nonsense",
        "missense",
        "synonymous",
        "inframe-deletion",
        "inframe-insertion",
      ] as const;
      for (const cls of classes) {
        const c = deriveConsequence(mkVariant(cls, 200, undefined));
        expect(c.evidence).toBe("reported");
        expect(c.mutantProteinLength).toBe(null);
        expect(c.fractionOfWT).toBe(null);
        expect(c.nmdPredicted).toBe(null);
        expect(c.truncated).toBe(null);
      }
    });

    it("exhaustive substitution sweep: 437 codons x 3 positions x 4 bases", () => {
      // ~5,000 cases, small enough to enumerate rather than sample. Nothing in
      // the space may produce an impossible result: a protein longer than the
      // wild type, a fraction above 1, a PTC outside the sequence, or a
      // truncation flag that disagrees with the reported PTC.
      const bases = ["A", "C", "G", "T"] as const;
      const violations: string[] = [];
      let checked = 0;
      for (let aa = 1; aa <= WT_PROTEIN_LENGTH; aa++) {
        for (let off = 0; off < 3; off++) {
          const cdsStart = (aa - 1) * 3 + off + 1;
          for (const b of bases) {
            if (CDS_SEQUENCE[cdsStart - 1] === b) continue;
            checked++;
            const c = deriveConsequence(mkVariant("missense", aa, { kind: "sub", cdsStart, altBase: b }));
            const len = c.mutantProteinLength;
            if (len === null || len < 0 || len > 438) {
              violations.push(`aa${aa}/${cdsStart}${b}: length ${len}`);
            }
            if (c.fractionOfWT !== null && (c.fractionOfWT < 0 || c.fractionOfWT > 1.01)) {
              violations.push(`aa${aa}/${cdsStart}${b}: fraction ${c.fractionOfWT}`);
            }
            if (c.truncated !== (c.ptcPosition !== null)) {
              violations.push(`aa${aa}/${cdsStart}${b}: truncated/ptc disagree`);
            }
            if (c.ptcPosition !== null && (c.ptcPosition < 1 || c.ptcPosition > 438)) {
              violations.push(`aa${aa}/${cdsStart}${b}: ptc ${c.ptcPosition}`);
            }
            // A substitution changes one codon; it can never shift the frame.
            if (c.novelAaCount !== 0) {
              violations.push(`aa${aa}/${cdsStart}${b}: novelAaCount ${c.novelAaCount}`);
            }
          }
        }
      }
      expect(checked).toBeGreaterThan(3000);
      expect(violations.slice(0, 10)).toEqual([]);
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
