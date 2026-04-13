import { useState } from "react";
import DreamSelect from "./DreamSelect";

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
            flex: 1, background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.2)",
            borderRadius: 40, padding: "12px 20px", color: "#f5e4b0", fontSize: 14,
            outline: "none", fontFamily: "Georgia, serif"
          }}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters ? "rgba(200,160,30,0.25)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showFilters ? "rgba(200,160,30,0.6)" : "rgba(255,255,255,0.1)"}`,
            color: showFilters ? "#f0c840" : "#7a6a40",
            padding: "10px 18px", borderRadius: 40, fontSize: 13, cursor: "pointer"
          }}
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <div style={{
          display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap",
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

          <label style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#7a6a40", cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={filters.lucidOnly || false}
              onChange={e => setFilters(f => ({ ...f, lucidOnly: e.target.checked }))}
              style={{ accentColor: "#c89020" }}
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
