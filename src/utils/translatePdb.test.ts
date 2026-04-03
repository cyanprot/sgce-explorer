import { translatePdb } from "@/utils/translatePdb";

describe("translatePdb", () => {
  const sampleAtom =
    "ATOM      1  N   MET A   1      10.000  20.000  30.000  1.00  0.00           N";

  it("shifts ATOM X coordinate by offset", () => {
    const result = translatePdb(sampleAtom, { x: 5, y: 0, z: 0 });
    // X should be 15.000
    expect(result).toContain("  15.000");
  });

  it("shifts Y and Z coordinates by offset", () => {
    const result = translatePdb(sampleAtom, { x: 0, y: -3, z: 7.5 });
    const line = result.split("\n")[0];
    // Y = 17.000, Z = 37.500
    const x = parseFloat(line.substring(30, 38));
    const y = parseFloat(line.substring(38, 46));
    const z = parseFloat(line.substring(46, 54));
    expect(x).toBeCloseTo(10.0, 3);
    expect(y).toBeCloseTo(17.0, 3);
    expect(z).toBeCloseTo(37.5, 3);
  });

  it("preserves non-ATOM lines (HEADER, REMARK, END)", () => {
    const pdb = [
      "HEADER    SARCOGLYCAN",
      "REMARK   1 ALPHAFOLD",
      sampleAtom,
      "END",
    ].join("\n");
    const result = translatePdb(pdb, { x: 10, y: 0, z: 0 });
    expect(result).toContain("HEADER    SARCOGLYCAN");
    expect(result).toContain("REMARK   1 ALPHAFOLD");
    expect(result).toContain("END");
  });

  it("handles negative coordinates correctly", () => {
    const negAtom =
      "ATOM      2  CA  ALA A   1     -15.123  -7.456  -2.789  1.00  0.00           C";
    const result = translatePdb(negAtom, { x: -10, y: 5, z: 0 });
    const line = result.split("\n")[0];
    const x = parseFloat(line.substring(30, 38));
    const y = parseFloat(line.substring(38, 46));
    expect(x).toBeCloseTo(-25.123, 3);
    expect(y).toBeCloseTo(-2.456, 3);
  });

  it("preserves PDB fixed-width column alignment (8.3f format)", () => {
    const result = translatePdb(sampleAtom, { x: 5, y: 0, z: 0 });
    const line = result.split("\n")[0];
    // Total line length should be preserved
    expect(line.length).toBe(sampleAtom.length);
    // X field is columns 31-38 (0-indexed 30-37), 8 chars
    const xField = line.substring(30, 38);
    expect(xField.length).toBe(8);
  });

  it("handles HETATM records same as ATOM", () => {
    const hetatm =
      "HETATM    1  O   HOH A   1      10.000  20.000  30.000  1.00  0.00           O";
    const result = translatePdb(hetatm, { x: 5, y: 0, z: 0 });
    const line = result.split("\n")[0];
    const x = parseFloat(line.substring(30, 38));
    expect(x).toBeCloseTo(15.0, 3);
  });

  it("identity transform (0,0,0) returns equivalent data", () => {
    const pdb = [
      "HEADER    TEST",
      sampleAtom,
      "END",
    ].join("\n");
    const result = translatePdb(pdb, { x: 0, y: 0, z: 0 });
    expect(result).toBe(pdb);
  });
});
