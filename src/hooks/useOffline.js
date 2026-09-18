import { useState, useEffect, useCallback, useRef } from "react";
import {
  addPendingDream,
  getPendingDreams,
  removePendingDream,
  countPendingDreams,
  cacheDreams,
  getCachedDreams,
} from "../lib/offlineStore";
import { trackEvent } from "../lib/posthog";

/**
 * useOffline
 *
 * Tracks online/offline state, manages the pending-dream queue,
 * and provides sync + cache helpers.
 *
 * Returns:
 *   isOnline      - boolean
 *   pendingCount  - number of dreams waiting to sync
 *   syncing       - boolean while a sync is running
 *   queueDream    - (payload) => Promise<offlineId>
 *   syncAll       - (supabase, userId, afterSync) => syncs pending dreams
 *   cacheDreamList - (dreams[]) => caches for offline reading
 *   loadCachedDreams - () => Promise<dreams[]>
 *   refreshPendingCount - () => re-read pending count from IDB
 */
export default function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncInProgress = useRef(false);

  // Track navigator.onLine
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Load initial pending count
  useEffect(() => {
    countPendingDreams()
      .then(setPendingCount)
      .catch(() => {});
  }, []);

  const refreshPendingCount = useCallback(() => {
    return countPendingDreams()
      .then((n) => {
        setPendingCount(n);
        return n;
      })
      .catch(() => 0);
  }, []);

  /**
   * Queue a dream for later sync. Returns the temporary offlineId.
   */
  const queueDream = useCallback(
    async (payload) => {
      const offlineId = await addPendingDream(payload);
      await refreshPendingCount();
      return offlineId;
    },
    [refreshPendingCount]
  );

  /**
   * Sync all pending dreams to Supabase.
   * @param {object}   supabase   - supabase client
   * @param {string}   userId     - current user id
   * @param {function} afterSync  - called after all syncs (e.g. reload dreams)
   * @returns {number} count of successfully synced dreams
   */
  const syncAll = useCallback(
    async (supabase, userId, afterSync) => {
      if (syncInProgress.current) return 0;
      syncInProgress.current = true;
      setSyncing(true);

      let synced = 0;
      try {
        const pending = await getPendingDreams();
        for (const entry of pending) {
          try {
            // Strip offline-only metadata before inserting
            const { offlineId, _queuedAt, _offlineCreated, ...payload } = entry;
            // Ensure we use current userId (in case it changed)
            payload.user_id = userId;

            const { error } = await supabase.from("dreams").insert(payload);
            if (error) {
              console.error("Offline sync failed for", offlineId, error);
              continue; // keep in queue, try again next time
            }

            await removePendingDream(offlineId);
            synced++;

            // Capture dream_created here (not at offline queue time): this
            // is the point the dream actually reaches the backend, so the
            // event only fires for dreams that really landed. dream_number
            // comes from an authoritative count after the insert.
            try {
              const { count } = await supabase
                .from("dreams")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId);
              const desc = payload.description || "";
              trackEvent("dream_created", {
                dream_number: count ?? null,
                mood: payload.mood || null,
                theme: payload.theme || null,
                has_interpretation: false,
                word_count: desc ? desc.split(/\s+/).length : 0,
                synced_offline: true,
              });
            } catch {
              // Analytics must never block or fail a sync.
            }
          } catch (err) {
            console.error("Offline sync error:", err);
          }
        }

        await refreshPendingCount();
        if (synced > 0 && typeof afterSync === "function") {
          await afterSync();
        }
      } finally {
        syncInProgress.current = false;
        setSyncing(false);
      }
      return synced;
    },
    [refreshPendingCount]
  );

  /**
   * Cache the current dream list for offline reading.
   */
  const cacheDreamList = useCallback((dreams) => {
    return cacheDreams(dreams).catch((err) => {
      console.error("Failed to cache dreams:", err);
    });
  }, []);

  /**
   * Load cached dreams from IndexedDB.
   */
  const loadCachedDreams = useCallback(() => {
    return getCachedDreams();
  }, []);

  return {
    isOnline,
    pendingCount,
    syncing,
    queueDream,
    syncAll,
    cacheDreamList,
    loadCachedDreams,
    refreshPendingCount,
  };
}
