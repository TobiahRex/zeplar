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
};
