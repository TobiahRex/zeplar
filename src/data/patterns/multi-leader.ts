import type { Pattern } from "../schema";

export const multiLeader: Pattern = {
  id: "multi-leader",
  slug: "multi-leader",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 📋 Replication → 👥 Multi-Leader",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Replication",
    level: 4,
  },

  concept: {
    name: "Multi-Leader",
    emoji: "👥",
    tagline: "Multiple writers",
    definition:
      "Multi-leader replication is a database architecture where multiple nodes can accept write operations simultaneously, with each leader independently processing writes and asynchronously replicating changes to other leaders and followers. Think of it like multiple branch offices that can each process transactions locally and then sync their records with headquarters and other branches overnight—no single office is the bottleneck. For example, a global social network might have leader nodes in the US, Europe, and Asia, each accepting posts from nearby users and replicating changes to other regions. When a user in Tokyo posts a photo, the Asia leader handles it immediately without waiting for cross-continent communication to the US leader. The system uses conflict resolution strategies (last-write-wins, version vectors, or custom merge logic) to handle cases where multiple leaders modify the same data concurrently. This architecture enables low-latency writes from any geographic region and continues operating even if some leaders fail or network partitions occur.",
    problemSolved:
      "Single-leader replication creates a performance bottleneck and single point of failure. When all writes must go through one leader node, geographically distant users experience high latency—a user in Australia writing to a US-based leader pays 200-300ms network round-trip cost for every operation. Additionally, if the single leader fails, the entire system becomes read-only until failover completes, which can take 30-60 seconds or more. Multi-leader replication solves this by allowing writes to any leader, typically placing leaders close to users in different regions (US, Europe, Asia). This reduces write latency from 200ms+ to 10-50ms by avoiding cross-continental trips and eliminates single points of failure since other leaders continue operating independently if one fails. The pattern is essential for applications requiring global low-latency writes and high availability during network partitions.",
    tradeoffs: {
      pros: [
        "Dramatically reduces write latency for geographically distributed users by accepting writes at nearby leaders, typically improving response times from 200-300ms to 10-50ms",
        "Provides high availability since each leader operates independently—system continues functioning even during network partitions between data centers or leader failures",
        "Enables offline operation where clients can write to local leaders without internet connectivity, syncing changes when connection restores (useful for mobile apps)",
        "Scales write throughput horizontally by distributing write load across multiple leaders instead of bottlenecking on a single node",
      ],
      cons: [
        "Introduces complex conflict resolution challenges when multiple leaders modify the same data concurrently, requiring strategies like last-write-wins (loses data) or CRDTs (complex)",
        "Creates potential for write conflicts that are impossible to resolve automatically, requiring application-level merge logic or manual intervention",
        "Adds significant implementation complexity with asynchronous replication, conflict detection, and resolution logic that must be carefully designed and tested",
        "Can lead to consistency anomalies where different leaders temporarily have different views of data, requiring applications to handle eventual consistency",
        "Makes debugging and operational monitoring harder due to distributed state and complex replication topology",
      ],
    },
    relatedPatterns: [
      "leader-follower",
      "leaderless",
      "event-sourcing",
      "cqrs",
      "consistent-hashing",
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
      id: "multi-leader-ts-basic",
      language: "typescript",
      title: "TODO: Multi-Leader Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Multi-Leader
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
