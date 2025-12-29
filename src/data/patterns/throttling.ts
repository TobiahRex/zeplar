import type { Pattern } from "../schema";

export const throttling: Pattern = {
  id: "throttling",
  slug: "throttling",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → ⏱️ Temporal → 🚦 Throttling",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Temporal",
    level: 4,
  },

  concept: {
    name: "Throttling",
    emoji: "🚦",
    tagline: "Max one execution per time window",
    definition:
      "Throttling is a rate-limiting technique that enforces a maximum execution frequency by allowing at most one function call per specified time interval, regardless of how many invocations are attempted. Like a traffic light that only lets cars through every N seconds, throttling ensures that a function executes no more frequently than the configured interval, even when called repeatedly. When invoked during the waiting period, subsequent calls are typically ignored (dropped) or queued until the interval expires. The first call in a time window executes immediately, then a timer begins, and all calls during that timer period are suppressed until the interval resets. This differs from debouncing, which delays execution until activity stops—throttling guarantees regular execution at predictable intervals during continuous activity. Common implementations include leading-edge throttling (execute immediately, then wait), trailing-edge throttling (wait first, then execute), or both (execute at both start and end of interval). Throttling is essential for controlling resource consumption in high-frequency event scenarios where every invocation would be wasteful or overwhelming, such as scroll handlers, window resize events, API rate limiting, or sensor data processing.",
    problemSolved:
      "High-frequency events like scroll, mousemove, window resize, or real-time sensor data can trigger thousands of function calls per second, overwhelming the system with unnecessary work. Without throttling, a scroll handler might fire 60 times per second (every 16ms), recalculating layouts, making network requests, or updating UI state far faster than humans can perceive or systems can handle efficiently. This excessive execution wastes CPU cycles, drains battery on mobile devices, saturates network bandwidth with redundant API calls, and creates janky user experiences due to main thread blocking. Throttling solves this by capping execution frequency to a reasonable rate—for example, limiting scroll handlers to once every 100ms, reducing 60 calls per second to 10, a 83% reduction in work. It guarantees predictable resource usage, prevents API rate limit violations by enforcing client-side request caps, and ensures fair resource distribution across multiple event sources. Additionally, throttling enables graceful degradation under load by prioritizing most recent events while discarding intermediate noise, maintaining responsiveness without the overhead of processing every single event.",
    tradeoffs: {
      pros: [
        "Guarantees maximum execution rate for predictable resource usage",
        "Reduces CPU, memory, and network consumption by eliminating redundant work",
        "Prevents API rate limit violations through client-side enforcement",
        "Maintains responsiveness during high-frequency events like scrolling",
        "Enables fair distribution of resources across multiple event sources",
      ],
      cons: [
        "Some events are dropped, potentially losing intermediate state changes",
        "Introduces artificial latency between invocation and execution",
        "Requires careful tuning of interval to balance responsiveness vs. efficiency",
        "Complexity overhead of managing timers and execution state",
        "May miss rapid state transitions if interval is too coarse",
      ],
    },
    relatedPatterns: [
      "debouncing",
      "rate-limiting",
      "backpressure",
      "token-bucket",
      "sampling",
      "windowing",
      "request-coalescing",
    ],
  },

  structure: {
    participants: [
      {
        name: "Throttler",
        role: "Execution Controller",
        responsibilities: [
          "Track time of last execution",
          "Enforce minimum interval between calls",
          "Decide whether to execute or suppress incoming calls",
        ],
      },
      {
        name: "Rate Limiter",
        role: "Interval Timer",
        responsibilities: [
          "Maintain timer for throttle interval",
          "Signal when interval has elapsed",
          "Reset timer after execution",
        ],
      },
      {
        name: "Last Execution Tracker",
        role: "State Manager",
        responsibilities: [
          "Store timestamp of most recent execution",
          "Calculate elapsed time since last call",
          "Update timestamp after successful execution",
        ],
      },
      {
        name: "Event Queue",
        role: "Buffer (optional)",
        responsibilities: [
          "Hold pending calls during throttle period",
          "Execute most recent call when interval resets (trailing-edge)",
        ],
      },
      {
        name: "Protected Function",
        role: "Work Performer",
        responsibilities: [
          "Execute the actual business logic",
          "Operate with guaranteed rate limits",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Caller
    participant T as Throttler
    participant Timer as Rate Limiter
    participant F as Protected Function

    Note over C,F: First call (immediate execution)
    C->>T: Call 1 (t=0ms)
    T->>T: Check: No recent execution
    T->>F: Execute
    F-->>T: Result
    T->>Timer: Start interval (100ms)
    T-->>C: Return result

    Note over C,F: Calls during throttle period (dropped)
    C->>T: Call 2 (t=30ms)
    T->>T: Check: 30ms < 100ms interval
    T-->>C: Suppress (drop)

    C->>T: Call 3 (t=60ms)
    T->>T: Check: 60ms < 100ms interval
    T-->>C: Suppress (drop)

    Note over C,F: After interval expires
    C->>T: Call 4 (t=150ms)
    T->>T: Check: 150ms >= 100ms interval
    T->>F: Execute
    F-->>T: Result
    T->>Timer: Reset interval
    T-->>C: Return result`,
    flow: [
      {
        step: 1,
        actor: "Caller",
        action: "Invoke Function",
        description: "Caller triggers function (e.g., scroll event fires)",
      },
      {
        step: 2,
        actor: "Throttler",
        action: "Check Last Execution",
        description:
          "Throttler checks timestamp of last execution and calculates elapsed time",
      },
      {
        step: 3,
        actor: "Throttler",
        action: "Evaluate Interval",
        description:
          "If elapsed time >= configured interval, allow execution; otherwise suppress",
      },
      {
        step: 4,
        actor: "Throttler",
        action: "Execute or Drop",
        description:
          "Either invoke protected function and update timestamp, or drop the call",
      },
      {
        step: 5,
        actor: "Protected Function",
        action: "Perform Work",
        description:
          "If allowed, execute the actual business logic (API call, UI update)",
      },
      {
        step: 6,
        actor: "Throttler",
        action: "Update State",
        description: "Record current timestamp as last execution time",
      },
      {
        step: 7,
        actor: "Rate Limiter",
        action: "Reset Timer",
        description:
          "Start new interval period; subsequent calls suppressed until timer expires",
      },
    ],
    invariants: [
      "Maximum one execution per configured interval period",
      "First call in a time window executes immediately (leading-edge)",
      "Elapsed time calculation must be monotonically increasing",
      "Timer state must be reset after successful execution",
      "Suppressed calls during interval must not queue indefinitely",
      "Interval duration must be configurable and positive",
    ],
  },

  codeExamples: [
    {
      id: "throttle-ts-basic",
      language: "typescript",
      title: "Basic Throttle Implementation",
      description:
        "A simple leading-edge throttle that executes immediately on first call, then suppresses subsequent calls until interval expires",
      code: `type ThrottleCallback<T extends any[]> = (...args: T) => void;

interface ThrottleOptions {
  interval: number; // Minimum milliseconds between executions
  leading?: boolean; // Execute on first call (default: true)
  trailing?: boolean; // Execute on last call after interval (default: false)
}

function throttle<T extends any[]>(
  callback: ThrottleCallback<T>,
  options: ThrottleOptions
): ThrottleCallback<T> {
  let lastExecutionTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: T | null = null;

  const { interval, leading = true, trailing = false } = options;

  return function throttled(...args: T): void {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTime;

    // Store arguments for potential trailing execution
    lastArgs = args;

    // Clear existing trailing timeout if any
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // LEADING EDGE: Execute immediately if interval has passed
    if (timeSinceLastExecution >= interval) {
      if (leading) {
        callback(...args);
        lastExecutionTime = now;
      }

      // Schedule trailing execution if enabled
      if (trailing) {
        timeoutId = setTimeout(() => {
          if (lastArgs) {
            callback(...lastArgs);
            lastExecutionTime = Date.now();
            lastArgs = null;
          }
          timeoutId = null;
        }, interval);
      }
    }
    // DURING INTERVAL: Suppressed, but schedule trailing if enabled
    else if (trailing) {
      const remainingTime = interval - timeSinceLastExecution;
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          callback(...lastArgs);
          lastExecutionTime = Date.now();
          lastArgs = null;
        }
        timeoutId = null;
      }, remainingTime);
    }
  };
}

// Example 1: Scroll event throttling (leading edge only)
const handleScroll = throttle(
  () => {
    const scrollPosition = window.scrollY;
    console.log(\`Scroll position: \${scrollPosition}px\`);

    // Update UI based on scroll (e.g., show/hide header)
    const header = document.querySelector('.header');
    if (scrollPosition > 100) {
      header?.classList.add('hidden');
    } else {
      header?.classList.remove('hidden');
    }
  },
  { interval: 100, leading: true, trailing: false }
);

window.addEventListener('scroll', handleScroll);

// Example 2: Window resize with trailing edge
const handleResize = throttle(
  () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log(\`Window resized: \${width}x\${height}\`);

    // Recalculate layout (expensive operation)
    recalculateResponsiveLayout(width, height);
  },
  { interval: 200, leading: true, trailing: true }
);

window.addEventListener('resize', handleResize);

// Example 3: API request throttling
const searchAPI = throttle(
  async (query: string) => {
    console.log(\`Searching for: \${query}\`);
    const response = await fetch(\`/api/search?q=\${query}\`);
    const results = await response.json();
    displaySearchResults(results);
  },
  { interval: 300, leading: true, trailing: true }
);

// Type-ahead search input
document.querySelector('#search-input')?.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  searchAPI(input.value);
});

// Helper functions (implementation omitted for brevity)
function recalculateResponsiveLayout(width: number, height: number): void {
  // Complex layout calculations
}

function displaySearchResults(results: any[]): void {
  // Update search results UI
}`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope:
          "Complete throttle function with leading/trailing edge support and three real-world usage examples",
        prerequisites: [
          "TypeScript generics",
          "Closures and lexical scope",
          "DOM event handling",
          "setTimeout/clearTimeout",
        ],
        systemPosition:
          "Wraps DOM event handlers, API calls, or any high-frequency callback to enforce rate limits",
      },
      annotations: [
        {
          id: "throttle-signature",
          lines: [1, 6],
          action:
            "Define throttle options interface with leading/trailing edge control",
          reason:
            "Throttle behavior varies by use case: leading-edge for immediate feedback (scroll), trailing-edge to capture final state (resize), or both for comprehensive coverage",
          contextLevel: "local",
          relatedConcepts: ["debouncing", "rate-limiting"],
        },
        {
          id: "throttle-closure",
          lines: [8, 15],
          action:
            "Create closure to maintain execution state across invocations",
          reason:
            "Throttle requires persistent state (last execution time, pending timeout, stored args) that survives between calls; closures provide this without global state pollution",
          contextLevel: "module",
          relatedConcepts: ["closure", "lexical-scope"],
        },
        {
          id: "throttle-time-check",
          lines: [17, 20],
          action: "Calculate elapsed time since last execution",
          reason:
            "Core throttling logic: compare elapsed time against configured interval to decide whether to execute or suppress",
          contextLevel: "local",
        },
        {
          id: "throttle-trailing-clear",
          lines: [25, 29],
          action: "Clear any existing trailing timeout",
          reason:
            "When new calls arrive during throttle period, cancel previous trailing timer to ensure only the most recent call executes",
          contextLevel: "local",
          relatedConcepts: ["trailing-edge"],
        },
        {
          id: "throttle-leading-exec",
          lines: [31, 47],
          action: "Execute immediately if interval passed (leading-edge)",
          reason:
            "Leading-edge execution provides immediate feedback to users; critical for interactive events like scrolling where visual updates should feel instant",
          contextLevel: "module",
          relatedConcepts: ["leading-edge", "user-experience"],
        },
        {
          id: "throttle-trailing-schedule",
          lines: [49, 62],
          action: "Schedule trailing execution if still within interval",
          reason:
            "Trailing-edge ensures final state is captured; useful for resize events where you want to process the last value after user stops resizing",
          contextLevel: "module",
          relatedConcepts: ["trailing-edge", "debouncing"],
        },
        {
          id: "throttle-scroll-example",
          lines: [66, 80],
          action: "Throttle scroll handler to limit UI updates",
          reason:
            "Scroll events fire 60+ times per second; throttling to 100ms (10/sec) provides smooth feedback while reducing 83% of unnecessary work",
          contextLevel: "system",
          relatedConcepts: ["event-handler", "performance-optimization"],
        },
        {
          id: "throttle-resize-example",
          lines: [82, 94],
          action:
            "Throttle resize with both leading and trailing to capture start and end",
          reason:
            "Resize benefits from both edges: leading provides immediate visual feedback, trailing ensures final layout calculation with actual dimensions",
          contextLevel: "system",
          relatedConcepts: ["responsive-design", "layout-calculation"],
        },
        {
          id: "throttle-api-example",
          lines: [96, 108],
          action:
            "Throttle API search requests to prevent rate limit violations",
          reason:
            "Type-ahead search generates requests on every keystroke; throttling prevents overwhelming server and hitting API rate limits while maintaining responsive UX",
          contextLevel: "system",
          relatedConcepts: ["api-rate-limiting", "type-ahead-search"],
        },
      ],
      highlights: [
        {
          lines: [8, 15],
          label: "Closure state management",
          sbvpDomain: "structure",
        },
        {
          lines: [17, 29],
          label: "Time-based throttle logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [31, 47],
          label: "Leading-edge execution path",
          sbvpDomain: "behavior",
        },
        {
          lines: [49, 62],
          label: "Trailing-edge execution path",
          sbvpDomain: "behavior",
        },
        {
          lines: [66, 80],
          label: "Scroll throttling usage",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "throttle-python-decorator",
      language: "python",
      title: "Throttle Decorator in Python",
      description:
        "Python throttle implementation using decorators for clean integration with class methods and functions",
      code: `from functools import wraps
from time import time, sleep
from typing import Callable, TypeVar, ParamSpec, Any
from threading import Lock

P = ParamSpec('P')
T = TypeVar('T')

class Throttle:
    """
    Throttle decorator that limits function execution to at most once per interval.

    Args:
        interval: Minimum seconds between executions
        leading: Execute immediately on first call (default: True)
        trailing: Execute on last call after interval (default: False)
    """

    def __init__(self, interval: float, leading: bool = True, trailing: bool = False):
        self.interval = interval
        self.leading = leading
        self.trailing = trailing
        self.last_execution: float = 0.0
        self.lock = Lock()  # Thread-safe for concurrent calls
        self.timer = None
        self.last_args: tuple | None = None
        self.last_kwargs: dict | None = None

    def __call__(self, func: Callable[P, T]) -> Callable[P, T | None]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
            with self.lock:
                now = time()
                elapsed = now - self.last_execution

                # Store latest args for potential trailing execution
                self.last_args = args
                self.last_kwargs = kwargs

                # Cancel pending trailing timer
                if self.timer is not None:
                    self.timer.cancel()
                    self.timer = None

                # LEADING EDGE: Execute if interval has passed
                if elapsed >= self.interval:
                    if self.leading:
                        result = func(*args, **kwargs)
                        self.last_execution = time()

                        # Schedule trailing if enabled
                        if self.trailing:
                            self._schedule_trailing(func)

                        return result

                # DURING INTERVAL: Suppress, but schedule trailing
                elif self.trailing:
                    remaining = self.interval - elapsed
                    self._schedule_trailing(func, delay=remaining)

                return None

        return wrapper

    def _schedule_trailing(self, func: Callable, delay: float | None = None) -> None:
        """Schedule trailing edge execution."""
        from threading import Timer

        delay = delay or self.interval

        def trailing_execution():
            with self.lock:
                if self.last_args is not None:
                    func(*self.last_args, **self.last_kwargs)
                    self.last_execution = time()
                    self.last_args = None
                    self.last_kwargs = None

        self.timer = Timer(delay, trailing_execution)
        self.timer.daemon = True
        self.timer.start()


# Example 1: Analytics event throttling
class AnalyticsTracker:
    """Track user interactions with throttled event sending."""

    def __init__(self):
        self.event_buffer = []

    @Throttle(interval=5.0, leading=True, trailing=True)
    def track_page_view(self, page_url: str, user_id: str) -> None:
        """Send page view events - max once per 5 seconds."""
        print(f"[ANALYTICS] Page view: {page_url} by user {user_id}")

        # Send to analytics service
        self._send_to_analytics({
            'event_type': 'page_view',
            'page_url': page_url,
            'user_id': user_id,
            'timestamp': time()
        })

    @Throttle(interval=2.0, leading=True, trailing=False)
    def track_scroll_depth(self, depth_percent: int, page_url: str) -> None:
        """Track scroll depth - leading edge only for immediate capture."""
        print(f"[ANALYTICS] Scroll depth: {depth_percent}% on {page_url}")

        self._send_to_analytics({
            'event_type': 'scroll_depth',
            'depth_percent': depth_percent,
            'page_url': page_url,
            'timestamp': time()
        })

    def _send_to_analytics(self, event: dict) -> None:
        """Send event to analytics backend."""
        # In production: HTTP POST to analytics endpoint
        self.event_buffer.append(event)


# Example 2: API rate limiting
class WeatherAPIClient:
    """Weather API client with built-in request throttling."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.weather.com"

    @Throttle(interval=1.0, leading=True, trailing=False)
    def get_current_weather(self, city: str) -> dict | None:
        """
        Fetch current weather - throttled to max 1 request per second.

        Prevents hitting API rate limits (60 req/min = 1 req/sec).
        """
        import requests

        print(f"[API] Fetching weather for {city}")

        try:
            response = requests.get(
                f"{self.base_url}/current",
                params={'city': city, 'api_key': self.api_key},
                timeout=5.0
            )
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            print(f"[API ERROR] Failed to fetch weather: {e}")
            return None

    @Throttle(interval=5.0, leading=True, trailing=True)
    def get_forecast(self, city: str, days: int = 7) -> dict | None:
        """
        Fetch weather forecast - throttled to max once per 5 seconds.

        More expensive API call, stricter throttling.
        """
        import requests

        print(f"[API] Fetching {days}-day forecast for {city}")

        try:
            response = requests.get(
                f"{self.base_url}/forecast",
                params={'city': city, 'days': days, 'api_key': self.api_key},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            print(f"[API ERROR] Failed to fetch forecast: {e}")
            return None


# Example 3: Sensor data processing
class SensorDataProcessor:
    """Process high-frequency sensor readings with throttling."""

    def __init__(self):
        self.latest_reading = None

    @Throttle(interval=0.1, leading=True, trailing=False)
    def process_temperature(self, celsius: float, sensor_id: str) -> None:
        """
        Process temperature readings - max 10/second (100ms interval).

        Sensor reports 100 times/sec, throttle reduces to 10/sec.
        """
        fahrenheit = (celsius * 9/5) + 32

        print(f"[SENSOR {sensor_id}] Temperature: {celsius:.2f}°C / {fahrenheit:.2f}°F")

        # Update dashboard, check thresholds
        self._update_dashboard(sensor_id, celsius)

        if celsius > 80:
            self._trigger_alert(sensor_id, celsius)

    @Throttle(interval=1.0, leading=True, trailing=True)
    def process_pressure(self, pascals: float, sensor_id: str) -> None:
        """
        Process pressure readings - max once per second.

        Captures first reading (leading) and final value (trailing).
        """
        print(f"[SENSOR {sensor_id}] Pressure: {pascals:.2f} Pa")

        self._update_dashboard(sensor_id, pascals)

    def _update_dashboard(self, sensor_id: str, value: float) -> None:
        """Update real-time dashboard with sensor reading."""
        self.latest_reading = {'sensor_id': sensor_id, 'value': value, 'time': time()}

    def _trigger_alert(self, sensor_id: str, value: float) -> None:
        """Trigger alert for abnormal sensor reading."""
        print(f"⚠️  ALERT: High temperature on sensor {sensor_id}: {value}°C")


# Usage demonstration
if __name__ == "__main__":
    # Analytics throttling
    tracker = AnalyticsTracker()

    print("=== Analytics Event Throttling ===")
    for i in range(20):
        tracker.track_page_view(f"/page/{i}", "user_123")
        sleep(0.2)  # Rapid page views - most will be throttled

    print("\\n=== API Rate Limiting ===")
    weather_client = WeatherAPIClient(api_key="demo_key")

    for i in range(5):
        weather_client.get_current_weather("San Francisco")
        sleep(0.3)  # Faster than 1/sec - will throttle

    print("\\n=== Sensor Data Processing ===")
    sensor = SensorDataProcessor()

    for i in range(50):
        sensor.process_temperature(25.0 + i * 0.1, "TEMP_001")
        sleep(0.01)  # 100 readings/sec - throttled to 10/sec`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready throttle decorator with thread-safety, trailing edge support, and three domain-specific examples (analytics, API, sensors)",
        prerequisites: [
          "Python decorators",
          "Threading and locks",
          "Type hints and ParamSpec",
          "functools.wraps",
        ],
        systemPosition:
          "Wraps class methods or functions that interact with rate-limited external services, handle high-frequency events, or process sensor data streams",
      },
      annotations: [
        {
          id: "throttle-py-class",
          lines: [9, 27],
          action:
            "Define throttle as a class-based decorator with configurable options",
          reason:
            "Class-based decorators maintain state (last execution time, timers) and provide clean initialization syntax compared to nested closures",
          contextLevel: "module",
          relatedConcepts: ["decorator-pattern", "class-decorators"],
        },
        {
          id: "throttle-py-thread-safe",
          lines: [23, 23],
          action: "Use threading.Lock for thread-safe throttling",
          reason:
            "Python applications often have concurrent threads (web servers, async tasks); lock ensures state consistency when multiple threads call throttled function simultaneously",
          contextLevel: "system",
          relatedConcepts: ["thread-safety", "concurrency"],
        },
        {
          id: "throttle-py-call",
          lines: [29, 60],
          action: "Implement __call__ to make decorator instance callable",
          reason:
            "__call__ allows class instance to wrap functions; returns wrapper that enforces throttle logic on each invocation",
          contextLevel: "module",
          relatedConcepts: ["callable-objects", "decorator-protocol"],
        },
        {
          id: "throttle-py-trailing",
          lines: [63, 79],
          action: "Schedule trailing edge execution using threading.Timer",
          reason:
            "Trailing edge captures final state after burst of calls; Timer runs execution in separate thread after delay without blocking caller",
          contextLevel: "module",
          relatedConcepts: ["trailing-edge", "deferred-execution"],
        },
        {
          id: "throttle-py-analytics",
          lines: [84, 115],
          action: "Throttle analytics events to prevent overwhelming backend",
          reason:
            "Analytics services have rate limits (e.g., 1000 events/min); throttling reduces 20 rapid page views to 4-5 events while capturing first and last",
          contextLevel: "system",
          relatedConcepts: ["analytics", "rate-limiting", "event-tracking"],
        },
        {
          id: "throttle-py-api",
          lines: [118, 174],
          action:
            "Enforce API rate limits client-side to prevent HTTP 429 errors",
          reason:
            "Weather API has 60 requests/min limit (1/sec); client-side throttling prevents rejections and reduces unnecessary network traffic",
          contextLevel: "system",
          relatedConcepts: ["api-rate-limiting", "http-429"],
        },
        {
          id: "throttle-py-sensor",
          lines: [177, 221],
          action:
            "Throttle high-frequency sensor data to manageable processing rate",
          reason:
            "Industrial sensors report 100Hz but processing requires only 10Hz; throttling reduces 90% of processing load while maintaining real-time responsiveness",
          contextLevel: "system",
          relatedConcepts: ["iot", "sensor-data", "downsampling"],
        },
      ],
      highlights: [
        {
          lines: [9, 27],
          label: "Thread-safe throttle decorator class",
          sbvpDomain: "structure",
        },
        {
          lines: [29, 60],
          label: "Throttle execution logic with leading/trailing edges",
          sbvpDomain: "behavior",
        },
        {
          lines: [63, 79],
          label: "Trailing edge timer scheduling",
          sbvpDomain: "behavior",
        },
        {
          lines: [84, 115],
          label: "Analytics event throttling",
          sbvpDomain: "behavior",
        },
        {
          lines: [118, 174],
          label: "API rate limiting",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "throttle-react-hooks",
      language: "typescript",
      title: "React Throttle Hook for UI Events",
      description:
        "Custom React hook for throttling event handlers, search inputs, and API calls with automatic cleanup",
      code: `import { useCallback, useEffect, useRef, useState } from 'react';

interface ThrottleOptions {
  interval: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Custom hook to create a throttled version of a callback function.
 *
 * @param callback - Function to throttle
 * @param options - Throttle configuration
 * @returns Throttled callback with same signature
 */
function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  options: ThrottleOptions
): T {
  const { interval, leading = true, trailing = false } = options;

  const lastExecutionRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastExecutionRef.current;

      lastArgsRef.current = args;

      // Clear existing trailing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // LEADING EDGE: Execute if interval passed
      if (elapsed >= interval) {
        if (leading) {
          callback(...args);
          lastExecutionRef.current = now;
        }

        // Schedule trailing if enabled
        if (trailing) {
          timeoutRef.current = setTimeout(() => {
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current);
              lastExecutionRef.current = Date.now();
            }
          }, interval);
        }
      }
      // DURING INTERVAL: Schedule trailing
      else if (trailing) {
        const remaining = interval - elapsed;
        timeoutRef.current = setTimeout(() => {
          if (lastArgsRef.current) {
            callback(...lastArgsRef.current);
            lastExecutionRef.current = Date.now();
          }
        }, remaining);
      }
    },
    [callback, interval, leading, trailing]
  ) as T;

  return throttledCallback;
}

// =============================================================================
// Example 1: Infinite Scroll Component
// =============================================================================

interface Post {
  id: number;
  title: string;
  content: string;
}

function InfiniteScrollFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMorePosts = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    console.log(\`[LOAD MORE] Fetching page \${page}\`);

    // Simulate API call
    const response = await fetch(\`/api/posts?page=\${page}&limit=20\`);
    const newPosts = await response.json();

    setPosts((prev) => [...prev, ...newPosts]);
    setPage((p) => p + 1);
    setLoading(false);
  }, [page, loading]);

  // Throttle scroll handler - max once per 200ms
  const handleScroll = useThrottle(
    () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Load more when user is 500px from bottom
      if (scrollHeight - (scrollTop + clientHeight) < 500) {
        loadMorePosts();
      }
    },
    { interval: 200, leading: true, trailing: false }
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="feed">
      {posts.map((post) => (
        <article key={post.id} className="post">
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
      {loading && <div className="loader">Loading more posts...</div>}
    </div>
  );
}

// =============================================================================
// Example 2: Real-time Search Component
// =============================================================================

interface SearchResult {
  id: string;
  name: string;
  description: string;
}

function SearchWithThrottle() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    console.log(\`[SEARCH] Querying API for: "\${searchQuery}"\`);

    try {
      const response = await fetch(\`/api/search?q=\${encodeURIComponent(searchQuery)}\`);
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Throttle search - max one API call per 300ms
  // Leading: show results immediately for first keystroke
  // Trailing: ensure final query is searched after typing stops
  const throttledSearch = useThrottle(
    (searchQuery: string) => performSearch(searchQuery),
    { interval: 300, leading: true, trailing: true }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    throttledSearch(newQuery);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search products, articles, users..."
        className="search-input"
      />

      {searching && <div className="search-indicator">Searching...</div>}

      <ul className="search-results">
        {results.map((result) => (
          <li key={result.id} className="search-result-item">
            <h3>{result.name}</h3>
            <p>{result.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// Example 3: Window Resize Handler with Layout Recalculation
// =============================================================================

interface LayoutDimensions {
  width: number;
  height: number;
  columns: number;
  gridGap: number;
}

function ResponsiveGridLayout({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LayoutDimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
    columns: 4,
    gridGap: 16,
  });

  const calculateLayout = useCallback((width: number, height: number) => {
    console.log(\`[LAYOUT] Recalculating for \${width}x\${height}\`);

    // Calculate responsive columns
    let columns = 4;
    let gridGap = 16;

    if (width < 640) {
      columns = 1;
      gridGap = 8;
    } else if (width < 1024) {
      columns = 2;
      gridGap = 12;
    } else if (width < 1536) {
      columns = 3;
      gridGap = 16;
    }

    setLayout({ width, height, columns, gridGap });
  }, []);

  // Throttle resize - leading + trailing
  // Leading: immediate visual feedback when resize starts
  // Trailing: accurate final dimensions when resize ends
  const handleResize = useThrottle(
    () => {
      calculateLayout(window.innerWidth, window.innerHeight);
    },
    { interval: 150, leading: true, trailing: true }
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div
      className="responsive-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: \`repeat(\${layout.columns}, 1fr)\`,
        gap: \`\${layout.gridGap}px\`,
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Example 4: Mouse Move Tracker with Position Updates
// =============================================================================

interface MousePosition {
  x: number;
  y: number;
}

function MouseTracker() {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState<number>(0);
  const lastPositionRef = useRef<MousePosition>({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(Date.now());

  const updatePosition = useCallback((x: number, y: number) => {
    const now = Date.now();
    const timeDelta = (now - lastTimeRef.current) / 1000; // seconds

    // Calculate velocity (pixels per second)
    const dx = x - lastPositionRef.current.x;
    const dy = y - lastPositionRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = distance / timeDelta;

    setPosition({ x, y });
    setVelocity(Math.round(speed));

    lastPositionRef.current = { x, y };
    lastTimeRef.current = now;
  }, []);

  // Throttle mouse move - max 60 updates per second (16.67ms interval)
  const handleMouseMove = useThrottle(
    (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    },
    { interval: 16, leading: true, trailing: false }
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove as any);
    return () => window.removeEventListener('mousemove', handleMouseMove as any);
  }, [handleMouseMove]);

  return (
    <div className="mouse-tracker">
      <div className="position-display">
        <p>X: {position.x}px</p>
        <p>Y: {position.y}px</p>
        <p>Velocity: {velocity}px/s</p>
      </div>

      <div
        className="cursor-follower"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export { useThrottle, InfiniteScrollFeed, SearchWithThrottle, ResponsiveGridLayout, MouseTracker };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production React throttle hook with four complete UI components: infinite scroll, real-time search, responsive layout, and mouse tracking",
        prerequisites: [
          "React hooks (useCallback, useEffect, useRef, useState)",
          "TypeScript generics and type inference",
          "React event handling",
          "Component lifecycle",
        ],
        systemPosition:
          "Integrates into React components to throttle DOM events, API calls, and state updates; reduces re-renders and network requests",
      },
      annotations: [
        {
          id: "throttle-hook-signature",
          lines: [3, 16],
          action:
            "Define custom hook with TypeScript generics for type-safe throttling",
          reason:
            "Generic type T preserves original callback signature; throttled function has identical types for parameters and return value",
          contextLevel: "module",
          relatedConcepts: ["typescript-generics", "type-safety"],
        },
        {
          id: "throttle-hook-refs",
          lines: [21, 24],
          action:
            "Use refs to persist state across renders without triggering re-renders",
          reason:
            "Refs maintain throttle state (last execution time, timeout, args) outside React render cycle; updates don't cause component re-renders",
          contextLevel: "module",
          relatedConcepts: ["react-refs", "render-optimization"],
        },
        {
          id: "throttle-hook-cleanup",
          lines: [26, 33],
          action: "Clean up timeout on component unmount",
          reason:
            "Prevents memory leaks and React warnings; trailing timers must be cleared when component unmounts to avoid calling setState on unmounted component",
          contextLevel: "module",
          relatedConcepts: ["cleanup-functions", "memory-leaks"],
        },
        {
          id: "throttle-hook-callback",
          lines: [35, 76],
          action: "Wrap throttle logic in useCallback with dependencies",
          reason:
            "useCallback memoizes throttled function, preventing recreation on every render; dependencies ensure function updates when options change",
          contextLevel: "module",
          relatedConcepts: ["usecallback", "memoization"],
        },
        {
          id: "throttle-infinite-scroll",
          lines: [83, 143],
          action:
            "Throttle scroll events to detect bottom of page for infinite loading",
          reason:
            "Scroll events fire 60+ times/sec; throttling to 200ms (5/sec) reduces expensive DOM measurements while maintaining smooth infinite scroll experience",
          contextLevel: "system",
          relatedConcepts: ["infinite-scroll", "scroll-optimization"],
        },
        {
          id: "throttle-search-input",
          lines: [149, 215],
          action:
            "Throttle search API calls with leading + trailing for responsive UX",
          reason:
            "Type-ahead search fires on every keystroke; throttling to 300ms with trailing ensures immediate results on first key but batches rapid typing, reducing API calls by 80-90%",
          contextLevel: "system",
          relatedConcepts: [
            "type-ahead",
            "search-optimization",
            "api-throttling",
          ],
        },
        {
          id: "throttle-resize-layout",
          lines: [221, 285],
          action:
            "Throttle window resize to recalculate responsive grid layout efficiently",
          reason:
            "Window resize triggers expensive layout recalculations; throttling with leading + trailing provides immediate feedback and final accurate dimensions",
          contextLevel: "system",
          relatedConcepts: ["responsive-design", "layout-thrashing"],
        },
        {
          id: "throttle-mouse-move",
          lines: [291, 355],
          action: "Throttle mouse move to 60fps for smooth cursor tracking",
          reason:
            "Mouse move events fire 100+ times/sec; throttling to 16ms (60fps) matches display refresh rate, eliminating wasted updates while maintaining fluid animation",
          contextLevel: "system",
          relatedConcepts: ["animation", "frame-rate", "cursor-tracking"],
        },
      ],
      highlights: [
        {
          lines: [15, 76],
          label: "Custom throttle hook with type-safe generics",
          sbvpDomain: "structure",
        },
        {
          lines: [26, 33],
          label: "Cleanup effect for timeout",
          sbvpDomain: "behavior",
        },
        {
          lines: [113, 129],
          label: "Throttled scroll handler for infinite scroll",
          sbvpDomain: "behavior",
        },
        {
          lines: [186, 194],
          label: "Throttled search with leading + trailing",
          sbvpDomain: "behavior",
        },
        {
          lines: [260, 268],
          label: "Throttled resize for responsive layout",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "DOM event handlers (scroll, resize, mousemove, input)",
      "API gateway middleware for request rate limiting",
      "Analytics event batching pipelines",
      "Real-time data stream processors (IoT sensors, metrics)",
      "UI layer for search autocomplete and infinite scroll",
    ],
    interactsWith: ["debouncing", "rate-limiting", "backpressure", "caching"],
    architecturalBoundaries: [
      "Browser event loop and DOM event handling",
      "API gateway enforcing client-side rate limits before backend",
      "Stream processing pipelines reducing sensor data frequency",
      "Analytics ingestion layer batching high-frequency events",
    ],
  },

  philosophy: {
    coreProblem:
      "High-frequency events generate far more function invocations than systems can efficiently process or humans can perceive",
    designPrinciple:
      "Enforce a guaranteed maximum execution rate to prevent resource exhaustion while maintaining perceived responsiveness",
    historicalContext:
      "Emerged from early web development to handle scroll and resize events that would freeze browsers; became critical with rise of real-time web applications and IoT sensor streams",
    alternativesRejected: [
      "Process every event - wastes CPU, drains battery, overwhelms systems",
      "Debouncing only - delays all execution until activity stops, poor for continuous events",
      "Server-side filtering - adds latency and network overhead",
    ],
    mentalModel:
      "Like a turnstile at a stadium that only lets one person through every N seconds, ensuring orderly entry without overwhelming capacity regardless of crowd size",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant U as User
    participant T as Throttler
    participant F as Function

    Note over U,F: Time Window: 100ms
    U->>T: Call 1 (t=0ms)
    T->>F: Execute ✓

    U->>T: Call 2 (t=20ms)
    Note over T: Elapsed: 20ms < 100ms
    T-->>U: Suppress ✗

    U->>T: Call 3 (t=50ms)
    Note over T: Elapsed: 50ms < 100ms
    T-->>U: Suppress ✗

    U->>T: Call 4 (t=120ms)
    Note over T: Elapsed: 120ms >= 100ms
    T->>F: Execute ✓`,
    realWorldAnalogy:
      "A throttle is like an elevator in a busy office building that only departs every 30 seconds. People can press the button as many times as they want during those 30 seconds, but the elevator will only move once the interval expires. The first person gets immediate service (leading edge), but subsequent button presses during the wait period are ignored until the next departure window.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Product search with autocomplete throttles API requests to once per 300ms as user types. Without throttling, typing 'laptop' (6 characters in ~500ms) would send 6 API requests; with throttling, only 2-3 requests are sent, reducing backend load by 50-70%.",
        patternRole:
          "Prevents overwhelming search API while maintaining responsive autocomplete suggestions",
        companies: ["Amazon", "eBay", "Shopify"],
      },
      {
        domain: "Social Media",
        scenario:
          "Infinite scroll feed throttles scroll event handlers to once per 200ms. As user scrolls through posts, handler checks distance from bottom; without throttling, it would execute 60+ times per second, causing jank and excessive API calls for new content.",
        patternRole:
          "Enables smooth infinite scroll while reducing load checks by 95%",
        companies: ["Twitter", "Instagram", "LinkedIn"],
      },
      {
        domain: "IoT / Industrial",
        scenario:
          "Temperature sensors report readings at 100Hz (100 times/sec), but control system only needs 10Hz (10 times/sec) for threshold monitoring. Throttling reduces processing load by 90% while maintaining real-time alerting for critical temperature spikes.",
        patternRole:
          "Downsamples high-frequency sensor data to manageable processing rates",
        companies: ["Tesla", "Nest", "Honeywell"],
      },
    ],
  },

  tags: [
    "performance",
    "rate-limiting",
    "event-handling",
    "optimization",
    "temporal",
    "throttling",
  ],
  difficulty: "intermediate",
};
