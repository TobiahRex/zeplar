import type { Pattern } from "../schema";

export const protocolBuffers: Pattern = {
  id: "protocol-buffers",
  slug: "protocol-buffers",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🗜️ Compression → 📦 Protocol Buffers",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Compression",
    level: 4,
  },

  concept: {
    name: "Protocol Buffers",
    emoji: "📦",
    tagline: "Binary serialization",
    definition:
      "Protocol Buffers (protobuf) is a language-agnostic binary serialization format developed by Google that defines data structures in a schema and generates efficient code for encoding and decoding that data across languages. Think of it like a universal translator that lets different programs exchange data in a compact, type-safe format. You define your data structure in a .proto file specifying fields and types, then use the protobuf compiler to generate code for your language (Java, Python, Go, etc). For example, a 'Person' message might have fields for name (string), age (int32), and email (string). When serialized to protobuf binary format, this data takes much less space than JSON or XML because it uses variable-length encoding, skips field names (uses field numbers instead), and packs data efficiently. A Person object that might be 100 bytes in JSON could be 20 bytes in protobuf. The schema provides backward and forward compatibility, so you can evolve your data structures over time without breaking existing code.",
    problemSolved:
      "Exchanging structured data between services typically uses text formats like JSON or XML, which are human-readable but wasteful in terms of bandwidth, parsing CPU, and memory. As systems scale to millions of requests, these inefficiencies become crippling. Protocol Buffers solve this by providing a compact binary format that's 3-10x smaller than JSON and much faster to parse. The schema provides type safety and documentation, catching errors at compile time rather than runtime. Without protobuf, microservices either waste resources on verbose text formats or implement brittle custom binary protocols. Protocol Buffers enable efficient, type-safe inter-service communication at scale.",
    tradeoffs: {
      pros: [
        "Extremely compact binary format reduces bandwidth usage by 60-90% compared to JSON, critical for high-volume systems",
        "Fast serialization and deserialization with minimal CPU overhead and memory allocations",
        "Strong typing and schema validation catch errors at compile time rather than runtime",
        "Built-in support for backward and forward compatibility through optional fields and field numbers",
        "Generates idiomatic code for 20+ languages, enabling polyglot microservice architectures",
      ],
      cons: [
        "Not human-readable in binary form; debugging requires special tools to decode messages",
        "Schema evolution requires careful field number management; reusing numbers breaks compatibility",
        "Toolchain dependency on protoc compiler adds complexity to build processes",
        "No native support for representing arbitrary JSON or unstructured data without workarounds",
        "Smaller ecosystem of tooling compared to JSON for things like validation, transformation, and debugging",
      ],
    },
    relatedPatterns: [
      "delta-encoding",
      "lossless",
      "compression",
      "dictionary-coding",
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
      id: "protocol-buffers-ts-basic",
      language: "typescript",
      title: "TODO: Protocol Buffers Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Protocol Buffers
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
