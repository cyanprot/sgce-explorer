import { hexWithAlpha } from "@/utils/hexWithAlpha";

describe("hexWithAlpha", () => {
  it('hexWithAlpha("#ef4444", 0.4) returns "#ef444466"', () => {
    expect(hexWithAlpha("#ef4444", 0.4)).toBe("#ef444466");
  });

  it('hexWithAlpha("#ef4444", 0.2) returns "#ef444433"', () => {
    expect(hexWithAlpha("#ef4444", 0.2)).toBe("#ef444433");
  });

  it('hexWithAlpha("#000000", 0.7) returns "#000000b3"', () => {
    expect(hexWithAlpha("#000000", 0.7)).toBe("#000000b3");
  });

  it("alpha=0 returns hex + 00 (fully transparent)", () => {
    expect(hexWithAlpha("#ff0000", 0)).toBe("#ff000000");
  });

  it("alpha=1 returns hex + ff (fully opaque)", () => {
    expect(hexWithAlpha("#ff0000", 1)).toBe("#ff0000ff");
  });

  it("expands 3-char shorthand (#fff → #ffffff) before appending alpha", () => {
    expect(hexWithAlpha("#fff", 0.5)).toBe("#ffffff80");
  });

  it("clamps negative alpha to 0", () => {
    expect(hexWithAlpha("#000000", -0.5)).toBe("#00000000");
  });

  it("clamps alpha > 1 to 1", () => {
    expect(hexWithAlpha("#000000", 2)).toBe("#000000ff");
  });
});
