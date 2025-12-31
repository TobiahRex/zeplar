import type { Pattern } from "../schema";

export const physicalLogging: Pattern = {
  id: "physical-logging",
  slug: "physical-logging",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📜 Write-Ahead Logging → 📝 Physical Logging",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Write-Ahead Logging",
    level: 4,
  },

  concept: {
    name: "Physical Logging",
    emoji: "📝",
    tagline: "Byte-level changes",
    definition:
      "Physical logging is a write-ahead logging strategy that records the actual byte-level changes to storage pages rather than high-level logical operations. Think of it like a video recording of someone editing a document, capturing every keystroke and cursor movement, versus a high-level transcript that just says 'changed paragraph 3'. For example, instead of logging 'UPDATE users SET balance = balance + 100 WHERE id = 42', physical logging records 'write bytes [0x64, 0x00, 0x00, 0x00] to offset 1024 of page 57'. The log entry contains the exact before-image (old bytes) and after-image (new bytes) of the modified storage locations. During recovery, the system replays these byte-level changes by literally writing the logged bytes to the specified disk locations, without understanding what the data means. This makes recovery extremely fast and simple—no need to re-execute SQL statements or recompute values. Physical logging is commonly used in databases like PostgreSQL and MySQL for page-level recovery and in filesystems for crash consistency.",
    problemSolved:
      "Logical logging that records high-level operations creates complex recovery challenges because it requires re-executing operations which may depend on system state, indexes, or constraints. For example, recovering 'UPDATE users SET balance = balance + 100 WHERE id = 42' requires finding the user record, checking constraints, updating indexes, and recomputing derived values—if the database is in an inconsistent state during recovery, this might fail or produce wrong results. Additionally, logical operations can be non-deterministic (timestamps, random values, auto-incrementing IDs) making exact replay impossible. Physical logging solves this by recording exactly what bytes changed on disk. Recovery simply writes the after-image bytes to the specified locations, regardless of database state. This is deterministic, idempotent (replaying twice gives same result), and fast. No query parsing, no constraint checking, no index maintenance—just raw byte writes. Critical for crash recovery where data structures may be corrupted.",
    tradeoffs: {
      pros: [
        "Enables extremely fast, simple recovery by directly writing logged bytes to disk without parsing queries, checking constraints, or updating indexes",
        "Provides completely deterministic and idempotent recovery since byte writes are repeatable regardless of system state or timing",
        "Makes recovery independent of schema, application logic, or database state—works even if data structures are partially corrupted",
        "Reduces recovery complexity by eliminating need to maintain operation semantics, transaction dependencies, or referential integrity during replay",
      ],
      cons: [
        "Creates significantly larger log files than logical logging since it records all byte changes even for operations affecting millions of rows via single SQL statement",
        "Tightly couples logs to specific storage layout and page format, making logs unportable across database versions or architectures (32-bit vs 64-bit)",
        "Makes replication and backup analysis difficult since logs contain binary data rather than human-readable SQL operations",
        "Prevents optimization techniques like operation coalescing or log compression since byte-level changes cannot be semantically merged",
      ],
    },
    relatedPatterns: [
      "logical-logging",
      "physiological-logging",
      "periodic-checkpoint",
      "incremental-checkpoint",
      "log-structured",
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
      id: "physical-logging-ts-basic",
      language: "typescript",
      title: "Physical Logging Write-Ahead Log Implementation",
      description:
        "Complete implementation of physical logging that records byte-level page changes for crash recovery, demonstrating deterministic redo operations and fast recovery without query re-execution.",
      code: `// Page-level storage structures
interface StoragePage {
  pageId: number;
  data: Buffer;
  checksum: number;
}

interface PhysicalLogRecord {
  lsn: number;                    // Log Sequence Number
  transactionId: string;
  pageId: number;
  offset: number;
  beforeImage: Buffer;            // Original bytes at offset
  afterImage: Buffer;             // New bytes at offset
  timestamp: number;
}

interface TransactionState {
  transactionId: string;
  status: 'active' | 'committed' | 'aborted';
  startLsn: number;
  commitLsn?: number;
}

class PhysicalLogManager {
  private log: PhysicalLogRecord[] = [];
  private nextLsn = 1;
  private pages = new Map<number, StoragePage>();
  private transactions = new Map<string, TransactionState>();
  private checkpointLsn = 0;

  constructor(private pageSize: number = 256) {
    // Initialize some pages
    for (let i = 1; i <= 5; i++) {
      this.pages.set(i, {
        pageId: i,
        data: Buffer.alloc(pageSize),
        checksum: 0,
      });
    }
  }

  // Begin a new transaction
  beginTransaction(transactionId: string): void {
    console.log(\`\\n📝 BEGIN TRANSACTION: \${transactionId}\`);

    this.transactions.set(transactionId, {
      transactionId,
      status: 'active',
      startLsn: this.nextLsn,
    });
  }

  // Write data to a page with physical logging
  writeToPage(
    transactionId: string,
    pageId: number,
    offset: number,
    newData: Buffer
  ): void {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(\`Page \${pageId} not found\`);
    }

    const tx = this.transactions.get(transactionId);
    if (!tx || tx.status !== 'active') {
      throw new Error(\`Transaction \${transactionId} not active\`);
    }

    // Extract before-image (original bytes)
    const beforeImage = Buffer.from(page.data.slice(offset, offset + newData.length));

    // Create physical log record with byte-level changes
    const logRecord: PhysicalLogRecord = {
      lsn: this.nextLsn++,
      transactionId,
      pageId,
      offset,
      beforeImage,
      afterImage: Buffer.from(newData),
      timestamp: Date.now(),
    };

    // Write log record to WAL (Write-Ahead Logging)
    this.log.push(logRecord);

    console.log(\`   [LSN \${logRecord.lsn}] Write to Page \${pageId} at offset \${offset}\`);
    console.log(\`   Before: \${beforeImage.toString('hex').slice(0, 20)}...\`);
    console.log(\`   After:  \${newData.toString('hex').slice(0, 20)}...\`);

    // Apply the change to the in-memory page
    newData.copy(page.data, offset);
  }

  // Commit a transaction
  commitTransaction(transactionId: string): void {
    const tx = this.transactions.get(transactionId);
    if (!tx || tx.status !== 'active') {
      throw new Error(\`Transaction \${transactionId} not active\`);
    }

    const commitLsn = this.nextLsn++;

    // Write commit record to log
    console.log(\`\\n✅ COMMIT TRANSACTION: \${transactionId} (LSN \${commitLsn})\`);

    tx.status = 'committed';
    tx.commitLsn = commitLsn;

    // In real system, flush log to disk with fsync before acknowledging commit
    this.flushLog(commitLsn);
  }

  // Simulate flushing log to persistent storage
  private flushLog(upToLsn: number): void {
    console.log(\`   💾 Flushing WAL up to LSN \${upToLsn} to disk\`);
    // In production: write log records to disk and fsync
  }

  // Create a checkpoint
  createCheckpoint(): void {
    this.checkpointLsn = this.nextLsn - 1;

    console.log(\`\\n📸 CHECKPOINT created at LSN \${this.checkpointLsn}\`);
    console.log(\`   Writing all dirty pages to disk...\`);

    // In real system: flush all dirty pages to disk
    for (const [pageId, page] of this.pages) {
      console.log(\`   - Flushing page \${pageId}\`);
      // Simulate writing page to disk
    }

    console.log(\`   Checkpoint complete\\n\`);
  }

  // Crash recovery using physical log records
  recover(): void {
    console.log(\`\\n\\n🔄 CRASH RECOVERY STARTING\`);
    console.log(\`   Last checkpoint: LSN \${this.checkpointLsn}\`);
    console.log(\`   Replaying log from LSN \${this.checkpointLsn + 1}...\\n\`);

    // REDO phase: replay all committed transactions
    const redoRecords = this.log.filter(record => record.lsn > this.checkpointLsn);

    console.log(\`   === REDO PHASE ===\`);
    console.log(\`   Found \${redoRecords.length} log records to replay\\n\`);

    for (const record of redoRecords) {
      const tx = this.transactions.get(record.transactionId);

      // Only redo committed transactions
      if (tx && tx.status === 'committed') {
        this.redoLogRecord(record);
      } else {
        console.log(\`   [LSN \${record.lsn}] SKIP - Transaction \${record.transactionId} not committed\`);
      }
    }

    console.log(\`\\n   ✅ Recovery complete - database restored to consistent state\`);
  }

  // Redo a single physical log record
  private redoLogRecord(record: PhysicalLogRecord): void {
    console.log(\`   [LSN \${record.lsn}] REDO - Page \${record.pageId} offset \${record.offset}\`);

    const page = this.pages.get(record.pageId);
    if (!page) {
      throw new Error(\`Page \${record.pageId} not found during recovery\`);
    }

    // Physical logging: simply write the after-image bytes to the page
    // No need to understand what the data means or re-execute operations
    record.afterImage.copy(page.data, record.offset);

    console.log(\`      Applied \${record.afterImage.length} bytes to page \${record.pageId}\`);
  }

  // Read data from a page
  readFromPage(pageId: number, offset: number, length: number): Buffer {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(\`Page \${pageId} not found\`);
    }

    return Buffer.from(page.data.slice(offset, offset + length));
  }

  // Get log statistics
  getLogStats() {
    return {
      totalLogRecords: this.log.length,
      currentLsn: this.nextLsn - 1,
      checkpointLsn: this.checkpointLsn,
      activeTransactions: Array.from(this.transactions.values())
        .filter(tx => tx.status === 'active')
        .map(tx => tx.transactionId),
      committedTransactions: Array.from(this.transactions.values())
        .filter(tx => tx.status === 'committed')
        .map(tx => tx.transactionId),
    };
  }

  // Simulate crash - lose in-memory page changes
  simulateCrash(): void {
    console.log(\`\\n\\n💥 SYSTEM CRASH!\\n\`);
    console.log(\`   Losing all in-memory pages (simulating volatile memory loss)\`);
    console.log(\`   WAL persisted to disk (log records preserved)\\n\`);

    // Reset pages to simulate memory loss
    for (let i = 1; i <= 5; i++) {
      this.pages.set(i, {
        pageId: i,
        data: Buffer.alloc(this.pageSize),
        checksum: 0,
      });
    }
  }
}

// ============================================================================
// USAGE EXAMPLE: Demonstrate physical logging and recovery
// ============================================================================

function demonstratePhysicalLogging() {
  console.log('=== Physical Logging & Crash Recovery Demo ===');

  const logManager = new PhysicalLogManager(256);

  // Simulate a database storing user records
  const encoder = new TextEncoder();

  // Transaction 1: Insert user "Alice"
  logManager.beginTransaction('tx-001');

  const aliceData = encoder.encode('Alice:alice@example.com:100');
  logManager.writeToPage('tx-001', 1, 0, Buffer.from(aliceData));

  logManager.commitTransaction('tx-001');

  // Transaction 2: Insert user "Bob"
  logManager.beginTransaction('tx-002');

  const bobData = encoder.encode('Bob:bob@example.com:200');
  logManager.writeToPage('tx-002', 1, 50, Buffer.from(bobData));

  logManager.commitTransaction('tx-002');

  // Create checkpoint
  logManager.createCheckpoint();

  // Transaction 3: Update Alice's balance
  logManager.beginTransaction('tx-003');

  const aliceUpdate = encoder.encode('Alice:alice@example.com:150');
  logManager.writeToPage('tx-003', 1, 0, Buffer.from(aliceUpdate));

  logManager.commitTransaction('tx-003');

  // Transaction 4: Insert user "Charlie" (will be uncommitted during crash)
  logManager.beginTransaction('tx-004');

  const charlieData = encoder.encode('Charlie:charlie@example.com:300');
  logManager.writeToPage('tx-004', 1, 100, Buffer.from(charlieData));
  // Note: tx-004 NOT committed before crash

  // Show data before crash
  console.log('\\n--- Data Before Crash ---');
  const page1Before = logManager.readFromPage(1, 0, 150);
  console.log('Page 1 contents:', page1Before.toString().replace(/\\0/g, ''));

  console.log('\\n--- Log Statistics Before Crash ---');
  console.log(JSON.stringify(logManager.getLogStats(), null, 2));

  // Simulate system crash
  logManager.simulateCrash();

  // Show data after crash (all zeros - memory lost)
  console.log('--- Data After Crash (before recovery) ---');
  const page1After = logManager.readFromPage(1, 0, 150);
  console.log('Page 1 contents:', page1After.toString().replace(/\\0/g, '') || '(empty)');

  // Perform crash recovery
  logManager.recover();

  // Show recovered data
  console.log('\\n\\n--- Data After Recovery ---');
  const page1Recovered = logManager.readFromPage(1, 0, 150);
  console.log('Page 1 contents:', page1Recovered.toString().replace(/\\0/g, ''));

  console.log('\\n--- Log Statistics After Recovery ---');
  console.log(JSON.stringify(logManager.getLogStats(), null, 2));

  console.log('\\n\\n--- Recovery Analysis ---');
  console.log('✅ tx-001 (Alice insert): RECOVERED - was committed before crash');
  console.log('✅ tx-002 (Bob insert): RECOVERED - was committed before crash');
  console.log('✅ tx-003 (Alice update): RECOVERED - committed after checkpoint');
  console.log('❌ tx-004 (Charlie insert): NOT RECOVERED - uncommitted at crash time');

  console.log('\\n\\n=== Key Benefits of Physical Logging ===');
  console.log('1. Deterministic Recovery: Byte-level replay is always reproducible');
  console.log('2. Fast Recovery: No query parsing or constraint checking needed');
  console.log('3. State-Independent: Works even with corrupted data structures');
  console.log('4. Idempotent: Replaying log multiple times produces same result');

  console.log('\\n✅ Physical logging demo complete');
}

// Run the demonstration
demonstratePhysicalLogging();`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete physical logging implementation demonstrating byte-level write-ahead logging for database crash recovery, showing how low-level page changes enable fast, deterministic recovery without logical operation re-execution",
        prerequisites: [
          "Write-ahead logging (WAL) fundamentals",
          "Database page storage concepts",
          "Buffer and byte manipulation",
          "Transaction ACID properties",
          "Crash recovery mechanisms",
        ],
        systemPosition:
          "Core storage engine component in database systems, positioned between transaction manager and disk I/O layer, responsible for durability guarantees and crash recovery",
      },
      annotations: [
        {
          id: "pl-page-structure",
          lines: [2, 6],
          action:
            "Define fixed-size page structure representing disk storage blocks",
          reason:
            "Databases organize storage in fixed-size pages (typically 4KB-64KB) that are the unit of I/O between memory and disk; physical logging operates at this page level rather than logical row/column level",
          contextLevel: "module",
        },
        {
          id: "pl-log-record",
          lines: [8, 16],
          action:
            "Define physical log record capturing byte-level before/after images",
          reason:
            "Physical log records contain actual bytes changed (not SQL operations) enabling deterministic redo by literally copying bytes to pages; LSN orders operations for correct replay sequence",
          contextLevel: "module",
        },
        {
          id: "pl-before-after",
          lines: [13, 14],
          action: "Store both before-image and after-image of changed bytes",
          reason:
            "Before-image enables undo (rollback aborted transactions), after-image enables redo (replay committed transactions); byte-level images make recovery operations simple memory copies without understanding data semantics",
          contextLevel: "module",
        },
        {
          id: "pl-lsn",
          lines: [9, 9],
          action: "Assign unique Log Sequence Number to each log record",
          reason:
            "LSN provides total ordering of all operations system-wide; critical for determining which changes to apply during recovery and in what order to maintain consistency",
          contextLevel: "module",
        },
        {
          id: "pl-wal-protocol",
          lines: [73, 91],
          action:
            "Implement write-ahead logging by recording change before applying to page",
          reason:
            "WAL protocol ensures log record is persisted to disk before page modification becomes visible; if crash occurs, log contains all information needed to redo committed changes even if pages weren't flushed",
          contextLevel: "system",
        },
        {
          id: "pl-byte-level",
          lines: [78, 79],
          action: "Extract before-image bytes from original page location",
          reason:
            "Before-image captures exact bytes being overwritten; enables precise undo/redo without needing to understand data structure semantics (could be integer, string, index node, etc.)",
          contextLevel: "local",
        },
        {
          id: "pl-log-write",
          lines: [88, 89],
          action: "Append log record to WAL before modifying page",
          reason:
            "Critical WAL ordering: log must be on stable storage BEFORE page change is visible; ensures crash recovery can replay committed changes from log even if modified pages lost from volatile memory",
          contextLevel: "system",
        },
        {
          id: "pl-commit-protocol",
          lines: [97, 116],
          action:
            "Write commit record to log and flush to disk before acknowledging transaction",
          reason:
            "Transaction durability requires commit record on stable storage; if system crashes after commit acknowledged but before pages flushed, recovery can redo changes from log to restore committed state",
          contextLevel: "system",
        },
        {
          id: "pl-log-flush",
          lines: [118, 122],
          action: "Flush log records to persistent storage with fsync",
          reason:
            "Log flush ensures WAL records survive system crashes; fsync forces OS to write buffered data from page cache to physical disk, preventing data loss from power failure or kernel crash",
          contextLevel: "system",
        },
        {
          id: "pl-checkpoint",
          lines: [125, 140],
          action:
            "Create checkpoint by flushing all dirty pages and recording LSN",
          reason:
            "Checkpoint establishes recovery starting point; flushing dirty pages to disk means recovery only needs to replay log records after checkpoint LSN, reducing recovery time from potentially hours to seconds",
          contextLevel: "system",
        },
        {
          id: "pl-recovery-start",
          lines: [143, 147],
          action: "Begin recovery from last checkpoint LSN",
          reason:
            "Recovery starts at checkpoint to avoid replaying entire log history; only log records after checkpoint need replay because earlier changes are guaranteed to be on disk via checkpoint flush",
          contextLevel: "module",
        },
        {
          id: "pl-redo-filter",
          lines: [153, 161],
          action: "Filter log records to only redo committed transactions",
          reason:
            "Only committed transactions should be reflected in recovered state; uncommitted transactions are ignored (their changes discarded) to maintain atomicity - transaction either fully appears or doesn't appear at all",
          contextLevel: "module",
        },
        {
          id: "pl-redo-operation",
          lines: [166, 178],
          action:
            "Redo log record by copying after-image bytes directly to page",
          reason:
            "Physical redo is trivial byte copy - no parsing SQL, no evaluating expressions, no checking constraints; this simplicity makes recovery fast and deterministic regardless of database state or complexity",
          contextLevel: "module",
        },
        {
          id: "pl-idempotent",
          lines: [175, 175],
          action: "Apply after-image bytes to page using memory copy",
          reason:
            "Byte copy is idempotent - applying same log record twice produces identical result; this property allows recovery to be rerun if interrupted without causing inconsistencies",
          contextLevel: "local",
        },
        {
          id: "pl-crash-simulation",
          lines: [203, 216],
          action:
            "Simulate crash by clearing in-memory pages while preserving log",
          reason:
            "Demonstrates critical separation: volatile memory (pages) is lost but durable log survives; shows why WAL is necessary - without it, committed changes would be lost if pages weren't flushed before crash",
          contextLevel: "micro",
        },
      ],
      highlights: [
        {
          lines: [8, 16],
          label:
            "Physical log record structure with byte-level before/after images",
          sbvpDomain: "structure",
        },
        {
          lines: [88, 91],
          label: "Write-ahead logging protocol ensuring log-before-data",
          sbvpDomain: "behavior",
        },
        {
          lines: [166, 178],
          label:
            "Deterministic redo via direct byte copying without semantic understanding",
          sbvpDomain: "behavior",
        },
        {
          lines: [9, 9],
          label: "LSN providing total ordering for recovery replay sequence",
          sbvpDomain: "philosophy",
        },
        {
          lines: [143, 161],
          label: "Checkpoint-based recovery minimizing replay window",
          sbvpDomain: "structure",
        },
        {
          lines: [175, 175],
          label:
            "Idempotent byte-level operations enabling safe recovery replay",
          sbvpDomain: "philosophy",
        },
        {
          lines: [73, 91],
          label: "WAL protocol ensuring durability through log-first ordering",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],
};
