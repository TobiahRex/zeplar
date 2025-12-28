import Dexie, { type EntityTable } from "dexie";
import type { CardProgress } from "./sm2";

// Stored card progress (dates as ISO strings for IndexedDB)
interface StoredCardProgress {
  cardKey: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  state: "new" | "learning" | "review" | "relearning";
  lapses: number;
  lastReviewDate?: string;
}

interface StoredStats {
  id: "stats"; // singleton
  totalReviews: number;
  streak: number;
  lastStudyDate?: string;
}

interface StudySessionRecord {
  id?: number;
  startedAt: string;
  endedAt: string;
  cardsReviewed: number;
  correctCount: number;
}

class ZeplarDB extends Dexie {
  cardProgress!: EntityTable<StoredCardProgress, "cardKey">;
  stats!: EntityTable<StoredStats, "id">;
  sessions!: EntityTable<StudySessionRecord, "id">;

  constructor() {
    super("zeplar");

    this.version(1).stores({
      cardProgress: "cardKey, nextReviewDate, state",
      stats: "id",
      sessions: "++id, startedAt",
    });
  }
}

export const db = new ZeplarDB();

// =============================================================================
// Card Progress Operations
// =============================================================================

export async function saveCardProgress(progress: CardProgress): Promise<void> {
  await db.cardProgress.put({
    cardKey: progress.cardKey,
    easeFactor: progress.easeFactor,
    interval: progress.interval,
    repetitions: progress.repetitions,
    nextReviewDate:
      progress.nextReviewDate instanceof Date
        ? progress.nextReviewDate.toISOString()
        : progress.nextReviewDate,
    state: progress.state,
    lapses: progress.lapses,
    lastReviewDate:
      progress.lastReviewDate instanceof Date
        ? progress.lastReviewDate.toISOString()
        : progress.lastReviewDate,
  });
}

export async function saveAllCardProgress(
  progressMap: Record<string, CardProgress>,
): Promise<void> {
  const items = Object.values(progressMap).map((p) => ({
    cardKey: p.cardKey,
    easeFactor: p.easeFactor,
    interval: p.interval,
    repetitions: p.repetitions,
    nextReviewDate:
      p.nextReviewDate instanceof Date
        ? p.nextReviewDate.toISOString()
        : String(p.nextReviewDate),
    state: p.state,
    lapses: p.lapses,
    lastReviewDate:
      p.lastReviewDate instanceof Date
        ? p.lastReviewDate.toISOString()
        : p.lastReviewDate,
  }));
  await db.cardProgress.bulkPut(items);
}

export async function loadAllCardProgress(): Promise<
  Record<string, CardProgress>
> {
  const items = await db.cardProgress.toArray();
  const result: Record<string, CardProgress> = {};

  for (const item of items) {
    result[item.cardKey] = {
      cardKey: item.cardKey,
      easeFactor: item.easeFactor,
      interval: item.interval,
      repetitions: item.repetitions,
      nextReviewDate: new Date(item.nextReviewDate),
      state: item.state,
      lapses: item.lapses,
      lastReviewDate: item.lastReviewDate
        ? new Date(item.lastReviewDate)
        : undefined,
    };
  }

  return result;
}

// =============================================================================
// Stats Operations
// =============================================================================

export async function saveStats(stats: {
  totalReviews: number;
  streak: number;
  lastStudyDate?: string;
}): Promise<void> {
  await db.stats.put({
    id: "stats",
    ...stats,
  });
}

export async function loadStats(): Promise<{
  totalReviews: number;
  streak: number;
  lastStudyDate?: string;
} | null> {
  const stored = await db.stats.get("stats");
  if (!stored) return null;
  return {
    totalReviews: stored.totalReviews,
    streak: stored.streak,
    lastStudyDate: stored.lastStudyDate,
  };
}

// =============================================================================
// Session Recording
// =============================================================================

export async function recordSession(session: {
  startedAt: string;
  endedAt: string;
  cardsReviewed: number;
  correctCount: number;
}): Promise<void> {
  await db.sessions.add(session);
}

export async function getRecentSessions(
  limit = 10,
): Promise<StudySessionRecord[]> {
  return db.sessions.orderBy("startedAt").reverse().limit(limit).toArray();
}
