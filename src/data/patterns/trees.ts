import type { Pattern } from "../schema";

export const trees: Pattern = {
  id: "trees",
  slug: "trees",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → 🌳 Trees",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Trees",
    emoji: "🌳",
    tagline: "Hierarchical access (BST, B-Tree)",
    definition:
      "A tree is a hierarchical data structure consisting of nodes connected by edges, where one node is designated as the root and all other nodes are descendants organized in parent-child relationships. Think of it like a family tree or corporate org chart: one CEO (root) at the top, managers below, and employees at the leaves. Binary Search Trees (BST) maintain the property that left children are smaller and right children are larger, enabling O(log n) search in balanced trees. Balanced variants (AVL, Red-Black, B-Trees) use rotations or node splitting to maintain logarithmic height even after arbitrary insertions. B-Trees generalize BSTs by allowing nodes to have many children (branching factor of 100s), minimizing disk seeks in databases. Trees power file systems (directories and files), databases (indexes), compilers (abstract syntax trees), AI (decision trees), networking (routing tables), and data compression (Huffman trees). Core operations include search, insertion, deletion, and traversals (in-order for sorted iteration, pre-order for tree copying, post-order for cleanup, level-order for breadth-first).",
    problemSolved:
      "Linear data structures (arrays, lists) require O(n) search time, while sorted arrays enable O(log n) binary search but suffer O(n) insertion/deletion. Trees solve this by providing O(log n) search, insertion, and deletion when balanced, combining the efficiency of sorted arrays with the flexibility of linked structures. This is critical for databases (MySQL uses B+ trees for indexes), file systems (inode trees for directories), and compilers (parse trees for syntax analysis). Without trees, maintaining sorted data with frequent updates would require choosing between slow O(n) searches or expensive O(n) insertions. For example, a database index on 10 million rows would take seconds to search linearly, but milliseconds with a B-tree index. Trees also model hierarchical relationships naturally—file systems, XML/JSON documents, organization charts, and taxonomies. They enable range queries (find all values between X and Y), prefix searches (autocomplete), and ordered iteration that hash tables cannot provide efficiently.",
    tradeoffs: {
      pros: [
        "O(log n) search, insertion, and deletion when balanced (AVL, Red-Black, B-Tree)",
        "Maintains sorted order enabling efficient range queries and ordered iteration",
        "Naturally models hierarchical relationships (file systems, org charts, taxonomies)",
        "Space-efficient with O(n) storage (one node per element plus pointers)",
        "Flexible operations: min/max in O(log n), successor/predecessor, rank queries",
      ],
      cons: [
        "Can degrade to O(n) operations if unbalanced (pathological insert order)",
        "Balancing operations (rotations, splits) add complexity to implementation",
        "Pointer-based structure has worse cache locality than arrays",
        "Requires O(log n) space on call stack for recursive operations (DFS, search)",
        "More complex to implement correctly than simpler structures (arrays, hash tables)",
      ],
    },
    relatedPatterns: [
      "graphs",
      "hash-tables",
      "heaps",
      "b-tree-index",
      "skip-lists",
      "divide-and-conquer",
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
      id: "trees-ts-basic",
      language: "typescript",
      title: "TODO: Trees Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Trees
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
