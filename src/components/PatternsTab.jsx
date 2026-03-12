import { useState, useEffect } from "react";

const DREAM_DICTIONARY = {
  flying: { symbol: "✈️", meaning: "Freedom, ambition" },
  falling: { symbol: "⬇️", meaning: "Loss of control" },
  water: { symbol: "🌊", meaning: "Emotions" },
  fire: { symbol: "🔥", meaning: "Passion, transformation" },
  death: { symbol: "💀", meaning: "Endings and new beginnings" },
  teeth: { symbol: "🦷", meaning: "Anxiety about appearance" },
  chase: { symbol: "🏃", meaning: "Avoidance" },
  house: { symbol: "🏠", meaning: "The self or psyche" },
  snake: { symbol: "🐍", meaning: "Hidden fears" },
  ocean: { symbol: "🌊", meaning: "The unconscious" },
  forest: { symbol: "🌲", meaning: "Mystery and unknown" },
  school: { symbol: "🏫", meaning: "Learning, judgment" },
  baby: { symbol: "👶", meaning: "New beginnings" },
  car: { symbol: "🚗", meaning: "Control over direction" },
  mirror: { symbol: "🪞", meaning: "Self-reflection" },
  clock: { symbol: "⏰", meaning: "Anxiety about time" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fadeIn = `
@keyframes fadeInPatterns {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const cardBase = {
  background: "rgba(20,8,50,0.7)",
  border: "1px solid rgba(160,100,255,0.15)",
  borderRadius: 18,
  padding: "22px 24px",
  fontFamily: "Georgia, serif",
  animation: "fadeInPatterns 0.5s ease both",
};

const sectionTitle = {
  fontFamily: "Georgia, serif",
  fontSize: 20,
  color: "#e8d5ff",
  margin: "0 0 18px 0",
  letterSpacing: 0.3,
};

const subText = {
  fontFamily: "Georgia, serif",
  color: "#7060aa",
  fontSize: 13,
};

function extractSymbols(dreams) {
  const counts = {};
  const symbolDictKeys = Object.keys(DREAM_DICTIONARY);
  dreams.forEach((d) => {
    const text = `${d.title || ""} ${d.content || ""} ${d.interpretation || ""}`.toLowerCase();
    symbolDictKeys.forEach((key) => {
      if (text.includes(key)) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
  });
  return counts;
}

function extractCharacters(dreams) {
  const counts = {};
  dreams.forEach((d) => {
    if (d.characters && Array.isArray(d.characters)) {
      d.characters.forEach((c) => {
        const name = c.trim().toLowerCase();
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    } else if (typeof d.characters === "string" && d.characters.trim()) {
      d.characters
        .split(/[,;]+/)
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
        .forEach((name) => {
          counts[name] = (counts[name] || 0) + 1;
        });
    }
  });
  return counts;
}

function computeStreak(dreams) {
  if (!dreams.length) return { current: 0, longest: 0 };
  const dates = new Set(
    dreams.map((d) => new Date(d.created_at).toISOString().slice(0, 10))
  );
  const sorted = [...dates].sort().reverse();

  let current = 0;
  const today = new Date();
  const checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const key = checkDate.toISOString().slice(0, 10);
    if (dates.has(key)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterday = checkDate.toISOString().slice(0, 10);
        if (dates.has(yesterday)) {
          current = 1;
          checkDate.setDate(checkDate.getDate() - 1);
          while (dates.has(checkDate.toISOString().slice(0, 10))) {
            current++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }
      break;
    }
  }

  let longest = 0;
  let run = 0;
  const allSorted = [...dates].sort();
  for (let i = 0; i < allSorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(allSorted[i - 1]);
      const curr = new Date(allSorted[i]);
      const diff = (curr - prev) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
  }

  return { current, longest };
}

function HorizontalBar({ label, value, maxValue, color, emoji }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ color: "#e8d5ff", fontFamily: "Georgia, serif", fontSize: 14 }}>
          {emoji ? `${emoji} ` : ""}{label}
        </span>
        <span style={{ color: "#c490ff", fontFamily: "Georgia, serif", fontSize: 13 }}>
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: "rgba(160,100,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 5,
            background: color || "linear-gradient(90deg, #7c3aed, #a855f7)",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, delay }) {
  return (
    <div
      style={{
        ...cardBase,
        padding: "16px 18px",
        textAlign: "center",
        animation: `fadeInPatterns 0.5s ease ${delay || 0}s both`,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 22,
          color: "#e8d5ff",
          fontWeight: "bold",
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div style={{ ...subText, fontSize: 12 }}>{label}</div>
    </div>
  );
}

export default function PatternsTab({ dreams, userSettings }) {
  const [hoveredInsight, setHoveredInsight] = useState(null);

  const moodCounts = {};
  const themeCounts = {};
  const dayOfWeekCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  let lucidCount = 0;
  let totalSleepQuality = 0;
  let sleepQualityCount = 0;
  const sleepQualityMoods = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const symbolMoodMap = {};

  dreams.forEach((d) => {
    if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
    if (d.theme) themeCounts[d.theme] = (themeCounts[d.theme] || 0) + 1;

    const day = DAYS[new Date(d.created_at).getDay()];
    dayOfWeekCounts[day]++;

    if (d.is_lucid || d.lucid) lucidCount++;

    const sq = d.sleep_quality || d.sleepQuality;
    if (sq && sq >= 1 && sq <= 5) {
      totalSleepQuality += sq;
      sleepQualityCount++;
      if (d.mood) sleepQualityMoods[sq].push(d.mood);
    }

    const text = `${d.title || ""} ${d.content || ""} ${d.interpretation || ""}`.toLowerCase();
    Object.keys(DREAM_DICTIONARY).forEach((key) => {
      if (text.includes(key)) {
        if (!symbolMoodMap[key]) symbolMoodMap[key] = {};
        if (d.mood) {
          symbolMoodMap[key][d.mood] = (symbolMoodMap[key][d.mood] || 0) + 1;
        }
      }
    });
  });

  const symbolCounts = extractSymbols(dreams);
  const characterCounts = extractCharacters(dreams);
  const streaks = computeStreak(dreams);

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
  const totalSymbols = Object.values(symbolCounts).reduce((a, b) => a + b, 0);
  const lucidPct = dreams.length > 0 ? ((lucidCount / dreams.length) * 100).toFixed(0) : 0;
  const avgSleep = sleepQualityCount > 0 ? (totalSleepQuality / sleepQualityCount).toFixed(1) : "N/A";

  const maxMoodCount = Math.max(...Object.values(moodCounts), 1);
  const maxThemeCount = Math.max(...Object.values(themeCounts), 1);
  const maxDayCount = Math.max(...Object.values(dayOfWeekCounts), 1);

  const sortedSymbols = Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const sortedCharacters = Object.entries(characterCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Pattern insights
  const insights = [];
  Object.entries(symbolMoodMap).forEach(([symbol, moods]) => {
    const totalForSymbol = Object.values(moods).reduce((a, b) => a + b, 0);
    Object.entries(moods).forEach(([mood, count]) => {
      const overallMoodRate = (moodCounts[mood] || 0) / dreams.length;
      const symbolMoodRate = count / totalForSymbol;
      if (overallMoodRate > 0 && symbolMoodRate > overallMoodRate * 1.5 && count >= 2) {
        const ratio = (symbolMoodRate / overallMoodRate).toFixed(1);
        insights.push({
          symbol,
          mood,
          ratio,
          count,
          text: `You dream about ${DREAM_DICTIONARY[symbol]?.symbol || ""} ${symbol} ${ratio}x more when your mood is ${mood}`,
        });
      }
    });
  });
  insights.sort((a, b) => b.ratio - a.ratio);

  // Sleep quality correlation
  const sleepQualityCorrelation = {};
  for (let q = 1; q <= 5; q++) {
    const moods = sleepQualityMoods[q];
    if (moods.length > 0) {
      const moodCount = {};
      moods.forEach((m) => (moodCount[m] = (moodCount[m] || 0) + 1));
      const topMoodForQ = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];
      sleepQualityCorrelation[q] = {
        count: moods.length,
        topMood: topMoodForQ ? topMoodForQ[0] : "N/A",
      };
    }
  }

  const moodColors = [
    "linear-gradient(90deg, #7c3aed, #a855f7)",
    "linear-gradient(90deg, #6d28d9, #8b5cf6)",
    "linear-gradient(90deg, #5b21b6, #7c3aed)",
    "linear-gradient(90deg, #4c1d95, #6d28d9)",
    "linear-gradient(90deg, #3b0764, #5b21b6)",
    "linear-gradient(90deg, #2e1065, #4c1d95)",
    "linear-gradient(90deg, #581c87, #9333ea)",
    "linear-gradient(90deg, #6b21a8, #a855f7)",
  ];

  if (!dreams.length) {
    return (
      <div style={{ ...cardBase, textAlign: "center", padding: 48 }}>
        <style>{fadeIn}</style>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
        <div style={{ ...sectionTitle, marginBottom: 8 }}>No Dreams Yet</div>
        <div style={{ ...subText, fontSize: 15 }}>
          Start recording your dreams to see patterns and insights emerge.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      <style>{fadeIn}</style>

      {/* Summary Stat Cards - 2x2 grid on small, 4 columns on wide */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard icon="📖" label="Dreams Recorded" value={dreams.length} delay={0} />
        <StatCard
          icon={topMood ? topMood[0].split(" ")[0] : "💭"}
          label="Top Mood"
          value={topMood ? topMood[0].split(" ").slice(1).join(" ") : "N/A"}
          delay={0.05}
        />
        <StatCard
          icon="🎭"
          label="Favorite Theme"
          value={topTheme ? topTheme[0] : "N/A"}
          delay={0.1}
        />
        <StatCard icon="🔣" label="Symbols Found" value={totalSymbols} delay={0.15} />
        <StatCard icon="🔥" label="Current Streak" value={`${streaks.current}d`} delay={0.2} />
        <StatCard icon="🏆" label="Longest Streak" value={`${streaks.longest}d`} delay={0.25} />
        <StatCard icon="🌙" label="Lucid Dream %" value={`${lucidPct}%`} delay={0.3} />
        <StatCard icon="😴" label="Avg Sleep Quality" value={avgSleep} delay={0.35} />
      </div>

      {/* Mood Distribution */}
      <div style={{ ...cardBase, marginBottom: 22, animationDelay: "0.1s" }}>
        <h3 style={sectionTitle}>Mood Distribution</h3>
        {Object.entries(moodCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([mood, count], i) => (
            <HorizontalBar
              key={mood}
              label={mood.split(" ").slice(1).join(" ")}
              emoji={mood.split(" ")[0]}
              value={count}
              maxValue={dreams.length}
              color={moodColors[i % moodColors.length]}
            />
          ))}
        {Object.keys(moodCounts).length === 0 && (
          <div style={subText}>No mood data recorded yet.</div>
        )}
      </div>

      {/* Theme Distribution */}
      <div style={{ ...cardBase, marginBottom: 22, animationDelay: "0.15s" }}>
        <h3 style={sectionTitle}>Theme Distribution</h3>
        {Object.entries(themeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([theme, count], i) => (
            <HorizontalBar
              key={theme}
              label={theme}
              value={count}
              maxValue={dreams.length}
              color={moodColors[i % moodColors.length]}
            />
          ))}
        {Object.keys(themeCounts).length === 0 && (
          <div style={subText}>No theme data recorded yet.</div>
        )}
      </div>

      {/* Top Recurring Symbols */}
      <div style={{ ...cardBase, marginBottom: 22, animationDelay: "0.2s" }}>
        <h3 style={sectionTitle}>Top Recurring Symbols</h3>
        {sortedSymbols.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {sortedSymbols.map(([key, count]) => {
              const entry = DREAM_DICTIONARY[key];
              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 14px",
                    background: "rgba(160,100,255,0.06)",
                    borderRadius: 12,
                    border: "1px solid rgba(160,100,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{entry?.symbol || "?"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#e8d5ff",
                        fontFamily: "Georgia, serif",
                        fontSize: 15,
                        textTransform: "capitalize",
                        fontWeight: "bold",
                      }}
                    >
                      {key}
                    </div>
                    <div style={{ ...subText, fontSize: 12 }}>{entry?.meaning}</div>
                  </div>
                  <div
                    style={{
                      background: "rgba(160,100,255,0.15)",
                      padding: "4px 12px",
                      borderRadius: 20,
                      color: "#c490ff",
                      fontFamily: "Georgia, serif",
                      fontSize: 13,
                      fontWeight: "bold",
                    }}
                  >
                    {count}x
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={subText}>No symbols detected yet. Keep recording dreams!</div>
        )}
      </div>

      {/* Dream Characters */}
      <div style={{ ...cardBase, marginBottom: 22, animationDelay: "0.25s" }}>
        <h3 style={sectionTitle}>Dream Characters</h3>
        {sortedCharacters.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {sortedCharacters.map(([name, count], i) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                  background: "rgba(160,100,255,0.06)",
                  borderRadius: 10,
                  border: "1px solid rgba(160,100,255,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: "#fff",
                      fontFamily: "Georgia, serif",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      color: "#e8d5ff",
                      fontFamily: "Georgia, serif",
                      fontSize: 14,
                      textTransform: "capitalize",
                    }}
                  >
                    {name}
                  </span>
                </div>
                <span
                  style={{
                    color: "#c490ff",
                    fontFamily: "Georgia, serif",
                    fontSize: 13,
                  }}
                >
                  {count} {count === 1 ? "dream" : "dreams"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={subText}>No character data found. Add characters to your dream entries!</div>
        )}
      </div>

      {/* Pattern Insights */}
      <div style={{ ...cardBase, marginBottom: 22, animationDelay: "0.3s" }}>
        <h3 style={sectionTitle}>Pattern Insights</h3>
        {insights.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {insights.slice(0, 8).map((ins, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredInsight(i)}
                onMouseLeave={() => setHoveredInsight(null)}
                style={{
                  padding: "12px 16px",
                  background:
                    hoveredInsight === i
                      ? "rgba(160,100,255,0.12)"
                      : "rgba(160,100,255,0.05)",
                  borderRadius: 12,
                  border: "1px solid rgba(160,100,255,0.12)",
                  color: "#e8d5ff",
                  fontFamily: "Georgia, serif",
                  fontSize: 14,
                  lineHeight: 1.5,
                  transition: "background 0.2s ease",
                  cursor: "default",
                }}
              >
                <span style={{ marginRight: 8 }}>💡</span>
                {ins.text}
              </div>
            ))}
          </div>
        ) : (
          <div style={subText}>
            Record more dreams to discover patterns between your symbols and moods.
          </div>
        )}
      </div>

      {/* Sleep Quality Correlation */}
      <div style={{ ...cardBase, marginBottom: 22, animationDelay: "0.35s" }}>
        <h3 style={sectionTitle}>Sleep Quality Correlation</h3>
        {Object.keys(sleepQualityCorrelation).length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((q) => {
              const data = sleepQualityCorrelation[q];
              return (
                <div
                  key={q}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 14px",
                    background: "rgba(160,100,255,0.05)",
                    borderRadius: 10,
                    border: "1px solid rgba(160,100,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 3,
                      minWidth: 80,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          color: star <= q ? "#a855f7" : "rgba(160,100,255,0.2)",
                          fontSize: 14,
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {data ? (
                    <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#e8d5ff", fontFamily: "Georgia, serif", fontSize: 13 }}>
                        Top mood: {data.topMood}
                      </span>
                      <span style={{ color: "#7060aa", fontFamily: "Georgia, serif", fontSize: 12 }}>
                        {data.count} {data.count === 1 ? "dream" : "dreams"}
                      </span>
                    </div>
                  ) : (
                    <span style={{ ...subText, fontSize: 12 }}>No data</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={subText}>
            Add sleep quality ratings to your dreams to see correlations.
          </div>
        )}
      </div>

      {/* Weekly Dream Frequency */}
      <div style={{ ...cardBase, animationDelay: "0.4s" }}>
        <h3 style={sectionTitle}>Weekly Dream Frequency</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {DAYS.map((day) => {
            const count = dayOfWeekCounts[day];
            const height = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
            return (
              <div
                key={day}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    height: 100,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "70%",
                      height: `${Math.max(height, 4)}%`,
                      background: "linear-gradient(180deg, #a855f7, #6d28d9)",
                      borderRadius: "6px 6px 2px 2px",
                      transition: "height 0.5s ease",
                      minHeight: 4,
                    }}
                  />
                </div>
                <div style={{ color: "#c490ff", fontFamily: "Georgia, serif", fontSize: 12 }}>
                  {count}
                </div>
                <div style={{ color: "#6050a0", fontFamily: "Georgia, serif", fontSize: 11 }}>
                  {day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
