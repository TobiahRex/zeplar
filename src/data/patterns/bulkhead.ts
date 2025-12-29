import type { Pattern } from "../schema";

export const bulkhead: Pattern = {
  id: "bulkhead",
  slug: "bulkhead",
  corpusPath: "🛡️ RELIABILITY → 💔 Fault Tolerance → 🧱 Bulkheads",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Bulkheads",
    level: 4,
  },

  concept: {
    name: "Bulkhead",
    emoji: "🧱",
    tagline: "Isolate failures to contain the blast radius",
    definition:
      "The Bulkhead pattern isolates system components by partitioning resources—threads, connections, memory, CPU quotas—into separate pools, preventing failures in one area from consuming all available capacity and cascading to unrelated functionality. Named after the watertight compartments in ship hulls that prevent a single breach from sinking the entire vessel, bulkheads create isolated failure domains within applications. Each critical dependency or service boundary receives its own dedicated resource pool with enforced limits. When one dependency becomes slow, unresponsive, or fails completely, it can only exhaust its allocated pool—other services continue operating with their reserved resources. This isolation transforms potentially catastrophic system-wide failures into contained, localized degradation. The pattern operates through resource allocation strategies: thread pool isolation assigns dedicated thread pools per dependency; connection pool isolation limits database or HTTP connections per service; semaphore-based isolation controls concurrent access through permit-based gates. When a pool reaches capacity, new requests are either queued (with bounded wait times) or rejected immediately, preventing resource starvation. Bulkheads enable graceful degradation under partial failure, ensure critical paths maintain availability even when non-critical features fail, and provide clear resource consumption boundaries for monitoring and capacity planning.",
    problemSolved:
      "In systems where all operations share a global resource pool, a single slow or failing dependency can trigger complete system failure. Consider a web application with a shared thread pool serving requests to payment processing, product catalog, user authentication, and reporting services. If the reporting service starts executing slow database queries (perhaps due to a missing index or sudden load spike), threads become blocked waiting for responses. As more requests arrive, additional threads are consumed by the slow reporting service until the entire pool is exhausted. Now payment processing, catalog browsing, and authentication—completely unrelated to reporting—all fail because no threads are available to handle their requests. This cascading resource exhaustion creates tight coupling between unrelated components, violates the principle of fault isolation, and makes the entire system as fragile as its weakest dependency. Bulkheads solve this by partitioning resources: allocating 5 threads exclusively to reporting, 20 to the product catalog, 10 to payments, and 10 to authentication. When reporting degrades, it can only consume its 5 dedicated threads—the other 40 threads continue serving critical functionality. This isolation prevents noisy neighbor problems, ensures critical paths have guaranteed capacity, and enables independent scaling of resource pools based on actual usage patterns.",
    tradeoffs: {
      pros: [
        "Contains failures to isolated compartments",
        "Ensures critical paths have dedicated resources",
        "Prevents noisy neighbor problems",
        "Enables graceful degradation of non-critical features",
      ],
      cons: [
        "Reduces overall resource efficiency (dedicated pools may be underutilized)",
        "Adds complexity in resource management",
        "Requires careful sizing of each compartment",
        "Can mask underlying issues if not monitored",
      ],
    },
    relatedPatterns: ["circuit-breaker", "timeout", "rate-limiting", "queue"],
  },

  structure: {
    participants: [
      {
        name: "Bulkhead",
        role: "Resource Isolator",
        responsibilities: [
          "Maintain separate resource pools per dependency",
          "Enforce limits on concurrent access",
          "Reject requests when pool is exhausted",
        ],
      },
      {
        name: "Resource Pool",
        role: "Isolated Compartment",
        responsibilities: [
          "Manage a fixed set of resources (threads, connections)",
          "Track available and in-use resources",
          "Queue or reject when at capacity",
        ],
      },
      {
        name: "Client",
        role: "Consumer",
        responsibilities: [
          "Request resources from appropriate pool",
          "Handle rejection gracefully",
          "Release resources when done",
        ],
      },
    ],
    diagram: `flowchart LR
    subgraph Client
        R1[Request A]
        R2[Request B]
        R3[Request C]
    end

    subgraph Bulkheads
        P1[Pool: Service A<br/>3/5 threads]
        P2[Pool: Service B<br/>2/3 threads]
        P3[Pool: Database<br/>8/10 connections]
    end

    R1 --> P1
    R2 --> P2
    R3 --> P3`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request Resource",
        description: "Client requests a resource for a specific dependency",
      },
      {
        step: 2,
        actor: "Bulkhead",
        action: "Check Pool",
        description: "Check if resources are available in the isolated pool",
      },
      {
        step: 3,
        actor: "Bulkhead",
        action: "Allocate or Reject",
        description:
          "Grant resource if available, reject or queue if exhausted",
      },
      {
        step: 4,
        actor: "Client",
        action: "Use Resource",
        description: "Execute operation using the allocated resource",
      },
      {
        step: 5,
        actor: "Client",
        action: "Release",
        description: "Return resource to the pool when done",
      },
    ],
    invariants: [
      "Each pool has a fixed maximum size",
      "Resources are only borrowed, never shared across pools",
      "Pool exhaustion does not affect other pools",
      "Released resources return to their original pool",
    ],
  },

  codeExamples: [
    {
      id: "bulkhead-typescript",
      language: "typescript",
      title: "Semaphore-based Bulkhead",
      description: "A simple bulkhead using semaphores to limit concurrency",
      code: `class Bulkhead {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(private maxConcurrent: number) {
    this.permits = maxConcurrent;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  private release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

// Usage: separate bulkheads per dependency
const paymentBulkhead = new Bulkhead(5);
const inventoryBulkhead = new Bulkhead(10);

// Payment issues won't exhaust inventory capacity
await paymentBulkhead.execute(() => paymentService.charge(order));
await inventoryBulkhead.execute(() => inventoryService.reserve(items));`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope: "A reusable bulkhead class that limits concurrent executions",
        prerequisites: ["Promises", "Async/await", "Semaphores"],
        systemPosition: "Wraps calls to external services in service layer",
      },
      annotations: [
        {
          id: "bulkhead-permits",
          lines: [2, 2],
          action: "Track available permits (slots)",
          reason:
            "Permits represent the current capacity; when zero, new requests must wait",
          contextLevel: "local",
        },
        {
          id: "bulkhead-acquire",
          lines: [14, 23],
          action: "Acquire a permit before executing",
          reason:
            "If permits available, proceed immediately; otherwise queue the request",
          contextLevel: "local",
          relatedConcepts: ["semaphore"],
        },
        {
          id: "bulkhead-release",
          lines: [25, 32],
          action: "Release permit and wake waiting requests",
          reason:
            "Ensures resources are returned and queued requests can proceed",
          contextLevel: "local",
        },
        {
          id: "bulkhead-usage",
          lines: [36, 37],
          action: "Create separate bulkheads per dependency",
          reason:
            "Isolation means payment failures cannot consume inventory capacity",
          contextLevel: "system",
          relatedConcepts: ["fault-isolation"],
        },
      ],
      highlights: [
        {
          lines: [14, 32],
          label: "Semaphore-style acquire/release",
          sbvpDomain: "behavior",
        },
        {
          lines: [36, 41],
          label: "Isolated pools per service",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "bulkhead-thread-pool",
      language: "typescript",
      title: "Thread Pool Bulkhead with Per-Service Isolation",
      description:
        "Production-grade bulkhead using dedicated worker pools per external dependency",
      code: `interface WorkerPoolConfig {
  name: string;
  maxWorkers: number;
  queueSize: number;
  timeout: number;
}

class WorkerPool {
  private activeWorkers = 0;
  private queue: Array<{
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(private config: WorkerPoolConfig) {}

  async execute<T>(task: () => Promise<T>): Promise<T> {
    // Fast path: worker available, execute immediately
    if (this.activeWorkers < this.config.maxWorkers) {
      this.activeWorkers++;
      try {
        const result = await this.executeWithTimeout(task);
        return result;
      } finally {
        this.activeWorkers--;
        this.processQueue();
      }
    }

    // Slow path: queue is full, reject immediately (fail-fast)
    if (this.queue.length >= this.config.queueSize) {
      throw new BulkheadRejectedException(
        \`\${this.config.name} bulkhead exhausted (queue: \${this.queue.length})\`
      );
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as () => Promise<any>,
        resolve,
        reject,
      });
    });
  }

  private async executeWithTimeout<T>(task: () => Promise<T>): Promise<T> {
    return Promise.race([
      task(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new TimeoutError('Task timeout')),
          this.config.timeout
        )
      ),
    ]);
  }

  private processQueue(): void {
    if (this.queue.length === 0 || this.activeWorkers >= this.config.maxWorkers) {
      return;
    }

    const item = this.queue.shift()!;
    this.activeWorkers++;

    this.executeWithTimeout(item.task)
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        this.activeWorkers--;
        this.processQueue();
      });
  }

  getMetrics() {
    return {
      activeWorkers: this.activeWorkers,
      queuedTasks: this.queue.length,
      utilization: this.activeWorkers / this.config.maxWorkers,
    };
  }
}

class BulkheadRejectedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkheadRejectedException';
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Isolation: separate pools for each external dependency
const paymentPool = new WorkerPool({
  name: 'PaymentService',
  maxWorkers: 5,
  queueSize: 10,
  timeout: 3000,
});

const inventoryPool = new WorkerPool({
  name: 'InventoryService',
  maxWorkers: 10,
  queueSize: 20,
  timeout: 5000,
});

const emailPool = new WorkerPool({
  name: 'EmailService',
  maxWorkers: 2,
  queueSize: 50,
  timeout: 10000,
});

// Usage: payment failures cannot affect inventory operations
async function processOrder(order: Order) {
  try {
    // Each operation uses its isolated pool
    const paymentResult = await paymentPool.execute(() =>
      paymentService.charge(order.total)
    );

    const inventoryResult = await inventoryPool.execute(() =>
      inventoryService.reserve(order.items)
    );

    // Low-priority email uses small pool, won't block critical paths
    await emailPool.execute(() =>
      emailService.sendConfirmation(order.email, paymentResult)
    );

    return { success: true, paymentResult, inventoryResult };
  } catch (error) {
    if (error instanceof BulkheadRejectedException) {
      // Pool exhausted: log and return degraded response
      logger.warn('Bulkhead rejection', { error });
      return { success: false, reason: 'service_overloaded' };
    }
    throw error;
  }
}

interface Order {
  total: number;
  items: any[];
  email: string;
}`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Production bulkhead implementation with per-service thread pools, queuing, and metrics",
        prerequisites: [
          "Worker pools",
          "Promise queuing",
          "Resource isolation patterns",
          "Graceful degradation",
        ],
        systemPosition:
          "Service layer isolating critical paths (payment, inventory) from non-critical services (email)",
      },
      annotations: [
        {
          id: "bulkhead-fast-path",
          lines: [12, 19],
          action: "Fast path: execute immediately if workers available",
          reason:
            "Avoid queuing overhead when resources are available; most requests should hit this path under normal load",
          contextLevel: "local",
          relatedConcepts: ["fast-path-optimization"],
        },
        {
          id: "bulkhead-reject",
          lines: [22, 27],
          action: "Reject immediately when queue is full (fail-fast)",
          reason:
            "Bounded queues prevent unbounded memory growth and provide backpressure signal to callers; fail-fast is better than slow degradation",
          contextLevel: "module",
          relatedConcepts: ["backpressure", "bounded-queues"],
        },
        {
          id: "bulkhead-isolation",
          lines: [67, 81],
          action: "Create separate worker pools for each external dependency",
          reason:
            "Isolation means slow payment service (5 workers blocked) cannot affect inventory service (10 workers available)",
          contextLevel: "system",
          relatedConcepts: ["fault-isolation", "resource-partitioning"],
        },
        {
          id: "bulkhead-priority",
          lines: [75, 81],
          action: "Allocate pool sizes based on criticality and expected load",
          reason:
            "Critical paths (payment, inventory) get larger pools; non-critical (email) gets minimal resources to prevent blocking",
          contextLevel: "system",
          relatedConcepts: ["resource-allocation", "priority-queuing"],
        },
      ],
      highlights: [
        {
          lines: [12, 35],
          label: "Fast path and queue management",
          sbvpDomain: "behavior",
        },
        {
          lines: [67, 81],
          label: "Per-service pool isolation",
          sbvpDomain: "structure",
        },
        {
          lines: [96, 107],
          label: "Usage with graceful degradation",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "bulkhead-java-executor",
      language: "java",
      title: "Bulkhead with Java ThreadPoolExecutor",
      description:
        "Production Java implementation using bounded thread pools with rejection policies",
      code: `import java.util.concurrent.*;
import java.util.HashMap;
import java.util.Map;

public class BulkheadManager {
    private final Map<String, ThreadPoolExecutor> bulkheads = new HashMap<>();

    /**
     * Creates isolated bulkheads for different services.
     * Each bulkhead has its own thread pool and queue.
     */
    public BulkheadManager() {
        // Critical payment service: small pool, fail fast
        bulkheads.put("payment", createBulkhead(
            5,      // core threads
            5,      // max threads (no scaling)
            10,     // queue size (bounded)
            "PaymentBulkhead",
            new ThreadPoolExecutor.AbortPolicy() // reject when full
        ));

        // High-volume inventory service: larger pool
        bulkheads.put("inventory", createBulkhead(
            10,     // core threads
            20,     // max threads (can scale under load)
            50,     // larger queue
            "InventoryBulkhead",
            new ThreadPoolExecutor.CallerRunsPolicy() // backpressure
        ));

        // Non-critical analytics: minimal resources
        bulkheads.put("analytics", createBulkhead(
            2,      // minimal threads
            2,      // no scaling
            100,    // large queue (batch processing)
            "AnalyticsBulkhead",
            new ThreadPoolExecutor.DiscardOldestPolicy() // shed load
        ));
    }

    private ThreadPoolExecutor createBulkhead(
        int corePoolSize,
        int maxPoolSize,
        int queueSize,
        String name,
        RejectedExecutionHandler rejectionPolicy
    ) {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(queueSize),
            new NamedThreadFactory(name),
            rejectionPolicy
        );

        // Prestart core threads for predictable performance
        executor.prestartAllCoreThreads();

        return executor;
    }

    /**
     * Execute task in isolated bulkhead for the given service.
     * If bulkhead is exhausted, task is rejected per configured policy.
     */
    public <T> Future<T> execute(String service, Callable<T> task) {
        ThreadPoolExecutor bulkhead = bulkheads.get(service);
        if (bulkhead == null) {
            throw new IllegalArgumentException("Unknown service: " + service);
        }

        try {
            return bulkhead.submit(task);
        } catch (RejectedExecutionException e) {
            // Bulkhead exhausted - handle gracefully
            throw new BulkheadExhaustedException(
                String.format("%s bulkhead exhausted (active: %d, queue: %d)",
                    service,
                    bulkhead.getActiveCount(),
                    bulkhead.getQueue().size()),
                e
            );
        }
    }

    /**
     * Get metrics for monitoring and alerting
     */
    public BulkheadMetrics getMetrics(String service) {
        ThreadPoolExecutor bulkhead = bulkheads.get(service);
        return new BulkheadMetrics(
            service,
            bulkhead.getActiveCount(),
            bulkhead.getQueue().size(),
            bulkhead.getCompletedTaskCount(),
            (double) bulkhead.getActiveCount() / bulkhead.getMaximumPoolSize()
        );
    }

    public void shutdown() {
        bulkheads.values().forEach(ThreadPoolExecutor::shutdown);
    }
}

// Usage example: isolation in action
public class OrderService {
    private final BulkheadManager bulkheads = new BulkheadManager();

    public OrderResult processOrder(Order order) {
        try {
            // Critical operations use isolated pools
            Future<PaymentResult> payment = bulkheads.execute("payment",
                () -> paymentClient.charge(order.getTotal())
            );

            Future<InventoryResult> inventory = bulkheads.execute("inventory",
                () -> inventoryClient.reserve(order.getItems())
            );

            // Non-critical analytics uses separate pool (won't block above)
            bulkheads.execute("analytics",
                () -> analyticsClient.trackOrder(order)
            );

            // Wait for critical operations only
            PaymentResult paymentResult = payment.get(3, TimeUnit.SECONDS);
            InventoryResult inventoryResult = inventory.get(5, TimeUnit.SECONDS);

            return OrderResult.success(paymentResult, inventoryResult);

        } catch (BulkheadExhaustedException e) {
            logger.warn("Bulkhead exhausted: {}", e.getMessage());
            return OrderResult.rejected("Service overloaded, try again later");
        } catch (TimeoutException e) {
            logger.error("Operation timeout: {}", e.getMessage());
            return OrderResult.failed("Request timeout");
        } catch (Exception e) {
            logger.error("Order processing failed", e);
            return OrderResult.failed(e.getMessage());
        }
    }
}

class NamedThreadFactory implements ThreadFactory {
    private final String prefix;
    private int counter = 0;

    public NamedThreadFactory(String prefix) {
        this.prefix = prefix;
    }

    @Override
    public Thread newThread(Runnable r) {
        Thread thread = new Thread(r);
        thread.setName(prefix + "-" + counter++);
        return thread;
    }
}

class BulkheadExhaustedException extends RuntimeException {
    public BulkheadExhaustedException(String message, Throwable cause) {
        super(message, cause);
    }
}

record BulkheadMetrics(
    String service,
    int activeThreads,
    int queueSize,
    long completedTasks,
    double utilization
) {}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise-grade bulkhead using Java's ThreadPoolExecutor with different rejection policies per service criticality",
        prerequisites: [
          "Java Executors framework",
          "Concurrency primitives",
          "Thread pool tuning",
          "Rejection policies",
        ],
        systemPosition:
          "Service layer in high-throughput e-commerce system isolating payment, inventory, and analytics services",
      },
      annotations: [
        {
          id: "bulkhead-java-rejection-policies",
          lines: [11, 28],
          action:
            "Use different rejection policies based on service criticality",
          reason:
            "Critical services (payment) use AbortPolicy to fail-fast; high-volume services (inventory) use CallerRunsPolicy for backpressure; non-critical (analytics) use DiscardOldestPolicy to shed load",
          contextLevel: "system",
          relatedConcepts: [
            "rejection-policies",
            "backpressure",
            "load-shedding",
          ],
        },
        {
          id: "bulkhead-java-bounded-queue",
          lines: [42, 44],
          action: "Use bounded ArrayBlockingQueue to prevent unbounded growth",
          reason:
            "Bounded queues provide memory safety and clear capacity limits; when queue fills, rejection policy determines behavior",
          contextLevel: "module",
          relatedConcepts: ["bounded-queues", "memory-safety"],
        },
        {
          id: "bulkhead-java-prestart",
          lines: [49, 50],
          action: "Prestart core threads for predictable latency",
          reason:
            "Thread creation has overhead; prestarting ensures first requests don't pay thread initialization cost",
          contextLevel: "local",
          relatedConcepts: ["performance-optimization", "cold-start"],
        },
        {
          id: "bulkhead-java-metrics",
          lines: [76, 86],
          action:
            "Expose metrics for active threads, queue size, and utilization",
          reason:
            "Monitoring bulkhead utilization is critical for capacity planning and detecting resource exhaustion before failures",
          contextLevel: "system",
          relatedConcepts: ["observability", "capacity-planning"],
        },
      ],
      highlights: [
        {
          lines: [11, 33],
          label: "Per-service bulkhead configuration with rejection policies",
          sbvpDomain: "structure",
        },
        {
          lines: [56, 73],
          label: "Graceful rejection handling with context",
          sbvpDomain: "behavior",
        },
        {
          lines: [76, 86],
          label: "Metrics exposure for observability",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Service Layer",
      "HTTP Client",
      "Database Connection Pool",
      "Thread Pool Executor",
    ],
    interactsWith: ["circuit-breaker", "timeout", "retry", "rate-limiting"],
    architecturalBoundaries: [
      "Per-dependency thread pools",
      "Per-tenant resource quotas",
      "Per-service connection limits",
    ],
  },

  implementations: [
    {
      id: "resilience4j-bulkhead",
      name: "Resilience4j Bulkhead",
      type: "library",
      languages: ["java", "kotlin"],
      description: "Semaphore and thread pool bulkhead implementations",
      links: {
        docs: "https://resilience4j.readme.io/docs/bulkhead",
        github: "https://github.com/resilience4j/resilience4j",
      },
    },
    {
      id: "polly-bulkhead",
      name: "Polly Bulkhead",
      type: "library",
      languages: ["csharp"],
      description: ".NET bulkhead policy for isolation",
      links: {
        docs: "https://github.com/App-vNext/Polly/wiki/Bulkhead",
        github: "https://github.com/App-vNext/Polly",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix",
      systemName: "Netflix",
      howUsed:
        "Hystrix used thread pool isolation to prevent failures in one service from affecting others",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "aws",
      systemName: "AWS",
      howUsed:
        "Lambda uses concurrency limits per function to isolate workloads",
    },
  ],

  philosophy: {
    coreProblem:
      "Shared resource pools create coupling where one failure can cascade to exhaust all resources",
    designPrinciple:
      "Partition resources so that failures are contained within boundaries, like watertight compartments in a ship",
    historicalContext:
      "Named after ship bulkheads—watertight walls that prevent a hull breach from sinking the entire vessel",
    alternativesRejected: [
      "Shared pools - efficient but vulnerable to cascading failures",
      "Unlimited resources - expensive and can lead to runaway resource consumption",
      "Static allocation - inflexible to changing workloads",
    ],
    mentalModel:
      "Like watertight compartments in a ship: if one floods, the others stay dry and the ship stays afloat",
  },

  visualization: {
    staticDiagram: `flowchart TB
    subgraph Ship
        C1[Compartment 1<br/>FLOODED]
        C2[Compartment 2<br/>OK]
        C3[Compartment 3<br/>OK]
    end
    style C1 fill:#f38ba8`,
    realWorldAnalogy:
      "Bulkheads are like the watertight compartments in a ship. If the hull is breached and one compartment floods, the bulkhead walls prevent water from spreading to other compartments, keeping the ship afloat.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "The payment service becomes slow. With bulkheads, only the 5 threads allocated to payments are blocked—the 20 threads for product catalog continue serving requests.",
        patternRole: "Prevents slow payments from affecting product browsing",
        companies: ["Amazon", "Shopify"],
      },
      {
        domain: "Cloud",
        scenario:
          "A noisy tenant runs expensive queries. With per-tenant connection pools, they only exhaust their own quota while other tenants continue normally.",
        patternRole: "Enables fair multi-tenant resource sharing",
        companies: ["AWS", "Azure", "Salesforce"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "isolation",
    "resource-management",
    "resilience",
  ],
  difficulty: "intermediate",
};
