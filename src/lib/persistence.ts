import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectProgress,
  selectStats,
  loadProgress,
  loadStats,
} from "@/features/learning/learningSlice";
import {
  loadAllCardProgress,
  loadStats as loadStatsFromDB,
  saveAllCardProgress,
  saveStats,
} from "./db";

/**
 * Hook to hydrate Redux state from IndexedDB on mount
 * and persist changes back to IndexedDB
 */
export function usePersistence() {
  const dispatch = useAppDispatch();
  const progress = useAppSelector(selectProgress);
  const stats = useAppSelector(selectStats);
  const [isHydrated, setIsHydrated] = useState(false);
  const isInitialMount = useRef(true);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const [storedProgress, storedStats] = await Promise.all([
          loadAllCardProgress(),
          loadStatsFromDB(),
        ]);

        if (Object.keys(storedProgress).length > 0) {
          dispatch(loadProgress(storedProgress));
        }

        if (storedStats) {
          dispatch(loadStats(storedStats));
        }

        setIsHydrated(true);
      } catch (error) {
        console.error("Failed to hydrate from IndexedDB:", error);
        setIsHydrated(true);
      }
    }

    hydrate();
  }, [dispatch]);

  // Persist progress changes to IndexedDB
  useEffect(() => {
    // Skip initial mount and wait for hydration
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isHydrated) return;

    // Debounce saves
    const timer = setTimeout(() => {
      saveAllCardProgress(progress).catch((err) =>
        console.error("Failed to save progress:", err),
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [progress]);

  // Persist stats changes to IndexedDB
  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      saveStats(stats).catch((err) =>
        console.error("Failed to save stats:", err),
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [stats]);

  return { isHydrated };
}
