import { useState } from "react";
import PersonalizationModal from "./PersonalizationModal";

// Pretty-print helpers for the personalized state summary
const STRESS_LABELS = { low: "Low", moderate: "Moderate", high: "High", "very-high": "Very High" };
const SLEEP_QUALITY_LABELS = { 1: "Very Poor", 2: "Poor", 3: "Fair", 4: "Good", 5: "Excellent" };
const MOOD_LABELS = {
  happy: "Happy", calm: "Calm", neutral: "Neutral",
  anxious: "Anxious", sad: "Sad", overwhelmed: "Overwhelmed",
};

export default function PersonalizationCard({ user, userSettings, onSettingsUpdate }) {
  const [open, setOpen] = useState(false);

  const ad = userSettings?.archetype_data || {};
  const hasSleep = !!(ad?.sleep?.sleepQuality || ad?.sleep?.sleepHours);
  const hasState = !!(ad?.emotional?.stressLevel || ad?.emotional?.mood);
  const hasThemes = Array.isArray(ad?.recurringThemes) && ad.recurringThemes.length > 0;
  const isPersonalized = hasSleep || hasState || hasThemes;

  const card = {
    background: "rgba(6,12,22,0.7)",
    border: "1px solid rgba(200,160,30,0.15)",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <>
      {!isPersonalized ? (
        <div style={{ ...card, border: "1px solid rgba(168,85,247,0.25)", background: "rgba(124,58,237,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
          <div style={{ fontSize: 16, color: "#f5e4b0", marginBottom: 6, fontFamily: "Georgia, serif" }}>
            Make it personal
          </div>
          <p style={{ fontSize: 13, color: "#9a8050", lineHeight: 1.65, margin: "0 0 16px", fontFamily: "Georgia, serif" }}>
            Share a few details about your sleep and what's on your mind. We'll use them to tailor each interpretation.
          </p>
          <div style={{ fontSize: 11, color: "#6b5c30", marginBottom: 14, letterSpacing: 0.5, fontFamily: "Georgia, serif" }}>
            Takes 60 seconds.
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "linear-gradient(135deg, #6847c0, #9066d4)",
              border: "none", color: "#fff",
              padding: "13px 24px", borderRadius: 14, minHeight: 46,
              fontSize: 14, cursor: "pointer",
              fontFamily: "Georgia, serif", fontWeight: 600,
              boxShadow: "0 0 18px rgba(168,85,247,0.25)",
              letterSpacing: 0.5,
            }}
          >
            Personalize my readings
          </button>
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#8a7540", textTransform: "uppercase" }}>
                Personalized
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              style={{
                background: "none", border: "1px solid rgba(200,160,30,0.25)",
                color: "#c8a040", padding: "7px 14px", borderRadius: 18, fontSize: 12,
                cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: 0.5,
              }}
            >
              Update
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, fontSize: 13, color: "#c8a040", fontFamily: "Georgia, serif" }}>
            {hasSleep && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#8a7540" }}>Sleep quality</span>
                <span>{SLEEP_QUALITY_LABELS[ad.sleep.sleepQuality] || "Set"}{ad?.sleep?.sleepHours ? ` · ${ad.sleep.sleepHours}` : ""}</span>
              </div>
            )}
            {hasState && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#8a7540" }}>Current state</span>
                <span>
                  {[STRESS_LABELS[ad?.emotional?.stressLevel], MOOD_LABELS[ad?.emotional?.mood]]
                    .filter(Boolean)
                    .join(" · ") || "Set"}
                </span>
              </div>
            )}
            {hasThemes && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#8a7540" }}>Recurring themes</span>
                <span style={{ textAlign: "right" }}>{ad.recurringThemes.length} selected</span>
              </div>
            )}
          </div>
        </div>
      )}

      <PersonalizationModal
        open={open}
        onOpenChange={setOpen}
        userSettings={userSettings}
        user={user}
        onSaved={onSettingsUpdate}
      />
    </>
  );
}
