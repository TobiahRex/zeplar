import type { Pattern } from "../schema";

export const leakyBucket: Pattern = {
  id: "leaky-bucket",
  slug: "leaky-bucket",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🚰 Flow Control → 🚰 Leaky Bucket",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Flow Control",
    level: 4,
  },

  concept: {
    name: "Leaky Bucket",
    emoji: "🚰",
    tagline: "Fixed outflow rate",
    definition:
      "The Leaky Bucket is a rate-limiting algorithm that enforces a constant, smooth output rate by processing requests from a queue at a fixed rate, regardless of how bursty the input is. Think of it like a bucket with a small hole in the bottom: water flows in at variable rates (bursty traffic), but leaks out at a constant rate (fixed processing rate). Requests arrive and are added to a FIFO queue (the bucket). A processor removes requests from the queue at a fixed rate (e.g., 100 requests/second) and processes them. If the bucket overflows (queue is full), new requests are rejected. The key characteristic is that output is perfectly smooth—even if 1000 requests arrive in a burst, they are processed at exactly 100/sec. This differs from Token Bucket, which allows bursts as long as tokens are available. Leaky Bucket is ideal when downstream systems require a perfectly constant rate to avoid overwhelming them. It is used in network traffic shaping, API rate limiting, and job queue processing.",
    problemSolved:
      "Many systems experience bursty traffic that can overwhelm downstream services if not smoothed out. For example, an API might receive 1000 requests in 1 second, then nothing for 9 seconds, averaging 100 req/sec. If all 1000 are forwarded immediately, the database or backend service could be overwhelmed. Leaky Bucket solves this by converting bursty input into smooth, predictable output at a constant rate. Requests exceeding the bucket capacity are rejected, preventing unbounded queueing. Without Leaky Bucket, systems would either forward bursts directly (risking overload) or use unbounded queues (risking memory exhaustion). For example, network routers use leaky bucket to shape traffic at a constant bit rate, preventing link congestion. APIs use it to enforce strict rate limits, ensuring downstream services receive requests at a sustainable rate regardless of client behavior.",
    tradeoffs: {
      pros: [
        "Guarantees perfectly smooth output rate, protecting downstream systems from bursts",
        "Simple to implement with a FIFO queue and fixed-rate processor",
        "Prevents overwhelming downstream services with unpredictable traffic spikes",
        "Bounded queue size prevents memory exhaustion from unbounded queueing",
        "Predictable behavior—output rate is constant and easy to reason about",
      ],
      cons: [
        "Rejects requests when bucket is full, even if system has spare capacity later",
        "Adds latency for all requests due to queueing (requests wait in line)",
        "Does not allow bursts even when downstream has capacity to handle them",
        "Fixed rate may underutilize resources during low-traffic periods",
        "Queue size configuration is tricky—too small rejects valid traffic, too large adds latency",
      ],
    },
    relatedPatterns: [
      "token-bucket",
      "rate-limiting",
      "backpressure",
      "throttling",
      "windowing",
      "batching",
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
      id: "leaky-bucket-ts-basic",
      language: "typescript",
      title: "TODO: Leaky Bucket Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Leaky Bucket
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
