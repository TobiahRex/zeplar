# Chapter 2: Data Models and Query Languages

> **Source Material:** [Full chapter notes](../../source-notes.md#data-models-and-query-language) (lines 200-381)

## Overview

Data models are the most important part of developing software. They affect not just how the software is written, but how we *think* about the problem. Each layer hides the complexity of the layers below by providing a clean data model.

## Core Concepts

### Relational vs Document Models

**Relational Model:**
- Tables, rows, joins, normalization
- Better support for many-to-one and many-to-many relationships
- Query optimizer handles access paths automatically
- *Shredding*: breaking document-like data into tables

**Document Model (NoSQL):**
- JSON/BSON, denormalization, schema flexibility
- Better *locality*: all relevant data in one place
- Reduces *impedance mismatch* between code and storage
- Poor support for joins (must emulate in application code)

**Key insight:** If your data has a document-like structure (one-to-many tree), use document model. If you need many-to-many relationships, relational model wins.

### Schema-on-Read vs Schema-on-Write

| Approach | Analogy | When to Use |
|----------|---------|-------------|
| Schema-on-write | Static typing | Homogeneous data, strict contracts |
| Schema-on-read | Dynamic typing | Heterogeneous data, external sources |

### Query Languages

- **Declarative (SQL):** Specify *what* you want, not *how*
- **Imperative:** Specify exact operations in order
- Declarative enables parallel execution and optimizer improvements

### Graph Data Models

For highly connected data with many-to-many relationships:

**Property Graphs (Neo4j, Titan):**
- Vertices with properties and edges
- Edges have direction, label, and properties
- Cypher query language

**Triple-Stores (Datomic, AllegroGraph):**
- Subject-predicate-object statements
- SPARQL query language
- Foundation: Datalog

## Structures & Behaviors

**Prerequisite Structures:**

| Structure | What It Is | If Unfamiliar |
|-----------|------------|---------------|
| **Normalization** | Eliminating data redundancy through table decomposition | Database design fundamentals |
| **Joins** | Combining rows from multiple tables | SQL basics |
| **Impedance mismatch** | Disconnect between in-memory objects and relational tables | ORM concepts |
| **Tree structures** | Hierarchical one-to-many relationships | Data structures basics |
| **Graph theory** | Vertices and edges representing entities and relationships | Discrete mathematics |

**Behaviors Given These Structures:**

| Behavior | Emerges From | Manifestation |
|----------|--------------|---------------|
| Query optimization | Declarative queries + indexes | Database chooses efficient access path |
| Locality benefits | Denormalized documents | Single query retrieves all related data |
| Schema flexibility | Schema-on-read | Application handles heterogeneous data |
| Traversal queries | Graph model + edges | Find paths between distant entities |

## Key Examples from the Book

### LinkedIn Profile (Document Model)

A resume-like structure with one-to-many relationships:
- One person → many jobs, education entries, contact info
- Document model handles this naturally
- Relational model requires multiple tables + joins

### Bill of Materials (Graph Model)

A part can be a component of many assemblies; an assembly can contain many parts. The many-to-many structure suits graph representation.

## Practical Exercises

- [ ] **Model comparison**: Design the same domain in PostgreSQL, MongoDB, and Neo4j
- [ ] **Query complexity**: Write queries for common access patterns in each model
- [ ] **Join performance**: Measure the cost of emulating joins in document databases
- [ ] **MapReduce vs Aggregation**: Compare MongoDB's MapReduce with aggregation pipeline

## Discussion Questions

1. When would you choose document model despite needing some many-to-many relationships?
2. Why does the book argue that relational and document databases are converging?
3. How does the network model (CODASYL) differ from modern graph databases?
4. Why are declarative query languages better suited for parallelism?

## Connections to Other Chapters

| Concept | Related Chapters |
|---------|-----------------|
| Data locality | Ch 3 (Storage), Ch 6 (Partitioning) |
| Query optimization | Ch 3 (Indexes) |
| Schema evolution | Ch 4 (Encoding) |
| Graph processing | Ch 10 (Batch Processing) |
