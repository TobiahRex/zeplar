import type { Pattern } from "../schema";

export const bulkOperations: Pattern = {
  id: "bulk-operations",
  slug: "bulk-operations",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 📊 Bulk Operations",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Bulk Operations",
    emoji: "📊",
    tagline: "Single call for multiple items",
    definition:
      "Bulk Operations batch multiple individual operations into a single database or API call, dramatically reducing network round trips and overhead. Think of it like loading a dishwasher with 20 plates at once instead of running it 20 separate times—you save water, energy, and time. In databases, inserting 1000 rows individually requires 1000 separate network round trips, transaction starts, index updates, and locks. A bulk INSERT statement combines them into one network call, one transaction, and one index rebuild, reducing execution time from seconds to milliseconds. For example, 'INSERT INTO users VALUES (1, Alice), (2, Bob), ..., (1000, Zara)' inserts all 1000 rows in a single operation. The pattern extends beyond databases: REST APIs can accept arrays of objects ('POST /users [user1, user2, ...]'), message queues support batch publishing, and cloud storage offers batch uploads. The key insight is that overhead (network latency, authentication, transaction management) often dominates per-item processing time, so batching amortizes this cost across many items.",
    problemSolved:
      "Individual operations in distributed systems suffer from high per-operation overhead: network latency (10-100ms per call), authentication, connection setup, transaction management, and locking. Inserting 10,000 database rows individually with 50ms round-trip latency takes 500 seconds (8+ minutes), even though the actual insert work is milliseconds. Sequential API calls to create users one-by-one waste time in network transit and server overhead. Bulk Operations solve this by amortizing fixed costs across many items, reducing 10,000 round trips to 1. This transforms minutes into seconds for large data migrations, ETL pipelines, and batch processing. Critical for initial data loads, periodic synchronization, log ingestion, and any scenario where throughput matters more than individual item latency. The pattern enables processing millions of items in reasonable time frames.",
    tradeoffs: {
      pros: [
        "Reduces network round trips from N to 1, cutting latency-dominated operations from minutes to seconds",
        "Amortizes transaction overhead, connection setup, and authentication costs across many items",
        "Increases throughput by 10-100x for database inserts, updates, and deletes in batch processing scenarios",
        "Enables efficient use of database resources with single transaction, lock acquisition, and index rebuild",
      ],
      cons: [
        "All-or-nothing semantics mean single item failure aborts entire batch unless partial failure handling added",
        "Large batches can exceed memory limits, payload size restrictions, or timeout thresholds",
        "Requires careful batch size tuning: too small loses efficiency gains, too large causes failures",
        "More complex error handling needed to identify which specific items failed in a batch",
      ],
    },
    relatedPatterns: [
      "batching",
      "request-collapsing",
      "write-behind",
      "bulk-loading",
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
      id: "bulk-operations-ts-basic",
      language: "typescript",
      title: "TODO: Bulk Operations Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Bulk Operations
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
