import type { Pattern } from "../schema";

export const jWT: Pattern = {
  id: "jwt",
  slug: "jwt",
  corpusPath: "🔒 SECURITY → 🎟️ Token-Based Auth → 🎫 JWT",

  hierarchy: {
    quality: "security",
    strategy: "Token-Based Auth",
    family: "Token-Based Auth",
    level: 4,
  },

  concept: {
    name: "JWT",
    emoji: "🎫",
    tagline: "Self-contained tokens for stateless authentication",
    definition:
      "JSON Web Tokens (JWT) are compact, URL-safe tokens that encode authentication and authorization claims in a self-contained format. A JWT consists of three base64url-encoded parts separated by dots: Header.Payload.Signature. The header specifies the token type (JWT) and signing algorithm (HMAC SHA256, RSA). The payload contains claims—standardized (iss, sub, exp, iat) and custom (user roles, permissions)—representing identity and authorization data. The signature ensures integrity by cryptographically signing the header and payload using a secret key (symmetric HMAC) or private key (asymmetric RSA/ECDSA). Unlike session-based authentication that requires server-side storage and database lookups, JWTs are stateless—the server verifies the signature and extracts claims without external dependencies. This enables distributed authentication across microservices, horizontal scaling without shared session stores, and cross-domain authorization for SPAs, mobile apps, and third-party APIs. JWTs trade token size (1-2KB) and revocation complexity for verification speed (<1ms in-memory), making them ideal for high-throughput systems requiring sub-millisecond authentication.",
    problemSolved:
      "Traditional session-based authentication creates scaling bottlenecks in distributed systems. Each request requires a database lookup to validate session IDs, adding 10-50ms latency and database load that limits throughput. Distributed systems face coordination challenges—sessions stored in one server aren't available to others without sticky sessions or shared session stores (Redis, database). Same-origin policies and cookie limitations prevent authentication across domains, breaking authentication for SPAs calling APIs on different origins or mobile apps. JWTs solve these by embedding all authentication data in the token itself—no database lookups, no shared state, no coordination. The server validates signatures using cached public keys or in-memory secrets (<1ms), enabling 10-100x faster verification than session lookups. Stateless tokens enable horizontal scaling without session affinity and work seamlessly across domains via HTTP headers (Authorization: Bearer). Mobile apps and SPAs benefit from flexible token storage (localStorage, secure storage) without cookie constraints.",
    tradeoffs: {
      pros: [
        "Stateless verification without database lookups (10x faster)",
        "Horizontal scaling without shared session stores",
        "Cross-domain authentication via Authorization headers",
        "Mobile and SPA-friendly (no cookie dependencies)",
        "Distributed system-friendly (no session coordination)",
        "Standard JSON format with broad library support",
      ],
      cons: [
        "Token size overhead (1-2KB per request vs 20 bytes for session ID)",
        "Revocation complexity (cannot invalidate without blacklist)",
        "Sensitive data exposure risk (payload is base64, not encrypted)",
        "Secret rotation challenges (invalidates all existing tokens)",
        "Replay attack vulnerability without proper expiration",
      ],
    },
    relatedPatterns: [
      "oauth-2-0",
      "refresh-tokens",
      "oidc",
      "saml",
      "api-keys",
      "session-cookies",
      "opaque-tokens",
    ],
  },

  structure: {
    participants: [
      {
        name: "Token Issuer (Auth Server)",
        role: "Authentication Authority",
        responsibilities: [
          "Authenticate users via credentials (password, OAuth, SSO)",
          "Generate JWT with claims (user ID, roles, permissions)",
          "Sign token with secret key (HMAC) or private key (RSA)",
          "Set expiration time and other standard claims",
        ],
      },
      {
        name: "Token Signer",
        role: "Cryptographic Module",
        responsibilities: [
          "Apply signing algorithm (HS256, RS256, ES256)",
          "Protect secret keys from exposure",
          "Ensure signature integrity and non-repudiation",
        ],
      },
      {
        name: "Token Verifier (Resource Server)",
        role: "Authorization Enforcer",
        responsibilities: [
          "Extract JWT from Authorization header",
          "Verify signature using secret or public key",
          "Validate expiration time (exp), not-before (nbf), issuer (iss)",
          "Extract claims for authorization decisions",
        ],
      },
      {
        name: "Claims Payload",
        role: "Data Container",
        responsibilities: [
          "Store identity claims (sub, name, email)",
          "Store authorization claims (roles, permissions, scope)",
          "Include metadata claims (iat, exp, jti)",
        ],
      },
      {
        name: "Secret/Public Key",
        role: "Cryptographic Material",
        responsibilities: [
          "Sign tokens (secret key for HMAC, private key for RSA)",
          "Verify signatures (same secret for HMAC, public key for RSA)",
          "Maintain confidentiality and rotation procedures",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant AuthServer
    participant ResourceServer
    participant Database

    Client->>AuthServer: POST /login (credentials)
    AuthServer->>Database: Validate credentials
    Database-->>AuthServer: User data + roles
    AuthServer->>AuthServer: Generate JWT<br/>(Header + Payload + Signature)
    AuthServer-->>Client: 200 OK {token: "eyJhbGc..."}

    Client->>ResourceServer: GET /api/data<br/>Authorization: Bearer eyJhbGc...
    ResourceServer->>ResourceServer: Verify signature<br/>Check expiration
    ResourceServer->>ResourceServer: Extract claims<br/>(user ID, roles)
    ResourceServer-->>Client: 200 OK {data: [...]}

    Note over Client,ResourceServer: No database lookup needed!`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Authenticate",
        description:
          "Client sends credentials (username/password) to Auth Server via POST /login",
      },
      {
        step: 2,
        actor: "Token Issuer",
        action: "Validate Credentials",
        description:
          "Auth Server validates credentials against database and retrieves user identity and roles",
      },
      {
        step: 3,
        actor: "Token Issuer",
        action: "Create Claims Payload",
        description:
          "Build JSON payload with standard claims (sub, iss, exp, iat) and custom claims (roles, permissions)",
      },
      {
        step: 4,
        actor: "Token Signer",
        action: "Sign Token",
        description:
          "Create signature by signing base64url(header).base64url(payload) with secret key or private key",
      },
      {
        step: 5,
        actor: "Token Issuer",
        action: "Return JWT",
        description:
          "Send complete JWT (Header.Payload.Signature) to client in response body or cookie",
      },
      {
        step: 6,
        actor: "Client",
        action: "Store Token",
        description:
          "Store JWT in memory, localStorage, or secure storage for subsequent API calls",
      },
      {
        step: 7,
        actor: "Client",
        action: "Attach Token to Requests",
        description:
          "Include JWT in Authorization: Bearer <token> header for API requests to resource servers",
      },
      {
        step: 8,
        actor: "Token Verifier",
        action: "Extract and Verify Token",
        description:
          "Extract JWT from header, verify signature using secret or public key, ensuring token hasn't been tampered with",
      },
      {
        step: 9,
        actor: "Token Verifier",
        action: "Validate Claims",
        description:
          "Check expiration (exp > now), not-before (nbf <= now), issuer (iss matches), audience (aud matches)",
      },
      {
        step: 10,
        actor: "Token Verifier",
        action: "Extract User Context",
        description:
          "Parse claims from payload (user ID, roles, permissions) and attach to request context for authorization",
      },
      {
        step: 11,
        actor: "Token Verifier",
        action: "Authorize Request",
        description:
          "Use claims to make authorization decisions (role-based, permission-based) without database lookup",
      },
    ],
    invariants: [
      "Signature must be valid using secret key (HMAC) or public key (RSA/ECDSA)",
      "Expiration time (exp) must be in the future; reject expired tokens",
      "Issuer (iss) claim must match expected authentication authority",
      "Audience (aud) claim must match current service/resource identifier",
      "Not-before (nbf) claim must be in the past or present",
      "Token must not be modified after signature; any modification invalidates signature",
      "Signing algorithm (alg) in header must not be 'none' (algorithm confusion attack)",
    ],
  },

  codeExamples: [
    {
      id: "jwt-typescript-express",
      language: "typescript",
      title: "TypeScript Express JWT Authentication",
      description:
        "Complete JWT authentication system with Express middleware, token generation, verification, and refresh token rotation strategy",
      code: `import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Configuration and Types
// =============================================================================

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';  // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY = '7d';  // Longer-lived refresh tokens

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// In-memory stores (use Redis in production)
const refreshTokenStore = new Map<string, string>(); // userId -> refreshToken
const tokenBlacklist = new Set<string>();           // Revoked token JTIs

// =============================================================================
// Token Generation
// =============================================================================

/**
 * Generate access token (short-lived, contains claims)
 *
 * CONTEXT DILATION: Session-based auth requires database lookup per request (~10ms).
 * JWT verification happens in-memory with cached secret (<1ms), 10x faster.
 * At 10,000 req/s, this saves 90ms per request = 900 seconds of database load!
 */
function generateAccessToken(payload: JWTPayload): string {
  // ACTION: Create JWT with user claims and expiration
  // REASON: Access tokens are short-lived to limit exposure if compromised.
  //         Claims embedded in token enable stateless authorization—no database lookup needed.
  return jwt.sign(
    {
      sub: payload.userId,        // Subject (user ID)
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      type: 'access',
      jti: uuidv4(),              // JWT ID for revocation tracking
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'auth.myapp.com',
      audience: 'api.myapp.com',
      algorithm: 'HS256',         // HMAC SHA-256 (symmetric)
    }
  );
}

/**
 * Generate refresh token (long-lived, opaque)
 *
 * ACTION: Use HS256 for symmetric signing with server secret
 * REASON: HS256 is faster than RS256 (no asymmetric crypto overhead).
 *         Use HS256 when auth server and resource servers share secret.
 *         Use RS256 when resource servers only need public key for verification.
 */
function generateRefreshToken(userId: string): string {
  const refreshToken = jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      jti: uuidv4(),
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );

  // Store refresh token for rotation strategy
  refreshTokenStore.set(userId, refreshToken);
  return refreshToken;
}

// =============================================================================
// Authentication Endpoints
// =============================================================================

const app = express();
app.use(express.json());

/**
 * Login endpoint - authenticate and issue tokens
 */
app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // ACTION: Validate credentials (simplified - use database in production)
  // REASON: Must verify user identity before issuing JWT with authority claims
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // ACTION: Generate both access and refresh tokens
  // REASON: Access tokens are short-lived for security; refresh tokens enable
  //         seamless renewal without re-authentication
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
  });

  const refreshToken = generateRefreshToken(user.id);

  // CODE HIGHLIGHT: Token issuance - critical security boundary
  res.json({
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer',
  });
});

