import type { Pattern } from "../schema";

export const lossless: Pattern = {
  id: "lossless",
  slug: "lossless",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📉 Lossless",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Lossless",
    emoji: "📉",
    tagline: "gzip, LZ4, zstd",
    definition:
      "Lossless compression is a class of compression algorithms that reduce data size while preserving perfect fidelity, allowing exact reconstruction of the original data. Think of it like folding clothes neatly in a suitcase - you use less space but can unfold everything back to its exact original state. Common algorithms include gzip (based on DEFLATE, balancing compression and speed), LZ4 (prioritizing decompression speed over ratio), and zstd (modern algorithm optimizing for both). These algorithms work by finding and eliminating redundancy: repeated patterns get stored once with references, common sequences get shorter codes, and predictable data gets represented efficiently. For example, compressing a text file with gzip might reduce 'the the the the' to a single 'the' plus metadata indicating four repetitions. Lossless compression is essential for any data that must be perfectly preserved: program executables, databases, configuration files, source code, and archives. The algorithms achieve typical compression ratios of 2-4x for text and 1.5-3x for general data.",
    problemSolved:
      "Storage and network transmission costs scale with data size, but storing or sending raw uncompressed data wastes resources since most data contains redundancy and patterns that could be exploited. However, many data types cannot tolerate any quality loss - you can't approximate a ZIP code or slightly modify source code. Lossless compression solves this by finding a more efficient representation that preserves every bit of information. Without lossless compression, data centers would need 2-3x more storage, network costs would be prohibitive, and backups would be impractical. Lossless compression makes efficient use of resources while maintaining data integrity absolutely.",
    tradeoffs: {
      pros: [
        "Perfect data reconstruction guarantees correctness for critical data like databases, code, and documents",
        "Universally applicable to any data type without domain-specific knowledge",
        "Compression ratios improve with redundancy in data, often 2-5x for typical files",
        "Many fast algorithms like LZ4 and zstd provide real-time compression with minimal CPU overhead",
        "Widely supported in every programming language and operating system with battle-tested implementations",
      ],
      cons: [
        "Cannot compress already-compressed or encrypted data; achieves minimal size reduction on random data",
        "Lower compression ratios than lossy methods; JPEG might achieve 10x compression where gzip gets 2x",
        "CPU and memory overhead during compression can be significant for high-ratio algorithms like gzip",
        "Decompression required before data can be used, adding latency to data access",
        "Compression ratio depends heavily on data characteristics; highly random data may not compress at all",
      ],
    },
    relatedPatterns: [
      "lossy",
      "delta-encoding",
      "dictionary-coding",
      "run-length-encoding",
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
      id: "lossless-ts-basic",
      language: "typescript",
      title: "TODO: Lossless Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Lossless
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
