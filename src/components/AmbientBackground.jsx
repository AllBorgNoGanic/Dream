// Layered ambient background: starfield + soft nebula glows + slow drift.
// Rendered once, fixed-position behind all content (z-index: 0, pointer-events: none).
// Pure CSS + one inline SVG data URL. No network, no per-frame JS.

function makeStarfield(count, size, seed) {
  // Deterministic pseudo-random: mulberry32
  let s = seed;
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const stars = [];
  for (let i = 0; i < count; i++) {
    const cx = (rand() * size).toFixed(1);
    const cy = (rand() * size).toFixed(1);
    const r = (0.4 + rand() * 0.9).toFixed(2);
    const op = (0.35 + rand() * 0.55).toFixed(2);
    stars.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f5e4b0" opacity="${op}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${stars.join("")}</svg>`;
}

const STAR_TILE_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(makeStarfield(90, 600, 42))}")`;

export default function AmbientBackground() {
  return (
    <>
      <style>{`
        @keyframes ambientStarDrift {
          from { background-position: 0 0, 0 0; }
          to { background-position: 600px 300px, -600px -300px; }
        }
        @keyframes ambientNebulaShift {
          0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
          50%  { transform: translate3d(2%, -3%, 0) scale(1.05); opacity: 0.75; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
        }
        @keyframes ambientTwinkle {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
        .ambient-bg-stars {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: ${STAR_TILE_URL}, ${STAR_TILE_URL};
          background-size: 600px 600px, 900px 900px;
          background-position: 0 0, 200px 150px;
          opacity: 0.55;
          animation: ambientStarDrift 240s linear infinite, ambientTwinkle 9s ease-in-out infinite;
        }
        .ambient-bg-glow-a, .ambient-bg-glow-b {
          position: fixed;
          z-index: 0;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(80px);
          will-change: transform, opacity;
          animation: ambientNebulaShift 30s ease-in-out infinite;
        }
        .ambient-bg-glow-a {
          top: -18%;
          left: -10%;
          width: 55vw;
          height: 55vw;
          max-width: 720px;
          max-height: 720px;
          background: radial-gradient(circle, rgba(144,102,212,0.28) 0%, rgba(144,102,212,0) 65%);
        }
        .ambient-bg-glow-b {
          bottom: -20%;
          right: -12%;
          width: 60vw;
          height: 60vw;
          max-width: 820px;
          max-height: 820px;
          background: radial-gradient(circle, rgba(232,184,64,0.16) 0%, rgba(232,184,64,0) 65%);
          animation-duration: 42s;
          animation-delay: -10s;
        }
        .ambient-bg-vignette {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%);
        }
        .ambient-bg-base {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(160deg, #020c18 0%, #0a1428 50%, #020c18 100%);
        }
      `}</style>
      <div className="ambient-bg-base" />
      <div className="ambient-bg-glow-a" />
      <div className="ambient-bg-glow-b" />
      <div className="ambient-bg-stars" />
      <div className="ambient-bg-vignette" />
    </>
  );
}
