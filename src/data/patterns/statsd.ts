import type { Pattern } from "../schema";

export const statsD: Pattern = {
  id: "statsd",
  slug: "statsd",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 📊 StatsD",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Metrics",
    level: 4,
  },

  concept: {
    name: "StatsD",
    emoji: "📊",
    tagline: "Push-based metrics",
    definition:
      "StatsD is a lightweight network daemon that listens for metrics over UDP and aggregates them before forwarding to backend systems like Graphite or InfluxDB. Think of it as a smart buffer that sits between your application and your metrics database, collecting thousands of individual measurements and summarizing them into meaningful statistics. The key innovation is the UDP protocol: your application fires metrics into the void without waiting for acknowledgment, making metric collection effectively free from a latency perspective. StatsD supports several metric types: counters (things that increment like request counts), gauges (values that go up and down like memory usage), timers (duration measurements that StatsD automatically calculates percentiles for), and sets (unique value counts). For example, you might send 'api.requests:1|c' to increment a counter, or 'api.response_time:245|ms' to record a timer. StatsD flushes aggregated metrics at regular intervals (typically every 10 seconds), turning thousands of individual events into a manageable stream of statistics.",
    problemSolved:
      "Applications generating high volumes of metrics face a dilemma: sending each metric directly to a time-series database creates network overhead and database write pressure, but batching metrics in application code adds complexity and memory usage. StatsD solves this by providing a centralized aggregation layer that applications can fire-and-forget metrics to via UDP. Without StatsD, applications either sacrifice observability to reduce overhead, implement complex local aggregation logic, or overwhelm their metrics backend with millions of writes. The UDP protocol ensures that metric collection never blocks application code or causes failures if the metrics system is down. StatsD enables instrumentation-heavy applications to track everything without performance impact, while protecting backend systems from write amplification.",
    tradeoffs: {
      pros: [
        "UDP fire-and-forget protocol means metric collection adds microseconds of latency and never blocks application threads",
        "Automatic aggregation significantly reduces backend write load by flushing summaries instead of individual events",
        "Simple text-based protocol makes it trivial to add instrumentation from any programming language without dependencies",
        "Centralized deployment model means updating metric configuration or backends doesn't require redeploying applications",
        "Built-in sampling support allows high-cardinality metrics to be tracked without overwhelming the system",
      ],
      cons: [
        "UDP can silently drop packets under network congestion, leading to incomplete metrics data with no error indication",
        "Aggregation window (flush interval) means you lose individual event granularity and cannot reconstruct exact sequences",
        "Single StatsD instance can become a bottleneck at very high metric volumes, requiring multiple instances with sharding",
        "No built-in authentication or encryption makes StatsD unsuitable for untrusted networks without additional security layers",
        "Counter resets during StatsD restarts can cause temporary gaps or spikes in metrics graphs",
      ],
    },
    relatedPatterns: [
      "graphite",
      "influxdb",
      "prometheus",
      "grafana",
      "batching",
      "sampling",
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
      id: "statsd-ts-basic",
      language: "typescript",
      title: "TODO: StatsD Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for StatsD
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
