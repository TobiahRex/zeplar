# Chapter 9: Consistency and Consensus

> **Source Material:** [Full chapter notes](../../source-notes.md#consistency-and-consensus) (lines 1552-1798)

## Overview

Getting multiple nodes to agree on something is the fundamental problem of distributed computing. This chapter explores consistency models, the famous CAP theorem, and consensus algorithms that underpin coordination services like ZooKeeper.

## Core Concepts

### Consistency Models

| Model | Guarantee | Cost |
|-------|-----------|------|
| **Linearizability** | Behaves like single copy of data | Coordination overhead |
| **Sequential consistency** | Operations in some total order | Less than linearizable |
| **Causal consistency** | Respects cause-effect ordering | No coordination for concurrent ops |
| **Eventual consistency** | Replicas converge eventually | Minimal coordination |

### Linearizability

*"Appears as if there is only one copy of the data, and all operations are atomic."*

- Once a read returns a value, all subsequent reads must return that value or newer
- Compare-and-set is atomic
- **Not the same as serializability** (transaction isolation)

**Uses:**
- Leader election (all nodes agree on leader)
- Uniqueness constraints
- Cross-channel timing dependencies

### CAP Theorem

*"During a network partition, choose Consistency or Availability."*

| If Partitioned... | Consistent | Available |
|-------------------|------------|-----------|
| Linearizable | ✓ | ✗ (unavailable) |
| Non-linearizable | ✗ | ✓ (keep serving) |

**Reality:** CAP is about the *tradeoff during partitions*. Most of the time, there's no partition. The real tradeoff is **latency** — linearizability is slow even without partitions.

### Ordering Guarantees

**Total order:** All operations can be compared (like integers)
**Partial order:** Some operations are concurrent (incomparable)

**Linearizability implies total order.** Causality implies partial order.

### Lamport Timestamps

- Pair of (counter, node_id)
- Each node tracks maximum counter seen
- Provides total order consistent with causality
- **Limitation:** Can only determine order after the fact

### Total Order Broadcast

- Reliable delivery (if delivered to one, delivered to all)
- Totally ordered delivery (same order at all nodes)
- **Equivalent to consensus** (repeated rounds of agreeing)

### Consensus Algorithms

**Properties:**
- *Uniform agreement:* All nodes decide the same value
- *Integrity:* No node decides twice
- *Validity:* Decided value was proposed
- *Termination:* Non-crashed nodes eventually decide

**Major algorithms:** Paxos, Raft, Zab, Viewstamped Replication

### Two-Phase Commit (2PC)

**Phase 1 (Prepare):** Coordinator asks "Can you commit?"
**Phase 2 (Commit/Abort):** If all yes → commit; any no → abort

**Problem:** If coordinator crashes after prepare, participants are stuck. *Blocking protocol.*

### Distributed Transactions

**XA standard:** Cross-system atomic commit
- Supported by PostgreSQL, MySQL, message brokers
- Locks held during uncertainty → availability impact
- Orphaned transactions require manual intervention

### Coordination Services (ZooKeeper)

**Features:**
- Linearizable atomic operations
- Total ordering (fencing tokens via zxid)
- Failure detection (ephemeral nodes)
- Change notifications (watches)

**Use cases:**
- Leader election
- Service discovery
- Distributed locks
- Configuration management

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Total order** | Every pair comparable | Order theory basics |
| **Lamport clocks** | Logical time for causality | Vector clocks |
| **Quorum** | Majority vote requirement | Distributed voting |
| **State machine replication** | Replicas apply same commands | RSM fundamentals |
| **Epochs/terms** | Leader tenure numbering | Raft basics |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Single source of truth | Linearizability | No conflicting concurrent updates |
| Leader election | Consensus | Cluster survives leader failure |
| Fencing | Epoch numbers | Old leaders can't corrupt data |
| Exactly-once semantics | Total order broadcast + dedup | Reliable message processing |
| Configuration changes | ZooKeeper watches | Dynamic cluster membership |

## Key Algorithms

### Raft (Simplified Consensus)

1. Leader election via randomized timeouts
2. Log replication to followers
3. Committed when majority acknowledge
4. New leader catches up with highest log

### Paxos

- Prepare phase: Acquire "ballot number" lock
- Accept phase: Propose value to acceptors
- Learn phase: Notify learners of decided value
- More complex but foundational

## Practical Exercises

- [ ] **Deploy etcd cluster**: Observe Raft leader election
- [ ] **Implement distributed lock**: Use ZooKeeper with fencing tokens
- [ ] **Simulate 2PC failure**: Crash coordinator mid-commit
- [ ] **Compare ZooKeeper vs Consul**: Leader election behavior

## Discussion Questions

1. Why is linearizability slow even without network partitions?
2. How does total order broadcast relate to consensus?
3. Why is 2PC blocking while Paxos/Raft are not?
4. When would you use causal consistency instead of linearizability?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Replication consistency | Ch 5 (Replication lag) |
| Transaction isolation | Ch 7 (Serializability) |
| Network failures | Ch 8 (Trouble) |
| Coordination in streaming | Ch 11 (Exactly-once) |
