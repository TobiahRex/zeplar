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
        name: "Backup Scheduler",
        role: "Automated Backup Orchestrator",
        responsibilities: [
          "Trigger backup jobs based on schedules (hourly, daily, weekly)",
          "Determine backup type (full vs incremental vs differential)",
          "Coordinate backup windows to minimize production impact",
          "Enforce backup policies and compliance requirements",
        ],
      },
      {
        name: "Data Snapshotter",
        role: "State Capture Engine",
        responsibilities: [
          "Create point-in-time snapshots of databases, files, configurations",
          "Track changed blocks for incremental backups (delta detection)",
          "Ensure backup consistency (quiesce writes, use transactions)",
          "Generate backup metadata (timestamp, version, size, checksum)",
        ],
      },
      {
        name: "Backup Storage",
        role: "Durable Remote Storage",
        responsibilities: [
          "Store backups in geographically distributed storage (S3, Azure Blob, GCS)",
          "Compress and encrypt backup data for efficiency and security",
          "Maintain backup catalog with searchable metadata",
          "Provide immutable storage (WORM) to protect against ransomware",
        ],
      },
      {
        name: "Restore Manager",
        role: "Recovery Orchestrator",
        responsibilities: [
          "Retrieve backups from remote storage based on recovery criteria",
          "Decompress and decrypt backup data for restoration",
          "Coordinate restore operations (full restore, incremental chain replay)",
          "Verify data integrity after restoration (checksum validation)",
        ],
      },
      {
        name: "Retention Policy Enforcer",
        role: "Lifecycle Management",
        responsibilities: [
          "Delete backups older than retention period (30 days, 7 years)",
          "Apply tiered retention (daily for 7 days, weekly for 4 weeks, monthly for 12 months)",
          "Archive old backups to cold storage (Glacier, Azure Archive)",
          "Generate compliance reports for audit requirements",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Scheduler as Backup Scheduler
    participant Snapshotter as Data Snapshotter
    participant Storage as Backup Storage
    participant Primary as Primary Database/System
    participant Retention as Retention Policy Enforcer
    participant Restore as Restore Manager

    Note over Scheduler,Storage: BACKUP CREATION FLOW

    Scheduler->>Scheduler: Check schedule (e.g., daily 2 AM)
    Scheduler->>Snapshotter: Trigger full backup
    Snapshotter->>Primary: Quiesce writes (snapshot isolation)
    Primary-->>Snapshotter: Snapshot ready
    Snapshotter->>Snapshotter: Create point-in-time snapshot
    Snapshotter->>Snapshotter: Compress data (gzip/zstd)
    Snapshotter->>Snapshotter: Encrypt backup (AES-256)
    Snapshotter->>Snapshotter: Generate checksum (SHA-256)
    Snapshotter->>Storage: Upload backup to S3 (with metadata)
    Storage->>Storage: Store in geographically distributed buckets
    Storage-->>Snapshotter: Backup ID: backup-full-20240115-020000
    Snapshotter->>Primary: Resume writes
    Snapshotter-->>Scheduler: Full backup complete (5 GB → 1.2 GB compressed)

    Note over Scheduler,Storage: INCREMENTAL BACKUP FLOW

    Scheduler->>Scheduler: Check schedule (e.g., hourly)
    Scheduler->>Snapshotter: Trigger incremental backup
    Snapshotter->>Snapshotter: Identify changed blocks since last backup
    Snapshotter->>Primary: Capture delta (changed data only)
    Primary-->>Snapshotter: Changed blocks (200 MB)
    Snapshotter->>Snapshotter: Compress and encrypt delta
    Snapshotter->>Storage: Upload incremental backup
    Storage-->>Snapshotter: Backup ID: backup-incr-20240115-030000
    Snapshotter-->>Scheduler: Incremental complete (200 MB → 50 MB)

    Note over Scheduler,Restore: RESTORE FLOW

    Restore->>Storage: List available backups for point-in-time 2024-01-15 05:00
    Storage-->>Restore: Full: backup-full-20240115-020000, Incremental: backup-incr-*
    Restore->>Storage: Download full backup
    Storage-->>Restore: Encrypted compressed full backup (1.2 GB)
    Restore->>Restore: Decrypt and decompress
    Restore->>Restore: Verify checksum integrity
    Restore->>Storage: Download incremental backups in sequence
    Storage-->>Restore: Incremental backups
    Restore->>Restore: Apply incrementals to full backup
    Restore->>Primary: Restore data to new instance
    Primary->>Primary: Verify data integrity
    Primary-->>Restore: Restore complete

    Note over Retention,Storage: RETENTION POLICY ENFORCEMENT

    Retention->>Storage: List all backups
    Storage-->>Retention: 90 backups (full + incrementals)
    Retention->>Retention: Apply policy: keep daily for 7 days, weekly for 4 weeks
    Retention->>Retention: Identify 15 expired backups
    Retention->>Storage: Delete expired backups
    Storage-->>Retention: Deleted 15 backups, freed 800 MB`,
    flow: [
      {
        step: 1,
        actor: "Backup Scheduler",
        action: "Trigger Scheduled Backup",
        description:
          "Scheduler initiates backup job based on configured schedule (e.g., daily full backup at 2 AM, hourly incremental during business hours). Determines backup type (full, incremental, differential) based on policy.",
      },
      {
        step: 2,
        actor: "Data Snapshotter",
        action: "Create Snapshot",
        description:
          "Snapshotter creates point-in-time snapshot of data. For full backups, captures all data; for incremental, identifies changed blocks since last backup using change tracking logs or block-level differencing.",
      },
      {
        step: 3,
        actor: "Data Snapshotter",
        action: "Compress and Encrypt",
        description:
          "Backup data is compressed (gzip, zstd) to reduce storage costs (typical 3:1 to 10:1 ratio for databases/logs) and encrypted (AES-256) to protect sensitive data. Checksum (SHA-256) generated for integrity verification.",
      },
      {
        step: 4,
        actor: "Backup Storage",
        action: "Transfer to Remote Storage",
        description:
          "Compressed encrypted backup transferred to geographically distributed cloud storage (S3, Azure Blob, GCS) or offsite datacenter. Transfer includes metadata: timestamp, version, size, parent backup ID (for incrementals).",
      },
      {
        step: 5,
        actor: "Backup Storage",
        action: "Store with Geographic Distribution",
        description:
          "Backup stored in multiple regions/availability zones for disaster recovery. Metadata indexed in backup catalog for searchable recovery. Immutable storage (WORM) prevents modification/deletion for ransomware protection.",
      },
      {
        step: 6,
        actor: "Retention Policy Enforcer",
        action: "Apply Retention Policy",
        description:
          "Retention policy enforcer identifies backups exceeding retention period (e.g., daily backups older than 7 days, monthly older than 1 year). Archives old backups to cold storage (Glacier) or deletes to control costs.",
      },
      {
        step: 7,
        actor: "Restore Manager",
        action: "Initiate Recovery",
        description:
          "On disaster/data loss, operator initiates restore specifying target point-in-time or backup ID. Restore Manager queries backup catalog to identify required backups (base full + subsequent incrementals).",
      },
      {
        step: 8,
        actor: "Restore Manager",
        action: "Download and Verify Backups",
        description:
          "Restore Manager downloads required backups from remote storage. Verifies checksums to ensure data integrity during transfer. Decrypts and decompresses backup data.",
      },
      {
        step: 9,
        actor: "Restore Manager",
        action: "Restore Data",
        description:
          "For full restore: load base backup, then apply incremental changes in sequence. For database restore: import SQL dump or restore binary backup. For file system: extract files to target directory. Verify data consistency after restore.",
      },
      {
        step: 10,
        actor: "Restore Manager",
        action: "Validate Recovery",
        description:
          "Post-restore validation: check data integrity, verify application functionality, test key workflows. Measure Recovery Point Objective (RPO - data loss from last backup) and Recovery Time Objective (RTO - time to restore).",
      },
    ],
    invariants: [
      "Backups must be stored geographically separate from primary data (different region/datacenter)",
      "Backup integrity must be verifiable via checksums before relying on for restore",
      "Full backup must exist before incremental backups can be created (base + deltas)",
      "Retention policy must preserve backups required for compliance (e.g., 7 years for financial data)",
      "Backup encryption keys must be stored separately from backup data",
      "Restore procedures must be tested regularly to verify viability (test restores quarterly)",
      "Backup windows must not exceed available maintenance window or impact production SLAs",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Database Backup Systems - Backup-Restore is implemented at the database layer using native tools like PostgreSQL's pg_basebackup, MySQL's mysqldump, or Oracle RMAN. The backup process runs as scheduled jobs (cron, systemd timers, or cloud scheduler) that execute during maintenance windows (e.g., daily full backup at 2 AM, hourly WAL archiving). PostgreSQL's continuous archiving with WAL (Write-Ahead Log) shipping enables point-in-time recovery: pg_basebackup creates baseline full backup, WAL segments archive transaction logs every 5 minutes to S3, enabling restore to any second within retention window. MySQL's binary log replication serves dual purpose: streaming replication to read replicas AND backup via binlog archiving to GCS. The placement at the database engine level ensures transactional consistency through MVCC snapshots or FLUSH TABLES WITH READ LOCK. For cloud databases (RDS, Cloud SQL, Azure Database), backup-restore is infrastructure-managed: automated daily snapshots to multi-region storage, configurable retention (7-35 days), one-click restore to new instance. MongoDB's mongodump captures BSON snapshots with --oplog flag for consistency, while Cassandra uses nodetool snapshot for per-node backups coordinated across the cluster. The architectural boundary is critical—backups must capture consistent state despite concurrent writes, achieved through snapshot isolation (PostgreSQL), LOCK TABLES (MySQL), or filesystem snapshots (LVM, ZFS).",

      "Cloud-Native Backup Services - AWS Backup, Azure Backup, and Google Cloud Backup provide centralized backup orchestration across multiple services (EC2, RDS, EBS, EFS, DynamoDB). The backup service sits at the infrastructure control plane, managing backup policies, schedules, retention, and cross-region replication through declarative configuration. AWS Backup policy defines: resource selection (tag-based: backup all resources tagged 'critical'), backup frequency (daily at 3 AM UTC), retention (30 days), lifecycle (transition to cold storage after 7 days), and destination (backup vault in us-west-2). The service coordinates backups across heterogeneous resources: EBS snapshots use block-level incremental backups, RDS uses automated snapshots + transaction logs, DynamoDB uses on-demand backups or PITR (Point-In-Time Recovery) with continuous backups. Placement at the cloud platform level enables cross-service consistency—backup window coordination ensures EBS snapshots align with EC2 instance state and RDS snapshots. Azure Backup implements Application-Consistent snapshots using VSS (Volume Shadow Copy Service) for Windows and pre/post-scripts for Linux, ensuring database consistency without downtime. Google Cloud Backup integrates with Cloud Storage for long-term retention (Nearline, Coldline, Archive tiers) and provides instant recovery via snapshot-based VM creation. The architectural advantage: centralized governance (compliance policies enforced globally), automated testing (restore validation jobs), and cost optimization (intelligent tiering based on access patterns).",

      "Application-Level Backup for File Systems and Configuration - Application backup focuses on file systems, configuration files, application state, and user-generated content using tools like Restic, Duplicity, or Bacula. The backup client runs on application servers, backing up /var/www, /etc, /home, and application-specific directories to remote storage. Restic implements content-addressed storage with deduplication: identical files/blocks stored once across all backups, dramatically reducing storage for incremental backups (e.g., daily VM image backups with 95% duplicate blocks consume 5% additional space). The placement is at the filesystem level using FUSE mounts or native filesystem APIs, with snapshot capabilities via LVM snapshots or Btrfs/ZFS snapshots ensuring consistent backups of live filesystems. Restic's encryption-at-rest (AES-256) with client-side keys ensures cloud storage providers (S3, B2, GCS) cannot access backup contents. Backup repositories support multiple backends: local disk (for staging), NFS (for datacenter backups), cloud object storage (for offsite/DR), and SFTP (for remote servers). Application backup strategies include: configuration as code (GitOps approach where infrastructure config lives in Git, versioned backups), database dumps (pg_dump, mysqldump) stored alongside application code, and stateful application data (user uploads, caches). Docker volume backups use docker run --volumes-from to create tar archives of named volumes, while Kubernetes persistent volume backups leverage Velero to snapshot PVCs and store in S3 with namespace/label filtering.",

      "Container and VM Snapshot Systems - Container and VM backup operates at the infrastructure abstraction layer, capturing entire machine images including OS, applications, and data. Docker volumes backup uses volume drivers (Rex-Ray, Portworx) with snapshot capabilities: create point-in-time snapshots of named volumes, export to tar archives, store in registry alongside container images. Kubernetes backup via Velero captures cluster state (deployments, services, configmaps) AND persistent volumes (EBS, Azure Disk, GCE PD) in coordinated snapshots. Velero's backup flow: label-based resource selection (backup namespace='production'), pre-backup hooks (quiesce databases), snapshot PVCs via CSI VolumeSnapshot, export cluster resource YAML to S3, post-backup hooks (resume operations). The architectural placement enables disaster recovery across cluster failures: restore to new cluster in different region, preserving namespace isolation, RBAC policies, and stateful application data. EC2 AMI (Amazon Machine Image) backups capture entire instance state: EBS root volume + attached volumes as snapshots, instance metadata, tags, IAM roles. AMI-based backup enables rapid disaster recovery: launch new EC2 instances from AMI in minutes, auto-scaling groups can reference AMI for fleet rebuilds. VM snapshot systems (VMware vSphere, Hyper-V, Proxmox) use hypervisor-level snapshots: quiesce guest OS (VSS on Windows, filesystem sync on Linux), snapshot virtual disks (VMDK, VHD), export to backup storage (NFS, iSCSI). The placement at the hypervisor layer enables application-agnostic backups but increases recovery time (full VM restore) compared to granular database restores.",

      "Cross-Region Backup Replication for Disaster Recovery - Cross-region replication ensures backups survive regional disasters (datacenter fires, natural disasters, political instability) by asynchronously copying backups to geographically distant storage. S3 Cross-Region Replication (CRR) automatically replicates backup objects from us-east-1 to eu-west-1 with eventual consistency (typically seconds to minutes). The replication layer sits between backup storage and disaster recovery targets, configured via bucket policies: replicate objects tagged 'backup' AND 'critical' to DR region, apply different storage class (S3 Standard-IA in primary, Glacier in DR for cost optimization). Azure Backup geo-redundant storage (GRS) provides automatic cross-region replication: backups in East US replicate to West US (paired regions 300+ miles apart), enabling restore in secondary region if primary unavailable. The architectural boundary is the storage tier—replication occurs transparently after backup completes, not during backup creation. Retention policies apply independently per region: primary region keeps 30 days online, DR region keeps 90 days with 60 days in cold storage. Database-specific cross-region backup uses streaming replication: PostgreSQL's WAL shipping to S3 in multiple regions, MongoDB's cloud-based backups with multi-region snapshots. The placement at the storage replication layer (not application layer) ensures consistency: backup completes in primary region, checksum verified, then replicated to DR region with integrity validation. RPO for cross-region backups is higher (minutes to hours) than local backups (seconds) due to replication lag, but RTO comparable (restore from remote region takes same time as local restore plus network transfer).",
    ],
    interactsWith: [
      "active-passive",
      "pilot-light",
      "snapshot",
      "point-in-time-recovery",
      "incremental-backup",
      "disaster-recovery",
      "encryption",
      "compression",
      "deduplication",
      "retention-policy",
    ],
    architecturalBoundaries: [
      "Data Consistency Boundary (Transaction Isolation) - Backups must capture consistent state despite concurrent writes. Databases use MVCC snapshots (PostgreSQL), table locks (MySQL), or quiesce operations (MongoDB) to ensure backup represents valid point-in-time state. Without consistency mechanisms, restored data could have orphaned foreign keys, incomplete transactions, or corrupted indexes. The architectural boundary is the transaction coordinator: backups trigger BEGIN TRANSACTION (read-only), capture snapshot, COMMIT. For distributed systems (microservices, sharded databases), achieving consistency requires coordinated snapshots across services using distributed transactions or eventual consistency with reconciliation.",

      "Backup Window vs Production Performance - Backup operations compete with production workload for I/O, CPU, and network bandwidth. The architectural boundary is resource isolation: backups run during maintenance windows (2-6 AM), use I/O throttling (ionice on Linux, EBS-optimized instances on AWS), or read from replicas instead of primary. PostgreSQL's pg_basebackup can run against hot standby replica, eliminating production impact. MySQL replication delay during backups (replica pauses replication, performs backup, resumes) must stay within acceptable lag thresholds. Cloud-native backups (RDS automated snapshots) use storage-level snapshots (EBS snapshots) with minimal performance impact due to copy-on-write at block storage layer.",

      "Backup Storage vs Operational Database - Backups must be stored separately from operational systems to survive correlated failures. The architectural boundary is failure domain isolation: backups in different AWS account (prevent IAM compromise from deleting backups), different cloud provider (AWS primary + Azure backup), or physical location (on-prem primary + cloud backup). Ransomware protection requires immutable backups: S3 Object Lock with governance/compliance mode prevents deletion even by root account for retention period. The anti-pattern is storing backups on same NAS/SAN as primary database—storage controller failure destroys both.",

      "Restore Performance vs Backup Frequency - More frequent backups improve RPO (less data loss) but increase storage costs and restore complexity. The architectural boundary is backup strategy: daily full backups + hourly incrementals balances RPO (≤1 hour data loss) with RTO (restore full + replay 1-24 incrementals). Differential backups (changes since last full) reduce restore time (full + single differential) but increase backup size over time. Point-in-time recovery (PITR) via transaction log archiving enables restore to any second but increases storage (retain all transaction logs within retention window) and restore complexity (replay logs from full backup to target timestamp).",
    ],
  },

  implementations: [
    {
      id: "aws-backup",
      name: "AWS Backup - Cloud-Native Backup Service",
      type: "service",
      languages: ["any"],
      description:
        "AWS Backup is a fully managed backup service that centralizes and automates data protection across AWS services including EC2, EBS, RDS, DynamoDB, EFS, and FSx. Provides policy-based backup scheduling, cross-region replication, lifecycle management, and compliance reporting.",
      links: {
        docs: "https://docs.aws.amazon.com/aws-backup/",
      },
      codeSnippet: `# AWS Backup plan using CloudFormation/Terraform
Resources:
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: ProductionDailyBackup

        # Backup schedule and retention
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref ProductionBackupVault

            # Schedule: Daily at 2 AM UTC
            ScheduleExpression: "cron(0 2 * * ? *)"

            # Retention: 30 days, move to cold storage after 7 days
            Lifecycle:
              DeleteAfterDays: 30
              MoveToColdStorageAfterDays: 7

            # Cross-region copy for DR
            CopyActions:
              - DestinationBackupVaultArn: !GetAtt DRBackupVault.Arn
                Lifecycle:
                  DeleteAfterDays: 90

  # Backup vault with encryption
  ProductionBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: production-backups
      EncryptionKeyArn: !GetAtt BackupKey.Arn

      # Lock vault to prevent deletion (ransomware protection)
      LockConfiguration:
        MinRetentionDays: 7

  # Select resources to backup using tags
  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: ProductionResources
        IamRoleArn: !GetAtt BackupRole.Arn

        # Backup all resources tagged with backup=daily
        Resources:
          - "*"
        Conditions:
          StringEquals:
            - ConditionKey: "aws:ResourceTag/backup"
              ConditionValue: "daily"

# Restore from AWS Backup using AWS CLI
aws backup start-restore-job \\
  --recovery-point-arn arn:aws:backup:us-east-1:123456789012:recovery-point:1234abcd \\
  --iam-role-arn arn:aws:iam::123456789012:role/BackupRestoreRole \\
  --metadata \\
    file://restore-metadata.json

# Features:
# - Automated backup scheduling with cron expressions
# - Cross-region replication for disaster recovery
# - Lifecycle policies (hot → cold storage → deletion)
# - Compliance reporting (backup coverage, retention verification)
# - Point-in-time restore for supported services (RDS, DynamoDB)
# - Immutable backups via Vault Lock (WORM storage)
#
# When to use:
# - Multi-service AWS backup centralization
# - Compliance requirements (HIPAA, PCI-DSS, GDPR)
# - Cross-region DR with automated failover
# - Cost optimization via intelligent tiering`,
    },
    {
      id: "pg-basebackup",
      name: "PostgreSQL pg_basebackup & WAL Archiving",
      type: "platform",
      languages: ["sql"],
      description:
        "PostgreSQL's native backup solution combining pg_basebackup (full binary backups) with continuous WAL (Write-Ahead Log) archiving for point-in-time recovery. Enables zero-data-loss recovery with transaction-level granularity.",
      links: {
        docs: "https://www.postgresql.org/docs/current/continuous-archiving.html",
      },
      codeSnippet: `-- PostgreSQL continuous archiving configuration (postgresql.conf)

-- Enable WAL archiving for point-in-time recovery
wal_level = replica                    -- or 'logical' for logical replication
archive_mode = on
archive_command = 'aws s3 cp %p s3://my-backup-bucket/wal/%f'  -- Archive WAL to S3
archive_timeout = 300                  -- Force WAL switch every 5 minutes (max data loss)

-- Configure WAL retention
wal_keep_size = '10GB'                -- Keep 10GB of WAL files locally
max_wal_senders = 5                   -- Allow 5 concurrent backup connections

-- Full backup using pg_basebackup (run as cron job)
#!/bin/bash
# Daily full backup script

BACKUP_DIR="/backups/postgres/$(date +%Y%m%d)"
S3_BUCKET="s3://my-backup-bucket/basebackups"

# Create full backup with WAL files included
pg_basebackup \\
  --host=localhost \\
  --username=backup_user \\
  --pgdata="$BACKUP_DIR" \\
  --format=tar \\                     # Compressed tar format
  --gzip \\                           # Compress with gzip
  --checkpoint=fast \\                # Force checkpoint for consistency
  --wal-method=stream \\              # Stream WAL during backup
  --progress \\                       # Show progress
  --verbose

# Upload to S3 with encryption
aws s3 cp "$BACKUP_DIR" "$S3_BUCKET/$(date +%Y%m%d)/" \\
  --recursive \\
  --storage-class STANDARD_IA \\      # Infrequent Access tier
  --server-side-encryption AES256

# Retention: Delete backups older than 30 days
find /backups/postgres -type d -mtime +30 -exec rm -rf {} +

# Point-in-time recovery (restore to specific timestamp)
# 1. Stop PostgreSQL
systemctl stop postgresql

# 2. Restore base backup
rm -rf /var/lib/postgresql/14/main/*
tar -xzf /backups/postgres/20240115/base.tar.gz -C /var/lib/postgresql/14/main/

# 3. Configure recovery target time
cat > /var/lib/postgresql/14/main/recovery.conf <<EOF
restore_command = 'aws s3 cp s3://my-backup-bucket/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00'  # Restore to this timestamp
recovery_target_action = 'promote'            # Become primary after recovery
EOF

# 4. Start PostgreSQL (will replay WAL to target time)
systemctl start postgresql

# Features:
# - Zero data loss with continuous WAL archiving (RPO: seconds)
# - Point-in-time recovery to any timestamp within retention
# - Minimal production impact (backup from hot standby)
# - Compressed backups (gzip reduces size 3-10x)
#
# Metrics:
# - Backup size: 100GB database → 15GB compressed
# - Backup time: 30 minutes for 100GB database
# - Restore time: 45 minutes (30min base + 15min WAL replay)
# - RPO: 5 minutes (archive_timeout setting)
# - RTO: <1 hour for typical database sizes`,
    },
    {
      id: "restic",
      name: "Restic - Fast, Encrypted, Deduplicated Backups",
      type: "platform",
      languages: ["any"],
      description:
        "Restic is a modern backup program that is fast, secure, and efficient. Uses content-addressed storage with deduplication, client-side encryption, and supports multiple backends (S3, B2, Azure, GCS, SFTP, local).",
      links: {
        docs: "https://restic.readthedocs.io/",
        github: "https://github.com/restic/restic",
      },
      codeSnippet: `#!/bin/bash
# Restic automated backup script for application servers

# Configuration
export RESTIC_REPOSITORY="s3:s3.amazonaws.com/my-backup-bucket"
export RESTIC_PASSWORD_FILE="/etc/restic/password"
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."

# Initialize repository (first time only)
# restic init

# Full backup of application directories
restic backup \\
  /var/www \\                          # Web application files
  /etc \\                              # Configuration files
  /home \\                             # User home directories
  --exclude="*.log" \\                 # Exclude log files
  --exclude="node_modules" \\          # Exclude dependencies (can be reinstalled)
  --exclude="*.tmp" \\
  --tag production \\                  # Tag for organization
  --tag daily \\
  --verbose

# Restic deduplication in action:
# - First backup: 50GB uploaded
# - Second backup (99% same files): 500MB uploaded (1% changes)
# - Deduplication ratio: 100:1 for incremental backups

# Retention policy: GFS (Grandfather-Father-Son)
restic forget \\
  --keep-daily 7 \\                   # Keep 7 daily backups
  --keep-weekly 4 \\                  # Keep 4 weekly backups
  --keep-monthly 12 \\                # Keep 12 monthly backups
  --keep-yearly 3 \\                  # Keep 3 yearly backups
  --prune \\                          # Delete unreferenced data
  --tag production

# List all backups (snapshots)
restic snapshots --tag production

# Restore from specific backup
restic restore latest \\
  --target /restore \\
  --path /var/www \\                  # Restore only /var/www
  --tag production

# Restore to point-in-time
restic restore \\
  --target /restore \\
  --snapshot 2024-01-15T14:30:00 \\   # Specific timestamp
  --verify                            # Verify integrity after restore

# Check backup integrity
restic check \\
  --read-data-subset=10%              # Verify 10% of data blocks

# Repository statistics
restic stats --mode raw-data
# Output:
# Total File Count: 1.5M files
# Total Size: 250GB
# Total Blob Count: 15M blobs (deduplicated blocks)
# Compression Ratio: 3.2:1

# Features:
# - Client-side encryption (AES-256, repository encrypted at rest)
# - Content-addressed storage (identical files/blocks stored once)
# - Snapshot-based backups (immutable, versioned)
# - Multi-backend support (S3, B2, Azure, GCS, local, SFTP)
# - Incremental forever (no periodic full backups needed)
# - Fast restores (parallel downloads, resume capability)
#
# When to use:
# - File system backups for application servers
# - Laptop/workstation backups with deduplication
# - Docker volume backups (mount volumes and backup)
# - Cross-cloud backup (backup to multiple providers)`,
    },
    {
      id: "velero",
      name: "Velero - Kubernetes Backup and Restore",
      type: "platform",
      languages: ["kubernetes"],
      description:
        "Velero (formerly Ark) is an open-source tool for backing up and restoring Kubernetes cluster resources and persistent volumes. Supports disaster recovery, cluster migration, and namespace isolation.",
      links: {
        docs: "https://velero.io/docs/",
        github: "https://github.com/vmware-tanzu/velero",
      },
      codeSnippet: `# Install Velero with AWS S3 backend
velero install \\
  --provider aws \\
  --plugins velero/velero-plugin-for-aws:v1.5.0 \\
  --bucket velero-backups \\
  --backup-location-config region=us-east-1 \\
  --snapshot-location-config region=us-east-1 \\
  --secret-file ./credentials-velero

# Backup entire namespace
velero backup create production-backup \\
  --include-namespaces production \\
  --storage-location default \\
  --snapshot-volumes \\              # Backup persistent volumes via CSI snapshots
  --ttl 720h                         # Retain for 30 days

# Backup with label selector
velero backup create critical-apps \\
  --selector app=database,tier=critical \\
  --include-cluster-resources=true

# Scheduled backups
velero schedule create production-daily \\
  --schedule="0 2 * * *" \\          # Daily at 2 AM
  --include-namespaces production \\
  --ttl 168h                         # 7 day retention

# Backup hooks (quiesce database before backup)
apiVersion: v1
kind: Pod
metadata:
  name: postgres
  annotations:
    # Pre-backup hook: flush WAL and checkpoint
    pre.hook.backup.velero.io/command: '["/bin/bash", "-c", "psql -c \\"CHECKPOINT\\""]'
    pre.hook.backup.velero.io/container: postgres

    # Post-backup hook: resume normal operations
    post.hook.backup.velero.io/command: '["/bin/bash", "-c", "echo \\"Backup complete\\""]'

# List backups
velero backup get
# NAME                  STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES
# production-backup     Completed   0        0          2024-01-15 02:00:00 +0000 UTC   29d

# Restore to same cluster (disaster recovery)
velero restore create production-restore \\
  --from-backup production-backup \\
  --include-namespaces production \\
  --restore-volumes                  # Restore PVCs from snapshots

# Restore to different cluster (migration)
# 1. Install Velero in target cluster with same S3 bucket
# 2. Restore backup
velero restore create migration-restore \\
  --from-backup production-backup \\
  --namespace-mappings production:production-new

# Partial restore (specific resources)
velero restore create db-restore \\
  --from-backup production-backup \\
  --include-resources persistentvolumeclaims,deployments \\
  --selector app=database

# Backup verification
velero backup describe production-backup --details
velero backup logs production-backup

# Features:
# - Cluster resource backup (deployments, services, configmaps)
# - Persistent volume backup via CSI snapshots
# - Backup hooks for application consistency
# - Cross-cluster restore (migration, DR)
# - Namespace mapping and filtering
# - Scheduled backups with retention policies
#
# Use cases:
# - Kubernetes disaster recovery (cluster lost, restore to new cluster)
# - Cluster migration (on-prem to cloud, cloud to cloud)
# - Namespace backup (dev/staging/production isolation)
# - Stateful application backup (databases, caches)
#
# Metrics:
# - Backup time: 10 minutes for 100 resources + 5 PVCs (50GB total)
# - Restore time: 15 minutes (cluster recreation + volume restore)
# - RPO: Dependent on schedule (daily = 24 hour data loss)
# - RTO: 15-30 minutes for cluster restore`,
    },
    {
      id: "veeam",
      name: "Veeam Backup & Replication - Enterprise VM Backup",
      type: "platform",
      languages: ["any"],
      description:
        "Veeam is an enterprise-grade backup solution for virtual environments (VMware vSphere, Hyper-V) and cloud workloads (AWS, Azure). Provides image-level backups, instant recovery, replication, and cloud integration.",
      links: {
        docs: "https://www.veeam.com/documentation-guides-datasheets.html",
      },
      codeSnippet: `# Veeam backup job configuration (PowerShell)

# Create backup job for production VMs
Add-VBRViBackupJob \\
  -Name "Production_VMs_Daily" \\
  -BackupRepository "BackupRepo_Primary" \\
  -Entity (Find-VBRViEntity -Name "Production_*") \\    # All VMs starting with Production_

  # Backup schedule
  -RunSchedule (New-VBRDailyOptions -DailyTime "02:00" -DailyType Everyday) \\

  # Retention: 14 restore points (daily backups for 2 weeks)
  -RetentionPolicy (New-VBRRetentionPolicy -RetentionType Days -RetentionDays 14) \\

  # Incremental backup mode (full weekly, incremental daily)
  -BackupType Incremental \\
  -FullBackupDays Sunday \\

  # Guest processing (application-aware processing for SQL/Exchange)
  -EnableGuestQuiescing \\
  -GuestProxyAutoSelect \\

  # Backup copy to DR site
  -EnableBackupCopy \\
  -BackupCopyRepository "BackupRepo_DR" \\
  -BackupCopySchedule (New-VBRDailyOptions -DailyTime "03:00")

# Veeam instant VM recovery (boot VM directly from backup)
Start-VBRInstantRecovery \\
  -Backup (Get-VBRBackup -Name "Production_VMs_Daily") \\
  -RestorePoint (Get-VBRRestorePoint -Name "ProductionDB" | Sort-Object -Property CreationTime -Descending | Select-Object -First 1) \\
  -Reason "Database corruption - restoring from last night's backup" \\
  -PowerOn \\                        # Boot VM immediately
  -Server (Get-VBRServer -Name "esxi-prod-01")

# File-level restore from VM backup (without full VM restore)
Start-VBRWindowsFileRestore \\
  -RestorePoint (Get-VBRRestorePoint -Name "ProductionDB" -CreationTime "2024-01-15 02:00") \\
  -Path "C:\\\\Program Files\\\\App\\\\config.xml" \\
  -TargetPath "C:\\\\Restore"

# Replication job for near-zero RTO disaster recovery
Add-VBRViReplicaJob \\
  -Name "Production_Replication" \\
  -Entity (Find-VBRViEntity -Name "Production_*") \\
  -Server (Get-VBRServer -Name "dr-vcenter") \\
  -RunSchedule (New-VBRDailyOptions -DailyTime "00:00" -DailyType Everyday) \\
  -PointsNumber 7                    # Keep 7 restore points

# Application-aware backup for SQL Server
Set-VBRJobVSSOptions \\
  -Job (Get-VBRJob -Name "Production_VMs_Daily") \\
  -Enabled \\
  -GuestProxyAutoDetect \\
  -IgnoreErrors $false \\
  -SqlBackupOptions (New-VBRSqlBackupOptions -TransactionLogsProcessing TruncateOnlyOnSuccessfulBackup)

# Features:
# - Image-level VM backups (VMware CBT, Hyper-V RCT for changed block tracking)
# - Instant VM recovery (boot from backup, no restore wait)
# - File-level restore (restore individual files without full VM restore)
# - Application-aware processing (SQL, Exchange, Active Directory)
# - Replication for disaster recovery (async replication to DR site)
# - Cloud tier integration (archive old backups to S3 Glacier)
# - Backup validation (SureBackup - automated restore testing)
#
# Typical configuration:
# - Backup window: Daily 2-6 AM
# - Full backup: Weekly (Sunday)
# - Incremental: Daily (Mon-Sat)
# - Retention: 14 days online, 90 days archived
# - RPO: 24 hours (daily backups)
# - RTO: <15 minutes (instant recovery)
#
# When to use:
# - VMware vSphere or Hyper-V environments
# - Enterprise compliance requirements
# - Mission-critical VMs requiring instant recovery
# - SQL Server, Exchange Server backups`,
    },
  ],

  usedInSystems: [
    {
      systemId: "gitlab-database-backups",
      systemName: "GitLab Production Database Backups",
      howUsed:
        "GitLab.com, one of the world's largest DevOps platforms with 30M+ users, implements comprehensive PostgreSQL backup using pg_basebackup combined with continuous WAL archiving to S3. GitLab's backup strategy employs tiered recovery objectives: daily full backups at 2 AM UTC (off-peak) using pg_basebackup with gzip compression (250GB database → 45GB compressed), hourly incremental backups via WAL archiving to S3 (append-only transaction logs enable point-in-time recovery to any second within retention window). The backup architecture provides multiple layers of protection: local backups on backup server (24-hour retention for fast recovery from operator error like accidental table drop), S3 Standard storage in us-east-1 (30-day retention for regional disaster recovery), and S3 cross-region replication to eu-west-1 (90-day retention for global catastrophe like AWS region failure). GitLab's restore procedures are tested monthly via automated restore drills: spin up new PostgreSQL instance, restore latest full backup, replay WAL files to current time, validate data integrity via checksums and row counts, measure RTO (target: <2 hours for full database restore). During the 2017 data loss incident where a production database replica was accidentally deleted, GitLab's backup system enabled recovery with 6 hours of data loss (WAL archiving had failed silently, only daily backup available). Post-incident improvements: backup monitoring with alerts if WAL archiving lags >5 minutes, automated restore validation ensuring backups are actually restorable, and retention policy enforcement via Lifecycle policies (S3 Standard → Glacier after 30 days → deletion after 2 years). GitLab's backup costs: $2,000/month for S3 storage (45GB daily × 30 days + WAL logs), negligible compared to business value of data protection (RPO: 5 minutes via WAL, RTO: <2 hours). Pattern composition: Backup-Restore + WAL archiving + Cross-region replication + Automated testing + Lifecycle management. Impact: Survived multiple incidents including accidental database drops, disk failures, and regional AWS outages; maintained compliance with SOC2 Type II requiring 90-day backup retention; enabled customer self-service point-in-time recovery for GitLab.com repository corruption.",
      source:
        "https://about.gitlab.com/blog/2017/02/10/postmortem-of-database-outage-of-january-31/",
    },
    {
      systemId: "dropbox-block-sync",
      systemName: "Dropbox Block-Level Backup and Sync",
      howUsed:
        "Dropbox's core product relies on incremental block-level backups to efficiently sync 600M+ users' files (exabytes of data) across devices while minimizing storage and bandwidth. Dropbox's sync engine implements content-addressed storage with block-level deduplication: files split into 4MB blocks, each block hashed (SHA-256), identical blocks stored once globally across all users (e.g., Ubuntu ISO shared by 100K users = stored once, not 100K times). The backup architecture operates at multiple levels: client-side incremental backups (desktop app detects changed blocks in files using filesystem watches, uploads only changed 4MB chunks, not entire files), server-side block storage in S3 with erasure coding (12+4 Reed-Solomon provides 99.999999999% durability), and version history retention (free users: 30 days, Plus: 180 days, Business: unlimited with point-in-time recovery). Dropbox's compression and deduplication achieve remarkable efficiency: 1TB of user data typically consumes 200-400GB of S3 storage due to deduplication (identical files across users) and compression (gzip for text, video files stored uncompressed). The restore process supports multiple scenarios: individual file restore (retrieve specific file version from S3 by block hash), folder-level restore (reconstruct folder state at historical timestamp), and full account recovery (restore all files to previous date after ransomware/accidental deletion). Dropbox's backup strategy for internal infrastructure uses Velero for Kubernetes cluster backups (25+ clusters, 10K+ pods) and pg_basebackup for PostgreSQL metadata databases (file metadata, user accounts, sharing permissions). During the 2014 incident where 68M user credentials leaked, Dropbox's backup system enabled rapid historical analysis: restore database to specific dates, audit access patterns, identify compromised accounts. Metrics: Dropbox processes 1B+ file updates per day with average sync latency <5 seconds, achieves RPO of <1 minute (continuous sync), RTO of <1 minute for individual file restore, and maintains 11 nines durability through S3 + erasure coding + geographic replication. Pattern composition: Backup-Restore + Content-addressed storage + Block-level deduplication + Incremental sync + Version history + S3 lifecycle management. Impact: Enabled Dropbox to scale to exabyte-scale storage with sustainable costs; provided version history and undelete capabilities as core product features; survived multiple S3 outages via multi-region replication; maintained user trust through transparent backup and recovery capabilities.",
      source: "https://dropbox.tech/infrastructure/magic-pocket-infrastructure",
    },
    {
      systemId: "github-mysql-backups",
      systemName: "GitHub MySQL Database Backup Strategy",
      howUsed:
        "GitHub implements multi-tiered MySQL backup strategy protecting metadata for 100M+ repositories, 300M+ users, and billions of Git objects. GitHub's backup architecture combines logical backups (mysqldump for schema/data portability), physical backups (Percona XtraBackup for fast restores), and binary log archiving (point-in-time recovery). The backup tiers provide graduated recovery objectives: local snapshots on backup server (6-hour retention, <5 minute RPO, <30 minute RTO for operator error recovery like accidental table truncate), regional backups in S3 us-east (7-day retention, <1 hour RPO via binlog archiving, <2 hour RTO), and cross-region backups in S3 eu-west (30-day retention, disaster recovery for AWS region failure). GitHub's backup workflow: full backup weekly using Percona XtraBackup (hot backup with zero downtime, captures InnoDB data + binary log position in transactionally consistent snapshot, 500GB database → 100GB compressed with parallel threads), incremental backups daily (capture binlogs since last backup, 10-50GB per day), and continuous binlog streaming to S3 (5-minute archive interval, enables point-in-time recovery to any second). The October 2018 production incident where MySQL primary-primary replication conflict caused data inconsistency across DCs demonstrated backup criticality: GitHub identified divergence at 2018-10-21 22:52 UTC, decided to restore from backup rather than reconcile conflicts, executed restore from last consistent backup (8 hours before incident), replayed binlogs to 22:50 UTC (2 minutes before divergence), resulting in 24 minutes of data loss. Post-incident improvements: backup validation via automated daily restore to staging environment (verify backup integrity + restore procedures), cross-DC consistency checks (detect replication drift before it causes data loss), and immutable backup retention (S3 Object Lock prevents deletion for 90 days, ransomware protection). GitHub's backup costs: $15K/month for S3 storage (100GB daily × 7 days local + 30 days regional + 90 days DR = ~13TB), $5K/month for backup infrastructure (dedicated backup servers, network egress). Metrics: Weekly full backup completes in 3 hours (500GB → 100GB compressed), incremental backup in 15 minutes, restore from backup takes 4 hours (decompress + import + binlog replay). Pattern composition: Backup-Restore + Physical + Logical + Binlog archiving + Cross-region replication + Immutable storage + Automated validation. Impact: Enabled recovery from October 2018 replication incident with 24-minute data loss; maintained SOC2 compliance with 90-day backup retention; provided disaster recovery capability for regional AWS outages; validated backup viability through quarterly restore drills preventing 'backups that don't restore' scenario.",
      source: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
    },
    {
      systemId: "netflix-s3-durability",
      systemName: "Netflix S3 Data Durability via Backup Replication",
      howUsed:
        "Netflix stores all video assets (movies, TV shows, artwork) totaling 100+ petabytes in S3, protected by S3's 11 nines durability (99.999999999%) through automated backup replication and erasure coding. While S3 itself implements backup-restore internally, Netflix's architecture treats S3 as durable storage requiring minimal additional backup. S3's durability architecture: objects stored across 3+ availability zones within region using erasure coding (12+4 Reed-Solomon allows loss of 4 chunks without data loss), checksums validated on every read/write (detect bit rot, silent data corruption), and automated background scrubbing (continuous verification of all objects). Netflix's backup strategy for S3-stored assets: cross-region replication from us-east-1 to eu-west-1 for disaster recovery (entire AWS region failure), lifecycle policies transitioning old content to Glacier Deep Archive (movies released >5 years ago, accessed <1/year, 90% cost reduction), and checksum verification for all uploads (MD5 hash prevents corrupted uploads). The 2017 S3 us-east-1 outage tested Netflix's backup architecture: S3 service degradation lasted 4 hours, Netflix's CDN (Open Connect) continued serving cached content to users (no user impact), new video uploads queued and retried after recovery, cross-region replication to eu-west-1 ensured data durability. Netflix's encoding pipeline implements backup at transformation boundaries: source files (camera masters) stored in Glacier Deep Archive (immutable, 7-year retention for re-encoding future codecs), encoded files (H.264, H.265, AV1) stored in S3 Standard (frequently accessed, multi-AZ durability), and temporary processing artifacts deleted after 7 days (regenerable from source). Cost optimization through tiered storage: 100PB source files in Glacier Deep Archive at $1/TB/month = $100K/month, 200PB encoded files in S3 Standard at $23/TB/month = $4.6M/month, lifecycle policies automatically transition content based on access patterns (popular titles stay in Standard, catalog titles move to Infrequent Access after 30 days, archives to Glacier after 1 year). Netflix's backup validation: monthly restore drills retrieve random movies from Glacier, decode with latest codec, compare to production version, verify playback quality (detect encoding drift, codec bugs, data corruption). Pattern composition: Backup-Restore + S3 erasure coding + Cross-region replication + Lifecycle management + Checksum validation + Automated scrubbing. Metrics: S3 provides 99.99% availability, 11 nines durability, cross-region replication within 15 minutes, Glacier retrieval in 12 hours (standard) or 5 minutes (expedited). Impact: Zero data loss despite multiple AWS outages; $2M/month savings via lifecycle policies; enabled re-encoding entire catalog for AV1 codec by restoring from Glacier source files; maintained disaster recovery capability for regional failures.",
      source:
        "https://netflixtechblog.com/towards-a-reliable-device-management-platform-4f86230ca623",
    },
    {
      systemId: "healthcare-hipaa-backups",
      systemName: "Healthcare System HIPAA-Compliant Backups",
      howUsed:
        "Large healthcare system (10M+ patient records) implements backup-restore for electronic health records (EHR) with HIPAA compliance requiring encrypted backups, 6-year retention, audit trails, and disaster recovery testing. The backup architecture: Epic EHR database (Oracle 12c, 20TB production) backed up using RMAN (Recovery Manager) with daily incremental backups to NetApp NAS (on-prem), weekly full backups to AWS S3 (encrypted with customer-managed KMS keys), and transaction log archiving every 15 minutes (RPO: <15 minutes). HIPAA compliance requirements drive backup design: encryption at rest (AES-256 for on-prem, AWS KMS for cloud backups), encryption in transit (TLS 1.2 for all transfers), access controls (MFA required for backup access, IAM policies restrict to security team), audit logging (CloudTrail tracks all backup access, S3 Access Logs for restore operations), and immutable retention (S3 Object Lock with compliance mode prevents deletion for 6 years even by root account). The backup workflow: nightly full backup at 2 AM (4-hour maintenance window, database quiesce via Oracle RMAN, 20TB → 4TB compressed with Oracle Advanced Compression), incremental backups every 6 hours (capture changed blocks only, 50-200GB per backup), archive logs every 15 minutes (redo logs shipped to S3, enable point-in-time recovery to any 15-minute interval), and monthly full backup archived to Glacier (6-year retention, cost $0.004/GB/month vs $0.023 for S3 Standard = 80% savings). Disaster recovery testing quarterly: restore full production database to isolated DR environment (AWS VPC in us-west-2, production in us-east-1), replay archive logs to current time, validate EHR application functionality (patient lookup, prescription verification, imaging retrieval), measure RTO (target: 4 hours for full failover including network cutover + DNS changes + application restart). The 2019 ransomware incident at similar healthcare system demonstrated backup criticality: WannaCry variant encrypted production servers including on-prem backup NAS (backups stored on same network segment), only cloud backups in S3 survived (network isolation + immutable Object Lock prevented ransomware access), recovery time 48 hours to restore from S3 backups (slower than on-prem but only viable option). Post-incident improvements: air-gapped backups (S3 backups in separate AWS account, cross-account access only via assume-role with MFA), backup validation via daily restore of random patient records to test environment (verify backup integrity + restore procedures), and ransomware detection (S3 Object Lock prevents mass deletion, CloudWatch alerts on unusual S3 access patterns). Backup costs: $50K/month for on-prem NAS (600TB capacity with snapshots), $30K/month for S3 Standard (4TB × 7 days = 28TB), $5K/month for Glacier (4TB × 72 months = 288TB), $10K/month for network egress and backup infrastructure, total $95K/month (~$1.2M/year for 20TB database). Metrics: RPO 15 minutes (archive log frequency), RTO 4 hours (full restore + validation), retention 6 years (HIPAA requirement), durability 11 nines (S3 + cross-region replication). Pattern composition: Backup-Restore + Encryption + Immutable storage + Cross-region replication + Automated testing + Compliance logging + Air-gap isolation. Impact: Survived ransomware incident with zero data loss; maintained HIPAA compliance through encrypted backups + audit trails; provided 6-year retention for legal/compliance requirements; enabled disaster recovery for regional datacenter failures.",
    },
  ],

  references: [
    {
      title:
        "PostgreSQL Continuous Archiving and Point-in-Time Recovery (PITR)",
      url: "https://www.postgresql.org/docs/current/continuous-archiving.html",
      type: "documentation",
      author: "PostgreSQL Global Development Group",
    },
    {
      title: "AWS Backup Developer Guide",
      url: "https://docs.aws.amazon.com/aws-backup/latest/devguide/",
      type: "documentation",
      author: "Amazon Web Services",
    },
    {
      title: "Site Reliability Engineering - Chapter 26: Data Integrity",
      url: "https://sre.google/sre-book/data-integrity/",
      type: "book",
      author: "Google SRE Team",
    },
    {
      title:
        "Designing Data-Intensive Applications - Chapter 3: Storage and Retrieval",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "The Backup Book: Disaster Recovery from Desktop to Data Center",
      url: "https://www.backupbook.info/",
      type: "book",
      author: "Dorian J. Cougias, E. L. Heiberger, Karsten Koop",
    },
  ],

  philosophy: {
    coreProblem:
      "Data loss from hardware failure, software bugs, human error, security breaches, or natural disasters can permanently destroy businesses, with no recovery mechanism if data exists in only one location without independent copies stored safely off-site",
    designPrinciple:
      "Create periodic point-in-time snapshots of all critical system state and store them in geographically distributed, immutable storage, accepting longer recovery times (hours to days) in exchange for lowest cost disaster recovery and protection against catastrophic data loss from any cause",
    historicalContext:
      "Backup-restore emerged from mainframe era (1960s-1970s) when magnetic tape was the only practical long-term storage medium—operators manually swapped tapes following grandfather-father-son rotation (daily, weekly, monthly tapes). Early disaster recovery involved shipping tapes to off-site storage facilities (Iron Mountain vaults) for geographic distribution. The 1993 World Trade Center bombing destroyed many companies' on-site backups, driving adoption of off-site backup policies. Commercial backup solutions (Veritas NetBackup, IBM Tivoli) automated tape management in the 1990s but retained batch-oriented, backup-window-constrained architecture. The 2000s saw transition from tape to disk-based backups (Data Domain deduplication appliances, 10:1 compression), faster backup windows, and D2D2T (Disk-to-Disk-to-Tape) architectures. Cloud storage (S3 launch 2006) revolutionized backup economics: infinite capacity, pay-per-use pricing, 11 nines durability, geographic replication, no tape handling. Modern backup evolution focuses on RPO reduction (hourly incrementals → continuous transaction log archiving), RTO reduction (instant recovery, boot from backup), and ransomware protection (immutable backups via WORM storage, air-gapped copies). The 2017 NotPetya ransomware attack that destroyed Maersk's entire infrastructure except one domain controller in Ghana highlighted backup criticality—companies with isolated, immutable backups recovered within days; those without faced weeks of downtime or permanent data loss. Backup philosophy has evolved from 'batch backup during maintenance window' to 'continuous protection with instant recovery', from 'restore as last resort' to 'backup as business continuity enabler'.",
    alternativesRejected: [
      "Active-Active Replication Instead of Backups - Synchronous replication to multiple live replicas provides zero RPO and instant failover (no RTO), but costs 3-5x more than backups (always-on infrastructure), doesn't protect against logical corruption (bad transaction replicates to all replicas), and offers no point-in-time recovery (can't restore to state from yesterday). Backups provide time-travel capability that replication cannot.",
      "Snapshot-Only Backups (No Full Backups) - Relying solely on incremental snapshots (changed blocks) reduces backup size and window, but creates fragile backup chains where losing any snapshot in chain breaks entire sequence. Without periodic full backups as baseline, restore becomes complex dependency graph. Industry best practice: weekly full + daily incrementals balances storage costs with restore reliability.",
      "Local-Only Backups (No Geographic Distribution) - Storing backups on same premises or cloud region as primary data provides fast restore but fails during regional disasters (datacenter fire, hurricane, terrorist attack, AWS region outage). Geographic distribution to separate failure domain (different building, city, region, cloud provider) is fundamental to disaster recovery. Cost savings from local-only backups are false economy—data loss costs far exceed storage costs.",
      "Unencrypted Backups - Storing backups without encryption saves CPU cycles during backup/restore but exposes sensitive data if backup media stolen, cloud storage compromised, or employee accesses backups maliciously. Regulatory compliance (HIPAA, PCI-DSS, GDPR) mandates encrypted backups. Modern encryption (AES-256) adds <5% overhead, negligible compared to data protection value.",
      "Manual Backups (No Automation) - Relying on manual backup execution by operators ensures backups occur only when remembered, creates inconsistent schedules, and lacks monitoring for failures. Automated backups with monitoring and alerting (backup job failed, backup not run in 24 hours) prevent the 'discovered backups weren't running during restore' scenario. Every backup-related disaster starts with 'we thought backups were running but...'",
      "Never Testing Restore Procedures - Creating backups without testing restore is 'Schrödinger's backup'—unknown if viable until disaster strikes. Regular restore drills (quarterly or monthly) verify backup integrity, validate restore procedures, train operators, measure RTO, and surface issues before production incident. Untested backups are security theater, not disaster recovery.",
    ],
    mentalModel:
      "Backup-Restore is like time-lapse photography of a construction site. Every night, a drone flies over and photographs the entire site from above (full backup). Every hour, it photographs just the areas that changed—new materials delivered, walls built, equipment moved (incremental backup). These photographs are stored in fireproof vaults in different cities (geographic distribution). If a tornado destroys the construction site, you can't instantly rebuild (longer RTO than having a duplicate site), but you can use the photographs to reconstruct exactly how everything looked at any point in time (point-in-time recovery). The photos themselves are immune to site disasters because they're stored separately. The key insight: backups are insurance—you pay regular premiums (storage costs, backup windows) hoping never to use them, but they're invaluable when disaster strikes. Like insurance, backups must be tested regularly to verify they actually work when needed.",
  },

  visualization: {
    staticDiagram: `graph TB
    Primary[(Primary Database<br/>100GB)] --> |Daily 2 AM<br/>Full Backup| Snapshotter[Data Snapshotter]
    Primary --> |Hourly<br/>Incremental| Snapshotter

    Snapshotter --> |Compress<br/>5:1 ratio| Compress[Compressed<br/>20GB]
    Compress --> |Encrypt<br/>AES-256| Encrypt[Encrypted Backup]

    Encrypt --> |Upload| S3Primary[S3 us-east-1<br/>30 day retention]
    S3Primary --> |Cross-Region<br/>Replication| S3DR[S3 eu-west-1<br/>90 day retention]
    S3Primary --> |Lifecycle<br/>after 30 days| Glacier[Glacier<br/>2 year retention]

    S3Primary -.-> |Disaster Recovery| Restore[Restore Manager]
    Restore --> |Download & Decrypt| RestoreDB[(Restored Database)]

    Retention[Retention Policy<br/>Enforcer] --> |Delete after 90 days| S3DR
    Retention --> |Archive after 30 days| Glacier

    style Primary fill:#e1f5e1
    style RestoreDB fill:#e1f5e1
    style S3Primary fill:#fff4e1
    style S3DR fill:#ffe1e1
    style Glacier fill:#e1e5ff`,
    realWorldAnalogy:
      "Backup-Restore is like making regular photocopies of your entire tax filing cabinet. Every week, you copy all documents (full backup—time consuming but complete). Every day, you copy only the new documents added since last week (incremental backup—fast, small). You store these copies in a safe deposit box across town (geographic separation prevents fire at home from destroying originals AND backups). If your house burns down, you can't instantly recreate your filing cabinet (longer recovery time), but you can retrieve copies from the bank and rebuild everything exactly as it was up to yesterday (point-in-time recovery). The copies are dated, so you can even recreate your cabinet from 2 weeks ago if needed (version history). You keep copies for 7 years because IRS requires it (compliance retention), then shred old copies (retention policy enforcement). The key: backups are separate from originals (survive correlated failures), regularly created (minimize data loss), and actually tested (try retrieving from safe deposit box before emergency).",
    useCases: [
      {
        domain: "Database Backup and Recovery",
        scenario:
          "PostgreSQL database with 500GB of customer data backs up daily using pg_basebackup (full backup at 2 AM, 4-hour window, compressed to 100GB) + hourly WAL archiving to S3 (transaction logs, point-in-time recovery to any second). During production incident, DBA accidentally runs DELETE FROM users without WHERE clause. Recovery: restore from last night's full backup (30 minutes), replay WAL logs up to 5 minutes before DELETE (15 minutes), verify data integrity (5 minutes). Total RTO: 50 minutes, RPO: near-zero (WAL captured transaction before deletion).",
        patternRole:
          "Provides point-in-time recovery enabling rollback to state before data corruption, with automated daily backups and continuous transaction log archiving minimizing RPO while compressed storage reduces costs",
        companies: ["GitLab", "Discourse", "Sentry"],
      },
      {
        domain: "Cloud Infrastructure Disaster Recovery",
        scenario:
          "E-commerce company runs 200 EC2 instances, 50 RDS databases, 100TB S3 data across AWS us-east-1. AWS Backup creates daily snapshots (EC2 AMIs, RDS snapshots, EBS snapshots) with cross-region replication to us-west-2. During us-east-1 outage (S3 service degradation), company triggers DR failover: launch EC2 instances from AMIs in us-west-2 (15 minutes), restore RDS from snapshots (30 minutes), update DNS to point to us-west-2 (5 minutes). Total RTO: 50 minutes, RPO: 24 hours (last night's backup).",
        patternRole:
          "Enables disaster recovery across AWS region failures via cross-region backup replication, with automated snapshots of all infrastructure components and coordinated restore procedures",
        companies: ["Airbnb", "Lyft", "Pinterest"],
      },
      {
        domain: "Kubernetes Cluster Backup",
        scenario:
          "SaaS company operates 20 Kubernetes clusters with 5,000 pods, 500 persistent volumes (databases, caches, user data). Velero backs up cluster state daily: all Kubernetes resources (deployments, services, configmaps), PVC snapshots via CSI, namespace-level backup for multi-tenant isolation. During cluster upgrade gone wrong (etcd corruption), recovery: restore cluster state from last night's Velero backup to new cluster, restore PVCs from volume snapshots, redirect traffic to restored cluster. Total RTO: 2 hours, RPO: 24 hours.",
        patternRole:
          "Protects Kubernetes infrastructure via cluster resource backups and persistent volume snapshots, enabling disaster recovery from cluster failures and migrations between clusters/cloud providers",
        companies: ["Spotify", "Shopify", "Datadog"],
      },
      {
        domain: "Compliance and Long-Term Archival",
        scenario:
          "Healthcare system stores 20TB of patient health records in Epic EHR (Oracle database). HIPAA requires 6-year retention of all medical records with encryption and audit trails. Backup strategy: daily incremental backups to on-prem NAS (7-day retention, fast restore), weekly full backups to S3 Standard (30-day retention, disaster recovery), monthly full backups to Glacier (6-year retention, compliance archival). During audit, regulator requests patient records from 2019. Recovery: retrieve Glacier backup from target month (12-hour retrieval), restore to isolated environment, extract patient records, provide to auditor with access logs.",
        patternRole:
          "Enables compliance with regulatory retention requirements through long-term archival backups in cold storage, with encryption and audit trails meeting HIPAA/PCI-DSS mandates",
        companies: ["Kaiser Permanente", "Cleveland Clinic", "Mayo Clinic"],
      },
      {
        domain: "Ransomware Recovery",
        scenario:
          "Manufacturing company suffers ransomware attack encrypting all production servers, databases, and file shares. Ransomware spreads to on-prem backup NAS via network share. Only immutable cloud backups in S3 (Object Lock enabled) survive attack. Recovery: restore file servers from S3 backups to clean infrastructure (8 hours), restore databases from S3 backups to new RDS instances (4 hours), restore application servers from AMI backups (2 hours), validate data integrity and resume operations (4 hours). Total RTO: 18 hours, zero ransom paid, no data loss beyond last backup (RPO: 24 hours).",
        patternRole:
          "Protects against ransomware via immutable backups in isolated storage (S3 Object Lock, air-gapped backups) that attackers cannot encrypt or delete, enabling recovery without paying ransom",
        companies: [
          "Maersk (NotPetya recovery)",
          "Colonial Pipeline",
          "JBS Foods",
        ],
      },
    ],
  },

  tags: [
    "reliability",
    "disaster-recovery",
    "data-protection",
    "backup",
    "restore",
    "compliance",
    "encryption",
    "retention",
    "cold-standby",
  ],
  difficulty: "intermediate",
};
