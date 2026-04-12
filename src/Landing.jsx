const STARS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.6 + 0.15,
  delay: Math.random() * 5,
}));

export default function Landing({ onSignIn: _onSignIn }) {
  const stars = STARS;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020c18 0%, #0a0028 35%, #081830 65%, #020c18 100%)",
      fontFamily: "Georgia, serif",
      color: "#f5e4b0",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <style>{`
        @keyframes ld-twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.85; } }
        @keyframes ld-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ld-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .ld-store:hover { transform: scale(1.05); }
        .ld-store { transition: transform 0.2s ease; }
      `}</style>

      {/* Star field */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, willChange: "transform", transform: "translateZ(0)" }}>
        {stars.map(s => (
          <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "rgba(255,245,200,1)", opacity: s.opacity,
            animation: `ld-twinkle ${2.5 + s.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "40px 24px",
        animation: "ld-fadeUp 0.7s ease",
        maxWidth: 480,
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 72, marginBottom: 24,
          animation: "ld-float 4s ease-in-out infinite",
          filter: "drop-shadow(0 0 30px rgba(232,184,64,0.3))",
        }}>🐑</div>

        <div style={{
          fontSize: 11, letterSpacing: 6, color: "#8a7540",
          textTransform: "uppercase", marginBottom: 16,
        }}>
          Your dreams have meaning
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 44, fontWeight: 400, margin: "0 0 20px",
          background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 1, lineHeight: 1.2,
        }}>
          Dream Shepherd
        </h1>

        <p style={{
          fontSize: 16, color: "#8a7a50", lineHeight: 1.75,
          margin: "0 auto 48px", maxWidth: 360,
        }}>
          Your personal guided dream journal. Capture dreams before they fade, unveil their hidden meanings, and discover what it all means.
        </p>

        {/* App Store Buttons */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 16,
          alignItems: "center", marginBottom: 48,
        }}>
          {/* Apple App Store */}
          <a
            className="ld-store"
            href="#"
            style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14, padding: "14px 28px",
              textDecoration: "none", width: 240,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#f5e4b0">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 10, color: "#8a7a50", lineHeight: 1 }}>Download on the</div>
              <div style={{ fontSize: 18, color: "#f5e4b0", lineHeight: 1.3 }}>App Store</div>
            </div>
          </a>

          {/* Google Play */}
          <a
            className="ld-store"
            href="#"
            style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14, padding: "14px 28px",
              textDecoration: "none", width: 240,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3.18 2.04C3.06 2.22 3 2.47 3 2.77V21.23c0 .3.06.55.18.73l.04.04L14.54 12 3.22 2l-.04.04z" fill="#4285F4"/>
              <path d="M18.33 15.78l-3.79-3.78 3.79-3.78.08.05 4.49 2.55c1.28.73 1.28 1.91 0 2.64l-4.49 2.55-.08-.23z" fill="#FBBC04"/>
              <path d="M18.41 16.01L14.54 12 3.22 22.96c.42.44 1.12.5 1.91.05l13.28-6.99z" fill="#EA4335"/>
              <path d="M18.41 7.99L5.13 1.01c-.79-.45-1.49-.39-1.91.05L14.54 12l3.87-4.01z" fill="#34A853"/>
            </svg>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 10, color: "#8a7a50", lineHeight: 1 }}>Get it on</div>
              <div style={{ fontSize: 18, color: "#f5e4b0", lineHeight: 1.3 }}>Google Play</div>
            </div>
          </a>
        </div>

        {/* Divider */}
        <div style={{
          height: 1, maxWidth: 120, margin: "0 auto 24px",
          background: "linear-gradient(90deg, transparent, rgba(200,160,30,0.3), transparent)",
        }} />

        {/* Footer links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <a href="/terms.html" style={{ fontSize: 12, color: "#6b5c30", textDecoration: "none" }}>Terms of Service</a>
          <a href="/privacy.html" style={{ fontSize: 12, color: "#6b5c30", textDecoration: "none" }}>Privacy Policy</a>
        </div>

        <div style={{ fontSize: 11, color: "#3a3050" }}>
          🐑 Tend to your dreams like a shepherd.
        </div>
      </div>
    </div>
  );
}
