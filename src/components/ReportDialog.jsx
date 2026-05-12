import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "../lib/supabase";

const REPORT_DIALOG_STYLES_ID = "report-dialog-styles";
if (typeof document !== "undefined" && !document.getElementById(REPORT_DIALOG_STYLES_ID)) {
  const style = document.createElement("style");
  style.id = REPORT_DIALOG_STYLES_ID;
  style.textContent = `
    @keyframes rd-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rd-contentIn { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
  `;
  document.head.appendChild(style);
}

const REASONS = [
  { value: "offensive", label: "Offensive or harmful content" },
  { value: "inaccurate", label: "Inaccurate or misleading" },
  { value: "religious_misuse", label: "Misrepresents religious teaching" },
  { value: "spam", label: "Spam or unrelated content" },
  { value: "other", label: "Something else" },
];

/**
 * Report dialog for AI interpretations and community posts.
 * Required for App Store compliance (Guideline 1.2 / 4.7).
 *
 * Props:
 *   targetType: 'interpretation' | 'community_post'
 *   dreamId: uuid
 *   trigger: React node that opens the dialog when clicked
 *   onSubmitted?: (report) => void
 */
export default function ReportDialog({ targetType, dreamId, trigger, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReason("");
    setDetails("");
    setSubmitted(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!reason) { setError("Please choose a reason."); return; }
    setSubmitting(true);
    setError("");

    const { data: sess } = await supabase.auth.getSession();
    const reporterId = sess?.session?.user?.id;
    if (!reporterId) {
      setError("You must be signed in to report content.");
      setSubmitting(false);
      return;
    }

    // Map the target type onto the unified `reports` table column.
    const row = {
      reporter_id: reporterId,
      reason,
      details: details.trim() || null,
    };
    if (targetType === "interpretation") {
      row.interpretation_dream_id = dreamId || null;
    } else if (targetType === "community_post") {
      row.dream_id = dreamId || null;
    } else if (targetType === "comment") {
      row.comment_id = dreamId || null;
    }

    const { error: insertErr } = await supabase.from("reports").insert(row);

    setSubmitting(false);
    if (insertErr) {
      // 23505 = unique constraint violation: user already reported this target.
      if (insertErr.code === "23505") {
        setError("You've already reported this content.");
      } else {
        setError("Could not submit report. Please try again.");
      }
      return;
    }

    setSubmitted(true);
    if (onSubmitted) onSubmitted({ reason, details });
    setTimeout(() => { setOpen(false); reset(); }, 1600);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 1100,
          animation: "rd-overlayIn 0.2s ease",
        }} />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: "linear-gradient(160deg, rgba(22,8,48,0.98) 0%, rgba(12,4,28,0.98) 100%)",
            border: "1px solid rgba(200,160,50,0.25)",
            borderRadius: 20, padding: "24px 22px",
            maxWidth: 380, width: "92%",
            boxShadow: "0 20px 70px rgba(0,0,0,0.7), 0 0 40px rgba(104,71,192,0.1)",
            animation: "rd-contentIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 1101, outline: "none",
            fontFamily: "Georgia, serif",
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
              <Dialog.Title style={{ fontSize: 17, color: "#f5e4b0", marginBottom: 8, fontWeight: 400 }}>
                Report submitted
              </Dialog.Title>
              <p style={{ fontSize: 13, color: "#8a7540", lineHeight: 1.6, margin: 0 }}>
                Thank you. Our team will review this content shortly.
              </p>
            </div>
          ) : (
            <>
              <Dialog.Title style={{ fontSize: 17, color: "#f5e4b0", marginBottom: 6, fontWeight: 400 }}>
                Report this content
              </Dialog.Title>
              <p style={{ fontSize: 13, color: "#8a7540", lineHeight: 1.6, margin: "0 0 18px" }}>
                Help us keep Dream Shepherd safe. Reports are reviewed by our team.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {REASONS.map((r) => {
                  const active = reason === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      style={{
                        textAlign: "left",
                        background: active ? "rgba(200,160,30,0.15)" : "rgba(10,6,24,0.6)",
                        border: active ? "1px solid rgba(232,184,64,0.5)" : "1px solid rgba(200,160,30,0.2)",
                        color: active ? "#f0dfa0" : "#c8a040",
                        padding: "11px 14px", borderRadius: 12, fontSize: 13,
                        fontFamily: "Georgia, serif", cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add details (optional)"
                rows={3}
                maxLength={500}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(5,10,18,0.9)",
                  border: "1px solid rgba(200,160,30,0.25)",
                  borderRadius: 10, padding: "10px 12px",
                  color: "#f5e4b0", fontSize: 13, lineHeight: 1.5,
                  fontFamily: "Georgia, serif",
                  outline: "none", resize: "vertical",
                  marginBottom: 16,
                }}
              />

              {error && (
                <div style={{ fontSize: 12, color: "#e06050", marginBottom: 12 }}>{error}</div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <Dialog.Close asChild>
                  <button style={{
                    flex: 1,
                    background: "rgba(200,160,50,0.08)",
                    border: "1px solid rgba(200,160,30,0.25)",
                    color: "#c8a040",
                    padding: "12px 16px", borderRadius: 12, fontSize: 14,
                    fontFamily: "Georgia, serif", minHeight: 44,
                    cursor: "pointer",
                  }}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: submitting
                      ? "rgba(200,80,80,0.4)"
                      : "linear-gradient(135deg, #a04040, #c85050)",
                    border: "none",
                    color: "#fff",
                    padding: "12px 16px", borderRadius: 12, fontSize: 14,
                    fontFamily: "Georgia, serif", fontWeight: 600, minHeight: 44,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
