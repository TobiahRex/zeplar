import type { Pattern } from "../schema";

export const hashIndex: Pattern = {
  id: "hash-index",
  slug: "hash-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → #️⃣ Hash Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "Hash Index",
    emoji: "#️⃣",
    tagline: "Direct key lookup",
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
      id: "hash-index-ts-basic",
      language: "typescript",
      title: "TODO: Hash Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Hash Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
