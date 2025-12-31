import type { Pattern } from "../schema";

export const roundRobin: Pattern = {
  id: "round-robin",
  slug: "round-robin",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚖️ Load Balancing → 🔄 Round Robin",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Load Balancing",
    level: 4,
  },

  concept: {
    name: "Round Robin",
    emoji: "🔄",
    tagline: "Cycle through backends",
    definition:
      "Round-robin load balancing distributes incoming requests across backend servers by cycling through them in a fixed sequential order, sending each request to the next server in the rotation. Think of it like dealing cards around a poker table—first card to player 1, second to player 2, third to player 3, then back to player 1, ensuring everyone gets an equal number of cards. For example, with servers A, B, and C, requests are distributed: request 1 → A, request 2 → B, request 3 → C, request 4 → A, request 5 → B, and so on in a circular pattern. The load balancer maintains a simple counter that increments with each request and wraps around after reaching the last server. This ensures perfectly even distribution—with 1000 requests and 10 servers, each server receives exactly 100 requests. Some implementations add weights (weighted round-robin) where more powerful servers receive proportionally more requests. The algorithm is deterministic, simple to implement, and provides predictable, fair distribution across all backend servers.",
    problemSolved:
      "Distributing load fairly across servers requires an algorithm that is simple, predictable, and avoids bias toward particular servers. Random selection creates uneven distribution with small request counts, and manual assignment is impractical at scale. For example, with 100 requests and 4 servers, pure random might send 30 to one server and 20 to another—a 50% imbalance. Hash-based routing creates sticky sessions that can overload specific servers if certain users generate more traffic. Round-robin solves this by guaranteeing perfectly even distribution: every N requests (where N is the server count) results in each server getting exactly 1 request. This eliminates hot spots and ensures no server sits idle while others are overloaded. For instance, 1 million requests to 100 servers means exactly 10,000 requests per server. The algorithm is trivial to implement (just increment a counter) and provides predictable behavior for capacity planning.",
    tradeoffs: {
      pros: [
        "Guarantees perfectly uniform distribution—each server receives exactly equal number of requests over time, preventing load imbalances",
        "Extremely simple to implement with just a counter and modulo operation, requiring minimal state and 3-4 lines of code",
        "Provides predictable behavior making capacity planning easy—with N servers, each handles 1/N of total traffic exactly",
        "Works well for stateless applications where any server can handle any request without requiring session affinity",
      ],
      cons: [
        "Ignores actual server load, capacity, and response times—treats 2-CPU and 64-CPU servers identically, potentially overwhelming weaker servers",
        "Cannot handle heterogeneous server pools effectively without weighted round-robin, which adds complexity",
        "Provides no session affinity, so same user's requests scatter across servers requiring external session storage or sticky session extensions",
        "Requires coordination across multiple load balancer instances to maintain consistent counter state, or accepts duplicate distribution across balancers",
      ],
    },
    relatedPatterns: [
      "random",
      "least-connections",
      "weighted",
      "ip-hash",
      "consistent-hashing",
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
      id: "round-robin-ts-basic",
      language: "typescript",
      title: "TODO: Round Robin Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Round Robin
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
