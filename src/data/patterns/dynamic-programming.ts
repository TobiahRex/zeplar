import type { Pattern } from "../schema";

export const dynamicProgramming: Pattern = {
  id: "dynamic-programming",
  slug: "dynamic-programming",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🧮 Algorithmic → 📈 Dynamic Programming",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Algorithmic",
    level: 4,
  },

  concept: {
    name: "Dynamic Programming",
    emoji: "📈",
    tagline: "Cache subproblem results",
    definition:
      "Dynamic Programming (DP) is an algorithmic optimization technique that solves complex problems by breaking them into overlapping subproblems, solving each subproblem once, and storing (caching) the results to avoid redundant computation. Think of it like solving a jigsaw puzzle where you recognize patterns: once you have assembled a section, you do not disassemble and rebuild it—you reuse that completed piece when working on adjacent areas. DP applies to problems with two key properties: optimal substructure (optimal solution contains optimal solutions to subproblems) and overlapping subproblems (same subproblems are solved multiple times). The classic example is computing Fibonacci numbers: a naive recursive approach recalculates F(n-1) and F(n-2) repeatedly, leading to exponential time. DP caches these values, reducing complexity to linear time. Two main approaches exist: top-down (memoization, where you solve recursively and cache results) and bottom-up (tabulation, where you iteratively fill a table from base cases to final solution). Common applications include shortest path algorithms (Bellman-Ford, Floyd-Warshall), sequence alignment, knapsack problems, optimal matrix chain multiplication, and edit distance calculation.",
    problemSolved:
      "Many recursive problems have exponential time complexity because they recompute the same subproblems repeatedly. For example, the naive recursive Fibonacci implementation has O(2^n) complexity because F(5) is computed when calculating both F(6) and F(7), causing massive redundancy. Dynamic Programming solves this by storing subproblem results in a cache (memoization) or table (tabulation), ensuring each subproblem is solved exactly once. This transforms exponential algorithms into polynomial time solutions. The pattern is critical for optimization problems like finding the shortest path, minimizing cost, maximizing profit, or counting possibilities. Real-world applications include resource allocation (0/1 knapsack), bioinformatics (DNA sequence alignment), text editing (edit distance for autocorrect), compiler optimization (instruction scheduling), and economics (optimal investment strategies). Without DP, problems like computing the longest common subsequence or optimal binary search trees would be computationally infeasible for even moderately sized inputs.",
    tradeoffs: {
      pros: [
        "Reduces exponential time complexity to polynomial by eliminating redundant computation",
        "Guarantees optimal solution for problems with optimal substructure property",
        "More efficient than naive recursion for problems with overlapping subproblems",
        "Bottom-up approach avoids recursion overhead and stack overflow issues",
        "Applicable to wide range of optimization and counting problems",
      ],
      cons: [
        "Requires additional memory to store subproblem solutions (space-time tradeoff)",
        "Can use significant space (O(n²) or more) for multi-dimensional DP tables",
        "Requires identifying optimal substructure and recurrence relation (not always obvious)",
        "Bottom-up approach may compute unnecessary subproblems that top-down skips",
        "Overkill for problems without overlapping subproblems (use divide and conquer instead)",
      ],
    },
    relatedPatterns: [
      "memoization",
      "divide-and-conquer",
      "backtracking",
      "greedy",
      "hash-tables",
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
      id: "dynamic-programming-ts-basic",
      language: "typescript",
      title: "TODO: Dynamic Programming Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Dynamic Programming
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
