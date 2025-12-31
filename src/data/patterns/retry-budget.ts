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
};
