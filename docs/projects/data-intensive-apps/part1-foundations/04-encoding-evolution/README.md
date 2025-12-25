# Chapter 4: Encoding and Evolution

> **Source Material:** [Full chapter notes](../../source-notes.md#encoding-and-evolution) (lines 567-726)

## Overview

Systems must evolve over time. This chapter addresses how data outlives code: how to encode data for storage and transmission, and how to handle schema changes gracefully.

## Core Concepts

### Encoding (Serialization)

**In-memory representation** ↔ **Byte sequence** (for storage/network)

**Text Formats (JSON, XML, CSV):**
- Human-readable
- Widely supported
- Issues: number ambiguity, no binary strings, verbose

**Binary Formats:**
- More compact
- Faster to parse
- Include schema information

### Binary Encoding Libraries

| Format | Field Identification | Key Features |
|--------|---------------------|--------------|
| **Thrift (BinaryProtocol)** | Field tags (numbers) | Two protocols available |
| **Thrift (CompactProtocol)** | Packed tag + type | More compact |
| **Protocol Buffers** | Field tags | Similar to Thrift Compact |
| **Avro** | Schema order | No tags in data, schema resolution |

### Schema Evolution

**Forward Compatibility:** New code can read old data
**Backward Compatibility:** Old code can read new data

**Rules for Thrift/Protocol Buffers:**
- New fields must be optional or have defaults
- Never reuse a tag number
- Can only remove optional fields
- Changing types risks truncation

**Avro's Approach:**
- Writer's schema vs reader's schema
- Avro library resolves differences
- Friendlier to dynamically generated schemas

### Modes of Dataflow

**1. Via Databases:**
- Writer encodes, reader decodes
- Data outlives code versions
- Must handle: new code writes, old code reads

**2. Via Services (RPC/REST):**
- Service-oriented architecture
- RPC pitfalls: network ≠ local function call
- Need timeout, retry, idempotence handling

**3. Via Message Passing:**
- Asynchronous communication
- Message broker provides: buffering, redelivery, decoupling
- Actor model: message passing within/between processes

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Serialization** | Converting objects to bytes | Language-specific marshalling |
| **Schema** | Formal description of data structure | DDL, IDL basics |
| **Field tags** | Numeric identifiers for fields | Protocol Buffers tutorials |
| **Message brokers** | Intermediary for async messaging | RabbitMQ, Kafka concepts |
| **Actor model** | Concurrency via message passing | Akka, Erlang basics |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Rolling upgrades | Forward + backward compatibility | Deploy without downtime |
| Schema documentation | Required schema definitions | Always up-to-date documentation |
| Loose coupling | Message broker + async | Services evolve independently |
| Compile-time safety | Code generation from schema | Type errors caught early |
| Dynamic schema evolution | Avro's schema resolution | Database schema → encoding automatically |

## Key Comparisons

### RPC vs REST

| Aspect | RPC | REST |
|--------|-----|------|
| Abstraction | Function calls | Resources + HTTP verbs |
| Debugging | Harder | Easier (curl, browser) |
| Use case | Internal services | Public APIs |
| Latency hiding | Varies | Explicit network awareness |

### Message Brokers vs Direct RPC

| Aspect | Message Broker | Direct RPC |
|--------|----------------|------------|
| Coupling | Loose | Tight |
| Availability | Buffer during downtime | Caller must handle failures |
| Delivery | At-least-once possible | Best effort or explicit retry |
| Scaling | Natural load balancing | Client-side balancing |

## Key Examples from the Book

### Database Schema Migration

Adding a column with NULL default avoids rewriting existing data. Old rows return NULL for new column when read.

### LinkedIn's Espresso

Uses Avro for schema evolution in their document store. Writer schema stored with each record; reader schema negotiated at read time.

## Practical Exercises

- [ ] **Schema evolution test**: Evolve a Protobuf/Avro schema through 3 versions
- [ ] **Compatibility matrix**: Test all combinations of reader/writer versions
- [ ] **Encoding size comparison**: Same data in JSON, Protobuf, Avro
- [ ] **RPC timeout handling**: Implement retry with exponential backoff and idempotence

## Discussion Questions

1. Why are language-specific serialization formats (Java Serializable, pickle) a bad idea?
2. What makes Avro better suited for dynamic schemas than Protobuf?
3. Why is "fire and forget" messaging more robust than synchronous RPC?
4. How do you ensure exactly-once semantics with at-least-once message delivery?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Schema evolution | Ch 5 (Replication log format) |
| Message passing | Ch 11 (Stream Processing) |
| Idempotence | Ch 7 (Transactions), Ch 11 (Exactly-once) |
| Data outliving code | Ch 12 (Future systems, event sourcing) |
