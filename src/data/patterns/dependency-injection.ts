import type { Pattern } from "../schema";

export const dependencyInjection: Pattern = {
  id: "dependency-injection",
  slug: "dependency-injection",
  corpusPath: "🔧 MAINTAINABILITY → 🧪 Testability → 📦 Dependency Injection",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Testability",
    level: 4,
  },

  concept: {
    name: "Dependency Injection",
    emoji: "📦",
    tagline: "Inject collaborators",
    definition:
      "Dependency Injection (DI) provides objects with their dependencies from external sources rather than constructing them internally, inverting control and enabling loose coupling, testability, and configurability. Instead of class UserService creating its own database connection (this.db = new PostgreSQL()), it receives the dependency through its constructor (constructor(db: Database))—someone else decides which implementation to provide. Think of DI like a waiter bringing ingredients to a chef rather than the chef shopping at the grocery store—the chef focuses on cooking, not procurement. DI comes in three forms: constructor injection (dependencies passed as constructor parameters), setter injection (dependencies set via methods after construction), and interface injection (object implements interface defining dependency setters). Modern DI frameworks (Spring, NestJS, Angular, Dagger) use reflection or compile-time code generation to automatically wire dependencies: you annotate classes (@Injectable), declare what they need (@Inject Database), and the framework handles object graph construction. Advanced features include scopes (singleton, request-scoped, transient), lazy initialization (defer construction until first use), and configuration-based wiring (XML, annotations, code). The pattern shifts responsibility: instead of objects knowing how to create their dependencies, they declare what they need, and a central container (IoC container) fulfills those needs. This enables swapping implementations (swap PostgreSQL for MySQL) and injecting mocks for testing.",
    problemSolved:
      "Hard-coded dependencies (new FileLogger(), new PostgreSQL()) create tight coupling that makes code difficult to test, reconfigure, and evolve. When UserService directly constructs a database connection, you cannot unit test UserService without a real database—tests become slow integration tests. You also cannot swap databases without modifying UserService code, violating the Open-Closed Principle. Dependency Injection solves this by making dependencies explicit and externally provided—UserService declares 'I need a Database' without knowing if it's PostgreSQL, MySQL, or a mock. This enables testing: inject a mock database and verify UserService logic in isolation. DI also facilitates configuration: inject PostgreSQL in production, SQLite in development, and mock in tests—same code, different contexts. The pattern addresses the new keyword proliferation problem: without DI, object construction code scatters throughout the application (new PaymentProcessor(new StripeAPI(), new Logger()), creating brittle coupling. DI centralizes object graph construction in one place (main() or DI container), making dependencies visible and manageable. Additionally, DI supports cross-cutting concerns: inject logging, monitoring, and caching decorators around business logic without modifying core classes.",
    tradeoffs: {
      pros: [
        "Enables unit testing by injecting mocks instead of real dependencies",
        "Decouples components—objects depend on interfaces, not concrete implementations",
        "Facilitates configuration and environment-specific behavior through injected dependencies",
        "Makes dependencies explicit and visible in constructor signatures",
        "Supports cross-cutting concerns via decorator pattern and proxy wrapping",
        "Simplifies object graph construction with DI containers managing complexity",
      ],
      cons: [
        "Adds indirection—following code execution requires understanding DI container configuration",
        "DI frameworks introduce magic that can be difficult to debug when misconfigured",
        "Steep learning curve for framework-specific annotations and configuration DSLs",
        "Can lead to over-engineering—simple apps don't need elaborate DI containers",
        "Runtime errors from misconfiguration replace compile-time errors",
        "Makes code harder to understand in isolation—must check DI config to see dependencies",
      ],
    },
    relatedPatterns: [
      "inversion-of-control",
      "mocking",
      "test-fixtures",
      "factory-pattern",
      "service-locator",
      "plugin-architecture",
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
      id: "dependency-injection-ts-basic",
      language: "typescript",
      title: "TODO: Dependency Injection Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Dependency Injection
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
