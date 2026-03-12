import { useState, useEffect } from "react";

const ARCHETYPES = {
  Explorer: {
    emoji: "\u{1f30c}",
    name: "The Explorer",
    description:
      "You are drawn to the vast unknown. Your dreams are portals to undiscovered worlds, and your subconscious yearns for adventure and discovery.",
    traits: ["Adventurous", "Curious", "Visionary", "Free-spirited"],
    color: "#4fc3f7",
  },
  Empath: {
    emoji: "\u{1f49c}",
    name: "The Empath",
    description:
      "Your dreams are deeply emotional landscapes. You process relationships and feelings through your dreamworld, making you attuned to the hearts of others.",
    traits: ["Compassionate", "Intuitive", "Nurturing", "Sensitive"],
    color: "#ce93d8",
  },
  Oracle: {
    emoji: "\u{1f52e}",
    name: "The Oracle",
    description:
      "Your dreams carry messages from beyond. You have a natural gift for symbolic thinking and may experience prophetic or deeply meaningful dreams.",
    traits: ["Mystical", "Perceptive", "Wise", "Symbolic"],
    color: "#ffb74d",
  },
  Warrior: {
    emoji: "\u2694\ufe0f",
    name: "The Warrior",
    description:
      "Your dreams are arenas of strength. You face challenges head-on in your dreamworld, building resilience and courage that carries into waking life.",
    traits: ["Bold", "Resilient", "Determined", "Courageous"],
    color: "#ef5350",
  },
};

const QUESTIONS = [
  {
    question: "When you close your eyes, what do you see most often?",
    options: [
      { text: "Vast landscapes and open skies", archetype: "Explorer" },
      { text: "Faces of people you know", archetype: "Empath" },
      { text: "Symbols, patterns, and abstract shapes", archetype: "Oracle" },
      { text: "Adventures and action scenes", archetype: "Warrior" },
    ],
  },
  {
    question: "How do you usually feel upon waking from a vivid dream?",
    options: [
      { text: "Curious and wanting to explore more", archetype: "Explorer" },
      { text: "Emotionally moved or connected", archetype: "Empath" },
      { text: "Like you received a message", archetype: "Oracle" },
      { text: "Energized and ready for the day", archetype: "Warrior" },
    ],
  },
  {
    question: "What recurring dream theme resonates most?",
    options: [
      { text: "Discovering hidden places", archetype: "Explorer" },
      { text: "Reuniting with loved ones", archetype: "Empath" },
      { text: "Prophecy or d\u00e9j\u00e0 vu", archetype: "Oracle" },
      { text: "Overcoming challenges", archetype: "Warrior" },
    ],
  },
  {
    question: 'If your dreams had a soundtrack, it would be...',
    options: [
      { text: "Ambient, ethereal music", archetype: "Explorer" },
      { text: "Emotional orchestral pieces", archetype: "Empath" },
      { text: "Mysterious, otherworldly sounds", archetype: "Oracle" },
      { text: "Epic, powerful anthems", archetype: "Warrior" },
    ],
  },
  {
    question: "What do you hope to gain from dream journaling?",
    options: [
      { text: "Understanding the unknown", archetype: "Explorer" },
      { text: "Deeper emotional awareness", archetype: "Empath" },
      { text: "Spiritual or intuitive growth", archetype: "Oracle" },
      { text: "Personal strength and clarity", archetype: "Warrior" },
    ],
  },
  {
    question: "Your dream superpower would be...",
    options: [
      { text: "Flying to new worlds", archetype: "Explorer" },
      { text: "Reading others' emotions", archetype: "Empath" },
      { text: "Seeing the future", archetype: "Oracle" },
      { text: "Superhuman strength", archetype: "Warrior" },
    ],
  },
  {
    question: "What time of night do you dream most vividly?",
    options: [
      { text: "Deep in the night", archetype: "Explorer" },
      { text: "Right before waking", archetype: "Empath" },
      { text: "During brief naps", archetype: "Oracle" },
      { text: "Anytime, dreams come easily", archetype: "Warrior" },
    ],
  },
];

