/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 * 0 = Total blackout ("I have no idea")
 * 1 = Wrong, but recognized after seeing answer
 * 2 = Wrong, but answer seemed familiar
 * 3 = Correct with difficulty
 * 4 = Correct with hesitation
 * 5 = Perfect, instant recall
 */

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type CardState = "new" | "learning" | "review" | "relearning";

export interface CardProgress {
  cardKey: string;
  patternId: string; // Pattern this card belongs to
  layer: "L1" | "L2" | "L3"; // Layer of this card
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  state: CardState;
  lapses: number;
  lastReviewDate?: Date;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  state: CardState;
  lapses: number;
}

/**
 * Create initial progress for a new card
 */
export function createInitialProgress(
  cardKey: string,
  patternId: string,
  layer: "L1" | "L2" | "L3",
): CardProgress {
  return {
    cardKey,
    patternId,
    layer,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    state: "new",
    lapses: 0,
  };
}

/**
 * Calculate the next review state using SM-2 algorithm
 */
export function calculateSM2(
  current: CardProgress,
  quality: Quality,
): SM2Result {
  let { easeFactor, interval, repetitions, state, lapses } = current;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;

    // State transitions on success
    if (state === "new" || state === "learning") {
      // Need 3 correct reviews to move to 'review' state
      state = repetitions >= 3 ? "review" : "learning";
    } else if (state === "relearning") {
      // Need 2 correct reviews to return to 'review' state
      state = repetitions >= 2 ? "review" : "relearning";
    }
  } else {
    // Incorrect response - lapse
    if (state === "review") {
      lapses += 1;
      state = "relearning";
    }
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    state,
    lapses,
  };
}

/**
 * Check if a card is due for review
 */
export function isDue(progress: CardProgress): boolean {
  return new Date(progress.nextReviewDate) <= new Date();
}

/**
 * Calculate days overdue (negative if not yet due)
 */
export function daysOverdue(progress: CardProgress): number {
  const now = new Date();
  const due = new Date(progress.nextReviewDate);
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if user can unlock the next layer for a pattern
 * Requires at least 3 successful reviews with interval >= 7 days
 */
export function canUnlockNextLayer(
  progress: CardProgress | undefined,
): boolean {
  if (!progress) return false;

  return (
    progress.repetitions >= 3 &&
    progress.interval >= 7 &&
    progress.state === "review"
  );
}

/**
 * Get mastery percentage for a card (0-100)
 */
export function getMasteryPercentage(
  progress: CardProgress | undefined,
): number {
  if (!progress) return 0;

  // Based on interval and state
  if (progress.state === "new") return 0;
  if (progress.state === "learning")
    return Math.min(30, progress.repetitions * 10);
  if (progress.state === "relearning") return 40;

  // Review state - scale by interval
  // 7 days = 50%, 30 days = 75%, 90+ days = 100%
  const intervalScore = Math.min(100, 50 + (progress.interval / 90) * 50);
  return Math.round(intervalScore);
}
