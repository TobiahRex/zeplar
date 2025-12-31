import type { Pattern } from "../schema";

export const refreshTokens: Pattern = {
  id: "refresh-tokens",
  slug: "refresh-tokens",
  corpusPath: "🔒 SECURITY → 🎟️ Token-Based Auth → 🔄 Refresh Tokens",

  hierarchy: {
    quality: "security",
    strategy: "Token-Based Auth",
    family: "Token-Based Auth",
    level: 4,
  },

  concept: {
    name: "Refresh Tokens",
    emoji: "🔄",
    tagline: "Long-lived session renewal without re-authentication",
    definition:
      "Refresh Tokens are long-lived credentials used to obtain new short-lived access tokens without requiring the user to re-authenticate. They implement a dual-token strategy where access tokens (used to authenticate API requests) expire quickly (minutes to hours), while refresh tokens remain valid for extended periods (days to months). When an access token expires, the client presents the refresh token to the authorization server, which validates it and issues a new access token. Modern implementations use token rotation, where each refresh operation returns both a new access token and a new refresh token, invalidating the old refresh token. This rotation strategy enables reuse detection: if an old refresh token is presented after rotation, it signals potential theft, and the entire token family is revoked. Refresh tokens are bound to specific clients, stored securely (never exposed in URLs or client-side storage), and never sent to resource servers—only to the authorization endpoint. This pattern balances security (short access token lifetimes limit exposure) with user experience (long sessions without repeated login prompts).",
    problemSolved:
      "Short-lived access tokens are critical for security, limiting damage from token theft. However, they create poor user experience if users must re-authenticate every time tokens expire (every 15-60 minutes). Traditional session-based auth solves this with long-lived cookies, but doesn't work for APIs, mobile apps, or third-party integrations. Refresh tokens solve this by enabling automatic token renewal without user interaction. They also address the re-authentication overhead in distributed systems where multiple services need authentication—refreshing is lighter weight than full OAuth flows. Additionally, they enable revocable sessions: unlike JWTs which remain valid until expiration, refresh tokens can be revoked server-side, providing immediate session termination for compromised accounts.",
    tradeoffs: {
      pros: [
        "Extended sessions without re-authentication",
        "Short-lived access tokens limit exposure window",
        "Token rotation detects and prevents reuse attacks",
        "Revocable sessions via server-side validation",
        "Enables offline access for mobile/desktop apps",
      ],
      cons: [
        "Storage security is critical (XSS/theft risk)",
        "Rotation complexity requires careful implementation",
        "Reuse detection challenges in distributed systems",
        "Revocation lag if not using token introspection",
        "Stolen refresh token grants extended access until detected",
      ],
    },
    relatedPatterns: [
      "jwt",
      "oauth-2-0",
      "oidc",
      "session-management",
      "token-rotation",
      "sliding-expiration",
      "token-introspection",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client",
        role: "Token Consumer",
        responsibilities: [
          "Store refresh token securely (encrypted storage, not localStorage)",
          "Detect access token expiration and trigger refresh",
          "Present refresh token to authorization server",
          "Replace both tokens after successful refresh",
        ],
      },
      {
        name: "Authorization Server",
        role: "Token Issuer",
        responsibilities: [
          "Validate refresh token authenticity and expiration",
          "Verify token hasn't been revoked or reused",
          "Issue new access token and rotate refresh token",
          "Track token families for reuse detection",
          "Revoke entire token family on suspicious activity",
        ],
      },
      {
        name: "Access Token",
        role: "Short-lived Credential",
        responsibilities: [
          "Authenticate API requests to resource servers",
          "Contain user identity and permissions (JWT claims)",
          "Expire quickly (15-60 minutes typical)",
        ],
      },
      {
        name: "Refresh Token",
        role: "Long-lived Credential",
        responsibilities: [
          "Authorize new access token issuance",
          "Remain valid for extended period (days to months)",
          "Bound to specific client and user",
          "Enable one-time use with rotation",
        ],
      },
      {
        name: "Token Store",
        role: "Persistence Layer",
        responsibilities: [
          "Store active refresh tokens with metadata (user, client, family)",
          "Track token families for rotation chains",
          "Enable revocation by user, session, or device",
          "Enforce expiration and cleanup expired tokens",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant AuthServer
    participant TokenStore
    participant ResourceAPI

    Note over Client,ResourceAPI: Initial Authentication (Login)
    Client->>AuthServer: Login (username/password)
    AuthServer->>TokenStore: Create token family
    AuthServer->>Client: Access Token (15min) + Refresh Token (30d)

    Note over Client,ResourceAPI: Using Access Token
    Client->>ResourceAPI: API Request + Access Token
    ResourceAPI->>Client: Success

    Note over Client,ResourceAPI: Access Token Expires
    Client->>ResourceAPI: API Request + Expired Token
    ResourceAPI->>Client: 401 Unauthorized

    Note over Client,ResourceAPI: Token Refresh Flow
    Client->>AuthServer: Refresh Token
    AuthServer->>TokenStore: Validate & Check Reuse
    TokenStore->>AuthServer: Valid, No Reuse
    AuthServer->>TokenStore: Rotate: Invalidate Old, Create New
    AuthServer->>Client: New Access Token + New Refresh Token

    Note over Client,ResourceAPI: Reuse Detection
    Client->>AuthServer: Old Refresh Token (Reused!)
    AuthServer->>TokenStore: Check Token
    TokenStore->>AuthServer: Token Already Used!
    AuthServer->>TokenStore: Revoke Entire Token Family
    AuthServer->>Client: 401 Unauthorized (Session Terminated)`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Login Request",
        description:
          "User authenticates with credentials (username/password, OAuth, etc.)",
      },
      {
        step: 2,
        actor: "Authorization Server",
        action: "Issue Initial Tokens",
        description:
          "Create token family, issue short-lived access token and long-lived refresh token",
      },
      {
        step: 3,
        actor: "Client",
        action: "Store Tokens Securely",
        description:
          "Save refresh token in secure storage (encrypted, httpOnly cookie, or keychain)",
      },
      {
        step: 4,
        actor: "Client",
        action: "Use Access Token",
        description: "Include access token in API requests until expiration",
      },
      {
        step: 5,
        actor: "Client",
        action: "Detect Expiration",
        description:
          "Access token expires or API returns 401, trigger refresh flow",
      },
      {
        step: 6,
        actor: "Client",
        action: "Send Refresh Token",
        description:
          "POST refresh token to authorization server's token endpoint",
      },
      {
        step: 7,
        actor: "Authorization Server",
        action: "Validate Refresh Token",
        description:
          "Verify signature, expiration, revocation status, and check for reuse",
      },
      {
        step: 8,
        actor: "Token Store",
        action: "Check Reuse Detection",
        description:
          "If token already used (rotation occurred), mark as suspicious reuse",
      },
      {
        step: 9,
        actor: "Authorization Server",
        action: "Rotate Tokens",
        description:
          "Invalidate old refresh token, issue new access token + new refresh token",
      },
      {
        step: 10,
        actor: "Token Store",
        action: "Update Token Family",
        description: "Link new refresh token to same family for reuse tracking",
      },
      {
        step: 11,
        actor: "Client",
        action: "Replace Tokens",
        description:
          "Store new tokens, discard old ones, retry original API request",
      },
      {
        step: 12,
        actor: "Authorization Server",
        action: "Handle Reuse Attack",
        description:
          "If reuse detected, revoke entire token family, terminate all sessions",
      },
    ],
    invariants: [
      "Refresh tokens MUST never be sent to resource servers, only to authorization server",
      "Refresh tokens MUST be one-time use with rotation (old token invalidated on use)",
      "Reuse of invalidated refresh token MUST trigger revocation of entire token family",
      "Refresh tokens MUST be stored securely (encrypted, not in localStorage or URL)",
      "Refresh tokens MUST be bound to specific client (client_id validation)",
      "Token expiration MUST be enforced server-side (cannot rely on client validation)",
      "Refresh token rotation MUST be atomic (no race conditions allowing duplicate tokens)",
    ],
  },

  codeExamples: [
    {
      id: "refresh-tokens-ts-rotation",
      language: "typescript",
      title: "TypeScript Refresh Token Rotation with Redis",
      description:
        "Complete Express.js authorization server with automatic token rotation, Redis-backed token family tracking, reuse detection, and sliding expiration",
      code: `import express from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import crypto from 'crypto';

interface TokenPayload {
  userId: string;
  email: string;
  tokenFamily: string;
}

interface RefreshTokenMetadata {
  userId: string;
  email: string;
  tokenFamily: string;
  clientId: string;
  createdAt: number;
  lastUsedAt: number;
  rotationCount: number;
  invalidated: boolean;
}

const redis = new Redis();
const app = express();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_LIFETIME = 15 * 60; // 15 minutes
const REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60; // 30 days

// ACTION: Generate a unique token family ID for tracking rotation chains
// REASON: Each login creates a new family; all subsequent rotations belong to same family,
// enabling detection of stolen tokens if multiple branches attempt refresh
function generateTokenFamily(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ACTION: Create short-lived access token with user identity
// REASON: Access tokens are sent to resource servers frequently; short lifetime (15min)
// minimizes damage from theft, while JWT format eliminates database lookup per request
function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME }
  );
}

// ACTION: Create long-lived refresh token with family tracking
// REASON: Refresh token includes tokenFamily claim for reuse detection; opaque format
// forces server-side validation, enabling revocation unlike pure JWTs
function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_LIFETIME,
  });
}

