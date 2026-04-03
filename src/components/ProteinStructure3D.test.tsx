import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useProteinData } from "@/hooks/useProteinData";
import { useDGCProteins } from "@/hooks/useDGCProteins";

// Mock 3dmol before component import
vi.mock("3dmol", () => {
  const mockModel = {
    selectedAtoms: vi.fn(() => [{ x: 10, y: 20, z: 30 }]),
    setStyle: vi.fn(),
  };
  const mockViewer = {
    addModel: vi.fn(() => mockModel),
    setStyle: vi.fn(),
    removeAllModels: vi.fn(),
    removeAllShapes: vi.fn(),
    removeAllLabels: vi.fn(),
    addSphere: vi.fn(),
    addLabel: vi.fn(),
    addBox: vi.fn(),
    zoomTo: vi.fn(),
    render: vi.fn(),
    spin: vi.fn(),
    resize: vi.fn(),
    setClickable: vi.fn(),
  };
  return {
    createViewer: vi.fn(() => mockViewer),
    __mockViewer: mockViewer,
    __mockModel: mockModel,
  };
});

vi.mock("@/hooks/useProteinData", () => ({
  useProteinData: vi.fn(() => ({
    pdbData: null,
    loading: true,
    error: null,
    retry: vi.fn(),
  })),
}));

vi.mock("@/hooks/useDGCProteins", () => ({
  useDGCProteins: vi.fn(() => ({
    partners: [
      { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: null, loading: false, error: null },
      { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: null, loading: false, error: null },
      { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: null, loading: false, error: null },
    ],
    allLoaded: false,
    anyLoading: false,
    retry: vi.fn(),
  })),
}));

import { ProteinStructure3D } from "@/components/ProteinStructure3D";

const mockUseProteinData = useProteinData as ReturnType<typeof vi.fn>;
const mockUseDGCProteins = useDGCProteins as ReturnType<typeof vi.fn>;

