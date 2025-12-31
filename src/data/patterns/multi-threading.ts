import type { Pattern } from "../schema";

export const multiThreading: Pattern = {
  id: "multi-threading",
  slug: "multi-threading",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚡ Parallelism → 🧵 Multi-threading",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Parallelism",
    level: 4,
  },

  concept: {
    name: "Multi-threading",
    emoji: "🧵",
    tagline: "OS-level threads",
    definition:
      "Multi-threading is a programming technique that uses multiple operating system threads within a single process to execute tasks concurrently, enabling parallel execution on multi-core processors. Think of it like a kitchen with multiple chefs working simultaneously—one chops vegetables while another stirs the sauce and a third prepares dessert, all sharing the same kitchen equipment and ingredients. For example, a web server might spawn a new thread for each incoming HTTP request, allowing it to handle 1000 concurrent connections by running request handlers in parallel across multiple CPU cores. Each thread has its own execution stack and program counter but shares the process's memory space, heap, and file descriptors. The operating system scheduler distributes threads across available CPU cores and handles context switching. Multi-threading is particularly effective for I/O-bound tasks (network requests, disk reads) where threads can continue working while others wait, and for CPU-bound tasks on multi-core systems where parallel execution provides proportional speedup.",
    problemSolved:
      "Single-threaded programs can only execute one operation at a time, wasting CPU resources when waiting for I/O operations and failing to utilize multi-core processors. For example, a single-threaded web server handling a database query must sit idle during the 50ms network round-trip to the database, unable to process other requests. With 20 concurrent requests, response time degrades to 1000ms (20 × 50ms) as requests queue up. Multi-threading solves this by allowing each request to run in its own thread—while one thread waits for database I/O, other threads actively process CPU-bound work or their own I/O. The same server with 8 threads can handle 20 requests in approximately 150ms total (3 batches of 8 concurrent threads). Additionally, CPU-bound tasks like image processing can achieve near-linear speedup on multi-core systems: processing 8 images on an 8-core CPU takes roughly the same time as processing 1 image single-threaded.",
    tradeoffs: {
      pros: [
        "Enables true parallel execution on multi-core processors, achieving near-linear speedup for CPU-bound tasks (8 cores can process 8x more work simultaneously)",
        "Improves responsiveness for I/O-bound applications by allowing other threads to work while some threads wait for network, disk, or database operations",
        "Shares memory space between threads making inter-thread communication fast and efficient through shared data structures without expensive serialization",
        "Leverages OS scheduling and thread management, distributing threads across CPU cores automatically without manual core affinity management",
      ],
      cons: [
        "Introduces complex synchronization challenges with race conditions, deadlocks, and data corruption requiring careful use of locks, mutexes, or atomic operations",
        "Creates significant overhead per thread (1-8MB memory for stack, context switching costs) making thousands of threads impractical unlike lightweight coroutines or async I/O",
        "Makes debugging extremely difficult due to non-deterministic thread interleaving, race conditions that appear intermittently, and complex stack traces across threads",
        "Can experience diminishing returns or performance degradation beyond core count due to context switching overhead, lock contention, and cache coherency costs",
      ],
    },
    relatedPatterns: [
      "thread-pooling",
      "worker-pools",
      "fork-join",
      "process-isolation",
      "cooperative-yielding",
      "time-slicing",
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
      id: "multi-threading-ts-basic",
      language: "typescript",
      title: "TODO: Multi-threading Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Multi-threading
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
