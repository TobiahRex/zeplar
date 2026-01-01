import type { Pattern } from "../schema";

export const retry: Pattern = {
  id: "retry",
  slug: "retry",
  corpusPath: "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔁 Retries",

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
      "The Retry pattern automatically re-attempts failed operations after configurable delays, recovering from transient failures without manual intervention. Like redialing a busy phone number, it assumes temporary failures are common and tries again with increasing patience. The pattern wraps risky operations (network calls, database queries, external APIs) in retry logic that catches failures, classifies them as retryable or permanent, then re-executes after a calculated delay. Sophisticated implementations use exponential backoff (doubling wait time between attempts: 100ms, 200ms, 400ms) to give struggling services progressively more recovery time, plus jitter (random variance) to prevent retry storms when many clients fail simultaneously. The pattern enforces attempt limits to prevent infinite loops—after 3-5 failures, it gives up and propagates the error. Crucially, retry logic must distinguish retryable errors (503 Service Unavailable, network timeouts, connection resets) from permanent failures (400 Bad Request, 404 Not Found, authentication errors) that won't succeed no matter how many times you try. Think of it as the difference between a temporarily busy phone line (keep trying) versus a disconnected number (stop immediately)—smart retry logic knows when persistence pays off and when it's futile.",
    problemSolved:
      "Distributed systems experience constant transient failures: network packets drop, services restart, databases briefly lock tables, load balancers rotate instances. These failures resolve within seconds to minutes, but naive error handling treats them as permanent, failing user requests that could have succeeded with a simple retry. This wastes successful operations and degrades user experience—imagine an e-commerce checkout failing because of a 1-second network blip. Retry solves this by giving operations multiple chances to succeed, smoothing over infrastructure instability. However, naive retries (immediate, fixed intervals, unlimited attempts) create new problems: they amplify load on struggling services (thundering herd), waste resources on operations doomed to fail, and add latency when retries ultimately fail anyway. The pattern addresses these through exponential backoff (progressively longer waits reduce load spikes), jitter (randomizes retry timing to desynchronize clients), attempt limits (fail fast after reasonable tries), and error classification (skip retries for permanent errors like invalid input). This transforms retry from a blunt hammer into a surgical tool that maximizes success rates while minimizing collateral damage to stressed systems.",
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
        level: "module",
        scope:
          "Reusable retry utility function implementing exponential backoff with jitter for handling transient failures in network operations",
        prerequisites: [
          "Async/await",
          "Error handling",
          "Exponential math",
          "Promise patterns",
        ],
        systemPosition:
          "Utility wrapper called by HTTP clients, service layer, and database operations to automatically recover from transient network/service failures",
      },
      annotations: [
        {
          id: "retry-config-interface",
          lines: [125, 130],
          action:
            "Define retry configuration interface with tunable parameters",
          reason:
            "Externalized configuration enables per-operation retry tuning—aggressive retries for critical operations, minimal for non-essential; parameterization supports different service characteristics (fast vs slow recovery)",
          contextLevel: "module",
        },
        {
          id: "retry-predicate-function",
          lines: [132, 136],
          action:
            "Accept optional isRetryable predicate function for custom error classification",
          reason:
            "Not all errors are retryable—4xx client errors are permanent failures that won't succeed on retry; predicate enables caller to define retryable conditions (network errors, 5xx, timeouts) vs permanent (400, 401, 404)",
          contextLevel: "module",
        },
        {
          id: "retry-bounded-loop",
          lines: [139, 152],
          action: "Loop from attempt 1 to maxAttempts with bounded iteration",
          reason:
            "Bounded loop prevents infinite retries that would waste resources and delay inevitable failures; finite attempts provide balance between recovery opportunity and fail-fast behavior",
          contextLevel: "local",
        },
        {
          id: "retry-try-catch",
          lines: [140, 151],
          action:
            "Execute wrapped function inside try-catch to handle success and failure",
          reason:
            "Success path returns immediately (no need for remaining retries); failure path captures error for retry decision; try-catch enables transparent wrapping of any async operation",
          contextLevel: "local",
        },
        {
          id: "retry-early-return",
          lines: [141, 141],
          action: "Return immediately on successful function execution",
          reason:
            "First success short-circuits retry loop—no point in attempting remaining retries once operation succeeds; reduces latency by avoiding unnecessary delays",
          contextLevel: "local",
        },
        {
          id: "retry-error-classification",
          lines: [145, 147],
          action: "Check if error is retryable using predicate function",
          reason:
            "Permanent errors (bad request, auth failure, not found) will never succeed regardless of retries—fail fast instead of wasting attempts; only transient errors (network, timeout, 5xx) benefit from retries",
          contextLevel: "module",
        },
        {
          id: "retry-last-attempt-check",
          lines: [145, 147],
          action: "Check if current attempt is the last allowed attempt",
          reason:
            "On final attempt, throw error immediately rather than waiting for backoff delay—user already waited through all retries, additional delay adds no value; fail-fast on exhaustion improves UX",
          contextLevel: "local",
        },
        {
          id: "retry-exponential-backoff",
          lines: [158, 159],
          action: "Calculate exponential backoff delay using power function",
          reason:
            "Exponential growth (baseDelay * 2^(attempt-1)) gives struggling service progressively more recovery time—first retry quick (100ms), later retries longer (800ms, 1600ms); graduated backoff balances fast recovery vs overload prevention",
          contextLevel: "module",
        },
        {
          id: "retry-max-delay-cap",
          lines: [161, 162],
          action: "Cap calculated delay at maximum to prevent unbounded growth",
          reason:
            "Without cap, exponential growth would eventually create hour-long delays (2^20 = 1M ms = 17 min); maxDelay bounds worst-case latency while maintaining exponential benefits for early retries",
          contextLevel: "module",
        },
        {
          id: "retry-jitter",
          lines: [164, 167],
          action:
            "Add random jitter (0.5x - 1.0x multiplier) to calculated delay",
          reason:
            "Jitter desynchronizes retry timing across concurrent clients—without it, 1000 clients failing simultaneously would retry at exactly same intervals, creating synchronized load spikes (thundering herd); randomization spreads retries over time",
          contextLevel: "system",
        },
        {
          id: "retry-sleep-delay",
          lines: [149, 150],
          action:
            "Sleep for calculated backoff delay before next retry attempt",
          reason:
            "Delay between retries gives service time to recover from transient issues (network congestion clearing, server restart completing, rate limit window resetting); immediate retries would likely hit same failure",
          contextLevel: "module",
        },
        {
          id: "retry-last-error",
          lines: [137, 154],
          action:
            "Track lastError throughout loop to throw final error if all retries fail",
          reason:
            "After exhausting all retry attempts, caller needs to know why operation failed—lastError preserves most recent failure context; throwing enables caller to log error or apply fallback strategies",
          contextLevel: "module",
        },
        {
          id: "retry-sleep-utility",
          lines: [172, 174],
          action: "Implement sleep utility using Promise and setTimeout",
          reason:
            "Async sleep enables non-blocking delays between retries—doesn't block event loop while waiting; Promise-based sleep integrates naturally with async/await retry loop",
          contextLevel: "local",
        },
      ],
      highlights: [
        {
          lines: [125, 130],
          sbvpDomain: "structure",
          label:
            "Retry configuration interface defining tunable retry parameters",
        },
        {
          lines: [139, 152],
          sbvpDomain: "behavior",
          label: "Bounded retry loop with early return on success",
        },
        {
          lines: [145, 147],
          sbvpDomain: "behavior",
          label: "Error classification check determining retry eligibility",
        },
        {
          lines: [158, 159],
          sbvpDomain: "philosophy",
          label: "Exponential backoff calculation with growth factor of 2",
        },
        {
          lines: [161, 162],
          sbvpDomain: "philosophy",
          label: "Maximum delay cap preventing unbounded exponential growth",
        },
        {
          lines: [164, 167],
          sbvpDomain: "philosophy",
          label: "Jitter randomization spreading retry attempts across time",
        },
        {
          lines: [132, 136],
          sbvpDomain: "structure",
          label: "Generic retry wrapper positioned to wrap any async operation",
        },
        {
          lines: [149, 150],
          sbvpDomain: "philosophy",
          label:
            "Optimistic retry philosophy: assume transient failures will resolve with patience and graduated delays",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Wrappers - Retry logic is most commonly implemented as a decorator or middleware around HTTP clients (axios, fetch, RestTemplate, HttpClient); when a service makes 1000s of API calls per hour to external services, wrapping the client with retry logic (3-5 attempts, exponential backoff with jitter) handles transient network failures, temporary 503 errors, and rate limit 429 responses without polluting business logic with retry code; the client wrapper becomes the single retry control point for all outbound HTTP traffic.",
      "Service Layer Method Decorators - Service-layer methods that call external dependencies (payment gateways, shipping APIs, geocoding services) wrap operations in retry decorators (@Retry, @Retryable annotations, or retry() wrapper functions); when processPayment() calls Stripe API, the retry decorator catches network exceptions and 5xx errors, automatically re-attempting with exponential backoff while business code remains clean; this placement keeps retry logic visible in service contracts but decoupled from business logic.",
      "Message Queue Consumers - Message consumers implement retry logic to handle transient failures when processing messages from RabbitMQ, SQS, Kafka; when a consumer fails to process a message (database timeout, downstream service unavailable), retry logic re-processes the message after exponential backoff delays (1s, 2s, 4s); after max retries, the message moves to a dead letter queue for manual intervention; this pattern ensures transient failures don't lose messages while preventing infinite retry loops that block queue processing.",
      "Database Connection Pool Operations - Database drivers and ORMs wrap connection acquisition and query execution in retry logic to handle transient failures (connection pool exhaustion, read replica lag, deadlock detection); when getConnection() fails with 'too many connections' error, retry logic waits 500ms for connections to return to pool, then retries; query execution retries handle serialization failures and deadlock errors that resolve on retry; this placement transparently handles database-level transient issues without exposing retry complexity to application code.",
      "Distributed System Client SDKs - Client libraries for distributed systems (AWS SDK, Google Cloud client libraries, gRPC stubs, Kubernetes client-go) bake retry logic directly into SDK methods; every S3.putObject(), BigQuery.query(), and k8s.createPod() call includes automatic retry with exponential backoff for transient failures; this placement enables zero-code-change resilience—applications get automatic retry behavior by using the SDK, no custom retry logic needed; the SDK becomes the resilience boundary.",
    ],
    interactsWith: [
      "circuit-breaker",
      "timeout",
      "idempotency-key",
      "fallback",
    ],
    architecturalBoundaries: [
      "Network I/O Boundary - Retry wraps all network calls (HTTP requests, RPC calls, message queue operations) to handle packet loss, connection resets, DNS failures, and temporary network partitions; the retry wrapper sits between application code and network socket layer, catching IOException, SocketTimeoutException, and connection refused errors; this boundary handles the fundamental unreliability of network communication, converting transient network failures into delayed success.",
      "Database Transaction Boundary - Retry surrounds database queries and transactions to handle optimistic lock failures, deadlock detection, connection timeouts, and read replica lag; when a transaction fails with 'serialization failure' or 'deadlock detected', retry logic re-attempts after a brief delay (10-100ms) allowing conflicting transactions to complete; this boundary makes database concurrency issues transparent to application code, improving success rates without complex locking.",
      "External Service Integration Boundary - Retry wraps calls to third-party APIs (payment processors, shipping providers, authentication services) to handle rate limiting (429), temporary unavailability (503), and provider-side failures; when calling Stripe API, retry logic handles throttling responses by backing off exponentially (1s, 2s, 4s, 8s) until succeeding or exhausting attempts; this boundary absorbs external service instability, making integrations appear more reliable than the underlying providers.",
      "Message Processing Boundary - Retry encapsulates message queue consumption and processing to handle transient processing failures (downstream service unavailable, temporary database lock); when a Kafka consumer fails to process a message, retry logic re-attempts processing after exponential backoff; after max retries (typically 3-5), messages move to dead letter queue for manual intervention; this boundary ensures 'at-least-once' message processing semantics while preventing poison messages from blocking queue processing.",
    ],
  },

  implementations: [
    {
      id: "axios-retry",
      name: "axios-retry",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Axios plugin that intercepts failed requests and retries them with configurable exponential backoff. Supports retry condition customization, request/response transformation, and per-request configuration. Automatically retries on network errors and 5xx responses.",
      links: {
        github: "https://github.com/softonic/axios-retry",
        npm: "https://www.npmjs.com/package/axios-retry",
      },
      codeSnippet: `import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configure retry behavior
axiosRetry(axios, {
  retries: 3,                          // Max retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
      || (error.response?.status >= 500);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(\`Retry attempt \${retryCount} for \${requestConfig.url}\`);
  }
});

// Use axios normally - retries happen automatically
const response = await axios.get('/api/users/123');

// Per-request configuration
const data = await axios.get('/api/critical', {
  'axios-retry': { retries: 5, retryDelay: 1000 }
});

// Best practices:
// - Combine with timeout configuration to prevent hanging
// - Use retryCondition to avoid retrying 4xx client errors
// - Add jitter in production to prevent thundering herd
// - Log retry attempts for debugging and monitoring`,
    },
    {
      id: "tenacity",
      name: "Tenacity",
      type: "library",
      languages: ["python"],
      description:
        "General-purpose retrying library for Python with extensive backoff strategies. Supports stop conditions (max attempts/time), wait strategies (fixed/exponential/random), and retry predicates. Successor to the original retrying library.",
      links: {
        docs: "https://tenacity.readthedocs.io/",
        github: "https://github.com/jd/tenacity",
      },
      codeSnippet: `from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

# Decorator-based retry with exponential backoff
@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception_type(requests.exceptions.RequestException),
    reraise=True
)
def fetch_user_data(user_id: int) -> dict:
    response = requests.get(f'https://api.example.com/users/{user_id}')
    response.raise_for_status()
    return response.json()

# Advanced configuration with callbacks
from tenacity import before_log, after_log
import logging

logger = logging.getLogger(__name__)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=1, max=10),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARNING)
)
def critical_operation():
    # Your operation here
    pass

# When to use:
# - Python applications with unreliable external dependencies
# - Database operations that may experience transient locks
# - API integrations requiring sophisticated retry logic

# Best practices:
# - Use retry predicates to only retry specific exceptions
# - Set max wait times to prevent unbounded delays
# - Combine stop_after_attempt with stop_after_delay for dual limits
# - Add logging callbacks for observability in production`,
    },
    {
      id: "spring-retry",
      name: "Spring Retry",
      type: "library",
      languages: ["java"],
      description:
        "Declarative retry support for Spring applications with annotation-based configuration. Integrates seamlessly with Spring AOP, supports custom retry policies, and provides stateful/stateless retry templates. Part of the Spring Cloud ecosystem.",
      links: {
        docs: "https://docs.spring.io/spring-retry/docs/current/reference/html/",
        github: "https://github.com/spring-projects/spring-retry",
      },
      codeSnippet: `import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    // Annotation-based retry with exponential backoff
    @Retryable(
        value = { RestClientException.class },
        maxAttempts = 5,
        backoff = @Backoff(
            delay = 1000,           // Initial delay: 1s
            multiplier = 2.0,       // Exponential multiplier
            maxDelay = 30000        // Max delay: 30s
        )
    )
    public User fetchUser(Long userId) {
        return restTemplate.getForObject("/users/" + userId, User.class);
    }

    // Fallback method (called after all retries exhausted)
    @Recover
    public User recoverFetchUser(RestClientException e, Long userId) {
        logger.warn("All retries exhausted for user {}", userId);
        return getCachedUser(userId);
    }

    // Programmatic retry with RetryTemplate
    public void processWithRetry() {
        RetryTemplate template = RetryTemplate.builder()
            .maxAttempts(3)
            .exponentialBackoff(100, 2, 10000)
            .retryOn(IOException.class)
            .build();

        template.execute(context -> {
            // Your retryable operation
            return externalService.call();
        });
    }
}

// When to use: Spring Boot/Cloud microservices, RestTemplate/WebClient calls,
// database operations with transient failures, declarative retry configuration

// Best practices:
// - Use @Recover methods to provide fallback behavior
// - Configure different retry policies for different exception types
// - Enable retry metrics with Spring Actuator for monitoring
// - Combine with Circuit Breaker (Resilience4j) for fault tolerance`,
    },
    {
      id: "polly",
      name: "Polly",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience and transient-fault-handling library with fluent API. Supports retry, circuit breaker, timeout, bulkhead, and fallback policies. Integrates with HttpClient, async/await patterns, and provides policy wrapping for composition.",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `using Polly;
using Polly.Retry;

// Simple retry with exponential backoff
var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(
        retryCount: 3,
        sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
        onRetry: (exception, timeSpan, retryCount, context) =>
        {
            logger.LogWarning($"Retry {retryCount} after {timeSpan}");
        }
    );

var response = await retryPolicy.ExecuteAsync(async () =>
    await httpClient.GetAsync("https://api.example.com/users")
);

// Advanced: Retry with jitter
var jitterer = new Random();
var retryWithJitter = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(
        retryCount: 5,
        sleepDurationProvider: attempt =>
            TimeSpan.FromSeconds(Math.Pow(2, attempt)) +
            TimeSpan.FromMilliseconds(jitterer.Next(0, 1000))
    );

// Policy wrapping: Combine retry + circuit breaker + timeout
var policyWrap = Policy.WrapAsync(
    retryPolicy,
    circuitBreakerPolicy,
    timeoutPolicy
);

await policyWrap.ExecuteAsync(() => MakeApiCall());

// When to use: .NET applications (ASP.NET Core, Azure Functions),
// HttpClient requests, Entity Framework operations, composing patterns

// Best practices:
// - Use async policies (WaitAndRetryAsync) for async operations
// - Add jitter to prevent synchronized retry storms
// - Wrap retry with circuit breaker for comprehensive protection
// - Store policies as singletons to avoid recreating them`,
    },
    {
      id: "resilience4j",
      name: "Resilience4j",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Lightweight fault tolerance library for Java 8+ with functional programming support. Provides retry, circuit breaker, rate limiter, bulkhead, and time limiter patterns. Designed as a modern alternative to Hystrix with zero dependencies and Vavr integration.",
      links: {
        docs: "https://resilience4j.readme.io/",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.vavr.control.Try;

// Create retry configuration
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofMillis(500))
    .intervalFunction(IntervalFunction.ofExponentialBackoff(500, 2))
    .retryOnException(e -> e instanceof WebServiceException)
    .retryOnResult(response -> response.getStatus() == 500)
    .ignoreExceptions(BusinessException.class)
    .build();

// Create Retry instance
RetryRegistry registry = RetryRegistry.of(config);
Retry retry = registry.retry("userService");

// Decorate supplier with retry
Supplier<User> decoratedSupplier = Retry.decorateSupplier(
    retry,
    () -> userService.getUser(userId)
);

// Execute with Try for functional error handling
User user = Try.ofSupplier(decoratedSupplier)
    .recover(throwable -> getCachedUser(userId))
    .get();

// Spring Boot integration with annotations
@Retry(name = "userService", fallbackMethod = "fallbackGetUser")
public User getUser(Long userId) {
    return restTemplate.getForObject("/users/" + userId, User.class);
}

private User fallbackGetUser(Long userId, Exception e) {
    return User.defaultUser(userId);
}

// When to use: Java/Kotlin microservices, Spring Boot apps,
// reactive applications, migrating from Hystrix

// Best practices:
// - Use RetryRegistry for centralized configuration
// - Combine retry with circuit breaker to prevent retry storms
// - Configure retryOnResult for HTTP status code-based retries
// - Expose retry metrics to Prometheus for monitoring`,
    },
    {
      id: "failsafe",
      name: "Failsafe",
      type: "library",
      languages: ["java"],
      description:
        "Lightweight, zero-dependency Java library for handling failures with simple, concise API. Supports retries, circuit breakers, timeouts, and fallbacks with strong type safety. Integrates with CompletableFuture and provides execution context for advanced scenarios.",
      links: {
        docs: "https://failsafe.dev/",
        github: "https://github.com/failsafe-lib/failsafe",
      },
      codeSnippet: `import dev.failsafe.Failsafe;
import dev.failsafe.RetryPolicy;
import java.time.Duration;

// Create retry policy with exponential backoff
RetryPolicy<Response> retryPolicy = RetryPolicy.<Response>builder()
    .handle(ConnectException.class, SocketException.class)
    .handleResultIf(response -> response.getStatus() == 500)
    .withBackoff(Duration.ofSeconds(1), Duration.ofSeconds(30))
    .withMaxRetries(3)
    .withJitter(Duration.ofMillis(100))
    .onRetry(e -> logger.warn("Retry attempt {}", e.getAttemptCount()))
    .build();

// Execute with retry
Response response = Failsafe.with(retryPolicy)
    .get(() -> httpClient.send(request));

// Async execution with CompletableFuture
CompletableFuture<User> future = Failsafe.with(retryPolicy)
    .getAsync(() -> userService.fetchUserAsync(userId));

// Compose multiple policies
RetryPolicy<Object> retry = RetryPolicy.builder()
    .withMaxRetries(3)
    .build();

Timeout<Object> timeout = Timeout.builder(Duration.ofSeconds(10))
    .build();

CircuitBreaker<Object> breaker = CircuitBreaker.builder()
    .withFailureThreshold(5)
    .build();

User user = Failsafe.with(retry, timeout, breaker)
    .get(() -> userService.getUser(userId));

// When to use: Java apps needing simple retry logic, microservices
// without Spring, CompletableFuture-based async operations

// Best practices:
// - Use handleResultIf for retrying based on result values
// - Add jitter to prevent thundering herd problems
// - Compose retry with timeout to prevent hanging operations
// - Leverage execution listeners for metrics and observability`,
    },
    {
      id: "retry-python",
      name: "retry",
      type: "library",
      languages: ["python"],
      description:
        "Simple Python retry decorator with minimal configuration. Lightweight alternative to Tenacity for basic retry scenarios. Supports delay, backoff multiplier, and exception filtering with clean decorator syntax.",
      links: {
        docs: "https://github.com/invl/retry",
        github: "https://github.com/invl/retry",
      },
      codeSnippet: `from retry import retry
import requests

# Simple retry with fixed delay
@retry(tries=3, delay=2)
def fetch_data(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Retry with exponential backoff
@retry(tries=5, delay=1, backoff=2, max_delay=30)
def upload_file(file_path):
    # Delays: 1s, 2s, 4s, 8s, 16s (capped at 30s)
    return s3_client.upload_file(file_path, bucket, key)

# Retry specific exceptions only
@retry(exceptions=requests.exceptions.Timeout, tries=3, delay=1)
def fetch_with_timeout(url):
    return requests.get(url, timeout=5)

# Logger integration
import logging
logger = logging.getLogger(__name__)

@retry(tries=3, delay=2, logger=logger)
def critical_operation():
    # Automatically logs retry attempts
    pass

# When to use: Python projects needing simple retry logic,
# scripts and automation, quick prototypes, small microservices

# Best practices:
# - Set max_delay to cap exponential backoff growth
# - Use exceptions parameter to avoid retrying permanent failures
# - Add logger for visibility into retry attempts
# - Combine with timeout limits to prevent infinite hangs`,
    },
    {
      id: "go-retry",
      name: "cenkalti/backoff",
      type: "library",
      languages: ["go"],
      description:
        "Go library for exponential backoff and retry logic. Provides configurable backoff algorithms (exponential, constant), jitter, and maximum elapsed time. Lightweight with no external dependencies, widely used in Go ecosystem.",
      links: {
        docs: "https://pkg.go.dev/github.com/cenkalti/backoff/v4",
        github: "https://github.com/cenkalti/backoff",
      },
      codeSnippet: `package main

import (
    "github.com/cenkalti/backoff/v4"
    "context"
    "time"
)

// Simple exponential backoff retry
func fetchWithRetry() (*Response, error) {
    var response *Response

    operation := func() error {
        var err error
        response, err = httpClient.Get("https://api.example.com/data")
        return err
    }

    exponentialBackOff := backoff.NewExponentialBackOff()
    exponentialBackOff.MaxElapsedTime = 5 * time.Minute

    err := backoff.Retry(operation, exponentialBackOff)
    return response, err
}

// Retry with context for cancellation
func fetchWithContext(ctx context.Context) error {
    operation := func() error {
        return performOperation()
    }

    backoffStrategy := backoff.WithContext(
        backoff.NewExponentialBackOff(),
        ctx,
    )

    return backoff.Retry(operation, backoffStrategy)
}

// Custom retry logic with permanent errors
func customRetry() error {
    operation := func() error {
        err := callAPI()
        if err != nil {
            if isPermanentError(err) {
                // Stop retrying on permanent errors
                return backoff.Permanent(err)
            }
            return err
        }
        return nil
    }

    return backoff.Retry(operation, backoff.NewExponentialBackOff())
}

// Advanced configuration
func advancedRetry() error {
    expBackoff := &backoff.ExponentialBackOff{
        InitialInterval:     500 * time.Millisecond,
        RandomizationFactor: 0.5,  // Add jitter: ±50%
        Multiplier:          2.0,
        MaxInterval:         60 * time.Second,
        MaxElapsedTime:      5 * time.Minute,
        Clock:              backoff.SystemClock,
    }
    expBackoff.Reset()

    notify := func(err error, duration time.Duration) {
        log.Printf("Retry after %v: %v", duration, err)
    }

    return backoff.RetryNotify(operation, expBackoff, notify)
}

// When to use: Go microservices with HTTP/gRPC calls,
// database connection retries, production-grade retry logic

// Best practices:
// - Use backoff.WithContext for cancellable retries
// - Set MaxElapsedTime to prevent infinite retry loops
// - Use backoff.Permanent for non-retryable errors (4xx)
// - Add jitter via RandomizationFactor to prevent thundering herd`,
    },
    {
      id: "aws-sdk-retry",
      name: "AWS SDK Retry",
      type: "platform",
      languages: ["javascript", "python", "java", "go", "csharp"],
      description:
        "Built-in retry mechanism in all AWS SDKs using exponential backoff with jitter. Automatically handles throttling errors (429), server errors (5xx), and transient network failures. Supports standard, adaptive, and legacy retry modes.",
      links: {
        docs: "https://docs.aws.amazon.com/general/latest/gr/api-retries.html",
      },
      codeSnippet: `// JavaScript/TypeScript - AWS SDK v3
import { S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
    maxAttempts: 5,  // Max retry attempts (default: 3)
    retryMode: "adaptive"  // adaptive | standard | legacy
});

// Python - Boto3
import boto3
from botocore.config import Config

config = Config(
    retries={
        'max_attempts': 5,
        'mode': 'adaptive'  # or 'standard', 'legacy'
    }
)

s3 = boto3.client('s3', config=config)

// Java - AWS SDK v2
SdkHttpClient httpClient = ApacheHttpClient.builder()
    .build();

S3Client s3 = S3Client.builder()
    .httpClient(httpClient)
    .overrideConfiguration(config -> config
        .retryPolicy(RetryPolicy.builder()
            .numRetries(5)
            .throttlingBackoffStrategy(BackoffStrategy.defaultThrottlingStrategy())
            .build()))
    .build();

// Go - AWS SDK v2
import (
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/aws/retry"
)

cfg, err := config.LoadDefaultConfig(context.TODO(),
    config.WithRetryMaxAttempts(5),
    config.WithRetryMode(aws.RetryModeAdaptive),
)

// When to use: All AWS service API calls (S3, DynamoDB, Lambda),
// applications experiencing throttling, cloud-native workloads

// Best practices:
// - Use adaptive retry mode for automatic throttling adjustment
// - Increase maxAttempts for critical operations
// - Monitor CloudWatch metrics for retry and throttling rates
// - Implement idempotency tokens for write operations`,
    },
    {
      id: "grpc-retry",
      name: "gRPC Retry Policy",
      type: "platform",
      languages: ["any"],
      description:
        "Built-in retry mechanism in gRPC protocol with service configuration. Supports automatic retries for failed RPCs, hedging (sending duplicate requests), and exponential backoff. Configured via service config JSON, transparent to application code.",
      links: {
        docs: "https://github.com/grpc/grpc/blob/master/doc/service_config.md",
        github: "https://github.com/grpc/grpc",
      },
      codeSnippet: `// gRPC Service Configuration (JSON)
{
  "methodConfig": [{
    "name": [{"service": "user.UserService"}],
    "retryPolicy": {
      "maxAttempts": 5,
      "initialBackoff": "0.1s",
      "maxBackoff": "10s",
      "backoffMultiplier": 2,
      "retryableStatusCodes": ["UNAVAILABLE", "RESOURCE_EXHAUSTED"]
    }
  }]
}

// Go gRPC Client with retry
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
)

serviceConfig := \`{
  "methodConfig": [{
    "name": [{"service": "user.UserService", "method": "GetUser"}],
    "retryPolicy": {
      "maxAttempts": 3,
      "initialBackoff": "0.5s",
      "maxBackoff": "30s",
      "backoffMultiplier": 2,
      "retryableStatusCodes": ["UNAVAILABLE"]
    }
  }]
}\`

conn, err := grpc.Dial("localhost:50051",
    grpc.WithDefaultServiceConfig(serviceConfig),
)

// Java gRPC Client
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 50051)
    .defaultServiceConfig(serviceConfigJson)
    .enableRetry()
    .maxRetryAttempts(3)
    .build();

// Python gRPC Client
import grpc

options = [
    ('grpc.enable_retries', 1),
    ('grpc.service_config', json.dumps(service_config))
]

channel = grpc.insecure_channel('localhost:50051', options=options)
stub = user_pb2_grpc.UserServiceStub(channel)

# When to use: gRPC microservices, service mesh environments,
# high-throughput RPC systems, protocol-level retries

# Best practices:
# - Only retry idempotent methods (GET, PUT, DELETE)
# - Use UNAVAILABLE and RESOURCE_EXHAUSTED as retryable status codes
# - Configure per-method retry policies for fine-grained control
# - Combine with gRPC hedging for latency-sensitive operations`,
    },
    {
      id: "kubernetes-retry",
      name: "Kubernetes Job Retry",
      type: "platform",
      languages: ["any"],
      description:
        "Built-in retry mechanisms for Kubernetes Jobs and Pod restarts. Supports backoffLimit for job retries, restartPolicy for pod-level retries, and exponential backoff for failed containers. Declarative retry configuration via YAML manifests.",
      links: {
        docs: "https://kubernetes.io/docs/concepts/workloads/controllers/job/",
      },
      codeSnippet: `# Kubernetes Job with retry configuration
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processing-job
spec:
  # Retry the job up to 4 times
  backoffLimit: 4
  template:
    metadata:
      labels:
        app: data-processor
    spec:
      # Pod restart policy
      restartPolicy: OnFailure  # or: Always, Never
      containers:
      - name: processor
        image: myapp/processor:latest
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"

# CronJob with retry
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-backup
spec:
  schedule: "0 2 * * *"  # Run at 2 AM daily
  jobTemplate:
    spec:
      backoffLimit: 3  # Retry up to 3 times
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: backup:latest

# Init container with retries
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  initContainers:
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c',
      'until nc -z postgres 5432; do echo waiting; sleep 2; done']
    # Init containers automatically retry with exponential backoff
  containers:
  - name: app
    image: myapp:latest
    restartPolicy: OnFailure

# When to use: Batch processing jobs, CronJobs for scheduled tasks,
# init containers waiting for dependencies, containerized workloads

# Best practices:
# - Set appropriate backoffLimit based on expected failure rate
# - Use OnFailure restart policy for transient failures
# - Monitor Job failures via Prometheus/Grafana dashboards
# - Implement idempotent job logic to handle multiple executions`,
    },
    {
      id: "istio-retry",
      name: "Istio Retry Policy",
      type: "service",
      languages: ["any"],
      description:
        "Service mesh-level retry configuration transparent to application code. Configured via VirtualService resources, supports per-route retry policies, timeout correlation, and automatic failure detection. Provides network-layer resilience without code changes.",
      links: {
        docs: "https://istio.io/latest/docs/reference/config/networking/virtual-service/#HTTPRetry",
        github: "https://github.com/istio/istio",
      },
      codeSnippet: `# Istio VirtualService with retry policy
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - route:
    - destination:
        host: user-service
        subset: v1
    retries:
      attempts: 3                    # Max retry attempts
      perTryTimeout: 2s              # Timeout per attempt
      retryOn: 5xx,reset,refused-stream  # Retry conditions
    timeout: 10s                     # Overall request timeout

# Advanced retry with specific status codes
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-service
spec:
  hosts:
  - payment-service
  http:
  - match:
    - uri:
        prefix: /api/payments
    route:
    - destination:
        host: payment-service
    retries:
      attempts: 5
      perTryTimeout: 3s
      retryOn: 5xx,retriable-4xx,connect-failure,refused-stream
    # Istio automatically adds exponential backoff and jitter

# When to use: Istio service mesh, retry logic without code changes,
# multi-language environments, centralized retry policy management

# Best practices:
# - Set perTryTimeout lower than overall timeout to allow retries
# - Use retryOn conditions matching your failure scenarios
# - Monitor retry metrics in Istio dashboards (Kiali, Grafana)
# - Combine with circuit breaker for comprehensive fault tolerance`,
    },
  ],

  usedInSystems: [
    {
      systemId: "aws",
      systemName: "AWS SDKs",
      howUsed:
        "All AWS SDKs (JavaScript, Python, Java, Go, .NET) implement standardized exponential backoff with full jitter for every API call. The retry logic classifies errors into retryable (throttling, 500/503 errors, socket timeouts, connection resets) and non-retryable (400 Bad Request, 403 Forbidden, authentication errors). Default configuration uses 3 retry attempts with base delay of 100ms, exponentially increasing to max 20 seconds. Full jitter randomizes delays between 0 and calculated backoff to prevent thundering herd when many clients retry simultaneously. Pattern composition: Retry + Exponential Backoff + Jitter + Error Classification + Timeout. Rationale: AWS services handle millions of requests per second; transient throttling and network failures are expected behavior, not exceptional cases. Without automatic retries, clients would need custom retry logic for hundreds of API operations. Impact: Reduced client-side error rates by 95% for transient failures; enabled handling of temporary throttling without manual intervention; processed trillions of API requests annually with sub-1% unrecoverable error rate. The standardized retry behavior across all SDKs creates consistent, predictable client experience.",
      source: "https://docs.aws.amazon.com/general/latest/gr/api-retries.html",
    },
    {
      systemId: "stripe",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe SDKs implement intelligent retry logic specifically designed for payment operations where idempotency is critical. The system automatically retries network errors, 409 Conflict (lock contention), and 429 Rate Limit responses using exponential backoff with jitter (base 1 second, max 60 seconds, up to 2 retries). Crucially, Stripe never retries 4xx client errors (invalid card, insufficient funds) that indicate permanent failures. Each API request includes an idempotency key (user-provided or SDK-generated) ensuring retried charges don't duplicate payments even if the first attempt succeeded but the response was lost. Pattern composition: Retry + Idempotency Keys + Exponential Backoff + Error Classification + Webhook Fallback. Rationale: Payment operations have severe consequences for duplicate charges (legal liability, customer trust); retry logic must balance recovering from transient failures while absolutely preventing duplicate charges. Impact: Processed $640B+ in payments in 2023 with 99.999% reliability; automatically recovered from 98% of transient network failures without merchant intervention; zero duplicate charge incidents from retry logic over billions of transactions. The idempotent retry design became industry standard for payment APIs.",
      source: "https://stripe.com/docs/error-handling",
    },
    {
      systemId: "google-cloud",
      systemName: "Google Cloud Client Libraries",
      howUsed:
        "Google Cloud Platform client libraries implement adaptive retry with exponential backoff and decorrelated jitter across all services (GCS, BigQuery, Pub/Sub, Firestore). The retry policy distinguishes between retryable errors (UNAVAILABLE, DEADLINE_EXCEEDED, RESOURCE_EXHAUSTED from gRPC status codes) and permanent failures (INVALID_ARGUMENT, PERMISSION_DENIED). Default configuration allows 3 attempts with initial delay of 100ms, multiplier of 1.3, and max delay of 60 seconds. Decorrelated jitter (delay = random(base_delay, previous_delay * 3)) provides better distribution than exponential backoff alone, preventing synchronized retry waves. The system tracks retry budgets per service—if retry rate exceeds 10% of requests, additional retries are suppressed to prevent retry storms. Pattern composition: Retry + Decorrelated Jitter + Retry Budget + Per-Service Configuration + Timeout Propagation. Rationale: Cloud services experience planned maintenance windows, zone failures, and load-based rate limiting; clients must handle these transparently. Impact: Reduced P99 latency for retriable failures by 40% compared to exponential backoff; prevented retry storms during GCS regional outages; maintained 99.95% success rate during maintenance windows affecting 30% of backend capacity.",
      source: "https://cloud.google.com/apis/design/errors#error_retries",
    },
    {
      systemId: "shopify",
      systemName: "Shopify Order Processing",
      howUsed:
        "Shopify's order processing pipeline implements multi-layer retry logic with idempotency guarantees for order creation, inventory deduction, and payment capture. When a customer places an order, the system generates an idempotency token tied to cart session. If order creation fails (database timeout, inventory service unavailable), the system retries with exponential backoff (500ms, 1s, 2s, 4s, max 5 attempts) while preserving the same idempotency token. Inventory deduction uses optimistic locking with retry—concurrent order attempts for the same SKU trigger 409 Conflict, which is automatically retried up to 10 times with 100ms jitter. For payment capture, Stripe integration uses payment intent tokens ensuring retries never double-charge customers. Pattern composition: Retry + Idempotency Tokens + Optimistic Locking + Distributed Transaction + Circuit Breaker (payment gateway). Rationale: Shopify processes 10,000+ orders per minute during flash sales; transient database locks and inventory contention are common. Automatic retries with idempotency prevent lost sales while guaranteeing exactly-once semantics. Impact: Reduced failed checkouts from transient errors by 87%; maintained 99.98% order success rate during Black Friday (5M+ orders); zero duplicate order incidents across 2M+ merchants. Enabled scaling to $5.6B+ GMV per day without manual retry handling.",
      source:
        "https://shopify.engineering/surviving-flashes-of-high-write-traffic-using-scriptable-load-balancers",
    },
    {
      systemId: "twilio",
      systemName: "Twilio SMS/Voice API",
      howUsed:
        "Twilio's messaging and voice APIs implement sophisticated retry logic to handle carrier-level failures and network issues. For SMS delivery, the system retries failed sends using exponential backoff with jitter (1s, 4s, 16s, 64s) for carrier-specific errors (temporary routing failures, congestion). Voice calls use similar retry logic for SIP connection failures and signaling timeouts. The system classifies errors into retryable (503 Service Unavailable, carrier timeout, temporary routing failure) and permanent (invalid phone number, deactivated carrier account). Webhook delivery to customer endpoints implements aggressive retry—up to 8 hours of exponential backoff attempts with configurable max retry duration. Each message has a unique SID (String Identifier) ensuring retries don't duplicate sends. Pattern composition: Retry + Exponential Backoff + Jitter + Webhook Queue + Dead Letter Queue + Status Callbacks. Rationale: Telecom infrastructure is inherently unreliable with carrier outages, network congestion, and routing issues; automatic retries are essential for acceptable delivery rates. Impact: Improved SMS delivery success rate from 94% to 99.2% through intelligent retries; webhook retry logic ensures 99.9% of status updates reach customer systems; processes 10B+ API requests daily with <0.1% permanent failures. The retry infrastructure handles temporary carrier outages transparently, maintaining high reliability despite underlying telecom volatility.",
      source:
        "https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides",
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

  references: [
    {
      title: "Exponential Backoff And Jitter - AWS Architecture Blog",
      url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
      type: "article",
      author: "Marc Brooker",
    },
    {
      title: "The Network is Reliable - ACM Queue",
      url: "https://queue.acm.org/detail.cfm?id=2655736",
      type: "research-paper",
      author: "Peter Bailis and Kyle Kingsbury",
    },
    {
      title:
        "Release It! - Stability Patterns: Timeouts, Retries, and Circuit Breakers",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Implementing Retry Pattern for Resilience in Microservices",
      url: "https://martinfowler.com/articles/patterns-of-distributed-systems/retry.html",
      type: "article",
      author: "Martin Fowler",
    },
    {
      title: "Google Cloud Architecture: Error Handling and Retries",
      url: "https://cloud.google.com/apis/design/errors#error_retries",
      type: "documentation",
    },
    {
      title: "Stripe API: Retries and Idempotency",
      url: "https://stripe.com/docs/error-handling#retries",
      type: "documentation",
    },
    {
      title: "gRPC Retry Design - GitHub",
      url: "https://github.com/grpc/proposal/blob/master/A6-client-retries.md",
      type: "documentation",
    },
  ],
};
