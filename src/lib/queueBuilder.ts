/**
 * Queue Builder
 *
 * Builds optimal study queues based on spaced repetition principles.
 * Prioritizes due reviews before introducing new cards.
 * Filters cards by layer unlock status.
 */

import type { Flashcard } from "./cardGenerator";
import type { CardProgress } from "./sm2";
import { isDue, daysOverdue } from "./sm2";
import type { LayerUnlockStatus } from "./layerUnlock";
import { checkCardUnlocked } from "./layerUnlock";

export interface QueueBuilderConfig {
  newCardsPerSession: number; // Default: 10
  reviewCardsPerSession: number; // Default: 20
  prioritizeOverdue: boolean; // Default: true
}

export const DEFAULT_CONFIG: QueueBuilderConfig = {
  newCardsPerSession: 10,
  reviewCardsPerSession: 20,
  prioritizeOverdue: true,
};

/**
 * Build a study queue from available cards and progress
 *
 * Algorithm:
 * 1. Filter cards by layer unlock status
 * 2. Separate cards into new vs. review (cards with progress)
 * 3. Filter reviews by isDue()
 * 4. Sort reviews by days overdue (most overdue first) if prioritizeOverdue is true
 * 5. Build queue: reviews first (up to limit), then new cards (up to limit)
 * 6. Return array of card IDs
 */
export function buildStudyQueue(
  allCards: Flashcard[],
  progress: Record<string, CardProgress>,
  layerUnlocks: Record<string, LayerUnlockStatus>,
  config: QueueBuilderConfig = DEFAULT_CONFIG,
): string[] {
  const queue: string[] = [];

  // Filter out locked cards
  const unlockedCards = allCards.filter((card) => {
    // For cards without progress yet, check if their layer is unlocked
    const cardProgress = progress[card.id];
    if (!cardProgress) {
      // Create a minimal CardProgress object just for unlock checking
      const tempProgress: CardProgress = {
        cardKey: card.id,
        patternId: card.patternId,
        layer: `L${card.layer}` as "L1" | "L2" | "L3",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(),
        state: "new",
        lapses: 0,
      };
      return checkCardUnlocked(tempProgress, layerUnlocks);
    }

    // For cards with progress, use the actual progress
    return checkCardUnlocked(cardProgress, layerUnlocks);
  });

  // Separate cards into new and review
  const newCards: Flashcard[] = [];
  const reviewCards: Flashcard[] = [];

  unlockedCards.forEach((card) => {
    const cardProgress = progress[card.id];
    if (!cardProgress || cardProgress.state === "new") {
      newCards.push(card);
    } else {
      reviewCards.push(card);
    }
  });

  // Filter reviews to only those that are due
  const dueReviews = reviewCards.filter((card) => {
    const cardProgress = progress[card.id];
    return cardProgress && isDue(cardProgress);
  });

  // Sort due reviews by days overdue (most overdue first)
  if (config.prioritizeOverdue) {
    dueReviews.sort((a, b) => {
      const progressA = progress[a.id];
      const progressB = progress[b.id];
      return daysOverdue(progressB) - daysOverdue(progressA);
    });
  }

  // Add due reviews to queue (up to limit)
  const reviewsToAdd = dueReviews.slice(0, config.reviewCardsPerSession);
  queue.push(...reviewsToAdd.map((card) => card.id));

  // Add new cards to queue (up to limit)
  const newCardsToAdd = newCards.slice(0, config.newCardsPerSession);
  queue.push(...newCardsToAdd.map((card) => card.id));

  return queue;
}

/**
 * Get count of due reviews from progress
 */
export function getDueReviewCount(
  progress: Record<string, CardProgress>,
): number {
  return Object.values(progress).filter(isDue).length;
}

/**
 * Get count of new cards (cards without progress)
 */
export function getNewCardCount(
  allCards: Flashcard[],
  progress: Record<string, CardProgress>,
): number {
  return allCards.filter(
    (card) => !progress[card.id] || progress[card.id].state === "new",
  ).length;
}

/**
 * Calculate optimal session size based on available cards
 */
export function getRecommendedSessionSize(
  allCards: Flashcard[],
  progress: Record<string, CardProgress>,
): { reviews: number; newCards: number; total: number } {
  const dueCount = getDueReviewCount(progress);
  const newCount = getNewCardCount(allCards, progress);

  // Prioritize reviews
  const reviews = Math.min(dueCount, DEFAULT_CONFIG.reviewCardsPerSession);

  // If we have some reviews, we can borrow unused review slots for new cards
  // If we have NO reviews, cap at newCardsPerSession
  let newCards: number;
  if (reviews > 0) {
    // Can borrow from unused review slots
    const totalSessionSize =
      DEFAULT_CONFIG.reviewCardsPerSession + DEFAULT_CONFIG.newCardsPerSession;
    const remainingSlots = totalSessionSize - reviews;
    newCards = Math.min(newCount, remainingSlots);
  } else {
    // No reviews - cap at newCardsPerSession
    newCards = Math.min(newCount, DEFAULT_CONFIG.newCardsPerSession);
  }

  return {
    reviews,
    newCards,
    total: reviews + newCards,
  };
}
