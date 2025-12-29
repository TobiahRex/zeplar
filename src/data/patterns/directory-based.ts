import type { Pattern } from "../schema";

export const directoryBased: Pattern = {
  id: "directory-based",
  slug: "directory-based",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 🧩 Sharding → 🗺️ Directory-Based",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Sharding",
    level: 4,
  },

  concept: {
    name: "Directory-Based",
    emoji: "🗺️",
    tagline: "Lookup table for routing",
    definition:
      "TODO: Expand from corpus tagline and add comprehensive definition",
    problemSolved: "TODO: What problem does this pattern solve?",
    tradeoffs: {
      pros: ["TODO: List advantages of this pattern"],
      cons: ["TODO: List drawbacks and limitations"],
    },
    relatedPatterns: [], // TODO: Find related patterns in same family
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
      id: "directory-based-ts-basic",
      language: "typescript",
      title: "TODO: Directory-Based Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Directory-Based
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
