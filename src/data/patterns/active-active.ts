import type { Pattern } from "../schema";

export const activeActive: Pattern = {
  id: "active-active",
  slug: "active-active",
  corpusPath:
    "🛡️ RELIABILITY → 📋 Redundancy → Hot/Warm/Cold Standby → 🔥 Active-Active",

  hierarchy: {
    quality: "reliability",
    strategy: "Redundancy",
    family: "Standby",
    level: 4,
  },

  concept: {
    name: "Active-Active",
    emoji: "🔥",
    tagline: "All nodes serve traffic",
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
      id: "active-active-ts-basic",
      language: "typescript",
      title: "TODO: Active-Active Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Active-Active
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
