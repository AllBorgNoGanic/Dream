import { useState } from "react";

const DREAM_DICTIONARY = {
  flying: { symbol: "✈️", meaning: "Freedom, ambition, or desire to escape responsibilities. Often signals a need for perspective or liberation from constraints." },
  falling: { symbol: "⬇️", meaning: "Loss of control, insecurity, or anxiety about failure. Common during times of stress or major life transitions." },
  water: { symbol: "🌊", meaning: "Emotions, the unconscious mind, and life's flow. Calm water signals peace; turbulent water signals emotional turmoil." },
  fire: { symbol: "🔥", meaning: "Passion, transformation, or destruction. Can represent desire, anger, or a powerful change in your life." },
  death: { symbol: "💀", meaning: "Endings and new beginnings — rarely literal. Often signals a major transformation, leaving behind an old self or situation." },
  teeth: { symbol: "🦷", meaning: "Anxiety about appearance, communication, or loss. One of the most common recurring dream symbols." },
  chase: { symbol: "🏃", meaning: "Avoidance of a person, situation, or emotion in waking life. The pursuer often represents something you're running from." },
  house: { symbol: "🏠", meaning: "The self or psyche. Different rooms represent different aspects of your mind, past, or current emotional state." },
  snake: { symbol: "🐍", meaning: "Hidden fears, transformation, or wisdom. Can represent a threat or a powerful force of change in your life." },
  ocean: { symbol: "🌊", meaning: "The vast unconscious mind, depth of emotion, and the unknown. Swimming signals confidence; drowning signals overwhelm." },
  forest: { symbol: "🌲", meaning: "The unconscious, mystery, and the unknown. Can represent feeling lost or a desire to reconnect with nature/instincts." },
  school: { symbol: "🏫", meaning: "Learning, judgment, or feeling unprepared. Often appears when facing a test or challenge in waking life." },
  baby: { symbol: "👶", meaning: "New beginnings, vulnerability, or an idea/project in its early stages. Can reflect nurturing instincts." },
  car: { symbol: "🚗", meaning: "Control over your life's direction. Who's driving matters — being a passenger signals feeling out of control." },
  mirror: { symbol: "🪞", meaning: "Self-reflection, identity, and how you see yourself. A broken mirror can signal a fractured self-image." },
  clock: { symbol: "⏰", meaning: "Anxiety about time, deadlines, or mortality. Running out of time suggests pressure in waking life." },
  bird: { symbol: "🐦", meaning: "Freedom, perspective, and aspirations. Birds in flight represent goals and the desire to rise above." },
  door: { symbol: "🚪", meaning: "Opportunities, transitions, and new phases. A locked door represents obstacles; an open one represents possibility." },
  rain: { symbol: "🌧️", meaning: "Cleansing, renewal, or sadness. Can represent emotional release or a need to let go." },
  mountain: { symbol: "⛰️", meaning: "Obstacles, achievement, and spiritual growth. Climbing represents progress; the summit represents goals." },
  moon: { symbol: "🌙", meaning: "Intuition, femininity, and the hidden aspects of self. Cycles and phases of personal transformation." },
  sun: { symbol: "☀️", meaning: "Consciousness, vitality, and truth. Represents clarity, success, and the illumination of understanding." },
  bridge: { symbol: "🌉", meaning: "Transitions, connections, and decisions. Crossing a bridge represents moving from one phase of life to another." },
  key: { symbol: "🔑", meaning: "Solutions, secrets, and knowledge. Finding a key represents discovering answers or unlocking potential." },
};

export default function DictionaryTab() {
  const [search, setSearch] = useState("");

  const filtered = Object.entries(DREAM_DICTIONARY).filter(([key]) =>
    key.includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <input
        placeholder="Search symbols..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.2)",
          borderRadius: 40, padding: "13px 22px", color: "#e8d5ff", fontSize: 14,
          marginBottom: 24, boxSizing: "border-box", outline: "none", fontFamily: "Georgia, serif"
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map(([key, val]) => (
          <div key={key} className="dict-card" style={{
            background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.12)",
            borderRadius: 16, padding: "18px 20px", cursor: "default"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{val.symbol}</span>
              <span style={{ fontSize: 15, color: "#c490ff", textTransform: "capitalize" }}>{key}</span>
            </div>
            <p style={{ fontSize: 12, color: "#8070aa", lineHeight: 1.6, margin: 0 }}>{val.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
