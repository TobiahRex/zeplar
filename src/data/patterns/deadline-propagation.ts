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
};
