const DREAM_DICTIONARY = {
  flying: { symbol: "✈️" }, falling: { symbol: "⬇️" }, water: { symbol: "🌊" },
  fire: { symbol: "🔥" }, death: { symbol: "💀" }, teeth: { symbol: "🦷" },
  chase: { symbol: "🏃" }, house: { symbol: "🏠" }, snake: { symbol: "🐍" },
  ocean: { symbol: "🌊" }, forest: { symbol: "🌲" }, school: { symbol: "🏫" },
  baby: { symbol: "👶" }, car: { symbol: "🚗" }, mirror: { symbol: "🪞" },
  clock: { symbol: "⏰" },
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getMoodEmoji = (mood) => mood?.split(" ")[0] || "💭";

export default function DreamCard({ dream, isSelected, onSelect, onDelete, onInterpret, interpreting }) {
  return (
    <div
      className="dream-card"
      onClick={() => onSelect(dream)}
      style={{
        background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.15)",
        borderRadius: 18, padding: 24, marginBottom: 16, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(20,15,5,0.4)"
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
        <div style={{
          marginTop: 16, borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(168,85,247,0.35)",
          boxShadow: "0 0 40px rgba(120,60,220,0.12), 0 8px 32px rgba(0,0,0,0.4)",
          animation: "fadeIn 0.5s ease",
        }}>
          {/* Top shimmer bar */}
          <div style={{
            height: 2,
            background: "linear-gradient(90deg, transparent, #7c3aed, #e8b840, #a855f7, transparent)",
          }} />

          <div style={{
            background: "linear-gradient(160deg, rgba(28,8,58,0.97) 0%, rgba(10,4,24,0.98) 100%)",
            padding: "18px 20px 16px",
          }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🌙</span>
              <span style={{
                fontSize: 9, letterSpacing: 4, color: "#a855f7",
                textTransform: "uppercase", fontFamily: "Georgia, serif", fontWeight: 400,
              }}>
                The Shepherd's Reading
              </span>
              <div style={{
                flex: 1, height: 1,
                background: "linear-gradient(90deg, rgba(168,85,247,0.5), transparent)",
              }} />
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
                  background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.35), transparent)",
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
                      background: "rgba(120,60,220,0.18)",
                      border: "1px solid rgba(168,85,247,0.32)",
                      borderRadius: 20, padding: "4px 12px",
                      fontSize: 11, color: "#c4a0ff",
                      boxShadow: "0 0 10px rgba(120,60,220,0.18)",
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
            background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.3), rgba(232,184,64,0.2), transparent)",
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
                ? "1px solid rgba(120,60,220,0.25)"
                : "1px solid rgba(168,85,247,0.55)",
              borderRadius: 14,
              color: interpreting ? "#6b4da0" : "#d4b0ff",
              fontSize: 13, fontFamily: "Georgia, serif",
              cursor: interpreting ? "not-allowed" : "pointer",
              letterSpacing: 1, transition: "all 0.25s",
              boxShadow: interpreting ? "none" : "0 0 20px rgba(120,60,220,0.2)",
            }}
          >
            {interpreting ? "🌙 Reading your dream..." : "✦ Unlock the Meaning"}
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
          {dream.is_public && (
            <span style={{ fontSize: 11, color: "#6b5c30", padding: "6px 12px" }}>
              Shared with community
            </span>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(dream.id); }}
              style={{
                background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)",
                color: "#ff8888", padding: "6px 14px", borderRadius: 20, fontSize: 11,
                cursor: "pointer"
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
