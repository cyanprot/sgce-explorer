import { render, screen, fireEvent } from "@testing-library/react";
import { ResidueCell } from "./ResidueCell";

const defaultProps = {
  residue: "V",
  position: 37,
  color: "#3b82f6",
  isSelected: false,
  isHovered: false,
  isMutationSite: false,
  isPTC: false,
  isAberrant: false,
  onClick: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
};

function renderCell(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<ResidueCell {...props} />);
}

describe("ResidueCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the residue character", () => {
    renderCell({ residue: "M", position: 1 });
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("has data-testid='residue-{position}'", () => {
    renderCell({ position: 42 });
    expect(screen.getByTestId("residue-42")).toBeInTheDocument();
  });

  it("applies domain color as background", () => {
    renderCell({ color: "#8b5cf6" });
    const cell = screen.getByTestId("residue-37");
    expect(cell.style.backgroundColor).toBe("rgb(139, 92, 246)");
  });

  it("shows selected state styling when isSelected", () => {
    renderCell({ isSelected: true });
    const cell = screen.getByTestId("residue-37");
    expect(cell.className).toContain("selected");
  });

  it("shows hovered state styling when isHovered", () => {
    renderCell({ isHovered: true });
    const cell = screen.getByTestId("residue-37");
    expect(cell.className).toContain("hovered");
  });

  it("mutation marker overrides domain color when isMutationSite", () => {
    renderCell({ isMutationSite: true, color: "#3b82f6" });
    const cell = screen.getByTestId("residue-37");
    // Mutation site should use warn color (#fbbf24), not the domain color
    expect(cell.style.backgroundColor).toBe("rgb(251, 191, 36)");
  });

  it("PTC marker styling when isPTC", () => {
    renderCell({ isPTC: true, position: 68, color: "#3b82f6" });
    const cell = screen.getByTestId("residue-68");
    // PTC should use danger color (#ef4444)
    expect(cell.style.backgroundColor).toBe("rgb(239, 68, 68)");
  });

  it("aberrant region styling when isAberrant", () => {
    renderCell({ isAberrant: true, position: 50 });
    const cell = screen.getByTestId("residue-50");
    expect(cell.className).toContain("aberrant");
  });

  it("calls onClick(position) on click", () => {
    const onClick = vi.fn();
    renderCell({ onClick, position: 100 });
    fireEvent.click(screen.getByTestId("residue-100"));
    expect(onClick).toHaveBeenCalledWith(100);
  });

  it("calls onMouseEnter/onMouseLeave on hover", () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    renderCell({ onMouseEnter, onMouseLeave, position: 200 });
    const cell = screen.getByTestId("residue-200");
    fireEvent.mouseEnter(cell);
    expect(onMouseEnter).toHaveBeenCalledWith(200);
    fireEvent.mouseLeave(cell);
    expect(onMouseLeave).toHaveBeenCalledOnce();
  });
});
