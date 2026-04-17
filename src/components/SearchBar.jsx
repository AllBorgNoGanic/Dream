import { useState, useEffect, useRef } from "react";
import DreamSelect from "./DreamSelect";

const MOODS = ["✨ Magical", "😨 Frightening", "😌 Peaceful", "😕 Confusing", "😢 Sad", "🤩 Exciting", "😶 Neutral", "💭 Nostalgic"];
const THEMES = ["Adventure", "Romance", "Mystery", "Fantasy", "Nightmare", "Spiritual", "Mundane", "Surreal"];
const DATE_RANGES = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];
const INTERPRETATION_STATES = ["Has interpretation", "Awaiting reflection"];
const SORT_OPTIONS = ["Newest first", "Oldest first", "Longest sleep", "Best sleep quality"];

export default function SearchBar({ searchQuery, setSearchQuery, filters, setFilters, sortBy, setSortBy, resultCount, totalCount }) {
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);

  // Esc to clear search input when focused
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setSearchQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchQuery]);

  const activeFilterCount =
    (filters.mood ? 1 : 0) +
    (filters.theme ? 1 : 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.interpretation ? 1 : 0);

  const clearAll = () => {
    setFilters({ mood: "", theme: "", dateRange: "", interpretation: "" });
    setSearchQuery("");
    if (setSortBy) setSortBy("Newest first");
  };

  const isFiltering = searchQuery || activeFilterCount > 0;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            ref={inputRef}
            placeholder="Search title, description, tags, symbols, interpretation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(6,12,22,0.7)",
              border: "1px solid rgba(200,160,30,0.2)",
              borderRadius: 40,
              padding: "12px 44px 12px 20px",
              color: "#f5e4b0",
              fontSize: 14,
              outline: "none",
              fontFamily: "Georgia, serif"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(200,160,30,0.12)",
                border: "1px solid rgba(200,160,30,0.25)",
                color: "#c8a040",
                width: 26,
                height: 26,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters || activeFilterCount > 0 ? "rgba(200,160,30,0.25)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showFilters || activeFilterCount > 0 ? "rgba(200,160,30,0.6)" : "rgba(255,255,255,0.1)"}`,
            color: showFilters || activeFilterCount > 0 ? "#f0c840" : "#7a6a40",
            padding: "10px 18px",
            borderRadius: 40,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              background: "rgba(200,160,30,0.4)",
              color: "#1a0a30",
              borderRadius: 10,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 700,
              minWidth: 16,
              textAlign: "center",
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div style={{
          display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap",
          alignItems: "center", animation: "fadeIn 0.2s ease"
        }}>
          <DreamSelect
            value={filters.mood || ""}
            onValueChange={(v) => setFilters(f => ({ ...f, mood: v }))}
            placeholder="All Moods"
            options={MOODS}
          />

          <DreamSelect
            value={filters.theme || ""}
            onValueChange={(v) => setFilters(f => ({ ...f, theme: v }))}
            placeholder="All Themes"
            options={THEMES}
          />

          <DreamSelect
            value={filters.dateRange || ""}
            onValueChange={(v) => setFilters(f => ({ ...f, dateRange: v }))}
            placeholder="Any time"
            options={DATE_RANGES}
          />

          <DreamSelect
            value={filters.interpretation || ""}
            onValueChange={(v) => setFilters(f => ({ ...f, interpretation: v }))}
            placeholder="Any status"
            options={INTERPRETATION_STATES}
          />

          {setSortBy && (
            <DreamSelect
              value={sortBy || "Newest first"}
              onValueChange={(v) => setSortBy(v)}
              placeholder="Sort by"
              options={SORT_OPTIONS}
            />
          )}

          {(activeFilterCount > 0 || searchQuery) && (
            <button
              onClick={clearAll}
              style={{
                background: "none", border: "1px solid rgba(255,100,100,0.3)",
                color: "#ff9999", padding: "8px 16px", borderRadius: 20,
                fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {isFiltering && resultCount !== undefined && totalCount !== undefined && (
        <div style={{
          marginTop: 10,
          fontSize: 12,
          color: "#7a6a40",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
        }}>
          {resultCount === 0
            ? `No matches in ${totalCount} dream${totalCount === 1 ? "" : "s"}`
            : `Showing ${resultCount} of ${totalCount} dream${totalCount === 1 ? "" : "s"}`}
        </div>
      )}
    </div>
  );
}
