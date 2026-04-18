import * as Dialog from "@radix-ui/react-dialog";

// Inject keyframes once
const STYLE_ID = "dream-action-sheet-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes das-overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes das-overlayOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes das-sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes das-sheetOut { from { transform: translateY(0); } to { transform: translateY(100%); } }
  `;
  document.head.appendChild(style);
}

/**
 * Bottom-sheet action menu for a dream card.
 * Triggered by long-press (mobile) or right-click (desktop) or the kebab button.
 *
 * Props:
 *   open, onOpenChange   – controlled state
 *   dream                – the dream object (for showing title in the header)
 *   actions              – array of { label, icon, onClick, danger?, hidden? }
 */
export default function DreamActionSheet({ open, onOpenChange, dream, actions = [] }) {
  const visibleActions = actions.filter((a) => !a.hidden);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            zIndex: 200,
            animation: "das-overlayIn 0.2s ease",
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            left: 0, right: 0, bottom: 0,
            background: "linear-gradient(180deg, rgba(22,8,48,0.98) 0%, rgba(12,4,28,0.98) 100%)",
            borderTop: "1px solid rgba(200,160,30,0.25)",
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: "12px 12px max(20px, env(safe-area-inset-bottom)) 12px",
            zIndex: 201,
            outline: "none",
            animation: "das-sheetIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 -10px 50px rgba(0,0,0,0.7), 0 0 50px rgba(104,71,192,0.12)",
            maxHeight: "75vh",
            overflowY: "auto",
          }}
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <div style={{
              width: 44, height: 4,
              background: "rgba(200,160,30,0.25)",
              borderRadius: 2,
            }} />
          </div>

          {/* Header */}
          <Dialog.Title style={{
            textAlign: "center",
            fontFamily: "Georgia, serif", fontSize: 14, color: "#f0d890",
            margin: "8px 0 4px", padding: "0 16px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            fontWeight: 400,
          }}>
            {dream?.title || "Dream actions"}
          </Dialog.Title>
          <div style={{
            textAlign: "center",
            fontFamily: "Georgia, serif", fontSize: 11,
            color: "#6b5c30", marginBottom: 14, letterSpacing: 0.5,
          }}>
            Choose an action
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 4px" }}>
            {visibleActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick();
                  onOpenChange(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  background: action.danger ? "rgba(255,80,80,0.08)" : "rgba(200,160,30,0.05)",
                  border: action.danger
                    ? "1px solid rgba(255,80,80,0.2)"
                    : "1px solid rgba(200,160,30,0.15)",
                  borderRadius: 14,
                  color: action.danger ? "#ff8888" : "#f0d890",
                  fontFamily: "Georgia, serif", fontSize: 14,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.15s, transform 0.1s",
                  minHeight: 50,
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = action.danger
                    ? "rgba(255,80,80,0.14)"
                    : "rgba(200,160,30,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = action.danger
                    ? "rgba(255,80,80,0.08)"
                    : "rgba(200,160,30,0.05)";
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>
                  {action.icon}
                </span>
                <span style={{ flex: 1 }}>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Cancel */}
          <Dialog.Close asChild>
            <button
              style={{
                marginTop: 14, width: "100%",
                padding: "14px",
                background: "transparent",
                border: "1px solid rgba(200,160,30,0.2)",
                borderRadius: 14,
                color: "#9a8050",
                fontFamily: "Georgia, serif", fontSize: 14,
                cursor: "pointer", minHeight: 50,
              }}
            >
              Cancel
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
