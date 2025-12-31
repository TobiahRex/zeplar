import type { Pattern } from "../schema";

export const forkJoin: Pattern = {
  id: "fork-join",
  slug: "fork-join",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚡ Parallelism → 🍴 Fork-Join",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Parallelism",
    level: 4,
  },

  concept: {
    name: "Fork-Join",
    emoji: "🍴",
    tagline: "Divide and conquer",
    definition:
      "Fork-Join splits a large task into smaller independent subtasks that execute in parallel (fork), then combines their results once all complete (join). Think of it like a group project where the team divides the work, each member completes their part independently, then everyone reconvenes to merge the final presentation. In code, processing a 1-million-item array might fork into 4 tasks of 250,000 items each, process them in parallel on different CPU cores, then join the results. For example, calculating the sum of 1 million numbers: fork into 4 threads computing partial sums (Thread 1: sum of 0-250K, Thread 2: sum of 250K-500K, etc.), each thread works independently without synchronization, join waits for all threads to complete, final result is the sum of partial sums. The pattern leverages multi-core processors to achieve near-linear speedup: 4 cores complete the work in ~25% of single-threaded time. Modern implementations use work-stealing queues where idle threads steal work from busy threads, balancing load dynamically.",
    problemSolved:
      "Single-threaded processing of large datasets wastes available CPU cores, leaving 7 of 8 cores idle while one core works. Sequential processing of independent tasks takes N times longer than necessary when N cores are available. Traditional threading models with manual thread management are error-prone and complex. Fork-Join solves this by automatically parallelizing divide-and-conquer algorithms, utilizing all CPU cores for embarrassingly parallel workloads. Processing 10 million records sequentially takes 10 seconds, but fork-joining across 8 cores reduces this to ~1.5 seconds (80% reduction). This is critical for data processing pipelines, batch ETL jobs, image processing, scientific computing, and any CPU-bound work that can be decomposed into independent subtasks.",
    tradeoffs: {
      pros: [
        "Achieves near-linear speedup on multi-core processors by utilizing all available CPU cores simultaneously",
        "Simplifies parallel programming with higher-level abstraction hiding thread management complexity",
        "Work-stealing optimizes load balancing, preventing idle cores when work distribution is uneven",
        "Recursive decomposition naturally fits divide-and-conquer algorithms like merge sort and parallel aggregations",
      ],
      cons: [
        "Overhead from task creation and synchronization can exceed benefits for small datasets or cheap operations",
        "Requires tasks to be independent with no shared mutable state, limiting applicability to certain problems",
        "Join phase blocks until all subtasks complete, so slowest subtask determines overall completion time",
        "Does not help I/O-bound workloads where threads spend time waiting rather than computing",
      ],
    },
    relatedPatterns: [
      "map-reduce",
      "work-stealing",
      "parallel-streams",
      "scatter-gather",
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
      id: "fork-join-ts-basic",
      language: "typescript",
      title: "TODO: Fork-Join Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Fork-Join
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
