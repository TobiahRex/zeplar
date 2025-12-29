import type { Pattern } from "../schema";

export const debouncing: Pattern = {
  id: "debouncing",
  slug: "debouncing",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → ⏱️ Temporal → ⏸️ Debouncing",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Temporal",
    level: 4,
  },

  concept: {
    name: "Debouncing",
    emoji: "⏸️",
    tagline: "Wait for silence before executing",
    definition:
      "Debouncing is a temporal optimization pattern that delays function execution until a pause in rapid, successive events. Like waiting for someone to finish typing before executing a search query, debouncing groups multiple event triggers into a single delayed execution. When an event fires, a timer starts; if another event fires before the timer expires, the timer resets. Only when the timer completes without interruption does the function execute. This transforms a stream of continuous events (keystrokes, scroll events, resize actions) into a single delayed action triggered after activity ceases. The pattern operates through a simple state machine: each event cancels pending executions, resets a countdown timer, and schedules a new execution. The delay period acts as a 'silence detector'—the function only runs when events have stopped arriving for the configured duration. This differs from throttling, which executes at regular intervals regardless of event frequency. Debouncing is essential for preventing performance degradation from expensive operations triggered by high-frequency events like search-as-you-type, window resizing, or auto-save functionality.",
    problemSolved:
      "High-frequency events in user interfaces and I/O operations can trigger expensive computations or network requests hundreds of times per second, causing performance degradation, wasted API calls, and poor user experience. When users type in a search box, each keystroke could trigger an API request, sending 'h', 'he', 'hel', 'hell', 'hello' as separate queries. Window resize events fire dozens of times per second during dragging, potentially triggering costly layout recalculations for each pixel change. Auto-save features without debouncing flood servers with save requests on every keystroke. Debouncing solves this by waiting for a pause in activity before executing, reducing hundreds of potential executions to one. For search inputs, it waits until the user stops typing, sending only the complete query. For resize events, it recalculates layout only after resizing ends. This eliminates unnecessary work, reduces server load, prevents race conditions from out-of-order responses, and improves user experience by avoiding jittery UI updates from rapid-fire function calls.",
    tradeoffs: {
      pros: [
        "Dramatically reduces API calls and expensive computations (90-99% reduction typical)",
        "Prevents server overload from high-frequency client events",
        "Eliminates race conditions from out-of-order responses",
        "Improves UI responsiveness by reducing unnecessary renders",
        "Saves bandwidth and reduces infrastructure costs",
      ],
      cons: [
        "Introduces perceived latency—users wait for delay period before seeing results",
        "Can lose intermediate events (only final event's data is used)",
        "Adds complexity with timer management and cleanup requirements",
        "May feel sluggish if delay is too long; too short defeats the purpose",
        "Requires careful cleanup to prevent memory leaks from orphaned timers",
      ],
    },
    relatedPatterns: [
      "throttling",
      "rate-limiting",
      "caching",
      "lazy-loading",
      "request-coalescing",
      "batching",
    ],
  },

  structure: {
    participants: [
      {
        name: "Event Source",
        role: "Trigger Generator",
        responsibilities: [
          "Emit high-frequency events (keyboard input, mouse movement, scroll)",
          "Provide event data for eventual processing",
        ],
      },
      {
        name: "Debouncer",
        role: "Timer Controller",
        responsibilities: [
          "Maintain reference to pending timer",
          "Cancel existing timer when new event arrives",
          "Start new timer on each event",
          "Track delay duration",
        ],
      },
      {
        name: "Timer",
        role: "Delay Mechanism",
        responsibilities: [
          "Count down delay period",
          "Trigger callback execution when time expires",
          "Support cancellation before expiration",
        ],
      },
      {
        name: "Callback Queue",
        role: "Execution Holder",
        responsibilities: [
          "Store most recent callback with event data",
          "Replace queued callback when new event arrives",
          "Execute callback when timer expires",
        ],
      },
      {
        name: "Event Handler",
        role: "Action Executor",
        responsibilities: [
          "Execute expensive operation (API call, computation)",
          "Receive final event data from completed debounce period",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User
    participant EventSource as Event Source
    participant Debouncer
    participant Timer
    participant Handler as Event Handler

    User->>EventSource: Type 'h'
    EventSource->>Debouncer: event(data='h')
    Debouncer->>Timer: start(300ms)

    Note over Debouncer,Timer: Timer counting...

    User->>EventSource: Type 'e' (150ms later)
    EventSource->>Debouncer: event(data='he')
    Debouncer->>Timer: cancel()
    Debouncer->>Timer: start(300ms)

    Note over Debouncer,Timer: Timer restarted

    User->>EventSource: Type 'l' (100ms later)
    EventSource->>Debouncer: event(data='hel')
    Debouncer->>Timer: cancel()
    Debouncer->>Timer: start(300ms)

    Note over Timer,Handler: User stops typing...<br/>Timer counts to completion

    Timer->>Handler: execute(data='hel')
    Handler-->>User: Show search results`,
    flow: [
      {
        step: 1,
        actor: "Event Source",
        action: "Emit Event",
        description: "High-frequency event (keystroke, scroll, resize) fires",
      },
      {
        step: 2,
        actor: "Debouncer",
        action: "Check Pending Timer",
        description: "If timer exists from previous event, cancel it",
      },
      {
        step: 3,
        actor: "Debouncer",
        action: "Store Event Data",
        description: "Save current event data, overwriting any previous data",
      },
      {
        step: 4,
        actor: "Debouncer",
        action: "Start New Timer",
        description: "Create timer with configured delay (e.g., 300ms)",
      },
      {
        step: 5,
        actor: "Timer",
        action: "Count Down",
        description: "Delay period elapses without new events",
      },
      {
        step: 6,
        actor: "Timer",
        action: "Expire",
        description: "Timer completes, triggering callback execution",
      },
      {
        step: 7,
        actor: "Event Handler",
        action: "Execute Callback",
        description: "Run expensive operation with final event data",
      },
      {
        step: 8,
        actor: "Debouncer",
        action: "Clear Timer Reference",
        description: "Clean up timer reference, ready for next event",
      },
    ],
    invariants: [
      "Only one timer can be active at a time per debouncer instance",
      "Timer resets on every new event—delay always measures from last event",
      "Only the most recent event data is preserved; earlier data is discarded",
      "Callback executes exactly once per silence period, never during active events",
      "Minimum time from first event to execution equals delay period",
      "Memory must be cleaned up—timers cleared when component unmounts",
    ],
  },

  codeExamples: [
    {
      id: "debounce-typescript-basic",
      language: "typescript",
      title: "Basic Debounce Implementation",
      description:
        "Core debounce function with timer management and TypeScript generics for type safety",
      code: `/**
 * Creates a debounced function that delays invoking \`func\` until after
 * \`delay\` milliseconds have elapsed since the last time it was invoked.
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    // Cancel any existing timer
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Start new timer
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null; // Clean up reference
    }, delay);
  };
}

// Usage Example 1: Search Input
interface SearchResult {
  id: string;
  title: string;
}

async function searchAPI(query: string): Promise<SearchResult[]> {
  const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
  return response.json();
}

// Debounced search - only fires after user stops typing for 300ms
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query);
  displayResults(results);
}, 300);

// Event handler for input field
function handleSearchInput(event: Event) {
  const input = event.target as HTMLInputElement;
  debouncedSearch(input.value);
}

// Usage Example 2: Window Resize
function recalculateLayout() {
  console.log('Expensive layout recalculation');
  // ... complex DOM measurements and updates
}

const debouncedResize = debounce(recalculateLayout, 150);

window.addEventListener('resize', debouncedResize);

// Usage Example 3: Auto-save with Loading State
let saveStatus: 'idle' | 'saving' | 'saved' = 'idle';

async function saveDocument(content: string) {
  saveStatus = 'saving';
  await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  saveStatus = 'saved';
  setTimeout(() => { saveStatus = 'idle'; }, 2000);
}

const debouncedSave = debounce(saveDocument, 1000);

function handleDocumentChange(content: string) {
  saveStatus = 'idle'; // Show "unsaved changes"
  debouncedSave(content);
}

function displayResults(results: SearchResult[]) {
  console.log('Displaying results:', results);
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Reusable debounce utility with type-safe generics and practical examples",
        prerequisites: [
          "TypeScript generics",
          "setTimeout/clearTimeout",
          "Closures",
          "Higher-order functions",
        ],
        systemPosition:
          "Utility layer used across UI components for event handling optimization",
      },
      annotations: [
        {
          id: "debounce-generic-signature",
          lines: [1, 7],
          action:
            "Define generic debounce function that preserves function signature",
          reason:
            "TypeScript generics ensure type safety—debounced function has same parameter and return types as original",
          contextLevel: "module",
          relatedConcepts: [
            "generics",
            "type-safety",
            "higher-order-functions",
          ],
        },
        {
          id: "debounce-timeout-ref",
          lines: [8, 8],
          action: "Declare timeout reference outside returned function",
          reason:
            "Closure captures timeoutId across invocations, enabling cancellation of previous timer on each new call",
          contextLevel: "local",
          relatedConcepts: ["closures", "lexical-scope"],
        },
        {
          id: "debounce-clear-timeout",
          lines: [12, 14],
          action: "Cancel existing timer before starting new one",
          reason:
            "Each event resets the countdown—previous timer must be cleared to prevent multiple executions",
          contextLevel: "local",
          relatedConcepts: ["timer-management"],
        },
        {
          id: "debounce-set-timeout",
          lines: [16, 19],
          action: "Start new timer that executes function after delay",
          reason:
            "Timer starts countdown; if it completes without being cancelled, function executes with latest arguments",
          contextLevel: "local",
          relatedConcepts: ["async-timing"],
        },
        {
          id: "debounce-cleanup",
          lines: [18, 18],
          action: "Clear timeout reference after execution",
          reason:
            "Prevents memory leaks and allows garbage collection of timer object",
          contextLevel: "micro",
          relatedConcepts: ["memory-management"],
        },
        {
          id: "debounce-search-example",
          lines: [29, 40],
          action: "Apply debounce to search API calls",
          reason:
            "Without debouncing, typing 'hello' would trigger 5 API calls; with 300ms debounce, only 1 call after typing stops",
          contextLevel: "system",
          relatedConcepts: ["api-optimization", "user-experience"],
        },
        {
          id: "debounce-resize-example",
          lines: [46, 53],
          action: "Debounce expensive layout recalculations on window resize",
          reason:
            "Window resize fires 60+ events per second; debouncing ensures layout recalculates only once after resizing ends",
          contextLevel: "system",
          relatedConcepts: ["performance-optimization", "dom-manipulation"],
        },
      ],
      highlights: [
        {
          lines: [1, 20],
          label: "Core debounce implementation",
          sbvpDomain: "structure",
        },
        {
          lines: [12, 19],
          label: "Timer reset and execution logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [29, 40],
          label: "Real-world search usage",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "debounce-react-hook",
      language: "typescript",
      title: "React Debounce Hook with Cleanup",
      description:
        "Production-ready React hook for debouncing with proper cleanup and immediate execution option",
      code: `import { useEffect, useRef, useCallback } from 'react';

/**
 * React hook that debounces a callback function with automatic cleanup
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @param options - Configuration options
 */
interface DebounceOptions {
  leading?: boolean;  // Execute immediately on first call
  trailing?: boolean; // Execute after delay (default: true)
  maxWait?: number;   // Maximum time to wait before forcing execution
}

function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: DebounceOptions = {}
) {
  const { leading = false, trailing = true, maxWait } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);

  // Store latest callback in ref to avoid stale closures
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;
      lastCallTimeRef.current = now;

      // Helper to invoke the callback
      const invokeCallback = () => {
        lastInvokeTimeRef.current = now;
        callbackRef.current(...args);
      };

      // Leading edge execution
      if (leading && timeSinceLastCall >= delay) {
        invokeCallback();
      }

      // Clear existing timers
      cancel();

      // Trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(invokeCallback, delay);
      }

      // Max wait enforcement
      if (maxWait !== undefined) {
        const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
        const timeUntilMaxWait = maxWait - timeSinceLastInvoke;

        if (timeUntilMaxWait <= delay) {
          // Max wait will be exceeded, invoke immediately
          cancel();
          invokeCallback();
        } else {
          // Schedule invocation at max wait time
          maxWaitTimeoutRef.current = setTimeout(invokeCallback, timeUntilMaxWait);
        }
      }
    },
    [delay, leading, trailing, maxWait, cancel]
  );

  return { debouncedCallback, cancel };
}

