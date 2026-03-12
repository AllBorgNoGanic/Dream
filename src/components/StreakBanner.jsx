export default function StreakBanner({ streak, longestStreak, lastDreamDate }) {
  const today = new Date().toISOString().split("T")[0];
  const loggedToday = lastDreamDate === today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const atRisk = lastDreamDate === yesterday && !loggedToday;

  if (streak === 0 && !atRisk) return null;

  return (
    <div style={{
      background: atRisk
        ? "linear-gradient(135deg, rgba(200,100,50,0.15), rgba(200,50,50,0.1))"
        : loggedToday
          ? "linear-gradient(135deg, rgba(50,180,100,0.15), rgba(80,200,120,0.1))"
          : "linear-gradient(135deg, rgba(100,60,200,0.15), rgba(160,100,255,0.1))",
      border: `1px solid ${atRisk ? "rgba(200,100,50,0.3)" : loggedToday ? "rgba(80,200,120,0.3)" : "rgba(160,100,255,0.2)"}`,
      borderRadius: 16, padding: "14px 20px", marginBottom: 20,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      animation: "fadeIn 0.4s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>
          {atRisk ? "⚠️" : loggedToday ? "✅" : "🔥"}
        </span>
        <div>
          <div style={{ fontSize: 15, color: "#e8d5ff", fontWeight: 400 }}>
            {streak} day streak{streak > 1 ? "" : ""}
            {atRisk && " — log a dream to keep it!"}
            {loggedToday && " — nice work!"}
          </div>
          <div style={{ fontSize: 12, color: "#7060aa", marginTop: 2 }}>
            Longest: {longestStreak} days
          </div>
        </div>
      </div>
      {!loggedToday && (
        <div style={{
          background: "rgba(160,100,255,0.2)", borderRadius: 20,
          padding: "4px 12px", fontSize: 11, color: "#c490ff"
        }}>
          Dream today!
        </div>
      )}
    </div>
  );
}
