import type { Pattern } from "../schema";

export const objectPooling: Pattern = {
  id: "object-pooling",
  slug: "object-pooling",
  corpusPath: "⚡ PERFORMANCE → 🚀 Caching & Performance → 🎱 Resource Pooling",

  hierarchy: {
    quality: "performance",
    strategy: "Caching & Performance",
    family: "Resource Pooling",
    level: 4,
  },

  concept: {
    name: "Object Pooling",
    emoji: "🎱",
    tagline: "Reuse expensive objects instead of creating new ones",
    definition:
      "Object Pooling is a creational design pattern that maintains a pool of pre-initialized, reusable objects rather than creating and destroying them on demand. When a client needs an object, it borrows one from the pool; when finished, it returns the object for future reuse instead of discarding it. The pool manages object lifecycle, validation, and allocation, ensuring objects are properly reset between uses. This pattern is particularly valuable for expensive-to-create objects like database connections, thread instances, large buffers, or complex data structures where allocation overhead dominates performance. The pool typically enforces size limits (minimum and maximum instances), implements checkout timeouts to detect leaks, and may employ strategies like lazy initialization (create on demand) or eager loading (pre-warm the pool). Object health checks ensure returned objects are still valid, while factory patterns handle creation of new instances when the pool needs to grow. By amortizing creation cost across many uses and reducing garbage collection pressure, object pooling can dramatically improve throughput and latency in resource-intensive applications.",
    problemSolved:
      "In high-performance systems, repeatedly creating and destroying objects can become a significant bottleneck. Object instantiation involves memory allocation, constructor execution, and initialization logic—costs that multiply when performed thousands or millions of times per second. Additionally, garbage collection must later reclaim these short-lived objects, introducing unpredictable pause times that degrade tail latency. For heavyweight objects like network connections (requiring TCP handshake), cryptographic contexts (requiring key setup), or parsed XML documents, creation overhead can dwarf actual usage time. Object Pooling solves this by pre-allocating a set of reusable instances, transforming expensive creation operations into cheap checkout/return operations. This provides predictable, bounded performance regardless of request volume, eliminates allocation spikes that trigger GC, and enables resource limiting (the pool enforces maximum concurrent usage). The pattern also centralizes resource management, making it easier to monitor utilization, detect leaks (objects not returned), and implement policies like connection keep-alive or object expiration.",
    tradeoffs: {
      pros: [
        "Eliminates repeated allocation and deallocation overhead",
        "Reduces garbage collection pressure and pause times",
        "Provides predictable performance under load",
        "Enforces resource limits and prevents exhaustion",
        "Enables faster object acquisition than creation",
      ],
      cons: [
        "Increases baseline memory usage (pool holds idle objects)",
        "Risk of pool exhaustion blocking requests if undersized",
        "Stale or corrupted objects if reset logic is incomplete",
        "Added complexity in lifecycle management and cleanup",
        "Potential thread contention if pool access is synchronized",
      ],
    },
    relatedPatterns: [
      "connection-pooling",
      "thread-pooling",
      "flyweight",
      "factory",
      "singleton",
      "lazy-initialization",
      "object-lifecycle-management",
    ],
  },

  structure: {
    participants: [
      {
        name: "Pool Manager",
        role: "Resource Coordinator",
        responsibilities: [
          "Maintain pool of available and in-use objects",
          "Handle checkout requests and enforce limits",
          "Validate returned objects and reset state",
          "Create new instances when pool needs to grow",
          "Detect and handle leaked objects (timeout)",
        ],
      },
      {
        name: "Pooled Object",
        role: "Reusable Resource",
        responsibilities: [
          "Maintain state for current usage",
          "Support reset/cleanup between uses",
          "Expose validation interface for health checks",
          "Track usage metadata (checkout time, use count)",
        ],
      },
      {
        name: "Client",
        role: "Resource Consumer",
        responsibilities: [
          "Request object from pool (checkout)",
          "Use object for intended purpose",
          "Return object to pool when finished",
          "Handle pool exhaustion gracefully",
        ],
      },
      {
        name: "Factory",
        role: "Object Creator",
        responsibilities: [
          "Create new pooled object instances",
          "Initialize objects to valid starting state",
          "Provide configuration for object creation",
        ],
      },
      {
        name: "Health Checker",
        role: "Validator",
        responsibilities: [
          "Verify object is still usable before checkout",
          "Validate returned objects are properly reset",
          "Detect corrupted or stale objects",
          "Trigger object recreation if validation fails",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant P as Pool Manager
    participant O as Pooled Object
    participant F as Factory
    participant H as Health Checker

    C->>P: checkout()
    alt Pool has available object
        P->>O: Retrieve from available pool
        P->>H: validate(object)
        H-->>P: Valid
        P-->>C: Return object
    else Pool empty, below max
        P->>F: create()
        F-->>P: New object
        P-->>C: Return new object
    else Pool exhausted
        P-->>C: Wait or throw error
    end

    C->>O: Use object
    C->>P: return(object)
    P->>H: validate(object)
    alt Valid
        P->>O: reset()
        P->>P: Add to available pool
    else Invalid
        P->>P: Discard object
        P->>F: create() replacement
    end`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request Object",
        description:
          "Client calls checkout() to borrow an object from the pool",
      },
      {
        step: 2,
        actor: "Pool Manager",
        action: "Check Availability",
        description:
          "Pool checks if available objects exist or if new instance can be created",
      },
      {
        step: 3,
        actor: "Health Checker",
        action: "Validate Object",
        description:
          "Before returning, verify object is still valid and usable",
      },
      {
        step: 4,
        actor: "Pool Manager",
        action: "Mark as In-Use",
        description:
          "Track object as checked out, record checkout timestamp for leak detection",
      },
      {
        step: 5,
        actor: "Client",
        action: "Use Object",
        description: "Client performs operations with the borrowed object",
      },
      {
        step: 6,
        actor: "Client",
        action: "Return Object",
        description: "Client calls return() to release object back to pool",
      },
      {
        step: 7,
        actor: "Health Checker",
        action: "Validate Return",
        description: "Verify returned object is in acceptable state for reuse",
      },
      {
        step: 8,
        actor: "Pooled Object",
        action: "Reset State",
        description:
          "Clear any client-specific state, reset to clean initial state",
      },
      {
        step: 9,
        actor: "Pool Manager",
        action: "Return to Pool",
        description: "Add object back to available pool for next checkout",
      },
      {
        step: 10,
        actor: "Pool Manager",
        action: "Prune if Over-Capacity",
        description:
          "If pool has grown above minimum, optionally discard excess objects",
      },
    ],
    invariants: [
      "Objects must be properly reset to clean state before reuse",
      "Pool size must stay within configured min/max bounds",
      "No object can be checked out twice simultaneously",
      "Leaked objects (never returned) must be detected via timeout",
      "Total objects (available + in-use) must equal pool tracking count",
    ],
  },

  codeExamples: [
    {
      id: "op-typescript-generic",
      language: "typescript",
      title: "Generic Object Pool with Health Checks",
      description:
        "Type-safe generic pool implementation with validation, leak detection, and timeout handling",
      code: `interface PoolConfig<T> {
  min: number;                    // Minimum pool size
  max: number;                    // Maximum pool size
  checkoutTimeout: number;        // Max time object can be checked out (ms)
  validationInterval: number;     // How often to validate idle objects (ms)
}

interface PooledObjectMetadata {
  id: string;
  checkoutTime: number | null;
  useCount: number;
  createdAt: number;
}

interface PoolableFactory<T> {
  create(): T | Promise<T>;
  validate(obj: T): boolean | Promise<boolean>;
  reset(obj: T): void | Promise<void>;
  destroy?(obj: T): void | Promise<void>;
}

class ObjectPool<T> {
  private available: Map<T, PooledObjectMetadata> = new Map();
  private inUse: Map<T, PooledObjectMetadata> = new Map();
  private factory: PoolableFactory<T>;
  private config: PoolConfig<T>;
  private validationTimer?: NodeJS.Timeout;
  private leakCheckTimer?: NodeJS.Timeout;

  constructor(factory: PoolableFactory<T>, config: PoolConfig<T>) {
    this.factory = factory;
    this.config = config;

    // Pre-warm pool with minimum objects
    this.initialize().catch(err =>
      console.error('Pool initialization failed:', err)
    );

    // Start background validation of idle objects
    this.startValidationTimer();

    // Start leak detection timer
    this.startLeakDetection();
  }

  private async initialize(): Promise<void> {
    const promises = Array.from({ length: this.config.min }, () =>
      this.createObject()
    );

    const objects = await Promise.all(promises);
    objects.forEach(obj => {
      const metadata: PooledObjectMetadata = {
        id: this.generateId(),
        checkoutTime: null,
        useCount: 0,
        createdAt: Date.now(),
      };
      this.available.set(obj, metadata);
    });
  }

  async checkout(): Promise<T> {
    // Try to get available object
    for (const [obj, metadata] of this.available) {
      // Validate before checkout
      const isValid = await this.factory.validate(obj);

      if (isValid) {
        // Move from available to in-use
        this.available.delete(obj);
        metadata.checkoutTime = Date.now();
        metadata.useCount++;
        this.inUse.set(obj, metadata);

        return obj;
      } else {
        // Object failed validation, remove and destroy
        this.available.delete(obj);
        await this.destroyObject(obj);
      }
    }

    // No available objects, try to create new one if under max
    if (this.totalSize() < this.config.max) {
      const obj = await this.createObject();
      const metadata: PooledObjectMetadata = {
        id: this.generateId(),
        checkoutTime: Date.now(),
        useCount: 1,
        createdAt: Date.now(),
      };
      this.inUse.set(obj, metadata);

      return obj;
    }

    // Pool exhausted
    throw new Error(
      \`Pool exhausted: \${this.inUse.size} in use, \${this.available.size} available, max: \${this.config.max}\`
    );
  }

  async return(obj: T): Promise<void> {
    const metadata = this.inUse.get(obj);

    if (!metadata) {
      console.warn('Attempted to return object not from this pool');
      return;
    }

    // Remove from in-use tracking
    this.inUse.delete(obj);
    metadata.checkoutTime = null;

    // Validate and reset object
    const isValid = await this.factory.validate(obj);

    if (!isValid) {
      console.warn('Returned object failed validation, destroying');
      await this.destroyObject(obj);
      // Create replacement if below min
      if (this.totalSize() < this.config.min) {
        const replacement = await this.createObject();
        this.available.set(replacement, {
          id: this.generateId(),
          checkoutTime: null,
          useCount: 0,
          createdAt: Date.now(),
        });
      }
      return;
    }

    // Reset object state
    await this.factory.reset(obj);

    // If pool is over minimum, discard instead of returning
    if (this.available.size >= this.config.min) {
      await this.destroyObject(obj);
    } else {
      // Add back to available pool
      this.available.set(obj, metadata);
    }
  }

  private async createObject(): Promise<T> {
    return await this.factory.create();
  }

  private async destroyObject(obj: T): Promise<void> {
    if (this.factory.destroy) {
      await this.factory.destroy(obj);
    }
  }

  private startValidationTimer(): void {
    this.validationTimer = setInterval(async () => {
      // Validate all idle objects
      for (const [obj, metadata] of this.available) {
        const isValid = await this.factory.validate(obj);
        if (!isValid) {
          console.log(\`Removing invalid idle object \${metadata.id}\`);
          this.available.delete(obj);
          await this.destroyObject(obj);
        }
      }
    }, this.config.validationInterval);
  }

  private startLeakDetection(): void {
    this.leakCheckTimer = setInterval(() => {
      const now = Date.now();

      for (const [obj, metadata] of this.inUse) {
        if (metadata.checkoutTime) {
          const checkoutDuration = now - metadata.checkoutTime;

          if (checkoutDuration > this.config.checkoutTimeout) {
            console.error(
              \`Detected leaked object \${metadata.id}: checked out for \${checkoutDuration}ms (timeout: \${this.config.checkoutTimeout}ms)\`
            );
            // Could implement auto-recovery here
          }
        }
      }
    }, this.config.checkoutTimeout / 2);
  }

  private generateId(): string {
    return \`pool-obj-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }

  private totalSize(): number {
    return this.available.size + this.inUse.size;
  }

  async shutdown(): Promise<void> {
    if (this.validationTimer) clearInterval(this.validationTimer);
    if (this.leakCheckTimer) clearInterval(this.leakCheckTimer);

    // Destroy all objects
    for (const [obj] of this.available) {
      await this.destroyObject(obj);
    }

    for (const [obj] of this.inUse) {
      await this.destroyObject(obj);
    }

    this.available.clear();
    this.inUse.clear();
  }

  getStats() {
    return {
      total: this.totalSize(),
      available: this.available.size,
      inUse: this.inUse.size,
      min: this.config.min,
      max: this.config.max,
    };
  }
}

// Example: Buffer Pool
class BufferPool extends ObjectPool<Buffer> {
  constructor(bufferSize: number, min: number, max: number) {
    const factory: PoolableFactory<Buffer> = {
      create: () => Buffer.allocUnsafe(bufferSize),
      validate: (buf) => buf.length === bufferSize,
      reset: (buf) => buf.fill(0),
      destroy: (buf) => {
        // Let GC handle it
      },
    };

    super(factory, {
      min,
      max,
      checkoutTimeout: 30000,
      validationInterval: 60000,
    });
  }
}

// Performance comparison
async function demonstratePoolBenefit() {
  const ITERATIONS = 100000;
  const BUFFER_SIZE = 1024 * 1024; // 1MB

  // Without pooling
  console.time('Without pool');
  for (let i = 0; i < ITERATIONS; i++) {
    const buf = Buffer.allocUnsafe(BUFFER_SIZE);
    buf.fill(0);
    // Use buffer...
  }
  console.timeEnd('Without pool');

  // With pooling
  const pool = new BufferPool(BUFFER_SIZE, 10, 50);

  console.time('With pool');
  for (let i = 0; i < ITERATIONS; i++) {
    const buf = await pool.checkout();
    // Use buffer...
    await pool.return(buf);
  }
  console.timeEnd('With pool');

  console.log('Pool stats:', pool.getStats());
  await pool.shutdown();
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete generic object pool with lifecycle management, validation, and leak detection",
        prerequisites: [
          "TypeScript generics",
          "Async/await patterns",
          "Map data structures",
          "Timers and intervals",
        ],
        systemPosition:
          "Resource management layer sitting between application logic and expensive resource creation. Used in high-throughput services for buffer pools, connection pools, or worker pools.",
      },
      annotations: [
        {
          id: "op-ts-generic",
          lines: [1, 23],
          action: "Define generic interfaces for poolable objects and factory",
          reason:
            "Type-safe contract ensures any poolable type implements create, validate, reset lifecycle. Generic <T> allows reuse for buffers, connections, parsers, etc.",
          contextLevel: "module",
          relatedConcepts: [
            "factory-pattern",
            "generics",
            "interface-segregation",
          ],
        },
        {
          id: "op-ts-metadata",
          lines: [7, 12],
          action: "Track metadata for each pooled object instance",
          reason:
            "Checkout time enables leak detection; use count helps identify hot objects; ID supports debugging and logging",
          contextLevel: "local",
          relatedConcepts: ["object-lifecycle", "monitoring"],
        },
        {
          id: "op-ts-dual-map",
          lines: [26, 27],
          action: "Maintain separate maps for available vs in-use objects",
          reason:
            "Separation prevents double-checkout bugs and makes pool state queries O(1). Map key is the object itself, value is metadata.",
          contextLevel: "module",
          relatedConcepts: ["state-management", "data-structures"],
        },
        {
          id: "op-ts-prewarm",
          lines: [34, 37],
          action: "Pre-create minimum number of objects during initialization",
          reason:
            "Eager allocation prevents cold-start latency when first requests arrive. Amortizes creation cost at startup rather than request time.",
          contextLevel: "system",
          relatedConcepts: [
            "lazy-vs-eager-initialization",
            "performance-optimization",
          ],
        },
        {
          id: "op-ts-checkout-validation",
          lines: [66, 78],
          action: "Validate object health before checkout, destroy if invalid",
          reason:
            "Idle objects may become stale (connections closed, resources expired). Validation ensures client never receives broken object.",
          contextLevel: "module",
          relatedConcepts: ["health-checks", "defensive-programming"],
        },
        {
          id: "op-ts-pool-exhaustion",
          lines: [94, 97],
          action: "Throw error when pool reaches maximum capacity",
          reason:
            "Resource limiting prevents unbounded growth. Caller must handle by waiting, falling back, or rejecting request. Alternative: implement blocking wait.",
          contextLevel: "system",
          relatedConcepts: ["backpressure", "rate-limiting"],
        },
        {
          id: "op-ts-return-validation",
          lines: [114, 128],
          action:
            "Validate and reset returned objects, destroy and replace if invalid",
          reason:
            "Clients may corrupt objects through misuse. Validation prevents contaminated objects from re-entering pool. Replacement maintains pool size.",
          contextLevel: "module",
          relatedConcepts: ["defensive-programming", "state-reset"],
        },
        {
          id: "op-ts-leak-detection",
          lines: [174, 189],
          action:
            "Periodically scan in-use objects for checkout timeout violations",
          reason:
            "Leaked objects (never returned) cause pool exhaustion over time. Timeout detection enables alerting or auto-recovery before complete failure.",
          contextLevel: "system",
          relatedConcepts: ["resource-leak-detection", "monitoring"],
        },
        {
          id: "op-ts-performance-comparison",
          lines: [235, 255],
          action:
            "Demonstrate performance benefit of pooling via timed benchmark",
          reason:
            "For 100k iterations with 1MB buffers, allocation overhead dominates. Pool reduces 100k allocations to ~10-50, yielding massive speedup (often 10-100x).",
          contextLevel: "system",
          relatedConcepts: ["benchmarking", "allocation-overhead"],
        },
      ],
      highlights: [
        {
          lines: [1, 23],
          label: "Generic factory interface with lifecycle hooks",
          sbvpDomain: "structure",
        },
        {
          lines: [60, 78],
          label: "Checkout with validation and exhaustion handling",
          sbvpDomain: "behavior",
        },
        {
          lines: [174, 189],
          label: "Leak detection timer",
          sbvpDomain: "behavior",
        },
        {
          lines: [235, 255],
          label: "Performance benchmark comparison",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "op-python-http-pool",
      language: "python",
      title: "HTTP Client Connection Pool",
      description:
        "Pooled HTTP client with keep-alive connections, automatic recycling, and urllib3 integration",
      code: `from urllib3 import PoolManager, HTTPResponse
from urllib3.util.retry import Retry
from urllib3.exceptions import MaxRetryError, TimeoutError
import time
from typing import Optional, Dict, Any
from contextlib import contextmanager

class HTTPClientPool:
    """
    Pooled HTTP client that reuses TCP connections via keep-alive.

    Traditional approach: Each request creates new socket, performs TCP
    3-way handshake (SYN, SYN-ACK, ACK), sends request, receives response,
    closes socket (FIN, FIN-ACK). Total: ~7 network round-trips.

    Pool approach: Keep socket alive after first request. Subsequent
    requests reuse existing connection: 0 handshake overhead, just
    request/response. For 1000 requests: 1 handshake vs 1000 handshakes.
    """

    def __init__(
        self,
        max_connections: int = 10,
        max_connections_per_host: int = 5,
        timeout: float = 30.0,
        retries: int = 3,
        backoff_factor: float = 0.3,
    ):
        # Configure retry strategy with exponential backoff
        retry_strategy = Retry(
            total=retries,
            backoff_factor=backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE"],
        )

        # Create pool manager (this is the actual connection pool)
        self.pool = PoolManager(
            num_pools=max_connections,
            maxsize=max_connections_per_host,
            block=True,  # Block when pool exhausted rather than error
            timeout=timeout,
            retries=retry_strategy,
        )

        # Track pool statistics
        self.stats = {
            "requests": 0,
            "cache_hits": 0,  # Reused connections
            "cache_misses": 0,  # New connections created
            "errors": 0,
        }

    def request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[Any] = None,
        **kwargs
    ) -> HTTPResponse:
        """
        Make HTTP request using pooled connection.

        The pool manager automatically:
        1. Checks for existing connection to host
        2. Reuses if available (cache hit)
        3. Creates new if needed and under limit (cache miss)
        4. Blocks if pool exhausted (backpressure)
        """
        try:
            start_time = time.time()

            # Check if connection exists for this host (for stats)
            pool_key = self.pool.connection_from_url(url).pool.host
            had_connection = pool_key in self.pool.pools

            # Make request - pool handles connection reuse automatically
            response = self.pool.request(
                method,
                url,
                headers=headers,
                body=body,
                **kwargs
            )

            # Update statistics
            self.stats["requests"] += 1
            if had_connection:
                self.stats["cache_hits"] += 1
            else:
                self.stats["cache_misses"] += 1

            duration = time.time() - start_time

            return response

        except (MaxRetryError, TimeoutError) as e:
            self.stats["errors"] += 1
            raise

    @contextmanager
    def get(self, url: str, **kwargs):
        """
        Context manager for GET requests with automatic cleanup.

        Usage:
            with pool.get('https://api.example.com/users') as response:
                data = response.json()
        """
        response = self.request('GET', url, **kwargs)
        try:
            yield response
        finally:
            # Release connection back to pool
            response.release_conn()

    def close(self):
        """
        Shutdown pool and close all connections.

        Important: Call this during application shutdown to cleanly
        close sockets and prevent resource leaks.
        """
        self.pool.clear()

    def get_stats(self) -> Dict[str, Any]:
        """
        Return pool statistics including connection reuse rate.

        High cache_hit_rate indicates effective pooling.
        Low rate suggests pool too small or connections expiring.
        """
        total_attempts = self.stats["cache_hits"] + self.stats["cache_misses"]
        cache_hit_rate = (
            self.stats["cache_hits"] / total_attempts
            if total_attempts > 0
            else 0.0
        )

        return {
            **self.stats,
            "cache_hit_rate": cache_hit_rate,
            "pool_size": len(self.pool.pools),
        }


# Demonstration: Connection overhead savings
def demonstrate_connection_pooling():
    """
    Compare non-pooled vs pooled HTTP requests.

    Non-pooled: Each request pays full TCP handshake cost
    - Client: SYN → Server
    - Server: SYN-ACK → Client
    - Client: ACK → Server
    - Total: ~150ms on typical internet connection

    Pooled: First request pays handshake, rest reuse connection
    - First: 150ms (handshake + request)
    - Subsequent: 50ms (just request)
    - For 100 requests: 150ms + 99*50ms vs 100*150ms
    """
    import requests  # Non-pooled library for comparison

    NUM_REQUESTS = 50
    TEST_URL = "https://httpbin.org/get"

    # Non-pooled approach (new connection each time)
    print("Non-pooled requests:")
    start = time.time()
    for i in range(NUM_REQUESTS):
        # Each request creates new TCP connection
        response = requests.get(TEST_URL, timeout=30)
        response.close()
    non_pooled_time = time.time() - start
    print(f"  Time: {non_pooled_time:.2f}s")
    print(f"  Avg per request: {non_pooled_time / NUM_REQUESTS * 1000:.1f}ms")

    # Pooled approach (reuse connections)
    print("\\nPooled requests:")
    pool = HTTPClientPool(
        max_connections=5,
        max_connections_per_host=2,
    )

    start = time.time()
    for i in range(NUM_REQUESTS):
        # Reuses existing connections when possible
        with pool.get(TEST_URL) as response:
            pass  # Connection auto-released by context manager
    pooled_time = time.time() - start
    print(f"  Time: {pooled_time:.2f}s")
    print(f"  Avg per request: {pooled_time / NUM_REQUESTS * 1000:.1f}ms")

    stats = pool.get_stats()
    print(f"\\nPool statistics:")
    print(f"  Total requests: {stats['requests']}")
    print(f"  Connection reuse: {stats['cache_hits']} ({stats['cache_hit_rate']:.1%})")
    print(f"  New connections: {stats['cache_misses']}")
    print(f"  Active pools: {stats['pool_size']}")

    speedup = non_pooled_time / pooled_time
    print(f"\\nSpeedup: {speedup:.2f}x faster with pooling")

    pool.close()


if __name__ == "__main__":
    demonstrate_connection_pooling()`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production HTTP client pool with connection reuse, retry logic, and performance monitoring",
        prerequisites: [
          "HTTP protocol basics",
          "TCP connection lifecycle",
          "Context managers",
          "urllib3 library",
        ],
        systemPosition:
          "HTTP client layer in microservices that make frequent API calls. Sits between application logic and network transport, managing connection lifecycle transparently.",
      },
      annotations: [
        {
          id: "op-py-connection-pool",
          lines: [11, 20],
          action:
            "Document TCP handshake overhead that connection pooling eliminates",
          reason:
            "Each new HTTP connection requires 3-way handshake (SYN, SYN-ACK, ACK) + TLS negotiation if HTTPS. For 1000 requests, pooling saves 999 handshakes—often 10-100x speedup.",
          contextLevel: "system",
          relatedConcepts: ["tcp-handshake", "keep-alive", "connection-reuse"],
        },
        {
          id: "op-py-retry-strategy",
          lines: [30, 36],
          action:
            "Configure retry with exponential backoff and status code filtering",
          reason:
            "Transient failures (503, timeout) should retry; permanent failures (404) should not. Exponential backoff prevents thundering herd when service recovers.",
          contextLevel: "module",
          relatedConcepts: [
            "retry-pattern",
            "exponential-backoff",
            "circuit-breaker",
          ],
        },
        {
          id: "op-py-pool-manager",
          lines: [38, 45],
          action: "Create urllib3 PoolManager with connection and size limits",
          reason:
            "num_pools limits total connection pools; maxsize limits connections per host; block=True provides backpressure when exhausted instead of failing.",
          contextLevel: "module",
          relatedConcepts: ["resource-limiting", "backpressure"],
        },
        {
          id: "op-py-cache-stats",
          lines: [47, 53],
          action:
            "Track cache hits (reused connections) vs misses (new connections)",
          reason:
            "Hit rate indicates pooling effectiveness. Low rate suggests pool too small, connections expiring, or diverse hostnames preventing reuse.",
          contextLevel: "system",
          relatedConcepts: ["cache-metrics", "performance-monitoring"],
        },
        {
          id: "op-py-connection-reuse",
          lines: [71, 74],
          action:
            "Check if connection exists before request to track cache hit",
          reason:
            "urllib3 automatically reuses connections via keep-alive; we detect reuse for metrics by checking if pool exists for this host.",
          contextLevel: "local",
          relatedConcepts: ["http-keep-alive", "connection-pooling"],
        },
        {
          id: "op-py-context-manager",
          lines: [104, 116],
          action:
            "Provide context manager for automatic connection release on exit",
          reason:
            "Python's 'with' statement ensures release_conn() called even on exception. Prevents leaked connections that would exhaust pool.",
          contextLevel: "module",
          relatedConcepts: ["context-manager", "resource-cleanup"],
        },
        {
          id: "op-py-handshake-cost",
          lines: [152, 165],
          action:
            "Document TCP handshake overhead in terms of network round-trips",
          reason:
            "Handshake requires ~150ms on typical internet (50ms RTT * 3 round-trips). For 100 requests, pooling saves 99 * 150ms = 14.85 seconds of pure handshake time.",
          contextLevel: "system",
          relatedConcepts: ["network-latency", "tcp-overhead"],
        },
        {
          id: "op-py-performance-comparison",
          lines: [167, 195],
          action: "Benchmark pooled vs non-pooled requests to quantify speedup",
          reason:
            "Empirical measurement demonstrates value: typically 2-10x faster with pooling depending on RTT and request size. Validates pooling investment.",
          contextLevel: "system",
          relatedConcepts: ["benchmarking", "performance-validation"],
        },
      ],
      highlights: [
        {
          lines: [11, 20],
          label: "TCP handshake overhead explanation",
          sbvpDomain: "philosophy",
        },
        {
          lines: [38, 45],
          label: "Pool manager configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [104, 116],
          label: "Context manager for safe resource cleanup",
          sbvpDomain: "behavior",
        },
        {
          lines: [152, 195],
          label: "Performance comparison and benchmarking",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "op-java-threadpool",
      language: "java",
      title: "Thread Pool Executor with Worker Reuse",
      description:
        "Custom ThreadPoolExecutor demonstrating thread reuse, queue management, and graceful shutdown",
      code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.time.Duration;
import java.util.*;

/**
 * Thread Pool implementation demonstrating object pooling for expensive Thread objects.
 *
 * Thread Creation Cost:
 * - OS thread allocation: ~1MB stack space per thread
 * - JVM thread initialization: ~1ms on modern hardware
 * - Context switching overhead: 5-10μs per switch
 *
 * For task that executes in 100μs, thread creation overhead is 10x the work!
 * Pool approach: Create N threads once, reuse for M tasks where M >> N.
 */
public class TaskExecutorPool {

    private final ThreadPoolExecutor executor;
    private final AtomicLong tasksSubmitted = new AtomicLong(0);
    private final AtomicLong tasksCompleted = new AtomicLong(0);
    private final AtomicLong tasksRejected = new AtomicLong(0);

    /**
     * Create thread pool with configurable size and queue.
     *
     * @param corePoolSize Minimum number of threads to keep alive
     * @param maxPoolSize Maximum number of threads allowed
     * @param keepAliveTime How long excess threads wait for work before terminating
     * @param queueCapacity Max tasks to queue when all threads busy
     */
    public TaskExecutorPool(
        int corePoolSize,
        int maxPoolSize,
        Duration keepAliveTime,
        int queueCapacity
    ) {
        // Bounded queue prevents unbounded memory growth
        BlockingQueue<Runnable> workQueue = new LinkedBlockingQueue<>(queueCapacity);

        // Custom thread factory for debugging and monitoring
        ThreadFactory threadFactory = new ThreadFactory() {
            private final AtomicInteger threadNumber = new AtomicInteger(1);

            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "pool-worker-" + threadNumber.getAndIncrement());
                t.setDaemon(false); // Prevent JVM shutdown until tasks complete
                return t;
            }
        };

        // Rejection policy when queue is full
        RejectedExecutionHandler rejectionHandler = (task, executor) -> {
            tasksRejected.incrementAndGet();
            throw new RejectedExecutionException(
                "Task rejected: queue full, active threads: " + executor.getActiveCount()
            );
        };

        this.executor = new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            keepAliveTime.toMillis(),
            TimeUnit.MILLISECONDS,
            workQueue,
            threadFactory,
            rejectionHandler
        );

        // Allow core threads to timeout and terminate when idle
        executor.allowCoreThreadTimeOut(true);
    }

    /**
     * Submit task for async execution.
     *
     * Pool lifecycle:
     * 1. If < corePoolSize threads running, create new thread for task
     * 2. If >= corePoolSize, add task to queue
     * 3. If queue full and < maxPoolSize, create new thread (up to max)
     * 4. If queue full and at maxPoolSize, reject task
     */
    public <T> Future<T> submit(Callable<T> task) {
        tasksSubmitted.incrementAndGet();

        // Wrap task to track completion
        Callable<T> wrappedTask = () -> {
            try {
                return task.call();
            } finally {
                tasksCompleted.incrementAndGet();
            }
        };

        return executor.submit(wrappedTask);
    }

    /**
     * Submit task without return value.
     */
    public void execute(Runnable task) {
        tasksSubmitted.incrementAndGet();

        Runnable wrappedTask = () -> {
            try {
                task.run();
            } finally {
                tasksCompleted.incrementAndGet();
            }
        };

        executor.execute(wrappedTask);
    }

    /**
     * Graceful shutdown: stop accepting new tasks, complete queued tasks.
     *
     * Shutdown sequence:
     * 1. Reject new task submissions
     * 2. Allow running tasks to complete
     * 3. Process all queued tasks
     * 4. Terminate worker threads
     */
    public void shutdown() {
        executor.shutdown();
    }

    /**
     * Force shutdown: interrupt running tasks, discard queued tasks.
     */
    public List<Runnable> shutdownNow() {
        return executor.shutdownNow();
    }

    /**
     * Wait for all tasks to complete after shutdown.
     */
    public boolean awaitTermination(Duration timeout) throws InterruptedException {
        return executor.awaitTermination(timeout.toMillis(), TimeUnit.MILLISECONDS);
    }

    /**
     * Get pool statistics for monitoring.
     */
    public PoolStats getStats() {
        return new PoolStats(
            executor.getPoolSize(),           // Current thread count
            executor.getActiveCount(),        // Threads executing tasks
            executor.getQueue().size(),       // Tasks waiting in queue
            tasksSubmitted.get(),
            tasksCompleted.get(),
            tasksRejected.get()
        );
    }

    public static class PoolStats {
        public final int poolSize;
        public final int activeThreads;
        public final int queuedTasks;
        public final long totalSubmitted;
        public final long totalCompleted;
        public final long totalRejected;

        public PoolStats(int poolSize, int activeThreads, int queuedTasks,
                        long submitted, long completed, long rejected) {
            this.poolSize = poolSize;
            this.activeThreads = activeThreads;
            this.queuedTasks = queuedTasks;
            this.totalSubmitted = submitted;
            this.totalCompleted = completed;
            this.totalRejected = rejected;
        }

        @Override
        public String toString() {
            return String.format(
                "Pool[size=%d, active=%d, queued=%d, submitted=%d, completed=%d, rejected=%d]",
                poolSize, activeThreads, queuedTasks,
                totalSubmitted, totalCompleted, totalRejected
            );
        }
    }

    /**
     * Demonstrate thread creation overhead vs task execution time.
     */
    public static void main(String[] args) throws Exception {
        final int NUM_TASKS = 10000;
        final int TASK_DURATION_MS = 10;

        // Simulate CPU-bound task
        Runnable task = () -> {
            long sum = 0;
            for (int i = 0; i < 1_000_000; i++) {
                sum += i;
            }
        };

        // Approach 1: Create new thread per task (NO pooling)
        System.out.println("Approach 1: Thread-per-task (no pooling)");
        long start = System.currentTimeMillis();

        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < NUM_TASKS; i++) {
            Thread t = new Thread(task);
            t.start();
            threads.add(t);
        }

        for (Thread t : threads) {
            t.join();
        }

        long threadPerTaskTime = System.currentTimeMillis() - start;
        System.out.printf("  Time: %dms%n", threadPerTaskTime);
        System.out.printf("  Threads created: %d%n", NUM_TASKS);

        // Approach 2: Thread pool (WITH pooling)
        System.out.println("\\nApproach 2: Thread pool (with pooling)");
        start = System.currentTimeMillis();

        TaskExecutorPool pool = new TaskExecutorPool(
            10,                         // Core threads
            20,                         // Max threads
            Duration.ofSeconds(60),     // Keep-alive
            1000                        // Queue capacity
        );

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < NUM_TASKS; i++) {
            futures.add(pool.submit(() -> {
                task.run();
                return null;
            }));
        }

        // Wait for completion
        for (Future<?> future : futures) {
            future.get();
        }

        long pooledTime = System.currentTimeMillis() - start;
        System.out.printf("  Time: %dms%n", pooledTime);
        System.out.println("  Stats: " + pool.getStats());

        double speedup = (double) threadPerTaskTime / pooledTime;
        System.out.printf("%nSpeedup: %.2fx faster with thread pooling%n", speedup);
        System.out.printf("Thread creation overhead eliminated: %dms (%.1f%%)%n",
            threadPerTaskTime - pooledTime,
            ((double)(threadPerTaskTime - pooledTime) / threadPerTaskTime) * 100
        );

        pool.shutdown();
        pool.awaitTermination(Duration.ofSeconds(5));
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production thread pool executor with queue management, rejection policies, and lifecycle control",
        prerequisites: [
          "Java concurrency",
          "Executor framework",
          "Blocking queues",
          "Thread lifecycle",
        ],
        systemPosition:
          "Concurrency management layer in server applications. Used in web servers (Tomcat, Jetty), async processing systems, and parallel computation frameworks.",
      },
      annotations: [
        {
          id: "op-java-thread-cost",
          lines: [7, 16],
          action:
            "Document thread creation overhead: memory allocation, initialization, context switching",
          reason:
            "Each thread consumes ~1MB stack space and ~1ms creation time. For 100μs tasks, creation overhead is 10x the work. Pool amortizes cost across thousands of tasks.",
          contextLevel: "system",
          relatedConcepts: [
            "thread-overhead",
            "context-switching",
            "memory-footprint",
          ],
        },
        {
          id: "op-java-bounded-queue",
          lines: [38, 39],
          action:
            "Use bounded LinkedBlockingQueue to prevent unbounded memory growth",
          reason:
            "Unbounded queue allows infinite task backlog, risking OOM. Bounded queue provides backpressure: callers must slow down or handle rejection when full.",
          contextLevel: "system",
          relatedConcepts: [
            "backpressure",
            "resource-limiting",
            "queue-management",
          ],
        },
        {
          id: "op-java-thread-factory",
          lines: [41, 51],
          action: "Custom ThreadFactory for named threads and daemon control",
          reason:
            "Named threads (pool-worker-N) aid debugging in thread dumps. Non-daemon ensures JVM waits for task completion before shutdown.",
          contextLevel: "module",
          relatedConcepts: ["observability", "debugging", "thread-lifecycle"],
        },
        {
          id: "op-java-rejection-policy",
          lines: [53, 59],
          action:
            "Custom RejectedExecutionHandler to track rejections and throw exception",
          reason:
            "When pool exhausted, caller needs feedback to implement backoff or circuit breaking. Metrics enable monitoring pool sizing.",
          contextLevel: "system",
          relatedConcepts: ["backpressure", "metrics", "error-handling"],
        },
        {
          id: "op-java-pool-lifecycle",
          lines: [75, 83],
          action:
            "Document thread pool allocation strategy: core → queue → max → reject",
          reason:
            "Understanding lifecycle prevents misconfiguration. Common mistake: maxPoolSize never reached if queue unbounded. Bounded queue enables max utilization.",
          contextLevel: "module",
          relatedConcepts: ["thread-pool-sizing", "queue-strategies"],
        },
        {
          id: "op-java-graceful-shutdown",
          lines: [116, 126],
          action:
            "Implement graceful shutdown that completes queued tasks before termination",
          reason:
            "Prevents data loss by finishing in-flight work. Critical for request handlers, message processors, or transactional tasks. Alternative: shutdownNow() for immediate stop.",
          contextLevel: "system",
          relatedConcepts: ["graceful-degradation", "shutdown-hooks"],
        },
        {
          id: "op-java-pool-stats",
          lines: [142, 155],
          action:
            "Expose pool statistics: size, active threads, queue depth, throughput",
          reason:
            "Metrics enable capacity planning and detection of pool starvation. High queue depth → increase pool size; high rejection → increase queue or reject upstream.",
          contextLevel: "system",
          relatedConcepts: ["observability", "capacity-planning", "metrics"],
        },
        {
          id: "op-java-benchmark",
          lines: [193, 236],
          action:
            "Benchmark thread-per-task vs pooled approach to demonstrate speedup",
          reason:
            "For 10k tasks, thread-per-task creates 10k threads (10+ seconds overhead). Pool reuses 10-20 threads (minimal overhead). Typical speedup: 5-50x depending on task duration.",
          contextLevel: "system",
          relatedConcepts: [
            "performance-benchmarking",
            "thread-reuse",
            "scalability",
          ],
        },
      ],
      highlights: [
        {
          lines: [7, 16],
          label: "Thread creation cost analysis",
          sbvpDomain: "philosophy",
        },
        {
          lines: [38, 68],
          label: "Thread pool executor configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [75, 94],
          label: "Task submission with lifecycle tracking",
          sbvpDomain: "behavior",
        },
        {
          lines: [193, 236],
          label: "Performance comparison benchmark",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "HTTP Client Pools - Reuse connections with keep-alive",
      "Thread Pools - Reuse worker threads for task execution",
      "Buffer Pools - Reuse memory buffers in I/O operations",
      "WebSocket Connection Pools - Maintain persistent connections",
      "Parser Object Pools - Reuse XML/JSON parsers",
      "Heavy DTO Pools - Reuse large data transfer objects",
      "Database Connection Pools - Reuse database connections",
      "Graphics Context Pools - Reuse rendering contexts",
    ],
    interactsWith: [
      "connection-pooling",
      "factory-pattern",
      "lifecycle-management",
      "monitoring",
    ],
    architecturalBoundaries: [
      "Resource Management Layer - Pool manages expensive resource lifecycle",
      "Application Layer - Business logic requests objects from pool",
      "Infrastructure Layer - Pool interacts with OS resources (sockets, threads)",
      "Monitoring Layer - Pool exposes metrics on utilization and performance",
    ],
  },

  implementations: [
    {
      id: "apache-commons-pool",
      name: "Apache Commons Pool",
      type: "library",
      languages: ["java"],
      description:
        "Generic object pooling library providing configurable pool implementations. Supports object validation, lifecycle hooks, and multiple pool strategies (FIFO, LIFO). Used by many database connection pools (DBCP) and application servers.",
      links: {
        docs: "https://commons.apache.org/proper/commons-pool/",
        github: "https://github.com/apache/commons-pool",
      },
      codeSnippet: `GenericObjectPoolConfig<MyObject> config = new GenericObjectPoolConfig<>();
config.setMaxTotal(50);
config.setMaxIdle(10);
config.setMinIdle(5);

GenericObjectPool<MyObject> pool = new GenericObjectPool<>(
    new MyObjectFactory(),
    config
);

MyObject obj = pool.borrowObject();
try {
    // Use object
} finally {
    pool.returnObject(obj);
}`,
    },
    {
      id: "hikaricp",
      name: "HikariCP",
      type: "library",
      languages: ["java"],
      description:
        "High-performance JDBC connection pool known for speed and reliability. Uses FastList for faster collection operations and ConcurrentBag for optimal concurrency. Industry standard for Java database pooling.",
      links: {
        docs: "https://github.com/brettwooldridge/HikariCP/wiki",
        github: "https://github.com/brettwooldridge/HikariCP",
      },
      codeSnippet: `HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost/db");
config.setUsername("user");
config.setPassword("pass");
config.setMaximumPoolSize(10);
config.setMinimumIdle(5);
config.setConnectionTimeout(30000);
config.setIdleTimeout(600000);

HikariDataSource pool = new HikariDataSource(config);

Connection conn = pool.getConnection();
try {
    // Use connection
} finally {
    conn.close(); // Returns to pool
}`,
    },
    {
      id: "pg-pool",
      name: "node-postgres Pool",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "PostgreSQL connection pooling for Node.js. Manages connection lifecycle, query queueing, and automatic reconnection. Integrates seamlessly with pg client library.",
      links: {
        docs: "https://node-postgres.com/features/pooling",
        github: "https://github.com/brianc/node-postgres",
      },
      codeSnippet: `const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'mydb',
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users');
} finally {
  client.release(); // Return to pool
}`,
    },
    {
      id: "java-threadpool",
      name: "Java ThreadPoolExecutor",
      type: "framework",
      languages: ["java"],
      description:
        "Built-in Java thread pool from java.util.concurrent. Provides configurable pool sizing, work queues, and rejection policies. Foundation for ExecutorService and other concurrency utilities.",
      links: {
        docs: "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html",
      },
      codeSnippet: `ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5,                          // Core pool size
    10,                         // Max pool size
    60L,                        // Keep-alive time
    TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),
    new ThreadPoolExecutor.CallerRunsPolicy()
);

executor.execute(() -> {
    // Task logic
});

executor.shutdown();`,
    },
    {
      id: "urllib3-poolmanager",
      name: "urllib3 PoolManager",
      type: "library",
      languages: ["python"],
      description:
        "HTTP connection pooling for Python with keep-alive support. Automatically manages connection reuse, handles SSL/TLS, and provides retry logic. Used by requests library internally.",
      links: {
        docs: "https://urllib3.readthedocs.io/en/stable/",
        github: "https://github.com/urllib3/urllib3",
      },
      codeSnippet: `from urllib3 import PoolManager

http = PoolManager(
    num_pools=10,
    maxsize=10,
    timeout=30.0,
    retries=3
)

response = http.request('GET', 'https://api.example.com/data')
# Connection automatically returned to pool`,
    },
    {
      id: "redis-pool",
      name: "Redis Connection Pool",
      type: "library",
      languages: ["python", "javascript", "java"],
      description:
        "Connection pooling for Redis clients across multiple languages. Maintains persistent TCP connections to Redis server, reducing latency from connection overhead.",
      links: {
        docs: "https://redis-py.readthedocs.io/en/stable/connections.html",
        github: "https://github.com/redis/redis-py",
      },
      codeSnippet: `import redis

pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=10,
    decode_responses=True
)

client = redis.Redis(connection_pool=pool)
client.set('key', 'value')  # Reuses pooled connection`,
    },
    {
      id: "grpc-channel-pool",
      name: "gRPC Channel Pool",
      type: "library",
      languages: ["go", "java", "python"],
      description:
        "Connection pooling for gRPC clients. Manages HTTP/2 streams and connections to backend services. Critical for microservice architectures using gRPC.",
      links: {
        docs: "https://grpc.io/docs/guides/performance/",
      },
      codeSnippet: `// Go example
pool := grpcpool.New(func() (*grpc.ClientConn, error) {
    return grpc.Dial("service:50051",
        grpc.WithInsecure(),
    )
}, 5, 20, time.Second)

conn, _ := pool.Get(context.Background())
defer conn.Close()

client := pb.NewUserServiceClient(conn.ClientConn)`,
    },
    {
      id: "dotnet-arraypool",
      name: ".NET ArrayPool",
      type: "platform",
      languages: ["csharp"],
      description:
        "Built-in .NET array pooling for reducing allocation overhead. Particularly effective for temporary buffers in I/O operations. Shared pool available via ArrayPool<T>.Shared.",
      links: {
        docs: "https://docs.microsoft.com/en-us/dotnet/api/system.buffers.arraypool-1",
      },
      codeSnippet: `var pool = ArrayPool<byte>.Shared;

byte[] buffer = pool.Rent(1024);
try {
    // Use buffer for I/O
    stream.Read(buffer, 0, 1024);
} finally {
    pool.Return(buffer, clearArray: true);
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "apache-tomcat",
      systemName: "Apache Tomcat Web Server",
      howUsed:
        "Tomcat uses thread pooling extensively via its Connector components. The default HTTP/1.1 connector maintains a pool of request processing threads (default 200 max) that handle incoming HTTP requests. When a request arrives, Tomcat checks out a thread from the pool, uses it to process the request (parse HTTP, invoke servlet, render response), then returns the thread to the pool. Without pooling, Tomcat would need to create/destroy thousands of threads per second under load—creating 1000 threads/sec would consume ~1GB/sec in stack allocation alone. The pool enables Tomcat to handle 10,000+ requests/sec with just 200 threads, reusing each thread ~50 times per second. Pattern composition: Thread Pool + Work Queue (LinkedBlockingQueue) + Connection Pool (database) + Keep-Alive (HTTP connections). Configuration tuning is critical: too few threads cause request queuing; too many cause context switching overhead. Tomcat also pools database connections via JNDI DataSource, typically using HikariCP or Commons DBCP. Impact: Thread pooling enables single Tomcat instance to serve 100k+ req/min; reduced memory footprint by 90% vs thread-per-request; connection pooling reduced database handshake overhead from 50ms to <1ms.",
      source: "https://tomcat.apache.org/tomcat-9.0-doc/config/executor.html",
    },
    {
      systemId: "redis-clients",
      systemName: "Redis Client Libraries",
      howUsed:
        "Redis clients (redis-py, Jedis, ioredis) implement connection pooling to avoid TCP handshake overhead on every command. Redis operates on single-threaded event loop, so connection creation blocks the server briefly—with 1000 clients creating new connections simultaneously, Redis can lock up for seconds. Connection pools maintain persistent TCP connections with keep-alive enabled. A typical web application might make 50 Redis calls per HTTP request; without pooling, that's 50 * 3-way handshakes * 1ms = 150ms overhead per request. With a pool of 10 connections shared across 100 request threads, handshake cost amortizes to near-zero. Pattern composition: Connection Pool + Lazy Initialization (create on first use) + Health Checks (ping before use) + Exponential Backoff (reconnection). Pool sizing is critical: Redis recommends pool size ≈ number of concurrent threads/workers. Too small causes queuing; too large wastes memory (each connection ~10KB). Redis Cluster adds complexity: clients must maintain separate pools per shard. Impact: Connection pooling reduced P99 latency from 200ms to 5ms in high-throughput applications; eliminated connection storms that previously caused Redis CPU spikes; enabled single Redis instance to serve 100k+ ops/sec from 1000+ client threads.",
      source: "https://redis.io/docs/manual/patterns/connection-pool/",
    },
    {
      systemId: "aws-sdk",
      systemName: "AWS SDK Client Pools",
      howUsed:
        "AWS SDKs (Java, Python, JavaScript) use connection pooling for HTTP clients that communicate with AWS APIs. Each SDK maintains a pool of HTTP connections with keep-alive enabled to avoid TLS handshake overhead (TLS handshake requires 4-7 round-trips, adding 200-500ms). For applications making thousands of AWS API calls (S3 uploads, DynamoDB queries, SQS polling), pooling is critical. AWS Java SDK v2 uses Apache HttpClient with connection pooling configured via maxConnections (default 50) and connectionTimeout. Python boto3 uses urllib3's PoolManager. Pattern composition: Connection Pool + Retry with Exponential Backoff + Circuit Breaker (for throttling) + Request Signing (AWS Signature V4). Without pooling, a Lambda function making 10 S3 calls would spend 2-5 seconds just in TLS handshakes; with pooling, handshake cost is paid once per cold start. AWS recommends: pool size = expected concurrent requests * 1.5. For serverless (Lambda), pool management is tricky due to container freeze/thaw—connections may become stale between invocations. Impact: Connection pooling reduced Lambda cold start overhead by 80%; S3 bulk upload throughput increased from 100 obj/sec to 1000 obj/sec; eliminated TLS handshake bottleneck that was capping API throughput.",
      source:
        "https://aws.amazon.com/blogs/developer/tuning-the-aws-java-sdk-2-x-to-reduce-startup-time/",
    },
    {
      systemId: "java-servlet-containers",
      systemName: "Java Servlet Containers (Jetty, Tomcat)",
      howUsed:
        "All major Java servlet containers use thread pooling to handle HTTP requests efficiently. Jetty's QueuedThreadPool maintains a pool of worker threads that process requests from a queue. When idle requests drop below minThreads, excess workers terminate; when load spikes, pool grows up to maxThreads. This elasticity prevents over-provisioning while handling bursts. The pool uses a SynchronousQueue by default (no buffering—caller blocks if pool exhausted), providing natural backpressure. Pattern composition: Thread Pool + Bounded Queue + Graceful Degradation (reject when full) + JMX Monitoring. Servlet containers also pool database connections via JNDI, SocketChannel objects for NIO connectors, and byte buffers for I/O. Thread pool sizing follows Little's Law: threads = throughput * latency. For API serving 1000 req/sec with 50ms avg latency: 1000 * 0.05 = 50 threads. Over-provisioning (500 threads) wastes memory and increases context switching; under-provisioning (10 threads) causes request queuing. Modern containers use virtual threads (Java 21+) to eliminate pooling complexity for I/O-bound workloads. Impact: Thread pooling enables single JVM to handle 10k concurrent connections; reduced context switching overhead by 75% vs thread-per-request; predictable performance under load (request latency stays flat up to capacity).",
      source:
        "https://www.eclipse.org/jetty/documentation/current/high-load.html",
    },
    {
      systemId: "nodejs-worker-threads",
      systemName: "Node.js Worker Thread Pools",
      howUsed:
        "Node.js uses worker thread pooling for CPU-intensive tasks that would block the event loop. The worker_threads module provides a pool of worker threads (default: number of CPU cores) that execute JavaScript in parallel. Main thread submits tasks to the pool via postMessage; workers execute tasks and return results. Without pooling, creating a new Worker for each task would be prohibitively expensive—Worker startup is ~50ms (load V8 isolate, initialize context). For image processing service handling 100 req/sec, that's 5 seconds of CPU just creating workers. With a pool of 4 workers (one per core), each worker processes ~25 tasks/sec with zero creation overhead. Pattern composition: Worker Pool + Task Queue + Message Passing (postMessage) + SharedArrayBuffer (for zero-copy data transfer). Libraries like Piscina and workerpool provide production-ready implementations with task priority, timeouts, and backpressure. Pool sizing: one worker per CPU core for CPU-bound tasks; more workers acceptable for I/O-bound tasks within workers. Impact: Worker pooling enabled Node.js to handle CPU-intensive image processing at 1000 img/sec (vs 20 img/sec single-threaded); reduced worker creation overhead from 5000ms/sec to 0ms/sec; maintained event loop responsiveness (<10ms) during heavy computation.",
      source: "https://nodejs.org/api/worker_threads.html",
    },
  ],

  philosophy: {
    coreProblem:
      "Repeatedly creating and destroying expensive objects wastes CPU time and memory, causing allocation overhead and garbage collection pressure",
    designPrinciple:
      "Amortize object creation cost across many uses by pre-allocating a pool and reusing instances",
    historicalContext:
      "Object pooling emerged in early systems programming (1960s-70s) where memory allocation was expensive and unpredictable. Database connection pooling became standard in 1990s client-server applications when network connection overhead dominated request processing. Thread pooling was popularized by Java's Executor framework (2004) and web servers like Apache/Tomcat. Modern interest driven by: (1) garbage collection pause time concerns in latency-sensitive systems, (2) serverless computing where cold start time matters, (3) high-throughput systems where allocation overhead becomes bottleneck at 100k+ ops/sec.",
    alternativesRejected: [
      "Create on demand - Simple but pays full creation cost every time, unacceptable for hot paths",
      "Singleton - Eliminates pooling complexity but forces shared mutable state and thread safety concerns",
      "Lazy initialization - Defers cost but doesn't eliminate it; still pays creation overhead",
      "Infinite pool - No limits prevents resource exhaustion protection; risks OOM under load",
    ],
    mentalModel:
      "Like a bike-sharing system: instead of manufacturing a new bike for every trip (expensive, wasteful), maintain a fleet of bikes that users check out and return. The fleet has a maximum size (resource limit), bikes are inspected between uses (validation), and broken bikes are removed and replaced (health checks). Users experience near-instant availability (checkout) vs. waiting months for manufacturing (creation).",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Object Pool"
        A[Available Pool]
        U[In-Use Pool]
        F[Factory]
        V[Validator]
    end

    C[Client] -->|checkout| A
    A -->|validate| V
    V -->|ok| U
    V -->|failed| F
    U -->|return| V
    V -->|reset| A
    F -->|create| A

    style A fill:#90EE90
    style U fill:#FFB6C1
    style V fill:#87CEEB`,
    realWorldAnalogy:
      "Object pooling is like a car rental service. Instead of buying a car every time you need one (expensive, slow), you rent from a fleet that's already available. The rental company maintains the cars between uses (reset state), inspects them for damage (validation), and limits the fleet size to control costs (resource limits). During peak season, you might wait for availability (pool exhaustion), but overall it's far cheaper and faster than buying new cars for each trip.",
    useCases: [
      {
        domain: "Database Applications",
        scenario:
          "Web application makes 100 database queries per HTTP request. Creating new connection requires TCP handshake + TLS negotiation + authentication, taking 50-200ms. With 1000 req/sec, that's 100k connections/sec—impossible without pooling.",
        patternRole:
          "Connection pool maintains 50 persistent connections with keep-alive, reused across millions of queries. Reduces connection overhead from 100ms to <1ms per query.",
        companies: ["Uber", "Airbnb", "Twitter"],
      },
      {
        domain: "Game Development",
        scenario:
          "Multiplayer game spawns/destroys thousands of projectiles, particles, and enemies per second. Each GameObject allocation triggers garbage collection, causing frame drops and stuttering.",
        patternRole:
          "Object pools for bullets, particles, enemies pre-allocate 1000s of instances at startup. Activate/deactivate instead of create/destroy. Eliminates GC pauses, maintaining 60 FPS.",
        companies: ["Unity", "Unreal Engine", "Blizzard"],
      },
      {
        domain: "Message Processing",
        scenario:
          "Message broker (Kafka, RabbitMQ) processes 100k messages/sec. Each message requires buffer allocation for serialization/deserialization. Allocating 1MB buffer 100k times/sec = 100GB/sec allocation rate, triggering constant GC.",
        patternRole:
          "Buffer pool maintains 100 reusable 1MB buffers. Reduces allocation from 100GB/sec to near-zero, eliminating GC pressure and improving throughput by 10x.",
        companies: ["LinkedIn", "Netflix", "Spotify"],
      },
      {
        domain: "HTTP Microservices",
        scenario:
          "Microservice makes 20 downstream API calls per request. Each call requires HTTP client with connection pool, request/response buffers, and parser objects. Creating from scratch adds 10-50ms overhead per call.",
        patternRole:
          "HTTP client pool, buffer pool, parser pool enable sub-millisecond overhead per call. Service maintains 99th percentile latency <100ms despite 20 network hops.",
        companies: ["Google", "Amazon", "Microsoft"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "resource-management",
    "memory-optimization",
    "pooling",
    "lifecycle-management",
    "concurrency",
  ],
  difficulty: "intermediate",
};
