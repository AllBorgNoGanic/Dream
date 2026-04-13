import { useState, useRef, useEffect } from "react";
import DreamSwitch from "./DreamSwitch";
// checkFields available if needed for future moderation

const MOODS = [
  { label: "Magical", emoji: "\u2728" },
  { label: "Frightening", emoji: "\ud83d\ude28" },
  { label: "Peaceful", emoji: "\ud83d\ude0c" },
  { label: "Confusing", emoji: "\ud83d\ude15" },
  { label: "Sad", emoji: "\ud83d\ude22" },
  { label: "Exciting", emoji: "\ud83e\udd29" },
  { label: "Neutral", emoji: "\ud83d\ude36" },
  { label: "Nostalgic", emoji: "\ud83d\udcad" },
];

const THEMES = [
  "Adventure",
  "Romance",
  "Mystery",
  "Prophetic",
  "Nightmare",
  "Spiritual",
  "Peaceful",
  "Surreal",
];

const pulseKeyframes = `
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 4px 2px rgba(255,60,60,0.4); }
  50% { box-shadow: 0 0 12px 6px rgba(255,60,60,0.8); }
}
`;

const styles = {
  wrapper: {
    background: "rgba(8,16,28,0.8)",
    border: "1px solid rgba(200,160,30,0.3)",
    borderRadius: 20,
    padding: "20px 16px",
    fontFamily: "Georgia, serif",
    color: "#f5e4b0",
    maxWidth: 680,
    margin: "0 auto",
  },
  heading: {
    margin: "0 0 24px 0",
    fontSize: 22,
    color: "#e8b840",
    textAlign: "center",
    fontFamily: "Georgia, serif",
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    color: "#e8b840",
    fontFamily: "Georgia, serif",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(5,10,18,0.9)",
    border: "1px solid rgba(200,160,30,0.3)",
    borderRadius: 10,
    color: "#f5e4b0",
    fontSize: 16,
    fontFamily: "Georgia, serif",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(5,10,18,0.9)",
    border: "1px solid rgba(200,160,30,0.3)",
    borderRadius: 10,
    color: "#f5e4b0",
    fontSize: 16,
    fontFamily: "Georgia, serif",
    outline: "none",
    minHeight: 120,
    resize: "vertical",
    boxSizing: "border-box",
  },
  fieldGroup: {
    marginBottom: 20,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(120,60,220,0.3)",
    border: "1px solid rgba(200,160,30,0.4)",
    borderRadius: 20,
    padding: "8px 14px",
    fontSize: 14,
    color: "#f5e4b0",
    fontFamily: "Georgia, serif",
  },
  chipX: {
    cursor: "pointer",
    color: "#e8b840",
    fontWeight: "bold",
    fontSize: 14,
    background: "none",
    border: "none",
    padding: "4px 8px",
    minWidth: 28,
    minHeight: 28,
    lineHeight: 1,
    fontFamily: "Georgia, serif",
  },
  selectorBtn: (active) => ({
    padding: "10px 16px",
    borderRadius: 12,
    border: active
      ? "1px solid rgba(200,150,255,0.7)"
      : "1px solid rgba(200,160,30,0.25)",
    background: active
      ? "linear-gradient(135deg, rgba(120,60,220,0.6), rgba(80,30,180,0.6))"
      : "rgba(8,16,28,0.5)",
    color: active ? "#fff" : "#8a7540",
    cursor: "pointer",
    fontSize: 14,
    minHeight: 44,
    fontFamily: "Georgia, serif",
    transition: "all 0.2s",
  }),
  row: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  toggleTrack: (on) => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: on
      ? "linear-gradient(135deg,#6847c0,#9066d4)"
      : "rgba(60,30,100,0.6)",
    border: "1px solid rgba(200,160,30,0.3)",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  }),
  toggleKnob: (on) => ({
    position: "absolute",
    top: 2,
    left: on ? 22 : 2,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#f5e4b0",
    transition: "left 0.2s",
  }),
  slider: {
    width: "100%",
    accentColor: "#9066d4",
    cursor: "pointer",
  },
  starBtn: (active) => ({
    background: "none",
    border: "none",
    fontSize: 26,
    cursor: "pointer",
    color: active ? "#f5c842" : "#8a7540",
    transition: "color 0.15s",
    padding: "4px 6px",
    minWidth: 44,
    minHeight: 44,
  }),
  submitBtn: {
    width: "100%",
    padding: "16px 0",
    minHeight: 48,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #6847c0, #9066d4, #c084fc)",
    color: "#fff",
    fontSize: 17,
    fontFamily: "Georgia, serif",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: 0.5,
    transition: "opacity 0.2s",
  },
  voiceBtn: (recording) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: 10,
    border: recording
      ? "1px solid rgba(255,80,80,0.5)"
      : "1px solid rgba(200,160,30,0.3)",
    background: recording ? "rgba(180,30,30,0.3)" : "rgba(8,16,28,0.5)",
    color: recording ? "#ff8888" : "#e8b840",
    cursor: "pointer",
    fontSize: 14,
    minHeight: 44,
    fontFamily: "Georgia, serif",
    transition: "all 0.2s",
    position: "relative",
  }),
  pulseIndicator: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#ff4444",
    animation: "pulse-red 1s ease-in-out infinite",
    flexShrink: 0,
  },
  timeInput: {
    padding: "12px 14px",
    background: "rgba(5,10,18,0.9)",
    border: "1px solid rgba(200,160,30,0.3)",
    borderRadius: 10,
    color: "#f5e4b0",
    fontSize: 16,
    fontFamily: "Georgia, serif",
    outline: "none",
  },
};

