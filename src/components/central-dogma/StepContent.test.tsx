import { render, screen } from "@testing-library/react";
import { StepContent } from "./StepContent";
import { CENTRAL_DOGMA_STEPS } from "@/constants/protein-data";

describe("StepContent", () => {
  const step0 = CENTRAL_DOGMA_STEPS[0];
  const step1 = CENTRAL_DOGMA_STEPS[1];

  it("renders title, subtitle, detail, and mutation note", () => {
    render(<StepContent step={step0} />);
    expect(screen.getByText(step0.title)).toBeInTheDocument();
    expect(screen.getByText(step0.subtitle)).toBeInTheDocument();
    expect(screen.getByText(step0.detail)).toBeInTheDocument();
    expect(screen.getByText(step0.mutationNote)).toBeInTheDocument();
  });

  it("renders different step content independently", () => {
    const { unmount } = render(<StepContent step={step0} />);
    expect(screen.getByText(step0.title)).toBeInTheDocument();
    unmount();

    render(<StepContent step={step1} />);
    expect(screen.getByText(step1.title)).toBeInTheDocument();
    expect(screen.getByText(step1.subtitle)).toBeInTheDocument();
  });

  it("shows mutation notation in danger card", () => {
    render(<StepContent step={step0} />);
    expect(screen.getAllByText(/c\.108dup/).length).toBeGreaterThanOrEqual(1);
  });
});
