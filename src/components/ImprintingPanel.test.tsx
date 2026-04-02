import { render, screen, fireEvent } from "@testing-library/react";
import { ImprintingPanel } from "./ImprintingPanel";

describe("ImprintingPanel", () => {
  it("renders all 3 toggle buttons", () => {
    render(<ImprintingPanel />);
    expect(screen.getByText("Both alleles")).toBeInTheDocument();
    expect(screen.getByText("Paternal (active)")).toBeInTheDocument();
    expect(screen.getByText("Maternal (silenced)")).toBeInTheDocument();
  });

  it("defaults to both alleles visible at full opacity", () => {
    render(<ImprintingPanel />);
    const paternal = screen.getByTestId("paternal-allele");
    const maternal = screen.getByTestId("maternal-allele");
    expect(paternal.getAttribute("opacity")).toBe("1");
    expect(maternal.getAttribute("opacity")).toBe("1");
  });

  it("dims maternal allele when Paternal (active) is clicked", () => {
    render(<ImprintingPanel />);
    fireEvent.click(screen.getByText("Paternal (active)"));
    const paternal = screen.getByTestId("paternal-allele");
    const maternal = screen.getByTestId("maternal-allele");
    expect(paternal.getAttribute("opacity")).toBe("1");
    expect(maternal.getAttribute("opacity")).toBe("0.2");
  });

  it("dims paternal allele when Maternal (silenced) is clicked", () => {
    render(<ImprintingPanel />);
    fireEvent.click(screen.getByText("Maternal (silenced)"));
    const paternal = screen.getByTestId("paternal-allele");
    const maternal = screen.getByTestId("maternal-allele");
    expect(paternal.getAttribute("opacity")).toBe("0.2");
    expect(maternal.getAttribute("opacity")).toBe("1");
  });

  it("renders all 3 InfoCard titles", () => {
    render(<ImprintingPanel />);
    expect(screen.getByText("Imprinting Control Region (ICR)")).toBeInTheDocument();
    expect(screen.getByText("Why this is NOT haploinsufficiency")).toBeInTheDocument();
    expect(screen.getByText("Therapeutic implication")).toBeInTheDocument();
  });

  it("shows mutation notation c.108dup in SVG", () => {
    render(<ImprintingPanel />);
    const matches = screen.getAllByText(/c\.108dup/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
