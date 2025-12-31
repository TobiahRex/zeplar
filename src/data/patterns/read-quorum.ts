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
};
