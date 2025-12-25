# Chapter 7: Transactions

> **Source Material:** [Full chapter notes](../../source-notes.md#transactions) (lines 1140-1398)

## Overview

Transactions simplify error handling by grouping operations into a unit that either completely succeeds or completely fails. This chapter demystifies ACID guarantees and explores the spectrum of isolation levels.

## Core Concepts

### ACID Explained

| Property | Meaning | Common Misconception |
|----------|---------|---------------------|
| **Atomicity** | All-or-nothing execution | Not about concurrency |
| **Consistency** | Application invariants hold | Database can't guarantee this |
| **Isolation** | Concurrent txns don't interfere | Many levels exist |
| **Durability** | Committed data survives crashes | Single-node vs distributed differs |

### Isolation Levels

| Level | Prevents | Allows | Implementation |
|-------|----------|--------|----------------|
| **Read Uncommitted** | Nothing | Dirty reads | No locks on reads |
| **Read Committed** | Dirty reads, dirty writes | Non-repeatable reads | Row-level locks on writes |
| **Snapshot Isolation** | Non-repeatable reads | Write skew, phantoms | MVCC |
| **Serializable** | Everything | Nothing | Various (see below) |

### Race Conditions

**Dirty Read:** Reading uncommitted data
**Dirty Write:** Overwriting uncommitted data
**Non-repeatable Read:** Same query returns different results
**Lost Update:** Concurrent read-modify-write loses one update
**Write Skew:** Concurrent transactions make decisions on stale data
**Phantom:** New rows appear during transaction

### Snapshot Isolation (MVCC)

- Each transaction sees consistent snapshot of database
- Writers don't block readers; readers don't block writers
- Multi-version concurrency control: keep old versions
- Transaction ID determines visibility

**Lost Update Prevention:**
- Atomic operations (`UPDATE ... SET x = x + 1`)
- Explicit locking (`SELECT ... FOR UPDATE`)
- Automatic detection (abort and retry)
- Compare-and-set

### Serializability Implementations

| Approach | How It Works | Trade-off |
|----------|--------------|-----------|
| **Actual serial execution** | Single-threaded | Simple but limited throughput |
| **Two-phase locking (2PL)** | Read locks + write locks | Deadlocks, slow readers |
| **Serializable Snapshot Isolation (SSI)** | Optimistic, detect conflicts | Abort rate under contention |

### Two-Phase Locking (2PL)

- Shared locks for reads, exclusive locks for writes
- Locks held until transaction ends (hence "two-phase")
- Writers block readers; readers block writers
- **Predicate locks:** Lock matching rows (including future ones)
- **Index-range locks:** Practical approximation of predicate locks

### Serializable Snapshot Isolation (SSI)

- Optimistic: assume no conflicts, check at commit
- Detect stale reads (another txn committed writes)
- Detect writes affecting prior reads
- Abort conflicts rather than blocking

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Write-ahead log** | Durability mechanism | Recovery basics |
| **Locks (shared/exclusive)** | Concurrency control primitive | OS concurrency |
| **MVCC** | Multiple versions per row | PostgreSQL internals |
| **Deadlock detection** | Cycle detection in wait graph | Graph algorithms |
| **Phantoms** | Rows appearing mid-transaction | SQL standard |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Read-your-writes | Transaction isolation | Queries see own uncommitted writes |
| Deadlock | Lock cycles | Database aborts one transaction |
| Rollback | Atomicity + logging | Failed transaction leaves no trace |
| Consistent backups | Snapshot isolation | Backup reflects single point in time |
| Optimistic concurrency | SSI | High throughput under low contention |

## Key Examples from the Book

### Write Skew: On-Call Doctors

Two doctors both try to go off-call. Each checks "at least one on call", both see 2, both go off-call. Result: nobody on-call.

**Solution:** `SELECT ... FOR UPDATE` to lock the rows being checked.

### Phantom: Meeting Room Booking

Check for conflicting bookings, insert new booking. Concurrent inserts can both succeed because the check doesn't lock non-existent rows.

**Solution:** Predicate locks or materialized phantom rows.

## Practical Exercises

- [ ] **Reproduce isolation anomalies**: Dirty read, lost update, write skew
- [ ] **Compare isolation levels**: Same scenario at different levels
- [ ] **Measure 2PL overhead**: Throughput vs SSI under contention
- [ ] **Implement saga pattern**: Compensating transactions for distributed workflow

## Discussion Questions

1. Why is "Consistency" in ACID not really a database guarantee?
2. When is snapshot isolation insufficient? Give an example.
3. Why did databases avoid true serial execution until recently?
4. What's the difference between pessimistic and optimistic concurrency control?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Distributed transactions | Ch 9 (2PC, consensus) |
| Conflicts in replication | Ch 5 (Multi-leader conflicts) |
| Idempotence | Ch 11 (Exactly-once processing) |
| Durability | Ch 3 (WAL), Ch 8 (Crash recovery) |
