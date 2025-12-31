import type { Pattern } from "../schema";

export const stringInterning: Pattern = {
  id: "string-interning",
  slug: "string-interning",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 🏗️ Structural → 🔤 String Interning",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Structural",
    level: 4,
  },

  concept: {
    name: "String Interning",
    emoji: "🔤",
    tagline: "Canonical string instances",
    definition:
      "String interning is a memory optimization technique that stores only one copy of each distinct string value in a pool, ensuring that all references to identical strings point to the same memory location. Think of it like a library system where multiple people can borrow references to the same book instead of printing duplicate copies for everyone. When you intern a string, the system checks if an identical string already exists in the intern pool; if yes, it returns the existing reference, if no, it adds the string to the pool and returns its reference. For example, if your application processes thousands of log entries containing the status 'SUCCESS', instead of storing 'SUCCESS' thousands of times in memory, string interning stores it once and all references point to that single instance. Many languages like Java and Python automatically intern string literals at compile time. String comparison also becomes faster: instead of character-by-character comparison, you can use fast pointer equality checks.",
    problemSolved:
      "Applications that work with many duplicate strings waste enormous amounts of memory storing the same content repeatedly. Parsing configuration files, processing logs, loading databases with categorical data, and handling network protocols all generate countless duplicate strings. Without interning, each duplicate consumes full memory allocation, and string comparisons require expensive character-by-character checks. String interning solves this by deduplicating strings at the memory level and enabling O(1) equality comparisons via pointer checks. This is especially important in memory-constrained environments or when processing large datasets with low string cardinality.",
    tradeoffs: {
      pros: [
        "Significant memory savings when many duplicate strings exist; can reduce string memory usage by 70-90%",
        "Extremely fast string equality comparison using pointer comparison instead of character iteration",
        "Improved cache performance since fewer unique string values fit better in CPU cache",
        "Automatic deduplication happens transparently; developers get benefits without manual string management",
        "Enables efficient use of strings as dictionary keys or in sets with O(1) hash comparisons",
      ],
      cons: [
        "Interning overhead includes hash table lookup and potential string copy for first occurrence",
        "Interned strings persist in memory for the application lifetime, creating a memory leak if interning unbounded values",
        "Not beneficial for unique or rarely repeated strings; overhead exceeds benefits",
        "Thread synchronization overhead when multiple threads intern strings concurrently",
        "Immutability requirement means strings cannot be modified in place, requiring new allocations for changes",
      ],
    },
    relatedPatterns: [
      "flyweight",
      "object-pooling",
      "dictionary-coding",
      "memoization",
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
      id: "string-interning-ts-basic",
      language: "typescript",
      title: "TODO: String Interning Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for String Interning
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
