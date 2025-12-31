import type { Pattern } from "../schema";

export const dictionaryCoding: Pattern = {
  id: "dictionary-coding",
  slug: "dictionary-coding",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📋 Dictionary Coding",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Dictionary Coding",
    emoji: "📋",
    tagline: "Replace repeated values",
    definition:
      "Dictionary coding is a compression technique that replaces repeated values with shorter references to a dictionary (lookup table) containing unique values, dramatically reducing storage when data has many duplicates. Think of it like using abbreviations: instead of writing 'United States of America' a thousand times, you create a legend that says 'USA = United States of America' and just write 'USA' everywhere. The pattern works by identifying unique values in a dataset, assigning each a small integer ID, and then storing only the IDs plus the dictionary mapping IDs back to original values. For example, a column containing country names ['USA', 'Canada', 'USA', 'Mexico', 'USA', 'Canada'] becomes a dictionary {0: 'USA', 1: 'Canada', 2: 'Mexico'} and encoded data [0, 1, 0, 2, 0, 1]. Since country names are long strings but there are few unique countries, this saves massive space. Column-oriented databases like Apache Parquet automatically apply dictionary encoding to low-cardinality string columns, often achieving 10x-100x compression.",
    problemSolved:
      "Many real-world datasets contain columns with high repetition but low cardinality, like status codes, category names, country codes, or product IDs. Storing these repeated strings or values consumes enormous space and makes queries slow since string comparisons are expensive. Dictionary coding solves this by replacing values with tiny integer codes, turning a data size problem into a small lookup table plus compact integer array. Without dictionary coding, analytical databases waste petabytes storing duplicate strings, and queries spend excessive CPU comparing strings. Dictionary coding enables efficient compression, faster query execution (integer comparisons vs string comparisons), and better cache utilization.",
    tradeoffs: {
      pros: [
        "Exceptional compression ratios for low-cardinality columns; can reduce storage by 90-99% for repeated values",
        "Significantly faster queries since comparisons and joins use small integers instead of strings",
        "Enables efficient predicate pushdown in columnar formats; can skip entire row groups without decompressing",
        "Works perfectly with any data type: strings, numbers, dates, or complex objects",
        "Dictionary can be shared across multiple column chunks in some formats, saving even more space",
      ],
      cons: [
        "High-cardinality data with many unique values makes the dictionary too large, potentially increasing total size",
        "Updates and inserts can invalidate the dictionary, requiring expensive re-encoding of all affected data",
        "Dictionary size must be managed; if it grows too large, it negates the benefit and increases memory pressure",
        "Random access requires two lookups: index to code, then code to value via dictionary",
        "Not effective for completely unique data like UUIDs or timestamps where every value is different",
      ],
    },
    relatedPatterns: [
      "delta-encoding",
      "run-length-encoding",
      "lossless",
      "compression",
      "string-interning",
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
      id: "dictionary-coding-ts-basic",
      language: "typescript",
      title: "TODO: Dictionary Coding Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Dictionary Coding
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
