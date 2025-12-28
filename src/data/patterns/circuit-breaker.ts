import type { Pattern } from "../schema";

export const circuitBreaker: Pattern = {
  id: "circuit-breaker",
  slug: "circuit-breaker",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Circuit Breakers",
    level: 4,
  },

  concept: {
    name: "Circuit Breaker",
    emoji: "🔌",
    tagline: "Fail fast to recover faster",
    definition:
      "A pattern that prevents cascading failures by wrapping calls to external services and failing fast when the service is unhealthy, allowing time for recovery.",
    problemSolved:
      "When a downstream service fails, repeated calls waste resources and can cascade failures throughout the system. The Circuit Breaker detects failures and stops making calls temporarily.",
    tradeoffs: {
      pros: [
        "Prevents cascading failures across services",
        "Allows failing services time to recover",
        "Provides fast failure instead of slow timeouts",
        "Enables graceful degradation",
      ],
      cons: [
        "Adds complexity to service calls",
        "Requires tuning of thresholds and timeouts",
        "Can mask underlying issues if not monitored",
        "May reject valid requests during recovery",
      ],
    },
    relatedPatterns: ["retry", "bulkhead", "timeout", "fallback"],
  },

  structure: {
    participants: [
      {
        name: "Circuit Breaker",
        role: "State Machine",
        responsibilities: [
          "Track failure count and success rate",
          "Manage state transitions (Closed → Open → Half-Open)",
          "Decide whether to allow or reject requests",
        ],
      },
      {
        name: "Protected Resource",
        role: "Downstream Service",
        responsibilities: [
          "Process requests when healthy",
          "May fail or timeout when unhealthy",
        ],
      },
      {
        name: "Client",
        role: "Caller",
        responsibilities: [
          "Make requests through the circuit breaker",
          "Handle both successful responses and circuit open rejections",
        ],
      },
    ],
    diagram: `stateDiagram-v2
    [*] --> Closed
    Closed --> Open: Failure threshold exceeded
    Open --> HalfOpen: Timeout expires
    HalfOpen --> Closed: Probe succeeds
    HalfOpen --> Open: Probe fails
    Closed --> Closed: Success / Failure under threshold`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request",
        description: "Client initiates a call to the protected resource",
      },
      {
        step: 2,
        actor: "Circuit Breaker",
        action: "Check State",
        description:
          "If OPEN, reject immediately. If CLOSED or HALF-OPEN, proceed.",
      },
      {
        step: 3,
        actor: "Circuit Breaker",
        action: "Forward Request",
        description: "Pass request to the protected resource",
      },
      {
        step: 4,
        actor: "Protected Resource",
        action: "Process",
        description: "Execute the operation (may succeed or fail)",
      },
      {
        step: 5,
        actor: "Circuit Breaker",
        action: "Record Result",
        description:
          "Update failure/success counters and potentially transition state",
      },
    ],
    invariants: [
      "Failure count resets to zero when circuit closes",
      "Only one probe request allowed in HALF-OPEN state",
      "Open duration must be configurable",
      "Failure threshold must be configurable",
    ],
  },

  codeExamples: [
    {
      id: "cb-typescript-basic",
      language: "typescript",
      title: "Basic Circuit Breaker Implementation",
      description:
        "A simple circuit breaker with configurable thresholds and timeout",
      code: `type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: number;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - (this.lastFailureTime ?? 0) >= this.config.resetTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope: "Complete circuit breaker class managing state transitions",
        prerequisites: ["TypeScript classes", "Async/await", "State machines"],
        systemPosition:
          "Wraps outbound HTTP calls in service layer or API gateway",
      },
      annotations: [
        {
          id: "cb-state-type",
          lines: [1, 1],
          action: "Define the three possible circuit states",
          reason:
            "State machine requires explicit states to track circuit health",
          contextLevel: "local",
          relatedConcepts: ["state-machine"],
        },
        {
          id: "cb-state-check",
          lines: [15, 21],
          action: "Check if circuit is OPEN and decide whether to probe",
          reason:
            "OPEN circuit rejects immediately unless timeout has passed, then transitions to HALF_OPEN for a probe",
          contextLevel: "module",
          relatedConcepts: ["fail-fast", "graceful-degradation"],
        },
        {
          id: "cb-try-catch",
          lines: [23, 31],
          action: "Execute the protected call and handle result",
          reason:
            "Success resets failure tracking; failure increments counter and may trip the circuit",
          contextLevel: "local",
        },
        {
          id: "cb-threshold-check",
          lines: [43, 45],
          action: "Trip circuit to OPEN if failures exceed threshold",
          reason:
            "Prevents further calls to unhealthy service, giving it time to recover",
          contextLevel: "module",
          relatedConcepts: ["cascading-failure"],
        },
      ],
      highlights: [
        {
          lines: [1, 1],
          label: "State definition",
          sbvpDomain: "structure",
        },
        {
          lines: [15, 21],
          label: "State transition logic",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "API Gateway",
      "Service Layer",
      "HTTP Client Wrapper",
      "Message Queue Consumer",
    ],
    interactsWith: ["retry", "timeout", "bulkhead", "fallback"],
    architecturalBoundaries: [
      "Service-to-service calls",
      "Database connections",
      "Third-party API integrations",
    ],
  },

  implementations: [
    {
      id: "resilience4j",
      name: "Resilience4j",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Lightweight fault tolerance library designed for functional programming",
      links: {
        docs: "https://resilience4j.readme.io/",
        github: "https://github.com/resilience4j/resilience4j",
      },
    },
    {
      id: "polly",
      name: "Polly",
      type: "library",
      languages: ["csharp"],
      description: ".NET resilience and transient-fault-handling library",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki",
        github: "https://github.com/App-vNext/Polly",
      },
    },
    {
      id: "opossum",
      name: "Opossum",
      type: "library",
      languages: ["javascript", "typescript"],
      description: "Node.js circuit breaker implementation",
      links: {
        github: "https://github.com/nodeshift/opossum",
        npm: "https://www.npmjs.com/package/opossum",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix",
      systemName: "Netflix",
      howUsed:
        "Hystrix (now deprecated) wrapped all inter-service calls to prevent cascading failures across hundreds of microservices",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "uber",
      systemName: "Uber",
      howUsed:
        "Circuit breakers protect critical paths like ride matching and payment processing",
    },
  ],

  philosophy: {
    coreProblem:
      "In distributed systems, a failing service can bring down the entire system through cascading failures",
    designPrinciple:
      "Fail fast and give failing components time to recover rather than overwhelming them with requests",
    historicalContext:
      "Inspired by electrical circuit breakers that prevent fires by cutting power during overload",
    alternativesRejected: [
      "Unlimited retries - can worsen the problem",
      "Long timeouts - waste resources waiting",
      "Ignoring failures - leads to cascading failures",
    ],
    mentalModel:
      "Like a bouncer at a club who stops letting people in when the venue is at capacity, giving time for people to leave before admitting more",
  },

  visualization: {
    staticDiagram: `stateDiagram-v2
    [*] --> Closed
    Closed --> Open: Failures ≥ Threshold
    Open --> HalfOpen: Timeout expires
    HalfOpen --> Closed: Success
    HalfOpen --> Open: Failure`,
    realWorldAnalogy:
      "A circuit breaker is like a bouncer at a nightclub. When too many problems occur inside (failures), the bouncer stops letting new people in (opens the circuit). After a cooling-off period, they let one person try to enter (half-open). If that goes well, normal admission resumes (closed).",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          'During Black Friday, the payment service becomes overwhelmed. The circuit breaker trips, returning cached "payment pending" responses and queuing orders for later processing.',
        patternRole:
          "Prevents checkout failures from cascading to inventory and shipping services",
        companies: ["Amazon", "Shopify"],
      },
      {
        domain: "Streaming",
        scenario:
          "The recommendation service fails. Rather than showing errors, the circuit breaker enables fallback to showing trending content.",
        patternRole: "Enables graceful degradation of personalization features",
        companies: ["Netflix", "Spotify"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "microservices",
    "resilience",
    "state-machine",
  ],
  difficulty: "intermediate",
};
