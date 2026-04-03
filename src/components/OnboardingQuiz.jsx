import { useState, useEffect, useRef, useMemo } from "react";

// ── Dream Themes (for recurring themes grid) ────────────────────────────────
const DREAM_THEMES = [
  { id: "flying", label: "Flying", emoji: "🦅" },
  { id: "falling", label: "Falling", emoji: "🌀" },
  { id: "being-chased", label: "Being Chased", emoji: "🏃" },
  { id: "water-ocean", label: "Water / Ocean", emoji: "🌊" },
  { id: "teeth", label: "Teeth Falling Out", emoji: "🦷" },
  { id: "being-lost", label: "Being Lost", emoji: "🗺️" },
  { id: "death", label: "Death / Dying", emoji: "💀" },
  { id: "animals", label: "Animals", emoji: "🐾" },
  { id: "school-exams", label: "School / Exams", emoji: "📝" },
  { id: "being-late", label: "Being Late", emoji: "⏰" },
  { id: "naked-public", label: "Naked in Public", emoji: "😳" },
  { id: "natural-disaster", label: "Natural Disasters", emoji: "🌪️" },
  { id: "monsters", label: "Monsters / Creatures", emoji: "👹" },
  { id: "loved-ones", label: "Loved Ones", emoji: "❤️" },
  { id: "travel", label: "Travel / Journey", emoji: "✈️" },
  { id: "war-conflict", label: "War / Conflict", emoji: "⚔️" },
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "heights", label: "Heights / Climbing", emoji: "🧗" },
  { id: "trapped", label: "Trapped / Confined", emoji: "🔒" },
  { id: "magic", label: "Magic / Supernatural", emoji: "✨" },
  { id: "romance", label: "Romance / Love", emoji: "💕" },
  { id: "childhood", label: "Childhood Places", emoji: "🏠" },
  { id: "cant-move", label: "Paralysis / Can't Move", emoji: "🧊" },
  { id: "darkness", label: "Darkness / Shadows", emoji: "🌑" },
];

