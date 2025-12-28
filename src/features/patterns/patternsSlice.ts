import { createSlice, createSelector } from '@reduxjs/toolkit'
import { patterns } from '@/data/patterns'
import type { Pattern, Implementation, SystemQuality } from '@/data/schema'
import type { RootState } from '@/app/store'

// =============================================================================
// State Interface
// =============================================================================

// Placeholder for RealWorldSystem - will be defined in future phase
export interface RealWorldSystem {
  id: string
  name: string
  // Additional fields will be added when systems are authored
}

export interface EntitiesState {
  patterns: Record<string, Pattern>
  systems: Record<string, RealWorldSystem>
  implementations: Record<string, Implementation>
  loaded: boolean
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: EntitiesState = {
  patterns: {},
  systems: {},
  implementations: {},
  loaded: false,
}

// =============================================================================
// Slice
// =============================================================================

export const patternsSlice = createSlice({
  name: 'patterns',
  initialState,
  reducers: {
    loadPatterns: (state) => {
      // Load all patterns from data files into normalized state
      state.patterns = patterns
      state.loaded = true
    },
  },
})

// =============================================================================
// Actions
// =============================================================================

export const { loadPatterns } = patternsSlice.actions

// =============================================================================
// Selectors
// =============================================================================

// Base selector for patterns state
const selectPatternsState = (state: RootState) => state.patterns

// Select all patterns as Record
export const selectAllPatternsRecord = createSelector(
  [selectPatternsState],
  (patternsState) => patternsState.patterns
)

// Select all patterns as array
export const selectAllPatterns = createSelector(
  [selectAllPatternsRecord],
  (patternsRecord) => Object.values(patternsRecord)
)

// Select pattern by ID
export const selectPatternById = createSelector(
  [selectAllPatternsRecord, (_state: RootState, patternId: string) => patternId],
  (patterns, patternId) => patterns[patternId]
)

// Select patterns by quality
export const selectPatternsByQuality = createSelector(
  [selectAllPatterns, (_state: RootState, quality: SystemQuality) => quality],
  (patterns, quality) => patterns.filter(p => p.hierarchy.quality === quality)
)

// Select related patterns by pattern ID
export const selectRelatedPatterns = createSelector(
  [
    selectAllPatternsRecord,
    (_state: RootState, patternId: string) => patternId,
  ],
  (patternsRecord, patternId) => {
    const pattern = patternsRecord[patternId]
    if (!pattern) return []

    // Get related pattern IDs from the concept.relatedPatterns array
    return pattern.concept.relatedPatterns
      .map(relatedId => patternsRecord[relatedId])
      .filter((p): p is Pattern => p !== undefined)
  }
)

// Select loaded state
export const selectPatternsLoaded = createSelector(
  [selectPatternsState],
  (patternsState) => patternsState.loaded
)

// =============================================================================
// Reducer Export
// =============================================================================

export default patternsSlice.reducer
