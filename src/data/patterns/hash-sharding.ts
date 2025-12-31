import type { Pattern } from "../schema";

export const hashSharding: Pattern = {
  id: "hash-sharding",
  slug: "hash-sharding",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 🧩 Sharding → #️⃣ Hash Sharding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Sharding",
    level: 4,
  },

  concept: {
    name: "Hash Sharding",
    emoji: "#️⃣",
    tagline: "Consistent hashing",
    definition:
      "Hash sharding is a database partitioning strategy that distributes data across multiple shards by applying a hash function to a shard key and using the result modulo the number of shards to determine placement. Think of it like a lottery where each ticket number gets assigned to a specific prize pool: hash the ticket number and mod by the number of pools to find which one it belongs to. For example, with 4 shards, user ID 12345 might hash to 2897345, and 2897345 % 4 = 1, so user 12345 lives on shard-1. Common hash functions include MD5, SHA-1, or MurmurHash applied to shard keys like user IDs, tenant IDs, or order IDs. The goal is uniform distribution—each shard receives roughly equal data volume, preventing hotspots. A variant, consistent hashing, minimizes resharding overhead when adding/removing shards by using a hash ring where shards are virtual nodes, and only a fraction of keys need to move when the cluster changes. Hash sharding is the default strategy in MongoDB, Cassandra, and Redis Cluster due to its simplicity and even distribution.",
    problemSolved:
      "Range sharding can create hotspots when data has skewed access patterns (e.g., most queries hit recent timestamps), and geographic sharding does not work for non-location-based data. Hash sharding solves this by ensuring uniform data distribution regardless of data patterns, eliminating hotspots. It prevents situations where one shard is overwhelmed while others sit idle. For example, if sharding user data by user ID range (1-1M on shard-1, 1M-2M on shard-2), newly registered users all hit the highest-numbered shard, creating imbalance. Hash sharding distributes users evenly by randomizing placement based on hashed IDs. Without hash sharding, systems with unpredictable access patterns would require constant manual rebalancing or suffer from performance degradation on hot shards. However, adding shards requires re-hashing and migrating data—consistent hashing minimizes this overhead by moving only K/N data (K=keys, N=nodes) instead of redistributing everything.",
    tradeoffs: {
      pros: [
        "Ensures even data distribution across shards, preventing hotspots and imbalance",
        "Simple deterministic routing—hash key modulo shard count gives target shard",
        "Works well for uniformly distributed keys (user IDs, UUIDs, hashed strings)",
        "Consistent hashing variant minimizes data movement when adding/removing shards",
        "No need to maintain range boundaries or lookup tables",
      ],
      cons: [
        "Range queries are impossible—finding users 1000-2000 requires scanning all shards",
        "Adding/removing shards requires rehashing and migrating data (unless using consistent hashing)",
        "Difficult to rebalance if shards become uneven due to deletions or updates",
        "No locality—related items (same user's orders) may be scattered across shards",
        "Cannot leverage natural ordering for queries (e.g., time-series range scans)",
      ],
    },
    relatedPatterns: [
      "consistent-hashing",
      "range-sharding",
      "geographic-sharding",
      "directory-based",
      "hash-tables",
      "hash-ring",
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
      id: "hash-sharding-ts-basic",
      language: "typescript",
      title: "TODO: Hash Sharding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Hash Sharding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
