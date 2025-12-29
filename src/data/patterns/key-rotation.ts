import type { Pattern } from "../schema";

export const keyRotation: Pattern = {
  id: "key-rotation",
  slug: "key-rotation",
  corpusPath: "🔒 SECURITY → 🔐 Encryption → 🔑 Key Rotation",

  hierarchy: {
    quality: "security",
    strategy: "Encryption",
    family: "Encryption",
    level: 4,
  },

  concept: {
    name: "Key Rotation",
    emoji: "🔑",
    tagline: "Periodic key replacement for security and compliance",
    definition:
      "Key Rotation is the security practice of periodically replacing cryptographic keys used for encryption, signing, or authentication while maintaining zero-downtime access to protected data. The pattern involves generating new keys on a schedule (daily, monthly, quarterly), marking the new key as active for encryption/signing operations, retaining old keys for decryption/verification of existing data, and eventually retiring keys after a grace period. Unlike naive key replacement that breaks access to previously encrypted data, proper key rotation maintains multiple active key versions—new data uses the latest key while old data remains decryptable with historical keys. This versioned approach enables gradual migration through envelope encryption (re-encrypt data encryption keys with new master key) or lazy re-encryption (re-encrypt records on read/write). Key rotation reduces the blast radius of key compromise by limiting the amount of data encrypted with any single key, satisfies compliance requirements (PCI DSS mandates 90-day rotation for certain keys), mitigates cryptanalysis risk (limiting ciphertext volume per key), and provides an audit trail of key lifecycle events for security investigations.",
    problemSolved:
      "Cryptographic keys are long-lived secrets that, if compromised, expose all data encrypted with them—potentially years of sensitive information. The longer a key remains in use, the greater the risk: keys may leak through insider threats, memory dumps, stolen backups, or vulnerability exploitation. Cryptanalysis attacks become more feasible as attackers accumulate larger volumes of ciphertext encrypted with the same key, potentially enabling pattern recognition or brute force. Compliance frameworks (PCI DSS, HIPAA, GDPR) mandate periodic key rotation to limit exposure windows—PCI DSS requires 90-day rotation for cardholder data encryption keys. Without rotation, a single key compromise in 2024 exposes data encrypted since 2018. Key Rotation solves this by limiting each key's operational lifetime and data volume, creating temporal isolation where compromising today's key doesn't expose last year's data. It enables cryptographic hygiene (like changing passwords regularly), supports key compromise recovery (rotate immediately after suspected breach), and provides compliance evidence (audit logs showing rotation cadence).",
    tradeoffs: {
      pros: [
        "Limits blast radius of key compromise to data encrypted during rotation period",
        "Satisfies compliance requirements (PCI DSS 90-day, HIPAA, SOC 2)",
        "Mitigates cryptanalysis risk by limiting ciphertext volume per key",
        "Forces operational key lifecycle management and disaster recovery testing",
        "Provides audit trail for security investigations and compliance audits",
      ],
      cons: [
        "Operational complexity of managing multiple concurrent key versions",
        "Multi-version key storage increases storage footprint and lookup complexity",
        "Data re-encryption overhead (CPU, I/O, downtime) for eager re-encryption",
        "Rotation coordination across distributed systems (race conditions, version skew)",
        "Key storage explosion if retired keys not properly garbage collected",
      ],
    },
    relatedPatterns: [
      "envelope-encryption",
      "encryption-at-rest",
      "jwt",
      "tls-ssl",
      "key-management-service",
      "zero-downtime-deployment",
      "versioned-schemas",
    ],
  },

  structure: {
    participants: [
      {
        name: "Key Management Service (KMS)",
        role: "Key Lifecycle Authority",
        responsibilities: [
          "Generate cryptographically secure keys using CSPRNG",
          "Store keys securely (encrypted at rest, access controls)",
          "Track key versions and rotation schedule",
          "Manage key states (active, retired, destroyed)",
          "Provide key retrieval API with version support",
        ],
      },
      {
        name: "Active Key",
        role: "Current Encryption Key",
        responsibilities: [
          "Encrypt new data (database records, files, messages)",
          "Sign new tokens (JWT, certificates, signatures)",
          "Serve as the default key for all write operations",
        ],
      },
      {
        name: "Retired Keys",
        role: "Historical Decryption Keys",
        responsibilities: [
          "Decrypt data encrypted with previous key versions",
          "Verify signatures created with previous key versions",
          "Support zero-downtime reads during rotation transition",
          "Remain available until all dependent data re-encrypted or expired",
        ],
      },
      {
        name: "Encryption Engine",
        role: "Cryptographic Operations Executor",
        responsibilities: [
          "Encrypt with active key and embed key version in ciphertext",
          "Decrypt using key version extracted from ciphertext metadata",
          "Handle key version lookup failures gracefully",
          "Report metrics on key version usage for rotation planning",
        ],
      },
      {
        name: "Rotation Scheduler",
        role: "Rotation Automation Controller",
        responsibilities: [
          "Trigger rotation at scheduled intervals (daily, monthly, 90 days)",
          "Coordinate rotation across distributed services (leader election)",
          "Monitor rotation success and alert on failures",
          "Optionally trigger re-encryption jobs after rotation",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Scheduler as Rotation Scheduler
    participant KMS as Key Management Service
    participant App as Application
    participant DB as Database

    Note over Scheduler,DB: Scheduled Rotation (every 90 days)

    Scheduler->>KMS: Trigger rotation
    KMS->>KMS: Generate new key version v2
    KMS->>KMS: Mark v2 as ACTIVE
    KMS->>KMS: Mark v1 as RETIRED
    KMS-->>Scheduler: Rotation complete

    Note over App,DB: Writes use new key v2
    App->>KMS: GET /keys/active
    KMS-->>App: Key v2 (active)
    App->>App: Encrypt(data, key_v2)
    App->>DB: INSERT {ciphertext, key_version: v2}

    Note over App,DB: Reads support both v1 and v2
    App->>DB: SELECT {ciphertext, key_version: v1}
    DB-->>App: Encrypted data (v1)
    App->>KMS: GET /keys/v1
    KMS-->>App: Key v1 (retired)
    App->>App: Decrypt(ciphertext, key_v1)
    App-->>App: Plaintext data

    Note over Scheduler,DB: Background re-encryption (optional)
    Scheduler->>Scheduler: Start re-encryption job
    loop For each record encrypted with v1
        Scheduler->>DB: SELECT record (v1)
        Scheduler->>KMS: Decrypt with v1, encrypt with v2
        Scheduler->>DB: UPDATE record (v2)
    end
    Scheduler->>KMS: Destroy key v1
    Note over KMS: v1 destroyed after grace period`,
    flow: [
      {
        step: 1,
        actor: "Rotation Scheduler",
        action: "Trigger Scheduled Rotation",
        description:
          "Scheduler initiates rotation based on time-based trigger (90 days elapsed, daily schedule, manual trigger)",
      },
      {
        step: 2,
        actor: "Key Management Service",
        action: "Generate New Key Version",
        description:
          "KMS generates cryptographically secure key (AES-256, RSA-2048, ECDSA P-256) using hardware RNG or CSPRNG",
      },
      {
        step: 3,
        actor: "Key Management Service",
        action: "Activate New Key",
        description:
          "Mark new key as ACTIVE (default for all encryption/signing). Previous active key transitions to RETIRED state",
      },
      {
        step: 4,
        actor: "Key Management Service",
        action: "Retain Old Key Versions",
        description:
          "Keep retired keys accessible for decryption/verification of existing data. Store with version identifier (v1, v2, v3)",
      },
      {
        step: 5,
        actor: "Application",
        action: "Encrypt with Active Key",
        description:
          "Fetch active key from KMS, encrypt new data, embed key version in ciphertext metadata (e.g., version prefix or database column)",
      },
      {
        step: 6,
        actor: "Application",
        action: "Decrypt with Versioned Key",
        description:
          "Extract key version from ciphertext metadata, fetch corresponding key from KMS (active or retired), decrypt data",
      },
      {
        step: 7,
        actor: "Rotation Scheduler",
        action: "Trigger Re-encryption (Optional)",
        description:
          "Background job reads records encrypted with old keys, decrypts with old key, re-encrypts with new key, updates database",
      },
      {
        step: 8,
        actor: "Key Management Service",
        action: "Garbage Collect Old Keys",
        description:
          "After grace period (e.g., 30 days post-rotation), verify no data remains encrypted with old key, permanently destroy old key",
      },
      {
        step: 9,
        actor: "Key Management Service",
        action: "Audit Log Rotation Event",
        description:
          "Record rotation event in audit log: timestamp, key IDs, rotation reason, operator identity for compliance evidence",
      },
      {
        step: 10,
        actor: "Monitoring System",
        action: "Alert on Rotation Failures",
        description:
          "Monitor rotation success metrics, alert if rotation fails, track key version usage to detect old key persistence",
      },
    ],
    invariants: [
      "Multiple key versions active simultaneously (at least 1 active + N retired)",
      "Decryption supports N previous key versions for backward compatibility",
      "Encryption always uses latest active key for forward security",
      "Key rotation never breaks ability to read existing encrypted data",
      "Key version metadata stored alongside ciphertext (prefix, header, DB column)",
      "Audit trail records all rotation events with timestamp and key IDs",
      "Automatic rotation scheduling prevents keys from expiring compliance windows",
      "Retired keys remain accessible until dependent data re-encrypted or destroyed",
    ],
  },

  codeExamples: [
    {
      id: "kr-typescript-aws-kms",
      language: "typescript",
      title:
        "TypeScript AWS KMS Automatic Key Rotation with Envelope Encryption",
      description:
        "Production AWS KMS implementation with automatic yearly rotation, envelope encryption pattern, multi-version key support, and CloudWatch monitoring",
      code: `import {
  KMSClient,
  CreateKeyCommand,
  EnableKeyRotationCommand,
  DescribeKeyCommand,
  EncryptCommand,
  DecryptCommand,
  GetParametersForImportCommand,
} from "@aws-sdk/client-kms";
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

// =============================================================================
// AWS KMS Key Rotation with Automatic Rotation
// =============================================================================

/**
 * AWS KMS key rotation manager with automatic rotation
 *
 * CONTEXT DILATION: Manual rotation vs. automated rotation
 * Manual: Operator generates keys, updates configs, deploys—error-prone, forgotten rotations
 * Automated: AWS KMS automatically rotates keys every 365 days—zero manual intervention
 * At scale (1000s of keys), automation is the only viable approach
 */
class KMSKeyRotationManager {
  private kmsClient: KMSClient;
  private cloudwatchClient: CloudWatchClient;
  private keyId: string;

  constructor(keyId: string, region: string = "us-east-1") {
    this.kmsClient = new KMSClient({ region });
    this.cloudwatchClient = new CloudWatchClient({ region });
    this.keyId = keyId;
  }

  /**
   * Enable automatic key rotation for KMS key
   *
   * ACTION: Enable automatic rotation on KMS Customer Master Key (CMK)
   * REASON: AWS KMS handles rotation lifecycle automatically—generates new backing key,
   *         retains old keys for decryption, rotates every 365 days without downtime.
   *         Eliminates manual rotation toil and human error (forgotten rotations).
   */
  async enableAutomaticRotation(): Promise<void> {
    try {
      // ACTION: Enable rotation on existing KMS key
      // REASON: AWS creates new backing key annually while keeping old keys for decryption.
      //         Transparent to applications—same key ID works for all operations.
      await this.kmsClient.send(
        new EnableKeyRotationCommand({
          KeyId: this.keyId,
        })
      );

      console.log(\`✅ Automatic rotation enabled for key \${this.keyId}\`);
      console.log("⏰ KMS will rotate this key every 365 days automatically");

      // ACTION: Record rotation enablement in CloudWatch
      // REASON: Compliance evidence that rotation is active; alerting if rotation disabled
      await this.publishMetric("KeyRotationEnabled", 1);
    } catch (error) {
      console.error("❌ Failed to enable key rotation:", error);
      throw error;
    }
  }

  /**
   * Check rotation status and next rotation date
   */
  async getRotationStatus(): Promise<{
    rotationEnabled: boolean;
    nextRotationDate?: Date;
    keyVersionCount: number;
  }> {
    const describeResponse = await this.kmsClient.send(
      new DescribeKeyCommand({ KeyId: this.keyId })
    );

    const metadata = describeResponse.KeyMetadata;
    const rotationEnabled = metadata?.KeyRotationEnabled ?? false;

    // Calculate next rotation (365 days from creation or last rotation)
    const creationDate = metadata?.CreationDate;
    let nextRotationDate: Date | undefined;
    if (rotationEnabled && creationDate) {
      nextRotationDate = new Date(creationDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    return {
      rotationEnabled,
      nextRotationDate,
      keyVersionCount: 1, // KMS doesn't expose backing key count via API
    };
  }

  /**
   * Publish CloudWatch metric for monitoring
   *
   * ACTION: Send rotation metrics to CloudWatch
   * REASON: Enables alerting on rotation failures, dashboards for compliance reporting,
   *         tracking of key version usage over time
   */
  private async publishMetric(metricName: string, value: number): Promise<void> {
    await this.cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: "CustomApp/Encryption",
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Timestamp: new Date(),
            Unit: "Count",
            Dimensions: [
              {
                Name: "KeyId",
                Value: this.keyId,
              },
            ],
          },
        ],
      })
    );
  }
}

// =============================================================================
// Envelope Encryption with Rotating Keys
// =============================================================================

/**
 * Envelope encryption implementation with KMS key rotation support
 *
 * CONTEXT DILATION: Why envelope encryption with key rotation?
 * Problem: Re-encrypting entire database (10TB) with new key = days of downtime
 * Solution: Envelope encryption—data encrypted with DEK (data encryption key),
 *           DEK encrypted with KMS master key. Rotate KMS key = only re-encrypt
 *           DEKs (kilobytes, not terabytes). Re-encryption happens in milliseconds!
 */
class EnvelopeEncryptionManager {
  private kmsClient: KMSClient;
  private keyId: string;

  constructor(keyId: string, region: string = "us-east-1") {
    this.kmsClient = new KMSClient({ region });
    this.keyId = keyId;
  }

  /**
   * Encrypt data using envelope encryption
   *
   * ACTION: Generate DEK (data encryption key), encrypt data with DEK,
   *         encrypt DEK with KMS master key (current version)
   * REASON: Envelope encryption separates data key from master key. Master key
   *         rotation only requires re-encrypting DEKs, not re-encrypting all data.
   *         KMS handles key versioning transparently—decrypt works with any version.
   */
  async encryptData(plaintext: string): Promise<{
    ciphertext: string;
    encryptedDEK: string;
    keyId: string;
  }> {
    // Generate DEK (256-bit AES key) using KMS
    const dekResponse = await this.kmsClient.send(
      new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(crypto.getRandomValues(new Uint8Array(32))),
      })
    );

    const encryptedDEK = dekResponse.CiphertextBlob!;
    const plaintextDEK = dekResponse.Plaintext!;

    // ACTION: Encrypt data with DEK using AES-256-GCM
    // REASON: Symmetric encryption (AES) is 1000x faster than asymmetric (RSA).
    //         Use AES for bulk data, KMS for protecting the AES key.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey(
      "raw",
      plaintextDEK,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      Buffer.from(plaintext, "utf-8")
    );

    // CODE HIGHLIGHT: Store encrypted DEK + ciphertext together
    const ciphertext = JSON.stringify({
      iv: Buffer.from(iv).toString("base64"),
      data: Buffer.from(encrypted).toString("base64"),
    });

    return {
      ciphertext,
      encryptedDEK: Buffer.from(encryptedDEK).toString("base64"),
      keyId: this.keyId,
    };
  }

  /**
   * Decrypt data using envelope encryption
   *
   * ACTION: Decrypt DEK with KMS (supports any key version), decrypt data with DEK
   * REASON: KMS automatically uses correct backing key version to decrypt DEK.
   *         Application doesn't track key versions—KMS handles it transparently.
   *         Works seamlessly across key rotations with zero code changes!
   */
  async decryptData(
    ciphertext: string,
    encryptedDEK: string
  ): Promise<string> {
    // ACTION: Decrypt DEK using KMS (automatically handles key version)
    // REASON: KMS Decrypt API determines correct backing key from ciphertext metadata.
    //         No need to specify key version—backward compatibility guaranteed!
    const dekResponse = await this.kmsClient.send(
      new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedDEK, "base64"),
      })
    );

    const plaintextDEK = dekResponse.Plaintext!;

    // Decrypt data with DEK
    const { iv, data } = JSON.parse(ciphertext);
    const key = await crypto.subtle.importKey(
      "raw",
      plaintextDEK,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
      key,
      Buffer.from(data, "base64")
    );

    return Buffer.from(decrypted).toString("utf-8");
  }

  /**
   * Re-encrypt DEK with latest KMS key version
   *
   * CONTEXT DILATION: Re-encryption overhead with envelope encryption
   * Without envelope: Re-encrypt 10TB database = days of downtime
   * With envelope: Re-encrypt DEKs (1KB each, 1M records) = ~10 seconds
   * Envelope encryption makes key rotation practical at scale!
   */
  async reEncryptDEK(oldEncryptedDEK: string): Promise<string> {
    // ACTION: Decrypt DEK with old key, re-encrypt with new key (single KMS API call)
    // REASON: KMS ReEncrypt API does decrypt+encrypt atomically, using latest key version.
    //         Optimized for bulk re-encryption during key rotation.
    const response = await this.kmsClient.send({
      name: "ReEncrypt",
      input: {
        CiphertextBlob: Buffer.from(oldEncryptedDEK, "base64"),
        DestinationKeyId: this.keyId,
      },
    });

    return Buffer.from(response.CiphertextBlob!).toString("base64");
  }
}

// =============================================================================
// Usage Example with Monitoring
// =============================================================================

async function demonstrateKMSRotation() {
  const KMS_KEY_ID = "arn:aws:kms:us-east-1:123456789012:key/abcd1234-...";

  // Step 1: Enable automatic rotation
  const rotationManager = new KMSKeyRotationManager(KMS_KEY_ID);
  await rotationManager.enableAutomaticRotation();

  // Check rotation status
  const status = await rotationManager.getRotationStatus();
  console.log(\`Rotation enabled: \${status.rotationEnabled}\`);
  console.log(\`Next rotation: \${status.nextRotationDate?.toISOString()}\`);

  // Step 2: Use envelope encryption (works across rotations)
  const encryptionManager = new EnvelopeEncryptionManager(KMS_KEY_ID);

  // Encrypt sensitive data
  const sensitiveData = "SSN: 123-45-6789";
  const { ciphertext, encryptedDEK } = await encryptionManager.encryptData(
    sensitiveData
  );

  console.log("✅ Data encrypted with envelope encryption");
  console.log(\`   Encrypted DEK (stored in DB): \${encryptedDEK.slice(0, 50)}...\`);

  // Decrypt data (works even after key rotation!)
  const decrypted = await encryptionManager.decryptData(ciphertext, encryptedDEK);
  console.log(\`✅ Data decrypted successfully: \${decrypted}\`);

  // Step 3: Re-encrypt DEK after rotation (background job)
  const newEncryptedDEK = await encryptionManager.reEncryptDEK(encryptedDEK);
  console.log("✅ DEK re-encrypted with latest key version");
}

export { KMSKeyRotationManager, EnvelopeEncryptionManager };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production AWS KMS key rotation with automatic rotation, envelope encryption, multi-version support, and CloudWatch monitoring",
        prerequisites: [
          "AWS SDK v3",
          "AWS KMS",
          "CloudWatch",
          "Web Crypto API",
          "Envelope encryption pattern",
        ],
        systemPosition:
          "Encryption layer in cloud applications, integrated with AWS KMS for key management and CloudWatch for monitoring/alerting",
      },
      annotations: [
        {
          id: "kr-kms-auto-rotation",
          lines: [34, 50],
          action: "Enable AWS KMS automatic rotation for Customer Master Key",
          reason:
            "AWS KMS handles entire rotation lifecycle automatically—generates new backing key every 365 days, retains old keys for decryption, zero downtime. Eliminates manual rotation toil (generate key, update config, deploy). At scale (1000s of keys), automation is only viable approach. Compliance: PCI DSS requires rotation; KMS provides evidence via audit logs.",
          contextLevel: "system",
          relatedConcepts: [
            "automated-key-rotation",
            "aws-kms",
            "zero-downtime",
          ],
        },
        {
          id: "kr-cloudwatch-metrics",
          lines: [94, 116],
          action: "Publish rotation metrics to CloudWatch for monitoring",
          reason:
            "CloudWatch metrics enable alerting on rotation failures (missed schedules, API errors), compliance dashboards (rotation cadence visualization), and capacity planning (key version growth tracking). Critical for production: rotation failures = compliance violations.",
          contextLevel: "system",
          relatedConcepts: [
            "observability",
            "cloudwatch",
            "compliance-monitoring",
          ],
        },
        {
          id: "kr-envelope-encryption",
          lines: [142, 176],
          action:
            "Encrypt data with DEK (data encryption key), encrypt DEK with KMS master key",
          reason:
            "Envelope encryption separates data key from master key. Master key rotation only requires re-encrypting DEKs (kilobytes), not re-encrypting all data (terabytes). Example: 10TB database with 1M records = 1M DEKs (~1KB each) = ~1GB re-encryption vs 10TB. Re-encryption time: seconds vs days!",
          contextLevel: "system",
          relatedConcepts: ["envelope-encryption", "data-encryption-key"],
        },
        {
          id: "kr-kms-decrypt-versioning",
          lines: [190, 198],
          action:
            "Decrypt DEK using KMS without specifying key version—KMS handles automatically",
          reason:
            "KMS Decrypt API extracts key version from ciphertext metadata and uses correct backing key. Transparent multi-version support—application doesn't track versions. Works seamlessly across rotations with zero code changes. Backward compatibility guaranteed by AWS.",
          contextLevel: "module",
          relatedConcepts: [
            "transparent-versioning",
            "backward-compatibility",
            "kms-decrypt",
          ],
        },
        {
          id: "kr-aes-gcm-performance",
          lines: [161, 166],
          action: "Encrypt bulk data with AES-256-GCM symmetric encryption",
          reason:
            "Symmetric encryption (AES) is 1000x faster than asymmetric (RSA). Use AES for bulk data (database records, files), KMS asymmetric keys only for protecting AES keys. AES-GCM provides authenticated encryption (integrity + confidentiality). Hardware acceleration (AES-NI) on modern CPUs.",
          contextLevel: "module",
          relatedConcepts: [
            "symmetric-encryption",
            "aes-gcm",
            "performance-optimization",
          ],
        },
        {
          id: "kr-re-encrypt-optimization",
          lines: [224, 237],
          action: "Re-encrypt DEK with latest KMS key using ReEncrypt API",
          reason:
            "KMS ReEncrypt does decrypt+encrypt atomically using latest key version. Optimized for bulk re-encryption during rotation—single API call vs separate decrypt+encrypt. Used in background jobs to migrate data from old to new key versions. Reduces re-encryption window (less time with mixed versions).",
          contextLevel: "module",
          relatedConcepts: ["re-encryption", "atomic-operations", "kms-api"],
        },
        {
          id: "kr-envelope-context-dilation",
          lines: [132, 138],
          action:
            "Context: Envelope encryption reduces re-encryption overhead from terabytes to kilobytes",
          reason:
            "Problem: Re-encrypting entire 10TB database with new key = days of downtime, I/O saturation. Solution: Envelope encryption—only re-encrypt DEKs (~1KB each). 1M records = ~1GB re-encryption in ~10 seconds. Makes key rotation practical at scale. Critical for large datasets.",
          contextLevel: "system",
          relatedConcepts: [
            "envelope-encryption-benefits",
            "scale",
            "re-encryption-overhead",
          ],
        },
        {
          id: "kr-automation-context",
          lines: [20, 28],
          action:
            "Context: Automated rotation eliminates manual toil and human error",
          reason:
            "Manual rotation: Operator generates keys, updates configs, deploys—error-prone, forgotten rotations lead to compliance violations. Automated: AWS KMS rotates automatically every 365 days—zero manual intervention. At scale (1000s of keys across services), automation is only viable approach. Netflix, Amazon use automated rotation for millions of keys.",
          contextLevel: "system",
          relatedConcepts: [
            "automation",
            "operational-excellence",
            "scale",
            "compliance",
          ],
        },
      ],
      highlights: [
        {
          lines: [34, 50],
          label: "AWS KMS automatic rotation enablement",
          sbvpDomain: "structure",
        },
        {
          lines: [142, 176],
          label: "Envelope encryption with KMS",
          sbvpDomain: "structure",
        },
        {
          lines: [190, 212],
          label: "Transparent multi-version decryption",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "kr-python-fernet",
      language: "python",
      title:
        "Python Manual Key Rotation with Fernet and Background Re-encryption",
      description:
        "Manual key rotation implementation using Fernet symmetric encryption, multi-version key support (active + 2 retired), background re-encryption worker, and zero-downtime rotation strategy",
      code: `from cryptography.fernet import Fernet, MultiFernet
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json
import threading
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# Multi-Version Key Manager
# =============================================================================

class KeyVersionManager:
    """
    Manages multiple key versions with rotation support

    CONTEXT DILATION: Multi-version key management complexity
    Simple approach: Single key, rotate = break all existing data
    Multi-version: Active key + N retired keys, rotate = seamless zero-downtime
    Tradeoff: Storage overhead (3 keys vs 1), lookup complexity, but enables gradual migration
    """

    def __init__(self, max_retired_keys: int = 2):
        self.max_retired_keys = max_retired_keys
        self.keys: List[Dict] = []
        self._load_or_create_keys()

    def _load_or_create_keys(self):
        """Load keys from secure storage or create initial key"""
        # In production, load from AWS Secrets Manager, HashiCorp Vault, etc.
        # For demo, create initial key
        if not self.keys:
            self._create_new_key()

    def _create_new_key(self):
        """
        Generate new cryptographically secure key

        ACTION: Generate Fernet key (symmetric, URL-safe base64)
        REASON: Fernet provides authenticated encryption (AES-128 CBC + HMAC SHA256).
                Keys are 32 bytes, URL-safe base64 encoded (44 chars).
                Simpler than managing AES keys + IVs + MACs separately.
        """
        key = Fernet.generate_key()
        key_version = {
            "version": len(self.keys) + 1,
            "key": key,
            "created_at": datetime.utcnow().isoformat(),
            "status": "active" if not self.keys else "retired",
        }
        self.keys.append(key_version)
        logger.info(f"✅ Created key version {key_version['version']}")

    def rotate_keys(self):
        """
        Rotate keys: create new active key, retire old active key

        ACTION: Generate new key, mark as active, mark previous active as retired
        REASON: Zero-downtime rotation—new writes use new key immediately,
                old reads still work with retired keys. Gradual migration window.
        """
        # Mark current active key as retired
        for key_version in self.keys:
            if key_version["status"] == "active":
                key_version["status"] = "retired"
                key_version["retired_at"] = datetime.utcnow().isoformat()

        # Create new active key
        self._create_new_key()

        # Garbage collect old retired keys (keep only N most recent)
        retired_keys = [k for k in self.keys if k["status"] == "retired"]
        if len(retired_keys) > self.max_retired_keys:
            # ACTION: Remove oldest retired keys beyond retention limit
            # REASON: Prevents unbounded key storage growth. Assumes data re-encrypted
            #         or expired before key deletion.
            keys_to_remove = len(retired_keys) - self.max_retired_keys
            for i in range(keys_to_remove):
                removed_key = retired_keys[i]
                self.keys.remove(removed_key)
                logger.warning(
                    f"🗑️  Destroyed key version {removed_key['version']} "
                    f"(retired {removed_key.get('retired_at')})"
                )

        logger.info(
            f"🔄 Key rotation complete. Active: v{self.get_active_key()['version']}, "
            f"Retired: {len([k for k in self.keys if k['status'] == 'retired'])}"
        )

    def get_active_key(self) -> Dict:
        """Get current active key for encryption"""
        for key_version in self.keys:
            if key_version["status"] == "active":
                return key_version
        raise ValueError("No active key found")

    def get_key_by_version(self, version: int) -> Optional[Dict]:
        """Get specific key version for decryption"""
        for key_version in self.keys:
            if key_version["version"] == version:
                return key_version
        return None

    def get_all_keys_for_decryption(self) -> List[bytes]:
        """
        Get all keys (active + retired) for MultiFernet decryption

        ACTION: Return keys in reverse chronological order (newest first)
        REASON: MultiFernet tries keys in order—newest key likely to match recent data.
                Optimizes decryption performance (fewer key attempts).
        """
        return [k["key"] for k in sorted(self.keys, key=lambda x: x["version"], reverse=True)]

# =============================================================================
# Encryption Engine with Multi-Version Support
# =============================================================================

class VersionedEncryptionEngine:
    """
    Encryption engine supporting multiple key versions

    CONTEXT DILATION: Version metadata storage strategies
    Strategy 1: Embed version in ciphertext prefix (this implementation)
    Strategy 2: Store version in separate database column
    Strategy 3: Use key ID in envelope encryption
    Trade-off: Prefix adds 4 bytes overhead but keeps ciphertext self-contained
    """

    def __init__(self, key_manager: KeyVersionManager):
        self.key_manager = key_manager

    def encrypt(self, plaintext: str) -> bytes:
        """
        Encrypt data with active key and embed version

        ACTION: Prepend key version to ciphertext as 4-byte header
        REASON: Ciphertext is self-describing—contains version metadata.
                Enables decryption without external version lookup.
                Format: [version:4bytes][fernet_ciphertext]
        """
        active_key = self.key_manager.get_active_key()
        fernet = Fernet(active_key["key"])
        ciphertext = fernet.encrypt(plaintext.encode("utf-8"))

        # ACTION: Prepend version as 4-byte big-endian integer
        # REASON: Fixed-width header simplifies parsing. Big-endian for network byte order.
        version_bytes = active_key["version"].to_bytes(4, byteorder="big")
        versioned_ciphertext = version_bytes + ciphertext

        logger.debug(f"🔒 Encrypted with key v{active_key['version']}")
        return versioned_ciphertext

    def decrypt(self, versioned_ciphertext: bytes) -> str:
        """
        Decrypt data using embedded key version

        ACTION: Extract version from ciphertext header, fetch corresponding key, decrypt
        REASON: Supports data encrypted with any historical key version.
                Zero-downtime reads during and after rotation.
        """
        # Extract version from first 4 bytes
        version = int.from_bytes(versioned_ciphertext[:4], byteorder="big")
        ciphertext = versioned_ciphertext[4:]

        # Fetch key for this version
        key_version = self.key_manager.get_key_by_version(version)
        if not key_version:
            raise ValueError(f"Key version {version} not found (may be destroyed)")

        fernet = Fernet(key_version["key"])
        plaintext = fernet.decrypt(ciphertext).decode("utf-8")

        logger.debug(f"🔓 Decrypted with key v{version}")
        return plaintext

    def decrypt_multi(self, ciphertext: bytes) -> str:
        """
        Decrypt using MultiFernet (tries all keys automatically)

        CONTEXT DILATION: MultiFernet fallback strategy
        Primary: Extract version, use specific key (fast, explicit)
        Fallback: MultiFernet tries all keys (slower, robust to version corruption)
        Use fallback when version header damaged or during migration
        """
        all_keys = self.key_manager.get_all_keys_for_decryption()
        multi_fernet = MultiFernet([Fernet(k) for k in all_keys])

        # ACTION: Try decryption with all keys in order (newest first)
        # REASON: Handles edge cases—corrupted version header, legacy data without version
        try:
            plaintext = multi_fernet.decrypt(ciphertext).decode("utf-8")
            logger.debug("🔓 Decrypted using MultiFernet fallback")
            return plaintext
        except Exception as e:
            raise ValueError(f"Decryption failed with all key versions: {e}")

# =============================================================================
# Background Re-encryption Worker
# =============================================================================

class BackgroundReEncryptionWorker:
    """
    Background worker to re-encrypt old data with new keys

    CONTEXT DILATION: Re-encryption overhead and scheduling
    Eager re-encryption: Re-encrypt all data immediately after rotation (high I/O spike)
    Lazy re-encryption: Re-encrypt on read/write (slow, unpredictable latency spikes)
    Background re-encryption: Re-encrypt in batches during off-peak (this implementation)
    Trade-off: Background spreads load over hours/days, avoids user-facing latency
    """

    def __init__(
        self,
        key_manager: KeyVersionManager,
        encryption_engine: VersionedEncryptionEngine,
        database,
        batch_size: int = 100,
    ):
        self.key_manager = key_manager
        self.encryption_engine = encryption_engine
        self.database = database
        self.batch_size = batch_size
        self.is_running = False

    def start_re_encryption(self):
        """
        Start background re-encryption job

        ACTION: Spawn background thread to re-encrypt old key versions
        REASON: Avoid blocking main application. Spread re-encryption load over time.
                Enables zero-downtime rotation—users never blocked.
        """
        if self.is_running:
            logger.warning("Re-encryption already running")
            return

        self.is_running = True
        thread = threading.Thread(target=self._re_encrypt_loop, daemon=True)
        thread.start()
        logger.info("🔄 Background re-encryption worker started")

    def _re_encrypt_loop(self):
        """
        Re-encryption loop: fetch old records, re-encrypt, update database
        """
        active_version = self.key_manager.get_active_key()["version"]

        while self.is_running:
            # Fetch batch of records encrypted with old key versions
            old_records = self.database.fetch_records_needing_reencryption(
                exclude_version=active_version,
                limit=self.batch_size
            )

            if not old_records:
                logger.info("✅ Re-encryption complete—all records up to date")
                self.is_running = False
                break

            # ACTION: Re-encrypt batch
            # REASON: Process in batches to limit memory usage and I/O spikes.
            #         Batch size tuned for database load (100 = ~1 query/sec, gentle load).
            for record in old_records:
                try:
                    # Decrypt with old key
                    plaintext = self.encryption_engine.decrypt(record["ciphertext"])

                    # Re-encrypt with new active key
                    new_ciphertext = self.encryption_engine.encrypt(plaintext)

                    # Update database
                    self.database.update_record(record["id"], new_ciphertext)

                    logger.debug(f"Re-encrypted record {record['id']}")
                except Exception as e:
                    logger.error(f"Failed to re-encrypt record {record['id']}: {e}")

            logger.info(f"🔄 Re-encrypted batch of {len(old_records)} records")

            # Rate limiting—prevent database overload
            time.sleep(1)

# =============================================================================
# Mock Database for Demo
# =============================================================================

class MockDatabase:
    """Simulated database for demonstration"""

    def __init__(self):
        self.records = []

    def insert_record(self, ciphertext: bytes):
        record_id = len(self.records) + 1
        self.records.append({
            "id": record_id,
            "ciphertext": ciphertext,
            "created_at": datetime.utcnow().isoformat(),
        })
        return record_id

    def fetch_records_needing_reencryption(
        self, exclude_version: int, limit: int
    ) -> List[Dict]:
        """Fetch records encrypted with old key versions"""
        old_records = []
        for record in self.records:
            # Extract version from ciphertext header
            version = int.from_bytes(record["ciphertext"][:4], byteorder="big")
            if version != exclude_version:
                old_records.append(record)
            if len(old_records) >= limit:
                break
        return old_records

    def update_record(self, record_id: int, new_ciphertext: bytes):
        for record in self.records:
            if record["id"] == record_id:
                record["ciphertext"] = new_ciphertext
                record["updated_at"] = datetime.utcnow().isoformat()
                break

# =============================================================================
# Usage Example
# =============================================================================

def demonstrate_key_rotation():
    # Initialize components
    key_manager = KeyVersionManager(max_retired_keys=2)
    encryption_engine = VersionedEncryptionEngine(key_manager)
    database = MockDatabase()

    # Encrypt some data with initial key (v1)
    logger.info("\\n📝 Step 1: Encrypt data with initial key")
    for i in range(5):
        ciphertext = encryption_engine.encrypt(f"Sensitive data {i}")
        database.insert_record(ciphertext)
    logger.info(f"✅ Encrypted 5 records with key v1")

    # Rotate keys
    logger.info("\\n🔄 Step 2: Rotate keys (v1 → v2)")
    key_manager.rotate_keys()

    # Encrypt new data with new key (v2)
    logger.info("\\n📝 Step 3: Encrypt new data with rotated key")
    for i in range(3):
        ciphertext = encryption_engine.encrypt(f"New data after rotation {i}")
        database.insert_record(ciphertext)
    logger.info(f"✅ Encrypted 3 records with key v2")

    # Decrypt old data (still works with v1!)
    logger.info("\\n🔓 Step 4: Decrypt old data (encrypted with v1)")
    old_record = database.records[0]
    decrypted = encryption_engine.decrypt(old_record["ciphertext"])
    logger.info(f"✅ Decrypted old data: '{decrypted}'")

    # Start background re-encryption
    logger.info("\\n🔄 Step 5: Start background re-encryption worker")
    worker = BackgroundReEncryptionWorker(
        key_manager, encryption_engine, database, batch_size=2
    )
    worker.start_re_encryption()

    # Wait for re-encryption to complete
    time.sleep(3)

    logger.info("\\n✅ Key rotation demonstration complete!")

if __name__ == "__main__":
    demonstrate_key_rotation()`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete manual key rotation system with Fernet encryption, multi-version key management (active + 2 retired), background re-encryption worker, and zero-downtime rotation",
        prerequisites: [
          "Python cryptography library",
          "Fernet symmetric encryption",
          "Threading",
          "Database operations",
        ],
        systemPosition:
          "Encryption layer in Python applications, integrated with database for persistent storage and background workers for re-encryption",
      },
      annotations: [
        {
          id: "kr-multi-version-storage",
          lines: [18, 27],
          action:
            "Manage multiple concurrent key versions (active + retired) with retention limit",
          reason:
            "Simple approach: Single key, rotate = break all existing data. Multi-version: Active key + N retired keys, rotate = seamless zero-downtime. Trade-off: Storage overhead (3 keys vs 1), lookup complexity, but enables gradual migration. Retention limit (max_retired_keys=2) prevents unbounded growth.",
          contextLevel: "system",
          relatedConcepts: [
            "multi-version-concurrency",
            "zero-downtime",
            "key-retention",
          ],
        },
        {
          id: "kr-fernet-choice",
          lines: [42, 49],
          action: "Use Fernet for authenticated symmetric encryption",
          reason:
            "Fernet provides authenticated encryption (AES-128 CBC + HMAC SHA256) in single operation. Keys are 32 bytes, URL-safe base64 encoded. Simpler than managing AES keys + IVs + MACs separately. Standard in Python ecosystem. Drawback: AES-128 vs AES-256, but sufficient for most use cases.",
          contextLevel: "module",
          relatedConcepts: [
            "fernet",
            "authenticated-encryption",
            "symmetric-cryptography",
          ],
        },
        {
          id: "kr-zero-downtime-rotation",
          lines: [57, 65],
          action:
            "Rotate by creating new active key and retiring old active key—both available",
          reason:
            "Zero-downtime rotation—new writes use new key immediately (forward security), old reads still work with retired keys (backward compatibility). Gradual migration window (hours/days) to re-encrypt old data. No maintenance window required. Critical for 24/7 services.",
          contextLevel: "system",
          relatedConcepts: [
            "zero-downtime-deployment",
            "forward-security",
            "backward-compatibility",
          ],
        },
        {
          id: "kr-garbage-collection",
          lines: [70, 85],
          action: "Remove oldest retired keys beyond retention limit",
          reason:
            "Prevents unbounded key storage growth. Retention limit (e.g., 2 retired keys) balances backward compatibility with storage overhead. Assumes data re-encrypted or expired before key deletion. Warning: Deleting keys before re-encryption = data loss! Verify no records exist before deletion.",
          contextLevel: "module",
          relatedConcepts: [
            "garbage-collection",
            "key-lifecycle",
            "data-loss-prevention",
          ],
        },
        {
          id: "kr-version-embedding",
          lines: [142, 152],
          action: "Embed key version in ciphertext as 4-byte prefix header",
          reason:
            "Ciphertext is self-describing—contains version metadata. Enables decryption without external version lookup (no database column needed). Format: [version:4bytes][fernet_ciphertext]. Alternative: Store version in separate DB column (normalized, but requires joins). Trade-off: 4 bytes overhead vs self-contained ciphertext.",
          contextLevel: "module",
          relatedConcepts: [
            "version-metadata",
            "self-describing-data",
            "ciphertext-format",
          ],
        },
        {
          id: "kr-multi-fernet-fallback",
          lines: [178, 192],
          action: "Use MultiFernet to try all keys in order (newest first)",
          reason:
            "Fallback strategy when version header corrupted or during migration from unversioned ciphertext. MultiFernet tries keys in order—newest first (likely to match recent data). Performance optimization: Specific key lookup (O(1)) faster than MultiFernet (O(N keys)). Use fallback only when needed.",
          contextLevel: "module",
          relatedConcepts: ["multi-fernet", "fallback-strategy", "robustness"],
        },
        {
          id: "kr-background-re-encryption",
          lines: [197, 208],
          action:
            "Re-encrypt in background thread with batching to spread load over time",
          reason:
            "Eager re-encryption: Re-encrypt all data immediately (I/O spike, downtime risk). Lazy re-encryption: Re-encrypt on read/write (slow, unpredictable latency). Background re-encryption: Batched processing during off-peak hours (this implementation). Trade-off: Background spreads load over hours/days, avoids user-facing latency. Critical for large datasets.",
          contextLevel: "system",
          relatedConcepts: [
            "background-jobs",
            "re-encryption-strategies",
            "load-spreading",
          ],
        },
        {
          id: "kr-batch-processing",
          lines: [244, 252],
          action: "Process re-encryption in batches with rate limiting",
          reason:
            "Process in batches to limit memory usage and I/O spikes. Batch size tuned for database load (100 records = ~1 query/sec, gentle load). Rate limiting (sleep(1)) prevents database overload. Production: Use queue systems (Celery, RabbitMQ) for distributed re-encryption workers.",
          contextLevel: "module",
          relatedConcepts: [
            "batch-processing",
            "rate-limiting",
            "database-load",
          ],
        },
      ],
      highlights: [
        {
          lines: [57, 85],
          label: "Zero-downtime key rotation with garbage collection",
          sbvpDomain: "structure",
        },
        {
          lines: [142, 152],
          label: "Version-embedded encryption",
          sbvpDomain: "structure",
        },
        {
          lines: [223, 266],
          label: "Background re-encryption worker",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "kr-java-spring-jwt",
      language: "java",
      title: "Java Spring Boot JWT Key Rotation with JWKS and Overlapping Keys",
      description:
        "Production JWT signing key rotation with RS256 asymmetric keys, JWKS endpoint for public key distribution, gradual key transition with overlap period, and old token validation during rotation",
      code: `package com.example.security.keyrotation;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.*;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// =============================================================================
// JWT Signing Key Manager with Rotation
// =============================================================================

/**
 * Manages JWT signing keys with automatic rotation and JWKS endpoint
 *
 * CONTEXT DILATION: JWT key rotation compliance requirements
 * PCI DSS: 90-day rotation for payment systems accessing cardholder data
 * NIST: 1-2 year rotation for general cryptographic keys
 * GitHub: 90-day rotation for all JWT signing keys
 * Trade-off: Shorter rotation = better security, but more operational complexity
 */
@Service
public class JwtKeyRotationService {

    private final Map<String, KeyPairWithMetadata> keyStore = new ConcurrentHashMap<>();
    private String activeKeyId;

    // Configuration
    private static final int KEY_SIZE = 2048;  // RSA key size
    private static final int ROTATION_DAYS = 90;  // PCI DSS compliant
    private static final int OVERLAP_DAYS = 7;  // Grace period for old tokens

    public JwtKeyRotationService() {
        // Initialize with first key
        rotateKeys();
    }

    /**
     * Rotate JWT signing keys every 90 days
     *
     * ACTION: Generate new RS256 key pair, mark as active, retain old for overlap period
     * REASON: RS256 (RSA with SHA-256) is standard for JWT in distributed systems.
     *         Private key signs tokens (auth server only). Public key verifies (all services).
     *         Overlap period (7 days) allows in-flight tokens to remain valid during rotation.
     */
    @Scheduled(cron = "0 0 0 */90 * ?")  // Every 90 days at midnight
    public synchronized void rotateKeys() {
        try {
            // ACTION: Generate RSA 2048-bit key pair
            // REASON: RSA-2048 provides ~112-bit security (sufficient until 2030 per NIST).
            //         RSA-3072 or ECDSA P-256 for higher security (slower signing).
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(KEY_SIZE, new SecureRandom());
            KeyPair keyPair = keyGen.generateKeyPair();

            // Generate unique key ID (kid) for JWKS
            String keyId = "key-" + System.currentTimeMillis();

            KeyPairWithMetadata metadata = new KeyPairWithMetadata(
                keyPair,
                keyId,
                Instant.now(),
                Instant.now().plus(ROTATION_DAYS, ChronoUnit.DAYS)
            );

            // ACTION: Add new key to store and mark as active
            // REASON: Keep old keys in store for overlap period (7 days).
            //         Tokens signed with old key still validate during overlap.
            keyStore.put(keyId, metadata);

            String previousKeyId = activeKeyId;
            activeKeyId = keyId;

            System.out.println("✅ JWT key rotation complete");
            System.out.println("   New active key: " + keyId);
            System.out.println("   Previous key: " + (previousKeyId != null ? previousKeyId : "none"));
            System.out.println("   Next rotation: " + metadata.expiresAt);

            // Schedule cleanup of old keys after overlap period
            scheduleKeyCleanup(previousKeyId, OVERLAP_DAYS);

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate RSA key pair", e);
        }
    }

    /**
     * Get active signing key for JWT creation
     */
    public KeyPairWithMetadata getActiveKey() {
        return keyStore.get(activeKeyId);
    }

    /**
     * Get key by ID for JWT verification
     *
     * ACTION: Support retrieval of any key in store (active or retired)
     * REASON: Enables verification of tokens signed with old keys during overlap.
     *         JWKS endpoint exposes all keys for distributed verification.
     */
    public Optional<KeyPairWithMetadata> getKeyById(String keyId) {
        return Optional.ofNullable(keyStore.get(keyId));
    }

    /**
     * Get all public keys for JWKS endpoint
     *
     * CONTEXT DILATION: JWKS (JSON Web Key Set) for distributed systems
     * Problem: 100 microservices need public keys to verify JWTs
     * Solution: JWKS endpoint exposes all public keys in standard format
     * Services fetch JWKS once, cache it, refresh periodically
     * Enables zero-coordination distributed verification at massive scale!
     */
    public JWKSet getJwkSet() {
        List<JWK> jwks = new ArrayList<>();

        // ACTION: Convert all RSA public keys to JWK format
        // REASON: JWK is standard format for key distribution (RFC 7517).
        //         Includes key ID (kid) for version identification.
        //         Services use kid from JWT header to select correct key from JWKS.
        for (KeyPairWithMetadata metadata : keyStore.values()) {
            RSAPublicKey publicKey = (RSAPublicKey) metadata.keyPair.getPublic();

            RSAKey rsaKey = new RSAKey.Builder(publicKey)
                    .keyID(metadata.keyId)
                    .algorithm(com.nimbusds.jose.JWSAlgorithm.RS256)
                    .keyUse(com.nimbusds.jose.jwk.KeyUse.SIGNATURE)
                    .build();

            jwks.add(rsaKey);
        }

        return new JWKSet(jwks);
    }

    /**
     * Schedule cleanup of retired keys after overlap period
     */
    private void scheduleKeyCleanup(String keyId, int daysDelay) {
        if (keyId == null) return;

        // In production, use scheduled task or TTL-based cleanup
        Timer timer = new Timer(true);
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                keyStore.remove(keyId);
                System.out.println("🗑️  Destroyed retired key: " + keyId);
            }
        }, daysDelay * 24 * 60 * 60 * 1000L);
    }

    /**
     * Key pair with metadata for rotation tracking
     */
    public static class KeyPairWithMetadata {
        public final KeyPair keyPair;
        public final String keyId;
        public final Instant createdAt;
        public final Instant expiresAt;

        public KeyPairWithMetadata(KeyPair keyPair, String keyId, Instant createdAt, Instant expiresAt) {
            this.keyPair = keyPair;
            this.keyId = keyId;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }
    }
}

// =============================================================================
// JWT Token Service with Rotation Support
// =============================================================================

@Service
public class JwtTokenService {

    private final JwtKeyRotationService keyRotationService;

    public JwtTokenService(JwtKeyRotationService keyRotationService) {
        this.keyRotationService = keyRotationService;
    }

    /**
     * Create JWT signed with active key
     *
     * ACTION: Sign JWT with latest active private key, include kid in header
     * REASON: kid (key ID) in JWT header tells verifiers which public key to use.
     *         Enables seamless rotation—old tokens (old kid) and new tokens (new kid)
     *         both validate using correct keys from JWKS.
     */
    public String createToken(String userId, List<String> roles) {
        var activeKey = keyRotationService.getActiveKey();

        // ACTION: Use RS256 algorithm with private key
        // REASON: Asymmetric signing—auth server has private key, all services have public key.
        //         Public key distribution via JWKS—no shared secrets across services.
        Algorithm algorithm = Algorithm.RSA256(
            (RSAPublicKey) activeKey.keyPair.getPublic(),
            (RSAPrivateKey) activeKey.keyPair.getPrivate()
        );

        Instant now = Instant.now();
        Instant expiry = now.plus(15, ChronoUnit.MINUTES);

        // CODE HIGHLIGHT: Include kid in JWT header for key identification
        return JWT.create()
                .withHeader(Map.of(
                    "alg", "RS256",
                    "typ", "JWT",
                    "kid", activeKey.keyId  // Key ID for JWKS lookup
                ))
                .withSubject(userId)
                .withClaim("roles", roles)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiry))
                .withIssuer("auth-service")
                .sign(algorithm);
    }

    /**
     * Verify JWT using key ID from header
     *
     * ACTION: Extract kid from JWT header, fetch corresponding public key, verify signature
     * REASON: Supports tokens signed with current or previous keys (during overlap).
     *         Gradual key transition—no "big bang" rotation breaking all tokens.
     *         Critical for zero-downtime rotation in production.
     */
    public DecodedJWT verifyToken(String token) {
        // ACTION: Decode header to extract kid (key ID)
        DecodedJWT unverifiedJwt = JWT.decode(token);
        String kid = unverifiedJwt.getKeyId();

        if (kid == null) {
            throw new RuntimeException("JWT missing kid (key ID) in header");
        }

        // ACTION: Fetch public key for this kid from key store
        // REASON: Supports verification of tokens signed with any active or retired key.
        //         During overlap period, both old and new keys are valid.
        var keyMetadata = keyRotationService.getKeyById(kid)
                .orElseThrow(() -> new RuntimeException("Unknown key ID: " + kid));

        Algorithm algorithm = Algorithm.RSA256(
            (RSAPublicKey) keyMetadata.keyPair.getPublic(),
            null  // Verification doesn't need private key
        );

        // Verify signature and validate claims
        return JWT.require(algorithm)
                .withIssuer("auth-service")
                .build()
                .verify(token);
    }
}

// =============================================================================
// JWKS Endpoint for Public Key Distribution
// =============================================================================

/**
 * REST controller exposing JWKS endpoint
 *
 * CONTEXT DILATION: 90-day key rotation for PCI DSS compliance
 * PCI DSS Requirement 3.6.4: Cryptographic keys must be rotated every 90 days
 * for systems storing, processing, or transmitting cardholder data.
 * Shorter rotation (90 days) reduces compromise blast radius—stolen key from
 * Jan 1 can't decrypt data from April 1 (different key). Critical for compliance!
 */
@RestController
public class JwksController {

    private final JwtKeyRotationService keyRotationService;

    public JwksController(JwtKeyRotationService keyRotationService) {
        this.keyRotationService = keyRotationService;
    }

    /**
     * JWKS endpoint - exposes public keys in standard format
     *
     * ACTION: Return JWK Set with all active/retired public keys
     * REASON: Standard endpoint (/.well-known/jwks.json) for key distribution.
     *         Services fetch this endpoint to get public keys for verification.
     *         Cache with TTL (e.g., 1 hour) to reduce load, refresh to get new keys.
     */
    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> getJwks() {
        JWKSet jwkSet = keyRotationService.getJwkSet();
        return jwkSet.toJSONObject();
    }
}

// =============================================================================
// Usage Example
// =============================================================================

@RestController
public class AuthController {

    private final JwtTokenService jwtTokenService;

    public AuthController(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    /**
     * Login endpoint - issue JWT signed with latest key
     */
    @PostMapping("/auth/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        // Authenticate user (simplified)
        String userId = "user-123";
        List<String> roles = Arrays.asList("user", "admin");

        // ACTION: Sign JWT with current active key
        // REASON: All new tokens use latest key (forward security).
        //         Old tokens (signed before rotation) still validate during overlap.
        String token = jwtTokenService.createToken(userId, roles);

        return Map.of(
            "accessToken", token,
            "tokenType", "Bearer",
            "expiresIn", "900"  // 15 minutes
        );
    }

    /**
     * Protected endpoint - verify JWT with key rotation support
     */
    @GetMapping("/api/profile")
    public Map<String, Object> getProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);  // Remove "Bearer " prefix

        // ACTION: Verify token using kid from header—works with current and previous keys
        DecodedJWT jwt = jwtTokenService.verifyToken(token);

        return Map.of(
            "userId", jwt.getSubject(),
            "roles", jwt.getClaim("roles").asList(String.class),
            "keyId", jwt.getKeyId()  // Show which key was used
        );
    }

    public static class LoginRequest {
        private String username;
        private String password;
        // getters/setters
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production JWT signing key rotation with RS256 asymmetric keys, JWKS endpoint for distributed public key distribution, gradual key transition with overlap period, and multi-version token validation",
        prerequisites: [
          "Spring Boot",
          "Auth0 Java JWT",
          "Nimbus JOSE+JWT (JWKS)",
          "RSA cryptography",
          "Spring Scheduling",
        ],
        systemPosition:
          "Authentication service in microservices architecture, exposing JWKS endpoint for distributed JWT verification across services",
      },
      annotations: [
        {
          id: "kr-jwt-rs256-rotation",
          lines: [48, 64],
          action:
            "Generate RSA-2048 key pair every 90 days for JWT signing with overlap period",
          reason:
            "RS256 (RSA with SHA-256) is standard for JWT in distributed systems. Private key signs tokens (auth server only), public key verifies (all services). 90-day rotation satisfies PCI DSS compliance. Overlap period (7 days) allows in-flight tokens to remain valid during rotation—gradual transition vs big-bang cutover.",
          contextLevel: "system",
          relatedConcepts: [
            "rs256",
            "jwt-signing",
            "pci-dss-compliance",
            "gradual-rotation",
          ],
        },
        {
          id: "kr-jwks-distributed-verification",
          lines: [107, 120],
          action: "Expose all public keys via JWKS endpoint in standard format",
          reason:
            "JWKS (JSON Web Key Set) enables distributed verification at scale. Problem: 100 microservices need public keys. Solution: Services fetch JWKS endpoint once, cache keys, refresh periodically. Includes kid (key ID) for version identification. Services use kid from JWT header to select correct key. Zero-coordination distributed verification!",
          contextLevel: "system",
          relatedConcepts: [
            "jwks",
            "distributed-systems",
            "public-key-distribution",
          ],
        },
        {
          id: "kr-overlap-period",
          lines: [70, 78],
          action:
            "Retain old keys in store for overlap period (7 days) after rotation",
          reason:
            "Overlap period enables zero-downtime rotation. Tokens signed with old key (before rotation) remain valid during overlap. Example: Rotate on Jan 1, tokens issued Dec 31 (15min TTL) still validate. Without overlap: all tokens invalid immediately = outage. Critical for 24/7 services. After overlap, old key destroyed.",
          contextLevel: "system",
          relatedConcepts: [
            "overlap-period",
            "zero-downtime",
            "graceful-degradation",
          ],
        },
        {
          id: "kr-kid-in-header",
          lines: [174, 188],
          action: "Include kid (key ID) in JWT header for JWKS lookup",
          reason:
            "kid tells verifiers which public key to use from JWKS. Enables seamless rotation—old tokens (old kid) and new tokens (new kid) both validate using correct keys. Verifier extracts kid from header, fetches key from JWKS, verifies signature. No ambiguity about which key version to use.",
          contextLevel: "module",
          relatedConcepts: ["kid", "jwt-header", "key-versioning"],
        },
        {
          id: "kr-multi-version-verification",
          lines: [206, 223],
          action:
            "Verify JWT by extracting kid from header and fetching corresponding key",
          reason:
            "Supports tokens signed with current or previous keys (during overlap). Gradual key transition—no big-bang rotation breaking all tokens. Extract kid from header, fetch key (active or retired) from store, verify signature. Critical for zero-downtime rotation in production. Handles mixed-version token traffic seamlessly.",
          contextLevel: "module",
          relatedConcepts: [
            "multi-version-verification",
            "gradual-transition",
            "zero-downtime",
          ],
        },
        {
          id: "kr-rsa-key-size",
          lines: [56, 60],
          action: "Generate RSA-2048 bit key pair using SecureRandom",
          reason:
            "RSA-2048 provides ~112-bit security strength (sufficient until 2030 per NIST SP 800-57). RSA-3072 for higher security (slower signing, ~128-bit). Alternative: ECDSA P-256 (faster, smaller keys, ~128-bit). Trade-off: RSA widespread support vs ECDSA performance. SecureRandom uses OS entropy for cryptographic randomness.",
          contextLevel: "module",
          relatedConcepts: [
            "rsa-key-size",
            "nist-recommendations",
            "secure-random",
          ],
        },
        {
          id: "kr-pci-dss-context",
          lines: [24, 32],
          action:
            "Context: PCI DSS mandates 90-day rotation for payment card data systems",
          reason:
            "PCI DSS Requirement 3.6.4: Cryptographic keys must be rotated at least annually (best practice: 90 days) for systems storing/processing cardholder data. Shorter rotation reduces compromise blast radius—stolen key from Jan 1 can't decrypt data from April 1 (different key). Compliance evidence: audit logs showing rotation cadence. Critical for payment processors!",
          contextLevel: "system",
          relatedConcepts: [
            "pci-dss",
            "compliance",
            "regulatory-requirements",
            "blast-radius",
          ],
        },
        {
          id: "kr-jwks-caching",
          lines: [247, 254],
          action:
            "Expose JWKS endpoint at /.well-known/jwks.json standard path",
          reason:
            "Standard endpoint (RFC 8414) for key distribution. Services fetch JWKS to get public keys for verification. Implementation: Cache JWKS with TTL (e.g., 1 hour) to reduce load on auth server. Refresh before TTL expiry to get new keys after rotation. Balance: Short TTL (faster key propagation) vs load (more requests).",
          contextLevel: "system",
          relatedConcepts: [
            "jwks-endpoint",
            "rfc-8414",
            "caching-strategy",
            "ttl",
          ],
        },
      ],
      highlights: [
        {
          lines: [48, 91],
          label: "Scheduled JWT key rotation with overlap period",
          sbvpDomain: "structure",
        },
        {
          lines: [107, 132],
          label: "JWKS generation for distributed verification",
          sbvpDomain: "structure",
        },
        {
          lines: [174, 223],
          label: "Multi-version JWT creation and verification",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Database encryption keys (at-rest encryption for PII, PHI, PCI data)",
      "JWT signing keys (OAuth 2.0, OIDC, API authentication tokens)",
      "API encryption keys (request/response encryption, webhook signatures)",
      "TLS/SSL certificates (HTTPS, mutual TLS for service mesh)",
      "Secrets management (HashiCorp Vault, AWS Secrets Manager rotation)",
      "Encryption at rest keys (disk encryption, backup encryption)",
      "Token signing keys (session tokens, CSRF tokens, API keys)",
    ],
    interactsWith: [
      "envelope-encryption",
      "encryption-at-rest",
      "jwt",
      "tls-ssl",
      "key-management-service",
      "zero-downtime-deployment",
      "audit-logging",
    ],
    architecturalBoundaries: [
      "Key Management Service layer (AWS KMS, HashiCorp Vault, Azure Key Vault)",
      "Encryption layer (application-level encryption/decryption operations)",
      "Rotation scheduler (cron jobs, AWS Lambda scheduled events, Kubernetes CronJobs)",
      "Monitoring and alerting layer (CloudWatch, Prometheus, PagerDuty)",
      "Re-encryption workers (background jobs, queue consumers, batch processors)",
    ],
  },

  implementations: [
    {
      id: "aws-kms",
      name: "AWS KMS (Key Management Service)",
      type: "service",
      languages: ["any"],
      description:
        "Managed key management service with automatic rotation. KMS automatically rotates Customer Master Keys (CMKs) every 365 days, retaining old backing keys for decryption. Transparent to applications—same key ID works after rotation. Supports envelope encryption, CloudTrail audit logging, and multi-region keys. Scales to millions of keys with sub-millisecond latency. Used by Amazon for encrypting 100PB+ of data.",
      links: {
        docs: "https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html",
      },
      codeSnippet: `// Enable automatic rotation (AWS CLI)
aws kms enable-key-rotation --key-id 1234abcd-12ab-34cd-56ef-1234567890ab

// Check rotation status
aws kms get-key-rotation-status --key-id 1234abcd-12ab-34cd-56ef-1234567890ab

// Rotation happens automatically every 365 days
// Old backing keys retained for decryption—transparent to applications`,
    },
    {
      id: "azure-key-vault",
      name: "Azure Key Vault",
      type: "service",
      languages: ["any"],
      description:
        "Cloud key management service with versioned keys and automatic rotation policies. Supports RSA, EC, and symmetric keys. Rotation triggers via Azure Policy or manual API calls. Integrates with Azure Monitor for rotation alerts. Supports Hardware Security Module (HSM) backing for FIPS 140-2 Level 2/3 compliance. Used by Microsoft for Dynamics 365, Office 365 encryption.",
      links: {
        docs: "https://learn.microsoft.com/en-us/azure/key-vault/keys/about-keys",
      },
      codeSnippet: `# Azure CLI - Create key with rotation policy
az keyvault key create \\
  --vault-name myKeyVault \\
  --name myKey \\
  --kty RSA \\
  --size 2048 \\
  --rotation-policy @rotation-policy.json

# rotation-policy.json
{
  "lifetimeActions": [{
    "trigger": { "timeAfterCreate": "P90D" },
    "action": { "type": "Rotate" }
  }]
}`,
    },
    {
      id: "google-cloud-kms",
      name: "Google Cloud KMS",
      type: "service",
      languages: ["any"],
      description:
        "GCP key management service with automatic rotation for symmetric keys. Rotation schedule configurable (90 days, 180 days, custom). Retains up to 100 previous key versions for decryption. Supports Cloud HSM for FIPS 140-2 Level 3 compliance. Integrates with Cloud Audit Logs for rotation tracking. Used by Google for Gmail, Drive, Workspace encryption.",
      links: {
        docs: "https://cloud.google.com/kms/docs/key-rotation",
      },
      codeSnippet: `# gcloud CLI - Create key with 90-day rotation
gcloud kms keys create my-key \\
  --keyring my-keyring \\
  --location global \\
  --purpose encryption \\
  --rotation-period 90d \\
  --next-rotation-time 2024-04-01T00:00:00Z

# Rotation happens automatically; old versions retained`,
    },
    {
      id: "hashicorp-vault",
      name: "HashiCorp Vault",
      type: "platform",
      languages: ["any"],
      description:
        "Self-hosted secrets management platform with dynamic key rotation. Supports database credentials rotation, PKI certificate rotation, and encryption key rotation. Transit engine provides encryption-as-a-service with versioned keys. Supports manual and scheduled rotation. Integrates with cloud KMS (AWS, Azure, GCP) for auto-unseal. Used by enterprises for multi-cloud key management.",
      links: {
        docs: "https://www.vaultproject.io/docs/secrets/transit",
        github: "https://github.com/hashicorp/vault",
      },
      codeSnippet: `# Enable transit engine with automatic rotation
vault secrets enable transit

# Create key with rotation
vault write transit/keys/my-key type=aes256-gcm96

# Rotate key manually
vault write -f transit/keys/my-key/rotate

# Configure automatic rotation (30 days)
vault write transit/keys/my-key/config \\
  auto_rotate_period=720h`,
    },
    {
      id: "jwks-rotation",
      name: "JWKS (JSON Web Key Set) Rotation",
      type: "library",
      languages: ["any"],
      description:
        "Standard for distributing public keys for JWT verification. Services expose /.well-known/jwks.json endpoint with all active key versions. Clients cache JWKS with TTL (1 hour typical). Key rotation involves adding new key to JWKS, signing new JWTs with new key (include kid in header), retaining old keys for overlap period. Used by Auth0, Okta, Firebase, AWS Cognito.",
      links: {
        docs: "https://datatracker.ietf.org/doc/html/rfc7517",
      },
      codeSnippet: `// JWKS endpoint response (multiple keys during rotation)
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-2024-01",  // New active key
      "n": "0vx7agoebGcQ...",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-2023-10",  // Retired key (overlap period)
      "n": "xjlCRBqkfVI...",
      "e": "AQAB"
    }
  ]
}`,
    },
    {
      id: "lets-encrypt",
      name: "Let's Encrypt (Certificate Rotation)",
      type: "service",
      languages: ["any"],
      description:
        "Free, automated certificate authority with 90-day certificate expiry forcing regular rotation. Certbot automates renewal via ACME protocol. Renews certificates 30 days before expiry. Zero-downtime rotation via graceful web server reload (nginx, apache). Prevents long-lived certificate compromise. Issues 3M+ certificates daily, 300M+ active certificates.",
      links: {
        docs: "https://letsencrypt.org/docs/",
      },
      codeSnippet: `# Certbot automatic renewal (cron job)
0 0,12 * * * certbot renew --quiet --deploy-hook "nginx -s reload"

# Renews certificates 30 days before expiry
# 90-day expiry forces regular rotation (reduces compromise window)`,
    },
    {
      id: "hsm-rotation",
      name: "Hardware Security Modules (HSM)",
      type: "platform",
      languages: ["any"],
      description:
        "Physical devices for cryptographic key generation and storage. FIPS 140-2 Level 3/4 certified—tamper-resistant, keys never leave device. Supports key rotation via key duplication (export encrypted key to new HSM) or re-encryption. Cloud HSMs (AWS CloudHSM, Azure Dedicated HSM) support automated rotation. Used by banks, governments, payment processors for high-security keys.",
      links: {
        docs: "https://en.wikipedia.org/wiki/Hardware_security_module",
      },
    },
    {
      id: "kubernetes-secrets-rotation",
      name: "Kubernetes Secrets Rotation",
      type: "platform",
      languages: ["any"],
      description:
        "Kubernetes Secrets with External Secrets Operator (ESO) for automated rotation. ESO syncs secrets from external sources (AWS Secrets Manager, Vault, Azure Key Vault). Rotation triggers pod restarts to load new secrets. Supports versioned secrets and gradual rollouts. Used in cloud-native applications for zero-downtime secret rotation.",
      links: {
        docs: "https://external-secrets.io/",
        github: "https://github.com/external-secrets/external-secrets",
      },
      codeSnippet: `# ExternalSecret with refresh interval (1 hour)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h  # Poll for rotation every hour
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: db-secret
  data:
    - secretKey: password
      remoteRef:
        key: prod/db/password`,
    },
  ],

  usedInSystems: [
    {
      systemId: "google-encryption",
      systemName: "Google Cloud Platform",
      howUsed:
        "Google rotates encryption keys for all cloud services every 90 days to comply with internal security policies and customer compliance requirements. Default encryption keys (Google-managed) rotate automatically—BigQuery, Cloud Storage, Compute Engine disks all use 90-day rotation. Customer-managed keys (CMEK) support configurable rotation (90 days minimum). Google retains previous key versions indefinitely for decryption of historical data. Envelope encryption used throughout—data encrypted with data encryption keys (DEKs), DEKs encrypted with key encryption keys (KEKs), KEKs rotated every 90 days. Re-encryption happens lazily on read/write operations. Pattern composition: Key Rotation + Envelope Encryption + Automatic Rotation + Multi-Version Keys. Rationale: 90-day rotation limits blast radius of key compromise to single quarter of data. Google processes 100PB+ of customer data—manual rotation impossible at this scale, automation critical. Compliance: Meets HIPAA, PCI DSS, FedRAMP requirements for cryptographic key management. Impact: Zero customer-visible downtime during rotations despite billions of encrypted objects; all data remains accessible across rotations; compliance evidence via Cloud Audit Logs showing rotation cadence.",
      source: "https://cloud.google.com/kms/docs/key-rotation",
    },
    {
      systemId: "aws-kms-customers",
      systemName: "AWS Customer Workloads",
      howUsed:
        "AWS KMS enables automatic key rotation for millions of customer workloads. When enabled, KMS rotates Customer Master Keys (CMKs) every 365 days—generates new backing key material while retaining old keys for decryption. Transparent to applications—same key ID works before and after rotation. Used by AWS services (RDS, S3, EBS) and customer applications via SDK. RDS encrypts database snapshots with KMS keys—rotation ensures snapshots from 2020 use different keys than 2024. S3 server-side encryption (SSE-KMS) encrypts objects with DEKs, DEKs encrypted with KMS CMKs—rotation only affects DEKs (kilobytes), not objects (terabytes). EBS volume encryption uses KMS for volume keys—rotation happens without re-encrypting entire volumes. Pattern composition: KMS Rotation + Envelope Encryption + CloudTrail Audit Logging + IAM Access Control. Rationale: Manual rotation doesn't scale to millions of keys across thousands of AWS accounts. Automatic rotation eliminates human error (forgotten rotations). Compliance: Satisfies PCI DSS 3.6.4 (cryptographic key rotation), HIPAA, GDPR requirements. Impact: Millions of keys rotated annually with zero customer intervention; CloudTrail audit logs provide compliance evidence; no data loss or accessibility issues across rotations.",
      source:
        "https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html",
    },
    {
      systemId: "github-jwt",
      systemName: "GitHub OAuth and API",
      howUsed:
        "GitHub rotates JWT signing keys for OAuth access tokens and GitHub Apps every 90 days to reduce compromise blast radius and satisfy compliance requirements. JWT tokens include kid (key ID) in header, pointing to specific key version in JWKS endpoint (https://token.actions.githubusercontent.com/.well-known/jwks). When rotation occurs, new key added to JWKS, old key retained for 7-day overlap period. Tokens signed with old key remain valid during overlap. After overlap, old key removed from JWKS—tokens signed with old key now invalid (force refresh). GitHub Actions uses OIDC JWTs for cloud provider authentication (AWS, Azure, GCP)—tokens include workflow identity claims. Rotation ensures stolen tokens from Q1 can't be used in Q4. Pattern composition: JWT Key Rotation + JWKS + RS256 + Overlap Period + OIDC. Rationale: GitHub has 100M+ users and millions of OAuth apps—compromise of single signing key could affect millions. 90-day rotation limits exposure window. Compliance: Internal security policy aligned with PCI DSS recommendations. Impact: Seamless rotation for 100M+ users with zero downtime; JWKS caching (1 hour TTL) across distributed infrastructure; enables secure, keyless deployments for GitHub Actions (no long-lived secrets).",
      source:
        "https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect",
    },
    {
      systemId: "1password",
      systemName: "1Password Password Manager",
      howUsed:
        "1Password rotates account encryption keys quarterly (90 days) to limit the blast radius of master password compromise. User vaults encrypted with account key (derived from master password) + secret key. Account key rotation triggers re-encryption of all vault items with new key—background job processes vaults in batches to avoid I/O spikes. Old account keys retained for 30 days to support offline clients (mobile apps not yet synced). Multi-device synchronization challenge—rotation must propagate to all devices (web, desktop, mobile, browser extensions). Solution: Server-side rotation with versioned keys; clients fetch latest key on sync. If client offline during rotation, old key still works for decryption (read); encryption (write) forces sync to get new key. Pattern composition: Key Rotation + Envelope Encryption + Multi-Device Sync + Background Re-encryption. Rationale: 1Password stores sensitive credentials for millions of users—long-lived keys increase risk. Quarterly rotation (90 days) balances security (short rotation window) with operational complexity (re-encryption load). Compliance: SOC 2 Type II, ISO 27001 require documented key lifecycle management. Impact: Zero user-visible impact during rotation; all devices remain functional across rotations; re-encryption completes within 24 hours for most users; compliance evidence via audit logs.",
      source: "https://1password.com/security/",
    },
    {
      systemId: "stripe-webhooks",
      systemName: "Stripe Payment Platform",
      howUsed:
        "Stripe rotates webhook signing keys every 30 days to comply with PCI DSS requirements for payment processors. Webhook events signed with HMAC using secret signing key. Merchants verify signatures using key from Stripe dashboard. Rotation involves generating new key, adding to dashboard, keeping old key active for 24-hour overlap. After overlap, old key marked as inactive. Merchants must update webhook endpoints to use new key within overlap period. Stripe sends rotation warnings 7 days before rotation. If merchant misses rotation, webhooks fail signature verification (alerts triggered). Asymmetric rotation (HMAC) simpler than symmetric (RSA) for webhooks—no public key distribution needed. Pattern composition: HMAC Key Rotation + Overlap Period + Merchant Notifications + Compliance Automation. Rationale: PCI DSS mandates 90-day rotation for keys protecting cardholder data. Stripe uses 30-day rotation (more aggressive) to reduce compromise window. Webhook signatures prevent attackers from forging payment notifications. Impact: Processes $640B+ annually with 100k+ merchant webhook endpoints; 30-day rotation enforces cryptographic hygiene across ecosystem; PCI DSS compliance evidence via audit logs; prevents fraud by invalidating compromised keys quickly.",
      source: "https://stripe.com/docs/webhooks/best-practices",
    },
  ],

  philosophy: {
    coreProblem:
      "Long-lived cryptographic keys create unbounded risk—a key compromised in 2024 exposes all data encrypted since 2018, violating the principle of temporal isolation and making compliance impossible",
    designPrinciple:
      "Limit each key's operational lifetime and data volume through periodic rotation, creating temporal boundaries where compromising today's key doesn't expose yesterday's data",
    historicalContext:
      "Key rotation emerged from military cryptography (WWII codebooks changed daily) and evolved into compliance requirements (PCI DSS 2004). Cloud KMS services (AWS 2014, Azure 2015, Google 2017) automated rotation, making it practical at scale. NIST SP 800-57 (2005-2020) formalized rotation guidelines based on cryptanalysis advances.",
    alternativesRejected: [
      "Single long-lived key - compromise exposes all historical data, violates compliance (PCI DSS, HIPAA)",
      "Destroy old keys immediately after rotation - breaks decryption of existing data, causes data loss",
      "Manual rotation only - doesn't scale (1000s of keys), human error leads to forgotten rotations and compliance violations",
      "Re-encrypt all data immediately - I/O spike causes downtime (10TB database = days), not practical for large datasets",
    ],
    mentalModel:
      "Key rotation is like changing door locks in an apartment building. Current lock (active key) opens today's doors. Old locks (retired keys) still open apartments rented before the change—no one gets locked out. After lease expires (grace period), old locks removed. Rotation limits damage from stolen keys—thief with January's key can't open April's apartments.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Day 0: Initial State"
        A1[Key v1: ACTIVE]
        A2[Data encrypted with v1]
    end

    subgraph "Day 90: Rotation"
        B1[Key v2: ACTIVE]
        B2[Key v1: RETIRED]
        B3[New data → v2]
        B4[Old data → v1]
    end

    subgraph "Day 97: Overlap Ends"
        C1[Key v2: ACTIVE]
        C2[Key v1: DESTROYED]
        C3[All data → v2]
    end

    A1 --> B1
    A1 --> B2
    B1 --> C1
    B2 --> C2

    style A1 fill:#90EE90
    style B1 fill:#90EE90
    style B2 fill:#FFD700
    style C1 fill:#90EE90
    style C2 fill:#FF6B6B`,
    realWorldAnalogy:
      "Key rotation is like rotating security guard shifts at a museum. Day shift guards (active key) protect current exhibits. When shifts rotate (key rotation), night guards take over (new active key), but day guards stay for handoff period (overlap). Old guards retain access cards for 1 week (grace period) to handle unfinished tasks. After handoff, old access cards deactivated (key destroyed). Rotation limits damage—compromised day guard card doesn't work at night.",
    useCases: [
      {
        domain: "Payment Processing",
        scenario:
          "PCI DSS-compliant payment processor encrypts cardholder data. Rotate encryption keys every 90 days per PCI DSS 3.6.4. Use AWS KMS automatic rotation with envelope encryption—re-encrypt DEKs only, not entire database.",
        patternRole:
          "Satisfies PCI DSS compliance, limits blast radius to 90 days of transactions",
        companies: ["Stripe", "Square", "PayPal"],
      },
      {
        domain: "Healthcare (HIPAA)",
        scenario:
          "Electronic Health Records (EHR) system encrypts patient PHI. Rotate keys annually per HIPAA security rule. Use envelope encryption to avoid re-encrypting 100TB medical imaging data—only re-encrypt DEKs.",
        patternRole:
          "HIPAA compliance, reduces re-encryption overhead from terabytes to kilobytes",
        companies: ["Epic Systems", "Cerner", "Athenahealth"],
      },
      {
        domain: "OAuth/JWT Systems",
        scenario:
          "SaaS platform uses JWT for authentication. Rotate RS256 signing keys every 90 days. Expose JWKS endpoint with all active keys. Gradual transition with 7-day overlap period ensures in-flight tokens remain valid.",
        patternRole:
          "Reduces compromise blast radius for authentication tokens, enables zero-downtime rotation",
        companies: ["GitHub", "Auth0", "Okta"],
      },
      {
        domain: "Cloud Storage",
        scenario:
          "S3-like object storage encrypts objects with server-side encryption. Rotate master keys yearly. Use envelope encryption—objects encrypted with DEKs, DEKs encrypted with master key. Rotate master = re-encrypt DEKs only.",
        patternRole:
          "Enables key rotation for petabyte-scale storage without re-encrypting objects",
        companies: ["AWS S3", "Google Cloud Storage", "Azure Blob Storage"],
      },
    ],
  },

  tags: [
    "security",
    "encryption",
    "key-management",
    "compliance",
    "pci-dss",
    "hipaa",
    "zero-downtime",
    "envelope-encryption",
    "jwt",
    "kms",
    "rotation",
  ],
  difficulty: "advanced",
};
