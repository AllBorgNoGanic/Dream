import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const MOODS = ["Happy", "Sad", "Anxious", "Peaceful", "Confused", "Excited", "Fearful", "Nostalgic"];
const THEMES = ["Adventure", "Flying", "Falling", "Chase", "Water", "Animals", "People", "Fantasy", "Nightmare", "Lucid"];

const styles = {
  container: {
    padding: "24px 16px",
    maxWidth: 720,
    margin: "0 auto",
    fontFamily: "Georgia, serif",
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    color: "#e8d5ff",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 1,
  },
  searchBar: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: 180,
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid rgba(160,100,255,0.15)",
    background: "rgba(20,8,50,0.7)",
    color: "#e8d5ff",
    fontFamily: "Georgia, serif",
    fontSize: 15,
    outline: "none",
  },
  select: {
    padding: "10px 14px",
    borderRadius: 16,
    border: "1px solid rgba(160,100,255,0.15)",
    background: "rgba(20,8,50,0.7)",
    color: "#c490ff",
    fontFamily: "Georgia, serif",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
    minWidth: 120,
  },
  card: {
    background: "rgba(20,8,50,0.7)",
    border: "1px solid rgba(160,100,255,0.15)",
    borderRadius: 18,
    padding: "20px 22px",
    marginBottom: 18,
    transition: "border-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  displayName: {
    color: "#c490ff",
    fontSize: 13,
    fontStyle: "italic",
  },
  date: {
    color: "#7060aa",
    fontSize: 12,
  },
  title: {
    color: "#e8d5ff",
    fontSize: 20,
    fontWeight: 600,
    margin: "6px 0 8px",
  },
  description: {
    color: "#c490ff",
    fontSize: 14,
    lineHeight: 1.6,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: 10,
  },
  metaRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    background: "rgba(160,100,255,0.12)",
    color: "#c490ff",
    border: "1px solid rgba(160,100,255,0.15)",
  },
  tag: {
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 10,
    fontSize: 11,
    background: "rgba(100,60,200,0.15)",
    color: "#c490ff",
    marginRight: 6,
    marginBottom: 4,
  },
  actionsRow: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(160,100,255,0.08)",
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 14,
    fontFamily: "Georgia, serif",
    padding: "4px 8px",
    borderRadius: 10,
    transition: "background 0.15s",
  },
  commentSection: {
    marginTop: 12,
    padding: "12px 14px",
    background: "rgba(10,4,30,0.5)",
    borderRadius: 14,
    border: "1px solid rgba(160,100,255,0.08)",
  },
  commentItem: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(160,100,255,0.06)",
  },
  commentAuthor: {
    color: "#c490ff",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 2,
  },
  commentContent: {
    color: "#e8d5ff",
    fontSize: 13,
    lineHeight: 1.5,
  },
  commentInputRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(160,100,255,0.15)",
    background: "rgba(20,8,50,0.7)",
    color: "#e8d5ff",
    fontFamily: "Georgia, serif",
    fontSize: 13,
    outline: "none",
  },
  sendBtn: {
    padding: "8px 16px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
    color: "#fff",
    fontFamily: "Georgia, serif",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  emptyState: {
    textAlign: "center",
    color: "#7060aa",
    padding: "40px 20px",
    fontSize: 16,
    fontStyle: "italic",
  },
  loading: {
    textAlign: "center",
    color: "#7060aa",
    padding: "40px 20px",
    fontSize: 15,
  },
};

