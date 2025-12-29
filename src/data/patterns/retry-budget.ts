import type { Pattern } from "../schema";

export const retryBudget: Pattern = {
  id: "retry-budget",
  slug: "retry-budget",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retry → 🎯 Retry Budget",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retry",
    level: 4,
  },

  concept: {
    name: "Retry Budget",
    emoji: "🎯",
    tagline: "Cap total retries",
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
      id: "retry-budget-ts-basic",
      language: "typescript",
      title: "TODO: Retry Budget Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Retry Budget
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
