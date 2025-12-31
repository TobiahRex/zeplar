import type { Pattern } from "../schema";

export const xRay: Pattern = {
  id: "x-ray",
  slug: "x-ray",
  corpusPath: "👁️ OBSERVABILITY → 🔗 Distributed Tracing → ☁️ X-Ray",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Distributed Tracing",
    level: 4,
  },

  concept: {
    name: "X-Ray",
    emoji: "☁️",
    tagline: "AWS tracing",
    definition:
      "AWS X-Ray is a distributed tracing service that helps developers analyze and debug production applications running on AWS infrastructure. Think of it like an MRI machine for your cloud applications, revealing the internal flow of requests through your system and highlighting exactly where problems occur. X-Ray automatically collects data about requests flowing through your application, including AWS services like Lambda, EC2, ECS, API Gateway, and managed databases. The service works by instrumenting your code with the X-Ray SDK or using automatic instrumentation for supported AWS services. Each request creates a trace showing all the services and operations involved, with timing information, metadata, and error details. For example, when a user uploads a photo, X-Ray shows the complete journey: API Gateway receives request, Lambda processes it, uploads to S3, writes metadata to DynamoDB, and sends a notification via SNS. The service map visualization makes it easy to see service dependencies and identify performance bottlenecks or error hotspots at a glance.",
    problemSolved:
      "Debugging distributed applications on AWS is challenging because requests traverse multiple services, and traditional logs from individual services don't show the complete picture. When a user reports a slow request, finding the bottleneck requires correlating logs across Lambda functions, API Gateway, databases, and other AWS services, which is time-consuming and error-prone. X-Ray solves this by automatically tracing requests end-to-end with minimal code changes, correlating data across all AWS services involved. Without X-Ray, developers resort to custom correlation IDs and manual log analysis, missing critical insights about service interactions and performance characteristics. X-Ray makes it trivial to identify which downstream service is causing latency, which paths through your application have the highest error rates, and where optimizations will have the biggest impact.",
    tradeoffs: {
      pros: [
        "Deep integration with AWS services provides automatic instrumentation for Lambda, API Gateway, and other managed services without code changes",
        "Service map visualization makes complex microservice architectures comprehensible at a glance",
        "Pay-per-use pricing model with free tier makes it economical for small to medium workloads",
        "Sampling rules allow intelligent trace collection that captures errors while reducing costs for successful requests",
        "IAM-based security and AWS-native encryption provide enterprise-grade data protection",
      ],
      cons: [
        "Vendor lock-in to AWS ecosystem; traces cannot easily be exported to non-AWS tracing systems",
        "Limited query capabilities compared to open-source alternatives like Jaeger or Tempo",
        "Costs can escalate quickly for high-volume applications even with sampling",
        "Requires X-Ray daemon for EC2/ECS deployments, adding operational complexity",
        "Trace retention limited to 30 days with no option for longer-term storage",
      ],
    },
    relatedPatterns: [
      "jaeger",
      "tempo",
      "opentelemetry",
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
      id: "x-ray-ts-basic",
      language: "typescript",
      title: "TODO: X-Ray Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for X-Ray
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
