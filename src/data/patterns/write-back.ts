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

  codeExamples: [],

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
