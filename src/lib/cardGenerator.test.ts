import { describe, it, expect } from 'vitest'
import { generateL1Cards, generateAllL1Cards, getCardKey, parseCardKey } from './cardGenerator'
import { patternList } from '@/data/patterns'

describe('cardGenerator', () => {
  describe('getCardKey', () => {
    it('should generate card keys with hyphen-separated format', () => {
      const key = getCardKey('circuit-breaker', 1, 'definition')
      expect(key).toBe('circuit-breaker-l1-definition')
    })

    it('should generate unique keys for different question types', () => {
      const key1 = getCardKey('retry', 1, 'definition')
      const key2 = getCardKey('retry', 1, 'problem-identification')
      expect(key1).not.toBe(key2)
    })
  })

  describe('parseCardKey', () => {
    it('should parse valid card keys', () => {
      const parsed = parseCardKey('circuit-breaker-l1-definition')
      expect(parsed).toEqual({
        patternId: 'circuit-breaker',
        layer: 1,
        questionType: 'definition',
      })
    })

    it('should handle hyphenated pattern IDs', () => {
      const parsed = parseCardKey('cache-aside-l1-problem-identification')
      expect(parsed).toEqual({
        patternId: 'cache-aside',
        layer: 1,
        questionType: 'problem-identification',
      })
    })

    it('should return null for invalid keys', () => {
      const parsed = parseCardKey('invalid-key')
      expect(parsed).toBeNull()
    })
  })

  describe('generateL1Cards', () => {
    it('should generate exactly 5 cards per pattern', () => {
      const pattern = patternList[0]
      const cards = generateL1Cards(pattern)
      expect(cards).toHaveLength(5)
    })

    it('should generate all 5 question types', () => {
      const pattern = patternList[0]
      const cards = generateL1Cards(pattern)

      const questionTypes = cards.map(c => c.questionType)
      expect(questionTypes).toContain('definition')
      expect(questionTypes).toContain('problem-identification')
      expect(questionTypes).toContain('pattern-recognition')
      expect(questionTypes).toContain('tradeoff-pros')
      expect(questionTypes).toContain('tradeoff-cons')
    })

    it('should include grammarCoordinates on all cards', () => {
      const pattern = patternList[0]
      const cards = generateL1Cards(pattern)

      cards.forEach(card => {
        expect(card.grammarCoordinates).toBeDefined()
        expect(card.grammarCoordinates.pattern).toBe(pattern.id)
        expect(card.grammarCoordinates.layer).toBe(1)
        expect(card.grammarCoordinates.domain).toBeTruthy()
        expect(card.grammarCoordinates.facet).toBeTruthy()
        expect(card.grammarCoordinates.questionType).toBeTruthy()
      })
    })

    it('should use correct ID format for all cards', () => {
      const pattern = patternList[0]
      const cards = generateL1Cards(pattern)

      cards.forEach(card => {
        // Should follow pattern: pattern-id-l1-question-type
        expect(card.id).toMatch(new RegExp(`^${pattern.id}-l1-.+$`))
      })
    })

    it('should set correct difficulty levels', () => {
      const pattern = patternList[0]
      const cards = generateL1Cards(pattern)

      // Definition and problem-identification should have difficulty 1
      const definitionCard = cards.find(c => c.questionType === 'definition')
      const problemCard = cards.find(c => c.questionType === 'problem-identification')
      expect(definitionCard?.difficulty).toBe(1)
      expect(problemCard?.difficulty).toBe(1)

      // Pattern recognition and tradeoffs should have difficulty 2
      const recognitionCard = cards.find(c => c.questionType === 'pattern-recognition')
      const prosCard = cards.find(c => c.questionType === 'tradeoff-pros')
      const consCard = cards.find(c => c.questionType === 'tradeoff-cons')
      expect(recognitionCard?.difficulty).toBe(2)
      expect(prosCard?.difficulty).toBe(2)
      expect(consCard?.difficulty).toBe(2)
    })

    describe('L1DefinitionGenerator', () => {
      it('should generate definition card with correct structure', () => {
        const pattern = patternList[0]
        const cards = generateL1Cards(pattern)
        const defCard = cards.find(c => c.questionType === 'definition')

        expect(defCard).toBeDefined()
        expect(defCard?.sbvpDomain).toBe('structure')
        expect(defCard?.front.text).toContain(pattern.concept.name)
        expect(defCard?.back.text).toBe(pattern.concept.definition)
        expect(defCard?.hints).toContain(pattern.concept.tagline)
        expect(defCard?.grammarCoordinates.facet).toBe('definition')
      })
    })

    describe('L1ProblemIdentificationGenerator', () => {
      it('should generate problem identification card with correct structure', () => {
        const pattern = patternList[0]
        const cards = generateL1Cards(pattern)
        const problemCard = cards.find(c => c.questionType === 'problem-identification')

        expect(problemCard).toBeDefined()
        expect(problemCard?.sbvpDomain).toBe('philosophy')
        expect(problemCard?.front.text).toContain('problem')
        expect(problemCard?.back.text).toBe(pattern.concept.problemSolved)
        expect(problemCard?.hints).toContain(pattern.philosophy.coreProblem)
        expect(problemCard?.grammarCoordinates.facet).toBe('problem')
      })
    })

    describe('L1PatternRecognitionGenerator', () => {
      it('should generate pattern recognition card with correct structure', () => {
        const pattern = patternList[0]
        const cards = generateL1Cards(pattern)
        const recognitionCard = cards.find(c => c.questionType === 'pattern-recognition')

        expect(recognitionCard).toBeDefined()
        expect(recognitionCard?.sbvpDomain).toBe('visualization')
        expect(recognitionCard?.front.text).toBe(pattern.concept.problemSolved)
        expect(recognitionCard?.back.text).toBe(pattern.concept.name)
        expect(recognitionCard?.grammarCoordinates.facet).toBe('recognition')
      })
    })

    describe('L1TradeoffAnalysisGenerator', () => {
      it('should generate tradeoff pros card with correct structure', () => {
        const pattern = patternList[0]
        const cards = generateL1Cards(pattern)
        const prosCard = cards.find(c => c.questionType === 'tradeoff-pros')

        expect(prosCard).toBeDefined()
        expect(prosCard?.sbvpDomain).toBe('philosophy')
        expect(prosCard?.front.text).toContain('advantages')
        expect(prosCard?.back.text).toContain(pattern.concept.tradeoffs.pros[0])
        expect(prosCard?.grammarCoordinates.facet).toBe('tradeoffs')
      })

      it('should generate tradeoff cons card with correct structure', () => {
        const pattern = patternList[0]
        const cards = generateL1Cards(pattern)
        const consCard = cards.find(c => c.questionType === 'tradeoff-cons')

        expect(consCard).toBeDefined()
        expect(consCard?.sbvpDomain).toBe('philosophy')
        expect(consCard?.front.text).toContain('drawbacks')
        expect(consCard?.back.text).toContain(pattern.concept.tradeoffs.cons[0])
        expect(consCard?.grammarCoordinates.facet).toBe('tradeoffs')
      })
    })
  })

  describe('generateAllL1Cards', () => {
    it('should generate 30 cards for 6 patterns', () => {
      const cards = generateAllL1Cards(patternList)
      expect(cards).toHaveLength(30) // 6 patterns × 5 cards each
    })

    it('should generate cards for all patterns', () => {
      const cards = generateAllL1Cards(patternList)
      const patternIds = new Set(cards.map(c => c.patternId))

      // All 6 patterns should have cards
      expect(patternIds.size).toBe(6)
      expect(patternIds).toContain('circuit-breaker')
      expect(patternIds).toContain('retry')
      expect(patternIds).toContain('cache-aside')
      expect(patternIds).toContain('rate-limiting')
      expect(patternIds).toContain('bulkhead')
      expect(patternIds).toContain('timeout')
    })

    it('should have unique card IDs', () => {
      const cards = generateAllL1Cards(patternList)
      const ids = cards.map(c => c.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should assign correct SBVP domains', () => {
      const cards = generateAllL1Cards(patternList)

      // Count cards by domain
      const domainCounts = cards.reduce((acc, card) => {
        acc[card.sbvpDomain] = (acc[card.sbvpDomain] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Should have definition cards (structure)
      expect(domainCounts.structure).toBe(6) // 1 per pattern

      // Should have problem and tradeoff cards (philosophy)
      expect(domainCounts.philosophy).toBe(18) // 3 per pattern (problem, pros, cons)

      // Should have recognition cards (visualization)
      expect(domainCounts.visualization).toBe(6) // 1 per pattern
    })

    it('should include all required fields on all cards', () => {
      const cards = generateAllL1Cards(patternList)

      cards.forEach(card => {
        // Required fields
        expect(card.id).toBeTruthy()
        expect(card.patternId).toBeTruthy()
        expect(card.layer).toBe(1)
        expect(card.questionType).toBeTruthy()
        expect(card.sbvpDomain).toBeTruthy()
        expect(card.front).toBeDefined()
        expect(card.front.text).toBeTruthy()
        expect(card.back).toBeDefined()
        expect(card.back.text).toBeTruthy()
        expect(card.difficulty).toBeGreaterThan(0)
        expect(card.grammarCoordinates).toBeDefined()
      })
    })
  })

  describe('card ID format validation', () => {
    it('should follow spec format: pattern-id-l<layer>-question-type', () => {
      const pattern = patternList[0]
      const cards = generateL1Cards(pattern)

      cards.forEach(card => {
        const parsed = parseCardKey(card.id)
        expect(parsed).not.toBeNull()
        expect(parsed?.patternId).toBe(pattern.id)
        expect(parsed?.layer).toBe(1)
        expect(parsed?.questionType).toBeTruthy()
      })
    })

    it('should generate deterministic IDs', () => {
      const pattern = patternList[0]
      const cards1 = generateL1Cards(pattern)
      const cards2 = generateL1Cards(pattern)

      cards1.forEach((card, index) => {
        expect(card.id).toBe(cards2[index].id)
      })
    })
  })
})
