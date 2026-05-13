import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";

// ── Inject animation keyframes once ─────────────────────────────────────────
const STYLE_ID = "prayer-overlay-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes po-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes po-overlayOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes po-contentIn { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    @keyframes po-ascend {
      0% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0px); }
      40% { opacity: 0.8; transform: translate(-50%, -58%) scale(0.99); }
      100% { opacity: 0; transform: translate(-50%, -70%) scale(0.94); filter: blur(2px); }
    }
    @keyframes po-crossPulse {
      0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 12px rgba(232,184,64,0.4)); transform: scale(1); }
      50% { opacity: 1; filter: drop-shadow(0 0 24px rgba(232,184,64,0.8)); transform: scale(1.06); }
    }
    @keyframes po-crossAscend {
      0% { opacity: 1; transform: translateY(0) scale(1); filter: drop-shadow(0 0 16px rgba(232,184,64,0.6)); }
      60% { opacity: 0.6; transform: translateY(-24px) scale(1.05); filter: drop-shadow(0 0 32px rgba(232,184,64,0.9)); }
      100% { opacity: 0; transform: translateY(-60px) scale(1.1); filter: drop-shadow(0 0 48px rgba(232,184,64,0.4)); }
    }
    @keyframes po-blurIn { from { opacity: 0; filter: blur(6px); } to { opacity: 1; filter: blur(0px); } }
    @keyframes po-amenIn { 0% { opacity: 0; transform: scale(0.85) translateY(8px); } 70% { transform: scale(1.04); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes po-amenPress { 0% { transform: scale(1); } 50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(232,184,64,0.5); } 100% { transform: scale(1); } }
    @keyframes po-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes po-fadeOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes po-dotFade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// PrayerOverlay
// Opens over the ReadingModal. Generates a short Christian prayer based on
// the dream + interpretation + themes. Has an "Amen" close and an optional
// "Speak it" TTS button.
// ─────────────────────────────────────────────────────────────────────────────
export default function PrayerOverlay({ open, onOpenChange, dream, interpretation, themes = [] }) {
  const [prayer, setPrayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const requestedRef = useRef(false);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!open) {
      requestedRef.current = false;
      setPrayer(null);
      setLoading(false);
      setError("");
      setClosing(false);
      return;
    }
    if (requestedRef.current) return;
    requestedRef.current = true;
    generatePrayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Closing animation handler ─────────────────────────────────────────────
  // Tapping Amen triggers a 600ms ascend animation before the overlay closes.
  const handleAmen = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      onOpenChange(false);
    }, 620);
  };

  const generatePrayer = async () => {
    if (!dream && !interpretation) {
      setError("There is nothing to pray over yet.");
      return;
    }
    setLoading(true);
    setError("");

    const dreamTitle = dream?.title || "this dream";
    const dreamDesc = dream?.description || "";
    const themeText = Array.isArray(themes) && themes.length > 0
      ? themes.map((t) => (t?.title || t)).filter(Boolean).join(", ")
      : "";

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interpret-dream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          max_tokens: 350,
          system: `You are composing a short, sincere Christian prayer based on a dream and its interpretation. The prayer should be 3 to 4 sentences. Address God in second person (Lord, Father, or You). Be specific to what the dream and its interpretation surface, but never preachy, never theatrical, never alarming. Do not quote Scripture directly. Do not use any em dashes. End with "Amen." on its own short line. Respond ONLY with the prayer text. No preamble, no JSON, no markdown.`,
          messages: [{
            role: "user",
            content: `Dream title: "${dreamTitle}"
Dream description: "${dreamDesc}"
The Shepherd's reflection: "${interpretation || "Not yet provided."}"
${themeText ? `Themes surfaced: ${themeText}` : ""}

Compose a brief prayer.`,
          }],
        }),
      });
      const data = await response.json();
      const text = (data.content?.map((b) => b.text || "").join("") || "").trim();
      if (text) {
        setPrayer(text);
      } else {
        setError("The prayer could not be composed. Please try again.");
      }
    } catch {
      setError("Could not reach the Shepherd right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Strip any trailing "Amen." from the prayer body since the button now
  //    serves that role. The AI is instructed to end with "Amen.", so we
  //    remove it cleanly to avoid duplication with the button label.
  const stripAmen = (text) => {
    if (!text) return "";
    return text.replace(/\s*Amen\.?\s*$/i, "").trim();
  };
  const body = stripAmen(prayer);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(10px)", zIndex: 1100,
    animation: closing ? "po-overlayOut 0.6s ease forwards" : "po-overlayIn 0.3s ease",
  };
  const content = {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    background: "linear-gradient(160deg, rgba(22,8,48,0.99) 0%, rgba(8,3,20,0.99) 100%)",
    border: "1px solid rgba(232,184,64,0.25)",
    borderRadius: 22, padding: "32px 26px 26px",
    maxWidth: 440, width: "92%", maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(104,71,192,0.15)",
    animation: closing
      ? "po-ascend 0.6s cubic-bezier(0.4, 0, 0.6, 1) forwards"
      : "po-contentIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    zIndex: 1101, outline: "none", fontFamily: "Georgia, serif",
    textAlign: "center",
  };
  const closeBtn = {
    position: "absolute", top: 14, right: 14,
    background: "none", border: "none", color: "#8a7540",
    fontSize: 22, cursor: "pointer", padding: 6, lineHeight: 1,
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlay} />
        <Dialog.Content style={content} aria-describedby={undefined}>
          <Dialog.Close asChild>
            <button style={closeBtn} aria-label="Close">×</button>
          </Dialog.Close>
          <Dialog.Title style={{
            position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
            overflow: "hidden", clip: "rect(0,0,0,0)", border: 0,
          }}>
            A prayer over this dream
          </Dialog.Title>

          {/* Cross icon — ascends when the prayer ends with Amen */}
          <div style={{
            fontSize: 38, color: "#e8b840",
            animation: closing
              ? "po-crossAscend 0.6s cubic-bezier(0.4, 0, 0.6, 1) forwards"
              : "po-crossPulse 3.5s ease-in-out infinite",
            marginBottom: 14,
            lineHeight: 1,
          }}>
            ✝
          </div>

          {/* Heading */}
          <div style={{
            fontSize: 11, letterSpacing: 4, color: "#8a7540",
            textTransform: "uppercase", marginBottom: 22,
          }}>
            A prayer over this dream
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ padding: "20px 0 30px", animation: "po-fadeIn 0.4s ease" }}>
              <div style={{ display: "inline-flex", gap: 6, marginBottom: 16 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#c8a040",
                    animation: `po-dotFade 1.4s ease-in-out ${i * 0.18}s infinite`,
                    display: "inline-block",
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: "#8a7540", fontStyle: "italic", letterSpacing: 0.5 }}>
                Composing your prayer...
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div style={{ padding: "10px 0 16px", animation: "po-fadeIn 0.4s ease" }}>
              <div style={{ fontSize: 13, color: "#c89040", lineHeight: 1.6, marginBottom: 14 }}>
                {error}
              </div>
              <button
                onClick={() => { requestedRef.current = false; generatePrayer(); }}
                style={{
                  background: "none", border: "1px solid rgba(232,184,64,0.4)",
                  color: "#c8a040", padding: "10px 22px", borderRadius: 22, fontSize: 13,
                  cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: 0.5,
                  minHeight: 40,
                }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Prayer body */}
          {!loading && !error && prayer && (
            <div style={{ marginBottom: 8 }}>
              <p style={{
                fontSize: 17, color: "#f0dfa0", lineHeight: 1.85,
                margin: "0 auto 26px", maxWidth: 360,
                fontStyle: "italic", letterSpacing: 0.2,
                animation: "po-blurIn 0.9s ease",
              }}>
                {body}
              </p>
            </div>
          )}

          {/* Amen button — the primary close action with ascend animation */}
          {!loading && !error && prayer && (
            <button
              onClick={handleAmen}
              disabled={closing}
              style={{
                background: "linear-gradient(135deg, rgba(200,160,30,0.20), rgba(232,184,64,0.12))",
                border: "1.5px solid rgba(232,184,64,0.55)",
                color: "#f5d870",
                padding: "16px 60px", borderRadius: 36,
                fontSize: 22, fontFamily: "Georgia, serif",
                fontWeight: 400, letterSpacing: 2.5,
                cursor: closing ? "default" : "pointer",
                minHeight: 60,
                boxShadow: "0 0 28px rgba(232,184,64,0.22), inset 0 0 18px rgba(232,184,64,0.06)",
                animation: "po-amenIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.6s both",
                transition: "background 0.2s, box-shadow 0.2s",
                textShadow: "0 0 12px rgba(232,184,64,0.4)",
              }}
              onMouseEnter={(e) => {
                if (closing) return;
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,160,30,0.28), rgba(232,184,64,0.18))";
                e.currentTarget.style.boxShadow = "0 0 36px rgba(232,184,64,0.35), inset 0 0 22px rgba(232,184,64,0.10)";
              }}
              onMouseLeave={(e) => {
                if (closing) return;
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,160,30,0.20), rgba(232,184,64,0.12))";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(232,184,64,0.22), inset 0 0 18px rgba(232,184,64,0.06)";
              }}
            >
              Amen.
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
