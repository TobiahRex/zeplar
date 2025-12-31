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
    relatedPatterns: [
      "retry",
      "bulkhead",
      "timeout",
      "fallback",
      "health-check",
      "rate-limiter",
    ],
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
        scope:
          "Complete circuit breaker class managing state transitions and failure tracking for protecting downstream service calls",
        prerequisites: [
          "TypeScript classes",
          "Async/await",
          "State machines",
          "Error handling",
        ],
        systemPosition:
          "Wraps outbound HTTP calls in service layer or API gateway to prevent cascading failures when downstream services become unhealthy",
      },
      annotations: [
        {
          id: "cb-state-type",
          lines: [1, 1],
          action: "Define three-state type union for circuit state tracking",
          reason:
            "TypeScript union type provides compile-time safety ensuring only valid states (CLOSED, OPEN, HALF_OPEN) can be assigned, preventing invalid state transitions that could break fail-fast behavior",
          contextLevel: "module",
        },
        {
          id: "cb-init-closed",
          lines: [8, 9],
          action: "Initialize circuit in CLOSED state with zero failures",
          reason:
            "Starting with CLOSED state allows requests to flow through initially; assumes services are healthy by default (optimistic startup) rather than pessimistically blocking all traffic on boot",
          contextLevel: "module",
        },
        {
          id: "cb-config",
          lines: [11, 11],
          action:
            "Configure failure threshold and reset timeout via constructor",
          reason:
            "Externalized configuration enables tuning circuit breaker sensitivity per service—aggressive thresholds for flaky services, lenient for critical dependencies; reset timeout balances recovery detection vs retry storms",
          contextLevel: "module",
        },
        {
          id: "cb-check-open",
          lines: [14, 14],
          action: "Check if circuit is OPEN before executing request",
          reason:
            "OPEN circuit means service is unhealthy—immediately reject without attempting call (fail-fast) to prevent wasting resources on doomed requests and further overwhelming struggling service",
          contextLevel: "local",
        },
        {
          id: "cb-half-open-transition",
          lines: [15, 16],
          action:
            "Transition from OPEN to HALF_OPEN after reset timeout expires",
          reason:
            "After service has had time to recover (reset timeout), allow single probe request to test if service is healthy again; avoids indefinite circuit open state while limiting retry attempts during recovery",
          contextLevel: "module",
        },
        {
          id: "cb-try-catch",
          lines: [22, 29],
          action:
            "Wrap protected function call in try-catch to handle both success and failure",
          reason:
            "Success path resets failure counter and closes circuit (service recovered); failure path increments counter and may trip circuit (service degrading); dual outcomes enable adaptive circuit behavior",
          contextLevel: "module",
        },
        {
          id: "cb-on-success",
          lines: [24, 25],
          action: "Call onSuccess to reset failure count and close circuit",
          reason:
            "Single successful response proves service is healthy—reset failure tracking to zero and transition to CLOSED state; prevents circuit from staying open after service recovers",
          contextLevel: "local",
        },
        {
          id: "cb-on-failure",
          lines: [27, 28],
          action:
            "Call onFailure to increment counter and potentially trip circuit",
          reason:
            "Each failure is evidence of service degradation—increment counter and check if threshold exceeded; failures are counted to detect patterns (multiple failures = systemic issue) vs transient errors (single failure)",
          contextLevel: "local",
        },
        {
          id: "cb-reset-timeout",
          lines: [32, 34],
          action:
            "Calculate time elapsed since last failure to determine reset eligibility",
          reason:
            "Reset timeout gives service breathing room to recover without continued load; checking elapsed time prevents premature circuit closing while allowing eventual recovery probes",
          contextLevel: "local",
        },
        {
          id: "cb-threshold-check",
          lines: [42, 44],
          action:
            "Compare failure count against configured threshold to determine if circuit should open",
          reason:
            "Threshold defines service health boundary—below threshold = transient issues, above = systemic failure; configurable threshold enables tuning sensitivity (lower = more aggressive circuit tripping)",
          contextLevel: "module",
        },
        {
          id: "cb-timestamp",
          lines: [40, 40],
          action:
            "Record timestamp of each failure for reset timeout calculations",
          reason:
            "Timestamp enables time-based recovery logic—circuit only attempts reset after sufficient elapsed time; without timestamp, circuit would retry immediately after opening (defeating fail-fast purpose)",
          contextLevel: "local",
        },
        {
          id: "cb-open-state",
          lines: [43, 43],
          action:
            "Transition circuit state to OPEN when failures exceed threshold",
          reason:
            "OPEN state prevents all requests from reaching unhealthy service, giving it time to recover without additional load; protects calling service from resource exhaustion (blocked threads, timeouts)",
          contextLevel: "module",
        },
        {
          id: "cb-rethrow",
          lines: [28, 28],
          action: "Re-throw caught error after recording failure",
          reason:
            "Circuit breaker is transparent failure tracker, not error handler—propagate error to caller so they can apply retry logic, fallbacks, or user error messages; circuit only manages when to stop trying",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [1, 1],
          label: "Three-state union type defines valid circuit states",
          sbvpDomain: "structure",
        },
        {
          lines: [3, 6],
          label:
            "Configuration interface for tunable circuit breaker parameters",
          sbvpDomain: "structure",
        },
        {
          lines: [14, 20],
          label:
            "State check and transition logic implementing fail-fast when circuit is OPEN",
          sbvpDomain: "behavior",
        },
        {
          lines: [36, 39],
          label: "Success path that resets failure tracking and closes circuit",
          sbvpDomain: "behavior",
        },
        {
          lines: [41, 47],
          label:
            "Failure path that increments counter and trips circuit when threshold exceeded",
          sbvpDomain: "behavior",
        },
        {
          lines: [32, 34],
          label:
            "Reset timeout calculation determines when to probe service recovery",
          sbvpDomain: "philosophy",
        },
        {
          lines: [13, 13],
          label:
            "Circuit breaker positioned as wrapper around service calls in application architecture",
          sbvpDomain: "structure",
        },
        {
          lines: [18, 18],
          label:
            "Fail-fast principle: reject requests immediately when service is known to be unhealthy rather than waiting for inevitable timeout",
          sbvpDomain: "philosophy",
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
      "API Gateway - Positioned at the edge to protect backend services from cascading failures when downstream microservices become unhealthy; prevents external traffic from overwhelming struggling internal services by failing fast at the boundary",
      "Service Layer - Embedded within individual microservices to wrap outbound calls to dependencies (databases, other services, external APIs); enables each service to independently manage its resilience without relying on infrastructure",
      "HTTP Client Wrapper - Implemented as a reusable client library that wraps HTTP requests across the application; provides consistent circuit breaking behavior for all outbound HTTP calls with centralized configuration and monitoring",
      "Service Mesh Sidecar - Deployed as infrastructure-level circuit breaking via service mesh proxies (Istio, Linkerd, Envoy); handles north-south (API gateway) and east-west (service-to-service) traffic with transparent circuit breaking without application code changes",
      "Message Queue Consumer - Applied to message processing to prevent consumer services from being overwhelmed by message bursts when downstream dependencies fail; allows queue backlog to build rather than cascading failures through the messaging system",
    ],
    interactsWith: [
      "retry",
      "timeout",
      "bulkhead",
      "fallback",
      "health-check",
      "rate-limiter",
    ],
    architecturalBoundaries: [
      "Service-to-Service Calls - Primary use case where circuit breakers protect synchronous inter-service communication in microservices architectures; monitors failure rates of remote procedure calls (HTTP, gRPC) and trips when downstream services exhibit high error rates or timeouts",
      "External API Integrations - Critical for third-party dependencies where the calling service has no control over the external system's reliability; prevents external service outages from cascading into internal system failures by failing fast and enabling fallback responses",
      "Database Connection Pools - Applicable when database becomes slow or unresponsive due to lock contention, resource exhaustion, or network issues; prevents application threads from blocking indefinitely waiting for database connections, though less common than service-to-service use cases",
      "Not Recommended for In-Process Calls - Circuit breakers add unnecessary overhead for in-memory function calls within a single process; should only be used for operations that involve network I/O, external resources, or have potential for unpredictable latency",
    ],
  },

  implementations: [
    {
      id: "resilience4j",
      name: "Resilience4j - Java/Kotlin",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Lightweight fault tolerance library for Java 8+ with functional programming support. Modern replacement for Hystrix with zero dependencies, higher performance, and flexible composition of circuit breaker, retry, rate limiter, bulkhead, and time limiter patterns.",
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
  .recordExceptions(IOException.class, TimeoutException.class)
  .ignoreExceptions(BusinessException.class)
  .build();

CircuitBreaker breaker = CircuitBreaker.of("userService", config);

// Decorate and execute with functional composition
Supplier<User> decoratedSupplier = CircuitBreaker
  .decorateSupplier(breaker, () -> userService.getUser(id));

User user = Try.ofSupplier(decoratedSupplier)
  .recover(throwable -> getFallbackUser(id))
  .get();

// Key features:
// - Sliding window for accurate failure tracking
// - Composable with other resilience patterns
// - Integrates with Spring Boot, Micronaut, Vert.x
// - Metrics exportable to Prometheus/Micrometer
//
// When to choose:
// - Java/Kotlin microservices (Spring Boot, Micronaut)
// - Migrating from deprecated Hystrix
// - Need composable resilience patterns
// - Require fine-grained control and metrics`,
    },
    {
      id: "polly",
      name: "Polly - .NET/C#",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience and transient-fault-handling library with fluent API. Industry-standard for .NET applications, providing circuit breaker, retry, timeout, bulkhead, and fallback policies with seamless HttpClient integration and async/await support.",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki",
        github: "https://github.com/App-vNext/Polly",
      },
      codeSnippet: `// Polly CircuitBreaker with advanced configuration
var circuitBreakerPolicy = Policy
    .Handle<HttpRequestException>()
    .OrResult<HttpResponseMessage>(r => r.StatusCode == HttpStatusCode.TooManyRequests)
    .AdvancedCircuitBreakerAsync(
        failureThreshold: 0.5,           // Trip at 50% failure rate
        samplingDuration: TimeSpan.FromSeconds(10),
        minimumThroughput: 20,           // Minimum requests before circuit can trip
        durationOfBreak: TimeSpan.FromSeconds(30),
        onBreak: (result, duration) => {
            logger.LogWarning("Circuit broken for {duration}", duration);
            metrics.RecordCircuitOpen();
        },
        onReset: () => {
            logger.LogInformation("Circuit reset");
            metrics.RecordCircuitClosed();
        },
        onHalfOpen: () => logger.LogInformation("Circuit testing")
    );

// Policy composition (circuit breaker + retry + timeout)
var policyWrap = Policy.WrapAsync(
    circuitBreakerPolicy,
    retryPolicy,
    timeoutPolicy
);

var result = await policyWrap.ExecuteAsync(async () =>
    await httpClient.GetAsync("https://api.example.com/users")
);

// Key features:
// - Fluent API with declarative policy composition
// - Advanced circuit breaker with failure rate threshold
// - Policy wrapping for layered resilience
// - Native async/await support
//
// When to choose:
// - .NET/ASP.NET Core applications
// - Need policy composition (circuit breaker + retry + timeout)
// - HttpClient-based microservices
// - Require comprehensive .NET async support`,
    },
    {
      id: "opossum",
      name: "Opossum - Node.js/TypeScript",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Feature-rich Node.js circuit breaker with event emitters, fallbacks, and metrics. Widely adopted in production Node.js microservices, supports percentage-based thresholds, rolling windows, health checks, and Prometheus integration.",
      links: {
        github: "https://github.com/nodeshift/opossum",
        npm: "https://www.npmjs.com/package/opossum",
        docs: "https://nodeshift.dev/opossum/",
      },
      codeSnippet: `const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,                     // Request timeout
  errorThresholdPercentage: 50,      // Trip at 50% error rate
  resetTimeout: 30000,               // Try half-open after 30s
  rollingCountTimeout: 10000,        // Error rate window (10s)
  rollingCountBuckets: 10,           // Granularity of tracking
  volumeThreshold: 10,               // Min requests before tripping
  capacity: 100,                     // Semaphore size

  // Custom error filtering
  errorFilter: (err) => err.statusCode < 500,

  // Health check for half-open state
  healthCheck: async () => {
    const response = await fetch('/health');
    return response.ok;
  }
};

const breaker = new CircuitBreaker(asyncFunction, options);

// Fallback strategy
breaker.fallback((arg1, arg2) => getCachedData(arg1, arg2));

// Event-driven observability
breaker.on('open', () => metrics.increment('circuit.open'));
breaker.on('halfOpen', () => metrics.increment('circuit.halfOpen'));
breaker.on('close', () => metrics.increment('circuit.close'));
breaker.on('success', (result) => metrics.recordLatency(result.duration));
breaker.on('failure', (err) => logger.error('Circuit failure', err));

// Execute
const result = await breaker.fire(arg1, arg2);

// Prometheus metrics integration
const prometheus = require('prom-client');
breaker.stats // Access stats for custom metrics

// Key features:
// - Event-driven architecture with comprehensive hooks
// - Percentage-based thresholds with rolling windows
// - Built-in health checks and fallback support
// - Prometheus metrics out of the box
//
// When to choose:
// - Node.js/Express/Fastify microservices
// - Need event-driven observability
// - Require fallback and health check capabilities
// - TypeScript applications with async/await`,
    },
    {
      id: "hystrix",
      name: "Hystrix - Java (Deprecated)",
      type: "library",
      languages: ["java"],
      description:
        "Netflix's pioneering circuit breaker library that popularized the pattern in microservices (now in maintenance mode since 2018). Provided thread pool isolation, real-time monitoring dashboard, and comprehensive metrics. Netflix recommends migrating to Resilience4j for new projects.",
      links: {
        docs: "https://github.com/Netflix/Hystrix/wiki",
        github: "https://github.com/Netflix/Hystrix",
      },
      codeSnippet: `public class UserCommand extends HystrixCommand<User> {
    private final Long userId;
    private final UserService userService;

    public UserCommand(Long userId, UserService userService) {
        super(HystrixCommandGroupKey.Factory.asKey("UserService"));
        this.userId = userId;
        this.userService = userService;
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

// Execution
User user = new UserCommand(123L, userService).execute();

// Key features (historical):
// - Thread pool isolation per dependency
// - Real-time Hystrix Dashboard for monitoring
// - Request collapsing and caching
// - Comprehensive metrics and event stream
//
// When to choose:
// - ONLY for existing/legacy applications
// - Migrate to Resilience4j for new development
// - Netflix no longer actively develops this library`,
    },
    {
      id: "failsafe",
      name: "Failsafe - Java",
      type: "library",
      languages: ["java"],
      description:
        "Lightweight, zero-dependency Java library for handling failures with simple, concise API. Provides circuit breakers, retries, timeouts, and fallbacks with strong type safety, CompletableFuture integration, and minimal overhead.",
      links: {
        docs: "https://failsafe.dev/",
        github: "https://github.com/failsafe-lib/failsafe",
      },
      codeSnippet: `import dev.failsafe.*;
import java.time.Duration;

// Circuit breaker configuration
CircuitBreaker<Object> breaker = CircuitBreaker.builder()
  .withFailureThreshold(5, 10)      // 5 failures out of 10 attempts
  .withSuccessThreshold(3)           // 3 successes to close
  .withDelay(Duration.ofMinutes(1))
  .onOpen(() -> logger.warn("Circuit opened"))
  .onClose(() -> logger.info("Circuit closed"))
  .build();

// Synchronous execution
User user = Failsafe.with(breaker)
  .get(() -> userService.getUser(userId));

// Async with CompletableFuture
CompletableFuture<User> future = Failsafe.with(breaker)
  .getAsync(() -> userService.fetchUserAsync(userId));

// Composition with retry and timeout
RetryPolicy<Object> retry = RetryPolicy.builder()
  .withMaxRetries(3)
  .build();

Timeout<Object> timeout = Timeout.builder(Duration.ofSeconds(10))
  .build();

User result = Failsafe.with(breaker, retry, timeout)
  .get(() -> userService.getUser(userId));

// Key features:
// - Zero dependencies, minimal footprint
// - CompletableFuture async support
// - Composable policies (circuit breaker + retry + timeout)
// - Strong type safety with generics
//
// When to choose:
// - Java applications without Spring framework
// - Need lightweight library without dependencies
// - CompletableFuture-based async operations
// - Prefer simple, concise API over DSL`,
    },
    {
      id: "pybreaker",
      name: "PyBreaker - Python",
      type: "library",
      languages: ["python"],
      description:
        "Pure Python circuit breaker implementation with decorator support for clean integration. Provides simple API with configurable failure thresholds, reset timeouts, and support for both synchronous and asynchronous functions.",
      links: {
        docs: "https://github.com/danielfm/pybreaker",
        github: "https://github.com/danielfm/pybreaker",
      },
      codeSnippet: `import pybreaker
import requests

# Circuit breaker with custom configuration
breaker = pybreaker.CircuitBreaker(
    fail_max=5,              # Trip after 5 failures
    reset_timeout=60,        // Try half-open after 60s
    exclude=[ValueError],    # Don't count these exceptions
    listeners=[LogListener(), MetricsListener()]
)

# Decorator usage
@breaker
def fetch_user(user_id):
    response = requests.get(f'/api/users/{user_id}')
    response.raise_for_status()
    return response.json()

# Manual usage with fallback
try:
    user = fetch_user(123)
except pybreaker.CircuitBreakerError:
    user = get_cached_user(123)

# Check circuit state
if breaker.current_state == 'open':
    logger.warning('Circuit is open, using fallback')

# Async support (Python 3.7+)
@breaker
async def fetch_user_async(user_id):
    async with aiohttp.ClientSession() as session:
        async with session.get(f'/api/users/{user_id}') as resp:
            return await resp.json()

// Key features:
// - Clean decorator syntax for Python
// - Custom exception filtering
// - Event listeners for monitoring
// - Async/await support
//
// When to choose:
// - Python microservices (Flask, FastAPI, Django)
// - Need decorator-based integration
// - Simple circuit breaking without heavy dependencies
// - Both sync and async function support`,
    },
    {
      id: "gobreaker",
      name: "gobreaker - Go",
      type: "library",
      languages: ["go"],
      description:
        "Thread-safe Go circuit breaker based on Sony's implementation. Provides customizable state change hooks, flexible threshold strategies, and goroutine-safe operation with minimal dependencies.",
      links: {
        docs: "https://pkg.go.dev/github.com/sony/gobreaker",
        github: "https://github.com/sony/gobreaker",
      },
      codeSnippet: `import (
    "github.com/sony/gobreaker"
    "time"
)

// Configure circuit breaker with custom ReadyToTrip function
settings := gobreaker.Settings{
    Name:        "UserService",
    MaxRequests: 3,              // Max requests in half-open state
    Interval:    time.Minute,    // Reset success/failure counts every minute
    Timeout:     time.Minute,    // Stay open for 1 minute

    // Custom logic to determine when to trip
    ReadyToTrip: func(counts gobreaker.Counts) bool {
        failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
        return counts.Requests >= 3 && failureRatio >= 0.6
    },

    // Hooks for observability
    OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
        logger.Infof("Circuit %s: %s -> %s", name, from, to)
        metrics.RecordStateChange(name, to.String())
    },
}

cb := gobreaker.NewCircuitBreaker(settings)

// Execute with error handling
user, err := cb.Execute(func() (interface{}, error) {
    return fetchUser(userID)
})

if err != nil {
    if err == gobreaker.ErrOpenState {
        // Circuit is open, use fallback
        return getCachedUser(userID), nil
    }
    return nil, err
}

return user.(*User), nil

// Key features:
// - Goroutine-safe with minimal locking
// - Customizable ReadyToTrip logic
// - State change hooks for monitoring
// - Interval-based automatic counter reset
//
// When to choose:
// - Go microservices with HTTP/gRPC
// - Need goroutine-safe circuit breaking
// - Require custom threshold logic
// - Production-grade reliability with minimal overhead`,
    },
    {
      id: "spring-cloud-cb",
      name: "Spring Cloud Circuit Breaker - Spring Framework",
      type: "framework",
      languages: ["java"],
      description:
        "Abstraction layer providing pluggable circuit breaker implementations (Resilience4j, Sentinel, Spring Retry) for Spring applications. Offers consistent API, auto-configuration, and seamless integration with Spring Cloud Gateway and WebFlux.",
      links: {
        docs: "https://spring.io/projects/spring-cloud-circuitbreaker",
        github: "https://github.com/spring-cloud/spring-cloud-circuitbreaker",
      },
      codeSnippet: `@Service
public class UserService {
    private final CircuitBreakerFactory circuitBreakerFactory;
    private final RestTemplate restTemplate;

    @Autowired
    public UserService(CircuitBreakerFactory circuitBreakerFactory) {
        this.circuitBreakerFactory = circuitBreakerFactory;
    }

    public User getUser(Long id) {
        CircuitBreaker circuitBreaker = circuitBreakerFactory.create("userService");

        return circuitBreaker.run(
            // Primary operation
            () -> restTemplate.getForObject("/users/" + id, User.class),
            // Fallback operation
            throwable -> getCachedUser(id)
        );
    }

    private User getCachedUser(Long id) {
        return cache.get(id).orElse(User.defaultUser(id));
    }
}

// Configuration (application.yml)
spring:
  cloud:
    circuitbreaker:
      resilience4j:
        enabled: true
resilience4j:
  circuitbreaker:
    instances:
      userService:
        failureRateThreshold: 50
        slidingWindowSize: 100
        waitDurationInOpenState: 60s

// Key features:
// - Pluggable implementations (Resilience4j, Sentinel)
// - Spring Boot auto-configuration
// - Consistent API across implementations
// - Integration with Spring Cloud Gateway
//
// When to choose:
// - Spring Boot/Cloud microservices
// - Need abstraction over multiple circuit breaker libraries
// - Using Spring Cloud Gateway or WebFlux
// - Require centralized Spring configuration`,
    },
    {
      id: "istio-cb",
      name: "Istio Circuit Breaker - Service Mesh",
      type: "service",
      languages: ["any"],
      description:
        "Service mesh circuit breaker configured via DestinationRule CRDs. Implements circuit breaking at the infrastructure layer with outlier detection, connection pool limits, and automatic host ejection—completely transparent to application code.",
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
    # Connection pool limits (circuit breaker thresholds)
    connectionPool:
      tcp:
        maxConnections: 100        # Max concurrent TCP connections
      http:
        http1MaxPendingRequests: 10  # Max queued requests
        http2MaxRequests: 100         # Max concurrent requests
        maxRequestsPerConnection: 2   // Max requests per connection

    # Outlier detection (circuit breaker logic)
    outlierDetection:
      consecutiveErrors: 5          # Errors before ejecting host
      interval: 30s                 # Analysis interval
      baseEjectionTime: 60s         # Minimum ejection duration
      maxEjectionPercent: 50        # Max hosts that can be ejected
      minHealthPercent: 40          // Panic threshold

---
# Monitor with metrics
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: circuit-breaker-metrics
spec:
  metrics:
  - providers:
    - name: prometheus
    dimensions:
      circuit_breaker_status: circuit_breaker.status

// Key features:
// - Infrastructure-level circuit breaking (no code changes)
// - Outlier detection with automatic host ejection
// - Connection pool management
// - Works with any language/framework
//
// When to choose:
// - Kubernetes deployments with Istio service mesh
// - Need circuit breaking without code changes
// - Multi-language microservices environment
// - Require centralized traffic management`,
    },
    {
      id: "aws-app-mesh",
      name: "AWS App Mesh Circuit Breaker - AWS Service Mesh",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed service mesh providing circuit breaker functionality via VirtualNode outlier detection configuration. Integrates with CloudWatch for metrics, X-Ray for tracing, and supports automatic instance ejection with configurable thresholds.",
      links: {
        docs: "https://docs.aws.amazon.com/app-mesh/latest/userguide/outlier-detection.html",
      },
      codeSnippet: `{
  "spec": {
    "listeners": [...],
    "backends": [...],
    "serviceDiscovery": {...},

    // Outlier detection configuration (circuit breaker)
    "outlierDetection": {
      "baseEjectionDuration": {
        "value": 60,
        "unit": "s"               // Eject unhealthy instances for 60s
      },
      "interval": {
        "value": 30,
        "unit": "s"               // Check for outliers every 30s
      },
      "maxEjectionPercent": 50,   // Max 50% of instances can be ejected
      "maxServerErrors": 5        // Eject after 5 consecutive errors
    }
  }
}

# CloudWatch metrics integration
aws cloudwatch get-metric-statistics \\
  --namespace AWS/AppMesh \\
  --metric-name OutlierDetectionEjections \\
  --dimensions Name=VirtualNode,Value=user-service-vn \\
  --start-time 2024-01-01T00:00:00Z \\
  --end-time 2024-01-01T23:59:59Z \\
  --period 300 \\
  --statistics Sum

// Key features:
// - Managed service mesh by AWS
// - CloudWatch metrics and X-Ray tracing integration
// - Automatic outlier detection and ejection
// - Works with ECS, EKS, EC2
//
// When to choose:
// - AWS-native deployments (ECS, EKS, EC2)
// - Need managed service mesh without Kubernetes
// - Require CloudWatch/X-Ray integration
// - Prefer AWS-managed infrastructure`,
    },
    {
      id: "envoy-cb",
      name: "Envoy Proxy Circuit Breaker - L7 Proxy",
      type: "platform",
      languages: ["any"],
      description:
        "High-performance L7 proxy with sophisticated circuit breaker support including connection limits, pending request limits, retry budgets, and outlier detection. Foundation for Istio, AWS App Mesh, and other service meshes.",
      links: {
        docs: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking",
        github: "https://github.com/envoyproxy/envoy",
      },
      codeSnippet: `static_resources:
  clusters:
  - name: user_service
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN

    # Circuit breaker thresholds
    circuit_breakers:
      thresholds:
        - priority: DEFAULT
          max_connections: 1024         # Max concurrent connections
          max_pending_requests: 1024    # Max queued requests
          max_requests: 1024            # Max active requests
          max_retries: 3                # Max concurrent retries

        - priority: HIGH
          max_connections: 2048
          max_pending_requests: 2048
          max_requests: 2048
          max_retries: 5

    # Outlier detection for automatic ejection
    outlier_detection:
      consecutive_5xx: 5              // Eject after 5 consecutive 5xx
      interval: 30s
      base_ejection_time: 60s
      max_ejection_percent: 50
      enforcing_consecutive_5xx: 100
      enforcing_success_rate: 100

    # Retry policy
    retry_policy:
      retry_on: "5xx"
      num_retries: 3
      per_try_timeout: 2s
      retry_host_predicate:
      - name: envoy.retry_host_predicates.previous_hosts

# Monitor circuit breaker stats
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

# Stats available at /stats/prometheus
# - upstream_cx_overflow (connection limit exceeded)
# - upstream_rq_pending_overflow (pending request limit exceeded)
// - upstream_rq_retry_overflow (retry budget exceeded)

// Key features:
// - Priority-based circuit breaking (default vs high priority)
// - Connection, request, and retry budget limits
// - Outlier detection with configurable ejection
// - Foundation for Istio and AWS App Mesh
//
// When to choose:
// - Need standalone L7 proxy without full service mesh
// - Building custom service mesh on top of Envoy
// - Require fine-grained circuit breaker control
// - High-performance edge proxy or API gateway`,
    },
    {
      id: "linkerd-cb",
      name: "Linkerd Circuit Breaker - Service Mesh",
      type: "service",
      languages: ["any"],
      description:
        "Ultralight service mesh with built-in circuit breaking via failure accrual and load balancing policies. Provides automatic circuit breaking with minimal configuration, low resource overhead, and transparent traffic management.",
      links: {
        docs: "https://linkerd.io/2/features/load-balancing/",
        github: "https://github.com/linkerd/linkerd2",
      },
      codeSnippet: `# Linkerd automatically provides circuit breaking via failure accrual
# Configure via Server resource for advanced control

apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: user-service
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: user-service
  port: http
  proxyProtocol: HTTP/1

---
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: user-service-auth
  namespace: default
spec:
  server:
    name: user-service
  client:
    meshTLS:
      serviceAccounts:
      - name: frontend

# Linkerd automatically:
# - Tracks success/failure rates per endpoint
# - Removes failing endpoints from load balancing pool
# - Re-adds endpoints when they recover
// - Provides circuit breaking without explicit configuration

// Key features:
// - Automatic failure accrual and circuit breaking
// - Minimal configuration required
// - Low resource overhead (Rust-based)
// - Works seamlessly with Kubernetes
//
// When to choose:
// - Kubernetes deployments preferring simplicity
// - Need automatic circuit breaking without configuration
// - Resource-constrained environments
// - Prefer Rust-based lightweight service mesh over Envoy`,
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

  references: [
    {
      title: "Circuit Breaker - Martin Fowler",
      url: "https://martinfowler.com/bliki/CircuitBreaker.html",
      type: "article",
      author: "Martin Fowler",
    },
    {
      title: "Release It! Design and Deploy Production-Ready Software",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Circuit Breaker Pattern - Azure Architecture Center",
      url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker",
      type: "documentation",
      author: "Microsoft",
    },
    {
      title: "Circuit Breaker Pattern - AWS Prescriptive Guidance",
      url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html",
      type: "documentation",
      author: "AWS",
    },
    {
      title: "Fault Tolerance in a High Volume, Distributed System",
      url: "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
      type: "article",
      author: "Netflix Tech Blog",
    },
    {
      title: "Netflix/Hystrix - How it Works",
      url: "https://github.com/netflix/hystrix/wiki/how-it-works",
      type: "documentation",
      author: "Netflix",
    },
  ],

  tags: [
    "reliability",
    "fault-tolerance",
    "microservices",
    "resilience",
    "state-machine",
  ],
  difficulty: "intermediate",
};
