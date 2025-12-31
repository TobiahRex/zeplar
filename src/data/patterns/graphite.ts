import type { Pattern } from "../schema";

export const graphite: Pattern = {
  id: "graphite",
  slug: "graphite",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 📉 Graphite",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Metrics",
    level: 4,
  },

  concept: {
    name: "Graphite",
    emoji: "📉",
    tagline: "Time-series database",
    definition:
      "Graphite is a time-series database and visualization system that specializes in storing and querying numeric data that changes over time. Think of it like a specialized filing cabinet that organizes measurements by timestamp, making it incredibly fast to answer questions like 'what was my server's CPU usage over the last hour?' The system has three main components: Carbon (which receives and stores metrics), Whisper (the fixed-size database that stores time-series data), and the Graphite web application (for visualization and querying). Unlike traditional databases that are optimized for storing records, Graphite is designed specifically for metrics: it stores data points as (timestamp, value) pairs and can automatically roll up older data into summaries to save space. For example, it might keep minute-by-minute data for the last day, but only hourly averages for the last month. This makes it perfect for operational monitoring where you need to track thousands of metrics from your infrastructure and quickly visualize trends and patterns.",
    problemSolved:
      "When monitoring distributed systems, you generate massive amounts of time-stamped numeric data like request rates, response times, error counts, and resource utilization. Traditional databases struggle with this workload because they're not optimized for constantly appending new data points and retrieving time ranges. Graphite solves the problem of efficiently storing and querying millions of metrics by using a specialized storage format designed for time-series data. Without Graphite or similar tools, teams often resort to keeping metrics in memory, logging to files, or using general-purpose databases, all of which become slow and expensive at scale. Graphite enables you to retain historical metrics data, quickly visualize trends across any time range, and correlate events across different systems.",
    tradeoffs: {
      pros: [
        "Fixed-size database files with automatic rollup aggregation mean predictable storage costs and no need to manually delete old data",
        "Extremely fast queries for time-range retrievals because data is stored sequentially in time order",
        "Simple text-based protocol for sending metrics makes it easy to integrate from any programming language or system",
        "Built-in graphing interface provides immediate visualization without needing separate tools",
        "Hierarchical metric naming system allows intuitive organization and pattern-based queries",
      ],
      cons: [
        "Fixed retention policies mean you must decide upfront how long to keep data at different granularities, and you cannot change this without losing historical data",
        "Limited aggregation functions compared to modern time-series databases; you get averages, sums, min/max but not percentiles or complex statistical operations",
        "Carbon's simple protocol has no authentication or encryption by default, requiring additional security layers",
        "Whisper database format stores each metric in a separate file, which can cause performance issues with millions of unique metrics on some filesystems",
        "Horizontal scaling requires manual sharding and relay configuration, unlike newer databases with built-in clustering",
      ],
    },
    relatedPatterns: [
      "influxdb",
      "prometheus",
      "grafana",
      "statsd",
      "red-method",
      "use-method",
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
      id: "graphite-ts-basic",
      language: "typescript",
      title: "TODO: Graphite Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Graphite
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
