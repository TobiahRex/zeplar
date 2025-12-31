import type { Pattern } from "../schema";

export const directoryBased: Pattern = {
  id: "directory-based",
  slug: "directory-based",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 🧩 Sharding → 🗺️ Directory-Based",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Sharding",
    level: 4,
  },

  concept: {
    name: "Directory-Based",
    emoji: "🗺️",
    tagline: "Lookup table for routing",
    definition:
      "Directory-based sharding (also called lookup-based sharding or shard mapping) is a database partitioning strategy that uses an explicit lookup table (directory) to map each entity to its shard, rather than computing shard placement algorithmically. Think of it like a phone book: instead of guessing which city someone lives in based on their name, you look them up in the directory to find their location. The directory stores mappings like 'user-12345 -> shard-3', 'tenant-abc -> shard-1'. When querying user 12345, the system first looks up the directory to find shard-3, then queries that shard. The directory can be stored in a fast key-value store (Redis, etcd), in-memory cache, or dedicated metadata database. This approach provides maximum flexibility—shards can be reassigned without data movement by updating the directory entry. It is commonly used for multi-tenant SaaS applications where each tenant gets assigned to a shard, and tenants can be moved between shards for rebalancing. The directory becomes the single source of truth for data placement.",
    problemSolved:
      "Hash sharding and range sharding use rigid algorithms that make rebalancing difficult—adding shards requires rehashing or redefining ranges and moving data. Directory-based sharding solves this by decoupling logical entities (users, tenants) from physical shards through indirection. Want to move a tenant to a less-loaded shard? Just update the directory entry—no data movement needed initially. This enables flexible rebalancing, gradual migrations, and custom placement policies (e.g., premium tenants on dedicated shards). Without directory-based sharding, systems would struggle with dynamic rebalancing, tenant isolation, and administrative operations like moving high-traffic tenants to dedicated hardware. For example, Slack uses directory-based sharding to isolate large enterprise customers on dedicated shards while keeping small teams on shared shards. The directory enables tenant-level routing control that hash or range sharding cannot provide.",
    tradeoffs: {
      pros: [
        "Maximum flexibility—reassign entities to shards by updating directory entries",
        "Enables custom placement policies (premium users on fast shards, isolate noisy neighbors)",
        "Supports gradual migrations and rebalancing without moving data immediately",
        "Allows per-entity routing control (tenant isolation, geographic preferences)",
        "Can mix sharding strategies—some entities by hash, others by geography",
      ],
      cons: [
        "Directory lookup adds latency overhead (extra hop before querying shard)",
        "Directory becomes single point of failure—must be highly available and replicated",
        "Directory itself can become a bottleneck if not properly cached and scaled",
        "Requires managing directory consistency when shards are added/removed",
        "More complex than hash/range sharding due to directory management overhead",
      ],
    },
    relatedPatterns: [
      "hash-sharding",
      "range-sharding",
      "geographic-sharding",
      "consistent-hashing",
      "hash-tables",
      "read-replicas",
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
      id: "directory-based-ts-basic",
      language: "typescript",
      title: "TODO: Directory-Based Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Directory-Based
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
