import type { Pattern } from "../schema";

export const testFixtures: Pattern = {
  id: "test-fixtures",
  slug: "test-fixtures",
  corpusPath: "🔧 MAINTAINABILITY → 🧪 Testability → 🎬 Test Fixtures",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Testability",
    level: 4,
  },

  concept: {
    name: "Test Fixtures",
    emoji: "🎬",
    tagline: "Reusable test data",
    definition:
      "Test Fixtures are predefined, reusable data sets and system states used to establish consistent baseline conditions for automated tests. Like setting up a stage before a theater performance, fixtures prepare the testing environment with known data, mocked dependencies, and configured state so tests execute against predictable scenarios. Fixtures range from simple object builders (UserFixture.create({ email: 'test@example.com' })) to complex database seeding scripts that populate entire schemas. The pattern emphasizes reusability—common test scenarios like 'authenticated user,' 'empty shopping cart,' or 'expired subscription' are defined once and shared across test suites. Modern fixture patterns include factory functions (FactoryGirl, Faker), builder patterns for complex objects, and database transaction wrappers that roll back changes after each test. Fixtures solve the brittle test problem where hard-coded data creates fragile dependencies: when UserFixture changes the test user's email, all tests automatically use the updated value rather than breaking. Advanced fixtures support parameterization (UserFixture.admin(), UserFixture.withOrders(5)) and composition (combining multiple fixtures to create scenarios). Think of fixtures as the mise en place of testing—pre-prepared ingredients that let you focus on the recipe (test logic) rather than chopping vegetables (data setup) every time.",
    problemSolved:
      "Tests require consistent, realistic data to verify behavior, but manually creating test data in every test leads to brittle, duplicative, unmaintainable code. When business logic changes (User now requires phone number), hundreds of tests break because each manually constructs User objects. Test fixtures solve this by centralizing test data creation, so changes propagate automatically. Without fixtures, tests hard-code values (expect(user.email).toBe('alice@example.com')), creating coupling to specific data that breaks when fixtures evolve. Fixtures enable data independence—tests specify traits (adminUser) rather than values. This also addresses the test pollution problem where tests create data that leaks between tests, causing flaky failures when Test B depends on data from Test A. Fixtures combined with database transaction rollbacks ensure test isolation. Additionally, fixtures handle complex object graphs—creating a realistic Order requires Customer, LineItems, Products, Inventory, and PaymentMethod. Fixture builders automate this tedious setup, letting tests focus on the behavior under test rather than boilerplate data construction.",
    tradeoffs: {
      pros: [
        "Centralizes test data creation, eliminating duplication across test suites",
        "Makes tests more maintainable—changing fixture definition updates all dependent tests",
        "Improves test readability by using semantic names (adminUser, expiredSubscription) instead of verbose object construction",
        "Enables test data evolution without breaking existing tests through abstraction",
        "Supports complex object graphs with nested dependencies through builder patterns",
        "Facilitates test isolation when combined with database transaction rollback strategies",
      ],
      cons: [
        "Can create hidden coupling if too many tests depend on same fixture—changes break unrelated tests",
        "Obscures actual test data being used, making tests harder to understand in isolation",
        "Encourages shared mutable state if fixtures aren't properly isolated between tests",
        "Adds indirection that can make debugging harder—need to check fixture definition to understand test",
        "Can lead to fixture proliferation with hundreds of specialized fixtures that become maintenance burden",
        "May encourage lazy testing where developers reuse fixtures instead of crafting minimal test cases",
      ],
    },
    relatedPatterns: [
      "mocking",
      "dependency-injection",
      "test-doubles",
      "factory-pattern",
      "builder-pattern",
      "database-seeding",
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
      id: "test-fixtures-ts-basic",
      language: "typescript",
      title: "TODO: Test Fixtures Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Test Fixtures
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
