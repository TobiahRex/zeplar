import type { Pattern } from "../schema";

export const nagleSAlgorithm: Pattern = {
  id: "nagle-s-algorithm",
  slug: "nagle-s-algorithm",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 📦 Nagle's Algorithm",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Nagle's Algorithm",
    emoji: "📦",
    tagline: "TCP batching small packets",
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
      id: "nagle-s-algorithm-ts-basic",
      language: "typescript",
      title: "TODO: Nagle's Algorithm Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Nagle's Algorithm
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
