import type { Pattern } from "../schema";

export const jaeger: Pattern = {
  id: "jaeger",
  slug: "jaeger",
  corpusPath: "👁️ OBSERVABILITY → 🔗 Distributed Tracing → 🔍 Jaeger",

  hierarchy: {
    quality: "observability",
    strategy: "Distributed Tracing",
    family: "Tracing Platforms",
    level: 4,
  },

  concept: {
    name: "Jaeger",
    emoji: "🔍",
    tagline: "See through the microservices maze",
    definition:
      "Jaeger is an open-source distributed tracing platform originally developed by Uber and now part of the Cloud Native Computing Foundation (CNCF). Inspired by Google's Dapper and Zipkin, Jaeger helps monitor and troubleshoot transactions across microservices architectures by tracking request flows through the entire system. At its core, Jaeger creates a trace—a logical representation of a single request's journey—composed of multiple spans that represent individual operations within that trace. Each span captures timing data, operation names, service identifiers, and custom tags that provide context about what happened. Jaeger's architecture includes client libraries that instrument applications, agents that batch and forward spans, collectors that validate and store traces, and a query service with UI for visualization. The system supports multiple sampling strategies (constant, probabilistic, rate limiting, adaptive) to balance observability with performance overhead, typically achieving less than 0.01% latency impact at 0.1% sampling rates. Context propagation—passing trace and span IDs across service boundaries via HTTP headers or message metadata—enables Jaeger to stitch together distributed operations into cohesive traces, revealing bottlenecks, cascading failures, and dependencies that would otherwise be invisible in microservices systems.",
    problemSolved:
      "In distributed microservices architectures, understanding system behavior becomes exponentially harder as service count increases. A single user request might traverse dozens of services, making it nearly impossible to identify performance bottlenecks, diagnose failures, or understand dependencies using traditional logging or metrics alone. Logs are service-local and don't connect related operations across boundaries; metrics aggregate data and lose individual request context. When a request fails or performs slowly, teams face the daunting task of correlating timestamps across hundreds of log files from different services. Jaeger solves this by providing end-to-end request visibility through distributed tracing. It assigns each request a unique trace ID that propagates across all service calls, capturing timing data for every operation. This enables engineers to visualize the complete request path, identify which service caused a delay, understand dependency relationships, and perform root cause analysis in minutes rather than hours. Additionally, Jaeger's sampling strategies prevent the observability system itself from becoming a performance bottleneck.",
    tradeoffs: {
      pros: [
        "End-to-end request visibility across microservices",
        "Root cause analysis through dependency graphs and span details",
        "Minimal performance overhead with adaptive sampling (0.01% at 0.1% sampling)",
        "Native support for OpenTelemetry and OpenTracing standards",
        "Distributed context propagation enables correlation across service boundaries",
      ],
      cons: [
        "Requires instrumentation of all services to achieve full visibility",
        "Storage costs can be significant at high sampling rates or request volumes",
        "Learning curve for teams new to distributed tracing concepts",
        "Sampling may miss rare but critical edge cases in production",
        "Complex setup and operational overhead for clustered deployments",
      ],
    },
    relatedPatterns: [
      "zipkin",
      "tempo",
      "x-ray",
      "opentelemetry",
      "prometheus",
      "graphite",
    ],
  },

  structure: {
    participants: [
      {
        name: "Jaeger Client",
        role: "Instrumentation Library",
        responsibilities: [
          "Create and manage trace and span lifecycle",
          "Inject trace context into outgoing requests (headers, metadata)",
          "Extract trace context from incoming requests",
          "Buffer spans in memory before sending to agent",
          "Apply configured sampling strategy to determine which traces to record",
        ],
      },
      {
        name: "Jaeger Agent",
        role: "Local Sidecar Daemon",
        responsibilities: [
          "Receive spans from clients via UDP (low overhead)",
          "Batch spans to reduce network overhead",
          "Forward batched spans to collectors",
          "Provide service discovery for collectors",
        ],
      },
      {
        name: "Jaeger Collector",
        role: "Trace Processing Pipeline",
        responsibilities: [
          "Receive spans from agents",
          "Validate and normalize span data",
          "Run processing pipelines (sampling, enrichment)",
          "Write spans to configured storage backend (Cassandra, Elasticsearch, Kafka)",
          "Provide health checks and metrics",
        ],
      },
      {
        name: "Storage Backend",
        role: "Persistent Span Repository",
        responsibilities: [
          "Store trace and span data with efficient indexing",
          "Support queries by trace ID, service, operation, tags, and time range",
          "Handle high write throughput from collectors",
          "Maintain data retention policies",
        ],
      },
      {
        name: "Jaeger Query Service",
        role: "API and UI Layer",
        responsibilities: [
          "Provide REST API for trace queries",
          "Serve web UI for trace visualization",
          "Query storage backend efficiently",
          "Aggregate and format trace data for presentation",
        ],
      },
    ],
    diagram: `graph TB
    App[Application with Jaeger Client]
    Agent[Jaeger Agent - UDP Listener]
    Collector[Jaeger Collector]
    Storage[(Storage Backend<br/>Cassandra/ES/Kafka)]
    Query[Query Service + UI]
    User[User/Engineer]

    App -->|UDP spans| Agent
    Agent -->|Batched spans<br/>gRPC/HTTP| Collector
    Collector -->|Write spans| Storage
    Query -->|Read traces| Storage
    User -->|View traces| Query

    style App fill:#e3f2fd
    style Agent fill:#fff3e0
    style Collector fill:#f3e5f5
    style Storage fill:#e8f5e9
    style Query fill:#fce4ec`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Start Trace",
        description:
          "When a request enters the system, the Jaeger client creates a new trace with a unique trace ID and initial span representing the operation",
      },
      {
        step: 2,
        actor: "Jaeger Client",
        action: "Create Child Spans",
        description:
          "As the application makes downstream calls (HTTP, gRPC, database), the client creates child spans, each with its own span ID but sharing the parent trace ID",
      },
      {
        step: 3,
        actor: "Jaeger Client",
        action: "Propagate Context",
        description:
          "The client injects trace context (trace ID, span ID, sampling decision) into outgoing request headers or message metadata so downstream services can continue the trace",
      },
      {
        step: 4,
        actor: "Jaeger Client",
        action: "Extract Context",
        description:
          "Receiving services extract trace context from incoming requests and create their own spans as children of the parent span",
      },
      {
        step: 5,
        actor: "Jaeger Client",
        action: "Apply Sampling",
        description:
          "Client determines whether to record the trace based on sampling strategy (constant, probabilistic, rate limiting, or adaptive)",
      },
      {
        step: 6,
        actor: "Jaeger Client",
        action: "Send Spans to Agent",
        description:
          "When spans complete, the client sends them to the local Jaeger agent via UDP (low latency, fire-and-forget)",
      },
      {
        step: 7,
        actor: "Jaeger Agent",
        action: "Batch and Forward",
        description:
          "Agent collects spans from all local applications, batches them to reduce network overhead, and forwards to collectors via gRPC",
      },
      {
        step: 8,
        actor: "Jaeger Collector",
        action: "Process and Store",
        description:
          "Collector validates spans, runs processing pipelines, and writes to configured storage backend with efficient indexing",
      },
      {
        step: 9,
        actor: "Engineer",
        action: "Query and Visualize",
        description:
          "Engineers use the Query Service UI to search for traces by service, operation, tags, or trace ID, then visualize the complete request flow",
      },
    ],
    invariants: [
      "Trace ID must be globally unique and propagate to all spans in the trace",
      "Parent-child span relationships must form a valid directed acyclic graph (DAG)",
      "Span start and finish times must be monotonic (finish >= start)",
      "Context propagation must preserve trace ID across service boundaries",
      "Sampling decision (sampled or not) must be consistent for entire trace",
      "Child spans cannot outlive their parent span's duration",
    ],
  },

  codeExamples: [
    {
      id: "jaeger-typescript-express",
      language: "typescript",
      title: "Jaeger Tracing in Node.js Express Microservice",
      description:
        "Production-grade implementation with Jaeger client, context propagation, custom tags, and baggage for cross-service state",
      code: `import express, { Request, Response, NextFunction } from 'express';
import { initTracer, JaegerTracer, TracingConfig, TracingOptions } from 'jaeger-client';
import { FORMAT_HTTP_HEADERS, Tags, Span } from 'opentracing';
import axios from 'axios';

// ============================================================================
// Jaeger Tracer Initialization
// ============================================================================

function createJaegerTracer(serviceName: string): JaegerTracer {
  // Configure sampling strategy
  const config: TracingConfig = {
    serviceName,
    sampler: {
      type: 'probabilistic', // Sample 10% of requests
      param: 0.1,
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: Number(process.env.JAEGER_AGENT_PORT) || 6831,
      flushIntervalMs: 1000, // Flush spans every 1s
    },
  };

  const options: TracingOptions = {
    logger: {
      info: (msg: string) => console.log(\`[Jaeger] \${msg}\`),
      error: (msg: string) => console.error(\`[Jaeger] \${msg}\`),
    },
    tags: {
      // Service-level tags visible on all traces
      'deployment.environment': process.env.NODE_ENV || 'development',
      'service.version': process.env.SERVICE_VERSION || '1.0.0',
    },
  };

  return initTracer(config, options);
}

const tracer = createJaegerTracer('user-service');

// ============================================================================
// Express Middleware for Automatic Tracing
// ============================================================================

/**
 * Middleware that creates a span for every incoming HTTP request.
 * Extracts parent span context from headers if present (continuing trace from upstream service).
 */
function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract parent span context from HTTP headers (if this is a downstream call)
  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);

  // Create span for this HTTP request
  const span = tracer.startSpan('http_request', {
    childOf: parentSpanContext || undefined,
    tags: {
      [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
      [Tags.HTTP_METHOD]: req.method,
      [Tags.HTTP_URL]: req.originalUrl,
      'http.route': req.route?.path,
    },
  });

  // Attach span to request for use in handlers
  (req as any).span = span;

  // Capture response details when request completes
  res.on('finish', () => {
    span.setTag(Tags.HTTP_STATUS_CODE, res.statusCode);

    if (res.statusCode >= 500) {
      span.setTag(Tags.ERROR, true);
      span.log({
        event: 'error',
        'error.kind': 'InternalServerError',
        message: 'Server error occurred',
      });
    }

    span.finish();
  });

  next();
}

// ============================================================================
// Service Logic with Manual Span Creation
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Fetch user from database with tracing.
 * Creates child span to track database operation timing.
 */
async function fetchUserFromDB(userId: string, parentSpan: Span): Promise<User | null> {
  // Create child span for database operation
  const dbSpan = tracer.startSpan('db.query.users.findById', {
    childOf: parentSpan,
    tags: {
      [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
      [Tags.DB_TYPE]: 'postgresql',
      [Tags.DB_INSTANCE]: 'users_db',
      [Tags.DB_STATEMENT]: 'SELECT * FROM users WHERE id = $1',
      'db.user_id': userId,
    },
  });

  try {
    // Simulate database query (replace with actual DB call)
    await new Promise(resolve => setTimeout(resolve, 50));

    const user: User = {
      id: userId,
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    // Add result metadata to span
    dbSpan.setTag('db.rows_returned', 1);
    dbSpan.log({
      event: 'query_complete',
      rows: 1,
    });

    return user;
  } catch (error) {
    // Record error in span
    dbSpan.setTag(Tags.ERROR, true);
    dbSpan.log({
      event: 'error',
      'error.object': error,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  } finally {
    dbSpan.finish();
  }
}

/**
 * Enrich user data by calling downstream service with trace context propagation.
 */
async function enrichUserWithPreferences(
  user: User,
  parentSpan: Span
): Promise<User & { preferences: any }> {
  const httpSpan = tracer.startSpan('http.call.preferences-service', {
    childOf: parentSpan,
    tags: {
      [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
      [Tags.HTTP_METHOD]: 'GET',
      [Tags.HTTP_URL]: \`http://preferences-service/api/preferences/\${user.id}\`,
      'peer.service': 'preferences-service',
    },
  });

  try {
    // Inject trace context into HTTP headers for downstream service
    const headers: Record<string, string> = {};
    tracer.inject(httpSpan.context(), FORMAT_HTTP_HEADERS, headers);

    // Add baggage - cross-service contextual data that propagates to all downstream spans
    httpSpan.setBaggageItem('user.id', user.id);
    httpSpan.setBaggageItem('user.tier', 'premium'); // Business context propagation

    const response = await axios.get(
      \`http://preferences-service/api/preferences/\${user.id}\`,
      { headers, timeout: 3000 }
    );

    httpSpan.setTag(Tags.HTTP_STATUS_CODE, response.status);
    httpSpan.log({
      event: 'response_received',
      'response.size': JSON.stringify(response.data).length,
    });

    return { ...user, preferences: response.data };
  } catch (error) {
    httpSpan.setTag(Tags.ERROR, true);
    httpSpan.setTag(Tags.HTTP_STATUS_CODE, (error as any).response?.status || 0);
    httpSpan.log({
      event: 'error',
      'error.kind': 'ServiceCallFailure',
      message: (error as Error).message,
    });

    // Return user without preferences on failure (graceful degradation)
    return { ...user, preferences: null };
  } finally {
    httpSpan.finish();
  }
}

// ============================================================================
// Express Application Setup
// ============================================================================

const app = express();

// Apply tracing middleware to all routes
app.use(tracingMiddleware);

/**
 * GET /api/users/:id
 * Fetch user with full distributed tracing across services
 */
app.get('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const span: Span = (req as any).span;

  // Add custom business tags to span
  span.setTag('user.id', id);
  span.setTag('endpoint', 'getUserById');

  try {
    // Step 1: Fetch from database (creates child span)
    span.log({ event: 'fetch_user_start', userId: id });
    const user = await fetchUserFromDB(id, span);

    if (!user) {
      span.setTag('user.found', false);
      span.log({ event: 'user_not_found', userId: id });
      return res.status(404).json({ error: 'User not found' });
    }

    span.setTag('user.found', true);

    // Step 2: Enrich with preferences (creates child span with downstream call)
    span.log({ event: 'enrich_preferences_start' });
    const enrichedUser = await enrichUserWithPreferences(user, span);

    span.log({ event: 'request_complete', success: true });
    res.json(enrichedUser);
  } catch (error) {
    span.setTag(Tags.ERROR, true);
    span.log({
      event: 'request_failed',
      'error.message': (error as Error).message,
    });

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint (not traced to reduce noise)
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');

  // Close tracer to flush remaining spans
  tracer.close(() => {
    console.log('Jaeger tracer closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`User service listening on port \${PORT}\`);
  console.log(\`Jaeger agent: \${process.env.JAEGER_AGENT_HOST || 'localhost'}:6831\`);
});

export { app, tracer };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Express microservice with end-to-end Jaeger tracing, context propagation, and multi-service coordination",
        prerequisites: [
          "Node.js and Express",
          "OpenTracing specification",
          "HTTP headers and middleware",
          "Distributed systems concepts",
        ],
        systemPosition:
          "Application-level instrumentation within microservice architecture, sending traces to Jaeger agent sidecar",
      },
      annotations: [
        {
          id: "jaeger-tracer-init",
          lines: [10, 38],
          action:
            "Initialize Jaeger tracer with sampling strategy and reporter config",
          reason:
            "Tracer initialization sets service identity and configures how spans are sampled and sent to agents. Probabilistic sampling (10%) balances observability with performance—capturing enough traces for analysis without overwhelming the system.",
          contextLevel: "system",
          relatedConcepts: ["sampling", "service-discovery", "configuration"],
        },
        {
          id: "jaeger-middleware",
          lines: [47, 82],
          action:
            "Middleware extracts parent context and creates span for each HTTP request",
          reason:
            "Automatic instrumentation at middleware level ensures all requests are traced without manual span creation in every handler. Extracting parent context enables trace continuity when this service is called by upstream services.",
          contextLevel: "module",
          relatedConcepts: ["middleware", "context-propagation", "automation"],
        },
        {
          id: "jaeger-child-span-db",
          lines: [97, 116],
          action: "Create child span for database operation with detailed tags",
          reason:
            "Child spans enable fine-grained timing analysis of specific operations. Database tags (query, instance, statement) provide crucial context for performance debugging—identifying slow queries is impossible with request-level spans alone.",
          contextLevel: "local",
          relatedConcepts: ["span-hierarchy", "tagging", "database-tracing"],
        },
        {
          id: "jaeger-error-handling",
          lines: [132, 141],
          action: "Record error details in span with Tags.ERROR and span.log()",
          reason:
            "Explicit error tagging makes failed traces easily searchable in Jaeger UI. Logging error details (message, stack) provides debugging context without requiring log aggregation—everything needed for root cause analysis is in the trace.",
          contextLevel: "local",
          relatedConcepts: ["error-tracking", "observability"],
        },
        {
          id: "jaeger-context-injection",
          lines: [158, 161],
          action:
            "Inject trace context into HTTP headers for downstream service call",
          reason:
            "Context injection is the mechanism that enables distributed tracing. Without injecting trace/span IDs into outgoing request headers, the downstream service would start a new trace instead of continuing this one—breaking the trace chain.",
          contextLevel: "system",
          relatedConcepts: [
            "context-propagation",
            "distributed-tracing",
            "w3c-trace-context",
          ],
        },
        {
          id: "jaeger-baggage",
          lines: [164, 165],
          action: "Set baggage items for cross-service contextual data",
          reason:
            "Baggage propagates business context (user ID, tenant, feature flags) to all downstream services without explicit parameter passing. This enables context-aware logging, metrics, and decision-making in called services that don't have direct access to the original request.",
          contextLevel: "system",
          relatedConcepts: ["baggage", "context-propagation", "business-logic"],
        },
        {
          id: "jaeger-graceful-degradation",
          lines: [183, 185],
          action:
            "Return partial data on downstream failure instead of propagating error",
          reason:
            "Tracing enables observability of graceful degradation strategies. The span records the error, but the application returns usable data (user without preferences) rather than failing entirely—balancing user experience with system reliability.",
          contextLevel: "module",
          relatedConcepts: [
            "graceful-degradation",
            "fault-tolerance",
            "partial-failure",
          ],
        },
        {
          id: "jaeger-span-logs",
          lines: [214, 220],
          action: "Add structured logs to span at key checkpoints",
          reason:
            "Span logs create a timeline of events within the operation's duration. These complement tags (static metadata) with timestamped events, making it easy to see exactly when the user lookup started, when enrichment began, and when the request completed.",
          contextLevel: "local",
          relatedConcepts: ["structured-logging", "span-logs", "timeline"],
        },
        {
          id: "jaeger-tracer-close",
          lines: [246, 250],
          action:
            "Close tracer on SIGTERM to flush remaining spans before shutdown",
          reason:
            "Spans are buffered for performance. Without explicit close, the last batch of spans would be lost on shutdown. Graceful shutdown ensures observability data is complete, critical for debugging deployments or crashes.",
          contextLevel: "system",
          relatedConcepts: [
            "graceful-shutdown",
            "buffering",
            "data-consistency",
          ],
        },
      ],
      highlights: [
        {
          lines: [10, 38],
          label: "Tracer initialization with sampling config",
          sbvpDomain: "structure",
        },
        {
          lines: [47, 82],
          label: "Automatic request tracing middleware",
          sbvpDomain: "behavior",
        },
        {
          lines: [158, 178],
          label: "Context injection and propagation",
          sbvpDomain: "structure",
        },
        {
          lines: [132, 141],
          label: "Error recording and observability",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "jaeger-python-fastapi",
      language: "python",
      title: "Jaeger Tracing in Python FastAPI Service",
      description:
        "FastAPI microservice with jaeger-client, async span management, dependency injection, and trace-to-log correlation",
      code: `from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import httpx
from jaeger_client import Config, Tracer, SpanContext
from jaeger_client.span import Span
from opentracing.ext import tags
from opentracing.propagation import Format
from typing import Optional, Dict, Any
import asyncio
import logging
import time
import os

# ============================================================================
# Logging Configuration with Trace Correlation
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] trace_id=%(trace_id)s span_id=%(span_id)s - %(message)s'
)

