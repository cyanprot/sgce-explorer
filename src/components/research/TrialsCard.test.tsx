import { render, screen } from "@testing-library/react";
import { TrialsCard } from "./TrialsCard";
import { COLORS } from "@/constants/protein-data";
import type { ClinicalTrial } from "@/types/research";

const mockTrials: ClinicalTrial[] = [
  {
    nctId: "NCT12345678",
    title: "DBS for Myoclonus-Dystonia",
    status: "RECRUITING",
    phase: "PHASE2, PHASE3",
    conditions: ["Myoclonus-Dystonia", "DYT-SGCE"],
    interventions: ["Deep Brain Stimulation"],
    url: "https://clinicaltrials.gov/study/NCT12345678",
  },
  {
    nctId: "NCT87654321",
    title: "Natural History of SGCE",
    status: "COMPLETED",
    phase: "NA",
    conditions: ["SGCE Mutation"],
    interventions: [],
    url: "https://clinicaltrials.gov/study/NCT87654321",
  },
];

describe("TrialsCard", () => {
  it("renders loading state", () => {
    render(<TrialsCard trials={null} loading={true} error={null} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <TrialsCard trials={null} loading={false} error="API unavailable" />,
    );
    expect(screen.getByText("API unavailable")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<TrialsCard trials={[]} loading={false} error={null} />);
    expect(screen.getByText("No trials found")).toBeInTheDocument();
  });

  it("renders trial titles as links to clinicaltrials.gov", () => {
    render(<TrialsCard trials={mockTrials} loading={false} error={null} />);

    const link1 = screen.getByText("DBS for Myoclonus-Dystonia");
    expect(link1.closest("a")).toHaveAttribute(
      "href",
      "https://clinicaltrials.gov/study/NCT12345678",
    );
    expect(link1.closest("a")).toHaveAttribute("target", "_blank");
    expect(link1.closest("a")).toHaveAttribute("rel", "noopener noreferrer");

    const link2 = screen.getByText("Natural History of SGCE");
    expect(link2.closest("a")).toHaveAttribute(
      "href",
      "https://clinicaltrials.gov/study/NCT87654321",
    );
  });

  it("renders status badges with correct colors (RECRUITING=green, COMPLETED=gray)", () => {
    render(<TrialsCard trials={mockTrials} loading={false} error={null} />);

    const recruitingBadge = screen.getByText("RECRUITING");
    expect(recruitingBadge).toHaveStyle({ color: COLORS.active });

    const completedBadge = screen.getByText("COMPLETED");
    expect(completedBadge).toHaveStyle({ color: COLORS.silenced });
  });

  it("ACTIVE_NOT_RECRUITING uses COLORS.accent not COLORS.extracellular", () => {
    const trial: ClinicalTrial = {
      nctId: "NCT99999999",
      title: "Active Not Recruiting Trial",
      status: "ACTIVE_NOT_RECRUITING",
      phase: "PHASE3",
      conditions: ["DYT-SGCE"],
      interventions: [],
      url: "https://clinicaltrials.gov/study/NCT99999999",
    };
    render(<TrialsCard trials={[trial]} loading={false} error={null} />);
    const badge = screen.getByText("ACTIVE_NOT_RECRUITING");
    expect(badge).toHaveStyle({ color: COLORS.accent });
  });

  it("renders phase and conditions", () => {
    render(<TrialsCard trials={mockTrials} loading={false} error={null} />);

    expect(screen.getByText(/PHASE2, PHASE3/)).toBeInTheDocument();
    // "Myoclonus-Dystonia" appears in both title and conditions
    expect(screen.getAllByText(/Myoclonus-Dystonia/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Myoclonus-Dystonia, DYT-SGCE/)).toBeInTheDocument();
    expect(screen.getByText(/SGCE Mutation/)).toBeInTheDocument();
  });
});
