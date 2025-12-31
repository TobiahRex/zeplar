import type { Pattern } from "../schema";

export const windowing: Pattern = {
  id: "windowing",
  slug: "windowing",
  corpusPath: "⚡ PERFORMANCE → 🎯 Work Reduction → ⏱️ Temporal → ⏰ Windowing",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Temporal",
    level: 4,
  },

  concept: {
    name: "Windowing",
    emoji: "⏰",
    tagline: "Group by time intervals",
    definition:
      "Windowing is a stream processing technique that divides continuous, unbounded data streams into finite segments (windows) based on time intervals or event counts for aggregation and analysis. Think of it like organizing a continuous river of data into buckets—every 5 minutes, you analyze the contents of the current bucket then move to a fresh one. Common window types include tumbling windows (fixed, non-overlapping 5-minute intervals), sliding windows (overlapping 5-minute intervals that slide every 1 minute), and session windows (variable-length windows based on activity gaps). For example, computing average response time over tumbling 1-minute windows means aggregating all requests from 00:00:00-00:00:59 into one average, 00:01:00-00:01:59 into another, and so on. Sliding windows compute averages over the last 5 minutes every 30 seconds, providing smoother metrics that react faster to changes. Windowing enables temporal aggregations (counts, sums, averages) over infinite streams without unbounded memory growth since old windows can be discarded after emission.",
    problemSolved:
      "Analyzing unbounded continuous data streams requires aggregating infinite data, which is impossible without bounded segments. For example, computing total sales from a transaction stream that never ends requires infinite memory to store all historical transactions. Even simple questions like 'what is the average response time?' are unanswerable for infinite streams—the average of infinity is undefined. Similarly, detecting trends or anomalies requires comparing current behavior to historical baselines, but without temporal boundaries, you cannot define 'current' versus 'historical'. Windowing solves this by creating finite analysis boundaries: compute average response time per 5-minute tumbling window to track performance trends. Detect anomalies by comparing the current 5-minute window to the average of the last 12 windows (1 hour historical baseline). Memory usage is bounded since you only retain current window data plus a fixed number of historical windows. Each window emits finite results that can be stored, displayed, or acted upon.",
    tradeoffs: {
      pros: [
        "Enables aggregations and analytics over infinite streams by bounding computations to finite windows, making unbounded problems tractable",
        "Provides bounded memory usage since old windows can be discarded after processing, preventing memory exhaustion from infinite data accumulation",
        "Allows real-time trend detection and anomaly detection by comparing current windows to historical windows with defined time boundaries",
        "Offers flexibility with different window types (tumbling, sliding, session) to match specific analysis needs and latency requirements",
      ],
      cons: [
        "Introduces artificial boundaries that may split related events across windows, causing incomplete aggregations or missed correlations",
        "Adds latency equal to window size for tumbling windows—you cannot emit results until the window closes, delaying insights by the window duration",
        "Requires careful tuning of window size: too small creates noisy, fluctuating metrics; too large delays detection of changes and trends",
        "Complicates handling of late-arriving events that belong to already-closed windows, requiring watermarking and late-event policies",
      ],
    },
    relatedPatterns: [
      "streaming",
      "micro-batching",
      "sampling",
      "debouncing",
      "rate-limiting",
      "event-sourcing",
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
      id: "windowing-ts-basic",
      language: "typescript",
      title: "TODO: Windowing Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Windowing
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
