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
        name: "Request Router",
        role: "Traffic Gateway",
        responsibilities: [
          "Accept all incoming requests in CLOSED state",
          "Forward requests to protected downstream service",
          "Track request outcomes for metrics collection",
          "Maintain transparency during normal operation",
        ],
      },
      {
        name: "Metrics Collector",
        role: "Failure Detection System",
        responsibilities: [
          "Record success/failure status for every request",
          "Maintain sliding window of recent request history (last N requests)",
          "Calculate real-time failure rate from sliding window data",
          "Provide statistical metrics (failure rate, latency, consecutive failures)",
        ],
      },
      {
        name: "Threshold Evaluator",
        role: "State Transition Decision Maker",
        responsibilities: [
          "Compare current failure rate against configured threshold",
          "Enforce minimum request count before allowing state transition",
          "Determine when circuit should trip to OPEN state",
          "Prevent premature tripping on statistically insignificant samples",
        ],
      },
      {
        name: "Protected Service",
        role: "Downstream Dependency",
        responsibilities: [
          "Process requests when healthy and responsive",
          "Return success responses within acceptable latency",
          "Signal failures via exceptions, timeouts, or error responses",
          "May degrade gradually (increasing failure rate over time)",
        ],
      },
      {
        name: "State Transition Manager",
        role: "Circuit State Controller",
        responsibilities: [
          "Transition circuit from CLOSED to OPEN when threshold breached",
          "Log state transition events for observability",
          "Trigger circuit breaker protection mechanisms",
          "Coordinate with retry and fallback systems after state change",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant Router as Request Router
    participant Metrics as Metrics Collector
    participant Evaluator as Threshold Evaluator
    participant Service as Protected Service
    participant StateManager as State Manager

    Note over Router,Service: Phase 1: Normal Operation (CLOSED)
    Client->>Router: Request 1
    Router->>Service: Forward request
    Service-->>Router: Success ✓
    Router->>Metrics: Record success (duration: 50ms)
    Metrics->>Metrics: Update sliding window [1S, 0F]
    Router-->>Client: Return response
    Note over Metrics: Failure rate: 0% (1/1 success)

    Client->>Router: Request 2
    Router->>Service: Forward request
    Service-->>Router: Success ✓
    Router->>Metrics: Record success (duration: 45ms)
    Metrics->>Metrics: Update sliding window [2S, 0F]
    Router-->>Client: Return response
    Note over Metrics: Failure rate: 0% (2/2 success)

    Note over Router,Service: Phase 2: Service Degradation (Monitoring Failures)
    Client->>Router: Request 3
    Router->>Service: Forward request
    Service--xRouter: Failure ✗ (timeout)
    Router->>Metrics: Record failure (duration: 5000ms)
    Metrics->>Metrics: Update sliding window [2S, 1F]
    Metrics->>Evaluator: Check if should trip
    Evaluator->>Evaluator: Calculate: 33% failure rate
    Evaluator->>Evaluator: Threshold: 50% (not breached)
    Note over Evaluator: Circuit stays CLOSED
    Router--xClient: Propagate failure

    Client->>Router: Request 4
    Router->>Service: Forward request
    Service--xRouter: Failure ✗ (500 error)
    Router->>Metrics: Record failure
    Metrics->>Metrics: Update sliding window [2S, 2F]
    Metrics->>Evaluator: Check if should trip
    Evaluator->>Evaluator: Calculate: 50% failure rate
    Evaluator->>Evaluator: Threshold: 50% (breached!)
    Evaluator->>StateManager: Trigger state transition
    StateManager->>StateManager: CLOSED → OPEN
    Note over StateManager: Circuit TRIPPED
    StateManager-->>Client: Return failure
    Note over Router,StateManager: Circuit now OPEN - no more requests allowed`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Send Request",
        description:
          "Client initiates request to protected service through circuit breaker in CLOSED state",
      },
      {
        step: 2,
        actor: "Request Router",
        action: "Forward Request",
        description:
          "In CLOSED state, router forwards all requests transparently to downstream service without blocking",
      },
      {
        step: 3,
        actor: "Protected Service",
        action: "Process Request",
        description:
          "Downstream service attempts to process request—may succeed quickly, succeed slowly, or fail with timeout/error",
      },
      {
        step: 4,
        actor: "Metrics Collector",
        action: "Record Outcome",
        description:
          "Collector records request result (success/failure), duration, timestamp, and error type into sliding window",
      },
      {
        step: 5,
        actor: "Metrics Collector",
        action: "Update Sliding Window",
        description:
          "Add new metric to window; if window full (e.g., 100 requests), evict oldest metric to maintain fixed size",
      },
      {
        step: 6,
        actor: "Threshold Evaluator",
        action: "Calculate Failure Rate",
        description:
          "Compute failure percentage from sliding window: (failures / total requests) × 100",
      },
      {
        step: 7,
        actor: "Threshold Evaluator",
        action: "Evaluate Threshold",
        description:
          "Compare failure rate against configured threshold (e.g., 50%); check minimum request count met (e.g., 5 requests)",
      },
      {
        step: 8,
        actor: "State Transition Manager",
        action: "Transition to OPEN (if threshold breached)",
        description:
          "If failure rate exceeds threshold AND minimum requests met, transition circuit from CLOSED to OPEN state; otherwise remain CLOSED",
      },
    ],
    invariants: [
      "Circuit must remain CLOSED when failure rate is below threshold",
      "All requests must be forwarded to protected service in CLOSED state",
      "Sliding window size must be fixed (constant memory usage)",
      "Failure rate calculation must use only requests within sliding window (not entire history)",
      "Minimum request threshold must be enforced before allowing state transition",
      "State transition to OPEN must be immediate once threshold breached",
      "Metrics collection must not impact request latency significantly (<1ms overhead)",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Service-to-Service Communication Layer - Closed State monitoring is implemented at the HTTP client wrapper layer between microservices, positioned to intercept all outbound requests. In a Spring Boot microservice calling downstream APIs via RestTemplate or WebClient, the circuit breaker wraps the HTTP client with CLOSED state as the default. Every request flows through: application logic → circuit breaker (CLOSED) → HTTP client → network → downstream service. The CLOSED state maintains transparency—requests pass through without modification while the circuit silently tracks success/failure metrics in a sliding window (last 100 requests). When the payment service calls the fraud detection API 1000 times per minute, the CLOSED state circuit monitors failure rate continuously: if fraud detection starts timing out due to database overload, the circuit detects 50% failure rate over 10 seconds and transitions to OPEN. This placement enables automatic failure detection without modifying business logic—developers write service.getFraudScore(transaction) and the circuit breaker transparently handles monitoring and protection.",

      "API Gateway Edge Layer - At the infrastructure edge where external traffic enters the system, API gateways (Kong, Zuul, Spring Cloud Gateway) implement CLOSED state circuits wrapping routes to backend services. Each route (/api/users → user-service, /api/orders → order-service) has an independent circuit starting in CLOSED state. When 10,000 users browse the e-commerce site simultaneously, the API gateway's CLOSED circuits monitor health of all backend microservices. If the product catalog service degrades (database connection pool exhausted), requests to /api/products start timing out. The CLOSED state circuit detects rising failure rate (20% → 35% → 52% over 30 seconds) and trips to OPEN, returning cached product data or 503 errors while the catalog service recovers. This placement protects the edge from propagating failures to clients—instead of 10,000 concurrent users experiencing slow timeouts, the circuit trips after detecting pattern in first 100 requests, immediately failing fast for subsequent traffic.",

      "Database Connection Pool Management - Database access layers (Hibernate, Entity Framework, pg-pool) implement CLOSED state monitoring around connection acquisition and query execution. The connection pool starts in CLOSED state, tracking connection timeouts, query failures, and deadlock exceptions. In a high-traffic application executing 500 queries/second against PostgreSQL, the CLOSED state monitors database health continuously. If the database becomes overloaded (too many long-running queries, lock contention, I/O saturation), query timeouts increase from 1% to 25% to 55% over 60 seconds. The circuit breaker detects this degradation pattern in CLOSED state and trips to OPEN, preventing the application from exhausting all connection pool connections waiting for slow queries. New requests receive immediate 'database unavailable' errors instead of blocking threads waiting for connections. This placement protects application thread pools from database-induced starvation—when the database is struggling, the circuit prevents cascading resource exhaustion.",

      "Message Queue Consumer Processing - Message consumer frameworks (Spring AMQP, Celery, Kafka Streams) implement CLOSED state monitoring around message processing logic. Each consumer starts with circuit in CLOSED state, tracking message processing success/failure rates. When consuming from RabbitMQ queue processing 1000 messages/minute, the CLOSED circuit monitors the downstream service called during message processing. If the email service (called to send notifications) becomes unavailable, message processing starts failing. The CLOSED state detects 40% → 60% failure rate and trips to OPEN. Instead of continuously retrying failed email sends and blocking queue consumption, the circuit opens and subsequent messages are moved to a dead letter queue. This placement prevents poison messages or downstream failures from blocking entire queue processing—the circuit detects patterns in CLOSED state and takes protective action before queue backlog grows uncontrollably.",

      "Third-Party Integration Wrappers - External service client libraries (Stripe SDK, Twilio client, AWS SDK) wrap API calls with CLOSED state circuits. When the application integrates with Stripe for payment processing, the circuit breaker wraps stripe.charges.create() calls starting in CLOSED state. During normal operation (CLOSED), the circuit transparently forwards all payment requests to Stripe while tracking response times and error rates. If Stripe's API experiences a regional outage or rate limiting, payment failures increase from 0% to 5% to 55% over 5 minutes. The CLOSED state circuit detects this degradation and trips to OPEN, preventing the application from sending thousands of doomed payment requests. Instead, the circuit opens and new checkout attempts receive immediate 'payment temporarily unavailable' messages with queued retry logic. This placement isolates the application from third-party service health—CLOSED state monitoring detects degradation patterns and protects internal resources from external failures.",
    ],
    architecturalBoundaries: [
      "Request/Response Boundary (Synchronous RPC) - CLOSED state is most effective at synchronous request/response boundaries where failures are immediately observable and measurable. HTTP REST calls, gRPC RPCs, and GraphQL queries all exhibit clear success/failure semantics that the CLOSED state can monitor. When Service A calls Service B's REST API, the circuit in CLOSED state tracks HTTP status codes (2xx=success, 5xx=failure), timeouts, and connection errors. This boundary provides the clear signal needed for failure rate calculation: each request either succeeds or fails within a defined timeout period. The CLOSED state maintains a sliding window of these binary outcomes, enabling statistical failure rate analysis (e.g., 45 failures out of 100 requests = 45% failure rate). This architectural boundary is ideal for circuit breakers because failures are synchronous, immediate, and quantifiable.",

      "Network I/O Boundary (Crossing Process Boundaries) - CLOSED state monitoring is positioned where network I/O crosses process boundaries, protecting against network partitions, DNS failures, connection timeouts, and socket errors. When the application makes an outbound HTTP call, the circuit in CLOSED state sits between the HTTP client and the network socket, monitoring for: connection timeouts (cannot establish TCP connection), read timeouts (connection established but no response), DNS resolution failures, and TLS handshake errors. Network failures manifest as immediate exceptions that the CLOSED state records as failures. If a network partition occurs (router failure, firewall misconfiguration), connection attempts timeout immediately (2-5 seconds), causing rapid failure rate increase that the CLOSED state detects and trips the circuit. This boundary is critical because network failures often present as indefinite hangs without circuit breaker protection—CLOSED state transforms these into fast, observable failures.",

      "Service Dependency Boundary (Upstream Protecting Downstream) - CLOSED state operates at the boundary between an upstream caller and its downstream dependency, where the upstream service must remain resilient to downstream failures. When the order service (upstream) depends on the inventory service (downstream), the circuit in CLOSED state monitors inventory service health from the order service's perspective. If the inventory service deploys a buggy release causing 60% error rates, the order service's CLOSED circuit detects this and trips to OPEN, preventing cascading failures. This architectural boundary establishes ownership: each service owns the circuits protecting its dependencies, rather than relying on downstream services to protect themselves. The CLOSED state enables autonomous failure detection—services independently monitor their dependencies and take protective action without coordination.",

      "Not Recommended: In-Process Function Calls - CLOSED state circuits should not be used for in-process function calls or in-memory operations where there's no network I/O or external resource access. Wrapping calculateTotalPrice() or validateEmail() with a circuit breaker adds unnecessary overhead without providing value—these operations fail deterministically (bugs, logic errors) rather than transiently (network issues, overload). CLOSED state metrics collection (tracking failures, calculating rates) wastes CPU cycles for operations that complete in microseconds. Circuit breakers are designed for unpredictable, transient failures across network boundaries, not deterministic in-process logic. Exception: if an in-process operation calls external resources (database, cache, file I/O), then CLOSED state monitoring is appropriate at that boundary.",
    ],
    interactsWith: [
      "circuit-breaker",
      "open-state",
      "half-open-state",
      "retry",
      "timeout",
      "health-check",
      "fallback",
      "bulkhead",
      "rate-limiting",
    ],
  },

  implementations: [
    {
      id: "resilience4j-closed",
      name: "Resilience4j Circuit Breaker CLOSED State",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Resilience4j implements CLOSED state with configurable sliding window (count-based or time-based), failure rate threshold, and minimum request volume. Uses ring buffer for efficient metrics tracking. Supports automatic state transitions and comprehensive event publishing for monitoring.",
      links: {
        docs: "https://resilience4j.readme.io/docs/circuitbreaker",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.time.Duration;

// Configure CLOSED state behavior
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
  // Sliding window configuration
  .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
  .slidingWindowSize(100)  // Track last 100 requests

  // CLOSED → OPEN transition threshold
  .failureRateThreshold(50)  // Trip at 50% failure rate
  .minimumNumberOfCalls(10)  // Minimum 10 requests before circuit can trip

  // What counts as failure in CLOSED state
  .recordExceptions(IOException.class, TimeoutException.class)
  .ignoreExceptions(BusinessValidationException.class)

  // OPEN state duration (after circuit trips from CLOSED)
  .waitDurationInOpenState(Duration.ofSeconds(60))

  // HALF_OPEN state configuration (after OPEN timeout)
  .permittedNumberOfCallsInHalfOpenState(10)

  // Slow call detection (optional - slow calls count as failures)
  .slowCallRateThreshold(50)  // 50% slow calls also trips circuit
  .slowCallDurationThreshold(Duration.ofSeconds(2))

  .build();

CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
CircuitBreaker breaker = registry.circuitBreaker("paymentService");

// Monitor CLOSED state events
breaker.getEventPublisher()
  .onStateTransition(event -> {
    if (event.getStateTransition().getToState() == CircuitBreaker.State.OPEN) {
      log.warn("Circuit transitioned from CLOSED to OPEN - failure threshold exceeded");
      metrics.increment("circuit.breaker.open");
    }
  })
  .onFailureRateExceeded(event -> {
    log.warn("Failure rate {} exceeded threshold in CLOSED state",
      event.getFailureRate());
  })
  .onSlowCallRateExceeded(event -> {
    log.warn("Slow call rate {} exceeded threshold in CLOSED state",
      event.getSlowCallRate());
  });

// Use circuit breaker - starts in CLOSED state
String result = breaker.executeSupplier(() -> {
  return paymentService.processPayment(orderId);
});

// Check CLOSED state metrics
CircuitBreaker.Metrics metrics = breaker.getMetrics();
System.out.println("Failure rate: " + metrics.getFailureRate() + "%");
System.out.println("Calls: " + metrics.getNumberOfSuccessfulCalls() +
  " success, " + metrics.getNumberOfFailedCalls() + " failed");`,
    },
    {
      id: "hystrix-closed",
      name: "Netflix Hystrix CLOSED State (Legacy)",
      type: "library",
      languages: ["java"],
      description:
        "Hystrix pioneered circuit breaker CLOSED state with rolling window metrics. Uses health snapshot with configurable window (10-second default). Automatically trips to OPEN when error percentage exceeds threshold. Now in maintenance mode, succeeded by Resilience4j.",
      links: {
        docs: "https://github.com/Netflix/Hystrix/wiki/How-it-Works",
        github: "https://github.com/Netflix/Hystrix",
      },
      codeSnippet: `import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixCommandProperties;

public class PaymentCommand extends HystrixCommand<PaymentResult> {

    public PaymentCommand(String orderId) {
        super(Setter
            .withGroupKey(HystrixCommandGroupKey.Factory.asKey("PaymentService"))
            .andCommandPropertiesDefaults(
                HystrixCommandProperties.Setter()
                    // CLOSED state monitoring window
                    .withMetricsRollingStatisticalWindowInMilliseconds(10000)  // 10-second window
                    .withMetricsRollingStatisticalWindowBuckets(10)  // 10 buckets (1-second each)

                    // Minimum requests in CLOSED before circuit can trip
                    .withCircuitBreakerRequestVolumeThreshold(20)

                    // CLOSED → OPEN threshold
                    .withCircuitBreakerErrorThresholdPercentage(50)  // Trip at 50% errors

                    // Request timeout (failures count toward circuit tripping)
                    .withExecutionTimeoutInMilliseconds(5000)

                    // OPEN state duration
                    .withCircuitBreakerSleepWindowInMilliseconds(30000)  // 30 seconds
            )
        );
        this.orderId = orderId;
    }

    @Override
    protected PaymentResult run() throws Exception {
        // Circuit starts in CLOSED - all requests flow through
        return paymentService.processPayment(orderId);
    }

    @Override
    protected PaymentResult getFallback() {
        // Fallback when circuit trips to OPEN
        return PaymentResult.deferred(orderId);
    }
}

// Hystrix monitors CLOSED state health automatically
// Dashboard shows real-time metrics: success rate, error rate, circuit state`,
    },
    {
      id: "polly-closed",
      name: "Polly Circuit Breaker CLOSED State (.NET)",
      type: "library",
      languages: ["csharp"],
      description:
        "Polly provides advanced circuit breaker with CLOSED state monitoring using percentage-based failure thresholds over configurable sampling duration. Supports minimum throughput requirements and customizable break duration.",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki/Advanced-Circuit-Breaker",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `using Polly;
using Polly.CircuitBreaker;

// Configure CLOSED state with advanced circuit breaker
var circuitBreakerPolicy = Policy
    .Handle<HttpRequestException>()
    .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
    .AdvancedCircuitBreakerAsync(
        // CLOSED → OPEN threshold
        failureThreshold: 0.5,  // 50% failure rate

        // Sampling window for CLOSED state monitoring
        samplingDuration: TimeSpan.FromSeconds(10),

        // Minimum requests in CLOSED before circuit can trip
        minimumThroughput: 10,

        // OPEN state duration
        durationOfBreak: TimeSpan.FromSeconds(30),

        // Event handlers for CLOSED state monitoring
        onBreak: (result, breakDelay) => {
            Console.WriteLine($"Circuit OPEN: broke at {DateTime.UtcNow}");
            Console.WriteLine($"Failure rate exceeded threshold in CLOSED state");
        },
        onReset: () => {
            Console.WriteLine($"Circuit CLOSED: reset at {DateTime.UtcNow}");
        },
        onHalfOpen: () => {
            Console.WriteLine($"Circuit HALF-OPEN: testing at {DateTime.UtcNow}");
        }
    );

// Execute request through circuit (starts in CLOSED state)
var response = await circuitBreakerPolicy.ExecuteAsync(async () => {
    return await httpClient.GetAsync("https://api.example.com/payments");
});

// Monitor CLOSED state
var circuitState = circuitBreakerPolicy.CircuitState;
Console.WriteLine($"Circuit state: {circuitState}");  // Closed, Open, HalfOpen`,
    },
    {
      id: "opossum-closed",
      name: "Opossum Circuit Breaker CLOSED State (Node.js)",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Opossum implements CLOSED state with rolling window error tracking. Supports percentage-based thresholds, volume requirements, and comprehensive event emission for monitoring state transitions and metrics.",
      links: {
        docs: "https://nodeshift.dev/opossum/",
        github: "https://github.com/nodeshift/opossum",
      },
      codeSnippet: `import CircuitBreaker from 'opossum';

// Configure CLOSED state behavior
const options = {
  timeout: 5000,  // Request timeout (failures count toward circuit)

  // CLOSED → OPEN threshold
  errorThresholdPercentage: 50,  // Trip at 50% error rate

  // Sampling window for CLOSED state
  rollingCountTimeout: 10000,  // 10-second window
  rollingCountBuckets: 10,      // 10 buckets (1-second each)

  // Minimum requests in CLOSED before circuit can trip
  volumeThreshold: 10,

  // OPEN state duration
  resetTimeout: 30000,  // 30 seconds

  // Health check in HALF-OPEN state
  healthCheck: async () => {
    const response = await fetch('/health');
    return response.ok;
  }
};

const breaker = new CircuitBreaker(paymentService.processPayment, options);

// Monitor CLOSED state events
breaker.on('success', (result) => {
  console.log('Request succeeded in CLOSED state');
});

breaker.on('failure', (error) => {
  console.log('Request failed in CLOSED state:', error.message);
});

breaker.on('open', () => {
  console.log('Circuit OPEN - failure threshold exceeded in CLOSED state');
  metrics.increment('circuit.open');
});

breaker.on('close', () => {
  console.log('Circuit returned to CLOSED state');
  metrics.increment('circuit.closed');
});

// Execute through circuit (starts in CLOSED)
try {
  const result = await breaker.fire(orderId);
  console.log('Payment processed:', result);
} catch (error) {
  console.error('Payment failed:', error);
}

// Check CLOSED state metrics
const stats = breaker.stats;
console.log(\`Failure rate: \${stats.failures / stats.fires * 100}%\`);
console.log(\`Successes: \${stats.successes}, Failures: \${stats.failures}\`);`,
    },
    {
      id: "failsafe-go-closed",
      name: "Failsafe-go Circuit Breaker CLOSED State",
      type: "library",
      languages: ["go"],
      description:
        "Go circuit breaker implementation with CLOSED state monitoring using threshold-based failure detection. Supports count-based and time-based thresholds with configurable success criteria for state recovery.",
      links: {
        github: "https://github.com/failsafe-go/failsafe-go",
        docs: "https://pkg.go.dev/github.com/failsafe-go/failsafe-go",
      },
      codeSnippet: `package main

import (
    "context"
    "time"
    "github.com/failsafe-go/failsafe-go"
    "github.com/failsafe-go/failsafe-go/circuitbreaker"
)

func main() {
    // Configure CLOSED state behavior
    breaker := circuitbreaker.Builder[PaymentResult]().
        // CLOSED → OPEN threshold
        OnFailure(5, 10).  // Trip after 5 failures in 10 requests

        // Alternative: percentage-based threshold
        // OnFailureRateExceeded(50, 100).  // 50% failure rate in 100 requests

        // OPEN state duration
        WithDelay(30 * time.Second).

        // State transition hooks
        OnOpen(func(event circuitbreaker.StateChangedEvent) {
            log.Printf("Circuit OPEN: failure threshold exceeded in CLOSED state")
            metrics.Increment("circuit.open")
        }).
        OnClose(func(event circuitbreaker.StateChangedEvent) {
            log.Printf("Circuit returned to CLOSED state")
            metrics.Increment("circuit.closed")
        }).
        Build()

    // Create executor with circuit breaker
    executor := failsafe.NewExecutor[PaymentResult](breaker)

    // Execute through circuit (starts in CLOSED)
    result, err := executor.GetWithExecution(func(exec failsafe.Execution[PaymentResult]) (PaymentResult, error) {
        return processPayment(ctx, orderId)
    })

    if err != nil {
        log.Printf("Payment failed: %v", err)
        return
    }

    log.Printf("Payment successful: %v", result)
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-hystrix-closed",
      systemName: "Netflix Microservices - Hystrix CLOSED State",
      howUsed:
        "Netflix's Hystrix library implements CLOSED state monitoring across hundreds of microservices powering video streaming. Each service-to-service dependency (recommendation engine → user profiles, video player → metadata service, billing → payment gateway) wraps calls with Hystrix commands starting in CLOSED state. During normal operation, the CLOSED circuit transparently forwards all requests while maintaining a 10-second rolling window of success/failure metrics. For example, when the recommendation service calls the user profile API at 10,000 req/sec, the CLOSED circuit tracks failures in real-time. If the profile service database experiences connection pool exhaustion, request failure rate climbs from 2% → 15% → 55% over 30 seconds. The CLOSED state circuit detects this degradation when failure rate exceeds 50% threshold over the 10-second window (requires minimum 20 requests for statistical significance). The circuit immediately transitions to OPEN, preventing 10,000 requests/sec from overwhelming the struggling profile service. Netflix's CLOSED state configuration varies by dependency criticality: critical services (authentication, billing) have aggressive thresholds (30% failure rate, 5-second window) for fast protection, while optional services (recommendations, social features) use lenient thresholds (60% failure rate, 20-second window) to tolerate transient issues. The CLOSED state metrics feed into Netflix's real-time monitoring dashboard showing circuit health, failure rates, and state transitions across the entire microservice fleet. Pattern composition: CLOSED state monitoring + Hystrix dashboard + Thread pool bulkhead + Fallback responses. Impact: Enabled Netflix to maintain 99.99% streaming availability despite frequent microservice failures; reduced cascading failure incidents by 90%; provided real-time visibility into service health through CLOSED state metrics; prevented resource exhaustion by detecting degradation patterns within seconds rather than minutes.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "aws-api-gateway-closed",
      systemName: "AWS API Gateway - Circuit Breaker CLOSED State",
      howUsed:
        "AWS API Gateway implements CLOSED state circuit breakers for routes to backend Lambda functions and HTTP integrations. Each API route (/users → Lambda, /orders → EC2 backend) maintains an independent circuit starting in CLOSED state. The CLOSED circuit monitors backend health by tracking 5xx errors, timeouts (29-second API Gateway limit), and Lambda throttling (TooManyRequestsException). When an e-commerce API handles Black Friday traffic (100,000 req/min), the CLOSED circuits monitor all backend services simultaneously. If the inventory Lambda function starts hitting concurrent execution limits (1000 concurrent invocations), requests begin failing with 429 throttling errors. The CLOSED state circuit tracks failure rate: 5% → 25% → 55% over 60 seconds. Once the 50% threshold is breached (with minimum 100 requests in sliding window), the circuit trips to OPEN. API Gateway immediately returns 503 Service Unavailable for subsequent /inventory requests instead of invoking the throttled Lambda, giving it time to process the backlog. The CLOSED state configuration is service-specific: high-volume endpoints (/products, /search) use count-based sliding windows (last 500 requests) for fast detection, while low-volume admin endpoints (/admin/reports) use time-based windows (last 5 minutes) to accumulate sufficient samples. AWS CloudWatch receives CLOSED state metrics: failure rate, request count, circuit state transitions, enabling automated alarming when circuits trip. Pattern composition: CLOSED state monitoring + AWS CloudWatch metrics + Lambda concurrency limits + API Gateway throttling. Impact: Protected backend services from overwhelming traffic during Black Friday by detecting degradation in CLOSED state; reduced Lambda throttling errors propagated to clients by 85%; maintained API availability by failing fast when backends overloaded; enabled auto-scaling based on circuit state (circuit OPEN → trigger Lambda concurrency increase).",
    },
    {
      systemId: "uber-circuit-closed",
      systemName: "Uber Ride Matching - CLOSED State Monitoring",
      howUsed:
        "Uber's ride matching system implements CLOSED state circuits around critical service dependencies including driver location tracking, pricing calculation, and payment processing. The ride request flow involves 15+ microservice calls, each protected by a circuit starting in CLOSED state. When a rider requests a ride, the matching service calls the driver location service (10,000 req/sec) through a CLOSED circuit. During normal operation, the circuit transparently forwards all location queries while tracking latency and errors in a 100-request sliding window. If the location service's Cassandra cluster experiences compaction storms causing read latencies to spike from 50ms → 500ms → 2000ms, requests start timing out (3-second timeout). The CLOSED circuit monitors this degradation: timeout failures increase from 1% → 20% → 60% over 45 seconds. When failure rate crosses 50% threshold (minimum 20 requests), the circuit trips to OPEN. Instead of blocking ride matching entirely, Uber's fallback uses cached driver locations (up to 30 seconds stale) and estimated positions based on last known heading/speed. The CLOSED state configuration is geographically aware: high-demand regions (Manhattan, San Francisco) use aggressive thresholds (40% failure rate, 30-second window) because driver supply is dense and fallback to cached locations works well. Low-demand regions use lenient thresholds (70% failure rate, 2-minute window) because driver supply is sparse and stale location data is less reliable. Uber's monitoring dashboard displays CLOSED state metrics per region, service, and time of day, correlating circuit trips with traffic patterns, deployments, and infrastructure changes. Pattern composition: CLOSED monitoring + Geographic fallback + Cached location data + Latency-based failure detection. Impact: Maintained ride matching during Cassandra outages by falling back to cached data; reduced user-visible errors by 70% during peak demand; enabled regional isolation where one region's service degradation doesn't cascade globally; provided early warning of infrastructure issues through CLOSED state failure rate spikes before complete outages.",
    },
    {
      systemId: "stripe-closed-monitoring",
      systemName: "Stripe Payment Processing - CLOSED State Detection",
      howUsed:
        "Stripe's payment orchestration layer implements CLOSED state circuits around connections to payment processor gateways (Visa, Mastercard networks). Each payment request flows through multiple processors (primary, backup, fallback), each wrapped in an independent circuit starting in CLOSED. When Stripe processes 50,000 payments/minute, the CLOSED circuits monitor each processor's response times, error rates, and network connectivity. If the primary Visa gateway experiences degradation (database latency issues at processor), payment failures increase from 0.5% (baseline) → 5% → 45% over 2 minutes. The CLOSED circuit uses time-based sliding window (last 60 seconds) to accommodate payment processing's variable latency (200ms-3000ms). When failure rate exceeds 40% threshold (minimum 50 payments in window), the circuit trips to OPEN and Stripe's orchestration layer automatically routes subsequent payments to the backup Visa gateway. The CLOSED state monitors multiple failure types: hard failures (network errors, timeouts), soft failures (processor returns decline but circuit stays healthy), and latency degradation (p99 latency >3s triggers slow call threshold). Stripe's CLOSED configuration is processor-specific: high-reliability processors (direct bank connections) have lenient thresholds (60% failure rate) while third-party processors have aggressive thresholds (30% failure rate). The CLOSED state metrics feed into Stripe's processor health score used for routing decisions—processors with elevated failure rates (even below circuit threshold) receive less traffic. Pattern composition: CLOSED monitoring + Multi-processor fallback + Latency tracking + Smart routing based on health scores. Impact: Maintained 99.99% payment success rate during processor outages; reduced payment failures propagated to merchants by automatically failing over to backup processors; enabled proactive processor degradation detection (failure rate trending up in CLOSED state) before circuits trip; prevented $500M+ in lost transaction volume during major processor incidents by failing fast and routing to healthy alternatives.",
    },
    {
      systemId: "github-mysql-closed",
      systemName: "GitHub Database Access - CLOSED State Circuit",
      howUsed:
        "GitHub implements CLOSED state circuits wrapping MySQL database queries to protect connection pools from slow queries and database overload. Each critical database operation (repository reads, issue queries, pull request fetches) executes through a circuit starting in CLOSED state. The CLOSED circuit monitors query execution time, connection acquisition latency, and database errors. During normal operation with 100,000 queries/minute, the CLOSED circuits track metrics in 200-request sliding windows. If a MySQL replica experiences replication lag (primary at 16:00:00, replica at 15:58:30 - 90 seconds behind), queries requiring strong consistency fail when routed to the stale replica. The application's CLOSED circuit detects rising failure rate: 3% → 15% → 55% over 2 minutes as more queries hit stale data. When failure rate exceeds 50% threshold, the circuit trips to OPEN and the data access layer falls back to the primary database (accepting higher latency) or queues requests for eventual consistency. GitHub's CLOSED state configuration distinguishes query types: read queries use lenient thresholds (60% failure rate, 5-minute window) because stale data is often acceptable, while write queries use aggressive thresholds (20% failure rate, 30-second window) because consistency is critical. The CLOSED circuits also monitor slow queries—if p95 query latency exceeds 1 second (indicating missing index or table lock), the slow call threshold triggers (40% slow queries) and the circuit opens to prevent connection pool exhaustion. GitHub's observability shows CLOSED state metrics per database shard, query type, and application tier, enabling rapid identification of problematic queries before they cause widespread impact. Pattern composition: CLOSED monitoring + Read replica fallback + Query timeout + Connection pool protection + Slow call detection. Impact: Prevented database connection pool exhaustion during replication lag incidents; maintained GitHub availability during MySQL primary failover by falling back to replicas; reduced query timeout cascades by detecting slow queries in CLOSED state and opening circuit; enabled proactive database health monitoring through CLOSED state failure rate trends (gradual increase indicates degrading database performance).",
    },
  ],

  references: [
    {
      title: "Circuit Breaker - Martin Fowler",
      url: "https://martinfowler.com/bliki/CircuitBreaker.html",
      type: "article",
      author: "Martin Fowler",
    },
    {
      title: "Resilience4j CircuitBreaker Documentation",
      url: "https://resilience4j.readme.io/docs/circuitbreaker",
      type: "documentation",
      author: "Resilience4j Authors",
    },
    {
      title: "Netflix Hystrix - How It Works",
      url: "https://github.com/Netflix/Hystrix/wiki/How-it-Works",
      type: "documentation",
      author: "Netflix",
    },
    {
      title: "Release It! - Circuit Breaker Pattern",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Azure Architecture - Circuit Breaker Pattern",
      url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker",
      type: "documentation",
      author: "Microsoft",
    },
  ],

  philosophy: {
    coreProblem:
      "Without continuous failure monitoring in the normal state, systems cannot detect when downstream services begin degrading, leading to delayed failure detection and prolonged resource exhaustion before protective measures activate",
    designPrinciple:
      "Monitor continuously during normal operation to detect failure patterns early, enabling rapid state transition from healthy flow to protective blocking when thresholds are breached",
    historicalContext:
      "The CLOSED state concept emerged from electrical circuit breakers where the closed position allows current flow while monitoring for overload conditions. Netflix's Hystrix popularized the three-state circuit breaker model (CLOSED, OPEN, HALF-OPEN) in microservices architectures around 2012, emphasizing that the CLOSED state is not passive but actively monitors service health. Early implementations used simple consecutive failure counting, but production experience showed this was too sensitive to transient errors. Modern CLOSED state implementations use sliding window metrics with percentage-based thresholds and minimum request volumes, providing statistical significance and avoiding false positives from small sample sizes. The evolution reflects a shift from reactive failure handling (only act when service completely down) to proactive degradation detection (detect when service is degrading but still partially functional).",
    alternativesRejected: [
      "Passive CLOSED State (No Monitoring) - Simply forward requests without tracking success/failure. Results in slow failure detection because system only reacts when service completely fails, not when degrading. Without continuous monitoring, no data exists to make intelligent state transition decisions. Circuit breaker becomes binary on/off switch rather than adaptive health monitor.",
      "Consecutive Failure Counting - Trip circuit after N consecutive failures (e.g., 5 in a row). Too sensitive to transient errors—single burst of failures trips circuit even if service recovers immediately. Doesn't account for overall failure rate—service could be 80% failing but circuit stays closed if failures aren't consecutive. Modern percentage-based thresholds over sliding windows provide better statistical representation of service health.",
      "Total Historical Failure Count - Track all failures since application start, never evict old data. Provides inaccurate health picture because old failures (from hours ago) influence current state decisions. Service could have recovered completely but circuit still sees high failure count from earlier incident. Sliding windows ensure decisions based on recent health, not ancient history.",
      "Always Trip on Single Failure - Open circuit immediately on first failure. Too aggressive—transient errors (network blip, single timeout) would cause constant circuit flipping. Services experience occasional failures during normal operation (cosmic rays flipping bits, brief network congestion); circuit breaker must tolerate noise while detecting genuine patterns. Minimum request thresholds prevent premature tripping on statistically insignificant samples.",
      "Manual State Management - Require operators to manually open/close circuits based on monitoring alerts. Too slow—by the time human sees alert and reacts, cascading failures may have already occurred. Circuit breaker value is automated, millisecond-response failure detection that human reaction time (minutes) cannot match. CLOSED state monitoring enables autonomous protection without human intervention.",
    ],
    mentalModel:
      "The CLOSED state is like a health monitor at a nightclub entrance that tracks the ratio of people causing problems (fights, intoxication) versus well-behaved guests. During normal operation, the door stays open and everyone can enter (CLOSED state—requests flow through). The monitor continuously tracks incidents in a rolling window (last 100 guests). If troublemakers increase from 5% → 20% → 55% of recent entrants, the monitor signals the bouncer to close the door (transition to OPEN state) until the club calms down. The key insight: monitoring happens continuously during normal operation, not just when there's obvious trouble. The CLOSED state is proactive surveillance that detects degrading patterns before complete failure, enabling rapid protective action when thresholds breach.",
  },

  visualization: {
    staticDiagram: `stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> CLOSED: Success/Failure under threshold
    CLOSED --> OPEN: Failure rate ≥ threshold

    note right of CLOSED
      Normal operation
      - All requests forwarded
      - Continuous monitoring
      - Sliding window metrics
      - Failure rate < threshold
    end note

    note right of OPEN
      Circuit tripped
      - Requests fail fast
      - Service given time to recover
    end note`,
    realWorldAnalogy:
      "CLOSED state is like a smoke detector in normal operation. The detector is 'closed' (allowing normal room operation), but it continuously monitors air quality. When smoke particles increase from 0% → 5% → 15% of air samples over 60 seconds, the detector triggers the alarm (transitions to 'open' alarm state). The detector doesn't wait for the room to be completely filled with smoke before reacting—it detects the degrading pattern early while the room is still mostly clear. Similarly, the CLOSED circuit state continuously monitors request success/failure ratio and triggers protection (OPEN state) when degradation patterns emerge, not waiting for complete service failure.",
    useCases: [
      {
        domain: "E-Commerce Microservices",
        scenario:
          "Order service calls inventory service at 5000 req/sec. CLOSED circuit monitors failures. Inventory database becomes overloaded (connection pool exhausted), failures climb from 2% → 45% → 60% over 90 seconds. CLOSED circuit detects 60% failure rate exceeds 50% threshold and trips to OPEN, preventing cascading failures.",
        patternRole:
          "CLOSED state provides continuous health monitoring during normal operation, enabling rapid detection of inventory service degradation and automatic protection via state transition to OPEN",
        companies: ["Amazon", "Shopify", "Walmart"],
      },
      {
        domain: "Payment Processing",
        scenario:
          "Stripe routes payments to Visa processor gateway. CLOSED circuit tracks processor response times and errors. Processor experiences regional outage, payment failures increase from 0.5% → 8% → 45% over 2 minutes. CLOSED circuit detects degradation and trips to OPEN, triggering automatic failover to backup processor.",
        patternRole:
          "CLOSED state monitoring detects payment processor degradation early, enabling sub-minute failover to backup processors before significant payment volume is lost",
        companies: ["Stripe", "PayPal", "Square", "Adyen"],
      },
      {
        domain: "Content Delivery and Streaming",
        scenario:
          "Netflix recommendation service calls user profile API at 10,000 req/sec. CLOSED circuit monitors profile service health. Profile service database experiences slow query (missing index), timeouts increase from 1% → 30% → 65% over 60 seconds. CLOSED circuit trips to OPEN, enabling fallback to cached profiles.",
        patternRole:
          "CLOSED state continuously tracks profile service failures, detecting database degradation pattern and triggering fallback to cached data before recommendation rendering breaks completely",
        companies: ["Netflix", "YouTube", "Spotify", "Disney+"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "circuit-breaker",
    "monitoring",
    "failure-detection",
    "state-machine",
    "metrics",
  ],
  difficulty: "intermediate",
};
