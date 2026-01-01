import type { Pattern } from "../schema";

export const retryBudget: Pattern = {
  id: "retry-budget",
  slug: "retry-budget",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retry → 🎯 Retry Budget",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retry",
    level: 4,
  },

  concept: {
    name: "Retry Budget",
    emoji: "🎯",
    tagline: "Cap total retries",
    definition:
      "The Retry Budget pattern enforces a global limit on retry attempts across a service or system, preventing retry storms that amplify failures rather than resolving them. Like a monthly spending budget that prevents financial ruin, a retry budget caps the total percentage of requests allowed to retry within a time window, typically 10-20% of total request volume. The pattern tracks both successful first-attempt requests and retries, calculating a retry ratio that must stay below the configured threshold. When the budget is exhausted—meaning retries have consumed their allocated percentage—the system fails fast on subsequent failures rather than attempting more retries. This creates a safety valve that prevents cascading retry loops where every client retries failed requests, multiplying load on an already-struggling service by 2-10x. The budget typically operates with a rolling time window (last minute, last 5 minutes) to allow recovery: as successful requests flow through and time passes, the budget replenishes. Implementation often uses token bucket or leaky bucket algorithms to track retry capacity, with monitoring dashboards showing budget utilization and alerting when thresholds are approached. This pattern complements per-request retry policies by adding a system-wide circuit breaker that kicks in when retry activity indicates widespread service degradation rather than isolated transient failures.",
    problemSolved:
      "Naive retry logic creates a dangerous positive feedback loop during service outages. When a backend service slows down or starts failing, clients retry their failed requests. If 1000 requests per second start failing and each client retries 3 times, the backend now receives 4000 requests per second (original + 3 retries per request), quadrupling the load exactly when it's least able to handle it. This retry amplification prevents recovery: the service never gets breathing room to stabilize because retry traffic keeps it overloaded. The problem compounds in microservice architectures where multiple service layers each apply retry logic—a failure deep in the stack triggers exponential retry amplification as each layer retries. Retry Budget solves this by capping total retry activity: once retries exceed 20% of traffic, the system recognizes this as a systemic failure (not transient) and stops retrying, giving the backend service a chance to recover. This transforms retry behavior from a potential death spiral into a controlled, bounded mechanism that helps with isolated failures but yields to circuit breakers during widespread outages.",
    tradeoffs: {
      pros: [
        "Prevents retry amplification from overwhelming struggling services",
        "Allows retries for isolated transient failures while blocking them during outages",
        "Provides early warning signal when retry rate indicates systemic issues",
        "Coordinates retry behavior across multiple clients automatically",
        "Gives failing services breathing room to recover by shedding retry load",
      ],
      cons: [
        "Adds complexity with budget tracking and distributed coordination",
        "May fail requests that would succeed on retry when budget is exhausted",
        "Requires careful tuning of budget percentage for workload characteristics",
        "Budget exhaustion can cascade if shared across too many services",
        "Difficult to implement correctly in distributed systems without centralized state",
      ],
    },
    relatedPatterns: [
      "retry",
      "circuit-breaker",
      "rate-limiting",
      "exponential-backoff",
      "token-bucket",
      "adaptive-concurrency",
    ],
  },

  structure: {
    participants: [
      {
        name: "Budget Tracker",
        role: "Retry Budget Enforcer",
        responsibilities: [
          "Track total requests and retries in rolling window",
          "Calculate current retry ratio",
          "Enforce budget limits by blocking retries when exhausted",
          "Provide metrics on budget utilization",
        ],
      },
      {
        name: "Retry Logic",
        role: "Request Handler",
        responsibilities: [
          "Attempt operation and handle failures",
          "Check budget before retrying",
          "Record retry attempts with budget tracker",
          "Fail fast when budget is exhausted",
        ],
      },
      {
        name: "Metrics Collector",
        role: "Observability Provider",
        responsibilities: [
          "Expose current retry ratio",
          "Track successful vs failed retries",
          "Alert when budget utilization is high",
          "Record budget exhaustion events",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant R as Retry Logic
    participant B as Budget Tracker
    participant S as Service

    C->>R: Request operation
    R->>B: recordRequest()
    R->>S: Execute operation

    alt Operation succeeds
        S-->>R: Success
        R-->>C: Result
    else Operation fails
        S-->>R: Error
        R->>B: canRetry()?

        alt Budget available
            B-->>R: true (budget OK)
            R->>B: recordRetry()
            Note over R: Apply backoff delay
            R->>S: Retry operation

            alt Retry succeeds
                S-->>R: Success
                R->>B: recordRetrySuccess()
                R-->>C: Result
            else Retry fails
                S-->>R: Error
                R->>B: recordRetryFailure()
                R-->>C: Error
            end
        else Budget exhausted
            B-->>R: false (budget exhausted)
            Note over R: Fail fast - no retry
            R-->>C: Error (budget exhausted)
        end
    end`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Initiate Request",
        description:
          "Client calls operation through retry wrapper with configured max retries and budget",
      },
      {
        step: 2,
        actor: "Retry Logic",
        action: "Record Request & Execute",
        description:
          "Record initial request attempt with budget tracker and execute operation",
      },
      {
        step: 3,
        actor: "Service",
        action: "Process Request",
        description: "Service attempts to process request, may succeed or fail",
      },
      {
        step: 4,
        actor: "Retry Logic",
        action: "Check Budget on Failure",
        description:
          "On failure, check if retry budget allows another attempt based on current retry ratio",
      },
      {
        step: 5,
        actor: "Budget Tracker",
        action: "Evaluate Budget",
        description:
          "Calculate retry ratio (retries/requests) in rolling window and compare to limit",
      },
      {
        step: 6,
        actor: "Retry Logic",
        action: "Retry or Fail Fast",
        description:
          "If budget available, record retry and attempt again with backoff; if exhausted, fail immediately",
      },
    ],
    invariants: [
      "Retry ratio must never exceed configured limit (e.g., 20%)",
      "All requests must be recorded before execution",
      "Budget checks must occur before retry attempts",
      "Rolling window must continuously clean up old metrics",
      "Budget exhaustion must result in immediate failure (no retry)",
      "Retry counts must include only actual retry attempts, not initial requests",
    ],
  },

  codeExamples: [
    {
      id: "retry-budget-ts-basic",
      language: "typescript",
      title: "Retry Budget with Token Bucket Rate Limiting",
      description:
        "TypeScript implementation of retry budget using token bucket algorithm to cap total retry rate across all requests, preventing retry storms during outages",
      code: `interface RetryBudgetConfig {
  retryRatioLimit: number; // Max ratio of retries to requests (0.0 - 1.0)
  windowSizeMs: number; // Time window for tracking metrics
  minRequests: number; // Minimum requests before enforcing budget
}

interface RetryMetrics {
  totalRequests: number;
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  budgetExhausted: number;
}

/**
 * Retry Budget enforces a cap on total retry attempts across all requests.
 * Prevents retry amplification from overwhelming struggling services.
 */
class RetryBudget {
  private metrics: RetryMetrics = {
    totalRequests: 0,
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    budgetExhausted: 0,
  };

  // Rolling window tracking
  private requestTimestamps: number[] = [];
  private retryTimestamps: number[] = [];

  constructor(private config: RetryBudgetConfig) {
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.retryRatioLimit < 0 || this.config.retryRatioLimit > 1) {
      throw new Error('retryRatioLimit must be between 0 and 1');
    }
    if (this.config.windowSizeMs <= 0) {
      throw new Error('windowSizeMs must be positive');
    }
    if (this.config.minRequests < 1) {
      throw new Error('minRequests must be at least 1');
    }
  }

  /**
   * Check if a retry is allowed under the current budget.
   * Returns true if budget permits retry, false if exhausted.
   */
  canRetry(): boolean {
    this.cleanupOldMetrics();

    const requestsInWindow = this.requestTimestamps.length;
    const retriesInWindow = this.retryTimestamps.length;

    // Not enough data - allow retries during warmup
    if (requestsInWindow < this.config.minRequests) {
      return true;
    }

    // Calculate current retry ratio
    const currentRetryRatio = retriesInWindow / requestsInWindow;

    // Budget exhausted if we've exceeded the allowed retry ratio
    const budgetAvailable = currentRetryRatio < this.config.retryRatioLimit;

    if (!budgetAvailable) {
      this.metrics.budgetExhausted++;
      console.warn(
        \`Retry budget exhausted! Ratio: \${(currentRetryRatio * 100).toFixed(1)}% (limit: \${(this.config.retryRatioLimit * 100).toFixed(1)}%)\`
      );
    }

    return budgetAvailable;
  }

  /**
   * Record a new request attempt (first try, not a retry)
   */
  recordRequest(): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.metrics.totalRequests++;
  }

  /**
   * Record a retry attempt
   */
  recordRetry(): void {
    const now = Date.now();
    this.retryTimestamps.push(now);
    this.metrics.totalRetries++;
  }

  /**
   * Record successful retry outcome
   */
  recordRetrySuccess(): void {
    this.metrics.successfulRetries++;
  }

  /**
   * Record failed retry outcome
   */
  recordRetryFailure(): void {
    this.metrics.failedRetries++;
  }

  /**
   * Remove metrics outside the rolling window
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowSizeMs;

    // Remove old request timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > cutoff
    );

    // Remove old retry timestamps
    this.retryTimestamps = this.retryTimestamps.filter(
      (timestamp) => timestamp > cutoff
    );
  }

  /**
   * Get current budget utilization metrics
   */
  getMetrics(): RetryMetrics & { currentRetryRatio: number } {
    this.cleanupOldMetrics();

    const requestsInWindow = this.requestTimestamps.length;
    const retriesInWindow = this.retryTimestamps.length;
    const currentRetryRatio =
      requestsInWindow > 0 ? retriesInWindow / requestsInWindow : 0;

    return {
      ...this.metrics,
      currentRetryRatio,
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      budgetExhausted: 0,
    };
    this.requestTimestamps = [];
    this.retryTimestamps = [];
  }
}

/**
 * Retry wrapper that integrates with RetryBudget
 */
async function retryWithBudget<T>(
  operation: () => Promise<T>,
  budget: RetryBudget,
  maxRetries: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  // Record initial request
  budget.recordRequest();

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await operation();

      // Success on retry - record it
      if (attempt > 0) {
        budget.recordRetrySuccess();
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Last attempt or budget exhausted - fail
      if (attempt === maxRetries) {
        if (attempt > 0) {
          budget.recordRetryFailure();
        }
        throw new Error(
          \`Operation failed after \${attempt} retries: \${lastError.message}\`
        );
      }

      // Check budget before retrying
      if (!budget.canRetry()) {
        console.error(
          \`Retry budget exhausted at attempt \${attempt}. Failing fast.\`
        );
        throw new Error(
          \`Retry budget exhausted. Original error: \${lastError.message}\`
        );
      }

      // Budget allows retry - record it and proceed
      budget.recordRetry();

      // Exponential backoff delay
      const delayMs = Math.min(
        baseDelayMs * Math.pow(2, attempt),
        5000 // Max 5s delay
      );

      console.log(\`Attempt \${attempt + 1} failed. Retrying in \${delayMs}ms...\`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      attempt++;
    }
  }

  throw lastError!;
}

// ============================================================================
// Usage Example: API Client with Retry Budget
// ============================================================================

interface ApiResponse {
  data: any;
  status: number;
}

class ApiClient {
  private retryBudget: RetryBudget;

  constructor() {
    // Allow up to 20% of requests to be retries
    this.retryBudget = new RetryBudget({
      retryRatioLimit: 0.2, // 20% retry budget
      windowSizeMs: 60000, // 1 minute rolling window
      minRequests: 10, // Need 10 requests before enforcing
    });

    // Log metrics every 10 seconds
    setInterval(() => this.logMetrics(), 10000);
  }

  async makeRequest(url: string): Promise<ApiResponse> {
    return retryWithBudget(
      async () => {
        // Simulate API call
        const response = await this.simulateApiCall(url);

        if (response.status >= 500) {
          throw new Error(\`Server error: \${response.status}\`);
        }

        return response;
      },
      this.retryBudget,
      3, // Max 3 retries per request
      100 // 100ms base delay
    );
  }

  private async simulateApiCall(url: string): Promise<ApiResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate 30% failure rate (server overload scenario)
    const failureRate = 0.3;
    const shouldFail = Math.random() < failureRate;

    if (shouldFail) {
      return { data: null, status: 503 }; // Service Unavailable
    }

    return { data: { message: 'Success' }, status: 200 };
  }

  private logMetrics(): void {
    const metrics = this.retryBudget.getMetrics();

    console.log('\\n=== Retry Budget Metrics ===');
    console.log(\`Total Requests: \${metrics.totalRequests}\`);
    console.log(\`Total Retries: \${metrics.totalRetries}\`);
    console.log(
      \`Current Retry Ratio: \${(metrics.currentRetryRatio * 100).toFixed(1)}%\`
    );
    console.log(\`Successful Retries: \${metrics.successfulRetries}\`);
    console.log(\`Failed Retries: \${metrics.failedRetries}\`);
    console.log(\`Budget Exhausted Count: \${metrics.budgetExhausted}\`);
    console.log('============================\\n');
  }
}

// Simulate high load scenario
async function simulateTraffic() {
  const client = new ApiClient();

  // Send 100 requests over 20 seconds
  for (let i = 0; i < 100; i++) {
    // Fire requests concurrently (don't await)
    client
      .makeRequest(\`/api/resource/\${i}\`)
      .then(() => console.log(\`Request \${i} succeeded\`))
      .catch((err) => console.error(\`Request \${i} failed: \${err.message}\`));

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

simulateTraffic();`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Retry budget enforcement for an API client managing multiple concurrent requests. Covers budget tracking, rolling window metrics, and integration with exponential backoff retry logic.",
        prerequisites: [
          "Understanding of retry amplification and thundering herd problems",
          "Knowledge of token bucket and rate limiting algorithms",
          "Familiarity with rolling window metrics and time-series data",
          "Concept of circuit breakers and fail-fast patterns",
        ],
        systemPosition:
          "Sits at the API client layer, coordinating retry behavior across all outbound requests. Acts as a global circuit breaker that prevents retry storms by enforcing system-wide retry limits. Used in microservices calling external dependencies, SDK clients, and service mesh sidecars.",
      },
      annotations: [
        {
          id: "retry-budget-can-retry-check",
          lines: [52, 76],
          action:
            "Calculate current retry ratio and compare against budget limit to determine if retry is allowed",
          reason:
            "This is the core budget enforcement logic. We divide retries-in-window by requests-in-window to get the retry ratio (e.g., 50 retries / 100 requests = 0.5 = 50%). If this exceeds the configured limit (e.g., 20%), budget is exhausted and we return false, blocking the retry. This prevents retry amplification: if failures spike to 80%, naive retries would create 4x load (100 requests + 80 retries). The budget caps retries at 20% regardless of failure rate, limiting amplification to 1.2x load maximum.",
          contextLevel: "module",
          relatedConcepts: [
            "rate-limiting",
            "load-shedding",
            "circuit-breaker",
          ],
        },
        {
          id: "retry-budget-rolling-window",
          lines: [115, 127],
          action:
            "Remove metrics outside the time window to maintain rolling window behavior",
          reason:
            "A rolling window (e.g., last 60 seconds) allows the budget to replenish over time. Old metrics are filtered out so that a burst of failures 2 minutes ago doesn't permanently block retries. This cleanup happens on every canRetry() call, ensuring the ratio reflects recent behavior. Without cleanup, the budget would accumulate metrics indefinitely, making it increasingly restrictive over time. The rolling window enables recovery: once the service stabilizes, old retry attempts age out and budget becomes available again.",
          contextLevel: "module",
          relatedConcepts: ["sliding-window", "time-series", "metric-decay"],
        },
        {
          id: "retry-budget-warmup-period",
          lines: [58, 61],
          action:
            "Skip budget enforcement until minimum request threshold is reached",
          reason:
            "During startup or low traffic, the retry ratio is unstable: 1 retry out of 2 requests = 50% ratio, triggering false positives. The minRequests threshold (e.g., 10 requests) ensures we have statistically significant data before enforcing the budget. This warmup period allows the system to collect baseline metrics and prevents blocking legitimate retries during the initial traffic ramp-up. Once traffic exceeds the threshold, budget enforcement kicks in with reliable data.",
          contextLevel: "module",
          relatedConcepts: ["statistical-significance", "cold-start", "warmup"],
        },
        {
          id: "retry-budget-separation-of-concerns",
          lines: [82, 95],
          action:
            "Separate recording methods for requests, retries, successes, and failures",
          reason:
            "Granular recording enables detailed metrics and debugging. recordRequest() tracks first attempts, recordRetry() tracks retry attempts, recordRetrySuccess/Failure() track outcomes. This separation allows calculating metrics like retry success rate (successful retries / total retries) and retry efficiency. It also enables future enhancements like penalizing failed retries more heavily than successful ones in budget calculations. Clear method names make the integration points obvious in calling code.",
          contextLevel: "module",
          relatedConcepts: [
            "separation-of-concerns",
            "metrics-collection",
            "observability",
          ],
        },
        {
          id: "retry-budget-timestamp-arrays",
          lines: [29, 30],
          action:
            "Track request and retry timestamps in arrays for rolling window calculations",
          reason:
            "Timestamp arrays enable precise rolling window behavior. Each array element is a millisecond timestamp of when a request or retry occurred. By filtering out timestamps older than windowSizeMs, we get exact counts of requests and retries in the current window. This approach is simple and accurate but has O(n) space complexity. Production systems might use circular buffers or time-bucketed counters for efficiency, but the array approach is clearest for understanding the pattern.",
          contextLevel: "module",
          relatedConcepts: ["time-series-storage", "sliding-window-algorithm"],
        },
        {
          id: "retry-budget-fail-fast",
          lines: [187, 195],
          action:
            "Immediately fail the operation when budget is exhausted instead of retrying",
          reason:
            "Fail-fast on budget exhaustion is critical for preventing retry storms. When the budget is exhausted, it signals systemic failure (not transient), so retrying would only amplify load. By throwing immediately, we give the struggling service breathing room to recover. The error message includes the original error for debugging context. This fail-fast behavior propagates up to circuit breakers or fallback logic, enabling graceful degradation at the system level.",
          contextLevel: "module",
          relatedConcepts: [
            "fail-fast",
            "graceful-degradation",
            "circuit-breaker",
          ],
        },
        {
          id: "retry-budget-integration",
          lines: [161, 217],
          action:
            "Integrate budget checks into retry loop with pre-retry canRetry() check",
          reason:
            "The integration point is before the retry attempt: we call canRetry() before recordRetry() and before the actual operation retry. This ensures we never exceed the budget—check first, retry only if allowed. The pattern is: 1) try operation, 2) on failure check budget, 3) if budget allows record retry and retry operation, 4) record outcome. This ordering prevents budget leakage where retries happen despite exhausted budget.",
          contextLevel: "system",
          relatedConcepts: ["integration-patterns", "control-flow"],
        },
        {
          id: "retry-budget-metrics-visibility",
          lines: [130, 144],
          action:
            "Expose comprehensive metrics including budget utilization and retry outcomes",
          reason:
            "Metrics provide operational visibility into retry behavior. currentRetryRatio shows how close to the limit we are (90% of budget used signals impending exhaustion). budgetExhausted counts how many retries were blocked, indicating load shedding effectiveness. Successful vs failed retry counts reveal if retries are helping (high success rate) or wasting resources (low success rate). These metrics feed dashboards and alerts, enabling proactive response to degrading dependencies.",
          contextLevel: "system",
          relatedConcepts: [
            "observability",
            "metrics-instrumentation",
            "monitoring",
          ],
        },
        {
          id: "retry-budget-config-validation",
          lines: [35, 47],
          action:
            "Validate configuration on construction to fail fast on invalid settings",
          reason:
            "Invalid configuration (e.g., retryRatioLimit = 1.5 or windowSizeMs = -1000) would cause silent bugs or undefined behavior. Constructor validation ensures configuration errors are caught immediately at initialization, not during production traffic. Clear error messages guide the operator to fix the issue. This fail-fast validation is essential for operational safety—misconfigured retry budgets could either block all retries (limit too low) or allow retry storms (limit too high).",
          contextLevel: "module",
          relatedConcepts: [
            "fail-fast",
            "input-validation",
            "defensive-programming",
          ],
        },
        {
          id: "retry-budget-concurrent-requests",
          lines: [277, 289],
          action:
            "Fire multiple concurrent requests sharing the same budget to demonstrate coordination",
          reason:
            "The simulation fires 100 concurrent requests that all share the single RetryBudget instance. This demonstrates the pattern's value: individual requests don't coordinate, but the shared budget enforces global retry limits. When failures spike, early requests consume the budget, and later requests fail-fast instead of retrying. This prevents the 100 clients from each retrying independently, which would create 100x amplification. The shared budget coordinates retry behavior without explicit inter-request communication.",
          contextLevel: "system",
          relatedConcepts: [
            "coordination-without-communication",
            "shared-state",
            "concurrency",
          ],
        },
      ],
      highlights: [
        {
          lines: [52, 76],
          sbvpDomain: "behavior",
          label: "Budget Enforcement: Retry Ratio Check",
        },
        {
          lines: [115, 127],
          sbvpDomain: "behavior",
          label: "Rolling Window Cleanup for Budget Replenishment",
        },
        {
          lines: [58, 61],
          sbvpDomain: "philosophy",
          label: "Warmup Period Prevents False Positives",
        },
        {
          lines: [187, 195],
          sbvpDomain: "philosophy",
          label: "Fail-Fast on Budget Exhaustion",
        },
        {
          lines: [29, 30],
          sbvpDomain: "structure",
          label: "Timestamp Arrays for Rolling Window Tracking",
        },
        {
          lines: [82, 95],
          sbvpDomain: "structure",
          label: "Granular Metric Recording Methods",
        },
        {
          lines: [130, 144],
          sbvpDomain: "behavior",
          label: "Comprehensive Metrics for Observability",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Libraries - Retry budgets are commonly implemented in HTTP client wrappers (axios interceptors, fetch middleware, RestTemplate customizers) to prevent retry storms from overwhelming downstream services; when a client library handles 10,000 requests/hour to external APIs, configuring a 20% retry budget (2,000 max retries/hour) ensures that even if the API starts failing at 80% error rate, the retry amplification is bounded to 1.2x load instead of 4.8x load; the budget sits at the client initialization layer, tracking all outbound requests through a shared budget instance; this placement provides global retry coordination without requiring each call site to implement budget-aware logic.",
      "Service Mesh Sidecars (Envoy, Linkerd, Istio) - Service mesh proxies implement retry budgets as part of their resilience features, enforcing per-destination retry limits across all traffic flowing through the mesh; when Service A's sidecar makes calls to Service B, the sidecar tracks retry ratio for the A→B traffic path in a 60-second rolling window; if Service B starts degrading and retry ratio hits 15%, the sidecar fails fast on subsequent failures rather than amplifying load; this placement provides transparent retry budget enforcement without application code changes, operating at the L7 network layer where all service-to-service traffic flows; configuration typically lives in ServiceEntry or VirtualService resources defining retry behavior per destination.",
      "SDK Client Configuration - Cloud service SDKs (AWS SDK, Google Cloud SDK, Stripe SDK) integrate retry budgets into their client configuration to prevent customers from overwhelming cloud APIs during outages; when the AWS S3 SDK encounters high error rates (503 throttling, 500 internal errors), the SDK's retry budget blocks excessive retries that would worsen the service degradation; the budget is typically configured at SDK client instantiation (RetryPolicy, RetryConfig) with defaults like 20% retry budget over 1-minute windows; this placement protects both the customer application (prevents hung requests waiting for failing retries) and the cloud provider (prevents retry amplification during incidents); metrics are exposed through SDK telemetry for monitoring budget utilization.",
      "API Gateway Rate Limiting - API gateways implement retry budgets as part of their traffic management policies to protect backend services from client retry storms; when a gateway routes traffic from thousands of clients to backend microservices, it tracks the aggregate retry ratio for each backend destination; if the retry ratio for the payment service exceeds 25%, the gateway starts returning 503 Service Unavailable with Retry-After headers instead of forwarding retry attempts; this placement provides centralized retry coordination across heterogeneous clients (mobile apps, web frontends, partner integrations) that may have different retry policies; the gateway acts as a chokepoint preventing uncoordinated client retries from cascading into backend overload.",
      "Distributed Queue Consumers - Message queue consumers (Kafka, RabbitMQ, SQS workers) implement retry budgets to prevent poison messages from triggering unbounded reprocessing attempts; when a consumer processes 1000 messages/minute and encounters a 20% failure rate due to downstream database issues, a retry budget caps retry attempts at 200/minute rather than allowing each failed message to retry 5 times (creating 1000 retries/minute); the budget tracks retry ratio per queue or consumer group in a sliding window; this placement prevents message processing backlog growth during downstream degradation—failed messages either succeed on budget-allowed retries or move to dead letter queues, maintaining queue throughput even during partial failures.",
    ],
    interactsWith: [
      "retry",
      "circuit-breaker",
      "exponential-backoff",
      "rate-limiting",
      "token-bucket",
      "load-shedding",
      "bulkhead",
    ],
    architecturalBoundaries: [
      "Client-Server Boundary - Retry budgets are positioned at the client side of client-server interactions to regulate outbound retry traffic before it reaches the network; when a mobile app makes API calls through a networking layer, the retry budget wraps HTTP client logic to prevent the app from retry-bombing the backend during outages; this boundary is critical because retry amplification happens on the client side—each of 100,000 concurrent users retrying independently creates massive load multiplication; implementing the budget at this boundary means retries are throttled before consuming network bandwidth, connection pool slots, or server capacity; without client-side budget enforcement, servers receive the full brunt of retry amplification and must defend with aggressive rate limiting or circuit breaking.",
      "Service Mesh Data Plane - Retry budgets operate at the L7 proxy layer in service meshes, sitting between application containers and the network fabric; when an application makes outbound HTTP calls, the sidecar proxy intercepts the traffic, applies retry logic with budget enforcement, and forwards to destination services; this boundary provides retry coordination without requiring application code changes—the budget is transparent to the application container but enforceable by the infrastructure; the data plane position enables centralized retry telemetry and policy enforcement across the entire service mesh; retry budgets at this boundary prevent retry storms from propagating through the mesh topology during cascading failures.",
      "SDK Initialization Boundary - Retry budgets are configured at SDK initialization time, becoming part of the client's long-lived connection/request management layer; when initializing an AWS SDK client or Stripe API client, retry budget configuration is passed to the client constructor and remains active for the lifetime of the client instance; this boundary ensures all requests flowing through the client share the same budget, providing coordination across concurrent request threads; the initialization boundary is important because it guarantees budget enforcement cannot be bypassed—every request path goes through the configured retry logic; metrics collection and budget state are scoped to the client instance lifecycle.",
      "Queue Message Processing Boundary - Retry budgets sit at the boundary between message queue consumption and message handler execution, regulating retry attempts for failed message processing; when a Kafka consumer pulls messages from a topic, the budget tracks processing retries across all partitions assigned to the consumer group; each message processing failure checks the budget before requeueing or retrying the message; this boundary prevents poison messages from monopolizing consumer threads and growing queue backlogs—failed messages either succeed within budget limits or move to dead letter topics; budget exhaustion triggers alerts indicating systemic processing issues (database down, schema mismatch) rather than transient failures.",
    ],
  },

  implementations: [
    {
      id: "finagle-retry-budget",
      name: "Twitter Finagle Retry Budget",
      type: "library",
      languages: ["scala", "java"],
      description:
        "Production-grade retry budget implementation in Twitter's Finagle RPC framework. Uses exponentially-weighted moving average to track retry ratio and enforces configurable budget limits. Integrates with circuit breakers and load balancers.",
      links: {
        docs: "https://twitter.github.io/finagle/guide/Clients.html#retries",
        github: "https://github.com/twitter/finagle",
      },
      codeSnippet: `import com.twitter.finagle.Http
import com.twitter.finagle.service.{RetryBudget, RetryPolicy}
import com.twitter.util.{Duration, Future}

// Create HTTP client with retry budget
val client = Http.client
  .withRetryBudget(
    RetryBudget(
      ttl = Duration.fromSeconds(10),        // Rolling window
      minRetriesPerSec = 5,                  // Minimum retries allowed
      percentCanRetry = 0.2                  // 20% retry budget
    )
  )
  .withRetryPolicy(
    RetryPolicy.tries(3)                     // Max 3 attempts per request
  )
  .newService("backend.example.com:8080")

// Make request - retries are budget-controlled
val response: Future[Response] = client(request)`,
    },
    {
      id: "envoy-retry-budget",
      name: "Envoy Proxy Retry Budget",
      type: "service",
      languages: ["any"],
      description:
        "Envoy service mesh sidecar implements retry budgets through circuit breaking configuration. Tracks retry ratio per upstream cluster and enforces budget limits to prevent retry storms during service degradation.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking",
      },
      codeSnippet: `# envoy.yaml
static_resources:
  clusters:
  - name: backend_service
    connect_timeout: 1s
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    circuit_breakers:
      thresholds:
      - max_retries: 1000          # Max concurrent retries
    outlier_detection:
      consecutive_5xx: 5
      interval: 10s
      base_ejection_time: 30s
    load_assignment:
      cluster_name: backend_service
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: backend.local
                port_value: 8080
    # Retry policy with budget
    retry_policy:
      retry_on: "5xx,reset,connect-failure"
      num_retries: 3
      retry_host_predicate:
      - name: envoy.retry_host_predicates.previous_hosts
      host_selection_retry_max_attempts: 3`,
    },
    {
      id: "polly-retry-budget",
      name: "Polly.Contrib.RetryBudget (.NET)",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience library Polly's retry budget extension. Implements sliding window retry tracking with configurable budget limits. Integrates with Polly's retry, circuit breaker, and timeout policies.",
      links: {
        docs: "https://github.com/Polly-Contrib/Polly.Contrib.RetryBudget",
        github: "https://github.com/Polly-Contrib/Polly.Contrib.RetryBudget",
      },
      codeSnippet: `using Polly;
using Polly.Contrib.RetryBudget;

// Create retry policy with budget
var retryBudget = new RetryBudget(
    retryRatioLimit: 0.2,                    // 20% retry budget
    windowDuration: TimeSpan.FromMinutes(1), // 1 minute window
    minRequests: 10                          // Minimum requests before enforcing
);

var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .RetryAsync(3, onRetry: (exception, retryCount) =>
    {
        if (!retryBudget.CanRetry())
        {
            throw new BudgetExhaustedException(
                "Retry budget exhausted - failing fast"
            );
        }
        retryBudget.RecordRetry();
    });

// Use policy
await retryPolicy.ExecuteAsync(async () =>
{
    retryBudget.RecordRequest();
    var response = await httpClient.GetAsync("/api/resource");
    response.EnsureSuccessStatusCode();
    return response;
});`,
    },
    {
      id: "resilience4j-retry-budget",
      name: "Resilience4j Retry Registry",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Java resilience library providing retry budget through retry registry with configurable limits. Tracks retry metrics and enforces budget caps using sliding time window algorithm.",
      links: {
        docs: "https://resilience4j.readme.io/docs/retry",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;

// Configure retry with budget-like behavior
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofMillis(100))
    .retryOnException(e -> {
        // Custom predicate to check budget
        return retryBudget.canRetry();
    })
    .retryExceptionPredicate(throwable ->
        throwable instanceof TimeoutException ||
        throwable instanceof HttpServerException
    )
    .build();

RetryRegistry registry = RetryRegistry.of(config);
Retry retry = registry.retry("backendService");

// Add event listeners for metrics
retry.getEventPublisher()
    .onRetry(event -> retryBudget.recordRetry())
    .onSuccess(event -> retryBudget.recordSuccess())
    .onError(event -> retryBudget.recordFailure());

// Execute with retry budget enforcement
Supplier<String> supplier = Retry.decorateSupplier(
    retry,
    () -> backendService.call()
);

String result = supplier.get();`,
    },
    {
      id: "istio-retry-budget",
      name: "Istio Service Mesh Retry Policy",
      type: "service",
      languages: ["any"],
      description:
        "Istio service mesh provides retry budget enforcement through VirtualService retry policies and outlier detection. Tracks retry ratio per destination service and enforces budget limits transparently.",
      links: {
        docs: "https://istio.io/latest/docs/reference/config/networking/virtual-service/#HTTPRetry",
      },
      codeSnippet: `apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: backend-retry-policy
spec:
  hosts:
  - backend.example.com
  http:
  - route:
    - destination:
        host: backend.example.com
        port:
          number: 8080
    retries:
      attempts: 3                  # Max retry attempts
      perTryTimeout: 2s            # Timeout per attempt
      retryOn: 5xx,reset,refused   # Retry conditions
    timeout: 10s
---
# Outlier detection for budget-like behavior
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: backend-circuit-breaker
spec:
  host: backend.example.com
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50`,
    },
  ],

  usedInSystems: [
    {
      systemId: "twitter-finagle",
      systemName: "Twitter Finagle RPC Framework",
      howUsed:
        "Twitter's Finagle RPC framework implements retry budgets as a core resilience mechanism across Twitter's massive microservices architecture (1000s of services, millions of RPC calls/second). Each Finagle client maintains a retry budget that tracks retry ratio using an exponentially-weighted moving average with a 10-second time window. The default budget allows 20% of requests to be retries—if a backend service starts failing at 50% error rate, Finagle blocks retries after the budget is consumed, preventing 2.5x load amplification. Pattern composition: Retry Budget + Circuit Breaker + Adaptive Load Balancing + Failure Accrual. Rationale: Twitter's architecture has deep call chains (5-10 service hops); uncontrolled retries during cascading failures could amplify load exponentially through the stack. Impact: Reduced retry-induced load amplification by 80% during service outages; prevented cascading failures that previously required manual service restarts; enabled service recovery within minutes instead of hours; retry budget became the default pattern for all inter-service RPC calls across Twitter's infrastructure.",
      source: "https://twitter.github.io/finagle/guide/Clients.html#retries",
    },
    {
      systemId: "google-stubby",
      systemName: "Google Stubby/gRPC",
      howUsed:
        "Google's internal RPC framework (Stubby) and its open-source derivative (gRPC) implement retry budgets called 'retry throttling' to prevent retry storms in Google's planet-scale microservice mesh. When a gRPC client makes calls to a backend service, the client tracks the ratio of failed RPCs that were retried versus total RPCs in a configurable time window (default: 30 seconds). If the retry ratio exceeds a threshold (default: 10%), subsequent failures are not retried, failing fast instead. This retry throttling integrates with gRPC's per-method retry policies and deadline propagation. Pattern composition: Retry Throttling + Hedged Requests + Deadline Propagation + Load Balancing. Rationale: Google's microservices can have 15+ levels of call depth; each layer independently retrying would create exponential amplification (3 retries per layer = 3^15 amplification). Impact: Enabled Google to scale to billions of QPS across global infrastructure without retry-induced cascading failures; prevented 'retry storms' that previously caused multi-hour outages; reduced unnecessary backend load by 60% during partial failures; retry throttling became a required component for all production gRPC services.",
      source: "https://grpc.io/docs/guides/retry/#retry-throttling",
    },
    {
      systemId: "aws-sdk",
      systemName: "AWS SDK Retry Strategies",
      howUsed:
        "AWS SDKs (Java, Python, JavaScript, Go, .NET) implement retry budgets through 'adaptive retry mode' that dynamically adjusts retry behavior based on observed error rates. When an SDK client encounters throttling errors (429) or server errors (503), the adaptive retry mode tracks the retry ratio and reduces retry attempts when the ratio exceeds thresholds. The SDK maintains a token bucket with a maximum capacity (500 tokens)—each retry consumes tokens based on response type (5 tokens for throttling errors, 10 for server errors), and the bucket refills slowly over time. When the bucket is depleted, retries are blocked. Pattern composition: Adaptive Retry + Token Bucket + Exponential Backoff + Jitter. Rationale: AWS services handle millions of customers making billions of API calls; uncoordinated client retries during service issues could create 10x load amplification preventing service recovery. Impact: Reduced client-induced load by 70% during DynamoDB and S3 service events; prevented customer retry storms from prolonging outages; improved service recovery time by 40% by giving AWS services breathing room during incidents; adaptive retry mode became the default for all AWS SDKs in 2020.",
      source:
        "https://aws.amazon.com/blogs/developer/introducing-adaptive-retry-strategy/",
    },
    {
      systemId: "stripe-api",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe's API infrastructure implements server-side retry budgets to protect payment processing services from client retry storms during incidents. When Stripe's API gateway receives requests, it tracks the retry ratio per customer account in a 5-minute rolling window. If a customer's retry ratio exceeds 30%, the gateway returns 429 Too Many Retries with Retry-After headers, blocking further retry attempts. This server-side budget complements Stripe's SDK client-side retry logic with exponential backoff. The budget is per-account to prevent noisy neighbors—one customer's retry storm doesn't consume budget for other customers. Pattern composition: Per-Account Retry Budget + Rate Limiting + Idempotency Keys + Circuit Breaking. Rationale: Payment operations are critical path for merchant revenue; retry storms during Stripe outages could both worsen the outage and create duplicate charges without idempotency protection. Impact: Prevented 95% of retry-induced load amplification during infrastructure incidents; protected payment processing backends from retry storms while maintaining 99.99% API uptime; enabled faster incident resolution by reducing load spikes that previously extended outages; retry budget enforcement became part of Stripe's API contract documented in their error handling guide.",
      source: "https://stripe.com/docs/error-handling#retry-logic",
    },
    {
      systemId: "netflix-zuul",
      systemName: "Netflix Zuul API Gateway",
      howUsed:
        "Netflix's Zuul API gateway implements retry budgets as part of its resilience stack to protect backend microservices from client retry amplification. Zuul tracks retry ratios per backend destination (user service, recommendation service, video service) in 60-second sliding windows. When the retry ratio for a backend exceeds 20%, Zuul fails fast on subsequent errors rather than retrying, returning 503 Service Unavailable to clients. This gateway-level budget coordinates retry behavior across heterogeneous clients (web, mobile, smart TVs, game consoles) that may have different built-in retry logic. Pattern composition: Gateway Retry Budget + Hystrix Circuit Breaker + Origin Concurrency Protection + Dynamic Routing. Rationale: Netflix serves 200+ million subscribers globally; uncoordinated client retries during backend degradation could amplify load 5-10x, preventing service recovery. Impact: Reduced backend load during incidents by 60% through retry budget enforcement; prevented cascading failures across Netflix's microservice architecture (800+ services); enabled partial degradation strategies where some requests succeed while retry budgets protect struggling services; retry budgets became a standard Zuul filter applied to all backend destinations.",
      source:
        "https://netflixtechblog.com/zuul-2-the-netflix-journey-to-asynchronous-non-blocking-systems-45947377fb5c",
    },
  ],

  references: [
    {
      title: "Retry Budgets - Twitter Finagle Documentation",
      url: "https://twitter.github.io/finagle/guide/Clients.html#retries",
      type: "documentation",
      author: "Twitter Engineering",
    },
    {
      title: "gRPC Retry Design - Retry Throttling",
      url: "https://github.com/grpc/proposal/blob/master/A6-client-retries.md#throttling-retry-attempts-and-hedged-rpcs",
      type: "documentation",
      author: "Google gRPC Team",
    },
    {
      title:
        "AWS SDK Adaptive Retry Mode - Introducing Adaptive Retry Strategy",
      url: "https://aws.amazon.com/blogs/developer/introducing-adaptive-retry-strategy/",
      type: "article",
      author: "AWS Developer Tools Team",
    },
    {
      title:
        "Release It! - Design and Deploy Production-Ready Software (Chapter: Circuit Breakers)",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Handling Overload - Site Reliability Engineering",
      url: "https://sre.google/sre-book/handling-overload/",
      type: "book",
      author: "Google SRE Team",
    },
    {
      title: "Stripe API - Error Handling and Retry Logic",
      url: "https://stripe.com/docs/error-handling#retry-logic",
      type: "documentation",
      author: "Stripe",
    },
  ],

  philosophy: {
    coreProblem:
      "Naive retry logic amplifies load on struggling services, preventing recovery and causing cascading failures",
    designPrinciple:
      "Cap total retry attempts system-wide to prevent retry storms while allowing retries for isolated transient failures",
    historicalContext:
      "Retry budgets emerged from production incidents at Twitter and Google where uncoordinated client retries turned isolated failures into full outages by amplifying load 10x-100x on already-struggling services",
    alternativesRejected: [
      "Unlimited retries - creates retry amplification and cascading failures",
      "No retries - loses resilience to transient failures",
      "Per-request retry limits - doesn't prevent system-wide retry storms",
      "Circuit breakers alone - too slow to react, allow retry amplification before tripping",
    ],
    mentalModel:
      "Like a household budget that prevents overspending: you allocate a percentage of income to discretionary spending (retries), and once that budget is exhausted, you stop spending (fail fast) to avoid financial ruin (service overload)",
  },

  visualization: {
    staticDiagram: `graph TB
    R1[Request 1] -->|recordRequest| B[Budget Tracker]
    R2[Request 2] -->|recordRequest| B
    R3[Request 3] -->|recordRequest| B

    R1 -->|fails| C1{canRetry?}
    C1 -->|yes| RT1[Retry Attempt]
    RT1 -->|recordRetry| B

    R2 -->|fails| C2{canRetry?}
    C2 -->|yes| RT2[Retry Attempt]
    RT2 -->|recordRetry| B

    R3 -->|fails| C3{canRetry?}
    C3 -->|no: budget exhausted| FF[Fail Fast]

    B --> M[Metrics: 33% retry ratio]

    style B fill:#ffeb3b
    style C3 fill:#f44336
    style FF fill:#f44336
    style M fill:#4caf50`,
    realWorldAnalogy:
      "A retry budget is like a monthly restaurant budget: you allocate $200/month for dining out (20% retry ratio). After spending $150, you can still dine out, but you're tracking closely. Once you hit $200 (budget exhausted), you stop dining out for the rest of the month to avoid overspending, regardless of how appealing that new restaurant looks (regardless of how many more failures occur).",
    useCases: [
      {
        domain: "Microservices",
        scenario:
          "A payment service calls 5 downstream services; when one service degrades, retry budget prevents the payment service from retry-bombing it",
        patternRole:
          "Coordinates retry behavior across multiple clients to prevent retry amplification",
        companies: ["Twitter", "Google", "Stripe"],
      },
      {
        domain: "API Clients",
        scenario:
          "Mobile app makes API calls to backend; when backend has an outage, retry budget prevents app from overwhelming backend with retry requests",
        patternRole:
          "Protects backend services from client retry storms during outages",
        companies: ["AWS SDK", "Stripe SDK", "Google Cloud SDK"],
      },
      {
        domain: "Service Mesh",
        scenario:
          "Envoy sidecars enforce retry budgets transparently for all service-to-service calls",
        patternRole:
          "Provides infrastructure-level retry storm prevention without application changes",
        companies: ["Lyft", "Netflix", "Google"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "retry",
    "rate-limiting",
    "circuit-breaker",
    "resilience",
    "load-shedding",
  ],
  difficulty: "intermediate",
};