function DreamCard({ dream, displayName, user }) {
  const [likes, setLikes] = useState([]);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentAuthors, setCommentAuthors] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadLikes();
  }, [dream.id]);

  const loadLikes = async () => {
    const { data } = await supabase
      .from("dream_likes")
      .select("*")
      .eq("dream_id", dream.id);
    if (data) {
      setLikes(data);
      setLiked(user ? data.some((l) => l.user_id === user.id) : false);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase
        .from("dream_likes")
        .delete()
        .eq("dream_id", dream.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("dream_likes")
        .insert({ dream_id: dream.id, user_id: user.id });
    }
    loadLikes();
  };

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("dream_comments")
      .select("*")
      .eq("dream_id", dream.id)
      .order("created_at", { ascending: true });
    if (data) {
      setComments(data);
      const userIds = [...new Set(data.map((c) => c.user_id))];
      if (userIds.length > 0) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("user_id, display_name")
          .in("user_id", userIds);
        if (settings) {
          const map = {};
          settings.forEach((s) => {
            map[s.user_id] = s.display_name;
          });
          setCommentAuthors(map);
        }
      }
    }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const addComment = async () => {
    if (!user || !commentText.trim()) return;
    await supabase.from("dream_comments").insert({
      dream_id: dream.id,
      user_id: user.id,
      content: commentText.trim(),
    });
    setCommentText("");
    loadComments();
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const tags = dream.tags
    ? Array.isArray(dream.tags)
      ? dream.tags
      : typeof dream.tags === "string"
      ? dream.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : []
    : [];

  const formattedDate = new Date(dream.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.displayName}>{displayName || "Anonymous Dreamer"}</span>
        <span style={styles.date}>{formattedDate}</span>
      </div>
      <div style={styles.title}>{dream.title || "Untitled Dream"}</div>
      <div style={styles.description}>{dream.description}</div>
      <div style={styles.metaRow}>
        {dream.mood && <span style={styles.badge}>{dream.mood}</span>}
        {dream.theme && <span style={styles.badge}>{dream.theme}</span>}
      </div>
      {tags.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {tags.map((tag, i) => (
            <span key={i} style={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
      <div style={styles.actionsRow}>
        <button
          onClick={toggleLike}
          style={{
            ...styles.actionBtn,
            color: liked ? "#f472b6" : "#7060aa",
          }}
          title={user ? (liked ? "Unlike" : "Like") : "Sign in to like"}
        >
          <span style={{ fontSize: 18 }}>{liked ? "\u2764\uFE0F" : "\u2661"}</span>
          <span>{likes.length}</span>
        </button>
        <button
          onClick={toggleComments}
          style={{
            ...styles.actionBtn,
            color: showComments ? "#c490ff" : "#7060aa",
          }}
          title="Comments"
        >
          <span style={{ fontSize: 16 }}>{showComments ? "\uD83D\uDCAC" : "\uD83D\uDCAC"}</span>
          <span>{showComments ? "Hide" : "Comments"}</span>
        </button>
      </div>
      {showComments && (
        <div style={styles.commentSection}>
          {loadingComments ? (
            <div style={{ color: "#7060aa", fontSize: 13 }}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: "#7060aa", fontSize: 13, fontStyle: "italic" }}>
              No comments yet. Be the first to share your thoughts.
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={styles.commentItem}>
                <div style={styles.commentAuthor}>
                  {commentAuthors[c.user_id] || "Anonymous Dreamer"}
                </div>
                <div style={styles.commentContent}>{c.content}</div>
              </div>
            ))
          )}
          {user && (
            <div style={styles.commentInputRow}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                style={styles.commentInput}
              />
              <button onClick={addComment} style={styles.sendBtn}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommunityTab({ user, supabase: _sb }) {
  const [dreams, setDreams] = useState([]);
  const [displayNames, setDisplayNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");

  const loadDreams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setDreams(data);
      const userIds = [...new Set(data.map((d) => d.user_id))];
      if (userIds.length > 0) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("user_id, display_name")
          .in("user_id", userIds);
        if (settings) {
          const map = {};
          settings.forEach((s) => {
            map[s.user_id] = s.display_name;
          });
          setDisplayNames(map);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  const filtered = dreams.filter((d) => {
    if (moodFilter && d.mood !== moodFilter) return false;
    if (themeFilter && d.theme !== themeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (d.title || "").toLowerCase();
      const desc = (d.description || "").toLowerCase();
      const tags = Array.isArray(d.tags)
        ? d.tags.join(" ").toLowerCase()
        : (d.tags || "").toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !tags.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Community Dreams</h2>
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search dreams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All Moods</option>
          {MOODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All Themes</option>
          {THEMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div style={styles.loading}>Loading community dreams...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          {search || moodFilter || themeFilter
            ? "No dreams match your filters. Try broadening your search."
            : "No public dreams yet. Be the first to share!"}
        </div>
      ) : (
        filtered.map((dream) => (
          <DreamCard
            key={dream.id}
            dream={dream}
            displayName={displayNames[dream.user_id]}
            user={user}
          />
        ))
      )}
    </div>
  );
}
