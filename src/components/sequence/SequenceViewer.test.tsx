import { render, screen, fireEvent } from "@testing-library/react";
import { SequenceViewer } from "./SequenceViewer";
import { SEQUENCE, MUTATION, COLORS } from "@/constants/protein-data";

const defaultProps = {
  selectedResidue: null as number | null,
  hoveredResidue: null as number | null,
  onResidueClick: vi.fn(),
  onResidueHover: vi.fn(),
  viewMode: "wt" as const,
};

describe("SequenceViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──

  it("renders all 437 residue cells", () => {
    render(<SequenceViewer {...defaultProps} />);
    const firstCell = screen.getByTestId("residue-1");
    const lastCell = screen.getByTestId("residue-437");
    expect(firstCell).toBeInTheDocument();
    expect(lastCell).toBeInTheDocument();
    // Spot check total count
    const cells = screen.getAllByTestId(/^residue-\d+$/);
    expect(cells).toHaveLength(437);
  });

  it("first residue is 'M' at position 1", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-1");
    expect(cell).toHaveTextContent("M");
  });

  it("last residue matches SEQUENCE at position 437", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-437");
    expect(cell).toHaveTextContent(SEQUENCE[436]);
  });

  // ── Domain Coloring ──

  it("position 1 cell has extracellular color", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-1");
    expect(cell).toHaveStyle({ backgroundColor: COLORS.extracellular });
  });

  it("position 318 cell has transmembrane color", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-318");
    expect(cell).toHaveStyle({ backgroundColor: COLORS.transmembrane });
  });

  it("position 437 cell has cytoplasmic color", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-437");
    expect(cell).toHaveStyle({ backgroundColor: COLORS.cytoplasmic });
  });

  // ── Mutation Annotations ──

  it("position 37 is visually marked as frameshift site", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-37");
    // Mutation site overrides domain color with warn color
    expect(cell).toHaveStyle({ backgroundColor: COLORS.warn });
  });

  it("position 68 is visually marked as PTC", () => {
    render(<SequenceViewer {...defaultProps} />);
    const cell = screen.getByTestId("residue-68");
    expect(cell).toHaveStyle({ backgroundColor: COLORS.danger });
  });

  it("positions 38-67 show aberrant region styling", () => {
    render(<SequenceViewer {...defaultProps} />);
    const aberrantCell = screen.getByTestId("residue-50");
    expect(aberrantCell).toHaveClass("aberrant");
  });

  it("renders mutation notation label", () => {
    render(<SequenceViewer {...defaultProps} />);
    expect(screen.getByText(MUTATION.notation)).toBeInTheDocument();
  });

  // ── Legend ──

  it("renders domain color legend", () => {
    render(<SequenceViewer {...defaultProps} />);
    expect(screen.getByText("Extracellular")).toBeInTheDocument();
    expect(screen.getByText("Transmembrane")).toBeInTheDocument();
    expect(screen.getByText("Cytoplasmic")).toBeInTheDocument();
  });

  // ── Interaction ──

  it("clicking residue calls onResidueClick with 1-indexed position", () => {
    const onClick = vi.fn();
    render(<SequenceViewer {...defaultProps} onResidueClick={onClick} />);
    fireEvent.click(screen.getByTestId("residue-100"));
    expect(onClick).toHaveBeenCalledWith(100);
  });

  it("hovering residue calls onResidueHover with position and null", () => {
    const onHover = vi.fn();
    render(<SequenceViewer {...defaultProps} onResidueHover={onHover} />);
    const cell = screen.getByTestId("residue-200");
    fireEvent.mouseEnter(cell);
    expect(onHover).toHaveBeenCalledWith(200);
    fireEvent.mouseLeave(cell);
    expect(onHover).toHaveBeenCalledWith(null);
  });

  // ── Scroll Fade ──

  it("renders scroll fade hint on right side", () => {
    render(<SequenceViewer {...defaultProps} />);
    const scrollContainer = screen.getByRole("region");
    const parent = scrollContainer.parentElement!;
    const fade = parent.querySelector("[data-testid='scroll-fade']");
    expect(fade).not.toBeNull();
  });

  // ── Scroll Sync ──

  it("scrolls to selected residue when selectedResidue changes", () => {
    const { rerender } = render(<SequenceViewer {...defaultProps} />);
    rerender(<SequenceViewer {...defaultProps} selectedResidue={200} />);
    const cell = screen.getByTestId("residue-200");
    expect(cell.scrollIntoView).toHaveBeenCalled();
  });
});