// ── Options ─────────────────────────────────────────────────────────────────
const AGE_RANGES = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const SLEEP_HOURS = ["Less than 5", "5–6 hours", "6–7 hours", "7–8 hours", "8+ hours"];
const SLEEP_QUALITY = [
  { id: 1, label: "Very Poor", emoji: "😫" },
  { id: 2, label: "Poor", emoji: "😔" },
  { id: 3, label: "Fair", emoji: "😐" },
  { id: 4, label: "Good", emoji: "😊" },
  { id: 5, label: "Excellent", emoji: "😴" },
];
const STRESS_LEVELS = [
  { id: "low", label: "Low", emoji: "😌" },
  { id: "moderate", label: "Moderate", emoji: "😐" },
  { id: "high", label: "High", emoji: "😰" },
  { id: "very-high", label: "Very High", emoji: "🤯" },
];
const MOOD_OPTIONS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "anxious", label: "Anxious", emoji: "😟" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "😩" },
];

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
@keyframes onb-ringExpand    { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.8; } 100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; } }
@keyframes onb-glow          { 0%, 100% { box-shadow: 0 0 20px rgba(144,102,212,0.15); } 50% { box-shadow: 0 0 40px rgba(144,102,212,0.4), 0 0 80px rgba(232,184,64,0.15); } }
@keyframes onb-revealUp      { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes onb-traitSlide    { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes onb-gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes onb-rotateGlow    { 0% { transform: translate(-50%,-50%) rotate(0deg); } 100% { transform: translate(-50%,-50%) rotate(360deg); } }
@keyframes onb-twinkle       { 0%,100% { opacity: 0.2; } 50% { opacity: 0.9; } }
@keyframes onb-particle0 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(70px,0px) scale(0); } }
@keyframes onb-particle1 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(49px,49px) scale(0); } }
@keyframes onb-particle2 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(0px,70px) scale(0); } }
@keyframes onb-particle3 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(-49px,49px) scale(0); } }
@keyframes onb-particle4 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(-70px,0px) scale(0); } }
@keyframes onb-particle5 { 0% { opacity:0; transform:scale(0); } 30% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:translate(-49px,-49px) scale(0); } }
`;

// ═══════════════════════════════════════════════════════════════════════════════
export default function OnboardingQuiz({ onComplete, preAuth = false }) {
  const TOTAL_STEPS = preAuth ? 5 : 6; // preAuth: 0-4 (no AI screen), post-auth: 0-5

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("right");
  const [animKey, setAnimKey] = useState(0);

  // Screen 2: About You
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");

  // Screen 3: Your Inner World (merged sleep + emotional)
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(0);
  const [stressLevel, setStressLevel] = useState("");
  const [mood, setMood] = useState("");

  // Screen 4: Recurring Themes
  const [themes, setThemes] = useState([]);

  // Screen 1: Recent Dream
  const [recentDream, setRecentDream] = useState("");

  // Screen 5: AI Processing + Result (post-auth only)
  const [interpretation, setInterpretation] = useState(null);
  const [aiThemes, setAiThemes] = useState([]);
  const [processing, setProcessing] = useState(false);

  const styleInjected = useRef(false);

  // Stars
  const stars = useMemo(() =>
    Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.4,
      opacity: Math.random() * 0.6 + 0.15,
      delay: Math.random() * 4,
    })), []);

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

  // AI interpretation when entering step 5 (post-auth only)
  useEffect(() => {
    if (!preAuth && step === 5 && !processing && !interpretation) {
      setProcessing(true);
      runInterpretation().then(() => setProcessing(false));
    }
  }, [step]); // eslint-disable-line

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
          system: `You are a wise, empathetic dream interpreter drawing from psychology, symbolism, and spiritual traditions including Biblical wisdom. Dreams hold meaning across many traditions, and in scripture figures like Joseph, Daniel, and Jacob received divine insight through dreams. The user is completing onboarding for a dream journal app. Analyze their profile, sleep patterns, emotional state, and recent dream to provide a personalized interpretation. Write 2-3 paragraphs of warm, poetic but grounded prose. Never be alarming. Do not use markdown formatting, headers, bullet points, or code blocks — plain flowing prose only. Do not include any JSON or structured data.`,
          messages: [{
            role: "user",
            content: `My name is ${name || "Anonymous"}. Age: ${ageRange || "not provided"}. Gender: ${gender || "not provided"}. Sleep: ${sleepHours || "not provided"}, quality: ${SLEEP_QUALITY.find(s => s.id === sleepQuality)?.label || "not provided"}. Stress: ${stressLevel || "not provided"}. Mood: ${mood || "not provided"}. Recurring dream themes I experience: ${themes.length > 0 ? themes.join(", ") : "none selected"}. My most recent dream: "${recentDream || "No dream provided"}"`,
          }],
        }),
      });
      const data = await response.json();
      const text = (data.content?.map((b) => b.text || "").join("") || "").trim();
      setInterpretation(text || "Your dreams hold deep personal meaning. As you journal more, patterns will emerge that reveal the wisdom within your dreams.");
      setAiThemes(themes.slice(0, 5));
    } catch {
      setInterpretation("Your shepherd is preparing your reflection. As you begin journaling, your dream patterns will unfold and reveal their meaning.");
      setAiThemes(themes.slice(0, 3));
    }
  };

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

  const canContinue = () => {
    if (step === 1) return true; // dream text optional
    if (step === 2) return name.trim() !== ""; // age + gender optional
    if (step === 3) return sleepHours !== "" && sleepQuality > 0 && stressLevel !== "" && mood !== "";
    if (step === 4) return true; // themes optional
    return true;
  };

  const handleComplete = () => {
    onComplete({
      displayName: name,
      profile: { name, ageRange, gender },
      sleep: { sleepHours, sleepQuality },
      emotional: { stressLevel, mood },
      recurringThemes: themes,
      recentDream,
      interpretation,
      aiThemes,
    });
  };

  const handleSkip = () => {
    onComplete({
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

  const toggleTheme = (id) => {
    setThemes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
      minHeight: "100vh", padding: "80px 0 80px",
      boxSizing: "border-box", position: "relative", zIndex: 1,
    },
    container: {
      maxWidth: 420, width: "90%", textAlign: "center", padding: "0 8px",
      position: "relative", zIndex: 1,
      animation: `${direction === "right" ? "onb-slideInRight" : "onb-slideInLeft"} 0.35s ease-out`,
    },
    title: {
      fontSize: 28, fontWeight: 400, margin: "0 0 14px", color: "#f5e4b0",
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
    backButton: {
      position: "absolute", top: 24, left: 24,
      background: "none", border: "1px solid rgba(255,255,255,0.15)",
      color: "#c8a030", padding: "8px 18px", borderRadius: 30,
      fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif",
      transition: "all 0.2s", zIndex: 10,
    },
    sectionTitle: {
      fontSize: 24, fontWeight: 400, margin: "0 0 8px", color: "#f5e4b0",
    },
    sectionSub: {
      fontSize: 14, color: "#9a8050", margin: "0 0 28px",
    },
    label: {
      fontSize: 14, color: "#c8a030", marginBottom: 8, textAlign: "left", display: "block",
    },
    input: {
      width: "100%", padding: "14px 18px", borderRadius: 14, fontSize: 15,
      fontFamily: "Georgia, serif", background: "rgba(255,255,255,0.06)",
      border: "1.5px solid rgba(144,102,212,0.3)", color: "#f5e4b0",
      outline: "none", boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    pillButton: (selected) => ({
      padding: "10px 18px", borderRadius: 30, fontSize: 14,
      fontFamily: "Georgia, serif", cursor: "pointer",
      background: selected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
      border: `1.5px solid ${selected ? "rgba(144,102,212,0.7)" : "rgba(255,255,255,0.1)"}`,
      color: selected ? "#d4b0ff" : "#c8a030",
      boxShadow: selected ? "0 0 16px rgba(144,102,212,0.3)" : "none",
      transition: "all 0.25s ease",
      transform: selected ? "scale(1.05)" : "scale(1)",
    }),
    divider: {
      height: 1, background: "rgba(232,184,64,0.15)", margin: "24px 0",
    },
  };

  // ── Background orbs + stars ────────────────────────────────────────────────
  const orbs = (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, willChange: "transform", transform: "translateZ(0)" }}>
      {stars.map((s) => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "rgba(255,245,200,1)", opacity: s.opacity,
          animation: `onb-twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
      <div style={{
        position: "absolute", top: "-15%", right: "-20%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        animation: "onb-float 6s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-15%", width: 350, height: 350,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(200,160,48,0.08) 0%, transparent 70%)",
        animation: "onb-float 8s ease-in-out infinite 1s",
      }} />
      <div style={{
        position: "absolute", top: "30%", left: "50%", width: 250, height: 250,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(100,180,255,0.06) 0%, transparent 70%)",
        transform: "translateX(-50%)",
        animation: "onb-float 7s ease-in-out infinite 2s",
      }} />
    </div>
  );

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progressBar = (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: 4, background: "rgba(255,255,255,0.06)", zIndex: 10,
    }}>
      <div style={{
        height: "100%",
        width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
        background: "linear-gradient(90deg, #6847c0, #e8b840)",
        borderRadius: "0 2px 2px 0",
        transition: "width 0.4s ease",
      }} />
    </div>
  );

  // ── Render each screen ─────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (step) {
      // ── Screen 0: Welcome ──────────────────────────────────────────────────
      case 0:
        return (
          <div key={animKey} style={{ ...S.container, animation: "onb-fadeIn 0.6s ease-out" }}>
            <div style={{
              fontSize: 80, marginBottom: 24,
              animation: "onb-pulse 3s ease-in-out infinite",
            }}>
              🐑
            </div>
            <h1 style={{ ...S.title, fontSize: 32 }}>Welcome to Dream Shepherd</h1>
            <p style={S.subtitle}>
              Your faithful companion for understanding what your dreams may be telling you.
              Let us get to know you in a few simple steps.
            </p>

            {/* Value prop bullets */}
            <div style={{ marginBottom: 32, animation: "onb-staggerUp 0.5s ease-out 0.2s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <span style={{ fontSize: 14, color: "#9a8050" }}>Record dreams before they fade</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                <span style={{ fontSize: 18 }}>✦</span>
                <span style={{ fontSize: 14, color: "#9a8050" }}>Discover patterns and meaning with guided reflection</span>
              </div>
            </div>

            <button style={{ ...S.ctaButton(), animation: "onb-staggerUp 0.5s ease-out 0.3s both" }} onClick={goForward}>
              Get Started
            </button>
            <button
              onClick={handleSkip}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#9a8050", fontSize: 13, fontFamily: "Georgia, serif",
                marginTop: 16, padding: "8px 16px",
                animation: "onb-fadeIn 0.5s ease-out 0.6s both",
              }}
            >
              Skip for now
            </button>
          </div>
        );

      // ── Screen 1: Your First Dream ─────────────────────────────────────────
      case 1:
        return (
          <div key={animKey} style={S.container}>
            <div style={{
              fontSize: 48, marginBottom: 16,
              animation: "onb-popIn 0.5s ease-out",
              filter: "drop-shadow(0 0 16px rgba(232,184,64,0.4))",
            }}>💭</div>
            <h2 style={{ ...S.sectionTitle, animation: "onb-fadeIn 0.5s ease-out" }}>Your First Dream</h2>
            <p style={{ ...S.sectionSub, animation: "onb-fadeIn 0.5s ease-out 0.1s both" }}>
              Describe a recent dream in a few words or sentences
            </p>

            <div style={{ animation: "onb-staggerUp 0.5s ease-out 0.2s both", marginBottom: 28 }}>
              <textarea
                placeholder="Last night I dreamed about..."
                value={recentDream}
                onChange={(e) => setRecentDream(e.target.value)}
                rows={5}
                style={{
                  ...S.input,
                  resize: "vertical", minHeight: 120, maxHeight: 250,
                  lineHeight: 1.6, fontSize: 15,
                  borderColor: recentDream.trim().length > 0 && recentDream.trim().length < 30
                    ? "rgba(255,180,60,0.4)"
                    : "rgba(200,160,30,0.3)",
                }}
              />
              {recentDream.trim().length > 0 && recentDream.trim().length < 30 ? (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 6, fontSize: 12, color: "#c89040",
                }}>
                  <span>Add more detail for a richer interpretation</span>
                  <span style={{ color: "#6b5c30" }}>{recentDream.trim().length}/30</span>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#6a5030", marginTop: 8, textAlign: "right" }}>
                  {recentDream.length > 0 ? `${recentDream.length} characters` : "Optional but recommended"}
                </p>
              )}
            </div>

            <button
              style={{
                ...S.ctaButton(),
                animation: "onb-staggerUp 0.4s ease-out 0.35s both",
                opacity: recentDream.trim().length > 0 && recentDream.trim().length < 30 ? 0.6 : 1,
                cursor: recentDream.trim().length > 0 && recentDream.trim().length < 30 ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                if (recentDream.trim().length > 0 && recentDream.trim().length < 30) return;
                goForward();
              }}
            >
              {recentDream.trim() ? "Continue" : "Skip"}
            </button>
          </div>
        );

      // ── Screen 2: About You ────────────────────────────────────────────────
      case 2:
        return (
          <div key={animKey} style={S.container}>
            <div style={{
              fontSize: 48, marginBottom: 16,
              animation: "onb-popIn 0.5s ease-out",
            }}>👤</div>
            <h2 style={{ ...S.sectionTitle, animation: "onb-fadeIn 0.5s ease-out" }}>Tell us about yourself</h2>
            <p style={{ ...S.sectionSub, animation: "onb-fadeIn 0.5s ease-out 0.1s both" }}>This helps personalize your experience</p>

            {/* Name */}
            <div style={{ marginBottom: 20, animation: "onb-staggerUp 0.4s ease-out 0.15s both" }}>
              <label style={S.label}>Your name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={S.input}
              />
            </div>

            {/* Age Range */}
            <div style={{ marginBottom: 20, animation: "onb-staggerUp 0.4s ease-out 0.25s both" }}>
              <label style={S.label}>Age range <span style={{ color: "#6a5030", fontSize: 12 }}>(optional)</span></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {AGE_RANGES.map((age) => (
                  <button key={age} onClick={() => setAgeRange(age)} style={S.pillButton(ageRange === age)}>
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div style={{ marginBottom: 28, animation: "onb-staggerUp 0.4s ease-out 0.35s both" }}>
              <label style={S.label}>Gender <span style={{ color: "#6a5030", fontSize: 12 }}>(optional)</span></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {GENDERS.map((g) => (
                  <button key={g} onClick={() => setGender(g)} style={S.pillButton(gender === g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              style={{ ...S.ctaButton(canContinue()), animation: "onb-staggerUp 0.4s ease-out 0.45s both" }}
              onClick={canContinue() ? goForward : undefined}
            >
              Continue
            </button>
          </div>
        );

      // ── Screen 3: Your Inner World (sleep + emotional merged) ────────────
      case 3:
        return (
          <div key={animKey} style={S.container}>
            <div style={{
              fontSize: 48, marginBottom: 16,
              animation: "onb-popIn 0.5s ease-out",
              filter: "drop-shadow(0 0 12px rgba(144,102,212,0.4))",
            }}>🌙</div>
            <h2 style={{ ...S.sectionTitle, animation: "onb-fadeIn 0.5s ease-out" }}>Your Inner World</h2>
            <p style={{ ...S.sectionSub, animation: "onb-fadeIn 0.5s ease-out 0.1s both" }}>Sleep and emotional patterns shape your dreams</p>

            {/* Sleep Hours */}
            <div style={{ marginBottom: 20, animation: "onb-staggerUp 0.4s ease-out 0.15s both" }}>
              <label style={S.label}>How many hours do you usually sleep?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {SLEEP_HOURS.map((h) => (
                  <button key={h} onClick={() => setSleepHours(h)} style={S.pillButton(sleepHours === h)}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Quality */}
            <div style={{ marginBottom: 20, animation: "onb-staggerUp 0.4s ease-out 0.25s both" }}>
              <label style={S.label}>How would you rate your sleep quality?</label>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {SLEEP_QUALITY.map((sq) => (
                  <button key={sq.id} onClick={() => setSleepQuality(sq.id)} style={{
                    ...S.pillButton(sleepQuality === sq.id),
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "12px 10px", minWidth: 52,
                  }}>
                    <span style={{ fontSize: 22 }}>{sq.emoji}</span>
                    <span style={{ fontSize: 11 }}>{sq.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={S.divider} />

            {/* Stress Level */}
            <div style={{ marginBottom: 24, animation: "onb-staggerUp 0.4s ease-out 0.35s both" }}>
              <label style={S.label}>Current stress level</label>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {STRESS_LEVELS.map((sl) => (
                  <button key={sl.id} onClick={() => setStressLevel(sl.id)} style={{
                    ...S.pillButton(stressLevel === sl.id),
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "14px 14px", minWidth: 70,
                  }}>
                    <span style={{ fontSize: 24 }}>{sl.emoji}</span>
                    <span style={{ fontSize: 12 }}>{sl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div style={{ marginBottom: 28, animation: "onb-staggerUp 0.4s ease-out 0.45s both" }}>
              <label style={S.label}>How has your mood been lately?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {MOOD_OPTIONS.map((m) => (
                  <button key={m.id} onClick={() => setMood(m.id)} style={{
                    ...S.pillButton(mood === m.id),
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 18px",
                  }}>
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              style={{ ...S.ctaButton(canContinue()), animation: "onb-staggerUp 0.4s ease-out 0.55s both" }}
              onClick={canContinue() ? goForward : undefined}
            >
              Continue
            </button>
          </div>
        );

      // ── Screen 4: Recurring Dream Themes ──────────────────────────────────
      case 4:
        return (
          <div key={animKey} style={S.container}>
            <div style={{
              fontSize: 48, marginBottom: 16,
              animation: "onb-popIn 0.5s ease-out",
            }}>🔄</div>
            <h2 style={{ ...S.sectionTitle, animation: "onb-fadeIn 0.5s ease-out" }}>Recurring Dream Themes</h2>
            <p style={{ ...S.sectionSub, animation: "onb-fadeIn 0.5s ease-out 0.1s both" }}>Select any themes you've experienced in dreams</p>

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              marginBottom: 28, maxHeight: 380, overflowY: "auto",
              padding: "4px 2px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(144,102,212,0.3) transparent",
            }}>
              {DREAM_THEMES.map((t, i) => {
                const selected = themes.includes(t.id);
                return (
                  <button key={t.id} onClick={() => toggleTheme(t.id)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 12, fontSize: 13,
                    fontFamily: "Georgia, serif", cursor: "pointer",
                    background: selected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${selected ? "rgba(144,102,212,0.7)" : "rgba(255,255,255,0.08)"}`,
                    color: selected ? "#d4b0ff" : "#c8a030",
                    boxShadow: selected ? "0 0 12px rgba(144,102,212,0.25)" : "none",
                    transition: "all 0.2s ease",
                    animation: `onb-staggerUp 0.3s ease-out ${0.12 + i * 0.03}s both`,
                    textAlign: "left",
                  }}>
                    <span style={{
                      fontSize: 18, flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: selected ? "scale(1.2)" : "scale(1)",
                    }}>{t.emoji}</span>
                    <span style={{ lineHeight: 1.2 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              style={{ ...S.ctaButton(), animation: "onb-staggerUp 0.4s ease-out 0.9s both" }}
              onClick={preAuth ? handleComplete : goForward}
            >
              {preAuth
                ? (recentDream.trim() ? "Create Account to See Your Reading" : (themes.length === 0 ? "None of these" : `Continue (${themes.length} selected)`))
                : (themes.length === 0 ? "None of these" : `Continue (${themes.length} selected)`)
              }
            </button>
          </div>
        );

      // ── Screen 5: AI Processing + Result (post-auth only) ─────────────────
      case 5:
        if (processing) {
          return (
            <div key={`${animKey}-loading`} style={{ ...S.container, animation: "onb-fadeIn 0.5s ease-out" }}>
              {/* Expanding rings */}
              <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 36px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={`ring-${i}`} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: 80, height: 80, borderRadius: "50%",
                    border: "1.5px solid rgba(144,102,212,0.3)",
                    animation: `onb-ringExpand 2.4s ease-out infinite`,
                    animationDelay: `${i * 0.8}s`,
                  }} />
                ))}
                {/* Rotating glow ring */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%", width: 100, height: 100,
                  borderRadius: "50%",
                  border: "2px solid transparent",
                  borderTopColor: "rgba(232,184,64,0.6)",
                  borderRightColor: "rgba(144,102,212,0.3)",
                  animation: "onb-rotateGlow 2s linear infinite",
                }} />
                {/* Pulsing icon */}
                <div style={{
                  fontSize: 52, position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "onb-pulse 2s ease-in-out infinite",
                  filter: "drop-shadow(0 0 16px rgba(232,184,64,0.5))",
                }}>
                  ✦
                </div>
                {/* Orbiting dots */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={`dot-${i}`} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: i % 2 === 0 ? 5 : 7, height: i % 2 === 0 ? 5 : 7, borderRadius: "50%",
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
                Reflecting on your dream...
              </h2>
              <p style={{ ...S.sectionSub, marginTop: 12, animation: "onb-fadeIn 0.8s ease-out 0.3s both" }}>
                Finding patterns, symbols, and meaning
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

        return (
          <div key={`${animKey}-result`} style={{ ...S.container, animation: "onb-revealUp 0.8s ease-out" }}>
            {/* Sparkle particles */}
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

            {/* Interpretation card */}
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
                {name ? `${name}'s Dream Reading` : "Your Dream Reading"}
              </div>

              <div style={{ animation: "onb-fadeIn 0.5s ease-out 0.4s both", margin: "12px 0" }}>
                {(interpretation || "Your dreams hold deep personal meaning. Begin journaling to uncover the patterns within.")
                  .split(/\n\n+/)
                  .map((para, i) => (
                    <p key={i} style={{
                      fontSize: 15, color: "#d4c490", lineHeight: 1.7,
                      margin: i === 0 ? "0 0 14px" : "0 0 14px",
                      fontStyle: "italic",
                    }}>
                      {para.trim()}
                    </p>
                  ))}
              </div>

              {/* AI-found themes */}
              {aiThemes.length > 0 && (
                <div style={{ animation: "onb-fadeIn 0.5s ease-out 0.5s both" }}>
                  <div style={{ fontSize: 12, color: "#9a8050", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 16 }}>
                    Themes Found
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {aiThemes.map((theme, i) => (
                      <span key={theme} style={{
                        padding: "5px 14px", borderRadius: 20, fontSize: 13,
                        color: "#9066d4", border: "1px solid rgba(144,102,212,0.3)",
                        background: "rgba(144,102,212,0.1)",
                        animation: `onb-traitSlide 0.4s ease-out ${0.6 + i * 0.1}s both`,
                      }}>
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

      default:
        return null;
    }
  };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={S.overlay}>
      {orbs}

      {/* Back button (screens 1-4, not on welcome/processing/result) */}
      {step >= 1 && step <= 4 && !processing && (
        <button style={S.backButton} onClick={goBack}>
          ← Back
        </button>
      )}

      <div style={S.inner}>
        {renderScreen()}
      </div>

      {progressBar}
    </div>
  );
}
