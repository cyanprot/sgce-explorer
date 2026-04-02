import { hexToInt } from "@/utils/hexToInt";

describe("hexToInt", () => {
  it('converts "#3b82f6" to 0x3b82f6 (3899126)', () => {
    expect(hexToInt("#3b82f6")).toBe(0x3b82f6);
  });

  it('converts "#000000" to 0', () => {
    expect(hexToInt("#000000")).toBe(0);
  });

  it('converts "#ffffff" to 16777215 (0xffffff)', () => {
    expect(hexToInt("#ffffff")).toBe(16777215);
  });

  it('converts "#ef4444" to 0xef4444', () => {
    expect(hexToInt("#ef4444")).toBe(0xef4444);
  });
});
