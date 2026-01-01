import type { Pattern } from "../schema";

export const timeout: Pattern = {
  id: "timeout",
  slug: "timeout",
  corpusPath: "🛡️ RELIABILITY → 💔 Fault Tolerance → ⏱️ Timeouts",

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
      "The Timeout pattern establishes a maximum time boundary for operations to complete, acting as a protective guard that prevents indefinite waiting and ensures timely resource recovery. Like a kitchen timer that rings to remind you to check on your cooking—regardless of whether the dish is actually done—a timeout provides a forcing function that ensures your system doesn't wait forever for a response that may never arrive. The pattern wraps potentially long-running operations (network calls, database queries, external API requests) with a timer mechanism that races against the actual work. If the operation completes before the timer expires, the result flows through normally. If the timer wins the race, the operation is cancelled or abandoned, and an explicit timeout error is returned to the caller. This fail-fast behavior is crucial in distributed systems where network partitions, overloaded services, or crashed processes can cause requests to hang silently. Without timeouts, these hung operations would accumulate like a traffic jam, consuming threads, connections, and memory until the entire system grinds to a halt. Timeouts provide predictable maximum latency, enable rapid failure detection, and ensure that resources are freed for productive work rather than being trapped in endless waiting. The pattern requires careful tuning—too aggressive and you abort operations that would have succeeded; too lenient and you fail to protect against genuine hangs—making timeout selection both an art and a science based on operation characteristics and system SLAs.",
    problemSolved:
      "In distributed architectures, operations can hang indefinitely due to network partitions, overloaded downstream services, crashed processes, or deadlocked transactions. Without timeouts, these hung operations create a cascading resource exhaustion problem: caller threads remain blocked waiting for responses, connection pools fill up with stale connections, memory accumulates in request buffers, and circuit breakers never trip because requests never complete (neither successfully nor with errors). The problem compounds as new requests queue behind blocked ones, creating backpressure that propagates upstream through the call chain. Users experience this as frozen UIs, infinite loading spinners, and eventual complete system unresponsiveness. The timeout pattern solves this by establishing an explicit maximum wait time, transforming silent indefinite hangs into fast, actionable failures. When a timeout expires, the system immediately reclaims the blocked thread, closes the network connection, frees memory buffers, and returns a distinguishable timeout error that can trigger retry logic, circuit breakers, or fallback mechanisms. This enables the system to maintain responsiveness under partial failure conditions and provides explicit failure signals that automated recovery systems can act upon.",
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
        level: "module",
        scope:
          "Generic Promise timeout wrapper with AbortController integration for bounding wait time and preventing indefinite resource blocking",
        prerequisites: [
          "Promises",
          "setTimeout",
          "AbortController",
          "Race conditions",
        ],
        systemPosition:
          "Utility wrapper used by HTTP clients, service calls, and database queries to enforce maximum wait times and enable early cancellation",
      },
      annotations: [
        {
          id: "timeout-error-class",
          lines: [1, 6],
          action:
            "Define custom TimeoutError class extending Error for timeout identification",
          reason:
            "Custom error type enables callers to distinguish timeout failures from other errors (network, validation, business logic); specific error type allows targeted error handling (retry timeout, don't retry validation)",
          contextLevel: "local",
        },
        {
          id: "timeout-error-message",
          lines: [3, 3],
          action:
            "Include timeout duration in error message for debugging context",
          reason:
            "Error message containing timeout value helps debugging—engineers can see if timeout too aggressive (100ms) vs reasonable (5000ms); timeout value appears in logs for correlation with performance metrics",
          contextLevel: "micro",
        },
        {
          id: "timeout-generic-type",
          lines: [8, 12],
          action:
            "Accept generic Promise type parameter for type-safe wrapping",
          reason:
            "Generic type preserves return type through wrapper—withTimeout<User> returns Promise<User>, not Promise<unknown>; type safety enables IDE autocomplete and compile-time checking",
          contextLevel: "module",
        },
        {
          id: "timeout-abort-signal",
          lines: [11, 11],
          action:
            "Accept optional AbortSignal for external cancellation support",
          reason:
            "AbortSignal enables external cancellation (user navigates away, request superseded by newer request); without abort support, timeout would continue running even when result no longer needed",
          contextLevel: "module",
        },
        {
          id: "timeout-promise-wrapper",
          lines: [13, 13],
          action: "Create new Promise wrapper racing against timeout timer",
          reason:
            "Promise wrapper enables racing original promise against timer—whichever settles first wins; wrapper pattern allows transparent timeout addition without modifying original promise",
          contextLevel: "local",
        },
        {
          id: "timeout-timer-setup",
          lines: [15, 17],
          action: "Start setTimeout timer that rejects with TimeoutError",
          reason:
            "Timer is enforcement mechanism—if original promise doesn't settle within ms milliseconds, timer fires and rejects wrapper promise; timeout moves from 'nice to have' to guaranteed upper bound",
          contextLevel: "local",
        },
        {
          id: "timeout-abort-listener",
          lines: [20, 23],
          action: "Register abort signal listener to cancel timeout early",
          reason:
            "Abort signal enables caller to cancel operation before timeout (user cancels request, component unmounts, newer request supersedes); early cancellation prevents wasted work and improves resource utilization",
          contextLevel: "module",
        },
        {
          id: "timeout-abort-cleanup",
          lines: [21, 22],
          action: "Clear timeout timer and reject with abort reason on signal",
          reason:
            "When abort fires, clear timeout timer to prevent memory leak; reject with abort reason (not timeout error) to distinguish user cancellation from timeout; cleanup prevents timer callback from firing later",
          contextLevel: "local",
        },
        {
          id: "timeout-success-handler",
          lines: [27, 30],
          action: "Chain original promise success handler to resolve wrapper",
          reason:
            "When original promise succeeds before timeout, resolve wrapper with result; clear timeout timer to prevent late rejection; success path is optimistic case (normal operation)",
          contextLevel: "local",
        },
        {
          id: "timeout-error-handler",
          lines: [31, 34],
          action: "Chain original promise error handler to reject wrapper",
          reason:
            "When original promise fails before timeout, propagate error to wrapper; clear timeout timer since operation completed (even if failed); failure path preserves original error for proper error handling",
          contextLevel: "local",
        },
        {
          id: "timeout-cleanup",
          lines: [28, 33],
          action: "Clear timeout in both success and error handlers",
          reason:
            "Timer must be cleared on any promise settlement to prevent timeout firing after operation completed; without cleanup, timer would reject settled promise (no-op but wastes memory); cleanup prevents timer leak",
          contextLevel: "local",
        },
        {
          id: "timeout-error-catch",
          lines: [43, 46],
          action:
            "Catch TimeoutError specifically to enable timeout-specific handling",
          reason:
            "TimeoutError indicates operation was slow (not failed)—may be retryable with longer timeout; distinguishing timeout from errors (4xx, network) enables appropriate recovery (retry timeout, don't retry 400)",
          contextLevel: "module",
        },
        {
          id: "timeout-fetch-usage",
          lines: [39, 42],
          action:
            "Wrap fetch with timeout and AbortController for cancellable HTTP request",
          reason:
            "Fetch API respects AbortSignal for early cancellation; timeout wrapper bounds maximum wait time; combination enables both timeout enforcement and user cancellation",
          contextLevel: "module",
        },
      ],
      highlights: [
        {
          lines: [1, 6],
          label: "Custom TimeoutError class for error type discrimination",
          sbvpDomain: "structure",
        },
        {
          lines: [15, 17],
          label: "setTimeout-based timeout enforcement rejecting on expiration",
          sbvpDomain: "behavior",
        },
        {
          lines: [20, 23],
          label: "AbortSignal integration for external cancellation support",
          sbvpDomain: "behavior",
        },
        {
          lines: [26, 35],
          label: "Promise settlement handlers with timer cleanup",
          sbvpDomain: "behavior",
        },
        {
          lines: [10, 10],
          label: "Timeout duration as configurable maximum wait bound",
          sbvpDomain: "philosophy",
        },
        {
          lines: [8, 12],
          label:
            "Utility wrapper positioned to wrap any async operation requiring time bounds",
          sbvpDomain: "structure",
        },
        {
          lines: [39, 43],
          label:
            "Fail-fast timeout philosophy: bound wait time to prevent indefinite resource blocking",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "timeout-go-context",
      language: "go",
      title: "Context-based Timeout in Go",
      description:
        "Go's idiomatic timeout implementation using context.WithTimeout for cancellation propagation",
      code: `package main

import (
    "context"
    "errors"
    "fmt"
    "net/http"
    "time"
)

// TimeoutError wraps timeout-specific errors for clear identification
type TimeoutError struct {
    Operation string
    Duration  time.Duration
}

func (e *TimeoutError) Error() string {
    return fmt.Sprintf("%s timed out after %v", e.Operation, e.Duration)
}

// FetchUserProfile makes an HTTP request with timeout and cancellation support
func FetchUserProfile(ctx context.Context, userID string) (*UserProfile, error) {
    // Create a context with 5-second timeout
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel() // Always call cancel to release resources

    // Build the HTTP request with context
    req, err := http.NewRequestWithContext(
        ctx,
        "GET",
        fmt.Sprintf("https://api.example.com/users/%s", userID),
        nil,
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    // Execute request - this will be cancelled if context times out
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        // Check if the error is due to context timeout
        if errors.Is(err, context.DeadlineExceeded) {
            return nil, &TimeoutError{
                Operation: "FetchUserProfile",
                Duration:  5 * time.Second,
            }
        }
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    // Parse response (simplified)
    profile := &UserProfile{ID: userID, Name: "John Doe"}
    return profile, nil
}

// ProcessWithFallback demonstrates timeout with graceful degradation
func ProcessWithFallback(userID string) (*UserProfile, error) {
    // Create root context
    ctx := context.Background()

    profile, err := FetchUserProfile(ctx, userID)
    if err != nil {
        var timeoutErr *TimeoutError
        if errors.As(err, &timeoutErr) {
            // Timeout occurred - use cached fallback
            fmt.Printf("Request timed out, using cached profile\\n")
            return getCachedProfile(userID), nil
        }
        return nil, err
    }

    return profile, nil
}

type UserProfile struct {
    ID   string
    Name string
}

func getCachedProfile(userID string) *UserProfile {
    return &UserProfile{ID: userID, Name: "Cached User"}
}`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope:
          "Complete timeout implementation using Go's context package for cancellation propagation",
        prerequisites: [
          "Go context package",
          "HTTP client",
          "Error handling",
          "Defer statements",
        ],
        systemPosition:
          "Service layer for external API calls with automatic timeout and cancellation",
      },
      annotations: [
        {
          id: "go-timeout-error",
          lines: [11, 18],
          action: "Define custom TimeoutError type with operation context",
          reason:
            "Custom error type allows callers to distinguish timeouts from other failures and access timeout metadata",
          contextLevel: "local",
          relatedConcepts: ["error-wrapping", "typed-errors"],
        },
        {
          id: "go-context-timeout",
          lines: [23, 24],
          action:
            "Create context with 5-second deadline and defer cancellation",
          reason:
            "WithTimeout returns a context that automatically cancels after duration; defer ensures cleanup even if function panics",
          contextLevel: "module",
          relatedConcepts: ["context-propagation", "resource-cleanup"],
        },
        {
          id: "go-request-context",
          lines: [27, 34],
          action: "Attach context to HTTP request for cancellation support",
          reason:
            "NewRequestWithContext wires the timeout into the HTTP client, enabling automatic cancellation when deadline expires",
          contextLevel: "local",
          relatedConcepts: ["cancellation-tokens"],
        },
        {
          id: "go-deadline-check",
          lines: [40, 46],
          action: "Check for context.DeadlineExceeded and wrap in custom error",
          reason:
            "Converting standard context error to domain-specific timeout error provides better error context for logging and monitoring",
          contextLevel: "module",
          relatedConcepts: ["error-handling", "observability"],
        },
      ],
      highlights: [
        {
          lines: [23, 24],
          label: "Context-based timeout enforcement",
          sbvpDomain: "behavior",
        },
        {
          lines: [27, 34],
          label: "Context propagation to HTTP client",
          sbvpDomain: "structure",
        },
        {
          lines: [60, 71],
          label: "Fallback handling on timeout",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "timeout-python-asyncio",
      language: "python",
      title: "Asyncio Timeout with async/await",
      description:
        "Modern Python timeout implementation using asyncio.timeout for concurrent operations",
      code: `import asyncio
import aiohttp
from typing import Optional, TypeVar, Callable
from datetime import timedelta

T = TypeVar('T')

class TimeoutError(Exception):
    """Custom timeout error with operation context"""
    def __init__(self, operation: str, timeout_seconds: float):
        self.operation = operation
        self.timeout_seconds = timeout_seconds
        super().__init__(
            f"{operation} timed out after {timeout_seconds}s"
        )

async def fetch_with_timeout(
    url: str,
    timeout_seconds: float = 5.0,
    session: Optional[aiohttp.ClientSession] = None
) -> dict:
    """
    Fetch data from URL with timeout enforcement.

    Raises TimeoutError if operation exceeds timeout_seconds.
    """
    should_close_session = session is None
    if session is None:
        session = aiohttp.ClientSession()

    try:
        # asyncio.timeout creates a context manager that cancels on timeout
        async with asyncio.timeout(timeout_seconds):
            async with session.get(url) as response:
                response.raise_for_status()
                return await response.json()
    except asyncio.TimeoutError:
        # Convert standard timeout to custom error with context
        raise TimeoutError(
            operation=f"fetch_with_timeout({url})",
            timeout_seconds=timeout_seconds
        )
    finally:
        if should_close_session:
            await session.close()

async def fetch_user_profile(
    user_id: str,
    timeout: float = 5.0
) -> dict:
    """Fetch user profile with timeout and retry logic"""
    url = f"https://api.example.com/users/{user_id}"

    try:
        profile = await fetch_with_timeout(url, timeout_seconds=timeout)
        return profile
    except TimeoutError as e:
        print(f"Timeout error: {e}")
        # Fallback to cached data
        return await get_cached_profile(user_id)
    except aiohttp.ClientError as e:
        print(f"HTTP error: {e}")
        raise

async def fetch_multiple_with_timeout(
    urls: list[str],
    timeout_per_request: float = 5.0,
    overall_timeout: float = 30.0
) -> list[dict]:
    """
    Fetch multiple URLs concurrently with per-request and overall timeouts.
    Demonstrates nested timeout contexts.
    """
    async def fetch_one(url: str) -> dict:
        try:
            return await fetch_with_timeout(url, timeout_per_request)
        except TimeoutError:
            # Individual request timed out - return empty result
            return {"url": url, "error": "timeout"}

    # Overall timeout wraps all concurrent requests
    async with asyncio.timeout(overall_timeout):
        tasks = [fetch_one(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if not isinstance(r, Exception)]

async def get_cached_profile(user_id: str) -> dict:
    """Simulate fetching from cache"""
    await asyncio.sleep(0.1)
    return {"id": user_id, "name": "Cached User", "cached": True}

# Usage example
async def main():
    # Single request with timeout
    try:
        profile = await fetch_user_profile("user123", timeout=3.0)
        print(f"Got profile: {profile}")
    except Exception as e:
        print(f"Failed to fetch profile: {e}")

    # Multiple concurrent requests with timeouts
    urls = [
        "https://api.example.com/users/1",
        "https://api.example.com/users/2",
        "https://api.example.com/users/3",
    ]
    results = await fetch_multiple_with_timeout(
        urls,
        timeout_per_request=5.0,
        overall_timeout=15.0
    )
    print(f"Fetched {len(results)} profiles")

if __name__ == "__main__":
    asyncio.run(main())`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete async timeout implementation with nested contexts, concurrent operations, and fallback handling",
        prerequisites: [
          "Python asyncio",
          "async/await syntax",
          "Context managers",
          "Type hints",
        ],
        systemPosition:
          "Async service layer for concurrent API calls with timeout enforcement and graceful degradation",
      },
      annotations: [
        {
          id: "py-timeout-context",
          lines: [32, 36],
          action:
            "Use asyncio.timeout context manager to enforce timeout boundary",
          reason:
            "asyncio.timeout cancels the async operation if it exceeds the deadline, raising asyncio.TimeoutError",
          contextLevel: "local",
          relatedConcepts: ["context-managers", "async-cancellation"],
        },
        {
          id: "py-timeout-conversion",
          lines: [37, 42],
          action:
            "Catch asyncio.TimeoutError and convert to domain-specific error",
          reason:
            "Custom error type provides operation context (URL, timeout value) for better debugging and observability",
          contextLevel: "module",
          relatedConcepts: ["error-handling", "exception-chaining"],
        },
        {
          id: "py-fallback-handling",
          lines: [54, 59],
          action: "Implement fallback to cached data on timeout",
          reason:
            "Graceful degradation maintains partial functionality when external service is slow or unresponsive",
          contextLevel: "system",
          relatedConcepts: ["graceful-degradation", "cache-aside"],
        },
        {
          id: "py-nested-timeouts",
          lines: [80, 83],
          action:
            "Use nested timeout contexts for per-request and overall limits",
          reason:
            "Overall timeout prevents unbounded waiting even if all individual requests complete; enables fail-fast for batch operations",
          contextLevel: "system",
          relatedConcepts: ["deadline-propagation", "concurrent-control"],
        },
      ],
      highlights: [
        {
          lines: [32, 36],
          label: "Asyncio timeout context manager",
          sbvpDomain: "behavior",
        },
        {
          lines: [54, 59],
          label: "Graceful degradation with fallback",
          sbvpDomain: "philosophy",
        },
        {
          lines: [80, 83],
          label: "Nested timeout for concurrent operations",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Configuration - Timeouts are universally configured in HTTP clients (fetch, axios, HttpClient, RestTemplate) as default or per-request settings; when an API client makes 1000s of requests per hour, setting a 5-second connection timeout and 30-second read timeout prevents indefinite hangs from network partitions, overloaded services, or crashed backends; the client becomes the first line of defense against unbounded waiting, immediately freeing resources when requests exceed acceptable latency thresholds; timeout configuration at the client level ensures every outbound request has a maximum wait bound without requiring explicit timeout logic in business code.",
      "Database Query Execution - Database drivers and ORMs wrap query execution with configurable timeouts to prevent long-running queries from monopolizing connection pool connections; when executing SELECT queries against large tables, a 10-second query timeout prevents poorly-optimized queries (missing indexes, full table scans) from holding database connections indefinitely; JDBC setQueryTimeout(), SQLAlchemy pool_timeout, and ActiveRecord statement_timeout enforce these bounds; this placement protects connection pools from exhaustion while enabling rapid detection of query performance issues that would otherwise manifest as mysterious application hangs.",
      "gRPC Service Call Deadlines - gRPC enforces timeouts through deadline propagation where each RPC call carries an absolute deadline that propagates through the entire call chain; when Service A calls Service B (deadline: T+5s), which calls Service C, the deadline automatically propagates with decreasing time remaining (T+4s to Service C); this placement ensures distributed call chains fail fast together rather than having intermediate services wait indefinitely while upstream callers have already timed out; the deadline mechanism turns a series of independent timeouts into a coordinated distributed timeout system.",
      "Message Queue Consumer Processing - Message consumers implement per-message processing timeouts to prevent poison messages or slow operations from blocking queue consumption; when consuming from RabbitMQ, SQS, or Kafka, wrapping message handlers with a timeout (e.g., 30 seconds per message) ensures that a single stuck message (deadlock, infinite loop, external service hang) doesn't stop the entire queue from processing; after timeout, the message is rejected or sent to dead letter queue while the consumer continues processing subsequent messages; this placement maintains queue throughput even when individual messages trigger problematic code paths.",
      "User-Facing Request Handlers - Web frameworks and API gateways apply top-level request timeouts to prevent slow endpoints from monopolizing worker threads; when a web server handles concurrent requests with limited workers (e.g., 100 threads), setting a 60-second request timeout ensures no single request can hold a worker thread indefinitely due to slow database queries, external API calls, or runaway computations; frameworks like Express (http.Server.setTimeout), Spring Boot (server.connection-timeout), and nginx (proxy_read_timeout) enforce these bounds at the entry point; this placement protects server capacity and provides predictable worst-case response times to clients, even when downstream dependencies fail.",
    ],
    interactsWith: [
      "retry",
      "circuit-breaker",
      "deadline-propagation",
      "bulkhead",
    ],
    architecturalBoundaries: [
      "Network I/O Boundary - Timeouts wrap all network operations (TCP connects, socket reads, DNS lookups) to bound wait time when packets are dropped, connections hang, or remote hosts become unresponsive; socket-level timeouts (connect timeout: 2s, read timeout: 30s) prevent indefinite blocking on network system calls; this boundary transforms unpredictable network failures (silent packet drops, black hole routing) into fast, actionable timeout errors that enable rapid recovery and resource reclamation; without timeouts, network failures manifest as mysterious infinite hangs rather than explicit errors.",
      "Database Access Boundary - Timeouts surround database operations (connection acquisition, query execution, transaction commits) to handle overloaded databases, network partitions to database hosts, and long-running queries; connection pool timeouts (5s) prevent applications from waiting indefinitely for available connections when pool is exhausted; query timeouts (30s) abort runaway queries before they consume excessive database resources; this boundary ensures database problems don't cascade into application-wide resource exhaustion and provides clear signals for database performance issues.",
      "External Service Integration Boundary - Timeouts wrap calls to third-party APIs and services (payment gateways, geocoding, authentication providers) to handle slow or unresponsive external systems; when calling Stripe API with 10-second timeout, slow responses from Stripe's infrastructure trigger timeout rather than indefinite wait; this boundary isolates your application from external service degradation—if a third-party has an outage, your system fails fast with timeouts rather than accumulating hung requests that exhaust your own resources; timeout acts as a firewall preventing external slowness from propagating into your infrastructure.",
      "Distributed Transaction Boundary - Timeouts bound the execution time of distributed transactions (two-phase commit, saga orchestration) to prevent indefinite waiting for coordinator responses or participant votes; when coordinating a distributed transaction across multiple services, setting transaction timeout (e.g., 30 seconds) ensures that network partitions or crashed participants don't leave the system in limbo indefinitely; after timeout, the coordinator aborts the transaction and releases locks; this boundary provides liveness guarantees in distributed transactions—the system will eventually reach a terminal state (committed or aborted) rather than hanging forever waiting for unreachable participants.",
    ],
  },

  implementations: [
    {
      id: "axios-timeout",
      name: "Axios HTTP Client Timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Built-in timeout configuration for HTTP requests with separate connection and response timeouts. Supports global defaults and per-request overrides. Automatically aborts requests when timeout expires.",
      links: {
        docs: "https://axios-http.com/docs/req_config",
        github: "https://github.com/axios/axios",
      },
      codeSnippet: `import axios from 'axios';

// Global default timeout
const api = axios.create({
  timeout: 5000, // 5 second timeout for all requests
  timeoutErrorMessage: 'Request timeout - server took too long to respond'
});

// Per-request timeout override
const response = await api.get('/api/users/123', {
  timeout: 10000 // Override with 10 seconds for this request
});

// Handling timeout errors
try {
  await api.get('/slow-endpoint');
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.log('Request timed out');
  }
}`,
    },
    {
      id: "fetch-abort-controller",
      name: "Fetch API with AbortController",
      type: "platform",
      languages: ["javascript", "typescript"],
      description:
        "Browser and Node.js native fetch API with timeout support via AbortController and AbortSignal. Enables cancellable HTTP requests with time bounds.",
      links: {
        docs: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
      },
      codeSnippet: `// Fetch with timeout using AbortSignal.timeout (modern browsers)
try {
  const response = await fetch('/api/data', {
    signal: AbortSignal.timeout(5000) // 5 second timeout
  });
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out after 5 seconds');
  }
}

// Manual timeout with AbortController (broader compatibility)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('/api/data', {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Fetch aborted due to timeout');
  }
  throw error;
}`,
    },
    {
      id: "context-timeout",
      name: "Go context.WithTimeout",
      type: "library",
      languages: ["go"],
      description:
        "Context-based timeout propagation in Go standard library. Provides cancellation signals that automatically propagate through call chains. Integrated with HTTP client, database drivers, and gRPC.",
      links: {
        docs: "https://pkg.go.dev/context#WithTimeout",
      },
      codeSnippet: `package main

import (
    "context"
    "net/http"
    "time"
)

func fetchData(parentCtx context.Context) (*Data, error) {
    // Create context with 5-second timeout
    ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
    defer cancel() // Always call cancel to release resources

    req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.example.com/data", nil)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        if ctx.Err() == context.DeadlineExceeded {
            return nil, fmt.Errorf("request timed out after 5 seconds")
        }
        return nil, err
    }
    defer resp.Body.Close()

    // Parse response...
    return data, nil
}`,
    },
    {
      id: "asyncio-timeout",
      name: "Python asyncio.timeout",
      type: "library",
      languages: ["python"],
      description:
        "Async context manager for timeouts in Python 3.11+. Automatically cancels async operations when deadline exceeds. Works with any awaitable operation.",
      links: {
        docs: "https://docs.python.org/3/library/asyncio-task.html#asyncio.timeout",
      },
      codeSnippet: `import asyncio
import aiohttp

async def fetch_data():
    # Modern Python 3.11+ syntax
    async with asyncio.timeout(5.0):  # 5 second timeout
        async with aiohttp.ClientSession() as session:
            async with session.get('https://api.example.com/data') as response:
                return await response.json()

# For Python 3.10 and earlier, use asyncio.wait_for
async def fetch_data_legacy():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('https://api.example.com/data') as response:
                data = await asyncio.wait_for(response.json(), timeout=5.0)
                return data
    except asyncio.TimeoutError:
        print("Request timed out after 5 seconds")
        raise`,
    },
    {
      id: "jdbc-query-timeout",
      name: "JDBC Statement Timeout",
      type: "platform",
      languages: ["java"],
      description:
        "Database query timeout enforcement in JDBC standard. Prevents long-running queries from monopolizing database connections. Supported by all major database drivers.",
      links: {
        docs: "https://docs.oracle.com/javase/8/docs/api/java/sql/Statement.html#setQueryTimeout-int-",
      },
      codeSnippet: `import java.sql.*;

public class DatabaseService {
    public User fetchUser(String userId) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            // Set query timeout to 10 seconds
            stmt.setQueryTimeout(10);
            stmt.setString(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapToUser(rs);
                }
                return null;
            } catch (SQLException e) {
                if (e.getErrorCode() == /* timeout error code */) {
                    throw new TimeoutException("Query exceeded 10 second timeout");
                }
                throw e;
            }
        }
    }
}`,
    },
    {
      id: "grpc-deadline",
      name: "gRPC Deadline Propagation",
      type: "platform",
      languages: ["any"],
      description:
        "Built-in deadline mechanism in gRPC that propagates timeout context across service boundaries. Automatically decrements remaining time through call chains.",
      links: {
        docs: "https://grpc.io/docs/guides/deadlines/",
      },
      codeSnippet: `// Go gRPC client with deadline
import (
    "context"
    "time"
    "google.golang.org/grpc"
)

func callService() (*Response, error) {
    // Create context with 5-second deadline
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Deadline automatically propagates to server
    response, err := client.GetUser(ctx, &pb.UserRequest{Id: "123"})
    if err != nil {
        if ctx.Err() == context.DeadlineExceeded {
            return nil, fmt.Errorf("RPC call exceeded deadline")
        }
        return nil, err
    }
    return response, nil
}

// Java gRPC client with deadline
Deadline deadline = Deadline.after(5, TimeUnit.SECONDS);
UserResponse response = userStub
    .withDeadline(deadline)
    .getUser(UserRequest.newBuilder().setId("123").build());`,
    },
    {
      id: "nginx-proxy-timeout",
      name: "Nginx Proxy Timeouts",
      type: "service",
      languages: ["any"],
      description:
        "Reverse proxy timeout configuration for connection, read, and send operations. Protects upstream services from slow clients and provides request-level time bounds.",
      links: {
        docs: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout",
      },
      codeSnippet: `# nginx.conf
http {
    upstream backend {
        server backend1.example.com;
        server backend2.example.com;
    }

    server {
        listen 80;

        location /api/ {
            proxy_pass http://backend;

            # Timeout for establishing connection to upstream
            proxy_connect_timeout 5s;

            # Timeout for reading response from upstream
            proxy_read_timeout 30s;

            # Timeout for sending request to upstream
            proxy_send_timeout 30s;

            # Return 504 Gateway Timeout on timeout
            proxy_next_upstream error timeout;
        }
    }
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "google-grpc",
      systemName: "Google gRPC",
      howUsed:
        "Google's gRPC framework implements deadline propagation where timeouts automatically cascade through distributed call chains. When a client makes an RPC call with a 10-second deadline, the deadline propagates to all downstream services with remaining time automatically decremented at each hop (9.5s, 8.7s, 7.2s). The server checks the deadline before starting expensive operations—if insufficient time remains, it returns DEADLINE_EXCEEDED immediately rather than wasting resources. This mechanism prevents cascading timeout failures where upstream services timeout while downstream services continue processing. Pattern composition: Deadline Propagation + Context Cancellation + Automatic Time Decrementation. Rationale: Microservice architectures often have call depths of 5-10 services; without coordinated timeouts, upstream services timeout while downstream services waste resources on results that will never be used. Impact: Reduced wasted computation by 70% during partial outages; enabled consistent timeout behavior across 10,000+ microservices; prevented resource exhaustion during cascading failures by allowing fast failure detection at every service boundary.",
      source: "https://grpc.io/docs/guides/deadlines/",
    },
    {
      systemId: "aws-lambda",
      systemName: "AWS Lambda",
      howUsed:
        "AWS Lambda enforces function-level timeouts (configurable from 1 second to 15 minutes) to prevent runaway executions and ensure predictable billing. Each Lambda invocation has a hard deadline enforced by the Lambda runtime—when timeout expires, the execution is forcibly terminated, resources are reclaimed, and InvocationTimeoutError is returned to the caller. This timeout acts as a safety bound for arbitrary user code that might contain infinite loops, deadlocks, or hung network calls. The timeout also caps maximum cost per invocation (execution time × memory allocation = cost). Pattern composition: Hard Timeout + Resource Reclamation + Billing Cap + Forced Termination. Rationale: Serverless functions run arbitrary third-party code on shared infrastructure; without timeouts, a single buggy function could monopolize resources indefinitely. Impact: Processed 100+ trillion invocations with deterministic execution bounds; prevented resource exhaustion from runaway functions; enabled predictable cost modeling (max cost = timeout × memory × invocation rate); maintained infrastructure stability despite executing untrusted customer code at massive scale.",
    },
    {
      systemId: "netflix-hystrix",
      systemName: "Netflix Hystrix",
      howUsed:
        "Netflix's Hystrix library implements execution timeouts for all remote service calls with configurable per-command timeout values. When wrapping a call to a downstream service (e.g., user recommendation API), Hystrix starts a timer thread that races against the actual call—if the call doesn't complete within the configured timeout (default 1 second), Hystrix interrupts the execution thread and triggers fallback logic. The timeout mechanism integrates with circuit breakers: repeated timeouts count as failures that can trip the circuit, preventing further timeout-prone calls. Thread pool bulkheads ensure timing out calls don't exhaust all threads. Pattern composition: Timeout + Circuit Breaker + Bulkhead + Fallback. Rationale: Netflix's microservice architecture has 500+ services with deep call chains; slow dependencies can cascade latency through entire request paths. Impact: Reduced P99 latency from 5 seconds to 1.2 seconds by failing fast on slow dependencies; prevented cascading failures during partial outages; enabled graceful degradation with fallback responses when services timeout; maintained acceptable user experience even when 30% of backend services were degraded.",
      source:
        "https://github.com/Netflix/Hystrix/wiki/Configuration#execution.isolation.thread.timeoutInMilliseconds",
    },
    {
      systemId: "stripe-api",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe implements aggressive client-side timeouts (default 80 seconds) on all API requests to prevent hung payment operations from blocking merchant applications. The Stripe SDK configures HTTP client timeouts at both connection (10 seconds) and read (70 seconds) levels. If a payment request times out, the SDK returns a clear timeout error to the merchant, who can then query the payment status via idempotency key to determine if the charge actually succeeded despite the timeout. This prevents the ambiguous state where merchant doesn't know if payment completed. Pattern composition: Connection Timeout + Read Timeout + Idempotency + Status Polling. Rationale: Payment operations are critical path operations that block checkout flows; hung requests create terrible user experience and abandoned carts. Impact: Reduced checkout abandonment by 15% through faster timeout detection; prevented resource leaks from hung connections; enabled merchants to implement retry logic with idempotency guarantees; maintained 99.99% API availability despite network instability by failing fast rather than accumulating hung connections.",
      source: "https://stripe.com/docs/api/errors#timeouts",
    },
    {
      systemId: "elasticsearch",
      systemName: "Elasticsearch",
      howUsed:
        "Elasticsearch implements multi-level timeouts: cluster-level timeouts for distributed search coordination, node-level timeouts for individual shard queries, and client-level timeouts for entire requests. When executing a distributed search across 100 shards with a 30-second timeout, the coordinator node enforces the timeout by cancelling slow shard queries and returning partial results from responsive shards. Each shard query also has its own timeout (configurable per index) to prevent runaway queries from monopolizing resources. Client libraries set request-level timeouts (default: no timeout) that bound the entire operation including network time. Pattern composition: Hierarchical Timeouts + Partial Results + Query Cancellation + Resource Limits. Rationale: Search queries can be arbitrarily complex and expensive; without timeouts, a single heavy query can overload the cluster and cause cascading slowness. Impact: Maintained cluster stability under heavy query load by cancelling expensive queries after timeout; enabled partial result returns ensuring some data is better than infinite wait; prevented query-induced outages that previously required cluster restarts; supported multi-tenant workloads where one tenant's expensive queries don't impact others through enforced timeouts.",
      source:
        "https://www.elastic.co/guide/en/elasticsearch/reference/current/search-timeout.html",
    },
  ],

  references: [
    {
      title:
        "Timeouts, Retries, and Backoff with Jitter - AWS Architecture Blog",
      url: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
      type: "article",
      author: "AWS Architecture Team",
    },
    {
      title: "Deadlines - gRPC Documentation",
      url: "https://grpc.io/docs/guides/deadlines/",
      type: "documentation",
      author: "Google gRPC Team",
    },
    {
      title:
        "Release It! - Design and Deploy Production-Ready Software (Chapter: Timeouts)",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title:
        "Designing Data-Intensive Applications (Chapter: Timeouts and Unbounded Delays)",
      url: "https://dataintensive.net/",
      type: "book",
      author: "Martin Kleppmann",
    },
    {
      title: "Hystrix Configuration - Execution Timeout",
      url: "https://github.com/Netflix/Hystrix/wiki/Configuration#execution.isolation.thread.timeoutInMilliseconds",
      type: "documentation",
      author: "Netflix",
    },
    {
      title:
        "Distributed Systems: For Fun and Profit (Chapter: Time and Order)",
      url: "http://book.mixu.net/distsys/time.html",
      type: "article",
      author: "Mikito Takada",
    },
    {
      title: "Site Reliability Engineering - Addressing Cascading Failures",
      url: "https://sre.google/sre-book/addressing-cascading-failures/",
      type: "book",
      author: "Google SRE Team",
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
