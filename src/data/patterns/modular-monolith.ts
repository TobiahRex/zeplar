import type { Pattern } from "../schema";

export const modularMonolith: Pattern = {
  id: "modular-monolith",
  slug: "modular-monolith",
  corpusPath: "🔧 MAINTAINABILITY → 📦 Modularity → 📦 Modular Monolith",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Modularity",
    level: 4,
  },

  concept: {
    name: "Modular Monolith",
    emoji: "📦",
    tagline: "Monolith with clear boundaries",
    definition:
      "A Modular Monolith structures a single-process application into cohesive, loosely-coupled modules with well-defined boundaries and explicit dependencies, gaining microservices' organizational benefits without distributed system complexity. Think of it as an apartment building where each unit (module) has its own entrance, utilities, and interior layout, but they share infrastructure (foundation, elevators, plumbing)—independence with shared efficiency. Each module owns its data models, business logic, and internal implementation, exposing only public interfaces to other modules. Modules communicate through explicit contracts (interfaces, events, DTLs) rather than directly accessing each other's internals. Physical enforcement comes from packaging conventions (separate packages/namespaces), access modifiers (internal/private), and architectural tests that fail builds when modules violate dependency rules (module A cannot import from module B's internals). Unlike microservices, modules run in the same process and share databases, eliminating network calls, distributed transactions, and deployment coordination. The pattern emphasizes vertical slicing—each module represents a business capability (order management, inventory, payments) rather than technical layers (controllers, services, repositories). Modern implementations use dependency injection to wire modules together, event buses for decoupled communication, and module-specific database schemas to prepare for potential extraction into microservices. The key insight: you can achieve modularity through discipline and architecture, not just physical distribution.",
    problemSolved:
      "Traditional monoliths degenerate into 'big balls of mud' where every component can access anything, creating tangled dependencies that make changes risky and slow. You can't update the payment module without potentially breaking checkout, inventory, and shipping because they all directly reference payment internals. Developers fear changes, teams step on each other's toes, and onboarding takes months because the codebase has no clear structure. Modular monoliths solve this by enforcing module boundaries—the payment module's internal implementation is off-limits, forcing other modules to use its public API. This creates the same organizational benefits as microservices (team autonomy, parallel development, clear ownership) without distributed system complexity. The pattern also addresses the premature microservices problem—teams splitting applications into microservices before understanding domain boundaries often create the wrong splits, then spend years migrating. Modular monoliths let you discover natural boundaries through iteration while keeping deployment simple. When a module grows large or needs independent scaling, you can extract it into a microservice because module boundaries already enforce loose coupling. Additionally, modular monoliths avoid distributed system costs: no network latency, no eventual consistency challenges, no distributed debugging, no deployment orchestration.",
    tradeoffs: {
      pros: [
        "Provides microservices-like modularity and team autonomy without distributed system complexity",
        "Enables parallel development with clear module ownership and minimal inter-team coordination",
        "Simplifies deployment, debugging, and testing with single-process execution and transactions",
        "Allows gradual evolution toward microservices by extracting modules when truly needed",
        "Eliminates network overhead and latency—modules call each other via in-process function calls",
        "Maintains ACID transactions across modules sharing the same database",
      ],
      cons: [
        "Requires strong architectural discipline—easy to violate module boundaries without enforcement",
        "Cannot independently scale individual modules—entire monolith scales as a unit",
        "Shared database creates coupling even with logical module boundaries",
        "Technology heterogeneity limited—all modules must use the same language and framework",
        "Module failures can bring down entire application unlike isolated microservice failures",
        "Large teams may still experience coordination overhead during deployment and releases",
      ],
    },
    relatedPatterns: [
      "microservices",
      "bounded-context",
      "dependency-injection",
      "event-driven-architecture",
      "shared-libraries",
      "hexagonal-architecture",
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
      id: "modular-monolith-ts-basic",
      language: "typescript",
      title: "TODO: Modular Monolith Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Modular Monolith
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
