# Chapter 5: Replication

> **Source Material:** [Full chapter notes](../../source-notes.md#replication) (lines 728-1044)

## Overview

Replication means keeping copies of the same data on multiple machines. Reasons: proximity to users, availability, increased read throughput. The difficulty lies in handling *changes* to replicated data.

## Core Concepts

### Replication Architectures

| Architecture | Leaders | Use Case | Conflict Handling |
|--------------|---------|----------|-------------------|
| **Single-leader** | 1 | Most common | None (writes go to leader) |
| **Multi-leader** | Multiple | Multi-datacenter | Required |
| **Leaderless** | None | High availability | Required (quorums) |

### Single-Leader Replication

**Flow:** Client → Leader → Followers (via replication log)

**Synchronous vs Asynchronous:**
- *Synchronous*: Follower confirmed before ack to client (durable but slow)
- *Asynchronous*: Leader acks immediately (fast but may lose data)
- *Semi-synchronous*: One follower sync, rest async

**Replication Log Implementations:**
1. *Statement-based*: Log SQL statements (problematic with NOW(), RAND())
2. *WAL shipping*: Send write-ahead log (couples to storage engine)
3. *Logical (row-based)*: Log row changes (decoupled, enables CDC)
4. *Trigger-based*: Application-level (flexible but slow)

### Handling Node Failures

**Follower failure:** Catch-up recovery from log position

**Leader failure (Failover):**
1. Detect leader failure (timeout)
2. Choose new leader (most up-to-date replica)
3. Reconfigure system

**Failover pitfalls:**
- Async followers may lack recent writes
- Split-brain: two nodes believe they're leader
- Stale reads during transition

### Replication Lag Problems

With async replication, followers may be behind:

| Problem | Description | Solution |
|---------|-------------|----------|
| **Reading your writes** | User doesn't see own update | Read from leader for own data |
| **Monotonic reads** | Time appears to go backward | Sticky sessions to same replica |
| **Consistent prefix** | Causally related writes out of order | Write related data to same partition |

### Multi-Leader Replication

**Use cases:**
- Multi-datacenter operation
- Clients with offline operation (mobile apps)
- Collaborative editing

**Conflict resolution:**
- *Last Write Wins (LWW)*: Timestamp-based, loses data
- *Merge values*: Application-specific logic
- *Record conflict*: Let user resolve later

**Topologies:** All-to-all, circular, star

### Leaderless Replication (Dynamo-style)

**Quorum reads and writes:** `w + r > n` ensures overlap

- Write to `w` nodes, read from `r` nodes
- Version numbers detect stale data
- *Read repair*: Client fixes stale replicas on read
- *Anti-entropy*: Background sync process

**Sloppy quorum:** Accept writes even if some home nodes unavailable
**Hinted handoff:** Forward to home nodes when they recover

### Detecting Concurrent Writes

- *Happens-before* relationship defines causality
- Operations are *concurrent* if neither happens before the other
- *Version vectors*: Track versions per replica per key
- Merge *siblings* (concurrent values) in application code

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Replication log** | Ordered sequence of write operations | Database internals |
| **Quorum** | Minimum votes needed for decision | Distributed systems basics |
| **Vector clocks** | Logical time across multiple nodes | Lamport clocks |
| **Tombstones** | Markers for deleted data | Soft delete patterns |
| **CRDTs** | Conflict-free replicated data types | Distributed data structures |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Eventual consistency | Async replication | Temporary read inconsistency |
| Read-your-writes | Routing to leader | User sees own updates immediately |
| Partition tolerance | Multiple leaders/leaderless | System operates during network splits |
| Conflict resolution | Version vectors + merge | Concurrent writes don't lose data |
| Write availability | Sloppy quorums | Writes succeed during partial failures |

## Key Examples from the Book

### Dynamo-style Databases

Riak, Cassandra, Voldemort: Leaderless with tunable consistency. Client sends to all replicas, uses quorum for response.

### CouchDB Offline-First

Each device is a leader. Sync when online. Conflicts stored as document revisions for later resolution.

## Practical Exercises

- [ ] **Set up PostgreSQL streaming replication**: Observe lag under load
- [ ] **Simulate failover**: Kill leader, measure recovery time
- [ ] **Quorum experiment**: With n=3, try different w/r combinations
- [ ] **Conflict simulation**: Create concurrent writes, observe resolution

## Discussion Questions

1. Why might you choose async replication despite the risk of data loss?
2. When is multi-leader replication worth the complexity?
3. How does read repair work, and what are its limitations?
4. Why can't `w + r > n` guarantee linearizability?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Consistency models | Ch 7 (Transactions), Ch 9 (Linearizability) |
| Partitioning + replication | Ch 6 (Partitioning) |
| Conflict resolution | Ch 12 (Event sourcing) |
| Failure detection | Ch 8 (Distributed Systems Trouble) |
