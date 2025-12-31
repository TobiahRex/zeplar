import type { Pattern } from "../schema";

export const random: Pattern = {
  id: "random",
  slug: "random",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚖️ Load Balancing → 🎲 Random",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Load Balancing",
    level: 4,
  },

  concept: {
    name: "Random",
    emoji: "🎲",
    tagline: "Probabilistic distribution",
    definition:
      "Random load balancing distributes incoming requests across backend servers by selecting a server at random for each request, relying on statistical probability to achieve roughly equal distribution over time. Think of it like randomly dealing cards to players—over enough hands, each player gets approximately the same number of cards even though each deal is unpredictable. For example, a load balancer with 10 backend servers generates a random number between 0 and 9 for each incoming HTTP request and forwards the request to the corresponding server. With thousands of requests, each server receives approximately 10% of traffic due to the law of large numbers, even though any individual request might go to any server. The algorithm is stateless—no tracking of previous choices or server loads needed—just pick a random number and route. Some implementations use weighted random selection where servers with higher capacity have proportionally higher probabilities. Random selection is one of the simplest load balancing strategies to implement and understand, making it popular for stateless services.",
    problemSolved:
      "Implementing effective load balancing often requires complex state tracking and coordination. Round-robin algorithms must maintain counters, least-connections requires monitoring active connection counts across all servers, and hash-based routing needs consistent hashing to handle server changes. These stateful approaches add complexity and potential failure points. For example, tracking connection counts requires atomic increments/decrements across concurrent requests, creating contention. Maintaining round-robin counters across multiple load balancer instances requires coordination to avoid imbalance. Random load balancing solves this by eliminating state entirely—each request makes an independent random choice without knowing about previous requests. This makes the algorithm trivially parallel (multiple load balancers can make random choices without coordination), eliminates state corruption bugs, and requires minimal code. While distribution isn't perfect for small request counts, it converges to uniform distribution as traffic volume increases.",
    tradeoffs: {
      pros: [
        "Extremely simple to implement with just a random number generator and array indexing, requiring 2-3 lines of code versus complex state management",
        "Completely stateless with no need to track server loads, connection counts, or previous routing decisions, eliminating entire classes of bugs",
        "Naturally distributes load uniformly over large numbers of requests due to law of large numbers, typically achieving within 5% balance with 1000+ requests",
        "Trivially scalable to multiple load balancer instances since random choices don't require coordination or shared state between balancers",
      ],
      cons: [
        "Provides poor distribution for small request counts where randomness hasn't averaged out—10 requests might send 7 to one server and 0 to another",
        "Ignores actual server loads, health, and capacity, potentially routing to overloaded servers while others sit idle, causing performance degradation",
        "Cannot provide session affinity since each request is independent—same user's requests scatter across servers requiring shared state management",
        "Creates potential thundering herd problems where random chance sends many requests to same server simultaneously while others are underutilized",
      ],
    },
    relatedPatterns: [
      "round-robin",
      "least-connections",
      "weighted",
      "consistent-hashing",
      "ip-hash",
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
      id: "random-ts-basic",
      language: "typescript",
      title: "TODO: Random Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Random
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
