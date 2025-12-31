import type { Pattern } from "../schema";

export const uSEMethod: Pattern = {
  id: "use-method",
  slug: "use-method",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 🔵 USE Method",

  hierarchy: {
    quality: "observability",
    strategy: "",
    family: "Metrics",
    level: 4,
  },

  concept: {
    name: "USE Method",
    emoji: "🔵",
    tagline: "Utilization, Saturation, Errors",
    definition:
      "The USE Method, created by Brendan Gregg, is a systematic methodology for analyzing the performance of any system by examining three metrics for every resource: Utilization (how busy the resource is), Saturation (how much work is queued waiting for the resource), and Errors (count of error events). Think of it like a health checkup that looks at the same three vital signs for every organ in your body. For each physical resource (CPU, memory, disk, network), you measure these three dimensions. For example, a CPU might show 80% utilization (working most of the time), a run queue of 5 (saturation, meaning processes are waiting), and zero errors. The brilliance of the USE Method is its completeness: by systematically checking U-S-E for every resource, you ensure no stone is left unturned when investigating performance issues. It provides a structured troubleshooting framework that prevents the common mistake of fixating on one metric while missing the real bottleneck elsewhere in the system.",
    problemSolved:
      "Performance troubleshooting in complex systems is notoriously difficult because there are countless potential bottlenecks and metrics to examine. Engineers often waste time investigating symptoms rather than root causes, or miss critical issues by not checking all resources systematically. The USE Method solves this by providing a complete checklist that ensures comprehensive coverage: if you check U-S-E for CPU, memory, disks, and network, you've covered the vast majority of performance bottlenecks. Without this methodology, performance investigations are ad-hoc and inefficient, often jumping between random metrics based on intuition rather than systematic analysis. The USE Method transforms performance troubleshooting from an art into a science with a repeatable process.",
    tradeoffs: {
      pros: [
        "Comprehensive framework ensures you don't miss bottlenecks by providing a systematic checklist for every resource",
        "Focuses on physical resources where performance problems typically originate, cutting through application-layer noise",
        "Utilization and saturation metrics are leading indicators that help prevent problems before they cause outages",
        "Complements the RED Method perfectly: USE for infrastructure resources, RED for application services",
        "Proven methodology used by performance engineers across industries and technology stacks",
      ],
      cons: [
        "Primarily focuses on physical resources, missing application-level bottlenecks like lock contention or algorithm inefficiency",
        "Saturation metrics are often difficult to measure accurately, especially for resources like memory or disk I/O",
        "Doesn't address request-level performance issues that the RED Method captures better",
        "Requires deep system knowledge to interpret correctly; high utilization isn't always bad, and low utilization doesn't mean no problems",
        "Can be time-consuming to collect all USE metrics across dozens of resources in large distributed systems",
      ],
    },
    relatedPatterns: [
      "red-method",
      "prometheus",
      "grafana",
      "graphite",
      "influxdb",
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
      id: "use-method-ts-basic",
      language: "typescript",
      title: "TODO: USE Method Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for USE Method
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
