import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ShareButton from "./ShareButton";
import { ARCHETYPES } from "../constants/archetypes";

const FREE_INTERPRETATIONS = 5;
const MAX_SHARE_BONUS = 3;

export default function ProfileTab({ user, userSettings, onSettingsUpdate, dreams, onUpgrade, onRetakeQuiz }) {
  const [displayName, setDisplayName] = useState(userSettings?.display_name || "");
  const [age, setAge] = useState(userSettings?.age || "");
  const [wakeTime, setWakeTime] = useState(userSettings?.wake_time || "07:00");
  const [reminderEnabled, setReminderEnabled] = useState(userSettings?.reminder_enabled || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifSupported] = useState(() => "Notification" in window && "serviceWorker" in navigator);
  const [notifPermission, setNotifPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "denied"
  );

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
      .update({ display_name: displayName.trim() || null, age: age ? parseInt(age) : null, wake_time: wakeTime, reminder_enabled: reminderEnabled })
      .eq("user_id", user.id)
      .select()
      .single();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (data && onSettingsUpdate) onSettingsUpdate(data);
  };

  const card = {
    background: "rgba(6,12,22,0.7)",
    border: "1px solid rgba(200,160,30,0.15)",
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Archetype card */}
      {userSettings?.onboarding_completed ? (
        archetype && archetypeData ? (
          <div style={{ ...card, border: `1px solid ${archetypeData.border}`, background: archetypeData.bg, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 48 }}>{archetypeData.emoji}</div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#8a7540", textTransform: "uppercase", marginBottom: 4 }}>Your Dream Archetype</div>
                <div style={{ fontSize: 26, color: archetypeData.color, fontWeight: 400 }}>{archetype}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#c8a040", lineHeight: 1.7, margin: "0 0 12px" }}>{archetypeData.description}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {archetypeData.traits.map(t => (
                <span key={t} style={{
                  background: "rgba(200,160,30,0.12)", border: `1px solid ${archetypeData.border}`,
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, color: archetypeData.color
                }}>{t}</span>
              ))}
            </div>
            <button onClick={onRetakeQuiz} style={{
              marginTop: 16, background: "none", border: "1px solid rgba(200,160,30,0.25)",
              color: "#7a6a40", padding: "7px 16px", borderRadius: 20, fontSize: 11,
              cursor: "pointer", letterSpacing: 0.5
            }}>
              Retake Quiz
            </button>
          </div>
        ) : (
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#9a8050" }}>Dream profile completed</div>
              <button onClick={onRetakeQuiz} style={{
                background: "none", border: "1px solid rgba(200,160,30,0.25)",
                color: "#7a6a40", padding: "7px 16px", borderRadius: 20, fontSize: 11,
                cursor: "pointer", letterSpacing: 0.5
              }}>
                Retake Quiz
              </button>
            </div>
          </div>
        )
      ) : (
        <div style={{ ...card, border: "1px solid rgba(168,85,247,0.25)", background: "rgba(124,58,237,0.06)", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🐑</div>
          <div style={{ fontSize: 16, color: "#f5e4b0", marginBottom: 6 }}>Complete Your Dream Profile</div>
          <p style={{ fontSize: 13, color: "#9a8050", lineHeight: 1.6, margin: "0 0 16px" }}>
            Take the dream quiz to unlock personalized insights and more accurate interpretations.
          </p>
          <button onClick={onRetakeQuiz} style={{
            background: "linear-gradient(135deg, #6847c0, #9066d4)",
            border: "none", color: "#fff", padding: "10px 24px", borderRadius: 14,
            fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600,
            boxShadow: "0 0 20px rgba(168,85,247,0.3)",
          }}>
            Take the Quiz
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
          <div key={s.label} style={{ background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.12)", borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, color: "#e8b840" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b5c30", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pro status */}
      <div style={{ ...card, border: userSettings?.is_pro ? "1px solid rgba(200,160,50,0.3)" : "1px solid rgba(200,160,30,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, color: userSettings?.is_pro ? "#e8c840" : "#f5e4b0", marginBottom: 4 }}>
              {userSettings?.is_pro ? "✦ Dream Shepherd Pro" : "Free Plan"}
            </div>
            <div style={{ fontSize: 12, color: "#6b5c30" }}>
              {userSettings?.is_pro
                ? "Unlimited AI interpretations · All features"
                : `${Math.max(0, FREE_INTERPRETATIONS + Math.min(userSettings?.share_bonus_count ?? 0, MAX_SHARE_BONUS) - (userSettings?.interpretation_count || 0))} free interpretations remaining`}
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

      {/* Share and Earn */}
      {!userSettings?.is_pro && (
        <ShareButton
          userId={user?.id}
          shareBonusCount={userSettings?.share_bonus_count ?? 0}
          maxBonus={MAX_SHARE_BONUS}
          variant="card"
          onBonusEarned={(newCount) => {
            onSettingsUpdate((s) => ({ ...s, share_bonus_count: newCount }));
          }}
        />
      )}

      {/* Settings */}
      <div style={card}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#8060cc", textTransform: "uppercase", marginBottom: 20 }}>Settings</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#e8b840", marginBottom: 8 }}>Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Anonymous Dreamer"
            style={{
              width: "100%", background: "rgba(5,10,18,0.9)", border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#f5e4b0", fontSize: 14,
              outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#e8b840", marginBottom: 8 }}>Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="Your age"
            min="1"
            max="120"
            style={{
              width: 100, background: "rgba(5,10,18,0.9)", border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#f5e4b0", fontSize: 14,
              outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#e8b840", marginBottom: 8 }}>Default Wake Time</label>
          <input
            type="time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
            style={{
              background: "rgba(5,10,18,0.9)", border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#f5e4b0", fontSize: 14,
              outline: "none", colorScheme: "dark"
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <label style={{ fontSize: 13, color: "#e8b840" }}>Dream Reminders</label>
            <div
              onClick={async () => {
                if (!reminderEnabled && notifSupported) {
                  const perm = await Notification.requestPermission();
                  setNotifPermission(perm);
                  if (perm !== "granted") return;
                }
                setReminderEnabled(r => !r);
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s",
                background: reminderEnabled ? "linear-gradient(135deg, #7a5200, #c89020)" : "rgba(255,255,255,0.1)",
                position: "relative"
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: reminderEnabled ? 22 : 3, width: 18, height: 18,
                borderRadius: "50%", background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)"
              }} />
            </div>
            <span style={{ fontSize: 12, color: "#6b5c30" }}>{reminderEnabled ? "On" : "Off"}</span>
          </div>
          {!notifSupported && (
            <div style={{ fontSize: 11, color: "#6b5c30", marginLeft: 0 }}>
              Notifications are not supported in this browser.
            </div>
          )}
          {notifSupported && notifPermission === "denied" && (
            <div style={{ fontSize: 11, color: "#c87040", marginLeft: 0 }}>
              Notifications are blocked. Enable them in your browser settings.
            </div>
          )}
          {reminderEnabled && notifPermission === "granted" && (
            <div style={{ fontSize: 11, color: "#7a9050", marginLeft: 0 }}>
              You'll get a reminder at your wake time to record your dreams.
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? "rgba(80,200,120,0.2)" : "linear-gradient(135deg, #7a5200, #c89020)",
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
        <div style={{ fontSize: 13, color: "#7a6a40" }}>{user.email}</div>
      </div>
    </div>
  );
}
