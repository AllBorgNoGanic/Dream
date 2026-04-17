/**
 * OfflineBanner
 *
 * Shows a small bar above the tab content when:
 *   - User is offline (yellow warning)
 *   - There are pending dreams waiting to sync (gold info)
 *   - A sync is in progress (purple spinner)
 */
export default function OfflineBanner({ isOnline, pendingCount, syncing, onSync }) {
  if (isOnline && pendingCount === 0 && !syncing) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "8px 16px",
        marginBottom: 16,
        borderRadius: 12,
        fontSize: 13,
        fontFamily: "Georgia, serif",
        animation: "fadeIn 0.3s ease",
        ...(!isOnline
          ? {
              background: "rgba(200,160,30,0.12)",
              border: "1px solid rgba(200,160,30,0.3)",
              color: "#e8b840",
            }
          : syncing
            ? {
                background: "rgba(144,102,212,0.12)",
                border: "1px solid rgba(144,102,212,0.3)",
                color: "#b08aee",
              }
            : {
                background: "rgba(127,191,107,0.1)",
                border: "1px solid rgba(127,191,107,0.3)",
                color: "#7fbf6b",
              }),
      }}
    >
      {!isOnline && (
        <>
          <span style={{ fontSize: 16 }}>☁️</span>
          <span>
            You're offline.
            {pendingCount > 0
              ? ` ${pendingCount} dream${pendingCount === 1 ? "" : "s"} will sync when you reconnect.`
              : " You can still browse and record dreams."}
          </span>
        </>
      )}

      {isOnline && syncing && (
        <>
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              border: "2px solid rgba(144,102,212,0.3)",
              borderTopColor: "#b08aee",
              borderRadius: "50%",
              animation: "ds-spin 0.7s linear infinite",
            }}
          />
          <span>Syncing {pendingCount} dream{pendingCount === 1 ? "" : "s"}...</span>
          <style>{`@keyframes ds-spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {isOnline && !syncing && pendingCount > 0 && (
        <>
          <span style={{ fontSize: 16 }}>✦</span>
          <span>{pendingCount} dream{pendingCount === 1 ? "" : "s"} ready to sync</span>
          <button
            onClick={onSync}
            style={{
              background: "rgba(127,191,107,0.2)",
              border: "1px solid rgba(127,191,107,0.4)",
              color: "#7fbf6b",
              padding: "4px 14px",
              borderRadius: 20,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              fontWeight: 600,
            }}
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
