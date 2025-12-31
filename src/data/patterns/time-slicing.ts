import type { Pattern } from "../schema";

export const timeSlicing: Pattern = {
  id: "time-slicing",
  slug: "time-slicing",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → ⏸️ Preemption → ⏱️ Time Slicing",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Preemption",
    level: 4,
  },

  concept: {
    name: "Time Slicing",
    emoji: "⏱️",
    tagline: "Round-robin CPU time",
    definition:
      "Time slicing is a scheduling technique where the CPU's execution time is divided into fixed intervals (time slices or quanta, typically 10-100ms) and tasks take turns executing for one quantum each in round-robin fashion. Think of it like a classroom where each student gets exactly 2 minutes to present—after their time expires, they sit down and the next student presents, ensuring everyone gets equal opportunity. For example, with three tasks A, B, and C and 20ms time slices: task A executes for 20ms, then the scheduler preempts it and switches to B for 20ms, then to C for 20ms, then back to A for another 20ms, continuing this rotation until tasks complete. This creates the illusion of simultaneous execution even on a single CPU core. Operating systems use time slicing to implement multitasking—Linux and Windows typically use 10ms quanta. The pattern ensures fairness, prevents any single task from monopolizing the CPU, and provides responsive interactive systems where user-facing tasks don't freeze while background work runs.",
    problemSolved:
      "Without time slicing, long-running tasks monopolize the CPU, preventing other tasks from making progress and causing system unresponsiveness. In cooperative multitasking where tasks must voluntarily yield, a single task that forgets to yield or runs an infinite loop freezes the entire system. For example, a file compression task running for 60 seconds on a single core without time slicing prevents all other tasks—including mouse input, keyboard handling, and display updates—from executing, making the system appear frozen. Users cannot interact with other applications or even see progress indicators. Time slicing solves this by forcibly preempting tasks every 10-20ms using hardware timer interrupts. The 60-second compression task executes 20ms at a time, interleaved with 20ms slices for UI tasks. The user interface remains responsive, updating at 30-50 FPS, while compression runs in the background. Each task makes continuous progress without any single task blocking others.",
    tradeoffs: {
      pros: [
        "Ensures fairness by giving each task equal CPU time, preventing any single task from monopolizing processor and starving others",
        "Provides system responsiveness by guaranteeing user-facing tasks execute every few milliseconds rather than waiting for background tasks to complete",
        "Enables true multitasking on single-core systems through rapid context switching that creates the illusion of simultaneous execution",
        "Prevents misbehaving or infinite-loop tasks from freezing the entire system since scheduler forcibly preempts after each quantum",
      ],
      cons: [
        "Introduces context switching overhead of 1-10µs per quantum that becomes significant with very short time slices, wasting 10-30% CPU on bookkeeping",
        "Can reduce throughput for CPU-bound tasks since context switches flush CPU caches and TLB, requiring cache warm-up every quantum",
        "Creates worst-case completion time equal to number of tasks × task duration since tasks must wait for all others to get their quantum",
        "Adds latency for time-sensitive real-time tasks that may miss deadlines due to fixed round-robin scheduling regardless of priority",
      ],
    },
    relatedPatterns: [
      "round-robin",
      "priority-preemption",
      "cooperative-yielding",
      "multi-threading",
      "multi-level-queue",
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
      id: "time-slicing-ts-basic",
      language: "typescript",
      title: "TODO: Time Slicing Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Time Slicing
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
