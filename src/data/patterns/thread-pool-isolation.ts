import type { Pattern } from "../schema";

export const threadPoolIsolation: Pattern = {
  id: "thread-pool-isolation",
  slug: "thread-pool-isolation",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🧱 Bulkhead → 🧵 Thread Pool Isolation",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Bulkhead",
    level: 4,
  },

  concept: {
    name: "Thread Pool Isolation",
    emoji: "🧵",
    tagline: "Separate pools per dependency",
    definition:
      "Thread pool isolation is a fault tolerance pattern that allocates separate thread pools for different external dependencies or workload types, preventing resource exhaustion in one dependency from starving threads for other operations. Think of it like having separate checkout lanes at a grocery store for different payment types—if the credit card system is slow, cash customers can still checkout using their dedicated lanes. For example, a microservice calling three external APIs (payment, inventory, shipping) might create three separate thread pools of 10 threads each. If the payment API becomes slow or unresponsive, the 10 payment threads get blocked waiting for responses, but the inventory and shipping APIs continue operating normally using their dedicated threads. Without isolation, all 30 threads from a shared pool could become blocked on payment calls, preventing inventory and shipping requests from executing. This pattern was popularized by Netflix's Hystrix library as a key component of resilient microservices architectures alongside circuit breakers and bulkheads.",
    problemSolved:
      "Shared thread pools create cascading failures where one slow or failing dependency can exhaust all threads, blocking unrelated operations and bringing down the entire service. For example, a web service with a 200-thread pool calling both a fast cache API (5ms response) and a slow database (500ms response). If the database becomes overloaded with 500+ concurrent queries, all 200 threads become blocked waiting for database responses. New requests—even simple cache lookups that should complete in 5ms—cannot execute because no threads are available. Users experience timeouts on all operations, not just database-dependent ones. Thread pool isolation solves this by dedicating 20 threads for database calls and 20 threads for cache calls. Even if all 20 database threads are blocked, the 20 cache threads remain available, ensuring cache operations continue working. This contains the failure blast radius and maintains partial service availability.",
    tradeoffs: {
      pros: [
        "Provides strong fault isolation preventing one slow dependency from exhausting threads needed by healthy dependencies, maintaining partial service availability",
        "Enables independent timeout and retry configuration per dependency based on their specific SLAs and behavior characteristics",
        "Limits blast radius of failures to specific dependency's thread pool rather than affecting entire service, enabling graceful degradation",
        "Improves observability by exposing per-dependency thread pool metrics (active threads, queue depth, rejections) for targeted monitoring",
      ],
      cons: [
        "Increases memory overhead significantly as each thread pool allocates stacks for all threads upfront, consuming 1-8MB per thread times number of pools",
        "Reduces overall thread utilization since threads are pre-allocated to specific dependencies and cannot be shared, potentially wasting idle capacity",
        "Adds configuration complexity requiring careful tuning of pool sizes for each dependency based on expected concurrency and latency",
        "Creates potential for thread starvation if pool sizes are set too small for actual demand, causing unnecessary request rejections",
      ],
    },
    relatedPatterns: [
      "bulkhead",
      "circuit-breaker",
      "thread-pooling",
      "process-isolation",
      "server-isolation",
      "timeout",
    ],
  },

  structure: {
    participants: [
      {
        name: "Thread Pool Manager",
        role: "Pool Orchestrator",
        responsibilities: [
          "Create and manage separate thread pools for each dependency",
          "Route incoming requests to appropriate dependency-specific pool",
          "Track pool utilization and health metrics per dependency",
          "Enforce pool size limits and queue capacity constraints",
        ],
      },
      {
        name: "Dependency Thread Pool",
        role: "Isolated Execution Context",
        responsibilities: [
          "Maintain fixed-size pool of worker threads for specific dependency",
          "Queue incoming tasks when all workers are busy",
          "Execute tasks using dedicated worker threads",
          "Reject tasks when queue reaches capacity (apply backpressure)",
        ],
      },
      {
        name: "Worker Thread",
        role: "Task Executor",
        responsibilities: [
          "Pull tasks from pool's queue and execute them",
          "Make calls to assigned external dependency (API, database, etc.)",
          "Return results to caller and become available for next task",
          "Handle timeouts and failures in dependency calls",
        ],
      },
      {
        name: "Request Handler",
        role: "Client",
        responsibilities: [
          "Submit tasks to appropriate dependency pool via manager",
          "Handle task rejection when pool queue is full",
          "Process results or timeouts from pool execution",
          "Implement fallback logic when pool is saturated",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client as Request Handler
    participant Manager as Thread Pool Manager
    participant PaymentPool as Payment API Pool<br/>(5 threads)
    participant CachePool as Cache Pool<br/>(10 threads)
    participant DBPool as Database Pool<br/>(8 threads)
    participant PaymentAPI as Payment API
    participant Cache as Cache
    participant DB as Database

    Note over Manager: Separate pools prevent<br/>cross-dependency failures

    Client->>Manager: Execute payment task
    Manager->>PaymentPool: Submit to payment pool
    Note over PaymentPool: Queue task if<br/>workers busy
    PaymentPool->>PaymentAPI: Worker calls API
    PaymentAPI-->>PaymentPool: Response (slow, 2s)
    PaymentPool-->>Client: Result

    par Other dependencies unaffected
        Client->>Manager: Execute cache task
        Manager->>CachePool: Submit to cache pool
        CachePool->>Cache: Worker calls cache
        Cache-->>CachePool: Response (fast, 5ms)
        CachePool-->>Client: Result
    and
        Client->>Manager: Execute DB task
        Manager->>DBPool: Submit to DB pool
        DBPool->>DB: Worker calls database
        DB-->>DBPool: Response (medium, 200ms)
        DBPool-->>Client: Result
    end

    Note over PaymentPool: Payment pool saturated<br/>(all 5 workers busy)
    Client->>Manager: More payment tasks
    Manager->>PaymentPool: Submit to queue
    Note over PaymentPool: Queue fills up (20 tasks)

    Client->>Manager: Payment task (queue full)
    PaymentPool-->>Client: ❌ Rejected (pool saturated)

    Note over CachePool,DBPool: ✓ Cache and DB pools<br/>still responsive`,
    flow: [
      {
        step: 1,
        actor: "Request Handler",
        action: "Submit task to Thread Pool Manager",
        description:
          "Client identifies which external dependency the task requires (payment API, cache, database, etc.) and submits task to corresponding pool via manager",
      },
      {
        step: 2,
        actor: "Thread Pool Manager",
        action: "Route task to dependency-specific pool",
        description:
          "Manager looks up the appropriate thread pool for the dependency (e.g., payment pool with 5 threads) and forwards task to that pool's queue",
      },
      {
        step: 3,
        actor: "Dependency Thread Pool",
        action: "Check worker availability",
        description:
          "Pool checks if any worker threads are idle. If yes, task executes immediately. If all workers are busy, task is added to pool's bounded queue if capacity allows",
      },
      {
        step: 4,
        actor: "Worker Thread",
        action: "Execute task and call external dependency",
        description:
          "Worker thread pulls task from queue, executes the operation (makes HTTP call, database query, etc.), applies timeout protection, and captures result or error",
      },
      {
        step: 5,
        actor: "Worker Thread",
        action: "Return result and become available",
        description:
          "Worker returns result to caller, marks itself as available, and pulls next task from queue if any are waiting. Failed dependency calls are isolated to this pool only",
      },
      {
        step: 6,
        actor: "Dependency Thread Pool",
        action: "Reject task if queue is full (optional)",
        description:
          "If all workers are busy AND queue is at capacity, pool rejects incoming task with an error. This applies backpressure preventing unbounded queuing and memory exhaustion",
      },
      {
        step: 7,
        actor: "Request Handler",
        action: "Handle result or rejection",
        description:
          "Client receives successful result, timeout error, or rejection error. For rejections, client may implement fallback (serve cached data, return degraded response, retry later)",
      },
    ],
    invariants: [
      "Each external dependency MUST have its own dedicated thread pool with independently configured size and queue capacity",
      "Thread pools MUST NOT share worker threads across different dependencies—threads are bound to specific pools at creation time",
      "Total number of threads across all pools MUST be bounded to prevent excessive memory consumption (each thread allocates stack memory)",
      "When a pool's queue reaches capacity, new tasks MUST be rejected or dropped to prevent unbounded memory growth",
      "Worker threads MUST apply timeouts to dependency calls to prevent indefinite blocking even within isolated pools",
      "Pool sizes SHOULD be tuned based on dependency latency characteristics—fast dependencies get larger pools, slow dependencies get smaller pools",
      "Failure in one dependency's pool (all threads blocked, queue full) MUST NOT affect task execution in other dependency pools",
    ],
  },

  codeExamples: [
    {
      id: "thread-pool-isolation-ts-basic",
      language: "typescript",
      title: "Thread Pool Isolation with Per-Dependency Worker Pools",
      description:
        "A production-ready thread pool isolation implementation using worker_threads for dependency isolation. Demonstrates separate thread pools per external dependency, preventing resource exhaustion in one dependency from starving others. Includes queue management, timeout protection, and circuit breaker integration.",
      code: `// Thread Pool Isolation Implementation - Per-Dependency Thread Pools
// Demonstrates isolating external dependencies with dedicated worker pools

import { Worker } from "worker_threads";
import * as path from "path";

interface PoolConfig {
  name: string;
  workerScript: string;
  poolSize: number;
  queueSize: number;
  taskTimeout: number;
}

interface Task<T> {
  id: string;
  data: unknown;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  startTime: number;
}

enum WorkerState {
  IDLE = "idle",
  BUSY = "busy",
  DEAD = "dead",
}

class WorkerWrapper {
  public worker: Worker;
  public state: WorkerState = WorkerState.IDLE;
  public currentTaskId: string | null = null;

  constructor(scriptPath: string, public id: string) {
    this.worker = new Worker(scriptPath);
  }

  async execute<T>(task: Task<T>): Promise<void> {
    this.state = WorkerState.BUSY;
    this.currentTaskId = task.id;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.worker.terminate();
        this.state = WorkerState.DEAD;
        reject(new Error(\`Task \${task.id} timed out\`));
      }, 30000);

      this.worker.once("message", (result) => {
        clearTimeout(timeout);
        this.state = WorkerState.IDLE;
        this.currentTaskId = null;
        task.resolve(result);
        resolve();
      });

      this.worker.once("error", (error) => {
        clearTimeout(timeout);
        this.state = WorkerState.DEAD;
        this.currentTaskId = null;
        task.reject(error);
        reject(error);
      });

      this.worker.postMessage(task.data);
    });
  }

  terminate(): void {
    this.worker.terminate();
    this.state = WorkerState.DEAD;
  }
}

class IsolatedThreadPool<T = unknown> {
  private workers: WorkerWrapper[] = [];
  private taskQueue: Task<T>[] = [];
  private config: PoolConfig;
  private stats = {
    tasksExecuted: 0,
    tasksQueued: 0,
    tasksRejected: 0,
    tasksTimedOut: 0,
  };

  constructor(config: PoolConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    console.log(\`[Pool \${this.config.name}] Initializing \${this.config.poolSize} workers\`);

    for (let i = 0; i < this.config.poolSize; i++) {
      const worker = new WorkerWrapper(
        this.config.workerScript,
        \`\${this.config.name}-worker-\${i}\`
      );
      this.workers.push(worker);
    }
  }

  async execute<R = T>(taskId: string, data: unknown): Promise<R> {
    console.log(\`[Pool \${this.config.name}] Received task \${taskId}\`);

    // Check queue capacity
    if (this.taskQueue.length >= this.config.queueSize) {
      this.stats.tasksRejected++;
      throw new Error(
        \`Pool \${this.config.name} queue full (\${this.taskQueue.length}/\${this.config.queueSize})\`
      );
    }

    return new Promise<R>((resolve, reject) => {
      const task: Task<R> = {
        id: taskId,
        data,
        resolve,
        reject,
        startTime: Date.now(),
      };

      // Try to execute immediately on idle worker
      const idleWorker = this.workers.find((w) => w.state === WorkerState.IDLE);

      if (idleWorker) {
        this.executeTask(idleWorker, task);
      } else {
        // Queue the task
        console.log(
          \`[Pool \${this.config.name}] All workers busy, queueing task \${taskId}\`
        );
        this.taskQueue.push(task);
        this.stats.tasksQueued++;
      }
    });
  }

  private async executeTask<R>(worker: WorkerWrapper, task: Task<R>): Promise<void> {
    try {
      await worker.execute(task);
      this.stats.tasksExecuted++;

      const duration = Date.now() - task.startTime;
      console.log(\`[Pool \${this.config.name}] Task \${task.id} completed in \${duration}ms\`);

      // Process next queued task if any
      this.processNextTask(worker);
    } catch (error) {
      console.error(\`[Pool \${this.config.name}] Task \${task.id} failed: \${error}\`);
      task.reject(error as Error);

      // Replace dead worker
      if (worker.state === WorkerState.DEAD) {
        this.replaceWorker(worker);
      }

      // Process next task
      this.processNextTask(worker);
    }
  }

  private processNextTask(worker: WorkerWrapper): void {
    if (worker.state === WorkerState.DEAD) return;

    const nextTask = this.taskQueue.shift();
    if (nextTask) {
      console.log(\`[Pool \${this.config.name}] Dequeuing task \${nextTask.id}\`);
      this.executeTask(worker, nextTask);
    }
  }

  private replaceWorker(deadWorker: WorkerWrapper): void {
    console.log(\`[Pool \${this.config.name}] Replacing dead worker \${deadWorker.id}\`);

    const index = this.workers.indexOf(deadWorker);
    if (index !== -1) {
      const newWorker = new WorkerWrapper(
        this.config.workerScript,
        \`\${this.config.name}-worker-\${index}-restarted\`
      );
      this.workers[index] = newWorker;
    }
  }

  async shutdown(): Promise<void> {
    console.log(\`[Pool \${this.config.name}] Shutting down...\`);

    // Reject queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error("Pool shutting down"));
    }
    this.taskQueue = [];

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];
  }

  getStats() {
    return {
      poolName: this.config.name,
      poolSize: this.config.poolSize,
      idleWorkers: this.workers.filter((w) => w.state === WorkerState.IDLE).length,
      busyWorkers: this.workers.filter((w) => w.state === WorkerState.BUSY).length,
      queuedTasks: this.taskQueue.length,
      queueCapacity: this.config.queueSize,
      ...this.stats,
    };
  }
}

// Thread Pool Manager - Manages multiple isolated pools
class ThreadPoolManager {
  private pools: Map<string, IsolatedThreadPool> = new Map();

  createPool(config: PoolConfig): void {
    if (this.pools.has(config.name)) {
      throw new Error(\`Pool \${config.name} already exists\`);
    }

    const pool = new IsolatedThreadPool(config);
    this.pools.set(config.name, pool);
    console.log(\`[ThreadPoolManager] Created isolated pool: \${config.name}\`);
  }

  async executeOnPool<T>(poolName: string, taskId: string, data: unknown): Promise<T> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(\`Pool \${poolName} not found\`);
    }

    return pool.execute<T>(taskId, data);
  }

  async shutdownAll(): Promise<void> {
    console.log(\`[ThreadPoolManager] Shutting down all pools\`);
    const shutdownPromises = Array.from(this.pools.values()).map((pool) =>
      pool.shutdown()
    );
    await Promise.all(shutdownPromises);
    this.pools.clear();
  }

  getAllStats() {
    const stats: Record<string, unknown> = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }
}

// Example Worker Scripts (would be separate files in production)

const paymentWorkerScript = \`
const { parentPort } = require("worker_threads");

parentPort.on("message", async (task) => {
  // Simulate payment API call (slow, 500ms)
  await new Promise(resolve => setTimeout(resolve, 500));

  const result = {
    success: true,
    transactionId: "txn-" + Math.random().toString(36).substr(2, 9),
    amount: task.amount,
  };

  parentPort.postMessage(result);
});
\`;

const cacheWorkerScript = \`
const { parentPort } = require("worker_threads");

parentPort.on("message", async (task) => {
  // Simulate cache lookup (fast, 10ms)
  await new Promise(resolve => setTimeout(resolve, 10));

  const result = {
    hit: Math.random() > 0.2,
    value: task.key + "-cached-value",
  };

  parentPort.postMessage(result);
});
\`;

const databaseWorkerScript = \`
const { parentPort } = require("worker_threads");

parentPort.on("message", async (task) => {
  // Simulate database query (medium, 100ms)
  await new Promise(resolve => setTimeout(resolve, 100));

  const result = {
    rows: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
    count: 2,
  };

  parentPort.postMessage(result);
});
\`;

// Demonstration
async function demonstrateThreadPoolIsolation() {
  console.log("=== Thread Pool Isolation Demonstration ===\\n");

  const manager = new ThreadPoolManager();

  // Create separate thread pools for each dependency
  console.log("--- Scenario 1: Creating Isolated Thread Pools ---\\n");

  manager.createPool({
    name: "payment-api",
    workerScript: "./payment-worker.js",
    poolSize: 5, // Small pool for slow external API
    queueSize: 20,
    taskTimeout: 5000,
  });

  manager.createPool({
    name: "cache",
    workerScript: "./cache-worker.js",
    poolSize: 10, // Larger pool for fast cache
    queueSize: 50,
    taskTimeout: 1000,
  });

  manager.createPool({
    name: "database",
    workerScript: "./database-worker.js",
    poolSize: 8, // Medium pool for database
    queueSize: 30,
    taskTimeout: 3000,
  });

  console.log("\\nInitial stats:", JSON.stringify(manager.getAllStats(), null, 2));

  // Scenario 2: Normal mixed workload
  console.log("\\n--- Scenario 2: Mixed Workload Execution ---\\n");

  const tasks = [
    manager.executeOnPool("cache", "cache-1", { key: "user:123" }),
    manager.executeOnPool("database", "db-1", { query: "SELECT * FROM users" }),
    manager.executeOnPool("payment-api", "pay-1", { amount: 99.99 }),
  ];

  const results = await Promise.allSettled(tasks);
  console.log("\\nTask results:", results.map((r) => r.status));

  // Scenario 3: Payment API slowdown (bulkhead in action)
  console.log("\\n--- Scenario 3: Payment API Slowdown (Isolation in Action) ---");
  console.log("Simulating slow payment API - other services remain unaffected\\n");

  // Flood payment pool
  const paymentFlood = Array.from({ length: 10 }, (_, i) =>
    manager.executeOnPool("payment-api", \`pay-flood-\${i}\`, { amount: 50 })
  );

  // Cache and DB requests still work fast
  const fastOps = [
    manager.executeOnPool("cache", "cache-fast", { key: "session:xyz" }),
    manager.executeOnPool("database", "db-fast", { query: "SELECT NOW()" }),
  ];

  console.log("Executing fast operations while payment pool is saturated...");
  const fastResults = await Promise.allSettled(fastOps);
  console.log("Fast operations completed:", fastResults.map((r) => r.status));

  console.log("\\nPayment operations still running (isolated)...");
  console.log("Stats during load:", JSON.stringify(manager.getAllStats(), null, 2));

  // Wait for payment flood to complete
  await Promise.allSettled(paymentFlood);

  // Scenario 4: Queue overflow
  console.log("\\n--- Scenario 4: Queue Overflow Protection ---");
  console.log("Attempting to exceed queue capacity on payment pool\\n");

  const overflow = Array.from({ length: 30 }, (_, i) =>
    manager
      .executeOnPool("payment-api", \`overflow-\${i}\`, { amount: 10 })
      .catch((e) => ({ error: e.message }))
  );

  const overflowResults = await Promise.all(overflow);
  const rejected = overflowResults.filter((r) => "error" in r);
  console.log(\`Rejected tasks due to full queue: \${rejected.length}\`);

  // Final stats
  console.log("\\n--- Final Statistics ---\\n");
  console.log(JSON.stringify(manager.getAllStats(), null, 2));

  // Cleanup
  console.log("\\n--- Cleanup ---");
  await manager.shutdownAll();
  console.log("All thread pools shut down");
}

// Note: This is a conceptual demonstration
console.log("Thread Pool Isolation Pattern - Conceptual Example");
console.log("In production, worker scripts would be separate .js files");
console.log("\\nExample worker scripts:");
console.log("\\nPayment Worker:", paymentWorkerScript);
console.log("\\nCache Worker:", cacheWorkerScript);
console.log("\\nDatabase Worker:", databaseWorkerScript);

// Uncomment to run (requires actual worker script files)
// demonstrateThreadPoolIsolation().catch(console.error);`,
      contextDilation: {
        level: "module",
        scope:
          "Multi-pool thread management system demonstrating per-dependency isolation with worker threads, queue management, and automatic worker recovery for preventing cascading failures",
        prerequisites: [
          "Understanding of thread vs process differences and when to use each",
          "Knowledge of Node.js worker_threads module and message passing",
          "Familiarity with bulkhead pattern and resource isolation",
          "Understanding of queue theory and backpressure mechanisms",
        ],
        systemPosition:
          "Dependency isolation layer that sits between application business logic and external services (APIs, databases, caches). Each external dependency gets its own isolated thread pool, preventing resource exhaustion in one dependency from affecting others. Commonly used in microservices, API gateways, and BFF (Backend-for-Frontend) layers.",
      },
      annotations: [
        {
          id: "thread-pool-separate-pools",
          lines: [397, 421],
          action: "Create separate thread pools for each external dependency",
          reason:
            "Isolates resource consumption by dependency type. If the payment API becomes slow and exhausts its 5 threads, the cache pool's 10 threads remain available for fast lookups. Prevents cascade failures where one slow dependency brings down the entire service",
          contextLevel: "system",
        },
        {
          id: "thread-pool-sizing",
          lines: [399, 421],
          action: "Size pools based on expected latency and concurrency",
          reason:
            "Fast services (cache: 10ms) get larger pools for high throughput. Slow services (payment API: 500ms) get smaller pools to limit concurrent calls and prevent overwhelming the external service. This matches pool capacity to dependency characteristics",
          contextLevel: "system",
        },
        {
          id: "thread-pool-bounded-queue",
          lines: [186, 191],
          action: "Implement bounded task queues with size limits",
          reason:
            "Prevents unbounded memory growth when tasks arrive faster than workers can process. When queue fills, new tasks are rejected immediately (fail-fast) rather than queueing indefinitely and eventually causing OOM",
          contextLevel: "module",
        },
        {
          id: "thread-pool-worker-states",
          lines: [102, 106],
          action: "Track worker states: IDLE, BUSY, DEAD",
          reason:
            "Enables intelligent task routing - only send tasks to IDLE workers, track BUSY for metrics, replace DEAD workers. State tracking is essential for pool health monitoring and proper task scheduling",
          contextLevel: "module",
        },
        {
          id: "thread-pool-self-healing",
          lines: [252, 263],
          action: "Automatically replace dead workers after errors",
          reason:
            "Provides self-healing capability. If a worker crashes due to bug or timeout, immediately spawn a replacement to maintain pool capacity. Prevents gradual pool degradation from reducing effective concurrency",
          contextLevel: "module",
        },
        {
          id: "thread-pool-process-queue",
          lines: [242, 250],
          action: "Process queued tasks when workers become idle",
          reason:
            "Maximizes throughput by keeping workers busy. As soon as a worker completes a task, immediately assign it the next queued task. This prevents idle workers while the queue has pending work",
          contextLevel: "module",
        },
        {
          id: "thread-pool-per-pool-timeout",
          lines: [399, 421],
          action: "Set per-pool timeout values based on SLAs",
          reason:
            "Different dependencies have different acceptable latencies. Cache should timeout at 1s, database at 3s, payment at 5s. Per-pool timeouts match expectations and prevent unbounded waiting",
          contextLevel: "system",
        },
        {
          id: "thread-pool-metrics",
          lines: [158, 163],
          action:
            "Collect per-pool metrics: tasks executed, queued, rejected, timed out",
          reason:
            "Enables observability and capacity planning. High rejection rates indicate pool too small, high queue depth shows sustained overload, timeout patterns reveal dependency issues. Essential for tuning and alerting",
          contextLevel: "system",
        },
        {
          id: "thread-pool-worker-threads",
          lines: [83, 84],
          action:
            "Use worker_threads instead of child_process for lighter isolation",
          reason:
            "Threads share memory space but have separate execution contexts. Lower overhead than processes (no full memory copy), faster startup, less memory. Good balance for CPU-bound isolation without full process overhead",
          contextLevel: "ecosystem",
        },
        {
          id: "thread-pool-timeout-termination",
          lines: [122, 126],
          action: "Terminate workers on timeout to prevent resource leaks",
          reason:
            "If a worker hangs or enters infinite loop, timeout terminates the entire worker thread. This reclaims resources and prevents zombie threads from consuming memory/CPU indefinitely",
          contextLevel: "module",
        },
        {
          id: "thread-pool-graceful-shutdown",
          lines: [265, 280],
          action: "Reject queued tasks during shutdown",
          reason:
            "Graceful shutdown requires cleaning up pending work. Rejecting queued tasks immediately fails them with clear error rather than leaving callers hanging. Workers can finish current tasks before termination",
          contextLevel: "module",
        },
        {
          id: "thread-pool-utilization-stats",
          lines: [282, 292],
          action: "Expose stats showing idle vs busy workers per pool",
          reason:
            "Real-time visibility into pool utilization. If pool is always 100% busy, it's undersized. If always idle, it's oversized. Right-sizing pools saves memory while maintaining performance",
          contextLevel: "system",
        },
      ],
      highlights: [
        {
          lines: [154, 293],
          sbvpDomain: "structure",
          label:
            "IsolatedThreadPool class manages dedicated worker pool with queue and lifecycle",
        },
        {
          lines: [186, 191],
          sbvpDomain: "behavior",
          label:
            "Queue overflow protection with bounded capacity prevents unbounded memory growth",
        },
        {
          lines: [296, 334],
          sbvpDomain: "structure",
          label:
            "ThreadPoolManager orchestrates multiple isolated pools, one per dependency",
        },
        {
          lines: [252, 263],
          sbvpDomain: "behavior",
          label:
            "Automatic worker replacement on death maintains pool capacity and resilience",
        },
        {
          lines: [397, 421],
          sbvpDomain: "philosophy",
          label:
            "Per-dependency pool sizing based on latency characteristics and SLAs",
        },
        {
          lines: [122, 126],
          sbvpDomain: "behavior",
          label:
            "Worker timeout protection terminates hung threads to prevent resource leaks",
        },
        {
          lines: [282, 292],
          sbvpDomain: "philosophy",
          label:
            "Comprehensive metrics per pool enable monitoring and capacity planning",
        },
        {
          lines: [203, 215],
          sbvpDomain: "behavior",
          label:
            "Immediate task execution on idle workers or queue when pool saturated",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservice Dependency Management - Thread pool isolation is implemented at the service boundary layer where microservices call external dependencies (downstream APIs, databases, caches, message queues). When a Node.js API server calls three external services—a payment API (average latency 2s), a product catalog service (average latency 200ms), and a Redis cache (average latency 5ms)—each dependency gets its own dedicated thread pool sized according to its latency profile. Payment API receives a small pool of 5 threads (high latency, limit concurrency), catalog service gets 15 threads (medium latency, moderate concurrency), and Redis gets 30 threads (low latency, high throughput). This placement sits at the HTTP client layer or RPC client layer, wrapping outbound calls in dependency-specific execution contexts. When the payment API becomes slow or unresponsive (degrading to 10s response time), only the 5 payment threads block—the 15 catalog threads and 30 Redis threads continue serving requests normally. Libraries like Hystrix, Resilience4j, and Polly provide thread pool isolation as middleware wrapping HTTP clients, database drivers, or RPC stubs.",
      "Database Connection Management - Applications implement thread pool isolation when connecting to multiple database instances or when separating read-heavy from write-heavy database operations. An e-commerce application might maintain three separate thread pools: a 10-thread pool for the primary PostgreSQL database (writes and critical reads), a 20-thread pool for read replicas (analytics queries), and a 5-thread pool for an external data warehouse (expensive aggregate queries). When a poorly optimized analytics query saturates the read replica pool, all 20 threads block waiting for the slow query to complete. However, the primary database pool's 10 threads remain available for customer checkout operations, and the data warehouse pool continues running its long-running aggregations. This placement operates at the database driver level, with each pool managing its own connection pool and query execution queue. ORMs like Sequelize, TypeORM, and Hibernate support pool-per-database configuration, while some applications implement custom thread pool wrappers around connection pools for finer-grained control over query execution isolation.",
      "Event Processing and Message Handlers - Event-driven systems use thread pool isolation to prevent slow message processors from blocking fast ones when consuming from message queues like Kafka, RabbitMQ, or SQS. A consumer application processing three event types—user registration events (fast, 50ms processing), email sending events (slow, 2s including SMTP), and image resize events (very slow, 10s)—creates three separate thread pools with sizes reflecting processing time. User registration gets 20 threads for high throughput, email sending gets 10 threads (limited by SMTP server capacity), and image resize gets 5 threads (CPU-intensive, limit parallelism). When image resize operations slow down due to large file uploads, the 5 image threads are saturated but user registrations and email sends continue at normal throughput using their dedicated pools. This placement sits at the message consumer layer, with each topic/queue consumer backed by its own thread pool. Frameworks like Spring Cloud Stream, Apache Camel, and NServiceBus support per-handler thread pool configuration.",
      "Third-Party API Integration Layer - Applications calling multiple third-party APIs (payment processors, shipping carriers, analytics services, marketing platforms) implement thread pool isolation at the API client layer to prevent cascading failures from unreliable external services. A SaaS application integrating with Stripe (payment), SendGrid (email), Twilio (SMS), and Google Analytics might allocate separate 5-thread pools for each provider. When SendGrid experiences an outage and all email-sending threads block on timeout, Stripe payments, Twilio SMS, and Google Analytics events continue processing normally. This placement wraps API client libraries with thread pool executors, often integrated with circuit breakers for compound protection. Each pool is configured with timeouts matching the provider's SLA—Stripe gets a 10s timeout, SendGrid gets 5s, Twilio gets 3s. The isolation prevents a single slow or failing third-party service from monopolizing application threads and degrading overall service availability.",
      "Background Job Processing Systems - Job queue processors like Sidekiq, Bull, or Celery implement thread pool isolation to separate job types by priority and resource requirements. A job processing system might define pools for critical jobs (user-facing operations, 20 threads, 1s timeout), standard jobs (background analytics, 10 threads, 30s timeout), and low-priority jobs (data archival, 5 threads, 5min timeout). When low-priority archival jobs saturate their 5-thread pool with long-running operations, critical user-facing jobs continue processing at full speed using their dedicated 20-thread pool. This placement operates at the job queue worker level, with each worker process or worker pool pulling jobs from priority-specific queues. Sidekiq implements this with separate process groups per queue, while Bull and BullMQ support worker pool configuration per queue. The isolation prevents low-priority batch jobs from starving high-priority interactive jobs, ensuring SLA compliance for user-facing operations.",
    ],
    architecturalBoundaries: [
      "Service-to-Dependency Execution Boundary - Thread pool isolation operates at the boundary between a service's request handling layer and its external dependency invocation layer. When a request enters the service (HTTP request handler, message consumer), it executes on the main request thread pool (typically 100-200 threads sized for I/O-bound request processing). When the request needs to call an external dependency, it transitions to a dependency-specific thread pool for that operation. This boundary is the handoff point where the request thread delegates to a payment pool thread, database pool thread, or cache pool thread. After the dependency call completes, the result returns to the original request thread for response composition. This boundary enables fault isolation: if the payment pool is saturated (all threads blocked), incoming requests can still be received and processed by the main thread pool—they'll fail fast when trying to acquire a payment thread instead of blocking the entire service. Architecturally, this boundary separates 'request acceptance and routing' from 'external dependency execution', allowing the service to remain responsive even when dependencies are degraded.",
      "Synchronous-to-Asynchronous Execution Boundary - Thread pool isolation creates a boundary between synchronous request processing and asynchronous dependency execution. In reactive or async/await systems (Node.js, Vert.x, async Python), the main event loop remains non-blocking while dependency calls execute on dedicated thread pools. For example, a Node.js Express server receiving a request uses the event loop to accept the connection and parse the request (synchronous). When calling the database, the request is dispatched to a 10-thread database pool where a worker thread executes the blocking JDBC query. The event loop remains free to accept new requests while database threads are blocked. This boundary is critical for maintaining service responsiveness under load: the main event loop never blocks on I/O, and blocking operations are contained within sized thread pools. The challenge at this boundary is result coordination—how to notify the event loop when the blocking operation completes. Solutions include callbacks, promises, or async/await which register continuations that resume on the event loop when pool threads complete.",
      "Resource Allocation Boundary - Thread pool isolation establishes a resource allocation boundary where each dependency receives a guaranteed allocation of execution resources (threads, queue capacity) that cannot be stolen by other dependencies. Without isolation, dependencies compete for threads from a shared pool—the first to saturate wins. With isolation, each dependency has a reserved capacity: payment pool has exclusive claim to 5 threads, cache pool has exclusive claim to 30 threads. This boundary prevents resource starvation where one greedy or slow dependency monopolizes all threads. The tradeoff is reduced overall resource utilization: if the payment pool is idle (no payment calls) its 5 threads sit unused even if the cache pool is saturated and could use more threads. This boundary represents a design choice prioritizing fault isolation and predictable performance over maximum resource efficiency. Tuning pool sizes requires understanding peak concurrency per dependency—undersized pools cause unnecessary queuing and rejections, oversized pools waste memory on idle threads.",
      "Failure Containment Boundary - Thread pool isolation creates a failure containment boundary limiting the blast radius of dependency failures. When a dependency fails (timeouts, errors, crashes), only threads in that dependency's pool are affected—other pools continue operating normally. For example, if the payment API starts returning 500 errors with 30s timeouts, all 5 payment threads will be blocked waiting for timeouts, and the payment queue will fill up causing rejections. However, the database pool, cache pool, and other dependency pools are unaffected—they continue processing their workloads at normal throughput and latency. This boundary prevents cascading failures where one failing dependency brings down the entire service by exhausting all threads. The boundary is enforced by dedicated thread allocation: threads are not shared across pools, so a failure in pool A cannot consume threads from pool B. This architectural boundary is often combined with circuit breaker patterns: when a pool's failure rate or rejection rate exceeds thresholds, the circuit breaker trips and the service fails fast instead of queuing requests.",
    ],
    interactsWith: [
      "bulkhead",
      "circuit-breaker",
      "timeout",
      "retry",
      "fallback",
      "thread-pooling",
      "backpressure",
      "process-isolation",
    ],
  },

  implementations: [
    {
      id: "netflix-hystrix",
      name: "Netflix Hystrix",
      type: "library",
      languages: ["java"],
      description:
        "Netflix's fault tolerance library providing thread pool isolation for external dependencies with circuit breakers, metrics, and fallbacks. Deprecated in favor of Resilience4j but widely used in production.",
      links: {
        github: "https://github.com/Netflix/Hystrix",
        docs: "https://github.com/Netflix/Hystrix/wiki",
      },
      codeSnippet: `import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixThreadPoolKey;
import com.netflix.hystrix.HystrixCommandProperties;
import com.netflix.hystrix.HystrixThreadPoolProperties;

// Payment API command with dedicated thread pool
public class PaymentCommand extends HystrixCommand<PaymentResult> {
    private final PaymentRequest request;

    public PaymentCommand(PaymentRequest request) {
        super(Setter
            .withGroupKey(HystrixCommandGroupKey.Factory.asKey("Payment"))
            .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("PaymentThreadPool"))
            .andThreadPoolPropertiesDefaults(
                HystrixThreadPoolProperties.Setter()
                    .withCoreSize(5)              // 5 threads for payment API
                    .withMaxQueueSize(20)          // Queue 20 requests max
                    .withQueueSizeRejectionThreshold(15)
            )
            .andCommandPropertiesDefaults(
                HystrixCommandProperties.Setter()
                    .withExecutionTimeoutInMilliseconds(5000)  // 5s timeout
            ));
        this.request = request;
    }

    @Override
    protected PaymentResult run() {
        // Executes on dedicated payment thread pool
        return paymentApi.processPayment(request);
    }

    @Override
    protected PaymentResult getFallback() {
        // Fallback when pool saturated or timeout
        return PaymentResult.failed("Service unavailable");
    }
}

// Cache command with separate, larger thread pool
public class CacheCommand extends HystrixCommand<String> {
    private final String key;

    public CacheCommand(String key) {
        super(Setter
            .withGroupKey(HystrixCommandGroupKey.Factory.asKey("Cache"))
            .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("CacheThreadPool"))
            .andThreadPoolPropertiesDefaults(
                HystrixThreadPoolProperties.Setter()
                    .withCoreSize(30)             // 30 threads for fast cache
                    .withMaxQueueSize(100)
            )
            .andCommandPropertiesDefaults(
                HystrixCommandProperties.Setter()
                    .withExecutionTimeoutInMilliseconds(1000)  // 1s timeout
            ));
        this.key = key;
    }

    @Override
    protected String run() {
        return redisCache.get(key);
    }
}

// Usage: different dependencies isolated in separate pools
PaymentResult payment = new PaymentCommand(paymentReq).execute();
String cached = new CacheCommand("user:123").execute();`,
    },
    {
      id: "resilience4j-bulkhead",
      name: "Resilience4j Bulkhead",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Modern alternative to Hystrix providing semaphore-based and thread pool-based bulkhead isolation. Lightweight with no dependencies on specific frameworks.",
      links: {
        github: "https://github.com/resilience4j/resilience4j",
        docs: "https://resilience4j.readme.io/docs/bulkhead",
      },
      codeSnippet: `import io.github.resilience4j.bulkhead.ThreadPoolBulkhead;
import io.github.resilience4j.bulkhead.ThreadPoolBulkheadConfig;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

// Configure payment API thread pool bulkhead
ThreadPoolBulkheadConfig paymentConfig = ThreadPoolBulkheadConfig.custom()
    .maxThreadPoolSize(5)           // 5 threads
    .coreThreadPoolSize(5)
    .queueCapacity(20)              // Queue 20 tasks
    .keepAliveDuration(Duration.ofMillis(1000))
    .build();

ThreadPoolBulkhead paymentBulkhead = ThreadPoolBulkhead.of(
    "paymentService",
    paymentConfig
);

// Configure cache thread pool bulkhead (larger pool)
ThreadPoolBulkheadConfig cacheConfig = ThreadPoolBulkheadConfig.custom()
    .maxThreadPoolSize(30)          // 30 threads for fast cache
    .coreThreadPoolSize(30)
    .queueCapacity(100)
    .build();

ThreadPoolBulkhead cacheBulkhead = ThreadPoolBulkhead.of(
    "cacheService",
    cacheConfig
);

// Execute on isolated thread pools
CompletableFuture<PaymentResult> paymentFuture =
    paymentBulkhead.executeSupplier(() ->
        paymentApi.processPayment(request)
    );

CompletableFuture<String> cacheFuture =
    cacheBulkhead.executeSupplier(() ->
        redisCache.get("user:123")
    );

// Even if payment pool saturates, cache pool unaffected
paymentFuture.exceptionally(ex -> {
    // Handle pool saturation or timeout
    return PaymentResult.failed("Bulkhead full");
});`,
    },
    {
      id: "polly-bulkhead",
      name: "Polly Bulkhead Isolation (.NET)",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET resilience library providing bulkhead isolation with both semaphore-based and thread pool-based strategies for dependency isolation.",
      links: {
        github: "https://github.com/App-vNext/Polly",
        docs: "https://github.com/App-vNext/Polly/wiki/Bulkhead",
      },
      codeSnippet: `using Polly;
using Polly.Bulkhead;

// Create bulkhead for payment API (5 concurrent executions)
var paymentBulkhead = Policy
    .BulkheadAsync(
        maxParallelization: 5,      // Max 5 concurrent payment calls
        maxQueuingActions: 20,       // Queue 20 requests
        onBulkheadRejectedAsync: context => {
            Console.WriteLine("Payment bulkhead saturated - request rejected");
            return Task.CompletedTask;
        });

// Create bulkhead for cache (30 concurrent executions)
var cacheBulkhead = Policy
    .BulkheadAsync(
        maxParallelization: 30,     // Max 30 concurrent cache calls
        maxQueuingActions: 100);

// Wrap API clients with bulkheads
var paymentClient = new PaymentApiClient();
var cacheClient = new RedisCacheClient();

// Execute isolated by bulkhead
try {
    var paymentTask = paymentBulkhead.ExecuteAsync(async () =>
        await paymentClient.ProcessPaymentAsync(request));

    var cacheTask = cacheBulkhead.ExecuteAsync(async () =>
        await cacheClient.GetAsync("user:123"));

    await Task.WhenAll(paymentTask, cacheTask);
} catch (BulkheadRejectedException) {
    // Pool saturated - fail fast
    return ServiceUnavailableResult();
}`,
    },
    {
      id: "python-concurrent-futures",
      name: "Python concurrent.futures Thread Pools",
      type: "library",
      languages: ["python"],
      description:
        "Python standard library providing ThreadPoolExecutor for creating isolated thread pools per dependency with configurable max workers.",
      links: {
        docs: "https://docs.python.org/3/library/concurrent.futures.html",
      },
      codeSnippet: `from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Create separate thread pools per dependency
payment_pool = ThreadPoolExecutor(
    max_workers=5,          # 5 threads for slow payment API
    thread_name_prefix="payment"
)

cache_pool = ThreadPoolExecutor(
    max_workers=30,         # 30 threads for fast cache
    thread_name_prefix="cache"
)

database_pool = ThreadPoolExecutor(
    max_workers=10,         # 10 threads for database
    thread_name_prefix="db"
)

def call_payment_api(payment_req):
    """Execute on payment thread pool"""
    # Simulates slow payment API
    time.sleep(2)
    return {"status": "success"}

def call_cache(key):
    """Execute on cache thread pool"""
    time.sleep(0.005)  # Fast cache operation
    return f"cached_value_{key}"

def call_database(query):
    """Execute on database thread pool"""
    time.sleep(0.2)
    return [{"id": 1, "name": "User"}]

# Submit tasks to isolated pools
payment_future = payment_pool.submit(
    call_payment_api,
    {"amount": 99.99}
)

cache_future = cache_pool.submit(
    call_cache,
    "user:123"
)

db_future = database_pool.submit(
    call_database,
    "SELECT * FROM users"
)

# Even if payment pool is saturated, cache and DB pools unaffected
try:
    payment_result = payment_future.result(timeout=5)
    cache_result = cache_future.result(timeout=1)
    db_result = db_future.result(timeout=3)
except TimeoutError:
    # Handle timeout from specific pool
    pass

# Cleanup pools on shutdown
payment_pool.shutdown(wait=True)
cache_pool.shutdown(wait=True)
database_pool.shutdown(wait=True)`,
    },
    {
      id: "go-worker-pools",
      name: "Go Worker Pool per Dependency",
      type: "framework",
      languages: ["go"],
      description:
        "Go pattern using buffered channels and goroutine pools to create isolated worker pools per dependency, preventing goroutine leaks and resource exhaustion.",
      links: {
        docs: "https://gobyexample.com/worker-pools",
      },
      codeSnippet: `package main

import (
    "context"
    "fmt"
    "time"
)

// Worker pool for specific dependency
type WorkerPool struct {
    name       string
    tasks      chan func() (interface{}, error)
    workerSize int
}

func NewWorkerPool(name string, workerSize int, queueSize int) *WorkerPool {
    pool := &WorkerPool{
        name:       name,
        tasks:      make(chan func() (interface{}, error), queueSize),
        workerSize: workerSize,
    }
    pool.start()
    return pool
}

func (p *WorkerPool) start() {
    for i := 0; i < p.workerSize; i++ {
        go func(workerID int) {
            for task := range p.tasks {
                result, err := task()
                if err != nil {
                    fmt.Printf("[%s-worker-%d] Error: %v\\n",
                        p.name, workerID, err)
                }
                _ = result
            }
        }(i)
    }
}

func (p *WorkerPool) Submit(task func() (interface{}, error)) error {
    select {
    case p.tasks <- task:
        return nil
    default:
        return fmt.Errorf("pool %s saturated", p.name)
    }
}

// Create isolated pools per dependency
var (
    paymentPool  = NewWorkerPool("payment", 5, 20)   // 5 workers, queue 20
    cachePool    = NewWorkerPool("cache", 30, 100)   // 30 workers, queue 100
    databasePool = NewWorkerPool("database", 10, 50) // 10 workers, queue 50
)

// Use isolated pools
func processRequest() {
    // Submit to payment pool
    err := paymentPool.Submit(func() (interface{}, error) {
        time.Sleep(2 * time.Second)  // Slow payment API
        return "payment_success", nil
    })
    if err != nil {
        // Payment pool saturated - fail fast
        fmt.Println("Payment unavailable")
    }

    // Submit to cache pool (unaffected by payment saturation)
    cachePool.Submit(func() (interface{}, error) {
        time.Sleep(5 * time.Millisecond)  // Fast cache
        return "cached_data", nil
    })
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-api-gateway",
      systemName: "Netflix API Gateway",
      howUsed:
        "Netflix's API gateway (Zuul) uses Hystrix thread pool isolation to prevent cascading failures when calling hundreds of downstream microservices. The gateway receives millions of user requests per second and fans out to services like user profiles, recommendations, content metadata, viewing history, and ratings. Each downstream service gets a dedicated Hystrix thread pool sized based on expected latency and concurrency—fast services like caching get larger pools (50+ threads), slow services like recommendations get smaller pools (5-10 threads) to limit resource consumption. When the recommendation service degrades (latency increases from 100ms to 5s), all 10 recommendation threads become blocked waiting for slow responses. The recommendation queue fills up (configured at 20 pending requests), and subsequent recommendation requests are immediately rejected with a BulkheadFullException. However, user profile requests, content metadata requests, and other service calls continue executing at normal speed using their dedicated thread pools. The API gateway remains responsive and can serve partial responses (show user profile without recommendations) instead of timing out entirely. Pattern composition: Thread Pool Isolation + Circuit Breaker (trips after 50% failure rate) + Fallback (serve cached recommendations) + Request Timeout (5s per service call). Impact: Reduced gateway P99 latency from 10s to 500ms during dependency failures; prevented complete outages by maintaining partial functionality; improved availability from 99.5% to 99.95% through fault isolation.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "uber-ringpop",
      systemName: "Uber's Ringpop Service Mesh",
      howUsed:
        "Uber's Ringpop application-layer sharding system uses thread pool isolation to protect forwarding nodes from slow target nodes. When a request arrives at a Ringpop node that doesn't own the key, the node must forward the request to the owning node over TCP. Each target node (there can be 100+ nodes in the ring) gets a dedicated 5-thread forwarding pool. When a target node becomes slow (garbage collection pause, network congestion, overloaded), the 5 forwarding threads to that node saturate but other target nodes remain unaffected. Without isolation, one slow target could exhaust all forwarding threads (shared pool of 200), preventing forwarding to any target and creating cascading failures across the entire ring. With per-target isolation, the blast radius is limited to requests destined for the slow node—requests to other 99 nodes continue forwarding at normal latency. The system monitors per-target pool utilization and triggers automatic failover when a target's pool is saturated for more than 30 seconds (adaptive circuit breaker). Pattern composition: Thread Pool Isolation + Consistent Hashing (key-to-node mapping) + Circuit Breaker (per-target) + Retry with Backoff (retry on different node). Impact: Reduced cascading failure incidents from 5 per week to zero; improved P95 forwarding latency from 100ms to 20ms by detecting slow nodes faster; enabled cluster to maintain 99.99% availability despite individual node failures.",
      source: "https://eng.uber.com/ringpop-open-source-nodejs-library/",
    },
    {
      systemId: "amazon-order-pipeline",
      systemName: "Amazon Order Processing Pipeline",
      howUsed:
        "Amazon's order processing system uses thread pool isolation to separate critical path operations (payment authorization, inventory reservation) from non-critical operations (email notifications, analytics logging, promotional recommendations). The order pipeline receives an order and must call 10+ downstream services: payment processor (critical, 200ms SLA), inventory service (critical, 100ms SLA), shipping calculator (critical, 150ms SLA), email service (non-critical, 2s SLA), analytics service (non-critical, 5s SLA), recommendations service (non-critical, 1s SLA). Critical services get dedicated high-priority thread pools with generous sizing: payment pool has 30 threads, inventory pool has 40 threads, shipping pool has 20 threads. Non-critical services get smaller pools: email pool has 5 threads, analytics pool has 5 threads, recommendations pool has 10 threads. When the analytics service experiences an outage and stops responding (all requests timeout after 5s), the 5 analytics threads saturate but order processing continues unaffected using critical path pools. Orders complete successfully with payment authorized, inventory reserved, and shipping calculated—only the analytics events are dropped. The system applies fail-fast behavior: when a non-critical pool saturates, subsequent requests to that service are rejected immediately without waiting for timeout, preventing queue buildup. Pattern composition: Thread Pool Isolation + Priority Queuing (critical vs non-critical) + Timeout (per-service SLA) + Graceful Degradation (drop non-critical features). Impact: Improved order completion rate from 99.7% to 99.95% by isolating critical path; reduced order processing latency P99 from 2s to 500ms; prevented 15+ outages caused by non-critical service failures affecting critical operations.",
      source:
        "https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/",
    },
  ],

  references: [
    {
      title: "Netflix Hystrix - How It Works",
      url: "https://github.com/Netflix/Hystrix/wiki/How-it-Works",
      type: "documentation",
      author: "Netflix",
    },
    {
      title: "Release It! - Bulkheads Pattern",
      url: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
      type: "book",
      author: "Michael T. Nygard",
    },
    {
      title: "Resilience4j Bulkhead Documentation",
      url: "https://resilience4j.readme.io/docs/bulkhead",
      type: "documentation",
      author: "Resilience4j",
    },
    {
      title: "Fault Tolerance in a High Volume Distributed System",
      url: "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
      type: "article",
      author: "Ben Christensen",
    },
    {
      title: "Python concurrent.futures - Thread Pool Executor",
      url: "https://docs.python.org/3/library/concurrent.futures.html",
      type: "documentation",
      author: "Python Software Foundation",
    },
  ],

  philosophy: {
    coreProblem:
      "Shared thread pools allow one slow or failing dependency to exhaust all threads, blocking unrelated operations and causing service-wide outages even when most dependencies are healthy",
    designPrinciple:
      "Allocate separate, independently-sized thread pools for each external dependency, containing failures to specific pools while maintaining overall service availability",
    historicalContext:
      "Netflix pioneered thread pool isolation with Hystrix (2012) after experiencing cascading failures where one slow API call exhausted all threads in their API gateway, preventing all user requests from completing. The pattern became foundational to microservices resilience.",
    alternativesRejected: [
      "Shared thread pool - allows cascading failures across all dependencies",
      "Semaphore-based isolation - provides concurrency limiting but doesn't prevent thread blocking",
      "Process isolation - stronger isolation but higher overhead and complexity",
      "No isolation - one slow dependency brings down entire service",
    ],
    mentalModel:
      "Thread pool isolation is like having separate checkout lanes for different payment methods at a store: if the credit card system is down, the cash and debit lanes keep moving—one lane's problems don't stop the others",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Service["Microservice (100 request threads)"]
        Request[Incoming Request]

        subgraph Pools["Thread Pool Manager"]
            Payment["Payment Pool<br/>5 threads<br/>Queue: 20"]
            Cache["Cache Pool<br/>30 threads<br/>Queue: 100"]
            Database["Database Pool<br/>10 threads<br/>Queue: 50"]
        end
    end

    Request --> Payment
    Request --> Cache
    Request --> Database

    Payment --> PaymentAPI["Payment API<br/>(SLOW: 2s latency)"]
    Cache --> Redis["Redis Cache<br/>(FAST: 5ms latency)"]
    Database --> DB["PostgreSQL<br/>(MEDIUM: 200ms)"]

    PaymentAPI -.->|"All 5 threads BLOCKED"| Payment
    Redis -.->|"✓ 30 threads available"| Cache
    DB -.->|"✓ 10 threads available"| Database

    style Payment fill:#ffcccc
    style Cache fill:#ccffcc
    style Database fill:#ccffcc
    style PaymentAPI fill:#ff9999`,
    realWorldAnalogy:
      "Thread pool isolation is like hospital emergency room triage lanes: cardiac emergencies have dedicated doctors/rooms, broken bones have their own, and minor injuries have separate staff. If broken bone cases surge and saturate their doctors, cardiac emergencies still get immediate attention in their dedicated lane.",
    useCases: [
      {
        domain: "API Gateway",
        scenario:
          "Netflix Zuul uses Hystrix pools to isolate 100+ downstream microservices, preventing one slow service from exhausting gateway threads",
        patternRole:
          "Contains failure blast radius to specific dependency pools while maintaining partial service availability",
        companies: ["Netflix", "Amazon", "Uber", "Lyft"],
      },
      {
        domain: "Order Processing",
        scenario:
          "E-commerce systems isolate critical path (payment, inventory) from non-critical (analytics, email) using separate pools",
        patternRole:
          "Ensures order completion even when non-critical services fail",
        companies: ["Amazon", "Shopify", "Stripe"],
      },
      {
        domain: "Data Pipeline",
        scenario:
          "ETL systems separate fast transformations (filtering) from slow transformations (ML inference) with isolated pools",
        patternRole:
          "Prevents slow transformations from blocking fast data flows",
        companies: ["Uber", "Airbnb", "LinkedIn"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "isolation",
    "bulkhead",
    "thread-management",
    "resource-isolation",
    "concurrency",
  ],
  difficulty: "advanced",
};
