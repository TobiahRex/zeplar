import {
  call,
  put,
  select,
  takeLatest,
  takeEvery,
  debounce,
  all,
} from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  loadAllCardProgress,
  loadStats as loadStatsFromDB,
  saveAllCardProgress,
  saveStats,
  loadActivity,
  saveActivity,
} from "@/lib/db";
import {
  calculateSM2,
  createInitialProgress,
  type Quality,
  type CardProgress,
} from "@/lib/sm2";
import {
  updateAllLayerUnlocks,
  initializeLayerUnlockStatus,
  type LayerUnlockStatus,
} from "@/lib/layerUnlock";
import { parseCardKey, generateAllL1Cards } from "@/lib/cardGenerator";
import { patternList } from "@/data/patterns";
import {
  // Request actions
  hydrateRequested,
  submitReviewRequested,
  startSessionRequested,
  // Success actions
  hydrateSucceeded,
  hydrateFailed,
  submitReviewSucceeded,
  submitReviewFailed,
  startSessionSucceeded,
  startSessionFailed,
  // State update actions
  loadProgress,
  loadStats,
  loadActivityByDate,
  loadLayerUnlocks,
  // Actions that trigger persistence
  submitReview,
  endSession,
  initializeLayerUnlocks,
} from "./learningSlice";
import {
  selectProgress,
  selectStats,
  selectActivityByDate,
} from "./learningSlice";

// Type for Redux state
interface RootState {
  learning: {
    progress: Record<string, CardProgress>;
    stats: {
      totalReviews: number;
      streak: number;
      lastStudyDate?: string;
    };
    activityByDate: Record<string, number>;
    layerUnlocks: Record<string, LayerUnlockStatus>;
  };
}

// =============================================================================
// Hydration Saga - Load data from IndexedDB on app start
// =============================================================================

function* hydrateSaga() {
  try {
    // Load all data from IndexedDB in parallel
    const [storedProgress, storedStats, storedActivity]: [
      Record<string, CardProgress>,
      { totalReviews: number; streak: number; lastStudyDate?: string } | null,
      Record<string, number>,
    ] = yield all([
      call(loadAllCardProgress),
      call(loadStatsFromDB),
      call(loadActivity),
    ]);

    // Dispatch load actions
    if (Object.keys(storedProgress).length > 0) {
      yield put(loadProgress(storedProgress));
    }

    if (storedStats) {
      yield put(loadStats(storedStats));
    }

    if (Object.keys(storedActivity).length > 0) {
      yield put(loadActivityByDate(storedActivity));
    }

    // Initialize layer unlocks based on loaded progress
    const patternIds = patternList.map((p) => p.id);
    const layerUnlocks: Record<string, LayerUnlockStatus> = {};

    for (const patternId of patternIds) {
      layerUnlocks[patternId] = initializeLayerUnlockStatus();
    }

    // Update layer unlocks with loaded progress
    const updatedLayerUnlocks: Record<string, LayerUnlockStatus> =
      updateAllLayerUnlocks(patternIds, storedProgress, layerUnlocks);

    yield put(loadLayerUnlocks(updatedLayerUnlocks));
    yield put(hydrateSucceeded());
  } catch (error) {
    console.error("Failed to hydrate from IndexedDB:", error);
    yield put(hydrateFailed((error as Error).message));
  }
}

// =============================================================================
// Persistence Sagas - Auto-save to IndexedDB (debounced)
// =============================================================================

