import type { Pattern } from "../schema";

export const propertyBasedTesting: Pattern = {
  id: "property-based-testing",
  slug: "property-based-testing",
  corpusPath: "🔧 MAINTAINABILITY → 🧪 Testability → 📊 Property-Based Testing",

  hierarchy: {
    quality: "maintainability",
    strategy: "",
    family: "Testability",
    level: 4,
  },

  concept: {
    name: "Property-Based Testing",
    emoji: "📊",
    tagline: "Generate test cases",
    definition:
      "Property-Based Testing verifies software by asserting universal properties that should hold true for all inputs, then automatically generating hundreds of randomized test cases to validate those properties. Instead of writing example-based tests (assertEqual(add(2, 3), 5)), you define properties (for all integers x and y, add(x, y) should equal add(y, x)—commutativity) and let testing frameworks like QuickCheck, Hypothesis, or fast-check generate diverse inputs to find edge cases. The framework generates random data matching type constraints (integers, strings, lists) and checks if the property holds. When a property fails, the framework performs shrinking—automatically reducing the failing input to the minimal counterexample (if [1, 2, 3, ..., 1000] fails, shrink to [1]). This reveals the simplest case that breaks your assumptions. Properties often take forms like: idempotence (f(f(x)) == f(x)), round-trip (parse(serialize(x)) == x), invariants (sorted list stays sorted after insertions), or oracle comparisons (optimized_function(x) == reference_implementation(x)). The pattern shifts testing from 'does this work for these examples' to 'does this work for entire classes of inputs.' Advanced property testing includes stateful testing (generate sequences of operations and verify system invariants) and metamorphic testing (verify relationships between function outputs for transformed inputs).",
    problemSolved:
      "Traditional example-based testing only verifies behavior for hand-picked inputs, missing edge cases that developers didn't anticipate. You test add(2, 3) but miss add(Integer.MAX_VALUE, 1) causing overflow. You test sort([3, 1, 2]) but miss sort([1, 1, 1]) breaking assumptions about unique elements. Property-based testing addresses this by generating thousands of inputs you never would have written manually, finding bugs in scenarios you didn't imagine. This is particularly powerful for testing parsers (can parse any valid JSON), serialization (round-trip always works), compression (compressed size <= original), or numerical code (operations preserve mathematical properties). The pattern also solves the test maintenance problem—when you add a new parameter, example-based tests need manual updates, but property-based tests automatically incorporate it into generated inputs. Additionally, properties serve as executable specifications that document behavioral contracts more comprehensively than examples. When properties fail, shrinking produces minimal reproducible examples that make debugging far easier than wading through complex generated inputs.",
    tradeoffs: {
      pros: [
        "Discovers edge cases and corner cases developers never thought to test manually",
        "Generates thousands of diverse test inputs automatically, improving test coverage dramatically",
        "Provides executable specifications that document system behavior comprehensively",
        "Shrinks failures to minimal counterexamples, making debugging significantly easier",
        "Tests remain valid when function signatures change—properties adapt to new parameters automatically",
        "Particularly effective for testing mathematical properties, parsers, codecs, and data transformations",
      ],
      cons: [
        "Requires different thinking—identifying universal properties is harder than writing examples",
        "Can produce slow tests when generating and running thousands of random inputs",
        "Difficult to write properties for business logic with complex domain rules",
        "Failing tests may produce non-deterministic results across test runs due to randomness",
        "Requires seeding random generators for reproducibility in CI/CD environments",
        "Learning curve is steep—developers must understand property thinking and framework APIs",
      ],
    },
    relatedPatterns: [
      "test-fixtures",
      "fuzzing",
      "generative-testing",
      "metamorphic-testing",
      "contract-testing",
      "chaos-engineering",
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
      id: "property-based-testing-ts-basic",
      language: "typescript",
      title: "TODO: Property-Based Testing Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Property-Based Testing
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
