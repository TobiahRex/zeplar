import type { Pattern } from "../schema";

export const deadlineScheduling: Pattern = {
  id: "deadline-scheduling",
  slug: "deadline-scheduling",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🔝 Prioritization → 🎯 Deadline Scheduling",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Prioritization",
    level: 4,
  },

  concept: {
    name: "Deadline Scheduling",
    emoji: "🎯",
    tagline: "Earliest deadline first",
    definition:
      "Deadline Scheduling prioritizes tasks based on their deadlines, executing the task with the nearest deadline first to maximize the number of deadlines met. Think of it like a student doing homework—you tackle the assignment due tomorrow before the one due next week, ensuring you meet as many deadlines as possible. In a task queue, jobs arrive with deadlines (absolute timestamps or relative time limits). The scheduler maintains a priority queue ordered by deadline, always processing the task expiring soonest. For example, three tasks arrive: Task A (deadline in 10 minutes), Task B (deadline in 5 minutes), Task C (deadline in 15 minutes). The scheduler executes B, then A, then C, ensuring maximum deadline compliance. This is provably optimal for single-processor scheduling: if any algorithm can meet all deadlines, Earliest Deadline First (EDF) will meet them too. The pattern applies to real-time systems, batch processing with SLAs, request queues with timeouts, and any scenario where tasks have explicit time constraints.",
    problemSolved:
      "Fixed-priority and FIFO scheduling fail to optimize for deadline compliance, often missing critical deadlines while processing less urgent work. A FIFO queue might process a task with a distant deadline while a critical task with an imminent deadline waits, causing SLA violations. Static priority assignments cannot adapt to changing urgency as deadlines approach. Deadline Scheduling solves this by dynamically prioritizing based on urgency, ensuring tasks closest to deadline violation execute first. This maximizes on-time completion rate and minimizes deadline misses. For example, an API with 100ms SLA requirements uses deadline scheduling to process expiring requests before newer ones with more time remaining. Critical for real-time systems, job schedulers with SLA guarantees, request processing with timeout requirements, and resource allocation where late completion has no value.",
    tradeoffs: {
      pros: [
        "Maximizes number of deadlines met with provably optimal scheduling for feasible workloads on single processor",
        "Adapts dynamically to changing urgency as deadlines approach, unlike static priority schemes",
        "Provides predictable behavior where urgency is objectively measured by time-to-deadline",
        "Minimizes SLA violations and late task penalties in time-sensitive systems",
      ],
      cons: [
        "Can cause starvation of tasks with distant deadlines if continuous stream of urgent tasks arrives",
        "Requires overhead to maintain priority queue sorted by deadlines and update priorities continuously",
        "Does not account for task execution time—may miss deadline even when scheduled first if work takes too long",
        "Can lead to thrashing if workload is infeasible, repeatedly starting tasks that will miss deadlines anyway",
      ],
    },
    relatedPatterns: ["priority-queue", "aging", "rate-limiting", "timeout"],
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
      id: "deadline-scheduling-ts-basic",
      language: "typescript",
      title: "TODO: Deadline Scheduling Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Deadline Scheduling
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
