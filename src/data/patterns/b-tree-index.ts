import type { Pattern } from "../schema";

export const bTreeIndex: Pattern = {
  id: "b-tree-index",
  slug: "b-tree-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → 🌳 B-Tree Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "B-Tree Index",
    emoji: "🌳",
    tagline: "Balanced tree for range queries",
    definition:
      "B-Tree Index is a self-balancing tree data structure that maintains sorted data for efficient range queries, ordered traversal, and logarithmic-time insertions, updates, and deletions. Think of it like a phone book with tabs for letter ranges (A-C, D-F, etc.), where each tab points to sub-sections, creating a hierarchy that lets you quickly narrow down to any name. Unlike binary trees with one key per node, B-trees store multiple keys per node (often hundreds), optimizing for disk-based storage where reading a 4KB block is nearly as fast as reading one byte. For example, a B-tree with 100 keys per node and 3 levels can index 1 million records with just 3 disk reads. The tree maintains balance by splitting full nodes during insertion and merging sparse nodes during deletion, ensuring all leaf nodes remain at the same depth. This guarantees predictable O(log n) performance regardless of insertion order. B-trees power database indexes, filesystems (ext4, NTFS), and key-value stores (RocksDB), excelling at queries like 'find all users where age between 25 and 35' through efficient range scans.",
    problemSolved:
      "Linear scans of large datasets are prohibitively slow: finding a record in 1 billion rows takes seconds, making interactive queries impossible. Hash indexes provide fast exact lookups but cannot support range queries, ordering, or prefix matching. Binary search trees degrade to O(n) when data is inserted in sorted order, and small nodes cause excessive disk seeks. B-Tree Index solves this by providing guaranteed O(log n) lookups, range queries, and ordered iteration while optimizing for block-based storage. A single B-tree read accesses a 4KB node with 100+ keys, versus 100+ separate disk seeks for a binary tree. This enables efficient 'find all orders in last 30 days,' 'get users sorted by name,' and prefix searches like 'find cities starting with San.' Critical for databases where most queries involve ranges, sorting, or inequalities rather than exact key lookups.",
    tradeoffs: {
      pros: [
        "Enables efficient range queries and ordered scans, supporting queries like 'between,' 'greater than,' and 'starts with'",
        "Optimizes for disk-based storage with large nodes that minimize disk seeks, typically 100-1000 keys per node",
        "Guarantees balanced tree with all leaves at same depth, providing predictable O(log n) performance",
        "Supports concurrent access with page-level locking, enabling high-throughput read and write operations",
      ],
      cons: [
        "Consumes significant memory and disk space for index storage, often 20-50% of table size",
        "Write operations slower than hash indexes due to tree rebalancing and node splitting overhead",
        "Inefficient for high-cardinality columns with many unique values, creating deep trees with poor cache locality",
        "Fragmentation over time as nodes split and merge, requiring periodic rebuilding to maintain optimal performance",
      ],
    },
    relatedPatterns: [
      "hash-index",
      "bitmap-index",
      "inverted-index",
      "composite-index",
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
      id: "b-tree-index-ts-basic",
      language: "typescript",
      title: "TODO: B-Tree Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for B-Tree Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
