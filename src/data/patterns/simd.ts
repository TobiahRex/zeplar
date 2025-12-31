import type { Pattern } from "../schema";

export const sIMD: Pattern = {
  id: "simd",
  slug: "simd",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚡ Parallelism → 🔀 SIMD",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Parallelism",
    level: 4,
  },

  concept: {
    name: "SIMD",
    emoji: "🔀",
    tagline: "Single instruction, multiple data",
    definition:
      "SIMD (Single Instruction, Multiple Data) is a parallel computing architecture where a single CPU instruction operates on multiple data elements simultaneously using vector registers. Think of it like a factory assembly line: instead of one worker painting one car at a time, four workers paint four cars in parallel with the same instruction ('paint red'). Modern CPUs have SIMD instruction sets like AVX-512 (Intel), NEON (ARM), and SSE that can perform operations on 128-bit, 256-bit, or 512-bit registers holding multiple values. For example, adding two arrays [1,2,3,4] + [5,6,7,8] with SIMD loads both into vector registers and performs 4 additions in a single instruction, rather than 4 separate add instructions. This is data-level parallelism—the same operation applied to different data. SIMD is fundamental in image processing (apply filter to pixels), audio/video encoding, machine learning (matrix operations), physics simulations, and cryptography. Compilers can auto-vectorize loops when possible, or developers use intrinsics for explicit control.",
    problemSolved:
      "Sequential processing of large arrays or matrices is slow—processing 1 million pixels with scalar instructions requires 1 million operations. SIMD solves this by processing multiple elements per instruction, achieving 4x-16x speedup for suitable workloads. For example, applying a brightness filter to a 1920x1080 image (2M pixels) with scalar code processes one pixel per instruction. With AVX2 (256-bit registers holding 8 floats), the same code processes 8 pixels per instruction, achieving near 8x speedup. Without SIMD, real-time video processing (30 fps requires processing 62M pixels/sec), scientific simulations, and machine learning inference would be prohibitively slow on CPUs. GPUs excel at SIMD (thousands of parallel threads), but CPU SIMD enables significant speedups without specialized hardware. Libraries like NumPy, TensorFlow, and image codecs (JPEG, H.264) rely heavily on SIMD for performance.",
    tradeoffs: {
      pros: [
        "Achieves 4x-16x speedup for suitable workloads with minimal code changes",
        "Leverages existing CPU hardware—no need for GPU or specialized accelerators",
        "Ideal for data-parallel operations (array processing, image filters, matrix math)",
        "Lower power consumption than running multiple scalar instructions",
        "Compiler auto-vectorization can apply SIMD transparently in many cases",
      ],
      cons: [
        "Only benefits data-parallel workloads—irregular or branching code cannot vectorize",
        "Requires data alignment and contiguous memory layout for optimal performance",
        "Difficult to hand-code SIMD intrinsics—complex, architecture-specific, and error-prone",
        "Branch divergence within SIMD lanes reduces efficiency (masked execution)",
        "Limited register size—512-bit registers hold only 16 floats or 8 doubles",
      ],
    },
    relatedPatterns: [
      "multi-threading",
      "fork-join",
      "batching",
      "vectorization",
      "parallel-processing",
      "gpu-computing",
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
      id: "simd-ts-basic",
      language: "typescript",
      title: "TODO: SIMD Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for SIMD
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
