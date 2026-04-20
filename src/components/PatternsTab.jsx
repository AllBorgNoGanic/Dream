import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import CalendarHeatmap from "./CalendarHeatmap";

// ── Dictionary (fallback when a dream has no AI-extracted themes) ───────────
const DREAM_DICTIONARY = {
  flying: { symbol: "✈️", meaning: "Freedom, ambition" },
  falling: { symbol: "⬇️", meaning: "Loss of control" },
  water: { symbol: "🌊", meaning: "Emotions, renewal, spiritual cleansing" },
  fire: { symbol: "🔥", meaning: "Purification, passion, the Holy Spirit" },
  death: { symbol: "💀", meaning: "Endings and new beginnings" },
  teeth: { symbol: "🦷", meaning: "Anxiety about appearance" },
  chase: { symbol: "🏃", meaning: "Avoidance" },
  house: { symbol: "🏠", meaning: "The self or psyche" },
  snake: { symbol: "🐍", meaning: "Hidden fears" },
  ocean: { symbol: "🌊", meaning: "The deep unknown" },
  forest: { symbol: "🌲", meaning: "Mystery and unknown" },
  school: { symbol: "🏫", meaning: "Learning, judgment" },
  baby: { symbol: "👶", meaning: "New beginnings" },
  car: { symbol: "🚗", meaning: "Control over direction" },
  mirror: { symbol: "🪞", meaning: "Self-reflection" },
  clock: { symbol: "⏰", meaning: "Anxiety about time" },
  dove: { symbol: "🕊️", meaning: "Peace, the Holy Spirit, new beginnings" },
  lamb: { symbol: "🐑", meaning: "Innocence, sacrifice, divine love" },
  bread: { symbol: "🍞", meaning: "Provision, communion, spiritual nourishment" },
  cross: { symbol: "✝️", meaning: "Sacrifice, redemption, hope" },
  light: { symbol: "💡", meaning: "Revelation, truth, divine presence" },
  angel: { symbol: "👼", meaning: "Divine messenger, guidance, protection" },
  mother: { symbol: "👩", meaning: "Nurture, origin, protection" },
  father: { symbol: "👨", meaning: "Authority, guidance, structure" },
  child: { symbol: "🧒", meaning: "Innocence, vulnerability, potential" },
  blood: { symbol: "🩸", meaning: "Vitality, sacrifice, life force" },
  hospital: { symbol: "🏥", meaning: "Healing, vulnerability, crisis" },
  wedding: { symbol: "💍", meaning: "Union, commitment, transition" },
  stairs: { symbol: "🪜", meaning: "Ascent, progress, struggle upward" },
  door: { symbol: "🚪", meaning: "Opportunity, transition, threshold" },
  key: { symbol: "🔑", meaning: "Access, secrets, solutions" },
  storm: { symbol: "⛈️", meaning: "Turmoil, cleansing, upheaval" },
  mountain: { symbol: "⛰️", meaning: "Challenge, achievement, perspective" },
  road: { symbol: "🛣️", meaning: "Life path, direction, journey" },
  bridge: { symbol: "🌉", meaning: "Transition, connection, decision" },
  garden: { symbol: "🌿", meaning: "Growth, peace, cultivation" },
  moon: { symbol: "🌙", meaning: "Intuition, cycles, the unconscious" },
  sun: { symbol: "☀️", meaning: "Vitality, clarity, the divine self" },
  bird: { symbol: "🐦", meaning: "Freedom, message, spirit" },
  wolf: { symbol: "🐺", meaning: "Instinct, the wild, threat or kinship" },
  ghost: { symbol: "👻", meaning: "The unresolved, what lingers" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RANGES = [
  { key: "7d", label: "7d", days: 7 },
  { key: "30d", label: "30d", days: 30 },
  { key: "90d", label: "90d", days: 90 },
  { key: "all", label: "All", days: null },
];

const SUBTABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "symbols", label: "Symbols", icon: "🔣" },
  { key: "wisdom", label: "Advice", icon: "🧭" },
];

const STOP_WORDS = new Set([
  "the","and","was","were","is","are","am","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "need","must","that","this","these","those","with","from","into","about","for",
  "but","not","you","all","her","his","him","she","he","they","them","their",
  "its","our","your","who","what","which","when","where","how","why","each",
  "every","both","few","more","most","other","some","such","than","too","very",
  "just","also","then","there","here","now","out","only","own","same","so",
  "because","until","while","after","before","during","between","through","over",
  "under","again","once","like","well","back","still","even","way","many","much",
  "really","already","around","another","came","come","going","went","got","get",
  "see","saw","know","knew","make","made","think","thought","take","took","want",
  "wanted","look","looked","felt","feel","try","tried","something","someone",
  "everything","anything","nothing","one","two","three","first","last","new",
  "old","big","small","long","little","large","great","good","bad","right",
  "left","next","don","didn","wasn","couldn","wouldn","doesn","isn","aren",
  "hadn","it","me","my","we","us",
]);

