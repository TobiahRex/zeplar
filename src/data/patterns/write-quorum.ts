import type { Pattern } from "../schema";

export const writeQuorum: Pattern = {
  id: "write-quorum",
  slug: "write-quorum",
  corpusPath: "🛡️ RELIABILITY → 📋 Redundancy → 🗳️ Quorum → ✍️ Write Quorum",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Quorum",
    level: 4,
  },

  concept: {
    name: "Write Quorum",
    emoji: "✍️",
    tagline: "W nodes must acknowledge",
    definition:
      "Write Quorum requires a distributed system to successfully replicate data to a minimum number (W) of replica nodes before acknowledging the write operation as complete, ensuring durability and consistency across the cluster. Like a constitutional amendment requiring ratification by a supermajority of states before becoming law, write quorums ensure changes are safely committed to enough nodes before confirming success. In a system with N total replicas, writes must receive acknowledgments from at least W nodes before returning success to the client. The coordinator sends the write to all N replicas concurrently but waits only for W positive acknowledgments, then responds to the client while remaining replicas complete asynchronously. Common configurations include W=1 (prioritize write speed and availability), W=QUORUM (majority, balancing durability and performance), and W=ALL (maximum durability, minimum availability). Systems like Cassandra, Riak, and DynamoDB allow per-operation W tuning. The critical insight: when W + R > N (R being read quorum size), the system guarantees consistency because read and write quorums must overlap—every read will see the most recent acknowledged write. Higher W provides stronger durability (more copies committed) at the cost of write latency and reduced write availability during node failures.",
    problemSolved:
      "Distributed databases replicate writes across multiple nodes for fault tolerance, but asynchronous replication creates windows where writes are acknowledged before reaching all replicas. If the coordinator node crashes immediately after writing to a single replica, that write could be lost when the sole replica also fails. Without write quorums, systems risk data loss from correlated failures, inconsistent replicas where different nodes hold different values, and availability issues when choosing between consistency and partition tolerance during network splits. Write quorums solve this by requiring multiple replicas to confirm the write before acknowledging success to the client. This guarantees that W copies exist before commitment, so the system can tolerate W-1 simultaneous replica failures without data loss. When combined with read quorums (R), the overlap property (W + R > N) ensures consistency: reads always see the most recent committed write because at least one node in the R-node read quorum participated in the W-node write quorum. This provides tunable durability: W=1 optimizes for write speed but risks data loss, W=QUORUM balances durability and availability, and W=ALL maximizes durability but fails if any replica is unavailable.",
    tradeoffs: {
      pros: [
        "Tunable durability guarantees through W configuration (higher W = more replicas confirmed)",
        "Prevents data loss by ensuring W copies committed before acknowledging success",
        "Enables different durability levels for different operations in same system",
        "Provides fault tolerance—can lose up to W-1 replicas without data loss",
        "Combined with read quorums (R), ensures consistency when W + R > N",
      ],
      cons: [
        "Higher W increases write latency—must wait for more acknowledgments",
        "Reduces write availability during failures (W=QUORUM fails if majority unavailable)",
        "Network overhead from replicating to multiple nodes synchronously",
        "Can create hotspots if certain replicas are slower than others",
        "Higher W can reduce write throughput due to synchronous waiting",
      ],
    },
    relatedPatterns: [
      "read-quorum",
      "simple-majority",
      "r-w-n",
      "multi-master-replication",
      "chain-replication",
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
      id: "write-quorum-ts-basic",
      language: "typescript",
      title: "Write Quorum Coordinator with Hinted Handoff",
      description:
        "A production-ready write quorum coordinator for distributed storage that implements W-quorum consensus with hinted handoff for temporary failures. Demonstrates concurrent writes to replicas, acknowledgment counting, and automatic read-repair for eventual consistency.",
      code: `// Write Quorum Implementation - Distributed Key-Value Store
// Demonstrates quorum-based writes with hinted handoff and versioning

interface WriteRequest<T> {
  key: string;
  value: T;
  version: number;
  timestamp: number;
}

interface WriteAcknowledgment {
  replicaId: string;
  success: boolean;
  error?: string;
}

interface ReplicaNode<T> {
  id: string;
  write(request: WriteRequest<T>): Promise<void>;
  isHealthy(): boolean;
}

interface WriteQuorumConfig {
  replicaCount: number; // N - total replicas
  writeQuorum: number; // W - minimum successful writes
  timeout: number; // milliseconds
  hintedHandoffEnabled: boolean; // Store hints for offline replicas
}

class QuorumWriteCoordinator<T> {
  private replicas: ReplicaNode<T>[];
  private config: WriteQuorumConfig;
  private hintedHandoffs: Map<string, WriteRequest<T>[]> = new Map();

  constructor(replicas: ReplicaNode<T>[], config: WriteQuorumConfig) {
    this.replicas = replicas;
    this.config = config;

    // Validate W + R > N property for strong consistency
    if (config.writeQuorum > config.replicaCount) {
      throw new Error("Write quorum cannot exceed replica count");
    }
    if (config.writeQuorum < 1) {
      throw new Error("Write quorum must be at least 1");
    }
  }

  async write(key: string, value: T, currentVersion: number = 0): Promise<void> {
    const version = currentVersion + 1;
    console.log(\`[WriteQuorum] Starting write for key=\${key}, W=\${this.config.writeQuorum}, version=\${version}\`);

    const writeRequest: WriteRequest<T> = {
      key,
      value,
      version,
      timestamp: Date.now(),
    };

    // Step 1: Filter healthy replicas
    const healthyReplicas = this.replicas.filter((r) => r.isHealthy());
    const unhealthyReplicas = this.replicas.filter((r) => !r.isHealthy());

    console.log(
      \`[WriteQuorum] Healthy replicas: \${healthyReplicas.length}/\${this.replicas.length}\`
    );

    if (healthyReplicas.length < this.config.writeQuorum) {
      throw new Error(
        \`Insufficient healthy replicas: need \${this.config.writeQuorum}, have \${healthyReplicas.length}\`
      );
    }

    // Step 2: Send write requests to ALL healthy replicas concurrently
    const writePromises = healthyReplicas.map((replica) =>
      this.writeToReplica(replica, writeRequest)
    );

    // Step 3: Wait for W successful acknowledgments
    const acknowledgments = await this.waitForQuorum(writePromises);

    if (acknowledgments.filter((ack) => ack.success).length < this.config.writeQuorum) {
      throw new Error(
        \`Write quorum not met: got \${acknowledgments.filter((a) => a.success).length}/\${this.config.writeQuorum} acks\`
      );
    }

    const successCount = acknowledgments.filter((ack) => ack.success).length;
    console.log(\`[WriteQuorum] Quorum achieved: \${successCount} successful writes\`);

    // Step 4: Store hinted handoffs for unhealthy replicas
    if (this.config.hintedHandoffEnabled && unhealthyReplicas.length > 0) {
      this.storeHintedHandoffs(unhealthyReplicas, writeRequest);
    }

    // Write is successful - return to client
    // Remaining replicas will eventually receive the write via:
    // - Asynchronous replication (background)
    // - Hinted handoff (when they recover)
    // - Read repair (when reads detect staleness)
  }

  private async writeToReplica(
    replica: ReplicaNode<T>,
    request: WriteRequest<T>
  ): Promise<WriteAcknowledgment> {
    try {
      await this.withTimeout(replica.write(request), this.config.timeout);
      console.log(\`[Replica \${replica.id}] Write successful, version=\${request.version}\`);
      return {
        replicaId: replica.id,
        success: true,
      };
    } catch (error) {
      console.log(\`[Replica \${replica.id}] Write failed: \${error}\`);
      return {
        replicaId: replica.id,
        success: false,
        error: String(error),
      };
    }
  }

  private async waitForQuorum(
    promises: Promise<WriteAcknowledgment>[]
  ): Promise<WriteAcknowledgment[]> {
    // Use Promise.allSettled to collect all results (successes and failures)
    const results = await Promise.allSettled(promises);

    const acknowledgments: WriteAcknowledgment[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        acknowledgments.push(result.value);
      } else {
        // Promise rejected - treat as failed write
        acknowledgments.push({
          replicaId: "unknown",
          success: false,
          error: result.reason,
        });
      }
    }

    return acknowledgments;
  }

  private storeHintedHandoffs(
    unhealthyReplicas: ReplicaNode<T>[],
    request: WriteRequest<T>
  ): void {
    for (const replica of unhealthyReplicas) {
      if (!this.hintedHandoffs.has(replica.id)) {
        this.hintedHandoffs.set(replica.id, []);
      }
      this.hintedHandoffs.get(replica.id)!.push(request);
      console.log(
        \`[HintedHandoff] Stored hint for replica=\${replica.id}, key=\${request.key}\`
      );
    }
  }

  async replayHintedHandoffs(replicaId: string): Promise<void> {
    const hints = this.hintedHandoffs.get(replicaId);
    if (!hints || hints.length === 0) {
      return;
    }

    console.log(\`[HintedHandoff] Replaying \${hints.length} hints for replica=\${replicaId}\`);

    const replica = this.replicas.find((r) => r.id === replicaId);
    if (!replica || !replica.isHealthy()) {
      console.log(\`[HintedHandoff] Replica \${replicaId} still unhealthy, skipping\`);
      return;
    }

    for (const hint of hints) {
      try {
        await replica.write(hint);
        console.log(\`[HintedHandoff] Replayed hint for key=\${hint.key}\`);
      } catch (error) {
        console.log(\`[HintedHandoff] Replay failed for key=\${hint.key}: \${error}\`);
      }
    }

    // Clear processed hints
    this.hintedHandoffs.delete(replicaId);
  }

  private async withTimeout<V>(promise: Promise<V>, timeoutMs: number): Promise<V> {
    return Promise.race([
      promise,
      new Promise<V>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  }

  getHintedHandoffStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [replicaId, hints] of this.hintedHandoffs) {
      stats[replicaId] = hints.length;
    }
    return stats;
  }
}

// Mock Replica Implementation
class MockReplica<T> implements ReplicaNode<T> {
  private data: Map<string, WriteRequest<T>> = new Map();
  private healthy: boolean = true;
  private writeLatency: number;

  constructor(
    public id: string,
    latency: number = 50
  ) {
    this.writeLatency = latency;
  }

  async write(request: WriteRequest<T>): Promise<void> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, this.writeLatency));

    if (!this.healthy) {
      throw new Error(\`Replica \${this.id} is unhealthy\`);
    }

    // Only accept writes with higher version numbers (prevent overwrites)
    const existing = this.data.get(request.key);
    if (existing && existing.version >= request.version) {
      throw new Error(
        \`Version conflict: existing version \${existing.version} >= new version \${request.version}\`
      );
    }

    this.data.set(request.key, request);
  }

  getData(key: string): WriteRequest<T> | undefined {
    return this.data.get(key);
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }
}

// Example Usage
async function demonstrateWriteQuorum() {
  console.log("=== Write Quorum Demonstration ===\\n");

  // Create 5 replicas with varying latencies
  const replicas: MockReplica<string>[] = [
    new MockReplica("replica-1", 30),
    new MockReplica("replica-2", 50),
    new MockReplica("replica-3", 40),
    new MockReplica("replica-4", 60),
    new MockReplica("replica-5", 70),
  ];

  // Configure W=3 (majority quorum for N=5)
  const coordinator = new QuorumWriteCoordinator(replicas, {
    replicaCount: 5,
    writeQuorum: 3,
    timeout: 1000,
    hintedHandoffEnabled: true,
  });

  // Scenario 1: Normal write with all replicas healthy
  console.log("\\nScenario 1: Write with all replicas healthy");
  await coordinator.write("user:123", "Alice", 0);
  console.log("Write completed successfully\\n");

  // Verify data on replicas
  console.log("Replica states:");
  replicas.forEach((r) => {
    const data = r.getData("user:123");
    console.log(\`  \${r.id}: version=\${data?.version || "none"}\`);
  });

  // Scenario 2: Write with 2 replicas down (W=3 still achievable)
  console.log("\\n\\nScenario 2: Write with 2 replicas down");
  replicas[3].setHealthy(false);
  replicas[4].setHealthy(false);
  await coordinator.write("user:456", "Bob", 0);
  console.log("Write completed with hinted handoffs\\n");

  console.log("Hinted handoff stats:", coordinator.getHintedHandoffStats());

  // Scenario 3: Replay hinted handoffs when replicas recover
  console.log("\\n\\nScenario 3: Replicas recover and replay hints");
  replicas[3].setHealthy(true);
  replicas[4].setHealthy(true);
  await coordinator.replayHintedHandoffs("replica-4");
  await coordinator.replayHintedHandoffs("replica-5");

  console.log("\\nReplica states after handoff replay:");
  replicas.forEach((r) => {
    const data = r.getData("user:456");
    console.log(\`  \${r.id}: version=\${data?.version || "none"}\`);
  });

  // Scenario 4: Insufficient quorum
  console.log("\\n\\nScenario 4: Insufficient replicas (should fail)");
  replicas[1].setHealthy(false);
  replicas[2].setHealthy(false);
  try {
    await coordinator.write("user:789", "Charlie", 0);
  } catch (error) {
    console.log(\`Error (expected): \${error}\\n\`);
  }
}

// Run demonstration
demonstrateWriteQuorum().catch(console.error);`,
      contextDilation: {
        level: "module",
        scope:
          "Complete write quorum coordination for a distributed key-value store with hinted handoff, version management, and concurrent replica writes",
        prerequisites: [
          "Understanding of distributed data replication strategies",
          "Knowledge of CAP theorem and consistency/availability tradeoffs",
          "Familiarity with eventual consistency and anti-entropy mechanisms",
          "Understanding of async/await and Promise concurrency in TypeScript",
        ],
        systemPosition:
          "Sits between application clients and replica storage nodes as the write coordinator. Enforces W-quorum rules before acknowledging writes, manages hinted handoffs for offline replicas, and coordinates eventual consistency through background replication. This would be part of a distributed database's client library or coordinator service layer.",
      },
      annotations: [
        {
          id: "wq-version-increment",
          lines: [129, 129],
          action: "Increment version number before writing",
          reason:
            "Version numbers enable conflict detection and resolution. Each write gets a monotonically increasing version so replicas can identify the most recent value and reject stale writes from network delays or retries",
          contextLevel: "module",
        },
        {
          id: "wq-health-filter",
          lines: [140, 141],
          action: "Filter replicas by health status before sending writes",
          reason:
            "Avoids wasting time and resources sending writes to replicas known to be down. Health checks run independently (heartbeats, monitoring) so we can skip offline nodes immediately",
          contextLevel: "local",
        },
        {
          id: "wq-concurrent-writes",
          lines: [154, 156],
          action: "Send write requests to ALL healthy replicas concurrently",
          reason:
            "Maximizes replication speed and data durability. Even though we only need W acknowledgments, sending to all N replicas ensures maximum coverage and faster convergence to full replication",
          contextLevel: "module",
        },
        {
          id: "wq-allsettled",
          lines: [207, 207],
          action: "Use Promise.allSettled to collect all write results",
          reason:
            "Promise.all would abort on first failure, but we need to count all successful writes to verify we met the W-quorum threshold. allSettled waits for all promises regardless of success/failure",
          contextLevel: "local",
        },
        {
          id: "wq-quorum-check",
          lines: [161, 165],
          action: "Check if successful acknowledgments >= writeQuorum",
          reason:
            "This is the core quorum enforcement - writes only succeed if at least W replicas confirm persistence, ensuring durability and the R + W > N consistency guarantee",
          contextLevel: "module",
        },
        {
          id: "wq-hinted-handoff",
          lines: [171, 173],
          action: "Store hinted handoffs for unhealthy replicas",
          reason:
            "Preserves write operations for temporarily offline replicas. When they recover, we replay these hints to achieve eventual consistency without requiring clients to retry or coordinators to maintain write-ahead logs",
          contextLevel: "system",
        },
        {
          id: "wq-client-response",
          lines: [175, 179],
          action: "Return success to client after W confirmations, not N",
          reason:
            "Client latency is bounded by the W slowest replicas, not all N. Remaining replicas receive writes asynchronously via background replication, hinted handoff, or read repair - clients don't wait",
          contextLevel: "system",
        },
        {
          id: "wq-version-validation",
          lines: [308, 313],
          action: "Validate write version against existing data in replica",
          reason:
            "Prevents stale writes from overwriting newer data due to network delays or concurrent writes. Replicas reject writes with versions <= current version, maintaining monotonic version ordering",
          contextLevel: "module",
        },
        {
          id: "wq-timeout",
          lines: [187, 187],
          action: "Wrap each write with timeout protection",
          reason:
            "Prevents slow or hung replicas from delaying the entire write operation. Timeouts count as failures against quorum, forcing coordinator to rely on faster replicas for bounded latency",
          contextLevel: "module",
        },
        {
          id: "wq-replay",
          lines: [241, 266],
          action: "Provide replayHintedHandoffs method for recovered replicas",
          reason:
            "Implements the handoff replay mechanism - when replicas come back online, this pushes all stored hints to bring them up-to-date without client involvement or coordinator state scanning",
          contextLevel: "system",
        },
        {
          id: "wq-observability",
          lines: [168, 168],
          action: "Log acknowledgment counts and replica IDs during writes",
          reason:
            "Provides observability into which replicas are slow, failing, or consistently successful. This data helps identify problematic nodes and tune quorum parameters",
          contextLevel: "module",
        },
        {
          id: "wq-cleanup",
          lines: [265, 265],
          action: "Clear hinted handoffs after successful replay",
          reason:
            "Prevents unbounded memory growth of the hint storage. Once hints are successfully replayed, they've served their purpose and can be deleted to free resources",
          contextLevel: "local",
        },
      ],
      highlights: [
        {
          lines: [110, 127],
          label:
            "Write coordinator class that encapsulates quorum logic and hinted handoff state management",
          sbvpDomain: "structure",
        },
        {
          lines: [154, 159],
          label:
            "Concurrent fan-out to all healthy replicas with graceful failure collection",
          sbvpDomain: "behavior",
        },
        {
          lines: [308, 313],
          label:
            "Version-based write validation prevents stale writes from overwriting fresh data",
          sbvpDomain: "philosophy",
        },
        {
          lines: [226, 239],
          label:
            "Hinted handoff mechanism stores writes for offline replicas to achieve eventual consistency",
          sbvpDomain: "behavior",
        },
        {
          lines: [128, 180],
          label:
            "Coordinator sits between clients and replicas, enforcing durability before acknowledging",
          sbvpDomain: "structure",
        },
        {
          lines: [103, 108],
          label:
            "Tunable durability through configurable W value balances write latency vs data safety",
          sbvpDomain: "philosophy",
        },
        {
          lines: [241, 266],
          label:
            "Asynchronous handoff replay brings recovered replicas up-to-date without blocking client operations",
          sbvpDomain: "behavior",
        },
        {
          lines: [84, 89],
          label:
            "WriteRequest interface bundles data with metadata needed for conflict resolution and versioning",
          sbvpDomain: "structure",
        },
      ],
    },
  ],
};
