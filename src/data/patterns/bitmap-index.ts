import type { Pattern } from "../schema";

export const bitmapIndex: Pattern = {
  id: "bitmap-index",
  slug: "bitmap-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → 📊 Bitmap Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "Bitmap Index",
    emoji: "📊",
    tagline: "Low-cardinality columns",
    definition:
      "Bitmap Index uses bit arrays to represent the presence or absence of values in columns with low cardinality (few distinct values), enabling extremely fast query evaluation through bitwise operations. Think of it like a checkbox grid where each row is a record and each column represents a value: checkmarks indicate which records have each value. For a 'gender' column with values Male/Female in 1 million rows, a bitmap index creates two bit arrays: one with 1s at positions of Male records, another for Female. Querying 'WHERE gender = Male AND age > 30' becomes a fast bitwise AND between two bitmaps. With modern CPUs processing billions of bitwise operations per second, this can evaluate millions of rows in milliseconds. The pattern is especially powerful for multidimensional queries: finding 'Female customers in California who purchased in last 30 days' requires three bitwise ANDs. Bitmap indexes are compressed using run-length encoding: 1000 consecutive 1s becomes '1000 x 1' rather than 1000 bits, making them space-efficient for skewed distributions.",
    problemSolved:
      "Traditional B-tree indexes are inefficient for low-cardinality columns like gender, country, or status because the index size approaches the table size, and queries scan large portions of the index. Evaluating complex boolean queries (AND, OR, NOT combinations) requires multiple index lookups and result merging. Bitmap Index solves this by representing entire columns in compact bit arrays that fit in CPU cache and enable parallel bitwise operations. For 'active users in USA or Canada,' bitwise OR of two country bitmaps executes in nanoseconds versus milliseconds for B-tree merging. This is critical for data warehouses and analytics where users run ad-hoc queries combining many low-cardinality dimensions: 'show sales for Product=Phone AND Region=West AND Quarter=Q4.' The pattern makes these multidimensional queries 10-100x faster than traditional indexes.",
    tradeoffs: {
      pros: [
        "Enables extremely fast complex boolean queries through parallel bitwise AND, OR, NOT operations on bit arrays",
        "Space-efficient with run-length encoding, often 10-100x smaller than B-tree indexes for low-cardinality columns",
        "Excellent for read-heavy analytics workloads with complex WHERE clauses combining multiple dimensions",
        "Leverages CPU cache and SIMD instructions for high-throughput query evaluation on millions of rows",
      ],
      cons: [
        "Inefficient for high-cardinality columns, requiring one bitmap per distinct value, exploding storage",
        "Updates expensive due to bitmap locking and recompression, making pattern unsuitable for write-heavy OLTP",
        "Bitmap locking can cause contention under concurrent writes, reducing throughput for transactional workloads",
        "Index size grows with row count regardless of data distribution, unlike B-trees that compress sorted data",
      ],
    },
    relatedPatterns: [
      "b-tree-index",
      "hash-index",
      "inverted-index",
      "columnar-storage",
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
      id: "bitmap-index-ts-basic",
      language: "typescript",
      title: "TODO: Bitmap Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Bitmap Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
