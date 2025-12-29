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
      "Jitter is a retry enhancement technique that introduces controlled randomness into retry delay calculations to prevent synchronized retry storms—a scenario where multiple clients simultaneously retry failed operations, creating coordinated traffic spikes that can overwhelm recovering systems. When a service experiences an outage, thousands or millions of clients may fail at the same instant. Without jitter, these clients would retry at identical intervals determined by a deterministic backoff algorithm (e.g., all retry after exactly 1s, then 2s, then 4s). This synchronized behavior creates tsunami-like traffic waves that can prevent the service from recovering, as each retry wave arrives before the system can stabilize. Jitter breaks this synchronization by adding randomness to each client's retry delay—one client might retry at 0.8s, another at 1.2s, another at 0.5s—spreading the retry load smoothly over time. The pattern supports multiple jitter strategies: Full Jitter (random delay between 0 and exponential backoff value, maximizing spread), Equal Jitter (half fixed delay plus half random, balancing predictability with randomness), and Decorrelated Jitter (randomness based on previous delay, creating smooth temporal distribution). Jitter is essential for large-scale distributed systems where client count makes synchronized retries catastrophic, particularly during cascading failures or service restarts. AWS's research shows that jitter can reduce retry-induced load by 80-90% compared to non-jittered exponential backoff, making it a critical reliability pattern for cloud-native applications.",
    problemSolved:
      "Distributed systems face a catastrophic failure mode called the thundering herd problem: when a popular service fails (server crash, deployment, network partition), all connected clients detect the failure simultaneously and initiate retries at the exact same intervals. With 10,000 clients using 1s exponential backoff, the service receives 10,000 requests at t=1s, 10,000 at t=2s, 10,000 at t=4s—concentrated bursts that can overwhelm a recovering service. Each retry wave consumes resources (CPU, memory, database connections), preventing the service from processing legitimate requests and fully recovering. This creates a vicious cycle: the service struggles under retry load, fails to recover, causing clients to retry again, perpetuating the outage. The problem intensifies with scale—1 million clients creates 1 million simultaneous retries. Jitter solves this by randomizing retry delays: those 10,000 clients now retry spread across 0-1s, 0-2s, 0-4s windows, creating smooth request flow instead of synchronized spikes. This allows the recovering service to process requests incrementally, stabilize resources, and restore service without being immediately crushed by retry traffic. Jitter is particularly critical during cascading failures, where one service failure triggers retries to dependent services, potentially collapsing entire service chains.",
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
      contextDilation: {
        scope: "module",
        systemPosition:
          "Retry logic integrated into client libraries or service mesh sidecars. Jitter calculator is a utility used by retry coordinators across the application.",
        zoomLevels: [
          "Micro: Individual jitter calculation for single retry attempt",
          "Local: RetryJitter class managing strategy and state across attempts",
          "Module: Retry coordination with jitter as pluggable strategy",
          "System: Client library providing jittered retries to all service calls",
        ],
        prerequisites: [
          "Understanding of exponential backoff",
          "Knowledge of the thundering herd problem",
          "Familiarity with randomness and probability distributions",
        ],
      },
      annotations: [
        {
          id: "jitter-strategy-selection",
          lines: [22, 43],
          action:
            "Switch between three jitter strategies with different randomness characteristics",
          reason:
            "Different strategies suit different scenarios. Full jitter (0 to baseDelay) maximizes spread but can retry very quickly. Equal jitter (baseDelay/2 to baseDelay) ensures minimum delay while adding randomness. Decorrelated jitter creates smooth temporal distribution by basing randomness on previous delay rather than fixed exponential values, preventing long-term synchronization patterns.",
          contextLevel: "module",
          relatedConcepts: ["exponential-backoff", "random-distribution"],
        },
        {
          id: "jitter-cap-enforcement",
          lines: [44],
          action:
            "Cap jittered delay at configured maximum to prevent unbounded waits",
          reason:
            "Without a cap, exponential growth with jitter can produce extremely long delays (hours or days for high attempt numbers). The cap ensures retries remain within reasonable timeframes. Example: base=100ms, attempt=10 yields 102.4s exponential delay, but cap at 10s keeps retries responsive.",
          contextLevel: "local",
          relatedConcepts: ["backoff", "timeout"],
        },
        {
          id: "jitter-decorrelated-state",
          lines: [11, 39],
          action: "Track last delay for decorrelated jitter calculation",
          reason:
            "Decorrelated jitter (Amazon's recommendation) uses previous delay to calculate next delay's range, creating temporal smoothing. State tracking enables `random(baseDelay, lastDelay * 3)` formula, which prevents synchronized patterns that can emerge even with full jitter over many clients and attempts.",
          contextLevel: "local",
          relatedConcepts: ["stateful-retry", "temporal-distribution"],
        },
      ],
      highlights: [
        {
          id: "jitter-full-strategy",
          lines: [24, 26],
          domain: "behavior",
          title: "Full Jitter: Maximum Spread",
          explanation:
            "Full jitter provides maximum desynchronization by randomizing delay uniformly across 0 to exponentialDelay. This aggressive spreading minimizes thundering herd effects but can cause very short retries (near 0ms) which may not give services enough recovery time.",
        },
        {
          id: "jitter-equal-strategy",
          lines: [28, 32],
          domain: "behavior",
          title: "Equal Jitter: Balanced Approach",
          explanation:
            "Equal jitter balances predictability with randomness: delay = baseDelay/2 + random(0, baseDelay/2). Guarantees minimum 50% of exponential delay (ensures some recovery time) while adding 50% randomness (prevents synchronization). Recommended for most production systems.",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement:
      "Jitter is implemented in client-side retry logic within HTTP clients (axios, fetch), message queue consumers, database connection pools, and service mesh proxies. It sits at the boundary between the application and external dependencies, wrapping any operation that might fail and require retries. In microservices architectures, jitter is typically configured in the service mesh (Istio, Linkerd) or client libraries (gRPC, REST clients) to apply uniformly across all outbound calls.",
    architecturalBoundaries: [
      "Client Libraries: HTTP clients, SDK retry policies, gRPC interceptors",
      "Service Mesh: Envoy/Istio retry configuration with jittered backoff",
      "Message Consumers: Kafka, RabbitMQ consumers retrying failed message processing",
      "Infrastructure: Load balancer health check retry intervals with jitter",
    ],
    interactsWith: [
      "circuit-breaker",
      "exponential-backoff",
      "retry",
      "timeout",
      "rate-limiting",
    ],
  },
};
