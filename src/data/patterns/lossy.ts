import type { Pattern } from "../schema";

export const lossy: Pattern = {
  id: "lossy",
  slug: "lossy",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📊 Lossy",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Lossy",
    emoji: "📊",
    tagline: "JPEG, MP3 (acceptable quality loss)",
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
      id: "lossy-ts-basic",
      language: "typescript",
      title: "TODO: Lossy Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Lossy
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
