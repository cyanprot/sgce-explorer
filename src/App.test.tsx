import { render, screen, fireEvent } from "@testing-library/react";
import App from "@/App";

// Mock 3Dmol.js (requires WebGL, unavailable in jsdom)
vi.mock("3dmol", () => ({
  createViewer: vi.fn(() => ({
    addModel: vi.fn(() => ({
      selectedAtoms: vi.fn(() => [{ x: 10, y: 20, z: 30 }]),
    })),
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
  })),
}));

// Mock useProteinData to avoid real fetch
vi.mock("@/hooks/useProteinData", () => ({
  useProteinData: vi.fn(() => ({
    pdbData: "HEADER mock\nATOM 1 N ALA A 1",
    loading: false,
    error: null,
  })),
}));

describe("App", () => {
  it("renders all 4 tab buttons with correct labels", () => {
    render(<App />);
    expect(screen.getByText("3D Structure")).toBeInTheDocument();
    expect(screen.getByText("Central Dogma")).toBeInTheDocument();
    expect(screen.getByText("Imprinting")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
  });

  it("shows mutation notation in header", () => {
    render(<App />);
    expect(screen.getByText(/c\.108dup/)).toBeInTheDocument();
    expect(screen.getAllByText(/p\.Val37SerfsTer32/).length).toBeGreaterThanOrEqual(1);
  });

  it("defaults to structure tab with ProteinStructure3D content", () => {
    render(<App />);
    expect(screen.getAllByText(/Wild-type/).length).toBeGreaterThan(0);
  });

  it("switches to Central Dogma tab on click", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Central Dogma"));
    expect(screen.getByText(/Prev/)).toBeInTheDocument();
    expect(screen.getByText(/Play/)).toBeInTheDocument();
    // Structure content should be gone
    expect(screen.queryAllByText(/Wild-type/)).toHaveLength(0);
  });

  it("switches to Imprinting tab on click", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Imprinting"));
    expect(screen.getByText("Both alleles")).toBeInTheDocument();
    // Structure content should be gone
    expect(screen.queryAllByText(/Wild-type/)).toHaveLength(0);
  });

  it("Structure tab renders SequenceViewer with residue cells", () => {
    render(<App />);
    // On structure tab by default — SequenceViewer should render residues
    expect(screen.getByTestId("residue-1")).toBeInTheDocument();
    expect(screen.getByTestId("residue-437")).toBeInTheDocument();
  });

  it("other tabs do not render SequenceViewer", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Central Dogma"));
    expect(screen.queryByTestId("residue-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Imprinting"));
    expect(screen.queryByTestId("residue-1")).not.toBeInTheDocument();
  });

  it("switches to Research tab on click", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Research"));
    expect(screen.getByTestId("research-panel")).toBeInTheDocument();
    // Structure content should be gone
    expect(screen.queryAllByText(/Wild-type/)).toHaveLength(0);
  });

  it("hides previous tab content when switching tabs", () => {
    render(<App />);
    // Start on structure
    expect(screen.getAllByText(/Wild-type/).length).toBeGreaterThan(0);

    // Switch to Central Dogma
    fireEvent.click(screen.getByText("Central Dogma"));
    expect(screen.queryAllByText(/Wild-type/)).toHaveLength(0);
    expect(screen.queryByText("Both alleles")).not.toBeInTheDocument();

    // Switch to Imprinting
    fireEvent.click(screen.getByText("Imprinting"));
    expect(screen.queryByText(/Prev/)).not.toBeInTheDocument();
    expect(screen.getByText("Both alleles")).toBeInTheDocument();
  });
});
