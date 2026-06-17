import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { checkContent } from "../utils/moderation";
import DreamSelect from "./DreamSelect";

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
    color: "#f5e4b0",
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
    padding: "10px 16px 10px 40px",
    borderRadius: 16,
    border: "1px solid rgba(200,160,30,0.35)",
    background: "rgba(20,12,40,0.6)",
    color: "#f5e4b0",
    fontFamily: "Georgia, serif",
    fontSize: 16,
    boxShadow: "0 0 16px rgba(232,184,64,0.06), inset 0 1px 0 rgba(232,184,64,0.06)",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a7540' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "12px center",
    backgroundSize: "16px",
    outline: "none",
  },
  select: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(200,160,30,0.15)",
    background: "rgba(6,12,22,0.7)",
    color: "#e8b840",
    fontFamily: "Georgia, serif",
    fontSize: 16,
    outline: "none",
    cursor: "pointer",
    minWidth: 120,
  },
  card: {
    background: "rgba(6,12,22,0.7)",
    border: "1px solid rgba(200,160,30,0.15)",
    borderRadius: 18,
    padding: "16px 16px",
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
    color: "#e8b840",
    fontSize: 13,
    fontStyle: "italic",
  },
  date: {
    color: "#8a7540",
    fontSize: 12,
  },
  title: {
    color: "#f5e4b0",
    fontSize: 20,
    fontWeight: 600,
    margin: "6px 0 8px",
  },
  description: {
    color: "#e8b840",
    fontSize: 15,
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
    background: "rgba(200,160,30,0.12)",
    color: "#e8b840",
    border: "1px solid rgba(200,160,30,0.15)",
  },
  tag: {
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 10,
    fontSize: 11,
    background: "rgba(100,60,200,0.15)",
    color: "#e8b840",
    marginRight: 6,
    marginBottom: 4,
  },
  actionsRow: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(200,160,30,0.08)",
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
    padding: "10px 12px",
    borderRadius: 10,
    transition: "background 0.15s",
    minHeight: 44,
  },
  commentSection: {
    marginTop: 12,
    padding: "12px 14px",
    background: "rgba(10,4,30,0.5)",
    borderRadius: 14,
    border: "1px solid rgba(200,160,30,0.08)",
  },
  commentItem: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(200,160,30,0.06)",
  },
  commentAuthor: {
    color: "#e8b840",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 2,
  },
  commentContent: {
    color: "#f5e4b0",
    fontSize: 14,
    lineHeight: 1.5,
  },
  commentInputRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(200,160,30,0.15)",
    background: "rgba(6,12,22,0.7)",
    color: "#f5e4b0",
    fontFamily: "Georgia, serif",
    fontSize: 16,
    outline: "none",
  },
  sendBtn: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6847c0, #9066d4)",
    color: "#fff",
    fontFamily: "Georgia, serif",
    fontSize: 14, minHeight: 44,
    cursor: "pointer",
    fontWeight: 600,
  },
  emptyState: {
    textAlign: "center",
    color: "#8a7540",
    padding: "40px 20px",
    fontSize: 16,
    fontStyle: "italic",
  },
  loading: {
    textAlign: "center",
    color: "#8a7540",
    padding: "40px 20px",
    fontSize: 15,
  },
};

const REPORT_REASONS = [
  "Inappropriate content",
  "Harassment",
  "Spam",
  "Explicit imagery",
  "Other",
];

function Avatar({ url, name, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.43), color: "#fff", fontFamily: "Georgia, serif",
      overflow: "hidden",
    }}>
      {url ? (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        (name || "A")[0].toUpperCase()
      )}
    </div>
  );
}

