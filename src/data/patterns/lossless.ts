import type { Pattern } from "../schema";

export const lossless: Pattern = {
  id: "lossless",
  slug: "lossless",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📉 Lossless",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Lossless",
    emoji: "📉",
    tagline: "gzip, LZ4, zstd",
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
      id: "lossless-ts-basic",
      language: "typescript",
      title: "TODO: Lossless Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Lossless
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
