/**
 * Card Generator
 *
 * Generates flashcards from pattern data.
 * Layer 1 cards focus on concepts: definition, problem, recognition, tradeoffs
 */

import type { Pattern } from "@/data/schema";

export type QuestionType =
  // L1 - Concept layer
  | "definition" // "What is X?"
  | "problem-identification" // "What problem does X solve?"
  | "pattern-recognition" // "Which pattern is this describing?"
  | "tradeoff-pros" // "What are the benefits of X?"
  | "tradeoff-cons" // "What are the drawbacks of X?"
  // L2 - Structure layer
  | "participants" // "Who are the participants in X?"
  | "flow-sequence" // "What is the correct sequence?"
  | "participant-role" // "What is the role of X?"
  // L3 - Code layer
  | "code-identification" // "Which pattern does this code demonstrate?"
  | "action-reason" // "Why does this code do X?"
  | "context-dilation" // "What would break if we changed X?"
  | "fill-in-blank"; // Fill in the code blanks

export type SBVPDomain =
  | "structure"
  | "behavior"
  | "visualization"
  | "philosophy";

export interface GrammarCoordinates {
  pattern: string;
  layer: number;
  domain: SBVPDomain;
  facet: string;
  questionType: string;
}

export interface Flashcard {
  id: string;
  patternId: string;
  layer: 1 | 2 | 3 | 4 | 5 | 6;
  questionType: QuestionType;
  sbvpDomain: SBVPDomain;
  front: {
    text: string;
    hint?: string;
  };
  back: {
    text: string;
    details?: string[];
    diagram?: string;
  };
  hints?: string[];
  difficulty: 1 | 2 | 3;
  grammarCoordinates: GrammarCoordinates;
}

/**
 * Generate a unique card key
 * Format: pattern-id-l<layer>-question-type
 * Example: circuit-breaker-l1-definition
 */
export function getCardKey(
  patternId: string,
  layer: number,
  questionType: string,
): string {
  return `${patternId}-l${layer}-${questionType}`;
}

/**
 * Parse a card key into its components
 */
export function parseCardKey(key: string): {
  patternId: string;
  layer: number;
  questionType: string;
} | null {
  const match = key.match(/^(.+)-l(\d)-(.+)$/);
  if (!match) return null;
  return {
    patternId: match[1],
    layer: parseInt(match[2], 10),
    questionType: match[3],
  };
}

/**
 * Generate all L1 cards for a pattern
 */
export function generateL1Cards(pattern: Pattern): Flashcard[] {
  const cards: Flashcard[] = [];

  // 1. Definition card: "What is X?"
  cards.push({
    id: getCardKey(pattern.id, 1, "definition"),
    patternId: pattern.id,
    layer: 1,
    questionType: "definition",
    sbvpDomain: "structure",
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
      domain: "structure",
      facet: "definition",
      questionType: "what-is",
    },
  });

  // 2. Problem identification: "What problem does X solve?"
  cards.push({
    id: getCardKey(pattern.id, 1, "problem-identification"),
    patternId: pattern.id,
    layer: 1,
    questionType: "problem-identification",
    sbvpDomain: "philosophy",
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
      domain: "philosophy",
      facet: "problem",
      questionType: "what-problem",
    },
  });

  // 3. Pattern recognition: Given the problem, identify the pattern
  cards.push({
    id: getCardKey(pattern.id, 1, "pattern-recognition"),
    patternId: pattern.id,
    layer: 1,
    questionType: "pattern-recognition",
    sbvpDomain: "visualization",
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
      domain: "visualization",
      facet: "recognition",
      questionType: "which-pattern",
    },
  });

  // 4a. Tradeoff - Pros
  cards.push({
    id: getCardKey(pattern.id, 1, "tradeoff-pros"),
    patternId: pattern.id,
    layer: 1,
    questionType: "tradeoff-pros",
    sbvpDomain: "philosophy",
    front: {
      text: `What are the advantages of the ${pattern.concept.name} pattern?`,
    },
    back: {
      text: pattern.concept.tradeoffs.pros.join("\n• "),
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: "philosophy",
      facet: "tradeoffs",
      questionType: "what-advantages",
    },
  });

  // 4b. Tradeoff - Cons
  cards.push({
    id: getCardKey(pattern.id, 1, "tradeoff-cons"),
    patternId: pattern.id,
    layer: 1,
    questionType: "tradeoff-cons",
    sbvpDomain: "philosophy",
    front: {
      text: `What are the drawbacks of the ${pattern.concept.name} pattern?`,
    },
    back: {
      text: pattern.concept.tradeoffs.cons.join("\n• "),
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 1,
      domain: "philosophy",
      facet: "tradeoffs",
      questionType: "what-drawbacks",
    },
  });

  return cards;
}

/**
 * Generate all L1 cards for multiple patterns
 */