function UserProfile({ userId, user, displayName, avatarUrl, onBack, onBlock }) {
  const [profile, setProfile] = useState(null);
  const [publicDreams, setPublicDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [settingsRes, dreamsRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("display_name, avatar_url, bio, streak_current, created_at")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("dreams")
          .select("id, title, description, mood, theme, tags, dream_image_url, interpretation, created_at")
          .eq("user_id", userId)
          .eq("is_public", true)
          .order("created_at", { ascending: false }),
      ]);

      if (settingsRes.data) setProfile(settingsRes.data);
      if (dreamsRes.data) setPublicDreams(dreamsRes.data);
      setLoading(false);
    };
    load();
  }, [userId]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const name = profile?.display_name || displayName || "Anonymous Dreamer";
  const avatar = profile?.avatar_url || avatarUrl;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: 60, color: "#7a6a40", fontFamily: "Georgia, serif" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🌙</div>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "1px solid rgba(255,255,255,0.15)",
          color: "#c8a030", padding: "10px 18px", borderRadius: 30,
          fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif",
          marginBottom: 24, minHeight: 44,
        }}
      >
        ← Back to Community
      </button>

      {/* Profile header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <Avatar url={avatar} name={name} size={80} />
        <div style={{ fontSize: 22, color: "#f5e4b0", fontFamily: "Georgia, serif", marginTop: 14, marginBottom: 4 }}>
          {name}
        </div>
        {memberSince && (
          <div style={{ fontSize: 12, color: "#6b5c30", fontFamily: "Georgia, serif" }}>
            Member since {memberSince}
          </div>
        )}
      </div>

      {/* Bio */}
      {profile?.bio && (
        <div style={{
          background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.12)",
          borderRadius: 16, padding: "16px 18px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 14, color: "#f5e4b0", fontFamily: "Georgia, serif", lineHeight: 1.6 }}>
            {profile.bio}
          </div>
        </div>
      )}

      {/* Block user option */}
      {user && userId !== user.id && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button
            onClick={() => onBlock(userId)}
            style={{
              background: "none", border: "none", color: "#6b5040",
              fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
            }}
          >
            Block this user
          </button>
        </div>
      )}

      {/* Section label */}
      <div style={{
        fontSize: 12, letterSpacing: 2, color: "#8060cc", textTransform: "uppercase",
        marginBottom: 16, fontFamily: "Georgia, serif",
      }}>
        Shared Dreams
      </div>

      {publicDreams.length === 0 ? (
        <div style={styles.emptyState}>This dreamer hasn't shared any dreams yet.</div>
      ) : (
        publicDreams.map((dream) => {
          const tags = dream.tags
            ? Array.isArray(dream.tags)
              ? dream.tags
              : typeof dream.tags === "string"
              ? dream.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : []
            : [];
          const formattedDate = new Date(dream.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          });
          return (
            <div key={dream.id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={styles.date}>{formattedDate}</span>
              </div>
              <div style={styles.title}>{dream.title || "Untitled Dream"}</div>
              {dream.dream_image_url && (
                <div style={{ marginBottom: 12, borderRadius: 14, overflow: "hidden" }}>
                  <img src={dream.dream_image_url} alt={dream.title || "Dream"} style={{ width: "100%", display: "block", borderRadius: 14 }} />
                </div>
              )}
              <div style={styles.description}>{dream.description}</div>
              <div style={styles.metaRow}>
                {dream.mood && <span style={styles.badge}>{dream.mood}</span>}
                {dream.theme && <span style={styles.badge}>{dream.theme}</span>}
              </div>
              {tags.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  {tags.map((tag, i) => <span key={i} style={styles.tag}>{tag}</span>)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function DreamCard({ dream, displayName, avatarUrl, user, onBlock, onViewProfile }) {
  const [likes, setLikes] = useState([]);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentAuthors, setCommentAuthors] = useState({});
  const [commentAvatars, setCommentAvatars] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: "dream"|"comment", id }
  const [reportStatus, setReportStatus] = useState(""); // "", "sending", "sent", "error", "duplicate"
  const [commentError, setCommentError] = useState("");

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

  useEffect(() => {
    loadLikes();
  }, [dream.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        if (settings) {
          const nameMap = {};
          const avatarMap = {};
          settings.forEach((s) => {
            nameMap[s.user_id] = s.display_name;
            if (s.avatar_url) avatarMap[s.user_id] = s.avatar_url;
          });
          setCommentAuthors(nameMap);
          setCommentAvatars(avatarMap);
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
    setCommentError("");
    const check = checkContent(commentText);
    if (!check.clean) {
      setCommentError("Your comment contains inappropriate language. Please revise it.");
      return;
    }
    await supabase.from("dream_comments").insert({
      dream_id: dream.id,
      user_id: user.id,
      content: commentText.trim(),
    });
    setCommentText("");
    loadComments();
  };

  const submitReport = async (reason) => {
    if (!user) return;
    setReportStatus("sending");
    const reportData = {
      reporter_id: user.id,
      reason,
    };
    if (reportTarget?.type === "comment") {
      reportData.comment_id = reportTarget.id;
    } else {
      reportData.dream_id = dream.id;
    }
    const { error } = await supabase.from("reports").insert(reportData);
    if (error) {
      if (error.code === "23505") {
        setReportStatus("duplicate");
      } else {
        setReportStatus("error");
      }
    } else {
      setReportStatus("sent");
    }
    setTimeout(() => {
      setShowReportModal(false);
      setReportTarget(null);
      setReportStatus("");
    }, 2000);
  };

  const handleBlock = async () => {
    if (!user || dream.user_id === user.id) return;
    await supabase.from("blocked_users").insert({
      user_id: user.id,
      blocked_user_id: dream.user_id,
    });
    setShowReportModal(false);
    setReportTarget(null);
    if (onBlock) onBlock(dream.user_id);
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
        <span
          onClick={() => onViewProfile && onViewProfile(dream.user_id)}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <Avatar url={avatarUrl} name={displayName} size={28} />
          <span style={styles.displayName}>{displayName || "Anonymous Dreamer"}</span>
        </span>
        <span style={styles.date}>{formattedDate}</span>
      </div>
      <div style={styles.title}>{dream.title || "Untitled Dream"}</div>
      {dream.dream_image_url && (
        <div style={{ marginBottom: 12, borderRadius: 14, overflow: "hidden" }}>
          <img
            src={dream.dream_image_url}
            alt={dream.title || "Dream visualization"}
            style={{ width: "100%", display: "block", borderRadius: 14 }}
          />
        </div>
      )}
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
            color: liked ? "#f472b6" : "#8a7540",
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
            color: showComments ? "#e8b840" : "#8a7540",
          }}
          title="Comments"
        >
          <span style={{ fontSize: 16 }}>{showComments ? "\uD83D\uDCAC" : "\uD83D\uDCAC"}</span>
          <span>{showComments ? "Hide" : "Comments"}</span>
        </button>
        {dream.interpretation && (
          <button
            onClick={() => setShowInterpretation(!showInterpretation)}
            style={{
              ...styles.actionBtn,
              marginLeft: "auto",
              color: showInterpretation ? "#8a7540" : "#e8b840",
              border: "1px solid rgba(200,160,30,0.25)",
              padding: "4px 12px",
              fontStyle: "italic",
              letterSpacing: 0.5,
            }}
            title="View this dream's interpretation"
          >
            {showInterpretation ? "Hide Interpretation" : "✦ View Interpretation"}
          </button>
        )}
        {user && dream.user_id !== user.id && (
          <button
            onClick={() => {
              setReportTarget({ type: "dream", id: dream.id });
              setShowReportModal(true);
            }}
            style={{
              ...styles.actionBtn,
              color: "#6b5c30",
              marginLeft: dream.interpretation ? 0 : "auto",
              fontSize: 12,
              padding: "6px 10px",
            }}
            title="Report or block"
          >
            &#9872;
          </button>
        )}
      </div>

      {/* Report/Block Modal */}
      {showReportModal && (
        <div style={{
          marginTop: 12, padding: "16px", background: "rgba(10,4,30,0.95)",
          borderRadius: 14, border: "1px solid rgba(200,160,30,0.2)",
        }}>
          {reportStatus === "sent" ? (
            <div style={{ color: "#4ade80", fontSize: 13, textAlign: "center" }}>
              Report submitted. We'll review this content.
            </div>
          ) : reportStatus === "duplicate" ? (
            <div style={{ color: "#e8b840", fontSize: 13, textAlign: "center" }}>
              You've already reported this content.
            </div>
          ) : reportStatus === "error" ? (
            <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>
              Something went wrong. Please try again.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "#f5e4b0", marginBottom: 12, fontWeight: 600 }}>
                {reportTarget?.type === "comment" ? "Report Comment" : "Report Dream"}
              </div>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => submitReport(reason)}
                  disabled={reportStatus === "sending"}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "rgba(200,160,30,0.06)", border: "1px solid rgba(200,160,30,0.12)",
                    borderRadius: 10, padding: "10px 14px", marginBottom: 6,
                    color: "#e8b840", fontSize: 13, cursor: "pointer",
                    fontFamily: "Georgia, serif", minHeight: 44,
                  }}
                >
                  {reason}
                </button>
              ))}
              {dream.user_id !== user?.id && (
                <button
                  onClick={handleBlock}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10, padding: "10px 14px", marginTop: 8,
                    color: "#f87171", fontSize: 13, cursor: "pointer",
                    fontFamily: "Georgia, serif", minHeight: 44,
                  }}
                >
                  Block this user
                </button>
              )}
              <button
                onClick={() => { setShowReportModal(false); setReportTarget(null); }}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  background: "none", border: "none", padding: "10px",
                  color: "#6b5c30", fontSize: 13, cursor: "pointer",
                  fontFamily: "Georgia, serif", marginTop: 4,
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
      {showInterpretation && dream.interpretation && (
        <div style={{
          marginTop: 14,
          padding: "14px 16px",
          background: "linear-gradient(135deg, rgba(10,4,30,0.9) 0%, rgba(20,8,50,0.85) 100%)",
          borderRadius: 14,
          border: "1px solid rgba(200,160,30,0.2)",
        }}>
          <div style={{ fontSize: 11, color: "#8a7540", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
            A Shepherd's Reflection
          </div>
          <div style={{ color: "#f5e4b0", fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>
            {dream.interpretation}
          </div>
        </div>
      )}
      {showComments && (
        <div style={styles.commentSection}>
          {loadingComments ? (
            <div style={{ color: "#8a7540", fontSize: 13 }}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: "#8a7540", fontSize: 13, fontStyle: "italic" }}>
              No comments yet. Be the first to share your thoughts.
            </div>
          ) : (
            comments.filter((c) => !c.report_count || c.report_count < 3).map((c) => (
              <div key={c.id} style={{ ...styles.commentItem, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div
                    onClick={() => onViewProfile && onViewProfile(c.user_id)}
                    style={{ cursor: "pointer", marginTop: 1 }}
                  >
                    <Avatar url={commentAvatars[c.user_id]} name={commentAuthors[c.user_id]} size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      onClick={() => onViewProfile && onViewProfile(c.user_id)}
                      style={{ ...styles.commentAuthor, cursor: "pointer" }}
                    >
                      {commentAuthors[c.user_id] || "Anonymous Dreamer"}
                    </div>
                    <div style={styles.commentContent}>{c.content}</div>
                  </div>
                </div>
                {user && c.user_id !== user.id && (
                  <button
                    onClick={() => {
                      setReportTarget({ type: "comment", id: c.id });
                      setShowReportModal(true);
                    }}
                    style={{
                      background: "none", border: "none", color: "#6b5c30",
                      fontSize: 11, cursor: "pointer", padding: "4px 6px", flexShrink: 0,
                    }}
                    title="Report comment"
                  >
                    &#9872;
                  </button>
                )}
              </div>
            ))
          )}
          {user && (
            <>
              {commentError && (
                <div style={{ color: "#f87171", fontSize: 12, marginBottom: 6, padding: "6px 10px",
                  background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>
                  {commentError}
                </div>
              )}
              <div style={styles.commentInputRow}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => { setCommentText(e.target.value); setCommentError(""); }}
                  onKeyDown={handleCommentKeyDown}
                  style={styles.commentInput}
                />
                <button onClick={addComment} style={styles.sendBtn}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommunityTab({ user, supabase: _sb }) {
  const [dreams, setDreams] = useState([]);
  const [displayNames, setDisplayNames] = useState({});
  const [avatarUrls, setAvatarUrls] = useState({});
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Load blocked users
  useEffect(() => {
    if (!user) return;
    const loadBlocked = async () => {
      const { data } = await supabase
        .from("blocked_users")
        .select("blocked_user_id")
        .eq("user_id", user.id);
      if (data) setBlockedUsers(data.map((b) => b.blocked_user_id));
    };
    loadBlocked();
  }, [user]);

  const handleBlock = (blockedUserId) => {
    setBlockedUsers((prev) => [...prev, blockedUserId]);
    if (selectedProfile === blockedUserId) setSelectedProfile(null);
  };

  const loadDreams = useCallback(async () => {
    setLoading(true);
    const { data, error: _error } = await supabase
      .from("dreams")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setDreams(data);
      const userIds = [...new Set(data.map((d) => d.user_id))];
      if (userIds.length > 0) {
        // Display names and avatars — supporter status is intentionally not
        // surfaced in the community feed (every dream stands on its own).
        const { data: settings } = await supabase
          .from("user_settings")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        if (settings) {
          const nameMap = {};
          const avatarMap = {};
          settings.forEach((s) => {
            nameMap[s.user_id] = s.display_name;
            if (s.avatar_url) avatarMap[s.user_id] = s.avatar_url;
          });
          setDisplayNames(nameMap);
          setAvatarUrls(avatarMap);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  const filtered = dreams.filter((d) => {
    if (blockedUsers.includes(d.user_id)) return false;
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

  if (selectedProfile) {
    return (
      <UserProfile
        userId={selectedProfile}
        user={user}
        displayName={displayNames[selectedProfile]}
        avatarUrl={avatarUrls[selectedProfile]}
        onBack={() => setSelectedProfile(null)}
        onBlock={(uid) => { handleBlock(uid); setSelectedProfile(null); }}
      />
    );
  }

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
        <DreamSelect
          value={moodFilter}
          onValueChange={setMoodFilter}
          placeholder="All Moods"
          options={MOODS}
        />
        <DreamSelect
          value={themeFilter}
          onValueChange={setThemeFilter}
          placeholder="All Themes"
          options={THEMES}
        />
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
            avatarUrl={avatarUrls[dream.user_id]}
            user={user}
            onBlock={handleBlock}
            onViewProfile={setSelectedProfile}
          />
        ))
      )}
    </div>
  );
}
