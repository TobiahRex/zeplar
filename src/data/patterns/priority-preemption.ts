import type { Pattern } from "../schema";

export const priorityPreemption: Pattern = {
  id: "priority-preemption",
  slug: "priority-preemption",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → ⏸️ Preemption → 🔝 Priority Preemption",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Preemption",
    level: 4,
  },

  concept: {
    name: "Priority Preemption",
    emoji: "🔝",
    tagline: "Higher priority interrupts",
    definition:
      "Priority preemption is a scheduling mechanism that allows high-priority tasks to interrupt and suspend lower-priority tasks that are currently executing, immediately taking control of the processor or resource. Think of it like emergency vehicles using sirens to make traffic pull over—regular cars must stop mid-journey to let the ambulance pass. For example, in an operating system, a real-time interrupt from a network card (high priority) can preempt a background file indexing task (low priority), suspending the indexer's execution mid-operation to handle the network packet immediately. The suspended task's state is saved, the high-priority task executes to completion or yields, then the suspended task resumes from where it was interrupted. This pattern is fundamental to real-time systems and operating systems where critical tasks must meet strict timing deadlines. Preemption can occur at any time (preemptive scheduling) unlike cooperative multitasking where tasks must explicitly yield. The pattern ensures that high-priority work never waits behind low-priority work, providing predictable latency bounds for critical operations.",
    problemSolved:
      "Non-preemptive scheduling forces high-priority tasks to wait for low-priority tasks to complete, violating latency requirements and potentially causing system failures. For example, in a robotics control system, a safety emergency (motor overheating) requires immediate response within 10ms. If a low-priority task (data logging) is running and takes 100ms to complete, the emergency handler waits 100ms—by which point the motor may have burned out. Similarly, in a web server, high-priority health check requests from load balancers might timeout while waiting for low-priority background analytics queries to finish. Priority preemption solves this by allowing the safety handler to interrupt the logger immediately, reducing response time from 100ms to under 1ms. The logger is suspended mid-execution, the safety handler runs, then the logger resumes. This guarantees high-priority tasks meet their deadlines regardless of what lower-priority tasks are doing.",
    tradeoffs: {
      pros: [
        "Guarantees bounded response times for high-priority tasks by allowing them to interrupt lower-priority work immediately, enabling sub-millisecond latencies for critical operations",
        "Prevents priority inversion where low-priority tasks block high-priority ones, ensuring critical work always receives CPU time when needed",
        "Essential for real-time systems with hard deadlines (industrial control, medical devices, automotive) where missing deadlines can cause physical damage or safety hazards",
        "Improves overall system responsiveness by ensuring user-facing or time-sensitive operations never wait behind background batch processing",
      ],
      cons: [
        "Increases context switching overhead as high-priority interrupts cause frequent task suspensions and resumptions, potentially wasting 10-30% of CPU on state management",
        "Introduces complex race conditions and synchronization challenges when preempted tasks hold locks or are in critical sections",
        "Can lead to starvation of low-priority tasks if high-priority work arrives constantly, leaving background tasks indefinitely delayed",
        "Makes debugging and testing difficult due to non-deterministic execution ordering and timing-dependent bugs that appear only under specific interrupt patterns",
        "Requires careful priority assignment to avoid priority inversions, deadlocks, and other concurrency pathologies",
      ],
    },
    relatedPatterns: [
      "multi-level-queue",
      "time-slicing",
      "cooperative-yielding",
      "shortest-job-first",
      "aging",
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
      id: "priority-preemption-ts-basic",
      language: "typescript",
      title: "TODO: Priority Preemption Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Priority Preemption
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