export function generateAllL1Cards(patterns: Pattern[]): Flashcard[] {
  return patterns.flatMap(generateL1Cards);
}

/**
 * Generate all L2 cards for a pattern
 * L2 focuses on structure: participants, flow, roles
 */
export function generateL2Cards(pattern: Pattern): Flashcard[] {
  const cards: Flashcard[] = [];

  // 1. Participants question: "Who are the participants?"
  const participantNames = pattern.structure.participants
    .map((p) => p.name)
    .join(", ");
  cards.push({
    id: getCardKey(pattern.id, 2, "participants"),
    patternId: pattern.id,
    layer: 2,
    questionType: "participants",
    sbvpDomain: "structure",
    front: {
      text: `Who are the participants in the ${pattern.concept.name} pattern?`,
    },
    back: {
      text: participantNames,
      details: pattern.structure.participants.map(
        (p) => `${p.name}: ${p.role}`,
      ),
      diagram: pattern.structure.diagram,
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 2,
      domain: "structure",
      facet: "participants",
      questionType: "who-are",
    },
  });

  // 2. Flow sequence question
  const flowSteps = pattern.structure.flow
    .map((f) => `${f.step}. ${f.action}: ${f.description}`)
    .join("\n");

  cards.push({
    id: getCardKey(pattern.id, 2, "flow-sequence"),
    patternId: pattern.id,
    layer: 2,
    questionType: "flow-sequence",
    sbvpDomain: "behavior",
    front: {
      text: `What is the correct sequence of interactions in the ${pattern.concept.name} pattern?`,
      hint: `Think about the order: ${pattern.structure.flow[0].action} → ... → ${pattern.structure.flow[pattern.structure.flow.length - 1].action}`,
    },
    back: {
      text: flowSteps,
      diagram: pattern.structure.diagram,
    },
    difficulty: 2,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 2,
      domain: "behavior",
      facet: "flow",
      questionType: "what-sequence",
    },
  });

  // 3. Role questions - generate for first 3 participants
  const participantsToQuery = pattern.structure.participants.slice(0, 3);

  participantsToQuery.forEach((participant, index) => {
    cards.push({
      id: getCardKey(pattern.id, 2, `participant-role-${index + 1}`),
      patternId: pattern.id,
      layer: 2,
      questionType: "participant-role",
      sbvpDomain: "structure",
      front: {
        text: `What is the role of the ${participant.name} in the ${pattern.concept.name} pattern?`,
        hint: participant.name,
      },
      back: {
        text: participant.role,
        details: Array.isArray(participant.responsibilities)
          ? participant.responsibilities
          : undefined,
      },
      difficulty: 2,
      grammarCoordinates: {
        pattern: pattern.id,
        layer: 2,
        domain: "structure",
        facet: "role",
        questionType: "what-role",
      },
    });
  });

  return cards;
}

/**
 * Generate all L2 cards for multiple patterns
 */
export function generateAllL2Cards(patterns: Pattern[]): Flashcard[] {
  return patterns.flatMap(generateL2Cards);
}

/**
 * Generate all L3 cards for a pattern
 * L3 focuses on code: identification, action-reason, context dilation, fill-in-blank
 */
