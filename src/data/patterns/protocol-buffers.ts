import type { Pattern } from "../schema";

export const protocolBuffers: Pattern = {
  id: "protocol-buffers",
  slug: "protocol-buffers",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📦 Protocol Buffers",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Protocol Buffers",
    emoji: "📦",
    tagline: "Binary serialization",
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
      id: "protocol-buffers-ts-basic",
      language: "typescript",
      title: "TODO: Protocol Buffers Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Protocol Buffers
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
