import type { Pattern } from "../schema";

export const coalescing: Pattern = {
  id: "coalescing",
  slug: "coalescing",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → ⭐ Coalescing",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Coalescing",
    emoji: "⭐",
    tagline: "Merge concurrent identical requests",
    definition:
      "Request Coalescing (also called Request Deduplication) is an optimization pattern that detects multiple concurrent identical requests and executes them only once, sharing the result among all callers. Like carpooling where multiple people heading to the same destination share one vehicle instead of driving separately, coalescing identifies when multiple clients request the exact same resource simultaneously and consolidates those requests into a single backend operation. When the first request arrives for a key (URL, cache key, query), the coalescer executes the operation and stores a promise/future representing the pending result. Subsequent requests for the same key that arrive before the first completes are attached to the existing promise rather than triggering duplicate work. Once the operation finishes, all waiting callers receive the same result. This pattern is particularly effective for expensive operations with high concurrent duplication: cache stampedes (1000 clients all miss the same cache key simultaneously), external API calls (multiple requests for the same user profile), or database queries (concurrent reads of the same record). Implementation typically uses in-memory maps tracking in-flight requests by key, with careful consideration for error handling (do all waiters fail if one request fails?) and timeout behavior.",
    problemSolved:
      "Cache stampedes create a vicious cycle where a popular cache entry expires, and suddenly hundreds or thousands of concurrent requests all experience cache misses simultaneously, each triggering expensive database queries or API calls to regenerate the same data. A viral social media post viewed by 10,000 users per second can trigger 10,000 simultaneous database queries when the cache expires, overwhelming the database and causing cascade failures. External API calls face similar problems: when multiple users request the same resource (trending article, popular product), applications make redundant identical API calls, wasting bandwidth, consuming rate limits, and increasing latency. Request Coalescing solves this by ensuring only one request executes the expensive operation while all others wait and share the result. When 10,000 clients simultaneously request a user profile after cache expiration, coalescing executes one database query and distributes the result to all 10,000 waiters. This dramatically reduces database load (10,000 queries become 1), conserves API rate limits (1 call instead of 10,000), and improves overall system efficiency.",
    tradeoffs: {
      pros: [
        "Eliminates duplicate work for concurrent identical requests",
        "Prevents cache stampede scenarios that overwhelm databases",
        "Conserves API rate limits by deduplicating external calls",
        "Reduces backend load during traffic spikes on popular resources",
        "Improves latency for requests that arrive after the first (no wait for operation)",
      ],
      cons: [
        "Adds complexity with in-flight request tracking and promise management",
        "Memory overhead for storing pending request keys and promises",
        "All waiters fail if the single coalesced request fails (no retry diversity)",
        "Requires careful key generation to identify truly identical requests",
        "Short-lived benefit window—only helps during exact concurrency overlap",
      ],
    },
    relatedPatterns: [
      "singleflight",
      "cache-aside",
      "batching",
      "memoization",
      "request-deduplication",
      "stampede-prevention",
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
      id: "coalescing-ts-basic",
      language: "typescript",
      title: "TODO: Coalescing Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Coalescing
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
