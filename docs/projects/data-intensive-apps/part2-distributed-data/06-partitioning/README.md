# Chapter 6: Partitioning

> **Source Material:** [Full chapter notes](../../source-notes.md#partitioning) (lines 1046-1138)

## Overview

Partitioning (sharding) breaks large datasets across multiple nodes. Combined with replication, it enables both scalability and fault tolerance. The goal: spread data and query load evenly.

## Core Concepts

### Partitioning Strategies

| Strategy | How It Works | Pros | Cons |
|----------|--------------|------|------|
| **Key range** | Continuous ranges (A-M, N-Z) | Efficient range queries | Risk of hot spots |
| **Hash** | Hash of key determines partition | Even distribution | No range queries |
| **Compound** | Hash first part, sort by second | Balance of both | More complex |

### Hot Spots

Even with hash partitioning, hot spots can occur:
- Celebrity accounts (many followers)
- Viral content
- Time-based access patterns

**Mitigation:** Add random suffix to hot keys, but requires application-level aggregation on reads.

### Secondary Indexes

| Approach | Description | Read | Write |
|----------|-------------|------|-------|
| **Document-partitioned (local)** | Each partition maintains own index | Scatter/gather to all partitions | Fast (local update) |
| **Term-partitioned (global)** | Index partitioned separately | Query single partition | Slow (distributed update) |

### Rebalancing Strategies

| Strategy | Description | Used By |
|----------|-------------|---------|
| **Fixed partitions** | Create more partitions than nodes, redistribute | Riak, Elasticsearch, Couchbase |
| **Dynamic partitioning** | Split/merge based on size | HBase, MongoDB |
| **Proportional to nodes** | Fixed partitions per node | Cassandra |

**Anti-pattern:** `hash(key) mod N` — changing N moves almost all data.

### Request Routing (Service Discovery)

1. **Any node:** Contact any node, it forwards if needed
2. **Routing tier:** Partition-aware load balancer
3. **Client-aware:** Client knows partition assignment

**Coordination services:** ZooKeeper, etcd track partition→node mapping. Nodes register themselves; clients/routers subscribe to updates.

**Gossip protocol:** Cassandra, Riak use peer-to-peer gossip instead of central coordinator.

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Consistent hashing** | Hash ring for partition assignment | Distributed hash tables |
| **Scatter/gather** | Query all partitions, aggregate results | Distributed query patterns |
| **Service discovery** | Finding which node serves what | ZooKeeper, Consul basics |
| **Gossip protocols** | Peer-to-peer information dissemination | Epidemic algorithms |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Horizontal scaling | Even partition distribution | Add nodes to handle more load |
| Hot spot mitigation | Hash partitioning | Uniform request distribution |
| Range query support | Key-range partitioning | Efficient scans for time-series |
| Automatic rebalancing | Dynamic partitioning | System adapts to data growth |
| Partition awareness | Client-side routing | Reduced hop latency |

## Key Design Decisions

### Hash vs Range Partitioning

```
Hash:  Good for point queries, bad for range
Range: Good for range queries, bad for hot spots

Example: Time-series data
- Range by timestamp: All writes go to latest partition (hot spot!)
- Hash by sensor_id: Even writes, but range query hits all partitions
- Compound (sensor_id, timestamp): Best of both
```

### Local vs Global Secondary Indexes

```
Local index (document-partitioned):
  + Writes are fast (single partition)
  - Reads scatter/gather (tail latency)

Global index (term-partitioned):
  + Reads are fast (single partition)
  - Writes update multiple partitions (async, eventual consistency)
```

## Practical Exercises

- [ ] **Partition data in Cassandra**: Observe token distribution
- [ ] **Hot spot simulation**: Create skewed workload, measure partition load
- [ ] **Implement consistent hashing**: Handle node addition/removal
- [ ] **Scatter/gather query**: Measure latency vs number of partitions

## Discussion Questions

1. Why is `mod N` partitioning problematic for rebalancing?
2. When would you choose document-partitioned over term-partitioned indexes?
3. How does the number of partitions affect scatter/gather latency?
4. What are the trade-offs of using ZooKeeper vs gossip for partition discovery?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Replication per partition | Ch 5 (Replication) |
| Partitioned transactions | Ch 7 (Distributed transactions) |
| Request routing | Ch 9 (Service discovery) |
| Partitioned stream processing | Ch 11 (Kafka partitions) |
