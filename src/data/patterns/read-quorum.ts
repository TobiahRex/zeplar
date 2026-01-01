import type { Pattern } from "../schema";

export const readQuorum: Pattern = {
  id: "read-quorum",
  slug: "read-quorum",
  corpusPath: "🛡️ RELIABILITY → 📋 Redundancy → 🗳️ Quorum → 📖 Read Quorum",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Quorum",
    level: 4,
  },

  concept: {
    name: "Read Quorum",
    emoji: "📖",
    tagline: "R nodes must respond",
    definition:
      "Read Quorum requires a distributed system to successfully retrieve data from a minimum number (R) of replica nodes before considering the read operation complete, ensuring consistency by guaranteeing overlap with recent writes. Like a jury that needs a majority of members present to reach a valid verdict, read quorums ensure you consult enough replicas to guarantee you see the most recent write. In a system with N total replicas, reads must receive responses from at least R nodes, where R is typically configured to ensure R + W > N (W being the write quorum size). This overlap guarantees that at least one node in the read quorum participated in the most recent successful write, ensuring you never read stale data from a minority of outdated replicas. The coordinator sends read requests to all N replicas concurrently, waits for R responses, then returns the value with the highest version number or timestamp. Systems like Cassandra, DynamoDB, and Riak implement configurable read quorums (R=1 for fast reads with eventual consistency, R=QUORUM for stronger consistency). The pattern trades read latency (must wait for R nodes) for consistency guarantees, with the tradeoff point determined by your R configuration—higher R means stronger consistency but slower reads and reduced availability during node failures.",
    problemSolved:
      "Distributed databases replicate data across multiple nodes for availability and fault tolerance, but replication introduces consistency challenges. If reads query a single replica, they might retrieve stale data if that replica hasn't yet received the latest write (asynchronous replication lag). During network partitions or node failures, different replicas might hold different versions of the same data. Without read quorums, applications could read outdated values, see data inconsistencies, or miss recent writes—violating user expectations and business logic. Read quorums solve this by ensuring reads consult enough replicas to guarantee they see the most recent committed value. When combined with write quorums (W), the overlap property (R + W > N) mathematically guarantees that every read intersects with the most recent write—at least one node in the R-node read set must have participated in the W-node write set. This provides tunable consistency: R=1 optimizes for low latency and availability (eventual consistency), R=QUORUM (majority) provides strong consistency at moderate cost, and R=ALL ensures linearizable reads but reduces availability (single node failure blocks reads).",
    tradeoffs: {
      pros: [
        "Tunable consistency guarantees through R configuration (higher R = stronger consistency)",
        "Mathematically guarantees seeing recent writes when R + W > N",
        "Provides fault tolerance—can tolerate N - R node failures for reads",
        "Enables different consistency levels for different queries in same system",
        "Avoids reading stale data from minority replicas that haven't received updates",
      ],
      cons: [
        "Higher R increases read latency—must wait for more nodes to respond",
        "Reduces read availability during failures (R=QUORUM fails if majority unavailable)",
        "Network overhead from querying multiple replicas concurrently",
        "Requires version vectors or timestamps to determine most recent value",
        "Higher R can saturate network and increase cluster load",
      ],
    },
    relatedPatterns: [
      "write-quorum",
      "simple-majority",
      "r-w-n",
      "eventual-consistency",
      "vector-clocks",
      "leaderless",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client Application",
        role: "Read Request Initiator",
        responsibilities: [
          "Initiate read requests for data values",
          "Specify desired consistency level (R value)",
          "Handle read quorum responses or failures",
          "Process versioned values returned by coordinator",
        ],
      },
      {
        name: "Coordinator Node",
        role: "Quorum Orchestrator",
        responsibilities: [
          "Send concurrent read requests to R out of N replicas",
          "Wait for R responses within timeout period",
          "Resolve conflicts using version vectors or timestamps",
          "Return value with highest version to client",
          "Track replica health and response times",
        ],
      },
      {
        name: "Replica Nodes (N total)",
        role: "Data Storage Replicas",
        responsibilities: [
          "Store versioned copies of data values",
          "Respond to read requests with value and version/timestamp",
          "Maintain consistency via replication protocols",
          "Track vector clocks or version counters for conflict detection",
        ],
      },
      {
        name: "Version Resolution Logic",
        role: "Conflict Resolver",
        responsibilities: [
          "Compare version numbers or timestamps from R replicas",
          "Select value with highest version (most recent write)",
          "Handle version conflicts using last-write-wins or vector clocks",
          "Detect stale replicas and trigger read repair if needed",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant Coordinator
    participant R1 as Replica 1
    participant R2 as Replica 2
    participant R3 as Replica 3
    participant R4 as Replica 4
    participant R5 as Replica 5

    Note over Client,R5: Read Quorum Configuration: N=5, R=3, W=3<br/>R + W > N guarantees overlap with recent writes

    Client->>Coordinator: GET(key="user:123", R=3)

    Note over Coordinator: Send to ALL N replicas concurrently
    Coordinator->>R1: READ(key="user:123")
    Coordinator->>R2: READ(key="user:123")
    Coordinator->>R3: READ(key="user:123")
    Coordinator->>R4: READ(key="user:123")
    Coordinator->>R5: READ(key="user:123")

    Note over R1,R5: Replicas respond with versioned values

    R1-->>Coordinator: {value: "Alice", version: 5, timestamp: t5}
    R2-->>Coordinator: {value: "Alice", version: 5, timestamp: t5}
    R3-->>Coordinator: {value: "Alice-old", version: 4, timestamp: t4}

    Note over Coordinator: R=3 responses received<br/>Stop waiting (R4, R5 responses ignored)

    Note over Coordinator: Conflict Resolution<br/>version 5 > version 4<br/>Select value with highest version

    Coordinator->>Coordinator: Select: {value: "Alice", version: 5}
    Coordinator-->>Client: Return "Alice" (version 5)

    Note over Client: Read guaranteed to see<br/>latest write due to R+W>N overlap

    Note over Coordinator,R5: Scenario: Quorum Not Met

    Client->>Coordinator: GET(key="user:456", R=3)
    Coordinator->>R1: READ(key="user:456")
    Coordinator->>R2: READ(key="user:456")
    Coordinator->>R3: READ(key="user:456")
    Coordinator->>R4: READ(key="user:456")
    Coordinator->>R5: READ(key="user:456")

    R1--xCoordinator: Timeout (5s)
    R2-->>Coordinator: {value: "Bob", version: 3}
    R3--xCoordinator: Network partition
    R4--xCoordinator: Timeout
    R5-->>Coordinator: {value: "Bob", version: 3}

    Note over Coordinator: Only 2 responses (< R=3)<br/>Quorum not met

    Coordinator--xClient: Error: Read quorum not met<br/>(need 3, got 2 responses)`,
    flow: [
      {
        step: 1,
        actor: "Client Application",
        action: "Initiate Read Request",
        description:
          "Client sends read request to coordinator specifying key and desired quorum size R (e.g., R=QUORUM for majority)",
      },
      {
        step: 2,
        actor: "Coordinator Node",
        action: "Send Concurrent Reads to N Replicas",
        description:
          "Coordinator sends read requests to ALL N replica nodes concurrently (even though only R responses needed) to minimize latency and handle slow replicas",
      },
      {
        step: 3,
        actor: "Replica Nodes",
        action: "Return Versioned Values",
        description:
          "Each replica responds with the stored value along with version number (vector clock or timestamp) and replica ID for conflict resolution",
      },
      {
        step: 4,
        actor: "Coordinator Node",
        action: "Wait for R Successful Responses",
        description:
          "Coordinator waits until R replicas have responded successfully, or timeout expires (if fewer than R responses, read fails)",
      },
      {
        step: 5,
        actor: "Version Resolution Logic",
        action: "Resolve Version Conflicts",
        description:
          "Compare version numbers from R responses and select value with highest version (last-write-wins). If versions equal, use timestamp as tiebreaker",
      },
      {
        step: 6,
        actor: "Coordinator Node",
        action: "Return Latest Value to Client",
        description:
          "Coordinator returns the value with highest version to client. Client receives most recent committed write due to R+W>N overlap property",
      },
      {
        step: 7,
        actor: "Coordinator Node",
        action: "Optional Read Repair",
        description:
          "If stale replicas detected (version < latest), coordinator asynchronously writes latest value to stale replicas to repair inconsistency (anti-entropy)",
      },
    ],
    invariants: [
      "R + W > N guarantees read quorum overlaps with write quorum (sees latest write)",
      "R ≤ N (cannot require more responses than total replicas)",
      "R ≥ 1 (must read from at least one replica)",
      "Higher R provides stronger consistency but lower availability (tolerates fewer failures)",
      "Coordinator must wait for exactly R responses before resolving conflicts",
      "Version resolution must be deterministic (same versions always select same value)",
      "Read quorum failure occurs when < R replicas respond within timeout",
      "All replicas must use consistent version numbering scheme (vector clocks or lamport timestamps)",
    ],
  },

  codeExamples: [
    {
      id: "read-quorum-ts-basic",
      language: "typescript",
      title: "Read Quorum Coordinator with Version-Based Conflict Resolution",
      description:
        "A production-ready distributed key-value store coordinator that implements read quorum consensus. Demonstrates concurrent reads from multiple replicas, version-based conflict resolution, and configurable R values for tunable consistency guarantees.",
      code: `// Read Quorum Implementation - Distributed Key-Value Store
// Demonstrates quorum-based reads with version conflict resolution

interface VersionedValue<T> {
  value: T;
  version: number;
  timestamp: number;
  replicaId: string;
}

interface ReplicaNode<T> {
  id: string;
  read(key: string): Promise<VersionedValue<T> | null>;
  isHealthy(): boolean;
}

interface ReadQuorumConfig {
  replicaCount: number; // N - total replicas
  readQuorum: number; // R - minimum successful reads
  timeout: number; // milliseconds
}

class QuorumReadCoordinator<T> {
  private replicas: ReplicaNode<T>[];
  private config: ReadQuorumConfig;

  constructor(replicas: ReplicaNode<T>[], config: ReadQuorumConfig) {
    this.replicas = replicas;
    this.config = config;

    // Validate R + W > N property (assuming W is configured elsewhere)
    if (config.readQuorum > config.replicaCount) {
      throw new Error("Read quorum cannot exceed replica count");
    }
    if (config.readQuorum < 1) {
      throw new Error("Read quorum must be at least 1");
    }
  }

  async read(key: string): Promise<T | null> {
    console.log(\`[ReadQuorum] Starting read for key=\${key}, R=\${this.config.readQuorum}\`);

    // Step 1: Filter healthy replicas
    const healthyReplicas = this.replicas.filter((r) => r.isHealthy());
    console.log(\`[ReadQuorum] Healthy replicas: \${healthyReplicas.length}/\${this.replicas.length}\`);

    if (healthyReplicas.length < this.config.readQuorum) {
      throw new Error(
        \`Insufficient healthy replicas: need \${this.config.readQuorum}, have \${healthyReplicas.length}\`
      );
    }

    // Step 2: Send read requests to ALL healthy replicas concurrently
    const readPromises = healthyReplicas.map((replica) =>
      this.readFromReplica(replica, key)
    );

    // Step 3: Wait for R successful responses (race with timeout)
    const responses = await this.waitForQuorum(readPromises);

    if (responses.length < this.config.readQuorum) {
      throw new Error(
        \`Read quorum not met: got \${responses.length}/\${this.config.readQuorum} responses\`
      );
    }

    console.log(\`[ReadQuorum] Quorum achieved: \${responses.length} responses\`);

    // Step 4: Resolve conflicts using highest version number
    const latestValue = this.resolveConflicts(responses);

    if (!latestValue) {
      console.log(\`[ReadQuorum] Key not found on any replica\`);
      return null;
    }

    console.log(
      \`[ReadQuorum] Returning value from replica=\${latestValue.replicaId}, version=\${latestValue.version}\`
    );
    return latestValue.value;
  }

  private async readFromReplica(
    replica: ReplicaNode<T>,
    key: string
  ): Promise<{ success: true; data: VersionedValue<T> } | { success: false; error: Error }> {
    try {
      const result = await this.withTimeout(
        replica.read(key),
        this.config.timeout
      );
      if (result === null) {
        // Replica doesn't have this key - still a successful read
        return { success: true, data: null! };
      }
      console.log(\`[Replica \${replica.id}] Read successful, version=\${result.version}\`);
      return { success: true, data: result };
    } catch (error) {
      console.log(\`[Replica \${replica.id}] Read failed: \${error}\`);
      return { success: false, error: error as Error };
    }
  }

  private async waitForQuorum(
    promises: Promise<{ success: boolean; data?: VersionedValue<T>; error?: Error }>[]
  ): Promise<VersionedValue<T>[]> {
    const responses: VersionedValue<T>[] = [];

    // Settle all promises and collect successful responses
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success && result.value.data) {
        responses.push(result.value.data);
      }
    }

    return responses;
  }

  private resolveConflicts(responses: VersionedValue<T>[]): VersionedValue<T> | null {
    if (responses.length === 0) return null;

    // Filter out null responses (key not found on some replicas)
    const validResponses = responses.filter((r) => r !== null);
    if (validResponses.length === 0) return null;

    // Select value with highest version (last-write-wins)
    let latest = validResponses[0];
    for (const response of validResponses) {
      if (
        response.version > latest.version ||
        (response.version === latest.version && response.timestamp > latest.timestamp)
      ) {
        latest = response;
      }
    }

    if (validResponses.length > 1) {
      const versions = validResponses.map((r) => r.version).join(", ");
      console.log(\`[ReadQuorum] Conflict resolution: versions=[\${versions}], selected=\${latest.version}\`);
    }

    return latest;
  }

  private async withTimeout<V>(promise: Promise<V>, timeoutMs: number): Promise<V> {
    return Promise.race([
      promise,
      new Promise<V>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  }
}

// Mock Replica Implementation for demonstration
class MockReplica<T> implements ReplicaNode<T> {
  private data: Map<string, VersionedValue<T>> = new Map();
  private healthy: boolean = true;

  constructor(
    public id: string,
    private latency: number = 50
  ) {}

  async read(key: string): Promise<VersionedValue<T> | null> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, this.latency));

    if (!this.healthy) {
      throw new Error(\`Replica \${this.id} is unhealthy\`);
    }

    return this.data.get(key) || null;
  }

  write(key: string, value: T, version: number): void {
    this.data.set(key, {
      value,
      version,
      timestamp: Date.now(),
      replicaId: this.id,
    });
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }
}

// Example Usage
async function demonstrateReadQuorum() {
  console.log("=== Read Quorum Demonstration ===\\n");

  // Create 5 replicas
  const replicas: MockReplica<string>[] = [
    new MockReplica("replica-1", 30),
    new MockReplica("replica-2", 50),
    new MockReplica("replica-3", 40),
    new MockReplica("replica-4", 60),
    new MockReplica("replica-5", 70),
  ];

  // Write different versions to replicas (simulating replication lag)
  replicas[0].write("user:123", "Alice-v3", 3);
  replicas[1].write("user:123", "Alice-v3", 3);
  replicas[2].write("user:123", "Alice-v3", 3);
  replicas[3].write("user:123", "Alice-v2", 2); // Stale replica
  replicas[4].write("user:123", "Alice-v1", 1); // Very stale

  // Configure R=3 (majority quorum for N=5)
  const coordinator = new QuorumReadCoordinator(replicas, {
    replicaCount: 5,
    readQuorum: 3,
    timeout: 1000,
  });

  // Scenario 1: Normal read with version conflict
  console.log("\\nScenario 1: Read with version conflicts");
  const value1 = await coordinator.read("user:123");
  console.log(\`Result: \${value1}\\n\`);

  // Scenario 2: Read with replica failure
  console.log("\\nScenario 2: Read with 2 replicas down");
  replicas[3].setHealthy(false);
  replicas[4].setHealthy(false);
  const value2 = await coordinator.read("user:123");
  console.log(\`Result: \${value2}\\n\`);

  // Scenario 3: Insufficient replicas
  console.log("\\nScenario 3: Quorum cannot be met");
  replicas[2].setHealthy(false); // Now only 2 healthy replicas
  try {
    await coordinator.read("user:123");
  } catch (error) {
    console.log(\`Error (expected): \${error}\\n\`);
  }
}

// Run demonstration
demonstrateReadQuorum().catch(console.error);`,
      contextDilation: {
        level: "module",
        scope:
          "Complete read quorum coordination for a distributed key-value store, handling replica selection, concurrent reads, and version-based conflict resolution",
        prerequisites: [
          "Understanding of distributed systems replication",
          "Familiarity with eventual consistency vs strong consistency",
          "Knowledge of version vectors and conflict resolution strategies",
          "Understanding of Promise concurrency patterns in TypeScript",
        ],
        systemPosition:
          "Sits between application clients and replica storage nodes. Acts as the coordinator that enforces quorum read rules, sending requests to multiple replicas and resolving conflicts to return consistent data. This would be part of a distributed database's client library or proxy layer.",
      },
      annotations: [
        {
          id: "read-quorum-store-config",
          lines: [104, 109],
          action: "Store replica nodes and quorum configuration in coordinator",
          reason:
            "The coordinator needs references to all available replicas to send concurrent read requests, and configuration determines how many responses (R) are required for consensus",
          contextLevel: "module",
        },
        {
          id: "read-quorum-validate-constraint",
          lines: [111, 118],
          action: "Validate R <= N constraint in constructor",
          reason:
            "Read quorum size cannot exceed total replica count - this is a mathematical impossibility that would cause all reads to fail, so we fail fast on startup",
          contextLevel: "local",
        },
        {
          id: "read-quorum-filter-healthy",
          lines: [124, 131],
          action: "Filter replicas by health status before reading",
          reason:
            "Avoids wasting time sending requests to replicas known to be down. Health checks run independently (heartbeats, monitoring) and mark replicas as unhealthy to exclude them from quorum calculations",
          contextLevel: "module",
        },
        {
          id: "read-quorum-concurrent-reads",
          lines: [133, 136],
          action: "Send read requests to ALL healthy replicas concurrently",
          reason:
            "Maximizes chances of meeting quorum quickly and getting fresh data. Even though we only need R responses, sending to all N replicas handles cases where some are slow or fail during the read",
          contextLevel: "module",
        },
        {
          id: "read-quorum-allsettled",
          lines: [190, 196],
          action: "Use Promise.allSettled instead of Promise.all",
          reason:
            "Promise.all short-circuits on first rejection, but we need to collect ALL responses (successes and failures) to count how many succeeded and meet the R-quorum threshold",
          contextLevel: "local",
        },
        {
          id: "read-quorum-threshold-check",
          lines: [141, 145],
          action: "Check if successful responses >= readQuorum threshold",
          reason:
            "This is the core quorum enforcement - we only proceed if at least R replicas successfully responded, guaranteeing overlap with write quorum per the R + W > N property",
          contextLevel: "module",
        },
        {
          id: "read-quorum-version-selection",
          lines: [208, 217],
          action: "Select highest version number from quorum responses",
          reason:
            "When multiple replicas return different versions (replication lag), the highest version represents the most recent write. This last-write-wins strategy ensures read-your-writes consistency",
          contextLevel: "module",
        },
        {
          id: "read-quorum-timestamp-tiebreaker",
          lines: [211, 214],
          action: "Use timestamp as tiebreaker for equal versions",
          reason:
            "In edge cases where version numbers match but values differ (concurrent writes with same version), timestamp provides a deterministic conflict resolution to avoid returning arbitrary values",
          contextLevel: "local",
        },
        {
          id: "read-quorum-timeout-protection",
          lines: [168, 171],
          action: "Wrap each replica read with timeout protection",
          reason:
            "Prevents slow or hung replicas from delaying reads indefinitely. Timeout failures count against quorum, forcing coordinator to rely on faster replicas and maintaining bounded latency",
          contextLevel: "module",
        },
        {
          id: "read-quorum-observability",
          lines: [157, 159],
          action: "Log replica IDs and versions during conflict resolution",
          reason:
            "Provides observability into replication lag and conflict patterns. Frequent version conflicts indicate slow replication or network issues that need investigation",
          contextLevel: "system",
        },
        {
          id: "read-quorum-null-handling",
          lines: [172, 175],
          action: "Treat null responses (key not found) as successful reads",
          reason:
            "A replica that doesn't have the key is still a valid response - the key might not exist yet, or that replica hasn't received writes. This counts toward quorum but doesn't participate in version comparison",
          contextLevel: "local",
        },
        {
          id: "read-quorum-null-return",
          lines: [152, 155],
          action: "Return null if no replicas have the requested key",
          reason:
            "Distinguishes between 'key doesn't exist' and 'read failed' - both are valid outcomes. Clients can interpret null as definitive proof the key is not in the system (at this consistency level)",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [103, 118],
          sbvpDomain: "structure",
          label:
            "Generic coordinator class that abstracts replica communication and quorum logic from business code",
        },
        {
          lines: [133, 190],
          sbvpDomain: "behavior",
          label:
            "Concurrent fan-out to all replicas with Promise.allSettled for graceful failure handling",
        },
        {
          lines: [208, 217],
          sbvpDomain: "behavior",
          label:
            "Version-based conflict resolution implementing last-write-wins with timestamp fallback",
        },
        {
          lines: [97, 101],
          sbvpDomain: "philosophy",
          label:
            "Tunable consistency through configurable R value - demonstrates CAP theorem tradeoffs",
        },
        {
          lines: [120, 161],
          sbvpDomain: "structure",
          label:
            "Coordinator sits between clients and replicas, enforcing consistency rules at the protocol layer",
        },
        {
          lines: [124, 131],
          sbvpDomain: "behavior",
          label:
            "Health-based replica filtering prevents wasting resources on known-failed nodes",
        },
        {
          lines: [141, 145],
          sbvpDomain: "philosophy",
          label:
            "Explicit quorum validation enforces R + W > N consistency guarantees mathematically",
        },
        {
          lines: [84, 89],
          sbvpDomain: "structure",
          label:
            "VersionedValue interface captures conflict resolution metadata alongside actual data",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Distributed Database Client Libraries - Read quorum logic is embedded within database client drivers (Cassandra Java driver, DynamoDB SDK, Riak client) that applications use to access distributed databases. When application calls db.get(key, ConsistencyLevel.QUORUM), the client driver becomes the coordinator: sends concurrent reads to N replicas, waits for R responses, resolves version conflicts, and returns latest value. This placement keeps quorum logic transparent to application code—developers specify consistency level, driver handles distributed coordination. Cassandra's Java driver implements read quorum for LOCAL_QUORUM (majority of replicas in local datacenter), QUORUM (majority across all datacenters), and ALL (every replica). The driver maintains connection pools to all replicas, tracks topology changes via gossip protocol, and routes reads to healthy nodes. DynamoDB's SDK implements consistent reads (R=majority) vs eventually consistent reads (R=1) with automatic retry and exponential backoff when quorum fails. Placement in client library enables language-specific optimizations (connection pooling, async I/O) and keeps distributed consensus concerns separate from application business logic.",

      "Database Coordinator Nodes - In leaderless replication architectures (Dynamo-style systems like Cassandra, Riak, Voldemort), any node can act as coordinator for read requests. Client connects to any node in the cluster, which becomes the temporary coordinator for that specific read. Coordinator node forwards read to R replicas (selected via consistent hashing of key), collects versioned responses, resolves conflicts using vector clocks or timestamps, and returns result to client. This placement distributes coordination load evenly across cluster—no single coordinator bottleneck. Cassandra uses token ring partitioning: coordinator hashes the key to find N replicas responsible for that partition, then queries the R closest replicas (by network topology) to minimize latency. If initial R replicas are slow, coordinator can speculatively query additional replicas to meet SLA. Riak's coordinator implements read repair: if replicas return different versions, coordinator writes latest version to stale replicas asynchronously (anti-entropy). This placement enables horizontal scaling—adding nodes increases both storage capacity and coordination capacity linearly.",

      "API Gateway and Proxy Layers - Read quorum coordination can be implemented at API gateway layer for multi-region deployments. Gateway receives client read request, queries R out of N regional databases concurrently, resolves version conflicts across regions, and returns latest value. This placement centralizes consistency policy enforcement—applications don't configure quorum parameters, gateway handles multi-region coordination. AWS's DynamoDB Global Tables uses this pattern: when global table is configured, DynamoDB's control plane ensures R + W > N across regions. API gateway queries majority of regions for strongly consistent reads, resolving conflicts using last-write-wins with Lamport timestamps. Kong and Envoy proxies can implement read quorum for caching layers: query R cache nodes, return cached value if versions match (cache hit), otherwise fall through to database. Placement at gateway enables observability—track quorum latency, version conflicts, and replica health at centralized monitoring point without instrumenting application code.",

      "Storage Engine Replication Layer - Within database internals, read quorum is implemented at the storage engine's replication layer. PostgreSQL with Patroni/Stolon implements synchronous replication with quorum: when read arrives at primary, if primary's data might be stale (detected via replication lag metrics), query is forwarded to R replicas and results are compared. MySQL Group Replication implements read-your-writes consistency via read quorum: if client's write completed on W replicas, subsequent read from that client queries at least R replicas (where R+W>N) guaranteeing read sees the write. MongoDB's read concern 'majority' implements read quorum: query is served only after data has replicated to majority of replica set members. This placement provides consistency guarantees at database level—applications get strong consistency without implementing quorum logic. MongoDB's storage engine tracks committed snapshot: read quorum queries wait until data is in majority-committed snapshot before returning to client. Placement in storage layer enables optimizations like read-your-writes caching: if client's recent write is in local cache and has replicated to R nodes, return immediately without quorum query.",

      "Distributed Cache Coordination - Read quorum applies to distributed caching systems (Redis Cluster, Memcached clusters) where cache misses must check R cache nodes before falling back to database. Redis Cluster implements read quorum for strong consistency mode: when client reads key, Redis coordinator (any cluster node) queries R shard replicas and returns value only if R responses match. If versions mismatch (cache inconsistency), invalidate cache and fetch from database. Memcached pools with consistent hashing use read quorum for critical cached data: query R cache servers, return value if consensus reached, otherwise cache miss. This placement balances cache performance (single-node reads for low latency) with consistency (quorum reads for critical data). Distributed session stores (Spring Session with Hazelcast, Redis sessions) use read quorum for session consistency: read session data from R session replicas to prevent stale sessions after server restarts. Placement in cache layer enables tunable consistency: non-critical cache reads use R=1 (fast, eventually consistent), critical reads use R=QUORUM (slower, strongly consistent).",
    ],
    interactsWith: [
      "write-quorum",
      "simple-majority",
      "r-w-n",
      "vector-clocks",
      "eventual-consistency",
      "leaderless",
      "read-repair",
      "hinted-handoff",
      "gossip-protocol",
      "consistent-hashing",
    ],
    architecturalBoundaries: [
      "Client-to-Database Boundary - Read quorum operates at the boundary between application clients and distributed database clusters. Client libraries (Cassandra driver, DynamoDB SDK, Riak client) implement coordinator logic, sending concurrent reads to N replicas and waiting for R responses. Boundary is transparent to application—client calls db.get(key, QUORUM) and driver handles distribution. Critical: client must specify consistency level (R value) appropriate for use case. R=1 for fast reads with eventual consistency (e.g., product recommendations), R=QUORUM for strong consistency (e.g., user account data), R=ALL for linearizable reads (e.g., financial balances). Boundary enables flexibility—different queries in same application can use different R values based on consistency requirements.",

      "Replica Communication Boundary - Coordinator-to-replica communication is where read quorum protocol executes. Coordinator sends READ requests to R+ replicas concurrently (typically queries all N to handle slow nodes), replicas respond with versioned values (vector clock or timestamp), coordinator collects R responses within timeout. Boundary requires efficient serialization (Protocol Buffers, Thrift) and network protocols (TCP with connection pooling, gRPC). Timeout configuration critical: too short causes quorum failures (R responses don't arrive in time), too long increases read latency. Cassandra uses speculative execution at this boundary: if first R replicas are slow (P99 latency), query additional replicas preemptively to meet SLA. DynamoDB implements adaptive timeouts: adjust timeout based on historical latency percentiles per replica. Boundary is where network partitions manifest—if < R replicas reachable, read fails with quorum error.",

      "Conflict Resolution Boundary - After collecting R responses, coordinator must resolve version conflicts. Boundary is between distributed storage (versioned values from replicas) and client interface (single canonical value). Resolution strategies: last-write-wins (timestamp-based, simple but loses concurrent writes), vector clocks (causality tracking, complex but preserves concurrent writes), multi-value (return all conflicting versions to client for semantic resolution). Cassandra uses last-write-wins: compare timestamps, select value with max timestamp, discard others. Riak uses vector clocks: if versions are concurrent (neither causally dominates), return all versions to client for application-level merge. Boundary requires deterministic resolution—same input versions must always produce same output value (critical for consistency). Anti-entropy at this boundary: if stale replicas detected (version < latest), coordinator triggers read repair (asynchronous write of latest value to stale replicas).",

      "Consistency Level Configuration Boundary - Applications configure quorum parameters (R, W, N) at deployment/runtime. Boundary is between application requirements (consistency vs availability tradeoffs) and database configuration. Cassandra allows per-query consistency levels: SELECT ... USING CONSISTENCY QUORUM. DynamoDB configures at table level: ConsistentRead=true (R=majority). Riak sets R in bucket properties. Common configurations: N=3 (three replicas for durability), R=2, W=2 (R+W=4>N=3 guarantees overlap). Boundary enables tuning for specific use cases: shopping cart reads use R=1 (fast, eventual), checkout reads use R=QUORUM (strong consistency). Production systems often configure different R values per table/keyspace based on data criticality. Misconfiguration at this boundary causes availability issues (R too high, can't tolerate failures) or consistency violations (R+W≤N, no overlap guarantee).",
    ],
  },

  implementations: [
    {
      id: "cassandra-read-quorum",
      name: "Apache Cassandra Read Quorum",
      type: "platform",
      languages: ["java", "cql"],
      description:
        "Cassandra implements tunable read quorum via consistency levels (ONE, QUORUM, LOCAL_QUORUM, EACH_QUORUM, ALL). Client specifies consistency level per query. Coordinator node sends read to R replicas, waits for R responses, resolves conflicts using last-write-wins timestamp, and returns value with highest timestamp. Supports read repair to synchronize stale replicas.",
      links: {
        docs: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html#tunable-consistency",
        github: "https://github.com/apache/cassandra",
      },
      codeSnippet: `-- CQL query with read quorum consistency level
-- QUORUM = majority of replicas (R = floor(N/2) + 1)
SELECT user_id, email, created_at
FROM users
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
USING CONSISTENCY QUORUM;

-- Consistency level options and their read quorum behavior:
-- ONE: R=1 (read from single replica, fastest, eventually consistent)
-- TWO: R=2 (read from two replicas, moderate consistency)
-- THREE: R=3 (read from three replicas)
-- QUORUM: R=floor(N/2)+1 (majority, strong consistency with R+W>N)
-- LOCAL_QUORUM: majority in local datacenter (multi-DC deployment)
-- EACH_QUORUM: majority in each datacenter (global strong consistency)
-- ALL: R=N (read from all replicas, linearizable but low availability)

-- Java client example using Cassandra driver
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.cql.*;
import com.datastax.oss.driver.api.core.ConsistencyLevel;

public class CassandraReadQuorum {
    private final CqlSession session;

    public User getUserWithQuorum(UUID userId) {
        // Prepare statement with QUORUM consistency
        PreparedStatement statement = session.prepare(
            SimpleStatement.builder(
                "SELECT user_id, email, name, created_at FROM users WHERE user_id = ?")
                .setConsistencyLevel(ConsistencyLevel.QUORUM)
                .build()
        );

        // Execute read - driver coordinates quorum automatically
        // 1. Driver identifies N=3 replicas for this partition (via token ring)
        // 2. Sends concurrent reads to all 3 replicas
        // 3. Waits for R=2 responses (QUORUM with N=3)
        // 4. Compares timestamps, selects value with highest timestamp
        // 5. Returns to application
        ResultSet rs = session.execute(statement.bind(userId));
        Row row = rs.one();

        if (row == null) {
            throw new NotFoundException("User not found");
        }

        return new User(
            row.getUuid("user_id"),
            row.getString("email"),
            row.getString("name"),
            row.getInstant("created_at")
        );
    }

    // Configure read timeout and retry policy for quorum reads
    public CqlSession createSessionWithQuorumSettings() {
        return CqlSession.builder()
            .withConfigLoader(DriverConfigLoader.fromClasspath("application.conf"))
            .build();
    }
}

// application.conf - Configure quorum read timeouts
datastax-java-driver {
  basic.request {
    timeout = 2 seconds  # Timeout for quorum reads
    consistency = QUORUM  # Default consistency level
  }

  advanced.retry-policy {
    class = DefaultRetryPolicy
    # Retry on timeout, but don't retry on quorum unavailable
  }

  profiles {
    strong-consistency {
      basic.request.consistency = QUORUM
      basic.request.timeout = 5 seconds
    }
    eventual-consistency {
      basic.request.consistency = ONE
      basic.request.timeout = 1 second
    }
  }
}

// Production configuration: N=3, R=2, W=2 (R+W=4>N=3)
// Guarantees:
// - Read sees latest write (R+W>N overlap)
// - Tolerates 1 node failure for reads (need 2, have 3)
// - Tolerates 1 node failure for writes (need 2, have 3)`,
    },
    {
      id: "dynamodb-consistent-reads",
      name: "AWS DynamoDB Consistent Reads",
      type: "service",
      languages: ["javascript", "python", "java"],
      description:
        "DynamoDB implements read quorum via ConsistentRead parameter. Eventually consistent reads (R=1, default) query single replica for low latency. Strongly consistent reads (R=majority) query majority of replicas ensuring latest data. Coordinator resolves conflicts using version numbers and last-write-wins. Automatically retries on quorum failures with exponential backoff.",
      links: {
        docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html",
      },
      codeSnippet: `// JavaScript/Node.js SDK - DynamoDB Read Quorum
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

// Eventually consistent read (R=1, default)
// - Reads from single replica
// - Low latency (~10ms)
// - May return stale data (< 1 second old)
// - Use for: product listings, recommendations, non-critical data
async function getEventuallyConsistent(userId) {
    const command = new GetItemCommand({
        TableName: "Users",
        Key: { userId: { S: userId } },
        ConsistentRead: false  // R=1 (eventually consistent)
    });

    const response = await client.send(command);
    return response.Item ? unmarshall(response.Item) : null;
}

// Strongly consistent read (R=majority)
// - Reads from majority of replicas (typically 2 out of 3)
// - Higher latency (~20-30ms)
// - Always returns latest data
// - Use for: user accounts, billing, critical reads
async function getStronglyConsistent(userId) {
    const command = new GetItemCommand({
        TableName: "Users",
        Key: { userId: { S: userId } },
        ConsistentRead: true  // R=majority (strongly consistent)
    });

    // DynamoDB SDK handles:
    // 1. Sending read to majority of replicas
    // 2. Waiting for majority responses
    // 3. Resolving version conflicts (highest version wins)
    // 4. Automatic retry with exponential backoff on quorum failure
    const response = await client.send(command);
    return response.Item ? unmarshall(response.Item) : null;
}

// Python SDK - Boto3 DynamoDB Read Quorum
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('Users')

def get_user_eventual(user_id):
    """Eventually consistent read (R=1)"""
    try:
        response = table.get_item(
            Key={'userId': user_id},
            ConsistentRead=False  # R=1
        )
        return response.get('Item')
    except ClientError as e:
        print(f"Error: {e.response['Error']['Message']}")
        return None

def get_user_consistent(user_id):
    """Strongly consistent read (R=majority)"""
    try:
        response = table.get_item(
            Key={'userId': user_id},
            ConsistentRead=True  # R=majority
        )
        return response.get('Item')
    except ClientError as e:
        # Quorum not met - typically due to network partition or node failures
        if e.response['Error']['Code'] == 'InternalServerError':
            # Retry with exponential backoff (SDK handles automatically)
            pass
        return None

# Global Tables - Multi-region read quorum
# DynamoDB Global Tables replicate across regions (N=3 regions)
# Strongly consistent reads query local region only (R=majority of local replicas)
# Eventually consistent reads can query any region (R=1, may be cross-region stale)

# Query with projection to reduce read quorum latency
def get_user_name_consistent(user_id):
    """Consistent read with projection (fetch only needed attributes)"""
    response = table.get_item(
        Key={'userId': user_id},
        ConsistentRead=True,  # R=majority
        ProjectionExpression='userId, #n, email',  # Reduce data transfer
        ExpressionAttributeNames={'#n': 'name'}  # 'name' is reserved keyword
    )
    return response.get('Item')

# Production configuration recommendations:
# - Use ConsistentRead=false (R=1) for 90%+ of reads (performance)
# - Use ConsistentRead=true (R=majority) for:
#   - Read-after-write scenarios (read user's own writes)
#   - Critical business logic (payment processing, inventory)
#   - Admin dashboards (must show current state)
# - DynamoDB automatically configures N (typically 3 replicas)
# - R=majority ensures R + W > N (W=majority for writes)`,
    },
    {
      id: "riak-read-quorum",
      name: "Riak KV Read Quorum",
      type: "platform",
      languages: ["erlang", "java", "python"],
      description:
        "Riak implements configurable read quorum (R parameter) with vector clock-based conflict resolution. Supports R=1 (fast), R=quorum (majority), R=all. Coordinator collects R responses, uses vector clocks to detect causality, returns single value or multiple siblings for application-level resolution. Implements active read repair.",
      links: {
        docs: "https://riak.com/posts/technical/riaks-config-behaviors-part-2/index.html",
        github: "https://github.com/basho/riak",
      },
      codeSnippet: `// Riak Java Client - Read Quorum Configuration
import com.basho.riak.client.api.RiakClient;
import com.basho.riak.client.api.commands.kv.FetchValue;
import com.basho.riak.client.core.query.Location;
import com.basho.riak.client.core.query.Namespace;

public class RiakReadQuorum {
    private final RiakClient client;

    // Eventually consistent read (R=1)
    // - Fast, low latency
    // - May return stale data
    // - Use for: caching, recommendations, analytics
    public User getUserEventual(String userId) throws Exception {
        Location location = new Location(new Namespace("users"), userId);

        FetchValue fetch = new FetchValue.Builder(location)
            .withOption(FetchValue.Option.R, 1)  // Read from 1 replica
            .withOption(FetchValue.Option.TIMEOUT, 1000)  // 1s timeout
            .build();

        FetchValue.Response response = client.execute(fetch);
        return response.getValue(User.class);
    }

    // Quorum read (R=quorum = majority)
    // - Stronger consistency (R+W>N guaranteed)
    // - Higher latency
    // - Use for: user profiles, account data
    public User getUserQuorum(String userId) throws Exception {
        Location location = new Location(new Namespace("users"), userId);

        FetchValue fetch = new FetchValue.Builder(location)
            .withOption(FetchValue.Option.R, "quorum")  // Read from majority
            .withOption(FetchValue.Option.PR, 1)  // At least 1 primary replica
            .withOption(FetchValue.Option.TIMEOUT, 2000)  // 2s timeout
            .withOption(FetchValue.Option.NOTFOUND_OK, false)  // Don't return tombstones
            .build();

        FetchValue.Response response = client.execute(fetch);

        // Handle vector clock conflicts (siblings)
        if (response.hasValues() && response.getValues().size() > 1) {
            // Multiple concurrent writes created siblings
            // Application must resolve conflict
            return resolveUserConflict(response.getValues());
        }

        return response.getValue(User.class);
    }

    // Linearizable read (R=all)
    // - Strongest consistency (read from ALL replicas)
    // - Highest latency, lowest availability
    // - Use for: financial transactions, critical audit data
    public User getUserLinearizable(String userId) throws Exception {
        Location location = new Location(new Namespace("users"), userId);

        FetchValue fetch = new FetchValue.Builder(location)
            .withOption(FetchValue.Option.R, "all")  // Read from ALL replicas (N)
            .withOption(FetchValue.Option.TIMEOUT, 5000)  // Higher timeout
            .build();

        FetchValue.Response response = client.execute(fetch);
        return response.getValue(User.class);
    }

    // Custom conflict resolution using vector clocks
    private User resolveUserConflict(List<RiakObject> siblings) {
        // Application-specific conflict resolution
        // Example: last-write-wins based on application timestamp
        User latestUser = null;
        long latestTimestamp = 0;

        for (RiakObject obj : siblings) {
            User user = obj.getValue(User.class);
            if (user.getUpdatedAt() > latestTimestamp) {
                latestUser = user;
                latestTimestamp = user.getUpdatedAt();
            }
        }

        return latestUser;
    }
}

# Python Riak Client - Read Quorum Example
from riak import RiakClient

client = RiakClient(host='localhost', pb_port=8087)
bucket = client.bucket_type('users').bucket('profiles')

# Eventually consistent read (R=1)
def get_user_eventual(user_id):
    obj = bucket.get(user_id, r=1, timeout=1000)
    return obj.data if obj.exists else None

# Quorum read (R=quorum)
def get_user_quorum(user_id):
    # r='quorum' = majority of N replicas
    # pr=1 = at least 1 primary replica (not fallback)
    obj = bucket.get(user_id, r='quorum', pr=1, timeout=2000)

    # Handle siblings (vector clock conflicts)
    if obj.siblings:
        # Multiple versions exist, resolve conflict
        return resolve_siblings(obj.siblings)

    return obj.data if obj.exists else None

# All replicas read (R=all)
def get_user_all(user_id):
    obj = bucket.get(user_id, r='all', timeout=5000)
    return obj.data if obj.exists else None

def resolve_siblings(siblings):
    """Resolve vector clock conflicts using last-write-wins"""
    latest = max(siblings, key=lambda s: s.data.get('updated_at', 0))
    return latest.data

# Configure bucket properties for read quorum defaults
# N=3, R=2, W=2 (R+W=4>N=3 guarantees overlap)
bucket.set_properties({'n_val': 3, 'r': 2, 'w': 2, 'pr': 1, 'pw': 1})`,
    },
    {
      id: "mongodb-read-concern-majority",
      name: "MongoDB Read Concern Majority",
      type: "platform",
      languages: ["javascript", "java", "python"],
      description:
        "MongoDB implements read quorum via 'read concern majority'. Reads return data only after it's been acknowledged by majority of replica set members (R=majority). Prevents reading uncommitted data that could be rolled back during failover. Coordinator (primary or secondary) queries majority-committed snapshot.",
      links: {
        docs: "https://www.mongodb.com/docs/manual/reference/read-concern-majority/",
      },
      codeSnippet: `// MongoDB Node.js Driver - Read Concern Majority
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017', {
    replicaSet: 'rs0',
    readPreference: 'primaryPreferred'
});

async function getUserWithMajorityReadConcern(userId) {
    const db = client.db('myapp');

    // Read concern 'majority' = read quorum
    // Returns data only after majority of replicas have acknowledged write
    // Prevents reading uncommitted data that could rollback
    const user = await db.collection('users').findOne(
        { _id: userId },
        {
            readConcern: { level: 'majority' },  // R=majority quorum
            maxTimeMS: 5000  // 5s timeout for quorum read
        }
    );

    return user;
}

// Read concern levels and quorum behavior:
// - 'local' (default): R=1, reads from single replica (primary or secondary)
//   Fast but may return uncommitted data
// - 'majority': R=majority, reads majority-committed data
//   Slower but guarantees data won't rollback during failover
// - 'linearizable': R=majority with additional guarantees
//   Strongest consistency, reads reflect all writes before read started

// Python PyMongo - Read Concern Majority
from pymongo import MongoClient, ReadConcern
from pymongo.read_preferences import Primary, PrimaryPreferred

client = MongoClient('mongodb://localhost:27017/?replicaSet=rs0')
db = client['myapp']

def get_user_majority(user_id):
    """Read with majority read concern (quorum read)"""
    # ReadConcern('majority') ensures read quorum
    user = db.users.find_one(
        {'_id': user_id},
        read_concern=ReadConcern('majority'),  # R=majority
        max_time_ms=5000
    )
    return user

def get_user_linearizable(user_id):
    """Linearizable read (strongest consistency)"""
    # Linearizable read concern = read quorum + real-time ordering
    # Must read from primary with read_preference=Primary
    user = db.users.with_options(
        read_concern=ReadConcern('linearizable'),
        read_preference=Primary()
    ).find_one(
        {'_id': user_id},
        max_time_ms=10000  # Higher timeout for linearizable reads
    )
    return user

// Java MongoDB Driver - Read Concern Configuration
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.ReadConcern;
import com.mongodb.ReadPreference;
import org.bson.Document;

public class MongoReadQuorum {
    public Document getUserMajority(String userId) {
        MongoClient client = MongoClients.create(
            "mongodb://localhost:27017/?replicaSet=rs0"
        );

        // Configure read concern majority (R=majority quorum)
        Document user = client.getDatabase("myapp")
            .getCollection("users")
            .withReadConcern(ReadConcern.MAJORITY)  // Read quorum
            .withReadPreference(ReadPreference.primaryPreferred())
            .find(new Document("_id", userId))
            .maxTime(5, TimeUnit.SECONDS)
            .first();

        return user;
    }

    // Transaction with read concern majority
    // Ensures all reads in transaction see majority-committed data
    public void transferWithReadQuorum(String fromId, String toId, double amount) {
        try (ClientSession session = client.startSession()) {
            session.startTransaction(
                TransactionOptions.builder()
                    .readConcern(ReadConcern.MAJORITY)  // Quorum reads
                    .writeConcern(WriteConcern.MAJORITY)  // Quorum writes
                    .build()
            );

            // Read balances with quorum
            Document from = getAccountInSession(session, fromId);
            Document to = getAccountInSession(session, toId);

            // Validate and update...

            session.commitTransaction();
        }
    }
}

// Production configuration:
// - Replica Set: N=3 members (1 primary, 2 secondaries)
// - Read Concern Majority: R=2 (majority of 3)
// - Write Concern Majority: W=2 (majority of 3)
// - R+W=4>N=3 guarantees overlap (see latest write)
// - Tolerates 1 node failure (can still achieve majority)`,
    },
    {
      id: "etcd-read-quorum",
      name: "etcd Linearizable Reads (Read Index)",
      type: "platform",
      languages: ["go"],
      description:
        "etcd implements read quorum via 'read index' operation. Leader confirms it's still the leader by checking with quorum of followers before serving read. Guarantees linearizable reads without reading from disk on every read. Used for Kubernetes configuration and service discovery.",
      links: {
        docs: "https://etcd.io/docs/v3.5/learning/api_guarantees/",
        github: "https://github.com/etcd-io/etcd",
      },
      codeSnippet: `// etcd Go Client - Linearizable Read Quorum
package main

import (
    "context"
    "time"

    clientv3 "go.etcd.io/etcd/client/v3"
)

func main() {
    // Connect to etcd cluster (N=3 nodes)
    client, err := clientv3.New(clientv3.Config{
        Endpoints:   []string{"localhost:2379", "localhost:2380", "localhost:2381"},
        DialTimeout: 5 * time.Second,
    })
    if err != nil {
        panic(err)
    }
    defer client.Close()

    // Linearizable read (default) - uses read index quorum
    // 1. Client sends read to leader
    // 2. Leader checks with quorum (R=majority) that it's still leader
    // 3. Leader serves read from its state machine
    // 4. Guarantees: read sees all committed writes before read
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    resp, err := client.Get(ctx, "/config/database/host")
    if err != nil {
        panic(err)
    }

    if len(resp.Kvs) > 0 {
        // Linearizable read - guaranteed to see latest write
        value := string(resp.Kvs[0].Value)
        revision := resp.Kvs[0].ModRevision
        println("Value:", value, "Revision:", revision)
    }

    // Serializable read (faster, no quorum)
    // Reads from any node without quorum check
    // May return stale data if leader changed
    // Use for: non-critical reads, high throughput scenarios
    ctx2, cancel2 := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel2()

    resp2, err := client.Get(
        ctx2,
        "/config/cache/ttl",
        clientv3.WithSerializable(),  // Skip read quorum (R=1)
    )
    if err != nil {
        panic(err)
    }

    // Serializable read is faster but may be stale
    if len(resp2.Kvs) > 0 {
        value := string(resp2.Kvs[0].Value)
        println("Cached value (may be stale):", value)
    }

    // Watch with read quorum guarantees
    // Ensures watch starts from linearizable point
    watchChan := client.Watch(context.Background(), "/services/", clientv3.WithPrefix())

    for watchResp := range watchChan {
        for _, event := range watchResp.Events {
            println("Event:", event.Type, string(event.Kv.Key), string(event.Kv.Value))
        }
    }
}

// How etcd read index (read quorum) works:
// 1. Client sends Get() request to leader
// 2. Leader checks its commit index (last committed log entry)
// 3. Leader sends heartbeat to quorum of followers (R=majority)
// 4. Followers acknowledge if they recognize leader
// 5. If quorum responds, leader confirms it's current leader
// 6. Leader serves read from its local state machine
// 7. No disk read needed (unlike Raft read from log)
//
// Configuration:
// - N=3 etcd nodes (1 leader, 2 followers)
// - Read quorum (read index): R=2 (leader + 1 follower)
// - Write quorum (Raft consensus): W=2 (majority)
// - R+W=4>N=3 guarantees linearizability
//
// Tradeoffs:
// - Linearizable read (default): Slower (~2x latency), strong consistency
// - Serializable read: Faster (no quorum check), eventual consistency
//
// Use cases:
// - Kubernetes: linearizable reads for API server (see latest pods, services)
// - Service discovery: serializable reads for service lookups (stale OK)
// - Configuration: linearizable reads for critical config changes`,
    },
  ],

  usedInSystems: [
    {
      systemId: "linkedin-voldemort",
      systemName: "LinkedIn Voldemort Key-Value Store",
      howUsed:
        "LinkedIn's Voldemort distributed key-value store implements configurable read quorum for user profile storage serving 900M+ members. Configuration: N=3 replicas per partition, R=2 (read quorum), W=2 (write quorum), ensuring R+W>N overlap. User profile reads (name, headline, photo, connections) use R=2 quorum reads to guarantee consistency—when viewing another user's profile, read must reflect latest updates. High-traffic scenarios (profile search, homepage feed) use R=1 for performance, accepting eventual consistency. Coordinator (any Voldemort node) receives read request, uses consistent hashing to identify 3 replicas for the key, sends concurrent reads to all 3, waits for 2 responses within 100ms timeout, resolves version conflicts using vector clocks, and returns value with highest version. During partition or node failure, if < 2 replicas respond, read fails gracefully showing cached profile data. LinkedIn's approach enables tunable consistency: critical reads (user's own profile edit) use R=QUORUM, non-critical reads (suggested connections) use R=1. Read repair is implemented—when stale replicas detected (version mismatch in quorum responses), coordinator asynchronously writes latest value to lagging replicas. Pattern composition: Read Quorum + Vector Clocks + Consistent Hashing + Read Repair. Impact: Enabled LinkedIn to scale from 100M to 900M members while maintaining <50ms P99 profile read latency; prevented read-after-write inconsistencies where users edit profile but don't see updates (R=2 overlaps with W=2); reduced stale profile data incidents by 90% through read quorum guarantees.",
      source:
        "https://www.project-voldemort.com/voldemort/ (Voldemort Documentation)",
    },
    {
      systemId: "discord-cassandra",
      systemName: "Discord Message Storage (Cassandra)",
      howUsed:
        "Discord's message storage uses Cassandra with read quorum QUORUM (R=majority) for chat message retrieval serving 150M+ monthly active users. Configuration: N=3 replicas per message partition (sharded by channel ID), R=2 (QUORUM), W=2 (QUORUM), ensuring read-your-writes consistency. When user sends message and immediately refreshes channel, read quorum guarantees they see their message (R+W>N overlap). Message queries use LOCAL_QUORUM (majority within datacenter) to minimize cross-region latency—US users read from US replicas (R=2 of 3 US replicas), EU users read from EU replicas. Cassandra coordinator receives message read request, identifies 3 replicas via token ring partitioning, queries all 3 concurrently, waits for 2 responses within 2s timeout, compares timestamps (last-write-wins), and returns message with highest timestamp. During datacenter failure or network partition, if < 2 replicas reachable in local DC, query fails over to remote DC (higher latency) or returns cached messages. Discord's message edit/delete operations use QUORUM writes (W=2), guaranteeing subsequent QUORUM reads (R=2) see edits immediately. Speculative execution is enabled—if first 2 replicas slow (>P95 latency), query additional replicas preemptively to meet 100ms SLA. Pattern composition: Read Quorum + Token Ring Partitioning + Local Quorum (multi-DC) + Speculative Execution + Last-Write-Wins Timestamps. Impact: Maintained <100ms P99 message load latency despite 3-way replication; prevented 'phantom message' bugs where messages appear then disappear (quorum consistency); enabled 99.99% message delivery reliability during datacenter outages through cross-region failover; scaled to 1B+ messages/day with tunable consistency per query type.",
      source:
        "https://discord.com/blog/how-discord-stores-billions-of-messages",
    },
    {
      systemId: "apple-foundationdb",
      systemName: "Apple iCloud (FoundationDB + Cassandra)",
      howUsed:
        "Apple's iCloud infrastructure uses Cassandra with read quorum for metadata storage (file listings, sharing permissions, device sync state) serving 1.5B+ devices. Configuration: N=5 replicas (3 local datacenter, 2 remote), R=3 (QUORUM for strong consistency), W=3 (QUORUM). File metadata reads (Photos app loading albums, iCloud Drive folder listings) use R=3 to guarantee consistency—when user uploads photo on iPhone, subsequent iPad query must see photo immediately. Local quorum optimization: LOCAL_QUORUM (R=2 of 3 local replicas) for latency-sensitive queries accepting datacenter-local consistency, EACH_QUORUM (R=2 in each of 3 DCs) for critical metadata requiring global consistency. Coordinator (Cassandra node closest to user's region) receives metadata read, identifies 5 replicas via consistent hashing, sends concurrent reads to all 5, waits for 3 responses (quorum threshold), resolves timestamp conflicts (last-write-wins), and returns latest metadata version. During network partition isolating 2 replicas, reads succeed with remaining 3 replicas (quorum still met). Apple implements adaptive read quorum—during datacenter degradation, dynamically lower R from 3→2 temporarily (accept weaker consistency to maintain availability). Read repair runs asynchronously—when version mismatch detected in quorum responses, coordinator updates stale replicas in background. Pattern composition: Read Quorum + Multi-Datacenter Replication + LOCAL_QUORUM + Adaptive Quorum + Read Repair + Consistent Hashing. Impact: Enabled iCloud to scale to 1.5B devices with <200ms P99 metadata read latency globally; maintained read-your-writes consistency across devices (upload on iPhone, see on iPad within seconds); achieved 99.95% availability during regional datacenter outages through quorum-based failover; prevented metadata inconsistencies that caused file loss or duplicate uploads.",
      source:
        "https://www.foundationdb.org/files/fdb-paper.pdf (FoundationDB Paper, Apple's usage)",
    },
    {
      systemId: "netflix-viewing-history",
      systemName: "Netflix Viewing History (DynamoDB/Cassandra)",
      howUsed:
        "Netflix's viewing history and watch progress tracking uses read quorum for consistency guarantees across 200M+ subscribers. Implementation uses Cassandra with R=QUORUM (majority of 3 replicas), W=QUORUM configuration. When user pauses show on TV and resumes on phone, read quorum ensures phone sees latest watch position (R+W>N overlap). Viewing history queries (Continue Watching row, watch progress bars) use QUORUM reads to prevent showing stale progress—nothing frustrates users more than seeing 'not started' for show they just watched. Coordinator node receives watch position read, queries all 3 replicas concurrently, waits for 2 responses within 500ms timeout, compares timestamps, and returns position with highest timestamp. Optimization: LOCAL_QUORUM for single-region users (lower latency), EACH_QUORUM for users traveling across regions (global consistency). During peak traffic (popular show release), if quorum reads timeout, Netflix falls back to R=1 (single replica) with stale data marker—show progress may be slightly behind, but UX remains functional. Netflix also uses read quorum for personalized recommendation state—when user rates show, subsequent homepage refresh uses QUORUM read ensuring recommendations reflect rating. Speculative execution is critical—query all 3 replicas immediately (not wait for first 2), use fastest 2 responses, discard slowest—maintains P99 latency during replica degradation. Pattern composition: Read Quorum + LOCAL_QUORUM (multi-region) + Speculative Execution + Timestamp-based Conflict Resolution + Fallback to R=1. Impact: Prevented 'watch position rollback' bugs where progress resets after device switch (quorum consistency); reduced user complaints about incorrect Continue Watching suggestions by 85%; maintained <200ms P99 latency for viewing history queries despite 3-way replication; enabled seamless cross-device viewing experience critical to Netflix's value proposition.",
      source: "https://netflixtechblog.com/",
    },
    {
      systemId: "github-mysql-quorum",
      systemName: "GitHub MySQL Read Replicas with Quorum",
      howUsed:
        "GitHub implements read quorum pattern for critical MySQL queries during replica lag or primary degradation. Normal operation: reads go to primary (R=1, strong consistency). During primary overload (git push storm, CI/CD burst): read queries fan out to R=2 of 3 MySQL replicas (primary + 2 read replicas), application compares results, uses value from primary if available, falls back to majority consensus if primary slow. Configuration: N=3 (1 primary, 2 read replicas), R=2 (quorum for critical reads), typically read from primary only (R=1). Critical queries (repository settings, branch protection rules, webhook configs) use quorum reads—application layer sends identical query to primary and replica concurrently, waits for 2 responses within timeout, compares results, returns primary's value if received (source of truth), otherwise uses replica's value with staleness indicator. Implementation in Rails application: ActiveRecord extension with quorum_read method that executes query against connection pool with read_replica1, read_replica2, primary connections. Compares row versions (updated_at timestamp or MySQL binlog position), selects most recent. During 2018 incident where primary lost quorum due to storage degradation, quorum reads automatically served from read replicas (R=2 from 2 replicas, excluding unavailable primary), maintaining read availability while primary recovered. Replication lag detection: if replica lag exceeds 5 seconds, exclude from quorum (don't count toward R), preventing unacceptably stale data. Pattern composition: Read Quorum + Read Replica Failover + Replication Lag Monitoring + Application-Level Quorum Logic. Impact: Maintained read availability during primary database incident; prevented serving extremely stale data (>5s lag) during replication delays; enabled graceful degradation from strong consistency (R=1 primary) to eventual consistency (R=2 replicas) during failures; reduced user-visible errors by 60% during database overload scenarios.",
      source: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
    },
  ],

  philosophy: {
    coreProblem:
      "Distributed databases replicate data across multiple nodes for fault tolerance and availability, but replication creates consistency challenges. Without read quorum, reading from a single replica risks returning stale data (asynchronous replication lag), missing recent writes (replica hasn't received update), or reading inconsistent values during network partitions. Applications require guarantees that reads reflect recent writes without sacrificing availability.",
    designPrinciple:
      "Read quorum ensures consistency by requiring R out of N replica nodes to respond successfully before returning a value, combined with write quorum W, such that R + W > N mathematically guarantees reads overlap with recent writes. This provides tunable consistency—adjust R to trade off between consistency strength (higher R = stronger consistency, sees fresher data) and availability (lower R = tolerates more failures, faster responses). The key insight: quorum overlap (R+W>N) provides consistency guarantees without requiring consensus protocols, and makes consistency tunable per-query rather than system-wide.",
    historicalContext:
      "Read quorum emerged from Amazon's Dynamo paper (2007) which introduced tunable consistency via configurable N, R, W parameters. Dynamo's insight: different data has different consistency requirements—shopping cart reads can be eventually consistent (R=1), checkout reads need strong consistency (R=QUORUM). Before Dynamo, distributed databases were all-or-nothing: ACID databases (PostgreSQL, MySQL with 2PC) provided strong consistency but poor availability during failures; eventually consistent systems (DNS, caching) provided high availability but no consistency guarantees. Dynamo's quorum model provided the middle ground: configure R, W, N per application needs. LinkedIn adopted Dynamo's approach for Voldemort (2009), using R=2, W=2, N=3 for user profiles—stronger consistency than eventual, better availability than ACID. Facebook's Cassandra (2008, based on Dynamo) popularized configurable consistency levels (ONE, QUORUM, ALL) making read quorum mainstream. The pattern enabled CAP theorem tradeoffs—during network partitions, lower R maintains availability (AP), higher R maintains consistency (CP). AWS DynamoDB (2012) commoditized read quorum with ConsistentRead parameter, making it accessible to all cloud applications. Modern distributed databases (ScyllaDB, YugabyteDB, CockroachDB) implement quorum reads as default, recognizing that tunable consistency is essential for production systems. The evolution: eventual consistency (2000s) → quorum consistency (2010s) → default strong consistency with quorum (2020s, see YugabyteDB defaulting to read quorum).",
    alternativesRejected: [
      "Read from Single Replica (R=1) - Fastest read latency but no consistency guarantees. Replica may be stale (replication lag), partitioned (missed recent writes), or serving old version (concurrent write conflicts). Only acceptable when stale data is tolerable (caching, analytics, recommendations). Rejected for critical reads (user account data, financial transactions) where consistency required.",
      "Read from Primary Only - Provides strong consistency (primary has latest writes) but creates single point of failure and bottleneck. All reads concentrated on primary limits read scalability (can't distribute read load across replicas). During primary failure, all reads fail (low availability). Rejected in favor of quorum which distributes reads across replicas while maintaining consistency via R+W>N overlap.",
      "Read from All Replicas (R=N) - Strongest consistency (linearizable reads) but poor availability and high latency. Single slow or failed replica blocks entire read. Impractical for production systems needing <100ms reads—reading from 3 replicas sequentially takes 3x latency, concurrently still limited by slowest replica. Rejected except for critical audit reads where linearizability required despite availability cost.",
      "Consensus-Based Reads (Raft, Paxos) - Provides strong consistency through distributed consensus but requires majority round-trips on every read (2 network hops minimum). High latency (~10-50ms for consensus vs ~1-5ms for quorum read from local replica). Consensus overhead wasteful for reads since data already replicated. Quorum reads provide similar consistency guarantees (via R+W>N overlap) with lower latency (single round-trip). Consensus reserved for writes and critical operations; quorum used for reads.",
      "Timestamp-Based Consistency Without Quorum - Track logical timestamps (Lamport clocks) and read 'latest' version without querying multiple replicas. Fails during network partitions where replicas diverge—no mechanism to detect which version is truly latest. Requires perfect clock synchronization (impossible in distributed systems). Rejected because quorum voting provides consensus on 'latest' version without relying on clocks.",
      "Sticky Sessions (Always Read from Same Replica) - Application remembers which replica has latest data (e.g., replica it wrote to) and always reads from that replica. Provides read-your-writes consistency but fails when 'sticky' replica fails (single point of failure for that client). Doesn't help with consistency for reads from other clients. Doesn't provide global consistency guarantees. Rejected for multi-client systems needing consistent views across users.",
    ],
    mentalModel:
      "Read quorum is like a jury trial requiring majority agreement to reach a verdict. Instead of trusting a single witness (R=1, might be wrong), or requiring unanimous agreement (R=N, one dissenter blocks verdict), you consult R jurors and accept the majority's conclusion. The key property: if you consult enough jurors (R) and the jury was selected by enough judges (W for writes), there's guaranteed overlap—at least one juror participated in the selection and knows the truth. In distributed systems, replicas are jurors, coordinator is the judge collecting votes, and version numbers are testimony. R=QUORUM (majority) ensures that if majority participated in last write (W=QUORUM), your read jury overlaps with write jury, guaranteeing you see the latest verdict (value).",
  },

  visualization: {
    staticDiagram: `graph TB
    Client[Client: Read Request<br/>GET key='user:123', R=3]
    Coordinator[Coordinator Node<br/>Quorum Orchestrator]

    R1[Replica 1<br/>version=5]
    R2[Replica 2<br/>version=5]
    R3[Replica 3<br/>version=4 stale]
    R4[Replica 4<br/>timeout]
    R5[Replica 5<br/>version=5]

    Resolver[Version Resolver<br/>Select Max Version]
    Response[Response to Client<br/>value='Alice' v5]

    Client -->|1. Send read R=3| Coordinator

    Coordinator -->|2. Concurrent reads| R1
    Coordinator -->|2. Concurrent reads| R2
    Coordinator -->|2. Concurrent reads| R3
    Coordinator -->|2. Concurrent reads| R4
    Coordinator -->|2. Concurrent reads| R5

    R1 -->|3a. Alice v5| Coordinator
    R2 -->|3b. Alice v5| Coordinator
    R3 -->|3c. Alice-old v4| Coordinator
    R4 -.->|timeout 5s| Coordinator
    R5 -->|3d. Alice v5| Coordinator

    Coordinator -->|4. R=3 met<br/>stop waiting| Resolver

    Resolver -->|5. v5 > v4<br/>select highest| Response

    Response -->|6. Return Alice v5| Client

    style Client fill:#e1f5e1
    style Coordinator fill:#e1e5ff
    style Resolver fill:#fff4e1
    style Response fill:#90ee90
    style R3 fill:#ffe1e1
    style R4 fill:#cccccc`,
    realWorldAnalogy:
      "Read quorum is like checking the current temperature by asking multiple thermometers. Instead of trusting one thermometer (might be broken or in direct sunlight), you check R=3 thermometers out of N=5 placed around your yard. If 2 read 75°F and 1 reads 65°F (old reading before sun came out), you trust the majority: 75°F. The R+W>N rule ensures accuracy: if you also require W=3 thermometers to agree when setting the temperature (write quorum), and you read R=3 thermometers, there's guaranteed overlap—at least one thermometer participated in the last update and shows the current temperature. Higher R (read more thermometers) gives you more confidence but takes longer (check each one); lower R is faster but risks trusting a stale thermometer.",
    useCases: [
      {
        domain: "Social Media User Profiles",
        scenario:
          "LinkedIn user edits profile (headline, photo, experience) and immediately refreshes page. Read quorum R=2 (with W=2, N=3) guarantees user sees their update—read overlaps with write, preventing 'edit disappeared' bug. Profile views by other users also use R=2 ensuring everyone sees consistent profile data.",
        patternRole:
          "Provides read-your-writes consistency for user-facing data where stale reads cause user confusion and data integrity issues.",
        companies: ["LinkedIn", "Facebook", "Twitter", "GitHub"],
      },
      {
        domain: "E-commerce Inventory Management",
        scenario:
          "Customer adds last item to cart (inventory decremented to 0 via W=QUORUM write). Next customer queries inventory with R=QUORUM read, sees 0 in stock, preventing overselling. Read quorum ensures inventory reads reflect recent writes (R+W>N overlap).",
        patternRole:
          "Prevents inventory overselling and race conditions by ensuring reads see latest inventory updates across distributed replicas.",
        companies: ["Amazon", "Shopify", "Walmart", "Target"],
      },
      {
        domain: "Messaging and Chat Applications",
        scenario:
          "Discord user sends message in channel (W=QUORUM write to 2 of 3 replicas). Friend refreshes channel with R=QUORUM read (2 of 3 replicas), guaranteed to see message due to quorum overlap. Prevents 'phantom messages' where messages appear then disappear.",
        patternRole:
          "Ensures message consistency across distributed storage, preventing message loss or ordering inconsistencies visible to users.",
        companies: ["Discord", "Slack", "WhatsApp", "Telegram"],
      },
      {
        domain: "Distributed Configuration and Service Discovery",
        scenario:
          "Kubernetes updates pod configuration in etcd (W=majority). Controller manager reads config with linearizable read (R=majority via read index). Quorum ensures controller sees latest config, preventing stale config deployment.",
        patternRole:
          "Provides strong consistency for distributed coordination and configuration, critical for orchestration systems.",
        companies: ["Kubernetes", "etcd", "Consul", "ZooKeeper"],
      },
      {
        domain: "Financial Transactions and Account Balances",
        scenario:
          "Banking app transfers funds (debit account A, credit account B via W=QUORUM). Customer checks balance with R=QUORUM read, guaranteed to see transfer completed (R+W>N overlap). Prevents showing incorrect balance during concurrent transfers.",
        patternRole:
          "Ensures financial data consistency, preventing double-spending, incorrect balances, or lost transactions in distributed ledgers.",
        companies: ["Stripe", "PayPal", "Square", "Banking systems"],
      },
    ],
  },

  references: [
    {
      title: "Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)",
      url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
      type: "research-paper",
      author: "Giuseppe DeCandia et al., Amazon",
    },
    {
      title: "Cassandra: Tunable Consistency and Read Quorum Documentation",
      url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html",
      type: "documentation",
      author: "Apache Cassandra",
    },
    {
      title:
        "DynamoDB: Read Consistency (Eventually Consistent and Strongly Consistent Reads)",
      url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "Riak KV: Understanding Riak's Configurable Behaviors (N, R, W)",
      url: "https://riak.com/posts/technical/riaks-config-behaviors-part-2/index.html",
      type: "article",
      author: "Basho Technologies",
    },
    {
      title:
        "Designing Data-Intensive Applications (Chapter 5: Replication, Quorums)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "MongoDB: Read Concern Majority and Causal Consistency",
      url: "https://www.mongodb.com/docs/manual/reference/read-concern-majority/",
      type: "documentation",
      author: "MongoDB Inc.",
    },
    {
      title: "etcd: Linearizable Read Guarantees via Read Index",
      url: "https://etcd.io/docs/v3.5/learning/api_guarantees/",
      type: "documentation",
      author: "etcd Authors",
    },
    {
      title:
        "Probabilistically Bounded Staleness for Practical Partial Quorums (VLDB 2012)",
      url: "http://pbs.cs.berkeley.edu/",
      type: "research-paper",
      author: "Peter Bailis et al., UC Berkeley",
    },
  ],

  tags: [
    "distributed-systems",
    "consistency",
    "replication",
    "quorum",
    "availability",
    "fault-tolerance",
    "cassandra",
    "dynamodb",
    "eventual-consistency",
    "tunable-consistency",
  ],
  difficulty: "advanced",
};
