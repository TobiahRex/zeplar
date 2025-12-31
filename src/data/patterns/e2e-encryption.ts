import type { Pattern } from "../schema";

export const e2EEncryption: Pattern = {
  id: "e2e-encryption",
  slug: "e2e-encryption",
  corpusPath: "🔒 SECURITY → 🔐 Encryption → 🔐 E2E Encryption",

  hierarchy: {
    quality: "security",
    strategy: "",
    family: "Encryption",
    level: 4,
  },

  concept: {
    name: "E2E Encryption",
    emoji: "🔐",
    tagline: "Client-to-client",
    definition:
      "End-to-End Encryption (E2E) is a security approach where data is encrypted on the sender's device and only decrypted on the recipient's device, with no intermediate party (including servers) able to access the plaintext. Think of it like a sealed envelope that only the intended recipient can open, even though it passes through many postal workers' hands. The core mechanism uses asymmetric cryptography: each user has a public key (shared openly) and a private key (kept secret). When Alice wants to send a message to Bob, she encrypts it with Bob's public key; only Bob's private key can decrypt it. Even the messaging service storing or relaying the data sees only encrypted gibberish. For example, WhatsApp uses E2E encryption so that even Facebook (Meta) cannot read your messages. Modern E2E systems often use the Signal Protocol, which combines asymmetric encryption for key exchange with symmetric encryption for message content, plus features like perfect forward secrecy (new keys for each message) and deniability (recipients can't prove who sent a message).",
    problemSolved:
      "Traditional encryption approaches like TLS only protect data in transit between client and server, but servers can still access plaintext data. This creates trust and compliance issues: users must trust service providers not to misuse their data, governments can compel providers to hand over data, and server breaches expose sensitive information. E2E encryption solves the fundamental trust problem by ensuring that only the communicating parties can access the data, removing the service provider from the trust equation. Without E2E, sensitive communications like medical records, legal documents, whistleblower tips, and personal messages are vulnerable to insider threats, legal requests, and hacks. E2E encryption enables truly private communication even when using untrusted infrastructure.",
    tradeoffs: {
      pros: [
        "Maximum privacy and security since servers cannot access plaintext data, protecting against insider threats and breaches",
        "Simplified compliance for service providers since they cannot access user data, reducing legal liability and GDPR concerns",
        "Protection against government surveillance and legal data requests that servers physically cannot fulfill",
        "User control over their own data with no reliance on server-side access controls or policies",
        "Perfect forward secrecy ensures that compromising one message doesn't expose historical messages",
      ],
      cons: [
        "No server-side features like search, content moderation, spam filtering, or data recovery require plaintext access",
        "Key management complexity for users; losing private keys means permanently losing access to data",
        "Difficult to implement multi-device sync while maintaining true E2E guarantees",
        "Performance overhead from client-side encryption/decryption, especially on resource-constrained devices",
        "Debugging and customer support become challenging when service providers cannot see what users are experiencing",
      ],
    },
    relatedPatterns: [
      "encryption-at-rest",
      "envelope-encryption",
      "jwt",
      "key-rotation",
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
      id: "e2e-encryption-ts-basic",
      language: "typescript",
      title: "TODO: E2E Encryption Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for E2E Encryption
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
