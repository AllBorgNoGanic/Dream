// ─────────────────────────────────────────────────────────────────────────────
// ShepherdMark
// The brand mark: gold-filtered shepherd silhouette from public/shepherd.svg.
// Used anywhere the sheep emoji was previously used as a brand stand-in
// (loading screens, hero blocks, upgrade modal, etc.). Single source of
// truth for the CSS filter recipe so we never drift across surfaces.
// ─────────────────────────────────────────────────────────────────────────────

const GOLD_FILTER =
  "brightness(0) saturate(100%) invert(78%) sepia(40%) saturate(600%) hue-rotate(5deg) brightness(95%)";

export default function ShepherdMark({ size = 32, glow = true, animate = false, style: extraStyle = {} }) {
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