/**
 * Refresh endpoint - rotate tokens without re-authentication
 *
 * ACTION: Implement refresh token rotation for security
 * REASON: Rotating refresh tokens limits damage if one is stolen.
 *         Single-use refresh tokens prevent replay attacks.
 */
app.post('/auth/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    // ACTION: Verify refresh token signature and expiration
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as jwt.JwtPayload;

    // ACTION: Check if refresh token matches stored version (rotation)
    // REASON: Prevents use of old/stolen refresh tokens after rotation
    const storedToken = refreshTokenStore.get(payload.sub!);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Fetch fresh user data (roles may have changed)
    const user = await getUserById(payload.sub!);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // CODE HIGHLIGHT: Generate new token pair and rotate refresh token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    });

    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * Logout endpoint - revoke tokens
 *
 * CONTEXT DILATION: JWT revocation is complex because tokens are stateless.
 * Solutions: 1) Token blacklist (requires storage), 2) Short expiration times,
 * 3) Versioned secrets (rotate secret to invalidate all tokens).
 */
app.post('/auth/logout', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  // ACTION: Add access token JTI to blacklist
  // REASON: Prevents immediate reuse of access token after logout.
  //         Blacklist only needs to store JTI until token expires (~15min).
  if (req.user) {
    // Extract JTI from request token (would need to decode from header)
    tokenBlacklist.add('jti-from-token');
    refreshTokenStore.delete(req.user.userId);
  }

  res.json({ message: 'Logged out successfully' });
});

// =============================================================================
// JWT Verification Middleware
// =============================================================================

/**
 * Middleware to authenticate requests using JWT
 *
 * ACTION: Extract token from Authorization header and verify signature
 * REASON: Centralized authentication logic as Express middleware.
 *         Attaches user claims to request for downstream authorization.
 */
function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  // ACTION: Extract Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // ACTION: Verify JWT signature and decode claims
    // REASON: Signature verification ensures token hasn't been tampered with.
    //         Uses cached secret in memory—no database or network call needed!
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: 'auth.myapp.com',
      audience: 'api.myapp.com',
      algorithms: ['HS256'],        // Explicitly specify allowed algorithms
    }) as jwt.JwtPayload;

    // ACTION: Check token blacklist for revoked tokens
    // REASON: Enables logout/revocation despite JWT being stateless
    if (tokenBlacklist.has(decoded.jti!)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // CODE HIGHLIGHT: Attach user context to request
    req.user = {
      userId: decoded.sub!,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
    };

    next(); // Proceed to route handler
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return res.status(500).json({ error: 'Token verification failed' });
  }
}

/**
 * Authorization middleware - check roles/permissions
 *
 * ACTION: Enforce role-based access control using claims
 * REASON: Claims in JWT enable zero-database authorization checks.
 *         Roles loaded once at login, cached in token for all requests.
 */
function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// =============================================================================
// Protected Routes
// =============================================================================

app.get('/api/profile', authenticateJWT, (req: AuthRequest, res: Response) => {
  // User context available from JWT claims—no database lookup!
  res.json({ user: req.user });
});

app.get('/api/admin/users', authenticateJWT, requireRole('admin'), (req: AuthRequest, res: Response) => {
  res.json({ message: 'Admin access granted', users: [] });
});

// =============================================================================
// Helper Functions (Database Mocks)
// =============================================================================

interface User {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
  permissions: string[];
}

async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Mock implementation - replace with database query
  const users: Record<string, User> = {
    'user@example.com': {
      id: 'user-123',
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      roles: ['user'],
      permissions: ['read:profile'],
    },
  };

  const user = users[email];
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

async function getUserById(userId: string): Promise<User | null> {
  // Mock implementation
  return {
    id: userId,
    email: 'user@example.com',
    passwordHash: '',
    roles: ['user'],
    permissions: ['read:profile'],
  };
}

