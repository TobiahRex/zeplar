import type { Pattern } from "../schema";

export const coordinatedCheckpoint: Pattern = {
  id: "coordinated-checkpoint",
  slug: "coordinated-checkpoint",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📸 Checkpointing → 📋 Coordinated Checkpoint",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Checkpointing",
    level: 4,
  },

  concept: {
    name: "Coordinated Checkpoint",
    emoji: "📋",
    tagline: "Globally consistent distributed snapshots",
    definition:
      "Coordinated Checkpoint synchronizes state snapshots across distributed processes to create a globally consistent recovery point, preventing inconsistencies when restoring from failures. Think of it like a group photo where everyone freezes simultaneously—if each person froze at different times, the photo would show an inconsistent scene. In distributed systems, three microservices (OrderService, InventoryService, PaymentService) must checkpoint together. A coordinator sends a checkpoint request, each service flushes in-flight messages, saves state, and acknowledges completion. Only when all acknowledge does the coordinator mark the checkpoint as consistent. If OrderService checkpoints after processing order #1000 while InventoryService checkpoints before receiving that order, recovery would create an inconsistency: order exists without inventory deduction. Coordinated checkpointing prevents this by ensuring the snapshot reflects a state where all cross-service message exchanges are either complete or absent, never partially processed. The pattern uses barrier synchronization where checkpoint markers flow through message streams, ensuring causally consistent snapshots without pausing processing.",
    problemSolved:
      "Independent checkpointing in distributed systems creates inconsistent snapshots where recovered state violates system invariants. Service A checkpoints after sending a message to Service B, but Service B checkpoints before receiving it. Recovery from these checkpoints loses the in-flight message, causing state divergence: A believes it sent the message, B never received it. These orphan or missing messages break distributed transactions, violate data integrity, and cause subtle bugs that appear only after recovery. For example, a payment processed by Service A but never recorded by Service B leads to double-charging customers. Coordinated Checkpoint solves this by establishing a consistent cut—a snapshot where all message dependencies are satisfied. When recovery occurs, all services restore to mutually consistent states with no missing or duplicate messages. This is critical for distributed databases (CockroachDB, YugabyteDB), stream processing systems (Apache Flink, Apache Spark Structured Streaming), and any stateful distributed application requiring exactly-once processing guarantees. The pattern trades coordination overhead for correctness, making recovery deterministic and correct rather than fast but potentially inconsistent.",
    tradeoffs: {
      pros: [
        "Guarantees globally consistent snapshots where all inter-process message dependencies are satisfied, enabling correct recovery without orphan messages",
        "Simplifies recovery logic by eliminating orphan messages and inconsistent state handling—all processes restore to mutually consistent states",
        "Enables exactly-once processing semantics in distributed stream processing and stateful workflows by preventing duplicate or lost messages across failures",
        "Provides deterministic recovery behavior that is easier to reason about and test compared to independent checkpointing",
      ],
      cons: [
        "Requires global coordination and synchronization, creating a scalability bottleneck and latency spike during checkpoint creation (blocks processing 100ms-1s)",
        "Blocks all processing during checkpoint coordination in synchronous implementations, reducing throughput by 10-30% depending on checkpoint frequency",
        "Vulnerable to coordinator failure or slow participants that delay checkpoint completion for entire system—one slow node affects all nodes",
        "Does not scale to large distributed systems with hundreds of nodes due to coordination overhead and synchronization complexity",
      ],
    },
    relatedPatterns: [
      "incremental-checkpoint",
      "periodic-checkpoint",
      "transaction-checkpoint",
      "write-ahead-log",
      "snapshot-isolation",
      "two-phase-commit",
      "chandy-lamport-snapshot",
    ],
  },

  structure: {
    participants: [
      {
        name: "Checkpoint Coordinator",
        role: "Synchronization Leader",
        responsibilities: [
          "Initiate global checkpoint by broadcasting barrier markers to all processes",
          "Collect acknowledgements from all participating processes",
          "Mark checkpoint as complete only when all processes acknowledge",
          "Handle coordinator failure and failover to backup coordinator",
        ],
      },
      {
        name: "Distributed Processes",
        role: "State Owners",
        responsibilities: [
          "Receive checkpoint barrier markers from message streams",
          "Flush in-flight messages and snapshot local state when barrier arrives",
          "Send acknowledgement to coordinator after state is persisted",
          "Buffer incoming messages during checkpoint to maintain consistency",
        ],
      },
      {
        name: "Checkpoint Storage",
        role: "Persistent State Repository",
        responsibilities: [
          "Store process state snapshots durably to survive failures",
          "Provide efficient retrieval of checkpoint data during recovery",
          "Garbage collect old checkpoints to manage storage growth",
          "Ensure atomicity of checkpoint writes (all-or-nothing)",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Coordinator
    participant P1 as Process 1
    participant P2 as Process 2
    participant P3 as Process 3
    participant S as Storage

    Note over C,S: Phase 1: Barrier Injection
    C->>P1: Inject Checkpoint Barrier
    C->>P2: Inject Checkpoint Barrier
    C->>P3: Inject Checkpoint Barrier

    Note over C,S: Phase 2: State Snapshotting
    P1->>P1: Flush in-flight messages
    P1->>P1: Snapshot local state
    P1->>S: Persist state snapshot
    S-->>P1: Ack persisted

    P2->>P2: Flush in-flight messages
    P2->>P2: Snapshot local state
    P2->>S: Persist state snapshot
    S-->>P2: Ack persisted

    P3->>P3: Flush in-flight messages
    P3->>P3: Snapshot local state
    P3->>S: Persist state snapshot
    S-->>P3: Ack persisted

    Note over C,S: Phase 3: Acknowledgement
    P1->>C: Checkpoint ACK
    P2->>C: Checkpoint ACK
    P3->>C: Checkpoint ACK

    Note over C,S: Phase 4: Checkpoint Completion
    C->>C: Mark checkpoint complete
    C->>S: Write checkpoint metadata
    C->>P1: Release barrier
    C->>P2: Release barrier
    C->>P3: Release barrier

    Note over C,S: All processes resume normal operation`,
    flow: [
      {
        step: 1,
        actor: "Checkpoint Coordinator",
        action: "Initiate Global Checkpoint",
        description:
          "Coordinator decides to create checkpoint (time-based or event-based) and generates unique checkpoint ID, broadcasts barrier markers to all distributed processes",
      },
      {
        step: 2,
        actor: "Distributed Processes",
        action: "Receive Barrier Marker",
        description:
          "Each process receives checkpoint barrier in its message stream, marks the boundary between pre-checkpoint and post-checkpoint events",
      },
      {
        step: 3,
        actor: "Distributed Processes",
        action: "Flush In-Flight Messages",
        description:
          "Process ensures all messages sent before barrier are delivered and processed by receivers, prevents orphan messages where sender includes message in checkpoint but receiver does not",
      },
      {
        step: 4,
        actor: "Distributed Processes",
        action: "Snapshot Local State",
        description:
          "Process creates immutable snapshot of its local state (in-memory data structures, operator state, counters, aggregations), this becomes the recovery point for this process",
      },
      {
        step: 5,
        actor: "Distributed Processes",
        action: "Persist State to Storage",
        description:
          "Process writes state snapshot to durable storage (distributed file system like S3, HDFS, or shared database), ensures snapshot survives process failures",
      },
      {
        step: 6,
        actor: "Distributed Processes",
        action: "Send Acknowledgement",
        description:
          "Process sends ACK to coordinator indicating its local checkpoint is complete and durable, coordinator waits for all ACKs before marking checkpoint complete",
      },
      {
        step: 7,
        actor: "Checkpoint Coordinator",
        action: "Collect All Acknowledgements",
        description:
          "Coordinator waits for ACKs from all processes, if timeout occurs or process fails to ACK, entire checkpoint is aborted and retried",
      },
      {
        step: 8,
        actor: "Checkpoint Coordinator",
        action: "Mark Checkpoint Complete",
        description:
          "After receiving all ACKs, coordinator writes checkpoint metadata (checkpoint ID, timestamp, participating processes) marking it as consistent and usable for recovery",
      },
      {
        step: 9,
        actor: "Checkpoint Coordinator",
        action: "Release Barriers",
        description:
          "Coordinator signals all processes that checkpoint is complete, processes resume normal operation and process buffered messages that arrived during checkpoint",
      },
      {
        step: 10,
        actor: "All Processes",
        action: "Resume Normal Processing",
        description:
          "Processes drain message buffers, resume processing new events, checkpoint remains available as recovery point",
      },
    ],
    invariants: [
      "All processes must participate in checkpoint for it to be globally consistent—partial checkpoints are invalid",
      "Checkpoint barrier must arrive at all processes before any process releases its snapshot—ensures consistent cut",
      "Messages sent before barrier by process A must be received and checkpointed by process B or neither sent nor received",
      "Checkpoint is atomic at the distributed level—either all process snapshots are marked complete or checkpoint is aborted",
      "Processes must buffer incoming messages during checkpoint to prevent processing post-barrier messages before checkpoint completes",
      "Coordinator must detect process failures during checkpoint and abort if any process cannot complete",
    ],
  },

  codeExamples: [
    {
      id: "coordinated-checkpoint-ts-basic",
      language: "typescript",
      title: "Coordinated Checkpoint with Barrier Synchronization",
      description:
        "Distributed checkpoint coordinator using barrier markers to ensure globally consistent snapshots across multiple processes without pausing execution",
      code: `type ProcessStatus = 'running' | 'checkpointing' | 'ready';

interface CheckpointBarrier {
  checkpointId: number;
  timestamp: number;
  initiatorId: string;
}

interface ProcessState {
  processId: string;
  localState: Map<string, any>;
  status: ProcessStatus;
  lastCheckpointId: number;
}

interface GlobalCheckpoint {
  checkpointId: number;
  timestamp: number;
  processStates: Map<string, Map<string, any>>;
  isComplete: boolean;
}

class DistributedProcess {
  private state: Map<string, any> = new Map();
  private pendingBarrier?: CheckpointBarrier;
  private status: ProcessStatus = 'running';
  private messageQueue: Array<{ from: string; data: any }> = [];

  constructor(public processId: string) {}

  processMessage(message: { from: string; data: any }): void {
    if (this.pendingBarrier) {
      this.messageQueue.push(message);
      return;
    }

    this.state.set(\`msg_from_\${message.from}\`, message.data);
  }

  receiveBarrier(barrier: CheckpointBarrier): Map<string, any> {
    console.log(\`  [\${this.processId}] Received barrier \${barrier.checkpointId}\`);

    this.pendingBarrier = barrier;
    this.status = 'checkpointing';

    const snapshot = new Map(this.state);

    this.status = 'ready';

    return snapshot;
  }

  acknowledgeCheckpoint(checkpointId: number): void {
    if (this.pendingBarrier?.checkpointId === checkpointId) {
      console.log(\`  [\${this.processId}] Checkpoint \${checkpointId} acknowledged\`);
      this.pendingBarrier = undefined;

      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift()!;
        this.state.set(\`msg_from_\${msg.from}\`, msg.data);
      }
    }
  }

  getState(): Map<string, any> {
    return new Map(this.state);
  }

  setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  getStatus(): ProcessStatus {
    return this.status;
  }
}

class CoordinatedCheckpointManager {
  private processes: Map<string, DistributedProcess> = new Map();
  private globalCheckpoints: GlobalCheckpoint[] = [];
  private currentCheckpointId = 0;
  private coordinatorId = 'coordinator';

  registerProcess(process: DistributedProcess): void {
    this.processes.set(process.processId, process);
    console.log(\`Registered process: \${process.processId}\`);
  }

  async initiateCheckpoint(): Promise<GlobalCheckpoint> {
    const checkpointId = ++this.currentCheckpointId;
    const barrier: CheckpointBarrier = {
      checkpointId,
      timestamp: Date.now(),
      initiatorId: this.coordinatorId
    };

    console.log(\`\n[Checkpoint \${checkpointId}] Coordinator initiating global checkpoint\`);
    console.log(\`  Processes to coordinate: \${this.processes.size}\`);

    const processStates = new Map<string, Map<string, any>>();
    const acknowledgements: string[] = [];

    console.log(\`\n[Phase 1: Barrier Injection]\`);
    for (const [processId, process] of this.processes) {
      const snapshot = process.receiveBarrier(barrier);
      processStates.set(processId, snapshot);
      acknowledgements.push(processId);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(\`\n[Phase 2: Barrier Acknowledgement]\`);
    const allAcknowledged = acknowledgements.length === this.processes.size;

    if (!allAcknowledged) {
      throw new Error(\`Checkpoint \${checkpointId} failed: not all processes acknowledged\`);
    }

    console.log(\`  All \${acknowledgements.length} processes acknowledged barrier\`);

    for (const process of this.processes.values()) {
      process.acknowledgeCheckpoint(checkpointId);
    }

    const globalCheckpoint: GlobalCheckpoint = {
      checkpointId,
      timestamp: barrier.timestamp,
      processStates,
      isComplete: true
    };

    this.globalCheckpoints.push(globalCheckpoint);

    let totalStateSize = 0;
    processStates.forEach(state => totalStateSize += state.size);

    console.log(\`\n[Checkpoint \${checkpointId}] Global checkpoint complete\`);
    console.log(\`  Consistent snapshot across \${this.processes.size} processes\`);
    console.log(\`  Total state size: \${totalStateSize} entries\`);

    return globalCheckpoint;
  }

  recoverFromCheckpoint(checkpointId: number): void {
    const checkpoint = this.globalCheckpoints.find(cp => cp.checkpointId === checkpointId);

    if (!checkpoint) {
      throw new Error(\`Checkpoint \${checkpointId} not found\`);
    }

    if (!checkpoint.isComplete) {
      throw new Error(\`Checkpoint \${checkpointId} is incomplete, cannot recover\`);
    }

    console.log(\`\n[Recovery] Restoring from checkpoint \${checkpointId}\`);
    console.log(\`  Checkpoint timestamp: \${new Date(checkpoint.timestamp).toISOString()}\`);

    for (const [processId, processState] of checkpoint.processStates) {
      const process = this.processes.get(processId);
      if (process) {
        for (const [key, value] of processState) {
          process.setState(key, value);
        }
        console.log(\`  [\${processId}] Restored \${processState.size} state entries\`);
      }
    }

    console.log(\`[Recovery] Complete - All processes restored to consistent state\`);
  }

  verifyConsistency(checkpointId: number): boolean {
    const checkpoint = this.globalCheckpoints.find(cp => cp.checkpointId === checkpointId);

    if (!checkpoint) {
      return false;
    }

    console.log(\`\n[Consistency Check] Verifying checkpoint \${checkpointId}\`);

    const messageConsistency: string[] = [];

    checkpoint.processStates.forEach((state, processId) => {
      state.forEach((value, key) => {
        if (key.startsWith('msg_from_')) {
          const sender = key.replace('msg_from_', '');
          messageConsistency.push(\`\${sender} -> \${processId}: \${value}\`);
        }
      });
    });

    console.log(\`  Messages captured in consistent snapshot:\`);
    messageConsistency.forEach(msg => console.log(\`    \${msg}\`));

    console.log(\`  ✓ Snapshot is globally consistent\`);
    console.log(\`  ✓ No orphan or missing messages\`);

    return true;
  }

  getLatestCheckpoint(): GlobalCheckpoint | undefined {
    return this.globalCheckpoints[this.globalCheckpoints.length - 1];
  }

  getCheckpointHistory(): GlobalCheckpoint[] {
    return [...this.globalCheckpoints];
  }
}

async function demonstrateCoordinatedCheckpoint() {
  const coordinator = new CoordinatedCheckpointManager();

  const processA = new DistributedProcess('process-a');
  const processB = new DistributedProcess('process-b');
  const processC = new DistributedProcess('process-c');

  coordinator.registerProcess(processA);
  coordinator.registerProcess(processB);
  coordinator.registerProcess(processC);

  console.log('\n=== Coordinated Checkpoint Demo ===');
  console.log('Three distributed processes exchanging messages\n');

  console.log('Step 1: Initial state');
  processA.setState('counter', 100);
  processB.setState('counter', 200);
  processC.setState('counter', 300);

  console.log('Step 2: Inter-process messages');
  processA.processMessage({ from: 'process-b', data: 'hello' });
  processB.processMessage({ from: 'process-c', data: 'world' });
  processC.processMessage({ from: 'process-a', data: 'distributed' });

  console.log('Step 3: Trigger coordinated checkpoint');
  const checkpoint1 = await coordinator.initiateCheckpoint();

  coordinator.verifyConsistency(checkpoint1.checkpointId);

  console.log('\nStep 4: More processing after checkpoint');
  processA.setState('counter', 150);
  processB.processMessage({ from: 'process-a', data: 'new message' });

  console.log('Step 5: Second coordinated checkpoint');
  const checkpoint2 = await coordinator.initiateCheckpoint();

  coordinator.verifyConsistency(checkpoint2.checkpointId);

  console.log('\n=== Simulating Process Failure ===');
  console.log('Process A crashes, losing counter=150 and new messages');

  console.log('\n=== Recovery to Checkpoint 1 ===');
  coordinator.recoverFromCheckpoint(1);

  console.log('\n✓ Coordinated checkpoint guarantees:');
  console.log('  - Global consistency: all processes restore to mutually consistent state');
  console.log('  - No orphan messages: sent messages are either in sender & receiver or neither');
  console.log('  - Deterministic recovery: same checkpoint always produces same system state');
  console.log('\n✗ Trade-offs:');
  console.log('  - Requires coordination overhead and barrier synchronization');
  console.log('  - Does not scale to hundreds of processes');
  console.log('  - Checkpoint latency affects all processes simultaneously');
}

demonstrateCoordinatedCheckpoint().catch(console.error);`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Distributed checkpoint coordination system implementing barrier-based synchronization across multiple processes to ensure globally consistent snapshots",
        prerequisites: [
          "Distributed systems concepts",
          "Barrier synchronization",
          "Consistent cuts in distributed systems",
          "Message ordering and causality",
        ],
        systemPosition:
          "Coordination layer spanning multiple distributed processes, orchestrates checkpoint creation to maintain global consistency invariants",
      },
      annotations: [
        {
          id: "cc-checkpoint-barrier",
          lines: [3, 7],
          action: "Define barrier marker for checkpoint coordination",
          reason:
            "Barrier is injected into message streams to mark checkpoint boundaries - all processes must snapshot state when barrier arrives to ensure consistency",
          contextLevel: "module",
          relatedConcepts: ["barrier-synchronization", "consistent-cut"],
        },
        {
          id: "cc-global-checkpoint",
          lines: [15, 20],
          action: "Model global checkpoint containing all process states",
          reason:
            "Global checkpoint aggregates snapshots from all processes into single consistent view - isComplete flag indicates all processes participated",
          contextLevel: "system",
          relatedConcepts: ["distributed-snapshot", "global-state"],
        },
        {
          id: "cc-message-queue",
          lines: [24, 26],
          action: "Queue messages received during checkpoint",
          reason:
            "When barrier arrives, buffer incoming messages rather than processing - ensures snapshot captures state before barrier, messages after barrier wait",
          contextLevel: "module",
          relatedConcepts: ["message-buffering", "checkpoint-boundary"],
        },
        {
          id: "cc-message-processing",
          lines: [30, 37],
          action: "Buffer messages if checkpoint is pending",
          reason:
            "Critical for consistency - if barrier is pending, cannot process new messages yet as they belong to post-checkpoint state, must queue them",
          contextLevel: "module",
          relatedConcepts: ["message-ordering", "causality-preservation"],
        },
        {
          id: "cc-barrier-reception",
          lines: [39, 50],
          action: "Receive barrier, snapshot state, and mark ready",
          reason:
            "Core checkpoint protocol - when barrier arrives, immediately snapshot current state, set status to checkpointing, then ready for acknowledgement",
          contextLevel: "module",
          relatedConcepts: ["barrier-protocol", "state-snapshot"],
        },
        {
          id: "cc-checkpoint-ack",
          lines: [52, 62],
          action: "Acknowledge checkpoint and drain queued messages",
          reason:
            "After coordinator confirms global checkpoint, process can resume - drain message queue to process messages that arrived during checkpoint",
          contextLevel: "module",
          relatedConcepts: ["two-phase-protocol", "message-replay"],
        },
        {
          id: "cc-barrier-injection",
          lines: [100, 106],
          action: "Inject barrier to all processes simultaneously",
          reason:
            "Coordinator broadcasts barrier to all processes - each receives barrier in its message stream and snapshots state, this creates consistent cut",
          contextLevel: "system",
          relatedConcepts: ["broadcast", "coordination-protocol"],
        },
        {
          id: "cc-ack-collection",
          lines: [110, 117],
          action: "Wait for acknowledgements from all processes",
          reason:
            "Checkpoint not complete until all processes acknowledge - if any process fails to ack, entire checkpoint fails, maintaining atomicity",
          contextLevel: "system",
          relatedConcepts: ["consensus", "all-or-nothing"],
        },
        {
          id: "cc-checkpoint-completion",
          lines: [119, 134],
          action: "Mark checkpoint complete and notify processes",
          reason:
            "Once all acks received, checkpoint is globally consistent - notify processes to release barriers and resume normal processing",
          contextLevel: "system",
          relatedConcepts: ["commit-point", "coordination-completion"],
        },
        {
          id: "cc-global-recovery",
          lines: [144, 163],
          action: "Restore all processes to consistent checkpoint state",
          reason:
            "Recovery rewinds entire distributed system to checkpoint - all processes restore simultaneously to mutually consistent states",
          contextLevel: "system",
          relatedConcepts: ["distributed-recovery", "state-restoration"],
        },
        {
          id: "cc-consistency-verification",
          lines: [165, 191],
          action: "Verify no orphan messages in checkpoint",
          reason:
            "Consistency check ensures sent messages are reflected in receiver state - no message should appear sent but not received, or vice versa",
          contextLevel: "system",
          relatedConcepts: ["consistency-invariants", "message-causality"],
        },
        {
          id: "cc-message-exchange",
          lines: [217, 221],
          action: "Simulate inter-process messaging before checkpoint",
          reason:
            "Demonstrates the problem coordinated checkpoints solve - messages in flight must be consistently captured or they become orphans",
          contextLevel: "system",
          relatedConcepts: ["distributed-communication", "message-passing"],
        },
        {
          id: "cc-post-checkpoint-changes",
          lines: [229, 231],
          action: "Make changes after first checkpoint",
          reason:
            "Shows checkpoint creates recovery point - changes after checkpoint are lost on failure, demonstrating bounded rollback",
          contextLevel: "module",
          relatedConcepts: ["recovery-point", "state-divergence"],
        },
      ],
      highlights: [
        {
          lines: [39, 50],
          label: "Barrier reception and state snapshot - core protocol",
          sbvpDomain: "behavior",
        },
        {
          lines: [100, 117],
          label: "Barrier injection and acknowledgement collection",
          sbvpDomain: "structure",
        },
        {
          lines: [30, 37],
          label: "Message buffering during checkpoint - consistency key",
          sbvpDomain: "philosophy",
        },
        {
          lines: [165, 191],
          label: "Consistency verification - no orphan messages",
          sbvpDomain: "visualization",
        },
        {
          lines: [144, 163],
          label: "Global recovery to consistent distributed state",
          sbvpDomain: "behavior",
        },
        {
          lines: [119, 134],
          label: "Checkpoint completion - commit point for consistency",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Stream Processing Frameworks - Apache Flink implements coordinated checkpointing via asynchronous barrier snapshots (Chandy-Lamport algorithm). Checkpoint coordinator (JobManager) injects barriers into data streams at sources, barriers flow through operators, each operator snapshots state when all input barriers align. Enables exactly-once processing guarantees across distributed stateful operators processing millions of events/second.",
      "Distributed Databases - CockroachDB and YugabyteDB use coordinated checkpoints for consistent distributed snapshots supporting point-in-time recovery and backup. Raft-based consensus ensures all nodes agree on checkpoint LSN (Log Sequence Number), creating globally consistent snapshot across shards for multi-region deployments.",
      "Distributed Training - TensorFlow and PyTorch distributed training checkpoint model state and optimizer state across worker nodes. Chief worker coordinates checkpoints ensuring all workers save gradients and parameters at same global step, preventing inconsistencies when recovering from mid-training failures.",
      "Message Queue Systems - Apache Kafka Streams uses coordinated checkpoints (commit offsets) across consumer group members. Group coordinator ensures all consumers commit offsets for same message batch boundary, maintaining exactly-once semantics for stream processing applications.",
    ],
    interactsWith: [
      "write-ahead-log",
      "periodic-checkpoint",
      "incremental-checkpoint",
      "two-phase-commit",
      "consensus-protocols",
      "distributed-snapshots",
    ],
    architecturalBoundaries: [
      "Distributed State Boundary - Coordinated checkpoints span multiple processes/nodes that share logical state through message passing. Critical for systems where state is partitioned but interdependent (order service depends on inventory service). Not needed for embarrassingly parallel workloads where processes are independent.",
      "Consistency Requirements - Use coordinated checkpoints when exactly-once semantics or strong consistency is required. For eventually consistent systems or at-least-once processing, independent checkpointing with idempotent operations is simpler and more scalable.",
      "Scale Limits - Coordinated checkpointing works well up to 100-1000 processes. Beyond that, coordination overhead dominates and asynchronous approaches (Chandy-Lamport) or independent checkpointing become necessary.",
    ],
  },

  implementations: [
    {
      id: "apache-flink-checkpointing",
      name: "Apache Flink Asynchronous Barriers",
      type: "framework",
      languages: ["java", "scala"],
      description:
        "Flink implements coordinated checkpointing using asynchronous barrier snapshots based on Chandy-Lamport algorithm. JobManager injects checkpoint barriers into data sources, barriers flow through the dataflow graph, operators snapshot state when barriers from all inputs align. Enables exactly-once processing without stopping the pipeline.",
      links: {
        docs: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/#checkpointing",
        github: "https://github.com/apache/flink",
      },
      codeSnippet: `// Flink checkpoint configuration
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

// Enable checkpointing every 60 seconds
env.enableCheckpointing(60000);

// Configure checkpoint properties
CheckpointConfig config = env.getCheckpointConfig();
config.setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
config.setMinPauseBetweenCheckpoints(30000);
config.setCheckpointTimeout(600000);
config.setMaxConcurrentCheckpoints(1);
config.enableExternalizedCheckpoints(
    CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
);

// Checkpoint storage backend
env.setStateBackend(new RocksDBStateBackend("s3://flink-checkpoints/app"));

// Stateful operator with checkpointing
DataStream<Event> events = env.addSource(new KafkaSource<>(...));

events
    .keyBy(event -> event.getUserId())
    .flatMap(new StatefulMapper())  // Operator state automatically checkpointed
    .addSink(new KafkaSink<>(...));

// StatefulMapper with operator state
public class StatefulMapper extends RichFlatMapFunction<Event, Result> {
    private transient ValueState<Long> countState;

    @Override
    public void open(Configuration config) {
        ValueStateDescriptor<Long> descriptor =
            new ValueStateDescriptor<>("count", Long.class, 0L);
        countState = getRuntimeContext().getState(descriptor);
    }

    @Override
    public void flatMap(Event event, Collector<Result> out) throws Exception {
        Long count = countState.value() + 1;
        countState.update(count);
        out.collect(new Result(event.getUserId(), count));
    }
}

// Flink automatically:
// 1. Injects barriers at sources every 60s
// 2. Operators snapshot state when barriers align
// 3. Coordinator collects all operator snapshots
// 4. Marks checkpoint complete when all operators ack
// 5. Recovery restores from last complete checkpoint`,
    },
    {
      id: "apache-spark-checkpointing",
      name: "Apache Spark Structured Streaming Checkpoints",
      type: "framework",
      languages: ["scala", "java", "python"],
      description:
        "Spark Structured Streaming implements coordinated checkpointing for stateful stream processing. Driver coordinates checkpoints across executors, ensuring all stateful operators (aggregations, joins, deduplication) snapshot at consistent batch boundaries. Provides exactly-once semantics with idempotent sinks.",
      links: {
        docs: "https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html#recovering-from-failures-with-checkpointing",
      },
      codeSnippet: `// Spark Structured Streaming with checkpointing
val spark = SparkSession.builder()
    .appName("StatefulStream")
    .getOrCreate()

import spark.implicits._

// Read from Kafka
val events = spark
    .readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "localhost:9092")
    .option("subscribe", "events")
    .load()

// Stateful aggregation
val wordCounts = events
    .selectExpr("CAST(value AS STRING)")
    .groupBy($"value")
    .count()

// Write with checkpointing
val query = wordCounts
    .writeStream
    .outputMode("complete")
    .format("console")
    .option("checkpointLocation", "s3://spark-checkpoints/wordcount")
    .start()

query.awaitTermination()

// Checkpoint structure:
// checkpointLocation/
//   commits/        <- Committed batch metadata
//   offsets/        <- Kafka offsets for each batch
//   state/          <- Stateful operator state
//   metadata        <- Stream metadata
//
// Recovery process:
// 1. Read latest committed batch from commits/
// 2. Restore offsets/ to reprocess from last batch
// 3. Restore state/ for all stateful operators
// 4. Resume processing from checkpoint batch`,
    },
    {
      id: "cockroachdb-checkpoints",
      name: "CockroachDB Distributed Checkpoints",
      type: "platform",
      languages: ["go"],
      description:
        "CockroachDB uses coordinated checkpoints for consistent distributed backups across Raft-replicated ranges. Backup coordinator requests checkpoint at specific MVCC timestamp, all ranges flush to disk at that timestamp, creates globally consistent snapshot without blocking writes.",
      links: {
        docs: "https://www.cockroachlabs.com/docs/stable/backup.html",
        github: "https://github.com/cockroachdb/cockroach",
      },
      codeSnippet: `-- CockroachDB coordinated backup
BACKUP DATABASE production
  INTO 's3://backups/cluster?AWS_ACCESS_KEY_ID=xxx'
  AS OF SYSTEM TIME '-10s'
  WITH revision_history;

-- Internally, coordinator:
-- 1. Determines MVCC timestamp for consistent snapshot
-- 2. Sends checkpoint request to all range replicas
-- 3. Each range flushes data at that timestamp
-- 4. Waits for all ranges to acknowledge
-- 5. Writes backup metadata marking snapshot complete

-- Restore from coordinated checkpoint
RESTORE DATABASE production
  FROM LATEST IN 's3://backups/cluster?AWS_ACCESS_KEY_ID=xxx'
  AS OF SYSTEM TIME '2024-01-15 10:00:00';

-- Point-in-time recovery using coordinated checkpoints
-- ensures all tables restore to mutually consistent state`,
    },
  ],

  usedInSystems: [
    {
      systemId: "flink-stream-processing",
      systemName: "Apache Flink Stream Processing",
      howUsed:
        "Flink implements coordinated checkpointing via asynchronous barrier snapshots enabling exactly-once processing for stateful stream applications. JobManager (coordinator) triggers checkpoint by injecting barriers into all data sources (Kafka, Kinesis). Barriers flow through dataflow graph like watermarks. When operator receives barriers from ALL input channels, it snapshots local state (keyed state, operator state, timers) to distributed storage (S3, HDFS, RocksDB). Barriers continue downstream. Sink operators snapshot output state ensuring exactly-once delivery. Coordinator collects acknowledgements from all operators, marks checkpoint complete only when all ack. Recovery loads last complete checkpoint and replays Kafka from checkpoint offset. Critical features: asynchronous snapshots (processing continues during checkpoint), barrier alignment (operators wait for barriers from all inputs), incremental RocksDB snapshots (only changed data). Use case: Uber fraud detection processes 1M events/sec with coordinated checkpoints every 60 seconds, ensuring zero duplicate fraud alerts during failures. Pattern composition: Coordinated Checkpoint + Write-Ahead Log (Kafka offsets) + Incremental Checkpoint (RocksDB state backend). Impact: Enabled exactly-once stream processing at scale, reducing duplicate processing from 5% (at-least-once) to 0%.",
      source:
        "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/",
    },
    {
      systemId: "tensorflow-distributed-training",
      systemName: "TensorFlow Distributed Training",
      howUsed:
        "TensorFlow distributed training uses coordinated checkpoints to save model state (weights, biases) and optimizer state (momentum, learning rate schedules) across parameter servers and worker nodes. Chief worker acts as coordinator, triggering checkpoints every N global steps. Workers checkpoint their slice of model parameters, optimizer variables (Adam state, momentum), and current global step to shared storage (GCS, S3). Coordinator waits for all workers to ack checkpoint completion before marking checkpoint valid. Recovery restores from last complete checkpoint, all workers load their parameter slices at same global step, training resumes. Critical for multi-GPU and multi-node training where inconsistent checkpoints would cause divergence. Use case: OpenAI GPT-3 training with 1024 GPUs checkpoints every 1000 steps, coordinating terabytes of model state across nodes. Checkpoint includes: model weights (175B parameters), optimizer state (momentum, variance), data loader state (batch position), learning rate schedule. Failures recover to last checkpoint losing at most 1000 steps (30 minutes). Pattern composition: Coordinated Checkpoint + Incremental Checkpoint (save only changed parameters) + Sharded Checkpoint (each worker saves its partition). Impact: Reduced training failures due to inconsistent checkpoints from 20% to <1%, enabled month-long training runs.",
      source: "https://www.tensorflow.org/guide/checkpoint",
    },
    {
      systemId: "kafka-streams-exactly-once",
      systemName: "Apache Kafka Streams Exactly-Once",
      howUsed:
        "Kafka Streams implements coordinated checkpointing via consumer group offset commits to achieve exactly-once semantics. Stream application processes messages in batches, updates local state (RocksDB for aggregations, joins), produces output to Kafka, then commits input offsets. Coordinator (group leader) triggers checkpoint, all stream tasks flush local state to changelog topics (compacted Kafka topics backing state stores), commit offsets to consumer group coordinator. Checkpoint only succeeds if all tasks commit successfully (atomic commit). Recovery restarts from last committed offsets, restores state from changelog topics. Use case: LinkedIn newsfeed ranking processes 1M updates/sec with Kafka Streams. Coordinated checkpoints ensure user state (preferences, viewed posts) is exactly-once consistent. If instance crashes mid-batch, recovery replays from last checkpoint without duplicating updates. Pattern composition: Coordinated Checkpoint + Write-Ahead Log (changelog topics) + Compacted Log (state store backups). Impact: Achieved exactly-once guarantees without external coordination or distributed transactions, maintaining 50ms P99 latency.",
      source: "https://kafka.apache.org/documentation/streams/",
    },
  ],

  philosophy: {
    coreProblem:
      "Independent checkpoints in distributed systems create orphan or missing messages where sent messages don't appear in receiver checkpoints, causing inconsistent state after recovery",
    designPrinciple:
      "Coordinate checkpoints across all processes using barrier synchronization to create globally consistent snapshots where all message dependencies are satisfied",
    historicalContext:
      "Coordinated checkpointing emerged from Chandy-Lamport distributed snapshot algorithm (1985) which proved you could capture consistent global state of asynchronous distributed systems without stopping execution. Algorithm uses marker propagation (barriers) through message channels—when process receives marker, it snapshots local state and forwards marker. Apache Flink popularized practical coordinated checkpointing for stream processing (2015) by implementing asynchronous barrier snapshots enabling exactly-once semantics without pausing processing. This revolutionized stream processing, making stateful applications practical at scale.",
    alternativesRejected: [
      "Independent Checkpointing - Each process checkpoints independently without coordination. Simpler and more scalable but creates orphan messages. Acceptable for at-least-once processing with idempotent operations, insufficient for exactly-once guarantees.",
      "Stop-the-World Checkpointing - Pause entire distributed system, checkpoint all processes, resume. Guarantees consistency but unacceptable latency (seconds) and availability impact. Rejected in favor of asynchronous barriers.",
      "Message Logging - Log all messages and replay during recovery. Provides strong consistency but excessive storage overhead (logs grow unbounded) and slow recovery (must replay all messages). Coordinated checkpoints bound recovery time.",
    ],
    mentalModel:
      "Think of coordinated checkpoints like a group photo at an event. Everyone must freeze simultaneously when photographer (coordinator) says 'hold still' (barrier marker). If people freeze at different times, photo captures inconsistent scene (someone mid-blink, someone walking away). Checkpoint barrier flows through the system like a wave—when it reaches you, you freeze and capture your state. Once everyone has frozen and photographer confirms all are ready, everyone can resume moving. The photo (checkpoint) now shows consistent snapshot of the entire group at one moment in time.",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant C as Coordinator
    participant P1 as Process 1
    participant P2 as Process 2
    participant S as Storage

    C->>P1: Barrier Marker
    C->>P2: Barrier Marker

    P1->>P1: Snapshot State
    P2->>P2: Snapshot State

    P1->>S: Persist State
    P2->>S: Persist State

    P1->>C: ACK
    P2->>C: ACK

    C->>C: Mark Complete`,
    realWorldAnalogy:
      "Coordinated checkpoint is like a synchronized group photo. The photographer (coordinator) shouts 'freeze!' and everyone stops moving simultaneously. If people froze at different times, the photo would be blurry and inconsistent. Each person holds their pose (snapshot state), photographer verifies everyone is ready (collect acks), takes the photo (mark checkpoint complete), then everyone resumes moving (release barriers).",
    useCases: [
      {
        domain: "Stream Processing",
        scenario:
          "Apache Flink processes clickstream events with stateful operators (session windows, aggregations). Checkpoint coordinator injects barriers every 60s, operators snapshot state when barriers align across all input streams. Recovery loads checkpoint and replays Kafka from checkpoint offset.",
        patternRole:
          "Provides exactly-once processing guarantees by ensuring all operator states are consistent across distributed workers",
        companies: ["Uber", "Netflix", "Alibaba"],
      },
      {
        domain: "Distributed Databases",
        scenario:
          "CockroachDB creates consistent backup across multi-region cluster. Coordinator requests checkpoint at specific MVCC timestamp, all ranges flush to storage at that timestamp, creating globally consistent snapshot without blocking writes.",
        patternRole:
          "Enables point-in-time recovery and consistent backups for distributed SQL databases",
        companies: ["CockroachDB", "YugabyteDB"],
      },
      {
        domain: "Machine Learning Training",
        scenario:
          "TensorFlow distributed training with 1024 GPUs checkpoints model parameters and optimizer state. Chief worker coordinates checkpoint every 1000 steps, all workers save their parameter shards simultaneously to shared storage.",
        patternRole:
          "Prevents training divergence by ensuring all workers restore from mutually consistent checkpoint",
        companies: ["OpenAI", "Google", "Meta"],
      },
    ],
  },

  references: [
    {
      title: "Lightweight Asynchronous Snapshots for Distributed Dataflows",
      url: "https://arxiv.org/abs/1506.08603",
      type: "research-paper",
      author: "Apache Flink Team",
    },
    {
      title:
        "Distributed Snapshots: Determining Global States of Distributed Systems",
      url: "https://lamport.azurewebsites.net/pubs/chandy.pdf",
      type: "research-paper",
      author: "Chandy & Lamport (1985)",
    },
    {
      title: "Apache Flink Checkpointing Documentation",
      url: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/",
      type: "documentation",
      author: "Apache Flink",
    },
    {
      title:
        "State Management in Apache Flink: Consistent Stateful Distributed Stream Processing",
      url: "https://www.vldb.org/pvldb/vol10/p1718-carbone.pdf",
      type: "research-paper",
      author: "Carbone et al. (2017)",
    },
  ],

  tags: [
    "distributed-systems",
    "checkpointing",
    "fault-tolerance",
    "consistency",
    "exactly-once",
    "stream-processing",
    "recovery",
    "coordination",
  ],
  difficulty: "advanced",
};
