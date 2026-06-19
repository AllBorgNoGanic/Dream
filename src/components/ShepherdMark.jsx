// ─────────────────────────────────────────────────────────────────────────────
// ShepherdMark
// The brand mark: gold-filtered shepherd silhouette from public/shepherd.svg.
// Used anywhere the sheep emoji was previously used as a brand stand-in
// (loading screens, hero blocks, upgrade modal, etc.). Single source of
// truth for the CSS filter recipe so we never drift across surfaces.
// ─────────────────────────────────────────────────────────────────────────────

const GOLD_FILTER =
  "brightness(0) saturate(100%) invert(78%) sepia(40%) saturate(600%) hue-rotate(5deg) brightness(95%)";

const HALO_STYLES_ID = "shepherd-halo-styles";
if (typeof document !== "undefined" && !document.getElementById(HALO_STYLES_ID)) {
  const s = document.createElement("style");
  s.id = HALO_STYLES_ID;
  s.textContent = `
    @keyframes shepherd-halo-pulse {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.06); }
    }
    @keyframes shepherd-halo-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(s);
}

export default function ShepherdMark({ size = 32, glow = true, animate = false, halo = false, style: extraStyle = {} }) {
  const pad = Math.round(size * 0.32);
  const outer = size + pad * 2;

  if (halo) {
    return (
      <div style={{
        position: "relative", width: outer, height: outer,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        ...extraStyle,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(232,184,64,0.5)",
          boxShadow: "0 0 10px rgba(232,184,64,0.3), inset 0 0 8px rgba(232,184,64,0.15)",
          animation: "shepherd-halo-pulse 3s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: -1, borderRadius: "50%",
          border: "1px solid transparent",
          borderTopColor: "rgba(232,184,64,0.6)",
          animation: "shepherd-halo-spin 6s linear infinite",
        }} />
        <img
          src="/shepherd.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: size, height: size,
            filter: `${GOLD_FILTER} drop-shadow(0 0 ${Math.max(6, Math.round(size * 0.3))}px rgba(232,184,64,0.4))`,
          }}
        />
      </div>
    );
  }

  return (
    <img
      src="/shepherd.svg"
      alt=""
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: "inline-block",
        verticalAlign: "middle",
        filter: glow
          ? `${GOLD_FILTER} drop-shadow(0 0 ${Math.max(6, Math.round(size * 0.3))}px rgba(232,184,64,${size > 40 ? 0.35 : 0.3}))`
          : GOLD_FILTER,
        animation: animate ? "shepherd-float 4s ease-in-out infinite" : undefined,
        ...extraStyle,
      }}
    />
  );
}
