import type { Pattern } from "../schema";

export const leastConnections: Pattern = {
  id: "least-connections",
  slug: "least-connections",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚖️ Load Balancing → ⚖️ Least Connections",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Load Balancing",
    level: 4,
  },

  concept: {
    name: "Least Connections",
    emoji: "⚖️",
    tagline: "Route to least busy",
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
      id: "least-connections-ts-basic",
      language: "typescript",
      title: "TODO: Least Connections Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Least Connections
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
