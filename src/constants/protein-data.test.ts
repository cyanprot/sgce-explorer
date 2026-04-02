import {
  PROTEIN_LENGTH,
  SEQUENCE,
  DOMAINS,
  MUTATION,
  GLYCOSYLATION_SITES,
  CENTRAL_DOGMA_STEPS,
  COLORS,
} from "@/constants/protein-data";

describe("protein-data constants", () => {
  describe("PROTEIN_LENGTH", () => {
    it("is 437", () => {
      expect(PROTEIN_LENGTH).toBe(437);
    });
  });

  describe("SEQUENCE", () => {
    it("has length equal to PROTEIN_LENGTH (437)", () => {
      expect(SEQUENCE.length).toBe(PROTEIN_LENGTH);
    });

    it("contains only standard amino acid characters", () => {
      const valid = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
      expect(SEQUENCE).toMatch(valid);
    });
  });

  describe("DOMAINS", () => {
    it("has contiguous boundaries: extracellular.end + 1 === transmembrane.start", () => {
      expect(DOMAINS.extracellular.end + 1).toBe(DOMAINS.transmembrane.start);
    });

    it("has contiguous boundaries: transmembrane.end + 1 === cytoplasmic.start", () => {
      expect(DOMAINS.transmembrane.end + 1).toBe(DOMAINS.cytoplasmic.start);
    });

    it("covers full protein: extracellular starts at 1", () => {
      expect(DOMAINS.extracellular.start).toBe(1);
    });

    it("covers full protein: cytoplasmic ends at 437", () => {
      expect(DOMAINS.cytoplasmic.end).toBe(437);
    });
  });

  describe("MUTATION", () => {
    it("aaPosition (37) is within extracellular domain", () => {
      expect(MUTATION.aaPosition).toBeGreaterThanOrEqual(DOMAINS.extracellular.start);
      expect(MUTATION.aaPosition).toBeLessThanOrEqual(DOMAINS.extracellular.end);
    });

    it("truncationAt (68) is before transmembrane domain", () => {
      expect(MUTATION.truncationAt).toBeLessThan(DOMAINS.transmembrane.start);
    });

    it("truncationAt - aaPosition + 1 === 32 (fsTer32)", () => {
      expect(MUTATION.truncationAt - MUTATION.aaPosition + 1).toBe(32);
    });

    it("truncated protein is 15.6% of full length", () => {
      const pct = ((MUTATION.truncationAt / PROTEIN_LENGTH) * 100).toFixed(1);
      expect(pct).toBe("15.6");
    });
  });

  describe("GLYCOSYLATION_SITES", () => {
    it("first site (Asn200) is within extracellular domain", () => {
      const pos = GLYCOSYLATION_SITES[0].position;
      expect(pos).toBeGreaterThanOrEqual(DOMAINS.extracellular.start);
      expect(pos).toBeLessThanOrEqual(DOMAINS.extracellular.end);
    });
  });

  describe("CENTRAL_DOGMA_STEPS", () => {
    it("has 7 entries", () => {
      expect(CENTRAL_DOGMA_STEPS).toHaveLength(7);
    });

    it("every step has non-empty title, subtitle, detail, mutationNote", () => {
      for (const step of CENTRAL_DOGMA_STEPS) {
        expect(step.title).toEqual(expect.any(String));
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.subtitle).toEqual(expect.any(String));
        expect(step.subtitle.length).toBeGreaterThan(0);
        expect(step.detail).toEqual(expect.any(String));
        expect(step.detail.length).toBeGreaterThan(0);
        expect(step.mutationNote).toEqual(expect.any(String));
        expect(step.mutationNote.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COLORS", () => {
    it("all values are valid 6-digit hex colors", () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;
      for (const [key, value] of Object.entries(COLORS)) {
        expect(value, `COLORS.${key}`).toMatch(hexPattern);
      }
    });
  });
});
