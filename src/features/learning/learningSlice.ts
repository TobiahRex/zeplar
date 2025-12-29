import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type CardProgress, type Quality } from "@/lib/sm2";
import {
  type LayerUnlockStatus,
  initializeLayerUnlockStatus,
} from "@/lib/layerUnlock";

interface StudySession {
  isActive: boolean;
  queue: string[]; // Card keys to study
  currentIndex: number;
  startedAt?: string;
  results: {
    cardKey: string;
    quality: Quality;
    timestamp: string;
  }[];
}

interface LearningState {
  // Card progress indexed by card key
  progress: Record<string, CardProgress>;

  // Current study session
  session: StudySession;

  // Layer unlock status indexed by pattern ID
  layerUnlocks: Record<string, LayerUnlockStatus>;

  // Stats
  stats: {
    totalReviews: number;
    streak: number;
    lastStudyDate?: string;
  };

  // Activity tracking - cards reviewed per day (YYYY-MM-DD -> count)
  activityByDate: Record<string, number>;

  // Loading states
  isHydrating: boolean;
  isHydrated: boolean;
  sessionLoading: boolean;
  error: string | null;
}

const initialState: LearningState = {
  progress: {},
  session: {
    isActive: false,
    queue: [],
    currentIndex: 0,
    results: [],
  },
  layerUnlocks: {},
  stats: {
    totalReviews: 0,
    streak: 0,
  },
  activityByDate: {},
  isHydrating: false,
  isHydrated: false,
  sessionLoading: false,
  error: null,
};

const learningSlice = createSlice({
  name: "learning",
  initialState,
  reducers: {
    // =============================================================================
    // Hydration Actions
    // =============================================================================

    hydrateRequested(state) {
      state.isHydrating = true;
      state.error = null;
    },

    hydrateSucceeded(state) {
      state.isHydrating = false;
      state.isHydrated = true;
    },

    hydrateFailed(state, action: PayloadAction<string>) {
      state.isHydrating = false;
      state.isHydrated = true; // Still mark as hydrated to not block app
      state.error = action.payload;
    },

    // =============================================================================
    // Start Session Actions
    // =============================================================================

    startSessionRequested(state) {
      state.sessionLoading = true;
      state.error = null;
    },

    startSessionSucceeded(state, action: PayloadAction<string[]>) {
      state.session = {
        isActive: true,
        queue: action.payload,
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        results: [],
      };
      state.sessionLoading = false;
    },

    startSessionFailed(state, action: PayloadAction<string>) {
      state.sessionLoading = false;
      state.error = action.payload;
    },

    // =============================================================================
    // Submit Review Actions
    // =============================================================================

    submitReviewRequested(state) {
      // Just mark the action as requested - saga will handle it
      state.error = null;
    },

    submitReviewSucceeded(
      state,
      action: PayloadAction<{
        cardKey: string;
        progress: CardProgress;
        quality: Quality;
        timestamp: string;
        today: string;
        layerUnlocks: Record<string, LayerUnlockStatus>;
      }>,
    ) {
      const { cardKey, progress, quality, timestamp, today, layerUnlocks } =
        action.payload;

      // Update progress (pure state update - no logic)
      state.progress[cardKey] = progress;

      // Record in session
      state.session.results.push({
        cardKey,
        quality,
        timestamp,
      });

      // Update stats
      state.stats.totalReviews += 1;

      // Update activity for today
      state.activityByDate[today] = (state.activityByDate[today] || 0) + 1;

      // Update layer unlocks
      state.layerUnlocks = layerUnlocks;
    },

    submitReviewFailed(
      state,
      action: PayloadAction<{ cardKey: string; error: string }>,
    ) {
      state.error = action.payload.error;
    },

    // Keep internal action for persistence watcher
    submitReview() {
      // This is now just a marker action for persistence
      // The saga will handle the actual logic
    },

    // Advance to next card
    nextCard(state) {
      if (state.session.currentIndex < state.session.queue.length - 1) {
        state.session.currentIndex += 1;
      }
    },

    // End the current session
    endSession(state) {
      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const lastStudy = state.stats.lastStudyDate;

      if (lastStudy) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastStudy === yesterdayStr) {
          state.stats.streak += 1;
        } else if (lastStudy !== today) {
          state.stats.streak = 1;
        }
      } else {
        state.stats.streak = 1;
      }

      state.stats.lastStudyDate = today;

      // Reset session
      state.session = {
        isActive: false,
        queue: [],
        currentIndex: 0,
        results: [],
      };
    },

    // Load persisted progress (for hydration)
    loadProgress(state, action: PayloadAction<Record<string, CardProgress>>) {
      state.progress = action.payload;
    },

    // Load persisted stats
    loadStats(state, action: PayloadAction<LearningState["stats"]>) {
      state.stats = action.payload;
    },

    // Initialize layer unlocks for all patterns
    initializeLayerUnlocks(state, action: PayloadAction<string[]>) {
      const patternIds = action.payload;
      patternIds.forEach((patternId) => {
        if (!state.layerUnlocks[patternId]) {
          state.layerUnlocks[patternId] = initializeLayerUnlockStatus();
        }
      });
    },

    // Load persisted layer unlocks
    loadLayerUnlocks(
      state,
      action: PayloadAction<Record<string, LayerUnlockStatus>>,
    ) {
      state.layerUnlocks = action.payload;
    },

    // Load persisted activity data
    loadActivityByDate(state, action: PayloadAction<Record<string, number>>) {
      state.activityByDate = action.payload;
    },
  },
});

