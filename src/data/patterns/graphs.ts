import type { Pattern } from "../schema";

export const graphs: Pattern = {
  id: "graphs",
  slug: "graphs",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → 🔗 Graphs",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Graphs",
    emoji: "🔗",
    tagline: "Relationship modeling",
    definition:
      "A graph is a fundamental data structure consisting of vertices (nodes) connected by edges that models relationships between entities. Think of it like a social network: people are vertices, friendships are edges connecting them. Graphs can be directed (edges have direction, like Twitter follows) or undirected (symmetric relationships, like Facebook friends), weighted (edges have costs, like road distances) or unweighted (all connections equal), and cyclic or acyclic (DAG). Two main representations exist: adjacency matrix (2D array where matrix[i][j]=1 if edge exists, O(V²) space, O(1) edge lookup) and adjacency list (array of lists where list[i] contains neighbors of vertex i, O(V+E) space, O(degree) neighbor access). Graphs model networks (internet routers, social connections), dependencies (build systems, course prerequisites), maps (cities connected by roads), and state transitions (finite automata). Core algorithms include depth-first search (DFS) for path finding, breadth-first search (BFS) for shortest path in unweighted graphs, Dijkstra's for shortest path in weighted graphs, and topological sort for ordering dependencies.",
    problemSolved:
      "Many real-world problems involve complex relationships between entities that cannot be represented with linear data structures (arrays, lists) or hierarchical structures (trees). Graphs solve this by modeling arbitrary pairwise connections, enabling questions like: What is the shortest path between two cities? How are users connected in a social network? What is the dependency order for compiling modules? Is this network vulnerable to single-point failures? Without graphs, problems like finding routes in GPS navigation, detecting fraud rings in financial networks, recommending friends on social platforms, or scheduling tasks with dependencies would be intractable. For example, LinkedIn uses graphs to find connection paths between users, recommendation systems use graphs to model user-item interactions, and compilers use dependency graphs to determine build order. Graphs provide the foundation for network analysis, pathfinding, clustering, and optimization problems.",
    tradeoffs: {
      pros: [
        "Models arbitrary relationships between entities with maximum flexibility",
        "Rich algorithmic toolkit (DFS, BFS, shortest path, MST, clustering) for analysis",
        "Adjacency list representation is space-efficient for sparse graphs (O(V+E))",
        "Naturally represents networks, dependencies, maps, and state machines",
        "Supports both weighted and unweighted, directed and undirected relationships",
      ],
      cons: [
        "Adjacency matrix requires O(V²) space even for sparse graphs with few edges",
        "Many graph algorithms have high time complexity (shortest path O((V+E)log V), all-pairs O(V³))",
        "Difficult to visualize and debug for large graphs with thousands of nodes",
        "No inherent ordering—algorithms must impose traversal order (DFS, BFS, topological)",
        "Cyclic graphs can cause infinite loops without careful visited-node tracking",
      ],
    },
    relatedPatterns: [
      "trees",
      "hash-tables",
      "greedy",
      "dynamic-programming",
      "backtracking",
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
      id: "graphs-ts-basic",
      language: "typescript",
      title: "TODO: Graphs Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Graphs
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
