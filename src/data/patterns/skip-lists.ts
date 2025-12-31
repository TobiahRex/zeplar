import type { Pattern } from "../schema";

export const skipLists: Pattern = {
  id: "skip-lists",
  slug: "skip-lists",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → 📊 Skip Lists",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Skip Lists",
    emoji: "📊",
    tagline: "Probabilistic balanced structure",
    definition:
      "A skip list is a probabilistic data structure that provides O(log n) search, insertion, and deletion by maintaining multiple levels of linked lists, where each higher level skips over progressively more elements. Think of it like an express train system: the local track stops at every station, the express skips every other station, and the super-express only stops at major hubs. When searching, you start at the highest level (fewest nodes), move forward until you overshoot the target, drop down a level, and repeat until reaching the bottom level. Each node has a randomly determined height (number of levels it participates in), with probability 1/2 for each successive level. This probabilistic balancing avoids the complex rotation logic of balanced trees (AVL, Red-Black) while achieving the same O(log n) performance on average. Skip lists maintain sorted order, support efficient range queries, and enable lock-free concurrent implementations more easily than trees. They are used in Redis (sorted sets), LevelDB, and in-memory databases for ordered key-value storage. The space overhead is O(n) on average, with each node having an expected height of 2.",
    problemSolved:
      "Balanced binary search trees (AVL, Red-Black) provide O(log n) operations but require complex rotation and rebalancing logic that is error-prone and difficult to implement, especially in concurrent environments. Skip lists solve this by achieving the same O(log n) average-case performance through simple probabilistic height assignment, avoiding rotations entirely. Insertion and deletion are straightforward: find the position, randomly generate height, and update pointers at each level. This simplicity enables efficient lock-free concurrent skip lists where threads can insert/delete without blocking readers. Without skip lists, ordered data structures would rely on complex balanced trees or resort to slower alternatives. For example, implementing a sorted set in Redis with millions of elements requires O(log n) operations for rank queries (what is the 1000th element?) and range scans. Skip lists provide this efficiently while being simpler to implement and debug than AVL or Red-Black trees. They are particularly valuable in concurrent systems where lock-free data structures are critical for performance.",
    tradeoffs: {
      pros: [
        "O(log n) average-case search, insertion, and deletion without complex balancing",
        "Much simpler to implement than balanced trees (no rotations or color management)",
        "Naturally supports lock-free concurrent implementations with fine-grained locking",
        "Efficient range queries and iteration in sorted order",
        "Probabilistic balancing avoids worst-case imbalance requiring rebalancing",
      ],
      cons: [
        "Requires extra space for multi-level pointers (2x overhead on average)",
        "Probabilistic structure means worst-case O(n) is possible, though extremely unlikely",
        "Slightly slower in practice than balanced trees due to pointer-chasing across levels",
        "Randomness makes performance analysis and debugging less deterministic",
        "Not as cache-efficient as B-trees for disk-based storage systems",
      ],
    },
    relatedPatterns: [
      "trees",
      "hash-tables",
      "b-tree-index",
      "hash-index",
      "graphs",
      "heaps",
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
      id: "skip-lists-ts-basic",
      language: "typescript",
      title: "TODO: Skip Lists Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Skip Lists
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