// ACTION: Store refresh token metadata in Redis with automatic expiration
// REASON: Redis enables fast lookups for validation, supports TTL for auto-cleanup,
// and atomic operations prevent race conditions during rotation
async function storeRefreshToken(
  token: string,
  metadata: RefreshTokenMetadata
): Promise<void> {
  const key = \`refresh_token:\${token}\`;
  await redis.setex(
    key,
    REFRESH_TOKEN_LIFETIME,
    JSON.stringify(metadata)
  );

  // Also index by token family for revocation
  const familyKey = \`token_family:\${metadata.tokenFamily}\`;
  await redis.sadd(familyKey, token);
  await redis.expire(familyKey, REFRESH_TOKEN_LIFETIME);
}

// ACTION: Retrieve and validate refresh token from Redis
// REASON: Server-side storage enables immediate revocation; checking 'invalidated' flag
// detects reuse attacks where old token in rotation chain is replayed
async function getRefreshTokenMetadata(
  token: string
): Promise<RefreshTokenMetadata | null> {
  const key = \`refresh_token:\${token}\`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// ACTION: Mark refresh token as invalidated without deleting (for reuse detection)
// REASON: Keeping invalidated tokens allows detecting reuse attempts; if client presents
// already-rotated token, it signals theft and triggers family-wide revocation
async function invalidateRefreshToken(token: string): Promise<void> {
  const metadata = await getRefreshTokenMetadata(token);
  if (metadata) {
    metadata.invalidated = true;
    const key = \`refresh_token:\${token}\`;
    await redis.setex(
      key,
      REFRESH_TOKEN_LIFETIME,
      JSON.stringify(metadata)
    );
  }
}

// ACTION: Revoke all tokens in a family (entire session across all rotations)
// REASON: If reuse detected, attacker may have stolen token; safest response is to
// terminate entire session, forcing legitimate user to re-authenticate
async function revokeTokenFamily(tokenFamily: string): Promise<void> {
  const familyKey = \`token_family:\${tokenFamily}\`;
  const tokens = await redis.smembers(familyKey);

  // Invalidate all tokens in family
  for (const token of tokens) {
    await invalidateRefreshToken(token);
  }

  // Log security event
  console.warn(\`[SECURITY] Token family revoked: \${tokenFamily}\`);
}

// LOGIN ENDPOINT: Issue initial token pair
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials (simplified - use bcrypt in production)
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create new token family for this session
  const tokenFamily = generateTokenFamily();

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    tokenFamily,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token metadata
  await storeRefreshToken(refreshToken, {
    userId: user.id,
    email: user.email,
    tokenFamily,
    clientId: req.body.clientId || 'web',
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    rotationCount: 0,
    invalidated: false,
  });

  res.json({
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_LIFETIME,
  });
});

// ACTION: Refresh endpoint with automatic token rotation and reuse detection
// REASON: Core of refresh token security; rotation invalidates old token immediately,
// making reuse attempts detectable; sliding expiration maintains long sessions for active users
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;

    // Retrieve token metadata from Redis
    const metadata = await getRefreshTokenMetadata(refreshToken);

    if (!metadata) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // ACTION: Check if token was already used (reuse detection)
    // REASON: After rotation, old token is invalidated but kept in Redis; if presented again,
    // it indicates theft—attacker and victim racing to use same stolen token
    if (metadata.invalidated) {
      console.warn(
        \`[SECURITY] Refresh token reuse detected for family: \${metadata.tokenFamily}\`
      );
      // Revoke entire token family
      await revokeTokenFamily(metadata.tokenFamily);
      return res.status(401).json({
        error: 'Token reuse detected. Session terminated for security.',
      });
    }

    // ACTION: Invalidate current token immediately (atomic rotation)
    // REASON: Must invalidate BEFORE issuing new token to prevent race condition where
    // two concurrent refresh requests both succeed, creating multiple valid token branches
    await invalidateRefreshToken(refreshToken);

    // Generate new token pair (rotation)
    const newPayload: TokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      tokenFamily: decoded.tokenFamily, // Same family for reuse tracking
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Store new refresh token with updated metadata
    await storeRefreshToken(newRefreshToken, {
      ...metadata,
      lastUsedAt: Date.now(),
      rotationCount: metadata.rotationCount + 1,
      invalidated: false,
    });

    // ACTION: Return new token pair with sliding expiration
    // REASON: Active users stay logged in indefinitely via sliding window; each refresh
    // extends session by full refresh_token_lifetime (30 days), preventing timeout annoyance
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_LIFETIME,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    throw error;
  }
});

// REVOCATION ENDPOINT: Allow explicit logout
app.post('/auth/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;
    await revokeTokenFamily(decoded.tokenFamily);
  }

  res.json({ message: 'Logged out successfully' });
});

// Simplified auth function (use real database + bcrypt in production)
async function authenticateUser(email: string, password: string) {
  // Mock implementation
  return { id: '12345', email };
}

app.listen(3000, () => console.log('Auth server running on port 3000'));`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete authorization server with token rotation preventing stolen refresh token attacks from granting persistent access",
        prerequisites: [
          "JWT authentication",
          "Redis for token storage",
          "Express.js API design",
        ],
        systemPosition:
          "Authentication service in microservices architecture, issues tokens to clients (web apps, mobile apps, SPAs)",
      },
      annotations: [
        {
          id: "rt-token-family",
          lines: [30, 33],
          action: "Generate unique ID for tracking token rotation chains",
          reason:
            "Token family links all rotations from same login session; if token X rotates to Y, then Y to Z, all share family ID. When reuse detected (e.g., attacker uses stolen Y after victim rotated to Z), entire family revoked to stop both branches",
          contextLevel: "system",
          relatedConcepts: ["token-rotation", "reuse-detection"],
        },
        {
          id: "rt-access-token-lifetime",
          lines: [36, 39],
          action: "Create short-lived access token (15 minutes)",
          reason:
            "Access tokens sent with every API request increase exposure; 15min lifetime limits damage from XSS or network interception while remaining long enough to avoid constant refreshing (balance security vs UX)",
          contextLevel: "module",
          relatedConcepts: ["jwt", "token-expiration"],
        },
        {
          id: "rt-refresh-token-opaque",
          lines: [43, 48],
          action: "Generate refresh token with family tracking claim",
          reason:
            "Including tokenFamily in JWT payload allows server to identify related tokens; opaque format (not self-validating like access token) forces server-side validation, enabling revocation—critical for security",
          contextLevel: "module",
          relatedConcepts: ["jwt", "server-side-validation"],
        },
        {
          id: "rt-redis-storage",
          lines: [51, 66],
          action: "Store refresh token metadata in Redis with TTL",
          reason:
            "Redis provides fast lookup for validation (sub-millisecond), automatic expiration via TTL prevents unbounded growth, and atomic operations prevent rotation race conditions. Family indexing enables batch revocation",
          contextLevel: "system",
          relatedConcepts: ["redis", "token-storage", "ttl"],
        },
        {
          id: "rt-invalidation-flag",
          lines: [80, 92],
          action: "Mark token as invalidated without deletion",
          reason:
            "Keeping invalidated tokens in Redis (with flag) for TTL duration enables reuse detection. If client presents invalidated token, server knows it was already rotated, indicating potential theft",
          contextLevel: "module",
          relatedConcepts: ["reuse-detection", "security-auditing"],
        },
        {
          id: "rt-family-revocation",
          lines: [95, 107],
          action: "Revoke all tokens in family on suspicious activity",
          reason:
            "When reuse detected, attacker may have stolen token at any point in rotation chain; safest response is scorched earth—revoke entire family forcing re-authentication. Prevents attacker from using any token in their possession",
          contextLevel: "system",
          relatedConcepts: ["security-incident-response"],
        },
        {
          id: "rt-reuse-check",
          lines: [155, 167],
          action: "Detect token reuse by checking invalidated flag",
          reason:
            "After rotation, old token invalidated but stored. If presented again, indicates race: legitimate client and attacker both trying to refresh with same stolen token. Immediate family revocation stops attack",
          contextLevel: "system",
          relatedConcepts: ["race-condition-detection", "theft-mitigation"],
        },
        {
          id: "rt-atomic-rotation",
          lines: [170, 173],
          action: "Invalidate current token BEFORE issuing new one",
          reason:
            "Atomic invalidate-then-issue prevents race where two concurrent refresh requests both succeed, creating divergent token branches. Ensures linear rotation chain: A→B→C, never A→B and A→C",
          contextLevel: "module",
          relatedConcepts: ["atomicity", "race-condition-prevention"],
        },
        {
          id: "rt-sliding-expiration",
          lines: [186, 193],
          action: "Reset refresh token TTL on each rotation",
          reason:
            "Sliding window means active users never timeout—each refresh extends session by full 30 days. Inactive users (no refresh for 30d) automatically expire. Balances security (eventual timeout) with UX (no interruption)",
          contextLevel: "system",
          relatedConcepts: ["sliding-session", "user-experience"],
        },
      ],
      highlights: [
        {
          lines: [30, 33],
          label: "Token family generation for rotation tracking",
          sbvpDomain: "structure",
        },
        {
          lines: [51, 66],
          label: "Redis storage with family indexing",
          sbvpDomain: "structure",
        },
        {
          lines: [155, 167],
          label: "Reuse detection and family revocation",
          sbvpDomain: "behavior",
        },
        {
          lines: [170, 193],
          label: "Atomic token rotation with sliding expiration",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "refresh-tokens-python-mobile",
      language: "python",
      title: "Python FastAPI Refresh Tokens for Mobile Apps",
      description:
        "FastAPI refresh token implementation with PostgreSQL storage, automatic access token refresh middleware, clock skew grace period, and mobile-optimized UX for seamless long sessions",
      code: `from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import jwt
import secrets
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

app = FastAPI()
security = HTTPBearer()

# Database setup
DATABASE_URL = "postgresql://user:password@localhost/authdb"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Configuration
JWT_SECRET = "your-secret-key"
ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)
REFRESH_TOKEN_LIFETIME = timedelta(days=30)
CLOCK_SKEW_GRACE = timedelta(minutes=2)  # Allow 2min clock skew

class RefreshToken(Base):
    """Database model for refresh token storage and tracking"""
    __tablename__ = "refresh_tokens"

    token_id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    device_id = Column(String, nullable=False)  # Track device for multi-device support
    token_family = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    invalidated = Column(Boolean, default=False)
    rotation_count = Column(Integer, default=0)

Base.metadata.create_all(bind=engine)

class TokenRequest(BaseModel):
    email: str
    password: str
    device_id: str  # Mobile device identifier

class RefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ACTION: Generate access token with grace period for clock skew
# REASON: Mobile devices may have inaccurate clocks; 2min grace period prevents
# false token expiration errors that would force re-login, degrading mobile UX
def generate_access_token(user_id: str, email: str) -> str:
    expires_at = datetime.utcnow() + ACCESS_TOKEN_LIFETIME + CLOCK_SKEW_GRACE
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expires_at.timestamp(),
        "iat": datetime.utcnow().timestamp(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# ACTION: Generate refresh token with device binding
# REASON: Binding token to device_id enables per-device revocation (e.g., "log out
# of all devices except this one") and security alerts if token used from new device
def generate_refresh_token(user_id: str, email: str, device_id: str, token_family: str) -> str:
    token_id = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + REFRESH_TOKEN_LIFETIME
    payload = {
        "token_id": token_id,
        "user_id": user_id,
        "email": email,
        "device_id": device_id,
        "token_family": token_family,
        "exp": expires_at.timestamp(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# ACTION: Store refresh token in PostgreSQL with device tracking
# REASON: PostgreSQL provides ACID guarantees for token operations, preventing
# race conditions during rotation. Device_id indexing enables fast multi-device queries
def store_refresh_token(
    db: Session,
    token: str,
    user_id: str,
    device_id: str,
    token_family: str,
) -> None:
    decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    refresh_token = RefreshToken(
        token_id=decoded["token_id"],
        user_id=user_id,
        device_id=device_id,
        token_family=token_family,
        expires_at=datetime.fromtimestamp(decoded["exp"]),
    )
    db.add(refresh_token)
    db.commit()

# ACTION: Validate refresh token with expiration and reuse checking
# REASON: Database lookup enables server-side validation and revocation; checking
# 'invalidated' flag detects reuse attacks common with mobile apps (users sharing tokens)
def validate_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token_id == decoded["token_id"]
        ).first()

        if not token_record:
            return None

        # Check expiration with grace period
        if datetime.utcnow() > token_record.expires_at + CLOCK_SKEW_GRACE:
            return None

        return token_record
    except jwt.InvalidTokenError:
        return None

# LOGIN ENDPOINT: Issue initial token pair for mobile app
@app.post("/auth/login", response_model=TokenResponse)
async def login(request: TokenRequest, db: Session = Depends(get_db)):
    """
    Mobile-optimized login with 30-day refresh tokens for seamless experience.
    Device tracking enables per-device session management.
    """
    # Authenticate user (simplified - use proper password hashing)
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create new token family for this device session
    token_family = secrets.token_urlsafe(32)

    access_token = generate_access_token(user["id"], user["email"])
    refresh_token = generate_refresh_token(
        user["id"], user["email"], request.device_id, token_family
    )

    store_refresh_token(db, refresh_token, user["id"], request.device_id, token_family)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(ACCESS_TOKEN_LIFETIME.total_seconds()),
    )

# ACTION: Refresh endpoint with automatic rotation and mobile UX optimization
# REASON: Mobile apps benefit most from refresh tokens—seamless 30-day sessions prevent
# login fatigue that causes 90% user drop-off. Auto-rotation maintains security without UX impact
@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Refresh access token with automatic rotation. Supports seamless mobile UX:
    - 30-day sessions prevent re-login fatigue (90% drop-off reduction)
    - Clock skew grace period handles device time inaccuracy
    - Reuse detection stops token sharing attacks
    """
    token_record = validate_refresh_token(db, request.refresh_token)

    if not token_record:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # ACTION: Detect token reuse (security critical for mobile apps)
    # REASON: Mobile users often screenshot/copy tokens for debugging or share accounts;
    # reuse detection identifies this and forces re-auth, preventing unauthorized access
    if token_record.invalidated:
        # Revoke entire token family (all devices in this session)
        revoke_token_family(db, token_record.token_family)
        raise HTTPException(
            status_code=401,
            detail="Token reuse detected. All sessions terminated for security."
        )

    # Invalidate current token atomically
    token_record.invalidated = True
    db.commit()

    # Generate new token pair (rotation)
    new_access_token = generate_access_token(
        token_record.user_id, jwt.decode(request.refresh_token, JWT_SECRET, algorithms=["HS256"])["email"]
    )
    new_refresh_token = generate_refresh_token(
        token_record.user_id,
        jwt.decode(request.refresh_token, JWT_SECRET, algorithms=["HS256"])["email"],
        token_record.device_id,
        token_record.token_family,
    )

    # ACTION: Update token metadata with sliding expiration
    # REASON: Active mobile users stay logged in indefinitely via sliding window;
    # each refresh extends session by 30 days. Prevents frustrating logouts during active use
    store_refresh_token(
        db, new_refresh_token, token_record.user_id, token_record.device_id, token_record.token_family
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=int(ACCESS_TOKEN_LIFETIME.total_seconds()),
    )

# ACTION: Middleware to automatically refresh expired access tokens
# REASON: Mobile apps can auto-refresh in background, preventing "token expired"
# errors that interrupt user actions (e.g., mid-form submission). Seamless UX
@app.middleware("http")
async def auto_refresh_middleware(request: Request, call_next):
    """
    Automatically refresh access token on expiration for seamless mobile UX.
    Client receives new token in response header, avoiding interrupted actions.
    """
    response = await call_next(request)

    # If 401 due to expired token, check for refresh token
    if response.status_code == 401:
        refresh_token = request.headers.get("X-Refresh-Token")
        if refresh_token:
            db = SessionLocal()
            try:
                # Attempt auto-refresh
                token_record = validate_refresh_token(db, refresh_token)
                if token_record and not token_record.invalidated:
                    # Generate new tokens
                    new_access = generate_access_token(
                        token_record.user_id,
                        jwt.decode(refresh_token, JWT_SECRET, algorithms=["HS256"])["email"]
                    )
                    # Include in response header for client to update
                    response.headers["X-New-Access-Token"] = new_access
            finally:
                db.close()

    return response

def revoke_token_family(db: Session, token_family: str):
    """Revoke all tokens in family (all sessions across all devices for this login)"""
    db.query(RefreshToken).filter(
        RefreshToken.token_family == token_family
    ).update({"invalidated": True})
    db.commit()

def authenticate_user(email: str, password: str):
    """Mock authentication - use bcrypt + database in production"""
    return {"id": "12345", "email": email}

# ADMIN ENDPOINT: Revoke user sessions (e.g., account compromise)
@app.post("/admin/revoke-user/{user_id}")
async def revoke_user_sessions(user_id: str, db: Session = Depends(get_db)):
    """Revoke all refresh tokens for a user (all devices, all sessions)"""
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update(
        {"invalidated": True}
    )
    db.commit()
    return {"message": f"All sessions revoked for user {user_id}"}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Mobile app authentication service enabling 30-day seamless sessions that prevent login fatigue while maintaining security through rotation",
        prerequisites: [
          "FastAPI web framework",
          "PostgreSQL database",
          "SQLAlchemy ORM",
          "JWT authentication",
        ],
        systemPosition:
          "Authentication service for mobile applications (iOS/Android) and desktop clients requiring long-lived sessions",
      },
      annotations: [
        {
          id: "rt-py-clock-skew",
          lines: [64, 68],
          action: "Add 2-minute grace period for clock skew",
          reason:
            "Mobile devices often have inaccurate system clocks (user manually adjusted, timezone issues, drift). Grace period prevents false 'token expired' errors that would force re-login, significantly improving mobile UX",
          contextLevel: "system",
          relatedConcepts: ["mobile-optimization", "clock-skew"],
        },
        {
          id: "rt-py-device-binding",
          lines: [72, 75],
          action: "Bind refresh token to specific device ID",
          reason:
            "Device binding enables per-device session management—users can revoke 'iPhone' but keep 'iPad' session active. Also enables security alerts if token used from unexpected device (potential theft)",
          contextLevel: "system",
          relatedConcepts: ["device-fingerprinting", "security-monitoring"],
        },
        {
          id: "rt-py-db-storage",
          lines: [92, 104],
          action: "Store refresh tokens in PostgreSQL with ACID guarantees",
          reason:
            "PostgreSQL transactions prevent race conditions during token rotation—two concurrent refresh requests won't both succeed. ACID ensures atomic invalidate-then-create operation, maintaining single rotation chain",
          contextLevel: "system",
          relatedConcepts: ["acid-transactions", "race-condition-prevention"],
        },
        {
          id: "rt-py-reuse-detection",
          lines: [180, 187],
          action: "Detect and respond to refresh token reuse",
          reason:
            "Mobile users sometimes screenshot/copy tokens for debugging or share accounts; reuse detection (presenting invalidated token) triggers family revocation, stopping unauthorized access before further damage",
          contextLevel: "system",
          relatedConcepts: ["security-incident-response", "token-theft"],
        },
        {
          id: "rt-py-sliding-window",
          lines: [202, 207],
          action: "Implement sliding expiration window",
          reason:
            "Each refresh extends session by full 30 days—active mobile users never timeout, preventing frustrating mid-session logouts. Inactive users (no refresh for 30d) automatically expire, balancing security and UX",
          contextLevel: "system",
          relatedConcepts: ["sliding-session", "user-experience"],
        },
        {
          id: "rt-py-auto-refresh",
          lines: [216, 238],
          action: "Middleware to automatically refresh expired tokens",
          reason:
            "Mobile apps can silently refresh in background when access token expires, preventing 'session expired' errors that interrupt user actions (e.g., form submission). User never sees authentication errors",
          contextLevel: "system",
          relatedConcepts: ["transparent-refresh", "mobile-ux"],
        },
        {
          id: "rt-py-multi-device",
          lines: [145, 154],
          action: "Track device_id for multi-device session management",
          reason:
            "Mobile users often use multiple devices (phone, tablet, desktop); device tracking enables granular control—'log out all devices except this one' or 'view active sessions'. Improves security and user control",
          contextLevel: "system",
          relatedConcepts: ["multi-device-auth", "session-management"],
        },
        {
          id: "rt-py-admin-revocation",
          lines: [250, 257],
          action: "Admin endpoint to revoke all user sessions",
          reason:
            "When account compromise detected (e.g., password leaked), admin can immediately terminate all sessions across all devices, forcing re-authentication. Critical for incident response and account takeover prevention",
          contextLevel: "system",
          relatedConcepts: ["admin-controls", "incident-response"],
        },
      ],
      highlights: [
        {
          lines: [64, 75],
          label: "Mobile optimization: clock skew grace + device binding",
          sbvpDomain: "structure",
        },
        {
          lines: [180, 187],
          label: "Reuse detection for mobile token sharing attacks",
          sbvpDomain: "behavior",
        },
        {
          lines: [216, 238],
          label: "Auto-refresh middleware for seamless mobile UX",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "refresh-tokens-java-spring",
      language: "java",
      title: "Java Spring Security OAuth2 Refresh Tokens with Admin Control",
      description:
        "Spring Authorization Server refresh grant configuration with JPA entity for token metadata, token introspection for revocation checking, admin revocation endpoints, and dashboard integration for security operations",
      code: `package com.example.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.*;

import javax.persistence.*;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@SpringBootApplication
public class AuthServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServerApplication.class, args);
    }
}

