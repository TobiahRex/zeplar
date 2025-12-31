import type { Pattern } from "../schema";

export const backtracking: Pattern = {
  id: "backtracking",
  slug: "backtracking",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🧮 Algorithmic → 🔙 Backtracking",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Algorithmic",
    level: 4,
  },

  concept: {
    name: "Backtracking",
    emoji: "🔙",
    tagline: "Explore and prune",
    definition:
      "Backtracking is a systematic algorithmic technique for exploring all possible solutions to a problem by building candidates incrementally and abandoning them as soon as it determines they cannot lead to a valid solution. Think of it like navigating a maze: you walk down a path, and when you hit a dead end, you backtrack to the last decision point and try a different route. The algorithm maintains a partial solution and extends it one step at a time, checking constraints at each step. If a partial solution violates constraints (like placing two chess queens in the same row), the algorithm immediately abandons that branch and backtracks to try alternatives. This 'explore and prune' approach systematically searches the solution space while avoiding exhaustive enumeration of all possibilities. Backtracking is recursive by nature—it tries an option, recursively explores its consequences, and if that fails, undoes the choice and tries the next option. Classic applications include solving Sudoku, the N-Queens problem, generating permutations, finding paths in graphs, and constraint satisfaction problems. The key insight is pruning: by detecting failures early, backtracking avoids wasting time on branches that cannot possibly succeed, often reducing exponential search spaces to manageable sizes.",
    problemSolved:
      "Many computational problems require finding one or all solutions from a vast space of possibilities where exhaustive enumeration is infeasible. For example, solving a 9x9 Sudoku has approximately 6.67×10^21 possible grid configurations, making brute force impractical. Backtracking solves this by incrementally building solutions and immediately discarding invalid partial solutions before fully exploring them. When solving the N-Queens problem (placing N queens on an NxN chessboard so none attack each other), a naive approach tries all possible placements, but backtracking prunes branches early—if two queens are already in the same row, there is no point in exploring remaining placements. This applies to constraint satisfaction problems (CSP), combinatorial optimization, puzzles, and decision problems where you need to find valid configurations subject to complex constraints. Without backtracking, problems like generating all permutations of a string, solving mazes, or parsing ambiguous grammars become computationally intractable.",
    tradeoffs: {
      pros: [
        "Finds all solutions systematically without missing any valid configuration",
        "Prunes search space early by abandoning invalid branches, avoiding exhaustive enumeration",
        "Simple recursive structure makes implementation intuitive and maintainable",
        "Guaranteed to find solution if one exists (completeness property)",
        "Memory efficient compared to iterative breadth-first approaches (uses call stack)",
      ],
      cons: [
        "Worst-case time complexity often exponential (O(b^d) where b=branching factor, d=depth)",
        "Can be slow without good pruning heuristics or constraint ordering",
        "Stack overflow risk for deep recursion without tail call optimization",
        "Performance highly dependent on problem structure and constraint ordering",
        "Not suitable for optimization problems requiring best solution (only finds valid solutions)",
      ],
    },
    relatedPatterns: [
      "dynamic-programming",
      "divide-and-conquer",
      "greedy",
      "graphs",
      "trees",
      "memoization",
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
      id: "backtracking-ts-basic",
      language: "typescript",
      title: "TODO: Backtracking Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Backtracking
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
