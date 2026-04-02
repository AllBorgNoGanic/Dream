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

export default function LucidTools({ dreams }) {
  // Persist reality check count in localStorage (resets daily)
  const todayKey = new Date().toISOString().split("T")[0];
  const storedChecks = localStorage.getItem(`rc_${todayKey}`);
  const [checksToday, setChecksToday] = useState(storedChecks ? parseInt(storedChecks) : 0);
  const [practiceCheck, setPracticeCheck] = useState(null);
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [mildExpanded, setMildExpanded] = useState(false);

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
    const newCount = checksToday + 1;
    setChecksToday(newCount);
    localStorage.setItem(`rc_${todayKey}`, newCount);
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

    // Dream signs across ALL dreams
    const signCounts = {};
    dreams.forEach((d) => {
      const signs = Array.isArray(d.dream_signs) ? d.dream_signs : [];
      signs.forEach((s) => {
        signCounts[s] = (signCounts[s] || 0) + 1;
      });
    });
    const topSigns = Object.entries(signCounts)
      .sort((a, b) => b[1] - a[1]);
    const totalSignEntries = Object.values(signCounts).reduce((a, b) => a + b, 0);

    // Trigger breakdown for lucid dreams
    const triggerCounts = {};
    lucidDreams.forEach((d) => {
      if (d.lucid_trigger) triggerCounts[d.lucid_trigger] = (triggerCounts[d.lucid_trigger] || 0) + 1;
    });
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1]);

    // Duration breakdown
    const durationCounts = {};
    lucidDreams.forEach((d) => {
      if (d.lucid_duration) durationCounts[d.lucid_duration] = (durationCounts[d.lucid_duration] || 0) + 1;
    });
    const topDurations = Object.entries(durationCounts)
      .sort((a, b) => b[1] - a[1]);

    return { total, lucidCount, rate, avgLevel, topThemes, last30, topSigns, totalSignEntries, topTriggers, topDurations };
  }, [dreams]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const cardStyle = {
    background: "rgba(6,12,22,0.7)",
    border: "1px solid rgba(200,160,30,0.15)",
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
        .rc-btn:hover { background: rgba(200,160,30,0.35) !important; border-color: rgba(200,160,30,0.6) !important; }
        .step-card:hover { border-color: rgba(200,160,30,0.4) !important; background: rgba(30,12,60,0.9) !important; }
        .practice-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(4,0,26,0.96); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
        .mild-toggle:hover { background: rgba(200,160,30,0.12) !important; }
      `}</style>

      {/* Practice Overlay */}
      {practiceCheck && (
        <div className="practice-overlay">
          <div style={{ fontSize: 64, marginBottom: 24 }}>{practiceCheck.icon}</div>
          <div
            style={{
              fontSize: 28,
              color: "#f5e4b0",
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
              color: "#8a7a50",
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
              color: "#e8b840",
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
              background: "linear-gradient(135deg, #7a5200, #c89020)",
              border: "none",
              color: "white",
              padding: "14px 48px",
              borderRadius: 40,
              fontSize: 15,
              cursor: "pointer",
              letterSpacing: 0.5,
              fontFamily: "'Georgia', serif",
              boxShadow: "0 4px 20px rgba(160,100,5,0.4)",
            }}
          >
            Complete Check
          </button>
        </div>
      )}

      {/* ========== LUCID DREAM STATS (first) ========== */}
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
                border: "1px solid rgba(200,160,30,0.12)",
                borderRadius: 16,
                padding: "18px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div
                style={{ fontSize: 22, color: "#e8b840", fontWeight: 400 }}
              >
                {stat.value}
              </div>
              <div
                style={{ fontSize: 11, color: "#6b5c30", marginTop: 4 }}
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
                color: "#8a7540",
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
                    background: "rgba(160,110,5,0.2)",
                    border: "1px solid rgba(200,160,30,0.2)",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: 12,
                    color: "#d4a840",
                  }}
                >
                  {theme}{" "}
                  <span style={{ color: "#8a7540" }}>({count})</span>
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
              color: "#8a7540",
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
                          "linear-gradient(135deg, #c89020, #c060ff)",
                        marginBottom:
                          (day.count / maxCount) * 50,
                        boxShadow: "0 0 8px rgba(200,160,30,0.5)",
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
                          ? "rgba(200,160,30,0.15)"
                          : "rgba(200,160,30,0.05)",
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
              color: "#6b5c30",
              lineHeight: 1.6,
            }}
          >
            No lucid dreams recorded yet. Mark dreams as lucid when logging them
            to start tracking your progress.
          </div>
        )}
      </div>

      {/* ========== DREAM SIGNS TRACKER ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Dream Signs Tracker</div>
        <div style={{ fontSize: 13, color: "#8a7540", marginBottom: 20, lineHeight: 1.6 }}>
          Dream signs are recurring elements that appear across your dreams. Recognizing them is the foundation of becoming lucid -- when you spot a familiar sign mid-dream, it can trigger awareness.
        </div>

        {lucidStats.topSigns.length > 0 ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lucidStats.topSigns.slice(0, 10).map(([sign, count], i) => {
                const pct = lucidStats.totalSignEntries > 0 ? (count / lucidStats.totalSignEntries) * 100 : 0;
                return (
                  <div key={sign} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#6b5c30", minWidth: 20, textAlign: "right" }}>
                      {i + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, color: "#f0d890" }}>{sign}</span>
                        <span style={{ fontSize: 12, color: "#8a7540" }}>
                          {count} time{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{
                        height: 6,
                        borderRadius: 3,
                        background: "rgba(30,12,60,0.6)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.max(pct, 4)}%`,
                          borderRadius: 3,
                          background: "linear-gradient(90deg, #8060cc, #c89020)",
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {lucidStats.topSigns.length > 10 && (
              <div style={{ fontSize: 12, color: "#6b5c30", textAlign: "center", marginTop: 12 }}>
                + {lucidStats.topSigns.length - 10} more sign{lucidStats.topSigns.length - 10 !== 1 ? "s" : ""}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: "#6b5c30", lineHeight: 1.6 }}>
            No dream signs recorded yet. When logging a lucid dream, add recurring elements like "flying", "being at school", or "a specific person" to start building your pattern library.
          </div>
        )}
      </div>

      {/* ========== LUCID INSIGHTS ========== */}
      {(lucidStats.topTriggers.length > 0 || lucidStats.topDurations.length > 0) && (
        <div style={cardStyle}>
          <div style={sectionTitle}>Lucid Insights</div>

          {/* Triggers */}
          {lucidStats.topTriggers.length > 0 && (
            <div style={{ marginBottom: lucidStats.topDurations.length > 0 ? 24 : 0 }}>
              <div style={{ fontSize: 12, color: "#8a7540", marginBottom: 12, letterSpacing: 1 }}>
                What Triggers Your Lucidity
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {lucidStats.topTriggers.map(([trigger, count]) => (
                  <div key={trigger} style={{
                    background: "rgba(120,60,220,0.15)",
                    border: "1px solid rgba(140,100,220,0.25)",
                    borderRadius: 12,
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 13, color: "#d4b8ff" }}>{trigger}</span>
                    <span style={{
                      background: "rgba(140,100,220,0.3)",
                      borderRadius: 8,
                      padding: "1px 7px",
                      fontSize: 11,
                      color: "#b090e8",
                    }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duration breakdown */}
          {lucidStats.topDurations.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "#8a7540", marginBottom: 12, letterSpacing: 1 }}>
                How Long Lucidity Lasts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lucidStats.topDurations.map(([duration, count]) => {
                  const pct = lucidStats.lucidCount > 0 ? (count / lucidStats.lucidCount) * 100 : 0;
                  return (
                    <div key={duration} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#d4b8ff", minWidth: 120 }}>{duration}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(30,12,60,0.6)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.max(pct, 4)}%`,
                          borderRadius: 3,
                          background: "linear-gradient(90deg, #6847c0, #9066d4)",
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#8a7540", minWidth: 24, textAlign: "right" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== REALITY CHECK TRAINER (second) ========== */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Reality Check Trainer</div>
        <div
          style={{
            fontSize: 13,
            color: "#8a7540",
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
            background: "rgba(140,90,5,0.15)",
            border: "1px solid rgba(200,160,30,0.2)",
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>🎯</span>
          <span style={{ fontSize: 14, color: "#e8b840" }}>
            Reality checks today:{" "}
            <span style={{ color: "#f5e4b0", fontWeight: 600 }}>{checksToday}</span>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {REALITY_CHECKS.map((check) => (
            <div
              key={check.name}
              style={{
                background: "rgba(30,12,60,0.6)",
                border: "1px solid rgba(200,160,30,0.12)",
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
                <span style={{ fontSize: 14, color: "#f0d890" }}>{check.name}</span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#8a7540",
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
                  background: "rgba(200,160,30,0.2)",
                  border: "1px solid rgba(200,160,30,0.3)",
                  color: "#e8b840",
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

      {/* ========== MILD TECHNIQUE GUIDE (collapsible, last) ========== */}
      <div style={cardStyle}>
        <button
          className="mild-toggle"
          onClick={() => setMildExpanded(!mildExpanded)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
            borderRadius: 8,
            transition: "background 0.2s",
          }}
        >
          <div>
            <div style={sectionTitle}>MILD Technique</div>
            <div style={{ fontSize: 14, color: "#8a7540", textAlign: "left" }}>
              Mnemonic Induction of Lucid Dreams
            </div>
          </div>
          <div style={{
            fontSize: 18,
            color: "#8a7540",
            transition: "transform 0.3s ease",
            transform: mildExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}>
            ▼
          </div>
        </button>

        {mildExpanded && (
          <div style={{ marginTop: 20, animation: "fadeIn 0.3s ease" }}>
            <div
              style={{
                fontSize: 13,
                color: "#8a7540",
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
                    border: "1px solid rgba(200,160,30,0.1)",
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
                      background: "linear-gradient(135deg, #7a5200, #c89020)",
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
                    <div style={{ fontSize: 15, color: "#f0d890", marginBottom: 4 }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#8a7540", lineHeight: 1.6 }}>
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
