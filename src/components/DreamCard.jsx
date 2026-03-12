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

export default function DreamCard({ dream, isSelected, onSelect, onDelete }) {
  return (
    <div
      className="dream-card"
      onClick={() => onSelect(dream)}
      style={{
        background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.15)",
        borderRadius: 18, padding: 24, marginBottom: 16, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(40,10,80,0.4)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 400, color: "#ddc8ff" }}>{dream.title}</span>
            {dream.is_lucid && (
              <span style={{
                background: "rgba(100,200,255,0.15)", border: "1px solid rgba(100,200,255,0.3)",
                borderRadius: 12, padding: "2px 8px", fontSize: 10, color: "#88ccff"
              }}>
                LUCID
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#6050a0" }}>
            {formatDate(dream.created_at)} · {dream.mood} · {dream.theme}
            {dream.sleep_hours && ` · ${dream.sleep_hours}h sleep`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{getMoodEmoji(dream.mood)}</span>
          {dream.sleep_quality && (
            <span style={{ fontSize: 11, color: "#7060aa" }}>
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
              background: "rgba(160,100,255,0.1)", border: "1px solid rgba(160,100,255,0.2)",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#b090e0"
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
        fontSize: 13, color: "#9080bb", lineHeight: 1.6, margin: "0 0 12px",
        display: "-webkit-box",
        WebkitLineClamp: isSelected ? "none" : 2,
        WebkitBoxOrient: "vertical",
        overflow: isSelected ? "visible" : "hidden"
      }}>
        {dream.description}
      </p>

      {isSelected && dream.interpretation && (
        <div style={{
          background: "rgba(100,40,180,0.15)", border: "1px solid rgba(160,100,255,0.2)",
          borderRadius: 12, padding: 16, marginTop: 12, animation: "fadeIn 0.3s ease"
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#a070cc", textTransform: "uppercase", marginBottom: 8 }}>
            AI Interpretation
          </div>
          <p style={{ fontSize: 14, color: "#c8a8f0", lineHeight: 1.7, margin: 0 }}>
            {dream.interpretation}
          </p>
          {dream.symbols?.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {dream.symbols.map(s => (
                <span key={s} style={{
                  background: "rgba(120,50,200,0.2)", border: "1px solid rgba(160,100,255,0.2)",
                  borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#b090e0"
                }}>
                  {DREAM_DICTIONARY[s]?.symbol} {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isSelected && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
          {dream.is_public && (
            <span style={{ fontSize: 11, color: "#6050a0", padding: "6px 12px" }}>
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
