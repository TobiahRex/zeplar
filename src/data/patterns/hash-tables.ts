import type { Pattern } from "../schema";

export const hashTables: Pattern = {
  id: "hash-tables",
  slug: "hash-tables",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → #️⃣ Hash Tables",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Hash Tables",
    emoji: "#️⃣",
    tagline: "O(1) key lookup",
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
      id: "hash-tables-ts-basic",
      language: "typescript",
      title: "TODO: Hash Tables Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Hash Tables
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
