import type { Pattern } from "../schema";

export const shortestJobFirst: Pattern = {
  id: "shortest-job-first",
  slug: "shortest-job-first",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🔝 Prioritization → ⏱️ Shortest Job First",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Prioritization",
    level: 4,
  },

  concept: {
    name: "Shortest Job First",
    emoji: "⏱️",
    tagline: "Minimize wait time",
    definition:
      "Shortest Job First (SJF) is a scheduling algorithm that processes tasks in order of their estimated execution time, completing the quickest jobs before longer ones to minimize average wait time. Think of it like an express lane at a grocery store—customers with 5 items checkout before those with full shopping carts, getting more people through the system faster. For example, a web server processing a mix of requests might prioritize lightweight health checks (10ms) over expensive report generation (5000ms). If both arrive simultaneously, serving the health check first completes it in 10ms versus waiting 5010ms if the report went first—a 500x improvement. With 100 fast requests and 1 slow request in the queue, SJF completes the 100 fast requests in their combined execution time, while FIFO forces them all to wait behind the single slow request. This provably minimizes average wait time across all jobs. The challenge is accurately estimating job duration—systems use historical data, request metadata, or explicit client hints to predict execution time.",
    problemSolved:
      "First-in-first-out scheduling treats all jobs equally regardless of execution time, causing many short jobs to wait behind few long jobs, dramatically increasing average wait time. For example, a batch processing queue with 1,000 jobs where 990 take 100ms each and 10 take 10 seconds each. With FIFO, if a 10-second job arrives first, it delays all 990 fast jobs by 10 seconds each—wasting 9,900 seconds of cumulative wait time. The average wait time is terrible despite most jobs being fast. SJF solves this by processing the 990 fast jobs first, completing them all in 99 seconds total. Only the 10 slow jobs wait longer, but since there are far fewer of them, average wait time across all 1,000 jobs drops dramatically. Mathematically, SJF is provably optimal for minimizing average wait time. This is critical for responsive systems where many users wait for quick operations.",
    tradeoffs: {
      pros: [
        "Provably minimizes average wait time across all jobs compared to any other scheduling algorithm, optimizing for overall system responsiveness",
        "Dramatically improves tail latencies for short jobs that would otherwise wait behind long jobs, often reducing P99 latencies by 10-100x",
        "Maximizes throughput by completing many small tasks quickly rather than getting stuck processing few large tasks",
        "Improves user experience for interactive systems where most requests are fast (50-100ms) but occasional heavy queries (10+ seconds) would block them",
      ],
      cons: [
        "Can cause starvation of long-running jobs that perpetually wait as new shorter jobs keep arriving, requiring aging or timeout mechanisms",
        "Requires accurate prediction of job execution time which is difficult or impossible in many scenarios, and wrong estimates defeat the optimization",
        "Adds scheduling overhead to estimate and sort jobs by execution time, especially with priority queue data structures for large job counts",
        "May violate fairness expectations where earlier arrivals expect service before later ones, creating perception of unfair treatment for long jobs",
      ],
    },
    relatedPatterns: [
      "priority-preemption",
      "multi-level-queue",
      "aging",
      "deadline-scheduling",
      "rate-limiting",
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
      id: "shortest-job-first-ts-basic",
      language: "typescript",
      title: "TODO: Shortest Job First Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Shortest Job First
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
