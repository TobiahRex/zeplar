import type { Pattern } from "../schema";

export const adaptiveThresholds: Pattern = {
  id: "adaptive-thresholds",
  slug: "adaptive-thresholds",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔌 Circuit Breaker → 📊 Adaptive Thresholds",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Circuit Breaker",
    level: 4,
  },

  concept: {
    name: "Adaptive Thresholds",
    emoji: "📊",
    tagline: "Dynamic trip conditions",
    definition:
      "Adaptive Thresholds adjust circuit breaker trip conditions based on observed system behavior and historical performance patterns, rather than using static failure rate limits. Imagine a smoke detector that becomes less sensitive in a kitchen (where cooking creates normal smoke) versus a bedroom (where any smoke is abnormal). Instead of hardcoding 'open circuit after 50% errors,' the system learns normal error rates for each dependency and trips when current rates deviate significantly from baseline. For example, a flaky third-party API might normally have 5% errors, so tripping at 10% is appropriate; but an internal database normally has 0.1% errors, so even 1% indicates serious issues. The pattern typically uses statistical methods like moving averages, percentiles, or exponentially weighted moving averages to establish dynamic baselines. This creates context-aware circuit breaking where thresholds reflect each service's reliability characteristics. The system adapts to daily patterns (higher errors during deployments), seasonal changes (increased load during holidays), and gradual degradation, preventing both false positives (tripping healthy services) and false negatives (missing actual failures).",
    problemSolved:
      "Static circuit breaker thresholds create false positives and false negatives because services have wildly different baseline error rates and variability patterns. A 5% failure threshold might be too sensitive for a flaky legacy API (causing unnecessary circuit trips) but too lenient for a critical internal service (missing actual outages). Static thresholds cannot account for time-of-day patterns, deployment windows, or gradual performance degradation. Adaptive Thresholds solve this by learning each service's normal behavior and detecting anomalies relative to that baseline. This prevents nuisance tripping during known-flaky periods while catching subtle degradation that static thresholds miss. Critical for microservices architectures with dozens of dependencies, each having unique reliability profiles. The pattern enables precise failure detection without manual threshold tuning for every service and deployment environment.",
    tradeoffs: {
      pros: [
        "Reduces false positives by adapting to each service's unique baseline error rate and variability",
        "Detects gradual degradation that static thresholds miss, catching subtle performance drops early",
        "Automatically adjusts to daily/seasonal patterns and deployment windows without manual reconfiguration",
        "Enables precise circuit breaking across heterogeneous services with different reliability profiles",
      ],
      cons: [
        "Adds significant complexity with statistical models, baseline calculation, and anomaly detection algorithms",
        "Requires warm-up period to establish accurate baselines, potentially missing failures during initial operation",
        "May adapt to degraded state as 'normal' if degradation happens gradually over baseline calculation window",
        "Difficult to reason about and debug when thresholds are dynamically computed rather than explicit",
      ],
    },
    relatedPatterns: [
      "circuit-breaker",
      "adaptive-concurrency",
      "health-check",
      "exponential-backoff",
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
      id: "adaptive-thresholds-ts-basic",
      language: "typescript",
      title: "TODO: Adaptive Thresholds Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Adaptive Thresholds
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
