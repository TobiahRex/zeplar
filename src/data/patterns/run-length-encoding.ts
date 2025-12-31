import type { Pattern } from "../schema";

export const runLengthEncoding: Pattern = {
  id: "run-length-encoding",
  slug: "run-length-encoding",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📏 Run-Length Encoding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Run-Length Encoding",
    emoji: "📏",
    tagline: "Compress sequences",
    definition:
      "Run-Length Encoding (RLE) is a simple compression technique that replaces sequences of identical consecutive values (runs) with a single value and a count, dramatically reducing size for data with long repetitive sequences. Think of it like saying 'five A's' instead of writing 'AAAAA' - you capture the same information with less space. The encoding transforms sequences like 'WWWWWWWWBBBWWWW' into '8W3B4W', storing each unique run as a (count, value) pair. RLE is particularly effective for data with large homogeneous regions: bitmap images with solid color areas, scientific data with repeated measurements, sparse arrays with long zero sequences, and fax machine compression. For example, a row of pixels in a simple graphic might be [white, white, white, white, black, black, white, white, white], which RLE encodes as [(4, white), (2, black), (3, white)]. The technique is used in many file formats including BMP images, PCX graphics, and as a component of more complex compression schemes.",
    problemSolved:
      "Data with long sequences of repeated values wastes storage and transmission bandwidth when each value is stored individually, even though the sequence could be described much more compactly. Traditional compression algorithms like gzip work but have overhead that makes them slow for real-time applications. Run-Length Encoding solves this with an extremely simple, fast algorithm that achieves excellent compression ratios specifically for data with long runs. Without RLE, applications storing bitmap images, simulation output, or sparse matrices use excessive space. RLE provides instant, efficient compression for run-heavy data with minimal computational overhead.",
    tradeoffs: {
      pros: [
        "Extremely fast compression and decompression with minimal CPU overhead, just counting and storing runs",
        "Exceptional compression ratios for data with long repeated sequences, often 10x-100x for simple graphics",
        "Simple to implement in any programming language without complex algorithms or dependencies",
        "Enables random access when combined with run indices, unlike many compression schemes",
        "Works perfectly with any data type: numbers, characters, pixels, or boolean values",
      ],
      cons: [
        "Poor compression or even size expansion for data without runs, like random or highly varied sequences",
        "Worst-case scenario of alternating values doubles the data size since each value becomes (1, value)",
        "Not as effective as modern general-purpose compression for natural data like text or photos",
        "Fixed overhead per run means very short runs (1-2 elements) consume more space than raw data",
        "Limited by maximum run length representable in the count field, requiring special handling for very long runs",
      ],
    },
    relatedPatterns: [
      "delta-encoding",
      "dictionary-coding",
      "lossless",
      "compression",
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
      id: "run-length-encoding-ts-basic",
      language: "typescript",
      title: "TODO: Run-Length Encoding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Run-Length Encoding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
