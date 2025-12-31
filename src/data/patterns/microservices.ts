import type { Pattern } from "../schema";

export const microservices: Pattern = {
  id: "microservices",
  slug: "microservices",
  corpusPath: "🔧 MAINTAINABILITY → 📦 Modularity → 🧩 Microservices",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Modularity",
    level: 4,
  },

  concept: {
    name: "Microservices",
    emoji: "🧩",
    tagline: "Independent deployable services",
    definition:
      "Microservices architecture decomposes applications into small, independently deployable services that each own a single business capability and communicate via lightweight protocols (HTTP/REST, gRPC, message queues). Like specialized restaurants in a food court where each focuses on one cuisine and operates autonomously, microservices let teams build, deploy, and scale services independently without coordinating across the entire organization. Each service has its own codebase, data store, deployment pipeline, and team ownership—the inventory service uses Postgres, the recommendation engine uses Neo4j, and the payment service uses MySQL, all deployed independently. Services communicate through well-defined APIs (synchronous REST calls, asynchronous events) rather than sharing databases or internal data structures. The pattern emphasizes bounded contexts from Domain-Driven Design—each service maps to a distinct domain area (user management, order processing, notifications) with clear responsibilities and minimal overlap. Modern implementations use containerization (Docker) for portability, orchestration platforms (Kubernetes) for scaling and resilience, API gateways for routing, service meshes (Istio) for observability, and distributed tracing (Jaeger) for debugging across services. The key trade-off: microservices maximize team autonomy and deployment velocity but introduce distributed system complexity (network failures, eventual consistency, distributed debugging).",
    problemSolved:
      "Monolithic applications create organizational bottlenecks as teams grow—every deployment requires coordinating across teams, changes to one component risk breaking others, scaling requires duplicating the entire application even if only one feature needs more capacity. A monolith with 100 developers results in merge conflicts, long CI builds, and deployment windows. Microservices solve this by giving teams full ownership of services—the payments team deploys independently without waiting for inventory or shipping teams. This enables parallel development at scale: 20 teams can ship features simultaneously without stepping on each other. The pattern also addresses technical heterogeneity: legacy services can stay in Java while new services use Go or Rust; you're not locked into technology choices from 10 years ago. Microservices enable granular scaling—scale the read-heavy product catalog service to 100 instances while keeping the write-heavy order service at 5 instances, optimizing resource costs. Additionally, microservices contain failures: when the recommendation service crashes, the checkout flow continues working. However, microservices introduce challenges: distributed transactions become eventually consistent, debugging spans multiple services, and network calls add latency. The pattern works best for organizations with multiple teams needing autonomy, not small startups where a modular monolith suffices.",
    tradeoffs: {
      pros: [
        "Enables independent deployment—teams ship features without coordinating releases",
        "Supports technology heterogeneity—each service can use the best tools for its domain",
        "Facilitates granular scaling—scale hot services independently without wasting resources",
        "Improves fault isolation—service failures don't cascade to the entire application",
        "Enables team autonomy and parallel development across large organizations",
        "Allows replacing services incrementally rather than all-or-nothing rewrites",
      ],
      cons: [
        "Distributed system complexity—network failures, latency, eventual consistency, distributed transactions",
        "Operational overhead—managing deployments, monitoring, logging, and tracing across dozens of services",
        "Difficult debugging across service boundaries—issues require correlated distributed traces",
        "Data consistency challenges—maintaining invariants across services without ACID transactions",
        "Increased infrastructure costs—each service needs its own deployment, database, and monitoring",
        "Steep learning curve and requires mature DevOps practices—premature microservices often fail",
      ],
    },
    relatedPatterns: [
      "modular-monolith",
      "api-gateway",
      "service-mesh",
      "event-driven-architecture",
      "circuit-breaker",
      "distributed-tracing",
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
      id: "microservices-ts-basic",
      language: "typescript",
      title: "TODO: Microservices Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Microservices
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
