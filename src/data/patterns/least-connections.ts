import type { Pattern } from "../schema";

export const leastConnections: Pattern = {
  id: "least-connections",
  slug: "least-connections",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚖️ Load Balancing → ⚖️ Least Connections",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Load Balancing",
    level: 4,
  },

  concept: {
    name: "Least Connections",
    emoji: "⚖️",
    tagline: "Route to least busy",
    definition:
      "Least Connections routes incoming requests to the backend server currently handling the fewest active connections, dynamically balancing load based on real-time server workload rather than static algorithms. Think of it like choosing the shortest checkout line at a grocery store—you pick the line with the fewest customers waiting, not just rotating between lines blindly. The load balancer tracks active connection counts for each backend server and routes new requests to the server with minimum count. For example, Server 1 has 50 connections, Server 2 has 30, Server 3 has 45—the next request goes to Server 2. As connections complete, counts decrease and routing adapts dynamically. This creates adaptive load balancing where slow requests (long processing time) naturally send fewer new requests to busy servers, while fast servers accept more work. The pattern works best for workloads with high variability in request processing time.",
    problemSolved:
      "Round-robin load balancing distributes requests evenly by count but ignores actual server load, causing imbalance when requests have variable processing times. A server processing 10 long-running requests (30 seconds each) is far busier than one processing 10 quick requests (100ms each), but round-robin treats them equally. This creates hot spots where slow servers accumulate more work and become overloaded while fast servers sit idle. Least Connections solves this by routing based on active workload, sending more traffic to underutilized servers and less to busy ones. Servers processing slow requests naturally get fewer new connections, preventing overload. This is critical for heterogeneous workloads mixing fast and slow requests, long-lived connections (WebSockets, streaming), and environments with variable server capacity due to background jobs or resource contention.",
    tradeoffs: {
      pros: [
        "Adapts to variable request processing times, routing more work to fast servers and less to slow ones",
        "Prevents server overload by considering actual workload rather than just request count",
        "Better load distribution than round-robin for heterogeneous workloads with mixed request durations",
        "Automatically compensates for variable server capacity without manual weight tuning",
      ],
      cons: [
        "Requires load balancer to track active connections for all servers, adding memory and state overhead",
        "Does not account for request complexity—a cheap request and expensive request count equally",
        "Can create cascading overload if new requests themselves are slow, biasing toward already-slow servers",
        "Connection count is imperfect proxy for load, ignoring CPU, memory, or I/O utilization",
      ],
    },
    relatedPatterns: [
      "round-robin",
      "ip-hash",
      "weighted-round-robin",
      "resource-based-routing",
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
      id: "least-connections-ts-basic",
      language: "typescript",
      title: "TODO: Least Connections Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Least Connections
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
