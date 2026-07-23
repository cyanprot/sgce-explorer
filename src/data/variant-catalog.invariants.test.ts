/**
 * Data invariants for the shipped variant catalog.
 *
 * These are not unit tests of a function — they are assertions about the *data*
 * a patient can look up. Each one encodes a way the catalog has actually been
 * wrong: a pathogenic stop-gain rendered as "Missense … full-length product",
 * and HGVS c. strings synthesized locally that exist in no database.
 *
 * Every invariant collects violations into an array and asserts `toEqual([])`,
 * so a failure names every offending id rather than aborting on the first.
 *
 * The genetic code, the CDS and the edit engine are imported from
 * `@/constants/codon-data` — never re-declared here. A second copy of the codon
 * table would let the catalog and the invariants drift into agreeing with each
 * other while both are wrong.
 *
 * `uniprot-groundtruth.fixture.json` pins the 16 UniProt feed records where the
 * feed's own `consequenceType` contradicts its `locations[].loc` HGVS string, or
 * where the feed's `c.` is not a simple substitution. It is a fixture, not a live
 * fetch, so the suite stays offline and deterministic; regenerate it whenever
 * `npm run fetch-variants` is re-pointed at a new feed release.
 */
import { describe, it, expect } from "vitest";
import { VARIANT_CATALOG } from "@/constants/variant-catalog";
import {
  CDS_SEQUENCE,
  WT_PROTEIN_LENGTH,
  applyEdit,
  codonAt,
  deriveConsequence,
  effectiveClass,
} from "@/constants/codon-data";
import type { ClinicalSignificance, ConsequenceClass, Variant } from "@/types";
import rawGroundTruth from "./uniprot-groundtruth.fixture.json";

/** One pinned UniProt feed record, as emitted by the feed itself. */
interface FeedRecord {
  dbSNP: string | null;
  begin: string;
  end: string;
  wildType: string;
  alternativeSequence: string;
  consequenceType: string;
  locations: string[];
  feedCNotation: string | null;
  /** Whether the feed's own `c.` is a single-base substitution. */
  simpleSub: boolean;
  expectedClass: string;
}

// TypeScript infers literal types per element for a JSON import, which collapses
// `.filter(r => r.simpleSub)` to `never`. One declared shape instead.
const groundTruth = rawGroundTruth as FeedRecord[];

const CONSEQUENCE_CLASSES: ConsequenceClass[] = [
  "frameshift",
  "nonsense",
  "missense",
  "synonymous",
  "inframe-deletion",
  "inframe-insertion",
  "large-deletion",
];

const SIGNIFICANCES: ClinicalSignificance[] = [
  "pathogenic",
  "likely-pathogenic",
  "vus",
  "likely-benign",
  "benign",
  "unclassified",
];

/** Classes whose exact CDS change is a single-base substitution. */
const SUB_CLASSES: ConsequenceClass[] = ["missense", "nonsense", "synonymous"];

/**
 * Identity key for matching a catalog row to its source feed record.
 *
 * NOT the rsID alone: dbSNP ids are position-level, not allele-level. The feed
 * hands `rs559353446` to BOTH `p.S325*` (c.974C>A) and `p.S325L` (c.974C>T), so
 * keying on it alone makes the two rows indistinguishable. Anything that treats
 * an rsID as a unique variant token — id construction, dedup, this lookup — has
 * to carry the residue change as well.
 */
function feedKey(xref: string, aaPosition: number | string, altResidue: string): string {
  return `${xref}|${aaPosition}|${altResidue}`;
}

/**
 * The class a substitution *actually* produces, read off the translated mutant
 * CDS. This is the arbiter — not any label carried in the catalog row.
 */
function retranslateSubClass(v: Variant): ConsequenceClass {
  const mut = applyEdit(CDS_SEQUENCE, v.edit);
  const mutAA = codonAt(mut, v.aaPosition);
  const wtAA = codonAt(CDS_SEQUENCE, v.aaPosition);
  if (mutAA === "*") return "nonsense";
  if (mutAA === wtAA) return "synonymous";
  return "missense";
}

const subEntries = VARIANT_CATALOG.filter((v) => v.edit?.kind === "sub");
// MUTATION carries `mutatedType` in the frameshift sense (first *aberrant*
// residue, not a substituted one), so residue-identity invariants exclude it.
const nonFrameshift = VARIANT_CATALOG.filter((v) => v.reportedConsequence !== "frameshift");

