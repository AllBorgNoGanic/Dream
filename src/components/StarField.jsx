// Generate stars once per count value and cache
const cache = {};
function getStars(count) {
  if (!cache[count]) {
    cache[count] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.4,
      opacity: Math.random() * 0.6 + 0.15,
      delay: Math.random() * 5,
    }));
  }
  return cache[count];
}

export default function StarField({ count = 100, animation = "twinkle" }) {
  const stars = getStars(count);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s) => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "rgba(255,245,200,1)", opacity: s.opacity,
          animation: `${animation} ${2.5 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay * 0.4}s`,
        }} />
      ))}
    </div>
  );
}
