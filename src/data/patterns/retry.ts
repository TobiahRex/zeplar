import type { Pattern } from "../schema";

export const retry: Pattern = {
  id: "retry",
  slug: "retry",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Retry Strategies",
    level: 4,
  },

  concept: {
    name: "Retry",
    emoji: "🔄",
    tagline: "Try again with patience",
    definition:
      "A pattern that automatically re-attempts failed operations, typically with configurable delays and backoff strategies, to handle transient failures.",
    problemSolved:
      "Transient failures (network blips, temporary overload, brief outages) often resolve quickly. Immediate failure wastes the opportunity to succeed with a simple retry.",
    tradeoffs: {
      pros: [
        "Handles transient failures automatically",
        "Simple to implement and understand",
        "Improves perceived reliability",
        "Works well with idempotent operations",
      ],
      cons: [
        "Can amplify load on struggling services",
        "Adds latency for ultimately failing requests",
        "Requires idempotent operations for safety",
        "Without limits, can cause retry storms",
      ],
    },
    relatedPatterns: ["circuit-breaker", "timeout", "idempotency", "backoff"],
  },

  structure: {
    participants: [
      {
        name: "Retry Handler",
        role: "Coordinator",
        responsibilities: [
          "Execute the operation",
          "Detect retryable failures",
          "Apply delay/backoff between attempts",
          "Track attempt count and enforce limits",
        ],
      },
      {
        name: "Operation",
        role: "Protected Action",
        responsibilities: [
          "Execute the actual work",
          "Throw retryable or non-retryable exceptions",
        ],
      },
      {
        name: "Backoff Strategy",
        role: "Delay Calculator",
        responsibilities: [
          "Calculate delay between retry attempts",
          "May add jitter to prevent thundering herd",
        ],
      },
    ],
    diagram: `flowchart TD
    A[Execute Operation] --> B{Success?}
    B -->|Yes| C[Return Result]
    B -->|No| D{Retryable Error?}
    D -->|No| E[Throw Error]
    D -->|Yes| F{Attempts < Max?}
    F -->|No| E
    F -->|Yes| G[Wait with Backoff]
    G --> A`,
    flow: [
      {
        step: 1,
        actor: "Retry Handler",
        action: "Execute",
        description: "Attempt the operation",
      },
      {
        step: 2,
        actor: "Retry Handler",
        action: "Evaluate",
        description: "Check if operation succeeded or failed",
      },
      {
        step: 3,
        actor: "Retry Handler",
        action: "Classify",
        description: "Determine if failure is retryable (e.g., 503 vs 400)",
      },
      {
        step: 4,
        actor: "Backoff Strategy",
        action: "Calculate Delay",
        description: "Compute wait time before next attempt",
      },
      {
        step: 5,
        actor: "Retry Handler",
        action: "Wait & Retry",
        description: "Sleep for delay duration, then loop back to step 1",
      },
    ],
    invariants: [
      "Total attempts must not exceed configured maximum",
      "Non-retryable errors must fail immediately",
      "Backoff delay should increase with each attempt",
      "Operations should be idempotent for safe retry",
    ],
  },

  codeExamples: [
    {
      id: "retry-typescript-exponential",
      language: "typescript",
      title: "Exponential Backoff Retry",
      description:
        "Retry with exponential backoff and jitter to handle transient failures",
      code: `interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  isRetryable: (error: unknown) => boolean = () => true
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === config.maxAttempts) {
        throw error;
      }

      const delay = calculateBackoff(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError;
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  // Exponential: baseDelay * 2^(attempt-1)
  let delay = config.baseDelay * Math.pow(2, attempt - 1);

  // Cap at maximum
  delay = Math.min(delay, config.maxDelay);

  // Add jitter to prevent thundering herd
  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return delay;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}`,
      runnable: true,
      contextDilation: {
        level: "local",
        scope: "A reusable retry utility function with exponential backoff",
        prerequisites: ["Async/await", "Error handling", "Exponential math"],
        systemPosition:
          "Utility function called by service layer or HTTP clients",
      },
      annotations: [
        {
          id: "retry-loop",
          lines: [14, 26],
          action: "Attempt operation up to maxAttempts times",
          reason:
            "Bounded retries prevent infinite loops while giving transient failures multiple chances to resolve",
          contextLevel: "local",
        },
        {
          id: "retry-check",
          lines: [20, 22],
          action: "Check if error is retryable and attempts remain",
          reason:
            "Non-retryable errors (e.g., 400 Bad Request) should fail immediately; exhausted retries should propagate the error",
          contextLevel: "local",
          relatedConcepts: ["fail-fast"],
        },
        {
          id: "backoff-calc",
          lines: [31, 33],
          action: "Calculate exponential delay: baseDelay * 2^(attempt-1)",
          reason:
            "Exponential growth gives the failing service progressively more time to recover between attempts",
          contextLevel: "micro",
          relatedConcepts: ["exponential-backoff"],
        },
        {
          id: "jitter",
          lines: [39, 41],
          action: "Add random jitter to the delay",
          reason:
            "Jitter prevents thundering herd: if many clients retry at exactly the same time, they would all hit the service simultaneously",
          contextLevel: "system",
          relatedConcepts: ["thundering-herd"],
        },
      ],
      highlights: [
        {
          lines: [14, 26],
          label: "Retry loop with bounded attempts",
          sbvpDomain: "behavior",
        },
        {
          lines: [31, 41],
          label: "Backoff calculation with jitter",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client",
      "Service Layer",
      "Message Consumer",
      "Database Connection Pool",
    ],
    interactsWith: [
      "circuit-breaker",
      "timeout",
      "idempotency-key",
      "fallback",
    ],
    architecturalBoundaries: [
      "Network calls",
      "Database operations",
      "External API integrations",
      "Message queue publishing",
    ],
  },

  implementations: [
    {
      id: "axios-retry",
      name: "axios-retry",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Axios plugin that intercepts failed requests and retries them",
      links: {
        github: "https://github.com/softonic/axios-retry",
        npm: "https://www.npmjs.com/package/axios-retry",
      },
    },
    {
      id: "tenacity",
      name: "Tenacity",
      type: "library",
      languages: ["python"],
      description: "General-purpose retrying library for Python",
      links: {
        docs: "https://tenacity.readthedocs.io/",
        github: "https://github.com/jd/tenacity",
      },
    },
    {
      id: "spring-retry",
      name: "Spring Retry",
      type: "library",
      languages: ["java"],
      description: "Declarative retry support for Spring applications",
      links: {
        docs: "https://docs.spring.io/spring-retry/docs/current/reference/html/",
        github: "https://github.com/spring-projects/spring-retry",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "aws",
      systemName: "AWS SDKs",
      howUsed:
        "All AWS SDKs implement exponential backoff with jitter for API calls to handle throttling and transient errors",
      source: "https://docs.aws.amazon.com/general/latest/gr/api-retries.html",
    },
    {
      systemId: "stripe",
      systemName: "Stripe",
      howUsed:
        "Stripe SDKs automatically retry failed requests with exponential backoff for network errors and rate limits",
      source: "https://stripe.com/docs/error-handling",
    },
  ],

  philosophy: {
    coreProblem:
      "Networks are unreliable and services experience transient failures that resolve quickly on their own",
    designPrinciple:
      "Assume temporary failures are common and design operations to be safely repeatable",
    historicalContext:
      "Retry logic became essential with the rise of distributed systems and network-based computing in the 1990s",
    alternativesRejected: [
      "Immediate failure - misses easy wins from transient issues",
      "Infinite retries - can overwhelm services and waste resources",
      "Fixed delays - can cause retry storms or be inefficient",
    ],
    mentalModel:
      "Like redialing a busy phone number—you wait a bit longer each time, and you eventually give up rather than trying forever",
  },

  visualization: {
    staticDiagram: `flowchart TD
    A[Request] --> B{Success?}
    B -->|Yes| C[Done]
    B -->|No| D{Can Retry?}
    D -->|No| E[Fail]
    D -->|Yes| F[Wait]
    F --> A`,
    realWorldAnalogy:
      "Retry is like trying to get through to customer service. If the line is busy, you wait a bit and call back. Each time you wait a little longer. Eventually, you either get through or give up after too many tries.",
    useCases: [
      {
        domain: "Payments",
        scenario:
          "A payment gateway returns a 503 during high load. The retry mechanism waits 100ms, then 200ms, then 400ms before succeeding on the third attempt.",
        patternRole:
          "Converts a user-visible failure into a slightly delayed success",
        companies: ["Stripe", "Square"],
      },
      {
        domain: "Cloud Infrastructure",
        scenario:
          "An S3 upload fails due to a network blip. The AWS SDK automatically retries with exponential backoff, succeeding on the second attempt.",
        patternRole:
          "Makes cloud APIs appear more reliable than the underlying network",
        companies: ["AWS", "Google Cloud", "Azure"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "resilience",
    "backoff",
    "transient-failures",
  ],
  difficulty: "beginner",
};
