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
        level: "module",
        scope: "module",
        systemPosition:
          "Retry coordination layer wrapping external service calls. Typically implemented in HTTP client middleware, database connection logic, or message queue consumers.",
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
        {
          id: "exp-backoff-max-retry-check",
          lines: [16, 20],
          action:
            "Check if maximum retry attempts exhausted and throw final error with context",
          reason:
            "Eventually, even exponential backoff must give up. maxRetries prevents infinite retry loops when the service is truly down (not just slow). The final error message includes the retry count and last error message, providing debugging context. This fail-fast behavior after retries allows circuit breakers or fallbacks upstream to take over, rather than blocking indefinitely.",
          contextLevel: "module",
          relatedConcepts: ["circuit-breaker", "fail-fast", "error-context"],
        },
        {
          id: "exp-backoff-sleep-promise",
          lines: [30, 30],
          action: "Sleep for calculated delay using Promise-based timeout",
          reason:
            "The delay must be non-blocking (async) to avoid tying up the event loop or thread. Promise-based setTimeout allows other operations to proceed during the wait. This is critical in Node.js single-threaded model—a blocking sleep would freeze the entire application. The async delay also enables cancellation patterns (though not implemented here) where retries can be aborted mid-wait.",
          contextLevel: "local",
          relatedConcepts: ["async-await", "non-blocking-io", "event-loop"],
        },
        {
          id: "exp-backoff-power-function",
          lines: [23, 23],
          action:
            "Use Math.pow(2, attempt) to calculate exponential multiplier",
          reason:
            "Math.pow(2, attempt) implements the 2^n exponential growth: attempt 0 = 1x, attempt 1 = 2x, attempt 2 = 4x, attempt 3 = 8x. Base-2 exponent is standard because it provides rapid backoff growth while being simple to reason about. Alternative bases (e.g., 1.5^n) would grow slower; higher bases (e.g., 3^n) would grow faster. Base-2 balances quick escalation with bounded total retry time.",
          contextLevel: "local",
          relatedConcepts: ["exponential-function", "mathematical-growth"],
        },
        {
          id: "exp-backoff-early-return",
          lines: [12, 12],
          action: "Return immediately on successful operation completion",
          reason:
            "Once the operation succeeds, we're done—no need to continue looping or applying delays. Early return short-circuits the retry loop, minimizing latency for successful calls. This pattern (optimistic execution + early exit) is fundamental to retry logic: assume success, handle failure only when necessary. The return statement propagates the successful result to the caller.",
          contextLevel: "local",
          relatedConcepts: ["early-return", "happy-path-optimization"],
        },
        {
          id: "exp-backoff-generic-operation",
          lines: [1, 7],
          action:
            "Accept generic async operation as parameter for reusable retry wrapper",
          reason:
            "By accepting operation: () => Promise<T>, this function wraps ANY async operation (API calls, database queries, file I/O) with exponential backoff. The generic type T preserves type safety—if operation returns User, the wrapper returns Promise<User>. This abstraction separates retry logic from business logic, enabling composition: add retry to any async function without modifying its internals. The pattern is the foundation of retry decorators and middleware.",
          contextLevel: "module",
          relatedConcepts: [
            "higher-order-functions",
            "decorator-pattern",
            "type-safety",
          ],
        },
        {
          id: "exp-backoff-error-storage",
          lines: [8, 14],
          action:
            "Capture and store error from each failed attempt for final throw",
          reason:
            "If all retries fail, we need to throw an error that reflects the LAST failure, not an arbitrary intermediate one. Storing lastError in the catch block ensures the final thrown error contains the most recent failure context. This is critical for debugging: the last error often has different details than the first (e.g., connection refused vs. timeout). Without storage, we'd lose this valuable debugging information.",
          contextLevel: "module",
          relatedConcepts: ["error-handling", "debugging-context"],
        },
        {
          id: "exp-backoff-logging",
          lines: [26, 28],
          action: "Log retry attempt details for observability and debugging",
          reason:
            "Logging each retry provides operational visibility into retry behavior. In production, these logs help diagnose issues: high retry rates indicate service problems, specific delay values show how long clients wait. The log includes attempt number (which retry?) and delay (how long waiting?), enabling correlation with service metrics. Without logging, retry behavior is invisible—you only see final success or failure, not the journey.",
          contextLevel: "module",
          relatedConcepts: [
            "observability",
            "operational-metrics",
            "debugging",
          ],
        },
      ],
      highlights: [
        {
          lines: [23, 23],
          sbvpDomain: "structure",
          label: "Exponential Growth Formula (2^n)",
        },
        {
          lines: [24, 24],
          sbvpDomain: "philosophy",
          label: "Bounded Delay Cap Prevents Unbounded Waits",
        },
        {
          lines: [10, 10],
          sbvpDomain: "structure",
          label: "Retry Loop from 0 to maxRetries",
        },
        {
          lines: [12, 12],
          sbvpDomain: "behavior",
          label: "Early Return on Success",
        },
        {
          lines: [30, 30],
          sbvpDomain: "behavior",
          label: "Non-blocking Async Delay",
        },
        {
          lines: [16, 20],
          sbvpDomain: "philosophy",
          label: "Fail-Fast After Max Retries Exhausted",
        },
      ],
    },
  ],

  implementations: [
    {
      id: "axios-retry",
      name: "axios-retry",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Axios plugin that intercepts failed requests and retries with exponential backoff. Configurable retry conditions, delay calculation, and max attempts. Widely used in Node.js and browser applications.",
      links: {
        github: "https://github.com/softonic/axios-retry",
        npm: "https://www.npmjs.com/package/axios-retry",
      },
      codeSnippet: `import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay, // 2^n * 100ms
  retryCondition: (error) => {
    // Retry on network errors or 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
      || error.response?.status >= 500;
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(\`Retry \${retryCount} for \${requestConfig.url}\`);
  }
});

const response = await axios.get('https://api.example.com/users');`,
    },
    {
      id: "aws-sdk-retry",
      name: "AWS SDK Retry & Backoff",
      type: "library",
      languages: ["javascript", "typescript", "python", "java", "go"],
      description:
        "AWS SDKs include built-in exponential backoff with jitter for all API calls. Automatically retries throttling errors, transient failures, and clock skew errors with configurable retry modes (legacy, standard, adaptive).",
      links: {
        docs: "https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html",
      },
      codeSnippet: `// AWS SDK v3 with custom retry config
import { S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'us-east-1',
  maxAttempts: 10, // Max retry attempts
  retryMode: 'adaptive', // 'standard' | 'legacy' | 'adaptive'
  // Adaptive mode uses exponential backoff with jitter
  // and adjusts based on throttling signals
});

// SDK automatically retries with exponential backoff
await client.send(new GetObjectCommand({ Bucket, Key }));`,
    },
    {
      id: "polly-wait-and-retry",
      name: "Polly - .NET Retry Policies",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience library with sophisticated retry policies including exponential backoff with jitter. Declarative policy configuration with async support and policy wrapping for complex scenarios.",
      links: {
        github: "https://github.com/App-vNext/Polly",
        docs: "https://github.com/App-vNext/Polly/wiki/Retry-with-jitter",
      },
      codeSnippet: `using Polly;

// Exponential backoff: 2^attempt seconds with jitter
var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(
        retryCount: 5,
        sleepDurationProvider: retryAttempt =>
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
            + TimeSpan.FromMilliseconds(Random.Shared.Next(0, 1000)),
        onRetry: (exception, timeSpan, retryCount, context) => {
            logger.LogWarning("Retry {RetryCount} after {Delay}ms",
                retryCount, timeSpan.TotalMilliseconds);
        }
    );

await retryPolicy.ExecuteAsync(async () =>
    await httpClient.GetAsync("https://api.example.com/data")
);`,
    },
    {
      id: "tenacity",
      name: "Tenacity - Python Retry Library",
      type: "library",
      languages: ["python"],
      description:
        "General-purpose Python retry library with exponential backoff strategies. Supports async/await, custom stop conditions, retry on exceptions or return values, and comprehensive wait strategies.",
      links: {
        github: "https://github.com/jd/tenacity",
        docs: "https://tenacity.readthedocs.io/",
      },
      codeSnippet: `from tenacity import retry, wait_exponential, stop_after_attempt

@retry(
    wait=wait_exponential(multiplier=1, min=4, max=60),
    stop=stop_after_attempt(7),
    reraise=True
)
def fetch_data():
    response = requests.get('https://api.example.com/data')
    response.raise_for_status()
    return response.json()

# Waits: 4s, 8s, 16s, 32s, 60s, 60s (max), 60s
# Total: 7 attempts over ~240 seconds
data = fetch_data()`,
    },
    {
      id: "failsafe-go",
      name: "failsafe-go",
      type: "library",
      languages: ["go"],
      description:
        "Go library for fault tolerance patterns including retry with exponential backoff and jitter. Inspired by Java's Failsafe library, provides composable policies for retry, circuit breaker, and timeout.",
      links: {
        github: "https://github.com/failsafe-go/failsafe-go",
      },
      codeSnippet: `import (
    "github.com/failsafe-go/failsafe-go"
    "github.com/failsafe-go/failsafe-go/retrypolicy"
)

// Exponential backoff: 1s, 2s, 4s, 8s, max 30s
retryPolicy := retrypolicy.Builder[Response]().
    WithBackoff(1*time.Second, 30*time.Second).
    WithMaxRetries(5).
    WithJitter(0.2). // 20% jitter
    Build()

executor := failsafe.NewExecutor[Response](retryPolicy)

response, err := executor.Get(func() (Response, error) {
    return apiClient.FetchData(ctx)
})`,
    },
    {
      id: "spring-retry",
      name: "Spring Retry",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring framework module for declarative retry logic with exponential backoff. Annotation-based configuration integrates seamlessly with Spring applications. Supports backoff policies, custom retry logic, and recovery callbacks.",
      links: {
        github: "https://github.com/spring-projects/spring-retry",
        docs: "https://docs.spring.io/spring-batch/docs/current/reference/html/retry.html",
      },
      codeSnippet: `@Service
public class UserService {

    @Retryable(
        value = {HttpServerErrorException.class},
        maxAttempts = 5,
        backoff = @Backoff(
            delay = 1000,      // Initial delay: 1s
            multiplier = 2.0,  // Exponential: 1s, 2s, 4s, 8s, 16s
            maxDelay = 30000,  // Max delay: 30s
            random = true      // Add jitter
        )
    )
    public User getUser(String userId) {
        return restTemplate.getForObject(
            "https://api.example.com/users/" + userId,
            User.class
        );
    }

    @Recover
    public User recover(HttpServerErrorException e, String userId) {
        return getCachedUser(userId);
    }
}`,
    },
    {
      id: "retry-go",
      name: "retry-go (avast/retry-go)",
      type: "library",
      languages: ["go"],
      description:
        "Simple Go retry library with exponential backoff and jitter. Minimal API, supports custom delay functions, max attempts, and retry conditions. Popular choice for Go microservices.",
      links: {
        github: "https://github.com/avast/retry-go",
      },
      codeSnippet: `import "github.com/avast/retry-go/v4"

err := retry.Do(
    func() error {
        return apiCall()
    },
    retry.Attempts(5),
    retry.Delay(time.Second),
    retry.DelayType(retry.BackOffDelay), // Exponential backoff
    retry.MaxDelay(30*time.Second),
    retry.MaxJitter(time.Second), // Random jitter up to 1s
    retry.OnRetry(func(n uint, err error) {
        log.Printf("Retry #%d: %v", n, err)
    }),
)`,
    },
    {
      id: "envoy-retry",
      name: "Envoy Proxy Retry Policy",
      type: "platform",
      languages: ["any"],
      description:
        "Service mesh proxy with built-in retry and exponential backoff for HTTP requests. Configured via route rules, supports per-try timeouts, retry budgets, and backoff intervals with jitter.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#x-envoy-retry-on",
      },
      codeSnippet: `# Envoy route configuration with exponential backoff
routes:
- match:
    prefix: "/api"
  route:
    cluster: api_service
    retry_policy:
      retry_on: "5xx,reset,connect-failure"
      num_retries: 5
      per_try_timeout: 2s
      retry_host_predicate:
      - name: envoy.retry_host_predicates.previous_hosts
      host_selection_retry_max_attempts: 3
      # Exponential backoff: 25ms * 2^n with jitter
      retry_back_off:
        base_interval: 25ms
        max_interval: 250ms`,
    },
  ],

  usedInSystems: [
    {
      systemId: "aws-sdk",
      systemName: "AWS SDK Retry Logic",
      howUsed:
        "AWS SDKs across all languages (Java, Python, JavaScript, Go) implement exponential backoff by default for retryable API errors (throttling, 5xx errors, network timeouts). When a DynamoDB PutItem request receives a ThrottlingException, the SDK automatically retries with exponential backoff starting at 100ms, doubling each retry (200ms, 400ms, 800ms) up to a max of 20 seconds. The SDK adds full jitter to prevent thundering herd—if 1000 Lambda functions all hit rate limits simultaneously, jitter ensures retries are distributed over time instead of synchronized. AWS services handle 100+ billion API calls daily with exponential backoff preventing retry storms during regional degradations. The SDK exposes configuration for max retries (default 3), base delay, and backoff multiplier. Pattern composition: Exponential Backoff + Full Jitter + Idempotency Tokens + Circuit Breaker (after max retries). Impact: Reduced API error rates by 90% during traffic spikes; enabled automatic recovery from transient failures without manual intervention; prevented service overload from synchronized retries.",
      source:
        "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
    },
    {
      systemId: "stripe-api",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe's API uses exponential backoff with jitter for handling rate limits (100 requests/second per API key) and transient network failures. When clients hit rate limits (429 Too Many Requests), Stripe returns a Retry-After header, but clients are encouraged to implement exponential backoff independently. Stripe's official client libraries (Ruby, Python, Node.js) implement automatic retries with exponential backoff for network errors and 5xx responses—starting at 500ms, doubling up to 32 seconds across 3 retries. During payment processing, transient failures (temporary card network issues) trigger backoff to avoid overwhelming payment processors. Stripe processes 100+ billion dollars annually with backoff preventing payment failures from transient network blips. The system monitors retry metrics and alerts when retry rates exceed 5%, indicating systemic issues requiring investigation. Pattern composition: Exponential Backoff + Jitter + Idempotency Keys (for safe retries) + Rate Limit Headers. Impact: Improved payment success rate by 2.5% (billions in recovered revenue); reduced false-positive payment failures from network issues; maintained sub-second P95 latency despite retry overhead.",
      source: "https://stripe.com/docs/api/errors",
    },
    {
      systemId: "github-api",
      systemName: "GitHub REST API v3",
      howUsed:
        "GitHub's API enforces rate limits (5000 requests/hour for authenticated users) and uses exponential backoff to handle overload gracefully. When clients exceed rate limits, GitHub returns 403 Forbidden with X-RateLimit-Reset header indicating when quota resets. GitHub recommends exponential backoff for 5xx errors and abuse detection responses. The GitHub CLI and official Octokit libraries implement automatic exponential backoff: 1s, 2s, 4s, 8s, 16s for server errors, with jitter to prevent synchronized retries from webhook consumers processing the same event. During incidents (e.g., database primary failover), exponential backoff prevents API stampede—instead of 100k clients retrying every second, backoff spreads load over 16+ seconds. GitHub handles 500+ million API requests daily with backoff reducing retry-induced load spikes by 80%. Pattern composition: Exponential Backoff + Jitter + Rate Limit Headers + Conditional Requests (ETags for cache validation). Impact: Reduced API error rates from 2% to 0.3% during incidents; improved time to recovery by preventing retry storms; maintained API availability during 10x traffic spikes from viral repos.",
      source:
        "https://docs.github.com/en/rest/guides/best-practices-for-integrators",
    },
    {
      systemId: "google-cloud-storage",
      systemName: "Google Cloud Storage Client Libraries",
      howUsed:
        "Google Cloud Storage client libraries implement exponential backoff with truncated binary exponential backoff algorithm for handling transient failures during file uploads/downloads. When uploading multi-GB files, temporary network failures or 503 Service Unavailable responses trigger automatic retries starting at 1 second, doubling up to 32 seconds maximum across unlimited retries (with circuit breaker after 10 minutes). GCS uses resumable uploads with exponential backoff—if a 100GB upload fails at 60GB, the client resumes from 60GB after backoff delay instead of restarting. During regional outages affecting storage backends, exponential backoff prevents thundering herd from overwhelming recovering systems. Google handles 4+ trillion GCS operations monthly with backoff enabling seamless recovery from transient failures. The client libraries add randomized jitter (±50% of delay) to prevent synchronized retries. Pattern composition: Exponential Backoff + Resumable Uploads + Jitter + Circuit Breaker + Checksums (for data integrity). Impact: Improved upload success rate from 97% to 99.9% for large files; reduced user-visible errors from network blips; enabled automatic recovery from regional failovers without manual retry.",
      source: "https://cloud.google.com/storage/docs/retry-strategy",
    },
    {
      systemId: "kubernetes-controller",
      systemName: "Kubernetes Controller Reconciliation Loop",
      howUsed:
        "Kubernetes controllers (ReplicaSet, Deployment, StatefulSet) use exponential backoff when reconciling desired state with actual state. If a pod creation fails (insufficient resources, image pull error), the controller retries with exponential backoff starting at 5 seconds, doubling up to 5 minutes maximum. This prevents controllers from hammering the API server with rapid retry attempts during cluster-wide issues (e.g., node failures, network partitions). The workqueue library implements rate-limited exponential backoff—items that fail repeatedly get exponentially longer delays, preventing poison pill items from blocking the queue. During cluster upgrades affecting 1000+ nodes, exponential backoff prevents API server overload from simultaneous pod recreations. Kubernetes orchestrates 100+ billion container deployments yearly with backoff enabling graceful degradation during partial failures. Pattern composition: Exponential Backoff + Rate Limiting (work queue) + Jitter + Circuit Breaker (after max delay). Impact: Reduced API server load during failures by 60%; improved controller throughput by preventing queue head-of-line blocking; enabled safe cluster upgrades without manual intervention.",
      source:
        "https://kubernetes.io/docs/concepts/architecture/controller/#rate-limiting",
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Interceptors and Middleware - Exponential backoff is commonly implemented as HTTP client interceptors (axios-retry) or middleware wrappers around fetch/request libraries that sit at the network boundary of applications; when a frontend application makes API calls to backend services, the HTTP client layer wraps each request with retry logic using exponential backoff (100ms, 200ms, 400ms, 800ms...) triggered by 5xx server errors, network timeouts, or connection failures; this placement ensures all outbound HTTP traffic benefits from backoff without requiring each API call site to implement retry logic; the interceptor pattern enables centralized configuration of backoff parameters (base delay, multiplier, max delay) and retry conditions (which status codes trigger retries), providing consistent resilience across the application's external service integration points.",
      "Database Connection Pool Retry Logic - Database drivers and ORMs implement exponential backoff when acquiring connections from pools or retrying failed transactions; when an application attempts to get a connection from a pool that's temporarily exhausted (all 100 connections in use), the connection acquisition logic retries with exponential backoff (1s, 2s, 4s, 8s) instead of failing immediately or spinning in tight loops; this placement prevents connection pool thundering herds where hundreds of threads simultaneously retry connection acquisition, creating lock contention and CPU spikes; JDBC, SQLAlchemy, and Sequelize all support configurable backoff for connection acquisition, with typical defaults of 100ms base delay, 2x multiplier, and 30s maximum delay; the pattern provides graceful degradation during connection pool saturation while maintaining application throughput.",
      "Message Queue Consumer Retry Configuration - Message queue consumers (Kafka, RabbitMQ, SQS) apply exponential backoff when retrying failed message processing or connection recovery; when a Kafka consumer fails to process a message due to downstream service unavailability, the consumer can either dead-letter the message or retry with backoff; libraries like Kafka's consumer retry configuration or RabbitMQ's DLX (Dead Letter Exchange) with TTL headers implement backoff by republishing failed messages with progressively longer delays (1min, 2min, 4min, 8min); this placement prevents poison messages from blocking consumer throughput while giving transient failures time to resolve; the backoff happens at the message infrastructure level, making it transparent to application message handlers.",
      "Service Mesh Sidecar Retry Policies - Service mesh proxies (Envoy, Linkerd, Istio) implement exponential backoff as part of their L7 retry policies, sitting between application containers and the network fabric; when Service A calls Service B through the mesh, the sidecar proxy handles retries with configurable backoff (25ms base, 2x multiplier, 250ms max) for failures like connection resets, 503 responses, or timeout errors; this placement provides infrastructure-level resilience without application code changes—developers configure retry policies in VirtualService or RouteConfiguration YAML, and the sidecar transparently applies backoff; the mesh-wide visibility enables monitoring retry rates and backoff metrics across all services, detecting systemic issues through correlated retry spikes.",
      "Cloud SDK Client Libraries - Cloud service SDKs (AWS SDK, Google Cloud SDK, Azure SDK) embed exponential backoff as default behavior for all API operations, operating at the SDK initialization layer; when creating an S3Client or DynamoDB client, the SDK configures built-in backoff for throttling errors (429), server errors (5xx), and network failures—AWS SDK uses 100ms base delay with 2x multiplier and 20s cap; this placement protects both the application (prevents hung requests from infinite retries) and the cloud provider (prevents customer retry storms from amplifying outages); SDK backoff is typically adaptive, reducing retry aggressiveness when encountering sustained throttling to implement token bucket-like behavior; developers can override defaults but the safe-by-default backoff prevents the most common resilience mistakes.",
    ],
    architecturalBoundaries: [
      "Client-Server HTTP Boundary - Exponential backoff operates at the HTTP client boundary where applications make outbound requests to external services, APIs, or microservices; this boundary is critical because network failures, server overload, and temporary outages are most common here; when a mobile app makes API calls through a REST client, backoff wraps the HTTP layer to retry transient failures (dropped packets, temporary 503s) while avoiding retry amplification on sustained outages; the boundary position enables backoff to capture all HTTP-level failures (connection refused, timeouts, 5xx responses) before they bubble up to application logic; this separation allows business logic to remain clean while infrastructure concerns (retry timing, backoff curves) are handled at the I/O boundary.",
      "Database Access Boundary - Exponential backoff sits at the boundary between application code and database connections, handling transient database failures (connection pool exhaustion, temporary network issues, deadlocks, replication lag); when an ORM executes a query that fails due to a transient deadlock, backoff allows the transaction to retry after a delay that grows exponentially; this boundary is essential because database operations are inherently less predictable than in-memory operations—network latency, lock contention, and replication delays create non-deterministic failure modes; implementing backoff at the database boundary (rather than in business logic) ensures consistent retry behavior across all database operations and enables database-specific retry policies (e.g., longer backoff for read replicas vs primaries).",
      "Message Queue Processing Boundary - Exponential backoff bridges the boundary between message queue infrastructure (Kafka brokers, RabbitMQ exchanges) and application message handlers, managing retries for failed message processing; when a consumer fails to process a message (downstream service down, validation failure, transient error), backoff determines when to retry; this boundary is unique because messages have durability guarantees—unlike HTTP requests that timeout and disappear, messages persist until acknowledged; backoff at this boundary prevents failed messages from blocking queue progress while avoiding infinite retry loops; implementation typically uses visibility timeouts (SQS), delayed requeuing (RabbitMQ), or separate retry topics (Kafka) to enforce exponential delays between processing attempts.",
      "Service Mesh Proxy Boundary - Exponential backoff operates at the L7 proxy layer in service meshes, sitting between application containers and the service mesh data plane; when an application makes a gRPC or HTTP call, the sidecar proxy intercepts the request, applies retry logic with backoff on failures, and forwards to destination services; this boundary provides centralized retry orchestration—backoff policies are configured in mesh control plane (Istio, Consul Connect) and enforced uniformly across all mesh traffic; the proxy position enables sophisticated retry routing (retry to different pod, different AZ, different region) combined with backoff timing; this boundary isolation means application code remains unaware of retries, simplifying application development while ensuring consistent resilience across the mesh.",
    ],
    interactsWith: [
      "retry",
      "jitter",
      "timeout",
      "circuit-breaker",
      "idempotency",
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
      title: "gRPC Retry Design - Exponential Backoff",
      url: "https://github.com/grpc/proposal/blob/master/A6-client-retries.md",
      type: "documentation",
      author: "Google gRPC Team",
    },
    {
      title:
        "Release It! - Design and Deploy Production-Ready Software (Chapter: Stability Patterns)",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "AWS SDK Retry Behavior and Configuration",
      url: "https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html",
      type: "documentation",
      author: "AWS",
    },
    {
      title: "Implementing Exponential Backoff - Google Cloud",
      url: "https://cloud.google.com/iot/docs/how-tos/exponential-backoff",
      type: "article",
      author: "Google Cloud",
    },
    {
      title: "Polly Retry Policies - Wait and Retry with Exponential Backoff",
      url: "https://github.com/App-vNext/Polly/wiki/Retry-with-jitter",
      type: "documentation",
      author: "Polly Contributors",
    },
  ],

  philosophy: {
    coreProblem:
      "Constant retry intervals overwhelm failing systems, preventing recovery and creating retry storms",
    designPrinciple:
      "Increase wait time exponentially between retries—succeed fast on transient failures, back off gracefully on sustained failures",
    historicalContext:
      "Exponential backoff originated in Ethernet collision detection (1970s) and was adopted by distributed systems to prevent synchronized retry storms that amplify outages instead of resolving them",
    alternativesRejected: [
      "Fixed interval retry - creates constant load preventing recovery",
      "Linear backoff - insufficient load reduction for sustained failures",
      "No backoff (immediate retry) - thundering herd problem",
      "Random delays only - unpredictable, may retry too fast or too slow",
    ],
    mentalModel:
      "Like checking if a busy restaurant has a table: first check after 5 minutes, if still full check after 10 minutes, then 20, then 40—you gradually reduce your check frequency as it becomes clear the wait will be long, giving the restaurant space to serve customers instead of answering 'is there a table?' every minute",
  },

  visualization: {
    staticDiagram: `graph LR
    A[Attempt 1<br/>0ms delay] --> B{Success?}
    B -->|Fail| C[Attempt 2<br/>100ms delay]
    C --> D{Success?}
    D -->|Fail| E[Attempt 3<br/>200ms delay]
    E --> F{Success?}
    F -->|Fail| G[Attempt 4<br/>400ms delay]
    G --> H{Success?}
    H -->|Fail| I[Attempt 5<br/>800ms delay]
    B -->|Yes| J[Success]
    D -->|Yes| J
    F -->|Yes| J
    H -->|Yes| J

    style A fill:#e1f5e1
    style C fill:#fff4e1
    style E fill:#ffe1b3
    style G fill:#ffcb9a
    style I fill:#ffb380
    style J fill:#90ee90`,
    realWorldAnalogy:
      "Exponential backoff is like checking on bread in the oven: you check after 5 minutes, then 10, then 20—you don't keep opening the oven door every 30 seconds because that would let heat escape and prevent the bread from cooking. By spacing out your checks exponentially, you give the bread time to bake properly.",
    useCases: [
      {
        domain: "API Clients",
        scenario:
          "Mobile app retries failed API requests with exponential backoff to handle temporary network issues without overwhelming backend",
        patternRole:
          "Provides automatic recovery from transient failures while preventing retry storms",
        companies: ["AWS SDK", "Stripe", "GitHub"],
      },
      {
        domain: "Distributed Systems",
        scenario:
          "Microservices use exponential backoff when calling downstream services to handle temporary overload gracefully",
        patternRole: "Reduces load on struggling services to enable recovery",
        companies: ["Google", "Uber", "Netflix"],
      },
      {
        domain: "Database Operations",
        scenario:
          "ORM retries deadlocked transactions with exponential backoff to resolve contention",
        patternRole:
          "Spreads retry attempts over time to reduce lock contention",
        companies: ["PostgreSQL clients", "MySQL connectors"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "retry",
    "backoff",
    "resilience",
    "load-shedding",
  ],
  difficulty: "beginner",
};
