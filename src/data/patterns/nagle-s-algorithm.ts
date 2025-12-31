import type { Pattern } from "../schema";

export const nagleSAlgorithm: Pattern = {
  id: "nagle-s-algorithm",
  slug: "nagle-s-algorithm",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 📦 Nagle's Algorithm",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Nagle's Algorithm",
    emoji: "📦",
    tagline: "TCP batching small packets",
    definition:
      "Nagle's Algorithm is a TCP optimization that automatically combines multiple small outgoing data chunks into fewer, larger packets to reduce network overhead. Think of it like a postal service that waits to fill a delivery truck rather than sending out a separate truck for each letter—it batches small items together for efficiency. For example, when a user types characters in an SSH terminal session, instead of sending each keystroke in its own 41-byte packet (40 bytes of headers + 1 byte of data), Nagle's algorithm buffers keystrokes and sends them together in larger packets. The algorithm works with a simple rule: if there is unacknowledged data in flight, buffer new small writes until either an acknowledgment arrives or enough data accumulates to fill a maximum segment size (MSS) packet, typically 1460 bytes. This dramatically reduces the number of packets sent for applications that generate small writes, improving network efficiency by reducing header overhead. The algorithm is enabled by default in most TCP implementations but can be disabled via the TCP_NODELAY socket option for latency-sensitive applications.",
    problemSolved:
      "Applications that generate many small writes create severe network inefficiency by sending tiny packets with disproportionate header overhead. For example, a telnet or SSH session sending individual keystrokes creates 1-byte payloads with 40 bytes of TCP/IP headers—a 97.5% overhead ratio. Sending 1000 keystrokes individually requires 41,000 bytes and 1000 packets, consuming significant bandwidth and router processing capacity. This was particularly problematic in the early internet when network capacity was limited. Nagle's algorithm solves this by automatically batching small writes: those same 1000 keystrokes might be combined into 10-20 larger packets totaling around 1800 bytes, reducing both bandwidth usage by 95% and network congestion. The algorithm requires zero application changes—it operates transparently at the TCP layer. However, this batching introduces latency (waiting for acknowledgments before sending buffered data), making it unsuitable for real-time applications.",
    tradeoffs: {
      pros: [
        "Dramatically reduces network packet count for small-write workloads, often reducing packets by 10-100x which lowers bandwidth consumption and router processing load",
        "Improves bandwidth efficiency by amortizing TCP/IP header overhead across larger payloads—turning 97.5% overhead into 3-5% overhead for batched data",
        "Operates completely transparently without requiring application code changes, as it's built into TCP stack implementations by default",
        "Reduces network congestion and improves overall network utilization by decreasing the number of packets competing for bandwidth",
      ],
      cons: [
        "Introduces latency by delaying transmission of small writes until acknowledgment of previous data or MSS reached, adding 10-200ms delays depending on round-trip time",
        "Particularly problematic for request-response protocols where client sends small request and waits for response, as algorithm delays the request until ACK arrives",
        "Can interact poorly with delayed ACK optimization where receiver waits up to 200ms before acknowledging, creating cumulative delays of 200-400ms",
        "Requires explicit disabling (TCP_NODELAY) for latency-sensitive applications like online gaming, VoIP, or real-time collaboration tools, adding configuration complexity",
      ],
    },
    relatedPatterns: [
      "batching",
      "micro-batching",
      "debouncing",
      "compression",
      "connection-pooling",
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
      id: "nagle-s-algorithm-ts-basic",
      language: "typescript",
      title: "TODO: Nagle's Algorithm Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Nagle's Algorithm
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
