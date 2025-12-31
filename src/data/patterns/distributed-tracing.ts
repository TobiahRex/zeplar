import type { Pattern } from "../schema";

export const distributedTracing: Pattern = {
  id: "distributed-tracing",
  slug: "distributed-tracing",
  corpusPath:
    "👁️ OBSERVABILITY → 🔗 Distributed Tracing → 🌐 Distributed Tracing",

  hierarchy: {
    quality: "observability",
    strategy: "Distributed Tracing",
    family: "Tracing Systems",
    level: 3,
  },

  concept: {
    name: "Distributed Tracing",
    emoji: "🔗",
    tagline:
      "Follow requests across service boundaries to understand system behavior",
    definition:
      "Distributed Tracing is an observability technique that tracks individual requests as they flow through complex distributed systems, creating a detailed record of the request's journey across multiple services, processes, and machines. Inspired by Google's Dapper paper, distributed tracing assigns each request a unique trace ID that propagates across service boundaries via headers (like W3C Trace Context), enabling correlation of all operations related to that request. Each service creates spans—timed units of work representing operations like HTTP calls, database queries, or business logic—that form a hierarchical trace tree. Spans capture timing information, status codes, service names, and custom metadata (tags/attributes), providing granular visibility into where time is spent and where failures occur. The trace tree reveals the critical path, parallel operations, and cascading effects of slow services. Modern tracing systems collect traces via agents or SDKs, sample strategically to balance overhead with coverage, store trace data in specialized backends, and visualize traces as flame graphs or dependency maps. Distributed tracing solves the 'needle in a haystack' problem of debugging microservices by answering questions like: Which service caused this 5-second delay? Why did this request fail? What's the actual dependency graph of my system?",
    problemSolved:
      "In monolithic systems, following a request's execution path is straightforward—use debuggers, logs, or profilers. In distributed microservices architectures with dozens or hundreds of services, this becomes nearly impossible. A single user action might traverse 20+ services, each with its own logs, metrics, and infrastructure. When a request fails or is slow, engineers face daunting questions: Which of the 50 services in the call chain is the bottleneck? Is the delay in network I/O, database queries, or business logic? Did a service fail, or just respond slowly? Traditional logging provides service-local views but loses cross-service context—correlating timestamps across services with clock skew is error-prone and labor-intensive. Metrics show aggregate system health but lack request-level granularity. Distributed tracing bridges this gap by providing end-to-end request visibility. It reveals: the actual dependency graph (which services call which), service-level latency breakdown (database took 800ms, external API 200ms), error propagation paths (service A failed, causing B and C to fail), and parallelization opportunities (these 3 calls could run concurrently). This transforms debugging from manual log correlation across dozens of services into visual, interactive exploration of individual request flows.",
    tradeoffs: {
      pros: [
        "End-to-end visibility into request flows across services",
        "Pinpoint bottlenecks and latency sources with precise timing data",
        "Understand actual system dependencies and call graphs",
        "Correlate failures across service boundaries",
        "Identify optimization opportunities through critical path analysis",
      ],
      cons: [
        "Performance overhead: 1-5% CPU/memory cost from instrumentation",
        "Storage costs: traces generate high-volume data requiring specialized backends",
        "Sampling complexity: balancing trace coverage with system overhead",
        "Context propagation fragility: broken trace context loses end-to-end visibility",
        "Instrumentation burden: requires code changes or auto-instrumentation setup",
      ],
    },
    relatedPatterns: [
      "opentelemetry",
      "jaeger",
      "zipkin",
      "tempo",
      "x-ray",
      "sampling",
      "observability",
    ],
  },

  structure: {
    participants: [
      {
        name: "Tracer",
        role: "Span Creator",
        responsibilities: [
          "Create spans for units of work (HTTP requests, DB queries)",
          "Attach trace ID and span ID to each span",
          "Propagate context to child operations",
        ],
      },
      {
        name: "Context Propagator",
        role: "Cross-Service Correlation",
        responsibilities: [
          "Inject trace context into outbound requests (HTTP headers, message metadata)",
          "Extract trace context from inbound requests",
          "Maintain parent-child span relationships across processes",
        ],
      },
      {
        name: "Collector",
        role: "Trace Aggregation",
        responsibilities: [
          "Receive spans from instrumented services",
          "Buffer and batch spans for efficient transmission",
          "Forward spans to trace backend storage",
        ],
      },
      {
        name: "Storage Backend",
        role: "Trace Persistence",
        responsibilities: [
          "Store traces with queryable indexes (trace ID, service, duration)",
          "Support trace retrieval and search",
          "Implement retention policies and data lifecycle management",
        ],
      },
      {
        name: "Query Service",
        role: "Trace Visualization",
        responsibilities: [
          "Provide UI for trace search and exploration",
          "Render flame graphs and timeline views",
          "Generate service dependency graphs from trace data",
        ],
      },
    ],
    diagram: `flowchart LR
    subgraph Service A
        A1[Incoming Request] --> A2[Create Root Span]
        A2 --> A3[Inject Context]
    end

    subgraph Service B
        B1[Extract Context] --> B2[Create Child Span]
        B2 --> B3[Process Request]
    end

    subgraph Service C
        C1[Extract Context] --> C2[Create Child Span]
        C2 --> C3[Query Database]
    end

    A3 -->|HTTP + Trace Headers| B1
    B3 -->|HTTP + Trace Headers| C1

    A2 -->|Span| Collector
    B2 -->|Span| Collector
    C2 -->|Span| Collector

    Collector --> Backend[Trace Storage]
    Backend --> UI[Query UI]`,
    flow: [
      {
        step: 1,
        actor: "Service A",
        action: "Create Root Span",
        description:
          "Incoming request creates root span with new trace ID and span ID",
      },
      {
        step: 2,
        actor: "Service A",
        action: "Inject Context",
        description:
          "Trace context (trace ID, span ID) injected into outbound HTTP headers",
      },
      {
        step: 3,
        actor: "Service B",
        action: "Extract Context",
        description: "Extract trace context from incoming request headers",
      },
      {
        step: 4,
        actor: "Service B",
        action: "Create Child Span",
        description:
          "Create new span with same trace ID but new span ID, linking to parent",
      },
      {
        step: 5,
        actor: "Services",
        action: "Export Spans",
        description: "All services export spans to collector asynchronously",
      },
      {
        step: 6,
        actor: "Collector",
        action: "Aggregate & Forward",
        description:
          "Collector batches spans and forwards to trace storage backend",
      },
      {
        step: 7,
        actor: "Query Service",
        action: "Visualize Trace",
        description: "Engineers query by trace ID to see complete request flow",
      },
    ],
    invariants: [
      "All spans in a trace share the same trace ID",
      "Each span has a unique span ID within the trace",
      "Child spans reference parent span ID to form trace tree",
      "Trace context must propagate across all service boundaries",
      "Sampling decisions made at trace level, not span level",
    ],
  },

  codeExamples: [
    {
      id: "distributed-tracing-nodejs",
      language: "typescript",
      title: "Distributed Tracing with OpenTelemetry in Node.js",
      description:
        "Complete example showing trace context propagation across HTTP services",
      code: `import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import express from 'express';
import axios from 'axios';

// Initialize tracer provider
const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new JaegerExporter({
      endpoint: 'http://localhost:14268/api/traces',
    })
  )
);
provider.register();

// Auto-instrument HTTP
registerInstrumentations({
  instrumentations: [new HttpInstrumentation()],
});

const tracer = trace.getTracer('ecommerce-service');

// Service A: Order Service
const orderApp = express();
orderApp.post('/api/orders', async (req, res) => {
  const span = tracer.startSpan('create_order');
  span.setAttribute('order.id', req.body.orderId);
  span.setAttribute('order.amount', req.body.amount);

  try {
    // Call Payment Service
    await context.with(trace.setSpan(context.active(), span), async () => {
      const paymentSpan = tracer.startSpan('call_payment_service');
      try {
        const result = await axios.post('http://payment-service:3001/api/charge', {
          orderId: req.body.orderId,
          amount: req.body.amount,
        });
        paymentSpan.setStatus({ code: SpanStatusCode.OK });
        paymentSpan.end();

        span.setStatus({ code: SpanStatusCode.OK });
        res.json({ success: true, orderId: req.body.orderId });
      } catch (error) {
        paymentSpan.recordException(error);
        paymentSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        paymentSpan.end();
        throw error;
      }
    });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    res.status(500).json({ error: 'Order failed' });
  } finally {
    span.end();
  }
});

// Service B: Payment Service
const paymentApp = express();
paymentApp.post('/api/charge', async (req, res) => {
  // Context automatically extracted from HTTP headers by instrumentation
  const span = tracer.startSpan('process_payment');
  span.setAttribute('payment.amount', req.body.amount);

  await context.with(trace.setSpan(context.active(), span), async () => {
    // Simulate database query
    const dbSpan = tracer.startSpan('query_payment_db');
    await new Promise(resolve => setTimeout(resolve, 50));
    dbSpan.end();

    // Simulate external payment gateway call
    const gatewaySpan = tracer.startSpan('call_stripe_api');
    gatewaySpan.setAttribute('gateway', 'stripe');
    await new Promise(resolve => setTimeout(resolve, 100));
    gatewaySpan.end();
  });

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
  res.json({ charged: true });
});`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Multi-service distributed tracing setup with automatic context propagation",
        prerequisites: [
          "OpenTelemetry SDK",
          "Trace exporters",
          "HTTP instrumentation",
        ],
        systemPosition:
          "Cross-service observability infrastructure for microservices",
      },
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP client/server middleware",
      "Message queue producers/consumers",
      "Database query layers",
      "gRPC interceptors",
      "Service mesh sidecars",
    ],
    interactsWith: [
      "logging",
      "metrics",
      "alerting",
      "service-discovery",
      "load-balancers",
    ],
    architecturalBoundaries: [
      "Service-to-service communication",
      "Cross-datacenter requests",
      "Synchronous and asynchronous operations",
      "Multi-tenant request isolation",
    ],
  },

  // L5: Technology Mapping
  implementations: [
    {
      id: "jaeger",
      name: "Jaeger",
      type: "platform",
      languages: ["java", "go", "python", "typescript", "csharp"],
      description:
        "CNCF graduated distributed tracing platform originally developed by Uber. Battle-tested at scale (1 trillion spans/day at Uber), supports OpenTelemetry, provides adaptive sampling, and includes collector architecture with multiple storage backends (Cassandra, Elasticsearch, Kafka).",
      links: {
        docs: "https://www.jaegertracing.io/docs/",
        github: "https://github.com/jaegertracing/jaeger",
      },
      codeSnippet: `import { initTracer } from 'jaeger-client';

const config = {
  serviceName: 'my-service',
  sampler: {
    type: 'probabilistic',
    param: 0.1, // Sample 10% of traces
  },
  reporter: {
    collectorEndpoint: 'http://jaeger-collector:14268/api/traces',
  },
};

const tracer = initTracer(config);
const span = tracer.startSpan('operation_name');
span.setTag('user.id', userId);
span.finish();`,
    },
    {
      id: "zipkin",
      name: "Zipkin",
      type: "platform",
      languages: ["java", "go", "python", "typescript", "ruby"],
      description:
        "Lightweight distributed tracing system inspired by Google Dapper, originally developed by Twitter. Simple push-based architecture, easy setup, minimal dependencies. Ideal for teams wanting quick tracing implementation without operational complexity.",
      links: {
        docs: "https://zipkin.io/pages/documentation.html",
        github: "https://github.com/openzipkin/zipkin",
      },
      codeSnippet: `import { Tracer, BatchRecorder } from 'zipkin';
import { HttpLogger } from 'zipkin-transport-http';

const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: 'http://localhost:9411/api/v2/spans'
  })
});

const tracer = new Tracer({
  localServiceName: 'my-service',
  recorder
});`,
    },
    {
      id: "grafana-tempo",
      name: "Grafana Tempo",
      type: "platform",
      languages: ["any via OTLP"],
      description:
        "Cost-effective, high-volume distributed tracing backend designed for object storage (S3, GCS). No indexes—only trace ID lookups. Tight Grafana ecosystem integration. Ingests Jaeger, Zipkin, and OpenTelemetry formats. Best for teams already using Grafana stack.",
      links: {
        docs: "https://grafana.com/docs/tempo/latest/",
        github: "https://github.com/grafana/tempo",
      },
      codeSnippet: `# tempo-config.yaml
distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317

storage:
  trace:
    backend: s3
    s3:
      bucket: tempo-traces
      endpoint: s3.amazonaws.com`,
    },
    {
      id: "aws-xray",
      name: "AWS X-Ray",
      type: "service",
      languages: ["java", "python", "typescript", "go", "csharp"],
      description:
        "Fully managed distributed tracing service for AWS environments. Automatic integration with Lambda, API Gateway, ECS, Elastic Beanstalk. Transitioned to OpenTelemetry in 2025. Best for AWS-native applications with minimal operational overhead.",
      links: {
        docs: "https://docs.aws.amazon.com/xray/",
      },
      codeSnippet: `import AWSXRay from 'aws-xray-sdk-core';
import AWS from 'aws-sdk';

// Automatically instrument AWS SDK
const awsSDK = AWSXRay.captureAWS(AWS);

// Manual segment creation
AWSXRay.captureAsyncFunc('myOperation', async (subsegment) => {
  subsegment.addAnnotation('userId', userId);
  const result = await processOrder();
  subsegment.close();
  return result;
});`,
    },
    {
      id: "google-cloud-trace",
      name: "Google Cloud Trace",
      type: "service",
      languages: ["java", "python", "typescript", "go"],
      description:
        "Managed distributed tracing for GCP inspired by Google's internal Dapper system. Automatic integration with GKE, Cloud Run, App Engine. Global message delivery with push/pull subscriptions.",
      links: {
        docs: "https://cloud.google.com/trace/docs",
      },
    },
    {
      id: "azure-application-insights",
      name: "Azure Application Insights",
      type: "service",
      languages: ["java", "python", "typescript", "csharp"],
      description:
        "Azure's APM solution with distributed tracing, application monitoring, and analytics. Auto-instrumentation for .NET, Java, Node.js. Native integration with Azure services.",
      links: {
        docs: "https://docs.microsoft.com/en-us/azure/azure-monitor/app/distributed-tracing",
      },
    },
    {
      id: "lightstep",
      name: "Lightstep (ServiceNow Cloud Observability)",
      type: "service",
      languages: ["java", "python", "typescript", "go", "ruby"],
      description:
        "Enterprise distributed tracing platform by Dapper co-creator. 100% unsampled trace analysis, correlation with deployments, powerful anomaly detection. Premium pricing for mature organizations needing advanced analytics.",
      links: {
        docs: "https://docs.lightstep.com/",
      },
    },
    {
      id: "datadog-apm",
      name: "Datadog APM",
      type: "service",
      languages: ["java", "python", "typescript", "go", "ruby", "php"],
      description:
        "Full-stack observability platform with distributed tracing, metrics, and logs correlation. Auto-instrumentation for popular frameworks, ML-powered alerting, extensive integrations.",
      links: {
        docs: "https://docs.datadoghq.com/tracing/",
      },
    },
    {
      id: "new-relic",
      name: "New Relic",
      type: "service",
      languages: ["java", "python", "typescript", "go", "ruby", "php"],
      description:
        "Enterprise APM with distributed tracing, real-user monitoring, and infrastructure observability. Infinite tracing for 100% capture, built-in anomaly detection.",
      links: {
        docs: "https://docs.newrelic.com/docs/distributed-tracing/",
      },
    },
    {
      id: "signoz",
      name: "SigNoz",
      type: "platform",
      languages: ["any via OTLP"],
      description:
        "Open-source APM built on OpenTelemetry and ClickHouse. Single pane for traces, metrics, and logs. DataDog alternative with lower operational costs. Self-hosted or cloud.",
      links: {
        docs: "https://signoz.io/docs/",
        github: "https://github.com/SigNoz/signoz",
      },
    },
    {
      id: "honeycomb",
      name: "Honeycomb",
      type: "service",
      languages: ["any via OTLP"],
      description:
        "Observability platform optimized for high-cardinality event data. BubbleUp feature for anomaly root cause. Best for debugging complex production issues with rich context.",
      links: {
        docs: "https://docs.honeycomb.io/",
      },
    },
  ],

  // L6: System Composition
  usedInSystems: [
    {
      systemId: "uber-jaeger",
      systemName: "Uber - Jaeger Distributed Tracing",
      howUsed:
        "Uber created Jaeger in 2015 to solve distributed tracing at massive scale across 2000+ microservices. Processes 1 trillion spans per day at peak, storing them in Cassandra clusters. Every ride request generates traces with hundreds of spans (user app → dispatch → driver matching → pricing → routing → payment → completion). Enabled identifying critical path bottlenecks: a slow database query in driver location service added 200ms to every ride match, costing $50M annually in lost rides. Dependency graph visualization revealed unexpected coupling—payment service synchronously calling email service, blocking ride completion. Pattern composition: Jaeger + Adaptive Sampling (100% of slow requests, 0.1% of fast) + Cassandra (petabyte-scale storage) + Baggage (user context propagation). Rationale: Traditional APM tools couldn't handle trace volume or cost at Uber's scale. Impact: Reduced P99 latency from 5s to 800ms, identified 3000+ performance issues, enabled monolith-to-microservices migration without losing observability, saved $100M+ annually.",
      source: "https://www.uber.com/blog/distributed-tracing/",
    },
    {
      systemId: "shopify-opentelemetry",
      systemName: "Shopify - OpenTelemetry Migration",
      howUsed:
        "Shopify migrated from proprietary observability to OpenTelemetry-based distributed tracing to reduce costs and improve performance. Previous solution projected tens of millions annually as data grew; building in-house reduced storage costs by 80%+. Removed proprietary agents causing 15-20% performance overhead on high-throughput services. Stack: OpenTelemetry Collector + Tempo (traces) + Prometheus (metrics) + Loki (logs) + Grafana (visualization) + ClickHouse/Parquet (analytics storage). Pattern composition: Distributed Tracing + Metrics + Logs (unified observability) + Sampling (cost control) + Open Standards (vendor independence). Rationale: Vendor lock-in concerns, cost explosion, performance degradation from agent overhead. Impact: Query performance improved, system reliability increased, cost reduced by 80%, gained vendor flexibility, seamless compatibility across all services.",
      source:
        "https://horovits.medium.com/shopifys-journey-to-planet-scale-observability-9c0b299a04dd",
    },
    {
      systemId: "stripe-observability",
      systemName: "Stripe - AWS Managed Observability Stack",
      howUsed:
        "Stripe architected massive-scale observability solution on AWS to handle 300M metrics, 40k alerts, and 100k dashboard queries from 7k employees across 3000 engineers and 360 teams producing 500M metrics every 10 seconds. Previous third-party vendor hit scalability limits, reliability issues, and cost explosion. Migrated to Amazon Managed Service for Prometheus + Amazon Managed Grafana + distributed tracing. Pattern composition: Distributed Tracing + Metrics (Prometheus) + Visualization (Grafana) + Managed Services (reduced operational burden). Adopted 3P Framework: Principles (observability culture), Platforms (managed open-source), Practices (standardization). Rationale: Scalability ceiling reached, cost unsustainable, needed open-source flexibility without operational burden. Impact: Handled 10x growth in metrics volume, improved reliability, reduced costs, maintained team productivity without scaling observability operations team proportionally.",
      source:
        "https://aws.amazon.com/blogs/mt/how-stripe-architected-massive-scale-observability-solution-on-aws/",
    },
    {
      systemId: "slack-kafka-tracing",
      systemName: "Slack - Job Queue Distributed Tracing",
      howUsed:
        "Slack replaced Redis in-memory job queue with Kafka for durable storage to prevent memory exhaustion and job loss. Implemented distributed tracing across Kafkagate (stateless Go service enqueuing to Kafka) and JQRelay (Go service relaying from Kafka to Redis). Tracing revealed hidden latency bottlenecks in queue processing pipeline and enabled capacity planning. Pattern composition: Distributed Tracing + Message Queue (Kafka) + Load Balancing + Observability. Set up load testing environments to stress Kafka cluster before production rollout. Properly sized cluster with headroom for broker failures and leadership changes. Rationale: In-memory Redis caused job loss during failures, lacked durability, limited observability into queue processing latency. Impact: Achieved durability without sacrificing performance, gained end-to-end visibility into job processing latency, enabled proactive capacity planning, prevented cascading failures from queue exhaustion.",
      source: "https://slack.engineering/scaling-slacks-job-queue/",
    },
  ],

  philosophy: {
    coreProblem:
      "Distributed systems create invisible request flows across dozens of services, making it nearly impossible to understand system behavior, diagnose failures, or identify performance bottlenecks using traditional logging or metrics alone.",
    designPrinciple:
      "Assign each request a unique identifier that propagates across all service boundaries, creating a unified view of the request's journey through the system. Capture timing and context at every step to enable precise root cause analysis.",
    historicalContext:
      "Inspired by Google's 2010 Dapper paper, which described their internal distributed tracing system handling trillions of traces. Twitter open-sourced Zipkin in 2012, Uber created Jaeger in 2015, leading to OpenTracing (2016) and OpenCensus (2017) standards, which merged into OpenTelemetry (2019) under CNCF.",
    alternativesRejected: [
      "Log correlation: Error-prone, requires manual timestamp alignment, loses context across services",
      "Metrics only: Provides aggregate statistics but lacks request-level granularity",
      "APM vendor lock-in: Proprietary instrumentation creates vendor dependency",
    ],
    mentalModel:
      "Like a GPS tracker following a package through a delivery network—you see every checkpoint, how long it spent at each location, and the complete journey from origin to destination.",
  },

  visualization: {
    staticDiagram: `flowchart TB
    subgraph User Request
        U[User: Buy Product] --> A[Web Frontend]
    end

    subgraph Trace Tree
        A --> B[API Gateway<br/>150ms]
        B --> C[Auth Service<br/>20ms]
        B --> D[Catalog Service<br/>80ms]
        B --> E[Cart Service<br/>50ms]

        D --> F[Product DB<br/>60ms]
        E --> G[Cart DB<br/>30ms]
        E --> H[Inventory Service<br/>40ms]

        H --> I[Inventory DB<br/>25ms]
    end

    subgraph Trace Backend
        All[All Services] -->|Export Spans| Collector
        Collector --> Storage[(Trace Storage)]
        Storage --> UI[Trace Visualization]
    end

    style A fill:#e1f5ff
    style B fill:#fff3cd
    style F fill:#f8d7da
    style UI fill:#d4edda`,
    realWorldAnalogy:
      "Like a baton in a relay race that passes from runner to runner. Each runner (service) holds the baton (trace context), runs their leg (processes request), records their time (span), and hands off to the next runner. At the end, you have complete timing data for the entire race and can identify which leg was slowest.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "User checkout takes 5 seconds. Distributed trace reveals payment gateway call taking 4.2 seconds due to network timeout misconfiguration.",
        patternRole:
          "Pinpoint exact service and operation causing latency spike",
        companies: ["Amazon", "Shopify", "Etsy"],
      },
      {
        domain: "Financial Services",
        scenario:
          "Transaction processing fails intermittently. Traces show fraud detection service timing out on 2% of requests when user risk score DB is slow.",
        patternRole:
          "Correlate failures across service boundaries to identify root cause",
        companies: ["Stripe", "Square", "PayPal"],
      },
      {
        domain: "Ride-sharing",
        scenario:
          "Driver matching slow during peak hours. Traces reveal database connection pool exhaustion in location service under high concurrent load.",
        patternRole:
          "Understand system behavior under load and identify resource bottlenecks",
        companies: ["Uber", "Lyft"],
      },
      {
        domain: "Media Streaming",
        scenario:
          "Video start time degrades. Distributed tracing shows CDN selection logic making redundant geolocation API calls, adding 300ms per request.",
        patternRole:
          "Optimize critical path by identifying unnecessary sequential operations",
        companies: ["Netflix", "Spotify"],
      },
    ],
  },

  tags: [
    "observability",
    "debugging",
    "performance",
    "microservices",
    "distributed-systems",
  ],
  difficulty: "intermediate",
};
