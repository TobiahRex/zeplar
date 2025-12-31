import type { Pattern } from "../schema";

export const adaptiveConcurrency: Pattern = {
  id: "adaptive-concurrency",
  slug: "adaptive-concurrency",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🚰 Flow Control → 📊 Adaptive Concurrency",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Flow Control",
    level: 4,
  },

  concept: {
    name: "Adaptive Concurrency",
    emoji: "📊",
    tagline: "Dynamic parallelism limits",
    definition:
      "Adaptive Concurrency dynamically adjusts the number of concurrent operations based on real-time system performance and observed latency, rather than using fixed concurrency limits. Think of it like a smart traffic light that adjusts green light duration based on current congestion, not a preset timer. Instead of hardcoding 'run 100 parallel requests,' the system starts conservatively and gradually increases concurrency while latency remains acceptable, then backs off when performance degrades. This is typically measured using algorithms like additive increase/multiplicative decrease (AIMD), similar to TCP congestion control. For example, a service might start with 10 concurrent database queries and increase by 1 after each successful batch until query latency exceeds 100ms, then cut concurrency in half and rebuild. This creates a feedback loop where the system discovers optimal parallelism for current conditions without manual tuning. The pattern continuously adapts to changes in backend capacity, network conditions, or workload characteristics, maintaining high throughput without overwhelming downstream dependencies.",
    problemSolved:
      "Fixed concurrency limits create a dilemma: set them too low and you waste available capacity during off-peak hours; set them too high and you overwhelm systems during peak load, causing cascading failures. Static limits cannot adapt to variable backend performance, network conditions, or seasonal traffic patterns. For instance, a database might handle 1000 concurrent connections during normal operation but only 100 during a backup window. Adaptive Concurrency solves this by automatically discovering and tracking the optimal concurrency level for current conditions. It prevents resource exhaustion while maximizing throughput, eliminates manual tuning as system capacity changes, and gracefully handles degraded dependencies by reducing load when latency increases. This is critical for cloud systems where capacity fluctuates with autoscaling, shared resources, and variable network performance.",
    tradeoffs: {
      pros: [
        "Automatically maximizes throughput without overwhelming downstream services by adjusting to current capacity",
        "Eliminates manual tuning and reconfiguration as system capacity or workload changes over time",
        "Gracefully handles degraded dependencies by reducing concurrency when latency increases, preventing cascades",
        "Adapts to daily/seasonal traffic patterns and cloud autoscaling without intervention",
      ],
      cons: [
        "Adds complexity with feedback loops, latency measurement, and concurrency adjustment algorithms",
        "May oscillate or converge slowly when tuning parameters are misconfigured, causing unstable throughput",
        "Requires careful latency measurement and threshold selection to avoid false signals",
        "Can be overly conservative during startup, taking time to ramp up to optimal concurrency levels",
      ],
    },
    relatedPatterns: [
      "backpressure",
      "circuit-breaker",
      "bulkhead",
      "rate-limiting",
      "token-bucket",
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
      id: "adaptive-concurrency-ts-basic",
      language: "typescript",
      title: "TODO: Adaptive Concurrency Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Adaptive Concurrency
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
