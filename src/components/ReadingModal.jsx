import { useState, useEffect, useRef, useMemo } from "react";

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

const KEYFRAMES = `
@keyframes rm-fadeIn    { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rm-scaleIn   { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
@keyframes rm-pulse     { 0%,100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.12); opacity: 1; } }
@keyframes rm-twinkle   { 0%,100% { opacity: 0.15; } 50% { opacity: 0.8; } }
@keyframes rm-shimmer   { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes rm-ringPulse { 0%,100% { box-shadow: 0 0 20px rgba(144,102,212,0.2); } 50% { box-shadow: 0 0 60px rgba(144,102,212,0.5), 0 0 100px rgba(232,184,64,0.15); } }
@keyframes rm-badgeIn   { from { opacity: 0; transform: scale(0.7) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes rm-textFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function ReadingModal({ reading, onClose, onGenerateImage, userSettings, onUpgrade }) {
  const { interpretation = "", symbols = [], dreamTitle = "", themeConnections = [], dream } = reading;

  const [showText, setShowText] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [dreamImages, setDreamImages] = useState(
    dream?.dream_images?.map(i => i.image_url) ||
    (dream?.dream_image_url ? [dream.dream_image_url] : [])
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showVisualizeConfirm, setShowVisualizeConfirm] = useState(false);
  const [expandedTheme, setExpandedTheme] = useState(null);
  const styleInjected = useRef(false);

  const stars = useMemo(() =>
    Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 5,
    })), []);

  // Inject keyframes once
  useEffect(() => {
    if (!styleInjected.current) {
      styleInjected.current = true;
      const el = document.createElement("style");
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
  }, []);

  // Scroll to top on open
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGenerate = async () => {
    setGeneratingImage(true);
    const url = await onGenerateImage(dream);
    if (url) {
      setDreamImages(prev => [...prev, url]);
      setActiveImageIndex(dreamImages.length);
    }
    setGeneratingImage(false);
  };

  // Fade-in effect
  useEffect(() => {
    if (!interpretation) return;
    setShowText(false);
    setShowSymbols(false);
    setShowThemes(false);
    setShowClose(false);
    setExpandedTheme(null);

    const t1 = setTimeout(() => setShowText(true), 400);
    const t2 = setTimeout(() => setShowSymbols(true), 900);
    const t3 = setTimeout(() => setShowThemes(true), 1100);
    const t4 = setTimeout(() => setShowClose(true), 1300);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [interpretation]);

  // Allow ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        fontFamily: "Georgia, serif",
        animation: "rm-fadeIn 0.4s ease",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Background */}
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(2,4,14,0.92)",
        backdropFilter: "blur(8px)",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      {/* Scroll content wrapper */}
      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100%",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "48px 0 48px",
        boxSizing: "border-box",
      }}>

      {/* Star field */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map((s) => (
          <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "rgba(255,245,200,1)", opacity: s.opacity,
            animation: `rm-twinkle ${2.5 + s.delay}s ease-in-out infinite`,
            animationDelay: `${s.delay * 0.4}s`,
          }} />
        ))}
      </div>

      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", zIndex: 1,
          maxWidth: 500, width: "92%",
          background: "linear-gradient(160deg, rgba(18,6,44,0.99) 0%, rgba(8,3,20,0.99) 100%)",
          border: "1px solid rgba(144,102,212,0.4)",
          borderRadius: 28,
          boxShadow: "0 0 80px rgba(104,71,192,0.25), 0 24px 80px rgba(0,0,0,0.7)",
          animation: "rm-scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
      >
        {/* Top shimmer bar */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, #6847c0, #e8b840, #9066d4, transparent)",
          backgroundSize: "200% auto",
          animation: "rm-shimmer 3s linear infinite",
        }} />

        <div style={{ padding: "32px 28px 28px" }}>
          {/* Glowing orb icon */}
          <div style={{
            textAlign: "center", marginBottom: 24,
            animation: "rm-ringPulse 3s ease-in-out infinite",
          }}>
            <div style={{
              fontSize: 52,
              display: "inline-block",
              animation: "rm-pulse 3s ease-in-out infinite",
              filter: "drop-shadow(0 0 20px rgba(144,102,212,0.6)) drop-shadow(0 0 40px rgba(232,184,64,0.2))",
            }}>
              <span style={{ color: "#e8b840", textShadow: "0 0 20px rgba(232,184,64,0.8), 0 0 40px rgba(232,184,64,0.4)" }}>✦</span>
            </div>
          </div>

          {/* Title */}
          {dreamTitle && (
            <div style={{
              textAlign: "center", marginBottom: 6,
              fontSize: 11, letterSpacing: 3, color: "#6b4da0",
              textTransform: "uppercase",
              animation: "rm-fadeIn 0.5s ease 0.2s both",
            }}>
              {dreamTitle}
            </div>
          )}

          {/* "The Shepherd's Reading" header */}
          <div style={{
            textAlign: "center", marginBottom: 24,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            animation: "rm-fadeIn 0.5s ease 0.3s both",
          }}>
            <div style={{
              flex: 1, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(144,102,212,0.5))",
            }} />
            <span style={{
              fontSize: 10, letterSpacing: 4, color: "#9066d4",
              textTransform: "uppercase",
            }}>
              The Shepherd's Reflection
            </span>
            <div style={{
              flex: 1, height: 1,
              background: "linear-gradient(90deg, rgba(144,102,212,0.5), transparent)",
            }} />
          </div>

          {/* Interpretation text */}
          {showText && (
            <p style={{
              fontSize: 16, color: "#f0dfa0", lineHeight: 1.9,
              margin: 0, fontStyle: "italic",
              textShadow: "0 1px 12px rgba(200,160,30,0.2)",
              letterSpacing: 0.2,
              whiteSpace: "pre-wrap",
              animation: "rm-textFadeIn 0.8s ease both",
            }}>
              {interpretation}
            </p>
          )}

          {/* Symbol badges */}
          {showSymbols && symbols?.length > 0 && (
            <div style={{ marginTop: 22, animation: "rm-fadeIn 0.5s ease" }}>
              <div style={{
                height: 1, marginBottom: 16,
                background: "linear-gradient(90deg, transparent, rgba(144,102,212,0.35), transparent)",
              }} />
              <div style={{
                fontSize: 9, letterSpacing: 3, color: "#6b4da0",
                textTransform: "uppercase", marginBottom: 10,
              }}>
                Symbols Detected
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {symbols.map((s, i) => (
                  <span key={s} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(104,71,192,0.18)",
                    border: "1px solid rgba(144,102,212,0.32)",
                    borderRadius: 20, padding: "5px 14px",
                    fontSize: 12, color: "#c4a0ff",
                    boxShadow: "0 0 12px rgba(104,71,192,0.2)",
                    animation: `rm-badgeIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
                  }}>
                    {DREAM_DICTIONARY[s]?.symbol} {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Theme connections */}
          {showThemes && themeConnections.length > 0 && (
            <div style={{ marginTop: 22, animation: "rm-fadeIn 0.5s ease" }}>
              <div style={{
                height: 1, marginBottom: 16,
                background: "linear-gradient(90deg, transparent, rgba(232,184,64,0.25), transparent)",
              }} />
              <div style={{
                fontSize: 9, letterSpacing: 3, color: "#8a7540",
                textTransform: "uppercase", marginBottom: 10,
              }}>
                Theme Connections
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {themeConnections.map((theme, i) => (
                  <button
                    key={theme.key}
                    onClick={() => setExpandedTheme(prev => prev?.key === theme.key ? null : theme)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: expandedTheme?.key === theme.key ? "rgba(200,160,30,0.22)" : "rgba(200,160,30,0.1)",
                      border: `1px solid ${expandedTheme?.key === theme.key ? "rgba(200,160,30,0.6)" : "rgba(200,160,30,0.25)"}`,
                      borderRadius: 20, padding: "5px 14px",
                      fontSize: 12, color: "#d4a840",
                      cursor: "pointer", fontFamily: "Georgia, serif",
                      animation: `rm-badgeIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                  >
                    {theme.symbol} {theme.key}
                  </button>
                ))}
              </div>

              {expandedTheme && (
                <div style={{
                  marginTop: 16,
                  background: "rgba(10,6,24,0.85)",
                  border: "1px solid rgba(200,160,30,0.2)",
                  borderRadius: 18, padding: "20px 18px",
                  animation: "rm-fadeIn 0.35s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 30 }}>{expandedTheme.symbol}</span>
                    <div>
                      <div style={{ fontSize: 14, color: "#f0dfa0", fontStyle: "italic" }}>{expandedTheme.key}</div>
                      {expandedTheme.category && (
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "#6b4da0", textTransform: "uppercase", marginTop: 2 }}>
                          {expandedTheme.category}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(200,160,30,0.2), transparent)", marginBottom: 14 }} />
                  {expandedTheme.meaning && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12 }}>💡</span>
                        <span style={{ fontSize: 9, letterSpacing: 2, color: "#8a7540", textTransform: "uppercase" }}>Possible Meaning</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#c8a870", lineHeight: 1.75, margin: 0 }}>{expandedTheme.meaning}</p>
                    </div>
                  )}
                  {expandedTheme.guidance && (
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(144,102,212,0.15)",
                      borderRadius: 14, padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12 }}>🧭</span>
                        <span style={{ fontSize: 9, letterSpacing: 2, color: "#8a7540", textTransform: "uppercase" }}>Guidance</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#c8a870", lineHeight: 1.75, margin: 0 }}>{expandedTheme.guidance}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dream image gallery */}
          {dreamImages.length > 0 && (
            <div style={{ marginTop: 22, animation: "rm-fadeIn 0.8s ease" }}>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
                <img
                  src={dreamImages[activeImageIndex]}
                  alt="Dream visualization"
                  style={{ width: "100%", display: "block" }}
                />
                {dreamImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex(i => Math.max(0, i - 1))}
                      disabled={activeImageIndex === 0}
                      style={{
                        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.5)", border: "none", color: "#fff",
                        borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
                        fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: activeImageIndex === 0 ? 0.3 : 1,
                      }}
                    >‹</button>
                    <button
                      onClick={() => setActiveImageIndex(i => Math.min(dreamImages.length - 1, i + 1))}
                      disabled={activeImageIndex === dreamImages.length - 1}
                      style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.5)", border: "none", color: "#fff",
                        borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
                        fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: activeImageIndex === dreamImages.length - 1 ? 0.3 : 1,
                      }}
                    >›</button>
                  </>
                )}
              </div>
              {dreamImages.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                  {dreamImages.map((_, i) => (
                    <div key={i} onClick={() => setActiveImageIndex(i)} style={{
                      width: 6, height: 6, borderRadius: "50%", cursor: "pointer",
                      background: i === activeImageIndex ? "#e8b840" : "rgba(200,160,30,0.3)",
                      transition: "background 0.2s",
                    }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Visualize button */}
          {showClose && dream?.id && !showVisualizeConfirm && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                onClick={() => {
                  if (userSettings?.is_pro) {
                    handleGenerate();
                  } else {
                    setShowVisualizeConfirm(true);
                  }
                }}
                disabled={generatingImage}
                style={{
                  background: "none",
                  border: "1px solid rgba(232,184,64,0.4)",
                  color: generatingImage ? "#6b5c30" : "#c8a040",
                  padding: "10px 28px", borderRadius: 30, fontSize: 13,
                  cursor: generatingImage ? "not-allowed" : "pointer",
                  fontFamily: "Georgia, serif", letterSpacing: 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { if (!generatingImage) { e.target.style.borderColor = "rgba(232,184,64,0.8)"; e.target.style.color = "#e8b840"; } }}
                onMouseLeave={(e) => { if (!generatingImage) { e.target.style.borderColor = "rgba(232,184,64,0.4)"; e.target.style.color = "#c8a040"; } }}
              >
                {generatingImage ? "Creating your vision..." : dreamImages.length > 0 ? "✦ Generate Another Vision" : "✦ Visualize Dream"}
              </button>
            </div>
          )}

          {/* Free user confirmation panel */}
          {showVisualizeConfirm && !generatingImage && (
            <div style={{
              marginTop: 16, padding: "20px 18px",
              background: "rgba(10,6,24,0.85)",
              border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 18,
              animation: "rm-fadeIn 0.3s ease",
            }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎨</div>
                <div style={{ fontSize: 14, color: "#f0dfa0", marginBottom: 8 }}>
                  Use a free visualization?
                </div>
                <p style={{ fontSize: 12, color: "#8a7540", lineHeight: 1.6, margin: "0 0 4px" }}>
                  You have <span style={{ color: "#e8b840", fontWeight: 600 }}>{Math.max(0, 2 - (userSettings?.image_generation_count || 0))}</span> of 2 free visualizations remaining.
                  Each one generates a unique AI painting of your dream.
                </p>
              </div>

              <div style={{
                height: 1, margin: "14px 0",
                background: "linear-gradient(90deg, transparent, rgba(200,160,30,0.2), transparent)",
              }} />

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
                <button
                  onClick={() => setShowVisualizeConfirm(false)}
                  style={{
                    background: "none", border: "1px solid rgba(144,102,212,0.3)",
                    color: "#8a6ab0", padding: "9px 20px", borderRadius: 30,
                    fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowVisualizeConfirm(false); handleGenerate(); }}
                  style={{
                    background: "linear-gradient(135deg, #7a5200, #c89020)",
                    border: "none", color: "#fff", padding: "9px 20px", borderRadius: 30,
                    fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
                    fontWeight: 600, letterSpacing: 0.3,
                  }}
                >
                  ✦ Visualize Dream
                </button>
              </div>

              <div style={{
                background: "rgba(200,160,30,0.06)",
                border: "1px solid rgba(200,160,30,0.15)",
                borderRadius: 14, padding: "12px 14px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#c8a040", marginBottom: 4, fontWeight: 600 }}>
                  Want unlimited visualizations?
                </div>
                <p style={{ fontSize: 11, color: "#6b5c30", lineHeight: 1.5, margin: "0 0 10px" }}>
                  Dream Shepherd Pro gives you unlimited AI dream art, unlimited interpretations, and more.
                </p>
                <button
                  onClick={() => { setShowVisualizeConfirm(false); if (onUpgrade) onUpgrade(); }}
                  style={{
                    background: "linear-gradient(135deg, #c8a020, #e8c840)",
                    border: "none", color: "#1a1000", padding: "8px 22px", borderRadius: 20,
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    letterSpacing: 0.5,
                  }}
                >
                  Upgrade to Pro - $5.99/mo
                </button>
              </div>
            </div>
          )}

          {/* Close button */}
          {showClose && (
            <div style={{
              marginTop: 28, textAlign: "center",
              animation: "rm-fadeIn 0.5s ease",
            }}>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "1px solid rgba(144,102,212,0.35)",
                  color: "#8a6ab0", padding: "10px 32px",
                  borderRadius: 30, fontSize: 13,
                  cursor: "pointer", fontFamily: "Georgia, serif",
                  letterSpacing: 1, transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "rgba(144,102,212,0.7)";
                  e.target.style.color = "#c4a0ff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "rgba(144,102,212,0.35)";
                  e.target.style.color = "#8a6ab0";
                }}
              >
                Close
              </button>
              <div style={{
                marginTop: 8, fontSize: 11, color: "#3a2a50",
              }}>
                Tap anywhere to dismiss
              </div>
            </div>
          )}
        </div>

        {/* Bottom shimmer bar */}
        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(144,102,212,0.3), rgba(232,184,64,0.15), transparent)",
        }} />
      </div>
      </div>
    </div>
  );
}
