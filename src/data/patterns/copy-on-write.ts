import type { Pattern } from "../schema";

export const copyOnWrite: Pattern = {
  id: "copy-on-write",
  slug: "copy-on-write",
  corpusPath: "⚡ PERFORMANCE → 🎯 Work Reduction → 😴 Lazy → 📖 Copy-on-Write",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Lazy",
    level: 4,
  },

  concept: {
    name: "Copy-on-Write",
    emoji: "📖",
    tagline: "Defer copy until mutation",
    definition:
      "Copy-on-Write (CoW) is a resource management optimization where multiple processes or operations can share the same data until one of them needs to modify it, at which point a private copy is created. Think of it like photocopying a document: everyone can read the original, but if someone wants to make edits, they get their own copy to mark up. The technique works by initially sharing references to the same underlying data structure, and only creating copies when a write operation occurs. For example, when you fork a process in Unix, the child process initially shares all memory pages with the parent through CoW; only when either process writes to a page does the OS create a separate copy of that page. This same pattern appears in data structures (persistent data structures in functional programming), version control systems (Git stores snapshots efficiently), and file systems (Btrfs, ZFS use CoW for snapshots). The power is in avoiding unnecessary copies: if data is never modified, no copy is ever made.",
    problemSolved:
      "Copying large data structures is expensive in both time and memory, but sometimes multiple operations need independent copies to avoid interfering with each other. Eagerly copying everything wastes resources when most data never gets modified. Copy-on-Write solves this by deferring the cost of copying until absolutely necessary - when a write occurs. Without CoW, systems either waste memory making defensive copies upfront, or risk data corruption by sharing mutable structures. CoW enables efficient patterns like fast process forking, cheap snapshots of file systems and databases, immutable data structures with good performance, and safe concurrent access to shared data.",
    tradeoffs: {
      pros: [
        "Dramatically reduces memory usage when data is frequently read but rarely modified, like forked processes that mostly execute the same code",
        "Makes operations like snapshots and cloning nearly instantaneous since no actual copying happens upfront",
        "Enables safe sharing of data structures across threads without locks, since modifications create new versions",
        "Natural fit for functional programming patterns and immutable data structures with reasonable performance",
        "Automatic optimization; developers get the benefits without complex manual memory management",
      ],
      cons: [
        "Write operations become more expensive due to the overhead of detecting modifications and copying data",
        "Memory fragmentation can increase since modified pages/structures get scattered across memory",
        "Difficult to predict actual memory usage since it depends on runtime modification patterns",
        "Reference counting overhead in implementations that track shared vs. unique ownership",
        "Poor performance for write-heavy workloads where most data gets modified, negating the optimization",
      ],
    },
    relatedPatterns: [
      "lazy-loading",
      "memoization",
      "object-pooling",
      "flyweight",
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
      id: "copy-on-write-ts-basic",
      language: "typescript",
      title: "TODO: Copy-on-Write Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Copy-on-Write
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
