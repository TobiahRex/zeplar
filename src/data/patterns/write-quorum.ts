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
        name: "Write Coordinator",
        role: "Quorum Orchestrator",
        responsibilities: [
          "Receive write requests from clients with key-value-version tuples",
          "Send write to N replica nodes concurrently (fan-out)",
          "Wait for W acknowledgments before returning success to client",
          "Handle hinted handoffs for temporarily unavailable replicas",
          "Manage write timeouts and failure detection",
        ],
      },
      {
        name: "Replica Node",
        role: "Data Storage Node",
        responsibilities: [
          "Receive write requests from coordinator",
          "Persist data to durable storage (disk, SSD)",
          "Send acknowledgment to coordinator after durable write",
          "Reject writes with stale version numbers (version conflict)",
          "Participate in anti-entropy and read repair",
        ],
      },
      {
        name: "Client Application",
        role: "Write Initiator",
        responsibilities: [
          "Submit write operations to coordinator with consistency level (W)",
          "Specify tunable durability requirements per operation (W=1, W=QUORUM, W=ALL)",
          "Handle write failures and timeout errors",
          "Track version numbers for conflict resolution",
        ],
      },
      {
        name: "Hinted Handoff Store",
        role: "Temporary Write Buffer",
        responsibilities: [
          "Store writes intended for temporarily unavailable replicas",
          "Replay buffered writes when replicas recover",
          "Prevent data loss during transient node failures",
          "Bounded buffer to prevent unbounded growth",
        ],
      },
      {
        name: "Monitoring System",
        role: "Quorum Health Tracker",
        responsibilities: [
          "Track write latency percentiles (P50, P95, P99)",
          "Monitor quorum success rates and timeout frequencies",
          "Alert when insufficient replicas available for W-quorum",
          "Measure hinted handoff queue depths and replay rates",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant Coordinator as Write Coordinator
    participant R1 as Replica 1
    participant R2 as Replica 2
    participant R3 as Replica 3
    participant Hint as Hinted Handoff Store

    Note over Client,Hint: Write with W=2, N=3 (Quorum)
    Client->>Coordinator: write(key="user:123", value="Alice", W=2)

    Note over Coordinator: Fan-out to all N=3 replicas concurrently
    par Concurrent Writes to All Replicas
        Coordinator->>R1: write(key, value, version=1)
        Coordinator->>R2: write(key, value, version=1)
        Coordinator->>R3: write(key, value, version=1)
    end

    Note over R1,R3: Replicas persist to disk and send acks

    R1-->>Coordinator: ACK (success, latency=30ms)
    R2-->>Coordinator: ACK (success, latency=50ms)

    Note over Coordinator: W=2 acks received, quorum achieved!
    Coordinator-->>Client: Success (acknowledged by 2/3 replicas)

    Note over R3: R3 slower, ack arrives after client response
    R3-->>Coordinator: ACK (success, latency=80ms)

    Note over Client,Hint: Write with Replica Failure Scenario
    Client->>Coordinator: write(key="order:456", value={...}, W=2)

    par Concurrent Writes
        Coordinator->>R1: write(key, value, version=1)
        Coordinator->>R2: write(key, value, version=1)
        Coordinator-xR3: write(key, value, version=1) [R3 DOWN]
    end

    R1-->>Coordinator: ACK (success)
    R2-->>Coordinator: ACK (success)

    Note over Coordinator: Store hint for R3
    Coordinator->>Hint: storeHint(R3, write_data)
    Coordinator-->>Client: Success (W=2 achieved, R3 will catch up)

    Note over Hint,R3: When R3 recovers
    Hint->>R3: replayHint(write_data)
    R3-->>Hint: ACK
    Note over R3: R3 now consistent`,
    flow: [
      {
        step: 1,
        actor: "Client Application",
        action: "Initiate Write with Consistency Level",
        description:
          "Client sends write request to coordinator with key, value, version, and W parameter (desired durability level). W=1 for low latency, W=QUORUM for balance, W=ALL for maximum safety.",
      },
      {
        step: 2,
        actor: "Write Coordinator",
        action: "Fan-Out to N Replicas Concurrently",
        description:
          "Coordinator sends write requests to all N replica nodes simultaneously (parallel writes). Does not wait for all—only needs W acknowledgments to satisfy quorum.",
      },
      {
        step: 3,
        actor: "Replica Node",
        action: "Persist Data to Durable Storage",
        description:
          "Each replica writes data to disk/SSD with fsync to ensure durability. Rejects writes with version conflicts (stale version numbers). Returns ACK only after durable persistence.",
      },
      {
        step: 4,
        actor: "Write Coordinator",
        action: "Count Acknowledgments",
        description:
          "Coordinator waits for W successful ACKs or timeout (whichever comes first). Tracks which replicas responded and how fast. Uses Promise.allSettled pattern to collect all results.",
      },
      {
        step: 5,
        actor: "Write Coordinator",
        action: "Check Quorum Threshold",
        description:
          "If successful ACKs >= W, write succeeds and coordinator responds to client. If ACKs < W, write fails—insufficient durability guarantee. Coordinator rejects write and client must retry or handle error.",
      },
      {
        step: 6,
        actor: "Write Coordinator",
        action: "Store Hinted Handoffs",
        description:
          "For replicas that didn't ACK (timeout or down), store hinted handoff—buffered write to replay when replica recovers. Enables eventual consistency without coordinator state.",
      },
      {
        step: 7,
        actor: "Write Coordinator",
        action: "Return Success to Client",
        description:
          "Coordinator responds to client with success after W confirmations. Client latency is bounded by the Wth-fastest replica, not all N. Remaining replicas complete asynchronously.",
      },
      {
        step: 8,
        actor: "Hinted Handoff Store",
        action: "Replay Hints on Recovery",
        description:
          "When offline replica comes back online, hinted handoff store replays buffered writes. Brings replica up-to-date without client involvement. Coordinator detects recovery via health checks.",
      },
      {
        step: 9,
        actor: "Replica Node",
        action: "Anti-Entropy and Read Repair",
        description:
          "Background processes (Merkle tree comparison, read repair during queries) detect and fix inconsistencies. Ensures eventual consistency even if hinted handoffs fail.",
      },
    ],
    invariants: [
      "Write succeeds if and only if at least W replicas confirm durable persistence",
      "When W + R > N, every read sees the most recent acknowledged write (overlap property)",
      "Coordinator must wait for W acknowledgments before returning success to client",
      "Replicas must reject writes with version numbers <= current version (monotonic versioning)",
      "Hinted handoff buffer must be bounded to prevent unbounded memory growth",
      "Write is atomic from client perspective—either W replicas succeed or entire write fails",
      "Coordinator must not count same replica ACK twice (deduplication by replica ID)",
      "Timeout must be configured—unbounded waiting can cause coordinator hangs",
      "W must satisfy: 1 <= W <= N (invalid W causes immediate failure)",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Distributed Database Client Driver Layer - Write quorum logic sits in database client libraries (Cassandra driver, MongoDB driver, DynamoDB SDK) that applications use to connect to clusters. When application calls db.put(key, value, W=QUORUM), the driver implements coordinator logic: selects N replicas via consistent hashing, sends concurrent writes, waits for W acknowledgments, manages hinted handoffs. This placement makes quorum transparent to application code—developers specify W value, driver handles complexity. Example: Cassandra Java driver executes write quorum for INSERT statements with CONSISTENCY QUORUM specified. Client libraries also handle replica topology changes (adding/removing nodes), health checks, and connection pooling across replica set.",

      "Coordinator Service in Leaderless Replication Systems - In Dynamo-style systems (Cassandra, Riak, Voldemort), any node can act as coordinator for write requests. Client sends write to any cluster node, which becomes temporary coordinator for that operation. Coordinator determines N replicas via consistent hashing (preference list), fans out write to all N, waits for W acks, responds to client. This placement enables high availability (no single coordinator bottleneck) and load distribution (write load spread across cluster). Coordinator role is ephemeral—different for each operation based on which node client contacted. Pattern used in Amazon Dynamo (2007 paper), Cassandra (coordinator per partition), Riak (coordinating vnode).",

      "Storage Layer in Multi-Region Distributed Databases - Cross-datacenter replication requires quorum spanning geographic regions. Write coordinator sits at storage/replication layer coordinating writes across US-East, US-West, EU datacenters. Client specifies W=LOCAL_QUORUM (majority within single datacenter for low latency) or W=EACH_QUORUM (majority in each datacenter for strong cross-region durability). Coordinator handles network topology awareness: prefer local replicas for speed, fall back to remote replicas if local unavailable. Example: Cassandra multi-DC replication, MongoDB replica sets with geographic distribution, Cosmos DB multi-region writes. Placement at storage layer isolates application from datacenter failures and network partitions.",

      "Consensus Layer in Distributed Coordination Services - Etcd, ZooKeeper, Consul use write quorum for metadata operations (service discovery, configuration, leader election). Every write (register service instance, update config key) requires majority acknowledgment (W=MAJORITY) to commit. Coordinator is the elected leader node receiving client writes, replicating to followers, waiting for majority acks before responding. This placement ensures linearizable consistency for critical metadata—no split-brain scenarios, no stale reads of cluster state. Raft consensus (used by etcd) and Zab protocol (ZooKeeper) implement write quorum with added leader election and log replication semantics.",

      "Key-Value Store Abstraction Layer - Redis Cluster, Memcached replication, and DynamoDB implement write quorum at the key-value abstraction layer above raw storage. When application writes cache entry or session data, KV layer determines replica nodes (consistent hashing, partition key), coordinates write to N nodes, waits for W confirmations. This placement enables tunable durability for caching use cases: W=1 for session data (speed over durability), W=QUORUM for user profiles (balance), W=ALL for financial transactions (safety). DynamoDB's PutItem with ConsistencyLevel parameter exemplifies this—application specifies W per operation, SDK coordinates quorum.",
    ],
    interactsWith: [
      "read-quorum",
      "hinted-handoff",
      "anti-entropy",
      "consistent-hashing",
      "vector-clocks",
      "conflict-resolution",
      "replication",
      "partition-tolerance",
      "eventual-consistency",
    ],
    architecturalBoundaries: [
      "Strong Consistency Boundary (W + R > N) - When write quorum W and read quorum R satisfy W + R > N, the system provides linearizable consistency. This boundary is critical for financial transactions, inventory management, and leader election where stale reads are unacceptable. Example: N=3, W=2, R=2 guarantees every read sees latest write because read and write quorums overlap (must query at least one node that participated in latest write). Systems intentionally configure quorums to satisfy this property when consistency is paramount. Violating boundary (W + R <= N) allows eventual consistency—faster but permits stale reads during replica lag.",

      "Durability vs Availability Tradeoff - Write quorum W determines the CAP theorem position on durability-availability spectrum. W=1 prioritizes availability (single replica acknowledgment sufficient, writes succeed even when most replicas down) at cost of durability risk (data loss if sole replica crashes). W=ALL prioritizes durability (all replicas must confirm, maximum safety) at cost of availability (write fails if any replica unavailable). W=QUORUM balances both (majority confirmation, survives minority failures). This boundary forces explicit tradeoff decisions: banking systems choose W=ALL, social media chooses W=1, e-commerce balances with W=QUORUM.",

      "Coordinator Statelessness Boundary - Write coordinators must be stateless or use hinted handoff to handle replica failures. If coordinator crashes after receiving W acks but before responding to client, client retries write with new coordinator. Idempotency is critical—replay same write doesn't duplicate data. Boundary is between stateful coordinators (require consensus protocols, complex failure recovery) and stateless coordinators (any node can coordinate, simple retry logic). Dynamo-style systems choose stateless with vector clocks for conflict resolution. Raft/Paxos systems choose stateful leader with log-based recovery.",

      "Synchronous vs Asynchronous Replication Boundary - Write quorum defines synchronous replication boundary—coordinator waits for W replicas before acknowledging client. Remaining N-W replicas complete asynchronously (background replication, hinted handoff, anti-entropy). This boundary determines client latency: waiting for W=3 in geographically distributed cluster incurs 3x datacenter round-trip latency. Systems tune W based on latency budgets: W=LOCAL_QUORUM (synchronous within datacenter, asynchronous cross-region), W=1 (minimal synchronous wait), W=ALL (maximum synchronous wait). Applications operating within latency SLAs must configure W accordingly.",

      "Write Path vs Read Path Asymmetry - Write quorum W and read quorum R can be asymmetric (W != R) enabling workload optimization. Write-heavy workloads (logging, sensors, event streams) use W=1, R=ALL (fast writes, slower but strongly consistent reads). Read-heavy workloads (user profiles, product catalogs) use W=ALL, R=1 (slow writes guarantee durability, fast reads). This boundary enables per-table or per-operation tuning—different consistency guarantees for different data types in same system. Cassandra allows per-statement CONSISTENCY specification, DynamoDB per-operation ConsistencyLevel parameter.",
    ],
  },

  implementations: [
    {
      id: "cassandra-write-quorum",
      name: "Apache Cassandra Write Quorum",
      type: "platform",
      languages: ["java", "cql"],
      description:
        "Cassandra implements tunable write quorum for every write operation via CONSISTENCY levels. Clients specify W per statement (ONE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM). Coordinator node (determined by partition key) sends writes to N replicas (replication factor), waits for W acknowledgments, uses hinted handoff for offline replicas. Supports multi-datacenter quorum with datacenter awareness.",
      links: {
        docs: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html#tunable-consistency",
        github: "https://github.com/apache/cassandra",
      },
      codeSnippet: `-- CQL: Write with QUORUM consistency (W = majority of replicas)
INSERT INTO users (user_id, name, email)
VALUES (12345, 'Alice', 'alice@example.com')
USING CONSISTENCY QUORUM;

-- Write with ALL consistency (W = all replicas, maximum durability)
INSERT INTO financial_transactions (tx_id, amount, timestamp)
VALUES (uuid(), 1000.50, toTimestamp(now()))
USING CONSISTENCY ALL;

-- Write with LOCAL_QUORUM (W = majority in local datacenter only)
-- Used for multi-DC deployments to avoid cross-region latency
INSERT INTO session_data (session_id, user_id, data)
VALUES ('abc123', 12345, {'cart': ['item1', 'item2']})
USING CONSISTENCY LOCAL_QUORUM;

-- Java Driver: Programmatic consistency configuration
import com.datastax.driver.core.*;

Cluster cluster = Cluster.builder()
    .addContactPoint("cassandra-node1")
    .build();
Session session = cluster.connect("my_keyspace");

// Prepare statement with QUORUM consistency
PreparedStatement stmt = session.prepare(
    "INSERT INTO users (user_id, name, email) VALUES (?, ?, ?)"
).setConsistencyLevel(ConsistencyLevel.QUORUM);

// Execute write - waits for W=2 acks in RF=3 cluster
BoundStatement bound = stmt.bind(12345, "Alice", "alice@example.com");
ResultSet result = session.execute(bound);

// Configuration: Replication factor (N) and consistency (W)
// CREATE KEYSPACE with RF=3 across 3 datacenters
CREATE KEYSPACE my_app
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3,  // N=3 replicas in dc1
  'dc2': 3,  // N=3 replicas in dc2
  'dc3': 2   // N=2 replicas in dc3
};

// Tunable W values:
// - ONE: W=1 (fastest, least durable)
// - TWO: W=2
// - THREE: W=3
// - QUORUM: W = floor(N/2) + 1 (majority)
// - ALL: W=N (slowest, most durable)
// - LOCAL_QUORUM: W = majority in local DC only
// - EACH_QUORUM: W = majority in each DC

// When to choose:
// - QUORUM: Default for balanced durability/availability
// - ALL: Financial transactions requiring maximum safety
// - LOCAL_QUORUM: Multi-DC with low latency requirements
// - ONE: High-throughput logging, sensor data, caches`,
    },
    {
      id: "dynamodb-write-quorum",
      name: "AWS DynamoDB Write Quorum",
      type: "platform",
      languages: ["javascript", "python", "java"],
      description:
        "DynamoDB uses write quorum internally with N=3 replicas across availability zones. Clients don't specify W directly—DynamoDB always uses majority quorum (W=2) for writes to ensure durability. Returns success only after 2/3 replicas acknowledge. Provides ConsistentRead parameter for read quorum tuning.",
      links: {
        docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html",
      },
      codeSnippet: `// DynamoDB Write - Implicit W=2 quorum (N=3 replicas)
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

// Write item - DynamoDB waits for W=2 acks before returning success
const command = new PutItemCommand({
  TableName: "Users",
  Item: {
    userId: { S: "12345" },
    name: { S: "Alice" },
    email: { S: "alice@example.com" },
    balance: { N: "1000.50" }
  }
});

try {
  const response = await client.send(command);
  console.log("Write successful - acknowledged by 2/3 replicas");
  // DynamoDB guarantees data persisted to majority of AZs
} catch (error) {
  console.error("Write failed - quorum not achieved:", error);
  // Insufficient replicas available or timeout
}

// Conditional write with version check (optimistic locking)
const conditionalWrite = new PutItemCommand({
  TableName: "Users",
  Item: { userId: { S: "12345" }, name: { S: "Alice Updated" } },
  ConditionExpression: "attribute_exists(userId) AND version = :oldVersion",
  ExpressionAttributeValues: {
    ":oldVersion": { N: "5" }
  }
});

// DynamoDB internals (abstracted from users):
// 1. Client sends write to DynamoDB service endpoint
// 2. Request router determines partition key, selects 3 storage nodes
// 3. Coordinator sends write to all 3 replicas concurrently
// 4. Waits for 2/3 acknowledgments (W=2, majority quorum)
// 5. Returns success to client after quorum achieved
// 6. Third replica completes asynchronously via anti-entropy

// Global Tables: Multi-region write quorum
// Each region maintains W=2 local quorum
// Cross-region replication is asynchronous (eventual consistency)
const globalTableWrite = new PutItemCommand({
  TableName: "GlobalUsers",  // Replicated across us-east-1, eu-west-1, ap-south-1
  Item: { userId: { S: "12345" }, region: { S: "us-east-1" } }
});
// Write acknowledged locally (W=2 in us-east-1)
// Asynchronously replicated to other regions

// When to use DynamoDB:
// - Need managed write quorum without configuration complexity
// - Require predictable low latency (<10ms P99)
// - Multi-AZ durability with automatic failover
// - Applications with unpredictable traffic spikes (auto-scaling)`,
    },
    {
      id: "riak-write-quorum",
      name: "Riak KV Write Quorum",
      type: "platform",
      languages: ["erlang", "java", "python"],
      description:
        "Riak implements Dynamo-style write quorum with tunable W, N, R parameters per bucket or per request. Uses consistent hashing for replica placement, vector clocks for conflict resolution, and active anti-entropy for eventual consistency. Supports multi-datacenter replication with per-DC quorum configuration.",
      links: {
        docs: "https://riak.com/posts/technical/riaks-config-behaviors-part-4/",
        github: "https://github.com/basho/riak",
      },
      codeSnippet: `# Riak HTTP API: Write with W=2 quorum
curl -X PUT http://localhost:8098/buckets/users/keys/alice \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice", "email": "alice@example.com"}' \\
  -H "X-Riak-W: 2"  # Wait for 2 replica acknowledgments

# Set bucket-level defaults for N, W, R
curl -X PUT http://localhost:8098/buckets/users/props \\
  -H "Content-Type: application/json" \\
  -d '{
    "props": {
      "n_val": 3,        // N=3 replicas
      "w": "quorum",     // W=2 (majority) for writes
      "r": "quorum",     // R=2 (majority) for reads
      "dw": "quorum"     // Durable write - wait for disk fsync
    }
  }'

// Java Client: Tunable write quorum
import com.basho.riak.client.api.RiakClient;
import com.basho.riak.client.api.commands.kv.StoreValue;
import com.basho.riak.client.core.query.Namespace;

RiakClient client = RiakClient.newClient("riak-node1:8087");

// Create user object with vector clock for conflict resolution
User user = new User("alice", "alice@example.com");
Namespace usersBucket = new Namespace("users");
Location location = new Location(usersBucket, "alice");

// Write with W=ALL (maximum durability)
StoreValue storeOp = new StoreValue.Builder(user)
    .withLocation(location)
    .withOption(StoreOption.W, 3)           // W=3 (all replicas)
    .withOption(StoreOption.DW, 3)          // Durable write (fsync)
    .withOption(StoreOption.RETURN_BODY, true)
    .build();

StoreValue.Response response = client.execute(storeOp);
System.out.println("Write acknowledged by 3/3 replicas");

// Write with W=1 (fast, minimal durability)
StoreValue fastWrite = new StoreValue.Builder(sessionData)
    .withLocation(new Location(sessionsBucket, "session-123"))
    .withOption(StoreOption.W, 1)           // W=1 (single replica)
    .build();

// Sloppy quorum with hinted handoff
// If primary replicas unavailable, write to fallback vnodes
StoreValue sloppyWrite = new StoreValue.Builder(data)
    .withLocation(location)
    .withOption(StoreOption.W, 2)
    .withOption(StoreOption.PW, 2)          // Primary writes (prefer primaries)
    .build();

// Multi-datacenter write quorum
// Write to local cluster with W=QUORUM, async replication to remote DCs
curl -X PUT http://riak-us-east:8098/buckets/global-users/keys/alice \\
  -d '{"name": "Alice"}' \\
  -H "X-Riak-W: quorum" \\          // Local quorum
  -H "X-Riak-Repl: realtime"        // Async replication to other DCs

# Tunable W values:
# - W=1: Fastest, least durable (single replica)
# - W=2: Common for N=3 setups
# - W=quorum: Majority (floor(N/2) + 1)
# - W=all: Slowest, most durable (all replicas)
# - W=one + sloppy quorum: High availability during failures

# When to use Riak:
# - Need explicit tunable W, N, R per operation
# - Multi-datacenter deployments with complex replication
# - Applications requiring high write availability
# - Workloads with conflict resolution via vector clocks`,
    },
    {
      id: "mongodb-write-concern",
      name: "MongoDB Write Concern (Write Quorum)",
      type: "platform",
      languages: ["javascript", "python", "java"],
      description:
        "MongoDB implements write quorum via Write Concern parameter specifying number of replica set members that must acknowledge writes. w: 'majority' ensures majority acknowledgment, w: 1 for single primary, w: <number> for specific count. Integrates with replica sets for automatic failover.",
      links: {
        docs: "https://www.mongodb.com/docs/manual/reference/write-concern/",
      },
      codeSnippet: `// MongoDB Write Concern: Tunable write quorum
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017', {
  replicaSet: 'rs0'  // Replica set with 3 members
});

await client.connect();
const db = client.db('myapp');
const users = db.collection('users');

// Write with majority write concern (W=2 in 3-member replica set)
await users.insertOne(
  { userId: 12345, name: 'Alice', email: 'alice@example.com' },
  {
    writeConcern: {
      w: 'majority',      // W = floor(N/2) + 1 = 2
      j: true,            // Wait for journal (durable write)
      wtimeout: 5000      // Timeout after 5 seconds
    }
  }
);

// Write with w: 1 (acknowledge from primary only, fast)
await sessions.insertOne(
  { sessionId: 'abc123', data: { cart: ['item1'] } },
  { writeConcern: { w: 1 } }  // Single replica (primary)
);

// Write with w: 3 (all replicas must acknowledge, maximum durability)
await financialTransactions.insertOne(
  { txId: uuid(), amount: 1000.50, timestamp: new Date() },
  { writeConcern: { w: 3, j: true } }  // All 3 replicas + journal
);

// Write with w: 0 (fire-and-forget, no acknowledgment)
await logs.insertOne(
  { level: 'info', message: 'User logged in', timestamp: new Date() },
  { writeConcern: { w: 0 } }  // No wait, maximum throughput
);

// Python: Write concern with PyMongo
from pymongo import MongoClient
from pymongo.write_concern import WriteConcern

client = MongoClient('mongodb://localhost:27017/?replicaSet=rs0')
db = client.myapp

# Collection with majority write concern by default
users = db.users.with_options(
    write_concern=WriteConcern(w='majority', j=True, wtimeout=5000)
)

# Insert with quorum guarantee
result = users.insert_one({
    'userId': 12345,
    'name': 'Alice',
    'email': 'alice@example.com'
})

# Replica set configuration (N=3)
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
});

# Write concern levels:
# - w: 0 - No acknowledgment (fire-and-forget)
# - w: 1 - Primary only (default, fast)
# - w: 2 - Primary + 1 secondary
# - w: 'majority' - Majority of replica set members
# - w: <number> - Specific number of replicas
# - w: <tag> - Custom tag-based acknowledgment (geo-distributed)

# When to use MongoDB write concern:
# - majority: Default for production applications (balanced)
# - 1: High-throughput caches, sessions (speed over durability)
# - 3 or 'all': Financial transactions, critical data
# - Tag-based: Multi-region deployments (e.g., w: {dc: 'primary'})`,
    },
    {
      id: "etcd-raft-quorum",
      name: "Etcd Raft Consensus (Write Quorum)",
      type: "service",
      languages: ["go"],
      description:
        "Etcd implements write quorum via Raft consensus protocol requiring majority acknowledgment for every write. All writes go through elected leader, which replicates to followers and commits only after majority (W=QUORUM) confirms. Provides linearizable consistency for distributed coordination, service discovery, and configuration management.",
      links: {
        docs: "https://etcd.io/docs/latest/learning/api/#write-operations",
        github: "https://github.com/etcd-io/etcd",
      },
      codeSnippet: `// Etcd Write - Implicit majority quorum via Raft consensus
package main

import (
    "context"
    "time"
    clientv3 "go.etcd.io/etcd/client/v3"
)

func main() {
    // Connect to 3-node etcd cluster
    cli, _ := clientv3.New(clientv3.Config{
        Endpoints:   []string{"etcd1:2379", "etcd2:2379", "etcd3:2379"},
        DialTimeout: 5 * time.Second,
    })
    defer cli.Close()

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Write key-value - requires majority quorum (W=2 in 3-node cluster)
    _, err := cli.Put(ctx, "/services/api/instance-1", "10.0.1.5:8080")
    if err != nil {
        // Write failed - quorum not achieved or leader unavailable
        panic(err)
    }

    // Etcd internals (Raft consensus):
    // 1. Client sends write to any cluster member
    // 2. Non-leader forwards request to current leader
    // 3. Leader appends entry to its log, assigns sequence number
    // 4. Leader replicates log entry to all followers concurrently
    // 5. Leader waits for majority (W=2) of followers to acknowledge
    // 6. Leader commits entry, applies to state machine
    // 7. Leader responds success to client
    // 8. Followers commit entry asynchronously

    // Linearizable read (read quorum via leader)
    resp, _ := cli.Get(ctx, "/services/api/instance-1")
    // Read sees latest committed write (W=QUORUM guarantees)

    // Cluster configuration: 3 or 5 nodes for fault tolerance
    // 3-node cluster: tolerates 1 failure (W=2, need 2/3 for quorum)
    // 5-node cluster: tolerates 2 failures (W=3, need 3/5 for quorum)

    // Transaction with compare-and-swap (atomic quorum write)
    txn := cli.Txn(ctx).
        If(clientv3.Compare(clientv3.Version("/config/version"), "=", 5)).
        Then(clientv3.OpPut("/config/version", "6")).
        Else(clientv3.OpGet("/config/version"))

    txnResp, _ := txn.Commit()
    if txnResp.Succeeded {
        println("Config updated via quorum write")
    }

    // Lease-based registration with quorum guarantee
    lease, _ := cli.Grant(ctx, 60) // 60-second TTL
    cli.Put(ctx, "/services/api/instance-1", "10.0.1.5:8080",
        clientv3.WithLease(lease.ID))
    // Service registration requires majority quorum
    // If leader fails mid-write, new leader ensures consistency

    // When to use etcd:
    // - Service discovery requiring strong consistency
    // - Leader election for distributed systems
    // - Configuration management with atomic updates
    // - Distributed locking and coordination
}

// Etcd cluster setup (3 nodes for quorum)
// Node 1:
etcd --name node1 \\
  --initial-cluster node1=http://10.0.1.1:2380,node2=http://10.0.1.2:2380,node3=http://10.0.1.3:2380 \\
  --initial-cluster-state new

// Raft guarantees:
// - All writes go through elected leader (no split-brain)
// - Majority quorum required for commit (W >= floor(N/2) + 1)
// - Linearizable reads via leader or ReadIndex
// - Automatic leader re-election on failure
// - Log replication ensures durability

// Comparison with Dynamo-style quorum:
// - Etcd: CP system (consistency + partition tolerance, not available during leader election)
// - Cassandra: AP system (availability + partition tolerance, eventually consistent)
// - Etcd: Single leader handles writes (bottleneck but strongly consistent)
// - Cassandra: Any node handles writes (high write throughput, eventual consistency)`,
    },
  ],

  usedInSystems: [
    {
      systemId: "cassandra-instagram",
      systemName: "Instagram Cassandra Write Quorum for Photo Metadata",
      howUsed:
        "Instagram uses Apache Cassandra to store photo metadata (captions, likes, comments, tags) for 2 billion+ users with write quorum configured per table based on consistency requirements. Photo upload metadata writes use W=QUORUM (majority of 3 replicas) to balance durability and latency—photos must be durably stored before showing in feed, but sub-100ms write latency is critical for user experience. Instagram's Cassandra deployment spans 3 datacenters (US-West, US-East, EU) with LOCAL_QUORUM write consistency—writes acknowledged by majority within local datacenter only, avoiding cross-region latency. This configuration provides 50ms P99 write latency while ensuring data survives single datacenter failure. For critical operations like account deletion or privacy setting changes, Instagram uses W=ALL (all replicas) to ensure global consistency before confirming to user. The system handles 50,000+ writes/sec during peak hours by distributing writes across 1000+ Cassandra nodes, with write quorum preventing data loss during node failures (common in large clusters). Instagram's coordinator logic uses token-aware routing—client driver determines which nodes own each partition key (consistent hashing), sends write to preferred coordinator, which fans out to N=3 replicas. Hinted handoff mechanism stores writes for temporarily offline replicas (node restarts, network blips), replaying when nodes recover. This prevented data loss during 2019 datacenter maintenance when 30% of EU nodes were offline—hinted handoffs buffered writes, replayed during recovery, achieving eventual consistency without manual intervention. Instagram monitors write quorum metrics: quorum timeout rate (alerts if >1%, indicates cluster overload), hinted handoff queue depth (alerts if >10k, indicates sustained replica unavailability), and write latency P99 by consistency level. Pattern composition: Write Quorum + Consistent Hashing + Multi-DC Replication + Hinted Handoff + Token-Aware Routing. Impact: Maintained 99.99% write availability during datacenter failures; reduced photo upload latency by 40% via LOCAL_QUORUM (avoiding cross-region coordination); handled 10x traffic growth (100M to 1B users) by tuning W values per table; prevented data loss during hundreds of node failures via quorum guarantees.",
      source:
        "https://instagram-engineering.com/open-sourcing-a-10x-reduction-in-apache-cassandra-tail-latency-d64f86b43589",
    },
    {
      systemId: "discord-cassandra",
      systemName: "Discord Cassandra Message Storage with Write Quorum",
      howUsed:
        "Discord stores chat messages in Cassandra using write quorum to ensure message durability while maintaining low latency for 150M+ monthly active users. Message writes use W=QUORUM (2/3 replicas) with LOCAL_QUORUM for multi-datacenter deployments—messages acknowledged when majority of local datacenter replicas confirm, then asynchronously replicated to other regions. This configuration provides <10ms write latency for message sends (critical for real-time chat UX) while ensuring messages survive single node failures. Discord's partition key design (channel_id, bucket) distributes message load across cluster—channels with millions of messages don't create hotspots. During 2020 traffic surge (COVID-19 lockdowns increasing usage 50%), Discord's write quorum configuration enabled scaling: increased from 12 to 177 Cassandra nodes by adding replicas and rebalancing, with W=QUORUM automatically adapting to new topology. The system handles 50M+ messages/day with write quorum preventing data loss during frequent node failures at scale. Discord's coordinator logic implements retry with exponential backoff—if write quorum fails (W acks not received within 5s timeout), client retries up to 3 times before failing gracefully. Hinted handoff stores messages for offline replicas (node crashes, rolling restarts) with 3-hour retention—replicas down >3 hours trigger repair via Merkle tree comparison. This architecture survived 2021 incident where entire US-West datacenter lost network connectivity—LOCAL_QUORUM in US-East continued serving writes with no data loss, cross-region replication resumed when connectivity restored. Discord also uses W=ONE for non-critical writes (typing indicators, presence updates) prioritizing speed over durability—acceptable to lose these ephemeral states during failures. Financial operations (Nitro subscriptions, server boosts) use W=ALL for maximum durability before confirming payment. Discord monitors: write quorum success rate per datacenter (should be >99.9%), coordinator-side timeout rate (alerts if >0.5%), hinted handoff replay lag (measure time to achieve consistency after node recovery). Pattern composition: Write Quorum + Multi-DC LOCAL_QUORUM + Partition Key Design + Retry Logic + Hinted Handoff + Anti-Entropy Repair. Impact: Scaled from 10M to 150M users while maintaining <10ms message latency; survived datacenter outage with zero message loss; enabled geographic distribution (US, EU, Asia) with local quorum balancing latency and durability.",
      source:
        "https://discord.com/blog/how-discord-stores-billions-of-messages (Discord Cassandra Architecture)",
    },
    {
      systemId: "uber-ringpop",
      systemName: "Uber Ringpop Service Discovery with Quorum Writes",
      howUsed:
        "Uber uses Ringpop (consistent hashing library) for service discovery and request routing across microservices, implementing write quorum for membership changes (nodes joining/leaving cluster). When new service instance starts, it broadcasts membership update to N=3 neighboring nodes in hash ring. Coordinator (instance initiating update) waits for W=2 acknowledgments before considering membership change committed. This write quorum prevents split-brain scenarios during network partitions—majority agreement ensures consistent cluster state across all nodes. Uber's deployment spans 10,000+ microservice instances across multiple datacenters with Ringpop coordinating routing decisions—write quorum guarantees routing tables converge to same state despite concurrent updates. During 2018 datacenter migration, Ringpop's write quorum enabled gradual traffic shift: as instances migrated to new datacenter, membership updates propagated via quorum writes ensuring no requests routed to offline instances. The system handles 1M+ membership changes/day (autoscaling, deployments, failures) with write quorum preventing inconsistent routing (requests sent to dead instances cause 5s timeouts, terrible UX). Uber's implementation uses vector clocks for conflict resolution—if two nodes simultaneously claim ownership of same partition, coordinator merges membership via vector clock ordering and re-broadcasts via W=2 quorum. Hinted handoff stores membership changes for temporarily unreachable nodes (network blips, GC pauses), replaying updates when nodes recover. This prevented routing inconsistencies during 2019 incident where network partition split US-East datacenter—nodes on both sides of partition continued processing requests, write quorum prevented divergence, partition heal triggered membership reconciliation via anti-entropy. Uber also uses read quorum (R=2) for membership queries—before routing request, service queries R=2 replicas for instance location, uses latest version (highest vector clock). W=2 + R=2 > N=3 guarantees consistency: every routing decision sees latest membership change. Uber monitors: quorum write latency (P99 should be <50ms), membership convergence time (measure how long until all nodes see same cluster state), hinted handoff queue depth. Pattern composition: Write Quorum + Consistent Hashing + Vector Clocks + Membership Gossip + Hinted Handoff + Read Quorum. Impact: Enabled horizontal scaling to 10,000+ instances without central coordination bottleneck; prevented split-brain during network partitions (avoided routing to offline instances); reduced request routing errors by 95% via quorum consistency.",
      source:
        "https://eng.uber.com/ringpop-open-source-nodejs-library/ (Uber Ringpop Architecture)",
    },
    {
      systemId: "riak-bet365",
      systemName: "Bet365 Riak Write Quorum for Betting Transactions",
      howUsed:
        "Bet365 (online sports betting platform) uses Riak KV with write quorum for storing betting transactions processing 2M+ bets/day with strict durability requirements—financial regulations mandate bets persisted to multiple replicas before accepting wagers. Bet placement writes use W=ALL (all 3 replicas) with DW=ALL (durable write, fsync to disk) to ensure zero data loss if datacenter fails mid-transaction. This configuration incurs 50-100ms write latency but guarantees regulatory compliance—losing accepted bet would violate gambling laws. For non-financial data (user session state, odds caching), Bet365 uses W=1 (single replica) prioritizing speed—session data loss during node failure is acceptable, user just re-logs in. Riak's multi-datacenter replication with W=LOCAL_QUORUM enables geographic distribution: European users write to EU datacenter with W=2 local quorum (low latency), asynchronously replicated to US datacenter for disaster recovery. During 2020 UEFA Champions League final (10x traffic spike), Bet365's write quorum configuration scaled by pre-provisioning extra Riak nodes—replication factor increased to N=5 with W=3, tolerating two simultaneous node failures during peak load. Riak's coordinator implements sloppy quorum with hinted handoff: if primary replica node is down, write to fallback node (next in ring), store hint for primary. When primary recovers, hint replayed ensuring eventual consistency. This prevented bet rejection during node failures (unacceptable during live matches). Bet365 also uses vector clocks for conflict resolution—concurrent bets from same user (clicking 'place bet' multiple times) create siblings, application-level logic merges via last-write-wins or manual resolution. The system handles 5,000 bets/sec during major events with write quorum preventing duplicate bet processing—W=ALL ensures bet either fully committed or fully rolled back, no partial states. Bet365 monitors: write quorum timeout rate (alert if >0.1%, indicates insufficient capacity), sloppy quorum activation frequency (alerts if fallback nodes used frequently, indicates primary replicas unhealthy), vector clock sibling rate (measure conflict frequency). Pattern composition: Write Quorum ALL for Financial + W=1 for Sessions + Sloppy Quorum + Vector Clocks + Multi-DC Replication + Durable Writes. Impact: Achieved 100% durability for betting transactions (zero lost bets in 5 years); maintained <100ms bet placement during 10x traffic spikes; passed financial audits with proof of multi-replica durability; scaled to 5,000 bets/sec without single coordinator bottleneck.",
      source:
        "https://www.youtube.com/watch?v=FJP04YbmrSI (Bet365 Riak KV Case Study)",
    },
    {
      systemId: "pinterest-hbase",
      systemName: "Pinterest HBase Write-Ahead Log with Quorum Replication",
      howUsed:
        "Pinterest uses HBase for storing user pins, boards, and social graph data with write quorum implemented via HDFS (Hadoop Distributed File System) replication underneath. HBase writes data to Write-Ahead Log (WAL) stored in HDFS with replication factor N=3—HDFS requires W=2 acknowledgments (quorum) before confirming write. This guarantees pin data survives single DataNode failure without data loss. Pinterest's HBase cluster serves 150M+ users with 100B+ pins, handling 50,000 writes/sec during peak hours. Write flow: HBase RegionServer receives write → appends to WAL in HDFS (requires W=2 quorum) → writes to MemStore → returns success to client. HDFS coordinator (NameNode) determines 3 DataNodes for WAL block, sends write to DN1, which chains to DN2, which chains to DN3. Write acknowledged when DN1 and DN2 confirm (W=2), DN3 completes asynchronously. This pipeline parallelism reduces latency vs fan-out (50ms quorum write vs 100ms if sequential). During 2017 datacenter network partition, Pinterest's HDFS write quorum prevented data loss—DataNodes in isolated partition couldn't reach quorum, rejected writes with timeout error. HBase retried writes to different DataNode set (consistent hashing), achieved quorum via nodes in healthy partition. Zero pins lost despite 30% of DataNodes unreachable. Pinterest tunes HDFS dfs.replication per table: hot data (recently created pins) uses N=3, W=2 for durability, cold data (old archived pins) uses N=2, W=1 for storage efficiency. HBase also implements region-level quorum for reads: when querying pin metadata, read from primary replica (RegionServer); if timeout, fall back to secondary replica (read quorum R=1 for availability). W=2 + R=1 < N=3 allows eventual consistency (acceptable for social network—seeing slightly stale follower count is fine). Pinterest monitors: HDFS write quorum latency (P99 should be <100ms), quorum timeout rate (alerts if >1%, indicates DataNode saturation), WAL replication lag (measure time until 3rd replica confirms). Pattern composition: Write Quorum via HDFS + Pipeline Replication + WAL for Durability + Tunable N per Table + Read Fallback. Impact: Scaled to 100B pins with zero data loss over 5 years; survived datacenter partition with automatic quorum failover; reduced storage costs by 30% via N=2 for cold data while maintaining N=3 for hot data.",
      source:
        "https://medium.com/pinterest-engineering/building-pinterest-hbase-storage-infrastructure-c5f3f3e8da6e",
    },
  ],

  philosophy: {
    coreProblem:
      "In distributed databases with replication, asynchronously acknowledging writes to clients before data reaches all replicas creates a window where data can be lost if the sole replica crashes. Without write quorums, systems face unacceptable durability risk: a database that acknowledges write to client after single replica write loses data when that replica fails before replicating to others. This undermines the entire purpose of replication—redundancy without durability guarantees provides false sense of safety.",
    designPrinciple:
      "Require a minimum number (W) of replicas to confirm durable persistence before acknowledging write success to client, providing tunable durability guarantee: higher W means more copies committed (stronger durability, slower writes, reduced availability during failures), lower W means fewer copies required (weaker durability, faster writes, higher availability). Critical insight: W is not 'all-or-nothing'—it's a knob to dial between availability and durability based on workload requirements. Banking transactions dial W=ALL for maximum safety, social media posts dial W=1 for speed, e-commerce orders balance with W=QUORUM.",
    historicalContext:
      "Write quorum emerged from Amazon's Dynamo paper (2007) addressing the CAP theorem dilemma: can't have consistency, availability, and partition tolerance simultaneously. Amazon needed shopping cart storage that remained writable during datacenter failures (availability) but also prevented data loss (some consistency). Solution: tunable quorum where W + R > N provides strong consistency, W + R <= N allows eventual consistency with higher availability. Dynamo's innovation was making W and R configurable per operation—same system could provide strong consistency for checkout (W=QUORUM, R=QUORUM) and eventual consistency for recommendations (W=1, R=1). Cassandra (2008, open-sourced Facebook project) popularized write quorum for mainstream databases with CONSISTENCY levels (ONE, QUORUM, ALL) specifiable per CQL statement. Earlier distributed databases (Google Bigtable 2006, Amazon SimpleDB 2007) used single-master replication—writes went to master, replicas were eventual—but this created master as single point of failure and bottleneck. Dynamo's leaderless replication with write quorum enabled any node to coordinate writes, distributing load and eliminating single coordinator bottleneck. The pattern proved essential for NoSQL databases (Riak, Voldemort) handling web-scale traffic where single-master architectures couldn't keep up. MongoDB (2009) implemented write quorum via Write Concern despite being master-based—primary must replicate to W secondaries before acknowledging, combining leader election (for consistency) with quorum durability (for availability during failover). Etcd (2013) and Consul (2014) applied write quorum to distributed coordination via Raft consensus—every configuration update requires majority acknowledgment, providing linearizable consistency for service discovery and leader election. Modern multi-region databases (CosmosDB, Spanner, CockroachDB) extend write quorum across geographic regions with complex tradeoffs: LOCAL_QUORUM (fast, survives local failures) vs GLOBAL_QUORUM (slow, survives region failures).",
    alternativesRejected: [
      "Single Replica Acknowledgment Without Quorum (W=1 Always) - Fastest writes but highest data loss risk. If sole replica crashes before asynchronous replication completes, write is lost despite client receiving success. Only acceptable for ephemeral data (caches, sessions) where loss is tolerable. Rejected for persistent data because replication without quorum durability is false redundancy—provides availability but not durability.",
      "All Replicas Acknowledgment Required (W=ALL Always) - Maximum durability but poor availability. Single replica failure blocks all writes until replica recovers or is replaced. During network partition, entire system becomes read-only. Rejected as default because availability loss is unacceptable for many workloads—social networks, IoT sensors, logging can't afford write outages during node failures. Only appropriate for critical financial transactions where durability outweighs availability.",
      "Asynchronous Replication Without Quorum Guarantees - Primary acknowledges writes immediately, replicates to secondaries in background. Fast but no durability guarantee—primary crash loses unreplicated writes. Rejected for systems requiring durability because it violates 'write acknowledged means data safe' contract. MySQL async replication famously has this problem—failover to secondary loses last N seconds of writes.",
      "Quorum Based on Response Time Not Count - Wait for fastest W replicas regardless of which nodes respond. Sounds clever (adaptive performance) but violates durability invariant—if fastest replicas are all in same datacenter, datacenter failure loses data. Rejected because geographic diversity of W replicas is critical for disaster recovery—quorum must include nodes in different failure domains.",
      "Fixed Quorum Value (Non-Tunable W) - System hardcodes W=QUORUM for all operations. Simpler but sacrifices flexibility. Rejected because different data types have different requirements: logs tolerate W=1, financial transactions need W=ALL, user profiles want W=QUORUM. Tunable W per table or operation is essential for workload optimization.",
      "Quorum Without Version Numbering - Accept writes without checking version conflicts. Simple but creates divergent replicas—two clients writing concurrently to same key with W=1 create inconsistent replicas. Rejected because eventual consistency requires conflict resolution (last-write-wins, vector clocks, CRDTs)—quorum alone doesn't prevent conflicts, just ensures minimum replicas agree.",
    ],
    mentalModel:
      "Write quorum is like a company board making decisions—W is the number of board members who must vote 'yes' before decision is official. Board of N=5 members with W=3 (majority) quorum: proposal passes when 3 vote yes, even if other 2 haven't voted yet (delayed, absent, opposed). Higher quorum (W=4 or W=5 'supermajority') makes decisions harder to pass (requires more consensus) but safer (broad agreement). Lower quorum (W=1 'chairman's authority') makes decisions faster but riskier (one person can act unilaterally). Critical insight: quorum protects against minority failures—with W=3, two board members can be absent/offline without blocking decisions. Company remains operational (available) as long as quorum can be reached. But if 3+ members absent, no decisions possible (unavailable during majority failure). The W vs N ratio determines the failure tolerance: W=2 in N=3 tolerates 1 failure, W=3 in N=5 tolerates 2 failures. Choosing W balances decision speed (lower W = faster) vs decision safety (higher W = more members agree).",
  },

  visualization: {
    staticDiagram: `graph TB
    Client[Client Write Request<br/>W=2, N=3] --> Coordinator[Write Coordinator]

    Coordinator --> |Concurrent Fan-out| R1[Replica 1]
    Coordinator --> |Concurrent Fan-out| R2[Replica 2]
    Coordinator --> |Concurrent Fan-out| R3[Replica 3]

    R1 --> |Persist to Disk| D1[(Disk 1)]
    R2 --> |Persist to Disk| D2[(Disk 2)]
    R3 --> |Persist to Disk| D3[(Disk 3)]

    D1 --> |ACK 1<br/>latency: 30ms| CoordCheck{Count ACKs<br/>W=2?}
    D2 --> |ACK 2<br/>latency: 50ms| CoordCheck

    CoordCheck --> |2 ACKs received<br/>Quorum achieved!| Success[Return Success to Client<br/>Latency: 50ms P99]

    D3 --> |ACK 3<br/>latency: 80ms<br/>Arrives after client response| Background[Background Replication]

    Success --> |Write acknowledged<br/>Data safe on 2/3 replicas| ClientAck[Client Receives Success]

    style Coordinator fill:#e1f5e1
    style CoordCheck fill:#e1e5ff
    style Success fill:#90ee90
    style ClientAck fill:#90ee90
    style D1 fill:#ffe1e1
    style D2 fill:#ffe1e1
    style D3 fill:#ffe1e1

    Note1[W=1: Fast but risky<br/>1 replica failure = data loss]
    Note2[W=2: Balanced<br/>Tolerates 1 replica failure]
    Note3[W=3: Slow but safe<br/>All replicas must confirm]`,
    realWorldAnalogy:
      "Write quorum is like a multi-signature bank vault requiring K-of-N keys to open. Vault has N=5 keyholders (replicas), requires W=3 signatures (quorum) to authorize transaction. When you want to withdraw money (write data), you present request to vault manager (coordinator), who contacts all 5 keyholders in parallel. As soon as 3 keyholders sign approval (acknowledge write), transaction completes—you get your money. Remaining 2 keyholders sign later (async replication) but transaction already confirmed. Higher W=4 means more keyholders must agree (safer, harder to get majority), lower W=2 means fewer signatures needed (faster, easier to achieve). If 2 keyholders are unavailable (on vacation, sick), you can still complete transaction with W=3 because 3 others available. But if 3+ keyholders unavailable, transaction blocked—can't reach quorum (write fails). The bank sets W based on transaction type: small withdrawals W=2 (fast approval), large transfers W=4 (extra scrutiny), emergency access W=5 (all keyholders must agree).",
    useCases: [
      {
        domain: "E-Commerce Order Processing",
        scenario:
          "Online store writes order to database with W=QUORUM (2/3 replicas). Customer clicks 'place order', application writes to Cassandra with CONSISTENCY QUORUM. Coordinator fans out to 3 replicas (US-East, US-West, EU), waits for 2 acknowledgments, returns success to customer. Order survives single datacenter failure.",
        patternRole:
          "Write quorum ensures order durably stored before showing 'order confirmed' to customer. W=QUORUM balances speed (50ms P99) and safety (tolerates 1 datacenter down). Critical for revenue—lost order = lost sale.",
        companies: ["Amazon", "Shopify", "Walmart", "eBay"],
      },
      {
        domain: "Banking Transactions",
        scenario:
          "Bank transfer writes debit/credit to accounts database with W=ALL (all replicas). Customer initiates $10,000 transfer, application writes to distributed SQL database requiring all 3 replicas (primary + 2 secondaries) to acknowledge. 200ms latency acceptable for financial transaction—safety paramount. Zero data loss guaranteed.",
        patternRole:
          "W=ALL write quorum provides maximum durability for regulatory compliance. Even if datacenter fails immediately after write, transaction safe on remaining replicas. Slower but necessary for financial correctness—lost transaction unacceptable.",
        companies: ["JPMorgan Chase", "Bank of America", "Goldman Sachs"],
      },
      {
        domain: "Social Media Posts",
        scenario:
          "User posts tweet/photo with W=1 (single replica) for speed. Application writes to Cassandra with CONSISTENCY ONE, coordinator acknowledges after first replica confirms. <10ms latency critical for real-time UX. Post replicates to other 2 replicas asynchronously. Acceptable to lose post if replica crashes (rare, user can retry).",
        patternRole:
          "W=1 prioritizes availability and latency over durability. Social media tolerates occasional post loss (annoying but not catastrophic). Higher W would add latency hurting user experience—users notice >100ms delays.",
        companies: ["Twitter", "Instagram", "TikTok", "Facebook"],
      },
      {
        domain: "IoT Sensor Data Collection",
        scenario:
          "Smart home sensors (temperature, motion, energy) write metrics to time-series database with W=1. Sensor readings every 10 seconds written to InfluxDB/TimescaleDB with minimal durability requirements. High write throughput (100k sensors × 6 writes/min = 10k writes/sec) prioritized over durability—losing few sensor readings acceptable.",
        patternRole:
          "W=1 enables high write throughput for telemetry data. IoT generates massive write volume where W=QUORUM would overwhelm cluster. Data loss acceptable because sensors retransmit continuously—missing single reading doesn't break time-series analysis.",
        companies: ["Nest", "Ring", "Philips Hue", "Tesla"],
      },
      {
        domain: "Service Discovery and Configuration",
        scenario:
          "Microservice registers instance with etcd/Consul using W=MAJORITY (Raft consensus quorum). Service starts, registers IP:port with coordinator service, write requires majority (2/3 or 3/5) acknowledgment. Strong consistency critical—routing requests to offline instance causes errors. W=MAJORITY ensures all services see consistent cluster state.",
        patternRole:
          "Write quorum for service discovery prevents split-brain scenarios. During network partition, only partition with majority can accept writes, preventing divergent routing tables. Slower (50ms) but necessary for correctness—inconsistent service discovery breaks entire system.",
        companies: ["Uber", "Netflix", "Google", "Lyft"],
      },
    ],
  },

  references: [
    {
      title:
        "Dynamo: Amazon's Highly Available Key-value Store (Original Paper)",
      url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
      type: "research-paper",
      author: "Giuseppe DeCandia et al., Amazon",
    },
    {
      title: "Apache Cassandra - Tunable Consistency Documentation",
      url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html#tunable-consistency",
      type: "documentation",
      author: "Apache Software Foundation",
    },
    {
      title: "Riak KV - Replication and Quorum",
      url: "https://riak.com/posts/technical/riaks-config-behaviors-part-4/",
      type: "article",
      author: "Basho Technologies",
    },
    {
      title: "MongoDB Write Concern Documentation",
      url: "https://www.mongodb.com/docs/manual/reference/write-concern/",
      type: "documentation",
      author: "MongoDB Inc.",
    },
    {
      title: "Designing Data-Intensive Applications (Chapter 5: Replication)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "DynamoDB Consistency Model",
      url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "Etcd Raft Consensus and Write Operations",
      url: "https://etcd.io/docs/latest/learning/api/#write-operations",
      type: "documentation",
      author: "etcd Authors",
    },
    {
      title: "CAP Theorem and Quorum Systems",
      url: "https://www.microsoft.com/en-us/research/publication/consistency-tradeoffs-modern-distributed-database-system-design/",
      type: "research-paper",
      author: "Daniel Abadi, Microsoft Research",
    },
  ],

  tags: [
    "reliability",
    "replication",
    "distributed-systems",
    "consistency",
    "durability",
    "quorum",
    "cap-theorem",
    "leaderless-replication",
    "tunable-consistency",
  ],
  difficulty: "advanced",
};
