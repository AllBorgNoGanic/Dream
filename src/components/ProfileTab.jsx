import { useState } from "react";
import { supabase } from "../lib/supabase";

const ARCHETYPES = {
  Explorer: {
    emoji: "🧭",
    color: "#60c8ff",
    border: "rgba(96,200,255,0.3)",
    bg: "rgba(96,200,255,0.08)",
    traits: ["Adventurous", "Curious", "Boundary-pushing"],
    description: "Your dreams are journeys into the unknown. You seek freedom and new experiences, often dreaming of vast landscapes, exploration, and discovery.",
  },
  Empath: {
    emoji: "💜",
    color: "#e060ff",
    border: "rgba(224,96,255,0.3)",
    bg: "rgba(224,96,255,0.08)",
    traits: ["Sensitive", "Connected", "Compassionate"],
    description: "Your dreams are rich with emotion and relationships. You feel deeply, often dreaming of people you love and moments of profound human connection.",
  },
  Oracle: {
    emoji: "🔮",
    color: "#c490ff",
    border: "rgba(196,144,255,0.3)",
    bg: "rgba(196,144,255,0.08)",
    traits: ["Intuitive", "Visionary", "Symbolic"],
    description: "Your dreams carry deep symbolic meaning. You are drawn to the mystical, often receiving prophetic imagery and profound insights from your subconscious.",
  },
  Warrior: {
    emoji: "⚡",
    color: "#ffca60",
    border: "rgba(255,202,96,0.3)",
    bg: "rgba(255,202,96,0.08)",
    traits: ["Determined", "Courageous", "Purposeful"],
    description: "Your dreams are battles and triumphs. You face challenges head-on, often dreaming of conflict, victory, and proving your strength to the world.",
  },
};

export default function ProfileTab({ user, userSettings, onSettingsUpdate, dreams, onUpgrade, onRetakeQuiz }) {
  const [displayName, setDisplayName] = useState(userSettings?.display_name || "");
  const [wakeTime, setWakeTime] = useState(userSettings?.wake_time || "07:00");
  const [reminderEnabled, setReminderEnabled] = useState(userSettings?.reminder_enabled || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const archetype = userSettings?.archetype;
  const archetypeData = ARCHETYPES[archetype];

  const lucidCount = dreams.filter(d => d.is_lucid).length;
  const avgSleep = dreams.filter(d => d.sleep_hours).length > 0
    ? (dreams.filter(d => d.sleep_hours).reduce((s, d) => s + Number(d.sleep_hours), 0) / dreams.filter(d => d.sleep_hours).length).toFixed(1)
    : null;

  const handleSave = async () => {
    setSaving(true);
    const { data } = await supabase
      .from("user_settings")
      .update({ display_name: displayName.trim() || null, wake_time: wakeTime, reminder_enabled: reminderEnabled })
      .eq("user_id", user.id)
      .select()
      .single();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (data && onSettingsUpdate) onSettingsUpdate(data);
  };

  const card = {
    background: "rgba(20,8,50,0.7)",
    border: "1px solid rgba(160,100,255,0.15)",
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Archetype card */}
      {archetype && archetypeData && (
        <div style={{ ...card, border: `1px solid ${archetypeData.border}`, background: archetypeData.bg, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 48 }}>{archetypeData.emoji}</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#7060aa", textTransform: "uppercase", marginBottom: 4 }}>Your Dream Archetype</div>
              <div style={{ fontSize: 26, color: archetypeData.color, fontWeight: 400 }}>{archetype}</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#b090d0", lineHeight: 1.7, margin: "0 0 12px" }}>{archetypeData.description}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {archetypeData.traits.map(t => (
              <span key={t} style={{
                background: "rgba(160,100,255,0.12)", border: `1px solid ${archetypeData.border}`,
                borderRadius: 20, padding: "4px 12px", fontSize: 12, color: archetypeData.color
              }}>{t}</span>
            ))}
          </div>
          <button onClick={onRetakeQuiz} style={{
            marginTop: 16, background: "none", border: "1px solid rgba(160,100,255,0.25)",
            color: "#8070aa", padding: "7px 16px", borderRadius: 20, fontSize: 11,
            cursor: "pointer", letterSpacing: 0.5
          }}>
            Retake Quiz
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Dreams", value: dreams.length, icon: "🌙" },
          { label: "Lucid Dreams", value: lucidCount, icon: "✨" },
          { label: "Avg Sleep", value: avgSleep ? `${avgSleep}h` : "—", icon: "💤" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.12)", borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, color: "#c490ff" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6050a0", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pro status */}
      <div style={{ ...card, border: userSettings?.is_pro ? "1px solid rgba(200,160,50,0.3)" : "1px solid rgba(160,100,255,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, color: userSettings?.is_pro ? "#e8c840" : "#e8d5ff", marginBottom: 4 }}>
              {userSettings?.is_pro ? "✦ Dreamscape Pro" : "Free Plan"}
            </div>
            <div style={{ fontSize: 12, color: "#6050a0" }}>
              {userSettings?.is_pro
                ? "Unlimited AI interpretations · All features"
                : `${Math.max(0, 5 - (userSettings?.interpretation_count || 0))} free interpretations remaining`}
            </div>
          </div>
          {!userSettings?.is_pro && (
            <button onClick={onUpgrade} style={{
              background: "linear-gradient(135deg, #c8a020, #e8c840)",
              border: "none", color: "#1a1000", padding: "9px 18px", borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5,
              whiteSpace: "nowrap"
            }}>
              Upgrade $5.99/mo
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      <div style={card}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#8060cc", textTransform: "uppercase", marginBottom: 20 }}>Settings</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#c490ff", marginBottom: 8 }}>Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Anonymous Dreamer"
            style={{
              width: "100%", background: "rgba(20,5,40,0.9)", border: "1px solid rgba(160,100,255,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#e8d5ff", fontSize: 14,
              outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#c490ff", marginBottom: 8 }}>Default Wake Time</label>
          <input
            type="time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
            style={{
              background: "rgba(20,5,40,0.9)", border: "1px solid rgba(160,100,255,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#e8d5ff", fontSize: 14,
              outline: "none", colorScheme: "dark"
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#c490ff" }}>Dream Reminders</label>
          <div
            onClick={() => setReminderEnabled(r => !r)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s",
              background: reminderEnabled ? "linear-gradient(135deg, #6020cc, #9040ee)" : "rgba(255,255,255,0.1)",
              position: "relative"
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: reminderEnabled ? 22 : 3, width: 18, height: 18,
              borderRadius: "50%", background: "white", transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)"
            }} />
          </div>
          <span style={{ fontSize: 12, color: "#6050a0" }}>{reminderEnabled ? "On" : "Off"}</span>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? "rgba(80,200,120,0.2)" : "linear-gradient(135deg, #6020cc, #9040ee)",
          border: saved ? "1px solid rgba(80,200,120,0.4)" : "none",
          color: saved ? "#80e0a0" : "white", padding: "11px 28px", borderRadius: 40,
          fontSize: 13, cursor: saving ? "not-allowed" : "pointer", letterSpacing: 0.5,
          transition: "all 0.3s"
        }}>
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Account */}
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#5040a0", marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 13, color: "#8070aa" }}>{user.email}</div>
      </div>
    </div>
  );
}
