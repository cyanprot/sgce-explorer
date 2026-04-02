import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useProteinData } from "@/hooks/useProteinData";

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
    zoomTo: vi.fn(),
    render: vi.fn(),
    spin: vi.fn(),
    resize: vi.fn(),
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
  })),
}));

import { ProteinStructure3D } from "@/components/ProteinStructure3D";

const mockUseProteinData = useProteinData as ReturnType<typeof vi.fn>;

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

  it("shows Extracellular label in DomainBar in WT mode", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    expect(screen.getByText("Extracellular")).toBeInTheDocument();
  });

  it("shows Frameshifted label in DomainBar in mutant mode", () => {
    mockUseProteinData.mockReturnValue({ pdbData: "HEADER mock pdb", loading: false, error: null });
    render(<ProteinStructure3D />);
    fireEvent.click(screen.getByText("Mutant (68 aa)"));
    expect(screen.getByText("Frameshifted")).toBeInTheDocument();
  });
});
