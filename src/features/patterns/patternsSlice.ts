import { createSlice, createSelector } from '@reduxjs/toolkit'
import { patterns } from '@/data/patterns'
import { generateAllL1Cards } from '@/lib/cardGenerator'
import type { Pattern, Implementation, SystemQuality } from '@/data/schema'
import type { Flashcard } from '@/lib/cardGenerator'
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
  cards: Record<string, Flashcard>
  loaded: boolean
  cardsGenerated: boolean
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: EntitiesState = {
  patterns: {},
  systems: {},
  implementations: {},
  cards: {},
  loaded: false,
  cardsGenerated: false,
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
    generateCards: (state) => {
      // Generate all L1 cards from loaded patterns
      const patternList = Object.values(state.patterns)
      const cardList = generateAllL1Cards(patternList)
      state.cards = Object.fromEntries(cardList.map(c => [c.id, c]))
      state.cardsGenerated = true
    },
  },
})

// =============================================================================
// Actions
// =============================================================================

export const { loadPatterns, generateCards } = patternsSlice.actions

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
// Card Selectors
// =============================================================================

// Base selector for cards
const selectCardsRecord = createSelector(
  [selectPatternsState],
  (patternsState) => patternsState.cards
)

// Select all cards as array
export const selectAllCards = createSelector(
  [selectCardsRecord],
  (cardsRecord) => Object.values(cardsRecord)
)

// Select card by ID
export const selectCardById = createSelector(
  [selectCardsRecord, (_state: RootState, cardId: string) => cardId],
  (cards, cardId) => cards[cardId]
)

// Select cards by pattern ID
export const selectCardsByPattern = createSelector(
  [selectAllCards, (_state: RootState, patternId: string) => patternId],
  (cards, patternId) => cards.filter(c => c.patternId === patternId)
)

// Select cards generated state
export const selectCardsGenerated = createSelector(
  [selectPatternsState],
  (patternsState) => patternsState.cardsGenerated
)

// =============================================================================
// Reducer Export
// =============================================================================

export default patternsSlice.reducer
