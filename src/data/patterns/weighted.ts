import type { Pattern } from "../schema";

export const weighted: Pattern = {
  id: "weighted",
  slug: "weighted",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚖️ Load Balancing → ⚡ Weighted",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Load Balancing",
    level: 4,
  },

  concept: {
    name: "Weighted",
    emoji: "⚡",
    tagline: "Proportional to capacity",
    definition:
      "Weighted load balancing distributes incoming requests across backend servers proportionally based on assigned capacity weights, sending more traffic to higher-capacity servers and less to lower-capacity servers. Think of it like assigning work tasks based on employee experience—senior engineers get 3 tasks per round, mid-level get 2, juniors get 1, matching work to capability. For example, a server pool with one 16-core server (weight 8), two 8-core servers (weight 4 each), and four 4-core servers (weight 2 each) receives traffic in an 8:4:4:2:2:2:2 ratio—the 16-core server gets 8× more requests than 4-core servers. Common implementations use weighted round-robin (cycle through servers, visiting high-weight servers multiple times per cycle) or weighted random (select servers randomly with probability proportional to weight). The weights can be static (configured based on hardware specs) or dynamic (adjusted based on observed server performance, CPU usage, or response times). This pattern is essential for heterogeneous server pools where machines have different hardware specifications or performance characteristics.",
    problemSolved:
      "Unweighted load balancing treats all servers equally regardless of capacity differences, overloading weak servers while underutilizing powerful ones. For example, a pool with one 32-core server and three 2-core servers using round-robin receives equal traffic (25% each). The 32-core server handles its 25% load easily at 5% CPU usage while the 2-core servers struggle at 90% CPU, causing timeouts and errors. This wastes the powerful server's capacity while degrading user experience. Weighted load balancing solves this by distributing traffic proportionally: assign the 32-core server weight 16 and the 2-core servers weight 1 each, resulting in 16:1:1:1 distribution. The 32-core server now handles 16/19 (84%) of traffic, reaching healthy 60-70% CPU usage, while 2-core servers each handle 1/19 (5.3%), staying at manageable 40-50% CPU. All servers contribute proportionally to their capacity, maximizing throughput and utilization.",
    tradeoffs: {
      pros: [
        "Optimizes resource utilization by matching traffic distribution to server capacity, ensuring powerful servers handle proportionally more requests",
        "Prevents overload of weaker servers in heterogeneous pools while avoiding underutilization of stronger servers, balancing load effectively",
        "Enables gradual traffic migration when adding or removing servers by adjusting weights incrementally rather than abrupt 0-100% changes",
        "Allows fine-grained control over traffic distribution for canary deployments, A/B testing, or gradual rollouts by setting precise weight ratios",
      ],
      cons: [
        "Requires accurate weight configuration based on server capacity—incorrect weights lead to imbalanced load and performance degradation",
        "Adds complexity in determining appropriate weights, especially when servers have different performance characteristics beyond just CPU cores",
        "Still ignores real-time server load and health—weights are typically static, so can't adapt to temporary performance issues or varying workload types",
        "Makes debugging harder since traffic distribution is non-uniform, complicating log analysis and performance troubleshooting across servers",
      ],
    },
    relatedPatterns: [
      "round-robin",
      "least-connections",
      "random",
      "weighted-fair-queuing",
      "consistent-hashing",
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
      id: "weighted-ts-basic",
      language: "typescript",
      title: "TODO: Weighted Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Weighted
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
