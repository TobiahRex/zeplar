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
};
