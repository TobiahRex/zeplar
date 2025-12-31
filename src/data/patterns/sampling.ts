import type { Pattern } from "../schema";

export const sampling: Pattern = {
  id: "sampling",
  slug: "sampling",
  corpusPath: "⚡ PERFORMANCE → 🎯 Work Reduction → ⏱️ Temporal → 📊 Sampling",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Temporal",
    level: 4,
  },

  concept: {
    name: "Sampling",
    emoji: "📊",
    tagline: "Take periodic snapshots",
    definition:
      "Sampling is a performance optimization technique that processes or analyzes only a subset of data rather than the entire dataset, using statistical methods to extrapolate insights from the sample to the full population. Think of it like a political poll that surveys 1,000 people to predict how millions will vote—the sample provides good accuracy at a fraction of the cost. For example, a monitoring system might sample 1% of HTTP requests to measure average response time instead of recording every single request. If 100,000 requests arrive per second, sampling 1% means analyzing 1,000 requests which still provides statistically significant insights while reducing processing load by 99%. Common sampling strategies include uniform random sampling (equal probability for each item), stratified sampling (sample proportionally from different categories), and reservoir sampling (sample from unbounded streams). The pattern is widely used in profiling, monitoring, distributed tracing, analytics, and machine learning where processing all data is prohibitively expensive but statistical approximation is acceptable.",
    problemSolved:
      "Processing every single item in high-volume data streams creates overwhelming computational and storage costs without proportional benefit. For example, collecting full distributed traces for a service handling 1 million requests per second generates 86 billion trace records per day, requiring terabytes of storage and massive processing infrastructure to analyze—yet most requests are identical routine operations. Similarly, profiling every function call in production code creates 50-90% performance overhead making the system unusable. Sampling solves this by processing only a representative subset: trace 0.1% of requests (1,000 per second) and you still detect issues that affect even 0.01% of traffic while reducing storage to 86 million records per day—a 1000x reduction. CPU profiling samples stack traces every 10ms instead of every function call, reducing overhead from 80% to under 3% while still identifying hot paths. Statistical guarantees ensure samples accurately represent the full dataset.",
    tradeoffs: {
      pros: [
        "Dramatically reduces computational and storage costs by processing only a small fraction of data, often achieving 100-1000x cost reduction versus full processing",
        "Maintains statistical validity since properly designed samples provide accurate estimates with quantifiable confidence intervals and error bounds",
        "Enables real-time analysis of high-volume streams that would be impossible to process fully, like profiling production code or monitoring billions of events",
        "Allows tunable accuracy versus cost trade-off by adjusting sample rate—1% for rough estimates, 10% for higher precision based on requirements",
      ],
      cons: [
        "Introduces statistical uncertainty and potential sampling bias—rare events may be missed entirely if sample rate is too low",
        "Can miss important outliers or anomalies that only appear in a few out of millions of records, making it unsuitable for anomaly detection",
        "Requires careful sample rate selection to balance cost and accuracy—too low misses patterns, too high wastes resources",
        "Makes debugging specific issues difficult since sampled data may not include the exact request or event that caused a problem",
      ],
    },
    relatedPatterns: [
      "approximation",
      "debouncing",
      "windowing",
      "rate-limiting",
      "distributed-tracing",
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
      id: "sampling-ts-basic",
      language: "typescript",
      title: "TODO: Sampling Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Sampling
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
