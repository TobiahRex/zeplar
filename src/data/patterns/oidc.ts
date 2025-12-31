import type { Pattern } from "../schema";

export const oIDC: Pattern = {
  id: "oidc",
  slug: "oidc",
  corpusPath: "🔒 SECURITY → 🎟️ Token-Based Auth → 🆔 OIDC",

  hierarchy: {
    quality: "security",
    strategy: "Token-Based Auth",
    family: "Identity Standards",
    level: 4,
  },

  concept: {
    name: "OpenID Connect (OIDC)",
    emoji: "🆔",
    tagline: "Standardized identity layer on OAuth 2.0",
    definition:
      "OpenID Connect (OIDC) is an authentication protocol built as an identity layer on top of OAuth 2.0, adding standardized mechanisms for user authentication and profile information. While OAuth 2.0 provides authorization (granting access to resources), OIDC extends it to handle authentication (verifying who the user is) through ID tokens—cryptographically signed JWTs containing user identity claims. The protocol standardizes three key components missing from pure OAuth 2.0: the ID token format (JWT with standard claims like sub, name, email), the UserInfo endpoint (for retrieving additional profile data), and discovery mechanisms (well-known endpoints for automatic configuration). OIDC defines multiple flows—Authorization Code, Implicit, Hybrid—enabling secure authentication for web apps, mobile apps, and SPAs. It provides Single Sign-On (SSO) capabilities, allowing users to authenticate once with an Identity Provider (like Google, Microsoft, or Okta) and access multiple applications without re-entering credentials. The protocol includes security features like nonce validation (preventing replay attacks), state parameters (CSRF protection), and at_hash verification (binding ID tokens to access tokens). By standardizing identity exchange, OIDC eliminates the custom user info implementations that plagued OAuth 2.0 integrations, reducing integration complexity from weeks to hours.",
    problemSolved:
      "OAuth 2.0 revolutionized authorization but left authentication undefined, forcing every provider to implement custom endpoints and response formats for user identity information. Developers integrating with multiple OAuth providers (Google, Facebook, GitHub) had to write provider-specific code for fetching user profiles—each with different endpoint URLs, claim names, and response structures. This lack of standardization meant integrating five social login providers required five different implementations. Additionally, OAuth 2.0's access tokens are opaque to clients, providing no information about the authenticated user or when/how authentication occurred. OIDC solves this by standardizing the ID token format (JWT with required claims like sub, iss, aud, exp), the UserInfo endpoint path (/userinfo), and discovery metadata (/.well-known/openid-configuration). Instead of custom integration code per provider, developers can use a single OIDC client library that works with any compliant provider. The ID token provides immediate access to user identity without additional API calls, and its signature verification ensures cryptographic proof of authentication. This standardization transformed social login from a multi-week integration project into a one-hour configuration task.",
    tradeoffs: {
      pros: [
        "Standardized identity claims across all providers",
        "Built on proven OAuth 2.0 foundation",
        "JWT ID tokens provide verifiable identity without API calls",
        "UserInfo endpoint for extended profile data",
        "Discovery mechanism for automatic provider configuration",
        "Native Single Sign-On (SSO) support",
        "Strong security with signature verification and nonce validation",
      ],
      cons: [
        "Inherits OAuth 2.0's complexity (multiple flows, token types)",
        "Multiple token types to manage (ID token, access token, refresh token)",
        "Nonce and state parameter management adds complexity",
        "ID token validation requires JWKS endpoint and crypto libraries",
        "Token size larger than session cookies (ID tokens can be 1-2KB)",
        "Provider-specific claim mappings still vary beyond standard claims",
        "Logout implementation (RP-initiated, back-channel) remains complex",
      ],
    },
    relatedPatterns: [
      "oauth-2-0",
      "jwt",
      "saml",
      "refresh-tokens",
      "key-rotation",
      "e2e-encryption",
      "session-management",
    ],
  },

  structure: {
    participants: [
      {
        name: "End User",
        role: "Resource Owner",
        responsibilities: [
          "Initiate authentication by accessing protected resource",
          "Provide credentials to OpenID Provider",
          "Consent to sharing identity information with Relying Party",
          "Review and manage authorized applications",
        ],
      },
      {
        name: "Relying Party (Client)",
        role: "Application requesting authentication",
        responsibilities: [
          "Redirect user to OpenID Provider for authentication",
          "Validate ID token signature using JWKS",
          "Verify ID token claims (issuer, audience, expiration, nonce)",
          "Exchange authorization code for tokens at token endpoint",
          "Fetch additional user data from UserInfo endpoint if needed",
          "Maintain user session based on ID token claims",
        ],
      },
      {
        name: "OpenID Provider (OP)",
        role: "Authentication server",
        responsibilities: [
          "Authenticate users and issue ID tokens",
          "Publish JWKS (JSON Web Key Set) for token verification",
          "Provide discovery document at /.well-known/openid-configuration",
          "Serve UserInfo endpoint for additional claims",
          "Manage user consent and authorization",
          "Support token refresh and revocation",
        ],
      },
      {
        name: "ID Token",
        role: "Identity assertion (JWT)",
        responsibilities: [
          "Contain standard claims: iss, sub, aud, exp, iat, auth_time",
          "Provide cryptographic proof of authentication via signature",
          "Include nonce claim to prevent replay attacks",
          "Optionally include profile claims (name, email, picture)",
          "Expire after short lifetime (typically 1 hour)",
        ],
      },
      {
        name: "UserInfo Endpoint",
        role: "Profile data provider",
        responsibilities: [
          "Return user profile claims as JSON",
          "Require valid access token for authorization",
          "Provide claims not included in ID token (address, phone_number)",
          "Support claim filtering via scope parameter",
          "Respect user privacy and consent settings",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User as End User
    participant RP as Relying Party<br/>(Client App)
    participant OP as OpenID Provider<br/>(e.g., Google)
    participant JWKS as JWKS Endpoint
    participant UI as UserInfo Endpoint

    User->>RP: 1. Access protected resource
    RP->>RP: 2. Generate state & nonce
    RP->>User: 3. Redirect to authorization endpoint
    User->>OP: 4. GET /authorize?scope=openid profile&state=xyz&nonce=abc
    OP->>User: 5. Show login page
    User->>OP: 6. Submit credentials
    OP->>OP: 7. Authenticate user
    OP->>User: 8. Redirect to callback with code
    User->>RP: 9. GET /callback?code=AUTH_CODE&state=xyz
    RP->>RP: 10. Validate state parameter
    RP->>OP: 11. POST /token (exchange code for tokens)
    OP->>RP: 12. Return ID token + access token
    RP->>JWKS: 13. GET /jwks (fetch signing keys)
    JWKS->>RP: 14. Return public keys
    RP->>RP: 15. Verify ID token signature & claims
    RP->>RP: 16. Validate nonce, iss, aud, exp
    RP->>UI: 17. GET /userinfo (with access token)
    UI->>RP: 18. Return additional claims (email, picture)
    RP->>User: 19. Create session & grant access
    User->>RP: 20. Access protected resource`,
    flow: [
      {
        step: 1,
        actor: "End User",
        action: "Initiate Authentication",
        description:
          "User attempts to access a protected resource requiring authentication",
      },
      {
        step: 2,
        actor: "Relying Party",
        action: "Generate Security Parameters",
        description:
          "Create random state (CSRF protection) and nonce (replay prevention) values",
      },
      {
        step: 3,
        actor: "Relying Party",
        action: "Redirect to Authorization Endpoint",
        description:
          "Redirect user to OP's /authorize with scope=openid, client_id, redirect_uri, state, nonce",
      },
      {
        step: 4,
        actor: "OpenID Provider",
        action: "Present Authentication UI",
        description:
          "Show login page (username/password, MFA, social login, etc.)",
      },
      {
        step: 5,
        actor: "End User",
        action: "Authenticate",
        description: "Provide credentials and consent to sharing identity data",
      },
      {
        step: 6,
        actor: "OpenID Provider",
        action: "Issue Authorization Code",
        description:
          "Redirect back to RP's callback URL with authorization code and state",
      },
      {
        step: 7,
        actor: "Relying Party",
        action: "Validate State Parameter",
        description:
          "Verify state matches stored value to prevent CSRF attacks",
      },
      {
        step: 8,
        actor: "Relying Party",
        action: "Exchange Code for Tokens",
        description:
          "POST to /token endpoint with code, client_id, client_secret to receive tokens",
      },
      {
        step: 9,
        actor: "OpenID Provider",
        action: "Return ID Token and Access Token",
        description:
          "Issue signed JWT ID token with user claims and access token for UserInfo",
      },
      {
        step: 10,
        actor: "Relying Party",
        action: "Fetch JWKS",
        description:
          "Retrieve public signing keys from /.well-known/jwks.json endpoint",
      },
      {
        step: 11,
        actor: "Relying Party",
        action: "Verify ID Token Signature",
        description:
          "Cryptographically verify token signature using provider's public key",
      },
      {
        step: 12,
        actor: "Relying Party",
        action: "Validate ID Token Claims",
        description:
          "Check iss (correct issuer), aud (matches client_id), exp (not expired), nonce (matches stored value)",
      },
      {
        step: 13,
        actor: "Relying Party",
        action: "Fetch Additional Claims (Optional)",
        description:
          "Call /userinfo endpoint with access token for extended profile data",
      },
      {
        step: 14,
        actor: "Relying Party",
        action: "Create Application Session",
        description:
          "Establish user session using sub claim as unique identifier",
      },
      {
        step: 15,
        actor: "Relying Party",
        action: "Grant Access",
        description:
          "Allow user to access protected resource with identity context",
      },
    ],
    invariants: [
      "ID token MUST be a valid JWT with signature verification",
      "iss claim MUST match expected OpenID Provider URL",
      "aud claim MUST contain the client_id of the Relying Party",
      "exp claim MUST be validated (token not expired)",
      "iat claim MUST be present and reasonable (not future-dated)",
      "nonce claim MUST match the nonce sent in authorization request",
      "sub claim MUST be present and immutable (unique user identifier)",
      "at_hash claim MUST match access token hash if present",
      "ID token signature MUST be verified using JWKS public keys",
      "Token MUST NOT be used before nbf (not before) claim if present",
      "azp (authorized party) MUST match client_id if multiple audiences exist",
    ],
  },

  codeExamples: [
    {
      id: "oidc-nextjs-nextauth",
      language: "typescript",
      title: "Next.js OIDC Integration with NextAuth.js",
      description:
        "Complete OIDC client implementation for Next.js supporting multiple providers with ID token validation",
      code: `// lib/auth.ts - NextAuth.js configuration with OIDC providers
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import { JWT } from "next-auth/jwt";

// 🎯 ACTION: Configure multiple OIDC providers in a single application
// 💡 REASON: OIDC standardization allows using one library for all providers,
//    reducing social login integration from weeks to hours. Before OIDC,
//    each provider required custom code; now configuration is unified.
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OIDC Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // 🎯 ACTION: Request standard OIDC scopes for user identity
      // 💡 REASON: openid is required for OIDC; profile and email are standard
      //    scopes that populate ID token with name, picture, email claims
      authorization: {
        params: {
          scope: "openid profile email",
          // 🎯 ACTION: Request offline access for refresh token
          // 💡 REASON: Enables long-lived sessions without repeated login prompts
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),

    // Microsoft Azure AD OIDC Provider
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      // 🎯 ACTION: Configure Azure AD-specific authorization parameters
      // 💡 REASON: Enterprise OIDC providers often require tenant-specific
      //    configuration; OIDC standards handle this via query parameters
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),

    // GitHub OIDC Provider
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      // Note: GitHub uses OAuth 2.0, not full OIDC, but NextAuth normalizes it
    }),
  ],

  callbacks: {
    // 🎯 ACTION: Extract and validate ID token claims into JWT session
    // 💡 REASON: ID token contains verified identity claims (sub, email, name);
    //    we store these in application session for fast access without API calls
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Store ID token and access token for future use
        token.idToken = account.id_token;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        // 🎯 ACTION: Extract standard OIDC claims from ID token
        // 💡 REASON: sub is the unique, immutable user identifier across sessions;
        //    email and name provide user-friendly display info
        token.sub = profile.sub; // Standard OIDC subject claim
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;

        // Store token expiration for refresh logic
        token.expiresAt = account.expires_at;
      }

      // 🎯 ACTION: Implement token refresh when access token expires
      // 💡 REASON: Access tokens expire (typically 1 hour); refresh tokens enable
      //    seamless session extension without user re-authentication
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      return refreshAccessToken(token);
    },

    // 🎯 ACTION: Populate client session with ID token claims
    // 💡 REASON: Client-side code needs user identity (name, email) for UI;
    //    session object is accessible via useSession() hook
    async session({ session, token }) {
      session.user = {
        id: token.sub as string,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
      };
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;

      return session;
    },
  },

  // 🎯 ACTION: Configure custom signin, signout, and error pages
  // 💡 REASON: Branded authentication flows improve UX; OIDC handles the
  //    complex redirect flows while we control the visual presentation
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  // 🎯 ACTION: Use JWT strategy for session storage
  // 💡 REASON: JWTs enable stateless sessions (no server-side session store);
  //    ID token claims are already in JWT format, making this efficient
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Security: Enable debug only in development
  debug: process.env.NODE_ENV === "development",
};

