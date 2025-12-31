import type { Pattern } from "../schema";

export const greedy: Pattern = {
  id: "greedy",
  slug: "greedy",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🧮 Algorithmic → 🎯 Greedy",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Algorithmic",
    level: 4,
  },

  concept: {
    name: "Greedy",
    emoji: "🎯",
    tagline: "Local optimal choices",
    definition:
      "The Greedy algorithm paradigm solves optimization problems by making the locally optimal choice at each step, hoping to find a global optimum. Think of it like a hiker climbing a mountain who always takes the steepest path upward at each step—this works if there is only one peak, but fails if the mountain has multiple local peaks. The algorithm builds a solution incrementally, making an irrevocable choice at each stage based solely on local information, without reconsidering previous decisions. Classic examples include Dijkstra's shortest path algorithm (always expand the closest unvisited node), Huffman coding (build optimal prefix codes by merging lowest-frequency nodes first), and activity selection (choose activities that finish earliest to maximize count). The key insight is that for certain problems with greedy-choice property and optimal substructure, making locally optimal choices leads to a globally optimal solution. However, greedy algorithms do not work for all problems—for example, the greedy approach fails for the 0/1 knapsack problem, where dynamic programming is needed. When applicable, greedy algorithms are often simpler and more efficient than exhaustive approaches.",
    problemSolved:
      "Many optimization problems require finding the best solution among many possibilities, and exhaustive search is too slow. For example, finding the minimum spanning tree in a graph with 1000 nodes has too many spanning trees to enumerate. Greedy algorithms solve this efficiently by making locally optimal choices that lead to globally optimal solutions for specific problem classes. The pattern is essential when problems exhibit the greedy-choice property (a globally optimal solution can be reached by making locally optimal choices) and optimal substructure (optimal solution contains optimal solutions to subproblems). Applications include scheduling tasks to minimize latency, network routing to find shortest paths, data compression (Huffman coding), resource allocation to maximize utility, and graph algorithms (minimum spanning trees via Kruskal's or Prim's algorithm). Without greedy algorithms, problems like finding shortest paths or optimal task scheduling would require exponential-time dynamic programming or exhaustive search. Greedy provides polynomial or even linear-time solutions when applicable.",
    tradeoffs: {
      pros: [
        "Simple to implement and understand compared to dynamic programming or backtracking",
        "Often runs in linear or O(n log n) time, much faster than exponential alternatives",
        "Uses minimal memory (O(1) extra space) since it does not store subproblem solutions",
        "Produces optimal solutions for problems with greedy-choice property (Dijkstra, MST, Huffman)",
        "Provides good approximations for NP-hard problems where optimal solution is infeasible",
      ],
      cons: [
        "Does not guarantee optimal solution for all problems (fails on 0/1 knapsack, longest path)",
        "Difficult to prove correctness—requires mathematical proof of greedy-choice property",
        "Cannot backtrack or reconsider decisions, so early mistakes propagate to final solution",
        "May get stuck in local optima when global optimum requires non-greedy intermediate steps",
        "Not applicable to problems without greedy-choice property, requiring DP or backtracking instead",
      ],
    },
    relatedPatterns: [
      "dynamic-programming",
      "divide-and-conquer",
      "backtracking",
      "graphs",
      "heaps",
      "priority-queue",
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
      id: "greedy-ts-basic",
      language: "typescript",
      title: "TODO: Greedy Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Greedy
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
