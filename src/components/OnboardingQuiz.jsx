import { useState, useEffect, useRef } from "react";
import StarField from "./StarField";

// ── Keyframe CSS (injected once) ─────────────────────────────────────────────
const KEYFRAMES = `
@keyframes onb-slideInRight  { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes onb-slideInLeft   { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes onb-float         { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes onb-pulse         { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes onb-orbit         { 0% { transform: rotate(0deg) translateX(28px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(28px) rotate(-360deg); } }
@keyframes onb-fadeIn        { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes onb-staggerUp     { from { opacity: 0; transform: translateY(24px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes onb-popIn         { 0% { opacity: 0; transform: scale(0.5); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes onb-shimmer       { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes onb-gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes onb-revealUp      { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes onb-twinkle       { 0%,100% { opacity: 0.2; } 50% { opacity: 0.9; } }
@keyframes onb-particle0 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(70px,0px) scale(0); } }
@keyframes onb-particle1 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(49px,49px) scale(0); } }
@keyframes onb-particle2 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(0px,70px) scale(0); } }
@keyframes onb-particle3 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(-49px,49px) scale(0); } }
@keyframes onb-particle4 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(-70px,0px) scale(0); } }
@keyframes onb-particle5 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(-49px,-49px) scale(0); } }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// Short onboarding quiz: Welcome → Dream entry → (Reveal, post-auth only)
// Pre-auth mode (before signup) stops after Dream entry and stashes the dream
// for the parent to use after sign-up completes.
// ═══════════════════════════════════════════════════════════════════════════════
export default function OnboardingQuiz({ onComplete, preAuth = false }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("right");
  const [animKey, setAnimKey] = useState(0);
  const [recentDream, setRecentDream] = useState("");
  const [interpretation, setInterpretation] = useState(null);
  const [aiThemes, setAiThemes] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const styleInjected = useRef(false);

  // Wrap any onComplete-callsite so the quiz fades out gracefully before
  // unmounting, which lets the auth screen fade in instead of "flashing" on.
  const finishWithFade = (payload) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onComplete(payload), 380);
  };

  // Post-auth has an extra reveal screen
  const REVEAL_STEP = 2;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!styleInjected.current) {
      styleInjected.current = true;
      const el = document.createElement("style");
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
      return () => document.head.removeChild(el);
    }
  }, []);

  const runInterpretation = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interpret-dream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          max_tokens: 1500,
          system: `You are a wise, empathetic dream interpreter rooted in the Christian tradition. Throughout Scripture, God spoke to people through dreams. Joseph interpreted Pharaoh's. Daniel discerned Nebuchadnezzar's. Jacob saw the ladder. You stand in that lineage as a thoughtful shepherd, not a pastor on a pulpit.

Draw on biblical wisdom, depth psychology, and dream symbolism. Speak gently and concretely. When relevant, reference Scripture naturally in passing. Do not quote large passages. Do not be preachy, do not moralize, do not assume the dreamer is in sin or crisis. Never use em dashes. Never be alarming.

