import type { Pattern } from "../schema";

export const batching: Pattern = {
  id: "batching",
  slug: "batching",
  corpusPath: "⚡ PERFORMANCE → 🗄️ Caching & Performance → 📦 Batching",

  hierarchy: {
    quality: "performance",
    strategy: "Caching & Performance",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Batching (Bulk Operations)",
    emoji: "📦",
    tagline: "Group multiple operations into single requests",
    definition:
      "The Batching pattern optimizes system performance by accumulating multiple individual operations and executing them as a single grouped request. Instead of making separate network calls, database queries, or API requests for each item, batching collects operations over a time window or until a size threshold is reached, then processes them together. This approach dramatically reduces per-request overhead such as network round-trips, connection establishment, protocol headers, and context switching. The pattern operates through a coordinator that buffers incoming requests, triggers batch execution based on configurable policies (time-based, size-based, or hybrid), executes the consolidated operation, and distributes results back to individual callers. Common triggers include flush intervals (e.g., every 50ms), batch size limits (e.g., 100 items), or event-driven signals. Batching is particularly powerful in data-intensive scenarios like GraphQL query resolution, database bulk inserts, message queue publishing, and API rate limit optimization. The pattern transforms N individual operations with O(N) overhead into a single operation with O(1) overhead plus linear processing cost, yielding substantial throughput improvements and latency reduction when amortized across all requests.",
    problemSolved:
      "In distributed systems and data-intensive applications, performing operations one at a time incurs significant overhead costs that compound at scale. Every individual network request carries fixed costs: TCP handshake, TLS negotiation, HTTP headers, serialization, and deserialization. Database operations face connection acquisition, query parsing, execution planning, and transaction commit overhead for each statement. APIs enforce rate limits that punish high-frequency individual requests. The N+1 query problem exemplifies this waste: fetching a list of users then making separate queries for each user's profile results in hundreds of redundant database round-trips. Batching solves these problems by amortizing fixed costs across multiple operations. A single batched database insert of 1,000 records completes in milliseconds versus tens of seconds for individual inserts. GraphQL DataLoaders eliminate N+1 queries by collecting all requested IDs within an event loop tick and executing one query. Message queue batching reduces API calls from thousands to dozens while staying under rate limits. The pattern enables systems to handle 10-100x more throughput with the same resources by reducing network chattiness, connection pool exhaustion, and per-operation overhead.",
    tradeoffs: {
      pros: [
        "Dramatically reduces network round-trips and connection overhead",
        "Improves throughput by amortizing fixed costs across operations",
        "Decreases average latency when batch processing is faster than individual ops",
        "Reduces database connection pool pressure and context switching",
        "Optimizes API rate limit usage by grouping requests",
      ],
      cons: [
        "Adds complexity with buffering logic, flush triggers, and result distribution",
        "Increases latency for individual operations waiting for batch to fill",
        "Requires careful handling of partial failures within a batch",
        "Consumes memory for buffering pending operations",
        "Demands tuning of batch size and timeout parameters for optimal performance",
      ],
    },
    relatedPatterns: [
      "write-back",
      "dataloader",
      "coalescing",
      "micro-batching",
      "windowing",
      "connection-pooling",
      "request-coalescing",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client",
        role: "Request Initiator",
        responsibilities: [
          "Submit individual operations to the batch coordinator",
          "Wait for batch execution and result distribution",
          "Handle individual operation results or errors",
        ],
      },
      {
        name: "Batch Coordinator",
        role: "Request Aggregator",
        responsibilities: [
          "Accumulate incoming requests in a buffer",
          "Monitor batch size and time thresholds",
          "Trigger batch execution when flush conditions are met",
          "Distribute results back to waiting clients",
        ],
      },
      {
        name: "Buffer",
        role: "Temporary Storage",
        responsibilities: [
          "Hold pending operations until batch is ready",
          "Maintain FIFO ordering of requests",
          "Enforce maximum buffer size limits",
        ],
      },
      {
        name: "Flush Trigger",
        role: "Execution Scheduler",
        responsibilities: [
          "Monitor time-based flush intervals",
          "Detect size-based thresholds",
          "Signal coordinator to execute batch",
        ],
      },
      {
        name: "Executor",
        role: "Batch Processor",
        responsibilities: [
          "Execute the consolidated batch operation",
          "Handle partial failures within the batch",
          "Return results mapped to original requests",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C1 as Client 1
    participant C2 as Client 2
    participant BC as Batch Coordinator
    participant B as Buffer
    participant E as Executor
    participant DB as Database/API

    C1->>BC: Request Operation A
    BC->>B: Add to buffer
    C2->>BC: Request Operation B
    BC->>B: Add to buffer
    Note over BC,B: Batch accumulation
    BC->>BC: Check flush trigger
    alt Time threshold reached OR Size limit reached
        BC->>B: Retrieve all pending
        B-->>BC: [Op A, Op B, ...]
        BC->>E: Execute batch
        E->>DB: Single bulk operation
        DB-->>E: Batch results
        E-->>BC: Results [A', B', ...]
        BC->>C1: Result A'
        BC->>C2: Result B'
    end`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Submit Request",
        description:
          "Client initiates an operation and sends it to the batch coordinator",
      },
      {
        step: 2,
        actor: "Batch Coordinator",
        action: "Buffer Operation",
        description:
          "Coordinator adds the operation to the pending buffer and returns a promise/future",
      },
      {
        step: 3,
        actor: "Flush Trigger",
        action: "Monitor Thresholds",
        description:
          "Continuously check if time interval elapsed or buffer size exceeded",
      },
      {
        step: 4,
        actor: "Batch Coordinator",
        action: "Collect Batch",
        description:
          "When threshold met, retrieve all pending operations from buffer",
      },
      {
        step: 5,
        actor: "Executor",
        action: "Execute Batch",
        description: "Process all operations in a single database/API call",
      },
      {
        step: 6,
        actor: "Executor",
        action: "Handle Results",
        description:
          "Map batch results back to individual operations, handling partial failures",
      },
      {
        step: 7,
        actor: "Batch Coordinator",
        action: "Distribute Results",
        description:
          "Resolve each client's promise/future with their specific result",
      },
      {
        step: 8,
        actor: "Client",
        action: "Receive Result",
        description:
          "Client receives individual result or error as if operation executed immediately",
      },
      {
        step: 9,
        actor: "Buffer",
        action: "Clear Buffer",
        description: "Reset buffer for the next batch accumulation cycle",
      },
      {
        step: 10,
        actor: "Flush Trigger",
        action: "Reset Timer",
        description: "Restart time-based flush interval for next batch",
      },
    ],
    invariants: [
      "FIFO ordering preserved within each batch",
      "Flush triggered when time threshold OR size threshold exceeded",
      "All results must be distributed to corresponding clients",
      "Buffer must enforce maximum size to prevent memory exhaustion",
      "Partial failures handled gracefully without blocking successful operations",
    ],
  },

  codeExamples: [
    {
      id: "batching-dataloader-ts",
      language: "typescript",
      title: "DataLoader Pattern for GraphQL N+1 Elimination",
      description:
        "Facebook's DataLoader library for batching and caching database queries in GraphQL resolvers",
      code: `import DataLoader from 'dataloader';
import { QueryResult } from 'pg';

// ============================================================
// PROBLEM: N+1 Query Problem in GraphQL
// ============================================================
// Without batching, resolving a list of posts with authors:
//   1. SELECT * FROM posts LIMIT 10           (1 query)
//   2. SELECT * FROM users WHERE id = 1       (10 queries)
//   3. SELECT * FROM users WHERE id = 2
//   ... 8 more individual queries
// Total: 11 queries for 10 posts
//
// With DataLoader batching:
//   1. SELECT * FROM posts LIMIT 10           (1 query)
//   2. SELECT * FROM users WHERE id IN (1,2,3,...,10)  (1 query)
// Total: 2 queries for 10 posts
// ============================================================

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  authorId: number;
}

// Database connection (simulated)
class Database {
  async query<T>(sql: string, params: any[]): Promise<QueryResult<T>> {
    console.log(\`[DB] Executing query: \${sql}\`);
    console.log(\`[DB] Parameters: \${JSON.stringify(params)}\`);

    // Simulated database response
    return {
      rows: [],
      rowCount: 0,
      command: 'SELECT',
      oid: 0,
      fields: []
    };
  }
}

const db = new Database();

// ============================================================
// ACTION: Create batch loading function
// REASON: DataLoader requires a function that takes an array
//         of keys and returns a Promise of corresponding values
//         in the same order. This enables request deduplication
//         and per-request batching.
// CONTEXT: This function is called once per event loop tick
//          with all accumulated user IDs, eliminating N+1 queries
// ============================================================
async function batchLoadUsers(userIds: readonly number[]): Promise<User[]> {
  // ACTION: Execute single query with IN clause for all IDs
  // REASON: Replaces N individual queries with 1 batch query,
  //         reducing database round-trips from O(N) to O(1)
  const result = await db.query<User>(
    'SELECT id, name, email FROM users WHERE id = ANY($1)',
    [userIds]
  );

  // ACTION: Create lookup map for O(1) result ordering
  // REASON: Database may return results in arbitrary order,
  //         but DataLoader requires results in exact same order
  //         as input keys for correct distribution to callers
  const userMap = new Map<number, User>();
  result.rows.forEach(user => userMap.set(user.id, user));

  // ACTION: Return users in same order as requested IDs
  // REASON: DataLoader contract requires 1:1 mapping between
  //         input keys and output values to correctly resolve
  //         individual promises from different callers
  // CRITICAL: Must return array of same length, with null for missing
  return userIds.map(id => userMap.get(id) || null as any);
}

// ============================================================
// ACTION: Initialize DataLoader with batch function and config
// REASON: DataLoader automatically batches all .load() calls
//         within a single event loop tick, then executes batch
//         function once with accumulated keys
// ============================================================
const userLoader = new DataLoader<number, User>(
  batchLoadUsers,
  {
    // ACTION: Enable caching to deduplicate identical requests
    // REASON: If multiple resolvers request same user ID within
    //         one request, serve from cache instead of including
    //         duplicate in batch query
    cache: true,

    // ACTION: Set batch size limit
    // REASON: Prevents pathological cases where batch grows too
    //         large, potentially hitting database query limits
    //         or causing memory issues
    maxBatchSize: 100,

    // ACTION: Configure cache key function for complex keys
    // REASON: Default uses strict equality; custom function
    //         enables semantic equality for object keys
    cacheKeyFn: (key: number) => \`user:\${key}\`,
  }
);

// ============================================================
// GraphQL Resolver Examples: WITHOUT vs WITH DataLoader
// ============================================================

// WITHOUT BATCHING: N+1 Query Problem
// ============================================================
async function resolvePostsWithoutBatching(postIds: number[]): Promise<any[]> {
  const posts = await db.query<Post>(
    'SELECT id, title, author_id FROM posts WHERE id = ANY($1)',
    [postIds]
  );

  // ACTION: Map over posts and fetch author for each
  // REASON: This creates N individual database queries
  // PROBLEM: 10 posts = 10 separate queries, each with full
  //          network round-trip, connection acquisition,
  //          query parsing, and execution overhead
  const postsWithAuthors = await Promise.all(
    posts.rows.map(async (post) => {
      // ⚠️ PROBLEM: Individual query per post
      const authorResult = await db.query<User>(
        'SELECT id, name, email FROM users WHERE id = $1',
        [post.authorId]
      );

      return {
        ...post,
        author: authorResult.rows[0],
      };
    })
  );

  return postsWithAuthors;
}

// WITH BATCHING: DataLoader Solution
// ============================================================
async function resolvePostsWithBatching(postIds: number[]): Promise<any[]> {
  const posts = await db.query<Post>(
    'SELECT id, title, author_id FROM posts WHERE id = ANY($1)',
    [postIds]
  );

  // ACTION: Use DataLoader.load() for each author lookup
  // REASON: DataLoader automatically batches all .load() calls
  //         made in the same event loop tick into a single
  //         batchLoadUsers() invocation
  // BENEFIT: 10 posts still result in only 1 author query:
  //          SELECT * FROM users WHERE id IN (1,2,3,...,10)
  const postsWithAuthors = await Promise.all(
    posts.rows.map(async (post) => {
      // ✅ SOLUTION: DataLoader batches these automatically
      const author = await userLoader.load(post.authorId);

      return {
        ...post,
        author,
      };
    })
  );

  return postsWithAuthors;
}

// ============================================================
// GraphQL Type Resolvers with DataLoader
// ============================================================
const resolvers = {
  Query: {
    posts: async () => {
      const result = await db.query<Post>(
        'SELECT id, title, author_id FROM posts LIMIT 10',
        []
      );
      return result.rows;
    },
  },

  Post: {
    // ACTION: Resolver for Post.author field
    // REASON: When GraphQL resolves 10 posts, this resolver
    //         is called 10 times. Without batching, this would
    //         execute 10 separate database queries.
    author: async (post: Post) => {
      // ACTION: Use DataLoader instead of direct database query
      // REASON: DataLoader collects all author IDs from this
      //         request cycle and batches them into one query
      // CONTEXT DILATION: Within a single GraphQL request, all
      //         Post.author field resolutions are batched together
      return userLoader.load(post.authorId);
    },
  },
};

// ============================================================
// Performance Comparison: Batching vs No Batching
// ============================================================
async function performanceComparison() {
  console.log('\\n=== WITHOUT BATCHING (N+1 Problem) ===');
  console.time('Without batching');
  await resolvePostsWithoutBatching([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  console.timeEnd('Without batching');
  // Expected output:
  // [DB] Executing query: SELECT ... FROM posts ...
  // [DB] Executing query: SELECT ... FROM users WHERE id = 1
  // [DB] Executing query: SELECT ... FROM users WHERE id = 2
  // ... (8 more individual queries)
  // Without batching: ~250ms (10 network round-trips)

  console.log('\\n=== WITH BATCHING (DataLoader) ===');
  console.time('With batching');
  await resolvePostsWithBatching([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  console.timeEnd('With batching');
  // Expected output:
  // [DB] Executing query: SELECT ... FROM posts ...
  // [DB] Executing query: SELECT ... FROM users WHERE id = ANY([1,2,...,10])
  // With batching: ~25ms (2 network round-trips)

  // Performance improvement: 10x faster
  // Query reduction: 11 queries → 2 queries (82% reduction)
}

// ============================================================
// Advanced: Request-scoped DataLoader instances
// ============================================================
// ACTION: Create new DataLoader instance per GraphQL request
// REASON: Prevents cache leaking between requests and ensures
//         batching only happens within a single request context
// ============================================================
function createDataLoaders() {
  return {
    userLoader: new DataLoader<number, User>(batchLoadUsers),
    // Add more loaders as needed
  };
}

// Express middleware example
function graphqlContext(req: any, res: any) {
  return {
    // ACTION: Attach fresh DataLoader instances to context
    // REASON: Each GraphQL request gets isolated loaders,
    //         preventing data leakage and ensuring correct
    //         batching scope (within request, not across requests)
    loaders: createDataLoaders(),
    userId: req.userId,
  };
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete GraphQL DataLoader integration eliminating N+1 queries across resolver chains",
        prerequisites: [
          "GraphQL resolver execution model",
          "Event loop tick batching",
          "Promise-based async coordination",
          "Database query optimization",
        ],
        systemPosition:
          "GraphQL resolver layer batching data fetches from database or microservices, integrated with request context and caching layer",
      },
      annotations: [
        {
          id: "batching-dataloader-batch-fn",
          lines: [49, 65],
          action:
            "Define batch loading function that takes array of keys and returns ordered results",
          reason:
            "DataLoader requires strict contract: input array of N keys must produce output array of N values in exact same order. This enables automatic request deduplication and result distribution to individual callers who made different .load() calls.",
          contextLevel: "module",
          relatedConcepts: ["request-coalescing", "result-distribution"],
        },
        {
          id: "batching-dataloader-query",
          lines: [52, 56],
          action:
            "Execute single database query with IN clause for all accumulated IDs",
          reason:
            "Replaces N individual SELECT queries with 1 batched query, reducing network round-trips from O(N) to O(1). Database connection is acquired once, query is parsed once, and results are returned in a single response.",
          contextLevel: "system",
          relatedConcepts: ["query-optimization", "connection-pooling"],
        },
        {
          id: "batching-dataloader-ordering",
          lines: [58, 68],
          action:
            "Map database results back to requested order using lookup table",
          reason:
            "Database may return rows in arbitrary order due to index usage or query planning. DataLoader contract mandates returning results in exact same order as input keys so each caller's promise resolves with their specific requested value.",
          contextLevel: "local",
          relatedConcepts: ["promise-coordination", "result-mapping"],
        },
        {
          id: "batching-dataloader-init",
          lines: [73, 95],
          action:
            "Initialize DataLoader with configuration for caching and batch size limits",
          reason:
            "Caching prevents duplicate requests within same batch (if 3 resolvers request user ID 5, only include once in query and serve others from cache). Max batch size prevents pathological cases where millions of IDs could exceed database query limits.",
          contextLevel: "module",
          relatedConcepts: ["request-deduplication", "cache-aside"],
        },
        {
          id: "batching-n-plus-one-problem",
          lines: [101, 125],
          action:
            "Demonstrate N+1 query anti-pattern with individual queries per post",
          reason:
            "Without batching, fetching authors for 10 posts results in 11 database queries: 1 for posts + 10 individual author queries. Each query incurs full network round-trip (5-20ms), connection acquisition, query parsing, and execution overhead.",
          contextLevel: "system",
          relatedConcepts: ["n-plus-one-query", "network-latency"],
        },
        {
          id: "batching-dataloader-usage",
          lines: [127, 152],
          action: "Use DataLoader.load() to automatically batch author lookups",
          reason:
            "DataLoader collects all .load() calls made within a single event loop tick (typically one GraphQL request) and executes batchLoadUsers() once with all IDs. This reduces 10 queries to 1 batched query, improving performance 5-10x.",
          contextLevel: "system",
          relatedConcepts: ["event-loop-batching", "graphql-resolvers"],
        },
        {
          id: "batching-resolver-integration",
          lines: [168, 180],
          action:
            "Integrate DataLoader in GraphQL field resolver for automatic batching",
          reason:
            "GraphQL executes field resolvers independently for each object in a list. When resolving 10 Post.author fields, DataLoader automatically batches all 10 author ID lookups into a single database query, transparent to resolver implementation.",
          contextLevel: "system",
          relatedConcepts: ["graphql-execution", "field-resolution"],
        },
        {
          id: "batching-request-scoped",
          lines: [217, 231],
          action:
            "Create fresh DataLoader instances per GraphQL request to isolate caching",
          reason:
            "DataLoader caches results for deduplication within a request. Creating new instances per request prevents cache leakage between users (user A shouldn't see cached data from user B's request) and ensures correct batching scope.",
          contextLevel: "system",
          relatedConcepts: ["request-isolation", "cache-lifetime"],
        },
      ],
      highlights: [
        {
          lines: [49, 68],
          label: "Batch loading function with result ordering",
          sbvpDomain: "structure",
        },
        {
          lines: [73, 95],
          label: "DataLoader initialization with caching config",
          sbvpDomain: "behavior",
        },
        {
          lines: [101, 152],
          label: "N+1 problem vs batching solution comparison",
          sbvpDomain: "philosophy",
        },
        {
          lines: [184, 206],
          label: "Performance comparison: 11 queries → 2 queries",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "batching-database-python",
      language: "python",
      title: "Bulk Database Insert with PostgreSQL COPY",
      description:
        "SQLAlchemy bulk operations and PostgreSQL COPY command for high-performance batch inserts",
      code: `from typing import List, Dict, Any, Iterator
from contextlib import contextmanager
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Table, MetaData
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
import csv
import io
import time

# ============================================================
# Database Schema Definition
# ============================================================
metadata = MetaData()

events_table = Table(
    'events',
    metadata,
    Column('id', Integer, primary_key=True),
    Column('user_id', Integer, nullable=False),
    Column('event_type', String(50), nullable=False),
    Column('event_data', String(500)),
    Column('created_at', DateTime, nullable=False),
)

# Database connection
engine = create_engine('postgresql://user:pass@localhost/analytics')
SessionLocal = sessionmaker(bind=engine)

# ============================================================
# APPROACH 1: Individual Inserts (Baseline - Slow)
# ============================================================
# ACTION: Insert records one at a time
# REASON: Simple but extremely inefficient for bulk data
# PERFORMANCE: 1000 inserts ≈ 10 seconds (100 inserts/sec)
# ============================================================
def insert_individual(events: List[Dict[str, Any]]) -> None:
    session = SessionLocal()
    try:
        for event in events:
            # ⚠️ PROBLEM: Each insert is a separate transaction
            # - Database acquires connection from pool
            # - Parses SQL statement
            # - Creates execution plan
            # - Executes insert
            # - Commits transaction
            # - Returns connection to pool
            # Total: ~10ms per insert with network overhead
            session.execute(
                events_table.insert().values(
                    user_id=event['user_id'],
                    event_type=event['event_type'],
                    event_data=event['event_data'],
                    created_at=event['created_at'],
                )
            )
            session.commit()
    finally:
        session.close()

# ============================================================
# APPROACH 2: Batch Insert with executemany()
# ============================================================
# ACTION: Use database-level batch insert
# REASON: Single transaction, reduced round-trips
# PERFORMANCE: 1000 inserts ≈ 2 seconds (500 inserts/sec)
# IMPROVEMENT: 5x faster than individual inserts
# ============================================================
def insert_batch_executemany(events: List[Dict[str, Any]]) -> None:
    session = SessionLocal()
    try:
        # ACTION: Execute multiple inserts in single statement
        # REASON: Database can optimize batch insert execution,
        #         parse SQL once, and commit once at the end
        # CONTEXT: Still sends full SQL + parameters for each row,
        #          but executes in single transaction
        session.execute(
            events_table.insert(),
            events  # List of dicts, one per row
        )

        # ACTION: Single commit for entire batch
        # REASON: Transaction overhead paid once instead of N times,
        #         reducing WAL writes and lock acquisition
        session.commit()
    finally:
        session.close()

# ============================================================
# APPROACH 3: SQLAlchemy bulk_insert_mappings()
# ============================================================
# ACTION: Use SQLAlchemy's optimized bulk insert API
# REASON: Bypasses ORM overhead for maximum insert throughput
# PERFORMANCE: 1000 inserts ≈ 1 second (1000 inserts/sec)
# IMPROVEMENT: 10x faster than individual, 2x faster than executemany
# ============================================================
def insert_bulk_mappings(events: List[Dict[str, Any]]) -> None:
    session = SessionLocal()
    try:
        # ACTION: Use bulk_insert_mappings for optimized batch insert
        # REASON: Bypasses full ORM object instantiation and tracking,
        #         directly generates INSERT statements with VALUES list
        #         INSERT INTO events VALUES (row1), (row2), (row3), ...
        # BENEFIT: Minimal Python overhead, optimized SQL generation
        session.bulk_insert_mappings(
            events_table,
            events
        )
        session.commit()
    finally:
        session.close()

# ============================================================
# APPROACH 4: PostgreSQL COPY Command (Fastest)
# ============================================================
# ACTION: Use PostgreSQL's native COPY command for bulk loading
# REASON: COPY is PostgreSQL's fastest data loading method,
#         bypassing normal SQL parsing and using optimized
#         binary protocol for data transfer
# PERFORMANCE: 1000 inserts ≈ 0.1 seconds (10,000 inserts/sec)
# IMPROVEMENT: 100x faster than individual, 10x faster than bulk_insert
# ============================================================
def insert_copy_command(events: List[Dict[str, Any]]) -> None:
    # ACTION: Generate CSV data in memory
    # REASON: COPY command expects CSV or binary format,
    #         not SQL statements. In-memory CSV avoids disk I/O
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer)

    # ACTION: Write events to CSV buffer
    # REASON: COPY FROM STDIN reads CSV data, which is more compact
    #         than SQL and can be parsed/loaded much faster
    for event in events:
        csv_writer.writerow([
            event['user_id'],
            event['event_type'],
            event['event_data'],
            event['created_at'].isoformat(),
        ])

    csv_buffer.seek(0)  # Reset buffer to beginning

    # ACTION: Use raw database connection for COPY command
    # REASON: COPY is a PostgreSQL-specific extension not
    #         available through standard SQL interface
    connection = engine.raw_connection()
    try:
        cursor = connection.cursor()

        # ACTION: Execute COPY command with CSV data
        # REASON: COPY FROM STDIN bypasses SQL parsing, query planning,
        #         and normal insert execution path. PostgreSQL can
        #         directly append data to table files with minimal overhead
        # CRITICAL: 100x faster than standard INSERT for bulk data
        cursor.copy_expert(
            """
            COPY events (user_id, event_type, event_data, created_at)
            FROM STDIN WITH (FORMAT CSV)
            """,
            csv_buffer
        )

        connection.commit()
    finally:
        connection.close()

# ============================================================
# APPROACH 5: Chunked Batching for Large Datasets
# ============================================================
# ACTION: Process large datasets in fixed-size chunks
# REASON: Prevents memory exhaustion and transaction timeout
#         for datasets larger than available RAM
# ============================================================
def insert_chunked_batches(
    events: List[Dict[str, Any]],
    chunk_size: int = 1000
) -> None:
    """
    ACTION: Split large dataset into manageable chunks
    REASON: Batch size tuning balances memory usage vs. throughput.
            Too large: Risk OOM and long-running transactions
            Too small: Don't amortize overhead effectively
    RECOMMENDED: 500-5000 rows per batch for most workloads
    """
    session = SessionLocal()
    try:
        for i in range(0, len(events), chunk_size):
            chunk = events[i:i + chunk_size]

            # ACTION: Insert chunk using bulk_insert_mappings
            # REASON: Processes one chunk at a time, keeping memory
            #         usage constant regardless of total dataset size
            session.bulk_insert_mappings(events_table, chunk)

            # ACTION: Commit after each chunk
            # REASON: Breaks large transaction into smaller ones,
            #         preventing transaction timeout and reducing
            #         memory held by database for rollback
            session.commit()

            print(f"Inserted chunk {i // chunk_size + 1}: {len(chunk)} rows")
    finally:
        session.close()

# ============================================================
# APPROACH 6: Streaming Generator for Memory Efficiency
# ============================================================
# ACTION: Use generator to stream data from source
# REASON: Process datasets larger than RAM without loading
#         entire dataset into memory at once
# ============================================================
def generate_events(count: int) -> Iterator[Dict[str, Any]]:
    """
    ACTION: Yield events one at a time from generator
    REASON: Generator produces values lazily, consuming O(1)
            memory instead of O(N) for list of all events
    USE CASE: Processing log files, API pagination, database cursors
    """
    for i in range(count):
        yield {
            'user_id': i % 10000,
            'event_type': 'page_view',
            'event_data': f'{{"page": "/product/{i}"}}',
            'created_at': datetime.now(),
        }

def insert_from_generator(
    event_generator: Iterator[Dict[str, Any]],
    chunk_size: int = 1000
) -> None:
    """
    ACTION: Accumulate events from generator into chunks
    REASON: Combine streaming input (constant memory) with
            batch inserts (high throughput)
    """
    session = SessionLocal()
    chunk = []

    try:
        for event in event_generator:
            chunk.append(event)

            # ACTION: Flush chunk when it reaches target size
            # REASON: Balance memory usage vs. batch efficiency
            if len(chunk) >= chunk_size:
                session.bulk_insert_mappings(events_table, chunk)
                session.commit()
                chunk = []  # Reset chunk for next batch

        # ACTION: Insert remaining partial chunk
        # REASON: Don't lose trailing events that didn't fill
        #         a complete chunk
        if chunk:
            session.bulk_insert_mappings(events_table, chunk)
            session.commit()
    finally:
        session.close()

# ============================================================
# Performance Benchmark: All Approaches
# ============================================================
def benchmark_batching():
    # Generate test data
    test_events = [
        {
            'user_id': i % 10000,
            'event_type': 'page_view',
            'event_data': f'{{"page": "/product/{i}"}}',
            'created_at': datetime.now(),
        }
        for i in range(1000)
    ]

    print("\\n=== BATCHING PERFORMANCE COMPARISON ===")
    print("Dataset: 1,000 event records\\n")

    # Benchmark 1: Individual inserts
    # print("Approach 1: Individual Inserts")
    # start = time.time()
    # insert_individual(test_events)
    # duration = time.time() - start
    # print(f"Duration: {duration:.2f}s")
    # print(f"Throughput: {len(test_events) / duration:.0f} inserts/sec\\n")
    # Expected: ~10 seconds, 100 inserts/sec

    # Benchmark 2: executemany
    print("Approach 2: Batch executemany()")
    start = time.time()
    insert_batch_executemany(test_events)
    duration = time.time() - start
    print(f"Duration: {duration:.2f}s")
    print(f"Throughput: {len(test_events) / duration:.0f} inserts/sec\\n")
    # Expected: ~2 seconds, 500 inserts/sec

    # Benchmark 3: bulk_insert_mappings
    print("Approach 3: SQLAlchemy bulk_insert_mappings()")
    start = time.time()
    insert_bulk_mappings(test_events)
    duration = time.time() - start
    print(f"Duration: {duration:.2f}s")
    print(f"Throughput: {len(test_events) / duration:.0f} inserts/sec\\n")
    # Expected: ~1 second, 1000 inserts/sec

    # Benchmark 4: COPY command
    print("Approach 4: PostgreSQL COPY command")
    start = time.time()
    insert_copy_command(test_events)
    duration = time.time() - start
    print(f"Duration: {duration:.2f}s")
    print(f"Throughput: {len(test_events) / duration:.0f} inserts/sec\\n")
    # Expected: ~0.1 seconds, 10,000 inserts/sec

    print("=== PERFORMANCE SUMMARY ===")
    print("Individual Inserts:      10.0s  (100 inserts/sec)   - Baseline")
    print("Batch executemany:        2.0s  (500 inserts/sec)   - 5x faster")
    print("bulk_insert_mappings:     1.0s  (1000 inserts/sec)  - 10x faster")
    print("PostgreSQL COPY:          0.1s  (10,000 inserts/sec)- 100x faster")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete database batching strategies from individual inserts to PostgreSQL COPY, with chunking and streaming for large datasets",
        prerequisites: [
          "SQLAlchemy ORM",
          "PostgreSQL COPY protocol",
          "Database transaction management",
          "Python generators",
        ],
        systemPosition:
          "Data ingestion layer for analytics pipelines, ETL jobs, and high-volume event processing systems",
      },
      annotations: [
        {
          id: "batching-db-individual",
          lines: [33, 58],
          action:
            "Demonstrate individual insert anti-pattern with per-record transaction",
          reason:
            "Each insert acquires connection, parses SQL, executes, commits, and returns connection. Fixed overhead of ~10ms per operation means 1000 inserts take 10+ seconds. Transactions prevent parallel execution and generate excessive WAL entries.",
          contextLevel: "system",
          relatedConcepts: ["transaction-overhead", "connection-pooling"],
        },
        {
          id: "batching-db-executemany",
          lines: [60, 86],
          action:
            "Use database executemany for batch insert in single transaction",
          reason:
            "Groups multiple inserts into one transaction, reducing commit overhead from N to 1. Database can optimize batch execution and parse SQL once. Still sends parameters for each row, but eliminates per-row transaction cost. 5x faster than individual inserts.",
          contextLevel: "module",
          relatedConcepts: ["transaction-batching", "sql-optimization"],
        },
        {
          id: "batching-db-bulk-mappings",
          lines: [88, 114],
          action: "Use SQLAlchemy bulk_insert_mappings to bypass ORM overhead",
          reason:
            "Skips full ORM object instantiation and change tracking, generating optimized INSERT with VALUES list: INSERT INTO events VALUES (row1), (row2), (row3). Minimal Python overhead with direct SQL generation. 10x faster than individual, 2x faster than executemany.",
          contextLevel: "system",
          relatedConcepts: ["orm-bypass", "bulk-operations"],
        },
        {
          id: "batching-db-copy",
          lines: [116, 164],
          action:
            "Use PostgreSQL COPY command for maximum bulk insert performance",
          reason:
            "COPY bypasses normal SQL parsing, query planning, and insert execution path. Transfers data in compact CSV format and appends directly to table files with minimal overhead. 100x faster than individual inserts, 10x faster than bulk_insert_mappings. Gold standard for bulk loading.",
          contextLevel: "system",
          relatedConcepts: ["database-internals", "bulk-loading"],
        },
        {
          id: "batching-db-chunking",
          lines: [166, 199],
          action:
            "Process large datasets in fixed-size chunks to prevent memory exhaustion",
          reason:
            "Loading millions of rows into memory at once causes OOM errors. Chunking maintains constant memory usage O(chunk_size) instead of O(N). Also prevents transaction timeout for long-running bulk inserts. Typical chunk size: 500-5000 rows balancing throughput vs. memory.",
          contextLevel: "system",
          relatedConcepts: ["memory-management", "transaction-sizing"],
        },
        {
          id: "batching-db-generator",
          lines: [201, 253],
          action:
            "Use generator for streaming data ingestion with constant memory",
          reason:
            "Generator yields events lazily from source (file, API, database cursor) without loading entire dataset into memory. Combined with chunked batching, enables processing datasets larger than RAM. Essential for log processing, data migration, and real-time ingestion pipelines.",
          contextLevel: "system",
          relatedConcepts: ["streaming-processing", "lazy-evaluation"],
        },
        {
          id: "batching-db-benchmark",
          lines: [255, 305],
          action:
            "Benchmark all approaches to quantify batching performance improvements",
          reason:
            "Empirical measurements demonstrate dramatic performance differences: individual inserts (100/sec), executemany (500/sec), bulk_insert (1000/sec), COPY (10,000/sec). Validates that batching is not premature optimization but essential for bulk data workloads.",
          contextLevel: "system",
          relatedConcepts: ["performance-benchmarking", "empirical-analysis"],
        },
        {
          id: "batching-db-csv-generation",
          lines: [138, 150],
          action: "Generate CSV data in memory for COPY command consumption",
          reason:
            "COPY expects CSV or binary format, not SQL. In-memory CSV generation avoids disk I/O while providing compact data representation. CSV parsing is highly optimized in PostgreSQL, enabling fast data ingestion without SQL overhead.",
          contextLevel: "local",
          relatedConcepts: ["data-serialization", "io-optimization"],
        },
      ],
      highlights: [
        {
          lines: [33, 58],
          label: "Individual insert anti-pattern (baseline)",
          sbvpDomain: "structure",
        },
        {
          lines: [88, 114],
          label: "SQLAlchemy bulk_insert_mappings (10x faster)",
          sbvpDomain: "behavior",
        },
        {
          lines: [116, 164],
          label: "PostgreSQL COPY command (100x faster)",
          sbvpDomain: "behavior",
        },
        {
          lines: [166, 199],
          label: "Chunked batching for memory management",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "batching-jdbc-java",
      language: "java",
      title: "JDBC Batch Updates with Partial Failure Handling",
      description:
        "Java JDBC PreparedStatement batching with rewriteBatchedStatements optimization and error recovery",
      code: `import java.sql.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

// ============================================================
// JDBC Batch Operations for High-Performance Database Writes
// ============================================================
// Performance improvement: 50-100x faster than individual inserts
// Key optimizations:
//   1. PreparedStatement.addBatch() + executeBatch()
//   2. rewriteBatchedStatements=true (MySQL/MariaDB)
//   3. Connection pooling to amortize connection overhead
//   4. Batch size tuning based on memory and network constraints
// ============================================================

public class JdbcBatchingExample {

    // Database configuration
    private static final String JDBC_URL =
        "jdbc:mysql://localhost:3306/analytics" +
        "?rewriteBatchedStatements=true" +  // ✅ CRITICAL OPTIMIZATION
        "&useServerPrepStmts=true" +         // Server-side prepared statements
        "&cachePrepStmts=true";              // Cache prepared statements

    private static final String USERNAME = "user";
    private static final String PASSWORD = "password";

    // Batch size tuning
    private static final int BATCH_SIZE = 1000;

    // ============================================================
    // Event POJO
    // ============================================================
    static class Event {
        private final long userId;
        private final String eventType;
        private final String eventData;
        private final Timestamp createdAt;

        public Event(long userId, String eventType, String eventData, Timestamp createdAt) {
            this.userId = userId;
            this.eventType = eventType;
            this.eventData = eventData;
            this.createdAt = createdAt;
        }

        // Getters omitted for brevity
    }

    // ============================================================
    // APPROACH 1: Individual Inserts (Anti-Pattern)
    // ============================================================
    // ACTION: Insert records one at a time
    // REASON: Simple but extremely inefficient for bulk operations
    // PERFORMANCE: 1000 inserts ≈ 8-12 seconds
    // ============================================================
    public static void insertIndividual(List<Event> events) throws SQLException {
        String sql = "INSERT INTO events (user_id, event_type, event_data, created_at) " +
                     "VALUES (?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            // ⚠️ PROBLEM: Each insert is a separate database round-trip
            for (Event event : events) {
                pstmt.setLong(1, event.userId);
                pstmt.setString(2, event.eventType);
                pstmt.setString(3, event.eventData);
                pstmt.setTimestamp(4, event.createdAt);

                // ⚠️ CRITICAL PROBLEM: executeUpdate() sends SQL immediately
                // - Network round-trip: ~0.5-2ms
                // - Database parsing: ~0.1ms
                // - Execution: ~0.1ms
                // - Total: ~1-3ms per insert
                // - 1000 inserts: 1-3 seconds minimum, often 5-10s with overhead
                pstmt.executeUpdate();
            }
        }
    }

    // ============================================================
    // APPROACH 2: JDBC Batch with addBatch() + executeBatch()
    // ============================================================
    // ACTION: Accumulate inserts and execute as batch
    // REASON: Single network round-trip for multiple inserts
    // PERFORMANCE: 1000 inserts ≈ 0.5-1 second (10-20x faster)
    // ============================================================
    public static void insertBatch(List<Event> events) throws SQLException {
        String sql = "INSERT INTO events (user_id, event_type, event_data, created_at) " +
                     "VALUES (?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            // ACTION: Disable auto-commit for transaction batching
            // REASON: Allows all inserts to execute in single transaction,
            //         reducing commit overhead from N to 1
            conn.setAutoCommit(false);

            for (Event event : events) {
                pstmt.setLong(1, event.userId);
                pstmt.setString(2, event.eventType);
                pstmt.setString(3, event.eventData);
                pstmt.setTimestamp(4, event.createdAt);

                // ACTION: Add statement to batch instead of executing immediately
                // REASON: Accumulates SQL statements in driver's internal buffer
                //         for batch transmission to database
                pstmt.addBatch();
            }

            // ACTION: Execute entire batch with single database round-trip
            // REASON: Driver sends all statements together, database can
            //         optimize execution (e.g., reduce index updates)
            // CRITICAL: With rewriteBatchedStatements=true, MySQL driver
            //           rewrites multiple INSERT statements into single
            //           multi-value INSERT: INSERT INTO ... VALUES (...),(...),(...)
            int[] updateCounts = pstmt.executeBatch();

            // ACTION: Commit transaction after successful batch execution
            // REASON: Single commit for all inserts, reducing WAL overhead
            conn.commit();

            System.out.println("Inserted " + updateCounts.length + " events in batch");
        }
    }

    // ============================================================
    // APPROACH 3: Chunked Batching for Large Datasets
    // ============================================================
    // ACTION: Process large datasets in fixed-size chunks
    // REASON: Prevents memory exhaustion and transaction timeout
    // PERFORMANCE: Maintains high throughput while controlling resources
    // ============================================================
    public static void insertChunked(List<Event> events, int chunkSize) throws SQLException {
        String sql = "INSERT INTO events (user_id, event_type, event_data, created_at) " +
                     "VALUES (?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            conn.setAutoCommit(false);

            int count = 0;
            for (Event event : events) {
                pstmt.setLong(1, event.userId);
                pstmt.setString(2, event.eventType);
                pstmt.setString(3, event.eventData);
                pstmt.setTimestamp(4, event.createdAt);
                pstmt.addBatch();

                count++;

                // ACTION: Execute batch when chunk size reached
                // REASON: Limits memory usage and transaction size
                //         Tuning: 500-5000 rows per chunk
                //         Too small: Don't amortize overhead
                //         Too large: Memory pressure, long transactions
                if (count % chunkSize == 0) {
                    pstmt.executeBatch();
                    conn.commit();
                    System.out.println("Committed chunk: " + count + " events");
                }
            }

            // ACTION: Execute remaining partial batch
            // REASON: Don't lose trailing events that didn't fill chunk
            if (count % chunkSize != 0) {
                pstmt.executeBatch();
                conn.commit();
                System.out.println("Committed final chunk: " + count + " events total");
            }
        }
    }

    // ============================================================
    // APPROACH 4: Batch with Partial Failure Handling
    // ============================================================
    // ACTION: Handle partial failures within batch gracefully
    // REASON: One bad row shouldn't fail entire batch
    // USE CASE: Importing user data with potential constraint violations
    // ============================================================
    public static BatchResult insertBatchWithErrorHandling(List<Event> events)
            throws SQLException {
        String sql = "INSERT INTO events (user_id, event_type, event_data, created_at) " +
                     "VALUES (?, ?, ?, ?)";

        BatchResult result = new BatchResult();

        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            conn.setAutoCommit(false);

            for (int i = 0; i < events.size(); i++) {
                Event event = events.get(i);
                pstmt.setLong(1, event.userId);
                pstmt.setString(2, event.eventType);
                pstmt.setString(3, event.eventData);
                pstmt.setTimestamp(4, event.createdAt);
                pstmt.addBatch();
            }

            try {
                // ACTION: Execute batch and check update counts
                // REASON: Update counts reveal which rows succeeded/failed
                int[] updateCounts = pstmt.executeBatch();

                // ACTION: Analyze update counts for partial failures
                // REASON: JDBC spec defines special values:
                //         ≥ 0: Number of rows affected
                //         SUCCESS_NO_INFO (-2): Success, count unknown
                //         EXECUTE_FAILED (-3): Statement failed
                for (int i = 0; i < updateCounts.length; i++) {
                    if (updateCounts[i] == Statement.EXECUTE_FAILED) {
                        result.addFailure(i, "Execution failed for row " + i);
                    } else {
                        result.incrementSuccess();
                    }
                }

                conn.commit();

            } catch (BatchUpdateException bue) {
                // ACTION: Handle BatchUpdateException for partial failures
                // REASON: Some databases throw exception when any statement
                //         in batch fails, but partial results may still exist
                System.err.println("Batch update exception: " + bue.getMessage());

                // ACTION: Retrieve update counts to identify successful rows
                // REASON: getUpdateCounts() returns results for statements
                //         that executed before the failure
                int[] updateCounts = bue.getUpdateCounts();

                for (int i = 0; i < updateCounts.length; i++) {
                    if (updateCounts[i] >= 0 || updateCounts[i] == Statement.SUCCESS_NO_INFO) {
                        result.incrementSuccess();
                    } else {
                        result.addFailure(i, "Failed at index " + i);
                    }
                }

                // ACTION: Rollback on batch failure
                // REASON: Maintain data consistency, don't partially commit
                conn.rollback();

                // ACTION: Optionally retry failed rows individually
                // REASON: Allows recovering from transient errors or
                //         constraint violations on specific rows
                retryFailedRows(conn, sql, events, result.getFailedIndices());
            }
        }

        return result;
    }

    // ============================================================
    // Helper: Retry Failed Rows Individually
    // ============================================================
    private static void retryFailedRows(
            Connection conn,
            String sql,
            List<Event> events,
            Set<Integer> failedIndices) throws SQLException {

        if (failedIndices.isEmpty()) return;

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (int index : failedIndices) {
                Event event = events.get(index);
                try {
                    pstmt.setLong(1, event.userId);
                    pstmt.setString(2, event.eventType);
                    pstmt.setString(3, event.eventData);
                    pstmt.setTimestamp(4, event.createdAt);
                    pstmt.executeUpdate();
                    System.out.println("Retry succeeded for row " + index);
                } catch (SQLException e) {
                    System.err.println("Retry failed for row " + index + ": " + e.getMessage());
                }
            }
            conn.commit();
        }
    }

    // ============================================================
    // Batch Result Tracking
    // ============================================================
    static class BatchResult {
        private int successCount = 0;
        private final Map<Integer, String> failures = new HashMap<>();

        public void incrementSuccess() {
            successCount++;
        }

        public void addFailure(int index, String reason) {
            failures.put(index, reason);
        }

        public Set<Integer> getFailedIndices() {
            return failures.keySet();
        }

        public void printSummary() {
            System.out.println("\\n=== Batch Result Summary ===");
            System.out.println("Successful inserts: " + successCount);
            System.out.println("Failed inserts: " + failures.size());
            if (!failures.isEmpty()) {
                System.out.println("\\nFailures:");
                failures.forEach((index, reason) ->
                    System.out.println("  Row " + index + ": " + reason)
                );
            }
        }
    }

    // ============================================================
    // Performance Benchmark
    // ============================================================
    public static void benchmark() throws SQLException {
        // Generate test data
        List<Event> events = new ArrayList<>();
        Timestamp now = new Timestamp(System.currentTimeMillis());

        for (int i = 0; i < 10000; i++) {
            events.add(new Event(
                i % 1000,                           // userId
                "page_view",                        // eventType
                "{\\"page\\": \\"/product/" + i + "\\"}", // eventData
                now                                  // createdAt
            ));
        }

        System.out.println("=== JDBC Batching Benchmark ===");
        System.out.println("Dataset: 10,000 event records\\n");

        // Benchmark 1: Individual inserts (commented out - too slow)
        // System.out.println("Approach 1: Individual Inserts");
        // long start = System.nanoTime();
        // insertIndividual(events);
        // long duration = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        // System.out.println("Duration: " + duration + "ms");
        // System.out.println("Throughput: " + (events.size() * 1000 / duration) + " inserts/sec\\n");
        // Expected: ~10,000ms, 1000 inserts/sec

        // Benchmark 2: JDBC batch
        System.out.println("Approach 2: JDBC Batch (rewriteBatchedStatements=true)");
        long start = System.nanoTime();
        insertBatch(events);
        long duration = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        System.out.println("Duration: " + duration + "ms");
        System.out.println("Throughput: " + (events.size() * 1000 / duration) + " inserts/sec\\n");
        // Expected: ~200-500ms, 20,000-50,000 inserts/sec

        // Benchmark 3: Chunked batching
        System.out.println("Approach 3: Chunked Batching (1000 per chunk)");
        start = System.nanoTime();
        insertChunked(events, 1000);
        duration = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        System.out.println("Duration: " + duration + "ms");
        System.out.println("Throughput: " + (events.size() * 1000 / duration) + " inserts/sec\\n");
        // Expected: ~300-600ms, 15,000-30,000 inserts/sec

        System.out.println("=== Performance Summary ===");
        System.out.println("Individual Inserts:      ~10,000ms (1,000 inserts/sec)");
        System.out.println("JDBC Batch:              ~300ms    (30,000 inserts/sec) - 30x faster");
        System.out.println("Chunked Batching:        ~400ms    (25,000 inserts/sec) - 25x faster");
        System.out.println("\\nKey: rewriteBatchedStatements=true is CRITICAL for MySQL/MariaDB");
    }

    public static void main(String[] args) throws SQLException {
        benchmark();
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production JDBC batching implementation with partial failure recovery, chunking, and performance optimization for MySQL/PostgreSQL",
        prerequisites: [
          "JDBC PreparedStatement API",
          "Database transaction management",
          "BatchUpdateException handling",
          "Connection pooling",
        ],
        systemPosition:
          "Data ingestion layer for ETL pipelines, event streaming systems, and bulk data import operations in Java applications",
      },
      annotations: [
        {
          id: "batching-jdbc-rewrite",
          lines: [17, 23],
          action: "Enable rewriteBatchedStatements parameter in JDBC URL",
          reason:
            "CRITICAL optimization for MySQL/MariaDB: driver rewrites multiple INSERT statements into single multi-value INSERT: INSERT INTO events VALUES (row1),(row2),(row3). Without this, executeBatch() sends separate statements, negating most batching benefits. Can improve performance 10-50x.",
          contextLevel: "system",
          relatedConcepts: ["driver-optimization", "sql-rewriting"],
        },
        {
          id: "batching-jdbc-individual",
          lines: [52, 80],
          action:
            "Demonstrate individual insert anti-pattern with immediate execution",
          reason:
            "Each executeUpdate() call is a separate network round-trip to database (~0.5-2ms), plus parsing and execution overhead. 1000 inserts = 1000 round-trips = 1-3 seconds minimum, often 5-10s with network variability. Foundation for understanding batching improvements.",
          contextLevel: "system",
          relatedConcepts: ["network-latency", "round-trip-time"],
        },
        {
          id: "batching-jdbc-addbatch",
          lines: [82, 131],
          action:
            "Use addBatch() to accumulate statements then executeBatch() for bulk execution",
          reason:
            "addBatch() buffers SQL in driver memory without network transmission. executeBatch() sends all statements in one round-trip, and with rewriteBatchedStatements=true, MySQL combines them into single INSERT. Reduces 1000 round-trips to 1, achieving 10-50x speedup.",
          contextLevel: "module",
          relatedConcepts: ["batching-api", "network-optimization"],
        },
        {
          id: "batching-jdbc-autocommit",
          lines: [97, 100],
          action: "Disable auto-commit to batch transaction commits",
          reason:
            "Auto-commit causes database to commit after every statement, triggering expensive WAL write and fsync operations. Disabling auto-commit allows batching all inserts into single transaction, paying commit cost once instead of N times. Essential for batch performance.",
          contextLevel: "system",
          relatedConcepts: ["transaction-batching", "write-ahead-log"],
        },
        {
          id: "batching-jdbc-chunking",
          lines: [133, 182],
          action:
            "Process large datasets in fixed-size chunks to control memory and transaction size",
          reason:
            "Loading millions of rows into one batch exhausts JVM heap and creates multi-GB transactions that can timeout or cause database replication lag. Chunking limits memory to O(chunk_size) and keeps transactions short. Typical chunk size: 500-5000 rows balancing throughput vs. resources.",
          contextLevel: "system",
          relatedConcepts: ["memory-management", "transaction-sizing"],
        },
        {
          id: "batching-jdbc-partial-failure",
          lines: [184, 262],
          action:
            "Handle BatchUpdateException and analyze update counts for partial failure recovery",
          reason:
            "In production, constraint violations or transient errors can cause some rows to fail. BatchUpdateException provides update counts showing which statements succeeded before failure. Enables retry logic for failed rows without re-processing successful ones, critical for data consistency.",
          contextLevel: "system",
          relatedConcepts: ["error-recovery", "partial-failure"],
        },
        {
          id: "batching-jdbc-update-counts",
          lines: [218, 234],
          action:
            "Parse update count array to identify which statements succeeded or failed",
          reason:
            "JDBC spec defines special values: ≥0 (rows affected), SUCCESS_NO_INFO (-2, success but count unknown), EXECUTE_FAILED (-3, statement failed). Analyzing these codes enables precise failure tracking and selective retry of only failed rows.",
          contextLevel: "local",
          relatedConcepts: ["jdbc-specification", "error-codes"],
        },
        {
          id: "batching-jdbc-retry",
          lines: [264, 289],
          action:
            "Retry failed rows individually to recover from transient errors",
          reason:
            "Batch failures can be transient (network blip, deadlock) or persistent (constraint violation). Individual retry isolates persistent failures without blocking entire batch. Allows successful data ingestion with detailed failure reporting for manual intervention on problem rows.",
          contextLevel: "system",
          relatedConcepts: ["retry-logic", "graceful-degradation"],
        },
      ],
      highlights: [
        {
          lines: [17, 23],
          label: "rewriteBatchedStatements configuration (CRITICAL)",
          sbvpDomain: "structure",
        },
        {
          lines: [82, 131],
          label: "JDBC batching with addBatch/executeBatch",
          sbvpDomain: "behavior",
        },
        {
          lines: [184, 262],
          label: "Partial failure handling with BatchUpdateException",
          sbvpDomain: "philosophy",
        },
        {
          lines: [334, 366],
          label: "Performance benchmark: 30x improvement",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Database bulk insert/update operations",
      "API batch endpoints (e.g., Stripe batch operations)",
      "Message queue batching (e.g., Kafka producer batching)",
      "Log ingestion pipelines",
      "ETL data transformation layers",
      "Analytics event collection",
      "GraphQL DataLoader for N+1 query elimination",
      "Bulk email/notification sending",
    ],
    interactsWith: [
      "write-back",
      "connection-pooling",
      "rate-limiting",
      "retry",
      "circuit-breaker",
    ],
    architecturalBoundaries: [
      "Request batching layer (collects operations)",
      "Execution layer (processes batches)",
      "Storage layer (database, message queue, API)",
      "Result distribution layer (maps results to callers)",
    ],
  },

  implementations: [
    {
      id: "dataloader",
      name: "DataLoader",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Facebook's batching and caching library for GraphQL. Automatically batches requests within event loop tick, deduplicates identical requests, and caches results. Essential for eliminating N+1 query problem in GraphQL resolvers. Per-request scoping prevents cache leakage between users.",
      links: {
        github: "https://github.com/graphql/dataloader",
        npm: "https://www.npmjs.com/package/dataloader",
      },
      codeSnippet: `const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (userIds) => {
  const users = await db.query(
    'SELECT * FROM users WHERE id = ANY($1)',
    [userIds]
  );
  return userIds.map(id => users.find(u => u.id === id));
});

// Usage in GraphQL resolver
const user = await userLoader.load(userId); // Batched automatically`,
    },
    {
      id: "jdbc-batching",
      name: "JDBC Batch Updates",
      type: "platform",
      languages: ["java"],
      description:
        "Java JDBC native batching with PreparedStatement.addBatch() and executeBatch(). Critical optimization: rewriteBatchedStatements=true for MySQL/MariaDB rewrites multiple INSERT statements into single multi-value INSERT. Supports partial failure handling via BatchUpdateException.",
      links: {
        docs: "https://docs.oracle.com/javase/tutorial/jdbc/basics/batch.html",
      },
      codeSnippet: `PreparedStatement pstmt = conn.prepareStatement(
  "INSERT INTO events (user_id, event_type) VALUES (?, ?)"
);

for (Event event : events) {
  pstmt.setLong(1, event.getUserId());
  pstmt.setString(2, event.getEventType());
  pstmt.addBatch();
}

int[] updateCounts = pstmt.executeBatch();
conn.commit();`,
    },
    {
      id: "sqlalchemy-bulk",
      name: "SQLAlchemy Bulk Operations",
      type: "library",
      languages: ["python"],
      description:
        "Python ORM with optimized bulk_insert_mappings() and bulk_update_mappings() that bypass full ORM overhead. Generates efficient multi-value INSERT statements. Supports chunked batching for large datasets. Can integrate with PostgreSQL COPY for maximum performance.",
      links: {
        docs: "https://docs.sqlalchemy.org/en/14/orm/session_api.html#sqlalchemy.orm.Session.bulk_insert_mappings",
        github: "https://github.com/sqlalchemy/sqlalchemy",
      },
      codeSnippet: `session.bulk_insert_mappings(
  Event,
  [
    {'user_id': 1, 'event_type': 'click'},
    {'user_id': 2, 'event_type': 'view'},
    # ... thousands more
  ]
)
session.commit()`,
    },
    {
      id: "elasticsearch-bulk",
      name: "Elasticsearch Bulk API",
      type: "platform",
      languages: ["any"],
      description:
        "Elasticsearch native bulk API for indexing, updating, and deleting documents in batches. Supports partial failures with detailed per-operation results. Recommended batch size: 5-15MB or 1000-5000 documents. Essential for high-throughput indexing pipelines.",
      links: {
        docs: "https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html",
      },
      codeSnippet: `POST /_bulk
{ "index": { "_index": "events", "_id": "1" } }
{ "user_id": 123, "event_type": "click" }
{ "index": { "_index": "events", "_id": "2" } }
{ "user_id": 456, "event_type": "view" }`,
    },
    {
      id: "kafka-batching",
      name: "Kafka Producer Batching",
      type: "platform",
      languages: ["java", "python", "go"],
      description:
        "Apache Kafka producer automatically batches messages per partition. Configurable batch.size (bytes) and linger.ms (time). Compression applied at batch level for efficiency. Tuning: batch.size=16KB-1MB, linger.ms=5-100ms balances latency vs. throughput.",
      links: {
        docs: "https://kafka.apache.org/documentation/#producerconfigs",
      },
      codeSnippet: `Properties props = new Properties();
props.put("batch.size", 16384);        // 16KB batches
props.put("linger.ms", 10);            // Wait 10ms to fill batch
props.put("compression.type", "lz4");  // Compress batches

KafkaProducer<String, String> producer = new KafkaProducer<>(props);`,
    },
    {
      id: "redis-pipelining",
      name: "Redis Pipelining",
      type: "platform",
      languages: ["any"],
      description:
        "Redis pipelining sends multiple commands without waiting for individual responses, then reads all responses together. Reduces network round-trips from N to 1. Different from transactions: commands execute independently, not atomically. Can achieve 10-100x throughput improvement.",
      links: {
        docs: "https://redis.io/docs/manual/pipelining/",
      },
      codeSnippet: `const pipeline = redis.pipeline();

pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.incr('counter');

const results = await pipeline.exec(); // Single round-trip`,
    },
    {
      id: "aws-sqs-batch",
      name: "AWS SQS Batch Operations",
      type: "service",
      languages: ["any"],
      description:
        "AWS SQS SendMessageBatch API sends up to 10 messages in single request. ReceiveMessage retrieves up to 10 messages at once. DeleteMessageBatch removes processed messages in bulk. Reduces API calls 10x and optimizes against SQS rate limits.",
      links: {
        docs: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessageBatch.html",
      },
      codeSnippet: `const params = {
  QueueUrl: queueUrl,
  Entries: [
    { Id: '1', MessageBody: 'Message 1' },
    { Id: '2', MessageBody: 'Message 2' },
    // ... up to 10 messages
  ]
};

await sqs.sendMessageBatch(params).promise();`,
    },
    {
      id: "grpc-streaming",
      name: "gRPC Streaming",
      type: "platform",
      languages: ["any"],
      description:
        "gRPC bidirectional streaming batches messages over persistent HTTP/2 connection. Client streams multiple requests, server streams multiple responses. Eliminates per-request connection overhead. Ideal for real-time data pipelines and log ingestion.",
      links: {
        docs: "https://grpc.io/docs/what-is-grpc/core-concepts/#bidirectional-streaming-rpc",
      },
      codeSnippet: `// Server-side streaming RPC
rpc LogEvents(stream LogEvent) returns (stream LogResponse) {}

// Client usage
const stream = client.logEvents();
events.forEach(event => stream.write(event));
stream.on('data', response => console.log(response));`,
    },
  ],

  usedInSystems: [
    {
      systemId: "facebook-graphql",
      systemName: "Facebook GraphQL with DataLoader",
      howUsed:
        "Facebook developed DataLoader to solve the N+1 query problem in their GraphQL API serving billions of requests daily. When rendering a News Feed with 50 posts, each post requires fetching author data, like counts, and comment metadata. Without batching, this results in 1 feed query + 50 author queries + 50 like count queries + 50 comment queries = 151 database queries. DataLoader automatically batches all requests within a single event loop tick, reducing 151 queries to 4 batched queries: SELECT * FROM posts, SELECT * FROM users WHERE id IN (...), SELECT * FROM likes WHERE post_id IN (...), SELECT * FROM comments WHERE post_id IN (...). The batching is completely transparent to resolver implementations—developers write code as if fetching individual items, but DataLoader coordinates batching behind the scenes. Pattern composition: Batching + Caching (deduplication within request) + Request Coalescing (combine identical IDs). Rationale: GraphQL's declarative nature and nested resolvers naturally create N+1 problems; batching is essential for acceptable performance. Impact: Reduced average GraphQL query latency from 500ms to 50ms; eliminated 90% of database queries; enabled scaling to 1B+ GraphQL requests per day without proportional database growth.",
      source: "https://github.com/graphql/dataloader",
    },
    {
      systemId: "elasticsearch-indexing",
      systemName: "Elasticsearch Bulk Indexing",
      howUsed:
        "Elasticsearch's Bulk API is the primary method for high-throughput document indexing, used by systems like GitHub search, Uber's logging infrastructure, and Netflix's analytics. Instead of individual index requests (POST /index/_doc), clients send batches of 1000-5000 documents in a single bulk request, reducing HTTP overhead from megabytes to kilobytes. Each operation in the batch can succeed or fail independently—Elasticsearch returns detailed results for each document, enabling partial failure recovery. The pattern handles indexing 100k-1M documents per second on medium clusters. Pattern composition: Batching + Partial Failure Handling + Retry (for failed documents) + Backpressure (bulk queue monitoring). Rationale: Full-text indexing is CPU-intensive; batching amortizes HTTP overhead and allows Elasticsearch to optimize index segment creation. Recommended batch size: 5-15MB or 1000-5000 docs, tuned based on document size and cluster capacity. Impact: Uber indexes 100TB+ of logs daily using bulk API; GitHub indexes millions of code commits per day; Netflix processes billions of analytics events. Without batching, these workloads would require 10-100x more Elasticsearch nodes.",
      source:
        "https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html",
    },
    {
      systemId: "stripe-batch-api",
      systemName: "Stripe API Batching",
      howUsed:
        "Stripe provides batch endpoints for high-volume operations like invoice generation, subscription updates, and payment processing. During monthly billing cycles, SaaS companies need to generate thousands of invoices simultaneously. Individual API calls (POST /v1/invoices) are rate-limited to 100/second per account. Stripe's batch API allows sending 100 invoice creation requests in one call, effectively multiplying throughput by 100x while staying under rate limits. The pattern is critical for platforms like Shopify, which processes millions of merchant transactions. Each batch operation returns individual results, including success/failure status and Stripe object IDs. Pattern composition: Batching + Rate Limiting (optimize against API quotas) + Idempotency (retry failed operations safely). Rationale: Payment processing has strict rate limits and network costs; batching is only way to handle peak loads during billing cycles. Impact: Enabled SaaS platforms to process monthly billing for millions of users within 24-hour window; reduced Stripe API costs by 90% for bulk operations; prevented rate limit errors during peak billing periods.",
      source: "https://stripe.com/docs/api/batch",
    },
    {
      systemId: "cloudwatch-logs",
      systemName: "AWS CloudWatch Logs Batching",
      howUsed:
        "AWS CloudWatch Logs ingests trillions of log events from EC2, Lambda, ECS, and other services. The PutLogEvents API accepts batches of up to 10,000 log events or 1MB per request. Without batching, Lambda functions generating 1000 log lines would make 1000 API calls, hitting rate limits and incurring excessive API costs ($0.50 per GB ingested + per-request charges). CloudWatch client SDKs automatically batch logs with configurable flush intervals (default: 5 seconds or 1MB). Pattern composition: Batching + Time-based Flush (prevent stale logs) + Size-based Flush (respect API limits) + Compression (gzip batches). Rationale: Log ingestion is high-frequency, low-value data; batching reduces API costs by 100x and prevents rate limit throttling. Tuning: batch size 500-5000 events, flush interval 1-10 seconds based on latency requirements. Impact: Reduced CloudWatch costs for high-traffic applications from $10,000/month to $100/month; eliminated rate limit errors during traffic spikes; enabled ingesting 1M+ events/second from distributed microservices.",
      source:
        "https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/cloudwatch_limits_cwl.html",
    },
    {
      systemId: "kafka-producers",
      systemName: "Apache Kafka Producer Batching",
      howUsed:
        "Kafka producers batch messages per partition to maximize throughput. LinkedIn processes 7+ trillion messages per day using Kafka batching. Producers accumulate messages in memory until batch.size (bytes) or linger.ms (time) threshold is met, then send compressed batch to brokers. Configuration example: batch.size=16KB, linger.ms=10ms, compression=lz4. A producer sending 1000 messages/second with 1KB each would create ~10 batches/second instead of 1000 individual sends, reducing network packets by 99%. Batches are compressed before network transmission, achieving 3-5x size reduction for JSON/text data. Pattern composition: Batching + Compression (reduce network bandwidth) + Partitioning (batch per partition) + Asynchronous Send (non-blocking batch accumulation). Rationale: Kafka's design assumes batching—brokers are optimized for sequential writes of large batches, not random individual writes. Impact: LinkedIn handles 7 trillion messages/day with Kafka batching; Uber processes 1 trillion+ messages/day; Netflix ingests terabytes of streaming analytics. Without batching, throughput would drop 10-100x and require proportionally more brokers.",
      source: "https://kafka.apache.org/documentation/#producerconfigs",
    },
  ],

  philosophy: {
    coreProblem:
      "Individual operations incur fixed overhead costs (network round-trips, connection setup, protocol headers) that dominate performance at scale, making high-throughput systems infeasible",
    designPrinciple:
      "Amortize fixed per-operation costs across multiple operations by grouping them into batches, transforming O(N) overhead into O(1) plus linear processing",
    historicalContext:
      "Batching has been a fundamental optimization since early mainframe systems (punch card batching). Modern resurgence driven by distributed systems, GraphQL N+1 problems, and cloud API rate limits.",
    alternativesRejected: [
      "Individual operations - simple but unacceptably slow for bulk workloads",
      "Asynchronous individual ops - reduces latency perception but doesn't improve throughput",
      "Caching alone - helps with reads but doesn't address write-heavy or unique-request workloads",
    ],
    mentalModel:
      "Like a delivery truck that waits to fill up with packages before making a trip, rather than driving to each destination immediately for every package. The overhead of starting the truck and driving is paid once per batch, not per package.",
  },

  visualization: {
    staticDiagram: `graph TB
    C1[Client 1: Request A] --> BC[Batch Coordinator]
    C2[Client 2: Request B] --> BC
    C3[Client 3: Request C] --> BC
    BC --> Buffer[Buffer: A, B, C]
    Buffer --> FT{Flush Trigger?}
    FT -->|Time or Size| Exec[Executor]
    Exec --> DB[(Database/API)]
    DB --> Exec
    Exec --> BC
    BC --> C1
    BC --> C2
    BC --> C3`,
    realWorldAnalogy:
      "Batching is like a rideshare service. Instead of sending a separate car for each person going downtown (individual requests), the service waits a few minutes to accumulate multiple passengers going the same direction, then sends one vehicle (batched request). The per-trip overhead (driver time, fuel, vehicle wear) is amortized across all passengers.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "During Black Friday, processing 100,000 order confirmations. Individual email API calls would take hours and hit rate limits. Batching sends 100 emails per API call, completing in minutes.",
        patternRole:
          "Reduces email API calls from 100,000 to 1,000, staying under rate limits and reducing latency from hours to minutes",
        companies: ["Shopify", "Amazon", "Stripe"],
      },
      {
        domain: "Analytics",
        scenario:
          "Mobile app sends user interaction events to analytics backend. Batching collects events locally and flushes every 30 seconds or 100 events, reducing battery drain and network usage.",
        patternRole:
          "Minimizes mobile network requests, reducing battery consumption by 80% and data usage by 90% via compression",
        companies: ["Google Analytics", "Mixpanel", "Amplitude"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "batching",
    "database",
    "network-optimization",
    "throughput",
  ],
  difficulty: "intermediate",
};
