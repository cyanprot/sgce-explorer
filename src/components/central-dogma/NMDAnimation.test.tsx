import { render, screen } from "@testing-library/react";
import { act } from "react";
import { NMDAnimation } from "./NMDAnimation";

describe("NMDAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders mRNA with EJC markers", () => {
    render(<NMDAnimation active={true} onComplete={vi.fn()} />);
    expect(screen.getByTestId("nmd-mrna")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^ejc-/).length).toBeGreaterThan(0);
  });

  it("shows sub-step labels as time progresses", () => {
    render(<NMDAnimation active={true} onComplete={vi.fn()} />);
    // First sub-step should be visible immediately
    expect(screen.getByText("PTC Recognition")).toBeInTheDocument();

    // Advance to sub-step 2
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("UPF1 Recruitment")).toBeInTheDocument();
  });

  it("shows UPF1 protein after recruitment sub-step", () => {
    render(<NMDAnimation active={true} onComplete={vi.fn()} />);
    // Initially no UPF1
    expect(screen.queryByTestId("upf1")).not.toBeInTheDocument();

    // Advance past sub-step 1
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId("upf1")).toBeInTheDocument();
  });

  it("calls onComplete after all sub-steps", () => {
    const onComplete = vi.fn();
    render(<NMDAnimation active={true} onComplete={onComplete} />);

    // 4 sub-steps × 1500ms = 6000ms total
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when not active", () => {
    const { container } = render(
      <NMDAnimation active={false} onComplete={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("cleans up timers on unmount", () => {
    const { unmount } = render(
      <NMDAnimation active={true} onComplete={vi.fn()} />
    );
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
