import type { Pattern } from "../schema";

export const tokenBucket: Pattern = {
  id: "token-bucket",
  slug: "token-bucket",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🚰 Flow Control → 🪣 Token Bucket",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Flow Control",
    level: 4,
  },

  concept: {
    name: "Token Bucket",
    emoji: "🪣",
    tagline: "Smooth rate limiting",
    definition:
      "The Token Bucket is a rate-limiting algorithm that allows requests up to a burst limit while maintaining an average rate over time by replenishing tokens at a fixed rate. Think of it like a prepaid phone card: tokens (minutes) accumulate over time up to a maximum, and you can use them all at once (burst) or gradually. The bucket starts with N tokens and refills at R tokens/second (e.g., 100 tokens/sec). Each request consumes 1 token. If tokens are available, the request proceeds immediately; if not, it is either rejected or queued until tokens replenish. Unlike Leaky Bucket (fixed output rate), Token Bucket allows bursts as long as tokens exist—if the bucket has 100 tokens, 100 requests can be processed instantly, then requests slow to the refill rate. This flexibility makes it ideal for bursty workloads where occasional spikes are acceptable but sustained high rates must be limited. It is widely used in AWS API Gateway, Google Cloud Endpoints, and network traffic policing.",
    problemSolved:
      "Strict rate limiters like Leaky Bucket reject bursts even when the system has capacity to handle them, providing poor user experience. Users expect to occasionally send bursts (e.g., uploading multiple files, refreshing a page triggering multiple API calls) without being throttled. Token Bucket solves this by allowing bursts up to the bucket capacity while enforcing an average rate over time. For example, an API with a 100 req/sec limit and 1000-token bucket allows a client to send 1000 requests instantly, then limits to 100 req/sec going forward. Without Token Bucket, users would be frustrated by rejections during legitimate bursts. It also prevents abuse: a client cannot sustain 200 req/sec indefinitely because tokens deplete faster than they refill. AWS API Gateway uses Token Bucket to allow bursty traffic while protecting backend services from sustained overload.",
    tradeoffs: {
      pros: [
        "Allows controlled bursts up to bucket capacity, improving user experience",
        "Enforces average rate over time while permitting short-term spikes",
        "More flexible than Leaky Bucket—adapts to bursty traffic patterns",
        "Simple to implement with a counter and timestamp tracking",
        "Efficient—O(1) token check and refill calculation per request",
      ],
      cons: [
        "Bursts can still overwhelm downstream systems if bucket size is too large",
        "Requires careful tuning of bucket size and refill rate to balance burst vs. protection",
        "Does not queue requests—excess requests are rejected immediately",
        "Can allow thundering herd if many clients burst simultaneously after idle period",
        "More complex to reason about than fixed-rate limiters (Leaky Bucket)",
      ],
    },
    relatedPatterns: [
      "leaky-bucket",
      "rate-limiting",
      "throttling",
      "backpressure",
      "circuit-breaker",
      "windowing",
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
      id: "token-bucket-ts-basic",
      language: "typescript",
      title: "TODO: Token Bucket Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Token Bucket
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
