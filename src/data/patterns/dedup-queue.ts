import type { Pattern } from "../schema";

export const dedupQueue: Pattern = {
  id: "dedup-queue",
  slug: "dedup-queue",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 📭 Dedup Queue",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Dedup Queue",
    emoji: "📭",
    tagline: "Drop duplicate messages",
    definition:
      "Dedup Queue eliminates duplicate messages from a queue before processing, preventing redundant work when the same event or request arrives multiple times. Think of it like ignoring repeated phone calls from the same person within a short period—you already got the message the first time. In event-driven systems, a user clicking 'refresh cache' 10 times in a second generates 10 identical cache invalidation messages. A dedup queue uses a hash or unique ID to track recently seen messages (e.g., last 60 seconds) and drops duplicates, processing the cache invalidation once instead of ten times. The deduplication window is critical: too short and you miss duplicates from retry storms, too long and memory grows unbounded. For example, tracking message IDs in a 5-minute sliding window using a LRU cache catches duplicates from typical retry intervals while bounding memory. The pattern is essential for idempotent operations where repeating the same work wastes resources, unlike non-idempotent operations where duplicates cause correctness issues.",
    problemSolved:
      "Distributed systems naturally create duplicate messages through retries, network partitions, and at-least-once delivery semantics. A client timeout may trigger a retry while the original request is still processing, creating duplicate work. Message brokers with at-least-once semantics (Kafka, RabbitMQ) can deliver the same message multiple times. Processing duplicates wastes CPU, database capacity, and API quotas, especially for expensive operations like sending emails, charging credit cards, or regenerating ML model predictions. Dedup Queue solves this by filtering duplicates before they reach expensive processing logic, reducing wasted work by 50-90% in retry-heavy systems. This is critical for high-volume event processing, notification systems that must not spam users, and batch processing where duplicate records corrupt aggregations.",
    tradeoffs: {
      pros: [
        "Reduces wasted processing of duplicate messages by 50-90% in systems with frequent retries or at-least-once delivery",
        "Prevents duplicate side effects like sending multiple notification emails or charging customers twice",
        "Lowers resource costs (CPU, database, API quotas) by avoiding redundant expensive operations",
        "Simple to implement with hash-based tracking or bloom filters for probabilistic deduplication",
      ],
      cons: [
        "Requires memory to track recently seen message IDs, growing linearly with deduplication window size",
        "Cannot distinguish legitimate duplicate messages from intentional reprocessing requests without semantic analysis",
        "Deduplication window introduces tradeoff: too short misses duplicates, too long wastes memory and causes false positives",
        "Adds latency for hash lookups and set membership checks on every message",
      ],
    },
    relatedPatterns: [
      "exactly-once-delivery",
      "idempotency",
      "request-collapsing",
      "bloom-filter",
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
      id: "dedup-queue-ts-basic",
      language: "typescript",
      title: "TODO: Dedup Queue Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Dedup Queue
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
