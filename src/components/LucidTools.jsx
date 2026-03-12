import { useState, useMemo } from "react";

const REALITY_CHECKS = [
  {
    name: "Look at your hands",
    icon: "✋",
    description: "In dreams, your hands often look distorted — extra fingers, blurry, or morphing. Checking them regularly builds the habit of questioning reality.",
  },
  {
    name: "Read text twice",
    icon: "📖",
    description: "Text in dreams is unstable. If you read something, look away, and read it again, the words will change. This inconsistency signals you're dreaming.",
  },
  {
    name: "Check a clock",
    icon: "⏰",
    description: "Clocks behave erratically in dreams — numbers scramble, hands spin, or the time makes no sense. A double-take on a clock can trigger lucidity.",
  },
  {
    name: "Push finger through palm",
    icon: "👆",
    description: "Try pushing your index finger through the palm of your other hand. In a dream, it will pass right through because your brain expects it to work.",
  },
  {
    name: "Look in a mirror",
    icon: "🪞",
    description: "Mirrors in dreams rarely show your true reflection. You may look distorted, blurry, or see a stranger. This uncanny effect is a strong dream sign.",
  },
  {
    name: "Try to breathe with nose pinched",
    icon: "👃",
    description: "Pinch your nose shut and try to breathe. In a dream, you'll still be able to breathe normally. This is one of the most reliable reality checks.",
  },
];

const MILD_STEPS = [
  {
    title: "Set intention",
    detail: "Before falling asleep, firmly tell yourself that you will become aware that you are dreaming tonight. Believe it completely.",
  },
  {
    title: "Wake after 5 hours",
    detail: "Set an alarm for 5 hours after falling asleep. This targets your longest REM periods, when vivid dreams are most likely.",
  },
  {
    title: "Recall your dream",
    detail: "When you wake, lie still and replay the dream you were just having in as much detail as possible. Write it down if you can.",
  },
  {
    title: "Visualize becoming lucid",
    detail: "Replay the dream in your mind, but this time imagine recognizing a dream sign and becoming lucid. See yourself realizing you are dreaming.",
  },
  {
    title: "Repeat your mantra",
    detail: '"Next time I\'m dreaming, I will realize I\'m dreaming." Repeat this phrase silently with conviction as you drift back to sleep.',
  },
  {
    title: "Fall back asleep",
    detail: "Let go gently while holding the intention. The last thought in your mind should be the awareness that you will recognize the dream.",
  },
];

const WILD_STEPS = [
  {
    title: "Relax body completely",
    detail: "Lie on your back and progressively relax every muscle group from your toes to your scalp. Let your body feel heavy and still.",
  },
  {
    title: "Stay mentally aware",
    detail: "Keep your mind alert while your body falls asleep. Focus on your breath or count slowly. The key is passive observation.",
  },
  {
    title: "Watch hypnagogic imagery",
    detail: "As you relax, you may see colors, patterns, or fleeting images behind your eyelids. Observe them without engaging — they are the gateway.",
  },
  {
    title: "Don't move",
    detail: "Your body will test if you're asleep by sending urges to roll over or scratch. Resist them. Stillness signals your body that it's time to sleep.",
  },
  {
    title: "Enter the dream consciously",
    detail: "The imagery will intensify into a full scene. Step into it gently. You are now dreaming while fully aware — you've achieved a WILD.",
  },
];

const STOP_WORDS = new Set([
  "the", "and", "was", "were", "is", "are", "am", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "must",
  "that", "this", "these", "those", "with", "from", "into", "about",
  "for", "but", "not", "you", "all", "her", "his", "him", "she", "he",
  "they", "them", "their", "its", "our", "your", "who", "what", "which",
  "when", "where", "how", "why", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "than", "too", "very", "just", "also",
  "then", "there", "here", "now", "out", "only", "own", "same", "so",
  "because", "until", "while", "after", "before", "during", "between",
  "through", "over", "under", "again", "once", "like", "well", "back",
  "still", "even", "way", "many", "much", "really", "already",
  "around", "another", "came", "come", "going", "went", "got", "get",
  "see", "saw", "know", "knew", "make", "made", "think", "thought",
  "take", "took", "want", "wanted", "look", "looked", "felt", "feel",
  "try", "tried", "something", "someone", "everything", "anything",
  "nothing", "one", "two", "three", "first", "last", "new", "old",
  "big", "small", "long", "little", "large", "great", "good", "bad",
  "right", "left", "next", "don", "didn", "wasn", "couldn", "wouldn",
  "doesn", "isn", "aren", "hadn", "it", "me", "my", "we", "us",
]);

