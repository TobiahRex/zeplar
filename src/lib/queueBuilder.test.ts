import { describe, it, expect } from "vitest";
import {
  buildStudyQueue,
  getDueReviewCount,
  getNewCardCount,
  getRecommendedSessionSize,
  DEFAULT_CONFIG,
} from "./queueBuilder";
import type { Flashcard } from "./cardGenerator";
import type { CardProgress } from "./sm2";
import type { LayerUnlockStatus } from "./layerUnlock";

// Helper to create mock flashcards
function createMockCard(
  id: string,
  patternId = "test-pattern",
  layer: 1 | 2 | 3 = 1,
): Flashcard {
  return {
    id,
    patternId,
    layer,
    questionType: "definition",
    sbvpDomain: "structure",
    front: { text: "Question" },
    back: { text: "Answer" },
    difficulty: 1,
    grammarCoordinates: {
      pattern: patternId,
      layer,
      domain: "structure",
      facet: "definition",
      questionType: "what-is",
    },
  };
}

// Helper to create mock card progress
function createMockProgress(
  cardKey: string,
  daysFromNow: number,
  patternId = "test-pattern",
  layer: "L1" | "L2" | "L3" = "L1",
): CardProgress {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysFromNow);

  return {
    cardKey,
    patternId,
    layer,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReviewDate,
    state: "learning",
    lapses: 0,
  };
}

// Helper to create mock layer unlocks (all layers unlocked)
function createMockLayerUnlocks(
  ...patternIds: string[]
): Record<string, LayerUnlockStatus> {
  const unlocks: Record<string, LayerUnlockStatus> = {};
  patternIds.forEach((patternId) => {
    unlocks[patternId] = {
      l1Unlocked: true,
      l2Unlocked: true,
      l3Unlocked: true,
      l1Mastery: 100,
      l2Mastery: 100,
      l3Mastery: 100,
    };
  });
  return unlocks;
}

