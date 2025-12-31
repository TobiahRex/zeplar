import type { Pattern } from "../schema";

export const tempo: Pattern = {
  id: "tempo",
  slug: "tempo",
  corpusPath: "👁️ OBSERVABILITY → 🔗 Distributed Tracing → 📊 Tempo",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Distributed Tracing",
    level: 4,
  },

  concept: {
    name: "Tempo",
    emoji: "📊",
    tagline: "Grafana's tracing backend",
    definition:
      "Grafana Tempo is a high-volume, cost-effective distributed tracing backend designed to store and query traces from modern cloud-native applications. Think of it as a specialized database for tracking requests as they flow through multiple services, like following a package through a complex shipping network. Unlike traditional tracing systems that index every tag and attribute, Tempo only indexes trace IDs and relies on object storage (like S3, GCS, or Azure Blob) for cheap, scalable storage. The architecture is brilliantly simple: traces are written to local files, batched, compressed, and uploaded to object storage, while a small index tracks which trace IDs exist in which storage blocks. For example, when a user request flows through your API gateway, authentication service, database, and cache, Tempo stores all the spans (individual operations) as a single trace. To query a trace, you provide the trace ID, and Tempo efficiently retrieves it from object storage. The system integrates seamlessly with Grafana, allowing you to jump from metrics or logs directly to related traces for deep debugging.",
    problemSolved:
      "Distributed tracing generates massive data volumes because every request creates multiple spans across services, and high-traffic systems can generate millions of traces per day. Traditional tracing backends like Jaeger or Zipkin index all span attributes, which becomes prohibitively expensive at scale both in terms of storage and query performance. Tempo solves this by trading off rich query capabilities for extreme cost efficiency: it only indexes trace IDs and stores raw trace data in cheap object storage. Without Tempo, teams either pay high costs for full-featured tracing systems, implement aggressive sampling that loses important traces, or avoid distributed tracing altogether. Tempo enables 100% trace retention at a fraction of the cost, making it economically feasible to trace every single request in production systems.",
    tradeoffs: {
      pros: [
        "Extremely low storage costs by leveraging cheap object storage instead of expensive indexed databases",
        "Horizontally scalable architecture handles billions of spans without complex cluster management",
        "TraceQL query language provides powerful filtering and analysis capabilities when you have a trace ID",
        "Deep integration with Grafana ecosystem allows seamless correlation between metrics, logs, and traces",
        "Support for multiple tracing formats (Jaeger, Zipkin, OpenTelemetry) simplifies migration and multi-vendor scenarios",
      ],
      cons: [
        "Limited search capabilities without external indexing; you need a trace ID or must query via Grafana Loki logs",
        "Query performance degrades for large time ranges since it must scan object storage blocks",
        "Object storage dependencies mean queries have higher latency compared to fully-indexed systems",
        "Requires separate systems (like Loki or an external index) for trace discovery by tags or attributes",
        "Relatively new project with smaller community and ecosystem compared to Jaeger or Zipkin",
      ],
    },
    relatedPatterns: [
      "jaeger",
      "opentelemetry",
      "x-ray",
      "grafana",
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
      id: "tempo-ts-basic",
      language: "typescript",
      title: "TODO: Tempo Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Tempo
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
