import { useState } from "react";

const MOODS = ["✨ Magical", "😨 Frightening", "😌 Peaceful", "😕 Confusing", "😢 Sad", "🤩 Exciting", "😶 Neutral", "💭 Nostalgic"];
const THEMES = ["Adventure", "Romance", "Mystery", "Fantasy", "Nightmare", "Spiritual", "Mundane", "Surreal"];

export default function SearchBar({ searchQuery, setSearchQuery, filters, setFilters }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Search dreams by title, description, or tags..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, background: "rgba(20,8,50,0.7)", border: "1px solid rgba(160,100,255,0.2)",
            borderRadius: 40, padding: "12px 20px", color: "#e8d5ff", fontSize: 14,
            outline: "none", fontFamily: "Georgia, serif"
          }}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters ? "rgba(160,100,255,0.25)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showFilters ? "rgba(160,100,255,0.6)" : "rgba(255,255,255,0.1)"}`,
            color: showFilters ? "#d4aaff" : "#8070aa",
            padding: "10px 18px", borderRadius: 40, fontSize: 13, cursor: "pointer"
          }}
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <div style={{
          display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap",
          animation: "fadeIn 0.2s ease"
        }}>
          <select
            value={filters.mood || ""}
            onChange={e => setFilters(f => ({ ...f, mood: e.target.value }))}
            style={{
              background: "rgba(20,5,50,0.9)", border: "1px solid rgba(160,100,255,0.2)",
              borderRadius: 10, padding: "9px 14px", color: filters.mood ? "#e8d5ff" : "#7060aa",
              fontSize: 13, outline: "none"
            }}
          >
            <option value="">All Moods</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={filters.theme || ""}
            onChange={e => setFilters(f => ({ ...f, theme: e.target.value }))}
            style={{
              background: "rgba(20,5,50,0.9)", border: "1px solid rgba(160,100,255,0.2)",
              borderRadius: 10, padding: "9px 14px", color: filters.theme ? "#e8d5ff" : "#7060aa",
              fontSize: 13, outline: "none"
            }}
          >
            <option value="">All Themes</option>
            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8070aa", cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={filters.lucidOnly || false}
              onChange={e => setFilters(f => ({ ...f, lucidOnly: e.target.checked }))}
              style={{ accentColor: "#9040ee" }}
            />
            Lucid only
          </label>

          {(filters.mood || filters.theme || filters.lucidOnly) && (
            <button
              onClick={() => setFilters({ mood: "", theme: "", lucidOnly: false })}
              style={{
                background: "none", border: "1px solid rgba(255,100,100,0.3)",
                color: "#ff9999", padding: "8px 16px", borderRadius: 20,
                fontSize: 12, cursor: "pointer"
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
