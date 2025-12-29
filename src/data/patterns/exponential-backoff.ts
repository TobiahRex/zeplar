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
      "A retry strategy that progressively increases the wait time between retry attempts using exponential growth, preventing system overload during failures.",
    problemSolved:
      "When services fail, immediate retries can overwhelm the failing system and prevent recovery. Exponential backoff spaces out retries to give systems time to recover while still attempting to restore service.",
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
    },
  ],
};
