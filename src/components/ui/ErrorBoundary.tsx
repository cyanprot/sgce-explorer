import React from "react";
import { COLORS } from "@/constants/protein-data";

interface Props {
  children: React.ReactNode;
  /** Named in the fallback so the reader knows which part failed. */
  label: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors from one panel so a single bad lookup does not blank the
 * whole page.
 *
 * There was no boundary anywhere in this app, and several paths can throw during
 * render: a `variant-display` lookup miss reaches `hexWithAlpha(undefined)`, and
 * `applyEdit` now throws on an out-of-range coordinate rather than silently
 * computing a 200%-of-wild-type protein. Both used to be white screens.
 *
 * The fallback says what failed and keeps the rest of the app usable — important
 * here, because a reader who loses the page mid-lookup has no way to tell whether
 * the site is broken or their variant is.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Left in deliberately: this is the only signal that a render path threw.
    console.error(`[${this.props.label}] render failed`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        className="m-6 rounded-xl border p-4 text-sm"
        style={{ background: COLORS.panel, borderColor: COLORS.danger, color: COLORS.text }}
        role="alert"
      >
        <p className="font-bold mb-1" style={{ color: COLORS.danger }}>
          {this.props.label} could not be displayed
        </p>
        <p className="text-xs" style={{ color: COLORS.textDim }}>
          Something in this panel failed to render. The rest of the page still works — try
          selecting a different variant or reloading. Nothing shown elsewhere is affected.
        </p>
        <p className="mt-2 font-mono text-[10px]" style={{ color: COLORS.textDim }}>
          {this.state.error.message}
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-3 text-xs font-semibold px-2 py-1 rounded"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          Try again
        </button>
      </div>
    );
  }
}
