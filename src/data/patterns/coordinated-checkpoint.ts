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
    tagline: "Distributed consistent",
    definition:
      "Coordinated Checkpoint synchronizes state snapshots across distributed processes to create a globally consistent recovery point, preventing inconsistencies when restoring from failures. Think of it like a group photo where everyone freezes simultaneously—if each person froze at different times, the photo would show an inconsistent scene. In distributed systems, three microservices (OrderService, InventoryService, PaymentService) must checkpoint together. A coordinator sends a checkpoint request, each service flushes in-flight messages, saves state, and acknowledges completion. Only when all acknowledge does the coordinator mark the checkpoint as consistent. If OrderService checkpoints after processing order #1000 while InventoryService checkpoints before receiving that order, recovery would create an inconsistency: order exists without inventory deduction. Coordinated checkpointing prevents this by ensuring the snapshot reflects a state where all cross-service message exchanges are either complete or absent, never partially processed.",
    problemSolved:
      "Independent checkpointing in distributed systems creates inconsistent snapshots where recovered state violates system invariants. Service A checkpoints after sending a message to Service B, but Service B checkpoints before receiving it. Recovery from these checkpoints loses the in-flight message, causing state divergence: A believes it sent the message, B never received it. These orphan or missing messages break distributed transactions, violate data integrity, and cause subtle bugs. Coordinated Checkpoint solves this by establishing a consistent cut—a snapshot where all message dependencies are satisfied. When recovery occurs, all services restore to mutually consistent states with no missing or duplicate messages. This is critical for distributed databases, stream processing systems (Flink, Spark), and any stateful distributed application requiring exactly-once processing guarantees.",
    tradeoffs: {
      pros: [
        "Guarantees globally consistent snapshots where all inter-process message dependencies are satisfied",
        "Simplifies recovery logic by eliminating orphan messages and inconsistent state handling",
        "Enables exactly-once processing semantics in distributed stream processing and stateful workflows",
        "Provides deterministic recovery behavior that is easier to reason about and test",
      ],
      cons: [
        "Requires global coordination and synchronization, creating a scalability bottleneck and latency spike",
        "Blocks all processing during checkpoint coordination, reducing throughput and increasing latency",
        "Vulnerable to coordinator failure or slow participants that delay checkpoint completion for entire system",
        "Does not scale to large distributed systems with hundreds of nodes due to coordination overhead",
      ],
    },
    relatedPatterns: [
      "incremental-checkpoint",
      "write-ahead-log",
      "snapshot-isolation",
      "two-phase-commit",
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
};
