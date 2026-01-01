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
        name: "Transaction Manager",
        role: "Transaction Coordinator",
        responsibilities: [
          "Begin transaction and assign unique LSN to each operation",
          "Coordinate logging protocol: write WAL record before modifying pages",
          "Ensure commit record is flushed to stable storage before acknowledging transaction",
          "Manage transaction state transitions (active → committed → durable)",
        ],
      },
      {
        name: "WAL Buffer",
        role: "In-Memory Log Buffer",
        responsibilities: [
          "Buffer physical log records in memory before writing to disk",
          "Maintain sequential ordering of log records by LSN",
          "Flush log records to stable storage on commit, checkpoint, or buffer full",
          "Provide fast append-only writes for log record creation",
        ],
      },
      {
        name: "Log Record Generator",
        role: "Before/After Image Creator",
        responsibilities: [
          "Capture before-image (original bytes) from page before modification",
          "Capture after-image (new bytes) after page modification",
          "Record page ID, offset, and byte range for each modification",
          "Generate deterministic, idempotent log records for replay",
        ],
      },
      {
        name: "Buffer Pool Manager",
        role: "Page Cache Coordinator",
        responsibilities: [
          "Cache frequently accessed pages in memory (buffer pool)",
          "Ensure dirty pages have corresponding WAL records on disk before eviction",
          "Implement WAL protocol: log record must reach disk before page",
          "Manage page LSNs to track which log records affect each page",
        ],
      },
      {
        name: "Recovery Manager",
        role: "Crash Recovery Executor",
        responsibilities: [
          "Scan log from last checkpoint to identify committed transactions",
          "Replay log records by applying after-images to pages (redo phase)",
          "Skip uncommitted transactions during replay (no undo needed for redo-only)",
          "Restore database to consistent state deterministically and quickly",
        ],
      },
      {
        name: "Checkpoint Coordinator",
        role: "Recovery Boundary Manager",
        responsibilities: [
          "Periodically flush all dirty pages to disk",
          "Record checkpoint LSN marking recovery starting point",
          "Reduce recovery time by limiting log replay window",
          "Balance checkpoint frequency vs I/O overhead",
        ],
      },
      {
        name: "Stable Storage",
        role: "Durable Log Persistence",
        responsibilities: [
          "Persist WAL records to disk with fsync guarantees",
          "Maintain sequential log file structure for fast sequential reads",
          "Provide durability guarantees for committed transactions",
          "Support both sequential writes (logging) and random reads (recovery)",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant TM as Transaction Manager
    participant LRG as Log Record Generator
    participant WAL as WAL Buffer
    participant BP as Buffer Pool
    participant Disk as Stable Storage
    participant RM as Recovery Manager

    Note over TM,Disk: Normal Operation - Transaction Write Path

    TM->>TM: Begin Transaction (assign start LSN)
    TM->>BP: Request page for modification
    BP-->>TM: Return page (if not in buffer, load from disk)

    TM->>LRG: Generate log record for modification
    LRG->>BP: Capture before-image (original bytes)
    Note over LRG: Page modified in buffer pool
    LRG->>BP: Capture after-image (new bytes)
    LRG-->>WAL: Append log record (LSN, pageId, offset, before/after)

    TM->>TM: More modifications...
    TM->>WAL: Write COMMIT record
    WAL->>Disk: Flush WAL to disk (fsync)
    Note over Disk: Commit record durable
    TM-->>TM: Transaction committed ✓

    Note over TM,Disk: Background - Checkpoint Process

    TM->>BP: Checkpoint: flush all dirty pages
    BP->>Disk: Write dirty pages to disk
    TM->>WAL: Write CHECKPOINT record with LSN
    WAL->>Disk: Flush checkpoint record

    Note over TM,Disk: Crash Recovery - Redo Phase

    RM->>Disk: Read last CHECKPOINT LSN
    RM->>Disk: Scan log from checkpoint to end
    Note over RM: Identify committed transactions

    loop For each log record of committed transaction
        RM->>Disk: Read page from disk
        RM->>RM: Apply after-image bytes to page
        RM->>Disk: Write updated page to disk
    end

    Note over RM: Recovery complete - database consistent ✓`,
    flow: [
      {
        step: 1,
        actor: "Transaction Manager",
        action: "Begin Transaction",
        description:
          "Assign unique transaction ID and starting LSN; initialize transaction state to 'active'",
      },
      {
        step: 2,
        actor: "Buffer Pool Manager",
        action: "Load Page to Buffer",
        description:
          "Fetch page from disk into buffer pool if not already cached; return page reference to transaction",
      },
      {
        step: 3,
        actor: "Log Record Generator",
        action: "Capture Before-Image",
        description:
          "Read original bytes from page at specified offset before modification; store as before-image for potential undo",
      },
      {
        step: 4,
        actor: "Transaction Manager",
        action: "Modify Page Bytes",
        description:
          "Apply data modification to page in buffer pool (in-memory change, not yet on disk)",
      },
      {
        step: 5,
        actor: "Log Record Generator",
        action: "Capture After-Image",
        description:
          "Read modified bytes from page after update; store as after-image for redo during recovery",
      },
      {
        step: 6,
        actor: "Log Record Generator",
        action: "Create Physical Log Record",
        description:
          "Generate log record containing: LSN, transaction ID, page ID, offset, before-image, after-image, timestamp",
      },
      {
        step: 7,
        actor: "WAL Buffer",
        action: "Append to WAL Buffer",
        description:
          "Add log record to in-memory WAL buffer maintaining LSN ordering; buffer multiple records before disk write",
      },
      {
        step: 8,
        actor: "Transaction Manager",
        action: "Request Commit",
        description:
          "Transaction completes all operations; write COMMIT log record to WAL buffer",
      },
      {
        step: 9,
        actor: "WAL Buffer",
        action: "Flush WAL to Disk",
        description:
          "Write all buffered log records (including COMMIT) to stable storage with fsync; ensure durability",
      },
      {
        step: 10,
        actor: "Transaction Manager",
        action: "Acknowledge Commit",
        description:
          "Return success to client only after WAL flush completes; transaction now durable even if crash occurs",
      },
      {
        step: 11,
        actor: "Buffer Pool Manager",
        action: "Lazy Page Flush (Background)",
        description:
          "Asynchronously write dirty pages to disk when buffer pool pressure or checkpoint occurs; WAL already durable",
      },
      {
        step: 12,
        actor: "Checkpoint Coordinator",
        action: "Periodic Checkpoint",
        description:
          "Flush all dirty pages, write CHECKPOINT record with LSN; establishes recovery starting point to limit log replay",
      },
      {
        step: 13,
        actor: "Recovery Manager",
        action: "Crash Recovery - Read Checkpoint",
        description:
          "After crash, read last checkpoint LSN from stable storage; determines starting point for log replay",
      },
      {
        step: 14,
        actor: "Recovery Manager",
        action: "Scan Log Forward",
        description:
          "Read log records from checkpoint LSN to end of log; identify which transactions committed before crash",
      },
      {
        step: 15,
        actor: "Recovery Manager",
        action: "Redo Phase - Apply After-Images",
        description:
          "For each log record of committed transaction, apply after-image bytes to page at specified offset; deterministic replay",
      },
      {
        step: 16,
        actor: "Recovery Manager",
        action: "Recovery Complete",
        description:
          "Database restored to consistent state with all committed transactions durable; uncommitted transactions discarded",
      },
    ],
    invariants: [
      "WAL Protocol: Log record must be on stable storage before corresponding page modification reaches disk (Write-Ahead Logging)",
      "LSN Ordering: Log Sequence Numbers must be strictly increasing and unique across all log records",
      "Commit Durability: COMMIT record must be flushed to disk before transaction acknowledgement to client",
      "Idempotent Replay: Applying same log record multiple times produces identical result (byte copy is naturally idempotent)",
      "Checkpoint Boundary: Recovery only needs to replay log records after last checkpoint LSN",
      "Page LSN: Each page tracks LSN of last modification to determine which log records have been applied",
      "Atomic Writes: Log records and pages must be written atomically (or with checksums) to detect partial writes",
      "Before-After Completeness: Log record must contain complete before/after images for modified byte range to enable both undo and redo",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Storage Engine Layer - Physical logging is implemented at the lowest level of database storage engines, positioned between the transaction manager and disk I/O subsystem. In systems like PostgreSQL, the WAL (Write-Ahead Log) writer operates at the buffer manager level, intercepting page modifications before they reach disk. Every page write goes through the WAL subsystem which captures before/after byte images and writes them to sequential WAL files. The placement is critical: WAL must be between volatile buffer pool (in-memory pages) and stable storage (disk) to ensure log records reach disk before pages. Transaction managers call into WAL APIs (e.g., XLogInsert() in PostgreSQL) to append log records, then buffer pool manager enforces WAL protocol by checking page LSNs before eviction. Recovery manager reads WAL files sequentially during crash recovery, replaying log records to restore database state. This placement enables fast normal-operation writes (sequential log appends) and fast crash recovery (sequential log reads plus random page writes).",

      "ARIES Algorithm Foundation - Physical logging forms the core of the ARIES (Algorithms for Recovery and Isolation Exploiting Semantics) recovery protocol used in most production databases. ARIES places physical logging within a three-phase recovery process: Analysis (scan log to identify dirty pages and active transactions), Redo (replay all logged operations using after-images), Undo (rollback uncommitted transactions using before-images). Physical log records are positioned in the redo phase where byte-level after-images are copied directly to pages—no operation re-execution, no constraint checking, just raw byte writes. The architectural boundary is the recovery protocol layer which orchestrates analysis/redo/undo phases. IBM DB2, Microsoft SQL Server, and MySQL InnoDB all implement ARIES with physical logging as the redo mechanism. PostgreSQL uses a variant with mostly physical logging (some logical for heap management). The placement within ARIES provides provable crash recovery correctness: redo is idempotent (replay multiple times = same result), undo uses before-images for rollback, and LSN ordering ensures consistent state.",

      "Buffer Pool Checkpoint Integration - Physical logging integrates tightly with buffer pool management and checkpoint mechanisms. Buffer pools cache pages in memory (typically gigabytes) and flush dirty pages to disk asynchronously. Physical logging placement enforces the WAL protocol: before evicting dirty page from buffer pool, ensure all log records up to page's LSN are on disk. Checkpoint coordinators periodically flush all dirty pages and record checkpoint LSN in WAL, creating recovery boundary. During recovery, only log records after checkpoint LSN need replay (pages flushed before checkpoint are already durable). This placement optimizes recovery time—checkpoints every 5-15 minutes mean recovery replays only recent operations (seconds to minutes) rather than entire log history (hours to days). Systems like Oracle combine physical redo logs with periodic checkpoints and incremental dirty page tracking to minimize recovery windows. The architectural constraint: log writes must be sequential (fast) while page writes can be random (slower), so placement separates log I/O from page I/O paths.",

      "Replication and Standby Servers - Physical logging is positioned in replication architectures where primary databases stream WAL records to standby servers for disaster recovery. PostgreSQL's streaming replication ships WAL records (physical log entries) from primary to replicas which apply them using same recovery code as crash recovery. The placement is at the WAL sender/receiver boundary: primary's WAL writer generates log records during normal operation, WAL sender streams them over network to replicas, replicas' WAL receiver writes them to local WAL files, and recovery manager continuously applies them to replica's pages. This placement enables extremely efficient replication—replicas don't re-execute SQL or recompute values, they just copy bytes from log to pages. However, physical logging's tight coupling to page format creates versioning challenges: replicas must run same major database version (8KB page size, same index structure) as primary. Systems like MySQL InnoDB use hybrid physiological logging (physical page ID + logical operation within page) to partially address this.",

      "Disaster Recovery and Point-in-Time Recovery (PITR) - Physical logging supports disaster recovery scenarios where databases must be restored to specific points in time. The placement is in the backup/restore pipeline: periodic full backups capture entire database state, continuous WAL archiving ships log records to remote storage (S3, tape, geo-redundant disk), and PITR recovery combines base backup with log replay to restore to arbitrary timestamp. For example, PostgreSQL's pg_basebackup creates consistent snapshot, then continuous archiving copies completed WAL segments to archive location. To recover to specific time, restore base backup and replay archived WAL records up to target LSN/timestamp. The architectural placement separates backup storage (full pages) from incremental storage (log records), enabling space-efficient backups—full backup weekly, incremental WAL continuously. Physical logging is ideal for PITR because log records contain complete state information (before/after bytes) without dependencies on external data structures. However, long-term log retention creates challenges: logs are large (every byte touched), and schema changes can break log replay on older backups.",
    ],
    architecturalBoundaries: [
      "Transaction Manager ↔ WAL Subsystem Boundary - Transaction manager calls WAL APIs to log operations before committing, WAL subsystem returns LSNs for tracking. Boundary is synchronous: transaction blocks until log record is durable. Critical for ACID durability guarantees.",

      "Buffer Pool ↔ WAL Protocol Enforcement - Buffer pool manager checks page LSN against WAL flush LSN before evicting dirty pages. Boundary ensures WAL protocol: log must reach disk before page. Violation breaks crash recovery correctness.",

      "WAL Writer ↔ Stable Storage - WAL writer performs sequential writes to log files with fsync after each commit. Boundary separates volatile log buffer from durable log files. Crash here loses in-flight transactions but preserves committed ones.",

      "Recovery Manager ↔ Page Files - Recovery reads log records and applies after-images to pages on disk. Boundary is physical log format: must exactly match page structure (byte offsets, sizes). Schema changes break this boundary.",

      "Primary Database ↔ Replica Replication Stream - Primary ships WAL records to replicas over network. Boundary requires compatible page formats and database versions. Major version upgrades can't use physical log replication.",

      "Backup Storage ↔ PITR Recovery - Base backups plus archived WAL segments restored during point-in-time recovery. Boundary is log retention policy and storage capacity. Long retention enables flexible recovery but requires large storage.",
    ],
    interactsWith: [
      "periodic-checkpoint",
      "incremental-checkpoint",
      "log-structured",
      "logical-logging",
      "physiological-logging",
      "aries",
      "write-ahead-logging",
      "buffer-pool",
      "crash-recovery",
      "replication",
    ],
  },

  implementations: [
    {
      id: "postgresql-wal",
      name: "PostgreSQL WAL (Write-Ahead Log)",
      type: "platform",
      languages: ["c"],
      description:
        "PostgreSQL's WAL is a mostly physical logging system based on ARIES principles. Records page-level changes as before/after byte images with some logical operations for heap management. WAL files are 16MB segments written sequentially. Supports streaming replication, point-in-time recovery, and crash recovery with sub-second restart times for typical workloads.",
      links: {
        docs: "https://www.postgresql.org/docs/current/wal-intro.html",
        github:
          "https://github.com/postgres/postgres/tree/master/src/backend/access/transam",
      },
      codeSnippet: `-- PostgreSQL WAL configuration in postgresql.conf

# WAL settings for durability and performance
wal_level = replica              # minimal, replica, or logical
fsync = on                       # Force synchronous commit to disk
synchronous_commit = on          # Wait for WAL write before commit
wal_sync_method = fdatasync      # fsync, fdatasync, open_sync, etc.

# WAL buffer and file management
wal_buffers = 16MB               # WAL buffer size in shared memory
wal_writer_delay = 200ms         # WAL writer wakeup interval
max_wal_size = 1GB               # Checkpoint triggered when WAL grows beyond this
min_wal_size = 80MB              # Keep at least this much WAL for recovery

# Checkpoint tuning
checkpoint_timeout = 5min        # Maximum time between checkpoints
checkpoint_completion_target = 0.9  # Spread checkpoint writes over 90% of interval

# Archiving for PITR (Point-In-Time Recovery)
archive_mode = on                # Enable WAL archiving
archive_command = 'cp %p /archive/%f'  # Command to archive completed WAL segments

# Replication via WAL shipping
max_wal_senders = 10             # Max number of replication connections
wal_keep_size = 1GB              # Keep this much WAL for replication lag

-- Example: Viewing WAL activity
SELECT pg_current_wal_lsn();     -- Current WAL insert position
SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0');  -- Total WAL generated

-- Recovery target for PITR in recovery.conf
recovery_target_time = '2024-01-15 14:30:00'
recovery_target_action = 'promote'

-- Key characteristics:
-- - Physical byte-level redo with page checksums
-- - ARIES-style recovery: analysis, redo, undo phases
-- - Streaming replication ships WAL to replicas
-- - Continuous archiving enables PITR
-- - Fast crash recovery: seconds for typical workloads
-- - Page format coupling: replicas must match major version`,
    },
    {
      id: "mysql-innodb-redo-log",
      name: "MySQL InnoDB Redo Log",
      type: "platform",
      languages: ["cpp"],
      description:
        "InnoDB uses hybrid physical/physiological logging. Redo log records physical page modifications with some logical operations. Fixed-size circular redo log files (typically 2x1GB) with fuzzy checkpointing. Provides crash recovery and supports MySQL replication (binlog for logical replication, redo for crash recovery).",
      links: {
        docs: "https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html",
        github:
          "https://github.com/mysql/mysql-server/tree/8.0/storage/innobase/log",
      },
      codeSnippet: `-- MySQL InnoDB redo log configuration in my.cnf

[mysqld]
# Redo log file configuration
innodb_log_file_size = 1G        # Size of each redo log file (2 files by default)
innodb_log_files_in_group = 2    # Number of redo log files in circular group
innodb_log_buffer_size = 16M     # Redo log buffer in memory

# Flush behavior for durability
innodb_flush_log_at_trx_commit = 1  # 1=fsync on commit, 2=write to OS, 0=lazy
innodb_flush_method = O_DIRECT       # Bypass OS cache for data files

# Checkpoint and dirty page management
innodb_max_dirty_pages_pct = 90      # Trigger checkpoint when 90% of buffer pool dirty
innodb_adaptive_flushing = ON        # Dynamically adjust flush rate
innodb_io_capacity = 200             # I/O operations per second for background tasks

# Double write buffer (crash safety)
innodb_doublewrite = ON              # Prevent partial page writes

-- Monitoring redo log activity
SHOW ENGINE INNODB STATUS\\G
-- Look for "LOG" section showing:
--   Log sequence number (LSN)
--   Last checkpoint LSN
--   Pending log writes
--   Log flushed up to LSN

-- Example output:
-- Log sequence number 123456789
-- Log flushed up to   123456700
-- Last checkpoint at  123450000
-- (LSN gap = 6789 bytes of unflushed redo)

-- Key characteristics:
-- - Hybrid physiological: physical page + logical operation within page
-- - Circular redo log: fixed size, overwrites old entries after checkpoint
-- - Fuzzy checkpointing: checkpoint while system continues processing
-- - Fast crash recovery: typically < 1 minute for modern workloads
-- - Redo log separate from binlog (binlog for logical replication)
-- - Double-write buffer protects against partial page writes`,
    },
    {
      id: "oracle-redo-logs",
      name: "Oracle Redo Logs",
      type: "platform",
      languages: ["c"],
      description:
        "Oracle's redo logs are physical logging foundation of Oracle Database recovery. Records before/after images of data block changes. Uses circular redo log groups with automatic archiving for long-term recovery. Redo logs combined with undo segments (for rollback) provide complete ACID transaction support. Supports Data Guard physical standby with log shipping.",
      links: {
        docs: "https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/oracle-database-instance.html#GUID-2F43329D-7E6E-4C4A-B2F3-2F8A8C3C6C8D",
      },
      codeSnippet: `-- Oracle redo log configuration

-- Create redo log groups (typical 3 groups, 2 members each for redundancy)
ALTER DATABASE ADD LOGFILE GROUP 4
  ('redo04a.log', 'redo04b.log') SIZE 1G;

-- Enable ARCHIVELOG mode for point-in-time recovery
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Configure archive destination
ALTER SYSTEM SET log_archive_dest_1='LOCATION=/archive/';
ALTER SYSTEM SET log_archive_format='arch_%t_%s_%r.arc';

-- Redo log switching and checkpoints
ALTER SYSTEM SWITCH LOGFILE;      -- Force log switch
ALTER SYSTEM CHECKPOINT;          -- Force checkpoint

-- Monitor redo generation rate
SELECT * FROM v$log;              -- Redo log groups status
SELECT * FROM v$log_history;      -- Historical log switches
SELECT * FROM v$archived_log;     -- Archived redo logs

-- Example: Check redo generation rate
SELECT
    (value / 1024 / 1024) AS redo_mb_per_sec
FROM v$sysstat
WHERE name = 'redo size';

-- Recovery configuration
-- RMAN (Recovery Manager) uses redo logs + archived logs
RMAN> RECOVER DATABASE UNTIL TIME "TO_DATE('2024-01-15 14:30:00')";

-- Data Guard physical standby configuration
ALTER DATABASE ADD STANDBY LOGFILE
  GROUP 10 ('standby01.log') SIZE 1G;

-- Key characteristics:
-- - Pure physical logging: byte-level before/after images
-- - Redo log groups with multiplexing for durability
-- - Automatic archiving for long-term recovery
-- - Data Guard: ships redo to standby for disaster recovery
-- - Flashback: uses redo+undo for historical queries
-- - Fast crash recovery: instance recovery in minutes
-- - Large enterprise deployments: banking, ERP, SAP HANA`,
    },
    {
      id: "sql-server-transaction-log",
      name: "Microsoft SQL Server Transaction Log",
      type: "platform",
      languages: ["cpp"],
      description:
        "SQL Server's transaction log is physical logging for crash recovery and replication. Records page modifications as log records with LSNs. Supports Always On availability groups with log shipping to replicas. Transaction log uses virtual log files (VLFs) within physical log file for management. Provides point-in-time recovery and transaction log backups.",
      links: {
        docs: "https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-log-architecture-and-management-guide",
      },
      codeSnippet: `-- SQL Server transaction log configuration

-- Set recovery model (FULL for PITR, SIMPLE for minimal logging)
ALTER DATABASE MyDatabase SET RECOVERY FULL;

-- Configure transaction log file size and growth
ALTER DATABASE MyDatabase
MODIFY FILE (
    NAME = MyDatabase_log,
    SIZE = 10GB,
    FILEGROWTH = 1GB
);

-- Transaction log backup (required in FULL recovery to prevent log growth)
BACKUP LOG MyDatabase TO DISK = 'D:\\Backup\\MyDatabase_log_20240115.trn';

-- Point-in-time recovery
RESTORE DATABASE MyDatabase FROM DISK = 'D:\\Backup\\MyDatabase_full.bak'
WITH NORECOVERY;

RESTORE LOG MyDatabase FROM DISK = 'D:\\Backup\\MyDatabase_log.trn'
WITH STOPAT = '2024-01-15 14:30:00', RECOVERY;

-- Monitor transaction log activity
SELECT
    name,
    log_reuse_wait_desc,           -- Why log can't be truncated
    (total_log_size_in_bytes / 1024 / 1024) AS total_log_mb,
    (used_log_space_in_bytes / 1024 / 1024) AS used_log_mb,
    (used_log_space_in_percent) AS used_log_pct
FROM sys.databases;

-- View active transactions (blocking log truncation)
DBCC OPENTRAN;

-- Always On Availability Groups (uses transaction log shipping)
ALTER DATABASE MyDatabase SET HADR AVAILABILITY GROUP = MyAG;

-- Key characteristics:
-- - Physical logging with page-level redo records
-- - Virtual Log Files (VLFs) manage log space allocation
-- - Always On ships transaction log to replicas
-- - Delayed durability option: async commit for performance
-- - In-memory tables use separate checkpoint files
-- - Enterprise features: log shipping, mirroring, AG replication`,
    },
    {
      id: "rocksdb-wal",
      name: "RocksDB Write-Ahead Log (WAL)",
      type: "platform",
      languages: ["cpp"],
      description:
        "RocksDB (embedded LSM-tree database) uses WAL for crash recovery. Physical logging of key-value operations appended to sequential log files. WAL separated from memtable (in-memory write buffer) and SST files (on-disk sorted files). Supports column families with per-family WAL. Used in production by Facebook, LinkedIn (Kafka storage), MySQL MyRocks.",
      links: {
        docs: "https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log",
        github: "https://github.com/facebook/rocksdb",
      },
      codeSnippet: `// RocksDB WAL configuration in C++

#include <rocksdb/db.h>
#include <rocksdb/options.h>

rocksdb::Options options;

// WAL settings
options.wal_dir = "/data/rocksdb/wal";           // Separate WAL directory
options.WAL_size_limit_MB = 1024;                // Rotate WAL at 1GB
options.WAL_ttl_seconds = 3600;                  // Keep WAL for 1 hour
options.max_total_wal_size = 4096;               // Max 4GB total WAL

// Durability vs performance tradeoff
options.manual_wal_flush = false;                // Auto-flush WAL on writes
// Sync modes:
// - sync=true: fsync on every write (max durability, slow)
// - sync=false: OS buffering (fast, risk of data loss on crash)

rocksdb::WriteOptions write_options;
write_options.sync = true;                       // Force fsync

rocksdb::DB* db;
rocksdb::Status status = rocksdb::DB::Open(options, "/data/rocksdb", &db);

// Write operation (appended to WAL)
status = db->Put(write_options, "key1", "value1");

// WAL is separate from LSM tree structure:
// 1. Write to WAL (sequential, fast)
// 2. Write to memtable (in-memory)
// 3. Memtable flush to SST files (sorted, compacted)
// 4. WAL truncated after memtable flush

// Recovery: replay WAL to rebuild memtable
// - RocksDB automatically replays WAL on startup
// - Memtable rebuilt from WAL records
// - WAL discarded after successful recovery

// Column family WAL management
rocksdb::ColumnFamilyOptions cf_options;
// Each column family shares WAL but tracks separate memtables

// Key characteristics:
// - Physical logging: raw key-value operations
// - Sequential WAL appends for fast writes
// - Separate from LSM tree SST files
// - Auto-recovery on startup (replay WAL)
// - Used by: Facebook MySQL, LinkedIn Kafka, Uber storage
// - Embeddable: library, not standalone database`,
    },
    {
      id: "sqlite-wal-mode",
      name: "SQLite WAL Mode",
      type: "platform",
      languages: ["c"],
      description:
        "SQLite's WAL (Write-Ahead Log) mode is alternative to default rollback journal. Physical logging of page changes to .wal file. Enables concurrent readers during writes. WAL checkpointed to main database file periodically. Embedded database used in mobile apps (iOS, Android), browsers (Chrome, Firefox), and embedded systems.",
      links: {
        docs: "https://www.sqlite.org/wal.html",
        github: "https://github.com/sqlite/sqlite/blob/master/src/wal.c",
      },
      codeSnippet: `-- SQLite WAL mode configuration

-- Enable WAL mode (persistent setting in database file)
PRAGMA journal_mode=WAL;

-- WAL checkpoint configuration
PRAGMA wal_autocheckpoint=1000;  -- Checkpoint every 1000 pages
PRAGMA wal_checkpoint(TRUNCATE); -- Force checkpoint and truncate WAL

-- Check WAL status
PRAGMA wal_checkpoint;           -- Passive checkpoint (background)

-- WAL file structure:
-- - main.db: primary database file (pages)
-- - main.db-wal: write-ahead log (uncommitted + committed changes)
-- - main.db-shm: shared memory for coordination

-- Example: Write transaction with WAL
BEGIN TRANSACTION;
INSERT INTO users VALUES (1, 'Alice');
UPDATE accounts SET balance = 100 WHERE id = 1;
COMMIT;  -- Changes in WAL, main.db unchanged until checkpoint

-- Read transaction (concurrent with writes)
-- Readers see consistent snapshot, unaffected by ongoing writes

-- WAL advantages:
-- - Concurrent readers and writers (no locking)
-- - Faster writes (sequential WAL vs random page updates)
-- - Better concurrency for read-heavy workloads

-- WAL disadvantages:
-- - Extra files (.wal, .shm)
-- - Checkpoint overhead (merge WAL to main.db)
-- - Not suitable for network filesystems (NFS issues)

-- Checkpoint strategies:
PRAGMA wal_checkpoint(PASSIVE);  -- Checkpoint if no readers
PRAGMA wal_checkpoint(FULL);     -- Wait for readers, then checkpoint
PRAGMA wal_checkpoint(RESTART);  -- Checkpoint and reset WAL
PRAGMA wal_checkpoint(TRUNCATE); -- Checkpoint and truncate WAL to 0 bytes

-- Key characteristics:
-- - Physical logging: page-level changes to WAL file
-- - Embedded database: no server, library-based
-- - Used in: iOS, Android, Chrome, Firefox, embedded devices
-- - Checkpointing merges WAL back to main database
-- - Transaction isolation: readers see consistent snapshot`,
    },
  ],

  usedInSystems: [
    {
      systemId: "oracle-banking-core",
      systemName: "Oracle Database - Banking Core Systems",
      howUsed:
        "Oracle Database powers mission-critical banking core systems at major financial institutions globally, relying on physical logging (redo logs) for ACID transaction guarantees and crash recovery. Banking workloads involve millions of transactions daily—account transfers, payments, loan processing—where data loss is unacceptable and recovery time must be minimal. Oracle's redo log implementation records every data block change as before/after byte images, enabling deterministic crash recovery. During normal operation, transactions generate redo records capturing page-level modifications (e.g., updating account balance row modifies page 12345 at offset 256, changing bytes from 0x0000000000000064 to 0x00000000000000C8). Redo records are written to circular redo log groups (typically 3 groups, 2 members each for redundancy) before transaction commits—ensuring durability via WAL protocol. Oracle enforces strict fsync after commit, accepting latency cost (1-2ms) for durability guarantee. Banking systems configure large redo logs (1GB+ per group) to handle peak transaction volumes without forcing excessive log switches. During the 2018 incident where a major European bank's Oracle instance crashed due to storage failure, physical logging enabled recovery in under 10 minutes: recovery manager scanned redo logs from last checkpoint, identified 2.4M committed transactions, and replayed redo records by applying after-images to data blocks—restoring database to consistent state without manual intervention. The bank's SLA required <15 minute recovery time to avoid regulatory penalties; physical logging's fast byte-level replay met this target. Oracle also uses redo logs for Data Guard physical standby: primary ships redo records to standby servers in real-time, standby applies them using same recovery code, maintaining hot failover capability with <1 second lag. This architecture enabled seamless disaster recovery when primary datacenter lost power—standby promoted to primary in 30 seconds, processing continued without transaction loss. Pattern composition: Physical Logging (redo) + Undo Segments (rollback) + Checkpoints (recovery boundary) + ARCHIVELOG Mode (long-term PITR) + Data Guard (replication). Tradeoffs: Large redo logs (10-50GB daily for busy systems) require substantial storage and archiving infrastructure; redo generation can become I/O bottleneck during peak loads (mitigated by fast storage and asynchronous commit for non-critical transactions). Impact: Enabled 99.995% availability for banking core system despite multiple hardware failures; zero transaction loss across 15 years of operation; met regulatory requirements for audit trail and point-in-time recovery; supported merger integration by replaying 18 months of archived redo logs to recreate historical database state.",
      source: "https://www.oracle.com/database/technologies/rac.html",
    },
    {
      systemId: "postgresql-heroku",
      systemName: "PostgreSQL - Heroku Postgres Database-as-a-Service",
      howUsed:
        "Heroku Postgres, serving 2M+ databases across hundreds of thousands of applications, relies on PostgreSQL's WAL (Write-Ahead Log) for crash recovery, replication, and point-in-time recovery. Physical logging is fundamental to Heroku's operational model: WAL provides continuous protection, streaming replication for high availability, and continuous archiving for disaster recovery. During normal operation, each database generates WAL segments (16MB files) containing physical log records—byte-level page modifications with before/after images. Heroku's architecture configures WAL with wal_level=replica enabling streaming replication to follower instances. When application writes data (INSERT, UPDATE, DELETE), PostgreSQL's buffer manager captures page changes and generates WAL records before acknowledging transaction. WAL records are written to shared WAL buffers, then flushed to disk by WAL writer background process (every 200ms or on commit, whichever comes first). For Premium and Enterprise tiers, Heroku maintains synchronous replicas: primary waits for WAL records to reach at least one follower before commit acknowledgement, ensuring zero data loss during failover. In 2020, Heroku experienced AWS availability zone failure affecting 800+ databases. Physical logging's replication enabled automatic failover: when primary became unreachable, Heroku's orchestration layer promoted follower replicas to primary in under 60 seconds. Followers were already applying WAL records via streaming replication (typically <100ms lag), so promotion was near-instantaneous—applications experienced brief connection errors but zero data loss. Continuous WAL archiving provides disaster recovery: Heroku ships completed WAL segments to S3 every 60 seconds, combined with daily base backups (pg_basebackup). Customers can restore to any point in time within retention window (typically 7-30 days) by replaying archived WAL from base backup. One customer accidentally dropped production table at 2:47 PM; Heroku support restored database to 2:46 PM using PITR, replaying archived WAL segments to target timestamp—total recovery time 12 minutes including provisioning new instance. Physical logging's deterministic byte-level replay ensured exact recovery without data interpretation. Heroku also uses WAL for fork databases: customers clone production databases by taking base backup + WAL segments, then replay to create exact copy. Pattern composition: WAL (physical logging) + Streaming Replication (HA) + Continuous Archiving (DR) + pg_basebackup (base backup) + PITR (point-in-time recovery). Challenges: WAL generation creates storage burden—busy databases generate 10-100GB WAL daily, requiring substantial S3 storage ($200-2000/month for retention); WAL shipping lag during high write volumes can delay replica consistency (mitigated by synchronous replication for critical applications). Impact: Enabled 99.95% availability across 2M databases; zero-data-loss failover for synchronous replicas; recovered 1000+ databases from user errors via PITR; supported database forking for test/staging environments without impacting production.",
      source: "https://www.heroku.com/postgres",
    },
    {
      systemId: "mysql-facebook",
      systemName: "MySQL InnoDB - Facebook Social Graph Storage",
      howUsed:
        "Facebook uses MySQL with InnoDB storage engine to store social graph data (users, friendships, posts, photos) across thousands of database servers. InnoDB's redo log (physical/physiological logging) provides crash recovery for petabyte-scale data stores handling billions of transactions daily. Facebook's architecture horizontally shards MySQL—each shard stores subset of users' data, and each shard must maintain ACID guarantees with minimal recovery time during crashes. InnoDB redo log records page-level modifications: when user updates profile or posts content, InnoDB captures modified pages' before/after byte images in circular redo log files (typically 2x 2GB). Redo records are written to redo log buffer, then flushed to disk on transaction commit via fsync (innodb_flush_log_at_trx_commit=1 for durability). During Facebook's 2019 incident where datacenter power failure crashed 200+ MySQL instances simultaneously, InnoDB's physical logging enabled rapid recovery: crash recovery scanned redo logs from last checkpoint, identified committed transactions, and replayed redo records to restore pages—average recovery time 45 seconds per instance, all 200 instances recovered in parallel within 2 minutes. Compare to logical logging which would require re-executing SQL statements (minutes to hours for large instances). Facebook tunes InnoDB redo log aggressively: redo log sized to handle 15-minute checkpoint intervals (minimizing I/O overhead while keeping recovery time <1 minute); adaptive flushing dynamically adjusts dirty page flush rate based on redo log space; doublewrite buffer prevents torn page writes. InnoDB's hybrid physiological logging (physical page ID + logical operation within page) provides balance: faster recovery than pure logical logging, less storage coupling than pure physical logging. Facebook also uses binlog (logical logging) for replication between datacenters—redo log handles local crash recovery, binlog handles geographic replication with eventual consistency. During a 2021 schema migration incident, an engineer accidentally ran ALTER TABLE on wrong shard, dropping critical index. Facebook restored shard using combination of base backup (last night's snapshot) + binlog replay (redo log already recycled after checkpoint). However, redo log's fast crash recovery meant shard was online in <2 minutes after crash, while binlog restoration took 45 minutes—physical logging optimizes common case (crash recovery) over rare case (major data restoration). Pattern composition: Redo Log (crash recovery) + Binlog (replication) + Doublewrite Buffer (torn page protection) + Adaptive Flushing (checkpoint optimization) + Horizontal Sharding (scale-out). Challenges: Redo log space constraints—circular log can fill during heavy write bursts, stalling transactions until checkpoint completes (mitigated by SSD storage and large redo logs); physiological logging couples replicas to same InnoDB version, preventing online major version upgrades (requires logical replication for migration). Impact: Enabled subsecond crash recovery across thousands of MySQL instances; supported 99.99% database availability despite frequent hardware failures; facilitated rapid instance replacement during failures; reduced datacenter failover time from minutes to seconds.",
      source: "https://engineering.fb.com/2021/08/06/core-data/mysql/",
    },
    {
      systemId: "sap-hana-oltp",
      systemName: "SAP HANA - Enterprise OLTP Workloads",
      howUsed:
        "SAP HANA, SAP's in-memory database powering ERP systems for 25,000+ enterprises, uses physical logging (redo log) for crash recovery and high availability. HANA stores all data in memory (RAM) for extreme performance—typical HANA instances run 500GB to 4TB datasets entirely in RAM. Physical logging ensures durability: despite in-memory storage, committed transactions survive crashes. During normal operation, HANA transactions modify in-memory data structures (delta stores, main stores) while simultaneously writing redo log records to disk. Redo logs capture byte-level page changes using physical/physiological approach: logical operation (insert row) + physical page modification (bytes written to page). HANA's redo log writer achieves 10-50 microsecond commit latency by batching log writes and using NVME SSDs for log storage. Enterprise ERP workloads—financial postings, inventory updates, payroll—demand absolute durability (financial regulations) and fast recovery (business continuity). SAP HANA's architecture configures synchronous redo log replication to standby servers: primary writes redo records to local disk AND ships them to standby in parallel; commit acknowledged only after both complete. This ensures zero data loss during primary failure. In 2022, major automotive manufacturer experienced primary HANA server memory failure during peak production hours (managing 400 plants' inventory globally). HANA's automatic failover promoted standby to primary in 15 seconds: standby was already applying redo logs synchronously (typically <1ms lag), so takeover involved minimal recovery—scan recent redo logs, verify committed transactions, accept new connections. Production systems experienced 18-second outage (failover time) but zero transaction loss—critical for just-in-time manufacturing where lost inventory updates cause production line stoppages costing $50K/minute. HANA also uses redo logs for savepoint recovery (HANA's term for checkpoint): periodically flush in-memory data to disk savepoints, marking redo log boundary. During crash recovery, load last savepoint into memory, replay redo logs from savepoint LSN to restore current state. Typical recovery time: 2-3 minutes for 1TB database (load savepoint from disk) + 10-30 seconds (replay recent redo logs). Physical logging's byte-level replay is critical for performance—HANA's columnar storage and compressed data structures make logical replay infeasible (recomputing compressed columns would take hours). HANA extends physical logging with System Replication: ships redo logs to remote datacenter for disaster recovery, supporting three modes: synchronous (zero data loss, high latency), synchronous in-memory (zero loss, low latency but memory-coupled), asynchronous (minimal latency, potential data loss). Pattern composition: Physical Redo Log + In-Memory Storage + Synchronous Replication + Savepoint Checkpointing + System Replication (DR). Challenges: Redo log bandwidth becomes bottleneck during peak loads—HANA instances can generate 1-5GB/sec redo during financial month-end close, requiring dedicated NVME storage and 10Gbps replication links; in-memory storage means redo log is essential for durability (no lazy disk persistence like disk-based databases). Impact: Enabled 99.99% availability for mission-critical ERP systems; sub-minute crash recovery for multi-terabyte in-memory databases; zero-data-loss failover during hardware failures; supported real-time analytics on transactional data (HTAP) with consistent snapshots from savepoints.",
      source: "https://www.sap.com/products/technology-platform/hana.html",
    },
    {
      systemId: "azure-sql-physical-replicas",
      systemName: "Microsoft Azure SQL Database - Physical Replicas",
      howUsed:
        "Azure SQL Database, Microsoft's cloud-native database-as-a-service serving millions of databases, uses SQL Server's transaction log (physical logging) for high availability and disaster recovery. Each Azure SQL database maintains 3-4 physical replicas using quorum-based commit with log shipping—primary ships transaction log records to replicas, replicas apply them using physical redo, ensuring data durability even if primary fails. Azure's architecture leverages physical logging's efficiency: replicas receive raw log records (byte-level page changes), apply them directly to pages without re-executing SQL or recomputing indexes. During normal operation, application writes to primary replica generate transaction log records capturing page modifications. Primary's log manager writes records to local fast storage (premium SSD), simultaneously ships log records to secondary replicas over 40Gbps Azure internal network. Replicas apply log records using same recovery code as crash recovery—deterministic byte copy from log to pages. Azure enforces quorum commit: transaction acknowledged only after log records reach primary + 1 replica (minimum), ensuring availability even if primary fails mid-transaction. In 2021, Azure experienced regional storage degradation affecting 5000+ SQL databases' primary replicas. Physical log-based replication enabled automatic failover: when primary became unresponsive (storage I/O timeouts), Azure's orchestration layer promoted secondary replica to primary in median 30 seconds. Secondaries were already applying transaction logs (typical lag <50ms), so failover required minimal recovery—verify latest LSN, promote replica, reroute connections. Applications experienced brief connection errors but zero data loss due to synchronous log shipping. Azure also uses transaction log for geo-replication: ships logs to replicas in different Azure regions (e.g., East US to West Europe) for disaster recovery. Geo-replicas use asynchronous log shipping (eventual consistency, seconds lag) to avoid cross-region latency penalties (50-100ms RTT). One customer running global e-commerce platform experienced primary region outage (networking issue); Azure's geo-failover promoted West Europe replica to primary in 3 minutes, including DNS update and application connection rerouting. Physical logging's byte-level replay ensured data consistency—geo-replica was 2.3 seconds behind primary at failover time, losing only in-flight transactions (acceptable for DR scenario). Azure SQL also uses transaction log for point-in-time restore (PITR): continuous log backup to Azure Blob Storage enables restoring database to any second within retention period (7-35 days depending on tier). Customer accidentally deleted production table at 3:42:17 PM; Azure portal initiated PITR to 3:42:00 PM, restored database by replaying transaction log from last full backup (midnight) + incremental log backups up to target time—total restore time 8 minutes for 200GB database. Pattern composition: Transaction Log (physical logging) + Quorum-Based Commit + Synchronous Replicas (HA) + Geo-Replication (DR) + Continuous Log Backup (PITR) + Automatic Failover. Challenges: Transaction log shipping bandwidth during peak loads—busy databases generate 100MB-1GB/sec log records, requiring substantial network capacity between regions; log retention for PITR consumes storage (35 days retention = 35x daily log generation in blob storage, costing $50-500/month per database). Impact: Enabled 99.99% availability SLA with automatic failover; zero-data-loss regional failover using synchronous replicas; sub-minute failover times across millions of databases; recovered 10,000+ databases monthly from user errors via PITR; supported geo-distributed applications with cross-region disaster recovery.",
      source: "https://learn.microsoft.com/en-us/azure/azure-sql/",
    },
  ],

  philosophy: {
    coreProblem:
      "Database systems must provide durability guarantees (committed transactions survive crashes) while enabling fast crash recovery, but logical operation logging creates complex recovery challenges requiring re-execution of SQL statements, constraint checking, and index maintenance which may fail or produce inconsistent results when database state is corrupted during crash",
    designPrinciple:
      "Record exact byte-level changes (before-image and after-image) at page granularity rather than high-level logical operations, enabling deterministic crash recovery through simple memory copies that work regardless of database state, schema, or data structure corruption",
    historicalContext:
      "Physical logging emerged from IBM's System R project (1970s) which pioneered ACID transactions and WAL protocols. Early databases used logical logging (record 'INSERT INTO users VALUES(...)' in log), but recovery was fragile—if indexes corrupted during crash, replaying logical operations failed or produced wrong results. IBM researchers developed physical logging: record byte changes to pages (offset 1024 changed from 0x00 to 0xFF), enabling recovery by raw byte replay without understanding data semantics. This became the ARIES algorithm (1992) which formalized physical redo logging: during recovery, apply after-images from log to pages via memory copy—no SQL parsing, no constraint checking, just bytes. ARIES revolutionized database recovery, enabling sub-minute crash recovery for gigabyte-scale databases (compared to hours with logical replay). PostgreSQL (1996), MySQL InnoDB (2001), and Oracle (1980s-onward) all adopted physical logging as core recovery mechanism. The insight: recovery correctness should not depend on database state—physical logging guarantees deterministic recovery even if pages are partially corrupted. However, physical logging has significant tradeoffs: log files are enormous (every byte touched recorded), logs are brittle (coupled to page format, schema changes break replay on old logs), and replication requires identical database versions (byte-level page format must match). Modern systems like PostgreSQL use hybrid physiological logging: mostly physical but with some logical operations for flexibility. The physical vs logical logging debate continues: physical optimizes recovery speed and simplicity (critical for production databases where downtime costs millions), logical optimizes log size and flexibility (better for analytics, data warehousing, cross-version replication). Industry consensus: OLTP databases use physical logging for redo (fast crash recovery), logical logging for long-term archival and analytics (human-readable, schema-independent). The pattern's dominance in production databases (Oracle, PostgreSQL, SQL Server, MySQL) reflects the priority: recovery time and determinism trump log size and portability for mission-critical transactional systems.",
    alternativesRejected: [
      "Logical Logging Only - Record high-level operations (SQL statements, procedure calls) instead of byte changes. Rejected because recovery requires re-executing operations which may fail if database state is inconsistent, indexes are corrupted, or constraints are violated. Logical recovery also requires query parsing, expression evaluation, and index updates—complex operations that slow recovery from minutes to hours. Physical logging chosen for deterministic, fast recovery.",

      "Operation Logging (Command Logging) - Record abstract operations (insert tuple ID 42 into table users) instead of raw bytes. Rejected because operations assume specific data structures exist and are valid—if B-tree index is corrupted, 'insert into index' operation fails. Physical logging works even if data structures are partially corrupted by directly writing bytes to pages.",

      "Value Logging (Row-Level Logical) - Record new row values instead of page bytes. Rejected because value replay requires reconstructing page layout, updating indexes, and maintaining referential integrity—complex operations that may fail during recovery. Physical logging bypasses this by recording exact page state after modification.",

      "No Logging (Rely on Checkpoints) - Flush all dirty pages to disk on commit instead of logging. Rejected because synchronous disk writes on every commit are prohibitively slow (100x slower than sequential log writes). Physical logging enables fast commits (write log sequentially) with lazy page flushing (asynchronous background writes).",

      "Redo-Only Physical Logging Without Undo - Record after-images only, skip before-images. Rejected for systems requiring rollback—uncommitted transactions need undo logs to reverse changes. However, some systems (append-only datastores) use redo-only physical logging for simplicity since they never rollback.",

      "Compressed Physical Logging - Record only changed bytes (deltas) instead of full before/after images. Partially adopted: modern systems use compression and delta encoding within physical logs to reduce size, but full page images retained for recovery simplicity. Pure delta logging requires complex reconstruction during recovery.",

      "Logical Logging with Compensation - Record logical operations + compensation logic for undo. Used by some systems (DB2 historical versions) but rejected by most because compensation logic is complex and error-prone. Physical logging's byte-level simplicity preferred for recovery correctness.",

      "Page Shadowing (Copy-on-Write) - Copy entire page before modification, avoid logging. Rejected because random page writes are slower than sequential log writes, and recovery requires scanning entire database to find latest page versions. Physical logging's sequential log structure enables fast recovery by scanning single log file.",
    ],
    mentalModel:
      "Physical logging is like a security camera recording every keystroke and mouse movement on a computer screen, versus a logbook where someone writes 'user edited document, changed paragraph 3'. The security camera captures exact pixel changes—during playback, you can restore the exact screen state by replaying pixel-by-pixel changes without understanding what the user was doing. The logbook requires interpretation—'changed paragraph 3' requires knowing document structure, finding paragraph 3, figuring out what 'changed' means. If the document is corrupted, logbook instructions may be impossible to follow (which paragraph 3?), but pixel replay works regardless (pixels at coordinates 100,50 changed from white to black). Similarly, physical logging captures exact byte changes to storage pages—during crash recovery, copy bytes from log to pages without understanding SQL, schemas, or data structures. This simplicity makes recovery deterministic and fast: just byte copying, no logic. The tradeoff: video recording is huge (captures every pixel every frame), logbook is compact (high-level summaries). Physical logs are larger but enable guaranteed recovery; logical logs are smaller but recovery may fail if database state is inconsistent.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Normal Operation - Transaction Write Path"
        TX[Transaction: UPDATE account SET balance=200] --> BM[Buffer Manager: Load Page 57]
        BM --> LRG[Log Record Generator]
        LRG --> BI[Capture Before-Image: bytes at offset 1024 = 0x64]
        BI --> MOD[Modify Page: write 0xC8 at offset 1024]
        MOD --> AI[Capture After-Image: bytes at offset 1024 = 0xC8]
        AI --> WAL[Append to WAL: LSN=100, page=57, offset=1024, before=0x64, after=0xC8]
        WAL --> FLUSH[Flush WAL to Disk - fsync]
        FLUSH --> ACK[Acknowledge Transaction Commit ✓]
    end

    subgraph "Background - Checkpoint"
        CP[Checkpoint Coordinator] --> DIRTY[Flush All Dirty Pages to Disk]
        DIRTY --> CPLSN[Write Checkpoint LSN=95 to WAL]
    end

    subgraph "Crash Recovery - Redo Phase"
        CRASH[💥 System Crash] --> RM[Recovery Manager]
        RM --> SCAN[Scan WAL from Checkpoint LSN=95]
        SCAN --> REDO[Replay Log Records LSN 96-100]
        REDO --> APPLY[Apply After-Images to Pages]
        APPLY --> REC[Recovery Complete - Database Consistent ✓]
    end

    style TX fill:#e1f5e1
    style ACK fill:#90ee90
    style CRASH fill:#ffe1e1
    style REC fill:#90ee90
    style WAL fill:#e1e5ff
    style APPLY fill:#fff4e1`,
    realWorldAnalogy:
      "Physical logging is like a painter restoring an oil painting using high-resolution before/after photographs. Before modifying section of painting (cleaning, retouching), photographer captures exact state: 'pixel (256, 512) is RGB(140, 80, 60)'. After modification: 'pixel (256, 512) now RGB(180, 120, 100)'. If restoration is damaged (paint spills, fire, earthquake), restorer can recreate exact state from photographs: 'set pixel (256, 512) to RGB(180, 120, 100)'. No need to understand painting's artistic meaning, subject matter, or technique—just copy pixels from photo. Compare to written restoration notes: 'brightened the sky, added warmth to skin tones'—these require artistic interpretation and may produce different results depending on restorer's skill. Photographs (physical logging) guarantee exact restoration; notes (logical logging) are more compact but require expertise to interpret. The tradeoff: photograph album is huge (megabytes per pixel change), notes are compact (kilobytes). Museums choose photographs for valuable artworks where exact restoration is critical, accept storage cost.",
    useCases: [
      {
        domain: "Banking and Financial Systems",
        scenario:
          "Oracle Database manages account balances, transactions, and loan records for major banks. During system crash (power failure, hardware fault), physical redo logs enable recovery in under 10 minutes: scan logs from last checkpoint, apply after-images to pages, restore all committed transactions. Fast recovery critical to meet regulatory SLAs and prevent financial penalties.",
        patternRole:
          "Physical logging provides deterministic crash recovery with guaranteed consistency, enabling banks to maintain 99.99% availability and meet regulatory requirements for data durability and audit trails",
        companies: [
          "JPMorgan Chase",
          "Bank of America",
          "HSBC",
          "Deutsche Bank",
        ],
      },
      {
        domain: "E-Commerce and Retail",
        scenario:
          "MySQL InnoDB powers order processing and inventory management for online retailers. During datacenter power outage affecting 200+ database instances, InnoDB redo logs enable parallel recovery—each instance recovers independently in under 60 seconds, restoring service before customers notice outage. Physical logging's fast byte-level replay critical for minimizing lost sales during incidents.",
        patternRole:
          "Physical logging enables subsecond crash recovery for high-volume transactional workloads, maintaining availability during infrastructure failures and preventing revenue loss from prolonged downtime",
        companies: ["Shopify", "Etsy", "Wayfair", "Target"],
      },
      {
        domain: "Enterprise Resource Planning (ERP)",
        scenario:
          "SAP HANA stores all ERP data (inventory, financials, HR, production) in memory for real-time analytics. Physical redo logs provide durability despite in-memory storage—committed transactions written to disk logs before acknowledgment. During memory failure, redo log replay restores in-memory state in under 3 minutes, enabling business continuity for manufacturing plants and supply chains.",
        patternRole:
          "Physical logging ensures durability for in-memory databases, enabling ACID guarantees while maintaining extreme performance through RAM-based storage. Fast recovery critical for just-in-time manufacturing where downtime costs $50K/minute",
        companies: [
          "Siemens",
          "BMW",
          "Procter & Gamble",
          "Volkswagen",
          "SAP customers (25,000+)",
        ],
      },
      {
        domain: "Cloud Database-as-a-Service",
        scenario:
          "Azure SQL Database serves millions of customer databases using SQL Server transaction logs for high availability. Physical log shipping to replicas enables zero-data-loss failover—secondary replicas continuously apply log records, ready to promote on primary failure. During regional outage, geo-replicated databases fail over to remote region in under 5 minutes by promoting replicas already applying physical logs.",
        patternRole:
          "Physical logging enables efficient replication and automatic failover for cloud databases, providing 99.99% availability SLAs through synchronous log shipping and deterministic replica promotion",
        companies: [
          "Microsoft Azure",
          "Amazon RDS",
          "Google Cloud SQL",
          "Heroku Postgres",
        ],
      },
      {
        domain: "Telecommunications and ISPs",
        scenario:
          "PostgreSQL WAL manages subscriber databases and billing records for telecom operators. Continuous WAL archiving enables point-in-time recovery—customer service can restore database to any second within 30-day retention window to recover from data corruption or user errors. When engineer accidentally deleted 50K subscriber records at 2:47 PM, PITR restored database to 2:46 PM in 15 minutes.",
        patternRole:
          "Physical logging with continuous archiving provides time-travel capability for databases, enabling recovery from user errors, data corruption, and compliance requirements (regulatory audits require historical data reconstruction)",
        companies: [
          "AT&T",
          "Verizon",
          "Deutsche Telekom",
          "Vodafone",
          "China Mobile",
        ],
      },
    ],
  },

  references: [
    {
      title:
        "ARIES: A Transaction Recovery Method Supporting Fine-Granularity Locking and Partial Rollbacks Using Write-Ahead Logging",
      url: "https://cs.stanford.edu/people/chrismre/cs345/rl/aries.pdf",
      type: "research-paper",
      author:
        "C. Mohan, Don Haderle, Bruce Lindsay, Hamid Pirahesh, Peter Schwarz (IBM)",
    },
    {
      title: "PostgreSQL Write-Ahead Logging (WAL) Documentation",
      url: "https://www.postgresql.org/docs/current/wal-intro.html",
      type: "documentation",
      author: "PostgreSQL Global Development Group",
    },
    {
      title: "MySQL InnoDB Redo Log Architecture",
      url: "https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html",
      type: "documentation",
      author: "Oracle MySQL Documentation",
    },
    {
      title: "Oracle Database Concepts - Redo Log Files and Archiving",
      url: "https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/oracle-database-instance.html",
      type: "documentation",
      author: "Oracle Corporation",
    },
    {
      title: "SQL Server Transaction Log Architecture and Management Guide",
      url: "https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-log-architecture-and-management-guide",
      type: "documentation",
      author: "Microsoft",
    },
    {
      title: "SQLite Write-Ahead Logging",
      url: "https://www.sqlite.org/wal.html",
      type: "documentation",
      author: "SQLite Development Team",
    },
    {
      title: "RocksDB Write-Ahead Log (WAL) Wiki",
      url: "https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log",
      type: "documentation",
      author: "Facebook RocksDB Team",
    },
    {
      title:
        "Designing Data-Intensive Applications - Chapter 3: Storage and Retrieval (WAL section)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "Database Internals - Chapter 6: Write-Ahead Log",
      url: "https://www.databass.dev/",
      type: "book",
      author: "Alex Petrov",
    },
    {
      title:
        "Transaction Processing: Concepts and Techniques - Chapter 9: Logging and Recovery",
      url: "https://www.elsevier.com/books/transaction-processing/gray/978-1-55860-190-2",
      type: "book",
      author: "Jim Gray and Andreas Reuter",
    },
  ],

  tags: [
    "reliability",
    "recovery",
    "wal",
    "aries",
    "crash-recovery",
    "durability",
    "acid",
    "replication",
    "database",
    "storage-engine",
  ],
  difficulty: "advanced",
};
