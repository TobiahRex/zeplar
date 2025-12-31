import type { Pattern } from "../schema";

export const multiLevelQueue: Pattern = {
  id: "multi-level-queue",
  slug: "multi-level-queue",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🔝 Prioritization → 🔢 Multi-Level Queue",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Prioritization",
    level: 4,
  },

  concept: {
    name: "Multi-Level Queue",
    emoji: "🔢",
    tagline: "Class-based priorities",
    definition:
      "Multi-level queue scheduling organizes tasks into separate queues based on predefined priority classes, with each queue receiving a fixed share of processing resources or strict priority ordering. Think of it like airport security lines: first class passengers go through a dedicated fast lane, business class has their own line, and economy passengers use the regular queue—each class has predictable service levels. For example, a web server might maintain three queues: critical requests (health checks, authentication) that are always processed first, normal user requests in a second queue, and background tasks (analytics, cleanup) in a third queue with lowest priority. The scheduler ensures critical tasks never wait behind low-priority work by always checking higher-priority queues first. Unlike dynamic priority systems that adjust task priorities over time, multi-level queues assign tasks to fixed classes at arrival based on task characteristics (type, source, SLA requirements). This provides predictable performance for different task classes and prevents priority inversion where low-priority work blocks critical tasks.",
    problemSolved:
      "Single-queue scheduling treats all tasks equally, causing critical operations to wait behind low-priority background work. For example, a database processing a mix of user-facing queries and nightly reports will delay interactive queries while expensive report generation runs, degrading user experience. Simply assigning dynamic priorities creates complexity and overhead in constantly reevaluating task ordering. Multi-level queue scheduling solves this by separating task classes upfront: user queries go to a high-priority queue serviced first, while reports go to a low-priority queue that only runs when higher queues are empty. This ensures user queries complete in under 100ms regardless of how many reports are queued, without the overhead of dynamic priority calculations. The pattern is essential for systems serving workloads with different latency requirements or business priorities.",
    tradeoffs: {
      pros: [
        "Provides predictable performance guarantees for high-priority tasks by ensuring they never wait behind lower-priority work, enabling consistent sub-100ms latencies for critical operations",
        "Simple to implement and reason about compared to complex dynamic priority algorithms—tasks are classified once at arrival and stay in their queue",
        "Prevents priority inversion and starvation of high-priority work since scheduler always checks higher queues first before serving lower queues",
        "Allows easy capacity planning and resource allocation by dedicating fixed resources to each queue or implementing strict service ordering",
      ],
      cons: [
        "Can lead to starvation of low-priority queues when high-priority queues constantly receive work, leaving background tasks indefinitely delayed without fairness mechanisms",
        "Requires accurate initial classification of tasks into priority classes—misclassification can degrade performance or defeat the purpose of prioritization",
        "Offers less flexibility than dynamic priority systems since tasks cannot change queues based on wait time, age, or changing system conditions",
        "May waste resources if high-priority queues are empty while workers sit idle instead of processing lower-priority work, requiring careful queue-checking logic",
      ],
    },
    relatedPatterns: [
      "priority-preemption",
      "weighted-fair-queuing",
      "shortest-job-first",
      "aging",
      "rate-limiting",
      "bulkhead",
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
      id: "multi-level-queue-ts-basic",
      language: "typescript",
      title: "TODO: Multi-Level Queue Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Multi-Level Queue
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
