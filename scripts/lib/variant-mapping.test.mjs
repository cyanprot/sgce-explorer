/**
 * Unit tests for the catalog build's pure mapping functions.
 *
 * The two `begin` records pinned below are the whole reason this module exists.
 * They are real UniProt feed records in which `consequenceType` contradicts the
 * record's own `locations` HGVS string — in OPPOSITE directions, so a rule that
 * handles one of them can still get the other exactly backwards.
 *
 * Note what a test like `mapConsequence("stop gained") === "nonsense"` would be
 * worth here: nothing. It passes against the ORIGINAL buggy implementation too,
 * because that implementation's failure was never in the string mapping — it was
 * in trusting the wrong field. Assertions have to run against the real records.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertCdsIntegrity,
  checksum,
  classFromProteinHgvs,
  classifyFeature,
  distinctToken,
  inferSub,
  makeId,
  mapSignificance,
  moreSevere,
  parseCdsFromSource,
  parseSimpleSub,
  residueAt,
  selectProteinHgvs,
  validateSub,
} from "./variant-mapping.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CDS = assertCdsIntegrity(
  parseCdsFromSource(readFileSync(join(ROOT, "src", "constants", "codon-data.ts"), "utf8")),
);

/** begin 102: typed "missense", but the locations say p.Arg102Ter. */
const R102 = {
  begin: "102",
  end: "102",
  wildType: "R",
  alternativeSequence: "*",
  consequenceType: "missense",
  codon: "CGA/TGA",
  locations: [
    { loc: "p.Arg102Ter", source: "Ensembl" },
    { loc: "c.304C>T", source: "Ensembl" },
  ],
  xrefs: [{ name: "dbSNP", id: "rs121908490" }],
};

/** begin 289: typed "stop gained", but the locations say p.Ile289SerfsTer4. */
const I289 = {
  begin: "289",
  end: "289",
  wildType: "I",
  alternativeSequence: "S",
  consequenceType: "stop gained",
  locations: [
    { loc: "p.Ile289SerfsTer4", source: "Ensembl" },
    { loc: "c.865_866insGCAGGAAGTGA", source: "Ensembl" },
  ],
  xrefs: [{ name: "dbSNP", id: "rs2116695697" }],
};

describe("CDS parsing", () => {
  it("round-trips the CDS out of codon-data.ts", () => {
    // The parser scrapes TypeScript with a regex. A reformat that changes the
    // string-concatenation style would silently yield a short CDS, and every
    // inferred edit.cdsStart in the catalog would be computed against it.
    expect(CDS.length).toBe(1314);
    expect(CDS.slice(0, 3)).toBe("ATG");
    expect(residueAt(CDS, 1)).toBe("M");
    expect(residueAt(CDS, 102)).toBe("R");
    expect(residueAt(CDS, 437)).toBe("P");
  });

  it("rejects a CDS that is the wrong length or shape", () => {
    expect(() => assertCdsIntegrity("ATG", 1314)).toThrow(/refusing to build/);
    expect(() => assertCdsIntegrity(CDS.slice(0, 1311), 1311)).toThrow(/stop codon/);
    expect(() => parseCdsFromSource("const NOTHING = 1;")).toThrow(/Could not locate/);
  });

  it("checksum changes when the sequence does", () => {
    expect(checksum(CDS)).toBe(checksum(CDS));
    // A single-base change anywhere must move the checksum — this is what
    // detects a catalog built against a different transcript.
    const mutated = `${CDS.slice(0, 303)}T${CDS.slice(304)}`;
    expect(mutated).not.toBe(CDS);
    expect(checksum(mutated)).not.toBe(checksum(CDS));
  });
});

describe("classification from locations", () => {
  it("begin 102: typed missense, classified nonsense", () => {
    expect(R102.consequenceType).toBe("missense"); // the feed really says this
    expect(classifyFeature(R102)).toBe("nonsense");
  });

  it("begin 289: typed stop gained, classified frameshift", () => {
    expect(I289.consequenceType).toBe("stop gained"); // the feed really says this
    expect(classifyFeature(I289)).toBe("frameshift");
  });

  it("prefers the 3-letter HGVS when both forms are present", () => {
    expect(selectProteinHgvs([{ loc: "p.R97*" }, { loc: "p.Arg97Ter" }])).toBe("p.Arg97Ter");
  });

  it("truncating tests run before dup/ins/del — a stop insertion is not an insertion", () => {
    // Getting this order wrong files two pathogenic truncating variants under
    // the benign-sounding label "in-frame insertion".
    expect(classFromProteinHgvs("p.Ile148_Asn149insTer")).toBe("nonsense");
    expect(classFromProteinHgvs("p.Thr257_Cys258insTer")).toBe("nonsense");
    expect(classFromProteinHgvs("p.Cys258_Asp259delinsTer")).toBe("nonsense");
    expect(classFromProteinHgvs("p.Ter438CysextTer6")).toBe("stop-lost");
    expect(classFromProteinHgvs("p.Ser325fs")).toBe("frameshift");
    // …while a genuine in-frame event still classifies as one.
    expect(classFromProteinHgvs("p.Thr141dup")).toBe("inframe-insertion");
    expect(classFromProteinHgvs("p.Asn145_Ile147dup")).toBe("inframe-insertion");
    expect(classFromProteinHgvs("p.Ile148del")).toBe("inframe-deletion");
    expect(classFromProteinHgvs("p.Val37Ala")).toBe("missense");
  });

  it("returns null rather than guessing", () => {
    expect(classFromProteinHgvs("")).toBe(null);
    expect(classFromProteinHgvs("something else entirely")).toBe(null);
  });
});

