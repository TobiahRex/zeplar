import type { Pattern } from "../schema";

export const cooperativeYielding: Pattern = {
  id: "cooperative-yielding",
  slug: "cooperative-yielding",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → ⏸️ Preemption → 🎯 Cooperative Yielding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Preemption",
    level: 4,
  },

  concept: {
    name: "Cooperative Yielding",
    emoji: "🎯",
    tagline: "Voluntary context switch",
    definition:
      "Cooperative Yielding allows long-running tasks to voluntarily pause and return control to a scheduler or event loop, enabling other work to execute without forced preemption. Think of it like taking turns speaking in a meeting—each person chooses when to pause and let others talk, rather than being interrupted mid-sentence by a moderator. In programming, a task processing 1 million items might yield every 1000 items using 'await Task.Yield()' in C# or 'await asyncio.sleep(0)' in Python, allowing the event loop to process other pending tasks. For example, a JavaScript animation loop uses 'requestAnimationFrame()' to yield control after each frame, ensuring the browser can handle user input. Unlike preemptive multitasking where the OS forcibly interrupts tasks, cooperative yielding relies on tasks being well-behaved and periodically relinquishing control. This creates predictable context switching at natural boundaries (loop iterations, I/O operations) rather than arbitrary interruption points.",
    problemSolved:
      "Long-running synchronous tasks block event loops and UI threads, causing application freezes and poor responsiveness. A JavaScript function processing 10 million array items blocks the browser event loop for seconds, preventing user interaction, rendering, and event processing. Preemptive multitasking with threads adds overhead and complexity (locks, race conditions, context switching), which is inappropriate for lightweight cooperative concurrency. Cooperative Yielding solves this by allowing tasks to checkpoint their progress and yield control at safe points, enabling interleaved execution without thread overhead. A background data processing task yields every 100ms, ensuring UI updates and user input are processed within that latency. This is critical for single-threaded environments (JavaScript, Python asyncio, C# async), UI frameworks requiring responsive event loops, and cooperative multitasking systems where task cooperation improves overall throughput.",
    tradeoffs: {
      pros: [
        "Maintains responsive UI and event loops by preventing long-running tasks from blocking indefinitely",
        "Avoids thread overhead and synchronization complexity of preemptive multitasking for lightweight concurrency",
        "Enables predictable context switching at natural task boundaries, simplifying reasoning about execution",
        "Improves throughput by allowing I/O-bound tasks to yield during wait times for network or disk",
      ],
      cons: [
        "Requires developer discipline to insert yield points, breaking if tasks do not cooperate properly",
        "Malicious or buggy code can monopolize the scheduler by never yielding, causing system-wide freezes",
        "Cannot preempt CPU-intensive work, making it unsuitable for true parallelism on multi-core systems",
        "Debugging is complex as yield points create non-deterministic execution interleaving and timing issues",
      ],
    },
    relatedPatterns: [
      "async-await",
      "event-loop",
      "green-threads",
      "coroutines",
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
      id: "cooperative-yielding-ts-basic",
      language: "typescript",
      title: "TODO: Cooperative Yielding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Cooperative Yielding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