// ============================================================================
// Example 1: Search Input Component
// ============================================================================

interface SearchBoxProps {
  onSearch: (query: string) => Promise<void>;
}

function SearchBox({ onSearch }: SearchBoxProps) {
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      await onSearch(searchQuery);
    } finally {
      setIsSearching(false);
    }
  };

  const { debouncedCallback } = useDebounce(handleSearch, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedCallback(newQuery);
  };

  return (
    <div className="search-box">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      {isSearching && <span className="spinner">Searching...</span>}
    </div>
  );
}

// ============================================================================
// Example 2: Auto-save Document Editor
// ============================================================================

interface Document {
  id: string;
  content: string;
}

function DocumentEditor({ documentId }: { documentId: string }) {
  const [content, setContent] = React.useState('');
  const [saveStatus, setSaveStatus] = React.useState<
    'saved' | 'saving' | 'unsaved'
  >('saved');

  const saveDocument = async (text: string) => {
    setSaveStatus('saving');
    try {
      await fetch(\`/api/documents/\${documentId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
    }
  };

  // Auto-save with max wait to ensure eventual save even during continuous typing
  const { debouncedCallback: debouncedSave } = useDebounce(
    saveDocument,
    1000,
    { maxWait: 5000 } // Force save after 5 seconds even if still typing
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus('unsaved');
    debouncedSave(newContent);
  };

  return (
    <div className="editor">
      <div className="status-bar">
        {saveStatus === 'saved' && '✓ Saved'}
        {saveStatus === 'saving' && '⟳ Saving...'}
        {saveStatus === 'unsaved' && '○ Unsaved changes'}
      </div>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing..."
        rows={20}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Window Resize Handler with Leading Edge
// ============================================================================

function useWindowSize() {
  const [size, setSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateSize = () => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  // Update immediately on first resize (leading: true) and after resize ends
  const { debouncedCallback } = useDebounce(updateSize, 150, { leading: true });

  useEffect(() => {
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
  }, [debouncedCallback]);

  return size;
}

function ResponsiveLayout() {
  const { width } = useWindowSize();

  return (
    <div>
      <h1>Current width: {width}px</h1>
      <p>Layout adapts when resize completes</p>
    </div>
  );
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production React hook with advanced features: cleanup, leading/trailing edge, max wait, stale closure prevention",
        prerequisites: [
          "React hooks",
          "useRef",
          "useCallback",
          "useEffect cleanup",
          "Closure patterns",
        ],
        systemPosition:
          "Shared hooks library for React applications, used across components for event handling and auto-save features",
      },
      annotations: [
        {
          id: "debounce-hook-options",
          lines: [10, 14],
          action: "Define options interface for leading/trailing execution",
          reason:
            "Leading edge executes immediately on first call; trailing executes after delay. MaxWait forces execution if delay keeps resetting.",
          contextLevel: "module",
          relatedConcepts: ["edge-triggering", "configuration-patterns"],
        },
        {
          id: "debounce-hook-refs",
          lines: [23, 26],
          action: "Track timing metadata in refs to detect edge cases",
          reason:
            "Refs preserve values across renders without triggering re-renders; essential for tracking last call/invoke times for maxWait logic",
          contextLevel: "local",
          relatedConcepts: ["react-refs", "timing-metadata"],
        },
        {
          id: "debounce-hook-callback-ref",
          lines: [29, 32],
          action: "Store callback in ref to prevent stale closures",
          reason:
            "Callback may capture stale state if not updated; storing in ref ensures latest version is always called",
          contextLevel: "module",
          relatedConcepts: ["stale-closures", "react-patterns"],
        },
        {
          id: "debounce-hook-cleanup",
          lines: [35, 44],
          action: "Implement cancel function to clear all timers",
          reason:
            "Memory leak prevention—timers must be cleared on unmount or when new events arrive",
          contextLevel: "local",
          relatedConcepts: ["cleanup-patterns", "memory-management"],
        },
        {
          id: "debounce-hook-unmount-cleanup",
          lines: [47, 49],
          action: "Clean up timers on component unmount",
          reason:
            "React useEffect cleanup runs on unmount; prevents timer callbacks executing after component destroyed",
          contextLevel: "system",
          relatedConcepts: ["react-lifecycle", "cleanup-patterns"],
        },
        {
          id: "debounce-hook-maxwait",
          lines: [77, 89],
          action: "Enforce maximum wait time for long-running event streams",
          reason:
            "Without maxWait, continuous events could delay execution indefinitely; maxWait guarantees eventual execution",
          contextLevel: "module",
          relatedConcepts: ["bounded-waiting", "liveness-guarantees"],
        },
        {
          id: "debounce-search-component",
          lines: [100, 135],
          action: "Implement search box with debounced API calls",
          reason:
            "Real-world pattern: debounce prevents API call on every keystroke, reducing load and improving UX",
          contextLevel: "system",
          relatedConcepts: ["search-optimization", "api-efficiency"],
        },
        {
          id: "debounce-autosave-component",
          lines: [141, 192],
          action: "Auto-save editor with maxWait guarantee",
          reason:
            "MaxWait ensures document saves even during continuous typing; balances responsiveness with data safety",
          contextLevel: "system",
          relatedConcepts: ["auto-save", "data-persistence"],
        },
        {
          id: "debounce-resize-leading",
          lines: [198, 226],
          action: "Window resize handler with leading edge execution",
          reason:
            "Leading edge provides immediate feedback on first resize; trailing edge ensures final state is captured",
          contextLevel: "system",
          relatedConcepts: ["responsive-design", "window-events"],
        },
      ],
      highlights: [
        {
          lines: [16, 93],
          label: "Production-ready hook with advanced features",
          sbvpDomain: "structure",
        },
        {
          lines: [35, 44],
          label: "Cleanup and memory management",
          sbvpDomain: "behavior",
        },
        {
          lines: [77, 89],
          label: "MaxWait enforcement logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [141, 192],
          label: "Auto-save with guaranteed eventual save",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "debounce-python-decorator",
      language: "python",
      title: "Python Debounce Decorator with Threading",
      description:
        "Thread-safe debounce implementation using decorators for clean API integration",
      code: `import time
import threading
from typing import Callable, TypeVar, ParamSpec, Any
from functools import wraps

P = ParamSpec('P')
R = TypeVar('R')

class Debouncer:
    """
    Thread-safe debouncer that delays function execution until
    calls have stopped for a specified duration.
    """

    def __init__(self, wait: float, leading: bool = False, trailing: bool = True):
        """
        Initialize debouncer.

        Args:
            wait: Delay in seconds to wait for silence
            leading: Execute on leading edge (first call)
            trailing: Execute on trailing edge (after silence)
        """
        self.wait = wait
        self.leading = leading
        self.trailing = trailing
        self.timer: threading.Timer | None = None
        self.lock = threading.Lock()
        self.last_call_time = 0.0
        self.last_invoke_time = 0.0

    def __call__(self, func: Callable[P, R]) -> Callable[P, None]:
        """Decorator to debounce a function."""

        @wraps(func)
        def debounced(*args: P.args, **kwargs: P.kwargs) -> None:
            now = time.time()

            with self.lock:
                time_since_last_call = now - self.last_call_time
                self.last_call_time = now

                def invoke():
                    with self.lock:
                        self.last_invoke_time = time.time()
                    func(*args, **kwargs)

                # Leading edge execution
                if self.leading and time_since_last_call >= self.wait:
                    invoke()

                # Cancel existing timer
                if self.timer is not None:
                    self.timer.cancel()

                # Trailing edge execution
                if self.trailing:
                    self.timer = threading.Timer(self.wait, invoke)
                    self.timer.start()

        return debounced

    def cancel(self):
        """Cancel any pending execution."""
        with self.lock:
            if self.timer is not None:
                self.timer.cancel()
                self.timer = None


# Convenience function for simple use cases
def debounce(wait: float, leading: bool = False, trailing: bool = True):
    """
    Decorator factory for debouncing functions.

    Usage:
        @debounce(0.5)
        def my_function(x):
            print(f"Called with {x}")
    """
    return Debouncer(wait, leading, trailing)


# =============================================================================
# Example 1: API Rate Limiting for Search
# =============================================================================

import requests
from typing import List, Dict

class SearchService:
    """Search service with debounced API calls."""

    def __init__(self):
        self.last_results: List[Dict] = []
        self.debouncer = Debouncer(wait=0.3)

    @property
    def search(self):
        """Debounced search method."""
        @self.debouncer
        def _search(query: str) -> None:
            if not query.strip():
                self.last_results = []
                return

            try:
                response = requests.get(
                    'https://api.example.com/search',
                    params={'q': query},
                    timeout=5
                )
                response.raise_for_status()
                self.last_results = response.json()['results']
                print(f"Search completed for: {query}")
                print(f"Found {len(self.last_results)} results")
            except requests.RequestException as e:
                print(f"Search failed: {e}")
                self.last_results = []

        return _search


# Usage example
search_service = SearchService()

# Simulating rapid typing: only last search executes
search_service.search("pyt")
time.sleep(0.1)  # 100ms later
search_service.search("pyth")
time.sleep(0.1)  # 100ms later
search_service.search("pytho")
time.sleep(0.1)  # 100ms later
search_service.search("python")  # This is the one that will execute (after 300ms)


# =============================================================================
# Example 2: File System Monitor with Debounced Processing
# =============================================================================

import os
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class DebouncedFileProcessor(FileSystemEventHandler):
    """
    File system event handler that debounces file change processing.
    Useful for build tools, auto-reload systems, etc.
    """

    def __init__(self, process_delay: float = 0.5):
        super().__init__()
        self.process_debouncer = Debouncer(wait=process_delay)
        self.changed_files: set[Path] = set()
        self.lock = threading.Lock()

    @property
    def process_changes(self):
        """Debounced file processing."""
        @self.process_debouncer
        def _process():
            with self.lock:
                files_to_process = self.changed_files.copy()
                self.changed_files.clear()

            if not files_to_process:
                return

            print(f"\\nProcessing {len(files_to_process)} changed files:")
            for filepath in sorted(files_to_process):
                print(f"  - {filepath}")

            # Simulate build/compile/test process
            self._run_build(files_to_process)

        return _process

    def on_modified(self, event):
        """Called when a file is modified."""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        # Ignore certain files
        if filepath.suffix in {'.pyc', '.log', '.tmp'}:
            return

        with self.lock:
            self.changed_files.add(filepath)

        # Trigger debounced processing
        self.process_changes()

    def _run_build(self, files: set[Path]):
        """Run build process for changed files."""
        print("Running build process...")
        time.sleep(0.1)  # Simulate build time
        print("Build complete!")


# Usage
def monitor_directory(path: str, delay: float = 0.5):
    """Monitor directory for changes with debounced processing."""
    event_handler = DebouncedFileProcessor(process_delay=delay)
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


# =============================================================================
# Example 3: Database Batch Updates
# =============================================================================

from dataclasses import dataclass
from typing import Set

@dataclass
class UserUpdate:
    """Represents a user profile update."""
    user_id: str
    field: str
    value: Any

class UserProfileService:
    """
    Service that batches user profile updates using debouncing.
    Instead of writing to DB on every field change, accumulates
    changes and writes once after user stops editing.
    """

    def __init__(self, db_connection):
        self.db = db_connection
        self.pending_updates: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()
        self.flush_debouncer = Debouncer(
            wait=2.0,  # Wait 2 seconds after last change
            trailing=True
        )

    def update_user_field(self, user_id: str, field: str, value: Any):
        """Queue a user field update (debounced)."""
        with self.lock:
            if user_id not in self.pending_updates:
                self.pending_updates[user_id] = {}
            self.pending_updates[user_id][field] = value

        # Trigger debounced flush
        self.flush_to_database()

    @property
    def flush_to_database(self):
        """Debounced database flush."""
        @self.flush_debouncer
        def _flush():
            with self.lock:
                updates = self.pending_updates.copy()
                self.pending_updates.clear()

            if not updates:
                return

            print(f"\\nFlushing {len(updates)} user updates to database...")
            for user_id, fields in updates.items():
                self._save_user_updates(user_id, fields)
            print("Database flush complete!")

        return _flush

    def _save_user_updates(self, user_id: str, fields: Dict[str, Any]):
        """Write updates to database."""
        # Simulate database write
        print(f"  Saving user {user_id}: {fields}")
        # self.db.users.update_one({'id': user_id}, {'$set': fields})


# Usage example
class MockDB:
    pass

service = UserProfileService(MockDB())

# Simulating rapid form field changes
print("User editing profile rapidly...")
service.update_user_field("user123", "name", "John")
time.sleep(0.1)
service.update_user_field("user123", "email", "john@example.com")
time.sleep(0.1)
service.update_user_field("user123", "phone", "555-1234")
time.sleep(0.1)
service.update_user_field("user456", "name", "Jane")
print("Waiting for debounce period...")
time.sleep(2.5)  # After 2 seconds of silence, batch update fires
print("All updates flushed!")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Thread-safe debouncer class with decorator pattern, supporting leading/trailing edges and multiple real-world scenarios",
        prerequisites: [
          "Python decorators",
          "Threading",
          "Type hints",
          "Context managers",
        ],
        systemPosition:
          "Shared utilities module for API clients, file watchers, and batch processing systems",
      },
      annotations: [
        {
          id: "debounce-py-class",
          lines: [9, 30],
          action: "Define thread-safe Debouncer class with locking",
          reason:
            "Threading.Lock ensures timer cancellation and creation are atomic, preventing race conditions in concurrent environments",
          contextLevel: "module",
          relatedConcepts: ["thread-safety", "synchronization", "decorators"],
        },
        {
          id: "debounce-py-decorator",
          lines: [32, 60],
          action: "Implement __call__ to make class instance a decorator",
          reason:
            "Python decorators are functions/classes that wrap other functions; __call__ makes instances callable for clean @debounce syntax",
          contextLevel: "module",
          relatedConcepts: ["decorator-pattern", "callable-objects"],
        },
        {
          id: "debounce-py-lock",
          lines: [38, 41],
          action: "Use context manager lock for thread-safe state updates",
          reason:
            "Multiple threads may call debounced function simultaneously; lock prevents race conditions when reading/writing shared state",
          contextLevel: "local",
          relatedConcepts: ["thread-safety", "context-managers"],
        },
        {
          id: "debounce-py-timer",
          lines: [56, 59],
          action: "Create threading.Timer for delayed execution",
          reason:
            "threading.Timer runs callback in separate thread after delay; enables async execution without blocking caller",
          contextLevel: "local",
          relatedConcepts: ["async-execution", "threading"],
        },
        {
          id: "debounce-py-search",
          lines: [87, 123],
          action: "Implement search service with debounced API calls",
          reason:
            "Real-world pattern: prevents hammering search API on every keystroke, reducing costs and improving performance",
          contextLevel: "system",
          relatedConcepts: ["api-optimization", "rate-limiting"],
        },
        {
          id: "debounce-py-filesystem",
          lines: [144, 202],
          action: "File system monitor with debounced build process",
          reason:
            "File watchers emit events rapidly during saves; debouncing accumulates changes and rebuilds once, avoiding redundant builds",
          contextLevel: "system",
          relatedConcepts: ["file-watching", "build-systems", "event-batching"],
        },
        {
          id: "debounce-py-batch",
          lines: [214, 273],
          action: "Batch database updates with debounced flush",
          reason:
            "Form fields emit rapid changes; debouncing batches updates into single DB transaction, reducing writes and improving performance",
          contextLevel: "system",
          relatedConcepts: ["batch-processing", "database-optimization"],
        },
      ],
      highlights: [
        {
          lines: [9, 67],
          label: "Thread-safe debouncer class",
          sbvpDomain: "structure",
        },
        {
          lines: [38, 59],
          label: "Core debounce logic with locking",
          sbvpDomain: "behavior",
        },
        {
          lines: [144, 202],
          label: "File system monitoring with debouncing",
          sbvpDomain: "behavior",
        },
        {
          lines: [214, 273],
          label: "Database batch optimization pattern",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "UI Event Handlers (search inputs, resize listeners, scroll handlers)",
      "API Client Layer (search-as-you-type, autocomplete requests)",
      "Auto-save Systems (document editors, form persistence)",
      "File Watchers (build tools, hot reload systems)",
      "Form Validation (real-time validation without excessive checks)",
      "Analytics Events (tracking user activity without flooding servers)",
    ],
    interactsWith: [
      "throttling",
      "caching",
      "request-coalescing",
      "batching",
      "rate-limiting",
    ],
    architecturalBoundaries: [
      "Frontend-Backend: Debounce API calls in client before sending to server",
      "User-System: Debounce user input events before triggering expensive UI updates",
      "Application-Database: Batch rapid updates into single debounced transaction",
      "File System-Build System: Accumulate file changes before triggering rebuild",
    ],
  },

  philosophy: {
    coreProblem:
      "High-frequency events trigger expensive operations wastefully, degrading performance and overwhelming downstream systems",
    designPrinciple:
      "Wait for a pause in activity before executing—optimize for the common case where rapid events settle to a final state",
    historicalContext:
      "Debouncing originated in electrical engineering for switch contact bounce elimination. Mechanical switches generate multiple signals when pressed due to contact bounce; debouncing circuits ignore rapid state changes and wait for stable state. The software pattern directly mirrors this: ignore rapid event stream, wait for stability.",
    alternativesRejected: [
      "Execute every event - wasteful, causes performance degradation and unnecessary load",
      "Throttling (execute at fixed intervals) - doesn't wait for pause, may execute during activity when not needed",
      "Sampling (execute every Nth event) - arbitrary, may miss important final state",
      "Immediate execution with cancellation - complex cancellation logic, potential race conditions with in-flight requests",
    ],
    mentalModel:
      "Like waiting for an elevator: when you press the button repeatedly, the elevator doesn't stop at every floor multiple times—it waits until all button presses stop, then goes to the final requested floor. Debouncing is the 'wait for the person to finish pressing buttons' strategy.",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant User
    participant Event
    participant Debouncer
    participant Handler

    User->>Event: Action 1
    Event->>Debouncer: event()
    Debouncer->>Debouncer: start timer (300ms)

    Note over Debouncer: Timer counting...

    User->>Event: Action 2 (100ms later)
    Event->>Debouncer: event()
    Debouncer->>Debouncer: cancel timer
    Debouncer->>Debouncer: start timer (300ms)

    Note over Debouncer: Timer reset & counting...

    User->>Event: Action 3 (150ms later)
    Event->>Debouncer: event()
    Debouncer->>Debouncer: cancel timer
    Debouncer->>Debouncer: start timer (300ms)

    Note over Debouncer,Handler: Silence... timer completes

    Debouncer->>Handler: execute()
    Handler-->>User: Result`,
    realWorldAnalogy:
      "Debouncing is like a patient assistant taking dictation: when you're speaking rapidly, they wait until you finish your sentence before writing it down. If they wrote every word as you said it, they'd waste effort on corrections when you change your mind mid-sentence. By waiting for a pause, they capture your final, complete thought in one efficient action.",
    useCases: [
      {
        domain: "E-commerce Search",
        scenario:
          "User types 'wireless keyboard' in search box. Without debouncing: 17 API calls ('w', 'wi', 'wir', ...). With 300ms debouncing: 1 API call after typing stops. Reduces server load by 94%, improves response time, prevents race conditions from out-of-order responses.",
        patternRole:
          "Eliminates wasteful API calls, prevents UI flicker from rapid updates, reduces infrastructure costs",
        companies: ["Amazon", "eBay", "Shopify"],
      },
      {
        domain: "Document Editing",
        scenario:
          "Google Docs auto-save: user types continuously. Without debouncing: hundreds of save requests per minute, overwhelming servers. With 1-second debouncing + 5-second maxWait: saves accumulate during typing, flush after pause or max 5 seconds, ensuring data safety without excessive writes.",
        patternRole:
          "Balances data persistence with server efficiency, prevents lost work while minimizing network traffic",
        companies: ["Google Docs", "Notion", "Figma"],
      },
      {
        domain: "Responsive Design",
        scenario:
          "Window resize events fire 60+ times per second during drag. Without debouncing: layout recalculates 60 times/second, causing jank and poor performance. With 150ms debouncing: recalculates once after resize completes, maintaining smooth UI.",
        patternRole:
          "Prevents UI jank, reduces CPU usage, improves perceived performance",
        companies: ["All responsive web applications"],
      },
      {
        domain: "Analytics",
        scenario:
          "User scrolls through long page with scroll-depth tracking. Without debouncing: hundreds of analytics events per scroll session. With 500ms debouncing: tracks meaningful scroll positions after user pauses, reducing analytics load by 90%.",
        patternRole:
          "Reduces analytics costs, prevents event flooding, captures meaningful user behavior",
        companies: ["Google Analytics", "Mixpanel", "Amplitude"],
      },
    ],
  },

  tags: [
    "performance",
    "optimization",
    "event-handling",
    "timing",
    "ui-patterns",
    "rate-limiting",
  ],
  difficulty: "beginner",
};
