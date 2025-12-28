/**
 * Card Generator
 *
 * Generates flashcards from pattern data.
 * Layer 1 cards focus on concepts: definition, problem, recognition, tradeoffs
 */

import type { Pattern } from '@/data/schema'

export type QuestionType =
  | 'definition'           // "What is X?"
  | 'problem-identification' // "What problem does X solve?"
  | 'pattern-recognition'  // "Which pattern is this describing?"
  | 'tradeoff-pros'        // "What are the benefits of X?"
  | 'tradeoff-cons'        // "What are the drawbacks of X?"

export type SBVPDomain = 'structure' | 'behavior' | 'visualization' | 'philosophy'

export interface GrammarCoordinates {
  pattern: string
  layer: number
  domain: SBVPDomain
  facet: string
  questionType: string
}

export interface Flashcard {
  id: string
  patternId: string
  layer: 1 | 2 | 3 | 4 | 5 | 6
  questionType: QuestionType
  sbvpDomain: SBVPDomain
  front: {
    text: string
    hint?: string
  }
  back: {
    text: string
    details?: string[]
    diagram?: string
  }
  hints?: string[]
  difficulty: 1 | 2 | 3
  grammarCoordinates: GrammarCoordinates
}

/**
 * Generate a unique card key
 * Format: pattern-id-l<layer>-question-type
 * Example: circuit-breaker-l1-definition
 */
export function getCardKey(patternId: string, layer: number, questionType: string): string {
  return `${patternId}-l${layer}-${questionType}`
}

/**
 * Parse a card key into its components
 */
export function parseCardKey(key: string): {
  patternId: string
  layer: number
  questionType: string
} | null {
  const match = key.match(/^(.+)-l(\d)-(.+)$/)
  if (!match) return null
  return {
    patternId: match[1],
    layer: parseInt(match[2], 10),
    questionType: match[3],
  }
}

/**
 * Generate all L1 cards for a pattern
 */
export function generateL1Cards(pattern: Pattern): Flashcard[] {
  const cards: Flashcard[] = []

  // 1. Definition card: "What is X?"
  cards.push({
    id: getCardKey(pattern.id, 1, 'definition'),
    patternId: pattern.id,
    layer: 1,
    questionType: 'definition',
    sbvpDomain: 'structure',
    front: {
      text: `What is the ${pattern.concept.name} pattern?`,
    },
    back: {
      text: pattern.concept.definition,
      diagram: pattern.visualization.staticDiagram,
    },
    hints: [pattern.concept.tagline],
    difficulty: 1,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: 'structure',
      facet: 'definition',
      questionType: 'what-is',
    },
  })

  // 2. Problem identification: "What problem does X solve?"
  cards.push({
    id: getCardKey(pattern.id, 1, 'problem-identification'),
    patternId: pattern.id,
    layer: 1,
    questionType: 'problem-identification',
    sbvpDomain: 'philosophy',
    front: {
      text: `What problem does the ${pattern.concept.name} pattern solve?`,
    },
    back: {
      text: pattern.concept.problemSolved,
    },
    hints: [pattern.philosophy.coreProblem],
    difficulty: 1,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: 'philosophy',
      facet: 'problem',
      questionType: 'what-problem',
    },
  })

  // 3. Pattern recognition: Given the problem, identify the pattern
  cards.push({
    id: getCardKey(pattern.id, 1, 'pattern-recognition'),
    patternId: pattern.id,
    layer: 1,
    questionType: 'pattern-recognition',
    sbvpDomain: 'visualization',
    front: {
      text: pattern.concept.problemSolved,
      hint: `Category: ${pattern.hierarchy.quality}`,
    },
    back: {
      text: pattern.concept.name,
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: 'visualization',
      facet: 'recognition',
      questionType: 'which-pattern',
    },
  })

  // 4a. Tradeoff - Pros
  cards.push({
    id: getCardKey(pattern.id, 1, 'tradeoff-pros'),
    patternId: pattern.id,
    layer: 1,
    questionType: 'tradeoff-pros',
    sbvpDomain: 'philosophy',
    front: {
      text: `What are the advantages of the ${pattern.concept.name} pattern?`,
    },
    back: {
      text: pattern.concept.tradeoffs.pros.join('\n• '),
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: 'philosophy',
      facet: 'tradeoffs',
      questionType: 'what-advantages',
    },
  })

  // 4b. Tradeoff - Cons
  cards.push({
    id: getCardKey(pattern.id, 1, 'tradeoff-cons'),
    patternId: pattern.id,
    layer: 1,
    questionType: 'tradeoff-cons',
    sbvpDomain: 'philosophy',
    front: {
      text: `What are the drawbacks of the ${pattern.concept.name} pattern?`,
    },
    back: {
      text: pattern.concept.tradeoffs.cons.join('\n• '),
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: 'philosophy',
      facet: 'tradeoffs',
      questionType: 'what-drawbacks',
    },
  })

  return cards
}

/**
 * Generate all L1 cards for multiple patterns
 */
export function generateAllL1Cards(patterns: Pattern[]): Flashcard[] {
  return patterns.flatMap(generateL1Cards)
}

/**
 * Get a specific card by its key
 */
export function getCard(patterns: Pattern[], cardKey: string): Flashcard | undefined {
  const parsed = parseCardKey(cardKey)
  if (!parsed) return undefined

  const pattern = patterns.find(p => p.id === parsed.patternId)
  if (!pattern) return undefined

  if (parsed.layer === 1) {
    const cards = generateL1Cards(pattern)
    return cards.find(c => c.id === cardKey)
  }

  // TODO: Add L2-L6 card generation
  return undefined
}

/**
 * Get all card keys for a pattern at a specific layer
 */
export function getCardKeysForPattern(patternId: string, layer: number): string[] {
  if (layer === 1) {
    return [
      getCardKey(patternId, 1, 'definition'),
      getCardKey(patternId, 1, 'problem-identification'),
      getCardKey(patternId, 1, 'pattern-recognition'),
      getCardKey(patternId, 1, 'tradeoff-pros'),
      getCardKey(patternId, 1, 'tradeoff-cons'),
    ]
  }
  // TODO: Add L2-L6
  return []
}
