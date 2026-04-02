import { render, screen } from "@testing-library/react";
import { PharmacologyCard } from "./PharmacologyCard";
import type { ChEMBLActivity } from "@/types/research";

const mockActivities: ChEMBLActivity[] = [
  {
    moleculeChemblId: "CHEMBL1234",
    moleculeName: "COMPOUND A",
    targetChemblId: "CHEMBL2111389",
    standardType: "IC50",
    standardValue: 100.0,
    standardUnits: "nM",
  },
  {
    moleculeChemblId: "CHEMBL5678",
    moleculeName: "COMPOUND B",
    targetChemblId: "CHEMBL2111389",
    standardType: "Ki",
    standardValue: null,
    standardUnits: "nM",
  },
];

describe("PharmacologyCard", () => {
  it("renders loading state", () => {
    render(
      <PharmacologyCard activities={null} loading={true} error={null} />,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <PharmacologyCard
        activities={null}
        loading={false}
        error="ChEMBL unavailable"
      />,
    );
    expect(screen.getByText("ChEMBL unavailable")).toBeInTheDocument();
  });

  it("renders empty state when data is empty array", () => {
    render(
      <PharmacologyCard activities={[]} loading={false} error={null} />,
    );
    expect(screen.getByText("No activities found")).toBeInTheDocument();
  });

  it("renders molecule names and activity types", () => {
    render(
      <PharmacologyCard
        activities={mockActivities}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("COMPOUND A")).toBeInTheDocument();
    expect(screen.getByText("COMPOUND B")).toBeInTheDocument();
    expect(screen.getByText("IC50")).toBeInTheDocument();
    expect(screen.getByText("Ki")).toBeInTheDocument();
  });

  it("renders values with units", () => {
    render(
      <PharmacologyCard
        activities={mockActivities}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("100 nM")).toBeInTheDocument();
  });

  it('renders "N/A" when standardValue is null', () => {
    render(
      <PharmacologyCard
        activities={mockActivities}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
