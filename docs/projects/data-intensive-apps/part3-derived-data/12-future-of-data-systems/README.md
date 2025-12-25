# Chapter 12: The Future of Data Systems

> **Source Material:** [Full chapter notes](../../source-notes.md#the-future-of-data-systems) (lines 2296-2569)

## Overview

This chapter synthesizes the book's themes and looks forward. It addresses data integration, correctness in dataflow systems, and crucially—the ethical responsibilities of engineers who build systems that affect people's lives.

## Core Concepts

### Data Integration

**The problem:** Multiple specialized datastores (search, analytics, cache) must stay in sync.

**Approaches:**

| Approach | Ordering | Exactly-Once | Complexity |
|----------|----------|--------------|------------|
| **Distributed transactions** | Locks | Atomic commit | High coordination |
| **Log-based (CDC/event sourcing)** | Total order broadcast | Idempotence | Lower coordination |

**Log-based wins for integration:** Deterministic, replayable, loose coupling.

### Batch and Stream Convergence

- Batch: Bounded input, reprocess all
- Stream: Unbounded input, incremental processing
- **Unification:** Same processing logic for both (Flink, Beam)

**Derived data advantage:**
- Maintain old and new views simultaneously
- Gradual migration without big-bang cutover
- Time travel through historical data

### Lambda Architecture Critique

Two systems (batch + stream) with same logic:
- Hard to maintain consistency
- Different code paths, subtle bugs
- **Solution:** Unified stream processor that handles both

### Unbundling Databases

Databases bundle many features: storage, indexing, query optimization, transactions.

**Unbundling approach:**
- Specialized components for each concern
- Compose via log-based dataflow
- More flexibility, integration complexity

**Federated databases:** Unified reads (query across systems)
**Unbundled databases:** Unified writes (sync via event log)

### Designing for Correctness

**End-to-end argument:**
- Low-level reliability (TCP, disk) isn't enough
- Application-level checks still needed
- Include request ID from client through to database

**Idempotence + exactly-once:**
- Operation safe to repeat
- Unique ID per operation
- Fencing to prevent stale writes

**Timeliness vs Integrity:**

| Property | Meaning | Violation |
|----------|---------|-----------|
| **Timeliness** | See up-to-date state | Eventual consistency |
| **Integrity** | No corruption, no data loss | Permanent inconsistency |

Integrity is more critical than timeliness.

### Coordination-Avoiding Systems

**Key insight:** Many constraints (even uniqueness) can be enforced without coordination.

- Stream processor enforces uniqueness via partitioned log
- Single partition = total order = no coordination
- Async but still correct

### Auditing and Trust

**Don't blindly trust:**
- Test backups by restoring them
- Self-auditing systems check own integrity
- Cryptographic proofs (Merkle trees) can verify data

**Immutable logs + event sourcing** enable full audit trails.

### Ethics and Privacy

**Data is about people.** The chapter addresses:
- Surveillance capitalism
- Algorithmic bias and accountability
- Consent and power asymmetry
- Privacy as freedom to choose what to reveal

**Key questions engineers should ask:**
- Could this system harm people?
- Is consent meaningful?
- Who benefits from this data?
- What happens when this data is used by future governments?

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Log-based integration** | Single source of truth via event log | Ch 11 concepts |
| **Derived data** | Views computed from primary data | Materialized views |
| **End-to-end semantics** | Guarantees from client to storage | Distributed systems |
| **Merkle trees** | Cryptographic verification structure | Blockchain basics |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Loose coupling | Log-based async | Systems evolve independently |
| Gradual evolution | Multiple derived views | No-downtime migrations |
| Self-healing | Replayable logs | Rebuild corrupted derived data |
| Audit trails | Immutable event log | Full reconstruction of history |
| Correctness without coordination | Partitioned determinism | High throughput + strong guarantees |

## Design Principles Summary

1. **Immutability:** Append-only logs, event sourcing
2. **Derived data:** Compute views from single source of truth
3. **Asynchrony:** Decouple systems, improve robustness
4. **Idempotence:** Make operations safe to retry
5. **End-to-end:** Don't rely only on infrastructure guarantees
6. **Ethics:** Consider human impact of systems we build

## Discussion Questions

1. Why might log-based systems be more robust than distributed transactions?
2. How does the "unbundled database" approach compare to traditional monolithic databases?
3. What's the difference between timeliness and integrity violations?
4. How should engineers balance business demands with ethical concerns?
5. What does "coordination-avoiding" mean for system performance?

## Key Takeaways from the Entire Book

| Theme | Lesson |
|-------|--------|
| **Trade-offs everywhere** | No silver bullets; understand what you're giving up |
| **Distributed is different** | Networks, clocks, and processes all lie |
| **Consistency has costs** | Stronger guarantees = more coordination = less performance |
| **Logs are powerful** | Append-only, replayable, auditable |
| **Data outlives code** | Schema evolution, backward compatibility matter |
| **Ethics matter** | We're building systems that affect real people |

## Practical Exercises

- [ ] **Design event-sourced system**: Full CQRS architecture
- [ ] **Implement "right to be forgotten"**: In event-sourced system
- [ ] **Build self-auditing**: Merkle tree verification for data integrity
- [ ] **Unified batch/stream**: Same logic in both modes (Flink/Beam)

## Connections to All Chapters

This chapter synthesizes:
- Ch 1: Reliability, scalability, maintainability as ongoing concerns
- Ch 3-4: Storage and encoding foundations
- Ch 5-6: Replication and partitioning for scale
- Ch 7: Transaction guarantees vs coordination costs
- Ch 8-9: Distributed systems reality vs consistency desires
- Ch 10-11: Batch and stream as complementary paradigms

---

## Final Thought

> *"We should stop regarding users as metrics to be optimized, and remember that they are humans who deserve respect, dignity, and agency."*
> — Martin Kleppmann