logger = logging.getLogger(__name__)

class TraceContextFilter(logging.Filter):
    """Inject trace and span IDs into log records for correlation"""
    def filter(self, record):
        # Will be set by context manager in request handling
        record.trace_id = getattr(record, 'trace_id', 'none')
        record.span_id = getattr(record, 'span_id', 'none')
        return True

logger.addFilter(TraceContextFilter())

# ============================================================================
# Jaeger Tracer Configuration
# ============================================================================

def init_jaeger_tracer(service_name: str) -> Tracer:
    """
    Initialize Jaeger tracer with configuration from environment.
    Supports multiple sampling strategies for different environments.
    """
    config = Config(
        config={
            'sampler': {
                # Use rate limiting sampler in production (max 10 traces/sec)
                # This prevents trace storms during traffic spikes
                'type': os.getenv('JAEGER_SAMPLER_TYPE', 'rate_limiting'),
                'param': float(os.getenv('JAEGER_SAMPLER_PARAM', '10')),
            },
            'logging': True,
            'reporter_batch_size': 10,  # Send spans in batches of 10
            'reporter_flush_interval': 1.0,  # Flush every 1 second
            'local_agent': {
                'reporting_host': os.getenv('JAEGER_AGENT_HOST', 'localhost'),
                'reporting_port': int(os.getenv('JAEGER_AGENT_PORT', '6831')),
            },
        },
        service_name=service_name,
        validate=True,
        tags={
            'deployment.environment': os.getenv('ENVIRONMENT', 'development'),
            'service.version': os.getenv('SERVICE_VERSION', '1.0.0'),
            'hostname': os.uname().nodename,
        }
    )

    return config.initialize_tracer()

