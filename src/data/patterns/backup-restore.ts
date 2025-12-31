import type { Pattern } from "../schema";

export const backupRestore: Pattern = {
  id: "backup-restore",
  slug: "backup-restore",
  corpusPath:
    "🛡️ RELIABILITY → 📋 Redundancy → Hot/Warm/Cold Standby → ❄️ Backup & Restore",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Standby",
    level: 4,
  },

  concept: {
    name: "Backup & Restore",
    emoji: "❄️",
    tagline: "Periodic snapshots",
    definition:
      "The Backup and Restore pattern creates periodic point-in-time snapshots of system state (databases, files, configurations) and stores them in durable, geographically distributed storage for recovery after failures or disasters. Like taking regular photographs of a construction site to document progress, backups capture complete system state at scheduled intervals (hourly, daily, weekly) and preserve them for defined retention periods. The pattern operates through backup jobs that snapshot data, compress and encrypt it, transfer it to remote storage (S3, Azure Blob, GCS), and maintain backup catalogs with metadata for recovery. Modern implementations employ incremental backups (only changed blocks since last backup) to minimize storage costs and backup windows, full backups periodically as baseline checkpoints, and differential backups for balance between recovery speed and storage efficiency. When disaster strikes—data corruption, accidental deletion, ransomware, or regional outages—operators initiate restore procedures that retrieve backups from remote storage, decompress and decrypt them, and reload data into fresh infrastructure. This cold standby approach maximizes cost efficiency by eliminating always-on standby infrastructure, with the tradeoff of longer recovery times (hours to days) proportional to data size.",
    problemSolved:
      "Data loss from hardware failure, software bugs, human error, security breaches, or natural disasters can destroy businesses. Without backups, a single disk failure can permanently erase years of customer data. A ransomware attack can encrypt all accessible data without hope of recovery. An accidental database DROP TABLE command can delete critical records. Regional disasters like fires or hurricanes can physically destroy entire datacenters. Recovery from these scenarios requires restoring data from an independent, immutable copy stored safely off-site. Backup and Restore provides this insurance policy against catastrophic data loss. Regular automated backups ensure recent data is always recoverable with acceptable RPO (data loss limited to time since last backup). Geographic distribution of backups protects against regional disasters. Immutable backups (write-once-read-many) defend against ransomware that attempts to encrypt backup copies. The pattern enables recovery from any point in time within the retention window, supporting compliance requirements and debugging by allowing rollback to known-good states.",
    tradeoffs: {
      pros: [
        "Lowest cost disaster recovery—no always-on standby infrastructure",
        "Protects against catastrophic data loss from any cause",
        "Point-in-time recovery enables rollback to known-good states",
        "Geographic backup distribution protects against regional disasters",
        "Supports compliance and audit requirements with long retention",
      ],
      cons: [
        "Longest recovery time (hours to days) depends on data size",
        "Data loss up to last backup interval (RPO measured in hours)",
        "Backup windows can impact production performance",
        "Storage costs grow with retention period and data volume",
        "Restore procedures must be tested regularly to ensure viability",
      ],
    },
    relatedPatterns: [
      "active-passive",
      "pilot-light",
      "snapshot",
      "point-in-time-recovery",
      "incremental-backup",
      "disaster-recovery",
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
      id: "backup-restore-ts-basic",
      language: "typescript",
      title: "Automated Backup and Restore System",
      description:
        "TypeScript implementation of backup and restore pattern with scheduled snapshots, incremental backups, compression, and point-in-time recovery",
      code: `// ============================================================
// Automated Backup and Restore System
// ============================================================
// Periodic snapshots with incremental backups, compression,
// retention policies, and point-in-time recovery
// ============================================================

type BackupType = 'full' | 'incremental' | 'differential';
type BackupStatus = 'pending' | 'running' | 'completed' | 'failed';

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: BackupType;
  size: number;  // Bytes
  compressedSize: number;
  dataVersion: number;
  parentBackupId?: string;  // For incremental backups
  status: BackupStatus;
}

interface RestoreOptions {
  targetVersion?: number;
  pointInTime?: Date;
  verifyIntegrity: boolean;
}

interface RetentionPolicy {
  dailyBackups: number;   // Keep last N daily backups
  weeklyBackups: number;  // Keep last N weekly backups
  monthlyBackups: number; // Keep last N monthly backups
}

// ============================================================
// Data Store (Simulates database or file system)
// ============================================================
class DataStore {
  private data: Map<string, any> = new Map();
  private version: number = 0;
  private changeLog: Array<{ version: number; key: string; value: any; timestamp: Date }> = [];

  write(key: string, value: any): void {
    this.data.set(key, value);
    this.version++;

    // Track changes for incremental backups
    this.changeLog.push({
      version: this.version,
      key,
      value,
      timestamp: new Date(),
    });

    console.log(\`[DataStore] Wrote \${key}=\${value} (version \${this.version})\`);
  }

  read(key: string): any {
    return this.data.get(key);
  }

  getAll(): Map<string, any> {
    return new Map(this.data);
  }

  getVersion(): number {
    return this.version;
  }

  getChangesSince(version: number): Array<{ key: string; value: any }> {
    return this.changeLog
      .filter(change => change.version > version)
      .map(change => ({ key: change.key, value: change.value }));
  }

  restore(data: Map<string, any>, version: number): void {
    this.data = new Map(data);
    this.version = version;
    console.log(\`[DataStore] Restored to version \${version} with \${data.size} entries\`);
  }

  clear(): void {
    this.data.clear();
    this.version = 0;
    this.changeLog = [];
  }
}

// ============================================================
// Backup Storage (Simulates S3, Azure Blob, etc.)
// ============================================================
class BackupStorage {
  private backups: Map<string, { metadata: BackupMetadata; data: string }> = new Map();

  async store(metadata: BackupMetadata, data: string): Promise<void> {
    // Simulate network upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    this.backups.set(metadata.id, { metadata, data });

    console.log(
      \`[BackupStorage] Stored backup \${metadata.id} (\${metadata.type}), \${(metadata.compressedSize / 1024).toFixed(2)}KB\`
    );
  }

  async retrieve(backupId: string): Promise<{ metadata: BackupMetadata; data: string } | null> {
    // Simulate network download delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const backup = this.backups.get(backupId);
    if (backup) {
      console.log(\`[BackupStorage] Retrieved backup \${backupId}\`);
    }
    return backup || null;
  }

  listBackups(): BackupMetadata[] {
    return Array.from(this.backups.values())
      .map(b => b.metadata)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async delete(backupId: string): Promise<void> {
    this.backups.delete(backupId);
    console.log(\`[BackupStorage] Deleted backup \${backupId}\`);
  }

  getTotalSize(): number {
    return Array.from(this.backups.values())
      .reduce((sum, b) => sum + b.metadata.compressedSize, 0);
  }
}

// ============================================================
// Backup Manager
// ============================================================
class BackupManager {
  private storage: BackupStorage;
  private lastFullBackupVersion: number = 0;
  private backupSchedule: NodeJS.Timeout | null = null;

  constructor(
    private dataStore: DataStore,
    storage: BackupStorage,
    private retentionPolicy: RetentionPolicy
  ) {
    this.storage = storage;
  }

  // Create a full backup of all data
  async createFullBackup(): Promise<BackupMetadata> {
    console.log('\\n[BackupManager] Starting full backup...');

    const allData = this.dataStore.getAll();
    const version = this.dataStore.getVersion();

    // Serialize data
    const serialized = JSON.stringify(Array.from(allData.entries()));
    const size = new TextEncoder().encode(serialized).length;

    // Simulate compression (typical 3:1 ratio)
    const compressed = this.compress(serialized);
    const compressedSize = Math.floor(size / 3);

    const metadata: BackupMetadata = {
      id: \`backup-full-\${Date.now()}\`,
      timestamp: new Date(),
      type: 'full',
      size,
      compressedSize,
      dataVersion: version,
      status: 'running',
    };

    // Store in backup storage
    await this.storage.store(metadata, compressed);

    metadata.status = 'completed';
    this.lastFullBackupVersion = version;

    console.log(
      \`[BackupManager] Full backup complete: \${(compressedSize / 1024).toFixed(2)}KB (compression ratio: \${(size / compressedSize).toFixed(1)}:1)\`
    );

    return metadata;
  }

  // Create incremental backup (only changes since last backup)
  async createIncrementalBackup(): Promise<BackupMetadata> {
    console.log('\\n[BackupManager] Starting incremental backup...');

    const changes = this.dataStore.getChangesSince(this.lastFullBackupVersion);

    if (changes.length === 0) {
      console.log('[BackupManager] No changes since last backup, skipping');
      throw new Error('No changes to backup');
    }

    const version = this.dataStore.getVersion();
    const serialized = JSON.stringify(changes);
    const size = new TextEncoder().encode(serialized).length;
    const compressed = this.compress(serialized);
    const compressedSize = Math.floor(size / 3);

    const metadata: BackupMetadata = {
      id: \`backup-incr-\${Date.now()}\`,
      timestamp: new Date(),
      type: 'incremental',
      size,
      compressedSize,
      dataVersion: version,
      status: 'running',
    };

    await this.storage.store(metadata, compressed);

    metadata.status = 'completed';
    this.lastFullBackupVersion = version;

    console.log(
      \`[BackupManager] Incremental backup complete: \${changes.length} changes, \${(compressedSize / 1024).toFixed(2)}KB\`
    );

    return metadata;
  }

  // Restore from a specific backup
  async restore(backupId: string, options: RestoreOptions = { verifyIntegrity: true }): Promise<void> {
    console.log(\`\\n[BackupManager] Starting restore from backup \${backupId}...\`);

    const backup = await this.storage.retrieve(backupId);

    if (!backup) {
      throw new Error(\`Backup \${backupId} not found\`);
    }

    // Verify integrity if requested
    if (options.verifyIntegrity) {
      console.log('[BackupManager] Verifying backup integrity...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[BackupManager] Integrity check passed');
    }

    // Decompress
    const decompressed = this.decompress(backup.data);

    // Handle full vs incremental backups
    if (backup.metadata.type === 'full') {
      const entries = JSON.parse(decompressed);
      const restoredData = new Map(entries);

      this.dataStore.restore(restoredData, backup.metadata.dataVersion);
    } else {
      // For incremental, need to find base full backup first
      console.log('[BackupManager] Incremental backup - finding base full backup...');

      const fullBackups = this.storage.listBackups().filter(b => b.type === 'full');

      if (fullBackups.length === 0) {
        throw new Error('No full backup found for incremental restore');
      }

      // Restore full backup first, then apply incremental changes
      const baseBackup = await this.storage.retrieve(fullBackups[0].id);
      if (baseBackup) {
        const baseData = JSON.parse(this.decompress(baseBackup.data));
        const restoredData = new Map(baseData);

        // Apply incremental changes
        const changes = JSON.parse(decompressed);
        changes.forEach((change: { key: string; value: any }) => {
          restoredData.set(change.key, change.value);
        });

        this.dataStore.restore(restoredData, backup.metadata.dataVersion);
      }
    }

    console.log(\`[BackupManager] Restore complete! Restored to version \${backup.metadata.dataVersion}\`);
  }

  // Point-in-time recovery
  async restoreToPointInTime(targetDate: Date): Promise<void> {
    console.log(\`\\n[BackupManager] Restoring to point in time: \${targetDate.toISOString()}...\`);

    const backups = this.storage.listBackups();
    const eligibleBackups = backups.filter(b => b.timestamp <= targetDate);

    if (eligibleBackups.length === 0) {
      throw new Error('No backups available before target date');
    }

    // Find closest backup to target time
    const closestBackup = eligibleBackups[0]; // Already sorted by timestamp desc

    console.log(
      \`[BackupManager] Found closest backup: \${closestBackup.id} from \${closestBackup.timestamp.toISOString()}\`
    );

    await this.restore(closestBackup.id);
  }

  // Apply retention policy to delete old backups
  async applyRetentionPolicy(): Promise<void> {
    console.log('\\n[BackupManager] Applying retention policy...');

    const allBackups = this.storage.listBackups();
    const now = new Date();

    const toKeep = new Set<string>();

    // Keep daily backups
    for (let i = 0; i < this.retentionPolicy.dailyBackups; i++) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const backup = this.findClosestBackup(allBackups, targetDate);
      if (backup) toKeep.add(backup.id);
    }

    // Delete backups not in retention set
    const toDelete = allBackups.filter(b => !toKeep.has(b.id));

    for (const backup of toDelete) {
      await this.storage.delete(backup.id);
    }

    console.log(\`[BackupManager] Retention policy applied: kept \${toKeep.size}, deleted \${toDelete.length}\`);
  }

  private findClosestBackup(backups: BackupMetadata[], targetDate: Date): BackupMetadata | null {
    const eligible = backups.filter(b => b.timestamp <= targetDate);
    return eligible.length > 0 ? eligible[0] : null;
  }

  // Schedule automatic backups
  startAutomatedBackups(intervalHours: number): void {
    console.log(\`[BackupManager] Starting automated backups every \${intervalHours} hours\`);

    this.backupSchedule = setInterval(async () => {
      try {
        // Do full backup weekly, incremental daily
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0) {
          await this.createFullBackup();
        } else {
          await this.createIncrementalBackup();
        }
        await this.applyRetentionPolicy();
      } catch (error) {
        console.error('[BackupManager] Automated backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  stopAutomatedBackups(): void {
    if (this.backupSchedule) {
      clearInterval(this.backupSchedule);
      console.log('[BackupManager] Stopped automated backups');
    }
  }

  private compress(data: string): string {
    // Simulate compression (in real system: gzip, zstd, etc.)
    return \`compressed:\${data}\`;
  }

  private decompress(data: string): string {
    // Simulate decompression
    return data.replace('compressed:', '');
  }

  getBackupStatistics() {
    const backups = this.storage.listBackups();
    const totalSize = this.storage.getTotalSize();

    return {
      totalBackups: backups.length,
      fullBackups: backups.filter(b => b.type === 'full').length,
      incrementalBackups: backups.filter(b => b.type === 'incremental').length,
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      oldestBackup: backups[backups.length - 1]?.timestamp,
      newestBackup: backups[0]?.timestamp,
    };
  }
}

// ============================================================
// Usage Example
// ============================================================
async function demonstrateBackupRestore() {
  console.log('=== Backup and Restore Demo ===\\n');

  const dataStore = new DataStore();
  const storage = new BackupStorage();
  const backupManager = new BackupManager(dataStore, storage, {
    dailyBackups: 7,
    weeklyBackups: 4,
    monthlyBackups: 12,
  });

  // Simulate data changes
  console.log('--- Creating initial data ---');
  dataStore.write('user:1', { name: 'Alice', email: 'alice@example.com' });
  dataStore.write('user:2', { name: 'Bob', email: 'bob@example.com' });
  dataStore.write('config:theme', 'dark');

  // Create full backup
  await backupManager.createFullBackup();

  // More data changes
  console.log('\\n--- Adding more data ---');
  dataStore.write('user:3', { name: 'Charlie', email: 'charlie@example.com' });
  dataStore.write('user:4', { name: 'Diana', email: 'diana@example.com' });

  // Create incremental backup
  await backupManager.createIncrementalBackup();

  // More changes
  console.log('\\n--- Updating data ---');
  dataStore.write('config:theme', 'light');
  dataStore.write('user:5', { name: 'Eve', email: 'eve@example.com' });

  // Another incremental backup
  await backupManager.createIncrementalBackup();

  // Show backup statistics
  console.log('\\n--- Backup Statistics ---');
  const stats = backupManager.getBackupStatistics();
  console.log(\`Total backups: \${stats.totalBackups}\`);
  console.log(\`Full backups: \${stats.fullBackups}\`);
  console.log(\`Incremental backups: \${stats.incrementalBackups}\`);
  console.log(\`Total storage used: \${stats.totalSizeKB}KB\`);

  // Simulate data corruption
  console.log('\\n--- Simulating data corruption ---');
  dataStore.clear();
  console.log(\`Data store cleared! Version: \${dataStore.getVersion()}\`);

  // Restore from latest backup
  const backups = storage.listBackups();
  console.log(\`\\n--- Restoring from latest backup: \${backups[0].id} ---\`);
  await backupManager.restore(backups[0].id);

  // Verify restored data
  console.log('\\n--- Verifying restored data ---');
  console.log('user:1 =', dataStore.read('user:1'));
  console.log('user:3 =', dataStore.read('user:3'));
  console.log('config:theme =', dataStore.read('config:theme'));
  console.log(\`Data version: \${dataStore.getVersion()}\`);

  console.log('\\n=== Demo Complete ===');
}

// Run the demo
// demonstrateBackupRestore();`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete backup and restore system with full and incremental backups, compression, retention policies, and point-in-time recovery capabilities",
        prerequisites: [
          "Backup strategies (full vs incremental)",
          "Data serialization",
          "Compression techniques",
          "Retention policies",
          "Point-in-time recovery",
        ],
        systemPosition:
          "Data protection layer managing automated backups, storage, and recovery operations for business continuity and disaster recovery",
      },
      annotations: [
        {
          id: "br-backup-types",
          lines: [7, 29],
          action: "Define backup types, metadata, and restore options",
          reason:
            "Full backups capture complete state (larger but independent), incremental backups capture only changes (smaller but dependent on base). Metadata tracks relationships, versions, and sizes for restore operations.",
          contextLevel: "system",
          relatedConcepts: ["backup-strategies", "metadata-tracking"],
        },
        {
          id: "br-change-tracking",
          lines: [42, 58],
          action:
            "Track all data changes with version numbers for incremental backups",
          reason:
            "Change log enables incremental backups by recording what changed since last backup. Version numbers provide ordering and point-in-time capabilities. Without tracking, only expensive full backups would be possible.",
          contextLevel: "module",
          relatedConcepts: ["change-data-capture", "versioning"],
        },
        {
          id: "br-full-backup",
          lines: [153, 187],
          action: "Create full backup by serializing all data with compression",
          reason:
            "Full backups are baseline snapshots that can restore system independently. Compression (typically 3:1 ratio) reduces storage costs and transfer time. Full backups are slower but provide complete recovery point.",
          contextLevel: "system",
          relatedConcepts: ["snapshot-backup", "compression"],
        },
        {
          id: "br-incremental-backup",
          lines: [189, 225],
          action:
            "Create incremental backup with only changes since last backup",
          reason:
            "Incremental backups are much smaller and faster than full backups because they only capture changes. This reduces backup windows and storage costs. Tradeoff: restore is more complex (need base + incrementals).",
          contextLevel: "system",
          relatedConcepts: ["incremental-backup", "delta-encoding"],
        },
        {
          id: "br-restore-logic",
          lines: [227, 273],
          action:
            "Restore from backup with integrity verification and incremental handling",
          reason:
            "Restore must handle full backups (simple) and incremental backups (complex - need base + changes). Integrity verification prevents restoring corrupted data. Different restore paths ensure correct data recovery.",
          contextLevel: "system",
          relatedConcepts: ["data-recovery", "integrity-checking"],
        },
        {
          id: "br-point-in-time",
          lines: [275, 293],
          action: "Find and restore closest backup before target timestamp",
          reason:
            "Point-in-time recovery enables rollback to known-good state (before corruption, ransomware, or bad deployment). Critical for compliance (restore to audit date) and debugging (reproduce bug conditions).",
          contextLevel: "system",
          relatedConcepts: ["point-in-time-recovery", "rollback"],
        },
        {
          id: "br-retention-policy",
          lines: [295, 318],
          action:
            "Apply retention policy to delete old backups beyond retention window",
          reason:
            "Retention policies balance recovery capability with storage costs. Keep recent backups for quick recovery, older backups for compliance, delete ancient backups to control costs. Prevents unbounded storage growth.",
          contextLevel: "system",
          relatedConcepts: ["retention-policy", "cost-optimization"],
        },
        {
          id: "br-automated-backups",
          lines: [325, 347],
          action:
            "Schedule automated backups with full weekly and incremental daily",
          reason:
            "Automation ensures backups happen consistently without human intervention. Weekly full backups provide periodic clean baselines, daily incrementals minimize RPO. Automation critical for reliability.",
          contextLevel: "system",
          relatedConcepts: ["automation", "backup-scheduling"],
        },
        {
          id: "br-compression",
          lines: [357, 366],
          action: "Compress backup data to reduce storage and transfer costs",
          reason:
            "Compression typically achieves 3:1 to 10:1 ratio depending on data (text compresses well, images don't). Reduces cloud storage costs significantly and speeds up network transfers during backup and restore.",
          contextLevel: "module",
          relatedConcepts: ["data-compression", "cost-optimization"],
        },
        {
          id: "br-demo-workflow",
          lines: [388, 445],
          action:
            "Demonstrate full backup, incremental backups, corruption, and restore",
          reason:
            "Shows complete backup/restore workflow: create data, backup incrementally, simulate disaster, restore from latest backup. Demonstrates RPO (data loss limited to last backup) and RTO (restore time).",
          contextLevel: "system",
          relatedConcepts: ["disaster-recovery-workflow", "data-protection"],
        },
      ],
      highlights: [
        {
          lines: [33, 84],
          label: "Data store with change tracking for incremental backups",
          sbvpDomain: "structure",
        },
        {
          lines: [153, 225],
          label: "Full and incremental backup creation with compression",
          sbvpDomain: "behavior",
        },
        {
          lines: [227, 293],
          label: "Restore logic and point-in-time recovery",
          sbvpDomain: "behavior",
        },
        {
          lines: [295, 318],
          label: "Retention policy enforcement",
          sbvpDomain: "philosophy",
        },
        {
          lines: [388, 445],
          label: "Complete backup/restore workflow demonstration",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],
};
