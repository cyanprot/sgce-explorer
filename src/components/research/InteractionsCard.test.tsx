import { render, screen } from "@testing-library/react";
import { InteractionsCard } from "./InteractionsCard";
import type { StringInteraction } from "@/types/research";

const mockInteractions: StringInteraction[] = [
  {
    preferredName_A: "SGCE",
    preferredName_B: "SGCB",
    ncbiTaxonId: 9606,
    score: 0.999,
    escore: 0.874,
    dscore: 0.9,
  },
  {
    preferredName_A: "SGCE",
    preferredName_B: "SGCG",
    ncbiTaxonId: 9606,
    score: 0.965,
    escore: 0.8,
    dscore: 0.85,
  },
  {
    preferredName_A: "SGCE",
    preferredName_B: "DAG1",
    ncbiTaxonId: 9606,
    score: 0.91,
    escore: 0.7,
    dscore: 0.8,
  },
  {
    preferredName_A: "SGCE",
    preferredName_B: "TP53",
    ncbiTaxonId: 9606,
    score: 0.45,
    escore: 0.3,
    dscore: 0.2,
  },
];

describe("InteractionsCard", () => {
  it("renders loading state", () => {
    render(
      <InteractionsCard interactions={null} loading={true} error={null} />,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <InteractionsCard
        interactions={null}
        loading={false}
        error="STRING DB unavailable"
      />,
    );
    expect(screen.getByText("STRING DB unavailable")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(
      <InteractionsCard interactions={null} loading={false} error={null} />,
    );
    expect(screen.getByText("No interaction data")).toBeInTheDocument();
  });

  it("renders partner names (shows non-SGCE protein)", () => {
    render(
      <InteractionsCard
        interactions={mockInteractions}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("SGCB")).toBeInTheDocument();
    expect(screen.getByText("SGCG")).toBeInTheDocument();
    expect(screen.getByText("DAG1")).toBeInTheDocument();
    expect(screen.getByText("TP53")).toBeInTheDocument();
  });

  it("renders score bars with correct width percentage", () => {
    const { container } = render(
      <InteractionsCard
        interactions={mockInteractions}
        loading={false}
        error={null}
      />,
    );
    const bars = container.querySelectorAll("[data-testid='score-bar']");
    expect(bars).toHaveLength(4);
    expect((bars[0] as HTMLElement).style.width).toBe("99.9%");
    expect((bars[1] as HTMLElement).style.width).toBe("96.5%");
  });

  it("highlights DGC complex members (SGCB, SGCG, DAG1)", () => {
    render(
      <InteractionsCard
        interactions={mockInteractions}
        loading={false}
        error={null}
      />,
    );
    // DGC members should have a "DGC" badge
    const dgcBadges = screen.getAllByText("DGC");
    // SGCB, SGCG, DAG1 are DGC members; TP53 is not
    expect(dgcBadges).toHaveLength(3);
  });

  it("renders score values as text", () => {
    render(
      <InteractionsCard
        interactions={mockInteractions}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("0.999")).toBeInTheDocument();
    expect(screen.getByText("0.965")).toBeInTheDocument();
    expect(screen.getByText("0.910")).toBeInTheDocument();
    expect(screen.getByText("0.450")).toBeInTheDocument();
  });
});
