import type { Pattern } from "../schema";

export const lotteryScheduling: Pattern = {
  id: "lottery-scheduling",
  slug: "lottery-scheduling",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → ⚖️ Fairness → 🎟️ Lottery Scheduling",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Fairness",
    level: 4,
  },

  concept: {
    name: "Lottery Scheduling",
    emoji: "🎟️",
    tagline: "Probabilistic fairness",
    definition:
      "Lottery Scheduling allocates CPU time probabilistically by giving each process tickets and randomly drawing a winning ticket to determine which process runs next, providing proportional fairness with a simple elegant mechanism. Think of it like a raffle where processes hold tickets—more important processes get more tickets, increasing their chance of winning each draw. In a scheduler, Process A gets 75 tickets (high priority), Process B gets 25 tickets (low priority), total pool is 100 tickets. Each scheduling decision draws a random number 0-99: if it lands in 0-74, Process A runs; 75-99, Process B runs. Over many scheduling decisions, A gets approximately 75% CPU time, B gets 25%, achieving proportional fairness without complex accounting. Tickets can be transferred (a process donates tickets to another it's waiting on, solving priority inversion) or hierarchically allocated (user gets 1000 tickets to distribute among their processes).",
    problemSolved:
      "Traditional priority scheduling requires complex calculation and tracking of process priorities, often leading to starvation where low-priority processes never run. Fair-share schedulers maintain intricate accounting of historical CPU usage, adding overhead and complexity. Static allocations cannot adapt to changing workload needs. Lottery Scheduling solves this with an extremely simple algorithm: assign tickets, draw random number, run winner. Proportional fairness emerges naturally from probability over time without tracking history. Priority inversion is easily solved by ticket transfer. Adding or removing processes just adjusts the ticket pool—no rebalancing needed. This is ideal for systems requiring proportional resource sharing, teaching operating systems concepts, and scenarios where simplicity and flexibility outweigh deterministic guarantees.",
    tradeoffs: {
      pros: [
        "Extremely simple implementation requiring only random number generation and ticket counting",
        "Naturally achieves proportional fairness without complex historical tracking or priority calculations",
        "Flexible ticket transfers solve priority inversion by letting processes donate tickets to blockers",
        "Responsive to changing priorities by simply adjusting ticket allocation without rebalancing overhead",
      ],
      cons: [
        "Probabilistic fairness means short-term unfairness is possible, only converging to fair over time",
        "Requires many scheduling decisions to approach proportional fairness, unsuitable for coarse-grain scheduling",
        "No hard real-time guarantees as any process could theoretically never be selected in finite time",
        "Poor cache locality as random selection jumps between processes rather than favoring recently-run ones",
      ],
    },
    relatedPatterns: [
      "weighted-fair-queuing",
      "max-min-fairness",
      "priority-scheduling",
      "proportional-share",
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
      id: "lottery-scheduling-ts-basic",
      language: "typescript",
      title: "TODO: Lottery Scheduling Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Lottery Scheduling
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
