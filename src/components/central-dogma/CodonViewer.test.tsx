import { render, screen } from "@testing-library/react";
import { CodonViewer } from "./CodonViewer";

describe("CodonViewer", () => {
  it("renders WT and mutant codon strips", () => {
    render(<CodonViewer />);
    expect(screen.getByText("Wild Type")).toBeInTheDocument();
    expect(screen.getByText("Mutant")).toBeInTheDocument();
  });

  it("renders WT codons with amino acid labels", () => {
    render(<CodonViewer />);
    // Position 37 in WT should show Val (V)
    const wtCells = screen.getAllByTestId(/^wt-codon-/);
    expect(wtCells.length).toBeGreaterThan(0);
    // Find codon 37
    const codon37 = screen.getByTestId("wt-codon-37");
    expect(codon37).toHaveTextContent("V");
  });

  it("renders mutant codons with frameshift marker at position 37", () => {
    render(<CodonViewer />);
    const mutCodon37 = screen.getByTestId("mut-codon-37");
    expect(mutCodon37).toHaveTextContent("S"); // Val→Ser
    // Should have frameshift indicator
    expect(mutCodon37.className).toMatch(/frameshift|danger/i);
  });

  it("marks PTC at position 68 in mutant", () => {
    render(<CodonViewer />);
    const ptc = screen.getByTestId("mut-codon-68");
    expect(ptc).toHaveTextContent("*");
  });

  it("does not render mutant codons beyond position 68", () => {
    render(<CodonViewer />);
    expect(screen.queryByTestId("mut-codon-69")).not.toBeInTheDocument();
  });

  it("position labels use minimum 10px font (no text-[9px])", () => {
    render(<CodonViewer />);
    const codon37 = screen.getByTestId("wt-codon-37");
    const allSpans = codon37.querySelectorAll("span");
    // No span should have text-[9px]
    for (const span of allSpans) {
      expect(span.className).not.toContain("text-[9px]");
    }
  });

  it("is hidden when visible prop is false", () => {
    const { container } = render(<CodonViewer visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("is shown when visible prop is true or omitted", () => {
    render(<CodonViewer visible={true} />);
    expect(screen.getByText("Wild Type")).toBeInTheDocument();
  });
});
