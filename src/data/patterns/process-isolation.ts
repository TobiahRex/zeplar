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
        name: "Process Manager",
        role: "Process Orchestrator",
        responsibilities: [
          "Spawn separate OS processes for each isolated component or workload",
          "Monitor process health and detect crashes or hangs",
          "Restart failed processes automatically with backoff strategy",
          "Manage inter-process communication channels (pipes, sockets, message queues)",
        ],
      },
      {
        name: "Isolated Worker Process",
        role: "Component Execution Container",
        responsibilities: [
          "Execute specific component or workload in dedicated memory space",
          "Communicate with other processes via IPC mechanisms (not shared memory)",
          "Handle requests and return results through message passing",
          "Exit gracefully or crash without affecting other processes",
        ],
      },
      {
        name: "IPC Channel",
        role: "Inter-Process Communication Medium",
        responsibilities: [
          "Transmit messages between processes (stdin/stdout, sockets, message queues)",
          "Serialize and deserialize data crossing process boundaries",
          "Provide buffering and flow control for message transmission",
          "Detect broken connections when processes crash",
        ],
      },
      {
        name: "Operating System",
        role: "Isolation Enforcer",
        responsibilities: [
          "Enforce memory isolation between processes via virtual memory",
          "Prevent processes from accessing each other's memory or file descriptors",
          "Reclaim all resources (memory, handles, sockets) when process terminates",
          "Provide process scheduling and CPU time allocation",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Manager as Process Manager
    participant Process1 as Worker Process 1<br/>(Request Handler)
    participant Process2 as Worker Process 2<br/>(Image Processor)
    participant Process3 as Worker Process 3<br/>(Email Sender)
    participant OS as Operating System

    Note over OS: OS-level memory isolation<br/>prevents cross-process corruption

    Manager->>OS: Spawn Process 1
    OS->>Process1: Create isolated memory space
    Manager->>OS: Spawn Process 2
    OS->>Process2: Create isolated memory space
    Manager->>OS: Spawn Process 3
    OS->>Process3: Create isolated memory space

    Manager->>Process1: Send request via IPC
    Process1->>Process1: Process request<br/>(separate memory)
    Process1-->>Manager: Return result via IPC

    par Other processes isolated
        Manager->>Process2: Send image via IPC
        Process2->>Process2: Process image<br/>(separate memory)
    and
        Manager->>Process3: Send email data via IPC
        Process3->>Process3: Send email<br/>(separate memory)
    end

    Note over Process2: ❌ Process 2 crashes<br/>(memory corruption bug)
    Process2->>OS: Segmentation fault
    OS->>OS: Terminate Process 2<br/>Reclaim all memory
    OS-->>Manager: Process 2 died (SIGCHLD)

    Note over Process1,Process3: ✓ Processes 1 & 3<br/>unaffected by crash

    Manager->>OS: Respawn Process 2
    OS->>Process2: Create new clean memory space
    Note over Process2: ✓ Process 2 restarted<br/>Memory leak cleared`,
    flow: [
      {
        step: 1,
        actor: "Process Manager",
        action: "Spawn isolated worker processes",
        description:
          "Manager spawns separate OS processes for each component (request handler, image processor, background job worker, etc.). Each process gets its own PID, memory space, and file descriptor table. Processes are configured with appropriate resource limits (memory, CPU, file descriptors).",
      },
      {
        step: 2,
        actor: "Operating System",
        action: "Enforce memory isolation",
        description:
          "OS creates virtual memory space for each process with its own page tables. Memory management unit (MMU) prevents processes from accessing each other's memory—any attempt to read/write another process's address space triggers segmentation fault. This provides hardware-enforced isolation stronger than software-based isolation.",
      },
      {
        step: 3,
        actor: "Process Manager",
        action: "Route work to appropriate process via IPC",
        description:
          "Manager receives incoming work and routes it to appropriate worker process based on workload type. Communication happens through IPC channels (Unix domain sockets, pipes, message queues). Data is serialized (JSON, Protocol Buffers, MessagePack) before sending across process boundary.",
      },
      {
        step: 4,
        actor: "Isolated Worker Process",
        action: "Execute work in isolated memory space",
        description:
          "Worker process receives serialized work via IPC, deserializes it, executes the task using its dedicated memory space. Any memory allocations, bugs, or crashes are contained within this process. Worker sends results back to manager via IPC when complete or reports error if work fails.",
      },
      {
        step: 5,
        actor: "Operating System",
        action: "Detect and handle process crash",
        description:
          "If worker process crashes (segmentation fault, uncaught exception, out-of-memory), OS sends SIGCHLD signal to parent process manager. OS immediately reclaims all process resources: memory is freed, file descriptors closed, network connections terminated. No cleanup code needs to run—OS guarantees complete resource reclamation.",
      },
      {
        step: 6,
        actor: "Process Manager",
        action: "Restart failed process",
        description:
          "Manager receives SIGCHLD signal indicating process death. It logs the crash, updates monitoring metrics (process crash rate), and respawns a fresh worker process with clean memory state. Restart may use exponential backoff if process is crash-looping. New process starts with zero accumulated memory leaks or corruption.",
      },
      {
        step: 7,
        actor: "Process Manager",
        action: "Continue routing work (optional)",
        description:
          "While crashed process is restarting, manager continues routing work to healthy processes. Work destined for crashed process may be queued, retried, or routed to alternative process depending on configuration. System maintains partial availability—only work requiring the crashed process is affected.",
      },
    ],
    invariants: [
      "Each isolated component MUST run in a separate OS process with its own PID and virtual memory space",
      "Processes MUST NOT share memory—all communication MUST use explicit IPC mechanisms (pipes, sockets, message queues)",
      "Processes MUST be independent—a crash in one process MUST NOT cause crashes in other processes",
      "When a process terminates (crash or graceful exit), the OS MUST reclaim all its resources without requiring manual cleanup",
      "Process manager MUST monitor worker process health via signals (SIGCHLD) or health check messages and detect crashes promptly",
      "Failed processes SHOULD be automatically restarted with clean state, but restart policy SHOULD include backoff to prevent crash loops from consuming resources",
      "Critical data MUST be persisted to durable storage or sent to another process before the source process can be considered disposable",
    ],
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

  systemContext: {
    typicalPlacement: [
      "Web Browser Tab Isolation - Modern browsers like Chrome, Firefox, and Safari implement process-per-tab isolation to prevent one tab's crashes or malicious code from affecting other tabs or the browser core. When you open a new tab, the browser spawns a separate renderer process with its own memory space. If a tab encounters a JavaScript infinite loop, memory leak, or malicious exploit attempting buffer overflow, only that tab's process crashes—other tabs and the browser UI continue working normally. The crashed tab shows 'Aw, Snap!' error page while remaining tabs are unaffected. This placement operates at the browser architecture layer: main browser process manages UI and coordinates renderer processes via IPC (Chromium uses Mojo IPC). Each renderer process runs in a restricted sandbox with limited OS permissions (cannot access filesystem, network directly), communicating with browser process for privileged operations. When a renderer process crashes, browser process detects it via SIGCHLD, removes the tab UI, and users can reload to spawn fresh process. Process isolation here prevents exploits from escaping the renderer sandbox to access user's filesystem or other tabs' data.",
      "Microservices Container Orchestration - Container platforms like Kubernetes run each microservice in isolated processes (containers) to prevent service failures from cascading across the platform. When deploying an e-commerce platform with 50 microservices (order service, inventory service, payment service, shipping service), each service runs in its own container process with dedicated CPU and memory allocation. If the inventory service crashes due to a bug or runs out of memory, Kubernetes detects the container exit, marks the pod as failed, and spawns a replacement container with clean state. Order service, payment service, and other 48 services continue operating unaffected. This placement sits at the container orchestration layer: kubelet monitors process health via cgroups and restarts failed containers per restart policy (Always, OnFailure, Never). Containers communicate via network (HTTP/gRPC) rather than shared memory, enforcing failure isolation. Memory limits (memory.limit_in_bytes cgroup) prevent one service's memory leak from consuming all node memory and affecting co-located services.",
      "Background Job Worker Processes - Job processing systems like Sidekiq, Resque, and Celery use separate worker processes to isolate job execution from web request handlers and from each other. A Rails application might run 4 web server processes (Puma workers) and 10 background job worker processes (Sidekiq workers). When a job worker processes a PDF generation job that leaks memory or crashes on malformed input, only that worker process dies—web requests continue serving users and other 9 job workers continue processing jobs. The job processor (Sidekiq) detects worker death, logs the failure, re-queues the failed job (with retry limit), and spawns replacement worker with clean memory. This placement operates at the application process manager level: Sidekiq master process forks worker children, monitors them via SIGCHLD, and maintains worker pool size. Jobs communicate via Redis message queue (not shared memory), so worker crashes cannot corrupt in-flight jobs in other workers. The isolation prevents a single bad job (infinite loop, memory leak, segfault) from taking down web tier or other background processing.",
      "Database Connection Pooler Process Isolation - Database proxy poolers like PgBouncer and ProxySQL run in separate processes from application servers to isolate database connection management from application crashes. When an application server crashes or restarts (deployment, out-of-memory), active database connections in PgBouncer process remain unaffected and can be reused by new application instances. This placement sits between application tier and database tier: applications connect to PgBouncer process (typically one PgBouncer per database host), PgBouncer maintains persistent connections to PostgreSQL and multiplexes client connections across them. If application process crashes mid-transaction, PgBouncer detects broken client socket, rolls back the transaction, and returns the database connection to the pool clean. If PgBouncer itself crashes (rare), application servers detect connection failures and reconnect, while database connections are terminated cleanly by PostgreSQL. Process isolation here prevents application-tier instability from requiring database connection re-establishment and prevents connection pool state corruption from affecting multiple application instances.",
      "Plugin and Extension Sandboxing - Applications supporting third-party plugins (Figma, VS Code, WordPress) run plugins in separate processes to isolate untrusted code from the core application. When VS Code loads a language server extension for Python, it spawns a separate extension host process running the extension code. If the extension has a bug causing crash or memory leak, only the extension host process dies—VS Code editor UI remains responsive and other extensions continue working. The crashed extension shows error banner allowing user to disable it or reload. This placement implements a host-plugin architecture: main application process (VS Code core) spawns extension host processes and communicates via JSON-RPC over stdin/stdout or sockets. Extensions cannot directly access VS Code's memory or filesystem—all operations go through API boundaries with permission checks. When extension host crashes, VS Code detects via broken IPC pipe, removes the extension from active list, and offers recovery options. Process isolation here prevents malicious or buggy plugins from stealing data, corrupting application state, or causing complete application crashes.",
    ],
    architecturalBoundaries: [
      "Memory Isolation Boundary - Process isolation creates a hard memory boundary enforced by the operating system's memory management unit (MMU). Each process has its own virtual address space mapped to physical memory via page tables. Attempting to access memory outside the process's address space triggers a segmentation fault (SIGSEGV), immediately terminating the offending process. This boundary is the fundamental isolation mechanism: a buffer overflow in Process A cannot corrupt data structures in Process B because they exist in separate virtual address spaces. The boundary is bidirectional and symmetric—no process can read or write another's memory without OS-mediated mechanisms (ptrace debugging, /proc/mem with root). This is stronger than thread-based isolation where threads share address space and memory corruption in one thread can crash all threads. The memory boundary has performance costs: switching between processes requires TLB flush and context switch (microseconds), while switching threads is faster (nanoseconds). Cross-process data sharing requires serialization and copying, unlike threads' zero-copy shared memory.",
      "Crash Isolation Boundary - Process isolation establishes a crash boundary where failures in one process cannot crash other processes. When a process encounters fatal error (null pointer dereference, stack overflow, uncaught exception, assertion failure), the OS terminates only that process via signal (SIGSEGV, SIGABRT, SIGKILL). Other processes continue executing unaffected—they don't share fate with the crashed process. This boundary enables fault-tolerant architectures: a web server can continue serving requests even when one request handler process crashes due to malicious input. The OS guarantees resource cleanup: all memory allocated by crashed process is reclaimed, all open file descriptors are closed, all network connections are terminated. No manual cleanup is required—the kernel ensures complete resource reclamation. This is fundamentally different from thread crashes where an uncaught exception can terminate the entire process affecting all threads, and memory leaks or resource leaks in one thread persist affecting all threads until process restart.",
      "IPC Communication Boundary - Process isolation creates a communication boundary where processes cannot share memory and must use explicit inter-process communication (IPC) mechanisms. Data crossing process boundaries must be serialized (converted to bytes) then deserialized (parsed back to objects), unlike threads which access shared memory directly. This boundary manifests as IPC channels: pipes (unidirectional byte streams), sockets (bidirectional network-style communication), message queues (structured message passing), shared memory segments (requires explicit setup and synchronization). The boundary introduces latency: passing 1MB between threads via shared memory is nanoseconds (memory copy), passing 1MB between processes via Unix socket is milliseconds (serialization + kernel copy + deserialization). The boundary also provides type safety and versioning: IPC protocols (Protocol Buffers, JSON, MessagePack) enable schema evolution and backward compatibility between processes using different versions. This is impossible with raw shared memory where struct layout changes break compatibility.",
      "Security Privilege Boundary - Process isolation enables security boundaries where processes run with different user IDs, permissions, and capabilities. A web application might run main server as user 'www-data' with limited permissions, database proxy as user 'postgres' with database access, and privileged operations (opening port 80) as root with immediate drop to unprivileged user. Each process has its own security context enforced by OS: file access permissions, network bind permissions, system call filters (seccomp), Linux capabilities (CAP_NET_ADMIN, CAP_SYS_ADMIN). Compromising one process doesn't grant access to other processes' privileges—an attacker gaining code execution in web server process cannot access database credentials in database proxy process (different user, different memory space). This boundary is enforced at kernel level via UID checks and capability masks. Container runtimes extend this with namespaces (PID namespace, network namespace, mount namespace) creating virtual OS environments where processes cannot see or interact with processes in other namespaces, even if running as same UID.",
    ],
    interactsWith: [
      "bulkhead",
      "thread-pool-isolation",
      "connection-pool-isolation",
      "circuit-breaker",
      "retry",
      "timeout",
      "health-check",
      "server-isolation",
    ],
  },

  implementations: [
    {
      id: "node-cluster-module",
      name: "Node.js Cluster Module",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Node.js built-in cluster module enabling multi-process architecture where master process spawns worker processes to handle requests in isolation. Each worker runs in separate V8 instance.",
      links: {
        docs: "https://nodejs.org/api/cluster.html",
      },
      codeSnippet: `import cluster from 'cluster';
import http from 'http';
import os from 'os';

if (cluster.isPrimary) {
  const numWorkers = os.cpus().length;
  console.log(\`Primary process \${process.pid} starting \${numWorkers} workers\`);

  // Spawn worker processes
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  // Monitor worker health and restart on crash
  cluster.on('exit', (worker, code, signal) => {
    console.log(\`Worker \${worker.process.pid} died (code: \${code}, signal: \${signal})\`);
    console.log('Starting new worker to replace crashed worker');
    cluster.fork();  // Respawn with clean memory state
  });

  // Listen for messages from workers
  cluster.on('message', (worker, message) => {
    console.log(\`Message from worker \${worker.id}:\`, message);
  });

} else {
  // Worker processes run HTTP server in isolated memory
  const server = http.createServer((req, res) => {
    // Each worker handles requests independently
    // If this worker crashes, others continue serving requests

    if (req.url === '/crash') {
      // Simulate crash - only this worker dies, others unaffected
      process.exit(1);
    }

    if (req.url === '/memory-leak') {
      // Memory leak contained to this worker process
      const leak: any[] = [];
      setInterval(() => {
        leak.push(new Array(1000000).fill('leak'));
      }, 100);
    }

    res.writeHead(200);
    res.end(\`Response from worker \${process.pid}\\n\`);
  });

  server.listen(8000);
  console.log(\`Worker \${process.pid} started\`);

  // Send message to master process
  process.send?.({ type: 'worker-ready', pid: process.pid });
}`,
    },
    {
      id: "python-multiprocessing",
      name: "Python multiprocessing Module",
      type: "library",
      languages: ["python"],
      description:
        "Python standard library for creating isolated worker processes. Spawns separate Python interpreter instances with independent memory spaces and GIL.",
      links: {
        docs: "https://docs.python.org/3/library/multiprocessing.html",
      },
      codeSnippet: `from multiprocessing import Process, Queue, current_process
import time
import os

def worker_process(task_queue, result_queue):
    """Worker process executing tasks in isolated memory"""
    worker_name = current_process().name
    worker_pid = os.getpid()
    print(f"{worker_name} (PID: {worker_pid}) started")

    while True:
        try:
            task = task_queue.get(timeout=5)
            if task is None:  # Poison pill to stop worker
                break

            print(f"{worker_name} processing task: {task}")

            # Simulate work - memory allocated here is isolated to this process
            result = task['data'] * 2
            time.sleep(task.get('duration', 0.1))

            result_queue.put({
                'task_id': task['id'],
                'result': result,
                'worker_pid': worker_pid
            })

        except Exception as e:
            # Exception in worker doesn't crash other workers
            print(f"{worker_name} error: {e}")
            result_queue.put({'task_id': task['id'], 'error': str(e)})

    print(f"{worker_name} shutting down")

# Create task and result queues for IPC
task_queue = Queue()
result_queue = Queue()

# Spawn 4 worker processes
workers = []
for i in range(4):
    p = Process(target=worker_process, args=(task_queue, result_queue))
    p.start()
    workers.append(p)
    print(f"Spawned worker process {p.pid}")

# Submit tasks
for i in range(10):
    task_queue.put({'id': i, 'data': i * 10, 'duration': 0.5})

# Send poison pills to stop workers
for _ in workers:
    task_queue.put(None)

# Collect results
results = []
while len(results) < 10:
    result = result_queue.get()
    results.append(result)
    print(f"Got result: {result}")

# Wait for workers to finish
for worker in workers:
    worker.join()

print("All workers finished")`,
    },
    {
      id: "gunicorn-worker-processes",
      name: "Gunicorn Pre-Fork Worker Model",
      type: "framework",
      languages: ["python"],
      description:
        "Python WSGI HTTP server using pre-fork worker model where master process spawns multiple isolated worker processes to handle requests. Automatic worker respawn on crash.",
      links: {
        docs: "https://docs.gunicorn.org/en/stable/design.html",
      },
      codeSnippet: `# gunicorn_config.py - Gunicorn configuration for process isolation

import multiprocessing

# Number of worker processes (isolated)
workers = multiprocessing.cpu_count() * 2 + 1  # 2 workers per core + 1

# Worker class - 'sync' for separate process per request
worker_class = 'sync'

# Worker timeout - kill and respawn worker if request takes longer
timeout = 30

# Maximum requests per worker before respawn
# Prevents memory leaks from accumulating
max_requests = 1000
max_requests_jitter = 50  # Add randomness to prevent thundering herd

# Graceful timeout for worker shutdown
graceful_timeout = 30

# Worker restart strategy
# on-worker-reload: Restart worker gracefully on code changes
# on-worker-boot: Preload app in master, fork to workers (memory sharing)
preload_app = False  # Each worker loads app independently (true isolation)

# Worker lifecycle hooks
def on_starting(server):
    print(f"Gunicorn master starting with {workers} workers")

def post_fork(server, worker):
    """Called after worker process forked from master"""
    print(f"Worker {worker.pid} spawned")

def worker_exit(server, worker):
    """Called when worker exits (crash or graceful shutdown)"""
    print(f"Worker {worker.pid} exited")
    # Master automatically spawns replacement worker

def worker_abort(worker):
    """Called when worker killed due to timeout"""
    print(f"Worker {worker.pid} aborted (timeout)")

# Run Gunicorn:
# gunicorn -c gunicorn_config.py myapp:app
#
# Master process manages workers:
# - Spawns configured number of workers
# - Monitors workers via SIGCHLD
# - Respawns crashed workers automatically
# - Gracefully restarts workers on code changes (kill -HUP)
#
# Each worker:
# - Runs in isolated process
# - Has own Python interpreter and memory
# - Crashes don't affect other workers
# - Automatically respawned by master`,
    },
    {
      id: "nginx-worker-processes",
      name: "Nginx Master-Worker Process Model",
      type: "platform",
      languages: ["c"],
      description:
        "High-performance web server using master process managing multiple worker processes. Workers handle client connections in isolation with shared-nothing architecture.",
      links: {
        docs: "https://nginx.org/en/docs/ngx_core_module.html#worker_processes",
      },
      codeSnippet: `# nginx.conf - Process isolation configuration

# Master process runs as root (privileged port binding)
# Workers run as unprivileged user 'www-data'
user www-data;

# Number of isolated worker processes
# Each worker handles subset of connections independently
worker_processes auto;  # One per CPU core

# Worker process configuration
worker_rlimit_nofile 65536;  # Max file descriptors per worker

events {
    # Each worker accepts connections independently
    # No shared state between workers
    worker_connections 1024;
    use epoll;  # Efficient event handling
}

http {
    # Workers process HTTP requests in isolation
    # Crash in one worker doesn't affect others

    server {
        listen 80;
        server_name example.com;

        location / {
            # Each worker handles requests independently
            # Memory leaks contained to worker process
            proxy_pass http://backend;
        }
    }
}

# Master process responsibilities:
# - Reads and validates configuration
# - Binds to privileged ports (80, 443) as root
# - Spawns worker processes with dropped privileges (www-data)
# - Monitors workers via SIGCHLD
# - Gracefully restarts workers on config reload (kill -HUP)
# - Respawns crashed workers automatically
#
# Worker process responsibilities:
# - Accept and process client connections
# - Run in isolated memory space (no shared memory with other workers)
# - Handle crashes gracefully (connection fails, worker respawns, client retries)
# - Exit and respawn periodically to prevent memory leak accumulation
#
# Isolation benefits:
# - Worker crash only affects connections handled by that worker
# - Other workers continue serving traffic
# - Zero-downtime deployments via rolling worker restarts
# - Security: workers run unprivileged, can't bind privileged ports`,
    },
    {
      id: "erlang-supervisor",
      name: "Erlang/OTP Supervisor Process Tree",
      type: "framework",
      languages: ["erlang", "elixir"],
      description:
        "Erlang's supervisor pattern for managing isolated process hierarchies with automatic restart on failure. Each process runs in isolated memory with message passing.",
      links: {
        docs: "https://www.erlang.org/doc/design_principles/sup_princ.html",
      },
      codeSnippet: `% Erlang supervisor managing isolated worker processes
-module(worker_supervisor).
-behaviour(supervisor).

-export([start_link/0, init/1]).

start_link() ->
    supervisor:start_link({local, ?MODULE}, ?MODULE, []).

init([]) ->
    % Supervisor strategy: one_for_one
    % If worker crashes, only that worker is restarted
    % Other workers continue unaffected
    SupFlags = #{
        strategy => one_for_one,      % Isolate failures
        intensity => 5,               % Max 5 restarts
        period => 60                  % Within 60 seconds
    },

    % Define isolated worker processes
    WorkerSpec = #{
        id => worker,
        start => {worker_process, start_link, []},
        restart => permanent,         % Always restart on crash
        shutdown => 5000,            % Graceful shutdown timeout
        type => worker,
        modules => [worker_process]
    },

    % Spawn 10 isolated worker processes
    Workers = [WorkerSpec#{id => {worker, N}} || N <- lists:seq(1, 10)],

    {ok, {SupFlags, Workers}}.

% Worker process - isolated execution
-module(worker_process).
-export([start_link/0, loop/0]).

start_link() ->
    Pid = spawn_link(?MODULE, loop, []),
    {ok, Pid}.

loop() ->
    receive
        {work, Data} ->
            % Process work in isolated memory
            % If crash occurs, only this process dies
            Result = process_work(Data),
            % Send result via message passing (no shared memory)
            io:format("Worker ~p processed: ~p~n", [self(), Result]),
            loop();

        crash ->
            % Simulate crash - supervisor will restart this process
            exit(crash);

        stop ->
            ok
    end.

% Elixir equivalent with GenServer
defmodule WorkerProcess do
  use GenServer

  def start_link(args) do
    GenServer.start_link(__MODULE__, args)
  end

  def init(_args) do
    {:ok, %{}}
  end

  def handle_call({:work, data}, _from, state) do
    # Work processed in isolated process
    # Crash only affects this process
    result = process_work(data)
    {:reply, result, state}
  end

  defp process_work(data), do: data * 2
end`,
    },
  ],

  usedInSystems: [
    {
      systemId: "chrome-multi-process",
      systemName: "Google Chrome Multi-Process Architecture",
      howUsed:
        "Chrome pioneered multi-process browser architecture where each tab runs in an isolated renderer process separate from the main browser process. When a user opens 10 tabs, Chrome spawns 10+ renderer processes (one per tab, plus processes for extensions, plugins, and GPU). Each renderer process executes in a restrictive sandbox with limited OS permissions—it cannot access filesystem, network, or other processes directly. All privileged operations (network requests, file access, database queries) go through the main browser process via IPC (Chromium's Mojo framework). If a tab encounters malicious JavaScript attempting buffer overflow or runs infinite loop, only that renderer process crashes showing 'Aw, Snap!' error. Other 9 tabs, browser UI, bookmarks, and history remain functional. The main browser process detects renderer crash via SIGCHLD, removes crashed tab from UI, and user can reload to spawn fresh renderer with clean memory. Chrome's process isolation prevents 99% of exploits from escaping the renderer sandbox—even if attacker gains arbitrary code execution in renderer, they're confined to sandboxed process without filesystem or network access. Pattern composition: Process Isolation + Sandbox (seccomp-bpf syscall filtering) + IPC (Mojo message passing) + Automatic Restart (crashed renderer respawn). Impact: Reduced browser crashes from ~10 per day (single-process Firefox 2.0 era) to ~0.1 per day; enabled security architecture where renderer exploits cannot access user data without secondary browser process exploit; improved stability allowing browser to survive individual tab crashes instead of requiring full browser restart.",
      source:
        "https://www.chromium.org/developers/design-documents/multi-process-architecture/",
    },
    {
      systemId: "gunicorn-worker-isolation",
      systemName: "Instagram's Gunicorn Deployment",
      howUsed:
        "Instagram's Django application runs on Gunicorn with pre-fork worker model where each request is handled by isolated worker process. Instagram deploys Gunicorn with 16 worker processes per server (matching 16 CPU cores). Each worker is a complete Python interpreter instance with its own Django application code, database connections, and memory space. When a worker processes a request that triggers Python memory leak (unreleased references, circular references), the memory leak is contained to that worker process. Gunicorn master monitors memory usage per worker and enforces max_requests=1000—after 1000 requests, worker gracefully finishes current request then exits, and master spawns replacement worker with clean memory state. This prevents memory leaks from accumulating over days. If worker crashes due to uncaught exception or segfault (from C extension like Pillow image processing), only that worker dies—other 15 workers continue serving traffic and master respawns crashed worker within milliseconds. Instagram's load balancers (HAProxy) detect failed requests and retry to healthy workers. Pattern composition: Process Isolation (Gunicorn workers) + Automatic Respawn (master monitors SIGCHLD) + Graceful Restart (max_requests recycling) + Load Balancer Retry (HAProxy). Impact: Eliminated application-wide crashes from individual request bugs; reduced memory usage by 40% through aggressive worker recycling preventing leak accumulation; achieved 99.99% request success rate despite processing 100,000 requests/second with occasional worker crashes.",
      source:
        "https://instagram-engineering.com/web-service-efficiency-at-instagram-with-python-4976d078e366",
    },
    {
      systemId: "kubernetes-pod-isolation",
      systemName: "Kubernetes Pod Process Isolation",
      howUsed:
        "Kubernetes implements process isolation at two levels: pods (group of containers) and containers (isolated processes). A typical microservices deployment might have 100 pods, each running 1-3 containers. Each container runs in its own process with isolated memory space, CPU quota (cgroups), and PID namespace (container cannot see host processes). When a payment service container crashes due to out-of-memory or application panic, Kubernetes kubelet detects container exit (monitoring via cgroup notifications), logs the crash, and restarts the container according to restart policy (Always, OnFailure, Never). Other 99 pods and other containers in the same pod continue unaffected. If payment container consistently crash-loops (crashes immediately after restart), kubelet implements exponential backoff (restart after 10s, 20s, 40s, capped at 5 minutes) preventing resource thrashing. Kubernetes also implements pod-level isolation: pods on same node cannot access each other's memory, filesystem, or network ports (unless explicitly exposed). This prevents cross-pod memory corruption and enables multi-tenant clusters where different teams' services run on shared infrastructure without security interference. Pattern composition: Process Isolation (containers) + Namespace Isolation (PID, network, mount) + Resource Limits (cgroups memory, CPU) + Health Checks (liveness/readiness probes) + Automatic Restart (crashLoopBackoff policy). Impact: Enabled infrastructure consolidation with 10x improved resource utilization (100 services on 10 nodes vs 100 dedicated nodes); reduced blast radius of failures from entire cluster to single pod; prevented memory leaks in one service from causing OOM kills in co-located services through cgroup memory limits.",
      source: "https://kubernetes.io/docs/concepts/workloads/pods/",
    },
  ],

  references: [
    {
      title: "Chromium Multi-Process Architecture",
      url: "https://www.chromium.org/developers/design-documents/multi-process-architecture/",
      type: "documentation",
      author: "Chromium Project",
    },
    {
      title: "Node.js Cluster Module Documentation",
      url: "https://nodejs.org/api/cluster.html",
      type: "documentation",
      author: "Node.js Foundation",
    },
    {
      title: "Gunicorn Design - Worker Model",
      url: "https://docs.gunicorn.org/en/stable/design.html",
      type: "documentation",
      author: "Gunicorn",
    },
    {
      title: "Erlang Supervisor Behaviour",
      url: "https://www.erlang.org/doc/design_principles/sup_princ.html",
      type: "documentation",
      author: "Ericsson",
    },
    {
      title: "Instagram - Web Service Efficiency with Python",
      url: "https://instagram-engineering.com/web-service-efficiency-at-instagram-with-python-4976d078e366",
      type: "article",
      author: "Instagram Engineering",
    },
  ],

  philosophy: {
    coreProblem:
      "Single-process architectures allow bugs, crashes, or memory corruption in one component to bring down the entire application, and memory leaks accumulate indefinitely requiring full application restart affecting all users",
    designPrinciple:
      "Run components in separate OS processes with isolated memory spaces, communicating via IPC rather than shared memory, enabling independent failure and automatic resource reclamation on crash",
    historicalContext:
      "Process isolation became critical with Chrome's multi-process architecture (2008) solving Firefox's single-process crashes. Erlang/OTP pioneered supervisor pattern for fault-tolerant telecom systems (1986). Modern containers (Docker 2013, Kubernetes 2014) made process isolation standard practice for microservices.",
    alternativesRejected: [
      "Single-process multithreading - allows crashes and memory corruption to affect entire application",
      "Shared memory between processes - defeats isolation benefit and introduces complexity",
      "Manual resource cleanup - error-prone and incomplete compared to OS-enforced reclamation",
      "No automatic restart - requires manual intervention reducing availability",
    ],
    mentalModel:
      "Process isolation is like compartments in a ship: if one compartment floods due to hull breach, watertight doors prevent flooding from spreading to other compartments—the ship remains afloat even with one compartment damaged",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Master["Master Process (Orchestrator)"]
        Manager[Process Manager]
    end

    subgraph OS["Operating System (Memory Isolation Layer)"]
        MMU[Memory Management Unit]
    end

    subgraph Worker1["Worker Process 1<br/>(PID: 1001)"]
        Mem1[Isolated Memory Space<br/>Heap, Stack, Code]
        Work1[Request Handler]
    end

    subgraph Worker2["Worker Process 2<br/>(PID: 1002)"]
        Mem2[Isolated Memory Space<br/>Heap, Stack, Code]
        Work2[Image Processor]
    end

    subgraph Worker3["Worker Process 3<br/>(PID: 1003)"]
        Mem3[Isolated Memory Space<br/>Heap, Stack, Code]
        Work3[Email Sender]
    end

    Manager -->|Spawn| Worker1
    Manager -->|Spawn| Worker2
    Manager -->|Spawn| Worker3

    Manager <-->|IPC<br/>(Sockets/Pipes)| Worker1
    Manager <-->|IPC<br/>(Sockets/Pipes)| Worker2
    Manager <-->|IPC<br/>(Sockets/Pipes)| Worker3

    MMU -->|Enforce Isolation| Worker1
    MMU -->|Enforce Isolation| Worker2
    MMU -->|Enforce Isolation| Worker3

    Worker2 -.->|❌ CRASH<br/>(Segfault)| Manager
    Manager -.->|✓ Respawn<br/>Clean State| Worker2

    style Worker2 fill:#ffcccc
    style Worker1 fill:#ccffcc
    style Worker3 fill:#ccffcc
    style MMU fill:#e6f3ff`,
    realWorldAnalogy:
      "Process isolation is like separate shipping containers on a cargo ship: if chemicals leak in one container, the steel walls contain the spill to that container—other containers with electronics, food, and textiles remain uncontaminated and safely delivered",
    useCases: [
      {
        domain: "Web Browsers",
        scenario:
          "Chrome runs each tab in isolated process preventing crashes and exploits from affecting other tabs or browser UI",
        patternRole:
          "Provides fault isolation and security sandbox preventing tab crashes from browser-wide failures",
        companies: ["Google Chrome", "Firefox", "Safari", "Edge"],
      },
      {
        domain: "Web Application Servers",
        scenario:
          "Gunicorn, Unicorn, and Puma run worker processes in isolation preventing request bugs from crashing entire server",
        patternRole:
          "Enables graceful degradation where individual worker crashes don't take down all request handling",
        companies: ["Instagram", "Shopify", "GitHub", "Basecamp"],
      },
      {
        domain: "Microservices Orchestration",
        scenario:
          "Kubernetes runs each microservice in isolated container process with memory limits and automatic restart",
        patternRole:
          "Prevents service failures from cascading and enables automatic recovery with clean state",
        companies: ["Google", "Netflix", "Airbnb", "Spotify"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "isolation",
    "bulkhead",
    "process-management",
    "crash-recovery",
    "memory-safety",
  ],
  difficulty: "advanced",
};
