import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DGCLegend } from "./DGCLegend";
import type { DGCPartnerState } from "@/hooks/useDGCProteins";

const makePartner = (
  overrides: Partial<DGCPartnerState> = {},
): DGCPartnerState => ({
  gene: "SGCB",
  name: "β-Sarcoglycan",
  color: "#06b6d4",
  xOffset: -30,
  pdbData: null,
  loading: false,
  error: null,
  ...overrides,
});

const loaded = (p: Partial<DGCPartnerState> = {}) =>
  makePartner({ pdbData: "ATOM  ...", loading: false, ...p });

const allPartners: DGCPartnerState[] = [
  loaded({ gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30 }),
  loaded({ gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10 }),
  loaded({ gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30 }),
];

describe("DGCLegend", () => {
  it("renders all 4 sarcoglycan names (β, γ, δ, ε)", () => {
    render(<DGCLegend partners={allPartners} showMutant={false} />);
    expect(screen.getByText("β-Sarcoglycan")).toBeInTheDocument();
    expect(screen.getByText("γ-Sarcoglycan")).toBeInTheDocument();
    expect(screen.getByText("δ-Sarcoglycan")).toBeInTheDocument();
    expect(screen.getByText("ε-Sarcoglycan")).toBeInTheDocument();
  });

  it("renders color indicators for each partner", () => {
    render(<DGCLegend partners={allPartners} showMutant={false} />);
    const dots = screen.getAllByTestId("sgc-color-dot");
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveStyle({ backgroundColor: "#06b6d4" }); // β
    expect(dots[1]).toHaveStyle({ backgroundColor: "#a78bfa" }); // γ
    expect(dots[2]).toHaveStyle({ backgroundColor: "#fb923c" }); // δ
  });

  it("shows loading spinner for partners still loading", () => {
    const partners = [
      makePartner({ gene: "SGCB", name: "β-Sarcoglycan", loading: true }),
      loaded({ gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10 }),
      loaded({ gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30 }),
    ];
    render(<DGCLegend partners={partners} showMutant={false} />);
    expect(screen.getByTestId("sgc-loading-SGCB")).toBeInTheDocument();
    expect(screen.queryByTestId("sgc-loading-SGCG")).not.toBeInTheDocument();
  });

  it("shows checkmark for loaded partners", () => {
    render(<DGCLegend partners={allPartners} showMutant={false} />);
    const checks = screen.getAllByTestId(/^sgc-loaded-/);
    // β, γ, δ loaded + ε always loaded = 4
    expect(checks).toHaveLength(4);
  });

  it("shows error indicator for failed partners", () => {
    const partners = [
      makePartner({ gene: "SGCB", name: "β-Sarcoglycan", error: "HTTP 500" }),
      loaded({ gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10 }),
      loaded({ gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30 }),
    ];
    render(<DGCLegend partners={partners} showMutant={false} />);
    expect(screen.getByTestId("sgc-error-SGCB")).toBeInTheDocument();
    expect(screen.queryByTestId("sgc-error-SGCG")).not.toBeInTheDocument();
  });

  it("shows disruption note in mutant mode", () => {
    render(<DGCLegend partners={allPartners} showMutant={true} />);
    expect(screen.getByText(/subcomplex disrupted/i)).toBeInTheDocument();
  });

  it("does not show disruption note in WT mode", () => {
    render(<DGCLegend partners={allPartners} showMutant={false} />);
    expect(screen.queryByText(/subcomplex disrupted/i)).not.toBeInTheDocument();
  });

  it("renders title 'Sarcoglycan Subcomplex'", () => {
    render(<DGCLegend partners={allPartners} showMutant={false} />);
    expect(screen.getByText("Sarcoglycan Subcomplex")).toBeInTheDocument();
  });
});
