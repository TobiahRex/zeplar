import type { Pattern } from "../schema";

export const heaps: Pattern = {
  id: "heaps",
  slug: "heaps",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → 📊 Heaps",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Heaps",
    emoji: "📊",
    tagline: "Priority access",
    definition:
      "A heap is a specialized tree-based data structure that maintains a partial ordering where the root node is always the minimum (min-heap) or maximum (max-heap) element, enabling efficient priority-based access. Think of it like a corporate hierarchy where the CEO (root) always has the highest priority, managers have higher priority than employees, but siblings at the same level are unordered. Heaps are typically implemented as complete binary trees stored in arrays: for node at index i, left child is at 2i+1, right child at 2i+2, and parent at (i-1)/2. This array representation avoids pointer overhead and improves cache locality. The heap property requires that every parent node is less than or equal to its children (min-heap) or greater than or equal (max-heap). Operations include insert (add element and bubble up to restore heap property in O(log n)), extract-min/max (remove root and bubble down in O(log n)), and peek (view root in O(1)). Heaps power priority queues, heap sort (O(n log n) in-place sorting), and algorithms like Dijkstra's shortest path and Huffman coding.",
    problemSolved:
      "Many algorithms need efficient access to the minimum or maximum element from a dynamic set, but maintaining a fully sorted array is too expensive (O(n) per insertion). Heaps solve this by providing O(log n) insertion and O(log n) extraction of the min/max element while using O(1) space overhead. This is critical for priority queues in operating system schedulers (which process should run next?), event-driven simulations (what event occurs next?), graph algorithms (Dijkstra's algorithm, Prim's MST), and task scheduling. For example, a web server handling 10,000 concurrent requests needs to prioritize critical requests without sorting all requests on every arrival. A heap enables O(log n) insertion and O(log n) extraction of the highest-priority request, whereas sorting would take O(n log n). Heaps also enable efficient streaming algorithms like finding the median of a stream or top-k elements without storing and sorting all data.",
    tradeoffs: {
      pros: [
        "O(log n) insertion and deletion while maintaining min/max access in O(1)",
        "O(1) space overhead using array representation instead of pointers",
        "Excellent cache locality due to compact array storage",
        "Enables efficient priority queue operations for scheduling and algorithms",
        "Can be built in O(n) time using heapify operation on unsorted array",
      ],
      cons: [
        "Does not support efficient search for arbitrary elements (O(n) time)",
        "No ordering between siblings—cannot iterate in sorted order",
        "Deletion of arbitrary elements requires O(n) search followed by O(log n) removal",
        "More complex to implement correctly than simple arrays or lists",
        "Worst-case O(n) space for auxiliary operations like merge",
      ],
    },
    relatedPatterns: [
      "priority-queue",
      "greedy",
      "trees",
      "graphs",
      "shortest-job-first",
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
      id: "heaps-ts-basic",
      language: "typescript",
      title: "TODO: Heaps Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Heaps
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
