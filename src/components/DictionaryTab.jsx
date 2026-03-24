import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "common", label: "Common" },
  { id: "animals", label: "Animals" },
  { id: "nature", label: "Nature" },
  { id: "people", label: "People" },
  { id: "body", label: "Body" },
  { id: "objects", label: "Objects" },
  { id: "places", label: "Places" },
  { id: "actions", label: "Actions" },
  { id: "emotions", label: "Emotions" },
  { id: "celestial", label: "Celestial" },
  { id: "spiritual", label: "Spiritual" },
  { id: "colors", label: "Colors" },
  { id: "symbols", label: "Symbols" },
  { id: "food", label: "Food" },
];

const PAGE_SIZE = 30;

export default function DictionaryTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const scrollRef = useRef(null);
  const searchTimeout = useRef(null);

  const fetchThemes = useCallback(async (searchTerm, cat, offset = 0, append = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from("dream_themes")
      .select("*", { count: "exact" })
      .order("key", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (cat !== "all") {
      query = query.eq("category", cat);
    }
    if (searchTerm.trim()) {
      query = query.ilike("key", `%${searchTerm.trim()}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("Error fetching themes:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setThemes(prev => append ? [...prev, ...data] : data);
    setTotalCount(count || 0);
    setHasMore((offset + PAGE_SIZE) < (count || 0));
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Initial load and when category changes
  useEffect(() => {
    setThemes([]);
    setHasMore(true);
    fetchThemes(search, category, 0, false);
  }, [category]);

  // Debounced search
  const handleSearch = (value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setThemes([]);
      setHasMore(true);
      fetchThemes(value, category, 0, false);
    }, 300);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchThemes(search, category, themes.length, true);
  };

  // ── Detail View ──────────────────────────────────────────────────────────
  if (selectedTheme) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        {/* Back button */}
        <button
          onClick={() => setSelectedTheme(null)}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#c8a030",
            padding: "8px 18px",
            borderRadius: 30,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            marginBottom: 24,
            transition: "all 0.2s",
          }}
        >
          ← Back to Library
        </button>

        {/* Emoji header with glow */}
        <div style={{
          display: "flex", justifyContent: "center", marginBottom: 24,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 140, height: 140, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(124,58,237,0.05) 50%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            fontSize: 80,
            filter: "drop-shadow(0 0 20px rgba(232,184,64,0.4))",
            position: "relative",
          }}>
            {selectedTheme.symbol}
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 30, fontWeight: 400, color: "#f5e4b0",
          textAlign: "center", textTransform: "capitalize",
          margin: "0 0 20px", fontFamily: "Georgia, serif",
        }}>
          {selectedTheme.key}
        </h2>

        {/* Category badge */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{
            fontSize: 11, color: "#a855f7", background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.2)", borderRadius: 20,
            padding: "4px 14px", fontFamily: "Georgia, serif", textTransform: "capitalize",
          }}>
            {selectedTheme.category}
          </span>
        </div>

        {/* Divider */}
        <div style={{
          height: 2, margin: "0 auto 28px",
          width: 80,
          background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(232,184,64,0.4), transparent)",
          borderRadius: 1,
        }} />

        {/* Possible Meaning */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <h3 style={{
              fontSize: 18, fontWeight: 400, color: "#e8b840",
              margin: 0, fontFamily: "Georgia, serif",
            }}>
              Possible meaning
            </h3>
          </div>
          <p style={{
            fontSize: 15, color: "#c8a870", lineHeight: 1.75, margin: 0,
            fontFamily: "Georgia, serif",
          }}>
            {selectedTheme.meaning}
          </p>
        </div>

        {/* Guidance */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: 20, padding: "24px 22px",
          boxShadow: "0 0 30px rgba(168,85,247,0.06)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 22 }}>🧭</span>
            <h3 style={{
              fontSize: 18, fontWeight: 400, color: "#e8b840",
              margin: 0, fontFamily: "Georgia, serif",
            }}>
              Guidance
            </h3>
          </div>
          <p style={{
            fontSize: 15, color: "#c8a870", lineHeight: 1.75, margin: 0,
            fontFamily: "Georgia, serif",
          }}>
            {selectedTheme.guidance}
          </p>
        </div>
      </div>
    );
  }

  // ── Grid View ──────────────────────────────────────────────────────────
  return (
    <div style={{ animation: "fadeIn 0.4s ease" }} ref={scrollRef}>
      {/* Search */}
      <input
        placeholder="Search themes..."
        value={search}
        onChange={e => handleSearch(e.target.value)}
        style={{
          width: "100%", background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.2)",
          borderRadius: 40, padding: "13px 22px", color: "#f5e4b0", fontSize: 14,
          marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "Georgia, serif"
        }}
      />

      {/* Category pills */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16,
        marginBottom: 8, scrollbarWidth: "none",
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              background: category === cat.id ? "rgba(168,85,247,0.2)" : "rgba(6,12,22,0.5)",
              border: `1px solid ${category === cat.id ? "rgba(168,85,247,0.4)" : "rgba(200,160,30,0.12)"}`,
              color: category === cat.id ? "#a855f7" : "#7a6a40",
              borderRadius: 20, padding: "6px 16px", fontSize: 12,
              cursor: "pointer", fontFamily: "Georgia, serif",
              whiteSpace: "nowrap", transition: "all 0.2s",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p style={{
        fontSize: 12, color: "#5a4a30", margin: "0 0 16px",
        fontFamily: "Georgia, serif",
      }}>
        {loading ? "Loading..." : `${totalCount} themes found`}
      </p>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#7a6a40", fontFamily: "Georgia, serif" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🌙</div>
          Loading themes...
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {themes.map(theme => (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                style={{
                  background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.12)",
                  borderRadius: 16, padding: "18px 20px", cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{theme.symbol}</span>
                  <span style={{ fontSize: 15, color: "#e8b840", textTransform: "capitalize" }}>{theme.key}</span>
                </div>
                <p style={{ fontSize: 12, color: "#7a6a40", lineHeight: 1.6, margin: 0 }}>
                  {theme.meaning.length > 80 ? theme.meaning.substring(0, 80) + "..." : theme.meaning}
                </p>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                width: "100%", marginTop: 20, padding: "14px",
                background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
                borderRadius: 16, color: "#a855f7", fontSize: 14,
                cursor: loadingMore ? "default" : "pointer",
                fontFamily: "Georgia, serif", transition: "all 0.2s",
              }}
            >
              {loadingMore ? "Loading more..." : `Load more themes`}
            </button>
          )}

          {/* Empty state */}
          {themes.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#7a6a40", fontFamily: "Georgia, serif" }}>
              No themes found for "{search}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
