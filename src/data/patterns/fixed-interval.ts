import type { Pattern } from "../schema";

export const fixedInterval: Pattern = {
  id: "fixed-interval",
  slug: "fixed-interval",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retry → 🔢 Fixed Interval",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retry",
    level: 4,
  },

  concept: {
    name: "Fixed Interval",
    emoji: "🔢",
    tagline: "Constant delay",
    definition:
      "Fixed Interval Retry is a retry strategy that waits a constant, unchanging duration between retry attempts, providing predictable retry behavior with uniform spacing between operations. Like a metronome that maintains steady rhythm regardless of musical tempo changes, fixed interval retries use the same delay for every attempt: 1 second, then 1 second, then 1 second. When an operation fails, the retry handler waits exactly the configured interval before attempting again, repeating this pattern until success or maximum attempts are exhausted. This contrasts with exponential backoff (increasing delays) or immediate retry (zero delay). The pattern provides deterministic, predictable retry timing that simplifies capacity planning and makes retry behavior easy to reason about. It's particularly effective when failures are truly random and uncorrelated with system load—network packet loss, transient service blips, or brief availability gaps. However, fixed intervals can be problematic during sustained outages because they maintain constant retry pressure on struggling services rather than giving them progressively more recovery time. Implementation typically pairs fixed intervals with jitter (randomized delay variation) to prevent retry synchronization across multiple clients.",
    problemSolved:
      "Some failure scenarios benefit from consistent, predictable retry timing rather than adaptive backoff strategies. When failures are caused by brief, random transient issues like network packet drops or momentary service unavailability, there's no benefit to increasing delays between retries—the service will recover based on its own timeline, not retry frequency. In these cases, exponential backoff's progressively longer delays unnecessarily extend total recovery time. Fixed interval retries ensure attempts happen at regular intervals, maximizing the chance of quick recovery when the transient issue resolves. Additionally, fixed intervals provide operational predictability: capacity planning can account for constant retry load, monitoring dashboards show steady retry rates, and SLA calculations use deterministic retry timings. The pattern is also simpler to implement and debug than sophisticated backoff algorithms, reducing complexity in systems where retry behavior doesn't significantly impact backend load.",
    tradeoffs: {
      pros: [
        "Simple implementation and easy to understand behavior",
        "Predictable retry timing for capacity planning and monitoring",
        "Fast recovery when transient issues resolve quickly",
        "No accumulating delays like exponential backoff",
        "Deterministic total retry duration for fixed attempt counts",
      ],
      cons: [
        "Maintains constant load on struggling services during outages",
        "Can contribute to retry storms if many clients retry simultaneously",
        "No adaptive behavior for different failure types or durations",
        "May waste resources retrying operations doomed to fail",
        "Lacks the graceful degradation of exponential backoff strategies",
      ],
    },
    relatedPatterns: [
      "retry",
      "exponential-backoff",
      "jitter",
      "circuit-breaker",
      "retry-budget",
      "linear-backoff",
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
      id: "fixed-interval-ts-basic",
      language: "typescript",
      title: "Fixed Interval Retry with Configurable Delay",
      description:
        "A retry mechanism that waits a constant duration between attempts, providing predictable retry behavior for transient failures with optional jitter to prevent thundering herd.",
      code: `// Fixed Interval Retry Implementation
// Constant delay between retry attempts for predictable behavior

type RetryableOperation<T> = () => Promise<T>;

interface RetryConfig {
  maxAttempts: number;
  intervalMs: number;
  jitterMs?: number; // Optional randomization to prevent thundering herd
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  attempts: number;
  totalTime: number;
  errors: Error[];
}

// Fixed interval retry executor
class FixedIntervalRetry {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig) {
    this.config = {
      maxAttempts: config.maxAttempts,
      intervalMs: config.intervalMs,
      jitterMs: config.jitterMs ?? 0,
      onRetry: config.onRetry ?? (() => {}),
    };
  }

  async execute<T>(operation: RetryableOperation<T>): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const errors: Error[] = [];
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      attempt++;

      try {
        console.log(\`[ATTEMPT \${attempt}/\${this.config.maxAttempts}] Executing...\`);

        const data = await operation();

        const totalTime = Date.now() - startTime;
        console.log(\`[SUCCESS] Completed on attempt \${attempt} (total: \${totalTime}ms)\`);

        return {
          success: true,
          data,
          attempts: attempt,
          totalTime,
          errors,
        };
      } catch (error) {
        const err = error as Error;
        errors.push(err);
        console.log(\`[FAILURE] Attempt \${attempt} failed: \${err.message}\`);

        // If this was the last attempt, don't wait
        if (attempt >= this.config.maxAttempts) {
          console.log(\`[EXHAUSTED] All \${this.config.maxAttempts} attempts failed\`);
          break;
        }

        // Calculate delay: fixed interval + optional jitter
        const jitter = this.config.jitterMs
          ? Math.random() * this.config.jitterMs
          : 0;
        const delay = this.config.intervalMs + jitter;

        console.log(\`[WAIT] Waiting \${Math.round(delay)}ms before retry...\`);

        // Notify callback
        this.config.onRetry(attempt, err);

        // Wait fixed interval before next attempt
        await this.sleep(delay);
      }
    }

    const totalTime = Date.now() - startTime;
    return {
      success: false,
      attempts: attempt,
      totalTime,
      errors,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Demo service with various failure modes
class UnreliableService {
  private callCount = 0;
  private readonly failureMode: "transient" | "sustained" | "intermittent";

  constructor(failureMode: "transient" | "sustained" | "intermittent") {
    this.failureMode = failureMode;
  }

  async fetch(): Promise<string> {
    this.callCount++;

    switch (this.failureMode) {
      case "transient":
        // Fails first 2 attempts, then succeeds
        if (this.callCount <= 2) {
          throw new Error("Network timeout");
        }
        return "Success: data retrieved";

      case "sustained":
        // Always fails (simulates outage)
        throw new Error("Service unavailable");

      case "intermittent":
        // Randomly fails 50% of the time
        if (Math.random() < 0.5) {
          throw new Error("Temporary glitch");
        }
        return "Success: data retrieved";

      default:
        return "Success: data retrieved";
    }
  }

  reset(): void {
    this.callCount = 0;
  }
}

// Helper function for creating retry operations
async function withFixedRetry<T>(
  operation: RetryableOperation<T>,
  config: RetryConfig
): Promise<RetryResult<T>> {
  const retry = new FixedIntervalRetry(config);
  return retry.execute(operation);
}

// Demo scenarios
async function demo() {
  console.log("\\n🔢 Fixed Interval Retry Demo\\n");

  // Scenario 1: Transient failure (recovers after 2 attempts)
  console.log("=== Scenario 1: Transient Failure ===");
  console.log("Service fails twice, then recovers\\n");

  const service1 = new UnreliableService("transient");
  const result1 = await withFixedRetry(() => service1.fetch(), {
    maxAttempts: 5,
    intervalMs: 500,
    onRetry: (attempt, error) => {
      console.log(\`  → Retry callback: attempt \${attempt}, error: \${error.message}\`);
    },
  });

  console.log("\\nResult:", {
    success: result1.success,
    attempts: result1.attempts,
    totalTime: \`\${result1.totalTime}ms\`,
  });

  // Scenario 2: With jitter to prevent thundering herd
  console.log("\\n\\n=== Scenario 2: Fixed Interval + Jitter ===");
  console.log("Adds randomization to prevent synchronized retries\\n");

  const service2 = new UnreliableService("transient");
  const result2 = await withFixedRetry(() => service2.fetch(), {
    maxAttempts: 5,
    intervalMs: 500,
    jitterMs: 200, // Add 0-200ms random jitter
  });

  console.log("\\nResult:", {
    success: result2.success,
    attempts: result2.attempts,
    totalTime: \`\${result2.totalTime}ms\`,
  });

  // Scenario 3: Sustained failure (service down)
  console.log("\\n\\n=== Scenario 3: Sustained Failure ===");
  console.log("Service is down, all retries fail\\n");

  const service3 = new UnreliableService("sustained");
  const result3 = await withFixedRetry(() => service3.fetch(), {
    maxAttempts: 3,
    intervalMs: 300,
  });

  console.log("\\nResult:", {
    success: result3.success,
    attempts: result3.attempts,
    totalTime: \`\${result3.totalTime}ms\`,
    errorCount: result3.errors.length,
  });

  // Scenario 4: Compare timing predictability
  console.log("\\n\\n=== Scenario 4: Predictable Timing ===");
  console.log("Fixed interval provides deterministic retry schedule\\n");

  const service4 = new UnreliableService("sustained");
  const config = { maxAttempts: 4, intervalMs: 400 };

  console.log(\`Configuration: \${config.maxAttempts} attempts, \${config.intervalMs}ms interval\`);
  console.log(
    \`Expected total time: ~\${(config.maxAttempts - 1) * config.intervalMs}ms (for delays)\`
  );
  console.log("Expected schedule: 0ms, 400ms, 800ms, 1200ms\\n");

  const result4 = await withFixedRetry(() => service4.fetch(), config);

  console.log(\`\\nActual total time: \${result4.totalTime}ms\`);
  console.log(
    "Notice how timing is predictable - ideal for capacity planning!"
  );

  // Scenario 5: Demonstrate use case - health check
  console.log("\\n\\n=== Scenario 5: Health Check Use Case ===");
  console.log("Fixed interval ideal for periodic health checks\\n");

  let healthCheckCount = 0;
  const healthCheck = async (): Promise<string> => {
    healthCheckCount++;
    console.log(\`[HEALTH CHECK \${healthCheckCount}] Checking service status...\`);

    if (healthCheckCount <= 2) {
      throw new Error("Service not ready");
    }
    return "Service healthy";
  };

  const result5 = await withFixedRetry(healthCheck, {
    maxAttempts: 5,
    intervalMs: 600,
  });

  console.log("\\n✅ Benefits of Fixed Interval:");
  console.log("  1. Simple to implement and understand");
  console.log("  2. Predictable retry schedule for monitoring");
  console.log("  3. Fast recovery when transient issues resolve");
  console.log("  4. Deterministic total time for fixed attempts");
  console.log("  5. Works well for brief, random failures");

  console.log("\\n⚠️  Drawbacks of Fixed Interval:");
  console.log("  1. Maintains pressure on struggling services");
  console.log("  2. Can cause retry storms without jitter");
  console.log("  3. No adaptive behavior for different failure types");
  console.log(
    "  4. May waste resources on operations destined to fail"
  );
}

// Run demo
demo().catch(console.error);`,
    },
  ],
};
