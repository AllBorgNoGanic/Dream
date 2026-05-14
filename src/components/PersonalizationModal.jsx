import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "../lib/supabase";

// ── Inject animation keyframes once ─────────────────────────────────────────
const STYLE_ID = "personalization-modal-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pm-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pm-contentIn { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    @keyframes pm-slide { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  `;
  document.head.appendChild(style);
}

// ── Options ──────────────────────────────────────────────────────────────────
const SLEEP_HOURS = ["Less than 5", "5 to 6 hours", "6 to 7 hours", "7 to 8 hours", "8+ hours"];
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
  { id: "loved-ones", label: "Loved Ones", emoji: "❤️" },
  { id: "travel", label: "Travel / Journey", emoji: "✈️" },
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "heights", label: "Heights / Climbing", emoji: "🧗" },
  { id: "trapped", label: "Trapped / Confined", emoji: "🔒" },
  { id: "religious", label: "Religious / Spiritual", emoji: "✨" },
  { id: "childhood", label: "Childhood Places", emoji: "🏠" },
  { id: "darkness", label: "Darkness / Shadows", emoji: "🌑" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function PersonalizationModal({ open, onOpenChange, userSettings, user, onSaved }) {
  const [step, setStep] = useState(0);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(0);
  const [stressLevel, setStressLevel] = useState("");
  const [mood, setMood] = useState("");
  const [themes, setThemes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Prefill from existing archetype_data when the modal opens
  useEffect(() => {
    if (!open) return;
    const ad = userSettings?.archetype_data || {};
    setStep(0);
    setSleepHours(ad?.sleep?.sleepHours || "");
    setSleepQuality(ad?.sleep?.sleepQuality || 0);
    setStressLevel(ad?.emotional?.stressLevel || "");
    setMood(ad?.emotional?.mood || "");
    setThemes(Array.isArray(ad?.recurringThemes) ? ad.recurringThemes : []);
    setSaveError("");
  }, [open, userSettings]);

  const toggleTheme = (id) => {
    setThemes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    const nextAd = {
      ...(userSettings?.archetype_data || {}),
      sleep: { sleepHours, sleepQuality },
      emotional: { stressLevel, mood },
      recurringThemes: themes,
    };

    const { data, error } = await supabase
      .from("user_settings")
      .update({ archetype_data: nextAd })
      .eq("user_id", user.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      setSaveError("Could not save. Please try again.");
      return;
    }
    if (data && onSaved) onSaved(data);
    onOpenChange(false);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)", zIndex: 200, animation: "pm-overlayIn 0.2s ease",
  };
  const content = {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    background: "linear-gradient(160deg, rgba(22,8,48,0.98) 0%, rgba(12,4,28,0.98) 100%)",
    border: "1px solid rgba(200,160,50,0.2)",
    borderRadius: 22, padding: "28px 24px 24px",
    maxWidth: 440, width: "92%", maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 70px rgba(0,0,0,0.7), 0 0 40px rgba(104,71,192,0.12)",
    animation: "pm-contentIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    zIndex: 201, outline: "none", fontFamily: "Georgia, serif",
  };
  const closeBtn = {
    position: "absolute", top: 14, right: 14,
    background: "none", border: "none", color: "#8a7540",
    fontSize: 22, cursor: "pointer", padding: 6, lineHeight: 1,
  };
  const backBtn = {
    background: "none", border: "1px solid rgba(200,160,30,0.25)",
    color: "#c8a040", padding: "10px 18px", borderRadius: 20, fontSize: 13,
    cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 40, letterSpacing: 0.5,
  };
  const primaryBtn = {
    flex: 1, padding: "14px 24px", border: "none", borderRadius: 14,
    background: "linear-gradient(135deg, #6847c0, #9066d4)",
    color: "#fff", fontSize: 15, fontFamily: "Georgia, serif", fontWeight: 600,
    cursor: "pointer", letterSpacing: 0.5, minHeight: 48,
    boxShadow: "0 0 20px rgba(144,102,212,0.3)",
  };
  const pill = (selected) => ({
    padding: "10px 16px", borderRadius: 24, fontSize: 13, minHeight: 40,
    fontFamily: "Georgia, serif", cursor: "pointer",
    background: selected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
    border: `1.5px solid ${selected ? "rgba(144,102,212,0.6)" : "rgba(255,255,255,0.1)"}`,
    color: selected ? "#d4b0ff" : "#c8a030",
    transition: "all 0.18s ease",
  });
  const screenTitle = {
    fontSize: 20, color: "#f5e4b0", margin: "0 0 6px",
    fontFamily: "Georgia, serif", fontWeight: 400,
  };
  const screenSub = {
    fontSize: 13, color: "#9a8050", marginBottom: 22, lineHeight: 1.6,
  };
  const labelStyle = {
    fontSize: 13, color: "#c8a030", marginBottom: 10, display: "block",
  };
  const dots = (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 22 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: i === step ? 22 : 6, height: 6, borderRadius: 3,
          background: i <= step ? "rgba(232,184,64,0.7)" : "rgba(232,184,64,0.18)",
          transition: "width 0.25s ease",
        }} />
      ))}
    </div>
  );

  const renderScreen = () => {
    switch (step) {
      // ── Screen 0: Sleep ────────────────────────────────────────────────────
      case 0:
        return (
          <div key="sleep" style={{ animation: "pm-slide 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌙</div>
            </div>
            <h2 style={screenTitle}>Your sleep</h2>
            <p style={screenSub}>
              Sleep shapes the texture of dreams. Sharing this helps us tailor the readings.
            </p>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>How many hours do you usually sleep?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SLEEP_HOURS.map((h) => (
                  <button key={h} onClick={() => setSleepHours(h)} style={pill(sleepHours === h)}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <label style={labelStyle}>How would you rate your sleep quality?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SLEEP_QUALITY.map((sq) => (
                  <button
                    key={sq.id}
                    onClick={() => setSleepQuality(sq.id)}
                    style={{ ...pill(sleepQuality === sq.id), display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span>{sq.emoji}</span>
                    <span>{sq.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Screen 1: Current state ────────────────────────────────────────────
      case 1:
        return (
          <div key="state" style={{ animation: "pm-slide 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💫</div>
            </div>
            <h2 style={screenTitle}>How have you been feeling lately?</h2>
            <p style={screenSub}>
              Dreams reflect what we're carrying. This stays private and helps the Shepherd meet you where you are.
            </p>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Current stress level</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STRESS_LEVELS.map((sl) => (
                  <button
                    key={sl.id}
                    onClick={() => setStressLevel(sl.id)}
                    style={{ ...pill(stressLevel === sl.id), display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span>{sl.emoji}</span>
                    <span>{sl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <label style={labelStyle}>Your usual mood lately</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    style={{ ...pill(mood === m.id), display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Screen 2: Recurring themes ─────────────────────────────────────────
      case 2:
        return (
          <div key="themes" style={{ animation: "pm-slide 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
            </div>
            <h2 style={screenTitle}>Recurring themes</h2>
            <p style={screenSub}>
              Pick any that show up in your dreams. We'll watch for them in your readings.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {DREAM_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTheme(t.id)}
                  style={{ ...pill(themes.includes(t.id)), display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#6b5c30", textAlign: "center", marginBottom: 12 }}>
              {themes.length} selected
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === 2;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlay} />
        <Dialog.Content style={content} aria-describedby={undefined}>
          <Dialog.Close asChild>
            <button style={closeBtn} aria-label="Close">×</button>
          </Dialog.Close>
          <Dialog.Title style={{
            position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
            overflow: "hidden", clip: "rect(0,0,0,0)", border: 0,
          }}>
            Personalize your interpretations
          </Dialog.Title>

          {dots}
          {renderScreen()}

          {saveError && (
            <div style={{ color: "#e06050", fontSize: 13, textAlign: "center", marginBottom: 10 }}>
              {saveError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} style={backBtn}>
                ← Back
              </button>
            )}
            {isLastStep ? (
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button onClick={() => setStep((s) => s + 1)} style={primaryBtn}>
                Continue
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
