import type { Pattern } from "../schema";

export const microBatching: Pattern = {
  id: "micro-batching",
  slug: "micro-batching",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → ⏱️ Micro-Batching",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Micro-Batching",
    emoji: "⏱️",
    tagline: "Collect over time window",
    definition:
      "Micro-batching is a technique that collects individual requests or events over a very small time window (typically milliseconds to a few seconds) and processes them together as a single batch. Think of it like a subway train that waits just long enough to fill a few more seats before departing—it doesn't wait for a full train, but it doesn't leave immediately empty either. For example, a database service might collect 100 write requests arriving within 10 milliseconds and execute them as a single batch query, or a machine learning API might group prediction requests arriving within 50ms to process them in parallel on a GPU. The pattern operates by maintaining a buffer and timer: items are added to the buffer as they arrive, and when either the buffer reaches a maximum size or the time window expires, the entire batch is processed. This balances the efficiency gains of batching (reduced per-item overhead, better resource utilization) against the latency cost of waiting. The key distinction from traditional batching is the short time windows, which keep latency minimal while still gaining most of the efficiency benefits.",
    problemSolved:
      "Processing items individually creates unnecessary overhead when operations can be grouped together, but traditional large batches introduce unacceptable latency. For example, sending individual database INSERT statements for 1000 concurrent user signups wastes network round-trips and transaction overhead. However, waiting to collect all 1000 signups before processing means early users wait for late arrivals. Micro-batching solves this by grouping requests that arrive within small time windows—users who sign up within the same 20ms window get processed together, reducing database calls by 10-50x while keeping latency under 100ms. This is particularly crucial in GPU-based machine learning inference where single predictions waste GPU capacity, but waiting for full batches delays responses. The pattern enables efficient resource usage without sacrificing real-time responsiveness.",
    tradeoffs: {
      pros: [
        "Reduces per-item processing overhead significantly, often improving throughput by 5-50x for operations like database writes, network calls, or GPU inference",
        "Maximizes hardware utilization by amortizing fixed costs (network round-trips, GPU kernel launches, transaction overhead) across multiple items instead of paying per-item",
        "Keeps latency low compared to traditional batching by using millisecond-scale windows rather than waiting for full buffers, typically adding only 10-100ms delay",
        "Naturally adapts to traffic patterns: high traffic fills batches faster reducing per-item wait time, low traffic processes smaller batches without excessive delays",
      ],
      cons: [
        "Introduces bounded latency (the wait window) even for the first item in a batch, making it unsuitable for ultra-low-latency requirements under 10ms",
        "Adds implementation complexity with timers, buffers, and batch coordination logic that must handle edge cases like partial batches on timeout",
        "Requires careful tuning of window size and batch limits: too small wastes batching benefits, too large increases latency and memory pressure",
        "Can complicate error handling since failures may affect an entire batch, requiring individual retry logic or batch splitting strategies",
      ],
    },
    relatedPatterns: [
      "batching",
      "windowing",
      "streaming",
      "debouncing",
      "bulk-operations",
      "connection-pooling",
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
      id: "micro-batching-ts-basic",
      language: "typescript",
      title: "TODO: Micro-Batching Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Micro-Batching
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
