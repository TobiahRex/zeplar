# Chapter 10: Batch Processing

> **Source Material:** [Full chapter notes](../../source-notes.md#batch-processing) (lines 1800-1987)

## Overview

Batch processing takes large amounts of input data, processes it, and produces output. Unlike services (request/response) or streams (continuous), batch jobs run to completion on bounded datasets. MapReduce democratized this pattern.

## Core Concepts

### System Categories

| Type | Latency | Example |
|------|---------|---------|
| **Services (online)** | Milliseconds | Web server |
| **Batch processing (offline)** | Minutes to hours | Nightly ETL |
| **Stream processing (near-real-time)** | Seconds to minutes | Fraud detection |

### Unix Philosophy

The original batch processing paradigm:
1. Each program does one thing well
2. Programs work together via text streams
3. Compose complex workflows from simple tools

```bash
cat /var/log/nginx/access.log |
  awk '{print $7}' |
  sort |
  uniq -c |
  sort -r -n |
  head -n 5
```

**Key insight:** stdin/stdout as universal interface enables composition.

### MapReduce

**Distributed Unix pipes:**
- Input: Files on distributed filesystem (HDFS)
- Output: Files on distributed filesystem
- No side effects → easy retry on failure

**Phases:**
1. **Map:** Extract key-value pairs from input records
2. **Shuffle:** Sort and partition by key
3. **Reduce:** Aggregate values for each key

**HDFS:**
- Shared-nothing architecture
- NameNode tracks file blocks
- Data replicated across machines
- Computation moves to data

### Joins in MapReduce

| Join Type | How It Works |
|-----------|--------------|
| **Sort-merge join** | Both sides sorted by key, merge in reducer |
| **Broadcast join** | Small table loaded into memory on all mappers |
| **Partitioned hash join** | Same partition key → same reducer |

**Hot spots (skew):** Celebrity accounts cause reducer skew. Solution: *skewed join* replicates hot keys across reducers.

### Beyond MapReduce

**Problems with MapReduce:**
- Materializes intermediate state to HDFS
- Jobs can't start until predecessors complete
- Mappers often just read previous reducer output

**Dataflow engines (Spark, Flink, Tez):**
- Entire workflow as single job
- Operators more flexible than map/reduce
- Pipeline data without materialization
- Recompute on failure using lineage

### Batch Processing Outputs

**Not just reports:**
- Search indexes (Lucene)
- Machine learning models
- Key-value databases (for serving)
- Precomputed aggregations

**Pattern:** Build database files in batch, load atomically into serving layer.

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Distributed filesystem** | HDFS, GCS, S3 | Hadoop ecosystem |
| **MapReduce paradigm** | Map → Shuffle → Reduce | Functional programming patterns |
| **DAG scheduling** | Directed acyclic graph of tasks | Workflow orchestration |
| **Lineage** | Track data provenance | Spark RDDs |
| **Partitioning** | Divide data for parallelism | Ch 6 concepts |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Fault tolerance | Immutable input + recomputation | Jobs survive node failures |
| Horizontal scaling | Data parallelism + shuffle | Add nodes for larger datasets |
| Exactly-once processing | Deterministic + idempotent | Safe to retry failed tasks |
| Composability | Files as interface | Chain jobs into workflows |
| Batch-to-serving | Build indexes offline | Fresh data without downtime |

## Key Comparisons

### MapReduce vs MPP Databases

| Aspect | MapReduce | MPP (e.g., Redshift) |
|--------|-----------|----------------------|
| Schema | Schema-on-read | Schema-on-write |
| Data format | Raw files | Proprietary |
| Failure handling | Retry at task level | Abort entire query |
| Use case | Diverse ETL | SQL analytics |

### Materialization vs Pipelining

```
MapReduce: Job1 → HDFS → Job2 → HDFS → Job3
           [materialize]  [materialize]

Spark:     Stage1 → Stage2 → Stage3
           [pipeline unless shuffle required]
```

## Practical Exercises

- [ ] **Unix-style pipeline**: Analyze a log file with shell tools
- [ ] **Implement word count**: In MapReduce, then in Spark
- [ ] **Compare materialization**: Measure Spark vs MapReduce for multi-stage job
- [ ] **Build search index**: Use batch job to create Lucene index

## Discussion Questions

1. Why does MapReduce write intermediate results to HDFS?
2. When would you choose MapReduce over a dataflow engine like Spark?
3. How does moving computation to data reduce network traffic?
4. What makes batch processing easier to reason about than services?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Log-structured storage | Ch 3 (LSM-trees, compaction) |
| Schema evolution | Ch 4 (Encoding) |
| Partitioning for shuffle | Ch 6 (Hash partitioning) |
| Stream-batch unification | Ch 11 (Lambda architecture) |
