import type { Pattern } from "../schema";

export const writeBack: Pattern = {
  id: "write-back",
  slug: "write-back",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 💾 Caching → ✍️ Write-Back (Write-Behind)",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Caching",
    level: 4,
  },

  concept: {
    name: "Write-Back Cache",
    emoji: "✍️",
    tagline: "Write to cache now, persist to database later",
    definition:
      "Write-Back caching (also called Write-Behind) is a caching strategy where write operations are immediately written to fast cache storage but asynchronously persisted to the slower, durable database. Unlike Write-Through caching where writes block until both cache and database complete, Write-Back acknowledges writes as soon as the cache update succeeds, dramatically reducing write latency from database round-trip times (10-50ms) to cache speeds (sub-millisecond). The cache becomes temporarily inconsistent with the database—entries marked 'dirty' accumulate in the cache until a background process batches and flushes them to the database. This batching enables optimizations: multiple updates to the same record can be coalesced into a single database write; sequential writes can be grouped into bulk operations; and write throughput is decoupled from database performance. However, this performance gain comes with durability trade-offs. If the cache crashes before dirty entries flush, data is lost unless protected by a Write-Ahead Log (WAL) that persists operations to durable storage before acknowledging. Think of Write-Back like taking notes during a meeting—you jot down ideas immediately (cache writes) rather than stopping to file each note in your organized system (database), then later transfer your notes to permanent storage in batches. This makes note-taking fast but requires the notepad (WAL) to survive if you need to reconstruct what happened.",
    problemSolved:
      "Database write operations are inherently slow due to disk I/O, transaction logging, index maintenance, and network latency. In write-heavy workloads—analytics ingestion, gaming state updates, social media interactions, IoT telemetry—every write operation blocking on database completion creates bottlenecks. As write throughput increases, database connection pools saturate, write queues grow, and latency degrades. Write-Through caching helps by reducing read load but doesn't accelerate writes since both cache and database must complete. Write-Back solves this by decoupling write acknowledgment from database persistence. Applications receive sub-millisecond write confirmations while the database operates at its own pace in the background. This enables dramatic throughput gains: batching 100 individual writes into a single bulk operation reduces database load 100x; coalescing multiple updates to the same record eliminates redundant writes; and high write bursts (traffic spikes, viral events) absorb into the cache without overwhelming the database. The pattern also enables graceful degradation—if the database becomes slow or temporarily unavailable, the application continues accepting writes to the cache, buffering them until the database recovers. However, Write-Back introduces durability risks and operational complexity: crash recovery requires replaying Write-Ahead Logs; eventual consistency means recent writes may not appear in database queries immediately; and failure scenarios (cache crashes, network partitions) require careful handling to prevent data loss.",
    tradeoffs: {
      pros: [
        "Extremely low write latency (sub-millisecond cache speeds)",
        "High write throughput through batching and coalescing",
        "Reduced database load by aggregating writes",
        "Better performance during traffic spikes",
        "Decouples application speed from database performance",
      ],
      cons: [
        "Data loss risk if cache crashes before flush",
        "Eventual consistency between cache and database",
        "Complex crash recovery requiring Write-Ahead Logs",
        "Harder to debug data inconsistencies",
        "Requires careful monitoring of flush lag",
      ],
    },
    relatedPatterns: [
      "write-through",
      "cache-aside",
      "write-ahead-log",
      "event-sourcing",
      "change-data-capture",
      "eventual-consistency",
      "bulk-operations",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Write Initiator",
        responsibilities: [
          "Write data to cache immediately",
          "Mark cache entries as dirty",
          "Acknowledge writes to clients quickly",
        ],
      },
      {
        name: "Cache",
        role: "Fast Write Buffer",
        responsibilities: [
          "Store writes in-memory with dirty flags",
          "Track which entries need database persistence",
          "Serve reads from latest cached data",
        ],
      },
      {
        name: "Background Writer",
        role: "Async Persistence Worker",
        responsibilities: [
          "Poll cache for dirty entries periodically",
          "Batch multiple writes into bulk operations",
          "Flush dirty entries to database",
          "Clear dirty flags after successful writes",
        ],
      },
      {
        name: "Database",
        role: "Durable Storage",
        responsibilities: [
          "Persist data durably to disk",
          "Handle bulk write operations efficiently",
          "Provide consistent view after flush completes",
        ],
      },
      {
        name: "Write-Ahead Log (WAL)",
        role: "Durability Guardian",
        responsibilities: [
          "Log all writes before acknowledging to application",
          "Enable crash recovery by replaying unflushed writes",
          "Checkpoint when entries successfully flush to database",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant WAL as Write-Ahead Log
    participant Cache as Cache
    participant Worker as Background Writer
    participant DB as Database

    App->>WAL: Log write operation
    WAL-->>App: Persisted to WAL
    App->>Cache: Write data + mark dirty
    Cache-->>App: Write acknowledged (fast!)

    Note over Worker: Periodic flush interval
    Worker->>Cache: Get dirty entries
    Cache-->>Worker: Return dirty items
    Worker->>DB: Bulk write batch
    DB-->>Worker: Write confirmed
    Worker->>Cache: Clear dirty flags
    Worker->>WAL: Checkpoint (safe to discard)

    Note over App,DB: On crash recovery
    App->>WAL: Read unflushed entries
    WAL-->>App: Return uncommitted writes
    App->>DB: Replay missing writes`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Log to Write-Ahead Log",
        description:
          "Write operation is durably logged before cache update (ensures recoverability)",
      },
      {
        step: 2,
        actor: "Application",
        action: "Write to Cache",
        description:
          "Update cache entry and mark as dirty (needs database flush)",
      },
      {
        step: 3,
        actor: "Cache",
        action: "Acknowledge Write",
        description:
          "Return success to application immediately (sub-millisecond latency)",
      },
      {
        step: 4,
        actor: "Background Writer",
        action: "Poll for Dirty Entries",
        description:
          "Periodically scan cache for dirty entries needing persistence",
      },
      {
        step: 5,
        actor: "Background Writer",
        action: "Batch Dirty Entries",
        description: "Group multiple dirty entries into bulk write operation",
      },
      {
        step: 6,
        actor: "Background Writer",
        action: "Flush to Database",
        description: "Execute bulk write to persist batched entries durably",
      },
      {
        step: 7,
        actor: "Background Writer",
        action: "Clear Dirty Flags",
        description:
          "Mark cache entries as clean after successful database write",
      },
      {
        step: 8,
        actor: "Background Writer",
        action: "Checkpoint WAL",
        description:
          "Notify WAL that entries are safely persisted (can be discarded)",
      },
      {
        step: 9,
        actor: "Application",
        action: "Crash Recovery",
        description:
          "On restart, replay unflushed entries from WAL to database",
      },
      {
        step: 10,
        actor: "Application",
        action: "Resume Normal Operation",
        description: "After recovery completes, continue accepting writes",
      },
    ],
    invariants: [
      "All writes must be logged to WAL before acknowledging",
      "Dirty entries must eventually flush to database",
      "Database contains all acknowledged writes after WAL replay",
      "WAL can only be truncated after database flush confirms",
      "Reads from cache must return latest writes even if not yet flushed",
    ],
  },

  codeExamples: [
    {
      id: "wb-typescript-redis-wal",
      language: "typescript",
      title: "Write-Back Cache with WAL and Background Flushing",
      description:
        "Production-grade write-back implementation with Write-Ahead Log for durability, background batch flushing, and crash recovery",
      code: `import Redis from 'ioredis';
import { Pool } from 'pg';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

// Domain model for analytics events
interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// Write-Ahead Log entry
interface WALEntry {
  id: string;
  operation: 'write' | 'delete';
  key: string;
  data: AnalyticsEvent | null;
  timestamp: number;
}

// Configuration for write-back cache
interface WriteBackConfig {
  flushIntervalMs: number;
  batchSize: number;
  walPath: string;
  enableWAL: boolean;
}

/**
 * Write-Back Cache with WAL for Analytics Events
 *
 * Provides sub-millisecond write acknowledgment by buffering writes
 * in cache and flushing to PostgreSQL asynchronously in batches.
 *
 * Features:
 * - Write-Ahead Log (WAL) for crash recovery
 * - Background batch flushing to database
 * - Dirty entry tracking with timestamps
 * - Write coalescing (multiple updates to same key → single DB write)
 * - Graceful degradation on database failures
 */
export class WriteBackCache extends EventEmitter {
  private redis: Redis;
  private pgPool: Pool;
  private config: WriteBackConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private walFileHandle: fs.FileHandle | null = null;
  private isShuttingDown = false;

  // Metrics tracking
  private metrics = {
    cacheWrites: 0,
    dbFlushes: 0,
    coalescedWrites: 0,
    walWrites: 0,
    flushErrors: 0,
  };

  constructor(
    redis: Redis,
    pgPool: Pool,
    config: Partial<WriteBackConfig> = {}
  ) {
    super();
    this.redis = redis;
    this.pgPool = pgPool;
    this.config = {
      flushIntervalMs: config.flushIntervalMs ?? 5000,
      batchSize: config.batchSize ?? 100,
      walPath: config.walPath ?? '/tmp/writeback.wal',
      enableWAL: config.enableWAL ?? true,
    };
  }

  /**
   * Initialize cache and start background flushing
   */
  async start(): Promise<void> {
    // Open Write-Ahead Log for durability
    if (this.config.enableWAL) {
      this.walFileHandle = await fs.open(this.config.walPath, 'a+');
      await this.recoverFromWAL();
    }

    // Start background flush timer
    this.flushTimer = setInterval(
      () => this.flushDirtyEntries(),
      this.config.flushIntervalMs
    );

    this.emit('started');
  }

  /**
   * Write event to cache immediately (fast path)
   *
   * Action: Log to WAL first, then write to Redis cache with dirty flag
   * Reason: WAL provides durability guarantee; cache write provides
   *         instant acknowledgment; dirty flag marks entry for flush
   * Context Level: module
   */
  async writeEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Step 1: Write to WAL for durability BEFORE acknowledging
      if (this.config.enableWAL) {
        await this.writeToWAL({
          id: event.id,
          operation: 'write',
          key: this.cacheKey(event.id),
          data: event,
          timestamp: Date.now(),
        });
        this.metrics.walWrites++;
      }

      // Step 2: Write to cache with dirty flag
      const cacheKey = this.cacheKey(event.id);
      const dirtyKey = this.dirtyKey(event.id);

      // Store event data
      await this.redis.setex(
        cacheKey,
        3600, // Keep in cache for 1 hour
        JSON.stringify(event)
      );

      // Mark as dirty (needs database flush)
      // Action: Store timestamp when entry was marked dirty
      // Reason: Enables tracking flush lag and detecting stale entries
      //         that haven't flushed in too long
      // Context Level: system
      await this.redis.zadd('dirty_entries', Date.now(), event.id);

      this.metrics.cacheWrites++;

      // Step 3: Acknowledge write immediately (sub-millisecond!)
      // Database flush happens asynchronously in background
    } catch (error) {
      this.emit('write_error', error);
      throw new Error(\`Write-back cache write failed: \${error}\`);
    }
  }

  /**
   * Read from cache (reads always hit cache, never database)
   *
   * Action: Serve reads from cache even if entry is dirty
   * Reason: Write-back pattern keeps latest data in cache;
   *         database may be stale until flush completes
   * Context Level: module
   */
  async readEvent(eventId: string): Promise<AnalyticsEvent | null> {
    const cached = await this.redis.get(this.cacheKey(eventId));

    if (cached === null) {
      // Cache miss - try database
      return this.loadFromDatabase(eventId);
    }

    return JSON.parse(cached);
  }

  /**
   * Background job: Flush dirty entries to database in batches
   *
   * Action: Poll dirty entries, batch into bulk operations, flush to DB
   * Reason: Batching reduces database round-trips; 100 individual writes
   *         become 1 bulk INSERT, reducing DB load 100x
   * Context Level: system
   */
  private async flushDirtyEntries(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      // Step 1: Get dirty entry IDs from sorted set
      // Action: Fetch oldest dirty entries first (FIFO flushing)
      // Reason: Ensures entries flush in order they were written;
      //         prevents indefinite flush lag for old entries
      // Context Level: module
      const dirtyIds = await this.redis.zrange(
        'dirty_entries',
        0,
        this.config.batchSize - 1
      );

      if (dirtyIds.length === 0) {
        return; // No dirty entries to flush
      }

      // Step 2: Load dirty entry data from cache
      const pipeline = this.redis.pipeline();
      dirtyIds.forEach((id) => pipeline.get(this.cacheKey(id)));
      const cachedData = await pipeline.exec();

      // Step 3: Build batch for database write
      const eventsToFlush: AnalyticsEvent[] = [];
      const idsToFlush: string[] = [];

      for (let i = 0; i < dirtyIds.length; i++) {
        const [err, data] = cachedData![i];
        if (!err && data) {
          eventsToFlush.push(JSON.parse(data as string));
          idsToFlush.push(dirtyIds[i]);
        }
      }

      if (eventsToFlush.length === 0) return;

      // Step 4: Bulk insert/update to database
      // Action: Use PostgreSQL INSERT ... ON CONFLICT for upsert
      // Reason: Handles both new events and updates to existing events
      //         in single query; coalesces multiple writes to same ID
      // Context Level: system
      await this.bulkFlushToDatabase(eventsToFlush);

      // Step 5: Clear dirty flags after successful flush
      await this.redis.zrem('dirty_entries', ...idsToFlush);

      // Step 6: Checkpoint WAL (entries safely in database)
      if (this.config.enableWAL) {
        await this.checkpointWAL(idsToFlush);
      }

      this.metrics.dbFlushes++;
      this.emit('flush_complete', {
        count: eventsToFlush.length,
        batchSize: this.config.batchSize,
      });
    } catch (error) {
      this.metrics.flushErrors++;
      this.emit('flush_error', error);
      // Continue operation - cache writes still work even if DB flush fails
    }
  }

  /**
   * Bulk database flush using PostgreSQL COPY or INSERT
   *
   * Action: Use bulk INSERT with ON CONFLICT for efficient upsert
   * Reason: Bulk operations are orders of magnitude faster than
   *         individual INSERTs; reduces transaction overhead
   * Context Level: system
   */
  private async bulkFlushToDatabase(
    events: AnalyticsEvent[]
  ): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Build bulk INSERT with ON CONFLICT (upsert)
      const values: any[] = [];
      const placeholders: string[] = [];

      events.forEach((event, idx) => {
        const offset = idx * 5;
        placeholders.push(
          \`($\${offset + 1}, $\${offset + 2}, $\${offset + 3}, $\${offset + 4}, $\${offset + 5})\`
        );
        values.push(
          event.id,
          event.userId,
          event.eventType,
          event.timestamp,
          JSON.stringify(event.metadata)
        );
      });

      const query = \`
        INSERT INTO analytics_events (id, user_id, event_type, timestamp, metadata)
        VALUES \${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          event_type = EXCLUDED.event_type,
          timestamp = EXCLUDED.timestamp,
          metadata = EXCLUDED.metadata
      \`;

      await client.query(query, values);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Write-Ahead Log: Durable write log for crash recovery
   *
   * Action: Append write operations to WAL file before acknowledging
   * Reason: If cache crashes before flush, WAL replay ensures no data loss;
   *         provides durability guarantee for write-back pattern
   * Context Level: system
   */
  private async writeToWAL(entry: WALEntry): Promise<void> {
    if (!this.walFileHandle) return;

    const logLine = JSON.stringify(entry) + '\\n';
    await this.walFileHandle.write(logLine);
    await this.walFileHandle.sync(); // Force to disk
  }

  /**
   * Crash recovery: Replay unflushed writes from WAL
   *
   * Action: On startup, read WAL and replay entries not yet in database
   * Reason: Recovers writes that were acknowledged to clients but
   *         not flushed before crash; maintains durability guarantee
   * Context Level: system
   */
  private async recoverFromWAL(): Promise<void> {
    if (!this.walFileHandle) return;

    try {
      const fileContent = await fs.readFile(this.config.walPath, 'utf-8');
      const lines = fileContent.split('\\n').filter((l) => l.trim());

      console.log(\`Recovering from WAL: \${lines.length} entries\`);

      for (const line of lines) {
        const entry: WALEntry = JSON.parse(line);

        if (entry.operation === 'write' && entry.data) {
          // Replay write to cache
          await this.redis.setex(
            entry.key,
            3600,
            JSON.stringify(entry.data)
          );
          await this.redis.zadd('dirty_entries', entry.timestamp, entry.data.id);
        }
      }

      // Force immediate flush of recovered entries
      await this.flushDirtyEntries();

      console.log('WAL recovery complete');
    } catch (error) {
      console.error('WAL recovery failed:', error);
    }
  }

  /**
   * WAL checkpoint: Clear entries that are safely in database
   *
   * Action: Rewrite WAL file excluding flushed entries
   * Reason: Prevents WAL from growing unbounded; only keeps
   *         unflushed entries for recovery
   * Context Level: module
   */
  private async checkpointWAL(flushedIds: string[]): Promise<void> {
    if (!this.walFileHandle) return;

    try {
      const fileContent = await fs.readFile(this.config.walPath, 'utf-8');
      const lines = fileContent.split('\\n').filter((l) => l.trim());

      // Filter out flushed entries
      const remainingLines = lines.filter((line) => {
        const entry: WALEntry = JSON.parse(line);
        return !flushedIds.includes(entry.data?.id || '');
      });

      // Rewrite WAL with only unflushed entries
      await fs.writeFile(
        this.config.walPath,
        remainingLines.join('\\n') + '\\n'
      );
    } catch (error) {
      console.error('WAL checkpoint failed:', error);
    }
  }

  /**
   * Load from database (cache miss fallback)
   */
  private async loadFromDatabase(
    eventId: string
  ): Promise<AnalyticsEvent | null> {
    const result = await this.pgPool.query(
      'SELECT * FROM analytics_events WHERE id = $1',
      [eventId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type,
      timestamp: row.timestamp,
      metadata: row.metadata,
    };
  }

  /**
   * Graceful shutdown: Flush all dirty entries before exit
   *
   * Action: Set shutdown flag, flush all dirty entries, close WAL
   * Reason: Ensures no data loss on graceful shutdown; all acknowledged
   *         writes must be in database before process exits
   * Context Level: system
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    console.log('Flushing remaining dirty entries...');

    // Flush all remaining dirty entries
    let dirtyCount = await this.redis.zcard('dirty_entries');
    while (dirtyCount > 0) {
      await this.flushDirtyEntries();
      dirtyCount = await this.redis.zcard('dirty_entries');
    }

    if (this.walFileHandle) {
      await this.walFileHandle.close();
    }

    console.log('Write-back cache shutdown complete');
  }

  private cacheKey(eventId: string): string {
    return \`event:\${eventId}\`;
  }

  private dirtyKey(eventId: string): string {
    return \`dirty:\${eventId}\`;
  }

  getMetrics() {
    return {
      ...this.metrics,
      dirtyEntriesCount: this.redis.zcard('dirty_entries'),
    };
  }
}

// Usage example
async function example() {
  const redis = new Redis({ host: 'localhost', port: 6379 });
  const pgPool = new Pool({
    host: 'localhost',
    database: 'analytics',
    user: 'postgres',
    password: 'password',
  });

  const cache = new WriteBackCache(redis, pgPool, {
    flushIntervalMs: 5000, // Flush every 5 seconds
    batchSize: 100, // Batch up to 100 events per flush
    walPath: '/tmp/analytics.wal',
    enableWAL: true,
  });

  await cache.start();

  // Write events with sub-millisecond acknowledgment
  await cache.writeEvent({
    id: 'evt_123',
    userId: 'user_456',
    eventType: 'page_view',
    timestamp: new Date(),
    metadata: { page: '/home', duration: 1500 },
  });

  console.log('Event written to cache instantly!');

  // Database flush happens asynchronously in background
  cache.on('flush_complete', ({ count }) => {
    console.log(\`Flushed \${count} events to database\`);
  });

  // Read always hits cache (latest data)
  const event = await cache.readEvent('evt_123');
  console.log('Event:', event);

  // Graceful shutdown flushes all pending writes
  process.on('SIGTERM', async () => {
    await cache.shutdown();
    process.exit(0);
  });
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete write-back cache with Write-Ahead Log, background batch flushing, crash recovery, and graceful degradation for analytics event ingestion",
        prerequisites: [
          "Redis for cache storage",
          "PostgreSQL for durable storage",
          "File I/O for Write-Ahead Log",
          "Node.js EventEmitter for observability",
        ],
        systemPosition:
          "Analytics ingestion layer accepting high-volume writes with instant acknowledgment and asynchronous persistence",
      },
      annotations: [
        {
          id: "wb-wal-write",
          lines: [118, 126],
          action: "Write to WAL before acknowledging write to client",
          reason:
            "WAL provides durability guarantee; if cache crashes before database flush, WAL replay recovers all acknowledged writes, preventing data loss",
          contextLevel: "system",
          relatedConcepts: ["write-ahead-log", "durability", "crash-recovery"],
        },
        {
          id: "wb-dirty-tracking",
          lines: [144, 144],
          action: "Mark cache entries as dirty with timestamp in sorted set",
          reason:
            "Sorted set enables FIFO flushing (oldest entries first) and tracking flush lag; prevents entries from staying dirty indefinitely",
          contextLevel: "module",
          relatedConcepts: ["dirty-tracking", "fifo-queue"],
        },
        {
          id: "wb-batch-flush",
          lines: [176, 180],
          action: "Batch flush dirty entries to database every 5 seconds",
          reason:
            "Batching reduces database load 100x; 1000 individual INSERTs become 10 bulk operations, enabling high write throughput",
          contextLevel: "system",
          relatedConcepts: ["batching", "bulk-operations", "write-coalescing"],
        },
        {
          id: "wb-upsert",
          lines: [222, 226],
          action: "Use PostgreSQL INSERT ... ON CONFLICT for upsert semantics",
          reason:
            "Handles both new events and updates to existing events; coalesces multiple writes to same ID into single database operation",
          contextLevel: "module",
          relatedConcepts: ["upsert", "idempotency"],
        },
        {
          id: "wb-graceful-degradation",
          lines: [241, 244],
          action: "Continue cache operations even if database flush fails",
          reason:
            "Graceful degradation: applications keep writing to cache during database outages; writes flush when database recovers",
          contextLevel: "system",
          relatedConcepts: ["fault-tolerance", "resilience"],
        },
        {
          id: "wb-crash-recovery",
          lines: [262, 280],
          action: "Replay WAL on startup to recover unflushed writes",
          reason:
            "Crash recovery ensures all acknowledged writes eventually reach database; maintains durability despite cache failures",
          contextLevel: "system",
          relatedConcepts: ["crash-recovery", "wal-replay"],
        },
        {
          id: "wb-wal-checkpoint",
          lines: [288, 302],
          action: "Checkpoint WAL by removing flushed entries",
          reason:
            "Prevents WAL file from growing unbounded; only keeps unflushed entries needed for recovery, reducing storage costs",
          contextLevel: "module",
          relatedConcepts: ["checkpointing", "log-compaction"],
        },
        {
          id: "wb-graceful-shutdown",
          lines: [347, 358],
          action: "Flush all dirty entries during graceful shutdown",
          reason:
            "Ensures zero data loss on clean shutdown; all acknowledged writes must be persisted before process exits",
          contextLevel: "system",
          relatedConcepts: ["graceful-shutdown", "data-integrity"],
        },
      ],
      highlights: [
        {
          lines: [118, 126],
          label: "Write-Ahead Log for durability guarantee",
          sbvpDomain: "behavior",
        },
        {
          lines: [176, 227],
          label: "Background batch flushing with bulk INSERT",
          sbvpDomain: "behavior",
        },
        {
          lines: [262, 280],
          label: "Crash recovery via WAL replay",
          sbvpDomain: "behavior",
        },
        {
          lines: [144, 144],
          label: "Dirty entry tracking with FIFO sorted set",
          sbvpDomain: "structure",
        },
        {
          lines: [241, 244],
          label: "Graceful degradation on database failures",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Analytics ingestion pipelines",
      "Gaming state persistence layer",
      "Social media activity tracking",
      "Log aggregation systems",
      "Metrics collection infrastructure",
      "User activity tracking",
      "Shopping cart updates",
      "Real-time leaderboards",
    ],
    interactsWith: [
      "write-through",
      "cache-aside",
      "message-queue",
      "bulk-operations",
      "eventual-consistency",
    ],
    architecturalBoundaries: [
      "Cache tier (Redis, Memcached, in-memory)",
      "Message queue (Bull, Celery, SQS)",
      "Database tier (PostgreSQL, MySQL, MongoDB)",
      "Recovery coordinator (WAL manager)",
    ],
  },

  implementations: [],
  usedInSystems: [],

  philosophy: {
    coreProblem:
      "Write operations to durable storage (databases) are slow and limit application throughput, but applications need instant write confirmation",
    designPrinciple:
      "Acknowledge writes to fast cache immediately, persist to database asynchronously in batches for maximum throughput while maintaining durability via Write-Ahead Log",
    historicalContext:
      "Write-back caching emerged from CPU cache design (1970s) where modified cache lines flush to memory asynchronously. Applied to databases in 2000s as web applications scaled beyond what synchronous Write-Through could handle.",
    alternativesRejected: [
      "Write-Through - Provides durability but slow (blocks on database)",
      "Cache-Aside - Optimizes reads but doesn't accelerate writes",
      "No caching - Database becomes bottleneck under write load",
      "Fire-and-forget writes - Data loss on cache failure (no durability)",
    ],
    mentalModel:
      "Like jotting down meeting notes on a notepad during discussion (fast note-taking doesn't block conversation), then later transferring notes to organized filing system in batches. The notepad (cache + WAL) must survive if you need to recover what was discussed.",
  },

  visualization: {
    staticDiagram: `flowchart TB
    A[Application Write] --> B[Log to WAL]
    B --> C[Write to Cache + Mark Dirty]
    C --> D[Acknowledge Write Fast!]
    D --> E[Background Worker]
    E --> F{Periodic Trigger}
    F --> G[Collect Dirty Entries]
    G --> H[Batch Flush to Database]
    H --> I[Clear Dirty Flags]
    I --> J[Checkpoint WAL]

    K[On Crash] --> L[Read WAL]
    L --> M[Replay Unflushed Writes]
    M --> H`,
    realWorldAnalogy:
      "Write-Back is like taking notes during a fast-paced meeting. You quickly jot down ideas in your notepad (cache) without stopping to file each note in your organized filing cabinet (database). This keeps the meeting flowing smoothly. Later, during breaks, you transfer your notes to the filing cabinet in batches. Your notepad must be durable (WAL) so if you get interrupted, you can recover from your notes.",
    useCases: [
      {
        domain: "Online Gaming",
        scenario:
          "Multiplayer game with 100k concurrent players, each generating 10 state updates/sec = 1M writes/sec. Write-Through would require 1M database writes/sec (impossible). Write-Back buffers in cache, batches into 10k bulk writes/sec (feasible).",
        patternRole:
          "Enables real-time gameplay with <1ms state update latency while ensuring player progress durability via WAL",
        companies: ["Epic Games", "Riot Games", "Blizzard"],
      },
      {
        domain: "Social Media",
        scenario:
          "Viral post receives 1M likes in 10 minutes. Write-Through: 1M database writes overwhelm database. Write-Back: 1M cache writes, batched into ~1k database writes, smooth load.",
        patternRole:
          "Handles bursty social interactions with instant user feedback and eventual database consistency",
        companies: ["Facebook", "Twitter", "Instagram"],
      },
      {
        domain: "Analytics",
        scenario:
          "Event tracking platform ingests 10k events/sec. Write-Through: 10k individual database INSERTs/sec. Write-Back: Batch 10k events into 1 bulk load every second (100x more efficient).",
        patternRole:
          "Maximizes analytics ingestion throughput through aggressive batching while maintaining real-time query capability",
        companies: ["Google Analytics", "Mixpanel", "Amplitude"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "write-optimization",
    "batching",
    "eventual-consistency",
    "durability",
    "throughput",
  ],
  difficulty: "advanced",
};
