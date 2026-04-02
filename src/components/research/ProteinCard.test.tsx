import { render, screen } from "@testing-library/react";
import { ProteinCard } from "./ProteinCard";
import type { UniProtAnnotation } from "@/types/research";

const mockAnnotation: UniProtAnnotation = {
  accession: "O43556",
  proteinName: "Epsilon-sarcoglycan",
  geneName: "SGCE",
  features: [
    { type: "Chain", description: "Epsilon-sarcoglycan", start: 1, end: 437 },
    { type: "Topological domain", description: "Extracellular", start: 1, end: 317 },
    { type: "Topological domain", description: "Cytoplasmic", start: 339, end: 437 },
    { type: "Transmembrane", description: "Helical", start: 318, end: 338 },
  ],
  keywords: ["Cell membrane", "Glycoprotein", "Dystonia"],
  lastModified: "2024-07-24",
};

describe("ProteinCard", () => {
  it("renders loading state", () => {
    render(
      <ProteinCard annotation={null} loading={true} error={null} />,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <ProteinCard annotation={null} loading={false} error="UniProt unavailable" />,
    );
    expect(screen.getByText("UniProt unavailable")).toBeInTheDocument();
  });

  it("renders empty state when data is null", () => {
    render(
      <ProteinCard annotation={null} loading={false} error={null} />,
    );
    expect(screen.getByText("No annotation data")).toBeInTheDocument();
  });

  it("renders protein name and gene name", () => {
    render(
      <ProteinCard annotation={mockAnnotation} loading={false} error={null} />,
    );
    // Protein name appears in header and also as Chain feature description
    const nameElements = screen.getAllByText("Epsilon-sarcoglycan");
    expect(nameElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("SGCE")).toBeInTheDocument();
  });

  it("renders features grouped by type", () => {
    render(
      <ProteinCard annotation={mockAnnotation} loading={false} error={null} />,
    );
    // Group headers
    expect(screen.getByText("Chain")).toBeInTheDocument();
    expect(screen.getByText("Topological domain")).toBeInTheDocument();
    expect(screen.getByText("Transmembrane")).toBeInTheDocument();

    // Feature descriptions with ranges
    expect(screen.getByText("Extracellular")).toBeInTheDocument();
    expect(screen.getByText("Cytoplasmic")).toBeInTheDocument();
    expect(screen.getByText("1–317")).toBeInTheDocument();
    expect(screen.getByText("339–437")).toBeInTheDocument();
    expect(screen.getByText("318–338")).toBeInTheDocument();
  });

  it("renders keywords as badges", () => {
    render(
      <ProteinCard annotation={mockAnnotation} loading={false} error={null} />,
    );
    expect(screen.getByText("Cell membrane")).toBeInTheDocument();
    expect(screen.getByText("Glycoprotein")).toBeInTheDocument();
    expect(screen.getByText("Dystonia")).toBeInTheDocument();
  });

  it("renders last modified date", () => {
    render(
      <ProteinCard annotation={mockAnnotation} loading={false} error={null} />,
    );
    expect(screen.getByText(/2024-07-24/)).toBeInTheDocument();
  });
});
