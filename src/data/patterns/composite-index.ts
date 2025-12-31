import type { Pattern } from "../schema";

export const compositeIndex: Pattern = {
  id: "composite-index",
  slug: "composite-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → 🔗 Composite Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "Composite Index",
    emoji: "🔗",
    tagline: "Multi-column",
    definition:
      "Composite Index combines multiple columns into a single database index, enabling efficient queries that filter or sort on those columns together. Think of it like organizing a library first by genre, then by author, then by title—this lets you quickly find 'Science Fiction books by Asimov' without scanning all sci-fi books. A composite index on (country, city, age) creates sorted entries like (USA, NYC, 25), (USA, NYC, 30), (USA, SF, 28), enabling fast lookups for 'country = USA AND city = NYC' or even just 'country = USA.' The column order matters critically: the index works left-to-right, so (country, city, age) efficiently serves queries on country alone or country+city, but not city alone or age alone. For example, querying 'WHERE city = NYC' cannot use this index's leading column. The pattern eliminates the need for separate indexes on each column when queries frequently combine multiple filters, reducing index storage overhead and maintenance costs.",
    problemSolved:
      "Queries filtering on multiple columns suffer from inefficient index usage: single-column indexes force the database to use one index, then filter the remaining results in memory. A query 'WHERE country = USA AND city = NYC' with separate indexes on country and city must choose one (say country), retrieve thousands of USA rows, then scan them for city = NYC. This wastes I/O and CPU. Composite Index solves this by creating a multi-dimensional sort order that directly narrows to the intersection of conditions. The index lookup immediately finds the range matching both country AND city, eliminating post-filter scanning. This is critical for queries with high-selectivity compound filters, common in multi-tenant databases (WHERE tenant_id = X AND status = active), time-series data (WHERE device_id = Y AND timestamp > Z), and user queries (WHERE user_id = A AND created_date > B).",
    tradeoffs: {
      pros: [
        "Dramatically speeds up queries filtering on multiple columns by avoiding index merges and post-filtering",
        "Reduces index storage overhead compared to maintaining separate indexes on each column combination",
        "Supports covering indexes where all queried columns exist in the index, eliminating table lookups entirely",
        "Enables efficient range queries on leading columns while filtering on trailing columns simultaneously",
      ],
      cons: [
        "Column order critically affects usability: index (A, B, C) does not help queries on B or C alone",
        "Requires careful analysis of query patterns to determine optimal column ordering for index effectiveness",
        "Updates and inserts slower as composite indexes are larger and more complex to maintain than single-column",
        "Can become less effective as more columns are added, with diminishing returns beyond 3-4 columns",
      ],
    },
    relatedPatterns: [
      "b-tree-index",
      "covering-index",
      "partial-index",
      "index-intersection",
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
      id: "composite-index-ts-basic",
      language: "typescript",
      title: "TODO: Composite Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Composite Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
