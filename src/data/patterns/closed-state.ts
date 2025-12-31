import type { Pattern } from "../schema";

export const closedState: Pattern = {
  id: "closed-state",
  slug: "closed-state",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔌 Circuit Breaker → 🚫 Closed State",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Circuit Breaker",
    level: 4,
  },

  concept: {
    name: "Closed State",
    emoji: "🚫",
    tagline: "Normal operation",
    definition:
      "The Closed State is the normal operating mode of a circuit breaker where requests flow through to the protected service while monitoring for failures. Think of it like a closed electrical circuit where current flows normally—the breaker monitors for overload but does not interrupt the flow. In this state, the circuit breaker forwards all incoming requests to the downstream service, tracks success and failure counts, and calculates the failure rate over a sliding window. If the failure rate remains below the configured threshold (e.g., less than 50% failures over the last 100 requests), the circuit stays closed. The moment failures exceed the threshold, the circuit transitions to Open state to protect the system. The Closed State represents healthy operation where the service is responsive and meeting SLAs. Monitoring during this state is critical—counters track failures, successes, timeouts, and response times to detect degradation early. This is the default starting state for circuit breakers and the goal state after recovery from failures.",
    problemSolved:
      "Without the Closed State, a circuit breaker would either be permanently open (blocking all requests) or lack failure monitoring entirely (no protection). The Closed State solves this by allowing normal traffic while actively monitoring for problems. It detects when a downstream service starts failing (network issues, database overload, API errors) and triggers the protective Open state before cascading failures occur. For example, if a payment service starts experiencing 60% failure rate due to database slowness, the circuit breaker in Closed state detects this pattern over a 10-second window and trips to Open, preventing thousands of doomed requests from piling up. Without continuous monitoring in Closed state, systems would only react after complete service collapse. The pattern enables proactive failure detection and fast response times (milliseconds to detect and trip), protecting both the failing service and upstream callers.",
    tradeoffs: {
      pros: [
        "Allows normal request flow with minimal overhead when service is healthy",
        "Continuously monitors failure metrics to detect degradation early",
        "Provides baseline data for alerting and capacity planning",
        "Enables fast transition to Open state when threshold breached (milliseconds)",
        "Zero user-facing impact during healthy operation—requests processed normally",
      ],
      cons: [
        "Must track metrics (success/failure counts, latencies) adding slight overhead",
        "Requires configuring thresholds—too sensitive causes false positives, too lenient misses failures",
        "Short-lived transient failures may trigger Open state unnecessarily",
        "Monitoring window size trades off responsiveness vs. noise (small window is noisy)",
        "Does not provide protection until threshold breached—early failures pass through",
      ],
    },
    relatedPatterns: [
      "circuit-breaker",
      "open-state",
      "half-open-state",
      "retry",
      "timeout",
      "health-check",
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
      id: "closed-state-ts-basic",
      language: "typescript",
      title: "Closed State Circuit Breaker Implementation",
      description:
        "Implementation demonstrating the Closed State of a circuit breaker where requests flow normally while continuously monitoring failure rates to detect service degradation and trigger protective state transitions.",
      code: `type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface ClosedStateConfig {
  failureThreshold: number;      // Percentage (0-100): trip circuit when failures exceed this
  windowSize: number;             // Number of requests to track in sliding window
  minimumRequests: number;        // Minimum requests before circuit can trip
  requestTimeout: number;         // Timeout for protected requests (ms)
}

interface RequestMetrics {
  timestamp: number;
  success: boolean;
  duration: number;
  error?: Error;
}

class ClosedStateCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private requestHistory: RequestMetrics[] = [];
  private consecutiveSuccesses = 0;
  private consecutiveFailures = 0;

  constructor(private config: ClosedStateConfig) {}

  // Execute a request while circuit is CLOSED
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // In CLOSED state, allow all requests through
    if (this.state !== 'CLOSED') {
      throw new Error(\`Circuit is \${this.state}, not accepting requests in closed state context\`);
    }

    const startTime = Date.now();
    console.log(\`[CLOSED] Executing request: \${operationName}\`);

    try {
      // Execute the protected operation with timeout
      const result = await this.executeWithTimeout(operation, this.config.requestTimeout);
      const duration = Date.now() - startTime;

      // Record successful request
      this.recordSuccess(duration);

      console.log(\`[CLOSED] ✓ Request succeeded in \${duration}ms\`);
      this.logMetrics();

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed request
      this.recordFailure(duration, error as Error);

      console.log(\`[CLOSED] ✗ Request failed after \${duration}ms: \${(error as Error).message}\`);
      this.logMetrics();

      // Check if failure threshold exceeded - transition to OPEN if needed
      if (this.shouldTripCircuit()) {
        console.log(\`\\n🔴 CIRCUIT TRIPPED: Failure rate exceeded threshold!\`);
        console.log(\`   Transition: CLOSED → OPEN\`);
        this.state = 'OPEN';
        // In real implementation, start recovery timeout timer here
      }

      throw error;
    }
  }

  // Execute operation with timeout protection
  private executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(\`Request timeout after \${timeoutMs}ms\`)), timeoutMs)
      ),
    ]);
  }

  // Record successful request in metrics
  private recordSuccess(duration: number): void {
    this.addMetric({
      timestamp: Date.now(),
      success: true,
      duration,
    });

    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
  }

  // Record failed request in metrics
  private recordFailure(duration: number, error: Error): void {
    this.addMetric({
      timestamp: Date.now(),
      success: false,
      duration,
      error,
    });

    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
  }

  // Add metric to sliding window
  private addMetric(metric: RequestMetrics): void {
    this.requestHistory.push(metric);

    // Maintain sliding window size
    if (this.requestHistory.length > this.config.windowSize) {
      this.requestHistory.shift();
    }
  }

  // Determine if circuit should trip based on failure threshold
  private shouldTripCircuit(): boolean {
    // Need minimum number of requests before we can trip
    if (this.requestHistory.length < this.config.minimumRequests) {
      return false;
    }

    // Calculate failure rate over sliding window
    const failures = this.requestHistory.filter(m => !m.success).length;
    const total = this.requestHistory.length;
    const failureRate = (failures / total) * 100;

    console.log(\`   Failure rate: \${failureRate.toFixed(1)}% (\${failures}/\${total} requests)\`);
    console.log(\`   Threshold: \${this.config.failureThreshold}%\`);

    return failureRate >= this.config.failureThreshold;
  }

  // Get current circuit state
  getState(): CircuitState {
    return this.state;
  }

  // Get detailed metrics
  getMetrics() {
    const successes = this.requestHistory.filter(m => m.success).length;
    const failures = this.requestHistory.filter(m => !m.success).length;
    const total = this.requestHistory.length;
    const failureRate = total > 0 ? (failures / total) * 100 : 0;

    const durations = this.requestHistory.map(m => m.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      state: this.state,
      totalRequests: total,
      successes,
      failures,
      failureRate: failureRate.toFixed(1) + '%',
      averageDuration: Math.round(avgDuration) + 'ms',
      consecutiveSuccesses: this.consecutiveSuccesses,
      consecutiveFailures: this.consecutiveFailures,
      windowUtilization: \`\${total}/\${this.config.windowSize}\`,
    };
  }

  // Log current metrics (monitoring simulation)
  private logMetrics(): void {
    const metrics = this.getMetrics();
    console.log(\`   Metrics: \${metrics.successes}✓ / \${metrics.failures}✗ | \` +
      \`Rate: \${metrics.failureRate} | Avg: \${metrics.averageDuration}\`);
  }
}

// ============================================================================
// USAGE EXAMPLE: Demonstrate CLOSED state monitoring
// ============================================================================

// Simulate a downstream service that becomes unhealthy
class DownstreamService {
  private requestCount = 0;
  private shouldFail = false;
  private failureRate = 0;

  constructor(private serviceName: string) {}

  // Simulate gradually degrading service
  setFailureRate(rate: number): void {
    this.failureRate = rate;
    this.shouldFail = true;
    console.log(\`\\n⚠️  \${this.serviceName} failure rate set to \${rate}%\\n\`);
  }

  async makeRequest(requestId: string): Promise<string> {
    this.requestCount++;

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    // Simulate failures based on configured failure rate
    if (this.shouldFail && Math.random() * 100 < this.failureRate) {
      throw new Error(\`\${this.serviceName} error: Service unavailable\`);
    }

    return \`Response from \${this.serviceName} for request \${requestId}\`;
  }
}

async function demonstrateClosedState() {
  console.log('=== Circuit Breaker CLOSED State Demo ===\\n');

  // Configure circuit breaker with 50% failure threshold
  const circuitBreaker = new ClosedStateCircuitBreaker({
    failureThreshold: 50,    // Trip at 50% failure rate
    windowSize: 10,           // Track last 10 requests
    minimumRequests: 5,       // Need at least 5 requests before tripping
    requestTimeout: 2000,     // 2 second timeout
  });

  const service = new DownstreamService('PaymentAPI');

  // Phase 1: Normal healthy operation (CLOSED state)
  console.log('\\n--- Phase 1: Healthy Service (CLOSED state) ---\\n');

  for (let i = 1; i <= 6; i++) {
    try {
      await circuitBreaker.execute(
        () => service.makeRequest(\`req-\${i}\`),
        \`Payment request \${i}\`
      );
    } catch (error) {
      // Request failed but caught by circuit breaker
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\\n📊 Metrics after healthy phase:');
  console.log(JSON.stringify(circuitBreaker.getMetrics(), null, 2));

  // Phase 2: Service starts degrading (still CLOSED, monitoring failures)
  console.log('\\n\\n--- Phase 2: Service Degradation (CLOSED state monitoring) ---\\n');
  service.setFailureRate(30);  // 30% failure rate - below threshold

  for (let i = 7; i <= 12; i++) {
    try {
      await circuitBreaker.execute(
        () => service.makeRequest(\`req-\${i}\`),
        \`Payment request \${i}\`
      );
    } catch (error) {
      // Failures accumulating but below threshold
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\\n📊 Metrics after degradation:');
  console.log(JSON.stringify(circuitBreaker.getMetrics(), null, 2));

  // Phase 3: Service failure rate exceeds threshold - circuit will trip
  console.log('\\n\\n--- Phase 3: Critical Failure Rate (Circuit will trip) ---\\n');
  service.setFailureRate(70);  // 70% failure rate - exceeds 50% threshold

  for (let i = 13; i <= 20; i++) {
    try {
      await circuitBreaker.execute(
        () => service.makeRequest(\`req-\${i}\`),
        \`Payment request \${i}\`
      );
    } catch (error) {
      // Circuit will trip once failure rate exceeds threshold
    }

    // Check if circuit has tripped
    if (circuitBreaker.getState() === 'OPEN') {
      console.log(\`\\n⛔ Circuit tripped after request \${i}\`);
      console.log('   No more requests will be allowed through');
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\\n📊 Final metrics before circuit opened:');
  console.log(JSON.stringify(circuitBreaker.getMetrics(), null, 2));

  console.log('\\n✅ Demo complete - CLOSED state successfully monitored and detected failure threshold');
}

// Run the demonstration
demonstrateClosedState();`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete CLOSED state implementation for circuit breaker showing normal request flow with continuous failure monitoring using sliding window metrics to detect service degradation",
        prerequisites: [
          "Circuit breaker pattern basics",
          "Sliding window algorithms",
          "Async/await and Promises",
          "Error handling in TypeScript",
          "Statistical metrics (failure rates, averages)",
        ],
        systemPosition:
          "Service layer component wrapping outbound calls to downstream services, positioned between application logic and network I/O to monitor and protect against cascading failures",
      },
      annotations: [
        {
          id: "cs-state-check",
          lines: [30, 33],
          action: "Verify circuit is in CLOSED state before executing request",
          reason:
            "CLOSED state is the only state where requests flow through normally to the protected service; other states (OPEN, HALF_OPEN) have different request handling logic and should not use this execution path",
          contextLevel: "module",
          relatedConcepts: ["state-machine", "circuit-breaker-states"],
        },
        {
          id: "cs-request-flow",
          lines: [35, 48],
          action:
            "Execute protected operation with timeout and record success metrics",
          reason:
            "In CLOSED state, all requests are allowed through to test service health; timeout prevents hanging indefinitely on slow services; success recording maintains sliding window metrics for failure detection",
          contextLevel: "local",
        },
        {
          id: "cs-failure-handling",
          lines: [49, 68],
          action:
            "Catch failures, record metrics, and check if circuit should trip",
          reason:
            "Every failure is evidence of service degradation; circuit breaker must track all failures in sliding window and evaluate if failure rate exceeds threshold to determine when to transition to OPEN state for protection",
          contextLevel: "module",
          relatedConcepts: ["failure-detection", "adaptive-thresholds"],
        },
        {
          id: "cs-state-transition",
          lines: [61, 67],
          action:
            "Transition circuit from CLOSED to OPEN when failure threshold exceeded",
          reason:
            "State transition is the core protection mechanism - when enough failures accumulate (service is unhealthy), circuit opens to prevent cascading failures and give service time to recover",
          contextLevel: "module",
          relatedConcepts: ["fail-fast", "cascading-failure-prevention"],
        },
        {
          id: "cs-timeout",
          lines: [72, 82],
          action:
            "Wrap operation in Promise.race with timeout to prevent indefinite hangs",
          reason:
            "Slow or hanging services can exhaust thread pool and cause cascading failures; timeout ensures requests fail fast after configured duration, treating timeouts as failures that contribute to circuit tripping logic",
          contextLevel: "local",
          relatedConcepts: ["timeout-pattern", "resource-protection"],
        },
        {
          id: "cs-success-tracking",
          lines: [85, 94],
          action:
            "Record successful request with timestamp and duration in metrics history",
          reason:
            "Success metrics provide denominator for failure rate calculation (failures/total); tracking consecutive successes helps identify when service is healthy again after recovery",
          contextLevel: "local",
        },
        {
          id: "cs-failure-tracking",
          lines: [97, 107],
          action:
            "Record failed request with error details and update consecutive failure counter",
          reason:
            "Failure metrics provide numerator for failure rate calculation; consecutive failures can be used for aggressive circuit tripping (some implementations trip after N consecutive failures regardless of overall rate)",
          contextLevel: "local",
        },
        {
          id: "cs-sliding-window",
          lines: [110, 117],
          action:
            "Maintain fixed-size sliding window by removing oldest metric when window is full",
          reason:
            "Sliding window ensures failure rate calculation uses recent requests only (e.g., last 100 requests) rather than entire history; this makes circuit responsive to current service health, not outdated historical data",
          contextLevel: "module",
          relatedConcepts: ["sliding-window", "time-series-analysis"],
        },
        {
          id: "cs-threshold-logic",
          lines: [120, 136],
          action:
            "Calculate failure rate over sliding window and compare against threshold",
          reason:
            "Threshold comparison is the decision point for circuit state transition; minimum request requirement prevents premature tripping on small sample sizes (e.g., 1 failure out of 1 request = 100% but not statistically significant)",
          contextLevel: "module",
          relatedConcepts: ["statistical-significance", "threshold-tuning"],
        },
        {
          id: "cs-minimum-requests",
          lines: [122, 125],
          action:
            "Require minimum number of requests before allowing circuit to trip",
          reason:
            "Small sample sizes can have misleading failure rates (e.g., 2 failures out of 2 requests = 100% but not representative); minimum threshold ensures statistical significance before making state transition decisions",
          contextLevel: "module",
          relatedConcepts: ["statistical-validity", "cold-start-problem"],
        },
        {
          id: "cs-metrics-calculation",
          lines: [145, 170],
          action:
            "Calculate comprehensive metrics including failure rate, latency, and window utilization",
          reason:
            "Detailed metrics enable observability - teams need visibility into circuit health, request patterns, and failure trends for tuning thresholds, debugging issues, and capacity planning",
          contextLevel: "system",
          relatedConcepts: ["observability", "monitoring", "alerting"],
        },
        {
          id: "cs-degradation-simulation",
          lines: [209, 212],
          action:
            "Simulate gradual service degradation by increasing failure rate",
          reason:
            "Demonstrates how CLOSED state monitors deteriorating service health in real-time; realistic scenario where services don't fail instantly but degrade gradually (database slowness, memory pressure, network issues)",
          contextLevel: "micro",
        },
        {
          id: "cs-healthy-phase",
          lines: [235, 247],
          action:
            "Send requests through healthy service to establish baseline metrics",
          reason:
            "Demonstrates CLOSED state during normal operation - all requests succeed, failure rate is 0%, circuit remains closed; establishes baseline before simulating degradation",
          contextLevel: "micro",
        },
        {
          id: "cs-monitoring-phase",
          lines: [252, 266],
          action:
            "Introduce 30% failure rate to test monitoring without tripping circuit",
          reason:
            "Shows CLOSED state successfully monitoring failures below threshold - failures are tracked, metrics updated, but circuit stays closed because 30% < 50% threshold; demonstrates graduated response",
          contextLevel: "module",
        },
        {
          id: "cs-trip-phase",
          lines: [271, 290],
          action:
            "Increase failure rate to 70% to trigger circuit state transition",
          reason:
            "Demonstrates circuit tripping when failure threshold exceeded - 70% > 50% causes transition to OPEN state; shows how CLOSED state monitoring leads to protective action when service becomes unhealthy",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [30, 33],
          label: "CLOSED state verification allowing normal request flow",
          sbvpDomain: "structure",
        },
        {
          lines: [61, 67],
          label:
            "Critical state transition from CLOSED to OPEN when threshold breached",
          sbvpDomain: "behavior",
        },
        {
          lines: [120, 136],
          label: "Failure rate calculation and threshold comparison logic",
          sbvpDomain: "philosophy",
        },
        {
          lines: [110, 117],
          label: "Sliding window metrics for recent failure tracking",
          sbvpDomain: "behavior",
        },
        {
          lines: [72, 82],
          label: "Request timeout protection preventing resource exhaustion",
          sbvpDomain: "structure",
        },
        {
          lines: [122, 125],
          label: "Statistical significance via minimum request threshold",
          sbvpDomain: "philosophy",
        },
        {
          lines: [35, 48],
          label: "Transparent request flow during healthy operation",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],
};
