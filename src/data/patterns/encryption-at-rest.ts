import type { Pattern } from "../schema";

export const encryptionAtRest: Pattern = {
  id: "encryption-at-rest",
  slug: "encryption-at-rest",
  corpusPath: "🔒 SECURITY → 🔐 Encryption → 💾 Encryption at Rest",

  hierarchy: {
    quality: "security",
    strategy: "Data Protection",
    family: "Encryption",
    level: 4,
  },

  concept: {
    name: "Encryption at Rest",
    emoji: "💾",
    tagline: "Protecting data when it sleeps",
    definition:
      "Encryption at Rest is a security pattern that protects stored data by encrypting it on disk, in databases, or in any persistent storage medium. Using strong cryptographic algorithms like AES-256, it transforms readable plaintext data into ciphertext that is computationally infeasible to decrypt without the proper encryption keys. The pattern encompasses multiple layers: full-disk encryption, database-level transparent data encryption (TDE), application-level field encryption, and file system encryption. Key management is the critical component—encryption keys must be stored separately from encrypted data, often in dedicated Key Management Services (KMS) or Hardware Security Modules (HSM). The pattern addresses compliance requirements from regulations like GDPR, HIPAA, PCI DSS, and SOC 2, which mandate encryption of sensitive data. Modern implementations support transparent encryption where applications read and write data normally while encryption/decryption happens automatically at the storage layer. Envelope encryption patterns are common, using data encryption keys (DEK) to encrypt data and key encryption keys (KEK) to encrypt the DEKs, enabling efficient key rotation without re-encrypting all data.",
    problemSolved:
      "Data breaches from physical theft, unauthorized cloud provider access, and insider threats expose organizations to massive financial and reputational damage. When storage devices are stolen, improperly disposed of, or accessed by unauthorized personnel, unencrypted data is immediately readable. Cloud environments introduce risks where infrastructure administrators could potentially access customer data stored on their systems. Regulatory frameworks impose strict penalties for exposing sensitive data—GDPR fines reach €20M or 4% of global revenue, HIPAA violations cost up to $1.5M per incident. The pattern solves this by ensuring that even if attackers gain physical access to storage media or database files, the data remains cryptographically protected. Encryption at rest also addresses compliance audit requirements by providing cryptographic proof that sensitive data is protected. Additionally, it mitigates risks from backup tapes, database dumps, and log files that might be stored in less secure locations.",
    tradeoffs: {
      pros: [
        "Compliance adherence - meets GDPR, HIPAA, PCI DSS requirements",
        "Data breach mitigation - stolen storage devices contain only encrypted data",
        "Defense in depth - additional security layer beyond access controls",
        "Cloud security - protects against cloud provider access",
        "Audit trail - cryptographic proof of data protection",
      ],
      cons: [
        "Key management complexity - losing keys means permanent data loss",
        "Performance overhead - encryption/decryption adds I/O latency",
        "Key rotation challenges - rotating keys may require re-encrypting large datasets",
        "Backup encryption - encrypted backups require secure key storage",
        "Recovery complexity - disaster recovery requires both data and keys",
      ],
    },
    relatedPatterns: [
      "tls-ssl",
      "envelope-encryption",
      "key-rotation",
      "jwt",
      "e2e-encryption",
      "backup-restore",
      "access-control",
    ],
  },

  structure: {
    participants: [
      {
        name: "Encryption Engine",
        role: "Cryptographic Processor",
        responsibilities: [
          "Encrypt plaintext data using encryption keys",
          "Decrypt ciphertext when authorized reads occur",
          "Apply cryptographic algorithms (AES-256, ChaCha20)",
        ],
      },
      {
        name: "Key Management Service",
        role: "Key Custodian",
        responsibilities: [
          "Generate and store encryption keys securely",
          "Provide keys to authorized encryption engines",
          "Rotate keys according to security policies",
          "Audit all key access operations",
        ],
      },
      {
        name: "Data Store",
        role: "Persistent Storage",
        responsibilities: [
          "Store encrypted data on disk or in database",
          "Never store plaintext sensitive data",
          "Persist data in encrypted form at all times",
        ],
      },
      {
        name: "Application Layer",
        role: "Data Consumer",
        responsibilities: [
          "Request data encryption/decryption operations",
          "Handle plaintext data only in memory",
          "Manage field-level encryption policies",
        ],
      },
      {
        name: "Access Control System",
        role: "Authorization Gateway",
        responsibilities: [
          "Validate permissions before granting key access",
          "Enforce least-privilege key access policies",
          "Log all encryption/decryption requests",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant KMS as Key Management Service
    participant Enc as Encryption Engine
    participant Store as Data Store

    Note over App,Store: Write Operation (Encrypt)
    App->>KMS: Request Data Encryption Key
    KMS->>KMS: Verify permissions
    KMS-->>App: Return DEK (encrypted with KEK)
    App->>Enc: Encrypt(plaintext, DEK)
    Enc->>Enc: AES-256-GCM encryption
    Enc-->>App: Return ciphertext
    App->>Store: Write encrypted data
    Store->>Store: Persist ciphertext to disk

    Note over App,Store: Read Operation (Decrypt)
    App->>Store: Read encrypted data
    Store-->>App: Return ciphertext
    App->>KMS: Request DEK for decryption
    KMS->>KMS: Verify permissions
    KMS-->>App: Return DEK
    App->>Enc: Decrypt(ciphertext, DEK)
    Enc-->>App: Return plaintext
    Note over App: Process plaintext in memory only`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Initiate Write",
        description: "Application needs to persist sensitive data",
      },
      {
        step: 2,
        actor: "Application",
        action: "Request Encryption Key",
        description:
          "Request Data Encryption Key (DEK) from Key Management Service",
      },
      {
        step: 3,
        actor: "KMS",
        action: "Validate Permissions",
        description: "Verify application has authorization to encrypt data",
      },
      {
        step: 4,
        actor: "KMS",
        action: "Provide DEK",
        description:
          "Return DEK encrypted with Key Encryption Key (KEK) for envelope encryption",
      },
      {
        step: 5,
        actor: "Encryption Engine",
        action: "Encrypt Data",
        description:
          "Transform plaintext to ciphertext using AES-256-GCM with DEK",
      },
      {
        step: 6,
        actor: "Data Store",
        action: "Persist Ciphertext",
        description: "Write encrypted data to disk/database",
      },
      {
        step: 7,
        actor: "Application",
        action: "Initiate Read",
        description: "Application needs to retrieve encrypted data",
      },
      {
        step: 8,
        actor: "Data Store",
        action: "Return Ciphertext",
        description: "Read encrypted data from storage",
      },
      {
        step: 9,
        actor: "KMS",
        action: "Provide DEK for Decryption",
        description: "Return decrypted DEK after authorization check",
      },
      {
        step: 10,
        actor: "Encryption Engine",
        action: "Decrypt Data",
        description: "Transform ciphertext back to plaintext using DEK",
      },
      {
        step: 11,
        actor: "Application",
        action: "Process Plaintext",
        description: "Use plaintext data in memory only, never persist",
      },
    ],
    invariants: [
      "Encryption keys must never be stored alongside encrypted data",
      "All sensitive data must be encrypted before persisting to storage",
      "Key rotation must not require re-encrypting data (use envelope encryption)",
      "All key access operations must be logged for audit trails",
      "Plaintext data must only exist in application memory, never on disk",
      "Encryption algorithms must meet compliance standards (AES-256 minimum)",
      "Key Management Service must be separate from data storage infrastructure",
    ],
  },

  codeExamples: [
    {
      id: "ear-typescript-mongodb-csfle",
      language: "typescript",
      title: "MongoDB Client-Side Field Level Encryption (CSFLE)",
      description:
        "Production-grade field-level encryption with AWS KMS integration for MongoDB",
      code: `import { MongoClient, ClientEncryption } from 'mongodb';
import { KMSClient, CreateKeyCommand, EncryptCommand } from '@aws-sdk/client-kms';

/**
 * MongoDB Client-Side Field Level Encryption with AWS KMS
 *
 * This implementation demonstrates:
 * - Automatic encryption/decryption of sensitive fields
 * - AWS KMS integration for key management
 * - Deterministic vs random encryption strategies
 * - Queryable encrypted fields
 */

interface UserDocument {
  _id: string;
  username: string;
  email: string;          // Deterministically encrypted - queryable
  ssn: string;            // Randomly encrypted - not queryable
  creditCard: string;     // Randomly encrypted - maximum security
  createdAt: Date;
}

interface EncryptionConfig {
  kmsProvider: 'aws';
  awsRegion: string;
  awsKeyArn: string;
  keyVaultNamespace: string;
  keyAltName: string;
}

class MongoDBEncryptionService {
  private client: MongoClient;
  private encryptedClient: MongoClient;
  private clientEncryption: ClientEncryption;
  private dataKeyId: any;

  constructor(
    private mongoUri: string,
    private config: EncryptionConfig
  ) {}

  /**
   * Initialize MongoDB with CSFLE enabled
   *
   * ACTION: Configure KMS provider and encryption schema
   * REASON: CSFLE requires KMS integration to manage data encryption keys
   *         AWS KMS stores the master key, MongoDB stores encrypted data keys
   *         This separation ensures cloud provider can't decrypt customer data
   */
  async initialize(): Promise<void> {
    // Regular client for key vault operations
    this.client = new MongoClient(this.mongoUri);
    await this.client.connect();

    // Create data encryption key in AWS KMS if not exists
    await this.ensureDataEncryptionKey();

    // Configure KMS provider credentials
    const kmsProviders = {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    };

    // Define encryption schema for automatic field-level encryption
    const schemaMap = {
      'myapp.users': {
        bsonType: 'object',
        encryptMetadata: {
          keyId: [this.dataKeyId],
        },
        properties: {
          email: {
            encrypt: {
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
              // Deterministic encryption allows equality queries
              // Same plaintext always produces same ciphertext
            },
          },
          ssn: {
            encrypt: {
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
              // Random encryption: same plaintext produces different ciphertext
              // Maximum security but not queryable
            },
          },
          creditCard: {
            encrypt: {
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
            },
          },
        },
      },
    };

    /**
     * ACTION: Create encrypted MongoDB client with automatic encryption
     * REASON: Automatic encryption transparently encrypts fields on write
     *         and decrypts on read without application code changes
     *         Database never sees plaintext for encrypted fields
     */
    this.encryptedClient = new MongoClient(this.mongoUri, {
      autoEncryption: {
        keyVaultNamespace: this.config.keyVaultNamespace,
        kmsProviders,
        schemaMap,
        // Disable mongocryptd (use shared library instead)
        extraOptions: {
          cryptSharedLibPath: '/usr/local/lib/mongo_crypt_v1.so',
        },
      },
    });

    await this.encryptedClient.connect();

    // Create ClientEncryption for manual encryption operations
    this.clientEncryption = new ClientEncryption(this.client, {
      keyVaultNamespace: this.config.keyVaultNamespace,
      kmsProviders,
    });

    console.log('MongoDB CSFLE initialized with AWS KMS integration');
  }

  /**
   * ACTION: Create and store data encryption key in AWS KMS
   * REASON: Envelope encryption pattern - DEK encrypts data, KEK encrypts DEK
   *         This enables key rotation without re-encrypting all data
   *         AWS KMS stores the master key, MongoDB stores encrypted DEK
   */
  private async ensureDataEncryptionKey(): Promise<void> {
    const keyVault = this.client
      .db(this.config.keyVaultNamespace.split('.')[0])
      .collection(this.config.keyVaultNamespace.split('.')[1]);

    // Check if key already exists
    const existingKey = await keyVault.findOne({
      keyAltNames: this.config.keyAltName,
    });

    if (existingKey) {
      this.dataKeyId = existingKey._id;
      console.log('Using existing data encryption key');
      return;
    }

    // Create new data encryption key in AWS KMS
    const kmsClient = new KMSClient({ region: this.config.awsRegion });

    // Generate data key encrypted by AWS KMS master key
    const keyCommand = new CreateKeyCommand({
      KeyUsage: 'ENCRYPT_DECRYPT',
      Origin: 'AWS_KMS',
    });

    const kmsProviders = {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    };

    // Create data encryption key using temporary ClientEncryption
    const tempClientEncryption = new ClientEncryption(this.client, {
      keyVaultNamespace: this.config.keyVaultNamespace,
      kmsProviders,
    });

    this.dataKeyId = await tempClientEncryption.createDataKey('aws', {
      masterKey: {
        region: this.config.awsRegion,
        key: this.config.awsKeyArn,
      },
      keyAltNames: [this.config.keyAltName],
    });

    console.log('Created new data encryption key:', this.dataKeyId);
  }

  /**
   * ACTION: Insert user with automatic field encryption
   * REASON: Email is deterministically encrypted (queryable), SSN and credit card
   *         are randomly encrypted (maximum security). Database only sees ciphertext.
   *
   * CONTEXT DILATION: Data breach impact
   * If database is compromised, attackers see only encrypted fields. Without
   * access to AWS KMS master key, data is cryptographically protected.
   * This reduces breach impact by 95%+ - stolen database is useless without keys.
   */
  async createUser(user: Omit<UserDocument, '_id'>): Promise<string> {
    const db = this.encryptedClient.db('myapp');
    const users = db.collection<UserDocument>('users');

    const result = await users.insertOne({
      _id: crypto.randomUUID(),
      ...user,
      createdAt: new Date(),
    });

    console.log('User created with encrypted sensitive fields');
    return result.insertedId.toString();
  }

  /**
   * ACTION: Query users by email using deterministic encryption
   * REASON: Deterministic encryption produces same ciphertext for same plaintext,
   *         enabling equality queries while maintaining encryption at rest
   *         MongoDB driver automatically encrypts query predicates
   */
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const db = this.encryptedClient.db('myapp');
    const users = db.collection<UserDocument>('users');

    // Driver automatically encrypts email in query predicate
    const user = await users.findOne({ email });

    if (user) {
      console.log('User found - sensitive fields automatically decrypted');
      // SSN and creditCard are automatically decrypted here
    }

    return user;
  }

  /**
   * ACTION: Manual encryption for ad-hoc data
   * REASON: Sometimes need explicit control over encryption without schema
   *         Useful for encrypting data before sending to external systems
   */
  async manualEncrypt(plaintext: string, algorithm: 'Deterministic' | 'Random'): Promise<Buffer> {
    const encryptionAlgorithm = algorithm === 'Deterministic'
      ? 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
      : 'AEAD_AES_256_CBC_HMAC_SHA_512-Random';

    const encrypted = await this.clientEncryption.encrypt(plaintext, {
      algorithm: encryptionAlgorithm,
      keyAltName: this.config.keyAltName,
    });

    return encrypted;
  }

  /**
   * ACTION: Manual decryption
   * REASON: Decrypt manually encrypted values
   */
  async manualDecrypt(ciphertext: Buffer): Promise<any> {
    const decrypted = await this.clientEncryption.decrypt(ciphertext);
    return decrypted;
  }

  /**
   * ACTION: Rotate data encryption key
   * REASON: Security best practice - rotate keys periodically
   *         Envelope encryption allows rotation without re-encrypting data
   *         Only the DEK needs to be re-encrypted with new KEK
   */
  async rotateDataKey(): Promise<void> {
    // AWS KMS automatically rotates master keys annually
    // For immediate rotation, create new data key and re-encrypt fields
    console.log('Initiating key rotation...');

    const newDataKeyId = await this.clientEncryption.createDataKey('aws', {
      masterKey: {
        region: this.config.awsRegion,
        key: this.config.awsKeyArn,
      },
      keyAltNames: [\`\${this.config.keyAltName}-rotated-\${Date.now()}\`],
    });

    console.log('New data key created:', newDataKeyId);
    console.log('Update application schema to use new key for new documents');
    // Existing documents remain encrypted with old key
    // Gradually re-encrypt during normal update operations
  }

  async close(): Promise<void> {
    await this.encryptedClient.close();
    await this.client.close();
  }
}

// Usage Example
async function main() {
  const encryptionService = new MongoDBEncryptionService(
    'mongodb://localhost:27017',
    {
      kmsProvider: 'aws',
      awsRegion: 'us-east-1',
      awsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/abc-def-ghi',
      keyVaultNamespace: 'encryption.__keyVault',
      keyAltName: 'dataKey1',
    }
  );

  await encryptionService.initialize();

  // Create user - email, SSN, credit card automatically encrypted
  const userId = await encryptionService.createUser({
    username: 'john.doe',
    email: 'john.doe@example.com',      // Deterministically encrypted
    ssn: '123-45-6789',                 // Randomly encrypted
    creditCard: '4532-1234-5678-9010',  // Randomly encrypted
  });

  // Query by email - works because deterministic encryption
  const user = await encryptionService.findUserByEmail('john.doe@example.com');
  console.log('Retrieved user:', user?.username);
  // SSN and creditCard are automatically decrypted

  // Cannot query by SSN (random encryption)
  // This would NOT work: users.findOne({ ssn: '123-45-6789' })

  await encryptionService.close();
}

export { MongoDBEncryptionService };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete MongoDB CSFLE implementation with AWS KMS integration, automatic encryption/decryption, and envelope encryption pattern",
        prerequisites: [
          "MongoDB 4.2+",
          "AWS KMS",
          "MongoDB driver 4.0+",
          "Envelope encryption pattern",
          "Understanding of deterministic vs random encryption",
        ],
        systemPosition:
          "Data layer with transparent encryption, integrated with cloud KMS for enterprise key management",
      },
      annotations: [
        {
          id: "ear-mongo-kms-config",
          lines: [48, 54],
          action: "Configure AWS KMS provider for master key storage",
          reason:
            "Separation of key storage (AWS KMS) from data storage (MongoDB) ensures cloud provider cannot access plaintext data - zero-knowledge architecture",
          contextLevel: "system",
          relatedConcepts: ["envelope-encryption", "key-management"],
        },
        {
          id: "ear-mongo-schema-map",
          lines: [56, 89],
          action:
            "Define encryption schema with deterministic and random algorithms",
          reason:
            "Deterministic encryption enables equality queries (email lookups) while random encryption provides maximum security for non-queryable fields (SSN, credit cards)",
          contextLevel: "module",
          relatedConcepts: ["field-level-encryption", "queryable-encryption"],
        },
        {
          id: "ear-mongo-auto-encryption",
          lines: [91, 107],
          action: "Create MongoDB client with autoEncryption enabled",
          reason:
            "Automatic encryption transparently encrypts on write and decrypts on read without application code changes - database never sees plaintext",
          contextLevel: "system",
          relatedConcepts: ["transparent-encryption"],
        },
        {
          id: "ear-mongo-envelope-encryption",
          lines: [118, 127],
          action: "Implement envelope encryption pattern with DEK and KEK",
          reason:
            "Data Encryption Key (DEK) encrypts data, Key Encryption Key (KEK) in AWS KMS encrypts DEK - enables key rotation without re-encrypting all data",
          contextLevel: "system",
          relatedConcepts: ["envelope-encryption", "key-rotation"],
        },
        {
          id: "ear-mongo-deterministic-query",
          lines: [201, 212],
          action: "Query encrypted email field using deterministic encryption",
          reason:
            "Deterministic encryption produces same ciphertext for same plaintext, enabling equality queries while data remains encrypted at rest",
          contextLevel: "module",
          relatedConcepts: ["queryable-encryption"],
        },
        {
          id: "ear-mongo-key-rotation",
          lines: [244, 263],
          action: "Rotate encryption keys using envelope encryption",
          reason:
            "Periodic key rotation is security best practice - envelope encryption allows creating new DEK without re-encrypting all data immediately",
          contextLevel: "system",
          relatedConcepts: ["key-rotation", "security-lifecycle"],
        },
        {
          id: "ear-mongo-data-breach",
          lines: [181, 188],
          action: "Insert user with automatic encryption of sensitive fields",
          reason:
            "Even if database is compromised, attackers only see ciphertext - without AWS KMS master key access, data is cryptographically protected",
          contextLevel: "system",
          relatedConcepts: ["data-breach-mitigation", "defense-in-depth"],
        },
        {
          id: "ear-mongo-compliance",
          lines: [56, 89],
          action: "Configure AES-256 encryption algorithms for compliance",
          reason:
            "AEAD_AES_256_CBC_HMAC_SHA_512 meets GDPR, HIPAA, PCI DSS requirements for encryption at rest - provides authenticated encryption with associated data",
          contextLevel: "system",
          relatedConcepts: ["compliance", "regulatory-requirements"],
        },
      ],
      highlights: [
        {
          lines: [48, 107],
          label: "CSFLE configuration with KMS integration",
          sbvpDomain: "structure",
        },
        {
          lines: [118, 162],
          label: "Envelope encryption key management",
          sbvpDomain: "behavior",
        },
        {
          lines: [181, 198],
          label: "Automatic encryption on write operations",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "ear-python-sqlalchemy-sqlcipher",
      language: "python",
      title: "Python SQLAlchemy with SQLCipher and Envelope Encryption",
      description:
        "Application-level encryption with SQLCipher for SQLite databases and envelope encryption pattern",
      code: `"""
SQLAlchemy with SQLCipher Encryption and Envelope Encryption Pattern

This implementation demonstrates:
- SQLite database encryption with SQLCipher
- Application-level field encryption with Fernet (symmetric encryption)
- Envelope encryption (DEK + KEK pattern)
- Key rotation strategy
- HIPAA compliance for healthcare applications
"""

from sqlalchemy import create_engine, Column, String, Integer, LargeBinary, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64
import os
import json
from datetime import datetime
from typing import Optional, Dict

Base = declarative_base()


class PatientRecord(Base):
    """
    Patient medical record with encrypted PII/PHI fields

    ACTION: Store encrypted healthcare data for HIPAA compliance
    REASON: HIPAA requires encryption of Protected Health Information (PHI)
            Both at rest and in transit - this pattern enables healthcare
            application certification and protects patient privacy
    """
    __tablename__ = 'patient_records'

    id = Column(Integer, primary_key=True)
    patient_id = Column(String(50), unique=True, nullable=False)

    # Encrypted fields (stored as binary ciphertext)
    encrypted_name = Column(LargeBinary, nullable=False)
    encrypted_ssn = Column(LargeBinary, nullable=False)
    encrypted_diagnosis = Column(LargeBinary, nullable=False)
    encrypted_medications = Column(LargeBinary, nullable=False)

    # Metadata (not encrypted)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    key_version = Column(Integer, default=1)  # Track which key encrypted this record


class EnvelopeEncryptionService:
    """
    Implements envelope encryption pattern for secure key management

    ACTION: Use two-tier key hierarchy (DEK + KEK)
    REASON: Data Encryption Key (DEK) encrypts data, Key Encryption Key (KEK)
            encrypts DEK. This enables key rotation without re-encrypting all data.
            KEK stored in secure location (HSM, KMS), DEK stored with data.
    """

    def __init__(self, master_key_path: str):
        self.master_key_path = master_key_path
        self.kek = self._load_or_create_kek()
        self.dek_cache: Dict[int, bytes] = {}

    def _load_or_create_kek(self) -> bytes:
        """
        ACTION: Load or generate Key Encryption Key (master key)
        REASON: KEK is the root of trust - must be stored securely
                In production, use AWS KMS, Azure Key Vault, or HSM
                For this example, using file-based storage with proper permissions
        """
        if os.path.exists(self.master_key_path):
            with open(self.master_key_path, 'rb') as f:
                return f.read()
        else:
            # Generate new KEK
            kek = Fernet.generate_key()

            # Write with restrictive permissions (0600 - owner read/write only)
            os.makedirs(os.path.dirname(self.master_key_path), exist_ok=True)
            with open(self.master_key_path, 'wb') as f:
                f.write(kek)
            os.chmod(self.master_key_path, 0o600)

            return kek

    def create_data_encryption_key(self, version: int) -> bytes:
        """
        ACTION: Generate new Data Encryption Key and encrypt with KEK
        REASON: Each key version has separate DEK, enabling key rotation
                DEK is encrypted with KEK before storage (envelope encryption)
        """
        # Generate random DEK
        dek = Fernet.generate_key()

        # Cache for this session
        self.dek_cache[version] = dek

        return dek

    def get_encrypted_dek(self, version: int) -> bytes:
        """
        ACTION: Encrypt DEK with KEK for storage
        REASON: DEK must be stored encrypted - only KEK can decrypt it
                This allows storing encrypted DEK alongside encrypted data
        """
        if version not in self.dek_cache:
            raise ValueError(f"DEK version {version} not found in cache")

        dek = self.dek_cache[version]
        kek_cipher = Fernet(self.kek)
        encrypted_dek = kek_cipher.encrypt(dek)

        return encrypted_dek

    def decrypt_dek(self, encrypted_dek: bytes) -> bytes:
        """
        ACTION: Decrypt DEK using KEK
        REASON: Before encrypting/decrypting data, must unwrap DEK from KEK
                This is the core of envelope encryption pattern
        """
        kek_cipher = Fernet(self.kek)
        dek = kek_cipher.decrypt(encrypted_dek)
        return dek


class EncryptedDatabaseService:
    """
    Database service with SQLCipher encryption and field-level encryption

    CONTEXT DILATION: HIPAA Compliance
    Healthcare applications must encrypt Protected Health Information (PHI)
    at rest per HIPAA Security Rule §164.312(a)(2)(iv). This implementation
    provides dual-layer encryption: SQLCipher encrypts entire database file,
    application-level encryption protects specific fields. This defense-in-depth
    approach enables healthcare app certification and protects against both
    database file theft and insider threats.
    """

    def __init__(
        self,
        db_path: str,
        db_password: str,
        master_key_path: str
    ):
        self.db_path = db_path
        self.envelope_service = EnvelopeEncryptionService(master_key_path)
        self.current_key_version = 1

        # Initialize current DEK
        self.envelope_service.create_data_encryption_key(self.current_key_version)

        # Create SQLCipher encrypted database engine
        self.engine = self._create_encrypted_engine(db_password)

        # Create tables
        Base.metadata.create_all(self.engine)

        self.SessionLocal = sessionmaker(bind=self.engine)

    def _create_encrypted_engine(self, password: str):
        """
        ACTION: Create SQLAlchemy engine with SQLCipher encryption
        REASON: SQLCipher provides transparent database file encryption
                using AES-256. Entire database file is encrypted on disk.
                This protects against database file theft or improper disposal.
        """
        # SQLCipher connection string
        # PRAGMA statements configure encryption
        connection_string = f'sqlite:///{self.db_path}'

        engine = create_engine(
            connection_string,
            echo=False,
            connect_args={
                'check_same_thread': False
            }
        )

        # Set SQLCipher encryption key
        # In production, use key derivation from secure password
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            # Set encryption key (must be first pragma)
            cursor.execute(f"PRAGMA key = '{password}';")
            # Use modern SQLCipher version with AES-256
            cursor.execute("PRAGMA cipher_page_size = 4096;")
            cursor.execute("PRAGMA kdf_iter = 256000;")
            cursor.close()

        return engine

    def _encrypt_field(self, plaintext: str, key_version: int) -> bytes:
        """
        ACTION: Encrypt field value using Fernet symmetric encryption
        REASON: Application-level encryption provides defense-in-depth
                Even if database encryption is compromised, fields remain encrypted
                Fernet provides authenticated encryption (AES-128 CBC + HMAC)
        """
        # Get DEK for this key version
        dek = self.envelope_service.dek_cache.get(key_version)
        if not dek:
            raise ValueError(f"DEK version {key_version} not available")

        cipher = Fernet(dek)
        ciphertext = cipher.encrypt(plaintext.encode('utf-8'))
        return ciphertext

    def _decrypt_field(self, ciphertext: bytes, key_version: int) -> str:
        """
        ACTION: Decrypt field value using Fernet
        REASON: Retrieve plaintext for authorized application use
                Decryption happens in application memory only
        """
        # Get DEK for this key version
        dek = self.envelope_service.dek_cache.get(key_version)
        if not dek:
            # Load DEK from secure storage
            # In production, retrieve from KMS/HSM
            raise ValueError(f"DEK version {key_version} not available")

        cipher = Fernet(dek)
        plaintext = cipher.decrypt(ciphertext).decode('utf-8')
        return plaintext

    def create_patient_record(
        self,
        patient_id: str,
        name: str,
        ssn: str,
        diagnosis: str,
        medications: str
    ) -> int:
        """
        ACTION: Create patient record with encrypted PHI fields
        REASON: HIPAA requires encryption of name, SSN, diagnosis, medications
                Multi-layer encryption: SQLCipher (database) + Fernet (fields)
        """
        session = self.SessionLocal()

        try:
            record = PatientRecord(
                patient_id=patient_id,
                encrypted_name=self._encrypt_field(name, self.current_key_version),
                encrypted_ssn=self._encrypt_field(ssn, self.current_key_version),
                encrypted_diagnosis=self._encrypt_field(diagnosis, self.current_key_version),
                encrypted_medications=self._encrypt_field(medications, self.current_key_version),
                key_version=self.current_key_version
            )

            session.add(record)
            session.commit()

            print(f"Patient record created with dual-layer encryption (SQLCipher + Fernet)")
            return record.id

        finally:
            session.close()

    def get_patient_record(self, patient_id: str) -> Optional[Dict[str, str]]:
        """
        ACTION: Retrieve and decrypt patient record
        REASON: Authorized application access to PHI
                Decryption only in memory, never written to disk as plaintext
        """
        session = self.SessionLocal()

        try:
            record = session.query(PatientRecord).filter_by(
                patient_id=patient_id
            ).first()

            if not record:
                return None

            # Decrypt fields using appropriate key version
            decrypted = {
                'patient_id': record.patient_id,
                'name': self._decrypt_field(record.encrypted_name, record.key_version),
                'ssn': self._decrypt_field(record.encrypted_ssn, record.key_version),
                'diagnosis': self._decrypt_field(record.encrypted_diagnosis, record.key_version),
                'medications': self._decrypt_field(record.encrypted_medications, record.key_version),
                'created_at': record.created_at.isoformat(),
            }

            return decrypted

        finally:
            session.close()

    def rotate_encryption_keys(self):
        """
        ACTION: Rotate encryption keys and re-encrypt data
        REASON: Security best practice - rotate keys annually or after breach
                Envelope encryption enables efficient rotation:
                1. Create new DEK (version N+1)
                2. Re-encrypt records with new DEK
                3. Old DEK remains available for existing encrypted data
        """
        session = self.SessionLocal()

        try:
            # Create new key version
            new_version = self.current_key_version + 1
            self.envelope_service.create_data_encryption_key(new_version)

            # Re-encrypt all records with new key
            records = session.query(PatientRecord).all()

            for record in records:
                # Decrypt with old key
                name = self._decrypt_field(record.encrypted_name, record.key_version)
                ssn = self._decrypt_field(record.encrypted_ssn, record.key_version)
                diagnosis = self._decrypt_field(record.encrypted_diagnosis, record.key_version)
                medications = self._decrypt_field(record.encrypted_medications, record.key_version)

                # Re-encrypt with new key
                record.encrypted_name = self._encrypt_field(name, new_version)
                record.encrypted_ssn = self._encrypt_field(ssn, new_version)
                record.encrypted_diagnosis = self._encrypt_field(diagnosis, new_version)
                record.encrypted_medications = self._encrypt_field(medications, new_version)
                record.key_version = new_version

            session.commit()
            self.current_key_version = new_version

            print(f"Rotated encryption keys to version {new_version}")
            print(f"Re-encrypted {len(records)} patient records")

        finally:
            session.close()


# Usage Example
def main():
    """
    Demonstrate HIPAA-compliant encryption at rest for healthcare application
    """
    db_service = EncryptedDatabaseService(
        db_path='./data/healthcare.db',
        db_password='secure-database-password-change-in-production',
        master_key_path='./keys/master.key'
    )

    # Create patient record (PHI automatically encrypted)
    patient_id = db_service.create_patient_record(
        patient_id='PT-2024-001',
        name='Jane Doe',
        ssn='123-45-6789',
        diagnosis='Type 2 Diabetes Mellitus',
        medications='Metformin 500mg BID, Lisinopril 10mg QD'
    )

    print(f"Created patient record ID: {patient_id}")

    # Retrieve patient record (automatic decryption)
    patient = db_service.get_patient_record('PT-2024-001')
    print(f"Retrieved patient: {patient['name']}")
    print(f"Diagnosis: {patient['diagnosis']}")

    # Demonstrate key rotation
    db_service.rotate_encryption_keys()

    # Verify record still accessible after rotation
    patient_after_rotation = db_service.get_patient_record('PT-2024-001')
    print(f"After key rotation: {patient_after_rotation['name']}")


if __name__ == '__main__':
    main()`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete healthcare database encryption with SQLCipher, application-level field encryption, envelope encryption pattern, and key rotation",
        prerequisites: [
          "SQLAlchemy ORM",
          "SQLCipher",
          "Cryptography library (Fernet)",
          "HIPAA compliance requirements",
          "Envelope encryption pattern",
        ],
        systemPosition:
          "Data persistence layer for healthcare application with HIPAA-compliant encryption at rest, dual-layer security (database + field encryption)",
      },
      annotations: [
        {
          id: "ear-py-sqlcipher",
          lines: [155, 173],
          action:
            "Configure SQLCipher with AES-256 encryption for SQLite database",
          reason:
            "SQLCipher provides transparent full-database encryption, protecting entire database file on disk - critical for HIPAA compliance and protecting against database file theft",
          contextLevel: "system",
          relatedConcepts: ["transparent-encryption", "database-encryption"],
        },
        {
          id: "ear-py-envelope",
          lines: [59, 72],
          action: "Implement envelope encryption with KEK and DEK separation",
          reason:
            "Two-tier key hierarchy: KEK (master key) encrypts DEK (data key), DEK encrypts actual data - enables key rotation without re-encrypting all data",
          contextLevel: "system",
          relatedConcepts: ["envelope-encryption", "key-hierarchy"],
        },
        {
          id: "ear-py-fernet",
          lines: [176, 188],
          action: "Encrypt field values using Fernet symmetric encryption",
          reason:
            "Application-level encryption provides defense-in-depth - even if database encryption is compromised, individual fields remain encrypted with separate keys",
          contextLevel: "module",
          relatedConcepts: ["field-level-encryption", "defense-in-depth"],
        },
        {
          id: "ear-py-hipaa",
          lines: [27, 38],
          action: "Define patient record model with encrypted PHI fields",
          reason:
            "HIPAA Security Rule §164.312(a)(2)(iv) requires encryption of Protected Health Information (PHI) at rest - this implementation enables healthcare app certification",
          contextLevel: "system",
          relatedConcepts: ["compliance", "healthcare-regulations"],
        },
        {
          id: "ear-py-key-rotation",
          lines: [235, 268],
          action: "Rotate encryption keys and re-encrypt existing data",
          reason:
            "Security best practice - rotate keys annually or after suspected breach - envelope encryption tracks key versions for gradual migration",
          contextLevel: "system",
          relatedConcepts: ["key-rotation", "security-lifecycle"],
        },
        {
          id: "ear-py-key-version",
          lines: [48, 48],
          action: "Track key version for each encrypted record",
          reason:
            "Enables gradual key rotation - different records can be encrypted with different key versions, allowing non-disruptive key migration",
          contextLevel: "module",
          relatedConcepts: ["versioning", "backward-compatibility"],
        },
        {
          id: "ear-py-kek-storage",
          lines: [74, 88],
          action: "Store KEK with restrictive file permissions (0600)",
          reason:
            "KEK is root of trust - must be protected with OS-level permissions - in production, use HSM or cloud KMS instead of file storage",
          contextLevel: "system",
          relatedConcepts: ["key-management", "access-control"],
        },
        {
          id: "ear-py-memory-only",
          lines: [209, 227],
          action: "Decrypt PHI fields in memory only, never persist plaintext",
          reason:
            "Plaintext PHI must never touch disk - decryption happens in application memory for authorized processing only",
          contextLevel: "module",
          relatedConcepts: ["data-lifecycle", "security-boundaries"],
        },
      ],
      highlights: [
        {
          lines: [155, 173],
          label: "SQLCipher database encryption configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [59, 117],
          label: "Envelope encryption service (KEK + DEK)",
          sbvpDomain: "structure",
        },
        {
          lines: [196, 217],
          label: "Dual-layer encryption on write",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "ear-java-spring-rds-kms",
      language: "java",
      title: "Java Spring Boot with AWS RDS Encryption and S3 SSE-KMS",
      description:
        "Enterprise Spring Boot application with AWS RDS encryption, transparent data encryption, and S3 bucket encryption",
      code: `package com.example.security.encryption;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.kms.AWSKMS;
import com.amazonaws.services.kms.AWSKMSClientBuilder;
import com.amazonaws.services.kms.model.*;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.SSEAwsKeyManagementParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.persistence.*;
import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

/**
 * Enterprise Encryption at Rest with AWS RDS and S3
 *
 * This implementation demonstrates:
 * - AWS RDS encryption at rest with AWS KMS
 * - Transparent Data Encryption (TDE) for MySQL/PostgreSQL
 * - Application-level field encryption for PII
 * - S3 bucket encryption with SSE-KMS
 * - Zero-knowledge architecture (cloud provider cannot access plaintext)
 *
 * CONTEXT DILATION: Cloud Security
 * Encryption at rest in cloud environments ensures cloud provider (AWS)
 * cannot access your plaintext data. Even with physical access to storage
 * hardware or admin access to infrastructure, data remains cryptographically
 * protected. This enables zero-knowledge architecture where only your
 * application, holding the KMS keys, can decrypt data. Critical for
 * financial services, healthcare, and enterprises with strict data
 * sovereignty requirements.
 */

/**
 * JPA Entity with encrypted PII fields
 *
 * ACTION: Define customer entity with application-level encrypted fields
 * REASON: While RDS provides database-level encryption, application-level
 *         encryption of PII (email, SSN) provides defense-in-depth and
 *         ensures data is encrypted before leaving application boundary
 */
@Entity
@Table(name = "customers")
class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    private String name;

    /**
     * ACTION: Store email as encrypted binary
     * REASON: Email is PII under GDPR - application-level encryption
     *         ensures even database admins cannot see plaintext emails
     */
    @Column(name = "encrypted_email", columnDefinition = "BLOB")
    private byte[] encryptedEmail;

    /**
     * ACTION: Store SSN as encrypted binary
     * REASON: SSN is highly sensitive PII - must be encrypted at rest
     *         Application-level encryption provides defense-in-depth
     */
    @Column(name = "encrypted_ssn", columnDefinition = "BLOB")
    private byte[] encryptedSSN;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "encryption_key_id")
    private String encryptionKeyId;  // Track which KMS key encrypted this record

    // Getters and setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public byte[] getEncryptedEmail() { return encryptedEmail; }
    public void setEncryptedEmail(byte[] encryptedEmail) { this.encryptedEmail = encryptedEmail; }

    public byte[] getEncryptedSSN() { return encryptedSSN; }
    public void setEncryptedSSN(byte[] encryptedSSN) { this.encryptedSSN = encryptedSSN; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getEncryptionKeyId() { return encryptionKeyId; }
    public void setEncryptionKeyId(String keyId) { this.encryptionKeyId = keyId; }
}

/**
 * AWS KMS Encryption Service
 *
 * ACTION: Integrate with AWS KMS for enterprise key management
 * REASON: AWS KMS provides FIPS 140-2 validated hardware security modules,
 *         automatic key rotation, audit logging, and fine-grained access control
 *         Separates key management from application, enabling zero-knowledge architecture
 */
@Service
class KMSEncryptionService {

    private final AWSKMS kmsClient;
    private final String kmsKeyId;

    public KMSEncryptionService(
        @Value("\${aws.kms.key-id}") String kmsKeyId,
        @Value("\${aws.region}") String region
    ) {
        this.kmsKeyId = kmsKeyId;
        this.kmsClient = AWSKMSClientBuilder.standard()
            .withRegion(region)
            .build();
    }

    /**
     * ACTION: Encrypt plaintext using AWS KMS
     * REASON: KMS performs encryption using HSM-backed keys
     *         Key never leaves AWS KMS - provides maximum security
     *         Generates unique ciphertext for each plaintext (includes IV)
     */
    public byte[] encrypt(String plaintext) {
        try {
            EncryptRequest encryptRequest = new EncryptRequest()
                .withKeyId(kmsKeyId)
                .withPlaintext(ByteBuffer.wrap(plaintext.getBytes(StandardCharsets.UTF_8)));

            EncryptResult result = kmsClient.encrypt(encryptRequest);

            // Return ciphertext blob
            byte[] ciphertext = new byte[result.getCiphertextBlob().remaining()];
            result.getCiphertextBlob().get(ciphertext);

            return ciphertext;

        } catch (Exception e) {
            throw new RuntimeException("KMS encryption failed", e);
        }
    }

    /**
     * ACTION: Decrypt ciphertext using AWS KMS
     * REASON: Only KMS can decrypt - application doesn't hold decryption keys
     *         KMS verifies IAM permissions before decrypting
     *         Audit log records every decryption operation
     */
    public String decrypt(byte[] ciphertext) {
        try {
            DecryptRequest decryptRequest = new DecryptRequest()
                .withCiphertextBlob(ByteBuffer.wrap(ciphertext));

            DecryptResult result = kmsClient.decrypt(decryptRequest);

            byte[] plaintext = new byte[result.getPlaintext().remaining()];
            result.getPlaintext().get(plaintext);

            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("KMS decryption failed", e);
        }
    }

    /**
     * ACTION: Generate data encryption key using envelope encryption
     * REASON: For encrypting large datasets, generate DEK from KMS
     *         KMS returns both plaintext and encrypted DEK
     *         Use plaintext DEK for encryption, store encrypted DEK with data
     */
    public GenerateDataKeyResult generateDataKey(int keySize) {
        GenerateDataKeyRequest request = new GenerateDataKeyRequest()
            .withKeyId(kmsKeyId)
            .withKeySpec(keySize == 256 ? "AES_256" : "AES_128");

        return kmsClient.generateDataKey(request);
    }

    /**
     * ACTION: Rotate KMS key
     * REASON: Security best practice - AWS KMS supports automatic annual rotation
     *         Old key versions remain available for decrypting existing data
     *         New encryptions use new key version automatically
     */
    public void enableAutomaticKeyRotation() {
        EnableKeyRotationRequest request = new EnableKeyRotationRequest()
            .withKeyId(kmsKeyId);

        kmsClient.enableKeyRotation(request);
        System.out.println("Enabled automatic key rotation for KMS key: " + kmsKeyId);
    }
}

/**
 * Customer Service with encrypted PII fields
 */
@Service
class CustomerService {

    private final CustomerRepository customerRepository;
    private final KMSEncryptionService kmsService;

    public CustomerService(
        CustomerRepository customerRepository,
        KMSEncryptionService kmsService
    ) {
        this.customerRepository = customerRepository;
        this.kmsService = kmsService;
    }

    /**
     * ACTION: Create customer with encrypted PII fields
     * REASON: Email and SSN are encrypted before database write
     *         Multi-layer encryption: Application (KMS) + RDS (TDE)
     *         Even if RDS encryption is bypassed, PII remains encrypted
     */
    public Customer createCustomer(
        String customerId,
        String name,
        String email,
        String ssn
    ) {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);
        customer.setName(name);

        // Encrypt PII fields with KMS
        customer.setEncryptedEmail(kmsService.encrypt(email));
        customer.setEncryptedSSN(kmsService.encrypt(ssn));
        customer.setCreatedAt(LocalDateTime.now());
        customer.setEncryptionKeyId(kmsService.kmsKeyId);

        Customer saved = customerRepository.save(customer);

        System.out.println("Customer created with KMS-encrypted PII fields");
        System.out.println("Database-level: RDS encryption with KMS");
        System.out.println("Application-level: Field encryption with KMS");

        return saved;
    }

    /**
     * ACTION: Retrieve customer and decrypt PII
     * REASON: Decrypt PII in application memory for authorized use only
     *         KMS audit logs record decryption operations
     *         Plaintext never persists to disk
     */
    public CustomerDTO getCustomer(String customerId) {
        Optional<Customer> customerOpt = customerRepository.findByCustomerId(customerId);

        if (customerOpt.isEmpty()) {
            return null;
        }

        Customer customer = customerOpt.get();

        // Decrypt PII fields
        String email = kmsService.decrypt(customer.getEncryptedEmail());
        String ssn = kmsService.decrypt(customer.getEncryptedSSN());

        // Return DTO with decrypted values (in memory only)
        return new CustomerDTO(
            customer.getCustomerId(),
            customer.getName(),
            email,
            ssn,
            customer.getCreatedAt()
        );
    }
}

/**
 * S3 Encryption Service for encrypted file storage
 *
 * ACTION: Upload files to S3 with server-side encryption using KMS
 * REASON: S3 SSE-KMS encrypts objects at rest using KMS keys
 *         Provides encryption without application code changes
 *         KMS key policies control who can decrypt objects
 */
@Service
class S3EncryptionService {

    private final AmazonS3 s3Client;
    private final String bucketName;
    private final String kmsKeyId;

    public S3EncryptionService(
        @Value("\${aws.s3.bucket}") String bucketName,
        @Value("\${aws.kms.key-id}") String kmsKeyId,
        @Value("\${aws.region}") String region
    ) {
        this.bucketName = bucketName;
        this.kmsKeyId = kmsKeyId;
        this.s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(region)
            .build();
    }

    /**
     * ACTION: Upload file to S3 with SSE-KMS encryption
     * REASON: S3 encrypts object on server-side before writing to disk
     *         Each object encrypted with unique data key from KMS
     *         Zero-knowledge: AWS cannot decrypt without KMS key access
     */
    public void uploadEncryptedFile(String key, byte[] content, String contentType) {
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(content.length);
        metadata.setContentType(contentType);

        // Configure SSE-KMS encryption
        SSEAwsKeyManagementParams sseParams = new SSEAwsKeyManagementParams(kmsKeyId);

        PutObjectRequest putRequest = new PutObjectRequest(
            bucketName,
            key,
            new ByteArrayInputStream(content),
            metadata
        ).withSSEAwsKeyManagementParams(sseParams);

        s3Client.putObject(putRequest);

        System.out.println("Uploaded file to S3 with SSE-KMS encryption");
        System.out.println("KMS Key ID: " + kmsKeyId);
    }

    /**
     * ACTION: Configure S3 bucket default encryption
     * REASON: Enforce encryption at rest for all objects in bucket
     *         Prevents accidental unencrypted uploads
     *         Compliance requirement for storing sensitive data
     */
    public void enableBucketEncryption() {
        // Set default encryption configuration for bucket
        com.amazonaws.services.s3.model.ServerSideEncryptionConfiguration sseConfig =
            new com.amazonaws.services.s3.model.ServerSideEncryptionConfiguration()
                .withRules(
                    new com.amazonaws.services.s3.model.ServerSideEncryptionRule()
                        .withApplyServerSideEncryptionByDefault(
                            new com.amazonaws.services.s3.model.ServerSideEncryptionByDefault()
                                .withSSEAlgorithm(com.amazonaws.services.s3.model.SSEAlgorithm.KMS)
                                .withKMSMasterKeyID(kmsKeyId)
                        )
                        .withBucketKeyEnabled(true)  // Reduce KMS costs
                );

        s3Client.setBucketEncryption(
            new com.amazonaws.services.s3.model.SetBucketEncryptionRequest()
                .withBucketName(bucketName)
                .withServerSideEncryptionConfiguration(sseConfig)
        );

        System.out.println("Enabled default encryption for S3 bucket: " + bucketName);
    }
}

/**
 * RDS Encryption Configuration
 *
 * ACTION: Configure Spring Boot with RDS encrypted database
 * REASON: RDS encryption at rest uses AWS KMS to encrypt database volumes
 *         Transparent Data Encryption (TDE) - application code unchanged
 *         Encrypts database files, backups, snapshots, and read replicas
 */
@Configuration
@ConfigurationProperties(prefix = "spring.datasource")
class RDSEncryptionConfiguration {

    private String url;
    private String username;
    private String password;

    /**
     * ACTION: Configure DataSource for RDS encrypted database
     * REASON: Connection to RDS encrypted instance - encryption transparent
     *         RDS handles encryption/decryption at storage layer
     *         Application connects normally via TLS-encrypted connection
     *
     * RDS Encryption Features:
     * - AES-256 encryption at storage layer
     * - KMS key management with automatic rotation
     * - Encrypted backups and snapshots
     * - Encrypted read replicas
     * - CloudWatch logs encryption
     *
     * CONTEXT DILATION: Zero-Knowledge Architecture
     * With RDS encryption + application-level encryption + KMS key policies,
     * even AWS employees with physical access to hardware cannot decrypt data.
     * Your application holds the keys (via IAM), ensuring only authorized
     * code can access plaintext. This is critical for financial services
     * and healthcare where data sovereignty is required.
     */
    @Bean
    public javax.sql.DataSource dataSource() {
        // In production, use HikariCP for connection pooling
        com.zaxxer.hikari.HikariConfig config = new com.zaxxer.hikari.HikariConfig();

        // RDS endpoint for encrypted database instance
        // Must be created with encryption enabled (cannot enable after creation)
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);

        // Enable TLS for connection encryption (encryption in transit)
        config.addDataSourceProperty("useSSL", "true");
        config.addDataSourceProperty("requireSSL", "true");

        // Connection pool settings
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);

        return new com.zaxxer.hikari.HikariDataSource(config);
    }

    // Getters and setters for ConfigurationProperties
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

// Data Transfer Object
class CustomerDTO {
    private String customerId;
    private String name;
    private String email;
    private String ssn;
    private LocalDateTime createdAt;

    public CustomerDTO(
        String customerId,
        String name,
        String email,
        String ssn,
        LocalDateTime createdAt
    ) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.ssn = ssn;
        this.createdAt = createdAt;
    }

    // Getters...
    public String getCustomerId() { return customerId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getSSN() { return ssn; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

// Repository
@Repository
interface CustomerRepository extends org.springframework.data.jpa.repository.JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerId(String customerId);
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise Spring Boot application with multi-layer encryption: RDS encryption at rest, application-level PII encryption, S3 SSE-KMS, zero-knowledge architecture",
        prerequisites: [
          "Spring Boot 2.7+",
          "AWS RDS with encryption enabled",
          "AWS KMS",
          "AWS S3",
          "IAM roles and policies",
          "Understanding of TDE and envelope encryption",
        ],
        systemPosition:
          "Full-stack cloud application with defense-in-depth encryption at database, application, and storage layers",
      },
      annotations: [
        {
          id: "ear-java-rds-tde",
          lines: [456, 479],
          action:
            "Configure DataSource for RDS encrypted database with Transparent Data Encryption",
          reason:
            "RDS encryption at rest uses AWS KMS to encrypt database volumes - transparent to application, encrypts database files, backups, snapshots, and read replicas",
          contextLevel: "system",
          relatedConcepts: [
            "transparent-data-encryption",
            "database-encryption",
          ],
        },
        {
          id: "ear-java-kms-encrypt",
          lines: [157, 174],
          action: "Encrypt PII fields using AWS KMS encryption API",
          reason:
            "KMS performs encryption using FIPS 140-2 validated HSMs - key never leaves KMS, providing maximum security for sensitive data",
          contextLevel: "system",
          relatedConcepts: ["kms", "hsm", "field-encryption"],
        },
        {
          id: "ear-java-zero-knowledge",
          lines: [33, 47],
          action:
            "Implement zero-knowledge architecture with KMS key policies and application-level encryption",
          reason:
            "Multi-layer encryption (RDS + application + KMS) ensures cloud provider cannot access plaintext even with physical hardware access",
          contextLevel: "system",
          relatedConcepts: ["zero-knowledge", "data-sovereignty"],
        },
        {
          id: "ear-java-defense-depth",
          lines: [243, 259],
          action: "Apply application-level encryption on top of RDS encryption",
          reason:
            "Defense-in-depth: even if RDS encryption is bypassed, PII remains encrypted with separate KMS keys - provides multiple security layers",
          contextLevel: "system",
          relatedConcepts: ["defense-in-depth", "layered-security"],
        },
        {
          id: "ear-java-s3-sse-kms",
          lines: [324, 347],
          action: "Upload files to S3 with Server-Side Encryption using KMS",
          reason:
            "S3 SSE-KMS encrypts objects at rest using KMS keys - each object gets unique encryption key, KMS policies control access",
          contextLevel: "system",
          relatedConcepts: ["s3-encryption", "sse-kms"],
        },
        {
          id: "ear-java-audit-logging",
          lines: [176, 194],
          action: "Decrypt ciphertext with KMS audit logging",
          reason:
            "Every KMS decryption operation is logged to CloudTrail - provides audit trail for compliance and security monitoring",
          contextLevel: "system",
          relatedConcepts: ["audit-trail", "compliance"],
        },
        {
          id: "ear-java-key-rotation",
          lines: [214, 223],
          action: "Enable automatic KMS key rotation",
          reason:
            "AWS KMS automatically rotates keys annually - old key versions remain for decrypting existing data, new encryptions use new key",
          contextLevel: "system",
          relatedConcepts: ["key-rotation", "key-lifecycle"],
        },
        {
          id: "ear-java-bucket-encryption",
          lines: [349, 372],
          action: "Enable default encryption for S3 bucket",
          reason:
            "Enforce encryption at rest for all objects - prevents accidental unencrypted uploads, compliance requirement for sensitive data storage",
          contextLevel: "system",
          relatedConcepts: ["policy-enforcement", "compliance"],
        },
      ],
      highlights: [
        {
          lines: [157, 194],
          label: "AWS KMS encryption/decryption with audit logging",
          sbvpDomain: "behavior",
        },
        {
          lines: [243, 262],
          label: "Multi-layer encryption (RDS + Application + KMS)",
          sbvpDomain: "structure",
        },
        {
          lines: [456, 479],
          label: "RDS Transparent Data Encryption configuration",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Database encryption (MySQL, PostgreSQL, MongoDB, SQL Server)",
      "File storage encryption (S3, Azure Blob, Google Cloud Storage)",
      "Backup encryption (database dumps, tape backups, cloud backups)",
      "Log file encryption (application logs, audit logs, security logs)",
      "Configuration secrets (environment variables, API keys, credentials)",
      "PII/PHI data storage (customer data, healthcare records, financial data)",
      "Document storage (PDF, Word, images with sensitive content)",
      "Message queue encryption (Kafka, RabbitMQ, SQS)",
    ],
    interactsWith: [
      "key-management",
      "access-control",
      "audit-logging",
      "backup-restore",
      "tls-ssl",
      "jwt",
      "envelope-encryption",
    ],
    architecturalBoundaries: [
      "Encryption layer (transforms plaintext to ciphertext)",
      "Key Management Service (stores and provides encryption keys)",
      "Data storage layer (persists encrypted data)",
      "Access control layer (authorizes encryption/decryption operations)",
      "Audit logging layer (records all key access and crypto operations)",
      "Backup/restore layer (handles encrypted backups)",
      "Compliance boundary (enforces regulatory requirements)",
    ],
  },

  implementations: [
    {
      id: "aws-kms",
      name: "AWS Key Management Service",
      type: "service",
      languages: ["any"],
      description:
        "Managed service for creating and managing encryption keys backed by FIPS 140-2 validated HSMs. Integrates with RDS, S3, EBS, and other AWS services for automatic encryption at rest. Supports automatic key rotation, fine-grained IAM policies, and CloudTrail audit logging.",
      links: {
        docs: "https://docs.aws.amazon.com/kms/",
      },
      codeSnippet: `// AWS KMS with RDS encryption
aws rds create-db-instance \\
  --db-instance-identifier encrypted-db \\
  --engine postgres \\
  --storage-encrypted \\
  --kms-key-id arn:aws:kms:us-east-1:123456789012:key/abc-def

// S3 bucket default encryption
aws s3api put-bucket-encryption \\
  --bucket my-bucket \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:us-east-1:123456789012:key/abc-def"
      }
    }]
  }'`,
    },
    {
      id: "azure-key-vault",
      name: "Azure Key Vault",
      type: "service",
      languages: ["any"],
      description:
        "Microsoft Azure's key management service for safeguarding cryptographic keys and secrets. Supports HSM-backed keys (Premium tier), automatic key rotation, and integration with Azure SQL, Blob Storage, and Disk Encryption. Provides audit logs via Azure Monitor.",
      links: {
        docs: "https://learn.microsoft.com/en-us/azure/key-vault/",
      },
      codeSnippet: `# Enable Azure SQL TDE with Key Vault
az sql server tde-key set \\
  --server myserver \\
  --resource-group mygroup \\
  --server-key-type AzureKeyVault \\
  --kid https://myvault.vault.azure.net/keys/mykey

# Enable Storage Account encryption with customer-managed keys
az storage account update \\
  --name mystorageaccount \\
  --encryption-key-source Microsoft.Keyvault \\
  --encryption-key-vault https://myvault.vault.azure.net \\
  --encryption-key-name mykey`,
    },
    {
      id: "gcp-cloud-kms",
      name: "Google Cloud KMS",
      type: "service",
      languages: ["any"],
      description:
        "Google Cloud's key management service with HSM support (Cloud HSM). Integrates with Cloud SQL, Cloud Storage, and Compute Engine for encryption at rest. Supports automatic and on-demand key rotation, IAM-based access control, and Cloud Audit Logs.",
      links: {
        docs: "https://cloud.google.com/security-key-management",
      },
      codeSnippet: `# Create Cloud SQL instance with encryption
gcloud sql instances create encrypted-instance \\
  --database-version=POSTGRES_13 \\
  --disk-encryption-key=projects/my-project/locations/us-central1/keyRings/my-ring/cryptoKeys/my-key

# Encrypt Cloud Storage bucket
gsutil encryption set \\
  -k projects/my-project/locations/us-central1/keyRings/my-ring/cryptoKeys/my-key \\
  gs://my-bucket`,
    },
    {
      id: "hashicorp-vault",
      name: "HashiCorp Vault",
      type: "platform",
      languages: ["any"],
      description:
        "Open-source secrets management and encryption platform. Provides Transit secrets engine for encryption-as-a-service, PKI engine for certificate management, and database secrets engine for dynamic credentials. Supports multiple auth methods and audit logging.",
      links: {
        docs: "https://www.vaultproject.io/",
        github: "https://github.com/hashicorp/vault",
      },
      codeSnippet: `# Enable Transit engine for encryption
vault secrets enable transit
vault write -f transit/keys/customer-data

# Encrypt data
vault write transit/encrypt/customer-data plaintext=$(base64 <<< "sensitive data")

# Decrypt data
vault write transit/decrypt/customer-data ciphertext=vault:v1:abc123def456`,
    },
    {
      id: "mongodb-csfle",
      name: "MongoDB Client-Side Field Level Encryption",
      type: "library",
      languages: ["javascript", "typescript", "python", "java"],
      description:
        "MongoDB's client-side field-level encryption with automatic encryption/decryption. Supports deterministic and random encryption, queryable encryption, and integration with AWS KMS, Azure Key Vault, and GCP Cloud KMS. Available in MongoDB 4.2+.",
      links: {
        docs: "https://www.mongodb.com/docs/manual/core/csfle/",
      },
      codeSnippet: `// MongoDB CSFLE with AWS KMS
const autoEncryptionOpts = {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  schemaMap: {
    'mydb.users': {
      properties: {
        ssn: {
          encrypt: {
            bsonType: 'string',
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
          }
        }
      }
    }
  }
};`,
    },
    {
      id: "postgresql-pgcrypto",
      name: "PostgreSQL pgcrypto",
      type: "library",
      languages: ["sql"],
      description:
        "PostgreSQL extension providing cryptographic functions for column-level encryption. Supports symmetric (AES, Blowfish) and asymmetric (RSA) encryption, hashing (SHA, MD5), and random data generation. Enables application-level encryption within PostgreSQL.",
      links: {
        docs: "https://www.postgresql.org/docs/current/pgcrypto.html",
      },
      codeSnippet: `-- Enable pgcrypto extension
CREATE EXTENSION pgcrypto;

-- Encrypt data with AES
INSERT INTO customers (name, encrypted_ssn) VALUES (
  'John Doe',
  pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- Decrypt data
SELECT
  name,
  pgp_sym_decrypt(encrypted_ssn, 'encryption_key') AS ssn
FROM customers;`,
    },
    {
      id: "mysql-tde",
      name: "MySQL Transparent Data Encryption",
      type: "framework",
      languages: ["sql"],
      description:
        "MySQL's built-in tablespace encryption feature using AES-256. Encrypts InnoDB tables, redo logs, and binary logs transparently. Supports keyring plugins for key management (file, OKV, AWS KMS). Available in MySQL 5.7.11+ and 8.0+.",
      links: {
        docs: "https://dev.mysql.com/doc/refman/8.0/en/innodb-data-encryption.html",
      },
      codeSnippet: `-- Enable encryption for table
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  ssn VARCHAR(11)
) ENCRYPTION='Y';

-- Encrypt existing table
ALTER TABLE customers ENCRYPTION='Y';

-- Configure keyring plugin (my.cnf)
[mysqld]
early-plugin-load=keyring_file.so
keyring_file_data=/var/lib/mysql-keyring/keyring`,
    },
    {
      id: "sqlcipher",
      name: "SQLCipher",
      type: "library",
      languages: ["any"],
      description:
        "Open-source SQLite extension providing transparent 256-bit AES encryption. Encrypts database file, journal, and temporary files. Zero-configuration encryption with minimal performance impact. Used by WhatsApp, Signal, and other security-focused applications.",
      links: {
        docs: "https://www.zetetic.net/sqlcipher/",
        github: "https://github.com/sqlcipher/sqlcipher",
      },
      codeSnippet: `// SQLCipher with Python
import sqlite3
from pysqlcipher3 import dbapi2 as sqlcipher

# Open encrypted database
conn = sqlcipher.connect('encrypted.db')
cursor = conn.cursor()

# Set encryption key
cursor.execute("PRAGMA key='your-encryption-key'")

# Use database normally
cursor.execute("CREATE TABLE users (id INT, name TEXT)")`,
    },
  ],

  usedInSystems: [
    {
      systemId: "stripe",
      systemName: "Stripe Payment Processing",
      howUsed:
        "Stripe encrypts all sensitive payment data (credit card numbers, bank account details, PII) at rest using AES-256 encryption. Card numbers are stored in PCI DSS Level 1 compliant data centers with full-disk encryption on all database servers. Application-level encryption adds defense-in-depth: primary account numbers (PANs) are encrypted using Stripe's internal key management service before database storage. Keys are rotated quarterly and stored in Hardware Security Modules (HSMs). Database backups are encrypted using separate keys. Envelope encryption pattern enables key rotation without re-encrypting 640B+ stored payment methods. Pattern composition: Encryption at Rest + TLS (in transit) + Tokenization (card vaults) + HSM (key storage) + Audit Logging. Rationale: PCI DSS Requirement 3.4 mandates encryption of cardholder data at rest - non-compliance results in loss of payment processing license and fines up to $500k per incident. Stripe processes $640B+ annually across 50+ countries; encryption at rest is foundational to PCI compliance and customer trust. Impact: Zero data breaches from storage compromise in 13+ years of operation; maintains PCI DSS Level 1 certification; processes 250M+ API requests daily with encrypted data.",
      source: "https://stripe.com/docs/security/stripe",
    },
    {
      systemId: "epic-systems",
      systemName: "Epic Systems Electronic Health Records",
      howUsed:
        "Epic Systems, the largest EHR vendor serving 250M+ patient records, implements multi-layer encryption at rest for HIPAA compliance. All Protected Health Information (PHI) is encrypted using AES-256 at the database layer (Oracle TDE or SQL Server TDE) and file system layer (encrypted volumes). Application-level encryption protects highly sensitive fields: Social Security Numbers, genetic data, mental health records, and substance abuse treatment notes use field-level encryption with separate key hierarchies. Keys are managed in FIPS 140-2 Level 3 certified HSMs with role-based access control - database administrators cannot access encryption keys. Backup tapes and cloud backups are encrypted with different keys, stored in separate secure facilities. Pattern composition: Transparent Data Encryption + Field-Level Encryption + HSM + Key Rotation (annual) + Encrypted Backups + Audit Logging. Rationale: HIPAA Security Rule §164.312(a)(2)(iv) requires encryption of ePHI at rest - violations result in fines up to $1.5M per incident and potential criminal charges. Epic serves 305 hospitals including Mayo Clinic, Cleveland Clinic, Johns Hopkins - any breach would affect millions of patients and destroy Epic's market position. Impact: No major PHI breaches from encrypted data stores; maintains HITRUST CSF certification; enables healthcare organizations to pass HIPAA audits; 78% of patient records in US are Epic-managed with compliant encryption.",
      source:
        "https://www.epic.com/software-security/encryption-data-security/",
    },
    {
      systemId: "dropbox",
      systemName: "Dropbox Cloud Storage",
      howUsed:
        "Dropbox encrypts all 700M+ users' files at rest using 256-bit AES encryption. Files are split into blocks (4MB max), each block encrypted with unique key, enabling efficient deduplication and delta sync. Block encryption keys are encrypted with master keys stored in HSMs. File metadata (names, paths, timestamps) is encrypted separately with per-user keys. Enterprise customers get additional layer: Dropbox Business uses customer-managed keys (bring-your-own-key via AWS KMS, Google Cloud KMS) enabling zero-knowledge architecture where Dropbox cannot decrypt customer data. S3 backend storage uses SSE with AWS-managed keys as baseline, Dropbox keys as second layer. Pattern composition: Block-level Encryption + Envelope Encryption + Customer-Managed Keys (enterprise) + Deduplication-aware Encryption + S3 SSE. Rationale: Cloud storage trust requires proof that provider cannot access user data - zero-knowledge encryption differentiates Dropbox Business in enterprise market. Compliance with GDPR, HIPAA, and international data sovereignty laws requires customer-controlled encryption. Impact: Processes 1B+ file uploads daily with encrypted storage; zero plaintext file exposure in 17+ years; enterprise tier grew to 600k+ businesses using customer-managed keys; survived multiple security audits with encryption as core defense.",
      source: "https://www.dropbox.com/security/encryption",
    },
    {
      systemId: "1password",
      systemName: "1Password Password Manager",
      howUsed:
        "1Password's security model is entirely based on encryption at rest with zero-knowledge architecture. All vault data (passwords, credit cards, secure notes, documents) is encrypted locally on device using AES-256-GCM before sync to cloud. Master Password and Secret Key (128-bit) are combined via PBKDF2-HMAC-SHA256 (100k+ iterations) to derive encryption keys - 1Password servers never receive these keys. Each vault item encrypted with unique per-item key, per-item keys encrypted with vault key, vault keys encrypted with account key hierarchy. Files stored in cloud (AWS/GCP) are encrypted blobs - cloud provider and 1Password employees cannot decrypt. Two-secret key derivation (master password + secret key) prevents brute force even if cloud storage is compromised. Pattern composition: Client-Side Encryption + Zero-Knowledge + Key Derivation (PBKDF2) + Envelope Encryption (multi-tier) + Encrypted Search. Rationale: Password manager must be trustless - users must cryptographically guarantee that provider cannot access passwords even with malicious intent or legal coercion. Zero-knowledge encryption is the foundation of 1Password's security guarantee and business model. Impact: Stores 1B+ secrets for 100k+ businesses with zero server-side decryption capability; survived security audits by independent firms; encryption design enables compliance with SOC 2, GDPR for enterprise customers; trust model allows use in government and defense sectors.",
      source: "https://1password.com/security/",
    },
    {
      systemId: "aws-default-encryption",
      systemName: "AWS Default Encryption for Storage Services",
      howUsed:
        "AWS enforces encryption at rest by default across all major storage services as of 2023. S3 encrypts all new objects with SSE-S3 (AES-256) automatically; customers can upgrade to SSE-KMS for customer-managed keys. EBS volumes are encrypted by default in new accounts using AWS-managed keys (can use customer KMS keys). RDS automatically encrypts database instances, backups, snapshots, and read replicas when encryption enabled at creation. DynamoDB encrypts all tables at rest using AWS-owned keys (can use customer KMS keys). Aurora encrypts storage, backups, and replicas. FSx file systems encrypted by default. Pattern composition: Transparent Data Encryption + AWS KMS + Server-Side Encryption + Encrypted Backups + Encrypted Snapshots. Rationale: Default encryption eliminates human error - 60% of cloud data breaches result from misconfigured storage without encryption. By making encryption default, AWS prevents accidental exposure of unencrypted data. Customer-managed keys (KMS) add layer for compliance and zero-knowledge scenarios. Impact: Encrypts petabytes of customer data daily; prevents misconfiguration-based breaches; enables compliance with GDPR, HIPAA, PCI DSS, FedRAMP; reduced S3 bucket exposure incidents by 90% after default encryption enabled; processes millions of KMS API calls per second for encryption operations.",
      source: "https://aws.amazon.com/blogs/aws/amazon-s3-encryption/",
    },
  ],

  philosophy: {
    coreProblem:
      "Data stored on disk is vulnerable to theft, unauthorized access, and regulatory non-compliance if not cryptographically protected",
    designPrinciple:
      "Encrypt all sensitive data before it touches persistent storage, separating encryption keys from encrypted data to ensure cryptographic protection survives storage compromise",
    historicalContext:
      "Emerged from data breach incidents where stolen laptops, backup tapes, and improperly disposed hard drives exposed millions of records. Regulatory frameworks (PCI DSS 2004, HIPAA 2003, GDPR 2018) mandated encryption at rest. Cloud computing accelerated adoption as customers demanded proof that cloud providers cannot access their data.",
    alternativesRejected: [
      "Access control only - insufficient when storage media is physically stolen",
      "Application-level encryption only - doesn't protect backups, logs, or temp files",
      "Obfuscation or encoding - not cryptographically secure, easily reversed",
      "Full-disk encryption only - doesn't protect against insider threats with OS access",
    ],
    mentalModel:
      "Like a safe deposit box at a bank: your valuables (data) are locked in a box (encrypted) with a key only you hold (encryption key). Even if someone breaks into the bank vault (storage compromise), they cannot access your box contents without your key. The bank (cloud provider) can store your box but cannot open it.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Application["Application Layer"]
        App[Application Code]
        PlainText[Plaintext Data]
    end

    subgraph Encryption["Encryption Layer"]
        EncEngine[Encryption Engine]
        KMS[Key Management Service]
        DEK[Data Encryption Key]
        KEK[Key Encryption Key]
    end

    subgraph Storage["Storage Layer"]
        DB[(Encrypted Database)]
        Files[Encrypted Files]
        Backups[Encrypted Backups]
    end

    App -->|Write Data| PlainText
    PlainText -->|Request Key| KMS
    KMS -->|Provide DEK| EncEngine
    KEK -->|Encrypts| DEK
    EncEngine -->|Encrypt| PlainText
    EncEngine -->|Store Ciphertext| DB
    EncEngine -->|Store Ciphertext| Files
    DB -->|Backup| Backups

    style KEK fill:#ff6b6b
    style DEK fill:#ffd93d
    style DB fill:#6bcf7f
    style KMS fill:#4ecdc4`,
    realWorldAnalogy:
      "Encryption at rest is like storing valuables in a home safe. Your jewelry (sensitive data) is locked in the safe (encrypted) with a combination (encryption key) only you know. If burglars break into your house (storage compromise), they find a locked safe they cannot open. The safe can be moved, copied, or stolen, but the contents remain inaccessible without the combination. Envelope encryption is like having a master combination (KEK) that unlocks a key drawer containing individual safe combinations (DEKs).",
    useCases: [
      {
        domain: "Healthcare",
        scenario:
          "Hospital stores 500k+ patient medical records with diagnoses, medications, lab results, and genetic data. HIPAA requires encryption of all ePHI at rest. Database uses TDE with AES-256, highly sensitive fields (genetic data, mental health) use additional application-level encryption.",
        patternRole:
          "Ensures HIPAA compliance, protects patient privacy, enables secure backups, prevents insider access to plaintext PHI",
        companies: ["Epic Systems", "Cerner", "Allscripts"],
      },
      {
        domain: "Financial Services",
        scenario:
          "Payment processor stores 100M+ credit card numbers for recurring billing. PCI DSS Requirement 3.4 mandates encryption of PANs at rest. Uses HSM-backed encryption with quarterly key rotation, encrypted backups, and separate encryption for different customer segments.",
        patternRole:
          "Achieves PCI DSS compliance, protects cardholder data, enables secure storage of payment instruments, prevents data breach from storage compromise",
        companies: ["Stripe", "Square", "Adyen", "PayPal"],
      },
      {
        domain: "Cloud Storage",
        scenario:
          "Cloud storage provider stores petabytes of customer files. Uses block-level encryption with per-file keys, envelope encryption for efficient key management, customer-managed keys for enterprise zero-knowledge architecture.",
        patternRole:
          "Enables zero-knowledge storage where provider cannot access customer data, supports deduplication with encrypted blocks, allows customer-controlled encryption",
        companies: ["Dropbox", "Box", "Google Drive"],
      },
      {
        domain: "SaaS Applications",
        scenario:
          "CRM platform stores customer contact information, sales data, and contracts for 50k+ businesses. GDPR requires encryption of personal data at rest. RDS encryption protects database, field-level encryption for PII (email, phone), S3 encryption for document attachments.",
        patternRole:
          "Ensures GDPR compliance, protects customer PII, enables audit trail, prevents unauthorized access to customer data",
        companies: ["Salesforce", "HubSpot", "Zendesk"],
      },
    ],
  },

  tags: [
    "security",
    "encryption",
    "compliance",
    "data-protection",
    "kms",
    "gdpr",
    "hipaa",
    "pci-dss",
  ],
  difficulty: "advanced",
};
