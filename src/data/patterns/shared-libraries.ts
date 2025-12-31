import type { Pattern } from "../schema";

export const sharedLibraries: Pattern = {
  id: "shared-libraries",
  slug: "shared-libraries",
  corpusPath: "🔧 MAINTAINABILITY → 📦 Modularity → 📚 Shared Libraries",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Modularity",
    level: 4,
  },

  concept: {
    name: "Shared Libraries",
    emoji: "📚",
    tagline: "Common code extraction",
    definition:
      "Shared Libraries extract common functionality into reusable packages that multiple applications or services can depend on, eliminating code duplication across a codebase. Think of them as the organizational equivalent of a public library—instead of every team maintaining their own copy of utility functions, validation logic, or domain models, you create a central library that everyone references. In practice, this means packaging authentication helpers, date utilities, API clients, or data validation into npm packages, Maven artifacts, or Go modules that teams install as dependencies. The pattern emphasizes versioned distribution—teams consume specific library versions (lodash@4.17.21) and upgrade deliberately rather than being forced to synchronize changes. Shared libraries span multiple granularities: low-level utilities (string manipulation, crypto helpers), domain logic (order processing, pricing calculations), infrastructure code (database connectors, logging), and even UI components (design system libraries). Modern implementations use semantic versioning to communicate breaking changes (major.minor.patch) and publish to private package registries (Artifactory, npm Enterprise) or public repositories. The key insight is that shared libraries create a contract between library authors and consumers—you can't just change library code without considering downstream impact. This requires disciplined API design, comprehensive testing, clear documentation, and thoughtful deprecation policies. When done well, shared libraries accelerate development by providing battle-tested, maintained code; when done poorly, they become bottlenecks where every change requires coordinating dozens of teams.",
    problemSolved:
      "Organizations suffer from rampant code duplication when teams independently solve the same problems—authentication, validation, date handling, API integrations. This leads to inconsistent implementations (Team A hashes passwords with bcrypt, Team B uses SHA256), wasted effort (five teams each write their own HTTP retry logic), and maintenance nightmares (security vulnerability requires patching code in 20 repositories). Shared libraries solve this by centralizing common code so improvements benefit everyone: when the auth library adds OAuth support, all applications get it by upgrading. The pattern also addresses the knowledge-sharing problem—libraries encode best practices and domain expertise that new developers can leverage rather than reinventing. Without shared libraries, teams either duplicate code (maintainability nightmare) or create tight coupling by directly importing code from other services (architectural violation). Shared libraries provide controlled sharing through versioned dependencies—teams pull stable, tested code without tightly coupling to other services' internals. Additionally, libraries enable specialization: a platform team can maintain high-quality database abstractions while product teams focus on business logic, rather than every team building their own ORM wrappers.",
    tradeoffs: {
      pros: [
        "Eliminates code duplication, reducing maintenance burden and ensuring consistency across applications",
        "Centralizes bug fixes and improvements—one change benefits all consumers through version upgrades",
        "Encodes organizational best practices and domain knowledge in reusable, documented packages",
        "Enables specialization—expert teams maintain critical libraries while others consume them",
        "Enforces consistency in cross-cutting concerns like security, logging, error handling, and API standards",
        "Accelerates development when new projects bootstrap using mature, tested libraries",
      ],
      cons: [
        "Creates dependency coupling—library changes can break consumers if not carefully versioned",
        "Becomes organizational bottleneck if library team can't respond quickly to consumer needs",
        "Versioning complexity grows when managing compatibility across dozens of library consumers",
        "Encourages over-abstraction—teams add features to libraries that only one consumer needs",
        "Requires significant governance: who approves changes, how to deprecate APIs, version policies",
        "Can ossify over time if changes become too politically difficult, leading to circumvention",
      ],
    },
    relatedPatterns: [
      "microservices",
      "modular-monolith",
      "dependency-injection",
      "plugin-architecture",
      "api-versioning",
      "semantic-versioning",
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
      id: "shared-libraries-ts-basic",
      language: "typescript",
      title: "TODO: Shared Libraries Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Shared Libraries
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
