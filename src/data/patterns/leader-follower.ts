import type { Pattern } from "../schema";

export const leaderFollower: Pattern = {
  id: "leader-follower",
  slug: "leader-follower",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 📋 Replication → 👑 Leader-Follower",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Replication",
    level: 4,
  },

  concept: {
    name: "Leader-Follower",
    emoji: "👑",
    tagline: "Single writer, multiple readers",
    definition:
      "Leader-Follower designates one node as the leader that handles all writes, replicating changes to follower nodes that serve reads, ensuring strong consistency while scaling read capacity. Think of it like a classroom where the teacher (leader) writes on the whiteboard while students (followers) copy the notes—everyone sees the same information in the same order. In databases, the leader accepts all write operations, commits them to a write-ahead log, and streams changes to followers asynchronously. Followers apply changes in the same order, maintaining eventual consistency. For example, a write to the leader updates user_email, generates log entry 'SET user_email=new@example.com,' sends it to 3 followers who apply the change identically. Reads can be served from any follower, scaling read throughput linearly with follower count. Leadership is typically determined by leader election (Raft, Paxos) with automatic failover if the leader dies.",
    problemSolved:
      "Multi-master replication with concurrent writes creates conflicts requiring complex resolution logic that is error-prone and difficult to reason about. Write conflicts from simultaneous updates to the same record require last-write-wins, application-specific merging, or manual intervention. Leader-Follower eliminates write conflicts by serializing all writes through a single leader, providing linearizable consistency without conflict resolution. Read scalability is achieved by adding followers that replicate leader state, serving read-only queries. For example, a social network leader handles all posts/likes (writes) while 10 followers serve timelines (reads), scaling read capacity 10x. This is critical for applications requiring strong consistency (banking, inventory), read-heavy workloads (content sites, analytics dashboards), and systems where conflict-free writes matter more than write scalability.",
    tradeoffs: {
      pros: [
        "Eliminates write conflicts with single source of truth, providing strong consistency without complex merging",
        "Scales read capacity linearly by adding followers, serving read-heavy workloads efficiently",
        "Simplifies application logic with no conflict resolution code or eventual consistency reasoning",
        "Enables consistent backups and analytics on followers without impacting leader write performance",
      ],
      cons: [
        "Write throughput limited by single leader, creating bottleneck for write-heavy workloads",
        "Leader is single point of failure requiring failover mechanisms, causing downtime during leader election",
        "Replication lag means followers may serve stale reads, violating read-your-writes consistency",
        "Geographic distribution inefficient as writes must go to leader region, adding cross-region latency",
      ],
    },
    relatedPatterns: [
      "leaderless",
      "multi-master",
      "read-replicas",
      "raft-consensus",
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
      id: "leader-follower-ts-basic",
      language: "typescript",
      title: "TODO: Leader-Follower Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Leader-Follower
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