describe("ProteinStructure3D", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading indicator when loading", () => {
    mockUseProteinData.mockReturnValue({ pdbData: null, loading: true, error: null });
    render(<ProteinStructure3D />);
    expect(screen.getByText("Loading AlphaFold PDB...")).toBeInTheDocument();
  });

  it("shows error message when error occurs", () => {
    mockUseProteinData.mockReturnValue({ pdbData: null, loading: false, error: "Network error" });
    render(<ProteinStructure3D />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows WT overlay by default when data is loaded", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    expect(screen.getByText(/Wild-type ε-Sarcoglycan — 437 aa/)).toBeInTheDocument();
  });

  it("switches to mutant overlay when clicking Mutant button", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("Mutant (68 aa)"));
    expect(screen.getByText(/Truncated — 68 aa/)).toBeInTheDocument();
  });

  it("shows 15.6% in mutant overlay", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("Mutant (68 aa)"));
    expect(screen.getByText(/15\.6%/)).toBeInTheDocument();
  });

  it("toggles back to WT from mutant mode", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("Mutant (68 aa)"));
    expect(screen.getByText(/Truncated — 68 aa/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Wild-type (437 aa)"));
    expect(screen.getByText(/Wild-type ε-Sarcoglycan — 437 aa/)).toBeInTheDocument();
  });

  it("domain bar labels use minimum 10px font", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    const extLabel = screen.getAllByText("Extracellular")[0];
    expect(extLabel.className).toContain("text-[10px]");
    expect(extLabel.className).not.toContain("text-[9px]");
  });

  it("shows Extracellular label in DomainBar in WT mode", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    expect(screen.getAllByText("Extracellular").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Frameshifted label in DomainBar in mutant mode", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("Mutant (68 aa)"));
    expect(screen.getByText("Frameshifted")).toBeInTheDocument();
  });

  // ── SequenceViewer Integration ──

  it("renders SequenceViewer with residue cells", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    expect(screen.getByTestId("residue-1")).toBeInTheDocument();
    expect(screen.getByTestId("residue-437")).toBeInTheDocument();
  });

  it("passes viewMode to SequenceViewer showing mutation notation", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    expect(screen.getByText("p.Val37SerfsTer32")).toBeInTheDocument();
  });

  it("DGC Complex button is enabled and toggleable", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    const dgcBtn = screen.getByText("DGC Complex");
    expect(dgcBtn).not.toBeDisabled();
    expect(dgcBtn).not.toHaveAttribute("title", "Coming soon");
  });

  it("clicking DGC toggle renders DGCLegend", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: "ATOM  mock", loading: false, error: null },
      ],
      allLoaded: true,
      anyLoading: false,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex"));
    expect(screen.getByText("Sarcoglycan Subcomplex")).toBeInTheDocument();
  });

  it("DGC mode: viewer.addModel called 4 times (ε + 3 partners)", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: "ATOM  mock", loading: false, error: null },
      ],
      allLoaded: true,
      anyLoading: false,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex"));
    await waitFor(() => {
      // ε-SG + β + γ + δ = 4 addModel calls
      expect(mockViewer.addModel.mock.calls.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("DGC mode: viewer.addBox called for membrane plane", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: "ATOM  mock", loading: false, error: null },
      ],
      allLoaded: true,
      anyLoading: false,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex"));
    await waitFor(() => {
      expect(mockViewer.addBox).toHaveBeenCalled();
    });
  });

  it("DGC mode: labels added for each subunit", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: "ATOM  mock", loading: false, error: null },
      ],
      allLoaded: true,
      anyLoading: false,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex"));
    await waitFor(() => {
      // At least 4 labels: one per subunit (ε, β, γ, δ)
      expect(mockViewer.addLabel.mock.calls.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("DGC + Mutant: shows truncated ε-SG with disruption note", async () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: "ATOM  mock", loading: false, error: null },
      ],
      allLoaded: true,
      anyLoading: false,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex"));
    fireEvent.click(screen.getByText("Mutant (68 aa)"));
    expect(screen.getByText(/subcomplex disrupted/i)).toBeInTheDocument();
  });

  it("DGC loading: shows DGCLegend with loading states", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: null, loading: true, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: null, loading: true, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: null, loading: true, error: null },
      ],
      allLoaded: false,
      anyLoading: true,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex"));
    expect(screen.getByText("Sarcoglycan Subcomplex")).toBeInTheDocument();
    expect(screen.getByTestId("sgc-loading-SGCB")).toBeInTheDocument();
  });

  it("DGC toggle off: removes partner models (removeAllModels called)", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    mockUseDGCProteins.mockReturnValue({
      partners: [
        { gene: "SGCB", name: "β-Sarcoglycan", color: "#06b6d4", xOffset: -30, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCG", name: "γ-Sarcoglycan", color: "#a78bfa", xOffset: -10, pdbData: "ATOM  mock", loading: false, error: null },
        { gene: "SGCD", name: "δ-Sarcoglycan", color: "#fb923c", xOffset: 30, pdbData: "ATOM  mock", loading: false, error: null },
      ],
      allLoaded: true,
      anyLoading: false,
      retry: vi.fn(),
    });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("DGC Complex")); // ON
    mockViewer.removeAllModels.mockClear();
    fireEvent.click(screen.getByText("DGC Complex")); // OFF
    await waitFor(() => {
      expect(mockViewer.removeAllModels).toHaveBeenCalled();
    });
  });

  it("has separator between view mode and option buttons", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    const controlBar = screen.getByText("Wild-type (437 aa)").closest(".flex") as HTMLElement;
    const separators = controlBar.querySelectorAll(".w-px");
    expect(separators.length).toBeGreaterThanOrEqual(1);
  });

  it("shows retry button on PDB error", () => {
    mockUseProteinData.mockReturnValue({ pdbData: null, loading: false, error: "Network error", retry: vi.fn() });
    render(<ProteinStructure3D />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("retry button calls retry function", () => {
    const retryFn = vi.fn();
    mockUseProteinData.mockReturnValue({ pdbData: null, loading: false, error: "Network error", retry: retryFn });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("Retry"));
    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  it("retry button is disabled while loading", () => {
    mockUseProteinData.mockReturnValue({ pdbData: null, loading: true, error: "Network error", retry: vi.fn() });
    render(<ProteinStructure3D />);
    const retryBtn = screen.queryByText("Retry");
    if (retryBtn) expect(retryBtn).toBeDisabled();
  });

  it("viewer container uses responsive classes instead of fixed inline calc", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    const container = screen.getByRole("img", { name: /3D protein structure/ })
      .closest(".flex.flex-col") as HTMLElement;
    // Should NOT have the old problematic fixed calc as inline style
    expect(container?.style.height).toBeFalsy();
    // Should have responsive min-height via Tailwind class
    expect(container?.className).toMatch(/min-h-/);
  });

  it("viewer container has min-height during loading state", () => {
    mockUseProteinData.mockReturnValue({ pdbData: null, loading: true, error: null });
    render(<ProteinStructure3D />);
    const container = screen.getByRole("img", { name: /3D protein structure/ })
      .closest(".flex.flex-col") as HTMLElement;
    expect(container?.className).toMatch(/min-h-/);
  });

  it("clicking atom in 3D selects residue in sequence", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);

    await waitFor(() => expect(mockViewer.setClickable).toHaveBeenCalled());
    const callback = mockViewer.setClickable.mock.calls[0][2];
    callback({ resi: 150 });

    await waitFor(() => {
      const cell = screen.getByTestId("residue-150");
      expect(cell.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("clicking atom with no resi does not crash", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);

    await waitFor(() => expect(mockViewer.setClickable).toHaveBeenCalled());
    const callback = mockViewer.setClickable.mock.calls[0][2];
    // Should not throw
    expect(() => callback({})).not.toThrow();
    expect(() => callback(null)).not.toThrow();
  });

  it("clicking a residue triggers 3D viewer zoomTo", async () => {
    const $3Dmol = await import("3dmol");
    const mockViewer = ($3Dmol as any).__mockViewer;
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByTestId("residue-100"));
    await waitFor(() => {
      expect(mockViewer.zoomTo).toHaveBeenCalled();
    });
  });
});
