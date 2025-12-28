import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  type CardProgress,
  type Quality,
  calculateSM2,
  createInitialProgress,
} from "@/lib/sm2";
import {
  type LayerUnlockStatus,
  updateAllLayerUnlocks,
  initializeLayerUnlockStatus,
} from "@/lib/layerUnlock";
import { parseCardKey } from "@/lib/cardGenerator";

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
};

const learningSlice = createSlice({
  name: "learning",
  initialState,
  reducers: {
    // Start a new study session with given card keys
    startSession(state, action: PayloadAction<string[]>) {
      state.session = {
        isActive: true,
        queue: action.payload,
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        results: [],
      };
    },

    // Submit a review for the current card
    submitReview(
      state,
      action: PayloadAction<{ cardKey: string; quality: Quality }>,
    ) {
      const { cardKey, quality } = action.payload;

      // Parse card key to get pattern and layer info
      const parsed = parseCardKey(cardKey);
      if (!parsed) return;

      // Get or create progress
      const current =
        state.progress[cardKey] ||
        createInitialProgress(
          cardKey,
          parsed.patternId,
          parsed.layer as "L1" | "L2" | "L3",
        );

      // Calculate new progress
      const result = calculateSM2(current, quality);

      // Update progress
      state.progress[cardKey] = {
        ...current,
        ...result,
        lastReviewDate: new Date().toISOString() as unknown as Date,
        nextReviewDate: result.nextReviewDate,
      };

      // Record in session
      state.session.results.push({
        cardKey,
        quality,
        timestamp: new Date().toISOString(),
      });

      // Update stats
      state.stats.totalReviews += 1;

      // Recalculate layer unlocks for this pattern
      const patternIds = [parsed.patternId];
      state.layerUnlocks = updateAllLayerUnlocks(
        patternIds,
        state.progress,
        state.layerUnlocks,
      );
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

    // Update layer unlocks for all patterns
    updateLayerUnlocks(state, action: PayloadAction<string[]>) {
      const patternIds = action.payload;
      state.layerUnlocks = updateAllLayerUnlocks(
        patternIds,
        state.progress,
        state.layerUnlocks,
      );
    },

    // Load persisted layer unlocks
    loadLayerUnlocks(
      state,
      action: PayloadAction<Record<string, LayerUnlockStatus>>,
    ) {
      state.layerUnlocks = action.payload;
    },
  },
});

export const {
  startSession,
  submitReview,
  nextCard,
  endSession,
  loadProgress,
  loadStats,
  initializeLayerUnlocks,
  updateLayerUnlocks,
  loadLayerUnlocks,
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