// ============================================================================
// JPA ENTITY: Refresh Token Metadata
// ============================================================================

/**
 * Database entity for refresh token storage and tracking.
 *
 * ACTION: Store refresh token metadata in relational database
 * REASON: JPA provides transaction support for atomic rotation, query capabilities
 * for admin dashboard (find all tokens for user/device), and automatic expiration cleanup
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_token_family", columnList = "token_family"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_device_id", columnList = "device_id")
})
public class RefreshTokenEntity {

    @Id
    private String tokenId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String tokenFamily;

    @Column(nullable = false)
    private String deviceId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant lastUsedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean invalidated;

    @Column(nullable = false)
    private int rotationCount;

    // Metadata for security monitoring
    @Column
    private String ipAddress;

    @Column
    private String userAgent;

    // Getters, setters, constructors omitted for brevity
}

// ============================================================================
// REPOSITORY: Token Data Access
// ============================================================================

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {

    List<RefreshTokenEntity> findByTokenFamily(String tokenFamily);

    List<RefreshTokenEntity> findByUserId(String userId);

    List<RefreshTokenEntity> findByUserIdAndDeviceId(String userId, String deviceId);

    @Modifying
    @Query("UPDATE RefreshTokenEntity t SET t.invalidated = true WHERE t.tokenFamily = :family")
    void invalidateTokenFamily(@Param("family") String tokenFamily);

    @Modifying
    @Query("UPDATE RefreshTokenEntity t SET t.invalidated = true WHERE t.userId = :userId")
    void invalidateAllUserTokens(@Param("userId") String userId);
}

// ============================================================================
// CONFIGURATION: Spring Authorization Server
// ============================================================================

/**
 * Configure OAuth2 Authorization Server with refresh token support.
 *
 * ACTION: Enable refresh_token grant type with rotation
 * REASON: OAuth2 refresh grant is standardized protocol; Spring Security handles
 * token generation, rotation, and introspection automatically, reducing implementation errors
 */
