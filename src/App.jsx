import { useState, useEffect, useRef, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "./lib/supabase";
import StarField from "./components/StarField";

// Components
import DreamForm from "./components/DreamForm";
import DreamCard from "./components/DreamCard";
import SearchBar from "./components/SearchBar";
import StreakBanner from "./components/StreakBanner";
import MorningCard from "./components/MorningCard";
import PatternsTab from "./components/PatternsTab";
import CommunityTab from "./components/CommunityTab";
import DictionaryTab from "./components/DictionaryTab";
import OnboardingQuiz from "./components/OnboardingQuiz";
import ProfileTab from "./components/ProfileTab";
import GalleryTab from "./components/GalleryTab";
import ShareButton from "./components/ShareButton";
import ReadingModal from "./components/ReadingModal";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import { SkeletonCard } from "./components/Skeleton";
import { useToast } from "./components/Toast";
import FirstTimeJourney from "./components/FirstTimeJourney";
import InterpretationOverlay from "./components/InterpretationOverlay";
import useOffline from "./hooks/useOffline";
import Landing from "./Landing";
import { checkContent } from "./utils/moderation";

// ─── Constants ─────────────────────────────────────────────────────────────
const FREE_INTERPRETATIONS = 5;
const MAX_SHARE_BONUS = 3;

const DREAM_DICTIONARY = {
  flying: { symbol: "✈️", meaning: "Freedom, ambition, or a desire to rise above what feels heavy." },
  falling: { symbol: "⬇️", meaning: "Loss of control, insecurity, or anxiety about failure." },
  water: { symbol: "🌊", meaning: "Emotions, renewal, and cleansing. Water often marks moments of transformation in Scripture, from the Red Sea to baptism." },
  fire: { symbol: "🔥", meaning: "Purification and divine presence. Recalls the burning bush, the pillar of fire, and tongues of flame at Pentecost." },
  death: { symbol: "💀", meaning: "Endings and new beginnings. Rarely literal." },
  teeth: { symbol: "🦷", meaning: "Anxiety about appearance, communication, or loss." },
  chase: { symbol: "🏃", meaning: "Avoidance of a person, situation, or emotion." },
  house: { symbol: "🏠", meaning: "The self or psyche. Different rooms reflect different aspects of mind." },
  snake: { symbol: "🐍", meaning: "Hidden fears, deception, or transformation. The serpent carries weight from Genesis through Revelation." },
  ocean: { symbol: "🌊", meaning: "The vast unconscious mind, depth of emotion, and what lies beyond the known shore." },
  forest: { symbol: "🌲", meaning: "The unconscious, mystery, and the unknown. A place of wandering and formation, as in the wilderness." },
  school: { symbol: "🏫", meaning: "Learning, judgment, or feeling unprepared." },
  baby: { symbol: "👶", meaning: "New beginnings, vulnerability, or something in its earliest stage." },
  car: { symbol: "🚗", meaning: "Control over your life's direction." },
  mirror: { symbol: "🪞", meaning: "Self-reflection, identity, and how you see yourself." },
  clock: { symbol: "⏰", meaning: "Anxiety about time, deadlines, or mortality." },
  bird: { symbol: "🐦", meaning: "Freedom, perspective, and aspirations." },
  door: { symbol: "🚪", meaning: "Opportunities, transitions, and new phases. 'Behold, I have set before you an open door' (Revelation 3:8)." },
  rain: { symbol: "🌧️", meaning: "Cleansing, renewal, or emotional release." },
  mountain: { symbol: "⛰️", meaning: "Encounter with God, vantage point, transcendence. Sinai, Carmel, and the Mount of Olives were each places of meeting." },
  moon: { symbol: "🌙", meaning: "Intuition, the hidden, and the rhythms of the inner life." },
  sun: { symbol: "☀️", meaning: "Consciousness, vitality, and truth made visible." },
  bridge: { symbol: "🌉", meaning: "Transitions, connections, and decisions to cross." },
  key: { symbol: "🔑", meaning: "Solutions, secrets, and the authority to open and shut." },
  dove: { symbol: "🕊️", meaning: "Peace and the Holy Spirit. 'The Spirit of God descended like a dove' (Matthew 3:16)." },
  lamb: { symbol: "🐑", meaning: "Innocence, gentleness, and sacrifice. A central image of Christ, the Lamb of God (John 1:29)." },
  bread: { symbol: "🍞", meaning: "Provision, communion, and daily sustenance. 'Give us this day our daily bread' (Matthew 6:11)." },
  cross: { symbol: "✝️", meaning: "Sacrifice, redemption, and hope. The intersection where suffering becomes meaning." },
  light: { symbol: "💡", meaning: "Revelation, truth, and divine presence. 'Thy word is a lamp unto my feet' (Psalm 119:105)." },
  angel: { symbol: "👼", meaning: "Divine messenger, guidance, and protection. Often appears in Scripture announcing or comforting." },
  shepherd: { symbol: "🐑", meaning: "Guidance, care, and protection. 'The Lord is my shepherd' (Psalm 23). 'I am the good shepherd' (John 10:11)." },
  desert: { symbol: "🏜️", meaning: "Testing, solitude, and formation. Moses, Elijah, and Christ each spent time in the wilderness." },
  stars: { symbol: "✨", meaning: "Promise and inheritance. 'Look toward heaven, and number the stars' (Genesis 15:5)." },
};

const detectSymbols = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  return Object.keys(DREAM_DICTIONARY).filter((k) => {
    // Match whole words only (allow optional trailing 's' for plurals)
    const re = new RegExp(`\\b${k}s?\\b`, "i");
    return re.test(lower);
  });
};

const defaultForm = {
  title: "",
  description: "",
  mood: "",
  theme: "",
  tags: [],
  characters: [],
  sleep_quality: null,
  bed_time: "",
  wake_time: "",
  is_public: false,
  interpret_on_save: false,
};

