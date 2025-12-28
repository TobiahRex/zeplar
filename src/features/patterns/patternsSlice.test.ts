import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import patternsReducer, {
  loadPatterns,
  generateCards,
  selectAllPatterns,
  selectPatternById,
  selectPatternsByQuality,
  selectRelatedPatterns,
  selectPatternsLoaded,
  selectAllCards,
  selectCardById,
  selectCardsByPattern,
  selectCardsGenerated,
} from './patternsSlice'
import type { RootState } from '@/app/store'

// Helper to create a test store
function createTestStore() {
  return configureStore({
    reducer: {
      patterns: patternsReducer,
      learning: () => ({}),
      exploration: () => ({}),
      ui: () => ({}),
    },
  })
}

describe('patternsSlice', () => {
  describe('loadPatterns action', () => {
    it('should load all patterns from data files', () => {
      const store = createTestStore()

      // Initially patterns should be empty
      expect(store.getState().patterns.patterns).toEqual({})
      expect(store.getState().patterns.loaded).toBe(false)

      // Dispatch loadPatterns
      store.dispatch(loadPatterns())

      // Should have loaded 6 patterns
      const state = store.getState().patterns
      expect(Object.keys(state.patterns)).toHaveLength(6)
      expect(state.loaded).toBe(true)

      // Verify specific patterns are loaded
      expect(state.patterns['circuit-breaker']).toBeDefined()
      expect(state.patterns['retry']).toBeDefined()
      expect(state.patterns['cache-aside']).toBeDefined()
      expect(state.patterns['rate-limiting']).toBeDefined()
      expect(state.patterns['bulkhead']).toBeDefined()
      expect(state.patterns['timeout']).toBeDefined()
    })

    it('should normalize patterns by ID', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const circuitBreaker = store.getState().patterns.patterns['circuit-breaker']
      expect(circuitBreaker.id).toBe('circuit-breaker')
      expect(circuitBreaker.concept.name).toBe('Circuit Breaker')
    })
  })

  describe('selectors', () => {
    it('selectAllPatterns should return array of all patterns', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const patterns = selectAllPatterns(store.getState() as RootState)
      expect(patterns).toHaveLength(6)
      expect(patterns[0]).toHaveProperty('id')
      expect(patterns[0]).toHaveProperty('concept')
    })

    it('selectPatternById should return specific pattern', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const pattern = selectPatternById(store.getState() as RootState, 'circuit-breaker')
      expect(pattern).toBeDefined()
      expect(pattern?.id).toBe('circuit-breaker')
      expect(pattern?.concept.name).toBe('Circuit Breaker')
    })

    it('selectPatternById should return undefined for non-existent pattern', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const pattern = selectPatternById(store.getState() as RootState, 'non-existent')
      expect(pattern).toBeUndefined()
    })

    it('selectPatternsByQuality should filter patterns by quality', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const reliabilityPatterns = selectPatternsByQuality(
        store.getState() as RootState,
        'reliability'
      )

      // All returned patterns should have reliability quality
      expect(reliabilityPatterns.length).toBeGreaterThan(0)
      reliabilityPatterns.forEach(pattern => {
        expect(pattern.hierarchy.quality).toBe('reliability')
      })
    })

    it('selectRelatedPatterns should return related patterns', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const relatedPatterns = selectRelatedPatterns(
        store.getState() as RootState,
        'circuit-breaker'
      )

      // Circuit breaker has related patterns: retry, bulkhead, timeout, fallback
      expect(relatedPatterns.length).toBeGreaterThan(0)

      // All returned patterns should be valid Pattern objects
      relatedPatterns.forEach(pattern => {
        expect(pattern).toHaveProperty('id')
        expect(pattern).toHaveProperty('concept')
      })
    })

    it('selectRelatedPatterns should return empty array for pattern with no related patterns', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const relatedPatterns = selectRelatedPatterns(
        store.getState() as RootState,
        'non-existent'
      )

      expect(relatedPatterns).toEqual([])
    })

    it('selectPatternsLoaded should return loaded state', () => {
      const store = createTestStore()

      // Initially not loaded
      expect(selectPatternsLoaded(store.getState() as RootState)).toBe(false)

      // After loading
      store.dispatch(loadPatterns())
      expect(selectPatternsLoaded(store.getState() as RootState)).toBe(true)
    })
  })

  describe('state normalization', () => {
    it('should store patterns as Record<string, Pattern>', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      const state = store.getState().patterns

      // Should be an object (Record), not an array
      expect(typeof state.patterns).toBe('object')
      expect(Array.isArray(state.patterns)).toBe(false)

      // Each key should match the pattern ID
      Object.entries(state.patterns).forEach(([key, pattern]) => {
        expect(key).toBe(pattern.id)
      })
    })
  })

  describe('generateCards action', () => {
    it('should generate 30 cards from 6 patterns', () => {
      const store = createTestStore()

      // Load patterns first
      store.dispatch(loadPatterns())

      // Initially cards should be empty
      expect(store.getState().patterns.cards).toEqual({})
      expect(store.getState().patterns.cardsGenerated).toBe(false)

      // Generate cards
      store.dispatch(generateCards())

      // Should have generated 30 cards (6 patterns × 5 cards each)
      const state = store.getState().patterns
      expect(Object.keys(state.cards)).toHaveLength(30)
      expect(state.cardsGenerated).toBe(true)
    })

    it('should generate cards with correct IDs', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const cards = Object.values(store.getState().patterns.cards)

      // All card IDs should follow format: pattern-id-l1-question-type
      cards.forEach(card => {
        expect(card.id).toMatch(/^.+-l1-.+$/)
      })
    })

    it('should normalize cards by ID', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const cardsRecord = store.getState().patterns.cards

      // Each key should match the card ID
      Object.entries(cardsRecord).forEach(([key, card]) => {
        expect(key).toBe(card.id)
      })
    })
  })

  describe('card selectors', () => {
    it('selectAllCards should return array of all cards', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const cards = selectAllCards(store.getState() as RootState)
      expect(cards).toHaveLength(30)
      expect(cards[0]).toHaveProperty('id')
      expect(cards[0]).toHaveProperty('patternId')
    })

    it('selectCardById should return specific card', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const card = selectCardById(store.getState() as RootState, 'circuit-breaker-l1-definition')
      expect(card).toBeDefined()
      expect(card?.id).toBe('circuit-breaker-l1-definition')
      expect(card?.patternId).toBe('circuit-breaker')
    })

    it('selectCardById should return undefined for non-existent card', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const card = selectCardById(store.getState() as RootState, 'non-existent-card')
      expect(card).toBeUndefined()
    })

    it('selectCardsByPattern should return all cards for a pattern', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const cards = selectCardsByPattern(store.getState() as RootState, 'circuit-breaker')
      expect(cards).toHaveLength(5) // 5 L1 cards per pattern

      // All cards should belong to the pattern
      cards.forEach(card => {
        expect(card.patternId).toBe('circuit-breaker')
      })
    })

    it('selectCardsByPattern should return empty array for non-existent pattern', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())
      store.dispatch(generateCards())

      const cards = selectCardsByPattern(store.getState() as RootState, 'non-existent-pattern')
      expect(cards).toEqual([])
    })

    it('selectCardsGenerated should return generation state', () => {
      const store = createTestStore()
      store.dispatch(loadPatterns())

      // Initially not generated
      expect(selectCardsGenerated(store.getState() as RootState)).toBe(false)

      // After generation
      store.dispatch(generateCards())
      expect(selectCardsGenerated(store.getState() as RootState)).toBe(true)
    })
  })
})