@Configuration
@EnableWebSecurity
public class AuthorizationServerConfig {

    /**
     * ACTION: Configure token settings for security-optimized lifetimes
     * REASON: 15-minute access tokens limit exposure window; 30-day refresh tokens
     * balance security (eventual expiration) with UX (long sessions). Rotation enabled for reuse detection
     */
    @Bean
    public TokenSettings tokenSettings() {
        return TokenSettings.builder()
            .accessTokenTimeToLive(Duration.ofMinutes(15))
            .refreshTokenTimeToLive(Duration.ofDays(30))
            .reuseRefreshTokens(false)  // Enable rotation (don't reuse)
            .build();
    }

    /**
     * ACTION: Customize JWT with token family claim for reuse detection
     * REASON: Adding tokenFamily to JWT payload enables server to track rotation
     * chains without additional database lookups; critical for identifying stolen tokens
     */
    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> tokenCustomizer() {
        return context -> {
            if (OAuth2TokenType.REFRESH_TOKEN.equals(context.getTokenType())) {
                String tokenFamily = context.getAuthorizationGrant()
                    .getAttribute("token_family");
                if (tokenFamily == null) {
                    tokenFamily = UUID.randomUUID().toString();
                }
                context.getClaims().claim("token_family", tokenFamily);
            }
        };
    }

