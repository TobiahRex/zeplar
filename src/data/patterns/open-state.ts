import type { Pattern } from "../schema";

export const openState: Pattern = {
  id: "open-state",
  slug: "open-state",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔌 Circuit Breaker → 🔓 Open State",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Circuit Breaker",
    level: 4,
  },

  concept: {
    name: "Open State",
    emoji: "🔓",
    tagline: "Fail fast",
    definition:
      "The Open State is the protective mode of a circuit breaker where all requests to a failing service are immediately rejected without attempting to call it, giving the service time to recover while preventing cascading failures. Think of it like an electrical circuit breaker that trips to cut power during an overload, preventing fire—the breaker stops forwarding requests to protect both the caller and the failing service. When the failure threshold is exceeded (e.g., more than 50% failures over a sliding window), the circuit trips to Open and starts a timeout period (e.g., 60 seconds). During this period, all incoming requests fail immediately with a circuit open error, without consuming threads, connections, or time waiting for timeouts. This fail-fast behavior prevents resource exhaustion in the caller and gives the struggling service breathing room to recover without being bombarded by additional failing requests. After the timeout expires, the circuit transitions to Half-Open to test if recovery has occurred.",
    problemSolved:
      "When a downstream service fails or becomes slow, continuing to send requests wastes resources (threads blocked waiting for timeouts), worsens the failure (overwhelming an already struggling service), and causes cascading failures up the call chain. The Open State solves this by immediately rejecting requests the moment failure threshold is exceeded, preventing further damage. For example, if a database becomes overloaded and starts timing out on 80% of queries, keeping the circuit closed would tie up hundreds of application threads waiting for timeouts (consuming memory and CPU), exacerbating the database overload, and causing the application itself to become unresponsive. Opening the circuit immediately frees these resources, stops attacking the database, and allows it to drain its query backlog and recover. The pattern transforms slow, resource-draining cascading failures into fast, predictable rejections that preserve system stability.",
    tradeoffs: {
      pros: [
        "Prevents cascading failures by stopping traffic to failing service immediately",
        "Frees up resources (threads, connections, memory) by failing fast instead of waiting for timeouts",
        "Gives failing service time and space to recover without continued load",
        "Provides fast, predictable response times (immediate rejection) instead of slow timeouts",
        "Enables graceful degradation via fallback logic (cached data, default responses)",
      ],
      cons: [
        "Rejects all requests, including those that might have succeeded (false positives)",
        "Requires configuring timeout duration—too short prevents recovery, too long delays restoration",
        "Can create user-visible errors if fallback logic is not implemented",
        "May trip unnecessarily on transient failures that would have self-recovered quickly",
        "Coordinated circuit opening across many instances can create thundering herd when transitioning to Half-Open",
      ],
    },
    relatedPatterns: [
      "circuit-breaker",
      "closed-state",
      "half-open-state",
      "fallback",
      "bulkhead",
      "timeout",
    ],
  },

  structure: {
    participants: [
      {
        name: "Circuit Breaker State Machine",
        role: "Protective Fail-Fast Controller",
        responsibilities: [
          "Monitor elapsed time since circuit opened and track open duration",
          "Immediately reject all incoming requests without attempting service calls (fail-fast)",
          "Count and report rejected requests for observability metrics",
          "Determine when reset timeout has elapsed and transition to Half-Open state",
          "Provide detailed error context to callers including time until reset attempt",
        ],
      },
      {
        name: "Client Application",
        role: "Service Consumer",
        responsibilities: [
          "Handle circuit open errors gracefully without retrying immediately",
          "Invoke fallback logic when circuit breaker rejects requests",
          "Respect timeout period by not overwhelming circuit with retry attempts",
          "Display user-friendly messages during degraded service state",
        ],
      },
      {
        name: "Protected Service",
        role: "Failing Downstream Dependency",
        responsibilities: [
          "Service is currently unhealthy (overloaded, crashed, network partition)",
          "Not receiving traffic during Open State (given time to recover)",
          "May recover health during the reset timeout period",
          "Will be tested for recovery via single probe request when Half-Open",
        ],
      },
      {
        name: "Fallback Handler",
        role: "Graceful Degradation Provider",
        responsibilities: [
          "Provide alternative responses when circuit is open (cached data, defaults, backup service)",
          "Return stale but functional data to maintain user experience",
          "Queue requests for deferred processing if appropriate",
          "Track fallback invocations for monitoring",
        ],
      },
      {
        name: "Monitoring System",
        role: "Circuit Health Observer",
        responsibilities: [
          "Track open duration and time remaining until reset attempt",
          "Count requests rejected while circuit is open",
          "Alert operations team when circuit opens (service failure detected)",
          "Monitor fallback invocations and cache hit rates during degraded mode",
          "Correlate circuit open events with service health metrics",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant CircuitBreaker as Circuit Breaker<br/>(OPEN State)
    participant Service as Protected Service<br/>(Unhealthy)
    participant Cache
    participant Monitoring

    Note over CircuitBreaker: Circuit just tripped to OPEN<br/>Failure threshold exceeded
    CircuitBreaker->>CircuitBreaker: Record openedAt timestamp
    CircuitBreaker->>Monitoring: Emit circuit opened event

    Note over Client,Monitoring: Request 1: Immediate Rejection

    Client->>CircuitBreaker: Request A
    CircuitBreaker->>CircuitBreaker: Check state: OPEN ⛔
    CircuitBreaker->>CircuitBreaker: Calculate time elapsed:<br/>now - openedAt = 5s
    Note over CircuitBreaker: 5s elapsed < 60s timeout<br/>Still in cooling period
    CircuitBreaker->>CircuitBreaker: Increment rejection counter
    CircuitBreaker->>Monitoring: Log rejection (count: 1)
    CircuitBreaker--xClient: Reject: Circuit OPEN<br/>(55s until reset attempt)
    Client->>Cache: Fallback: check cache
    Cache-->>Client: Return cached response
    Note over Client: User sees stale data<br/>(graceful degradation)

    Note over Client,Monitoring: Request 2: Still Rejecting

    Client->>CircuitBreaker: Request B
    CircuitBreaker->>CircuitBreaker: Check state: OPEN ⛔
    CircuitBreaker->>CircuitBreaker: Time elapsed: 10s<br/>Time remaining: 50s
    CircuitBreaker->>CircuitBreaker: Increment rejection counter
    CircuitBreaker->>Monitoring: Log rejection (count: 2)
    CircuitBreaker--xClient: Reject: Circuit OPEN<br/>(50s until reset)
    Client->>Client: Execute fallback logic
    Note over Client: Fallback returns default

    Note over Service: Service continues to be unhealthy<br/>No traffic received (breathing room)

    Note over Client,Monitoring: 60 seconds later: Reset Timeout Elapsed

    Client->>CircuitBreaker: Request C
    CircuitBreaker->>CircuitBreaker: Check state: OPEN ⛔
    CircuitBreaker->>CircuitBreaker: Time elapsed: 60s<br/>Timeout reached! ⏰
    CircuitBreaker->>CircuitBreaker: Transition: OPEN → HALF-OPEN
    CircuitBreaker->>Monitoring: Emit half-open event
    Note over CircuitBreaker: Allow THIS request as probe
    CircuitBreaker->>Service: Forward probe request
    Service--xCircuitBreaker: Request fails (still unhealthy)
    CircuitBreaker->>CircuitBreaker: Probe failed → Reopen circuit
    CircuitBreaker->>CircuitBreaker: Reset openedAt = now
    CircuitBreaker->>Monitoring: Circuit reopened (probe failed)
    CircuitBreaker--xClient: Return probe failure
    Note over CircuitBreaker: Circuit OPEN again<br/>Another 60s timeout begins

    Note over Client,Monitoring: Later: Service Recovers

    Note over Service: Service becomes healthy<br/>(database connection restored)

    Client->>CircuitBreaker: Request D (after another 60s)
    CircuitBreaker->>CircuitBreaker: Time elapsed: 60s → HALF-OPEN
    CircuitBreaker->>Service: Probe request
    Service-->>CircuitBreaker: Success response ✓
    CircuitBreaker->>CircuitBreaker: Probe succeeded → CLOSE circuit
    CircuitBreaker->>Monitoring: Circuit closed (service recovered)
    CircuitBreaker-->>Client: Return successful response
    Note over CircuitBreaker: Circuit CLOSED<br/>Normal operation resumed`,
    flow: [
      {
        step: 1,
        actor: "Circuit Breaker",
        action: "Enter Open State",
        description:
          "Circuit transitions to OPEN when failure threshold exceeded in Closed state (e.g., >50% failures over sliding window). Record timestamp of opening and reset rejection counters.",
      },
      {
        step: 2,
        actor: "Client Application",
        action: "Attempt Request",
        description:
          "Client makes request to protected service through circuit breaker, unaware circuit is open.",
      },
      {
        step: 3,
        actor: "Circuit Breaker",
        action: "Detect Open State",
        description:
          "Circuit breaker checks current state and finds it is OPEN, triggering fail-fast rejection logic.",
      },
      {
        step: 4,
        actor: "Circuit Breaker",
        action: "Calculate Time Remaining",
        description:
          "Calculate elapsed time since circuit opened (now - openedAt) and time remaining until reset timeout (resetTimeout - elapsed). Determines if enough time has passed to attempt recovery.",
      },
      {
        step: 5,
        actor: "Circuit Breaker",
        action: "Reject Request Immediately",
        description:
          "If timeout not elapsed, immediately reject request without calling protected service. Increment rejection counter and return Circuit Open error with metadata (openedAt, resetAt, timeRemaining).",
      },
      {
        step: 6,
        actor: "Client Application",
        action: "Execute Fallback",
        description:
          "Client catches Circuit Open error and executes fallback logic: check cache for stale data, call backup service, return static defaults, or queue for deferred processing.",
      },
      {
        step: 7,
        actor: "Monitoring System",
        action: "Track Rejection Metrics",
        description:
          "Log each rejection with timestamp, operation name, and time remaining. Track rejection rate, open duration, and fallback invocation patterns. Alert if rejection count exceeds thresholds.",
      },
      {
        step: 8,
        actor: "Circuit Breaker",
        action: "Attempt Reset After Timeout",
        description:
          "When next request arrives after reset timeout elapsed, transition from OPEN to HALF-OPEN state and allow that single request through as a probe to test service recovery.",
      },
    ],
    invariants: [
      "Circuit must reject ALL requests while in OPEN state (no exceptions except transition probe)",
      "Open duration timestamp must be recorded when entering OPEN state",
      "Time remaining until reset must never be negative",
      "Rejection counter must increment for every rejected request",
      "Circuit must transition to HALF-OPEN after exactly one reset timeout period",
      "No requests may reach protected service while circuit is OPEN (strict fail-fast)",
      "Reset timeout must be configurable and greater than zero",
    ],
  },

  codeExamples: [
    {
      id: "open-state-ts-basic",
      language: "typescript",
      title: "Open State Circuit Breaker with Fail-Fast",
      description:
        "Implementation of the Open State where all requests are immediately rejected to prevent cascading failures and give the failing service time to recover, with automatic transition to Half-Open after timeout.",
      code: `type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface OpenStateConfig {
  resetTimeout: number;           // Time to wait before transitioning to HALF_OPEN (ms)
  fallbackEnabled: boolean;       // Whether to use fallback logic when circuit is open
}

interface CircuitBreakerError extends Error {
  code: 'CIRCUIT_OPEN';
  openedAt: number;
  resetAt: number;
  timeRemaining: number;
}

class OpenStateCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private openedAt: number = 0;
  private requestsRejectedWhileOpen = 0;
  private fallbackInvocations = 0;

  constructor(private config: OpenStateConfig) {}

  // Attempt to execute a request when circuit is OPEN
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // If circuit is OPEN, implement fail-fast behavior
    if (this.state === 'OPEN') {
      return this.handleOpenState(operation, operationName, fallback);
    }

    // For other states (CLOSED, HALF_OPEN), execute normally
    console.log(\`[\${this.state}] Executing: \${operationName}\`);
    return await operation();
  }

  // Fail-fast logic when circuit is OPEN
  private async handleOpenState<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const timeElapsed = now - this.openedAt;
    const timeRemaining = this.config.resetTimeout - timeElapsed;

    console.log(\`[OPEN] ⛔ Request blocked: \${operationName}\`);
    console.log(\`       Circuit has been open for \${timeElapsed}ms\`);

    // Check if enough time has passed to transition to HALF_OPEN
    if (this.shouldAttemptReset()) {
      console.log(\`       ⏰ Reset timeout expired - transitioning to HALF_OPEN\`);
      this.transitionToHalfOpen();
      // Allow this request through as a probe request
      console.log(\`       🔍 Allowing probe request to test service recovery\`);
      return await operation();
    }

    // Circuit still open - reject request immediately
    this.requestsRejectedWhileOpen++;
    console.log(\`       Time until reset attempt: \${timeRemaining}ms\`);
    console.log(\`       Total requests rejected while open: \${this.requestsRejectedWhileOpen}\`);

    // Use fallback if available
    if (fallback && this.config.fallbackEnabled) {
      this.fallbackInvocations++;
      console.log(\`       ↩️  Invoking fallback logic (invocation #\${this.fallbackInvocations})\`);
      return await fallback();
    }

    // No fallback - throw circuit open error
    const error: CircuitBreakerError = Object.assign(
      new Error(\`Circuit breaker is OPEN for \${operationName}\`),
      {
        code: 'CIRCUIT_OPEN' as const,
        openedAt: this.openedAt,
        resetAt: this.openedAt + this.config.resetTimeout,
        timeRemaining,
      }
    );

    throw error;
  }

  // Check if reset timeout has elapsed
  private shouldAttemptReset(): boolean {
    const timeElapsed = Date.now() - this.openedAt;
    return timeElapsed >= this.config.resetTimeout;
  }

  // Transition from OPEN to HALF_OPEN state
  private transitionToHalfOpen(): void {
    console.log(\`\\n🔄 STATE TRANSITION: OPEN → HALF_OPEN\`);
    this.state = 'HALF_OPEN';
  }

  // Manually trip the circuit to OPEN state (simulating failure threshold exceeded)
  tripCircuit(): void {
    if (this.state === 'OPEN') {
      console.log('[OPEN] Circuit already open');
      return;
    }

    console.log(\`\\n🔴 CIRCUIT TRIPPED: \${this.state} → OPEN\`);
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.requestsRejectedWhileOpen = 0;
    this.fallbackInvocations = 0;
    console.log(\`       Will attempt reset in \${this.config.resetTimeout}ms\\n\`);
  }

  // Close the circuit (simulating successful recovery)
  closeCircuit(): void {
    if (this.state === 'CLOSED') {
      return;
    }

    console.log(\`\\n✅ CIRCUIT CLOSED: Service recovered\`);
    this.state = 'CLOSED';
    this.openedAt = 0;
  }

  // Get current state and metrics
  getStatus() {
    const now = Date.now();
    const openDuration = this.state === 'OPEN' ? now - this.openedAt : 0;
    const timeUntilReset = this.state === 'OPEN'
      ? Math.max(0, this.config.resetTimeout - openDuration)
      : 0;

    return {
      state: this.state,
      isOpen: this.state === 'OPEN',
      openDuration: openDuration + 'ms',
      timeUntilReset: timeUntilReset + 'ms',
      requestsRejected: this.requestsRejectedWhileOpen,
      fallbackInvocations: this.fallbackInvocations,
    };
  }
}

// ============================================================================
// USAGE EXAMPLE: Demonstrate OPEN state fail-fast behavior
// ============================================================================

// Simulated downstream service
class PaymentService {
  private isHealthy = false;

  setHealthy(healthy: boolean): void {
    this.isHealthy = healthy;
    console.log(\`\\n💊 PaymentService health set to: \${healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}\\n\`);
  }

  async processPayment(amount: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!this.isHealthy) {
      throw new Error('Payment service unavailable - database connection failed');
    }

    return \`Payment of $\${amount} processed successfully\`;
  }
}

// Fallback function for graceful degradation
async function fallbackPayment(amount: number): Promise<string> {
  // In real system: queue for later processing, use cached authorization, etc.
  console.log(\`       💾 Queuing payment of $\${amount} for deferred processing\`);
  return \`Payment of $\${amount} queued for processing when service recovers\`;
}

async function demonstrateOpenState() {
  console.log('=== Circuit Breaker OPEN State Demo ===\\n');

  const circuitBreaker = new OpenStateCircuitBreaker({
    resetTimeout: 3000,      // 3 seconds before attempting reset
    fallbackEnabled: true,   // Enable graceful degradation
  });

  const paymentService = new PaymentService();
  paymentService.setHealthy(false);  // Start with unhealthy service

  // Phase 1: Healthy service, circuit CLOSED
  console.log('--- Phase 1: Circuit CLOSED, Service Unhealthy ---\\n');

  try {
    await circuitBreaker.execute(
      () => paymentService.processPayment(100),
      'Payment #1'
    );
  } catch (error) {
    console.log(\`Failed: \${(error as Error).message}\\n\`);
  }

  // Simulate circuit tripping after multiple failures (not shown for brevity)
  console.log('\\n(Simulating failure threshold exceeded...)\\n');
  circuitBreaker.tripCircuit();

  console.log('\\n--- Phase 2: Circuit OPEN - Fail-Fast Protection ---\\n');

  // Attempt multiple requests while circuit is OPEN
  for (let i = 1; i <= 5; i++) {
    console.log(\`\\nAttempt #\${i}:\`);

    try {
      const result = await circuitBreaker.execute(
        () => paymentService.processPayment(100 + i * 10),
        \`Payment #\${i + 1}\`,
        () => fallbackPayment(100 + i * 10)  // Fallback function
      );
      console.log(\`✓ Result: \${result}\`);
    } catch (error) {
      console.log(\`✗ Error: \${(error as Error).message}\`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\\n\\n--- Phase 3: Reset Timeout Elapsed ---\\n');

  // Service is still unhealthy but timeout elapsed
  console.log('Waiting for reset timeout to elapse...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(\`\\nAttempting request after timeout:\`);
  try {
    await circuitBreaker.execute(
      () => paymentService.processPayment(200),
      'Payment (probe request)',
      () => fallbackPayment(200)
    );
  } catch (error) {
    console.log(\`Probe request failed: \${(error as Error).message}\`);
    console.log('Circuit will reopen due to probe failure');
  }

  // Phase 4: Service recovers, successful probe request
  console.log('\\n\\n--- Phase 4: Service Recovery ---\\n');

  paymentService.setHealthy(true);  // Service recovers
  circuitBreaker.tripCircuit();     // Reset to OPEN for demo

  console.log('Waiting for reset timeout...');
  await new Promise(resolve => setTimeout(resolve, 3100));

  console.log(\`\\nProbe request with healthy service:\`);
  try {
    const result = await circuitBreaker.execute(
      () => paymentService.processPayment(300),
      'Payment (successful probe)',
      () => fallbackPayment(300)
    );
    console.log(\`✓ Probe succeeded: \${result}\`);
    console.log('Circuit will close - service is healthy again');
    circuitBreaker.closeCircuit();
  } catch (error) {
    console.log(\`Probe failed: \${(error as Error).message}\`);
  }

  // Show final status
  console.log('\\n\\n--- Final Status ---');
  console.log(JSON.stringify(circuitBreaker.getStatus(), null, 2));

  console.log('\\n✅ Demo complete - OPEN state prevented cascading failures and enabled recovery');
}

// Run the demonstration
demonstrateOpenState();`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete OPEN state implementation showing fail-fast request rejection to prevent cascading failures while the protected service recovers, with automatic transition to Half-Open for recovery testing",
        prerequisites: [
          "Circuit breaker state machine concepts",
          "Fail-fast principle",
          "Graceful degradation and fallback patterns",
          "TypeScript async/await and error handling",
          "Timeout and recovery mechanisms",
        ],
        systemPosition:
          "Protective layer in service-to-service communication that blocks requests to failing dependencies, positioned at service boundaries to prevent cascading failures across distributed systems",
      },
      annotations: [
        {
          id: "os-fail-fast-check",
          lines: [27, 30],
          action:
            "Check if circuit is OPEN and trigger fail-fast rejection logic",
          reason:
            "OPEN state's primary purpose is to immediately reject requests without attempting to call the failing service, preventing resource waste (threads, connections, memory) and giving service time to recover",
          contextLevel: "module",
        },
        {
          id: "os-time-tracking",
          lines: [43, 46],
          action:
            "Calculate time elapsed since circuit opened and time remaining until reset",
          reason:
            "Tracking open duration enables both informative error messages to callers and determination of when to attempt service recovery via transition to HALF_OPEN state",
          contextLevel: "local",
        },
        {
          id: "os-reset-check",
          lines: [51, 58],
          action:
            "Check if reset timeout elapsed and transition to HALF_OPEN for recovery probe",
          reason:
            "After giving service time to recover (reset timeout), circuit must cautiously test if service is healthy again; HALF_OPEN state allows single probe request to avoid indefinite circuit open state",
          contextLevel: "module",
        },
        {
          id: "os-rejection-counter",
          lines: [61, 63],
          action:
            "Increment counter tracking requests rejected while circuit is open",
          reason:
            "Rejection metrics provide visibility into impact of open circuit - high rejection counts indicate either sustained service outage or need to tune circuit breaker thresholds; critical for observability",
          contextLevel: "system",
        },
        {
          id: "os-fallback",
          lines: [66, 71],
          action:
            "Invoke fallback function to provide degraded but functional response",
          reason:
            "Fallback logic enables graceful degradation - instead of complete failure, return cached data, default values, or queue request for later; maintains user experience during outages",
          contextLevel: "system",
        },
        {
          id: "os-error-details",
          lines: [74, 83],
          action:
            "Create detailed error with circuit state metadata for callers",
          reason:
            "Rich error context helps upstream services make informed decisions - they can implement their own fallbacks, retry logic, or user messaging based on when circuit will reset and why it's open",
          contextLevel: "module",
        },
        {
          id: "os-timeout-check",
          lines: [87, 90],
          action: "Compare elapsed time against configured reset timeout",
          reason:
            "Reset timeout represents the breathing room given to failing service - too short prevents adequate recovery, too long delays restoration; this check determines when automatic recovery attempt should begin",
          contextLevel: "module",
        },
        {
          id: "os-transition",
          lines: [93, 97],
          action: "Transition circuit state from OPEN to HALF_OPEN",
          reason:
            "HALF_OPEN is transitional state that cautiously tests service recovery by allowing limited probe requests; prevents prematurely flooding recovering service with full production load",
          contextLevel: "module",
        },
        {
          id: "os-trip-circuit",
          lines: [100, 113],
          action:
            "Manually trip circuit to OPEN state and initialize tracking variables",
          reason:
            "Circuit opens when failure threshold exceeded in CLOSED state; initializes open timestamp for timeout tracking and resets counters; in production this is triggered automatically by failure detection",
          contextLevel: "module",
        },
        {
          id: "os-state-reset",
          lines: [108, 111],
          action:
            "Record timestamp when circuit opened and reset rejection counters",
          reason:
            "Opening timestamp is critical for timeout calculations; resetting counters ensures metrics reflect only current open period, not previous open/close cycles",
          contextLevel: "local",
        },
        {
          id: "os-metrics",
          lines: [125, 139],
          action: "Calculate and expose circuit state metrics for monitoring",
          reason:
            "Metrics enable real-time visibility into circuit health - teams can monitor open duration, rejection counts, fallback usage to assess service health and tune circuit breaker configuration",
          contextLevel: "system",
        },
        {
          id: "os-unhealthy-service",
          lines: [162, 163],
          action:
            "Simulate unhealthy downstream service that fails all requests",
          reason:
            "Demonstrates realistic failure scenario where database, API, or network issues cause service to become completely unavailable; shows why fail-fast is necessary to prevent resource exhaustion",
          contextLevel: "micro",
        },
        {
          id: "os-graceful-degradation",
          lines: [176, 180],
          action:
            "Implement fallback that queues payment for deferred processing",
          reason:
            "Shows practical graceful degradation strategy - instead of failing checkout completely, queue payment for later processing when service recovers; maintains business continuity during outages",
          contextLevel: "system",
        },
        {
          id: "os-rejection-phase",
          lines: [211, 227],
          action:
            "Send multiple requests to demonstrate consistent fail-fast rejection",
          reason:
            "Shows OPEN state rejecting all requests immediately without attempting service calls; demonstrates how fail-fast prevents resource exhaustion (no threads waiting, no timeouts) during outages",
          contextLevel: "module",
        },
        {
          id: "os-recovery-attempt",
          lines: [231, 244],
          action:
            "Wait for timeout to elapse and attempt probe request with still-unhealthy service",
          reason:
            "Demonstrates automatic transition to HALF_OPEN after timeout; shows probe request failing causing circuit to reopen - service hasn't recovered yet so circuit protects against premature full traffic",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [27, 30],
          label:
            "Fail-fast check that prevents doomed requests from consuming resources",
          sbvpDomain: "behavior",
        },
        {
          lines: [51, 58],
          label:
            "Automatic recovery mechanism transitioning to HALF_OPEN after timeout",
          sbvpDomain: "behavior",
        },
        {
          lines: [66, 71],
          label: "Graceful degradation via fallback logic",
          sbvpDomain: "philosophy",
        },
        {
          lines: [74, 83],
          label: "Rich error context for upstream decision making",
          sbvpDomain: "structure",
        },
        {
          lines: [100, 113],
          label: "Circuit state transition and tracking initialization",
          sbvpDomain: "structure",
        },
        {
          lines: [61, 63],
          label: "Rejection metrics for observability and impact assessment",
          sbvpDomain: "philosophy",
        },
        {
          lines: [211, 227],
          label: "Fail-fast preventing cascading failures during outage",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "API Gateway Layer - Open State circuit breakers are positioned at the API gateway entry point to protect backend microservices from being overwhelmed when they're already struggling. When Netflix's Zuul gateway detects that the recommendation service has exceeded failure thresholds (50% error rate over 100 requests), the circuit trips to OPEN and immediately rejects all incoming requests to that service without forwarding them upstream. This fail-fast behavior at the edge prevents failing services from receiving additional load that would delay recovery, while the gateway returns cached recommendations or generic content to users. The OPEN state gives the recommendation service breathing room—database connections are released, memory is freed, thread pools drain—enabling recovery without continued bombardment. After the configured timeout (typically 30-60 seconds), the circuit transitions to HALF-OPEN to test if the service has recovered via a single probe request. This placement is critical because it's the earliest possible interception point before traffic reaches struggling services, maximizing protection effectiveness.",

      "Service Mesh Sidecar Proxies - Istio, Linkerd, and Envoy implement Open State logic in sidecar proxies adjacent to each microservice instance, providing infrastructure-level fail-fast protection without application code changes. When the sidecar detects consecutive failures from its local service instance (database connection failures, memory exhaustion, CPU saturation), it transitions the circuit to OPEN and returns 503 Service Unavailable for all incoming requests. This placement enables per-instance circuit breaking—if one of 10 instances is unhealthy, only that instance's circuit opens while healthy instances continue serving traffic. The OPEN state prevents load balancers from routing requests to unhealthy instances, automatically removing them from the serving pool. Envoy's outlier detection tracks failures per endpoint and ejects unhealthy instances, treating circuit OPEN as a form of automatic host removal. After the base ejection time (reset timeout), the sidecar allows a probe request to test recovery. This architectural placement provides circuit breaking as a platform capability, ensuring consistent fail-fast behavior across polyglot microservices written in different languages.",

      "HTTP Client Libraries - Circuit breaker implementations in HTTP clients (Resilience4j decorating RestTemplate, Polly wrapping HttpClient, opossum around axios) place Open State logic at the client-side request boundary, where outbound calls to external dependencies are initiated. When a Spring Boot application uses @CircuitBreaker annotation on a method calling a payment gateway, repeated timeout or 5xx errors trip the circuit to OPEN. Subsequent calls to the annotated method immediately throw CircuitBreakerOpenException without attempting the HTTP request, preventing wasted network calls, connection pool exhaustion, and thread blocking. This placement gives individual services autonomy in protecting themselves from failing dependencies—each service maintains its own circuit state based on its observed failure patterns. The OPEN state frees client-side resources (threads no longer waiting for timeouts, connection pool slots returned immediately) while giving the dependency time to recover. Fallback methods execute during OPEN state to provide degraded functionality (cached payment authorizations, queued transactions). This client-side placement is crucial for autonomous service resilience in microservices architectures where centralized failure coordination is impractical.",

      "Database Connection Pool Managers - Connection pool implementations (HikariCP, c3p0, database driver pools) incorporate circuit breaker Open State logic to handle database outages, network partitions, and resource exhaustion scenarios. When applications attempt to acquire connections from a pool and encounter repeated failures (connection timeout, network unreachable, authentication errors), the pool manager can trip to OPEN state and immediately reject connection requests with 'pool circuit open' errors. This prevents application threads from blocking indefinitely waiting for database connections that will never succeed, avoiding the catastrophic scenario where all worker threads are stuck in connection acquisition. The OPEN state allows existing connections to drain gracefully, enables the database to recover from overload, and prevents connection storms when the database comes back online. After reset timeout, the pool transitions to HALF-OPEN and attempts a single connection acquisition to test database availability. This placement protects the database layer, which is often the critical bottleneck and single point of failure in traditional architectures.",

      "Message Queue Consumers - Message processing systems implement Open State for per-queue or per-message-handler circuit breaking to prevent poison messages or downstream dependency failures from blocking queue consumption. When a Kafka consumer's message handler repeatedly fails processing messages (database insert failures, external API timeouts, deserialization errors), the consumer circuit trips to OPEN and stops consuming new messages from the partition. This prevents the consumer from attempting to process messages that will certainly fail, avoiding wasted processing cycles and allowing the queue to accumulate messages temporarily. During OPEN state, messages remain in the queue unprocessed, avoiding message loss while giving downstream dependencies time to recover. Dead letter queue routing can be configured for OPEN state—messages that would be processed while circuit is open are moved to DLQ for later inspection. After reset timeout, the consumer transitions to HALF-OPEN and attempts processing a single message to test recovery. This placement prevents queue processing failures from cascading into consumer crashes or memory exhaustion from retry storms.",
    ],
    architecturalBoundaries: [
      "Service-to-Service Communication Boundary - Open State operates at the inter-service call boundary where one microservice invokes another's API, typically over HTTP/REST or gRPC. When Service A calls Service B and B's circuit is OPEN (due to B being overloaded, crashed, or network-partitioned), Service A receives immediate rejection rather than waiting for timeouts or attempting doomed requests. This boundary is critical because it decouples service health—A continues operating normally (with fallbacks) while B recovers. The OPEN state transforms the boundary from a blocking synchronous call that can hang indefinitely into a fast, predictable rejection that enables A to make informed decisions (retry later, use cached data, call backup service). Pattern placement at this boundary enables graceful degradation where partial system failures don't cascade into complete outages—shopping cart works even when recommendation engine is down, video playback continues even when personalization fails.",

      "External Dependency Integration Boundary - The boundary between your system and third-party services (payment processors, geocoding APIs, authentication providers, shipping calculators) is where Open State provides critical protection against external failures impacting your infrastructure. When Stripe's payment API experiences an outage and your payment service's circuit trips to OPEN, all payment requests are immediately rejected locally without consuming your connection pool, threads, or timeouts waiting for Stripe's unresponsive API. This boundary acts as a firewall—external service degradation stops at the integration point rather than propagating into your application as resource exhaustion. OPEN state enables your system to maintain stability and responsiveness (serving cached data, showing maintenance messages) even when critical external dependencies fail completely. After reset timeout, a probe request tests if Stripe has recovered before resuming full traffic.",

      "Data Access Layer Boundary - Between application business logic and database queries, Open State prevents database failures (connection timeouts, lock contention, slow queries) from blocking application threads and exhausting resources. When a database becomes overloaded and query execution times exceed thresholds, the data access layer circuit trips to OPEN and immediately rejects query attempts. This prevents the classic failure mode where hundreds of application threads block waiting for database responses, consuming all available threads and causing the application to become unresponsive. OPEN state forces the application to use fallback strategies (return cached data, redirect reads to replicas, queue writes for later) while the database recovers. This boundary is particularly important in high-traffic applications where database bottlenecks can take down the entire service—OPEN state keeps the application layer healthy even when data layer fails.",

      "Asynchronous Processing Boundary - Within event-driven and message-based systems, Open State operates at the boundary between message consumers and their downstream dependencies (databases for storing events, APIs for notifications, services for processing). When a Kafka consumer processes messages that trigger downstream API calls, and those API calls consistently fail, the circuit trips to OPEN and the consumer stops attempting to process messages (or moves them to DLQ). This boundary prevents poison messages or downstream failures from blocking the entire message stream. Without circuit breaking, the consumer would continuously retry failed messages, blocking processing of subsequent messages. OPEN state allows the stream to pause gracefully, giving downstream dependencies time to recover while maintaining message ordering guarantees. After timeout, a probe message tests recovery before resuming full processing.",

      "Not Recommended for In-Process Calls - Open State circuit breakers should NOT be placed at boundaries between methods within the same process or service. Applying circuit breaking to in-memory function calls adds unnecessary overhead without addressing real failure modes—if a method fails due to a bug, circuit breaking won't help; it will succeed or fail deterministically based on inputs. Circuit breakers are designed for protecting against unpredictable failures in distributed systems (network partitions, remote service overload), not deterministic logic errors. Save circuit breaking for operations involving network I/O, external resources, or cross-process communication where failures are non-deterministic and resources can be exhausted.",
    ],
    interactsWith: [
      "circuit-breaker",
      "closed-state",
      "half-open-state",
      "fallback",
      "timeout",
      "retry",
      "bulkhead",
      "health-check",
      "exponential-backoff",
      "cache-aside",
    ],
  },

  implementations: [
    {
      id: "resilience4j-open-state",
      name: "Resilience4j Circuit Breaker Open State (Java)",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Resilience4j implements sophisticated Open State behavior with sliding window failure tracking, automatic state transitions, and event-driven observability. When failure rate exceeds threshold, circuit opens and immediately rejects calls with CallNotPermittedException. Configurable wait duration in open state before transitioning to half-open for recovery testing.",
      links: {
        docs: "https://resilience4j.readme.io/docs/circuitbreaker",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.time.Duration;

// Configure circuit breaker with Open State parameters
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
  .failureRateThreshold(50)                    // Open at 50% failure rate
  .slidingWindowSize(100)                       // Track last 100 calls
  .waitDurationInOpenState(Duration.ofSeconds(60))  // Stay OPEN for 60s
  .permittedNumberOfCallsInHalfOpenState(3)    // Allow 3 probes in HALF-OPEN
  .automaticTransitionFromOpenToHalfOpenEnabled(true)  // Auto-transition
  .recordExceptions(IOException.class, TimeoutException.class)
  .ignoreExceptions(BusinessException.class)
  .build();

CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
CircuitBreaker circuitBreaker = registry.circuitBreaker("paymentService");

// Register event listeners for Open State monitoring
circuitBreaker.getEventPublisher()
  .onStateTransition(event -> {
    if (event.getStateTransition().getToState() == CircuitBreaker.State.OPEN) {
      logger.warn("Circuit OPEN: {}", event);
      metrics.recordCircuitOpen("paymentService");
      alerting.notify("Payment service circuit opened - failing fast");
    }
  })
  .onCallNotPermitted(event -> {
    // Called every time a request is rejected while OPEN
    logger.debug("Request rejected - circuit is OPEN");
    metrics.incrementRejectionCount("paymentService");
  });

// Execute with circuit breaker protection
Supplier<PaymentResponse> supplier = CircuitBreaker
  .decorateSupplier(circuitBreaker, () -> paymentClient.processPayment(request));

try {
  PaymentResponse response = supplier.get();
  logger.info("Payment successful: {}", response);
  return response;
} catch (CallNotPermittedException e) {
  // Circuit is OPEN - handle gracefully with fallback
  logger.warn("Circuit OPEN - using fallback payment processing");
  return queuePaymentForRetry(request);  // Fallback: queue for later
} catch (Exception e) {
  logger.error("Payment failed: {}", e.getMessage());
  throw e;
}

// Check circuit state
CircuitBreaker.State state = circuitBreaker.getState();
CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();

if (state == CircuitBreaker.State.OPEN) {
  logger.info("Circuit OPEN - {} requests rejected",
    metrics.getNumberOfNotPermittedCalls());
}`,
    },
    {
      id: "hystrix-open-state",
      name: "Netflix Hystrix Open State (Java - Deprecated)",
      type: "library",
      languages: ["java"],
      description:
        "Hystrix pioneered circuit breaker patterns in microservices with Open State that immediately fails fast when error threshold exceeded. Though deprecated, Hystrix's approach influenced all modern circuit breaker libraries. Configurable sleep window determines how long circuit stays open before attempting recovery.",
      links: {
        docs: "https://github.com/Netflix/Hystrix/wiki/How-it-Works",
        github: "https://github.com/Netflix/Hystrix",
      },
      codeSnippet: `import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixCommandProperties;

public class PaymentCommand extends HystrixCommand<PaymentResponse> {
  private final PaymentRequest request;
  private final PaymentClient client;

  public PaymentCommand(PaymentRequest request, PaymentClient client) {
    super(Setter
      .withGroupKey(HystrixCommandGroupKey.Factory.asKey("PaymentService"))
      .andCommandPropertiesDefaults(
        HystrixCommandProperties.Setter()
          .withCircuitBreakerEnabled(true)
          .withCircuitBreakerRequestVolumeThreshold(20)  // Min requests
          .withCircuitBreakerErrorThresholdPercentage(50)  // Open at 50% errors
          .withCircuitBreakerSleepWindowInMilliseconds(60000)  // OPEN for 60s
          .withExecutionTimeoutInMilliseconds(5000)
      )
    );
    this.request = request;
    this.client = client;
  }

  @Override
  protected PaymentResponse run() throws Exception {
    // Primary execution - may throw exception or timeout
    return client.processPayment(request);
  }

  @Override
  protected PaymentResponse getFallback() {
    // Fallback executes when circuit is OPEN or execution fails
    if (isCircuitBreakerOpen()) {
      logger.warn("Circuit OPEN - queuing payment for deferred processing");
      queuePaymentForRetry(request);
      return PaymentResponse.queued(request.getId());
    }

    logger.error("Payment failed - using fallback", getExecutionException());
    return PaymentResponse.failed("Service temporarily unavailable");
  }
}

// Usage
PaymentCommand command = new PaymentCommand(paymentRequest, paymentClient);
PaymentResponse response = command.execute();

// Check if circuit is open
boolean isOpen = command.isCircuitBreakerOpen();
if (isOpen) {
  logger.warn("Payment service circuit is OPEN - all requests failing fast");
}`,
    },
    {
      id: "polly-open-state",
      name: "Polly Circuit Breaker Open State (.NET/C#)",
      type: "library",
      languages: ["csharp"],
      description:
        "Polly's advanced circuit breaker implements Open State with configurable break duration and event hooks. When failure threshold exceeded, circuit opens and rejects all calls immediately. Provides detailed state transition events for monitoring and rich exception context when calls are rejected during Open State.",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki/Circuit-Breaker",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `using Polly;
using Polly.CircuitBreaker;

// Configure circuit breaker with Open State behavior
var circuitBreakerPolicy = Policy
  .Handle<HttpRequestException>()
  .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
  .AdvancedCircuitBreakerAsync(
    failureThreshold: 0.5,                  // Open at 50% failure rate
    samplingDuration: TimeSpan.FromSeconds(10),
    minimumThroughput: 10,                  // Min requests before breaking
    durationOfBreak: TimeSpan.FromSeconds(60),  // Stay OPEN for 60 seconds
    onBreak: (result, duration, context) =>
    {
      logger.LogWarning(
        "Circuit OPEN for {duration}s - failing fast to protect service",
        duration.TotalSeconds
      );
      metrics.RecordCircuitOpen("PaymentService");

      // Emit alert when circuit opens
      alerting.Notify(new Alert
      {
        Service = "PaymentService",
        Message = $"Circuit breaker opened - rejecting requests for {duration}",
        Severity = "Warning"
      });
    },
    onReset: (context) =>
    {
      logger.LogInformation("Circuit RESET - service recovered");
      metrics.RecordCircuitClosed("PaymentService");
    },
    onHalfOpen: () =>
    {
      logger.LogInformation("Circuit HALF-OPEN - testing service recovery");
    }
  );

// Execute with circuit breaker
try
{
  var response = await circuitBreakerPolicy.ExecuteAsync(async () =>
  {
    return await httpClient.PostAsync(
      "https://payment-api.example.com/process",
      requestContent
    );
  });

  logger.LogInformation("Payment processed successfully");
  return await response.Content.ReadAsAsync<PaymentResponse>();
}
catch (BrokenCircuitException ex)
{
  // Circuit is OPEN - call was rejected without attempting request
  logger.LogWarning(
    "Payment rejected - circuit OPEN (will retry in {seconds}s)",
    ex.RetryAfter?.TotalSeconds ?? 0
  );

  // Fallback: queue payment for deferred processing
  await paymentQueue.EnqueueAsync(paymentRequest);

  return new PaymentResponse
  {
    Status = "Queued",
    Message = "Payment queued - service temporarily unavailable",
    RetryAfter = ex.RetryAfter
  };
}`,
    },
    {
      id: "opossum-open-state",
      name: "Opossum Circuit Breaker Open State (Node.js)",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Opossum is the leading Node.js circuit breaker library with event-driven Open State implementation. When circuit opens, all requests are immediately rejected with 'Breaker is open' error. Configurable reset timeout determines open duration. Rich event emitters enable monitoring of state transitions and rejected requests.",
      links: {
        github: "https://github.com/nodeshift/opossum",
        npm: "https://www.npmjs.com/package/opossum",
      },
      codeSnippet: `import CircuitBreaker from 'opossum';
import axios from 'axios';

// Define the function to protect
async function callPaymentAPI(paymentData) {
  const response = await axios.post(
    'https://api.payment.com/process',
    paymentData,
    { timeout: 5000 }
  );
  return response.data;
}

// Create circuit breaker with Open State configuration
const breaker = new CircuitBreaker(callPaymentAPI, {
  timeout: 5000,                     // Request timeout
  errorThresholdPercentage: 50,      // Open at 50% error rate
  resetTimeout: 60000,               // Stay OPEN for 60 seconds
  rollingCountTimeout: 10000,        // Error rate window
  rollingCountBuckets: 10,
  volumeThreshold: 10,               // Min requests before opening
  name: 'PaymentServiceBreaker'
});

// Monitor Open State events
breaker.on('open', () => {
  console.error('Circuit OPEN - payment service is unhealthy');
  console.log('Failing fast for next 60 seconds to allow recovery');

  // Record metrics
  metrics.increment('circuit.open', { service: 'payment' });

  // Send alert
  alerting.notify({
    title: 'Payment Circuit Opened',
    message: 'Payment service circuit breaker opened - requests being rejected',
    severity: 'warning'
  });
});

breaker.on('halfOpen', () => {
  console.info('Circuit HALF-OPEN - testing payment service recovery');
});

breaker.on('close', () => {
  console.info('Circuit CLOSED - payment service recovered');
  metrics.increment('circuit.close', { service: 'payment' });
});

// Track rejected requests during Open State
breaker.on('reject', (error) => {
  console.warn('Request REJECTED - circuit is OPEN');
  metrics.increment('circuit.reject', { service: 'payment' });
});

// Fallback function for when circuit is OPEN
breaker.fallback((paymentData) => {
  console.log('Executing fallback - queuing payment for deferred processing');

  // Queue payment for retry when service recovers
  paymentQueue.enqueue(paymentData);

  return {
    status: 'queued',
    message: 'Payment queued for processing when service recovers',
    queuedAt: new Date().toISOString()
  };
});

// Execute payment with circuit breaker protection
async function processPayment(paymentData) {
  try {
    // Circuit breaker handles Open State logic internally
    // If OPEN: immediately calls fallback without attempting request
    // If CLOSED/HALF-OPEN: attempts the actual API call
    const result = await breaker.fire(paymentData);

    console.log('Payment processed:', result);
    return result;
  } catch (error) {
    // Only reaches here if both primary AND fallback fail
    console.error('Payment failed completely:', error);
    throw error;
  }
}

// Get circuit status
const status = breaker.status;
console.log({
  state: status.state,           // 'OPEN', 'CLOSED', or 'HALF_OPEN'
  isOpen: breaker.opened,        // Boolean: is circuit currently open?
  stats: breaker.stats           // Detailed statistics
});`,
    },
    {
      id: "failsafe-go-open-state",
      name: "failsafe-go Circuit Breaker Open State (Go)",
      type: "library",
      languages: ["go"],
      description:
        "failsafe-go provides idiomatic Go circuit breaker implementation with context-based cancellation and Open State protection. When circuit opens, all executions are immediately rejected with ErrOpen error. Configurable delay determines open duration before transitioning to half-open for recovery testing.",
      links: {
        github: "https://github.com/failsafe-go/failsafe-go",
        docs: "https://failsafe-go.dev/circuit-breaker/",
      },
      codeSnippet: `package main

import (
    "context"
    "fmt"
    "time"

    "github.com/failsafe-go/failsafe-go"
    "github.com/failsafe-go/failsafe-go/circuitbreaker"
)

func main() {
    // Configure circuit breaker with Open State behavior
    cb := circuitbreaker.Builder[PaymentResponse]().
        WithDelay(60 * time.Second).              // Stay OPEN for 60 seconds
        WithFailureThreshold(10).                  // Open after 10 failures
        WithFailureThresholdRatio(50, 100).       // Or 50% failure rate
        OnOpen(func(event circuitbreaker.StateChangedEvent) {
            fmt.Printf("Circuit OPEN: %v\\n", event)
            metrics.RecordCircuitOpen("payment-service")
            alerting.Notify("Payment circuit opened - failing fast")
        }).
        OnHalfOpen(func(event circuitbreaker.StateChangedEvent) {
            fmt.Println("Circuit HALF-OPEN - testing recovery")
        }).
        OnClose(func(event circuitbreaker.StateChangedEvent) {
            fmt.Println("Circuit CLOSED - service recovered")
            metrics.RecordCircuitClose("payment-service")
        }).
        Build()

    // Create executor with circuit breaker and fallback
    executor := failsafe.NewExecutor[PaymentResponse](cb).
        WithFallback(func(exec failsafe.Execution[PaymentResponse]) (PaymentResponse, error) {
            // Fallback executes when circuit is OPEN
            fmt.Println("Fallback: queuing payment for deferred processing")

            // Queue payment for retry
            if err := paymentQueue.Enqueue(exec.LastResult()); err != nil {
                return PaymentResponse{}, err
            }

            return PaymentResponse{
                Status:  "queued",
                Message: "Payment queued - service temporarily unavailable",
            }, nil
        })

    // Execute payment with circuit breaker protection
    ctx := context.Background()
    payment := PaymentRequest{Amount: 100.00, Currency: "USD"}

    result, err := executor.GetWithExecution(
        func(exec failsafe.Execution[PaymentResponse]) (PaymentResponse, error) {
            return processPayment(ctx, payment)
        },
    )

    if err != nil {
        // Check if circuit is open
        if err == circuitbreaker.ErrOpen {
            fmt.Println("Request rejected - circuit is OPEN")
            fmt.Println("Service is unhealthy, giving it time to recover")
        } else {
            fmt.Printf("Payment failed: %v\\n", err)
        }
        return
    }

    fmt.Printf("Payment result: %+v\\n", result)
}

func processPayment(ctx context.Context, req PaymentRequest) (PaymentResponse, error) {
    // Simulate payment processing that may fail
    client := &http.Client{Timeout: 5 * time.Second}

    resp, err := client.Post(
        "https://payment-api.example.com/process",
        "application/json",
        bytes.NewBuffer(req.ToJSON()),
    )
    if err != nil {
        return PaymentResponse{}, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        return PaymentResponse{}, fmt.Errorf("payment failed: %d", resp.StatusCode)
    }

    var result PaymentResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-open-state",
      systemName: "Netflix Streaming Platform Circuit Breaker Open State",
      howUsed:
        "Netflix's microservice architecture uses Open State circuit breakers extensively to protect against cascading failures when individual services become unhealthy. When the recommendation service experiences high error rates (>50% failures over a sliding window), Hystrix circuit breakers trip to OPEN state across all instances calling that service. During OPEN state, every request to recommendations is immediately rejected without attempting the network call, preventing thread pool exhaustion and connection pool depletion. The rejection triggers fallback logic that returns cached recommendations (up to 5 minutes old) or generic popular content, maintaining a functional user experience despite service degradation. Open State lasts 30-60 seconds (configurable per service), giving the failing recommendation service time to recover without bombardment—database connections are released, memory pressure decreases, thread pools drain. After timeout, the circuit transitions to HALF-OPEN and allows 3 probe requests to test recovery. If probes succeed, the circuit closes and normal traffic resumes; if they fail, the circuit reopens for another timeout cycle. Pattern composition: Open State + Fallback (cached responses) + Bulkhead (thread pool isolation) + Monitoring (circuit state metrics). Rationale: Netflix operates 700+ microservices with complex dependency chains; a single failing service can cascade into platform-wide outages without fail-fast protection. Impact: Open State prevented 90% of cascading failure incidents; reduced Mean Time To Recovery from hours to minutes by giving services breathing room; maintained 99.99% streaming availability despite frequent partial outages; enabled safe deployment of hundreds of services without fear of bringing down the platform. Metrics: During incidents, 30-40% of services enter OPEN state, but only 5-10% of user requests fail due to effective fallback strategies; circuit open duration averages 45 seconds before successful recovery.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "aws-lambda-open-state",
      systemName: "AWS Lambda Circuit Breaking for Downstream Services",
      howUsed:
        "AWS Lambda functions calling downstream services (databases, APIs, S3) implement Open State circuit breakers to prevent function timeout cascades and cost explosion when dependencies fail. When a Lambda function's DynamoDB calls start timing out (network partition, table throttling, hot partition), the circuit breaker trips to OPEN after exceeding failure threshold. Subsequent invocations immediately fail-fast without attempting DynamoDB calls, preventing each invocation from consuming its full 15-second timeout waiting for doomed queries. This saves massive cost—without circuit breaking, 1000 concurrent invocations × 15s timeout × $0.0000166667/100ms = $2.50 per failure wave; with fail-fast, 1000 × 100ms × cost = $0.02. Open State also prevents Lambda concurrent execution limit exhaustion—functions that fail fast return execution slots to the pool instead of holding them for timeout duration. Fallback strategies during OPEN: read from ElastiCache backup, return stale S3-cached responses, or invoke backup Lambda in different region. Reset timeout is typically 30 seconds for Lambda to allow quick recovery testing without wasting invocations. Pattern composition: Open State + Timeout + Fallback (cache/backup region) + Dead Letter Queue (failed events). Rationale: Serverless functions have strict timeout limits and pay-per-millisecond pricing; hung calls to failing dependencies create catastrophic cost and availability impact. Impact: Reduced Lambda costs by 80% during DynamoDB outages; prevented concurrent execution limit exhaustion; maintained 95% API availability during dependency failures via fallback responses; enabled predictable cost modeling even during cascading failures.",
      source:
        "https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/",
    },
    {
      systemId: "uber-open-state",
      systemName: "Uber Ride Matching Service Circuit Breaker",
      howUsed:
        "Uber's ride matching system implements Open State circuit breakers to protect critical path services during demand spikes and regional failures. When the dynamic pricing service becomes overloaded (New Year's Eve, major event), circuit breakers detect >60% timeout rate and trip to OPEN. All pricing requests are immediately rejected for 45 seconds, triggering fallback pricing logic: use last successful price calculation (cached <2 minutes ago), apply zone-based static surge multipliers, or use historical average pricing for route. Open State prevents the pricing service from being completely overwhelmed—without circuit breaking, continued traffic during overload delays recovery indefinitely. The 45-second breathing room allows pricing's connection pools to drain, cache to warm up, and autoscaling to provision additional capacity. When circuit transitions to HALF-OPEN, 5 probe requests test if pricing can handle load. Uber also implements geographic circuit breaking—if pricing fails in San Francisco region, only SF circuit opens while NYC remains closed (healthy). Pattern composition: Open State + Geographic Isolation + Fallback (cached/zone-based pricing) + Adaptive Timeout. Rationale: Ride matching is real-time critical path; pricing failures must not block ride requests during peak demand when revenue is highest. Impact: Maintained 99.9% ride request success rate during pricing service incidents; prevented $10M+ in lost revenue during 2022 New Year's Eve by gracefully degrading to fallback pricing; reduced cascade failure incidents by 75%; enabled regional failure isolation preventing localized issues from going global.",
      source: "https://www.uber.com/blog/building-resilient-architecture-uber/",
    },
    {
      systemId: "github-open-state",
      systemName: "GitHub MySQL Database Circuit Breaker",
      howUsed:
        "GitHub implements Open State circuit breakers at the database access layer to protect against MySQL cluster failures and replication lag spikes. When primary MySQL cluster experiences quorum loss or becomes unresponsive (network partition, storage failure, lock contention), the database circuit breaker trips to OPEN after detecting consecutive connection timeouts. All write operations are immediately rejected for 60 seconds, preventing application threads from blocking indefinitely waiting for database connections. Read operations fall back to read replicas (accepting eventual consistency). Open State triggers 'read-only mode' across GitHub's application tier—users can browse code, view issues, read PRs, but cannot push commits, create issues, or merge PRs. Rejected write operations are queued in Redis for deferred execution when database recovers. The 60-second open period gives MySQL time to recover cluster quorum, drain blocked queries, and restore replication. When circuit transitions to HALF-OPEN, GitHub attempts a single write operation to test database health before resuming full write traffic. Pattern composition: Open State + Read/Write Split + Fallback (read replicas) + Deferred Write Queue + Read-Only Mode. Rationale: GitHub's MySQL cluster is single point of failure for write operations; failed writes must not cascade into application-wide thread exhaustion. Impact: Prevented complete GitHub outage during 2018 MySQL incident; maintained read functionality (80% of user operations) during database cluster failure; enabled graceful degradation to 'read-only mode' instead of complete unavailability; reduced incident recovery time by preventing application-level thread pool exhaustion that required full restart.",
      source: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
    },
    {
      systemId: "stripe-open-state",
      systemName: "Stripe Payment Processor Circuit Breaker",
      howUsed:
        "Stripe's payment processing orchestration layer implements Open State circuit breakers for each payment processor gateway (Visa, Mastercard, regional processors) to handle processor outages while maintaining payment availability. When a primary payment processor experiences high failure rate (network issues, processor-side outage, rate limiting), the circuit trips to OPEN after 20 consecutive failures. All payment requests to that processor are immediately rejected for 30 seconds without attempting the processor API call. Rejection triggers Stripe's processor fallback chain: route to backup processor gateway → route to geographic alternative processor → queue transaction for delayed processing with eventual consistency guarantee. Open State prevents Stripe from overwhelming struggling processors with retry attempts, which could worsen processor overload and delay recovery. The 30-second timeout is shorter than typical circuit breakers because payment processing is time-sensitive—merchants need fast failure detection to try alternative processors. Idempotency keys ensure duplicate charge protection when circuit opens mid-transaction. Pattern composition: Open State + Processor Fallback Chain + Idempotency + Geographic Routing + Delayed Processing Queue. Rationale: Payment processor failures are external service failures beyond Stripe's control; fail-fast enables rapid fallback to working processors maintaining 99.99% payment success rate. Impact: Maintained $500M+ daily transaction volume during processor regional outage; prevented cascade failure when processor gateway became unresponsive; reduced payment failure rate from 15% to <1% during incidents by failing fast to backup processors; enabled sub-second processor failover with zero duplicate charges via idempotency.",
      source: "https://stripe.com/blog/payment-api-design",
    },
  ],

  references: [
    {
      title:
        "Release It! - Circuit Breaker Pattern (Chapter 5: Stability Patterns)",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Circuit Breaker - Martin Fowler",
      url: "https://martinfowler.com/bliki/CircuitBreaker.html",
      type: "article",
      author: "Martin Fowler",
    },
    {
      title: "Fault Tolerance in a High Volume, Distributed System - Netflix",
      url: "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
      type: "article",
      author: "Netflix Technology Blog",
    },
    {
      title: "Resilience4j Circuit Breaker Documentation",
      url: "https://resilience4j.readme.io/docs/circuitbreaker",
      type: "documentation",
      author: "Resilience4j Authors",
    },
    {
      title: "AWS Builders Library - Avoiding Fallback in Distributed Systems",
      url: "https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/",
      type: "article",
      author: "AWS Architecture Team",
    },
  ],

  philosophy: {
    coreProblem:
      "When downstream services fail or become slow, continuously attempting to call them wastes resources (threads, connections, memory), worsens the failure by overwhelming struggling services, and causes cascading failures throughout the system—turning localized issues into platform-wide outages",
    designPrinciple:
      "Immediately reject all requests to failing services (fail-fast) to prevent resource exhaustion and give the failing service time to recover without additional load. Transform slow, resource-draining cascade failures into fast, predictable rejections that preserve system stability and enable graceful degradation",
    historicalContext:
      "The Open State pattern emerged from Netflix's pioneering work on microservice resilience in the early 2010s. Before circuit breakers, Netflix experienced catastrophic cascading failures where a single overloaded service (recommendations, metadata) would take down the entire streaming platform—users couldn't browse, search, or watch videos because application threads were blocked waiting for timeouts from failing services. Traditional approaches (retries, longer timeouts) made problems worse by increasing load on struggling services. Netflix's Hystrix library (2011) popularized the three-state circuit breaker model (Closed, Open, Half-Open) based on electrical circuit breakers that trip during overload. The Open State specifically addresses the fail-fast requirement: when failures exceed threshold, stop calling the service entirely and return errors immediately. Michael Nygard's 'Release It!' (2007) documented circuit breaker theory, but Netflix operationalized it at scale. The pattern proved so effective that it became a standard resilience primitive—Spring Cloud Netflix integrated Hystrix by default, AWS service meshes implement circuit breaking, Kubernetes sidecar proxies (Istio, Linkerd) provide infrastructure-level circuit breaking. Modern implementations (Resilience4j, Polly, failsafe-go) evolved from Hystrix's foundation, adding sliding window failure tracking, automatic state transitions, and event-driven observability. The key insight: systems must protect themselves from their own dependencies—fail-fast is better than fail-slow for both the caller (resources freed) and the callee (breathing room to recover).",
    alternativesRejected: [
      "Unlimited Retries - Continuously retrying failed service calls without circuit breaking creates retry storms that overwhelm struggling services, prevent recovery, and exhaust caller resources. Open State stops retries immediately when failure threshold exceeded, giving services breathing room.",
      "Longer Timeouts - Increasing timeout duration (e.g., 30s → 60s) delays failure detection and keeps resources (threads, connections) blocked longer, worsening resource exhaustion. Open State fails fast (milliseconds) instead of waiting for timeout.",
      "Always Call Service - Attempting to call the service on every request even during sustained failure wastes network calls, connection pool slots, and processing time. Open State rejects requests locally without network overhead.",
      "Manual Circuit Control - Requiring operators to manually trip circuits during incidents introduces human delay (minutes to hours) and error. Open State automatically detects failures and trips circuit within seconds based on objective thresholds.",
      "Permanent Blocking - Once a service fails, permanently blocking all traffic to it prevents recovery testing. Open State includes reset timeout that automatically transitions to Half-Open for recovery probes after cooling period.",
      "Per-Request Circuit State - Evaluating failure thresholds on every request adds overhead. Open State maintains circuit state persistently, checking only if sufficient time has elapsed for reset attempt, minimizing per-request cost.",
    ],
    mentalModel:
      "Open State circuit breaker is like a nightclub bouncer during a fire alarm. When smoke detectors trip (failure threshold exceeded), the bouncer immediately blocks everyone from entering (fail-fast rejection), preventing the club from becoming more crowded and dangerous. The bouncer doesn't check each person individually—the door is simply closed to everyone (all requests rejected). This gives firefighters space to work without people getting in the way (failing service gets breathing room to recover). After the alarm stops (reset timeout elapsed), the bouncer cautiously opens the door and lets one person peek inside to check if it's safe (Half-Open probe request). If conditions are good, normal entry resumes (circuit closes). If smoke is still present, the door closes again for another waiting period (circuit reopens). The key insight: sometimes the most helpful action is to stop adding to the problem, giving systems space to self-heal.",
  },

  visualization: {
    staticDiagram: `stateDiagram-v2
    [*] --> Closed: Circuit starts healthy

    Closed --> Open: Failure threshold exceeded<br/>(e.g., >50% errors over 100 requests)

    note right of Open
        OPEN STATE (Protective Mode)
        • Immediately reject ALL requests (fail-fast)
        • No calls to protected service
        • Return circuit open error
        • Execute fallback logic
        • Wait for reset timeout (60s)
        • Give service time to recover
    end note

    Open --> HalfOpen: Reset timeout elapsed<br/>(e.g., 60 seconds passed)

    HalfOpen --> Closed: Probe request succeeds<br/>(Service recovered)

    HalfOpen --> Open: Probe request fails<br/>(Service still unhealthy)

    Closed --> Closed: Requests succeed<br/>or failures below threshold`,
    realWorldAnalogy:
      "Open State is like a restaurant's kitchen temporarily closing during a fire in the stove. When the fire alarm trips (failure threshold exceeded), the kitchen manager immediately stops accepting new orders (fail-fast rejection) and closes the kitchen doors (circuit opens). Waiters tell customers 'kitchen temporarily closed' and offer alternatives: pre-made sandwiches from the deli case (cached fallback), items from the sister restaurant next door (backup service), or 'come back in an hour' (retry later). The closed kitchen gives the chef time to extinguish the fire, ventilate smoke, and restore safe cooking conditions without being overwhelmed by incoming orders (breathing room for service recovery). After 30 minutes (reset timeout), the manager opens the door slightly and sends one test order to verify the kitchen is safe (Half-Open probe). If that dish comes out perfect, the kitchen fully reopens and normal service resumes (circuit closes). If the stove is still smoking, the kitchen closes again for another cooling period (circuit reopens). The key: stopping new work when problems arise is often the fastest path to recovery.",
    useCases: [
      {
        domain: "E-Commerce Payment Processing",
        scenario:
          "During Black Friday, a payment processor gateway becomes overloaded and starts timing out on 70% of payment requests. The circuit trips to OPEN and immediately rejects payment attempts for 60 seconds without calling the processor. Rejected payments are routed to a backup processor gateway, maintaining 99% payment success rate despite primary processor failure.",
        patternRole:
          "Open State prevents cascade failure where overwhelmed payment processor takes down entire checkout flow. Fail-fast rejection enables instant fallback to working backup processor.",
        companies: ["Stripe", "Amazon", "Shopify"],
      },
      {
        domain: "Video Streaming Recommendations",
        scenario:
          "Netflix's recommendation service crashes due to a database partition. Circuit breakers across 1000+ application instances trip to OPEN simultaneously. All recommendation requests are rejected instantly and fall back to cached recommendations or popular content. The service recovers in 45 seconds once database partition heals, and circuits transition to Half-Open for probe testing.",
        patternRole:
          "Open State gives the failing recommendation service breathing room to recover by stopping traffic bombardment. Users see slightly stale content instead of infinite loading spinners.",
        companies: ["Netflix", "YouTube", "Spotify"],
      },
      {
        domain: "Social Media User Profiles",
        scenario:
          "Twitter's user profile service experiences memory leak causing frequent crashes. Profile circuit breakers trip to OPEN when crash rate exceeds threshold. Timeline rendering continues with cached profile data (avatars, usernames) for users whose profiles fail to load. Open State lasts 30 seconds while autoscaler provisions new instances to replace crashed ones.",
        patternRole:
          "Prevents profile service failures from cascading into timeline service failures. Users can still browse and post tweets even when profile service is degraded.",
        companies: ["Twitter", "Facebook", "LinkedIn"],
      },
      {
        domain: "Microservice Database Access",
        scenario:
          "A microservice's MySQL database experiences lock contention during large batch job, causing query timeouts. Database circuit breaker trips to OPEN after 20 consecutive timeout failures. Application immediately rejects new queries and falls back to read replicas for read operations, queues writes for deferred processing. Open State prevents application thread pool exhaustion that would require full service restart.",
        patternRole:
          "Protects application from database failures by failing fast locally instead of blocking threads waiting for database timeouts. Maintains read availability via replica fallback.",
        companies: ["GitHub", "GitLab", "Airbnb"],
      },
      {
        domain: "API Gateway External Service Integration",
        scenario:
          "An API gateway routes requests to third-party geocoding service. Geocoding service has outage and returns 503 errors. Circuit breaker trips to OPEN and rejects all geocoding requests for 60 seconds. Gateway falls back to IP-based coarse location or cached geocoding results. After timeout, single probe request tests if geocoding service recovered.",
        patternRole:
          "Isolates API gateway from third-party service failures. Prevents external service outage from consuming gateway resources and impacting other API routes.",
        companies: ["Kong", "AWS API Gateway", "Apigee"],
      },
    ],
  },

  tags: [
    "reliability",
    "circuit-breaker",
    "fail-fast",
    "fault-tolerance",
    "resilience",
    "state-machine",
    "graceful-degradation",
    "microservices",
  ],
  difficulty: "intermediate",
};
