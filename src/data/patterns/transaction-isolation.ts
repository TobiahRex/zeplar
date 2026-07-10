import type { Pattern } from "../schema";

export const transactionIsolation: Pattern = {
  id: "transaction-isolation",
  slug: "transaction-isolation",
  corpusPath: "🔗 CONSISTENCY → 🔒 Transactions → 🪜 Transaction Isolation",

  hierarchy: {
    quality: "consistency",
    strategy: "Transactions",
    family: "Isolation",
    level: 4,
  },

  concept: {
    name: "Transaction Isolation",
    emoji: "🪜",
    tagline: "The isolation ladder — from fast-and-wrong to slow-and-correct",
    definition:
      "Transaction isolation levels are the standardized rungs of a ladder that trades concurrency for correctness, defining precisely which anomalies a database is allowed to expose when many transactions run at once. The ANSI SQL standard names four rungs — Read Uncommitted, Read Committed, Repeatable Read, and Serializable — each phrased negatively, by the phenomena it forbids: dirty reads, non-repeatable reads, and phantoms. Read Committed guarantees you never observe another transaction's uncommitted writes. Snapshot Isolation, the usual MVCC implementation of Repeatable Read, hands each transaction a consistent, frozen view of the whole database as of its start, so repeated reads always agree. Serializable guarantees the outcome is as if the transactions had executed one at a time in some serial order. Isolation is the 'I' of ACID, and in practice it is the leakiest letter: the level names are historically accreted, vendor definitions diverge from the standard, and the same label can mean genuinely different guarantees on different engines. Choosing a level is choosing how much anomaly you will tolerate in exchange for throughput — every rung you climb buys away one more class of anomaly at the cost of concurrency.",
    problemSolved:
      "Without isolation, concurrent transactions interleave their reads and writes and corrupt each other in ways that stay invisible until the production data is already wrong. A dirty read lets one transaction observe another's uncommitted, soon-to-be-rolled-back write. A non-repeatable read (read skew) lets a row change value between two reads inside the same transaction, so a report sums figures captured at two different instants. A lost update happens when two transactions read the same value, each adds to it, and one silently overwrites the other's increment. And write skew — the subtlest — lets two transactions each read an overlapping set, verify a premise, and make disjoint writes that together falsify that premise, with neither write ever touching the same row. Isolation levels give the application a menu: name the anomalies you cannot tolerate for a given invariant, pick the cheapest rung that forbids them, and let the database enforce it instead of hand-rolling locks in application code.",
    tradeoffs: {
      pros: [
        "Turns a family of subtle concurrency bugs into a single declarative choice — the level name IS the contract",
        "Higher rungs let the database enforce invariants that would otherwise need error-prone hand-written locking",
        "Snapshot isolation gives readers a stable, consistent view without blocking writers (MVCC)",
        "Serializable removes the entire class of write-skew and phantom anomalies at once, no per-query reasoning",
        "Lower rungs deliver maximum throughput when the workload genuinely tolerates the permitted anomalies",
      ],
      cons: [
        "The default level on most engines is Read Committed — silently permitting lost updates and write skew",
        "The names lie: Oracle's 'SERIALIZABLE' is snapshot isolation, and 'Repeatable Read' means different things per vendor",
        "Serializable costs throughput — via lock contention (2PL), a single core (actual serial), or abort-and-retry (SSI)",
        "SSI and optimistic paths surface serialization failures the application MUST catch and retry",
        "Snapshot isolation looks correct in testing yet still allows write skew, which only appears under real concurrency",
      ],
    },
    relatedPatterns: [
      "normalization",
      "optimistic-locking",
      "pessimistic-locking",
      "mvcc",
      "two-phase-locking",
      "saga",
    ],
  },

  structure: {
    participants: [
      {
        name: "Transaction",
        role: "Atomic unit of read/write work",
        responsibilities: [
          "Group a set of reads and writes into an all-or-nothing commit boundary",
          "Declare (or inherit) the isolation level that governs what it may observe",
        ],
      },
      {
        name: "Isolation Level",
        role: "The dial between throughput and truth",
        responsibilities: [
          "Name exactly which anomalies concurrent transactions are permitted to expose",
          "Bind the transaction to the concurrency-control strategy that enforces that contract",
        ],
      },
      {
        name: "Concurrency Control Mechanism (MVCC / 2PL)",
        role: "Enforcer of the chosen level",
        responsibilities: [
          "Under MVCC, keep multiple row versions so readers never block writers",
          "Under two-phase locking, acquire and hold read/write locks until commit to serialize access",
        ],
      },
      {
        name: "Snapshot",
        role: "Consistent point-in-time read view",
        responsibilities: [
          "Freeze the visible database state as of the transaction's start",
          "Ensure every read inside the transaction reflects that single instant (no read skew)",
        ],
      },
      {
        name: "Serialization Conflict Detector (SSI)",
        role: "The write-skew catcher at Serializable",
        responsibilities: [
          "Track read-write dependencies (dangerous structures) between concurrent transactions",
          "Abort one participant with a serialization failure when a non-serializable schedule is detected",
        ],
      },
    ],
    diagram: `graph TD
    RU["Read Uncommitted<br/>(no barrier)"] -->|forbid dirty reads| RC["Read Committed<br/>(see only committed data)"]
    RC -->|forbid non-repeatable<br/>reads / read skew| SI["Snapshot Isolation /<br/>Repeatable Read (MVCC)"]
    SI -->|forbid write skew<br/>+ phantoms| SER["Serializable<br/>(as-if one-at-a-time)"]
    RC -.->|still allows| A1[dirty writes gone,<br/>but lost update + write skew remain]
    SI -.->|still allows| A2[write skew + phantoms<br/>the premise, not the row, conflicts]
    SER -->|implemented by| T1["2PL — lock until commit"]
    SER -->|implemented by| T2["Actual serial execution"]
    SER -->|implemented by| T3["SSI — detect R/W dependency, abort loser"]
    SI -->|or materialize the conflict| FU["SELECT ... FOR UPDATE"]`,
    flow: [
      {
        step: 1,
        actor: "Read Uncommitted",
        action: "Impose no barrier",
        description:
          "The bottom rung. A transaction may observe another's uncommitted writes (dirty reads). Fast and almost never what you want; Postgres treats it as Read Committed anyway.",
      },
      {
        step: 2,
        actor: "Read Committed",
        action: "Hide uncommitted writes",
        description:
          "Guarantee each statement sees only committed data — no dirty reads or dirty writes. Still allows non-repeatable reads, lost updates, and write skew. This is the default on Postgres, Oracle, and SQL Server.",
      },
      {
        step: 3,
        actor: "Snapshot / Repeatable Read",
        action: "Freeze a consistent snapshot",
        description:
          "Via MVCC, give the whole transaction a single consistent view as of its start, so repeated reads agree — non-repeatable reads and read skew are gone. Write skew and phantoms remain.",
      },
      {
        step: 4,
        actor: "Snapshot Isolation",
        action: "Fail to catch the premise conflict",
        description:
          "Two transactions read an overlapping set, each verify a premise, and write disjoint rows. No row is written twice, so MVCC sees no write-write conflict — both commit and jointly violate the premise. This is write skew, and snapshot isolation cannot prevent it.",
      },
      {
        step: 5,
        actor: "Application",
        action: "Materialize the conflict",
        description:
          "Stay below Serializable but force the phantom premise into a concrete row lock with SELECT ... FOR UPDATE (or an explicit lock row). The second transaction now blocks, re-reads reality, and its check fails correctly.",
      },
      {
        step: 6,
        actor: "Serializable",
        action: "Guarantee an equivalent serial order",
        description:
          "The top rung, implemented by strict two-phase locking, single-threaded serial execution, or Serializable Snapshot Isolation (SSI). SSI detects the read-write dependency behind write skew and aborts one transaction with SQLSTATE 40001; the caller retries.",
      },
    ],
    invariants: [
      "Each rung forbids a strict superset of the anomalies forbidden by the rung below it",
      "At Read Committed and above, no transaction ever observes another transaction's uncommitted write",
      "Under snapshot isolation, every read within a transaction reflects one single consistent point in time",
      "Only Serializable guarantees an execution equivalent to some serial order — the sole level that prevents write skew",
      "A committed transaction's writes are applied atomically; an aborted one leaves no trace, regardless of level",
    ],
  },

  codeExamples: [
    {
      id: "transaction-isolation-write-skew-oncall",
      language: "typescript",
      title: "Write skew: two on-call doctors both go off call",
      description:
        "Under snapshot isolation both transactions read 'at least one OTHER doctor is on call', both pass the check, and both go off call — leaving the ward with zero. The fixes materialize the conflict with FOR UPDATE, or ask for real serializability and retry on abort.",
      runnable: false,
      code: `// INVARIANT: at least one doctor must remain on call for a shift.
// Alice and Bob are both on call and both try to go off call at the same moment.
// Each transaction checks "is at least one OTHER doctor still on call?"

import { Pool } from "pg";

const pool = new Pool();

// ❌ WRITE SKEW under Snapshot Isolation / Repeatable Read.
// The two transactions read an OVERLAPPING set (all on-call doctors) and make
// DISJOINT writes (Alice's row, Bob's row). Neither write touches the other's
// row, so there is no write-write conflict for MVCC to catch — yet together
// they falsify the "at least one on call" premise. SI does NOT prevent this.
async function goOffCallNaive(doctorId: number, shiftId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");

    // Read the premise: how many doctors are currently on call for this shift?
    const check = await client.query(
      \`SELECT count(*) AS on_call
         FROM doctors
        WHERE shift_id = $1 AND on_call = true\`,
      [shiftId],
    );

    // Both transactions see "2" — their snapshots predate the other's write.
    if (Number(check.rows[0].on_call) >= 2) {
      await client.query(
        \`UPDATE doctors SET on_call = false
          WHERE id = $1 AND shift_id = $2\`,
        [doctorId, shiftId],
      );
    }

    await client.query("COMMIT"); // both commit → ZERO doctors on call. Bug.
  } finally {
    client.release();
  }
}

// ✅ FIX A — MATERIALIZE THE CONFLICT with SELECT ... FOR UPDATE.
// FOR UPDATE takes a row lock on every on-call doctor the transaction reads,
// turning the phantom "premise" into a concrete write-write conflict: the
// second transaction BLOCKS on the locked rows, then re-reads and sees only one
// doctor left, so its check fails and it correctly does NOT go off call.
async function goOffCallLocked(doctorId: number, shiftId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query(
      \`SELECT count(*) AS on_call
         FROM doctors
        WHERE shift_id = $1 AND on_call = true
          FOR UPDATE\`, // ← lock the rows the premise depends on
      [shiftId],
    );

    if (Number(check.rows[0].on_call) >= 2) {
      await client.query(
        \`UPDATE doctors SET on_call = false
          WHERE id = $1 AND shift_id = $2\`,
        [doctorId, shiftId],
      );
    }

    await client.query("COMMIT");
  } finally {
    client.release();
  }
}

// ✅ FIX B — ask the database for real serializability, retry on abort.
// SERIALIZABLE uses SSI in Postgres: it tracks the read-write dependency
// between the two transactions and ABORTS the loser with a serialization
// failure (SQLSTATE 40001). The caller simply retries the whole transaction.
async function goOffCallSerializable(doctorId: number, shiftId: number) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      const check = await client.query(
        \`SELECT count(*) AS on_call FROM doctors
          WHERE shift_id = $1 AND on_call = true\`,
        [shiftId],
      );
      if (Number(check.rows[0].on_call) >= 2) {
        await client.query(
          \`UPDATE doctors SET on_call = false
            WHERE id = $1 AND shift_id = $2\`,
          [doctorId, shiftId],
        );
      }
      await client.query("COMMIT");
      return;
    } catch (err: any) {
      await client.query("ROLLBACK");
      if (err.code !== "40001") throw err; // not a serialization failure
      // else: loser of the SSI conflict — loop and retry
    } finally {
      client.release();
    }
  }
  throw new Error("goOffCall: exhausted retries under serialization contention");
}

export { goOffCallNaive, goOffCallLocked, goOffCallSerializable };`,
    },
    {
      id: "transaction-isolation-lost-update-counter",
      language: "python",
      title: "Lost update on a counter, and its three fixes",
      description:
        "A read-modify-write on the SAME row lets one increment silently clobber another. Because the conflict is on a single object (unlike write skew), it has three clean fixes: an atomic UPDATE, an explicit FOR UPDATE lock, and compare-and-set on a version column.",
      runnable: false,
      code: `# LOST UPDATE: two transactions read the SAME object, each computes a new value
# from what they read, and the second write clobbers the first. Unlike write
# skew (disjoint rows), the conflict is on ONE row — which makes it fixable
# three different ways.

import psycopg2  # conn is an open psycopg2 connection


# ❌ NAIVE read-modify-write. Two workers both read views = 41, both compute 42,
# both write 42. One increment is silently LOST — the final value is 42, not 43.
def increment_naive(conn, page_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("BEGIN")
        cur.execute("SELECT views FROM pages WHERE id = %s", (page_id,))
        views = cur.fetchone()[0]          # read 41
        new_value = views + 1              # compute 42 in application memory
        cur.execute(
            "UPDATE pages SET views = %s WHERE id = %s",
            (new_value, page_id),          # last writer wins → lost update
        )
        cur.execute("COMMIT")


# ✅ FIX 1 — ATOMIC UPDATE. Let the database do the read-modify-write in one
# statement. The increment happens under the row lock UPDATE already takes, so
# concurrent increments serialize and none are lost. Simplest and fastest.
def increment_atomic(conn, page_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("BEGIN")
        cur.execute(
            "UPDATE pages SET views = views + 1 WHERE id = %s", (page_id,)
        )
        cur.execute("COMMIT")


# ✅ FIX 2 — EXPLICIT LOCK. When the new value needs application-side logic that
# SQL cannot express, SELECT ... FOR UPDATE locks the row so the second
# transaction blocks until the first commits, then reads the incremented value.
def increment_for_update(conn, page_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("BEGIN")
        cur.execute(
            "SELECT views FROM pages WHERE id = %s FOR UPDATE", (page_id,)
        )
        views = cur.fetchone()[0]          # blocks rivals until we commit
        cur.execute(
            "UPDATE pages SET views = %s WHERE id = %s",
            (views + 1, page_id),
        )
        cur.execute("COMMIT")


# ✅ FIX 3 — COMPARE-AND-SET (optimistic concurrency). No locks: carry a version
# column and make the UPDATE conditional on the version you read. If someone
# else won the race, zero rows are affected — detect it and retry.
def increment_cas(conn, page_id: int) -> None:
    while True:
        with conn.cursor() as cur:
            cur.execute("BEGIN")
            cur.execute(
                "SELECT views, version FROM pages WHERE id = %s", (page_id,)
            )
            views, version = cur.fetchone()
            cur.execute(
                """UPDATE pages
                      SET views = %s, version = version + 1
                    WHERE id = %s AND version = %s""",
                (views + 1, page_id, version),  # only wins if version unchanged
            )
            updated = cur.rowcount              # 0 means we lost the race
            cur.execute("COMMIT")
            if updated == 1:
                return
            # else: another writer bumped the version — loop and retry`,
    },
  ],

  systemContext: {
    typicalPlacement: [
      "The OLTP transactional core of any system of record, wrapping multi-statement business operations",
      "The boundary where an invariant spans more than one row and concurrent writers can race on it",
    ],
    interactsWith: [
      "The concurrency-control engine (MVCC version store or lock manager) that enforces the chosen level",
      "Application retry logic that catches serialization failures (SQLSTATE 40001) and replays the transaction",
      "Connection pools and ORMs that set the per-transaction or per-session isolation level",
    ],
    architecturalBoundaries: [
      "Application-enforced invariants (check-then-act in code) vs database-enforced invariants (level + locks)",
      "Optimistic concurrency (snapshot + abort-and-retry) vs pessimistic concurrency (locks held to commit)",
    ],
  },

  implementations: [
    {
      id: "postgresql",
      name: "PostgreSQL",
      type: "platform",
      languages: ["sql"],
      description:
        "MVCC throughout. Default is READ COMMITTED; REPEATABLE READ is true snapshot isolation; SERIALIZABLE uses Serializable Snapshot Isolation (SSI) to detect and abort write-skew conflicts. READ UNCOMMITTED behaves as READ COMMITTED.",
      links: { docs: "https://www.postgresql.org/docs/current/transaction-iso.html" },
    },
    {
      id: "mysql-innodb",
      name: "MySQL (InnoDB)",
      type: "platform",
      languages: ["sql"],
      description:
        "Default is REPEATABLE READ, implemented with consistent snapshots plus next-key (gap) locks that suppress most phantoms — but it is not true serializability and still permits write skew. SERIALIZABLE promotes plain SELECTs to locking reads.",
      links: { docs: "https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html" },
    },
    {
      id: "oracle",
      name: "Oracle Database",
      type: "platform",
      languages: ["sql"],
      description:
        "Default is READ COMMITTED. Its SERIALIZABLE is actually snapshot isolation, not true serializability — the classic case of the name lying — so write skew survives at the highest named level unless you lock explicitly.",
      links: { docs: "https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/data-concurrency-and-consistency.html" },
    },
    {
      id: "sqlserver",
      name: "Microsoft SQL Server",
      type: "platform",
      languages: ["sql"],
      description:
        "Defaults to lock-based READ COMMITTED. Offers an opt-in SNAPSHOT isolation level and Read-Committed Snapshot (RCSI) built on row versioning, plus a genuinely lock-based SERIALIZABLE with range locks.",
      links: { docs: "https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql" },
    },
    {
      id: "cockroachdb",
      name: "CockroachDB",
      type: "platform",
      languages: ["sql"],
      description:
        "SERIALIZABLE by default — the only isolation level historically supported — using an SSI-style scheme over a distributed MVCC store, so applications must be written to retry on serialization failures.",
      links: { docs: "https://www.cockroachlabs.com/docs/stable/transactions.html" },
    },
    {
      id: "foundationdb",
      name: "FoundationDB",
      type: "platform",
      languages: ["go", "java", "python"],
      description:
        "Provides strict serializability (external consistency) by default via optimistic concurrency: conflicting transactions are aborted at commit and the client library transparently retries the transaction body.",
      links: { docs: "https://apple.github.io/foundationdb/developer-guide.html#transaction-basics" },
    },
  ],

  usedInSystems: [
    {
      systemId: "banking-ledger",
      systemName: "Banking / ledger transfers",
      howUsed:
        "A transfer that must keep an account balance above zero is a write-skew hazard: two concurrent withdrawals can each read a sufficient balance and both succeed, overdrawing the account. Ledgers run the transfer at SERIALIZABLE or lock the balance row with FOR UPDATE so the constraint holds under concurrency.",
    },
    {
      systemId: "booking-inventory",
      systemName: "Booking / inventory systems",
      howUsed:
        "Double-booking a meeting room or overselling the last seat is textbook write skew — two transactions read 'the slot is free' and both reserve it. Systems materialize the conflict with a lock on the resource row, or use SERIALIZABLE so one booking aborts and retries.",
    },
  ],

  philosophy: {
    coreProblem:
      "Concurrent transactions can corrupt each other's view of the data in ways application code never anticipates, and the corruption is invisible until it has already been committed. The hard part is that the dangerous anomalies — lost update and especially write skew — do not involve two writers touching the same row, so naive intuition about 'conflicts' misses them entirely.",
    designPrinciple:
      "Isolation levels are a leaky, historically-accreted set of guarantees, and the names lie. Do not trust the label — know exactly which anomaly the level you selected actually permits on your specific engine, and protect each invariant explicitly: either climb to a level that forbids the anomaly, or materialize the conflict with a lock so the database can see it.",
    historicalContext:
      "The four ANSI SQL-92 isolation levels were defined by the phenomena they forbid, but Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil showed in 1995 ('A Critique of ANSI SQL Isolation Levels') that the definitions were ambiguous and failed to capture snapshot isolation and write skew — anomalies real MVCC systems exhibit. Kleppmann later popularized write skew as the canonical reason snapshot isolation is not serializable.",
    alternativesRejected: [
      "Trusting the level name at face value — Oracle's 'SERIALIZABLE' is snapshot isolation, so write skew survives the highest named rung",
      "Running everything at SERIALIZABLE by default — correct but pays throughput in lock contention or abort-and-retry even where cheaper rungs suffice",
      "Hand-rolling check-then-act guards in application code without a lock — the exact shape that produces lost updates and write skew",
    ],
    mentalModel:
      "Isolation is a dial between throughput and truth. Every rung you climb buys away one more class of anomaly at the cost of concurrency. Snapshot isolation freezes a photograph of the database, which fixes what you SEE but not what two of you can DO from the same photo — that gap is write skew, and closing it takes either a real serializable level or a lock that turns the invisible premise into a visible row.",
  },

  references: [
    {
      title: "Designing Data-Intensive Applications — Ch. 7 (Transactions)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "A Critique of ANSI SQL Isolation Levels",
      url: "https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/",
      type: "research-paper",
      author: "Berenson, Bernstein, Gray, Melton, O'Neil, O'Neil",
    },
    {
      title: "PostgreSQL Documentation — Transaction Isolation",
      url: "https://www.postgresql.org/docs/current/transaction-iso.html",
      type: "documentation",
    },
  ],

  tags: [
    "database",
    "transactions",
    "isolation",
    "concurrency",
    "consistency",
    "write-skew",
    "serializable",
    "mvcc",
    "kleppmann",
  ],

  difficulty: "advanced",
};
