import type { Pattern } from "../schema";

export const logicalLogging: Pattern = {
  id: "logical-logging",
  slug: "logical-logging",
  corpusPath:
    "🛡️ RELIABILITY → 🔄 Recovery → 📜 Write-Ahead Logging → 🔣 Logical Logging",

  hierarchy: {
    quality: "reliability",
    strategy: "Recovery",
    family: "Write-Ahead Logging",
    level: 4,
  },

  concept: {
    name: "Logical Logging",
    emoji: "🔣",
    tagline: "Operation-level changes",
    definition:
      "Logical Logging records high-level operations in the write-ahead log rather than low-level page modifications, enabling compact logs, database schema evolution, and cross-version replication. Think of it like a recipe that says 'add 2 eggs' instead of documenting every molecular change to the batter—you capture the intent, not the physical details. In databases, a logical log entry for 'UPDATE users SET age=30 WHERE id=123' contains the SQL operation or equivalent high-level description, not the byte-level changes to B-tree pages, indexes, and metadata that result from executing the update. Physical logging would record '50 bytes changed at page 789 offset 234' for every affected page. Logical entries are much smaller (100 bytes vs 10KB+) and remain valid across schema changes. For example, adding a new index does not invalidate logical log entries, but invalidates physical page modifications.",
    problemSolved:
      "Physical logging records byte-level page modifications that are tightly coupled to database internal structure, making logs fragile and verbose. A single row update might modify 5 pages (data page, 3 index pages, metadata page), generating 20KB+ of physical log entries. Physical logs break when database structure changes (adding indexes, changing page size), making point-in-time recovery and replication across versions difficult. Physical entries are also incomprehensible for debugging or auditing. Logical Logging solves this by recording semantic operations that are compact, human-readable, and resilient to schema evolution. A single UPDATE operation becomes one logical entry regardless of internal page modifications. This is critical for databases requiring cross-version replication, audit trails that must survive schema migrations, and systems needing compact logs for long-term archival.",
    tradeoffs: {
      pros: [
        "Compact log size (10-100x smaller) as single operation logged regardless of internal page modifications",
        "Resilient to schema changes, enabling replication between different database versions and configurations",
        "Human-readable for auditing, debugging, and compliance requirements showing actual operations",
        "Enables heterogeneous replication where different storage engines can apply same logical operations",
      ],
      cons: [
        "Recovery is slower as logical operations must be re-executed rather than directly replaying page changes",
        "Non-deterministic operations (NOW(), RAND()) require special handling to ensure identical replay",
        "More complex implementation requiring careful handling of dependencies and operation ordering",
        "Cannot support certain recovery techniques like page-level incremental backups that rely on physical logs",
      ],
    },
    relatedPatterns: [
      "write-ahead-log",
      "physical-logging",
      "event-sourcing",
      "change-data-capture",
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
      id: "logical-logging-ts-basic",
      language: "typescript",
      title: "Logical Logging with High-Level Operations",
      description:
        "A write-ahead logging system that records semantic operations instead of physical changes, enabling compact logs, human-readable audit trails, and cross-version replication.",
      code: `// Logical Logging Implementation
// Records high-level operations rather than low-level page modifications

type UserId = number;
type TransactionId = number;

// High-level logical operations
enum LogicalOperationType {
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  TRANSFER = "TRANSFER",
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
}

// Logical log entry: operation intent, not physical details
interface LogicalLogEntry {
  lsn: number; // Log Sequence Number
  txnId: TransactionId;
  timestamp: number;
  operation: {
    type: LogicalOperationType;
    params: Record<string, any>;
  };
}

// Database record
interface UserRecord {
  id: UserId;
  name: string;
  balance: number;
  email?: string;
  version: number; // For optimistic locking
}

// Write-Ahead Log storing logical operations
class LogicalLog {
  private entries: LogicalLogEntry[] = [];
  private nextLSN = 1;

  append(
    txnId: TransactionId,
    operation: { type: LogicalOperationType; params: Record<string, any> }
  ): number {
    const lsn = this.nextLSN++;
    const entry: LogicalLogEntry = {
      lsn,
      txnId,
      timestamp: Date.now(),
      operation,
    };
    this.entries.push(entry);

    // Human-readable log output
    console.log(
      \`[LOG] LSN=\${lsn} TXN=\${txnId} Op=\${operation.type}\`,
      JSON.stringify(operation.params)
    );
    return lsn;
  }

  getEntriesFromLSN(lsn: number): LogicalLogEntry[] {
    return this.entries.filter((e) => e.lsn >= lsn);
  }

  getAllEntries(): LogicalLogEntry[] {
    return [...this.entries];
  }

  // Export for auditing or replication
  exportAuditTrail(): string {
    return this.entries
      .map((e) => {
        const time = new Date(e.timestamp).toISOString();
        const op = e.operation;
        return \`[\${time}] TXN=\${e.txnId} \${op.type} \${JSON.stringify(op.params)}\`;
      })
      .join("\\n");
  }
}

// Database with logical logging
class LogicalDatabase {
  private users = new Map<UserId, UserRecord>();
  private log = new LogicalLog();
  private currentTxn = 1;

  // Create user - logs high-level operation
  createUser(id: UserId, name: string, initialBalance: number): void {
    const txnId = this.currentTxn++;

    // Log BEFORE applying
    this.log.append(txnId, {
      type: LogicalOperationType.USER_CREATE,
      params: { id, name, balance: initialBalance },
    });

    // Apply operation
    this.users.set(id, {
      id,
      name,
      balance: initialBalance,
      version: 1,
    });

    console.log(\`[CREATE] User \${id}: \${name} with balance \${initialBalance}\`);
  }

  // Update user - logs semantic change
  updateUser(id: UserId, updates: Partial<UserRecord>): void {
    const txnId = this.currentTxn++;
    const user = this.users.get(id);

    if (!user) {
      throw new Error(\`User \${id} not found\`);
    }

    // Log operation with just the changes
    this.log.append(txnId, {
      type: LogicalOperationType.USER_UPDATE,
      params: { id, updates },
    });

    // Apply updates
    Object.assign(user, updates);
    user.version++;

    console.log(\`[UPDATE] User \${id}:\`, updates);
  }

  // Deposit - semantic operation
  deposit(userId: UserId, amount: number): void {
    const txnId = this.currentTxn++;
    const user = this.users.get(userId);

    if (!user) {
      throw new Error(\`User \${userId} not found\`);
    }

    // Log intent, not implementation
    this.log.append(txnId, {
      type: LogicalOperationType.DEPOSIT,
      params: { userId, amount },
    });

    // Apply
    user.balance += amount;
    user.version++;

    console.log(\`[DEPOSIT] User \${userId} +\${amount}, balance=\${user.balance}\`);
  }

  // Transfer - multi-record transaction
  transfer(fromId: UserId, toId: UserId, amount: number): void {
    const txnId = this.currentTxn++;
    const fromUser = this.users.get(fromId);
    const toUser = this.users.get(toId);

    if (!fromUser || !toUser) {
      throw new Error("User not found");
    }

    if (fromUser.balance < amount) {
      throw new Error("Insufficient funds");
    }

    // Single logical log entry for entire transfer
    this.log.append(txnId, {
      type: LogicalOperationType.TRANSFER,
      params: { fromId, toId, amount },
    });

    // Apply both sides
    fromUser.balance -= amount;
    toUser.balance += amount;
    fromUser.version++;
    toUser.version++;

    console.log(\`[TRANSFER] \${fromId} -> \${toId}: \${amount}\`);
  }

  // Delete user
  deleteUser(id: UserId): void {
    const txnId = this.currentTxn++;

    // Log deletion
    this.log.append(txnId, {
      type: LogicalOperationType.USER_DELETE,
      params: { id },
    });

    this.users.delete(id);
    console.log(\`[DELETE] User \${id}\`);
  }

  // Recovery: replay logical operations
  recover(): void {
    console.log("\\n[RECOVERY] Replaying logical operations");

    // Clear current state
    this.users.clear();

    const entries = this.log.getAllEntries();

    for (const entry of entries) {
      const { type, params } = entry.operation;

      try {
        // Re-execute high-level operations
        switch (type) {
          case LogicalOperationType.USER_CREATE:
            this.users.set(params.id, {
              id: params.id,
              name: params.name,
              balance: params.balance,
              version: 1,
            });
            break;

          case LogicalOperationType.USER_UPDATE:
            const user = this.users.get(params.id);
            if (user) {
              Object.assign(user, params.updates);
              user.version++;
            }
            break;

          case LogicalOperationType.DEPOSIT:
            const depositUser = this.users.get(params.userId);
            if (depositUser) {
              depositUser.balance += params.amount;
              depositUser.version++;
            }
            break;

          case LogicalOperationType.TRANSFER:
            const fromUser = this.users.get(params.fromId);
            const toUser = this.users.get(params.toId);
            if (fromUser && toUser) {
              fromUser.balance -= params.amount;
              toUser.balance += params.amount;
              fromUser.version++;
              toUser.version++;
            }
            break;

          case LogicalOperationType.USER_DELETE:
            this.users.delete(params.id);
            break;
        }

        console.log(\`[REPLAY] LSN=\${entry.lsn} \${type}\`);
      } catch (error) {
        console.error(\`[REPLAY ERROR] LSN=\${entry.lsn}:\`, error);
      }
    }

    console.log("[RECOVERY] Complete\\n");
  }

  // Query
  getUser(id: UserId): UserRecord | undefined {
    return this.users.get(id);
  }

  getAllUsers(): UserRecord[] {
    return Array.from(this.users.values());
  }

  // Export audit trail
  getAuditTrail(): string {
    return this.log.exportAuditTrail();
  }

  displayState(): void {
    console.log("\\n=== Database State ===");
    for (const user of this.users.values()) {
      console.log(
        \`User \${user.id}: \${user.name}, Balance=\${user.balance}, Version=\${user.version}\`
      );
    }
    console.log("======================\\n");
  }
}

// Demo: Show logical logging benefits
function demo() {
  console.log("\\n🔣 Logical Logging Demo\\n");

  const db = new LogicalDatabase();

  // Initial operations
  console.log("--- Setup Phase ---");
  db.createUser(1, "Alice", 1000);
  db.createUser(2, "Bob", 500);
  db.createUser(3, "Charlie", 750);

  // Transactions
  console.log("\\n--- Transaction Phase ---");
  db.deposit(1, 200);
  db.transfer(1, 2, 150);
  db.updateUser(3, { email: "charlie@example.com" });
  db.deposit(2, 50);
  db.transfer(2, 3, 100);

  db.displayState();

  // Show audit trail
  console.log("--- Audit Trail (Human-Readable) ---");
  console.log(db.getAuditTrail());
  console.log();

  // Simulate crash and recovery
  console.log("💥 SIMULATED CRASH\\n");

  const db2 = new LogicalDatabase();
  // Copy log from first database (simulating durable log)
  const originalLog = db["log"]["entries"];
  db2["log"]["entries"] = [...originalLog];

  db2.recover();
  db2.displayState();

  // Verify correctness
  const alice = db2.getUser(1);
  const bob = db2.getUser(2);
  const charlie = db2.getUser(3);

  console.log("✅ Verification:");
  console.log(\`  Alice balance: \${alice?.balance} (expected 1050)\`);
  console.log(\`  Bob balance: \${bob?.balance} (expected 500)\`);
  console.log(\`  Charlie balance: \${charlie?.balance} (expected 850)\`);
  console.log(\`  Charlie email: \${charlie?.email}\`);

  // Demonstrate schema evolution benefit
  console.log("\\n--- Schema Evolution Demo ---");
  console.log("Adding new field 'email' doesn't break recovery!");
  console.log(
    "Old log entries without 'email' still replay correctly alongside new ones."
  );
}

demo();`,
    },
  ],
};