// 🎯 ACTION: Implement refresh token flow for seamless session extension
// 💡 REASON: When access token expires, use refresh token to get new tokens
//    without user interaction; maintains long-lived sessions securely
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://oauth2.googleapis.com/token";

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      expiresAt: Date.now() / 1000 + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// pages/api/auth/[...nextauth].ts - API route handler
export default NextAuth(authOptions);

// app/page.tsx - Protected page using OIDC authentication
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function HomePage() {
  // 🎯 ACTION: Access user session derived from ID token claims
  // 💡 REASON: useSession provides client-side access to authenticated user
  //    identity; status indicates loading/authenticated/unauthenticated states
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <h1>Sign in with OIDC</h1>
        <button onClick={() => signIn("google")}>Sign in with Google</button>
        <button onClick={() => signIn("azure-ad")}>Sign in with Microsoft</button>
        <button onClick={() => signIn("github")}>Sign in with GitHub</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {session.user?.name}</h1>
      <img src={session.user?.image ?? ""} alt="Profile" />
      <p>Email: {session.user?.email}</p>
      <p>User ID (sub): {session.user?.id}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Next.js application with multi-provider OIDC authentication, token refresh, and session management",
        prerequisites: [
          "Next.js App Router",
          "NextAuth.js library",
          "React hooks",
          "JWT understanding",
        ],
        systemPosition:
          "Social login reduces onboarding friction (70% higher signup conversion vs password forms). OIDC standardization enables supporting Google, Microsoft, GitHub with identical integration code. Before OIDC, each provider required 2-3 weeks of custom integration; with OIDC, adding a new provider takes 1 hour of configuration. Real-world impact: Airbnb reduced signup abandonment by 40% after adding social login via OIDC.",
      },
      annotations: [
        {
          id: "oidc-multi-provider",
          lines: [10, 52],
          action:
            "Configure three OIDC providers (Google, Azure AD, GitHub) with unified API",
          reason:
            "OIDC standardization means one library supports all providers—Google, Microsoft, GitHub use identical flow (authorize -> code exchange -> ID token). Before OIDC, each required custom user info fetching; now ID token contains everything.",
          contextLevel: "system",
          relatedConcepts: ["oauth-2-0", "social-login", "standardization"],
        },
        {
          id: "oidc-id-token-claims",
          lines: [67, 78],
          action:
            "Extract standard OIDC claims (sub, email, name) from ID token into session",
          reason:
            "ID token is cryptographically signed JWT containing user identity—no API call needed. sub is immutable unique identifier (never reused even if user changes email), perfect for database foreign keys.",
          contextLevel: "module",
          relatedConcepts: ["jwt", "claims-based-auth"],
        },
        {
          id: "oidc-token-refresh",
          lines: [81, 91],
          action:
            "Implement refresh token flow to extend session without re-authentication",
          reason:
            "Access tokens expire (1 hour typical); refresh tokens enable 30-day sessions. Users stay logged in across visits without security risk of long-lived access tokens. Amazon uses this for 'Remember Me' functionality.",
          contextLevel: "system",
          relatedConcepts: ["refresh-tokens", "session-management"],
        },
        {
          id: "oidc-refresh-implementation",
          lines: [123, 155],
          action:
            "Call token endpoint with refresh_token grant to get new access/ID tokens",
          reason:
            "When access token expires, seamlessly request new tokens using refresh token. Maintains user session without interruption—critical for mobile apps where users expect to stay logged in for weeks.",
          contextLevel: "module",
          relatedConcepts: ["oauth-2-0", "token-rotation"],
        },
        {
          id: "oidc-jwt-session",
          lines: [115, 121],
          action: "Use JWT session strategy for stateless authentication",
          reason:
            "ID tokens are already JWTs—storing them in encrypted session cookie eliminates need for server-side session database. Enables horizontal scaling (no sticky sessions). Netflix serves 200M+ users with stateless JWT sessions.",
          contextLevel: "system",
          relatedConcepts: ["stateless-auth", "horizontal-scaling"],
        },
        {
          id: "oidc-client-usage",
          lines: [173, 176],
          action: "Access user session client-side via useSession hook",
          reason:
            "ID token claims (name, email, picture) populate session object for UI rendering. No additional API calls—everything needed is in the ID token returned during login.",
          contextLevel: "local",
          relatedConcepts: ["react-hooks", "client-side-auth"],
        },
        {
          id: "oidc-social-login-ui",
          lines: [183, 187],
          action: "Provide branded sign-in buttons for each OIDC provider",
          reason:
            "Social login UX: Google/Microsoft/GitHub buttons instead of password form. Users prefer this (70% choose social login when offered) because it's faster and they don't need another password to remember.",
          contextLevel: "local",
          relatedConcepts: ["user-experience", "onboarding"],
        },
        {
          id: "oidc-standard-scopes",
          lines: [20, 24],
          action: "Request standard openid, profile, email scopes",
          reason:
            "openid scope is required for OIDC (triggers ID token issuance); profile adds name/picture claims; email adds email claim. These are standardized across all OIDC providers—same scope names work for Google, Microsoft, Okta.",
          contextLevel: "module",
          relatedConcepts: ["oauth-scopes", "standardization"],
        },
      ],
      highlights: [
        {
          lines: [10, 52],
          label: "Multi-provider OIDC configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [67, 78],
          label: "ID token claims extraction",
          sbvpDomain: "behavior",
        },
        {
          lines: [123, 155],
          label: "Refresh token flow implementation",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "oidc-flask-keycloak",
      language: "python",
      title: "Python Flask with Keycloak OIDC",
      description:
        "Enterprise OIDC integration using Flask-OIDC with Keycloak for SSO and claims-based authorization",
      code: `# app.py - Flask application with Keycloak OIDC authentication
from flask import Flask, redirect, url_for, session, jsonify, g
from flask_oidc import OpenIDConnect
from functools import wraps
import requests
import json
from jose import jwt, JWKSClient

app = Flask(__name__)

# 🎯 ACTION: Configure Flask-OIDC with Keycloak discovery endpoint
# 💡 REASON: OIDC discovery (/.well-known/openid-configuration) provides all
#    endpoint URLs automatically—no hardcoded URLs means seamless provider
#    upgrades and environment-specific configuration (dev/staging/prod)
app.config.update({
    'SECRET_KEY': 'super-secret-key-change-in-production',
    'OIDC_CLIENT_SECRETS': 'client_secrets.json',
    'OIDC_ID_TOKEN_COOKIE_SECURE': True,  # HTTPS only in production
    'OIDC_REQUIRE_VERIFIED_EMAIL': True,
    'OIDC_USER_INFO_ENABLED': True,
    'OIDC_SCOPES': ['openid', 'profile', 'email', 'roles'],
    # 🎯 ACTION: Enable introspection for access token validation
    # 💡 REASON: Introspection checks if token is still valid on provider side,
    #    preventing use of revoked tokens (critical for enterprise security)
    'OIDC_INTROSPECTION_AUTH_METHOD': 'client_secret_post',
})

oidc = OpenIDConnect(app)

# client_secrets.json - OIDC provider configuration (auto-discovery)
"""
{
  "web": {
    "client_id": "flask-app",
    "client_secret": "your-client-secret-here",
    "auth_uri": "https://keycloak.example.com/auth/realms/master/protocol/openid-connect/auth",
    "token_uri": "https://keycloak.example.com/auth/realms/master/protocol/openid-connect/token",
    "userinfo_uri": "https://keycloak.example.com/auth/realms/master/protocol/openid-connect/userinfo",
    "redirect_uris": ["http://localhost:5000/oidc/callback"],
    "issuer": "https://keycloak.example.com/auth/realms/master",
    "token_introspection_uri": "https://keycloak.example.com/auth/realms/master/protocol/openid-connect/token/introspect"
  }
}
"""

# 🎯 ACTION: Fetch and cache JWKS for ID token signature verification
# 💡 REASON: ID tokens are JWTs signed by provider's private key; we verify
#    signature using public key from JWKS endpoint to ensure token authenticity.
#    Caching JWKS improves performance (no fetch on every request)
JWKS_URI = "https://keycloak.example.com/auth/realms/master/protocol/openid-connect/certs"
jwks_client = JWKSClient(JWKS_URI)

def verify_id_token(id_token: str) -> dict:
    """
    🎯 ACTION: Cryptographically verify ID token signature and claims
    💡 REASON: Even if attacker steals ID token, they can't forge it because
       they don't have provider's private key. Must verify:
       - Signature (crypto proof from provider)
       - Issuer (correct Keycloak realm)
       - Audience (matches our client_id)
       - Expiration (not expired)
       - Nonce (replay attack prevention)
    """
    try:
        # Get signing key from JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(id_token)

        # Verify signature and decode claims
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=['RS256'],
            audience=app.config['OIDC_CLIENT_SECRETS']['client_id'],
            issuer=app.config['OIDC_CLIENT_SECRETS']['issuer'],
        )

        return claims
    except jwt.JWTError as e:
        raise ValueError(f"Invalid ID token: {e}")

# 🎯 ACTION: Create decorator for role-based access control from OIDC claims
# 💡 REASON: Enterprise SSO (Keycloak, Okta) embeds user roles in ID token
#    claims, enabling authorization without database lookups. When user's
#    roles change in Keycloak, next login reflects new permissions immediately.
def require_role(required_role: str):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not oidc.user_loggedin:
                return redirect(url_for('login'))

            # 🎯 ACTION: Extract roles from ID token claims
            # 💡 REASON: Keycloak includes roles in realm_access claim; other
            #    providers use different claim names (groups, roles). OIDC
            #    standard defines basic claims, but role claims are provider-specific.
            user_info = oidc.user_getinfo(['realm_access', 'preferred_username'])
            user_roles = user_info.get('realm_access', {}).get('roles', [])

            if required_role not in user_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_role': required_role,
                    'user_roles': user_roles
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/')
def index():
    """Public homepage - no authentication required"""
    if oidc.user_loggedin:
        return f'Welcome! <a href="/profile">View Profile</a> | <a href="/logout">Logout</a>'
    return 'Welcome! <a href="/login">Login with OIDC</a>'

@app.route('/login')
@oidc.require_login
def login():
    """
    🎯 ACTION: Redirect to Keycloak login page via OIDC authorization endpoint
    💡 REASON: @require_login decorator triggers OIDC flow:
       1. Redirect to /authorize with client_id, scope, state, nonce
       2. User authenticates at Keycloak
       3. Redirect back with authorization code
       4. Exchange code for ID token + access token
       All handled by Flask-OIDC library—zero custom code needed.
    """
    return redirect(url_for('profile'))

@app.route('/profile')
@oidc.require_login
def profile():
    """
    🎯 ACTION: Display user profile from ID token claims and UserInfo endpoint
    💡 REASON: ID token contains core claims (sub, name, email); UserInfo
       endpoint provides extended claims (phone, address). Two-tier approach
       optimizes performance—ID token for most requests, UserInfo only when needed.
    """
    # Get user info from UserInfo endpoint
    user_info = oidc.user_getinfo([
        'sub', 'name', 'email', 'preferred_username',
        'email_verified', 'realm_access', 'groups'
    ])

    # Get raw ID token for inspection
    id_token = oidc.get_access_token()
    id_token_claims = verify_id_token(id_token)

    return jsonify({
        'user_id': user_info.get('sub'),
        'username': user_info.get('preferred_username'),
        'name': user_info.get('name'),
        'email': user_info.get('email'),
        'email_verified': user_info.get('email_verified'),
        'roles': user_info.get('realm_access', {}).get('roles', []),
        'groups': user_info.get('groups', []),
        'id_token_claims': id_token_claims,
    })

@app.route('/admin')
@oidc.require_login
@require_role('admin')
def admin_panel():
    """
    🎯 ACTION: Protect admin routes with role-based authorization
    💡 REASON: Claims-based authorization from OIDC eliminates need for
       application database to store permissions. When admin adds user to
       'admin' role in Keycloak, next login grants access—no app deployment needed.
       Walmart uses this pattern to manage permissions for 2M+ employees.
    """
    return jsonify({
        'message': 'Admin panel - only accessible to users with admin role',
        'user': oidc.user_getinfo(['preferred_username', 'realm_access'])
    })

@app.route('/logout')
def logout():
    """
    🎯 ACTION: Implement RP-initiated logout with Keycloak session termination
    💡 REASON: Simply clearing local session isn't enough for SSO—user would
       still be logged into Keycloak and could re-authenticate instantly.
       RP-initiated logout clears both application AND provider sessions,
       ensuring user is fully logged out across all SSO applications.
    """
    # Get ID token hint for logout (helps provider identify session)
    id_token = oidc.get_access_token()

    # Clear Flask session
    oidc.logout()

    # 🎯 ACTION: Redirect to Keycloak logout endpoint to end SSO session
    # 💡 REASON: Keycloak's end_session_endpoint terminates SSO session,
    #    logging user out of all applications using same Keycloak realm.
    #    Without this, user stays logged in—security risk for shared computers.
    keycloak_logout_url = (
        f"{app.config['OIDC_CLIENT_SECRETS']['issuer']}"
        f"/protocol/openid-connect/logout"
        f"?post_logout_redirect_uri={url_for('index', _external=True)}"
        f"&id_token_hint={id_token}"
    )

    return redirect(keycloak_logout_url)

# 🎯 ACTION: Create API endpoint for validating access tokens (resource server)
# 💡 REASON: Microservices architecture: Flask app might receive access token
#    from another service (SPA, mobile app). Introspection validates token
#    is still active and extracts claims—essential for zero-trust security.
@app.route('/api/validate-token', methods=['POST'])
def validate_token():
    """Introspect access token to check if still valid"""
    from flask import request

    token = request.json.get('access_token')
    if not token:
        return jsonify({'error': 'No token provided'}), 400

    # Call Keycloak introspection endpoint
    introspection_endpoint = app.config['OIDC_CLIENT_SECRETS']['token_introspection_uri']

    response = requests.post(
        introspection_endpoint,
        data={
            'token': token,
            'client_id': app.config['OIDC_CLIENT_SECRETS']['client_id'],
            'client_secret': app.config['OIDC_CLIENT_SECRETS']['client_secret'],
        }
    )

    introspection_result = response.json()

    if introspection_result.get('active'):
        return jsonify({
            'valid': True,
            'username': introspection_result.get('username'),
            'scopes': introspection_result.get('scope', '').split(),
            'expires_at': introspection_result.get('exp'),
        })
    else:
        return jsonify({'valid': False, 'reason': 'Token revoked or expired'}), 401

if __name__ == '__main__':
    # 🎯 ACTION: Run with HTTPS in production for secure cookies
    # 💡 REASON: OIDC redirect URIs must use HTTPS (except localhost);
    #    ID tokens and access tokens in cookies require Secure flag.
    #    Man-in-the-middle attacks can steal tokens over HTTP.
    app.run(debug=True, ssl_context='adhoc')  # Use proper SSL cert in production`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise Flask application with Keycloak OIDC, SSO, role-based authorization, and token introspection",
        prerequisites: [
          "Flask web framework",
          "Keycloak identity provider",
          "JWT and JWKS understanding",
          "Enterprise SSO concepts",
        ],
        systemPosition:
          "Enterprise SSO with OIDC: One Keycloak instance serves 100+ internal applications. Employee logs in once, accesses all apps without re-entering password. When employee leaves company, admin disables Keycloak account—instantly revokes access to all 100+ apps. Before OIDC/SSO, each app had separate credentials (security nightmare). Real example: Red Hat uses Keycloak OIDC for 15,000+ employees accessing 200+ internal tools. Benefits: 80% reduction in password reset tickets, 100% compliance with immediate offboarding (no orphaned accounts).",
      },
      annotations: [
        {
          id: "oidc-discovery",
          lines: [10, 26],
          action:
            "Configure OIDC client using discovery endpoint and client_secrets.json",
          reason:
            "Discovery (/.well-known/openid-configuration) auto-configures all endpoints—no hardcoded URLs. When Keycloak gets upgraded or moved to new domain, just update issuer URL and discovery fetches new endpoints automatically. Enterprise-critical for managing dev/staging/prod environments.",
          contextLevel: "system",
          relatedConcepts: ["service-discovery", "configuration-management"],
        },
        {
          id: "oidc-jwks-verification",
          lines: [46, 75],
          action:
            "Verify ID token signature using JWKS public keys from provider",
          reason:
            "ID token signature proves it came from legitimate Keycloak instance, not attacker. Keycloak signs with private key, we verify with public key from JWKS. Even if attacker steals ID token, they can't modify claims (name, roles) because they can't re-sign it.",
          contextLevel: "module",
          relatedConcepts: ["jwt", "public-key-crypto", "digital-signatures"],
        },
        {
          id: "oidc-claims-authorization",
          lines: [77, 102],
          action:
            "Implement role-based access control using ID token realm_access claims",
          reason:
            "Enterprise OIDC embeds user roles in ID token—no database lookup needed for authorization. When admin adds user to 'admin' role in Keycloak, next login grants access. Centralized permission management: one source of truth for 100+ applications.",
          contextLevel: "system",
          relatedConcepts: ["rbac", "claims-based-auth", "centralized-authz"],
        },
        {
          id: "oidc-userinfo-endpoint",
          lines: [128, 155],
          action:
            "Fetch extended user claims from UserInfo endpoint for profile display",
          reason:
            "ID token contains core claims (sub, name, email) to minimize size. UserInfo endpoint provides extended claims (phone, address, groups) on demand. Two-tier approach: ID token for authentication (every request), UserInfo for profile pages (occasional).",
          contextLevel: "module",
          relatedConcepts: ["api-design", "performance-optimization"],
        },
        {
          id: "oidc-rp-initiated-logout",
          lines: [169, 196],
          action:
            "Implement RP-initiated logout to terminate both app and provider sessions",
          reason:
            "SSO logout complexity: clearing Flask session isn't enough—user still logged into Keycloak (can re-auth instantly). RP-initiated logout calls Keycloak's end_session_endpoint, terminating SSO session across all apps. Security critical for shared computers (libraries, kiosks).",
          contextLevel: "system",
          relatedConcepts: ["sso", "session-management", "security"],
        },
        {
          id: "oidc-token-introspection",
          lines: [198, 227],
          action:
            "Validate access tokens via introspection for microservices resource servers",
          reason:
            "Microservices pattern: SPA gets access token from Keycloak, sends to Flask API. Flask must validate token is still active (not revoked). Introspection checks real-time status at provider—critical for zero-trust security in service mesh architectures.",
          contextLevel: "system",
          relatedConcepts: ["microservices", "zero-trust", "token-validation"],
        },
        {
          id: "oidc-https-requirement",
          lines: [229, 235],
          action: "Enforce HTTPS for production to protect tokens in transit",
          reason:
            "OIDC security requirement: redirect URIs must use HTTPS (except localhost). ID tokens and access tokens in cookies need Secure flag. HTTP allows man-in-the-middle attacks to steal tokens—attacker intercepts redirect, copies authorization code, exchanges for tokens.",
          contextLevel: "system",
          relatedConcepts: ["tls-ssl", "secure-cookies", "mitm-prevention"],
        },
        {
          id: "oidc-require-login-decorator",
          lines: [108, 123],
          action:
            "Use @require_login decorator to trigger OIDC authentication flow",
          reason:
            "Flask-OIDC handles entire OIDC flow transparently: redirect to /authorize, handle callback, exchange code for tokens, create session. Developer writes zero authentication code—just add decorator. This abstraction is why OIDC integration takes hours vs weeks of custom OAuth.",
          contextLevel: "module",
          relatedConcepts: ["decorators", "abstraction", "framework-magic"],
        },
      ],
      highlights: [
        {
          lines: [46, 75],
          label: "ID token signature verification with JWKS",
          sbvpDomain: "structure",
        },
        {
          lines: [77, 102],
          label: "Claims-based role authorization",
          sbvpDomain: "behavior",
        },
        {
          lines: [169, 196],
          label: "RP-initiated SSO logout flow",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "oidc-spring-security",
      language: "java",
      title: "Spring Security OIDC with Multi-Provider Support",
      description:
        "Production-grade Spring Boot application with OIDC authentication, custom claims mapping, and role-based access control",
      code: `// SecurityConfig.java - Spring Security OIDC configuration
package com.example.oidc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    /**
     * 🎯 ACTION: Configure HTTP security with OIDC OAuth2 login
     * 💡 REASON: Spring Security handles OIDC flow automatically—redirect to
     *    provider, handle callback, exchange code for tokens, create session.
     *    oauth2Login() enables login with any registered OIDC provider.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/public/**", "/error").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            // 🎯 ACTION: Enable OAuth2/OIDC login with custom user service
            // 💡 REASON: oauth2Login() configures /oauth2/authorization/{provider}
            //    endpoints for each provider (Google, Okta, Azure AD). Custom
            //    userService maps provider claims to application authorities.
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .oidcUserService(this.oidcUserService())
                )
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/login?error=true")
            )
            // 🎯 ACTION: Configure logout to clear OIDC session
            // 💡 REASON: Logout must invalidate both application session AND
            //    OIDC provider session. logoutSuccessHandler can redirect to
            //    provider's end_session_endpoint for SSO logout.
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }

    /**
     * 🎯 ACTION: Create custom OIDC user service to map ID token claims to authorities
     * 💡 REASON: Different providers structure role/group claims differently:
     *    - Okta: groups claim
     *    - Azure AD: roles claim
     *    - Keycloak: realm_access.roles
     *    Custom service normalizes these into Spring Security's GrantedAuthority
     *    model, enabling consistent RBAC across providers.
     */
    @Bean
    public OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        final OidcUserService delegate = new OidcUserService();

        return (userRequest) -> {
            // Load user from UserInfo endpoint
            OidcUser oidcUser = delegate.loadUser(userRequest);

            // 🎯 ACTION: Extract provider name to determine claim mapping strategy
            // 💡 REASON: Each provider uses different claim names for roles/groups.
            //    Provider-specific logic maps to common GrantedAuthority format.
            String registrationId = userRequest.getClientRegistration()
                .getRegistrationId();

            // Map provider-specific claims to authorities
            Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

            // 🎯 ACTION: Extract roles from ID token based on provider
            // 💡 REASON: No OIDC standard for role claims—each provider differs:
            //    Google: no role claims (uses groups via Admin SDK)
            //    Okta: groups in ID token
            //    Azure AD: roles claim
            //    Keycloak: realm_access.roles
            //    This mapping code bridges provider differences.
            switch (registrationId) {
                case "okta":
                    mappedAuthorities = extractOktaRoles(oidcUser);
                    break;
                case "azure":
                    mappedAuthorities = extractAzureRoles(oidcUser);
                    break;
                case "keycloak":
                    mappedAuthorities = extractKeycloakRoles(oidcUser);
                    break;
                case "google":
                    // Google doesn't provide role claims in ID token
                    // For production, integrate with Google Admin SDK
                    mappedAuthorities = Set.of(
                        new SimpleGrantedAuthority("ROLE_USER")
                    );
                    break;
                default:
                    mappedAuthorities = oidcUser.getAuthorities()
                        .stream()
                        .map(auth -> new SimpleGrantedAuthority(auth.getAuthority()))
                        .collect(Collectors.toSet());
            }

            // 🎯 ACTION: Create new OidcUser with mapped authorities
            // 💡 REASON: Spring Security's @PreAuthorize("hasRole('ADMIN')") checks
            //    authorities. By mapping provider claims to ROLE_* authorities,
            //    we enable consistent RBAC across all OIDC providers.
            return new DefaultOidcUser(
                mappedAuthorities,
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                "sub" // Use 'sub' claim as username (unique identifier)
            );
        };
    }

    /**
     * 🎯 ACTION: Extract roles from Okta ID token groups claim
     * 💡 REASON: Okta includes groups in 'groups' claim array. We prefix with
     *    ROLE_ to match Spring Security convention (hasRole('ADMIN') checks
     *    for 'ROLE_ADMIN' authority).
     */
    private Set<GrantedAuthority> extractOktaRoles(OidcUser oidcUser) {
        List<String> groups = oidcUser.getClaimAsStringList("groups");
        if (groups == null) {
            return Set.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return groups.stream()
            .map(group -> new SimpleGrantedAuthority("ROLE_" +
                group.toUpperCase().replace(" ", "_")))
            .collect(Collectors.toSet());
    }

    /**
     * 🎯 ACTION: Extract roles from Azure AD ID token roles claim
     * 💡 REASON: Azure AD App Roles defined in app registration appear in
     *    'roles' claim. These are enterprise-defined roles (e.g., App.Admin,
     *    App.User) that map to application permissions.
     */
    private Set<GrantedAuthority> extractAzureRoles(OidcUser oidcUser) {
        List<String> roles = oidcUser.getClaimAsStringList("roles");
        if (roles == null) {
            return Set.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toSet());
    }

    /**
     * 🎯 ACTION: Extract roles from Keycloak nested realm_access.roles claim
     * 💡 REASON: Keycloak nests roles in JSON object:
     *    { "realm_access": { "roles": ["admin", "user"] } }
     *    Must navigate nested structure to extract role array.
     */
    @SuppressWarnings("unchecked")
    private Set<GrantedAuthority> extractKeycloakRoles(OidcUser oidcUser) {
        Map<String, Object> realmAccess = oidcUser.getClaim("realm_access");
        if (realmAccess == null || !realmAccess.containsKey("roles")) {
            return Set.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        List<String> roles = (List<String>) realmAccess.get("roles");
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toSet());
    }
}

// application.yml - Multi-provider OIDC configuration
"""
spring:
  security:
    oauth2:
      client:
        registration:
          # 🎯 ACTION: Configure Google OIDC provider
          # 💡 REASON: Google provides discovery endpoint—Spring auto-configures
          #    all URLs from /.well-known/openid-configuration. Just need
          #    client credentials from Google Cloud Console.
          google:
            client-id: your-google-client-id
            client-secret: your-google-client-secret
            scope:
              - openid
              - profile
              - email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"

          # 🎯 ACTION: Configure Okta OIDC provider
          # 💡 REASON: Okta widely used for enterprise SSO. Issuer URI enables
          #    discovery—Spring fetches all endpoints automatically.
          okta:
            client-id: your-okta-client-id
            client-secret: your-okta-client-secret
            scope:
              - openid
              - profile
              - email
              - groups
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"

          # 🎯 ACTION: Configure Azure AD OIDC provider
          # 💡 REASON: Microsoft Azure AD for Office 365 / Microsoft 365 SSO.
          #    Tenant-specific issuer ensures correct Azure AD instance.
          azure:
            client-id: your-azure-client-id
            client-secret: your-azure-client-secret
            scope:
              - openid
              - profile
              - email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"

          # 🎯 ACTION: Configure Keycloak OIDC provider
          # 💡 REASON: Self-hosted Keycloak for complete control over identity
          #    provider. Common for on-premise / air-gapped deployments.
          keycloak:
            client-id: your-keycloak-client-id
            client-secret: your-keycloak-client-secret
            scope:
              - openid
              - profile
              - email
              - roles
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            authorization-grant-type: authorization_code

        provider:
          # 🎯 ACTION: Define provider discovery endpoints
          # 💡 REASON: Issuer URI points to OIDC discovery document. Spring
          #    auto-discovers authorization_endpoint, token_endpoint,
          #    userinfo_endpoint, jwks_uri—zero manual configuration.
          okta:
            issuer-uri: https://your-domain.okta.com/oauth2/default
          azure:
            issuer-uri: https://login.microsoftonline.com/your-tenant-id/v2.0
          keycloak:
            issuer-uri: https://keycloak.example.com/auth/realms/master
"""

// UserController.java - Controller with OIDC-authenticated endpoints
package com.example.oidc.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    /**
     * 🎯 ACTION: Access authenticated user's ID token claims via @AuthenticationPrincipal
     * 💡 REASON: Spring Security injects OidcUser with all ID token claims.
     *    No session lookup needed—user identity available in every request.
     */
    @GetMapping("/user/profile")
    public Map<String, Object> getUserProfile(
        @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return Map.of(
            "userId", oidcUser.getSubject(),
            "name", oidcUser.getFullName(),
            "email", oidcUser.getEmail(),
            "emailVerified", oidcUser.getEmailVerified(),
            "picture", oidcUser.getPicture(),
            "provider", oidcUser.getIssuer().toString(),
            "allClaims", oidcUser.getClaims()
        );
    }

    /**
     * 🎯 ACTION: Protect admin endpoint with role-based authorization
     * 💡 REASON: @PreAuthorize checks authorities mapped from provider claims.
     *    Works identically whether user logged in via Google, Okta, Azure AD,
     *    or Keycloak—claims normalized to ROLE_ADMIN authority.
     */
    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getAdminDashboard(
        @AuthenticationPrincipal OidcUser oidcUser
    ) {
        return Map.of(
            "message", "Admin Dashboard",
            "user", oidcUser.getPreferredUsername(),
            "authorities", oidcUser.getAuthorities()
        );
    }

    /**
     * 🎯 ACTION: Implement custom authorization logic based on ID token claims
     * 💡 REASON: Beyond simple role checks, can use any ID token claim for
     *    authorization—email domain, organization, custom attributes.
     *    Example: only allow users from @company.com domain.
     */
    @GetMapping("/restricted/company-only")
    public Map<String, Object> getCompanyOnlyResource(
        @AuthenticationPrincipal OidcUser oidcUser
    ) {
        String email = oidcUser.getEmail();

        if (email == null || !email.endsWith("@company.com")) {
            throw new ForbiddenException(
                "This resource is only available to company employees"
            );
        }

        return Map.of(
            "message", "Company-only resource",
            "user", oidcUser.getPreferredUsername()
        );
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise Spring Boot application with multi-provider OIDC support, custom claims mapping, and role-based access control",
        prerequisites: [
          "Spring Boot 3.x",
          "Spring Security 6.x",
          "OAuth2 Client library",
          "Enterprise identity providers (Okta/Azure AD/Keycloak)",
        ],
        systemPosition:
          "OIDC standardization eliminates vendor lock-in: application supports Google, Okta, Azure AD, Keycloak with identical code. Enterprise can switch identity providers without application changes—just update configuration. Real example: Company using Okta acquires company using Azure AD. Merged application supports both providers during 6-month migration, then switches entirely to Azure AD by changing 10 lines of YAML. Before OIDC: would require 3-month rewrite of authentication system. OIDC benefit: interchangeable providers, no vendor lock-in, reduced migration risk.",
      },
      annotations: [
        {
          id: "oidc-spring-oauth2-login",
          lines: [29, 57],
          action:
            "Configure Spring Security with OAuth2/OIDC login and custom user service",
          reason:
            "Spring Security's oauth2Login() handles entire OIDC flow: redirect to /oauth2/authorization/{provider}, handle callback, exchange code for tokens, create authentication. Developer writes zero flow logic—just configure providers in YAML. This abstraction is why Spring + OIDC integration takes 2 hours vs 2 weeks of custom OAuth.",
          contextLevel: "system",
          relatedConcepts: [
            "spring-security",
            "oauth2-client",
            "framework-abstraction",
          ],
        },
        {
          id: "oidc-custom-claims-mapping",
          lines: [59, 126],
          action:
            "Map provider-specific role claims to Spring Security GrantedAuthority",
          reason:
            "OIDC standardizes ID token format but NOT role claim names—each provider differs. Custom user service bridges this gap, extracting roles from Okta's 'groups', Azure's 'roles', Keycloak's 'realm_access.roles', and normalizing to ROLE_* authorities. Enables writing @PreAuthorize('hasRole(ADMIN)') once, working across all providers.",
          contextLevel: "system",
          relatedConcepts: ["rbac", "claims-mapping", "provider-abstraction"],
        },
        {
          id: "oidc-multi-provider-config",
          lines: [190, 262],
          action:
            "Configure four OIDC providers (Google, Okta, Azure AD, Keycloak) via YAML",
          reason:
            "Spring Boot's auto-configuration + OIDC discovery = minimal config. Issuer URI enables discovery—Spring fetches authorization_endpoint, token_endpoint, userinfo_endpoint, jwks_uri automatically. Adding new provider: 8 lines of YAML. Pre-OIDC: 200+ lines of custom integration code per provider.",
          contextLevel: "system",
          relatedConcepts: [
            "configuration-driven",
            "service-discovery",
            "oidc-discovery",
          ],
        },
        {
          id: "oidc-okta-roles-extraction",
          lines: [128, 143],
          action: "Extract roles from Okta 'groups' claim in ID token",
          reason:
            "Okta includes user groups in ID token 'groups' claim (must enable in Okta app settings). Groups like 'Engineering', 'Administrators' map to ROLE_ENGINEERING, ROLE_ADMINISTRATORS. When admin adds user to group in Okta, next login grants new permissions—centralized access control for 100+ apps.",
          contextLevel: "module",
          relatedConcepts: ["okta", "group-based-access"],
        },
        {
          id: "oidc-azure-roles-extraction",
          lines: [145, 160],
          action: "Extract roles from Azure AD 'roles' claim in ID token",
          reason:
            "Azure AD App Roles defined in app registration manifest appear in 'roles' claim. Enterprise defines business roles (e.g., 'Sales.Manager', 'Finance.Analyst'), Azure AD includes in ID token. Enables business-aligned RBAC without custom permission database.",
          contextLevel: "module",
          relatedConcepts: ["azure-ad", "app-roles"],
        },
        {
          id: "oidc-keycloak-roles-extraction",
          lines: [162, 178],
          action:
            "Extract roles from Keycloak nested 'realm_access.roles' claim structure",
          reason:
            "Keycloak nests roles in JSON: {realm_access: {roles: ['admin']}}. Realm roles vs client roles distinction (Keycloak-specific). Must navigate nested structure to extract role array. Self-hosted Keycloak gives complete control over claim structure—common for highly regulated industries.",
          contextLevel: "module",
          relatedConcepts: ["keycloak", "nested-claims"],
        },
        {
          id: "oidc-authentication-principal",
          lines: [271, 286],
          action:
            "Inject OidcUser via @AuthenticationPrincipal to access ID token claims",
          reason:
            "Spring Security deserializes ID token into OidcUser object with typed accessors (getEmail(), getFullName(), getSubject()). Available in every request—no database lookup. getClaims() provides raw ID token for custom claims. Enables claims-based authorization without persistence layer.",
          contextLevel: "module",
          relatedConcepts: [
            "dependency-injection",
            "spring-mvc",
            "claims-based-auth",
          ],
        },
        {
          id: "oidc-preauthorize-rbac",
          lines: [288, 302],
          action:
            "Use @PreAuthorize annotation for role-based endpoint protection",
          reason:
            "Spring Security's method security checks authorities before method execution. hasRole('ADMIN') checks for ROLE_ADMIN in authorities collection (mapped from provider claims). Works identically whether user logged in via Google, Okta, Azure AD, or Keycloak—provider abstraction enables consistent RBAC.",
          contextLevel: "module",
          relatedConcepts: ["method-security", "rbac", "spring-aop"],
        },
      ],
      highlights: [
        {
          lines: [59, 126],
          label: "Custom claims mapping for multi-provider RBAC",
          sbvpDomain: "structure",
        },
        {
          lines: [190, 262],
          label: "Multi-provider OIDC configuration via discovery",
          sbvpDomain: "structure",
        },
        {
          lines: [288, 302],
          label: "Role-based authorization with @PreAuthorize",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Social login flows (Google, Facebook, GitHub sign-in)",
      "Enterprise Single Sign-On (SSO) portals",
      "Mobile app authentication (native apps, PKCE flow)",
      "Single-Page Application (SPA) authentication",
      "Microservices identity federation",
      "B2B partner authentication (multi-tenant SaaS)",
      "Developer portals and API gateways",
      "Internal tool authentication (admin panels, dashboards)",
    ],
    interactsWith: [
      "oauth-2-0",
      "jwt",
      "refresh-tokens",
      "session-management",
      "api-gateway",
    ],
    architecturalBoundaries: [
      "Identity Provider boundary (Okta, Auth0, Google, Azure AD)",
      "Relying Party boundary (application receiving ID tokens)",
      "Token validation boundary (JWKS endpoint for signature verification)",
      "Claims registry boundary (UserInfo endpoint for extended profile data)",
      "Session management boundary (application-level session storage)",
      "Authorization boundary (mapping claims to application permissions)",
    ],
  },

  implementations: [
    {
      id: "keycloak",
      name: "Keycloak",
      type: "platform",
      languages: ["any"],
      description:
        "Open-source identity and access management platform with full OIDC support. Provides user federation, identity brokering, social login, SSO, and fine-grained authorization. Used by Red Hat, Cisco, and thousands of enterprises. Self-hosted or managed (Red Hat SSO).",
      links: {
        docs: "https://www.keycloak.org/documentation",
        github: "https://github.com/keycloak/keycloak",
      },
    },
    {
      id: "auth0",
      name: "Auth0",
      type: "service",
      languages: ["any"],
      description:
        "Cloud-based identity platform with OIDC, social connections, enterprise federation (SAML, AD), and passwordless authentication. Provides SDKs for 20+ languages/frameworks. Used by Atlassian, Mozilla, VMware. 100k+ applications, 4.5B+ logins/month.",
      links: {
        docs: "https://auth0.com/docs",
      },
    },
    {
      id: "okta",
      name: "Okta Identity Cloud",
      type: "service",
      languages: ["any"],
      description:
        "Enterprise identity platform with OIDC, SAML, multi-factor authentication, lifecycle management, and API access management. Industry leader in workforce identity (15,000+ enterprises). Acquired Auth0 in 2021. 300M+ monthly active users.",
      links: {
        docs: "https://developer.okta.com/docs/",
      },
    },
    {
      id: "google-identity",
      name: "Google Identity Platform",
      type: "service",
      languages: ["any"],
      description:
        "Google's OIDC provider enabling 'Sign in with Google' for 3 billion+ Google accounts. Provides ID tokens with email, name, picture claims. Widely used for consumer applications. Free tier: unlimited authentications. Integrates with Google Workspace for enterprise SSO.",
      links: {
        docs: "https://developers.google.com/identity/protocols/oauth2/openid-connect",
      },
    },
    {
      id: "microsoft-identity",
      name: "Microsoft Identity Platform",
      type: "service",
      languages: ["any"],
      description:
        "Azure AD and Microsoft Account OIDC provider. Enables SSO for Office 365, Microsoft 365, Azure services. 300M+ monthly active users. Supports work/school accounts (Azure AD) and personal Microsoft accounts. Enterprise features: Conditional Access, MFA, B2B/B2C.",
      links: {
        docs: "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc",
      },
    },
    {
      id: "aws-cognito",
      name: "AWS Cognito",
      type: "service",
      languages: ["any"],
      description:
        "AWS managed OIDC provider with user pools, identity pools, and social/enterprise federation. Provides JWTs for API authorization, integrates with API Gateway, Lambda, S3. Scales to millions of users. Pay-per-active-user pricing. HIPAA, SOC, PCI DSS compliant.",
      links: {
        docs: "https://docs.aws.amazon.com/cognito/latest/developerguide/",
      },
    },
    {
      id: "ping-identity",
      name: "Ping Identity",
      type: "service",
      languages: ["any"],
      description:
        "Enterprise identity platform with PingFederate (OIDC/SAML server), PingOne (cloud), and PingAccess (API security). Used by 60% of Fortune 100. Strong in hybrid cloud, zero-trust, and API security. Focus on regulated industries (finance, healthcare, government).",
      links: {
        docs: "https://docs.pingidentity.com/",
      },
    },
    {
      id: "onelogin",
      name: "OneLogin",
      type: "service",
      languages: ["any"],
      description:
        "Cloud-based SSO and identity management with OIDC, SAML, RADIUS. Provides unified access management, MFA, and user provisioning. 5,500+ pre-integrated applications. Strong in mid-market and SMB. Acquired by One Identity in 2021.",
      links: {
        docs: "https://developers.onelogin.com/openid-connect",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "google-signin",
      systemName: "Google Sign-In",
      howUsed:
        "Google Identity Platform serves as OIDC provider for 3 billion+ Google accounts, enabling 'Sign in with Google' across millions of websites and mobile apps. When user clicks 'Sign in with Google', application redirects to Google's authorization endpoint with scope=openid profile email. User authenticates (if not already logged in), consents to sharing profile data, and Google redirects back with authorization code. Application exchanges code for ID token (JWT) containing sub (unique Google user ID), name, email, picture claims. ID token signature verified using Google's JWKS endpoint ensures cryptographic proof of authentication. Pattern composition: OIDC + JWT + Refresh Tokens (offline_access) + UserInfo endpoint. Benefits: 70% higher signup conversion vs password forms (Google I/O 2019 data), zero password storage/management burden, automatic email verification. Real-world scale: Stack Overflow (14M+ users), Spotify (500M+ users), and Airbnb all use Google Sign-In as primary authentication. Impact: Reduced Airbnb signup abandonment by 40%, eliminated password reset tickets (20% reduction in support volume), enabled cross-device SSO (login on mobile, automatic auth on desktop).",
      source:
        "https://developers.google.com/identity/protocols/oauth2/openid-connect",
    },
    {
      systemId: "microsoft-azure-ad",
      systemName: "Microsoft Azure Active Directory",
      howUsed:
        "Azure AD provides OIDC-based SSO for 300 million+ monthly active users across Office 365, Microsoft 365, Azure Portal, and 2,800+ third-party SaaS applications. Employees log in once to Windows (Azure AD joined), gaining automatic access to all integrated apps via OIDC SSO without re-entering credentials. When employee accesses third-party app (Salesforce, Slack, Zoom), app redirects to Azure AD authorization endpoint. Azure AD checks existing session (SSO), issues ID token with user claims (objectId, email, groups, department). Application validates ID token signature via Azure AD JWKS, extracts claims for authorization. Pattern composition: OIDC + SAML (legacy apps) + Conditional Access (MFA, device compliance) + App Roles (enterprise RBAC). Enterprise benefits: Centralized user lifecycle (hire/fire in one place affects all apps), group-based access (add to 'Engineering' group grants access to 50+ tools), compliance (audit all access via Azure AD logs). Real example: Maersk (80,000 employees) uses Azure AD OIDC for 200+ internal/external applications. Impact: Reduced onboarding from 2 days to 2 hours (automated provisioning), immediate offboarding (disable Azure AD account revokes all app access in seconds), 90% reduction in password-related help desk tickets.",
      source:
        "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc",
    },
    {
      systemId: "github-oauth",
      systemName: "GitHub OAuth Apps",
      howUsed:
        "GitHub provides OIDC for 100 million+ developers, enabling 'Sign in with GitHub' for developer tools, CI/CD platforms, and code-related services. OAuth Apps (Vercel, Netlify, CircleCI) redirect to github.com/login/oauth/authorize with scope=read:user user:email. Developer authorizes app, GitHub redirects with code. App exchanges code for access token + ID token (if OpenID scope requested). ID token contains GitHub username, email, avatar_url. Apps use GitHub's API as UserInfo endpoint to fetch additional data (organizations, repositories, team memberships). Pattern composition: OIDC (authentication) + OAuth 2.0 scopes (authorization for repo access) + GitHub Apps (fine-grained permissions). Benefits: Zero signup friction for developers (already have GitHub account), automatic email verification, organizational context (can check if user belongs to specific GitHub org/team). Real example: Vercel uses GitHub OIDC for authentication + repo permissions to auto-deploy on git push. Impact: 95% of Vercel users authenticate via GitHub (vs 3% email/password, 2% GitLab/Bitbucket), enabled automatic team permission syncing (user removed from GitHub org = immediate Vercel access revocation), reduced time-to-first-deploy from 10 minutes to 30 seconds (no manual project setup).",
      source: "https://docs.github.com/en/developers/apps/building-oauth-apps",
    },
    {
      systemId: "okta-enterprise-sso",
      systemName: "Okta Enterprise SSO",
      howUsed:
        "Okta Identity Cloud provides OIDC-based SSO for 15,000+ enterprises managing 300M+ identities across 7,000+ pre-integrated applications. Enterprise configures Okta as central identity provider, integrating HR system (Workday, BambooHR) for automated user provisioning. When employee accesses SaaS app (Salesforce, Slack, AWS Console), app redirects to Okta authorization endpoint. Okta checks session (SSO), evaluates policies (MFA, device trust, network location via Conditional Access), issues ID token with custom claims (department, cost_center, manager_email, custom_attributes). Applications map Okta claims to roles/permissions. Pattern composition: OIDC + Universal Directory (user store) + Lifecycle Management (auto-provision/deprovision) + Adaptive MFA. Enterprise benefits: Single source of truth for identity (HR system drives access), just-in-time provisioning (user created in apps on first login), centralized policy enforcement (geo-blocking, device compliance). Real example: JetBlue (20,000 employees) uses Okta OIDC for 200+ applications including flight operations, customer service, and corporate tools. Impact: Reduced onboarding from 3 days to 3 hours (automated provisioning), 100% offboarding compliance (terminated employee loses all access immediately), prevented $2M+ data breach (MFA requirement blocked compromised credentials from 2,000+ phishing attempts).",
      source: "https://developer.okta.com/docs/concepts/oauth-openid/",
    },
    {
      systemId: "auth0-multi-tenant",
      systemName: "Auth0 Multi-Tenant SaaS Authentication",
      howUsed:
        "Auth0 serves 100,000+ applications processing 4.5 billion+ logins monthly via OIDC, enabling B2B SaaS platforms to provide SSO for enterprise customers. SaaS application (Slack, Zoom, Atlassian) uses Auth0 as identity platform. Each enterprise customer (tenant) configures their identity provider (Okta, Azure AD, Google Workspace) in Auth0 via enterprise connections. When enterprise user logs into SaaS app, app redirects to Auth0 with tenant hint (domain-based or home realm discovery). Auth0 identifies enterprise's IdP, redirects to customer's Okta/Azure AD for authentication, receives ID token, adds custom claims (tenant_id, plan_tier, feature_flags), issues new ID token to application. Pattern composition: OIDC + Identity Brokering (Auth0 mediates between app and customer IdPs) + Multi-Tenancy + Social + Enterprise connections. SaaS benefits: Single integration (Auth0) supports all enterprise IdPs, tenant isolation (each customer's auth separate), custom claims per tenant (plan-based feature flags in ID token). Real example: Zoom uses Auth0-like architecture to support 'Sign in with SSO' for enterprise customers. Impact: Enabled selling to enterprises requiring SAML/OIDC SSO (60% of enterprise deals require SSO), reduced IdP integration time from 2 months to 2 weeks per customer, increased enterprise deal velocity by 3x (SSO no longer deployment blocker).",
      source:
        "https://auth0.com/docs/authenticate/protocols/openid-connect-protocol",
    },
  ],

  philosophy: {
    coreProblem:
      "OAuth 2.0 solved authorization but left authentication undefined, forcing every provider to implement custom user info endpoints and claim formats, creating integration chaos",
    designPrinciple:
      "Standardize identity exchange on top of OAuth 2.0 through ID tokens (JWT), UserInfo endpoint, and discovery, enabling interchangeable identity providers",
    historicalContext:
      "Created in 2014 by merging OAuth 2.0 and OpenID 2.0. OpenID 2.0 handled authentication but had poor adoption due to complexity; OAuth 2.0 had great adoption but no identity layer. OIDC combines OAuth 2.0's authorization with standardized identity claims.",
    alternativesRejected: [
      "Pure OAuth 2.0 - requires custom /me endpoints per provider",
      "SAML - XML-based, overly complex for web/mobile, poor developer experience",
      "OpenID 2.0 - complex, poor adoption, no mobile support",
      "Custom session cookies - doesn't work for distributed systems, no SSO",
    ],
    mentalModel:
      "OIDC is like a standardized ID card issued by trusted authority (Google, Microsoft, Okta). Instead of every bar/club creating their own ID format, they all accept the same standardized card format (ID token) and can verify it's legitimate (signature verification). The card contains standard fields (name, birthdate, photo) that every location understands.",
  },

  visualization: {
    staticDiagram: `graph TB
    User[User] -->|1. Access protected resource| RP[Relying Party]
    RP -->|2. Redirect to /authorize| OP[OpenID Provider]
    OP -->|3. Show login page| User
    User -->|4. Submit credentials| OP
    OP -->|5. Redirect with code| RP
    RP -->|6. POST /token with code| OP
    OP -->|7. Return ID token + access token| RP
    RP -->|8. Verify signature| JWKS[JWKS Endpoint]
    RP -->|9. Fetch extended claims| UserInfo[UserInfo Endpoint]
    RP -->|10. Create session| User`,
    realWorldAnalogy:
      "OIDC is like airport security at international airports. Instead of every country having different ID formats, they standardized on passports with specific data fields (name, nationality, photo, expiration). When you arrive, security verifies the passport is legitimate (hologram, watermark = signature verification), reads standard fields (name = sub claim, nationality = email claim), and grants access. Before standardization, each country accepted different ID formats—chaos for travelers and security. OIDC standardized digital identity the same way passports standardized physical identity.",
    useCases: [
      {
        domain: "Social Authentication",
        scenario:
          "E-commerce site offers 'Sign in with Google/Facebook/GitHub'. User clicks Google, redirects to Google login, returns with ID token containing email/name/picture. Site creates account from ID token claims.",
        patternRole:
          "Eliminates password management, reduces signup friction by 70%, provides verified email addresses",
        companies: ["Airbnb", "Spotify", "Stack Overflow"],
      },
      {
        domain: "Enterprise SSO",
        scenario:
          "Employee at Fortune 500 company logs into Windows (Azure AD), automatically gains access to 200+ internal/external apps (Salesforce, SAP, Workday) via OIDC SSO without re-authentication.",
        patternRole:
          "Centralized identity management, automated provisioning/deprovisioning, policy enforcement (MFA, device compliance)",
        companies: ["Maersk", "JetBlue", "Walmart"],
      },
      {
        domain: "B2B SaaS Multi-Tenancy",
        scenario:
          "SaaS platform enables enterprise customers to configure their IdP (Okta, Azure AD). Customer's employees use corporate SSO to access SaaS app, maintaining enterprise security controls.",
        patternRole:
          "Enables selling to enterprises requiring SSO (60% of deals), tenant isolation, customer-controlled authentication",
        companies: ["Slack", "Zoom", "Atlassian"],
      },
    ],
  },

  tags: [
    "security",
    "authentication",
    "identity",
    "oauth2",
    "jwt",
    "sso",
    "federation",
    "enterprise",
  ],
  difficulty: "intermediate",
};
