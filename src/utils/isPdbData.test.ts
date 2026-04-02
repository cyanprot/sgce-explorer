import { isPdbData } from "@/utils/isPdbData";

describe("isPdbData", () => {
  it('returns true for "HEADER ..."', () => {
    expect(isPdbData("HEADER    SARCOGLYCAN")).toBe(true);
  });

  it('returns true for "ATOM 1 N ALA ..."', () => {
    expect(isPdbData("ATOM      1  N   ALA A   1")).toBe(true);
  });

  it('returns true for "MODEL 1\\nATOM..."', () => {
    expect(isPdbData("MODEL        1\nATOM      1  N   ALA")).toBe(true);
  });

  it('returns true for "REMARK 1 REFERENCE"', () => {
    expect(isPdbData("REMARK   1 REFERENCE 1")).toBe(true);
  });

  it("returns true when ATOM appears at start of a line but not start of string", () => {
    expect(isPdbData("some preamble\nATOM      1  N   ALA A   1")).toBe(true);
  });

  it("returns false for HTML doctype (Vite dev server fallback)", () => {
    expect(isPdbData("<!DOCTYPE html><html><body></body></html>")).toBe(false);
  });

  it("returns false for HTML tags", () => {
    expect(isPdbData("<html><body>Not found</body></html>")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPdbData("")).toBe(false);
  });

  it("returns false for random garbage text", () => {
    expect(isPdbData("random garbage text that is not PDB")).toBe(false);
  });
});
