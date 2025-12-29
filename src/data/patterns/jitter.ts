import type { Pattern } from "../schema";

export const jitter: Pattern = {
  id: "jitter",
  slug: "jitter",
  corpusPath: "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retries → 🎲 Jitter",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retries",
    level: 4,
  },

  concept: {
    name: "Jitter",
    emoji: "🎲",
    tagline: "Randomize to prevent thundering herd",
    definition:
      "A retry technique that adds randomness to retry delays, preventing synchronized retry storms when multiple clients fail simultaneously.",
    problemSolved:
      "When many clients experience the same failure at the same time (e.g., service restart), synchronized retries create traffic spikes that can prevent recovery. Jitter randomizes retry timing to spread out the load.",
    tradeoffs: {
      pros: [
        "Prevents synchronized retry storms",
        "Smooths out traffic spikes during recovery",
        "Reduces load on recovering services",
        "Simple to implement alongside backoff",
      ],
      cons: [
        "Adds unpredictability to retry timing",
        "Some clients may retry sooner than optimal",
        "Requires careful tuning of jitter range",
        "Can complicate retry behavior debugging",
      ],
    },
    relatedPatterns: ["exponential-backoff", "retry", "circuit-breaker"],
  },

  structure: {
    participants: [
      {
        name: "Jitter Calculator",
        role: "Adds randomness to delays",
        responsibilities: [
          "Generate random value within configured range",
          "Apply jitter to base delay calculation",
          "Support different jitter strategies (full, equal, decorrelated)",
        ],
      },
      {
        name: "Retry Coordinator",
        role: "Manages retry attempts",
        responsibilities: [
          "Calculate base delay (often exponential)",
          "Apply jitter to delay",
          "Execute delayed retry",
        ],
      },
      {
        name: "Random Number Generator",
        role: "Provides randomness source",
        responsibilities: [
          "Generate cryptographically secure random numbers",
          "Ensure uniform distribution",
        ],
      },
    ],
    diagram: `graph TB
    Start([Retry Needed]) --> CalcBase[Calculate Base Delay<br/>e.g., 100 * 2^attempt]
    CalcBase --> JitterType{Jitter<br/>Strategy?}

    JitterType -->|Full| Full[delay = random(0, baseDelay)]
    JitterType -->|Equal| Equal[delay = baseDelay/2 + random(0, baseDelay/2)]
    JitterType -->|Decorrelated| Dec[delay = random(base, prevDelay * 3)]

    Full --> Wait[⏱️ Wait]
    Equal --> Wait
    Dec --> Wait
    Wait --> Retry([Retry Operation])

    style Start fill:#e1f5e1
    style Retry fill:#e1f5e1
    style Wait fill:#fff4e1
    style JitterType fill:#e1e5ff
    style CalcBase fill:#ffe1f5`,
    flow: [
      {
        step: 1,
        actor: "Retry Coordinator",
        action: "Calculate Base Delay",
        description:
          "Determine delay using strategy (e.g., exponential backoff)",
      },
      {
        step: 2,
        actor: "Jitter Calculator",
        action: "Select Jitter Strategy",
        description: "Choose between Full, Equal, or Decorrelated jitter",
      },
      {
        step: 3,
        actor: "Random Number Generator",
        action: "Generate Random Value",
        description: "Create random number within strategy-specific range",
      },
      {
        step: 4,
        actor: "Jitter Calculator",
        action: "Apply Jitter",
        description: "Combine base delay with random jitter",
      },
      {
        step: 5,
        actor: "Retry Coordinator",
        action: "Wait",
        description: "Sleep for jittered delay duration",
      },
    ],
    invariants: [
      "Jitter must use cryptographically secure randomness",
      "Final delay must remain within reasonable bounds",
      "Jitter must not reduce delay below minimum threshold",
      "Random distribution must be uniform to prevent clustering",
    ],
  },

  codeExamples: [
    {
      id: "jitter-ts-strategies",
      language: "typescript",
      title: "Retry with Jitter Strategies",
      description:
        "Implementation of Full, Equal, and Decorrelated jitter strategies for retry delays",
      code: `type JitterStrategy = "full" | "equal" | "decorrelated";

interface JitterConfig {
  strategy: JitterStrategy;
  baseDelayMs: number;
  maxDelayMs: number;
}

class RetryJitter {
  private lastDelay = 0;

  constructor(private config: JitterConfig) {}

  calculateDelay(attempt: number): number {
    const { strategy, baseDelayMs, maxDelayMs } = this.config;
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

    let delay: number;

    switch (strategy) {
      case "full":
        // Full jitter: random between 0 and exponential delay
        // Most aggressive spread, can be very short
        delay = Math.random() * exponentialDelay;
        break;

      case "equal":
        // Equal jitter: half base + random half
        // Balances minimum delay with randomness
        delay = exponentialDelay / 2 + Math.random() * (exponentialDelay / 2);
        break;

      case "decorrelated":
        // Decorrelated jitter: random between base and 3x last delay
        // Smooths out spikes over time
        const decorrelatedMax = Math.max(baseDelayMs, this.lastDelay * 3);
        delay = baseDelayMs + Math.random() * (decorrelatedMax - baseDelayMs);
        this.lastDelay = delay;
        break;
    }

    return Math.min(delay, maxDelayMs);
  }
}

async function retryWithJitter<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  jitterConfig: JitterConfig
): Promise<T> {
  const jitter = new RetryJitter(jitterConfig);
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw new Error(\`Failed after \${maxRetries} retries: \${lastError.message}\`);
      }

      const delayMs = jitter.calculateDelay(attempt);
      console.log(\`Attempt \${attempt + 1} failed. Retrying in \${delayMs.toFixed(0)}ms...\`);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}

// Usage example
const result = await retryWithJitter(
  () => fetchData("/api/users"),
  5,
  {
    strategy: "equal",      // Balanced jitter
    baseDelayMs: 100,
    maxDelayMs: 10000,
  }
);`,
      runnable: true,
    },
  ],
};
