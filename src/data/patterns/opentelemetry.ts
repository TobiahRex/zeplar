import type { Pattern } from "../schema";

export const openTelemetry: Pattern = {
  id: "opentelemetry",
  slug: "opentelemetry",
  corpusPath: "👁️ OBSERVABILITY → 🔗 Distributed Tracing → 📊 OpenTelemetry",

  hierarchy: {
    quality: "observability",
    strategy: "Distributed Tracing",
    family: "Telemetry Standards",
    level: 4,
  },

  concept: {
    name: "OpenTelemetry",
    emoji: "📊",
    tagline: "Vendor-neutral observability for the cloud-native era",
    definition:
      "OpenTelemetry (OTel) is a unified, vendor-neutral observability framework that provides standardized APIs, SDKs, and instrumentation for collecting distributed traces, metrics, and logs from applications. Born from the merger of OpenTracing and OpenCensus under the Cloud Native Computing Foundation (CNCF), it solves the observability fragmentation problem by offering a single, comprehensive toolkit that works across languages, frameworks, and backends. OTel automatically instruments popular libraries (HTTP clients, databases, message queues) to capture telemetry with zero code changes, while also providing rich APIs for custom business-logic instrumentation. Its core innovation is context propagation—the ability to track a single request across dozens of microservices using W3C Trace Context headers, creating detailed flame graphs of distributed execution. Traces capture request flows, metrics measure system health (latency, throughput, error rates), and logs provide event-level details, all correlated through shared context. Multiple exporters (Jaeger, Prometheus, Zipkin, Datadog, New Relic) enable sending data to any backend without vendor lock-in, allowing teams to switch observability providers or send to multiple destinations simultaneously.",
    problemSolved:
      "In modern distributed systems with polyglot microservices, achieving comprehensive observability is challenging. Teams face vendor lock-in from proprietary instrumentation libraries, inconsistent telemetry formats across services, manual correlation of traces/metrics/logs, and the burden of maintaining separate instrumentation for each observability backend. When a production incident occurs—say, a user reports slow checkout—engineers must manually piece together logs from 15 different services, correlate metrics from disparate systems, and guess at the request path. OTel solves this through standardized automatic instrumentation that works across languages (Java, Go, Python, Node.js, .NET), unified semantic conventions for naming spans and attributes (http.status_code, db.statement), and built-in context propagation that creates end-to-end traces across service boundaries. The framework eliminates vendor lock-in by abstracting exporters, allowing teams to change backends without rewriting instrumentation. Developers instrument once with OTel, then export to any compatible backend. This dramatically reduces the operational overhead of observability while providing richer, more actionable insights.",
    tradeoffs: {
      pros: [
        "Vendor-neutral: Switch backends without changing instrumentation",
        "Auto-instrumentation: Zero-code telemetry for popular frameworks",
        "Unified signals: Traces, metrics, and logs share context and correlation",
        "Industry standard: CNCF graduated project with broad adoption",
        "Polyglot support: Consistent APIs across 11+ languages",
      ],
      cons: [
        "Performance overhead: Auto-instrumentation adds 5-15% CPU/memory cost",
        "Complexity: Requires understanding of spans, baggage, sampling strategies",
        "Configuration burden: Many knobs to tune (sampling, exporters, processors)",
        "Large dependency footprint: SDK bundles can add 10-20MB to applications",
        "Backend compatibility gaps: Not all features supported by all backends",
      ],
    },
    relatedPatterns: [
      "jaeger",
      "zipkin",
      "prometheus",
      "distributed-tracing",
      "sampling",
      "w3c-trace-context",
    ],
  },

  structure: {
    participants: [
      {
        name: "Tracer Provider",
        role: "SDK Core",
        responsibilities: [
          "Initialize and configure OTel SDK with sampling, exporters, and processors",
          "Create tracer instances for application components",
          "Manage global context propagation and baggage",
        ],
      },
      {
        name: "Tracer",
        role: "Span Factory",
        responsibilities: [
          "Create spans representing units of work (HTTP requests, DB queries, business logic)",
          "Attach attributes, events, and status to spans",
          "Propagate context to child spans for distributed tracing",
        ],
      },
      {
        name: "Span",
        role: "Telemetry Unit",
        responsibilities: [
          "Record timing, status, and metadata for a single operation",
          "Carry context (trace ID, span ID) for correlation",
          "Support parent-child relationships to build trace trees",
        ],
      },
      {
        name: "Context Propagator",
        role: "Cross-Service Correlation",
        responsibilities: [
          "Inject trace context into outbound requests (W3C Trace Context headers)",
          "Extract trace context from inbound requests to continue traces",
          "Propagate baggage (key-value pairs) across service boundaries",
        ],
      },
      {
        name: "Exporter",
        role: "Backend Integration",
        responsibilities: [
          "Format telemetry data for specific backends (OTLP, Jaeger, Prometheus)",
          "Batch and send spans/metrics/logs to observability platforms",
          "Handle retries and backpressure from backends",
        ],
      },
      {
        name: "Processor",
        role: "Data Pipeline",
        responsibilities: [
          "Batch spans for efficient export (reduce network overhead)",
          "Filter/sample spans to control data volume and costs",
          "Enrich spans with resource attributes (service name, environment)",
        ],
      },
    ],
    diagram: `graph TB
    App[Application Code] -->|creates| Tracer[Tracer]
    Tracer -->|starts| Span1[Span: HTTP Request]
    Span1 -->|child| Span2[Span: DB Query]
    Span1 -->|child| Span3[Span: RPC Call]

    Span1 -.->|context| Propagator[Context Propagator]
    Propagator -->|W3C Headers| Service2[Downstream Service]
    Service2 -->|continues trace| Span4[Span: Service2 Work]

    Span1 --> Processor[Span Processor]
    Span2 --> Processor
    Span3 --> Processor
    Span4 --> Processor

    Processor -->|batches| Exporter[Exporter]
    Exporter -->|OTLP| Jaeger[(Jaeger)]
    Exporter -->|Prometheus| Prom[(Prometheus)]
    Exporter -->|Vendor| DataDog[(Datadog)]

    style App fill:#e1f5e1
    style Span1 fill:#fff4e1
    style Propagator fill:#e1e8f5
    style Exporter fill:#f5e1f5`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Initialize SDK",
        description:
          "Configure TracerProvider with exporters, processors, and sampling strategy on startup",
      },
      {
        step: 2,
        actor: "Auto-instrumentation",
        action: "Wrap Framework Calls",
        description:
          "OTel libraries automatically instrument HTTP servers, database clients, and message queues to create spans",
      },
      {
        step: 3,
        actor: "Tracer",
        action: "Create Span",
        description:
          "Start span with name, kind (SERVER/CLIENT/INTERNAL), and initial attributes when operation begins",
      },
      {
        step: 4,
        actor: "Context Propagator",
        action: "Inject Trace Context",
        description:
          "Add traceparent and tracestate headers to outbound HTTP/gRPC requests to continue trace in downstream services",
      },
      {
        step: 5,
        actor: "Downstream Service",
        action: "Extract Context",
        description:
          "Parse trace headers from inbound request and create child span with same trace ID",
      },
      {
        step: 6,
        actor: "Span",
        action: "Record Events & Attributes",
        description:
          "Add structured data (user.id, http.status_code, db.statement) and timing events during execution",
      },
      {
        step: 7,
        actor: "Span",
        action: "End Span",
        description:
          "Mark span complete with final status (OK/ERROR) and send to processor pipeline",
      },
      {
        step: 8,
        actor: "Processor",
        action: "Batch & Sample",
        description:
          "Collect spans into batches, apply sampling decisions, and enrich with resource attributes",
      },
      {
        step: 9,
        actor: "Exporter",
        action: "Send to Backend",
        description:
          "Format spans as OTLP/Jaeger/Zipkin and transmit to configured observability platforms",
      },
    ],
    invariants: [
      "Trace ID remains constant across all spans in a distributed request",
      "Parent span must end after all child spans complete",
      "Context propagation must preserve trace and span IDs across service boundaries",
      "Sampling decisions apply to entire traces, not individual spans",
      "Span attributes must follow semantic conventions for interoperability",
    ],
  },

  codeExamples: [
    {
      id: "otel-typescript-express",
      language: "typescript",
      title: "OpenTelemetry with Express Auto-Instrumentation",
      description:
        "Production-ready Express.js application with automatic HTTP instrumentation and custom business logic spans",
      code: `// trace.ts - Initialize OTel SDK before any other imports
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Enable diagnostic logging for troubleshooting (remove in production)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Define resource attributes identifying this service
const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'payment-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.2.3',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    'service.namespace': 'e-commerce',
  })
);

// Configure trace exporter (OTLP to Jaeger/Collector)
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {
    'x-api-key': process.env.OTEL_API_KEY || '',
  },
});

// Configure metric exporter (OTLP to Prometheus/Collector)
const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
});

// Sampling strategy: 10% of traces in production, 100% in dev
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ),
});

// Initialize OpenTelemetry SDK with auto-instrumentation
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export metrics every 60s
  }),
  sampler,
  instrumentations: [
    // Auto-instrument Express, HTTP, PostgreSQL, Redis, etc.
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'], // Exclude health checks
      },
      '@opentelemetry/instrumentation-express': {
        requestHook: (span, requestInfo) => {
          // Enrich HTTP spans with custom attributes
          span.setAttribute('http.user_agent', requestInfo.request.headers['user-agent'] || '');
        },
      },
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true, // Include SQL statements
      },
    }),
  ],
});

// Start SDK before application code runs
sdk.start();
console.log('OpenTelemetry SDK initialized');

// Graceful shutdown: flush pending telemetry
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OTel SDK shut down successfully'))
    .catch((error) => console.error('Error shutting down OTel SDK', error))
    .finally(() => process.exit(0));
});

// ============================================================================
// app.ts - Application code with custom instrumentation
// ============================================================================
import express from 'express';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { Pool } from 'pg';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

// Get tracer for creating custom spans
const tracer = trace.getTracer('payment-service', '1.2.3');

// Database and cache clients (auto-instrumented)
const db = new Pool({
  host: 'localhost',
  database: 'payments',
  max: 20,
});

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

// Custom middleware to add user context to all spans
app.use((req, res, next) => {
  const currentSpan = trace.getActiveSpan();
  if (currentSpan && req.headers['user-id']) {
    currentSpan.setAttribute('user.id', req.headers['user-id']);
    currentSpan.setAttribute('user.tier', req.headers['user-tier'] || 'free');
  }
  next();
});

// ============================================================================
// Payment processing endpoint with custom spans
// ============================================================================
app.post('/api/payments', async (req, res) => {
  // Express auto-instrumentation already created parent span
  const { userId, amount, currency, paymentMethod } = req.body;

  try {
    // Validate payment with custom span
    const validationResult = await validatePayment(userId, amount, currency);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.reason });
    }

    // Check fraud risk with custom span
    const fraudScore = await checkFraudRisk(userId, amount, paymentMethod);
    if (fraudScore > 0.8) {
      return res.status(403).json({ error: 'Payment flagged for fraud review' });
    }

    // Process payment through external gateway with custom span
    const paymentResult = await processPaymentGateway(amount, currency, paymentMethod);

    // Record transaction in database (auto-instrumented)
    await db.query(
      'INSERT INTO transactions (user_id, amount, currency, gateway_id, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, amount, currency, paymentResult.gatewayTransactionId, 'completed']
    );

    // Increment success metric (custom metric)
    const meter = trace.getMeter('payment-service');
    const paymentCounter = meter.createCounter('payments.processed', {
      description: 'Number of payments processed',
    });
    paymentCounter.add(1, {
      status: 'success',
      currency,
      paymentMethod,
    });

    res.json({
      transactionId: paymentResult.transactionId,
      status: 'success',
    });
  } catch (error: any) {
    // Record error in active span
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.recordException(error);
      currentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }

    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// ============================================================================
// Custom span: Payment validation with cache check
// ============================================================================
async function validatePayment(
  userId: string,
  amount: number,
  currency: string
): Promise<{ valid: boolean; reason?: string }> {
  // Create custom span for this business logic
  return tracer.startActiveSpan('validate_payment', async (span) => {
    try {
      span.setAttributes({
        'payment.user_id': userId,
        'payment.amount': amount,
        'payment.currency': currency,
      });

      // Check cache first (Redis auto-instrumented)
      const cacheKey = \`user:\${userId}:limits\`;
      const cachedLimits = await redis.get(cacheKey);

      let userLimits;
      if (cachedLimits) {
        span.addEvent('cache_hit', { key: cacheKey });
        userLimits = JSON.parse(cachedLimits);
      } else {
        span.addEvent('cache_miss', { key: cacheKey });
        // Database query (auto-instrumented)
        const result = await db.query(
          'SELECT daily_limit, currency FROM user_limits WHERE user_id = $1',
          [userId]
        );
        userLimits = result.rows[0];

        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(userLimits));
      }

      // Business logic validation
      if (userLimits.currency !== currency) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        return { valid: false, reason: 'Currency mismatch' };
      }

      if (amount > userLimits.daily_limit) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute('payment.limit_exceeded', true);
        return { valid: false, reason: 'Exceeds daily limit' };
      }

      span.setStatus({ code: SpanStatusCode.OK });
      return { valid: true };
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end(); // Always end span
    }
  });
}

// ============================================================================
// Custom span: Fraud detection with external service call
// ============================================================================
async function checkFraudRisk(
  userId: string,
  amount: number,
  paymentMethod: string
): Promise<number> {
  return tracer.startActiveSpan(
    'check_fraud_risk',
    { kind: SpanKind.CLIENT }, // Outbound call
    async (span) => {
      try {
        span.setAttributes({
          'fraud.user_id': userId,
          'fraud.amount': amount,
          'fraud.payment_method': paymentMethod,
        });

        // Simulate external fraud detection API call
        // In production, HTTP client (fetch/axios) would be auto-instrumented
        const response = await fetch('https://fraud-api.example.com/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Context propagation: OTel auto-injects trace headers here
          },
          body: JSON.stringify({ userId, amount, paymentMethod }),
        });

        const fraudData = await response.json();
        const riskScore = fraudData.riskScore;

        span.setAttribute('fraud.risk_score', riskScore);
        span.addEvent('fraud_check_completed', {
          score: riskScore,
          threshold: 0.8,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return riskScore;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        // Return safe default on error
        return 0.5;
      } finally {
        span.end();
      }
    }
  );
}

// ============================================================================
// Custom span: Payment gateway integration
// ============================================================================
async function processPaymentGateway(
  amount: number,
  currency: string,
  paymentMethod: string
): Promise<{ transactionId: string; gatewayTransactionId: string }> {
  return tracer.startActiveSpan(
    'process_payment_gateway',
    { kind: SpanKind.CLIENT },
    async (span) => {
      try {
        span.setAttributes({
          'gateway.provider': 'stripe',
          'gateway.amount': amount,
          'gateway.currency': currency,
          'gateway.method': paymentMethod,
        });

        // Simulate gateway call with latency tracking
        const startTime = Date.now();

        // In production: actual Stripe/payment gateway SDK call
        // OTel would auto-instrument HTTP calls
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulated latency

        const latency = Date.now() - startTime;
        span.setAttribute('gateway.latency_ms', latency);
        span.addEvent('gateway_response_received', { latency });

        const transactionId = \`txn_\${Date.now()}\`;
        const gatewayTransactionId = \`gtw_\${Date.now()}\`;

        span.setStatus({ code: SpanStatusCode.OK });
        return { transactionId, gatewayTransactionId };
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Payment service listening on port \${PORT}\`);
});`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Express.js payment microservice with OTel SDK initialization, auto-instrumentation, custom spans, context propagation, and multi-backend export",
        prerequisites: [
          "OpenTelemetry concepts (traces, spans, context)",
          "Express.js framework",
          "Async/await patterns",
          "W3C Trace Context standard",
        ],
        systemPosition:
          "Payment processing service in e-commerce platform, exporting telemetry to Jaeger for distributed tracing and Prometheus for metrics",
        performanceComparison: {
          withoutPattern:
            "Manual logging: 15+ services log independently, engineers spend 30-45 minutes correlating logs during incidents, no visibility into cross-service latency bottlenecks",
          withPattern:
            "OTel traces: Single trace ID spans all 15 services, incident root cause identified in 2-3 minutes via flame graph, P95 latency breakdowns show exact bottleneck (Redis cache miss adding 200ms)",
          quantifiedImprovement:
            "Mean time to resolution (MTTR) reduced from 45min to 3min (93% faster), caught 12 production issues in staging via trace analysis before customer impact",
        },
      },
      annotations: [
        {
          id: "otel-sdk-init",
          lines: [15, 28],
          action: "Configure resource attributes identifying the service",
          reason:
            "Resource attributes (service name, version, environment) appear on all telemetry, enabling filtering/aggregation in observability backends. Critical for multi-service environments where you need to distinguish payment-service traces from auth-service traces.",
          contextLevel: "system",
          relatedConcepts: [
            "semantic-conventions",
            "resource-detection",
            "service-discovery",
          ],
        },
        {
          id: "otel-sampling",
          lines: [41, 46],
          action:
            "Configure parent-based sampling with 10% ratio in production",
          reason:
            "Sampling controls data volume and costs. 100% sampling in dev ensures full visibility during testing; 10% in production balances cost ($1000/month for 1M traces) vs. coverage (statistically significant for identifying issues). Parent-based ensures entire traces are sampled together, not individual spans.",
          contextLevel: "system",
          relatedConcepts: [
            "head-based-sampling",
            "tail-based-sampling",
            "cost-optimization",
          ],
        },
        {
          id: "otel-auto-instrumentation",
          lines: [54, 71],
          action:
            "Enable automatic instrumentation for Express, HTTP, PostgreSQL, Redis",
          reason:
            "Auto-instrumentation captures 80% of telemetry with zero code changes. HTTP client/server, database queries, and cache operations are automatically wrapped in spans with semantic attributes (http.method, db.statement). Eliminates manual span creation for common operations.",
          contextLevel: "module",
          relatedConcepts: [
            "monkey-patching",
            "aspect-oriented-programming",
            "zero-code-instrumentation",
          ],
        },
        {
          id: "otel-graceful-shutdown",
          lines: [77, 84],
          action: "Flush pending telemetry on SIGTERM before process exit",
          reason:
            "Without shutdown hook, in-flight spans in batch processors are lost (up to 60s of data). Kubernetes sends SIGTERM 30s before SIGKILL; graceful shutdown ensures final spans reach backend. Critical for accurate trace completion and avoiding orphaned spans.",
          contextLevel: "system",
          relatedConcepts: [
            "graceful-shutdown",
            "batch-processing",
            "data-consistency",
          ],
        },
        {
          id: "otel-custom-middleware",
          lines: [108, 115],
          action: "Enrich auto-generated HTTP spans with user context",
          reason:
            "Auto-instrumentation provides generic HTTP data (method, status). Business context (user ID, tier) enables powerful queries like 'show all traces for premium users with errors'. Middleware pattern ensures consistent enrichment across all endpoints without repeating code.",
          contextLevel: "module",
          relatedConcepts: [
            "span-attributes",
            "business-context",
            "middleware-pattern",
          ],
        },
        {
          id: "otel-custom-span-validation",
          lines: [171, 177],
          action:
            "Create custom span for payment validation with business attributes",
          reason:
            "Auto-instrumentation doesn't understand business logic. Custom span for validatePayment allows tracking validation latency separately, filtering by amount/currency, and correlating validation failures with downstream errors. Provides business-level observability beyond infrastructure.",
          contextLevel: "module",
          relatedConcepts: [
            "custom-instrumentation",
            "business-metrics",
            "span-hierarchy",
          ],
        },
        {
          id: "otel-span-events",
          lines: [184, 185],
          action: "Record cache hit/miss as span events with context",
          reason:
            "Events are timestamped annotations within spans. Cache miss event at T+50ms explains why validation took 200ms (needed DB query). Events preserve timing granularity that attributes alone can't capture, essential for performance debugging.",
          contextLevel: "local",
          relatedConcepts: [
            "span-events",
            "performance-profiling",
            "structured-logging",
          ],
        },
        {
          id: "otel-error-handling",
          lines: [205, 212],
          action: "Record exceptions and set error status on span",
          reason:
            "recordException captures full stack trace and error message as span attributes. setStatus(ERROR) marks span as failed, enabling queries like 'show all failed payment validations'. Backends use error status to highlight problems in trace visualizations. Without this, exceptions are invisible in traces.",
          contextLevel: "local",
          relatedConcepts: [
            "exception-tracking",
            "error-propagation",
            "distributed-debugging",
          ],
        },
        {
          id: "otel-context-propagation",
          lines: [237, 242],
          action:
            "Make outbound HTTP call with automatic trace context injection",
          reason:
            "OTel HTTP instrumentation automatically injects traceparent header (trace ID, span ID) into fetch/axios calls. Downstream fraud-api service extracts this header and creates child span with same trace ID. This is how single trace spans multiple services—without it, each service has disconnected traces.",
          contextLevel: "system",
          relatedConcepts: [
            "w3c-trace-context",
            "context-propagation",
            "distributed-tracing",
          ],
        },
        {
          id: "otel-span-kind",
          lines: [229, 230],
          action: "Set span kind to CLIENT for outbound service calls",
          reason:
            "Span kinds (SERVER, CLIENT, PRODUCER, CONSUMER, INTERNAL) help backends visualize service boundaries. CLIENT spans show as outbound calls in flame graphs, paired with SERVER spans in downstream services. Enables calculating network latency (SERVER start - CLIENT start).",
          contextLevel: "module",
          relatedConcepts: [
            "span-kind",
            "service-boundaries",
            "network-latency",
          ],
        },
      ],
      highlights: [
        {
          lines: [48, 71],
          label: "Auto-instrumentation configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [108, 115],
          label: "User context enrichment middleware",
          sbvpDomain: "behavior",
        },
        {
          lines: [171, 213],
          label: "Custom business logic span with cache events",
          sbvpDomain: "behavior",
        },
        {
          lines: [237, 242],
          label: "Context propagation to external service",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "otel-python-fastapi",
      language: "python",
      title: "OpenTelemetry with FastAPI: Trace/Metric/Log Correlation",
      description:
        "FastAPI microservice demonstrating automatic instrumentation, custom spans, metric collection, and log correlation via trace context",
      code: `# trace_config.py - Initialize OTel before application imports
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION, DEPLOYMENT_ENVIRONMENT
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
import logging
import os

# Configure structured logging with trace context injection
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [trace_id=%(otelTraceID)s span_id=%(otelSpanID)s] - %(message)s'
)

# Create resource identifying this service
resource = Resource.create({
    SERVICE_NAME: "inventory-service",
    SERVICE_VERSION: "2.1.0",
    DEPLOYMENT_ENVIRONMENT: os.getenv("ENVIRONMENT", "development"),
    "service.namespace": "retail",
})

# Configure trace provider with OTLP exporter to collector
trace_provider = TracerProvider(resource=resource)
otlp_trace_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
    insecure=True,  # Use TLS in production
)
trace_provider.add_span_processor(BatchSpanProcessor(otlp_trace_exporter))
trace.set_tracer_provider(trace_provider)

# Configure metric provider with OTLP exporter
metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
        insecure=True,
    ),
    export_interval_millis=30000,  # Export every 30s
)
metric_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
metrics.set_meter_provider(metric_provider)

# Get tracer and meter for custom instrumentation
tracer = trace.get_tracer(__name__, "2.1.0")
meter = metrics.get_meter(__name__, "2.1.0")

# Create custom metrics
inventory_check_counter = meter.create_counter(
    "inventory.checks",
    description="Number of inventory availability checks",
    unit="1",
)
inventory_level_histogram = meter.create_histogram(
    "inventory.level",
    description="Inventory level distribution",
    unit="items",
)
cache_hit_counter = meter.create_counter(
    "cache.hits",
    description="Cache hit rate",
    unit="1",
)

# ============================================================================
# app.py - FastAPI application with auto and custom instrumentation
# ============================================================================
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import httpx
import redis.asyncio as aioredis
from opentelemetry.trace import SpanKind, Status, StatusCode
from opentelemetry.semconv.trace import SpanAttributes
import json
import time

app = FastAPI(title="Inventory Service")

# Database setup (will be auto-instrumented)
engine = create_engine("postgresql://user:pass@localhost/inventory")
SessionLocal = sessionmaker(bind=engine)
SQLAlchemyInstrumentor().instrument(engine=engine)

# Redis setup (will be auto-instrumented)
redis_client = aioredis.from_url("redis://localhost:6379", decode_responses=True)
RedisInstrumentor().instrument()

# HTTP client setup (will be auto-instrumented)
HTTPXClientInstrumentor().instrument()

# Auto-instrument FastAPI (creates spans for all endpoints)
FastAPIInstrumentor.instrument_app(app)

# Pydantic models
class InventoryCheckRequest(BaseModel):
    product_id: str
    quantity: int
    warehouse_id: str

class InventoryCheckResponse(BaseModel):
    available: bool
    current_stock: int
    warehouse_id: str
    estimated_restock_date: str | None = None

# ============================================================================
# Middleware: Inject trace context into logs
# ============================================================================
@app.middleware("http")
async def trace_context_middleware(request: Request, call_next):
    """Inject trace and span IDs into log context for correlation"""
    span = trace.get_current_span()
    if span:
        trace_id = format(span.get_span_context().trace_id, '032x')
        span_id = format(span.get_span_context().span_id, '016x')

        # Add to logging context (accessible in log format)
        import logging
        logging.LoggerAdapter(logging.getLogger(), {
            'otelTraceID': trace_id,
            'otelSpanID': span_id,
        })

        # Add to response headers for client-side correlation
        response = await call_next(request)
        response.headers['X-Trace-ID'] = trace_id
        return response

    return await call_next(request)

# ============================================================================
# Endpoint: Check inventory availability with custom spans
# ============================================================================
@app.post("/api/inventory/check", response_model=InventoryCheckResponse)
async def check_inventory(request: InventoryCheckRequest):
    """Check inventory availability with multi-layer caching and warehouse routing"""

    # FastAPI auto-instrumentation already created parent span
    current_span = trace.get_current_span()
    current_span.set_attributes({
        "inventory.product_id": request.product_id,
        "inventory.quantity": request.quantity,
        "inventory.warehouse_id": request.warehouse_id,
    })

    try:
        # Record metric for inventory check
        inventory_check_counter.add(1, {
            "warehouse": request.warehouse_id,
            "cache_tier": "l1",  # Will be updated
        })

        # L1 Cache: Check in-memory/Redis cache
        cached_stock = await check_cache(request.product_id, request.warehouse_id)
        if cached_stock is not None:
            current_span.add_event("cache_hit", {"tier": "redis", "stock": cached_stock})
            cache_hit_counter.add(1, {"tier": "redis"})

            inventory_level_histogram.record(cached_stock, {
                "warehouse": request.warehouse_id,
                "source": "cache",
            })

            return InventoryCheckResponse(
                available=cached_stock >= request.quantity,
                current_stock=cached_stock,
                warehouse_id=request.warehouse_id,
            )

        # Cache miss: Query database
        current_span.add_event("cache_miss", {"tier": "redis"})
        stock_level = await query_database_stock(request.product_id, request.warehouse_id)

        # Update cache for future requests
        await update_cache(request.product_id, request.warehouse_id, stock_level)

        # If insufficient stock, check other warehouses
        if stock_level < request.quantity:
            alternative_warehouse = await find_alternative_warehouse(
                request.product_id,
                request.quantity
            )
            if alternative_warehouse:
                current_span.add_event("warehouse_redirect", {
                    "from": request.warehouse_id,
                    "to": alternative_warehouse["warehouse_id"],
                })
                return InventoryCheckResponse(
                    available=True,
                    current_stock=alternative_warehouse["stock"],
                    warehouse_id=alternative_warehouse["warehouse_id"],
                )

        inventory_level_histogram.record(stock_level, {
            "warehouse": request.warehouse_id,
            "source": "database",
        })

        return InventoryCheckResponse(
            available=stock_level >= request.quantity,
            current_stock=stock_level,
            warehouse_id=request.warehouse_id,
        )

    except Exception as e:
        current_span.record_exception(e)
        current_span.set_status(Status(StatusCode.ERROR, str(e)))
        logging.error(f"Inventory check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Inventory check failed")

# ============================================================================
# Custom span: Cache lookup with Redis
# ============================================================================
async def check_cache(product_id: str, warehouse_id: str) -> int | None:
    """Check Redis cache for inventory level"""
    with tracer.start_as_current_span(
        "check_inventory_cache",
        kind=SpanKind.CLIENT,
    ) as span:
        try:
            cache_key = f"inventory:{warehouse_id}:{product_id}"
            span.set_attribute("cache.key", cache_key)

            # Redis get (auto-instrumented, creates child span)
            cached_value = await redis_client.get(cache_key)

            if cached_value:
                span.set_attribute("cache.hit", True)
                stock = int(cached_value)
                span.add_event("cache_hit", {"stock": stock})
                return stock
            else:
                span.set_attribute("cache.hit", False)
                span.add_event("cache_miss")
                return None

        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            logging.warning(f"Cache check failed: {e}")
            return None  # Fail open: continue to database

# ============================================================================
# Custom span: Database query with SQL logging
# ============================================================================
async def query_database_stock(product_id: str, warehouse_id: str) -> int:
    """Query PostgreSQL for current inventory level"""
    with tracer.start_as_current_span(
        "query_inventory_database",
        kind=SpanKind.CLIENT,
    ) as span:
        span.set_attributes({
            "db.system": "postgresql",
            "db.name": "inventory",
            "db.operation": "SELECT",
            SpanAttributes.DB_STATEMENT: "SELECT stock_level FROM inventory WHERE ...",
        })

        try:
            session = SessionLocal()

            # SQLAlchemy query (auto-instrumented, creates child span)
            result = session.execute(
                text("SELECT stock_level FROM inventory WHERE product_id = :pid AND warehouse_id = :wid"),
                {"pid": product_id, "wid": warehouse_id}
            )
            row = result.fetchone()
            session.close()

            if not row:
                span.set_status(Status(StatusCode.ERROR, "Product not found"))
                raise ValueError(f"Product {product_id} not found in warehouse {warehouse_id}")

            stock_level = row[0]
            span.set_attribute("inventory.stock_level", stock_level)
            span.add_event("stock_queried", {"level": stock_level})

            return stock_level

        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise

# ============================================================================
# Custom span: Update cache with TTL
# ============================================================================
async def update_cache(product_id: str, warehouse_id: str, stock_level: int):
    """Update Redis cache with 5-minute TTL"""
    with tracer.start_as_current_span("update_inventory_cache") as span:
        cache_key = f"inventory:{warehouse_id}:{product_id}"
        span.set_attributes({
            "cache.key": cache_key,
            "cache.value": stock_level,
            "cache.ttl": 300,
        })

        try:
            # Redis setex (auto-instrumented)
            await redis_client.setex(cache_key, 300, str(stock_level))
            span.add_event("cache_updated")
        except Exception as e:
            span.record_exception(e)
            logging.warning(f"Cache update failed: {e}")

# ============================================================================
# Custom span: Cross-service call to warehouse service
# ============================================================================
async def find_alternative_warehouse(product_id: str, quantity: int) -> dict | None:
    """Call warehouse-router service to find alternative warehouse with stock"""
    with tracer.start_as_current_span(
        "find_alternative_warehouse",
        kind=SpanKind.CLIENT,
    ) as span:
        span.set_attributes({
            "peer.service": "warehouse-router",
            "warehouse.product_id": product_id,
            "warehouse.quantity": quantity,
        })

        try:
            # HTTPX client call (auto-instrumented, propagates trace context)
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://warehouse-router:8080/api/find-warehouse",
                    json={"product_id": product_id, "quantity": quantity},
                    timeout=2.0,
                )

                span.set_attribute(SpanAttributes.HTTP_STATUS_CODE, response.status_code)

                if response.status_code == 200:
                    data = response.json()
                    span.add_event("warehouse_found", {
                        "warehouse_id": data["warehouse_id"],
                        "stock": data["stock"],
                    })
                    return data
                elif response.status_code == 404:
                    span.add_event("no_warehouse_available")
                    return None
                else:
                    span.set_status(Status(StatusCode.ERROR, f"Unexpected status: {response.status_code}"))
                    return None

        except httpx.TimeoutException as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, "Warehouse router timeout"))
            logging.warning(f"Warehouse router timeout: {e}")
            return None
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            logging.error(f"Warehouse router error: {e}")
            return None

# ============================================================================
# Health check endpoint (excluded from auto-instrumentation)
# ============================================================================
@app.get("/health")
async def health():
    """Health check endpoint - no tracing overhead"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production FastAPI inventory microservice with OTel traces, metrics, logs correlation, cache layers, and cross-service calls with context propagation",
        prerequisites: [
          "FastAPI framework",
          "OpenTelemetry Python SDK",
          "SQLAlchemy ORM",
          "Redis async client",
          "HTTPX async HTTP client",
        ],
        systemPosition:
          "Inventory service in retail platform, communicating with warehouse-router service, exporting telemetry to OTLP collector (Jaeger + Prometheus)",
        performanceComparison: {
          withoutPattern:
            "Manual logging: Separate log files for FastAPI, SQLAlchemy, Redis. During P99 latency spike (2.5s checkout), engineers grep logs across 3 services for 20 minutes, find slow query but can't correlate to user action or cache behavior.",
          withPattern:
            "OTel traces: Single trace shows full request flow: cache miss (5ms) → DB query (1.2s - missing index!) → warehouse router call (800ms - timeout retry). Trace context in logs links ERROR log to exact span. Root cause found in 90 seconds via Jaeger UI.",
          quantifiedImprovement:
            "MTTR reduced 93% (20min → 90sec). Caught slow query in staging via P99 trace analysis before production deploy. Metrics showed cache hit rate dropped from 85% to 12% during incident, guiding fix priority.",
        },
      },
      annotations: [
        {
          id: "otel-py-logging-integration",
          lines: [18, 21],
          action:
            "Configure structured logging with trace/span ID placeholders",
          reason:
            "Injecting trace_id and span_id into log format enables correlation between logs and traces. When investigating a failed trace in Jaeger, engineers can copy trace ID and query logs with that ID to see detailed error messages, stack traces, and business context not captured in spans.",
          contextLevel: "system",
          relatedConcepts: [
            "log-correlation",
            "structured-logging",
            "distributed-debugging",
          ],
        },
        {
          id: "otel-py-metrics",
          lines: [58, 70],
          action:
            "Create custom metrics for inventory checks, stock levels, cache hits",
          reason:
            "While traces show individual request flows, metrics provide aggregated trends. Histogram of inventory levels reveals distribution (90% have <10 items, indicating low stock issues). Counter of cache hits shows hit rate degradation (85% → 60%), prompting cache tuning investigation.",
          contextLevel: "module",
          relatedConcepts: [
            "custom-metrics",
            "histogram-metrics",
            "cache-observability",
          ],
        },
        {
          id: "otel-py-trace-headers",
          lines: [126, 135],
          action:
            "Extract trace context and inject into log adapter and response headers",
          reason:
            "Middleware extracts trace ID from active span and adds to logging context (available in log formatter) and HTTP response header (X-Trace-ID). Clients can include trace ID in support tickets; support team searches logs/traces by that ID for full context.",
          contextLevel: "system",
          relatedConcepts: [
            "trace-context-propagation",
            "support-workflow",
            "end-to-end-observability",
          ],
        },
        {
          id: "otel-py-span-attributes",
          lines: [145, 150],
          action: "Enrich auto-generated HTTP span with business attributes",
          reason:
            "Auto-instrumentation captures HTTP basics (method, path, status). Adding product_id, quantity, warehouse_id enables powerful queries: 'Show all slow requests for product-123', 'What's P99 latency for warehouse-west?'. Business context transforms generic HTTP traces into actionable insights.",
          contextLevel: "module",
          relatedConcepts: [
            "business-context",
            "span-attributes",
            "query-driven-instrumentation",
          ],
        },
        {
          id: "otel-py-span-events",
          lines: [160, 161],
          action: "Record cache hit as span event with stock level",
          reason:
            "Events capture point-in-time occurrences within span timeline. Cache hit event at T+2ms shows cache was checked early; subsequent DB query event at T+50ms indicates cache miss fallback. Events preserve temporal ordering that attributes flatten, essential for understanding execution flow.",
          contextLevel: "local",
          relatedConcepts: [
            "span-events",
            "temporal-observability",
            "performance-profiling",
          ],
        },
        {
          id: "otel-py-custom-span-cache",
          lines: [194, 197],
          action:
            "Create custom CLIENT span for cache lookup with cache key attribute",
          reason:
            "Auto-instrumentation wraps Redis commands, but custom span adds cache-specific context (hit/miss, key pattern). SpanKind.CLIENT marks this as outbound call to Redis, enabling service map visualization showing inventory-service → Redis dependency.",
          contextLevel: "module",
          relatedConcepts: [
            "span-kind",
            "service-dependencies",
            "custom-instrumentation",
          ],
        },
        {
          id: "otel-py-fail-open",
          lines: [212, 214],
          action:
            "Return None on cache failure instead of propagating exception",
          reason:
            "Fail-open pattern: if Redis is down, span records error but function returns None, allowing fallback to database. Without this, Redis outage cascades to inventory service outage. Span error status preserves visibility (alerts fire) while maintaining availability.",
          contextLevel: "system",
          relatedConcepts: [
            "fail-open",
            "graceful-degradation",
            "error-handling",
          ],
        },
        {
          id: "otel-py-semantic-conventions",
          lines: [226, 231],
          action: "Use semantic conventions for database span attributes",
          reason:
            "SemanticConventions.DB_STATEMENT standardizes attribute naming (db.statement, db.system, db.operation). All observability backends understand these conventions, enabling cross-vendor queries. Custom attribute names (my_db_query) break backend integrations and query compatibility.",
          contextLevel: "system",
          relatedConcepts: [
            "semantic-conventions",
            "interoperability",
            "standardization",
          ],
        },
        {
          id: "otel-py-cross-service-propagation",
          lines: [284, 290],
          action:
            "Make HTTP call to warehouse-router with automatic trace context propagation",
          reason:
            "HTTPX auto-instrumentation injects traceparent header into outbound request. Warehouse-router service (also OTel-instrumented) extracts this header and creates child span with same trace_id. Single trace now spans inventory-service + warehouse-router, showing full distributed flow in Jaeger.",
          contextLevel: "system",
          relatedConcepts: [
            "w3c-trace-context",
            "distributed-tracing",
            "context-propagation",
          ],
        },
        {
          id: "otel-py-timeout-handling",
          lines: [307, 312],
          action:
            "Catch timeout exception, record in span, return None for graceful degradation",
          reason:
            "Warehouse-router timeout (2s) is recorded as span error with specific exception type. Returning None instead of propagating exception allows inventory check to complete with current warehouse stock. Span error triggers alert ('warehouse-router timing out') while maintaining service availability.",
          contextLevel: "system",
          relatedConcepts: [
            "timeout-patterns",
            "exception-handling",
            "graceful-degradation",
          ],
        },
      ],
      highlights: [
        {
          lines: [58, 70],
          label: "Custom metric definitions for business KPIs",
          sbvpDomain: "structure",
        },
        {
          lines: [126, 135],
          label: "Trace context injection into logs and response headers",
          sbvpDomain: "behavior",
        },
        {
          lines: [194, 214],
          label: "Custom cache span with fail-open error handling",
          sbvpDomain: "behavior",
        },
        {
          lines: [270, 315],
          label:
            "Cross-service call with context propagation and timeout handling",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "otel-java-spring-boot",
      language: "java",
      title: "OpenTelemetry with Spring Boot and Micrometer Bridge",
      description:
        "Spring Boot order processing service using OTel Java agent for auto-instrumentation, Micrometer bridge for metric compatibility, and custom spans for business logic",
      code: `// application.yml - Spring Boot configuration
spring:
  application:
    name: order-service
  datasource:
    url: jdbc:postgresql://localhost:5432/orders
    username: postgres
    password: postgres

# OpenTelemetry configuration (via Java agent)
otel:
  service:
    name: order-service
  exporter:
    otlp:
      endpoint: http://localhost:4317
  traces:
    sampler: parentbased_traceidratio
    sampler.arg: 0.1  # 10% sampling
  metrics:
    exporter: otlp
  logs:
    exporter: otlp

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
  tracing:
    sampling:
      probability: 0.1

// ===========================================================================
// OrderServiceApplication.java - Application entry point
// ===========================================================================
package com.example.orderservice;

import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.instrumentation.spring.webmvc.v6_0.SpringWebMvcTelemetry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class OrderServiceApplication {

    public static void main(String[] args) {
        // Note: When using OTel Java agent (-javaagent:opentelemetry-javaagent.jar),
        // auto-instrumentation is automatic. No manual SDK initialization needed.
        // Agent instruments Spring Boot, JDBC, HTTP clients, Kafka, etc.
        SpringApplication.run(OrderServiceApplication.class, args);
    }

    /**
     * Provide OpenTelemetry instance for custom instrumentation.
     * When Java agent is active, GlobalOpenTelemetry is auto-configured.
     */
    @Bean
    public OpenTelemetry openTelemetry() {
        return GlobalOpenTelemetry.get();
    }

    /**
     * Provide Tracer for creating custom spans.
     */
    @Bean
    public Tracer tracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer("order-service", "1.0.0");
    }

    /**
     * RestTemplate with OTel instrumentation (auto-configured by Java agent).
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

// ===========================================================================
// OrderController.java - REST controller with auto-instrumentation
// ===========================================================================
package com.example.orderservice.controller;

import com.example.orderservice.model.CreateOrderRequest;
import com.example.orderservice.model.Order;
import com.example.orderservice.service.OrderService;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    /**
     * Create new order with payment processing and inventory reservation.
     * OTel Java agent automatically creates SERVER span for this endpoint.
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestBody CreateOrderRequest request,
            HttpServletRequest httpRequest
    ) {
        // Get active span created by auto-instrumentation
        Span currentSpan = Span.current();

        // Enrich span with business context
        currentSpan.setAttribute("order.user_id", request.getUserId());
        currentSpan.setAttribute("order.total_amount", request.getTotalAmount());
        currentSpan.setAttribute("order.item_count", request.getItems().size());
        currentSpan.setAttribute("http.user_agent",
            httpRequest.getHeader("User-Agent"));

        // Extract trace ID for logging correlation
        String traceId = currentSpan.getSpanContext().getTraceId();
        logger.info("Creating order for user {} (trace: {})",
            request.getUserId(), traceId);

        try {
            // Delegate to service layer (custom spans created there)
            Order order = orderService.createOrder(request);

            currentSpan.setAttribute("order.id", order.getId());
            currentSpan.setStatus(StatusCode.OK);

            logger.info("Order {} created successfully (trace: {})",
                order.getId(), traceId);

            return ResponseEntity.status(HttpStatus.CREATED).body(order);

        } catch (InsufficientInventoryException e) {
            currentSpan.recordException(e);
            currentSpan.setStatus(StatusCode.ERROR, "Insufficient inventory");
            logger.error("Order creation failed - insufficient inventory (trace: {})",
                traceId, e);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(null);

        } catch (PaymentFailedException e) {
            currentSpan.recordException(e);
            currentSpan.setStatus(StatusCode.ERROR, "Payment failed");
            logger.error("Order creation failed - payment declined (trace: {})",
                traceId, e);
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(null);

        } catch (Exception e) {
            currentSpan.recordException(e);
            currentSpan.setStatus(StatusCode.ERROR, e.getMessage());
            logger.error("Order creation failed (trace: {})", traceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }

    /**
     * Get order by ID with caching.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
        Span currentSpan = Span.current();
        currentSpan.setAttribute("order.id", orderId);

        logger.info("Fetching order {}", orderId);

        Order order = orderService.getOrder(orderId);
        if (order == null) {
            currentSpan.setStatus(StatusCode.ERROR, "Order not found");
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(order);
    }
}

// ===========================================================================
// OrderService.java - Business logic with custom spans
// ===========================================================================
package com.example.orderservice.service;

import com.example.orderservice.model.CreateOrderRequest;
import com.example.orderservice.model.Order;
import com.example.orderservice.repository.OrderRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private Tracer tracer;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private MeterRegistry meterRegistry;

    // Micrometer metrics (bridged to OTel)
    private final Counter orderCreatedCounter;
    private final Counter orderFailedCounter;
    private final Timer paymentProcessingTimer;

    public OrderService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.orderCreatedCounter = Counter.builder("orders.created")
            .description("Number of orders successfully created")
            .tag("service", "order-service")
            .register(meterRegistry);
        this.orderFailedCounter = Counter.builder("orders.failed")
            .description("Number of failed order attempts")
            .tag("service", "order-service")
            .register(meterRegistry);
        this.paymentProcessingTimer = Timer.builder("orders.payment.duration")
            .description("Time to process payment")
            .register(meterRegistry);
    }

    /**
     * Create order with inventory reservation and payment processing.
     * Each step is instrumented with custom spans.
     */
    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        // Create custom span for order creation business logic
        Span orderSpan = tracer.spanBuilder("create_order_transaction")
            .setSpanKind(SpanKind.INTERNAL)
            .setAttribute("order.user_id", request.getUserId())
            .setAttribute("order.amount", request.getTotalAmount())
            .startSpan();

        try (Scope scope = orderSpan.makeCurrent()) {

            // Step 1: Reserve inventory
            boolean inventoryReserved = reserveInventory(request);
            if (!inventoryReserved) {
                orderSpan.addEvent("inventory_reservation_failed");
                orderSpan.setStatus(StatusCode.ERROR, "Insufficient inventory");
                orderFailedCounter.increment();
                throw new InsufficientInventoryException("Cannot reserve inventory");
            }
            orderSpan.addEvent("inventory_reserved");

            // Step 2: Process payment
            String paymentId = processPayment(request);
            orderSpan.setAttribute("order.payment_id", paymentId);
            orderSpan.addEvent("payment_processed",
                Map.of("payment_id", paymentId));

            // Step 3: Create order record in database
            Order order = new Order();
            order.setUserId(request.getUserId());
            order.setTotalAmount(request.getTotalAmount());
            order.setPaymentId(paymentId);
            order.setStatus("CONFIRMED");
            order.setCreatedAt(Instant.now());

            // JPA save (auto-instrumented by Java agent)
            order = orderRepository.save(order);

            orderSpan.setAttribute("order.id", order.getId());
            orderSpan.addEvent("order_persisted",
                Map.of("order_id", order.getId()));

            // Step 4: Publish order event to Kafka
            publishOrderEvent(order);
            orderSpan.addEvent("order_event_published");

            orderSpan.setStatus(StatusCode.OK);
            orderCreatedCounter.increment();

            logger.info("Order {} created successfully", order.getId());
            return order;

        } catch (Exception e) {
            orderSpan.recordException(e);
            orderSpan.setStatus(StatusCode.ERROR, e.getMessage());
            orderFailedCounter.increment();
            throw e;
        } finally {
            orderSpan.end();
        }
    }

    /**
     * Reserve inventory via inventory-service HTTP call.
     * OTel auto-instrumentation creates CLIENT span for RestTemplate call.
     */
    private boolean reserveInventory(CreateOrderRequest request) {
        Span inventorySpan = tracer.spanBuilder("reserve_inventory")
            .setSpanKind(SpanKind.CLIENT)
            .setAttribute("peer.service", "inventory-service")
            .setAttribute("inventory.item_count", request.getItems().size())
            .startSpan();

        try (Scope scope = inventorySpan.makeCurrent()) {

            // RestTemplate call (auto-instrumented, propagates trace context)
            String inventoryServiceUrl = "http://inventory-service:8080/api/inventory/reserve";

            Map<String, Object> reservationRequest = Map.of(
                "items", request.getItems(),
                "order_id", "pending-" + System.currentTimeMillis()
            );

            var response = restTemplate.postForObject(
                inventoryServiceUrl,
                reservationRequest,
                Map.class
            );

            boolean reserved = response != null &&
                Boolean.TRUE.equals(response.get("reserved"));

            inventorySpan.setAttribute("inventory.reserved", reserved);
            inventorySpan.setStatus(StatusCode.OK);

            return reserved;

        } catch (Exception e) {
            inventorySpan.recordException(e);
            inventorySpan.setStatus(StatusCode.ERROR, e.getMessage());
            logger.error("Inventory reservation failed", e);
            return false;
        } finally {
            inventorySpan.end();
        }
    }

    /**
     * Process payment via payment-gateway HTTP call.
     * Micrometer timer tracks payment latency (bridged to OTel metrics).
     */
    private String processPayment(CreateOrderRequest request) {
        return paymentProcessingTimer.record(() -> {
            Span paymentSpan = tracer.spanBuilder("process_payment")
                .setSpanKind(SpanKind.CLIENT)
                .setAttribute("peer.service", "payment-gateway")
                .setAttribute("payment.amount", request.getTotalAmount())
                .setAttribute("payment.method", request.getPaymentMethod())
                .startSpan();

            try (Scope scope = paymentSpan.makeCurrent()) {

                String gatewayUrl = "http://payment-gateway:8080/api/payments/charge";

                Map<String, Object> paymentRequest = Map.of(
                    "user_id", request.getUserId(),
                    "amount", request.getTotalAmount(),
                    "currency", "USD",
                    "payment_method", request.getPaymentMethod()
                );

                // RestTemplate call (auto-instrumented)
                var response = restTemplate.postForObject(
                    gatewayUrl,
                    paymentRequest,
                    Map.class
                );

                if (response == null || !"success".equals(response.get("status"))) {
                    paymentSpan.setStatus(StatusCode.ERROR, "Payment declined");
                    throw new PaymentFailedException("Payment gateway declined transaction");
                }

                String paymentId = (String) response.get("transaction_id");
                paymentSpan.setAttribute("payment.transaction_id", paymentId);
                paymentSpan.setStatus(StatusCode.OK);

                return paymentId;

            } catch (Exception e) {
                paymentSpan.recordException(e);
                paymentSpan.setStatus(StatusCode.ERROR, e.getMessage());
                throw e;
            } finally {
                paymentSpan.end();
            }
        });
    }

    /**
     * Publish order event to Kafka.
     * OTel auto-instrumentation creates PRODUCER span for Kafka.
     */
    private void publishOrderEvent(Order order) {
        Span kafkaSpan = tracer.spanBuilder("publish_order_event")
            .setSpanKind(SpanKind.PRODUCER)
            .setAttribute("messaging.system", "kafka")
            .setAttribute("messaging.destination", "order-events")
            .setAttribute("order.id", order.getId())
            .startSpan();

        try (Scope scope = kafkaSpan.makeCurrent()) {
            // Kafka producer call (auto-instrumented by Java agent)
            // Propagates trace context in Kafka message headers

            String eventPayload = String.format(
                "{\\"order_id\\": \\"%s\\", \\"status\\": \\"%s\\", \\"amount\\": %f}",
                order.getId(), order.getStatus(), order.getTotalAmount()
            );

            // kafkaTemplate.send("order-events", order.getId(), eventPayload);
            // Simulated for example

            kafkaSpan.addEvent("kafka_message_sent");
            kafkaSpan.setStatus(StatusCode.OK);

        } catch (Exception e) {
            kafkaSpan.recordException(e);
            kafkaSpan.setStatus(StatusCode.ERROR, e.getMessage());
            logger.error("Failed to publish order event", e);
        } finally {
            kafkaSpan.end();
        }
    }

    /**
     * Get order by ID (auto-instrumented database query).
     */
    public Order getOrder(String orderId) {
        // JPA findById (auto-instrumented)
        return orderRepository.findById(orderId).orElse(null);
    }
}

// ===========================================================================
// Model classes
// ===========================================================================
package com.example.orderservice.model;

import java.time.Instant;
import java.util.List;

public class CreateOrderRequest {
    private String userId;
    private double totalAmount;
    private String paymentMethod;
    private List<OrderItem> items;

    // Getters and setters
    public String getUserId() { return userId; }
    public double getTotalAmount() { return totalAmount; }
    public String getPaymentMethod() { return paymentMethod; }
    public List<OrderItem> getItems() { return items; }
}

public class OrderItem {
    private String productId;
    private int quantity;
    private double price;
    // Getters and setters
}

public class Order {
    private String id;
    private String userId;
    private double totalAmount;
    private String paymentId;
    private String status;
    private Instant createdAt;

    // Getters and setters
    public String getId() { return id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

// Custom exceptions
class InsufficientInventoryException extends RuntimeException {
    public InsufficientInventoryException(String message) { super(message); }
}

class PaymentFailedException extends RuntimeException {
    public PaymentFailedException(String message) { super(message); }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production Spring Boot order service using OTel Java agent for zero-code auto-instrumentation, custom spans for business logic, Micrometer bridge for metric compatibility, and distributed tracing across inventory/payment/Kafka services",
        prerequisites: [
          "Spring Boot framework",
          "OpenTelemetry Java agent",
          "Micrometer metrics",
          "JPA/Hibernate ORM",
          "RestTemplate HTTP client",
        ],
        systemPosition:
          "Order orchestration service in e-commerce platform, coordinating inventory-service, payment-gateway, and Kafka message broker, exporting to OTLP collector",
        performanceComparison: {
          withoutPattern:
            "Manual logging: Order creation involves 4 services (order → inventory → payment → kafka). During Black Friday, 15% of orders fail silently. Engineers check logs across 4 services, find payment gateway timeout after 1 hour, but can't determine which orders affected or if inventory was rolled back. Estimated $50K lost revenue.",
          withPattern:
            "OTel traces: Failed order trace shows: inventory-reserve (200ms, OK) → payment-process (5s, TIMEOUT) → kafka-publish (skipped). Trace query 'status=error payment.method=credit_card' finds all 1,247 affected orders. Automatic retry added, reducing failure rate to 0.3%. Micrometer metrics show payment latency P99 spiked from 300ms to 8s at incident start.",
          quantifiedImprovement:
            "MTTR: 1hr → 5min (92% faster). Revenue recovery: $50K (proactive retry of failed orders). Prevented: 3 similar incidents caught in staging via trace P99 alerts before production deploy. Java agent overhead: 3% CPU, 8% memory (acceptable for observability ROI).",
        },
      },
      annotations: [
        {
          id: "otel-java-agent",
          lines: [56, 59],
          action:
            "Rely on OTel Java agent for automatic SDK initialization and instrumentation",
          reason:
            "Java agent (-javaagent:opentelemetry-javaagent.jar) automatically instruments Spring Boot, Servlet, JDBC, Kafka, RestTemplate without code changes. Instruments at bytecode level via Java instrumentation API. Eliminates manual SDK setup and library-specific instrumentation code. Agent approach reduces instrumentation code from 500+ lines to zero, with lower maintenance burden.",
          contextLevel: "system",
          relatedConcepts: [
            "java-agent",
            "bytecode-instrumentation",
            "zero-code-observability",
          ],
        },
        {
          id: "otel-java-global-instance",
          lines: [67, 70],
          action:
            "Retrieve GlobalOpenTelemetry instance configured by Java agent",
          reason:
            "When Java agent is active, it configures GlobalOpenTelemetry singleton with exporters, samplers, and propagators from environment variables or config. Application code retrieves this instance for creating custom spans. Enables mixing auto-instrumentation (95% of spans) with custom instrumentation (5% business logic spans) seamlessly.",
          contextLevel: "system",
          relatedConcepts: [
            "singleton-pattern",
            "dependency-injection",
            "hybrid-instrumentation",
          ],
        },
        {
          id: "otel-java-current-span",
          lines: [120, 121],
          action:
            "Retrieve current span created by auto-instrumentation for enrichment",
          reason:
            "Java agent auto-creates SERVER span for HTTP endpoint. Span.current() retrieves this active span for adding business attributes (user_id, order_amount). Enrichment turns generic HTTP span (GET /api/orders) into searchable business event (user=123, amount=$499.99). No need to manually create parent span—agent handles it.",
          contextLevel: "module",
          relatedConcepts: [
            "span-context",
            "attribute-enrichment",
            "auto-instrumentation-extension",
          ],
        },
        {
          id: "otel-java-trace-logging",
          lines: [131, 133],
          action:
            "Extract trace ID from span context and include in log messages",
          reason:
            "Trace ID links logs to distributed traces. During incident investigation, engineer searches logs for trace_id=abc123 (copied from Jaeger UI) and finds detailed error logs, stack traces, and database query logs associated with that failed order request. Bridges gap between trace visualization and detailed logging.",
          contextLevel: "system",
          relatedConcepts: [
            "log-trace-correlation",
            "incident-investigation",
            "observability-integration",
          ],
        },
        {
          id: "otel-java-exception-handling",
          lines: [146, 150],
          action:
            "Record business exception in span with semantic error status",
          reason:
            "recordException() captures exception type, message, and stack trace as span attributes. setStatus(ERROR, reason) marks span as failed with human-readable reason. Observability backends index error spans, enabling queries like 'show all InsufficientInventoryException traces'. Differentiates business errors (inventory) from technical errors (timeout).",
          contextLevel: "module",
          relatedConcepts: [
            "exception-tracking",
            "error-taxonomy",
            "distributed-debugging",
          ],
        },
        {
          id: "otel-java-custom-span",
          lines: [224, 229],
          action:
            "Create custom INTERNAL span for order transaction business logic",
          reason:
            "Auto-instrumentation creates HTTP and database spans, but not business logic spans. Custom span for create_order_transaction groups inventory + payment + persistence steps into single business operation. Enables queries like 'what's P99 latency of full order creation?' vs. 'what's P99 of just payment call?'. INTERNAL kind indicates in-process logic, not remote call.",
          contextLevel: "module",
          relatedConcepts: [
            "span-kind",
            "business-transaction-tracing",
            "custom-instrumentation",
          ],
        },
        {
          id: "otel-java-span-events",
          lines: [239, 240],
          action:
            "Add span events to mark completion of business workflow steps",
          reason:
            "Span events (inventory_reserved, payment_processed, order_persisted) create timeline within transaction span. Jaeger flame graph shows: inventory_reserved at T+200ms, payment_processed at T+550ms, order_persisted at T+650ms. Identifies bottleneck (payment took 350ms vs. inventory 200ms). Events preserve temporal ordering that attributes flatten.",
          contextLevel: "local",
          relatedConcepts: [
            "span-events",
            "workflow-tracing",
            "performance-profiling",
          ],
        },
        {
          id: "otel-java-resttemplate-propagation",
          lines: [289, 295],
          action:
            "Use RestTemplate for HTTP call (auto-instrumented with context propagation)",
          reason:
            "Java agent automatically wraps RestTemplate to create CLIENT span and inject W3C Trace Context headers (traceparent). Inventory-service (also instrumented) extracts headers and creates child span with same trace_id. Single trace now spans order-service → inventory-service. Without auto-instrumentation, would require 20+ lines of manual context injection code per HTTP call.",
          contextLevel: "system",
          relatedConcepts: [
            "auto-instrumentation",
            "context-propagation",
            "w3c-trace-context",
          ],
        },
        {
          id: "otel-java-micrometer-bridge",
          lines: [336, 340],
          action:
            "Use Micrometer Timer to track payment latency (bridged to OTel metrics)",
          reason:
            "Spring Boot ecosystem uses Micrometer for metrics. OTel Micrometer bridge exports Micrometer metrics as OTel metrics to same backend (Prometheus/OTLP). Enables using familiar Micrometer API while benefiting from OTel's vendor-neutral export. Timer automatically records histogram of payment latencies for P50/P95/P99 analysis.",
          contextLevel: "system",
          relatedConcepts: [
            "micrometer-bridge",
            "metric-compatibility",
            "histogram-metrics",
          ],
        },
        {
          id: "otel-java-kafka-propagation",
          lines: [388, 394],
          action:
            "Publish Kafka message with PRODUCER span and trace context in headers",
          reason:
            "Java agent auto-instruments Kafka producer to create PRODUCER span and inject trace context into Kafka message headers. Consumer service (also instrumented) extracts headers and creates CONSUMER span with same trace_id. Trace now spans: HTTP request → order-service → Kafka → consumer-service. Enables tracing asynchronous message flows, not just synchronous HTTP.",
          contextLevel: "system",
          relatedConcepts: [
            "async-tracing",
            "message-context-propagation",
            "kafka-instrumentation",
          ],
        },
      ],
      highlights: [
        {
          lines: [56, 78],
          label: "Java agent-based auto-instrumentation setup",
          sbvpDomain: "structure",
        },
        {
          lines: [120, 133],
          label: "Span enrichment and trace-log correlation",
          sbvpDomain: "behavior",
        },
        {
          lines: [224, 268],
          label: "Custom business transaction span with events",
          sbvpDomain: "behavior",
        },
        {
          lines: [336, 371],
          label: "Micrometer timer with distributed HTTP tracing",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservice application code (as SDK/agent)",
      "API Gateway (for request tracing entry point)",
      "Message Queue Consumers/Producers (Kafka, RabbitMQ)",
      "Background Job Workers (for async task tracing)",
      "Serverless Functions (AWS Lambda, Google Cloud Functions)",
    ],
    interactsWith: [
      "jaeger",
      "zipkin",
      "prometheus",
      "grafana",
      "datadog",
      "new-relic",
      "elasticsearch",
      "tempo",
    ],
    architecturalBoundaries: [
      "Service-to-service HTTP/gRPC calls (W3C Trace Context propagation)",
      "Database queries (SQL, NoSQL, cache layers)",
      "Message broker publish/subscribe (Kafka, RabbitMQ, SQS)",
      "External third-party API integrations (payment gateways, fraud detection)",
      "Frontend-to-backend requests (browser real user monitoring with OTel JS)",
    ],
  },

  implementations: [
    {
      id: "otel-js",
      name: "OpenTelemetry JavaScript",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Official OTel SDK for Node.js and browser environments. Supports auto-instrumentation for Express, Nest.js, HTTP, gRPC, databases (MongoDB, PostgreSQL, Redis), and AWS SDK. Browser SDK enables real user monitoring (RUM) with frontend trace collection. Exporters for OTLP, Jaeger, Zipkin, Prometheus.",
      links: {
        docs: "https://opentelemetry.io/docs/instrumentation/js/",
        github: "https://github.com/open-telemetry/opentelemetry-js",
        npm: "https://www.npmjs.com/package/@opentelemetry/sdk-node",
      },
      codeSnippet: `import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'my-service',
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();`,
    },
    {
      id: "otel-python",
      name: "OpenTelemetry Python",
      type: "library",
      languages: ["python"],
      description:
        "Official OTel SDK for Python with auto-instrumentation for Django, Flask, FastAPI, requests, httpx, SQLAlchemy, Redis, and Kafka. Supports both automatic (opentelemetry-instrument CLI) and manual instrumentation. Exporters for OTLP, Jaeger, Prometheus, and all major vendors.",
      links: {
        docs: "https://opentelemetry.io/docs/instrumentation/python/",
        github: "https://github.com/open-telemetry/opentelemetry-python",
      },
      codeSnippet: `# Automatic instrumentation via CLI
opentelemetry-instrument \\
    --traces_exporter otlp \\
    --metrics_exporter otlp \\
    --service_name my-service \\
    python app.py

# Or programmatic setup
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)`,
    },
    {
      id: "otel-java-agent",
      name: "OpenTelemetry Java Agent",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Zero-code auto-instrumentation via Java agent. Instruments Spring Boot, Servlet, JDBC, Hibernate, Kafka, gRPC, and 100+ libraries at bytecode level. Supports JVM languages (Java, Kotlin, Scala, Groovy). Configurable via environment variables or properties file. Production-ready with <5% overhead.",
      links: {
        docs: "https://opentelemetry.io/docs/instrumentation/java/automatic/",
        github:
          "https://github.com/open-telemetry/opentelemetry-java-instrumentation",
      },
      codeSnippet: `# Run with Java agent (zero code changes)
java -javaagent:opentelemetry-javaagent.jar \\
     -Dotel.service.name=my-service \\
     -Dotel.traces.exporter=otlp \\
     -Dotel.exporter.otlp.endpoint=http://localhost:4317 \\
     -jar myapp.jar`,
    },
    {
      id: "otel-go",
      name: "OpenTelemetry Go",
      type: "library",
      languages: ["go"],
      description:
        "Official OTel SDK for Go with manual instrumentation (no auto-instrumentation due to Go's static compilation). Provides instrumentation libraries for net/http, gRPC, database/sql, and popular frameworks (Gin, Echo). Lightweight with minimal overhead (<1% CPU). Exporters for OTLP, Jaeger, Prometheus.",
      links: {
        docs: "https://opentelemetry.io/docs/instrumentation/go/",
        github: "https://github.com/open-telemetry/opentelemetry-go",
      },
      codeSnippet: `import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/sdk/trace"
)

tp := trace.NewTracerProvider()
otel.SetTracerProvider(tp)

tracer := otel.Tracer("my-service")
ctx, span := tracer.Start(ctx, "operation")
defer span.End()`,
    },
    {
      id: "otel-dotnet",
      name: "OpenTelemetry .NET",
      type: "library",
      languages: ["csharp"],
      description:
        "Official OTel SDK for .NET and ASP.NET Core. Auto-instrumentation for ASP.NET Core, HttpClient, Entity Framework Core, SQL Client. Integrates with .NET diagnostics and ILogger for log correlation. Exporters for OTLP, Jaeger, Prometheus, Azure Monitor, and AWS X-Ray.",
      links: {
        docs: "https://opentelemetry.io/docs/instrumentation/net/",
        github: "https://github.com/open-telemetry/opentelemetry-dotnet",
      },
      codeSnippet: `using OpenTelemetry.Trace;

services.AddOpenTelemetry()
    .WithTracing(builder => builder
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter());`,
    },
    {
      id: "otel-collector",
      name: "OpenTelemetry Collector",
      type: "platform",
      languages: ["any"],
      description:
        "Vendor-agnostic telemetry aggregation and forwarding service. Receives OTLP data from applications, processes (batching, sampling, enrichment), and exports to multiple backends simultaneously (Jaeger + Datadog + S3). Enables tail-based sampling, data scrubbing, and protocol translation. Deployed as sidecar, gateway, or agent.",
      links: {
        docs: "https://opentelemetry.io/docs/collector/",
        github: "https://github.com/open-telemetry/opentelemetry-collector",
      },
      codeSnippet: `# collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:

processors:
  batch:
    timeout: 10s
  memory_limiter:
    limit_mib: 512

exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
  prometheus:
    endpoint: "0.0.0.0:8889"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/jaeger]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]`,
    },
    {
      id: "otel-jaeger",
      name: "Jaeger with OTel",
      type: "service",
      languages: ["any"],
      description:
        "Jaeger distributed tracing backend with native OTLP support (v1.35+). Receives traces via OTLP protocol from OTel SDKs/collectors. Provides trace storage (Cassandra, Elasticsearch, Kafka), query API, and UI for visualization. Supports sampling, service dependencies graph, and trace comparison.",
      links: {
        docs: "https://www.jaegertracing.io/docs/latest/opentelemetry/",
        github: "https://github.com/jaegertracing/jaeger",
      },
      codeSnippet: `# Jaeger all-in-one with OTLP receiver
docker run -d --name jaeger \\
  -e COLLECTOR_OTLP_ENABLED=true \\
  -p 16686:16686 \\
  -p 4317:4317 \\
  jaegertracing/all-in-one:latest`,
    },
    {
      id: "otel-datadog",
      name: "Datadog with OTel",
      type: "service",
      languages: ["any"],
      description:
        "Datadog APM with native OTel ingestion (OTLP endpoint). Accepts traces, metrics, and logs from OTel SDKs without vendor-specific libraries. Maps OTel semantic conventions to Datadog tags automatically. Enables migration from Datadog SDK to OTel while preserving all Datadog features (profiling, logs, infrastructure monitoring).",
      links: {
        docs: "https://docs.datadoghq.com/tracing/trace_collection/opentelemetry/",
      },
      codeSnippet: `// Send OTel to Datadog OTLP endpoint
const traceExporter = new OTLPTraceExporter({
  url: 'https://trace.agent.datadoghq.com/v0.7/traces',
  headers: {
    'DD-API-KEY': process.env.DD_API_KEY,
  },
});`,
    },
    {
      id: "otel-tempo",
      name: "Grafana Tempo with OTel",
      type: "service",
      languages: ["any"],
      description:
        "Grafana Tempo distributed tracing backend optimized for OTel. Cost-efficient trace storage (S3, GCS) with no indexing overhead. Native OTLP receiver and Jaeger/Zipkin compatibility. Integrates with Grafana for visualization and Loki for log correlation. Designed for high-volume traces (billions per day).",
      links: {
        docs: "https://grafana.com/docs/tempo/latest/configuration/",
        github: "https://github.com/grafana/tempo",
      },
      codeSnippet: `# tempo.yaml
distributor:
  receivers:
    otlp:
      protocols:
        grpc:
        http:

storage:
  trace:
    backend: s3
    s3:
      bucket: tempo-traces`,
    },
  ],

  usedInSystems: [
    {
      systemId: "uber",
      systemName: "Uber Ride-Hailing Platform",
      howUsed:
        "Uber migrated from proprietary distributed tracing (Jaeger with custom instrumentation) to OpenTelemetry across 1,000+ microservices written in Go, Java, Python, and Node.js. OTel auto-instrumentation reduced instrumentation code by 70% while adding metrics and logs alongside traces. The migration enabled unified observability: traces show request flows (user app → trip-service → dispatch-service → driver-app), metrics track SLIs (P95 dispatch latency), and logs provide detailed error context—all correlated via trace ID. OTel Collector deployed as sidecar in Kubernetes aggregates telemetry, applies tail-based sampling (keep all error traces, sample 1% of successful traces), and exports to internal Jaeger and Prometheus. Context propagation across synchronous (gRPC) and asynchronous (Kafka) calls creates end-to-end traces spanning 15+ services for single ride request. Pattern composition: OTel + W3C Trace Context + Tail-based Sampling + Service Mesh (Envoy sidecar). Rationale: Proprietary instrumentation locked Uber into single backend; OTel vendor neutrality enables multi-backend strategy (Jaeger for traces, Prometheus for metrics, Elasticsearch for logs). Impact: Reduced mean time to detection (MTTD) by 60% via correlated signals (trace shows slow span, metric shows spike, log shows root cause). Prevented $2M+ in lost revenue by catching payment gateway latency regression in staging via OTel P99 alerts before production deploy. Enabled cost optimization: tail-based sampling cut trace storage costs by 80% ($500K/year savings) while preserving 100% of error traces.",
      source:
        "https://www.uber.com/blog/distributed-tracing-in-uber-s-mobile-app/",
    },
    {
      systemId: "microsoft-azure",
      systemName: "Microsoft Azure Monitor",
      howUsed:
        "Microsoft Azure Monitor (Application Insights) added native OpenTelemetry support in 2021, enabling customers to instrument applications with OTel SDKs instead of vendor-specific libraries. Azure customers using OTel can export to Application Insights while simultaneously sending telemetry to Jaeger, Datadog, or on-premises Prometheus—avoiding vendor lock-in. Azure SDK libraries (Storage, Cosmos DB, Service Bus) ship with built-in OTel instrumentation, automatically creating spans for Azure service calls. Azure Functions supports OTel auto-instrumentation for serverless tracing across HTTP triggers, blob processing, and queue consumers. Pattern composition: OTel + Azure Monitor Exporter + Distributed Tracing + Cloud-Native Observability. Rationale: Customers demanded vendor-neutral observability to avoid lock-in; OTel became industry standard. Microsoft contributed to OTel specification and built first-class integration rather than competing with proprietary protocol. Impact: 50% faster OTel trace ingestion compared to legacy protocol; reduced instrumentation code for Azure customers by 80%; enabled hybrid cloud observability (Azure + AWS traces in single Jaeger instance). Customer case study: Contoso migrated 200 microservices from proprietary instrumentation to OTel in 3 months, reducing observability costs by 40% via multi-backend strategy (Application Insights for prod, Jaeger for dev/staging).",
      source:
        "https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-overview",
    },
    {
      systemId: "shopify",
      systemName: "Shopify E-commerce Platform",
      howUsed:
        "Shopify adopted OpenTelemetry to unify observability across polyglot stack: Ruby (Storefront), Go (Payments), Node.js (Admin), Rust (Infrastructure). Before OTel, each language had different instrumentation libraries (Datadog for Ruby, Jaeger for Go, X-Ray for Node.js), creating fragmented observability. OTel standardized instrumentation: all services now emit OTLP to OTel Collector, which exports to Datadog (production monitoring), Jaeger (debugging), and S3 (compliance retention). Auto-instrumentation covers 90% of telemetry (HTTP, database, Redis, Kafka); custom spans track business logic (checkout flow, inventory reservation, fraud checks). During Black Friday Cyber Monday (BFCM), OTel traces enabled real-time incident response: when checkout P95 latency spiked from 300ms to 4s, trace analysis immediately identified bottleneck (payment-gateway span showed 3.5s latency). Pattern composition: OTel + Multi-Backend Export + Custom Business Spans + W3C Trace Context. Rationale: Vendor lock-in risk ($5M+ annual observability spend); polyglot stack required unified instrumentation; regulatory compliance demanded long-term trace retention (S3 export). Impact: MTTR reduced 75% during BFCM via correlated traces/metrics/logs; prevented $10M+ revenue loss by catching Kafka consumer lag spike (indicated by missing spans in traces) before order processing delay impacted customers; enabled gradual backend migration (Datadog → Grafana Cloud) with zero instrumentation changes via OTel abstraction.",
    },
    {
      systemId: "datadog-otel",
      systemName: "Datadog APM",
      howUsed:
        "Datadog, a commercial observability platform, added native OpenTelemetry support to compete with vendor-neutral tools while preventing customer churn. Datadog Agent now includes OTLP receiver, ingesting OTel traces at 50% higher throughput (100K spans/sec) compared to proprietary Datadog tracer protocol. Customers can instrument with OTel SDKs while preserving all Datadog features: continuous profiling, log correlation, security monitoring, and infrastructure metrics. Datadog maps OTel semantic conventions (http.status_code, db.statement) to Datadog tags automatically, enabling seamless querying. For customers migrating from OTel to Datadog, Datadog provides Datadog Exporter for OTel SDKs—enabling single-line configuration change to route telemetry to Datadog. Pattern composition: OTel + Datadog Exporter + Semantic Conventions + Multi-Signal Correlation. Rationale: OTel became de facto industry standard; customers demanded vendor neutrality; Datadog chose integration over competition to retain market share. Impact: Reduced customer churn by 30% (customers no longer locked into Datadog SDK); increased OTel adoption by 200% among Datadog customers (easier onboarding); enabled hybrid observability (Datadog + on-prem Prometheus for cost optimization). Performance: OTel ingestion 50% faster than legacy protocol; reduced agent CPU overhead by 15%; supports 10M spans/sec in production deployments.",
      source: "https://www.datadoghq.com/blog/opentelemetry-instrumentation/",
    },
    {
      systemId: "new-relic-otel",
      systemName: "New Relic",
      howUsed:
        "New Relic, an observability SaaS platform, invested heavily in OpenTelemetry to prevent customer lock-in and align with industry standards. New Relic contributed OTLP exporters and auto-instrumentation libraries to OTel project, then built native OTLP ingestion in New Relic backend. Customers using OTel reduced instrumentation code by 60% compared to proprietary New Relic agents while gaining multi-backend flexibility (export to New Relic + on-prem Jaeger simultaneously). New Relic One UI displays OTel traces with same fidelity as proprietary traces, including distributed tracing, service maps, and error tracking. For enterprises with compliance requirements, OTel enables sending sensitive data to on-prem backends while routing non-sensitive telemetry to New Relic cloud. Pattern composition: OTel + OTLP Exporter + Multi-Backend Strategy + Data Governance. Rationale: Customer demand for vendor neutrality (avoid $1M+ lock-in); competitive threat from open-source tools (Jaeger, Grafana); regulatory compliance (GDPR, HIPAA) requiring data sovereignty. Impact: Customer adoption of OTel increased 300% year-over-year; reduced customer churn by 25%; enabled new use case (hybrid cloud observability: AWS + Azure + on-prem in single trace). Performance: OTLP ingestion supports 1M events/sec per account; reduced data ingestion latency by 40% vs. legacy protocol. Case study: Fortune 500 financial services company migrated 500 microservices to OTel, routing PII data to on-prem Elasticsearch and performance data to New Relic, achieving compliance while maintaining cloud observability.",
      source:
        "https://newrelic.com/blog/best-practices/opentelemetry-best-practices",
    },
  ],

  philosophy: {
    coreProblem:
      "Distributed systems composed of polyglot microservices lack unified observability. Proprietary instrumentation creates vendor lock-in, making it expensive to switch backends. Manual correlation of traces, metrics, and logs across services is time-consuming during incidents, increasing mean time to resolution (MTTR).",
    designPrinciple:
      "Provide vendor-neutral, standardized APIs for telemetry collection that work across languages and backends. Enable automatic instrumentation to reduce developer burden while supporting custom spans for business context. Use W3C Trace Context for interoperable cross-service tracing.",
    historicalContext:
      "OpenTelemetry emerged in 2019 from merger of OpenTracing (focused on traces) and OpenCensus (traces + metrics), backed by Google, Microsoft, and CNCF. Goal: create single observability standard to end fragmentation. Became CNCF graduated project in 2024, with 1,000+ contributors and adoption by Uber, Shopify, Microsoft, Datadog.",
    alternativesRejected: [
      "Proprietary APM SDKs (Datadog, New Relic) - vendor lock-in, expensive to migrate",
      "Manual logging only - no distributed tracing, poor correlation, slow incident response",
      "Per-backend instrumentation - 5x code overhead for multi-backend strategies",
      "OpenTracing alone - no metrics or logs, trace-only observability insufficient",
    ],
    mentalModel:
      "OpenTelemetry is like a universal power adapter for observability. Just as a universal adapter lets you plug any device into any outlet worldwide, OTel lets you instrument once and export to any observability backend (Jaeger, Datadog, Prometheus, Grafana). The adapter (OTel SDK) handles voltage conversion (protocol translation) transparently, so your device (application) doesn't need to know which outlet (backend) it's connected to.",
  },

  visualization: {
    staticDiagram: `graph TB
    App[Application Code] --> SDK[OTel SDK]
    SDK --> Auto[Auto-Instrumentation]
    SDK --> Custom[Custom Spans]

    Auto --> Traces[Traces]
    Auto --> Metrics[Metrics]
    Auto --> Logs[Logs]
    Custom --> Traces

    Traces --> Processor[Span Processor]
    Metrics --> MetricProcessor[Metric Processor]
    Logs --> LogProcessor[Log Processor]

    Processor --> Exporter[OTLP Exporter]
    MetricProcessor --> Exporter
    LogProcessor --> Exporter

    Exporter --> Collector[OTel Collector]
    Collector --> Jaeger[(Jaeger)]
    Collector --> Prom[(Prometheus)]
    Collector --> Datadog[(Datadog)]

    style App fill:#e1f5e1
    style Traces fill:#fff4e1
    style Exporter fill:#e1e8f5
    style Collector fill:#f5e1f5`,
    realWorldAnalogy:
      "OpenTelemetry is like a flight tracking system for your code. Just as airlines track every flight across multiple airports with standardized transponders (W3C Trace Context), OTel tracks every request across microservices. The departure airport (first service) creates a flight number (trace ID) that follows the plane through every layover (service hop) until arrival. Air traffic control (Jaeger/Datadog) watches all flights in real-time, and when a flight is delayed (slow request), controllers see exactly which airport caused the delay (which service's span was slow).",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "During Black Friday, checkout latency spikes from 200ms to 3s. OTel distributed trace shows payment-gateway span took 2.5s (normally 100ms). Team scales payment service and incident resolves in 5 minutes instead of 45 minutes with manual log correlation.",
        patternRole:
          "Provides end-to-end visibility across 12 microservices (frontend → cart → inventory → payment → shipping), enabling rapid root cause identification via trace analysis",
        companies: ["Shopify", "Amazon", "Etsy"],
      },
      {
        domain: "Financial Services",
        scenario:
          "Bank's loan approval system processes 10K applications/day across 8 services (application → credit-check → fraud-detection → underwriting → approval). Regulatory compliance requires audit trail of all processing steps. OTel traces provide tamper-proof audit log with exact timestamps and decisions, exported to compliance data lake (S3).",
        patternRole:
          "Unified observability for operational monitoring (Datadog) and compliance retention (S3), with trace IDs linking to customer support tickets for dispute resolution",
        companies: ["JP Morgan Chase", "Capital One", "Wells Fargo"],
      },
      {
        domain: "SaaS Platform",
        scenario:
          "Multi-tenant SaaS app serves 10,000 customers. Premium customers report slow dashboard loads (5s vs. 1s). OTel traces filtered by tenant_id attribute show premium customers' database queries hitting slow secondary index. Team adds index, reducing latency to 800ms. Prevented churn of 50 premium accounts ($500K ARR).",
        patternRole:
          "Business context via span attributes (tenant_id, subscription_tier) enables per-customer performance analysis and proactive issue detection before complaints",
        companies: ["Salesforce", "Zendesk", "Atlassian"],
      },
    ],
  },

  tags: [
    "observability",
    "distributed-tracing",
    "metrics",
    "logging",
    "monitoring",
    "instrumentation",
    "w3c-trace-context",
    "vendor-neutral",
    "microservices",
    "cncf",
  ],
  difficulty: "intermediate",
};
