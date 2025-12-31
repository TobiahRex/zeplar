import type { Pattern } from "../schema";

export const transactionCheckpoint: Pattern = {
  id: "transaction-checkpoint",
  slug: "transaction-checkpoint",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📸 Checkpointing → 📊 Transaction Checkpoint",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Checkpointing",
    level: 4,
  },

  concept: {
    name: "Transaction Checkpoint",
    emoji: "📊",
    tagline: "After N transactions",
    definition:
      "Transaction checkpointing is a recovery technique that creates snapshots of system state after a fixed number of committed transactions rather than at time intervals, ensuring recovery points align with transaction boundaries. Think of it like a video game that saves your progress after completing each level rather than every 5 minutes—checkpoints happen at natural completion points. For example, a database might checkpoint after every 1,000 committed transactions: after transaction 1,000, 2,000, 3,000, etc., it writes all dirty pages to disk and records a checkpoint marker in the log. During recovery, the system loads the last checkpoint (say, transaction 2,000) and replays transaction logs from there forward. This ensures the checkpoint represents a consistent database state where all transactions before it are fully committed and none are partially applied. Transaction-based checkpointing is particularly valuable for write-heavy systems where transaction volume is a better measure of state change than elapsed time. It's commonly used in databases, message queues, and event processing systems.",
    problemSolved:
      "Time-based periodic checkpointing can create checkpoints at arbitrary points that don't align with transaction boundaries, potentially capturing inconsistent state. For example, a database checkpointing every 60 seconds might snapshot in the middle of a multi-table transaction that has updated the orders table but not yet updated inventory. Recovery from this checkpoint would leave the database in an inconsistent state with phantom orders. Additionally, in write-heavy systems, 60 seconds might see 100,000 transactions while in quiet periods only 10 transactions occur—fixed-time intervals either checkpoint too frequently (wasting resources) or too infrequently (long recovery). Transaction checkpointing solves this by aligning checkpoints with transaction commit boundaries. Checkpoint after every 1,000 transactions guarantees all transactions before the checkpoint are complete and consistent. Recovery can safely start from any checkpoint without data inconsistencies. Checkpoint frequency naturally adapts to system load—busy systems checkpoint more often, quiet systems less often.",
    tradeoffs: {
      pros: [
        "Guarantees checkpoints represent consistent transactional state with all prior transactions fully committed, eliminating data corruption risks during recovery",
        "Automatically adapts checkpoint frequency to workload—write-heavy periods checkpoint frequently, quiet periods checkpoint rarely, optimizing resource usage",
        "Simplifies recovery logic since checkpoint boundaries align with transaction commits, avoiding complex partial transaction handling",
        "Provides predictable recovery progress measured in transactions replayed rather than unpredictable time-based recovery windows",
      ],
      cons: [
        "Can create highly variable checkpoint intervals in systems with bursty traffic—1,000 transactions might take 1 second or 10 minutes depending on load",
        "May checkpoint too infrequently in low-throughput systems where 1,000 transactions takes hours, creating unacceptably long recovery times",
        "Adds complexity to track transaction counts accurately across distributed systems with concurrent transaction processors",
        "Provides poor control over checkpoint timing for systems that need checkpoints at specific wall-clock times for operational reasons",
      ],
    },
    relatedPatterns: [
      "periodic-checkpoint",
      "incremental-checkpoint",
      "coordinated-checkpoint",
      "physical-logging",
      "logical-logging",
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
      id: "transaction-checkpoint-ts-basic",
      language: "typescript",
      title: "Transaction-Based Checkpoint Manager",
      description:
        "Complete implementation of transaction-based checkpointing that creates recovery snapshots after fixed transaction counts, ensuring consistent state boundaries and adaptive checkpoint frequency.",
      code: `interface Transaction {
  id: string;
  timestamp: number;
  operations: Operation[];
  status: 'committed' | 'aborted';
}

interface Operation {
  type: 'insert' | 'update' | 'delete';
  table: string;
  key: string;
  value: any;
  oldValue?: any;
}

interface Checkpoint {
  id: string;
  transactionCount: number;
  lastTransactionId: string;
  timestamp: number;
  stateSnapshot: Map<string, any>;
}

interface CheckpointConfig {
  transactionThreshold: number;  // Create checkpoint after N transactions
  maxCheckpoints: number;        // Keep last N checkpoints
  snapshotPath: string;
}

class TransactionCheckpointManager {
  private committedTransactions: Transaction[] = [];
  private transactionsSinceCheckpoint = 0;
  private checkpoints: Checkpoint[] = [];
  private currentState = new Map<string, any>();
  private lastCheckpointId = 0;

  constructor(private config: CheckpointConfig) {}

  // Apply a committed transaction to the current state
  applyTransaction(transaction: Transaction): void {
    if (transaction.status !== 'committed') {
      throw new Error('Can only apply committed transactions');
    }

    // Apply each operation to the in-memory state
    for (const op of transaction.operations) {
      const key = \`\${op.table}:\${op.key}\`;

      switch (op.type) {
        case 'insert':
        case 'update':
          this.currentState.set(key, op.value);
          break;
        case 'delete':
          this.currentState.delete(key);
          break;
      }
    }

    // Track the transaction
    this.committedTransactions.push(transaction);
    this.transactionsSinceCheckpoint++;

    console.log(\`Applied transaction \${transaction.id}, \` +
      \`\${this.transactionsSinceCheckpoint}/\${this.config.transactionThreshold} until checkpoint\`);

    // Check if we've reached the transaction threshold
    if (this.transactionsSinceCheckpoint >= this.config.transactionThreshold) {
      this.createCheckpoint();
    }
  }

  // Create a checkpoint of current consistent state
  private createCheckpoint(): void {
    const checkpointId = \`checkpoint-\${++this.lastCheckpointId}\`;
    const lastTransaction = this.committedTransactions[this.committedTransactions.length - 1];

    // Create a deep copy of current state
    const stateSnapshot = new Map(
      Array.from(this.currentState.entries()).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))])
    );

    const checkpoint: Checkpoint = {
      id: checkpointId,
      transactionCount: this.committedTransactions.length,
      lastTransactionId: lastTransaction.id,
      timestamp: Date.now(),
      stateSnapshot,
    };

    this.checkpoints.push(checkpoint);
    this.transactionsSinceCheckpoint = 0;

    console.log(\`\\n📸 CHECKPOINT CREATED: \${checkpointId}\`);
    console.log(\`   Total transactions: \${checkpoint.transactionCount}\`);
    console.log(\`   Last transaction: \${checkpoint.lastTransactionId}\`);
    console.log(\`   State size: \${checkpoint.stateSnapshot.size} entries\\n\`);

    // Maintain only the configured number of checkpoints
    if (this.checkpoints.length > this.config.maxCheckpoints) {
      const removed = this.checkpoints.shift();
      console.log(\`Removed old checkpoint: \${removed?.id}\`);
    }

    // In production, persist checkpoint to disk
    this.persistCheckpoint(checkpoint);
  }

  // Simulate persisting checkpoint to disk
  private persistCheckpoint(checkpoint: Checkpoint): void {
    // In real implementation, write to disk:
    // - Serialize state snapshot to binary format
    // - Write checkpoint metadata (id, transaction count, timestamp)
    // - Flush to disk with fsync for durability
    // - Update checkpoint index file
    console.log(\`Persisting checkpoint \${checkpoint.id} to \${this.config.snapshotPath}\`);
  }

  // Recover from the most recent checkpoint
  recover(): { checkpoint: Checkpoint; transactionsToReplay: Transaction[] } | null {
    if (this.checkpoints.length === 0) {
      console.log('No checkpoints available for recovery');
      return null;
    }

    // Get the most recent checkpoint
    const checkpoint = this.checkpoints[this.checkpoints.length - 1];

    console.log(\`\\n🔄 RECOVERING from checkpoint \${checkpoint.id}\`);
    console.log(\`   Checkpoint at transaction: \${checkpoint.lastTransactionId}\`);

    // Restore state from checkpoint
    this.currentState = new Map(checkpoint.stateSnapshot);

    // Find transactions that occurred after this checkpoint
    const checkpointIndex = this.committedTransactions.findIndex(
      tx => tx.id === checkpoint.lastTransactionId
    );
    const transactionsToReplay = this.committedTransactions.slice(checkpointIndex + 1);

    console.log(\`   Restored state: \${this.currentState.size} entries\`);
    console.log(\`   Transactions to replay: \${transactionsToReplay.length}\\n\`);

    return { checkpoint, transactionsToReplay };
  }

  // Get current system state
  getState(): Map<string, any> {
    return new Map(this.currentState);
  }

  // Get checkpoint statistics
  getStats() {
    return {
      totalTransactions: this.committedTransactions.length,
      transactionsSinceCheckpoint: this.transactionsSinceCheckpoint,
      checkpointCount: this.checkpoints.length,
      nextCheckpointIn: this.config.transactionThreshold - this.transactionsSinceCheckpoint,
    };
  }
}

// ============================================================================
// USAGE EXAMPLE: Demonstrate transaction-based checkpointing
// ============================================================================

function demonstrateTransactionCheckpointing() {
  console.log('=== Transaction Checkpoint Pattern Demo ===\\n');

  // Configure checkpointing every 3 transactions (low for demo purposes)
  const manager = new TransactionCheckpointManager({
    transactionThreshold: 3,
    maxCheckpoints: 2,
    snapshotPath: '/var/lib/db/checkpoints',
  });

  // Simulate a series of database transactions
  const transactions: Transaction[] = [
    {
      id: 'tx-001',
      timestamp: Date.now(),
      status: 'committed',
      operations: [
        { type: 'insert', table: 'users', key: '1', value: { name: 'Alice', balance: 100 } },
        { type: 'insert', table: 'users', key: '2', value: { name: 'Bob', balance: 200 } },
      ],
    },
    {
      id: 'tx-002',
      timestamp: Date.now() + 1,
      status: 'committed',
      operations: [
        { type: 'update', table: 'users', key: '1', value: { name: 'Alice', balance: 150 }, oldValue: { name: 'Alice', balance: 100 } },
      ],
    },
    {
      id: 'tx-003',
      timestamp: Date.now() + 2,
      status: 'committed',
      operations: [
        { type: 'insert', table: 'orders', key: 'ord-1', value: { userId: '1', amount: 50 } },
      ],
    },
    // Checkpoint will be created after tx-003 (3 transactions)
    {
      id: 'tx-004',
      timestamp: Date.now() + 3,
      status: 'committed',
      operations: [
        { type: 'update', table: 'users', key: '2', value: { name: 'Bob', balance: 250 }, oldValue: { name: 'Bob', balance: 200 } },
      ],
    },
    {
      id: 'tx-005',
      timestamp: Date.now() + 4,
      status: 'committed',
      operations: [
        { type: 'delete', table: 'orders', key: 'ord-1' },
      ],
    },
    {
      id: 'tx-006',
      timestamp: Date.now() + 5,
      status: 'committed',
      operations: [
        { type: 'insert', table: 'orders', key: 'ord-2', value: { userId: '2', amount: 75 } },
      ],
    },
    // Checkpoint will be created after tx-006 (6 transactions total, 3 since last)
  ];

  // Apply all transactions
  console.log('--- Applying Transactions ---\\n');
  for (const tx of transactions) {
    manager.applyTransaction(tx);
  }

  // Show final statistics
  console.log('\\n--- Final Statistics ---');
  const stats = manager.getStats();
  console.log(\`Total transactions applied: \${stats.totalTransactions}\`);
  console.log(\`Checkpoint count: \${stats.checkpointCount}\`);
  console.log(\`Transactions since last checkpoint: \${stats.transactionsSinceCheckpoint}\`);
  console.log(\`Next checkpoint in: \${stats.nextCheckpointIn} transactions\`);

  // Simulate crash and recovery
  console.log('\\n\\n--- Simulating System Crash and Recovery ---');
  const recovery = manager.recover();

  if (recovery) {
    console.log('Recovery process:');
    console.log(\`1. Loaded checkpoint \${recovery.checkpoint.id}\`);
    console.log(\`2. Found \${recovery.transactionsToReplay.length} transactions to replay\`);
    console.log(\`3. Replay transactions: \${recovery.transactionsToReplay.map(tx => tx.id).join(', ')}\`);

    // In real recovery, we would replay these transactions
    for (const tx of recovery.transactionsToReplay) {
      console.log(\`   Replaying \${tx.id}...\`);
    }
  }

  console.log('\\n✅ Recovery complete - system restored to consistent state');
}

// Run the demonstration
demonstrateTransactionCheckpointing();`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete transaction checkpoint manager demonstrating recovery snapshots created at fixed transaction boundaries rather than time intervals",
        prerequisites: [
          "TypeScript classes and interfaces",
          "Map data structure",
          "Transaction concepts (ACID properties)",
          "Checkpoint/recovery fundamentals",
        ],
        systemPosition:
          "Core recovery component in database storage engine or transaction log manager, positioned between transaction processor and persistent storage layer",
      },
      annotations: [
        {
          id: "tc-config",
          lines: [14, 18],
          action:
            "Define configuration for transaction-based checkpoint triggers",
          reason:
            "Transaction threshold determines when to create snapshots based on committed transaction count rather than elapsed time, allowing checkpoint frequency to adapt to actual workload rather than arbitrary time windows",
          contextLevel: "module",
        },
        {
          id: "tc-counter",
          lines: [23, 24],
          action:
            "Track committed transactions and count since last checkpoint",
          reason:
            "Must maintain accurate transaction count to determine when threshold is reached; separate counter for transactions-since-checkpoint enables resetting after each snapshot without losing total transaction history",
          contextLevel: "local",
        },
        {
          id: "tc-validation",
          lines: [32, 34],
          action: "Validate transaction is committed before applying to state",
          reason:
            "Checkpoints must only capture committed transactions to ensure recovery restores consistent state; including aborted or in-progress transactions would violate ACID guarantees and corrupt database state",
          contextLevel: "module",
          relatedConcepts: ["ACID", "transaction-isolation"],
        },
        {
          id: "tc-state-apply",
          lines: [37, 50],
          action:
            "Apply transaction operations to in-memory state representation",
          reason:
            "Maintains current database state by executing insert/update/delete operations; this state will be snapshotted at checkpoint boundaries to capture exact database contents at transaction boundaries",
          contextLevel: "local",
        },
        {
          id: "tc-threshold-check",
          lines: [58, 60],
          action:
            "Check if transaction count reached threshold and trigger checkpoint",
          reason:
            "Transaction-based triggering ensures checkpoints align with transaction boundaries (not arbitrary time points), guaranteeing consistent state snapshots where all prior transactions are fully committed",
          contextLevel: "module",
          relatedConcepts: ["checkpoint-consistency"],
        },
        {
          id: "tc-snapshot",
          lines: [68, 71],
          action: "Create deep copy of current state as checkpoint snapshot",
          reason:
            "Deep copy isolates checkpoint from future state mutations; checkpoint must be immutable point-in-time snapshot that won't change as new transactions are applied to current state",
          contextLevel: "local",
          relatedConcepts: ["copy-on-write", "snapshot-isolation"],
        },
        {
          id: "tc-metadata",
          lines: [73, 78],
          action:
            "Record checkpoint metadata including transaction count and last transaction ID",
          reason:
            "Metadata enables recovery to determine which transactions have been checkpointed versus which need to be replayed from log; last transaction ID acts as watermark separating checkpointed from post-checkpoint transactions",
          contextLevel: "module",
        },
        {
          id: "tc-reset-counter",
          lines: [80, 80],
          action: "Reset transaction counter to zero after checkpoint creation",
          reason:
            "Counter reset restarts the count toward next checkpoint threshold; this enables regular checkpoint intervals measured in transactions (every N transactions) rather than cumulative count",
          contextLevel: "local",
        },
        {
          id: "tc-window",
          lines: [87, 90],
          action:
            "Maintain sliding window of recent checkpoints by removing old ones",
          reason:
            "Bounded checkpoint retention prevents unlimited storage growth; keeping last N checkpoints enables recovery from slightly older checkpoint if most recent is corrupted, while limiting disk usage",
          contextLevel: "system",
          relatedConcepts: ["storage-management", "checkpoint-rotation"],
        },
        {
          id: "tc-persist",
          lines: [93, 103],
          action: "Persist checkpoint to durable storage with fsync",
          reason:
            "Checkpoint is only useful for recovery if it survives system crashes; must write to disk with fsync to ensure data is physically written to persistent storage, not just buffered in OS cache",
          contextLevel: "system",
          relatedConcepts: ["durability", "write-ahead-log"],
        },
        {
          id: "tc-recovery-load",
          lines: [106, 118],
          action: "Load most recent checkpoint during recovery process",
          reason:
            "Recovery starts from last known consistent state (most recent checkpoint) rather than replaying entire transaction history from beginning; significantly reduces recovery time especially for long-running systems",
          contextLevel: "module",
        },
        {
          id: "tc-recovery-replay",
          lines: [123, 126],
          action:
            "Identify transactions that occurred after checkpoint for replay",
          reason:
            "Transactions committed after checkpoint are not included in snapshot; must replay these from transaction log to bring system fully up-to-date and not lose committed work",
          contextLevel: "module",
          relatedConcepts: ["redo-recovery", "log-replay"],
        },
        {
          id: "tc-adaptive",
          lines: [165, 169],
          action: "Configure low transaction threshold for demo purposes",
          reason:
            "Demo uses threshold of 3 transactions (production would use 1,000-10,000) to show checkpointing behavior quickly; demonstrates adaptive nature where checkpoint frequency naturally matches transaction rate",
          contextLevel: "micro",
        },
        {
          id: "tc-boundary",
          lines: [241, 243],
          action: "Show checkpoint created exactly at transaction boundaries",
          reason:
            "Checkpoints occur after tx-003 and tx-006 (every 3 transactions), demonstrating precise transaction-count-based triggering that ensures snapshots always capture complete transactions, never partial ones",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [101, 105],
          label: "Transaction-based checkpoint configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [145, 147],
          label: "Transaction count threshold triggering checkpoint creation",
          sbvpDomain: "behavior",
        },
        {
          lines: [156, 166],
          label: "Consistent state snapshot at transaction boundary",
          sbvpDomain: "philosophy",
        },
        {
          lines: [197, 222],
          label: "Recovery from checkpoint with transaction replay",
          sbvpDomain: "behavior",
        },
        {
          lines: [187, 194],
          label: "Checkpoint persistence to durable storage",
          sbvpDomain: "structure",
        },
        {
          lines: [118, 120],
          label: "ACID compliance: only checkpoint committed transactions",
          sbvpDomain: "philosophy",
        },
        {
          lines: [248, 252],
          label: "Adaptive checkpoint frequency based on workload",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],
};
