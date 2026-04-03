import { useState, useEffect, useMemo } from "react";

const FEATURES = [
  { icon: "📖", title: "Dream Journal", desc: "Record dreams with voice-to-text, mood, themes, tags, and characters. Your private journal in the stars." },
  { icon: "✦", title: "AI Interpretation", desc: "Receive personalized dream reflections powered by AI, with unique themes, meanings, and guidance for every dream." },
  { icon: "🎨", title: "Dream Visualization", desc: "Transform your dreams into stunning AI-generated artwork that captures the essence of what you experienced." },
  { icon: "📊", title: "Pattern Discovery", desc: "Track recurring symbols, moods, and themes over time. Uncover what your subconscious keeps returning to." },
  { icon: "🌟", title: "Lucid Dream Tools", desc: "Reality check trainer, dream signs tracker, and MILD technique guide to help you become aware inside your dreams." },
  { icon: "🤝", title: "Dream Community", desc: "Share dreams with fellow dreamers. Like, comment, and explore interpretations from people around the world." },
];

const FAQ = [
  { q: "Is Dream Shepherd free?", a: "Yes. You can journal unlimited dreams for free. You get 5 free AI interpretations and 2 free dream visualizations to start. Subscribe for unlimited access to all features." },
  { q: "How does the AI interpretation work?", a: "When you record a dream, our AI analyzes your description along with your mood, themes, tags, and personal dream profile. It generates a unique interpretation with custom dream themes, each with its own meaning and guidance tailored specifically to your dream." },
  { q: "Is my dream journal private?", a: "Completely. Your dreams are private by default. You choose which dreams to share with the community, and you can unshare them at any time." },
  { q: "Can I use voice-to-text to record dreams?", a: "Yes. Tap the voice input button and describe your dream out loud. The app transcribes it in real time so you can capture details before they fade." },
  { q: "What are lucid dreaming tools?", a: "Dream Shepherd includes a reality check trainer, dream signs tracker, and a step-by-step MILD technique guide to help you become aware that you're dreaming while inside a dream." },
];

