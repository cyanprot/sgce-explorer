import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  const onStepClick = vi.fn();

  beforeEach(() => {
    onStepClick.mockClear();
  });

  it("renders 7 step indicators", () => {
    render(<ProgressBar activeStep={0} onStepClick={onStepClick} />);
    const indicators = screen.getAllByTestId(/^step-/);
    expect(indicators).toHaveLength(7);
  });

  it("calls onStepClick with step index when clicked", () => {
    render(<ProgressBar activeStep={0} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByTestId("step-3"));
    expect(onStepClick).toHaveBeenCalledWith(3);
  });

  it("marks active step with accent fill", () => {
    const { container } = render(
      <ProgressBar activeStep={2} onStepClick={onStepClick} />
    );
    const circles = container.querySelectorAll("circle");
    // Step 2 (3rd circle) should be active
    expect(circles[2].getAttribute("fill")).toContain("60a5fa"); // COLORS.accent
  });

  it("marks completed steps (before active) with accentDim fill", () => {
    const { container } = render(
      <ProgressBar activeStep={3} onStepClick={onStepClick} />
    );
    const circles = container.querySelectorAll("circle");
    // Steps 0,1,2 are completed
    expect(circles[0].getAttribute("fill")).toContain("1e3a5f"); // COLORS.accentDim
    expect(circles[1].getAttribute("fill")).toContain("1e3a5f");
    expect(circles[2].getAttribute("fill")).toContain("1e3a5f");
  });

  it("marks future steps with panel fill", () => {
    const { container } = render(
      <ProgressBar activeStep={0} onStepClick={onStepClick} />
    );
    const circles = container.querySelectorAll("circle");
    // Steps 1-6 are future
    expect(circles[1].getAttribute("fill")).toContain("131826"); // COLORS.panel
  });

  it("connecting lines between steps exist", () => {
    const { container } = render(
      <ProgressBar activeStep={0} onStepClick={onStepClick} />
    );
    // 6 lines connecting 7 steps
    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(6);
  });
});
