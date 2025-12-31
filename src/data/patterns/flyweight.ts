import type { Pattern } from "../schema";

export const flyweight: Pattern = {
  id: "flyweight",
  slug: "flyweight",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 🏗️ Structural → 🪶 Flyweight",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Structural",
    level: 4,
  },

  concept: {
    name: "Flyweight",
    emoji: "🪶",
    tagline: "Share intrinsic state",
    definition:
      "Flyweight is a structural design pattern that minimizes memory usage by sharing common data (intrinsic state) across many similar objects, while storing unique data (extrinsic state) separately. Think of it like a font rendering system: instead of storing the complete font data for every character on a page, you store one copy of each letter's shape and just track the position, size, and color for each instance. The pattern separates object state into intrinsic (shared, immutable) and extrinsic (unique, context-dependent) parts. For example, in a text editor displaying a million characters, instead of a million complete character objects, you have 26 flyweight letter objects (a-z) and a million small records storing just position and format. The flyweight factory ensures only one instance exists per unique intrinsic state. This is common in game engines (sharing 3D models for repeated entities), UI frameworks (icon instances), and document renderers (glyph sharing).",
    problemSolved:
      "Applications that need to represent large numbers of fine-grained objects often face memory exhaustion when each object carries significant data, even though many objects share most of their state. Creating millions of complete objects is wasteful when most of their data is identical. Flyweight solves this by extracting shared state into pooled objects that are referenced by many lightweight objects carrying only unique state. Without flyweight, applications either limit the number of objects they can handle, consume excessive memory, or implement ad-hoc sharing mechanisms. Flyweight enables applications to handle vast numbers of objects while keeping memory usage proportional to the number of unique states rather than total object count.",
    tradeoffs: {
      pros: [
        "Dramatic memory savings when many objects share common state; can reduce usage by 90%+ in appropriate scenarios",
        "Increased object creation speed since shared flyweights are cached and reused instead of allocated",
        "Naturally thread-safe for intrinsic state since flyweights are immutable and shared across threads",
        "Improved cache efficiency since shared data is loaded into CPU cache once and reused",
        "Enables handling millions of objects that would otherwise exceed available memory",
      ],
      cons: [
        "Increased code complexity from separating intrinsic and extrinsic state across different objects",
        "Additional CPU overhead from managing flyweight factories and looking up shared instances",
        "Extrinsic state must be passed as parameters to flyweight methods, cluttering method signatures",
        "Difficult to identify which state should be intrinsic vs extrinsic in complex domains",
        "Not beneficial when objects have mostly unique state or when total object count is small",
      ],
    },
    relatedPatterns: [
      "object-pooling",
      "string-interning",
      "copy-on-write",
      "memoization",
    ],
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
      id: "flyweight-ts-basic",
      language: "typescript",
      title: "TODO: Flyweight Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Flyweight
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
