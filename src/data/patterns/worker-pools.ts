import type { Pattern } from "../schema";

export const workerPools: Pattern = {
  id: "worker-pools",
  slug: "worker-pools",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚡ Parallelism → 👷 Worker Pools",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Parallelism",
    level: 4,
  },

  concept: {
    name: "Worker Pools",
    emoji: "👷",
    tagline: "Fixed thread count",
    definition:
      "Worker pools are a concurrency pattern that maintains a fixed set of worker threads or processes that pull tasks from a shared queue and execute them in parallel, providing controlled parallelism without the overhead of per-task thread creation. Think of it like a construction crew—you have 10 workers on site who continuously pull tasks from a job queue (install windows, lay bricks, paint walls) rather than hiring a new worker for each individual task. For example, a web server might maintain a pool of 50 worker threads that handle incoming HTTP requests. As requests arrive, they're queued, and idle workers dequeue and process them. With 1,000 concurrent requests, the 50 workers handle them in batches rather than creating 1,000 threads. Worker pools differ from thread pools in terminology: thread pools emphasize thread reuse, while worker pools emphasize the worker-queue pattern, but they're conceptually similar. The pattern is fundamental to servers (Apache workers, Node.js cluster workers), background job processors (Sidekiq, Celery), and parallel computing frameworks (MapReduce workers).",
    problemSolved:
      "Creating a thread or process per task creates severe resource overhead and lacks parallelism control. For example, a background job system processing 10,000 jobs by spawning 10,000 processes consumes 10-80GB of memory (1-8MB per process) and overwhelms the OS scheduler with context switching overhead. Additionally, CPU-bound work on a 16-core machine gets no benefit from 10,000 threads—only 16 can execute simultaneously, so 9,984 threads just waste memory and create contention. Worker pools solve this by pre-creating a fixed number of workers matched to system capacity (e.g., 16 workers for 16 cores). Jobs queue when all workers are busy rather than creating unbounded processes. Memory usage is constant (16 × 8MB = 128MB) regardless of job count. The system achieves maximum CPU utilization with 16 parallel workers without thrashing. Queue depth provides visibility into load and enables backpressure.",
    tradeoffs: {
      pros: [
        "Provides controlled parallelism by limiting worker count to match CPU cores or other resource constraints, maximizing utilization without thrashing",
        "Eliminates thread/process creation overhead since workers are pre-created and reused, improving throughput by 10-100x for short tasks",
        "Enables bounded resource usage with predictable memory footprint and scheduler load regardless of task queue depth",
        "Provides natural backpressure through queue depth metrics, allowing load shedding or rate limiting when queue grows too large",
      ],
      cons: [
        "Creates queueing delays when all workers are busy—tasks wait in queue rather than starting immediately, increasing latency",
        "Requires careful tuning of pool size: too small underutilizes cores and creates long queues, too large causes context switching overhead",
        "Can lead to deadlock if workers block waiting for other workers' results, exhausting the pool with interdependent tasks",
        "Complicates debugging with tasks executing asynchronously at unpredictable times on arbitrary workers rather than deterministic ordering",
      ],
    },
    relatedPatterns: [
      "thread-pooling",
      "multi-threading",
      "fork-join",
      "connection-pooling",
      "object-pooling",
      "bulkhead",
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
      id: "worker-pools-ts-basic",
      language: "typescript",
      title: "TODO: Worker Pools Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Worker Pools
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