export default app;`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Complete JWT authentication system with Express middleware, token generation, refresh rotation, and claims-based authorization",
        prerequisites: [
          "Express.js",
          "jsonwebtoken library",
          "Async/await",
          "Middleware pattern",
        ],
        systemPosition:
          "Authentication layer in Express API, integrated with database for user lookup and Redis for token blacklist in production",
      },
      annotations: [
        {
          id: "jwt-access-token-gen",
          lines: [37, 59],
          action: "Generate short-lived access token with user claims",
          reason:
            "Access tokens contain identity and authorization claims, enabling stateless verification. Short expiration (15min) limits exposure if stolen. Claims embedded in token eliminate database lookups on every request—10x faster than session-based auth.",
          contextLevel: "system",
          relatedConcepts: [
            "stateless-authentication",
            "claims-based-authorization",
          ],
        },
        {
          id: "jwt-hs256-algorithm",
          lines: [53, 56],
          action: "Use HS256 symmetric signing algorithm",
          reason:
            "HS256 uses shared secret for signing and verification—faster than asymmetric RSA. Suitable when auth server and resource servers share secret. Use RS256 (asymmetric) when distributing public keys to resource servers for independent verification.",
          contextLevel: "module",
          relatedConcepts: ["hmac", "symmetric-cryptography"],
        },
        {
          id: "jwt-refresh-rotation",
          lines: [148, 170],
          action: "Rotate refresh tokens on every refresh request",
          reason:
            "Single-use refresh tokens prevent replay attacks. If attacker steals refresh token, it becomes invalid after legitimate user refreshes. Stored version in database/Redis acts as revocation mechanism for stateless tokens.",
          contextLevel: "system",
          relatedConcepts: ["token-rotation", "replay-attack-prevention"],
        },
        {
          id: "jwt-blacklist-revocation",
          lines: [194, 199],
          action: "Maintain token blacklist for revocation",
          reason:
            "JWTs are stateless and cannot be invalidated server-side. Blacklist stores revoked token JTIs (JWT IDs) until expiration. Only needs to store entries for token lifetime (15min for access tokens), preventing unbounded growth.",
          contextLevel: "system",
          relatedConcepts: ["token-revocation", "stateless-tradeoffs"],
        },
        {
          id: "jwt-verify-middleware",
          lines: [214, 240],
          action: "Verify JWT signature and validate claims in middleware",
          reason:
            "Centralized verification ensures every protected route checks token validity. Signature verification (<1ms) proves token hasn't been tampered. Expiration check ensures time-bound access. Attaching claims to request enables zero-database authorization.",
          contextLevel: "module",
          relatedConcepts: [
            "middleware-pattern",
            "signature-verification",
            "claims-validation",
          ],
        },
        {
          id: "jwt-algorithm-explicit",
          lines: [226, 229],
          action: "Explicitly specify allowed algorithms in verification",
          reason:
            "Prevents algorithm confusion attack where attacker changes 'alg' header to 'none' or switches from RS256 to HS256, using public key as HMAC secret. Always specify algorithms array in jwt.verify() options.",
          contextLevel: "micro",
          relatedConcepts: ["algorithm-confusion-attack", "security-hardening"],
        },
        {
          id: "jwt-claims-authz",
          lines: [249, 263],
          action: "Use claims for role-based authorization without database",
          reason:
            "Roles stored in JWT claims enable instant authorization decisions. No database lookup for permissions on every request. Trade-off: role changes don't take effect until token expires or user re-authenticates. For critical roles, use short token expiry.",
          contextLevel: "module",
          relatedConcepts: [
            "role-based-access-control",
            "claims-based-authorization",
          ],
        },
        {
          id: "jwt-performance-gain",
          lines: [31, 34],
          action:
            "Context: JWT verification (<1ms) vs session DB lookup (~10ms)",
          reason:
            "At 10,000 req/s, JWT saves 90ms per request compared to session lookup. This eliminates 900 seconds of database load per second! Enables horizontal scaling without shared session store. Critical for high-throughput APIs.",
          contextLevel: "system",
          relatedConcepts: ["stateless-scaling", "performance-optimization"],
        },
      ],
      highlights: [
        {
          lines: [37, 59],
          label: "Token generation with claims",
          sbvpDomain: "structure",
        },
        {
          lines: [148, 170],
          label: "Refresh token rotation",
          sbvpDomain: "behavior",
        },
        {
          lines: [214, 240],
          label: "Verification middleware",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "jwt-python-fastapi",
      language: "python",
      title: "Python FastAPI JWT with RS256 and Redis Blacklist",
      description:
        "Production-grade JWT implementation using asymmetric RS256 keys, FastAPI dependency injection, Redis token blacklist for revocation, and scope-based authorization",
      code: `from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from jwt import PyJWTError
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import redis
import hashlib

# =============================================================================
# Configuration
# =============================================================================

ALGORITHM = "RS256"  # RSA asymmetric algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
ISSUER = "auth.myapp.com"
AUDIENCE = "api.myapp.com"

# Redis client for token blacklist (in production, use Redis cluster)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# =============================================================================
# RSA Key Pair Generation
# =============================================================================

# ACTION: Generate RSA key pair for asymmetric signing
# REASON: RS256 uses private key for signing, public key for verification.
#         Resource servers only need public key—prevents key leakage.
#         Private key stays on auth server; public key distributed to APIs.

