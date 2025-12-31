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
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
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
};
