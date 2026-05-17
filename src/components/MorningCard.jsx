import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getTodaysDevotional, localDateKey } from "../constants/devotionals";
import { getCurrentSeason } from "../utils/liturgicalSeason";

// ─────────────────────────────────────────────────────────────────────────────
// MorningCard
// Daily devotional card that appears at the top of the Journal tab. Shows
// the day's verse, a short reflection, an optional "yesterday's dream"
// callback, and a "Record today's dream" CTA. Dismissable. Reappears once
// per local day.
// ─────────────────────────────────────────────────────────────────────────────

// Inject keyframes once
const STYLE_ID = "morning-card-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes mc-enterIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes mc-collapseOut {
      0% { opacity: 1; max-height: 600px; margin-bottom: 16px; }
      100% { opacity: 0; max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
    }
    @keyframes mc-shimmerLine { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  `;
  document.head.appendChild(style);
}

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatHeaderDate(d) {
  return `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`;
}

export default function MorningCard({ user, userSettings, dreams, onSettingsUpdate, onRecordDream, now: nowOverride }) {
  const [dismissing, setDismissing] = useState(false);
  const today = useMemo(() => nowOverride || new Date(), [nowOverride]);
  const todayKey = useMemo(() => localDateKey(today), [today]);
  const devotional = useMemo(() => getTodaysDevotional(today), [today]);
  const season = useMemo(() => getCurrentSeason(today), [today]);

  // Find the user's most recent dream from yesterday (or earlier if no
  // yesterday entry exists, so the card can still surface "your last dream").
  const yesterdayDream = useMemo(() => {
    if (!Array.isArray(dreams) || dreams.length === 0) return null;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = localDateKey(yesterday);
    // Sort newest first
    const sorted = [...dreams].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    // Prefer a dream actually dated yesterday
    const yest = sorted.find((d) => localDateKey(new Date(d.created_at)) === yesterdayKey);
    if (yest) return yest;
    // Fall back to most recent dream if no yesterday entry
    return sorted[0];
  }, [dreams, today]);

  // Hide if already seen today, or while the dismiss animation is playing
  // out (we render with the collapse keyframe and then unmount via parent).
  const alreadySeen = userSettings?.morning_card_last_seen === todayKey;
  if (alreadySeen && !dismissing) return null;

  const markSeen = async () => {
    if (!user) return;
    // Optimistic local update
    if (onSettingsUpdate) {
      onSettingsUpdate((prev) => ({ ...prev, morning_card_last_seen: todayKey }));
    }
    // Persist
    await supabase
      .from("user_settings")
      .update({ morning_card_last_seen: todayKey })
      .eq("user_id", user.id);
  };

  const handleDismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    // Wait for the collapse animation, then persist + unmount via re-render.
    setTimeout(() => {
      markSeen();
    }, 380);
  };

  const handleRecord = () => {
    markSeen();
    if (onRecordDream) onRecordDream();
  };

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(160deg, rgba(18,8,38,0.92) 0%, rgba(10,4,24,0.92) 100%)",
      border: "1px solid rgba(200,160,30,0.22)",
      borderRadius: 18,
      padding: "20px 18px 18px",
      marginBottom: 16,
      overflow: "hidden",
      fontFamily: "Georgia, serif",
      animation: dismissing
        ? "mc-collapseOut 0.4s ease forwards"
        : "mc-enterIn 0.45s ease-out",
      boxShadow: "0 0 30px rgba(104,71,192,0.10)",
    }}>
      {/* Top shimmer bar — tinted by the current liturgical season */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${season.borderColor.replace("0.30", "0.65").replace("0.32", "0.65").replace("0.35", "0.65").replace("0.40", "0.65")}, transparent)`,
        backgroundSize: "300% 100%",
        animation: "mc-shimmerLine 6s ease-in-out infinite",
      }} />

      {/* Header row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14, color: "#e8b840", textShadow: "0 0 10px rgba(232,184,64,0.4)" }}>✦</span>
          <span style={{
            fontSize: 10, letterSpacing: 3, color: "#8a7540", textTransform: "uppercase",
          }}>
            Morning with the Shepherd
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#6b5c30", letterSpacing: 0.5 }}>
          {formatHeaderDate(today)}
        </div>
      </div>

      {/* Liturgical season badge — hidden during Ordinary Time to avoid noise */}
      {season.key !== "ordinary" && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 12,
          background: season.softColor,
          border: `1px solid ${season.borderColor}`,
          marginBottom: 14,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: season.color, display: "inline-block" }} />
          <span style={{ fontSize: 10, letterSpacing: 1.5, color: season.color, textTransform: "uppercase" }}>
            {season.name}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>·</span>
          <span style={{ fontSize: 10, color: "#6b5c30", fontStyle: "italic" }}>
            {season.blurb}
          </span>
        </div>
      )}

      {/* Verse */}
      <p style={{
        fontSize: 15, color: "#f0dfa0", lineHeight: 1.65,
        margin: "0 0 6px", fontStyle: "italic",
      }}>
        &ldquo;{devotional.verse}&rdquo;
      </p>
      <div style={{
        fontSize: 11, color: "#8a7540", letterSpacing: 1.5,
        marginBottom: 14, textAlign: "right",
      }}>
        {devotional.reference}
      </div>

      {/* Reflection */}
      <p style={{
        fontSize: 14, color: "#c8a870", lineHeight: 1.7,
        margin: "0 0 18px",
      }}>
        {devotional.reflection}
      </p>

      {/* Yesterday's dream callback */}
      {yesterdayDream && (
        <div style={{
          marginBottom: 18, padding: "10px 12px",
          background: "rgba(10,4,30,0.45)",
          border: "1px solid rgba(144,102,212,0.18)",
          borderRadius: 12,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>🌙</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#6b5c30", textTransform: "uppercase", marginBottom: 2 }}>
              Last dream
            </div>
            <div style={{
              fontSize: 13, color: "#c8a040",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontStyle: "italic",
            }}>
              {yesterdayDream.title || "Untitled"}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={handleRecord}
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
          Record today's dream
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss today's reflection"
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
