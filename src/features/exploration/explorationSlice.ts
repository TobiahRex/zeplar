import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SystemQuality, Difficulty } from "@/data/schema";

interface ExplorationState {
  searchQuery: string;
  filters: {
    qualities: SystemQuality[];
    difficulties: Difficulty[];
    tags: string[];
  };
  hierarchyExpanded: Record<string, boolean>;
  selectedPattern: string | null;
  selectedSystem: string | null;
}

const initialState: ExplorationState = {
  searchQuery: "",
  filters: {
    qualities: [],
    difficulties: [],
    tags: [],
  },
  hierarchyExpanded: {},
  selectedPattern: null,
  selectedSystem: null,
};

const explorationSlice = createSlice({
  name: "exploration",
  initialState,
  reducers: {
    // Update search query
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },

    // Add a filter by type
    addFilter(
      state,
      action: PayloadAction<{
        type: "qualities" | "difficulties" | "tags";
        value: string;
      }>,
    ) {
      const { type, value } = action.payload;
      const filterArray = state.filters[type];

      // Only add if not already present
      if (!filterArray.includes(value as never)) {
        filterArray.push(value as never);
      }
    },

    // Remove a filter by type
    removeFilter(
      state,
      action: PayloadAction<{
        type: "qualities" | "difficulties" | "tags";
        value: string;
      }>,
    ) {
      const { type, value } = action.payload;
      state.filters[type] = state.filters[type].filter(
        (item) => item !== value,
      ) as never[];
    },

    // Clear all filters
    clearFilters(state) {
      state.filters = {
        qualities: [],
        difficulties: [],
        tags: [],
      };
    },

    // Toggle hierarchy node expansion
    toggleHierarchyNode(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.hierarchyExpanded[id] = !state.hierarchyExpanded[id];
    },

    // Select a pattern
    selectPattern(state, action: PayloadAction<string | null>) {
      state.selectedPattern = action.payload;
      // Clear system selection when pattern is selected
      if (action.payload !== null) {
        state.selectedSystem = null;
      }
    },

    // Select a system
    selectSystem(state, action: PayloadAction<string | null>) {
      state.selectedSystem = action.payload;
      // Clear pattern selection when system is selected
      if (action.payload !== null) {
        state.selectedPattern = null;
      }
    },
  },
});

export const {
  setSearchQuery,
  addFilter,
  removeFilter,
  clearFilters,
  toggleHierarchyNode,
  selectPattern,
  selectSystem,
} = explorationSlice.actions;

export default explorationSlice.reducer;

// Selectors
export const selectSearchQuery = (state: { exploration: ExplorationState }) =>
  state.exploration.searchQuery;

export const selectFilters = (state: { exploration: ExplorationState }) =>
  state.exploration.filters;

export const selectQualityFilters = (state: {
  exploration: ExplorationState;
}) => state.exploration.filters.qualities;

export const selectDifficultyFilters = (state: {
  exploration: ExplorationState;
}) => state.exploration.filters.difficulties;

export const selectTagFilters = (state: { exploration: ExplorationState }) =>
  state.exploration.filters.tags;

export const selectHierarchyExpanded = (state: {
  exploration: ExplorationState;
}) => state.exploration.hierarchyExpanded;

export const selectIsNodeExpanded =
  (nodeId: string) => (state: { exploration: ExplorationState }) =>
    state.exploration.hierarchyExpanded[nodeId] || false;

export const selectSelectedPattern = (state: {
  exploration: ExplorationState;
}) => state.exploration.selectedPattern;

export const selectSelectedSystem = (state: {
  exploration: ExplorationState;
}) => state.exploration.selectedSystem;