export const {
  // Hydration actions
  hydrateRequested,
  hydrateSucceeded,
  hydrateFailed,
  // Session actions
  startSessionRequested,
  startSessionSucceeded,
  startSessionFailed,
  // Review actions
  submitReviewRequested,
  submitReviewSucceeded,
  submitReviewFailed,
  submitReview, // Internal action for persistence watcher
  // Navigation actions
  nextCard,
  endSession,
  // Load actions (for hydration)
  loadProgress,
  loadStats,
  loadLayerUnlocks,
  loadActivityByDate,
  // Initialization
  initializeLayerUnlocks,
} = learningSlice.actions;

export default learningSlice.reducer;

// Selectors
export const selectProgress = (state: { learning: LearningState }) =>
  state.learning.progress;

export const selectSession = (state: { learning: LearningState }) =>
  state.learning.session;

export const selectStats = (state: { learning: LearningState }) =>
  state.learning.stats;

export const selectCurrentCardKey = (state: { learning: LearningState }) => {
  const { session } = state.learning;
  if (!session.isActive || session.currentIndex >= session.queue.length) {
    return null;
  }
  return session.queue[session.currentIndex];
};

export const selectSessionProgress = (state: { learning: LearningState }) => {
  const { session } = state.learning;
  return {
    current: session.currentIndex + 1,
    total: session.queue.length,
    completed: session.results.length,
  };
};

export const selectCardProgress =
  (cardKey: string) => (state: { learning: LearningState }) =>
    state.learning.progress[cardKey];

export const selectSessionComplete = (state: { learning: LearningState }) => {
  const { session } = state.learning;
  return session.currentIndex >= session.queue.length;
};

// Layer unlock selectors
export const selectLayerUnlocks = (state: { learning: LearningState }) =>
  state.learning.layerUnlocks;

export const selectLayerUnlockByPattern =
  (patternId: string) => (state: { learning: LearningState }) =>
    state.learning.layerUnlocks[patternId];

export const selectLayerMastery =
  (patternId: string, layer: "L1" | "L2" | "L3") =>
  (state: { learning: LearningState }) => {
    const status = state.learning.layerUnlocks[patternId];
    if (!status) return 0;

    if (layer === "L1") return status.l1Mastery;
    if (layer === "L2") return status.l2Mastery;
    if (layer === "L3") return status.l3Mastery;
    return 0;
  };

export const selectIsLayerUnlocked =
  (patternId: string, layer: "L1" | "L2" | "L3") =>
  (state: { learning: LearningState }) => {
    const status = state.learning.layerUnlocks[patternId];
    if (!status) return false;

    if (layer === "L1") return status.l1Unlocked;
    if (layer === "L2") return status.l2Unlocked;
    if (layer === "L3") return status.l3Unlocked;
    return false;
  };

// Activity selectors
export const selectActivityByDate = (state: { learning: LearningState }) =>
  state.learning.activityByDate;
