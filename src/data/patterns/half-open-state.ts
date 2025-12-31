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
};
