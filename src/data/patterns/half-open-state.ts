import type { Pattern } from "../schema";

export const halfOpenState: Pattern = {
  id: "half-open-state",
  slug: "half-open-state",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔌 Circuit Breaker → 🔄 Half-Open State",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Circuit Breaker",
    level: 4,
  },

  concept: {
    name: "Half-Open State",
    emoji: "🔄",
    tagline: "Test recovery",
    definition:
      "The Half-Open State is a transitional circuit breaker state that cautiously tests whether a previously failed service has recovered by allowing a limited number of probe requests through. Think of it like cracking a door open slightly to peek outside before fully opening it—you test conditions before committing. After a circuit has been Open for a configured timeout period (e.g., 60 seconds), it transitions to Half-Open and permits a small number of trial requests (e.g., 3-5 requests) to check if the downstream service is healthy again. If these probes succeed, the circuit transitions back to Closed state and resumes normal operation. If any probe fails, the circuit immediately reopens, restarting the timeout period. This state prevents prematurely declaring a service healthy while enabling automatic recovery without manual intervention. The Half-Open state balances two competing goals: detecting recovery quickly to restore normal operation, and avoiding overwhelming a still-struggling service with too many test requests.",
    problemSolved:
      "When a circuit is Open, requests are blocked to give the failing service time to recover, but the system needs a mechanism to automatically detect when recovery has occurred and resume normal operation. Staying permanently Open would require manual intervention to reset the circuit. Immediately closing after timeout would risk overwhelming a service that has not fully recovered. The Half-Open State solves this by cautiously testing recovery with a limited number of probe requests. For example, if a database overload caused the circuit to Open, the Half-Open state sends 3 test queries after 60 seconds. If the database has recovered (queries succeed), the circuit closes and resumes normal traffic. If the database is still slow (queries timeout), the circuit reopens for another 60-second recovery period. This enables automatic self-healing without manual operator intervention and prevents prematurely flooding a recovering service with full production load.",
    tradeoffs: {
      pros: [
        "Enables automatic recovery from failures without manual intervention",
        "Cautiously tests service health with limited probe requests to avoid overwhelming recovering service",
        "Provides fast transition back to Closed state when service recovers (seconds, not minutes)",
        "Prevents indefinite blocking of requests if service has actually recovered",
        "Configurable probe count allows tuning aggressiveness of recovery detection",
      ],
      cons: [
        "Probe requests may fail due to transient issues, causing unnecessary re-opening",
        "Choosing probe count is tricky—too few may miss ongoing issues, too many risks overwhelming service",
        "Additional state complexity compared to simple Open/Closed model",
        "No guarantee that service can handle full load even if probes succeed",
        "Timeout duration trades off recovery speed vs. giving service adequate recovery time",
      ],
    },
    relatedPatterns: [
      "circuit-breaker",
      "closed-state",
      "open-state",
      "retry",
      "exponential-backoff",
      "health-check",
    ],
  },

  structure: {
    participants: [
      {
        name: "Circuit Breaker State Machine",
        role: "State Coordinator",
        responsibilities: [
          "Detect when OPEN state timeout expires and transition to HALF_OPEN",
          "Track number of probe requests sent and their success/failure outcomes",
          "Decide whether to close circuit (probes succeeded) or reopen (probes failed)",
          "Enforce probe request limits to prevent overwhelming recovering service",
          "Maintain probe result history for debugging and metrics",
        ],
      },
      {
        name: "Probe Request Handler",
        role: "Recovery Tester",
        responsibilities: [
          "Execute limited probe requests to test service health during HALF_OPEN state",
          "Apply timeout protection to probes to detect still-slow services",
          "Record probe success/failure with latency measurements",
          "Reject requests exceeding probe limit to control load on recovering service",
        ],
      },
      {
        name: "Recovering Service",
        role: "Health Test Subject",
        responsibilities: [
          "Process probe requests while recovering from failure condition",
          "Return successful responses when health is restored",
          "Fail probe requests if still experiencing degradation",
          "Handle limited probe traffic without being overwhelmed during recovery",
        ],
      },
      {
        name: "Client Application",
        role: "Request Initiator",
        responsibilities: [
          "Submit requests through circuit breaker during HALF_OPEN phase",
          "Handle probe-rejected responses when probe limit reached",
          "Receive successful responses when probes succeed and circuit closes",
          "Retry after circuit reopens if probes indicate service not recovered",
        ],
      },
      {
        name: "Monitoring System",
        role: "Recovery Observer",
        responsibilities: [
          "Track HALF_OPEN state duration and frequency",
          "Record probe success rates and average latencies",
          "Alert on frequent reopen events (indicating service instability)",
          "Correlate probe failures with service health metrics",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant CB as Circuit Breaker
    participant Service as Recovering Service
    participant Monitor as Monitoring

    Note over CB: Initial State: OPEN
    Note over CB: Timeout expires (e.g., 60s)

    CB->>CB: Transition to HALF_OPEN
    CB->>Monitor: Log state transition
    Note over CB: Probe limit: 3 successful requests needed

    Client->>CB: Request #1
    CB->>CB: Check probe allowance
    Note over CB: Allow probe (0/3 successful)

    CB->>Service: Probe Request #1
    activate Service
    Service-->>CB: Success (150ms)
    deactivate Service

    CB->>CB: Record success (1/3)
    CB-->>Client: Return response
    CB->>Monitor: Log probe success

    Client->>CB: Request #2
    CB->>Service: Probe Request #2
    activate Service
    Service-->>CB: Success (120ms)
    deactivate Service

    CB->>CB: Record success (2/3)
    CB-->>Client: Return response

    Client->>CB: Request #3
    CB->>Service: Probe Request #3
    activate Service
    Service-->>CB: Success (110ms)
    deactivate Service

    CB->>CB: Record success (3/3)
    Note over CB: Threshold met!

    CB->>CB: Transition to CLOSED
    CB->>Monitor: Log circuit closed
    CB-->>Client: Return response

    Note over CB,Service: Alternative: Probe Failure Path

    rect rgb(255, 230, 230)
    Note over CB: HALF_OPEN state
    Client->>CB: Probe Request
    CB->>Service: Forward probe
    activate Service
    Service--xCB: Timeout (5s)
    deactivate Service

    CB->>CB: Record failure
    Note over CB: Service not recovered!

    CB->>CB: Transition to OPEN
    CB->>Monitor: Log circuit reopened
    CB-->>Client: Circuit reopened error

    Note over CB: Wait another timeout period...
    end`,
    flow: [
      {
        step: 1,
        actor: "Circuit Breaker State Machine",
        action: "Detect Timeout Expiration",
        description:
          "After circuit has been OPEN for configured timeout period (e.g., 60 seconds), detect that recovery window has elapsed and service should be tested for health restoration",
      },
      {
        step: 2,
        actor: "Circuit Breaker State Machine",
        action: "Transition to HALF_OPEN",
        description:
          "Change state from OPEN to HALF_OPEN, reset probe counters (successful=0, failed=0), and begin accepting limited probe requests to test service recovery",
      },
      {
        step: 3,
        actor: "Client Application",
        action: "Submit Request During HALF_OPEN",
        description:
          "Client makes request to service, unaware of circuit state; request enters circuit breaker which must decide whether to allow as probe or reject",
      },
      {
        step: 4,
        actor: "Probe Request Handler",
        action: "Check Probe Allowance",
        description:
          "Verify that probe request limit has not been reached; if already testing with maximum concurrent probes or threshold met, reject request with 'circuit testing' error",
      },
      {
        step: 5,
        actor: "Probe Request Handler",
        action: "Execute Probe Request",
        description:
          "Forward request to recovering service as probe with timeout protection; measure response time and capture success/failure outcome for state transition decision",
      },
      {
        step: 6,
        actor: "Recovering Service",
        action: "Process Probe Request",
        description:
          "Handle probe request and return response; if service has recovered, respond successfully with normal latency; if still degraded, timeout or return error",
      },
      {
        step: 7,
        actor: "Probe Request Handler",
        action: "Record Probe Result",
        description:
          "Increment successful or failed probe counter based on response; track latency and timestamp for observability and state transition evaluation",
      },
      {
        step: 8,
        actor: "Circuit Breaker State Machine",
        action: "Evaluate State Transition",
        description:
          "After each probe result, check if conditions met to close circuit (N successful probes) or reopen circuit (probe failed with fail-fast policy); remain in HALF_OPEN if more probes needed",
      },
      {
        step: 9,
        actor: "Circuit Breaker State Machine",
        action: "Close Circuit or Reopen",
        description:
          "If probe threshold met (e.g., 3 consecutive successes), transition to CLOSED and resume normal operation; if probe failed, transition back to OPEN and start new timeout period",
      },
      {
        step: 10,
        actor: "Monitoring System",
        action: "Record Metrics",
        description:
          "Log state transitions, probe success rates, recovery duration, and reopen frequency for alerting on problematic recovery patterns and service instability",
      },
    ],
    invariants: [
      "Circuit can only enter HALF_OPEN from OPEN state after timeout expires",
      "Probe request limit must be enforced to prevent overwhelming recovering service",
      "Successful probe count must reach configured threshold before closing circuit",
      "Probe failures must cause immediate reopen if fail-fast policy enabled",
      "HALF_OPEN state must eventually transition to either CLOSED or OPEN (never hang)",
      "Probe results must be reset when transitioning out of HALF_OPEN state",
      "Only one probe request should be in-flight at a time (serial execution)",
    ],
  },

  codeExamples: [
    {
      id: "half-open-state-ts-basic",
      language: "typescript",
      title: "Half-Open State Recovery Testing Implementation",
      description:
        "Implementation demonstrating the Half-Open transitional state that cautiously tests service recovery by allowing limited probe requests, automatically closing circuit on success or reopening on failure.",
      code: `type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface HalfOpenConfig {
  probeRequestLimit: number;      // Number of successful probes needed to close circuit
  probeTimeout: number;            // Timeout for probe requests (ms)
  failFastOnProbeFailure: boolean; // Reopen circuit immediately on first probe failure
}

interface ProbeResult {
  success: boolean;
  duration: number;
  error?: Error;
  timestamp: number;
}

class HalfOpenCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private probeResults: ProbeResult[] = [];
  private probesInFlight = 0;
  private successfulProbes = 0;
  private failedProbes = 0;

  constructor(private config: HalfOpenConfig) {}

  // Execute request with Half-Open state probe logic
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (this.state !== 'HALF_OPEN') {
      // For demo, allow execution in other states too
      console.log(\`[\${this.state}] Executing: \${operationName}\`);
      return await operation();
    }

    return await this.executeProbeRequest(operation, operationName);
  }

  // Execute probe request in HALF_OPEN state
  private async executeProbeRequest<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Check if we should allow this probe request
    if (!this.shouldAllowProbe()) {
      const error = new Error(
        \`Circuit is HALF_OPEN - probe limit reached (\${this.config.probeRequestLimit} successful probes needed)\`
      );
      console.log(\`[HALF_OPEN] ⏸️  Request queued: \${operationName}\`);
      console.log(\`            Waiting for probe results (\${this.successfulProbes}/\${this.config.probeRequestLimit} successful)\`);
      throw error;
    }

    this.probesInFlight++;
    const probeNumber = this.probeResults.length + 1;

    console.log(\`\\n[HALF_OPEN] 🔍 PROBE REQUEST #\${probeNumber}: \${operationName}\`);
    console.log(\`            Probes in flight: \${this.probesInFlight}\`);

    const startTime = Date.now();

    try {
      // Execute probe with timeout protection
      const result = await this.executeWithTimeout(operation, this.config.probeTimeout);
      const duration = Date.now() - startTime;

      // Record successful probe
      this.recordProbeSuccess(duration);

      console.log(\`            ✅ Probe succeeded in \${duration}ms\`);
      console.log(\`            Successful probes: \${this.successfulProbes}/\${this.config.probeRequestLimit}\`);

      // Check if we have enough successful probes to close circuit
      if (this.shouldCloseCircuit()) {
        this.closeCircuit();
      }

      this.probesInFlight--;
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed probe
      this.recordProbeFailure(duration, error as Error);

      console.log(\`            ❌ Probe failed after \${duration}ms\`);
      console.log(\`            Error: \${(error as Error).message}\`);

      // Decide whether to reopen circuit
      if (this.shouldReopenCircuit()) {
        this.reopenCircuit();
      }

      this.probesInFlight--;
      throw error;
    }
  }

  // Execute operation with timeout
  private executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(\`Probe timeout after \${timeoutMs}ms\`)), timeoutMs)
      ),
    ]);
  }

  // Determine if probe request should be allowed
  private shouldAllowProbe(): boolean {
    // In simple implementation, allow probes until we reach the limit or circuit closes
    // More sophisticated implementations might use concurrent probe limits, rate limiting, etc.
    return this.successfulProbes < this.config.probeRequestLimit && this.probesInFlight === 0;
  }

  // Record successful probe result
  private recordProbeSuccess(duration: number): void {
    this.probeResults.push({
      success: true,
      duration,
      timestamp: Date.now(),
    });

    this.successfulProbes++;
  }

  // Record failed probe result
  private recordProbeFailure(duration: number, error: Error): void {
    this.probeResults.push({
      success: false,
      duration,
      error,
      timestamp: Date.now(),
    });

    this.failedProbes++;
  }

  // Determine if circuit should close based on successful probes
  private shouldCloseCircuit(): boolean {
    // Close if we've achieved the required number of successful probes
    return this.successfulProbes >= this.config.probeRequestLimit;
  }

  // Determine if circuit should reopen based on probe failures
  private shouldReopenCircuit(): boolean {
    // If configured for fail-fast, reopen on first failure
    if (this.config.failFastOnProbeFailure) {
      return true;
    }

    // Otherwise, could use failure threshold (e.g., 2 out of 3 probes failed)
    // For this demo, we'll reopen on any failure
    return this.failedProbes > 0;
  }

  // Transition to HALF_OPEN state
  transitionToHalfOpen(): void {
    if (this.state === 'HALF_OPEN') {
      console.log('[HALF_OPEN] Already in half-open state');
      return;
    }

    console.log(\`\\n🔄 STATE TRANSITION: \${this.state} → HALF_OPEN\`);
    console.log(\`   Entering recovery testing mode\`);
    console.log(\`   Will send \${this.config.probeRequestLimit} probe requests\\n\`);

    this.state = 'HALF_OPEN';
    this.resetProbeTracking();
  }

  // Close circuit after successful recovery
  private closeCircuit(): void {
    console.log(\`\\n✅ CIRCUIT CLOSING: HALF_OPEN → CLOSED\`);
    console.log(\`   All \${this.config.probeRequestLimit} probe requests succeeded\`);
    console.log(\`   Service is healthy - resuming normal operation\\n\`);

    this.state = 'CLOSED';
    this.resetProbeTracking();
  }

  // Reopen circuit after probe failure
  private reopenCircuit(): void {
    console.log(\`\\n🔴 CIRCUIT REOPENING: HALF_OPEN → OPEN\`);
    console.log(\`   Probe request failed - service not yet recovered\`);
    console.log(\`   Will retry after another timeout period\\n\`);

    this.state = 'OPEN';
    this.resetProbeTracking();
  }

  // Reset probe tracking counters
  private resetProbeTracking(): void {
    this.probeResults = [];
    this.successfulProbes = 0;
    this.failedProbes = 0;
    this.probesInFlight = 0;
  }

  // Get current state and probe metrics
  getStatus() {
    const totalProbes = this.probeResults.length;
    const avgDuration = totalProbes > 0
      ? Math.round(this.probeResults.reduce((sum, p) => sum + p.duration, 0) / totalProbes)
      : 0;

    return {
      state: this.state,
      isHalfOpen: this.state === 'HALF_OPEN',
      totalProbes,
      successfulProbes: this.successfulProbes,
      failedProbes: this.failedProbes,
      probesInFlight: this.probesInFlight,
      probeLimitRequired: this.config.probeRequestLimit,
      averageProbeDuration: avgDuration + 'ms',
      probeHistory: this.probeResults.map(p => ({
        success: p.success,
        duration: p.duration + 'ms',
        error: p.error?.message,
      })),
    };
  }

  // Manual state setters for demo
  setState(state: CircuitState): void {
    this.state = state;
  }
}

// ============================================================================
// USAGE EXAMPLE: Demonstrate HALF_OPEN state recovery testing
// ============================================================================

// Simulated service that gradually recovers
class RecoveringService {
  private requestCount = 0;
  private recoveryProgress = 0; // 0 = down, 100 = fully recovered

  setRecoveryProgress(progress: number): void {
    this.recoveryProgress = Math.max(0, Math.min(100, progress));
    console.log(\`\\n🔧 Service recovery progress: \${this.recoveryProgress}%\\n\`);
  }

  async processRequest(requestId: string): Promise<string> {
    this.requestCount++;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // Probabilistic failure based on recovery progress
    // 0% recovery = always fails, 100% recovery = always succeeds
    const failureChance = 100 - this.recoveryProgress;

    if (Math.random() * 100 < failureChance) {
      throw new Error(\`Service still recovering - request \${requestId} failed\`);
    }

    return \`Successfully processed request \${requestId}\`;
  }
}

async function demonstrateHalfOpenState() {
  console.log('=== Circuit Breaker HALF-OPEN State Demo ===\\n');

  const circuitBreaker = new HalfOpenCircuitBreaker({
    probeRequestLimit: 3,           // Need 3 successful probes to close circuit
    probeTimeout: 2000,             // 2 second timeout for probes
    failFastOnProbeFailure: false,  // Don't reopen on first failure (demo purposes)
  });

  const service = new RecoveringService();

  // Scenario 1: Service not yet recovered - probes fail
  console.log('\\n=== Scenario 1: Premature Recovery Attempt ===');
  service.setRecoveryProgress(20);  // Only 20% recovered - likely to fail

  circuitBreaker.transitionToHalfOpen();

  console.log('\\nAttempting probe requests with partially recovered service...\\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const result = await circuitBreaker.execute(
        () => service.processRequest(\`probe-\${i}\`),
        \`Probe request #\${i}\`
      );
      console.log(\`   Result: \${result}\`);
    } catch (error) {
      console.log(\`   Probe rejected or failed\`);

      // Check if circuit reopened
      if (circuitBreaker.getStatus().state === 'OPEN') {
        console.log(\`\\n   Circuit has reopened - service not ready\`);
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\\n📊 Status after premature recovery:');
  console.log(JSON.stringify(circuitBreaker.getStatus(), null, 2));

  // Scenario 2: Service fully recovered - probes succeed
  console.log('\\n\\n=== Scenario 2: Successful Recovery ===');
  service.setRecoveryProgress(95);  // 95% recovered - high success rate

  circuitBreaker.transitionToHalfOpen();

  console.log('\\nAttempting probe requests with recovered service...\\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const result = await circuitBreaker.execute(
        () => service.processRequest(\`recovery-probe-\${i}\`),
        \`Recovery probe #\${i}\`
      );
      console.log(\`   Result: \${result}\`);

      // Check if circuit closed
      if (circuitBreaker.getStatus().state === 'CLOSED') {
        console.log(\`\\n   Circuit has closed - service fully recovered!\`);
        break;
      }
    } catch (error) {
      console.log(\`   Probe failed: \${(error as Error).message}\`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\\n📊 Status after successful recovery:');
  console.log(JSON.stringify(circuitBreaker.getStatus(), null, 2));

  // Scenario 3: Intermittent failures during recovery
  console.log('\\n\\n=== Scenario 3: Intermittent Failures ===');
  service.setRecoveryProgress(70);  // 70% recovered - some failures expected

  const circuitBreaker2 = new HalfOpenCircuitBreaker({
    probeRequestLimit: 3,
    probeTimeout: 2000,
    failFastOnProbeFailure: true,   // Reopen immediately on failure
  });

  circuitBreaker2.transitionToHalfOpen();

  console.log('\\nAttempting probes with fail-fast enabled...\\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const result = await circuitBreaker2.execute(
        () => service.processRequest(\`failfast-probe-\${i}\`),
        \`Fail-fast probe #\${i}\`
      );
      console.log(\`   Result: \${result}\`);
    } catch (error) {
      console.log(\`   Failed or rejected\`);

      if (circuitBreaker2.getStatus().state === 'OPEN') {
        console.log(\`   Circuit reopened due to fail-fast policy\`);
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\\n📊 Final status:');
  console.log(JSON.stringify(circuitBreaker2.getStatus(), null, 2));

  console.log('\\n✅ Demo complete - HALF_OPEN state tested service recovery');
}

// Run the demonstration
demonstrateHalfOpenState();`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete HALF_OPEN state implementation demonstrating cautious service recovery testing with limited probe requests that either close circuit on success or reopen on failure to prevent overwhelming recovering services",
        prerequisites: [
          "Circuit breaker state machine",
          "Probe request pattern",
          "Service health monitoring",
          "Graceful recovery strategies",
          "Promise-based async patterns",
        ],
        systemPosition:
          "Transitional state in circuit breaker middleware positioned between Open state (full protection) and Closed state (normal operation), managing the critical recovery phase where service health is being re-validated",
      },
      annotations: [
        {
          id: "ho-probe-limit",
          lines: [4, 7],
          action:
            "Configure number of successful probes required before closing circuit",
          reason:
            "Multiple probe successes provide statistical confidence that service has truly recovered rather than single lucky request; configurable limit allows tuning based on service criticality and recovery patterns",
          contextLevel: "module",
        },
        {
          id: "ho-probe-check",
          lines: [43, 52],
          action:
            "Check if probe request should be allowed based on current probe state",
          reason:
            "HALF_OPEN state must limit concurrent probes to avoid overwhelming recovering service with full production load; controlled probe admission prevents circuit from defeating its own recovery-protection purpose",
          contextLevel: "module",
        },
        {
          id: "ho-probe-execution",
          lines: [57, 60],
          action: "Execute probe request with logging and flight tracking",
          reason:
            "Probes are special diagnostic requests that test service health; logging provides observability into recovery process; flight tracking prevents concurrent probes from overwhelming service",
          contextLevel: "local",
        },
        {
          id: "ho-success-path",
          lines: [63, 77],
          action: "Record successful probe and check if circuit should close",
          reason:
            "Each successful probe increases confidence in service recovery; after configured number of successes (e.g., 3), service is deemed healthy and circuit closes to resume normal operation",
          contextLevel: "module",
        },
        {
          id: "ho-failure-path",
          lines: [78, 95],
          action: "Record failed probe and determine if circuit should reopen",
          reason:
            "Probe failures indicate service hasn't fully recovered yet; reopening circuit prevents premature traffic flood that could worsen service condition; gives service more time before next recovery attempt",
          contextLevel: "module",
        },
        {
          id: "ho-timeout-protection",
          lines: [98, 107],
          action:
            "Execute probe with timeout to prevent hanging on slow service",
          reason:
            "Slow responses indicate service is still struggling (database overload, resource contention); timeout treats slowness as failure, preventing probe requests from consuming resources while waiting",
          contextLevel: "local",
        },
        {
          id: "ho-concurrent-limit",
          lines: [110, 115],
          action: "Allow probes only when no other probes are in flight",
          reason:
            "Serial probe execution (one at a time) minimizes load on recovering service; concurrent probes could create burst traffic that overwhelms service before it's ready, defeating recovery purpose",
          contextLevel: "module",
        },
        {
          id: "ho-success-threshold",
          lines: [143, 146],
          action:
            "Check if successful probe count meets threshold for closing circuit",
          reason:
            "Threshold ensures statistical confidence - single success could be fluke, but N consecutive successes (e.g., 3) strongly indicate service is healthy and can handle production traffic",
          contextLevel: "module",
        },
        {
          id: "ho-fail-fast-policy",
          lines: [149, 157],
          action:
            "Determine if circuit should reopen based on fail-fast configuration",
          reason:
            "Fail-fast policy (reopen on first failure) is conservative - protects service aggressively but may delay recovery; non-fail-fast allows some failures (e.g., 1 out of 3) for more aggressive recovery",
          contextLevel: "module",
        },
        {
          id: "ho-transition-logic",
          lines: [160, 169],
          action: "Transition to HALF_OPEN and initialize probe tracking",
          reason:
            "Transition from OPEN state signals timeout elapsed and recovery testing should begin; reset counters ensure clean slate for new recovery attempt, not polluted by previous failed attempts",
          contextLevel: "module",
        },
        {
          id: "ho-close-circuit",
          lines: [172, 179],
          action: "Close circuit after all required probes succeed",
          reason:
            "Closing circuit signals successful recovery - service is healthy and can handle normal traffic; transitions from cautious probe mode back to normal operation with full request flow",
          contextLevel: "module",
        },
        {
          id: "ho-reopen-circuit",
          lines: [182, 189],
          action:
            "Reopen circuit when probe fails indicating incomplete recovery",
          reason:
            "Reopening protects service that hasn't fully recovered from production load; returns to OPEN state (full protection) and starts new timeout before next recovery attempt",
          contextLevel: "module",
        },
        {
          id: "ho-gradual-recovery",
          lines: [233, 236],
          action: "Simulate service with partial recovery (20% healthy)",
          reason:
            "Realistic scenario - services don't recover instantly but gradually as caches warm, connections reestablish, resources free up; demonstrates why controlled probing is necessary",
          contextLevel: "micro",
        },
        {
          id: "ho-premature-attempt",
          lines: [244, 263],
          action: "Test probe requests against partially recovered service",
          reason:
            "Demonstrates HALF_OPEN protecting against premature recovery - probes fail because service only 20% recovered, circuit reopens to prevent traffic flood, gives service more time",
          contextLevel: "module",
        },
        {
          id: "ho-successful-recovery",
          lines: [271, 296],
          action:
            "Test probe requests against fully recovered service (95% healthy)",
          reason:
            "Shows successful recovery path - multiple consecutive probe successes indicate service is healthy, circuit closes and normal operation resumes; validates recovery testing works correctly",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [43, 52],
          label:
            "Controlled probe admission to prevent overwhelming recovering service",
          sbvpDomain: "behavior",
        },
        {
          lines: [63, 77],
          label: "Successful probe path leading to circuit closure",
          sbvpDomain: "behavior",
        },
        {
          lines: [78, 95],
          label: "Failed probe path causing protective reopening",
          sbvpDomain: "behavior",
        },
        {
          lines: [143, 146],
          label: "Statistical confidence threshold for recovery validation",
          sbvpDomain: "philosophy",
        },
        {
          lines: [110, 115],
          label: "Serial probe execution limiting load on recovering service",
          sbvpDomain: "structure",
        },
        {
          lines: [4, 7],
          label: "Tunable probe requirements balancing speed vs confidence",
          sbvpDomain: "philosophy",
        },
        {
          lines: [149, 157],
          label: "Fail-fast vs tolerant recovery policy tradeoff",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Circuit Breaker Middleware in Service Mesh Proxies - Half-Open State is implemented within service mesh sidecars (Istio Envoy, Linkerd proxy) as part of the circuit breaking state machine. When an Envoy proxy detects a backend service has failed repeatedly (circuit OPEN), it waits for the configured sleep window (e.g., 30 seconds) before transitioning to HALF_OPEN. During HALF_OPEN, the proxy sends a single probe request to test if the backend has recovered. If the probe succeeds, the circuit closes and normal traffic resumes. If it fails, the circuit reopens for another sleep window. This placement at the infrastructure layer makes recovery testing transparent to application code—services don't need to implement Half-Open logic themselves; the mesh handles automatic recovery detection. The architectural benefit is centralized circuit breaking behavior across all services in the mesh with consistent Half-Open probe policies (probe count, timeout, fail-fast settings) configured via DestinationRule CRDs. Production impact: Istio's Half-Open implementation enables automatic service recovery within seconds of health restoration without manual intervention, maintaining 99.9% availability during rolling deployments and transient failures by quickly detecting when new service versions are healthy.",

      "HTTP Client Libraries with Circuit Breaker Support - Half-Open State is built into resilience-focused HTTP client libraries like Resilience4j (Java), Polly (.NET), and Opossum (Node.js). These libraries wrap outbound HTTP calls with circuit breaker decorators that automatically manage the OPEN → HALF_OPEN → CLOSED state transitions. For example, Resilience4j's CircuitBreaker.decorateSupplier() wraps a service call and, after the circuit has been OPEN for waitDurationInOpenState (e.g., 60 seconds), automatically transitions to HALF_OPEN and allows permittedNumberOfCallsInHalfOpenState (e.g., 3) probe requests through. If all 3 succeed, the circuit closes. If any fail, it reopens. This placement at the client library layer enables application developers to add Half-Open recovery logic with simple annotations (@CircuitBreaker in Spring Boot) or function decorators, without implementing complex state machine logic. The pattern is particularly effective for microservices calling external APIs (payment gateways, geocoding services) where automatic recovery from third-party outages is critical. Production systems using this placement (Netflix Hystrix, Spring Cloud Circuit Breaker) report 90% reduction in manual service restarts because Half-Open state detects recovery automatically and resumes traffic without operator intervention.",

      "API Gateway Circuit Breaking Layer - Half-Open State is implemented in API gateways (Kong, Amazon API Gateway, Azure API Management) positioned at the edge between external clients and backend microservices. When the gateway's circuit breaker detects repeated failures from a backend service (error rate >50%), it opens the circuit and returns cached responses or fallback errors to clients for a configured duration. After the timeout expires, the gateway enters HALF_OPEN state and forwards a limited number of probe requests to the backend. Kong's circuit breaker plugin, for example, allows 1-5 probes during HALF_OPEN before deciding whether to close the circuit. This placement at the gateway layer protects backend services from being overwhelmed by external traffic during recovery—only probe requests reach the backend until it proves healthy. The architectural advantage is that backend services don't need circuit breaker logic; the gateway handles recovery testing centrally. Production deployments using gateway-level Half-Open (Spotify, Expedia) report that it prevents traffic spikes from crushing services immediately after recovery, allowing gradual health validation before resuming full load.",

      "Database Connection Pool Circuit Breakers - Half-Open State is implemented in database connection pooling libraries (HikariCP, c3p0, connection-pool for Node.js) to handle database failures gracefully. When a connection pool detects the database is unreachable (connection timeouts, network errors), it can enter a circuit breaker OPEN state where connection acquisition attempts fail fast instead of blocking threads. After a configured recovery timeout (e.g., 30 seconds), the pool enters HALF_OPEN and attempts to establish 1-2 probe connections to verify the database is reachable. If successful, the circuit closes and the pool resumes normal connection provisioning. If the probe connections fail, the circuit reopens. This placement at the connection pool layer prevents application threads from blocking indefinitely when the database is down, while enabling automatic reconnection when the database recovers. Production systems (e.g., Spring Boot with HikariCP) use this to survive database restarts and network partitions—instead of accumulating hundreds of blocked threads waiting for connections, the application fails fast during OPEN, then automatically recovers via Half-Open probes when the database becomes available again.",

      "Message Queue Consumer Circuit Breakers - Half-Open State is applied in message queue consumer frameworks (Spring AMQP, Celery, Kafka Consumers) to handle downstream service failures during message processing. When a consumer repeatedly fails to process messages (e.g., calling a failed payment service for each order message), a circuit breaker can open to stop consuming messages temporarily, giving the downstream service time to recover. After a timeout period, the consumer enters HALF_OPEN and processes 1-3 probe messages. If processing succeeds (downstream service healthy), the circuit closes and normal consumption resumes. If processing fails, the circuit reopens and the consumer continues to pause. This placement at the consumer layer prevents poison message amplification—a single downstream failure doesn't cause the consumer to process (and fail) thousands of queued messages, overwhelming the failing service. Production queue systems (RabbitMQ with Spring Cloud Stream, AWS SQS with backoff policies) use Half-Open state to automatically resume consumption after downstream services recover, maintaining message throughput without manual intervention or message loss.",
    ],

    architecturalBoundaries: [
      "Service-to-Service Communication Boundary - Half-Open State operates at the boundary between calling services and their dependencies, positioned in the circuit breaker logic that wraps remote procedure calls (HTTP, gRPC, message passing). When Service A calls Service B, the circuit breaker sits at the call site in Service A's codebase, managing the OPEN → HALF_OPEN → CLOSED transitions based on Service B's health. The Half-Open phase is critical here because it tests recovery without exposing Service B to full production load. During HALF_OPEN, only probe requests (1-5 requests) reach Service B, allowing it to demonstrate health with minimal load before the flood gates open. This boundary is distinct from the OPEN state (all requests blocked) and CLOSED state (all requests forwarded)—HALF_OPEN is the cautious middle ground. The boundary enforces load control: probe request limit prevents overwhelming recovering service, timeout protection detects still-slow responses, and success threshold (N consecutive successes) provides statistical confidence. Production deployments at this boundary (Netflix calling 50+ microservices per page render) use Half-Open to recover from transient failures within seconds while protecting services from premature traffic spikes that could cause re-failure.",

      "External API Integration Boundary - Half-Open State is essential at the boundary where internal services call external third-party APIs (payment processors, geocoding services, authentication providers, weather APIs). When an external API experiences an outage (Stripe payment processing down, Google Maps API rate-limited), the circuit opens to prevent internal services from accumulating timeouts. After the OPEN timeout expires (e.g., 60 seconds), HALF_OPEN state sends probe requests to test if the external provider has recovered. This boundary is particularly valuable because external services are outside the team's control—you can't restart Stripe's servers or debug their outage. Half-Open provides automatic recovery detection without manual monitoring and intervention. The boundary also protects billing—if external APIs charge per request, preventing traffic floods during recovery via Half-Open probes saves costs. Architectural pattern: wrap external client libraries (Stripe SDK, AWS SDK, Twilio client) with circuit breakers that enter Half-Open after provider outages. Production systems (e-commerce checkout flows, IoT telemetry processing) use this boundary to survive third-party outages gracefully: fail fast during OPEN, automatically resume via Half-Open when providers recover, maintain core business functionality even when external integrations fail.",

      "Database Access Boundary - Half-Open State operates at the data access layer where application code queries databases, positioned in the ORM (Hibernate, Sequelize, Prisma), connection pool (HikariCP, pgBouncer), or database client library. When the database becomes unreachable (network partition, database restart, overload), the circuit breaker opens to stop sending queries that would timeout and block application threads. After the OPEN period (e.g., 30 seconds), the data layer enters HALF_OPEN and sends 1-2 probe queries (simple SELECT 1 health checks or lightweight application queries) to verify database connectivity. If probes succeed, the circuit closes and normal query traffic resumes. If probes fail, the circuit reopens. This boundary is critical because database failures have cascading effects—blocked threads waiting for timeouts exhaust thread pools and cause application-wide unavailability. Half-Open enables automatic recovery from database restarts, replica failovers, and transient network issues without manual intervention. Architectural consideration: probe queries must be lightweight (not full table scans) to avoid overloading recovering database. Production databases (Postgres replicas during failover, MongoDB during elections) benefit from Half-Open probes that detect when the new primary is ready without flooding it with backlogged queries immediately.",

      "Asynchronous Job Processing Boundary - Half-Open State applies to background job processors (Sidekiq, Celery, Bull, Hangfire) that execute async tasks with external dependencies. When a job worker repeatedly fails to complete jobs (e.g., sending emails via failed SMTP server, uploading to unavailable S3 bucket), a circuit breaker can open to pause job processing and prevent burning through retry attempts. After the OPEN timeout (e.g., 5 minutes), the worker enters HALF_OPEN and processes 1-2 probe jobs to test if the external dependency (SMTP, S3) has recovered. If probes succeed, the circuit closes and job processing resumes at full speed. If probes fail, the circuit reopens and workers continue pausing. This boundary prevents job queue stampedes—without Half-Open, all queued jobs would attempt execution simultaneously when the dependency recovers, potentially overwhelming it and causing re-failure. The boundary also prevents rapid retry exhaustion: instead of each job burning its 3 retries during an outage, the circuit opens after detecting a pattern, preserves retry budgets, and only attempts probe jobs. Production job systems (email sending, image processing, data ETL) use Half-Open to automatically resume processing after external service recovery while controlling load during the critical recovery phase.",
    ],

    interactsWith: [
      "circuit-breaker",
      "closed-state",
      "open-state",
      "retry",
      "timeout",
      "exponential-backoff",
      "health-check",
      "fallback",
      "bulkhead",
    ],
  },

  implementations: [
    {
      id: "resilience4j-half-open",
      name: "Resilience4j CircuitBreaker Half-Open State (Java)",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Resilience4j implements Half-Open state with configurable permittedNumberOfCallsInHalfOpenState (default: 10). After waitDurationInOpenState expires, the circuit transitions to HALF_OPEN and allows N probe calls. If failure rate exceeds threshold, circuit reopens. If all probes succeed, circuit closes. Supports both count-based and time-based sliding windows for failure tracking.",
      links: {
        docs: "https://resilience4j.readme.io/docs/circuitbreaker",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.time.Duration;

// Configure circuit breaker with Half-Open settings
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
  // Open circuit after 50% failure rate
  .failureRateThreshold(50)
  .slowCallRateThreshold(50)
  .slowCallDurationThreshold(Duration.ofSeconds(2))

  // Sliding window: track last 100 calls
  .slidingWindowSize(100)
  .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)

  // Minimum calls before circuit can trip
  .minimumNumberOfCalls(10)

  // HALF-OPEN configuration
  .waitDurationInOpenState(Duration.ofSeconds(60))  // Wait 60s before trying HALF-OPEN
  .permittedNumberOfCallsInHalfOpenState(3)         // Allow 3 probe calls in HALF-OPEN
  .automaticTransitionFromOpenToHalfOpenEnabled(true) // Auto-transition after timeout

  // State transition listeners
  .onStateTransition(event -> {
    switch (event.getStateTransition()) {
      case OPEN_TO_HALF_OPEN:
        logger.info("Circuit transitioning to HALF-OPEN - testing recovery with {} probe calls",
          config.getPermittedNumberOfCallsInHalfOpenState());
        metrics.recordStateTransition("half_open");
        break;
      case HALF_OPEN_TO_CLOSED:
        logger.info("Circuit CLOSED - {} probe calls succeeded, service recovered",
          config.getPermittedNumberOfCallsInHalfOpenState());
        metrics.recordStateTransition("closed_from_half_open");
        break;
      case HALF_OPEN_TO_OPEN:
        logger.warn("Circuit REOPENED - probe calls failed, service not recovered");
        metrics.recordStateTransition("reopen_from_half_open");
        break;
    }
  })
  .build();

CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
CircuitBreaker breaker = registry.circuitBreaker("userService");

// Usage with automatic Half-Open handling
Supplier<User> decoratedSupplier = CircuitBreaker
  .decorateSupplier(breaker, () -> userService.getUser(userId));

try {
  User user = decoratedSupplier.get();
  // Success: if in HALF-OPEN, this counts toward probe success threshold
} catch (Exception e) {
  // Failure: if in HALF-OPEN, circuit will reopen
  if (breaker.getState() == CircuitBreaker.State.HALF_OPEN) {
    logger.warn("Probe request failed during HALF-OPEN - circuit will reopen");
  }
}

// Monitor circuit state
CircuitBreaker.Metrics metrics = breaker.getMetrics();
logger.info("Circuit state: {}, Failure rate: {}%, Buffered calls: {}",
  breaker.getState(),
  metrics.getFailureRate(),
  metrics.getNumberOfBufferedCalls());`,
    },
    {
      id: "hystrix-half-open",
      name: "Netflix Hystrix Half-Open State (Java)",
      type: "library",
      languages: ["java"],
      description:
        "Hystrix implements Half-Open state by allowing a single probe request after sleepWindowInMilliseconds expires. If the probe succeeds, circuit closes. If it fails, circuit reopens for another sleep window. Simpler than Resilience4j (1 probe vs configurable N probes) but battle-tested at Netflix scale. Now in maintenance mode; migrate to Resilience4j for new projects.",
      links: {
        docs: "https://github.com/Netflix/Hystrix/wiki/How-it-Works#circuit-breaker",
        github: "https://github.com/Netflix/Hystrix",
      },
      codeSnippet: `import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixCommandProperties;

public class UserServiceCommand extends HystrixCommand<User> {
  private final String userId;
  private final UserService userService;

  public UserServiceCommand(String userId, UserService userService) {
    super(Setter
      .withGroupKey(HystrixCommandGroupKey.Factory.asKey("UserService"))
      .andCommandPropertiesDefaults(
        HystrixCommandProperties.Setter()
          // Circuit breaker configuration
          .withCircuitBreakerEnabled(true)
          .withCircuitBreakerRequestVolumeThreshold(20)  // Min requests before circuit can trip
          .withCircuitBreakerErrorThresholdPercentage(50) // Trip at 50% error rate

          // HALF-OPEN configuration
          .withCircuitBreakerSleepWindowInMilliseconds(30000) // Wait 30s before HALF-OPEN
          // Hystrix allows exactly 1 probe request in HALF-OPEN (not configurable)
          // If probe succeeds → CLOSED, if fails → OPEN for another 30s

          .withExecutionTimeoutInMilliseconds(5000)
      )
    );
    this.userId = userId;
    this.userService = userService;
  }

  @Override
  protected User run() throws Exception {
    // This method is called during CLOSED and HALF-OPEN states
    // During HALF-OPEN, this is the probe request
    return userService.getUser(userId);
  }

  @Override
  protected User getFallback() {
    // Called when circuit is OPEN or probe fails in HALF-OPEN
    logger.warn("Circuit state: {} - using fallback",
      isCircuitBreakerOpen() ? "OPEN" : "HALF-OPEN (probe failed)");
    return getCachedUser(userId);
  }

  // Monitor Half-Open transitions
  @Override
  protected void onRunSuccess() {
    super.onRunSuccess();
    if (isCircuitBreakerOpen()) {
      // Probe succeeded in HALF-OPEN - circuit will close
      logger.info("HALF-OPEN probe succeeded - circuit closing");
      metrics.recordHalfOpenSuccess();
    }
  }

  @Override
  protected void onRunError(Exception e) {
    super.onRunError(e);
    if (isCircuitBreakerOpen()) {
      // Probe failed in HALF-OPEN - circuit will reopen
      logger.warn("HALF-OPEN probe failed - circuit reopening");
      metrics.recordHalfOpenFailure();
    }
  }
}

// Usage
User user = new UserServiceCommand(userId, userService).execute();`,
    },
    {
      id: "polly-half-open",
      name: "Polly CircuitBreaker Half-Open State (.NET)",
      type: "library",
      languages: ["csharp"],
      description:
        "Polly's AdvancedCircuitBreakerAsync implements Half-Open state with configurable durationOfBreak and automatic transition. After break duration, single probe request tests service health. Integrates seamlessly with ASP.NET Core dependency injection and HttpClient factory. Supports both simple and advanced circuit breaker policies.",
      links: {
        docs: "https://github.com/App-vNext/Polly#circuit-breaker",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `using Polly;
using Polly.CircuitBreaker;
using System;
using System.Net.Http;

// Configure circuit breaker with Half-Open behavior
var circuitBreakerPolicy = Policy
  .Handle<HttpRequestException>()
  .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
  .AdvancedCircuitBreakerAsync(
    failureThreshold: 0.5,                          // Trip at 50% failure rate
    samplingDuration: TimeSpan.FromSeconds(10),     // Measure failures over 10s window
    minimumThroughput: 10,                          // Min requests before circuit can trip
    durationOfBreak: TimeSpan.FromSeconds(30),      // OPEN duration before HALF-OPEN

    onBreak: (result, duration, context) => {
      logger.LogWarning("Circuit OPENED - will attempt HALF-OPEN in {Duration}s",
        duration.TotalSeconds);
      metrics.RecordCircuitOpen();
    },

    onReset: (context) => {
      logger.LogInformation("Circuit CLOSED - HALF-OPEN probe succeeded, service recovered");
      metrics.RecordCircuitClosed();
    },

    onHalfOpen: () => {
      logger.LogInformation("Circuit HALF-OPEN - sending probe request to test recovery");
      metrics.RecordHalfOpenTransition();
    }
  );

// Usage with HttpClient
public async Task<User> GetUserAsync(string userId)
{
  try
  {
    var response = await circuitBreakerPolicy.ExecuteAsync(async () =>
      await httpClient.GetAsync($"https://api.example.com/users/{userId}")
    );

    response.EnsureSuccessStatusCode();
    return await response.Content.ReadAsAsync<User>();
  }
  catch (BrokenCircuitException ex)
  {
    logger.LogWarning("Circuit is OPEN - using cached user");
    return await GetCachedUserAsync(userId);
  }
  catch (HttpRequestException ex) when (circuitBreakerPolicy.CircuitState == CircuitState.HalfOpen)
  {
    logger.LogWarning("HALF-OPEN probe failed - circuit reopening");
    throw;
  }
}

// ASP.NET Core integration with typed HttpClient
services.AddHttpClient<IUserService, UserService>()
  .AddPolicyHandler(circuitBreakerPolicy);`,
    },
    {
      id: "opossum-half-open",
      name: "Opossum CircuitBreaker Half-Open State (Node.js)",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Opossum implements Half-Open state with configurable resetTimeout and allowWarmUp option. After reset timeout, circuit enters Half-Open and allows volumeThreshold requests as probes. If all succeed, circuit closes. If any fail, circuit reopens. Provides event emitters for state transitions and metrics integration.",
      links: {
        github: "https://github.com/nodeshift/opossum",
        npm: "https://www.npmjs.com/package/opossum",
      },
      codeSnippet: `import CircuitBreaker from 'opossum';

// Configure circuit breaker with Half-Open settings
const options = {
  timeout: 5000,                     // Request timeout
  errorThresholdPercentage: 50,      // Trip at 50% error rate
  resetTimeout: 30000,               // HALF-OPEN after 30 seconds

  // Half-Open configuration
  volumeThreshold: 3,                // 3 successful probes needed to close circuit
  allowWarmUp: true,                 // Gradually increase traffic in HALF-OPEN

  // Custom error filtering (don't count 4xx as failures)
  errorFilter: (err) => {
    return err.statusCode && err.statusCode < 500;
  }
};

const breaker = new CircuitBreaker(
  async (userId) => {
    const response = await fetch(\`https://api.example.com/users/\${userId}\`);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  },
  options
);

// Monitor Half-Open state transitions
breaker.on('halfOpen', () => {
  console.log('Circuit HALF-OPEN - sending probe requests');
  metrics.increment('circuit.half_open');
});

breaker.on('close', () => {
  console.log('Circuit CLOSED - probe requests succeeded');
  metrics.increment('circuit.closed_from_half_open');
});

breaker.on('open', () => {
  console.log('Circuit OPEN - probe requests failed, reopening');
  metrics.increment('circuit.reopen');
});

// Track probe request outcomes during HALF-OPEN
breaker.on('success', (result, latency) => {
  if (breaker.halfOpen) {
    console.log(\`HALF-OPEN probe succeeded in \${latency}ms\`);
    metrics.recordProbeSuccess(latency);
  }
});

breaker.on('failure', (error) => {
  if (breaker.halfOpen) {
    console.log(\`HALF-OPEN probe failed: \${error.message}\`);
    metrics.recordProbeFailure();
  }
});

// Usage
try {
  const user = await breaker.fire(userId);
  console.log(\`Got user from \${breaker.opened ? 'HALF-OPEN probe' : 'normal call'}\`);
} catch (error) {
  if (breaker.opened) {
    console.log('Circuit OPEN - using fallback');
    return getCachedUser(userId);
  }
  throw error;
}`,
    },
    {
      id: "failsafe-go-half-open",
      name: "failsafe-go CircuitBreaker Half-Open (Go)",
      type: "library",
      languages: ["go"],
      description:
        "failsafe-go implements Half-Open state with configurable delay and half-open thresholds. After delay period, circuit enters Half-Open and allows probe executions. Supports both failure count and failure rate thresholds. Integrates with Go context for cancellation and timeout propagation.",
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
  // Configure circuit breaker with Half-Open settings
  breaker := circuitbreaker.Builder[*User]().
    // Circuit opens after 50% failure rate
    WithFailureRateThreshold(50, 100, time.Minute).

    // HALF-OPEN configuration
    WithDelay(30 * time.Second).        // Wait 30s before HALF-OPEN
    OnHalfOpen(3).                      // Allow 3 probe requests in HALF-OPEN

    // State transition hooks
    OnOpen(func(event circuitbreaker.StateChangedEvent) {
      fmt.Printf("Circuit OPEN - will attempt HALF-OPEN in %v\\n", 30*time.Second)
      metrics.RecordStateChange("open")
    }).
    OnHalfOpen(func(event circuitbreaker.StateChangedEvent) {
      fmt.Println("Circuit HALF-OPEN - sending probe requests")
      metrics.RecordStateChange("half_open")
    }).
    OnClose(func(event circuitbreaker.StateChangedEvent) {
      fmt.Println("Circuit CLOSED - probe requests succeeded")
      metrics.RecordStateChange("closed")
    }).
    Build()

  // Create executor with circuit breaker
  executor := failsafe.NewExecutor[*User](breaker)

  // Execute with automatic Half-Open handling
  ctx := context.Background()
  user, err := executor.Get(func() (*User, error) {
    return fetchUser(ctx, userID)
  })

  if err != nil {
    // Check if failure occurred during HALF-OPEN
    if breaker.State() == circuitbreaker.HalfOpenState {
      fmt.Println("HALF-OPEN probe failed - circuit reopening")
      metrics.RecordProbeFailure()
      return getCachedUser(userID), nil
    }

    if breaker.IsOpen() {
      fmt.Println("Circuit OPEN - using fallback")
      return getCachedUser(userID), nil
    }

    return nil, err
  }

  // Track probe success during HALF-OPEN
  if breaker.State() == circuitbreaker.HalfOpenState {
    fmt.Println("HALF-OPEN probe succeeded")
    metrics.RecordProbeSuccess()
  }

  return user, nil
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-zuul-half-open",
      systemName: "Netflix Zuul API Gateway",
      howUsed:
        "Netflix's Zuul API gateway uses Hystrix circuit breakers with Half-Open state to handle failures when proxying requests to backend microservices. When a backend service (e.g., user profile service) experiences high error rates, Zuul's circuit breaker opens to fail fast and return cached responses. After the sleepWindowInMilliseconds expires (default 5 seconds), the circuit enters Half-Open and Zuul sends a single probe request to test if the service has recovered. If the probe succeeds, the circuit closes and Zuul resumes normal traffic to the service. If the probe fails (timeout, error, slow response), the circuit reopens for another sleep window. This Half-Open mechanism enables automatic recovery from transient failures without manual intervention—when a service deployment completes or a database connection is restored, Zuul automatically detects health restoration within seconds and resumes traffic. Pattern composition: Half-Open + Hystrix Circuit Breaker + Fallback (cached responses) + Timeout (5s per request) + Bulkhead (thread pool isolation per service). Rationale: Netflix's microservice architecture has 500+ services; manual monitoring and circuit reset for each service would require dozens of engineers on-call; Half-Open automates recovery detection at scale. Impact: Reduced manual circuit resets by 95%; enabled automatic recovery from transient failures within 5-10 seconds; maintained 99.99% gateway availability despite frequent backend service deployments and transient issues; prevented cascade failures during rolling deployments by detecting when new service versions are healthy before routing full traffic.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "aws-api-gateway-half-open",
      systemName: "AWS API Gateway Circuit Breaker",
      howUsed:
        "AWS API Gateway implements circuit breaker logic with Half-Open state for backend integrations (Lambda, HTTP endpoints, AWS services). When an integration experiences sustained failures (e.g., Lambda cold starts timing out, HTTP backend returning 500 errors), API Gateway opens the circuit and returns 503 Service Unavailable to clients. After a configured interval (typically 30-60 seconds), the gateway enters Half-Open state and sends probe requests to the backend. API Gateway's implementation allows a small percentage of traffic (e.g., 5%) as probes rather than a fixed count. If probe success rate exceeds a threshold (e.g., 80% success), the circuit closes. If probes continue failing, the circuit reopens. This percentage-based approach is more robust than fixed probe counts at high traffic volumes—5% of 10,000 req/s provides 500 probe requests, giving strong statistical confidence in recovery. The Half-Open mechanism is particularly valuable for Lambda integrations where cold starts can cause temporary latency spikes; automatic recovery via Half-Open prevents these spikes from requiring manual intervention. Pattern composition: Half-Open + Percentage-based Probe Traffic + Integration Timeout + Retry with Backoff. Rationale: API Gateway serves millions of APIs; manual circuit management doesn't scale; Half-Open enables automatic recovery while controlling load on struggling backends. Impact: Maintained 99.95% API availability during backend failures; reduced support tickets for 'API returning 503' by 80% through automatic recovery; enabled faster recovery from Lambda cold start issues (seconds vs minutes of manual intervention).",
      source:
        "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html",
    },
    {
      systemId: "uber-circuit-breaker-half-open",
      systemName: "Uber Ride Request Circuit Breaker",
      howUsed:
        "Uber's ride request flow uses circuit breakers with Half-Open state to protect critical dependencies like driver location service, pricing calculation, and payment processing. When the driver location service fails (e.g., due to database overload), the circuit opens and ride requests fall back to showing last-known driver locations (up to 30 seconds stale). After 60 seconds in OPEN state, the circuit transitions to Half-Open and sends 3 probe requests to the location service. If all 3 probes return successfully with acceptable latency (<500ms), the circuit closes and real-time driver locations resume. If any probe fails or exceeds latency threshold, the circuit reopens for another 60 seconds. Uber's implementation uses weighted probes—probes are actual user ride requests (not synthetic health checks) to ensure the service can handle real traffic patterns, but only 3 requests are exposed to potential failure during Half-Open. The Half-Open mechanism prevents the thundering herd problem: if the circuit closed immediately when the timeout expired, thousands of concurrent ride requests would flood the recovering location service, potentially overwhelming it again. Instead, Half-Open provides gradual recovery validation. Pattern composition: Half-Open + Weighted Probe Requests (real traffic) + Latency Threshold (not just success/failure) + Fallback (stale location data) + Load Shedding. Rationale: Uber operates in 10,000+ cities with highly variable load; ride requests cannot tolerate long outages; Half-Open enables fast automatic recovery while preventing service re-overload. Impact: Reduced incident resolution time by 60% through automatic recovery; prevented secondary failures from thundering herd during recovery; maintained acceptable user experience during location service degradation by serving stale data during OPEN and quickly resuming real-time data via Half-Open.",
      source: "https://eng.uber.com/micro-deploy-code/",
    },
    {
      systemId: "github-mysql-half-open",
      systemName: "GitHub MySQL Circuit Breaker",
      howUsed:
        "GitHub's application layer uses circuit breakers with Half-Open state for MySQL database connections to handle primary database failures gracefully. When the primary MySQL database becomes unreachable (network partition, database restart, quorum loss), the circuit breaker opens and GitHub routes read queries to read replicas while queuing write operations. After 30 seconds in OPEN state, the circuit enters Half-Open and sends lightweight probe queries (SELECT 1 health checks) to the primary. If 3 consecutive probes succeed with latency <100ms, the circuit closes and write operations resume. If probes timeout or fail, the circuit reopens. GitHub's Half-Open implementation is critical for database failover scenarios: when a new primary is elected, Half-Open probes detect when it's ready to accept writes without flooding it with the backlog of queued operations. The probes also verify that replication lag is acceptable before closing the circuit, ensuring read-after-write consistency. Pattern composition: Half-Open + Lightweight Health Check Probes + Read Replica Fallback + Write Operation Queueing + Replication Lag Detection. Rationale: GitHub processes millions of git operations daily; database failover is inevitable; manual circuit management during failover would cause extended write outages; Half-Open enables automatic recovery within seconds of primary being ready. Impact: Reduced database failover impact from 10+ minutes (manual recovery) to 30-60 seconds (automatic Half-Open detection); prevented thundering herd of writes from overwhelming newly elected primary; maintained read availability during primary outages by routing to replicas; enabled GitHub to survive database failures without user-visible write outages.",
      source: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
    },
    {
      systemId: "stripe-payment-processor-half-open",
      systemName: "Stripe Payment Processor Circuit Breaker",
      howUsed:
        "Stripe's payment processing infrastructure implements circuit breakers with Half-Open state for payment gateway integrations (Visa, Mastercard, ACH processors). When a payment processor experiences an outage or high latency, Stripe's circuit breaker opens to prevent transaction timeouts from blocking merchant checkouts. During the OPEN state, Stripe routes transactions to backup processors or queues them for delayed processing. After 60 seconds, the circuit enters Half-Open and Stripe sends 5 probe transactions to the primary processor. These are real test transactions (small amounts charged to Stripe test accounts) to verify end-to-end processor health, not just network connectivity. If all 5 probes succeed and complete within acceptable latency (<2 seconds), the circuit closes and normal processing resumes. If any probe fails or times out, the circuit reopens and backup routing continues. Stripe's probe transactions are crucial because they detect not just processor availability but also performance degradation—a processor may be reachable but processing transactions slowly, which would still cause poor merchant experience. The Half-Open phase prevents premature recovery declarations that could cause a flood of transactions to a still-degraded processor. Pattern composition: Half-Open + Real Transaction Probes + Multi-Gateway Fallback + Idempotency (probe transactions use unique keys) + Latency Thresholds. Rationale: Payment processing requires sub-second latency; processor outages are rare but catastrophic for merchant revenue; Half-Open enables automatic recovery while ensuring processor performance meets SLAs before resuming traffic. Impact: Maintained 99.99% payment success rate during processor incidents; prevented $50M+ in lost transaction volume through automatic processor failover and recovery; reduced payment latency during processor degradation by detecting slow responses in Half-Open and keeping circuit open; enabled Stripe to handle Black Friday/Cyber Monday traffic spikes with automatic recovery from transient processor issues.",
      source: "https://stripe.com/blog/payment-api-design",
    },
  ],

  references: [
    {
      title:
        "Circuit Breaker Pattern - Martin Fowler (Half-Open State Section)",
      url: "https://martinfowler.com/bliki/CircuitBreaker.html",
      type: "article",
      author: "Martin Fowler",
    },
    {
      title:
        "Release It! - Stability Patterns (Circuit Breaker Half-Open Recovery)",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Resilience4j CircuitBreaker Documentation - Half-Open State",
      url: "https://resilience4j.readme.io/docs/circuitbreaker#half-open",
      type: "documentation",
      author: "Resilience4j Contributors",
    },
    {
      title: "Hystrix: How It Works - Circuit Breaker (Half-Open Logic)",
      url: "https://github.com/Netflix/Hystrix/wiki/How-it-Works#circuit-breaker",
      type: "documentation",
      author: "Netflix",
    },
    {
      title: "Azure Architecture - Circuit Breaker Pattern (Recovery Testing)",
      url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker",
      type: "documentation",
      author: "Microsoft",
    },
  ],

  philosophy: {
    coreProblem:
      "Circuits must automatically detect when failed services have recovered and resume normal operation, but premature recovery attempts can overwhelm still-struggling services and cause immediate re-failure, while indefinite circuit blocking requires manual intervention and delays recovery",
    designPrinciple:
      "Test recovery cautiously with limited probe requests that provide statistical confidence in service health without overwhelming the recovering system, automatically transitioning to normal operation on success or protective blocking on failure",
    historicalContext:
      "Half-Open State emerged from Netflix's Hystrix development (2011-2012) when engineers observed that the binary OPEN/CLOSED circuit breaker model created problems during recovery. When circuits opened due to service failures, they would remain open indefinitely until manually reset, or they would close after a timeout and immediately flood the recovering service with accumulated backlog traffic, causing instant re-failure. This 'thundering herd on recovery' problem was particularly acute in Netflix's microservice architecture where a single service failure could open hundreds of circuits across dependent services. The Half-Open state was introduced as the cautious middle ground: after the OPEN timeout expires, send a small number of probe requests (originally 1 in Hystrix, later configurable in Resilience4j) to test if the service can handle traffic before resuming full load. The pattern proved critical during Netflix's AWS migrations where services would restart frequently during deployments—Half-Open enabled automatic recovery detection within seconds rather than requiring operations teams to manually reset circuits or waiting for the next deployment. Modern implementations (Resilience4j, Polly, Opossum) extended Half-Open with configurable probe counts, success thresholds, and latency requirements, recognizing that single probe requests provide weak statistical confidence. The pattern reflects a fundamental distributed systems principle: gradual recovery is safer than instant full-load resumption, and automated health testing beats manual intervention for scale.",
    alternativesRejected: [
      "No Half-Open (Binary OPEN/CLOSED) - Circuit remains OPEN until manually reset or immediately closes after timeout. Results in either indefinite blocking requiring manual intervention, or thundering herd problem where accumulated traffic overwhelms recovering service causing instant re-failure. Used in early circuit breaker implementations but abandoned due to operational burden and poor recovery characteristics.",
      "Immediate Close After Timeout - Circuit automatically closes after OPEN timeout without testing service health first. Causes thundering herd: backlog of queued requests floods recovering service simultaneously, overwhelming it and causing circuit to reopen immediately. Creates oscillation between OPEN and CLOSED states without stable recovery. Pattern found in naive circuit breaker implementations.",
      "Synthetic Health Checks Only - Use dedicated health check endpoints (e.g., /health, SELECT 1) as probes instead of real traffic. Health checks may pass while real operations still fail (database slow, application logic broken, resource exhaustion). Results in premature circuit closing followed by immediate failure. Half-Open uses real request patterns as probes to ensure end-to-end health.",
      "Percentage-Based Gradual Increase - Instead of fixed probe count, gradually increase traffic percentage (1% → 10% → 50% → 100%) during recovery. More complex to implement, slower recovery (requires multiple time windows), and harder to reason about state transitions. Half-Open's fixed probe threshold provides simpler, faster recovery with clear success criteria.",
      "Exponentially Increasing Probe Delay - After each failed probe, increase delay before next Half-Open attempt (30s → 60s → 120s). Delays recovery unnecessarily when service has recovered but a single transient issue caused probe failure. Half-Open's fixed delay with immediate reopen on failure provides faster recovery from genuine health restoration.",
      "Manual Circuit Reset - Require operations team to manually close circuit after confirming service health. Doesn't scale with microservice architectures (100s of circuits), delays recovery (human in the loop), and creates operational burden. Half-Open automates recovery detection, enabling self-healing systems without human intervention.",
    ],
    mentalModel:
      "Half-Open State is like testing ice thickness before skating. After a lake has been frozen (service OPEN) and enough time has passed (timeout), you don't immediately skate with a full hockey team (resume all traffic). Instead, you carefully send a few scouts to walk on the ice (probe requests) to test if it's truly safe. If the scouts cross successfully (probes succeed), the whole team follows (circuit closes). If the ice cracks under the scouts (probes fail), everyone stays off (circuit reopens) and waits longer for the ice to thicken. The key insight: cautious testing with limited exposure prevents catastrophic failure (whole team falling through thin ice) while enabling fast recovery when conditions are safe (scouts confirm thick ice).",
  },

  visualization: {
    staticDiagram: `stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> OPEN: Failures exceed threshold

    OPEN --> HALF_OPEN: Timeout expires (e.g., 60s)

    HALF_OPEN --> CLOSED: Probes succeed (e.g., 3/3 success)
    HALF_OPEN --> OPEN: Probe fails (service not recovered)

    CLOSED --> CLOSED: Normal operation
    OPEN --> OPEN: Waiting for timeout

    note right of HALF_OPEN
      Limited probe requests
      Test service health
      Prevent overwhelming
      recovering service
    end note`,
    realWorldAnalogy:
      "Half-Open State is like a restaurant kitchen that had a fire (service failure) and was shut down (circuit OPEN). After the fire department gives the all-clear and enough time has passed (timeout), the health inspector doesn't immediately allow full service. Instead, they enter a 'soft opening' phase (HALF_OPEN) where the kitchen prepares a few sample dishes (probe requests) to verify all equipment works, staff can handle orders, and food safety is maintained. If these test dishes are successful, the restaurant gets full approval to reopen (circuit CLOSED). If smoke appears or food is undercooked, the kitchen closes again for more repairs (circuit reopens). This cautious testing prevents serving 100 customers with a kitchen that's not ready, while enabling fast reopening when truly recovered.",
    useCases: [
      {
        domain: "Microservices API Gateway",
        scenario:
          "API gateway routing requests to 50+ backend services. When recommendation service fails, circuit opens. After 60s, Half-Open sends 3 probe requests. If all succeed, resume normal traffic. If probes fail, reopen for another 60s.",
        patternRole:
          "Automatic recovery detection prevents manual circuit resets while protecting recovering services from traffic floods",
        companies: ["Netflix", "Uber", "Airbnb"],
      },
      {
        domain: "Payment Processing",
        scenario:
          "E-commerce checkout calling Stripe API. Network partition causes circuit to open. After 30s, Half-Open sends test transaction. Success closes circuit and processes queued payments. Failure keeps circuit open.",
        patternRole:
          "Ensures payment gateway can handle real transactions before processing backlog, preventing lost revenue",
        companies: ["Stripe", "Square", "Shopify"],
      },
      {
        domain: "Database Connection Pool",
        scenario:
          "Application connection pool to primary database. Database restart opens circuit. After 30s, Half-Open sends SELECT 1 probe. Success resumes writes. Timeout reopens circuit.",
        patternRole:
          "Automatic reconnection to database after restart without overwhelming newly recovered database with backlog",
        companies: ["GitHub", "GitLab", "Basecamp"],
      },
      {
        domain: "Message Queue Consumer",
        scenario:
          "Worker processing email queue calling SMTP service. SMTP outage opens circuit. After 5 minutes, Half-Open processes 2 probe emails. Success resumes queue processing.",
        patternRole:
          "Prevents burning through email retry budgets during outage while automatically resuming when SMTP recovers",
        companies: ["SendGrid", "Mailchimp", "Twilio"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "circuit-breaker",
    "automatic-recovery",
    "state-machine",
    "self-healing",
    "probe-requests",
  ],
  difficulty: "intermediate",
};
