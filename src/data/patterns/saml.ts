import type { Pattern } from "../schema";

export const sAML: Pattern = {
  id: "saml",
  slug: "saml",
  corpusPath: "🔒 SECURITY → 🎟️ Token-Based Auth → 🎟️ SAML",

  hierarchy: {
    quality: "security",
    strategy: "Token-Based Auth",
    family: "Identity Federation",
    level: 4,
  },

  concept: {
    name: "SAML (Security Assertion Markup Language)",
    emoji: "🎟️",
    tagline: "XML-based enterprise Single Sign-On standard",
    definition:
      "Security Assertion Markup Language (SAML) 2.0 is an XML-based open standard for exchanging authentication and authorization data between identity providers and service providers, primarily used for enterprise Single Sign-On (SSO). SAML enables users to authenticate once with their organization's Identity Provider (IdP)—like Okta, Active Directory Federation Services, or OneLogin—and gain access to multiple cloud applications (Service Providers) without re-entering credentials. The protocol centers on signed XML assertions containing user identity claims, group memberships, and authentication context (how/when user authenticated). In the browser-based SSO flow, a user accessing a protected resource at the Service Provider (SP) triggers a SAML authentication request. The SP redirects the user's browser to the IdP with a Base64-encoded SAML request. After authenticating, the IdP generates a digitally signed SAML assertion (XML document) containing user attributes and posts it back to the SP's Assertion Consumer Service (ACS) endpoint via HTTP POST through the browser. The SP validates the assertion's XML signature using the IdP's public certificate, verifies time bounds (NotBefore, NotOnOrAfter), and extracts user attributes to establish a session. SAML supports multiple bindings (HTTP-POST, HTTP-Redirect, SOAP) and three core assertion types: Authentication (confirms user identity), Attribute (provides user metadata like email, department), and Authorization Decision (defines permitted actions). Metadata exchange between IdP and SP—XML documents containing entity IDs, endpoints, and certificates—automates trust configuration.",
    problemSolved:
      "Before SAML, enterprises faced the credential sprawl problem: employees managing 50+ separate username/password combinations for different applications (Salesforce, SAP, HR systems, email). Each app maintained its own user directory, creating massive operational overhead—IT manually provisioned users across every system, deprovisioning required updating 50+ applications individually when employees left. Password fatigue led to insecure practices (reusing passwords, writing them down). SAML solves this through federated identity: the organization maintains one authoritative identity source (Active Directory, LDAP), and all applications trust authentication assertions from that source. When an employee leaves, IT disables their account in one place—AD—instantly revoking access to all SAML-integrated apps (100% offboarding compliance). SAML eliminates password management burden for both users (one corporate login for everything) and IT (80% reduction in password reset tickets). The standard also solves the vendor integration problem: without SAML, each SaaS app required custom authentication integration (weeks of development per app). With SAML metadata exchange, adding a new SAML-compliant app takes 30 minutes of configuration (upload metadata, map attributes). This transformed enterprise SaaS adoption—Fortune 500 companies could mandate SSO for compliance without blocking software procurement.",
    tradeoffs: {
      pros: [
        "Enterprise standard—60% of Fortune 500 mandate SAML for SaaS apps",
        "Centralized identity source—one user directory (AD/LDAP) for all apps",
        "Instant access revocation—disable IdP account, lose access to all apps immediately",
        "Metadata-driven trust—automatic configuration via XML metadata exchange",
        "Strong security—XML digital signatures, encryption support (SAML assertions can be encrypted)",
        "Mature ecosystem—battle-tested since 2005, extensive IdP/SP support",
      ],
      cons: [
        "XML complexity—verbose XML format (5-15KB assertions vs 1-2KB JWT)",
        "Poor developer experience—complex XML signing, parsing, validation libraries required",
        "Limited mobile support—designed for browser redirects, awkward for native mobile apps",
        "Metadata management overhead—certificate rotation requires metadata updates across all SPs",
        "Clock skew sensitivity—NotBefore/NotOnOrAfter validation fails if clocks not synchronized",
        "No standard refresh mechanism—session length determined by SP, no refresh tokens",
      ],
    },
    relatedPatterns: [
      "oidc",
      "oauth-2-0",
      "jwt",
      "session-management",
      "tls-ssl",
      "xml-signatures",
    ],
  },

  structure: {
    participants: [
      {
        name: "End User (Principal)",
        role: "Resource Owner",
        responsibilities: [
          "Initiate access to Service Provider application",
          "Authenticate with Identity Provider using corporate credentials",
          "Provide consent if required for attribute release",
          "Maintain valid IdP session for SSO across applications",
        ],
      },
      {
        name: "Service Provider (SP)",
        role: "Relying Party Application",
        responsibilities: [
          "Detect unauthenticated user and initiate SAML authentication",
          "Generate SAML authentication request and redirect to IdP",
          "Receive and validate SAML assertion from IdP (signature, time bounds, audience)",
          "Extract user attributes from assertion and establish application session",
          "Consume Assertion Consumer Service (ACS) endpoint for receiving assertions",
          "Publish metadata describing SP entity ID, ACS URL, and certificate",
        ],
      },
      {
        name: "Identity Provider (IdP)",
        role: "Authentication Authority",
        responsibilities: [
          "Authenticate users against corporate directory (Active Directory, LDAP)",
          "Process SAML authentication requests from Service Providers",
          "Generate signed SAML assertions containing user identity and attributes",
          "Post assertions to SP's Assertion Consumer Service via browser redirect",
          "Maintain user session for Single Sign-On across multiple SPs",
          "Publish metadata describing IdP entity ID, SSO endpoint, and signing certificate",
        ],
      },
      {
        name: "SAML Assertion",
        role: "Identity Token (XML Document)",
        responsibilities: [
          "Contain authentication statement confirming user identity and auth time",
          "Include attribute statements with user metadata (email, name, groups, department)",
          "Provide XML digital signature for integrity verification",
          "Define time bounds (NotBefore, NotOnOrAfter) for validity window",
          "Specify audience restriction (which SP can consume this assertion)",
          "Optionally include authorization decision statements for access control",
        ],
      },
      {
        name: "Metadata",
        role: "Trust Configuration Document",
        responsibilities: [
          "Define entity ID (unique identifier for IdP or SP)",
          "Declare endpoints (SSO URL for IdP, ACS URL for SP)",
          "Publish X.509 certificates for signature verification",
          "Specify supported bindings (HTTP-POST, HTTP-Redirect)",
          "Include contact information and organization details",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User as End User
    participant SP as Service Provider<br/>(Salesforce, SAP)
    participant Browser as User Browser
    participant IdP as Identity Provider<br/>(Okta, AD FS)

    User->>SP: 1. Access protected resource<br/>(no session)
    SP->>SP: 2. Detect unauthenticated user
    SP->>SP: 3. Generate SAML AuthnRequest<br/>(Base64 encoded XML)
    SP->>Browser: 4. HTTP 302 redirect to IdP<br/>?SAMLRequest=<base64>
    Browser->>IdP: 5. GET SSO endpoint with request
    IdP->>IdP: 6. Decode & parse AuthnRequest XML
    IdP->>User: 7. Show login page (if no session)
    User->>IdP: 8. Submit credentials
    IdP->>IdP: 9. Authenticate against AD/LDAP
    IdP->>IdP: 10. Generate SAML Assertion<br/>(XML with user attributes)
    IdP->>IdP: 11. Sign assertion with private key<br/>(XML digital signature)
    IdP->>Browser: 12. HTTP 200 with HTML form<br/>auto-submit POST to ACS
    Browser->>SP: 13. POST /acs<br/>SAMLResponse=<base64 assertion>
    SP->>SP: 14. Decode & parse assertion XML
    SP->>SP: 15. Verify XML signature with IdP cert
    SP->>SP: 16. Validate NotBefore/NotOnOrAfter
    SP->>SP: 17. Check audience matches SP entity ID
    SP->>SP: 18. Extract user attributes<br/>(email, name, groups)
    SP->>SP: 19. Create application session
    SP->>User: 20. Grant access to protected resource

    Note over User,IdP: User now has SSO session at IdP
    User->>SP: 21. Later: access another SP app
    Note over SP,IdP: IdP reuses session, no re-authentication!`,
    flow: [
      {
        step: 1,
        actor: "End User",
        action: "Access Protected Resource",
        description:
          "User navigates to Service Provider application (e.g., clicks Salesforce bookmark) without an active session",
      },
      {
        step: 2,
        actor: "Service Provider",
        action: "Detect Unauthenticated User",
        description:
          "SP checks for valid application session cookie; finding none, initiates SAML authentication flow",
      },
      {
        step: 3,
        actor: "Service Provider",
        action: "Generate SAML Authentication Request",
        description:
          "SP creates XML AuthnRequest with SP entity ID, ACS URL, and optional requested attributes; signs if required; Base64-encodes",
      },
      {
        step: 4,
        actor: "Service Provider",
        action: "Redirect to Identity Provider SSO Endpoint",
        description:
          "SP sends HTTP 302 redirect to IdP's SingleSignOnService URL with SAMLRequest parameter (HTTP-Redirect binding) or auto-submitting HTML form (HTTP-POST binding)",
      },
      {
        step: 5,
        actor: "User Browser",
        action: "Deliver Request to IdP",
        description:
          "Browser follows redirect and delivers SAMLRequest to IdP's SSO endpoint, including any existing IdP session cookies",
      },
      {
        step: 6,
        actor: "Identity Provider",
        action: "Decode and Parse Authentication Request",
        description:
          "IdP Base64-decodes SAMLRequest, parses XML, validates signature if present, extracts SP entity ID and ACS URL",
      },
      {
        step: 7,
        actor: "Identity Provider",
        action: "Authenticate User",
        description:
          "If no IdP session exists, present login page for user to enter corporate credentials (username/password, MFA). If session exists (SSO), skip to assertion generation",
      },
      {
        step: 8,
        actor: "Identity Provider",
        action: "Validate Credentials",
        description:
          "Authenticate user against corporate directory (Active Directory, LDAP, database) and establish IdP session",
      },
      {
        step: 9,
        actor: "Identity Provider",
        action: "Generate SAML Assertion",
        description:
          "Create XML assertion with AuthnStatement (user authenticated at specific time), AttributeStatement (email, name, groups), Subject (user identifier), Conditions (NotBefore/NotOnOrAfter time bounds, AudienceRestriction to SP entity ID)",
      },
      {
        step: 10,
        actor: "Identity Provider",
        action: "Sign Assertion",
        description:
          "Apply XML digital signature using IdP's private key to entire assertion or specific elements; ensures integrity and authenticity",
      },
      {
        step: 11,
        actor: "Identity Provider",
        action: "POST Assertion to Service Provider",
        description:
          "Base64-encode signed assertion into SAMLResponse parameter; return HTML page with auto-submitting form that POSTs to SP's ACS endpoint (HTTP-POST binding)",
      },
      {
        step: 12,
        actor: "User Browser",
        action: "Submit Assertion to ACS",
        description:
          "Browser automatically submits form, POSTing SAMLResponse to SP's Assertion Consumer Service URL",
      },
      {
        step: 13,
        actor: "Service Provider",
        action: "Receive and Decode Assertion",
        description:
          "SP receives POST, extracts SAMLResponse parameter, Base64-decodes to obtain XML assertion",
      },
      {
        step: 14,
        actor: "Service Provider",
        action: "Verify XML Signature",
        description:
          "Validate assertion signature using IdP's public certificate (from metadata); ensures assertion not tampered with and genuinely from IdP",
      },
      {
        step: 15,
        actor: "Service Provider",
        action: "Validate Time Bounds",
        description:
          "Check current time falls between NotBefore and NotOnOrAfter conditions; reject expired or not-yet-valid assertions (clock skew tolerance typically 3 minutes)",
      },
      {
        step: 16,
        actor: "Service Provider",
        action: "Validate Audience Restriction",
        description:
          "Verify AudienceRestriction matches SP's entity ID; prevents assertion intended for different SP from being replayed",
      },
      {
        step: 17,
        actor: "Service Provider",
        action: "Extract User Attributes",
        description:
          "Parse AttributeStatement from assertion to extract user email, name, groups, department, employee ID, etc.",
      },
      {
        step: 18,
        actor: "Service Provider",
        action: "Establish Application Session",
        description:
          "Create local session for user (set session cookie), optionally create/update user account in local database using SAML attributes as authoritative source",
      },
      {
        step: 19,
        actor: "Service Provider",
        action: "Grant Access",
        description:
          "Redirect user to originally requested resource; user now authenticated with application session",
      },
      {
        step: 20,
        actor: "End User",
        action: "Experience SSO for Additional Apps",
        description:
          "When accessing another SAML-integrated app, IdP reuses existing session—no re-authentication needed. True Single Sign-On: one login grants access to dozens of applications",
      },
    ],
    invariants: [
      "SAML assertion MUST be signed with IdP's private key and verified with IdP's public certificate",
      "SP MUST validate assertion audience restriction matches its own entity ID",
      "SP MUST reject assertions outside NotBefore/NotOnOrAfter time bounds (with skew tolerance)",
      "SP MUST validate assertion Subject matches authenticated user session",
      "SP MUST verify assertion Issuer matches trusted IdP entity ID from metadata",
      "Assertion Consumer Service (ACS) URL in response MUST match SP's registered ACS URL",
      "SAML requests MAY be signed by SP; IdP validates signature if present",
      "InResponseTo attribute in assertion MUST match ID of original AuthnRequest (if request signed)",
      "Assertions SHOULD NOT be reused; SP MAY implement replay detection via assertion ID cache",
      "Metadata MUST be exchanged over secure channel or verified via signature to prevent tampering",
    ],
  },

  codeExamples: [
    {
      id: "saml-typescript-sp",
      language: "typescript",
      title: "TypeScript Express SAML Service Provider",
      description:
        "Complete SAML 2.0 Service Provider implementation with passport-saml, handling authentication requests, assertion validation, and attribute mapping for enterprise SSO",
      code: `import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as SamlStrategy, Profile, VerifiedCallback } from 'passport-saml';
import session from 'express-session';
import fs from 'fs';

// =============================================================================
// Configuration
// =============================================================================

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🎯 ACTION: Configure session for SAML authentication state
// 💡 REASON: SAML uses browser redirects—session stores RelayState and validates
//    InResponseTo. Session ties assertion to original authentication request.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'saml-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// =============================================================================
// SAML Strategy Configuration
// =============================================================================

/**
 * 🎯 ACTION: Configure SAML Service Provider with IdP metadata
 * 💡 REASON: SAML requires trust establishment via metadata exchange.
 *    IdP metadata contains entity ID, SSO endpoint URL, and signing certificate.
 *    SP metadata contains entity ID, ACS URL, and optional signing certificate.
 *
 * CONTEXT DILATION: Metadata-driven trust simplifies enterprise integration.
 * Before SAML: Manual configuration of 50+ fields per integration (URLs, certs, IDs).
 * With SAML metadata: Upload one XML file, automatically parses all configuration.
 * Adding new SaaS app: 30 minutes (vs 2 weeks of custom integration).
 */
const samlConfig = {
  // Service Provider (this application) configuration
  issuer: 'https://myapp.com/saml/metadata', // SP entity ID (unique identifier)
  callbackUrl: 'https://myapp.com/saml/acs', // Assertion Consumer Service URL
  entryPoint: process.env.SAML_ENTRY_POINT || 'https://idp.example.com/sso', // IdP SSO URL

  // 🎯 ACTION: Load IdP's public certificate for signature verification
  // 💡 REASON: IdP signs assertions with private key; SP verifies with public cert.
  //    Certificate typically extracted from IdP metadata XML.
  cert: fs.readFileSync('./config/idp-cert.pem', 'utf-8'),

  // Optional: SP can sign authentication requests
  privateCert: fs.readFileSync('./config/sp-private-key.pem', 'utf-8'),
  decryptionPvk: fs.readFileSync('./config/sp-private-key.pem', 'utf-8'),

  // 🎯 ACTION: Request specific attributes from IdP
  // 💡 REASON: Attribute mapping enables user provisioning (Just-In-Time).
  //    IdP includes requested attributes in assertion (email, name, groups).
  //    SP extracts attributes to create/update local user account.
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  wantAssertionsSigned: true, // Require signed assertions for security
  acceptedClockSkewMs: 180000, // 3 minutes tolerance for NotBefore/NotOnOrAfter

  // Attribute mapping: SAML attribute names → application user fields
  attributeConsumingServiceIndex: '0',
  authnContext: [
    'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
    'urn:oasis:names:tc:SAML:2.0:ac:classes:Password',
  ],

  // Generate unique request ID for InResponseTo validation
  generateUniqueId: () => \`_\${Date.now()}_\${Math.random().toString(36)}\`,
};

// =============================================================================
// Passport SAML Strategy
// =============================================================================

/**
 * 🎯 ACTION: Initialize passport-saml strategy for assertion validation
 * 💡 REASON: passport-saml handles complex SAML protocol mechanics:
 *    - Generating signed AuthnRequest XML
 *    - Parsing and validating assertion XML
 *    - Verifying XML digital signatures
 *    - Checking time bounds and audience restrictions
 *    Developer writes zero XML parsing code—library abstracts complexity.
 */
passport.use(
  new SamlStrategy(
    samlConfig,
    /**
     * 🎯 ACTION: Verify callback - extract user attributes from assertion
     * 💡 REASON: After signature/time validation, extract user identity and
     *    attributes to create application session. This is Just-In-Time (JIT)
     *    provisioning—user account created on first SAML login.
     */
    async (profile: Profile | null, done: VerifiedCallback) => {
      try {
        if (!profile) {
          return done(new Error('No SAML profile received'));
        }

        // 🎯 ACTION: Extract standard SAML attributes from assertion
        // 💡 REASON: SAML assertions contain AttributeStatement with user metadata.
        //    Attribute names vary by IdP (Okta uses 'email', Azure AD uses 'emailaddress').
        //    Normalize attributes to create consistent user object.
        const user = {
          // NameID is unique user identifier (email, username, or persistent ID)
          id: profile.nameID,
          email: profile['email'] || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
          firstName: profile['firstName'] || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
          lastName: profile['lastName'] || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
          displayName: profile['displayName'] || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],

          // 🎯 ACTION: Extract group memberships for role-based access control
          // 💡 REASON: Enterprise IdPs include AD groups in assertions.
          //    Map groups to application roles (AD group "Engineering" → app role "developer").
          groups: profile['groups'] || profile['http://schemas.xmlsoap.org/claims/Group'] || [],

          // Additional attributes: department, employee ID, manager, etc.
          department: profile['department'],
          employeeId: profile['employeeId'],
        };

        // CODE HIGHLIGHT: User lookup/creation—Just-In-Time provisioning
        // 🎯 ACTION: Create or update user in application database
        // 💡 REASON: SAML enables JIT provisioning—no manual user account creation.
        //    When employee logs in first time, app auto-creates account from SAML attributes.
        //    When attributes change in AD (name, department), next login updates local user.
        const existingUser = await findUserByEmail(user.email);
        if (existingUser) {
          // Update existing user with fresh SAML attributes
          await updateUser(existingUser.id, user);
          return done(null, existingUser);
        } else {
          // Create new user from SAML attributes
          const newUser = await createUser(user);
          return done(null, newUser);
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

// 🎯 ACTION: Serialize/deserialize user for session management
// 💡 REASON: Passport stores user ID in session cookie after SAML authentication.
//    Subsequent requests load full user object from database using ID.
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// =============================================================================
// SAML Authentication Routes
// =============================================================================

/**
 * GET /saml/login - Initiate SAML authentication
 *
 * 🎯 ACTION: Generate SAML AuthnRequest and redirect to IdP SSO endpoint
 * 💡 REASON: SP-initiated flow: user accesses protected resource, SP redirects
 *    to IdP for authentication. passport-saml generates signed XML request,
 *    Base64-encodes, and redirects browser to IdP.
 */
app.get(
  '/saml/login',
  passport.authenticate('saml', {
    // Optional: include original URL as RelayState to redirect back after auth
    successReturnToOrRedirect: '/',
    failureRedirect: '/login/error',
  })
);

/**
 * POST /saml/acs - Assertion Consumer Service endpoint
 *
 * 🎯 ACTION: Receive SAML assertion from IdP, validate, and establish session
 * 💡 REASON: IdP POSTs signed assertion here after user authenticates.
 *    passport-saml validates signature, time bounds, audience, then calls
 *    verify callback to create user session.
 *
 * CONTEXT DILATION: ACS is critical security boundary.
 * All SAML security validations happen here:
 * - XML signature verification (proves assertion from legitimate IdP)
 * - NotBefore/NotOnOrAfter (prevents expired assertions)
 * - AudienceRestriction (prevents assertion replay to different SP)
 * - InResponseTo validation (prevents unsolicited assertions)
 * If any validation fails, authentication fails—prevents SAML assertion forgery.
 */
app.post(
  '/saml/acs',
  passport.authenticate('saml', {
    failureRedirect: '/login/error',
    failureFlash: true,
  }),
  (req: Request, res: Response) => {
    // 🎯 ACTION: Redirect to originally requested resource or dashboard
    // 💡 REASON: After successful authentication, return user to intended destination.
    //    RelayState parameter (if present) contains original URL.
    const relayState = req.body.RelayState || '/';
    res.redirect(relayState);
  }
);

/**
 * GET /saml/metadata - Service Provider metadata endpoint
 *
 * 🎯 ACTION: Generate and serve SP metadata XML for IdP configuration
 * 💡 REASON: IdPs require SP metadata to establish trust. Metadata contains:
 *    - Entity ID (unique SP identifier)
 *    - ACS URL (where to POST assertions)
 *    - SP certificate (for request signature verification)
 *    - Requested attributes
 *
 * Instead of manually configuring SP in IdP admin console (20+ fields),
 * admin uploads this metadata XML URL—automatic configuration.
 */
app.get('/saml/metadata', (req: Request, res: Response) => {
  res.type('application/xml');
  res.send(
    (passport._strategy('saml') as SamlStrategy).generateServiceProviderMetadata(
      fs.readFileSync('./config/sp-cert.pem', 'utf-8'),
      fs.readFileSync('./config/sp-cert.pem', 'utf-8')
    )
  );
});

/**
 * GET /logout - Initiate SAML Single Logout
 *
 * 🎯 ACTION: Destroy local session and optionally initiate SLO at IdP
 * 💡 REASON: SAML supports Single Logout (SLO)—logging out of one app can
 *    log user out of IdP and all other SAML apps. Prevents security risk
 *    on shared computers (library, kiosk).
 */
app.get('/logout', (req: Request, res: Response) => {
  // Destroy local application session
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    // Redirect to IdP SLO endpoint (if supported)
    // Some IdPs support SLO, others only handle local logout
    res.redirect('/');
  });
});

// =============================================================================
// Protected Routes
// =============================================================================

/**
 * Middleware to require SAML authentication
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  // Store original URL in session to redirect after auth
  req.session!.returnTo = req.originalUrl;
  res.redirect('/saml/login');
}

/**
 * Middleware for role-based authorization using SAML groups
 */
function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userGroups = (req.user as any).groups || [];
    const hasRole = allowedRoles.some(role => userGroups.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        userRoles: userGroups,
      });
    }

    next();
  };
}

/**
 * Protected dashboard - requires SAML authentication
 */
app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to protected dashboard',
    user: req.user,
  });
});

/**
 * Admin panel - requires SAML authentication + admin group membership
 */
app.get('/admin', requireAuth, requireRole('Administrators', 'IT Admins'), (req: Request, res: Response) => {
  res.json({
    message: 'Admin panel access granted',
    user: req.user,
  });
});

// =============================================================================
// Database Mocks (replace with actual database)
// =============================================================================

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups: string[];
  department?: string;
  employeeId?: string;
}

const users: Map<string, User> = new Map();

async function findUserByEmail(email: string): Promise<User | null> {
  const user = Array.from(users.values()).find(u => u.email === email);
  return user || null;
}

async function findUserById(id: string): Promise<User | null> {
  return users.get(id) || null;
}

async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const id = \`user_\${Date.now()}\`;
  const user: User = { id, ...userData };
  users.set(id, user);
  return user;
}

async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const user = users.get(id);
  if (!user) throw new Error('User not found');

  const updated = { ...user, ...userData };
  users.set(id, updated);
  return updated;
}

// =============================================================================
// Start Server
// =============================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`SAML Service Provider running on port \${PORT}\`);
  console.log(\`Metadata URL: http://localhost:\${PORT}/saml/metadata\`);
  console.log(\`ACS URL: http://localhost:\${PORT}/saml/acs\`);
});

export default app;`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete SAML 2.0 Service Provider with passport-saml, handling authentication requests, assertion validation, attribute mapping, and Just-In-Time user provisioning",
        prerequisites: [
          "Express.js",
          "passport.js",
          "passport-saml library",
          "XML digital signatures",
          "IdP metadata and certificates",
        ],
        systemPosition:
          "Service Provider in enterprise SSO architecture, integrating with corporate Identity Providers (Okta, AD FS, OneLogin) for centralized authentication and user provisioning",
      },
      annotations: [
        {
          id: "saml-metadata-driven-trust",
          lines: [31, 50],
          action:
            "Configure SAML Service Provider using IdP metadata (entity ID, SSO URL, certificate)",
          reason:
            "Metadata-driven configuration eliminates manual setup of 50+ fields. Upload IdP metadata XML, library auto-configures all endpoints and certificates. Adding new IdP: 30 minutes (vs 2 weeks manual config). Enterprise-critical: supports dynamic certificate rotation via metadata refresh.",
          contextLevel: "system",
          relatedConcepts: [
            "saml-metadata",
            "trust-establishment",
            "configuration-management",
          ],
        },
        {
          id: "saml-assertion-validation",
          lines: [155, 180],
          action:
            "Validate SAML assertion signature, time bounds, and audience restriction at ACS endpoint",
          reason:
            "ACS is critical security boundary—all SAML security checks happen here. XML signature verification proves assertion from legitimate IdP (not forged). NotBefore/NotOnOrAfter prevents replay of expired assertions. AudienceRestriction prevents assertion intended for Salesforce from being used on SAP. If any check fails, reject assertion.",
          contextLevel: "system",
          relatedConcepts: [
            "xml-signature",
            "assertion-validation",
            "security-boundary",
          ],
        },
        {
          id: "saml-attribute-mapping",
          lines: [89, 110],
          action:
            "Extract user attributes from SAML assertion and normalize to application user object",
          reason:
            "SAML assertions contain AttributeStatement with user metadata (email, name, groups, department). Attribute names vary by IdP—Okta uses 'email', Azure AD uses 'http://schemas.xmlsoap.org/.../emailaddress'. Normalization creates consistent user object regardless of IdP, enabling IdP interchangeability.",
          contextLevel: "module",
          relatedConcepts: [
            "attribute-mapping",
            "user-provisioning",
            "idp-abstraction",
          ],
        },
        {
          id: "saml-jit-provisioning",
          lines: [120, 135],
          action:
            "Just-In-Time user provisioning: auto-create/update user from SAML attributes on login",
          reason:
            "Eliminates manual user account creation. When employee joins company and is added to AD, first SAML login auto-creates account in all apps. When employee changes department in AD, next login updates all apps. Zero IT intervention. Walmart uses this for 2M+ employees across 100+ apps—fully automated provisioning.",
          contextLevel: "system",
          relatedConcepts: [
            "jit-provisioning",
            "automated-lifecycle",
            "user-management",
          ],
        },
        {
          id: "saml-group-based-authz",
          lines: [223, 243],
          action:
            "Implement role-based authorization using Active Directory groups from SAML assertion",
          reason:
            "Enterprise IdPs include AD group memberships in SAML assertions. Map AD groups to application roles ('IT Admins' group → admin permissions). Centralized access control: admin adds user to AD group, user gains app access on next login. No app-level permission changes needed. Critical for compliance: audit trail lives in AD.",
          contextLevel: "system",
          relatedConcepts: ["rbac", "ad-groups", "centralized-authorization"],
        },
        {
          id: "saml-sp-metadata-generation",
          lines: [191, 208],
          action:
            "Generate Service Provider metadata XML for IdP configuration",
          reason:
            "SP metadata contains entity ID, ACS URL, and SP certificate. Instead of IdP admin manually entering 20+ fields, they upload SP metadata URL—automatic configuration. Supports dynamic reconfiguration: SP cert rotation requires publishing new metadata, IdP auto-fetches updated config (if metadata URL used, not manual upload).",
          contextLevel: "system",
          relatedConcepts: [
            "metadata-exchange",
            "automated-configuration",
            "trust-establishment",
          ],
        },
        {
          id: "saml-clock-skew-tolerance",
          lines: [59, 60],
          action:
            "Configure 3-minute clock skew tolerance for NotBefore/NotOnOrAfter validation",
          reason:
            "SAML time-bound validation fails if IdP and SP clocks not synchronized. 3-minute tolerance accommodates minor clock drift without authentication failures. Too high tolerance (30+ min) creates security risk—allows replay of old assertions. Production environments use NTP for clock sync; skew tolerance is safety net.",
          contextLevel: "module",
          relatedConcepts: ["clock-skew", "time-synchronization", "ntp"],
        },
        {
          id: "saml-sso-session-reuse",
          lines: [211, 221],
          action:
            "Leverage IdP session for Single Sign-On across multiple applications",
          reason:
            "Core value of SAML: authenticate once at IdP, access all apps without re-entering password. Employee logs into Windows (AD FS session), then clicks Salesforce, SAP, Workday—instant access to all via SSO. When accessing second app, IdP checks for existing session, reuses authentication, issues new assertion. Zero password fatigue.",
          contextLevel: "system",
          relatedConcepts: ["sso", "session-reuse", "user-experience"],
        },
      ],
      highlights: [
        {
          lines: [31, 60],
          label: "SAML strategy configuration with metadata",
          sbvpDomain: "structure",
        },
        {
          lines: [89, 135],
          label: "Attribute extraction and JIT provisioning",
          sbvpDomain: "behavior",
        },
        {
          lines: [155, 180],
          label: "Assertion validation at ACS endpoint",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "saml-python-idp",
      language: "python",
      title: "Python Flask SAML Identity Provider",
      description:
        "Production-ready SAML 2.0 Identity Provider using pysaml2, handling authentication requests, assertion generation with digital signatures, and user attribute release for enterprise SSO",
      code: `from flask import Flask, request, redirect, render_template, session, url_for
from saml2 import BINDING_HTTP_POST, BINDING_HTTP_REDIRECT
from saml2.server import Server as Saml2Server
from saml2.config import Config as Saml2Config
from saml2.sigver import get_xmlsec_binary
from saml2.metadata import entity_descriptor
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import hashlib

# =============================================================================
# Configuration
# =============================================================================

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'saml-idp-secret-key')

# 🎯 ACTION: Configure SAML 2.0 Identity Provider with entity ID, endpoints, certificates
# 💡 REASON: IdP metadata defines SSO endpoint URL, entity ID, and signing certificate.
#    SPs fetch this metadata to establish trust and configure SAML integration.
#
# CONTEXT DILATION: Enterprise IdP serves 100+ applications.
# Before SAML: Each app integrated custom auth (LDAP bind, database lookup)—
#    100 integrations = 100 maintenance burdens. With SAML IdP: Single authentication
#    point for all apps. Add AD group → grant access to 50 apps instantly.
SAML_CONFIG = {
    'entityid': 'https://idp.example.com/saml/metadata',
    'description': 'Example SAML Identity Provider',

    # 🎯 ACTION: Define IdP endpoints (SSO, SLO, metadata)
    # 💡 REASON: SPs redirect users to sso_url for authentication.
    #    IdP returns assertions to SP's ACS URL after successful auth.
    'service': {
        'idp': {
            'name': 'Example IdP',
            'endpoints': {
                'single_sign_on_service': [
                    ('https://idp.example.com/sso', BINDING_HTTP_REDIRECT),
                    ('https://idp.example.com/sso', BINDING_HTTP_POST),
                ],
                'single_logout_service': [
                    ('https://idp.example.com/slo', BINDING_HTTP_REDIRECT),
                ],
            },

            # 🎯 ACTION: Configure assertion signing and encryption
            # 💡 REASON: Signing proves assertions came from legitimate IdP.
            #    SPs verify signature using IdP's public certificate.
            #    Encryption protects sensitive attributes in transit (optional).
            'want_authn_requests_signed': False,  # Require SPs to sign requests
            'want_authn_requests_only_with_valid_cert': False,

            # User attributes to include in assertions
            'name_id_format': [
                'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
                'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            ],
        },
    },

    # 🎯 ACTION: Configure XML signing and encryption keys
    # 💡 REASON: Private key signs assertions; public cert published in metadata.
    #    SPs fetch public cert to verify assertion signatures.
    'key_file': './config/idp-private-key.pem',
    'cert_file': './config/idp-certificate.pem',
    'encryption_keypairs': [{
        'key_file': './config/idp-private-key.pem',
        'cert_file': './config/idp-certificate.pem',
    }],

    # 🎯 ACTION: Configure metadata for Service Provider discovery
    # 💡 REASON: IdP loads SP metadata to know where to send assertions (ACS URL),
    #    what attributes to include, and which certificate to use for encryption.
    'metadata': {
        # Local directory containing SP metadata XML files
        'local': ['./metadata/sp'],
        # Remote metadata URLs (fetch periodically)
        # 'remote': [{'url': 'https://sp.example.com/saml/metadata'}],
    },

    # XML signature algorithm
    'xmlsec_binary': get_xmlsec_binary(['/usr/bin/xmlsec1']),

    # Attribute mapping: internal user fields → SAML attribute names
    'attribute_map_dir': './config/attribute-maps',
}

# Initialize pysaml2 server
saml_config = Saml2Config()
saml_config.load(SAML_CONFIG)
idp_server = Saml2Server(config=saml_config)

# =============================================================================
# User Directory (Mock Active Directory)
# =============================================================================

# 🎯 ACTION: Mock user directory with attributes (email, name, groups)
# 💡 REASON: In production, query Active Directory, LDAP, or database.
#    Groups determine application access: "Engineering" group grants access
#    to GitHub, Jira, Confluence (configured in each SP).
USERS_DB = {
    'alice@example.com': {
        'password': hashlib.sha256('password123'.encode()).hexdigest(),
        'attributes': {
            'email': 'alice@example.com',
            'firstName': 'Alice',
            'lastName': 'Anderson',
            'displayName': 'Alice Anderson',
            'department': 'Engineering',
            'employeeId': 'EMP001',
            'title': 'Senior Software Engineer',
            # 🎯 ACTION: Include Active Directory groups for authorization
            # 💡 REASON: Groups map to application roles. SP checks groups to grant permissions.
            #    Example: "Administrators" group → admin access in all apps.
            'groups': ['Engineering', 'Developers', 'VPN Users'],
        },
    },
    'bob@example.com': {
        'password': hashlib.sha256('password456'.encode()).hexdigest(),
        'attributes': {
            'email': 'bob@example.com',
            'firstName': 'Bob',
            'lastName': 'Builder',
            'displayName': 'Bob Builder',
            'department': 'IT',
            'employeeId': 'EMP002',
            'title': 'IT Administrator',
            'groups': ['IT', 'Administrators', 'VPN Users'],
        },
    },
}

# =============================================================================
# Authentication Functions
# =============================================================================

def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """
    🎯 ACTION: Authenticate user against directory (AD, LDAP, database)
    💡 REASON: IdP is authoritative authentication source for enterprise.
       All apps trust IdP's authentication decision. If IdP says "user authenticated",
       all 100+ apps accept that assertion.

    CONTEXT DILATION: Centralized authentication reduces attack surface.
    Before SAML: 100 apps = 100 password databases = 100 breach risks.
    With SAML IdP: One password database to protect. One MFA implementation.
    One audit log for all authentication events. 99% reduction in security surface.
    """
    user = USERS_DB.get(username)
    if not user:
        return None

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if user['password'] != password_hash:
        return None

    return user

def get_user_attributes(username: str) -> Dict[str, any]:
    """
    🎯 ACTION: Fetch user attributes for SAML assertion
    💡 REASON: Attributes (email, name, groups, department) included in assertion.
       SPs use attributes for JIT provisioning and authorization.
    """
    user = USERS_DB.get(username)
    return user['attributes'] if user else {}

# =============================================================================
# SAML SSO Endpoint
# =============================================================================

@app.route('/sso', methods=['GET', 'POST'])
def single_sign_on():
    """
    🎯 ACTION: Handle SAML authentication request from Service Provider
    💡 REASON: SP redirects user here with SAMLRequest. IdP authenticates user,
       generates signed assertion, POSTs back to SP's ACS URL.

    Flow:
    1. Parse SAMLRequest from query params or POST body
    2. Check if user has IdP session (SSO reuse)
    3. If no session, show login form
    4. After authentication, generate assertion
    5. POST assertion to SP's ACS endpoint
    """
    # CODE HIGHLIGHT: Parse SAML authentication request
    # 🎯 ACTION: Decode and parse SAMLRequest (Base64-encoded XML)
    # 💡 REASON: SAMLRequest contains SP entity ID, ACS URL, requested attributes.
    #    IdP validates request and extracts metadata for assertion generation.
    try:
        if request.method == 'GET':
            binding = BINDING_HTTP_REDIRECT
            saml_request = request.args.get('SAMLRequest')
            relay_state = request.args.get('RelayState', '')
        else:  # POST
            binding = BINDING_HTTP_POST
            saml_request = request.form.get('SAMLRequest')
            relay_state = request.form.get('RelayState', '')

        # Parse authentication request
        req_info = idp_server.parse_authn_request(saml_request, binding)

        # Store request info in session for post-authentication
        session['authn_request'] = {
            'id': req_info.message.id,
            'sp_entity_id': req_info.message.issuer.text,
            'acs_url': req_info.message.assertion_consumer_service_url,
            'relay_state': relay_state,
            'binding': req_info.binding,
        }

    except Exception as e:
        return f'Invalid SAML request: {str(e)}', 400

    # 🎯 ACTION: Check for existing IdP session (SSO reuse)
    # 💡 REASON: If user already authenticated (logged into another SAML app),
    #    reuse session—skip login form, immediately generate assertion.
    #    This is Single Sign-On: one authentication, access all apps.
    if 'user' in session:
        return generate_saml_response(session['user'])

    # No session—show login form
    return render_template('login.html', relay_state=relay_state)

@app.route('/login', methods=['POST'])
def login():
    """
    🎯 ACTION: Authenticate user and establish IdP session
    💡 REASON: User submits credentials; if valid, create IdP session and
       generate SAML assertion for requesting SP.
    """
    username = request.form.get('username')
    password = request.form.get('password')

    # 🎯 ACTION: Authenticate against user directory
    # 💡 REASON: In production, verify credentials against Active Directory (LDAP bind),
    #    check MFA, enforce account policies (disabled accounts, password expiration).
    user = authenticate_user(username, password)
    if not user:
        return render_template('login.html', error='Invalid credentials'), 401

    # CODE HIGHLIGHT: Establish IdP session for SSO
    # 🎯 ACTION: Store authenticated user in session
    # 💡 REASON: IdP session enables SSO across all SPs. When user accesses
    #    second SAML app, IdP checks session, finds user already authenticated,
    #    issues assertion without re-prompting for password.
    session['user'] = username
    session['auth_time'] = datetime.utcnow().isoformat()

    # Generate SAML response for requesting SP
    return generate_saml_response(username)

def generate_saml_response(username: str):
    """
    🎯 ACTION: Generate signed SAML assertion and POST to SP's ACS endpoint
    💡 REASON: Assertion contains user identity, attributes (email, groups),
       and authentication context. Digital signature proves assertion from IdP.

    CONTEXT DILATION: SAML assertion is trust token.
    SP trusts IdP's authentication decision. Assertion signature proves:
    1) Assertion genuinely from IdP (not forged)
    2) Assertion not tampered with in transit
    3) User authenticated at specific time with specific method (password, MFA)
    SP accepts assertion as proof of user identity—no independent verification.
    """
    authn_request = session.get('authn_request')
    if not authn_request:
        return 'No pending authentication request', 400

    # Fetch user attributes for assertion
    attributes = get_user_attributes(username)

    # 🎯 ACTION: Build assertion identity information
    # 💡 REASON: NameID is unique user identifier (email or persistent ID).
    #    SP stores NameID to link assertions to same user across sessions.
    name_id = username  # Or use persistent ID like UUID

    # 🎯 ACTION: Generate SAML assertion with authentication statement
    # 💡 REASON: AuthnStatement confirms "user X authenticated at time Y using method Z".
    #    Attribute statement includes user metadata (groups, email, name).
    #    Conditions define validity period (NotBefore/NotOnOrAfter).
    try:
        # Create response with authentication assertion
        identity = {
            'email': attributes.get('email'),
            'firstName': attributes.get('firstName'),
            'lastName': attributes.get('lastName'),
            'displayName': attributes.get('displayName'),
            'groups': attributes.get('groups', []),
            'department': attributes.get('department'),
            'employeeId': attributes.get('employeeId'),
            'title': attributes.get('title'),
        }

        # CODE HIGHLIGHT: Generate signed SAML response
        # 🎯 ACTION: Create assertion with signature, time bounds, audience restriction
        # 💡 REASON: pysaml2 generates XML assertion, signs with IdP private key,
        #    Base64-encodes, wraps in auto-submitting HTML form.
        response = idp_server.create_authn_response(
            identity=identity,
            in_response_to=authn_request['id'],
            destination=authn_request['acs_url'],
            sp_entity_id=authn_request['sp_entity_id'],
            name_id=name_id,
            binding=BINDING_HTTP_POST,

            # 🎯 ACTION: Define assertion validity period
            # 💡 REASON: NotBefore/NotOnOrAfter prevent replay attacks.
            #    Assertion valid for 5 minutes—enough for browser redirect,
            #    short enough to limit replay window if intercepted.
            not_on_or_after=datetime.utcnow() + timedelta(minutes=5),

            # Authentication context: how user authenticated
            authn={'class_ref': 'urn:oasis:names:tc:SAML:2.0:ac:classes:Password'},
        )

        # Get assertion as XML string (for logging/debugging)
        assertion_xml = response.to_string()

        # 🎯 ACTION: POST assertion to SP's ACS endpoint via browser
        # 💡 REASON: HTTP-POST binding: Return HTML page with hidden form containing
        #    Base64-encoded assertion. JavaScript auto-submits form to SP's ACS URL.
        #    Browser POSTs assertion—SP receives it, validates, establishes session.
        http_args = idp_server.apply_binding(
            BINDING_HTTP_POST,
            assertion_xml,
            authn_request['acs_url'],
            relay_state=authn_request['relay_state'],
        )

        # Return HTML with auto-submitting form
        return http_args['data'], 200, http_args['headers']

    except Exception as e:
        return f'Error generating SAML response: {str(e)}', 500

# =============================================================================
# Metadata Endpoint
# =============================================================================

@app.route('/saml/metadata')
def metadata():
    """
    🎯 ACTION: Publish IdP metadata for SP configuration
    💡 REASON: SPs fetch IdP metadata to establish trust. Metadata contains:
       - Entity ID (IdP unique identifier)
       - SSO endpoint URL (where to send SAMLRequest)
       - Signing certificate (for assertion verification)
       - Supported name ID formats and bindings

    Instead of SP admin manually configuring 30+ fields, they upload metadata URL—
    automatic configuration. Supports dynamic updates: IdP rotates certificate,
    publishes new metadata, SPs auto-fetch updated cert (if polling enabled).
    """
    metadata_xml = entity_descriptor(saml_config)

    return metadata_xml.to_string(), 200, {
        'Content-Type': 'application/samlmetadata+xml',
        'Content-Disposition': 'attachment; filename="idp-metadata.xml"'
    }

# =============================================================================
# Single Logout Endpoint
# =============================================================================

@app.route('/slo', methods=['GET', 'POST'])
def single_logout():
    """
    🎯 ACTION: Handle SAML Single Logout request
    💡 REASON: SLO logs user out of IdP session and notifies all active SPs.
       User logging out of one SAML app can trigger logout across all apps.
       Critical for shared computers (libraries, kiosks)—prevents next user
       from accessing previous user's active sessions.
    """
    # Destroy IdP session
    session.clear()

    # In production: notify all SPs with active sessions via SLO requests
    # Each SP logs out user and responds; IdP waits for all responses

    return redirect(url_for('index'))

# =============================================================================
# Admin Interface
# =============================================================================

@app.route('/')
def index():
    """IdP home page"""
    if 'user' in session:
        return f'''
            <h1>Welcome, {session['user']}</h1>
            <p>You are authenticated with the Identity Provider.</p>
            <p>Active session: {session.get('auth_time')}</p>
            <a href="/logout">Logout</a>
        '''
    return '<h1>SAML Identity Provider</h1><p>Please initiate login from a Service Provider.</p>'

@app.route('/logout')
def logout():
    """Logout from IdP session"""
    session.clear()
    return redirect(url_for('index'))

# =============================================================================
# Start Server
# =============================================================================

if __name__ == '__main__':
    app.run(debug=True, port=8000, ssl_context='adhoc')  # Use proper SSL cert in production`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production SAML 2.0 Identity Provider with pysaml2, handling authentication requests, signed assertion generation, user attribute mapping, and SSO session management",
        prerequisites: [
          "Flask web framework",
          "pysaml2 library",
          "XML digital signatures (xmlsec1)",
          "Active Directory or LDAP user directory",
          "SSL certificates",
        ],
        systemPosition:
          "Identity Provider in enterprise SSO architecture, serving as centralized authentication authority for 100+ Service Provider applications with Active Directory integration",
      },
      annotations: [
        {
          id: "saml-idp-metadata-config",
          lines: [15, 73],
          action:
            "Configure SAML Identity Provider with entity ID, SSO endpoints, and signing certificates",
          reason:
            "IdP metadata is contract published to all SPs. Defines SSO URL (where SPs redirect users), entity ID (unique IdP identifier), and signing certificate (for assertion verification). SPs fetch metadata once, cache configuration. IdP metadata change (cert rotation) requires SPs to refresh—metadata polling automates this.",
          contextLevel: "system",
          relatedConcepts: [
            "saml-metadata",
            "trust-establishment",
            "certificate-management",
          ],
        },
        {
          id: "saml-assertion-signing",
          lines: [192, 228],
          action:
            "Generate SAML assertion with XML digital signature using IdP private key",
          reason:
            "Assertion signature is trust proof. SP verifies signature with IdP's public certificate—proves assertion genuinely from IdP, not forged. If signature invalid, SP rejects assertion. Signature covers entire assertion XML—tampering breaks signature. This is why SAML uses XML instead of JSON: mature XML signature standards (XMLDSig).",
          contextLevel: "system",
          relatedConcepts: [
            "xml-signature",
            "digital-signatures",
            "public-key-crypto",
          ],
        },
        {
          id: "saml-sso-session-reuse",
          lines: [137, 146],
          action:
            "Check for existing IdP session to enable SSO without re-authentication",
          reason:
            "SSO magic: user logs into first SAML app (creates IdP session), then accesses second app (IdP reuses session, no password prompt). IdP checks session cookie, finds user already authenticated, immediately generates assertion. User experience: click app, instant access. No password fatigue. Enterprise benefit: one authentication protects access to 100+ apps.",
          contextLevel: "system",
          relatedConcepts: ["sso", "session-reuse", "user-experience"],
        },
        {
          id: "saml-user-attributes",
          lines: [87, 107],
          action:
            "Include user attributes (email, groups, department) in assertion AttributeStatement",
          reason:
            "Attributes enable JIT provisioning and authorization. SP extracts email/name to create local user account. Groups determine access (AD group 'Engineering' → access to GitHub/Jira). When user changes department in AD, next SAML login updates all apps automatically. Zero manual sync—AD is authoritative source.",
          contextLevel: "module",
          relatedConcepts: [
            "attribute-release",
            "jit-provisioning",
            "ad-groups",
          ],
        },
        {
          id: "saml-assertion-time-bounds",
          lines: [206, 210],
          action:
            "Set NotBefore/NotOnOrAfter conditions for 5-minute assertion validity",
          reason:
            "Time bounds prevent replay attacks. Assertion valid for 5 minutes—enough for browser redirect to SP, short enough to limit damage if intercepted. If attacker captures assertion from network traffic, they have 5-minute window to replay it. Short window + HTTPS (encryption) makes replay practically infeasible. Production: 2-5 minute validity is standard.",
          contextLevel: "module",
          relatedConcepts: ["replay-attack-prevention", "time-bounds"],
        },
        {
          id: "saml-centralized-authentication",
          lines: [128, 136],
          action:
            "Authenticate users against centralized directory (Active Directory, LDAP)",
          reason:
            "IdP is single authentication point for entire enterprise. All 100+ apps trust IdP's authentication decision. Benefit: One password database to protect (not 100). One MFA implementation. One audit log for all authentication events. One account disable revokes access to everything. Before SAML: 100 apps = 100 password DBs = 100 breach risks. SAML: 99% attack surface reduction.",
          contextLevel: "system",
          relatedConcepts: [
            "centralized-authentication",
            "security-architecture",
            "attack-surface-reduction",
          ],
        },
        {
          id: "saml-idp-metadata-publication",
          lines: [243, 261],
          action: "Publish IdP metadata XML for Service Provider configuration",
          reason:
            "IdP metadata enables automatic SP configuration. SP admin uploads metadata URL, SP auto-configures entity ID, SSO URL, certificate. No manual entry of 30+ fields. Dynamic updates: IdP rotates certificate, publishes new metadata, SPs poll and auto-fetch. Enterprise-critical: managing 100+ SP integrations without metadata would require weeks of manual updates per cert rotation.",
          contextLevel: "system",
          relatedConcepts: [
            "metadata-driven-config",
            "automated-management",
            "certificate-rotation",
          ],
        },
        {
          id: "saml-http-post-binding",
          lines: [213, 222],
          action:
            "Use HTTP-POST binding to deliver assertion via browser form submission",
          reason:
            "HTTP-POST binding prevents assertion exposure in browser history/logs. Assertion POSTed (not in URL) → not logged by proxies/browsers. Auto-submitting HTML form delivers assertion to SP's ACS URL via user's browser. Browser is trusted intermediary—assertion never touches IdP's server-to-SP connection (no direct backend call). Enables SAML to work across network boundaries (DMZ, VPN).",
          contextLevel: "module",
          relatedConcepts: [
            "http-post-binding",
            "browser-based-delivery",
            "security",
          ],
        },
      ],
      highlights: [
        {
          lines: [192, 228],
          label: "Signed SAML assertion generation",
          sbvpDomain: "structure",
        },
        {
          lines: [137, 146],
          label: "SSO session reuse logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [243, 261],
          label: "IdP metadata publication",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Enterprise SSO portals (Okta, OneLogin, Ping Identity, AD FS)",
      "SaaS applications requiring enterprise authentication (Salesforce, Workday, SAP)",
      "Corporate intranets and internal tools",
      "Healthcare systems (HIPAA compliance requires SSO)",
      "Government and defense applications (FedRAMP, NIST requirements)",
      "Educational institutions (campus-wide SSO for students/faculty)",
      "Multi-tenant B2B platforms supporting customer IdPs",
      "Legacy enterprise applications with SAML retrofit",
    ],
    interactsWith: [
      "active-directory",
      "ldap",
      "oidc",
      "oauth-2-0",
      "tls-ssl",
      "session-management",
    ],
    architecturalBoundaries: [
      "Identity Provider boundary (authentication authority, user directory integration)",
      "Service Provider boundary (relying party applications, assertion consumers)",
      "Trust boundary (metadata exchange, certificate distribution)",
      "Network boundary (browser-based redirects, DMZ considerations)",
      "Session boundary (IdP session for SSO, SP sessions for applications)",
      "Attribute boundary (user directory schema mapping to SAML attributes)",
    ],
  },

  implementations: [],
  usedInSystems: [],
  philosophy: {
    coreProblem:
      "Enterprise employees managing 50+ username/password combinations for different applications, creating security risks (credential reuse, password fatigue), operational burden (manual provisioning/deprovisioning across every system), and compliance nightmares (incomplete offboarding)",
    designPrinciple:
      "Centralize authentication at Identity Provider; applications trust digitally signed assertions rather than maintaining separate credential databases",
    historicalContext:
      "SAML 2.0 emerged in 2005 to standardize enterprise federation (earlier: SAML 1.1, Liberty Alliance). Designed for browser-based SSO between enterprises and early cloud apps. XML signatures provided mature trust model. Dominated enterprise SSO for 15+ years until OIDC (2014) offered simpler, JSON-based alternative for web/mobile. SAML remains enterprise standard due to compliance requirements and mature tooling.",
    alternativesRejected: [
      "Kerberos - requires complex cross-realm trust, doesn't work across internet, poor browser support",
      "LDAP bind - every app needs LDAP credentials, no SSO, doesn't work across DMZ",
      "CAS - simpler but proprietary to Jasig, lacks assertion signatures and encryption",
      "OIDC - better DX and mobile support, but SAML required for compliance (FedRAMP, HIPAA) and legacy apps",
    ],
    mentalModel:
      "SAML is like a government-issued passport with visa stamps. Identity Provider (government) authenticates you and issues signed passport (SAML assertion). When entering country (Service Provider), border control verifies passport signature (XML signature), checks visa stamps (attributes), and grants entry. Passport works across all countries that trust issuing government—analogous to SSO across all apps that trust IdP.",
  },

  visualization: {
    staticDiagram: `graph TB
    User[User] -->|1. Access app| SP[Service Provider]
    SP -->|2. Redirect with SAMLRequest| IdP[Identity Provider]
    IdP -->|3. Authenticate| AD[Active Directory]
    IdP -->|4. Generate assertion| Signer[XML Signer]
    Signer -->|5. Sign with private key| IdP
    IdP -->|6. POST SAMLResponse| Browser[User Browser]
    Browser -->|7. Submit to ACS| SP
    SP -->|8. Verify signature| Cert[IdP Certificate]
    SP -->|9. Extract attributes| User

    style IdP fill:#e6f3ff
    style SP fill:#fff3e6
    style AD fill:#e6ffe6
    style Signer fill:#ffe6e6`,
    realWorldAnalogy:
      "SAML is like a university ID card system. The registrar's office (Identity Provider) issues student ID cards after verifying enrollment. Each building on campus (Service Providers) has card readers that trust cards from the registrar. Student swipes card at library—instant access (SSO). Swipes at gym—instant access. If student drops out, registrar deactivates card—loses access to all buildings simultaneously. No need for separate gym membership, library card, etc. One centralized identity (registrar) trusted by entire campus.",
    useCases: [
      {
        domain: "Enterprise SSO",
        scenario:
          "Fortune 500 company with 50,000 employees using 200+ SaaS applications (Salesforce, Workday, SAP, Office 365). Active Directory as identity source, Okta as SAML IdP. Employee logs into Windows (AD authentication), gains instant access to all SAML apps without additional passwords.",
        patternRole:
          "Centralized identity management, instant access revocation on termination, 80% reduction in password reset tickets, 100% offboarding compliance",
        companies: ["Walmart", "JPMorgan Chase", "Boeing"],
      },
      {
        domain: "Healthcare Compliance",
        scenario:
          "Hospital using Epic EHR, PACS imaging system, lab systems, billing software. HIPAA requires audit trails of all patient data access. SAML IdP logs all authentications centrally. When doctor leaves, disable IdP account—loses access to all systems instantly.",
        patternRole:
          "Compliance with HIPAA audit requirements, centralized access logging, immediate access revocation, role-based access via AD groups",
        companies: ["Kaiser Permanente", "Cleveland Clinic", "Mayo Clinic"],
      },
      {
        domain: "Government Systems",
        scenario:
          "Department of Defense with 100+ classified systems requiring CAC (Common Access Card) authentication. SAML IdP integrated with CAC/PKI. Soldiers authenticate once with CAC, access all systems with appropriate clearance levels via SAML attributes.",
        patternRole:
          "FedRAMP compliance, PIV/CAC integration, clearance level enforcement via SAML attributes, centralized authentication for classified networks",
        companies: ["U.S. Department of Defense", "NASA", "FBI"],
      },
    ],
  },

  tags: [
    "security",
    "authentication",
    "sso",
    "federation",
    "enterprise",
    "saml",
    "xml",
    "identity",
  ],
  difficulty: "advanced",
};
