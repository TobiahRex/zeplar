import type { Pattern } from "../schema";

export const memoization: Pattern = {
  id: "memoization",
  slug: "memoization",
  corpusPath: "⚡ PERFORMANCE → 🧠 Caching → 📝 Function-Level Cache",

  hierarchy: {
    quality: "performance",
    strategy: "Caching",
    family: "Function-Level Cache",
    level: 4,
  },

  concept: {
    name: "Memoization",
    emoji: "📝",
    tagline: "Cache function results to avoid redundant computation",
    definition:
      "Memoization is an optimization technique that caches the return values of expensive function calls, returning the cached result when the same inputs occur again. Like a student writing down math problem answers in a notebook to avoid recalculating them during an exam, memoization stores computed results in a lookup table keyed by function arguments. When a memoized function is called, it first checks if the result for those specific arguments already exists in the cache—if found, it returns the cached value instantly; if not, it executes the function, stores the result in the cache, and returns it. This pattern is most effective for pure functions (same inputs always produce same outputs) with expensive computational costs and frequent repeated calls. The cache key generation must uniquely identify argument combinations, typically using argument serialization or hashing. Memoization transparently trades memory for speed: by storing previously computed results, it eliminates redundant calculations at the cost of additional memory overhead. The technique is particularly powerful for recursive algorithms (Fibonacci, dynamic programming), expensive API transformations, React component rendering, and complex data processing pipelines where the same computations occur repeatedly.",
    problemSolved:
      "Applications often waste CPU cycles recalculating the same results repeatedly, especially in scenarios like recursive algorithms, data transformations, and component rendering. Consider a Fibonacci function called hundreds of times with the same inputs—without memoization, it recalculates the entire sequence from scratch each time, resulting in exponential time complexity. React components may re-render unnecessarily when receiving identical props, causing expensive reconciliation and DOM updates. Data processing pipelines frequently transform the same input data multiple times across different parts of the application. Memoization solves these problems by maintaining a cache of input-output mappings, converting expensive recalculations into fast cache lookups. For recursive algorithms, it transforms exponential complexity into linear complexity by eliminating overlapping subproblems. For UI frameworks, it prevents wasteful re-renders when data hasn't changed. For data transformations, it ensures each unique input is processed only once, regardless of how many times it's requested. The pattern automatically manages cache population and retrieval, making optimization transparent to calling code.",
    tradeoffs: {
      pros: [
        "Dramatic performance improvements for expensive, repeated computations",
        "Reduces CPU usage and improves response times",
        "Transparent optimization—callers don't need to know about caching",
        "Transforms exponential recursive algorithms into linear complexity",
        "Prevents wasteful re-renders in UI frameworks like React",
      ],
      cons: [
        "Memory overhead from storing cached results",
        "Cache invalidation complexity for non-pure functions",
        "Risk of serving stale data if inputs change meaning over time",
        "Key generation overhead for complex argument types",
        "Unbounded cache growth can cause memory exhaustion",
      ],
    },
    relatedPatterns: [
      "cache-aside",
      "lazy-loading",
      "dynamic-programming",
      "flyweight",
      "object-pooling",
      "lazy-initialization",
      "read-through",
    ],
  },

  structure: {
    participants: [
      {
        name: "Memoizer",
        role: "Cache Manager",
        responsibilities: [
          "Intercept function calls and check cache before execution",
          "Generate unique cache keys from function arguments",
          "Store computed results in cache for future lookups",
          "Manage cache size and eviction policies",
        ],
      },
      {
        name: "Cache Store",
        role: "Result Repository",
        responsibilities: [
          "Store key-value mappings of arguments to results",
          "Provide fast O(1) lookup for cached results",
          "Support cache operations (get, set, has, delete)",
        ],
      },
      {
        name: "Original Function",
        role: "Computation Source",
        responsibilities: [
          "Perform the actual expensive computation",
          "Produce deterministic results for given inputs (pure function)",
        ],
      },
      {
        name: "Key Generator",
        role: "Argument Serializer",
        responsibilities: [
          "Convert function arguments into unique cache keys",
          "Handle complex argument types (objects, arrays, functions)",
          "Ensure same arguments produce same keys",
        ],
      },
      {
        name: "Cache Entry",
        role: "Stored Result",
        responsibilities: [
          "Hold computed result value",
          "Optionally track metadata (timestamp, access count)",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Caller
    participant Memoizer
    participant Cache
    participant Function

    Caller->>Memoizer: call(arg1, arg2)
    Memoizer->>Memoizer: generateKey(arg1, arg2)
    Memoizer->>Cache: has(key)?

    alt Cache Hit
        Cache-->>Memoizer: true
        Memoizer->>Cache: get(key)
        Cache-->>Memoizer: cachedResult
        Memoizer-->>Caller: cachedResult
    else Cache Miss
        Cache-->>Memoizer: false
        Memoizer->>Function: execute(arg1, arg2)
        Function-->>Memoizer: result
        Memoizer->>Cache: set(key, result)
        Memoizer-->>Caller: result
    end`,
    flow: [
      {
        step: 1,
        actor: "Caller",
        action: "Invoke Function",
        description: "Caller invokes the memoized function with arguments",
      },
      {
        step: 2,
        actor: "Memoizer",
        action: "Generate Cache Key",
        description:
          "Convert function arguments into a unique cache key (serialization, hashing)",
      },
      {
        step: 3,
        actor: "Memoizer",
        action: "Check Cache",
        description:
          "Query cache store to see if result already exists for this key",
      },
      {
        step: 4,
        actor: "Cache Store",
        action: "Cache Hit/Miss",
        description: "Return whether cached result exists for the given key",
      },
      {
        step: 5,
        actor: "Memoizer",
        action: "Return Cached or Compute",
        description:
          "If cache hit, return cached result immediately. If miss, proceed to computation.",
      },
      {
        step: 6,
        actor: "Original Function",
        action: "Execute Computation",
        description:
          "Perform the expensive computation with the provided arguments (only on cache miss)",
      },
      {
        step: 7,
        actor: "Memoizer",
        action: "Store Result",
        description: "Save computed result in cache for future lookups",
      },
      {
        step: 8,
        actor: "Memoizer",
        action: "Return Result",
        description:
          "Return result to caller (either from cache or fresh computation)",
      },
    ],
    invariants: [
      "Same inputs must always produce same cache key",
      "Memoized function must be pure (no side effects, deterministic output)",
      "Cache key generation must be consistent across invocations",
      "Cached results must be immutable or deeply cloned to prevent mutation",
      "Cache size must be bounded to prevent memory exhaustion (with LRU or size limits)",
      "Cache invalidation strategy must be defined for non-pure or time-sensitive functions",
    ],
  },

  codeExamples: [
    {
      id: "memo-typescript-fibonacci",
      language: "typescript",
      title: "Memoized Fibonacci with Performance Comparison",
      description:
        "Classic Fibonacci implementation demonstrating memoization's dramatic impact on recursive algorithm performance",
      code: `// ============================================================================
// WITHOUT MEMOIZATION: Exponential time complexity O(2^n)
// ============================================================================

function fibonacciSlow(n: number): number {
  if (n <= 1) return n;
  return fibonacciSlow(n - 1) + fibonacciSlow(n - 2);
}

// ============================================================================
// WITH MEMOIZATION: Linear time complexity O(n)
// ============================================================================

type MemoCache<T> = Map<string, T>;

function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result
): (...args: Args) => Result {
  const cache: MemoCache<Result> = new Map();

  return (...args: Args): Result => {
    // Generate cache key by serializing arguments
    const key = JSON.stringify(args);

    // Cache hit: return cached result immediately
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // Cache miss: compute result, store in cache, and return
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Create memoized version of Fibonacci
const fibonacciFast = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacciFast(n - 1) + fibonacciFast(n - 2);
});

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

function benchmark(name: string, fn: () => unknown): void {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  console.log(\`\${name}: \${result} (took \${duration.toFixed(2)}ms)\`);
}

// Unmemoized: ~1000ms for n=40 (exponential growth)
benchmark("Fibonacci (slow, n=40)", () => fibonacciSlow(40));

// Memoized: ~0.1ms for n=40 (linear growth)
benchmark("Fibonacci (fast, n=40)", () => fibonacciFast(40));

// Memoized can handle much larger inputs
benchmark("Fibonacci (fast, n=100)", () => fibonacciFast(100));

// ============================================================================
// ADVANCED: Memoization with LRU cache for bounded memory
// ============================================================================

class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (will re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

function memoizeWithLRU<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  maxCacheSize: number = 100
): (...args: Args) => Result {
  const cache = new LRUCache<string, Result>(maxCacheSize);

  return (...args: Args): Result => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Expensive data transformation with bounded cache
const transformData = memoizeWithLRU(
  (data: { id: number; value: string }[]): string[] => {
    console.log("Computing transformation...");
    return data.map((item) => \`\${item.id}: \${item.value.toUpperCase()}\`);
  },
  50 // Only cache 50 most recent transformations
);

// First call: computes and caches
transformData([{ id: 1, value: "test" }]);

// Second call with same input: cache hit
transformData([{ id: 1, value: "test" }]);`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete memoization implementation with performance comparison and LRU cache strategy",
        prerequisites: [
          "TypeScript generics",
          "Higher-order functions",
          "Map data structure",
          "Performance API",
        ],
        systemPosition:
          "Can be used in any layer: recursive algorithms, data transformations, expensive utility functions",
      },
      annotations: [
        {
          id: "memo-fib-slow",
          lines: [1, 8],
          action: "Naive recursive Fibonacci without memoization",
          reason:
            "Each call spawns two recursive calls, resulting in exponential O(2^n) time complexity with massive redundant calculations",
          contextLevel: "local",
          relatedConcepts: ["recursion", "exponential-complexity"],
        },
        {
          id: "memo-generic-memoizer",
          lines: [14, 21],
          action: "Generic memoization wrapper using TypeScript generics",
          reason:
            "Generics allow type-safe memoization for any function signature, preserving argument and return types",
          contextLevel: "module",
          relatedConcepts: ["higher-order-functions", "generics"],
        },
        {
          id: "memo-key-generation",
          lines: [24, 25],
          action:
            "Generate cache key by serializing arguments with JSON.stringify",
          reason:
            "Must convert function arguments into a unique string key for cache lookup; JSON.stringify handles primitives, arrays, and objects consistently",
          contextLevel: "local",
          relatedConcepts: ["serialization", "hashing"],
        },
        {
          id: "memo-cache-hit",
          lines: [27, 30],
          action: "Check cache and return immediately on hit",
          reason:
            "Cache hits avoid expensive recomputation, providing O(1) lookup time instead of O(2^n) recursive calculation",
          contextLevel: "local",
          relatedConcepts: ["cache-hit", "early-return"],
        },
        {
          id: "memo-cache-miss",
          lines: [32, 35],
          action: "On cache miss, compute result, store in cache, and return",
          reason:
            "First call for any input must compute the result; storing it ensures subsequent calls with same input are instant",
          contextLevel: "local",
          relatedConcepts: ["cache-miss", "lazy-population"],
        },
        {
          id: "memo-lru-implementation",
          lines: [61, 106],
          action: "Implement LRU (Least Recently Used) cache with bounded size",
          reason:
            "Unbounded caches cause memory exhaustion; LRU evicts oldest entries when capacity reached, balancing performance and memory usage",
          contextLevel: "module",
          relatedConcepts: ["lru-cache", "cache-eviction", "bounded-memory"],
        },
        {
          id: "memo-lru-get",
          lines: [70, 78],
          action: "Move accessed entries to end of Map (most recently used)",
          reason:
            "JavaScript Map maintains insertion order; deleting and re-adding moves entry to end, implementing LRU semantics",
          contextLevel: "local",
          relatedConcepts: ["lru-policy", "recency-tracking"],
        },
        {
          id: "memo-lru-eviction",
          lines: [85, 89],
          action: "Evict oldest entry when cache reaches max capacity",
          reason:
            "Prevents unbounded memory growth; oldest entry (first in Map) is least likely to be needed again",
          contextLevel: "local",
          relatedConcepts: ["cache-eviction", "memory-management"],
        },
      ],
      highlights: [
        {
          lines: [14, 36],
          label: "Generic memoization wrapper",
          sbvpDomain: "structure",
        },
        {
          lines: [24, 35],
          label: "Cache key generation and lookup flow",
          sbvpDomain: "behavior",
        },
        {
          lines: [61, 106],
          label: "LRU cache implementation for bounded memory",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "memo-react-component",
      language: "typescript",
      title: "React Component Memoization with React.memo and useMemo",
      description:
        "Using React's built-in memoization to prevent expensive re-renders and computations",
      code: `import React, { useMemo, useCallback, useState } from 'react';

// ============================================================================
// PROBLEM: Expensive component re-renders on every parent update
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserListProps {
  users: User[];
  searchTerm: string;
  sortBy: 'name' | 'email' | 'role';
}

// WITHOUT MEMOIZATION: Re-renders and recalculates on every parent update
function UserListSlow({ users, searchTerm, sortBy }: UserListProps) {
  console.log('UserListSlow: Rendering...');

  // This expensive calculation runs on EVERY render, even if inputs unchanged
  const filteredAndSortedUsers = users
    .filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

  return (
    <div>
      <h2>Users ({filteredAndSortedUsers.length})</h2>
      {filteredAndSortedUsers.map((user) => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SOLUTION 1: React.memo - Memoize entire component
// ============================================================================

// React.memo prevents re-render if props haven't changed (shallow comparison)
const UserListFast = React.memo(({ users, searchTerm, sortBy }: UserListProps) => {
  console.log('UserListFast: Rendering (memoized)...');

  // useMemo memoizes expensive calculation within the component
  const filteredAndSortedUsers = useMemo(() => {
    console.log('UserListFast: Recalculating filtered/sorted users...');
    return users
      .filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }, [users, searchTerm, sortBy]); // Only recalculate if these dependencies change

  return (
    <div>
      <h2>Users ({filteredAndSortedUsers.length})</h2>
      {filteredAndSortedUsers.map((user) => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// SOLUTION 2: useMemo for expensive calculations
// ============================================================================

interface DataVisualizationProps {
  dataPoints: number[];
  threshold: number;
}

function DataVisualization({ dataPoints, threshold }: DataVisualizationProps) {
  // useMemo prevents recalculating statistics on every render
  const statistics = useMemo(() => {
    console.log('Calculating statistics...');
    const sum = dataPoints.reduce((acc, val) => acc + val, 0);
    const average = sum / dataPoints.length;
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const aboveThreshold = dataPoints.filter((val) => val > threshold).length;

    return { sum, average, max, min, aboveThreshold };
  }, [dataPoints, threshold]); // Only recalculate if dataPoints or threshold changes

  return (
    <div>
      <h3>Statistics</h3>
      <p>Average: {statistics.average.toFixed(2)}</p>
      <p>Max: {statistics.max}</p>
      <p>Min: {statistics.min}</p>
      <p>Above Threshold: {statistics.aboveThreshold}</p>
    </div>
  );
}

// ============================================================================
// SOLUTION 3: useCallback for memoizing event handlers
// ============================================================================

interface TodoListProps {
  todos: Array<{ id: number; text: string; completed: boolean }>;
}

function TodoList({ todos }: TodoListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // useCallback prevents creating new function instance on every render
  // Child components receiving this as a prop won't re-render unnecessarily
  const handleFilterChange = useCallback((newFilter: 'all' | 'active' | 'completed') => {
    console.log('Filter changed to:', newFilter);
    setFilter(newFilter);
  }, []); // Empty deps: function never changes

  // Memoize filtered todos to avoid recalculation
  const filteredTodos = useMemo(() => {
    console.log('Filtering todos...');
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  return (
    <div>
      <FilterButtons onFilterChange={handleFilterChange} activeFilter={filter} />
      <ul>
        {filteredTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// ADVANCED: Custom memo with deep comparison
// ============================================================================

function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Custom comparison function for React.memo
const UserListDeepMemo = React.memo(
  UserListFast,
  (prevProps, nextProps) => {
    // Return true if props are equal (component should NOT re-render)
    return (
      deepEqual(prevProps.users, nextProps.users) &&
      prevProps.searchTerm === nextProps.searchTerm &&
      prevProps.sortBy === nextProps.sortBy
    );
  }
);

// ============================================================================
// PARENT COMPONENT DEMONSTRATING MEMOIZATION BENEFITS
// ============================================================================

function Dashboard() {
  const [users] = useState<User[]>([
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'moderator' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role'>('name');
  const [unrelatedState, setUnrelatedState] = useState(0);

  return (
    <div>
      <input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="name">Name</option>
        <option value="email">Email</option>
        <option value="role">Role</option>
      </select>

      {/* Clicking this button updates unrelated state */}
      <button onClick={() => setUnrelatedState((prev) => prev + 1)}>
        Update Unrelated State ({unrelatedState})
      </button>

      {/* WITHOUT memo: Re-renders on every Dashboard update */}
      <UserListSlow users={users} searchTerm={searchTerm} sortBy={sortBy} />

      {/* WITH memo: Only re-renders when users/searchTerm/sortBy change */}
      <UserListFast users={users} searchTerm={searchTerm} sortBy={sortBy} />
    </div>
  );
}

// Stub components for completeness
const FilterButtons = ({ onFilterChange, activeFilter }: any) => null;
const TodoItem = ({ todo }: any) => null;

export default Dashboard;`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "React component memoization using React.memo, useMemo, and useCallback to prevent wasteful re-renders",
        prerequisites: [
          "React hooks",
          "Component lifecycle",
          "Props comparison",
          "Dependency arrays",
        ],
        systemPosition:
          "UI layer optimization for React applications with expensive components or calculations",
      },
      annotations: [
        {
          id: "memo-react-slow",
          lines: [20, 40],
          action:
            "Component without memoization re-renders on every parent update",
          reason:
            "React re-renders all children when parent state changes; expensive filter/sort runs every render even if users/searchTerm/sortBy unchanged",
          contextLevel: "local",
          relatedConcepts: ["react-rendering", "unnecessary-rerenders"],
        },
        {
          id: "memo-react-memo",
          lines: [46, 47],
          action: "Wrap component with React.memo for shallow prop comparison",
          reason:
            "React.memo prevents re-render if props haven't changed (using shallow equality); component only updates when users, searchTerm, or sortBy actually change",
          contextLevel: "module",
          relatedConcepts: ["react-memo", "shallow-comparison"],
        },
        {
          id: "memo-usememo-calculation",
          lines: [51, 59],
          action: "Wrap expensive calculation in useMemo with dependency array",
          reason:
            "useMemo caches calculation result and only recomputes when dependencies change; prevents filter/sort on every render within the component",
          contextLevel: "local",
          relatedConcepts: ["usememo", "dependency-tracking"],
        },
        {
          id: "memo-usememo-deps",
          lines: [59, 59],
          action: "Specify dependency array for useMemo",
          reason:
            "React tracks these dependencies and only recalculates when they change; missing dependencies cause stale data, unnecessary dependencies cause over-computation",
          contextLevel: "micro",
          relatedConcepts: ["dependency-array", "react-hooks"],
        },
        {
          id: "memo-usememo-stats",
          lines: [82, 92],
          action: "Memoize complex statistical calculations",
          reason:
            "Calculating sum, average, max, min, and filtering is expensive for large datasets; useMemo ensures it only runs when data or threshold changes",
          contextLevel: "local",
          relatedConcepts: ["expensive-computation", "usememo"],
        },
        {
          id: "memo-usecallback",
          lines: [119, 123],
          action: "Memoize event handler function with useCallback",
          reason:
            "Without useCallback, new function instance created every render; child components receiving it as prop would re-render unnecessarily even if wrapped in React.memo",
          contextLevel: "local",
          relatedConcepts: ["usecallback", "referential-equality"],
        },
        {
          id: "memo-usecallback-deps",
          lines: [123, 123],
          action: "Empty dependency array means function never changes",
          reason:
            "Function has no dependencies on component state/props; can safely be memoized once and reused across all renders",
          contextLevel: "micro",
          relatedConcepts: ["dependency-array", "stable-references"],
        },
        {
          id: "memo-filtered-todos",
          lines: [126, 137],
          action: "Memoize filtered todo list based on filter state",
          reason:
            "Filtering todos is unnecessary when only unrelated state changes; useMemo ensures filtering only happens when todos or filter changes",
          contextLevel: "local",
          relatedConcepts: ["usememo", "derived-state"],
        },
        {
          id: "memo-custom-comparison",
          lines: [161, 171],
          action:
            "Custom comparison function for React.memo with deep equality",
          reason:
            "Default shallow comparison fails for objects/arrays; custom function performs deep equality check to prevent re-renders when nested data unchanged",
          contextLevel: "module",
          relatedConcepts: ["deep-comparison", "custom-memo"],
        },
      ],
      highlights: [
        {
          lines: [46, 68],
          label: "React.memo with useMemo for component optimization",
          sbvpDomain: "structure",
        },
        {
          lines: [82, 101],
          label: "useMemo for expensive calculations",
          sbvpDomain: "behavior",
        },
        {
          lines: [119, 123],
          label: "useCallback for stable function references",
          sbvpDomain: "behavior",
        },
        {
          lines: [161, 171],
          label: "Custom deep comparison for React.memo",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "memo-python-decorator",
      language: "python",
      title: "Python Memoization with Decorators and LRU Cache",
      description:
        "Leveraging Python's functools.lru_cache and custom decorators for transparent memoization",
      code: `from functools import lru_cache, wraps
from typing import Callable, Any, TypeVar, Dict, Tuple
import time
import json

# ============================================================================
# SOLUTION 1: Built-in lru_cache decorator
# ============================================================================

# Simple memoization with unlimited cache size
@lru_cache(maxsize=None)
def fibonacci(n: int) -> int:
    """Fibonacci with unlimited cache - handles any input size."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Bounded LRU cache with max 128 entries
@lru_cache(maxsize=128)
def expensive_api_call(endpoint: str, user_id: int) -> dict:
    """Simulated API call with bounded LRU cache."""
    print(f"Making API call to {endpoint} for user {user_id}")
    time.sleep(0.1)  # Simulate network delay
    return {"endpoint": endpoint, "user_id": user_id, "data": "..."}

# ============================================================================
# SOLUTION 2: Custom memoization decorator with TTL (Time To Live)
# ============================================================================

def memoize_with_ttl(ttl_seconds: int = 60):
    """Decorator that caches results with expiration time."""
    def decorator(func: Callable) -> Callable:
        cache: Dict[str, Tuple[Any, float]] = {}

        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from arguments
            key = _make_key(args, kwargs)
            current_time = time.time()

            # Check if cached result exists and is still valid
            if key in cache:
                result, timestamp = cache[key]
                if current_time - timestamp < ttl_seconds:
                    print(f"Cache hit for {func.__name__}({args})")
                    return result
                else:
                    print(f"Cache expired for {func.__name__}({args})")
                    del cache[key]

            # Cache miss or expired: compute and cache result
            print(f"Cache miss for {func.__name__}({args})")
            result = func(*args, **kwargs)
            cache[key] = (result, current_time)
            return result

        # Add cache inspection methods
        wrapper.cache_info = lambda: {
            "size": len(cache),
            "entries": list(cache.keys())
        }
        wrapper.cache_clear = lambda: cache.clear()

        return wrapper
    return decorator

def _make_key(args: tuple, kwargs: dict) -> str:
    """Generate unique cache key from function arguments."""
    try:
        # Use JSON serialization for consistent key generation
        return json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
    except (TypeError, ValueError):
        # Fallback to string representation for non-serializable types
        return str((args, tuple(sorted(kwargs.items()))))

# ============================================================================
# SOLUTION 3: Custom memoization with custom key function
# ============================================================================

def memoize(key_func: Callable[..., str] | None = None):
    """
    Decorator with custom key generation function.

    Args:
        key_func: Optional function to generate cache key from arguments.
                  If None, uses default serialization.
    """
    def decorator(func: Callable) -> Callable:
        cache: Dict[str, Any] = {}

        @wraps(func)
        def wrapper(*args, **kwargs):
            # Use custom key function or default
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                key = _make_key(args, kwargs)

            if key not in cache:
                cache[key] = func(*args, **kwargs)

            return cache[key]

        wrapper.cache = cache
        wrapper.cache_clear = lambda: cache.clear()

        return wrapper
    return decorator

# ============================================================================
# USAGE EXAMPLES
# ============================================================================

# Example 1: Fibonacci with unlimited cache
print("\\n=== Fibonacci Example ===")
print(f"fib(30) = {fibonacci(30)}")  # First call: computes
print(f"fib(30) = {fibonacci(30)}")  # Second call: cache hit
print(f"Cache info: {fibonacci.cache_info()}")

# Example 2: API calls with bounded LRU cache
print("\\n=== API Call Example ===")
expensive_api_call("/users", 123)  # First call: makes request
expensive_api_call("/users", 123)  # Second call: cache hit
expensive_api_call("/users", 456)  # Different args: makes request

# Example 3: Data processing with TTL expiration
@memoize_with_ttl(ttl_seconds=5)
def process_data(data_id: int) -> str:
    """Process data with 5-second cache."""
    print(f"Processing data {data_id}...")
    time.sleep(0.2)
    return f"Processed data {data_id}"

print("\\n=== TTL Example ===")
print(process_data(1))  # First call: processes
print(process_data(1))  # Within 5s: cache hit
time.sleep(6)
print(process_data(1))  # After 5s: cache expired, reprocesses

# Example 4: Custom key function for complex objects
@memoize(key_func=lambda user: user['id'])
def get_user_profile(user: dict) -> dict:
    """Fetch user profile, using only user ID for cache key."""
    print(f"Fetching profile for user {user['id']}")
    time.sleep(0.1)
    return {
        "id": user['id'],
        "profile": "...",
        "preferences": "..."
    }

print("\\n=== Custom Key Example ===")
user1 = {"id": 1, "name": "Alice", "extra": "metadata"}
user2 = {"id": 1, "name": "Alice", "extra": "different"}

# These are different objects but same ID -> cache hit
print(get_user_profile(user1))
print(get_user_profile(user2))  # Cache hit despite different object

# ============================================================================
# ADVANCED: Class method memoization
# ============================================================================

class DataProcessor:
    """Example of memoizing class methods."""

    def __init__(self, config: dict):
        self.config = config
        self._cache: Dict[str, Any] = {}

    @lru_cache(maxsize=100)
    def process_static(self, data: str) -> str:
        """
        Static processing that doesn't depend on instance state.
        WARNING: lru_cache on methods can cause memory leaks
        (caches self reference).
        """
        print(f"Processing: {data}")
        return data.upper()

    def process_with_cache(self, data: str) -> str:
        """Manual caching that respects instance state."""
        cache_key = f"{id(self.config)}:{data}"

        if cache_key not in self._cache:
            print(f"Processing: {data}")
            self._cache[cache_key] = data.upper()

        return self._cache[cache_key]

# ============================================================================
# PERFORMANCE BENCHMARKING
# ============================================================================

def benchmark(name: str, func: Callable, *args, iterations: int = 1000):
    """Benchmark function execution time."""
    start = time.time()
    for _ in range(iterations):
        func(*args)
    duration = time.time() - start
    print(f"{name}: {duration:.4f}s for {iterations} iterations")

# Unmemoized Fibonacci (only small n to avoid timeout)
def fib_slow(n: int) -> int:
    if n <= 1:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)

print("\\n=== Performance Benchmark ===")
benchmark("Memoized fib(20)", fibonacci, 20, iterations=10000)
benchmark("Unmemoized fib(20)", fib_slow, 20, iterations=10)

# Clear cache to show initial computation cost
fibonacci.cache_clear()
print("\\nCache cleared - next call will recompute")
print(f"fib(30) = {fibonacci(30)}")`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope:
          "Python memoization using built-in lru_cache, custom decorators with TTL, and custom key functions",
        prerequisites: [
          "Python decorators",
          "functools module",
          "Type hints",
          "Closures",
        ],
        systemPosition:
          "Any layer: business logic, API handlers, data transformations, recursive algorithms",
      },
      annotations: [
        {
          id: "memo-py-lru-unlimited",
          lines: [10, 16],
          action:
            "Use functools.lru_cache with maxsize=None for unlimited cache",
          reason:
            "Python's built-in lru_cache provides thread-safe memoization; maxsize=None disables LRU eviction for unlimited cache growth",
          contextLevel: "local",
          relatedConcepts: ["lru-cache", "functools"],
        },
        {
          id: "memo-py-lru-bounded",
          lines: [18, 24],
          action:
            "Bounded LRU cache with maxsize=128 for memory-constrained scenarios",
          reason:
            "LRU eviction keeps cache size bounded; oldest-unused entries evicted when capacity reached, preventing memory exhaustion",
          contextLevel: "local",
          relatedConcepts: ["lru-cache", "bounded-memory"],
        },
        {
          id: "memo-py-ttl-decorator",
          lines: [31, 36],
          action:
            "Custom decorator with Time To Live (TTL) for expiring cached values",
          reason:
            "Some data becomes stale over time (API responses, computed metrics); TTL ensures cache entries expire after configured duration",
          contextLevel: "module",
          relatedConcepts: ["ttl", "cache-expiration", "decorators"],
        },
        {
          id: "memo-py-ttl-check",
          lines: [42, 49],
          action: "Check if cached result exists and hasn't expired",
          reason:
            "Compare current time with cached timestamp; return cached value if within TTL, otherwise delete expired entry and recompute",
          contextLevel: "local",
          relatedConcepts: ["ttl", "time-based-expiration"],
        },
        {
          id: "memo-py-key-generation",
          lines: [66, 73],
          action: "Generate unique cache key from function arguments",
          reason:
            "JSON serialization provides consistent keys for primitives and structures; fallback to string representation for non-serializable types like functions",
          contextLevel: "local",
          relatedConcepts: ["serialization", "key-generation"],
        },
        {
          id: "memo-py-custom-key",
          lines: [80, 85],
          action:
            "Allow custom key function for specialized cache key generation",
          reason:
            "Sometimes only part of arguments matter for caching (e.g., user ID from full user object); custom key function extracts relevant data",
          contextLevel: "module",
          relatedConcepts: ["custom-key-function", "flexibility"],
        },
        {
          id: "memo-py-custom-key-usage",
          lines: [163, 169],
          action:
            "Use only user ID for cache key, ignoring other object properties",
          reason:
            "Different user objects with same ID should return same cached profile; custom key function extracts ID for caching",
          contextLevel: "local",
          relatedConcepts: ["partial-key", "object-identity"],
        },
        {
          id: "memo-py-method-warning",
          lines: [188, 195],
          action:
            "WARNING: lru_cache on instance methods can cause memory leaks",
          reason:
            "lru_cache caches the self reference, preventing instance garbage collection; prefer manual caching for instance methods",
          contextLevel: "system",
          relatedConcepts: ["memory-leaks", "garbage-collection", "gotchas"],
        },
        {
          id: "memo-py-manual-cache",
          lines: [197, 206],
          action:
            "Manual caching for instance methods using instance-scoped cache dict",
          reason:
            "Cache key includes instance identity (id(self.config)) to avoid cross-instance cache pollution; stored in instance variable for proper lifecycle",
          contextLevel: "local",
          relatedConcepts: ["instance-caching", "manual-memoization"],
        },
      ],
      highlights: [
        {
          lines: [10, 24],
          label: "Built-in lru_cache decorator usage",
          sbvpDomain: "structure",
        },
        {
          lines: [31, 62],
          label: "Custom TTL-based memoization decorator",
          sbvpDomain: "structure",
        },
        {
          lines: [80, 106],
          label: "Custom key function for flexible caching",
          sbvpDomain: "structure",
        },
        {
          lines: [188, 206],
          label: "Instance method caching patterns and pitfalls",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Recursive algorithms (Fibonacci, dynamic programming)",
      "React components with expensive render logic",
      "Data transformation pipelines",
      "API response processors",
      "Complex calculations in business logic",
      "Pure utility functions with repeated calls",
    ],
    interactsWith: [
      "cache-aside",
      "lazy-loading",
      "lazy-initialization",
      "dynamic-programming",
    ],
    architecturalBoundaries: [
      "Application layer: Business logic functions",
      "Presentation layer: React components and UI calculations",
      "Data layer: Query result transformations",
      "Service layer: External API response processors",
    ],
  },

  implementations: [
    {
      id: "lodash-memoize",
      name: "Lodash _.memoize",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Flexible JavaScript memoization with custom resolver function for cache key generation. Supports any function signature and allows custom cache implementations (Map, WeakMap, etc.). Widely used in production JavaScript applications.",
      links: {
        docs: "https://lodash.com/docs/#memoize",
        npm: "https://www.npmjs.com/package/lodash.memoize",
      },
      codeSnippet: `import memoize from 'lodash/memoize';

// Basic memoization
const expensiveFunc = memoize((a, b) => {
  console.log('Computing...');
  return a + b;
});

// Custom resolver for complex key generation
const getUserData = memoize(
  (user) => fetchUserData(user.id),
  (user) => user.id  // Resolver: only cache by ID
);

// Custom cache (e.g., WeakMap for garbage collection)
const memoized = memoize(func, resolver);
memoized.cache = new WeakMap();`,
    },
    {
      id: "functools-lru-cache",
      name: "Python functools.lru_cache",
      type: "library",
      languages: ["python"],
      description:
        "Built-in Python decorator for LRU memoization. Thread-safe with configurable cache size. Provides cache_info() for monitoring hits/misses and cache_clear() for invalidation. Part of standard library since Python 3.2.",
      links: {
        docs: "https://docs.python.org/3/library/functools.html#functools.lru_cache",
      },
      codeSnippet: `from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Check cache statistics
print(fibonacci.cache_info())
# CacheInfo(hits=48, misses=50, maxsize=128, currsize=50)

# Clear cache
fibonacci.cache_clear()`,
    },
    {
      id: "react-memo",
      name: "React.memo",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "React's built-in higher-order component for memoizing functional components. Prevents re-renders when props haven't changed using shallow comparison. Supports custom comparison function for deep equality checks.",
      links: {
        docs: "https://react.dev/reference/react/memo",
      },
      codeSnippet: `import React from 'react';

// Shallow prop comparison (default)
const MyComponent = React.memo(({ data }) => {
  return <div>{data.value}</div>;
});

// Custom comparison function
const DeepMemoComponent = React.memo(
  MyComponent,
  (prevProps, nextProps) => {
    return deepEqual(prevProps, nextProps);
  }
);`,
    },
    {
      id: "react-usememo",
      name: "React useMemo",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "React hook for memoizing expensive calculations within components. Only recalculates when dependencies change. Essential for optimizing component render performance.",
      links: {
        docs: "https://react.dev/reference/react/useMemo",
      },
      codeSnippet: `import { useMemo } from 'react';

function DataTable({ data, filters }) {
  // Only recalculate when data or filters change
  const filteredData = useMemo(() => {
    console.log('Filtering data...');
    return data.filter(item =>
      filters.every(f => f.test(item))
    );
  }, [data, filters]);

  return <Table data={filteredData} />;
}`,
    },
    {
      id: "react-usecallback",
      name: "React useCallback",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "React hook for memoizing callback functions to prevent unnecessary re-renders of child components. Returns stable function reference until dependencies change.",
      links: {
        docs: "https://react.dev/reference/react/useCallback",
      },
      codeSnippet: `import { useCallback } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);

  // Stable function reference across renders
  const handleClick = useCallback(() => {
    console.log('Clicked!');
    setCount(c => c + 1);
  }, []); // No dependencies

  return <MemoizedChild onClick={handleClick} />;
}`,
    },
    {
      id: "memoizee",
      name: "memoizee",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Feature-rich Node.js memoization library with TTL, LRU eviction, promise support, and weak references. Supports primitive and complex argument types with customizable serialization.",
      links: {
        github: "https://github.com/medikoo/memoizee",
        npm: "https://www.npmjs.com/package/memoizee",
      },
      codeSnippet: `const memoize = require('memoizee');

// With TTL and max age
const fn = memoize(expensiveFunc, {
  maxAge: 1000,     // Expire after 1s
  max: 100,         // Max 100 entries
  preFetch: true,   // Refresh before expiry
  promise: true     // Memoize promises
});

// Async function memoization
const getData = memoize(async (id) => {
  return await fetchData(id);
}, { promise: true });`,
    },
    {
      id: "reselect",
      name: "Reselect",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Memoized selector library for Redux and state management. Creates composable, memoized transformations of state. Only recalculates when relevant state slices change.",
      links: {
        docs: "https://github.com/reduxjs/reselect",
        npm: "https://www.npmjs.com/package/reselect",
      },
      codeSnippet: `import { createSelector } from 'reselect';

const selectUsers = state => state.users;
const selectFilter = state => state.filter;

// Memoized selector - only recomputes when
// users or filter changes
const selectFilteredUsers = createSelector(
  [selectUsers, selectFilter],
  (users, filter) => {
    console.log('Computing filtered users...');
    return users.filter(u => u.role === filter);
  }
);`,
    },
    {
      id: "memo-decorator",
      name: "memo-decorator",
      type: "library",
      languages: ["typescript"],
      description:
        "TypeScript decorator for method memoization with support for class methods, instance methods, and static methods. Provides clean decorator syntax for transparent memoization.",
      links: {
        github: "https://github.com/mgechev/memo-decorator",
        npm: "https://www.npmjs.com/package/memo-decorator",
      },
      codeSnippet: `import { Memoize } from 'memo-decorator';

class Calculator {
  @Memoize()
  expensiveCalculation(a: number, b: number): number {
    console.log('Calculating...');
    return a ** b;
  }

  @Memoize({
    resolver: (args) => args[0].id  // Custom key
  })
  getUserData(user: User): UserData {
    return this.fetchData(user);
  }
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "react",
      systemName: "React Framework",
      howUsed:
        "React extensively uses memoization to optimize rendering performance. React.memo prevents functional component re-renders when props haven't changed, using shallow prop comparison by default. useMemo caches expensive calculations within components, only recalculating when dependencies change. useCallback memoizes event handlers and callback functions, preventing child component re-renders caused by new function references. The reconciliation algorithm itself uses memoization to track component trees and minimize DOM updates. React's virtual DOM diffing benefits from memoization by caching component subtrees that haven't changed. Pattern composition: Memoization + Virtual DOM + Reconciliation + Shallow Comparison. Rationale: Modern web apps render thousands of components; without memoization, every state change triggers cascade of expensive re-renders and calculations. Impact: Reduced render time by 60-80% in large applications; enabled interactive UIs with 1000+ components; Facebook feed with 10k+ posts maintains 60fps scrolling. Critical for performance at scale—React apps with millions of users depend on memoization to remain responsive.",
      source: "https://react.dev/reference/react/memo",
    },
    {
      systemId: "redux",
      systemName: "Redux State Management",
      howUsed:
        "Redux uses memoized selectors (via Reselect library) to efficiently derive data from state. Selectors compute derived state like filtered lists, sorted data, or aggregated statistics. Without memoization, every state change triggers recalculation of all derived values, even if relevant state slices unchanged. Reselect memoizes selector output and only recalculates when input selectors return different values. For example, a filtered/sorted user list selector only recomputes when user array or filter criteria change, not when unrelated state updates. This prevents expensive operations in every render cycle. Pattern composition: Memoization + Selector Pattern + Composed Selectors + Referential Equality. Rationale: Large Redux stores contain dozens of state slices; components subscribing to derived data shouldn't recalculate on every action dispatch. Impact: Reduced unnecessary re-renders by 90% in typical apps; enabled efficient selectors computing complex aggregations over large datasets; apps with 100+ connected components maintain smooth UI. Airbnb's search results page uses memoized selectors to filter/sort 1000+ listings without lag.",
      source: "https://redux.js.org/usage/deriving-data-selectors",
    },
    {
      systemId: "graphql",
      systemName: "GraphQL DataLoader",
      howUsed:
        "Facebook's DataLoader uses memoization with request batching to solve the N+1 query problem in GraphQL servers. When resolving a GraphQL query, multiple nested resolvers often fetch the same entity repeatedly. DataLoader memoizes fetch results within a single request context, ensuring each unique entity ID is fetched only once. For example, if 50 posts reference the same author, DataLoader batches them into one database query and memoizes the result. The cache is request-scoped (cleared after response) to prevent stale data across requests while maximizing efficiency within a request. Pattern composition: Memoization + Request Batching + Context-Scoped Cache + N+1 Prevention. Rationale: GraphQL's nested resolver architecture causes massive over-fetching; without memoization, resolving complex queries triggers thousands of duplicate database calls. Impact: Reduced database queries by 95% for typical nested queries; Facebook feed API serves 1B+ requests/day with sub-100ms latency; enabled GraphQL at scale. Before DataLoader, complex queries took 5+ seconds; after, sub-200ms.",
      source: "https://github.com/graphql/dataloader",
    },
    {
      systemId: "python-stdlib",
      systemName: "Python Standard Library",
      howUsed:
        "Python's functools.lru_cache is the standard approach for memoization across the Python ecosystem. It's used throughout the standard library itself (e.g., re module compiles regex patterns once and caches). Django ORM uses memoization for query plan caching—identical SQL queries reuse prepared statements. NumPy and scientific computing libraries memoize expensive matrix operations and FFT calculations. Web frameworks like Flask use lru_cache for view function results in development mode. Pattern composition: Memoization + LRU Eviction + Thread Safety + Decorator Pattern. Rationale: Python is interpreted and slower than compiled languages; memoization provides easy performance wins for pure functions. Impact: 10-1000x speedups for recursive algorithms; Django query plan caching reduces database load by 50%; scientific computing pipelines with memoized transformations run 5x faster. Python's decorator syntax makes memoization trivial to apply, encouraging widespread adoption.",
      source:
        "https://docs.python.org/3/library/functools.html#functools.lru_cache",
    },
    {
      systemId: "webpack",
      systemName: "Webpack Build Tool",
      howUsed:
        "Webpack uses extensive memoization for incremental builds and module caching. Module resolution results are memoized to avoid repeatedly parsing the same files. Compiled loaders (transforming TypeScript, Sass, etc.) cache transformation results—unchanged files skip recompilation. The persistent cache (introduced in Webpack 5) memoizes across builds, storing module graphs and compilation artifacts to disk. For large codebases, this reduces rebuild time from minutes to seconds. Webpack also memoizes chunk splitting decisions and dependency graphs. Pattern composition: Memoization + Persistent Cache + File Hashing + Incremental Compilation. Rationale: Modern web apps have 10k+ modules; recompiling everything on every change is prohibitive; memoization enables sub-second hot reload. Impact: Reduced rebuild time by 90% (3min → 20s for large apps); enabled instant hot module replacement in development; production builds sped up 5x with persistent caching. Airbnb reported 70% faster CI builds after Webpack 5 persistent cache adoption.",
      source: "https://webpack.js.org/configuration/cache/",
    },
  ],

  philosophy: {
    coreProblem:
      "Applications waste CPU cycles recalculating the same results repeatedly, causing slow performance and poor user experience",
    designPrinciple:
      "Trade memory for speed by caching function results—sacrifice space complexity to improve time complexity",
    historicalContext:
      "Term coined by Donald Michie in 1968 paper 'Memo Functions and Machine Learning'. Fundamental technique in dynamic programming algorithms since the 1950s. Became mainstream in web development with React's popularization of memoized components.",
    alternativesRejected: [
      "Recalculate every time - wastes CPU, causes lag",
      "Manual caching - error-prone, boilerplate-heavy",
      "Global cache - stale data, memory leaks, concurrency issues",
      "Precompute everything - memory exhaustion for large input spaces",
    ],
    mentalModel:
      "Like a student writing down math problem answers in a notebook during homework—when the same problem appears on the exam, they look up the answer instead of solving it again. The notebook is the cache, the problem is the input, and the answer is the cached output.",
  },

  visualization: {
    staticDiagram: `graph TD
    A[Function Called] --> B{Check Cache}
    B -->|Hit| C[Return Cached Result]
    B -->|Miss| D[Execute Function]
    D --> E[Store Result in Cache]
    E --> F[Return Result]
    C --> G[Fast O&#40;1&#41; Lookup]
    F --> H[First-time Computation]`,
    realWorldAnalogy:
      "Memoization is like a restaurant server remembering regular customers' usual orders. The first time, they ask what you want (computation). Afterwards, they just say 'the usual?' and bring it instantly (cache hit). The server's memory is the cache, your identity is the cache key, and your order is the cached result. This works perfectly as long as your preferences don't change—if you suddenly want something different, the server needs to update their memory (cache invalidation).",
    useCases: [
      {
        domain: "Web Development",
        scenario:
          "React application with expensive component renders. User scrolls through a feed with 1000+ posts, causing repeated renders with identical data.",
        patternRole:
          "React.memo prevents re-rendering posts with unchanged props; useMemo caches filtered/sorted lists to avoid recalculation on every scroll",
        companies: ["Facebook", "Twitter", "Instagram"],
      },
      {
        domain: "Algorithms",
        scenario:
          "Computing Fibonacci numbers or dynamic programming solutions. Naive recursion causes exponential time complexity.",
        patternRole:
          "Memoization transforms overlapping subproblems into cached lookups, reducing exponential O(2^n) to linear O(n)",
        companies: [
          "Algorithm competitions",
          "Educational platforms",
          "LeetCode",
        ],
      },
      {
        domain: "API Development",
        scenario:
          "GraphQL server resolving nested queries. Same user/post/comment entities fetched hundreds of times in a single request.",
        patternRole:
          "DataLoader memoizes entity fetches within request context, batching and deduplicating database queries",
        companies: ["Facebook", "GitHub", "Shopify"],
      },
      {
        domain: "Data Processing",
        scenario:
          "ETL pipeline transforming large datasets. Same transformations applied to identical data chunks repeatedly.",
        patternRole:
          "Memoize transformation functions to process each unique input only once, skipping redundant calculations",
        companies: ["Databricks", "Snowflake", "Airflow users"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "optimization",
    "algorithms",
    "react",
    "recursion",
    "dynamic-programming",
  ],
  difficulty: "intermediate",
};
