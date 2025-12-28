import { circuitBreaker } from "./circuit-breaker";
import { retry } from "./retry";
import { cacheAside } from "./cache-aside";
import { bulkhead } from "./bulkhead";
import { timeout } from "./timeout";
import { rateLimiting } from "./rate-limiting";
import type { Pattern } from "../schema";

// All patterns indexed by ID
export const patterns: Record<string, Pattern> = {
  "circuit-breaker": circuitBreaker,
  retry: retry,
  "cache-aside": cacheAside,
  bulkhead: bulkhead,
  timeout: timeout,
  "rate-limiting": rateLimiting,
};

// Array of all patterns for iteration
export const patternList: Pattern[] = Object.values(patterns);

// Get pattern by ID
export function getPattern(id: string): Pattern | undefined {
  return patterns[id];
}

// Get patterns by quality
export function getPatternsByQuality(quality: string): Pattern[] {
  return patternList.filter((p) => p.hierarchy.quality === quality);
}

// Get patterns by difficulty
export function getPatternsByDifficulty(difficulty: string): Pattern[] {
  return patternList.filter((p) => p.difficulty === difficulty);
}

// Re-export individual patterns
export { circuitBreaker, retry, cacheAside, bulkhead, timeout, rateLimiting };
