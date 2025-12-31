import type { Pattern } from "../schema";

export const iPHash: Pattern = {
  id: "ip-hash",
  slug: "ip-hash",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚖️ Load Balancing → #️⃣ IP Hash",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Load Balancing",
    level: 4,
  },

  concept: {
    name: "IP Hash",
    emoji: "#️⃣",
    tagline: "Sticky sessions by IP",
    definition:
      "IP Hash routes requests from the same client IP address to the same backend server consistently by hashing the IP to select a server, enabling session affinity without shared state. Think of it like assigning each customer to a specific bank teller based on their last name—'A-M' goes to teller 1, 'N-Z' goes to teller 2. In load balancing, hash(client_ip) % server_count determines which server handles the request. For example, with 3 servers: IP 192.168.1.10 hashes to server 2, IP 10.0.0.5 hashes to server 1. All subsequent requests from 192.168.1.10 go to server 2, even across multiple connections. This creates sticky sessions where a client always hits the same server, preserving server-local state like in-memory session data or caches without requiring distributed session storage. The pattern relies on the hash function distributing IPs uniformly across servers and clients maintaining the same IP (problematic for mobile clients or NAT).",
    problemSolved:
      "Stateful applications with server-local sessions break when requests from the same client land on different servers via round-robin load balancing. User logs in on Server 1, next request goes to Server 2 which has no session, user appears logged out. Sharing session state across servers requires distributed caches (Redis, Memcached) adding complexity and latency. IP Hash solves this by ensuring all requests from a client IP hit the same server, making server-local state viable. This enables simple in-memory session storage, local caches that accumulate per-user data, and stateful protocols requiring connection affinity. Critical for legacy applications not designed for distributed sessions, WebSocket connections requiring persistent TCP sessions, and scenarios where distributed state overhead is prohibitive.",
    tradeoffs: {
      pros: [
        "Enables stateful applications with server-local sessions without requiring distributed session storage",
        "Simple to implement with deterministic hashing, requiring no coordination between load balancers",
        "Improves cache hit rates as each client consistently hits the same server, warming local caches",
        "Supports WebSocket and long-lived connections requiring persistent routing to the same backend",
      ],
      cons: [
        "Creates load imbalance if client IPs are not uniformly distributed, hot IPs overload specific servers",
        "Breaks when clients change IPs (mobile networks, VPN switches), causing session loss",
        "Many clients behind NAT appear as same IP, overwhelming a single server with all traffic",
        "Server failures require rehashing all IPs, potentially invalidating all sessions and disrupting users",
      ],
    },
    relatedPatterns: [
      "consistent-hashing",
      "round-robin",
      "least-connections",
      "session-affinity",
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
      id: "ip-hash-ts-basic",
      language: "typescript",
      title: "TODO: IP Hash Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for IP Hash
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
