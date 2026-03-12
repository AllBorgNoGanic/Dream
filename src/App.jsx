import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

const FREE_INTERPRETATIONS = 5;

const DREAM_DICTIONARY = {
  flying: { symbol: "✈️", meaning: "Freedom, ambition, or desire to escape responsibilities. Often signals a need for perspective or liberation from constraints." },
  falling: { symbol: "⬇️", meaning: "Loss of control, insecurity, or anxiety about failure. Common during times of stress or major life transitions." },
  water: { symbol: "🌊", meaning: "Emotions, the unconscious mind, and life's flow. Calm water signals peace; turbulent water signals emotional turmoil." },
  fire: { symbol: "🔥", meaning: "Passion, transformation, or destruction. Can represent desire, anger, or a powerful change in your life." },
  death: { symbol: "💀", meaning: "Endings and new beginnings — rarely literal. Often signals a major transformation, leaving behind an old self or situation." },
  teeth: { symbol: "🦷", meaning: "Anxiety about appearance, communication, or loss. One of the most common recurring dream symbols." },
  chase: { symbol: "🏃", meaning: "Avoidance of a person, situation, or emotion in waking life. The pursuer often represents something you're running from." },
  house: { symbol: "🏠", meaning: "The self or psyche. Different rooms represent different aspects of your mind, past, or current emotional state." },
  snake: { symbol: "🐍", meaning: "Hidden fears, transformation, or wisdom. Can represent a threat or a powerful force of change in your life." },
  ocean: { symbol: "🌊", meaning: "The vast unconscious mind, depth of emotion, and the unknown. Swimming signals confidence; drowning signals overwhelm." },
  forest: { symbol: "🌲", meaning: "The unconscious, mystery, and the unknown. Can represent feeling lost or a desire to reconnect with nature/instincts." },
  school: { symbol: "🏫", meaning: "Learning, judgment, or feeling unprepared. Often appears when facing a test or challenge in waking life." },
  baby: { symbol: "👶", meaning: "New beginnings, vulnerability, or an idea/project in its early stages. Can reflect nurturing instincts." },
  car: { symbol: "🚗", meaning: "Control over your life's direction. Who's driving matters — being a passenger signals feeling out of control." },
  mirror: { symbol: "🪞", meaning: "Self-reflection, identity, and how you see yourself. A broken mirror can signal a fractured self-image." },
  clock: { symbol: "⏰", meaning: "Anxiety about time, deadlines, or mortality. Running out of time suggests pressure in waking life." },
};

const MOODS = ["✨ Magical", "😨 Frightening", "😌 Peaceful", "😕 Confusing", "😢 Sad", "🤩 Exciting", "😶 Neutral", "💭 Nostalgic"];
const THEMES = ["Adventure", "Romance", "Mystery", "Fantasy", "Nightmare", "Spiritual", "Mundane", "Surreal"];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getMoodEmoji = (mood) => mood?.split(" ")[0] || "💭";