tracer = init_jaeger_tracer('order-service')

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(title="Order Service", version="1.0.0")

# ============================================================================
# Dependency Injection for Request Span
# ============================================================================

async def get_request_span(request: Request) -> Span:
    """
    FastAPI dependency that provides the current request span.
    Enables clean span passing without global state or request attributes.
    """
    return request.state.span

# ============================================================================
# Middleware for Automatic Tracing
# ============================================================================

@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    """
    Middleware that creates a span for every HTTP request.
    Extracts parent span context from headers to continue distributed traces.
    """
    # Extract parent span context (if this is a downstream call)
    carrier = {}
    for key, value in request.headers.items():
        carrier[key] = value

    parent_ctx = tracer.extract(Format.HTTP_HEADERS, carrier)

    # Start span for this request
    span = tracer.start_span(
        operation_name=f"{request.method} {request.url.path}",
        child_of=parent_ctx,
        tags={
            tags.SPAN_KIND: tags.SPAN_KIND_RPC_SERVER,
            tags.HTTP_METHOD: request.method,
            tags.HTTP_URL: str(request.url),
            tags.COMPONENT: 'fastapi',
        }
    )

    # Store span in request state for handlers
    request.state.span = span

    # Add trace context to logging
    span_context = span.context
    log_extra = {
        'trace_id': f"{span_context.trace_id:x}" if span_context else 'none',
        'span_id': f"{span_context.span_id:x}" if span_context else 'none',
    }

    try:
        response = await call_next(request)

        span.set_tag(tags.HTTP_STATUS_CODE, response.status_code)

        if response.status_code >= 500:
            span.set_tag(tags.ERROR, True)
            span.log_kv({
                'event': 'error',
                'error.kind': 'ServerError',
                'http.status_code': response.status_code,
            })

        return response
    except Exception as e:
        span.set_tag(tags.ERROR, True)
        span.log_kv({
            'event': 'exception',
            'error.object': str(e),
            'error.kind': type(e).__name__,
            'message': str(e),
        })
        logger.error(f"Request failed: {e}", extra=log_extra)
        raise
    finally:
        span.finish()

# ============================================================================
# Database Access with Tracing
# ============================================================================

class OrderRepository:
    """Repository pattern with integrated tracing for database operations"""

    async def find_order_by_id(self, order_id: str, parent_span: Span) -> Optional[Dict[str, Any]]:
        """
        Fetch order from database with detailed span tracking.
        In production, replace with actual database client (asyncpg, motor, etc.)
        """
        span = tracer.start_span(
            operation_name='db.postgresql.query',
            child_of=parent_span,
            tags={
                tags.SPAN_KIND: tags.SPAN_KIND_RPC_CLIENT,
                tags.DATABASE_TYPE: 'postgresql',
                tags.DATABASE_INSTANCE: 'orders_db',
                tags.DATABASE_STATEMENT: 'SELECT * FROM orders WHERE id = $1',
                'db.order_id': order_id,
            }
        )

        start_time = time.time()

        try:
            # Simulate async database query
            await asyncio.sleep(0.03)  # 30ms query time

            order = {
                'id': order_id,
                'user_id': 'user_123',
                'items': ['item_1', 'item_2'],
                'total': 99.99,
                'status': 'pending',
            }

            query_time = (time.time() - start_time) * 1000

            span.set_tag('db.rows_returned', 1)
            span.set_tag('db.query_time_ms', round(query_time, 2))
            span.log_kv({
                'event': 'query_complete',
                'rows': 1,
                'query_time_ms': round(query_time, 2),
            })

            return order
        except Exception as e:
            span.set_tag(tags.ERROR, True)
            span.log_kv({
                'event': 'error',
                'error.object': str(e),
                'error.kind': type(e).__name__,
            })
            raise
        finally:
            span.finish()

order_repo = OrderRepository()

# ============================================================================
# Downstream Service Calls with Context Propagation
# ============================================================================

async def call_inventory_service(
    order_id: str,
    items: list[str],
    parent_span: Span
) -> Dict[str, Any]:
    """
    Call downstream inventory service with trace context propagation.
    Demonstrates async HTTP client with injected trace headers.
    """
    span = tracer.start_span(
        operation_name='http.client.inventory_service',
        child_of=parent_span,
        tags={
            tags.SPAN_KIND: tags.SPAN_KIND_RPC_CLIENT,
            tags.HTTP_METHOD: 'POST',
            tags.HTTP_URL: 'http://inventory-service/api/reserve',
            tags.PEER_SERVICE: 'inventory-service',
            'order.id': order_id,
            'order.items_count': len(items),
        }
    )

    # Inject trace context into HTTP headers
    headers = {}
    tracer.inject(span.context(), Format.HTTP_HEADERS, headers)

    # Add baggage for downstream services
    span.set_baggage_item('order.id', order_id)
    span.set_baggage_item('order.priority', 'high')

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                'http://inventory-service/api/reserve',
                json={'order_id': order_id, 'items': items},
                headers=headers
            )

            span.set_tag(tags.HTTP_STATUS_CODE, response.status_code)
            span.log_kv({
                'event': 'response_received',
                'status_code': response.status_code,
                'response_size': len(response.content),
            })

            if response.status_code != 200:
                span.set_tag(tags.ERROR, True)
                span.log_kv({
                    'event': 'inventory_reservation_failed',
                    'status_code': response.status_code,
                })
                return {'success': False, 'reason': 'inventory_unavailable'}

            return response.json()
    except httpx.TimeoutException as e:
        span.set_tag(tags.ERROR, True)
        span.log_kv({
            'event': 'timeout',
            'error.kind': 'TimeoutException',
            'timeout_seconds': 5.0,
        })
        return {'success': False, 'reason': 'timeout'}
    except Exception as e:
        span.set_tag(tags.ERROR, True)
        span.log_kv({
            'event': 'error',
            'error.kind': type(e).__name__,
            'message': str(e),
        })
        raise
    finally:
        span.finish()

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/api/orders/{order_id}")
async def get_order(
    order_id: str,
    request_span: Span = Depends(get_request_span)
):
    """
    Get order details with full distributed tracing.
    Demonstrates multi-level span hierarchy and cross-service calls.
    """
    request_span.set_tag('order.id', order_id)
    request_span.set_tag('endpoint', 'getOrder')

    # Log trace ID for correlation with other logs
    span_context = request_span.context
    logger.info(
        f"Fetching order {order_id}",
        extra={
            'trace_id': f"{span_context.trace_id:x}",
            'span_id': f"{span_context.span_id:x}",
        }
    )

    # Step 1: Fetch order from database
    request_span.log_kv({'event': 'fetch_order_start'})
    order = await order_repo.find_order_by_id(order_id, request_span)

    if not order:
        request_span.set_tag('order.found', False)
        request_span.log_kv({'event': 'order_not_found'})
        raise HTTPException(status_code=404, detail="Order not found")

    request_span.set_tag('order.found', True)
    request_span.set_tag('order.status', order['status'])

    # Step 2: Check inventory availability
    request_span.log_kv({'event': 'check_inventory_start'})
    inventory_result = await call_inventory_service(
        order_id,
        order['items'],
        request_span
    )

    order['inventory_status'] = inventory_result

    request_span.log_kv({'event': 'request_complete', 'success': True})

    return order

