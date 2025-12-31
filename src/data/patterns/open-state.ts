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
};