export default function LucidTools({ dreams }) {
  const [checksToday, setChecksToday] = useState(0);
  const [practiceCheck, setPracticeCheck] = useState(null);
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const startPractice = (check) => {
    setPracticeCheck(check);
    setPracticeTimer(0);
    const interval = setInterval(() => {
      setPracticeTimer((t) => t + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopPractice = () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);
    setPracticeCheck(null);
    setPracticeTimer(0);
    setChecksToday((c) => c + 1);
  };

  // Lucid dream stats
  const lucidStats = useMemo(() => {
    const total = dreams.length;
    const lucidDreams = dreams.filter((d) => d.is_lucid);
    const lucidCount = lucidDreams.length;
    const rate = total > 0 ? ((lucidCount / total) * 100).toFixed(1) : 0;
    const avgLevel =
      lucidCount > 0
        ? (
            lucidDreams.reduce((sum, d) => sum + (d.lucidity_level || 0), 0) /
            lucidCount
          ).toFixed(1)
        : 0;

    // Most common themes in lucid dreams
    const themeCounts = {};
    lucidDreams.forEach((d) => {
      if (d.theme) themeCounts[d.theme] = (themeCounts[d.theme] || 0) + 1;
    });
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Last 30 days frequency
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split("T")[0];
      const count = lucidDreams.filter((d) => {
        const dDate = new Date(d.created_at).toISOString().split("T")[0];
        return dDate === dateStr;
      }).length;
      return { date: dateStr, count };
    });

    return { total, lucidCount, rate, avgLevel, topThemes, last30 };
  }, [dreams]);

  // Dream signs detector
  const dreamSigns = useMemo(() => {
    const wordCounts = {};
    dreams.forEach((d) => {
      if (!d.description) return;
      const words = d.description
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
  }, [dreams]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const cardStyle = {
    background: "rgba(20,8,50,0.7)",
    border: "1px solid rgba(160,100,255,0.15)",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    animation: "fadeIn 0.4s ease",
  };

  const sectionTitle = {
    fontSize: 13,
    letterSpacing: 3,
    color: "#8060cc",
    textTransform: "uppercase",
    marginBottom: 20,
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <style>{`
        .rc-btn:hover { background: rgba(160,100,255,0.35) !important; border-color: rgba(160,100,255,0.6) !important; }
        .step-card:hover { border-color: rgba(160,100,255,0.4) !important; background: rgba(30,12,60,0.9) !important; }
        .sign-row:hover { background: rgba(160,100,255,0.1) !important; }
        .practice-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(4,0,26,0.96); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
      `}</style>

      {/* Practice Overlay */}
      {practiceCheck && (
        <div className="practice-overlay">
          <div style={{ fontSize: 64, marginBottom: 24 }}>{practiceCheck.icon}</div>
          <div
            style={{
              fontSize: 28,
              color: "#e8d5ff",
              marginBottom: 12,
              textAlign: "center",
              padding: "0 20px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {practiceCheck.name}
          </div>
          <div
            style={{
              fontSize: 15,
              color: "#9080bb",
              maxWidth: 440,
              textAlign: "center",
              lineHeight: 1.7,
              marginBottom: 32,
              padding: "0 20px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {practiceCheck.description}
          </div>
          <div
            style={{
              fontSize: 48,
              color: "#c490ff",
              fontFamily: "monospace",
              marginBottom: 40,
              letterSpacing: 4,
            }}
          >
            {formatTime(practiceTimer)}
          </div>
          <button
            onClick={stopPractice}
            style={{
              background: "linear-gradient(135deg, #6020cc, #9040ee)",
              border: "none",
              color: "white",
              padding: "14px 48px",
              borderRadius: 40,
              fontSize: 15,
              cursor: "pointer",
              letterSpacing: 0.5,
              fontFamily: "'Georgia', serif",
              boxShadow: "0 4px 20px rgba(120,40,220,0.4)",
            }}
          >
            Complete Check
          </button>
        </div>
      )}

      {/* ========== REALITY CHECK TRAINER ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Reality Check Trainer</div>
        <div
          style={{
            fontSize: 13,
            color: "#7060aa",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Practice reality checks throughout the day to build the habit of questioning
          your state. This habit carries into dreams, triggering lucidity.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            padding: "12px 16px",
            background: "rgba(100,40,180,0.15)",
            border: "1px solid rgba(160,100,255,0.2)",
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>🎯</span>
          <span style={{ fontSize: 14, color: "#c490ff" }}>
            Reality checks today:{" "}
            <span style={{ color: "#e8d5ff", fontWeight: 600 }}>{checksToday}</span>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {REALITY_CHECKS.map((check) => (
            <div
              key={check.name}
              style={{
                background: "rgba(30,12,60,0.6)",
                border: "1px solid rgba(160,100,255,0.12)",
                borderRadius: 16,
                padding: "16px 18px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 22 }}>{check.icon}</span>
                <span style={{ fontSize: 14, color: "#ddc8ff" }}>{check.name}</span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#7060aa",
                  lineHeight: 1.6,
                  margin: "0 0 12px",
                }}
              >
                {check.description}
              </p>
              <button
                className="rc-btn"
                onClick={() => startPractice(check)}
                style={{
                  background: "rgba(160,100,255,0.2)",
                  border: "1px solid rgba(160,100,255,0.3)",
                  color: "#c490ff",
                  padding: "7px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "'Georgia', serif",
                  transition: "all 0.2s",
                }}
              >
                Practice Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========== MILD TECHNIQUE GUIDE ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>MILD Technique</div>
        <div style={{ fontSize: 15, color: "#c490ff", marginBottom: 6 }}>
          Mnemonic Induction of Lucid Dreams
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#7060aa",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          A beginner-friendly technique that uses intention and visualization to trigger
          lucidity during REM sleep.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MILD_STEPS.map((step, i) => (
            <div
              key={i}
              className="step-card"
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                background: "rgba(30,12,60,0.5)",
                border: "1px solid rgba(160,100,255,0.1)",
                borderRadius: 16,
                padding: "16px 20px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6020cc, #9040ee)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  color: "white",
                  fontWeight: 600,
                  fontFamily: "sans-serif",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 15, color: "#ddc8ff", marginBottom: 4 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: "#7060aa", lineHeight: 1.6 }}>
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== WILD TECHNIQUE GUIDE ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>WILD Technique</div>
        <div style={{ fontSize: 15, color: "#c490ff", marginBottom: 6 }}>
          Wake Initiated Lucid Dream
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "rgba(200,80,80,0.1)",
            border: "1px solid rgba(200,80,80,0.25)",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, color: "#e0a0a0", lineHeight: 1.5 }}>
            Advanced technique — may cause sleep paralysis. Not recommended for
            beginners.
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#7060aa",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          A powerful technique where you transition directly from wakefulness into a
          lucid dream without losing consciousness.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {WILD_STEPS.map((step, i) => (
            <div
              key={i}
              className="step-card"
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                background: "rgba(30,12,60,0.5)",
                border: "1px solid rgba(160,100,255,0.1)",
                borderRadius: 16,
                padding: "16px 20px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4020a0, #7030cc)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  color: "white",
                  fontWeight: 600,
                  fontFamily: "sans-serif",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 15, color: "#ddc8ff", marginBottom: 4 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: "#7060aa", lineHeight: 1.6 }}>
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== LUCID DREAM STATS ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Lucid Dream Stats</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Lucid Dreams",
              value: lucidStats.lucidCount,
              icon: "🌟",
            },
            {
              label: "Lucidity Rate",
              value: `${lucidStats.rate}%`,
              icon: "📊",
            },
            {
              label: "Avg. Level",
              value: lucidStats.avgLevel,
              icon: "🧠",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(30,12,60,0.6)",
                border: "1px solid rgba(160,100,255,0.12)",
                borderRadius: 16,
                padding: "18px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div
                style={{ fontSize: 22, color: "#c490ff", fontWeight: 400 }}
              >
                {stat.value}
              </div>
              <div
                style={{ fontSize: 11, color: "#6050a0", marginTop: 4 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top lucid dream themes */}
        {lucidStats.topThemes.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                color: "#7060aa",
                marginBottom: 10,
                letterSpacing: 1,
              }}
            >
              Most Common Lucid Dream Themes
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {lucidStats.topThemes.map(([theme, count]) => (
                <span
                  key={theme}
                  style={{
                    background: "rgba(120,50,200,0.2)",
                    border: "1px solid rgba(160,100,255,0.2)",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: 12,
                    color: "#b090e0",
                  }}
                >
                  {theme}{" "}
                  <span style={{ color: "#7060aa" }}>({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 30-day chart */}
        <div>
          <div
            style={{
              fontSize: 12,
              color: "#7060aa",
              marginBottom: 12,
              letterSpacing: 1,
            }}
          >
            Lucid Dreams — Last 30 Days
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              height: 80,
              padding: "0 4px",
            }}
          >
            {lucidStats.last30.map((day, i) => {
              const maxCount = Math.max(
                1,
                ...lucidStats.last30.map((d) => d.count)
              );
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                    position: "relative",
                  }}
                  title={`${day.date}: ${day.count} lucid dream${day.count !== 1 ? "s" : ""}`}
                >
                  {day.count > 0 && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #9040ee, #c060ff)",
                        marginBottom:
                          (day.count / maxCount) * 50,
                        boxShadow: "0 0 8px rgba(160,100,255,0.5)",
                        transition: "all 0.3s",
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      background:
                        i % 7 === 0
                          ? "rgba(160,100,255,0.15)"
                          : "rgba(160,100,255,0.05)",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 10, color: "#5040a0" }}>30 days ago</span>
            <span style={{ fontSize: 10, color: "#5040a0" }}>Today</span>
          </div>
        </div>

        {lucidStats.lucidCount === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "16px 0 0",
              fontSize: 13,
              color: "#6050a0",
              lineHeight: 1.6,
            }}
          >
            No lucid dreams recorded yet. Mark dreams as lucid when logging them
            to start tracking your progress.
          </div>
        )}
      </div>

      {/* ========== DREAM SIGNS DETECTOR ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Dream Signs Detector</div>
        <div
          style={{
            fontSize: 13,
            color: "#7060aa",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Your dreams are analyzed to find recurring elements that could be dream signs.
          Train yourself to notice these in waking life to trigger lucidity.
        </div>

        {dreamSigns.length > 0 ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dreamSigns.map(([word, count], i) => (
                <div
                  key={word}
                  className="sign-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 14px",
                    borderRadius: 12,
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(100,40,180,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#b090e0",
                      fontFamily: "sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: 15,
                        color: "#ddc8ff",
                        textTransform: "capitalize",
                      }}
                    >
                      {word}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#7060aa" }}>
                    {count} dream{count !== 1 ? "s" : ""}
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(count / (dreamSigns[0]?.[1] || 1)) * 100}%`,
                        background:
                          "linear-gradient(90deg, #6020cc, #c060ff)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 20,
                padding: "14px 18px",
                background: "rgba(100,40,180,0.12)",
                border: "1px solid rgba(160,100,255,0.15)",
                borderRadius: 14,
                fontSize: 13,
                color: "#9080bb",
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              These recurring elements in your dreams could be dream signs. Train
              yourself to notice them!
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              fontSize: 13,
              color: "#6050a0",
              lineHeight: 1.6,
            }}
          >
            Record more dreams to detect recurring dream signs. At least 2
            appearances of a word are needed.
          </div>
        )}
      </div>
    </div>
  );
}