// ── Style atoms ─────────────────────────────────────────────────────────────
const fadeIn = `
@keyframes fadeInPatterns {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ptSheetOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ptSheetIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const cardBase = {
  background: "rgba(6,12,22,0.7)",
  border: "1px solid rgba(200,160,30,0.15)",
  borderRadius: 18,
  padding: "22px 24px",
  fontFamily: "Georgia, serif",
  animation: "fadeInPatterns 0.5s ease both",
};

const sectionTitle = {
  fontFamily: "Georgia, serif",
  fontSize: 20,
  color: "#f5e4b0",
  margin: "0 0 18px 0",
  letterSpacing: 0.3,
};

const subText = {
  fontFamily: "Georgia, serif",
  color: "#8a7540",
  fontSize: 13,
};

// ── Pure helpers ────────────────────────────────────────────────────────────
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDreamConcepts(dream) {
  // Returns Map of { conceptKey -> { display, emoji, meaning } }
  const out = new Map();

  // Prefer AI-extracted themes (richest signal, no false positives)
  if (Array.isArray(dream.generated_themes)) {
    for (const t of dream.generated_themes) {
      if (!t || !t.title) continue;
      const key = String(t.title).trim().toLowerCase();
      if (!key) continue;
      out.set(key, {
        display: t.title,
        emoji: t.symbol || "✦",
        meaning: t.guidance || "",
        source: "ai",
      });
    }
  }

  // Augment with dictionary scan via word-boundary regex
  const text = `${dream.title || ""} ${dream.content || ""}`.toLowerCase();
  for (const dictKey of Object.keys(DREAM_DICTIONARY)) {
    if (out.has(dictKey)) continue;
    const re = new RegExp(`\\b${escapeRegex(dictKey)}s?\\b`, "i");
    if (re.test(text)) {
      const entry = DREAM_DICTIONARY[dictKey];
      out.set(dictKey, {
        display: dictKey,
        emoji: entry.symbol,
        meaning: entry.meaning,
        source: "dict",
      });
    }
  }

  return out;
}

function computeStreak(dreams) {
  if (!dreams.length) return { current: 0, longest: 0 };
  const dates = new Set(
    dreams.map((d) => new Date(d.created_at).toISOString().slice(0, 10))
  );

  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  // Allow today to be empty without breaking streak (count from yesterday)
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longest = 0;
  let run = 0;
  const allSorted = [...dates].sort();
  for (let i = 0; i < allSorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(allSorted[i - 1]);
      const curr = new Date(allSorted[i]);
      const diff = (curr - prev) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
  }
  return { current, longest };
}

function computeRecallRate(dreams, days) {
  if (!days) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const dates = new Set(
    dreams
      .filter((d) => new Date(d.created_at) >= start)
      .map((d) => new Date(d.created_at).toISOString().slice(0, 10))
  );
  return Math.round((dates.size / days) * 100);
}

function moodLabelOf(mood) {
  if (!mood) return "";
  const parts = mood.split(" ");
  return parts.slice(1).join(" ") || mood;
}

// ── Sub-components ──────────────────────────────────────────────────────────
function RangeChips({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 12,
        flexWrap: "wrap",
      }}
    >
      {RANGES.map((r) => {
        const active = value === r.key;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${active ? "#e8b840" : "rgba(200,160,30,0.2)"}`,
              background: active ? "rgba(232,184,64,0.15)" : "transparent",
              color: active ? "#f5e4b0" : "#8a7540",
              fontFamily: "Georgia, serif",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

function SubTabBar({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        background: "rgba(6,12,22,0.6)",
        border: "1px solid rgba(200,160,30,0.12)",
        borderRadius: 14,
        marginBottom: 18,
      }}
    >
      {SUBTABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: 10,
              border: "none",
              background: active ? "rgba(232,184,64,0.18)" : "transparent",
              color: active ? "#f5e4b0" : "#8a7540",
              fontFamily: "Georgia, serif",
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, maxValue, color, emoji, delta }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#f5e4b0", fontFamily: "Georgia, serif", fontSize: 14 }}>
          {emoji ? `${emoji} ` : ""}{label}
        </span>
        <span style={{ color: "#e8b840", fontFamily: "Georgia, serif", fontSize: 13 }}>
          {value} ({pct.toFixed(0)}%)
          {delta !== undefined && delta !== 0 && (
            <span style={{
              marginLeft: 6,
              fontSize: 11,
              color: delta > 0 ? "#7dd87d" : "#d87d7d",
            }}>
              {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
            </span>
          )}
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "rgba(200,160,30,0.1)", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 5,
          background: color || "linear-gradient(90deg, #6847c0, #9066d4)",
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, delay }) {
  return (
    <div style={{
      ...cardBase,
      padding: "16px 14px",
      textAlign: "center",
      animation: `fadeInPatterns 0.5s ease ${delay || 0}s both`,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 20,
        color: "#f5e4b0",
        fontWeight: "bold",
        marginBottom: 2,
        wordBreak: "break-word",
      }}>
        {value}
      </div>
      <div style={{ ...subText, fontSize: 11 }}>{label}</div>
      {sub && (
        <div style={{ ...subText, fontSize: 10, marginTop: 3, color: "#a07c3a" }}>{sub}</div>
      )}
    </div>
  );
}

