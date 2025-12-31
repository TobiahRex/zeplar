import type { Pattern } from "../schema";

export const weightedFairQueuing: Pattern = {
  id: "weighted-fair-queuing",
  slug: "weighted-fair-queuing",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → ⚖️ Fairness → 🎰 Weighted Fair Queuing",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Fairness",
    level: 4,
  },

  concept: {
    name: "Weighted Fair Queuing",
    emoji: "🎰",
    tagline: "Proportional bandwidth",
    definition:
      "Weighted Fair Queuing (WFQ) is a scheduling algorithm that allocates resources (CPU time, network bandwidth, I/O) among multiple flows or queues proportionally based on assigned weights, ensuring each flow receives its guaranteed share while remaining work-conserving. Think of it like a buffet line with different ticket types—gold ticket holders can take 3 items per turn, silver 2 items, bronze 1 item, ensuring proportional service while never leaving the buffet idle if anyone is hungry. For example, a router with three traffic classes (high priority weight 5, medium weight 3, low weight 1) allocates bandwidth in a 5:3:1 ratio. If high-priority traffic sends 500 packets, medium 300, and low 100, they each get their proportional share of available bandwidth. The algorithm uses virtual finish times to determine packet ordering: each packet's finish time is calculated as current_virtual_time + packet_size / flow_weight, and packets are served in finish time order. This provides fairness, prevents starvation, and isolates flows—one misbehaving flow cannot steal bandwidth from others.",
    problemSolved:
      "Simple FIFO queuing gives equal treatment to all traffic regardless of priority or bandwidth requirements, allowing low-priority bulk transfers to starve latency-sensitive applications. For example, a network link shared between video calls (requiring low latency, moderate bandwidth) and file backups (bulk, not time-sensitive) with FIFO scheduling will delay video packets behind large backup packets, causing call quality degradation. Conversely, strict priority queuing can starve low-priority traffic entirely—if high-priority traffic arrives constantly, low-priority traffic never gets service. WFQ solves this by allocating bandwidth proportionally: assign video calls weight 5 and backups weight 1, guaranteeing video gets 5x more bandwidth but backups still receive service. During congestion, the algorithm ensures video maintains smooth delivery while backups use remaining capacity. When video is idle, backups can use full link capacity (work-conserving property). Each flow is isolated—backup traffic cannot exceed its allocated share even if it sends at line rate.",
    tradeoffs: {
      pros: [
        "Provides strong fairness guarantees by allocating resources proportionally to weights, preventing any single flow from monopolizing shared resources",
        "Ensures bounded delay for high-weight flows even under congestion, making it suitable for latency-sensitive applications like VoIP or video",
        "Remains work-conserving by allowing idle flow's bandwidth to be used by active flows, maximizing resource utilization without waste",
        "Provides isolation between flows so misbehaving or greedy flows cannot steal bandwidth from well-behaved flows",
      ],
      cons: [
        "Adds significant implementation complexity requiring per-flow state tracking, virtual time calculations, and sophisticated packet scheduling logic",
        "Creates scheduling overhead that can reduce throughput at high packet rates, especially with many active flows requiring frequent priority recalculations",
        "Requires careful weight assignment and tuning to achieve desired resource allocation—incorrect weights lead to poor performance or starvation",
        "Can suffer from unfairness with variable packet sizes since virtual finish times depend on packet size, favoring flows with larger packets",
      ],
    },
    relatedPatterns: [
      "max-min-fairness",
      "multi-level-queue",
      "priority-preemption",
      "rate-limiting",
      "throttling",
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
      id: "weighted-fair-queuing-ts-basic",
      language: "typescript",
      title: "TODO: Weighted Fair Queuing Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Weighted Fair Queuing
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
