import type { Pattern } from "../schema";

export const rWN: Pattern = {
  id: "r-w-n",
  slug: "r-w-n",
  corpusPath: "🛡️ RELIABILITY → 📋 Redundancy → 🗳️ Quorum → 🔗 R + W > N",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Quorum",
    level: 4,
  },

  concept: {
    name: "R + W > N",
    emoji: "🔗",
    tagline: "Overlap guarantees consistency",
    definition:
      "R + W > N is a quorum-based consistency rule for replicated data systems where R is the number of replicas that must acknowledge reads, W is the number that must acknowledge writes, and N is the total number of replicas. The rule ensures that read and write quorums overlap, guaranteeing readers see the most recent writes. Think of it like a voting system where you need majority agreement—if 5 people vote (N=5) and you require 3 yes votes to pass (W=3) and ask 3 people if it passed (R=3), at least one person who voted yes will be in your sample, so you'll know the truth. For example, with N=5 replicas, setting R=3 and W=3 ensures R + W = 6 > 5, so every read quorum of 3 replicas must overlap with every write quorum of 3 replicas by at least one replica. This guarantees readers contact at least one replica with the latest write. Systems like Cassandra and DynamoDB use this rule, allowing tunable consistency: high consistency (R=N, W=1) prioritizes read freshness, high availability (R=1, W=1) prioritizes speed, or balanced (R=2, W=2 with N=3) splits the difference.",
    problemSolved:
      "Distributed replicated systems face a trade-off: reading from all replicas ensures consistency but is slow and unavailable if any replica is down; reading from one replica is fast but may return stale data. For example, with 5 replicas, reading from all 5 ensures you see the latest write, but if 2 replicas are offline, all reads fail—unacceptable for high availability. Reading from just 1 replica keeps the system available but that replica might have missed the latest write, returning stale data. The R + W > N rule solves this by requiring only partial quorums: read from R=3 replicas and write to W=3 replicas. Since 3 + 3 = 6 > 5, the read quorum always overlaps with the write quorum, guaranteeing consistency. But reads/writes succeed even if 2 replicas are down. This provides both consistency and availability, avoiding the all-or-one extremes.",
    tradeoffs: {
      pros: [
        "Provides tunable consistency and availability trade-offs by adjusting R and W values without changing N, allowing optimization for specific workload patterns",
        "Guarantees strong consistency (readers see latest writes) with R + W > N while tolerating N - W replica failures for writes and N - R failures for reads",
        "Enables high availability by requiring only partial quorums rather than all replicas, keeping system operational during network partitions and hardware failures",
        "Allows asymmetric optimization like fast writes (W=1) with slower consistent reads (R=N) or vice versa depending on application needs",
      ],
      cons: [
        "Increases latency proportionally to quorum size since operations must wait for R or W replicas to respond, typically adding 50-200ms for cross-datacenter quorums",
        "Creates complexity in conflict resolution when W < N allows concurrent writes to different replica subsets, requiring version vectors or last-write-wins logic",
        "Can still encounter temporary inconsistencies during network partitions even with R + W > N if read quorum doesn't include the most recently written replica",
        "Requires careful tuning of R, W, and N values to balance consistency, availability, and performance goals, with mistakes leading to data loss or inconsistency",
      ],
    },
    relatedPatterns: [
      "leaderless",
      "multi-leader",
      "consistent-hashing",
      "read-replicas",
      "eventual-consistency",
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
      id: "r-w-n-ts-basic",
      language: "typescript",
      title: "R + W > N Quorum System with Tunable Consistency",
      description:
        "A complete distributed storage system demonstrating the R + W > N overlap property. Includes read and write coordinators that work together to guarantee consistency through quorum overlaps, with configurable R/W values to tune the consistency-availability-latency tradeoff dynamically.",
      code: `// R + W > N Implementation - Tunable Consistency System
// Demonstrates how R + W > N guarantees consistency through quorum overlap

interface QuorumConfig {
  N: number; // Total replicas
  R: number; // Read quorum size
  W: number; // Write quorum size
}

interface VersionedData<T> {
  value: T;
  version: number;
  timestamp: number;
}

interface Replica<T> {
  id: string;
  read(key: string): Promise<VersionedData<T> | null>;
  write(key: string, data: VersionedData<T>): Promise<void>;
  isHealthy(): boolean;
}

class QuorumSystem<T> {
  private replicas: Replica<T>[];
  private config: QuorumConfig;

  constructor(replicas: Replica<T>[], config: QuorumConfig) {
    this.replicas = replicas;
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: QuorumConfig): void {
    // Core invariant: R + W must be > N for consistency guarantee
    if (config.R + config.W <= config.N) {
      throw new Error(
        \`Invalid quorum config: R(\${config.R}) + W(\${config.W}) must be > N(\${config.N}) for consistency. Current: \${config.R + config.W} <= \${config.N}\`
      );
    }

    if (config.R < 1 || config.R > config.N) {
      throw new Error(\`R must be between 1 and N(\${config.N}), got \${config.R}\`);
    }

    if (config.W < 1 || config.W > config.N) {
      throw new Error(\`W must be between 1 and N(\${config.N}), got \${config.W}\`);
    }

    console.log(\`[QuorumSystem] Valid config: N=\${config.N}, R=\${config.R}, W=\${config.W}\`);
    console.log(\`[QuorumSystem] Overlap guarantee: \${config.R + config.W - config.N} replica(s) guaranteed in common\`);
    console.log(\`[QuorumSystem] Read tolerance: \${config.N - config.R} replica failures\`);
    console.log(\`[QuorumSystem] Write tolerance: \${config.N - config.W} replica failures\`);
  }

  async write(key: string, value: T): Promise<void> {
    console.log(\`\\n[Write] Starting write operation for key=\${key}, W=\${this.config.W}\`);

    // Get healthy replicas
    const healthyReplicas = this.replicas.filter((r) => r.isHealthy());
    if (healthyReplicas.length < this.config.W) {
      throw new Error(
        \`Cannot achieve write quorum: need \${this.config.W}, have \${healthyReplicas.length} healthy replicas\`
      );
    }

    // Create versioned data
    const versionedData: VersionedData<T> = {
      value,
      version: Date.now(), // Simple version using timestamp
      timestamp: Date.now(),
    };

    // Send writes to ALL healthy replicas concurrently
    const writePromises = healthyReplicas.map((replica) =>
      this.writeToReplica(replica, key, versionedData)
    );

    const results = await Promise.allSettled(writePromises);
    const successCount = results.filter((r) => r.status === "fulfilled").length;

    if (successCount < this.config.W) {
      throw new Error(
        \`Write quorum not met: got \${successCount}/\${this.config.W} acknowledgments\`
      );
    }

    console.log(\`[Write] Success! \${successCount} replicas confirmed (need \${this.config.W})\`);
    console.log(\`[Write] Version: \${versionedData.version}\`);
  }

  async read(key: string): Promise<T | null> {
    console.log(\`\\n[Read] Starting read operation for key=\${key}, R=\${this.config.R}\`);

    // Get healthy replicas
    const healthyReplicas = this.replicas.filter((r) => r.isHealthy());
    if (healthyReplicas.length < this.config.R) {
      throw new Error(
        \`Cannot achieve read quorum: need \${this.config.R}, have \${healthyReplicas.length} healthy replicas\`
      );
    }

    // Send reads to ALL healthy replicas concurrently
    const readPromises = healthyReplicas.map((replica) =>
      this.readFromReplica(replica, key)
    );

    const results = await Promise.allSettled(readPromises);
    const successfulReads = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<VersionedData<T>>).value);

    if (successfulReads.length < this.config.R) {
      console.log(\`[Read] Quorum not met: got \${successfulReads.length}/\${this.config.R} responses\`);
      return null;
    }

    // Select the value with the highest version (most recent write)
    const latest = successfulReads.reduce((max, current) =>
      current.version > max.version ? current : max
    );

    console.log(\`[Read] Success! Read from \${successfulReads.length} replicas (need \${this.config.R})\`);
    console.log(\`[Read] Versions seen: [\${successfulReads.map((r) => r.version).join(", ")}]\`);
    console.log(\`[Read] Selected version: \${latest.version}\`);

    return latest.value;
  }

  private async writeToReplica(
    replica: Replica<T>,
    key: string,
    data: VersionedData<T>
  ): Promise<void> {
    try {
      await replica.write(key, data);
      console.log(\`  [Replica \${replica.id}] Write confirmed\`);
    } catch (error) {
      console.log(\`  [Replica \${replica.id}] Write failed: \${error}\`);
      throw error;
    }
  }

  private async readFromReplica(
    replica: Replica<T>,
    key: string
  ): Promise<VersionedData<T> | null> {
    try {
      const data = await replica.read(key);
      if (data) {
        console.log(\`  [Replica \${replica.id}] Read successful, version=\${data.version}\`);
      }
      return data;
    } catch (error) {
      console.log(\`  [Replica \${replica.id}] Read failed: \${error}\`);
      throw error;
    }
  }

  // Reconfigure quorum parameters at runtime
  reconfigure(newConfig: Partial<QuorumConfig>): void {
    const updated = { ...this.config, ...newConfig };
    this.validateConfig(updated);
    this.config = updated;
    console.log(\`\\n[QuorumSystem] Reconfigured to N=\${updated.N}, R=\${updated.R}, W=\${updated.W}\`);
  }

  getConfig(): QuorumConfig {
    return { ...this.config };
  }
}

// Mock Replica Implementation
class MockReplica<T> implements Replica<T> {
  private storage: Map<string, VersionedData<T>> = new Map();
  private healthy: boolean = true;
  private latency: number;

  constructor(
    public id: string,
    latency: number = 50
  ) {
    this.latency = latency;
  }

  async read(key: string): Promise<VersionedData<T> | null> {
    await new Promise((resolve) => setTimeout(resolve, this.latency));
    if (!this.healthy) throw new Error("Replica unhealthy");
    return this.storage.get(key) || null;
  }

  async write(key: string, data: VersionedData<T>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.latency));
    if (!this.healthy) throw new Error("Replica unhealthy");

    // Accept write with higher version
    const existing = this.storage.get(key);
    if (existing && existing.version > data.version) {
      throw new Error("Stale write rejected");
    }

    this.storage.set(key, data);
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }
}

// Demonstration
async function demonstrateRWN() {
  console.log("=== R + W > N Quorum System Demonstration ===\\n");

  // Create 5 replicas
  const replicas: MockReplica<string>[] = Array.from(
    { length: 5 },
    (_, i) => new MockReplica(\`replica-\${i + 1}\`, 30 + i * 10)
  );

  // Scenario 1: Balanced configuration (R=3, W=3, N=5)
  console.log("\\n--- Scenario 1: Balanced Quorum (R=3, W=3) ---");
  const system1 = new QuorumSystem(replicas, { N: 5, R: 3, W: 3 });

  await system1.write("user:alice", "Alice Smith");
  const value1 = await system1.read("user:alice");
  console.log(\`Final value: \${value1}\`);

  // Scenario 2: Write-optimized (R=4, W=2, N=5)
  console.log("\\n\\n--- Scenario 2: Write-Optimized (R=4, W=2) ---");
  console.log("Use case: Fast writes for logging, slower reads acceptable");
  const system2 = new QuorumSystem(replicas, { N: 5, R: 4, W: 2 });

  await system2.write("log:event1", "System started");
  const value2 = await system2.read("log:event1");
  console.log(\`Final value: \${value2}\`);

  // Scenario 3: Read-optimized (R=2, W=4, N=5)
  console.log("\\n\\n--- Scenario 3: Read-Optimized (R=2, W=4) ---");
  console.log("Use case: Fast reads for cache, slower writes acceptable");
  const system3 = new QuorumSystem(replicas, { N: 5, R: 2, W: 4 });

  await system3.write("cache:session", "session-token-xyz");
  const value3 = await system3.read("cache:session");
  console.log(\`Final value: \${value3}\`);

  // Scenario 4: Handling failures
  console.log("\\n\\n--- Scenario 4: Replica Failures (R=3, W=3) ---");
  const system4 = new QuorumSystem(replicas, { N: 5, R: 3, W: 3 });

  // Take down 2 replicas (still have 3 healthy)
  replicas[3].setHealthy(false);
  replicas[4].setHealthy(false);
  console.log("Marked 2 replicas as unhealthy\\n");

  await system4.write("user:bob", "Bob Jones");
  const value4 = await system4.read("user:bob");
  console.log(\`Final value: \${value4}\`);

  // Scenario 5: Invalid configuration (R + W <= N)
  console.log("\\n\\n--- Scenario 5: Invalid Config (R=2, W=2, N=5) ---");
  try {
    new QuorumSystem(replicas, { N: 5, R: 2, W: 2 });
  } catch (error) {
    console.log(\`Error (expected): \${error}\`);
    console.log("This configuration violates R + W > N and cannot guarantee consistency");
  }

  // Scenario 6: Dynamic reconfiguration
  console.log("\\n\\n--- Scenario 6: Dynamic Reconfiguration ---");
  replicas.forEach((r) => r.setHealthy(true)); // Restore all replicas
  const system6 = new QuorumSystem(replicas, { N: 5, R: 3, W: 3 });

  console.log("\\nNormal hours: balanced configuration");
  await system6.write("config:mode", "normal");

  console.log("\\nPeak traffic: optimize for reads");
  system6.reconfigure({ R: 2, W: 4 });
  const peakRead = await system6.read("config:mode");
  console.log(\`Read during peak: \${peakRead}\`);
}

// Run demonstration
demonstrateRWN().catch(console.error);`,
      contextDilation: {
        level: "system",
        scope:
          "Complete quorum-based distributed storage system implementing R + W > N overlap property for tunable consistency guarantees across reads and writes",
        prerequisites: [
          "Understanding of CAP theorem and consistency models",
          "Knowledge of quorum-based consensus mechanisms",
          "Familiarity with distributed systems concepts (replication, partitions, failures)",
          "Understanding of the tradeoff between consistency, availability, and latency",
        ],
        systemPosition:
          "Core coordination layer of a distributed database. Sits between application clients and replica storage nodes, enforcing quorum rules for both reads and writes. The R + W > N property is the mathematical foundation that guarantees read-after-write consistency by ensuring every read quorum overlaps with every write quorum.",
      },
      annotations: [
        {
          id: "rwn-invariant-validation",
          lines: [110, 130],
          action: "Validate R + W > N invariant in constructor",
          reason:
            "This is the fundamental consistency guarantee - if R + W <= N, read and write quorums might not overlap, allowing reads to miss recent writes. The overlap size (R + W - N) determines how many replicas are guaranteed to be in both quorums",
          contextLevel: "system",
        },
        {
          id: "rwn-overlap-calculation",
          lines: [127, 127],
          action: "Calculate and log overlap size: R + W - N",
          reason:
            "This tells you the minimum guaranteed overlap. For R=3, W=3, N=5: overlap is 1 replica. That single replica in both quorums ensures reads see the latest write. Higher overlap provides stronger guarantees",
          contextLevel: "module",
        },
        {
          id: "rwn-health-check",
          lines: [136, 141],
          action: "Check healthy replica count against both R and W thresholds",
          reason:
            "System availability depends on having enough replicas for quorum. If failures reduce healthy replicas below R, reads fail. Below W, writes fail. This shows the availability tradeoff: higher R/W reduces failure tolerance",
          contextLevel: "module",
        },
        {
          id: "rwn-all-replicas",
          lines: [151, 153],
          action: "Send requests to ALL healthy replicas, not just R or W",
          reason:
            "Maximizes chances of meeting quorum even if some replicas are slow or fail during the operation. Also spreads writes to as many replicas as possible, improving durability and read distribution",
          contextLevel: "module",
        },
        {
          id: "rwn-versioning",
          lines: [144, 148],
          action: "Use timestamp-based versioning for conflict resolution",
          reason:
            "When read quorum returns multiple versions (replication lag), we need a deterministic way to pick the latest. Timestamp-based versioning implements last-write-wins semantics simply and effectively",
          contextLevel: "module",
        },
        {
          id: "rwn-quorum-enforcement",
          lines: [155, 162],
          action: "Count successful responses and enforce R/W thresholds",
          reason:
            "The quorum enforcement point - operations only succeed if we get at least R (reads) or W (writes) successful responses. This is what makes the consistency guarantee work by forcing the overlap",
          contextLevel: "system",
        },
        {
          id: "rwn-reconfigure",
          lines: [237, 242],
          action: "Provide reconfigure method to change R/W at runtime",
          reason:
            "Demonstrates tunability - you can shift the tradeoff dynamically based on workload. High read traffic? Lower R for faster reads. Critical writes? Raise W for durability. Must always maintain R + W > N",
          contextLevel: "system",
        },
        {
          id: "rwn-version-logging",
          lines: [199, 201],
          action: "Log all versions seen during read conflict resolution",
          reason:
            "Provides visibility into replication lag and consistency. If you frequently see multiple versions, some replicas are slow or partitioned. This helps diagnose and tune the system",
          contextLevel: "module",
        },
        {
          id: "rwn-allsettled",
          lines: [155, 155],
          action: "Use Promise.allSettled instead of Promise.all",
          reason:
            "We need to count successes even when some replicas fail. Promise.all aborts on first failure, but we want to collect all results to check if we met the R or W threshold",
          contextLevel: "local",
        },
        {
          id: "rwn-stale-rejection",
          lines: [273, 276],
          action: "Reject writes with stale versions at replica level",
          reason:
            "Defense against network delays and retries. If a delayed write arrives after a newer write, rejecting it maintains monotonic version ordering and prevents data corruption",
          contextLevel: "module",
        },
        {
          id: "rwn-failure-tolerance",
          lines: [128, 129],
          action:
            "Calculate and display failure tolerance for reads and writes",
          reason:
            "Shows the availability tradeoff: N - R is how many replica failures reads can tolerate, N - W for writes. R=W=3, N=5 tolerates 2 failures. R=4, W=2 means reads tolerate 1 failure, writes tolerate 3",
          contextLevel: "system",
        },
      ],
      highlights: [
        {
          lines: [112, 127],
          label:
            "Core invariant validation enforces R + W > N mathematical property for consistency",
          sbvpDomain: "philosophy",
        },
        {
          lines: [100, 108],
          label:
            "QuorumSystem class unifies read and write quorum logic with shared configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [194, 202],
          label:
            "Version-based conflict resolution selects highest version from R-quorum responses",
          sbvpDomain: "behavior",
        },
        {
          lines: [237, 242],
          label:
            "Runtime reconfiguration enables dynamic tuning of consistency-availability-latency tradeoffs",
          sbvpDomain: "philosophy",
        },
        {
          lines: [100, 108],
          label:
            "Quorum system sits as coordination layer between clients and replicas, enforcing overlap",
          sbvpDomain: "structure",
        },
        {
          lines: [128, 129],
          label:
            "Failure tolerance calculation shows availability tradeoffs for different R/W values",
          sbvpDomain: "behavior",
        },
        {
          lines: [87, 91],
          label:
            "VersionedData interface bundles values with causality metadata for conflict resolution",
          sbvpDomain: "philosophy",
        },
        {
          lines: [155, 162],
          label:
            "Concurrent replica operations with Promise.allSettled for graceful partial failure handling",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],
};