export default function Landing({ onSignIn }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const stars = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.15,
      delay: Math.random() * 5,
    })), []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020c18 0%, #0a0028 35%, #081830 65%, #020c18 100%)",
      fontFamily: "Georgia, serif",
      color: "#f5e4b0",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes ld-twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.85; } }
        @keyframes ld-fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ld-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes ld-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .ld-cta:hover { transform: scale(1.03); box-shadow: 0 8px 40px rgba(160,100,5,0.55) !important; }
        .ld-cta { transition: all 0.25s ease; }
        .ld-feature:hover { background: rgba(40,15,80,0.75) !important; border-color: rgba(200,160,30,0.35) !important; transform: translateY(-2px); }
        .ld-feature { transition: all 0.25s ease; }
        .ld-faq:hover { border-color: rgba(200,160,30,0.3) !important; }
        .ld-faq { transition: border-color 0.2s; }
        .ld-nav-btn:hover { color: #e8b840 !important; }
        @media (max-width: 640px) {
          .ld-features-grid { grid-template-columns: 1fr !important; }
          .ld-hero-title { font-size: 36px !important; }
          .ld-hero-sub { font-size: 16px !important; padding: 0 8px !important; }
          .ld-pricing-grid { flex-direction: column !important; align-items: center !important; }
          .ld-nav { padding: 16px 20px !important; }
          .ld-section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>

      {/* Star field */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map(s => (
          <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "rgba(255,245,200,1)", opacity: s.opacity,
            animation: `ld-twinkle ${2.5 + s.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* ── Nav ── */}
      <nav className="ld-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        background: "rgba(2,12,24,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(200,160,30,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🐑</span>
          <span style={{
            fontSize: 18, fontWeight: 400,
            background: "linear-gradient(135deg, #f5e4b0, #e8b840)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Dream Shepherd</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ld-nav-btn" onClick={onSignIn} style={{
            background: "none", border: "none", color: "#8a7540",
            fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif",
            padding: "8px 16px", transition: "color 0.2s",
          }}>Sign In</button>
          <button className="ld-cta" onClick={onSignIn} style={{
            background: "linear-gradient(135deg, #7a5200, #c89020)",
            border: "none", color: "white", padding: "8px 20px",
            borderRadius: 24, fontSize: 13, cursor: "pointer",
            fontFamily: "Georgia, serif", letterSpacing: 0.3,
            boxShadow: "0 2px 16px rgba(160,100,5,0.3)",
          }}>Get Started</button>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ── */}
        <section className="ld-section" style={{
          textAlign: "center", padding: "80px 32px 72px",
          animation: "ld-fadeUp 0.7s ease",
        }}>
          <div style={{
            fontSize: 56, marginBottom: 20,
            animation: "ld-float 4s ease-in-out infinite",
            filter: "drop-shadow(0 0 30px rgba(232,184,64,0.3))",
          }}>🐑</div>
          <div style={{
            fontSize: 11, letterSpacing: 6, color: "#8a7540",
            textTransform: "uppercase", marginBottom: 20,
          }}>
            Your dreams have meaning
          </div>
          <h1 className="ld-hero-title" style={{
            fontSize: 52, fontWeight: 400, margin: "0 0 24px",
            background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 1, lineHeight: 1.2,
          }}>
            Sleep. Dream.<br />Discover.
          </h1>
          <p className="ld-hero-sub" style={{
            fontSize: 18, color: "#8a7a50", lineHeight: 1.75,
            maxWidth: 520, margin: "0 auto 40px",
          }}>
            Your personal guided dream journal. Capture dreams before they fade, unveil their hidden meanings, and discover what it all means.
          </p>
          <button className="ld-cta" onClick={onSignIn} style={{
            background: "linear-gradient(135deg, #7a5200, #c89020)",
            border: "none", color: "white", padding: "16px 44px",
            borderRadius: 50, fontSize: 16, cursor: "pointer",
            letterSpacing: 0.5, fontFamily: "Georgia, serif",
            boxShadow: "0 4px 30px rgba(160,100,5,0.45)",
          }}>
            Start Journaling Free
          </button>
        </section>

        {/* ── Shimmer divider ── */}
        <div style={{
          height: 1, maxWidth: 200, margin: "0 auto",
          background: "linear-gradient(90deg, transparent, rgba(200,160,30,0.4), transparent)",
        }} />

        {/* ── Features ── */}
        <section className="ld-section" style={{ padding: "72px 32px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#8a7540", textTransform: "uppercase", marginBottom: 12 }}>
              Everything you need
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 400, color: "#f5e4b0", margin: 0 }}>
              A complete dream companion
            </h2>
          </div>
          <div className="ld-features-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} className="ld-feature" style={{
                background: "rgba(20,8,45,0.7)",
                border: "1px solid rgba(200,160,30,0.12)",
                borderRadius: 20, padding: "28px 24px",
              }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 15, color: "#f0d890", marginBottom: 10 }}>{f.title}</div>
                <p style={{ fontSize: 13, color: "#7a6a50", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="ld-section" style={{ padding: "72px 32px", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#8a7540", textTransform: "uppercase", marginBottom: 12 }}>
              Simple by design
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 400, color: "#f5e4b0", margin: 0 }}>
              How it works
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { step: "1", title: "Record your dream", desc: "Type or speak your dream as soon as you wake up. Add mood, theme, tags, and characters.", icon: "🌅" },
              { step: "2", title: "Get your interpretation", desc: "AI analyzes your dream and generates a personalized reflection with unique themes, meanings, and guidance.", icon: "✦" },
              { step: "3", title: "Discover your patterns", desc: "Over time, Dream Shepherd reveals recurring symbols, emotional trends, and connections across your dreams.", icon: "🔮" },
            ].map((s, i) => (
              <div key={s.step} style={{
                display: "flex", gap: 20, alignItems: "flex-start",
                padding: "28px 0",
                borderBottom: i < 2 ? "1px solid rgba(200,160,30,0.08)" : "none",
                animation: `ld-fadeUp 0.5s ease ${i * 0.15}s both`,
              }}>
                <div style={{
                  minWidth: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(120,60,220,0.2), rgba(200,160,30,0.15))",
                  border: "1px solid rgba(200,160,30,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 16, color: "#f0d890", marginBottom: 6 }}>
                    <span style={{ color: "#8a7540", marginRight: 8 }}>{s.step}.</span>{s.title}
                  </div>
                  <p style={{ fontSize: 14, color: "#7a6a50", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="ld-section" style={{ padding: "72px 32px", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#8a7540", textTransform: "uppercase", marginBottom: 12 }}>
              Simple pricing
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 400, color: "#f5e4b0", margin: 0 }}>
              Start free, upgrade when ready
            </h2>
          </div>
          <div className="ld-pricing-grid" style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            {/* Free */}
            <div style={{
              flex: 1, maxWidth: 300,
              background: "rgba(20,8,45,0.6)",
              border: "1px solid rgba(200,160,30,0.12)",
              borderRadius: 22, padding: "32px 28px",
            }}>
              <div style={{ fontSize: 18, color: "#f5e4b0", marginBottom: 4 }}>Free</div>
              <div style={{ fontSize: 32, color: "#e8b840", marginBottom: 4 }}>
                $0<span style={{ fontSize: 14, color: "#8a7540" }}>/forever</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b5c30", marginBottom: 24 }}>No credit card needed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Unlimited dream journaling",
                  "5 AI interpretations",
                  "2 dream visualizations",
                  "Dream patterns and stats",
                  "Lucid dream tools",
                  "Community access",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#8a7540", fontSize: 14 }}>&#10003;</span>
                    <span style={{ fontSize: 13, color: "#a09060" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="ld-cta" onClick={onSignIn} style={{
                width: "100%", marginTop: 24,
                background: "none", border: "1px solid rgba(200,160,30,0.3)",
                color: "#e8b840", padding: "12px",
                borderRadius: 14, fontSize: 14, cursor: "pointer",
                fontFamily: "Georgia, serif",
              }}>
                Get Started
              </button>
            </div>

            {/* Subscriber */}
            <div style={{
              flex: 1, maxWidth: 300,
              background: "linear-gradient(160deg, rgba(40,15,80,0.8), rgba(20,8,45,0.9))",
              border: "1px solid rgba(200,160,50,0.3)",
              borderRadius: 22, padding: "32px 28px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, #c89020, #e8c840, #c89020, transparent)",
                backgroundSize: "200% auto",
                animation: "ld-shimmer 3s linear infinite",
              }} />
              <div style={{ fontSize: 18, color: "#f5e4b0", marginBottom: 4 }}>Dream Shepherd</div>
              <div style={{ fontSize: 32, color: "#e8b840", marginBottom: 4 }}>
                $5.99<span style={{ fontSize: 14, color: "#8a7540" }}>/month</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b5c30", marginBottom: 24 }}>Cancel anytime</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Everything in Free",
                  "Unlimited AI interpretations",
                  "Unlimited dream visualizations",
                  "Deeper personalized insights",
                  "Priority access to new features",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#e8b840", fontSize: 14 }}>&#10003;</span>
                    <span style={{ fontSize: 13, color: "#c8a040" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="ld-cta" onClick={onSignIn} style={{
                width: "100%", marginTop: 24,
                background: "linear-gradient(135deg, #7a5200, #c89020)",
                border: "none", color: "white", padding: "12px",
                borderRadius: 14, fontSize: 14, cursor: "pointer",
                fontFamily: "Georgia, serif", letterSpacing: 0.3,
                boxShadow: "0 4px 20px rgba(160,100,5,0.3)",
              }}>
                Subscribe
              </button>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="ld-section" style={{ padding: "72px 32px 48px", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#8a7540", textTransform: "uppercase", marginBottom: 12 }}>
              Questions
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 400, color: "#f5e4b0", margin: 0 }}>
              Frequently asked
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((item, i) => (
              <div key={i} className="ld-faq" style={{
                background: "rgba(20,8,45,0.5)",
                border: "1px solid rgba(200,160,30,0.1)",
                borderRadius: 16, overflow: "hidden",
              }}>
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", padding: "16px 20px",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "Georgia, serif", textAlign: "left",
                }}>
                  <span style={{ fontSize: 14, color: "#f0d890" }}>{item.q}</span>
                  <span style={{
                    fontSize: 14, color: "#6b5c30",
                    transition: "transform 0.25s",
                    transform: expandedFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                    flexShrink: 0, marginLeft: 12,
                  }}>&#9660;</span>
                </button>
                {expandedFaq === i && (
                  <div style={{
                    padding: "0 20px 18px",
                    animation: "ld-fadeUp 0.2s ease",
                  }}>
                    <p style={{ fontSize: 13, color: "#8a7a50", lineHeight: 1.75, margin: 0 }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ textAlign: "center", padding: "60px 32px 48px" }}>
          <div style={{
            fontSize: 40, marginBottom: 16,
            animation: "ld-float 4s ease-in-out infinite",
          }}>🐑</div>
          <h2 style={{ fontSize: 24, fontWeight: 400, color: "#f5e4b0", margin: "0 0 12px" }}>
            Your dreams are waiting
          </h2>
          <p style={{ fontSize: 14, color: "#8a7540", margin: "0 0 28px" }}>
            Start your dream journal tonight. It's free.
          </p>
          <button className="ld-cta" onClick={onSignIn} style={{
            background: "linear-gradient(135deg, #7a5200, #c89020)",
            border: "none", color: "white", padding: "16px 44px",
            borderRadius: 50, fontSize: 16, cursor: "pointer",
            fontFamily: "Georgia, serif", letterSpacing: 0.5,
            boxShadow: "0 4px 30px rgba(160,100,5,0.45)",
          }}>
            Start Journaling Free
          </button>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          textAlign: "center", padding: "32px",
          borderTop: "1px solid rgba(200,160,30,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🐑</span>
            <span style={{ fontSize: 14, color: "#6b5c30" }}>Dream Shepherd</span>
          </div>
          <div style={{ fontSize: 11, color: "#3a3050" }}>
            Tend to your dreams like a shepherd.
          </div>
        </footer>
      </div>
    </div>
  );
}
