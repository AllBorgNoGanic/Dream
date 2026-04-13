const DREAM_DICTIONARY = {
  flying: { symbol: "✈️" }, falling: { symbol: "⬇️" }, water: { symbol: "🌊" },
  fire: { symbol: "🔥" }, death: { symbol: "💀" }, teeth: { symbol: "🦷" },
  chase: { symbol: "🏃" }, house: { symbol: "🏠" }, snake: { symbol: "🐍" },
  ocean: { symbol: "🌊" }, forest: { symbol: "🌲" }, school: { symbol: "🏫" },
  baby: { symbol: "👶" }, car: { symbol: "🚗" }, mirror: { symbol: "🪞" },
  clock: { symbol: "⏰" },
  dove: { symbol: "🕊️" },
  lamb: { symbol: "🐑" },
  bread: { symbol: "🍞" },
  cross: { symbol: "✝️" },
  light: { symbol: "💡" },
  angel: { symbol: "👼" },
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getMoodEmoji = (mood) => mood?.split(" ")[0] || "💭";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { checkFields } from "../utils/moderation";

// Inject delete dialog animation keyframes once
const DIALOG_STYLES_ID = "dream-delete-dialog-styles";
if (typeof document !== "undefined" && !document.getElementById(DIALOG_STYLES_ID)) {
  const style = document.createElement("style");
  style.id = DIALOG_STYLES_ID;
  style.textContent = `
    @keyframes dc-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dc-contentIn { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
  `;
  document.head.appendChild(style);
}

export default function DreamCard({ dream, isSelected, onSelect, onDelete, onTogglePublic, onInterpret, interpreting, onViewReading }) {
  const needsInterpretation = !dream.interpretation && onInterpret;
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [shareError, setShareError] = useState("");

  return (
    <div
      className="dream-card"
      onClick={() => onSelect(dream)}
      style={{
        background: "rgba(6,12,22,0.7)",
        border: isSelected
          ? "1px solid rgba(144,102,212,0.35)"
          : needsInterpretation
            ? "1px solid rgba(144,102,212,0.2)"
            : "1px solid rgba(200,160,30,0.15)",
        borderRadius: 18, padding: 24, marginBottom: 16, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(20,15,5,0.4)", position: "relative"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 400, color: "#f0d890" }}>{dream.title}</span>
            {dream.is_lucid && (
              <span style={{
                background: "rgba(100,200,255,0.15)", border: "1px solid rgba(100,200,255,0.3)",
                borderRadius: 12, padding: "2px 8px", fontSize: 10, color: "#88ccff"
              }}>
                LUCID
              </span>
            )}
            {needsInterpretation && !isSelected && (
              <span style={{
                background: "rgba(104,71,192,0.15)", border: "1px solid rgba(144,102,212,0.3)",
                borderRadius: 12, padding: "2px 8px", fontSize: 10, color: "#b08aee",
                letterSpacing: 0.5,
              }}>
                ✦ Awaiting Reflection
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#6b5c30" }}>
            {formatDate(dream.created_at)} · {dream.mood} · {dream.theme}
            {dream.sleep_hours && ` · ${dream.sleep_hours}h sleep`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{getMoodEmoji(dream.mood)}</span>
          {dream.sleep_quality && (
            <span style={{ fontSize: 11, color: "#8a7540" }}>
              {"★".repeat(dream.sleep_quality)}{"☆".repeat(5 - dream.sleep_quality)}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {dream.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {dream.tags.map(tag => (
            <span key={tag} style={{
              background: "rgba(200,160,30,0.1)", border: "1px solid rgba(200,160,30,0.2)",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#d4a840"
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Characters */}
      {dream.characters?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {dream.characters.map(c => (
            <span key={c} style={{
              background: "rgba(100,180,255,0.1)", border: "1px solid rgba(100,180,255,0.2)",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#88bbee"
            }}>
              @{c}
            </span>
          ))}
        </div>
      )}

      <p style={{
        fontSize: 13, color: "#8a7a50", lineHeight: 1.6, margin: "0 0 12px",
        display: "-webkit-box",
        WebkitLineClamp: isSelected ? "none" : 2,
        WebkitBoxOrient: "vertical",
        overflow: isSelected ? "visible" : "hidden"
      }}>
        {dream.description}
      </p>

      {isSelected && dream.interpretation && (
        <div
          onClick={(e) => { e.stopPropagation(); onViewReading?.(dream); }}
          title="Tap to expand reading"
          style={{
            marginTop: 16, borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(144,102,212,0.35)",
            boxShadow: "0 0 40px rgba(104,71,192,0.12), 0 8px 32px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.5s ease",
            cursor: "pointer",
          }}>
          {/* Top shimmer bar */}
          <div style={{
            height: 2,
            background: "linear-gradient(90deg, transparent, #6847c0, #e8b840, #9066d4, transparent)",
          }} />

          <div style={{
            background: "linear-gradient(160deg, rgba(28,8,58,0.97) 0%, rgba(10,4,24,0.98) 100%)",
            padding: "18px 20px 16px",
          }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🌙</span>
              <span style={{
                fontSize: 9, letterSpacing: 4, color: "#9066d4",
                textTransform: "uppercase", fontFamily: "Georgia, serif", fontWeight: 400,
              }}>
                The Shepherd's Reflection
              </span>
              <div style={{
                flex: 1, height: 1,
                background: "linear-gradient(90deg, rgba(144,102,212,0.5), transparent)",
              }} />
              <span style={{ fontSize: 10, color: "#5a3a7a", letterSpacing: 0.5 }}>
                ↗ expand
              </span>
            </div>

            {/* Interpretation body */}
            <p style={{
              fontSize: 15, color: "#f0dfa0", lineHeight: 1.85,
              margin: "0 0 0", fontFamily: "Georgia, serif", fontStyle: "italic",
              textShadow: "0 1px 8px rgba(200,160,30,0.15)",
            }}>
              {dream.interpretation}
            </p>

            {/* Symbols */}
            {dream.symbols?.length > 0 && (
              <>
                <div style={{
                  height: 1, margin: "14px 0 12px",
                  background: "linear-gradient(90deg, transparent, rgba(144,102,212,0.35), transparent)",
                }} />
                <div style={{
                  fontSize: 9, letterSpacing: 3, color: "#6b4da0",
                  textTransform: "uppercase", marginBottom: 9,
                }}>
                  Symbols Detected
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {dream.symbols.map(s => (
                    <span key={s} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "rgba(104,71,192,0.18)",
                      border: "1px solid rgba(144,102,212,0.32)",
                      borderRadius: 20, padding: "4px 12px",
                      fontSize: 11, color: "#c4a0ff",
                      boxShadow: "0 0 10px rgba(104,71,192,0.18)",
                    }}>
                      {DREAM_DICTIONARY[s]?.symbol} {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bottom shimmer bar */}
          <div style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(144,102,212,0.3), rgba(232,184,64,0.2), transparent)",
          }} />
        </div>
      )}

      {isSelected && !dream.interpretation && onInterpret && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onInterpret(dream); }}
            disabled={interpreting}
            style={{
              width: "100%", padding: "13px 0",
              background: interpreting
                ? "rgba(60,20,100,0.3)"
                : "linear-gradient(135deg, rgba(90,30,180,0.5), rgba(140,50,220,0.5))",
              border: interpreting
                ? "1px solid rgba(104,71,192,0.25)"
                : "1px solid rgba(144,102,212,0.55)",
              borderRadius: 14,
              color: interpreting ? "#6b4da0" : "#d4b0ff",
              fontSize: 13, fontFamily: "Georgia, serif",
              cursor: interpreting ? "not-allowed" : "pointer",
              letterSpacing: 1, transition: "all 0.25s",
              boxShadow: interpreting ? "none" : "0 0 20px rgba(104,71,192,0.2)",
            }}
          >
            {interpreting ? "🌙 Reflecting on your dream..." : "✦ Seek the Shepherd's Guidance"}
          </button>
          {!interpreting && (
            <div style={{
              textAlign: "center", marginTop: 6,
              fontSize: 10, color: "#4a3570", letterSpacing: 1,
            }}>
              Powered by AI
            </div>
          )}
        </div>
      )}

      {isSelected && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
          {onTogglePublic && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (dream.is_public) {
                    onTogglePublic(dream.id);
                  } else {
                    setShareError("");
                    setShowShareConfirm(true);
                  }
                }}
                style={{
                  background: dream.is_public ? "rgba(100,200,120,0.1)" : "rgba(144,102,212,0.1)",
                  border: dream.is_public ? "1px solid rgba(100,200,120,0.25)" : "1px solid rgba(144,102,212,0.25)",
                  color: dream.is_public ? "#7ac88a" : "#b08aee",
                  padding: "6px 14px", borderRadius: 20, fontSize: 11,
                  cursor: "pointer", fontFamily: "Georgia, serif",
                }}
              >
                {dream.is_public ? "Shared with Community" : "Share to Community"}
              </button>
              {showShareConfirm && !dream.is_public && (
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: "absolute", left: 12, right: 12, bottom: 60,
                  background: "rgba(16,4,40,0.97)", border: "1px solid rgba(200,160,30,0.3)",
                  borderRadius: 14, padding: 16, zIndex: 10,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ color: "#f5e4b0", fontSize: 14, marginBottom: 10, fontFamily: "Georgia, serif" }}>
                    Share this dream with the community?
                  </div>
                  <div style={{ color: "#8a7540", fontSize: 12, marginBottom: 14, lineHeight: 1.5, fontFamily: "Georgia, serif" }}>
                    Your dream will be visible to all users. Your display name will be shown.
                  </div>
                  {shareError && (
                    <div style={{
                      color: "#f87171", fontSize: 12, padding: "8px 12px", marginBottom: 10,
                      background: "rgba(239,68,68,0.1)", borderRadius: 8, lineHeight: 1.5,
                    }}>
                      {shareError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowShareConfirm(false)}
                      style={{
                        background: "none", border: "1px solid rgba(200,160,30,0.2)",
                        color: "#8a7540", padding: "8px 16px", borderRadius: 10, fontSize: 12,
                        cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 40,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const check = checkFields({
                          title: dream.title || "",
                          description: dream.description || "",
                          tags: dream.tags || [],
                        });
                        if (!check.clean) {
                          setShareError(`Your ${check.field} contains inappropriate language. Please edit it before sharing.`);
                          return;
                        }
                        setShowShareConfirm(false);
                        onTogglePublic(dream.id);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #6847c0, #9066d4)",
                        border: "none", color: "#fff", padding: "8px 16px", borderRadius: 10,
                        fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
                        fontWeight: 600, minHeight: 40,
                      }}
                    >
                      Share
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {onDelete && (
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)",
                    color: "#ff8888", padding: "6px 14px", borderRadius: 20, fontSize: 11,
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(6px)", zIndex: 100,
                    animation: "dc-overlayIn 0.2s ease",
                  }}
                />
                <AlertDialog.Content
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    background: "linear-gradient(160deg, rgba(22,8,48,0.98) 0%, rgba(12,4,28,0.98) 100%)",
                    border: "1px solid rgba(200,160,50,0.2)",
                    borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "88%",
                    boxShadow: "0 20px 70px rgba(0,0,0,0.7), 0 0 40px rgba(104,71,192,0.1)",
                    animation: "dc-contentIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    zIndex: 101, outline: "none",
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.8 }}>🌙</div>
                    <AlertDialog.Title style={{
                      fontSize: 17, color: "#f5e4b0", marginBottom: 8,
                      fontFamily: "Georgia, serif", fontWeight: 400,
                    }}>
                      Delete this dream?
                    </AlertDialog.Title>
                    <AlertDialog.Description style={{
                      fontSize: 13, color: "#8a7540", lineHeight: 1.6,
                      fontFamily: "Georgia, serif",
                    }}>
                      This will permanently remove this dream and its interpretation. This cannot be undone.
                    </AlertDialog.Description>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <AlertDialog.Cancel asChild>
                      <button style={{
                        flex: 1, background: "rgba(200,160,50,0.08)",
                        border: "1px solid rgba(200,160,30,0.25)",
                        color: "#c8a040", padding: "12px 16px", borderRadius: 12, fontSize: 14,
                        cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 44,
                        transition: "all 0.15s",
                      }}>
                        Keep
                      </button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        onClick={() => onDelete(dream.id)}
                        style={{
                          flex: 1, background: "rgba(255,80,80,0.12)",
                          border: "1px solid rgba(255,80,80,0.3)",
                          color: "#ff8888", padding: "12px 16px", borderRadius: 12, fontSize: 14,
                          cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600, minHeight: 44,
                          transition: "all 0.15s",
                        }}
                      >
                        Delete
                      </button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          )}
        </div>
      )}
    </div>
  );
}
