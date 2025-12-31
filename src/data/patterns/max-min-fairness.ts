import type { Pattern } from "../schema";

export const maxMinFairness: Pattern = {
  id: "max-min-fairness",
  slug: "max-min-fairness",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → ⚖️ Fairness → 🔄 Max-Min Fairness",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Fairness",
    level: 4,
  },

  concept: {
    name: "Max-Min Fairness",
    emoji: "🔄",
    tagline: "Maximize minimum allocation",
    definition:
      "Max-Min Fairness allocates resources to maximize the smallest allocation any user receives, ensuring no user is starved even if it means reducing allocations to users who could use more. Think of it like dividing a pizza: first ensure everyone gets at least one slice, then distribute remaining slices evenly among those still hungry, rather than letting one person eat the whole pizza. The algorithm works iteratively: divide capacity equally among all users, if a user demands less than their equal share, remove them from consideration and redistribute their unused capacity among remaining users, repeat until all users are either satisfied or receiving equal shares. For example, with 100 Mbps bandwidth and 3 users demanding 20 Mbps, 30 Mbps, and 80 Mbps respectively: initially each gets 33.3 Mbps, User 1 needs only 20 Mbps (satisfied), redistribute the spare 13.3 Mbps between Users 2 and 3, each gets 46.7 Mbps, User 2 needs only 30 Mbps (satisfied), User 3 gets all remaining 56.7 Mbps.",
    problemSolved:
      "Proportional sharing and priority-based allocation can starve low-demand or low-priority users entirely when high-demand users consume all resources. Strict equal sharing wastes capacity when some users need less than their equal portion. Simple fairness metrics do not protect against worst-case starvation. Max-Min Fairness solves this by prioritizing the worst-off user, guaranteeing everyone receives resources proportional to their demand up to an equal share. No user can increase their allocation without decreasing someone who has less. This is critical for network bandwidth allocation ensuring small flows get fair treatment alongside large flows, CPU scheduling preventing starvation in multi-tenant systems, and any resource allocation where protecting the minimum guarantee matters more than maximizing total utilization.",
    tradeoffs: {
      pros: [
        "Guarantees no user starves by maximizing the minimum allocation, protecting worst-case scenarios",
        "Fair and intuitive allocation that is easier to explain and reason about than complex priority schemes",
        "Naturally balances between equal sharing and demand-based allocation without manual tuning",
        "Prevents resource hogging where high-demand users monopolize capacity at expense of small users",
      ],
      cons: [
        "May underutilize resources if satisfied users leave capacity unused instead of reallocating to greedy users",
        "Does not account for user priority or importance, treating all users equally regardless of value",
        "Iterative algorithm has computational overhead, requiring recalculation when demand or capacity changes",
        "Can cause oscillation if user demands change frequently, constantly rebalancing allocations",
      ],
    },
    relatedPatterns: [
      "weighted-fair-queuing",
      "lottery-scheduling",
      "proportional-share",
      "deficit-round-robin",
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
      id: "max-min-fairness-ts-basic",
      language: "typescript",
      title: "TODO: Max-Min Fairness Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Max-Min Fairness
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
