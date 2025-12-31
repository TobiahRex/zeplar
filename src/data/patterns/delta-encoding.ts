import type { Pattern } from "../schema";

export const deltaEncoding: Pattern = {
  id: "delta-encoding",
  slug: "delta-encoding",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 🔢 Delta Encoding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Delta Encoding",
    emoji: "🔢",
    tagline: "Store differences",
    definition:
      "Delta encoding is a compression technique that stores data as differences (deltas) from previous values instead of absolute values, exploiting the fact that sequential data often changes by small amounts. Think of it like giving directions: instead of saying 'turn at 1st Street, then 2nd Street, then 3rd Street', you say 'turn, go one block, turn again' - the differences are smaller to express. The pattern is particularly effective for time-series data, sorted arrays, and sequential values. For example, instead of storing temperatures as [72, 73, 74, 73, 75], you store the first value and then deltas: [72, +1, +1, -1, +2]. These smaller numbers require fewer bits to represent. Column-oriented databases like Apache Parquet use delta encoding for sorted columns: instead of storing timestamps [1609459200, 1609459260, 1609459320], they store [1609459200, +60, +60]. The encoding can be combined with variable-length integer encoding to save even more space since small deltas fit in fewer bytes.",
    problemSolved:
      "Storing and transmitting large volumes of sequential numeric data consumes significant storage space and network bandwidth, especially when consecutive values are similar. Traditional compression algorithms work but don't exploit the sequential nature of the data as effectively as domain-specific approaches. Delta encoding solves this by dramatically reducing the numeric range of values that need to be stored, since differences between consecutive values are typically much smaller than the values themselves. Without delta encoding, time-series databases, columnar storage systems, and streaming protocols waste storage on redundant information. Delta encoding makes data more compressible and enables efficient storage and transmission of monotonically increasing or slowly changing data.",
    tradeoffs: {
      pros: [
        "Exceptional compression ratios for sequential data with small changes, often reducing storage by 60-90%",
        "Fast encoding and decoding with minimal CPU overhead, just addition and subtraction",
        "Combines well with other compression techniques like variable-length encoding and dictionary coding",
        "Maintains data precision perfectly; this is lossless compression with no quality degradation",
        "Enables efficient random access in sorted data when combined with periodic full values as checkpoints",
      ],
      cons: [
        "Requires sequential access for decoding; random access to arbitrary positions requires storing periodic base values",
        "Poor compression or even expansion for random, non-sequential data where deltas are as large as original values",
        "Error propagation risk: if one delta is corrupted, all subsequent values will be incorrect without checkpoints",
        "Additional complexity in write paths since insertions or updates require recalculating subsequent deltas",
        "Limited effectiveness for floating-point data or values with high variance between consecutive entries",
      ],
    },
    relatedPatterns: [
      "dictionary-coding",
      "run-length-encoding",
      "lossless",
      "compression",
      "protocol-buffers",
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
      id: "delta-encoding-ts-basic",
      language: "typescript",
      title: "TODO: Delta Encoding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Delta Encoding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