describe("CDS edits", () => {
  it("accepts a feed c. only when it validates against our own CDS", () => {
    const sub = parseSimpleSub("c.304C>T");
    expect(sub).toEqual({ cdsStart: 304, refBase: "C", altBase: "T" });
    expect(validateSub(CDS, sub, 102, "*")).toBe(true);
    // Right position, wrong reference base.
    expect(validateSub(CDS, { cdsStart: 304, refBase: "A", altBase: "T" }, 102, "*")).toBe(false);
    // Valid substitution, but not in the codon the feature claims.
    expect(validateSub(CDS, sub, 103, "*")).toBe(false);
    // Produces a different residue than the feature reports.
    expect(validateSub(CDS, sub, 102, "Q")).toBe(false);
  });

  it("does not parse an indel as a substitution", () => {
    // These three shipped as synthesized `c.` substitutions that exist in no
    // database: c.39T>A, c.198?>A and c.866T>G, for variants that are really
    // insertions. parseSimpleSub returning null is what keeps them browse-only.
    expect(parseSimpleSub("c.37_38insA")).toBe(null);
    expect(parseSimpleSub("c.197_198insGAGAATA")).toBe(null);
    expect(parseSimpleSub("c.865_866insGCAGGAAGTGA")).toBe(null);
    expect(parseSimpleSub("c.108dup")).toBe(null);
    expect(parseSimpleSub(null)).toBe(null);
  });

  it("infers a substitution only when one exists, and flags ambiguity", () => {
    const inferred = inferSub(CDS, 102, "*");
    expect(inferred).toMatchObject({ cdsStart: 304, altBase: "T" });
    // Several single-base paths give the same residue for some codons.
    expect(inferSub(CDS, 102, "R")).toMatchObject({ ambiguous: true });
    // No single-base path from this codon reaches that residue.
    expect(inferSub(CDS, 1, "W")).toBe(null);
  });
});

describe("significance", () => {
  it("takes the most severe reported classification", () => {
    expect(mapSignificance([{ type: "Variant of uncertain significance" }, { type: "Pathogenic" }])).toBe(
      "pathogenic",
    );
    expect(mapSignificance([])).toBe("unclassified");
    expect(mapSignificance(undefined)).toBe("unclassified");
    expect(moreSevere("vus", "pathogenic")).toBe("pathogenic");
    expect(moreSevere("benign", "likely-benign")).toBe("likely-benign");
  });

  it("throws on an unrecognized vocabulary term rather than downgrading it", () => {
    // Folding an unknown ClinVar term into "unclassified" would render a new
    // "Pathogenic, low penetrance" as "no clinical data".
    expect(() => mapSignificance([{ type: "Pathogenic, low penetrance" }])).toThrow(/Unrecognized/);
  });
});

describe("ids", () => {
  it("never embeds the consequence class", () => {
    // The old scheme appended fs/del/ins, so reclassifying a variant changed its
    // id and 404'd every deep link that had been shared.
    const id = makeId({ wildType: "K", aaPosition: 43, mutatedType: "", token: "rs1804394258" });
    expect(id).toBe("K43_rs1804394258");
    expect(id).not.toMatch(/fs|del|ins/);
  });

  it("keeps the compact form for substitutions, which existing links use", () => {
    expect(makeId({ wildType: "R", aaPosition: 102, mutatedType: "*", token: "rs121908490" })).toBe(
      "R102*",
    );
  });

  it("an rsID alone does not identify a variant", () => {
    // dbSNP ids are position-level: rs559353446 is attached to BOTH p.S325*
    // (c.974C>A) and p.S325L (c.974C>T). The residue change has to be part of
    // any key built from one.
    const a = makeId({ wildType: "S", aaPosition: 325, mutatedType: "*", token: "rs559353446" });
    const b = makeId({ wildType: "S", aaPosition: 325, mutatedType: "L", token: "rs559353446" });
    expect(a).not.toBe(b);
  });

  it("prefers dbSNP then ClinVar then ClinGen for the distinguishing token", () => {
    expect(distinctToken(["ClinVar:RCV1", "dbSNP:rs9"])).toBe("rs9");
    expect(distinctToken(["ClinGen:CA1", "ClinVar:RCV1"])).toBe("RCV1");
    expect(distinctToken(["gnomAD:x"])).toBe(null);
  });
});
