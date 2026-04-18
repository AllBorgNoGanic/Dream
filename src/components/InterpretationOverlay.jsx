import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

// Inject keyframes once
const STYLE_ID = "interp-overlay-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes io-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes io-pulseGlow {
      0%, 100% {
        box-shadow: 0 0 60px rgba(144,102,212,0.35), inset 0 0 30px rgba(232,184,64,0.1);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 100px rgba(144,102,212,0.55), 0 0 40px rgba(232,184,64,0.2), inset 0 0 40px rgba(232,184,64,0.18);
        transform: scale(1.04);
      }
    }
    @keyframes io-orbitFast {
      from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
      to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
    }
    @keyframes io-orbitSlow {
      from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
      to { transform: rotate(-360deg) translateX(80px) rotate(360deg); }
    }
    @keyframes io-textIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes io-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes io-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes io-progress {
      from { width: 0%; }
      to { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

const STAGES = [
  { icon: "🌙", text: "Listening to your dream", sub: "Settling into the symbols you've shared" },
  { icon: "✦", text: "Tracing symbolic threads", sub: "Following the imagery to its quiet roots" },
  { icon: "🐑", text: "Consulting the Shepherd", sub: "Weighing each image against your patterns" },
  { icon: "📜", text: "Writing your reflection", sub: "Shaping a guidance offered with care" },
];

export default function InterpretationOverlay({ open, dreamTitle = "" }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!open) {
      setStage(0);
      return undefined;
    }
    // Cycle stages every ~3.5 seconds, looping at the last one
    const id = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 3500);
    return () => clearInterval(id);
  }, [open]);

  const current = STAGES[stage];

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed", inset: 0,
            background: "radial-gradient(ellipse at center, rgba(22,8,48,0.96) 0%, rgba(4,2,12,0.98) 70%)",
            backdropFilter: "blur(10px)",
            zIndex: 300,
            animation: "io-fadeIn 0.4s ease",
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 301,
            outline: "none",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: 24,
            maxWidth: 360, width: "90%",
          }}
        >
          <Dialog.Title style={{
            position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
            overflow: "hidden", clip: "rect(0,0,0,0)", border: 0,
          }}>
            Interpreting your dream
          </Dialog.Title>

          {/* Glowing orb with orbiting symbols */}
          <div style={{
            position: "relative",
            width: 200, height: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 32,
          }}>
            {/* Outer rotating ring */}
            <div style={{
              position: "absolute", inset: 0,
              border: "1px solid rgba(232,184,64,0.18)",
              borderRadius: "50%",
              animation: "io-spin 18s linear infinite",
            }} />
            {/* Inner ring counter-rotating */}
            <div style={{
              position: "absolute", inset: 24,
              border: "1px dashed rgba(144,102,212,0.25)",
              borderRadius: "50%",
              animation: "io-spin 12s linear infinite reverse",
            }} />

            {/* Central orb */}
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, rgba(232,184,64,0.4), rgba(104,71,192,0.6) 60%, rgba(40,10,80,0.8) 100%)",
              animation: "io-pulseGlow 3.2s ease-in-out infinite",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48,
              transition: "all 0.5s ease",
            }}>
              <span style={{
                filter: "drop-shadow(0 0 12px rgba(255,240,200,0.6))",
                transition: "all 0.5s ease",
              }}>
                {current.icon}
              </span>
            </div>

            {/* Orbiting particles */}
            <div style={{ position: "absolute", left: "50%", top: "50%" }}>
              <div style={{
                position: "absolute", width: 8, height: 8, borderRadius: "50%",
                background: "#e8b840",
                boxShadow: "0 0 12px rgba(232,184,64,0.8)",
                animation: "io-orbitFast 4s linear infinite",
                marginLeft: -4, marginTop: -4,
              }} />
              <div style={{
                position: "absolute", width: 6, height: 6, borderRadius: "50%",
                background: "#b08aee",
                boxShadow: "0 0 10px rgba(176,138,238,0.8)",
                animation: "io-orbitSlow 7s linear infinite",
                marginLeft: -3, marginTop: -3,
              }} />
            </div>
          </div>

          {/* Status text */}
          <div
            key={stage}
            style={{
              textAlign: "center",
              animation: "io-textIn 0.5s ease-out",
              marginBottom: 24,
              minHeight: 56,
            }}
          >
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 18,
              color: "#f5e4b0", marginBottom: 6,
              background: "linear-gradient(90deg, #f5e4b0, #fff8d8, #f5e4b0)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "io-shimmer 3s linear infinite",
              letterSpacing: 0.5,
            }}>
              {current.text}
            </div>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 13,
              color: "#9a8050", fontStyle: "italic",
              maxWidth: 280, margin: "0 auto", lineHeight: 1.5,
            }}>
              {current.sub}
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {STAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stage ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i <= stage ? "rgba(232,184,64,0.8)" : "rgba(232,184,64,0.18)",
                  transition: "all 0.4s ease",
                  boxShadow: i === stage ? "0 0 10px rgba(232,184,64,0.6)" : "none",
                }}
              />
            ))}
          </div>

          {/* Dream title hint */}
          {dreamTitle && (
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 11,
              color: "#5a4a30", letterSpacing: 1.5, textAlign: "center",
              maxWidth: 280, lineHeight: 1.6,
            }}>
              REFLECTING ON
              <div style={{
                color: "#8a7540", fontSize: 13, marginTop: 4,
                letterSpacing: 0.5, fontStyle: "italic",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {dreamTitle}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
