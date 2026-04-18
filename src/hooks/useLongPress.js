import { useRef, useCallback } from "react";

/**
 * Long-press / right-click gesture handler with optional haptic feedback.
 *
 * Returns event handlers to spread onto an element:
 *   const longPress = useLongPress(() => openMenu());
 *   <div {...longPress}>...</div>
 *
 * Triggers if the user holds for `delay` ms without moving more than `moveThreshold` px,
 * or if they right-click (contextmenu).
 */
export default function useLongPress(onLongPress, { delay = 500, moveThreshold = 8 } = {}) {
  const timerRef = useRef(null);
  const startPosRef = useRef(null);
  const triggeredRef = useRef(false);

  const triggerHaptic = useCallback(async () => {
    // Capacitor haptic (native), with web vibration fallback
    try {
      const cap = await import("@capacitor/haptics").catch(() => null);
      if (cap?.Haptics?.impact) {
        await cap.Haptics.impact({ style: "MEDIUM" });
        return;
      }
    } catch {
      // ignore
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(15); } catch { /* ignore */ }
    }
  }, []);

  const fire = useCallback((e) => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    triggerHaptic();
    onLongPress(e);
  }, [onLongPress, triggerHaptic]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const onPointerDown = useCallback((e) => {
    triggeredRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    cancel();
    timerRef.current = setTimeout(() => fire(e), delay);
  }, [cancel, fire, delay]);

  const onPointerMove = useCallback((e) => {
    if (!startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) cancel();
  }, [cancel, moveThreshold]);

  const onPointerUp = useCallback(() => {
    cancel();
  }, [cancel]);

  const onPointerCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const onContextMenu = useCallback((e) => {
    // Right-click on desktop also opens the action sheet
    e.preventDefault();
    fire(e);
  }, [fire]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onContextMenu,
    /** True if the most recent pointer interaction triggered a long-press.
     *  Can be checked inside a click handler to suppress the click. */
    didTrigger: () => triggeredRef.current,
  };
}
