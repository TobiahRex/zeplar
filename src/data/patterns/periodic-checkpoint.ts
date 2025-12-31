import type { Pattern } from "../schema";

export const periodicCheckpoint: Pattern = {
  id: "periodic-checkpoint",
  slug: "periodic-checkpoint",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📸 Checkpointing → ⏱️ Periodic Checkpoint",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Checkpointing",
    level: 4,
  },

  concept: {
    name: "Periodic Checkpoint",
    emoji: "⏱️",
    tagline: "Time-based snapshots",
    definition:
      "Periodic checkpointing is a recovery technique that saves complete snapshots of system state at regular time intervals, enabling recovery to a known-good state if failures occur. Think of it like auto-save in a video game that saves your progress every 5 minutes—if the game crashes, you only lose at most 5 minutes of progress instead of hours. For example, a stream processing system might checkpoint all operator state (counters, aggregations, windows) every 30 seconds to durable storage. If a worker node crashes, the system restarts from the most recent checkpoint and replays event logs from that point forward. The pattern creates consistent snapshots by coordinating checkpoints across distributed components, ensuring the saved state represents a valid system configuration. Common implementations include database checkpoints that flush dirty pages to disk, distributed system snapshots using barrier markers in data streams (like Flink's asynchronous barriers), or VM snapshots that capture entire machine state. The checkpoint interval trades off recovery time (longer intervals lose more work) against checkpoint overhead (shorter intervals spend more time saving state).",
    problemSolved:
      "Without checkpointing, system failures require replaying the entire operation history from the beginning, which can take hours or days for long-running processes. For example, a machine learning training job running for 48 hours that crashes at hour 47 must restart from scratch, wasting 47 hours of computation. Similarly, a stream processing application processing events for weeks must replay all events from the start if it crashes, which might take days to catch up. Periodic checkpointing solves this by providing recovery points throughout execution. With hourly checkpoints, the same training job recovers in minutes by loading the last checkpoint and replaying just one hour of gradients. The stream processor recovers in seconds by loading state from the last checkpoint and replaying 30 seconds of events. This dramatically reduces recovery time from hours/days to minutes/seconds while preventing data loss.",
    tradeoffs: {
      pros: [
        "Provides predictable recovery time bounds since you only need to replay operations since the last checkpoint, typically reducing recovery from hours to minutes",
        "Simple to implement and reason about compared to complex continuous snapshotting—just periodically save state on a timer",
        "Allows tunable trade-off between checkpoint overhead and recovery time by adjusting checkpoint interval (shorter intervals recover faster but cost more resources)",
        "Works well for systems with steady-state operation where checkpoint frequency can be optimized based on failure rates and recovery cost",
      ],
      cons: [
        "Creates bounded data loss window equal to checkpoint interval—with 5-minute checkpoints, failures can lose up to 5 minutes of work",
        "Introduces performance overhead during checkpoint creation as system must pause or slow down to create consistent snapshots, impacting throughput by 10-30%",
        "Can create large checkpoint files requiring significant storage space, especially for stateful systems with gigabytes of in-memory data",
        "Inefficient for write-heavy workloads where most state changes between checkpoints, as it saves the entire state rather than just deltas",
      ],
    },
    relatedPatterns: [
      "incremental-checkpoint",
      "transaction-checkpoint",
      "coordinated-checkpoint",
      "physical-logging",
      "event-sourcing",
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
      id: "periodic-checkpoint-ts-basic",
      language: "typescript",
      title: "Periodic Checkpoint for Stream Processing",
      description:
        "Stream processing system with time-based checkpointing that saves operator state every N seconds, enabling fast recovery from failures",
      code: `interface CheckpointMetadata {
  checkpointId: number;
  timestamp: number;
  stateSize: number;
  operatorStates: Map<string, any>;
}

interface StreamOperator {
  operatorId: string;
  state: Map<string, any>;
  processEvent: (event: any) => void;
  getState: () => Map<string, any>;
  restoreState: (state: Map<string, any>) => void;
}

class WordCountOperator implements StreamOperator {
  operatorId = 'word-count';
  state: Map<string, number> = new Map();

  processEvent(event: { word: string }): void {
    const count = this.state.get(event.word) || 0;
    this.state.set(event.word, count + 1);
  }

  getState(): Map<string, any> {
    return new Map(this.state);
  }

  restoreState(state: Map<string, any>): void {
    this.state = new Map(state);
  }
}

class AggregationOperator implements StreamOperator {
  operatorId = 'aggregation';
  state: Map<string, number> = new Map();

  processEvent(event: { userId: string; value: number }): void {
    const sum = this.state.get(event.userId) || 0;
    this.state.set(event.userId, sum + event.value);
  }

  getState(): Map<string, any> {
    return new Map(this.state);
  }

  restoreState(state: Map<string, any>): void {
    this.state = new Map(state);
  }
}

class PeriodicCheckpointManager {
  private operators: StreamOperator[] = [];
  private checkpoints: CheckpointMetadata[] = [];
  private checkpointInterval: number;
  private checkpointTimer?: NodeJS.Timeout;
  private lastCheckpointId = 0;
  private isRunning = false;
  private eventsSinceCheckpoint = 0;

  constructor(checkpointIntervalMs: number) {
    this.checkpointInterval = checkpointIntervalMs;
  }

  registerOperator(operator: StreamOperator): void {
    this.operators.push(operator);
  }

  start(): void {
    this.isRunning = true;
    this.scheduleNextCheckpoint();
  }

  stop(): void {
    this.isRunning = false;
    if (this.checkpointTimer) {
      clearTimeout(this.checkpointTimer);
    }
  }

  private scheduleNextCheckpoint(): void {
    if (!this.isRunning) return;

    this.checkpointTimer = setTimeout(() => {
      this.performCheckpoint();
      this.scheduleNextCheckpoint();
    }, this.checkpointInterval);
  }

  private performCheckpoint(): void {
    const checkpointId = ++this.lastCheckpointId;
    const timestamp = Date.now();
    const operatorStates = new Map<string, any>();

    console.log(\`\n[Checkpoint \${checkpointId}] Starting checkpoint...\`);
    console.log(\`  Events processed since last checkpoint: \${this.eventsSinceCheckpoint}\`);

    let totalStateSize = 0;
    for (const operator of this.operators) {
      const state = operator.getState();
      operatorStates.set(operator.operatorId, state);

      const stateEntries = Array.from(state.entries());
      totalStateSize += stateEntries.length;

      console.log(\`  [\${operator.operatorId}] Saved \${stateEntries.length} state entries\`);
    }

    const checkpoint: CheckpointMetadata = {
      checkpointId,
      timestamp,
      stateSize: totalStateSize,
      operatorStates
    };

    this.checkpoints.push(checkpoint);

    if (this.checkpoints.length > 5) {
      const removed = this.checkpoints.shift();
      console.log(\`  Pruned old checkpoint \${removed?.checkpointId}\`);
    }

    console.log(\`[Checkpoint \${checkpointId}] Complete. Total state size: \${totalStateSize} entries\`);
    this.eventsSinceCheckpoint = 0;
  }

  processEvent(event: any): void {
    for (const operator of this.operators) {
      operator.processEvent(event);
    }
    this.eventsSinceCheckpoint++;
  }

  getLatestCheckpoint(): CheckpointMetadata | undefined {
    return this.checkpoints[this.checkpoints.length - 1];
  }

  recoverFromLatestCheckpoint(): void {
    const checkpoint = this.getLatestCheckpoint();

    if (!checkpoint) {
      console.log('No checkpoint found, starting from empty state');
      return;
    }

    console.log(\`\n[Recovery] Restoring from checkpoint \${checkpoint.checkpointId}\`);
    console.log(\`  Checkpoint timestamp: \${new Date(checkpoint.timestamp).toISOString()}\`);
    console.log(\`  State size: \${checkpoint.stateSize} entries\`);

    for (const operator of this.operators) {
      const state = checkpoint.operatorStates.get(operator.operatorId);
      if (state) {
        operator.restoreState(state);
        console.log(\`  [\${operator.operatorId}] Restored \${state.size} entries\`);
      }
    }

    console.log(\`[Recovery] Complete. System restored to checkpoint \${checkpoint.checkpointId}\`);
  }

  getCheckpointHistory(): CheckpointMetadata[] {
    return [...this.checkpoints];
  }

  simulateFailure(): void {
    console.log('\n========================================');
    console.log('SIMULATING SYSTEM FAILURE');
    console.log('========================================');
    this.stop();

    const eventsLost = this.eventsSinceCheckpoint;
    console.log(\`Events processed since last checkpoint: \${eventsLost}\`);
    console.log(\`These events will be lost unless replayed from event log\`);
  }
}

async function demonstratePeriodicCheckpoint() {
  const checkpointManager = new PeriodicCheckpointManager(3000);

  const wordCount = new WordCountOperator();
  const aggregation = new AggregationOperator();

  checkpointManager.registerOperator(wordCount);
  checkpointManager.registerOperator(aggregation);

  checkpointManager.start();

  console.log('=== Starting Stream Processing with Periodic Checkpointing ===');
  console.log(\`Checkpoint interval: 3 seconds\n\`);

  const words = ['hello', 'world', 'hello', 'stream', 'processing', 'hello'];
  const users = [
    { userId: 'user1', value: 100 },
    { userId: 'user2', value: 50 },
    { userId: 'user1', value: 75 },
    { userId: 'user3', value: 200 }
  ];

  for (let i = 0; i < 20; i++) {
    const wordEvent = { word: words[i % words.length] };
    const userEvent = users[i % users.length];

    checkpointManager.processEvent(wordEvent);
    checkpointManager.processEvent(userEvent);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  checkpointManager.simulateFailure();

  console.log('\n=== Recovering from Failure ===');
  checkpointManager.recoverFromLatestCheckpoint();

  console.log('\n=== Checkpoint History ===');
  const history = checkpointManager.getCheckpointHistory();
  history.forEach(cp => {
    const age = ((Date.now() - cp.timestamp) / 1000).toFixed(1);
    console.log(\`Checkpoint \${cp.checkpointId}: \${cp.stateSize} entries (\${age}s ago)\`);
  });

  console.log('\n✓ Recovery demonstrates bounded data loss:');
  console.log('  With 3s checkpoints, maximum data loss is 3 seconds of events');
  console.log('  Trade-off: More frequent checkpoints = less data loss but higher overhead');
}

demonstratePeriodicCheckpoint().catch(console.error);`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete periodic checkpointing system for stateful stream processing, including operator state management, checkpoint scheduling, and failure recovery",
        prerequisites: [
          "Stream processing concepts",
          "Stateful operators",
          "Timers and scheduling",
          "Failure recovery patterns",
        ],
        systemPosition:
          "Recovery subsystem within stream processing framework (like Flink, Spark Streaming), coordinates checkpoint creation across stateful operators",
      },
      annotations: [
        {
          id: "pc-checkpoint-metadata",
          lines: [1, 6],
          action: "Define checkpoint metadata structure",
          reason:
            "Each checkpoint needs unique ID, timestamp for ordering/pruning, size for monitoring, and snapshot of all operator states for recovery",
          contextLevel: "local",
          relatedConcepts: ["snapshot", "metadata"],
        },
        {
          id: "pc-operator-interface",
          lines: [8, 13],
          action: "Define stateful operator contract for checkpointing",
          reason:
            "All operators must support getState/restoreState to participate in checkpointing - this interface enables pluggable operators",
          contextLevel: "module",
          relatedConcepts: ["interface-segregation", "plugin-pattern"],
        },
        {
          id: "pc-word-count-state",
          lines: [15, 29],
          action: "Implement word count operator with local state",
          reason:
            "Typical stateful operator maintaining counts in memory - state must be extracted for checkpointing and can be restored after failure",
          contextLevel: "module",
          relatedConcepts: ["stateful-processing", "aggregation"],
        },
        {
          id: "pc-checkpoint-interval",
          lines: [55, 57],
          action: "Configure periodic checkpoint interval",
          reason:
            "Interval controls trade-off: shorter intervals reduce data loss but increase checkpoint overhead, longer intervals reduce overhead but lose more work on failure",
          contextLevel: "module",
          relatedConcepts: ["performance-tuning", "recovery-time-objective"],
        },
        {
          id: "pc-operator-registration",
          lines: [63, 65],
          action: "Register operators for checkpoint participation",
          reason:
            "Checkpoint manager needs to know all stateful operators to collect their states - missed operators would lose state on recovery",
          contextLevel: "module",
          relatedConcepts: ["registry-pattern", "observer-pattern"],
        },
        {
          id: "pc-checkpoint-scheduler",
          lines: [76, 84],
          action: "Schedule recurring checkpoints using timer",
          reason:
            "Periodic execution is core to this pattern - timer fires every N seconds to trigger checkpoint regardless of event count or state size",
          contextLevel: "module",
          relatedConcepts: ["periodic-tasks", "scheduling"],
        },
        {
          id: "pc-state-collection",
          lines: [93, 103],
          action: "Collect state from all operators into checkpoint snapshot",
          reason:
            "Checkpoint must capture consistent snapshot of all operators - iterate through each operator, call getState(), and aggregate into single checkpoint object",
          contextLevel: "module",
          relatedConcepts: ["snapshot-pattern", "serialization"],
        },
        {
          id: "pc-checkpoint-metadata-tracking",
          lines: [89, 92],
          action:
            "Track checkpoint ID, timestamp, and events since last checkpoint",
          reason:
            "Metadata enables monitoring checkpoint frequency, measuring data loss on failure, and debugging checkpoint performance issues",
          contextLevel: "local",
          relatedConcepts: ["observability", "metrics"],
        },
        {
          id: "pc-checkpoint-pruning",
          lines: [115, 118],
          action: "Prune old checkpoints to limit storage",
          reason:
            "Keeping all checkpoints forever exhausts disk - retain last 5 checkpoints for recovery, delete older ones to bound storage cost",
          contextLevel: "module",
          relatedConcepts: ["retention-policy", "storage-management"],
        },
        {
          id: "pc-event-processing",
          lines: [124, 129],
          action: "Process events through all operators and count",
          reason:
            "Normal event processing updates operator state in-memory - eventsSinceCheckpoint tracks potential data loss if failure occurs before next checkpoint",
          contextLevel: "local",
          relatedConcepts: ["event-processing", "stateful-operations"],
        },
        {
          id: "pc-recovery",
          lines: [136, 154],
          action: "Restore operator states from latest checkpoint",
          reason:
            "Recovery rewinds system to last known-good state - iterate operators, restore their saved states, system can resume from checkpoint",
          contextLevel: "module",
          relatedConcepts: ["disaster-recovery", "state-restoration"],
        },
        {
          id: "pc-failure-simulation",
          lines: [160, 169],
          action: "Simulate crash and report data loss window",
          reason:
            "Demonstrates bounded data loss property - events processed since last checkpoint are lost unless replayed from durable event log",
          contextLevel: "module",
          relatedConcepts: ["fault-injection", "data-loss-analysis"],
        },
        {
          id: "pc-demo-workload",
          lines: [186, 205],
          action: "Generate continuous event stream while checkpoints run",
          reason:
            "Simulates real stream processing - events arrive continuously while periodic checkpoints snapshot state in background every 3 seconds",
          contextLevel: "module",
          relatedConcepts: ["stream-processing", "concurrent-operations"],
        },
      ],
      highlights: [
        {
          lines: [76, 84],
          label: "Periodic checkpoint scheduler - heart of the pattern",
          sbvpDomain: "behavior",
        },
        {
          lines: [93, 103],
          label: "State collection across all operators",
          sbvpDomain: "structure",
        },
        {
          lines: [136, 154],
          label: "Recovery by restoring from checkpoint snapshot",
          sbvpDomain: "behavior",
        },
        {
          lines: [55, 57],
          label: "Checkpoint interval configures recovery-overhead tradeoff",
          sbvpDomain: "philosophy",
        },
        {
          lines: [160, 169],
          label: "Failure simulation showing bounded data loss",
          sbvpDomain: "visualization",
        },
        {
          lines: [115, 118],
          label: "Checkpoint pruning to manage storage growth",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],
};
