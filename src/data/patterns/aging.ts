import type { Pattern } from "../schema";

export const aging: Pattern = {
  id: "aging",
  slug: "aging",
  corpusPath: "⚡ PERFORMANCE → 📋 Work Scheduling → ⚖️ Fairness → ⏳ Aging",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Fairness",
    level: 4,
  },

  concept: {
    name: "Aging",
    emoji: "⏳",
    tagline: "Increase priority over time",
    definition:
      "Aging gradually increases the priority of waiting tasks over time to prevent indefinite starvation in priority-based scheduling systems. Think of it like a restaurant where regular customers eventually get moved to the front of the line if they have waited too long, ensuring everyone gets served eventually. In a task scheduler, a low-priority background job might start with priority 10, but gain +1 priority every 5 minutes it waits. After 30 minutes, it has priority 16, potentially outranking newer high-priority tasks (priority 15). This creates a fairness mechanism where no task waits indefinitely, even if higher-priority work keeps arriving. The aging rate is typically configurable: aggressive aging (fast priority increase) favors fairness, while conservative aging (slow increase) favors priority differentiation. For example, a print queue might age print jobs by 1 priority level per minute, ensuring that a large low-priority print eventually executes even during busy periods. The pattern applies to any priority-based system: CPU scheduling, message queues, request routing, or resource allocation.",
    problemSolved:
      "Priority-based scheduling can cause starvation where low-priority tasks never execute because higher-priority work continuously arrives. This creates unbounded wait times and unpredictable behavior for background jobs, violating fairness guarantees. For instance, in a system that prioritizes customer-facing requests over background analytics, analytics jobs might never run during peak hours if new customer requests arrive faster than they can be processed. Aging solves this by ensuring every task eventually reaches high enough priority to execute, providing bounded wait times even under continuous high-priority load. This prevents operational disasters like billing jobs that never run, data exports that time out, or maintenance tasks that get perpetually deferred. Critical for systems with service level agreements that guarantee eventual processing, not just prioritized ordering.",
    tradeoffs: {
      pros: [
        "Prevents starvation by ensuring all tasks eventually execute regardless of continuous high-priority arrivals",
        "Provides bounded wait times with predictable upper limits based on aging rate configuration",
        "Maintains priority differentiation while adding fairness guarantees, balancing responsiveness and throughput",
        "Simple to implement and reason about compared to complex fair queuing algorithms",
      ],
      cons: [
        "Can violate strict priority ordering when aged low-priority tasks overtake recent high-priority ones",
        "Adds computational overhead to track wait times and recalculate priorities for every waiting task",
        "Requires careful tuning of aging rate to balance fairness versus priority differentiation goals",
        "May cause priority inversion where old low-priority work blocks urgent new high-priority requests",
      ],
    },
    relatedPatterns: [
      "priority-queue",
      "lottery-scheduling",
      "max-min-fairness",
      "deadline-scheduling",
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
      id: "aging-ts-basic",
      language: "typescript",
      title: "TODO: Aging Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Aging
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
