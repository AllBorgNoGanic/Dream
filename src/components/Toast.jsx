import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

/**
 * Toast system
 *
 * Usage:
 *   1. Wrap your app:        <ToastProvider><App /></ToastProvider>
 *   2. Anywhere inside:      const toast = useToast();
 *                             toast.success("Dream saved");
 *                             toast.error("Couldn't save dream");
 *                             toast.info("Interpreting your dream...");
 *
 * Each toast auto-dismisses after `duration` ms (default 3500). Tap to dismiss.
 */

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    accent: "#7fbf6b",
    glow: "rgba(127,191,107,0.35)",
    icon: "✓",
  },
  error: {
    accent: "#d97a7a",
    glow: "rgba(217,122,122,0.35)",
    icon: "!",
  },
  info: {
    accent: "#9066d4",
    glow: "rgba(144,102,212,0.35)",
    icon: "✦",
  },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const push = useCallback(
    (message, options = {}) => {
      const id = ++idCounter;
      const toast = {
        id,
        message,
        type: options.type || "info",
        duration: options.duration ?? 3500,
      };
      setToasts((list) => [...list, toast]);
      timersRef.current[id] = setTimeout(() => dismiss(id), toast.duration);
      return id;
    },
    [dismiss]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  const api = {
    success: (msg, opts) => push(msg, { ...opts, type: "success" }),
    error: (msg, opts) => push(msg, { ...opts, type: "error" }),
    info: (msg, opts) => push(msg, { ...opts, type: "info" }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op fallback so calls don't crash if provider is missing
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <>
      <style>{`
        @keyframes ds-toast-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ds-toast-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(10px) scale(0.96); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
          zIndex: 9999,
          padding: "0 16px",
        }}
      >
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              onClick={() => onDismiss(t.id)}
              style={{
                pointerEvents: "auto",
                cursor: "pointer",
                background: "rgba(20,8,40,0.92)",
                border: `1px solid ${s.accent}55`,
                borderLeft: `3px solid ${s.accent}`,
                color: "#f5e4b0",
                fontFamily: "Georgia, serif",
                fontSize: 14,
                lineHeight: 1.4,
                padding: "12px 16px",
                borderRadius: 12,
                minWidth: 220,
                maxWidth: 380,
                boxShadow: `0 6px 24px rgba(0,0,0,0.45), 0 0 18px ${s.glow}`,
                backdropFilter: "blur(8px)",
                animation: "ds-toast-in 0.25s ease-out",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: `${s.accent}33`,
                  border: `1px solid ${s.accent}88`,
                  color: s.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
