import { useState, useEffect } from "react";

const FEATURES = [
  { icon: "🌙", title: "Capture Every Dream", desc: "Log your dreams with mood, theme, and vivid detail before they fade from memory." },
  { icon: "✦", title: "AI-Powered Interpretation", desc: "Claude AI decodes the symbols and emotions in your dreams using Jungian psychology and symbolism." },
  { icon: "🔮", title: "Discover Your Patterns", desc: "Track recurring symbols, moods, and themes to understand what your subconscious is telling you." },
];

export default function Landing() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    setStars(Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.7 + 0.2,
      delay: Math.random() * 4,
    })));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #04001a 0%, #0a0028 40%, #120038 70%, #04001a 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8d5ff",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.9; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .cta-btn:hover { transform: scale(1.04); box-shadow: 0 8px 40px rgba(120,40,220,0.6) !important; }
        .feature-card:hover { background: rgba(40,15,80,0.8) !important; border-color: rgba(160,100,255,0.35) !important; }
        .feature-card { transition: all 0.25s; }
        .cta-btn { transition: all 0.2s; }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 38px !important; }
          .hero-subtitle { font-size: 16px !important; }
        }
      `}</style>

      {/* Stars */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map(s => (
          <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "white", opacity: s.opacity,
            animation: `twinkle ${2 + s.delay}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "100px 0 64px", animation: "fadeUp 0.6s ease" }}>
          <div style={{ fontSize: 13, letterSpacing: 6, color: "#a070cc", textTransform: "uppercase", marginBottom: 16 }}>
            Your Subconscious
          </div>
          <h1 className="hero-title" style={{
            fontSize: 56, fontWeight: 400, margin: "0 0 24px",
            background: "linear-gradient(135deg, #e8d5ff, #c490ff, #8040cc)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1,
          }}>
            Dreamscape
          </h1>
          <p className="hero-subtitle" style={{
            fontSize: 18, color: "#9080bb", lineHeight: 1.7, maxWidth: 480,
            margin: "0 auto 40px",
          }}>
            An AI-powered dream journal that helps you record, interpret, and understand the language of your subconscious.
          </p>
          <button className="cta-btn" onClick={() => window.location.href = "/app"} style={{
            background: "linear-gradient(135deg, #6020cc, #9040ee)",
            border: "none", color: "white", padding: "16px 40px",
            borderRadius: 50, fontSize: 16, cursor: "pointer", letterSpacing: 0.5,
            boxShadow: "0 4px 30px rgba(120,40,220,0.45)",
          }}>
            Start Journaling Free
          </button>
          <div style={{ marginTop: 14, fontSize: 12, color: "#504080" }}>
            No credit card required · 5 free AI interpretations
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, #a070cc, transparent)", margin: "0 auto 64px" }} />

        {/* Features */}
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card" style={{
              background: "rgba(25,10,55,0.7)", border: "1px solid rgba(160,100,255,0.15)",
              borderRadius: 20, padding: "28px 24px",
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, color: "#ddc8ff", marginBottom: 10 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: "#7060a0", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: 72 }}>
          <div style={{ fontSize: 13, color: "#6050a0", marginBottom: 20 }}>
            Ready to explore your inner world?
          </div>
          <button className="cta-btn" onClick={() => window.location.href = "/app"} style={{
            background: "none", border: "1px solid rgba(160,100,255,0.4)",
            color: "#c490ff", padding: "13px 36px",
            borderRadius: 50, fontSize: 14, cursor: "pointer", letterSpacing: 0.5,
          }}>
            Open Dream Journal →
          </button>
        </div>
      </div>
    </div>
  );
}
