import { Component } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { C } from "../config/theme.js";

export class ModuleErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.moduleKey !== this.props.moduleKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", padding: 80,
          flexDirection: "column", gap: 16, background: C.card, border: `1px solid ${C.bord}`,
          borderRadius: 16, textAlign: "center", minHeight: "50vh"
        }}>
          <div style={{ background: `${C.red}18`, borderRadius: 12, padding: 16, color: C.red, display: "flex" }}>
            <AlertCircle size={36} />
          </div>
          <div>
            <div style={{ color: C.txt, fontSize: 18, fontWeight: 700 }}>Module Failed to Load</div>
            <div style={{ color: C.sub, fontSize: 13, marginTop: 6, maxWidth: 480, lineHeight: 1.5 }}>
              {this.state.error.message || "An unexpected error occurred while rendering this page."}
            </div>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: C.gold, color: "#000", border: "none", borderRadius: 8, padding: "10px 18px",
              fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
