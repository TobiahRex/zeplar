import type { Pattern } from "../schema";

export const exactlyOnceDelivery: Pattern = {
  id: "exactly-once-delivery",
  slug: "exactly-once-delivery",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 🔒 Exactly-Once Delivery",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Exactly-Once Delivery",
    emoji: "🔒",
    tagline: "Guaranteed single processing",
    definition:
      "Exactly-Once Delivery ensures that each message is processed exactly one time, despite failures, retries, or network issues, by combining idempotent processing with deduplication tracking. Think of it like a mail carrier who checks a log book before delivering each letter to ensure it has not already been delivered, even if they attempted delivery yesterday. In distributed systems, this requires three components: unique message IDs, durable deduplication state (processed message IDs stored in a database), and transactional updates where message processing and ID recording happen atomically. For example, processing a payment message involves: check if message ID exists in processed set, if not, charge customer AND insert message ID into processed set in a single transaction, if transaction succeeds message is processed exactly once, if transaction fails retry is safe (idempotent check). The key insight is that exactly-once is a semantic guarantee, not a delivery guarantee—messages may be delivered multiple times, but effects happen once.",
    problemSolved:
      "At-least-once delivery creates duplicate processing when retries occur, causing double-charges, duplicate emails, or incorrect aggregations. At-most-once delivery risks losing messages during failures, causing missing transactions or data loss. Neither provides the correctness guarantee needed for financial transactions, inventory management, or billing systems where duplicates and losses both violate business requirements. Exactly-Once Delivery solves this by ensuring idempotent semantics: processing the same message twice has the same effect as processing it once. A payment service cannot charge a customer twice even if the message is redelivered 10 times. This is critical for banking, e-commerce checkouts, billing systems, and any operation where duplicates or losses cause financial or data integrity problems.",
    tradeoffs: {
      pros: [
        "Guarantees correctness for non-idempotent operations like payments, preventing duplicate charges or lost transactions",
        "Simplifies application logic by eliminating need for manual duplicate detection and handling",
        "Enables exactly-once semantics in stream processing, ensuring accurate aggregations and analytics",
        "Provides strongest delivery guarantee, critical for financial, billing, and inventory systems",
      ],
      cons: [
        "Requires distributed transactions or consensus to atomically update state and mark message processed",
        "Significantly higher latency and lower throughput compared to at-least-once or at-most-once delivery",
        "Complex to implement correctly, requiring careful handling of edge cases and failure scenarios",
        "Impossible to achieve in truly distributed systems without relaxing some guarantees (e.g., bounded time)",
      ],
    },
    relatedPatterns: [
      "idempotency",
      "dedup-queue",
      "two-phase-commit",
      "transactional-outbox",
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
      id: "exactly-once-delivery-ts-basic",
      language: "typescript",
      title: "TODO: Exactly-Once Delivery Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Exactly-Once Delivery
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
