import { getDomainForPosition } from "./getDomainForPosition";

describe("getDomainForPosition", () => {
  it("returns extracellular for position 1", () => {
    expect(getDomainForPosition(1)).toEqual({ label: "Extracellular", color: "#3b82f6" });
  });

  it("returns extracellular for position 317", () => {
    expect(getDomainForPosition(317)).toEqual({ label: "Extracellular", color: "#3b82f6" });
  });

  it("returns transmembrane for position 318", () => {
    expect(getDomainForPosition(318)).toEqual({ label: "Transmembrane", color: "#f59e0b" });
  });

  it("returns transmembrane for position 338", () => {
    expect(getDomainForPosition(338)).toEqual({ label: "Transmembrane", color: "#f59e0b" });
  });

  it("returns cytoplasmic for position 339", () => {
    expect(getDomainForPosition(339)).toEqual({ label: "Cytoplasmic", color: "#8b5cf6" });
  });

  it("returns cytoplasmic for position 437", () => {
    expect(getDomainForPosition(437)).toEqual({ label: "Cytoplasmic", color: "#8b5cf6" });
  });

  it("returns null for position 0", () => {
    expect(getDomainForPosition(0)).toBeNull();
  });

  it("returns null for position 438", () => {
    expect(getDomainForPosition(438)).toBeNull();
  });

  it("returns null for negative position", () => {
    expect(getDomainForPosition(-5)).toBeNull();
  });
});