Write 2 to 3 paragraphs of warm, poetic but grounded prose. Plain flowing prose only. No markdown, no headers, no bullet points, no JSON.`,
          messages: [{
            role: "user",
            content: `My most recent dream: "${recentDream || "No dream provided"}"`,
          }],
        }),
      });
      const data = await response.json();
      const text = (data.content?.map((b) => b.text || "").join("") || "").trim();
      setInterpretation(text || "Your dreams hold deep personal meaning. As you journal more, patterns will emerge that reveal the wisdom within your dreams.");
      // We aren't collecting recurring themes upfront anymore. The reveal screen
      // can show a short, generic set if helpful, or omit themes entirely.
      setAiThemes([]);
    } catch {
      setInterpretation("Your shepherd is preparing your reflection. As you begin journaling, your dream patterns will unfold and reveal their meaning.");
      setAiThemes([]);
    }
  };

  // Kick off AI when entering the reveal step (post-auth only)
  useEffect(() => {
    if (!preAuth && step === REVEAL_STEP && !processing && !interpretation) {
      setProcessing(true);
      runInterpretation().then(() => setProcessing(false));
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const goForward = () => {
    setDirection("right");
    setAnimKey((k) => k + 1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection("left");
    setAnimKey((k) => k + 1);
    setStep((s) => s - 1);
  };

  const handleComplete = () => {
    // Maintain the existing onComplete payload shape so App.jsx's
    // handleQuizComplete continues to work without changes.
    finishWithFade({
      displayName: "",
      profile: { name: "", ageRange: "", gender: "" },
      sleep: { sleepHours: "", sleepQuality: 0 },
      emotional: { stressLevel: "", mood: "" },
      recurringThemes: [],
      recentDream,
      interpretation,
      aiThemes,
    });
  };

  const handleSkip = () => {
    finishWithFade({
      displayName: "",
      profile: { name: "", ageRange: "", gender: "" },
      sleep: { sleepHours: "", sleepQuality: 0 },
      emotional: { stressLevel: "", mood: "" },
      recurringThemes: [],
      recentDream: "",
      interpretation: null,
      aiThemes: [],
      skipped: true,
    });
  };

  // Pre-auth Continue: stash the dream and let the parent route to signup.
  // The actual interpretation will be generated post-signup in App.jsx.
  const handlePreAuthContinue = () => {
    finishWithFade({
      displayName: "",
      profile: { name: "", ageRange: "", gender: "" },
      sleep: { sleepHours: "", sleepQuality: 0 },
      emotional: { stressLevel: "", mood: "" },
      recurringThemes: [],
      recentDream,
      interpretation: null,
      aiThemes: [],
    });
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const S = {
    overlay: {
      position: "relative",
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020c18 0%, #081830 50%, #0a0025 100%)",
      fontFamily: "Georgia, serif", color: "#f5e4b0",
      overflowX: "hidden",
    },
    inner: {
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      minHeight: "100vh", padding: "48px 0 80px",
      boxSizing: "border-box", position: "relative", zIndex: 1,
    },
    container: {
      maxWidth: 420, width: "94%", textAlign: "center", padding: "0 8px",
      position: "relative", zIndex: 1,
      animation: `${direction === "right" ? "onb-slideInRight" : "onb-slideInLeft"} 0.35s ease-out`,
    },
    title: {
      fontSize: 32, fontWeight: 400, margin: "0 0 14px", color: "#f5e4b0",
      lineHeight: 1.3,
    },
    subtitle: {
      fontSize: 15, color: "#c8a030", lineHeight: 1.65, margin: "0 0 32px",
    },
    ctaButton: (enabled = true) => ({
      width: "100%", maxWidth: 320, padding: "16px 32px", border: "none",
      borderRadius: 14, fontSize: 16, fontFamily: "Georgia, serif",
      fontWeight: 600, letterSpacing: 0.5, cursor: enabled ? "pointer" : "not-allowed",
      background: enabled
        ? "linear-gradient(135deg, #6847c0, #9066d4)"
        : "rgba(124,58,237,0.3)",
      color: enabled ? "#fff" : "rgba(255,255,255,0.4)",
      boxShadow: enabled ? "0 0 30px rgba(144,102,212,0.4)" : "none",
      transition: "all 0.25s ease",
    }),
    skipButton: {
      background: "none", border: "none", cursor: "pointer",
      color: "#9a8050", fontSize: 13, fontFamily: "Georgia, serif",
      marginTop: 16, padding: "8px 16px",
    },
    backButton: {
      position: "absolute", top: 24, left: 24,
      background: "none", border: "1px solid rgba(255,255,255,0.15)",
      color: "#c8a030", padding: "12px 20px", borderRadius: 30,
      fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 44,
      transition: "all 0.2s", zIndex: 10,
    },
    sectionTitle: {
      fontSize: 24, fontWeight: 400, margin: "0 0 8px", color: "#f5e4b0",
    },
    sectionSub: {
      fontSize: 14, color: "#9a8050", margin: "0 0 28px",
    },
    input: {
      width: "100%", padding: "14px 18px", borderRadius: 14, fontSize: 16,
      fontFamily: "Georgia, serif", background: "rgba(255,255,255,0.06)",
      border: "1.5px solid rgba(144,102,212,0.3)", color: "#f5e4b0",
      outline: "none", boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
  };

  // ── Background orbs + stars ────────────────────────────────────────────────
  const orbs = (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, willChange: "transform", transform: "translateZ(0)" }}>
      <StarField count={150} animation="onb-twinkle" />
      <div style={{
        position: "absolute", top: "-15%", right: "-20%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        animation: "onb-float 6s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-15%", width: 350, height: 350,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(232,184,64,0.08) 0%, transparent 70%)",
        animation: "onb-float 8s ease-in-out infinite reverse",
      }} />
    </div>
  );

  // ── Screen renderer ────────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (step) {
      // ── Screen 0: Welcome ────────────────────────────────────────────────
      case 0:
        return (
          <div key={animKey} style={S.container}>
            <div style={{
              fontSize: 64, marginBottom: 20,
              animation: "onb-float 4s ease-in-out infinite",
              filter: "drop-shadow(0 0 30px rgba(232,184,64,0.4))",
            }}>🐑</div>
            <h1 style={{ ...S.title, animation: "onb-fadeIn 0.5s ease-out" }}>
              Welcome to Dream Shepherd
            </h1>
            <p style={{
              fontSize: 14, color: "#8a7540", letterSpacing: 4,
              textTransform: "uppercase", marginBottom: 28,
              animation: "onb-fadeIn 0.5s ease-out 0.05s both",
            }}>
              Where Scripture meets the night
            </p>
            <p style={{
              ...S.subtitle,
              animation: "onb-fadeIn 0.5s ease-out 0.15s both",
              maxWidth: 340, margin: "0 auto 32px",
            }}>
              Let's start with a dream. Even a fragment is enough.
            </p>

            <button style={{ ...S.ctaButton(), animation: "onb-staggerUp 0.5s ease-out 0.3s both" }} onClick={goForward}>
              Tell me about a dream
            </button>
            <button
              onClick={handleSkip}
              style={{
                ...S.skipButton,
                animation: "onb-fadeIn 0.5s ease-out 0.6s both",
              }}
            >
              Skip for now
            </button>
          </div>
        );

      // ── Screen 1: Dream entry ─────────────────────────────────────────────
      case 1: {
        const len = recentDream.trim().length;
        const tooShort = len > 0 && len < 30;
        const ready = len >= 30;
        const continueLabel = preAuth ? "See what it means" : "Continue";
        const onContinueClick = () => {
          if (tooShort) return;
          if (!ready) {
            // No dream entered, treat as skip
            handleSkip();
            return;
          }
          // Both preAuth and post-auth flows advance to the next screen.
          // PreAuth lands on a bridge screen, post-auth on the AI reveal.
          goForward();
        };

        return (
          <div key={animKey} style={S.container}>
            <div style={{
              fontSize: 48, marginBottom: 16,
              animation: "onb-popIn 0.5s ease-out",
              filter: "drop-shadow(0 0 16px rgba(232,184,64,0.4))",
            }}>💭</div>
            <h2 style={{ ...S.sectionTitle, animation: "onb-fadeIn 0.5s ease-out" }}>
              Was there a recent dream you remember?
            </h2>
            <p style={{ ...S.sectionSub, animation: "onb-fadeIn 0.5s ease-out 0.1s both" }}>
              A fragment is fine. We'll help you see what it might mean.
            </p>

            <div style={{ animation: "onb-staggerUp 0.5s ease-out 0.2s both", marginBottom: 28 }}>
              <textarea
                placeholder="Last night I dreamed about..."
                value={recentDream}
                onChange={(e) => setRecentDream(e.target.value)}
                rows={5}
                style={{
                  ...S.input,
                  resize: "vertical", minHeight: 140, maxHeight: 280,
                  lineHeight: 1.6, fontSize: 15,
                  borderColor: tooShort
                    ? "rgba(255,180,60,0.4)"
                    : "rgba(200,160,30,0.3)",
                }}
              />
              {tooShort ? (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 6, fontSize: 12, color: "#c89040",
                }}>
                  <span>Add a few more words for a richer reading</span>
                  <span style={{ color: "#6b5c30" }}>{len}/30</span>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#6a5030", marginTop: 8, textAlign: "right" }}>
                  {len > 0 ? `${recentDream.length} characters` : "Optional but recommended"}
                </p>
              )}
            </div>

            <button
              style={{
                ...S.ctaButton(),
                animation: "onb-staggerUp 0.4s ease-out 0.35s both",
                opacity: tooShort ? 0.6 : 1,
                cursor: tooShort ? "not-allowed" : "pointer",
              }}
              onClick={onContinueClick}
            >
              {ready ? continueLabel : "Skip for now"}
            </button>
          </div>
        );
      }

      // ── Screen 2: Bridge to signup (pre-auth) OR AI reveal (post-auth) ────
      case 2: {
        // ── Pre-auth bridge: prepare the user for the signup handoff ───────
        if (preAuth) {
          // Show a fragment of the dream they just shared so the transition
          // feels continuous, then explain what happens next.
          const preview = recentDream.trim();
          const previewSnippet = preview.length > 140 ? preview.slice(0, 140) + "..." : preview;

          return (
            <div key={`${animKey}-bridge`} style={{ ...S.container, animation: "onb-revealUp 0.6s ease-out" }}>
              <div style={{
                fontSize: 44, marginBottom: 18,
                animation: "onb-float 4s ease-in-out infinite",
                filter: "drop-shadow(0 0 18px rgba(232,184,64,0.4))",
              }}>📜</div>

              <h2 style={{ ...S.sectionTitle, animation: "onb-fadeIn 0.5s ease-out" }}>
                Your reading is ready
              </h2>
              <p style={{
                ...S.sectionSub,
                animation: "onb-fadeIn 0.5s ease-out 0.1s both",
                maxWidth: 340, margin: "0 auto 22px",
              }}>
                Create a free account to see the Shepherd's reflection and save your dream to your journal.
              </p>

              {previewSnippet && (
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(144,102,212,0.25)",
                  borderRadius: 16, padding: "14px 18px",
                  textAlign: "left", marginBottom: 28,
                  animation: "onb-fadeIn 0.5s ease-out 0.2s both",
                }}>
                  <div style={{
                    fontSize: 11, letterSpacing: 2.5, color: "#7a6840",
                    textTransform: "uppercase", marginBottom: 6,
                  }}>
                    Your dream
                  </div>
                  <p style={{
                    fontSize: 13.5, color: "#c8a040", lineHeight: 1.6,
                    margin: 0, fontStyle: "italic",
                  }}>
                    "{previewSnippet}"
                  </p>
                </div>
              )}

              <button
                style={{
                  ...S.ctaButton(),
                  animation: "onb-staggerUp 0.4s ease-out 0.35s both",
                }}
                onClick={handlePreAuthContinue}
              >
                Continue to sign up
              </button>
              <p style={{
                fontSize: 11, color: "#6a5030", marginTop: 14, letterSpacing: 0.5,
                animation: "onb-fadeIn 0.5s ease-out 0.5s both",
              }}>
                Takes less than a minute.
              </p>
            </div>
          );
        }

        // ── Post-auth: AI processing + reveal ──────────────────────────────
        if (processing) {
          return (
            <div key={`${animKey}-proc`} style={{ ...S.container, animation: "onb-fadeIn 0.5s ease-out" }}>
              <div style={{
                position: "relative", width: 120, height: 120,
                margin: "0 auto 32px",
                animation: "onb-pulse 2.5s ease-in-out infinite",
              }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, rgba(232,184,64,0.5), rgba(104,71,192,0.7) 60%, rgba(40,10,80,0.85) 100%)",
                  boxShadow: "0 0 60px rgba(144,102,212,0.4), inset 0 0 30px rgba(232,184,64,0.15)",
                }} />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: 6, height: 6, borderRadius: "50%",
                    background: i % 2 === 0 ? "#e8b840" : "#9066d4",
                    animation: `onb-orbit ${1.6 + i * 0.3}s linear infinite`,
                    animationDelay: `${i * 0.35}s`,
                    transformOrigin: "0 0",
                    boxShadow: `0 0 6px ${i % 2 === 0 ? "rgba(232,184,64,0.6)" : "rgba(144,102,212,0.6)"}`,
                  }} />
                ))}
              </div>
              <h2 style={{
                ...S.sectionTitle, fontSize: 22,
                background: "linear-gradient(90deg, #f5e4b0, #9066d4, #e8b840, #f5e4b0)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "onb-shimmer 2.5s linear infinite",
              }}>
                Consulting the Shepherd...
              </h2>
              <p style={{ ...S.sectionSub, marginTop: 12, animation: "onb-fadeIn 0.8s ease-out 0.3s both" }}>
                Weighing the symbols and what they may carry
              </p>
              <div style={{
                width: "60%", maxWidth: 200, height: 3, borderRadius: 2,
                background: "rgba(255,255,255,0.08)", margin: "24px auto 0",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg, #6847c0, #e8b840, #9066d4)",
                  backgroundSize: "300% 100%",
                  animation: "onb-gradientShift 2s ease-in-out infinite",
                  width: "100%",
                }} />
              </div>
            </div>
          );
        }

        // ── Reveal ────────────────────────────────────────────────────────
        return (
          <div key={`${animKey}-result`} style={{ ...S.container, animation: "onb-revealUp 0.8s ease-out" }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={`star-${i}`} style={{
                position: "absolute", top: "10%", left: "50%",
                width: 6, height: 6, borderRadius: "50%",
                background: i % 2 === 0 ? "#e8b840" : "#9066d4",
                animation: `onb-particle${i} 1.5s ease-out ${0.2 + i * 0.1}s both`,
                pointerEvents: "none",
                boxShadow: `0 0 6px ${i % 2 === 0 ? "rgba(232,184,64,0.8)" : "rgba(144,102,212,0.8)"}`,
              }} />
            ))}

            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(144,102,212,0.3)",
              borderRadius: 24, padding: "24px 20px", marginBottom: 20,
              textAlign: "left",
            }}>
              <div style={{
                fontSize: 12, letterSpacing: 3, color: "#9a8050",
                textTransform: "uppercase", marginBottom: 8,
                animation: "onb-fadeIn 0.5s ease-out 0.3s both",
              }}>
                The Shepherd's Reflection
              </div>

              <div style={{ animation: "onb-fadeIn 0.5s ease-out 0.4s both", margin: "12px 0" }}>
                {(interpretation || "Your dreams hold deep personal meaning. Begin journaling to uncover the patterns within.")
                  .split(/\n\n+/)
                  .map((para, i) => (
                    <p key={i} style={{
                      fontSize: 15, color: "#d4c490", lineHeight: 1.7,
                      margin: "0 0 14px",
                      fontStyle: "italic",
                    }}>
                      {para.trim()}
                    </p>
                  ))}
              </div>
            </div>

            <p style={{
              fontSize: 14, color: "#9a8050", marginBottom: 24,
              animation: "onb-fadeIn 0.5s ease-out 0.8s both",
            }}>
              Your shepherd is ready to guide you
            </p>
            <button style={{
              ...S.ctaButton(),
              animation: "onb-staggerUp 0.5s ease-out 0.9s both",
            }} onClick={handleComplete}>
              Begin Journaling
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        ...S.overlay,
        opacity: leaving ? 0 : 1,
        transform: leaving ? "translateY(-12px)" : "translateY(0)",
        transition: "opacity 0.35s ease, transform 0.4s ease",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {orbs}

      {/* Back button on dream-entry and pre-auth bridge screens */}
      {!processing && !leaving && (step === 1 || (step === 2 && preAuth)) && (
        <button style={S.backButton} onClick={goBack}>
          ← Back
        </button>
      )}

      <div style={S.inner}>
        {renderScreen()}
      </div>
    </div>
  );
}