export default function DreamJournal() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [userSettings, setUserSettings] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [tab, setTab] = useState("journal");
  const [dreams, setDreams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDream, setSelectedDream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dictSearch, setDictSearch] = useState("");
  const [form, setForm] = useState({ title: "", description: "", mood: "", theme: "" });
  const [stars, setStars] = useState([]);

  // Initialize stars
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

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load dreams and settings when user logs in
  useEffect(() => {
    if (user) {
      loadDreams();
      loadUserSettings();
    } else {
      setDreams([]);
      setUserSettings(null);
    }
  }, [user]);

  // Check for Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("session_id") && user) {
      loadUserSettings();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user]);

  const loadDreams = async () => {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDreams(data);
    }
  };

  const loadUserSettings = async () => {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // No row found — create default settings
      const { data: newSettings } = await supabase
        .from("user_settings")
        .insert({ user_id: user.id, interpretation_count: 0, is_pro: false })
        .select()
        .single();
      setUserSettings(newSettings);
    } else if (data) {
      setUserSettings(data);
    }
  };

  const handleAuth = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const { error } = authMode === "signup"
        ? await supabase.auth.signUp({ email: authForm.email, password: authForm.password })
        : await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthForm({ email: "", password: "" });
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDreams([]);
    setUserSettings(null);
    setTab("journal");
  };

  const detectSymbols = (text) => {
    const lower = text.toLowerCase();
    return Object.keys(DREAM_DICTIONARY).filter(k => lower.includes(k));
  };

  const interpretDream = async (dream) => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a wise, empathetic dream interpreter drawing from Jungian psychology, symbolism, and spiritual traditions. Give warm, insightful, 2-3 sentence interpretations. Be poetic but grounded. Never be alarming.",
          messages: [{ role: "user", content: `Interpret this dream. Title: "${dream.title}". Mood: ${dream.mood}. Theme: ${dream.theme}. Dream: "${dream.description}"` }]
        })
      });
      const data = await response.json();
      const interpretation = data.content?.map(b => b.text || "").join("") || "The subconscious speaks in mysterious ways — this dream holds personal meaning unique to your journey.";
      return interpretation;
    } catch {
      return "The stars are quiet tonight — try again to unlock this dream's meaning.";
    } finally {
      setLoading(false);
    }
  };

  const canInterpret = userSettings?.is_pro || (userSettings?.interpretation_count ?? 0) < FREE_INTERPRETATIONS;

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      // Stripe not configured yet
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    const symbols = detectSymbols(form.description);
    const newDream = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      mood: form.mood,
      theme: form.theme,
      symbols,
      interpretation: null
    };

    if (canInterpret) {
      const interp = await interpretDream(newDream);
      newDream.interpretation = interp;

      // Increment interpretation count
      const newCount = (userSettings?.interpretation_count ?? 0) + 1;
      await supabase
        .from("user_settings")
        .update({ interpretation_count: newCount })
        .eq("user_id", user.id);
      setUserSettings(prev => prev ? { ...prev, interpretation_count: newCount } : prev);
    } else {
      setShowUpgradeModal(true);
    }

    const { data, error } = await supabase
      .from("dreams")
      .insert(newDream)
      .select()
      .single();

    if (!error && data) {
      setDreams(prev => [data, ...prev]);
    }

    setForm({ title: "", description: "", mood: "", theme: "" });
    setShowForm(false);
    setTab("journal");
  };

  const filteredDict = Object.entries(DREAM_DICTIONARY).filter(([key]) =>
    key.includes(dictSearch.toLowerCase())
  );

  // Pattern stats
  const moodCounts = dreams.reduce((acc, d) => { acc[d.mood] = (acc[d.mood] || 0) + 1; return acc; }, {});
  const themeCounts = dreams.reduce((acc, d) => { acc[d.theme] = (acc[d.theme] || 0) + 1; return acc; }, {});
  const topMood = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0];
  const topTheme = Object.entries(themeCounts).sort((a,b) => b[1]-a[1])[0];
  const allSymbols = dreams.flatMap(d => d.symbols || []);
  const symbolCounts = allSymbols.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const topSymbols = Object.entries(symbolCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);

  const sharedBackground = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #04001a 0%, #0a0028 40%, #120038 70%, #04001a 100%)",
    fontFamily: "'Georgia', serif",
    color: "#e8d5ff",
    position: "relative",
    overflow: "hidden"
  };

  const starsLayer = (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: "white",
          opacity: s.opacity,
          animation: `twinkle ${2 + s.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  );

  const globalStyles = (
    <style>{`
      @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.9; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes shimmer { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      .dream-card:hover { transform: translateY(-3px); box-shadow: 0 8px 40px rgba(160,100,255,0.25) !important; }
      .dream-card { transition: all 0.3s ease; }
      .nav-tab { transition: all 0.2s; cursor: pointer; }
      .nav-tab:hover { color: #d4aaff; }
      .dict-card:hover { background: rgba(160,100,255,0.15) !important; }
      .dict-card { transition: background 0.2s; }
      .logout-btn:hover { background: rgba(255,100,100,0.25) !important; border-color: rgba(255,100,100,0.5) !important; color: #ff9999 !important; }
      .upgrade-btn:hover { transform: scale(1.02); box-shadow: 0 6px 30px rgba(200,160,50,0.4) !important; }
      .modal-overlay { position: fixed; inset: 0; background: rgba(4,0,26,0.85); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
      ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(160,100,255,0.3); border-radius: 3px; }
    `}</style>
  );

  // Loading session check
  if (sessionLoading) {
    return (
      <div style={sharedBackground}>
        {starsLayer}
        {globalStyles}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ fontSize: 16, color: "#8070aa", animation: "shimmer 2s ease-in-out infinite" }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return (
      <div style={sharedBackground}>
        {starsLayer}
        {globalStyles}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 420, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", padding: "80px 0 40px" }}>
            <div style={{ fontSize: 14, letterSpacing: 6, color: "#a070cc", textTransform: "uppercase", marginBottom: 12 }}>Your Subconscious</div>
            <h1 style={{ fontSize: 42, fontWeight: 400, margin: 0, background: "linear-gradient(135deg, #e8d5ff, #c490ff, #8040cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1 }}>
              Dreamscape
            </h1>
            <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, #a070cc, transparent)", margin: "16px auto 0" }} />
          </div>

          <div style={{
            background: "rgba(30,10,60,0.8)", border: "1px solid rgba(160,100,255,0.3)",
            borderRadius: 20, padding: 32,
            boxShadow: "0 8px 40px rgba(80,20,160,0.3)", animation: "fadeIn 0.4s ease"
          }}>
            <div style={{ fontSize: 18, marginBottom: 24, color: "#c490ff", textAlign: "center" }}>
              {authMode === "login" ? "Welcome Back" : "Begin Your Journey"}
            </div>

            <input
              type="email"
              placeholder="Email address"
              value={authForm.email}
              onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 10, padding: "12px 16px", color: "#e8d5ff", fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 10, padding: "12px 16px", color: "#e8d5ff", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }}
            />

            {authError && (
              <div style={{ fontSize: 13, color: "#ff7799", marginBottom: 16, textAlign: "center" }}>
                {authError}
              </div>
            )}

            <button onClick={handleAuth} disabled={authLoading || !authForm.email || !authForm.password} style={{
              width: "100%", background: authLoading ? "rgba(100,50,180,0.4)" : "linear-gradient(135deg, #6020cc, #9040ee)",
              border: "none", color: "white", padding: "13px", borderRadius: 12,
              fontSize: 14, cursor: authLoading ? "not-allowed" : "pointer", letterSpacing: 0.5
            }}>
              {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <span style={{ fontSize: 13, color: "#7060aa" }}>
                {authMode === "login" ? "No account? " : "Already have an account? "}
              </span>
              <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }} style={{
                background: "none", border: "none", color: "#c490ff", fontSize: 13,
                cursor: "pointer", textDecoration: "underline", padding: 0
              }}>
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app (authenticated)
  return (
    <div style={sharedBackground}>
      {starsLayer}
      {globalStyles}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "0 20px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "48px 0 32px", position: "relative" }}>
          <div style={{ fontSize: 14, letterSpacing: 6, color: "#a070cc", textTransform: "uppercase", marginBottom: 12 }}>Your Subconscious</div>
          <h1 style={{ fontSize: 42, fontWeight: 400, margin: 0, background: "linear-gradient(135deg, #e8d5ff, #c490ff, #8040cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1, display: "inline" }}>
            Dreamscape
          </h1>
          {userSettings?.is_pro && (
            <span style={{
              display: "inline-block", marginLeft: 12, verticalAlign: "middle",
              background: "linear-gradient(135deg, #c8a020, #e8c840)",
              color: "#1a1000", padding: "3px 10px", borderRadius: 20,
              fontSize: 11, fontWeight: 600, letterSpacing: 1, fontFamily: "sans-serif"
            }}>
              ✦ Pro
            </span>
          )}
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, #a070cc, transparent)", margin: "16px auto 0" }} />

          {/* Logout button */}
          <button className="logout-btn" onClick={handleLogout} style={{
            position: "absolute", top: 48, right: 0,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#8070aa", padding: "7px 16px", borderRadius: 40, fontSize: 12,
            cursor: "pointer", letterSpacing: 0.5, transition: "all 0.2s"
          }}>
            Sign Out
          </button>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 36 }}>
          {[
            { id: "journal", label: "🌙 Journal" },
            { id: "patterns", label: "✦ Patterns" },
            { id: "dictionary", label: "📖 Dictionary" },
          ].map(t => (
            <button key={t.id} className="nav-tab" onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "rgba(160,100,255,0.25)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === t.id ? "rgba(160,100,255,0.6)" : "rgba(255,255,255,0.1)"}`,
              color: tab === t.id ? "#d4aaff" : "#8070aa",
              padding: "10px 22px", borderRadius: 40, fontSize: 13, cursor: "pointer", letterSpacing: 0.5
            }}>{t.label}</button>
          ))}
        </div>

        {/* JOURNAL TAB */}
        {tab === "journal" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#7060aa" }}>{dreams.length} dream{dreams.length !== 1 ? "s" : ""} recorded</div>
              <button onClick={() => setShowForm(!showForm)} style={{
                background: "linear-gradient(135deg, #6020cc, #9040ee)",
                border: "none", color: "white", padding: "10px 22px",
                borderRadius: 40, fontSize: 13, cursor: "pointer", letterSpacing: 0.5,
                boxShadow: "0 4px 20px rgba(120,40,220,0.4)"
              }}>
                {showForm ? "✕ Cancel" : "+ Record Dream"}
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div style={{
                background: "rgba(30,10,60,0.8)", border: "1px solid rgba(160,100,255,0.3)",
                borderRadius: 20, padding: 28, marginBottom: 28,
                boxShadow: "0 8px 40px rgba(80,20,160,0.3)", animation: "fadeIn 0.3s ease"
              }}>
                <div style={{ fontSize: 16, marginBottom: 20, color: "#c490ff" }}>🌙 Record Tonight's Dream</div>
                <input
                  placeholder="Give your dream a title..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 10, padding: "12px 16px", color: "#e8d5ff", fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
                />
                <textarea
                  placeholder="Describe your dream in as much detail as you remember..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 10, padding: "12px 16px", color: "#e8d5ff", fontSize: 14, marginBottom: 12, boxSizing: "border-box", resize: "vertical", outline: "none", fontFamily: "Georgia, serif" }}
                />
                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                  <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
                    style={{ flex: 1, minWidth: 160, background: "rgba(20,5,50,0.9)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 10, padding: "11px 14px", color: form.mood ? "#e8d5ff" : "#7060aa", fontSize: 13, outline: "none" }}>
                    <option value="">Mood...</option>
                    {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                    style={{ flex: 1, minWidth: 160, background: "rgba(20,5,50,0.9)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 10, padding: "11px 14px", color: form.theme ? "#e8d5ff" : "#7060aa", fontSize: 13, outline: "none" }}>
                    <option value="">Theme...</option>
                    {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={handleSubmit} disabled={loading || !form.title || !form.description} style={{
                  width: "100%", background: loading ? "rgba(100,50,180,0.4)" : "linear-gradient(135deg, #6020cc, #9040ee)",
                  border: "none", color: "white", padding: "13px", borderRadius: 12,
                  fontSize: 14, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5
                }}>
                  {loading ? "✦ Interpreting your dream..." : canInterpret ? "✦ Interpret & Save Dream" : "Save Dream (interpretation limit reached)"}
                </button>
                {!userSettings?.is_pro && userSettings && (
                  <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#6050a0" }}>
                    {Math.max(0, FREE_INTERPRETATIONS - (userSettings.interpretation_count ?? 0))} free interpretation{Math.max(0, FREE_INTERPRETATIONS - (userSettings.interpretation_count ?? 0)) !== 1 ? "s" : ""} remaining
                  </div>
                )}
              </div>
            )}

            {/* Dream Cards */}
            {dreams.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6050a0", fontSize: 14 }}>
                No dreams recorded yet. Tap "+ Record Dream" to begin.
              </div>
            )}
            {dreams.map(dream => (
              <div key={dream.id} className="dream-card" onClick={() => setSelectedDream(selectedDream?.id === dream.id ? null : dream)}
                style={{
                  background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.15)",
                  borderRadius: 18, padding: 24, marginBottom: 16, cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(40,10,80,0.4)"
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 400, color: "#ddc8ff", marginBottom: 4 }}>{dream.title}</div>
                    <div style={{ fontSize: 12, color: "#6050a0" }}>{formatDate(dream.created_at)} · {dream.mood} · {dream.theme}</div>
                  </div>
                  <div style={{ fontSize: 20 }}>{getMoodEmoji(dream.mood)}</div>
                </div>
                <p style={{ fontSize: 13, color: "#9080bb", lineHeight: 1.6, margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: selectedDream?.id === dream.id ? "none" : 2, WebkitBoxOrient: "vertical", overflow: selectedDream?.id === dream.id ? "visible" : "hidden" }}>
                  {dream.description}
                </p>
                {selectedDream?.id === dream.id && dream.interpretation && (
                  <div style={{ background: "rgba(100,40,180,0.15)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 12, padding: 16, marginTop: 12, animation: "fadeIn 0.3s ease" }}>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: "#a070cc", textTransform: "uppercase", marginBottom: 8 }}>AI Interpretation</div>
                    <p style={{ fontSize: 14, color: "#c8a8f0", lineHeight: 1.7, margin: 0 }}>{dream.interpretation}</p>
                    {dream.symbols?.length > 0 && (
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {dream.symbols.map(s => (
                          <span key={s} style={{ background: "rgba(120,50,200,0.2)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#b090e0" }}>
                            {DREAM_DICTIONARY[s]?.symbol} {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PATTERNS TAB */}
        {tab === "patterns" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Dreams Recorded", value: dreams.length, icon: "🌙" },
                { label: "Top Mood", value: topMood?.[0]?.split(" ").slice(1).join(" ") || "—", icon: topMood?.[0]?.split(" ")[0] || "✦" },
                { label: "Favorite Theme", value: topTheme?.[0] || "—", icon: "🎭" },
                { label: "Symbols Found", value: allSymbols.length, icon: "🔮" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.15)", borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 24, color: "#c490ff", fontWeight: 400 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#6050a0", marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Mood breakdown */}
            <div style={{ background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.15)", borderRadius: 18, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, letterSpacing: 3, color: "#8060cc", textTransform: "uppercase", marginBottom: 20 }}>Mood Distribution</div>
              {Object.entries(moodCounts).map(([mood, count]) => (
                <div key={mood} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#b090d0", marginBottom: 6 }}>
                    <span>{mood}</span><span>{count}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / dreams.length) * 100}%`, background: "linear-gradient(90deg, #6020cc, #c060ff)", borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Top symbols */}
            {topSymbols.length > 0 && (
              <div style={{ background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.15)", borderRadius: 18, padding: 24 }}>
                <div style={{ fontSize: 13, letterSpacing: 3, color: "#8060cc", textTransform: "uppercase", marginBottom: 20 }}>Recurring Symbols</div>
                {topSymbols.map(([symbol, count]) => (
                  <div key={symbol} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 24, width: 36, textAlign: "center" }}>{DREAM_DICTIONARY[symbol]?.symbol}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "#c8a8f0", textTransform: "capitalize" }}>{symbol}</div>
                      <div style={{ fontSize: 12, color: "#6050a0", marginTop: 2 }}>Appeared {count} time{count > 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ fontSize: 20, color: "#8040cc", fontWeight: 300 }}>{count}×</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DICTIONARY TAB */}
        {tab === "dictionary" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <input
              placeholder="🔍  Search symbols..."
              value={dictSearch}
              onChange={e => setDictSearch(e.target.value)}
              style={{ width: "100%", background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.2)", borderRadius: 40, padding: "13px 22px", color: "#e8d5ff", fontSize: 14, marginBottom: 24, boxSizing: "border-box", outline: "none" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {filteredDict.map(([key, val]) => (
                <div key={key} className="dict-card" style={{ background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.12)", borderRadius: 16, padding: "18px 20px", cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{val.symbol}</span>
                    <span style={{ fontSize: 15, color: "#c490ff", textTransform: "capitalize" }}>{key}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#8070aa", lineHeight: 1.6, margin: 0 }}>{val.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "rgba(20,8,50,0.95)", border: "1px solid rgba(200,160,50,0.4)",
            borderRadius: 24, padding: 36, maxWidth: 400, width: "90%",
            boxShadow: "0 16px 60px rgba(80,20,160,0.5)", animation: "fadeIn 0.3s ease",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔮</div>
            <div style={{ fontSize: 20, color: "#e8d5ff", marginBottom: 8 }}>Unlock Unlimited Interpretations</div>
            <div style={{ fontSize: 14, color: "#8070aa", marginBottom: 24, lineHeight: 1.6 }}>
              You've used all {FREE_INTERPRETATIONS} free AI interpretations. Upgrade to Pro for unlimited dream analysis.
            </div>
            <div style={{
              background: "rgba(200,160,50,0.1)", border: "1px solid rgba(200,160,50,0.3)",
              borderRadius: 16, padding: "16px 20px", marginBottom: 24
            }}>
              <div style={{ fontSize: 28, color: "#e8c840", fontWeight: 400 }}>$5.99<span style={{ fontSize: 14, color: "#a09060" }}>/month</span></div>
              <div style={{ fontSize: 12, color: "#a09060", marginTop: 4 }}>Unlimited Dream Interpretations</div>
            </div>
            <button className="upgrade-btn" onClick={handleUpgrade} style={{
              width: "100%", background: "linear-gradient(135deg, #c8a020, #e8c840)",
              border: "none", color: "#1a1000", padding: "14px", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5,
              transition: "all 0.2s", marginBottom: 12
            }}>
              Upgrade Now
            </button>
            <button onClick={() => setShowUpgradeModal(false)} style={{
              background: "none", border: "none", color: "#6050a0", fontSize: 13,
              cursor: "pointer", padding: "8px"
            }}>
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