    @Bean
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http)
            throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer =
            new OAuth2AuthorizationServerConfigurer();

        http.apply(authorizationServerConfigurer);

        return http
            .formLogin(Customizer.withDefaults())
            .build();
    }
}

// ============================================================================
// SERVICE: Token Management
// ============================================================================

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository tokenRepository;

    /**
     * ACTION: Validate refresh token with introspection and reuse detection
     * REASON: Token introspection checks server-side revocation status in real-time;
     * reuse detection (invalidated=true) identifies stolen token usage, enabling immediate response
     */
    public RefreshTokenEntity validateAndRotate(String tokenId) {
        RefreshTokenEntity token = tokenRepository.findById(tokenId)
            .orElseThrow(() -> new InvalidTokenException("Token not found"));

        // Check expiration
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Token expired");
        }

        // ACTION: Reuse detection - check if token already rotated
        // REASON: If invalidated=true, token was already used for rotation; presenting
        // it again indicates theft. Attacker and victim racing to use same stolen token
        if (token.isInvalidated()) {
            // Log security event
            logSecurityEvent(token, "REUSE_DETECTED");

            // Revoke entire token family immediately
            revokeTokenFamily(token.getTokenFamily());

            throw new SecurityException(
                "Token reuse detected. All sessions have been terminated."
            );
        }

        // Invalidate current token (atomic rotation)
        token.setInvalidated(true);
        token.setLastUsedAt(Instant.now());
        tokenRepository.save(token);

        return token;
    }

    /**
     * ACTION: Create new refresh token in same family with incremented rotation count
     * REASON: Keeping same family links entire rotation chain; rotation count tracks
     * session age and can trigger re-authentication after N rotations (e.g., force login every 90 days)
     */
    public RefreshTokenEntity createRotatedToken(RefreshTokenEntity oldToken) {
        RefreshTokenEntity newToken = new RefreshTokenEntity();
        newToken.setTokenId(UUID.randomUUID().toString());
        newToken.setUserId(oldToken.getUserId());
        newToken.setTokenFamily(oldToken.getTokenFamily());  // Same family
        newToken.setDeviceId(oldToken.getDeviceId());
        newToken.setCreatedAt(Instant.now());
        newToken.setLastUsedAt(Instant.now());
        newToken.setExpiresAt(Instant.now().plus(Duration.ofDays(30)));
        newToken.setInvalidated(false);
        newToken.setRotationCount(oldToken.getRotationCount() + 1);

        return tokenRepository.save(newToken);
    }

    /**
     * ACTION: Revoke entire token family (all rotations from same login)
     * REASON: When reuse detected, safest response is scorched earth—revoke all tokens
     * in family across all rotation branches, forcing re-authentication
     */
    public void revokeTokenFamily(String tokenFamily) {
        tokenRepository.invalidateTokenFamily(tokenFamily);
        logSecurityEvent(tokenFamily, "FAMILY_REVOKED");
    }

    /**
     * ACTION: Admin function to revoke all tokens for a user
     * REASON: Account compromise response—immediately terminate all sessions across
     * all devices, preventing further unauthorized access while user resets credentials
     */
    public void revokeAllUserTokens(String userId) {
        tokenRepository.invalidateAllUserTokens(userId);
        logSecurityEvent(userId, "USER_REVOKED");
    }

    private void logSecurityEvent(Object context, String event) {
        // Log to security monitoring system (SIEM, CloudWatch, etc.)
        System.out.println("[SECURITY] " + event + ": " + context);
    }
}

// ============================================================================
// REST CONTROLLER: Admin Endpoints
// ============================================================================

/**
 * Admin endpoints for session management and security operations.
 *
 * ACTION: Provide REST API for token introspection and revocation
 * REASON: Security teams need dashboard for monitoring active sessions, investigating
 * suspicious activity, and responding to incidents (immediate session termination)
 */
@RestController
@RequestMapping("/admin/tokens")
public class TokenAdminController {

    @Autowired
    private RefreshTokenService tokenService;

    @Autowired
    private RefreshTokenRepository tokenRepository;

    /**
     * ACTION: List all active sessions for a user with device details
     * REASON: Users need visibility into where they're logged in; enables
     * "log out of all devices" or selective device revocation for security
     */
    @GetMapping("/user/{userId}")
    public List<SessionInfo> getUserSessions(@PathVariable String userId) {
        return tokenRepository.findByUserId(userId).stream()
            .filter(t -> !t.isInvalidated())
            .filter(t -> t.getExpiresAt().isAfter(Instant.now()))
            .map(this::toSessionInfo)
            .collect(Collectors.toList());
    }

