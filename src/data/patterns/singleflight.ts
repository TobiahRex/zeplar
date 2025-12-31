import type { Pattern } from "../schema";

export const singleflight: Pattern = {
  id: "singleflight",
  slug: "singleflight",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → ✈️ Singleflight",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Singleflight",
    emoji: "✈️",
    tagline: "Go's stdlib request dedup",
    definition:
      "Singleflight is Go's standard library implementation of request coalescing that ensures duplicate concurrent requests are executed only once, with all callers receiving the same result. Part of the golang.org/x/sync package, Singleflight provides a Group type with a Do method that takes a key and a function. When multiple goroutines call Do with the same key concurrently, only the first invocation executes the function while others block waiting for the result. All callers receive the same return value and error from the single execution. The pattern is specifically designed to prevent duplicate work in concurrent scenarios like cache fills, API calls, or expensive computations. Singleflight handles edge cases carefully: if the executing call panics, waiting goroutines receive the panic; if new requests arrive after execution starts but before completion, they join the waiting group; forgotten requests can be cancelled to allow retry with DoChan variant. The implementation uses sync.WaitGroup and channels internally to coordinate goroutines efficiently without busy-waiting. This pattern is particularly valuable in Go applications because the language's excellent concurrency support makes it easy to accidentally trigger massive concurrent duplicate requests.",
    problemSolved:
      "Go's lightweight goroutines make it trivial to spawn thousands of concurrent operations, but this power creates problems when many goroutines simultaneously request the same resource. Consider a cache miss scenario: 1000 goroutines concurrently fetch user profile ID 123. Without coordination, all 1000 will execute database queries for the same record, overwhelming the database with redundant work. The problem is exacerbated by Go's CSP model where goroutines operate independently—there's no natural mechanism preventing duplicate concurrent operations on the same key. Additionally, external API calls become wasteful: 100 goroutines all calling the GitHub API for the same repository details consume rate limits and bandwidth unnecessarily. Singleflight solves this by providing a simple, goroutine-safe mechanism to coordinate duplicate requests. When 1000 goroutines call group.Do('user:123', fetchUser), only one actually executes fetchUser while the other 999 block waiting. Once the first completes, all 1000 receive the result simultaneously. This transforms 1000 database queries or API calls into a single operation, dramatically reducing backend load.",
    tradeoffs: {
      pros: [
        "Prevents duplicate concurrent work with minimal code changes",
        "Thread-safe coordination across goroutines without manual locking",
        "Dramatically reduces database/API load during cache miss storms",
        "Simple API (just wrap expensive calls in group.Do)",
        "Built into Go's extended standard library with well-tested implementation",
      ],
      cons: [
        "All waiters share the same error if the single call fails",
        "Go-specific pattern, not directly portable to other languages",
        "Requires choosing appropriate keys to identify duplicate work",
        "Waiting goroutines block until first completes (no timeout by default)",
        "Lost retry diversity—one failure affects all concurrent requesters",
      ],
    },
    relatedPatterns: [
      "coalescing",
      "request-deduplication",
      "cache-aside",
      "memoization",
      "stampede-prevention",
      "goroutine-coordination",
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
      id: "singleflight-ts-basic",
      language: "typescript",
      title: "TODO: Singleflight Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Singleflight
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