export function generateL3Cards(pattern: Pattern): Flashcard[] {
  const cards: Flashcard[] = [];

  // Get the first code example (we'll use this for all L3 cards)
  const codeExample = pattern.codeExamples[0];
  if (!codeExample) return cards;

  // 1. Code identification: "Which pattern does this code demonstrate?"
  const codeSnippet = codeExample.code.split("\n").slice(0, 15).join("\n");
  cards.push({
    id: getCardKey(pattern.id, 3, "code-identification"),
    patternId: pattern.id,
    layer: 3,
    questionType: "code-identification",
    sbvpDomain: "structure",
    front: {
      text: `Which pattern does this code demonstrate?\n\n\`\`\`${codeExample.language}\n${codeSnippet}\n\`\`\``,
      hint: `Category: ${pattern.hierarchy.quality}`,
    },
    back: {
      text: pattern.concept.name,
      details: [codeExample.description],
    },
    difficulty: 3,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 3,
      domain: "structure",
      facet: "code-recognition",
      questionType: "which-pattern",
    },
  });

  // 2. Action-reason cards (generate 2 from annotations)
  const annotationsToUse = codeExample.annotations.slice(0, 2);

  annotationsToUse.forEach((annotation, index) => {
    cards.push({
      id: getCardKey(pattern.id, 3, `action-reason-${index + 1}`),
      patternId: pattern.id,
      layer: 3,
      questionType: "action-reason",
      sbvpDomain: "behavior",
      front: {
        text: `In the ${pattern.concept.name} implementation:\n\nWhy ${annotation.action}?`,
        hint: annotation.id,
      },
      back: {
        text: annotation.reason,
        details: annotation.relatedConcepts,
      },
      difficulty: 3,
      grammarCoordinates: {
        pattern: pattern.id,
        layer: 3,
        domain: "behavior",
        facet: "reasoning",
        questionType: "why-action",
      },
    });
  });

  // 3. Context dilation: Use contextDilation data or create a generic one
  const contextQuestion = codeExample.contextDilation?.scope
    ? `What is the scope of this ${pattern.concept.name} implementation?`
    : `What would happen if this ${pattern.concept.name} was implemented incorrectly?`;

  const contextAnswer = codeExample.contextDilation?.scope
    ? codeExample.contextDilation.scope
    : "It could lead to incorrect behavior and violate the pattern invariants.";

  cards.push({
    id: getCardKey(pattern.id, 3, "context-dilation"),
    patternId: pattern.id,
    layer: 3,
    questionType: "context-dilation",
    sbvpDomain: "philosophy",
    front: {
      text: contextQuestion,
    },
    back: {
      text: contextAnswer,
      details: codeExample.contextDilation?.prerequisites,
    },
    difficulty: 3,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 3,
      domain: "philosophy",
      facet: "context",
      questionType: "what-breaks",
    },
  });

  // 4. Fill-in-the-blank: Extract a key line from the code
  const codeLines = codeExample.code.split("\n");
  // Find a line with interesting content (not empty, not just braces)
  const interestingLine =
    codeLines.find(
      (line) => line.trim().length > 10 && !line.trim().match(/^[{}]*$/),
    ) || codeLines[5];

  // Replace a key word/identifier with blank
  const blankLine = interestingLine.replace(/\b(\w{4,})\b/, "______");

  cards.push({
    id: getCardKey(pattern.id, 3, "fill-in-blank"),
    patternId: pattern.id,
    layer: 3,
    questionType: "fill-in-blank",
    sbvpDomain: "structure",
    front: {
      text: `Complete this ${pattern.concept.name} code:\n\n\`\`\`${codeExample.language}\n${blankLine}\n\`\`\``,
      hint: "Think about the key component",
    },
    back: {
      text: interestingLine.trim(),
      details: [
        `Full context:\n\`\`\`${codeExample.language}\n${codeSnippet}\n\`\`\``,
      ],
    },
    difficulty: 3,
    grammarCoordinates: {
      pattern: pattern.id,
      layer: 3,
      domain: "structure",
      facet: "implementation",
      questionType: "fill-blank",
    },
  });

  return cards;
}

/**
 * Generate all L3 cards for multiple patterns
 */
export function generateAllL3Cards(patterns: Pattern[]): Flashcard[] {
  return patterns.flatMap(generateL3Cards);
}

/**
 * Get a specific card by its key
 */
export function getCard(
  patterns: Pattern[],
  cardKey: string,
): Flashcard | undefined {
  const parsed = parseCardKey(cardKey);
  if (!parsed) return undefined;

  const pattern = patterns.find((p) => p.id === parsed.patternId);
  if (!pattern) return undefined;

  if (parsed.layer === 1) {
    const cards = generateL1Cards(pattern);
    return cards.find((c) => c.id === cardKey);
  }

  if (parsed.layer === 2) {
    const cards = generateL2Cards(pattern);
    return cards.find((c) => c.id === cardKey);
  }

  if (parsed.layer === 3) {
    const cards = generateL3Cards(pattern);
    return cards.find((c) => c.id === cardKey);
  }

  // TODO: Add L4-L6 card generation
  return undefined;
}

/**
 * Get all card keys for a pattern at a specific layer
 */
export function getCardKeysForPattern(
  patternId: string,
  layer: number,
): string[] {
  if (layer === 1) {
    return [
      getCardKey(patternId, 1, "definition"),
      getCardKey(patternId, 1, "problem-identification"),
      getCardKey(patternId, 1, "pattern-recognition"),
      getCardKey(patternId, 1, "tradeoff-pros"),
      getCardKey(patternId, 1, "tradeoff-cons"),
    ];
  }

  if (layer === 2) {
    return [
      getCardKey(patternId, 2, "participants"),
      getCardKey(patternId, 2, "flow-sequence"),
      getCardKey(patternId, 2, "participant-role-1"),
      getCardKey(patternId, 2, "participant-role-2"),
      getCardKey(patternId, 2, "participant-role-3"),
    ];
  }

  if (layer === 3) {
    return [
      getCardKey(patternId, 3, "code-identification"),
      getCardKey(patternId, 3, "action-reason-1"),
      getCardKey(patternId, 3, "action-reason-2"),
      getCardKey(patternId, 3, "context-dilation"),
      getCardKey(patternId, 3, "fill-in-blank"),
    ];
  }

  // TODO: Add L4-L6
  return [];
}
