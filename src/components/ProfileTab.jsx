import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { supabase } from "../lib/supabase";
import ShareButton from "./ShareButton";
import ExportPDF from "./ExportPDF";
import PersonalizationCard from "./PersonalizationCard";
import { checkContent } from "../utils/moderation";

// Inject animation keyframes once
const PROFILE_DIALOG_STYLES_ID = "profile-signout-dialog-styles";
if (typeof document !== "undefined" && !document.getElementById(PROFILE_DIALOG_STYLES_ID)) {
  const style = document.createElement("style");
  style.id = PROFILE_DIALOG_STYLES_ID;
  style.textContent = `
    @keyframes pt-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pt-contentIn { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
  `;
  document.head.appendChild(style);
}

const FREE_INTERPRETATIONS = 5;
const MAX_SHARE_BONUS = 3;

export default function ProfileTab({ user, userSettings, onSettingsUpdate, dreams, onUpgrade, onManageSubscription, onRestorePurchases, onSignOut, onDeleteAccount }) {
  const isNative = typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();
  const [displayName, setDisplayName] = useState(userSettings?.display_name || "");
  const [age, setAge] = useState(userSettings?.age || "");
  const [wakeTime, setWakeTime] = useState(userSettings?.wake_time || "07:00");
  const [reminderEnabled, setReminderEnabled] = useState(userSettings?.reminder_enabled || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notifSupported] = useState(() => "Notification" in window && "serviceWorker" in navigator);
  const [notifPermission, setNotifPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "denied"
  );

  const avgSleep = dreams.filter(d => d.sleep_hours).length > 0
    ? (dreams.filter(d => d.sleep_hours).reduce((s, d) => s + Number(d.sleep_hours), 0) / dreams.filter(d => d.sleep_hours).length).toFixed(1)
    : null;

  const handleSave = async () => {
    setNameError("");
    if (displayName.trim()) {
      const check = checkContent(displayName.trim());
      if (!check.clean) {
        setNameError("Display name contains inappropriate language.");
        return;
      }
    }
    setSaving(true);
    const { data } = await supabase
      .from("user_settings")
      .update({ display_name: displayName.trim() || null, age: age ? parseInt(age) : null, wake_time: wakeTime, reminder_enabled: reminderEnabled })
      .eq("user_id", user.id)
      .select()
      .single();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (data && onSettingsUpdate) onSettingsUpdate(data);
  };

  const card = {
    background: "rgba(6,12,22,0.7)",
    border: "1px solid rgba(200,160,30,0.15)",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Personalization card */}
      <PersonalizationCard
        user={user}
        userSettings={userSettings}
        onSettingsUpdate={onSettingsUpdate}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Dreams", value: dreams.length, icon: "🌙" },
          { label: "Avg Sleep", value: avgSleep ? `${avgSleep}h` : "—", icon: "💤" },
          { label: "Current Streak", value: `${userSettings?.streak_current || 0}d`, icon: "🔥" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(6,12,22,0.7)", border: "1px solid rgba(200,160,30,0.12)", borderRadius: 16, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 20, color: "#e8b840" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b5c30", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Account status — supporters get a warm acknowledgment, free users
          get a gentle invitation to support the work. */}
      <div style={{ ...card, border: userSettings?.is_pro ? "1px solid rgba(200,160,50,0.3)" : "1px solid rgba(200,160,30,0.15)" }}>
        {userSettings?.is_pro ? (
          <div>
            <div style={{ fontSize: 16, color: "#e8c840", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✦</span>
              <span>Thank you</span>
            </div>
            <div style={{ fontSize: 13, color: "#9a8050", lineHeight: 1.65 }}>
              You support Dream Shepherd. Your dreams unfold without limits.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, color: "#f5e4b0", marginBottom: 4 }}>
                Dream Shepherd is free
              </div>
              <div style={{ fontSize: 12, color: "#6b5c30", lineHeight: 1.6 }}>
                {Math.max(0, FREE_INTERPRETATIONS + Math.min(userSettings?.share_bonus_count ?? 0, MAX_SHARE_BONUS) - (userSettings?.interpretation_count || 0))} interpretation{Math.max(0, FREE_INTERPRETATIONS + Math.min(userSettings?.share_bonus_count ?? 0, MAX_SHARE_BONUS) - (userSettings?.interpretation_count || 0)) === 1 ? "" : "s"} left this month
              </div>
            </div>
            <button onClick={onUpgrade} style={{
              background: "linear-gradient(135deg, #c8a020, #e8c840)",
              border: "none", color: "#1a1000", padding: "12px 18px", borderRadius: 22,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5, minHeight: 44,
              whiteSpace: "nowrap", fontFamily: "Georgia, serif",
            }}>
              Support the work
            </button>
          </div>
        )}
      </div>

      {/* Subscription management — Customer Center is the primary entry
          point for supporters (manage plan, cancel, restore). A separate
          Restore Purchases link is kept for users who haven't subscribed
          on this device yet, which is also what Apple expects to see. */}
      {isNative && (onManageSubscription || onRestorePurchases) && (
        <div style={{ textAlign: "center", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {onManageSubscription && userSettings?.is_pro && (
            <button
              onClick={onManageSubscription}
              style={{
                background: "none", border: "1px solid rgba(200,160,30,0.25)",
                color: "#c8a040",
                padding: "10px 22px", borderRadius: 22, fontSize: 13,
                cursor: "pointer", fontFamily: "Georgia, serif",
                letterSpacing: 0.5, minHeight: 40, alignSelf: "center",
              }}
            >
              Manage subscription
            </button>
          )}
          {onRestorePurchases && (
            <button
              onClick={onRestorePurchases}
              style={{
                background: "none", border: "none", padding: "8px 16px",
                color: "#6b5c30", fontSize: 12, cursor: "pointer",
                fontFamily: "Georgia, serif", letterSpacing: 0.3,
                textDecoration: "underline",
              }}
            >
              Restore previous purchases
            </button>
          )}
        </div>
      )}

      {/* Share and Earn */}
      {!userSettings?.is_pro && (
        <ShareButton
          userId={user?.id}
          shareBonusCount={userSettings?.share_bonus_count ?? 0}
          maxBonus={MAX_SHARE_BONUS}
          variant="card"
          onBonusEarned={(newCount) => {
            onSettingsUpdate((s) => ({ ...s, share_bonus_count: newCount }));
          }}
        />
      )}

      {/* Settings */}
      <div style={card}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#8060cc", textTransform: "uppercase", marginBottom: 20 }}>Settings</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#e8b840", marginBottom: 8 }}>Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Anonymous Dreamer"
            style={{
              width: "100%", background: "rgba(5,10,18,0.9)", border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#f5e4b0", fontSize: 14,
              outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif"
            }}
          />
          {nameError && (
            <div style={{ fontSize: 12, color: "#e06050", marginTop: 6 }}>{nameError}</div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#e8b840", marginBottom: 8 }}>Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="Your age"
            min="1"
            max="120"
            style={{
              width: 100, background: "rgba(5,10,18,0.9)", border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#f5e4b0", fontSize: 14,
              outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#e8b840", marginBottom: 8 }}>Default Wake Time</label>
          <input
            type="time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
            style={{
              background: "rgba(5,10,18,0.9)", border: "1px solid rgba(200,160,30,0.25)",
              borderRadius: 10, padding: "11px 14px", color: "#f5e4b0", fontSize: 14,
              outline: "none", colorScheme: "dark"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <ExportPDF dreams={dreams} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <label style={{ fontSize: 13, color: "#e8b840" }}>Dream Reminders</label>
            <div
              onClick={async () => {
                if (!reminderEnabled && notifSupported) {
                  const perm = await Notification.requestPermission();
                  setNotifPermission(perm);
                  if (perm !== "granted") return;
                }
                setReminderEnabled(r => !r);
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s",
                background: reminderEnabled ? "linear-gradient(135deg, #7a5200, #c89020)" : "rgba(255,255,255,0.1)",
                position: "relative"
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: reminderEnabled ? 22 : 3, width: 18, height: 18,
                borderRadius: "50%", background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)"
              }} />
            </div>
            <span style={{ fontSize: 12, color: "#6b5c30" }}>{reminderEnabled ? "On" : "Off"}</span>
          </div>
          {!notifSupported && (
            <div style={{ fontSize: 11, color: "#6b5c30", marginLeft: 0 }}>
              Notifications are not supported in this browser.
            </div>
          )}
          {notifSupported && notifPermission === "denied" && (
            <div style={{ fontSize: 11, color: "#c87040", marginLeft: 0 }}>
              Notifications are blocked. Enable them in your browser settings.
            </div>
          )}
          {reminderEnabled && notifPermission === "granted" && (
            <div style={{ fontSize: 11, color: "#7a9050", marginLeft: 0 }}>
              You'll get a reminder at your wake time to record your dreams.
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? "rgba(80,200,120,0.2)" : "linear-gradient(135deg, #7a5200, #c89020)",
          border: saved ? "1px solid rgba(80,200,120,0.4)" : "none",
          color: saved ? "#80e0a0" : "white", padding: "11px 28px", borderRadius: 40,
          fontSize: 13, cursor: saving ? "not-allowed" : "pointer", letterSpacing: 0.5,
          transition: "all 0.3s"
        }}>
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save Settings"}
        </button>

      </div>

      {/* Account */}
      <div style={{ ...card, textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#5040a0", marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 13, color: "#7a6a40", marginBottom: onSignOut ? 18 : 0 }}>{user.email}</div>

        {onSignOut && (
          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <button style={{
                background: "rgba(255,80,80,0.06)",
                border: "1px solid rgba(255,80,80,0.2)",
                color: "#d88080",
                padding: "10px 24px", borderRadius: 40, fontSize: 12,
                cursor: "pointer", fontFamily: "Georgia, serif",
                letterSpacing: 0.5, minHeight: 40,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.06)"; }}
              >
                Sign out
              </button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)", zIndex: 100,
                animation: "pt-overlayIn 0.2s ease",
              }} />
              <AlertDialog.Content style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                background: "linear-gradient(160deg, rgba(22,8,48,0.98) 0%, rgba(12,4,28,0.98) 100%)",
                border: "1px solid rgba(200,160,50,0.2)",
                borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "88%",
                boxShadow: "0 20px 70px rgba(0,0,0,0.7), 0 0 40px rgba(104,71,192,0.1)",
                animation: "pt-contentIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: 101, outline: "none",
              }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.8 }}>👋</div>
                  <AlertDialog.Title style={{
                    fontSize: 17, color: "#f5e4b0", marginBottom: 8,
                    fontFamily: "Georgia, serif", fontWeight: 400,
                  }}>
                    Sign out of Dream Shepherd?
                  </AlertDialog.Title>
                  <AlertDialog.Description style={{
                    fontSize: 13, color: "#8a7540", lineHeight: 1.6,
                    fontFamily: "Georgia, serif",
                  }}>
                    Your dreams are saved to your account. You can sign back in any time to pick up where you left off.
                  </AlertDialog.Description>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <AlertDialog.Cancel asChild>
                    <button style={{
                      flex: 1, background: "rgba(200,160,50,0.08)",
                      border: "1px solid rgba(200,160,30,0.25)",
                      color: "#c8a040", padding: "12px 16px", borderRadius: 12, fontSize: 14,
                      cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 44,
                    }}>
                      Stay
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button onClick={onSignOut} style={{
                      flex: 1, background: "rgba(255,80,80,0.12)",
                      border: "1px solid rgba(255,80,80,0.3)",
                      color: "#ff8888", padding: "12px 16px", borderRadius: 12, fontSize: 14,
                      cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600, minHeight: 44,
                    }}>
                      Sign out
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        )}
      </div>

      {/* Danger zone (App Store Guideline 5.1.1(v): in-app account deletion) */}
      {onDeleteAccount && (
        <div style={{
          ...card,
          background: "rgba(80,12,12,0.18)",
          border: "1px solid rgba(255,80,80,0.18)",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: "#c06060", textTransform: "uppercase", marginBottom: 10 }}>
            Danger Zone
          </div>
          <p style={{ fontSize: 13, color: "#a07070", lineHeight: 1.7, margin: "0 0 16px" }}>
            Delete your account and all your dreams, interpretations, and settings. This action cannot be undone.
          </p>

          <AlertDialog.Root onOpenChange={(o) => { if (!o) { setDeleteText(""); setDeleteError(""); } }}>
            <AlertDialog.Trigger asChild>
              <button style={{
                background: "rgba(255,80,80,0.08)",
                border: "1px solid rgba(255,80,80,0.3)",
                color: "#e08888",
                padding: "11px 22px", borderRadius: 40, fontSize: 13,
                cursor: "pointer", fontFamily: "Georgia, serif",
                letterSpacing: 0.5, minHeight: 40,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.16)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.08)"; }}
              >
                Delete account
              </button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)", zIndex: 100,
                animation: "pt-overlayIn 0.2s ease",
              }} />
              <AlertDialog.Content style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                background: "linear-gradient(160deg, rgba(40,8,12,0.98) 0%, rgba(18,4,8,0.98) 100%)",
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 20, padding: "28px 24px", maxWidth: 380, width: "92%",
                boxShadow: "0 20px 70px rgba(0,0,0,0.7), 0 0 40px rgba(180,40,40,0.15)",
                animation: "pt-contentIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: 101, outline: "none", fontFamily: "Georgia, serif",
              }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                  <AlertDialog.Title style={{
                    fontSize: 18, color: "#f5d4b0", marginBottom: 10,
                    fontFamily: "Georgia, serif", fontWeight: 400,
                  }}>
                    Permanently delete your account?
                  </AlertDialog.Title>
                  <AlertDialog.Description style={{
                    fontSize: 13, color: "#b89090", lineHeight: 1.7,
                    fontFamily: "Georgia, serif",
                  }}>
                    This will erase all your dreams, interpretations, sleep logs, and profile data. We cannot recover any of it once deleted.
                  </AlertDialog.Description>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#c8a040", marginBottom: 8 }}>
                    Type <span style={{ color: "#e08888", fontWeight: 600 }}>DELETE</span> to confirm
                  </label>
                  <input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="DELETE"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(5,10,18,0.9)",
                      border: "1px solid rgba(255,80,80,0.3)",
                      borderRadius: 10, padding: "11px 14px",
                      color: "#f5e4b0", fontSize: 14,
                      outline: "none", fontFamily: "Georgia, serif",
                      letterSpacing: 1,
                    }}
                  />
                  {deleteError && (
                    <div style={{ fontSize: 12, color: "#e06050", marginTop: 8 }}>{deleteError}</div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <AlertDialog.Cancel asChild>
                    <button style={{
                      flex: 1, background: "rgba(200,160,50,0.08)",
                      border: "1px solid rgba(200,160,30,0.25)",
                      color: "#c8a040", padding: "12px 16px", borderRadius: 12, fontSize: 14,
                      cursor: "pointer", fontFamily: "Georgia, serif", minHeight: 44,
                    }}>
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (deleteText.trim() !== "DELETE") {
                        setDeleteError('Please type "DELETE" exactly to confirm.');
                        return;
                      }
                      setDeleting(true);
                      setDeleteError("");
                      try {
                        await onDeleteAccount();
                      } catch (err) {
                        setDeleteError(err?.message || "Could not delete account. Please try again.");
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting || deleteText.trim() !== "DELETE"}
                    style={{
                      flex: 1,
                      background: deleteText.trim() === "DELETE"
                        ? "linear-gradient(135deg, #a04040, #c85050)"
                        : "rgba(120,40,40,0.4)",
                      border: "none",
                      color: "#fff",
                      padding: "12px 16px", borderRadius: 12, fontSize: 14,
                      cursor: deleting || deleteText.trim() !== "DELETE" ? "not-allowed" : "pointer",
                      fontFamily: "Georgia, serif", fontWeight: 600, minHeight: 44,
                      opacity: deleteText.trim() === "DELETE" ? 1 : 0.6,
                    }}
                  >
                    {deleting ? "Deleting..." : "Permanently delete"}
                  </button>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      )}
    </div>
  );
}