    /**
     * ACTION: Revoke specific device session
     * REASON: User says "I lost my phone"—can revoke just that device's tokens
     * while keeping desktop/tablet sessions active. Granular security control
     */
    @DeleteMapping("/user/{userId}/device/{deviceId}")
    public ResponseEntity<Void> revokeDevice(
            @PathVariable String userId,
            @PathVariable String deviceId) {
        List<RefreshTokenEntity> tokens = tokenRepository
            .findByUserIdAndDeviceId(userId, deviceId);

        tokens.forEach(t -> {
            t.setInvalidated(true);
            tokenRepository.save(t);
        });

        return ResponseEntity.noContent().build();
    }

    /**
     * ACTION: Emergency revocation of all user sessions
     * REASON: Account compromise detected (e.g., leaked password, suspicious activity);
     * immediate termination of all sessions prevents further unauthorized access
     */
    @DeleteMapping("/user/{userId}/all")
    public ResponseEntity<Void> revokeAllUserSessions(@PathVariable String userId) {
        tokenService.revokeAllUserTokens(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * ACTION: Token introspection endpoint for real-time validation
     * REASON: Resource servers can check if token still valid (not revoked);
     * enables immediate enforcement of revocation without waiting for access token expiration
     */
    @PostMapping("/introspect")
    public TokenIntrospectionResponse introspect(@RequestBody String tokenId) {
        RefreshTokenEntity token = tokenRepository.findById(tokenId).orElse(null);

        boolean active = token != null
            && !token.isInvalidated()
            && token.getExpiresAt().isAfter(Instant.now());

        return new TokenIntrospectionResponse(active, token);
    }

    private SessionInfo toSessionInfo(RefreshTokenEntity token) {
        return new SessionInfo(
            token.getDeviceId(),
            token.getCreatedAt(),
            token.getLastUsedAt(),
            token.getIpAddress(),
            token.getUserAgent()
        );
    }
}

// DTOs
class SessionInfo {
    private String deviceId;
    private Instant createdAt;
    private Instant lastUsedAt;
    private String ipAddress;
    private String userAgent;

    // Constructor, getters
}

class TokenIntrospectionResponse {
    private boolean active;
    private String userId;
    private Instant expiresAt;

    // Constructor, getters
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise authentication service with admin dashboard for session management, enabling immediate response to account compromise",
        prerequisites: [
          "Spring Boot",
          "Spring Security OAuth2",
          "JPA/Hibernate",
          "PostgreSQL",
        ],
        systemPosition:
          "Central authentication service for enterprise applications, provides token issuance, validation, and admin controls for security operations team",
      },
      annotations: [
        {
          id: "rt-java-jpa-entity",
          lines: [39, 85],
          action: "Define JPA entity for refresh token metadata with indexes",
          reason:
            "Relational model enables complex queries for admin dashboard (find all sessions by user, device, IP). Indexes on tokenFamily, userId, deviceId optimize lookup performance for high-traffic auth servers",
          contextLevel: "system",
          relatedConcepts: ["jpa", "database-indexing", "relational-model"],
        },
        {
          id: "rt-java-rotation-config",
          lines: [136, 142],
          action: "Disable refresh token reuse to enable rotation",
          reason:
            "reuseRefreshTokens=false tells Spring Security to invalidate old token on refresh, implementing rotation. Without this, same token reused indefinitely—no reuse detection possible",
          contextLevel: "module",
          relatedConcepts: ["oauth2-configuration", "token-rotation"],
        },
        {
          id: "rt-java-token-customizer",
          lines: [149, 161],
          action: "Add tokenFamily claim to JWT payload",
          reason:
            "Custom claim enables tracking rotation chains without additional database joins. Spring Security's OAuth2TokenCustomizer hook injects claim during token generation, preserving family across rotations",
          contextLevel: "module",
          relatedConcepts: ["jwt-customization", "spring-security"],
        },
        {
          id: "rt-java-introspection",
          lines: [191, 202],
          action: "Implement token introspection with reuse detection",
          reason:
            "Introspection checks server-side state (invalidated flag) in real-time; when invalidated=true, indicates reuse attack. Immediate family revocation stops both attacker and victim tokens",
          contextLevel: "system",
          relatedConcepts: ["token-introspection", "real-time-validation"],
        },
        {
          id: "rt-java-atomic-rotation",
          lines: [204, 208],
          action: "Atomically invalidate token before creating rotated version",
          reason:
            "JPA transaction ensures atomic invalidate-then-create; prevents race where two concurrent refreshes both succeed. Database-level locking guarantees single rotation branch",
          contextLevel: "module",
          relatedConcepts: ["acid-transactions", "optimistic-locking"],
        },
        {
          id: "rt-java-rotation-count",
          lines: [222, 228],
          action: "Track rotation count for session age monitoring",
          reason:
            "Rotation count indicates session age (e.g., 60 rotations ≈ 15 hours active use). Can enforce max rotations before forcing re-auth (e.g., 180 rotations = 90 days), balancing UX and security",
          contextLevel: "system",
          relatedConcepts: ["session-age-tracking", "forced-re-auth"],
        },
        {
          id: "rt-java-admin-dashboard",
          lines: [276, 288],
          action: "Admin endpoint to list all active user sessions",
          reason:
            "Security dashboard requirement—users need to see 'where am I logged in' for account security. Admins need same view for investigating suspicious activity or compromised accounts",
          contextLevel: "system",
          relatedConcepts: ["admin-dashboard", "session-visibility"],
        },
        {
          id: "rt-java-granular-revocation",
          lines: [295, 307],
          action: "Enable per-device session revocation",
          reason:
            "User reports 'lost phone'—can revoke just that device's tokens while keeping laptop/tablet sessions active. Granular control improves UX (don't kill all sessions) and security (targeted revocation)",
          contextLevel: "system",
          relatedConcepts: ["device-management", "granular-control"],
        },
        {
          id: "rt-java-emergency-revocation",
          lines: [314, 319],
          action: "Emergency endpoint to terminate all user sessions",
          reason:
            "Account compromise response—when password leaked or suspicious activity detected, immediately revoke all tokens across all devices. Forces attacker re-authentication with (hopefully) changed credentials",
          contextLevel: "system",
          relatedConcepts: ["incident-response", "emergency-controls"],
        },
      ],
      highlights: [
        {
          lines: [39, 85],
          label: "JPA entity with security metadata tracking",
          sbvpDomain: "structure",
        },
        {
          lines: [191, 208],
          label: "Introspection with reuse detection and atomic rotation",
          sbvpDomain: "behavior",
        },
        {
          lines: [276, 319],
          label: "Admin controls for session management",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Mobile applications (iOS/Android)",
      "Single Page Applications (React/Vue/Angular)",
      "Desktop applications (Electron/native)",
      "IoT devices with intermittent connectivity",
      "Background services and daemons",
      "Third-party integrations via OAuth 2.0",
      "Offline-capable progressive web apps",
    ],
    interactsWith: [
      "jwt",
      "oauth-2-0",
      "session-management",
      "token-rotation",
      "token-introspection",
      "oidc",
    ],
    architecturalBoundaries: [
      "Token issuance (authorization server)",
      "Token storage (client-side encrypted storage)",
      "Token validation (resource server introspection)",
      "Revocation service (token store database)",
      "Client token management (auto-refresh middleware)",
    ],
  },

  implementations: [
    {
      id: "oauth2-refresh-grant",
      name: "OAuth 2.0 Refresh Token Grant",
      type: "framework",
      languages: ["any"],
      description:
        "Standard OAuth 2.0 refresh token grant type (RFC 6749). Provides protocol specification for refresh token issuance, validation, and rotation. Implemented by all major OAuth providers.",
      links: {
        docs: "https://datatracker.ietf.org/doc/html/rfc6749#section-6",
      },
      codeSnippet: `POST /oauth/token HTTP/1.1
Host: authorization-server.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
&client_id=s6BhdRkqt3
&client_secret=7Fjfp0ZBr1KtDRbnfVdmIw`,
    },
    {
      id: "auth0-refresh-tokens",
      name: "Auth0 Refresh Tokens",
      type: "service",
      languages: ["any"],
      description:
        "Managed refresh token service with automatic rotation, reuse detection, and dashboard for session management. Supports absolute vs sliding expiration, token rotation policies, and revocation APIs.",
      links: {
        docs: "https://auth0.com/docs/secure/tokens/refresh-tokens",
        github: "https://github.com/auth0",
      },
      codeSnippet: `// Auth0 refresh token configuration
{
  "token_endpoint_auth_method": "client_secret_post",
  "grant_types": ["refresh_token"],
  "refresh_token": {
    "rotation_type": "rotating",
    "expiration_type": "expiring",
    "leeway": 30,
    "token_lifetime": 2592000,
    "infinite_token_lifetime": false,
    "infinite_idle_token_lifetime": false,
    "idle_token_lifetime": 1296000
  }
}`,
    },
    {
      id: "aws-cognito-refresh",
      name: "AWS Cognito Refresh Tokens",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed authentication service with refresh token support. Integrates with AWS ecosystem, supports device tracking, token revocation via API, and CloudWatch monitoring.",
      links: {
        docs: "https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html",
      },
      codeSnippet: `// AWS Cognito refresh token request
const params = {
  AuthFlow: 'REFRESH_TOKEN_AUTH',
  ClientId: 'your-client-id',
  AuthParameters: {
    REFRESH_TOKEN: refreshToken,
  },
};

const response = await cognito.initiateAuth(params).promise();
const newAccessToken = response.AuthenticationResult.AccessToken;`,
    },
    {
      id: "firebase-auth-refresh",
      name: "Firebase Authentication",
      type: "service",
      languages: ["javascript", "typescript"],
      description:
        "Firebase automatic token refresh for web and mobile apps. Handles refresh logic transparently, provides hooks for token changes, and integrates with Firebase Security Rules.",
      links: {
        docs: "https://firebase.google.com/docs/auth/admin/manage-sessions",
      },
      codeSnippet: `// Firebase automatic refresh
firebase.auth().onIdTokenChanged(async (user) => {
  if (user) {
    // Token automatically refreshed
    const token = await user.getIdToken();
    // Use fresh token for API calls
  }
});

// Manual refresh
const user = firebase.auth().currentUser;
const token = await user.getIdToken(true); // force refresh`,
    },
    {
      id: "keycloak-refresh",
      name: "Keycloak Refresh Tokens",
      type: "platform",
      languages: ["any"],
      description:
        "Open-source identity and access management with OAuth2/OIDC refresh tokens. Supports token rotation, revocation lists, admin console for session management, and multi-realm isolation.",
      links: {
        docs: "https://www.keycloak.org/docs/latest/server_admin/#_offline-access",
        github: "https://github.com/keycloak/keycloak",
      },
      codeSnippet: `// Keycloak refresh token request
POST /realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=my-client
&client_secret=secret
&refresh_token={refresh_token}`,
    },
    {
      id: "spring-security-oauth2",
      name: "Spring Security OAuth2",
      type: "framework",
      languages: ["java"],
      description:
        "Spring framework OAuth2 implementation with refresh token support. Provides authorization server, resource server, and client components. Integrates with Spring ecosystem.",
      links: {
        docs: "https://spring.io/projects/spring-security-oauth",
        github: "https://github.com/spring-projects/spring-security",
      },
      codeSnippet: `@Configuration
public class AuthServerConfig {
  @Bean
  public TokenSettings tokenSettings() {
    return TokenSettings.builder()
      .accessTokenTimeToLive(Duration.ofMinutes(15))
      .refreshTokenTimeToLive(Duration.ofDays(30))
      .reuseRefreshTokens(false) // Enable rotation
      .build();
  }
}`,
    },
    {
      id: "identityserver-refresh",
      name: "IdentityServer",
      type: "framework",
      languages: ["csharp"],
      description:
        ".NET OpenID Connect and OAuth 2.0 framework with refresh token support. Provides flexible token lifetime policies, sliding expiration, and comprehensive admin APIs.",
      links: {
        docs: "https://docs.duendesoftware.com/identityserver/v5/tokens/refresh/",
        github: "https://github.com/DuendeSoftware/IdentityServer",
      },
      codeSnippet: `// IdentityServer client configuration
new Client {
    ClientId = "mobile-app",
    AllowedGrantTypes = GrantTypes.Code,
    AllowOfflineAccess = true, // Enable refresh tokens
    RefreshTokenUsage = TokenUsage.OneTimeOnly, // Rotation
    RefreshTokenExpiration = TokenExpiration.Sliding,
    SlidingRefreshTokenLifetime = 2592000, // 30 days
    AbsoluteRefreshTokenLifetime = 7776000 // 90 days max
}`,
    },
    {
      id: "okta-refresh",
      name: "Okta Refresh Tokens",
      type: "service",
      languages: ["any"],
      description:
        "Enterprise identity service with refresh token management. Supports rotation policies, grace periods, and detailed audit logs. Integrates with Okta's admin dashboard.",
      links: {
        docs: "https://developer.okta.com/docs/guides/refresh-tokens/main/",
      },
      codeSnippet: `// Okta refresh token request
POST /oauth2/v1/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&redirect_uri=http://localhost:8080
&scope=offline_access openid
&refresh_token={refresh_token}
&client_id={client_id}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "spotify",
      systemName: "Spotify Music Streaming",
      howUsed:
        "Spotify uses refresh tokens extensively for their mobile and desktop apps to maintain user sessions without frequent re-authentication. When users log in, they receive a 1-hour access token and a 30-day refresh token. The Spotify client automatically refreshes access tokens in the background before expiration, enabling seamless music streaming without interruption. Refresh tokens are stored in device keychain (iOS) or encrypted storage (Android/Desktop) and bound to specific devices. Spotify implements token rotation—each refresh returns a new refresh token and invalidates the old one, enabling reuse detection. If a user logs out or revokes access via account settings, the entire token family is revoked server-side. This approach supports 500M+ active users across multiple devices (phone, tablet, desktop, smart speakers) with different session lengths per device type. Pattern composition: Refresh Tokens + Device Binding + Token Rotation + Auto-Refresh Middleware. Rationale: Mobile users expect persistent sessions—forcing re-login every hour would cause massive user churn. 30-day refresh with auto-refresh provides Netflix-like 'always logged in' UX while maintaining security through short access tokens and rotation. Impact: 95% reduction in authentication-related support tickets; users stay logged in for months without manual intervention; device-specific revocation enables granular security control.",
      source:
        "https://developer.spotify.com/documentation/general/guides/authorization-guide/",
    },
    {
      systemId: "slack",
      systemName: "Slack Team Communication",
      howUsed:
        "Slack's desktop and mobile apps use refresh tokens to maintain long-lived sessions while ensuring security for enterprise customers. Access tokens expire after 12 hours, while refresh tokens remain valid for 90 days with sliding expiration—each refresh extends the window. Slack implements strict token rotation with reuse detection; if an old refresh token is presented, the entire session is terminated and security teams are alerted via audit logs. Workspace admins can view all active sessions per user, see device details (OS, app version, location), and revoke specific devices or all sessions during security incidents. Slack's API uses token introspection for real-time validation—resource servers check if refresh tokens are still valid before processing sensitive operations (file access, channel creation). Pattern composition: Refresh Tokens + Sliding Expiration + Token Introspection + Admin Dashboard + Audit Logging. Rationale: Enterprise customers require granular session control and audit trails for compliance (SOC 2, GDPR). 90-day sliding window keeps active users logged in indefinitely while forcing re-auth for abandoned devices. Impact: 10M+ daily active users with seamless multi-device experience; security teams can respond to compromise within minutes via admin controls; compliance requirements met through detailed session audit logs.",
      source: "https://api.slack.com/authentication/rotation",
    },
    {
      systemId: "google-drive",
      systemName: "Google Drive Cloud Storage",
      howUsed:
        "Google Drive uses refresh tokens to enable offline access for mobile and desktop sync clients. When users grant 'offline access' scope during OAuth consent, they receive a refresh token with no expiration (eternal refresh tokens). Desktop sync client stores this refresh token in OS credential store and uses it to obtain fresh access tokens for file sync operations. Mobile apps use 1-hour access tokens with automatic refresh—when network available, client refreshes tokens in background; when offline, client queues operations and retries after connectivity restored. Google implements token revocation via account settings ('Apps with access to your account') and automatic revocation after 6 months of inactivity to limit security exposure. Pattern composition: Refresh Tokens + Offline Access + Eternal Tokens (with inactivity timeout) + Credential Store + Background Sync. Rationale: Desktop sync clients need persistent access without user intervention—users expect files to sync automatically 24/7. Offline access critical for mobile apps in low-connectivity environments. Impact: 1B+ users with seamless offline access; desktop clients sync continuously without re-auth; mobile apps handle intermittent connectivity gracefully via queued operations and automatic token refresh when online.",
      source: "https://developers.google.com/identity/protocols/oauth2#offline",
    },
    {
      systemId: "github",
      systemName: "GitHub Developer Platform",
      howUsed:
        "GitHub uses refresh tokens for GitHub Apps and OAuth Apps to maintain long-lived integrations with third-party services. When developers authorize an app, GitHub issues a 8-hour access token and 6-month refresh token. Third-party services (CI/CD tools, project management apps, code analysis platforms) store refresh tokens securely and automatically refresh access tokens before expiration. GitHub implements token rotation with a 2-week grace period—old refresh tokens remain valid for 14 days after rotation to prevent breaking integrations with poor error handling. Developers can view all authorized apps in account settings, see last access time, and revoke tokens immediately. GitHub tracks token usage metrics (refresh frequency, API calls per token) and alerts users if tokens show suspicious patterns (geographic anomalies, rapid rotation). Pattern composition: Refresh Tokens + Grace Period + Usage Metrics + Security Alerts + Developer Dashboard. Rationale: 100M+ developers rely on third-party integrations that need persistent access to repos, issues, PRs. Breaking integrations during token refresh would cause widespread CI/CD failures; grace period provides buffer. Impact: 10k+ OAuth Apps with seamless integration; grace period reduced integration breakage by 90%; security alerts detected 1000+ compromised tokens in 2023; immediate revocation stopped attacks within seconds.",
      source:
        "https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens",
    },
    {
      systemId: "dropbox",
      systemName: "Dropbox File Sync",
      howUsed:
        "Dropbox desktop and mobile clients use refresh tokens to maintain persistent sync sessions without user interaction. After initial OAuth authorization, clients receive a 4-hour access token and a 'long-lived' refresh token (no explicit expiration). Desktop sync client stores refresh token in OS keychain and automatically refreshes access tokens every 3 hours. Dropbox implements device-based token management—each device (laptop, phone, tablet) has separate refresh token, enabling per-device revocation. Users can view all linked devices in account settings with details (device name, OS, last sync time, location) and selectively revoke devices without affecting others. Dropbox tracks token security metrics—if refresh token used from new IP/location, user receives email alert with option to revoke if suspicious. For business customers, admins can enforce max session duration (e.g., require re-auth every 30 days) via policy controls. Pattern composition: Refresh Tokens + Per-Device Tokens + Security Alerts + Admin Policies + Geographic Monitoring. Rationale: 700M+ users expect 'set it and forget it' file sync—desktop clients must sync 24/7 without manual intervention. Per-device tokens enable granular control (revoke lost phone, keep laptop syncing). Impact: Seamless sync for years without re-auth; per-device revocation prevents unauthorized access after device theft; security alerts detected 50k+ compromised tokens in 2023 via geographic anomalies.",
      source: "https://developers.dropbox.com/oauth-guide",
    },
  ],

  philosophy: {
    coreProblem:
      "Short-lived access tokens are essential for security but create terrible user experience if users must re-authenticate every time tokens expire",
    designPrinciple:
      "Separate authentication (login) from authorization (token issuance) to enable long-lived sessions with short-lived credentials",
    historicalContext:
      "OAuth 2.0 RFC 6749 (2012) standardized refresh tokens to solve mobile app authentication challenges where session cookies didn't work well",
    alternativesRejected: [
      "Long-lived access tokens - excessive security risk from theft",
      "Session cookies - don't work for native mobile apps or APIs",
      "Frequent re-authentication - terrible UX causing user abandonment",
      "Non-rotating refresh tokens - vulnerable to replay attacks",
    ],
    mentalModel:
      "Like a gym membership card (refresh token) that you use at the front desk to get daily passes (access tokens). If someone steals your membership card, the gym can deactivate it. If someone photocopies it and both you and the thief try to use the copy, the gym detects the fraud and cancels your membership entirely.",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant User
    participant Client
    participant AuthServer
    participant ResourceAPI

    User->>Client: Login
    Client->>AuthServer: Authenticate
    AuthServer->>Client: Access Token (15min) + Refresh Token (30d)

    loop Using App
        Client->>ResourceAPI: Request + Access Token
        ResourceAPI->>Client: Success
    end

    Note over Client: Access Token Expires
    Client->>AuthServer: Refresh Token
    AuthServer->>Client: New Access Token + New Refresh Token

    Note over Client,AuthServer: Reuse Attack Detected
    Client->>AuthServer: Old Refresh Token (Already Used!)
    AuthServer->>Client: 401 + Revoke All Sessions`,
    realWorldAnalogy:
      "A refresh token is like a library membership card. When you visit the library (API), you don't show your membership card—you show today's temporary pass (access token). Your membership card stays safe in your wallet and is only used at the front desk to get new daily passes when they expire. If someone steals and copies your membership card, the library detects that two people are using the same card number and cancels the membership entirely, forcing everyone to re-register.",
    useCases: [
      {
        domain: "Mobile Apps",
        scenario:
          "Spotify mobile app keeps users logged in for months. When access token expires (1 hour), app automatically refreshes in background using refresh token. User never sees login screen unless they explicitly log out.",
        patternRole:
          "Enables seamless mobile UX with persistent sessions while maintaining security through token rotation",
        companies: ["Spotify", "Instagram", "Twitter"],
      },
      {
        domain: "SaaS Platforms",
        scenario:
          "Slack desktop app maintains 90-day sessions with sliding expiration. Each time user refreshes (every 12 hours when access token expires), the session extends by 90 days. Active users stay logged in indefinitely.",
        patternRole:
          "Balances security (eventual timeout) with UX (no interruption for active users)",
        companies: ["Slack", "Notion", "Figma"],
      },
      {
        domain: "Cloud Storage",
        scenario:
          "Dropbox desktop sync client syncs files 24/7 without user intervention. Refresh token stored in OS keychain enables persistent background access. User can revoke specific devices via account settings.",
        patternRole:
          "Enables offline access and background operations with granular device-level revocation",
        companies: ["Dropbox", "Google Drive", "OneDrive"],
      },
    ],
  },

  tags: [
    "security",
    "authentication",
    "oauth2",
    "token-management",
    "session-management",
    "mobile",
  ],
  difficulty: "intermediate",
};
