import "@testing-library/jest-dom/vitest";

// Stub ResizeObserver (absent in jsdom)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Polyfill requestAnimationFrame synchronously (needed for 3Dmol viewer init)
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = setTimeout(() => cb(Date.now()), 0);
    return id as unknown as number;
  };
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// Stub matchMedia (absent in jsdom, needed for framer-motion's useReducedMotion)
if (typeof globalThis.matchMedia === "undefined") {
  globalThis.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Stub scrollIntoView (absent in jsdom, needed for SequenceViewer scroll sync)
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}

// Clear fetch cache between tests to ensure isolation
import { clearAllCache } from "@/utils/fetchCache";
afterEach(() => {
  clearAllCache();
});
