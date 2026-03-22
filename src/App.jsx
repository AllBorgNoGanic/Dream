import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./lib/supabase";

// Components
import DreamForm from "./components/DreamForm";
import DreamCard from "./components/DreamCard";
import SearchBar from "./components/SearchBar";
import StreakBanner from "./components/StreakBanner";
import ExportPDF from "./components/ExportPDF";
import PatternsTab from "./components/PatternsTab";
import CalendarHeatmap from "./components/CalendarHeatmap";
import LucidTools from "./components/LucidTools";
import CommunityTab from "./components/CommunityTab";
import DictionaryTab from "./components/DictionaryTab";
import ArchetypeQuiz from "./components/ArchetypeQuiz";
import ProfileTab from "./components/ProfileTab";

// ─── Constants ─────────────────────────────────────────────────────────────
const FREE_INTERPRETATIONS = 5;

const DREAM_DICTIONARY = {
  flying: { symbol: "✈️", meaning: "Freedom, ambition, or desire to escape responsibilities." },
  falling: { symbol: "⬇️", meaning: "Loss of control, insecurity, or anxiety about failure." },
  water: { symbol: "🌊", meaning: "Emotions, the unconscious mind, and life's flow." },
  fire: { symbol: "🔥", meaning: "Passion, transformation, or destruction." },
  death: { symbol: "💀", meaning: "Endings and new beginnings — rarely literal." },
  teeth: { symbol: "🦷", meaning: "Anxiety about appearance, communication, or loss." },
  chase: { symbol: "🏃", meaning: "Avoidance of a person, situation, or emotion." },
  house: { symbol: "🏠", meaning: "The self or psyche. Different rooms = different aspects of mind." },
  snake: { symbol: "🐍", meaning: "Hidden fears, transformation, or wisdom." },
  ocean: { symbol: "🌊", meaning: "The vast unconscious mind, depth of emotion." },
  forest: { symbol: "🌲", meaning: "The unconscious, mystery, and the unknown." },
  school: { symbol: "🏫", meaning: "Learning, judgment, or feeling unprepared." },
  baby: { symbol: "👶", meaning: "New beginnings, vulnerability, or a project in early stages." },
  car: { symbol: "🚗", meaning: "Control over your life's direction." },
  mirror: { symbol: "🪞", meaning: "Self-reflection, identity, and how you see yourself." },
  clock: { symbol: "⏰", meaning: "Anxiety about time, deadlines, or mortality." },
  bird: { symbol: "🐦", meaning: "Freedom, perspective, and aspirations." },
  door: { symbol: "🚪", meaning: "Opportunities, transitions, and new phases." },
  rain: { symbol: "🌧️", meaning: "Cleansing, renewal, or emotional release." },
  mountain: { symbol: "⛰️", meaning: "Obstacles, achievement, and spiritual growth." },
  moon: { symbol: "🌙", meaning: "Intuition, femininity, and hidden aspects of self." },
  sun: { symbol: "☀️", meaning: "Consciousness, vitality, and truth." },
  bridge: { symbol: "🌉", meaning: "Transitions, connections, and decisions." },
  key: { symbol: "🔑", meaning: "Solutions, secrets, and knowledge." },
};

const detectSymbols = (text) => {
  const lower = text.toLowerCase();
  return Object.keys(DREAM_DICTIONARY).filter((k) => lower.includes(k));
};

const defaultForm = {
  title: "",
  description: "",
  mood: "",
  theme: "",
  tags: [],
  characters: [],
  is_lucid: false,
  lucidity_level: 0,
  sleep_quality: null,
  bed_time: "",
  wake_time: "",
  is_public: false,
};

// ─── Shared Styles ──────────────────────────────────────────────────────────
const sharedBackground = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #020c18 0%, #0a1428 50%, #020c18 100%)",
  fontFamily: "Georgia, serif",
  color: "#f5e4b0",
  position: "relative",
  overflowX: "hidden",
};

