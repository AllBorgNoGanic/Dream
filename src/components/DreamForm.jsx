import { useState, useRef, useEffect } from "react";

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
  "Fantasy",
  "Nightmare",
  "Spiritual",
  "Mundane",
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
    background: "rgba(30,10,60,0.8)",
    border: "1px solid rgba(160,100,255,0.3)",
    borderRadius: 20,
    padding: 28,
    fontFamily: "Georgia, serif",
    color: "#e8d5ff",
    maxWidth: 680,
    margin: "0 auto",
  },
  heading: {
    margin: "0 0 24px 0",
    fontSize: 22,
    color: "#c490ff",
    textAlign: "center",
    fontFamily: "Georgia, serif",
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    color: "#c490ff",
    fontFamily: "Georgia, serif",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(20,5,40,0.9)",
    border: "1px solid rgba(160,100,255,0.3)",
    borderRadius: 10,
    color: "#e8d5ff",
    fontSize: 15,
    fontFamily: "Georgia, serif",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(20,5,40,0.9)",
    border: "1px solid rgba(160,100,255,0.3)",
    borderRadius: 10,
    color: "#e8d5ff",
    fontSize: 15,
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
    border: "1px solid rgba(160,100,255,0.4)",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 13,
    color: "#e8d5ff",
    fontFamily: "Georgia, serif",
  },
  chipX: {
    cursor: "pointer",
    color: "#c490ff",
    fontWeight: "bold",
    fontSize: 14,
    background: "none",
    border: "none",
    padding: 0,
    lineHeight: 1,
    fontFamily: "Georgia, serif",
  },
  selectorBtn: (active) => ({
    padding: "7px 14px",
    borderRadius: 12,
    border: active
      ? "1px solid rgba(200,150,255,0.7)"
      : "1px solid rgba(160,100,255,0.25)",
    background: active
      ? "linear-gradient(135deg, rgba(120,60,220,0.6), rgba(80,30,180,0.6))"
      : "rgba(30,10,60,0.5)",
    color: active ? "#fff" : "#7060aa",
    cursor: "pointer",
    fontSize: 13,
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
      ? "linear-gradient(135deg,#7c3aed,#a855f7)"
      : "rgba(60,30,100,0.6)",
    border: "1px solid rgba(160,100,255,0.3)",
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
    background: "#e8d5ff",
    transition: "left 0.2s",
  }),
  slider: {
    width: "100%",
    accentColor: "#a855f7",
    cursor: "pointer",
  },
  starBtn: (active) => ({
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: active ? "#f5c842" : "#7060aa",
    transition: "color 0.15s",
    padding: "0 2px",
  }),
  submitBtn: {
    width: "100%",
    padding: "14px 0",
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)",
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
    padding: "6px 14px",
    borderRadius: 10,
    border: recording
      ? "1px solid rgba(255,80,80,0.5)"
      : "1px solid rgba(160,100,255,0.3)",
    background: recording ? "rgba(180,30,30,0.3)" : "rgba(30,10,60,0.5)",
    color: recording ? "#ff8888" : "#c490ff",
    cursor: "pointer",
    fontSize: 13,
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
    padding: "8px 12px",
    background: "rgba(20,5,40,0.9)",
    border: "1px solid rgba(160,100,255,0.3)",
    borderRadius: 10,
    color: "#e8d5ff",
    fontSize: 14,
    fontFamily: "Georgia, serif",
    outline: "none",
  },
};

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
  const [recording, setRecording] = useState(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
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
          style={styles.textarea}
          required
        />
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
          <div
            style={styles.toggleTrack(form.is_lucid)}
            onClick={() => update("is_lucid", !form.is_lucid)}
            role="switch"
            aria-checked={form.is_lucid}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                update("is_lucid", !form.is_lucid);
              }
            }}
          >
            <div style={styles.toggleKnob(form.is_lucid)} />
          </div>
          <label style={{ ...styles.label, marginBottom: 0 }}>
            Lucid Dream
          </label>
        </div>
        {form.is_lucid && (
          <div style={{ paddingLeft: 4 }}>
            <label
              style={{ ...styles.label, fontSize: 13, marginBottom: 4 }}
            >
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
          </div>
        )}
      </div>

      {/* Sleep Tracking */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Sleep Tracking</label>
        <div style={{ ...styles.row, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label
              style={{ ...styles.label, fontSize: 12, color: "#7060aa" }}
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
              style={{ ...styles.label, fontSize: 12, color: "#7060aa" }}
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
            style={{ ...styles.label, fontSize: 12, color: "#7060aa" }}
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
                \u2605
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Share with community */}
      <div style={{ ...styles.fieldGroup, ...styles.toggleRow }}>
        <div
          style={styles.toggleTrack(form.is_public)}
          onClick={() => update("is_public", !form.is_public)}
          role="switch"
          aria-checked={form.is_public}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              update("is_public", !form.is_public);
            }
          }}
        >
          <div style={styles.toggleKnob(form.is_public)} />
        </div>
        <label style={{ ...styles.label, marginBottom: 0 }}>
          Share with community
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.submitBtn,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving..." : "Save Dream"}
      </button>

      {!isPro && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#7060aa",
            marginTop: 10,
            marginBottom: 0,
            fontFamily: "Georgia, serif",
          }}
        >
          {freeRemaining} free interpretation{freeRemaining !== 1 ? "s" : ""}{" "}
          remaining
        </p>
      )}
    </form>
  );
}
