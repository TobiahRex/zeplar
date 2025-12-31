import type { Pattern } from "../schema";

export const hashIndex: Pattern = {
  id: "hash-index",
  slug: "hash-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → #️⃣ Hash Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "Hash Index",
    emoji: "#️⃣",
    tagline: "Direct key lookup",
    definition:
      "Hash Index uses a hash function to map keys directly to storage locations, providing O(1) average-case lookup time for exact key matches. Think of it like an apartment building directory where apartment numbers are computed from names—'Smith' hashes to apartment 147, letting you go directly there without searching. In databases, a hash index on 'user_id' computes hash(user_id) to determine a bucket number, storing a pointer to the row in that bucket. Looking up user_id=12345 computes hash(12345) = bucket 789, retrieves pointers from bucket 789 (typically a linked list of collisions), and follows pointers to matching rows. This provides constant-time lookups regardless of table size: finding one row in 1 billion is as fast as finding one in 1000. Hash indexes excel at equality queries ('WHERE id = 12345') but cannot support range queries, ordering, or prefix matching because hash functions destroy ordering information. The tradeoff is speed for exact matches versus versatility.",
    problemSolved:
      "B-tree indexes require O(log n) lookups that become slow as datasets grow to billions of rows: log2(1 billion) = 30 disk seeks versus 1-2 for hash indexes. Sequential scans are prohibitively expensive for large tables. Hash indexes solve this by providing constant-time O(1) lookups for exact key matches, making query time independent of table size. A hash index lookup touches 1-2 pages regardless of whether the table has 1 million or 1 billion rows. This is critical for high-throughput OLTP systems with primary key lookups, key-value stores, in-memory caches, and applications where exact-match queries dominate (user lookups by ID, session retrieval by token). The pattern enables sub-millisecond lookups in massive datasets that would take seconds with sequential scans.",
    tradeoffs: {
      pros: [
        "Provides O(1) constant-time lookups for exact key matches, independent of table size",
        "Faster than B-tree indexes for equality queries, requiring fewer disk accesses (typically 1-2 versus 3-4)",
        "Simple to implement with minimal memory overhead compared to tree structures",
        "Excellent for in-memory indexes and key-value stores where hash functions are cheap",
      ],
      cons: [
        "Cannot support range queries, ordering, or prefix matching due to hash function destroying sort order",
        "Hash collisions require chaining or probing, degrading performance when many keys hash to same bucket",
        "Resizing hash table is expensive, requiring rehashing all keys when load factor exceeds threshold",
        "No support for partial key matches or wildcard queries, only exact equality comparisons",
      ],
    },
    relatedPatterns: [
      "b-tree-index",
      "consistent-hashing",
      "bloom-filter",
      "cache-aside",
    ],
  },

  structure: {
    participants: [
      {
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
  },

  codeExamples: [
    {
      id: "hash-index-ts-basic",
      language: "typescript",
      title: "TODO: Hash Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Hash Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
