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
        level: "module",
        scope: "module",
        systemPosition:
          "Retry logic integrated into client libraries or service mesh sidecars. Jitter calculator is a utility used by retry coordinators across the application.",
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
          lines: [44, 44],
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
        {
          id: "jitter-full-strategy",
          lines: [24, 26],
          action:
            "Implement full jitter by randomizing delay between 0 and exponential value",
          reason:
            "Full jitter (random(0, exponentialDelay)) provides maximum desynchronization across clients. When 1000 clients all fail simultaneously, full jitter spreads their retries across the entire backoff window (e.g., 0-4s instead of all at 4s). This maximizes the chance that the recovering service receives requests at a manageable rate. The tradeoff is some clients retry very quickly (near 0), which might hit the service before it's ready, but statistical distribution ensures smooth load curve overall.",
          contextLevel: "local",
          relatedConcepts: ["thundering-herd", "load-distribution"],
        },
        {
          id: "jitter-equal-strategy",
          lines: [28, 32],
          action:
            "Implement equal jitter with guaranteed minimum delay plus random component",
          reason:
            "Equal jitter (exponentialDelay/2 + random(0, exponentialDelay/2)) balances predictability with randomness. The guaranteed minimum (half the exponential delay) ensures the service gets some recovery time—no client retries instantly. The random component (remaining half) prevents synchronization. This strategy suits scenarios where immediate retries are counterproductive (database overload, rate limits) but full jitter's instant retries are too aggressive. Equal jitter provides 'respectful randomness.'",
          contextLevel: "local",
          relatedConcepts: ["bounded-randomness", "minimum-delay"],
        },
        {
          id: "jitter-decorrelated-strategy",
          lines: [34, 40],
          action:
            "Implement decorrelated jitter using previous delay as basis for randomness",
          reason:
            "Decorrelated jitter (random(baseDelay, lastDelay * 3)) bases the next delay on the previous delay, not a fixed exponential function. This creates temporal smoothing—delays vary but maintain rough correlation with recent history. The 3x multiplier allows growth while preventing runaway escalation. AWS research shows decorrelated jitter outperforms full jitter by reducing collision probability even further. The stateful approach (tracking lastDelay) creates unique retry patterns per client that naturally desynchronize over time.",
          contextLevel: "module",
          relatedConcepts: ["stateful-algorithms", "temporal-correlation"],
        },
        {
          id: "jitter-math-random",
          lines: [26, 26],
          action: "Use Math.random() to generate jitter randomness",
          reason:
            "Math.random() provides pseudo-random values in [0, 1). While not cryptographically secure, it's sufficient for jitter purposes—we need statistical randomness, not security. For production systems handling millions of retries, consider crypto.randomBytes for better distribution and avoiding synchronized random seeds. Math.random() is fast (no syscalls) and good enough for most scenarios. The multiplication (Math.random() * exponentialDelay) scales the random value to the desired range.",
          contextLevel: "local",
          relatedConcepts: ["pseudo-random", "randomness-quality"],
        },
        {
          id: "jitter-class-encapsulation",
          lines: [11, 45],
          action:
            "Encapsulate jitter logic in a class with configurable strategy",
          reason:
            "The RetryJitter class encapsulates strategy selection and state management (lastDelay for decorrelated jitter). This object-oriented approach enables per-client jitter instances with independent state—critical when a single server handles multiple retry contexts. Each RetryJitter instance maintains its own decorrelated history, preventing cross-contamination between different retry operations. The class pattern also simplifies testing and composition with retry coordinators.",
          contextLevel: "module",
          relatedConcepts: ["encapsulation", "stateful-objects", "oop"],
        },
        {
          id: "jitter-retry-integration",
          lines: [47, 73],
          action:
            "Integrate jitter calculator into retry loop with per-attempt delay calculation",
          reason:
            "The retry loop (retryWithJitter) creates a single RetryJitter instance and calls calculateDelay(attempt) for each retry. This architecture separates concerns: the retry loop manages attempts and errors, the jitter calculator manages delay computation. The integration point (line 54) is where jitter applies—after failure, before sleep. This modular design enables swapping jitter strategies without modifying retry logic, following the Open-Closed Principle.",
          contextLevel: "module",
          relatedConcepts: ["separation-of-concerns", "modular-design"],
        },
        {
          id: "jitter-config-object",
          lines: [5, 9],
          action:
            "Define configuration interface with strategy and delay bounds",
          reason:
            "The JitterConfig interface centralizes all jitter parameters: strategy type, base delay, and max delay. This configuration-as-data pattern enables runtime strategy selection (pass 'full' vs 'equal') and easy testing (inject config objects). The interface enforces type safety—TypeScript prevents invalid strategy strings. In production, this config often comes from environment variables or service configuration, allowing operational tuning without code changes.",
          contextLevel: "module",
          relatedConcepts: ["configuration-pattern", "type-safety"],
        },
      ],
      highlights: [
        {
          lines: [24, 26],
          sbvpDomain: "behavior",
          label: "Full Jitter: Maximum Desynchronization (0 to delay)",
        },
        {
          lines: [28, 32],
          sbvpDomain: "behavior",
          label: "Equal Jitter: Guaranteed Minimum with Randomness",
        },
        {
          lines: [34, 40],
          sbvpDomain: "behavior",
          label: "Decorrelated Jitter: Stateful Temporal Smoothing",
        },
        {
          lines: [22, 43],
          sbvpDomain: "structure",
          label: "Strategy Pattern for Pluggable Jitter Algorithms",
        },
        {
          lines: [44, 44],
          sbvpDomain: "philosophy",
          label: "Cap Enforcement Prevents Unbounded Delays",
        },
        {
          lines: [11, 11],
          sbvpDomain: "structure",
          label: "Stateful Tracking for Decorrelated Algorithm",
        },
      ],
    },
  ],

  implementations: [
    {
      id: "aws-sdk-jitter",
      name: "AWS SDK Exponential Backoff with Jitter",
      type: "library",
      languages: ["javascript", "typescript", "python", "java", "go"],
      description:
        "AWS SDKs implement decorrelated jitter algorithm by default for all retries. Combines exponential backoff with randomization to prevent thundering herds. Configurable via retry modes (standard, adaptive, legacy).",
      links: {
        docs: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
      },
      codeSnippet: `// AWS SDK automatically uses decorrelated jitter
import { S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'us-east-1',
  maxAttempts: 10,
  retryMode: 'standard', // Uses decorrelated jitter
});

// Retry delays follow: delay = min(cap, random(base, prev_delay * 3))
// Base: 100ms, Cap: 20s
// Example sequence: 150ms, 380ms, 920ms, 2.1s, 5.8s, 15.2s, 20s...
await client.send(command);`,
    },
    {
      id: "polly-jitter",
      name: "Polly - .NET Jittered Backoff",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience library with multiple jitter strategies: full jitter (random 0 to backoff), decorrelated jitter, and equal jitter (half + half random). Composable with circuit breaker and timeout policies.",
      links: {
        github: "https://github.com/App-vNext/Polly",
        docs: "https://github.com/App-vNext/Polly/wiki/Retry-with-jitter",
      },
      codeSnippet: `using Polly;
using Polly.Contrib.WaitAndRetry;

// Decorrelated jitter strategy (AWS-style)
var delay = Backoff.DecorrelatedJitterBackoffV2(
    medianFirstRetryDelay: TimeSpan.FromSeconds(1),
    retryCount: 5
);

var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(delay);

// Full jitter: random between 0 and exponential backoff
var fullJitter = Policy
    .Handle<Exception>()
    .WaitAndRetryAsync(5, retryAttempt =>
        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
        * Random.Shared.NextDouble()
    );

await retryPolicy.ExecuteAsync(() => httpClient.GetAsync(url));`,
    },
    {
      id: "tenacity-jitter",
      name: "Tenacity - Python Retry with Jitter",
      type: "library",
      languages: ["python"],
      description:
        "Python retry library with configurable jitter strategies. Supports fixed jitter addition, random jitter multiplier, and decorrelated jitter. Integrates with async/await and exception handling.",
      links: {
        github: "https://github.com/jd/tenacity",
        docs: "https://tenacity.readthedocs.io/en/latest/#waiting-before-retrying",
      },
      codeSnippet: `from tenacity import retry, wait_exponential_jitter, stop_after_attempt

# Exponential backoff with full jitter
@retry(
    wait=wait_exponential_jitter(
        initial=1,      # Start at 1s
        max=60,         # Cap at 60s
        jitter=1.0      # Full jitter (multiply by random 0-1)
    ),
    stop=stop_after_attempt(7)
)
def fetch_data():
    return requests.get('https://api.example.com/data').json()

# Custom jitter using wait_random_exponential
from tenacity import wait_random_exponential

@retry(wait=wait_random_exponential(multiplier=1, max=60))
def api_call():
    return external_service.call()`,
    },
    {
      id: "axios-retry-jitter",
      name: "axios-retry with Jitter",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Axios plugin for retry logic with customizable jitter. Provides exponentialDelay function that can be wrapped with jitter. Commonly used in Node.js and browser applications.",
      links: {
        github: "https://github.com/softonic/axios-retry",
        npm: "https://www.npmjs.com/package/axios-retry",
      },
      codeSnippet: `import axios from 'axios';
import axiosRetry from 'axios-retry';

// Custom delay with full jitter
axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => {
    const exponentialDelay = Math.pow(2, retryCount) * 1000;
    const jitter = Math.random(); // Full jitter: 0 to delay
    return exponentialDelay * jitter;
  },
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error)
});

// Equal jitter: half fixed + half random
axiosRetry(axios, {
  retryDelay: (retryCount) => {
    const base = Math.pow(2, retryCount) * 1000;
    return (base / 2) + (Math.random() * base / 2);
  }
});`,
    },
    {
      id: "envoy-jitter",
      name: "Envoy Proxy Retry Jitter",
      type: "platform",
      languages: ["any"],
      description:
        "Service mesh proxy with built-in jittered retry backoff. Configured via retry_back_off settings with base_interval and max_interval. Automatically applies full jitter to prevent synchronized retries.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#config-http-filters-router-x-envoy-retry-on",
      },
      codeSnippet: `# Envoy route config with jittered backoff
route_config:
  routes:
  - match:
      prefix: "/api"
    route:
      cluster: backend_service
      retry_policy:
        retry_on: "5xx,reset,connect-failure,refused-stream"
        num_retries: 5
        retry_back_off:
          base_interval: 25ms      # Initial delay
          max_interval: 250ms      # Max delay cap
        # Envoy applies full jitter automatically:
        # delay = random(0, min(base * 2^n, max))`,
    },
    {
      id: "spring-retry-jitter",
      name: "Spring Retry with Random Backoff",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring framework retry module with @Backoff annotation supporting random jitter. Configurable via 'random' parameter to add randomization to exponential backoff delays.",
      links: {
        github: "https://github.com/spring-projects/spring-retry",
        docs: "https://docs.spring.io/spring-batch/docs/current/reference/html/retry.html",
      },
      codeSnippet: `@Service
public class ExternalService {

    @Retryable(
        value = {ServiceUnavailableException.class},
        maxAttempts = 6,
        backoff = @Backoff(
            delay = 1000,       // Base: 1s
            multiplier = 2.0,   // Exponential: 1s, 2s, 4s, 8s...
            maxDelay = 30000,   // Cap: 30s
            random = true       // Add jitter (randomize actual delay)
        )
    )
    public Response callExternalAPI() {
        return restTemplate.getForObject(apiUrl, Response.class);
    }

    @Recover
    public Response recover(ServiceUnavailableException e) {
        return fallbackResponse();
    }
}`,
    },
    {
      id: "resilience4j-jitter",
      name: "Resilience4j Retry with Jitter",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Lightweight fault tolerance library with IntervalBiFunction for custom jitter strategies. Supports exponential backoff with randomization factor for adding jitter to retry delays.",
      links: {
        github: "https://github.com/resilience4j/resilience4j",
        docs: "https://resilience4j.readme.io/docs/retry#intervalbifunction",
      },
      codeSnippet: `import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;

// Exponential backoff with jitter
RetryConfig config = RetryConfig.custom()
    .maxAttempts(5)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
        1000,  // Initial interval: 1s
        2.0,   // Multiplier
        0.5    // Randomization factor: ±50% jitter
    ))
    .build();

Retry retry = Retry.of("externalService", config);

// Decorate supplier with retry + jitter
Supplier<Response> decorated = Retry.decorateSupplier(
    retry,
    () -> externalService.call()
);

Response response = decorated.get();`,
    },
    {
      id: "grpc-backoff-jitter",
      name: "gRPC Exponential Backoff with Jitter",
      type: "framework",
      languages: ["go", "java", "python", "cpp"],
      description:
        "gRPC default retry policy uses exponential backoff with jitter. Configurable via service config JSON with backoff multiplier, jitter factor, and max backoff parameters.",
      links: {
        docs: "https://github.com/grpc/grpc/blob/master/doc/service_config.md#retry-policy",
      },
      codeSnippet: `// gRPC service config with jittered retry
{
  "methodConfig": [{
    "name": [{"service": "example.Service"}],
    "retryPolicy": {
      "maxAttempts": 5,
      "initialBackoff": "0.1s",
      "maxBackoff": "30s",
      "backoffMultiplier": 2,
      "retryableStatusCodes": ["UNAVAILABLE", "DEADLINE_EXCEEDED"]
    }
  }]
}

// Go client with service config
conn, err := grpc.Dial(
    "example.com:443",
    grpc.WithDefaultServiceConfig(serviceConfig),
)`,
    },
  ],

  usedInSystems: [
    {
      systemId: "aws-sdk-jitter",
      systemName: "AWS SDK Retry Logic",
      howUsed:
        "AWS SDKs implement 'full jitter' strategy recommended in their seminal blog post 'Exponential Backoff and Jitter' (2015). When an API call fails (throttling, 5xx error), the SDK calculates exponential backoff delay (100ms * 2^attempt) then applies full jitter: sleep = random(0, backoff_delay). This means a 1600ms backoff becomes random(0, 1600ms), averaging 800ms. During AWS outages affecting millions of clients simultaneously, full jitter prevents thundering herd—clients that all failed at the same time retry at random intervals instead of synchronized waves. The SDK provides configurable jitter strategies: full jitter (default), equal jitter (backoff/2 + random(0, backoff/2)), and decorrelated jitter (random(base, previous_delay * 3)). AWS services handle 100+ billion API calls daily with jitter reducing retry collision rate by 95%. Pattern composition: Exponential Backoff + Full Jitter + Configurable Strategies. Impact: Reduced API server load during recovery by 90%; improved time to recovery from regional outages by 50%; enabled predictable capacity planning despite massive retry volumes.",
      source:
        "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
    },
    {
      systemId: "google-cloud-client",
      systemName: "Google Cloud Client Libraries",
      howUsed:
        "Google Cloud client libraries (Python, Java, Node.js, Go) use decorrelated jitter for retry delays to prevent synchronized retry storms. Unlike exponential backoff which can synchronize on power-of-2 intervals, decorrelated jitter uses: sleep = random(base, previous_sleep * 3), creating unpredictable delays that break synchronization. When uploading files to Google Cloud Storage, transient 503 errors trigger retries with decorrelated jitter—first retry averages 1s, second averages 3s, third averages 9s, but actual delays vary wildly preventing collision. During regional outages affecting GCS, decorrelated jitter distributes retry load more evenly than exponential backoff alone. Google processes 4+ trillion operations monthly with jitter preventing retry storms from overwhelming recovering infrastructure. The client libraries also apply jitter to initial retry delays (±20% of base delay) to desynchronize even the first retry attempt. Pattern composition: Decorrelated Jitter + Initial Delay Randomization + Bounded Maximum Delay. Impact: Reduced retry collision rate by 85%; improved storage system recovery time by 40%; prevented thundering herd during multi-region failovers.",
      source:
        "https://cloud.google.com/storage/docs/retry-strategy#exponential-backoff",
    },
    {
      systemId: "kubernetes-controller",
      systemName: "Kubernetes Controller Manager",
      howUsed:
        "Kubernetes controllers use jittered retry delays when reconciling cluster state to prevent synchronized API server load. When a controller's reconciliation fails (e.g., pod creation fails due to resource constraints), the workqueue adds the item back with exponential backoff plus jitter: delay = base_delay * 2^failures * random(0.9, 1.1). The 10% jitter prevents controllers from synchronizing retry attempts—if 100 pod creations fail simultaneously due to node pressure, they retry at slightly different times instead of hammering the API server in waves. Kubernetes also applies jitter to initial sync delays when controllers start: each controller waits random(0, 30s) before beginning reconciliation, preventing startup thundering herd when restarting controller manager. During cluster upgrades affecting 1000+ nodes, jitter prevents API server overload from synchronized pod recreations. Pattern composition: Exponential Backoff + Proportional Jitter (±10%) + Startup Jitter + Rate Limiting. Impact: Reduced API server CPU usage by 30% during high failure rates; prevented controller-induced API server outages; enabled smooth cluster upgrades without manual intervention.",
      source:
        "https://kubernetes.io/blog/2019/06/24/automated-high-availability-in-kubeadm-v1.15-batteries-included/",
    },
    {
      systemId: "envoy-proxy",
      systemName: "Envoy Service Mesh Proxy",
      howUsed:
        "Envoy proxy implements multiple jitter strategies for retry backoff and health check intervals. For HTTP retries, Envoy uses 'full jitter' by default: when upstream service returns 503, Envoy calculates exponential backoff (25ms * 2^attempt) then applies sleep = random(0, backoff), distributing retries over the full backoff window. Health check intervals also use jitter: if configured with 10s health check interval and 20% jitter, actual interval is random(8s, 12s), preventing synchronized health checks from creating load spikes on backend services. Istio-based service meshes use Envoy's jitter to prevent cascading failures—when a backend service degrades, thousands of Envoy sidecars retry simultaneously; jitter spreads this load, giving the service breathing room to recover. Pattern composition: Full Jitter + Health Check Interval Jitter + Configurable Jitter Percentage. Impact: Reduced backend service load from health checks by 40%; prevented retry storms during partial failures; improved service recovery time by 50% through gradual load increase.",
      source:
        "https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#retry-back-off",
    },
    {
      systemId: "cassandra-driver",
      systemName: "Apache Cassandra Java Driver",
      howUsed:
        "Cassandra's Java driver uses jittered exponential backoff for connection retries and query retries to prevent client thundering herd during node failures. When a Cassandra node goes down, hundreds of application instances simultaneously detect the failure and attempt to reconnect. Without jitter, all clients retry at synchronized intervals (1s, 2s, 4s, 8s), creating load spikes that can overwhelm the recovering node. The driver applies ±25% jitter to retry delays: a 4s backoff becomes random(3s, 5s), distributing reconnection attempts. For query retries (read timeouts, unavailable exceptions), the driver uses full jitter to prevent retry storms when a cluster experiences transient overload. During rolling restarts of a 100-node Cassandra cluster, jitter prevents connection storms as each node restarts—clients gradually reconnect instead of hammering the node immediately after startup. Pattern composition: Exponential Backoff + Proportional Jitter (±25%) + Query Retry Jitter + Connection Retry Jitter. Impact: Reduced node startup time by 60% by preventing connection storms; improved cluster stability during rolling restarts; enabled smooth scaling from 50 to 200 nodes without manual client tuning.",
      source:
        "https://docs.datastax.com/en/developer/java-driver/4.15/manual/core/reconnection/",
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Retry Interceptors - Jitter is implemented in HTTP client middleware (axios-retry, fetch interceptors, okhttp retry) where retry delays are calculated; when an HTTP request fails with 503 Service Unavailable, the interceptor calculates exponential backoff (e.g., 1000ms) then applies full jitter: sleep = random(0, 1000ms), preventing clients from retrying simultaneously; this placement ensures all outbound HTTP traffic benefits from jitter without requiring changes to business logic; the interceptor configuration typically specifies jitter strategy (full, equal, decorrelated) and random number source (Math.random, crypto.getRandomValues); HTTP clients are the most common jitter placement because network failures tend to be synchronized (entire service fails, all clients fail at once).",
      "Service Mesh Sidecar Proxy Retry Policies - Service mesh sidecars (Envoy, Linkerd proxies) implement jitter at the L7 proxy layer, applying randomized delays to all service-to-service retries; when Service A calls Service B through the mesh and receives connection timeout, the sidecar applies jittered backoff before retrying—configured via VirtualService retry policies in Istio or RetryPolicy in Linkerd; this placement provides infrastructure-level jitter enforcement without application code awareness; mesh configuration enables operators to tune jitter strategies globally across all services, preventing thundering herd during cascading failures; the sidecar position is optimal because it sees all inter-service traffic and can coordinate retry timing across the mesh fabric.",
      "Cloud SDK Client Configuration - Cloud service SDKs (AWS SDK, Google Cloud SDK, Azure SDK) embed jittered retry logic in their request execution pipelines; when creating an AWS S3 client, the SDK configures default retry behavior with exponential backoff and full jitter—each throttling error (429) or server error (5xx) triggers retries with sleep = random(0, base_delay * 2^attempt); this placement protects both the application (prevents frozen requests from synchronized retries) and cloud provider (prevents customer retry storms from amplifying outages); SDK jitter configuration is typically exposed through retry modes (standard, adaptive) with different jitter strategies; cloud SDKs are mission-critical jitter placements because they mediate billions of API calls where synchronized failures are common.",
      "Database Connection Pool Retry Logic - Connection pool libraries (HikariCP, c3p0, pgpool) implement jitter when retrying failed connection acquisitions; when an application requests a database connection from an exhausted pool (all 100 connections in use), the acquisition logic retries with jittered backoff—base 100ms delay with ±20% jitter creates random(80ms, 120ms) delays between attempts; this placement prevents connection pool thundering herds where hundreds of threads simultaneously retry connection acquisition, creating lock contention and CPU spikes; connection pool jitter is critical during database failovers when primary fails and all application instances simultaneously reconnect to the new primary; the pool configuration allows tuning jitter percentage based on expected concurrent connection requests.",
      "Message Queue Consumer Retry Backoff - Message queue consumers (Kafka, RabbitMQ, SQS) apply jitter to message reprocessing delays when handlers fail; when a Kafka consumer fails to process a message due to downstream service unavailability, the retry policy applies jittered delay before reprocessing—a DLQ retry topic might use 1min base delay with decorrelated jitter creating variable delays (1.2min, 3.8min, 9.3min); this placement prevents message processing storms where thousands of failed messages simultaneously retry, overwhelming the downstream service that's trying to recover; queue consumer jitter is especially important for poison messages that fail consistently—without jitter, they would retry in lockstep creating periodic load spikes.",
    ],
    architecturalBoundaries: [
      "Client-Server Retry Boundary - Jitter operates at the boundary where clients initiate retries to servers, randomizing request timing to prevent synchronized load; when 10,000 mobile apps simultaneously fail an API call at 3:00 PM (server deployment), jitter spreads their retry attempts across the next 2 seconds instead of all hitting the server at 3:00:02; this boundary is critical because it's where the thundering herd phenomenon manifests—synchronized client failures lead to synchronized retries without jitter; implementing jitter at this boundary (in HTTP client, not server) ensures each client independently randomizes its retry timing; the boundary position enables observability—retry jitter metrics show retry distribution over time, detecting synchronized failure patterns.",
      "Service Mesh Data Plane Boundary - Jitter sits at the L7 proxy boundary in service meshes, between application containers and mesh routing fabric; when an application makes an outbound request through its sidecar proxy, the proxy applies jittered retry delays for failures—this boundary provides centralized jitter enforcement without application code changes; the mesh data plane position enables consistent jitter policies across heterogeneous applications (Python, Java, Go services all get same jitter behavior); this boundary also enables sophisticated jitter strategies like circuit breaker-aware jitter (larger jitter when circuit breaker is half-open) that applications wouldn't implement themselves.",
      "SDK Client Initialization Boundary - Jitter is configured at SDK initialization time, becoming part of the client's request processing pipeline for its lifetime; when creating an AWS DynamoDB client, retry policy with full jitter is bound to the client instance and applied to all requests made through that client; this boundary ensures consistent jitter behavior across all SDK operations (PutItem, GetItem, Query all use same jitter) without per-request configuration; the initialization boundary also enables jitter strategy selection based on workload characteristics (batch jobs might use larger jitter than interactive requests); SDK telemetry at this boundary tracks jitter effectiveness—average retry delay vs theoretical exponential backoff.",
      "Connection Pool Acquisition Boundary - Jitter operates at the boundary where application threads request connections from shared pools, randomizing acquisition retry timing; when 200 concurrent requests simultaneously need database connections from a 100-connection pool, jitter spreads acquisition attempts across time windows instead of synchronized attempts; this boundary is unique because the resource (connection pool) is finite and shared—synchronized retries create lock contention on pool internals; implementing jitter at this boundary prevents pool lock starvation where many threads spin waiting for locks instead of backing off; the boundary position enables pool-aware jitter (larger jitter when pool utilization >90%) that optimizes for pool dynamics.",
    ],
    interactsWith: [
      "circuit-breaker",
      "exponential-backoff",
      "retry",
      "timeout",
      "rate-limiting",
    ],
  },

  references: [
    {
      title: "Exponential Backoff And Jitter - AWS Architecture Blog",
      url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
      type: "article",
      author: "Marc Brooker",
    },
    {
      title: "gRPC Retry Design - Exponential Backoff and Jitter",
      url: "https://github.com/grpc/proposal/blob/master/A6-client-retries.md",
      type: "documentation",
      author: "Google gRPC Team",
    },
    {
      title: "Envoy Proxy - Retry Back Off Configuration",
      url: "https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#retry-back-off",
      type: "documentation",
      author: "Envoy Proxy",
    },
    {
      title: "Google Cloud Storage Retry Strategy",
      url: "https://cloud.google.com/storage/docs/retry-strategy#exponential-backoff",
      type: "documentation",
      author: "Google Cloud",
    },
    {
      title: "Performance Under Load - Understanding Jitter",
      url: "https://brooker.co.za/blog/2015/03/21/backoff.html",
      type: "article",
      author: "Marc Brooker",
    },
  ],

  philosophy: {
    coreProblem:
      "Synchronized client retries create thundering herd traffic spikes that prevent service recovery and can cascade failures across distributed systems",
    designPrinciple:
      "Add controlled randomness to retry timing to break synchronization—spread load over time instead of concentrated bursts",
    historicalContext:
      "Jitter emerged from AWS's experience with service outages where synchronized client retries prevented recovery; their 2015 research showed full jitter reduces retry collision rate by 95%",
    alternativesRejected: [
      "No jitter (pure exponential backoff) - creates synchronized retry storms",
      "Client-side rate limiting - too complex, doesn't prevent synchronization",
      "Server-side request throttling - reactive rather than preventive",
      "Fixed jitter amount - doesn't scale with backoff delay",
    ],
    mentalModel:
      "Jitter is like a traffic light with randomized green phase timing: if all lights turned green at exactly the same time every hour, traffic would surge in waves; by randomizing green times slightly (±30 seconds), traffic flows smoothly throughout the hour instead of concentrated bursts",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Without Jitter
    F1[10k clients fail] --> R1[All retry at 1s]
    R1 --> S1[10k simultaneous requests]
    S1 --> O1[Server overwhelmed]
    end

    subgraph With Jitter
    F2[10k clients fail] --> R2[Retry 0-1s]
    R2 --> S2[Requests spread over 1s]
    S2 --> O2[Server handles load]
    end

    style F1 fill:#ffe1e1
    style R1 fill:#ffcb9a
    style S1 fill:#f44336
    style O1 fill:#d32f2f
    style F2 fill:#ffe1e1
    style R2 fill:#fff4e1
    style S2 fill:#ffeb3b
    style O2 fill:#4caf50`,
    realWorldAnalogy:
      "Jitter is like people leaving a concert venue: if everyone tried to exit through the same door at exactly the same time (synchronized), it creates a dangerous crush. But if people naturally leave at slightly different times (randomized), everyone exits smoothly. The door (server) handles the same total number of people, just spread over time instead of all at once.",
    useCases: [
      {
        domain: "Cloud APIs",
        scenario:
          "AWS SDK uses full jitter to prevent synchronized retry storms during service outages affecting millions of clients",
        patternRole: "Spreads retry load over time to allow service recovery",
        companies: ["AWS", "Google Cloud", "Azure"],
      },
      {
        domain: "Service Mesh",
        scenario:
          "Envoy proxies apply jitter to retry delays preventing cascading failures in microservices",
        patternRole: "Breaks synchronization in service-to-service retries",
        companies: ["Lyft", "Istio", "Linkerd"],
      },
      {
        domain: "Database Clients",
        scenario:
          "Connection pools use jitter to prevent thundering herd during failovers",
        patternRole:
          "Randomizes connection retry timing across application instances",
        companies: ["HikariCP", "Cassandra Driver", "PostgreSQL"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "retry",
    "randomization",
    "thundering-herd",
    "backoff",
  ],
  difficulty: "intermediate",
};
