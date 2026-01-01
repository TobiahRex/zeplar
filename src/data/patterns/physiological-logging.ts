import type { Pattern } from "../schema";

export const physiologicalLogging: Pattern = {
  id: "physiological-logging",
  slug: "physiological-logging",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📜 Write-Ahead Logging → 🔀 Physiological Logging",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Write-Ahead Logging",
    level: 4,
  },

  concept: {
    name: "Physiological Logging",
    emoji: "🔀",
    tagline: "Hybrid approach",
    definition:
      "Physiological logging is a hybrid write-ahead logging approach that combines physical page identification with logical operation descriptions, balancing the simplicity of physical logging with the flexibility of logical logging. Think of it like giving someone directions using both a street address (physical location) and the destination name (logical purpose)—'Turn left at 123 Main Street (the coffee shop)'. For example, instead of pure physical logging that records 'write bytes to offset 1024 of page 57' or pure logical logging that records 'UPDATE users SET balance = 100', physiological logging records 'on page 57, apply operation: increment balance field at slot 3 by 100'. The log identifies pages physically but describes changes logically within the page structure. This allows the page layout to change between logging and recovery (fields can move within pages, pages can be reorganized) as long as the logical structure is preserved. During recovery, the system finds the specified page physically, then applies the logical operation to that page. This is the approach used by modern databases like PostgreSQL and Oracle.",
    problemSolved:
      "Pure physical logging creates enormous logs and tight coupling to page layouts, while pure logical logging requires complex recovery logic and is vulnerable to non-determinism. Physical logging forces you to log every byte change even for simple operations, creating massive logs—updating one field in a 8KB page logs 8KB of data. It also makes logs useless after schema changes since byte offsets become invalid. Logical logging has the opposite problem: 'UPDATE users SET balance = balance + 100 WHERE id = 42' requires re-executing queries during recovery, dealing with constraint checks, index updates, and potential non-determinism if the operation uses NOW() or RANDOM(). Physiological logging solves both by logging 'on page 57, increment slot 3 balance by 100'—compact like logical logging (just the operation), but deterministic and simple like physical logging (targets specific page). Schema can evolve as long as logical structure remains.",
    tradeoffs: {
      pros: [
        "Provides compact log sizes similar to logical logging by describing operations rather than full page images, reducing log volume by 10-100x versus physical logging",
        "Enables recovery that is nearly as simple and fast as physical logging since operations target specific pages without full query re-execution",
        "Allows schema evolution and page layout changes as long as logical page structure is preserved, unlike rigid physical logging",
        "Delivers deterministic, idempotent recovery by applying well-defined operations to specific pages, avoiding logical logging's non-determinism issues",
      ],
      cons: [
        "Requires more complex recovery logic than pure physical logging since system must interpret and apply logical operations rather than just writing bytes",
        "Still couples logs to page-level organization making them less portable than pure logical logs for replication across different database versions",
        "Needs careful operation design to ensure operations remain valid across page reorganizations, requiring stable logical addressing schemes",
        "Can be harder to debug than logical logs since operations are page-relative rather than readable SQL statements",
      ],
    },
    relatedPatterns: [
      "physical-logging",
      "logical-logging",
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
          "Assign unique log sequence numbers (LSN) to each log entry",
          "Coordinate transaction commit protocol with log flushing",
          "Ensure write-ahead logging (WAL) protocol: log written before data pages",
          "Track transaction state and active transaction table",
        ],
      },
      {
        name: "Log Buffer",
        role: "In-Memory Log Staging",
        responsibilities: [
          "Buffer log entries in memory before flushing to disk",
          "Batch multiple log entries for efficient sequential writes",
          "Maintain LSN ordering for log entries",
          "Flush to disk on transaction commit or buffer full",
        ],
      },
      {
        name: "Log Writer",
        role: "Persistent Log Storage",
        responsibilities: [
          "Write physiological log entries to disk sequentially",
          "Record page ID (physical) + operation (logical) for each change",
          "Support fast sequential appends for high throughput",
          "Maintain log integrity with checksums and sequence validation",
        ],
      },
      {
        name: "Buffer Pool Manager",
        role: "Page Cache Manager",
        responsibilities: [
          "Cache database pages in memory",
          "Track page LSN (last applied log entry)",
          "Write dirty pages to disk during checkpoint",
          "Coordinate with log writer for crash recovery",
        ],
      },
      {
        name: "Recovery Manager",
        role: "Crash Recovery Coordinator",
        responsibilities: [
          "Replay log entries after crash to restore database state",
          "Identify minimum LSN from checkpoint for replay start",
          "Apply logical operations to physical pages during redo",
          "Validate page-level consistency after recovery",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant TxnMgr as Transaction Manager
    participant LogBuf as Log Buffer
    participant LogDisk as WAL on Disk
    participant BufPool as Buffer Pool
    participant DataDisk as Data Pages on Disk

    Note over App,DataDisk: Normal Transaction Flow
    App->>TxnMgr: UPDATE balance SET amt=100 WHERE id=5
    TxnMgr->>BufPool: Request page 123
    BufPool-->>TxnMgr: Return page 123 (in memory)

    Note over TxnMgr: Generate physiological log entry:<br/>PageID=123, Operation="set slot 5 field balance to 100"

    TxnMgr->>LogBuf: Append log entry (LSN=456)
    TxnMgr->>BufPool: Apply operation to page 123 in memory
    Note over BufPool: Update page LSN to 456, mark dirty

    App->>TxnMgr: COMMIT
    TxnMgr->>LogBuf: Flush log entries to disk
    LogBuf->>LogDisk: Write WAL entries (LSN <= 456)
    LogDisk-->>TxnMgr: Flush complete
    TxnMgr-->>App: Commit acknowledged

    Note over BufPool,DataDisk: Async checkpoint (background)
    BufPool->>DataDisk: Write dirty pages (LSN <= 456)

    Note over App,DataDisk: Crash Recovery Scenario
    Note over TxnMgr: System crash, restart...
    TxnMgr->>DataDisk: Read last checkpoint LSN=300
    TxnMgr->>LogDisk: Read log entries from LSN 301

    loop For each log entry
        TxnMgr->>BufPool: Load page from log entry
        TxnMgr->>BufPool: Apply logical operation to page
        Note over BufPool: "set slot 5 balance to 100"<br/>on page 123
    end

    TxnMgr->>DataDisk: Write recovered pages
    Note over TxnMgr: Recovery complete`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Execute Update Operation",
        description:
          "Application issues UPDATE/INSERT/DELETE operation that modifies database page",
      },
      {
        step: 2,
        actor: "Transaction Manager",
        action: "Generate Physiological Log Entry",
        description:
          "Create log entry with page ID (physical) + operation descriptor (logical): 'Page 123: set slot 5 field balance to 100'",
      },
      {
        step: 3,
        actor: "Log Buffer",
        action: "Buffer Log Entry in Memory",
        description:
          "Append log entry to in-memory buffer with assigned LSN, batch multiple entries for efficient flushing",
      },
      {
        step: 4,
        actor: "Buffer Pool Manager",
        action: "Apply Operation to Page in Memory",
        description:
          "Execute logical operation on in-memory page, update page LSN to match log entry, mark page as dirty",
      },
      {
        step: 5,
        actor: "Transaction Manager",
        action: "Flush Log on Commit",
        description:
          "When transaction commits, force log buffer to disk (WAL protocol: log written before data pages)",
      },
      {
        step: 6,
        actor: "Log Writer",
        action: "Write Log to Disk Sequentially",
        description:
          "Persist log entries to WAL file with sequential writes for high throughput",
      },
      {
        step: 7,
        actor: "Buffer Pool Manager",
        action: "Asynchronous Checkpoint",
        description:
          "Background process writes dirty pages to disk, records checkpoint LSN for recovery starting point",
      },
      {
        step: 8,
        actor: "Recovery Manager",
        action: "Crash Recovery (if needed)",
        description:
          "After crash, replay log entries from last checkpoint, applying logical operations to pages to restore consistent state",
      },
    ],
    invariants: [
      "Log entries must be written to disk before corresponding data pages (write-ahead logging protocol)",
      "Each log entry contains physical page ID + logical operation within page",
      "Page LSN must match last applied log entry LSN",
      "Log sequence numbers (LSN) must be monotonically increasing",
      "Operations must be idempotent (safe to replay multiple times during recovery)",
      "Page-level locks must be held during operation application to prevent inconsistency",
      "Checkpoint LSN must be persisted to identify recovery starting point",
    ],
  },

  codeExamples: [
    {
      id: "physiological-logging-ts-basic",
      language: "typescript",
      title: "Physiological Logging with Page-Based Recovery",
      description:
        "A hybrid write-ahead logging system that combines physical page identification with logical operations, enabling compact logs and schema evolution while maintaining recovery simplicity.",
      code: `// Physiological Logging Implementation
// Demonstrates hybrid logging that targets physical pages with logical operations

type PageId = number;
type SlotId = number;
type TransactionId = number;

// Logical operations within a page context
enum OperationType {
  INCREMENT = "INCREMENT",
  SET_VALUE = "SET_VALUE",
  DELETE_SLOT = "DELETE_SLOT",
  INSERT_SLOT = "INSERT_SLOT",
}

// Log entry: physical page + logical operation
interface PhysiologicalLogEntry {
  lsn: number; // Log Sequence Number
  txnId: TransactionId;
  pageId: PageId;
  operation: {
    type: OperationType;
    slotId: SlotId;
    field?: string;
    value?: any;
    oldValue?: any; // For undo operations
  };
  timestamp: number;
}

// Page structure with logical slots
interface Page {
  pageId: PageId;
  slots: Map<SlotId, Record<string, any>>;
  lsn: number; // Last applied log sequence number
  dirty: boolean;
}

// Buffer pool manager
class BufferPool {
  private pages = new Map<PageId, Page>();
  private readonly MAX_PAGES = 10;

  getPage(pageId: PageId): Page {
    if (!this.pages.has(pageId)) {
      // Load page from "disk" (simulated)
      this.pages.set(pageId, {
        pageId,
        slots: new Map(),
        lsn: 0,
        dirty: false,
      });
    }
    return this.pages.get(pageId)!;
  }

  evictIfNeeded(): void {
    if (this.pages.size > this.MAX_PAGES) {
      // Find least recently modified clean page
      for (const [pageId, page] of this.pages.entries()) {
        if (!page.dirty) {
          this.pages.delete(pageId);
          break;
        }
      }
    }
  }

  getAllPages(): Page[] {
    return Array.from(this.pages.values());
  }
}

// Write-Ahead Log with physiological entries
class PhysiologicalLog {
  private entries: PhysiologicalLogEntry[] = [];
  private nextLSN = 1;

  append(entry: Omit<PhysiologicalLogEntry, "lsn" | "timestamp">): number {
    const lsn = this.nextLSN++;
    this.entries.push({
      ...entry,
      lsn,
      timestamp: Date.now(),
    });
    console.log(\`[LOG] LSN=\${lsn} Page=\${entry.pageId} Op=\${entry.operation.type}\`);
    return lsn;
  }

  getEntriesFromLSN(lsn: number): PhysiologicalLogEntry[] {
    return this.entries.filter((e) => e.lsn >= lsn);
  }

  getAllEntries(): PhysiologicalLogEntry[] {
    return [...this.entries];
  }

  // Checkpoint: return current LSN
  checkpoint(): number {
    const lsn = this.nextLSN - 1;
    console.log(\`[CHECKPOINT] Current LSN: \${lsn}\`);
    return lsn;
  }
}

// Main database with physiological logging
class PhysiologicalDatabase {
  private bufferPool = new BufferPool();
  private log = new PhysiologicalLog();
  private currentTxn = 1;

  // High-level operation: update balance
  updateBalance(pageId: PageId, slotId: SlotId, delta: number): void {
    const txnId = this.currentTxn++;
    const page = this.bufferPool.getPage(pageId);

    // Read current value
    const record = page.slots.get(slotId) || { balance: 0 };
    const oldBalance = record.balance || 0;
    const newBalance = oldBalance + delta;

    // Log the operation BEFORE applying it
    const lsn = this.log.append({
      txnId,
      pageId,
      operation: {
        type: OperationType.INCREMENT,
        slotId,
        field: "balance",
        value: delta,
        oldValue: oldBalance,
      },
    });

    // Apply operation to page
    record.balance = newBalance;
    page.slots.set(slotId, record);
    page.lsn = lsn;
    page.dirty = true;

    console.log(
      \`[UPDATE] Page=\${pageId} Slot=\${slotId} Balance: \${oldBalance} -> \${newBalance}\`
    );
  }

  // Set field value
  setValue(pageId: PageId, slotId: SlotId, field: string, value: any): void {
    const txnId = this.currentTxn++;
    const page = this.bufferPool.getPage(pageId);

    const record = page.slots.get(slotId) || {};
    const oldValue = record[field];

    // Log before applying
    const lsn = this.log.append({
      txnId,
      pageId,
      operation: {
        type: OperationType.SET_VALUE,
        slotId,
        field,
        value,
        oldValue,
      },
    });

    // Apply operation
    record[field] = value;
    page.slots.set(slotId, record);
    page.lsn = lsn;
    page.dirty = true;

    console.log(\`[SET] Page=\${pageId} Slot=\${slotId} \${field}=\${value}\`);
  }

  // Recovery: replay log entries from checkpoint
  recover(checkpointLSN: number = 0): void {
    console.log(\`\\n[RECOVERY] Starting from LSN \${checkpointLSN}\`);

    const entries = this.log.getEntriesFromLSN(checkpointLSN + 1);

    for (const entry of entries) {
      const page = this.bufferPool.getPage(entry.pageId);

      // Skip if page already has this LSN or newer
      if (page.lsn >= entry.lsn) {
        continue;
      }

      // Apply logical operation to physical page
      const { type, slotId, field, value } = entry.operation;
      const record = page.slots.get(slotId) || {};

      switch (type) {
        case OperationType.INCREMENT:
          record[field!] = (record[field!] || 0) + value;
          break;
        case OperationType.SET_VALUE:
          record[field!] = value;
          break;
        case OperationType.DELETE_SLOT:
          page.slots.delete(slotId);
          continue; // No record to set
        case OperationType.INSERT_SLOT:
          // Record is the value
          break;
      }

      page.slots.set(slotId, record);
      page.lsn = entry.lsn;
      console.log(\`[REPLAY] LSN=\${entry.lsn} Page=\${entry.pageId} Op=\${type}\`);
    }

    console.log("[RECOVERY] Complete\\n");
  }

  // Query current state
  getRecord(pageId: PageId, slotId: SlotId): Record<string, any> | undefined {
    const page = this.bufferPool.getPage(pageId);
    return page.slots.get(slotId);
  }

  checkpoint(): number {
    return this.log.checkpoint();
  }

  displayState(): void {
    console.log("\\n=== Database State ===");
    for (const page of this.bufferPool.getAllPages()) {
      console.log(\`Page \${page.pageId} (LSN=\${page.lsn}):\`);
      for (const [slotId, record] of page.slots.entries()) {
        console.log(\`  Slot \${slotId}:\`, record);
      }
    }
    console.log("======================\\n");
  }
}

// Demo: Demonstrate physiological logging benefits
function demo() {
  console.log("\\n🔀 Physiological Logging Demo\\n");

  const db = new PhysiologicalDatabase();

  // Simulate account operations
  console.log("--- Initial Operations ---");
  db.setValue(1, 100, "name", "Alice");
  db.setValue(1, 100, "balance", 1000);
  db.setValue(1, 101, "name", "Bob");
  db.setValue(1, 101, "balance", 500);

  // Checkpoint
  const checkpoint1 = db.checkpoint();

  // More operations
  console.log("\\n--- Transactions ---");
  db.updateBalance(1, 100, 200); // Alice +200
  db.updateBalance(1, 101, -50); // Bob -50
  db.updateBalance(1, 100, -100); // Alice -100

  db.displayState();

  // Simulate crash and recovery
  console.log("💥 SIMULATED CRASH\\n");

  const db2 = new PhysiologicalDatabase();
  db2.recover(0); // Recover from beginning

  db2.displayState();

  // Verify correctness
  const alice = db2.getRecord(1, 100);
  const bob = db2.getRecord(1, 101);

  console.log("✅ Verification:");
  console.log(\`  Alice balance: \${alice?.balance} (expected 1100)\`);
  console.log(\`  Bob balance: \${bob?.balance} (expected 450)\`);
}

demo();`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Database Storage Engine Core - Physiological logging is implemented at the lowest layer of database storage engines, directly managing the write-ahead log (WAL) that protects all transaction modifications. PostgreSQL's WAL manager sits between the transaction manager and buffer pool, intercepting every page modification to generate physiological log entries. When a transaction updates a row (UPDATE users SET balance = 100 WHERE id = 42), the query executor modifies the in-memory page containing that row, and the WAL manager generates a log entry: 'Page 57, LSN 1234: set tuple at offset 32 field balance to 100'. The log entry is written to the WAL file before the modified page is written to disk (write-ahead logging protocol). This placement enables crash recovery: after restart, the recovery manager replays WAL entries from the last checkpoint, reapplying logical operations to restore database consistency. Physiological logging's hybrid nature is critical here—pure physical logging would log entire 8KB pages (massive log size), pure logical logging would require re-executing complex SQL queries during recovery (slow, non-deterministic). Instead, physiological logging logs compact operations (50-200 bytes) targeting specific pages, achieving fast recovery with minimal log overhead.",

      "Transaction Commit Path - Physiological logging integrates tightly with the transaction commit protocol to ensure durability. When a transaction commits (COMMIT), the database must guarantee that all changes survive crashes. The commit flow: (1) Transaction modifies pages in buffer pool, generating physiological log entries buffered in memory; (2) On COMMIT, transaction manager forces log buffer to disk via fsync/fdatasync system call; (3) After log flush completes, commit acknowledged to client; (4) Modified pages written to disk asynchronously during checkpoint. The architectural constraint is write-ahead logging (WAL): log entries must reach disk BEFORE acknowledging commit, even if data pages haven't been written yet. This enables recovery after crash—replaying the log restores all committed changes. PostgreSQL's WAL writer process batches log flushes for efficiency: multiple concurrent transactions share a single fsync, amortizing disk latency across transactions (group commit optimization). Physiological logging's compact size directly impacts commit throughput—smaller log entries mean more transactions fit in each log batch, improving group commit efficiency.",

      "Checkpoint and Background Writer - Physiological logging enables asynchronous checkpointing where dirty pages are written to disk in the background while the database continues processing transactions. PostgreSQL's checkpoint process periodically flushes dirty pages from the buffer pool to disk and records the checkpoint LSN in pg_control. The checkpoint LSN defines the recovery starting point: log entries before the checkpoint are no longer needed (their changes are already on disk), while entries after must be replayed during recovery. Physiological logging's page-granular operations are crucial here—during checkpoint, the system writes modified pages to disk, and after checkpoint completes, the log can be truncated (archived/deleted) up to the checkpoint LSN. The architectural placement involves coordination between buffer pool manager (tracks dirty pages), WAL manager (assigns LSNs to log entries), and checkpoint process (writes pages with LSN >= checkpoint_LSN). PostgreSQL uses double buffering: checkpoint writes pages without blocking ongoing transactions, which continue modifying pages in buffer pool. Incremental checkpoints spread I/O load over time rather than blocking the database during full checkpoint.",

      "Replication and Standby Servers - Physiological log entries are shipped to replica servers for streaming replication, enabling high availability and read scalability. PostgreSQL's streaming replication continuously sends WAL records to standby servers, which replay them to maintain synchronized copies of the database. The architectural flow: (1) Primary server generates physiological log entries during transaction processing; (2) WAL sender process reads log entries from WAL files; (3) Standby server's WAL receiver writes entries to local WAL; (4) Standby's recovery manager replays entries to apply changes to its data pages. Physiological logging is ideal for replication because log entries are compact (efficient network transmission) yet deterministic (replicas applying same operations reach identical state). The hybrid nature enables schema evolution—if primary and standby have slightly different page layouts (e.g., due to table reorganization), logical operations still work as long as page structure is preserved. PostgreSQL's logical replication uses higher-level logical logs (decoded from physiological WAL) for cross-version replication, but physical replication relies directly on physiological WAL for efficiency.",

      "Point-in-Time Recovery (PITR) - Physiological logging enables point-in-time recovery where databases can be restored to any moment in the past by replaying log archives. The architectural components: (1) Continuous archiving: WAL files are copied to archive storage (S3, NFS) as they're filled; (2) Base backup: periodic full backup of database (pg_basebackup copies all data files); (3) Recovery: restore base backup, then replay archived WAL entries up to target timestamp. For example, to recover from accidental DELETE at 2pm, restore last night's backup and replay archived WAL entries from midnight to 1:59pm. Physiological logging's compact size makes long-term archiving feasible—Amazon RDS PostgreSQL retains 35 days of WAL archives, enabling recovery to any point in that window. The replay process uses the same recovery manager as crash recovery: apply logical operations from log entries to pages from the base backup. Physiological logging's determinism ensures replayed database matches original state at target time. Cloud database services (RDS, Cloud SQL, Azure Database) rely on physiological WAL archiving for automated backups and PITR.",
    ],
    interactsWith: [
      "periodic-checkpoint",
      "incremental-checkpoint",
      "physical-logging",
      "logical-logging",
      "write-back",
      "copy-on-write",
      "transaction-checkpoint",
      "backup-restore",
    ],
    architecturalBoundaries: [
      "Storage Engine Abstraction Layer - Physiological logging sits below SQL execution layer but above physical storage. SQL engine issues page modification requests (insert tuple, update field, delete row), which storage engine translates into physiological log entries. This boundary enables clean separation: query optimizer doesn't care about logging details, recovery manager doesn't care about SQL semantics. PostgreSQL's heap AM (access method) interface encapsulates page operations—different table storage formats (heap, columnar, index-organized) can use same physiological WAL infrastructure by implementing page-level operation logging. The abstraction boundary also enables pluggable storage engines sharing WAL infrastructure.",

      "Buffer Pool vs Persistent Storage - Physiological logging bridges in-memory and on-disk representations. Modified pages exist in buffer pool (volatile memory) until checkpoint writes them to disk (durable storage). Log entries must be written before pages (WAL protocol) to enable recovery. The architectural boundary is critical: buffer pool manager tracks page LSN (last applied log entry), WAL manager assigns LSNs to entries, checkpoint process ensures pages with LSN >= checkpoint_LSN are flushed to disk. This boundary enables write optimization—database can buffer many transactions in memory, flushing log sequentially while batching random page writes during checkpoint.",

      "Transaction vs Page Granularity - Physiological logging operates at page granularity (finer than transaction, coarser than tuple). A single transaction may generate multiple physiological log entries (one per modified page), and a single page may be modified by multiple concurrent transactions (with page-level locking). This boundary enables high concurrency—transactions lock pages (not entire tables), allowing parallel modifications to different pages. The page-level granularity also optimizes recovery: during replay, only modified pages are loaded and updated, avoiding full table scans. PostgreSQL's MVCC (multi-version concurrency control) coordinates with physiological WAL: tuple versions are logged per-page, enabling concurrent readers and writers.",

      "Not Suitable for Application-Level Transaction Logs - Physiological logging is database-internal infrastructure, not exposed to applications. Application event sourcing or audit logs require logical logging (record high-level business operations like 'OrderPlaced', not low-level page changes). The architectural boundary: applications use SQL transactions, database uses physiological WAL internally. Attempting to use physiological logs for application purposes breaks abstraction—log format is database-specific, tied to page layout, and lacks business semantics. For application-level durability, use logical replication slots, triggers writing to audit tables, or separate event sourcing systems.",
    ],
  },

  implementations: [
    {
      id: "postgresql-wal",
      name: "PostgreSQL Write-Ahead Log (WAL)",
      type: "platform",
      languages: ["c"],
      description:
        "PostgreSQL's WAL is the canonical implementation of physiological logging in production databases. Each modification to heap pages, index pages, or system catalogs generates physiological log records containing page block number (physical) and operation descriptor (logical). WAL records include operations like 'heap_insert', 'heap_update', 'btree_insert_split', encoding page-relative operations that can be replayed during recovery. PostgreSQL's WAL supports full ACID transactions, streaming replication, point-in-time recovery, and logical decoding for change data capture.",
      links: {
        docs: "https://www.postgresql.org/docs/current/wal.html",
        github:
          "https://github.com/postgres/postgres/tree/master/src/backend/access/transam",
      },
      codeSnippet: `-- PostgreSQL WAL internals (conceptual C pseudocode)

// WAL record structure (physiological logging)
typedef struct XLogRecord {
    uint32 xl_tot_len;        // Total length of record
    TransactionId xl_xid;     // Transaction ID
    XLogRecPtr xl_prev;       // LSN of previous record
    uint8 xl_info;            // Operation flags
    RmgrId xl_rmid;           // Resource manager ID (heap, btree, etc)

    // Page identification (physical)
    RelFileNode rnode;        // Relation file (table/index)
    BlockNumber blkno;        // Page block number

    // Operation data (logical)
    uint8 xl_data[FLEXIBLE_ARRAY_MEMBER];  // Operation-specific payload
} XLogRecord;

// Example: Heap page update operation
typedef struct xl_heap_update {
    OffsetNumber offnum;      // Tuple offset in page (logical slot)
    uint16 old_tuple_length;
    uint16 new_tuple_length;
    HeapTupleHeader new_tuple;  // New tuple data
} xl_heap_update;

// WAL insertion (during transaction)
void XLogInsert(RmgrId rmid, uint8 info, XLogRecData *rdata) {
    // Assign LSN (log sequence number)
    XLogRecPtr lsn = GetInsertRecPtr();

    // Build physiological log record
    XLogRecord *record = AssembleRecord(rmid, info, rdata);
    record->xl_xid = GetCurrentTransactionId();

    // Write to WAL buffer (in-memory)
    CopyToWALBuffer(record, lsn);

    // Update page LSN in buffer pool
    SetPageLSN(current_page, lsn);
}

// WAL flush on commit (durability)
void XactCommit() {
    // Force WAL buffer to disk (fsync)
    XLogFlush(GetInsertRecPtr());

    // Acknowledge commit only after WAL on disk
    ProcArrayEndTransaction(MyProc, GetCurrentTransactionId());
}

// Recovery: Replay WAL records
void StartupXLOG() {
    // Read checkpoint location
    CheckPoint *checkpoint = ReadCheckpoint();
    XLogRecPtr redo_lsn = checkpoint->redo;

    // Replay WAL from checkpoint LSN
    for (XLogRecord *record = ReadRecord(redo_lsn);
         record != NULL;
         record = ReadNextRecord()) {

        // Load page from disk if not in buffer pool
        Buffer buffer = ReadBufferPage(record->rnode, record->blkno);
        Page page = BufferGetPage(buffer);

        // Check if page needs this record (LSN comparison)
        if (PageGetLSN(page) < record->lsn) {
            // Apply physiological operation to page
            ApplyWALRecord(record, page);

            // Update page LSN after replay
            PageSetLSN(page, record->lsn);
            MarkBufferDirty(buffer);
        }

        ReleaseBuffer(buffer);
    }
}

// Key PostgreSQL WAL features:
// - Full-page writes after checkpoint (first modification logs entire page)
// - WAL archiving for PITR (point-in-time recovery)
// - Streaming replication (send WAL to standbys)
// - Logical decoding (convert physiological WAL to logical change stream)
//
// Production usage:
// - All PostgreSQL ACID transactions rely on WAL
// - Cloud RDS PostgreSQL uses WAL for backups and replication
// - Patroni/Stolon use WAL streaming for HA clusters
// - Debezium CDC reads logical changes decoded from WAL

-- Query WAL settings in PostgreSQL
SHOW wal_level;              -- replica, logical, or minimal
SHOW max_wal_size;           -- Maximum WAL size before checkpoint
SHOW wal_buffers;            -- WAL buffer size in memory
SHOW checkpoint_timeout;     -- Maximum time between checkpoints

-- Monitor WAL activity
SELECT pg_current_wal_lsn(); -- Current WAL write position
SELECT pg_wal_lsn_diff(
    pg_current_wal_lsn(),
    pg_last_wal_replay_lsn()
);  -- Replication lag in bytes`,
    },
    {
      id: "mysql-innodb-redo",
      name: "MySQL InnoDB Redo Log",
      type: "platform",
      languages: ["c", "cpp"],
      description:
        "InnoDB's redo log implements physiological logging for MySQL tables using the InnoDB storage engine. Redo log records contain page space ID and page number (physical) along with operation types like 'insert record', 'update record', 'page split' (logical within page). InnoDB uses circular redo log files with checkpoints to truncate old entries. The redo log enables crash recovery, consistent snapshots for backups, and is separate from binary log (used for replication and point-in-time recovery).",
      links: {
        docs: "https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html",
        github:
          "https://github.com/mysql/mysql-server/tree/8.0/storage/innobase/log",
      },
      codeSnippet: `-- InnoDB Redo Log structure (conceptual C++ pseudocode)

// Redo log record format (physiological)
struct mtr_log_rec_t {
    lsn_t lsn;                 // Log sequence number
    space_id_t space_id;       // Tablespace ID (physical)
    page_no_t page_no;         // Page number within tablespace (physical)
    byte type;                 // Operation type (logical)
    byte data[MAX_REC_SIZE];   // Operation-specific data (logical)
};

// Example: B-tree insert redo log
const byte MLOG_REC_INSERT = 9;
struct rec_insert_log {
    byte type = MLOG_REC_INSERT;
    ulint rec_offset;          // Record offset in page
    ulint rec_len;             // Record length
    byte rec_data[];           // Record content
};

// Write redo log during mini-transaction (mtr)
void mtr_t::log_write(const byte* log_rec, size_t len) {
    // Get current LSN from log system
    lsn_t lsn = log_sys->get_lsn();

    // Write to redo log buffer
    log_buffer_write(log_rec, len, lsn);

    // Update page LSN in buffer pool
    buf_page_set_lsn(current_page, lsn);

    // Mark buffer pool page as dirty
    buf_page_set_dirty(current_page);
}

// Commit and flush redo log
void trx_commit_complete_for_mysql(trx_t *trx) {
    // Flush redo log to disk (fsync)
    lsn_t commit_lsn = trx->commit_lsn;
    log_write_up_to(commit_lsn, true);  // true = wait for flush

    // Acknowledge commit after log durable
    trx_release_locks(trx);
}

// Crash recovery: Replay redo log
void recv_recovery_from_checkpoint_start() {
    // Read checkpoint LSN from log header
    lsn_t checkpoint_lsn = log_sys->last_checkpoint_lsn;

    // Scan redo log from checkpoint
    lsn_t scan_lsn = checkpoint_lsn;

    while (scan_lsn < log_sys->current_lsn) {
        // Read redo log record
        mtr_log_rec_t *log_rec = log_read_record(scan_lsn);

        // Apply to page if needed
        buf_page_t *page = buf_page_get(
            log_rec->space_id,
            log_rec->page_no
        );

        if (page->newest_modification < log_rec->lsn) {
            // Apply physiological operation
            recv_parse_or_apply_log_rec(
                log_rec->type,
                log_rec->data,
                page
            );

            page->newest_modification = log_rec->lsn;
        }

        scan_lsn += log_rec->length;
    }
}

-- InnoDB configuration (my.cnf)
[mysqld]
innodb_log_file_size = 1G           # Redo log file size
innodb_log_files_in_group = 2       # Number of redo log files (circular)
innodb_flush_log_at_trx_commit = 1  # 1=fsync on commit (durable)
innodb_log_buffer_size = 16M        # Redo log buffer in memory

-- Monitor InnoDB redo log
SHOW ENGINE INNODB STATUS;

-- Output includes:
-- LOG
-- ---
-- Log sequence number          123456789  -- Current LSN
-- Log buffer assigned up to    123456789  -- Buffered LSN
-- Log buffer completed up to   123456789  -- Flushed LSN
-- Log written up to            123456789  -- Written to log file
-- Log flushed up to            123456789  -- Fsynced LSN
-- Last checkpoint at           123456000  -- Checkpoint LSN

-- InnoDB optimizations:
-- - Group commit: Batch multiple transaction commits into single fsync
-- - Adaptive flushing: Dynamically adjust checkpoint frequency
-- - Parallel redo log application during recovery (MySQL 8.0+)
-- - Dedicated redo log archiving for backups (MySQL 8.0+)`,
    },
    {
      id: "sqlite-wal",
      name: "SQLite WAL Mode",
      type: "platform",
      languages: ["c"],
      description:
        "SQLite's write-ahead logging mode (enabled with PRAGMA journal_mode=WAL) implements physiological logging for the embedded database. WAL mode records page numbers (physical) and page modifications (logical) in a separate -wal file alongside the main database file. This enables concurrent readers and writers (readers see consistent snapshots, writers append to WAL), improved performance (sequential log writes vs random page updates), and crash recovery. SQLite's WAL is simpler than PostgreSQL/InnoDB but follows the same physiological principles.",
      links: {
        docs: "https://www.sqlite.org/wal.html",
        github: "https://github.com/sqlite/sqlite/blob/master/src/wal.c",
      },
      codeSnippet: `-- SQLite WAL mode (conceptual C pseudocode)

// WAL frame header (physiological log entry)
struct WalFrameHdr {
    u32 page_number;       // Database page number (physical)
    u32 db_size;           // Database size after this frame
    u32 salt1;             // Random nonce for validation
    u32 salt2;
    u32 checksum1;         // Cumulative checksum
    u32 checksum2;
};

// WAL frame = header + page data
struct WalFrame {
    WalFrameHdr header;
    u8 page_data[PAGE_SIZE];  // Full page content (4KB typical)
};

// Write page modification to WAL
int walWriteFrame(Wal *pWal, u32 page_num, u8 *page_data) {
    WalFrame frame;

    // Build frame header
    frame.header.page_number = page_num;  // Physical page ID
    frame.header.db_size = pWal->db_size;
    frame.header.salt1 = pWal->salt1;
    frame.header.salt2 = pWal->salt2;

    // Copy page data (logical modification)
    memcpy(frame.page_data, page_data, PAGE_SIZE);

    // Compute checksum
    walChecksumBytes(&frame, sizeof(frame),
                     &frame.header.checksum1,
                     &frame.header.checksum2);

    // Append frame to WAL file
    walWriteToLog(pWal, &frame, sizeof(frame));

    return SQLITE_OK;
}

// Checkpoint: Merge WAL into main database
int walCheckpoint(Wal *pWal) {
    // Read all WAL frames
    WalFrame frame;
    while (walReadFrame(pWal, &frame)) {
        // Write page to main database file
        dbWritePage(pWal->db,
                    frame.header.page_number,
                    frame.page_data);
    }

    // Truncate WAL after successful checkpoint
    walTruncate(pWal);

    return SQLITE_OK;
}

// Recovery: Replay WAL after crash
int walRecover(Wal *pWal) {
    WalFrame frame;
    u32 last_valid_frame = 0;

    // Scan WAL for valid frames
    while (walReadFrame(pWal, &frame)) {
        // Verify checksum
        if (walValidateChecksum(&frame)) {
            // Apply frame to in-memory page cache
            pcacheUpdate(frame.header.page_number,
                        frame.page_data);
            last_valid_frame++;
        } else {
            break;  // Stop at first corruption
        }
    }

    // Database now consistent up to last valid frame
    return SQLITE_OK;
}

-- Enable SQLite WAL mode
PRAGMA journal_mode=WAL;

-- WAL mode benefits:
-- - Readers don't block writers (MVCC-like concurrency)
-- - Writers don't block readers (readers see snapshots)
-- - Faster commits (sequential WAL append vs random DB writes)
-- - Reduced I/O (WAL batches multiple transactions)

-- WAL configuration
PRAGMA wal_autocheckpoint=1000;  -- Checkpoint after N pages in WAL
PRAGMA wal_checkpoint(TRUNCATE); -- Manually checkpoint and truncate WAL

-- Monitor WAL status
PRAGMA wal_checkpoint;           -- Returns (busy, log_pages, checkpointed_pages)

-- SQLite WAL limitations:
-- - No fine-grained operations (logs full pages, not sub-page changes)
-- - Network file systems not supported (relies on file locking)
-- - Single writer at a time (writer lock required)
-- - WAL file can grow large before checkpoint

-- SQLite WAL is used by:
-- - Mobile apps (iOS/Android SQLite databases)
-- - Embedded systems (IoT devices, automotive)
-- - Desktop applications (browsers, email clients)
-- - Edge computing (local data persistence)`,
    },
    {
      id: "foundationdb-redwood",
      name: "FoundationDB Redwood Storage Engine",
      type: "platform",
      languages: ["c", "cpp"],
      description:
        "FoundationDB's Redwood storage engine uses a variant of physiological logging for its distributed MVCC B-tree. Mutations are logged as page ID + versioned operation, enabling concurrent modifications across distributed storage nodes. Redwood's logging supports both physical (page-level) and logical (key-value operation) aspects, balancing compactness with deterministic recovery in a distributed setting.",
      links: {
        docs: "https://apple.github.io/foundationdb/",
        github:
          "https://github.com/apple/foundationdb/tree/main/fdbserver/Redwood",
      },
      codeSnippet: `// FoundationDB Redwood storage (conceptual C++ pseudocode)

// Mutation log entry (physiological for distributed system)
struct RedwoodMutation {
    Version version;           // MVCC version number
    PageID page_id;            // B-tree page identifier (physical)

    enum OpType {
        INSERT_KEY,
        UPDATE_KEY,
        DELETE_KEY,
        PAGE_SPLIT
    } op_type;                 // Logical operation type

    KeyRef key;                // Key within page
    ValueRef value;            // Value (for insert/update)
};

// Log mutation during transaction
Future<Void> logMutation(RedwoodMutation mutation) {
    // Assign version (equivalent to LSN)
    mutation.version = getNextVersion();

    // Write to distributed log (e.g., FoundationDB log system)
    co_await logSystem->push(mutation);

    // Apply to in-memory page
    BTreePage* page = pages.get(mutation.page_id);
    applyMutation(page, mutation);

    co_return Void();
}

// Recovery: Replay mutations from log
Future<Void> recover(Version checkpoint_version) {
    // Read mutations from checkpoint version onward
    auto mutations = co_await logSystem->read(checkpoint_version);

    for (const auto& mutation : mutations) {
        // Load page if not in memory
        BTreePage* page = co_await loadPage(mutation.page_id);

        // Apply physiological operation
        if (page->version < mutation.version) {
            applyMutation(page, mutation);
            page->version = mutation.version;
        }
    }

    co_return Void();
}

// Distributed checkpoint coordination
Future<Void> checkpoint() {
    // Flush in-memory pages to distributed storage
    Version checkpoint_version = getCurrentVersion();

    for (auto& [page_id, page] : modified_pages) {
        co_await storePage(page_id, page);
    }

    // Record checkpoint version in metadata
    co_await metadata->setCheckpointVersion(checkpoint_version);

    co_return Void();
}

// FoundationDB-specific features:
// - Distributed logging across storage servers
// - MVCC versioning for time-travel queries
// - Concurrent mutations on different pages
// - Deterministic conflict resolution`,
    },
  ],

  usedInSystems: [
    {
      systemId: "postgresql-production",
      systemName: "PostgreSQL Production Deployments",
      howUsed:
        "PostgreSQL uses physiological logging (WAL - write-ahead log) as the foundation for all ACID transactions, crash recovery, replication, and point-in-time recovery in production databases serving billions of queries daily. When an application issues UPDATE users SET balance = 1000 WHERE id = 42, PostgreSQL's heap access method modifies the tuple in memory and generates a physiological WAL record: 'Page 573, Offset 12: update tuple, new balance=1000'. This record is compact (50-200 bytes vs 8KB full page) yet sufficient to reconstruct the exact page state during recovery. The WAL is written to disk before transaction commit (write-ahead logging protocol), ensuring durability. Companies like Instagram, Uber, and Reddit rely on PostgreSQL WAL for: (1) Crash recovery - After power failure, replay WAL from last checkpoint to restore committed transactions; (2) Streaming replication - Ship WAL records to standby servers for HA and read scalability; (3) Point-in-time recovery - Replay archived WAL to restore database to specific timestamp (e.g., before accidental DELETE); (4) Logical replication - Decode WAL records into logical changes (insert/update/delete) for heterogeneous replication or CDC. PostgreSQL's physiological WAL achieves optimal balance: 10-50x smaller than physical logs (entire pages), 100x faster recovery than logical logs (re-executing SQL), and supports schema changes (table reorganization doesn't invalidate WAL as long as page structure preserved). Cloud providers (AWS RDS, GCP Cloud SQL, Azure PostgreSQL) use WAL streaming for automated backups, multi-AZ replication, and read replicas. Pattern composition: Physiological Logging + Periodic Checkpoint + Group Commit + Streaming Replication + WAL Archiving. Impact: Enables PostgreSQL to achieve 99.99% uptime with <5 second crash recovery for databases up to 10TB; supports read replicas with <1 second lag; provides 35-day point-in-time recovery window in managed services.",
      source:
        "https://www.postgresql.org/docs/current/wal-intro.html (PostgreSQL WAL documentation)",
    },
    {
      systemId: "mysql-innodb-scale",
      systemName: "MySQL InnoDB at Scale",
      howUsed:
        "MySQL InnoDB storage engine uses physiological logging (redo log) to handle millions of transactions per second across systems like Facebook, Twitter, and Alibaba. InnoDB's redo log records page space ID + page number (physical) and operation type like 'insert B-tree record at offset 145' (logical), achieving compact logs with fast recovery. During INSERT INTO orders VALUES (12345, 'shipped', 99.99), InnoDB generates multiple physiological redo records: one for B-tree index page insertion, one for heap page tuple insertion, and one for secondary index update. Each record is ~100 bytes, enabling high-throughput logging. InnoDB implements circular redo log files (e.g., two 1GB files) with periodic checkpoints to reclaim space. The checkpoint LSN marks the point where all dirty pages with older LSNs have been flushed to disk, allowing older redo log to be overwritten. Facebook's MySQL deployment uses InnoDB redo logs for: (1) High-concurrency OLTP - Buffer many transactions in memory, flush redo log sequentially (group commit optimization batches 100s of commits into single fsync); (2) Crash recovery - Replay redo log from last checkpoint in parallel using multiple threads (MySQL 8.0+); (3) Replication - Binary log (separate from redo log) captures logical changes for replication, while redo log ensures local durability; (4) Backup - InnoDB redo log archiving (MySQL 8.0) enables incremental backups by capturing redo log changes between full backups. Alibaba's MySQL implementation processes 500M+ transactions/day using physiological redo logging with adaptive flushing (dynamically adjust checkpoint frequency based on log generation rate). Pattern composition: Physiological Logging + Group Commit + Adaptive Checkpointing + Parallel Redo + Incremental Backup. Impact: Enables InnoDB to sustain 10,000+ write transactions/sec with <1ms commit latency; reduces crash recovery time from hours to minutes for multi-TB databases; supports continuous data protection with sub-second RPO via redo log archiving.",
      source:
        "https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html (InnoDB Redo Log)",
    },
    {
      systemId: "aws-aurora-storage",
      systemName: "Amazon Aurora Distributed Storage",
      howUsed:
        "Amazon Aurora uses a highly optimized variant of physiological logging to achieve 5x throughput of standard MySQL/PostgreSQL while maintaining full compatibility. Aurora's architecture separates compute (database instances) from storage (distributed log-structured storage), with physiological log records as the primary write interface. When Aurora processes UPDATE query, it generates physiological redo records ('Page 42: update slot 7 field amount to 500') and sends them to the storage layer across six replicas in three availability zones. The storage layer applies these compact log records (100-200 bytes) to build pages on-demand, avoiding the need to ship full 16KB pages over the network. Aurora's innovations on physiological logging: (1) Network-optimized - Only redo logs sent to storage (not data pages), reducing network I/O by 90% compared to traditional replication; (2) Continuous backup - Storage layer continuously backs up redo log to S3, enabling point-in-time recovery with no performance impact on production database; (3) Fast cloning - Create database clones by copying metadata pointers, sharing redo log segments (copy-on-write at log level); (4) Fast failover - Standby replicas share same storage (apply same redo logs), enabling <30s failover vs minutes for traditional replication. Aurora's physiological logging achieves 100,000+ write operations/sec on db.r5.24xlarge instances, with single-digit millisecond commit latency even during peak load. The distributed storage applies redo logs in parallel across storage nodes, building pages on-demand when read requests arrive (lazy materialization). Aurora also implements log-structured merge for older data, compacting historical redo logs into base pages stored in S3 Glacier for cost efficiency. Pattern composition: Physiological Logging + Distributed Storage + Quorum Writes + Lazy Materialization + Log-Structured Merge. Impact: Reduces network traffic by 90% vs traditional database replication; enables 35-day automated backups with zero performance overhead; supports database clones created in seconds regardless of size; achieves 99.99% availability with multi-AZ redo log replication.",
      source:
        "https://aws.amazon.com/blogs/database/amazon-aurora-under-the-hood-quorum-and-correlated-failure/ (Aurora architecture)",
    },
    {
      systemId: "cockroachdb-raft-log",
      systemName: "CockroachDB Distributed Raft Log",
      howUsed:
        "CockroachDB uses physiological logging within its Raft-replicated storage engine to achieve distributed SQL with strong consistency. CockroachDB's architecture divides data into ranges (~64MB by default), with each range replicated across 3+ nodes using Raft consensus. Within each range, a RocksDB-based storage engine uses physiological logging to record modifications. When a SQL transaction modifies data (UPDATE accounts SET balance = 1000 WHERE id = 42), CockroachDB generates a physiological log entry for the RocksDB page: 'SSTable page 234: update key accounts/42, value 1000'. This log entry is wrapped in a Raft log entry and replicated to follower nodes via Raft replication. Followers apply the physiological operations to their local RocksDB instances, achieving identical page states across replicas. CockroachDB's use of physiological logging enables: (1) Consistent replication - Followers apply deterministic page operations, ensuring byte-identical replicas without re-executing SQL queries; (2) Fast recovery - Failed nodes replay physiological Raft log to catch up, applying compact operations (not full pages) to minimize network transfer; (3) Split and merge - Range splits copy metadata and share underlying physiological log entries (copy-on-write), avoiding expensive data duplication; (4) Time-travel queries - MVCC timestamps in physiological log enable AS OF SYSTEM TIME queries reading historical snapshots. CockroachDB's implementation differs from traditional databases: physiological logs are embedded within Raft logs (consensus layer), logs are distributed across nodes (no single WAL file), and compaction merges old physiological entries into SSTable base files. Pattern composition: Physiological Logging + Raft Consensus + Log-Structured Merge Trees + MVCC + Range Partitioning. Impact: Enables strongly consistent replication across geographically distributed nodes; reduces replication bandwidth by 50-100x vs shipping full pages; supports horizontal scaling to 100s of nodes while maintaining ACID guarantees; achieves <100ms cross-region replication latency.",
      source:
        "https://www.cockroachlabs.com/docs/stable/architecture/storage-layer.html (CockroachDB storage layer)",
    },
    {
      systemId: "yugabyte-docdb",
      systemName: "YugabyteDB DocDB Storage",
      howUsed:
        "YugabyteDB's DocDB storage engine uses physiological logging to provide PostgreSQL-compatible distributed SQL with automatic sharding and replication. DocDB stores data in distributed tablets (similar to CockroachDB ranges), each backed by RocksDB with Raft replication. When applications execute INSERT INTO products VALUES (123, 'Laptop', 999.99), YugabyteDB generates physiological redo entries for RocksDB LSM tree operations: 'MemTable append: key products/123, value {name: Laptop, price: 999.99}'. These entries are logged to Raft WAL and replicated to follower tablets. YugabyteDB's physiological logging optimizations: (1) Hybrid logical clocks (HLC) - Redo entries tagged with HLC timestamps for MVCC snapshot isolation across distributed nodes; (2) Intent records - Pending transactions write provisional physiological entries (intents), committed during 2PC protocol; (3) Compaction feedback - RocksDB compaction generates new physiological entries when merging SSTables, ensuring replicas remain synchronized; (4) Cross-region replication - Physiological logs replicated to remote datacenters for geo-distribution. YugabyteDB's approach handles distributed transactions: when a transaction spans multiple tablets, each tablet's Raft group logs physiological entries locally, with transaction coordinator managing 2PC across groups. The compact physiological format (100-500 bytes per operation) enables efficient cross-region replication—YugabyteDB achieves <200ms commit latency for 3-datacenter deployments across AWS regions. Pattern composition: Physiological Logging + Raft Consensus + Hybrid Logical Clocks + 2PC + LSM Tree Compaction. Impact: Supports 10,000+ transactions/sec per node with automatic replication; enables multi-region deployments with tunable consistency (strong vs eventual); provides PostgreSQL wire compatibility while maintaining distributed ACID; reduces cross-region replication traffic by 75% vs page-level replication.",
      source:
        "https://docs.yugabyte.com/preview/architecture/docdb/ (YugabyteDB DocDB architecture)",
    },
  ],

  philosophy: {
    coreProblem:
      "Pure physical logging creates massive logs (entire pages for small changes) and tight coupling to page layouts, while pure logical logging requires complex recovery logic and is vulnerable to non-determinism. Physical logging forces logging 8KB pages even for single field updates (1000x overhead), and schema changes invalidate logs. Logical logging requires re-executing queries during recovery with complex constraint checking, index updates, and non-deterministic functions (NOW(), RANDOM()) causing recovery failures",
    designPrinciple:
      "Combine physical page identification with logical operation descriptions to achieve compact logs (like logical) with simple, deterministic recovery (like physical). Log 'Page 123: set slot 5 balance to 100' instead of full page image or complex SQL re-execution. This hybrid approach allows page layout changes (fields can move within pages) as long as logical structure is preserved, providing an optimal middle ground for modern database workloads",
    historicalContext:
      "Physiological logging emerged from research in the 1980s as database researchers sought to overcome limitations of pure physical and logical logging. IBM's System R (1970s) used physical logging (before-images and after-images of full pages), resulting in massive log files—a 100-byte row update logged 8KB of page data. IMS and early COBOL systems used logical logging (record transaction SQL commands), but recovery was complex and non-deterministic. The breakthrough came with ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) developed by C. Mohan, Don Haderle, and Bruce Lindsay at IBM Research in the mid-1980s. ARIES introduced physiological logging as the foundation for modern database recovery: log page ID + logical operation within page + before/after values for undo/redo. This enabled compact logs, fast recovery, and support for concurrency control (page-level locking) without sacrificing correctness. PostgreSQL adopted ARIES-style physiological WAL in the 1990s, establishing it as the standard for open-source databases. MySQL's InnoDB (developed by Innobase Oy in the 1990s, acquired by Oracle 2005) independently arrived at similar physiological logging design. The pattern became dominant in the 2000s as databases grew to terabytes: pure physical logging couldn't scale (log files too large), pure logical logging couldn't recover quickly (too slow to replay operations). Cloud-native databases (Aurora 2014, CockroachDB 2015, YugabyteDB 2017) extended physiological logging to distributed systems, shipping compact log entries across networks instead of full pages. Modern systems recognize physiological logging as the optimal tradeoff: Aurora achieves 5x throughput by shipping redo logs instead of pages; PostgreSQL enables sub-second replication lag with compact WAL streaming; InnoDB sustains 10K+ TPS with small redo logs. The pattern's evolution reflects a fundamental database principle: the right abstraction level matters—page-granular operations hit the sweet spot between too coarse (full pages) and too fine (tuple-level logical operations)",
    alternativesRejected: [
      "Pure Physical Logging - Log entire page images (8KB) for every modification, even single field updates. Results in massive log files (1000x overhead for small changes), high I/O costs (writing 8KB vs 100 bytes), and tight coupling to page layouts (schema changes invalidate logs). Only used for special cases like PostgreSQL's full_page_writes after checkpoint (first modification to page logs full image to handle torn pages).",
      "Pure Logical Logging - Log high-level SQL operations (UPDATE users SET balance = balance + 100 WHERE id = 42) and replay during recovery. Requires re-executing complex queries during recovery (slow), handling non-deterministic functions (NOW(), RANDOM() produce different values on replay), re-checking constraints (foreign keys, uniqueness), and updating indexes (B-tree operations not logged). Recovery can fail or produce different state than original execution.",
      "Shadow Paging - Copy-on-write entire database pages, maintaining shadow pages until commit. Avoids logging altogether but causes random writes (destroys sequential I/O), makes in-place updates expensive (copy entire 8KB page for 4-byte change), and complicates concurrency (difficult to share pages across transactions). Used in early SQLite but abandoned for WAL mode.",
      "Value Logging (MVCC Tuple Versioning) - Store multiple versions of each tuple without separate log. Used in some MVCC systems but requires complex garbage collection (old versions accumulate), doesn't support efficient crash recovery (must scan entire database), and lacks point-in-time recovery capability.",
      "Operation Logging with Replay - Log application-level operations (transferMoney(from, to, amount)) and replay during recovery. Breaks storage engine abstraction (storage layer knows business logic), requires idempotent operations (hard to guarantee), and fails when operation code changes (versioning nightmare).",
    ],
    mentalModel:
      "Physiological logging is like giving driving directions using both street addresses (physical) and landmark names (logical). Pure physical directions: 'Turn left at GPS coordinate 37.7749° N, 122.4194° W' (precise but meaningless if street layout changes). Pure logical directions: 'Go to the coffee shop where Sarah works' (semantic but requires re-executing entire route search algorithm). Physiological directions: 'Turn left at 123 Main Street (the coffee shop)' (uses street number to locate physical place, but describes logical action within that location). If the coffee shop moves to a different building on Main Street, the logical operation (turn at coffee shop) still works. Similarly, physiological logging uses page IDs (physical addresses) to locate data, then describes logical operations ('set slot 5 balance to 100') that work even if tuple layout within the page changes. This hybrid approach combines the best of both: compact, deterministic, and resilient to schema evolution.",
  },

  visualization: {
    staticDiagram: `graph TB
    Transaction[Transaction: UPDATE balance] --> TxnMgr[Transaction Manager]

    TxnMgr --> PhysioLog{Generate Physiological Log}
    PhysioLog --> PageID[Physical: Page ID 123]
    PhysioLog --> LogicalOp[Logical: set slot 5 balance=100]

    PageID --> LogEntry[Log Entry: Page 123, Slot 5, Balance=100]
    LogicalOp --> LogEntry

    LogEntry --> LogBuffer[WAL Buffer in Memory]
    LogBuffer --> LogDisk[WAL on Disk - fsync]

    TxnMgr --> BufPool[Buffer Pool]
    BufPool --> ApplyOp[Apply operation to in-memory page]
    ApplyOp --> DirtyPage[Mark page dirty, LSN=456]

    LogDisk --> Commit[Transaction Commit Acknowledged]

    DirtyPage --> Checkpoint{Checkpoint Process}
    Checkpoint --> FlushPages[Write dirty pages to disk]

    style PhysioLog fill:#e1f5ff
    style PageID fill:#ffe1e1
    style LogicalOp fill:#e1ffe1
    style LogEntry fill:#fff4e1
    style Commit fill:#90ee90`,
    realWorldAnalogy:
      "Physiological logging is like a restaurant kitchen's order tracking system. Pure physical logging: Take a photo of the entire kitchen state after every order (massive storage—thousands of photos per day). Pure logical logging: Write instructions like 'make the chef's special salmon dish using recipe book page 42' (requires finding recipe, checking ingredients, re-executing steps—slow and error-prone during recovery). Physiological logging: Write 'Station 3 (grill station): cook salmon to medium-rare, add lemon sauce'. This identifies the physical location (Station 3 = Page ID) but describes the logical operation (cook salmon = set field value). If the kitchen reorganizes and moves the grill to Station 5, the logical operation still makes sense—you just need to know which station has the grill. During recovery (kitchen reopens after power outage), replaying these compact orders is much faster than reconstructing from photos or re-executing complex recipes.",
    useCases: [
      {
        domain: "OLTP Database Systems",
        scenario:
          "E-commerce platform processes 10,000 order transactions per second. Each order updates inventory, creates order record, and updates customer balance. Physiological WAL logs 'Page 573, Slot 12: decrement inventory by 5' instead of logging entire 8KB page or complex SQL. Enables fast commits (<1ms) and crash recovery (<5 seconds).",
        patternRole:
          "Provides optimal balance of compact logs (50-200 bytes per operation) with fast deterministic recovery, supporting high-throughput OLTP workloads",
        companies: ["PostgreSQL", "MySQL InnoDB", "Oracle Database"],
      },
      {
        domain: "Cloud Database Services",
        scenario:
          "AWS Aurora replicates database across 6 storage nodes in 3 availability zones. Sends only physiological redo log entries (100-200 bytes) over network instead of full 16KB pages, reducing network traffic by 90% and enabling 100,000+ writes/sec with single-digit millisecond latency.",
        patternRole:
          "Optimizes distributed replication by minimizing data transfer while maintaining deterministic consistency across replicas",
        companies: ["AWS Aurora", "Google Cloud Spanner", "Azure Cosmos DB"],
      },
      {
        domain: "Streaming Replication",
        scenario:
          "PostgreSQL primary server streams WAL records to standby replicas for read scaling and high availability. Standby applies compact physiological operations ('Page 42: insert tuple at offset 10') achieving <1 second replication lag for multi-TB databases.",
        patternRole:
          "Enables efficient streaming replication with low network overhead and fast standby catch-up after network partitions",
        companies: [
          "PostgreSQL",
          "Patroni HA clusters",
          "Citus distributed PostgreSQL",
        ],
      },
      {
        domain: "Point-in-Time Recovery",
        scenario:
          "Financial database archives WAL files to S3 for compliance. After accidental DELETE at 2pm, restore last night's backup and replay archived WAL entries to 1:59pm. Compact physiological logs enable storing 90 days of WAL archives (vs 10 days for full page logs).",
        patternRole:
          "Provides long-term archiving for point-in-time recovery with acceptable storage costs due to compact log size",
        companies: [
          "AWS RDS",
          "Google Cloud SQL",
          "Azure Database for PostgreSQL",
        ],
      },
      {
        domain: "Distributed SQL Databases",
        scenario:
          "CockroachDB replicates data across nodes using Raft consensus. Each Raft log entry contains physiological RocksDB operations ('SSTable page 234: update key accounts/42'). Followers apply deterministic operations to local storage, ensuring byte-identical replicas.",
        patternRole:
          "Enables deterministic state machine replication in distributed consensus systems, ensuring replicas converge to identical state",
        companies: ["CockroachDB", "YugabyteDB", "TiDB"],
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
        "C. Mohan, Don Haderle, Bruce Lindsay, Hamid Pirahesh, Peter Schwarz (IBM Research)",
    },
    {
      title: "PostgreSQL Write-Ahead Logging (WAL) Documentation",
      url: "https://www.postgresql.org/docs/current/wal.html",
      type: "documentation",
      author: "PostgreSQL Global Development Group",
    },
    {
      title: "MySQL InnoDB Redo Log Architecture",
      url: "https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html",
      type: "documentation",
      author: "Oracle MySQL Documentation Team",
    },
    {
      title:
        "Amazon Aurora: Design Considerations for High Throughput Cloud-Native Relational Databases",
      url: "https://dl.acm.org/doi/10.1145/3035918.3056101",
      type: "research-paper",
      author: "Alexandre Verbitski et al. (Amazon Web Services)",
    },
    {
      title: "SQLite Write-Ahead Logging",
      url: "https://www.sqlite.org/wal.html",
      type: "documentation",
      author: "SQLite Development Team",
    },
    {
      title:
        "Designing Data-Intensive Applications - Chapter 3: Storage and Retrieval",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title:
        "Database Internals: A Deep Dive into How Distributed Data Systems Work",
      url: "https://www.databass.dev/",
      type: "book",
      author: "Alex Petrov",
    },
  ],

  tags: [
    "reliability",
    "recovery",
    "wal",
    "logging",
    "crash-recovery",
    "database",
    "acid",
    "durability",
    "checkpoint",
    "replication",
  ],
  difficulty: "advanced",
};