describe("queueBuilder", () => {
  describe("buildStudyQueue", () => {
    it("should prioritize due reviews over new cards", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
        createMockCard("card-4"),
      ];

      const progress: Record<string, CardProgress> = {
        "card-1": createMockProgress("card-1", -5), // Overdue by 5 days
        "card-2": createMockProgress("card-2", -2), // Overdue by 2 days
      };

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(
        cards,
        progress,
        layerUnlocks,
        DEFAULT_CONFIG,
      );

      // Should start with the due reviews (card-1 and card-2)
      expect(queue.slice(0, 2)).toContain("card-1");
      expect(queue.slice(0, 2)).toContain("card-2");

      // Then new cards (card-3 and card-4)
      expect(queue.slice(2)).toContain("card-3");
      expect(queue.slice(2)).toContain("card-4");
    });

    it("should sort reviews by days overdue when prioritizeOverdue is true", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const progress: Record<string, CardProgress> = {
        "card-1": createMockProgress("card-1", -2), // Overdue by 2 days
        "card-2": createMockProgress("card-2", -10), // Overdue by 10 days
        "card-3": createMockProgress("card-3", -5), // Overdue by 5 days
      };

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(cards, progress, layerUnlocks, {
        ...DEFAULT_CONFIG,
        prioritizeOverdue: true,
      });

      // Most overdue should come first
      expect(queue[0]).toBe("card-2"); // 10 days overdue
      expect(queue[1]).toBe("card-3"); // 5 days overdue
      expect(queue[2]).toBe("card-1"); // 2 days overdue
    });

    it("should respect review cards per session limit", () => {
      const cards = Array.from({ length: 30 }, (_, i) =>
        createMockCard(`card-${i}`),
      );

      // Make 25 cards overdue
      const progress: Record<string, CardProgress> = {};
      for (let i = 0; i < 25; i++) {
        progress[`card-${i}`] = createMockProgress(`card-${i}`, -i - 1);
      }

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(cards, progress, layerUnlocks, {
        ...DEFAULT_CONFIG,
        reviewCardsPerSession: 10,
      });

      // Count review cards in queue (cards with progress)
      const reviewCount = queue.filter((id) => progress[id]).length;

      expect(reviewCount).toBe(10); // Should respect the limit
    });

    it("should respect new cards per session limit", () => {
      const cards = Array.from({ length: 30 }, (_, i) =>
        createMockCard(`card-${i}`),
      );
      const progress: Record<string, CardProgress> = {};

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(cards, progress, layerUnlocks, {
        ...DEFAULT_CONFIG,
        newCardsPerSession: 5,
      });

      expect(queue.length).toBe(5); // Only 5 new cards
    });

    it("should filter out non-due reviews", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const progress: Record<string, CardProgress> = {
        "card-1": createMockProgress("card-1", -2), // Overdue (due)
        "card-2": createMockProgress("card-2", 5), // Not due yet (5 days in future)
      };

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(
        cards,
        progress,
        layerUnlocks,
        DEFAULT_CONFIG,
      );

      // Should include overdue card-1
      expect(queue).toContain("card-1");

      // Should NOT include not-yet-due card-2
      expect(queue).not.toContain("card-2");

      // Should include new card-3
      expect(queue).toContain("card-3");
    });

    it("should handle empty card list", () => {
      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue([], {}, layerUnlocks, DEFAULT_CONFIG);
      expect(queue).toEqual([]);
    });

    it("should handle empty progress (all new cards)", () => {
      const cards = [createMockCard("card-1"), createMockCard("card-2")];

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(cards, {}, layerUnlocks, DEFAULT_CONFIG);

      expect(queue).toHaveLength(2);
      expect(queue).toContain("card-1");
      expect(queue).toContain("card-2");
    });

    it("should handle cards marked as new in progress", () => {
      const cards = [createMockCard("card-1"), createMockCard("card-2")];

      const progress: Record<string, CardProgress> = {
        "card-1": {
          cardKey: "card-1",
          patternId: "test-pattern",
          layer: "L1",
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: new Date(),
          state: "new",
          lapses: 0,
        },
      };

      const layerUnlocks = createMockLayerUnlocks("test-pattern");
      const queue = buildStudyQueue(
        cards,
        progress,
        layerUnlocks,
        DEFAULT_CONFIG,
      );

      // Card-1 should be treated as new even though it has progress
      expect(queue).toContain("card-1");
      expect(queue).toContain("card-2");
    });
  });

  describe("getDueReviewCount", () => {
    it("should count only due cards", () => {
      const progress: Record<string, CardProgress> = {
        "card-1": createMockProgress("card-1", -5), // Overdue
        "card-2": createMockProgress("card-2", -2), // Overdue
        "card-3": createMockProgress("card-3", 5), // Not due
      };

      const count = getDueReviewCount(progress);
      expect(count).toBe(2);
    });

    it("should return 0 for empty progress", () => {
      const count = getDueReviewCount({});
      expect(count).toBe(0);
    });
  });

  describe("getNewCardCount", () => {
    it("should count cards without progress", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const progress: Record<string, CardProgress> = {
        "card-1": createMockProgress("card-1", -1),
      };

      const count = getNewCardCount(cards, progress);
      expect(count).toBe(2); // card-2 and card-3 are new
    });

    it('should count cards with state "new" as new', () => {
      const cards = [createMockCard("card-1"), createMockCard("card-2")];

      const progress: Record<string, CardProgress> = {
        "card-1": {
          cardKey: "card-1",
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: new Date(),
          state: "new",
          lapses: 0,
        },
      };

      const count = getNewCardCount(cards, progress);
      expect(count).toBe(2); // Both are new
    });
  });

  describe("getRecommendedSessionSize", () => {
    it("should prioritize reviews over new cards", () => {
      const cards = Array.from({ length: 50 }, (_, i) =>
        createMockCard(`card-${i}`),
      );

      // Create 25 due reviews
      const progress: Record<string, CardProgress> = {};
      for (let i = 0; i < 25; i++) {
        progress[`card-${i}`] = createMockProgress(`card-${i}`, -i - 1);
      }

      const recommendation = getRecommendedSessionSize(cards, progress);

      // Should prioritize 20 reviews (config default)
      expect(recommendation.reviews).toBe(20);

      // Should fill remaining 10 slots with new cards
      expect(recommendation.newCards).toBe(10);

      expect(recommendation.total).toBe(30);
    });

    it("should fill with new cards when few reviews available", () => {
      const cards = Array.from({ length: 50 }, (_, i) =>
        createMockCard(`card-${i}`),
      );

      // Only 5 due reviews
      const progress: Record<string, CardProgress> = {};
      for (let i = 0; i < 5; i++) {
        progress[`card-${i}`] = createMockProgress(`card-${i}`, -1);
      }

      const recommendation = getRecommendedSessionSize(cards, progress);

      expect(recommendation.reviews).toBe(5);
      expect(recommendation.newCards).toBe(25); // Fill remaining slots
      expect(recommendation.total).toBe(30);
    });

    it("should handle no due reviews", () => {
      const cards = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card-${i}`),
      );
      const progress: Record<string, CardProgress> = {};

      const recommendation = getRecommendedSessionSize(cards, progress);

      expect(recommendation.reviews).toBe(0);
      expect(recommendation.newCards).toBe(10); // Default new cards limit
      expect(recommendation.total).toBe(10);
    });
  });
});
