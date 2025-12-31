import type { Pattern } from "../schema";

export const mocking: Pattern = {
  id: "mocking",
  slug: "mocking",
  corpusPath: "🔧 MAINTAINABILITY → 🧪 Testability → 🎭 Mocking",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Testability",
    level: 4,
  },

  concept: {
    name: "Mocking",
    emoji: "🎭",
    tagline: "Fake dependencies",
    definition:
      "Mocking replaces real dependencies (databases, APIs, external services) with controlled fake implementations during testing, enabling isolated verification of component behavior without invoking actual dependencies. Like movie stunt doubles who perform dangerous scenes while actors stay safe, mocks stand in for risky or slow external systems during test execution. A mock database returns predefined data without connecting to Postgres; a mock payment gateway confirms transactions without charging credit cards; a mock email service verifies send() was called without delivering actual emails. The pattern distinguishes several test double types: mocks (verify interactions: was sendEmail() called with correct parameters?), stubs (return canned responses: getUser() always returns {id: 1, name: 'Alice'}), spies (record calls while delegating to real implementation), and fakes (simplified working implementations like in-memory databases). Modern mocking frameworks (Jest, Mockito, unittest.mock) provide APIs to create mocks (jest.fn()), configure return values (.mockReturnValue('data')), and assert interactions (.toHaveBeenCalledWith('arg')). Advanced mocking includes partial mocking (mock some methods while keeping others real) and mock chaining (api.users.get().mockResolvedValue(user)). The key insight: mocks let you test components in isolation by controlling all external interactions, making tests fast, deterministic, and independent of infrastructure.",
    problemSolved:
      "Tests that depend on real external systems (databases, APIs, file systems) are slow, flaky, and difficult to set up. Testing payment processing requires actual payment gateway credentials and generates real transactions. Testing email sending clutters inboxes. Testing against production databases requires complex data seeding and cleanup. These integration tests also run slowly—network round-trips, database queries, and API calls add seconds per test, making test suites that take hours. Mocking solves this by replacing external dependencies with in-memory fakes that return instantly and never fail unpredictably. This enables unit testing in true isolation—you test if the OrderService correctly calculates totals without needing a real database connection. Mocks also facilitate testing error scenarios that are hard to trigger with real systems: how does your code handle network timeouts, database deadlocks, or rate limits? With mocks, you simply configure the mock to throw specific errors. Additionally, mocks verify interactions: did your code call logger.error() when processing failed? Did it call cache.invalidate() after updating data? These behavioral assertions are impossible without mocks because real systems don't expose call history.",
    tradeoffs: {
      pros: [
        "Enables fast, isolated unit tests that run in milliseconds without external dependencies",
        "Makes tests deterministic by eliminating flaky network calls and database state",
        "Facilitates testing error conditions difficult to reproduce with real systems",
        "Allows testing before dependencies exist—mock unimplemented APIs during parallel development",
        "Verifies component interactions and method calls beyond just return values",
        "Eliminates test infrastructure costs—no need for test databases, API sandboxes, or docker containers",
      ],
      cons: [
        "Creates brittle tests coupled to implementation details—refactoring breaks tests even when behavior is correct",
        "Mocks can diverge from real implementations, passing tests but failing in production",
        "Over-mocking leads to 'testing the mocks' rather than actual business logic",
        "Makes tests harder to understand—must check mock configuration to understand test scenario",
        "Provides false confidence when mocks behave differently than real dependencies",
        "Requires maintaining mock implementations alongside real code, doubling maintenance burden",
      ],
    },
    relatedPatterns: [
      "dependency-injection",
      "test-fixtures",
      "integration-testing",
      "contract-testing",
      "test-doubles",
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
      id: "mocking-ts-basic",
      language: "typescript",
      title: "TODO: Mocking Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Mocking
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
