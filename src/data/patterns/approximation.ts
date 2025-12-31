import type { Pattern } from "../schema";

export const approximation: Pattern = {
  id: "approximation",
  slug: "approximation",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🧮 Algorithmic → 🧬 Approximation",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Algorithmic",
    level: 4,
  },

  concept: {
    name: "Approximation",
    emoji: "🧬",
    tagline: "Good-enough solutions",
    definition:
      "Approximation trades perfect accuracy for dramatically improved performance by computing results that are close enough for the use case rather than exactly correct. Think of estimating a crowd size by counting a small section and multiplying, rather than counting every person individually. In software, this appears as probabilistic data structures (HyperLogLog for counting unique visitors gives 2% error but uses 1KB instead of 10GB), sampling (analyzing 1% of logs to detect anomalies), or lossy compression (JPEG images at 90% quality look nearly identical but are 10x smaller). For example, counting distinct users across billions of page views requires exact counting to store every user ID in memory, but HyperLogLog approximates the count within 2% error using fixed 12KB regardless of user count. The key insight is that many business questions do not require exact answers: knowing there are approximately 10 million users (versus exactly 10,234,567) is sufficient for capacity planning. The pattern works best when acceptable error bounds are known and the performance gain justifies the accuracy loss.",
    problemSolved:
      "Exact algorithms often have prohibitive computational or memory costs that make them impractical at scale. Computing the exact number of unique IP addresses in a billion-row log file requires storing all IPs in memory (gigabytes), while counting with 1% accuracy requires only kilobytes using HyperLogLog. Exact solutions cannot meet real-time latency requirements for large datasets: finding the exact median of streaming data requires sorting all values, but an approximate median can be computed in constant memory with sketching algorithms. Approximation solves this by accepting controlled error in exchange for bounded memory usage, predictable latency, and scalable performance. Critical for big data analytics, streaming systems, and monitoring where exact answers are too slow or expensive, but approximate insights enable timely decision-making.",
    tradeoffs: {
      pros: [
        "Reduces memory usage from gigabytes to kilobytes by using probabilistic data structures with bounded error",
        "Enables real-time processing of streaming data with constant memory and predictable latency guarantees",
        "Scales to massive datasets that are impossible to process exactly due to time or space constraints",
        "Provides actionable insights faster, enabling timely decisions based on good-enough approximations",
      ],
      cons: [
        "Introduces quantifiable but uncontrollable error that may compound in downstream calculations",
        "Requires domain expertise to determine acceptable error bounds and validate approximation quality",
        "Can produce misleading results if error characteristics are misunderstood or communicated poorly",
        "May violate correctness requirements for financial, legal, or safety-critical applications",
      ],
    },
    relatedPatterns: [
      "sampling",
      "caching",
      "batching",
      "incremental-computation",
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
      id: "approximation-ts-basic",
      language: "typescript",
      title: "TODO: Approximation Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Approximation
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