describe("variant catalog data invariants", () => {
  it("catalog is non-empty (guards against a vacuous pass)", () => {
    expect(VARIANT_CATALOG.length).toBeGreaterThan(500);
    expect(subEntries.length).toBeGreaterThan(400);
  });

  // ── INV-1 ──────────────────────────────────────────────────────────────
  // The bug that started this: R102* ships as `consequence: "missense"` while
  // its own edit translates to a stop codon at 102.
  it("INV-1: a sub entry's declared class matches what its edit actually translates to", () => {
    const violations = subEntries
      .map((v) => ({ v, actual: retranslateSubClass(v) }))
      .filter(({ v, actual }) => v.reportedConsequence !== actual)
      .map(({ v, actual }) => `${v.id}: declared ${v.reportedConsequence}, translates to ${actual}`);
    expect(violations).toEqual([]);
  });

  // ── INV-2 ──────────────────────────────────────────────────────────────
  // Scoped to rows that actually make a single-residue claim. A multi-residue
  // event such as p.Ala381_Trp382insTyrTer is genuinely nonsense while having no
  // single `mutatedType` to report, and overloading the field to satisfy an
  // invariant would be the tail wagging the dog. INV-6 blocks the obvious escape
  // (dropping mutatedType from a row that has an edit).
  it("INV-2: mutatedType '*' iff class is nonsense", () => {
    const violations = nonFrameshift
      .filter((v) => v.mutatedType)
      .filter((v) => (v.mutatedType === "*") !== (v.reportedConsequence === "nonsense"))
      .map((v) => `${v.id}: mutatedType=${v.mutatedType} class=${v.reportedConsequence}`);
    expect(violations).toEqual([]);
  });

  // ── INV-3 ──────────────────────────────────────────────────────────────
  it("INV-3: wildType === mutatedType iff class is synonymous", () => {
    const violations = nonFrameshift
      .filter((v) => v.wildType && v.mutatedType)
      .filter(
        (v) => (v.wildType === v.mutatedType) !== (v.reportedConsequence === "synonymous"),
      )
      .map((v) => `${v.id}: ${v.wildType}->${v.mutatedType} class=${v.reportedConsequence}`);
    expect(violations).toEqual([]);
  });

  // ── INV-4 ──────────────────────────────────────────────────────────────
  // Anchors every row to the real transcript. If this fails, positions are
  // being numbered against a different sequence than the one we translate.
  it("INV-4: wildType is the residue the CDS actually encodes at aaPosition", () => {
    const violations = VARIANT_CATALOG.filter(
      (v) => v.wildType && v.wildType.length === 1 && v.aaPosition <= WT_PROTEIN_LENGTH,
    )
      .filter((v) => codonAt(CDS_SEQUENCE, v.aaPosition) !== v.wildType)
      .map((v) => `${v.id}: says ${v.wildType} at ${v.aaPosition}, CDS has ${codonAt(CDS_SEQUENCE, v.aaPosition)}`);
    expect(violations).toEqual([]);
  });

  // ── INV-5 ──────────────────────────────────────────────────────────────
  it("INV-5: a sub's cdsStart falls inside the codon it claims to change", () => {
    const violations = subEntries
      .filter((v) => Math.floor((v.edit!.cdsStart - 1) / 3) + 1 !== v.aaPosition)
      .map((v) => `${v.id}: cdsStart ${v.edit!.cdsStart} is not in codon ${v.aaPosition}`);
    expect(violations).toEqual([]);
  });

  // ── INV-6 ──────────────────────────────────────────────────────────────
  it("INV-6: applying a sub edit reproduces mutatedType, and cdsStart === cdsPosition", () => {
    const violations: string[] = [];
    for (const v of subEntries) {
      const produced = codonAt(applyEdit(CDS_SEQUENCE, v.edit), v.aaPosition);
      if (!v.mutatedType) {
        // Keeps INV-2/INV-3 from being sidestepped by omitting the field.
        violations.push(`${v.id}: has a sub edit but no mutatedType`);
      } else if (produced !== v.mutatedType) {
        violations.push(`${v.id}: edit yields ${produced}, mutatedType says ${v.mutatedType}`);
      }
      if (v.edit!.cdsStart !== v.cdsPosition) {
        violations.push(`${v.id}: edit.cdsStart ${v.edit!.cdsStart} !== cdsPosition ${v.cdsPosition}`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ── INV-7 ──────────────────────────────────────────────────────────────
  it("INV-7: required fields present and enum values in range", () => {
    const violations: string[] = [];
    for (const v of VARIANT_CATALOG) {
      if (!v.id) violations.push(`(missing id) at aa ${v.aaPosition}`);
      if (!v.notation) violations.push(`${v.id}: no p. notation`);
      if (!Number.isInteger(v.aaPosition) || v.aaPosition < 1) {
        violations.push(`${v.id}: bad aaPosition ${v.aaPosition}`);
      }
      if (!CONSEQUENCE_CLASSES.includes(v.reportedConsequence)) {
        violations.push(`${v.id}: unknown consequence ${v.reportedConsequence}`);
      }
      if (!SIGNIFICANCES.includes(v.significance)) {
        violations.push(`${v.id}: unknown significance ${v.significance}`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ── INV-8 ──────────────────────────────────────────────────────────────
  // `browseOnly` and `edit` are the two halves of one statement: either the exact
  // CDS change is known (and present), or it is not (and the row is flagged so
  // the UI computes nothing for it). A row that is neither, or both, is a row
  // whose numbers nobody can account for.
  //
  // Note this is deliberately NOT "declared sub-class ⇒ has an edit". A stop
  // introduced by an insertion (p.Cys13Ter, from c.37_38insA) is genuinely
  // nonsense *and* genuinely browse-only. INV-14 is what stops this from being
  // an escape hatch for INV-1.
  it("INV-8: browseOnly is exactly the absence of an edit", () => {
    const violations = VARIANT_CATALOG.filter((v) => !!v.browseOnly === !!v.edit).map(
      (v) => `${v.id}: browseOnly=${!!v.browseOnly} edit=${v.edit ? "present" : "absent"}`,
    );
    expect(violations).toEqual([]);
  });

  // ── INV-14 ─────────────────────────────────────────────────────────────
  // Closes the escape hatch INV-8 would otherwise open: a row whose class is
  // wrong could be made to pass INV-1 by dropping its edit and calling itself
  // browse-only. If the feed reports a simple substitution that validates
  // against our CDS, the row must carry it.
  it("INV-14: a row whose feed c. is a validated simple substitution is not browse-only", () => {
    const mustHaveEdit = new Set(
      groundTruth
        .filter((r) => r.simpleSub && r.dbSNP)
        .map((r) => feedKey(`dbSNP:${r.dbSNP}`, r.begin, r.alternativeSequence)),
    );
    const violations = VARIANT_CATALOG.filter((v) =>
      (v.xrefs ?? []).some((x) => mustHaveEdit.has(feedKey(x, v.aaPosition, v.mutatedType ?? ""))),
    )
      .filter((v) => !v.edit)
      .map((v) => `${v.id}: feed reports a simple c. substitution but the row is browse-only`);
    expect(violations).toEqual([]);
  });

  // ── INV-9 ──────────────────────────────────────────────────────────────
  // Three rows ship a synthesized `c.` substitution for a variant that is really
  // an insertion. The strings sit beside genuine ClinVar chips and read as sourced.
  it("INV-9: no entry synthesizes an edit for a variant whose real c. is not a simple substitution", () => {
    const nonSimple = new Set(
      groundTruth
        .filter((r) => !r.simpleSub && r.dbSNP)
        .map((r) => feedKey(`dbSNP:${r.dbSNP}`, r.begin, r.alternativeSequence)),
    );
    const violations = VARIANT_CATALOG.filter((v) =>
      (v.xrefs ?? []).some((x) =>
        nonSimple.has(feedKey(x, v.aaPosition, v.mutatedType ?? "")),
      ),
    )
      .filter((v) => v.edit || v.cNotation)
      .map(
        (v) =>
          `${v.id}: real c. is an indel, but ships cNotation="${v.cNotation}" edit=${JSON.stringify(v.edit)}`,
      );
    expect(violations).toEqual([]);
  });

  // ── INV-10 ─────────────────────────────────────────────────────────────
  it("INV-10: p. notation is real, not a placeholder, and embeds aaPosition", () => {
    const violations: string[] = [];
    for (const v of VARIANT_CATALOG) {
      if (v.notation.includes("?")) {
        violations.push(`${v.id}: placeholder notation ${v.notation}`);
        continue;
      }
      const positions: string[] = v.notation.match(/\d+/g) ?? [];
      if (!positions.includes(String(v.aaPosition))) {
        violations.push(`${v.id}: notation ${v.notation} does not mention aa ${v.aaPosition}`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ── Named regressions ──────────────────────────────────────────────────
  // The nine rows the feed's own `consequenceType` got wrong. Pinned by id so a
  // future feed change or refactor cannot quietly put any of them back.
  it("the nine misclassified rows now carry the class their sequence produces", () => {
    const expected: Record<string, string> = {
      "E65*": "nonsense",
      "R97*": "nonsense",
      "R102*": "nonsense",
      "R237*": "nonsense",
      "E251*": "nonsense",
      "K280*": "nonsense",
      "S325*": "nonsense",
      "Q423*": "nonsense",
      I289S: "frameshift", // p.Ile289SerfsTer4 — typed "stop gained" by the feed
    };
    const byId = new Map(VARIANT_CATALOG.map((v) => [v.id, v]));
    const violations: string[] = [];
    for (const [id, cls] of Object.entries(expected)) {
      const v = byId.get(id);
      // I289 is browse-only after the fix, so its id changes with its class.
      if (!v) {
        if (id === "I289S") continue;
        violations.push(`${id}: missing from the catalog`);
        continue;
      }
      if (effectiveClass(v) !== cls) violations.push(`${id}: ${effectiveClass(v)} (want ${cls})`);
    }
    expect(violations).toEqual([]);
  });

  it("Lance's variant reads correctly end to end", () => {
    // The row that started this: c.304C>T (p.Arg102Ter), ClinVar-pathogenic
    // across nine laboratories, shipped as "Missense … full-length product".
    const v = VARIANT_CATALOG.find((x) => x.id === "R102*");
    expect(v).toBeDefined();
    expect(v!.cNotation).toBe("c.304C>T");
    expect(v!.notation).toBe("p.Arg102Ter");
    expect(v!.notationShort).toBe("p.R102*"); // both HGVS forms are searchable
    expect(v!.significance).toBe("pathogenic");
    expect(effectiveClass(v!)).toBe("nonsense");
    const c = deriveConsequence(v!);
    expect(c.truncated).toBe(true);
    expect(c.ptcPosition).toBe(102);
    expect(c.truncatedLength).toBe(101);
    expect(c.novelAaCount).toBe(0); // a stop-gain adds no aberrant residues
    expect(c.nmdPredicted).toBe(true);
  });

  it("the patient's own variant is unchanged by any of this", () => {
    const v = VARIANT_CATALOG.find((x) => x.isPatient);
    const c = deriveConsequence(v!);
    expect(c.ptcPosition).toBe(68);
    expect(c.truncatedLength).toBe(67);
    expect(c.novelAaCount).toBe(31);
    expect(((c.fractionOfWT ?? 0) * 100).toFixed(1)).toBe("15.3");
    expect(c.nmdPredicted).toBe(true);
  });

  // ── INV-11 ─────────────────────────────────────────────────────────────
  it("INV-11: ids are unique (a collision silently drops a variant from the list)", () => {
    const seen = new Map<string, number>();
    for (const v of VARIANT_CATALOG) seen.set(v.id, (seen.get(v.id) ?? 0) + 1);
    const violations = [...seen.entries()]
      .filter(([, n]) => n > 1)
      .map(([id, n]) => `${id} appears ${n} times`);
    expect(violations).toEqual([]);
  });

  // ── INV-12 ─────────────────────────────────────────────────────────────
  it("INV-12: exactly one row is flagged as the patient's index variant", () => {
    expect(VARIANT_CATALOG.filter((v) => v.isPatient).map((v) => v.id)).toEqual(["c.108dup"]);
  });

  // ── INV-13 ─────────────────────────────────────────────────────────────
  // The only invariant that checks our output against the *source*. Without it,
  // a classifier reading `alternativeSequence` instead of `locations` can label
  // p.Ile289SerfsTer4 "missense" with a self-consistent inferred edit, and
  // INV-1/2/8 all pass while the row is still a lie.
  it("INV-13: declared class agrees with the feed's own locations[] HGVS string", () => {
    const expected = new Map(
      groundTruth
        .filter((r) => r.dbSNP)
        .map((r) => [feedKey(`dbSNP:${r.dbSNP}`, r.begin, r.alternativeSequence), r]),
    );
    const violations: string[] = [];
    let checked = 0;
    for (const v of VARIANT_CATALOG) {
      const hit = (v.xrefs ?? [])
        .map((x) => expected.get(feedKey(x, v.aaPosition, v.mutatedType ?? "")))
        .find(Boolean);
      if (!hit) continue;
      checked++;
      if (v.reportedConsequence !== hit.expectedClass) {
        violations.push(
          `${v.id}: declared ${v.reportedConsequence}, feed locations say ${hit.expectedClass} (${hit.locations.join(", ")})`,
        );
      }
    }
    // A silent zero here would make the invariant vacuous.
    expect(checked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});
