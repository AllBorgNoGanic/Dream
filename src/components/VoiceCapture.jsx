import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

// ── Inject animation keyframes once ─────────────────────────────────────────
const STYLE_ID = "voice-capture-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes vc-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes vc-contentIn { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    @keyframes vc-micPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232,184,64,0.5); }
      50% { transform: scale(1.05); box-shadow: 0 0 0 18px rgba(232,184,64,0); }
    }
    @keyframes vc-ringExpand {
      0% { opacity: 0.6; transform: translate(-50%,-50%) scale(0.8); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(2.2); }
    }
    @keyframes vc-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes vc-dotFade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// VoiceCapture
// A focused modal that records the user's voice and returns the transcript
// to the caller via onDone(text).
// ─────────────────────────────────────────────────────────────────────────────
export default function VoiceCapture({ open, onOpenChange, onDone }) {
  const {
    isListening, transcript, partialTranscript,
    start, stop, reset, supported, error, permissionDenied,
  } = useSpeechRecognition();

  // Auto-start when the modal opens
  useEffect(() => {
    if (!open) return;
    reset();
    start();
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const combined = (transcript + (partialTranscript ? " " + partialTranscript : "")).trim();

  const handleDone = async () => {
    if (isListening) await stop();
    // Give state a tick to settle
    setTimeout(() => {
      const finalText = (transcript + (partialTranscript ? " " + partialTranscript : "")).trim();
      if (finalText && onDone) onDone(finalText);
      onOpenChange(false);
    }, 50);
  };

  const handleCancel = async () => {
    if (isListening) await stop();
    onOpenChange(false);
  };

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(8px)", zIndex: 1200, animation: "vc-overlayIn 0.25s ease",
  };
  const content = {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    background: "linear-gradient(160deg, rgba(22,8,48,0.99) 0%, rgba(8,3,20,0.99) 100%)",
    border: "1px solid rgba(232,184,64,0.25)",
    borderRadius: 22, padding: "28px 24px 24px",
    maxWidth: 420, width: "92%", maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(232,184,64,0.1)",
    animation: "vc-contentIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    zIndex: 1201, outline: "none", fontFamily: "Georgia, serif",
    textAlign: "center",
  };

  const renderBody = () => {
    if (!supported) {
      return (
        <div style={{ padding: "20px 8px" }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🎙️</div>
          <div style={{ fontSize: 15, color: "#f0dfa0", marginBottom: 10 }}>
            Voice recording is not supported on this device or browser.
          </div>
          <p style={{ fontSize: 13, color: "#9a8050", lineHeight: 1.6, margin: 0 }}>
            You can still type your dream below.
          </p>
        </div>
      );
    }

    if (permissionDenied) {
      return (
        <div style={{ padding: "20px 8px" }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🎙️</div>
          <div style={{ fontSize: 15, color: "#f0dfa0", marginBottom: 10 }}>
            Microphone access is needed
          </div>
          <p style={{ fontSize: 13, color: "#9a8050", lineHeight: 1.65, margin: "0 0 18px" }}>
            Enable microphone access in your device settings, then try again.
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Pulsing mic */}
        <div style={{ position: "relative", height: 130, marginBottom: 18 }}>
          {/* Expanding ring while listening */}
          {isListening && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 96, height: 96, borderRadius: "50%",
              border: "2px solid rgba(232,184,64,0.5)",
              animation: "vc-ringExpand 1.8s ease-out infinite",
              pointerEvents: "none",
            }} />
          )}

          {/* Mic circle */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 96, height: 96, borderRadius: "50%",
            background: isListening
              ? "linear-gradient(135deg, rgba(232,184,64,0.30), rgba(200,160,30,0.18))"
              : "rgba(255,255,255,0.05)",
            border: `1.5px solid ${isListening ? "rgba(232,184,64,0.6)" : "rgba(255,255,255,0.15)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40,
            animation: isListening ? "vc-micPulse 1.4s ease-in-out infinite" : "none",
            transition: "all 0.3s ease",
          }}>
            🎙️
          </div>
        </div>

        {/* State label */}
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#8a7540", textTransform: "uppercase", marginBottom: 14 }}>
          {isListening ? "Listening" : transcript ? "Paused" : "Tap done when finished"}
        </div>

        {/* Live transcript */}
        <div style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(232,184,64,0.18)",
          borderRadius: 14, padding: "16px 16px",
          marginBottom: 20, minHeight: 80,
          textAlign: "left",
        }}>
          {combined ? (
            <p style={{
              fontSize: 14.5, color: "#f0dfa0", lineHeight: 1.65,
              margin: 0,
              animation: "vc-fadeIn 0.3s ease",
            }}>
              {transcript}
              {partialTranscript && (
                <span style={{ color: "#8a7540", fontStyle: "italic" }}>
                  {transcript ? " " : ""}{partialTranscript}
                </span>
              )}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b5c30", fontSize: 13 }}>
              <div style={{ display: "inline-flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#8a7540",
                    animation: `vc-dotFade 1.4s ease-in-out ${i * 0.18}s infinite`,
                    display: "inline-block",
                  }} />
                ))}
              </div>
              <span style={{ fontStyle: "italic" }}>Speak your dream...</span>
            </div>
          )}
        </div>

        {error && !permissionDenied && (
          <div style={{ fontSize: 12, color: "#c89040", marginBottom: 14 }}>
            {error}
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlay} />
        <Dialog.Content style={content} aria-describedby={undefined}>
          <Dialog.Title style={{
            position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
            overflow: "hidden", clip: "rect(0,0,0,0)", border: 0,
          }}>
            Record your dream
          </Dialog.Title>

          {renderBody()}

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={handleCancel}
              style={{
                background: "none", border: "1px solid rgba(144,102,212,0.35)",
                color: "#8a6ab0", padding: "12px 28px", borderRadius: 26, fontSize: 13.5,
                cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: 0.5,
                minHeight: 44, minWidth: 120,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={!supported && !combined}
              style={{
                background: combined
                  ? "linear-gradient(135deg, #6847c0, #9066d4)"
                  : "rgba(124,58,237,0.25)",
                border: "none",
                color: "#fff",
                padding: "12px 28px", borderRadius: 26, fontSize: 13.5,
                cursor: combined ? "pointer" : "not-allowed",
                fontFamily: "Georgia, serif", fontWeight: 600,
                letterSpacing: 0.5, minHeight: 44, minWidth: 120,
                boxShadow: combined ? "0 0 18px rgba(144,102,212,0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              ✓ Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
