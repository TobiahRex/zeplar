import type { Pattern } from "../schema";

export const influxDB: Pattern = {
  id: "influxdb",
  slug: "influxdb",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 📊 InfluxDB",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Metrics",
    level: 4,
  },

  concept: {
    name: "InfluxDB",
    emoji: "📊",
    tagline: "Time-series database",
    definition:
      "InfluxDB is a modern time-series database purpose-built for storing and analyzing metrics, events, and real-time analytics data. Imagine it as a high-performance library that specializes in tracking how things change over time, with built-in tools to find patterns and trends. Unlike Graphite, InfluxDB uses a custom query language called InfluxQL (similar to SQL) and supports tags for flexible data organization. The core concept revolves around measurements (similar to database tables), tags (indexed metadata like server name or region), fields (the actual metric values), and timestamps. For example, you might track CPU usage as a measurement, with tags for hostname and datacenter, and fields for user_cpu, system_cpu, and idle_cpu. InfluxDB excels at ingesting millions of data points per second and provides powerful aggregation functions like percentiles, moving averages, and statistical analysis. The newer versions (2.x+) include a more advanced query language called Flux that allows complex data transformations and real-time processing, making it a complete platform for observability.",
    problemSolved:
      "Modern cloud-native applications generate enormous volumes of time-series data from IoT devices, application metrics, server monitoring, and business analytics. Traditional relational databases struggle with the write-heavy workload of time-series data and cannot efficiently query time ranges or perform time-based aggregations. InfluxDB solves this by providing a specialized storage engine optimized for time-series data with automatic compression, efficient indexing on time and tags, and built-in retention policies for automatic data lifecycle management. Without a purpose-built time-series database, developers face slow queries, storage bloat, and complex application logic to handle data retention and downsampling. InfluxDB enables real-time monitoring dashboards, anomaly detection, and historical trend analysis at scale.",
    tradeoffs: {
      pros: [
        "Native SQL-like query language (InfluxQL) makes it accessible to developers familiar with relational databases",
        "Rich set of aggregation functions including percentiles, derivatives, and statistical operations for advanced analytics",
        "Automatic data downsampling and retention policies eliminate the need for manual data lifecycle management",
        "Built-in HTTP API with client libraries for many languages simplifies integration",
        "Tag-based indexing allows flexible querying across multiple dimensions without performance degradation",
      ],
      cons: [
        "Open-source version has limited clustering capabilities; high availability requires the commercial Enterprise edition",
        "Memory usage can grow significantly with high-cardinality tags (too many unique tag combinations)",
        "Breaking changes between major versions (1.x to 2.x) require migration effort and learning new query language",
        "Less mature ecosystem compared to Prometheus in the Kubernetes and cloud-native monitoring space",
        "Storage format is proprietary, making it harder to migrate data to other systems if needed",
      ],
    },
    relatedPatterns: [
      "graphite",
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
      id: "influxdb-ts-basic",
      language: "typescript",
      title: "TODO: InfluxDB Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for InfluxDB
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
