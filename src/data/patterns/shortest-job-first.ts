import type { Pattern } from "../schema";

export const shortestJobFirst: Pattern = {
  id: "shortest-job-first",
  slug: "shortest-job-first",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🔝 Prioritization → ⏱️ Shortest Job First",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Prioritization",
    level: 4,
  },

  concept: {
    name: "Shortest Job First",
    emoji: "⏱️",
    tagline: "Minimize wait time",
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
      id: "shortest-job-first-ts-basic",
      language: "typescript",
      title: "TODO: Shortest Job First Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Shortest Job First
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
