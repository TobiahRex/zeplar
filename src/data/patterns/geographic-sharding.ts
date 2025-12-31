import type { Pattern } from "../schema";

export const geographicSharding: Pattern = {
  id: "geographic-sharding",
  slug: "geographic-sharding",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 🧩 Sharding → 🌍 Geographic Sharding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Sharding",
    level: 4,
  },

  concept: {
    name: "Geographic Sharding",
    emoji: "🌍",
    tagline: "By user location",
    definition:
      "Geographic sharding (also called geo-sharding or geo-partitioning) is a database partitioning strategy that distributes data across multiple database instances based on the geographic location of users or data origins. Think of it like regional distribution centers for a global retailer: customers in Europe are served by European warehouses, customers in Asia by Asian warehouses. Each geographic region (US-East, EU-West, APAC) gets its own dedicated database shard containing data for users or entities in that region. For example, a social network might shard user profiles by continent: shard-us for US users, shard-eu for European users, shard-asia for Asian users. Queries from European users hit shard-eu, keeping data close to users and reducing network latency. This pattern optimizes for locality—most user interactions involve data within the same region, minimizing cross-region queries. It also helps with data sovereignty compliance (GDPR requires EU data stay in EU). Geographic sharding is common in global SaaS platforms, CDNs, and applications with geographically concentrated user bases.",
    problemSolved:
      "Global applications serving users worldwide face high latency when all data resides in a single geographic region. A user in Australia querying a database in Virginia experiences 200-300ms latency per query, making applications feel sluggish. Geographic sharding solves this by placing data physically close to users, reducing query latency to 5-20ms for intra-region access. It also addresses data sovereignty regulations—GDPR mandates EU user data be stored and processed within the EU, requiring geographic isolation. Additionally, geo-sharding enables region-specific scaling: if US traffic grows 10x, you scale only the US shard, not the entire global database. Without geo-sharding, a monolithic global database would suffer from high latencies, regulatory violations, and inefficient scaling (over-provisioning for peak load in any region affects all regions). For example, Netflix uses geo-sharding to keep user viewing history close to users, ensuring fast recommendations and reducing cross-region data transfer costs.",
    tradeoffs: {
      pros: [
        "Dramatically reduces query latency by keeping data close to users (5-20ms intra-region)",
        "Ensures data sovereignty compliance (GDPR, data residency laws) by isolating regions",
        "Enables region-specific scaling—grow US capacity independently of EU capacity",
        "Natural failure isolation—EU outage does not impact US users",
        "Reduces cross-region bandwidth costs by localizing most queries",
      ],
      cons: [
        "Cross-region queries are slow and expensive (200-300ms latency, high bandwidth costs)",
        "Difficult to handle users who move regions or access data from multiple locations",
        "Requires complex routing logic to determine which shard to query based on user location",
        "Uneven data distribution if regions have vastly different user populations",
        "Global analytics and aggregations require querying all shards and merging results",
      ],
    },
    relatedPatterns: [
      "hash-sharding",
      "range-sharding",
      "directory-based",
      "consistent-hashing",
      "read-replicas",
      "multi-leader",
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
      id: "geographic-sharding-ts-basic",
      language: "typescript",
      title: "TODO: Geographic Sharding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Geographic Sharding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
