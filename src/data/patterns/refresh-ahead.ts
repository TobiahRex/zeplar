import type { Pattern } from "../schema";

export const refreshAhead: Pattern = {
  id: "refresh-ahead",
  slug: "refresh-ahead",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 💾 Caching → 🔁 Refresh-Ahead",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Caching",
    level: 4,
  },

  concept: {
    name: "Refresh-Ahead",
    emoji: "🔁",
    tagline: "Proactively refresh before expiry",
    definition:
      "Refresh-Ahead is a proactive caching strategy that automatically refreshes frequently accessed cache entries before they expire, ensuring hot data is always available without forcing users to experience cache miss latency. Like refilling a coffee pot before it runs empty rather than waiting for someone to pour the last cup and find it empty, Refresh-Ahead monitors access patterns and preemptively reloads popular cache entries before their TTL expires. The pattern tracks cache access metadata—hits, last access time, access frequency—and identifies entries that are both frequently accessed and approaching expiration. When an entry meets refresh criteria (e.g., accessed in the last 80% of its TTL and hit count exceeds threshold), a background job asynchronously fetches fresh data from the database and updates the cache entry while the old data continues serving requests. This ensures that popular cache keys never truly expire from the user's perspective—they're continuously refreshed in the background. The pattern requires sophisticated metadata tracking to avoid refreshing rarely-used entries wastefully, and careful tuning of refresh triggers to balance freshness against refresh overhead. Modern implementations often use Least Recently Used (LRU) tracking combined with access frequency statistics to identify refresh candidates intelligently.",
    problemSolved:
      "Traditional time-to-live (TTL) based caching creates a predictable performance problem: when a popular cache entry expires, the next request for that key experiences a cache miss, forcing a synchronous database query that blocks the response. For high-traffic keys (homepage content, trending articles, popular products), this creates periodic latency spikes as the entry expires and reloads. The problem compounds when the database query is expensive or slow—that first unlucky user after expiration waits seconds while everyone else previously enjoyed sub-millisecond cached responses. This periodic degradation is particularly noticeable for very popular entries where thousands of requests per second all depend on the same cached data. Additionally, TTL-based expiration can trigger cache stampedes: when a popular key expires, multiple concurrent requests all miss the cache simultaneously and issue duplicate database queries, amplifying load. Refresh-Ahead eliminates these issues by ensuring popular cache entries never expire from the user's perspective. Background refresh jobs update cache contents asynchronously before expiration, so no user request ever triggers a blocking database query for hot data. This transforms periodic latency spikes into consistently fast responses, eliminates cache stampede scenarios for popular keys, and ensures predictable performance for high-traffic content.",
    tradeoffs: {
      pros: [
        "Zero cache miss latency for frequently accessed keys",
        "Eliminates periodic latency spikes from popular key expiration",
        "Prevents cache stampedes on hot data",
        "Ensures consistent sub-millisecond response times for popular content",
        "Reduces peak database load by spreading refreshes over time",
      ],
      cons: [
        "Wasted refresh operations for keys that become unpopular",
        "Increased cache infrastructure complexity with access tracking",
        "Higher baseline database load from proactive refreshes",
        "Requires tuning refresh thresholds to avoid over-refreshing",
        "Memory overhead for tracking access metadata per cache entry",
      ],
    },
    relatedPatterns: [
      "cache-aside",
      "read-through",
      "write-through",
      "prefetching",
      "cache-warming",
      "least-recently-used",
      "predictive-caching",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Cache Consumer",
        responsibilities: [
          "Request data from cache",
          "Consume cached data without awareness of refresh",
          "Experience consistent performance",
        ],
      },
      {
        name: "Cache",
        role: "Data Store with Metadata",
        responsibilities: [
          "Store cached data with TTL",
          "Track access patterns (hit count, last access)",
          "Serve read requests with sub-millisecond latency",
        ],
      },
      {
        name: "Refresh Monitor",
        role: "Access Pattern Analyzer",
        responsibilities: [
          "Monitor cache access frequency",
          "Identify hot entries approaching expiration",
          "Trigger background refresh for qualifying entries",
        ],
      },
      {
        name: "Background Refresher",
        role: "Async Data Loader",
        responsibilities: [
          "Fetch fresh data from database asynchronously",
          "Update cache entry before TTL expires",
          "Continue serving stale data during refresh",
        ],
      },
      {
        name: "Database",
        role: "Source of Truth",
        responsibilities: [
          "Provide fresh data for refresh operations",
          "Handle refresh queries in background",
          "Maintain data consistency",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant Cache as Cache + Monitor
    participant Refresh as Background Refresher
    participant DB as Database

    Note over Cache: Entry approaching expiration<br/>and frequently accessed

    Cache->>Refresh: Trigger async refresh
    Refresh->>DB: Fetch fresh data
    DB-->>Refresh: Return data
    Refresh->>Cache: Update entry with new TTL
    Note over Cache: Old data continues serving<br/>while refresh happens

    App->>Cache: GET key
    Cache-->>App: Return data (always fast!)
    Note over App: User never experiences<br/>cache miss latency`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Request Data",
        description: "Application requests cached data via cache.get()",
      },
      {
        step: 2,
        actor: "Cache",
        action: "Serve from Cache",
        description:
          "Return cached data immediately and increment access counter",
      },
      {
        step: 3,
        actor: "Refresh Monitor",
        action: "Check Refresh Criteria",
        description:
          "Evaluate if entry qualifies for refresh (frequency + TTL proximity)",
      },
      {
        step: 4,
        actor: "Refresh Monitor",
        action: "Schedule Refresh",
        description:
          "If qualifying, trigger background refresh job asynchronously",
      },
      {
        step: 5,
        actor: "Background Refresher",
        action: "Fetch Fresh Data",
        description: "Query database for updated data in background",
      },
      {
        step: 6,
        actor: "Background Refresher",
        action: "Update Cache",
        description: "Store fresh data with new TTL, replacing old entry",
      },
      {
        step: 7,
        actor: "Cache",
        action: "Continue Serving",
        description:
          "Cache entry remains available during entire refresh process",
      },
      {
        step: 8,
        actor: "Application",
        action: "Subsequent Requests",
        description:
          "All requests continue receiving sub-millisecond responses",
      },
    ],
    invariants: [
      "Hot entries must refresh before TTL expiration",
      "Old data continues serving during refresh (no cache misses)",
      "Refresh decisions based on access frequency and TTL proximity",
      "Background refresh must not block read requests",
      "Refresh failures should not invalidate existing cache entry",
    ],
  },

  codeExamples: [
    {
      id: "refresh-ahead-ts-caffeine",
      language: "typescript",
      title: "Refresh-Ahead Cache with Access Tracking and Background Refresh",
      description:
        "Production implementation with access frequency tracking, TTL-based refresh triggers, and background refresh workers to eliminate cache miss latency for hot data",
      code: `import Redis from 'ioredis';
import { Pool } from 'pg';

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hitCount: number;
  lastAccess: number;
  refreshing: boolean;
}

// Refresh criteria configuration
interface RefreshConfig {
  ttlSeconds: number;
  refreshThresholdRatio: number; // Refresh when entry is this % through its TTL
  minHitCount: number; // Minimum hits to qualify for refresh
  refreshIntervalMs: number;
}

// Product domain model
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  lastUpdated: Date;
}

/**
 * Refresh-Ahead Cache for Product Data
 *
 * Proactively refreshes frequently accessed entries before expiration
 * to ensure hot data is always available without cache miss latency.
 *
 * Features:
 * - Access frequency tracking per cache entry
 * - Background refresh before TTL expiration
 * - Continues serving stale data during refresh
 * - Configurable refresh thresholds
 * - Metrics for monitoring refresh effectiveness
 */
export class RefreshAheadCache {
  private redis: Redis;
  private pgPool: Pool;
  private config: RefreshConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshQueue = new Set<string>();

  // Metrics
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    refreshesTriggered: 0,
    refreshesCompleted: 0,
    refreshFailures: 0,
  };

  constructor(
    redis: Redis,
    pgPool: Pool,
    config: Partial<RefreshConfig> = {}
  ) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.config = {
      ttlSeconds: config.ttlSeconds ?? 300,
      refreshThresholdRatio: config.refreshThresholdRatio ?? 0.8,
      minHitCount: config.minHitCount ?? 10,
      refreshIntervalMs: config.refreshIntervalMs ?? 1000,
    };
  }

  /**
   * Start background refresh worker
   */
  start(): void {
    this.refreshTimer = setInterval(
      () => this.processRefreshQueue(),
      this.config.refreshIntervalMs
    );
  }

  /**
   * Get product with refresh-ahead logic
   *
   * Action: Check cache, increment access counter, evaluate refresh criteria
   * Reason: Access tracking identifies hot entries; refresh triggers ensure
   *         popular data refreshes before expiration, eliminating miss latency
   * Context Level: module
   */
  async getProduct(productId: string): Promise<Product | null> {
    const cacheKey = this.cacheKey(productId);

    try {
      // Step 1: Try to get from cache
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        this.metrics.cacheHits++;

        const entry: CacheEntry<Product> = JSON.parse(cached);
        const now = Date.now();

        // Step 2: Update access metadata
        // Action: Increment hit count and update last access time
        // Reason: Tracks entry popularity; entries with high hit counts
        //         qualify for refresh-ahead treatment
        // Context Level: module
        entry.hitCount++;
        entry.lastAccess = now;

        // Step 3: Check if entry qualifies for refresh
        // Action: Calculate TTL progress and check against threshold
        // Reason: Entries approaching expiration that are frequently accessed
        //         should refresh in background before users hit expired entry
        // Context Level: system
        const ttlProgress = this.calculateTTLProgress(entry.expiresAt);

        if (this.shouldRefresh(entry, ttlProgress)) {
          // Trigger background refresh (non-blocking)
          this.scheduleRefresh(productId);
        }

        // Update metadata in cache (fire-and-forget)
        this.redis.setex(cacheKey, this.config.ttlSeconds, JSON.stringify(entry));

        return entry.data;
      }

      // Cache miss - load from database
      this.metrics.cacheMisses++;
      return await this.loadAndCache(productId);
    } catch (error) {
      console.error(\`Cache error for \${productId}:\`, error);
      // Fallback to database on cache errors
      return this.loadFromDatabase(productId);
    }
  }

  /**
   * Calculate how far through TTL an entry is (0.0 to 1.0)
   *
   * Action: Compute ratio of elapsed time to total TTL
   * Reason: Enables TTL-based refresh triggers; 0.8 means entry
   *         is 80% through its lifetime and approaching expiration
   * Context Level: local
   */
  private calculateTTLProgress(expiresAt: number): number {
    const now = Date.now();
    const created = expiresAt - this.config.ttlSeconds * 1000;
    const elapsed = now - created;
    const total = this.config.ttlSeconds * 1000;

    return Math.min(elapsed / total, 1.0);
  }

  /**
   * Determine if entry should be refreshed
   *
   * Action: Check hit count threshold and TTL progress
   * Reason: Only refresh popular entries (high hit count) that are
   *         approaching expiration; prevents wasting refresh cycles
   *         on cold or fresh data
   * Context Level: module
   */
  private shouldRefresh(entry: CacheEntry<Product>, ttlProgress: number): boolean {
    // Don't refresh if already refreshing
    if (entry.refreshing) {
      return false;
    }

    // Don't refresh if not popular enough
    if (entry.hitCount < this.config.minHitCount) {
      return false;
    }

    // Refresh if entry is past threshold % of its TTL
    return ttlProgress >= this.config.refreshThresholdRatio;
  }

  /**
   * Schedule background refresh for a product
   *
   * Action: Add product ID to refresh queue for background processing
   * Reason: Asynchronous refresh prevents blocking read requests;
   *         queue deduplicates multiple refresh requests for same key
   * Context Level: system
   */
  private scheduleRefresh(productId: string): void {
    if (this.refreshQueue.has(productId)) {
      return; // Already scheduled
    }

    this.refreshQueue.add(productId);
    this.metrics.refreshesTriggered++;
  }

  /**
   * Background worker: Process refresh queue
   *
   * Action: Iterate refresh queue and reload entries from database
   * Reason: Background execution ensures user requests never wait
   *         for database queries; fresh data available on next access
   * Context Level: system
   */
  private async processRefreshQueue(): Promise<void> {
    if (this.refreshQueue.size === 0) {
      return;
    }

    // Process up to 10 refreshes per interval to avoid overloading DB
    const batchSize = Math.min(this.refreshQueue.size, 10);
    const batch = Array.from(this.refreshQueue).slice(0, batchSize);

    for (const productId of batch) {
      this.refreshQueue.delete(productId);

      try {
        await this.refreshEntry(productId);
        this.metrics.refreshesCompleted++;
      } catch (error) {
        this.metrics.refreshFailures++;
        console.error(\`Refresh failed for \${productId}:\`, error);
      }
    }
  }

  /**
   * Refresh a single cache entry
   *
   * Action: Mark entry as refreshing, load from DB, update cache
   * Reason: Refreshing flag prevents duplicate refresh triggers;
   *         fresh data replaces stale entry with new TTL
   * Context Level: module
   */
  private async refreshEntry(productId: string): Promise<void> {
    const cacheKey = this.cacheKey(productId);

    // Mark as refreshing
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const entry: CacheEntry<Product> = JSON.parse(cached);
      entry.refreshing = true;
      await this.redis.setex(
        cacheKey,
        this.config.ttlSeconds,
        JSON.stringify(entry)
      );
    }

    // Load fresh data from database
    const product = await this.loadFromDatabase(productId);

    if (product) {
      // Update cache with fresh data and reset metadata
      const newEntry: CacheEntry<Product> = {
        data: product,
        expiresAt: Date.now() + this.config.ttlSeconds * 1000,
        hitCount: 0, // Reset hit counter
        lastAccess: Date.now(),
        refreshing: false,
      };

      await this.redis.setex(
        cacheKey,
        this.config.ttlSeconds,
        JSON.stringify(newEntry)
      );
    }
  }

  /**
   * Load product and populate cache (cache miss path)
   *
   * Action: Fetch from database and create new cache entry with metadata
   * Reason: First access creates entry with tracking metadata;
   *         subsequent accesses increment hit count for refresh eligibility
   * Context Level: module
   */
  private async loadAndCache(productId: string): Promise<Product | null> {
    const product = await this.loadFromDatabase(productId);

    if (product) {
      const entry: CacheEntry<Product> = {
        data: product,
        expiresAt: Date.now() + this.config.ttlSeconds * 1000,
        hitCount: 1,
        lastAccess: Date.now(),
        refreshing: false,
      };

      await this.redis.setex(
        this.cacheKey(productId),
        this.config.ttlSeconds,
        JSON.stringify(entry)
      );
    }

    return product;
  }

  /**
   * Load product from database
   */
  private async loadFromDatabase(productId: string): Promise<Product | null> {
    const result = await this.pgPool.query(
      'SELECT id, name, price, stock, last_updated FROM products WHERE id = $1',
      [productId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      stock: row.stock,
      lastUpdated: row.last_updated,
    };
  }

  /**
   * Invalidate cache entry (call after updates)
   */
  async invalidate(productId: string): Promise<void> {
    await this.redis.del(this.cacheKey(productId));
    this.refreshQueue.delete(productId);
  }

  /**
   * Stop background refresh worker
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private cacheKey(productId: string): string {
    return \`product:ra:\${productId}\`;
  }

  getMetrics() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.cacheHits / total : 0,
      queueSize: this.refreshQueue.size,
    };
  }
}

// Usage example
async function example() {
  const redis = new Redis({ host: 'localhost', port: 6379 });
  const pgPool = new Pool({
    host: 'localhost',
    database: 'ecommerce',
    user: 'postgres',
    password: 'password',
  });

  const cache = new RefreshAheadCache(redis, pgPool, {
    ttlSeconds: 300, // 5 minutes
    refreshThresholdRatio: 0.8, // Refresh at 80% of TTL (4 minutes)
    minHitCount: 10, // Require 10+ hits to qualify
    refreshIntervalMs: 1000, // Process refresh queue every second
  });

  cache.start();

  // First access: cache miss, loads from database
  const product1 = await cache.getProduct('prod_123');
  console.log('First access (miss):', product1);

  // Subsequent accesses: cache hit, increments hit count
  for (let i = 0; i < 15; i++) {
    await cache.getProduct('prod_123');
  }

  console.log('Hit count now 15+ - qualifies for refresh-ahead');

  // After 4 minutes (80% of 5min TTL), next access triggers background refresh
  // User still gets instant response from cache, refresh happens async

  // Monitor refresh effectiveness
  setInterval(() => {
    const stats = cache.getMetrics();
    console.log(\`Hit rate: \${(stats.hitRate * 100).toFixed(2)}%\`);
    console.log(\`Refreshes: \${stats.refreshesCompleted} completed, \${stats.refreshFailures} failed\`);
    console.log(\`Queue size: \${stats.queueSize}\`);
  }, 5000);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    cache.stop();
    process.exit(0);
  });
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete refresh-ahead cache with access frequency tracking, TTL-based refresh triggers, background refresh workers, and metrics for monitoring refresh effectiveness",
        prerequisites: [
          "Redis for cache storage with metadata",
          "PostgreSQL for source of truth",
          "Access pattern tracking and analysis",
          "Background job processing",
        ],
        systemPosition:
          "Caching layer for e-commerce product catalog with predictable sub-millisecond response times for popular products",
      },
      annotations: [
        {
          id: "ra-access-tracking",
          lines: [96, 97],
          action: "Track hit count and last access time for each cache entry",
          reason:
            "Access metadata identifies hot entries; entries with high hit counts qualify for refresh-ahead, preventing cache miss latency for popular data",
          contextLevel: "module",
          relatedConcepts: ["access-patterns", "hot-data-detection"],
        },
        {
          id: "ra-ttl-progress",
          lines: [104, 104],
          action:
            "Calculate TTL progress ratio to determine refresh eligibility",
          reason:
            "Entries at 80% of TTL are approaching expiration; refresh triggers at this point ensures fresh data loads before old entry expires",
          contextLevel: "module",
          relatedConcepts: ["ttl-management", "proactive-refresh"],
        },
        {
          id: "ra-schedule-refresh",
          lines: [106, 109],
          action: "Schedule background refresh when entry qualifies",
          reason:
            "Asynchronous refresh prevents blocking user requests; fresh data will be available on next access without database query latency",
          contextLevel: "system",
          relatedConcepts: ["async-operations", "background-jobs"],
        },
        {
          id: "ra-serve-stale",
          lines: [114, 114],
          action: "Continue serving stale data while refresh executes",
          reason:
            "Users never experience cache miss latency; old data serves requests until fresh data replaces it, ensuring consistent performance",
          contextLevel: "system",
          relatedConcepts: ["stale-while-revalidate", "zero-latency"],
        },
        {
          id: "ra-rate-limiting",
          lines: [198, 200],
          action: "Process refresh queue with rate limiting (10 per second)",
          reason:
            "Prevents refresh operations from overwhelming database; spreads database load over time while ensuring timely refresh completion",
          contextLevel: "system",
          relatedConcepts: ["rate-limiting", "database-protection"],
        },
        {
          id: "ra-reset-counter",
          lines: [246, 246],
          action: "Reset hit counter when entry refreshes",
          reason:
            "Fresh entries start with clean slate; must re-earn refresh eligibility through access patterns, preventing unnecessary refreshes",
          contextLevel: "module",
          relatedConcepts: ["eligibility-reset", "refresh-optimization"],
        },
        {
          id: "ra-refreshing-flag",
          lines: [230, 230],
          action: "Mark entries as 'refreshing' during background reload",
          reason:
            "Prevents duplicate refresh triggers for same entry; avoids wasted database queries if multiple threads detect refresh eligibility",
          contextLevel: "module",
          relatedConcepts: ["deduplication", "idempotency"],
        },
        {
          id: "ra-graceful-degradation",
          lines: [320, 323],
          action: "Fallback to database on cache errors without breaking",
          reason:
            "Cache failures should not break application; graceful degradation ensures service continues operating even when cache is unavailable",
          contextLevel: "system",
          relatedConcepts: ["fault-tolerance", "resilience"],
        },
      ],
      highlights: [
        {
          lines: [91, 97],
          label: "Cache entry with access tracking metadata",
          sbvpDomain: "structure",
        },
        {
          lines: [135, 141],
          label: "TTL progress calculation for refresh triggers",
          sbvpDomain: "behavior",
        },
        {
          lines: [193, 213],
          label: "Background refresh queue processing",
          sbvpDomain: "behavior",
        },
        {
          lines: [573, 574],
          label:
            "Zero cache miss latency for hot data through proactive refresh",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],
};
