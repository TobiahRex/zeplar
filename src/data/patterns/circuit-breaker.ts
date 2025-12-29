import type { Pattern } from "../schema";

export const circuitBreaker: Pattern = {
  id: "circuit-breaker",
  slug: "circuit-breaker",
  corpusPath: "🛡️ RELIABILITY → 💔 Fault Tolerance → 🔌 Circuit Breakers",

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
      "The Circuit Breaker pattern prevents cascading failures in distributed systems by wrapping potentially failing external calls in a protective state machine. Like its electrical namesake that cuts power during overload, it monitors failure rates and 'trips' to stop forwarding requests when a downstream service becomes unhealthy. The pattern operates in three states: Closed (normal operation, requests flow through), Open (failure threshold exceeded, requests rejected immediately), and Half-Open (testing recovery with probe requests). When failures exceed a configured threshold, the circuit opens, giving the struggling service breathing room to recover while protecting upstream callers from wasting resources on doomed requests. After a timeout period, it enters Half-Open to cautiously test if the service has recovered. A successful probe closes the circuit and resumes normal flow; a failure reopens it for another timeout cycle. This fail-fast approach transforms slow, resource-draining cascading failures into fast, predictable rejections, enabling graceful degradation and system-wide resilience.",
    problemSolved:
      "In distributed architectures, a single failing downstream service can trigger a domino effect of failures across the entire system. When a service becomes slow or unresponsive, upstream callers continue sending requests, tying up threads, connections, and memory while waiting for timeouts. These blocked resources prevent the system from serving other requests, causing failures to cascade through dependent services. The Circuit Breaker solves this by detecting failure patterns early and failing fast rather than letting requests pile up. It monitors error rates, response times, and timeout occurrences, then stops forwarding requests when thresholds are breached. This immediately frees resources in the calling service and gives the failing service time to recover without continued load. Additionally, it provides explicit hooks for fallback logic, enabling degraded but functional operation rather than complete system failure.",
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
    {
      id: "cb-python-basic",
      language: "python",
      title: "Circuit Breaker in Python with Decorators",
      description:
        "Python implementation using decorators for clean integration",
      code: `from enum import Enum
from time import time, sleep
from functools import wraps
from typing import Callable, TypeVar, ParamSpec

P = ParamSpec('P')
T = TypeVar('T')

class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout: float = 60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time: float | None = None
        self.state = CircuitState.CLOSED

    def call(self, func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise Exception("Circuit breaker is OPEN")

            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except Exception as e:
                self._on_failure()
                raise e

        return wrapper

    def _should_attempt_reset(self) -> bool:
        return (self.last_failure_time is not None and
                time() - self.last_failure_time >= self.reset_timeout)

    def _on_success(self) -> None:
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Usage example
breaker = CircuitBreaker(failure_threshold=3, reset_timeout=30)

@breaker.call
def fetch_user_data(user_id: int) -> dict:
    # Simulated API call that might fail
    import requests
    response = requests.get(f"https://api.example.com/users/{user_id}")
    response.raise_for_status()
    return response.json()`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope: "Full circuit breaker with Python decorator pattern",
        prerequisites: ["Python decorators", "Enums", "Type hints"],
        systemPosition: "Wraps external API calls in service layer",
      },
      annotations: [
        {
          id: "cb-py-decorator",
          lines: [18, 34],
          action: "Decorator function that wraps the protected operation",
          reason:
            "Decorators provide clean syntax in Python for wrapping functions with cross-cutting concerns like circuit breaking",
          contextLevel: "module",
          relatedConcepts: ["decorator-pattern", "aspect-oriented-programming"],
        },
        {
          id: "cb-py-state-check",
          lines: [20, 24],
          action: "Check circuit state and potentially transition to HALF_OPEN",
          reason:
            "Open circuit blocks calls immediately unless timeout expired, preventing wasteful attempts while allowing recovery probes",
          contextLevel: "local",
        },
        {
          id: "cb-py-failure-tracking",
          lines: [41, 46],
          action:
            "Increment failure counter and trip circuit if threshold exceeded",
          reason:
            "Tracking failures over time allows detecting unhealthy services before complete outage",
          contextLevel: "module",
          relatedConcepts: ["failure-detection"],
        },
      ],
      highlights: [
        {
          lines: [18, 34],
          label: "Decorator wrapper with state management",
          sbvpDomain: "structure",
        },
        {
          lines: [48, 56],
          label: "Usage with decorator syntax",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cb-go-basic",
      language: "go",
      title: "Circuit Breaker in Go with Channels",
      description:
        "Go implementation using channels for thread-safe state management",
      code: `package circuitbreaker

import (
    "errors"
    "sync"
    "time"
)

type State int

const (
    StateClosed State = iota
    StateOpen
    StateHalfOpen
)

type CircuitBreaker struct {
    maxFailures     uint32
    resetTimeout    time.Duration

    mu              sync.RWMutex
    state           State
    failures        uint32
    lastFailureTime time.Time
}

func New(maxFailures uint32, resetTimeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures:  maxFailures,
        resetTimeout: resetTimeout,
        state:        StateClosed,
    }
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()

    if cb.state == StateOpen {
        if time.Since(cb.lastFailureTime) > cb.resetTimeout {
            cb.state = StateHalfOpen
        } else {
            cb.mu.Unlock()
            return errors.New("circuit breaker is open")
        }
    }

    cb.mu.Unlock()

    // Execute the protected function
    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failures++
        cb.lastFailureTime = time.Now()

        if cb.failures >= cb.maxFailures {
            cb.state = StateOpen
        }
        return err
    }

    // Success - reset the circuit
    cb.failures = 0
    cb.state = StateClosed
    return nil
}

func (cb *CircuitBreaker) State() State {
    cb.mu.RLock()
    defer cb.mu.RUnlock()
    return cb.state
}

// Usage example
func ExampleUsage() {
    cb := New(5, 60*time.Second)

    err := cb.Call(func() error {
        // Protected operation
        return makeHTTPRequest()
    })

    if err != nil {
        // Handle error or fallback
    }
}

func makeHTTPRequest() error {
    // Simulated HTTP call
    return nil
}`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope: "Thread-safe circuit breaker using Go mutexes",
        prerequisites: ["Go concurrency", "Mutexes", "Goroutines"],
        systemPosition:
          "Protects HTTP client calls in microservice communication layer",
      },
      annotations: [
        {
          id: "cb-go-mutex",
          lines: [16, 20],
          action: "Use RWMutex for thread-safe state access",
          reason:
            "Go applications often have concurrent goroutines; mutex ensures state consistency across threads",
          contextLevel: "system",
          relatedConcepts: ["concurrency", "thread-safety"],
        },
        {
          id: "cb-go-state-transition",
          lines: [30, 38],
          action:
            "Check state and transition from OPEN to HALF_OPEN if timeout expired",
          reason:
            "Must hold lock while checking and updating state to prevent race conditions",
          contextLevel: "local",
        },
        {
          id: "cb-go-deferred-unlock",
          lines: [45, 46],
          action: "Use defer to ensure mutex unlocks even on panic",
          reason:
            "Defer guarantees cleanup; prevents deadlock if protected function panics",
          contextLevel: "micro",
          relatedConcepts: ["resource-cleanup"],
        },
      ],
      highlights: [
        {
          lines: [30, 59],
          label: "Thread-safe state management with mutex",
          sbvpDomain: "structure",
        },
        {
          lines: [72, 82],
          label: "Usage with closure pattern",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cb-opossum-library",
      language: "typescript",
      title: "Circuit Breaker with Opossum Library",
      description:
        "Production-ready implementation using the Opossum Node.js library",
      code: `import CircuitBreaker from 'opossum';
import axios from 'axios';

// Define the function to protect
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response = await axios.get(\`https://api.example.com/users/\${userId}\`);
  return response.data;
}

// Configure circuit breaker options
const options = {
  timeout: 3000,                 // Request timeout (ms)
  errorThresholdPercentage: 50,  // Trip at 50% error rate
  resetTimeout: 30000,           // Attempt reset after 30s
  rollingCountTimeout: 10000,    // Error rate window (10s)
  rollingCountBuckets: 10,       // Granularity of error tracking
  volumeThreshold: 10,           // Minimum requests before tripping

  // Event handlers for monitoring
  onOpen: () => console.log('Circuit opened'),
  onClose: () => console.log('Circuit closed'),
  onHalfOpen: () => console.log('Circuit half-open'),
};

// Create circuit breaker
const userServiceBreaker = new CircuitBreaker(fetchUserProfile, options);

// Fallback function when circuit is open
userServiceBreaker.fallback((userId: string) => {
  console.log(\`Circuit open for user \${userId}, using cached data\`);
  return getCachedUserProfile(userId);
});

// Event listeners for observability
userServiceBreaker.on('success', (result) => {
  metrics.increment('circuit_breaker.success');
});

userServiceBreaker.on('failure', (error) => {
  metrics.increment('circuit_breaker.failure');
  logger.error('Circuit breaker failure:', error);
});

userServiceBreaker.on('open', () => {
  metrics.gauge('circuit_breaker.state', 1);
  alerting.notify('User service circuit opened');
});

userServiceBreaker.on('close', () => {
  metrics.gauge('circuit_breaker.state', 0);
});

// Usage in application
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    // Circuit breaker automatically handles retry logic and state management
    return await userServiceBreaker.fire(userId);
  } catch (error) {
    // This is reached only after all retries and fallbacks have failed
    logger.error(\`Failed to get user profile for \${userId}\`, error);
    throw new UserServiceError('User profile unavailable');
  }
}

function getCachedUserProfile(userId: string): UserProfile {
  // Return cached or default profile
  return { id: userId, name: 'Unknown', cached: true };
}

interface UserProfile {
  id: string;
  name: string;
  cached?: boolean;
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production circuit breaker integration with monitoring, fallbacks, and observability",
        prerequisites: [
          "Node.js",
          "Event emitters",
          "Observability patterns",
          "Fallback strategies",
        ],
        systemPosition:
          "Service layer integration with metrics, logging, and alerting infrastructure",
      },
      annotations: [
        {
          id: "cb-lib-config",
          lines: [11, 23],
          action: "Configure sophisticated circuit breaker behavior",
          reason:
            "Production systems need fine-tuned thresholds, windowing for error rates, and volume thresholds to avoid premature tripping",
          contextLevel: "system",
          relatedConcepts: ["sliding-window", "adaptive-thresholds"],
        },
        {
          id: "cb-lib-fallback",
          lines: [29, 32],
          action: "Define fallback logic for when circuit is open",
          reason:
            "Fallbacks enable graceful degradation: serve cached data or defaults rather than failing completely",
          contextLevel: "system",
          relatedConcepts: ["graceful-degradation", "cache-aside"],
        },
        {
          id: "cb-lib-observability",
          lines: [35, 50],
          action: "Attach event handlers for metrics and alerting",
          reason:
            "Circuit state changes are critical system events; teams need real-time visibility to respond to outages",
          contextLevel: "system",
          relatedConcepts: ["observability", "monitoring", "alerting"],
        },
        {
          id: "cb-lib-fire",
          lines: [56, 57],
          action: "Execute protected call through circuit breaker with .fire()",
          reason:
            "Library handles all state management, timeouts, and fallback execution automatically",
          contextLevel: "local",
        },
      ],
      highlights: [
        {
          lines: [11, 23],
          label: "Production-grade configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [35, 50],
          label: "Observability integration",
          sbvpDomain: "philosophy",
        },
        {
          lines: [54, 62],
          label: "Application usage with error handling",
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
        "Lightweight fault tolerance library for Java 8+ with functional programming support. Provides circuit breaker, retry, rate limiter, bulkhead, and time limiter patterns. Designed as a modern alternative to Hystrix with zero dependencies.",
      links: {
        docs: "https://resilience4j.readme.io/",
        github: "https://github.com/resilience4j/resilience4j",
      },
      codeSnippet: `// Resilience4j CircuitBreaker with Spring Boot
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
  .failureRateThreshold(50)           // Trip at 50% failures
  .slidingWindowSize(100)              // Track last 100 calls
  .waitDurationInOpenState(Duration.ofSeconds(60))
  .permittedNumberOfCallsInHalfOpenState(10)
  .build();

CircuitBreaker breaker = CircuitBreaker.of("userService", config);

// Decorate and execute
Supplier<User> decoratedSupplier = CircuitBreaker
  .decorateSupplier(breaker, () -> userService.getUser(id));

User user = Try.ofSupplier(decoratedSupplier)
  .recover(throwable -> getFallbackUser(id))
  .get();`,
    },
    {
      id: "polly",
      name: "Polly",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience and transient-fault-handling library with fluent API. Supports circuit breaker, retry, timeout, bulkhead, and fallback policies. Integrates seamlessly with HttpClient and async/await patterns.",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `// Polly CircuitBreaker with .NET
var circuitBreakerPolicy = Policy
    .Handle<HttpRequestException>()
    .CircuitBreakerAsync(
        exceptionsAllowedBeforeBreaking: 3,
        durationOfBreak: TimeSpan.FromSeconds(30),
        onBreak: (exception, duration) => {
            logger.LogWarning("Circuit broken for {duration}", duration);
        },
        onReset: () => {
            logger.LogInformation("Circuit reset");
        }
    );

// Use with HttpClient
var result = await circuitBreakerPolicy.ExecuteAsync(async () =>
    await httpClient.GetAsync("https://api.example.com/users")
);`,
    },
    {
      id: "opossum",
      name: "Opossum",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Feature-rich Node.js circuit breaker with event emitters, fallbacks, and metrics. Supports percentage-based thresholds, rolling windows, and prometheus integration. Widely used in production Node.js microservices.",
      links: {
        github: "https://github.com/nodeshift/opossum",
        npm: "https://www.npmjs.com/package/opossum",
      },
      codeSnippet: `const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10
};

const breaker = new CircuitBreaker(asyncFunction, options);

breaker.fallback(() => cachedData);
breaker.on('open', () => metrics.increment('circuit.open'));

const result = await breaker.fire(arg1, arg2);`,
    },
    {
      id: "hystrix",
      name: "Hystrix",
      type: "library",
      languages: ["java"],
      description:
        "Netflix's original circuit breaker library (now in maintenance mode). Pioneered circuit breaker pattern in microservices. Provides dashboard for real-time monitoring. Consider migrating to Resilience4j for new projects.",
      links: {
        docs: "https://github.com/Netflix/Hystrix/wiki",
        github: "https://github.com/Netflix/Hystrix",
      },
      codeSnippet: `public class UserCommand extends HystrixCommand<User> {
    private final Long userId;

    public UserCommand(Long userId) {
        super(HystrixCommandGroupKey.Factory.asKey("UserService"));
        this.userId = userId;
    }

    @Override
    protected User run() throws Exception {
        return userService.getUser(userId);
    }

    @Override
    protected User getFallback() {
        return User.defaultUser(userId);
    }
}

User user = new UserCommand(123L).execute();`,
    },
    {
      id: "failsafe",
      name: "Failsafe",
      type: "library",
      languages: ["java"],
      description:
        "Lightweight Java library for handling failures with simple, concise API. Supports circuit breakers, retries, timeouts, and fallbacks. Integrates with CompletableFuture and provides strong type safety.",
      links: {
        docs: "https://failsafe.dev/",
        github: "https://github.com/failsafe-lib/failsafe",
      },
      codeSnippet: `CircuitBreaker<Object> breaker = CircuitBreaker.builder()
  .withFailureThreshold(5, 10)      // 5 failures out of 10 attempts
  .withSuccessThreshold(3)           // 3 successes to close
  .withDelay(Duration.ofMinutes(1))
  .build();

User user = Failsafe.with(breaker)
  .get(() -> userService.getUser(userId));`,
    },
    {
      id: "pybreaker",
      name: "PyBreaker",
      type: "library",
      languages: ["python"],
      description:
        "Python circuit breaker implementation with decorator support. Simple API with configurable failure thresholds and reset timeouts. Supports both sync and async functions.",
      links: {
        docs: "https://github.com/danielfm/pybreaker",
        github: "https://github.com/danielfm/pybreaker",
      },
      codeSnippet: `import pybreaker

breaker = pybreaker.CircuitBreaker(
    fail_max=5,
    reset_timeout=60
)

@breaker
def fetch_user(user_id):
    response = requests.get(f'/users/{user_id}')
    return response.json()

try:
    user = fetch_user(123)
except pybreaker.CircuitBreakerError:
    user = get_cached_user(123)`,
    },
    {
      id: "gobreaker",
      name: "gobreaker",
      type: "library",
      languages: ["go"],
      description:
        "Go circuit breaker implementation based on Sony's implementation. Supports customizable state change hooks and threshold strategies. Thread-safe with minimal dependencies.",
      links: {
        docs: "https://github.com/sony/gobreaker",
        github: "https://github.com/sony/gobreaker",
      },
      codeSnippet: `import "github.com/sony/gobreaker"

settings := gobreaker.Settings{
    Name:        "UserService",
    MaxRequests: 3,
    Interval:    time.Minute,
    Timeout:     time.Minute,
    ReadyToTrip: func(counts gobreaker.Counts) bool {
        failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
        return counts.Requests >= 3 && failureRatio >= 0.6
    },
}

cb := gobreaker.NewCircuitBreaker(settings)

user, err := cb.Execute(func() (interface{}, error) {
    return fetchUser(userID)
})`,
    },
    {
      id: "spring-cloud-cb",
      name: "Spring Cloud Circuit Breaker",
      type: "framework",
      languages: ["java"],
      description:
        "Abstraction layer over circuit breaker implementations (Resilience4j, Hystrix) for Spring applications. Provides consistent API and Spring Boot auto-configuration. Integrates with Spring Cloud Gateway.",
      links: {
        docs: "https://spring.io/projects/spring-cloud-circuitbreaker",
        github: "https://github.com/spring-cloud/spring-cloud-circuitbreaker",
      },
      codeSnippet: `@Service
public class UserService {
    private final CircuitBreakerFactory factory;

    public User getUser(Long id) {
        CircuitBreaker breaker = factory.create("userService");

        return breaker.run(
            () -> restTemplate.getForObject("/users/" + id, User.class),
            throwable -> getCachedUser(id)
        );
    }
}`,
    },
    {
      id: "istio-cb",
      name: "Istio Circuit Breaker",
      type: "service",
      languages: ["any"],
      description:
        "Service mesh circuit breaker configured via DestinationRule. Implements circuit breaking at the infrastructure layer, transparent to application code. Supports connection pool limits and outlier detection.",
      links: {
        docs: "https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/",
        github: "https://github.com/istio/istio",
      },
      codeSnippet: `apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service-circuit-breaker
spec:
  host: user-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 10
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 60s
      maxEjectionPercent: 50`,
    },
    {
      id: "aws-app-mesh",
      name: "AWS App Mesh Circuit Breaker",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed service mesh with built-in circuit breaker support. Configured via VirtualNode outlier detection. Integrates with CloudWatch for metrics and monitoring.",
      links: {
        docs: "https://docs.aws.amazon.com/app-mesh/latest/userguide/outlier-detection.html",
      },
      codeSnippet: `{
  "spec": {
    "listeners": [...],
    "backends": [...],
    "serviceDiscovery": {...},
    "outlierDetection": {
      "baseEjectionDuration": {
        "value": 60,
        "unit": "s"
      },
      "interval": {
        "value": 30,
        "unit": "s"
      },
      "maxEjectionPercent": 50,
      "maxServerErrors": 5
    }
  }
}`,
    },
    {
      id: "envoy-cb",
      name: "Envoy Circuit Breaker",
      type: "platform",
      languages: ["any"],
      description:
        "High-performance L7 proxy with circuit breaker support. Implements connection limits and retry budgets. Foundation for service meshes like Istio and AWS App Mesh.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking",
        github: "https://github.com/envoyproxy/envoy",
      },
      codeSnippet: `circuit_breakers:
  thresholds:
    - priority: DEFAULT
      max_connections: 1024
      max_pending_requests: 1024
      max_requests: 1024
      max_retries: 3
    - priority: HIGH
      max_connections: 2048
      max_pending_requests: 2048
      max_requests: 2048
      max_retries: 5`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix",
      systemName: "Netflix Streaming Platform",
      howUsed:
        "Netflix pioneered circuit breaker adoption in microservices through Hystrix library. Every inter-service dependency (recommendation engine, user profiles, video metadata, billing) is wrapped in a circuit breaker. When the recommendation service fails, circuits trip and fallback to generic 'popular now' content instead of showing errors. The system monitors thousands of circuit breakers via Hystrix Dashboard, tracking state transitions, request volumes, and error rates in real-time. Circuit breakers enabled Netflix to maintain 99.99% availability despite having 700+ microservices with complex dependency graphs. Pattern composition: Circuit Breaker + Bulkhead (thread pool isolation) + Fallback (cached responses) + Timeout. Rationale: With millions of concurrent users streaming video, any downstream failure could cascade and take down the entire platform; circuit breakers contain failures to specific services. Impact: Reduced cascading failure incidents by 90%; mean time to recovery improved from hours to minutes; enabled safe deployment of hundreds of microservices without fear of bringing down the platform.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "uber",
      systemName: "Uber Ride-Hailing Platform",
      howUsed:
        "Uber uses circuit breakers extensively to protect critical paths in their ride-matching system. When demand spikes (New Year's Eve, major events), downstream services like pricing calculation, driver location, or payment processing can become overwhelmed. Circuit breakers prevent these failures from blocking the entire ride request flow. For example, if the dynamic pricing service fails, the circuit trips and fallback pricing (last known price or zone-based estimates) is used instead. The payment processing circuit breaker prevents failed payment gateways from blocking ride completion—transactions are queued for retry. Pattern composition: Circuit Breaker + Retry (exponential backoff) + Queue-based Load Leveling + Graceful Degradation. Rationale: Uber operates in 10,000+ cities with highly variable load patterns; preventing cascading failures is critical to maintaining availability during peak demand when revenue is highest. Impact: Maintained 99.99% uptime for ride requests during peak periods; prevented $10M+ in lost revenue during payment gateway outages by gracefully degrading to offline payment options.",
    },
    {
      systemId: "amazon",
      systemName: "Amazon E-commerce Platform",
      howUsed:
        "Amazon applies circuit breakers at multiple layers: service-to-service calls, database connections, and third-party integrations. During Prime Day 2023, when traffic spiked 10x normal, circuit breakers prevented cascading failures in recommendation engine, inventory management, and checkout services. When product recommendation service became overwhelmed, circuits opened and fallback logic served cached bestsellers instead. Payment processing circuits protected against third-party payment gateway failures—when a gateway went down, the circuit tripped and redirected transactions to backup providers. Pattern composition: Circuit Breaker + Cache-Aside (serve cached data) + Load Balancing (distribute to healthy instances) + Health Checks (detect degraded services). Rationale: With billions in daily revenue, even 1% downtime costs millions; circuit breakers enable graceful degradation rather than complete outages. Impact: Zero major outages during Prime Day 2023 despite 3 payment gateway failures; maintained 99.99% checkout success rate; processed 500M+ orders without cascading failures.",
      source:
        "https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/",
    },
    {
      systemId: "soundcloud",
      systemName: "SoundCloud Audio Streaming",
      howUsed:
        "SoundCloud's microservices architecture uses circuit breakers to isolate failures in their audio transcoding, metadata, and social graph services. When transcoding service fails (common during viral track uploads), circuits open and serve lower-quality cached versions instead of blocking uploads entirely. The social graph circuit breaker prevents follower/following queries from timing out when the graph database is under load—fallback returns empty lists, allowing playback to continue. Pattern composition: Circuit Breaker + Adaptive Timeout (dynamic timeout based on percentiles) + Bulkhead + Metrics-driven Monitoring. Rationale: With 200M+ users uploading tracks, unpredictable viral content can cause sudden load spikes; circuit breakers prevent viral uploads from taking down the entire platform. Impact: Reduced P99 latency for audio playback by 60% during viral events; eliminated cascading failures that previously caused 4-6 hour outages; enabled scaling from 100M to 200M users without major infrastructure overhaul.",
      source: "https://www.infoq.com/presentations/soundcloud-microservices/",
    },
    {
      systemId: "twitter",
      systemName: "Twitter Social Network",
      howUsed:
        "Twitter implements circuit breakers via their Finagle RPC framework to protect critical services like timeline assembly, tweet fetching, and user graph queries. During high-traffic events (Super Bowl, breaking news), circuit breakers prevent timeline service from being overwhelmed by burst traffic. When tweet fetching fails, circuits open and serve cached tweets or skip missing content rather than blocking entire timelines. The user graph circuit breaker prevents follower count queries from cascading when the social graph database is slow. Pattern composition: Circuit Breaker + Request Coalescing (batch duplicate requests) + Cache-Aside + Rate Limiting. Rationale: Twitter must handle 500M+ tweets per day with spikes of 100k+ tweets per second during major events; circuit breakers prevent these spikes from causing platform-wide outages. Impact: Reduced timeline assembly failures by 95% during high-traffic events; maintained sub-second timeline load times even when tweet database was degraded; enabled handling of Super Bowl traffic (10x normal) without outages.",
      source:
        "https://blog.twitter.com/engineering/en_us/topics/infrastructure/2017/the-infrastructure-behind-twitter-scale",
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
