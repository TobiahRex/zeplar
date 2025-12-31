import type { Pattern } from "../schema";

export const threadPooling: Pattern = {
  id: "thread-pooling",
  slug: "thread-pooling",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 🏗️ Structural → 🧵 Thread Pooling",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Structural",
    level: 4,
  },

  concept: {
    name: "Thread Pooling",
    emoji: "🧵",
    tagline: "Reuse worker threads",
    definition:
      "Thread pooling is a performance optimization that maintains a pool of pre-created reusable worker threads that execute tasks from a queue, eliminating the overhead of creating and destroying threads for each operation. Think of it like a taxi stand—instead of calling a new taxi for every ride (expensive and slow), pre-positioned taxis wait at the stand ready to immediately serve customers. For example, a web server handling 10,000 requests per second with thread pooling creates 100 worker threads at startup. Each incoming request is queued as a task, and idle threads pull tasks from the queue, execute them, and return to the pool. This avoids creating 10,000 threads per second (which would consume 10GB+ memory and overwhelm the OS scheduler). Thread creation typically costs 1-2ms and 1-8MB of memory per thread—with thread pooling, this overhead is paid once at initialization rather than per request. The pattern is fundamental to high-performance servers like Apache Tomcat, Nginx, and programming language standard libraries (Java ExecutorService, Python ThreadPoolExecutor, C# ThreadPool).",
    problemSolved:
      "Creating a new thread for every task creates severe performance overhead and resource exhaustion. Thread creation requires system calls, stack allocation (typically 1-8MB), scheduler registration, and thread-local storage initialization—costing 1-2ms per thread. For a service handling 10,000 requests per second, creating threads per-request consumes 10-20 seconds of CPU time per second (impossible) and creates 10,000 threads consuming 10-80GB of memory. The OS scheduler cannot efficiently manage thousands of threads, causing context switching overhead that degrades performance. Additionally, thread destruction requires cleanup and deallocation. Thread pooling solves this by pre-creating a fixed number of threads (e.g., 100) that are reused for all requests. Request handling time drops from 1-2ms thread creation overhead + execution time to just execution time. Memory usage is constant at 100-800MB regardless of request volume. The OS scheduler manages only 100 threads efficiently.",
    tradeoffs: {
      pros: [
        "Eliminates thread creation/destruction overhead of 1-2ms per operation, improving throughput by 10-100x for short-lived tasks",
        "Provides predictable memory usage with fixed thread count rather than unbounded growth with per-task thread creation",
        "Prevents OS scheduler thrashing by maintaining constant thread count (e.g., 100) rather than overwhelming scheduler with thousands of threads",
        "Enables load shedding by queuing excess tasks when all threads are busy rather than creating unbounded threads and crashing",
      ],
      cons: [
        "Introduces queueing delays when all pool threads are busy—tasks wait in queue rather than starting immediately, increasing latency",
        "Requires careful tuning of pool size: too small causes task queueing and delays, too large wastes memory and causes context switching overhead",
        "Can cause thread starvation if pool threads block indefinitely on I/O or locks, preventing other tasks from executing",
        "Adds complexity in managing shared state between tasks since threads are reused, requiring careful cleanup of thread-local storage",
      ],
    },
    relatedPatterns: [
      "worker-pools",
      "multi-threading",
      "object-pooling",
      "connection-pooling",
      "thread-pool-isolation",
      "fork-join",
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
      id: "thread-pooling-ts-basic",
      language: "typescript",
      title: "TODO: Thread Pooling Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Thread Pooling
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
