import type { Pattern } from "../schema";

export const writeBuffering: Pattern = {
  id: "write-buffering",
  slug: "write-buffering",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 💾 Write Buffering",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Write Buffering",
    emoji: "💾",
    tagline: "Accumulate before flush",
    definition:
      "Write buffering is a performance optimization that accumulates multiple small write operations in memory before flushing them to storage or network in larger, more efficient batches. Think of it like filling a bucket before making a trip to empty it, rather than making a separate trip for every drop of water. The pattern maintains an in-memory buffer where writes accumulate until a threshold is reached (buffer full, time elapsed, or explicit flush) at which point all buffered writes are committed together. For example, instead of writing each log line immediately to disk (expensive I/O operation), a logging library might buffer 1000 lines or 5 seconds worth of logs before flushing. This amortizes the overhead of I/O operations across many writes. Operating systems use write buffers for file I/O, databases use them for transaction logs, and network protocols buffer small packets. The Linux page cache is a sophisticated write buffer that batches disk writes automatically.",
    problemSolved:
      "I/O operations to disk or network are orders of magnitude slower than memory operations, and each operation has significant overhead from system calls, context switches, and device latencies. Applications making many small writes suffer terrible performance from constant I/O overhead. Write buffering solves this by batching writes into larger operations that amortize the fixed overhead across many logical writes. Without buffering, high-throughput applications like databases, log processing, and streaming systems would be bottlenecked by I/O. Write buffering transforms thousands of microsecond-scale memory writes into a few millisecond-scale I/O operations, dramatically improving throughput.",
    tradeoffs: {
      pros: [
        "Dramatically improved write throughput by amortizing I/O overhead across many operations, often 10-100x faster",
        "Reduced system overhead from fewer system calls, context switches, and device interactions",
        "Better sequential I/O patterns that storage devices and networks handle more efficiently than random small writes",
        "Opportunity to coalesce or eliminate redundant writes before they reach storage",
        "Lower power consumption from fewer disk spin-ups and network radio activations",
      ],
      cons: [
        "Data loss risk if buffer isn't flushed before crash or power failure; writes in buffer are lost",
        "Increased latency between write call and durable storage; recent writes may not be persisted yet",
        "Memory overhead from maintaining buffers; must balance buffer size against available memory",
        "Complexity in error handling since write errors may occur asynchronously during flush, far from the original write call",
        "Potential for I/O spikes when large buffers flush, creating unpredictable latency patterns",
      ],
    },
    relatedPatterns: [
      "batching",
      "micro-batching",
      "dataloader",
      "write-ahead-logging",
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
      id: "write-buffering-ts-basic",
      language: "typescript",
      title: "TODO: Write Buffering Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Write Buffering
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
