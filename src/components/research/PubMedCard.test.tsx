import { render, screen, fireEvent } from "@testing-library/react";
import { PubMedCard } from "./PubMedCard";
import type { PubMedArticle } from "@/types/research";

const mockArticles: PubMedArticle[] = [
  {
    pmid: "11111",
    title: "SGCE mutations in dystonia",
    authors: ["Smith J", "Doe A", "Park K", "Lee M", "Kim S"],
    journal: "Neurology",
    pubDate: "2024 Jan",
    doi: "10.1234/neuro.2024",
  },
  {
    pmid: "22222",
    title: "Myoclonus-dystonia review",
    authors: ["Park K"],
    journal: "Movement Disorders",
    pubDate: "2023 Dec",
    doi: "",
  },
];

describe("PubMedCard", () => {
  it("renders loading state", () => {
    render(<PubMedCard articles={null} loading={true} error={null} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state with message", () => {
    render(
      <PubMedCard articles={null} loading={false} error="Network error" />,
    );
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders empty state when data is empty array", () => {
    render(<PubMedCard articles={[]} loading={false} error={null} />);
    expect(screen.getByText("No articles found")).toBeInTheDocument();
  });

  it("renders article titles as PubMed links", () => {
    render(
      <PubMedCard articles={mockArticles} loading={false} error={null} />,
    );

    const link1 = screen.getByText("SGCE mutations in dystonia");
    expect(link1.closest("a")).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/11111/",
    );
    expect(link1.closest("a")).toHaveAttribute("target", "_blank");
    expect(link1.closest("a")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );

    const link2 = screen.getByText("Myoclonus-dystonia review");
    expect(link2.closest("a")).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/22222/",
    );
  });

  it("truncates authors after 3 with '+N more'", () => {
    render(
      <PubMedCard articles={mockArticles} loading={false} error={null} />,
    );

    // First article has 5 authors — show 3 + "+2 more"
    expect(screen.getByText(/Smith J/)).toBeInTheDocument();
    expect(screen.getByText(/\+2 more/)).toBeInTheDocument();

    // Second article has 1 author — no truncation (exact match to avoid first article's truncated list)
    const authorElements = screen.getAllByText(/Park K/);
    expect(authorElements).toHaveLength(2); // once in truncated list, once standalone
  });

  it("shows journal and date", () => {
    render(
      <PubMedCard articles={mockArticles} loading={false} error={null} />,
    );

    expect(screen.getByText(/Neurology/)).toBeInTheDocument();
    expect(screen.getByText(/2024 Jan/)).toBeInTheDocument();
    expect(screen.getByText(/Movement Disorders/)).toBeInTheDocument();
    expect(screen.getByText(/2023 Dec/)).toBeInTheDocument();
  });

  it("renders sort control", () => {
    render(
      <PubMedCard articles={mockArticles} loading={false} error={null} />,
    );
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
  });

  it("relevance sort reorders articles by keyword match", () => {
    const articles: PubMedArticle[] = [
      { pmid: "1", title: "Unrelated protein study", authors: [], journal: "J", pubDate: "2024", doi: "" },
      { pmid: "2", title: "SGCE sarcoglycan mutation analysis", authors: [], journal: "J", pubDate: "2023", doi: "" },
    ];
    render(<PubMedCard articles={articles} loading={false} error={null} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Unrelated protein study");

    fireEvent.click(screen.getByText(/Relevance/i));
    const reordered = screen.getAllByRole("listitem");
    expect(reordered[0]).toHaveTextContent("SGCE sarcoglycan mutation analysis");
  });

  it("renders DOI link when available", () => {
    render(
      <PubMedCard articles={mockArticles} loading={false} error={null} />,
    );

    const doiLink = screen.getByText("10.1234/neuro.2024");
    expect(doiLink.closest("a")).toHaveAttribute(
      "href",
      "https://doi.org/10.1234/neuro.2024",
    );

    // Second article has no DOI — should not render a DOI link for it
    const allDoiLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.includes("doi.org"));
    expect(allDoiLinks).toHaveLength(1);
  });
});
