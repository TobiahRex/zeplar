import type { Pattern } from "../schema";

export const timeout: Pattern = {
  id: "timeout",
  slug: "timeout",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Timeouts",
    level: 4,
  },

  concept: {
    name: "Timeout",
    emoji: "⏱️",
    tagline: "Bound the wait, free the resources",
    definition:
      "A pattern that sets a maximum time limit for operations to complete, preventing indefinite waits and ensuring resources are released even when dependencies hang.",
    problemSolved:
      "Without timeouts, a slow or unresponsive dependency can cause requests to hang indefinitely, consuming threads, connections, and memory while users wait forever.",
    tradeoffs: {
      pros: [
        "Prevents resource exhaustion from hanging operations",
        "Provides predictable maximum latency",
        "Frees resources for other requests",
        "Enables faster failure detection",
      ],
      cons: [
        "May abort operations that would have succeeded",
        "Requires careful tuning per operation type",
        "Can cause partial operations if not combined with transactions",
        "Too aggressive timeouts increase false failures",
      ],
    },
    relatedPatterns: [
      "retry",
      "circuit-breaker",
      "deadline-propagation",
      "bulkhead",
    ],
  },

  structure: {
    participants: [
      {
        name: "Timeout Handler",
        role: "Time Enforcer",
        responsibilities: [
          "Start timer when operation begins",
          "Cancel or abort if time exceeds limit",
          "Return timeout error to caller",
        ],
      },
      {
        name: "Operation",
        role: "Timed Task",
        responsibilities: [
          "Execute the actual work",
          "Support cancellation if possible",
          "Complete before timeout expires",
        ],
      },
      {
        name: "Client",
        role: "Caller",
        responsibilities: [
          "Handle timeout errors appropriately",
          "Decide whether to retry or fail",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant T as Timeout Handler
    participant S as Service

    C->>T: Request (timeout: 5s)
    T->>S: Forward request
    T->>T: Start timer

    alt Response within timeout
        S-->>T: Response
        T-->>C: Response
    else Timeout exceeded
        T-->>C: TimeoutError
        Note over T,S: Connection may be abandoned
    end`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Initiate Request",
        description: "Client makes request with specified timeout",
      },
      {
        step: 2,
        actor: "Timeout Handler",
        action: "Start Timer",
        description: "Begin countdown and forward request to service",
      },
      {
        step: 3,
        actor: "Service",
        action: "Process",
        description: "Service processes the request (may be slow)",
      },
      {
        step: 4,
        actor: "Timeout Handler",
        action: "Evaluate",
        description:
          "Return response if received, or TimeoutError if timer expires",
      },
    ],
    invariants: [
      "Operation must complete or abort within timeout period",
      "Timeout value must be greater than zero",
      "Resources must be released on timeout",
      "Timeout errors must be distinguishable from other errors",
    ],
  },

  codeExamples: [
    {
      id: "timeout-typescript",
      language: "typescript",
      title: "Promise-based Timeout Wrapper",
      description: "A utility that wraps any promise with a timeout",
      code: `class TimeoutError extends Error {
  constructor(ms: number) {
    super(\`Operation timed out after \${ms}ms\`);
    this.name = 'TimeoutError';
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Set up the timeout
    const timer = setTimeout(() => {
      reject(new TimeoutError(ms));
    }, ms);

    // Set up abort signal handling
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });

    // Race the promise against the timeout
    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Usage
const controller = new AbortController();

try {
  const data = await withTimeout(
    fetch('/api/slow-endpoint', { signal: controller.signal }),
    5000
  );
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log('Request timed out, retrying...');
  }
}`,
      runnable: true,
      contextDilation: {
        level: "local",
        scope: "A reusable timeout wrapper for any Promise",
        prerequisites: ["Promises", "setTimeout", "AbortController"],
        systemPosition:
          "Utility function used by HTTP clients and service calls",
      },
      annotations: [
        {
          id: "timeout-error",
          lines: [1, 6],
          action: "Define a custom TimeoutError class",
          reason:
            "Allows callers to distinguish timeout failures from other errors",
          contextLevel: "local",
        },
        {
          id: "timeout-timer",
          lines: [14, 17],
          action: "Start a timer that rejects after ms milliseconds",
          reason:
            "This is the enforcement mechanism—if the promise does not settle in time, we reject",
          contextLevel: "local",
        },
        {
          id: "timeout-abort",
          lines: [20, 23],
          action: "Listen for abort signal to cancel early",
          reason:
            "Allows external cancellation (e.g., user navigates away) to clean up the timeout",
          contextLevel: "local",
          relatedConcepts: ["abort-controller", "cancellation"],
        },
        {
          id: "timeout-cleanup",
          lines: [26, 33],
          action: "Clear timer when promise settles",
          reason:
            "Prevents timer from firing after the promise has already resolved or rejected",
          contextLevel: "micro",
        },
      ],
      highlights: [
        {
          lines: [14, 17],
          label: "Timeout enforcement",
          sbvpDomain: "behavior",
        },
        {
          lines: [26, 33],
          label: "Cleanup on completion",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client",
      "Database Queries",
      "RPC Calls",
      "Message Queue Consumers",
    ],
    interactsWith: [
      "retry",
      "circuit-breaker",
      "deadline-propagation",
      "bulkhead",
    ],
    architecturalBoundaries: [
      "Service-to-service calls",
      "External API integrations",
      "Database connections",
      "User-facing request handling",
    ],
  },

  implementations: [
    {
      id: "axios-timeout",
      name: "Axios timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description: "Built-in timeout option for HTTP requests",
      links: {
        docs: "https://axios-http.com/docs/req_config",
        github: "https://github.com/axios/axios",
      },
    },
    {
      id: "context-timeout",
      name: "Go context.WithTimeout",
      type: "library",
      languages: ["go"],
      description: "Context-based timeout propagation in Go stdlib",
      links: {
        docs: "https://pkg.go.dev/context#WithTimeout",
      },
    },
    {
      id: "asyncio-timeout",
      name: "Python asyncio.timeout",
      type: "library",
      languages: ["python"],
      description: "Async context manager for timeouts",
      links: {
        docs: "https://docs.python.org/3/library/asyncio-task.html#asyncio.timeout",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "google",
      systemName: "Google",
      howUsed:
        "gRPC deadline propagation ensures timeouts cascade through the entire call chain",
      source: "https://grpc.io/docs/guides/deadlines/",
    },
    {
      systemId: "aws",
      systemName: "AWS",
      howUsed:
        "Lambda functions have configurable timeouts (max 15 minutes) to prevent runaway executions",
    },
  ],

  philosophy: {
    coreProblem:
      "Network calls can hang indefinitely, holding resources hostage and leaving users waiting forever",
    designPrinciple:
      "Always bound the time you are willing to wait; fail fast rather than fail slow",
    historicalContext:
      "Timeouts became critical with distributed systems where network partitions and slow services are common",
    alternativesRejected: [
      "No timeout - can hang forever, exhausting resources",
      "Very long timeout - slow failure detection, poor UX",
      "Very short timeout - high false positive rate",
    ],
    mentalModel:
      "Like a cooking timer: if the dish is not ready when it rings, you check on it rather than waiting indefinitely for it to cook itself",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    Client->>Service: Request
    Note right of Service: Processing...
    Note right of Service: Still processing...
    Client--xService: TIMEOUT (5s)
    Client->>Client: Handle timeout`,
    realWorldAnalogy:
      'A timeout is like telling a waiter "If my food is not here in 20 minutes, I am leaving." You set a limit on how long you are willing to wait, and take action when that limit is exceeded.',
    useCases: [
      {
        domain: "Web Applications",
        scenario:
          'A user clicks "Submit Order" but the payment service is slow. A 10-second timeout ensures they see an error rather than staring at a spinner for minutes.',
        patternRole:
          "Provides predictable user experience even when backends are slow",
        companies: ["Stripe", "Square"],
      },
      {
        domain: "Microservices",
        scenario:
          "Service A calls Service B, which calls Service C. Deadline propagation ensures the entire chain times out together, not just one hop.",
        patternRole:
          "Enables coordinated timeout behavior across service boundaries",
        companies: ["Google", "Uber"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "latency",
    "resource-management",
    "resilience",
  ],
  difficulty: "beginner",
};
