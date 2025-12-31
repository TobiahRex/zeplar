import type { Pattern } from "../schema";

export const priorityQueue: Pattern = {
  id: "priority-queue",
  slug: "priority-queue",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🔝 Prioritization → 📊 Priority Queue",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Prioritization",
    level: 4,
  },

  concept: {
    name: "Priority Queue",
    emoji: "📊",
    tagline: "Heap-based ordering",
    definition:
      "A priority queue is an abstract data type where each element has an associated priority, and elements are dequeued in priority order rather than insertion order (FIFO). Think of it like an emergency room: patients are treated based on severity (priority), not arrival time. Unlike regular queues where first-in-first-out applies, priority queues serve the highest-priority element first, regardless of when it arrived. The most efficient implementation uses a binary heap (min-heap or max-heap), providing O(log n) insertion and O(log n) extraction of the min/max element, with O(1) peek at the top priority item. Elements can have numeric priorities or custom comparators defining ordering. For example, a task scheduler might prioritize tasks by deadline, urgency, or user importance. Priority queues are fundamental to algorithms like Dijkstra's shortest path (process nearest unvisited node), A* search (explore most promising paths first), Huffman coding (merge lowest-frequency nodes), and operating system schedulers (run highest-priority process). They enable greedy algorithms that repeatedly select the 'best' next choice.",
    problemSolved:
      "Many systems need to process items based on importance rather than arrival order, but maintaining a sorted list is too expensive (O(n) insertion). Priority queues solve this by providing efficient insertion (O(log n)) and efficient extraction of the highest-priority element (O(log n)) without keeping all elements fully sorted. This is critical for task scheduling (CPU scheduler picks highest-priority process), event-driven simulations (process events in timestamp order), load balancing (route requests to least-loaded server), and pathfinding (explore most promising nodes first). For example, a web server handling 10,000 requests needs to prioritize premium users over free users, but sorting all requests on every arrival would take O(n log n). A priority queue enables O(log n) insertion and O(log n) extraction of the highest-priority request. Without priority queues, systems would either use naive O(n) linear scans or wasteful O(n log n) full sorts for every operation.",
    tradeoffs: {
      pros: [
        "O(log n) insertion and extraction of highest-priority element",
        "O(1) peek at top priority without removal, useful for decision making",
        "Natural fit for greedy algorithms requiring repeated 'best choice' selection",
        "Efficient implementation via binary heap with O(1) space overhead",
        "Flexible priority criteria via custom comparators (deadlines, costs, urgency)",
      ],
      cons: [
        "Cannot efficiently access or remove arbitrary elements (requires O(n) search)",
        "Does not support efficient priority updates without additional indexing structures",
        "No guaranteed ordering between equal-priority elements (unstable)",
        "Heap-based implementation has pointer-chasing overhead compared to arrays",
        "Not suitable when FIFO or LIFO order is required instead of priority-based",
      ],
    },
    relatedPatterns: [
      "heaps",
      "greedy",
      "shortest-job-first",
      "deadline-scheduling",
      "priority-preemption",
      "graphs",
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
      id: "priority-queue-ts-basic",
      language: "typescript",
      title: "TODO: Priority Queue Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Priority Queue
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
