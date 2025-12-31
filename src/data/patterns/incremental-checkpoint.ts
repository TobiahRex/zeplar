import type { Pattern } from "../schema";

export const incrementalCheckpoint: Pattern = {
  id: "incremental-checkpoint",
  slug: "incremental-checkpoint",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📸 Checkpointing → 🔄 Incremental Checkpoint",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Checkpointing",
    level: 4,
  },

  concept: {
    name: "Incremental Checkpoint",
    emoji: "🔄",
    tagline: "Only changed state",
    definition:
      "Incremental Checkpoint saves only the state changes since the last checkpoint rather than the entire system state, dramatically reducing checkpoint overhead and storage requirements. Think of it like a document's 'track changes' feature that only saves what was edited since the last save, not the entire document every time. In stream processing, a stateful operator maintaining aggregations might have 10GB of state. Full checkpoints write all 10GB every checkpoint interval (expensive). Incremental checkpoints track which keys were modified since the last checkpoint and write only those changes—perhaps 100MB of updates—referencing the previous full checkpoint as the base. Recovery replays the base checkpoint plus all subsequent incremental checkpoints to reconstruct current state. For example, checkpoint 0 (full, 10GB), checkpoint 1 (incremental, 50MB of changes), checkpoint 2 (incremental, 75MB of changes). Recovery loads checkpoint 0, applies checkpoint 1 changes, then applies checkpoint 2 changes.",
    problemSolved:
      "Full checkpoints of large stateful systems create prohibitive overhead in storage, I/O, and pause time. Writing 10GB of state every 5 minutes generates 120GB/hour of checkpoint data and causes multi-second processing pauses that violate latency SLAs. Many stateful systems have small working sets relative to total state—only 1% of keys change between checkpoints, making full snapshots wasteful. Incremental Checkpoint solves this by writing only deltas, reducing checkpoint size by 90-99% and dramatically lowering I/O impact. A 10GB state with 1% changes writes 100MB incremental checkpoints instead of 10GB full checkpoints. This enables more frequent checkpointing (reducing recovery time) without overwhelming storage or degrading throughput. Critical for stateful stream processing (Flink, Spark Streaming), databases with large working sets, and applications where checkpoint overhead limits scalability.",
    tradeoffs: {
      pros: [
        "Reduces checkpoint size by 90-99% by writing only modified state since last checkpoint",
        "Enables more frequent checkpoints without I/O overhead, reducing potential data loss and recovery time",
        "Lowers storage costs by orders of magnitude for systems with large total state but small working sets",
        "Minimizes processing pauses during checkpointing, improving latency and throughput",
      ],
      cons: [
        "Increases recovery time as multiple incremental checkpoints must be replayed sequentially",
        "Adds complexity to track which state elements have changed since the last checkpoint",
        "Requires occasional full checkpoints to bound recovery time and prevent long replay chains",
        "Vulnerable to corruption in checkpoint chain where lost incremental checkpoint breaks recovery",
      ],
    },
    relatedPatterns: [
      "coordinated-checkpoint",
      "write-ahead-log",
      "copy-on-write",
      "snapshot-isolation",
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
      id: "incremental-checkpoint-ts-basic",
      language: "typescript",
      title: "Incremental Checkpoint with Delta Tracking",
      description:
        "Incremental checkpointing system that tracks changed state keys and only writes deltas, dramatically reducing checkpoint size and I/O overhead",
      code: `type CheckpointType = 'full' | 'incremental';

interface BaseCheckpoint {
  checkpointId: number;
  timestamp: number;
  type: CheckpointType;
}

interface FullCheckpoint extends BaseCheckpoint {
  type: 'full';
  fullState: Map<string, any>;
  stateSize: number;
}

interface IncrementalCheckpoint extends BaseCheckpoint {
  type: 'incremental';
  baseCheckpointId: number;
  deltaState: Map<string, any>;
  deltaSize: number;
}

type Checkpoint = FullCheckpoint | IncrementalCheckpoint;

class IncrementalStateManager {
  private state: Map<string, any> = new Map();
  private dirtyKeys: Set<string> = new Set();
  private lastCheckpointState: Map<string, any> = new Map();

  get(key: string): any {
    return this.state.get(key);
  }

  set(key: string, value: any): void {
    this.state.set(key, value);
    this.dirtyKeys.add(key);
  }

  delete(key: string): void {
    this.state.delete(key);
    this.dirtyKeys.add(key);
  }

  getFullState(): Map<string, any> {
    return new Map(this.state);
  }

  getDirtyState(): Map<string, any> {
    const delta = new Map<string, any>();
    for (const key of this.dirtyKeys) {
      if (this.state.has(key)) {
        delta.set(key, this.state.get(key));
      } else {
        delta.set(key, null);
      }
    }
    return delta;
  }

  markClean(): void {
    this.dirtyKeys.clear();
    this.lastCheckpointState = new Map(this.state);
  }

  getDirtyKeyCount(): number {
    return this.dirtyKeys.size;
  }

  getTotalKeyCount(): number {
    return this.state.size;
  }

  restoreFromFull(state: Map<string, any>): void {
    this.state = new Map(state);
    this.dirtyKeys.clear();
    this.lastCheckpointState = new Map(state);
  }

  applyDelta(delta: Map<string, any>): void {
    for (const [key, value] of delta) {
      if (value === null) {
        this.state.delete(key);
      } else {
        this.state.set(key, value);
      }
    }
  }
}

class IncrementalCheckpointManager {
  private stateManager: IncrementalStateManager;
  private checkpoints: Checkpoint[] = [];
  private lastCheckpointId = 0;
  private lastFullCheckpointId = 0;
  private fullCheckpointInterval: number;
  private checkpointsSinceLastFull = 0;

  constructor(fullCheckpointInterval: number = 5) {
    this.stateManager = new IncrementalStateManager();
    this.fullCheckpointInterval = fullCheckpointInterval;
  }

  getStateManager(): IncrementalStateManager {
    return this.stateManager;
  }

  performCheckpoint(): Checkpoint {
    const shouldCreateFull =
      this.checkpointsSinceLastFull >= this.fullCheckpointInterval ||
      this.lastFullCheckpointId === 0;

    if (shouldCreateFull) {
      return this.createFullCheckpoint();
    } else {
      return this.createIncrementalCheckpoint();
    }
  }

  private createFullCheckpoint(): FullCheckpoint {
    const checkpointId = ++this.lastCheckpointId;
    this.lastFullCheckpointId = checkpointId;
    this.checkpointsSinceLastFull = 0;

    const fullState = this.stateManager.getFullState();
    const checkpoint: FullCheckpoint = {
      checkpointId,
      timestamp: Date.now(),
      type: 'full',
      fullState,
      stateSize: fullState.size
    };

    this.checkpoints.push(checkpoint);
    this.stateManager.markClean();

    console.log(\`\n[Checkpoint \${checkpointId}] FULL checkpoint created\`);
    console.log(\`  State size: \${checkpoint.stateSize} keys\`);
    console.log(\`  Storage: Writing entire state to disk\`);

    return checkpoint;
  }

  private createIncrementalCheckpoint(): IncrementalCheckpoint {
    const checkpointId = ++this.lastCheckpointId;
    this.checkpointsSinceLastFull++;

    const deltaState = this.stateManager.getDirtyState();
    const checkpoint: IncrementalCheckpoint = {
      checkpointId,
      timestamp: Date.now(),
      type: 'incremental',
      baseCheckpointId: this.lastFullCheckpointId,
      deltaState,
      deltaSize: deltaState.size
    };

    this.checkpoints.push(checkpoint);
    this.stateManager.markClean();

    const totalKeys = this.stateManager.getTotalKeyCount();
    const compressionRatio = totalKeys > 0
      ? ((1 - deltaState.size / totalKeys) * 100).toFixed(1)
      : '0.0';

    console.log(\`\n[Checkpoint \${checkpointId}] INCREMENTAL checkpoint created\`);
    console.log(\`  Base checkpoint: \${this.lastFullCheckpointId}\`);
    console.log(\`  Delta size: \${checkpoint.deltaSize} keys (changed)\`);
    console.log(\`  Total state: \${totalKeys} keys\`);
    console.log(\`  Compression: \${compressionRatio}% reduction vs full checkpoint\`);

    return checkpoint;
  }

  recoverFromCheckpoints(): void {
    if (this.checkpoints.length === 0) {
      console.log('No checkpoints available for recovery');
      return;
    }

    const latestCheckpoint = this.checkpoints[this.checkpoints.length - 1];

    console.log(\`\n[Recovery] Starting recovery to checkpoint \${latestCheckpoint.checkpointId}\`);

    if (latestCheckpoint.type === 'full') {
      console.log('  Latest checkpoint is FULL - direct restore');
      this.stateManager.restoreFromFull(latestCheckpoint.fullState);
      console.log(\`  Restored \${latestCheckpoint.stateSize} keys\`);
      return;
    }

    const incrementalChain: IncrementalCheckpoint[] = [];
    let baseCheckpoint: FullCheckpoint | null = null;

    for (let i = this.checkpoints.length - 1; i >= 0; i--) {
      const cp = this.checkpoints[i];

      if (cp.type === 'incremental') {
        incrementalChain.unshift(cp as IncrementalCheckpoint);
      } else if (cp.type === 'full') {
        baseCheckpoint = cp as FullCheckpoint;
        break;
      }
    }

    if (!baseCheckpoint) {
      throw new Error('No full checkpoint found in chain');
    }

    console.log(\`  Base checkpoint: \${baseCheckpoint.checkpointId} (FULL)\`);
    console.log(\`  Incremental chain: \${incrementalChain.length} checkpoints\`);

    this.stateManager.restoreFromFull(baseCheckpoint.fullState);
    console.log(\`  Restored base state: \${baseCheckpoint.stateSize} keys\`);

    for (const incCheckpoint of incrementalChain) {
      this.stateManager.applyDelta(incCheckpoint.deltaState);
      console.log(\`  Applied delta \${incCheckpoint.checkpointId}: \${incCheckpoint.deltaSize} changes\`);
    }

    const finalSize = this.stateManager.getTotalKeyCount();
    console.log(\`\n[Recovery] Complete - Final state: \${finalSize} keys\`);
  }

  getCheckpointStats() {
    const fullCheckpoints = this.checkpoints.filter(cp => cp.type === 'full').length;
    const incrementalCheckpoints = this.checkpoints.filter(cp => cp.type === 'incremental').length;

    const totalDataWritten = this.checkpoints.reduce((sum, cp) => {
      return sum + (cp.type === 'full' ? cp.stateSize : cp.deltaSize);
    }, 0);

    const totalStateSize = this.stateManager.getTotalKeyCount() * this.checkpoints.length;
    const spaceSavings = totalStateSize > 0
      ? ((1 - totalDataWritten / totalStateSize) * 100).toFixed(1)
      : '0.0';

    return {
      totalCheckpoints: this.checkpoints.length,
      fullCheckpoints,
      incrementalCheckpoints,
      totalDataWritten,
      hypotheticalFullSize: totalStateSize,
      spaceSavings: \`\${spaceSavings}%\`
    };
  }
}

async function demonstrateIncrementalCheckpoint() {
  const manager = new IncrementalCheckpointManager(3);
  const state = manager.getStateManager();

  console.log('=== Incremental Checkpointing Demo ===');
  console.log('Full checkpoint every 3 incremental checkpoints\n');

  console.log('Phase 1: Initial state creation');
  for (let i = 0; i < 1000; i++) {
    state.set(\`key_\${i}\`, \`value_\${i}\`);
  }
  console.log(\`Created 1000 keys\`);

  manager.performCheckpoint();

  console.log('\nPhase 2: Small updates (1% of keys)');
  for (let i = 0; i < 10; i++) {
    state.set(\`key_\${i}\`, \`updated_value_\${i}\`);
  }
  manager.performCheckpoint();

  console.log('\nPhase 3: Another small update');
  for (let i = 10; i < 20; i++) {
    state.set(\`key_\${i}\`, \`updated_value_\${i}\`);
  }
  manager.performCheckpoint();

  console.log('\nPhase 4: Third incremental triggers full checkpoint');
  for (let i = 20; i < 30; i++) {
    state.set(\`key_\${i}\`, \`updated_value_\${i}\`);
  }
  manager.performCheckpoint();

  console.log('\nPhase 5: More incremental checkpoints');
  for (let i = 30; i < 40; i++) {
    state.set(\`key_\${i}\`, \`updated_value_\${i}\`);
  }
  manager.performCheckpoint();

  console.log('\n=== Checkpoint Statistics ===');
  const stats = manager.getCheckpointStats();
  console.log(\`Total checkpoints: \${stats.totalCheckpoints}\`);
  console.log(\`  Full: \${stats.fullCheckpoints}\`);
  console.log(\`  Incremental: \${stats.incrementalCheckpoints}\`);
  console.log(\`Data written: \${stats.totalDataWritten} keys\`);
  console.log(\`If all full checkpoints: \${stats.hypotheticalFullSize} keys\`);
  console.log(\`Space savings: \${stats.spaceSavings}\`);

  console.log('\n=== Simulating Failure & Recovery ===');
  manager.recoverFromCheckpoints();

  console.log('\n✓ Incremental checkpointing benefits:');
  console.log('  - 90%+ reduction in checkpoint size for small working sets');
  console.log('  - Lower I/O overhead enables more frequent checkpointing');
  console.log('  - Trade-off: Recovery requires replaying incremental chain');
}

demonstrateIncrementalCheckpoint().catch(console.error);`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete incremental checkpointing system with dirty state tracking, delta compression, and recovery from checkpoint chains",
        prerequisites: [
          "State management patterns",
          "Delta encoding concepts",
          "Write amplification optimization",
          "Recovery chain reconstruction",
        ],
        systemPosition:
          "State backend within stream processing or database system, optimizes checkpoint storage and I/O by writing only changed state",
      },
      annotations: [
        {
          id: "ic-checkpoint-types",
          lines: [1, 22],
          action: "Define full vs incremental checkpoint types",
          reason:
            "Full checkpoint contains complete state snapshot, incremental contains only changes (delta) since base checkpoint - type safety prevents mixing them up",
          contextLevel: "local",
          relatedConcepts: ["type-discrimination", "delta-encoding"],
        },
        {
          id: "ic-dirty-tracking",
          lines: [24, 28],
          action: "Track dirty keys to identify changed state",
          reason:
            "Core optimization - maintain set of keys modified since last checkpoint, only these need to be written in incremental checkpoint",
          contextLevel: "module",
          relatedConcepts: ["dirty-tracking", "write-optimization"],
        },
        {
          id: "ic-state-mutation",
          lines: [34, 42],
          action: "Mark keys dirty on every set/delete operation",
          reason:
            "Any state mutation must be tracked - when you set or delete a key, add it to dirtyKeys set so it's included in next incremental checkpoint",
          contextLevel: "local",
          relatedConcepts: ["mutation-tracking", "change-detection"],
        },
        {
          id: "ic-delta-extraction",
          lines: [48, 58],
          action: "Extract only dirty keys as delta state",
          reason:
            "Incremental checkpoint writes only the delta - iterate dirty keys and build a map of just those changes, deletions represented as null values",
          contextLevel: "module",
          relatedConcepts: ["delta-compression", "change-set"],
        },
        {
          id: "ic-mark-clean",
          lines: [60, 63],
          action: "Clear dirty keys after checkpoint",
          reason:
            "After checkpoint writes dirty state, clear the dirty set so next checkpoint only captures new changes, not already-checkpointed ones",
          contextLevel: "local",
          relatedConcepts: ["state-reset", "checkpoint-boundary"],
        },
        {
          id: "ic-checkpoint-strategy",
          lines: [106, 110],
          action: "Decide between full and incremental checkpoint",
          reason:
            "Periodic full checkpoints bound recovery time - if N incrementals have been created, force a full checkpoint to prevent long recovery chains",
          contextLevel: "module",
          relatedConcepts: ["checkpoint-policy", "recovery-optimization"],
        },
        {
          id: "ic-full-checkpoint",
          lines: [113, 132],
          action: "Create full checkpoint with complete state",
          reason:
            "Full checkpoint writes entire state - resets incremental counter, becomes new base for future incrementals, ensures recovery doesn't need to replay too many deltas",
          contextLevel: "module",
          relatedConcepts: ["full-snapshot", "checkpoint-base"],
        },
        {
          id: "ic-incremental-checkpoint",
          lines: [134, 162],
          action: "Create incremental checkpoint with delta only",
          reason:
            "Incremental checkpoint writes only dirty state - references base full checkpoint, typically 90-99% smaller than full checkpoint for small working sets",
          contextLevel: "module",
          relatedConcepts: ["incremental-backup", "delta-storage"],
        },
        {
          id: "ic-compression-ratio",
          lines: [152, 155],
          action: "Calculate space savings vs full checkpoint",
          reason:
            "Observability metric - shows effectiveness of incremental checkpointing, if delta is 1% of total state, that's 99% reduction in I/O",
          contextLevel: "local",
          relatedConcepts: ["compression-metrics", "efficiency-monitoring"],
        },
        {
          id: "ic-recovery-chain",
          lines: [193, 210],
          action: "Build checkpoint chain from latest back to full checkpoint",
          reason:
            "Recovery must find base full checkpoint, then collect all incremental checkpoints in order - this builds the replay chain",
          contextLevel: "module",
          relatedConcepts: ["chain-reconstruction", "dependency-resolution"],
        },
        {
          id: "ic-delta-replay",
          lines: [216, 219],
          action: "Apply incremental deltas in chronological order",
          reason:
            "Recovery applies base state, then replays each incremental delta sequentially - this reconstructs final state at latest checkpoint",
          contextLevel: "module",
          relatedConcepts: ["replay", "state-reconstruction"],
        },
        {
          id: "ic-space-savings",
          lines: [227, 239],
          action: "Calculate total space savings across all checkpoints",
          reason:
            "Demonstrates value proposition - compare actual data written (full + deltas) vs hypothetical all-full checkpoints, typically 80-95% savings",
          contextLevel: "module",
          relatedConcepts: ["storage-optimization", "cost-analysis"],
        },
        {
          id: "ic-demo-workload",
          lines: [249, 276],
          action: "Simulate realistic workload with small working set",
          reason:
            "Create 1000 keys but only modify 10-40 per checkpoint - demonstrates incremental checkpointing works best when working set << total state",
          contextLevel: "system",
          relatedConcepts: ["working-set", "write-amplification"],
        },
      ],
      highlights: [
        {
          lines: [34, 42],
          label: "Dirty tracking on every state mutation - key optimization",
          sbvpDomain: "behavior",
        },
        {
          lines: [48, 58],
          label: "Delta extraction - only write changed keys",
          sbvpDomain: "structure",
        },
        {
          lines: [106, 110],
          label: "Checkpoint strategy balancing size and recovery time",
          sbvpDomain: "philosophy",
        },
        {
          lines: [193, 219],
          label: "Recovery chain reconstruction and replay",
          sbvpDomain: "behavior",
        },
        {
          lines: [227, 239],
          label: "Space savings visualization - 80-95% reduction",
          sbvpDomain: "visualization",
        },
        {
          lines: [152, 155],
          label: "Compression ratio calculation for monitoring",
          sbvpDomain: "visualization",
        },
      ],
    },
  ],
};
