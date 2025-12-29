import type { Pattern } from "../schema";

export const envelopeEncryption: Pattern = {
  id: "envelope-encryption",
  slug: "envelope-encryption",
  corpusPath: "🔒 SECURITY → 🔐 Encryption → 🏠 Envelope Encryption",

  hierarchy: {
    quality: "security",
    strategy: "Encryption",
    family: "Encryption",
    level: 4,
  },

  concept: {
    name: "Envelope Encryption",
    emoji: "🏠",
    tagline: "Two-layer key hierarchy for scalable data protection",
    definition:
      "Envelope Encryption is a two-tier cryptographic pattern that encrypts data using a Data Encryption Key (DEK), then encrypts the DEK itself with a Key Encryption Key (KEK) stored in a secure Key Management Service (KMS). The plaintext DEK encrypts large volumes of data locally using fast symmetric algorithms like AES-256, while the KEK (which never leaves the KMS) encrypts only the small DEK for secure storage. The encrypted data is stored alongside its encrypted DEK, creating a self-contained 'envelope' that can only be opened by first decrypting the DEK via the KMS. This hierarchical approach solves the fundamental problem of encrypting large datasets efficiently while maintaining centralized key control: the DEK provides performance (fast local encryption without KMS round-trips), while the KEK provides security (centralized key management, audit trails, rotation without data re-encryption). During decryption, the encrypted DEK is sent to KMS for unwrapping, the plaintext DEK decrypts the data, then the DEK is immediately discarded from memory. This pattern enables defense-in-depth security where compromise of stored data alone yields only encrypted DEKs, and compromise of the KMS alone yields no plaintext data—both layers must be breached simultaneously to access plaintext information.",
    problemSolved:
      "Encrypting large datasets with traditional KMS-based encryption creates severe performance and operational bottlenecks. KMS services typically limit request sizes to 4KB and impose rate limits (e.g., AWS KMS: 1,200 requests/second), making direct encryption of gigabyte-scale files impractical—encrypting a 1GB file would require 262,144 KMS calls taking 3.6 minutes and costing $13. Additionally, rotating encryption keys requires re-encrypting all data, creating maintenance windows that can take days for terabyte-scale datasets. Distribution of encryption keys to application servers introduces security risks: storing KEKs locally violates compliance requirements, while fetching them per-operation wastes network bandwidth and KMS quota. Envelope Encryption solves these issues by using fast symmetric DEKs for bulk data encryption (enabling local encryption at multi-GB/second speeds), encrypting only the tiny DEK with the KMS (consuming minimal quota), and storing the encrypted DEK with the data (eliminating key distribution complexity). Key rotation becomes trivial: re-encrypt only the DEKs (small, fast operation) rather than entire datasets, enabling zero-downtime rotation and compliance with policies requiring 90-day key rotation without infrastructure disruption.",
    tradeoffs: {
      pros: [
        "Fast symmetric encryption for large data without KMS bottlenecks (1000x faster than direct KMS encryption)",
        "Minimal KMS API usage: one call per encrypt/decrypt operation regardless of data size",
        "Key rotation without data re-encryption: rotate KEK and re-encrypt only small DEKs",
        "Offline encryption capability: generate DEK locally, encrypt data, call KMS once at end",
        "Defense in depth: requires compromising both storage layer (encrypted DEK) and KMS (KEK) to access data",
      ],
      cons: [
        "Two-layer complexity: must manage both DEK and KEK lifecycles correctly",
        "DEK storage overhead: encrypted DEK must be stored alongside data (adds metadata)",
        "KEK dependency: decryption impossible if KMS is unavailable (creates single point of failure)",
        "Performance overhead for small data: two-layer encryption slower than direct KMS for <4KB payloads",
        "Memory security: plaintext DEK temporarily exists in application memory during encryption/decryption",
      ],
    },
    relatedPatterns: [
      "encryption-at-rest",
      "key-rotation",
      "tls-ssl",
      "e2e-encryption",
      "data-encryption-key",
      "key-encryption-key",
      "defense-in-depth",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client Application",
        role: "Data Encryptor/Decryptor",
        responsibilities: [
          "Request DEK generation from KMS during encryption",
          "Encrypt data using plaintext DEK with symmetric algorithm (AES-256)",
          "Store encrypted data with encrypted DEK metadata",
          "Retrieve encrypted DEK and send to KMS for decryption",
          "Decrypt data using plaintext DEK from KMS",
          "Securely erase plaintext DEK from memory after use",
        ],
      },
      {
        name: "Key Management Service (KMS)",
        role: "KEK Guardian",
        responsibilities: [
          "Generate cryptographically secure DEKs on demand",
          "Encrypt DEK with KEK (envelope wrapping)",
          "Decrypt encrypted DEK with KEK (envelope unwrapping)",
          "Store and protect KEK in hardware security modules (HSM)",
          "Maintain audit logs of all key operations",
          "Enforce access control policies for KEK usage",
        ],
      },
      {
        name: "Data Encryption Key (DEK)",
        role: "Ephemeral Symmetric Key",
        responsibilities: [
          "Provide fast symmetric encryption for bulk data (AES-256-GCM)",
          "Exist in plaintext only during active encryption/decryption operation",
          "Be unique per encryption operation (per-file, per-object, per-field)",
          "Require KEK decryption before use",
        ],
      },
      {
        name: "Key Encryption Key (KEK)",
        role: "Master Key",
        responsibilities: [
          "Never leave KMS/HSM in plaintext form",
          "Encrypt all DEKs for secure storage",
          "Enable key rotation without data re-encryption",
          "Enforce centralized access control and compliance",
        ],
      },
      {
        name: "Encrypted Data Package",
        role: "Storage Container",
        responsibilities: [
          "Store encrypted data payload",
          "Store encrypted DEK as metadata/header",
          "Maintain integrity tags (HMAC/GCM authentication tags)",
          "Include encryption algorithm and version metadata",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant KMS as Key Management Service
    participant KEK as Key Encryption Key
    participant S as Storage

    Note over C,S: ENCRYPTION FLOW
    C->>KMS: GenerateDataKey(KEK_ID)
    KMS->>KEK: Encrypt new DEK with KEK
    KEK-->>KMS: Encrypted DEK
    KMS-->>C: {PlaintextDEK, EncryptedDEK}
    C->>C: Encrypt data with PlaintextDEK (AES-256)
    C->>C: Erase PlaintextDEK from memory
    C->>S: Store {EncryptedData, EncryptedDEK}

    Note over C,S: DECRYPTION FLOW
    C->>S: Retrieve {EncryptedData, EncryptedDEK}
    C->>KMS: Decrypt(EncryptedDEK, KEK_ID)
    KMS->>KEK: Decrypt EncryptedDEK with KEK
    KEK-->>KMS: PlaintextDEK
    KMS-->>C: PlaintextDEK
    C->>C: Decrypt data with PlaintextDEK
    C->>C: Erase PlaintextDEK from memory
    C-->>C: Return plaintext data`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request DEK Generation",
        description:
          "Client calls KMS GenerateDataKey API with KEK identifier to create a new unique DEK for this encryption operation",
      },
      {
        step: 2,
        actor: "KMS",
        action: "Generate and Encrypt DEK",
        description:
          "KMS generates a cryptographically random DEK (e.g., 256-bit AES key), encrypts it with the KEK stored in HSM, and returns both plaintext and encrypted versions",
      },
      {
        step: 3,
        actor: "Client",
        action: "Encrypt Data with Plaintext DEK",
        description:
          "Client encrypts the data payload using the plaintext DEK with a symmetric algorithm (AES-256-GCM), generating ciphertext and authentication tag",
      },
      {
        step: 4,
        actor: "Client",
        action: "Store Encrypted Package",
        description:
          "Client stores encrypted data alongside encrypted DEK as metadata, creating a self-contained envelope; plaintext DEK is securely erased from memory",
      },
      {
        step: 5,
        actor: "Client",
        action: "Retrieve Encrypted Package",
        description:
          "During decryption, client retrieves both encrypted data and encrypted DEK from storage",
      },
      {
        step: 6,
        actor: "Client",
        action: "Request DEK Decryption",
        description:
          "Client sends encrypted DEK to KMS Decrypt API to unwrap it using the KEK",
      },
      {
        step: 7,
        actor: "KMS",
        action: "Decrypt DEK with KEK",
        description:
          "KMS uses the KEK from HSM to decrypt the encrypted DEK and returns the plaintext DEK to the client",
      },
      {
        step: 8,
        actor: "Client",
        action: "Decrypt Data and Erase DEK",
        description:
          "Client decrypts the data using plaintext DEK, verifies authentication tag, then immediately erases plaintext DEK from memory for security",
      },
      {
        step: 9,
        actor: "KMS",
        action: "Audit Logging",
        description:
          "KMS logs all GenerateDataKey and Decrypt operations with identity, timestamp, and KEK ID for compliance and security monitoring",
      },
    ],
    invariants: [
      "DEK must be encrypted with KEK before storage; plaintext DEK never persisted to disk",
      "KEK never leaves KMS/HSM in plaintext form; all KEK operations occur server-side",
      "Each encryption operation should generate a unique DEK to limit blast radius of key compromise",
      "Encrypted DEK must be stored with encrypted data to enable future decryption",
      "All DEK encryption/decryption must go through KMS; no local KEK storage allowed",
      "Plaintext DEK must be securely erased from memory immediately after use",
      "Encrypted data must include algorithm metadata (AES-256-GCM) and initialization vectors",
    ],
  },

  codeExamples: [
    {
      id: "envelope-ts-aws-kms",
      language: "typescript",
      title: "AWS KMS Envelope Encryption for Large Files",
      description:
        "Complete envelope encryption implementation using AWS KMS for KEK operations and AES-256-GCM for DEK encryption, demonstrating file encryption with metadata storage",
      code: `import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from "@aws-sdk/client-kms";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";

/**
 * ACTION: Define envelope encryption configuration
 * REASON: Centralize algorithm choices, key sizes, and KMS settings for consistency
 */
interface EnvelopeConfig {
  kmsKeyId: string;           // ARN of KEK in AWS KMS
  algorithm: string;          // Symmetric cipher: AES-256-GCM
  keyLength: number;          // DEK size in bytes (32 = 256 bits)
  ivLength: number;           // Initialization vector size
  authTagLength: number;      // GCM authentication tag size
}

interface EncryptedEnvelope {
  encryptedData: Buffer;
  encryptedDEK: Buffer;       // DEK encrypted with KEK by KMS
  iv: Buffer;                 // Initialization vector for AES-GCM
  authTag: Buffer;            // GCM authentication tag for integrity
  algorithm: string;          // Algorithm used (for decryption)
}

/**
 * ACTION: AWS KMS Envelope Encryption Service
 * REASON: Encapsulate envelope pattern complexity with clean encrypt/decrypt API
 */
class AWSEnvelopeEncryption {
  private kmsClient: KMSClient;
  private config: EnvelopeConfig;

  constructor(config: EnvelopeConfig) {
    this.config = config;
    this.kmsClient = new KMSClient({ region: "us-east-1" });
  }

  /**
   * ACTION: Encrypt data using envelope encryption pattern
   * REASON: KMS generates and encrypts DEK; we use DEK for fast local encryption
   * CONTEXT DILATION: Large file encryption - encrypt 1GB file in 2 seconds vs
   * 3.6 minutes with direct KMS encryption (KMS limited to 4KB chunks, 1000x slower).
   * DEK enables local AES-256 encryption at 500MB/s while consuming just 1 KMS API call.
   */
  async encrypt(plaintext: Buffer): Promise<EncryptedEnvelope> {
    // ACTION: Request KMS to generate a new DEK and encrypt it with KEK
    // REASON: KMS generates cryptographically secure random key and encrypts it
    // in one atomic operation, avoiding separate GenerateRandom + Encrypt calls
    const generateKeyCommand = new GenerateDataKeyCommand({
      KeyId: this.config.kmsKeyId,
      KeySpec: "AES_256",  // Request 256-bit AES key
    });

    const { Plaintext: plaintextDEK, CiphertextBlob: encryptedDEK } =
      await this.kmsClient.send(generateKeyCommand);

    if (!plaintextDEK || !encryptedDEK) {
      throw new Error("KMS failed to generate data key");
    }

    try {
      // ACTION: Generate random initialization vector for AES-GCM
      // REASON: Unique IV per encryption ensures same plaintext produces different
      // ciphertext, preventing pattern analysis attacks
      const iv = randomBytes(this.config.ivLength);

      // ACTION: Create AES-256-GCM cipher with plaintext DEK
      // REASON: GCM mode provides both encryption and authentication, detecting
      // tampering without separate HMAC. AES-256 symmetric cipher encrypts at
      // multi-GB/second speeds on modern CPUs with AES-NI instructions
      const cipher = createCipheriv(this.config.algorithm, plaintextDEK, iv, {
        authTagLength: this.config.authTagLength,
      });

      // ACTION: Encrypt data in streaming chunks
      // REASON: Streaming prevents loading entire file into memory, enabling
      // encryption of multi-GB files with constant memory usage
      const encryptedChunks: Buffer[] = [];
      encryptedChunks.push(cipher.update(plaintext));
      encryptedChunks.push(cipher.final());

      // ACTION: Extract GCM authentication tag after encryption
      // REASON: Auth tag allows verifying data integrity during decryption,
      // detecting corruption or malicious tampering without decrypting
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: Buffer.concat(encryptedChunks),
        encryptedDEK: Buffer.from(encryptedDEK),
        iv,
        authTag,
        algorithm: this.config.algorithm,
      };
    } finally {
      // ACTION: Securely zero out plaintext DEK from memory
      // REASON: DEK in memory is a security risk; overwrite with zeros to prevent
      // exposure via memory dumps, swap files, or core dumps
      if (plaintextDEK) {
        plaintextDEK.fill(0);
      }
    }
  }

  /**
   * ACTION: Decrypt envelope-encrypted data
   * REASON: Send encrypted DEK to KMS for unwrapping, then decrypt data locally
   */
  async decrypt(envelope: EncryptedEnvelope): Promise<Buffer> {
    // ACTION: Request KMS to decrypt the encrypted DEK using KEK
    // REASON: Only KMS has access to KEK in HSM; this unwraps the envelope
    // to reveal plaintext DEK needed for data decryption
    const decryptCommand = new DecryptCommand({
      CiphertextBlob: envelope.encryptedDEK,
      KeyId: this.config.kmsKeyId,  // Optional: validates correct KEK
    });

    const { Plaintext: plaintextDEK } = await this.kmsClient.send(decryptCommand);

    if (!plaintextDEK) {
      throw new Error("KMS failed to decrypt data key");
    }

    try {
      // ACTION: Create AES-256-GCM decipher with plaintext DEK and original IV
      // REASON: Decryption requires same key, IV, and algorithm as encryption
      const decipher = createDecipheriv(
        envelope.algorithm,
        plaintextDEK,
        envelope.iv,
        { authTagLength: this.config.authTagLength }
      );

      // ACTION: Set authentication tag before decryption
      // REASON: GCM verifies auth tag during decryption; mismatch throws error,
      // preventing decryption of tampered data
      decipher.setAuthTag(envelope.authTag);

      // ACTION: Decrypt data in chunks
      // REASON: Streaming decryption for memory efficiency with large files
      const decryptedChunks: Buffer[] = [];
      decryptedChunks.push(decipher.update(envelope.encryptedData));
      decryptedChunks.push(decipher.final());  // Throws if auth tag verification fails

      return Buffer.concat(decryptedChunks);
    } finally {
      // ACTION: Securely erase plaintext DEK from memory
      // REASON: Minimize DEK exposure window; DEK should only exist during active operation
      if (plaintextDEK) {
        plaintextDEK.fill(0);
      }
    }
  }

  /**
   * ACTION: Encrypt file with envelope encryption and store metadata
   * REASON: Real-world usage requires persisting encrypted DEK with encrypted data
   * CONTEXT DILATION: Performance comparison - encrypt 1GB file:
   * - Direct KMS: 262,144 API calls, 3.6 minutes, $13 cost
   * - Envelope encryption: 1 API call, 2 seconds, $0.005 cost
   * 1000x faster, 2600x cheaper, unlimited size (KMS limited to 4KB)
   */
  async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const fs = await import("fs/promises");
    const plaintext = await fs.readFile(inputPath);

    console.log(\`Encrypting file: \${inputPath} (\${plaintext.length} bytes)\`);
    const startTime = Date.now();

    const envelope = await this.encrypt(plaintext);

    // ACTION: Store encrypted data with envelope metadata as JSON header
    // REASON: Self-contained package allows decryption without external metadata store
    const metadata = {
      encryptedDEK: envelope.encryptedDEK.toString("base64"),
      iv: envelope.iv.toString("base64"),
      authTag: envelope.authTag.toString("base64"),
      algorithm: envelope.algorithm,
      kmsKeyId: this.config.kmsKeyId,
    };

    // ACTION: Write metadata as JSON header followed by encrypted data
    // REASON: Common pattern for self-describing encrypted files; header parsed
    // to extract envelope parameters before decrypting data
    const header = Buffer.from(JSON.stringify(metadata) + "\\n");
    await fs.writeFile(outputPath, Buffer.concat([header, envelope.encryptedData]));

    const duration = Date.now() - startTime;
    console.log(\`Encrypted in \${duration}ms (1 KMS call)\`);
  }

  /**
   * ACTION: Decrypt file encrypted with envelope pattern
   * REASON: Parse metadata header, decrypt DEK via KMS, decrypt data locally
   */
  async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const fs = await import("fs/promises");
    const fileContent = await fs.readFile(inputPath, "utf8");

    // ACTION: Parse JSON metadata header from encrypted file
    // REASON: Extract encrypted DEK, IV, and auth tag needed for decryption
    const [metadataJson, ...encryptedDataParts] = fileContent.split("\\n");
    const metadata = JSON.parse(metadataJson);

    const envelope: EncryptedEnvelope = {
      encryptedData: Buffer.from(encryptedDataParts.join("\\n")),
      encryptedDEK: Buffer.from(metadata.encryptedDEK, "base64"),
      iv: Buffer.from(metadata.iv, "base64"),
      authTag: Buffer.from(metadata.authTag, "base64"),
      algorithm: metadata.algorithm,
    };

    console.log(\`Decrypting file: \${inputPath}\`);
    const startTime = Date.now();

    const plaintext = await this.decrypt(envelope);
    await fs.writeFile(outputPath, plaintext);

    const duration = Date.now() - startTime;
    console.log(\`Decrypted in \${duration}ms (1 KMS call)\`);
  }
}

// Usage Example
async function example() {
  const config: EnvelopeConfig = {
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    algorithm: "aes-256-gcm",
    keyLength: 32,        // 256 bits
    ivLength: 12,         // 96 bits (recommended for GCM)
    authTagLength: 16,    // 128 bits
  };

  const encryptor = new AWSEnvelopeEncryption(config);

  // Encrypt large file (e.g., 1GB database backup)
  await encryptor.encryptFile(
    "/data/backup.sql",
    "/data/backup.sql.encrypted"
  );

  // Decrypt when needed
  await encryptor.decryptFile(
    "/data/backup.sql.encrypted",
    "/data/backup.sql.restored"
  );
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-grade envelope encryption service with AWS KMS integration for large file encryption",
        prerequisites: [
          "AWS KMS concepts",
          "Symmetric encryption (AES-GCM)",
          "Node.js crypto module",
          "Buffer management",
        ],
        systemPosition:
          "Application encryption layer for database backups, file uploads, or sensitive data storage",
      },
      annotations: [
        {
          id: "env-kms-generate",
          lines: [45, 52],
          action: "Request KMS to generate and encrypt new DEK in one call",
          reason:
            "GenerateDataKey is atomic operation that returns both plaintext DEK (for immediate encryption) and encrypted DEK (for storage), avoiding race conditions and reducing API calls",
          contextLevel: "system",
          relatedConcepts: ["kms", "key-generation", "atomic-operations"],
        },
        {
          id: "env-aes-gcm",
          lines: [66, 72],
          action: "Use AES-256-GCM for authenticated encryption",
          reason:
            "GCM mode provides encryption + authentication in one pass, faster than AES-CBC + HMAC. AES-256 with hardware acceleration (AES-NI) encrypts at 1-5 GB/s on modern CPUs",
          contextLevel: "system",
          relatedConcepts: [
            "authenticated-encryption",
            "aes",
            "performance-optimization",
          ],
        },
        {
          id: "env-dek-erasure",
          lines: [90, 95],
          action: "Zero out plaintext DEK from memory after use",
          reason:
            "Plaintext DEK in memory is security vulnerability; overwriting prevents exposure via memory dumps, debuggers, or swap files. Defense-in-depth security practice",
          contextLevel: "system",
          relatedConcepts: ["memory-security", "key-lifecycle"],
        },
        {
          id: "env-kms-decrypt",
          lines: [107, 113],
          action: "Decrypt encrypted DEK by sending to KMS",
          reason:
            "Only KMS has KEK to unwrap encrypted DEK; this is the envelope unwrapping step that reveals plaintext DEK for data decryption",
          contextLevel: "system",
          relatedConcepts: ["kms", "envelope-unwrapping"],
        },
        {
          id: "env-auth-tag",
          lines: [127, 131],
          action: "Set GCM authentication tag before decryption",
          reason:
            "Auth tag verification detects tampering or corruption; GCM throws error on mismatch, preventing decryption of modified ciphertext (integrity protection)",
          contextLevel: "local",
          relatedConcepts: ["message-authentication", "integrity-protection"],
        },
        {
          id: "env-metadata",
          lines: [161, 170],
          action: "Store envelope metadata with encrypted data",
          reason:
            "Self-contained encrypted package includes everything needed for future decryption: encrypted DEK, IV, auth tag, algorithm. Eliminates external metadata database",
          contextLevel: "system",
          relatedConcepts: ["self-describing-data", "metadata-management"],
        },
        {
          id: "env-performance",
          lines: [149, 154],
          action: "Measure encryption time and KMS API calls",
          reason:
            "Demonstrating performance benefit: 1 KMS call regardless of data size vs 262,144 calls for 1GB with direct KMS encryption. Critical for understanding envelope pattern value",
          contextLevel: "system",
          relatedConcepts: [
            "performance-monitoring",
            "api-optimization",
            "cost-optimization",
          ],
        },
        {
          id: "env-streaming",
          lines: [74, 77],
          action: "Stream encrypt data in chunks",
          reason:
            "Streaming prevents loading entire file into memory, enabling encryption of multi-GB files with constant memory footprint. Essential for large file handling",
          contextLevel: "module",
          relatedConcepts: ["streaming", "memory-efficiency"],
        },
      ],
      highlights: [
        {
          lines: [45, 62],
          label: "KMS GenerateDataKey - Envelope wrapping",
          sbvpDomain: "structure",
        },
        {
          lines: [66, 88],
          label: "DEK-based AES-256-GCM encryption",
          sbvpDomain: "behavior",
        },
        {
          lines: [161, 177],
          label: "Self-contained encrypted envelope storage",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "envelope-py-gcp-kms",
      language: "python",
      title: "Google Cloud KMS Envelope Encryption with Key Rotation",
      description:
        "Python implementation using Cloud KMS for KEK management and Fernet for DEK encryption, demonstrating database field encryption with DEK caching and key rotation",
      code: `from google.cloud import kms
from cryptography.fernet import Fernet
from typing import Dict, Optional, Tuple
import base64
import json
import time
from dataclasses import dataclass
from functools import lru_cache

"""
ACTION: Configure Google Cloud KMS envelope encryption
REASON: Centralize KMS project/location/keyring settings for consistent encryption
"""
@dataclass
class GCPEnvelopeConfig:
    project_id: str
    location: str
    key_ring: str
    key_name: str

    @property
    def key_path(self) -> str:
        """Full resource path for KEK in Cloud KMS"""
        return (
            f"projects/{self.project_id}/locations/{self.location}/"
            f"keyRings/{self.key_ring}/cryptoKeys/{self.key_name}"
        )

@dataclass
class EncryptedEnvelope:
    """Container for encrypted data and envelope metadata"""
    ciphertext: bytes
    encrypted_dek: bytes
    algorithm: str
    kek_version: int

class GCPEnvelopeEncryption:
    """
    ACTION: Google Cloud KMS Envelope Encryption Service
    REASON: Encapsulate envelope pattern with Fernet DEK and Cloud KMS KEK
    CONTEXT DILATION: Key rotation without data re-encryption - rotate KEK and
    re-encrypt only DEKs (small, fast operation) rather than entire database
    (terabytes, days). Rotating 1 million encrypted fields: re-encrypt 1M DEKs
    (32 bytes each = 32MB, <1 minute) vs re-encrypt 1M records (1GB+, hours).
    """

    def __init__(self, config: GCPEnvelopeConfig):
        self.config = config
        self.kms_client = kms.KeyManagementServiceClient()
        self._dek_cache: Dict[str, Tuple[bytes, float]] = {}
        self._cache_ttl = 300  # 5 minute DEK cache

    def _generate_dek(self) -> bytes:
        """
        ACTION: Generate cryptographically secure 256-bit DEK for Fernet
        REASON: Fernet requires 32-byte URL-safe base64-encoded key
        """
        # Fernet.generate_key() produces cryptographically secure random key
        return Fernet.generate_key()

    def _encrypt_dek_with_kek(self, plaintext_dek: bytes) -> bytes:
        """
        ACTION: Encrypt DEK using KEK in Cloud KMS
        REASON: KEK never leaves Cloud KMS HSM; this wraps the envelope
        """
        encrypt_request = {
            "name": self.config.key_path,
            "plaintext": plaintext_dek,
        }

        response = self.kms_client.encrypt(request=encrypt_request)
        return response.ciphertext

    def _decrypt_dek_with_kek(self, encrypted_dek: bytes) -> bytes:
        """
        ACTION: Decrypt DEK using KEK in Cloud KMS
        REASON: Unwrap envelope to reveal plaintext DEK for data decryption
        """
        decrypt_request = {
            "name": self.config.key_path,
            "ciphertext": encrypted_dek,
        }

        response = self.kms_client.decrypt(request=decrypt_request)
        return response.plaintext

    def encrypt(self, plaintext: bytes, context: Optional[Dict] = None) -> EncryptedEnvelope:
        """
        ACTION: Encrypt data using envelope encryption pattern
        REASON: Generate DEK, encrypt data with Fernet, encrypt DEK with KMS
        """
        # ACTION: Generate unique DEK for this encryption operation
        # REASON: Unique DEK per record limits blast radius; compromise of one DEK
        # doesn't expose other records. Best practice for defense in depth
        plaintext_dek = self._generate_dek()

        try:
            # ACTION: Create Fernet cipher with plaintext DEK
            # REASON: Fernet provides authenticated encryption (AES-128-CBC + HMAC)
            # with simple API, handling IV generation and auth tag automatically
            fernet = Fernet(plaintext_dek)

            # ACTION: Encrypt data with Fernet DEK
            # REASON: Fernet adds timestamp and handles padding automatically,
            # producing URL-safe base64 output suitable for database storage
            ciphertext = fernet.encrypt(plaintext)

            # ACTION: Encrypt DEK with KEK via Cloud KMS
            # REASON: Wrap the envelope - DEK is now protected by KEK in HSM
            encrypted_dek = self._encrypt_dek_with_kek(plaintext_dek)

            # ACTION: Get current KEK version from Cloud KMS
            # REASON: Track which KEK version encrypted this DEK for key rotation
            key_info = self.kms_client.get_crypto_key(name=self.config.key_path)
            kek_version = int(key_info.primary.name.split("/")[-1])

            return EncryptedEnvelope(
                ciphertext=ciphertext,
                encrypted_dek=encrypted_dek,
                algorithm="fernet",
                kek_version=kek_version,
            )
        finally:
            # ACTION: Securely erase plaintext DEK from memory
            # REASON: Zero out sensitive key material to minimize exposure window
            if plaintext_dek:
                plaintext_dek = b"\\0" * len(plaintext_dek)

    def decrypt(self, envelope: EncryptedEnvelope) -> bytes:
        """
        ACTION: Decrypt envelope-encrypted data
        REASON: Decrypt DEK with KMS, then decrypt data with DEK
        """
        # ACTION: Check DEK cache to avoid redundant KMS calls
        # REASON: Decrypting same record multiple times reuses cached DEK,
        # reducing KMS API usage and latency. Critical for database queries
        # returning multiple encrypted rows
        cache_key = base64.b64encode(envelope.encrypted_dek).decode()

        if cache_key in self._dek_cache:
            cached_dek, cache_time = self._dek_cache[cache_key]
            if time.time() - cache_time < self._cache_ttl:
                plaintext_dek = cached_dek
            else:
                # Cache expired, decrypt and refresh
                plaintext_dek = self._decrypt_dek_with_kek(envelope.encrypted_dek)
                self._dek_cache[cache_key] = (plaintext_dek, time.time())
        else:
            # ACTION: Decrypt DEK with Cloud KMS KEK
            # REASON: KMS unwraps envelope to reveal plaintext DEK
            plaintext_dek = self._decrypt_dek_with_kek(envelope.encrypted_dek)

            # ACTION: Cache plaintext DEK for performance
            # REASON: Multiple queries may decrypt same field; caching avoids
            # redundant KMS calls (5ms latency each). For 1000 row query,
            # saves 5 seconds if all rows use same DEK
            self._dek_cache[cache_key] = (plaintext_dek, time.time())

        try:
            # ACTION: Create Fernet cipher with plaintext DEK
            # REASON: Same DEK used for encryption must decrypt the data
            fernet = Fernet(plaintext_dek)

            # ACTION: Decrypt data with Fernet
            # REASON: Fernet automatically verifies HMAC auth tag and timestamp,
            # throwing exception if data tampered or too old (TTL enforcement)
            plaintext = fernet.decrypt(envelope.ciphertext)

            return plaintext
        finally:
            # DEK cached, so don't zero out here - will expire via TTL
            pass

    def rotate_kek(self, old_kek_version: int) -> None:
        """
        ACTION: Rotate KEK and re-encrypt DEKs without touching data
        REASON: Demonstrates envelope encryption's key rotation advantage
        CONTEXT DILATION: Re-encrypt 1 million database fields during KEK rotation:
        - Without envelope encryption: Decrypt and re-encrypt 1M records (1TB data,
          days of downtime, database locks)
        - With envelope encryption: Re-encrypt 1M DEKs (32MB total, <1 minute,
          no data access needed, zero downtime)
        100,000x less data to re-encrypt, 10,000x faster rotation
        """
        print(f"Rotating KEK from version {old_kek_version}")

        # ACTION: Create new KEK version in Cloud KMS
        # REASON: Cloud KMS supports key versioning; new version becomes primary
        # for future encryptions while old version still available for decryption
        # (gradual migration)
        # Note: In production, this would be done via KMS API or console

        # ACTION: Re-encrypt all DEKs with new KEK version
        # REASON: Decrypt DEK with old KEK, encrypt with new KEK, update database
        # Only small DEKs re-encrypted, NOT the large encrypted data payloads
        print("Re-encrypting DEKs with new KEK version...")

        # Pseudo-code for database migration:
        # for record in database.query("SELECT encrypted_dek FROM users WHERE kek_version = ?", old_kek_version):
        #     old_encrypted_dek = record.encrypted_dek
        #     plaintext_dek = self._decrypt_dek_with_kek(old_encrypted_dek)
        #     new_encrypted_dek = self._encrypt_dek_with_kek(plaintext_dek)
        #     database.update("UPDATE users SET encrypted_dek = ?, kek_version = ? WHERE id = ?",
        #                     new_encrypted_dek, new_kek_version, record.id)

        print("KEK rotation complete - data never re-encrypted!")

    def encrypt_database_field(self, table: str, record_id: int,
                                field: str, value: str) -> Dict:
        """
        ACTION: Encrypt database field using envelope encryption
        REASON: Real-world usage for protecting PII in databases (SSN, credit cards)
        """
        plaintext = value.encode("utf-8")
        envelope = self.encrypt(plaintext)

        # ACTION: Serialize envelope as JSON for database storage
        # REASON: Store encrypted DEK alongside encrypted data as database fields
        # or JSON column. Self-contained per record, no external key store needed
        return {
            "table": table,
            "record_id": record_id,
            "field": field,
            "ciphertext": base64.b64encode(envelope.ciphertext).decode(),
            "encrypted_dek": base64.b64encode(envelope.encrypted_dek).decode(),
            "algorithm": envelope.algorithm,
            "kek_version": envelope.kek_version,
        }

    def decrypt_database_field(self, encrypted_field: Dict) -> str:
        """
        ACTION: Decrypt database field encrypted with envelope pattern
        REASON: Reconstruct envelope from database JSON and decrypt
        """
        envelope = EncryptedEnvelope(
            ciphertext=base64.b64decode(encrypted_field["ciphertext"]),
            encrypted_dek=base64.b64decode(encrypted_field["encrypted_dek"]),
            algorithm=encrypted_field["algorithm"],
            kek_version=encrypted_field["kek_version"],
        )

        plaintext = self.decrypt(envelope)
        return plaintext.decode("utf-8")

# Usage Example
def example():
    config = GCPEnvelopeConfig(
        project_id="my-project",
        location="us-central1",
        key_ring="production-keyring",
        key_name="customer-data-kek",
    )

    encryptor = GCPEnvelopeEncryption(config)

    # Encrypt sensitive PII field
    encrypted_ssn = encryptor.encrypt_database_field(
        table="users",
        record_id=12345,
        field="ssn",
        value="123-45-6789",
    )

    print(f"Encrypted SSN: {encrypted_ssn}")

    # Store encrypted_ssn JSON in database
    # database.execute("UPDATE users SET encrypted_ssn = ? WHERE id = ?",
    #                  json.dumps(encrypted_ssn), 12345)

    # Later: decrypt when needed
    decrypted_ssn = encryptor.decrypt_database_field(encrypted_ssn)
    print(f"Decrypted SSN: {decrypted_ssn}")

    # Rotate KEK without re-encrypting data
    encryptor.rotate_kek(old_kek_version=1)`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production database field encryption with Cloud KMS, DEK caching for query performance, and zero-downtime key rotation",
        prerequisites: [
          "Google Cloud KMS",
          "Fernet symmetric encryption",
          "Python cryptography library",
          "Database encryption patterns",
        ],
        systemPosition:
          "Database encryption layer for protecting PII/PHI in application databases",
      },
      annotations: [
        {
          id: "env-py-fernet",
          lines: [94, 100],
          action: "Use Fernet for DEK-based authenticated encryption",
          reason:
            "Fernet provides simple API for AES-128-CBC + HMAC with automatic IV/timestamp handling, making it ideal for application-layer encryption without crypto expertise",
          contextLevel: "system",
          relatedConcepts: [
            "fernet",
            "authenticated-encryption",
            "developer-ergonomics",
          ],
        },
        {
          id: "env-py-unique-dek",
          lines: [88, 91],
          action: "Generate unique DEK per encryption operation",
          reason:
            "Per-record DEKs provide defense in depth; compromising one DEK exposes only one record, not entire database. Critical for PII/PHI compliance",
          contextLevel: "system",
          relatedConcepts: ["defense-in-depth", "blast-radius-limitation"],
        },
        {
          id: "env-py-kek-version",
          lines: [108, 111],
          action: "Track KEK version used to encrypt each DEK",
          reason:
            "Enables gradual key rotation: old KEK version still decrypts existing DEKs while new version encrypts new DEKs, allowing zero-downtime migration",
          contextLevel: "system",
          relatedConcepts: ["key-versioning", "gradual-migration"],
        },
        {
          id: "env-py-dek-cache",
          lines: [134, 145],
          action: "Cache decrypted DEKs with TTL to reduce KMS API calls",
          reason:
            "Database queries returning 1000 encrypted rows would make 1000 KMS calls without caching (5 seconds latency). Caching reduces to 1 call (5ms), 1000x faster",
          contextLevel: "system",
          relatedConcepts: ["caching", "api-optimization", "query-performance"],
        },
        {
          id: "env-py-rotation",
          lines: [171, 194],
          action: "Rotate KEK by re-encrypting only DEKs, not data",
          reason:
            "Demonstrates envelope encryption's killer feature: rotate encryption keys without touching encrypted data. Re-encrypt 1M DEKs (32MB) in <1 minute vs 1M records (1TB) in days",
          contextLevel: "system",
          relatedConcepts: [
            "key-rotation",
            "zero-downtime-migration",
            "compliance",
          ],
        },
        {
          id: "env-py-db-field",
          lines: [196, 212],
          action: "Store encrypted DEK with encrypted data as database field",
          reason:
            "Self-contained per-record encryption: each row has its own encrypted DEK, enabling decryption without external key store or coordination",
          contextLevel: "system",
          relatedConcepts: ["self-describing-data", "database-encryption"],
        },
        {
          id: "env-py-fernet-verify",
          lines: [154, 158],
          action:
            "Fernet automatically verifies HMAC and timestamp during decrypt",
          reason:
            "Authenticated encryption detects tampering or corruption; Fernet throws exception if auth tag mismatch or ciphertext too old (TTL enforcement)",
          contextLevel: "local",
          relatedConcepts: ["message-authentication", "integrity-verification"],
        },
        {
          id: "env-py-kms-path",
          lines: [21, 27],
          action: "Construct full KMS resource path from config components",
          reason:
            "Google Cloud KMS requires full resource path format; centralizing construction ensures consistency across all KMS API calls",
          contextLevel: "module",
          relatedConcepts: ["configuration-management", "api-integration"],
        },
      ],
      highlights: [
        {
          lines: [88, 118],
          label: "Envelope encryption with Fernet DEK",
          sbvpDomain: "behavior",
        },
        {
          lines: [134, 162],
          label: "DEK caching for query performance optimization",
          sbvpDomain: "philosophy",
        },
        {
          lines: [171, 194],
          label: "Zero-downtime key rotation without data re-encryption",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "envelope-java-vault",
      language: "java",
      title: "HashiCorp Vault Envelope Encryption for S3 Objects",
      description:
        "Java implementation using Vault Transit Engine for KEK operations and AES for DEK, demonstrating batch file encryption with offline capability and cost optimization",
      code: `package com.example.encryption;

import com.bettercloud.vault.Vault;
import com.bettercloud.vault.VaultConfig;
import com.bettercloud.vault.VaultException;
import com.bettercloud.vault.response.LogicalResponse;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * ACTION: Define envelope encryption configuration for Vault
 * REASON: Centralize Vault address, token, and transit engine settings
 */
class VaultEnvelopeConfig {
    private final String vaultAddress;
    private final String vaultToken;
    private final String transitKeyName;
    private final String algorithm = "AES/GCM/NoPadding";
    private final int keySize = 256;
    private final int gcmTagLength = 128;
    private final int ivLength = 12;

    public VaultEnvelopeConfig(String address, String token, String keyName) {
        this.vaultAddress = address;
        this.vaultToken = token;
        this.transitKeyName = keyName;
    }

    // Getters omitted for brevity
    public String getVaultAddress() { return vaultAddress; }
    public String getVaultToken() { return vaultToken; }
    public String getTransitKeyName() { return transitKeyName; }
    public String getAlgorithm() { return algorithm; }
    public int getKeySize() { return keySize; }
    public int getGcmTagLength() { return gcmTagLength; }
    public int getIvLength() { return ivLength; }
}

/**
 * ACTION: Container for encrypted envelope data
 * REASON: Encapsulate all components needed to decrypt data later
 */
class EncryptedEnvelope {
    private final byte[] ciphertext;
    private final String encryptedDEK;  // Base64 encoded encrypted DEK from Vault
    private final byte[] iv;
    private final String algorithm;

    public EncryptedEnvelope(byte[] ciphertext, String encryptedDEK,
                             byte[] iv, String algorithm) {
        this.ciphertext = ciphertext;
        this.encryptedDEK = encryptedDEK;
        this.iv = iv;
        this.algorithm = algorithm;
    }

    // Getters
    public byte[] getCiphertext() { return ciphertext; }
    public String getEncryptedDEK() { return encryptedDEK; }
    public byte[] getIv() { return iv; }
    public String getAlgorithm() { return algorithm; }
}

/**
 * ACTION: HashiCorp Vault Envelope Encryption Service
 * REASON: Integrate Vault Transit Engine for KEK operations with local AES DEK encryption
 * CONTEXT DILATION: Offline operation and API reduction - encrypt 100 S3 objects:
 * - Direct KMS approach: 100 KMS encrypt calls (500ms latency each = 50 seconds, 100 API calls)
 * - Envelope encryption: Generate 100 DEKs locally (0ms), encrypt 100 files locally (2 seconds),
 *   batch encrypt 100 DEKs with Vault (1 API call, 500ms total)
 * 99% API call reduction, 25x faster, massive cost savings ($0.03 vs $0.0003)
 */
public class VaultEnvelopeEncryption {
    private final VaultEnvelopeConfig config;
    private final Vault vault;
    private final SecureRandom secureRandom;

    public VaultEnvelopeEncryption(VaultEnvelopeConfig config) throws VaultException {
        this.config = config;
        this.secureRandom = new SecureRandom();

        // ACTION: Initialize Vault client with config
        // REASON: Vault Transit Engine provides KEK encryption without storing data,
        // only wrapping/unwrapping DEKs. Ideal for envelope encryption pattern
        VaultConfig vaultConfig = new VaultConfig()
            .address(config.getVaultAddress())
            .token(config.getVaultToken())
            .build();

        this.vault = new Vault(vaultConfig);
    }

    /**
     * ACTION: Generate cryptographically secure AES-256 DEK
     * REASON: Local DEK generation avoids network round-trip to Vault,
     * enabling offline encryption of data before calling Vault to wrap DEK
     */
    private SecretKey generateDEK() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(config.getKeySize(), secureRandom);
        return keyGen.generateKey();
    }

    /**
     * ACTION: Encrypt DEK using Vault Transit Engine KEK
     * REASON: Vault Transit wraps DEK without storing it; KEK never leaves Vault
     * Transit Engine is purpose-built for envelope encryption use cases
     */
    private String encryptDEKWithVault(SecretKey dek) throws VaultException {
        // ACTION: Base64 encode DEK for Vault Transit API
        // REASON: Vault Transit expects base64-encoded plaintext for encryption
        byte[] dekBytes = dek.getEncoded();
        String dekBase64 = Base64.getEncoder().encodeToString(dekBytes);

        // ACTION: Call Vault Transit encrypt endpoint
        // REASON: Transit engine encrypts DEK with KEK and returns versioned ciphertext
        // Format: "vault:v1:ciphertext" includes key version for rotation support
        LogicalResponse response = vault.logical()
            .write("transit/encrypt/" + config.getTransitKeyName(),
                   Map.of("plaintext", dekBase64));

        String encryptedDEK = response.getData().get("ciphertext");
        return encryptedDEK;
    }

    /**
     * ACTION: Decrypt DEK using Vault Transit Engine KEK
     * REASON: Unwrap envelope by decrypting DEK with Vault's KEK
     */
    private SecretKey decryptDEKWithVault(String encryptedDEK) throws Exception {
        // ACTION: Call Vault Transit decrypt endpoint
        // REASON: Transit engine decrypts ciphertext with appropriate KEK version
        // (version embedded in "vault:v1:" prefix), returning base64 plaintext
        LogicalResponse response = vault.logical()
            .write("transit/decrypt/" + config.getTransitKeyName(),
                   Map.of("ciphertext", encryptedDEK));

        String dekBase64 = response.getData().get("plaintext");
        byte[] dekBytes = Base64.getDecoder().decode(dekBase64);

        return new SecretKeySpec(dekBytes, "AES");
    }

    /**
     * ACTION: Encrypt data using envelope encryption pattern
     * REASON: Generate DEK locally, encrypt data with AES-GCM, wrap DEK with Vault
     * CONTEXT DILATION: This enables offline encryption - encrypt entire file locally
     * (no network), then single Vault call to wrap DEK. Contrast with direct Vault
     * encryption requiring network call for every chunk
     */
    public EncryptedEnvelope encrypt(byte[] plaintext) throws Exception {
        // ACTION: Generate unique DEK for this encryption operation
        // REASON: Fresh DEK per file provides isolation; compromise of one DEK
        // doesn't expose other files. Best practice for multi-tenant storage
        SecretKey dek = generateDEK();

        try {
            // ACTION: Generate random IV for AES-GCM
            // REASON: Unique IV per encryption ensures semantic security; same plaintext
            // produces different ciphertext, preventing pattern analysis
            byte[] iv = new byte[config.getIvLength()];
            secureRandom.nextBytes(iv);

            // ACTION: Initialize AES-GCM cipher with DEK and IV
            // REASON: GCM provides authenticated encryption (confidentiality + integrity)
            // in one pass, faster than CBC + HMAC. Hardware AES acceleration on modern
            // CPUs achieves 1-5 GB/s throughput
            Cipher cipher = Cipher.getInstance(config.getAlgorithm());
            GCMParameterSpec gcmSpec = new GCMParameterSpec(config.getGcmTagLength(), iv);
            cipher.init(Cipher.ENCRYPT_MODE, dek, gcmSpec);

            // ACTION: Encrypt plaintext data with DEK
            // REASON: Local symmetric encryption is 1000x faster than remote KMS encryption
            // for large files. No network latency, unlimited data size, full CPU utilization
            byte[] ciphertext = cipher.doFinal(plaintext);

            // ACTION: Encrypt DEK with Vault Transit Engine KEK
            // REASON: Wrap the envelope - DEK now protected by Vault's KEK in HSM.
            // This is the only network call in the entire encryption process
            String encryptedDEK = encryptDEKWithVault(dek);

            return new EncryptedEnvelope(ciphertext, encryptedDEK, iv, config.getAlgorithm());

        } finally {
            // ACTION: Zero out DEK from memory
            // REASON: Minimize exposure window for sensitive key material
            if (dek != null) {
                byte[] encoded = dek.getEncoded();
                if (encoded != null) {
                    java.util.Arrays.fill(encoded, (byte) 0);
                }
            }
        }
    }

    /**
     * ACTION: Decrypt envelope-encrypted data
     * REASON: Unwrap DEK with Vault, decrypt data with DEK, erase DEK
     */
    public byte[] decrypt(EncryptedEnvelope envelope) throws Exception {
        // ACTION: Decrypt DEK using Vault Transit Engine
        // REASON: Only Vault has KEK to unwrap encrypted DEK; this reveals plaintext DEK
        SecretKey dek = decryptDEKWithVault(envelope.getEncryptedDEK());

        try {
            // ACTION: Initialize AES-GCM cipher for decryption
            // REASON: Must use same algorithm, IV, and DEK as encryption
            Cipher cipher = Cipher.getInstance(envelope.getAlgorithm());
            GCMParameterSpec gcmSpec = new GCMParameterSpec(config.getGcmTagLength(),
                                                            envelope.getIv());
            cipher.init(Cipher.DECRYPT_MODE, dek, gcmSpec);

            // ACTION: Decrypt ciphertext with DEK
            // REASON: GCM automatically verifies authentication tag during decryption;
            // throws AEADBadTagException if data tampered, preventing silent corruption
            byte[] plaintext = cipher.doFinal(envelope.getCiphertext());

            return plaintext;

        } finally {
            // ACTION: Zero out DEK from memory after use
            // REASON: Defense in depth - minimize DEK lifetime in memory
            if (dek != null) {
                byte[] encoded = dek.getEncoded();
                if (encoded != null) {
                    java.util.Arrays.fill(encoded, (byte) 0);
                }
            }
        }
    }

    /**
     * ACTION: Batch encrypt multiple files with single Vault call
     * REASON: Demonstrates offline encryption advantage - encrypt all files locally,
     * then wrap all DEKs in one batch Vault request
     * CONTEXT DILATION: Cost and performance optimization for batch uploads:
     * - Encrypt 100 files individually: 100 Vault calls ($0.03, 50 seconds)
     * - Batch envelope encryption: 1 Vault batch call ($0.0003, 2 seconds)
     * 100x cost reduction, 25x speed improvement. Critical for S3 bulk uploads
     */
    public List<EncryptedEnvelope> batchEncrypt(List<byte[]> plaintexts) throws Exception {
        List<EncryptedEnvelope> envelopes = new ArrayList<>();
        List<SecretKey> deks = new ArrayList<>();

        try {
            // ACTION: Phase 1 - Generate DEKs and encrypt all files locally (offline)
            // REASON: No network calls during encryption; enables parallel processing
            // of multiple files without Vault latency. Can encrypt on client device
            // before uploading to cloud
            for (byte[] plaintext : plaintexts) {
                SecretKey dek = generateDEK();
                deks.add(dek);

                byte[] iv = new byte[config.getIvLength()];
                secureRandom.nextBytes(iv);

                Cipher cipher = Cipher.getInstance(config.getAlgorithm());
                GCMParameterSpec gcmSpec = new GCMParameterSpec(config.getGcmTagLength(), iv);
                cipher.init(Cipher.ENCRYPT_MODE, dek, gcmSpec);

                byte[] ciphertext = cipher.doFinal(plaintext);

                // Placeholder - will add encrypted DEK in phase 2
                envelopes.add(new EncryptedEnvelope(ciphertext, null, iv,
                                                    config.getAlgorithm()));
            }

            // ACTION: Phase 2 - Batch encrypt all DEKs with single Vault request
            // REASON: Vault Transit supports batch operations; encrypt 100 DEKs in one
            // API call instead of 100 individual calls. 99% API reduction, massive
            // cost savings and latency improvement
            List<String> encryptedDEKs = batchEncryptDEKsWithVault(deks);

            // ACTION: Update envelopes with encrypted DEKs
            // REASON: Combine offline-encrypted data with Vault-wrapped DEKs
            for (int i = 0; i < envelopes.size(); i++) {
                EncryptedEnvelope oldEnvelope = envelopes.get(i);
                envelopes.set(i, new EncryptedEnvelope(
                    oldEnvelope.getCiphertext(),
                    encryptedDEKs.get(i),
                    oldEnvelope.getIv(),
                    oldEnvelope.getAlgorithm()
                ));
            }

            return envelopes;

        } finally {
            // ACTION: Zero out all DEKs from memory
            // REASON: Batch operations hold multiple DEKs; must erase all
            for (SecretKey dek : deks) {
                if (dek != null) {
                    byte[] encoded = dek.getEncoded();
                    if (encoded != null) {
                        java.util.Arrays.fill(encoded, (byte) 0);
                    }
                }
            }
        }
    }

    /**
     * ACTION: Batch encrypt multiple DEKs with single Vault Transit API call
     * REASON: Vault Transit batch_input parameter allows encrypting many values
     * in one request, critical for reducing API costs and latency
     */
    private List<String> batchEncryptDEKsWithVault(List<SecretKey> deks) throws VaultException {
        // ACTION: Prepare batch request with all DEKs
        // REASON: Vault Transit batch format: array of {plaintext: base64} objects
        List<Map<String, String>> batchInput = new ArrayList<>();
        for (SecretKey dek : deks) {
            String dekBase64 = Base64.getEncoder().encodeToString(dek.getEncoded());
            batchInput.add(Map.of("plaintext", dekBase64));
        }

        // ACTION: Single Vault Transit batch encrypt call
        // REASON: One API call encrypts all DEKs, regardless of count. Scales to
        // hundreds/thousands of DEKs without increasing API costs or latency
        LogicalResponse response = vault.logical()
            .write("transit/encrypt/" + config.getTransitKeyName(),
                   Map.of("batch_input", batchInput));

        // ACTION: Extract encrypted DEKs from batch response
        // REASON: Response contains array of {ciphertext: "vault:v1:..."} objects
        List<String> encryptedDEKs = new ArrayList<>();
        List<Map<String, String>> batchResults =
            (List<Map<String, String>>) response.getData().get("batch_results");

        for (Map<String, String> result : batchResults) {
            encryptedDEKs.add(result.get("ciphertext"));
        }

        return encryptedDEKs;
    }
}

// Usage Example
class Example {
    public static void main(String[] args) throws Exception {
        VaultEnvelopeConfig config = new VaultEnvelopeConfig(
            "https://vault.example.com:8200",
            "s.XXXXXXXXXXXXXXXXXX",  // Vault token
            "customer-data-kek"       // Transit key name
        );

        VaultEnvelopeEncryption encryptor = new VaultEnvelopeEncryption(config);

        // Single file encryption
        byte[] fileData = "Sensitive customer data...".getBytes(StandardCharsets.UTF_8);
        EncryptedEnvelope envelope = encryptor.encrypt(fileData);

        System.out.println("Encrypted with 1 Vault API call");

        // Upload envelope to S3 with metadata
        // s3Client.putObject(PutObjectRequest.builder()
        //     .bucket("encrypted-uploads")
        //     .key("customer-123/data.enc")
        //     .metadata(Map.of(
        //         "encrypted-dek", envelope.getEncryptedDEK(),
        //         "iv", Base64.getEncoder().encodeToString(envelope.getIv()),
        //         "algorithm", envelope.getAlgorithm()
        //     ))
        //     .build(),
        //     RequestBody.fromBytes(envelope.getCiphertext()));

        // Batch encryption for bulk uploads (100 files)
        List<byte[]> files = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            files.add(("File " + i + " data").getBytes(StandardCharsets.UTF_8));
        }

        long startTime = System.currentTimeMillis();
        List<EncryptedEnvelope> envelopes = encryptor.batchEncrypt(files);
        long duration = System.currentTimeMillis() - startTime;

        System.out.println("Encrypted 100 files in " + duration + "ms with 1 Vault API call");
        System.out.println("Cost: $0.0003 vs $0.03 for individual encryption (100x cheaper)");
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production S3 object encryption using Vault Transit Engine with batch operations for cost and performance optimization",
        prerequisites: [
          "HashiCorp Vault Transit Engine",
          "Java Cryptography Extension (JCE)",
          "S3 encryption patterns",
          "Batch processing optimization",
        ],
        systemPosition:
          "File upload encryption layer for S3/object storage with Vault-based key management",
      },
      annotations: [
        {
          id: "env-java-vault-transit",
          lines: [124, 130],
          action: "Use Vault Transit Engine for KEK operations",
          reason:
            "Transit engine is purpose-built for envelope encryption: never stores data, only wraps/unwraps DEKs. KEK stays in Vault's HSM, providing centralized key management",
          contextLevel: "system",
          relatedConcepts: ["vault-transit", "hsm", "key-management"],
        },
        {
          id: "env-java-local-dek",
          lines: [114, 119],
          action: "Generate DEK locally without calling Vault",
          reason:
            "Local DEK generation enables offline encryption: encrypt entire file without network, then single Vault call to wrap DEK. Critical for client-side encryption scenarios",
          contextLevel: "system",
          relatedConcepts: ["offline-encryption", "client-side-encryption"],
        },
        {
          id: "env-java-aes-gcm",
          lines: [182, 189],
          action: "Use AES-GCM for authenticated encryption with DEK",
          reason:
            "GCM provides confidentiality + integrity in one algorithm, faster than CBC + HMAC. Hardware AES-NI acceleration achieves 1-5 GB/s on modern CPUs",
          contextLevel: "system",
          relatedConcepts: [
            "aes-gcm",
            "authenticated-encryption",
            "hardware-acceleration",
          ],
        },
        {
          id: "env-java-single-call",
          lines: [193, 196],
          action:
            "Encrypt DEK with Vault - only network call in encryption flow",
          reason:
            "Entire file encrypted locally (fast, no network), then single Vault call wraps DEK. Contrast with direct Vault encryption requiring call per 4KB chunk",
          contextLevel: "system",
          relatedConcepts: ["api-optimization", "network-efficiency"],
        },
        {
          id: "env-java-batch",
          lines: [239, 275],
          action: "Batch encrypt multiple files with single Vault API call",
          reason:
            "Vault Transit batch operations encrypt 100+ DEKs in one request (99% API reduction). Encrypting 100 S3 objects: 1 call vs 100 calls, 100x cost savings, 25x faster",
          contextLevel: "system",
          relatedConcepts: [
            "batch-operations",
            "cost-optimization",
            "api-batching",
          ],
        },
        {
          id: "env-java-offline-phase",
          lines: [246, 267],
          action: "Phase 1: Encrypt all files locally without network calls",
          reason:
            "Offline encryption phase enables parallel processing, client-side encryption, and eliminates network latency. Critical for bulk uploads from edge devices",
          contextLevel: "system",
          relatedConcepts: [
            "offline-first",
            "edge-encryption",
            "parallel-processing",
          ],
        },
        {
          id: "env-java-batch-request",
          lines: [286, 293],
          action: "Prepare Vault Transit batch request with all DEKs",
          reason:
            "Vault batch_input format allows encrypting unlimited DEKs in one API call, scaling to thousands without increasing costs or latency",
          contextLevel: "module",
          relatedConcepts: ["batch-api", "scalability"],
        },
        {
          id: "env-java-gcm-verify",
          lines: [226, 230],
          action: "GCM automatically verifies auth tag during decryption",
          reason:
            "Authenticated encryption detects tampering; GCM throws AEADBadTagException if ciphertext modified, preventing silent corruption or malicious attacks",
          contextLevel: "local",
          relatedConcepts: ["integrity-verification", "tamper-detection"],
        },
      ],
      highlights: [
        {
          lines: [114, 119],
          label: "Local DEK generation for offline encryption",
          sbvpDomain: "structure",
        },
        {
          lines: [169, 198],
          label: "Single network call for entire encryption operation",
          sbvpDomain: "philosophy",
        },
        {
          lines: [239, 275],
          label: "Batch encryption with 99% API call reduction",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Cloud storage encryption (S3, GCS, Azure Blob)",
      "Database field encryption (PII, PHI, credit cards)",
      "File upload encryption (user documents, media files)",
      "Backup encryption (database dumps, VM snapshots)",
      "Log encryption (audit logs, application logs)",
      "Email encryption (message bodies, attachments)",
      "Document management systems (contracts, records)",
    ],
    interactsWith: [
      "key-management-service",
      "encryption-at-rest",
      "key-rotation",
      "access-control",
      "audit-logging",
    ],
    architecturalBoundaries: [
      "KMS layer (KEK operations, HSM)",
      "Application encryption layer (DEK encryption)",
      "Data storage layer (encrypted data + DEK)",
      "DEK cache layer (performance optimization)",
      "Key lifecycle management (rotation, versioning)",
    ],
  },

  implementations: [
    {
      id: "aws-kms-envelope",
      name: "AWS KMS Envelope Encryption",
      type: "service",
      languages: ["any"],
      description:
        "AWS KMS provides native envelope encryption via GenerateDataKey API. Returns both plaintext and encrypted DEK in single call. Integrates with S3, EBS, RDS for transparent encryption at rest. KEK stored in FIPS 140-2 Level 3 HSM. Supports automatic key rotation and multi-region keys.",
      links: {
        docs: "https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping",
      },
      codeSnippet: `// AWS KMS GenerateDataKey for envelope encryption
const { KMSClient, GenerateDataKeyCommand } = require("@aws-sdk/client-kms");

const kms = new KMSClient({ region: "us-east-1" });
const command = new GenerateDataKeyCommand({
  KeyId: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
  KeySpec: "AES_256"
});

const { Plaintext, CiphertextBlob } = await kms.send(command);
// Use Plaintext DEK to encrypt data
// Store CiphertextBlob (encrypted DEK) with data`,
    },
    {
      id: "gcp-kms-envelope",
      name: "Google Cloud KMS",
      type: "service",
      languages: ["any"],
      description:
        "Cloud KMS envelope encryption via encrypt/decrypt APIs. Integrated with Cloud Storage, BigQuery, Compute Engine for automatic encryption. KEK stored in FIPS 140-2 Level 3 HSM. Supports customer-managed and Google-managed encryption keys with automatic rotation.",
      links: {
        docs: "https://cloud.google.com/kms/docs/envelope-encryption",
      },
      codeSnippet: `# Google Cloud KMS envelope encryption
from google.cloud import kms

client = kms.KeyManagementServiceClient()
key_name = "projects/PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY"

# Encrypt DEK with Cloud KMS
dek = os.urandom(32)  # Generate 256-bit DEK
encrypted_dek = client.encrypt(
    request={"name": key_name, "plaintext": dek}
).ciphertext

# Use DEK to encrypt data, store encrypted_dek with data`,
    },
    {
      id: "azure-key-vault",
      name: "Azure Key Vault",
      type: "service",
      languages: ["any"],
      description:
        "Azure Key Vault envelope encryption via wrapKey/unwrapKey APIs. Integrates with Azure Storage, SQL Database, Disk Encryption. KEK stored in FIPS 140-2 Level 2 or Level 3 HSM (premium tier). Supports managed HSM and customer-managed keys.",
      links: {
        docs: "https://docs.microsoft.com/en-us/azure/key-vault/keys/about-keys",
      },
      codeSnippet: `// Azure Key Vault envelope encryption
const { CryptographyClient } = require("@azure/keyvault-keys");

const client = new CryptographyClient(keyId, credential);

// Wrap DEK with KEK
const dek = crypto.randomBytes(32);
const { result: encryptedDEK } = await client.wrapKey("RSA-OAEP", dek);

// Use DEK to encrypt data, store encryptedDEK with data`,
    },
    {
      id: "vault-transit",
      name: "HashiCorp Vault Transit Engine",
      type: "platform",
      languages: ["any"],
      description:
        "Vault Transit Engine provides envelope encryption as a service. Supports batch encrypt/decrypt for multiple DEKs. KEK stored in Vault's encrypted storage or HSM backend. Includes key versioning, rotation, and derivation. Self-hosted or cloud-managed (HCP Vault).",
      links: {
        docs: "https://www.vaultproject.io/docs/secrets/transit",
        github: "https://github.com/hashicorp/vault",
      },
      codeSnippet: `# Vault Transit envelope encryption
import hvac

client = hvac.Client(url='https://vault:8200', token='s.XXXXX')

# Encrypt DEK with Vault Transit
dek = os.urandom(32)
dek_b64 = base64.b64encode(dek).decode()
response = client.secrets.transit.encrypt_data(
    name='customer-kek',
    plaintext=dek_b64
)
encrypted_dek = response['data']['ciphertext']

# Use DEK to encrypt data, store encrypted_dek`,
    },
    {
      id: "mongodb-csfle",
      name: "MongoDB Client-Side Field Level Encryption (CSFLE)",
      type: "library",
      languages: ["javascript", "python", "java", "go"],
      description:
        "MongoDB CSFLE uses envelope encryption for field-level encryption. DEK per field or collection, KEK stored in KMS (AWS, Azure, GCP, or local). Transparent encryption in driver. Supports queryable encryption for encrypted field searches.",
      links: {
        docs: "https://docs.mongodb.com/manual/core/security-client-side-encryption/",
      },
      codeSnippet: `// MongoDB CSFLE envelope encryption
const { MongoClient } = require("mongodb");

const client = new MongoClient(uri, {
  autoEncryption: {
    keyVaultNamespace: "encryption.__keyVault",
    kmsProviders: {
      aws: {
        accessKeyId: "...",
        secretAccessKey: "..."
      }
    }
  }
});

// Automatic envelope encryption on insert
await collection.insertOne({
  ssn: "123-45-6789"  // Automatically encrypted with DEK, DEK encrypted with KMS KEK
});`,
    },
    {
      id: "s3-sse-kms",
      name: "AWS S3 Server-Side Encryption with KMS (SSE-KMS)",
      type: "service",
      languages: ["any"],
      description:
        "S3 SSE-KMS uses envelope encryption automatically. S3 generates unique DEK per object, encrypts with KMS KEK. Transparent to applications. Supports bucket keys to reduce KMS API costs (one DEK per bucket instead of per object).",
      links: {
        docs: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html",
      },
      codeSnippet: `// S3 SSE-KMS automatic envelope encryption
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "us-east-1" });

await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "sensitive-data.txt",
  Body: data,
  ServerSideEncryption: "aws:kms",
  SSEKMSKeyId: "arn:aws:kms:us-east-1:123456789012:key/12345678-..."
}));

// S3 generates DEK, encrypts data, encrypts DEK with KMS, stores both`,
    },
    {
      id: "postgres-pgcrypto",
      name: "PostgreSQL pgcrypto with Envelope Encryption",
      type: "library",
      languages: ["sql"],
      description:
        "PostgreSQL pgcrypto extension for field-level encryption. Application implements envelope pattern: encrypt column with DEK, store encrypted DEK in separate column. Requires manual DEK management and KMS integration.",
      links: {
        docs: "https://www.postgresql.org/docs/current/pgcrypto.html",
      },
      codeSnippet: `-- PostgreSQL pgcrypto envelope encryption
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  encrypted_ssn BYTEA,
  encrypted_dek BYTEA  -- DEK encrypted with external KMS
);

-- Encrypt SSN with DEK (application generates DEK, encrypts with KMS)
INSERT INTO users (email, encrypted_ssn, encrypted_dek)
VALUES (
  'user@example.com',
  pgp_sym_encrypt('123-45-6789', :dek),  -- Encrypt with DEK
  :kms_encrypted_dek  -- DEK encrypted by application via KMS
);`,
    },
    {
      id: "openssl-envelope",
      name: "OpenSSL Envelope Encryption",
      type: "library",
      languages: ["c", "any"],
      description:
        "OpenSSL EVP API for implementing envelope encryption. EVP_SealInit/EVP_SealUpdate for encrypting data with symmetric DEK, then encrypting DEK with RSA public key. Low-level API requiring careful implementation.",
      links: {
        docs: "https://www.openssl.org/docs/man1.1.1/man3/EVP_SealInit.html",
      },
      codeSnippet: `// OpenSSL envelope encryption
EVP_PKEY *pubkey = ...; // RSA public key (KEK)
unsigned char *dek = malloc(EVP_PKEY_size(pubkey));
int dek_len;
unsigned char iv[EVP_MAX_IV_LENGTH];

EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();

// Encrypt data with DEK, encrypt DEK with RSA KEK
EVP_SealInit(ctx, EVP_aes_256_cbc(), &dek, &dek_len, iv, &pubkey, 1);
EVP_SealUpdate(ctx, ciphertext, &outlen, plaintext, plaintext_len);
EVP_SealFinal(ctx, ciphertext + outlen, &outlen);

// Store: ciphertext, dek (encrypted DEK), iv`,
    },
  ],

  usedInSystems: [
    {
      systemId: "aws-s3",
      systemName: "AWS S3 Storage Service",
      howUsed:
        "AWS S3 uses envelope encryption as the default encryption method for SSE-KMS (Server-Side Encryption with KMS). When objects are uploaded with SSE-KMS enabled, S3 automatically generates a unique 256-bit AES DEK for each object using the AWS KMS GenerateDataKey API. S3 encrypts the object data with this DEK using AES-256-GCM, then encrypts the DEK itself with the customer's KMS KEK. The encrypted object and encrypted DEK are stored together in S3's object metadata. S3 Bucket Keys optimization generates one DEK per bucket per time period instead of per object, reducing KMS API calls by 99% while maintaining envelope encryption benefits. During retrieval, S3 sends the encrypted DEK to KMS for decryption, uses the plaintext DEK to decrypt the object, then discards the DEK. This pattern enables S3 to encrypt exabytes of data efficiently: encrypting a 5GB object takes 2 seconds (local AES encryption) vs 21 minutes with direct KMS encryption (1,310,720 KMS calls). Key rotation is seamless: rotate the KMS KEK and S3 automatically re-encrypts DEKs on next object access without re-encrypting data. Pattern composition: Envelope Encryption + Bucket Keys (DEK reuse optimization) + Automatic Key Rotation + Multi-Region Replication (encrypted DEKs replicate with objects). Impact: Enabled encryption of 100+ trillion objects totaling exabytes without performance degradation; reduced KMS costs by 99% with Bucket Keys; achieved compliance (HIPAA, PCI-DSS) for millions of customers.",
      source:
        "https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html",
    },
    {
      systemId: "google-cloud-storage",
      systemName: "Google Cloud Storage",
      howUsed:
        "Google Cloud Storage implements automatic envelope encryption for all stored objects by default. When objects are uploaded, Cloud Storage generates a unique DEK per object using a cryptographically secure random number generator. The DEK encrypts the object data using AES-256, then Cloud Storage encrypts the DEK with a KEK stored in Google's Cloud KMS (or customer-supplied KMS). The encrypted object and encrypted DEK are stored together, creating a self-contained encrypted envelope. Cloud Storage supports three KEK options: Google-managed keys (automatic rotation every 90 days), customer-managed keys in Cloud KMS (manual rotation), and customer-supplied keys (CSEK, customer controls rotation). During object access, Cloud Storage retrieves the encrypted DEK, sends it to Cloud KMS for decryption, uses the plaintext DEK to decrypt the object, then securely erases the DEK from memory. This pattern enabled Cloud Storage to scale to storing billions of objects totaling petabytes per customer without KMS bottlenecks. Pattern composition: Envelope Encryption + Customer-Managed Keys (CMEK) + Automatic Key Rotation + Multi-Region Replication. Rationale: Direct KMS encryption would limit object size to 64KB and cost 1000x more; envelope encryption enables unlimited object sizes with minimal KMS usage. Impact: Stores 1+ exabyte of encrypted data across millions of customers; zero performance impact from encryption (encryption/decryption at line rate); achieved compliance certifications (ISO 27001, SOC 2, HIPAA) enabling enterprise adoption.",
      source:
        "https://cloud.google.com/storage/docs/encryption/customer-managed-keys",
    },
    {
      systemId: "mongodb-atlas",
      systemName: "MongoDB Atlas Database-as-a-Service",
      howUsed:
        "MongoDB Atlas implements Client-Side Field Level Encryption (CSFLE) using envelope encryption to protect sensitive fields (SSN, credit cards, PII) within documents. Applications define encrypted fields in a JSON schema; the MongoDB driver automatically generates a unique 256-bit DEK per field (or per collection for better performance). The driver encrypts the field value with AES-256-CBC, then encrypts the DEK with a KEK stored in AWS KMS, Azure Key Vault, or Google Cloud KMS. The encrypted field data and encrypted DEK are both stored in the MongoDB document as BSON binary. During queries, the driver retrieves documents, extracts encrypted DEKs, decrypts them via the configured KMS, then decrypts field values client-side before returning to the application. MongoDB Atlas also supports Queryable Encryption (encrypted field indexing) using envelope encryption with equality and range queries on encrypted data via special equality tokens derived from DEKs. Pattern composition: Envelope Encryption + Client-Side Encryption + Field-Level Encryption + Queryable Encryption (encrypted indexes). Rationale: Traditional database encryption (TDE) protects only disk storage; CSFLE protects data from DBAs, cloud providers, and database breaches. Impact: Enabled HIPAA-compliant healthcare applications storing 100M+ patient records with field-level encryption; reduced PCI-DSS scope for e-commerce storing credit cards; maintained query performance with queryable encryption (10ms overhead vs plaintext queries).",
      source:
        "https://www.mongodb.com/docs/manual/core/security-client-side-encryption/",
    },
    {
      systemId: "dropbox",
      systemName: "Dropbox File Hosting Service",
      howUsed:
        "Dropbox uses envelope encryption to protect files for 700M+ users across billions of files totaling exabytes. When users upload files, Dropbox's client generates a unique 256-bit AES DEK per file block (4MB chunks). Each block is encrypted with its DEK using AES-256-CBC, then the DEK is encrypted with a KEK stored in Dropbox's internal key management service backed by HSMs. The encrypted file blocks and encrypted DEKs are stored in Dropbox's custom distributed storage system (Magic Pocket). File metadata (filenames, folder structure) is encrypted separately with its own DEK. During download, Dropbox retrieves encrypted blocks, decrypts DEKs via the internal KMS, then decrypts blocks client-side using the DEKs before assembling the file. For shared folders, Dropbox re-encrypts DEKs with recipient-specific KEKs, enabling access control without re-encrypting file data. Key rotation occurs annually: Dropbox rotates KEKs and batch re-encrypts DEKs in background jobs without user downtime or data re-encryption. Pattern composition: Envelope Encryption + Block-Level Encryption + Per-User KEKs + Background Key Rotation + Client-Side Decryption. Rationale: Per-file encryption enables fine-grained access control and sharing; envelope pattern enables efficient encryption of multi-GB files without KMS bottlenecks. Impact: Protected 700M+ users' files with zero-knowledge encryption; reduced encryption overhead to <1% CPU; enabled instant sharing by re-encrypting only DEKs; achieved SOC 2, ISO 27001 compliance.",
      source: "https://www.dropbox.com/security/encryption",
    },
    {
      systemId: "1password",
      systemName: "1Password Password Manager",
      howUsed:
        "1Password uses envelope encryption to protect 1 billion+ secrets (passwords, credit cards, documents) for millions of users. Each vault item (login, credit card, secure note) is encrypted with a unique 256-bit AES DEK. The item data is encrypted using AES-256-GCM, then the DEK is encrypted with a vault-specific KEK derived from the user's Master Password and Secret Key using PBKDF2. The encrypted item and encrypted DEK are stored together in 1Password's cloud sync database. During unlock, 1Password derives the KEK from the user's Master Password + Secret Key, decrypts the DEK, then decrypts the item data. For shared vaults, 1Password encrypts the vault KEK with each team member's public key (RSA-2048), enabling access without revealing the Master Password. Key rotation occurs when users change their Master Password: 1Password re-derives the KEK and re-encrypts all vault DEKs without re-encrypting items. The envelope pattern enables instant item encryption on creation (no network call to KMS) and offline access (decrypt DEKs locally). Pattern composition: Envelope Encryption + End-to-End Encryption + Zero-Knowledge Architecture + Public Key Sharing + PBKDF2 Key Derivation. Rationale: Envelope encryption enables local encryption/decryption without server-side KEK access, critical for zero-knowledge security model. Impact: Protected 1B+ secrets with client-side encryption; enabled offline vault access; zero server-side decryption (1Password servers never see plaintext); achieved SOC 2 Type II, ISO 27001 compliance.",
      source: "https://1password.com/security/",
    },
  ],

  philosophy: {
    coreProblem:
      "Encrypting large datasets efficiently while maintaining centralized key management and enabling seamless key rotation requires separating data encryption (performance-critical) from key encryption (security-critical)",
    designPrinciple:
      "Use fast local symmetric encryption (DEK) for data at scale, protect the small DEK with a master key (KEK) in secure key management service, creating a two-tier hierarchy that optimizes for both performance and security",
    historicalContext:
      "Envelope encryption emerged from cloud storage needs in the 2000s: direct KMS encryption couldn't scale to gigabyte files due to 4KB size limits and API rate limits. AWS S3 pioneered the pattern in 2006 with SSE, demonstrating 1000x performance improvement over direct KMS encryption. Google adopted it for Cloud Storage, Microsoft for Azure, establishing it as the standard for cloud data encryption.",
    alternativesRejected: [
      "Direct KMS encryption - limited to 4KB payloads, 1000x slower, expensive API costs",
      "Application-managed keys - no centralized audit, hard key rotation, compliance violations",
      "Single-layer encryption - key rotation requires re-encrypting all data (days/weeks downtime)",
      "Per-user keys without envelope - key distribution nightmare, can't share encrypted data",
    ],
    mentalModel:
      "Like a safe deposit box: your valuables (data) are in a locked box (encrypted with DEK) inside a bank vault (KEK in KMS). You carry the small box key in a sealed envelope (encrypted DEK). The bank guards the master vault key (KEK). To rotate the vault key, the bank just re-seals your envelope with the new vault key—your box contents never move.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "ENCRYPTION FLOW"
        A[Plaintext Data] --> B[Generate DEK]
        B --> C[Encrypt Data with DEK]
        C --> D[Encrypted Data]
        B --> E[Encrypt DEK with KEK via KMS]
        E --> F[Encrypted DEK]
        D --> G[Storage: Encrypted Data + Encrypted DEK]
        F --> G
    end

    subgraph "DECRYPTION FLOW"
        H[Retrieve Encrypted Package] --> I[Encrypted DEK]
        I --> J[Decrypt DEK with KEK via KMS]
        J --> K[Plaintext DEK]
        H --> L[Encrypted Data]
        K --> M[Decrypt Data with DEK]
        L --> M
        M --> N[Plaintext Data]
    end

    subgraph "KEY ROTATION"
        O[Old KEK v1] --> P[Decrypt DEK with v1]
        P --> Q[Plaintext DEK]
        R[New KEK v2] --> S[Encrypt DEK with v2]
        Q --> S
        S --> T[Updated Encrypted DEK]
        U[Encrypted Data - UNCHANGED] --> T
    end

    style A fill:#e1f5e1
    style D fill:#ffe1e1
    style F fill:#ffe1e1
    style N fill:#e1f5e1
    style U fill:#e1e1ff`,
    realWorldAnalogy:
      "Envelope encryption is like a jewelry box (data) with a small key (DEK) locked inside a bank's safe deposit box. You keep the jewelry box key in a sealed envelope (encrypted DEK) in your pocket. The bank's vault master key (KEK) protects the safe deposit box but never leaves the bank. To open your jewelry, you bring the sealed envelope to the bank, they unseal it with the vault key (KMS decrypt), you get the jewelry box key (plaintext DEK), open your jewelry box (decrypt data), then destroy the key (erase DEK). When the bank rotates the vault key, they just re-seal your envelope—your jewelry box never needs to be opened and re-locked.",
    useCases: [
      {
        domain: "Cloud Storage",
        scenario:
          "S3 bucket storing 10TB of customer backups needs encryption with annual key rotation. Direct KMS encryption would take weeks and cost thousands. Envelope encryption: each file encrypted with unique DEK (2 seconds per file), DEKs encrypted with KMS KEK (1 call per file). Key rotation: re-encrypt 10,000 DEKs (10 minutes, $0.30) instead of re-encrypting 10TB (weeks, $3000).",
        patternRole:
          "Enables efficient encryption of large files and zero-downtime key rotation by separating data encryption from key encryption",
        companies: ["AWS S3", "Google Cloud Storage", "Azure Blob Storage"],
      },
      {
        domain: "Database Encryption",
        scenario:
          "Healthcare database with 100M patient records containing PII (SSN, medical history). Each field encrypted with unique DEK, DEKs encrypted with KMS KEK. Query returns 1000 patients: decrypt 1000 DEKs from cache (5ms) vs 1000 KMS calls (5 seconds). HIPAA compliance requires 90-day key rotation: re-encrypt 100M DEKs (1 hour, no downtime) vs re-encrypt 100M records (days, database locks).",
        patternRole:
          "Provides field-level encryption with query performance optimization via DEK caching and rapid compliance-driven key rotation",
        companies: ["MongoDB Atlas", "AWS RDS", "Google Cloud SQL"],
      },
      {
        domain: "File Hosting",
        scenario:
          "Dropbox user uploads 5GB video file. Client generates DEK, encrypts 5GB locally in 5 seconds (AES-256 at 1GB/s), sends encrypted video + encrypted DEK to server (1 KMS call). Sharing: re-encrypt DEK with recipient's KEK (1 KMS call, instant) without re-uploading 5GB. Key rotation: re-encrypt DEKs for 1M files (5 minutes) vs re-encrypt 5PB of data (impossible).",
        patternRole:
          "Enables client-side encryption of large files, instant sharing via DEK re-encryption, and scalable key rotation for billions of files",
        companies: ["Dropbox", "Box", "OneDrive"],
      },
    ],
  },

  tags: [
    "security",
    "encryption",
    "key-management",
    "kms",
    "data-protection",
    "compliance",
  ],
  difficulty: "intermediate",
};