const LUCID_TRIGGERS = [
  "Reality check",
  "Dream sign",
  "Spontaneous",
  "MILD technique",
  "WILD technique",
  "Sleep paralysis",
  "False awakening",
  "Nightmare",
];

const MIN_DESCRIPTION_LENGTH = 30;

export default function DreamForm({
  form,
  setForm,
  onSubmit,
  loading,
  canInterpret,
  isPro,
  freeRemaining,
}) {
  const [tagInput, setTagInput] = useState("");
  const [charInput, setCharInput] = useState("");
  const [signInput, setSignInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const recognitionRef = useRef(null);
  const styleInjectedRef = useRef(false);

  useEffect(() => {
    if (!styleInjectedRef.current) {
      const styleEl = document.createElement("style");
      styleEl.textContent = pulseKeyframes;
      document.head.appendChild(styleEl);
      styleInjectedRef.current = true;
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, []);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Voice-to-text
  const toggleRecording = () => {
    if (recording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setRecording(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setForm((prev) => ({
          ...prev,
          description: prev.description
            ? prev.description + " " + transcript
            : transcript,
        }));
      }
    };

    recognition.onerror = () => {
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  // Chip helpers
  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      if (!form.tags.includes(tag)) {
        update("tags", [...form.tags, tag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    update(
      "tags",
      form.tags.filter((t) => t !== tag)
    );
  };

  const addChar = (e) => {
    if (e.key === "Enter" && charInput.trim()) {
      e.preventDefault();
      const ch = charInput.trim();
      if (!form.characters.includes(ch)) {
        update("characters", [...form.characters, ch]);
      }
      setCharInput("");
    }
  };

  const removeChar = (ch) => {
    update(
      "characters",
      form.characters.filter((c) => c !== ch)
    );
  };

  const addSign = (e) => {
    if (e.key === "Enter" && signInput.trim()) {
      e.preventDefault();
      const sign = signInput.trim();
      if (!(form.dream_signs || []).includes(sign)) {
        update("dream_signs", [...(form.dream_signs || []), sign]);
      }
      setSignInput("");
    }
  };

  const removeSign = (sign) => {
    update(
      "dream_signs",
      (form.dream_signs || []).filter((s) => s !== sign)
    );
  };

  const descLength = (form.description || "").trim().length;
  const descTooShort = descLength > 0 && descLength < MIN_DESCRIPTION_LENGTH;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (descTooShort) return;
    setModerationError("");
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} style={styles.wrapper}>
      <h2 style={styles.heading}>Record Your Dream</h2>

      {/* Title */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Title</label>
        <input
          type="text"
          placeholder="Name your dream..."
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          style={styles.input}
          required
        />
      </div>

      {/* Description */}
      <div style={styles.fieldGroup}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label style={{ ...styles.label, marginBottom: 0 }}>
            Description
          </label>
          <button
            type="button"
            onClick={toggleRecording}
            style={styles.voiceBtn(recording)}
          >
            {recording && <span style={styles.pulseIndicator} />}
            {recording ? "Stop Recording" : "Voice Input"}
          </button>
        </div>
        <textarea
          placeholder="Describe your dream in detail..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          style={{
            ...styles.textarea,
            borderColor: descTooShort ? "rgba(255,180,60,0.4)" : "rgba(200,160,30,0.3)",
          }}
          required
        />
        {descTooShort && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 6,
            fontSize: 12,
            color: "#c89040",
            fontFamily: "Georgia, serif",
          }}>
            <span>Add more detail for a richer interpretation</span>
            <span style={{ color: "#6b5c30" }}>
              {descLength}/{MIN_DESCRIPTION_LENGTH}
            </span>
          </div>
        )}
      </div>

      {/* Mood */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Mood</label>
        <div style={{ ...styles.chipRow, gap: 8 }}>
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.label}
              onClick={() => update("mood", m.label)}
              style={styles.selectorBtn(form.mood === m.label)}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Theme</label>
        <div style={{ ...styles.chipRow, gap: 8 }}>
          {THEMES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => update("theme", t)}
              style={styles.selectorBtn(form.theme === t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Tags</label>
        <input
          type="text"
          placeholder="Type a tag and press Enter..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          style={styles.input}
        />
        {form.tags.length > 0 && (
          <div style={styles.chipRow}>
            {form.tags.map((tag) => (
              <span key={tag} style={styles.chip}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={styles.chipX}
                  aria-label={`Remove tag ${tag}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Characters */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Characters</label>
        <input
          type="text"
          placeholder="Type a character name and press Enter..."
          value={charInput}
          onChange={(e) => setCharInput(e.target.value)}
          onKeyDown={addChar}
          style={styles.input}
        />
        {form.characters.length > 0 && (
          <div style={styles.chipRow}>
            {form.characters.map((ch) => (
              <span key={ch} style={styles.chip}>
                {ch}
                <button
                  type="button"
                  onClick={() => removeChar(ch)}
                  style={styles.chipX}
                  aria-label={`Remove character ${ch}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lucid Dream */}
      <div style={styles.fieldGroup}>
        <div style={styles.toggleRow}>
          <DreamSwitch
            checked={form.is_lucid}
            onCheckedChange={(val) => update("is_lucid", val)}
          />
          <label style={{ ...styles.label, marginBottom: 0 }}>
            Lucid Dream
          </label>
        </div>
        {form.is_lucid && (
          <div style={{
            marginTop: 12,
            padding: "16px 18px",
            background: "rgba(100,60,200,0.08)",
            border: "1px solid rgba(140,100,220,0.2)",
            borderRadius: 14,
          }}>
            {/* Lucidity Level */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...styles.label, fontSize: 13, marginBottom: 4 }}>
                Lucidity Level: {form.lucidity_level ?? 0} / 5
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={form.lucidity_level ?? 0}
                onChange={(e) =>
                  update("lucidity_level", parseInt(e.target.value))
                }
                style={styles.slider}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b5c30", marginTop: 2 }}>
                <span>Barely aware</span>
                <span>Full control</span>
              </div>
            </div>

            {/* What triggered lucidity */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...styles.label, fontSize: 13 }}>What triggered your lucidity?</label>
              <div style={{ ...styles.chipRow, gap: 6 }}>
                {LUCID_TRIGGERS.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => update("lucid_trigger", form.lucid_trigger === t ? "" : t)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 10,
                      border: form.lucid_trigger === t
                        ? "1px solid rgba(140,100,220,0.6)"
                        : "1px solid rgba(200,160,30,0.2)",
                      background: form.lucid_trigger === t
                        ? "rgba(120,60,220,0.4)"
                        : "rgba(8,16,28,0.5)",
                      color: form.lucid_trigger === t ? "#d4b8ff" : "#8a7540",
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "Georgia, serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* What did you do once lucid */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...styles.label, fontSize: 13 }}>What did you do once lucid?</label>
              <input
                type="text"
                placeholder="Flew over mountains, talked to a character..."
                value={form.lucid_activity || ""}
                onChange={(e) => update("lucid_activity", e.target.value)}
                style={styles.input}
              />
            </div>

            {/* How long did lucidity last */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...styles.label, fontSize: 13 }}>How long did lucidity last?</label>
              <div style={{ ...styles.chipRow, gap: 6 }}>
                {["A few seconds", "Under a minute", "1-5 minutes", "5+ minutes", "Entire dream"].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => update("lucid_duration", form.lucid_duration === d ? "" : d)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 10,
                      border: form.lucid_duration === d
                        ? "1px solid rgba(140,100,220,0.6)"
                        : "1px solid rgba(200,160,30,0.2)",
                      background: form.lucid_duration === d
                        ? "rgba(120,60,220,0.4)"
                        : "rgba(8,16,28,0.5)",
                      color: form.lucid_duration === d ? "#d4b8ff" : "#8a7540",
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "Georgia, serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Dream Signs */}
            <div>
              <label style={{ ...styles.label, fontSize: 13 }}>Dream Signs</label>
              <div style={{ fontSize: 11, color: "#6b5c30", marginBottom: 6, lineHeight: 1.5 }}>
                Recurring elements that signal you're dreaming (e.g., flying, being at school, a specific person)
              </div>
              <input
                type="text"
                placeholder="Type a dream sign and press Enter..."
                value={signInput}
                onChange={(e) => setSignInput(e.target.value)}
                onKeyDown={addSign}
                style={styles.input}
              />
              {(form.dream_signs || []).length > 0 && (
                <div style={{ ...styles.chipRow, marginTop: 8 }}>
                  {form.dream_signs.map((sign) => (
                    <span key={sign} style={{
                      ...styles.chip,
                      background: "rgba(140,100,220,0.25)",
                      border: "1px solid rgba(140,100,220,0.35)",
                    }}>
                      {sign}
                      <button
                        type="button"
                        onClick={() => removeSign(sign)}
                        style={styles.chipX}
                        aria-label={`Remove dream sign ${sign}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sleep Tracking */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Sleep Tracking</label>
        <div style={{ ...styles.row, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label
              style={{ ...styles.label, fontSize: 12, color: "#8a7540" }}
            >
              Bed Time
            </label>
            <input
              type="time"
              value={form.bed_time || ""}
              onChange={(e) => update("bed_time", e.target.value)}
              style={styles.timeInput}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label
              style={{ ...styles.label, fontSize: 12, color: "#8a7540" }}
            >
              Wake Time
            </label>
            <input
              type="time"
              value={form.wake_time || ""}
              onChange={(e) => update("wake_time", e.target.value)}
              style={styles.timeInput}
            />
          </div>
        </div>
        <div>
          <label
            style={{ ...styles.label, fontSize: 12, color: "#8a7540" }}
          >
            Sleep Quality
          </label>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => update("sleep_quality", star)}
                style={styles.starBtn(star <= (form.sleep_quality || 0))}
                aria-label={`${star} star`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interpret on save */}
      <div style={{ ...styles.fieldGroup, ...styles.toggleRow }}>
        <DreamSwitch
          checked={form.interpret_on_save || false}
          onCheckedChange={(val) => {
            if (val && !canInterpret) return;
            update("interpret_on_save", val);
          }}
          disabled={!form.interpret_on_save && !canInterpret}
        />
        <div>
          <label style={{ ...styles.label, marginBottom: 0 }}>
            Interpret this dream
          </label>
          {!isPro && (
            <div style={{ fontSize: 11, color: "#6b5c30", marginTop: 2 }}>
              {canInterpret
                ? `${freeRemaining} free interpretation${freeRemaining !== 1 ? "s" : ""} remaining`
                : "No free interpretations remaining"}
            </div>
          )}
        </div>
      </div>


      {/* Moderation Error */}
      {moderationError && (
        <div style={{
          color: "#f87171", fontSize: 13, padding: "10px 14px", marginBottom: 12,
          background: "rgba(239,68,68,0.1)", borderRadius: 10, lineHeight: 1.5,
        }}>
          {moderationError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || descTooShort}
        style={{
          ...styles.submitBtn,
          opacity: (loading || descTooShort) ? 0.6 : 1,
          cursor: (loading || descTooShort) ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving..." : form.interpret_on_save ? "Save & Interpret" : "Save Dream"}
      </button>
    </form>
  );
}
