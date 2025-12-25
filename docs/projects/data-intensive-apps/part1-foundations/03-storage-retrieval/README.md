# Chapter 3: Storage and Retrieval

> **Source Material:** [Full chapter notes](../../source-notes.md#storage-and-retrieval) (lines 383-565)

## Overview

Databases fundamentally do two things: store data and retrieve it. Understanding how storage engines work internally helps you select and tune the right database for your workload.

## Core Concepts

### Log-Structured Storage (LSM-Trees)

**Basic Idea:** Append-only writes, periodic compaction

1. **Hash Index**: In-memory hash map pointing to byte offsets in log file
   - Bitcask (Riak) uses this approach
   - All keys must fit in RAM; values on disk

2. **SSTables (Sorted String Tables)**:
   - Key-value pairs sorted by key
   - Enables efficient merging (like mergesort)
   - Sparse in-memory index sufficient

3. **LSM-Tree (Log-Structured Merge-Tree)**:
   - In-memory *memtable* (balanced tree)
   - Flush to SSTable when threshold reached
   - Background compaction merges SSTables
   - **Bloom filters** optimize lookups for non-existent keys

**Compaction Strategies:**
- *Size-tiered*: Newer/smaller SSTables merge into older/larger ones
- *Leveled*: Key range split across levels, less disk space needed

### Page-Oriented Storage (B-Trees)

- Fixed-size *pages* (typically 4KB) organized as tree
- *In-place updates* (contrast with append-only)
- *Write-ahead log (WAL)* for crash recovery
- *Latches* (lightweight locks) for concurrency

**B-Tree vs LSM-Tree:**

| Aspect | B-Tree | LSM-Tree |
|--------|--------|----------|
| Writes | Slower (in-place) | Faster (sequential append) |
| Reads | Faster (single location) | Slower (check multiple SSTables) |
| Space | More fragmentation | Better compression |
| Predictability | More consistent latency | Compaction can spike |

### OLTP vs OLAP

| Characteristic | OLTP | OLAP |
|----------------|------|------|
| Access pattern | Many small reads/writes | Few large scans |
| Query type | Point lookups | Aggregations |
| Data freshness | Current | Historical |
| Storage | Row-oriented | Column-oriented |

### Column-Oriented Storage

- Store values from each *column* together (not rows)
- Excellent compression via *bitmap encoding*
- Perfect for analytical queries touching few columns
- *Vectorized processing* for CPU efficiency
- Writes are difficult (often use LSM approach)

### Data Warehousing

- Separate from OLTP for performance isolation
- ETL: Extract-Transform-Load from OLTP sources
- *Star schema*: Fact table surrounded by dimension tables
- *Materialized views*: Precomputed aggregations

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Hash tables** | O(1) key-value lookup | Data structures fundamentals |
| **Balanced trees** | O(log n) sorted operations | Red-black or AVL trees |
| **Write-ahead logging** | Durability before acknowledgment | Database internals |
| **Bloom filters** | Probabilistic set membership | Probabilistic data structures |
| **Compression algorithms** | Reduce storage size | Run-length, dictionary encoding |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Fast sequential writes | Append-only log | LSM-trees outperform B-trees for writes |
| Efficient range queries | Sorted keys | B-trees and SSTables enable scans |
| Crash recovery | WAL + checkpointing | Database survives unexpected shutdown |
| Analytical performance | Column storage + vectorization | Orders of magnitude faster OLAP |
| Write amplification | Compaction / page rewrites | Multiple disk writes per logical write |

## Key Examples from the Book

### Bitcask (Riak)

Simple but effective: hash map in memory, append-only log on disk. Works when:
- All keys fit in RAM
- High write volume per key
- Values can be large

### Lucene (Elasticsearch/Solr)

Uses SSTable-like structure for term dictionary. Full-text search as a specialized index problem.

## Practical Exercises

- [ ] **Build a simple LSM**: Implement memtable → SSTable → compaction
- [ ] **Measure write amplification**: Compare writes to disk vs logical writes
- [ ] **Column store experiment**: Compare row vs column storage for analytics
- [ ] **Bloom filter implementation**: Reduce disk reads for missing keys

## Discussion Questions

1. Why can't hash indexes support efficient range queries?
2. What happens if LSM-tree compaction can't keep up with writes?
3. Why do B-trees need latches but LSM-trees generally don't?
4. When would you choose row-oriented over column-oriented storage for analytics?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Compaction | Ch 5 (Replication log compaction) |
| B-tree structure | Ch 6 (Partitioning by key range) |
| Write-ahead logging | Ch 7 (Transactions), Ch 9 (Consensus) |
| Compression | Ch 4 (Encoding formats) |
