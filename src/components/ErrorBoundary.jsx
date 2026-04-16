import { Component } from "react";

/**
 * ErrorBoundary
 * Catches render-time errors in its subtree and shows a themed fallback
 * instead of letting the whole screen crash to black.
 *
 * Props:
 *   - fallback: optional custom render fn (error, reset) => ReactNode
 *   - label:    optional short label shown in the fallback ("Community", "Insights", etc.)
 *   - children: subtree to protect
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to console for debugging; remote logging could hook here later.
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    if (typeof this.props.fallback === "function") {
      return this.props.fallback(this.state.error, this.reset);
    }

    const { label } = this.props;

    return (
      <div
        style={{
          background: "rgba(30,12,60,0.55)",
          border: "1px solid rgba(200,160,30,0.18)",
          borderRadius: 16,
          padding: "28px 22px",
          margin: "20px auto",
          maxWidth: 480,
          textAlign: "center",
          fontFamily: "Georgia, serif",
          color: "#f5e4b0",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#e8b840",
            marginBottom: 8,
          }}
        >
          Something stirred in the dark
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#c8b080",
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          {label
            ? `The ${label} section ran into an unexpected issue.`
            : "An unexpected issue interrupted this view."}{" "}
          Your dreams and data are safe.
        </div>
        <button
          onClick={this.reset}
          style={{
            background: "linear-gradient(90deg, #6847c0, #9066d4)",
            color: "#fff",
            border: "none",
            padding: "10px 22px",
            borderRadius: 22,
            fontFamily: "Georgia, serif",
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(104,71,192,0.35)",
          }}
        >
          Try again
        </button>
        {import.meta.env.DEV && (
          <details
            style={{
              marginTop: 18,
              textAlign: "left",
              fontSize: 11,
              color: "#7a6040",
            }}
          >
            <summary style={{ cursor: "pointer" }}>Error details (dev only)</summary>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                marginTop: 8,
                fontFamily: "monospace",
              }}
            >
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
