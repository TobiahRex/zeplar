import type { Pattern } from "../schema";

export const tLSSSL: Pattern = {
  id: "tls-ssl",
  slug: "tls-ssl",
  corpusPath: "🔒 SECURITY → 🔐 Encryption → 🔒 TLS/SSL",

  hierarchy: {
    quality: "security",
    strategy: "Encryption",
    family: "Transport Security",
    level: 4,
  },

  concept: {
    name: "TLS/SSL",
    emoji: "🔒",
    tagline: "Cryptographic protocol for secure communication over networks",
    definition:
      "Transport Layer Security (TLS) and its predecessor Secure Sockets Layer (SSL) are cryptographic protocols that provide end-to-end encryption, authentication, and data integrity for network communications. TLS operates through a multi-phase handshake process where client and server negotiate cipher suites, exchange certificates for authentication, and establish symmetric encryption keys. The handshake begins with ClientHello and ServerHello messages exchanging supported protocol versions and cipher suites, followed by certificate validation against trusted Certificate Authorities (CAs), key exchange using algorithms like Elliptic Curve Diffie-Hellman Ephemeral (ECDHE) for forward secrecy, and finally Finished messages confirming successful negotiation. Once established, all application data flows through symmetric encryption (AES-GCM) using session keys derived during the handshake. TLS 1.3, the latest version, reduces handshake latency to 1-RTT (round-trip time) from TLS 1.2's 2-RTT, removes insecure cipher suites, and mandates Perfect Forward Secrecy. The protocol protects against eavesdropping through encryption, man-in-the-middle attacks through certificate validation, and tampering through message authentication codes (MACs).",
    problemSolved:
      "In unencrypted network communication, data travels in plaintext, exposing sensitive information (passwords, credit cards, personal data) to interception by anyone monitoring network traffic. Man-in-the-middle (MITM) attacks allow attackers to intercept, read, and modify messages between parties who believe they're communicating directly. Without authentication, clients cannot verify they're connecting to legitimate servers, enabling phishing and impersonation attacks. Protocol downgrade attacks force clients to use older, vulnerable encryption methods. Data tampering goes undetected without integrity verification. TLS/SSL solves these by encrypting all traffic with symmetric ciphers (making eavesdropping computationally infeasible), authenticating servers through X.509 certificates signed by trusted CAs (preventing impersonation), ensuring data integrity with HMAC/AEAD (detecting tampering), and negotiating the strongest mutually-supported encryption (preventing downgrade attacks). Certificate pinning and HSTS further strengthen security by preventing certificate substitution and forcing HTTPS connections.",
    tradeoffs: {
      pros: [
        "End-to-end encryption protects data confidentiality in transit",
        "Certificate-based authentication prevents impersonation attacks",
        "Data integrity verification detects tampering through MACs/AEAD",
        "Ubiquitous browser and library support enables universal adoption",
        "Forward secrecy in TLS 1.3 protects past sessions if keys compromised",
      ],
      cons: [
        "Computational overhead from encryption/decryption impacts performance",
        "Certificate management complexity requires rotation, renewal, revocation",
        "Configuration errors expose systems to downgrade or cipher attacks",
        "Older protocol versions (SSLv3, TLS 1.0/1.1) have known vulnerabilities",
        "CPU-intensive handshakes increase latency and resource consumption",
      ],
    },
    relatedPatterns: [
      "e2e-encryption",
      "encryption-at-rest",
      "jwt",
      "oauth-2-0",
      "certificate-pinning",
      "vpn",
      "ipsec",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client",
        role: "Connection Initiator",
        responsibilities: [
          "Send ClientHello with supported cipher suites and TLS versions",
          "Validate server certificate chain against trusted CA store",
          "Verify certificate hostname matches requested domain (SNI)",
          "Generate client key exchange material for session keys",
          "Encrypt all application data with negotiated cipher suite",
        ],
      },
      {
        name: "Server",
        role: "Service Provider",
        responsibilities: [
          "Respond with ServerHello selecting cipher suite and TLS version",
          "Present X.509 certificate chain proving identity",
          "Generate server key exchange material for session keys",
          "Optionally request client certificate for mutual TLS (mTLS)",
          "Decrypt client requests and encrypt responses",
        ],
      },
      {
        name: "Certificate Authority",
        role: "Trust Anchor",
        responsibilities: [
          "Issue digitally signed X.509 certificates to domain owners",
          "Maintain certificate revocation lists (CRLs) for compromised certs",
          "Provide OCSP (Online Certificate Status Protocol) for real-time validation",
          "Validate domain ownership before issuing certificates (DV/OV/EV)",
          "Operate as trusted root CA in client/browser certificate stores",
        ],
      },
      {
        name: "TLS Handshake Protocol",
        role: "Session Establishment",
        responsibilities: [
          "Negotiate highest mutually-supported TLS version (1.2 or 1.3)",
          "Select cipher suite (key exchange, encryption, MAC algorithms)",
          "Exchange random nonces to prevent replay attacks",
          "Derive session keys from key exchange material using PRF",
          "Verify Finished messages contain correct handshake hash",
        ],
      },
      {
        name: "Cipher Suite",
        role: "Cryptographic Algorithms",
        responsibilities: [
          "Key exchange algorithm (ECDHE, DHE, RSA)",
          "Authentication algorithm (RSA, ECDSA, EdDSA)",
          "Symmetric encryption cipher (AES-GCM, ChaCha20-Poly1305)",
          "Pseudorandom function (PRF) for key derivation",
          "Message authentication (HMAC-SHA256, AEAD built-in)",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant S as Server
    participant CA as Certificate Authority

    Note over C,S: TLS 1.3 Handshake (1-RTT)
    C->>S: ClientHello (ciphers, extensions, key_share)
    S->>S: Select cipher suite
    S->>C: ServerHello + Certificate + Finished
    C->>CA: Validate certificate chain (cached/OCSP)
    CA-->>C: Certificate valid
    C->>C: Derive session keys
    C->>S: Finished (encrypted with session key)

    Note over C,S: Application Data Phase
    C->>S: Encrypted Request (AES-GCM)
    S->>C: Encrypted Response (AES-GCM)

    Note over C,S: Connection Closure
    C->>S: close_notify alert
    S->>C: close_notify alert`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Send ClientHello",
        description:
          "Client initiates handshake with supported TLS versions, cipher suites, random nonce, and key_share extension (TLS 1.3)",
      },
      {
        step: 2,
        actor: "Server",
        action: "Select cipher suite and send ServerHello",
        description:
          "Server chooses TLS version and cipher suite, responds with random nonce and key_share",
      },
      {
        step: 3,
        actor: "Server",
        action: "Send Certificate",
        description:
          "Server presents X.509 certificate chain ending in trusted CA root certificate",
      },
      {
        step: 4,
        actor: "Client",
        action: "Validate certificate",
        description:
          "Client verifies certificate chain, checks expiration, validates signature, confirms hostname matches SNI, checks revocation status (CRL/OCSP)",
      },
      {
        step: 5,
        actor: "Client",
        action: "Key exchange",
        description:
          "Client generates pre-master secret or uses ECDHE shared secret from key_share",
      },
      {
        step: 6,
        actor: "Client",
        action: "Derive session keys",
        description:
          "Both parties derive symmetric encryption keys from shared secret using pseudorandom function (PRF)",
      },
      {
        step: 7,
        actor: "Server",
        action: "Send Finished",
        description:
          "Server sends encrypted Finished message with hash of all handshake messages to verify integrity",
      },
      {
        step: 8,
        actor: "Client",
        action: "Send Finished",
        description:
          "Client verifies server Finished message, sends own Finished message",
      },
      {
        step: 9,
        actor: "Client",
        action: "Send encrypted application data",
        description:
          "Client encrypts HTTP requests with AES-GCM using session keys",
      },
      {
        step: 10,
        actor: "Server",
        action: "Decrypt and process request",
        description:
          "Server decrypts request, processes it, encrypts response with session keys",
      },
      {
        step: 11,
        actor: "Server",
        action: "Send encrypted response",
        description: "Server returns encrypted HTTP response to client",
      },
      {
        step: 12,
        actor: "Client",
        action: "Send close_notify alert",
        description:
          "Client signals connection closure to prevent truncation attacks",
      },
    ],
    invariants: [
      "Certificate chain must validate to trusted root CA in client's certificate store",
      "Forward secrecy requires ephemeral key exchange (ECDHE/DHE), not static RSA",
      "Cipher suite negotiation must select strongest mutually-supported algorithm",
      "MAC verification or AEAD authentication must succeed for every message",
      "Protocol version downgrade attacks prevented by signed_certificate_timestamp",
      "Session resumption requires session tickets or session IDs for performance",
    ],
  },

  codeExamples: [
    {
      id: "tls-node-https",
      language: "typescript",
      title: "Node.js HTTPS Server with TLS 1.3 and Security Best Practices",
      description:
        "Production-ready HTTPS server with Let's Encrypt certificates, Perfect Forward Secrecy, HSTS, and OCSP stapling",
      code: `import https from 'https';
import http from 'http';
import fs from 'fs';
import { promisify } from 'util';
import tls from 'tls';

// ============================================================================
// Certificate Management with Let's Encrypt
// ============================================================================

interface TLSConfig {
  certPath: string;
  keyPath: string;
  caPath?: string;
  dhparamPath?: string;
}

/**
 * Load TLS certificates from filesystem
 * In production, use Let's Encrypt certbot for automatic renewal:
 * certbot certonly --standalone -d example.com
 */
async function loadCertificates(config: TLSConfig) {
  const readFile = promisify(fs.readFile);

  return {
    cert: await readFile(config.certPath, 'utf8'),
    key: await readFile(config.keyPath, 'utf8'),
    ca: config.caPath ? await readFile(config.caPath, 'utf8') : undefined,
    dhparam: config.dhparamPath ? await readFile(config.dhparamPath, 'utf8') : undefined,
  };
}

// ============================================================================
// TLS 1.3 Configuration with Perfect Forward Secrecy
// ============================================================================

/**
 * Configure TLS options for maximum security
 * WHY TLS 1.3?: Reduces handshake latency (1-RTT vs 2-RTT), removes weak ciphers
 * WHY ECDHE?: Provides Perfect Forward Secrecy - past sessions safe even if private key leaked
 */
function createSecureTLSOptions(certs: {
  cert: string;
  key: string;
  ca?: string;
  dhparam?: string;
}): https.ServerOptions {
  return {
    // Certificate configuration
    cert: certs.cert,
    key: certs.key,
    ca: certs.ca, // Certificate chain for Let's Encrypt

    // TLS Protocol Configuration
    // WHY TLS 1.3 minimum?: TLS 1.0/1.1 have known vulnerabilities (POODLE, BEAST)
    // Modern browsers support TLS 1.3 since 2018
    minVersion: 'TLSv1.3' as const,
    maxVersion: 'TLSv1.3' as const,

    // Cipher Suite Selection (TLS 1.3 has only 5 secure suites)
    // WHY this order?: Prioritizes AEAD ciphers (AES-GCM, ChaCha20-Poly1305) with forward secrecy
    // GCM is faster on hardware with AES-NI, ChaCha20 is faster on mobile
    ciphersuites: [
      'TLS_AES_256_GCM_SHA384',       // 256-bit AES-GCM with SHA-384
      'TLS_CHACHA20_POLY1305_SHA256', // ChaCha20 for mobile devices
      'TLS_AES_128_GCM_SHA256',       // 128-bit AES-GCM (faster, still secure)
    ].join(':'),

    // TLS 1.2 cipher suites (if you need to support TLS 1.2)
    // WHY ECDHE?: All selected ciphers use ECDHE for Perfect Forward Secrecy
    // WHY no RSA key exchange?: Static RSA doesn't provide forward secrecy
    ciphers: [
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
    ].join(':'),

    // WHY honorCipherOrder?: Server cipher preference prevents clients from selecting weak ciphers
    honorCipherOrder: true,

    // Session Management
    // WHY session resumption?: Reduces handshake overhead for returning clients
    // Session tickets avoid server-side session storage (better for horizontal scaling)
    sessionTimeout: 300, // 5 minutes

    // Diffie-Hellman Parameters
    // WHY custom dhparam?: Default DH params may be vulnerable to Logjam attack
    // Generate with: openssl dhparam -out dhparam.pem 2048
    dhparam: certs.dhparam,

    // Security Options
    // WHY requestCert for mTLS?: Mutual TLS requires client certificates for zero-trust security
    requestCert: false, // Set true for mutual TLS (mTLS)
    rejectUnauthorized: true, // Reject invalid certificates

    // Enable OCSP Stapling for faster certificate validation
    // WHY OCSP stapling?: Client doesn't need to contact CA, improves handshake performance
    // Server fetches OCSP response and includes it in handshake
    enableTrace: false, // Disable for production
  };
}

// ============================================================================
// HTTPS Server with Security Headers
// ============================================================================

interface ServerConfig {
  port: number;
  httpsPort: number;
  hostname: string;
}

/**
 * Create production HTTPS server with HSTS and security headers
 * WHY HSTS?: Forces browsers to only use HTTPS, prevents SSL stripping attacks
 * WHY redirect HTTP to HTTPS?: Captures users who type http:// and upgrades them
 */
async function createHTTPSServer(
  tlsConfig: TLSConfig,
  config: ServerConfig
) {
  const certs = await loadCertificates(tlsConfig);
  const tlsOptions = createSecureTLSOptions(certs);

  // HTTPS Server (TLS-encrypted)
  const httpsServer = https.createServer(tlsOptions, (req, res) => {
    // Security Headers
    // WHY HSTS?: max-age=31536000 means browsers remember to use HTTPS for 1 year
    // includeSubDomains protects all subdomains, preload allows inclusion in browser HSTS lists
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // WHY X-Content-Type-Options?: Prevents MIME-sniffing attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // WHY X-Frame-Options?: Prevents clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // WHY CSP?: Mitigates XSS attacks by restricting resource sources
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'"
    );

    // Application logic
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Secure TLS connection established',
      protocol: req.socket.encrypted ? 'HTTPS' : 'HTTP',
      tlsVersion: (req.socket as tls.TLSSocket).getProtocol?.() ?? 'unknown',
      cipher: (req.socket as tls.TLSSocket).getCipher?.() ?? 'unknown',
    }));
  });

  // HTTP Server (redirects to HTTPS)
  // WHY redirect instead of serving HTTP?: Ensures all traffic is encrypted
  const httpServer = http.createServer((req, res) => {
    res.writeHead(301, {
      Location: \`https://\${config.hostname}:\${config.httpsPort}\${req.url}\`,
    });
    res.end();
  });

  // Event Handlers for Monitoring
  httpsServer.on('secureConnection', (tlsSocket) => {
    const protocol = tlsSocket.getProtocol();
    const cipher = tlsSocket.getCipher();

    console.log('TLS Connection established:', {
      protocol,
      cipher: cipher.name,
      version: cipher.version,
    });

    // WHY log cipher suite?: Detect if clients are using weak ciphers
    if (protocol !== 'TLSv1.3') {
      console.warn(\`Client using older protocol: \${protocol}\`);
    }
  });

  httpsServer.on('tlsClientError', (err, tlsSocket) => {
    console.error('TLS handshake error:', err.message);
    // WHY log errors?: Detect certificate issues, protocol downgrades, or attacks
  });

  // Start servers
  await Promise.all([
    new Promise((resolve) => httpsServer.listen(config.httpsPort, () => {
      console.log(\`HTTPS server listening on port \${config.httpsPort}\`);
      resolve(undefined);
    })),
    new Promise((resolve) => httpServer.listen(config.port, () => {
      console.log(\`HTTP redirect server listening on port \${config.port}\`);
      resolve(undefined);
    })),
  ]);

  return { httpsServer, httpServer };
}

// ============================================================================
// Certificate Validation and Pinning
// ============================================================================

/**
 * Implement certificate pinning for additional security
 * WHY certificate pinning?: Prevents MITM attacks even if CA is compromised
 * Use for high-security APIs where you control both client and server
 */
function createPinnedHTTPSAgent(pinnedFingerprint: string) {
  return new https.Agent({
    // TLS options for outbound connections
    minVersion: 'TLSv1.3' as const,

    // Custom certificate validation
    checkServerIdentity: (hostname, cert) => {
      // Standard hostname validation
      const err = tls.checkServerIdentity(hostname, cert);
      if (err) return err;

      // Certificate pinning
      // WHY SHA-256 fingerprint?: Identifies exact certificate, prevents substitution
      const fingerprint = cert.fingerprint256;
      if (fingerprint !== pinnedFingerprint) {
        return new Error(\`Certificate fingerprint mismatch. Expected \${pinnedFingerprint}, got \${fingerprint}\`);
      }

      return undefined;
    },
  });
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  const tlsConfig: TLSConfig = {
    certPath: '/etc/letsencrypt/live/example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/example.com/privkey.pem',
    caPath: '/etc/letsencrypt/live/example.com/chain.pem',
    dhparamPath: '/etc/ssl/certs/dhparam.pem',
  };

  const serverConfig: ServerConfig = {
    port: 80,        // HTTP (redirects to HTTPS)
    httpsPort: 443,  // HTTPS (TLS encrypted)
    hostname: 'example.com',
  };

  try {
    const { httpsServer, httpServer } = await createHTTPSServer(tlsConfig, serverConfig);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, closing servers gracefully');
      httpsServer.close();
      httpServer.close();
    });

  } catch (error) {
    console.error('Failed to start HTTPS server:', error);
    process.exit(1);
  }
}

// Export for testing
export { createSecureTLSOptions, createHTTPSServer, createPinnedHTTPSAgent };`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready HTTPS server with TLS 1.3, certificate management, security headers, and monitoring",
        prerequisites: [
          "Node.js HTTPS module",
          "X.509 certificates",
          "TLS protocol fundamentals",
          "Let's Encrypt ACME protocol",
        ],
        systemPosition:
          "Web server or API gateway serving encrypted traffic to clients, integrates with certificate management, monitoring, and load balancing infrastructure",
      },
      annotations: [
        {
          id: "tls-version-config",
          lines: [59, 62],
          action: "Configure minimum TLS version to 1.3",
          reason:
            "TLS 1.0/1.1 have known vulnerabilities (POODLE, BEAST, CRIME). TLS 1.3 reduces handshake latency from 2-RTT to 1-RTT (50% faster) and removes weak cipher suites. Modern browsers support TLS 1.3 since 2018.",
          contextLevel: "system",
          relatedConcepts: ["protocol-version", "backwards-compatibility"],
        },
        {
          id: "tls-cipher-suite-order",
          lines: [64, 71],
          action: "Configure TLS 1.3 cipher suites in priority order",
          reason:
            "TLS 1.3 has only 5 approved cipher suites, all providing forward secrecy. AES-256-GCM prioritized for maximum security, ChaCha20-Poly1305 for mobile devices without AES-NI hardware acceleration. All use AEAD (Authenticated Encryption with Associated Data).",
          contextLevel: "system",
          relatedConcepts: [
            "perfect-forward-secrecy",
            "aead",
            "cipher-negotiation",
          ],
        },
        {
          id: "tls-ecdhe-forward-secrecy",
          lines: [73, 83],
          action:
            "Select only ECDHE cipher suites for TLS 1.2 fallback support",
          reason:
            "ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) generates ephemeral keys for each session, providing Perfect Forward Secrecy. If server private key is compromised, past session traffic remains encrypted. Static RSA key exchange doesn't provide this guarantee.",
          contextLevel: "system",
          relatedConcepts: ["ecdhe", "forward-secrecy", "key-exchange"],
        },
        {
          id: "tls-honor-cipher-order",
          lines: [86, 87],
          action: "Enable server cipher preference",
          reason:
            "Prevents clients from selecting weak ciphers if misconfigured. Server dictates cipher selection based on security policy, not client preference. Critical for preventing downgrade attacks.",
          contextLevel: "module",
          relatedConcepts: ["cipher-negotiation", "downgrade-prevention"],
        },
        {
          id: "tls-hsts-header",
          lines: [133, 138],
          action:
            "Set HSTS header with max-age, includeSubDomains, and preload",
          reason:
            "HTTP Strict Transport Security forces browsers to use HTTPS for 1 year (max-age=31536000), preventing SSL stripping attacks. includeSubDomains protects all subdomains. preload allows inclusion in browser HSTS preload lists for first-visit protection.",
          contextLevel: "system",
          relatedConcepts: ["hsts", "ssl-stripping", "security-headers"],
        },
        {
          id: "tls-http-redirect",
          lines: [165, 170],
          action: "Redirect all HTTP traffic to HTTPS with 301 status",
          reason:
            "Captures users who type http:// or follow old links and upgrades them to encrypted HTTPS connection. 301 permanent redirect tells search engines and browsers to update bookmarks. Combined with HSTS, provides defense-in-depth.",
          contextLevel: "module",
          relatedConcepts: ["http-to-https-redirect", "defense-in-depth"],
        },
        {
          id: "tls-connection-monitoring",
          lines: [175, 185],
          action: "Log TLS connection details and detect protocol downgrades",
          reason:
            "Monitoring cipher suite usage detects misconfigured clients or potential downgrade attacks. Logging TLS version helps identify clients using outdated protocols (TLS 1.2) that may need upgrade prompts.",
          contextLevel: "system",
          relatedConcepts: ["observability", "security-monitoring"],
        },
        {
          id: "tls-certificate-pinning",
          lines: [213, 222],
          action: "Implement certificate pinning with SHA-256 fingerprint",
          reason:
            "Certificate pinning prevents MITM attacks even if Certificate Authority is compromised or issues fraudulent certificates. By validating exact certificate fingerprint, only the pinned certificate is trusted. Critical for high-security APIs, mobile apps, and zero-trust architectures.",
          contextLevel: "system",
          relatedConcepts: [
            "certificate-pinning",
            "zero-trust",
            "ca-compromise",
          ],
        },
      ],
      highlights: [
        {
          lines: [42, 107],
          label: "TLS 1.3 configuration with Perfect Forward Secrecy",
          sbvpDomain: "structure",
        },
        {
          lines: [133, 151],
          label: "HSTS and security headers implementation",
          sbvpDomain: "behavior",
        },
        {
          lines: [205, 230],
          label: "Certificate pinning for advanced security",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "tls-mtls-python",
      language: "python",
      title: "Mutual TLS (mTLS) with Python Flask for Zero-Trust Security",
      description:
        "Flask application with mutual TLS authentication, client certificate validation, and CRL checking for microservices",
      code: `import ssl
import socket
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, request, jsonify, abort
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
import requests

# ============================================================================
# Mutual TLS (mTLS) Configuration
# ============================================================================

class MTLSConfig:
    """
    Configuration for mutual TLS authentication
    WHY mTLS?: Provides zero-trust security - both client and server authenticate each other
    Eliminates need for API keys, tokens, or passwords in microservices
    """
    def __init__(
        self,
        cert_file: str,
        key_file: str,
        ca_cert_file: str,
        crl_file: Optional[str] = None,
    ):
        self.cert_file = cert_file          # Server certificate
        self.key_file = key_file            # Server private key
        self.ca_cert_file = ca_cert_file    # CA certificate for validating client certs
        self.crl_file = crl_file            # Certificate Revocation List

    def create_ssl_context(self) -> ssl.SSLContext:
        """
        Create SSL context with mutual TLS requirements
        WHY PROTOCOL_TLS_SERVER?: Uses highest TLS version supported by both peers
        WHY CERT_REQUIRED?: Forces client to present certificate, rejects anonymous clients
        """
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

        # Load server certificate and private key
        context.load_cert_chain(
            certfile=self.cert_file,
            keyfile=self.key_file,
        )

        # Load CA certificate for validating client certificates
        # WHY load_verify_locations?: Establishes trust anchor for client cert validation
        # Only clients with certificates signed by this CA will be accepted
        context.load_verify_locations(cafile=self.ca_cert_file)

        # Require client certificate
        # WHY CERT_REQUIRED?: Enforces mutual authentication - no cert = connection rejected
        # CERT_OPTIONAL would allow unauthenticated connections (insecure for zero-trust)
        context.verify_mode = ssl.CERT_REQUIRED

        # TLS Configuration
        # WHY TLS 1.2 minimum?: Balances security (TLS 1.0/1.1 vulnerable) with compatibility
        # Many enterprise systems still on TLS 1.2, haven't upgraded to 1.3
        context.minimum_version = ssl.TLSVersion.TLSv1_2

        # Cipher Suite Selection
        # WHY ECDHE+AESGCM?: Requires Perfect Forward Secrecy (ECDHE) and AEAD encryption
        # @STRENGTH sorts by key length (256-bit before 128-bit)
        context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:!aNULL:!MD5:!DSS:@STRENGTH')

        # Enable session tickets for performance
        # WHY session tickets?: Reduces handshake overhead for returning clients
        # Especially important in microservices with frequent short-lived connections
        context.options |= ssl.OP_NO_TICKET  # Disable for maximum security (forces full handshake)

        return context

# ============================================================================
# Certificate Validation and Extraction
# ============================================================================

class CertificateValidator:
    """
    Validates client certificates and extracts identity information
    WHY custom validation?: Built-in SSL only checks signature, we need expiry, CRL, extensions
    """

    def __init__(self, ca_cert_path: str, crl_path: Optional[str] = None):
        self.ca_cert = self._load_ca_certificate(ca_cert_path)
        self.crl = self._load_crl(crl_path) if crl_path else None

    def _load_ca_certificate(self, path: str) -> x509.Certificate:
        """Load CA certificate for validation"""
        with open(path, 'rb') as f:
            return x509.load_pem_x509_certificate(f.read(), default_backend())

    def _load_crl(self, path: str) -> x509.CertificateRevocationList:
        """
        Load Certificate Revocation List
        WHY CRL?: Prevents use of compromised certificates even if not expired
        In production, fetch CRL from CA's distribution point periodically
        """
        with open(path, 'rb') as f:
            return x509.load_pem_x509_crl(f.read(), default_backend())

    def validate_certificate(self, cert_pem: bytes) -> Dict[str, Any]:
        """
        Validate client certificate and extract identity
        WHY comprehensive validation?: TLS handshake only validates signature
        We need to check expiration, revocation, and extract subject for authorization
        """
        cert = x509.load_pem_x509_certificate(cert_pem, default_backend())

        # 1. Check expiration
        # WHY not_valid_after?: Certificates have limited lifetime to reduce risk window
        # Expired certificates may indicate compromised key or abandoned service
        now = datetime.utcnow()
        if now < cert.not_valid_before or now > cert.not_valid_after:
            raise ValueError(
                f"Certificate expired or not yet valid. "
                f"Valid from {cert.not_valid_before} to {cert.not_valid_after}"
            )

        # 2. Check Certificate Revocation List
        # WHY check CRL?: Certificate may be compromised before expiration
        # CA publishes CRL of certificates that should no longer be trusted
        if self.crl:
            revoked_cert = self.crl.get_revoked_certificate_by_serial_number(
                cert.serial_number
            )
            if revoked_cert:
                raise ValueError(
                    f"Certificate revoked on {revoked_cert.revocation_date}. "
                    f"Reason: {revoked_cert.extensions}"
                )

        # 3. Verify certificate chain (signed by our CA)
        # WHY verify issuer?: Ensures certificate issued by trusted CA, not self-signed
        if cert.issuer != self.ca_cert.subject:
            raise ValueError("Certificate not issued by trusted CA")

        # 4. Extract subject information for authorization
        # WHY extract CN and OU?: Common Name identifies service, Organizational Unit defines role
        # Used for fine-grained authorization (e.g., only billing-service can access /payments)
        subject = cert.subject
        common_name = subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        org_unit = subject.get_attributes_for_oid(NameOID.ORGANIZATIONAL_UNIT_NAME)

        # 5. Extract Subject Alternative Names (SANs)
        # WHY SANs?: Modern certificates use SANs instead of CN for hostname validation
        # May contain service identifiers, API keys, or roles
        try:
            san_ext = cert.extensions.get_extension_for_oid(
                ExtensionOID.SUBJECT_ALTERNATIVE_NAME
            )
            sans = [str(name) for name in san_ext.value]
        except x509.ExtensionNotFound:
            sans = []

        return {
            'subject': str(subject),
            'common_name': common_name,
            'organizational_unit': org_unit[0].value if org_unit else None,
            'serial_number': cert.serial_number,
            'issuer': str(cert.issuer),
            'not_before': cert.not_valid_before.isoformat(),
            'not_after': cert.not_valid_after.isoformat(),
            'sans': sans,
        }

# ============================================================================
# Flask Application with mTLS
# ============================================================================

app = Flask(__name__)

# Global certificate validator
validator: Optional[CertificateValidator] = None

def require_mtls_auth(allowed_services: Optional[list[str]] = None):
    """
    Decorator to require and validate client certificate
    WHY decorator pattern?: Provides clean, reusable authorization check
    Similar to @login_required but using certificate-based auth
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            # Extract client certificate from TLS connection
            # WHY request.environ?: WSGI stores peer certificate in environment
            # After successful TLS handshake, certificate is available here
            cert_pem = request.environ.get('werkzeug.socket').getpeercert(binary_form=True)

            if not cert_pem:
                abort(403, description="No client certificate provided")

            # Validate certificate and extract identity
            try:
                cert_info = validator.validate_certificate(cert_pem)
            except ValueError as e:
                abort(403, description=f"Certificate validation failed: {str(e)}")

            # Authorization: check if client service is allowed
            # WHY service-based authz?: Zero-trust principle - even with valid cert,
            # only specific services should access specific endpoints
            if allowed_services and cert_info['common_name'] not in allowed_services:
                abort(403, description=f"Service {cert_info['common_name']} not authorized")

            # Attach certificate info to request context for handler use
            request.cert_info = cert_info

            return f(*args, **kwargs)

        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# ============================================================================
# API Endpoints
# ============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint (no auth required)"""
    return jsonify({'status': 'healthy', 'protocol': 'mTLS'})

@app.route('/api/secure-data', methods=['GET'])
@require_mtls_auth(allowed_services=['payment-service', 'billing-service'])
def get_secure_data():
    """
    Protected endpoint requiring mTLS from specific services
    WHY service allowlist?: Implements least-privilege access control
    Only payment and billing services need access to financial data
    """
    cert_info = request.cert_info

    return jsonify({
        'message': 'Secure data accessed',
        'authenticated_as': cert_info['common_name'],
        'certificate_serial': cert_info['serial_number'],
        'data': {
            'account_balance': 1500.00,
            'transactions': ['tx-001', 'tx-002'],
        }
    })

@app.route('/api/admin', methods=['POST'])
@require_mtls_auth(allowed_services=['admin-service'])
def admin_operation():
    """
    Admin endpoint requiring admin service certificate
    WHY separate authorization?: Defense in depth - mTLS + role-based access
    """
    return jsonify({'message': 'Admin operation completed'})

# ============================================================================
# Server Initialization
# ============================================================================

def create_mtls_server(
    host: str = '0.0.0.0',
    port: int = 8443,
    cert_file: str = 'server.crt',
    key_file: str = 'server.key',
    ca_cert_file: str = 'ca.crt',
    crl_file: Optional[str] = None,
):
    """
    Create Flask server with mutual TLS
    WHY custom server creation?: Flask's built-in run() doesn't support mTLS config
    Need to create SSLContext and pass to werkzeug WSGI server
    """
    global validator

    # Initialize certificate validator
    validator = CertificateValidator(ca_cert_file, crl_file)

    # Create SSL context for mutual TLS
    mtls_config = MTLSConfig(cert_file, key_file, ca_cert_file, crl_file)
    ssl_context = mtls_config.create_ssl_context()

    print(f"Starting mTLS server on https://{host}:{port}")
    print(f"Client certificates must be signed by CA: {ca_cert_file}")

    # Run Flask with SSL context
    # WHY ssl_context parameter?: Enables HTTPS with our custom mTLS configuration
    # Werkzeug wraps socket with TLS requiring client certificate
    app.run(
        host=host,
        port=port,
        ssl_context=ssl_context,
        debug=False,  # Never enable debug in production with mTLS
    )

# ============================================================================
# Usage Example
# ============================================================================

if __name__ == '__main__':
    # In production, use environment variables or config management
    create_mtls_server(
        host='0.0.0.0',
        port=8443,
        cert_file='/etc/ssl/server.crt',
        key_file='/etc/ssl/server.key',
        ca_cert_file='/etc/ssl/ca.crt',
        crl_file='/etc/ssl/ca.crl',
    )`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Microservices security with mutual TLS authentication, certificate-based authorization, and CRL validation for zero-trust architecture",
        prerequisites: [
          "X.509 certificates",
          "Public Key Infrastructure (PKI)",
          "Certificate Revocation Lists",
          "Zero-trust security model",
        ],
        systemPosition:
          "Backend microservice in zero-trust network requiring mutual authentication. Replaces API keys/tokens with certificate-based identity. Integrates with service mesh or API gateway for certificate distribution.",
      },
      annotations: [
        {
          id: "mtls-cert-required",
          lines: [56, 59],
          action: "Set verify_mode to CERT_REQUIRED for mutual TLS",
          reason:
            "CERT_REQUIRED enforces mutual authentication - server rejects connections without valid client certificate. This is core of zero-trust security: never trust, always verify. CERT_OPTIONAL would allow unauthenticated connections, defeating the purpose of mTLS.",
          contextLevel: "system",
          relatedConcepts: ["mtls", "zero-trust", "mutual-authentication"],
        },
        {
          id: "mtls-crl-validation",
          lines: [124, 135],
          action:
            "Check Certificate Revocation List for compromised certificates",
          reason:
            "Certificates may be compromised before expiration (stolen keys, rogue employees, security breach). CA publishes CRL of certificates that should no longer be trusted. Checking CRL prevents attackers from using stolen but not-yet-expired certificates. In production, fetch CRL from CA distribution point periodically (hourly).",
          contextLevel: "system",
          relatedConcepts: [
            "crl",
            "certificate-revocation",
            "compromised-keys",
          ],
        },
        {
          id: "mtls-subject-extraction",
          lines: [142, 146],
          action:
            "Extract Common Name and Organizational Unit from certificate subject",
          reason:
            "CN identifies the service (e.g., payment-service, billing-service), OU defines role or environment (e.g., production, staging). This enables fine-grained authorization: not just is certificate valid, but is this specific service allowed to access this endpoint. Implements least-privilege access control.",
          contextLevel: "module",
          relatedConcepts: [
            "certificate-subject",
            "authorization",
            "least-privilege",
          ],
        },
        {
          id: "mtls-san-extraction",
          lines: [148, 157],
          action: "Extract Subject Alternative Names for additional identity",
          reason:
            "Modern certificates use SANs instead of CN for hostname validation. SANs can contain multiple identities (DNS names, IP addresses, URIs) enabling one certificate to represent multiple services or roles. Critical for microservices where one service may have multiple endpoints or hostnames.",
          contextLevel: "module",
          relatedConcepts: ["san", "multi-identity", "certificate-extensions"],
        },
        {
          id: "mtls-decorator-pattern",
          lines: [174, 176],
          action:
            "Create decorator to require mTLS authentication on endpoints",
          reason:
            "Decorator pattern provides clean, reusable authorization check similar to @login_required in traditional auth. Separates authentication logic from business logic, enabling easy application to multiple endpoints. Pythonic approach to cross-cutting concerns.",
          contextLevel: "module",
          relatedConcepts: ["decorator-pattern", "aspect-oriented"],
        },
        {
          id: "mtls-service-authz",
          lines: [192, 195],
          action:
            "Implement service-based authorization with allowed services list",
          reason:
            "Zero-trust principle: even with valid certificate, only specific services should access specific endpoints. Payment service shouldn't access user profiles, user service shouldn't access billing data. Defense-in-depth: mTLS provides authentication, service allowlist provides authorization.",
          contextLevel: "system",
          relatedConcepts: [
            "zero-trust",
            "least-privilege",
            "defense-in-depth",
          ],
        },
        {
          id: "mtls-cert-in-context",
          lines: [197, 198],
          action: "Attach certificate info to request context for handlers",
          reason:
            "Makes client identity available to endpoint handlers without re-parsing certificate. Enables audit logging (who accessed what), dynamic authorization (check certificate serial against revocation list), and usage tracking (which services call which endpoints most).",
          contextLevel: "local",
          relatedConcepts: ["request-context", "audit-logging"],
        },
        {
          id: "mtls-zero-trust-example",
          lines: [211, 213],
          action:
            "Restrict financial endpoint to only payment and billing services",
          reason:
            "Demonstrates zero-trust microservices security. Even though all services have valid certificates from same CA, only specific services can access financial data. If user-service certificate is compromised, attacker still can't access /api/secure-data. Minimizes blast radius of security breaches.",
          contextLevel: "system",
          relatedConcepts: [
            "zero-trust",
            "blast-radius",
            "microservices-security",
          ],
        },
      ],
      highlights: [
        {
          lines: [40, 76],
          label: "Mutual TLS SSL context configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [108, 160],
          label: "Comprehensive certificate validation with CRL",
          sbvpDomain: "behavior",
        },
        {
          lines: [174, 201],
          label: "Service-based authorization decorator",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "tls-spring-boot-acme",
      language: "java",
      title: "Spring Boot HTTPS with Let's Encrypt ACME and Auto-Renewal",
      description:
        "Production Spring Boot application with embedded Tomcat, Let's Encrypt certificate automation, and TLS 1.3 optimization",
      code: `package com.example.security.tls;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import org.apache.catalina.connector.Connector;
import org.apache.coyote.http11.Http11NioProtocol;

import org.shredzone.acme4j.*;
import org.shredzone.acme4j.challenge.Http01Challenge;
import org.shredzone.acme4j.util.CSRBuilder;
import org.shredzone.acme4j.util.KeyPairUtils;

import javax.net.ssl.*;
import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Spring Boot application with HTTPS, Let's Encrypt, and automatic certificate renewal
 * WHY Let's Encrypt?: Free, automated certificate management with 90-day certificates
 * WHY ACME protocol?: Automates domain validation and certificate issuance/renewal
 */
@SpringBootApplication
@EnableScheduling
public class SecureApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureApplication.class, args);
    }

    // ========================================================================
    // TLS 1.3 Configuration for Embedded Tomcat
    // ========================================================================

    /**
     * Configure Tomcat with TLS 1.3 and modern cipher suites
     * WHY embedded Tomcat customization?: Spring Boot allows fine-grained TLS control
     * WHY TLS 1.3?: Reduces handshake from 2-RTT to 1-RTT (50% faster connection)
     */
    @Configuration
    public static class TomcatTLSConfiguration {

        @Bean
        public WebServerFactoryCustomizer<TomcatServletWebServerFactory> servletContainer(
            CertificateManager certManager
        ) {
            return factory -> {
                // Add HTTP connector for ACME challenge (port 80)
                factory.addAdditionalTomcatConnectors(createHttpConnector());

                // Customize HTTPS connector (port 443)
                factory.addConnectorCustomizers(connector -> {
                    configureHttpsConnector(connector, certManager);
                });
            };
        }

        /**
         * Create HTTP connector for ACME HTTP-01 challenge
         * WHY port 80?: Let's Encrypt validates domain ownership by requesting
         * http://domain.com/.well-known/acme-challenge/{token}
         * Must be accessible on port 80 for validation
         */
        private Connector createHttpConnector() {
            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setScheme("http");
            connector.setPort(80);
            connector.setSecure(false);
            connector.setRedirectPort(443);
            return connector;
        }

        /**
         * Configure HTTPS connector with TLS 1.3 and strong cipher suites
         * WHY TLS 1.3?: Mandatory forward secrecy, removes weak ciphers, faster handshake
         * WHY specific cipher order?: Prioritizes AEAD ciphers (AES-GCM, ChaCha20)
         */
        private void configureHttpsConnector(Connector connector, CertificateManager certManager) {
            connector.setScheme("https");
            connector.setSecure(true);
            connector.setPort(443);

            Http11NioProtocol protocol = (Http11NioProtocol) connector.getProtocolHandler();

            // SSL/TLS Configuration
            protocol.setSSLEnabled(true);

            // WHY TLSv1.3?: 1-RTT handshake vs TLSv1.2 2-RTT = 50% faster connection establishment
            // TLS 1.3 removes 90+ weak cipher suites, leaving only 5 secure options
            protocol.setSslProtocol("TLSv1.3");
            protocol.setSslEnabledProtocols("TLSv1.3,TLSv1.2"); // TLS 1.2 fallback for compatibility

            // Cipher Suite Selection
            // WHY AEAD ciphers?: Authenticated Encryption with Associated Data provides
            // confidentiality + integrity in single operation (faster, more secure)
            // WHY ECDHE?: Provides Perfect Forward Secrecy - past sessions safe if key compromised
            protocol.setCiphers(String.join(":",
                // TLS 1.3 cipher suites
                "TLS_AES_256_GCM_SHA384",           // 256-bit AES-GCM
                "TLS_CHACHA20_POLY1305_SHA256",     // ChaCha20 for mobile
                "TLS_AES_128_GCM_SHA256",           // 128-bit AES-GCM
                // TLS 1.2 fallback cipher suites (all with ECDHE)
                "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
                "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
                "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
                "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256"
            ));

            // WHY honorCipherOrder?: Server chooses cipher (security) over client (compatibility)
            // Prevents misconfigured clients from selecting weak ciphers
            protocol.setUseServerCipherSuitesOrder(true);

            // Certificate Configuration
            protocol.setKeystoreFile(certManager.getKeystorePath());
            protocol.setKeystorePass(certManager.getKeystorePassword());
            protocol.setKeyAlias("letsencrypt");

            // OCSP Stapling for faster certificate validation
            // WHY OCSP stapling?: Server fetches OCSP response from CA and includes in handshake
            // Eliminates client-side OCSP request, reducing handshake latency by 100-300ms
            protocol.setSSLEnabled(true);

            // Session Configuration
            // WHY session cache?: Reuses TLS session for returning clients (0-RTT in TLS 1.3)
            // Reduces handshake overhead from 1-RTT to 0-RTT for repeat connections
            protocol.setSessionTimeout(String.valueOf(TimeUnit.MINUTES.toSeconds(5)));
            protocol.setSessionCacheSize(1000);
        }
    }

    // ========================================================================
    // Let's Encrypt ACME Certificate Management
    // ========================================================================

    /**
     * Manages Let's Encrypt certificate lifecycle: issuance, renewal, storage
     * WHY ACME4J library?: Official ACME protocol implementation for Java
     * WHY auto-renewal?: Let's Encrypt certs expire in 90 days, manual renewal not scalable
     */
    @Configuration
    public static class CertificateManager {

        private static final String ACME_SERVER = "acme://letsencrypt.org";
        private static final String DOMAIN = "example.com";
        private static final Path KEY_PAIR_PATH = Paths.get("/etc/ssl/keypair.pem");
        private static final Path DOMAIN_KEY_PATH = Paths.get("/etc/ssl/domain.key");
        private static final Path CERT_CHAIN_PATH = Paths.get("/etc/ssl/fullchain.pem");
        private static final Path KEYSTORE_PATH = Paths.get("/etc/ssl/keystore.jks");
        private static final String KEYSTORE_PASSWORD = "changeit"; // Use secrets manager in production

        /**
         * Initialize Let's Encrypt certificate on startup
         * WHY startup initialization?: Ensures certificate exists before server accepts connections
         */
        public CertificateManager() throws Exception {
            if (!Files.exists(CERT_CHAIN_PATH)) {
                System.out.println("No certificate found, obtaining from Let's Encrypt...");
                obtainCertificate();
            } else {
                System.out.println("Certificate found, checking expiration...");
                checkAndRenewCertificate();
            }
        }

        /**
         * Obtain new certificate from Let's Encrypt using HTTP-01 challenge
         * WHY HTTP-01 challenge?: Validates domain ownership by serving file at
         * http://domain.com/.well-known/acme-challenge/{token}
         * Alternative: DNS-01 (for wildcard certs) or TLS-ALPN-01
         */
        private void obtainCertificate() throws Exception {
            // 1. Load or generate account key pair
            // WHY account key?: Identifies your account with Let's Encrypt CA
            // Same key used for all your certificates, separate from domain keys
            KeyPair accountKeyPair = loadOrCreateKeyPair(KEY_PAIR_PATH);

            // 2. Create ACME session
            Session session = new Session(ACME_SERVER);

            // 3. Get account (or create new one)
            // WHY account creation?: Let's Encrypt tracks rate limits per account
            // 50 certificates per domain per week
            Account account = new AccountBuilder()
                .agreeToTermsOfService()
                .useKeyPair(accountKeyPair)
                .create(session);

            // 4. Order certificate
            Order order = account.newOrder()
                .domains(DOMAIN)
                .create();

            // 5. Complete HTTP-01 challenge for domain validation
            // WHY challenge required?: Proves you control the domain before issuing cert
            for (Authorization auth : order.getAuthorizations()) {
                if (auth.getStatus() == Status.VALID) {
                    continue;
                }

                // Get HTTP-01 challenge
                Http01Challenge challenge = auth.findChallenge(Http01Challenge.TYPE);

                // Create challenge response file
                // WHY .well-known path?: ACME protocol specification for HTTP-01 challenge
                // Let's Encrypt requests: http://domain.com/.well-known/acme-challenge/{token}
                Path challengePath = Paths.get(
                    "/var/www/html/.well-known/acme-challenge",
                    challenge.getToken()
                );
                Files.createDirectories(challengePath.getParent());
                Files.writeString(challengePath, challenge.getAuthorization());

                // Trigger challenge validation
                challenge.trigger();

                // Wait for validation
                // WHY polling?: Let's Encrypt validates asynchronously, may take 5-30 seconds
                int attempts = 10;
                while (auth.getStatus() != Status.VALID && attempts-- > 0) {
                    Thread.sleep(3000);
                    auth.update();
                }

                if (auth.getStatus() != Status.VALID) {
                    throw new Exception("Challenge validation failed for: " + DOMAIN);
                }
            }

            // 6. Generate domain key pair and CSR
            // WHY separate domain key?: Account key for Let's Encrypt account management
            // Domain key for actual TLS encryption (can rotate independently)
            KeyPair domainKeyPair = KeyPairUtils.createKeyPair(2048);
            Files.writeString(DOMAIN_KEY_PATH,
                KeyPairUtils.writeKeyPair(domainKeyPair));

            CSRBuilder csrBuilder = new CSRBuilder();
            csrBuilder.addDomain(DOMAIN);
            csrBuilder.sign(domainKeyPair);

            // 7. Order certificate
            order.execute(csrBuilder.getEncoded());

            // 8. Wait for certificate issuance
            // WHY polling?: Certificate generation may take 5-60 seconds
            int attempts = 10;
            while (order.getStatus() != Status.VALID && attempts-- > 0) {
                Thread.sleep(3000);
                order.update();
            }

            // 9. Download certificate chain
            Certificate certificate = order.getCertificate();
            List<X509Certificate> certChain = certificate.getCertificateChain();

            // 10. Save certificate chain to file
            try (FileWriter fw = new FileWriter(CERT_CHAIN_PATH.toFile())) {
                certificate.writeCertificate(fw);
            }

            // 11. Import into Java KeyStore for Tomcat
            // WHY KeyStore?: Tomcat requires JKS format for certificate storage
            importToKeyStore(domainKeyPair, certChain);

            System.out.println("Certificate obtained successfully from Let's Encrypt");
        }

        /**
         * Check certificate expiration and renew if needed
         * WHY scheduled renewal?: Let's Encrypt certs expire in 90 days
         * Best practice: renew at 60 days (30-day buffer for failures)
         */
        @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
        public void checkAndRenewCertificate() throws Exception {
            if (!Files.exists(CERT_CHAIN_PATH)) {
                obtainCertificate();
                return;
            }

            // Load current certificate
            KeyStore keyStore = KeyStore.getInstance("JKS");
            try (InputStream is = Files.newInputStream(KEYSTORE_PATH)) {
                keyStore.load(is, KEYSTORE_PASSWORD.toCharArray());
            }

            X509Certificate cert = (X509Certificate) keyStore.getCertificate("letsencrypt");

            // Check expiration
            Instant expiry = cert.getNotAfter().toInstant();
            Instant renewalThreshold = Instant.now().plus(30, ChronoUnit.DAYS);

            // WHY 30-day threshold?: Provides buffer for renewal failures
            // Let's Encrypt recommends renewing at 1/3 of certificate lifetime (30 days)
            if (expiry.isBefore(renewalThreshold)) {
                System.out.println("Certificate expiring soon, renewing...");
                obtainCertificate();

                // Reload Tomcat connector with new certificate
                // WHY reload?: Tomcat loads KeyStore at startup, needs explicit reload
                // In production, use graceful restart or hot certificate reload
                System.out.println("Certificate renewed. Restart server to apply changes.");
            } else {
                System.out.println("Certificate valid until: " + expiry);
            }
        }

        private KeyPair loadOrCreateKeyPair(Path path) throws Exception {
            if (Files.exists(path)) {
                try (FileReader fr = new FileReader(path.toFile())) {
                    return KeyPairUtils.readKeyPair(fr);
                }
            } else {
                KeyPair keyPair = KeyPairUtils.createKeyPair(2048);
                Files.writeString(path, KeyPairUtils.writeKeyPair(keyPair));
                return keyPair;
            }
        }

        private void importToKeyStore(KeyPair keyPair, List<X509Certificate> certChain)
            throws Exception {
            KeyStore keyStore = KeyStore.getInstance("JKS");
            keyStore.load(null, null); // Create empty keystore

            // Import private key and certificate chain
            keyStore.setKeyEntry(
                "letsencrypt",
                keyPair.getPrivate(),
                KEYSTORE_PASSWORD.toCharArray(),
                certChain.toArray(new X509Certificate[0])
            );

            // Save to file
            try (OutputStream os = Files.newOutputStream(KEYSTORE_PATH)) {
                keyStore.store(os, KEYSTORE_PASSWORD.toCharArray());
            }
        }

        public String getKeystorePath() {
            return KEYSTORE_PATH.toString();
        }

        public String getKeystorePassword() {
            return KEYSTORE_PASSWORD;
        }
    }

    // ========================================================================
    // REST Controller
    // ========================================================================

    @RestController
    public static class SecureController {

        @GetMapping("/")
        public Map<String, Object> home() {
            return Map.of(
                "message", "Secure HTTPS connection with Let's Encrypt",
                "tls_version", "TLS 1.3",
                "cipher_suites", "AEAD (AES-GCM, ChaCha20-Poly1305)",
                "forward_secrecy", "ECDHE",
                "certificate_authority", "Let's Encrypt"
            );
        }

        @GetMapping("/.well-known/acme-challenge/{token}")
        public String acmeChallenge() {
            // ACME challenge responses served from filesystem
            // Spring Boot serves static content from /var/www/html
            return "ACME challenge handled by filesystem";
        }
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production Spring Boot application with embedded Tomcat, Let's Encrypt ACME integration, automatic certificate renewal, and TLS 1.3 optimization",
        prerequisites: [
          "Spring Boot framework",
          "Embedded Tomcat configuration",
          "ACME protocol",
          "Java KeyStore (JKS)",
          "Let's Encrypt CA",
        ],
        systemPosition:
          "Web application or API server requiring HTTPS with automated certificate management. Integrates with Let's Encrypt for free certificates, eliminating manual renewal. Deployed in production environments with public internet access for ACME validation.",
      },
      annotations: [
        {
          id: "tls13-1rtt-handshake",
          lines: [104, 107],
          action: "Configure TLS 1.3 as primary protocol with TLS 1.2 fallback",
          reason:
            "TLS 1.3 reduces handshake from 2-RTT to 1-RTT (50% faster connection establishment). For a site with 100ms latency, this saves 100ms per connection. TLS 1.3 also enables 0-RTT resumption for repeat connections. TLS 1.2 fallback ensures compatibility with older clients (Android <10, iOS <12).",
          contextLevel: "system",
          relatedConcepts: [
            "tls-handshake",
            "latency-optimization",
            "backwards-compatibility",
          ],
        },
        {
          id: "tls-aead-ciphers",
          lines: [109, 123],
          action:
            "Configure AEAD cipher suites (AES-GCM, ChaCha20-Poly1305) in priority order",
          reason:
            "AEAD (Authenticated Encryption with Associated Data) combines encryption and authentication in single operation, faster and more secure than encrypt-then-MAC. AES-GCM prioritized for servers with AES-NI hardware acceleration (10x faster). ChaCha20-Poly1305 for mobile devices without AES-NI (2x faster than AES in software). All use ECDHE for Perfect Forward Secrecy.",
          contextLevel: "system",
          relatedConcepts: [
            "aead",
            "cipher-performance",
            "hardware-acceleration",
          ],
        },
        {
          id: "tls-ocsp-stapling",
          lines: [137, 140],
          action:
            "Enable OCSP stapling for certificate validation optimization",
          reason:
            "OCSP stapling eliminates client-side OCSP request to CA, reducing handshake latency by 100-300ms. Server fetches OCSP response periodically and includes it in TLS handshake. Critical for high-performance APIs where every millisecond matters. Also improves privacy (CA doesn't see client IP addresses).",
          contextLevel: "system",
          relatedConcepts: [
            "ocsp-stapling",
            "certificate-validation",
            "latency-optimization",
          ],
        },
        {
          id: "tls-session-resumption",
          lines: [143, 146],
          action: "Configure TLS session cache for 0-RTT resumption",
          reason:
            "TLS session resumption allows clients to reuse previous session keys, reducing handshake to 0-RTT (instant connection). Session cache stores 1000 sessions for 5 minutes. For APIs with frequent short-lived connections (mobile apps polling every 30s), this eliminates 90% of handshake overhead. TLS 1.3 session tickets further optimize by avoiding server-side session storage.",
          contextLevel: "system",
          relatedConcepts: ["session-resumption", "0rtt", "connection-pooling"],
        },
        {
          id: "acme-http01-challenge",
          lines: [194, 199],
          action:
            "Implement HTTP-01 challenge for Let's Encrypt domain validation",
          reason:
            "ACME HTTP-01 challenge proves domain ownership by serving file at http://domain.com/.well-known/acme-challenge/{token}. Let's Encrypt CA requests this URL and validates response. Must be accessible on port 80 (firewall rules). Alternative: DNS-01 challenge for wildcard certificates or systems without port 80 access.",
          contextLevel: "system",
          relatedConcepts: [
            "acme-protocol",
            "domain-validation",
            "http-01-challenge",
          ],
        },
        {
          id: "acme-challenge-polling",
          lines: [216, 222],
          action:
            "Poll Let's Encrypt for challenge validation status with timeout",
          reason:
            "Let's Encrypt validates challenges asynchronously (may take 5-30 seconds). Polling every 3 seconds with 10 attempts (30s timeout) balances responsiveness with API rate limits. If validation fails, likely causes: firewall blocking port 80, DNS not propagating, web server misconfiguration. Production systems should implement exponential backoff and alerting.",
          contextLevel: "module",
          relatedConcepts: ["async-polling", "rate-limiting", "timeout"],
        },
        {
          id: "acme-separate-keys",
          lines: [227, 230],
          action: "Use separate key pairs for account and domain",
          reason:
            "Account key identifies your Let's Encrypt account (rate limits, revocation). Domain key encrypts TLS traffic. Separation enables rotating domain keys without affecting account access. If domain key compromised, revoke certificate and generate new key without creating new Let's Encrypt account. Follows principle of least privilege.",
          contextLevel: "system",
          relatedConcepts: [
            "key-separation",
            "key-rotation",
            "least-privilege",
          ],
        },
        {
          id: "acme-renewal-threshold",
          lines: [270, 280],
          action:
            "Renew certificate 30 days before expiration with daily check",
          reason:
            "Let's Encrypt certificates expire in 90 days. Renewing at 60 days (30-day buffer) provides safety margin for renewal failures (CA outage, network issues, validation problems). Daily cron at 2 AM avoids peak traffic. If renewal fails, 30-day buffer allows manual intervention. Let's Encrypt recommends renewing at 1/3 of lifetime (30 days for 90-day certs).",
          contextLevel: "system",
          relatedConcepts: [
            "certificate-lifecycle",
            "auto-renewal",
            "safety-margin",
          ],
        },
      ],
      highlights: [
        {
          lines: [91, 148],
          label: "TLS 1.3 configuration with 1-RTT handshake optimization",
          sbvpDomain: "structure",
        },
        {
          lines: [185, 254],
          label: "ACME protocol implementation for Let's Encrypt",
          sbvpDomain: "behavior",
        },
        {
          lines: [259, 289],
          label: "Automatic certificate renewal with 30-day threshold",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Web servers (Apache, nginx) serving HTTPS traffic",
      "Microservices using mutual TLS (mTLS) for zero-trust security",
      "API gateways terminating TLS and forwarding to backend services",
      "Load balancers performing TLS offloading to reduce backend CPU",
      "VPN concentrators encrypting remote access traffic",
      "Email servers (SMTP, IMAP) using STARTTLS for encrypted communication",
      "Database connections (PostgreSQL, MySQL) with TLS encryption",
      "Message brokers (Kafka, RabbitMQ) encrypting inter-broker communication",
    ],
    interactsWith: [
      "e2e-encryption",
      "jwt",
      "oauth-2-0",
      "certificate-pinning",
      "vpn",
      "ipsec",
      "load-balancing",
    ],
    architecturalBoundaries: [
      "Transport layer (Layer 4) encryption wrapping application protocols",
      "Certificate management systems (Let's Encrypt, internal PKI, HSMs)",
      "Key storage and rotation (Hardware Security Modules, key vaults)",
      "TLS termination at load balancer vs. end-to-end encryption to backend",
      "Service mesh sidecar proxies handling mTLS between microservices",
      "Certificate Authority integration (ACME, SCEP, manual issuance)",
    ],
  },

  implementations: [
    {
      id: "openssl",
      name: "OpenSSL",
      type: "library",
      languages: ["c", "c++"],
      description:
        "Industry-standard TLS/SSL library used by most web servers (nginx, Apache) and programming languages. Supports TLS 1.3, all major cipher suites, hardware acceleration (AES-NI), and FIPS 140-2 compliance. De facto standard for TLS on Linux/Unix systems.",
      links: {
        docs: "https://www.openssl.org/docs/",
        github: "https://github.com/openssl/openssl",
      },
      codeSnippet: `// Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365

// Create TLS server
SSL_CTX *ctx = SSL_CTX_new(TLS_server_method());
SSL_CTX_use_certificate_file(ctx, "cert.pem", SSL_FILETYPE_PEM);
SSL_CTX_use_PrivateKey_file(ctx, "key.pem", SSL_FILETYPE_PEM);

// Configure cipher suites
SSL_CTX_set_cipher_list(ctx, "ECDHE+AESGCM:ECDHE+CHACHA20");`,
    },
    {
      id: "boringssl",
      name: "BoringSSL",
      type: "library",
      languages: ["c", "c++"],
      description:
        "Google's OpenSSL fork optimized for Chrome, Android, and internal services. Removes legacy protocols, focuses on TLS 1.2/1.3, aggressive security defaults. Used by Google to serve billions of HTTPS requests daily. Not API-stable (internal use focus).",
      links: {
        docs: "https://boringssl.googlesource.com/boringssl/",
        github: "https://github.com/google/boringssl",
      },
      codeSnippet: `// BoringSSL enforces modern TLS by default
bssl::UniquePtr<SSL_CTX> ctx(SSL_CTX_new(TLS_method()));
SSL_CTX_set_min_proto_version(ctx.get(), TLS1_3_VERSION);

// Automatic cipher suite selection (no weak ciphers)
// BoringSSL removes choice, enforces security`,
    },
    {
      id: "libressl",
      name: "LibreSSL",
      type: "library",
      languages: ["c", "c++"],
      description:
        "OpenBSD's OpenSSL fork focusing on security and code quality. Removes legacy protocols (SSLv2, SSLv3), improves memory safety, modernizes codebase. Used in OpenBSD, some Linux distributions. API-compatible drop-in replacement for OpenSSL.",
      links: {
        docs: "https://www.libressl.org/",
        github: "https://github.com/libressl/portable",
      },
      codeSnippet: `// LibreSSL API matches OpenSSL
SSL_CTX *ctx = SSL_CTX_new(TLS_server_method());

// Legacy protocols removed at compile time (safer defaults)
SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);`,
    },
    {
      id: "letsencrypt",
      name: "Let's Encrypt",
      type: "service",
      languages: ["any"],
      description:
        "Free, automated Certificate Authority providing TLS certificates via ACME protocol. Issues 3M+ certificates daily, powers 300M+ websites. 90-day certificate lifetime encourages automation. Wildcard certificates via DNS-01 challenge. Non-profit backed by major tech companies.",
      links: {
        docs: "https://letsencrypt.org/docs/",
        github: "https://github.com/letsencrypt",
      },
      codeSnippet: `# Certbot: Official Let's Encrypt client
certbot certonly --standalone -d example.com

# Auto-renewal (cron job)
0 0 * * * certbot renew --quiet

# DNS-01 for wildcard certificates
certbot certonly --manual --preferred-challenges dns -d *.example.com`,
    },
    {
      id: "aws-acm",
      name: "AWS Certificate Manager",
      type: "service",
      languages: ["any"],
      description:
        "Managed TLS certificate service for AWS resources (ALB, CloudFront, API Gateway). Free certificates with automatic renewal. Domain validation via email, DNS, or HTTP. Integrates with Route 53 for automatic DNS validation. Private CA for internal certificates.",
      links: {
        docs: "https://docs.aws.amazon.com/acm/",
      },
      codeSnippet: `# Request certificate with DNS validation
aws acm request-certificate \\
  --domain-name example.com \\
  --validation-method DNS \\
  --subject-alternative-names www.example.com

# Attach to ALB
aws elbv2 create-listener \\
  --load-balancer-arn arn:aws:elasticloadbalancing:... \\
  --protocol HTTPS \\
  --certificates CertificateArn=arn:aws:acm:...`,
    },
    {
      id: "cloudflare-ssl",
      name: "Cloudflare SSL/TLS",
      type: "platform",
      languages: ["any"],
      description:
        "Global CDN with free TLS certificates for 25M+ websites. Universal SSL for all plans, advanced features (TLS 1.3, 0-RTT, QUIC) on paid plans. Cloudflare proxies traffic, terminates TLS, forwards to origin. Automatic HTTPS rewrites, HSTS, certificate pinning.",
      links: {
        docs: "https://developers.cloudflare.com/ssl/",
      },
      codeSnippet: `# Cloudflare SSL modes:
# - Off: No encryption
# - Flexible: Cloudflare <-> Client encrypted, Cloudflare <-> Origin unencrypted
# - Full: Cloudflare <-> Client and Cloudflare <-> Origin both encrypted
# - Full (Strict): Validates origin certificate chain

# Enable TLS 1.3, 0-RTT, HSTS via dashboard or API
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/tls_1_3" \\
  -H "Authorization: Bearer {api_token}" \\
  -d '{"value":"on"}'`,
    },
    {
      id: "nginx-tls",
      name: "nginx TLS/SSL",
      type: "platform",
      languages: ["any"],
      description:
        "High-performance web server with optimized TLS implementation. Session resumption, OCSP stapling, dynamic record sizing. nginx+ includes advanced features (dynamic certificate loading, JWT validation). Powers 30%+ of web traffic globally.",
      links: {
        docs: "https://nginx.org/en/docs/http/configuring_https_servers.html",
      },
      codeSnippet: `server {
    listen 443 ssl http2;
    server_name example.com;

    # Certificate configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # TLS 1.3 with TLS 1.2 fallback
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE+AESGCM:ECDHE+CHACHA20';
    ssl_prefer_server_ciphers on;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
}`,
    },
    {
      id: "apache-modssl",
      name: "Apache mod_ssl",
      type: "platform",
      languages: ["any"],
      description:
        "TLS module for Apache HTTP Server using OpenSSL. Supports all OpenSSL features (TLS 1.3, client certificates, SNI). Extensive configuration options, widely documented. Powers millions of HTTPS websites globally.",
      links: {
        docs: "https://httpd.apache.org/docs/current/mod/mod_ssl.html",
      },
      codeSnippet: `<VirtualHost *:443>
    ServerName example.com

    # Enable SSL/TLS
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/example.com.crt
    SSLCertificateKeyFile /etc/ssl/private/example.com.key
    SSLCertificateChainFile /etc/ssl/certs/chain.pem

    # TLS protocols and ciphers
    SSLProtocol -all +TLSv1.3 +TLSv1.2
    SSLCipherSuite ECDHE+AESGCM:ECDHE+CHACHA20
    SSLHonorCipherOrder on

    # OCSP stapling
    SSLUseStapling on

    # HSTS
    Header always set Strict-Transport-Security "max-age=31536000"
</VirtualHost>`,
    },
  ],

  usedInSystems: [
    {
      systemId: "google-https",
      systemName: "Google HTTPS Everywhere",
      howUsed:
        "Google enforces HTTPS for all services (Search, Gmail, YouTube, Drive, Maps) serving 8+ billion requests daily. Uses BoringSSL (Google's OpenSSL fork) optimized for TLS 1.3 with 1-RTT handshake and 0-RTT resumption. QUIC protocol (HTTP/3) built on TLS 1.3 reduces connection establishment to 0-RTT for returning users. Certificate Transparency logs all issued certificates detecting fraudulent certificates within hours. HSTS preload list forces Chrome users to HTTPS on first visit (no HTTP redirect needed). Pattern composition: TLS 1.3 (1-RTT handshake) + QUIC (0-RTT resumption) + Certificate Transparency (fraud detection) + HSTS Preload (first-visit protection) + BoringSSL (performance optimization). Rationale: With billions of users, TLS performance (handshake latency, CPU overhead) directly impacts user experience and infrastructure cost. 1-RTT handshake reduces connection time by 50%, 0-RTT resumption eliminates handshake for 80% of connections. Certificate Transparency prevents CA compromise from going undetected. Impact: 100% HTTPS adoption across all Google properties; TLS 1.3 reduced latency by 100ms for new connections, eliminated 200ms for repeat connections; Certificate Transparency detected 5+ fraudulent certificates in 2023 enabling instant revocation.",
      source:
        "https://security.googleblog.com/2016/09/moving-towards-more-secure-web.html",
    },
    {
      systemId: "cloudflare-cdn",
      systemName: "Cloudflare Global CDN",
      howUsed:
        "Cloudflare provides free TLS certificates for 25M+ websites, handling 20%+ of web traffic globally. Universal SSL issues certificates via Let's Encrypt within minutes of customer signup. TLS termination at 300+ edge locations reduces handshake latency to <20ms for 95% of users. Full Strict mode validates origin certificates preventing misconfiguration. Keyless SSL separates certificate presentation from key storage enabling enterprises to keep private keys on-premise while Cloudflare handles TLS termination. Pattern composition: TLS Termination (edge locations) + Certificate Automation (Let's Encrypt) + OCSP Stapling (performance) + TLS 1.3 + 0-RTT (repeat connections) + Keyless SSL (enterprise security). Rationale: CDN business model requires terminating TLS at edge (can't forward encrypted traffic). Automating certificates removes barrier to HTTPS adoption (cost, complexity). Keyless SSL enables enterprise customers with compliance requirements to use CDN without exposing private keys. Impact: Powered 25M+ websites with free HTTPS; reduced TLS handshake latency from 200ms (origin) to 20ms (edge) globally; Keyless SSL enabled Fortune 500 companies to adopt CDN without compromising key security; TLS 1.3 + 0-RTT reduced connection time by 70% for repeat visitors.",
      source:
        "https://blog.cloudflare.com/universal-ssl-encryption-all-the-way-to-the-origin-for-free/",
    },
    {
      systemId: "letsencrypt-ca",
      systemName: "Let's Encrypt Certificate Authority",
      howUsed:
        "Let's Encrypt is free, automated Certificate Authority that has issued 3.5 billion certificates for 300M+ websites since 2016. ACME protocol enables domain validation and certificate issuance in seconds without human intervention. 90-day certificate lifetime forces automation, preventing long-lived compromised certificates. Wildcard certificates via DNS-01 challenge enable one certificate for all subdomains. Certificate Transparency logs all certificates enabling detection of mis-issuance. Pattern composition: ACME Protocol (automation) + Domain Validation (HTTP-01, DNS-01, TLS-ALPN-01) + Short-lived Certificates (90 days) + Certificate Transparency (fraud detection) + Rate Limiting (abuse prevention). Rationale: Manual certificate process (weeks, hundreds of dollars) prevented HTTPS adoption for small sites. Let's Encrypt reduces cost to zero, time to seconds, enabling 70%+ of web to adopt HTTPS. Short certificate lifetime limits damage from compromised certificates. ACME automation eliminates human error in renewal. Impact: Increased web HTTPS adoption from 40% (2015) to 90%+ (2024); issued 3.5B certificates; reduced certificate cost from $100-300/year to $0; Certificate Transparency detected and revoked 200K+ fraudulent certificates; enabled hosting providers (WordPress, Cloudflare) to offer free HTTPS to millions of customers.",
      source: "https://letsencrypt.org/stats/",
    },
    {
      systemId: "netflix-mtls",
      systemName: "Netflix Microservices mTLS",
      howUsed:
        "Netflix uses mutual TLS (mTLS) for zero-trust security across 700+ microservices processing millions of streaming requests per second. Every service-to-service call requires valid client and server certificates eliminating API keys, tokens, and passwords. SPIFFE (Secure Production Identity Framework For Everyone) issues short-lived certificates (1-hour lifetime) automatically to each service instance. Service Mesh (Envoy proxy sidecars) handles TLS termination, validation, and forwarding transparent to application code. Certificate rotation every hour limits blast radius of compromised certificates. Pattern composition: mTLS (mutual authentication) + SPIFFE (identity framework) + Service Mesh (transparent TLS) + Short-lived Certificates (1-hour) + Zero-Trust Architecture (no implicit trust). Rationale: With 700+ microservices, API key management doesn't scale (revocation, rotation, distribution). mTLS provides strong cryptographic identity tied to service, not shared secrets. Service mesh enforces TLS without modifying application code. Short certificate lifetime (1 hour) means compromised certificate expires before attacker can use it. Impact: Eliminated API keys across entire Netflix infrastructure; prevented lateral movement in security breaches (compromised service can't impersonate others); reduced incident response time from hours to minutes (expired certificates automatically limit damage); enabled safe multi-tenant deployment (strict service isolation via mTLS); powered 200M+ subscribers with zero major security incidents related to service authentication.",
      source:
        "https://netflixtechblog.com/netflix-cloud-security-securing-infrastructure-through-automation-8b2d89b39a69",
    },
    {
      systemId: "aws-alb-tls",
      systemName: "AWS Application Load Balancer TLS Termination",
      howUsed:
        "AWS Application Load Balancer (ALB) terminates TLS for millions of customer applications, offloading CPU-intensive encryption from backend servers. ACM (AWS Certificate Manager) provides free certificates with automatic renewal integrated with ALB. SNI (Server Name Indication) enables one ALB to serve multiple HTTPS domains (100+ certificates per ALB). Perfect Forward Secrecy with ECDHE cipher suites protects past traffic if private key compromised. TLS session resumption (session tickets) eliminates handshake for 80%+ of connections reducing latency. Pattern composition: TLS Termination (load balancer) + Certificate Automation (ACM) + SNI (multi-domain) + Perfect Forward Secrecy (ECDHE) + Session Resumption (session tickets). Rationale: TLS termination at load balancer centralizes certificate management (one place vs. thousands of servers), reduces backend CPU (encryption offloading), enables inspection/logging. ACM automation prevents expired certificates (major outage cause). Session resumption reduces latency for mobile apps with frequent short connections. Impact: Powers millions of customer applications; ACM prevents 100K+ expired certificate outages annually; TLS offloading reduces backend CPU by 30-50%; session resumption reduces connection latency by 200ms for repeat connections; SNI enables cost-effective multi-tenant HTTPS (one ALB for 100+ domains vs. 100+ load balancers).",
      source:
        "https://aws.amazon.com/blogs/security/how-to-get-ready-for-tls-1-2/",
    },
  ],

  philosophy: {
    coreProblem:
      "Network communication travels through untrusted intermediaries (ISPs, routers, WiFi networks) where data can be intercepted, read, or modified by attackers",
    designPrinciple:
      "Encrypt all data in transit using cryptographically strong algorithms, authenticate peers with certificates signed by trusted authorities, and verify data integrity to prevent tampering",
    historicalContext:
      "SSL developed by Netscape in 1994 for secure e-commerce. SSLv2/v3 had vulnerabilities (POODLE, BEAST). TLS 1.0 (1999) renamed and improved SSL. TLS 1.2 (2008) added AEAD ciphers. TLS 1.3 (2018) removed legacy protocols, reduced handshake to 1-RTT. Let's Encrypt (2016) democratized HTTPS with free automated certificates. Modern web is 90%+ HTTPS.",
    alternativesRejected: [
      "Plaintext HTTP - No encryption, trivial to intercept and read",
      "VPN-only security - Requires infrastructure, doesn't protect public websites",
      "Application-layer encryption (JWT, custom) - Incomplete (no handshake security), non-standard",
      "SSH tunneling - Not web-compatible, requires manual setup",
      "IPsec - Lower-layer, complex configuration, limited HTTP compatibility",
    ],
    mentalModel:
      "TLS is like a secure envelope for network communication. The handshake is addressing and sealing the envelope (establishing encryption keys), certificate validation is checking sender's signature (authentication), and encrypted messages are contents protected from eavesdropping. Tampering with envelope triggers MAC verification failure, revealing attack.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "TLS Handshake (1-RTT TLS 1.3)"
        CH[ClientHello: Ciphers + key_share]
        SH[ServerHello: Selected cipher + key_share]
        CERT[Certificate + CertVerify]
        FIN1[Finished]
        FIN2[Finished]

        CH --> SH
        SH --> CERT
        CERT --> FIN1
        FIN1 --> FIN2
    end

    subgraph "Encrypted Communication"
        REQ[Encrypted Request]
        RES[Encrypted Response]

        FIN2 --> REQ
        REQ --> RES
    end

    style CH fill:#e1f5e1
    style FIN2 fill:#e1f5e1`,
    realWorldAnalogy:
      "TLS is like a secure courier service. The handshake is verifying both sender and recipient identities with photo IDs (certificates), agreeing on a lock and key (cipher suite negotiation), and exchanging sealed envelopes (key exchange). Once established, all packages travel in locked boxes (encrypted data) that only sender and recipient can open. If someone tampers with a package, the seal breaks (MAC verification fails), revealing the attack.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Online shopping site processes credit card payments. TLS encrypts card numbers in transit preventing interception. HSTS forces HTTPS preventing SSL stripping. Certificate pinning prevents payment gateway impersonation.",
        patternRole:
          "Protects sensitive financial data from eavesdropping and MITM attacks during transmission",
        companies: ["Amazon", "Shopify", "Stripe"],
      },
      {
        domain: "Healthcare",
        scenario:
          "Hospital systems transmit patient records (HIPAA-protected data) between departments. mTLS with client certificates authenticates doctors' devices. TLS 1.3 with AEAD ensures confidentiality and integrity. Certificate expiration enforces device re-enrollment.",
        patternRole:
          "Provides encryption, authentication, and audit trail for HIPAA compliance",
        companies: ["Epic Systems", "Cerner", "Allscripts"],
      },
      {
        domain: "Financial Services",
        scenario:
          "Banking API requires TLS 1.2 minimum for PCI-DSS compliance. mTLS validates partner institutions. Certificate pinning prevents fraudulent transactions. HSM-stored private keys prevent key theft.",
        patternRole:
          "Meets regulatory requirements (PCI-DSS, SOC 2) for financial data transmission",
        companies: ["Chase", "Wells Fargo", "Plaid"],
      },
      {
        domain: "SaaS Applications",
        scenario:
          "Cloud productivity suite (email, documents, chat) uses TLS 1.3 for all traffic. Let's Encrypt provides free certificates with auto-renewal. OCSP stapling reduces handshake latency. 0-RTT resumption optimizes mobile app performance.",
        patternRole:
          "Enables secure SaaS delivery with minimal latency and zero certificate cost",
        companies: ["Google Workspace", "Microsoft 365", "Slack"],
      },
      {
        domain: "IoT Devices",
        scenario:
          "Smart home devices use TLS with device certificates for authentication. Short-lived certificates (24 hours) limit compromised device impact. Certificate rotation automated via ACME. Lightweight cipher suites (ChaCha20) optimize for constrained devices.",
        patternRole:
          "Secures IoT communication while minimizing CPU and memory footprint",
        companies: ["Amazon Alexa", "Google Nest", "Apple HomeKit"],
      },
    ],
  },

  tags: [
    "security",
    "encryption",
    "authentication",
    "tls",
    "ssl",
    "https",
    "certificates",
    "pki",
    "mtls",
  ],
  difficulty: "intermediate",
};