function* persistProgressSaga() {
  try {
    const progress: Record<string, CardProgress> = yield select(selectProgress);
    yield call(saveAllCardProgress, progress);
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}

function* persistStatsSaga() {
  try {
    const stats: RootState["learning"]["stats"] = yield select(selectStats);
    yield call(saveStats, stats);
  } catch (error) {
    console.error("Failed to save stats:", error);
  }
}

function* persistActivitySaga() {
  try {
    const activityByDate: Record<string, number> =
      yield select(selectActivityByDate);
    yield call(saveActivity, activityByDate);
  } catch (error) {
    console.error("Failed to save activity:", error);
  }
}

// =============================================================================
// Start Session Saga - Generate cards and start session
// =============================================================================

function* startSessionSaga(
  action: PayloadAction<{ patternIds?: string[] } | undefined>,
) {
  try {
    const { patternIds } = action.payload || {};

    // Generate all L1 cards
    const allCards = generateAllL1Cards(patternList);

    // Filter cards if specific patterns were selected
    const cards = patternIds
      ? allCards.filter((card) => patternIds.includes(card.patternId))
      : allCards;

    const cardKeys = cards.map((c) => c.id);

    if (cardKeys.length === 0) {
      yield put(startSessionFailed("No cards available"));
      return;
    }

    yield put(startSessionSucceeded(cardKeys));
  } catch (error) {
    console.error("Failed to start session:", error);
    yield put(startSessionFailed((error as Error).message));
  }
}

// =============================================================================
// Submit Review Saga - Handle SM2 calculation, layer unlocks, and persistence
// =============================================================================

function* submitReviewSaga(
  action: PayloadAction<{ cardKey: string; quality: Quality }>,
) {
  try {
    const { cardKey, quality } = action.payload;

    // Parse card key
    const parsed = parseCardKey(cardKey);
    if (!parsed) {
      yield put(submitReviewFailed({ cardKey, error: "Invalid card key" }));
      return;
    }

    // Get current progress from state
    const allProgress: Record<string, CardProgress> =
      yield select(selectProgress);
    const currentProgress =
      allProgress[cardKey] ||
      createInitialProgress(
        cardKey,
        parsed.patternId,
        `L${parsed.layer}` as "L1" | "L2" | "L3",
      );

    // Calculate new progress using SM2
    const result = calculateSM2(currentProgress, quality);

    // Create updated progress object
    const updatedProgress: CardProgress = {
      ...currentProgress,
      ...result,
      lastReviewDate: new Date() as unknown as Date,
      nextReviewDate: result.nextReviewDate,
    };

    // Get current layer unlocks
    const layerUnlocks: Record<string, LayerUnlockStatus> = yield select(
      (state: RootState) => state.learning.layerUnlocks,
    );

    // Update layer unlocks for this pattern
    const updatedLayerUnlocks = updateAllLayerUnlocks(
      [parsed.patternId],
      { ...allProgress, [cardKey]: updatedProgress },
      layerUnlocks,
    );

    // Get today's date for activity tracking
    const today = new Date().toISOString().split("T")[0];

    // Dispatch success action with all computed data
    yield put(
      submitReviewSucceeded({
        cardKey,
        progress: updatedProgress,
        quality,
        timestamp: new Date().toISOString(),
        today,
        layerUnlocks: updatedLayerUnlocks,
      }),
    );
  } catch (error) {
    console.error("Failed to submit review:", error);
    yield put(
      submitReviewFailed({
        cardKey: action.payload.cardKey,
        error: (error as Error).message,
      }),
    );
  }
}

// =============================================================================
// Root Saga - Wire up all watchers
// =============================================================================

export function* learningSagas() {
  yield all([
    // Hydration
    takeLatest(hydrateRequested.type, hydrateSaga),

    // Session management
    takeLatest(startSessionRequested.type, startSessionSaga),

    // Review submission
    takeEvery(submitReviewRequested.type, submitReviewSaga),

    // Auto-persist to IndexedDB (debounced 500ms)
    // Watch for any action that changes progress/stats/activity
    debounce(500, submitReview.type, persistProgressSaga),
    debounce(500, endSession.type, persistStatsSaga),
    debounce(500, submitReview.type, persistActivitySaga),
    debounce(500, initializeLayerUnlocks.type, persistProgressSaga),
  ]);
}
