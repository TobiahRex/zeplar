import type { Pattern } from "../schema";

export const requestTimeout: Pattern = {
  id: "request-timeout",
  slug: "request-timeout",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → ⏱️ Timeout → 🎯 Request Timeout",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Timeout",
    level: 4,
  },

  concept: {
    name: "Request Timeout",
    emoji: "🎯",
    tagline: "Total operation time",
    definition:
      "The Request Timeout pattern establishes an end-to-end time limit for complete request processing, from initial invocation through all downstream calls to final response. Unlike connection or read timeouts that govern individual I/O operations, request timeout acts as an umbrella deadline covering the entire operation chain. Think of it like a basketball shot clock that limits total possession time, not just individual dribbles or passes. When a client initiates a request with a 5-second request timeout, the entire call graph—including network round trips, service processing, database queries, and cascading downstream calls—must complete within that budget. If the deadline expires, the request is immediately cancelled, resources are freed, and an explicit timeout error returns to the caller. This pattern is particularly critical in distributed systems where a single user request might traverse dozens of microservices: each hop consumes time, and without a global timeout, the request could take indefinitely long as timeouts accumulate at each layer. Modern implementations often attach deadline metadata to requests (gRPC deadline propagation, HTTP headers), allowing downstream services to check remaining time and fail fast if insufficient budget remains. This enables intelligent short-circuiting: a service receiving a request with only 100ms remaining can immediately return a timeout rather than initiating expensive operations doomed to exceed the deadline.",
    problemSolved:
      "In complex microservice architectures, a single user request often fans out into dozens of downstream calls, each with its own timeout. Without request-level timeouts, these per-hop timeouts accumulate: Service A calls Service B with 3s timeout, which calls Service C with 3s timeout, which calls Service D with 3s timeout—the total worst-case latency becomes 9 seconds even though each individual timeout is reasonable. This timeout accumulation creates unpredictable user-facing latency and makes SLA management impossible. Additionally, long-running requests consume resources (threads, connections, memory) throughout their lifetime. A request stuck waiting for multiple slow downstream calls ties up resources at every layer, reducing overall system capacity. Request Timeout solves this by imposing a hard deadline from the client's perspective: regardless of how many hops or layers exist, the total operation must complete within the specified time. This transforms cumulative timeouts into a bounded total time, enables predictable SLA enforcement, and ensures timely resource reclamation even in complex call chains. Deadline propagation further optimizes by communicating remaining time to downstream services, allowing them to skip expensive work when insufficient time remains.",
    tradeoffs: {
      pros: [
        "Provides predictable end-to-end latency regardless of call chain depth",
        "Prevents timeout accumulation across multiple service hops",
        "Enables SLA enforcement at request granularity",
        "Facilitates resource cleanup by bounding total operation time",
        "Allows downstream services to fail fast when deadline is nearly exhausted",
      ],
      cons: [
        "Requires infrastructure support for deadline propagation",
        "May abort requests that would eventually succeed if timeout is too aggressive",
        "Adds complexity in determining appropriate timeout values",
        "Clock skew between services can cause incorrect deadline calculations",
        "Cancellation logic must be implemented at all layers for effectiveness",
      ],
    },
    relatedPatterns: [
      "timeout",
      "deadline-propagation",
      "connection-timeout",
      "read-timeout",
      "write-timeout",
      "circuit-breaker",
      "bulkhead",
    ],
  },

  structure: {
    participants: [
      {
        name: "Request Manager",
        role: "Timeout Orchestrator",
        responsibilities: [
          "Start timeout timer when request begins",
          "Track overall request duration across all operations",
          "Cancel all downstream operations if timeout exceeded",
          "Cleanup resources when request completes or times out",
        ],
      },
      {
        name: "Timeout Timer",
        role: "Deadline Enforcer",
        responsibilities: [
          "Monitor elapsed time since request start",
          "Trigger timeout error if duration exceeds limit",
          "Cancel timer if request completes successfully",
        ],
      },
      {
        name: "Operation Chain",
        role: "Request Executor",
        responsibilities: [
          "Execute connection establishment, data transfer, processing",
          "Respond to cancellation signals from timeout",
          "Complete within overall request timeout budget",
        ],
      },
    ],
    diagram: `graph TB
    Start([Client Initiates Request]) --> StartTimer[⏱️ Start Request Timeout Timer<br/>T = 5s]
    StartTimer --> Connect[TCP Connection<br/>200ms]
    Connect --> Send[Send Request<br/>50ms]
    Send --> Process[Server Processing<br/>1.5s]
    Process --> Receive[Receive Response<br/>300ms]
    Receive --> Parse[Parse Response<br/>100ms]

    StartTimer -.->|5s elapsed| Timeout{Timeout Fires?}
    Parse --> Check{Completed<br/>in time?}

    Check -->|Yes: 2.15s total| Success[Cancel Timer]
    Success --> Return([Return Response])

    Check -->|No: > 5s| Timeout
    Timeout --> Abort[Abort All Operations]
    Abort --> Error([Throw TimeoutError])

    style Start fill:#e1f5e1
    style Return fill:#e1f5e1
    style Error fill:#ffe1e1
    style StartTimer fill:#fff4e1
    style Timeout fill:#ffe1e1`,
    flow: [
      {
        step: 1,
        actor: "Request Manager",
        action: "Initialize Request",
        description:
          "Begin request and start timeout timer with configured duration (e.g., 5 seconds)",
      },
      {
        step: 2,
        actor: "Operation Chain",
        action: "Establish Connection",
        description:
          "Connect to server (consumes part of 5s budget, e.g., 200ms)",
      },
      {
        step: 3,
        actor: "Operation Chain",
        action: "Send Request Data",
        description:
          "Transmit request to server (consumes additional budget, e.g., 50ms)",
      },
      {
        step: 4,
        actor: "Operation Chain",
        action: "Wait for Processing",
        description:
          "Server processes request (major time consumer, e.g., 1-3s)",
      },
      {
        step: 5,
        actor: "Operation Chain",
        action: "Receive Response",
        description:
          "Download response data (consumes additional budget, e.g., 300ms)",
      },
      {
        step: 6,
        actor: "Timeout Timer",
        action: "Check Completion",
        description:
          "Verify total elapsed time < timeout. If exceeded, abort all operations",
      },
      {
        step: 7,
        actor: "Request Manager",
        action: "Return or Error",
        description:
          "Return response if completed in time, or throw TimeoutError if exceeded",
      },
    ],
    invariants: [
      "Request timeout must encompass entire operation: connect + send + process + receive",
      "Timeout duration must be >= connection timeout + read timeout",
      "All child operations must be cancellable when request timeout fires",
      "Timer must be cancelled if request completes successfully to prevent memory leaks",
      "Timeout error must cleanup all resources (connections, file handles, memory)",
    ],
  },

  codeExamples: [
    {
      id: "request-timeout-ts-comprehensive",
      language: "typescript",
      title: "End-to-End Request Timeout with AbortController",
      description:
        "Complete request timeout implementation covering the entire operation chain from connection through response processing",
      code: `import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Pool, PoolClient } from 'pg';

// ============================================================
// Request Timeout Types
// ============================================================

interface RequestTimeoutConfig {
  timeoutMs: number;
  connectionTimeoutMs?: number;
  readTimeoutMs?: number;
}

class RequestTimeoutError extends Error {
  public readonly elapsedMs: number;
  public readonly timeoutMs: number;

  constructor(message: string, elapsed: number, timeout: number) {
    super(message);
    this.name = 'RequestTimeoutError';
    this.elapsedMs = elapsed;
    this.timeoutMs = timeout;
  }
}

// ============================================================
// HTTP Request with End-to-End Timeout
// ============================================================

/**
 * ACTION: Implement request timeout that covers entire HTTP operation
 * REASON: Individual connection/read timeouts don't guarantee total duration.
 *         A request could take 30s total (5s connect + 25s read) while both
 *         individual timeouts are "reasonable". Request timeout sets hard
 *         limit on total operation time regardless of phase.
 */
class RequestTimeoutClient {
  private axios: AxiosInstance;
  private defaultTimeout: number;

  constructor(baseURL: string, defaultTimeoutMs: number = 5000) {
    this.defaultTimeout = defaultTimeoutMs;

    // ACTION: Configure axios instance with aggressive individual timeouts
    // REASON: Request timeout is overall limit, but connection/read timeouts
    //         provide granular control. If server never responds, connection
    //         timeout (3s) fails faster than request timeout (10s).
    this.axios = axios.create({
      baseURL,
      timeout: 0, // Disable axios's timeout, use AbortController instead
    });
  }

  /**
   * ACTION: Execute HTTP GET with end-to-end request timeout
   * REASON: Request timeout starts when method is called and ends when
   *         response is returned. Covers connection, send, server processing,
   *         receive, and response parsing—entire operation chain.
   */
  async get<T>(
    url: string,
    config: RequestTimeoutConfig = { timeoutMs: this.defaultTimeout }
  ): Promise<T> {
    const startTime = Date.now();
    const controller = new AbortController();

    // ACTION: Set timer for overall request timeout
    // REASON: AbortController enables cancelling request at any phase:
    //         during connection, while sending, waiting for response, or
    //         receiving data. Ensures total time never exceeds timeout.
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);

    try {
      const response = await this.axios.get<T>(url, {
        signal: controller.signal as any,
        ...config,
      });

      const elapsed = Date.now() - startTime;
      clearTimeout(timeoutId);

      console.log(\`✓ Request completed in \${elapsed}ms (timeout: \${config.timeoutMs}ms)\`);
      return response.data;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      clearTimeout(timeoutId);

      // ACTION: Distinguish timeout errors from other failures
      // REASON: Timeout errors are typically retry-able (server overloaded),
      //         while 404/500 errors are not. Detailed error helps callers
      //         make intelligent retry/fallback decisions.
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
          throw new RequestTimeoutError(
            \`Request to \${url} exceeded \${config.timeoutMs}ms timeout\`,
            elapsed,
            config.timeoutMs
          );
        }
        throw error;
      }

      throw error;
    }
  }

  /**
   * ACTION: Execute HTTP POST with request timeout and payload
   * REASON: POST operations include request body transmission which consumes
   *         additional time. Request timeout must account for body upload
   *         time, not just connection and response download.
   */
  async post<T>(
    url: string,
    data: any,
    config: RequestTimeoutConfig = { timeoutMs: this.defaultTimeout }
  ): Promise<T> {
    const startTime = Date.now();
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);

    try {
      const response = await this.axios.post<T>(url, data, {
        signal: controller.signal as any,
        ...config,
      });

      const elapsed = Date.now() - startTime;
      clearTimeout(timeoutId);

      console.log(\`✓ POST completed in \${elapsed}ms (timeout: \${config.timeoutMs}ms)\`);
      return response.data;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      clearTimeout(timeoutId);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
          throw new RequestTimeoutError(
            \`POST to \${url} exceeded \${config.timeoutMs}ms timeout\`,
            elapsed,
            config.timeoutMs
          );
        }
      }

      throw error;
    }
  }
}

// ============================================================
// Database Query with Request Timeout
// ============================================================

/**
 * ACTION: Implement database query with end-to-end timeout
 * REASON: Database queries can hang in multiple phases: connection acquisition
 *         from pool, query execution, result streaming. Query timeout ensures
 *         total operation time is bounded even if individual phases are slow.
 */
class DatabaseClient {
  constructor(private pool: Pool) {}

  /**
   * ACTION: Execute query with overall timeout covering connection + execution
   * REASON: Without request-level timeout, a query could spend 5s acquiring
   *         connection + 10s executing = 15s total, even if each timeout is
   *         reasonable. Request timeout prevents unbounded total duration.
   */
  async query<T = any>(
    sql: string,
    params: any[],
    timeoutMs: number = 10000
  ): Promise<T[]> {
    const startTime = Date.now();
    let client: PoolClient | null = null;

    // ACTION: Create promise that rejects after timeout
    // REASON: PostgreSQL doesn't support request-level cancellation after
    //         query starts, but we can timeout connection acquisition and
    //         close connection if query exceeds timeout.
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        reject(
          new RequestTimeoutError(
            \`Query timeout after \${elapsed}ms\`,
            elapsed,
            timeoutMs
          )
        );
      }, timeoutMs);
    });

    try {
      // ACTION: Race query execution against timeout
      // REASON: Whichever completes first (query or timeout) wins. If timeout
      //         wins, promise rejects and catch block cleans up connection.
      const result = await Promise.race([
        (async () => {
          // Get connection from pool (can be slow if pool exhausted)
          client = await this.pool.connect();

          // Execute query with statement_timeout as backup
          const queryResult = await client.query({
            text: sql,
            values: params,
            // PostgreSQL statement_timeout as secondary defense
            // If request timeout doesn't fire, statement_timeout cancels query
          });

          return queryResult.rows as T[];
        })(),
        timeoutPromise,
      ]);

      const elapsed = Date.now() - startTime;
      console.log(\`✓ Query completed in \${elapsed}ms (timeout: \${timeoutMs}ms)\`);

      return result;
    } catch (error) {
      // ACTION: Release connection even on timeout
      // REASON: Connection pool slots are precious. Timeout doesn't mean
      //         connection is broken—just query took too long. Must release
      //         to prevent pool exhaustion.
      throw error;
    } finally {
      // ACTION: Always release connection back to pool
      // REASON: Even on timeout, connection should be returned. PostgreSQL
      //         will cancel the query when connection is released.
      if (client) {
        client.release();
      }
    }
  }
}

// ============================================================
// Composite Operation with Request Timeout
// ============================================================

/**
 * ACTION: Implement complex operation with multiple sub-operations and timeout
 * REASON: Real-world requests often involve multiple I/O operations: database
 *         queries, external API calls, cache lookups. Request timeout ensures
 *         total time for all operations combined doesn't exceed limit.
 */
class OrderService {
  constructor(
    private db: DatabaseClient,
    private paymentApi: RequestTimeoutClient,
    private inventoryApi: RequestTimeoutClient
  ) {}

  /**
   * ACTION: Process order with end-to-end timeout across multiple services
   * REASON: Order processing involves: DB read (500ms) + payment API (1s) +
   *         inventory API (800ms) + DB write (300ms) = 2.6s total. Without
   *         request timeout, if each operation maxes out its timeout, total
   *         could be 10s+ making user experience terrible.
   */
  async processOrder(
    orderId: string,
    requestTimeoutMs: number = 5000
  ): Promise<{ success: boolean; orderId: string }> {
    const startTime = Date.now();

    // ACTION: Create shared AbortController for all sub-operations
    // REASON: When request timeout fires, all in-flight operations should
    //         cancel: ongoing DB query, pending API calls. Shared controller
    //         enables coordinated cancellation across operation chain.
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    try {
      // ACTION: Calculate time budget for each operation
      // REASON: If 5s total timeout, allocate time wisely: 1s for DB read,
      //         2s for payment (critical), 1.5s for inventory, 0.5s for write.
      //         Prevents early operations from consuming entire budget.

      // Step 1: Fetch order details (budget: 1s)
      const order = await this.db.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId],
        Math.min(1000, requestTimeoutMs - (Date.now() - startTime))
      );

      if (order.length === 0) {
        throw new Error('Order not found');
      }

      // Step 2: Process payment (budget: 2s)
      const remainingAfterDb = requestTimeoutMs - (Date.now() - startTime);
      if (remainingAfterDb < 100) {
        throw new RequestTimeoutError(
          'Insufficient time remaining after DB query',
          Date.now() - startTime,
          requestTimeoutMs
        );
      }

      await this.paymentApi.post(
        '/payments',
        { orderId, amount: order[0].total },
        { timeoutMs: Math.min(2000, remainingAfterDb) }
      );

      // Step 3: Reserve inventory (budget: 1.5s)
      const remainingAfterPayment = requestTimeoutMs - (Date.now() - startTime);
      if (remainingAfterPayment < 100) {
        throw new RequestTimeoutError(
          'Insufficient time remaining after payment',
          Date.now() - startTime,
          requestTimeoutMs
        );
      }

      await this.inventoryApi.post(
        '/reserve',
        { orderId, items: order[0].items },
        { timeoutMs: Math.min(1500, remainingAfterPayment) }
      );

      // Step 4: Update order status (budget: remaining time)
      const remainingAfterInventory = requestTimeoutMs - (Date.now() - startTime);
      await this.db.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['completed', orderId],
        Math.max(500, remainingAfterInventory)
      );

      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      console.log(\`✓ Order processed in \${elapsed}ms (timeout: \${requestTimeoutMs}ms)\`);

      return { success: true, orderId };
    } catch (error) {
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;

      if (error instanceof RequestTimeoutError) {
        console.error(\`✗ Order processing timeout after \${elapsed}ms\`);
        throw error;
      }

      throw error;
    }
  }
}

// ============================================================
// Usage Example
// ============================================================

const httpClient = new RequestTimeoutClient('https://api.example.com', 3000);
const dbPool = new Pool({ /* config */ });
const dbClient = new DatabaseClient(dbPool);

// HTTP request with 5s end-to-end timeout
try {
  const data = await httpClient.get('/users/123', { timeoutMs: 5000 });
  console.log('User data:', data);
} catch (error) {
  if (error instanceof RequestTimeoutError) {
    console.error(\`Request timed out after \${error.elapsedMs}ms\`);
    // Retry with exponential backoff or return cached data
  }
}

// Database query with 10s timeout
try {
  const orders = await dbClient.query(
    'SELECT * FROM orders WHERE user_id = $1',
    ['user-123'],
    10000
  );
  console.log('Orders:', orders);
} catch (error) {
  if (error instanceof RequestTimeoutError) {
    console.error('Query timeout - database may be overloaded');
  }
}

// Complex operation with coordinated sub-operation timeouts
const orderService = new OrderService(
  dbClient,
  httpClient,
  new RequestTimeoutClient('https://inventory.example.com')
);

try {
  const result = await orderService.processOrder('order-456', 5000);
  console.log('Order processed:', result);
} catch (error) {
  if (error instanceof RequestTimeoutError) {
    console.error('Order processing exceeded 5s deadline');
    // Compensating transaction to rollback partial changes
  }
}`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope:
          "Complete request timeout implementation for HTTP requests, database queries, and composite multi-service operations",
        prerequisites: [
          "Understanding of Promise.race for timeout implementation",
          "AbortController for request cancellation",
          "Database connection pooling and query execution",
          "Multi-phase operation timeout coordination",
        ],
        systemPosition:
          "Request timeout sits at the application layer orchestrating overall operation duration across all phases: connection, data transfer, processing, and response handling",
      },
      annotations: [
        {
          id: "request-timeout-error-class",
          lines: [14, 25],
          action:
            "Define custom error class capturing timeout details for debugging",
          reason:
            "Request timeout errors should include elapsed time and configured timeout for debugging. Knowing a request timed out at 4.95s (just under 5s) vs 10s (double timeout) informs different optimization strategies. Custom error class enables structured error handling and retry logic based on how close the operation came to succeeding.",
          contextLevel: "local",
          relatedConcepts: ["error-handling", "observability"],
        },
        {
          id: "request-timeout-abort-controller",
          lines: [66, 74],
          action:
            "Use AbortController to cancel HTTP request if overall timeout exceeded",
          reason:
            "Request timeout must abort the request at any phase: connection establishment, request transmission, server processing, or response download. AbortController provides unified cancellation mechanism that works across all phases. When timeout fires, abort() cancels the underlying HTTP request, freeing resources immediately.",
          contextLevel: "module",
          relatedConcepts: ["request-cancellation", "resource-management"],
        },
        {
          id: "request-timeout-error-classification",
          lines: [89, 102],
          action:
            "Differentiate timeout errors from other HTTP failures for intelligent retry",
          reason:
            "Timeout errors (ECONNABORTED, ERR_CANCELED) indicate server overload or network issues—often transient and retry-able. HTTP 404/500 errors are not timeout-related and shouldn't trigger timeout-specific retry logic. Classifying errors enables appropriate response: timeout → exponential backoff retry, 404 → return error to user.",
          contextLevel: "module",
          relatedConcepts: ["error-classification", "retry-strategy"],
        },
        {
          id: "request-timeout-database-race",
          lines: [205, 230],
          action:
            "Race database query against timeout promise to enforce overall duration limit",
          reason:
            "Database drivers often don't support holistic request-level timeouts (only statement_timeout). Promise.race creates external timeout: if timeout promise resolves first, entire operation fails even if query is still running. This prevents queries from consuming unbounded time when database is overloaded or query is inefficient.",
          contextLevel: "module",
          relatedConcepts: ["promise-race", "timeout-enforcement"],
        },
        {
          id: "request-timeout-connection-cleanup",
          lines: [234, 244],
          action:
            "Release database connection in finally block even on timeout",
          reason:
            "Connection pool exhaustion is a critical failure mode. If timeouts don't release connections, pool quickly depletes and all subsequent queries fail. Finally block ensures connection returns to pool even on timeout. PostgreSQL will cancel the running query when connection is released, making it safe to return.",
          contextLevel: "module",
          relatedConcepts: ["resource-cleanup", "connection-pooling"],
        },
        {
          id: "request-timeout-time-budget-allocation",
          lines: [284, 296],
          action:
            "Allocate time budget across multiple operations within overall timeout",
          reason:
            "Complex operations involve sequential I/O: DB read → API call → another API call → DB write. If each operation uses full timeout, total time = 4x timeout. Smart budget allocation prevents early operations from starving later ones. Calculate remaining time before each operation and set operation-specific timeout to remaining budget.",
          contextLevel: "system",
          relatedConcepts: [
            "time-budget-management",
            "composite-operation-timeout",
          ],
        },
        {
          id: "request-timeout-fail-fast-check",
          lines: [306, 314],
          action:
            "Check remaining time before starting expensive operation to fail fast",
          reason:
            "If only 50ms remains but payment API call typically takes 2s, starting the call is wasteful—it will timeout anyway. Checking remaining time before each operation enables intelligent short-circuiting: fail immediately if insufficient time for operation to possibly succeed. Saves resources and provides faster error feedback.",
          contextLevel: "module",
          relatedConcepts: ["fail-fast", "intelligent-short-circuit"],
        },
        {
          id: "request-timeout-coordinated-cancellation",
          lines: [268, 277],
          action:
            "Use shared AbortController for coordinated cancellation across operation chain",
          reason:
            "When overall request timeout fires, all in-flight sub-operations should cancel: cancel pending HTTP requests, close database connections, abort file uploads. Shared AbortController enables broadcasting cancellation signal to all operations simultaneously. Prevents wasteful work on operations that are part of already-timed-out request.",
          contextLevel: "system",
          relatedConcepts: ["coordinated-cancellation", "abort-signal"],
        },
      ],
      highlights: [
        {
          lines: [14, 25],
          sbvpDomain: "structure",
          label:
            "Custom timeout error with elapsed time for debugging and retry logic",
        },
        {
          lines: [55, 106],
          sbvpDomain: "behavior",
          label:
            "HTTP request with AbortController enforcing end-to-end timeout across all phases",
        },
        {
          lines: [183, 244],
          sbvpDomain: "behavior",
          label:
            "Database query timeout via Promise.race with guaranteed connection cleanup",
        },
        {
          lines: [268, 277],
          sbvpDomain: "philosophy",
          label:
            "Shared AbortController coordinates cancellation across multi-operation chain",
        },
        {
          lines: [284, 296],
          sbvpDomain: "philosophy",
          label:
            "Time budget allocation prevents early operations from starving later ones",
        },
        {
          lines: [306, 314],
          sbvpDomain: "philosophy",
          label:
            "Fail-fast check prevents starting operations with insufficient remaining time",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Request Configuration - Request timeouts are configured at HTTP client instantiation or per-request level (axios timeout, fetch AbortController) to limit total request duration including all retries; when making API calls to payment services, a 5-second request timeout ensures the entire request-response cycle (including DNS, connection, TLS, transmission, processing) completes within SLA bounds; this placement wraps the entire HTTP roundtrip, unlike connection timeout which only covers TCP handshake; client libraries position request timeout as the outer boundary encompassing retries, redirects, and server processing time.",
      "API Gateway Request Processing - Gateways (Nginx, Kong, AWS API Gateway) enforce request timeouts for client requests to prevent slow clients from exhausting gateway resources; when a mobile app uploads a 10MB file through the gateway with a 30-second request timeout, the gateway aborts the request if upload doesn't complete within that window; this placement protects gateway thread pools from being monopolized by slow or stalled client connections; gateway request timeouts are separate from upstream (backend) timeouts, providing defense in depth.",
      "GraphQL Resolver Execution - GraphQL servers apply request timeouts to limit total query execution time across all nested resolvers; when executing a complex query with 50 field resolvers, a 10-second request timeout prevents runaway queries from consuming server resources indefinitely; this placement sits at the GraphQL execution engine layer, monitoring total elapsed time across all resolver invocations; timeout enforcement triggers even if individual resolvers are fast but cumulative time exceeds the limit.",
      "gRPC Method Deadline - gRPC uses per-RPC deadlines (similar to request timeouts) propagated from clients through the call chain; when a client invokes a unary RPC with a 5-second deadline, that deadline applies to the entire method execution including marshaling, network transmission, server processing, and response unmarshaling; this placement enables deadline propagation where server-side calls to downstream services automatically inherit reduced deadlines (5s becomes 4.7s after 300ms of processing).",
      "Serverless Function Timeout - Cloud function platforms (AWS Lambda, Azure Functions, Google Cloud Functions) enforce maximum execution timeouts (default 3s-15min depending on platform); when a Lambda processes an S3 event with 10-minute timeout, the function must complete all processing within that window or be forcibly terminated; this placement is infrastructure-enforced, operating at the container/runtime level rather than application code; function timeouts prevent runaway executions from consuming resources and billing costs.",
    ],
    architecturalBoundaries: [
      "Client-Server Request/Response Boundary - Request timeout operates at the complete HTTP request lifecycle boundary, from client sending first byte to receiving last response byte; this boundary encompasses connection establishment (connection timeout), request transmission, server processing, and response transmission; when a REST client makes a POST request with 10s request timeout, the timeout covers all phases; this boundary is broader than connection or read timeouts, providing end-to-end latency SLA enforcement.",
      "API Gateway Processing Boundary - Request timeout sits at the boundary between external clients and gateway infrastructure, enforcing maximum time for complete request processing; when a gateway receives a request, request timeout tracks time from first byte received to last byte sent in response; this boundary protects gateway resources from slow clients while being distinct from upstream backend timeouts which protect against slow backends; the dual-timeout approach (client-facing and backend-facing) provides layered defense.",
      "Service Execution Boundary - Request timeout operates at the boundary of service method execution, wrapping all business logic, database queries, and external calls; when a microservice handles a request, the timeout covers the complete execution path including pre-processing, main logic, post-processing, and cleanup; this boundary enables fail-fast behavior—if 8 seconds have elapsed in a 10s timeout budget, starting a 5s database query is preemptively rejected; timeout-aware code can check remaining time and skip non-critical operations.",
      "Function Invocation Boundary - Serverless request timeouts enforce maximum execution time at the function invocation boundary, from cold start through complete execution; when Lambda invokes a function, timeout countdown begins immediately including initialization code, framework bootstrapping, and handler execution; this boundary is unique because it's infrastructure-enforced and non-negotiable—exceeding timeout results in forcible termination and SIGKILL, not graceful error; function code cannot extend or override the timeout.",
    ],
    interactsWith: [
      "timeout",
      "connection-timeout",
      "read-timeout",
      "deadline-propagation",
      "circuit-breaker",
      "retry",
    ],
  },

  implementations: [
    {
      id: "axios-timeout",
      name: "Axios Request Timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "HTTP client with request timeout configuration. Timeout covers entire request including retries, redirects, and response body download.",
      links: {
        docs: "https://axios-http.com/docs/req_config",
        github: "https://github.com/axios/axios",
      },
      codeSnippet: `import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000, // 5 second request timeout
});

// Per-request override
const response = await api.post('/payments', data, {
  timeout: 10000, // 10 seconds for payment processing
});`,
    },
    {
      id: "go-context-timeout",
      name: "Go Context Timeout",
      type: "framework",
      languages: ["go"],
      description:
        "Go's context.WithTimeout provides request-scoped timeouts that propagate through function calls and cancel operations when exceeded.",
      links: {
        docs: "https://pkg.go.dev/context",
      },
      codeSnippet: `ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
if err != nil {
    return err
}

resp, err := client.Do(req)
if err != nil {
    // Includes context.DeadlineExceeded for timeout
    return err
}`,
    },
    {
      id: "spring-mvc-timeout",
      name: "Spring MVC Async Request Timeout",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring Boot async request timeout for DeferredResult and Callable endpoints. Enforces maximum processing time for async controllers.",
      links: {
        docs: "https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-async",
      },
      codeSnippet: `@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setDefaultTimeout(5000); // 5 second timeout
    }
}

@GetMapping("/async")
public DeferredResult<String> asyncEndpoint() {
    DeferredResult<String> result = new DeferredResult<>(10000L); // 10s timeout
    // Async processing...
    return result;
}`,
    },
    {
      id: "aws-lambda-timeout",
      name: "AWS Lambda Function Timeout",
      type: "platform",
      languages: ["any"],
      description:
        "Maximum execution time for Lambda functions. Enforced at runtime level with forcible termination when exceeded.",
      links: {
        docs: "https://docs.aws.amazon.com/lambda/latest/dg/configuration-function-common.html#configuration-timeout-console",
      },
      codeSnippet: `# serverless.yml
functions:
  processPayment:
    handler: handler.processPayment
    timeout: 30  # 30 second max execution

# Python handler with timeout awareness
def lambda_handler(event, context):
    remaining = context.get_remaining_time_in_millis()
    if remaining < 5000:  # Less than 5s remaining
        return {'error': 'Insufficient time'}
    # Process...`,
    },
  ],

  usedInSystems: [
    {
      systemId: "stripe-api",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe API uses request timeouts to ensure payment operations complete within acceptable latency bounds for merchants. Each API endpoint has configurable request timeout (default 80s for most operations, 120s for long-running operations like payouts). When processing a payment charge, the request timeout covers authorization with card networks, fraud detection, and database updates—if the complete operation exceeds 80s, Stripe returns a timeout error to the client. The timeout is critical for preventing hung connections that would exhaust Stripe's API gateway capacity. During card network outages, aggressive request timeouts (reduced to 30s) allow Stripe to fail fast and return errors to merchants rather than queueing requests indefinitely. Pattern composition: Request Timeout + Idempotency Keys + Automatic Retries + Circuit Breaker. Impact: Maintained 99.99% API uptime despite external dependencies; prevented API gateway overload during partner outages; reduced P99 latency by 40% through timeout-driven fast failure.",
      source: "https://stripe.com/docs/api/idempotent_requests",
    },
    {
      systemId: "aws-api-gateway",
      systemName: "AWS API Gateway",
      howUsed:
        "AWS API Gateway enforces a hard 29-second maximum integration timeout for all backend calls (Lambda, HTTP endpoints, AWS services). When a client request arrives, API Gateway starts a request timeout covering Lambda cold start, execution time, and response marshaling. The 29s limit (chosen to be under common load balancer 30s timeouts) prevents API Gateway from accumulating stale connections during backend slowdowns. For long-running operations exceeding 29s, AWS recommends async patterns (SQS + polling). The timeout is non-configurable and infrastructure-enforced—Lambda functions executing beyond 29s are terminated and return 504 Gateway Timeout. Pattern composition: Fixed Request Timeout + Lambda Timeout + Connection Pooling + Throttling. Impact: Prevented API Gateway resource exhaustion during Lambda cold start storms; enforced predictable latency SLAs for all API operations; forced adoption of async patterns for long operations improving system design.",
      source:
        "https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html",
    },
    {
      systemId: "github-api",
      systemName: "GitHub REST and GraphQL APIs",
      howUsed:
        "GitHub API uses aggressive request timeouts (10s for REST, 30s for GraphQL) to protect API infrastructure from expensive queries and slow clients. When executing a GraphQL query fetching repository data across 1000 repos, the 30s timeout prevents runaway queries from monopolizing API servers. For REST API, 10s timeout covers authentication, rate limit checks, database queries, and response rendering. During GitHub's 2018 outage caused by MySQL replication lag, request timeouts prevented complete system failure by failing queries quickly rather than queuing indefinitely. GraphQL queries include complexity analysis—queries estimated to exceed timeout are rejected before execution. Pattern composition: Request Timeout + Query Complexity Analysis + Rate Limiting + Circuit Breaker. Impact: Prevented API server overload from expensive queries; reduced incident severity during database slowdowns; improved overall API stability from 99.8% to 99.95% uptime.",
      source:
        "https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api",
    },
  ],

  references: [
    {
      title: "Axios Request Configuration - Timeout",
      url: "https://axios-http.com/docs/req_config",
      type: "documentation",
      author: "Axios",
    },
    {
      title: "Go Context Package - Timeouts and Cancellation",
      url: "https://pkg.go.dev/context",
      type: "documentation",
      author: "Go Team",
    },
    {
      title: "AWS Lambda Function Configuration - Timeout",
      url: "https://docs.aws.amazon.com/lambda/latest/dg/configuration-function-common.html#configuration-timeout-console",
      type: "documentation",
      author: "AWS",
    },
    {
      title: "Spring Framework - Async Request Processing",
      url: "https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-async",
      type: "documentation",
      author: "Spring",
    },
  ],

  philosophy: {
    coreProblem:
      "Without end-to-end request timeouts, operations can hang indefinitely consuming resources and degrading user experience",
    designPrinciple:
      "Enforce maximum total request duration covering all phases to guarantee bounded latency and prevent resource exhaustion",
    historicalContext:
      "Request timeouts became essential with microservices where a single user request might traverse 10+ services—without cumulative timeout enforcement, tail latency grows unbounded",
    alternativesRejected: [
      "No timeout - allows indefinite hangs and resource leaks",
      "Only connection timeout - doesn't protect against slow processing",
      "Only read timeout - allows slow write/processing phases",
      "Infinite timeout with manual cancellation - too complex and error-prone",
    ],
    mentalModel:
      "Request timeout is like a cooking timer for the entire meal prep: you have 60 minutes total to shop, prep, cook, and plate—it doesn't matter which step takes longest, you must finish everything within the time limit",
  },

  visualization: {
    staticDiagram: `graph LR
    A[Request Start] --> B[Connect]
    B --> C[Send Request]
    C --> D[Server Process]
    D --> E[Receive Response]
    E --> F[Request Complete]

    A -.->|Request Timeout: 10s| F

    style A fill:#e1f5e1
    style F fill:#90ee90
    style B fill:#fff4e1
    style C fill:#fff4e1
    style D fill:#ffeb3b
    style E fill:#fff4e1`,
    realWorldAnalogy:
      "Request timeout is like a restaurant's promise to serve your meal within 30 minutes—it covers everything from taking your order, cooking, and delivering to your table. If any step takes too long, they comp your meal",
    useCases: [
      {
        domain: "Payment APIs",
        scenario:
          "Stripe enforces 80s request timeout for payment processing covering fraud checks and network authorization",
        patternRole: "Ensures bounded latency for critical payment operations",
        companies: ["Stripe", "Square", "PayPal"],
      },
      {
        domain: "API Gateways",
        scenario:
          "AWS API Gateway has 29s maximum integration timeout for backend calls",
        patternRole: "Prevents gateway resource exhaustion from slow backends",
        companies: ["AWS", "Kong", "Nginx"],
      },
      {
        domain: "Serverless",
        scenario:
          "Lambda functions have configurable request timeout (max 15min) for execution",
        patternRole: "Bounds execution time to prevent runaway costs",
        companies: ["AWS Lambda", "Azure Functions", "Google Cloud Functions"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "timeout",
    "request-lifecycle",
    "latency",
  ],
  difficulty: "beginner",
};