function DrillDownSheet({ open, onOpenChange, title, emoji, meaning, dreams, onViewInJournal }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          animation: "ptSheetOverlay 0.2s ease",
          zIndex: 100,
        }} />
        <Dialog.Content style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "82vh",
          background: "linear-gradient(180deg, #0a0820, #04001a)",
          borderTop: "1px solid rgba(200,160,30,0.25)",
          borderRadius: "20px 20px 0 0",
          padding: "16px 20px calc(20px + env(safe-area-inset-bottom)) 20px",
          animation: "ptSheetIn 0.25s ease",
          zIndex: 101,
          overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            width: 40,
            height: 4,
            background: "rgba(200,160,30,0.3)",
            borderRadius: 2,
            margin: "0 auto 14px auto",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{emoji}</span>
            <Dialog.Title style={{
              margin: 0,
              fontFamily: "Georgia, serif",
              fontSize: 20,
              color: "#f5e4b0",
              textTransform: "capitalize",
            }}>
              {title}
            </Dialog.Title>
          </div>
          {meaning && (
            <Dialog.Description style={{ ...subText, marginBottom: 14, lineHeight: 1.5 }}>
              {meaning}
            </Dialog.Description>
          )}
          <div style={{ ...subText, fontSize: 12, marginBottom: 10 }}>
            {dreams.length} {dreams.length === 1 ? "dream" : "dreams"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {dreams.slice(0, 12).map((d) => (
              <div key={d.id} style={{
                padding: "10px 12px",
                background: "rgba(200,160,30,0.05)",
                border: "1px solid rgba(200,160,30,0.1)",
                borderRadius: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <div style={{ color: "#f5e4b0", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.title || "Untitled dream"}
                  </div>
                  <div style={{ color: "#8a7540", fontSize: 11, fontFamily: "Georgia, serif", flexShrink: 0 }}>
                    {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                {d.content && (
                  <div style={{ ...subText, fontSize: 12, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {d.content}
                  </div>
                )}
              </div>
            ))}
            {dreams.length > 12 && (
              <div style={{ ...subText, fontSize: 12, textAlign: "center", padding: 8 }}>
                +{dreams.length - 12} more
              </div>
            )}
          </div>
          {onViewInJournal && (
            <button onClick={() => { onViewInJournal(title); onOpenChange(false); }} style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(232,184,64,0.15)",
              border: "1px solid rgba(232,184,64,0.4)",
              borderRadius: 12,
              color: "#f5e4b0",
              fontFamily: "Georgia, serif",
              fontSize: 15,
              cursor: "pointer",
              marginBottom: 8,
            }}>
              View all in Journal
            </button>
          )}
          <Dialog.Close asChild>
            <button style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "1px solid rgba(200,160,30,0.2)",
              borderRadius: 12,
              color: "#8a7540",
              fontFamily: "Georgia, serif",
              fontSize: 14,
              cursor: "pointer",
            }}>
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function PatternsTab({ dreams, onNavigateJournal }) {
  const [range, setRange] = useState("30d");
  const [subtab, setSubtab] = useState("overview");
  const [drilldown, setDrilldown] = useState(null);

  // Sort once for stability
  const sortedDreams = useMemo(
    () => [...(dreams || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [dreams]
  );

  // Filter by selected range
  const rangedDreams = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    if (!r || !r.days) return sortedDreams;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (r.days - 1));
    return sortedDreams.filter((d) => new Date(d.created_at) >= cutoff);
  }, [sortedDreams, range]);

  // Previous-period dreams (for delta comparisons)
  const prevPeriodDreams = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    if (!r || !r.days) return [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - r.days);
    const start = new Date(end);
    start.setDate(start.getDate() - (r.days - 1));
    return sortedDreams.filter((d) => {
      const t = new Date(d.created_at);
      return t >= start && t <= end;
    });
  }, [sortedDreams, range]);

  // Concept (symbol/theme) extraction from rangedDreams
  const conceptStats = useMemo(() => {
    // Map: conceptKey -> { display, emoji, meaning, dreamIds: Set, moodCounts: {} }
    const map = new Map();
    rangedDreams.forEach((d) => {
      const concepts = getDreamConcepts(d);
      for (const [key, info] of concepts) {
        if (!map.has(key)) {
          map.set(key, {
            key,
            display: info.display,
            emoji: info.emoji,
            meaning: info.meaning,
            source: info.source,
            dreamIds: new Set(),
            moodCounts: {},
          });
        }
        const entry = map.get(key);
        entry.dreamIds.add(d.id);
        if (d.mood) entry.moodCounts[d.mood] = (entry.moodCounts[d.mood] || 0) + 1;
      }
    });
    return [...map.values()].map((c) => ({
      ...c,
      count: c.dreamIds.size,
    })).sort((a, b) => b.count - a.count);
  }, [rangedDreams]);

  // Aggregate stats
  const aggregates = useMemo(() => {
    const moodCounts = {};
    const themeCounts = {};
    const characterCounts = {};
    const dayOfWeekCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    let totalSleep = 0;
    let sleepCount = 0;
    const sleepBuckets = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    rangedDreams.forEach((d) => {
      if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
      if (d.theme) themeCounts[d.theme] = (themeCounts[d.theme] || 0) + 1;
      const day = DAYS[new Date(d.created_at).getDay()];
      dayOfWeekCounts[day]++;
      const sq = d.sleep_quality || d.sleepQuality;
      if (sq && sq >= 1 && sq <= 5) {
        totalSleep += sq;
        sleepCount++;
        if (d.mood) sleepBuckets[sq].push(d.mood);
      }
      // Characters
      const chars = d.characters;
      if (Array.isArray(chars)) {
        chars.forEach((c) => {
          const name = String(c).trim().toLowerCase();
          if (name) characterCounts[name] = (characterCounts[name] || 0) + 1;
        });
      } else if (typeof chars === "string" && chars.trim()) {
        chars.split(/[,;]+/).map((c) => c.trim().toLowerCase()).filter(Boolean).forEach((n) => {
          characterCounts[n] = (characterCounts[n] || 0) + 1;
        });
      }
    });

    return {
      moodCounts,
      themeCounts,
      characterCounts,
      dayOfWeekCounts,
      avgSleep: sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : null,
      sleepBuckets,
      sleepCount,
    };
  }, [rangedDreams]);

  // Previous-period mood counts (for deltas)
  const prevMoodCounts = useMemo(() => {
    const m = {};
    prevPeriodDreams.forEach((d) => {
      if (d.mood) m[d.mood] = (m[d.mood] || 0) + 1;
    });
    return m;
  }, [prevPeriodDreams]);

  // Derived
  const streaks = useMemo(() => computeStreak(sortedDreams), [sortedDreams]);
  const recallRate = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    return computeRecallRate(sortedDreams, r?.days || 30);
  }, [sortedDreams, range]);

  // Pattern insights with sample-size floors
  const insights = useMemo(() => {
    const out = [];
    if (rangedDreams.length < 10) return out;
    conceptStats.forEach((c) => {
      if (c.count < 3) return;
      Object.entries(c.moodCounts).forEach(([mood, count]) => {
        const overallRate = (aggregates.moodCounts[mood] || 0) / rangedDreams.length;
        const conceptRate = count / c.count;
        if (overallRate > 0 && conceptRate > overallRate * 1.5 && count >= 2) {
          out.push({
            symbol: c.display,
            emoji: c.emoji,
            mood: moodLabelOf(mood),
            ratio: (conceptRate / overallRate).toFixed(1),
            count,
          });
        }
      });
    });
    return out.sort((a, b) => b.ratio - a.ratio);
  }, [rangedDreams, conceptStats, aggregates.moodCounts]);

  // Ongoing guidance (cluster AI guidance entries by concept)
  const guidanceData = useMemo(() => {
    const interpreted = rangedDreams.filter((d) => d.generated_themes?.length);
    if (!interpreted.length) return { insights: [], totalEntries: 0 };

    const allGuidance = [];
    interpreted.forEach((d) => {
      (d.generated_themes || []).forEach((t) => {
        if (t.guidance) {
          allGuidance.push({
            guidance: t.guidance,
            symbol: t.symbol,
            dreamTitle: d.title,
            date: d.created_at,
          });
        }
      });
    });
    if (!allGuidance.length) return { insights: [], totalEntries: 0 };

    const conceptClusters = [
      { label: "Boundaries & Self-Protection", keywords: ["boundar","protect","say no","guard","shield","safe space","limit","defend","stand firm","assert"] },
      { label: "Letting Go & Surrender", keywords: ["let go","letting go","release","surrender","accept","move on","forgive","detach","leave behind","shed"] },
      { label: "Trust & Intuition", keywords: ["trust","instinct","intuiti","inner voice","gut feel","listen to your","inner wisdom","sense","faith in"] },
      { label: "Growth & Transformation", keywords: ["grow","transform","evolv","change","bloom","emerge","develop","progress","becom","unfold","journey"] },
      { label: "Connection & Relationships", keywords: ["connect","relationship","loved one","bond","communit","together","companion","friend","family","support"] },
      { label: "Fear & Courage", keywords: ["fear","courage","brave","afraid","confront","face your","overcome","strength","bold","resilien"] },
      { label: "Self-Discovery & Identity", keywords: ["self","identity","discover","who you","authenti","true nature","inner","purpose","calling","reflect"] },
      { label: "Rest & Renewal", keywords: ["rest","heal","renew","recharge","peace","calm","still","pause","nurtur","recover","restore","slow down"] },
      { label: "Ambition & Direction", keywords: ["goal","path","direction","ambiti","pursue","aspir","dream","vision","plan","focus","commit","determin"] },
      { label: "Communication & Expression", keywords: ["speak","voice","express","communicat","tell","share your","open up","honest","articulat","listen"] },
      { label: "Control & Freedom", keywords: ["control","freedom","free","independen","autonm","choic","liberat","empower","agency","unchain"] },
      { label: "Loss & Grief", keywords: ["loss","grief","mourn","miss","gone","absence","hollow","ache","sorrow","goodbye"] },
    ];

    const clusterMatches = {};
    allGuidance.forEach((g) => {
      const text = g.guidance.toLowerCase();
      conceptClusters.forEach((cl) => {
        if (cl.keywords.some((kw) => text.includes(kw))) {
          if (!clusterMatches[cl.label]) clusterMatches[cl.label] = { entries: [], latestDate: null };
          clusterMatches[cl.label].entries.push(g);
          const d = new Date(g.date);
          if (!clusterMatches[cl.label].latestDate || d > clusterMatches[cl.label].latestDate) {
            clusterMatches[cl.label].latestDate = d;
          }
        }
      });
    });
    const clusteredTexts = new Set();
    Object.values(clusterMatches).forEach((c) => c.entries.forEach((e) => clusteredTexts.add(e.guidance)));
    const unclustered = allGuidance.filter((g) => !clusteredTexts.has(g.guidance));
    if (unclustered.length > 0) {
      clusterMatches["Other Wisdom"] = {
        entries: unclustered,
        latestDate: new Date(Math.max(...unclustered.map((u) => new Date(u.date)))),
      };
    }
    const now = Date.now();
    const insights = Object.entries(clusterMatches)
      .map(([label, data]) => {
        const count = data.entries.length;
        const days = (now - data.latestDate.getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0.3, 1 - days / 90);
        const score = count * recencyBoost;
        const sorted = [...data.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        const symbols = [...new Set(data.entries.map((e) => e.symbol).filter(Boolean))].slice(0, 3);
        let strength;
        if (count >= 5) strength = "Strong pattern";
        else if (count >= 3) strength = "Growing pattern";
        else if (count >= 2) strength = "Emerging";
        else strength = "New insight";
        return {
          label, count, score, strength, symbols,
          representative: sorted[0].guidance,
          latestDate: data.latestDate,
          dreamTitles: [...new Set(sorted.slice(0, 3).map((e) => e.dreamTitle).filter(Boolean))],
        };
      })
      .filter((i) => i.label !== "Other Wisdom" || i.count >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return { insights, totalEntries: allGuidance.length };
  }, [rangedDreams]);

  // Dream signs (recurring words for lucid coaching)
  const dreamSigns = useMemo(() => {
    const wordCounts = {};
    rangedDreams.forEach((d) => {
      const blob = `${d.description || ""} ${d.content || ""}`;
      if (!blob.trim()) return;
      const words = blob
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
      const unique = new Set(words);
      unique.forEach((w) => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });
    return Object.entries(wordCounts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [rangedDreams]);

  // Sleep correlation (positive vs not)
  const sleepCorrelation = useMemo(() => {
    const positiveSet = new Set(["happy","joy","calm","peaceful","grateful","loved","content","hopeful","blessed","inspired"]);
    let highSleep = { total: 0, positive: 0 };
    let lowSleep = { total: 0, positive: 0 };
    Object.entries(aggregates.sleepBuckets).forEach(([q, moods]) => {
      const isHigh = Number(q) >= 4;
      moods.forEach((m) => {
        const moodWord = (moodLabelOf(m) || m).toLowerCase().split(" ")[0];
        const positive = positiveSet.has(moodWord);
        const bucket = isHigh ? highSleep : lowSleep;
        bucket.total++;
        if (positive) bucket.positive++;
      });
    });
    const highPct = highSleep.total ? Math.round((highSleep.positive / highSleep.total) * 100) : null;
    const lowPct = lowSleep.total ? Math.round((lowSleep.positive / lowSleep.total) * 100) : null;
    let ratio = null;
    if (highPct !== null && lowPct !== null && lowPct > 0) {
      ratio = (highPct / lowPct).toFixed(1);
    }
    return { highSleep, lowSleep, highPct, lowPct, ratio };
  }, [aggregates.sleepBuckets]);

  // Header derived
  const topMood = Object.entries(aggregates.moodCounts).sort((a, b) => b[1] - a[1])[0];
  const totalSymbols = conceptStats.reduce((acc, c) => acc + c.count, 0);
  const maxDayCount = Math.max(...Object.values(aggregates.dayOfWeekCounts), 1);

  const moodColors = [
    "linear-gradient(90deg, #6847c0, #9066d4)",
    "linear-gradient(90deg, #5a3aa0, #7b5cb8)",
    "linear-gradient(90deg, #4c2e90, #6847c0)",
    "linear-gradient(90deg, #3e2280, #5a3aa0)",
    "linear-gradient(90deg, #301870, #4c2e90)",
    "linear-gradient(90deg, #281060, #3e2280)",
    "linear-gradient(90deg, #462090, #8050c0)",
    "linear-gradient(90deg, #5530a8, #9066d4)",
  ];

  const handleViewInJournal = (query) => {
    if (onNavigateJournal) onNavigateJournal({ search: query });
  };

  const openSymbolDrilldown = (concept) => {
    const matchingDreams = rangedDreams.filter((d) => concept.dreamIds.has(d.id));
    setDrilldown({
      title: concept.display,
      emoji: concept.emoji,
      meaning: concept.meaning,
      dreams: matchingDreams,
    });
  };

  const openCharacterDrilldown = (name, count) => {
    const matchingDreams = rangedDreams.filter((d) => {
      const c = d.characters;
      if (Array.isArray(c)) return c.some((x) => String(x).trim().toLowerCase() === name);
      if (typeof c === "string") return c.toLowerCase().split(/[,;]+/).map((s) => s.trim()).includes(name);
      return false;
    });
    setDrilldown({
      title: name,
      emoji: "👤",
      meaning: `${count} ${count === 1 ? "appearance" : "appearances"} in your dreams`,
      dreams: matchingDreams,
    });
  };

  // Empty state
  if (!sortedDreams.length) {
    return (
      <div style={{ ...cardBase, textAlign: "center", padding: 48 }}>
        <style>{fadeIn}</style>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
        <div style={{ ...sectionTitle, marginBottom: 8 }}>No dreams yet</div>
        <div style={{ ...subText, fontSize: 15 }}>
          Start recording your dreams to see patterns and insights emerge.
        </div>
      </div>
    );
  }

  // Sparse-range state (range filter wiped everything)
  const sparseRange = rangedDreams.length === 0 && range !== "all";

  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      <style>{fadeIn}</style>

      <RangeChips value={range} onChange={setRange} />
      <SubTabBar value={subtab} onChange={setSubtab} />

      {sparseRange ? (
        <div style={{ ...cardBase, textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🌙</div>
          <div style={{ ...sectionTitle, marginBottom: 6, fontSize: 17 }}>
            No dreams in this range
          </div>
          <div style={{ ...subText, fontSize: 14 }}>
            Try a wider time range to see your patterns.
          </div>
        </div>
      ) : subtab === "overview" ? (
        <>
          {/* Hero stat row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 22,
          }}>
            <StatCard icon="📖" label="Dreams" value={rangedDreams.length} delay={0} />
            <StatCard
              icon="🔥"
              label="Current streak"
              value={`${streaks.current}d`}
              sub={streaks.longest > streaks.current ? `Longest ${streaks.longest}d` : null}
              delay={0.05}
            />
            <StatCard
              icon={topMood ? topMood[0].split(" ")[0] : "💭"}
              label="Top mood"
              value={topMood ? moodLabelOf(topMood[0]) : "N/A"}
              sub={topMood ? `${Math.round((topMood[1] / rangedDreams.length) * 100)}% of dreams` : null}
              delay={0.1}
            />
            {recallRate !== null && (
              <StatCard
                icon="📅"
                label="Recall rate"
                value={`${recallRate}%`}
                sub={`days with a dream`}
                delay={0.15}
              />
            )}
            <StatCard icon="🔣" label="Symbols" value={totalSymbols} delay={0.2} />
            {aggregates.avgSleep && (
              <StatCard icon="😴" label="Avg sleep" value={aggregates.avgSleep} sub="of 5 stars" delay={0.25} />
            )}
          </div>

          {/* Mood distribution with delta */}
          <div style={{ ...cardBase, marginBottom: 22 }}>
            <h3 style={sectionTitle}>Mood distribution</h3>
            {Object.keys(aggregates.moodCounts).length === 0 ? (
              <div style={subText}>No mood data recorded in this range.</div>
            ) : (
              Object.entries(aggregates.moodCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count], i) => (
                  <HorizontalBar
                    key={mood}
                    label={moodLabelOf(mood)}
                    emoji={mood.split(" ")[0]}
                    value={count}
                    maxValue={rangedDreams.length}
                    color={moodColors[i % moodColors.length]}
                    delta={range !== "all" ? count - (prevMoodCounts[mood] || 0) : undefined}
                  />
                ))
            )}
          </div>

          {/* Theme distribution */}
          {Object.keys(aggregates.themeCounts).length > 0 && (
            <div style={{ ...cardBase, marginBottom: 22 }}>
              <h3 style={sectionTitle}>Theme distribution</h3>
              {Object.entries(aggregates.themeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([theme, count], i) => (
                  <HorizontalBar
                    key={theme}
                    label={theme}
                    value={count}
                    maxValue={rangedDreams.length}
                    color={moodColors[i % moodColors.length]}
                  />
                ))}
            </div>
          )}

          {/* Sleep correlation (flipped framing) */}
          {sleepCorrelation.ratio && (
            <div style={{ ...cardBase, marginBottom: 22 }}>
              <h3 style={sectionTitle}>Sleep & mood</h3>
              <div style={{
                background: "rgba(144,102,212,0.1)",
                border: "1px solid rgba(144,102,212,0.25)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 12,
                color: "#f5e4b0",
                fontSize: 15,
                lineHeight: 1.5,
              }}>
                When you sleep well (4 to 5 stars), your dreams are{" "}
                <strong style={{ color: "#e8b840" }}>{sleepCorrelation.ratio}x more positive</strong>{" "}
                than after poor sleep.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{
                  padding: "12px 14px",
                  background: "rgba(125,216,125,0.08)",
                  border: "1px solid rgba(125,216,125,0.2)",
                  borderRadius: 10,
                }}>
                  <div style={{ ...subText, fontSize: 11, marginBottom: 4 }}>Good sleep</div>
                  <div style={{ color: "#f5e4b0", fontSize: 22, fontWeight: 600 }}>{sleepCorrelation.highPct ?? 0}%</div>
                  <div style={{ ...subText, fontSize: 11 }}>positive moods</div>
                </div>
                <div style={{
                  padding: "12px 14px",
                  background: "rgba(216,125,125,0.08)",
                  border: "1px solid rgba(216,125,125,0.2)",
                  borderRadius: 10,
                }}>
                  <div style={{ ...subText, fontSize: 11, marginBottom: 4 }}>Poor sleep</div>
                  <div style={{ color: "#f5e4b0", fontSize: 22, fontWeight: 600 }}>{sleepCorrelation.lowPct ?? 0}%</div>
                  <div style={{ ...subText, fontSize: 11 }}>positive moods</div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly day pattern */}
          <div style={{ ...cardBase, marginBottom: 22 }}>
            <h3 style={sectionTitle}>Day of week</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {DAYS.map((day) => {
                const count = aggregates.dayOfWeekCounts[day];
                const height = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
                return (
                  <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ height: 80, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                      <div style={{
                        width: "70%",
                        height: `${Math.max(height, 4)}%`,
                        background: "linear-gradient(180deg, #9066d4, #5a3aa0)",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "height 0.5s ease",
                        minHeight: 4,
                      }} />
                    </div>
                    <div style={{ color: "#e8b840", fontFamily: "Georgia, serif", fontSize: 12 }}>{count}</div>
                    <div style={{ color: "#6b5c30", fontFamily: "Georgia, serif", fontSize: 11 }}>{day}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar heatmap (always all-time, ignores range) */}
          <CalendarHeatmap dreams={sortedDreams} />
        </>
      ) : subtab === "symbols" ? (
        <>
          {/* Top symbols - tappable */}
          <div style={{ ...cardBase, marginBottom: 22 }}>
            <h3 style={sectionTitle}>Top recurring symbols</h3>
            {conceptStats.length === 0 ? (
              <div style={subText}>No symbols detected yet. Record more dreams or interpret existing ones for richer insights.</div>
            ) : (
              <>
                <div style={{ ...subText, marginBottom: 12, fontSize: 12 }}>
                  Tap any symbol to see the dreams that inspired it.
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {conceptStats.slice(0, 12).map((c) => (
                    <button
                      key={c.key}
                      onClick={() => openSymbolDrilldown(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "10px 14px",
                        background: "rgba(200,160,30,0.06)",
                        borderRadius: 12,
                        border: "1px solid rgba(200,160,30,0.1)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(200,160,30,0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(200,160,30,0.06)"}
                    >
                      <span style={{ fontSize: 24 }}>{c.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: "#f5e4b0",
                          fontFamily: "Georgia, serif",
                          fontSize: 15,
                          textTransform: "capitalize",
                          fontWeight: 600,
                        }}>
                          {c.display}
                          {c.source === "ai" && (
                            <span style={{ marginLeft: 8, fontSize: 10, color: "#9066d4", letterSpacing: 0.5 }}>AI</span>
                          )}
                        </div>
                        {c.meaning && (
                          <div style={{ ...subText, fontSize: 12, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {c.meaning}
                          </div>
                        )}
                      </div>
                      <div style={{
                        background: "rgba(200,160,30,0.15)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        color: "#e8b840",
                        fontFamily: "Georgia, serif",
                        fontSize: 13,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {c.count}x
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Characters - tappable */}
          {Object.keys(aggregates.characterCounts).length > 0 && (
            <div style={{ ...cardBase, marginBottom: 22 }}>
              <h3 style={sectionTitle}>Dream characters</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(aggregates.characterCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([name, count], i) => (
                    <button
                      key={name}
                      onClick={() => openCharacterDrilldown(name, count)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 14px",
                        background: "rgba(200,160,30,0.06)",
                        borderRadius: 10,
                        border: "1px solid rgba(200,160,30,0.08)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "linear-gradient(135deg, #6847c0, #9066d4)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, color: "#fff", fontFamily: "Georgia, serif",
                          fontWeight: "bold", flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{
                          color: "#f5e4b0", fontFamily: "Georgia, serif",
                          fontSize: 14, textTransform: "capitalize",
                        }}>{name}</span>
                      </div>
                      <span style={{ color: "#e8b840", fontFamily: "Georgia, serif", fontSize: 13 }}>
                        {count} {count === 1 ? "dream" : "dreams"}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Pattern insights with sample-size guard */}
          <div style={{ ...cardBase, marginBottom: 22 }}>
            <h3 style={sectionTitle}>Symbol & mood patterns</h3>
            {rangedDreams.length < 10 ? (
              <div style={{
                padding: "14px 16px",
                background: "rgba(200,160,30,0.05)",
                border: "1px dashed rgba(200,160,30,0.2)",
                borderRadius: 12,
                color: "#8a7540",
                fontFamily: "Georgia, serif",
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                <div style={{ marginBottom: 6 }}>
                  Need at least 10 dreams in this range to surface reliable correlations.
                </div>
                <div style={{ fontSize: 12, color: "#6b5c30" }}>
                  Currently {rangedDreams.length} of 10. Keep recording!
                </div>
              </div>
            ) : insights.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {insights.slice(0, 8).map((ins, i) => (
                  <div key={i} style={{
                    padding: "12px 16px",
                    background: "rgba(200,160,30,0.05)",
                    borderRadius: 12,
                    border: "1px solid rgba(200,160,30,0.12)",
                    color: "#f5e4b0",
                    fontFamily: "Georgia, serif",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}>
                    <span style={{ marginRight: 8 }}>💡</span>
                    You dream of {ins.emoji} <strong>{ins.symbol}</strong> {ins.ratio}x more often when feeling <strong>{ins.mood}</strong>.
                  </div>
                ))}
              </div>
            ) : (
              <div style={subText}>
                No strong correlations yet between your symbols and moods.
              </div>
            )}
          </div>
        </>
      ) : subtab === "wisdom" ? (
        <>
          {/* Ongoing guidance - the hero */}
          <div style={{ ...cardBase, marginBottom: 22 }}>
            <h3 style={sectionTitle}>🧭 Ongoing guidance</h3>
            {guidanceData.insights.length > 0 ? (
              <div>
                <div style={{ ...subText, marginBottom: 16, fontSize: 13 }}>
                  The strongest threads of wisdom emerging from your dreams, evolving as you record more.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {guidanceData.insights.map((insight, i) => {
                    const strengthColor =
                      insight.strength === "Strong pattern" ? "#e8b840" :
                      insight.strength === "Growing pattern" ? "#c8a040" :
                      insight.strength === "Emerging" ? "#9066d4" : "#7a6040";
                    const strengthBg =
                      insight.strength === "Strong pattern" ? "rgba(232,184,64,0.15)" :
                      insight.strength === "Growing pattern" ? "rgba(200,160,64,0.12)" :
                      insight.strength === "Emerging" ? "rgba(144,102,212,0.12)" : "rgba(122,96,64,0.1)";
                    return (
                      <div key={i} style={{
                        background: "rgba(30,12,60,0.4)",
                        border: "1px solid rgba(200,160,30,0.12)",
                        borderRadius: 14,
                        padding: "16px 18px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                          {insight.symbols.length > 0 && (
                            <span style={{ fontSize: 20 }}>{insight.symbols.join(" ")}</span>
                          )}
                          <span style={{
                            fontSize: 15, color: "#f5e4b0", fontFamily: "Georgia, serif",
                            fontWeight: 600, flex: 1, minWidth: 0,
                          }}>{insight.label}</span>
                          <span style={{
                            fontSize: 11, color: strengthColor, background: strengthBg,
                            padding: "3px 10px", borderRadius: 20, fontFamily: "Georgia, serif",
                            fontWeight: 600, border: `1px solid ${strengthColor}33`,
                          }}>{insight.strength}</span>
                        </div>
                        <div style={{
                          fontSize: 14, color: "#c8b080", lineHeight: 1.6,
                          fontFamily: "Georgia, serif", marginBottom: 10, fontStyle: "italic",
                        }}>
                          "{insight.representative}"
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 12, fontSize: 11,
                          color: "#7a6040", fontFamily: "Georgia, serif", flexWrap: "wrap",
                        }}>
                          <span>{insight.count} {insight.count === 1 ? "dream" : "dreams"} reinforce this</span>
                          <span style={{ color: "#5a4a30" }}>•</span>
                          <span>Last seen {new Date(insight.latestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          {insight.dreamTitles.length > 0 && (
                            <>
                              <span style={{ color: "#5a4a30" }}>•</span>
                              <span style={{ fontStyle: "italic", color: "#8a7550" }}>
                                {insight.dreamTitles.slice(0, 2).join(", ")}
                                {insight.dreamTitles.length > 2 ? "..." : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  marginTop: 14, fontSize: 11, color: "#5a4a30",
                  textAlign: "center", fontFamily: "Georgia, serif", fontStyle: "italic",
                }}>
                  Synthesized from {guidanceData.totalEntries} guidance {guidanceData.totalEntries === 1 ? "entry" : "entries"}
                </div>
              </div>
            ) : (
              <div style={subText}>
                Interpret your dreams to see personalized guidance accumulate here. Each reading adds wisdom to your journey.
              </div>
            )}
          </div>

          {/* Lucid coaching card */}
          <div style={{ ...cardBase, marginBottom: 22 }}>
            <h3 style={sectionTitle}>🌙 Tonight's reality checks</h3>
            <p style={{ ...subText, marginBottom: 18, lineHeight: 1.6 }}>
              These signs appear repeatedly in your dreams. When you notice them while awake, pause and ask: am I dreaming?
            </p>
            {dreamSigns.length > 0 ? (
              <>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}>
                  {dreamSigns.slice(0, 5).map(([word, count]) => (
                    <div key={word} style={{
                      padding: "10px 14px",
                      background: "linear-gradient(135deg, rgba(144,102,212,0.18), rgba(232,184,64,0.1))",
                      border: "1px solid rgba(144,102,212,0.3)",
                      borderRadius: 999,
                      color: "#f5e4b0",
                      fontFamily: "Georgia, serif",
                      fontSize: 14,
                      textTransform: "capitalize",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      {word}
                      <span style={{ color: "#9066d4", fontSize: 11 }}>{count}x</span>
                    </div>
                  ))}
                </div>
                {dreamSigns.length > 5 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dreamSigns.slice(5).map(([word, count]) => (
                      <div key={word} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 12px",
                        color: "#a08c5a",
                        fontFamily: "Georgia, serif",
                        fontSize: 13,
                        textTransform: "capitalize",
                      }}>
                        <span>{word}</span>
                        <span style={{ color: "#6b5c30" }}>{count} dreams</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={subText}>
                Record more dreams to detect recurring signs. At least 2 appearances of a word are needed.
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Drilldown sheet */}
      {drilldown && (
        <DrillDownSheet
          open={!!drilldown}
          onOpenChange={(o) => !o && setDrilldown(null)}
          title={drilldown.title}
          emoji={drilldown.emoji}
          meaning={drilldown.meaning}
          dreams={drilldown.dreams}
          onViewInJournal={onNavigateJournal ? handleViewInJournal : null}
        />
      )}
    </div>
  );
}
