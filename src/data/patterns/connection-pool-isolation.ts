import type { Pattern } from "../schema";

export const connectionPoolIsolation: Pattern = {
  id: "connection-pool-isolation",
  slug: "connection-pool-isolation",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🧱 Bulkhead → 🔗 Connection Pool Isolation",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Bulkhead",
    level: 4,
  },

  concept: {
    name: "Connection Pool Isolation",
    emoji: "🔗",
    tagline: "Separate DB pools",
    definition:
      "Connection Pool Isolation creates separate connection pools for different types of workloads or tenants, preventing one type of work from exhausting database connections and starving others. Think of it like having separate checkout lanes for express shoppers versus regular carts—slow shoppers in the regular lane cannot block quick purchases. In a typical application, a shared pool of 100 database connections serves all requests. If an analytics query holds 90 connections for minutes, only 10 remain for critical user transactions, causing timeouts and failures. Connection Pool Isolation solves this by creating dedicated pools: 80 connections for transactional queries (user operations), 15 for analytics (long-running reports), and 5 for background jobs (data exports). This ensures user queries always have available connections, even if analytics workloads monopolize their own pool. The pattern extends to multi-tenant systems where each tenant gets an isolated pool, preventing noisy neighbors from causing cross-tenant failures.",
    problemSolved:
      "Shared connection pools create resource contention where a single slow or high-volume workload can exhaust all database connections, blocking unrelated operations. Long-running analytics queries, batch processing, or runaway queries can consume all 100 connections in a pool, leaving zero for critical user transactions. This causes cascading failures as user requests timeout waiting for connections, even though the database itself is healthy and has capacity. Connection Pool Isolation solves this by partitioning connection capacity across workload types, enforcing resource allocation policies. Even if analytics queries consume all 15 connections in their pool, the 80-connection transactional pool remains untouched. This is critical for applications mixing OLTP (fast, frequent) and OLAP (slow, infrequent) workloads, multi-tenant SaaS platforms, and systems with background processing that must not impact user-facing operations.",
    tradeoffs: {
      pros: [
        "Prevents connection starvation by isolating critical workloads from resource-intensive or slow operations",
        "Enables predictable performance for high-priority transactions regardless of background workload activity",
        "Improves fault isolation where failures in one workload type do not cascade to unrelated operations",
        "Allows fine-grained resource allocation and priority enforcement aligned with business criticality",
      ],
      cons: [
        "Reduces total connection utilization efficiency as idle connections in one pool cannot help busy pools",
        "Requires careful capacity planning to size each pool appropriately, risking under or over-provisioning",
        "Increases operational complexity with multiple pools to monitor, tune, and troubleshoot independently",
        "May require application code changes to route different workload types to their designated pools",
      ],
    },
    relatedPatterns: [
      "bulkhead",
      "circuit-breaker",
      "rate-limiting",
      "thread-pool-isolation",
    ],
  },

  structure: {
    participants: [
      {
        name: "Connection Pool Manager",
        role: "Pool Orchestrator",
        responsibilities: [
          "Create and manage separate connection pools for each workload type or tenant",
          "Route database queries to appropriate pool based on workload classification",
          "Monitor pool utilization and enforce capacity limits per pool",
          "Handle connection lifecycle (creation, validation, recycling) per pool",
        ],
      },
      {
        name: "Workload-Specific Pool",
        role: "Isolated Connection Resource",
        responsibilities: [
          "Maintain dedicated pool of database connections for specific workload (OLTP, OLAP, background)",
          "Queue connection requests when pool is saturated",
          "Enforce pool size limits and idle connection timeouts",
          "Provide connections to queries matching its workload classification",
        ],
      },
      {
        name: "Database Connection",
        role: "Physical Database Link",
        responsibilities: [
          "Establish and maintain TCP connection to database server",
          "Execute SQL queries and return results",
          "Manage transaction state (begin, commit, rollback)",
          "Perform connection health checks (keep-alive, reconnect on failure)",
        ],
      },
      {
        name: "Application Query Router",
        role: "Workload Classifier",
        responsibilities: [
          "Classify incoming queries by workload type (transactional, analytics, background)",
          "Route classified query to appropriate connection pool",
          "Handle connection acquisition timeout and retry logic",
          "Implement fallback behavior when pool is exhausted",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant Router as Query Router
    participant TxnPool as Transactional Pool<br/>(80 connections)
    participant AnalyticsPool as Analytics Pool<br/>(15 connections)
    participant BgPool as Background Pool<br/>(5 connections)
    participant DB as PostgreSQL Database

    Note over Router: Classify workload type<br/>and route to pool

    App->>Router: User checkout query (OLTP)
    Router->>TxnPool: Acquire connection
    TxnPool->>DB: Execute transaction
    DB-->>TxnPool: Result
    TxnPool->>TxnPool: Release connection
    TxnPool-->>App: Success

    par Analytics workload isolated
        App->>Router: Report generation (OLAP)
        Router->>AnalyticsPool: Acquire connection
        Note over AnalyticsPool: Long-running query<br/>holds connection for 5 minutes
        AnalyticsPool->>DB: Execute analytics query
        Note over DB: Complex aggregation<br/>across millions of rows
    end

    Note over AnalyticsPool: All 15 analytics<br/>connections in use

    App->>Router: Another report (OLAP)
    Router->>AnalyticsPool: Acquire connection
    Note over AnalyticsPool: Queue request<br/>(all connections busy)

    App->>Router: User query (OLTP)
    Router->>TxnPool: Acquire connection
    Note over TxnPool: ✓ 80 connections available<br/>Analytics saturation isolated
    TxnPool->>DB: Execute transaction
    DB-->>TxnPool: Result (fast)
    TxnPool-->>App: Success

    Note over TxnPool,AnalyticsPool: Transactional workload<br/>unaffected by analytics load`,
    flow: [
      {
        step: 1,
        actor: "Application Query Router",
        action: "Classify workload type",
        description:
          "Application analyzes incoming query to determine workload classification: transactional (user-facing OLTP), analytics (reporting/OLAP), or background (batch jobs, exports). Classification can be based on query pattern, endpoint, user role, or explicit tagging.",
      },
      {
        step: 2,
        actor: "Application Query Router",
        action: "Route to appropriate pool",
        description:
          "Router directs query to corresponding connection pool based on classification. Transactional queries go to OLTP pool, analytics queries to OLAP pool, background jobs to batch pool.",
      },
      {
        step: 3,
        actor: "Workload-Specific Pool",
        action: "Check connection availability",
        description:
          "Pool checks if idle connections are available. If yes, connection is immediately provided. If all connections are in use, request is queued (up to configured queue depth and timeout).",
      },
      {
        step: 4,
        actor: "Workload-Specific Pool",
        action: "Provide database connection",
        description:
          "Pool provides existing idle connection or creates new connection if pool is below max size. Connection is marked as in-use and associated with requesting query.",
      },
      {
        step: 5,
        actor: "Database Connection",
        action: "Execute query on database",
        description:
          "Connection transmits SQL query to database server, waits for execution, and retrieves results. For transactions, connection manages BEGIN/COMMIT/ROLLBACK operations maintaining transaction isolation.",
      },
      {
        step: 6,
        actor: "Workload-Specific Pool",
        action: "Release connection back to pool",
        description:
          "After query completes, connection is released back to pool's available set. Connection may be validated (test query), reset (clear session state), or recycled if idle too long. Released connection becomes available for next queued request.",
      },
      {
        step: 7,
        actor: "Connection Pool Manager",
        action: "Handle pool exhaustion (optional)",
        description:
          "If a pool is fully saturated and queue timeout expires, pool rejects connection request. Application can implement fallback (use cached data, degrade functionality, retry later) or fail request with appropriate error.",
      },
    ],
    invariants: [
      "Each workload type MUST have its own dedicated connection pool with independently configured size and idle timeout",
      "Connection pools MUST NOT share connections across workload types—connections are bound to specific pools at creation",
      "Total connections across all pools MUST stay within database server's max_connections limit to prevent connection exhaustion at database level",
      "When a pool reaches max capacity, new connection requests MUST be queued with timeout or rejected to prevent unbounded waiting",
      "Connections MUST be validated before reuse (test query or PING) to detect stale connections from network interruptions or database restarts",
      "Pool sizes SHOULD be tuned based on workload concurrency and latency—fast workloads get larger pools, slow workloads get smaller pools to limit resource consumption",
      "Failure or saturation in one pool (analytics queries consuming all connections) MUST NOT prevent other pools (transactional) from serving requests",
    ],
  },

  codeExamples: [
    {
      id: "connection-pool-isolation-ts-basic",
      language: "typescript",
      title: "Connection Pool Isolation with Workload Segregation",
      description:
        "Demonstrates isolated connection pools for transactional, analytics, and background workloads to prevent resource starvation",
      code: `type WorkloadType = 'transactional' | 'analytics' | 'background';

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
}

interface Connection {
  id: string;
  inUse: boolean;
  lastUsed: number;
  execute: (query: string) => Promise<any>;
}

class ConnectionPool {
  private connections: Connection[] = [];
  private availableConnections: Connection[] = [];
  private waitQueue: Array<(conn: Connection) => void> = [];
  private poolName: string;

  constructor(
    poolName: string,
    private config: PoolConfig
  ) {
    this.poolName = poolName;
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.config.minConnections; i++) {
      const conn = this.createConnection();
      this.connections.push(conn);
      this.availableConnections.push(conn);
    }
  }

  private createConnection(): Connection {
    const connId = \`\${this.poolName}-\${Math.random().toString(36).substr(2, 9)}\`;
    return {
      id: connId,
      inUse: false,
      lastUsed: Date.now(),
      execute: async (query: string) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return { result: 'success', query, connId };
      }
    };
  }

  async acquire(): Promise<Connection> {
    if (this.availableConnections.length > 0) {
      const conn = this.availableConnections.pop()!;
      conn.inUse = true;
      conn.lastUsed = Date.now();
      return conn;
    }

    if (this.connections.length < this.config.maxConnections) {
      const conn = this.createConnection();
      conn.inUse = true;
      this.connections.push(conn);
      return conn;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.waitQueue.indexOf(resolve);
        if (index > -1) this.waitQueue.splice(index, 1);
        reject(new Error(\`[\${this.poolName}] Connection acquire timeout\`));
      }, this.config.acquireTimeout);

      this.waitQueue.push((conn: Connection) => {
        clearTimeout(timeoutId);
        resolve(conn);
      });
    });
  }

  release(conn: Connection): void {
    conn.inUse = false;
    conn.lastUsed = Date.now();

    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      conn.inUse = true;
      waiter(conn);
    } else {
      this.availableConnections.push(conn);
    }
  }

  getStats() {
    return {
      poolName: this.poolName,
      total: this.connections.length,
      available: this.availableConnections.length,
      inUse: this.connections.filter(c => c.inUse).length,
      waiting: this.waitQueue.length,
    };
  }
}

class IsolatedPoolManager {
  private pools: Map<WorkloadType, ConnectionPool> = new Map();

  constructor() {
    this.pools.set('transactional', new ConnectionPool('txn-pool', {
      maxConnections: 80,
      minConnections: 10,
      acquireTimeout: 5000,
      idleTimeout: 300000,
    }));

    this.pools.set('analytics', new ConnectionPool('analytics-pool', {
      maxConnections: 15,
      minConnections: 2,
      acquireTimeout: 10000,
      idleTimeout: 600000,
    }));

    this.pools.set('background', new ConnectionPool('background-pool', {
      maxConnections: 5,
      minConnections: 1,
      acquireTimeout: 15000,
      idleTimeout: 300000,
    }));
  }

  async executeQuery(workloadType: WorkloadType, query: string): Promise<any> {
    const pool = this.pools.get(workloadType);
    if (!pool) {
      throw new Error(\`No pool configured for workload type: \${workloadType}\`);
    }

    const conn = await pool.acquire();
    try {
      const result = await conn.execute(query);
      return result;
    } finally {
      pool.release(conn);
    }
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    this.pools.forEach((pool, type) => {
      stats[type] = pool.getStats();
    });
    return stats;
  }
}

async function demonstrateIsolation() {
  const manager = new IsolatedPoolManager();

  const transactionalQueries = Array.from({ length: 50 }, (_, i) =>
    manager.executeQuery('transactional', \`SELECT * FROM users WHERE id = \${i}\`)
  );

  const analyticsQueries = Array.from({ length: 20 }, (_, i) =>
    manager.executeQuery('analytics', \`SELECT COUNT(*) FROM orders WHERE date > NOW() - INTERVAL '\${i}' DAY\`)
  );

  const backgroundJobs = Array.from({ length: 5 }, (_, i) =>
    manager.executeQuery('background', \`INSERT INTO audit_log SELECT * FROM events WHERE day = \${i}\`)
  );

  console.log('Initial stats:', manager.getAllStats());

  await Promise.allSettled([
    ...transactionalQueries,
    ...analyticsQueries,
    ...backgroundJobs
  ]);

  console.log('Final stats:', manager.getAllStats());
  console.log('Isolation prevents analytics workload from starving transactional queries');
}

demonstrateIsolation().catch(console.error);`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete connection pool isolation system with separate pools for different workload types (transactional, analytics, background)",
        prerequisites: [
          "TypeScript async/await",
          "Promise handling",
          "Queue data structures",
          "Resource pool pattern",
        ],
        systemPosition:
          "Database access layer between application services and database, typically in data access or repository layer",
      },
      annotations: [
        {
          id: "cpi-workload-types",
          lines: [1, 1],
          action: "Define three workload types for pool segregation",
          reason:
            "Different workloads have different resource needs - transactional queries are fast and frequent, analytics are slow and infrequent, background can be delayed",
          contextLevel: "module",
          relatedConcepts: ["bulkhead", "resource-isolation"],
        },
        {
          id: "cpi-pool-config",
          lines: [3, 8],
          action: "Configure pool boundaries and timeouts",
          reason:
            "Each pool needs max/min connection limits to prevent starvation and ensure minimum availability, plus timeouts to fail fast",
          contextLevel: "local",
          relatedConcepts: ["resource-limits", "timeout"],
        },
        {
          id: "cpi-connection-interface",
          lines: [10, 15],
          action: "Model a database connection with usage tracking",
          reason:
            "Tracking inUse and lastUsed enables connection reuse, idle connection cleanup, and prevents connection leaks",
          contextLevel: "local",
        },
        {
          id: "cpi-pool-init",
          lines: [27, 34],
          action: "Pre-create minimum connections on pool initialization",
          reason:
            "Warming up the pool avoids cold-start latency for first requests and ensures baseline capacity is always available",
          contextLevel: "module",
          relatedConcepts: ["connection-pooling", "warm-up"],
        },
        {
          id: "cpi-acquire-fast-path",
          lines: [50, 56],
          action: "Return available connection immediately if one exists",
          reason:
            "Fast path optimization - most requests should hit this case when the system is healthy, avoiding queue wait time",
          contextLevel: "local",
        },
        {
          id: "cpi-acquire-grow",
          lines: [58, 63],
          action: "Create new connection if pool has capacity to grow",
          reason:
            "Dynamic pool growth handles traffic spikes within configured max limit, balancing resource usage with demand",
          contextLevel: "module",
          relatedConcepts: ["elastic-scaling", "resource-limits"],
        },
        {
          id: "cpi-acquire-queue",
          lines: [65, 77],
          action: "Queue request with timeout when pool is exhausted",
          reason:
            "When all connections are busy, queue the request rather than failing immediately, but timeout to prevent indefinite blocking",
          contextLevel: "module",
          relatedConcepts: ["backpressure", "timeout", "circuit-breaker"],
        },
        {
          id: "cpi-release-reuse",
          lines: [80, 91],
          action: "Release connection back to pool or hand to waiting request",
          reason:
            "Connection reuse is critical for performance - immediately serve waiting requests if any, otherwise return to available pool",
          contextLevel: "module",
          relatedConcepts: ["object-pooling", "resource-reuse"],
        },
        {
          id: "cpi-pool-stats",
          lines: [93, 101],
          action: "Expose pool metrics for monitoring",
          reason:
            "Observability into pool utilization helps detect resource exhaustion, tune pool sizes, and identify workload issues",
          contextLevel: "local",
          relatedConcepts: ["observability", "metrics"],
        },
        {
          id: "cpi-isolated-pools",
          lines: [107, 126],
          action: "Create three isolated pools with different capacities",
          reason:
            "Isolation ensures transactional queries get 80 connections even if analytics consumes all 15 of its pool - prevents noisy neighbor problem",
          contextLevel: "system",
          relatedConcepts: ["bulkhead", "fault-isolation"],
        },
        {
          id: "cpi-workload-routing",
          lines: [128, 141],
          action: "Route queries to appropriate pool based on workload type",
          reason:
            "Application must classify workloads and route to correct pool - this is the key isolation mechanism that prevents cross-workload contention",
          contextLevel: "module",
          relatedConcepts: ["routing", "workload-classification"],
        },
        {
          id: "cpi-demo-workloads",
          lines: [153, 163],
          action: "Simulate concurrent workloads across all three pools",
          reason:
            "Demonstrates that heavy analytics load (20 queries) doesn't block transactional queries (50 queries) because they use separate pools",
          contextLevel: "module",
          relatedConcepts: ["fault-isolation", "resource-contention"],
        },
      ],
      highlights: [
        {
          lines: [1, 1],
          label: "Workload type definition - key to isolation strategy",
          sbvpDomain: "structure",
        },
        {
          lines: [50, 77],
          label: "Acquire logic with fast path, growth, and queuing",
          sbvpDomain: "behavior",
        },
        {
          lines: [107, 126],
          label: "Isolated pool configuration - 80/15/5 split",
          sbvpDomain: "philosophy",
        },
        {
          lines: [128, 141],
          label: "Workload-based routing to appropriate pool",
          sbvpDomain: "behavior",
        },
        {
          lines: [93, 101],
          label: "Observability through pool statistics",
          sbvpDomain: "visualization",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Multi-Tenant SaaS Applications - SaaS platforms implement connection pool isolation to prevent noisy neighbor problems where one tenant's heavy database usage starves other tenants. A customer support SaaS serving 1,000 tenants might allocate pools in tiers: premium tenants get dedicated 20-connection pools, standard tenants share a 100-connection pool (distributed across all standard tenants), and trial accounts share a 10-connection pool. When a trial account runs a runaway query consuming connections, only the 10-connection trial pool is affected—premium and standard tenants continue operating with their isolated pools. This placement sits at the data access layer, wrapping database drivers or ORM configurations. Multi-tenant applications tag each request with tenant ID and route to the appropriate pool based on tenant tier. More advanced implementations use dynamic pool allocation where tenant pools scale based on usage patterns, billing tier, or SLA requirements. The pattern prevents a single misbehaving tenant from degrading service for all customers, ensuring SLA compliance and fair resource distribution.",
      "OLTP/OLAP Workload Separation - Applications mixing transactional (OLTP) and analytical (OLAP) workloads implement connection pool isolation to prevent long-running reports from blocking user transactions. An e-commerce platform might configure three pools: 80-connection OLTP pool for order processing, product browsing, and checkout; 15-connection OLAP pool for business intelligence dashboards, sales reports, and data exports; 5-connection admin pool for schema migrations and maintenance. When the BI team runs a complex sales aggregation query that takes 10 minutes, all 15 OLAP connections may be consumed but the 80 OLTP connections remain available for customer checkouts. This placement operates at the query router or service layer—transactional services connect to OLTP pool, reporting services connect to OLAP pool. Some implementations use query pattern detection: SELECT statements with GROUP BY, window functions, or large LIMIT values are automatically routed to OLAP pool. The isolation ensures user-facing latency remains low (<100ms) regardless of concurrent analytics workload, maintaining customer experience while enabling data-driven business operations.",
      "Background Job Processing Systems - Job processors like Sidekiq, Celery, or custom batch systems use isolated connection pools to prevent background jobs from starving web request handlers. A web application serving API requests might configure: 50-connection web pool for API handlers, 10-connection job pool for background workers (email sending, image processing, data synchronization), 5-connection maintenance pool for database migrations and cleanup scripts. When a batch job processes 100,000 emails and holds database connections for transaction logging, only the 10-connection job pool is affected—web API handlers continue serving user requests with 50 dedicated connections. This placement occurs at the application worker/process level: web processes connect to web pool, job worker processes connect to job pool. Some systems implement priority-based routing where high-priority jobs can escalate to use the web pool if job pool is saturated, but web workers never downgrade to job pool. The pattern enables predictable API latency (P99 <200ms) even during heavy batch processing, preventing background operations from creating user-visible degradation.",
      "Read Replica Workload Distribution - Applications with read replicas implement connection pool isolation to distribute read workloads across replica pools while keeping write pool separate. A social media platform might configure: 30-connection write pool to primary database for posts, likes, follows; 40-connection replica-1 pool for user timeline queries; 40-connection replica-2 pool for search and discovery; 20-connection replica-3 pool for analytics. Write operations always use the write pool to ensure strong consistency. Read-heavy queries are load-balanced across replica pools based on query type and replica lag tolerance. If replica-3 falls behind due to heavy analytics queries, only analytics workload is affected—timeline and search queries continue using replicas-1 and 2 at normal speed. This placement operates at the database routing layer, often implemented with read/write splitters or middleware. The pattern enables horizontal read scaling while maintaining write consistency, prevents replica lag from affecting all reads, and allows replica-specific query routing (e.g., send complex aggregations to specific replica with more resources).",
      "Microservice Per-Dependency Isolation - Microservices calling shared databases implement per-service connection pools to prevent one service's database saturation from affecting others. In a payment processing system with three services sharing a PostgreSQL instance: payment-service gets 30-connection pool, fraud-detection-service gets 20-connection pool, notification-service gets 10-connection pool. When fraud-detection runs expensive graph traversal queries that saturate its 20 connections, payment-service's 30-connection pool remains unaffected, ensuring payment processing continues at normal throughput. This placement is configured at the microservice deployment level—each service's database client is configured with its dedicated pool. Some platforms implement this using database proxy layers (PgBouncer, ProxySQL) with per-user connection pools mapped to services. The pattern enables service-level fault isolation, prevents cascading failures in shared-database architectures, and allows per-service performance tuning (e.g., payment-service gets larger pool for high concurrency, notification-service gets smaller pool for asynchronous processing).",
    ],
    architecturalBoundaries: [
      "Application-to-Database Connection Boundary - Connection pool isolation operates at the boundary between application processes and database server connections. Traditional shared pooling creates a single pool of N connections shared by all application threads/workers. Isolation pattern splits this into multiple independent pools (OLTP pool with 80 connections, OLAP pool with 15 connections, background pool with 5 connections) where each pool maintains its own connection lifecycle independent of others. This boundary is the resource allocation point: when application requests a connection, it must specify target pool, and connections are provided only from that pool's allocation. The boundary enforces resource partitioning at connection establishment time—once a connection is assigned to OLTP pool, it cannot be used by OLAP workload. This creates strict isolation where OLAP saturation (all 15 connections in use) cannot prevent OLTP workload from acquiring connections from its dedicated 80-connection pool. The trade-off is reduced overall utilization: if OLTP pool has 60 idle connections while OLAP pool is saturated, those idle connections cannot help OLAP workload.",
      "Workload Classification Boundary - Connection pool isolation establishes a boundary where queries are classified by workload type before connection acquisition. Without isolation, all queries compete equally for connections from shared pool—first come, first served. With isolation, queries must first be classified (transactional, analytical, background, admin) then routed to appropriate pool. This classification boundary can be implicit (based on which application component makes the query: web controller vs background job) or explicit (query tagged with workload type). The boundary sits before connection acquisition: a query cannot acquire connection until it's been classified and routed to correct pool. This enables priority enforcement and resource allocation policies aligned with business criticality. For example, user checkout queries (classified as critical OLTP) always have access to 80-connection pool, while internal dashboards (classified as OLAP) are limited to 15-connection pool. Misclassification at this boundary can cause problems: if an expensive analytics query is accidentally classified as OLTP, it consumes critical pool resources.",
      "Pool Resource Limit Boundary - Connection pool isolation creates independent resource limit boundaries for each pool, where pool exhaustion is localized rather than system-wide. In shared pooling, exhaustion is binary: pool is either available (some connections free) or exhausted (all connections in use). With isolation, multiple states coexist: OLAP pool exhausted (all 15 connections in use), OLTP pool healthy (70/80 connections available), background pool idle (0/5 connections in use). This boundary enables partial degradation: when OLAP pool is exhausted, only analytics queries are affected (they queue or timeout), while OLTP and background workloads continue normally. The boundary is enforced at pool level: each pool has independent max size, queue depth, and timeout configuration. This allows workload-specific tuning: critical OLTP pool might have large queue and long timeout to maximize throughput, while OLAP pool has small queue and short timeout to prevent expensive query pileup. The boundary prevents cascading exhaustion where one workload type's saturation triggers system-wide connection starvation.",
      "Multi-Tenant Isolation Boundary - In multi-tenant SaaS systems, connection pool isolation creates a tenant-to-pool mapping boundary where each tenant's database operations are confined to their allocated pool. Without tenant isolation, all tenants share a common pool—a single tenant running expensive queries can exhaust all connections affecting every customer. With isolation, tenants are mapped to dedicated or shared pools based on tier: Premium Tenant A gets dedicated 20-connection pool, Standard Tier tenants share a 50-connection pool partitioned among 100 tenants, Trial Tier tenants share a 10-connection pool. This boundary enforces fair resource allocation and prevents noisy neighbor problems. When Trial Tenant X runs a runaway query consuming connections, only the 10-connection trial pool is affected—premium and standard tenants continue operating with full connection availability. The boundary is implemented at request ingress: tenant ID is extracted from authentication token, tenant tier is looked up, and appropriate pool is selected before query execution. This architectural boundary enables SLA differentiation (premium tenants get guaranteed connections, trial tenants get best-effort), fair billing (tenants cannot consume resources beyond their tier allocation), and blast radius containment (single tenant's misbehavior affects only their tier).",
    ],
    interactsWith: [
      "bulkhead",
      "circuit-breaker",
      "timeout",
      "thread-pool-isolation",
      "rate-limiting",
      "retry",
      "read-replicas",
    ],
  },

  implementations: [
    {
      id: "node-pg-multiple-pools",
      name: "Node.js pg Multiple Pool Configuration",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "PostgreSQL node-postgres library supporting multiple independent connection pools for workload isolation. Each pool configured with separate size and timeout settings.",
      links: {
        docs: "https://node-postgres.com/features/pooling",
        github: "https://github.com/brianc/node-postgres",
      },
      codeSnippet: `import { Pool } from 'pg';

// Create separate pools for different workloads
const oltpPool = new Pool({
  host: 'postgres.example.com',
  database: 'mydb',
  user: 'oltp_user',
  password: process.env.OLTP_PASSWORD,
  max: 80,                    // 80 connections for transactional workload
  min: 10,                    // Keep 10 connections warm
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000,  // Fail fast if pool saturated
});

const olapPool = new Pool({
  host: 'postgres-replica.example.com',  // Use read replica for analytics
  database: 'mydb',
  user: 'olap_user',
  max: 15,                    // Smaller pool for analytics queries
  min: 2,
  idleTimeoutMillis: 60000,   // Analytics connections can idle longer
  connectionTimeoutMillis: 10000,
});

const backgroundPool = new Pool({
  host: 'postgres.example.com',
  database: 'mydb',
  user: 'background_user',
  max: 5,                     // Limited pool for background jobs
  min: 0,                     // No minimum (create on demand)
  idleTimeoutMillis: 120000,
  connectionTimeoutMillis: 30000,  // Background jobs can wait longer
});

// Route queries to appropriate pool
async function executeQuery(query: string, workloadType: 'oltp' | 'olap' | 'background') {
  const pool = workloadType === 'oltp' ? oltpPool
             : workloadType === 'olap' ? olapPool
             : backgroundPool;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(\`Query failed on \${workloadType} pool:\`, error);
    throw error;
  }
}

// Usage
await executeQuery('SELECT * FROM orders WHERE user_id = $1', 'oltp');
await executeQuery('SELECT DATE_TRUNC(...) FROM orders', 'olap');
await executeQuery('INSERT INTO audit_log (...)', 'background');`,
    },
    {
      id: "python-sqlalchemy-multiple-engines",
      name: "Python SQLAlchemy Multiple Engine Configuration",
      type: "library",
      languages: ["python"],
      description:
        "SQLAlchemy ORM supporting multiple engines with independent connection pools per engine. Enables workload-specific pool sizing and read replica routing.",
      links: {
        docs: "https://docs.sqlalchemy.org/en/20/core/pooling.html",
      },
      codeSnippet: `from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# OLTP pool for primary database
oltp_engine = create_engine(
    'postgresql://user:pass@primary.db:5432/mydb',
    poolclass=QueuePool,
    pool_size=80,           # 80 connections for transactional workload
    max_overflow=20,        # Allow burst to 100 connections
    pool_timeout=5,         # Fail fast after 5s if pool saturated
    pool_recycle=3600,      # Recycle connections every hour
    pool_pre_ping=True,     # Validate connections before use
)

# OLAP pool for read replica
olap_engine = create_engine(
    'postgresql://readonly:pass@replica.db:5432/mydb',
    poolclass=QueuePool,
    pool_size=15,           # Smaller pool for analytics
    max_overflow=5,
    pool_timeout=10,        # Analytics can wait longer
    pool_recycle=7200,
    pool_pre_ping=True,
)

# Background pool for async jobs
background_engine = create_engine(
    'postgresql://background:pass@primary.db:5432/mydb',
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=2,
    pool_timeout=30,        # Background jobs tolerate longer waits
    pool_recycle=3600,
    pool_pre_ping=True,
)

def get_engine(workload_type):
    """Route queries to appropriate engine/pool"""
    if workload_type == 'oltp':
        return oltp_engine
    elif workload_type == 'olap':
        return olap_engine
    elif workload_type == 'background':
        return background_engine
    else:
        raise ValueError(f"Unknown workload type: {workload_type}")

# Usage with session
from sqlalchemy.orm import sessionmaker

OLTPSession = sessionmaker(bind=oltp_engine)
OLAPSession = sessionmaker(bind=olap_engine)

# Transactional query uses OLTP pool
with OLTPSession() as session:
    orders = session.query(Order).filter_by(user_id=123).all()

# Analytics query uses OLAP pool (read replica)
with OLAPSession() as session:
    sales_report = session.query(func.sum(Order.total)).all()`,
    },
    {
      id: "java-hikaricp-multiple-pools",
      name: "Java HikariCP Multiple Connection Pools",
      type: "library",
      languages: ["java"],
      description:
        "High-performance HikariCP connection pool library supporting multiple independent pool instances for workload isolation in Java applications.",
      links: {
        github: "https://github.com/brettwooldridge/HikariCP",
        docs: "https://github.com/brettwooldridge/HikariCP#configuration-knobs-baby",
      },
      codeSnippet: `import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

// Configure OLTP pool
HikariConfig oltpConfig = new HikariConfig();
oltpConfig.setJdbcUrl("jdbc:postgresql://primary.db:5432/mydb");
oltpConfig.setUsername("oltp_user");
oltpConfig.setPassword(System.getenv("OLTP_PASSWORD"));
oltpConfig.setMaximumPoolSize(80);        // 80 connections
oltpConfig.setMinimumIdle(10);            // Keep 10 idle
oltpConfig.setConnectionTimeout(5000);    // 5s timeout
oltpConfig.setIdleTimeout(30000);         // 30s idle timeout
oltpConfig.setPoolName("OLTP-Pool");

HikariDataSource oltpDataSource = new HikariDataSource(oltpConfig);

// Configure OLAP pool (replica)
HikariConfig olapConfig = new HikariConfig();
olapConfig.setJdbcUrl("jdbc:postgresql://replica.db:5432/mydb");
olapConfig.setUsername("readonly_user");
olapConfig.setPassword(System.getenv("READONLY_PASSWORD"));
olapConfig.setMaximumPoolSize(15);        // 15 connections for analytics
olapConfig.setMinimumIdle(2);
olapConfig.setConnectionTimeout(10000);   // 10s timeout
olapConfig.setIdleTimeout(60000);
olapConfig.setPoolName("OLAP-Pool");

HikariDataSource olapDataSource = new HikariDataSource(olapConfig);

// Configure background pool
HikariConfig backgroundConfig = new HikariConfig();
backgroundConfig.setJdbcUrl("jdbc:postgresql://primary.db:5432/mydb");
backgroundConfig.setUsername("background_user");
backgroundConfig.setMaximumPoolSize(5);
backgroundConfig.setMinimumIdle(0);           // No minimum
backgroundConfig.setConnectionTimeout(30000); // 30s timeout for batch jobs
backgroundConfig.setPoolName("Background-Pool");

HikariDataSource backgroundDataSource = new HikariDataSource(backgroundConfig);

// Router for workload-based pool selection
public class DataSourceRouter {
    public static HikariDataSource getDataSource(WorkloadType workload) {
        switch (workload) {
            case OLTP:
                return oltpDataSource;
            case OLAP:
                return olapDataSource;
            case BACKGROUND:
                return backgroundDataSource;
            default:
                throw new IllegalArgumentException("Unknown workload: " + workload);
        }
    }
}

// Usage
Connection conn = DataSourceRouter.getDataSource(WorkloadType.OLTP).getConnection();
try {
    PreparedStatement stmt = conn.prepareStatement("SELECT * FROM orders WHERE user_id = ?");
    stmt.setInt(1, userId);
    ResultSet rs = stmt.executeQuery();
} finally {
    conn.close();  // Return to pool
}`,
    },
    {
      id: "rails-multiple-databases",
      name: "Ruby on Rails Multiple Database Connections",
      type: "framework",
      languages: ["ruby"],
      description:
        "Rails 6+ native support for multiple database connections with separate connection pools per database role (writing, reading, analytics).",
      links: {
        docs: "https://guides.rubyonrails.org/active_record_multiple_databases.html",
      },
      codeSnippet: `# config/database.yml
production:
  primary:
    url: <%= ENV['PRIMARY_DATABASE_URL'] %>
    pool: 80        # OLTP pool size
    checkout_timeout: 5

  replica:
    url: <%= ENV['REPLICA_DATABASE_URL'] %>
    pool: 15        # OLAP pool size
    checkout_timeout: 10
    replica: true

  background:
    url: <%= ENV['PRIMARY_DATABASE_URL'] %>
    pool: 5         # Background job pool
    checkout_timeout: 30

# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  # Default to primary (OLTP) connection
  connects_to database: { writing: :primary, reading: :replica }
end

# Automatic read replica routing
class Order < ApplicationRecord
  # Reads go to replica pool, writes go to primary pool
end

# Explicit pool selection
class AnalyticsQuery
  def self.run_report
    # Force OLAP pool (replica) for expensive query
    ActiveRecord::Base.connected_to(role: :reading) do
      Order.group(:created_date).count
    end
  end
end

class BackgroundJob
  def perform
    # Use background pool to avoid blocking web requests
    ActiveRecord::Base.connected_to(database: :background) do
      Order.where(processed: false).each(&:process!)
    end
  end
end

# Usage in controllers (automatic routing)
class OrdersController < ApplicationController
  def show
    # Read uses replica pool automatically
    @order = Order.find(params[:id])
  end

  def create
    # Write uses primary (OLTP) pool
    @order = Order.create!(order_params)
  end
end`,
    },
    {
      id: "pgbouncer-pool-mode",
      name: "PgBouncer Database Proxy Pooling",
      type: "platform",
      languages: ["sql"],
      description:
        "PostgreSQL connection pooler implementing server-side connection pool isolation per database or user, enabling multi-tenant isolation and workload segregation.",
      links: {
        docs: "https://www.pgbouncer.org/config.html",
      },
      codeSnippet: `# pgbouncer.ini - Server-side connection pooling

[databases]
# OLTP workload - direct to primary
mydb_oltp = host=primary.db port=5432 dbname=mydb pool_size=80 reserve_pool=10

# OLAP workload - route to replica
mydb_olap = host=replica.db port=5432 dbname=mydb pool_size=15 reserve_pool=5

# Background workload - primary with small pool
mydb_background = host=primary.db port=5432 dbname=mydb pool_size=5

[pgbouncer]
pool_mode = transaction        # Connection per transaction
max_client_conn = 1000        # Max client connections
default_pool_size = 20
reserve_pool_timeout = 3
server_idle_timeout = 600

# Per-user pool limits
[users]
oltp_user = pool_size=80
readonly_user = pool_size=15
background_user = pool_size=5

# Application connects to PgBouncer instead of PostgreSQL directly:
# OLTP:       postgresql://oltp_user:pass@pgbouncer:6432/mydb_oltp
# OLAP:       postgresql://readonly_user:pass@pgbouncer:6432/mydb_olap
# Background: postgresql://background_user:pass@pgbouncer:6432/mydb_background

# PgBouncer maintains separate pools per database/user combo,
# isolating workloads at proxy layer instead of application layer`,
    },
  ],

  usedInSystems: [
    {
      systemId: "github-mysql-pools",
      systemName: "GitHub MySQL Connection Pool Isolation",
      howUsed:
        "GitHub implements connection pool isolation to separate web request queries from background job queries and administrative operations on their MySQL infrastructure. The web tier maintains a 200-connection OLTP pool to primary MySQL for user-facing operations (viewing repositories, creating issues, submitting pull requests). A separate 30-connection background pool serves Resque job workers processing webhook deliveries, repository indexing, and notification emails. A 10-connection admin pool is reserved for schema migrations and operational queries. When a webhook delivery spike causes the background pool to saturate (all 30 connections executing webhook HTTP requests and transaction logging), web tier continues serving user traffic with full 200-connection capacity unaffected. Without isolation, webhook spikes would consume connections from shared pool causing user-facing latency spikes and timeouts. GitHub implements this at the ActiveRecord level with multiple database configurations mapped to workload types. Pattern composition: Connection Pool Isolation + Read Replica Routing (read queries use replica pools) + Query Timeout (per-pool timeout configuration) + Circuit Breaker (per-pool failure detection). Impact: Eliminated 90% of user-facing database timeout incidents caused by background job spikes; reduced P99 web request latency from 2s to 200ms during background load; enabled safe horizontal scaling of background workers without impacting web tier.",
      source:
        "https://github.blog/2018-09-06-removing-mysql-query-cache-at-github/",
    },
    {
      systemId: "stripe-multi-tenant-pools",
      systemName: "Stripe Multi-Tenant Connection Isolation",
      howUsed:
        "Stripe's API platform uses connection pool isolation to prevent individual merchant accounts from monopolizing database connections and affecting other merchants. Each merchant tier gets allocated connection quota: Enterprise merchants (top 1% by volume) get dedicated 50-connection pools, Business merchants share a 200-connection pool distributed across ~1000 accounts with per-merchant sub-pools of 5 connections, Standard merchants share a 100-connection pool with best-effort allocation. When an Enterprise merchant processes a Black Friday surge hitting 10,000 payments/second, their 50-connection pool saturates but Standard and Business tiers continue operating with their isolated pools. The system monitors per-tenant pool utilization and implements adaptive throttling: if a tenant consistently saturates their pool, rate limits are applied to prevent sustained saturation. For Business tier shared pool, Stripe implements fair queuing where each merchant can queue up to 10 requests before being rejected, preventing one merchant from filling the entire queue. Pattern composition: Connection Pool Isolation (per-tier pools) + Fair Queuing (per-merchant sub-queues within shared pools) + Rate Limiting (adaptive per-tenant limits) + Graceful Degradation (serve cached data when pool exhausted). Impact: Achieved 99.999% platform availability (5 minutes downtime/year) despite serving millions of merchants; prevented noisy neighbor incidents from 50/month to near zero; enabled predictable performance SLAs per merchant tier (Enterprise <10ms P99, Standard <50ms P99).",
      source: "https://stripe.com/blog/scaling-api",
    },
    {
      systemId: "shopify-mysql-sharding-pools",
      systemName: "Shopify MySQL Shard Pool Isolation",
      howUsed:
        "Shopify's sharded MySQL architecture implements connection pool isolation per shard and per workload type to prevent cross-shard and cross-workload failures. With 100+ MySQL shards serving 1M+ merchants, each shard gets: 50-connection storefront pool (customer-facing queries for product listings, cart operations), 20-connection admin pool (merchant dashboard queries for inventory management), 10-connection background pool (order synchronization, analytics updates). When Shard 42 experiences an admin workload spike (merchant exporting 1M orders), the 20-connection admin pool saturates but Shard 42's storefront pool remains unaffected, and other shards (1-41, 43-100) continue normally with all workload types operational. The isolation is two-dimensional: across shards (Shard 1 failure doesn't affect Shard 2) and within shards (admin saturation doesn't affect storefront). Shopify implements this with a custom connection router aware of both shard topology (consistent hashing on shop_id) and workload classification (query pattern analysis). Pattern composition: Connection Pool Isolation (per-shard, per-workload) + Consistent Hashing (shard selection) + Circuit Breaker (per-shard, per-pool) + Pod Isolation (groups of shards in failure domains). Impact: Reduced platform-wide incidents from shard failures by 80%; improved Black Friday storefront availability to 99.99% despite 10x traffic surge; enabled independent scaling of admin and storefront workloads (admin can surge without affecting customer experience).",
      source: "https://shopify.engineering/evolution-shopify-mysql-database",
    },
  ],

  references: [
    {
      title: "PostgreSQL Connection Pooling with node-postgres",
      url: "https://node-postgres.com/features/pooling",
      type: "documentation",
      author: "node-postgres contributors",
    },
    {
      title: "SQLAlchemy Connection Pooling",
      url: "https://docs.sqlalchemy.org/en/20/core/pooling.html",
      type: "documentation",
      author: "SQLAlchemy",
    },
    {
      title: "HikariCP - High-Performance JDBC Connection Pool",
      url: "https://github.com/brettwooldridge/HikariCP",
      type: "documentation",
      author: "Brett Wooldridge",
    },
    {
      title: "GitHub - Partitioning MySQL at GitHub",
      url: "https://github.blog/2018-09-06-removing-mysql-query-cache-at-github/",
      type: "article",
      author: "GitHub Engineering",
    },
    {
      title: "PgBouncer - PostgreSQL Connection Pooler",
      url: "https://www.pgbouncer.org/",
      type: "documentation",
      author: "PgBouncer Project",
    },
  ],

  philosophy: {
    coreProblem:
      "Shared database connection pools allow one workload type (analytics, batch jobs, noisy tenant) to exhaust all connections, blocking unrelated operations and causing cascading failures even when database has capacity",
    designPrinciple:
      "Partition connection pool capacity across workload types or tenants, enforcing resource allocation policies that prevent one workload from starving others",
    historicalContext:
      "Connection pool isolation emerged from multi-tenant SaaS platforms and OLTP/OLAP mixed workloads in the late 2000s. Early systems used shared pools leading to noisy neighbor problems where one customer's expensive query affected all customers. Pattern matured with frameworks like Rails multi-database support and PgBouncer pooling modes.",
    alternativesRejected: [
      "Shared connection pool - allows workload interference and noisy neighbor problems",
      "No pooling (connection per query) - too expensive, exhausts database connections",
      "Database-level resource limits - coarse-grained, doesn't isolate application workloads",
      "Separate database instances - higher cost and operational overhead than pool isolation",
    ],
    mentalModel:
      "Connection pool isolation is like having separate toll booth lanes for cars, trucks, and motorcycles on a highway: if trucks are moving slowly through their lanes, cars and motorcycles still zip through their dedicated lanes—one vehicle type's congestion doesn't block the others",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph App["Application (Multiple Workload Types)"]
        OLTP["OLTP Queries<br/>(User Transactions)"]
        OLAP["OLAP Queries<br/>(Analytics Reports)"]
        Background["Background Jobs<br/>(Batch Processing)"]
    end

    subgraph Pools["Connection Pool Manager"]
        OLTPPool["OLTP Pool<br/>80 connections<br/>Timeout: 5s"]
        OLAPPool["OLAP Pool<br/>15 connections<br/>Timeout: 10s"]
        BgPool["Background Pool<br/>5 connections<br/>Timeout: 30s"]
    end

    OLTP --> OLTPPool
    OLAP --> OLAPPool
    Background --> BgPool

    OLTPPool --> DB["PostgreSQL<br/>(max_connections=100)"]
    OLAPPool --> DB
    BgPool --> DB

    OLAPPool -.->|"All 15 connections<br/>IN USE (saturated)"| OLAPPool
    OLTPPool -.->|"✓ 70/80 available"| OLTPPool
    BgPool -.->|"✓ 5/5 available"| BgPool

    style OLAPPool fill:#ffcccc
    style OLTPPool fill:#ccffcc
    style BgPool fill:#ccffcc`,
    realWorldAnalogy:
      "Connection pool isolation is like separate customer service phone lines for sales, support, and billing departments: if billing has a 30-minute hold time due to month-end rush, sales calls still get answered in under 1 minute on their dedicated line—one department's queue doesn't block the others",
    useCases: [
      {
        domain: "Multi-Tenant SaaS",
        scenario:
          "Stripe isolates database connections per merchant tier preventing noisy neighbors from affecting other tenants",
        patternRole:
          "Ensures predictable performance per tenant tier and prevents cross-tenant resource contention",
        companies: ["Stripe", "Shopify", "Salesforce", "GitHub"],
      },
      {
        domain: "OLTP/OLAP Workload Separation",
        scenario:
          "E-commerce platforms separate transactional queries from analytics reports using isolated pools",
        patternRole:
          "Prevents long-running reports from blocking customer checkouts and order processing",
        companies: ["Amazon", "eBay", "Walmart", "Target"],
      },
      {
        domain: "Background Job Processing",
        scenario:
          "Web applications isolate background worker database connections from API request connections",
        patternRole:
          "Ensures API latency remains low even during heavy batch processing",
        companies: ["GitHub", "GitLab", "Basecamp", "Heroku"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "isolation",
    "bulkhead",
    "database",
    "connection-pooling",
    "resource-isolation",
  ],
  difficulty: "advanced",
};