def generate_key_pair():
    """Generate RSA 2048-bit key pair"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    return private_key, public_key

# In production, load keys from environment or key management service (AWS KMS, HashiCorp Vault)
PRIVATE_KEY, PUBLIC_KEY = generate_key_pair()

# Serialize keys to PEM format for JWT library
PRIVATE_KEY_PEM = PRIVATE_KEY.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode('utf-8')

PUBLIC_KEY_PEM = PUBLIC_KEY.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')

# =============================================================================
# Models
# =============================================================================

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int

class TokenPayload(BaseModel):
    sub: str  # User ID
    email: str
    scopes: List[str]  # OAuth 2.0 scopes
    exp: datetime
    iat: datetime
    iss: str
    aud: str
    jti: str

class User(BaseModel):
    id: str
    email: str
    scopes: List[str]

# =============================================================================
# Token Generation
# =============================================================================

def create_access_token(user: User) -> str:
    """
    Create JWT access token with RS256 signing

    CONTEXT DILATION: RS256 enables distributed verification without shared secrets.
    Auth server holds private key (signs tokens). Resource servers hold public key
    (verify signatures). Public key can be distributed via JWKS endpoint.
    This enables thousands of microservices to verify tokens independently!
    """
    now = datetime.utcnow()
    expires = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # ACTION: Build JWT claims with standard and custom fields
    # REASON: Standard claims (sub, exp, iat, iss, aud) enable interoperability.
    #         Custom claims (scopes) enable fine-grained authorization.
    payload = {
        "sub": user.id,                    # Subject (user identifier)
        "email": user.email,
        "scopes": user.scopes,             # OAuth 2.0 scopes for permissions
        "exp": expires,                    # Expiration time
        "iat": now,                        # Issued at
        "iss": ISSUER,                     # Issuer
        "aud": AUDIENCE,                   # Audience
        "jti": hashlib.sha256(f"{user.id}{now.timestamp()}".encode()).hexdigest()[:16],
        "type": "access"
    }

    # ACTION: Sign token with private key using RS256
    # REASON: RSA private key creates signature that can be verified with public key.
    #         Only holder of private key can create valid tokens—prevents forgery.
    token = jwt.encode(payload, PRIVATE_KEY_PEM, algorithm=ALGORITHM)
    return token

def create_refresh_token(user_id: str) -> str:
    """Create long-lived refresh token"""
    now = datetime.utcnow()
    expires = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "exp": expires,
        "iat": now,
        "jti": hashlib.sha256(f"refresh-{user_id}{now.timestamp()}".encode()).hexdigest()[:16],
        "type": "refresh"
    }

    token = jwt.encode(payload, PRIVATE_KEY_PEM, algorithm=ALGORITHM)
    return token

# =============================================================================
# Token Verification and Dependencies
# =============================================================================

security = HTTPBearer()

def verify_token(credentials: HTTPAuthCredentials = Depends(security)) -> TokenPayload:
    """
    FastAPI dependency for JWT verification

    ACTION: Use FastAPI dependency injection for authentication
    REASON: Dependencies enable reusable, composable auth logic.
    """
    token = credentials.credentials

    try:
        # ACTION: Verify signature with public key
        # REASON: Public key verification ensures token was signed by private key holder.
        #         No database call needed—cryptographic proof of authenticity!
        payload = jwt.decode(
            token,
            PUBLIC_KEY_PEM,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_iss": True,
                "verify_aud": True,
                "require": ["sub", "exp", "iat", "iss", "aud"]
            }
        )

        # ACTION: Check Redis blacklist for revoked tokens
        # REASON: JWTs cannot be invalidated server-side without tracking.
        #         Redis blacklist stores revoked JTIs with TTL = token expiration.
        jti = payload.get("jti")
        if jti and redis_client.exists(f"blacklist:{jti}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )

        return TokenPayload(**payload)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

def require_scopes(*required_scopes: str):
    """
    Dependency factory for scope-based authorization

    ACTION: Check OAuth 2.0 scopes from JWT claims
    REASON: Scopes enable fine-grained permissions (read:users, write:orders).
    """
    def scope_checker(token: TokenPayload = Depends(verify_token)) -> TokenPayload:
        for scope in required_scopes:
            if scope not in token.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required scope: {scope}"
                )
        return token
    return scope_checker

# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(title="JWT Auth API")

@app.post("/auth/login", response_model=TokenResponse)
async def login(email: str, password: str):
    """
    Authenticate user and issue JWT tokens
    """
    # Simplified authentication (use database in production)
    user = await authenticate_user(email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str):
    """
    Refresh access token using refresh token
    """
    try:
        payload = jwt.decode(
            refresh_token,
            PUBLIC_KEY_PEM,
            algorithms=[ALGORITHM],
            options={"verify_exp": True}
        )

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")

        # Check blacklist
        jti = payload.get("jti")
        if jti and redis_client.exists(f"blacklist:{jti}"):
            raise HTTPException(status_code=401, detail="Token revoked")

        # Fetch fresh user data
        user = await get_user_by_id(payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Issue new token pair
        new_access = create_access_token(user)
        new_refresh = create_refresh_token(user.id)

        # Revoke old refresh token (rotation)
        if jti:
            redis_client.setex(
                f"blacklist:{jti}",
                timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
                "revoked"
            )

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.post("/auth/logout")
async def logout(token: TokenPayload = Depends(verify_token)):
    """
    Revoke access token by adding to blacklist

    CONTEXT DILATION: Redis blacklist with TTL handles revocation at scale.
    Each blacklist entry expires when token expires (15min for access tokens).
    No unbounded growth—automatic cleanup via Redis TTL.
    """
    jti = token.jti
    ttl = int((token.exp - datetime.utcnow()).total_seconds())

    # ACTION: Store JTI in Redis with TTL equal to remaining token lifetime
    # REASON: After token expires naturally, blacklist entry auto-deletes.
    #         Prevents memory bloat while enabling instant revocation.
    redis_client.setex(f"blacklist:{jti}", ttl, "revoked")

    return {"message": "Logged out successfully"}

# =============================================================================
# Protected Endpoints
# =============================================================================

@app.get("/api/profile")
async def get_profile(token: TokenPayload = Depends(verify_token)):
    """Protected endpoint - requires valid JWT"""
    return {
        "user_id": token.sub,
        "email": token.email,
        "scopes": token.scopes
    }

@app.get("/api/admin/users")
async def list_users(token: TokenPayload = Depends(require_scopes("admin:read", "users:list"))):
    """Protected endpoint - requires specific scopes"""
    return {"users": ["user1", "user2"], "requester": token.sub}

@app.get("/.well-known/jwks.json")
async def jwks():
    """
    JWKS endpoint for distributing public keys

    ACTION: Expose public key in JSON Web Key Set format
    REASON: Resource servers fetch public keys from this endpoint for verification.
    """
    return {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "1",
                "n": "...",  # Base64 encoded modulus
                "e": "AQAB"  # Base64 encoded exponent
            }
        ]
    }

# =============================================================================
# Helper Functions
# =============================================================================

async def authenticate_user(email: str, password: str) -> Optional[User]:
    """Mock user authentication"""
    if email == "user@example.com" and password == "password":
        return User(
            id="user-123",
            email=email,
            scopes=["read:profile", "write:profile"]
        )
    return None

async def get_user_by_id(user_id: str) -> Optional[User]:
    """Mock user lookup"""
    return User(
        id=user_id,
        email="user@example.com",
        scopes=["read:profile", "write:profile", "admin:read"]
    )`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production JWT system with RS256 asymmetric keys, FastAPI dependency injection, Redis blacklist for revocation, and OAuth 2.0 scopes",
        prerequisites: [
          "FastAPI",
          "PyJWT",
          "Redis",
          "Public-key cryptography",
          "OAuth 2.0 scopes",
        ],
        systemPosition:
          "Auth service in microservices architecture, distributing public keys via JWKS endpoint for independent verification across services",
      },
      annotations: [
        {
          id: "jwt-rs256-keypair",
          lines: [34, 45],
          action: "Generate RSA 2048-bit key pair for asymmetric signing",
          reason:
            "RS256 separates signing (private key) from verification (public key). Auth server keeps private key secret. Resource servers receive public key via JWKS endpoint. Public key leakage doesn't compromise security—only enables verification, not forgery. Critical for distributed systems with many microservices.",
          contextLevel: "system",
          relatedConcepts: [
            "asymmetric-cryptography",
            "public-key-infrastructure",
          ],
        },
        {
          id: "jwt-standard-claims",
          lines: [96, 107],
          action: "Build JWT payload with standard claims",
          reason:
            "Standard claims (sub, exp, iat, iss, aud) enable interoperability with OAuth 2.0 and OpenID Connect. Issuer (iss) identifies token source. Audience (aud) limits token to specific API. Expiration (exp) enforces time bounds. JTI enables revocation tracking.",
          contextLevel: "module",
          relatedConcepts: ["oauth-2-0", "openid-connect", "claims-based-auth"],
        },
        {
          id: "jwt-fastapi-dependency",
          lines: [144, 180],
          action: "Implement JWT verification as FastAPI dependency",
          reason:
            "FastAPI dependency injection enables reusable, testable auth logic. Dependencies compose (verify_token → require_scopes). Automatic OpenAPI documentation generation for auth requirements. Type-safe token payload via Pydantic models.",
          contextLevel: "module",
          relatedConcepts: ["dependency-injection", "fastapi-dependencies"],
        },
        {
          id: "jwt-redis-blacklist",
          lines: [168, 176],
          action: "Check Redis blacklist for revoked token JTIs",
          reason:
            "Solves JWT revocation problem for logout/security breaches. Redis stores JTI with TTL = remaining token lifetime. After natural expiration, blacklist entry auto-deletes. Scales to millions of tokens—Redis handles 100k+ ops/sec. Alternative: short token expiry only (no blacklist).",
          contextLevel: "system",
          relatedConcepts: [
            "token-revocation",
            "redis-ttl",
            "stateless-tradeoffs",
          ],
        },
        {
          id: "jwt-scope-authorization",
          lines: [184, 195],
          action: "Implement OAuth 2.0 scope-based authorization",
          reason:
            "Scopes enable fine-grained permissions beyond roles. Examples: 'read:users', 'write:orders', 'admin:delete'. Middleware checks scopes from JWT claims—zero database queries. User consent tracked at OAuth flow; scopes embedded in token.",
          contextLevel: "module",
          relatedConcepts: ["oauth-scopes", "fine-grained-authorization"],
        },
        {
          id: "jwt-refresh-rotation-redis",
          lines: [246, 252],
          action: "Revoke old refresh token during rotation via Redis",
          reason:
            "Single-use refresh tokens prevent replay attacks. Blacklisting old refresh token ensures it cannot be reused. If attacker steals token after legitimate refresh, stolen token is already revoked. Redis TTL = refresh token lifetime (7 days).",
          contextLevel: "system",
          relatedConcepts: ["token-rotation", "replay-attack-prevention"],
        },
        {
          id: "jwt-jwks-endpoint",
          lines: [284, 299],
          action: "Expose public key via JWKS endpoint",
          reason:
            "JSON Web Key Set (JWKS) is standard for distributing public keys. Resource servers fetch public keys from this endpoint. Enables key rotation—add new keys with different 'kid' (key ID). Clients cache public keys with TTL. Critical for federated auth and microservices.",
          contextLevel: "system",
          relatedConcepts: ["jwks", "key-rotation", "distributed-verification"],
        },
        {
          id: "jwt-distributed-context",
          lines: [85, 90],
          action:
            "Context: RS256 enables distributed verification across microservices",
          reason:
            "Thousands of microservices can verify tokens independently with public key. No shared session store or auth server dependency. Each service fetches public key once, caches it. Scales horizontally without coordination. Auth server failure doesn't block API requests!",
          contextLevel: "system",
          relatedConcepts: [
            "microservices-auth",
            "distributed-systems",
            "horizontal-scaling",
          ],
        },
      ],
      highlights: [
        {
          lines: [34, 45],
          label: "RS256 key pair generation",
          sbvpDomain: "structure",
        },
        {
          lines: [144, 180],
          label: "FastAPI dependency verification",
          sbvpDomain: "structure",
        },
        {
          lines: [168, 176],
          label: "Redis blacklist integration",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "jwt-java-spring-security",
      language: "java",
      title: "Java Spring Security JWT with Claims Enrichment",
      description:
        "Enterprise JWT implementation with Spring Security filter chain, UserDetailsService integration, claims enrichment from database, and refresh token endpoint",
      code: `package com.example.security.jwt;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

// =============================================================================
// JWT Token Provider
// =============================================================================

/**
 * Service for generating and validating JWT tokens
 *
 * CONTEXT DILATION: Mobile and SPA authentication challenges.
 * Cookies don't work well for mobile apps (native storage). CORS restrictions
 * complicate cross-domain auth. JWT in Authorization header works everywhere:
 * React/Vue SPAs, iOS/Android apps, cross-domain API calls. Token stored in
 * secure storage (Keychain, localStorage with XSS protection).
 */
@Component
public class JwtTokenProvider {

    @Value("\${jwt.secret}")
    private String jwtSecret;

    @Value("\${jwt.expiration-ms:900000}") // 15 minutes default
    private long jwtExpirationMs;

    @Value("\${jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    private final UserDetailsService userDetailsService;

    public JwtTokenProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    /**
     * Generate JWT access token with claims enrichment
     *
     * ACTION: Enrich JWT with user roles and custom claims from database
     * REASON: Load user roles once at login, embed in token for all requests.
     *         Eliminates N database lookups per request. Trade-off: role changes
     *         don't take effect until token expires or user re-authenticates.
     */
    public String generateAccessToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Instant now = Instant.now();
        Instant expiry = now.plus(jwtExpirationMs, ChronoUnit.MILLIS);

        // ACTION: Extract roles from Spring Security authorities
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // ACTION: Load additional claims from database (user profile, permissions)
        // REASON: Enrich token with metadata to avoid database lookups later
        Map<String, Object> customClaims = loadUserClaims(userDetails.getUsername());

        return JWT.create()
                .withSubject(userDetails.getUsername())
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiry))
                .withIssuer("auth-service")
                .withAudience("api-gateway")
                .withClaim("roles", roles)                    // Spring Security roles
                .withClaim("userId", customClaims.get("userId"))
                .withClaim("tenantId", customClaims.get("tenantId"))  // Multi-tenancy
                .withClaim("permissions", (List<String>) customClaims.get("permissions"))
                .withClaim("jti", UUID.randomUUID().toString())
                .sign(Algorithm.HMAC256(jwtSecret));
    }

    /**
     * Generate refresh token (minimal claims for security)
     */
    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiry = now.plus(refreshExpirationMs, ChronoUnit.MILLIS);

        return JWT.create()
                .withSubject(username)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiry))
                .withClaim("type", "refresh")
                .withClaim("jti", UUID.randomUUID().toString())
                .sign(Algorithm.HMAC256(jwtSecret));
    }

    /**
     * Validate and decode JWT token
     *
     * ACTION: Verify signature, expiration, and issuer claims
     * REASON: Signature verification ensures token integrity (not tampered).
     *         Expiration check enforces time-bound access.
     *         Issuer validation prevents token reuse from untrusted sources.
     */
    public DecodedJWT validateToken(String token) throws JWTVerificationException {
        return JWT.require(Algorithm.HMAC256(jwtSecret))
                .withIssuer("auth-service")
                .withAudience("api-gateway")
                .build()
                .verify(token);
    }

    /**
     * Extract username from token
     */
    public String getUsernameFromToken(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getSubject();
    }

    /**
     * Load user claims from database for enrichment
     */
    private Map<String, Object> loadUserClaims(String username) {
        // Mock implementation - replace with actual database query
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "user-" + username);
        claims.put("tenantId", "tenant-001");
        claims.put("permissions", Arrays.asList("read:data", "write:data"));
        return claims;
    }
}

// =============================================================================
// JWT Authentication Filter
// =============================================================================

/**
 * Spring Security filter for JWT authentication
 *
 * ACTION: Intercept requests, extract JWT, verify signature, set security context
 * REASON: Integrates JWT auth into Spring Security filter chain.
 *         Converts JWT claims to Spring Security Authentication object.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // ACTION: Extract JWT from Authorization header
            String jwt = extractJwtFromRequest(request);

            if (jwt != null) {
                // ACTION: Validate token signature and expiration
                DecodedJWT decodedJWT = tokenProvider.validateToken(jwt);

                // ACTION: Load user details (may hit cache, not database)
                String username = decodedJWT.getSubject();
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // ACTION: Build Spring Security authentication object
                // REASON: Convert JWT claims to Spring Security authorities.
                //         Enables @PreAuthorize, method security, role checks.
                List<GrantedAuthority> authorities = decodedJWT.getClaim("roles")
                        .asList(String.class).stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, authorities);

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                // CODE HIGHLIGHT: Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (JWTVerificationException ex) {
            logger.error("JWT validation failed", ex);
            // Continue filter chain - authentication will be null
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract Bearer token from Authorization header
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

// =============================================================================
// Spring Security Configuration
// =============================================================================

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for JWT authentication
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    /**
     * Configure HTTP security with JWT filter
     *
     * ACTION: Insert JWT filter before UsernamePasswordAuthenticationFilter
     * REASON: JWT filter runs first to authenticate requests via token.
     *         Disable session management (stateless tokens).
     *         CSRF not needed (no cookies/sessions).
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()  // CSRF not needed for stateless JWT auth
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // No sessions
            .and()
            .authorizeHttpRequests(auth -> auth
                .antMatchers("/auth/login", "/auth/refresh").permitAll()
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

// =============================================================================
// Authentication Controller
// =============================================================================

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager,
                         JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    /**
     * Login endpoint - authenticate and issue tokens
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        // ACTION: Authenticate user via Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // CODE HIGHLIGHT: Generate JWT tokens with enriched claims
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(
                authentication.getName());

        return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken));
    }

    /**
     * Refresh endpoint - issue new access token
     *
     * CONTEXT DILATION: Mobile apps and SPAs need seamless token renewal.
     * Access tokens expire quickly (15min) for security. Refresh tokens enable
     * background renewal without forcing user to re-login every 15 minutes.
     * Critical for mobile UX—users expect apps to "stay logged in".
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        try {
            // ACTION: Validate refresh token
            DecodedJWT jwt = tokenProvider.validateToken(request.getRefreshToken());

            if (!"refresh".equals(jwt.getClaim("type").asString())) {
                return ResponseEntity.badRequest().build();
            }

            // ACTION: Load fresh user data (roles may have changed)
            // REASON: Refresh is opportunity to update claims without full re-auth.
            //         Load current roles from database to reflect permission changes.
            String username = jwt.getSubject();
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            Authentication auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            // Issue new token pair
            String newAccessToken = tokenProvider.generateAccessToken(auth);
            String newRefreshToken = tokenProvider.generateRefreshToken(username);

            return ResponseEntity.ok(new TokenResponse(newAccessToken, newRefreshToken));

        } catch (JWTVerificationException ex) {
            return ResponseEntity.status(401).build();
        }
    }

    // Request/Response DTOs
    public static class LoginRequest {
        private String username;
        private String password;
        // getters/setters
    }

    public static class RefreshRequest {
        private String refreshToken;
        // getters/setters
    }

    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";

        public TokenResponse(String accessToken, String refreshToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
        }
        // getters/setters
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise JWT authentication with Spring Security filter integration, UserDetailsService, claims enrichment from database, and refresh token endpoints",
        prerequisites: [
          "Spring Security",
          "Spring Boot",
          "Auth0 JWT library",
          "Servlet filters",
        ],
        systemPosition:
          "Authentication layer in Spring Boot microservices, integrated with Spring Security for method-level authorization and role-based access control",
      },
      annotations: [
        {
          id: "jwt-claims-enrichment",
          lines: [67, 91],
          action: "Enrich JWT with user roles and custom claims from database",
          reason:
            "Load user roles, permissions, tenant ID once at login—embed in token. Eliminates database lookups on every request. Spring Security uses embedded roles for @PreAuthorize and method security. Trade-off: role changes don't take effect until token refresh. For critical permissions, use short expiration.",
          contextLevel: "system",
          relatedConcepts: [
            "claims-enrichment",
            "database-optimization",
            "spring-security",
          ],
        },
        {
          id: "jwt-spring-filter",
          lines: [169, 210],
          action:
            "Integrate JWT verification into Spring Security filter chain",
          reason:
            "OncePerRequestFilter ensures JWT checked once per request. Filter extracts token, verifies signature, loads UserDetails, sets SecurityContext. Downstream code uses standard Spring Security annotations (@PreAuthorize, @Secured). Seamless integration with existing Spring Security infrastructure.",
          contextLevel: "system",
          relatedConcepts: [
            "spring-security-filters",
            "authentication-filters",
          ],
        },
        {
          id: "jwt-security-context",
          lines: [197, 206],
          action:
            "Convert JWT claims to Spring Security Authentication and set in SecurityContext",
          reason:
            "Spring Security expects Authentication object in SecurityContext. Convert JWT claims (roles, user) to UsernamePasswordAuthenticationToken. Enables role-based authorization (@PreAuthorize('hasRole(ADMIN)')), method security, and programmatic security checks (SecurityContextHolder.getContext()).",
          contextLevel: "module",
          relatedConcepts: ["spring-security-context", "authorization"],
        },
        {
          id: "jwt-stateless-session",
          lines: [271, 272],
          action: "Disable sessions and use stateless JWT authentication",
          reason:
            "SessionCreationPolicy.STATELESS tells Spring Security not to create HTTP sessions. Every request authenticated via JWT—no server-side session storage. Critical for horizontal scaling and distributed systems. Load balancers don't need sticky sessions.",
          contextLevel: "system",
          relatedConcepts: [
            "stateless-authentication",
            "session-management",
            "horizontal-scaling",
          ],
        },
        {
          id: "jwt-filter-order",
          lines: [265, 279],
          action:
            "Insert JWT filter before UsernamePasswordAuthenticationFilter in filter chain",
          reason:
            "Spring Security filters execute in order. JWT filter must run early to authenticate before authorization checks. Runs before UsernamePasswordAuthenticationFilter (form login). If JWT valid, SecurityContext populated; authorization succeeds.",
          contextLevel: "module",
          relatedConcepts: ["filter-chain", "spring-security-architecture"],
        },
        {
          id: "jwt-refresh-claims-update",
          lines: [340, 348],
          action:
            "Reload user details from database during refresh to update claims",
          reason:
            "Refresh token endpoint is opportunity to update claims without full re-authentication. Load current roles/permissions from database. If user promoted to admin since login, new access token reflects updated role. Balances security (fresh permissions) with UX (no re-login).",
          contextLevel: "system",
          relatedConcepts: ["claims-update", "permission-propagation"],
        },
        {
          id: "jwt-mobile-spa-context",
          lines: [35, 41],
          action:
            "Context: JWT solves mobile and SPA authentication challenges",
          reason:
            "Cookies don't work for native mobile apps (iOS, Android). CORS restricts cross-domain cookies. JWT in Authorization header works everywhere: SPAs (React, Vue), mobile apps (Swift, Kotlin), cross-origin API calls. Token stored in secure storage (Keychain, encrypted SharedPreferences). Critical for modern app architectures.",
          contextLevel: "system",
          relatedConcepts: [
            "mobile-authentication",
            "spa-authentication",
            "cors",
          ],
        },
        {
          id: "jwt-mobile-refresh-ux",
          lines: [322, 328],
          action:
            "Context: Refresh tokens enable seamless mobile UX without re-login",
          reason:
            "Mobile users expect to stay logged in indefinitely. Access tokens expire quickly (15min) for security. Refresh tokens (7 days) enable background renewal. App silently refreshes access token before expiration—user never sees login screen. Critical for mobile UX. Desktop web can tolerate re-login; mobile cannot.",
          contextLevel: "system",
          relatedConcepts: [
            "mobile-ux",
            "seamless-authentication",
            "token-renewal",
          ],
        },
      ],
      highlights: [
        {
          lines: [67, 91],
          label: "Claims enrichment with database",
          sbvpDomain: "structure",
        },
        {
          lines: [169, 210],
          label: "Spring Security filter integration",
          sbvpDomain: "structure",
        },
        {
          lines: [340, 355],
          label: "Refresh token with claims update",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "REST API authentication (Express, FastAPI, Spring)",
      "Microservices inter-service auth (service mesh, API gateway)",
      "Mobile app backends (iOS, Android authentication)",
      "Single Page Application (SPA) authentication (React, Vue, Angular)",
      "Third-party API access (OAuth 2.0, API keys with JWT)",
      "Single Sign-On (SSO) systems (SAML bridge, OpenID Connect)",
      "Webhook signatures (verify webhook authenticity)",
      "Serverless function authorization (AWS Lambda, Cloud Functions)",
    ],
    interactsWith: [
      "oauth-2-0",
      "refresh-tokens",
      "oidc",
      "api-gateway",
      "rate-limiting",
      "cors",
      "tls-ssl",
    ],
    architecturalBoundaries: [
      "API gateway (validates tokens for all downstream services)",
      "Auth service (issues and signs tokens)",
      "Resource servers (verify tokens and enforce authorization)",
      "Token storage (client-side: localStorage, sessionStorage, secure storage)",
      "Claims registry (defines standard and custom claims)",
      "Key management service (stores signing secrets, rotates keys)",
    ],
  },

  implementations: [
    {
      id: "jsonwebtoken",
      name: "jsonwebtoken (Node.js)",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Popular Node.js JWT library with HMAC and RSA support. Simple API for signing and verifying tokens. Supports custom claims, expiration validation, and algorithm selection. 20M+ weekly downloads on npm.",
      links: {
        npm: "https://www.npmjs.com/package/jsonwebtoken",
        github: "https://github.com/auth0/node-jsonwebtoken",
      },
      codeSnippet: `import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: '123', roles: ['admin'] },
  'secret-key',
  { expiresIn: '15m', algorithm: 'HS256' }
);

const decoded = jwt.verify(token, 'secret-key', {
  algorithms: ['HS256'],
  issuer: 'auth.example.com'
});`,
    },
    {
      id: "pyjwt",
      name: "PyJWT (Python)",
      type: "library",
      languages: ["python"],
      description:
        "Python JWT implementation supporting HMAC, RSA, and ECDSA algorithms. Integrates with cryptography library for secure key handling. Supports custom claims validation and JWK (JSON Web Keys). Used by Django, Flask, FastAPI.",
      links: {
        docs: "https://pyjwt.readthedocs.io/",
        github: "https://github.com/jpadilla/pyjwt",
      },
      codeSnippet: `import jwt
from datetime import datetime, timedelta

token = jwt.encode(
    {
        'sub': 'user-123',
        'exp': datetime.utcnow() + timedelta(minutes=15),
        'roles': ['admin']
    },
    'secret-key',
    algorithm='HS256'
)

decoded = jwt.decode(
    token,
    'secret-key',
    algorithms=['HS256'],
    options={'verify_exp': True}
)`,
    },
    {
      id: "jose4j",
      name: "jose4j (Java)",
      type: "library",
      languages: ["java"],
      description:
        "Comprehensive Java library for JWT, JWS, JWE, JWK, and JWA. Supports all standard algorithms including RSA, ECDSA, and HMAC. Used in enterprise Spring applications. Handles key rotation, JWK sets, and token encryption (JWE).",
      links: {
        docs: "https://bitbucket.org/b_c/jose4j/wiki/Home",
        github: "https://bitbucket.org/b_c/jose4j",
      },
      codeSnippet: `JsonWebSignature jws = new JsonWebSignature();
jws.setPayload(claims.toJson());
jws.setKey(hmacKey);
jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);
String jwt = jws.getCompactSerialization();

JwtConsumer consumer = new JwtConsumerBuilder()
    .setRequireExpirationTime()
    .setAllowedClockSkewInSeconds(30)
    .setExpectedIssuer("auth.example.com")
    .setVerificationKey(hmacKey)
    .build();
JwtClaims claims = consumer.processToClaims(jwt);`,
    },
    {
      id: "auth0",
      name: "Auth0",
      type: "service",
      languages: ["any"],
      description:
        "Managed authentication platform with JWT support. Handles user management, social login (Google, Facebook), MFA, and token issuance. Provides JWKS endpoint for public key distribution. Used by 100k+ applications. Scales to billions of authentications.",
      links: {
        docs: "https://auth0.com/docs/secure/tokens/json-web-tokens",
      },
      codeSnippet: `// Auth0 JWT verification (Node.js)
import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
  audience: 'https://api.example.com',
  issuerBaseURL: 'https://tenant.auth0.com',
  tokenSigningAlg: 'RS256'
});

app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ user: req.auth });
});`,
    },
    {
      id: "aws-cognito",
      name: "AWS Cognito",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed user directory and authentication service. Issues JWT tokens (ID tokens, access tokens) via OAuth 2.0 and OpenID Connect. Integrates with API Gateway for serverless auth. Handles user pools, federated identity (Google, Facebook, SAML), and MFA. Scales automatically.",
      links: {
        docs: "https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html",
      },
      codeSnippet: `# AWS Cognito JWT validation (Python)
from jose import jwt

keys = requests.get(
    f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
).json()['keys']

decoded = jwt.decode(
    token,
    keys,
    algorithms=['RS256'],
    audience=client_id,
    issuer=f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
)`,
    },
    {
      id: "firebase-auth",
      name: "Firebase Authentication",
      type: "service",
      languages: ["any"],
      description:
        "Google's authentication service issuing JWT ID tokens. Supports email/password, phone, Google, Facebook, Apple sign-in. Mobile SDKs for iOS, Android, web. Tokens verified via Firebase Admin SDK or JWKS endpoint. Used by 1B+ devices worldwide. Free tier generous.",
      links: {
        docs: "https://firebase.google.com/docs/auth/admin/verify-id-tokens",
      },
      codeSnippet: `// Firebase JWT verification (Node.js)
import admin from 'firebase-admin';

admin.initializeApp();

const decodedToken = await admin.auth().verifyIdToken(idToken);
const uid = decodedToken.uid;
const email = decodedToken.email;`,
    },
    {
      id: "okta",
      name: "Okta",
      type: "service",
      languages: ["any"],
      description:
        "Enterprise identity and access management platform. Issues JWT access tokens and ID tokens via OpenID Connect. Supports SSO, MFA, user provisioning, and SAML federation. Integrates with thousands of apps. Used by Fortune 500 companies. Strong compliance (SOC2, HIPAA, FedRAMP).",
      links: {
        docs: "https://developer.okta.com/docs/guides/validate-access-tokens/",
      },
      codeSnippet: `// Okta JWT verification (Java Spring)
@Configuration
public class SecurityConfig {
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) {
    http
      .oauth2ResourceServer()
      .jwt()
      .jwkSetUri("https://{domain}/oauth2/default/v1/keys");
    return http.build();
  }
}`,
    },
    {
      id: "keycloak",
      name: "Keycloak",
      type: "platform",
      languages: ["any"],
      description:
        "Open-source identity and access management solution. Issues JWT tokens via OpenID Connect and OAuth 2.0. Self-hosted or managed. Supports user federation (LDAP, Active Directory), SSO, MFA, and social login. Used by enterprises needing on-premise auth. Highly customizable with SPIs.",
      links: {
        docs: "https://www.keycloak.org/docs/latest/securing_apps/",
        github: "https://github.com/keycloak/keycloak",
      },
      codeSnippet: `# Keycloak JWT validation (Python FastAPI)
from fastapi import Depends
from keycloak import KeycloakOpenID

keycloak = KeycloakOpenID(
    server_url="https://keycloak.example.com",
    client_id="my-app",
    realm_name="my-realm"
)

def verify_token(token: str = Depends(oauth2_scheme)):
    return keycloak.decode_token(
        token,
        validate=True,
        options={"verify_signature": True, "verify_aud": True}
    )`,
    },
  ],

  usedInSystems: [
    {
      systemId: "github-api",
      systemName: "GitHub API",
      howUsed:
        "GitHub uses JWT for OAuth App authentication and GitHub Actions authentication. OAuth apps exchange authorization codes for JWT access tokens (via OAuth 2.0 flow) to access GitHub API on behalf of users. JWTs encode user permissions (repo access, org membership) as scopes. GitHub Actions use OIDC JWTs signed by GitHub's auth service to authenticate with cloud providers (AWS, Azure, GCP) without storing secrets—short-lived tokens prove workflow identity. GitHub Apps use JWT signed with private key to authenticate as the app installation, then exchange for installation access tokens. Pattern composition: JWT + OAuth 2.0 + OIDC + Refresh Tokens. Rationale: JWT enables stateless verification across GitHub's distributed API infrastructure (millions of requests/second). Scopes embedded in token eliminate database lookups for permission checks. OIDC JWTs for Actions enable secure, keyless deployment to cloud providers. Impact: Powers 100M+ developers accessing GitHub API; enables secure CI/CD workflows without long-lived credentials; scales to billions of API requests daily.",
      source:
        "https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app",
    },
    {
      systemId: "stripe-api",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe uses JWT to sign webhook events, proving authenticity of payment notifications. When payment succeeds/fails, Stripe sends webhook to merchant server with JWT signature in Stripe-Signature header. Merchant verifies JWT using Stripe's public key (via JWKS endpoint), ensuring webhook genuinely from Stripe (not attacker). JWT payload contains event data (payment ID, amount, status). Stripe Connect uses JWT for OAuth 2.0 access tokens—platforms authorize on behalf of connected accounts with scoped JWTs (read_write, read_only). Pattern composition: JWT + Webhook Signatures + OAuth 2.0 + HTTPS. Rationale: Webhook signatures prevent attackers from forging payment notifications to trick merchants into fulfilling fraudulent orders. JWT makes signatures compact and verifiable with public key. Stateless verification scales to millions of merchants without Stripe infrastructure dependency. Impact: Processes $640B+ in payments annually; prevents fraud via cryptographic webhook verification; enables 100k+ platforms to build on Stripe Connect.",
      source: "https://stripe.com/docs/webhooks/signatures",
    },
    {
      systemId: "firebase-auth",
      systemName: "Firebase Authentication",
      howUsed:
        "Firebase issues JWT ID tokens when users authenticate (email/password, Google, Apple, phone). Mobile SDKs (iOS, Android) store tokens securely and attach to API requests. Backend services verify JWT using Firebase Admin SDK or public keys from Firebase JWKS endpoint. Tokens encode user ID (uid), email, phone, provider info (Google, Apple), and custom claims (admin: true, tier: 'premium'). Custom claims enable role-based access without database lookups. Tokens refresh automatically in SDKs—users stay logged in for weeks. Firestore Security Rules verify JWTs natively: 'allow read: if request.auth.token.admin == true'. Pattern composition: JWT + OIDC + OAuth 2.0 + Refresh Tokens + Custom Claims. Rationale: Firebase serves 1B+ devices globally; stateless JWT verification scales horizontally without bottlenecks. Custom claims eliminate database lookups for permissions in Firestore/Storage rules. Tokens work across web (localStorage), iOS (Keychain), Android (EncryptedSharedPreferences). Impact: Powers authentication for 3M+ apps including Duolingo, The New York Times, Lyft; handles 1B+ monthly authentications; enables sub-50ms auth verification globally.",
      source: "https://firebase.google.com/docs/auth/admin/verify-id-tokens",
    },
    {
      systemId: "auth0",
      systemName: "Auth0 Identity Platform",
      howUsed:
        "Auth0 issues JWT access tokens and ID tokens via OAuth 2.0 and OpenID Connect flows. Supports all grant types: authorization code (SPAs), client credentials (M2M), password grant (legacy). Tokens signed with RS256 (asymmetric)—public keys distributed via JWKS endpoint at /.well-known/jwks.json. Access tokens encode scopes for API authorization (read:users, write:orders). ID tokens contain user profile (name, email, picture) for frontend rendering. Refresh tokens enable long-lived sessions with short-lived access tokens (15min). Auth0 Rules (custom JS) enrich JWT claims at token issuance—add roles from database, custom permissions, subscription tiers. Pattern composition: JWT + OAuth 2.0 + OIDC + JWKS + Refresh Tokens + Claims Enrichment. Rationale: Auth0 serves 100k+ applications across industries; RS256 enables distributed verification by resource servers without shared secrets. JWKS endpoint enables key rotation without downtime. Extensible claims enrichment supports diverse authorization models. Impact: Handles 4.5B+ logins per month; powers authentication for Atlassian, Mozilla, HarperCollins; enables 99.99% SLA with global distribution.",
      source: "https://auth0.com/docs/secure/tokens/json-web-tokens",
    },
    {
      systemId: "spotify-api",
      systemName: "Spotify Web API",
      howUsed:
        "Spotify uses JWT for OAuth 2.0 access tokens when apps access user data (playlists, playback, saved tracks). Users authorize apps via authorization code flow; Spotify issues JWT access tokens (1 hour expiry) and refresh tokens. Tokens encode scopes (user-read-private, playlist-modify-public, streaming). API endpoints validate JWT and check scopes: GET /me/playlists requires playlist-read-private. Spotify SDKs (iOS, Android, Web Playback) use tokens for streaming authentication. Rate limiting enforced based on token's client_id claim. Pattern composition: JWT + OAuth 2.0 + Scopes + Refresh Tokens + Rate Limiting. Rationale: Spotify has 500M+ users and 100k+ third-party apps; stateless JWT verification scales to millions of API requests per second. Scopes enable granular permissions—apps only access what users authorize. Refresh tokens enable long-lived integrations without re-authorization. Impact: Powers 100k+ third-party integrations including Discord, Waze, PlayStation; handles 1B+ API requests daily; enables rich ecosystem of music apps and integrations.",
      source:
        "https://developer.spotify.com/documentation/web-api/concepts/access-token",
    },
  ],

  philosophy: {
    coreProblem:
      "Session-based authentication doesn't scale in distributed systems due to shared state requirements, database lookups per request, and cross-domain limitations",
    designPrinciple:
      "Embed all authentication and authorization data in cryptographically signed tokens that can be verified stateless without external dependencies",
    historicalContext:
      "JWT emerged from OAuth 2.0 and OIDC standardization efforts (2010s) to solve distributed authentication. Prior solutions (session cookies, SAML XML) required shared state or were too heavyweight for mobile/APIs. JWT's compact JSON format and base64url encoding made it ideal for HTTP headers and mobile apps.",
    alternativesRejected: [
      "Session cookies - require shared session store (Redis, database), don't work cross-domain, limited to web browsers",
      "SAML assertions - XML-based, verbose (5-10KB), designed for enterprise SSO not APIs",
      "API keys - lack expiration, revocation complexity, no embedded claims or identity",
      "Opaque tokens - require database lookup to validate, don't scale stateless",
    ],
    mentalModel:
      "JWT is like a passport: a tamper-proof document encoding your identity and permissions. Border agents (API servers) verify the passport's signature without calling your home country (auth server). Passport expires after time (expiration claim). Signature prevents forgery. Passport works across countries (cross-domain).",
  },

  visualization: {
    staticDiagram: `graph LR
    A[Client] -->|1. Login credentials| B[Auth Server]
    B -->|2. Verify credentials| C[(Database)]
    C -->|3. User + roles| B
    B -->|4. Sign JWT| D[Token Signer]
    D -->|5. Header.Payload.Signature| B
    B -->|6. Return JWT| A
    A -->|7. API request + JWT| E[Resource Server]
    E -->|8. Verify signature| F[Token Verifier]
    F -->|9. Extract claims| E
    E -->|10. Response| A

    style D fill:#ffe6e6
    style F fill:#e6f3ff
    style B fill:#e6ffe6
    style E fill:#fff3e6`,
    realWorldAnalogy:
      "JWT is like a concert wristband. At the entrance (auth server), you show ID and pay (login). Staff gives you a wristband with a hologram (signature) and your access level (VIP, general admission) encoded as color. Inside the venue, security guards (resource servers) verify the hologram instantly—no need to radio the entrance. Wristband proves you paid and your access level. Hologram prevents counterfeits. Wristband expires after the concert (expiration time).",
    useCases: [
      {
        domain: "Mobile Apps",
        scenario:
          "iOS banking app authenticates users and accesses account data. JWT stored in Keychain, attached to API requests. No cookies, works offline (token cached), seamless UX.",
        patternRole:
          "Enables secure, cookie-free mobile authentication with offline token verification",
        companies: ["Chase", "Venmo", "Cash App"],
      },
      {
        domain: "Microservices",
        scenario:
          "E-commerce system with 50 microservices (auth, catalog, cart, orders, payment). JWT issued by auth service, verified by all services using shared public key. No session coordination.",
        patternRole:
          "Enables distributed authentication without shared session store across microservices",
        companies: ["Amazon", "Uber", "Shopify"],
      },
      {
        domain: "Single Page Applications (SPA)",
        scenario:
          "React app calls REST API on different domain. JWT in Authorization header bypasses cookie CORS restrictions. Token stored in memory (XSS protection) or localStorage (persistence).",
        patternRole:
          "Solves cross-domain authentication for SPAs calling APIs on different origins",
        companies: ["Notion", "Figma", "Linear"],
      },
      {
        domain: "Third-Party API Access",
        scenario:
          "OAuth 2.0 app accesses Spotify API on behalf of user. JWT access token encodes scopes (playlist-read, playback-modify). Stateless verification scales to millions of API calls.",
        patternRole:
          "Enables scalable, scope-based authorization for third-party API integrations",
        companies: ["Spotify", "GitHub", "Stripe"],
      },
    ],
  },

  tags: [
    "security",
    "authentication",
    "authorization",
    "stateless",
    "jwt",
    "oauth",
    "oidc",
    "tokens",
    "mobile",
    "spa",
    "microservices",
    "distributed-systems",
  ],
  difficulty: "intermediate",
};
