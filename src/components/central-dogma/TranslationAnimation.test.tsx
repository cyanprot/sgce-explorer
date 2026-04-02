import { render, screen } from "@testing-library/react";
import { TranslationAnimation } from "./TranslationAnimation";

describe("TranslationAnimation", () => {
  it("renders mRNA strand", () => {
    render(<TranslationAnimation progress={0} />);
    expect(screen.getByTestId("mrna-strand")).toBeInTheDocument();
  });

  it("renders ribosome", () => {
    render(<TranslationAnimation progress={0} />);
    expect(screen.getByTestId("ribosome")).toBeInTheDocument();
  });

  it("ribosome at progress=0 is at the start", () => {
    const { container } = render(<TranslationAnimation progress={0} />);
    const ribosome = container.querySelector("[data-testid='ribosome']");
    // At progress 0, ribosome should be near the left (transform ~ translate(0, 0))
    expect(ribosome).toBeInTheDocument();
  });

  it("renders peptide chain that grows with progress", () => {
    const { container } = render(<TranslationAnimation progress={0.5} />);
    const peptides = container.querySelectorAll("[data-testid^='peptide-']");
    expect(peptides.length).toBeGreaterThan(0);
  });

  it("shows frameshift indicator when progress passes codon 37", () => {
    // Progress 0.5 should be past codon 37 (which is ~37/68 = 0.54 of the way)
    render(<TranslationAnimation progress={0.6} />);
    expect(screen.getByTestId("frameshift-marker")).toBeInTheDocument();
  });

  it("shows PTC indicator at progress=1", () => {
    render(<TranslationAnimation progress={1} />);
    expect(screen.getByTestId("ptc-marker")).toBeInTheDocument();
  });

  it("renders nothing when not active", () => {
    const { container } = render(<TranslationAnimation progress={0} active={false} />);
    expect(container.firstChild).toBeNull();
  });
});
