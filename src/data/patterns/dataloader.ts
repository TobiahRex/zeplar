import type { Pattern } from "../schema";

export const dataLoader: Pattern = {
  id: "dataloader",
  slug: "dataloader",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 🔗 DataLoader",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "DataLoader",
    emoji: "🔗",
    tagline: "Batch + dedupe in single tick",
    definition:
      "DataLoader is a batching and caching utility pattern popularized by Facebook for GraphQL applications that automatically combines multiple individual data fetch requests into a single batch request within one event loop tick, while also deduplicating identical requests. Think of it like a smart delivery service that collects all package requests from a neighborhood in a short time window, removes duplicates, and makes one efficient trip instead of many separate deliveries. The pattern works by accumulating load requests in a queue and using the event loop's microtask queue to flush the batch. For example, if your GraphQL query needs to load users with IDs [1, 5, 3, 5, 1], DataLoader will collect these requests, deduplicate them to [1, 5, 3], make a single batched database query 'SELECT * FROM users WHERE id IN (1,5,3)', and then distribute the results back to each individual caller. The per-request cache ensures that within a single request context, loading the same entity multiple times only hits the database once.",
    problemSolved:
      "GraphQL and complex data-driven applications often need to load the same data multiple times when resolving deeply nested queries, leading to the N+1 query problem where you make one query for a list, then one query per item in the list. Without batching, a simple query could trigger hundreds or thousands of individual database queries, crushing performance. DataLoader solves this by transparently batching requests that happen in the same tick and deduplicating identical loads, turning N+1 queries into a single batch query. Manual implementation of batching and caching is complex, error-prone, and difficult to maintain. DataLoader provides a simple, reusable abstraction that makes the optimal access pattern easy.",
    tradeoffs: {
      pros: [
        "Dramatically reduces database load by transforming N+1 query patterns into single batch queries automatically",
        "Built-in per-request caching eliminates redundant loads within a request without manual cache management",
        "Simple API that developers use like normal async functions; batching optimization is completely transparent",
        "Works across any data source (databases, REST APIs, microservices) not just GraphQL",
        "Configurable batch size limits prevent creating excessively large queries that could overwhelm databases",
      ],
      cons: [
        "Adds slight latency since it waits for the event loop tick to collect all requests before executing",
        "Requires data sources to support batch loading; not all APIs or databases provide efficient batch operations",
        "Cache invalidation within a request context is tricky; stale data can be served if entities are modified mid-request",
        "Debugging becomes harder since the batched query is hidden from application code making individual loads",
        "Global caching across requests requires careful consideration to avoid memory leaks and stale data",
      ],
    },
    relatedPatterns: [
      "batching",
      "caching",
      "lazy-loading",
      "dedup-queue",
      "micro-batching",
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
      id: "dataloader-ts-basic",
      language: "typescript",
      title: "TODO: DataLoader Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for DataLoader
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
