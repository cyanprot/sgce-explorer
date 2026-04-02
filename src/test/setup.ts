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

// Stub scrollIntoView (absent in jsdom, needed for SequenceViewer scroll sync)
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}
