import { useEffect } from "react";

// Inject keyframes once
const STYLE_ID = "first-time-journey-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ftj-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ftj-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.05); opacity: 1; } }
    @keyframes ftj-glow {
      0%, 100% { box-shadow: 0 0 30px rgba(232,184,64,0.15); }
      50% { box-shadow: 0 0 60px rgba(232,184,64,0.35), 0 0 90px rgba(144,102,212,0.15); }
    }
    @keyframes ftj-trail {
      0% { transform: translateX(-30px); opacity: 0; }
      40% { opacity: 0.8; }
      100% { transform: translateX(0); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

const STEPS = [
  {
    num: "1",
    icon: "📖",
    title: "Capture",
    body: "Record dreams in the morning before they fade. Even fragments are valuable.",
    accent: "#e8b840",
  },
  {
    num: "2",
    icon: "✦",
    title: "Reflect",
    body: "Tap any dream and choose Seek the Shepherd's Guidance for an AI interpretation rooted in symbolism and your patterns.",
    accent: "#b08aee",
  },
  {
    num: "3",
    icon: "🌙",
    title: "Discover",
    body: "Over time, the Patterns tab reveals recurring themes, emotional tides, and ongoing guidance unique to you.",
    accent: "#7ac88a",
  },
];

export default function FirstTimeJourney({ onStart }) {
  useEffect(() => {
    // Smooth scroll to top when this mounts so the user sees the welcome
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div style={{
      padding: "16px 4px 32px",
      animation: "ftj-fadeUp 0.5s ease-out",
    }}>
      {/* Header / Welcome */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 64, marginBottom: 12,
          animation: "ftj-pulse 3.2s ease-in-out infinite",
          filter: "drop-shadow(0 0 24px rgba(232,184,64,0.3))",
          lineHeight: 1,
        }}>
          🐑
        </div>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 11,
          letterSpacing: 4, color: "#9a8050", marginBottom: 8, opacity: 0.85,
        }}>
          WELCOME, DREAMER
        </div>
        <h2 style={{
          fontFamily: "Georgia, serif", fontSize: 26, color: "#f5e4b0",
          margin: "0 0 10px", fontWeight: 400, lineHeight: 1.2,
        }}>
          Your dream journal awaits
        </h2>
        <p style={{
          fontFamily: "Georgia, serif", fontSize: 14, color: "#8a7540",
          maxWidth: 320, margin: "0 auto", lineHeight: 1.6,
        }}>
          Three small habits will help you uncover what your dreams may be telling you.
        </p>
      </div>

      {/* The three steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            style={{
              background: "linear-gradient(160deg, rgba(20,12,40,0.6), rgba(10,6,24,0.6))",
              border: `1px solid ${i === 0 ? "rgba(232,184,64,0.3)" : "rgba(200,160,30,0.12)"}`,
              borderRadius: 18,
              padding: "18px 18px 18px 16px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              animation: `ftj-fadeUp 0.5s ease-out ${0.1 + i * 0.08}s both`,
              boxShadow: i === 0 ? "0 0 30px rgba(232,184,64,0.08)" : "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Step number badge */}
            <div style={{
              flexShrink: 0,
              width: 38, height: 38, borderRadius: 19,
              background: `linear-gradient(135deg, ${step.accent}28, ${step.accent}10)`,
              border: `1px solid ${step.accent}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Georgia, serif", fontSize: 18, color: step.accent,
              fontWeight: 600,
              boxShadow: `0 0 14px ${step.accent}25`,
            }}>
              {step.num}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
              }}>
                <span style={{ fontSize: 16 }}>{step.icon}</span>
                <span style={{
                  fontFamily: "Georgia, serif", fontSize: 16,
                  color: "#f0d890", letterSpacing: 0.5,
                }}>
                  {step.title}
                </span>
              </div>
              <p style={{
                fontFamily: "Georgia, serif", fontSize: 13,
                color: "#9a8a60", lineHeight: 1.55, margin: 0,
              }}>
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Primary CTA */}
      <div style={{ textAlign: "center", animation: "ftj-fadeUp 0.5s ease-out 0.45s both" }}>
        <button
          onClick={onStart}
          style={{
            background: "linear-gradient(135deg, rgba(232,184,64,0.2), rgba(200,160,30,0.15))",
            border: "1px solid rgba(232,184,64,0.5)",
            color: "#f5e4b0",
            padding: "16px 40px",
            borderRadius: 40,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            letterSpacing: 1.2,
            transition: "all 0.2s",
            minHeight: 52,
            animation: "ftj-glow 3s ease-in-out infinite",
            fontWeight: 400,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(232,184,64,0.28), rgba(200,160,30,0.2))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(232,184,64,0.2), rgba(200,160,30,0.15))";
          }}
        >
          ✦ Record Your First Dream
        </button>
        <div style={{
          marginTop: 14, fontSize: 12, color: "#6b5c30",
          fontFamily: "Georgia, serif", fontStyle: "italic",
        }}>
          Even a few words are enough to begin.
        </div>
      </div>
    </div>
  );
}
