import type { Pattern } from "../schema";

export const streaming: Pattern = {
  id: "streaming",
  slug: "streaming",
  corpusPath: "⚡ PERFORMANCE → 🎯 Work Reduction → 😴 Lazy → 🌊 Streaming",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Lazy",
    level: 4,
  },

  concept: {
    name: "Streaming",
    emoji: "🌊",
    tagline: "Process incrementally",
    definition:
      "Streaming is a data processing pattern that handles large datasets incrementally by processing items one at a time (or in small chunks) as they flow through the system, rather than loading the entire dataset into memory. Think of it like a water hose—water flows continuously through the hose rather than filling a bucket first. For example, processing a 10GB log file with streaming means reading line-by-line, processing each line, and immediately discarding it from memory. The program uses only a few kilobytes of memory regardless of file size. In contrast, loading the entire 10GB file into memory first would require 10GB of RAM and fail on smaller machines. Streaming applies to file processing (reading large files line-by-line), network data transfer (HTTP chunked encoding, video streaming), and data pipelines (Apache Kafka, stream processing frameworks). The pattern enables constant memory usage, lower latency (start processing immediately without waiting for full dataset), and handling unbounded data streams that never end like sensor readings or user activity logs.",
    problemSolved:
      "Loading entire datasets into memory before processing creates severe resource constraints and delays. For example, generating a CSV report from a database with 100 million rows requires 50+ GB of RAM if all rows are fetched into memory first—impossible on most machines and unnecessary since rows are processed independently. Additionally, users wait for the entire dataset to load before seeing any results. A video player that downloads an entire 4GB movie before starting playback makes users wait 10+ minutes on moderate internet connections. Streaming solves this by processing data incrementally: the report generator reads 1,000 rows at a time, writes them to CSV, and discards them from memory—using only 5MB RAM regardless of database size. The video player starts playback after buffering 2-5 seconds of video, providing instant gratification. Streaming also handles unbounded data like live log tails or sensor feeds that never end—you can't load infinity into memory.",
    tradeoffs: {
      pros: [
        "Enables processing of datasets far larger than available memory by maintaining constant memory footprint regardless of data size",
        "Reduces time-to-first-result dramatically since processing starts immediately without waiting for complete data ingestion, improving perceived latency",
        "Handles unbounded infinite data streams like real-time logs, sensor data, or user events that have no defined end",
        "Improves composability by allowing pipeline stages to operate concurrently with backpressure, enabling efficient multi-stage processing",
      ],
      cons: [
        "Prevents operations requiring random access or multiple passes over data like sorting, joining, or computing percentiles without buffering",
        "Complicates error handling since errors may occur mid-stream after partial processing, requiring rollback or compensation logic",
        "Adds complexity to backpressure management when downstream consumers are slower than upstream producers, risking buffer overflow",
        "Can reduce throughput for small datasets due to per-item processing overhead versus batch operations that amortize costs",
      ],
    },
    relatedPatterns: [
      "lazy-loading",
      "pagination",
      "micro-batching",
      "windowing",
      "backpressure",
      "event-sourcing",
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
      id: "streaming-ts-basic",
      language: "typescript",
      title: "TODO: Streaming Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Streaming
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
