import { useState } from "react";

const SHARE_DATA = {
  title: "Dream Shepherd",
  text: "I use Dream Shepherd to journal my dreams and discover their meaning. Try it free!",
  url: "https://dreamshepherd.app",
};

export default function ShareButton({ userId, shareBonusCount = 0, maxBonus = 3, onBonusEarned, variant = "default" }) {
  const [status, setStatus] = useState("idle"); // idle | sharing | success | error | maxed | cooldown
  const [cooldownDays, setCooldownDays] = useState(3);
  const [message, setMessage] = useState("");

  const atMax = shareBonusCount >= maxBonus;

  const recordShare = async () => {
    try {
      const res = await fetch("/api/record-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (data.bonus_granted) {
        setStatus("success");
        setMessage("You earned a bonus interpretation!");
        if (onBonusEarned) onBonusEarned(data.share_bonus_count);
      } else if (data.reason === "cooldown") {
        setCooldownDays(data.days_remaining ?? 3);
        setStatus("cooldown");
        setMessage(`Share again in ${data.days_remaining ?? 3} day${(data.days_remaining ?? 3) !== 1 ? "s" : ""} for another bonus`);
      } else if (data.reason === "max_reached") {
        setStatus("maxed");
        setMessage("All bonus interpretations earned!");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  const handleShare = async () => {
    if (atMax) return;
    setStatus("sharing");

    try {
      if (navigator.share) {
        await navigator.share(SHARE_DATA);
        await recordShare();
      } else {
        await navigator.clipboard.writeText(`${SHARE_DATA.text} ${SHARE_DATA.url}`);
        setMessage("Link copied!");
        await recordShare();
      }
    } catch (err) {
      // User cancelled the share dialog
      if (err.name === "AbortError") {
        setStatus("idle");
        setMessage("");
      } else {
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(`${SHARE_DATA.text} ${SHARE_DATA.url}`);
          setMessage("Link copied!");
          await recordShare();
        } catch {
          setStatus("error");
          setMessage("Could not share. Please try again.");
        }
      }
    }
  };

  // Auto-reset success/error after 3 seconds
  if ((status === "success" || status === "error") && message) {
    setTimeout(() => {
      if (status === "success") setStatus(shareBonusCount + 1 >= maxBonus ? "maxed" : "idle");
      else setStatus("idle");
      setMessage("");
    }, 3000);
  }

  if (variant === "compact") {
    return (
      <div style={{ textAlign: "center" }}>
        {!atMax && status !== "success" && status !== "maxed" && (
          <>
            <div style={{ fontSize: 12, color: "#6b5c30", marginBottom: 8 }}>or</div>
            <button
              onClick={handleShare}
              disabled={status === "sharing"}
              style={{
                background: "none",
                border: "1px solid rgba(200,160,50,0.3)",
                color: "#c8a020",
                padding: "10px 20px",
                borderRadius: 12,
                fontSize: 13,
                cursor: status === "sharing" ? "wait" : "pointer",
                width: "100%",
                opacity: status === "sharing" ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {status === "sharing" ? "Sharing..." : status === "cooldown" ? `Share again in ${cooldownDays} day${cooldownDays !== 1 ? "s" : ""}` : `Share to earn a free interpretation (${shareBonusCount}/${maxBonus})`}
            </button>
          </>
        )}
        {(status === "success" || status === "cooldown" || status === "maxed" || status === "error") && message && (
          <div style={{
            fontSize: 13,
            color: status === "success" ? "#4ade80" : status === "error" ? "#f87171" : "#c8a020",
            marginTop: 8,
            animation: "fadeIn 0.3s ease",
          }}>
            {status === "success" ? "✓ " : ""}{message}
          </div>
        )}
      </div>
    );
  }

  // Card variant for ProfileTab
  return (
    <div style={{
      background: "rgba(6,12,22,0.5)",
      border: "1px solid rgba(200,160,30,0.15)",
      borderRadius: 20,
      padding: "20px 18px",
    }}>
      <div style={{ fontSize: 13, letterSpacing: 3, color: "#8060cc", textTransform: "uppercase", marginBottom: 14 }}>
        Share and Earn
      </div>
      <div style={{ fontSize: 13, color: "#7a6a40", marginBottom: 16, lineHeight: 1.6 }}>
        Share Dream Shepherd with friends and earn bonus interpretations.
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5c30", marginBottom: 6 }}>
          <span>Bonus interpretations</span>
          <span>{shareBonusCount} of {maxBonus}</span>
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: "rgba(200,160,50,0.1)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, #c8a020, #e8c840)",
            width: `${(shareBonusCount / maxBonus) * 100}%`,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {atMax || status === "maxed" ? (
        <div style={{ fontSize: 13, color: "#4ade80", textAlign: "center", padding: "8px 0" }}>
          ✓ All {maxBonus} bonus interpretations earned!
        </div>
      ) : (
        <button
          onClick={handleShare}
          disabled={status === "sharing"}
          style={{
            width: "100%",
            background: status === "success" ? "rgba(74,222,128,0.15)" : "rgba(200,160,50,0.1)",
            border: status === "success" ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(200,160,50,0.3)",
            color: status === "success" ? "#4ade80" : "#e8c840",
            padding: "12px",
            borderRadius: 12,
            fontSize: 14,
            cursor: status === "sharing" ? "wait" : "pointer",
            opacity: status === "sharing" ? 0.6 : 1,
            transition: "all 0.3s ease",
          }}
        >
          {status === "sharing" && "Sharing..."}
          {status === "idle" && "Share Dream Shepherd"}
          {status === "success" && "✓ Bonus interpretation earned!"}
          {status === "cooldown" && `Share again in ${cooldownDays} day${cooldownDays !== 1 ? "s" : ""}`}
          {status === "error" && "Try again"}
        </button>
      )}

      {status === "cooldown" && (
        <div style={{ fontSize: 12, color: "#6b5c30", textAlign: "center", marginTop: 8 }}>
          You can earn 1 bonus per day
        </div>
      )}
    </div>
  );
}
