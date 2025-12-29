import type { Pattern } from "../schema";

export const exponentialBackoff: Pattern = {
  id: "exponential-backoff",
  slug: "exponential-backoff",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retries → 📈 Exponential Backoff",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retries",
    level: 4,
  },

  concept: {
    name: "Exponential Backoff",
    emoji: "📈",
    tagline: "Increasing delays between retries",
    definition:
      "Exponential Backoff is a retry strategy that progressively increases wait time between consecutive retry attempts using exponential growth (delay = baseDelay × 2^attemptNumber), transforming aggressive retry patterns into gradually spaced attempts that give failing systems time to recover. Instead of retrying every second indefinitely (1s, 1s, 1s...), exponential backoff spaces retries at exponentially increasing intervals (1s, 2s, 4s, 8s, 16s...). This mathematical progression serves two critical purposes: it reduces load on struggling systems (fewer retries per time unit as attempts increase), and it implements adaptive behavior that responds to sustained failures by backing off more aggressively. The pattern is fundamental to distributed systems resilience—every major cloud provider's API client library implements it by default. Exponential backoff prevents retry storms where thousands of clients hammer a failing service with constant retry traffic, consuming resources that could otherwise be used for recovery. The strategy assumes that if a service hasn't recovered after multiple retries, it's experiencing a sustained outage rather than a transient failure, justifying longer waits. Most implementations cap the maximum delay (e.g., 60s) to prevent unbounded waits and combine backoff with jitter (randomness) to prevent synchronized retry waves. Exponential backoff is essential for fault-tolerant systems, particularly in scenarios with transient failures (network glitches, temporary overload, brief service restarts) where immediate retries often succeed, but sustained failures require graceful degradation to avoid overwhelming the failing component.",
    problemSolved:
      "Failed operations create a dilemma: retry too aggressively and you overwhelm the failing system preventing recovery; retry too conservatively and you miss transient failures that could succeed immediately. Constant retry intervals (fixed backoff) amplify this problem—a service experiencing temporary overload receives the same retry pressure regardless of failure duration, making recovery impossible. Consider a database connection pool exhausted at 100 connections: if 100 clients retry every 1s, the database receives 100 connection attempts per second indefinitely, consuming CPU cycles rejecting connections instead of serving existing requests. The constant pressure prevents the pool from freeing connections, perpetuating the outage. Exponential backoff solves this by adapting retry frequency to failure duration: transient failures (resolved in <1s) succeed on first or second retry with minimal delay, while sustained failures (lasting minutes) encounter progressively longer delays that reduce load on the struggling system. After 10 retry attempts with 100ms base delay, exponential backoff waits 102s between attempts—a 1000x reduction from the initial 100ms. This dramatic load reduction allows the failing system to allocate resources to recovery instead of rejecting retries. The pattern also prevents cascading failures: when Service A depends on Service B, and B fails, exponential backoff in A prevents A from failing due to exhausted retry resources, preserving overall system stability. Without exponential backoff, retry logic itself becomes a denial-of-service attack against failing dependencies.",
    tradeoffs: {
      pros: [
        "Reduces load on failing systems",
        "Prevents thundering herd problem",
        "Allows graceful recovery time",
        "Self-regulating under high load",
      ],
      cons: [
        "Increases latency for legitimate transient failures",
        "May wait too long for quick recoveries",
        "Requires tuning of base delay and multiplier",
        "Can lead to very long waits without max cap",
      ],
    },
    relatedPatterns: ["retry", "jitter", "circuit-breaker", "timeout"],
  },

  structure: {
    participants: [
      {
        name: "Retry Coordinator",
        role: "Orchestrates retry attempts",
        responsibilities: [
          "Track current retry attempt number",
          "Calculate exponential delay based on attempt",
          "Enforce maximum retry limit",
          "Manage delay between attempts",
        ],
      },
      {
        name: "Delay Calculator",
        role: "Computes backoff duration",
        responsibilities: [
          "Apply exponential function: delay = base * (2 ^ attempt)",
          "Enforce maximum delay cap",
          "Return wait duration for current attempt",
        ],
      },
      {
        name: "Operation Executor",
        role: "Performs the actual operation",
        responsibilities: [
          "Execute the target operation",
          "Report success or failure",
          "Propagate final result or error",
        ],
      },
    ],
    diagram: `graph TB
    Start([Attempt Operation]) --> Try[Execute Operation]
    Try --> Success{Success?}
    Success -->|Yes| Return([Return Result])
    Success -->|No| CheckMax{Max Retries<br/>Reached?}
    CheckMax -->|Yes| Fail([Throw Error])
    CheckMax -->|No| Calc[Calculate Delay<br/>base * 2^attempt]
    Calc --> Cap[Apply Max Cap]
    Cap --> Wait[⏱️ Wait]
    Wait --> Inc[Increment Attempt]
    Inc --> Try

    style Start fill:#e1f5e1
    style Return fill:#e1f5e1
    style Fail fill:#ffe1e1
    style Wait fill:#fff4e1
    style Calc fill:#e1e5ff`,
    flow: [
      {
        step: 1,
        actor: "Retry Coordinator",
        action: "Initialize",
        description: "Set attempt counter to 0",
      },
      {
        step: 2,
        actor: "Operation Executor",
        action: "Execute",
        description: "Attempt the operation",
      },
      {
        step: 3,
        actor: "Retry Coordinator",
        action: "Check Result",
        description:
          "If success, return result. If failure and under retry limit, continue",
      },
      {
        step: 4,
        actor: "Delay Calculator",
        action: "Calculate Delay",
        description:
          "Compute delay = baseDelay * (2 ^ attemptNumber), capped at maxDelay",
      },
      {
        step: 5,
        actor: "Retry Coordinator",
        action: "Wait",
        description: "Sleep for the calculated delay duration",
      },
      {
        step: 6,
        actor: "Retry Coordinator",
        action: "Retry",
        description: "Increment attempt counter and go to step 2",
      },
    ],
    invariants: [
      "Delay must increase exponentially with each attempt",
      "Delay must be capped at a maximum value",
      "Retry attempts must not exceed configured maximum",
      "First retry should use base delay (2^0 = 1x multiplier)",
    ],
  },

  codeExamples: [
    {
      id: "exp-backoff-ts-basic",
      language: "typescript",
      title: "Exponential Backoff Retry Implementation",
      description:
        "TypeScript implementation of exponential backoff with configurable base delay, max retries, and delay cap",
      code: `async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  }
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = options;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw new Error(
          \`Operation failed after \${maxRetries} retries: \${lastError.message}\`
        );
      }

      // Calculate exponential delay: base * 2^attempt
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const delayMs = Math.min(exponentialDelay, maxDelayMs);

      console.log(
        \`Attempt \${attempt + 1} failed. Retrying in \${delayMs}ms...\`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}

// Usage example
async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(\`/api/users/\${userId}\`);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  return response.json();
}

const user = await retryWithExponentialBackoff(
  () => fetchUserData("123"),
  {
    maxRetries: 5,
    baseDelayMs: 100,    // 100ms, 200ms, 400ms, 800ms, 1600ms
    maxDelayMs: 10000,   // Cap at 10 seconds
  }
);`,
      runnable: true,
      contextDilation: {
        scope: "module",
        systemPosition:
          "Retry coordination layer wrapping external service calls. Typically implemented in HTTP client middleware, database connection logic, or message queue consumers.",
        zoomLevels: [
          "Micro: Single exponential delay calculation for one retry attempt",
          "Local: Retry loop managing multiple attempts with backoff",
          "Module: Reusable retry wrapper applied across service boundaries",
          "System: Organization-wide retry policy enforced in API gateways or service mesh",
        ],
        prerequisites: [
          "Understanding of exponential growth mathematics (2^n)",
          "Knowledge of transient vs sustained failures",
          "Familiarity with retry semantics and idempotency",
        ],
      },
      annotations: [
        {
          id: "exp-backoff-calculation",
          lines: [23, 24],
          action: "Calculate exponential delay and apply maximum cap",
          reason:
            "Exponential growth (base × 2^attempt) creates the backoff curve: 100ms, 200ms, 400ms, 800ms, 1600ms. Without a cap, delays become impractical (attempt 20 = 104 days). The cap (default 10s) bounds worst-case latency while preserving exponential progression for early attempts. Cap also prevents integer overflow in delay calculations.",
          contextLevel: "local",
          relatedConcepts: ["exponential-growth", "bounded-retry"],
        },
        {
          id: "exp-backoff-retry-loop",
          lines: [10, 33],
          action:
            "Iterate through retry attempts with increasing delays between each",
          reason:
            "The for-loop structure (0 to maxRetries) allows first attempt without delay (attempt 0), then applies backoff for subsequent attempts. Early return on success avoids unnecessary waits. Storing lastError ensures final error propagation includes context from last failure, not an arbitrary intermediate one. The loop embodies the retry policy: try, fail, wait (exponentially), repeat.",
          contextLevel: "module",
          relatedConcepts: ["retry-loop", "error-propagation"],
        },
        {
          id: "exp-backoff-immediate-first-try",
          lines: [11, 12],
          action: "Attempt operation immediately on first try (attempt = 0)",
          reason:
            "First attempt has no delay because many transient failures resolve instantly (network blip, momentary CPU spike). Immediate first retry maximizes responsiveness for these common cases. Only after first failure do we assume the problem may persist, triggering exponential delays. This optimizes for the happy path while protecting against sustained failures.",
          contextLevel: "local",
          relatedConcepts: ["transient-failure", "fast-path"],
        },
      ],
      highlights: [
        {
          id: "exp-backoff-exponential-formula",
          lines: [23],
          domain: "structure",
          title: "Exponential Growth Formula",
          explanation:
            "The formula baseDelayMs × 2^attempt creates exponential progression. With baseDelay=100ms: attempt 0=100ms, 1=200ms, 2=400ms, 3=800ms, 4=1600ms, 5=3200ms. This doubling pattern is the mathematical foundation of exponential backoff, balancing quick retries for transient failures with increasingly cautious delays for sustained outages.",
        },
        {
          id: "exp-backoff-max-cap",
          lines: [24],
          domain: "philosophy",
          title: "Maximum Delay Cap",
          explanation:
            "The min() cap prevents exponential growth from creating unusably long delays. Without it, attempt 20 yields 104 million ms (29 hours). The cap (10s default) represents a philosophy: after waiting 10s between retries, the system is clearly experiencing sustained failure, and longer delays don't improve recovery odds—they just delay error reporting to users.",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement:
      "Exponential backoff is implemented at service boundaries where external dependencies are called: HTTP client libraries (axios, fetch wrappers), database drivers, message queue consumers, and cloud SDK clients. It sits between application logic and I/O operations, transparently adding retry resilience without modifying business code. In layered architectures, backoff lives in the infrastructure/adapter layer, not the domain layer.",
    architecturalBoundaries: [
      "HTTP Clients: Axios interceptors, fetch wrappers, REST client middleware",
      "Database: Connection pool retry logic, ORM query retry policies",
      "Message Queues: Consumer retry configuration (Kafka, RabbitMQ, SQS)",
      "Service Mesh: Envoy/Istio retry policies with exponential backoff timings",
      "Cloud SDKs: AWS SDK, Google Cloud Client Libraries (built-in backoff)",
    ],
    interactsWith: [
      "retry",
      "jitter",
      "timeout",
      "circuit-breaker",
      "idempotency",
    ],
  },
};
