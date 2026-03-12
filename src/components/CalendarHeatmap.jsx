import { useState, useMemo } from "react";

const fadeIn = `
@keyframes fadeInHeatmap {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const CELL_SIZE = 14;
const CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COLORS = {
  0: "rgba(160,100,255,0.06)",
  1: "rgba(160,100,255,0.25)",
  2: "rgba(160,100,255,0.50)",
  3: "rgba(168,85,247,0.80)",
};

function getColor(count) {
  if (count === 0) return COLORS[0];
  if (count === 1) return COLORS[1];
  if (count === 2) return COLORS[2];
  return COLORS[3];
}

function formatDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

const cardBase = {
  background: "rgba(20,8,50,0.7)",
  border: "1px solid rgba(160,100,255,0.15)",
  borderRadius: 18,
  padding: "22px 24px",
  fontFamily: "Georgia, serif",
  animation: "fadeInHeatmap 0.5s ease both",
};

const sectionTitle = {
  fontFamily: "Georgia, serif",
  fontSize: 20,
  color: "#e8d5ff",
  margin: "0 0 18px 0",
  letterSpacing: 0.3,
};

export default function CalendarHeatmap({ dreams }) {
  const [tooltip, setTooltip] = useState(null);

  const { grid, monthLabels, dreamsByDate, monthlyData } = useMemo(() => {
    // Count dreams per date
    const byDate = {};
    (dreams || []).forEach((d) => {
      const key = new Date(d.created_at).toISOString().slice(0, 10);
      byDate[key] = (byDate[key] || 0) + 1;
    });

    // Build grid: 52 weeks ending at current week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0=Sun

    // End date is today, start date is ~52 weeks ago on a Sunday
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (52 * 7 + dayOfWeek));

    const weeks = [];
    const months = [];
    let lastMonth = -1;
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const week = [];
      const weekStartMonth = cursor.getMonth();

      if (weekStartMonth !== lastMonth) {
        months.push({
          label: MONTH_NAMES[weekStartMonth],
          weekIndex: weeks.length,
        });
        lastMonth = weekStartMonth;
      }

      for (let d = 0; d < 7; d++) {
        if (cursor <= endDate) {
          const dateStr = formatDateStr(cursor);
          week.push({
            date: dateStr,
            count: byDate[dateStr] || 0,
            future: cursor > today,
          });
        } else {
          week.push(null);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    // Monthly dream counts for bar chart
    const monthly = {};
    const monthCursor = new Date(startDate);
    while (monthCursor <= endDate) {
      const key = `${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) {
        monthly[key] = {
          label: `${MONTH_NAMES[monthCursor.getMonth()]} ${monthCursor.getFullYear() % 100}`,
          count: 0,
        };
      }
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
    Object.entries(byDate).forEach(([dateStr, count]) => {
      const d = new Date(dateStr + "T00:00:00");
      if (d >= startDate && d <= endDate) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthly[key]) monthly[key].count += count;
      }
    });

    return {
      grid: weeks,
      monthLabels: months,
      dreamsByDate: byDate,
      monthlyData: Object.values(monthly),
    };
  }, [dreams]);

  const totalWidth = grid.length * (CELL_SIZE + CELL_GAP) + 40;
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      <style>{fadeIn}</style>

      {/* Heatmap Card */}
      <div style={{ ...cardBase, marginBottom: 22, overflowX: "auto" }}>
        <h3 style={sectionTitle}>Dream Activity</h3>
        <div style={{ position: "relative", minWidth: totalWidth }}>
          {/* Month labels */}
          <div style={{ display: "flex", marginLeft: 40, marginBottom: 6, height: 16 }}>
            {monthLabels.map((m, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 40 + m.weekIndex * (CELL_SIZE + CELL_GAP),
                  color: "#6050a0",
                  fontSize: 11,
                  fontFamily: "Georgia, serif",
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "flex", marginTop: 20 }}>
            {/* Day labels */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: CELL_GAP,
                marginRight: 6,
                width: 30,
              }}
            >
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  style={{
                    height: CELL_SIZE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    color: "#6050a0",
                    fontSize: 10,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div style={{ display: "flex", gap: CELL_GAP }}>
              {grid.map((week, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: CELL_GAP }}>
                  {week.map((day, di) => {
                    if (!day) {
                      return (
                        <div
                          key={di}
                          style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                          }}
                        />
                      );
                    }
                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => {
                          const rect = e.target.getBoundingClientRect();
                          setTooltip({
                            date: day.date,
                            count: day.count,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: 3,
                          background: day.future ? "transparent" : getColor(day.count),
                          border: day.future
                            ? "1px solid rgba(160,100,255,0.05)"
                            : "1px solid rgba(160,100,255,0.08)",
                          cursor: "default",
                          transition: "background 0.15s ease",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              style={{
                position: "fixed",
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
                background: "rgba(30,15,60,0.95)",
                border: "1px solid rgba(160,100,255,0.3)",
                borderRadius: 8,
                padding: "6px 12px",
                color: "#e8d5ff",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 2 }}>
                {formatDisplayDate(tooltip.date)}
              </div>
              <div style={{ color: "#c490ff" }}>
                {tooltip.count === 0
                  ? "No dreams recorded"
                  : `${tooltip.count} dream${tooltip.count > 1 ? "s" : ""} recorded`}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 18,
            justifyContent: "flex-end",
          }}
        >
          <span style={{ color: "#6050a0", fontSize: 11, fontFamily: "Georgia, serif" }}>Less</span>
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 3,
                background: COLORS[level],
                border: "1px solid rgba(160,100,255,0.08)",
              }}
            />
          ))}
          <span style={{ color: "#6050a0", fontSize: 11, fontFamily: "Georgia, serif" }}>More</span>
        </div>
      </div>

      {/* Monthly Dream Count Bar Chart */}
      <div style={{ ...cardBase, animationDelay: "0.1s" }}>
        <h3 style={sectionTitle}>Monthly Dream Count</h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 140,
            overflowX: "auto",
            paddingBottom: 28,
            position: "relative",
          }}
        >
          {monthlyData.map((m, i) => {
            const barHeight = maxMonthly > 0 ? (m.count / maxMonthly) * 110 : 0;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: "1 0 auto",
                  minWidth: 32,
                }}
              >
                <span
                  style={{
                    color: "#c490ff",
                    fontSize: 11,
                    fontFamily: "Georgia, serif",
                    marginBottom: 4,
                  }}
                >
                  {m.count || ""}
                </span>
                <div
                  style={{
                    width: 22,
                    height: Math.max(barHeight, 3),
                    background: "linear-gradient(180deg, #a855f7, #6d28d9)",
                    borderRadius: "4px 4px 2px 2px",
                    transition: "height 0.5s ease",
                  }}
                />
                <span
                  style={{
                    color: "#6050a0",
                    fontSize: 10,
                    fontFamily: "Georgia, serif",
                    marginTop: 6,
                    writingMode: "vertical-lr",
                    transform: "rotate(180deg)",
                    height: 28,
                  }}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
