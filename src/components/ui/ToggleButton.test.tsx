import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleButton } from "./ToggleButton";
import { COLORS } from "@/constants/protein-data";

describe("ToggleButton", () => {
  const color = "#22c55e";

  it("renders label text", () => {
    render(<ToggleButton active={false} onClick={() => {}} label="Test Label" color={color} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const handler = vi.fn();
    render(<ToggleButton active={false} onClick={handler} label="Click me" color={color} />);
    fireEvent.click(screen.getByText("Click me"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("applies active styles when active", () => {
    render(<ToggleButton active={true} onClick={() => {}} label="Active" color={color} />);
    const btn = screen.getByText("Active");
    // jsdom converts hex+alpha to rgba; just check it contains the color channel values
    expect(btn.style.background).toContain("34, 197, 94");
    expect(btn.style.color).toBe("rgb(34, 197, 94)");
    expect(btn.style.borderColor).toBe("rgb(34, 197, 94)");
  });

  it("applies inactive styles when not active", () => {
    render(<ToggleButton active={false} onClick={() => {}} label="Inactive" color={color} />);
    const btn = screen.getByText("Inactive");
    expect(btn.style.background).toBe("transparent");
    // jsdom converts hex to rgb
    expect(btn.style.color).toBe("rgb(138, 160, 189)");
    expect(btn.style.borderColor).toBe("rgb(30, 53, 85)");
  });
});
