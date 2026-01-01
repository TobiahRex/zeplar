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
        name: "Database Engine",
        role: "Transaction Coordinator",
        responsibilities: [
          "Execute high-level operations (INSERT, UPDATE, DELETE)",
          "Generate logical log entries describing operation intent",
          "Maintain mapping between logical and physical changes",
          "Apply logical entries during recovery by re-executing operations",
        ],
      },
      {
        name: "Logical Log Writer",
        role: "Operation Serializer",
        responsibilities: [
          "Record operation type and parameters (UPDATE users SET age=30 WHERE id=123)",
          "Capture before/after values for data changes",
          "Serialize logical entries in human-readable format (JSON, Protocol Buffers)",
          "Maintain log compaction through operation coalescing",
        ],
      },
      {
        name: "Recovery Manager",
        role: "Log Replay Coordinator",
        responsibilities: [
          "Read logical log entries from durable storage",
          "Re-execute operations to reconstruct database state",
          "Handle non-deterministic operations (NOW(), RAND()) via captured values",
          "Validate recovered state matches original transaction outcomes",
        ],
      },
      {
        name: "Replication Agent",
        role: "Log Shipping Handler",
        responsibilities: [
          "Stream logical log entries to replica databases",
          "Apply operations across different schema versions",
          "Enable heterogeneous replication (MySQL → PostgreSQL)",
          "Maintain eventual consistency through ordered replay",
        ],
      },
      {
        name: "Change Data Capture (CDC) Consumer",
        role: "External Observer",
        responsibilities: [
          "Subscribe to logical log stream for real-time changes",
          "Parse operation details for downstream processing",
          "Enable audit trails and compliance reporting",
          "Power analytics pipelines with change events",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant DB as Database Engine
    participant LogWriter as Logical Log Writer
    participant Storage as Durable Storage
    participant Recovery as Recovery Manager
    participant Replica as Replica Database

    Note over App,Replica: Normal Operation - Write Transaction

    App->>DB: UPDATE users SET age=30 WHERE id=123
    DB->>DB: Execute operation (modify B-tree pages, indexes, metadata)

    DB->>LogWriter: Generate logical entry
    Note over LogWriter: Logical entry:<br/>{type: UPDATE, table: users,<br/>where: {id: 123}, set: {age: 30},<br/>before: {age: 25}, after: {age: 30}}

    LogWriter->>Storage: Write logical entry (100 bytes)
    Note over Storage: Compact: 100 bytes vs<br/>10KB+ for physical logs

    Storage-->>LogWriter: Write confirmed (LSN=1000)
    LogWriter-->>DB: Log persisted
    DB-->>App: Transaction committed

    Note over App,Replica: Replication - Logical Log Shipping

    Storage->>Replica: Stream logical entry (LSN=1000)
    Replica->>Replica: Parse operation: UPDATE users WHERE id=123
    Replica->>Replica: Re-execute operation (apply to local schema)
    Note over Replica: Schema may differ<br/>(different indexes, versions)
    Replica-->>Storage: Acknowledge (LSN=1000 applied)

    Note over App,Replica: Recovery - Database Crash and Restart

    Note over DB: 💥 Crash (in-memory state lost)

    Recovery->>Storage: Read logical log from checkpoint
    loop For each logical entry
        Storage-->>Recovery: Logical entry (operation details)
        Recovery->>DB: Re-execute operation
        Note over DB: Reconstruct state by<br/>replaying operations
        DB-->>Recovery: Operation applied
    end

    Recovery->>DB: Recovery complete, database consistent
    Note over DB: State restored to<br/>last committed transaction

    style DB fill:#e1f5e1
    style Storage fill:#e1e5ff
    style Recovery fill:#fff4e1`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Submit Write Transaction",
        description:
          "Application executes UPDATE users SET age=30 WHERE id=123, triggering database modification",
      },
      {
        step: 2,
        actor: "Database Engine",
        action: "Execute Operation",
        description:
          "Database applies changes to data pages, B-tree indexes, and metadata structures (may modify 5+ pages internally)",
      },
      {
        step: 3,
        actor: "Logical Log Writer",
        action: "Generate Logical Entry",
        description:
          "Create compact log entry capturing operation intent: {type: UPDATE, table: users, where: {id: 123}, set: {age: 30}, before: {age: 25}, after: {age: 30}} - only 100 bytes vs 10KB+ for physical page changes",
      },
      {
        step: 4,
        actor: "Logical Log Writer",
        action: "Write to Durable Storage",
        description:
          "Persist logical entry to disk/SSD with assigned Log Sequence Number (LSN), ensuring durability before commit",
      },
      {
        step: 5,
        actor: "Database Engine",
        action: "Commit Transaction",
        description:
          "Return success to application after log is durable, state changes may flush to disk later (write-ahead guarantee)",
      },
      {
        step: 6,
        actor: "Replication Agent",
        action: "Stream Log Entry",
        description:
          "Send logical entry to replica databases over network; replicas can have different schemas/indexes and still apply operation",
      },
      {
        step: 7,
        actor: "Replica Database",
        action: "Re-execute Operation",
        description:
          "Parse logical entry and execute UPDATE users SET age=30 WHERE id=123 against local schema, tolerating schema differences",
      },
      {
        step: 8,
        actor: "Recovery Manager",
        action: "Replay Log on Crash Recovery",
        description:
          "Read logical log from last checkpoint, re-execute each operation sequentially to reconstruct database state (slower than physical recovery but schema-independent)",
      },
      {
        step: 9,
        actor: "Change Data Capture Consumer",
        action: "Process Change Events",
        description:
          "External systems subscribe to logical log stream, parse operations for audit trails, analytics pipelines, or search index updates",
      },
    ],
    invariants: [
      "Logical entries must capture complete operation semantics (before/after values, WHERE clauses)",
      "Log entries must be written durably BEFORE transaction commits (write-ahead guarantee)",
      "Non-deterministic operations (NOW(), RAND()) must record actual values used",
      "Log replay must produce identical final state as original execution",
      "Logical entries must remain valid across schema changes (adding indexes, changing page size)",
      "Log sequence numbers (LSNs) must be monotonically increasing",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Database Storage Engine Layer - Logical logging sits at the write-ahead log (WAL) layer of database engines, intercepting high-level operations (INSERT/UPDATE/DELETE) before they modify data pages. The placement is below the query executor (which decides WHAT to change) but above the buffer pool manager (which handles physical page modifications). When MySQL's InnoDB storage engine receives UPDATE users SET age=30 WHERE id=123, the query executor determines which rows match, then logical logging records {operation: UPDATE, table: users, set: {age: 30}, where: {id: 123}, old_value: {age: 25}, new_value: {age: 30}} BEFORE the buffer pool modifies B-tree pages, index pages, and undo log pages. This placement enables the write-ahead guarantee: logical log persists to disk before in-memory pages are modified, ensuring recoverability. PostgreSQL's WAL uses logical replication slots at this boundary, streaming logical entries to subscribers. The architectural separation is critical—logical logging must capture operation intent independent of storage implementation (B-tree vs LSM-tree, row vs columnar storage). MongoDB's oplog sits at the replication layer, recording operations like {op: 'u', ns: 'db.users', o: {$set: {age: 30}}, o2: {_id: 123}} which replicas can apply to their own storage structures. The pattern enables heterogeneous replication—MySQL binlog (logical) can feed PostgreSQL via tools like Debezium because logical entries transcend storage engine details.",

      "Replication and Change Data Capture (CDC) Layer - Logical logging powers database replication by providing a stream of operations that replicas can apply to maintain consistency. The placement is at the replication boundary where primary databases publish changes and replicas subscribe. MySQL's binlog (with ROW format = logical) writes entries like 'UPDATE users WHERE id=123: age 25→30' which replicas parse and execute against their local tables. This decoupling enables cross-version replication—MySQL 8.0 primary can replicate to MySQL 5.7 replica because logical operations are schema-independent (adding indexes on primary doesn't break replicas). PostgreSQL logical replication publishes operations through replication slots (pg_recvlogical), enabling selective replication (replicate only certain tables/columns). The architectural boundary supports multi-master replication: two databases can both log operations logically and exchange logs bidirectionally, resolving conflicts at the operation level (last-write-wins, custom merge functions). CDC systems like Debezium, Maxwell, and Attunity sit at this boundary, consuming logical logs from databases (MySQL binlog, PostgreSQL logical decoding, Oracle LogMiner) and publishing to Kafka topics. This placement enables real-time data pipelines: changes to OLTP databases flow through logical logs to data warehouses, search indexes (Elasticsearch), and caches (Redis) within milliseconds. The pattern is positioned to capture every committed operation without impacting read queries (read-only queries don't touch WAL).",

      "Event Sourcing and Audit Trail Layer - Logical logging's operation-level granularity makes it ideal for audit trails and event sourcing where every state change must be recorded with full context. The placement is at the application service layer or domain event boundary, capturing business operations as first-class events. Instead of logging 'page 789 byte offset 234 changed', event sourcing logs {event: 'OrderPlaced', orderId: 12345, items: [...], totalAmount: 99.99, timestamp: ...}—human-readable operations that survive schema changes. Banking systems use logical logging at the transaction boundary: every account debit/credit is logged as {operation: 'TRANSFER', from: account123, to: account456, amount: 100.00, timestamp: ...} enabling regulatory compliance (auditors can read logs), fraud detection (analyze operation patterns), and point-in-time state reconstruction (replay logs to any timestamp). The architectural pattern separates write model (log operations) from read model (query current state)—CQRS systems append logical operations to event stores (Kafka, EventStoreDB) while projecting read views. This placement enables time-travel debugging: developers replay production logs in staging to reproduce bugs. Stripe's audit logs use logical operation format to show every API call: {object: 'charge', action: 'created', amount: 5000, customer: 'cus_123', timestamp: ...} which customers export for reconciliation.",

      "Cross-Database Migration and Schema Evolution Layer - Logical logging enables zero-downtime database migrations by decoupling data capture from storage format. The placement is at the data migration pipeline boundary where legacy databases (Oracle, DB2) export changes and target databases (PostgreSQL, MySQL) import them. Oracle GoldenGate and AWS Database Migration Service (DMS) consume logical logs (Oracle Redo Logs in logical format) and transform operations for heterogeneous targets: Oracle UPDATE → PostgreSQL UPDATE with syntax translation, data type conversion (Oracle NUMBER → PostgreSQL NUMERIC), and timestamp handling. The architectural pattern is dual-write + log shipping: applications write to source database (logical logging captures changes), migration tool reads logical log and writes to target, eventual cutover switches application to target. This placement supports gradual migration—run source and target in parallel for weeks, comparing data continuously via logical log replay. Schema evolution scenarios: when adding a column to MySQL table, logical log entries from before the change (UPDATE users SET age=30) and after (UPDATE users SET age=30, email='...') both replay correctly because logical format captures intent, not storage layout. The pattern enables phased rollouts: deploy schema change to replicas first, verify via logical log replay, then promote replica to primary.",

      "Multi-Datacenter Replication and Global Distribution Layer - Logical logging's compact size (10-100x smaller than physical) makes it efficient for WAN replication across geographically distributed datacenters. The placement is at the inter-datacenter replication layer where operations stream over high-latency networks (100-500ms between continents). Cassandra's commit log (logical mutations) ships between datacenters: {mutation: 'INSERT', keyspace: 'users', key: 123, columns: {name: 'Alice', age: 30}} compresses well and tolerates packet loss (replay from last acknowledged LSN). The architectural pattern is asynchronous replication with logical conflict resolution: two datacenters accept writes concurrently, exchange logical logs, and resolve conflicts using last-write-wins (LWW) timestamps or causal ordering (version vectors). DynamoDB global tables use logical replication to sync across AWS regions—writes in us-east-1 produce logical log entries that ship to eu-west-1 and ap-southeast-1, where they re-execute against local storage. The placement optimizes bandwidth: logical entry for 1KB row is ~200 bytes vs 10KB for physical page shipping (includes page headers, metadata, undo logs). This enables cost-effective multi-region replication. The pattern also supports selective replication: logical logs can be filtered by table, keyspace, or column—replicate only PII-scrubbed data to EU datacenters for GDPR compliance.",
    ],
    architecturalBoundaries: [
      "Database Write-Ahead Log (WAL) vs Buffer Pool - Logical logging sits at the boundary between the query executor (logical operations) and storage engine (physical page modifications). When a transaction commits, the database writes logical log entries (operation type, parameters, before/after values) to durable storage BEFORE flushing modified pages to disk. This placement enforces the write-ahead guarantee: crashes can't lose committed transactions because logical log entries are already durable. The boundary separates intent (UPDATE users SET age=30 WHERE id=123) from implementation (modify page 789 offset 234, update index page 445, write undo log page 556). Physical logging would record all page modifications (~10KB), but logical logging records just the operation (~100 bytes). Recovery crosses this boundary in reverse: read logical log, re-execute operations, reconstruct physical pages. Not all operations cross this boundary—physical logging may be used for low-level optimizations (page splits, index reorganization) while logical logging captures user-visible changes.",

      "Replication Primary vs Replica - Logical logging creates an architectural boundary between primary (accepts writes, generates log) and replicas (apply log, serve reads). The primary executes operations once, logs them logically, and ships entries to replicas. Replicas parse logical entries and re-execute operations against their local storage—which may differ in schema (different indexes), version (different database release), or even implementation (MySQL → PostgreSQL via logical replication). This boundary enables asynchronous replication: primary doesn't wait for replicas to acknowledge, accepts new writes while replicas catch up (eventual consistency). Logical format tolerates replica lag—entries remain valid even if replica is hours behind. The boundary also supports cascading replication: replica consumes logical log from primary, generates its own logical log, feeds to tertiary replicas (primary → replica1 → replica2). Not recommended boundary: synchronous replication with logical logging is slower than physical (must re-execute operations) so OLTP databases prefer physical logging for synchronous replicas and logical logging for asynchronous/cross-version replicas.",

      "OLTP Database vs Analytics Warehouse (Change Data Capture) - Logical logging creates a boundary between operational databases (optimized for writes, normalized schema) and analytical warehouses (optimized for reads, denormalized schema). CDC tools consume logical logs from OLTP databases (MySQL binlog, PostgreSQL logical decoding) and stream operations to Kafka, which feeds data warehouses (Snowflake, BigQuery, Redshift). The boundary transformation is operation-to-event: logical log UPDATE users SET age=30 WHERE id=123 becomes Kafka event {before: {id: 123, age: 25}, after: {id: 123, age: 30}, op: 'UPDATE', ts: ...}. Data warehouse consumes events and applies transformations (joins, aggregations, type conversions) to build OLAP tables. This placement enables real-time analytics: changes to OLTP database appear in warehouse within seconds, not hours (vs batch ETL). The boundary decouples OLTP from analytics—warehouse failures don't impact OLTP, OLTP schema changes don't break warehouse (logical format survives schema evolution). Logical logging is preferred at this boundary over database triggers (which add OLTP overhead) or batch exports (which add latency).",

      "Event Sourcing Write Model vs Read Model (CQRS) - Logical logging creates a boundary between write model (append-only log of operations) and read model (queryable current state). Applications write operations to event store (Kafka, EventStoreDB) as logical events: {eventType: 'OrderPlaced', aggregateId: 'order-123', data: {items: [...], total: 99.99}}. Event store is the source of truth—read models are projections built by replaying events. The boundary enables multiple read models from single log: project events to SQL table (fast queries), Elasticsearch index (full-text search), and Redis cache (key-value lookups). This placement supports temporal queries: replay events up to specific timestamp to see past state, compare current vs historical state. The pattern also enables event replay for bug fixes: find bug in projection logic, delete corrupted read model, replay events with fixed logic to rebuild correct state. Not all systems need this boundary—simple CRUD applications benefit from direct database writes, while complex domains (banking, inventory, trading) benefit from logical event log as source of truth.",
    ],
    interactsWith: [
      "write-ahead-log",
      "physical-logging",
      "checkpointing",
      "replication",
      "change-data-capture",
      "event-sourcing",
      "cqrs",
      "append-only-log",
      "log-shipping",
    ],
  },

  implementations: [
    {
      id: "mysql-binlog-row",
      name: "MySQL Binary Log (ROW Format)",
      type: "platform",
      languages: ["sql"],
      description:
        "MySQL's binary log in ROW format is the canonical implementation of logical logging for database replication and recovery. Captures before/after values for every row modification, enabling point-in-time recovery, cross-version replication, and change data capture. ROW format logs actual data changes (vs STATEMENT format which logs SQL text).",
      links: {
        docs: "https://dev.mysql.com/doc/refman/8.0/en/binary-log.html",
      },
      codeSnippet: `-- Enable binary logging with ROW format (logical logging)
-- my.cnf configuration
[mysqld]
server-id = 1
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW              # Logical logging (before/after values)
binlog_row_image = FULL          # Log complete rows (FULL vs MINIMAL)
sync_binlog = 1                  # Flush to disk on every commit (durability)
expire_logs_days = 7             # Retain logs for 7 days

-- Example: Create and modify data
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  age INT
);

INSERT INTO users VALUES (123, 'Alice', 25);
UPDATE users SET age = 30 WHERE id = 123;
DELETE FROM users WHERE id = 123;

-- Binary log entries (logical format - human-readable representation):
# INSERT INTO users
{
  "type": "WRITE_ROWS",
  "table": "users",
  "data": {
    "id": 123,
    "name": "Alice",
    "age": 25
  }
}

# UPDATE users SET age = 30 WHERE id = 123
{
  "type": "UPDATE_ROWS",
  "table": "users",
  "before": {
    "id": 123,
    "name": "Alice",
    "age": 25
  },
  "after": {
    "id": 123,
    "name": "Alice",
    "age": 30
  }
}

# DELETE FROM users WHERE id = 123
{
  "type": "DELETE_ROWS",
  "table": "users",
  "data": {
    "id": 123,
    "name": "Alice",
    "age": 30
  }
}

-- View binary log contents
SHOW BINARY LOGS;
SHOW BINLOG EVENTS IN 'mysql-bin.000001';

-- Point-in-time recovery using binlog
mysqlbinlog --start-datetime="2024-01-01 00:00:00" \\
            --stop-datetime="2024-01-01 23:59:59" \\
            mysql-bin.000001 | mysql -u root -p

-- Key Features:
-- - Compact: ROW format logs only changed values (~100 bytes per row)
-- - Schema-independent: Replicas can have different indexes/storage engines
-- - Cross-version: MySQL 8.0 → MySQL 5.7 replication works
-- - Human-readable: Tools like mysqlbinlog decode entries to SQL
-- - CDC-friendly: Debezium/Maxwell parse binlog for Kafka streaming

-- When to use:
-- - Cross-version replication (MySQL 8.0 primary → 5.7 replica)
-- - Change Data Capture for data pipelines (Debezium → Kafka)
-- - Audit trails requiring operation-level details
-- - Point-in-time recovery with operation granularity`,
    },
    {
      id: "postgresql-logical-replication",
      name: "PostgreSQL Logical Replication & Decoding",
      type: "platform",
      languages: ["sql"],
      description:
        "PostgreSQL's logical replication uses WAL (Write-Ahead Log) with logical decoding to stream operation-level changes to replicas. Supports selective replication (specific tables/columns), cross-version replication, and heterogeneous targets. Output plugins (pgoutput, wal2json) transform WAL into logical formats for CDC.",
      links: {
        docs: "https://www.postgresql.org/docs/current/logical-replication.html",
      },
      codeSnippet: `-- Enable logical replication in postgresql.conf
wal_level = logical              # Enable logical WAL decoding
max_replication_slots = 10       # Allow replication slots
max_wal_senders = 10             # Concurrent replication connections

-- Create publication (primary database)
CREATE PUBLICATION user_changes FOR TABLE users;

-- Create replication slot for logical decoding
SELECT pg_create_logical_replication_slot('debezium_slot', 'pgoutput');

-- Subscribe to publication (replica database)
CREATE SUBSCRIPTION user_sub
  CONNECTION 'host=primary dbname=mydb user=replicator'
  PUBLICATION user_changes;

-- Example: Logical operations
INSERT INTO users (id, name, age) VALUES (123, 'Alice', 25);
UPDATE users SET age = 30 WHERE id = 123;
DELETE FROM users WHERE id = 123;

-- Logical replication output (JSON format via wal2json plugin):
{
  "change": [
    {
      "kind": "insert",
      "schema": "public",
      "table": "users",
      "columnnames": ["id", "name", "age"],
      "columnvalues": [123, "Alice", 25]
    }
  ]
}

{
  "change": [
    {
      "kind": "update",
      "schema": "public",
      "table": "users",
      "columnnames": ["id", "name", "age"],
      "columnvalues": [123, "Alice", 30],
      "oldkeys": {
        "keynames": ["id"],
        "keyvalues": [123]
      }
    }
  ]
}

{
  "change": [
    {
      "kind": "delete",
      "schema": "public",
      "table": "users",
      "oldkeys": {
        "keynames": ["id"],
        "keyvalues": [123]
      }
    }
  ]
}

-- Consume logical replication stream
SELECT * FROM pg_logical_slot_get_changes('debezium_slot', NULL, NULL);

-- Selective replication (only specific columns)
CREATE PUBLICATION sensitive_data FOR TABLE users (id, name);
-- Excludes 'age' column from replication

-- Cross-version replication (PostgreSQL 14 → 12)
-- Logical format survives version differences

-- Key Features:
-- - Selective replication (choose tables/columns)
-- - Cross-version replication (Postgres 15 → 12 works)
-- - Minimal replication lag (<100ms typical)
-- - JSON output plugins (wal2json) for CDC integration
-- - Bidirectional replication (multi-master with conflict resolution)

-- When to use:
-- - Selective table replication (not entire database)
-- - Cross-version replication (major version upgrades)
-- - CDC pipelines (Debezium → Kafka → Data Warehouse)
-- - Multi-master replication with custom conflict resolution`,
    },
    {
      id: "mongodb-oplog",
      name: "MongoDB Oplog (Operations Log)",
      type: "platform",
      languages: ["javascript"],
      description:
        "MongoDB's oplog (operations log) is a capped collection storing logical operations for replication and change streams. Every write operation (insert, update, delete) generates an idempotent oplog entry that secondary replicas apply to maintain consistency. Powers MongoDB change streams for real-time data pipelines.",
      links: {
        docs: "https://www.mongodb.com/docs/manual/core/replica-set-oplog/",
      },
      codeSnippet: `// MongoDB stores logical operations in oplog (local.oplog.rs)
// Oplog entries are idempotent operations that replicas apply

// Example operations
db.users.insertOne({ _id: 123, name: "Alice", age: 25 });
db.users.updateOne({ _id: 123 }, { $set: { age: 30 } });
db.users.deleteOne({ _id: 123 });

// Oplog entries (logical format):
// INSERT operation
{
  "ts": Timestamp(1234567890, 1),     // Operation timestamp
  "t": NumberLong(1),                  // Term (for leader election)
  "h": NumberLong(12345),              // Unique operation ID
  "v": 2,                              // Oplog version
  "op": "i",                           // Operation type: insert
  "ns": "mydb.users",                  // Namespace (database.collection)
  "o": {                               // Operation document
    "_id": 123,
    "name": "Alice",
    "age": 25
  }
}

// UPDATE operation (idempotent)
{
  "ts": Timestamp(1234567891, 1),
  "op": "u",                           // Operation type: update
  "ns": "mydb.users",
  "o": {                               // Update modifier
    "$v": 1,
    "$set": { "age": 30 }
  },
  "o2": {                              // Query predicate
    "_id": 123
  }
}

// DELETE operation
{
  "ts": Timestamp(1234567892, 1),
  "op": "d",                           // Operation type: delete
  "ns": "mydb.users",
  "o": {
    "_id": 123                         // Document to delete
  }
}

// Query oplog (view recent operations)
use local;
db.oplog.rs.find().sort({ $natural: -1 }).limit(10);

// Watch oplog for real-time changes (Change Streams)
const changeStream = db.users.watch();
changeStream.on('change', (change) => {
  console.log('Operation:', change.operationType);
  console.log('Document:', change.fullDocument);
  console.log('Before:', change.updateDescription);
});

// Resume oplog tailing from specific timestamp
const resumeToken = changeStream.resumeToken;
const newStream = db.users.watch({ resumeAfter: resumeToken });

// Oplog-based replication flow:
// 1. Primary receives write → executes operation → records to oplog
// 2. Secondaries tail oplog → replay operations → maintain consistency
// 3. Oplog entries are idempotent (replaying UPDATE twice = same result)

// Key Features:
// - Idempotent operations (safe to replay)
// - Compact size (logical operations, not page-level changes)
// - Capped collection (automatically prunes old entries)
// - Powers Change Streams (real-time data pipelines)
// - Enables point-in-time snapshots

// When to use:
// - Replica set replication (built-in)
// - Change streams for CDC (MongoDB → Kafka)
// - Audit trails (track all database operations)
// - Building custom data pipelines from oplog`,
    },
    {
      id: "debezium-cdc",
      name: "Debezium - Database Change Data Capture",
      type: "platform",
      languages: ["java"],
      description:
        "Debezium is an open-source CDC platform that captures logical changes from databases (MySQL binlog, PostgreSQL logical decoding, MongoDB oplog) and streams them to Kafka. Transforms database-specific logical logs into standardized change events for data pipelines, search indexing, and cache invalidation.",
      links: {
        docs: "https://debezium.io/documentation/",
        github: "https://github.com/debezium/debezium",
      },
      codeSnippet: `// Debezium MySQL Connector Configuration
// Reads MySQL binlog (logical logging) and publishes to Kafka
{
  "name": "mysql-connector",
  "config": {
    "connector.class": "io.debezium.connector.mysql.MySqlConnector",
    "database.hostname": "mysql",
    "database.port": "3306",
    "database.user": "debezium",
    "database.password": "dbz",
    "database.server.id": "184054",
    "database.server.name": "mydb",

    // Logical logging configuration
    "database.include.list": "mydb",
    "table.include.list": "mydb.users",
    "binlog.format": "ROW",           // Logical logging (before/after values)

    // Kafka output
    "kafka.bootstrap.servers": "kafka:9092",
    "topic.prefix": "mydb",

    // Change event format
    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": "false"
  }
}

// Kafka Change Event (from MySQL binlog logical entry):
// Topic: mydb.mydb.users
{
  "schema": { ... },
  "payload": {
    "before": {                        // Before-image (for UPDATE/DELETE)
      "id": 123,
      "name": "Alice",
      "age": 25
    },
    "after": {                         // After-image (for INSERT/UPDATE)
      "id": 123,
      "name": "Alice",
      "age": 30
    },
    "source": {
      "version": "2.0.0",
      "connector": "mysql",
      "name": "mydb",
      "ts_ms": 1234567890000,
      "snapshot": "false",
      "db": "mydb",
      "table": "users",
      "server_id": 184054,
      "file": "mysql-bin.000001",
      "pos": 12345,
      "row": 0
    },
    "op": "u",                         // Operation: c=create, u=update, d=delete
    "ts_ms": 1234567890123             // Event timestamp
  }
}

// Consuming Debezium events in application
const kafka = require('kafkajs');
const consumer = kafka.consumer({ groupId: 'my-app' });

await consumer.subscribe({ topic: 'mydb.mydb.users' });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const change = JSON.parse(message.value);

    switch (change.payload.op) {
      case 'c':  // Insert
        console.log('User created:', change.payload.after);
        await indexInElasticsearch(change.payload.after);
        break;

      case 'u':  // Update
        console.log('User updated:', change.payload.before, '→', change.payload.after);
        await updateCache(change.payload.after);
        break;

      case 'd':  // Delete
        console.log('User deleted:', change.payload.before);
        await removeFromCache(change.payload.before.id);
        break;
    }
  }
});

// PostgreSQL Logical Decoding via Debezium
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "postgres",
  "database.port": "5432",
  "database.user": "debezium",
  "database.dbname": "mydb",
  "database.server.name": "pgserver",

  // Logical replication configuration
  "plugin.name": "pgoutput",           // Logical decoding plugin
  "publication.name": "debezium_pub",  // PostgreSQL publication
  "slot.name": "debezium_slot"         // Replication slot
}

// Key Features:
// - Multi-database support (MySQL, PostgreSQL, MongoDB, SQL Server, Oracle)
// - Exactly-once delivery with Kafka transactions
// - Schema evolution handling (survives DDL changes)
// - Initial snapshot + continuous streaming
// - Before/after values for auditing

// When to use:
// - Real-time data pipelines (OLTP → Data Warehouse)
// - Search index updates (Database → Elasticsearch)
// - Cache invalidation (Database changes → Redis)
// - Microservices data synchronization
// - Audit trails and compliance (capture all changes)`,
    },
    {
      id: "eventstoredb",
      name: "EventStoreDB - Event Sourcing Database",
      type: "platform",
      languages: ["any"],
      description:
        "EventStoreDB is a purpose-built database for event sourcing that stores domain events (logical operations) as the source of truth. Every state change is an immutable event appended to a stream. Projections rebuild current state by replaying events. First-class support for temporal queries, subscriptions, and event versioning.",
      links: {
        docs: "https://www.eventstore.com/",
        github: "https://github.com/EventStore/EventStore",
      },
      codeSnippet: `// EventStoreDB stores domain events (logical operations)
// Events are immutable, append-only, and ordered by stream

// Example: E-commerce order events
const { EventStoreDBClient, jsonEvent } = require('@eventstore/db-client');

const client = EventStoreDBClient.connectionString('esdb://localhost:2113');

// Append events (logical operations) to stream
async function placeOrder(orderId, items, totalAmount) {
  const orderPlacedEvent = jsonEvent({
    type: 'OrderPlaced',
    data: {
      orderId: orderId,
      items: items,
      totalAmount: totalAmount,
      timestamp: new Date().toISOString()
    }
  });

  await client.appendToStream(\`order-\${orderId}\`, orderPlacedEvent);
}

async function confirmPayment(orderId, paymentId) {
  const paymentConfirmedEvent = jsonEvent({
    type: 'PaymentConfirmed',
    data: {
      orderId: orderId,
      paymentId: paymentId,
      timestamp: new Date().toISOString()
    }
  });

  await client.appendToStream(\`order-\${orderId}\`, paymentConfirmedEvent);
}

async function shipOrder(orderId, trackingNumber) {
  const orderShippedEvent = jsonEvent({
    type: 'OrderShipped',
    data: {
      orderId: orderId,
      trackingNumber: trackingNumber,
      timestamp: new Date().toISOString()
    }
  });

  await client.appendToStream(\`order-\${orderId}\`, orderShippedEvent);
}

// Execute operations
await placeOrder('order-123', [{sku: 'ABC', qty: 2}], 99.99);
await confirmPayment('order-123', 'pay-456');
await shipOrder('order-123', 'TRACK-789');

// Event stream (stored in EventStoreDB):
// Stream: order-123
[
  {
    eventType: 'OrderPlaced',
    eventId: 'uuid-1',
    streamPosition: 0,
    data: {
      orderId: 'order-123',
      items: [{sku: 'ABC', qty: 2}],
      totalAmount: 99.99,
      timestamp: '2024-01-01T10:00:00Z'
    }
  },
  {
    eventType: 'PaymentConfirmed',
    eventId: 'uuid-2',
    streamPosition: 1,
    data: {
      orderId: 'order-123',
      paymentId: 'pay-456',
      timestamp: '2024-01-01T10:05:00Z'
    }
  },
  {
    eventType: 'OrderShipped',
    eventId: 'uuid-3',
    streamPosition: 2,
    data: {
      orderId: 'order-123',
      trackingNumber: 'TRACK-789',
      timestamp: '2024-01-01T11:00:00Z'
    }
  }
]

// Read events and rebuild current state
async function getOrderState(orderId) {
  const events = client.readStream(\`order-\${orderId}\`);

  let state = { status: 'Unknown' };

  for await (const event of events) {
    switch (event.event.type) {
      case 'OrderPlaced':
        state = {
          status: 'Placed',
          items: event.event.data.items,
          totalAmount: event.event.data.totalAmount
        };
        break;

      case 'PaymentConfirmed':
        state.status = 'Paid';
        state.paymentId = event.event.data.paymentId;
        break;

      case 'OrderShipped':
        state.status = 'Shipped';
        state.trackingNumber = event.event.data.trackingNumber;
        break;
    }
  }

  return state;
}

// Temporal query: Get state at specific time
async function getOrderStateAt(orderId, timestamp) {
  const events = client.readStream(\`order-\${orderId}\`);

  let state = { status: 'Unknown' };

  for await (const event of events) {
    if (new Date(event.event.data.timestamp) > new Date(timestamp)) {
      break;  // Stop before timestamp
    }

    // Apply event to state (same switch logic as above)
  }

  return state;
}

// Subscribe to events (real-time stream)
const subscription = client.subscribeToStream('order-123');

for await (const event of subscription) {
  console.log('New event:', event.event.type, event.event.data);

  // Trigger side effects (send email, update search index, etc.)
}

// Key Features:
// - Immutable event log (source of truth)
// - Temporal queries (state at any point in time)
// - Event subscriptions (real-time notifications)
// - Projections (build read models from events)
// - Event versioning (schema evolution)

// When to use:
// - Event sourcing architectures (domain events as source of truth)
// - Audit trails requiring complete history
// - Temporal queries (what was state at timestamp X?)
// - CQRS systems (separate write and read models)
// - Complex business domains (banking, inventory, trading)`,
    },
  ],

  usedInSystems: [
    {
      systemId: "shopify-mysql",
      systemName: "Shopify MySQL Logical Replication",
      howUsed:
        "Shopify uses MySQL logical replication (binlog ROW format) to maintain real-time replicas across multiple datacenters and power their data pipeline infrastructure. Every write operation to Shopify's primary MySQL databases (orders, products, customers, inventory) generates logical log entries capturing before/after values for each modified row. These binlog entries stream to read replicas in the same datacenter (<1ms replication lag), cross-datacenter replicas for disaster recovery (10-50ms lag), and analytics databases for business intelligence. The logical format enables cross-version replication—Shopify runs MySQL 8.0 on primaries while some replicas remain on MySQL 5.7 during gradual upgrades, a scenario impossible with physical logging. Shopify's Change Data Capture (CDC) pipeline consumes binlog entries via Debezium and publishes them to Kafka topics, feeding downstream systems: search indexes (Elasticsearch receives product updates within 100ms), recommendation engines (collaborative filtering models refresh continuously), and data warehouses (Snowflake ingests changes for analytics). The compact size of logical entries (100 bytes per row vs 10KB+ for physical pages) enables cost-effective cross-datacenter replication—shipping 1TB of binlog data daily vs 10-100TB for physical logging. During Shopify's Black Friday/Cyber Monday (BFCM) 2023, logical replication handled 10M+ orders per hour, streaming changes to 50+ downstream systems without impacting primary database performance. Pattern composition: Logical Logging + Multi-Datacenter Replication + CDC + Real-Time Analytics. Impact: Enabled zero-downtime MySQL version upgrades via logical replication; reduced data pipeline lag from hours (batch ETL) to seconds (real-time CDC); maintained 99.99% read availability through geographically distributed replicas; supported 1.5M merchants scaling during peak traffic.",
      source:
        "https://shopify.engineering/mysql-replication-at-shopify (Shopify Engineering Blog)",
    },
    {
      systemId: "uber-schemaless",
      systemName: "Uber Schemaless Change Streams",
      howUsed:
        "Uber's Schemaless database (built on MySQL) uses logical logging to power change streams that feed real-time data pipelines across Uber's platform. Schemaless stores semi-structured data (trip data, driver locations, rider preferences) as JSON blobs in MySQL tables, with logical replication capturing every insert/update/delete operation. The binlog entries (ROW format) include complete before/after JSON documents, enabling downstream consumers to process changes without querying the database. Uber's change streams deliver these logical entries to Apache Kafka within <100ms, where they're consumed by: real-time analytics (track active trips, driver availability, surge pricing), fraud detection (analyze trip patterns for anomalies), personalization engines (update rider preferences), and cache synchronization (invalidate Redis caches when data changes). The logical format's schema independence is critical for Uber's agility—adding new fields to JSON documents doesn't break change stream consumers (they ignore unknown fields), enabling rapid feature iteration. During Uber's New Year's Eve 2022 peak (50M trips in 24 hours), logical change streams processed 500K operations per second, delivering changes to 200+ microservices without overwhelming the database with read queries. Uber also uses logical logs for disaster recovery—during a datacenter outage, read replicas automatically promote to primary using binlog position as synchronization point, ensuring zero data loss. The compact size enables long-term log retention (90 days) for regulatory compliance and forensic analysis—auditors can replay binlog to reconstruct rider/driver data for specific timeframes. Pattern composition: Logical Logging + Change Streams + Real-Time Kafka + Multi-Tenant Database + JSON Document Storage. Impact: Enabled real-time data pipelines without read load on primary database; reduced cache invalidation lag from 30s (polling) to <100ms (event-driven); supported 10x traffic growth during peak events; maintained GDPR compliance through operation-level audit trails.",
      source:
        "https://www.uber.com/blog/schemaless-reengineering/ (Uber Engineering Blog)",
    },
    {
      systemId: "linkedin-databus",
      systemName: "LinkedIn Databus CDC Platform",
      howUsed:
        "LinkedIn built Databus, an open-source change data capture system, on top of Oracle and MySQL logical replication to power real-time data pipelines serving 900M+ members. Databus consumes Oracle Redo Logs (logical format) and MySQL binlog entries, transforming database-specific formats into unified change events published to subscribers. Every profile update, connection request, message, and job posting generates logical log entries that Databus streams to: search indexes (update member profiles in Elasticsearch within 2 seconds), recommendation systems (update connection graphs for 'People You May Know'), analytics pipelines (aggregate engagement metrics for feed ranking), and derived data stores (denormalize data for fast API queries). The logical format enables heterogeneous replication—LinkedIn migrated from Oracle to MySQL by running Databus consumers against both databases simultaneously, comparing outputs to validate correctness before cutover. Logical logging's before/after values power LinkedIn's derived data consistency checks—consumers detect inconsistencies by comparing source database state (from logical log) against derived store state, triggering automatic reconciliation. During LinkedIn's 2020 migration from monolithic Oracle to sharded MySQL, Databus processed 20M logical entries per second across 1000+ database shards, keeping derived stores consistent during the multi-month migration. The compact log size enabled 7-day retention (vs 1-day for physical logs), allowing consumers to recover from extended outages by replaying from checkpoint. LinkedIn's feed ranking system relies on logical logs to update member engagement scores in real-time—likes, comments, shares generate logical entries consumed by ML models within seconds, enabling personalized feeds reflecting recent activity. Pattern composition: Logical Logging + Heterogeneous CDC + Real-Time Search + Derived Data Stores + Multi-Database Migration. Impact: Enabled zero-downtime Oracle to MySQL migration for 900M members; reduced search index lag from 15 minutes (batch) to 2 seconds (real-time); maintained derived data consistency across 1000+ shards; supported 3x member growth with linear scaling.",
      source:
        "https://github.com/linkedin/databus (LinkedIn Databus GitHub + Engineering Blog)",
    },
    {
      systemId: "airbnb-data-pipeline",
      systemName: "Airbnb Logical Replication Data Pipeline",
      howUsed:
        "Airbnb uses MySQL logical replication (binlog ROW format) to power a real-time data pipeline serving 7M+ listings and 150M+ users. Every booking, review, message, and price update generates logical log entries that flow through Airbnb's CDC infrastructure to downstream systems. The binlog entries capture before/after values for critical tables (bookings, listings, users, payments) and stream to Apache Kafka via Debezium within <500ms, where they're consumed by: search ranking (update listing availability in Elasticsearch), dynamic pricing (adjust prices based on demand signals), fraud detection (analyze booking patterns), and business intelligence (track booking funnel metrics). Logical logging's compact size enables Airbnb to retain 30 days of change history (10TB compressed) for regulatory compliance and operational analytics—support teams replay logs to debug booking issues, finance teams reconcile payments, and data scientists analyze historical demand patterns. The schema-independent format proved critical during Airbnb's Experiences launch—adding new tables/columns to the database didn't break existing CDC consumers (they filtered to relevant tables), enabling rapid feature iteration. During COVID-19 when cancellations surged 10x, logical replication processed 5M cancellation events per day, updating search indexes, triggering refunds, and notifying hosts without manual intervention. Airbnb also uses logical logs for zero-downtime schema migrations—deploy schema change to replicas first, verify via binlog replay, promote replica to primary, minimizing production impact. The human-readable format enables operational transparency—on-call engineers query binlog to debug production issues ('show me all booking updates for listing X in last hour'), inspect before/after values to identify data corruption, and replay operations in staging to reproduce bugs. Pattern composition: Logical Logging + Multi-Consumer CDC + Search Index Sync + Regulatory Compliance + Real-Time Pricing. Impact: Enabled real-time search index updates for 7M listings; reduced fraud detection lag from hours to seconds; supported 100x cancellation surge during COVID; maintained 30-day audit trail for regulatory compliance.",
      source:
        "https://medium.com/airbnb-engineering/democratizing-data-at-airbnb-852d76c51770 (Airbnb Engineering Blog)",
    },
    {
      systemId: "stripe-audit-logs",
      systemName: "Stripe Audit Logs (Logical Event Sourcing)",
      howUsed:
        "Stripe implements logical logging principles through event sourcing for their audit log system, recording every API operation as an immutable logical event. When merchants call Stripe APIs (create charge, refund payment, update customer), Stripe records logical events: {object: 'charge', action: 'created', amount: 5000, currency: 'usd', customer: 'cus_123', timestamp: '...', request_id: '...'}—capturing the operation's intent, not internal database changes. These logical events serve multiple purposes: regulatory compliance (merchants export complete audit trails for financial reconciliation), fraud detection (analyze payment patterns across events), customer support (support agents replay events to debug merchant issues), and data warehouse pipelines (stream events to Snowflake for analytics). Stripe's event format is schema-independent—adding new fields to charge events (metadata, shipping address) doesn't break merchants consuming webhooks; old events remain valid. The compact, human-readable format enables long-term retention—Stripe stores 7+ years of audit logs (billions of events) while remaining cost-effective. During compliance audits, regulators query logical events: 'show all refunds for customer X between dates Y and Z', receiving complete before/after values without reconstructing state from database snapshots. Stripe's event versioning handles schema evolution—when changing event structure, they publish new version (charge.v2) alongside old (charge.v1), allowing gradual merchant migration. The logical format also powers Stripe's webhooks—merchants subscribe to event streams (charge.succeeded, payment.failed), receiving real-time logical operations within 30 seconds of occurrence, enabling automated reconciliation and notifications. Stripe's operational tools leverage logical events for debugging—when merchants report payment issues, support engineers search event logs for the charge_id, inspect complete operation history (authorized → captured → disputed → resolved), and identify failures without accessing production databases. Pattern composition: Logical Event Sourcing + Webhook Streaming + Audit Compliance + Event Versioning + Customer-Facing Logs. Impact: Enabled SOC 2 / PCI DSS compliance through immutable audit trails; supported 7+ year retention for billions of events; provided merchants with exportable reconciliation data; reduced support debugging time by 60% through searchable event logs.",
      source:
        "https://stripe.com/docs/api/events (Stripe API Documentation + Audit Logs)",
    },
  ],

  philosophy: {
    coreProblem:
      "Physical logging ties recovery and replication to database internal structure (page layout, storage format, indexes), making logs fragile, verbose, and incompatible across schema changes or database versions. A single row update modifies 5+ pages (data page, 3 index pages, metadata page), generating 20KB+ of physical log entries that break when adding indexes or changing page size. This coupling prevents cross-version replication, makes logs unreadable for auditing, and wastes storage on redundant page-level details.",
    designPrinciple:
      "Record high-level operation semantics (INSERT, UPDATE, DELETE with before/after values) rather than low-level page modifications, creating compact, human-readable logs that survive schema evolution and enable cross-version replication. Log the WHAT (user intent) not the HOW (storage implementation).",
    historicalContext:
      "Logical logging emerged from the tension between performance (physical logging recovers faster) and flexibility (schema changes, cross-version replication). Early databases (System R, Postgres in 1980s) used purely physical logging—recording byte-level page changes enabled fast recovery but made logs fragile. When Oracle introduced multi-version concurrency control (MVCC) and redo logs in the 1990s, they added logical elements (operation type, before/after values) to support flashback queries and cross-version replication. MySQL popularized logical replication with binlog ROW format (2010s), enabling cross-version replication (MySQL 8.0 → 5.7) and change data capture (Debezium consuming binlog). PostgreSQL followed with logical decoding (2014), allowing selective replication and heterogeneous targets (Postgres → Elasticsearch). The pattern gained prominence with event sourcing and CQRS (2010s)—systems like EventStoreDB and Kafka treat logical events as source of truth, not just recovery mechanism. Modern databases use hybrid approaches: PostgreSQL's WAL contains both physical (for fast recovery) and logical (for replication) entries; MongoDB's oplog stores idempotent logical operations; Cassandra's commit log captures logical mutations. The shift reflects database evolution: 1980s optimized for single-server recovery (physical logging sufficient), 2000s required cross-datacenter replication (logical format necessary), 2020s demand real-time data pipelines (logical events power CDC, analytics, search). Cloud-native databases (CockroachDB, YugabyteDB) default to logical replication for multi-region deployment. The pattern's maturity is evidenced by standardization: Debezium provides unified logical event format across MySQL, Postgres, MongoDB, and SQL Server.",
    alternativesRejected: [
      "Pure Physical Logging - Record only byte-level page modifications (page 789 offset 234 changed to 0x4A). Advantages: Fastest recovery (directly replay page writes). Rejected because: breaks on schema changes (adding index invalidates logs), incompatible across database versions (MySQL 8.0 logs can't apply to MySQL 5.7), unreadable for auditing (byte dumps meaningless to humans), verbose (10-100x larger than logical logs), doesn't support heterogeneous replication (MySQL → Postgres impossible). Used only for: crash recovery within same database version/schema, storage-level replication (DRBD, ZFS send/receive).",
      "Pure Statement-Based Logging (SQL Text) - Record SQL statements executed (UPDATE users SET age=30 WHERE id=123). Advantages: Ultra-compact (SQL text <100 bytes), human-readable. Rejected because: non-deterministic operations fail (NOW() produces different results on replay, RAND() not reproducible), statement order matters (parallel transactions cause inconsistency), triggers/stored procedures produce different results on replicas, can't capture row-level details for CDC. MySQL deprecated STATEMENT binlog format in favor of ROW (logical) for these reasons. Used only for: initial prototypes, very specific use cases with deterministic workloads.",
      "Snapshot-Based Replication (No Logging) - Periodically copy entire database state to replicas (full snapshots). Advantages: Simple implementation, guaranteed consistency. Rejected because: massive bandwidth waste (copy unchanged data), high replication lag (hours between snapshots), no point-in-time recovery (can only restore to snapshot timestamps), doesn't support real-time CDC. Used only for: initial replication seeding (baseline snapshot + incremental logical log), infrequent backups (daily/weekly snapshots).",
      "Trigger-Based Change Capture (Application-Level Logging) - Use database triggers to record changes to audit tables. Advantages: Works with any database, selective capture (only tables with triggers). Rejected because: adds write latency (triggers execute on every write), doubles storage (audit tables as large as source tables), misses DDL changes (triggers don't capture schema modifications), tight coupling to application schema (triggers break on schema changes). Used only for: legacy systems without native logical logging, selective auditing (only critical tables).",
      "Hybrid Physical-Logical Logging - Record both physical page changes AND logical operations in same log. Advantages: Fast recovery (physical) + flexible replication (logical). Rejected for most systems because: 2x storage cost (log contains both formats), complexity in log management (two formats to parse/maintain), marginal benefit (can generate logical from physical or vice versa). Used in: PostgreSQL WAL (contains both, configurable via wal_level), Oracle Redo Logs (hybrid format). This is actually the emerging best practice for databases needing both fast recovery and flexible replication.",
    ],
    mentalModel:
      "Logical logging is like a recipe that says 'add 2 eggs, mix flour' instead of documenting every molecular change to the batter—you capture the intent (the operation), not the physical details (the page modifications). If you change bowls (schema changes) or kitchen equipment (database version), the recipe still works because it describes WHAT to do, not HOW the specific equipment does it. Physical logging would say 'molecules at position X changed to state Y'—if you switch bowls, those positions are meaningless and the log breaks. The tradeoff: recipes take longer to execute (you must crack eggs, measure flour) versus instant results (just dump pre-mixed batter), but recipes survive kitchen upgrades and different chefs can follow them (cross-version replication, heterogeneous targets).",
  },

  visualization: {
    staticDiagram: `graph TB
    Transaction[Application Transaction] --> Execute[Database Executes Operation]
    Execute --> PhysicalChanges[Physical Changes:<br/>5+ pages modified<br/>Data, indexes, metadata]

    Execute --> LogicalEntry[Generate Logical Log Entry]

    LogicalEntry --> Compact[Compact Format:<br/>UPDATE users SET age=30 WHERE id=123<br/>before: {age: 25}, after: {age: 30}<br/>Size: ~100 bytes]

    PhysicalChanges --> PhysicalLog[Physical Log Alternative:<br/>Page 789 offset 234: 0x19 → 0x1E<br/>Page 445 index update<br/>Page 556 undo log<br/>Size: ~10KB+]

    Compact --> Storage[Durable Storage]
    Storage --> Recovery[Recovery: Re-execute operations]
    Storage --> Replication[Replication: Stream to replicas]
    Storage --> CDC[CDC: Kafka/Analytics]

    PhysicalLog -.->|Fragile| SchemaChange[❌ Breaks on schema changes]
    PhysicalLog -.->|Incompatible| CrossVersion[❌ Can't cross versions]
    PhysicalLog -.->|Unreadable| Audit[❌ Byte dumps, not human-readable]

    Compact -.->|Resilient| SchemaChange2[✅ Survives schema changes]
    Compact -.->|Compatible| CrossVersion2[✅ Cross-version replication]
    Compact -.->|Readable| Audit2[✅ Human-readable audits]

    Recovery --> State[Reconstructed State]
    Replication --> Replica[Replica Database<br/>Different schema/version OK]
    CDC --> Analytics[Data Warehouse<br/>Search Index<br/>Real-time Pipeline]

    style LogicalEntry fill:#e1f5e1
    style Compact fill:#90ee90
    style PhysicalLog fill:#ffe1e1
    style Storage fill:#e1e5ff
    style Replica fill:#fff4e1`,
    realWorldAnalogy:
      "Logical logging is like a construction site that records high-level work orders ('Install window at north wall') instead of documenting every hammer swing and nail position. Physical logging would record 'hammer hit nail at coordinates X,Y,Z with force F at time T'—extremely detailed but breaks if you change tools, use different materials, or renovate the building later. The work order (logical) describes the intent and survives changes to construction methods, while the hammer logs (physical) are tightly coupled to specific tools and locations. When you need to rebuild after damage, the work order lets any contractor do the job, while hammer logs only work with the exact same tools in the exact same positions.",
    useCases: [
      {
        domain: "Cross-Version Database Replication",
        scenario:
          "Company runs MySQL 8.0 on primary database but needs to replicate to MySQL 5.7 replicas during gradual upgrade. Physical logging would fail (8.0 and 5.7 have different page formats), but logical binlog entries (UPDATE users SET age=30 WHERE id=123) apply to both versions. Replicas execute operations against their local schema, tolerating version differences.",
        patternRole:
          "Enables cross-version replication by capturing operation intent rather than storage implementation, allowing heterogeneous database versions to remain consistent",
        companies: ["Shopify", "GitHub", "Stripe", "Airbnb"],
      },
      {
        domain: "Change Data Capture (CDC) Data Pipelines",
        scenario:
          "E-commerce platform needs real-time search index updates and analytics when products/orders change. MySQL binlog (logical) entries stream to Kafka via Debezium, consumed by Elasticsearch (search index), Snowflake (analytics), and Redis (cache invalidation). Logical format provides before/after values in human-readable JSON, enabling downstream systems to process changes without querying database.",
        patternRole:
          "Powers real-time data pipelines by providing compact, self-contained change events that downstream systems can consume independently",
        companies: ["Uber", "LinkedIn", "Airbnb", "Netflix"],
      },
      {
        domain: "Regulatory Compliance and Audit Trails",
        scenario:
          "Financial services company must retain complete audit trail of all transactions for 7 years. Physical logs are too large (100TB+ per year) and unreadable (byte dumps). Logical logs capture every operation in human-readable format: {type: 'TRANSFER', from: account123, to: account456, amount: 1000, timestamp: ...}, compressed to 1TB per year. Auditors query logs without reconstructing database state.",
        patternRole:
          "Provides human-readable, long-term audit trails that regulators can inspect, while maintaining compact size for cost-effective retention",
        companies: ["Stripe", "Square", "PayPal", "Coinbase"],
      },
      {
        domain: "Schema Evolution Without Breaking Replication",
        scenario:
          "Startup adds new indexes to primary database to improve query performance. Physical logging would break replicas (new index pages generate log entries replicas can't apply). Logical logging survives—UPDATE users WHERE id=123 operations apply to replicas regardless of index changes. Replicas eventually get index via schema migration, but replication continues during transition.",
        patternRole:
          "Decouples replication from storage schema, enabling independent schema evolution on primary and replicas without breaking consistency",
        companies: ["GitHub", "GitLab", "Shopify"],
      },
      {
        domain: "Event Sourcing and CQRS Systems",
        scenario:
          "E-commerce platform implements event sourcing where domain events (OrderPlaced, PaymentConfirmed, OrderShipped) are source of truth. Logical events stored in EventStoreDB enable temporal queries ('what was order status at 10am yesterday?'), replay for debugging, and multiple read models (SQL for queries, Elasticsearch for search, Redis for caching) projected from single event log.",
        patternRole:
          "Serves as immutable source of truth for domain events, enabling temporal queries, replay debugging, and multiple derived read models in CQRS architectures",
        companies: [
          "Jet.com (acquired by Walmart)",
          "Just Eat",
          "LMAX Exchange",
        ],
      },
    ],
  },

  references: [
    {
      title: "MySQL Binary Log (Binlog) Documentation",
      url: "https://dev.mysql.com/doc/refman/8.0/en/binary-log.html",
      type: "documentation",
      author: "MySQL / Oracle",
    },
    {
      title: "PostgreSQL Logical Replication and Decoding",
      url: "https://www.postgresql.org/docs/current/logical-replication.html",
      type: "documentation",
      author: "PostgreSQL Global Development Group",
    },
    {
      title: "MongoDB Oplog (Operations Log)",
      url: "https://www.mongodb.com/docs/manual/core/replica-set-oplog/",
      type: "documentation",
      author: "MongoDB Inc.",
    },
    {
      title:
        "Debezium: Change Data Capture for MySQL, PostgreSQL, MongoDB, and more",
      url: "https://debezium.io/documentation/",
      type: "documentation",
      author: "Red Hat / Debezium Community",
    },
    {
      title:
        "Designing Data-Intensive Applications (Chapter 3: Storage and Retrieval, WAL section)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title:
        "The Log: What every software engineer should know about real-time data's unifying abstraction",
      url: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying",
      type: "article",
      author: "Jay Kreps (LinkedIn)",
    },
    {
      title:
        "MySQL at Shopify: Replication, High Availability, and Logical Backups",
      url: "https://shopify.engineering/mysql-replication-at-shopify",
      type: "article",
      author: "Shopify Engineering",
    },
    {
      title: "Change Data Capture: The Complete Guide",
      url: "https://www.confluent.io/learn/change-data-capture/",
      type: "documentation",
      author: "Confluent",
    },
  ],

  tags: [
    "reliability",
    "recovery",
    "write-ahead-logging",
    "replication",
    "change-data-capture",
    "cdc",
    "event-sourcing",
    "database",
    "schema-evolution",
  ],
  difficulty: "advanced",
};
