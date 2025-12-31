import type { Pattern } from "../schema";

export const rangeSharding: Pattern = {
  id: "range-sharding",
  slug: "range-sharding",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 🧩 Sharding → 📏 Range Sharding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Sharding",
    level: 4,
  },

  concept: {
    name: "Range Sharding",
    emoji: "📏",
    tagline: "Key ranges to shards",
    definition:
      "Range sharding (also called range partitioning) is a database partitioning strategy that assigns contiguous key ranges to different shards based on the shard key's sorted order. Think of it like organizing books in a library: A-F on shelf 1, G-M on shelf 2, N-Z on shelf 3. For example, with a timestamp shard key, shard-1 might hold data from 2020-2021, shard-2 from 2022-2023, shard-3 from 2024-2025. Queries for dates in 2022 hit only shard-2, avoiding scatter-gather across all shards. The shard boundaries are defined explicitly (e.g., user IDs 1-1M on shard-1, 1M-2M on shard-2) or dynamically adjusted as data grows. Range sharding is ideal for time-series data, ordered IDs, or any naturally ordered shard keys where range queries are common. It is used in Google Bigtable, HBase, and Vitess. The key advantage is locality—related data (same time period, sequential IDs) lives together, enabling efficient range scans and aggregations.",
    problemSolved:
      "Hash sharding scatters data randomly, making range queries expensive (must scan all shards). Range sharding solves this by grouping data into contiguous ranges, enabling efficient range scans. For example, querying all orders from January 2024 with hash sharding requires scatter-gather across all shards. With range sharding (shard-1: Jan-Mar, shard-2: Apr-Jun), only shard-1 is queried. This is critical for analytics, time-series data, and applications with heavy range query workloads. Without range sharding, systems processing time-series data (logs, metrics, financial transactions) would suffer from slow range queries due to scatter-gather overhead. For example, Prometheus uses range sharding for time-series metrics to enable fast queries over specific time windows. However, range sharding can create hotspots—if most writes target recent data (latest timestamp), the highest-range shard becomes a bottleneck. Careful shard key selection and dynamic rebalancing are needed to avoid this.",
    tradeoffs: {
      pros: [
        "Enables efficient range queries by targeting specific shards (avoids scatter-gather)",
        "Maintains data locality—related items (same time period, sequential IDs) colocate",
        "Supports ordered scans and aggregations over key ranges",
        "Simple to understand and reason about—clear shard boundaries",
        "Works well for time-series data, sequential IDs, and naturally ordered keys",
      ],
      cons: [
        "Prone to hotspots if writes concentrate on one range (e.g., latest timestamp)",
        "Requires careful shard key selection to avoid imbalanced data distribution",
        "Adding shards may require rebalancing existing ranges and migrating data",
        "Difficult to predict shard sizes—data may grow unevenly across ranges",
        "Not suitable for randomly distributed keys without natural ordering",
      ],
    },
    relatedPatterns: [
      "hash-sharding",
      "geographic-sharding",
      "directory-based",
      "b-tree-index",
      "trees",
      "time-slicing",
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
      id: "range-sharding-ts-basic",
      language: "typescript",
      title: "TODO: Range Sharding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Range Sharding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
