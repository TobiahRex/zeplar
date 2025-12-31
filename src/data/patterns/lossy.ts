import type { Pattern } from "../schema";

export const lossy: Pattern = {
  id: "lossy",
  slug: "lossy",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📊 Lossy",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Lossy",
    emoji: "📊",
    tagline: "JPEG, MP3 (acceptable quality loss)",
    definition:
      "Lossy compression is a class of compression algorithms that achieve high compression ratios by permanently discarding information deemed less important to human perception, accepting some quality degradation in exchange for dramatically smaller file sizes. Think of it like summarizing a book - you lose some details but capture the essential story in much less space. Common algorithms include JPEG for images (removes high-frequency details the eye barely notices), MP3 for audio (discards sounds humans can't hear well), and H.264 for video (exploits temporal and spatial redundancy). These algorithms use psycho-perceptual models: JPEG transforms images to frequency domain and heavily quantizes high frequencies; MP3 removes frequencies masked by louder adjacent frequencies. For example, a 10MB raw photo might compress to 1MB JPEG with minimal visible quality loss, or a 50MB audio file might become a 5MB MP3 while sounding nearly identical. The key is exploiting human perception limits - computers can tell the difference, but humans often cannot.",
    problemSolved:
      "Many types of data, especially media files, are far too large for practical storage and transmission when stored in raw form, but lossless compression provides insufficient size reduction for bandwidth-constrained scenarios like streaming and mobile networks. Lossy compression solves this by achieving 10-20x compression ratios (vs 2-3x for lossless) by strategically removing information that contributes little to perceived quality. Without lossy compression, streaming video services, music libraries, and photo sharing would be impractical - a two-hour 4K movie would be hundreds of gigabytes instead of a few. Lossy compression makes modern multimedia applications feasible by balancing quality and size based on human perception.",
    tradeoffs: {
      pros: [
        "Exceptional compression ratios of 10-50x for media, enabling streaming and efficient storage at scale",
        "Tunable quality levels allow trading size for quality based on use case (thumbnails vs prints, streaming vs archival)",
        "Perceptually optimized algorithms produce results that look or sound nearly identical to originals despite significant data loss",
        "Wide hardware acceleration support in GPUs and dedicated chips for real-time encoding/decoding",
        "Industry-standard formats (JPEG, MP3, H.264) have universal support across all platforms and devices",
      ],
      cons: [
        "Quality degradation is permanent and cumulative; repeated compression cycles progressively destroy quality",
        "Inappropriate for any data requiring perfect fidelity: medical images, scientific data, text, code, financial records",
        "Compression artifacts become visible at high compression ratios or when displayed at larger sizes than intended",
        "Cannot reconstruct original data; once compressed, fine details are permanently lost",
        "Requires sophisticated encoding for optimal results; poor encoder settings create terrible quality-to-size ratios",
      ],
    },
    relatedPatterns: ["lossless", "compression", "approximation"],
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
      id: "lossy-ts-basic",
      language: "typescript",
      title: "TODO: Lossy Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Lossy
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
