import type { Pattern } from "../schema";

export const processIsolation: Pattern = {
  id: "process-isolation",
  slug: "process-isolation",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → 🧱 Bulkhead → 📦 Process Isolation",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Bulkhead",
    level: 4,
  },

  concept: {
    name: "Process Isolation",
    emoji: "📦",
    tagline: "Separate processes",
    definition:
      "Process isolation is a fault tolerance technique that runs different components or workloads in separate operating system processes, preventing failures in one component from crashing or corrupting others. Think of it like keeping different chemicals in separate containers—if one catches fire, the others remain safe behind their container walls. For example, a web browser might run each browser tab in its own process, so if a JavaScript infinite loop freezes one tab, other tabs continue working normally. Each process has its own memory space protected by the operating system's memory management unit, preventing one process from reading or writing another process's memory. Communication between processes happens through well-defined inter-process communication (IPC) mechanisms like pipes, sockets, or message queues rather than shared memory. When a process crashes, it only affects that process—the operating system cleans up its resources and other processes continue unaffected. This isolation is stronger than thread-based isolation because threads share memory space and a memory corruption bug can crash the entire process.",
    problemSolved:
      "Single-process architectures allow bugs or failures in one component to crash or corrupt the entire application. For example, a web server running all request handlers in one process will completely crash if a single handler dereferences a null pointer or runs out of memory. A memory leak in one feature contaminates the whole application, requiring full server restart that impacts all users. Similarly, processing untrusted input (user uploads, third-party plugins) in the main process creates security vulnerabilities where malicious code can access all application data. Process isolation solves this by creating failure boundaries: each component runs in its own process. A crashed request handler process is automatically restarted without affecting other requests. Memory leaks are contained—when a leaky process is recycled, its memory is fully reclaimed. Untrusted code runs in sandboxed processes with limited permissions. Critical components like Chrome's rendering engine run isolated from the browser core.",
    tradeoffs: {
      pros: [
        "Provides strong fault isolation where crashes, memory corruption, or resource exhaustion in one process cannot affect others, enabling graceful degradation",
        "Enables complete memory cleanup when processes terminate—operating system reclaims all memory, preventing memory leaks from accumulating over time",
        "Offers security boundaries enforced by OS-level process isolation, preventing untrusted code from accessing sensitive data in other processes",
        "Allows independent restart of failed components without taking down the entire application, improving overall system availability and reliability",
      ],
      cons: [
        "Creates significant memory overhead with each process requiring separate memory for code, heap, and stack, typically adding 10-50MB per process",
        "Introduces substantial inter-process communication costs compared to shared memory, making cross-process calls 10-1000x slower than in-process function calls",
        "Complicates state sharing and coordination since processes cannot directly access shared memory, requiring serialization and explicit IPC mechanisms",
        "Increases debugging complexity with separate process spaces, scattered logs, and difficulty tracking state across process boundaries",
      ],
    },
    relatedPatterns: [
      "bulkhead",
      "thread-pool-isolation",
      "server-isolation",
      "multi-threading",
      "circuit-breaker",
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
      id: "process-isolation-ts-basic",
      language: "typescript",
      title: "Process Isolation with Worker Processes and IPC",
      description:
        "A production-ready process isolation system using Node.js child processes for workload isolation. Demonstrates fault isolation, automatic process restart, resource cleanup, and inter-process communication via message passing. Shows how process boundaries prevent cascading failures and memory leaks.",
      code: `// Process Isolation Implementation - Multi-Process Worker System
// Demonstrates fault isolation using separate OS processes

import { fork, ChildProcess } from "child_process";
import * as path from "path";

interface WorkerConfig {
  id: string;
  scriptPath: string;
  maxMemoryMB: number;
  maxRestarts: number;
  restartDelayMs: number;
}

interface WorkerMessage {
  type: "task" | "result" | "error" | "health" | "shutdown";
  taskId?: string;
  data?: unknown;
  error?: string;
}

class IsolatedWorker {
  private process: ChildProcess | null = null;
  private config: WorkerConfig;
  private restartCount: number = 0;
  private isShuttingDown: boolean = false;
  private pendingTasks: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor(config: WorkerConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.process) {
      throw new Error(\`Worker \${this.config.id} already started\`);
    }

    console.log(\`[Worker \${this.config.id}] Starting isolated process\`);

    // Fork a new child process
    this.process = fork(this.config.scriptPath, [], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      env: {
        ...process.env,
        WORKER_ID: this.config.id,
        MAX_MEMORY_MB: String(this.config.maxMemoryMB),
      },
    });

    // Set up IPC message handling
    this.process.on("message", (message: WorkerMessage) => {
      this.handleMessage(message);
    });

    // Handle process exit
    this.process.on("exit", (code, signal) => {
      this.handleExit(code, signal);
    });

    // Handle process errors
    this.process.on("error", (error) => {
      console.error(\`[Worker \${this.config.id}] Process error: \${error}\`);
    });

    console.log(\`[Worker \${this.config.id}] Process started (PID: \${this.process.pid})\`);
  }

  async executeTask<T>(taskId: string, data: unknown): Promise<T> {
    if (!this.process || this.isShuttingDown) {
      throw new Error(\`Worker \${this.config.id} not available\`);
    }

    return new Promise((resolve, reject) => {
      // Store promise handlers for this task
      this.pendingTasks.set(taskId, { resolve, reject });

      // Send task to worker process via IPC
      const message: WorkerMessage = {
        type: "task",
        taskId,
        data,
      };

      this.process!.send(message);

      // Set timeout
      setTimeout(() => {
        if (this.pendingTasks.has(taskId)) {
          this.pendingTasks.delete(taskId);
          reject(new Error(\`Task \${taskId} timed out\`));
        }
      }, 30000); // 30 second timeout
    });
  }

  private handleMessage(message: WorkerMessage): void {
    switch (message.type) {
      case "result":
        if (message.taskId && this.pendingTasks.has(message.taskId)) {
          const { resolve } = this.pendingTasks.get(message.taskId)!;
          this.pendingTasks.delete(message.taskId);
          resolve(message.data);
        }
        break;

      case "error":
        if (message.taskId && this.pendingTasks.has(message.taskId)) {
          const { reject } = this.pendingTasks.get(message.taskId)!;
          this.pendingTasks.delete(message.taskId);
          reject(new Error(message.error || "Worker task failed"));
        }
        break;

      case "health":
        console.log(\`[Worker \${this.config.id}] Health check: \${JSON.stringify(message.data)}\`);
        break;
    }
  }

  private async handleExit(code: number | null, signal: string | null): void {
    console.log(\`[Worker \${this.config.id}] Process exited (code: \${code}, signal: \${signal})\`);

    // Reject all pending tasks
    for (const [taskId, { reject }] of this.pendingTasks) {
      reject(new Error(\`Worker crashed during task \${taskId}\`));
    }
    this.pendingTasks.clear();

    this.process = null;

    // Automatic restart logic
    if (!this.isShuttingDown && this.restartCount < this.config.maxRestarts) {
      this.restartCount++;
      console.log(
        \`[Worker \${this.config.id}] Auto-restarting (attempt \${this.restartCount}/\${this.config.maxRestarts})\`
      );

      await new Promise((resolve) => setTimeout(resolve, this.config.restartDelayMs));
      await this.start();
    } else if (this.restartCount >= this.config.maxRestarts) {
      console.error(\`[Worker \${this.config.id}] Max restarts reached, giving up\`);
    }
  }

  async shutdown(): Promise<void> {
    if (!this.process) return;

    this.isShuttingDown = true;
    console.log(\`[Worker \${this.config.id}] Initiating graceful shutdown\`);

    // Send shutdown signal
    this.process.send({ type: "shutdown" });

    // Wait for graceful shutdown, then force kill
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (this.process) {
          console.log(\`[Worker \${this.config.id}] Force killing process\`);
          this.process.kill("SIGKILL");
        }
        resolve();
      }, 5000);

      this.process!.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.process = null;
  }

  getStats() {
    return {
      workerId: this.config.id,
      isRunning: this.process !== null,
      pid: this.process?.pid,
      restartCount: this.restartCount,
      pendingTaskCount: this.pendingTasks.size,
    };
  }
}

// Process Pool Manager
class ProcessPool {
  private workers: Map<string, IsolatedWorker> = new Map();
  private roundRobinIndex: number = 0;

  async addWorker(config: WorkerConfig): Promise<void> {
    const worker = new IsolatedWorker(config);
    await worker.start();
    this.workers.set(config.id, worker);
    console.log(\`[ProcessPool] Added worker: \${config.id}\`);
  }

  async executeTask<T>(taskId: string, data: unknown, workerId?: string): Promise<T> {
    let worker: IsolatedWorker | undefined;

    if (workerId) {
      // Execute on specific worker
      worker = this.workers.get(workerId);
      if (!worker) {
        throw new Error(\`Worker \${workerId} not found\`);
      }
    } else {
      // Round-robin load balancing
      const workerArray = Array.from(this.workers.values());
      if (workerArray.length === 0) {
        throw new Error("No workers available");
      }
      worker = workerArray[this.roundRobinIndex % workerArray.length];
      this.roundRobinIndex++;
    }

    return worker.executeTask<T>(taskId, data);
  }

  async shutdownAll(): Promise<void> {
    console.log(\`[ProcessPool] Shutting down all workers\`);
    const shutdownPromises = Array.from(this.workers.values()).map((worker) =>
      worker.shutdown()
    );
    await Promise.all(shutdownPromises);
    this.workers.clear();
  }

  getPoolStats() {
    return Array.from(this.workers.values()).map((worker) => worker.getStats());
  }
}

// Example Worker Script (would be in separate file: worker.ts)
// This demonstrates what runs in the isolated process
const workerScriptCode = \`
// worker.ts - Runs in isolated child process
process.on("message", async (message) => {
  if (message.type === "task") {
    try {
      // Simulate task processing
      const result = await processTask(message.data);

      process.send({
        type: "result",
        taskId: message.taskId,
        data: result,
      });
    } catch (error) {
      process.send({
        type: "error",
        taskId: message.taskId,
        error: String(error),
      });
    }
  } else if (message.type === "shutdown") {
    console.log("Worker received shutdown signal");
    process.exit(0);
  }
});

async function processTask(data: any): Promise<any> {
  // Simulate CPU-intensive work
  await new Promise(resolve => setTimeout(resolve, 100));
  return { processed: true, input: data };
}

// Send health check every 10 seconds
setInterval(() => {
  const memUsage = process.memoryUsage();
  process.send({
    type: "health",
    data: {
      memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      uptime: process.uptime(),
    },
  });
}, 10000);
\`;

// Demonstration
async function demonstrateProcessIsolation() {
  console.log("=== Process Isolation Demonstration ===\\n");

  const pool = new ProcessPool();

  // Scenario 1: Start multiple isolated workers
  console.log("--- Scenario 1: Starting Worker Pool ---\\n");

  // Note: In real implementation, workers would be separate files
  // For demo purposes, we'll simulate with inline code
  await pool.addWorker({
    id: "worker-image-processing",
    scriptPath: "./worker-image.js",
    maxMemoryMB: 512,
    maxRestarts: 3,
    restartDelayMs: 1000,
  });

  await pool.addWorker({
    id: "worker-data-analytics",
    scriptPath: "./worker-analytics.js",
    maxMemoryMB: 1024,
    maxRestarts: 3,
    restartDelayMs: 1000,
  });

  await pool.addWorker({
    id: "worker-report-generation",
    scriptPath: "./worker-reports.js",
    maxMemoryMB: 256,
    maxRestarts: 3,
    restartDelayMs: 1000,
  });

  console.log("\\nPool stats:", JSON.stringify(pool.getPoolStats(), null, 2));

  // Scenario 2: Execute tasks across workers
  console.log("\\n--- Scenario 2: Executing Tasks ---\\n");

  const tasks = [
    pool.executeTask("task-1", { type: "resize", image: "photo.jpg" }, "worker-image-processing"),
    pool.executeTask("task-2", { type: "analyze", dataset: "sales.csv" }, "worker-data-analytics"),
    pool.executeTask("task-3", { type: "generate", report: "monthly" }, "worker-report-generation"),
  ];

  const results = await Promise.allSettled(tasks);
  console.log("Task results:", results);

  // Scenario 3: Worker crash and restart
  console.log("\\n--- Scenario 3: Fault Isolation (Worker Crash) ---");
  console.log("If worker-image-processing crashes, other workers continue unaffected");
  console.log("The crashed worker will auto-restart and only its pending tasks fail\\n");

  // Cleanup
  console.log("--- Cleanup: Shutting Down Pool ---\\n");
  await pool.shutdownAll();
  console.log("All workers shut down gracefully");
}

// Note: This is a conceptual demonstration
// In production, worker scripts would be separate files
console.log("Process Isolation Pattern - Conceptual Example");
console.log("In production, each worker would be a separate .js/.ts file");
console.log("Worker script example:\\n");
console.log(workerScriptCode);

// Uncomment to run (requires actual worker script files)
// demonstrateProcessIsolation().catch(console.error);`,
      contextDilation: {
        level: "system",
        scope:
          "Complete multi-process worker system demonstrating OS-level process isolation for fault tolerance, including worker lifecycle management, IPC communication, automatic restart, and resource cleanup",
        prerequisites: [
          "Understanding of operating system process model and memory isolation",
          "Knowledge of Node.js child_process module and IPC mechanisms",
          "Familiarity with fault tolerance patterns and graceful degradation",
          "Understanding of worker pool patterns and load balancing",
        ],
        systemPosition:
          "Application-level orchestration layer that manages isolated worker processes. Sits above the OS process layer and below business logic, providing fault boundaries that prevent failures in one component from affecting others. This is commonly used in web servers, task queues, and microservices to isolate untrusted code or resource-intensive operations.",
      },
      annotations: [
        {
          id: "process-isolation-fork",
          lines: [122, 129],
          action:
            "Fork separate child processes for each worker using Node.js fork()",
          reason:
            "Creates true OS-level isolation - each worker gets its own memory space, heap, and stack. If one worker crashes or leaks memory, it cannot corrupt other workers. The OS automatically cleans up all resources when the process terminates",
          contextLevel: "system",
        },
        {
          id: "process-isolation-ipc",
          lines: [132, 134],
          action: "Use IPC (Inter-Process Communication) via message passing",
          reason:
            "Processes cannot share memory directly, so we use message passing through IPC channels. This enforces a clean API boundary and prevents accidental coupling. Messages are serialized, preventing pointer bugs and memory corruption",
          contextLevel: "module",
        },
        {
          id: "process-isolation-pending-tasks",
          lines: [105, 108],
          action: "Track pending tasks in a Map with promise handlers",
          reason:
            "Enables async/await pattern for task execution across process boundaries. When worker sends result back via IPC, we resolve the corresponding promise. This bridges synchronous-looking code with async IPC communication",
          contextLevel: "module",
        },
        {
          id: "process-isolation-restart",
          lines: [212, 220],
          action: "Implement automatic restart on process exit",
          reason:
            "Provides resilience against worker crashes. When a worker dies (crash, out-of-memory, etc.), the supervisor automatically spawns a new process. Limits max restarts to prevent infinite restart loops from persistent bugs",
          contextLevel: "system",
        },
        {
          id: "process-isolation-reject-tasks",
          lines: [204, 208],
          action: "Reject all pending tasks when worker crashes",
          reason:
            "Fail-fast principle - tasks running when worker crashed cannot complete, so we immediately reject their promises with an error. Clients can retry or handle the failure, rather than hanging indefinitely waiting for a dead process",
          contextLevel: "module",
        },
        {
          id: "process-isolation-env-config",
          lines: [124, 128],
          action: "Send environment variables to configure worker behavior",
          reason:
            "Each worker can have different resource limits (memory, CPU) and configuration without code changes. Environment variables are the standard way to configure child processes while keeping code generic and reusable",
          contextLevel: "module",
        },
        {
          id: "process-isolation-graceful-shutdown",
          lines: [226, 249],
          action: "Implement graceful shutdown with timeout fallback",
          reason:
            "Gives workers time to finish current tasks and cleanup (flush logs, close connections). If worker doesn't exit within timeout, force kill with SIGKILL to prevent hanging. This balances clean shutdown with bounded waiting time",
          contextLevel: "module",
        },
        {
          id: "process-isolation-round-robin",
          lines: [287, 294],
          action: "Use round-robin load balancing across worker pool",
          reason:
            "Distributes tasks evenly across workers to maximize throughput and resource utilization. Prevents any single worker from becoming a bottleneck while others sit idle. Simple but effective for most workloads",
          contextLevel: "module",
        },
        {
          id: "process-isolation-stats",
          lines: [254, 262],
          action: "Expose worker stats (PID, restart count, pending tasks)",
          reason:
            "Provides observability into system health. High restart counts indicate unstable workers, high pending task counts show bottlenecks. PIDs enable external monitoring and debugging with OS tools",
          contextLevel: "system",
        },
        {
          id: "process-isolation-timeout",
          lines: [168, 173],
          action: "Set task timeout to prevent hanging on worker issues",
          reason:
            "If worker enters infinite loop or deadlock, timeout ensures task eventually fails rather than blocking caller forever. Bounded latency is critical for system stability and user experience",
          contextLevel: "module",
        },
        {
          id: "process-isolation-null-ref",
          lines: [210, 210],
          action: "Clear process reference to null after exit",
          reason:
            "Prevents accidentally using a dead process reference. Explicit null check before operations ensures we fail fast if trying to use a crashed worker, rather than sending messages to a non-existent process",
          contextLevel: "local",
        },
        {
          id: "process-isolation-separate-scripts",
          lines: [371, 393],
          action: "Separate worker logic into isolated script files",
          reason:
            "Each worker type (image processing, analytics, reports) runs completely different code in its own process. If one has a bug or security vulnerability, it cannot affect other workers. Strong fault and security isolation",
          contextLevel: "system",
        },
      ],
      highlights: [
        {
          lines: [100, 112],
          label:
            "IsolatedWorker class encapsulates process lifecycle, IPC, and restart logic",
          sbvpDomain: "structure",
        },
        {
          lines: [201, 224],
          label:
            "Automatic restart mechanism provides resilience against worker crashes",
          sbvpDomain: "behavior",
        },
        {
          lines: [266, 296],
          label:
            "ProcessPool orchestrates multiple isolated workers with load balancing",
          sbvpDomain: "structure",
        },
        {
          lines: [132, 134],
          label:
            "IPC message passing provides clean communication across process boundaries",
          sbvpDomain: "behavior",
        },
        {
          lines: [124, 128],
          label:
            "Per-worker resource limits and configuration via environment variables",
          sbvpDomain: "philosophy",
        },
        {
          lines: [226, 249],
          label:
            "Graceful shutdown with timeout ensures workers cleanup without hanging",
          sbvpDomain: "behavior",
        },
        {
          lines: [149, 175],
          label:
            "Task timeout protection prevents unbounded blocking on worker issues",
          sbvpDomain: "philosophy",
        },
        {
          lines: [254, 262],
          label:
            "Worker stats expose health metrics for monitoring and debugging",
          sbvpDomain: "structure",
        },
      ],
    },
  ],
};
