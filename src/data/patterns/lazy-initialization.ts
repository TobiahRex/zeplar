import type { Pattern } from "../schema";

export const lazyInitialization: Pattern = {
  id: "lazy-initialization",
  slug: "lazy-initialization",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 😴 Lazy → 🦥 Lazy Initialization",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Lazy",
    level: 4,
  },

  concept: {
    name: "Lazy Initialization",
    emoji: "🦥",
    tagline: "Create on first use",
    definition:
      "Lazy Initialization is a performance optimization pattern that delays the creation of expensive objects until they are actually needed, rather than initializing them upfront. Like not buying groceries until you know what you want to cook, lazy initialization postpones resource allocation, object construction, or computation until the moment of first access. The pattern typically wraps object creation in a conditional check: if the object exists, return it immediately; if not, create it, store it, and then return it. Subsequent accesses bypass creation and use the cached instance. This is particularly valuable for heavyweight resources like database connections, large data structures, expensive computations, or external service clients that may never be used during a particular execution. Implementation often uses a private nullable field that starts as null, with a getter method that checks for null, creates the object if needed, and caches it for future calls. Thread-safe implementations require synchronization (double-checked locking, atomic operations) to prevent multiple threads from creating duplicate instances concurrently. The pattern reduces application startup time, conserves memory by only allocating what's actually used, and enables faster recovery from failures by avoiding expensive initialization of unused components.",
    problemSolved:
      "Applications that initialize all resources eagerly at startup face multiple performance problems. Startup time balloons as databases connect, configuration files parse, caches warm, and dependencies initialize—turning 1-second startups into 30-second waits. Memory consumption spikes from allocating large data structures that may never be accessed—a reporting module's 500MB in-memory data set shouldn't load if no reports are generated. Development and testing cycles slow down as every application start pays full initialization cost even when testing a single feature that requires only a fraction of resources. Cloud auto-scaling becomes less effective when instances take 30+ seconds to become ready, limiting elasticity during traffic spikes. Lazy Initialization solves these problems by deferring creation until actual use. Startup time drops dramatically since only minimal bootstrap logic runs—the application becomes responsive in seconds rather than tens of seconds. Memory footprint stays proportional to actual usage rather than total potential usage. Development iterations speed up because only the components needed for the current code path initialize. Cold starts in serverless environments improve since unused code paths never trigger their expensive initialization. The pattern also enables graceful degradation: if a rarely-used component fails to initialize, the application can continue serving most functionality rather than failing completely at startup.",
    tradeoffs: {
      pros: [
        "Faster application startup time by deferring expensive initialization",
        "Reduced memory footprint—only allocate resources that are actually used",
        "Enables graceful degradation—non-critical components can fail without blocking startup",
        "Improves development iteration speed by initializing only needed components",
        "Better cold start performance in serverless and auto-scaling scenarios",
      ],
      cons: [
        "First access incurs latency penalty for object creation",
        "Requires thread-safe implementation for concurrent environments",
        "Can hide initialization errors until runtime instead of failing fast at startup",
        "Adds complexity with null checks and synchronization",
        "Makes resource usage unpredictable and harder to capacity plan",
      ],
    },
    relatedPatterns: [
      "lazy-loading",
      "singleton",
      "double-checked-locking",
      "object-pooling",
      "dependency-injection",
      "on-demand-initialization",
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
      id: "lazy-initialization-ts-basic",
      language: "typescript",
      title: "TODO: Lazy Initialization Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Lazy Initialization
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
