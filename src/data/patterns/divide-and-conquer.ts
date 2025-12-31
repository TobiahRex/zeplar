import type { Pattern } from "../schema";

export const divideAndConquer: Pattern = {
  id: "divide-and-conquer",
  slug: "divide-and-conquer",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🧮 Algorithmic → ➗ Divide and Conquer",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Algorithmic",
    level: 4,
  },

  concept: {
    name: "Divide and Conquer",
    emoji: "➗",
    tagline: "Break into subproblems",
    definition:
      "Divide and Conquer is a fundamental algorithmic paradigm that solves problems by recursively breaking them into smaller, independent subproblems, solving each subproblem separately, and combining their solutions to form the final answer. Think of it like organizing a large company project: instead of one person handling everything, you divide tasks among teams, each team solves their part independently, and then you merge the results. The pattern has three distinct phases: Divide (split the problem into smaller instances of the same problem), Conquer (recursively solve each subproblem until reaching base cases small enough to solve directly), and Combine (merge subproblem solutions to create the overall solution). Classic examples include Merge Sort (divide array in half, sort each half, merge sorted halves), Quick Sort (partition around pivot, sort partitions), Binary Search (divide search space in half), and Fast Fourier Transform. The key insight is that many problems exhibit optimal substructure—the optimal solution can be constructed from optimal solutions to subproblems. This allows the algorithm to work on smaller, more manageable pieces and efficiently combine them, often achieving better time complexity than naive approaches.",
    problemSolved:
      "Many problems are too complex or large to solve directly in a single pass, requiring inefficient brute-force approaches. For example, sorting an array of 1 million elements using insertion sort takes O(n²) time, which is impractical. Divide and Conquer solves this by breaking the array into smaller chunks that can be sorted efficiently and then merging them in O(n log n) time. The pattern is essential when problems exhibit recursive structure—where solving the whole problem can be reduced to solving smaller instances of the same problem. It is particularly effective for problems on sequences (sorting, searching), trees (tree traversal, height calculation), computational geometry (closest pair of points), numerical algorithms (matrix multiplication), and signal processing (FFT). Without divide and conquer, problems like efficiently searching sorted data, multiplying large matrices, or computing convex hulls would require significantly more computation. The pattern transforms intractable O(n²) or O(n³) problems into manageable O(n log n) or O(n^1.6) solutions.",
    tradeoffs: {
      pros: [
        "Often achieves optimal or near-optimal time complexity (e.g., O(n log n) for sorting)",
        "Naturally parallelizable since subproblems are independent and can run concurrently",
        "Elegant recursive structure makes code clean, maintainable, and easy to reason about",
        "Effective for problems with optimal substructure and overlapping subproblems",
        "Reduces problem complexity by working on smaller, simpler instances",
      ],
      cons: [
        "Recursion overhead from function calls can impact performance for small inputs",
        "May use significant stack space for deep recursion, risking stack overflow",
        "Combine step can be expensive if merging subproblem solutions is costly",
        "Not always optimal if subproblems overlap significantly (use dynamic programming instead)",
        "Requires careful base case handling to avoid infinite recursion",
      ],
    },
    relatedPatterns: [
      "dynamic-programming",
      "backtracking",
      "greedy",
      "trees",
      "fork-join",
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
      id: "divide-and-conquer-ts-basic",
      language: "typescript",
      title: "TODO: Divide and Conquer Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Divide and Conquer
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
