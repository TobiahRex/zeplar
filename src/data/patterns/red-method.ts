import type { Pattern } from "../schema";

export const rEDMethod: Pattern = {
  id: "red-method",
  slug: "red-method",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 🔴 RED Method",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Metrics",
    level: 4,
  },

  concept: {
    name: "RED Method",
    emoji: "🔴",
    tagline: "Rate, Errors, Duration",
    definition:
      "The RED Method is a monitoring methodology created by Tom Wilkie that focuses on three golden signals for measuring the health of request-driven services: Rate (how many requests per second), Errors (how many of those requests are failing), and Duration (how long those requests take). Think of it like a car dashboard that shows speed, warning lights, and fuel efficiency - just three critical indicators that tell you everything you need to know about performance. For every endpoint or service in your system, you track these three metrics. For example, your API might handle 1000 requests/second (Rate), with 5 failing (0.5% Error rate), taking an average of 200ms to respond (Duration). This simple framework ensures you monitor what actually matters to users: is the service handling traffic, are requests succeeding, and are they fast enough? The RED method is particularly powerful for microservices architectures where you need consistent metrics across dozens or hundreds of services without overwhelming yourself with complexity.",
    problemSolved:
      "When running distributed systems, engineers often feel overwhelmed by the sheer number of possible metrics to track: CPU usage, memory, disk I/O, network traffic, cache hit rates, database connections, and countless application-specific metrics. This leads to either monitoring everything (alert fatigue and slow dashboards) or monitoring too little (missing critical issues). The RED Method solves this by providing a focused framework that prioritizes user-facing service health over infrastructure metrics. Without this methodology, teams often monitor resource utilization (CPU, memory) instead of service quality, missing problems like slow API responses even when servers appear healthy. The RED Method ensures you immediately see when users are experiencing problems, whether from high error rates, slow responses, or capacity issues indicated by high traffic rates.",
    tradeoffs: {
      pros: [
        "Simple and actionable framework that anyone on the team can understand and apply consistently across all services",
        "Directly correlates to user experience - if RED metrics are healthy, users are happy regardless of underlying resource utilization",
        "Enables quick root cause analysis: rate spikes indicate capacity issues, error rate increases point to bugs or dependencies, duration increases reveal performance problems",
        "Minimal metric cardinality keeps monitoring costs low and dashboards fast while still providing comprehensive service visibility",
        "Works universally across any request-driven service (HTTP APIs, RPC calls, message processing) without customization",
      ],
      cons: [
        "Only applies to request-response services; doesn't work well for batch jobs, data pipelines, or streaming systems",
        "Doesn't capture resource exhaustion problems (like memory leaks) until they manifest as errors or slow responses",
        "May miss important business logic issues if they don't affect error rates, like incorrect data being returned successfully",
        "Duration averages can hide tail latency problems; requires additional percentile tracking (p95, p99) for complete picture",
        "Doesn't provide insight into dependencies or downstream service health without supplementing with distributed tracing",
      ],
    },
    relatedPatterns: [
      "use-method",
      "prometheus",
      "grafana",
      "graphite",
      "influxdb",
      "statsd",
      "opentelemetry",
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
      id: "red-method-ts-basic",
      language: "typescript",
      title: "TODO: RED Method Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for RED Method
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
