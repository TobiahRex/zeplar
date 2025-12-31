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
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
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
};