function tallyResults(answers) {
  const counts = { Explorer: 0, Empath: 0, Oracle: 0, Warrior: 0 };
  answers.forEach((archetype) => {
    counts[archetype]++;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function ArchetypeQuiz({ onComplete }) {
  const [phase, setPhase] = useState("welcome"); // welcome | quiz | revealing | result
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [revealOpacity, setRevealOpacity] = useState(0);
  const [revealScale, setRevealScale] = useState(0.6);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "quiz") {
      setFadeIn(false);
      const t = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t);
    }
  }, [currentQuestion, phase]);

  const handleAnswer = (archetype) => {
    const newAnswers = [...answers, archetype];
    setAnswers(newAnswers);

    if (newAnswers.length === QUESTIONS.length) {
      const winner = tallyResults(newAnswers);
      setResult(winner);
      setPhase("revealing");
      setRevealOpacity(0);
      setRevealScale(0.6);
      setTimeout(() => {
        setRevealOpacity(1);
        setRevealScale(1);
      }, 100);
      setTimeout(() => {
        setPhase("result");
      }, 2000);
    } else {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 150);
    }
  };

  const handleComplete = () => {
    onComplete({
      archetype: result,
      archetypeData: ARCHETYPES[result],
    });
  };

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "linear-gradient(135deg, #04001a 0%, #120038 50%, #0a0025 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Georgia, 'Times New Roman', serif",
      overflow: "auto",
    },
    container: {
      width: "100%",
      maxWidth: 640,
      padding: "40px 24px",
      textAlign: "center",
    },
    title: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#e8d5ff",
      margin: "0 0 12px 0",
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: 18,
      color: "#c490ff",
      margin: "0 0 40px 0",
      lineHeight: 1.6,
      fontStyle: "italic",
    },
    button: {
      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
      color: "#fff",
      border: "none",
      padding: "16px 48px",
      fontSize: 18,
      fontFamily: "Georgia, 'Times New Roman', serif",
      borderRadius: 12,
      cursor: "pointer",
      letterSpacing: 1,
      transition: "transform 0.2s, box-shadow 0.2s",
      boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)",
    },
    progressBar: {
      width: "100%",
      height: 6,
      borderRadius: 3,
      background: "rgba(255,255,255,0.1)",
      marginBottom: 32,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      background: "linear-gradient(90deg, #7c3aed, #c084fc)",
      transition: "width 0.4s ease",
    },
    progressText: {
      color: "#c490ff",
      fontSize: 14,
      marginBottom: 8,
      textAlign: "right",
    },
    questionText: {
      fontSize: 22,
      color: "#e8d5ff",
      margin: "0 0 32px 0",
      lineHeight: 1.5,
      opacity: fadeIn ? 1 : 0,
      transform: fadeIn ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    },
    optionCard: (isHovered) => ({
      width: "100%",
      padding: "18px 24px",
      marginBottom: 14,
      background: isHovered
        ? "rgba(168, 85, 247, 0.2)"
        : "rgba(255, 255, 255, 0.05)",
      border: isHovered
        ? "1px solid rgba(168, 85, 247, 0.6)"
        : "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: 12,
      color: "#e8d5ff",
      fontSize: 16,
      fontFamily: "Georgia, 'Times New Roman', serif",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.25s ease",
      boxShadow: isHovered
        ? "0 0 20px rgba(168, 85, 247, 0.3)"
        : "0 0 0 transparent",
      transform: isHovered ? "translateX(4px)" : "translateX(0)",
      opacity: fadeIn ? 1 : 0,
    }),
    revealContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: revealOpacity,
      transform: `scale(${revealScale})`,
      transition: "opacity 1.5s ease, transform 1.5s ease",
    },
    revealEmoji: {
      fontSize: 80,
      marginBottom: 24,
    },
    revealText: {
      fontSize: 16,
      color: "#c490ff",
      letterSpacing: 3,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    resultCard: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(168, 85, 247, 0.3)",
      borderRadius: 20,
      padding: "40px 32px",
      maxWidth: 500,
      margin: "0 auto",
      boxShadow: "0 0 60px rgba(168, 85, 247, 0.15)",
    },
    resultEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    resultName: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#e8d5ff",
      margin: "0 0 20px 0",
    },
    resultDescription: {
      fontSize: 16,
      color: "#c490ff",
      lineHeight: 1.7,
      margin: "0 0 28px 0",
    },
    traitsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      marginBottom: 32,
    },
    traitBadge: (color) => ({
      padding: "6px 16px",
      borderRadius: 20,
      fontSize: 13,
      color: color,
      border: `1px solid ${color}44`,
      background: `${color}15`,
      letterSpacing: 0.5,
    }),
    stars: {
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
    },
  };

  const renderStars = () => {
    const dots = [];
    for (let i = 0; i < 60; i++) {
      const size = Math.random() * 2 + 1;
      dots.push(
        <div
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#fff",
            opacity: Math.random() * 0.5 + 0.1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      );
    }
    return <div style={styles.stars}>{dots}</div>;
  };

  return (
    <div style={styles.overlay}>
      {renderStars()}
      <div style={{ ...styles.container, position: "relative", zIndex: 1 }}>
        {phase === "welcome" && (
          <div>
            <div style={{ fontSize: 56, marginBottom: 24 }}>{"\u2728"}</div>
            <h1 style={styles.title}>Discover Your Dreamer Archetype</h1>
            <p style={styles.subtitle}>
              Every dreamer is unique. Answer seven questions to unveil the
              archetype that shapes your dreamworld and unlock a personalized
              Dreamscape experience.
            </p>
            <button
              style={styles.button}
              onClick={() => setPhase("quiz")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 0 40px rgba(168, 85, 247, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(168, 85, 247, 0.4)";
              }}
            >
              Begin Your Journey
            </button>
          </div>
        )}

        {phase === "quiz" && (
          <div>
            <div style={styles.progressText}>
              {currentQuestion + 1} / {QUESTIONS.length}
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
            <h2 style={styles.questionText}>
              {QUESTIONS[currentQuestion].question}
            </h2>
            <div>
              {QUESTIONS[currentQuestion].options.map((option, idx) => (
                <button
                  key={idx}
                  style={styles.optionCard(hoveredOption === idx)}
                  onMouseEnter={() => setHoveredOption(idx)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => {
                    setHoveredOption(null);
                    handleAnswer(option.archetype);
                  }}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "revealing" && result && (
          <div style={styles.revealContainer}>
            <div style={styles.revealEmoji}>{ARCHETYPES[result].emoji}</div>
            <div style={styles.revealText}>Your archetype is</div>
            <h1 style={{ ...styles.title, fontSize: 42 }}>
              {ARCHETYPES[result].name}
            </h1>
          </div>
        )}

        {phase === "result" && result && (
          <div>
            <div style={styles.resultCard}>
              <div style={styles.resultEmoji}>{ARCHETYPES[result].emoji}</div>
              <h2 style={styles.resultName}>{ARCHETYPES[result].name}</h2>
              <p style={styles.resultDescription}>
                {ARCHETYPES[result].description}
              </p>
              <div style={styles.traitsContainer}>
                {ARCHETYPES[result].traits.map((trait) => (
                  <span
                    key={trait}
                    style={styles.traitBadge(ARCHETYPES[result].color)}
                  >
                    {trait}
                  </span>
                ))}
              </div>
              <button
                style={styles.button}
                onClick={handleComplete}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 0 40px rgba(168, 85, 247, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 0 30px rgba(168, 85, 247, 0.4)";
                }}
              >
                Enter Dreamscape
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
