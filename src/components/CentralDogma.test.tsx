import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { CentralDogma } from "./CentralDogma";
import { COLORS } from "@/constants/protein-data";

describe("CentralDogma", () => {
  it("renders initial state: step 1 content, counter, and mutation card", () => {
    render(<CentralDogma />);
    expect(screen.getByText(/1\. DNA/)).toBeInTheDocument();
    expect(screen.getByText("Step 1 / 7")).toBeInTheDocument();
    expect(screen.getAllByText(/c\.108dup/).length).toBeGreaterThanOrEqual(1);
  });

  it("Next button advances to step 2", () => {
    render(<CentralDogma />);
    fireEvent.click(screen.getByText("Next ▶"));
    expect(screen.getByText(/2\. Imprinting/)).toBeInTheDocument();
    expect(screen.getByText("Step 2 / 7")).toBeInTheDocument();
  });

  it("Prev button goes back from step 2 to step 1", () => {
    render(<CentralDogma />);
    fireEvent.click(screen.getByText("Next ▶"));
    expect(screen.getByText("Step 2 / 7")).toBeInTheDocument();
    fireEvent.click(screen.getByText("◀ Prev"));
    expect(screen.getByText(/1\. DNA/)).toBeInTheDocument();
    expect(screen.getByText("Step 1 / 7")).toBeInTheDocument();
  });

  it("Prev at step 1 stays at step 1", () => {
    render(<CentralDogma />);
    fireEvent.click(screen.getByText("◀ Prev"));
    expect(screen.getByText(/1\. DNA/)).toBeInTheDocument();
    expect(screen.getByText("Step 1 / 7")).toBeInTheDocument();
  });

  it("Next at step 7 stays at step 7", () => {
    render(<CentralDogma />);
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText("Next ▶"));
    }
    expect(screen.getByText("Step 7 / 7")).toBeInTheDocument();
    expect(screen.getByText(/7\. Result/)).toBeInTheDocument();
    // Click Next again — should stay at step 7
    fireEvent.click(screen.getByText("Next ▶"));
    expect(screen.getByText("Step 7 / 7")).toBeInTheDocument();
    expect(screen.getByText(/7\. Result/)).toBeInTheDocument();
  });

  it("Play/Pause toggle switches button text", () => {
    render(<CentralDogma />);
    const playBtn = screen.getByText("▶ Play");
    fireEvent.click(playBtn);
    expect(screen.getByText("⏸ Pause")).toBeInTheDocument();
    fireEvent.click(screen.getByText("⏸ Pause"));
    expect(screen.getByText("▶ Play")).toBeInTheDocument();
  });

  it("Play button uses COLORS.warn when playing", () => {
    render(<CentralDogma />);
    const playBtn = screen.getByText("▶ Play");
    fireEvent.click(playBtn);
    const pauseBtn = screen.getByText("⏸ Pause");
    expect(pauseBtn).toHaveStyle({ background: COLORS.warn });
  });

  describe("autoplay with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("advances steps on 4000ms intervals", () => {
      render(<CentralDogma />);
      fireEvent.click(screen.getByText("▶ Play"));

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText("Step 2 / 7")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText("Step 3 / 7")).toBeInTheDocument();
    });

    it("stops at last step and resets playing to false", () => {
      render(<CentralDogma />);
      // Navigate to step 6 (index 5) — NMD step has 8000ms duration
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText("Next ▶"));
      }
      expect(screen.getByText("Step 6 / 7")).toBeInTheDocument();

      fireEvent.click(screen.getByText("▶ Play"));

      // Advance to step 7 (step 5 has 8000ms adaptive duration)
      act(() => {
        vi.advanceTimersByTime(8000);
      });
      expect(screen.getByText("Step 7 / 7")).toBeInTheDocument();

      // Advance again — should stay at 7 and stop playing
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText("Step 7 / 7")).toBeInTheDocument();
      expect(screen.getByText("▶ Play")).toBeInTheDocument();
    });
  });
});
