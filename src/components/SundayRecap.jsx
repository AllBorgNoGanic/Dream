import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { getTodaysDevotional, localDateKey } from "../constants/devotionals";

// ─────────────────────────────────────────────────────────────────────────────
// SundayRecap
// A once-a-week summary card that appears on Sunday mornings, summarizing
// the past 7 days of dreams. Top symbol, dominant mood, longest dream,
// a one-sentence AI synthesis, and a verse for the week ahead.
// ─────────────────────────────────────────────────────────────────────────────

// Inject keyframes once
const STYLE_ID = "sunday-recap-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes sr-enterIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes sr-collapseOut {
      0% { opacity: 1; max-height: 800px; margin-bottom: 16px; }
      100% { opacity: 0; max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
    }
    @keyframes sr-shimmerLine { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes sr-blurIn { from { opacity: 0; filter: blur(4px); } to { opacity: 1; filter: blur(0px); } }
    @keyframes sr-dotFade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSundayLocal(date) {
  return date.getDay() === 0;
}

function mostCommon(values) {
  const counts = {};
  values.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  return { value: sorted[0][0], count: sorted[0][1] };
}

function computeWeekStats(dreams, now) {
  if (!Array.isArray(dreams) || dreams.length === 0) {
    return { count: 0, weekDreams: [], topSymbol: null, topMood: null, longestDream: null };
  }
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekDreams = dreams.filter((d) => new Date(d.created_at) >= weekAgo);

  const allSymbols = weekDreams.flatMap((d) => Array.isArray(d.symbols) ? d.symbols : []);
  const topSymbol = mostCommon(allSymbols);

  const allMoods = weekDreams.map((d) => d.mood).filter(Boolean);
  const topMood = mostCommon(allMoods);

  const longestDream = [...weekDreams].sort(
    (a, b) => (b.description?.length || 0) - (a.description?.length || 0)
  )[0] || null;

  return { count: weekDreams.length, weekDreams, topSymbol, topMood, longestDream };
}

// Light emoji map for symbols on the bullet line. Fallback to ✦.
const SYMBOL_EMOJI = {
  water: "💧", ocean: "🌊", fire: "🔥", light: "✨", dove: "🕊️",
  lamb: "🐑", bread: "🍞", cross: "✝️", angel: "👼", flying: "🕊️",
  falling: "🌀", death: "💀", chase: "🏃", house: "🏠", snake: "🐍",
  forest: "🌲", school: "🏫", baby: "👶", car: "🚗", mirror: "🪞",
  clock: "⏰", bird: "🐦", door: "🚪", rain: "🌧️", mountain: "⛰️",
  moon: "🌙", sun: "☀️", bridge: "🌉", key: "🔑", shepherd: "🐑",
  desert: "🏜️", stars: "✨", teeth: "🦷",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SundayRecap({ user, userSettings, dreams, onSettingsUpdate, onOpenJournal, now: nowOverride }) {
  const [synthesis, setSynthesis] = useState(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const synthRequestedRef = useRef(false);

  // `now` is injectable so callers (and the preview harness) can pass a
  // specific date. Production callers leave it undefined to use real time.
  const today = useMemo(() => nowOverride || new Date(), [nowOverride]);
  const todayKey = useMemo(() => localDateKey(today), [today]);
  const stats = useMemo(() => computeWeekStats(dreams, today), [dreams, today]);
  const devotional = useMemo(() => getTodaysDevotional(today), [today]);

  const alreadySeen = userSettings?.last_sunday_recap_seen === todayKey;
  const shouldRender = isSundayLocal(today) && (!alreadySeen || dismissing);

  // Kick off the AI synthesis once when the component decides it should render
  // and there is at least one dream to reflect on. No call when count is 0.
  useEffect(() => {
    if (!shouldRender) return;
    if (stats.count === 0) return;
    if (synthRequestedRef.current) return;
    synthRequestedRef.current = true;

    const titles = stats.weekDreams
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((d, i) => `${i + 1}. "${d.title || "Untitled"}"${d.mood ? ` (mood: ${d.mood})` : ""}`)
      .join("\n");

    const userContent = `Dreams this week (newest first):
${titles}

Most common symbol: ${stats.topSymbol ? stats.topSymbol.value : "none"}
Dominant mood: ${stats.topMood ? stats.topMood.value : "varied"}
Total: ${stats.count} dream${stats.count === 1 ? "" : "s"}

Write one quiet, observant sentence about the week.`;

    (async () => {
      setSynthLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interpret-dream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            max_tokens: 120,
            system: `You are reflecting on a dreamer's past week of dreams as a thoughtful companion in the Christian tradition. Write ONE quiet, observant sentence (no more than 30 words) about the week's dreams. Speak directly to the dreamer in second person. Be specific to what is in their week. Do not be preachy, do not be alarming. Never use em dashes. Do not quote scripture. Respond ONLY with the sentence. No preamble, no JSON, no markdown.`,
            messages: [{ role: "user", content: userContent }],
          }),
        });
        const data = await response.json();
        const text = (data.content?.map((b) => b.text || "").join("") || "").trim();
        if (text) setSynthesis(text);
      } catch {
        // Synthesis is non-essential. Card still renders without it.
        setSynthesis(null);
      } finally {
        setSynthLoading(false);
      }
    })();
  }, [shouldRender, stats]);

  if (!shouldRender) return null;

  const markSeen = async () => {
    if (!user) return;
    if (onSettingsUpdate) {
      onSettingsUpdate((prev) => ({ ...prev, last_sunday_recap_seen: todayKey }));
    }
    await supabase
      .from("user_settings")
      .update({ last_sunday_recap_seen: todayKey })
      .eq("user_id", user.id);
  };

  const handleDismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    setTimeout(() => markSeen(), 380);
  };

  const handleOpen = () => {
    markSeen();
    if (onOpenJournal) onOpenJournal();
  };

  // Format Sunday's date as "May 17"
  const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][today.getMonth()];
  const headerDate = `Sunday, ${monthName} ${today.getDate()}`;

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(160deg, rgba(22,8,48,0.95) 0%, rgba(10,4,28,0.95) 100%)",
      border: "1px solid rgba(232,184,64,0.30)",
      borderRadius: 20,
      padding: "22px 18px 18px",
      marginBottom: 16,
      overflow: "hidden",
      fontFamily: "Georgia, serif",
      animation: dismissing
        ? "sr-collapseOut 0.4s ease forwards"
        : "sr-enterIn 0.5s ease-out",
      boxShadow: "0 0 36px rgba(232,184,64,0.10), 0 0 50px rgba(104,71,192,0.08)",
    }}>
      {/* Top gold shimmer */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, rgba(232,184,64,0.7), transparent)",
        backgroundSize: "300% 100%",
        animation: "sr-shimmerLine 5s ease-in-out infinite",
      }} />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, color: "#e8b840", textShadow: "0 0 10px rgba(232,184,64,0.5)" }}>✦</span>
          <span style={{
            fontSize: 10.5, letterSpacing: 3, color: "#9a8050",
            textTransform: "uppercase", fontWeight: 600,
          }}>
            Your week in dreams
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#6b5c30", letterSpacing: 0.5 }}>
          {headerDate}
        </div>
      </div>

      {/* No-dreams variant ─────────────────────────────────────────────────── */}
      {stats.count === 0 ? (
        <>
          <p style={{
            fontSize: 15, color: "#f0dfa0", lineHeight: 1.7, fontStyle: "italic",
            margin: "0 0 16px",
          }}>
            You logged no dreams this week. Rest is also faithful.
          </p>
          <div style={{
            marginBottom: 18, padding: "14px 16px",
            background: "rgba(232,184,64,0.06)",
            border: "1px solid rgba(232,184,64,0.18)",
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#8a7540", textTransform: "uppercase", marginBottom: 8 }}>
              A verse for the week ahead
            </div>
            <p style={{ fontSize: 14, color: "#f0dfa0", fontStyle: "italic", lineHeight: 1.6, margin: "0 0 6px" }}>
              &ldquo;{devotional.verse}&rdquo;
            </p>
            <div style={{ fontSize: 11, color: "#8a7540", textAlign: "right", letterSpacing: 1 }}>
              {devotional.reference}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Big count */}
          <div style={{
            fontSize: 36, color: "#e8c860",
            textShadow: "0 0 16px rgba(232,184,64,0.4)",
            marginBottom: 4, fontFamily: "Georgia, serif",
          }}>
            {stats.count}
            <span style={{ fontSize: 14, color: "#8a7540", marginLeft: 8, letterSpacing: 1, fontStyle: "italic" }}>
              {stats.count === 1 ? "dream this week" : "dreams this week"}
            </span>
          </div>

          {/* Stat rows */}
          <div style={{ marginTop: 14, marginBottom: 16, display: "grid", gap: 8 }}>
            {stats.topSymbol && (
              <div style={statRow}>
                <span style={statLabel}>Top symbol</span>
                <span style={statValue}>
                  {SYMBOL_EMOJI[stats.topSymbol.value] || "✦"} {stats.topSymbol.value}
                  <span style={{ color: "#6b5c30", marginLeft: 6, fontSize: 12 }}>
                    ({stats.topSymbol.count}{stats.topSymbol.count === 1 ? " mention" : " mentions"})
                  </span>
                </span>
              </div>
            )}
            {stats.topMood && (
              <div style={statRow}>
                <span style={statLabel}>Dominant mood</span>
                <span style={statValue}>{stats.topMood.value}</span>
              </div>
            )}
            {stats.longestDream && (
              <div style={statRow}>
                <span style={statLabel}>Longest dream</span>
                <span style={{ ...statValue, fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                  {stats.longestDream.title || "Untitled"}
                </span>
              </div>
            )}
          </div>

          {/* AI synthesis */}
          <div style={{
            marginBottom: 16, padding: "14px 16px",
            background: "rgba(10,4,30,0.5)",
            border: "1px solid rgba(144,102,212,0.20)",
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 10.5, letterSpacing: 2, color: "#8a7540", textTransform: "uppercase", marginBottom: 8 }}>
              The current beneath this week
            </div>
            {synthLoading && !synthesis ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b5c30", fontSize: 13 }}>
                <div style={{ display: "inline-flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: "#8a7540",
                      animation: `sr-dotFade 1.4s ease-in-out ${i * 0.18}s infinite`,
                      display: "inline-block",
                    }} />
                  ))}
                </div>
                <span style={{ fontStyle: "italic" }}>Reflecting on your week...</span>
              </div>
            ) : synthesis ? (
              <p style={{
                fontSize: 14, color: "#d4c490", lineHeight: 1.7, fontStyle: "italic",
                margin: 0, animation: "sr-blurIn 0.7s ease",
              }}>
                {synthesis}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "#8a7540", fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>
                A quiet week. Whatever it carried, it is now part of you.
              </p>
            )}
          </div>

          {/* Verse for the week */}
          <div style={{
            marginBottom: 18, padding: "14px 16px",
            background: "rgba(232,184,64,0.06)",
            border: "1px solid rgba(232,184,64,0.18)",
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 10.5, letterSpacing: 2, color: "#8a7540", textTransform: "uppercase", marginBottom: 8 }}>
              A verse for the week ahead
            </div>
            <p style={{ fontSize: 14, color: "#f0dfa0", fontStyle: "italic", lineHeight: 1.6, margin: "0 0 6px" }}>
              &ldquo;{devotional.verse}&rdquo;
            </p>
            <div style={{ fontSize: 11, color: "#8a7540", textAlign: "right", letterSpacing: 1 }}>
              {devotional.reference}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleOpen}
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #6847c0, #9066d4)",
            border: "none", color: "#fff",
            padding: "12px 18px", borderRadius: 12,
            fontSize: 13.5, fontFamily: "Georgia, serif",
            fontWeight: 600, letterSpacing: 0.5,
            cursor: "pointer", minHeight: 44,
            boxShadow: "0 0 18px rgba(144,102,212,0.25)",
          }}
        >
          {stats.count === 0 ? "Open journal" : "Open journal"}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss the recap"
          style={{
            background: "none", border: "1px solid rgba(200,160,30,0.18)",
            color: "#7a6840",
            padding: "12px 16px", borderRadius: 12, fontSize: 13,
            cursor: "pointer", fontFamily: "Georgia, serif",
            letterSpacing: 0.5, minHeight: 44, minWidth: 80,
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

// Local style helpers
const statRow = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 10px",
  background: "rgba(10,4,30,0.35)",
  border: "1px solid rgba(144,102,212,0.12)",
  borderRadius: 10,
};
const statLabel = {
  fontSize: 11, letterSpacing: 1.5, color: "#6b5c30", textTransform: "uppercase",
};
const statValue = {
  fontSize: 14, color: "#c8a040", fontFamily: "Georgia, serif",
};
