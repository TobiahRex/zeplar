import type { Pattern } from "../schema";

export const readQuorum: Pattern = {
  id: "read-quorum",
  slug: "read-quorum",
  corpusPath: "🛡️ RELIABILITY → 📋 Redundancy → 🗳️ Quorum → 📖 Read Quorum",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Quorum",
    level: 4,
  },

  concept: {
    name: "Read Quorum",
    emoji: "📖",
    tagline: "R nodes must respond",
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
      id: "read-quorum-ts-basic",
      language: "typescript",
      title: "TODO: Read Quorum Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Read Quorum
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