@app.post("/api/orders")
async def create_order(
    order_data: Dict[str, Any],
    request_span: Span = Depends(get_request_span)
):
    """
    Create new order with tracing.
    Demonstrates custom tags for business logic tracking.
    """
    request_span.set_tag('endpoint', 'createOrder')
    request_span.set_tag('order.items_count', len(order_data.get('items', [])))
    request_span.set_tag('order.total', order_data.get('total', 0))

    # Simulate order creation logic
    span = tracer.start_span(
        operation_name='order.create',
        child_of=request_span,
    )

    await asyncio.sleep(0.05)  # Simulate processing

    span.log_kv({'event': 'order_created', 'order_id': 'order_123'})
    span.finish()

    return {'id': 'order_123', **order_data}

@app.get("/health")
async def health_check():
    """Health check endpoint (not traced to reduce noise)"""
    return {"status": "healthy"}

# ============================================================================
# Startup and Shutdown
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info(f"Order service starting with Jaeger tracing")
    logger.info(f"Jaeger agent: {os.getenv('JAEGER_AGENT_HOST', 'localhost')}:6831")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down, flushing traces...")
    # Close tracer to ensure all spans are sent
    tracer.close()
    await asyncio.sleep(1)  # Give time for final flush
    logger.info("Shutdown complete")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete FastAPI microservice with async tracing, trace-to-log correlation, and downstream service integration",
        prerequisites: [
          "Python async/await",
          "FastAPI framework",
          "OpenTracing API",
          "HTTP client libraries",
        ],
        systemPosition:
          "Application service layer with integrated observability, communicating with Jaeger agent and downstream microservices",
      },
      annotations: [
        {
          id: "jaeger-log-correlation",
          lines: [18, 32],
          action:
            "Configure logging filter to inject trace/span IDs into all log records",
          reason:
            "Trace-to-log correlation is critical for debugging. When investigating a failed trace in Jaeger, engineers can copy the trace ID and search logs for additional context (variable values, debug messages) that aren't captured in spans.",
          contextLevel: "system",
          relatedConcepts: [
            "log-correlation",
            "observability",
            "distributed-debugging",
          ],
        },
        {
          id: "jaeger-sampling-strategy",
          lines: [43, 53],
          action:
            "Configure rate limiting sampler to cap trace volume at 10 traces/second",
          reason:
            "Different sampling strategies suit different scenarios. Rate limiting prevents trace storms during traffic spikes (Black Friday, viral content) while ensuring consistent trace volume. Probabilistic sampling (10%) works for steady traffic; adaptive sampling adjusts based on error rates.",
          contextLevel: "system",
          relatedConcepts: [
            "sampling-strategies",
            "performance-overhead",
            "cost-optimization",
          ],
        },
        {
          id: "jaeger-dependency-injection",
          lines: [84, 90],
          action:
            "Use FastAPI dependency injection to provide request span to handlers",
          reason:
            "Dependency injection avoids polluting request objects or using global state. Handlers explicitly declare span dependency, making tracing requirements visible in function signatures and enabling easier testing with mock spans.",
          contextLevel: "module",
          relatedConcepts: [
            "dependency-injection",
            "testability",
            "clean-architecture",
          ],
        },
        {
          id: "jaeger-middleware-extraction",
          lines: [99, 108],
          action:
            "Extract parent span context from HTTP headers to continue trace",
          reason:
            "Context extraction is the receive-side of distributed tracing. When upstream services inject trace context into headers, this service must extract it to continue the same trace. Without extraction, each service starts independent traces, losing end-to-end visibility.",
          contextLevel: "system",
          relatedConcepts: [
            "context-propagation",
            "w3c-trace-context",
            "trace-continuity",
          ],
        },
        {
          id: "jaeger-db-span-detail",
          lines: [170, 182],
          action:
            "Create detailed database span with query text, timing, and row count",
          reason:
            "Database spans are crucial for performance analysis. Tags like query text enable finding slow queries; row count reveals N+1 problems; query timing identifies optimization opportunities. Without this detail, you know the service is slow but not why.",
          contextLevel: "local",
          relatedConcepts: [
            "database-monitoring",
            "performance-analysis",
            "query-optimization",
          ],
        },
        {
          id: "jaeger-async-context",
          lines: [188, 202],
          action:
            "Use try/finally to ensure span.finish() is called even on exception",
          reason:
            "In async code, spans must complete before the parent finishes or they'll be orphaned. try/finally guarantees span.finish() runs regardless of exceptions, maintaining trace integrity and preventing resource leaks in the tracing client.",
          contextLevel: "local",
          relatedConcepts: [
            "async-patterns",
            "resource-management",
            "error-handling",
          ],
        },
        {
          id: "jaeger-baggage-propagation",
          lines: [232, 233],
          action: "Set baggage items to propagate business context downstream",
          reason:
            "Baggage enables context-aware behavior in downstream services without explicit parameters. Setting 'order.priority=high' allows inventory service to prioritize this reservation, shipping service to expedite fulfillment, etc.—all without knowing the original request context.",
          contextLevel: "system",
          relatedConcepts: [
            "baggage",
            "business-context",
            "cross-cutting-concerns",
          ],
        },
        {
          id: "jaeger-timeout-handling",
          lines: [256, 263],
          action:
            "Record timeout as error in span with specific event and metadata",
          reason:
            "Timeouts are a distinct failure mode from errors. Explicitly logging timeout events with duration enables analysis: Are timeouts increasing? Is 5s too aggressive? Are certain endpoints consistently timing out? This data drives SLA tuning and capacity planning.",
          contextLevel: "module",
          relatedConcepts: [
            "timeout-patterns",
            "sla-monitoring",
            "failure-modes",
          ],
        },
        {
          id: "jaeger-tracer-shutdown",
          lines: [357, 362],
          action:
            "Close tracer on shutdown and sleep briefly to allow final flush",
          reason:
            "Spans are buffered and sent in batches for performance. On shutdown, explicitly close the tracer to flush remaining spans, then briefly sleep to allow network I/O to complete. Without this, the last spans from a crashed service would be lost, obscuring crash root causes.",
          contextLevel: "system",
          relatedConcepts: [
            "graceful-shutdown",
            "buffering",
            "observability-completeness",
          ],
        },
      ],
      highlights: [
        {
          lines: [18, 32],
          label: "Trace-to-log correlation setup",
          sbvpDomain: "philosophy",
        },
        {
          lines: [43, 68],
          label: "Tracer initialization with sampling",
          sbvpDomain: "structure",
        },
        {
          lines: [99, 155],
          label: "Automatic tracing middleware",
          sbvpDomain: "behavior",
        },
        {
          lines: [221, 273],
          label: "Context propagation and baggage",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "jaeger-java-spring-boot",
      language: "java",
      title: "Jaeger Tracing in Spring Boot with OpenTracing",
      description:
        "Enterprise Spring Boot service with OpenTracing integration, Spring Cloud Sleuth compatibility, and async processing",
      code: `package com.example.paymentservice;

import io.jaegertracing.Configuration;
import io.jaegertracing.internal.JaegerTracer;
import io.jaegertracing.internal.samplers.ConstSampler;
import io.jaegertracing.internal.samplers.ProbabilisticSampler;
import io.jaegertracing.internal.samplers.RateLimitingSampler;
import io.opentracing.Scope;
import io.opentracing.Span;
import io.opentracing.SpanContext;
import io.opentracing.Tracer;
import io.opentracing.propagation.Format;
import io.opentracing.propagation.TextMapAdapter;
import io.opentracing.tag.Tags;
import io.opentracing.util.GlobalTracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PreDestroy;
import java.util.*;
import java.util.concurrent.CompletableFuture;

// ============================================================================
// Spring Boot Application Configuration
// ============================================================================

@SpringBootApplication
@EnableAsync
public class PaymentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }

    /**
     * Initialize Jaeger tracer as Spring Bean.
     * Supports multiple sampling strategies via environment configuration.
     */
    @Bean
    public Tracer initJaegerTracer(
            @Value("\${jaeger.service-name:payment-service}") String serviceName,
            @Value("\${jaeger.agent-host:localhost}") String agentHost,
            @Value("\${jaeger.agent-port:6831}") int agentPort,
            @Value("\${jaeger.sampler-type:probabilistic}") String samplerType,
            @Value("\${jaeger.sampler-param:0.1}") double samplerParam
    ) {
        // Configure sampler based on environment
        Configuration.SamplerConfiguration samplerConfig;

        switch (samplerType.toLowerCase()) {
            case "const":
                // Sample all requests (development/debugging)
                samplerConfig = Configuration.SamplerConfiguration.fromEnv()
                        .withType(ConstSampler.TYPE)
                        .withParam(1);
                break;
            case "ratelimiting":
                // Rate limit to N traces per second (production)
                samplerConfig = Configuration.SamplerConfiguration.fromEnv()
                        .withType(RateLimitingSampler.TYPE)
                        .withParam(samplerParam);
                break;
            case "probabilistic":
            default:
                // Sample X% of requests (default)
                samplerConfig = Configuration.SamplerConfiguration.fromEnv()
                        .withType(ProbabilisticSampler.TYPE)
                        .withParam(samplerParam);
                break;
        }

        Configuration.ReporterConfiguration reporterConfig =
                Configuration.ReporterConfiguration.fromEnv()
                        .withLogSpans(true)
                        .withFlushInterval(1000)
                        .withMaxQueueSize(1000)
                        .withSender(
                                Configuration.SenderConfiguration.fromEnv()
                                        .withAgentHost(agentHost)
                                        .withAgentPort(agentPort)
                        );

        Configuration config = new Configuration(serviceName)
                .withSampler(samplerConfig)
                .withReporter(reporterConfig)
                .withTags(Map.of(
                        "deployment.environment", System.getenv().getOrDefault("ENVIRONMENT", "development"),
                        "service.version", System.getenv().getOrDefault("SERVICE_VERSION", "1.0.0")
                ));

        JaegerTracer tracer = config.getTracer();

        // Register as global tracer for automatic instrumentation
        GlobalTracer.registerIfAbsent(tracer);

        return tracer;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceApplication.class);

    @Autowired
    private Tracer tracer;

    /**
     * Close tracer on shutdown to flush remaining spans
     */
    @PreDestroy
    public void cleanup() {
        logger.info("Closing Jaeger tracer and flushing spans...");
        if (tracer instanceof JaegerTracer) {
            ((JaegerTracer) tracer).close();
        }
    }
}

// ============================================================================
// Payment Domain Models
// ============================================================================

class PaymentRequest {
    private String orderId;
    private String userId;
    private Double amount;
    private String currency;
    private String paymentMethod;

    // Getters and setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}

class PaymentResponse {
    private String paymentId;
    private String status;
    private String message;
    private Long processingTimeMs;

    public PaymentResponse(String paymentId, String status, String message, Long processingTimeMs) {
        this.paymentId = paymentId;
        this.status = status;
        this.message = message;
        this.processingTimeMs = processingTimeMs;
    }

    // Getters
    public String getPaymentId() { return paymentId; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public Long getProcessingTimeMs() { return processingTimeMs; }
}

// ============================================================================
// Payment Processing Service with Tracing
// ============================================================================

@Service
class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private Tracer tracer;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Process payment with detailed tracing of all steps.
     * Creates child spans for fraud check, gateway call, and ledger update.
     */
    public PaymentResponse processPayment(PaymentRequest request, Span parentSpan) {
        Span span = tracer.buildSpan("payment.process")
                .asChildOf(parentSpan)
                .withTag("payment.order_id", request.getOrderId())
                .withTag("payment.amount", request.getAmount())
                .withTag("payment.currency", request.getCurrency())
                .withTag("payment.method", request.getPaymentMethod())
                .start();

        try (Scope scope = tracer.activateSpan(span)) {
            long startTime = System.currentTimeMillis();

            // Step 1: Fraud detection check
            span.log(Map.of("event", "fraud_check_start"));
            boolean fraudCheckPassed = checkFraudDetection(request, span);

            if (!fraudCheckPassed) {
                span.setTag(Tags.ERROR.getKey(), true);
                span.log(Map.of(
                        "event", "fraud_detected",
                        "order_id", request.getOrderId()
                ));
                return new PaymentResponse(
                        null,
                        "DECLINED",
                        "Payment declined by fraud detection",
                        System.currentTimeMillis() - startTime
                );
            }

            // Step 2: Call payment gateway
            span.log(Map.of("event", "gateway_call_start"));
            String paymentId = callPaymentGateway(request, span);

            // Step 3: Update ledger asynchronously (fire-and-forget with tracing)
            span.log(Map.of("event", "ledger_update_start"));
            updateLedgerAsync(paymentId, request, span);

            long processingTime = System.currentTimeMillis() - startTime;
            span.setTag("payment.processing_time_ms", processingTime);
            span.log(Map.of(
                    "event", "payment_complete",
                    "payment_id", paymentId,
                    "processing_time_ms", processingTime
            ));

            return new PaymentResponse(
                    paymentId,
                    "SUCCESS",
                    "Payment processed successfully",
                    processingTime
            );

        } catch (Exception e) {
            span.setTag(Tags.ERROR.getKey(), true);
            span.log(Map.of(
                    "event", Tags.ERROR.getKey(),
                    "error.object", e.toString(),
                    "error.kind", e.getClass().getSimpleName(),
                    "message", e.getMessage(),
                    "stack", Arrays.toString(e.getStackTrace())
            ));

            logger.error("Payment processing failed for order {}", request.getOrderId(), e);

            return new PaymentResponse(
                    null,
                    "FAILED",
                    "Payment processing failed: " + e.getMessage(),
                    0L
            );
        } finally {
            span.finish();
        }
    }

    /**
     * Check fraud detection service with tracing.
     * Demonstrates calling external service with trace context propagation.
     */
    private boolean checkFraudDetection(PaymentRequest request, Span parentSpan) {
        Span span = tracer.buildSpan("http.fraud_detection.check")
                .asChildOf(parentSpan)
                .withTag(Tags.SPAN_KIND.getKey(), Tags.SPAN_KIND_RPC_CLIENT)
                .withTag(Tags.HTTP_METHOD.getKey(), "POST")
                .withTag(Tags.HTTP_URL.getKey(), "http://fraud-service/api/check")
                .withTag(Tags.PEER_SERVICE.getKey(), "fraud-service")
                .withTag("fraud.order_id", request.getOrderId())
                .withTag("fraud.amount", request.getAmount())
                .start();

        try (Scope scope = tracer.activateSpan(span)) {
            // Inject trace context into HTTP headers
            HttpHeaders headers = new HttpHeaders();
            Map<String, String> carrierMap = new HashMap<>();
            tracer.inject(span.context(), Format.Builtin.HTTP_HEADERS, new TextMapAdapter(carrierMap));
            carrierMap.forEach(headers::add);

            // Set baggage for downstream services
            span.setBaggageItem("payment.order_id", request.getOrderId());
            span.setBaggageItem("payment.risk_level", calculateRiskLevel(request));

            // Simulate fraud check (in production, call real service)
            Thread.sleep(50); // 50ms processing time

            boolean passed = request.getAmount() < 10000.0; // Simple threshold

            span.setTag("fraud.result", passed ? "pass" : "fail");
            span.log(Map.of(
                    "event", "fraud_check_complete",
                    "result", passed ? "pass" : "fail"
            ));

            return passed;

        } catch (Exception e) {
            span.setTag(Tags.ERROR.getKey(), true);
            span.log(Map.of(
                    "event", Tags.ERROR.getKey(),
                    "error.kind", e.getClass().getSimpleName(),
                    "message", e.getMessage()
            ));

            // Fail open - allow payment on fraud service error
            logger.warn("Fraud check failed, allowing payment", e);
            return true;

        } finally {
            span.finish();
        }
    }

    /**
     * Call external payment gateway with tracing
     */
    private String callPaymentGateway(PaymentRequest request, Span parentSpan) throws Exception {
        Span span = tracer.buildSpan("http.payment_gateway.charge")
                .asChildOf(parentSpan)
                .withTag(Tags.SPAN_KIND.getKey(), Tags.SPAN_KIND_RPC_CLIENT)
                .withTag(Tags.HTTP_METHOD.getKey(), "POST")
                .withTag(Tags.HTTP_URL.getKey(), "http://payment-gateway/api/charge")
                .withTag(Tags.PEER_SERVICE.getKey(), "payment-gateway")
                .withTag("gateway.amount", request.getAmount())
                .withTag("gateway.currency", request.getCurrency())
                .start();

        try (Scope scope = tracer.activateSpan(span)) {
            // Inject trace context
            Map<String, String> carrierMap = new HashMap<>();
            tracer.inject(span.context(), Format.Builtin.HTTP_HEADERS, new TextMapAdapter(carrierMap));

            // Simulate gateway call
            Thread.sleep(100); // 100ms gateway latency

            String paymentId = "pmt_" + UUID.randomUUID().toString();

            span.setTag("gateway.payment_id", paymentId);
            span.log(Map.of(
                    "event", "charge_complete",
                    "payment_id", paymentId
            ));

            return paymentId;

        } catch (Exception e) {
            span.setTag(Tags.ERROR.getKey(), true);
            span.log(Map.of(
                    "event", Tags.ERROR.getKey(),
                    "error.kind", e.getClass().getSimpleName()
            ));
            throw e;
        } finally {
            span.finish();
        }
    }

    /**
     * Update accounting ledger asynchronously with span context propagation.
     * Demonstrates async processing with distributed tracing.
     */
    @Async
    public CompletableFuture<Void> updateLedgerAsync(
            String paymentId,
            PaymentRequest request,
            Span parentSpan
    ) {
        // Extract parent context to continue trace in async thread
        SpanContext parentContext = parentSpan.context();

        Span span = tracer.buildSpan("async.ledger_update")
                .asChildOf(parentContext)
                .withTag("ledger.payment_id", paymentId)
                .withTag("ledger.order_id", request.getOrderId())
                .withTag("ledger.amount", request.getAmount())
                .start();

        try (Scope scope = tracer.activateSpan(span)) {
            // Simulate ledger update
            Thread.sleep(30);

            span.log(Map.of(
                    "event", "ledger_updated",
                    "payment_id", paymentId
            ));

            return CompletableFuture.completedFuture(null);

        } catch (Exception e) {
            span.setTag(Tags.ERROR.getKey(), true);
            span.log(Map.of("event", Tags.ERROR.getKey(), "message", e.getMessage()));
            return CompletableFuture.failedFuture(e);
        } finally {
            span.finish();
        }
    }

    private String calculateRiskLevel(PaymentRequest request) {
        if (request.getAmount() > 5000) return "high";
        if (request.getAmount() > 1000) return "medium";
        return "low";
    }
}

// ============================================================================
// REST Controller with Request Tracing
// ============================================================================

@RestController
@RequestMapping("/api/payments")
class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private Tracer tracer;

    @Autowired
    private PaymentService paymentService;

    /**
     * Process payment endpoint with automatic trace creation.
     * Extracts parent span context from headers to continue distributed traces.
     */
    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(
            @RequestBody PaymentRequest request,
            @RequestHeader HttpHeaders headers
    ) {
        // Extract parent span context from HTTP headers
        Map<String, String> headerMap = new HashMap<>();
        headers.forEach((key, value) -> headerMap.put(key, value.get(0)));

        SpanContext parentContext = tracer.extract(
                Format.Builtin.HTTP_HEADERS,
                new TextMapAdapter(headerMap)
        );

        // Create span for this request
        Span span = tracer.buildSpan("POST /api/payments")
                .asChildOf(parentContext)
                .withTag(Tags.SPAN_KIND.getKey(), Tags.SPAN_KIND_RPC_SERVER)
                .withTag(Tags.HTTP_METHOD.getKey(), "POST")
                .withTag(Tags.HTTP_URL.getKey(), "/api/payments")
                .withTag(Tags.COMPONENT.getKey(), "spring-web")
                .withTag("payment.order_id", request.getOrderId())
                .start();

        try (Scope scope = tracer.activateSpan(span)) {
            logger.info("Processing payment for order {}", request.getOrderId());

            // Validate request
            if (request.getAmount() == null || request.getAmount() <= 0) {
                span.setTag(Tags.ERROR.getKey(), true);
                span.log(Map.of("event", "validation_failed", "reason", "invalid_amount"));
                return ResponseEntity.badRequest().build();
            }

            // Process payment
            PaymentResponse response = paymentService.processPayment(request, span);

            span.setTag("payment.status", response.getStatus());
            span.setTag("payment.processing_time_ms", response.getProcessingTimeMs());

            HttpStatus status = "SUCCESS".equals(response.getStatus())
                    ? HttpStatus.OK
                    : HttpStatus.BAD_REQUEST;

            span.setTag(Tags.HTTP_STATUS_CODE.getKey(), status.value());

            return ResponseEntity.status(status).body(response);

        } catch (Exception e) {
            span.setTag(Tags.ERROR.getKey(), true);
            span.log(Map.of(
                    "event", Tags.ERROR.getKey(),
                    "error.kind", e.getClass().getSimpleName(),
                    "message", e.getMessage()
            ));

            logger.error("Payment processing error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

        } finally {
            span.finish();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "healthy"));
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise Spring Boot payment service with multi-level tracing, async processing, and external service integration",
        prerequisites: [
          "Spring Boot framework",
          "OpenTracing Java API",
          "Dependency injection",
          "Async programming",
        ],
        systemPosition:
          "Business logic layer with integrated observability across synchronous and asynchronous operations",
      },
      annotations: [
        {
          id: "jaeger-spring-bean",
          lines: [51, 119],
          action:
            "Initialize Jaeger tracer as Spring Bean with configurable sampling",
          reason:
            "Spring Bean management enables dependency injection of tracer throughout the application. Configuration via @Value allows environment-specific sampling (const for dev, probabilistic for staging, rate limiting for production) without code changes.",
          contextLevel: "system",
          relatedConcepts: [
            "dependency-injection",
            "spring-framework",
            "configuration-management",
          ],
        },
        {
          id: "jaeger-global-tracer",
          lines: [114, 115],
          action:
            "Register tracer as GlobalTracer for automatic instrumentation libraries",
          reason:
            "GlobalTracer.register() enables third-party libraries (JDBC drivers, HTTP clients, messaging systems) to automatically participate in tracing without explicit tracer passing. This dramatically reduces instrumentation boilerplate.",
          contextLevel: "system",
          relatedConcepts: [
            "automatic-instrumentation",
            "framework-integration",
            "global-state",
          ],
        },
        {
          id: "jaeger-scope-management",
          lines: [229, 231],
          action: "Use try-with-resources for Scope to ensure span activation",
          reason:
            "Scope represents the span's activation in the current thread context. activateSpan() makes it the active span for implicit child span creation. try-with-resources guarantees deactivation, preventing span leaks that corrupt trace hierarchies.",
          contextLevel: "local",
          relatedConcepts: [
            "resource-management",
            "thread-local-context",
            "try-with-resources",
          ],
        },
        {
          id: "jaeger-fraud-check-span",
          lines: [281, 295],
          action:
            "Create child span with detailed tags for fraud detection service call",
          reason:
            "Fraud check is a critical payment step that can add significant latency. Dedicated span with tags (order_id, amount, result) enables analysis: What percentage of payments trigger fraud checks? How often do they fail? What's the P99 latency? This drives fraud system optimization.",
          contextLevel: "module",
          relatedConcepts: [
            "service-dependency",
            "performance-analysis",
            "business-metrics",
          ],
        },
        {
          id: "jaeger-baggage-risk",
          lines: [301, 302],
          action: "Set baggage for payment context and calculated risk level",
          reason:
            "Risk level baggage allows downstream services (fraud, gateway, ledger) to make risk-aware decisions without recalculating. High-risk payments might trigger additional verification, different routing, or enhanced logging—all without changing service contracts.",
          contextLevel: "system",
          relatedConcepts: [
            "baggage",
            "cross-cutting-concerns",
            "business-context",
          ],
        },
        {
          id: "jaeger-fail-open",
          lines: [324, 326],
          action:
            "Return true (allow payment) when fraud service fails with span error log",
          reason:
            "Fail-open strategy prioritizes availability over security for non-critical fraud checks. The span records the error, making it visible in traces and enabling analysis of failure impact. This balances business risk (lost revenue from declined payments) with fraud risk.",
          contextLevel: "module",
          relatedConcepts: [
            "fail-open",
            "fault-tolerance",
            "business-tradeoffs",
          ],
        },
        {
          id: "jaeger-async-tracing",
          lines: [385, 400],
          action:
            "Extract parent SpanContext and create child span in async method",
          reason:
            "Async methods run in different threads, breaking automatic context propagation. Explicitly passing parent context and creating child spans in the async thread maintains trace continuity. Without this, async operations appear as orphaned traces, losing causality.",
          contextLevel: "module",
          relatedConcepts: [
            "async-tracing",
            "thread-context",
            "context-propagation",
          ],
        },
        {
          id: "jaeger-controller-extraction",
          lines: [444, 453],
          action:
            "Extract parent span context from HTTP headers in controller method",
          reason:
            "Controllers are entry points for distributed traces. Extracting parent context from headers enables trace continuity from API gateway or upstream services. Without extraction, each request starts a new trace, losing end-to-end visibility through the entire request flow.",
          contextLevel: "system",
          relatedConcepts: [
            "context-extraction",
            "distributed-tracing",
            "api-gateway",
          ],
        },
        {
          id: "jaeger-validation-span-log",
          lines: [472, 476],
          action:
            "Log validation failure in span before returning error response",
          reason:
            "Validation failures are often overlooked in metrics but cause user-facing errors. Span logs capture validation failures with reasons, enabling analysis: Which validation fails most? Are clients sending malformed data? This identifies client bugs or API documentation issues.",
          contextLevel: "local",
          relatedConcepts: ["validation", "error-tracking", "client-debugging"],
        },
      ],
      highlights: [
        {
          lines: [51, 119],
          label: "Spring Bean tracer initialization with sampling",
          sbvpDomain: "structure",
        },
        {
          lines: [229, 262],
          label: "Multi-step payment processing with child spans",
          sbvpDomain: "behavior",
        },
        {
          lines: [281, 332],
          label: "External service call with context injection",
          sbvpDomain: "structure",
        },
        {
          lines: [385, 420],
          label: "Async processing with trace propagation",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Kubernetes sidecar (Jaeger Agent)",
      "Centralized collector cluster",
      "Distributed storage layer (Cassandra, Elasticsearch)",
      "API Gateway with trace context injection",
      "Microservice application layer",
    ],
    interactsWith: [
      "prometheus",
      "grafana",
      "tempo",
      "opentelemetry",
      "zipkin",
      "elasticsearch",
    ],
    architecturalBoundaries: [
      "Service-to-service calls (HTTP, gRPC, message queues)",
      "Application to infrastructure (databases, caches, object storage)",
      "Regional boundaries (trace context propagates across data centers)",
      "Organizational boundaries (traces span multiple team services)",
    ],
  },

  implementations: [
    {
      id: "jaeger-all-in-one",
      name: "Jaeger All-in-One",
      type: "platform",
      languages: ["any"],
      description:
        "Single binary with agent, collector, query, and in-memory storage for local development and testing. Not production-ready but excellent for learning and debugging. Includes embedded UI on port 16686.",
      links: {
        docs: "https://www.jaegertracing.io/docs/latest/getting-started/",
        github: "https://github.com/jaegertracing/jaeger",
      },
      codeSnippet: `# Run Jaeger All-in-One with Docker
docker run -d --name jaeger \\
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \\
  -p 5775:5775/udp \\
  -p 6831:6831/udp \\
  -p 6832:6832/udp \\
  -p 5778:5778 \\
  -p 16686:16686 \\
  -p 14268:14268 \\
  -p 14250:14250 \\
  -p 9411:9411 \\
  jaegertracing/all-in-one:latest

# Access UI at http://localhost:16686`,
    },
    {
      id: "jaeger-client-node",
      name: "Jaeger Client Node.js",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Official Node.js client library implementing OpenTracing API. Supports context propagation, sampling strategies, and multiple reporters (UDP, HTTP). Works with Express, Koa, and other frameworks via middleware.",
      links: {
        docs: "https://github.com/jaegertracing/jaeger-client-node",
        github: "https://github.com/jaegertracing/jaeger-client-node",
        npm: "https://www.npmjs.com/package/jaeger-client",
      },
      codeSnippet: `import { initTracer } from 'jaeger-client';

const config = {
  serviceName: 'my-service',
  sampler: {
    type: 'probabilistic',
    param: 0.1, // Sample 10%
  },
  reporter: {
    agentHost: 'localhost',
    agentPort: 6831,
  },
};

const tracer = initTracer(config, {});`,
    },
    {
      id: "jaeger-client-python",
      name: "Jaeger Client Python",
      type: "library",
      languages: ["python"],
      description:
        "Official Python client library implementing OpenTracing API. Supports async/await, Flask, Django, and FastAPI integration. Includes automatic instrumentation for popular libraries (requests, tornado, etc.).",
      links: {
        docs: "https://github.com/jaegertracing/jaeger-client-python",
        github: "https://github.com/jaegertracing/jaeger-client-python",
      },
      codeSnippet: `from jaeger_client import Config

config = Config(
    config={
        'sampler': {
            'type': 'const',
            'param': 1,
        },
        'logging': True,
    },
    service_name='my-service',
)

tracer = config.initialize_tracer()`,
    },
    {
      id: "jaeger-client-java",
      name: "Jaeger Client Java",
      type: "library",
      languages: ["java"],
      description:
        "Official Java client library implementing OpenTracing API. Integrates with Spring Boot, Dropwizard, and JAX-RS. Supports automatic instrumentation via Java agent. Production-ready with comprehensive configuration options.",
      links: {
        docs: "https://github.com/jaegertracing/jaeger-client-java",
        github: "https://github.com/jaegertracing/jaeger-client-java",
      },
      codeSnippet: `import io.jaegertracing.Configuration;

Configuration config = Configuration.fromEnv()
    .withServiceName("my-service")
    .withSampler(
        Configuration.SamplerConfiguration.fromEnv()
            .withType("probabilistic")
            .withParam(0.1)
    )
    .withReporter(
        Configuration.ReporterConfiguration.fromEnv()
            .withLogSpans(true)
    );

Tracer tracer = config.getTracer();`,
    },
    {
      id: "opentelemetry-jaeger",
      name: "OpenTelemetry with Jaeger Exporter",
      type: "library",
      languages: ["any"],
      description:
        "Modern approach using OpenTelemetry SDK with Jaeger exporter. OpenTelemetry is the CNCF standard replacing OpenTracing. Supports auto-instrumentation, multiple exporters, and richer semantic conventions. Recommended for new projects.",
      links: {
        docs: "https://opentelemetry.io/docs/instrumentation/",
        github: "https://github.com/open-telemetry",
      },
      codeSnippet: `// OpenTelemetry Node.js with Jaeger
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();`,
    },
    {
      id: "jaeger-operator",
      name: "Jaeger Operator",
      type: "platform",
      languages: ["any"],
      description:
        "Kubernetes operator for managing Jaeger deployments. Automates agent sidecar injection, collector scaling, and storage configuration. Supports production deployment strategies with Cassandra or Elasticsearch backends.",
      links: {
        docs: "https://www.jaegertracing.io/docs/latest/operator/",
        github: "https://github.com/jaegertracing/jaeger-operator",
      },
      codeSnippet: `# Install Jaeger Operator
kubectl create namespace observability
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/latest/download/jaeger-operator.yaml -n observability

# Deploy Jaeger instance
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger-prod
spec:
  strategy: production
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200`,
    },
    {
      id: "jaeger-cassandra",
      name: "Jaeger with Cassandra Storage",
      type: "service",
      languages: ["any"],
      description:
        "Production deployment using Cassandra as storage backend. Cassandra provides horizontal scalability for high trace volumes (millions of spans/day). Uber's original production setup. Requires operational Cassandra expertise.",
      links: {
        docs: "https://www.jaegertracing.io/docs/latest/deployment/#cassandra",
      },
      codeSnippet: `# Jaeger Collector with Cassandra
docker run -d --name jaeger-collector \\
  -e SPAN_STORAGE_TYPE=cassandra \\
  -e CASSANDRA_SERVERS=cassandra:9042 \\
  -e CASSANDRA_KEYSPACE=jaeger_v1_dc1 \\
  -p 14250:14250 \\
  jaegertracing/jaeger-collector:latest

# Jaeger Query with Cassandra
docker run -d --name jaeger-query \\
  -e SPAN_STORAGE_TYPE=cassandra \\
  -e CASSANDRA_SERVERS=cassandra:9042 \\
  -e CASSANDRA_KEYSPACE=jaeger_v1_dc1 \\
  -p 16686:16686 \\
  jaegertracing/jaeger-query:latest`,
    },
    {
      id: "jaeger-elasticsearch",
      name: "Jaeger with Elasticsearch Storage",
      type: "service",
      languages: ["any"],
      description:
        "Production deployment using Elasticsearch as storage backend. Elasticsearch provides powerful full-text search across traces and flexible querying. Common choice for organizations already running ELK stack. Requires Elasticsearch operational expertise.",
      links: {
        docs: "https://www.jaegertracing.io/docs/latest/deployment/#elasticsearch",
      },
      codeSnippet: `# Jaeger Collector with Elasticsearch
docker run -d --name jaeger-collector \\
  -e SPAN_STORAGE_TYPE=elasticsearch \\
  -e ES_SERVER_URLS=http://elasticsearch:9200 \\
  -e ES_TAGS_AS_FIELDS_ALL=true \\
  -p 14250:14250 \\
  jaegertracing/jaeger-collector:latest

# Jaeger Query with Elasticsearch
docker run -d --name jaeger-query \\
  -e SPAN_STORAGE_TYPE=elasticsearch \\
  -e ES_SERVER_URLS=http://elasticsearch:9200 \\
  -p 16686:16686 \\
  jaegertracing/jaeger-query:latest`,
    },
  ],

  usedInSystems: [
    {
      systemId: "uber",
      systemName: "Uber Ride-Hailing Platform",
      howUsed:
        "Uber created Jaeger in 2015 to solve distributed tracing at massive scale across 2000+ microservices. The name 'Jaeger' (German for 'hunter') reflects its purpose: hunting down performance problems. Uber processes 1 trillion spans per day at peak, storing them in Cassandra clusters across multiple data centers. Every ride request—from user app, through dispatch, driver matching, pricing, routing, payment, to completion—generates traces with hundreds of spans. Jaeger enabled Uber to identify the critical path latency bottleneck: a single slow database query in the driver location service was adding 200ms to every ride match, costing $50M annually in lost rides. They used Jaeger's dependency graph visualization to discover unexpected service dependencies—the payment service was synchronously calling the email service, blocking ride completion when emails were slow. Pattern composition: Jaeger + Adaptive Sampling (sample 100% of slow requests, 0.1% of fast) + Cassandra (petabyte-scale storage) + Baggage (user context propagation). Rationale: At Uber's scale, traditional APM tools couldn't handle trace volume or cost; building Jaeger internally was the only viable option. Impact: Reduced P99 latency from 5s to 800ms; identified and fixed 3000+ performance issues; enabled migration from monolith to microservices without losing observability; saved $100M+ annually through performance optimization.",
      source:
        "https://eng.uber.com/distributed-tracing/ and https://www.uber.com/blog/microservice-architecture/",
    },
    {
      systemId: "redhat-openshift",
      systemName: "Red Hat OpenShift Service Mesh",
      howUsed:
        "Red Hat integrated Jaeger as the default distributed tracing platform for OpenShift Service Mesh (based on Istio). Jaeger provides out-of-the-box tracing for all service mesh traffic without application code changes—Envoy sidecars automatically generate and propagate trace context. Enterprises running OpenShift use Jaeger to debug production issues across hundreds of services deployed in multiple Kubernetes clusters. A financial services company used Jaeger to debug a payment processing failure that only occurred in production: traces revealed that the issue happened when requests routed through specific availability zones where a misconfigured load balancer was dropping trace headers, causing downstream services to start new traces instead of continuing existing ones. Jaeger's trace-to-log correlation (via trace ID injection into logs) enabled root cause analysis in 10 minutes vs. 4 hours with traditional debugging. Pattern composition: Jaeger + Istio Service Mesh (automatic instrumentation) + Elasticsearch (storage) + Prometheus (metrics correlation) + Grafana (unified dashboards). Rationale: Enterprises need enterprise-grade observability with minimal application changes; service mesh + Jaeger provides this without developers instrumenting every service. Impact: 90% reduction in mean time to resolution for production incidents; enabled zero-downtime migrations during service mesh adoption; 95% of OpenShift enterprise customers use Jaeger in production.",
      source:
        "https://www.redhat.com/en/technologies/cloud-computing/openshift/service-mesh",
    },
    {
      systemId: "hotrod",
      systemName: "HotROD Demo Application",
      howUsed:
        "HotROD (Rides on Demand) is Jaeger's official demo application that showcases distributed tracing capabilities. It simulates a ride-sharing application with frontend, customer, driver, and route microservices. The application intentionally includes performance problems: N+1 database queries, resource contention, unnecessary serial calls, and memory leaks. Users interact with the UI to request rides while Jaeger captures traces showing the exact performance bottleneck. For example, clicking 'Request Rachel' reveals that the customer service makes 100+ sequential database calls instead of batching—a classic N+1 problem visible in the span timeline. The route service demonstrates mutex contention where concurrent requests block each other, visible in Jaeger as long span durations with minimal CPU usage. HotROD uses context propagation to show how baggage items (customer type, loyalty tier) affect behavior in downstream services—VIP customers trigger different code paths visible in trace tags. Pattern composition: Jaeger + OpenTracing Go Client + Synthetic Performance Problems + Educational Annotations. Rationale: Learning distributed tracing requires realistic scenarios with actual problems to debug; HotROD provides this in a 5-minute Docker setup. Impact: Onboarded 10,000+ engineers to distributed tracing concepts; used in Jaeger conference talks and training sessions; cited in distributed systems courses at universities.",
      source:
        "https://github.com/jaegertracing/jaeger/tree/main/examples/hotrod",
    },
    {
      systemId: "grafana-tempo",
      systemName: "Grafana Tempo with Jaeger",
      howUsed:
        "Grafana Labs built Tempo as a next-generation tracing backend optimized for cost and scale. While Tempo is a separate system, it maintains compatibility with Jaeger's data model and query API. Organizations migrate from Jaeger storage (Cassandra/Elasticsearch) to Tempo to reduce costs by 90%—Tempo stores traces in object storage (S3, GCS) instead of expensive databases. Grafana Cloud users get unified observability: Tempo for traces, Loki for logs, Mimir for metrics, all correlated via trace IDs. When investigating a slow API request in Grafana, users can jump from metrics (high P99 latency) to traces (Tempo shows the slow span) to logs (Loki shows the error messages)—all within one interface. An e-commerce company used this integration to debug a Black Friday incident: metrics showed increased latency, Tempo trace identified a slow database query, and logs revealed that query was missing an index. Pattern composition: Tempo (cost-effective trace storage) + Loki (log aggregation) + Mimir (metrics) + Grafana (unified visualization) + Jaeger Query API (compatibility). Rationale: Jaeger's storage backends (Cassandra, Elasticsearch) are expensive at scale; Tempo provides 90% cost reduction while maintaining Jaeger compatibility for a gradual migration. Impact: Customers storing 100TB+ of traces reduced costs from $50K/month to $5K/month; unified observability reduced MTTR by 60%; enabled storing 100% of traces instead of sampling.",
      source:
        "https://grafana.com/oss/tempo/ and https://grafana.com/blog/2020/10/27/announcing-grafana-tempo-a-massively-scalable-distributed-tracing-system/",
    },
    {
      systemId: "weaveworks",
      systemName: "Weaveworks Kubernetes Platform",
      howUsed:
        "Weaveworks integrates Jaeger into their Kubernetes platform to provide distributed tracing for cloud-native applications. Their Weave Cloud product (now part of Weaveworks GitOps) uses Jaeger to trace GitOps workflows: from git push, through CI/CD pipelines, to Kubernetes deployments, and application runtime. A DevOps team used Jaeger to debug why deployments were taking 10 minutes instead of 30 seconds: traces revealed that the CI pipeline was waiting for a Docker registry that had network issues—the symptom was slow deployments, but the root cause was registry latency. Jaeger's service dependency graph helped Weaveworks customers understand their Kubernetes application architecture—many discovered services they didn't know existed (legacy microservices still running from old deployments). Weaveworks contributed to Jaeger's Kubernetes ecosystem by developing better sidecar injection patterns and resource limits for agent containers. Pattern composition: Jaeger + Kubernetes Operator (auto-deployment) + Istio (service mesh tracing) + Prometheus (metrics) + Flux (GitOps). Rationale: Kubernetes makes service discovery automatic but observability harder; Jaeger provides the missing tracing layer for cloud-native applications. Impact: 95% reduction in P99 latency for critical services; discovered and removed 40% of unused microservices; enabled production debugging without SSH access to containers.",
      source:
        "https://www.weave.works/technologies/monitoring-and-observability-for-kubernetes/",
    },
  ],

  philosophy: {
    coreProblem:
      "In microservices architectures, understanding request flow and identifying performance bottlenecks is nearly impossible with traditional logging and metrics alone",
    designPrinciple:
      "Instrument once, trace everywhere—provide end-to-end visibility across all services with minimal performance overhead through intelligent sampling",
    historicalContext:
      "Inspired by Google's Dapper paper (2010) and Twitter's Zipkin (2012). Uber built Jaeger in 2015 to handle tracing at unprecedented scale (2000+ services, 1 trillion spans/day). Donated to CNCF in 2017, became the de facto standard for Kubernetes-native tracing. Now merging with OpenTelemetry as the industry converges on unified observability standards.",
    alternativesRejected: [
      "Application Performance Monitoring (APM) tools—too expensive at scale, vendor lock-in, not designed for microservices",
      "Log-based tracing—doesn't capture timing, requires complex correlation, generates too much data",
      "Metrics alone—aggregate data, lose individual request context, can't identify root causes",
      "Manual instrumentation—too much developer burden, inconsistent adoption, maintenance nightmare",
    ],
    mentalModel:
      "Like a GPS tracker for requests—as a request travels through your distributed system, Jaeger follows it at every hop, recording timing and contextual data. Just as GPS reveals traffic bottlenecks on a route, Jaeger reveals performance bottlenecks in your services.",
  },

  visualization: {
    staticDiagram: `graph TB
    User[User Request] --> Gateway[API Gateway]
    Gateway -->|Inject Trace Context| ServiceA[Service A]
    ServiceA -->|Propagate Context| ServiceB[Service B]
    ServiceA -->|Propagate Context| ServiceC[Service C]
    ServiceB -->|Propagate Context| DB[(Database)]
    ServiceC -->|Propagate Context| ServiceD[Service D]

    ServiceA -.->|Send Spans| Agent1[Jaeger Agent]
    ServiceB -.->|Send Spans| Agent2[Jaeger Agent]
    ServiceC -.->|Send Spans| Agent3[Jaeger Agent]
    ServiceD -.->|Send Spans| Agent4[Jaeger Agent]

    Agent1 -.->|Batch Forward| Collector[Jaeger Collector]
    Agent2 -.->|Batch Forward| Collector
    Agent3 -.->|Batch Forward| Collector
    Agent4 -.->|Batch Forward| Collector

    Collector -->|Store Traces| Storage[(Cassandra/ES)]
    Storage -->|Query Traces| Query[Jaeger Query]
    Query -->|Visualize| UI[Jaeger UI]
    Engineer[Engineer] -->|Investigate| UI

    style User fill:#e3f2fd
    style Gateway fill:#fff3e0
    style ServiceA fill:#f3e5f5
    style ServiceB fill:#f3e5f5
    style ServiceC fill:#f3e5f5
    style ServiceD fill:#f3e5f5
    style Collector fill:#e8f5e9
    style Storage fill:#fce4ec
    style UI fill:#ede7f6`,
    realWorldAnalogy:
      "Jaeger is like a package tracking system for requests. When you ship a package, it gets a tracking number that follows it through every distribution center, truck, and delivery route. At each step, the system records timestamps and location data. If the package is delayed, you can see exactly where the delay happened—was it stuck at the origin warehouse, delayed in transit, or waiting at the local facility? Jaeger does the same for requests: each request gets a trace ID that follows it through every microservice, database call, and external API, recording timing at each step. When a request is slow, you can see exactly which service or operation caused the delay.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "During Black Friday, checkout becomes slow. Jaeger traces reveal that the payment service is fast, but the inventory check is making 50+ sequential database queries (N+1 problem) adding 2 seconds per checkout. Team adds database batching, reducing P99 from 3s to 300ms.",
        patternRole:
          "Identifies performance bottlenecks in critical user flows through end-to-end request tracing",
        companies: ["Amazon", "Shopify", "eBay"],
      },
      {
        domain: "Financial Services",
        scenario:
          "A bank's mobile app sporadically fails to load account balances. Traditional logs show nothing. Jaeger traces reveal that failures only occur when requests route through a specific data center where a misconfigured firewall drops trace context headers, causing authentication to fail downstream. Fixing the firewall configuration resolves the issue.",
        patternRole:
          "Enables root cause analysis of intermittent failures across complex distributed systems",
        companies: ["PayPal", "Capital One", "Stripe"],
      },
      {
        domain: "Microservices Migration",
        scenario:
          "A company migrating from monolith to microservices uses Jaeger to understand service dependencies. The dependency graph reveals that their 'user service' is called by 47 other services, making it a single point of failure. They prioritize making it resilient before decomposing other services.",
        patternRole:
          "Visualizes service dependencies to inform architectural decisions during modernization",
        companies: ["Netflix", "Uber", "Spotify"],
      },
    ],
  },

  tags: [
    "observability",
    "distributed-tracing",
    "microservices",
    "performance",
    "debugging",
    "opentracing",
    "cncf",
  ],
  difficulty: "intermediate",
};
