/**
 * Layer Unlock Logic
 *
 * Manages layer unlock progression based on mastery thresholds.
 * L1 is always unlocked. L2 unlocks at 80% L1 mastery. L3 unlocks at 80% L2 mastery.
 */

import type { CardProgress } from "@/lib/sm2";

// =============================================================================
// Constants
// =============================================================================

export const UNLOCK_THRESHOLDS = {
  L2: 80, // Require 80% L1 mastery to unlock L2
  L3: 80, // Require 80% L2 mastery to unlock L3
} as const;

/**
 * Ease factor threshold for considering a card "mastered"
 * Default SM-2 starts at 2.5, so cards with easeFactor >= 2.5 indicate competence
 */
const MASTERY_EASE_THRESHOLD = 2.5;

// =============================================================================
// Types
// =============================================================================

export interface LayerUnlockStatus {
  l1Unlocked: boolean; // Always true
  l2Unlocked: boolean;
  l3Unlocked: boolean;
  l1Mastery: number; // 0-100
  l2Mastery: number; // 0-100
  l3Mastery: number; // 0-100
}

// =============================================================================
// Mastery Calculation
// =============================================================================

/**
 * Calculate mastery percentage for a specific layer of a pattern
 *
 * Mastery is defined as the percentage of cards with easeFactor >= 2.5
 *
 * @param patternId - Pattern identifier
 * @param layer - Layer number ('L1', 'L2', or 'L3')
 * @param cardProgress - Record of all card progress
 * @returns Mastery percentage (0-100)
 */
export function calculateLayerMastery(
  patternId: string,
  layer: "L1" | "L2" | "L3",
  cardProgress: Record<string, CardProgress>,
): number {
  const layerCards = Object.values(cardProgress).filter(
    (cp) => cp.patternId === patternId && cp.layer === layer,
  );

  if (layerCards.length === 0) return 0;

  // Count cards with easeFactor >= 2.5 as "mastered"
  const masteredCards = layerCards.filter(
    (cp) => cp.easeFactor >= MASTERY_EASE_THRESHOLD,
  );

  return Math.round((masteredCards.length / layerCards.length) * 100);
}

// =============================================================================
// Unlock Checks
// =============================================================================

/**
 * Check if a specific layer should be unlocked for a pattern
 *
 * @param patternId - Pattern identifier
 * @param targetLayer - Layer to check ('L2' or 'L3')
 * @param layerUnlocks - Current unlock status for all patterns
 * @returns True if layer should be unlocked
 */
export function checkLayerUnlock(
  patternId: string,
  targetLayer: "L2" | "L3",
  layerUnlocks: Record<string, LayerUnlockStatus>,
): boolean {
  const status = layerUnlocks[patternId];
  if (!status) return false;

  if (targetLayer === "L2") {
    return status.l1Mastery >= UNLOCK_THRESHOLDS.L2;
  }

  if (targetLayer === "L3") {
    return status.l2Mastery >= UNLOCK_THRESHOLDS.L3 && status.l2Unlocked;
  }

  return false;
}

/**
 * Check if a specific card is unlocked based on its layer
 *
 * @param card - Card progress object
 * @param layerUnlocks - Current unlock status for all patterns
 * @returns True if card is unlocked
 */
export function checkCardUnlocked(
  card: CardProgress,
  layerUnlocks: Record<string, LayerUnlockStatus>,
): boolean {
  const status = layerUnlocks[card.patternId];
  if (!status) return false;

  if (card.layer === "L1") return true;
  if (card.layer === "L2") return status.l2Unlocked;
  if (card.layer === "L3") return status.l3Unlocked;

  return false;
}

// =============================================================================
// Unlock Status Management
// =============================================================================

/**
 * Initialize unlock status for a pattern
 * L1 is always unlocked, L2 and L3 start locked
 *
 * @returns Initial unlock status
 */
export function initializeLayerUnlockStatus(): LayerUnlockStatus {
  return {
    l1Unlocked: true,
    l2Unlocked: false,
    l3Unlocked: false,
    l1Mastery: 0,
    l2Mastery: 0,
    l3Mastery: 0,
  };
}

/**
 * Update unlock status for a pattern based on current card progress
 *
 * @param patternId - Pattern identifier
 * @param cardProgress - Record of all card progress
 * @param currentStatus - Current unlock status (optional, will initialize if not provided)
 * @returns Updated unlock status
 */
export function updateLayerUnlockStatus(
  patternId: string,
  cardProgress: Record<string, CardProgress>,
  currentStatus?: LayerUnlockStatus,
): LayerUnlockStatus {
  const status = currentStatus || initializeLayerUnlockStatus();

  // Calculate current mastery for each layer
  status.l1Mastery = calculateLayerMastery(patternId, "L1", cardProgress);
  status.l2Mastery = calculateLayerMastery(patternId, "L2", cardProgress);
  status.l3Mastery = calculateLayerMastery(patternId, "L3", cardProgress);

  // Update unlock status
  status.l2Unlocked = status.l1Mastery >= UNLOCK_THRESHOLDS.L2;
  status.l3Unlocked =
    status.l2Mastery >= UNLOCK_THRESHOLDS.L3 && status.l2Unlocked;

  return status;
}

/**
 * Update unlock status for all patterns
 *
 * @param patternIds - Array of pattern identifiers
 * @param cardProgress - Record of all card progress
 * @param currentUnlocks - Current unlock status for all patterns (optional)
 * @returns Updated unlock status for all patterns
 */
export function updateAllLayerUnlocks(
  patternIds: string[],
  cardProgress: Record<string, CardProgress>,
  currentUnlocks?: Record<string, LayerUnlockStatus>,
): Record<string, LayerUnlockStatus> {
  const unlocks: Record<string, LayerUnlockStatus> = {};

  patternIds.forEach((patternId) => {
    unlocks[patternId] = updateLayerUnlockStatus(
      patternId,
      cardProgress,
      currentUnlocks?.[patternId],
    );
  });

  return unlocks;
}