const globalStyles = (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 0.9; } }
    @keyframes bethlehem-pulse { 0%,100% { opacity: 0.88; filter: brightness(1) drop-shadow(0 0 6px rgba(160,215,255,0.7)); } 50% { opacity: 1; filter: brightness(1.3) drop-shadow(0 0 18px rgba(160,215,255,1)); } }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(200,160,30,0.3); border-radius: 2px; }
    .nav-tab:hover { background: rgba(200,160,30,0.15) !important; }
    .dream-card:hover { border-color: rgba(200,160,30,0.35) !important; transform: translateY(-1px); transition: all 0.2s; }
    .logout-btn:hover { background: rgba(255,255,255,0.08) !important; color: #e8b840 !important; }
    input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.8); }
    @media (max-width: 600px) {
      .main-nav { gap: 4px !important; }
      .main-nav button { padding: 8px 10px !important; font-size: 11px !important; }
    }
  `}</style>
);

// ─── Main Component ─────────────────────────────────────────────────────────
export default function DreamJournal() {
  // Auth
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Data
  const [userSettings, setUserSettings] = useState(null);
  const [dreams, setDreams] = useState([]);

  // UI
  const [tab, setTab] = useState("journal");
  const [showForm, setShowForm] = useState(false);
  const [selectedDream, setSelectedDream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const onboardingChecked = useRef(false); // flipped to true after first check — quiz never re-evaluated
  const [stars, setStars] = useState([]);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ mood: "", theme: "", lucidOnly: false });

  // Dream form (controlled)
  const [form, setForm] = useState(defaultForm);

  // ── Stars ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setStars(
      Array.from({ length: 220 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.2,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  // ── Session ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Use onAuthStateChange only — avoids the dual-fire problem where
    // getSession() + INITIAL_SESSION both set user, triggering loadUserSettings twice.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        setUser(session?.user ?? null);
        setSessionLoading(false);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        onboardingChecked.current = false; // reset so next login re-checks
      }
      // TOKEN_REFRESHED intentionally ignored — no state change needed
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadDreams();
      // Only load settings once per unique user ID, not on every re-render
      if (!userSettings || userSettings.user_id !== user.id) {
        loadUserSettings();
      }
    } else {
      setDreams([]);
      setUserSettings(null);
      setShowQuiz(false);
    }
  }, [user]); // eslint-disable-line

  // Stripe redirect + PWA quick-record
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("session_id") && user) {
      loadUserSettings();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("action") === "record") {
      setShowForm(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user]); // eslint-disable-line

  // PWA service worker — only register in production to avoid dev caching issues
  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else if ("serviceWorker" in navigator && import.meta.env.DEV) {
      // Unregister any old SW in dev so changes always show immediately
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }
  }, []);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadDreams = async () => {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setDreams(data);
  };

  const loadUserSettings = async () => {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let settings = data;
    if (error && error.code === "PGRST116") {
      // No row yet — create one
      const { data: newSettings } = await supabase
        .from("user_settings")
        .insert({ user_id: user.id, interpretation_count: 0, is_pro: false })
        .select()
        .single();
      settings = newSettings;
    }

    if (settings) setUserSettings(settings);

    // Only evaluate the quiz once per login session
    if (!onboardingChecked.current) {
      onboardingChecked.current = true;
      const done = localStorage.getItem(`onboarding_done_${user.id}`);
      const completed = settings?.onboarding_completed ?? false;
      if (!completed && !done) setShowQuiz(true);
    }
  };

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const { error } =
        authMode === "signup"
          ? await supabase.auth.signUp({ email: authForm.email, password: authForm.password })
          : await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
      if (error) setAuthError(error.message);
      else setAuthForm({ email: "", password: "" });
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

  // ── Archetype quiz ─────────────────────────────────────────────────────────
  const handleQuizComplete = async ({ archetype, archetypeData }) => {
    setShowQuiz(false);
    localStorage.setItem(`onboarding_done_${user.id}`, "1");
    // Upsert so it works whether the settings row exists or not
    const { data } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, archetype, archetype_data: archetypeData, onboarding_completed: true },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (data) setUserSettings(data);
  };

  // ── AI Interpretation ──────────────────────────────────────────────────────
  const interpretDream = async (dream) => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a wise, empathetic dream interpreter drawing from Jungian psychology, symbolism, and spiritual traditions. Give warm, insightful 2-3 sentence interpretations. Be poetic but grounded. Never be alarming.",
          messages: [{
            role: "user",
            content: `Interpret this dream. Title: "${dream.title}". Mood: ${dream.mood}. Theme: ${dream.theme}. ${dream.is_lucid ? "This was a lucid dream." : ""} Dream: "${dream.description}"`,
          }],
        }),
      });
      const data = await response.json();
      return data.content?.map((b) => b.text || "").join("") ||
        "The subconscious speaks in mysterious ways — this dream holds personal meaning unique to your journey.";
    } catch {
      return "The stars are quiet tonight — try again to unlock this dream's meaning.";
    }
  };

  // ── Dream CRUD ─────────────────────────────────────────────────────────────
  const canInterpret =
    userSettings?.is_pro || (userSettings?.interpretation_count ?? 0) < FREE_INTERPRETATIONS;

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      const symbols = detectSymbols(form.description);
      let interpretation = null;

      if (canInterpret) {
        interpretation = await interpretDream({ ...form, symbols });
      } else {
        setShowUpgradeModal(true);
      }

      // Calculate sleep hours from bed/wake times
      let sleep_hours = null;
      if (form.bed_time && form.wake_time) {
        const [bh, bm] = form.bed_time.split(":").map(Number);
        const [wh, wm] = form.wake_time.split(":").map(Number);
        let hours = wh + wm / 60 - (bh + bm / 60);
        if (hours < 0) hours += 24;
        sleep_hours = Math.round(hours * 100) / 100;
      }

      const today = new Date().toISOString().split("T")[0];
      const dreamPayload = {
        user_id: user.id,
        title: form.title,
        description: form.description,
        mood: form.mood || null,
        theme: form.theme || null,
        tags: form.tags || [],
        characters: form.characters || [],
        is_lucid: form.is_lucid || false,
        lucidity_level: form.lucidity_level || 0,
        sleep_quality: form.sleep_quality || null,
        bed_time: form.bed_time ? `${today}T${form.bed_time}:00` : null,
        wake_time: form.wake_time ? `${today}T${form.wake_time}:00` : null,
        sleep_hours,
        is_public: form.is_public || false,
        symbols,
        interpretation,
      };

      const { error } = await supabase.from("dreams").insert(dreamPayload);
      if (error) throw error;

      // Update interpretation count
      if (interpretation && !userSettings?.is_pro) {
        const newCount = (userSettings?.interpretation_count ?? 0) + 1;
        await supabase
          .from("user_settings")
          .update({ interpretation_count: newCount })
          .eq("user_id", user.id);
        setUserSettings((s) => ({ ...s, interpretation_count: newCount }));
      }

      // Update streak
      await supabase.rpc("update_dream_streak", { p_user_id: user.id });

      await loadDreams();
      await loadUserSettings();
      setForm(defaultForm);
      setShowForm(false);
    } catch (err) {
      console.error("Error saving dream:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDream = async (dreamId) => {
    await supabase.from("dreams").delete().eq("id", dreamId);
    setDreams((d) => d.filter((x) => x.id !== dreamId));
    if (selectedDream?.id === dreamId) setSelectedDream(null);
  };

  // ── Upgrade ────────────────────────────────────────────────────────────────
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
      setShowUpgradeModal(true);
    }
  };

  // ── Filtered dreams ────────────────────────────────────────────────────────
  const filteredDreams = useMemo(() => {
    let result = dreams;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q)) ||
          d.characters?.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (filters.mood) result = result.filter((d) => d.mood === filters.mood);
    if (filters.theme) result = result.filter((d) => d.theme === filters.theme);
    if (filters.lucidOnly) result = result.filter((d) => d.is_lucid);
    return result;
  }, [dreams, searchQuery, filters]);

  // ── Stars layer ────────────────────────────────────────────────────────────
  const starsLayer = (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Regular stars */}
      {stars.map((s) => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "rgba(255,245,200,1)", opacity: s.opacity,
          animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}

      {/* Star of Bethlehem — upper left, pale blue 4-pointed */}
      <div style={{
        position: "absolute", left: "6%", top: "4%",
        width: 60, height: 60,
        animation: "bethlehem-pulse 3s ease-in-out infinite",
      }}>
        {/* Outer glow halo */}
        <div style={{
          position: "absolute", inset: -32,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,215,255,0.22) 0%, rgba(120,190,255,0.08) 55%, transparent 75%)",
        }} />
        {/* Vertical ray — dramatically elongated to match reference image */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 8, height: 320,
          background: "radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(200,235,255,0.9) 12%, rgba(160,215,255,0.5) 40%, rgba(120,190,255,0.15) 65%, transparent 82%)",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
        }} />
        {/* Horizontal ray — shorter than vertical, as in reference */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 90, height: 6,
          background: "radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(200,235,255,0.85) 15%, rgba(160,215,255,0.4) 50%, transparent 80%)",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
        }} />
        {/* Diagonal ray NE–SW — subtle */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 3, height: 60,
          background: "radial-gradient(ellipse at center, rgba(220,240,255,0.6) 0%, rgba(160,215,255,0.25) 45%, transparent 75%)",
          transform: "translate(-50%, -50%) rotate(45deg)",
          borderRadius: "50%",
        }} />
        {/* Diagonal ray NW–SE — subtle */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 3, height: 60,
          background: "radial-gradient(ellipse at center, rgba(220,240,255,0.6) 0%, rgba(160,215,255,0.25) 45%, transparent 75%)",
          transform: "translate(-50%, -50%) rotate(-45deg)",
          borderRadius: "50%",
        }} />
        {/* Center bright core */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 14, height: 14, borderRadius: "50%",
          background: "radial-gradient(circle, #ffffff 0%, #ddf0ff 40%, rgba(140,210,255,0) 100%)",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 16px 7px rgba(160,215,255,0.95), 0 0 36px 14px rgba(100,180,255,0.4)",
        }} />
      </div>
    </div>
  );

  // ── Session loading spinner ────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div style={{ ...sharedBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {globalStyles}
        <div style={{ textAlign: "center", color: "#8a7010" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🐑</div>
          <div style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase" }}>The shepherd watches over your dreams...</div>
        </div>
      </div>
    );
  }

  // ── Auth screen ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ ...sharedBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {starsLayer}
        {globalStyles}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400, padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🐑</div>
            <h1 style={{ fontSize: 36, fontWeight: 400, margin: "0 0 8px", background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dream Shepherd
            </h1>
            <p style={{ fontSize: 14, color: "#8a7540", margin: 0 }}>Tend to your dreams like a shepherd</p>
          </div>
          <div style={{ background: "rgba(6,12,22,0.85)", border: "1px solid rgba(200,160,30,0.2)", borderRadius: 20, padding: 32, backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 15, color: "#e8b840", textAlign: "center", marginBottom: 24 }}>
              {authMode === "login" ? "Welcome back" : "Begin your journey"}
            </div>
            <input
              type="email" placeholder="Email address" value={authForm.email}
              onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,160,30,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f5e4b0", fontSize: 14, marginBottom: 12, outline: "none" }}
            />
            <input
              type="password" placeholder="Password" value={authForm.password}
              onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,160,30,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f5e4b0", fontSize: 14, marginBottom: 16, outline: "none" }}
            />
            {authError && (
              <div style={{ fontSize: 12, color: "#ff9999", marginBottom: 12, textAlign: "center" }}>{authError}</div>
            )}
            <button onClick={handleAuth} disabled={authLoading} style={{
              width: "100%", background: authLoading ? "rgba(140,90,5,0.4)" : "linear-gradient(135deg, #7a5200, #c89020)",
              border: "none", color: "white", padding: "13px", borderRadius: 12,
              fontSize: 14, cursor: authLoading ? "not-allowed" : "pointer", letterSpacing: 0.5,
            }}>
              {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <span style={{ fontSize: 13, color: "#8a7540" }}>
                {authMode === "login" ? "No account? " : "Already have an account? "}
              </span>
              <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }} style={{
                background: "none", border: "none", color: "#e8b840", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0,
              }}>
                {authMode === "login" ? "Sign up free" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Archetype Quiz onboarding ──────────────────────────────────────────────
  if (showQuiz) {
    return (
      <div style={sharedBackground}>
        {starsLayer}
        {globalStyles}
        <ArchetypeQuiz onComplete={handleQuizComplete} />
      </div>
    );
  }

  // ── Nav config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: "journal",    label: "🐑 Journal" },
    { id: "patterns",   label: "✦ Patterns" },
    { id: "lucid",      label: "⚡ Lucid" },
    { id: "community",  label: "👥 Community" },
    { id: "dictionary", label: "📖 Dict" },
    { id: "profile",    label: "◉ Profile" },
  ];

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <div style={sharedBackground}>
      {starsLayer}
      {globalStyles}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "40px 0 28px", position: "relative" }}>
          <div style={{ fontSize: 12, letterSpacing: 6, color: "#c8a030", textTransform: "uppercase", marginBottom: 10 }}>
            Shepherd of Dreams
          </div>
          <h1 style={{
            fontSize: 38, fontWeight: 400, margin: 0,
            background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1, display: "inline"
          }}>
            Dream Shepherd
          </h1>
          {userSettings?.is_pro && (
            <span style={{
              display: "inline-block", marginLeft: 12, verticalAlign: "middle",
              background: "linear-gradient(135deg, #c8a020, #e8c840)",
              color: "#1a1000", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 1,
            }}>
              ✦ Pro
            </span>
          )}
          {userSettings?.archetype && (
            <div style={{ fontSize: 12, color: "#8a7540", marginTop: 6 }}>
              {userSettings.archetype} Dreamer
            </div>
          )}
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, #c8a030, transparent)", margin: "14px auto 0" }} />
          <button className="logout-btn" onClick={handleLogout} style={{
            position: "absolute", top: 40, right: 0,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#7a6a40", padding: "7px 16px", borderRadius: 40, fontSize: 12, cursor: "pointer",
          }}>
            Sign Out
          </button>
        </div>

        {/* Nav */}
        <div className="main-nav" style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} className="nav-tab" onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "rgba(200,160,30,0.25)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === t.id ? "rgba(200,160,30,0.6)" : "rgba(255,255,255,0.08)"}`,
              color: tab === t.id ? "#f0c840" : "#7a6a40",
              padding: "9px 18px", borderRadius: 40, fontSize: 12, cursor: "pointer",
              letterSpacing: 0.3, transition: "all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── JOURNAL TAB ── */}
        {tab === "journal" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <StreakBanner
              streak={userSettings?.streak_current || 0}
              longestStreak={userSettings?.streak_longest || 0}
              lastDreamDate={userSettings?.last_dream_date}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#8a7540" }}>
                {dreams.length} dream{dreams.length !== 1 ? "s" : ""} recorded
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <ExportPDF dreams={dreams} />
                <button
                  onClick={() => { setShowForm(!showForm); if (!showForm) setForm(defaultForm); }}
                  style={{
                    background: showForm ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #7a5200, #c89020)",
                    border: showForm ? "1px solid rgba(255,255,255,0.12)" : "none",
                    color: showForm ? "#7a6a40" : "white",
                    padding: "10px 22px", borderRadius: 40, fontSize: 13, cursor: "pointer",
                    boxShadow: showForm ? "none" : "0 4px 20px rgba(160,100,5,0.4)", letterSpacing: 0.4,
                  }}
                >
                  {showForm ? "✕ Cancel" : "+ Record Dream"}
                </button>
              </div>
            </div>

            {showForm && (
              <div style={{ marginBottom: 24, animation: "fadeIn 0.3s ease" }}>
                <DreamForm
                  form={form}
                  setForm={setForm}
                  onSubmit={handleSubmit}
                  loading={loading}
                  canInterpret={canInterpret}
                  isPro={userSettings?.is_pro}
                  freeRemaining={Math.max(0, FREE_INTERPRETATIONS - (userSettings?.interpretation_count ?? 0))}
                />
              </div>
            )}

            {dreams.length > 0 && (
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
              />
            )}

            {dreams.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6b5c30" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🐑</div>
                <div style={{ fontSize: 16, color: "#7a6a40", marginBottom: 8 }}>Your dream journal awaits</div>
                <div style={{ fontSize: 13 }}>Tap "+ Record Dream" to begin capturing your subconscious</div>
              </div>
            )}

            {dreams.length > 0 && filteredDreams.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#6b5c30", fontSize: 13 }}>
                No dreams match your search
              </div>
            )}

            {filteredDreams.map((dream) => (
              <DreamCard
                key={dream.id}
                dream={dream}
                isSelected={selectedDream?.id === dream.id}
                onSelect={(d) => setSelectedDream(selectedDream?.id === d.id ? null : d)}
                onDelete={handleDeleteDream}
              />
            ))}
          </div>
        )}

        {/* ── PATTERNS TAB ── */}
        {tab === "patterns" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <PatternsTab dreams={dreams} userSettings={userSettings} />
            <div style={{ marginTop: 16 }}>
              <CalendarHeatmap dreams={dreams} />
            </div>
          </div>
        )}

        {/* ── LUCID TAB ── */}
        {tab === "lucid" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <LucidTools dreams={dreams} />
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {tab === "community" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <CommunityTab user={user} supabase={supabase} />
          </div>
        )}

        {/* ── DICTIONARY TAB ── */}
        {tab === "dictionary" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <DictionaryTab />
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ProfileTab
              user={user}
              userSettings={userSettings}
              onSettingsUpdate={setUserSettings}
              dreams={dreams}
              onUpgrade={handleUpgrade}
              onRetakeQuiz={() => setShowQuiz(true)}
            />
          </div>
        )}
      </div>

      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <div
          onClick={() => setShowUpgradeModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(16,4,40,0.97)", border: "1px solid rgba(200,160,50,0.4)",
              borderRadius: 24, padding: 36, maxWidth: 400, width: "90%",
              boxShadow: "0 16px 60px rgba(110,70,5,0.5)", animation: "fadeIn 0.3s ease", textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔮</div>
            <div style={{ fontSize: 20, color: "#f5e4b0", marginBottom: 8 }}>Unlock Unlimited Interpretations</div>
            <div style={{ fontSize: 14, color: "#7a6a40", marginBottom: 24, lineHeight: 1.6 }}>
              You've used all {FREE_INTERPRETATIONS} free AI interpretations.<br />
              Upgrade to Pro for unlimited dream analysis + all premium features.
            </div>
            <div style={{
              background: "rgba(200,160,50,0.1)", border: "1px solid rgba(200,160,50,0.3)",
              borderRadius: 16, padding: "16px 20px", marginBottom: 24,
            }}>
              <div style={{ fontSize: 28, color: "#e8c840", fontWeight: 400 }}>
                $5.99<span style={{ fontSize: 14, color: "#a09060" }}>/month</span>
              </div>
              <div style={{ fontSize: 12, color: "#a09060", marginTop: 4 }}>Unlimited Interpretations · All Features</div>
            </div>
            <button onClick={handleUpgrade} style={{
              width: "100%", background: "linear-gradient(135deg, #c8a020, #e8c840)",
              border: "none", color: "#1a1000", padding: "14px", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5, marginBottom: 12,
            }}>
              Upgrade Now
            </button>
            <button onClick={() => setShowUpgradeModal(false)} style={{
              background: "none", border: "none", color: "#6b5c30", fontSize: 13, cursor: "pointer", padding: "8px",
            }}>
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
