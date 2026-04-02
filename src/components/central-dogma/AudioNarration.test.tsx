import { render, screen, fireEvent } from "@testing-library/react";
import { AudioNarration } from "./AudioNarration";

// Mock speechSynthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockSynth = {
  speak: mockSpeak,
  cancel: mockCancel,
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
  getVoices: vi.fn().mockReturnValue([]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

class MockUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  constructor(text: string) {
    this.text = text;
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, "speechSynthesis", {
    value: mockSynth,
    writable: true,
    configurable: true,
  });
  (globalThis as any).SpeechSynthesisUtterance = MockUtterance;
});

beforeEach(() => {
  mockSpeak.mockClear();
  mockCancel.mockClear();
});

describe("AudioNarration", () => {
  it("renders toggle button", () => {
    render(<AudioNarration stepIndex={0} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("starts narration when toggled on", () => {
    render(<AudioNarration stepIndex={0} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it("stops narration when toggled off", () => {
    render(<AudioNarration stepIndex={0} />);
    // Toggle on
    fireEvent.click(screen.getByRole("button"));
    // Toggle off
    fireEvent.click(screen.getByRole("button"));
    expect(mockCancel).toHaveBeenCalled();
  });

  it("speaks new text when stepIndex changes while enabled", () => {
    const { rerender } = render(<AudioNarration stepIndex={0} />);
    fireEvent.click(screen.getByRole("button")); // enable
    mockSpeak.mockClear();
    mockCancel.mockClear();

    rerender(<AudioNarration stepIndex={1} />);
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
  });

  it("does not speak when disabled and stepIndex changes", () => {
    const { rerender } = render(<AudioNarration stepIndex={0} />);
    mockSpeak.mockClear();

    rerender(<AudioNarration stepIndex={1} />);
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
