export default function StreakBanner({ streak, longestStreak, lastDreamDate }) {
  const today = new Date().toISOString().split("T")[0];
  const loggedToday = lastDreamDate === today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // eslint-disable-line react-hooks/purity
  const atRisk = lastDreamDate === yesterday && !loggedToday;

  if (streak === 0 && !atRisk) return null;

  // Milestone celebrations
  const milestones = [7, 14, 30, 50, 100];
  const isMilestone = loggedToday && milestones.includes(streak);

  return (
    <div style={{
      background: atRisk
        ? "linear-gradient(135deg, rgba(200,100,50,0.18), rgba(200,50,50,0.12))"
        : isMilestone
          ? "linear-gradient(135deg, rgba(200,160,30,0.2), rgba(180,120,10,0.15))"
          : loggedToday
            ? "linear-gradient(135deg, rgba(50,180,100,0.15), rgba(80,200,120,0.1))"
            : "linear-gradient(135deg, rgba(100,60,200,0.15), rgba(200,160,30,0.1))",
      border: `1px solid ${
        atRisk ? "rgba(200,100,50,0.3)"
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
          {atRisk ? "⚠️" : isMilestone ? "🏆" : loggedToday ? "🔥" : "🔥"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Streak count */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 22, color: isMilestone ? "#e8c840" : "#f5e4b0",
              fontWeight: 600, lineHeight: 1,
            }}>
              {streak}
            </span>
            <span style={{ fontSize: 13, color: "#c8a040" }}>
              day{streak !== 1 ? "s" : ""}
            </span>
            {longestStreak > streak && (
              <span style={{ fontSize: 11, color: "#6b5c30" }}>
                Best: {longestStreak}
              </span>
            )}
          </div>

          {/* Status message */}
          <div style={{ fontSize: 12, color: "#9a8050", marginTop: 3, lineHeight: 1.4 }}>
            {isMilestone
              ? `${streak}-day milestone reached!`
              : atRisk
                ? "Your streak is at risk. Record a dream today!"
                : loggedToday
                  ? "Dream recorded today. Keep it going!"
                  : "Record a dream to keep your streak alive"
            }
          </div>
        </div>

        {/* Progress ring toward next milestone */}
        {!atRisk && (() => {
          const next = milestones.find(m => m > streak) || streak + 10;
          const prev = [...milestones].reverse().find(m => m <= streak) || 0;
          const progress = (streak - prev) / (next - prev);
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
                {next}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
