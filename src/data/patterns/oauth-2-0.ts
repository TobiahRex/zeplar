import type { Pattern } from "../schema";

export const oAuth20: Pattern = {
  id: "oauth-2-0",
  slug: "oauth-2-0",
  corpusPath: "🔒 SECURITY → 🔑 Delegated Auth → OAuth 2.0",

  hierarchy: {
    quality: "security",
    strategy: "",
    family: "Delegated Authorization",
    level: 4,
  },

  concept: {
    name: "OAuth 2.0",
    emoji: "🔑",
    tagline: "Delegated authorization without password sharing",
    definition:
      "OAuth 2.0 is an industry-standard authorization framework that enables third-party applications to obtain limited access to user resources without exposing passwords. Instead of sharing credentials, users grant applications scoped permissions through an authorization server that issues time-limited access tokens. The framework defines multiple grant flows optimized for different client types: Authorization Code Flow (server-side web apps with PKCE for SPAs/mobile), Client Credentials (machine-to-machine), and deprecated Implicit Flow (replaced by Authorization Code + PKCE). OAuth 2.0 separates four distinct roles: Resource Owner (user), Client (third-party app), Authorization Server (issues tokens), and Resource Server (API protecting resources). When a user authorizes an app, they see a consent screen listing requested scopes (read:profile, write:calendar), granting fine-grained permissions rather than full account access. The authorization server returns an authorization code to the client, which exchanges it for access tokens—preventing token exposure in browser history. Access tokens (often JWTs) are short-lived (1 hour), while refresh tokens enable seamless renewal without re-authentication. This token-based model scales horizontally, works across domains, and enables secure API access for mobile apps, SPAs, and third-party integrations without password anti-patterns.",
    problemSolved:
      "Traditional authentication requires users to share passwords with every application, creating severe security risks: password database breaches expose credentials to all integrated services; users cannot revoke access without changing passwords everywhere; apps gain full account control rather than limited permissions. OAuth 2.0 solves this by eliminating password sharing entirely. Users authenticate once with the authorization server (e.g., Google, GitHub) and grant scoped permissions to apps via consent screens. Apps receive access tokens valid only for approved scopes and time periods—users can revoke tokens anytime without password changes. This prevents credential exposure and limits blast radius of compromised apps. OAuth also solves cross-domain API access: traditional session cookies fail across origins due to CORS and same-site policies. OAuth tokens in Authorization headers work universally across web, mobile, and IoT. Token-based authorization enables distributed systems to verify permissions without shared session stores—critical for microservices and cloud architectures. Standardized flows ensure interoperability: same OAuth client can integrate Google, GitHub, and enterprise SSO without custom code.",
    tradeoffs: {
      pros: [
        "No password sharing—users never expose credentials to third-party apps",
        "Scope-limited permissions—apps access only approved resources (read-only, specific APIs)",
        "Token expiration and revocation—time-bound access with instant revocation",
        "Standardized flows—interoperable across Google, GitHub, Microsoft, enterprise SSO",
        "Wide platform support—works with web, mobile, IoT, server-to-server",
      ],
      cons: [
        "Complexity—Authorization Code Flow involves 10+ steps with state, PKCE, redirects",
        "Token theft risk—access tokens vulnerable to XSS attacks if stored in localStorage",
        "Redirect URI vulnerabilities—open redirect attacks if URI validation weak",
        "PKCE required for public clients—SPAs and mobile must implement PKCE (additional complexity)",
        "Implicit flow deprecated—legacy OAuth clients must migrate to Authorization Code + PKCE",
      ],
    },
    relatedPatterns: [
      "oidc",
      "jwt",
      "refresh-tokens",
      "saml",
      "api-keys",
      "pkce",
      "authorization-code-flow",
    ],
  },

  structure: {
    participants: [
      {
        name: "Resource Owner (User)",
        role: "Authorization Grantor",
        responsibilities: [
          "Authenticate with authorization server using credentials",
          "Review consent screen showing requested scopes",
          "Grant or deny authorization to client application",
          "Revoke access tokens via authorization server settings",
        ],
      },
      {
        name: "Client (Application)",
        role: "Resource Requester",
        responsibilities: [
          "Redirect user to authorization server for consent",
          "Receive authorization code via redirect URI callback",
          "Exchange authorization code for access token at token endpoint",
          "Include access token in API requests to resource server",
          "Refresh access tokens using refresh token before expiration",
        ],
      },
      {
        name: "Authorization Server",
        role: "Token Issuer",
        responsibilities: [
          "Authenticate resource owner and display consent screen",
          "Validate client credentials and redirect URI",
          "Issue authorization code after user consent",
          "Exchange authorization code for access and refresh tokens",
          "Validate PKCE code verifier to prevent authorization code interception",
          "Revoke tokens when user removes app authorization",
        ],
      },
      {
        name: "Resource Server (API)",
        role: "Protected Resource",
        responsibilities: [
          "Validate access token signature and expiration",
          "Enforce scope-based authorization (check token scopes match endpoint requirements)",
          "Return protected resources if token valid and scopes sufficient",
          "Reject requests with expired, invalid, or insufficient-scope tokens",
        ],
      },
      {
        name: "Access Token",
        role: "Authorization Credential",
        responsibilities: [
          "Represent delegated authorization with scoped permissions",
          "Enable stateless verification via JWT signature or token introspection",
          "Expire after short lifetime (typically 1 hour) to limit exposure",
          "Include claims: subject (user ID), scopes, expiration, issuer, audience",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User as Resource Owner
    participant Client as Third-Party App
    participant AuthServer as Authorization Server
    participant API as Resource Server

    User->>Client: 1. Initiate login/authorization
    Client->>Client: 2. Generate PKCE code_verifier<br/>code_challenge = SHA256(verifier)
    Client->>User: 3. Redirect to AuthServer<br/>?client_id&redirect_uri<br/>&scope&state&code_challenge
    User->>AuthServer: 4. Authenticate (login)
    AuthServer->>User: 5. Show consent screen<br/>(scopes requested)
    User->>AuthServer: 6. Approve authorization
    AuthServer->>AuthServer: 7. Validate redirect_uri<br/>Store code_challenge
    AuthServer->>Client: 8. Redirect to redirect_uri<br/>?code=AUTH_CODE&state=STATE
    Client->>Client: 9. Validate state parameter<br/>(CSRF protection)
    Client->>AuthServer: 10. POST /token<br/>{code, code_verifier, redirect_uri}
    AuthServer->>AuthServer: 11. Verify code_challenge<br/>SHA256(code_verifier) == stored
    AuthServer->>Client: 12. {access_token, refresh_token, expires_in}
    Client->>API: 13. GET /api/resource<br/>Authorization: Bearer ACCESS_TOKEN
    API->>API: 14. Verify token signature<br/>Check scopes & expiration
    API->>Client: 15. Return protected resource

    Note over Client,API: Access token expires after 1 hour
    Client->>AuthServer: 16. POST /token<br/>{grant_type: refresh_token}
    AuthServer->>Client: 17. New access_token`,
    flow: [
      {
        step: 1,
        actor: "Resource Owner",
        action: "Initiate Authorization",
        description:
          "User clicks 'Sign in with Google' or 'Connect GitHub' button in client application",
      },
      {
        step: 2,
        actor: "Client",
        action: "Generate PKCE Challenge",
        description:
          "Client generates random code_verifier (43-128 chars) and computes code_challenge = SHA256(code_verifier) for PKCE security",
      },
      {
        step: 3,
        actor: "Client",
        action: "Redirect to Authorization Endpoint",
        description:
          "Client redirects user to authorization server with parameters: client_id, redirect_uri, scope, state (CSRF token), code_challenge, code_challenge_method=S256",
      },
      {
        step: 4,
        actor: "Resource Owner",
        action: "Authenticate",
        description:
          "User logs into authorization server using credentials, MFA, or existing session",
      },
      {
        step: 5,
        actor: "Authorization Server",
        action: "Display Consent Screen",
        description:
          "Show user the requesting app name, logo, and list of requested scopes (e.g., 'Read your profile', 'Access your calendar')",
      },
      {
        step: 6,
        actor: "Resource Owner",
        action: "Grant Authorization",
        description:
          "User reviews scopes and clicks 'Allow' to grant client limited access to their resources",
      },
      {
        step: 7,
        actor: "Authorization Server",
        action: "Validate and Store Challenge",
        description:
          "Server validates redirect_uri matches registered value, stores code_challenge associated with authorization code",
      },
      {
        step: 8,
        actor: "Authorization Server",
        action: "Return Authorization Code",
        description:
          "Redirect user back to client's redirect_uri with authorization code in query params: ?code=AUTH_CODE&state=STATE",
      },
      {
        step: 9,
        actor: "Client",
        action: "Validate State Parameter",
        description:
          "Client verifies state parameter matches initial value to prevent CSRF attacks (authorization initiated by attacker)",
      },
      {
        step: 10,
        actor: "Client",
        action: "Exchange Code for Token",
        description:
          "Client makes POST request to token endpoint with authorization code, code_verifier, client credentials, and redirect_uri",
      },
      {
        step: 11,
        actor: "Authorization Server",
        action: "Verify PKCE Challenge",
        description:
          "Server computes SHA256(code_verifier) and compares to stored code_challenge to ensure code not intercepted",
      },
      {
        step: 12,
        actor: "Authorization Server",
        action: "Issue Access and Refresh Tokens",
        description:
          "Server returns access_token (JWT or opaque), refresh_token, expires_in (seconds), token_type: 'Bearer'",
      },
      {
        step: 13,
        actor: "Client",
        action: "Access Protected Resource",
        description:
          "Client includes access token in Authorization: Bearer <token> header when calling resource server APIs",
      },
      {
        step: 14,
        actor: "Resource Server",
        action: "Validate Token and Scopes",
        description:
          "API verifies token signature/validity, checks expiration, and ensures token scopes match endpoint requirements (e.g., read:profile)",
      },
      {
        step: 15,
        actor: "Resource Server",
        action: "Return Protected Data",
        description:
          "If token valid and scopes sufficient, API returns requested resource (user profile, calendar events, etc.)",
      },
      {
        step: 16,
        actor: "Client",
        action: "Refresh Access Token",
        description:
          "When access token expires (1 hour), client uses refresh token to obtain new access token without user interaction",
      },
    ],
    invariants: [
      "State parameter must be validated to prevent CSRF attacks—reject if missing or mismatched",
      "PKCE code_challenge must be verified for public clients (SPAs, mobile)—prevents authorization code interception",
      "Redirect URI must exactly match registered value—prevents open redirect attacks",
      "Authorization code must be single-use—revoke after token exchange to prevent replay",
      "Scopes must be enforced by resource server—access token scopes define permitted operations",
      "Access tokens must expire—typical lifetime 1 hour, maximum 24 hours",
      "Refresh tokens must be long-lived but revocable—enable seamless renewal but allow instant revocation",
    ],
  },

  codeExamples: [
    {
      id: "oauth-typescript-auth-server",
      language: "typescript",
      title: "TypeScript OAuth 2.0 Authorization Server",
      description:
        "Complete OAuth 2.0 authorization server with Authorization Code Flow + PKCE, token generation, and scope validation using oauth2-server library",
      code: `import express, { Request, Response } from 'express';
import OAuth2Server, {
  AuthorizationCode,
  Token,
  Client,
  User,
  AuthorizationCodeModel
} from 'oauth2-server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Configuration
// =============================================================================

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_LIFETIME = 3600; // 1 hour
const REFRESH_TOKEN_LIFETIME = 604800; // 7 days

// In-memory stores (use database in production)
const clients = new Map<string, Client>();
const authorizationCodes = new Map<string, AuthorizationCode>();
const tokens = new Map<string, Token>();
const users = new Map<string, User>();

// PKCE challenge storage
const pkceStore = new Map<string, { codeChallenge: string; codeChallengeMethod: string }>();

// =============================================================================
// OAuth 2.0 Model Implementation
// =============================================================================

/**
 * OAuth 2.0 model for oauth2-server library
 *
 * CONTEXT DILATION: Third-party API access without password sharing.
 * Before OAuth: Users gave third-party apps their Gmail password (!). Breach of
 * third-party app = Gmail account compromised. No way to revoke app access without
 * changing password (breaks all apps). OAuth eliminates password anti-pattern.
 */
const model: AuthorizationCodeModel = {
  /**
   * ACTION: Retrieve registered client by ID
   * REASON: Validate client exists and redirect_uri matches registration.
   *         Prevents malicious apps from impersonating legitimate clients.
   */
  async getClient(clientId: string, clientSecret?: string): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;

    // Confidential clients (server-side) must provide secret
    if (clientSecret && client.clientSecret !== clientSecret) {
      return null;
    }

    return client;
  },

  /**
   * ACTION: Save authorization code after user consent
   * REASON: Authorization code is short-lived (10 min), single-use intermediate credential.
   *         Client exchanges code for access token at token endpoint (prevents token
   *         exposure in browser redirect).
   */
  async saveAuthorizationCode(
    code: AuthorizationCode,
    client: Client,
    user: User
  ): Promise<AuthorizationCode> {
    const authCode = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      client,
      user,
      // Store PKCE challenge for verification
      codeChallenge: code.codeChallenge,
      codeChallengeMethod: code.codeChallengeMethod,
    };

    authorizationCodes.set(code.authorizationCode, authCode);
    return authCode;
  },

  /**
   * ACTION: Retrieve and validate authorization code
   * REASON: Verify code exists, not expired, matches client.
   *         Single-use: delete after retrieval to prevent replay attacks.
   */
  async getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode | null> {
    const code = authorizationCodes.get(authorizationCode);
    if (!code) return null;

    // Delete code immediately (single-use)
    authorizationCodes.delete(authorizationCode);

    // Check expiration
    if (code.expiresAt < new Date()) {
      return null;
    }

    return code;
  },

  /**
   * ACTION: Revoke authorization code after token exchange
   * REASON: Ensures code cannot be reused after successful token issuance
   */
  async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    authorizationCodes.delete(code.authorizationCode);
    return true;
  },

  /**
   * ACTION: Generate and save access token
   * REASON: Access tokens are short-lived bearer credentials. JWT format enables
   *         stateless verification by resource servers—no database lookup needed.
   */
  async saveToken(token: Token, client: Client, user: User): Promise<Token> {
    // Generate JWT access token with user claims and scopes
    const accessToken = jwt.sign(
      {
        sub: user.id,
        client_id: client.id,
        scope: token.scope,
        type: 'access',
        jti: uuidv4(),
      },
      JWT_SECRET,
      {
        expiresIn: ACCESS_TOKEN_LIFETIME,
        issuer: 'oauth.myapp.com',
        audience: 'api.myapp.com',
      }
    );

    const tokenData: Token = {
      accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
      client,
      user,
    };

    tokens.set(accessToken, tokenData);
    return tokenData;
  },

  /**
   * ACTION: Validate access token for protected resource access
   * REASON: Resource servers call this to verify token validity before granting access
   */
  async getAccessToken(accessToken: string): Promise<Token | null> {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(accessToken, JWT_SECRET, {
        issuer: 'oauth.myapp.com',
        audience: 'api.myapp.com',
      }) as any;

      // Reconstruct token object
      const client = clients.get(decoded.client_id);
      const user = users.get(decoded.sub);

      if (!client || !user) return null;

      return {
        accessToken,
        accessTokenExpiresAt: new Date(decoded.exp * 1000),
        scope: decoded.scope,
        client,
        user,
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * ACTION: Retrieve refresh token for token renewal
   * REASON: Refresh tokens enable long-lived sessions without password re-entry.
   *         Client refreshes access token before expiration—seamless UX.
   */
  async getRefreshToken(refreshToken: string): Promise<Token | null> {
    const token = Array.from(tokens.values()).find(t => t.refreshToken === refreshToken);
    if (!token) return null;

    // Check refresh token expiration
    if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
      return null;
    }

    return token;
  },

  /**
   * ACTION: Revoke refresh token after use (refresh token rotation)
   * REASON: Single-use refresh tokens limit damage if stolen
   */
  async revokeToken(token: Token): Promise<boolean> {
    tokens.delete(token.accessToken);
    return true;
  },

  /**
   * ACTION: Verify PKCE code_verifier matches code_challenge
   * REASON: PKCE prevents authorization code interception attacks.
   *         Public clients (SPAs, mobile) cannot securely store client secret.
   *         PKCE ensures only app that initiated flow can exchange code.
   */
  async verifyCodeChallenge(
    code: AuthorizationCode,
    codeVerifier: string
  ): Promise<boolean> {
    if (!code.codeChallenge || !code.codeChallengeMethod) {
      // PKCE not required for confidential clients with client_secret
      return true;
    }

    // CODE HIGHLIGHT: PKCE verification—critical security boundary
    if (code.codeChallengeMethod === 'S256') {
      const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      return hash === code.codeChallenge;
    } else if (code.codeChallengeMethod === 'plain') {
      return codeVerifier === code.codeChallenge;
    }

    return false;
  },
};

// =============================================================================
// Initialize OAuth 2.0 Server
// =============================================================================

const oauth = new OAuth2Server({
  model,
  accessTokenLifetime: ACCESS_TOKEN_LIFETIME,
  refreshTokenLifetime: REFRESH_TOKEN_LIFETIME,
  allowBearerTokensInQueryString: false, // Security: only accept tokens in header
});

// =============================================================================
// Setup: Register Clients and Users
// =============================================================================

/**
 * Register OAuth client (third-party app)
 *
 * ACTION: Store client credentials and allowed redirect URIs
 * REASON: Redirect URI validation prevents open redirect attacks.
 *         Attacker cannot redirect authorization code to their own server.
 */
clients.set('web-app-123', {
  id: 'web-app-123',
  clientSecret: 'secret-456', // Confidential client (server-side)
  grants: ['authorization_code', 'refresh_token'],
  redirectUris: ['https://myapp.com/callback', 'http://localhost:3000/callback'],
});

clients.set('mobile-app-789', {
  id: 'mobile-app-789',
  // No client secret—public client (requires PKCE)
  grants: ['authorization_code', 'refresh_token'],
  redirectUris: ['myapp://oauth/callback'], // Custom URI scheme for mobile
});

// Mock user
users.set('user-123', {
  id: 'user-123',
  username: 'alice@example.com',
});

// =============================================================================
// Authorization Endpoint (User Consent)
// =============================================================================

/**
 * GET /oauth/authorize - Display consent screen
 *
 * CONTEXT DILATION: User consent screen prevents surprise data access.
 * User sees exactly what app requests: "Read your profile", "Post tweets".
 * Explicit consent required—no hidden permissions. User can deny specific scopes.
 */
app.get('/oauth/authorize', async (req: Request, res: Response) => {
  const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = req.query;

  // Validate client
  const client = await model.getClient(client_id as string);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  // Validate redirect_uri
  if (!client.redirectUris?.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  // ACTION: Store PKCE challenge for later verification
  // REASON: Public clients (SPAs, mobile) use PKCE instead of client_secret
  if (code_challenge && code_challenge_method) {
    pkceStore.set(client_id as string, {
      codeChallenge: code_challenge as string,
      codeChallengeMethod: code_challenge_method as string,
    });
  }

  // In production, render HTML consent screen
  // For demo, auto-approve (simulate user clicking "Allow")
  res.send(\`
    <h1>Authorize \${client.id}</h1>
    <p>This app is requesting access to:</p>
    <ul>
      <li>Read your profile</li>
      <li>Access your calendar</li>
    </ul>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="\${client_id}" />
      <input type="hidden" name="redirect_uri" value="\${redirect_uri}" />
      <input type="hidden" name="scope" value="\${scope}" />
      <input type="hidden" name="state" value="\${state}" />
      <input type="hidden" name="code_challenge" value="\${code_challenge || ''}" />
      <input type="hidden" name="code_challenge_method" value="\${code_challenge_method || ''}" />
      <button type="submit" name="approve" value="true">Allow</button>
      <button type="submit" name="approve" value="false">Deny</button>
    </form>
  \`);
});

/**
 * POST /oauth/authorize - Process user consent
 */
app.post('/oauth/authorize', async (req: Request, res: Response) => {
  const { approve, client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = req.body;

  if (approve !== 'true') {
    return res.redirect(\`\${redirect_uri}?error=access_denied&state=\${state}\`);
  }

  // Generate authorization code
  const authorizationCode = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const client = await model.getClient(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  const user = users.get('user-123'); // Assume authenticated user
  if (!user) {
    return res.status(400).json({ error: 'invalid_user' });
  }

  // Save authorization code with PKCE challenge
  await model.saveAuthorizationCode(
    {
      authorizationCode,
      expiresAt,
      redirectUri: redirect_uri,
      scope,
      client,
      user,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    },
    client,
    user
  );

  // CODE HIGHLIGHT: Redirect with authorization code—prevents token in URL
  res.redirect(\`\${redirect_uri}?code=\${authorizationCode}&state=\${state}\`);
});

// =============================================================================
// Token Endpoint (Code Exchange)
// =============================================================================

/**
 * POST /oauth/token - Exchange authorization code for access token
 *
 * ACTION: Validate code, PKCE verifier, client credentials
 * REASON: Multi-layer security: code (proves user consent), PKCE (prevents
 *         interception), client credentials (authenticates app). All must be valid.
 */
app.post('/oauth/token', async (req: Request, res: Response) => {
  const request = new OAuth2Server.Request(req);
  const response = new OAuth2Server.Response(res);

  try {
    // oauth2-server handles grant type routing and validation
    const token = await oauth.token(request, response);

    res.json({
      access_token: token.accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_LIFETIME,
      refresh_token: token.refreshToken,
      scope: token.scope,
    });
  } catch (error) {
    res.status(error.code || 500).json({
      error: error.name,
      error_description: error.message,
    });
  }
});

// =============================================================================
// Protected Resource Endpoint
// =============================================================================

/**
 * Middleware to authenticate requests with OAuth access token
 */
async function authenticate(req: Request, res: Response, next: Function) {
  const request = new OAuth2Server.Request(req);
  const response = new OAuth2Server.Response(res);

  try {
    const token = await oauth.authenticate(request, response);
    req.user = token.user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'invalid_token',
      error_description: error.message,
    });
  }
}

/**
 * GET /api/profile - Protected resource requiring valid access token
 *
 * CONTEXT DILATION: Scope-based authorization limits app permissions.
 * App with 'read:profile' scope can read profile but not post tweets.
 * Resource server checks token.scope before granting access—fine-grained control.
 */
app.get('/api/profile', authenticate, (req: Request, res: Response) => {
  // Check scopes
  const requiredScope = 'read:profile';
  if (!req.token?.scope?.includes(requiredScope)) {
    return res.status(403).json({
      error: 'insufficient_scope',
      error_description: \`Requires scope: \${requiredScope}\`,
    });
  }

  // Return protected user data
  res.json({
    user_id: req.user?.id,
    username: req.user?.username,
    email: 'alice@example.com',
    scopes: req.token.scope,
  });
});

// =============================================================================
// Start Server
// =============================================================================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(\`OAuth 2.0 Authorization Server running on port \${PORT}\`);
});

export default app;`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete OAuth 2.0 authorization server with Authorization Code Flow + PKCE, token generation, scope validation, and resource protection",
        prerequisites: [
          "Express.js",
          "oauth2-server library",
          "JWT",
          "PKCE (Proof Key for Code Exchange)",
        ],
        systemPosition:
          "Authorization server in OAuth 2.0 architecture, issuing access tokens for third-party apps to access user resources on resource servers",
      },
      annotations: [
        {
          id: "oauth-pkce-verification",
          lines: [187, 202],
          action: "Verify PKCE code_verifier matches stored code_challenge",
          reason:
            "PKCE prevents authorization code interception attacks on public clients (SPAs, mobile apps). Public clients cannot securely store client_secret. PKCE ensures only the app that initiated OAuth flow can exchange authorization code for token. Attacker intercepting code cannot exchange it without code_verifier.",
          contextLevel: "system",
          relatedConcepts: [
            "pkce",
            "public-client-security",
            "authorization-code-interception",
          ],
        },
        {
          id: "oauth-redirect-uri-validation",
          lines: [58, 64],
          action: "Validate redirect_uri matches registered client URI",
          reason:
            "Prevents open redirect attacks where attacker tricks user into authorizing app, but authorization code redirected to attacker's server instead of legitimate app. Strict URI matching ensures code only sent to pre-registered endpoints.",
          contextLevel: "system",
          relatedConcepts: [
            "open-redirect",
            "redirect-uri-security",
            "client-registration",
          ],
        },
        {
          id: "oauth-authorization-code-single-use",
          lines: [96, 107],
          action: "Delete authorization code immediately after retrieval",
          reason:
            "Authorization codes are single-use to prevent replay attacks. If attacker intercepts code, they cannot reuse it after legitimate client exchanges for token. Code expires in 10 minutes—short window limits exposure.",
          contextLevel: "module",
          relatedConcepts: ["replay-attack-prevention", "single-use-tokens"],
        },
        {
          id: "oauth-jwt-access-token",
          lines: [127, 147],
          action: "Generate JWT access tokens with user claims and scopes",
          reason:
            "JWT access tokens enable stateless verification by resource servers—no database lookup or token introspection needed. Embed user ID (sub), client_id, scopes, expiration. Resource servers verify signature using shared secret or public key. Scales to millions of API requests without authorization server dependency.",
          contextLevel: "system",
          relatedConcepts: [
            "jwt",
            "stateless-verification",
            "oauth-access-tokens",
          ],
        },
        {
          id: "oauth-scope-enforcement",
          lines: [356, 364],
          action: "Check access token scopes before granting resource access",
          reason:
            "Scopes define fine-grained permissions granted during user consent. Resource server must enforce scopes—prevents apps from accessing resources beyond approved permissions. If token lacks 'write:calendar' scope, reject POST /api/calendar requests even with valid token.",
          contextLevel: "module",
          relatedConcepts: [
            "scope-based-authorization",
            "least-privilege",
            "oauth-scopes",
          ],
        },
        {
          id: "oauth-state-parameter",
          lines: [253, 254],
          action: "Include state parameter in authorization redirect",
          reason:
            "State parameter prevents CSRF attacks on OAuth flow. Client generates random state value, includes in authorization request. Validates state in callback. Prevents attacker from initiating OAuth flow with victim's browser—victim unknowingly authorizes attacker's account.",
          contextLevel: "module",
          relatedConcepts: ["csrf-protection", "oauth-state-parameter"],
        },
        {
          id: "oauth-password-elimination",
          lines: [45, 50],
          action:
            "Context: OAuth eliminates password sharing with third-party apps",
          reason:
            "Before OAuth, users gave third-party apps their Gmail password to access email. Breach of third-party app = all accounts compromised. No way to revoke app access without changing password (breaks all apps). OAuth tokens are scoped, revocable, time-limited—eliminates password anti-pattern entirely.",
          contextLevel: "system",
          relatedConcepts: [
            "delegated-authorization",
            "password-anti-pattern",
            "security-best-practices",
          ],
        },
        {
          id: "oauth-consent-screen",
          lines: [284, 297],
          action: "Display consent screen showing requested scopes",
          reason:
            "User consent is cornerstone of OAuth. User sees exactly what app requests ('Read profile', 'Post tweets'). Can approve or deny. Explicit consent prevents surprise data access. User can revoke consent anytime in authorization server settings—instant app access revocation.",
          contextLevel: "system",
          relatedConcepts: [
            "user-consent",
            "explicit-authorization",
            "scope-transparency",
          ],
        },
      ],
      highlights: [
        {
          lines: [187, 202],
          label: "PKCE verification",
          sbvpDomain: "structure",
        },
        {
          lines: [127, 147],
          label: "JWT access token generation",
          sbvpDomain: "structure",
        },
        {
          lines: [284, 297],
          label: "Consent screen rendering",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "oauth-python-client",
      language: "python",
      title: "Python OAuth 2.0 Client with Multiple Providers",
      description:
        "Production OAuth 2.0 client using requests-oauthlib supporting Authorization Code Flow + PKCE, automatic token refresh, and multiple providers (Google, GitHub, Microsoft)",
      code: `from requests_oauthlib import OAuth2Session
from flask import Flask, request, redirect, session, url_for
from werkzeug.security import gen_salt
import os
import hashlib
import base64
from typing import Dict, Optional

# =============================================================================
# Configuration
# =============================================================================

app = Flask(__name__)
app.secret_key = os.urandom(24)

# OAuth provider configurations
PROVIDERS = {
    'google': {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'authorization_base_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'userinfo_url': 'https://www.googleapis.com/oauth2/v1/userinfo',
        'scopes': ['openid', 'email', 'profile'],
    },
    'github': {
        'client_id': os.environ.get('GITHUB_CLIENT_ID'),
        'client_secret': os.environ.get('GITHUB_CLIENT_SECRET'),
        'authorization_base_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'userinfo_url': 'https://api.github.com/user',
        'scopes': ['read:user', 'user:email'],
    },
    'microsoft': {
        'client_id': os.environ.get('MICROSOFT_CLIENT_ID'),
        'client_secret': os.environ.get('MICROSOFT_CLIENT_SECRET'),
        'authorization_base_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        'token_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        'userinfo_url': 'https://graph.microsoft.com/v1.0/me',
        'scopes': ['openid', 'email', 'profile', 'User.Read'],
    },
}

# =============================================================================
# PKCE Helper Functions
# =============================================================================

def generate_pkce_pair() -> tuple[str, str]:
    """
    Generate PKCE code_verifier and code_challenge

    ACTION: Create cryptographically random code_verifier, hash to create challenge
    REASON: PKCE secures OAuth on public clients (SPAs, mobile, desktop apps).
            Public clients cannot keep client_secret confidential. PKCE proves
            that token request comes from same app that initiated authorization.
    """
    # CODE HIGHLIGHT: PKCE generation—critical for public client security
    code_verifier = base64.urlsafe_b64encode(os.urandom(40)).decode('utf-8').rstrip('=')
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).decode('utf-8').rstrip('=')

    return code_verifier, code_challenge

# =============================================================================
# OAuth Client Flow
# =============================================================================

@app.route('/login/<provider>')
def login(provider: str):
    """
    Initiate OAuth authorization flow

    CONTEXT DILATION: Social login reduces registration friction by 60%.
    Traditional signup: email, password, verify email, fill profile (5 steps, 2-3 min).
    OAuth: "Sign in with Google" (1 click, 10 seconds). Profile pre-filled from provider.
    Conversion rate increases: 45% traditional signup vs 72% OAuth (Janrain study).
    """
    if provider not in PROVIDERS:
        return 'Provider not supported', 400

    config = PROVIDERS[provider]

    # ACTION: Generate PKCE pair for security
    # REASON: Desktop/mobile apps cannot securely store client_secret.
    #         PKCE prevents authorization code interception—only app with
    #         code_verifier can exchange code for token.
    code_verifier, code_challenge = generate_pkce_pair()

    # Store code_verifier in session for token exchange
    session[f'{provider}_code_verifier'] = code_verifier

    # ACTION: Generate state parameter for CSRF protection
    # REASON: Prevents attacker from initiating OAuth flow with victim's browser.
    #         Attacker cannot predict state value, so cannot complete callback.
    state = gen_salt(32)
    session[f'{provider}_state'] = state

    # Create OAuth2 session
    oauth = OAuth2Session(
        config['client_id'],
        scope=config['scopes'],
        redirect_uri=url_for('callback', provider=provider, _external=True),
        state=state,
    )

    # ACTION: Build authorization URL with PKCE parameters
    authorization_url, state = oauth.authorization_url(
        config['authorization_base_url'],
        # PKCE parameters
        code_challenge=code_challenge,
        code_challenge_method='S256',
        # Optional: request offline access for refresh token
        access_type='offline',
        prompt='consent',
    )

    return redirect(authorization_url)

@app.route('/callback/<provider>')
def callback(provider: str):
    """
    Handle OAuth callback with authorization code

    ACTION: Validate state, exchange code for token with PKCE verifier
    REASON: Multi-step security validation ensures legitimate OAuth flow.
            State prevents CSRF, PKCE prevents code interception, token exchange
            requires client credentials—layered security approach.
    """
    if provider not in PROVIDERS:
        return 'Provider not supported', 400

    config = PROVIDERS[provider]

    # ACTION: Validate state parameter to prevent CSRF
    # REASON: If state doesn't match, authorization request didn't originate
    #         from this application—potential CSRF attack.
    expected_state = session.get(f'{provider}_state')
    if not expected_state or request.args.get('state') != expected_state:
        return 'State validation failed - potential CSRF attack', 403

    # Clean up state from session
    session.pop(f'{provider}_state', None)

    # Retrieve code_verifier for PKCE
    code_verifier = session.pop(f'{provider}_code_verifier', None)
    if not code_verifier:
        return 'PKCE verification failed - missing code_verifier', 400

    # Create OAuth2 session for token exchange
    oauth = OAuth2Session(
        config['client_id'],
        redirect_uri=url_for('callback', provider=provider, _external=True),
        state=expected_state,
    )

    try:
        # ACTION: Exchange authorization code for access token
        # REASON: Authorization code is intermediate credential—prevents token
        #         exposure in browser redirect URL. Token exchange happens in
        #         secure backend channel with client authentication.
        token = oauth.fetch_token(
            config['token_url'],
            client_secret=config['client_secret'],
            authorization_response=request.url,
            # PKCE code_verifier
            code_verifier=code_verifier,
        )

        # CODE HIGHLIGHT: Store token in session (use database in production)
        session[f'{provider}_token'] = token

        # Fetch user info from provider
        user_info = fetch_user_info(provider, oauth)
        session[f'{provider}_user'] = user_info

        return redirect(url_for('profile'))

    except Exception as e:
        return f'Token exchange failed: {str(e)}', 400

@app.route('/profile')
def profile():
    """Display authenticated user profile from OAuth providers"""
    providers_data = {}

    for provider in PROVIDERS.keys():
        user = session.get(f'{provider}_user')
        if user:
            providers_data[provider] = user

    if not providers_data:
        return 'Not authenticated with any provider', 401

    # Render user profile (simplified)
    html = '<h1>User Profile</h1>'
    for provider, user in providers_data.items():
        html += f'<h2>{provider.title()}</h2>'
        html += f'<pre>{user}</pre>'

    html += '<br><a href="/logout">Logout</a>'
    return html

# =============================================================================
# Token Management
# =============================================================================

def fetch_user_info(provider: str, oauth: OAuth2Session) -> Dict:
    """
    Fetch user information from OAuth provider

    ACTION: Use access token to call provider's userinfo endpoint
    REASON: Access token authorizes API calls on user's behalf.
            Demonstrates actual resource access after OAuth flow completes.
    """
    config = PROVIDERS[provider]

    response = oauth.get(config['userinfo_url'])
    response.raise_for_status()

    return response.json()

def refresh_token_if_needed(provider: str) -> Optional[Dict]:
    """
    Automatically refresh access token if expired

    CONTEXT DILATION: Token refresh enables seamless long-lived sessions.
    Access tokens expire quickly (1 hour) for security. Without refresh tokens,
    user re-authenticates every hour (terrible UX). Refresh tokens (30-90 days)
    enable automatic renewal—user stays logged in for weeks without interruption.
    """
    if provider not in PROVIDERS:
        return None

    config = PROVIDERS[provider]
    token = session.get(f'{provider}_token')

    if not token:
        return None

    # ACTION: Check if token expired or expiring soon
    # REASON: Refresh before expiration to avoid API request failures.
    #         Refresh 5 minutes before expiration—buffer for clock skew.
    import time
    if 'expires_at' in token and token['expires_at'] - time.time() > 300:
        return token  # Token still valid

    if 'refresh_token' not in token:
        return None  # No refresh token available

    try:
        # ACTION: Create OAuth session and refresh token
        oauth = OAuth2Session(
            config['client_id'],
            token=token,
        )

        # CODE HIGHLIGHT: Automatic token refresh
        new_token = oauth.refresh_token(
            config['token_url'],
            refresh_token=token['refresh_token'],
            client_id=config['client_id'],
            client_secret=config['client_secret'],
        )

        # Update stored token
        session[f'{provider}_token'] = new_token

        return new_token

    except Exception as e:
        print(f'Token refresh failed: {e}')
        return None

@app.route('/api/data')
def protected_data():
    """
    Example protected endpoint requiring OAuth token

    ACTION: Refresh token if expired, then access provider API
    REASON: Demonstrates automatic token refresh in production.
            Application code doesn't worry about expiration—middleware handles it.
    """
    # Try each provider (in practice, use specific provider)
    for provider in PROVIDERS.keys():
        token = refresh_token_if_needed(provider)

        if token:
            oauth = OAuth2Session(
                PROVIDERS[provider]['client_id'],
                token=token,
            )

            # Use token to access protected resource
            user_info = fetch_user_info(provider, oauth)
            return {
                'provider': provider,
                'user': user_info,
                'token_expires_in': token.get('expires_in', 'unknown'),
            }

    return 'No valid OAuth session', 401

# =============================================================================
# Logout and Revocation
# =============================================================================

@app.route('/logout')
def logout():
    """
    Logout user and revoke OAuth tokens

    ACTION: Clear session and optionally revoke tokens at provider
    REASON: Token revocation immediately invalidates access—prevents use
            even before expiration. Critical for logout, account deauthorization,
            security incidents (stolen token).
    """
    # Clear all OAuth sessions
    for provider in PROVIDERS.keys():
        session.pop(f'{provider}_token', None)
        session.pop(f'{provider}_user', None)

    # In production, call provider's token revocation endpoint
    # Example for Google:
    # requests.post('https://oauth2.googleapis.com/revoke',
    #               params={'token': access_token})

    return redirect(url_for('index'))

# =============================================================================
# Home Page
# =============================================================================

@app.route('/')
def index():
    """Landing page with OAuth login options"""
    html = '''
    <h1>OAuth 2.0 Client Demo</h1>
    <p>Login with:</p>
    <ul>
        <li><a href="/login/google">Google</a></li>
        <li><a href="/login/github">GitHub</a></li>
        <li><a href="/login/microsoft">Microsoft</a></li>
    </ul>
    '''
    return html

# =============================================================================
# Run Application
# =============================================================================

if __name__ == '__main__':
    # IMPORTANT: Use HTTPS in production (required by OAuth 2.0 spec)
    app.run(debug=True, port=5000)`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production OAuth 2.0 client with Authorization Code Flow + PKCE, multi-provider support (Google, GitHub, Microsoft), automatic token refresh, and state-based CSRF protection",
        prerequisites: [
          "Flask web framework",
          "requests-oauthlib library",
          "OAuth 2.0 provider credentials",
          "PKCE implementation",
        ],
        systemPosition:
          "OAuth client application integrating social login for user authentication, accessing provider APIs on behalf of users",
      },
      annotations: [
        {
          id: "oauth-client-pkce-generation",
          lines: [40, 53],
          action: "Generate PKCE code_verifier and SHA256 code_challenge",
          reason:
            "PKCE (Proof Key for Code Exchange) secures OAuth on public clients where client_secret cannot be kept confidential. Desktop, mobile, and SPA clients use PKCE instead of client_secret. Code_verifier proves token request from same app that initiated authorization—prevents authorization code interception attacks.",
          contextLevel: "system",
          relatedConcepts: [
            "pkce",
            "public-client-security",
            "authorization-code-flow",
          ],
        },
        {
          id: "oauth-client-state-validation",
          lines: [120, 127],
          action: "Validate state parameter to prevent CSRF attacks",
          reason:
            "State parameter prevents CSRF on OAuth callback. Attacker initiates OAuth flow with victim's browser. If victim approves, attacker receives authorization code. State validation ensures callback corresponds to legitimate authorization request from same user session.",
          contextLevel: "module",
          relatedConcepts: ["csrf-protection", "oauth-state-parameter"],
        },
        {
          id: "oauth-client-code-exchange",
          lines: [142, 155],
          action:
            "Exchange authorization code for access token with PKCE verifier",
          reason:
            "Authorization code is short-lived, single-use intermediate credential. Client exchanges code for access token in secure backend channel. Includes client_secret (confidential clients) or code_verifier (public clients) to authenticate. Prevents authorization code theft—code alone insufficient for token.",
          contextLevel: "module",
          relatedConcepts: [
            "authorization-code-exchange",
            "backend-channel",
            "token-issuance",
          ],
        },
        {
          id: "oauth-client-automatic-refresh",
          lines: [213, 237],
          action:
            "Automatically refresh expired access tokens using refresh token",
          reason:
            "Access tokens expire quickly (1 hour) for security. Refresh tokens (30-90 days) enable automatic renewal without user interaction. Check expiration before API calls, refresh if needed. Seamless UX—user stays logged in without re-authentication prompts.",
          contextLevel: "system",
          relatedConcepts: [
            "token-refresh",
            "seamless-ux",
            "long-lived-sessions",
          ],
        },
        {
          id: "oauth-client-multi-provider",
          lines: [16, 43],
          action: "Configure multiple OAuth providers with unified interface",
          reason:
            "OAuth 2.0 standardization enables single client code for multiple providers. Google, GitHub, Microsoft use same OAuth flow with different endpoints. Unified provider configuration reduces code duplication—add new provider by adding config entry. Users choose preferred identity provider.",
          contextLevel: "module",
          relatedConcepts: ["oauth-standardization", "social-login", "sso"],
        },
        {
          id: "oauth-client-social-login-ux",
          lines: [65, 72],
          action:
            "Context: Social login reduces signup friction and increases conversion",
          reason:
            "Traditional signup requires email, password, verification, profile (5 steps, 2-3 min). OAuth social login: single click, 10 seconds, profile pre-filled. Conversion improves from 45% to 72% (Janrain study). Reduces abandoned signups by 60%. Critical for mobile and consumer apps.",
          contextLevel: "system",
          relatedConcepts: [
            "social-login",
            "user-experience",
            "conversion-optimization",
          ],
        },
        {
          id: "oauth-client-token-refresh-context",
          lines: [203, 210],
          action:
            "Context: Token refresh enables long-lived sessions without UX interruption",
          reason:
            "Access tokens expire in 1 hour for security. Without refresh tokens, user re-authenticates hourly (terrible UX). Refresh tokens (30-90 days) enable automatic renewal in background. User stays logged in for weeks—mobile app UX expectation. Desktop web tolerates re-login; mobile cannot.",
          contextLevel: "system",
          relatedConcepts: [
            "mobile-ux",
            "session-management",
            "token-lifecycle",
          ],
        },
        {
          id: "oauth-client-token-revocation",
          lines: [285, 293],
          action: "Revoke OAuth tokens during logout or security events",
          reason:
            "Token revocation immediately invalidates access even before natural expiration. Critical for logout (prevent reuse of cached tokens), account deauthorization (user removes app), security incidents (stolen token detected). Calls provider's revocation endpoint—provider blacklists token globally.",
          contextLevel: "system",
          relatedConcepts: [
            "token-revocation",
            "logout",
            "security-incident-response",
          ],
        },
      ],
      highlights: [
        {
          lines: [40, 53],
          label: "PKCE pair generation",
          sbvpDomain: "structure",
        },
        {
          lines: [142, 155],
          label: "Authorization code exchange",
          sbvpDomain: "behavior",
        },
        {
          lines: [213, 237],
          label: "Automatic token refresh",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "oauth-java-spring-authorization-server",
      language: "java",
      title: "Java Spring Authorization Server with Multiple Grant Types",
      description:
        "Enterprise OAuth 2.0 authorization server using Spring Authorization Server with multiple grant types (authorization code, client credentials, refresh token), JWT access tokens, and registered client management",
      code: `package com.example.oauth.config;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

// =============================================================================
// OAuth 2.0 Authorization Server Configuration
// =============================================================================

/**
 * Spring Authorization Server configuration with multiple grant types
 *
 * CONTEXT DILATION: Enterprise SSO with OAuth 2.0—centralizes authentication.
 * Before: 100+ internal apps each implement custom login (duplicate code,
 * inconsistent security, password reuse). After: Single OAuth server issues tokens
 * for all apps. Users log in once—SSO across entire platform. IT manages access
 * centrally—instant revocation across all apps.
 */
@Configuration
public class AuthorizationServerConfig {

    /**
     * Configure OAuth 2.0 authorization server security filter chain
     *
     * ACTION: Apply default OAuth security configuration with custom endpoints
     * REASON: Spring Authorization Server provides production-ready OAuth endpoints:
     *         /oauth2/authorize (authorization), /oauth2/token (token exchange),
     *         /oauth2/jwks (public keys), /oauth2/revoke (token revocation).
     */
    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http)
            throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);

        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
            .oidc(Customizer.withDefaults()); // Enable OpenID Connect 1.0

        // Redirect unauthenticated users to login page
        http.exceptionHandling((exceptions) -> exceptions
            .authenticationEntryPoint(
                new LoginUrlAuthenticationEntryPoint("/login"))
        );

        return http.build();
    }

    /**
     * Register OAuth clients (applications)
     *
     * ACTION: Configure multiple clients with different grant types and settings
     * REASON: Different application types need different OAuth flows:
     *         - Web apps: Authorization Code (most secure)
     *         - SPAs/Mobile: Authorization Code + PKCE (public clients)
     *         - Server-to-server: Client Credentials (no user involved)
     */
    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        // CLIENT 1: Web application (confidential client)
        RegisteredClient webClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("web-client")
            .clientSecret(passwordEncoder().encode("web-secret"))
            // Client authentication method
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)

            // Authorization Code Flow (most secure for server-side apps)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)

            // Allowed redirect URIs (strictly validated)
            .redirectUri("https://myapp.com/callback")
            .redirectUri("http://localhost:8080/authorized")

            // Requested scopes
            .scope(OidcScopes.OPENID)
            .scope(OidcScopes.PROFILE)
            .scope(OidcScopes.EMAIL)
            .scope("read")
            .scope("write")

            // Client-specific settings
            .clientSettings(ClientSettings.builder()
                .requireAuthorizationConsent(true) // Show consent screen
                .build())

            // Token settings
            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofHours(1))      // 1-hour access tokens
                .refreshTokenTimeToLive(Duration.ofDays(30))     // 30-day refresh tokens
                .reuseRefreshTokens(false)                       // Rotate refresh tokens
                .build())

            .build();

        // CLIENT 2: Mobile/SPA application (public client - requires PKCE)
        RegisteredClient mobileClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("mobile-client")
            // No client secret—public clients cannot keep secrets confidential
            .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)

            // Authorization Code + PKCE (public client security)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)

            // Mobile deep link redirect URI
            .redirectUri("myapp://oauth/callback")
            .redirectUri("http://localhost:3000/callback") // Development

            .scope(OidcScopes.OPENID)
            .scope(OidcScopes.PROFILE)
            .scope("read")

            // CODE HIGHLIGHT: PKCE required for public clients
            .clientSettings(ClientSettings.builder()
                .requireProofKey(true)              // Require PKCE
                .requireAuthorizationConsent(true)
                .build())

            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofMinutes(30))   // Shorter for mobile
                .refreshTokenTimeToLive(Duration.ofDays(7))
                .reuseRefreshTokens(false)
                .build())

            .build();

        // CLIENT 3: Service account (machine-to-machine)
        RegisteredClient serviceClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("service-client")
            .clientSecret(passwordEncoder().encode("service-secret"))
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)

            // Client Credentials grant (no user involved)
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)

            // No redirect URI needed (no authorization endpoint)
            .scope("api:read")
            .scope("api:write")

            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofMinutes(10))   // Short-lived for M2M
                .build())

            .build();

        return new InMemoryRegisteredClientRepository(webClient, mobileClient, serviceClient);
    }

    /**
     * JWK source for signing JWT access tokens
     *
     * ACTION: Generate RSA key pair and expose as JWK Set
     * REASON: RS256 (RSA asymmetric signing) enables distributed token verification.
     *         Authorization server signs tokens with private key. Resource servers
     *         verify signatures with public key from /oauth2/jwks endpoint.
     *         No shared secret needed—public key distribution scales to thousands of services.
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();

        // CODE HIGHLIGHT: RSA key pair for JWT signing
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
            .privateKey(privateKey)
            .keyID(UUID.randomUUID().toString())
            .build();

        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    /**
     * Generate RSA key pair for JWT signing
     *
     * CONTEXT DILATION: Asymmetric signing enables microservices architecture.
     * Symmetric HMAC (HS256) requires sharing secret across all services—security risk.
     * Asymmetric RSA (RS256): auth server holds private key (signs tokens), resource
     * servers hold public key (verify). Public key leakage = no security impact.
     * Scales to 1000+ microservices without secret coordination.
     */
    private static KeyPair generateRsaKey() {
        KeyPair keyPair;
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            keyPair = keyPairGenerator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
        return keyPair;
    }

    /**
     * JWT decoder for token validation
     */
    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    /**
     * Authorization server configuration
     *
     * ACTION: Configure OAuth endpoints and issuer identifier
     * REASON: Standardized endpoints enable OAuth client library interoperability.
     *         Issuer URL included in JWT tokens—resource servers validate issuer.
     */
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
            .issuer("https://auth.myapp.com")  // JWT issuer claim
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

// =============================================================================
// Resource Server Configuration (API)
// =============================================================================

package com.example.oauth.resource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Resource Server configuration for protected APIs
 *
 * ACTION: Configure JWT token validation and scope-based authorization
 * REASON: Resource servers verify access tokens and enforce scopes.
 *         Scopes define fine-grained permissions granted during user consent.
 */
@Configuration
@EnableWebSecurity
public class ResourceServerConfig {

    @Bean
    @Order(2)
    public SecurityFilterChain resourceServerSecurityFilterChain(HttpSecurity http)
            throws Exception {
        http
            .securityMatcher("/api/**")
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints
                .requestMatchers("/api/public/**").permitAll()

                // Scope-based authorization
                .requestMatchers("/api/read/**").hasAuthority("SCOPE_read")
                .requestMatchers("/api/write/**").hasAuthority("SCOPE_write")

                // Admin endpoints require specific scope
                .requestMatchers("/api/admin/**").hasAuthority("SCOPE_admin")

                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );

        return http.build();
    }

    /**
     * Convert JWT claims to Spring Security authorities
     *
     * ACTION: Extract 'scope' claim from JWT and convert to Spring authorities
     * REASON: Spring Security uses GrantedAuthority for authorization.
     *         Map OAuth scopes to authorities: 'read' scope -> 'SCOPE_read' authority.
     *         Enables @PreAuthorize("hasAuthority('SCOPE_admin')") on methods.
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
            new JwtGrantedAuthoritiesConverter();

        // Extract scopes from 'scope' claim (space-delimited)
        grantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
        grantedAuthoritiesConverter.setAuthorityPrefix("SCOPE_");

        JwtAuthenticationConverter jwtAuthenticationConverter =
            new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(
            grantedAuthoritiesConverter);

        return jwtAuthenticationConverter;
    }
}

// =============================================================================
// Protected API Controller
// =============================================================================

package com.example.oauth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Protected API endpoints demonstrating scope-based authorization
 */
@RestController
@RequestMapping("/api")
public class ProtectedResourceController {

    /**
     * Public endpoint (no authentication required)
     */
    @GetMapping("/public/info")
    public Map<String, Object> publicInfo() {
        return Map.of(
            "message", "This is a public endpoint",
            "timestamp", System.currentTimeMillis()
        );
    }

    /**
     * Read-only endpoint (requires 'read' scope)
     *
     * CONTEXT DILATION: Scope-based authorization enables least-privilege access.
     * Analytics app needs 'read' scope (view data). Integration app needs 'write'
     * (modify data). Admin dashboard needs both. Users grant minimal scopes during
     * consent—app cannot exceed approved permissions even if compromised.
     */
    @GetMapping("/read/data")
    @PreAuthorize("hasAuthority('SCOPE_read')")
    public Map<String, Object> readData(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();

        return Map.of(
            "message", "Protected read endpoint",
            "user_id", jwt.getSubject(),
            "scopes", jwt.getClaimAsStringList("scope"),
            "data", "Sample protected data"
        );
    }

    /**
     * Write endpoint (requires 'write' scope)
     */
    @PostMapping("/write/data")
    @PreAuthorize("hasAuthority('SCOPE_write')")
    public Map<String, Object> writeData(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();

        return Map.of(
            "message", "Data written successfully",
            "user_id", jwt.getSubject(),
            "timestamp", System.currentTimeMillis()
        );
    }

    /**
     * Admin endpoint (requires 'admin' scope)
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    public Map<String, Object> adminUsers() {
        return Map.of(
            "message", "Admin access granted",
            "users", 42
        );
    }

    /**
     * Profile endpoint (OpenID Connect userinfo)
     */
    @GetMapping("/profile")
    @PreAuthorize("hasAuthority('SCOPE_profile')")
    public Map<String, Object> profile(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();

        return Map.of(
            "sub", jwt.getSubject(),
            "email", jwt.getClaimAsString("email"),
            "name", jwt.getClaimAsString("name"),
            "iat", jwt.getIssuedAt(),
            "exp", jwt.getExpiresAt()
        );
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise OAuth 2.0 authorization server with Spring Authorization Server supporting multiple grant types, JWT tokens with RS256 signing, PKCE for public clients, and scope-based resource server authorization",
        prerequisites: [
          "Spring Boot",
          "Spring Security",
          "Spring Authorization Server",
          "JWT with RSA keys",
          "OAuth 2.0 grant types",
        ],
        systemPosition:
          "Central authorization server in enterprise SSO architecture, issuing JWT access tokens for web apps, mobile apps, and service-to-service communication",
      },
      annotations: [
        {
          id: "oauth-spring-multiple-clients",
          lines: [101, 180],
          action: "Register multiple OAuth clients with different grant types",
          reason:
            "Different application types require different OAuth flows. Web apps use Authorization Code (most secure with client_secret). SPAs/mobile use Authorization Code + PKCE (no secret). Services use Client Credentials (no user). Single authorization server supports all client types—centralized auth management.",
          contextLevel: "system",
          relatedConcepts: [
            "oauth-grant-types",
            "client-registration",
            "multi-tenant-auth",
          ],
        },
        {
          id: "oauth-spring-pkce-requirement",
          lines: [145, 152],
          action: "Require PKCE for public clients (mobile/SPA)",
          reason:
            "Public clients cannot securely store client_secret—JavaScript in browser or decompiled mobile app exposes secrets. PKCE (requireProofKey=true) mandates code_challenge/code_verifier flow. Prevents authorization code interception—only app with verifier can exchange code for token. Critical for mobile and SPA security.",
          contextLevel: "module",
          relatedConcepts: [
            "pkce",
            "public-client-security",
            "mobile-security",
          ],
        },
        {
          id: "oauth-spring-rsa-jwt",
          lines: [190, 213],
          action: "Generate RSA key pair for JWT access token signing",
          reason:
            "RS256 (RSA) enables distributed verification across microservices. Authorization server signs tokens with private key. Resource servers verify with public key from /oauth2/jwks endpoint. Public key distribution scales to 1000+ services without sharing secrets. Contrast with HS256 (HMAC)—requires sharing secret across all services (security risk).",
          contextLevel: "system",
          relatedConcepts: [
            "asymmetric-jwt",
            "jwks",
            "distributed-verification",
          ],
        },
        {
          id: "oauth-spring-token-rotation",
          lines: [127, 130],
          action:
            "Rotate refresh tokens on every use (reuseRefreshTokens=false)",
          reason:
            "Single-use refresh tokens limit damage if stolen. Each refresh returns new access_token AND new refresh_token, invalidating old refresh token. If attacker steals refresh token and uses it, legitimate user's next refresh fails—alerts system to theft. Security vs. UX trade-off: rotation adds complexity but prevents long-term token compromise.",
          contextLevel: "module",
          relatedConcepts: [
            "refresh-token-rotation",
            "token-theft-detection",
            "security-hardening",
          ],
        },
        {
          id: "oauth-spring-scope-authorization",
          lines: [254, 268],
          action:
            "Enforce scope-based authorization on resource server endpoints",
          reason:
            "Scopes enable fine-grained permissions beyond role-based access control. 'read' scope allows GET requests, 'write' allows POST/PUT/DELETE, 'admin' for privileged operations. Resource server checks token scopes—rejects requests exceeding granted permissions. Users approve specific scopes during consent—app limited to approved operations.",
          contextLevel: "module",
          relatedConcepts: [
            "scope-based-authorization",
            "least-privilege",
            "oauth-scopes",
          ],
        },
        {
          id: "oauth-spring-jwt-authorities",
          lines: [282, 297],
          action: "Convert JWT scope claims to Spring Security authorities",
          reason:
            "Spring Security expects GrantedAuthority objects for authorization (@PreAuthorize, hasAuthority). JWT contains 'scope' claim with space-delimited scopes ('read write admin'). JwtGrantedAuthoritiesConverter extracts scopes, prefixes with 'SCOPE_', creates authorities. Enables seamless integration with Spring Security authorization.",
          contextLevel: "module",
          relatedConcepts: [
            "spring-security-integration",
            "claims-to-authorities",
          ],
        },
        {
          id: "oauth-spring-client-credentials",
          lines: [155, 173],
          action:
            "Configure Client Credentials grant for service-to-service auth",
          reason:
            "Machine-to-machine communication has no user involved. Client Credentials grant authenticates service using client_id and client_secret. Server requests token directly from /oauth2/token (no authorization endpoint). Use for background jobs, scheduled tasks, API integrations between internal services. Short token lifetime (10 min) limits exposure.",
          contextLevel: "system",
          relatedConcepts: [
            "client-credentials-grant",
            "m2m-authentication",
            "service-account",
          ],
        },
        {
          id: "oauth-spring-enterprise-sso",
          lines: [48, 55],
          action:
            "Context: Enterprise SSO centralizes authentication for 100+ apps",
          reason:
            "Before OAuth: Each app implements custom login (duplicate code, inconsistent security, password reuse). After: Single OAuth authorization server for all apps. Users authenticate once—SSO across platform. IT manages access centrally (instant revocation affects all apps). Compliance improved—audit single auth source. Reduces attack surface—one hardened auth server vs 100 custom implementations.",
          contextLevel: "system",
          relatedConcepts: [
            "enterprise-sso",
            "centralized-authentication",
            "security-consolidation",
          ],
        },
      ],
      highlights: [
        {
          lines: [101, 180],
          label: "Multi-client registration",
          sbvpDomain: "structure",
        },
        {
          lines: [190, 213],
          label: "RSA JWT signing",
          sbvpDomain: "structure",
        },
        {
          lines: [254, 268],
          label: "Scope-based authorization",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Social login (Sign in with Google, GitHub, Facebook, Microsoft)",
      "Third-party API integration (Spotify API, Stripe Connect, Google Calendar, Slack apps)",
      "Enterprise SSO (Single Sign-On across internal applications, Okta, Auth0, Azure AD)",
      "Mobile app authentication (iOS, Android apps accessing backend APIs)",
      "SPA authentication (React, Vue, Angular apps calling REST APIs)",
      "Microservices authorization (Service mesh token propagation, API gateway integration)",
      "IoT device authorization (Smart home devices accessing cloud APIs)",
      "CI/CD pipelines (GitHub Actions OIDC, automated deployments to AWS/GCP/Azure)",
    ],
    interactsWith: [
      "oidc",
      "jwt",
      "refresh-tokens",
      "pkce",
      "api-gateway",
      "saml",
      "tls-ssl",
      "rate-limiting",
    ],
    architecturalBoundaries: [
      "Authorization server (authenticates users, issues tokens, manages consent)",
      "Resource server (protects APIs, validates tokens, enforces scopes)",
      "Client application (initiates OAuth flow, exchanges codes, stores tokens)",
      "Token storage (client-side: secure storage, localStorage; server-side: Redis, database)",
      "Consent UI (displays requested scopes, captures user approval/denial)",
      "Scope registry (defines available scopes, maps to API permissions)",
    ],
  },

  implementations: [
    {
      id: "spring-authorization-server",
      name: "Spring Authorization Server",
      type: "framework",
      languages: ["java"],
      description:
        "Spring's official OAuth 2.1 and OpenID Connect 1.0 implementation. Successor to deprecated Spring Security OAuth. Supports all standard grant types, PKCE, JWT tokens, JWK sets, and token revocation. Integrates seamlessly with Spring Security for enterprise applications.",
      links: {
        docs: "https://spring.io/projects/spring-authorization-server",
        github:
          "https://github.com/spring-projects/spring-authorization-server",
      },
      codeSnippet: `RegisteredClient client = RegisteredClient.withId(UUID.randomUUID().toString())
  .clientId("client-id")
  .clientSecret("{bcrypt}encoded-secret")
  .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
  .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
  .redirectUri("https://myapp.com/callback")
  .scope("read")
  .scope("write")
  .clientSettings(ClientSettings.builder()
    .requireAuthorizationConsent(true)
    .requireProofKey(true)
    .build())
  .build();`,
    },
    {
      id: "keycloak",
      name: "Keycloak",
      type: "platform",
      languages: ["any"],
      description:
        "Open-source identity and access management with OAuth 2.0, OIDC, and SAML support. Self-hosted or managed. Supports user federation (LDAP, Active Directory), social login, MFA, fine-grained authorization, and admin console. Powers authentication for thousands of enterprises.",
      links: {
        docs: "https://www.keycloak.org/docs/latest/securing_apps/",
        github: "https://github.com/keycloak/keycloak",
      },
      codeSnippet: `// Keycloak client configuration
{
  "realm": "my-realm",
  "auth-server-url": "https://keycloak.example.com",
  "ssl-required": "external",
  "resource": "my-app",
  "credentials": {
    "secret": "client-secret"
  },
  "confidential-port": 0
}`,
    },
    {
      id: "auth0",
      name: "Auth0",
      type: "service",
      languages: ["any"],
      description:
        "Managed OAuth 2.0 and OIDC platform with social login, MFA, user management, and extensibility. SDKs for all major languages and frameworks. Handles 4.5B+ logins monthly. Used by Atlassian, Mozilla, Yamaha. 99.99% SLA with global CDN distribution.",
      links: {
        docs: "https://auth0.com/docs/get-started/authentication-and-authorization-flow",
      },
      codeSnippet: `// Auth0 authorization URL
https://tenant.auth0.com/authorize
  ?response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=https://myapp.com/callback
  &scope=openid profile email
  &state=STATE
  &code_challenge=CHALLENGE
  &code_challenge_method=S256`,
    },
    {
      id: "okta",
      name: "Okta",
      type: "service",
      languages: ["any"],
      description:
        "Enterprise identity platform with OAuth 2.0, OIDC, and SAML. Supports SSO, MFA, user provisioning, API access management. Strong compliance (SOC2, HIPAA, FedRAMP). Used by FedEx, T-Mobile, Moody's. Scales to millions of users with 99.99% uptime.",
      links: {
        docs: "https://developer.okta.com/docs/concepts/oauth-openid/",
      },
      codeSnippet: `// Okta OAuth flow
curl -X POST https://{domain}/oauth2/default/v1/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "redirect_uri=https://myapp.com/callback" \\
  -d "client_id=CLIENT_ID" \\
  -d "client_secret=CLIENT_SECRET"`,
    },
    {
      id: "aws-cognito",
      name: "AWS Cognito",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed user pools and identity federation. OAuth 2.0 and OIDC compliant. Integrates with API Gateway, Lambda, and AppSync. Supports social login (Google, Facebook, Apple), SAML, and MFA. Auto-scales to millions of users. Pay-per-use pricing.",
      links: {
        docs: "https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html",
      },
      codeSnippet: `// AWS Cognito hosted UI
https://{domain}.auth.{region}.amazoncognito.com/oauth2/authorize
  ?client_id=CLIENT_ID
  &response_type=code
  &scope=openid+email+profile
  &redirect_uri=https://myapp.com/callback`,
    },
    {
      id: "google-oauth",
      name: "Google OAuth 2.0",
      type: "service",
      languages: ["any"],
      description:
        "Google's OAuth 2.0 implementation for accessing Google APIs (Gmail, Calendar, Drive, YouTube). Supports all OAuth grant types and OIDC. Handles billions of authentications daily. Sign in with Google powers authentication for millions of apps worldwide.",
      links: {
        docs: "https://developers.google.com/identity/protocols/oauth2",
      },
      codeSnippet: `// Google OAuth authorization
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=https://myapp.com/callback
  &response_type=code
  &scope=openid email profile
  &access_type=offline
  &state=STATE`,
    },
    {
      id: "github-oauth",
      name: "GitHub OAuth",
      type: "service",
      languages: ["any"],
      description:
        "GitHub's OAuth 2.0 implementation for authenticating users and accessing repositories, user data, and organizations. Used by 100M+ developers. GitHub Apps use OAuth for installation access. OIDC support for GitHub Actions to authenticate with cloud providers.",
      links: {
        docs: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
      },
      codeSnippet: `// GitHub OAuth flow
GET https://github.com/login/oauth/authorize
  ?client_id=CLIENT_ID
  &redirect_uri=https://myapp.com/callback
  &scope=read:user user:email
  &state=STATE

POST https://github.com/login/oauth/access_token
  -d client_id=CLIENT_ID
  -d client_secret=CLIENT_SECRET
  -d code=AUTHORIZATION_CODE`,
    },
    {
      id: "identityserver",
      name: "IdentityServer (Duende)",
      type: "framework",
      languages: ["csharp"],
      description:
        "Certified OAuth 2.0 and OpenID Connect framework for .NET. Flexible, extensible, and production-ready. Supports all grant types, PKCE, token introspection, and dynamic client registration. Commercial support available from Duende Software.",
      links: {
        docs: "https://docs.duendesoftware.com/identityserver/v6",
        github: "https://github.com/DuendeSoftware/IdentityServer",
      },
      codeSnippet: `// IdentityServer client configuration
new Client
{
    ClientId = "webapp",
    ClientSecrets = { new Secret("secret".Sha256()) },
    AllowedGrantTypes = GrantTypes.Code,
    RedirectUris = { "https://myapp.com/callback" },
    AllowedScopes = { "openid", "profile", "api1" },
    RequirePkce = true
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "google-sign-in",
      systemName: "Google Sign-In",
      howUsed:
        "Google Sign-In uses OAuth 2.0 to enable 3 billion+ users to authenticate with third-party apps using Google accounts. Users click 'Sign in with Google', authorize scopes (profile, email, calendar), and apps receive access tokens without ever seeing passwords. Apps use tokens to access Google APIs (Gmail, Drive, Calendar, YouTube) on behalf of users with scoped permissions. Google's authorization server issues JWT ID tokens (OpenID Connect) containing user profile and JWT access tokens for API access. Tokens refresh automatically—users stay logged in for weeks without re-authentication. Developers integrate via OAuth libraries (google-auth-library) or social login SDKs. Pattern composition: OAuth 2.0 + OIDC + JWT + Refresh Tokens + PKCE (mobile/SPA). Rationale: OAuth eliminates password sharing—Google accounts never exposed to third-party apps. Scope-based permissions limit access to approved data only. Centralized token revocation—users can remove app access anytime in Google Account settings. Standardized OAuth reduces integration complexity—same flow for web, mobile, desktop. Impact: Powers authentication for 10M+ third-party apps; prevents password database breaches at third-party services from compromising Google accounts; enables rich API ecosystem (Google Workspace, YouTube, Maps APIs) while maintaining user control.",
      source: "https://developers.google.com/identity/protocols/oauth2",
    },
    {
      systemId: "github-oauth-apps",
      systemName: "GitHub OAuth Apps",
      howUsed:
        "GitHub uses OAuth 2.0 to authorize third-party applications to access repositories, user profiles, and organization data on behalf of 100M+ developers. Users install OAuth apps (CI/CD tools, code review bots, project management), grant scoped permissions (repo, read:org, user:email), and apps receive access tokens for GitHub API. GitHub Apps use OAuth for installation access—organization admins approve specific repositories, app receives installation token with limited scope. GitHub Actions uses OIDC JWTs signed by GitHub to authenticate with cloud providers (AWS, GCP, Azure) without storing long-lived secrets—short-lived tokens prove workflow identity and repository context. Pattern composition: OAuth 2.0 + OIDC + JWT + Fine-Grained PATs + Scopes. Rationale: OAuth enables rich third-party ecosystem (75,000+ apps on GitHub Marketplace) without password sharing. Installation-level permissions prevent apps from accessing entire organization—limited to approved repos. OIDC for Actions eliminates secret sprawl—no AWS keys in repository secrets. Instant revocation—uninstall app or rotate token immediately invalidates access. Impact: Powers 75k+ GitHub Apps and OAuth integrations; enables secure CI/CD workflows without long-lived credentials; handles 1B+ API requests daily; prevents credential leakage in repositories while enabling automation.",
      source:
        "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
    },
    {
      systemId: "stripe-connect",
      systemName: "Stripe Connect (OAuth for Marketplaces)",
      howUsed:
        "Stripe Connect uses OAuth 2.0 to enable platforms (Shopify, Lyft, DoorDash) to onboard merchants and process payments on their behalf. Marketplace initiates OAuth flow, redirecting merchant to Stripe for account connection. Merchant authorizes platform to charge customers, transfer funds, and view transactions with scoped permissions (read_write, read_only). Stripe issues access tokens tied to connected account—platform uses tokens to create charges, payouts, and transfers. Refresh tokens enable long-lived connections without re-authorization. Platforms cannot access merchant's full Stripe account or unrelated data—scope enforcement limits permissions. Pattern composition: OAuth 2.0 + Refresh Tokens + Webhook Signatures + Scopes + Multi-Party Authorization. Rationale: OAuth enables frictionless merchant onboarding—no manual API key exchange or configuration. Merchants maintain full Stripe account control—can revoke platform access anytime. Platform cannot misuse credentials for unauthorized operations. Standardized OAuth flow works globally across jurisdictions. Impact: Powers 150,000+ platforms processing $640B+ annually; enables gig economy marketplaces (Lyft, Instacart) to pay millions of workers; reduces onboarding friction from 30 minutes (manual API setup) to 2 minutes (OAuth); prevents platform credential abuse while enabling automated payments.",
      source: "https://stripe.com/docs/connect/oauth-reference",
    },
    {
      systemId: "salesforce-oauth",
      systemName: "Salesforce OAuth for Integrations",
      howUsed:
        "Salesforce uses OAuth 2.0 to authenticate 150,000+ enterprise customers and power integrations with 3,000+ AppExchange apps. Users authorize apps to access CRM data (accounts, contacts, opportunities, reports) via OAuth consent screen with scoped permissions (api, refresh_token, full). Apps exchange authorization codes for access tokens, make REST API calls to query/modify Salesforce data. Salesforce supports all OAuth grant types: Authorization Code (web apps), Authorization Code + PKCE (mobile/SPA), JWT Bearer (server-to-server), and Refresh Token. Connected Apps configuration defines OAuth client settings, redirect URIs, and token policies. Pattern composition: OAuth 2.0 + SAML + OIDC + JWT Bearer + Refresh Tokens + IP Restrictions. Rationale: OAuth enables secure third-party integrations without sharing Salesforce passwords. Enterprise IT controls app access via Connected Apps policies—can restrict IP addresses, enforce MFA, audit token usage. Refresh tokens (configurable lifetime) enable long-lived integrations for background sync. JWT Bearer flow enables service account authentication for batch jobs. Impact: Powers 3,000+ AppExchange apps; handles 10B+ API requests daily; enables enterprise integrations (Slack, Microsoft Teams, Tableau) while maintaining SOC2/HIPAA compliance; instant revocation prevents data breaches from propagating to connected apps.",
      source:
        "https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_flows.htm",
    },
    {
      systemId: "slack-oauth",
      systemName: "Slack OAuth for App Installation",
      howUsed:
        "Slack uses OAuth 2.0 to authorize 750,000+ apps to access workspace data (channels, messages, users, files) on behalf of 10M+ daily active users. Users install Slack apps via 'Add to Slack' button, redirected to Slack OAuth authorization with requested scopes (channels:read, chat:write, files:read). After approval, Slack issues bot tokens (for app functionality) and user tokens (for user-specific actions). Apps use tokens to post messages, read channels, upload files, create interactive components. Workspace admins can review installed apps, revoke tokens, and enforce app approval workflows. Pattern composition: OAuth 2.0 + Bot Tokens + User Tokens + Token Rotation + Webhook Verification + Scopes. Rationale: OAuth enables self-service app installation—users add apps without IT intervention (consumerization of enterprise software). Scope-based permissions limit app access—chatbot needs chat:write but not files:read. Bot tokens vs user tokens separate app identity from user identity—bots persist after user leaves. Workspace-level token management enables centralized security—admins revoke all installations instantly. Impact: Powers 750k+ Slack apps (Jira, GitHub, Zoom integrations); enables 11M+ app installations; handles billions of API requests monthly; balances ease of installation (one-click) with security (granular scopes, instant revocation).",
      source: "https://api.slack.com/authentication/oauth-v2",
    },
    {
      systemId: "spotify-api-oauth",
      systemName: "Spotify Web API",
      howUsed:
        "Spotify uses OAuth 2.0 to authorize 100,000+ third-party apps to access user data (playlists, playback, saved tracks) and control Spotify playback on behalf of 500M+ users. Users authorize apps via consent screen with scoped permissions (user-read-private, playlist-modify-public, streaming, user-top-read). Apps receive access tokens (1 hour expiry) and refresh tokens for API access. Spotify SDKs (iOS, Android, Web Playback) use tokens for streaming authentication and playback control. Rate limiting enforced based on token's client_id—prevents abuse while enabling high-volume integrations. Pattern composition: OAuth 2.0 + PKCE + Refresh Tokens + Scopes + Rate Limiting + SDK Integration. Rationale: OAuth enables rich music app ecosystem (Discord Now Playing, Waze integration, playlist generators) without password sharing. Scope granularity supports read-only apps (analytics), write apps (playlist managers), and streaming apps (alternative players). Refresh tokens enable long-lived integrations—apps stay connected for months without re-authorization. Client-based rate limiting prevents abuse while allowing legitimate high-volume apps (analytics platforms processing millions of users). Impact: Powers 100k+ Spotify API integrations; enables 1B+ API requests daily; prevents credential exposure (apps never see passwords); supports innovative music experiences (collaborative playlists, music discovery, social sharing) while maintaining user control over data access.",
      source:
        "https://developer.spotify.com/documentation/web-api/concepts/authorization",
    },
  ],

  philosophy: {
    coreProblem:
      "Password sharing with third-party applications creates security nightmares: breached apps expose credentials to all services; users cannot revoke app access without changing passwords everywhere; apps gain full account control rather than limited permissions",
    designPrinciple:
      "Delegate authorization through scoped, time-limited access tokens that users explicitly approve via consent screens, eliminating password exposure while enabling fine-grained permission control and instant revocation",
    historicalContext:
      "OAuth 1.0 (2007) emerged from Twitter and Google collaborations to solve password anti-patterns in API access. OAuth 1.0a fixed session fixation attacks but required complex signature generation. OAuth 2.0 (2012, RFC 6749) simplified flows, introduced multiple grant types, and embraced bearer tokens over signatures—enabling mobile and JavaScript clients. PKCE (2015, RFC 7636) secured public clients after security research exposed authorization code interception risks. OAuth 2.1 (in draft) consolidates best practices: PKCE mandatory, Implicit flow removed, refresh token rotation recommended.",
    alternativesRejected: [
      "Password sharing - exposes credentials to third parties; breach of one app compromises all accounts",
      "API keys - lack expiration and scopes; cannot represent user delegation; difficult to rotate",
      "HTTP Basic Auth - transmits credentials on every request; no fine-grained permissions",
      "SAML assertions - XML-based, heavyweight (5-10KB); designed for enterprise SSO not API access",
      "Custom token systems - lack standardization; poor interoperability; security mistakes common",
    ],
    mentalModel:
      "OAuth 2.0 is like a valet parking key. You give valet (third-party app) a limited key that starts car but cannot open trunk or glove box (scoped permissions). Valet cannot make duplicate keys or keep car forever (expiring tokens). You can deactivate valet key anytime without replacing main car key (token revocation without password change). The key proves valet has your permission without giving them full ownership (delegated authorization). Hotel validates key with car manufacturer (resource server verifies token with authorization server).",
  },

  visualization: {
    staticDiagram: `graph TB
    User[Resource Owner] -->|1. Initiate login| App[Client App]
    App -->|2. Redirect to authorization| AuthServer[Authorization Server]
    User -->|3. Authenticate & consent| AuthServer
    AuthServer -->|4. Redirect with auth code| App
    App -->|5. Exchange code for token| AuthServer
    AuthServer -->|6. Issue access & refresh tokens| App
    App -->|7. API request with token| API[Resource Server]
    API -->|8. Verify token & scopes| API
    API -->|9. Return protected data| App

    style User fill:#e1f5e1
    style AuthServer fill:#fff3e6
    style API fill:#e6f3ff
    style App fill:#ffe6e6`,
    realWorldAnalogy:
      "OAuth 2.0 is like hotel key cards. Front desk (authorization server) issues key card (access token) after verifying ID (authentication) and payment (authorization). Key card opens your room and gym (scoped permissions) but not other rooms or safe (restricted access). Card expires at checkout (token expiration). Lost card can be deactivated instantly without affecting other guests (revocation). You can give card to family members (delegated access) without sharing credit card. Hotel validates card with central system (token verification). Guest cannot modify card permissions or extend stay without front desk approval (tamper-proof tokens).",
    useCases: [
      {
        domain: "Social Login",
        scenario:
          "E-commerce site offers 'Sign in with Google'. User clicks, authorizes profile access, returns with access token. Site fetches profile from Google API, creates local account, user logged in—2 seconds total vs 3-minute traditional signup.",
        patternRole:
          "Eliminates password sharing; reduces signup friction by 60%; increases conversion from 45% to 72%",
        companies: ["Shopify", "Etsy", "Airbnb"],
      },
      {
        domain: "Third-Party API Integration",
        scenario:
          "Fitness tracker app requests 'Connect Spotify' to create workout playlists. User authorizes read:playlists scope. App uses access token to fetch liked songs, generate running playlist, sync to Spotify—all without Spotify password.",
        patternRole:
          "Enables rich API ecosystem; scoped permissions limit access to approved data only",
        companies: ["Strava", "Peloton", "Fitbit"],
      },
      {
        domain: "Enterprise SSO",
        scenario:
          "Employee logs into Okta once (morning). Accesses Salesforce, Slack, GitHub, AWS Console without re-authentication. OAuth tokens propagate across all apps via SSO—single logout revokes all sessions.",
        patternRole:
          "Centralizes authentication; instant access revocation; reduces password fatigue",
        companies: ["Microsoft Azure AD", "Okta", "Auth0"],
      },
      {
        domain: "Mobile App Authentication",
        scenario:
          "Banking app authenticates user, receives access token (1 hour) and refresh token (30 days). App refreshes token in background before expiration—user stays logged in for weeks without entering password.",
        patternRole:
          "Seamless mobile UX; no cookie dependencies; secure token storage in Keychain/Keystore",
        companies: ["Chase", "Venmo", "Robinhood"],
      },
    ],
  },

  tags: [
    "security",
    "authentication",
    "authorization",
    "oauth",
    "delegated-auth",
    "access-tokens",
    "social-login",
    "api-access",
    "pkce",
    "scopes",
    "consent",
  ],
  difficulty: "advanced",
};