// ─── Shared Styles ──────────────────────────────────────────────────────────
const sharedBackground = {
  minHeight: "100vh",
  background: "#020c18",
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
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    button, a, [role="button"] { touch-action: manipulation; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(200,160,30,0.3); border-radius: 2px; }
    .dream-card:active { border-color: rgba(200,160,30,0.35) !important; }
    input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.8); }
  `}</style>
);

// ─── Main Component ─────────────────────────────────────────────────────────
export default function DreamJournal() {
  const toast = useToast();
  const offline = useOffline();

  // Auth
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(
    !window.Capacitor && !new URLSearchParams(window.location.search).has("dev")
  );

  // Data
  const [userSettings, setUserSettings] = useState(null);
  const [dreams, setDreams] = useState([]);
  const [dreamsLoaded, setDreamsLoaded] = useState(false);

  // UI
  const [tab, setTab] = useState("journal");
  const [showForm, setShowForm] = useState(false);
  const [selectedDream, setSelectedDream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);
  const [readingModal, setReadingModal] = useState(null); // { interpretation, symbols, dreamTitle, themeConnections }
  const [dreamThemesCache, setDreamThemesCache] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPreAuthQuiz, setShowPreAuthQuiz] = useState(false);
  const onboardingChecked = useRef(false); // flipped to true after first check — quiz never re-evaluated
  const quizDoneRef = useRef(false);       // prevents quiz re-showing after completion
  const pendingQuizDataRef = useRef(null); // stores quiz results from pre-auth flow

  // Search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ mood: "", theme: "", dateRange: "", interpretation: "" });
  const [sortBy, setSortBy] = useState("Newest first");
  const [visibleCount, setVisibleCount] = useState(20);
  const PAGE_SIZE = 20;

  // Dream form (controlled)
  const [form, setForm] = useState(defaultForm);

  // Stars rendered via StarField component

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
      // If user just signed up after completing the pre-auth quiz, save their quiz data
      if (pendingQuizDataRef.current) {
        onboardingChecked.current = true; // prevent loadUserSettings from also showing quiz
        const data = pendingQuizDataRef.current;
        pendingQuizDataRef.current = null;
        handleQuizComplete(data);
      } else if (!userSettings || userSettings.user_id !== user.id) {
        loadUserSettings();
      }
    } else {
      setDreams([]);
      setDreamsLoaded(false);
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

  // ── Offline: auto-sync when coming back online ──────────────────────────────
  useEffect(() => {
    if (!offline.isOnline || !user) return;
    if (offline.pendingCount > 0 && !offline.syncing) {
      offline.syncAll(supabase, user.id, async () => {
        await loadDreams();
        await loadUserSettings();
        toast.success("Offline dreams synced successfully");
      });
    }
  }, [offline.isOnline, user]); // eslint-disable-line

  // ── Dream reminder notifications ────────────────────────────────────────────
  useEffect(() => {
    if (!userSettings?.reminder_enabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const wakeTime = userSettings.wake_time || "07:00";
    const [hours, minutes] = wakeTime.split(":").map(Number);

    const scheduleReminder = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      // If the time already passed today, schedule for tomorrow
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target - now;

      return setTimeout(() => {
        // Only notify if they haven't logged a dream today
        const today = new Date().toISOString().split("T")[0];
        if (userSettings.last_dream_date !== today) {
          new Notification("Dream Shepherd", {
            body: "Good morning! Record your dream before it fades.",
            icon: "/icon-192.png",
            tag: "dream-reminder",
          });
        }
        // Reschedule for next day
        scheduleReminder();
      }, delay);
    };

    const timerId = scheduleReminder();
    return () => clearTimeout(timerId);
  }, [userSettings?.reminder_enabled, userSettings?.wake_time, userSettings?.last_dream_date]);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadDreams = async () => {
    if (!navigator.onLine) {
      // Offline: load from IndexedDB cache
      try {
        const cached = await offline.loadCachedDreams();
        if (cached.length) setDreams(cached);
      } catch { /* ignore */ }
      setDreamsLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("dreams")
      .select("*, dream_images(id, image_url, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setDreams(data);
      // Cache for offline viewing (fire-and-forget)
      offline.cacheDreamList(data);
    }
    setDreamsLoaded(true);
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

  const handleOAuthSignIn = async (provider) => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDreams([]);
    setUserSettings(null);
    setTab("journal");
  };

  // Permanent in-app account deletion (App Store Guideline 5.1.1(v))
  const handleDeleteAccount = async () => {
    // Try the SECURITY DEFINER RPC first (no service role key needed in app)
    const { error: rpcErr } = await supabase.rpc("delete_my_account");

    if (rpcErr) {
      // Fallback to the Vercel function path
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Account deletion failed");
      }
    }

    // Clear local state and route home
    try {
      localStorage.removeItem(`onboarding_done_${user.id}`);
    } catch { /* ignore */ }
    await supabase.auth.signOut();
    setDreams([]);
    setUserSettings(null);
    setTab("journal");
    toast.success("Your account has been deleted.");
  };

  // ── Onboarding quiz completion ─────────────────────────────────────────────
  const handleQuizComplete = async ({ displayName, profile, sleep, emotional, recurringThemes, recentDream, interpretation, aiThemes, skipped }) => {
    quizDoneRef.current = true;
    setShowQuiz(false);
    localStorage.setItem(`onboarding_done_${user.id}`, "1");

    // If we have a dream but no interpretation (pre-auth flow), generate it now
    let finalInterpretation = interpretation;
    let finalGeneratedThemes = [];
    let finalScriptureRefs = [];
    if (recentDream?.trim() && !interpretation) {
      try {
        const result = await interpretDream(
          { description: recentDream },
          { archetype_data: { profile, sleep, emotional, recurringThemes } }
        );
        if (result && !result.blocked) {
          finalInterpretation = result.interpretation;
          finalGeneratedThemes = result.generated_themes || [];
          finalScriptureRefs = result.scripture_refs || [];
        }
      } catch {
        finalInterpretation = null;
      }
    }

    // Upsert so it works whether the settings row exists or not
    const { data } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          display_name: displayName || null,
          archetype_data: {
            profile,
            sleep,
            emotional,
            recurringThemes,
            recentDream,
            interpretation: finalInterpretation,
            aiThemes,
            skipped: skipped || false,
          },
          onboarding_completed: true,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (data) setUserSettings(data);

    // Auto-save the onboarding dream as the user's first journal entry
    if (recentDream?.trim() && finalInterpretation) {
      await supabase.from("dreams").insert({
        user_id: user.id,
        title: "My First Dream",
        description: recentDream.trim(),
        interpretation: finalInterpretation,
        generated_themes: finalGeneratedThemes,
        scripture_refs: finalScriptureRefs,
        mood: emotional?.mood || null,
        created_at: new Date().toISOString(),
      });
      loadDreams();
    }
  };

  // ── Dream Pattern Context Builder ──────────────────────────────────────────
  const buildPatternContext = (allDreams) => {
    const interpreted = allDreams.filter(d => d.generated_themes?.length);
    if (interpreted.length < 3) return "";

    // Top 3 recurring moods
    const mc = {};
    allDreams.forEach(d => { if (d.mood) mc[d.mood] = (mc[d.mood] || 0) + 1; });
    const topMoods = Object.entries(mc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m);

    // Top 3 recurring themes
    const tc = {};
    allDreams.forEach(d => { if (d.theme) tc[d.theme] = (tc[d.theme] || 0) + 1; });
    const topThemes = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

    // Last 3 guidance items from most recent interpreted dreams
    const recentGuidance = interpreted.slice(0, 3)
      .flatMap(d => d.generated_themes.map(t => t.guidance))
      .filter(Boolean)
      .slice(0, 3);

    // Top recurring characters
    const cc = {};
    allDreams.forEach(d => {
      (Array.isArray(d.characters) ? d.characters : []).forEach(c => {
        cc[c] = (cc[c] || 0) + 1;
      });
    });
    const topChars = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);

    let ctx = `\n\nDream history context (${allDreams.length} dreams recorded):`;
    if (topMoods.length) ctx += ` Common moods: ${topMoods.join(", ")}.`;
    if (topThemes.length) ctx += ` Recurring themes: ${topThemes.join(", ")}.`;
    if (topChars.length) ctx += ` Recurring characters: ${topChars.join(", ")}.`;
    if (recentGuidance.length) ctx += ` Recent guidance given: ${recentGuidance.join(" | ")}`;
    ctx += " Build on this history. Reference patterns you notice connecting to previous dreams. Evolve the guidance rather than repeating it.";

    return ctx;
  };

  // ── AI Interpretation ──────────────────────────────────────────────────────
  const interpretDream = async (dream, settings) => {
    // Pre-flight content moderation (Apple Guideline 1.2 input filtering).
    // Block obvious slurs and profanity before they reach the AI provider.
    const titleCheck = checkContent(dream.title || "");
    const descCheck = checkContent(dream.description || "");
    if (!titleCheck.clean || !descCheck.clean) {
      return { blocked: true };
    }

    try {
      // Build personal context from the user's onboarding profile
      const ad = settings?.archetype_data;
      const profileParts = [];
      if (ad?.profile?.name) profileParts.push(`The dreamer's name is ${ad.profile.name}.`);
      if (ad?.profile?.gender) profileParts.push(`Gender: ${ad.profile.gender}.`);
      if (settings?.age) profileParts.push(`Age: ${settings.age}.`);
      if (ad?.emotional?.stressLevel) profileParts.push(`Current life stress: ${ad.emotional.stressLevel}.`);
      if (ad?.sleep?.sleepQuality) profileParts.push(`Sleep quality: ${ad.sleep.sleepQuality}/5.`);
      if (ad?.themes?.length) profileParts.push(`Recurring dream themes in their life: ${ad.themes.join(", ")}.`);
      const profileContext = profileParts.length > 0
        ? `\n\nDreamer profile: ${profileParts.join(" ")} Use this context to make the interpretation feel personal and resonant, referencing their life stage or patterns where meaningful. Do not simply list these facts -- weave them in naturally.`
        : "";

      // Build pattern context from dream history
      const patternContext = buildPatternContext(dreams);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interpret-dream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: `You are a wise, empathetic dream interpreter rooted in the Christian tradition. Throughout Scripture, God spoke to people through dreams. Joseph interpreted Pharaoh's. Daniel discerned Nebuchadnezzar's. Jacob saw the ladder. Joseph the husband of Mary was warned in his sleep. Peter saw the sheet from heaven. You stand in that lineage as a thoughtful shepherd, not a pastor on a pulpit.

Draw on biblical wisdom, depth psychology, and dream symbolism. Speak gently and concretely. When relevant, reference Scripture naturally in passing (e.g., "A dove often recalls Matthew 3:16, where the Spirit descended at Christ's baptism"). Do not quote large passages. Do not be preachy, do not moralize, do not assume the dreamer is in sin or crisis. Never use em dashes. Never be alarming.

If the dreamer's content reflects faith, lean into it. If it does not, stay respectful and quietly grounded in the same wisdom without proselytizing.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"interpretation":"A warm, insightful 2-3 sentence interpretation. Be poetic but grounded. Write in plain flowing prose only.","themes":[{"title":"A unique evocative theme title","symbol":"A single relevant emoji","meaning":"What this theme represents in the dreamer's life","guidance":"Actionable advice or reflection prompt for the dreamer"}],"scripture_refs":["Book Chapter:Verse"]}

Generate 2-3 themes that are specific and unique to this dream. Theme titles should be creative and evocative (e.g. "The Unfinished Bridge", "Voices Behind the Door", "The Lamp in the Window"). Each theme should feel personally tailored, not generic.

For scripture_refs, return 0 to 2 well-known verse references that genuinely connect to the dream's imagery or themes. Use the format "Book Chapter:Verse" (e.g. "Psalm 23:4", "Joel 2:28", "Matthew 3:16"). Only include verses that are recognizable from common biblical literacy. Do not invent references or chapter and verse numbers. If no verse comes naturally to mind, return an empty array. Do NOT include the verse text itself, only the reference.${profileContext}${patternContext}`,
          messages: [{
            role: "user",
            content: `Interpret this dream. Title: "${dream.title}". Mood: ${dream.mood}. Theme: ${dream.theme}.${dream.characters?.length ? ` Characters: ${dream.characters.join(", ")}.` : ""}${dream.tags?.length ? ` Tags: ${dream.tags.join(", ")}.` : ""} Dream: "${dream.description}"`,
          }],
          max_tokens: 1200,
        }),
      });
      const data = await response.json();
      const rawText = data.content?.map((b) => b.text || "").join("") || "";

      // Strip markdown code fences if present, then parse JSON
      let cleanText = rawText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }

      try {
        const parsed = JSON.parse(cleanText);
        // Validate scripture refs look like "Book Chapter:Verse" or
        // "Book Chapter:Verse-Verse" before letting them through. Drop
        // anything that doesn't match so a malformed AI response cannot
        // surface broken links to Bible Gateway.
        const refPattern = /^[1-3]?\s?[A-Za-z]+\s+\d+:\d+(-\d+)?$/;
        const refs = Array.isArray(parsed.scripture_refs)
          ? parsed.scripture_refs
              .filter((r) => typeof r === "string" && refPattern.test(r.trim()))
              .map((r) => r.trim())
              .slice(0, 3)
          : [];
        return {
          interpretation: parsed.interpretation || rawText,
          generated_themes: Array.isArray(parsed.themes) ? parsed.themes : [],
          scripture_refs: refs,
        };
      } catch {
        // Fallback: if AI didn't return valid JSON, treat the whole response as interpretation
        return {
          interpretation: rawText || "Your dream holds meaning waiting to be uncovered. Subscribe to Dream Shepherd for unlimited AI-powered interpretations.",
          generated_themes: [],
          scripture_refs: [],
        };
      }
    } catch {
      return null; // signal failure so we don't save a failed message
    }
  };

  // ── AI Image Generation ────────────────────────────────────────────────────
  const FREE_IMAGE_LIMIT = 2;

  const generateDreamImage = async (dream) => {
    if (!userSettings?.is_pro && (userSettings?.image_generation_count || 0) >= FREE_IMAGE_LIMIT) {
      setShowUpgradeModal(true);
      return null;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-dream-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          dreamId: dream.id,
          description: dream.description,
          interpretation: dream.interpretation,
          dreamTitle: dream.title,
        }),
      });
      const data = await response.json();
      if (data.error === "limit_reached") { setShowUpgradeModal(true); return null; }
      if (data.imageUrl) {
        const newImage = { image_url: data.imageUrl, created_at: new Date().toISOString() };
        setDreams((prev) => prev.map((d) => d.id === dream.id
          ? { ...d, dream_image_url: data.imageUrl, dream_images: [...(d.dream_images || []), newImage] }
          : d
        ));
        setUserSettings((s) => ({ ...s, image_generation_count: (s?.image_generation_count || 0) + 1 }));
        return data.imageUrl;
      }
      return null;
    } catch {
      return null;
    }
  };

  // ── Theme connection helpers ────────────────────────────────────────────────
  const fetchDreamThemesCache = async () => {
    if (dreamThemesCache) return dreamThemesCache;
    const { data } = await supabase
      .from("dream_themes")
      .select("key, symbol, meaning, guidance, category")
      .order("key", { ascending: true });
    const themes = data || [];
    setDreamThemesCache(themes);
    return themes;
  };

  const detectThemeConnections = (text, themes) => {
    if (!text || !themes?.length) return [];
    const lower = text.toLowerCase();
    return themes.filter((t) => lower.includes(t.key));
  };

  // ── Dream CRUD ─────────────────────────────────────────────────────────────
  const [interpretingId, setInterpretingId] = useState(null);

  const handleInterpretDream = async (dream) => {
    if (!canInterpret) { setShowUpgradeModal(true); return; }
    setInterpretingId(dream.id);
    try {
      const result = await interpretDream(dream, userSettings);
      if (!result) {
        setInterpretingId(null);
        toast.error("Couldn't interpret your dream right now. Try again in a moment.");
        return; // API failed silently -- keep the button available to retry
      }
      if (result.blocked) {
        setInterpretingId(null);
        toast.error("This dream contains language we can't process. Please edit it and try again.");
        return; // Moderation block -- no AI call, no count consumed
      }
      const { interpretation, generated_themes, scripture_refs } = result;
      const scriptureRefs = scripture_refs || [];
      await supabase.from("dreams").update({
        interpretation,
        generated_themes: generated_themes || [],
        scripture_refs: scriptureRefs,
      }).eq("id", dream.id);
      setDreams((prev) => prev.map((d) => d.id === dream.id ? { ...d, interpretation, generated_themes: generated_themes || [], scripture_refs: scriptureRefs } : d));
      // Open the immersive reading modal
      const themes = await fetchDreamThemesCache();
      const themeConnections = detectThemeConnections(dream.description, themes);
      setReadingModal({ interpretation, symbols: dream.symbols || [], dreamTitle: dream.title, themeConnections, generatedThemes: generated_themes || [], scriptureRefs, dream: { ...dream, interpretation, generated_themes, scripture_refs: scriptureRefs } });
      if (!userSettings?.is_pro) {
        const newCount = (userSettings?.interpretation_count ?? 0) + 1;
        await supabase.from("user_settings").update({ interpretation_count: newCount }).eq("user_id", user.id);
        setUserSettings((s) => ({ ...s, interpretation_count: newCount }));
        // Show soft upgrade nudge after 3rd interpretation
        if (newCount === 3) setShowUpgradeNudge(true);
      }
    } finally {
      setInterpretingId(null);
    }
  };

  const totalFree = FREE_INTERPRETATIONS + Math.min(userSettings?.share_bonus_count ?? 0, MAX_SHARE_BONUS);
  const canInterpret =
    userSettings?.is_pro || (userSettings?.interpretation_count ?? 0) < totalFree;

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      const symbols = detectSymbols(form.description);

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
        sleep_quality: form.sleep_quality || null,
        bed_time: form.bed_time ? `${today}T${form.bed_time}:00` : null,
        wake_time: form.wake_time ? `${today}T${form.wake_time}:00` : null,
        sleep_hours,
        is_public: form.is_public || false,
        symbols,
      };

      // ── Offline path: queue locally and show in list ──
      if (!navigator.onLine) {
        const offlineId = await offline.queueDream(dreamPayload);
        // Show the dream locally immediately so the user sees it
        const localDream = {
          ...dreamPayload,
          id: offlineId,
          created_at: new Date().toISOString(),
          _offlineCreated: true,
        };
        setDreams((prev) => [localDream, ...prev]);
        setForm(defaultForm);
        setShowForm(false);
        toast.info("Dream saved offline. It will sync when you're back online.");
        setLoading(false);
        return;
      }

      // ── Online path: normal Supabase insert ──
      const { data: inserted, error } = await supabase.from("dreams").insert(dreamPayload).select().single();
      if (error) throw error;

      // Interpret on save if toggled
      if (form.interpret_on_save && canInterpret && inserted) {
        const result = await interpretDream({ ...inserted, symbols }, userSettings);
        if (result) {
          const { interpretation, generated_themes } = result;
          await supabase.from("dreams").update({ interpretation, generated_themes: generated_themes || [] }).eq("id", inserted.id);
          if (!userSettings?.is_pro) {
            const newCount = (userSettings?.interpretation_count ?? 0) + 1;
            await supabase.from("user_settings").update({ interpretation_count: newCount }).eq("user_id", user.id);
            setUserSettings((s) => ({ ...s, interpretation_count: newCount }));
            if (newCount === 3) setShowUpgradeNudge(true);
          }
        }
      }

      // Update streak
      await supabase.rpc("update_dream_streak", { p_user_id: user.id });

      await loadDreams();
      await loadUserSettings();
      setForm(defaultForm);
      setShowForm(false);
      toast.success(form.interpret_on_save ? "Dream saved and interpreted" : "Dream saved");
    } catch (err) {
      console.error("Error saving dream:", err);
      // If online save fails due to network, fall back to offline queue
      if (!navigator.onLine || err?.message?.includes("fetch") || err?.message?.includes("network")) {
        try {
          const symbols = detectSymbols(form.description);
          let sleep_hours = null;
          if (form.bed_time && form.wake_time) {
            const [bh, bm] = form.bed_time.split(":").map(Number);
            const [wh, wm] = form.wake_time.split(":").map(Number);
            let hours = wh + wm / 60 - (bh + bm / 60);
            if (hours < 0) hours += 24;
            sleep_hours = Math.round(hours * 100) / 100;
          }
          const today = new Date().toISOString().split("T")[0];
          const fallbackPayload = {
            user_id: user.id, title: form.title, description: form.description,
            mood: form.mood || null, theme: form.theme || null, tags: form.tags || [],
            characters: form.characters || [], sleep_quality: form.sleep_quality || null,
            bed_time: form.bed_time ? `${today}T${form.bed_time}:00` : null,
            wake_time: form.wake_time ? `${today}T${form.wake_time}:00` : null,
            sleep_hours, is_public: form.is_public || false, symbols,
          };
          const offlineId = await offline.queueDream(fallbackPayload);
          setDreams((prev) => [{ ...fallbackPayload, id: offlineId, created_at: new Date().toISOString(), _offlineCreated: true }, ...prev]);
          setForm(defaultForm);
          setShowForm(false);
          toast.info("Connection lost. Dream saved offline and will sync later.");
        } catch { /* IndexedDB also failed, nothing we can do */ }
      } else {
        toast.error("Couldn't save your dream. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDream = async (dreamId) => {
    try {
      const { error } = await supabase.from("dreams").delete().eq("id", dreamId);
      if (error) throw error;
      setDreams((d) => d.filter((x) => x.id !== dreamId));
      if (selectedDream?.id === dreamId) setSelectedDream(null);
      toast.success("Dream removed");
    } catch (err) {
      console.error("Error deleting dream:", err);
      toast.error("Couldn't remove the dream. Please try again.");
    }
  };

  const handleTogglePublic = async (dreamId) => {
    const dream = dreams.find((d) => d.id === dreamId);
    if (!dream) return;
    const newValue = !dream.is_public;
    try {
      const { error } = await supabase.from("dreams").update({ is_public: newValue }).eq("id", dreamId);
      if (error) throw error;
      setDreams((prev) => prev.map((d) => d.id === dreamId ? { ...d, is_public: newValue } : d));
      if (selectedDream?.id === dreamId) setSelectedDream((s) => ({ ...s, is_public: newValue }));
      toast.success(newValue ? "Dream shared with the community" : "Dream made private");
    } catch (err) {
      console.error("Error toggling visibility:", err);
      toast.error("Couldn't update visibility. Please try again.");
    }
  };

  // ── Upgrade ────────────────────────────────────────────────────────────────
  const handleUpgrade = async (plan) => {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, plan: plan || selectedPlan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      console.error("Upgrade failed:", err);
      toast.error("Couldn't open checkout. Please try again.");
      setShowUpgradeModal(true);
    }
  };

  // ── Filtered & sorted dreams ───────────────────────────────────────────────
  const filteredDreams = useMemo(() => {
    let result = dreams;

    // Full-text search across all relevant fields
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => {
        if (d.title?.toLowerCase().includes(q)) return true;
        if (d.description?.toLowerCase().includes(q)) return true;
        if (d.interpretation?.toLowerCase().includes(q)) return true;
        if (d.mood?.toLowerCase().includes(q)) return true;
        if (d.theme?.toLowerCase().includes(q)) return true;
        if (d.tags?.some((t) => t.toLowerCase().includes(q))) return true;
        if (d.characters?.some((c) => c.toLowerCase().includes(q))) return true;
        if (d.symbols?.some((s) => s.toLowerCase().includes(q))) return true;
        if (d.generated_themes?.some((t) =>
          t.title?.toLowerCase().includes(q) ||
          t.guidance?.toLowerCase().includes(q)
        )) return true;
        return false;
      });
    }

    if (filters.mood) result = result.filter((d) => d.mood === filters.mood);
    if (filters.theme) result = result.filter((d) => d.theme === filters.theme);

    if (filters.dateRange) {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      let cutoff = null;
      if (filters.dateRange === "Last 7 days") cutoff = now - 7 * dayMs;
      else if (filters.dateRange === "Last 30 days") cutoff = now - 30 * dayMs;
      else if (filters.dateRange === "Last 90 days") cutoff = now - 90 * dayMs;
      else if (filters.dateRange === "This year") {
        cutoff = new Date(new Date().getFullYear(), 0, 1).getTime();
      }
      if (cutoff !== null) {
        result = result.filter((d) => new Date(d.created_at).getTime() >= cutoff);
      }
    }

    if (filters.interpretation === "Has interpretation") {
      result = result.filter((d) => !!d.interpretation);
    } else if (filters.interpretation === "Awaiting reflection") {
      result = result.filter((d) => !d.interpretation);
    }

    // Sort
    const sorted = [...result];
    if (sortBy === "Oldest first") {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "Longest sleep") {
      sorted.sort((a, b) => (b.sleep_hours || 0) - (a.sleep_hours || 0));
    } else if (sortBy === "Best sleep quality") {
      sorted.sort((a, b) => (b.sleep_quality || 0) - (a.sleep_quality || 0));
    } else {
      // Newest first (default)
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return sorted;
  }, [dreams, searchQuery, filters, sortBy]);

  // Reset pagination whenever the visible result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, filters, sortBy]);

  const visibleDreams = useMemo(
    () => filteredDreams.slice(0, visibleCount),
    [filteredDreams, visibleCount]
  );
  const hasMore = visibleCount < filteredDreams.length;

  // ── Stars layer ────────────────────────────────────────────────────────────
  const starsLayer = (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, willChange: "transform", transform: "translateZ(0)" }}>
      <StarField count={220} animation="twinkle" />

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

  // ── Pre-auth quiz (gather profile before signing up) ─────────────────────
  if (!user && showPreAuthQuiz) {
    return (
      <div style={sharedBackground}>
        {starsLayer}
        {globalStyles}
        <OnboardingQuiz preAuth onComplete={(data) => {
          setShowPreAuthQuiz(false);
          if (data.skipped) return; // just go back to auth
          pendingQuizDataRef.current = data;
          setAuthMode("signup");
        }} />
      </div>
    );
  }

  // ── Landing page (unauthenticated visitors) ────────────────────────────────
  if (!user && showLanding) {
    return <Landing onSignIn={() => setShowLanding(false)} />;
  }

  // ── Auth screen ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ ...sharedBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {starsLayer}
        {globalStyles}
        <div style={{
          position: "relative", zIndex: 1, width: "100%", maxWidth: 400, padding: "0 24px",
          animation: "fadeIn 0.55s ease-out",
        }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🐑</div>
            <h1 style={{ fontSize: 36, fontWeight: 400, margin: "0 0 8px", background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dream Shepherd
            </h1>
            <p style={{ fontSize: 14, color: "#8a7540", margin: 0 }}>Tend to your dreams like a shepherd</p>
          </div>
          <div style={{ background: "rgba(6,12,22,0.85)", border: "1px solid rgba(200,160,30,0.2)", borderRadius: 20, padding: 32, backdropFilter: "blur(10px)" }}>
            {/* Show signup prompt if quiz was completed pre-auth */}
            {pendingQuizDataRef.current && (
              <div style={{
                textAlign: "center", marginBottom: 20, padding: "14px 16px",
                background: "rgba(104,71,192,0.08)", border: "1px solid rgba(144,102,212,0.25)",
                borderRadius: 14,
              }}>
                <div style={{ fontSize: 14, color: "#b08aee", marginBottom: 4 }}>
                  ✦ Your reading is ready
                </div>
                <div style={{ fontSize: 12, color: "#8a7540" }}>
                  Create a free account to see what your dream means
                </div>
              </div>
            )}
            <div style={{ fontSize: 15, color: "#e8b840", textAlign: "center", marginBottom: 24 }}>
              {pendingQuizDataRef.current ? "Sign up to see your reading" : authMode === "login" ? "Welcome back" : "Begin your journey"}
            </div>

            {/* OAuth buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => handleOAuthSignIn("google")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12, padding: "14px 16px", color: "#f5e4b0", fontSize: 15,
                  cursor: "pointer", fontFamily: "-apple-system, sans-serif", minHeight: 48,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuthSignIn("apple")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12, padding: "14px 16px", color: "#f5e4b0", fontSize: 15,
                  cursor: "pointer", fontFamily: "-apple-system, sans-serif", minHeight: 48,
                }}
              >
                <svg width="17" height="20" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill="#f5e4b0">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.7 0 228.3 0 147.4c0-99.4 67.6-153.3 133.3-153.3 63.5 0 109 43.8 147.4 43.8 36.5 0 93.7-46.1 164.4-46.1 26.4 0 108.2 2.6 162.1 98.3zm-234.5-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(200,160,30,0.15)" }} />
              <span style={{ fontSize: 12, color: "#6b5c30" }}>or continue with email</span>
              <div style={{ flex: 1, height: 1, background: "rgba(200,160,30,0.15)" }} />
            </div>

            <input
              type="email" placeholder="Email address" value={authForm.email}
              onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,160,30,0.2)", borderRadius: 10, padding: "14px 16px", color: "#f5e4b0", fontSize: 16, marginBottom: 12, outline: "none" }}
            />
            <input
              type="password" placeholder="Password" value={authForm.password}
              onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,160,30,0.2)", borderRadius: 10, padding: "14px 16px", color: "#f5e4b0", fontSize: 16, marginBottom: 16, outline: "none" }}
            />
            {authError && (
              <div style={{ fontSize: 12, color: "#ff9999", marginBottom: 12, textAlign: "center" }}>{authError}</div>
            )}
            <button onClick={handleAuth} disabled={authLoading} style={{
              width: "100%", background: authLoading ? "rgba(140,90,5,0.4)" : "linear-gradient(135deg, #7a5200, #c89020)",
              border: "none", color: "white", padding: "16px", borderRadius: 12,
              fontSize: 16, cursor: authLoading ? "not-allowed" : "pointer", letterSpacing: 0.5, minHeight: 48,
            }}>
              {authLoading ? "..." : pendingQuizDataRef.current ? "Create Account" : authMode === "login" ? "Sign In" : "Create Account"}
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
            {/* Try-before-signup CTA for new users */}
            {!pendingQuizDataRef.current && authMode !== "login" && (
              <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(200,160,30,0.1)" }}>
                <button
                  onClick={() => setShowPreAuthQuiz(true)}
                  style={{
                    background: "none", border: "1px solid rgba(144,102,212,0.35)",
                    color: "#9066d4", padding: "14px 20px", borderRadius: 12,
                    fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 48,
                    letterSpacing: 0.5, width: "100%",
                  }}
                >
                  ✦ Try a dream interpretation first
                </button>
                <p style={{ fontSize: 11, color: "#6a5030", marginTop: 8, marginBottom: 0 }}>
                  Share a dream and see what it means before signing up
                </p>
              </div>
            )}
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
        <OnboardingQuiz onComplete={handleQuizComplete} />
      </div>
    );
  }

  // ── Tab icon SVGs ──────────────────────────────────────────────────────────
  const TabIcon = ({ id, active }) => {
    const color = active ? "#e8b840" : "#5a5040";
    const s = { width: 24, height: 24, display: "block" };
    switch (id) {
      case "community": return (
        <svg viewBox="0 0 24 24" fill="none" style={s}>
          <circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.5"/>
          <path d="M2 19c0-3.3 2.7-6 6-6h2c3.3 0 6 2.7 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.3" opacity="0.6"/>
          <path d="M18 13.5c2.2.5 4 2.5 4 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );
      case "insights": return (
        <img src="/moon-fog.svg" alt="Patterns" style={{ width: 24, height: 24, display: "block", filter: active ? "brightness(0) saturate(100%) invert(78%) sepia(40%) saturate(600%) hue-rotate(5deg) brightness(95%)" : "brightness(0) saturate(100%) invert(30%) sepia(15%) saturate(500%) hue-rotate(10deg) brightness(95%)" }} />
      );
      case "journal": return (
        <img src="/shepherd.svg" alt="Journal" style={{ width: 30, height: 30, display: "block", filter: active ? "brightness(0) saturate(100%) invert(78%) sepia(40%) saturate(600%) hue-rotate(5deg) brightness(95%)" : "brightness(0) saturate(100%) invert(30%) sepia(15%) saturate(500%) hue-rotate(10deg) brightness(95%)" }} />
      );
      case "library": return (
        <svg viewBox="0 0 496 496" fill={color} style={s}>
          <path d="M424,416h8V0H112C85.528,0,64,21.528,64,48v400c0,26.472,21.528,48,48,48h320v-16h-8c-17.648,0-32-14.352-32-32 S406.352,416,424,416z M388.256,480H112c-17.648,0-32-14.352-32-32s14.352-32,32-32h276.256C380.64,424.504,376,435.72,376,448 C376,460.28,380.64,471.504,388.256,480z M112,400c-12.28,0-23.504,4.64-32,12.248V48c0-17.648,14.352-32,32-32h304v384H112z"/>
          <rect x="96" y="440" width="232" height="16"/>
          <rect x="344" y="440" width="16" height="16"/>
          <path d="M104,248h288V40H104V248z M120,56h256v176H120V56z"/>
          <polygon points="264,132.688 232.496,101.176 130.88,185.856 141.12,198.144 231.504,122.824 282.344,173.656 293.656,162.344 275.312,144 287.696,131.624 354.056,205.352 365.944,194.648 288.304,108.376"/>
          <rect x="376" y="264" width="16" height="16"/>
          <rect x="344" y="264" width="16" height="16"/>
          <rect x="312" y="264" width="16" height="16"/>
        </svg>
      );
      case "profile": return (
        <svg viewBox="0 0 24 24" fill="none" style={s}>
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
      default: return null;
    }
  };

  // ── Nav config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: "community",  label: "Community" },
    { id: "insights",   label: "Patterns" },
    { id: "journal",    label: "Journal" },
    { id: "library",    label: "Library" },
    { id: "profile",    label: "Profile" },
  ];

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <div style={sharedBackground}>
      {starsLayer}
      {globalStyles}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 12px 100px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🐑</span>
            <div>
              <h1 style={{
                fontSize: 20, fontWeight: 400, margin: 0,
                background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.5,
              }}>
                Dream Shepherd
              </h1>
              {userSettings?.display_name && (
                <div style={{ fontSize: 11, color: "#8a7540", marginTop: 2 }}>
                  Welcome, {userSettings.display_name}
                </div>
              )}
            </div>
            {userSettings?.is_pro && (
              <span style={{
                background: "linear-gradient(135deg, #c8a020, #e8c840)",
                color: "#1a1000", padding: "2px 8px", borderRadius: 16, fontSize: 10, fontWeight: 600,
              }}>
                ✦
              </span>
            )}
          </div>
        </div>

        {/* Offline status banner */}
        <OfflineBanner
          isOnline={offline.isOnline}
          pendingCount={offline.pendingCount}
          syncing={offline.syncing}
          onSync={() =>
            user && offline.syncAll(supabase, user.id, async () => {
              await loadDreams();
              await loadUserSettings();
              toast.success("Offline dreams synced");
            })
          }
        />

        {/* ── JOURNAL TAB ── */}
        {tab === "journal" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ErrorBoundary label="Journal">
            <MorningCard
              user={user}
              userSettings={userSettings}
              dreams={dreams}
              onSettingsUpdate={setUserSettings}
              onRecordDream={() => { setShowForm(true); setForm(defaultForm); }}
            />
            <StreakBanner
              streak={userSettings?.streak_current || 0}
              longestStreak={userSettings?.streak_longest || 0}
              lastDreamDate={userSettings?.last_dream_date}
              dreams={dreams}
              onRecordDream={() => { setShowForm(true); setForm(defaultForm); }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#8a7540" }}>
                {dreams.length} dream{dreams.length !== 1 ? "s" : ""} recorded
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  freeRemaining={Math.max(0, totalFree - (userSettings?.interpretation_count ?? 0))}
                />
              </div>
            )}

            {dreams.length > 0 && (
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                sortBy={sortBy}
                setSortBy={setSortBy}
                resultCount={filteredDreams.length}
                totalCount={dreams.length}
              />
            )}

            {/* Skeleton loading state */}
            {!dreamsLoaded && dreams.length === 0 && (
              <div>
                <SkeletonCard delay={0} />
                <SkeletonCard delay={0.08} />
                <SkeletonCard delay={0.16} />
              </div>
            )}

            {dreams.length === 0 && dreamsLoaded && !showForm && (
              <FirstTimeJourney
                onStart={() => { setShowForm(true); setForm(defaultForm); }}
              />
            )}

            {dreams.length > 0 && filteredDreams.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#6b5c30" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.7 }}>🌫️</div>
                <div style={{ fontSize: 14, color: "#9a8050", marginBottom: 4, fontFamily: "Georgia, serif" }}>
                  No dreams match your filters
                </div>
                <div style={{ fontSize: 12, color: "#6b5c30", marginBottom: 18, fontFamily: "Georgia, serif" }}>
                  Try adjusting the search or clearing filters.
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({ mood: "", theme: "", dateRange: "", interpretation: "" });
                    setSortBy("newest");
                  }}
                  style={{
                    background: "rgba(200,160,30,0.1)",
                    border: "1px solid rgba(200,160,30,0.3)",
                    color: "#e8b840",
                    padding: "10px 22px",
                    borderRadius: 30,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                    letterSpacing: 0.5,
                    minHeight: 40,
                  }}
                >
                  Clear search & filters
                </button>
              </div>
            )}

            {visibleDreams.map((dream) => (
              <DreamCard
                key={dream.id}
                dream={dream}
                isSelected={selectedDream?.id === dream.id}
                onSelect={(d) => setSelectedDream(selectedDream?.id === d.id ? null : d)}
                onDelete={handleDeleteDream}
                onTogglePublic={handleTogglePublic}
                onInterpret={handleInterpretDream}
                interpreting={interpretingId === dream.id}
                onViewReading={async (d) => {
                  const themes = await fetchDreamThemesCache();
                  const themeConnections = detectThemeConnections(d.description, themes);
                  setReadingModal({ interpretation: d.interpretation, symbols: d.symbols || [], dreamTitle: d.title, themeConnections, generatedThemes: d.generated_themes || [], scriptureRefs: d.scripture_refs || [], dream: d });
                }}
              />
            ))}

            {hasMore && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16, marginBottom: 8 }}>
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  style={{
                    background: "rgba(200,160,30,0.1)",
                    border: "1px solid rgba(200,160,30,0.3)",
                    color: "#e8b840",
                    padding: "12px 32px",
                    borderRadius: 40,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                    letterSpacing: 0.5,
                    transition: "all 0.2s",
                    minHeight: 44,
                  }}
                >
                  Load {Math.min(PAGE_SIZE, filteredDreams.length - visibleCount)} more
                </button>
                <div style={{ marginTop: 8, fontSize: 11, color: "#5a4a30", fontFamily: "Georgia, serif" }}>
                  {visibleCount} of {filteredDreams.length} shown
                </div>
              </div>
            )}

            {!hasMore && filteredDreams.length > PAGE_SIZE && (
              <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#5a4a30", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                ✦ End of dreams ✦
              </div>
            )}
            </ErrorBoundary>
          </div>
        )}

        {/* ── INSIGHTS TAB ── */}
        {tab === "insights" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ErrorBoundary label="Insights">
              <PatternsTab
                dreams={dreams}
                userSettings={userSettings}
                onNavigateJournal={({ search }) => {
                  if (search) setSearchQuery(search);
                  setTab("journal");
                }}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* ── LIBRARY TAB ── */}
        {tab === "library" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ErrorBoundary label="Library">
              <DictionaryTab />
            </ErrorBoundary>
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {tab === "community" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ErrorBoundary label="Community">
              <CommunityTab
                user={user}
                supabase={supabase}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* ── PROFILE TAB (includes Gallery + Library subsections) ── */}
        {tab === "profile" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ErrorBoundary label="Profile">
              <ProfileTab
                user={user}
                userSettings={userSettings}
                onSettingsUpdate={setUserSettings}
                dreams={dreams}
                onUpgrade={() => setShowUpgradeModal(true)}
                onSignOut={handleLogout}
                onDeleteAccount={handleDeleteAccount}
              />

              {/* Gallery subsection */}
              <div style={{ marginTop: 28 }}>
                <div style={{
                  height: 1, marginBottom: 24,
                  background: "linear-gradient(90deg, transparent, rgba(200,160,30,0.2), transparent)",
                }} />
                <ErrorBoundary label="Gallery">
                  <GalleryTab
                    user={user}
                    dreams={dreams}
                    onViewReading={async (d) => {
                      const themes = await fetchDreamThemesCache();
                      const themeConnections = detectThemeConnections(d.description, themes);
                      setReadingModal({ interpretation: d.interpretation, symbols: d.symbols || [], dreamTitle: d.title, themeConnections, generatedThemes: d.generated_themes || [], scriptureRefs: d.scripture_refs || [], dream: d });
                    }}
                  />
                </ErrorBoundary>
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* ── Reading Modal ── */}
      {readingModal && (
        <ReadingModal
          reading={readingModal}
          onClose={() => setReadingModal(null)}
          onGenerateImage={generateDreamImage}
          userSettings={userSettings}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* ── Interpretation loading overlay ── */}
      <InterpretationOverlay
        open={!!interpretingId}
        dreamTitle={dreams.find((d) => d.id === interpretingId)?.title || ""}
      />

      {/* ── Bottom Tab Bar ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 80,
        background: "rgba(4,8,18,0.98)",
        borderTop: "1px solid rgba(200,160,30,0.08)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "10px 0 6px", minWidth: 64, minHeight: 50,
          }}>
            <span style={{
              opacity: tab === t.id ? 1 : 0.5,
              transition: "opacity 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center",
              filter: tab === t.id ? "drop-shadow(0 0 4px rgba(232,184,64,0.35))" : "none",
            }}><TabIcon id={t.id} active={tab === t.id} /></span>
            <span style={{
              fontSize: 10, letterSpacing: 0.3,
              color: tab === t.id ? "#e8b840" : "#5a5040",
              fontFamily: "-apple-system, sans-serif",
              fontWeight: tab === t.id ? 600 : 400,
              transition: "color 0.15s",
            }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Upgrade Nudge (after 3rd interpretation) ── */}
      {showUpgradeNudge && !userSettings?.is_pro && (
        <div style={{
          position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(16,4,40,0.97), rgba(30,10,60,0.97))",
          border: "1px solid rgba(200,160,50,0.35)", borderRadius: 18,
          padding: "16px 22px", maxWidth: 380, width: "90%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)", zIndex: 90,
          animation: "fadeIn 0.4s ease", display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#f5e4b0", marginBottom: 4 }}>
              Enjoying your reflections?
            </div>
            <div style={{ fontSize: 11, color: "#8a7540", lineHeight: 1.5 }}>
              You have {Math.max(0, totalFree - (userSettings?.interpretation_count || 0))} left. Subscribe for unlimited interpretations, dream visualizations, and more.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button onClick={() => { setShowUpgradeNudge(false); setShowUpgradeModal(true); }} style={{
              background: "linear-gradient(135deg, #c8a020, #e8c840)", border: "none",
              color: "#1a1000", padding: "10px 16px", borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", minHeight: 40,
            }}>
              Learn More
            </button>
            <button onClick={() => setShowUpgradeNudge(false)} style={{
              background: "none", border: "none", color: "#6b5c30",
              fontSize: 10, cursor: "pointer", padding: 0,
            }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ── */}
      <Dialog.Root open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <Dialog.Portal>
          <Dialog.Overlay style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }} />
          <Dialog.Content
            aria-describedby={undefined}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              background: "rgba(16,4,40,0.97)", border: "1px solid rgba(200,160,50,0.4)",
              borderRadius: 20, padding: 24, maxWidth: 400, width: "94%",
              boxShadow: "0 16px 60px rgba(110,70,5,0.5)", animation: "fadeIn 0.3s ease", textAlign: "center",
              zIndex: 101,
            }}
          >
            <Dialog.Title style={{ fontSize: 20, color: "#f5e4b0", marginBottom: 8, fontWeight: 400 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🐑</div>
              Dream Shepherd
            </Dialog.Title>
            <div style={{ fontSize: 13, color: "#7a6a40", marginBottom: 20, lineHeight: 1.6 }}>
              Take your dream journey to the next level.
            </div>
            <div style={{
              textAlign: "left", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10,
            }}>
              {[
                { icon: "🌙", text: "Unlimited AI dream interpretations" },
                { icon: "🎨", text: "Unlimited dream visualizations" },
                { icon: "🔮", text: "Deeper, more personalized insights" },
                { icon: "✨", text: "Priority access to new features" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: "#c8a040" }}>{item.text}</span>
                </div>
              ))}
            </div>
            {/* Plan Toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["monthly", "annual"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", border: `1px solid rgba(200,160,50,${selectedPlan === p ? "0.5" : "0.2"})`,
                    minHeight: 44, fontFamily: "Georgia, serif",
                    background: selectedPlan === p ? "rgba(200,160,50,0.15)" : "transparent",
                    color: selectedPlan === p ? "#e8c840" : "#7a6a40",
                    transition: "all 0.2s",
                  }}
                >
                  {p === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
            {/* Price Display */}
            <div style={{
              background: "rgba(200,160,50,0.1)", border: "1px solid rgba(200,160,50,0.3)",
              borderRadius: 16, padding: "16px 20px", marginBottom: 24,
            }}>
              {selectedPlan === "monthly" ? (
                <>
                  <div style={{ fontSize: 28, color: "#e8c840", fontWeight: 400 }}>
                    $8<span style={{ fontSize: 14, color: "#a09060" }}>/month</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#a09060", marginTop: 4 }}>Cancel anytime</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, color: "#e8c840", fontWeight: 400 }}>
                    $59.99<span style={{ fontSize: 14, color: "#a09060" }}>/year</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#a09060", marginTop: 4 }}>
                    Just $5/mo - Save 37%
                  </div>
                </>
              )}
            </div>
            <button onClick={() => handleUpgrade(selectedPlan)} style={{
              width: "100%", background: "linear-gradient(135deg, #c8a020, #e8c840)",
              border: "none", color: "#1a1000", padding: "16px", borderRadius: 12,
              fontSize: 16, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5, marginBottom: 12, minHeight: 48,
            }}>
              {selectedPlan === "annual" ? "Upgrade Now - Best Value" : "Upgrade Now"}
            </button>
            {(userSettings?.share_bonus_count ?? 0) < MAX_SHARE_BONUS && (
              <div style={{ marginBottom: 12 }}>
                <ShareButton
                  userId={user?.id}
                  shareBonusCount={userSettings?.share_bonus_count ?? 0}
                  maxBonus={MAX_SHARE_BONUS}
                  variant="compact"
                  onBonusEarned={(newCount) => {
                    setUserSettings((s) => ({ ...s, share_bonus_count: newCount }));
                    setTimeout(() => setShowUpgradeModal(false), 1500);
                  }}
                />
              </div>
            )}
            <Dialog.Close asChild>
              <button style={{
                background: "none", border: "none", color: "#6b5c30", fontSize: 14, cursor: "pointer", padding: "12px", minHeight: 44,
              }}>
                Maybe Later
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
