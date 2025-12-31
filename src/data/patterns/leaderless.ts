import type { Pattern } from "../schema";

export const leaderless: Pattern = {
  id: "leaderless",
  slug: "leaderless",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 📋 Replication → 🔗 Leaderless",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Replication",
    level: 4,
  },

  concept: {
    name: "Leaderless",
    emoji: "🔗",
    tagline: "Any node accepts writes",
    definition:
      "Leaderless Replication allows any node to accept writes, achieving high availability and write scalability by using quorum-based coordination and conflict resolution instead of leader election. Think of it like a group of friends planning dinner—anyone can suggest a restaurant, and the group accepts it if enough people agree, no designated planner needed. In systems like Cassandra or DynamoDB, a write goes to any node (coordinator), which writes to N replicas in parallel. If W replicas acknowledge success (write quorum), the write succeeds. Reads require R replicas to agree (read quorum). If W + R > N, reads always see the latest write. For example, with N=3, W=2, R=2: writes succeed when 2 of 3 nodes acknowledge, reads query 2 of 3 nodes and return the newest version. Conflicts from concurrent writes are resolved using last-write-wins, vector clocks, or application-specific merge logic.",
    problemSolved:
      "Leader-based replication creates single points of failure where leader unavailability blocks all writes until failover completes, causing downtime during network partitions or leader failures. Write throughput limited by single leader cannot scale horizontally. Geographic distribution suffers as writes must route to leader region, adding latency for remote clients. Leaderless Replication solves this by distributing writes across all nodes, eliminating the leader bottleneck and single point of failure. Any node failure impacts only 1/Nth of capacity, not all writes. Multi-datacenter deployments accept writes locally in each region without cross-region coordination. This is critical for highly available systems requiring 99.99% uptime, globally distributed applications minimizing write latency, and massive write-heavy workloads exceeding single-leader capacity.",
    tradeoffs: {
      pros: [
        "High availability with no single point of failure, any node can accept writes even during network partitions",
        "Write scalability grows with cluster size as all nodes accept writes, avoiding single-leader bottleneck",
        "Lower write latency in multi-datacenter deployments as clients write to local region without remote coordination",
        "Simple horizontal scaling by adding nodes without complex leader rebalancing or failover logic",
      ],
      cons: [
        "Requires conflict resolution logic for concurrent writes, adding application complexity",
        "Weaker consistency guarantees with eventual consistency, potentially serving stale or conflicting data",
        "Higher read and write latency due to quorum requirements, waiting for multiple node responses",
        "More complex operational model with tunable consistency (N, W, R) requiring careful capacity planning",
      ],
    },
    relatedPatterns: [
      "leader-follower",
      "quorum",
      "vector-clock",
      "last-write-wins",
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
      id: "leaderless-ts-basic",
      language: "typescript",
      title: "TODO: Leaderless Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Leaderless
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
