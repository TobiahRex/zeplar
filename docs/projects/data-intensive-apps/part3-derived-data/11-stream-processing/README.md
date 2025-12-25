# Chapter 11: Stream Processing

> **Source Material:** [Full chapter notes](../../source-notes.md#stream-processing) (lines 1989-2294)

## Overview

Stream processing handles unbounded data incrementally as it arrives. Unlike batch (bounded, reprocess entire dataset), streams process events continuously with low latency.

## Core Concepts

### Event Streams

**Event:** An immutable fact that happened at a point in time
**Producer/Publisher:** Generates events
**Consumer/Subscriber:** Processes events
**Topic/Stream:** Groups related events

### Messaging Systems

| Type | Durability | Ordering | Use Case |
|------|-----------|----------|----------|
| **Direct messaging** | None | Per-connection | UDP metrics, webhooks |
| **Message broker (AMQP)** | Memory/disk | Per-queue | Task queues |
| **Log-based (Kafka)** | Disk | Per-partition | Event sourcing |

### Log-Based Message Brokers

**Key insight:** A log is an append-only sequence that consumers read at their own pace.

- Messages identified by *offset* (position in log)
- Consumer tracks own position
- Reading doesn't delete message
- Replay possible by resetting offset

**Partitioned logs:**
- Partition for parallelism (like sharding)
- Ordering guaranteed within partition
- Consumer group: one consumer per partition

### Databases and Streams

**Change Data Capture (CDC):**
- Extract changes from database as event stream
- Source of truth → derived systems
- Makes database the leader, others are followers

**Log compaction:**
- Keep only most recent value per key
- Enables replaying history without unbounded storage
- Tombstones mark deletions

### Event Sourcing

*"Store events, not current state."*

- Append events to log, derive state by replay
- Full audit trail
- Events are immutable; can always rebuild state
- Distinguish *commands* (requests) from *events* (facts)

**CQRS (Command Query Responsibility Segregation):**
- Separate write model (events) from read model (derived views)
- Optimize reads without affecting writes

### Time in Streams

| Time Type | Source | Reliability |
|-----------|--------|-------------|
| **Event time** | Embedded in event | May be delayed, out of order |
| **Processing time** | When processed | Unreliable for semantics |
| **Ingestion time** | When received by broker | Compromise |

**Windows:**
- *Tumbling:* Fixed, non-overlapping (10:00-10:05, 10:05-10:10)
- *Hopping:* Fixed, overlapping (5-min window every 1 min)
- *Sliding:* All events within duration of each other
- *Session:* Activity-based, gaps end session

**Handling late events:**
1. Ignore (track dropped count)
2. Publish correction/update
3. Use watermarks to declare window complete

### Stream Joins

| Join Type | Description | State Required |
|-----------|-------------|----------------|
| **Stream-stream** | Join events from two streams | Window of recent events |
| **Stream-table** | Enrich events with lookup data | Local copy of table |
| **Table-table** | Maintain view of two changing tables | Full tables |

### Fault Tolerance

**Microbatching (Spark Streaming):**
- Treat small time windows as mini-batches
- Exactly-once within batch

**Checkpointing (Flink):**
- Periodically snapshot operator state
- Replay from checkpoint on failure

**Idempotence:**
- Make operations safe to retry
- Include unique IDs to detect duplicates
- Achieves effectively-once semantics

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Append-only log** | Ordered, immutable event sequence | Kafka basics |
| **Consumer offsets** | Position tracking per consumer | Message broker concepts |
| **Watermarks** | Progress markers for event time | Flink streaming |
| **Operator state** | In-memory data for processing | Stateful stream processing |
| **Exactly-once semantics** | No duplicates, no losses | Distributed transactions |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Replay capability | Immutable log + offsets | Reprocess history for bug fixes |
| Real-time derived views | CDC + stream processing | Materialized views stay current |
| Late event handling | Event time + watermarks | Accurate despite delays |
| Exactly-once processing | Checkpoints + idempotence | Correct aggregations |
| Decoupled systems | Log as buffer | Producer/consumer evolve independently |

## Key Patterns

### Event Sourcing vs CDC

| Aspect | Event Sourcing | CDC |
|--------|----------------|-----|
| Primary store | Event log | Traditional database |
| Events | Domain events | Low-level row changes |
| Design | Application-driven | Infrastructure-driven |

### Lambda Architecture

- Batch layer: Reprocess all data periodically
- Speed layer: Process recent data in real-time
- Serving layer: Merge batch + speed results

**Critique:** Maintaining two codepaths is painful. Modern stream processors can handle both.

## Practical Exercises

- [ ] **Set up Kafka**: Produce and consume messages
- [ ] **Implement CDC**: Debezium on PostgreSQL
- [ ] **Stream-table join**: Enrich events with dimension data
- [ ] **Window aggregation**: Tumbling window counts in Flink/ksqlDB

## Discussion Questions

1. When would you choose AMQP-style broker over log-based?
2. How does event sourcing differ from just keeping a changelog?
3. Why is event time harder than processing time?
4. What's the difference between at-least-once and exactly-once semantics?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Replication as stream | Ch 5 (Replication log) |
| Log compaction | Ch 3 (LSM compaction) |
| Distributed transactions | Ch 7, Ch 9 (2PC, consensus) |
| Batch/stream unification | Ch 10 (MapReduce), Ch 12 (Future) |
