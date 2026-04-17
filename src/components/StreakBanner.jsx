export default function StreakBanner({ streak, longestStreak, lastDreamDate, dreams = [], onRecordDream }) {
  const today = new Date().toISOString().split("T")[0];
  const loggedToday = lastDreamDate === today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // eslint-disable-line react-hooks/purity
  const atRisk = lastDreamDate === yesterday && !loggedToday;
  const streakLost = streak === 0 && lastDreamDate && lastDreamDate < yesterday;

  if (streak === 0 && !atRisk && !streakLost) return null;

  // Milestone celebrations
  const milestones = [7, 14, 30, 50, 100, 200, 365];
  const isMilestone = loggedToday && milestones.includes(streak);
  const nextMilestone = milestones.find(m => m > streak) || streak + 10;

  // Build last 7 days mini calendar
  const last7 = [];
  const dreamDates = new Set(dreams.map(d => d.created_at?.split("T")[0]).filter(Boolean));
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const nowMs = Date.now(); // eslint-disable-line react-hooks/purity
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    last7.push({
      dateStr,
      dayLabel: dayLabels[d.getDay()],
      hasDream: dreamDates.has(dateStr),
      isToday: dateStr === today,
    });
  }

  // Motivational messages by streak range
  const getMessage = () => {
    if (streakLost) return "Your streak ended, but every journey begins anew. Record a dream to start fresh.";
    if (atRisk) return "Your streak is at risk! Record a dream before midnight to keep it alive.";
    if (isMilestone) {
      if (streak >= 365) return "A full year of dreams. You've built something remarkable.";
      if (streak >= 100) return "Triple digits. Your dream journal is a treasure trove of insight.";
      if (streak >= 50) return "50 days of dedication. Patterns are revealing themselves.";
      if (streak >= 30) return "A full month! Your dream recall is stronger than ever.";
      if (streak >= 14) return "Two weeks strong. Your dream world is opening up.";
      return "One week down. The habit is taking root.";
    }
    if (loggedToday) {
      if (streak >= 30) return "Remarkable consistency. Your dreams are grateful.";
      if (streak >= 7) return "The rhythm is strong. Keep going.";
      return "Dream recorded today. Keep it going!";
    }
    return "Record a dream to keep your streak alive.";
  };

  return (
    <div style={{
      background: streakLost
        ? "linear-gradient(135deg, rgba(120,80,40,0.15), rgba(100,60,30,0.1))"
        : atRisk
          ? "linear-gradient(135deg, rgba(200,100,50,0.18), rgba(200,50,50,0.12))"
          : isMilestone
            ? "linear-gradient(135deg, rgba(200,160,30,0.2), rgba(180,120,10,0.15))"
            : loggedToday
              ? "linear-gradient(135deg, rgba(50,180,100,0.15), rgba(80,200,120,0.1))"
              : "linear-gradient(135deg, rgba(100,60,200,0.15), rgba(200,160,30,0.1))",
      border: `1px solid ${
        streakLost ? "rgba(120,80,40,0.3)"
        : atRisk ? "rgba(200,100,50,0.3)"
        : isMilestone ? "rgba(200,160,30,0.4)"
        : loggedToday ? "rgba(80,200,120,0.3)"
        : "rgba(200,160,30,0.2)"
      }`,
      borderRadius: 16, padding: "14px 16px", marginBottom: 20,
      animation: "fadeIn 0.4s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Streak flame/icon */}
        <div style={{
          fontSize: 32, lineHeight: 1, flexShrink: 0,
          filter: isMilestone ? "drop-shadow(0 0 8px rgba(232,184,64,0.6))" : "none",
        }}>
          {streakLost ? "💤" : atRisk ? "⚠️" : isMilestone ? "🏆" : "🔥"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Streak count */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 22, color: isMilestone ? "#e8c840" : streakLost ? "#8a7540" : "#f5e4b0",
              fontWeight: 600, lineHeight: 1,
            }}>
              {streakLost ? "0" : streak}
            </span>
            <span style={{ fontSize: 13, color: "#c8a040" }}>
              day{streak !== 1 ? "s" : ""}
            </span>
            {longestStreak > streak && (
              <span style={{ fontSize: 11, color: "#6b5c30" }}>
                Best: {longestStreak}
              </span>
            )}
            {streak === longestStreak && streak > 0 && loggedToday && (
              <span style={{
                fontSize: 10, color: "#e8b840", background: "rgba(232,184,64,0.15)",
                padding: "1px 8px", borderRadius: 10, border: "1px solid rgba(232,184,64,0.25)",
              }}>
                Personal best!
              </span>
            )}
          </div>

          {/* Status message */}
          <div style={{ fontSize: 12, color: "#9a8050", marginTop: 3, lineHeight: 1.4 }}>
            {getMessage()}
          </div>
        </div>

        {/* Progress ring toward next milestone */}
        {!streakLost && !atRisk && (() => {
          const prev = [...milestones].reverse().find(m => m <= streak) || 0;
          const progress = (streak - prev) / (nextMilestone - prev);
          return (
            <div style={{
              position: "relative", width: 44, height: 44, flexShrink: 0,
            }}>
              <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="22" cy="22" r="18" fill="none"
                  stroke="rgba(200,160,30,0.15)" strokeWidth="3" />
                <circle cx="22" cy="22" r="18" fill="none"
                  stroke={loggedToday ? "rgba(80,200,120,0.6)" : "rgba(200,160,30,0.4)"}
                  strokeWidth="3"
                  strokeDasharray={`${progress * 113} 113`}
                  strokeLinecap="round" />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#8a7540", fontWeight: 600,
              }}>
                {nextMilestone}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 7-day mini calendar */}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 12,
        padding: "8px 4px 4px", borderTop: "1px solid rgba(200,160,30,0.1)",
      }}>
        {last7.map((day, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            flex: 1,
          }}>
            <span style={{
              fontSize: 10, color: day.isToday ? "#f5e4b0" : "#6b5c30",
              fontWeight: day.isToday ? 700 : 400,
              fontFamily: "Georgia, serif",
            }}>
              {day.dayLabel}
            </span>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: day.hasDream
                ? "linear-gradient(135deg, rgba(80,200,120,0.4), rgba(50,180,100,0.3))"
                : day.isToday
                  ? "rgba(200,160,30,0.12)"
                  : "rgba(200,160,30,0.05)",
              border: day.isToday
                ? "1.5px solid rgba(200,160,30,0.4)"
                : day.hasDream
                  ? "1px solid rgba(80,200,120,0.3)"
                  : "1px solid rgba(200,160,30,0.08)",
            }}>
              {day.hasDream ? (
                <span style={{ fontSize: 10, color: "#7fbf6b" }}>✓</span>
              ) : day.isToday ? (
                <span style={{ fontSize: 8, color: "#8a7540" }}>-</span>
              ) : (
                <span style={{ fontSize: 8, color: "#4a3a20" }}>-</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Record CTA when at risk or lost */}
      {(atRisk || streakLost) && onRecordDream && (
        <button
          onClick={onRecordDream}
          style={{
            width: "100%", marginTop: 10,
            background: atRisk
              ? "linear-gradient(135deg, rgba(200,100,50,0.3), rgba(200,80,40,0.2))"
              : "linear-gradient(135deg, rgba(200,160,30,0.2), rgba(180,120,10,0.15))",
            border: `1px solid ${atRisk ? "rgba(200,100,50,0.4)" : "rgba(200,160,30,0.3)"}`,
            color: atRisk ? "#f0a060" : "#e8b840",
            padding: "10px 0",
            borderRadius: 12,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {streakLost ? "Start a new streak" : "Record a dream now"}
        </button>
      )}
    </div>
  );
}
