import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import patternsReducer, {
  loadPatterns,
  selectAllPatterns,
  selectPatternById,
  selectPatternsByQuality,
  selectRelatedPatterns,
  selectPatternsLoaded,
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
})
