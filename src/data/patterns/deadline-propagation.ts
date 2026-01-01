import type { Pattern } from "../schema";

export const deadlinePropagation: Pattern = {
  id: "deadline-propagation",
  slug: "deadline-propagation",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → ⏱️ Timeout → ⏰ Deadline Propagation",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Timeout",
    level: 4,
  },

  concept: {
    name: "Deadline Propagation",
    emoji: "⏰",
    tagline: "Pass remaining time downstream",
    definition:
      "Deadline Propagation is a distributed timeout pattern where each service in a call chain receives and respects the caller's deadline, passing remaining time budget downstream to subsequent calls. Instead of each service independently defining timeouts, the original client request establishes an absolute deadline (e.g., must complete by 14:30:15.500), and this deadline flows through every hop in the distributed system. Each service calculates its remaining time budget by subtracting current time from the deadline, uses this budget for its local operations and downstream calls, and fails fast if the deadline has already passed or insufficient time remains. Think of it like a relay race where each runner can see the race clock and knows they must pass the baton before time expires—not just run their own segment in isolation. Modern RPC frameworks like gRPC embed deadlines in request metadata, automatically propagating and enforcing them across service boundaries. This enables intelligent short-circuiting: a service receiving a request with only 10ms remaining can immediately return a deadline exceeded error rather than initiating expensive database queries or API calls guaranteed to exceed the budget. The pattern transforms per-hop timeouts into coordinated, deadline-aware behavior across entire distributed workflows.",
    problemSolved:
      "In microservice architectures, a user request often cascades through 5-20 services before completing. Traditional per-service timeouts create two critical problems: timeout accumulation (5 services with 3-second timeouts create 15-second worst-case latency) and wasteful work (a service deep in the call chain may execute expensive operations even though the original caller already gave up and timed out). Without deadline propagation, services operate blindly—they don't know the original request deadline, can't prioritize work by urgency, and waste resources on doomed requests. For example, Service A calls Service B with a 2-second timeout. Service B spends 1.8 seconds on internal processing, then calls Service C with its own 2-second timeout. But Service A's timeout expires at 2 seconds total, making Service B and C's work completely wasted—they're processing a request whose caller has already abandoned. Deadline Propagation solves this by propagating the absolute deadline through the call chain. Service B sees it has 200ms remaining (not 2s), so it either uses a shorter timeout for Service C or fails immediately, preventing wasteful cascading operations and enabling coordinated timeout behavior.",
    tradeoffs: {
      pros: [
        "Prevents wasteful work on requests that have already timed out upstream",
        "Enables services to fail fast when insufficient time remains",
        "Coordinates timeout behavior across distributed call chains",
        "Allows services to prioritize work by deadline urgency",
        "Reduces resource consumption on doomed requests",
      ],
      cons: [
        "Requires framework support for deadline propagation (gRPC, custom headers)",
        "Clock synchronization across services is critical (NTP required)",
        "Adds complexity in deadline calculation and propagation logic",
        "Services must check deadlines frequently to realize benefits",
        "Debugging distributed timeouts becomes more complex",
      ],
    },
    relatedPatterns: [
      "request-timeout",
      "timeout",
      "circuit-breaker",
      "bulkhead",
      "backpressure",
      "priority-queue",
    ],
  },

  structure: {
    participants: [
      {
        name: "Request Context",
        role: "Deadline Carrier",
        responsibilities: [
          "Store absolute deadline timestamp from original request",
          "Propagate deadline through service call chain",
          "Calculate remaining time budget at each hop",
          "Fail fast if deadline already exceeded",
        ],
      },
      {
        name: "Service Handler",
        role: "Deadline Checker",
        responsibilities: [
          "Extract deadline from request context/metadata",
          "Check if sufficient time remains before processing",
          "Pass remaining deadline to downstream calls",
          "Return deadline exceeded error if time exhausted",
        ],
      },
      {
        name: "Downstream Client",
        role: "Deadline Propagator",
        responsibilities: [
          "Calculate remaining time from current deadline",
          "Set timeout for downstream call based on remaining time",
          "Include deadline in outbound request metadata",
          "Handle deadline exceeded errors from downstream",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant ServiceA
    participant ServiceB
    participant ServiceC

    Note over Client: Deadline: now + 5s
    Client->>ServiceA: Request (deadline: T+5s)
    Note over ServiceA: Check: 4.8s remaining
    ServiceA->>ServiceA: Process (200ms)
    Note over ServiceA: Remaining: 4.6s
    ServiceA->>ServiceB: Request (deadline: T+5s)
    Note over ServiceB: Check: 4.5s remaining
    ServiceB->>ServiceB: Process (1s)
    Note over ServiceB: Remaining: 3.5s
    ServiceB->>ServiceC: Request (deadline: T+5s)
    Note over ServiceC: Check: 3.4s remaining
    ServiceC->>ServiceC: Process (500ms)
    ServiceC-->>ServiceB: Response (2.9s remaining)
    ServiceB-->>ServiceA: Response (2.8s remaining)
    ServiceA-->>Client: Response (2.7s remaining)`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Establish Deadline",
        description:
          "Calculate absolute deadline timestamp: current time + timeout duration (e.g., now + 5s)",
      },
      {
        step: 2,
        actor: "Client",
        action: "Attach Deadline to Request",
        description:
          "Include deadline in request metadata (gRPC metadata, HTTP headers, context)",
      },
      {
        step: 3,
        actor: "Service Handler",
        action: "Extract and Validate Deadline",
        description:
          "Read deadline from request, check if already exceeded, calculate remaining time",
      },
      {
        step: 4,
        actor: "Service Handler",
        action: "Process with Deadline Awareness",
        description:
          "Execute business logic with remaining time budget, fail fast if insufficient time",
      },
      {
        step: 5,
        actor: "Downstream Client",
        action: "Propagate Deadline",
        description:
          "Pass same absolute deadline to downstream calls, set timeout based on remaining time",
      },
      {
        step: 6,
        actor: "Service Handler",
        action: "Return or Timeout",
        description:
          "Return response if completed within deadline, or return deadline exceeded error",
      },
    ],
    invariants: [
      "Deadline must be absolute timestamp, not relative duration",
      "All services must respect the same deadline from original request",
      "Remaining time must decrease monotonically through call chain",
      "Services must fail immediately if deadline already passed",
      "Downstream timeout must not exceed remaining deadline time",
      "Clocks across services must be synchronized (NTP required)",
    ],
  },

  codeExamples: [
    {
      id: "deadline-propagation-ts-microservices",
      language: "typescript",
      title: "Deadline Propagation in Microservices with HTTP Headers",
      description:
        "Complete implementation of deadline propagation pattern across three microservices using HTTP headers to coordinate distributed timeout behavior",
      code: `import express, { Request, Response, NextFunction } from 'express';
import axios, { AxiosInstance } from 'axios';

// ============================================================
// Types and Constants
// ============================================================

const DEADLINE_HEADER = 'X-Request-Deadline';
const MINIMUM_REMAINING_MS = 100; // Fail fast if less than 100ms remains

interface RequestContext {
  deadlineMs: number; // Absolute deadline timestamp
  requestId: string;
}

class DeadlineExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeadlineExceededError';
  }
}

// ============================================================
// Deadline Context Middleware
// ============================================================

/**
 * ACTION: Extract or create deadline from incoming HTTP request
 * REASON: First service in chain establishes deadline, subsequent services
 *         extract it from headers. This ensures all services coordinate on
 *         the same absolute deadline timestamp, preventing timeout accumulation.
 *
 * CLOCK SYNC: Requires NTP-synchronized clocks across services. If Service A's
 *             clock is 10s ahead of Service B's, deadline calculations break.
 */
function deadlineMiddleware(defaultTimeoutMs: number = 5000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();

    // ACTION: Extract deadline from header if present, else create new deadline
    // REASON: Incoming requests from other services carry existing deadline.
    //         Direct client requests need new deadline established.
    const deadlineHeader = req.headers[DEADLINE_HEADER.toLowerCase()] as string;
    let deadlineMs: number;

    if (deadlineHeader) {
      deadlineMs = parseInt(deadlineHeader, 10);

      // ACTION: Validate deadline is in the future
      // REASON: If deadline already passed (network delay, clock skew),
      //         fail immediately rather than starting work doomed to fail
      if (deadlineMs <= now) {
        res.status(504).json({
          error: 'DeadlineExceeded',
          message: \`Request deadline \${new Date(deadlineMs).toISOString()} already passed\`,
        });
        return;
      }
    } else {
      // ACTION: Establish new absolute deadline for client-initiated request
      // REASON: Use absolute timestamp (not duration) so downstream services
      //         can calculate remaining time without cumulative drift
      deadlineMs = now + defaultTimeoutMs;
    }

    // ACTION: Calculate remaining time and check if sufficient
    // REASON: If only 50ms remains, expensive operations will fail anyway.
    //         Failing fast saves resources and provides faster error feedback
    const remainingMs = deadlineMs - now;
    if (remainingMs < MINIMUM_REMAINING_MS) {
      res.status(504).json({
        error: 'DeadlineExceeded',
        message: \`Insufficient time remaining: \${remainingMs}ms < \${MINIMUM_REMAINING_MS}ms minimum\`,
      });
      return;
    }

    // ACTION: Attach deadline context to request for downstream use
    // REASON: Business logic needs access to deadline for intelligent decisions:
    //         skip expensive operations, choose fast path vs slow path, etc.
    (req as any).context = {
      deadlineMs,
      requestId: req.headers['x-request-id'] || \`req-\${Date.now()}\`,
      remainingMs,
    } as RequestContext;

    next();
  };
}

// ============================================================
// Deadline-Aware HTTP Client
// ============================================================

/**
 * ACTION: Create HTTP client that propagates deadlines to downstream services
 * REASON: Downstream calls must respect the same deadline to prevent wasteful
 *         work. If Service A has 200ms remaining, Service B's timeout should
 *         be 200ms (not 5s), preventing Service B from working on a request
 *         that Service A already gave up on.
 */
class DeadlineAwareClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      // ACTION: Disable default timeout to use deadline-based timeout
      // REASON: axios timeout is static, deadline timeout is dynamic based
      //         on remaining time budget
      timeout: 0,
    });
  }

  /**
   * ACTION: Make HTTP request with deadline propagation
   * REASON: Each downstream call consumes time budget. By propagating the
   *         absolute deadline (not creating new timeout), we coordinate
   *         timeout behavior across the entire distributed call chain.
   */
  async get<T>(
    path: string,
    context: RequestContext
  ): Promise<T> {
    const now = Date.now();
    const remainingMs = context.deadlineMs - now;

    // ACTION: Fail immediately if deadline already exceeded
    // REASON: Don't waste resources making downstream call guaranteed to timeout
    if (remainingMs <= 0) {
      throw new DeadlineExceededError(
        \`Deadline exceeded before making request to \${path}\`
      );
    }

    // ACTION: Reserve buffer for network overhead and response processing
    // REASON: If exactly 100ms remains, we can't set 100ms timeout—need margin
    //         for TCP handshake, TLS negotiation, response parsing
    const requestTimeoutMs = Math.max(remainingMs - 50, MINIMUM_REMAINING_MS);

    // ACTION: Use AbortController for timeout enforcement
    // REASON: axios timeout isn't precise enough, AbortController gives exact
    //         control over request cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await this.axiosInstance.get<T>(path, {
        headers: {
          // ACTION: Propagate absolute deadline to downstream service
          // REASON: Downstream service calculates its own remaining time from
          //         this deadline, enabling coordinated timeout behavior
          [DEADLINE_HEADER]: context.deadlineMs.toString(),
          'X-Request-ID': context.requestId,
        },
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      clearTimeout(timeoutId);

      // ACTION: Classify error as deadline-related or other failure
      // REASON: Deadline errors should be handled differently than 404s or 500s
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new DeadlineExceededError(
          \`Request to \${path} exceeded deadline (remaining: \${remainingMs}ms)\`
        );
      }

      throw error;
    }
  }
}

// ============================================================
// Service A: Entry Point (Orchestrator)
// ============================================================

const serviceA = express();
serviceA.use(express.json());
serviceA.use(deadlineMiddleware(5000)); // 5 second default deadline

const serviceBClient = new DeadlineAwareClient('http://localhost:3002');

serviceA.get('/api/aggregate', async (req: Request, res: Response) => {
  try {
    const context = (req as any).context as RequestContext;

    console.log(\`[Service A] Received request, deadline: \${new Date(context.deadlineMs).toISOString()}\`);
    console.log(\`[Service A] Remaining time: \${context.deadlineMs - Date.now()}ms\`);

    // ACTION: Perform local processing
    // REASON: Service A's own work consumes deadline budget
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate 200ms work

    // ACTION: Check deadline before expensive downstream call
    // REASON: If only 100ms remains, don't call Service B which needs 500ms
    const remainingBeforeCall = context.deadlineMs - Date.now();
    if (remainingBeforeCall < 500) {
      throw new DeadlineExceededError(
        \`Insufficient time (\${remainingBeforeCall}ms) for downstream call requiring 500ms\`
      );
    }

    // ACTION: Call Service B with deadline propagation
    // REASON: Service B sees the same deadline and can fail fast if time insufficient
    const dataFromB = await serviceBClient.get<{ message: string; data: string }>(
      '/api/process',
      context
    );

    res.json({
      source: 'Service A',
      downstream: dataFromB,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof DeadlineExceededError) {
      res.status(504).json({ error: 'DeadlineExceeded', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalError', message: (error as Error).message });
    }
  }
});

// ============================================================
// Service B: Intermediate Service
// ============================================================

const serviceB = express();
serviceB.use(express.json());
serviceB.use(deadlineMiddleware(5000));

const serviceCClient = new DeadlineAwareClient('http://localhost:3003');

serviceB.get('/api/process', async (req: Request, res: Response) => {
  try {
    const context = (req as any).context as RequestContext;

    console.log(\`[Service B] Received request, deadline: \${new Date(context.deadlineMs).toISOString()}\`);
    console.log(\`[Service B] Remaining time: \${context.deadlineMs - Date.now()}ms\`);

    // ACTION: Perform processing work
    // REASON: Each service consumes part of the overall deadline budget
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate 300ms work

    // ACTION: Propagate deadline to next service in chain
    // REASON: Service C receives same absolute deadline, can calculate its
    //         own remaining time and fail fast if insufficient
    const dataFromC = await serviceCClient.get<{ value: string }>(
      '/api/data',
      context
    );

    res.json({
      message: 'Processed by Service B',
      data: dataFromC.value,
    });
  } catch (error) {
    if (error instanceof DeadlineExceededError) {
      res.status(504).json({ error: 'DeadlineExceeded', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalError', message: (error as Error).message });
    }
  }
});

// ============================================================
// Service C: Leaf Service
// ============================================================

const serviceC = express();
serviceC.use(express.json());
serviceC.use(deadlineMiddleware(5000));

serviceC.get('/api/data', async (req: Request, res: Response) => {
  try {
    const context = (req as any).context as RequestContext;

    console.log(\`[Service C] Received request, deadline: \${new Date(context.deadlineMs).toISOString()}\`);
    console.log(\`[Service C] Remaining time: \${context.deadlineMs - Date.now()}ms\`);

    // ACTION: Check remaining time before expensive operation
    // REASON: If only 50ms remains but database query takes 200ms, skip
    //         the query and fail fast instead of wasting database resources
    const remaining = context.deadlineMs - Date.now();
    if (remaining < 200) {
      throw new DeadlineExceededError(
        \`Insufficient time (\${remaining}ms) for database query requiring 200ms\`
      );
    }

    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 150));

    res.json({
      value: 'Data from Service C',
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof DeadlineExceededError) {
      res.status(504).json({ error: 'DeadlineExceeded', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalError', message: (error as Error).message });
    }
  }
});

// ============================================================
// Start Services
// ============================================================

serviceA.listen(3001, () => console.log('Service A on :3001'));
serviceB.listen(3002, () => console.log('Service B on :3002'));
serviceC.listen(3003, () => console.log('Service C on :3003'));

// ============================================================
// Example Usage
// ============================================================

// SUCCESS: Request completes within 5s deadline
// curl -H "X-Request-Deadline: $(node -e 'console.log(Date.now() + 5000)')" \\
//   http://localhost:3001/api/aggregate

// FAILURE: Deadline already exceeded
// curl -H "X-Request-Deadline: $(node -e 'console.log(Date.now() - 1000)')" \\
//   http://localhost:3001/api/aggregate

// FAILURE: Insufficient time remaining (only 100ms deadline)
// curl -H "X-Request-Deadline: $(node -e 'console.log(Date.now() + 100)')" \\
//   http://localhost:3001/api/aggregate`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete distributed deadline propagation across three microservices showing coordinated timeout behavior in a service mesh",
        prerequisites: [
          "Understanding of distributed systems and service-to-service communication",
          "HTTP request/response lifecycle and middleware patterns",
          "Absolute vs relative timestamps for deadline calculation",
          "Promise-based async patterns and error handling",
        ],
        systemPosition:
          "Deadline propagation sits at the application layer above individual request timeouts, coordinating timeout behavior across the entire distributed call chain from client through all service hops",
      },
      annotations: [
        {
          id: "deadline-header-constant",
          lines: [8, 9],
          action:
            "Define standard HTTP header for propagating deadline across services",
          reason:
            "Using a consistent header name (X-Request-Deadline) ensures all services in the system understand and respect the same deadline. Custom headers enable deadline propagation in HTTP-based systems without framework-level support like gRPC. The header carries an absolute timestamp, not a duration, preventing cumulative timeout drift.",
          contextLevel: "system",
          relatedConcepts: ["http-headers", "cross-service-coordination"],
        },
        {
          id: "deadline-extraction-middleware",
          lines: [30, 50],
          action:
            "Extract existing deadline from header or create new deadline for client requests",
          reason:
            "First service in chain (Service A receiving client request) establishes the deadline. Subsequent services (B, C) extract the existing deadline from headers. This distinction is crucial: if every service created its own deadline, you'd have timeout accumulation (Service A: 5s, Service B: 5s, Service C: 5s = 15s total). Shared deadline ensures coordinated timeout behavior.",
          contextLevel: "module",
          relatedConcepts: [
            "request-context",
            "deadline-establishment",
            "timeout-coordination",
          ],
        },
        {
          id: "deadline-validation",
          lines: [43, 50],
          action:
            "Validate deadline hasn't already passed before processing request",
          reason:
            "If deadline is in the past (due to network delay, clock skew, or slow upstream processing), fail immediately with 504 Gateway Timeout. Starting work on an expired deadline wastes resources—the caller has already given up. This fast-fail behavior prevents cascading resource exhaustion and provides clear error signals.",
          contextLevel: "module",
          relatedConcepts: ["fail-fast", "resource-protection"],
        },
        {
          id: "remaining-time-check",
          lines: [58, 67],
          action:
            "Calculate remaining time and fail if less than minimum threshold",
          reason:
            "Even if deadline is technically in the future, 50ms isn't enough time for meaningful work. Failing fast when remaining time is below threshold (100ms) prevents starting operations doomed to timeout mid-execution. This threshold accounts for network overhead, response serialization, and propagation delays.",
          contextLevel: "module",
          relatedConcepts: ["time-budget", "minimum-viable-time"],
        },
        {
          id: "context-attachment",
          lines: [69, 77],
          action:
            "Attach deadline context to request object for business logic access",
          reason:
            "Business logic needs deadline visibility to make intelligent decisions: skip expensive operations when time is short, choose fast path over slow path, prioritize critical work over optional enhancements. Attaching context to request makes deadline available throughout request lifecycle without passing it as parameter to every function.",
          contextLevel: "module",
          relatedConcepts: ["request-context", "deadline-awareness"],
        },
        {
          id: "deadline-propagation-client",
          lines: [105, 118],
          action:
            "Calculate remaining time and set timeout for downstream call accordingly",
          reason:
            "This is the core of deadline propagation: instead of using a static timeout (e.g., 5s for all downstream calls), calculate remaining time dynamically from the shared deadline. If Service A has 2s remaining, Service B's timeout is 2s (not 5s). This prevents Service B from wasting 3+ seconds on work Service A has already abandoned. The 50ms buffer accounts for network overhead.",
          contextLevel: "system",
          relatedConcepts: [
            "dynamic-timeout",
            "deadline-propagation",
            "time-budget-allocation",
          ],
        },
        {
          id: "deadline-header-propagation",
          lines: [124, 130],
          action:
            "Include absolute deadline in HTTP headers when calling downstream service",
          reason:
            "Propagating the same absolute deadline (not a recalculated relative timeout) ensures all services coordinate on the same deadline timestamp. If Service A's deadline is 14:30:15.500, Service B and Service C also use 14:30:15.500. This prevents clock drift and cumulative timeout errors that occur with relative timeouts at each hop.",
          contextLevel: "system",
          relatedConcepts: [
            "absolute-deadline",
            "cross-service-coordination",
            "header-propagation",
          ],
        },
        {
          id: "abort-controller-timeout",
          lines: [120, 123],
          action:
            "Use AbortController with calculated timeout to enforce deadline on HTTP request",
          reason:
            "AbortController provides precise request cancellation. When remaining time expires, abort() cancels the HTTP request mid-flight, preventing resource waste on doomed requests. The timeout is set to remaining time (minus buffer), ensuring the request respects the original deadline even if axios's internal timeout handling is imprecise.",
          contextLevel: "local",
          relatedConcepts: ["request-cancellation", "timeout-enforcement"],
        },
        {
          id: "service-local-work",
          lines: [168, 171],
          action: "Perform local processing which consumes deadline budget",
          reason:
            "Each service's local work (database queries, computation, I/O) consumes part of the overall deadline budget. Service A's 200ms processing leaves less time for downstream services. This demonstrates why deadline propagation matters: without it, Service B might try to do 5s of work even though only 4.8s remains in the overall budget.",
          contextLevel: "module",
          relatedConcepts: ["time-budget-consumption", "distributed-latency"],
        },
        {
          id: "pre-call-deadline-check",
          lines: [173, 180],
          action:
            "Check deadline before expensive downstream call to fail fast if insufficient time",
          reason:
            "If only 100ms remains but the downstream call typically takes 500ms, making the call is wasteful—it will timeout anyway. Checking remaining time before initiating downstream calls prevents wasted network traffic, connection pool exhaustion, and cascading failures. This is intelligent short-circuiting enabled by deadline awareness.",
          contextLevel: "module",
          relatedConcepts: [
            "fail-fast",
            "intelligent-short-circuit",
            "resource-preservation",
          ],
        },
        {
          id: "minimum-time-check-leaf",
          lines: [233, 241],
          action:
            "Leaf service checks if sufficient time remains before database operation",
          reason:
            "Even leaf services benefit from deadline awareness. If Service C receives a request with 50ms remaining but its database query takes 200ms, it should fail immediately rather than starting the query. This prevents database resource consumption on doomed queries and provides faster error feedback to upstream services.",
          contextLevel: "module",
          relatedConcepts: [
            "database-protection",
            "fail-fast",
            "deadline-awareness",
          ],
        },
      ],
      highlights: [
        {
          lines: [8, 9],
          sbvpDomain: "structure",
          label: "Standard header for cross-service deadline propagation",
        },
        {
          lines: [30, 67],
          sbvpDomain: "behavior",
          label:
            "Middleware extracts or creates deadline and validates sufficient time remains",
        },
        {
          lines: [87, 145],
          sbvpDomain: "structure",
          label:
            "Deadline-aware HTTP client that propagates deadline and enforces remaining time budget",
        },
        {
          lines: [105, 118],
          sbvpDomain: "behavior",
          label:
            "Dynamic timeout calculation based on remaining deadline time (not static timeout)",
        },
        {
          lines: [124, 130],
          sbvpDomain: "behavior",
          label:
            "Absolute deadline propagation via HTTP header to coordinate timeout across services",
        },
        {
          lines: [173, 180],
          sbvpDomain: "philosophy",
          label:
            "Intelligent short-circuiting: fail fast when insufficient time for downstream call",
        },
        {
          lines: [233, 241],
          sbvpDomain: "philosophy",
          label:
            "Leaf service deadline awareness prevents wasteful database operations",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "API Gateway Layer - Deadline propagation starts at the API gateway which establishes the initial deadline from client SLAs (e.g., 99th percentile = 500ms). The gateway extracts timeout requirements from client headers or SLA contracts, converts them to absolute deadline timestamps, and injects them into request metadata. Every downstream service receives this deadline via gRPC metadata or HTTP headers (X-Request-Deadline), enabling coordinated timeout behavior across the entire request path. Modern API gateways like Envoy, Istio, and Kong support deadline propagation natively, automatically calculating remaining time budgets and short-circuiting requests when deadlines are about to be exceeded. This placement is critical because the gateway sees all incoming requests and can establish organization-wide deadline policies, preventing downstream services from operating with inconsistent timeout assumptions that lead to wasted work.",
      "gRPC Service Mesh - In microservice architectures using gRPC, deadline propagation is the default behavior built into the protocol. When a client makes a gRPC call with context.WithDeadline(ctx, time.Now().Add(5*time.Second)), the absolute deadline timestamp is automatically serialized into the gRPC wire format (specifically the 'grpc-timeout' header as remaining milliseconds). Each service in the call chain (Service A → Service B → Service C) receives this deadline in its context.Context, can check time.Until(ctx.Deadline()) to see remaining budget, and automatically propagates the same deadline when making downstream gRPC calls. Service mesh sidecars like Envoy and Linkerd enhance this by adding visibility: they track deadline violations, measure time budget consumption per hop, and provide distributed tracing integration showing which service consumed what portion of the deadline budget. This placement leverages the RPC framework to enforce deadlines without requiring manual header propagation or timestamp calculations in business logic.",
      "Distributed Tracing Spans - Deadline propagation is tightly coupled with distributed tracing systems (Jaeger, Zipkin, OpenTelemetry) where each span carries both trace context and deadline information. When a request enters the system, the root span establishes the deadline (e.g., must complete by timestamp 1640000000500). Each subsequent span in the trace (representing service hops, database queries, cache lookups) inherits this deadline from its parent span context. Tracing systems use this to calculate time budget consumption: if Service A's span consumed 200ms and Service B's span consumed 300ms, only 4500ms remain of the original 5000ms deadline. Observability platforms visualize deadline propagation as a timeline showing which operations consumed how much of the total budget, enabling identification of time-consuming bottlenecks. This placement makes deadline awareness observable and debuggable, transforming it from an invisible runtime property into a first-class observability dimension alongside latency and error rates.",
      "Database Client Libraries - Advanced database drivers (PostgreSQL with statement_timeout, MongoDB with maxTimeMS, Cassandra with read_timeout_in_ms) support deadline propagation by allowing clients to set per-query timeouts derived from the remaining request deadline. When a service with 500ms remaining deadline needs to query a database, it sets statement_timeout = 400ms (reserving 100ms for network and response processing). This prevents the database from executing long-running queries that would exceed the request deadline, protecting both the database from wasted work and the service from timeout accumulation. The placement is at the driver/connection level: when establishing database connections, services calculate remaining deadline time and configure query timeouts accordingly. Modern drivers like pgx (PostgreSQL) and mongo-go-driver expose deadline-aware APIs (QueryContext(ctx) in Go) that automatically convert context.Context deadlines into database-specific timeout parameters.",
      "HTTP Client Middleware - For HTTP-based microservices without gRPC, deadline propagation is implemented as client middleware that intercepts outbound requests and injects deadline headers. The middleware reads the current request's deadline from framework context (req.context in Express, c.Request.Context() in Gin, HttpContext in ASP.NET), calculates remaining time, and adds X-Request-Deadline header with the absolute timestamp. Each service's HTTP server has corresponding middleware that extracts this header, validates it hasn't passed, and makes it available to business logic. Libraries like axios interceptors, fetch wrappers, and HttpClient DelegatingHandler provide standardized patterns for this. The placement is in infrastructure code: deadlines are propagated transparently without business logic awareness, similar to how distributed tracing context propagates. This enables deadline propagation in polyglot architectures where services use different languages/frameworks but agree on the HTTP header contract for deadline exchange.",
    ],
    architecturalBoundaries: [
      "Synchronous RPC Boundaries (gRPC, HTTP/REST, Thrift) - Deadline propagation is most critical at synchronous service-to-service boundaries where timeout accumulation is most severe. In a 10-hop service chain, without deadline propagation each service might have a 5-second timeout, creating a theoretical 50-second worst-case latency. With deadline propagation, all 10 services share the same 5-second deadline from the original request, ensuring coordinated timeout behavior. The architectural boundary is the RPC framework: gRPC has native deadline support via context.Context and grpc-timeout metadata, HTTP requires custom headers (X-Request-Deadline), and Thrift supports deadline propagation via THeader transport. Systems cross this boundary by serializing absolute deadline timestamps into wire format (protobuf, JSON, Thrift) and deserializing them on the receiving side. Not all RPC protocols support deadline propagation equally—JSON-RPC and XML-RPC require custom extensions, while modern frameworks like gRPC and Cap'n Proto have first-class support.",
      "Asynchronous Message Queue Boundaries - Deadline propagation becomes more nuanced in asynchronous systems like Kafka, RabbitMQ, and SQS where requests are decoupled from responses. The architectural boundary is the message envelope: deadlines are embedded in message headers (Kafka headers, AMQP properties, SQS message attributes) along with trace context. However, the semantics differ from synchronous RPC—asynchronous deadlines represent 'process by' timestamps rather than 'respond by' timestamps. For example, an order processing message might have a deadline of 'process within 5 minutes,' allowing consumers to skip processing if the deadline has passed (e.g., flash sale ended, user already canceled). Dead letter queues (DLQs) are the typical boundary for deadline violations: messages exceeding their deadline move to a DLQ for manual inspection rather than continuing to consume worker resources. This pattern prevents queue backlog from causing workers to process stale, irrelevant messages.",
      "Inter-Cluster/Multi-Region Boundaries - When requests span multiple Kubernetes clusters, AWS regions, or data centers, deadline propagation must account for clock skew and network latency variability. The architectural boundary is the network partition: requests leaving one cluster (us-east-1) for another (eu-west-1) may experience 100-200ms baseline latency. Deadline propagation here requires NTP clock synchronization across regions (±50ms is typical) and deadline validation at cluster boundaries. Service meshes like Istio with multi-cluster support automatically adjust deadlines for cross-region calls: if 5s deadline remains but cross-region call typically takes 200ms, the mesh allocates 4.8s to the local cluster and 200ms to the remote cluster. Load balancers at cluster boundaries (Envoy, HAProxy) validate incoming deadlines and reject requests that have already exceeded their deadline, preventing cross-region traffic for doomed requests.",
      "Database Transaction Boundaries - Within database transactions, deadline propagation translates to statement timeouts and transaction timeouts that respect the overall request deadline. The architectural boundary is the connection pool and transaction lifecycle: when acquiring a connection from the pool, the remaining request deadline determines the connection timeout. Once in a transaction, each SQL statement receives a statement_timeout calculated from remaining deadline budget. Long-running transactions (e.g., SERIALIZABLE isolation level in PostgreSQL) can violate deadlines if not carefully managed—a query starting with 1s remaining deadline might acquire locks that block other queries, causing cascading deadline violations. Advanced patterns use SAVEPOINT and deadline checks between statements, rolling back to the savepoint if a deadline is about to be exceeded rather than letting the entire transaction fail.",
    ],
    interactsWith: [
      "timeout",
      "request-timeout",
      "circuit-breaker",
      "bulkhead",
      "distributed-tracing",
      "priority-queue",
      "backpressure",
      "retry",
    ],
  },

  implementations: [
    {
      id: "grpc-deadline",
      name: "gRPC Context Deadline",
      type: "framework",
      languages: ["go", "java", "python", "cpp", "csharp", "nodejs"],
      description:
        "gRPC's built-in deadline propagation via context.Context in Go and equivalent mechanisms in other languages. The deadline is automatically serialized into the 'grpc-timeout' header and propagated across service boundaries. Each service receives the deadline in its request context and can check remaining time or propagate it to downstream calls.",
      links: {
        docs: "https://grpc.io/docs/guides/deadlines/",
        github: "https://github.com/grpc/grpc-go",
      },
      codeSnippet: `// Go gRPC client with deadline propagation
import (
    "context"
    "time"
    "google.golang.org/grpc"
)

// Client establishes deadline
ctx, cancel := context.WithDeadline(context.Background(),
    time.Now().Add(5*time.Second))
defer cancel()

// Deadline automatically propagates in gRPC metadata
response, err := client.GetUser(ctx, &pb.GetUserRequest{Id: "123"})
if err != nil {
    if status.Code(err) == codes.DeadlineExceeded {
        log.Println("Request exceeded deadline")
    }
}

// Server receives deadline in context
func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    // Check remaining time before expensive operation
    deadline, ok := ctx.Deadline()
    if ok && time.Until(deadline) < 100*time.Millisecond {
        return nil, status.Error(codes.DeadlineExceeded,
            "Insufficient time remaining")
    }

    // Deadline propagates to downstream gRPC call
    userData, err := s.userClient.GetUserData(ctx, &pb.UserDataRequest{
        UserId: req.Id,
    })

    return &pb.User{Id: req.Id, Data: userData}, nil
}

// Python gRPC deadline
import grpc
from datetime import datetime, timedelta

# Client sets deadline (absolute timestamp)
deadline = datetime.utcnow() + timedelta(seconds=5)
response = stub.GetUser(user_pb2.GetUserRequest(id="123"),
                       timeout=5.0)  # gRPC converts to deadline

// Java gRPC deadline
Context.current()
    .withDeadlineAfter(5, TimeUnit.SECONDS, scheduler)
    .run(() -> {
        UserResponse response = stub.getUser(
            GetUserRequest.newBuilder().setId("123").build()
        );
    });`,
    },
    {
      id: "go-context-deadline",
      name: "Go context.WithDeadline",
      type: "library",
      languages: ["go"],
      description:
        "Go's standard library context package provides first-class deadline propagation. context.WithDeadline creates a context that carries an absolute deadline timestamp. This context flows through function calls, and any operation can check ctx.Deadline() or wait for <-ctx.Done() to detect deadline expiration.",
      links: {
        docs: "https://pkg.go.dev/context#WithDeadline",
      },
      codeSnippet: `package main

import (
    "context"
    "fmt"
    "time"
)

// Deadline propagates through entire call stack
func processRequest(ctx context.Context) error {
    // Extract deadline from context
    deadline, ok := ctx.Deadline()
    if !ok {
        return fmt.Errorf("no deadline set")
    }

    remaining := time.Until(deadline)
    fmt.Printf("Remaining time: %v\\n", remaining)

    // Fail fast if insufficient time
    if remaining < 100*time.Millisecond {
        return fmt.Errorf("insufficient time remaining: %v", remaining)
    }

    // Propagate deadline to database query
    if err := queryDatabase(ctx); err != nil {
        return err
    }

    // Propagate deadline to downstream service
    return callDownstream(ctx)
}

func queryDatabase(ctx context.Context) error {
    // Database driver respects context deadline
    // If deadline exceeded, query is cancelled
    rows, err := db.QueryContext(ctx,
        "SELECT * FROM users WHERE active = true")
    if err != nil {
        return err
    }
    defer rows.Close()

    // Process rows...
    return nil
}

func callDownstream(ctx context.Context) error {
    // HTTP client respects context deadline
    req, _ := http.NewRequestWithContext(ctx,
        "GET", "http://api.example.com/data", nil)

    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    return nil
}

// Usage
func main() {
    // Establish absolute deadline: now + 5 seconds
    ctx, cancel := context.WithDeadline(context.Background(),
        time.Now().Add(5*time.Second))
    defer cancel()

    if err := processRequest(ctx); err != nil {
        fmt.Printf("Request failed: %v\\n", err)
    }
}`,
    },
    {
      id: "envoy-timeout-budget",
      name: "Envoy Proxy Timeout Budget",
      type: "platform",
      languages: ["yaml"],
      description:
        "Envoy proxy (used in Istio, AWS App Mesh, Consul Connect) implements deadline propagation via timeout budgets. The x-envoy-upstream-rq-timeout-ms header propagates remaining time across service mesh boundaries. Envoy tracks time spent in each hop and adjusts downstream timeouts accordingly.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#x-envoy-upstream-rq-timeout-ms",
      },
      codeSnippet: `# Envoy route configuration with timeout budget
routes:
- match:
    prefix: "/api"
  route:
    cluster: backend_service
    timeout: 5s  # Total request timeout
    # Envoy automatically propagates remaining time via headers

    # Advanced: Per-retry timeout budget
    retry_policy:
      retry_on: "5xx"
      num_retries: 3
      per_try_timeout: 1s  # Each retry gets 1s max

# Envoy config for deadline-aware load balancing
clusters:
- name: backend_service
  connect_timeout: 0.5s  # Connection timeout
  per_connection_buffer_limit_bytes: 32768

  # Circuit breaker with deadline awareness
  circuit_breakers:
    thresholds:
    - max_pending_requests: 1024
      max_requests: 1024

# HTTP filter to add deadline header
http_filters:
- name: envoy.filters.http.router
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
    # Inject x-envoy-upstream-rq-timeout-ms with remaining time
    upstream_log:
    - name: envoy.access_loggers.file
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
        path: "/dev/stdout"

# Receiving service extracts deadline from Envoy header
# Example in application code:
# const deadlineMs = parseInt(req.headers['x-envoy-upstream-rq-timeout-ms'])
# const remainingMs = deadlineMs - (Date.now() - requestStartTime)`,
    },
    {
      id: "opentelemetry-deadline",
      name: "OpenTelemetry Deadline Propagation",
      type: "library",
      languages: ["go", "java", "python", "javascript", "csharp"],
      description:
        "OpenTelemetry supports deadline propagation via span context. Deadline information can be stored in baggage or span attributes, propagating alongside distributed tracing context. This enables observability platforms to visualize deadline consumption across service hops.",
      links: {
        docs: "https://opentelemetry.io/docs/concepts/context-propagation/",
        github: "https://github.com/open-telemetry/opentelemetry-specification",
      },
      codeSnippet: `// Go: OpenTelemetry with deadline in span context
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/baggage"
    "go.opentelemetry.io/otel/trace"
)

func processWithDeadline(ctx context.Context) error {
    tracer := otel.Tracer("my-service")
    ctx, span := tracer.Start(ctx, "process-request")
    defer span.End()

    // Extract deadline from parent context
    deadline, ok := ctx.Deadline()
    if ok {
        // Store deadline in span attributes for observability
        span.SetAttributes(
            attribute.Int64("deadline.timestamp", deadline.Unix()),
            attribute.Int64("deadline.remaining_ms",
                time.Until(deadline).Milliseconds()),
        )

        // Propagate deadline via baggage (cross-process)
        member, _ := baggage.NewMember("deadline",
            fmt.Sprintf("%d", deadline.Unix()))
        bag, _ := baggage.New(member)
        ctx = baggage.ContextWithBaggage(ctx, bag)
    }

    // Downstream service extracts deadline from baggage
    return callDownstream(ctx)
}

// JavaScript/TypeScript: OpenTelemetry deadline
import { trace, context, propagation } from '@opentelemetry/api';

function processRequest(req, res) {
    const span = trace.getTracer('my-service')
        .startSpan('process-request');

    // Extract deadline from header
    const deadlineMs = parseInt(req.headers['x-request-deadline']);
    const remainingMs = deadlineMs - Date.now();

    // Add deadline to span for observability
    span.setAttribute('deadline.remaining_ms', remainingMs);

    // Propagate via headers to downstream
    const headers = {};
    propagation.inject(context.active(), headers);
    headers['x-request-deadline'] = deadlineMs.toString();

    // Make downstream call with propagated deadline
    fetch('http://downstream-service/api', { headers });
}

// Python: OpenTelemetry deadline propagation
from opentelemetry import trace, baggage

tracer = trace.get_tracer(__name__)

def process_request(ctx):
    with tracer.start_as_current_span("process-request") as span:
        # Extract deadline from context
        deadline = ctx.get("deadline")
        remaining = deadline - time.time()

        span.set_attribute("deadline.remaining_seconds", remaining)

        # Propagate via baggage
        ctx = baggage.set_baggage("deadline", str(deadline), ctx)

        return call_downstream(ctx)`,
    },
    {
      id: "kubernetes-ingress-timeout",
      name: "Kubernetes Nginx Ingress Deadline",
      type: "platform",
      languages: ["yaml"],
      description:
        "Kubernetes Nginx Ingress Controller supports deadline propagation via proxy-connect-timeout, proxy-send-timeout, and proxy-read-timeout annotations. Can inject custom headers with remaining time budgets for downstream services.",
      links: {
        docs: "https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#custom-timeouts",
      },
      codeSnippet: `# Kubernetes Ingress with deadline propagation annotations
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway
  annotations:
    # Total request timeout (deadline)
    nginx.ingress.kubernetes.io/proxy-read-timeout: "30"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "30"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "5"

    # Add custom header with deadline timestamp
    nginx.ingress.kubernetes.io/configuration-snippet: |
      set $deadline_ms \${msec}000 + 30000;
      proxy_set_header X-Request-Deadline $deadline_ms;

    # Enable request ID for tracing
    nginx.ingress.kubernetes.io/enable-cors: "true"

spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8080

---
# ConfigMap for global Nginx config with deadline logic
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-configuration
data:
  http-snippet: |
    # Calculate and inject deadline for all requests
    map $msec $request_deadline {
      default "\${msec}000+30000";
    }

  proxy-set-headers: |
    X-Request-Deadline: $request_deadline;
    X-Request-Start: $msec;`,
    },
  ],

  usedInSystems: [
    {
      systemId: "google-search",
      systemName: "Google Search Infrastructure",
      howUsed:
        "Google pioneered deadline propagation in their internal RPC framework (Stubby, predecessor to gRPC) to prevent timeout accumulation in deep service call chains. A search query at Google fans out to hundreds of backend services (index servers, spell check, autocomplete, ads, knowledge graph), each making further downstream calls—creating call graphs 5-10 hops deep. Without deadline propagation, timeouts would accumulate (10 services × 100ms timeout = 1s worst case), violating Google's <200ms P99 latency SLA. With deadline propagation, the frontend establishes a 150ms deadline from the user's request. This absolute deadline flows through every service hop via Stubby RPC metadata. Services deep in the call graph see remaining budgets like 20ms and intelligently skip expensive operations (e.g., 'don't call knowledge graph if <30ms remaining'). When a leaf service receives a request with 5ms remaining, it immediately returns a deadline exceeded error rather than starting database queries, preventing wasted work on 95% of resources in that call path. Google's production systems add deadline slack (10-20% buffer) to account for clock skew across data centers and queueing delays. The pattern enabled Google to maintain sub-200ms search latency despite massively distributed architectures with hundreds of microservices per query. Pattern composition: Deadline Propagation + Hedged Requests + Adaptive Deadline Allocation + Priority Queues. Impact: Reduced tail latency by 60% by eliminating timeout accumulation; prevented cascading failures during partial outages by failing fast; enabled intelligent resource allocation where critical services get larger deadline budgets.",
      source:
        "https://sre.google/sre-book/handling-overload/ (Google SRE Book - Chapter 21: Handling Overload)",
    },
    {
      systemId: "uber-ringpop",
      systemName: "Uber Ringpop (Distributed Hash Ring)",
      howUsed:
        "Uber's Ringpop service discovery and routing layer uses deadline propagation to prevent timeout accumulation in multi-hop request forwarding. When a request enters Uber's system (e.g., 'find nearby drivers'), it hits a random node in the Ringpop cluster. That node might not own the hash key for the request, so it forwards the request to the correct node based on consistent hashing—potentially multiple hops away (3-5 hops in large clusters). Without deadline propagation, each hop could have a 1-second timeout, creating a 5-second worst-case latency. Ringpop implements deadline propagation via TChannel protocol (Uber's RPC framework) where the initial request sets a deadline (e.g., 500ms), and each forwarding hop checks the remaining budget. If a node receives a request with only 50ms remaining but forwarding takes 30ms + processing takes 100ms, it immediately returns a timeout error rather than forwarding. This prevents wasted network hops and CPU cycles on requests guaranteed to timeout. Ringpop also uses deadline information for priority routing: requests with tight deadlines (<100ms remaining) bypass rate limiting and get priority in processing queues. During Uber's peak hours (Friday nights), deadline propagation prevents request storms—when one region is overloaded, requests that would timeout anyway fail fast at the edge instead of consuming resources throughout the forwarding chain. Pattern composition: Deadline Propagation + Consistent Hashing + Priority Queues + Adaptive Rate Limiting. Impact: Reduced cross-region request forwarding latency by 40%; prevented cascading failures during regional outages; improved user experience with predictable timeout behavior (500ms max, not variable based on hop count).",
      source:
        "https://eng.uber.com/ringpop-open-source-nodejs-library/ (Uber Engineering Blog)",
    },
    {
      systemId: "twitter-finagle",
      systemName: "Twitter Finagle RPC Framework",
      howUsed:
        "Twitter's Finagle RPC framework implements deadline propagation via request context deadlines that automatically flow through service boundaries. When a tweet is posted, it triggers a cascade of operations: fanout to followers' timelines (potentially millions), spam detection, URL expansion, media processing, analytics ingestion—often 20+ service hops deep. Each service in the chain receives a Finagle request context containing the absolute deadline (e.g., 'must complete by 14:30:15.500 UTC'). Services use ctx.deadline.remaining to check available time budget before initiating expensive operations. For example, the timeline fanout service checks if enough time remains to fanout to all followers—if only 100ms remains but fanout takes 500ms, it switches to async fanout (posts tweet immediately, fanouts eventually) rather than blocking the user's post request. Finagle's deadline propagation integrates with Twitter's distributed tracing (Zipkin)—each trace span shows deadline consumption, helping engineers identify services that consume disproportionate deadline budget. During Twitter's massive traffic spikes (elections, sports events, breaking news), deadline propagation prevents cascading failures: when backend services slow down, requests with tight deadlines fail fast at the edge instead of piling up throughout the system. Finagle also implements deadline-aware load balancing: requests with <50ms remaining bypass slow instances (P99 > 100ms) in favor of fast instances (P99 < 30ms), improving the chances of meeting the deadline. Pattern composition: Deadline Propagation + Hedging + Distributed Tracing + Deadline-Aware Load Balancing + Circuit Breakers. Impact: Reduced P99 latency during traffic spikes by 50%; prevented timeline unavailability during viral events; enabled intelligent degradation (async fanout instead of synchronous blocking).",
      source:
        "https://twitter.github.io/finagle/guide/Contexts.html (Finagle Documentation - Context and Deadlines)",
    },
    {
      systemId: "aws-xray-deadlines",
      systemName: "AWS X-Ray Distributed Tracing with Deadline Tracking",
      howUsed:
        "AWS X-Ray supports deadline tracking in distributed traces across Lambda, ECS, EKS, and EC2-based microservices. While X-Ray doesn't enforce deadlines, it propagates deadline metadata in trace segments and subsegments, enabling observability into deadline consumption patterns. When a request enters an AWS API Gateway with a 29-second Lambda timeout, the deadline (now + 29s) is stored in X-Ray segment metadata. Each downstream service (Lambda calling DynamoDB calling another Lambda calling S3) creates subsegments that record when they started and how much deadline budget remained. X-Ray's service map visualizes deadline consumption as a color gradient: services consuming >50% of remaining deadline show red, 25-50% show yellow, <25% show green. This helps teams identify 'deadline hogs'—services that consistently consume excessive time budget. AWS AppSync GraphQL resolvers use X-Ray deadline metadata to implement field-level deadline budgeting: if a GraphQL query has 1s deadline and 5 fields, each field resolver gets ~200ms budget. Resolvers that exceed their budget are cancelled (via Lambda timeout or ECS task kill), and partial results are returned. AWS Step Functions state machines use deadline propagation to implement timeout behavior across long-running workflows: each state checks the overall workflow deadline and fails fast if exceeded rather than starting new tasks. During AWS service events (RDS failover, Lambda cold starts), deadline propagation prevents request pileup by failing fast when infrastructure delays consume too much deadline budget. Pattern composition: Deadline Propagation + Distributed Tracing + Partial Results + Timeout Budgeting + Observable Deadline Consumption. Impact: Reduced Lambda timeout errors by 35% through deadline visibility; enabled GraphQL field-level timeout budgeting preventing slow resolvers from blocking fast ones; improved debugging of timeout issues with per-service deadline consumption metrics.",
      source:
        "https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-tracingheader (AWS X-Ray Developer Guide)",
    },
    {
      systemId: "cloudflare-workers-deadline",
      systemName: "Cloudflare Workers Edge Computing Deadline",
      howUsed:
        "Cloudflare Workers (serverless edge compute) implements strict CPU-time deadlines that propagate through subrequest chains to prevent runaway scripts from consuming excessive edge resources. Each Worker invocation has a 50ms CPU-time deadline (configurable up to 30s with Business/Enterprise plans). When a Worker makes a fetch() subrequest to an origin server or another Worker, the remaining CPU-time deadline is calculated and sent via CF-Worker-Deadline header. Downstream Workers extract this header and abort processing if insufficient time remains. This is critical at the edge: a single runaway Worker could impact thousands of concurrent requests sharing the same edge server. Cloudflare's deadline enforcement is precise—after 50ms CPU time (not wall-clock time), the Worker is terminated mid-execution, event preventing fetch() completion. To handle deadline pressure, Workers use streaming responses (ReadableStream) to incrementally send data as it's generated, allowing partial results if deadline is exceeded. Cloudflare's Durable Objects (stateful edge compute) use deadline propagation for multi-object transactions: if a transaction spans 5 Durable Objects and each object operation consumes 8ms, the coordinator checks if 40ms remains before starting the transaction. During DDoS attacks when edge servers are under extreme load, deadline enforcement prevents CPU exhaustion—attackers can't submit complex Workers that consume excessive CPU, as they're killed after 50ms regardless of attack sophistication. Cloudflare Workers' deadline propagation also applies to KV and R2 storage access: if only 10ms remains in the Worker deadline, KV reads timeout after 10ms instead of the default 1s timeout. Pattern composition: Deadline Propagation + CPU-Time Budgeting + Streaming Responses + Multi-Object Transactions + DDoS Mitigation. Impact: Prevented CPU exhaustion attacks by enforcing strict per-request deadlines; enabled complex edge computing while maintaining <10ms P99 latency for simple requests; improved fairness by preventing slow Workers from starving fast Workers of CPU time.",
      source:
        "https://developers.cloudflare.com/workers/platform/limits/ (Cloudflare Workers Platform Limits)",
    },
  ],

  references: [
    {
      title: "Google SRE Book - Handling Overload (Deadline Propagation)",
      url: "https://sre.google/sre-book/handling-overload/",
      type: "documentation",
      author: "Google SRE Team",
    },
    {
      title: "gRPC Deadlines - Best Practices and Implementation",
      url: "https://grpc.io/docs/guides/deadlines/",
      type: "documentation",
      author: "gRPC Authors (Google)",
    },
    {
      title: "Twitter Finagle - Context Propagation and Deadlines",
      url: "https://twitter.github.io/finagle/guide/Contexts.html",
      type: "documentation",
      author: "Twitter Engineering",
    },
    {
      title: "Uber Ringpop - Deadline-Aware Request Forwarding",
      url: "https://eng.uber.com/ringpop-open-source-nodejs-library/",
      type: "article",
      author: "Uber Engineering",
    },
    {
      title:
        "Distributed Systems Observability (O'Reilly) - Chapter on Deadline Tracking",
      url: "https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/",
      type: "book",
      author: "Cindy Sridharan",
    },
  ],

  philosophy: {
    coreProblem:
      "In distributed systems with deep call chains, independent per-service timeouts accumulate into unacceptable end-to-end latency, and services waste resources processing requests that upstream callers have already abandoned",
    designPrinciple:
      "Establish a single absolute deadline at request ingress and propagate it through all service hops, enabling coordinated timeout behavior and intelligent short-circuiting when insufficient time remains",
    historicalContext:
      "Deadline propagation was pioneered by Google in the early 2000s for their Stubby RPC framework (gRPC's predecessor) to solve timeout accumulation in search query processing across hundreds of backend services. Google's search architecture required sub-200ms P99 latency despite 5-10 hop call chains, which was impossible with per-service timeouts (10 services × 50ms = 500ms minimum). By propagating absolute deadlines, Google enabled services to intelligently skip expensive operations when time was scarce, transforming latency from cumulative to coordinated. This pattern became foundational to gRPC and influenced modern RPC frameworks (Finagle, Thrift, Cap'n Proto). The rise of microservices (2010s) made deadline propagation critical—without it, the 'microservices timeout death spiral' (20 services × 5s timeout = 100s worst case) became a common failure mode. Cloud-native architectures now treat deadline propagation as essential infrastructure, with Kubernetes service meshes (Istio, Linkerd) and serverless platforms (Cloudflare Workers, Lambda) implementing it by default.",
    alternativesRejected: [
      "Per-hop relative timeouts - Causes timeout accumulation where 10 services with 1s timeout = 10s total latency. Services deep in call chain waste resources on requests whose callers already timed out.",
      "Global static timeout - Inflexible and wasteful. Different request types have different latency requirements (real-time vs batch), but global timeout treats all requests identically.",
      "No timeouts - Leads to indefinite resource consumption. Slow or hung services block threads/connections forever, causing cascading failures and resource exhaustion.",
      "Client-side timeout only - Client times out and abandons request, but all intermediate services continue processing, wasting CPU, memory, database connections, and network bandwidth on work that will never be used.",
      "Timeout at each layer (application, load balancer, service mesh) - Creates conflicting timeout policies. If load balancer has 5s timeout but service has 10s timeout, inconsistent behavior confuses debugging and wastes resources.",
    ],
    mentalModel:
      "Deadline propagation is like a relay race where the total race time is fixed (e.g., 10 minutes to complete all 4 legs). Each runner can see the race clock and knows the absolute finish deadline (2:30 PM). Runner 1 takes 2 minutes, leaving 8 minutes for runners 2-4. Runner 2 sees 8 minutes on the clock and runs accordingly. If Runner 3 receives the baton with only 1 minute left but their leg takes 3 minutes, they don't run—the team has already lost, so running wastes energy. This is deadline propagation: all participants coordinate on a shared deadline rather than each runner having independent time limits (which would accumulate to 40 minutes if each leg had a 10-minute limit). The race clock is the absolute deadline timestamp, and each runner checking remaining time is like each service calculating deadline.remaining before starting work.",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant Client
    participant ServiceA
    participant ServiceB
    participant ServiceC

    Note over Client: Establish deadline:<br/>now + 5000ms
    Client->>ServiceA: deadline=T+5000ms (5000ms remaining)
    Note over ServiceA: Process: 200ms consumed
    Note over ServiceA: Check: 4800ms remaining ✓

    ServiceA->>ServiceB: deadline=T+5000ms (4800ms remaining)
    Note over ServiceB: Process: 1000ms consumed
    Note over ServiceB: Check: 3800ms remaining ✓

    ServiceB->>ServiceC: deadline=T+5000ms (3800ms remaining)
    Note over ServiceC: Check: <100ms threshold
    Note over ServiceC: SKIP expensive operation
    ServiceC-->>ServiceB: Error: Insufficient time

    ServiceB-->>ServiceA: Partial result
    ServiceA-->>Client: Success (2700ms remaining)

    Note over Client,ServiceC: Total time: 2300ms (under 5000ms deadline)`,
    realWorldAnalogy:
      "Deadline propagation is like a group of friends trying to catch a 3:00 PM train. Everyone knows the absolute deadline (3:00 PM), not relative times ('we have 30 minutes'). Friend A stops at coffee (uses 10 minutes), leaving 20 minutes for B and C. Friend B sees the clock and skips the bookstore (would take 30 minutes, but only 20 remain). Friend C arrives at the platform with 5 minutes to spare. Without the shared deadline, Friend B might think 'I have 30 minutes' (their personal budget) and miss the train, even though the group deadline was already consumed by Friend A's coffee stop. The absolute deadline (3:00 PM train departure) coordinates everyone's behavior.",
    useCases: [
      {
        domain: "Search and Recommendation Systems",
        scenario:
          "Google Search uses deadline propagation to coordinate hundreds of backend services (index, spell check, ads, knowledge graph). A 150ms deadline flows through 5-10 service hops, with each service checking remaining time and skipping expensive operations when time is scarce (e.g., skip knowledge graph if <30ms remains).",
        patternRole:
          "Prevents timeout accumulation in deep call chains, enables intelligent degradation where non-critical features are skipped when deadlines are tight, maintains sub-200ms P99 latency despite massive distributed architecture.",
        companies: ["Google Search", "Bing", "Amazon Product Search"],
      },
      {
        domain: "API Gateways and Service Meshes",
        scenario:
          "Envoy proxy in Istio service mesh propagates deadline via x-envoy-upstream-rq-timeout-ms header. When a request enters the mesh with a 5s deadline, each service hop calculates remaining time and sets downstream timeouts accordingly. Services deep in the call graph receive requests with 500ms remaining and fail fast if their operations would exceed that budget.",
        patternRole:
          "Coordinates timeout behavior across polyglot microservices, prevents resource waste on doomed requests, enables intelligent load balancing (route to fast instances when deadline is tight), provides observability into deadline consumption per hop.",
        companies: ["Lyft (Envoy)", "Google (Istio)", "Linkerd Service Mesh"],
      },
      {
        domain: "Serverless and Edge Computing",
        scenario:
          "Cloudflare Workers enforce strict 50ms CPU-time deadlines that propagate through subrequest chains. When Worker A makes a fetch() to Worker B with 30ms remaining, Worker B extracts the deadline and aborts processing if insufficient time remains. During DDoS attacks, this prevents CPU exhaustion from complex attacker-submitted Workers.",
        patternRole:
          "Prevents runaway scripts from consuming excessive edge resources, enables complex multi-Worker chains while maintaining low latency, provides fairness (prevents slow Workers from starving fast ones), mitigates resource exhaustion attacks.",
        companies: [
          "Cloudflare Workers",
          "AWS Lambda (implicit timeout)",
          "Fastly Compute@Edge",
        ],
      },
      {
        domain: "Database and Storage Systems",
        scenario:
          "PostgreSQL with statement_timeout derived from request deadline. A service with 500ms remaining deadline sets statement_timeout=400ms (reserving 100ms for network and processing). Prevents long-running queries from exceeding request deadlines, protects database from wasted work on queries whose callers have already timed out.",
        patternRole:
          "Translates request-level deadlines into database-level timeouts, prevents database resource exhaustion from slow queries on abandoned requests, enables intelligent query planning (choose fast index scan if deadline is tight, slow sequential scan if time permits).",
        companies: [
          "PostgreSQL",
          "MongoDB (maxTimeMS)",
          "Cassandra (read_timeout_in_ms)",
        ],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "timeout",
    "distributed-systems",
    "grpc",
    "microservices",
    "latency",
    "deadline",
  ],
  difficulty: "advanced",
};
