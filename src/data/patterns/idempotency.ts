import type { Pattern } from "../schema";

export const idempotency: Pattern = {
  id: "idempotency",
  slug: "idempotency",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 📦 Batching → 🔑 Idempotency",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Batching",
    level: 4,
  },

  concept: {
    name: "Idempotency",
    emoji: "🔑",
    tagline: "Same input → same output",
    definition:
      "Idempotency is a property where an operation produces the same result regardless of how many times it's executed with the same parameters. An idempotent API endpoint can be called repeatedly with identical requests without causing unintended side effects beyond the first call—subsequent calls return the same response as the initial request but don't modify system state further. This is critical for building resilient distributed systems where network failures, timeouts, or client retries might cause duplicate requests. The pattern uses idempotency keys (unique request identifiers) to detect and deduplicate repeated operations. When a payment API receives a request with key 'pay_123abc', it processes it once; if another request arrives with the same key, it returns the cached result instead of charging twice. HTTP methods like GET, PUT, and DELETE are naturally idempotent (repeated GETs return same data, repeated PUTs set same value), while POST is not (multiple POSTs create multiple resources). Implementing idempotency requires storing request keys with their results for a time window (typically 24 hours), trading storage for correctness guarantees that enable safe automatic retries.",
    problemSolved:
      "In distributed systems, network failures and timeouts create uncertainty—did the request succeed or fail? Without idempotency, clients can't safely retry failed operations because retries might duplicate actions: charging a customer twice, creating duplicate orders, or double-incrementing counters. Traditional solutions like \"retry only once\" fail when that retry also fails, while \"don't retry\" sacrifices availability. Idempotency solves this by making retries safe—clients can retry indefinitely until receiving confirmation, knowing duplicate requests won't cause duplicate effects. Consider a payment timeout: without idempotency, the client doesn't know if payment processed—retrying risks double-charge, not retrying risks incomplete order. With idempotency keys, the client retries with the same key; if payment succeeded, retry returns the original result; if failed, retry executes the payment. This eliminates the false choice between correctness and availability, enabling aggressive retry strategies that improve system resilience. Critical for financial transactions, order processing, infrastructure operations (create VM), and any state-changing operation where duplicates cause data corruption or financial loss.",
    tradeoffs: {
      pros: [
        "Enables safe automatic retries—clients can retry indefinitely without side effects",
        "Eliminates duplicate operations in distributed systems with unreliable networks",
        "Simplifies client logic—no need to track request state or implement complex retry logic",
        "Improves system availability by allowing aggressive retry policies",
        "Provides at-most-once delivery semantics even with at-least-once messaging",
        "Protects against financial errors like double-charging or duplicate orders",
      ],
      cons: [
        "Requires storage for idempotency keys and results (memory or database overhead)",
        "Adds latency for key lookup on every request (cache hit or DB query)",
        "Needs key expiration policy—too short breaks retry safety, too long wastes storage",
        "Complicates API design—clients must generate and include idempotency keys",
        "Not all operations are naturally idempotent (requires careful implementation)",
        "Key collisions from non-unique keys can cause unintended deduplication",
      ],
    },
    relatedPatterns: [
      "retry",
      "exactly-once-delivery",
      "dedup-queue",
      "singleflight",
      "circuit-breaker",
      "timeout",
      "exponential-backoff",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client",
        role: "Request Originator",
        responsibilities: [
          "Generate unique idempotency key for each logical operation",
          "Include idempotency key in request headers or payload",
          "Reuse same key when retrying failed requests",
          "Handle idempotent responses (202 for processing, 200 for completed)",
          "Implement retry logic with exponential backoff",
        ],
      },
      {
        name: "Idempotency Store",
        role: "Request Deduplication",
        responsibilities: [
          "Store idempotency keys with operation status (pending, completed, failed)",
          "Cache operation results for completed requests",
          "Provide fast key lookup (typically in-memory cache or Redis)",
          "Expire old keys after time window (e.g., 24 hours)",
          "Handle concurrent requests with same key (locking or optimistic concurrency)",
        ],
      },
      {
        name: "Request Handler",
        role: "Operation Executor",
        responsibilities: [
          "Extract idempotency key from request",
          "Check store for existing key before processing",
          "Execute operation only if key is new",
          "Store result with key after completion",
          "Return cached result for duplicate requests",
        ],
      },
      {
        name: "Backend Service",
        role: "State Manager",
        responsibilities: [
          "Perform actual state-changing operation (payment, order creation, etc.)",
          "Ensure operation is transactional with idempotency store update",
          "Generate consistent results for same inputs",
          "Handle partial failures gracefully",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant H as Handler
    participant S as Idempotency Store
    participant B as Backend Service

    Note over C: Generate unique key
    C->>C: key = "pay_abc123"

    Note over C: First request
    C->>H: POST /payment (key: pay_abc123, amount: $100)
    H->>S: Check if key exists
    S-->>H: Not found (new request)

    H->>S: Store(key, status: PENDING)
    H->>B: Process payment($100)
    B-->>H: Success (transaction_id: tx_456)

    H->>S: Store(key, status: COMPLETED, result: tx_456)
    H-->>C: 200 OK {transaction_id: tx_456}

    Note over C: Request timeout/network error
    Note over C: Retry with same key

    C->>H: POST /payment (key: pay_abc123, amount: $100)
    H->>S: Check if key exists
    S-->>H: Found! Status: COMPLETED, Result: tx_456

    Note over H: Skip processing, return cached result
    H-->>C: 200 OK {transaction_id: tx_456} (idempotent)

    Note over C,B: No duplicate payment—idempotency prevents double-charge

    style C fill:#d7ffd7
    style S fill:#ffd7d7
    style H fill:#d7e3ff
    style B fill:#ffe4d7`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Generate idempotency key",
        description:
          "Create unique key (UUID, hash of request, or client-generated ID)",
      },
      {
        step: 2,
        actor: "Client",
        action: "Send request with key",
        description: "Include key in Idempotency-Key header or request body",
      },
      {
        step: 3,
        actor: "Request Handler",
        action: "Extract idempotency key",
        description: "Parse key from request and validate format",
      },
      {
        step: 4,
        actor: "Request Handler",
        action: "Check idempotency store",
        description: "Query store for existing key to detect duplicate request",
      },
      {
        step: 5,
        actor: "Idempotency Store",
        action: "Return key status",
        description:
          "NONE (new), PENDING (processing), COMPLETED (done), FAILED (error)",
      },
      {
        step: 6,
        actor: "Request Handler",
        action: "Handle based on status",
        description:
          "NONE→process, PENDING→wait/return 202, COMPLETED→return result, FAILED→retry or fail",
      },
      {
        step: 7,
        actor: "Request Handler",
        action: "Mark request as pending",
        description:
          "Store key with PENDING status to handle concurrent duplicates",
      },
      {
        step: 8,
        actor: "Backend Service",
        action: "Execute operation",
        description: "Perform state-changing operation (payment, order, etc.)",
      },
      {
        step: 9,
        actor: "Request Handler",
        action: "Store result with key",
        description: "Update store with COMPLETED status and operation result",
      },
      {
        step: 10,
        actor: "Request Handler",
        action: "Return response to client",
        description: "Send result with 200 OK (or appropriate status code)",
      },
      {
        step: 11,
        actor: "Client",
        action: "Retry on failure",
        description: "If timeout/error, retry with same key",
      },
      {
        step: 12,
        actor: "Request Handler",
        action: "Return cached result",
        description:
          "Detect duplicate key, skip processing, return original result",
      },
    ],
    invariants: [
      "Same idempotency key must always produce same result (deterministic operations)",
      "Idempotency key must be unique per logical operation (not per retry)",
      "Store updates and business operation must be atomic (transaction boundary)",
      "Completed operation results must be cached for full retry window",
      "Concurrent requests with same key must serialize (only one executes)",
      "Idempotency keys must expire after safe retry window (typically 24 hours)",
    ],
  },

  codeExamples: [
    {
      id: "idempotency-payment-api",
      language: "typescript",
      title: "Payment API with Idempotency",
      description:
        "Express API endpoint implementing idempotency for payment processing using Redis for key storage",
      code: `import express from 'express';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

// ACTION: Define idempotency status enum
// REASON: Track request lifecycle states for deduplication logic
enum IdempotencyStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface IdempotencyRecord {
  status: IdempotencyStatus;
  result?: any;
  error?: string;
  createdAt: number;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  description: string;
}

// ACTION: Create Redis client for idempotency store
// REASON: Fast in-memory storage for key lookup with TTL support
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const app = express();
app.use(express.json());

// ACTION: Middleware to validate idempotency key
// REASON: Ensure all requests include valid key for deduplication
function requireIdempotencyKey(req: any, res: any, next: any): void {
  const key = req.headers['idempotency-key'];

  if (!key || typeof key !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid Idempotency-Key header',
    });
  }

  // ACTION: Validate key format (UUID recommended)
  // REASON: Prevent key collisions and enforce client-side uniqueness
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(key)) {
    return res.status(400).json({
      error: 'Idempotency-Key must be a valid UUIDv4',
    });
  }

  req.idempotencyKey = key;
  next();
}

// ACTION: Get idempotency record from Redis
// REASON: Check if request already processed to enable deduplication
async function getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
  const data = await redis.get(\`idempotency:\${key}\`);
  return data ? JSON.parse(data) : null;
}

// ACTION: Store idempotency record in Redis with TTL
// REASON: Cache results for retry window, expire old keys to free storage
async function setIdempotencyRecord(
  key: string,
  record: IdempotencyRecord,
  ttlSeconds = 86400 // 24 hours
): Promise<void> {
  await redis.setEx(
    \`idempotency:\${key}\`,
    ttlSeconds,
    JSON.stringify(record)
  );
}

// ACTION: Simulate payment processing with Stripe API
// REASON: Demonstrate real-world use case requiring idempotency
async function processPayment(request: PaymentRequest): Promise<any> {
  // ACTION: Simulate network latency and processing time
  // REASON: Real payment gateways take time—tests idempotency under load
  await new Promise(resolve => setTimeout(resolve, 1000));

  // ACTION: Generate unique transaction ID
  // REASON: Each successful payment needs distinct identifier for reconciliation
  const transactionId = \`tx_\${uuidv4()}\`;

  console.log(\`Processing payment: \${request.amount} \${request.currency} for customer \${request.customerId}\`);

  // ACTION: Return payment result
  // REASON: Client needs transaction ID and status for confirmation
  return {
    transactionId,
    status: 'succeeded',
    amount: request.amount,
    currency: request.currency,
    customerId: request.customerId,
    processedAt: new Date().toISOString(),
  };
}

// ACTION: Implement idempotent payment endpoint
// REASON: Enable safe retries for critical financial operations
app.post('/api/payments', requireIdempotencyKey, async (req: any, res: any) => {
  const key = req.idempotencyKey;
  const paymentRequest: PaymentRequest = req.body;

  try {
    // ACTION: Check if request already processed
    // REASON: First line of defense against duplicate operations
    const existing = await getIdempotencyRecord(key);

    if (existing) {
      // ACTION: Handle based on current status
      // REASON: Different states require different responses
      switch (existing.status) {
        case IdempotencyStatus.COMPLETED:
          // ACTION: Return cached successful result
          // REASON: Skip processing, prevent duplicate payment
          console.log(\`Idempotent request detected for key \${key}, returning cached result\`);
          return res.status(200).json(existing.result);

        case IdempotencyStatus.PENDING:
          // ACTION: Request still processing, return 202 Accepted
          // REASON: Client should poll or wait, avoid concurrent processing
          console.log(\`Concurrent request for key \${key}, still pending\`);
          return res.status(202).json({
            message: 'Request is being processed',
            retryAfter: 5, // Seconds
          });

        case IdempotencyStatus.FAILED:
          // ACTION: Previous attempt failed, allow retry with new execution
          // REASON: Transient failures should be retryable
          console.log(\`Previous request for key \${key} failed, retrying\`);
          break;
      }
    }

    // ACTION: Mark request as pending
    // REASON: Prevent concurrent requests with same key from double-executing
    await setIdempotencyRecord(key, {
      status: IdempotencyStatus.PENDING,
      createdAt: Date.now(),
    });

    // ACTION: Execute payment processing
    // REASON: New request, perform actual state-changing operation
    const result = await processPayment(paymentRequest);

    // ACTION: Store completed result with key
    // REASON: Cache for future duplicate requests
    await setIdempotencyRecord(key, {
      status: IdempotencyStatus.COMPLETED,
      result,
      createdAt: Date.now(),
    });

    // ACTION: Return successful payment response
    // REASON: Client receives confirmation and can retry safely if this is lost
    res.status(200).json(result);

  } catch (error: any) {
    console.error(\`Payment failed for key \${key}:\`, error);

    // ACTION: Store failure status
    // REASON: Allow future retries but track failure for monitoring
    await setIdempotencyRecord(key, {
      status: IdempotencyStatus.FAILED,
      error: error.message,
      createdAt: Date.now(),
    }, 3600); // Shorter TTL for failures (1 hour)

    res.status(500).json({
      error: 'Payment processing failed',
      message: error.message,
    });
  }
});

// ACTION: Client example with retry logic
// REASON: Demonstrate safe retry pattern enabled by idempotency
async function makePaymentWithRetry(payment: PaymentRequest, maxRetries = 3): Promise<any> {
  // ACTION: Generate idempotency key once for logical operation
  // REASON: Same key for all retries ensures deduplication
  const idempotencyKey = uuidv4();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(\`Payment attempt \${attempt} with key: \${idempotencyKey}\`);

      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ACTION: Reuse same idempotency key for retries
          // REASON: Server will deduplicate, preventing double-charge
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payment),
      });

      if (response.status === 202) {
        // ACTION: Request pending, wait and retry
        // REASON: Concurrent request or slow processing
        console.log('Request pending, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${await response.text()}\`);
      }

      // ACTION: Success! Return result
      // REASON: Payment confirmed, no need to retry further
      return await response.json();

    } catch (error: any) {
      console.error(\`Attempt \${attempt} failed:\`, error.message);

      if (attempt === maxRetries) {
        throw new Error(\`Payment failed after \${maxRetries} attempts: \${error.message}\`);
      }

      // ACTION: Exponential backoff before retry
      // REASON: Give transient failures time to resolve
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(\`Retrying in \${delayMs}ms...\`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

app.listen(3000, () => console.log('Payment API listening on port 3000'));`,
      contextDilation: {
        scope: "module",
        dilation: 3,
        prerequisites: [
          "Express.js middleware pattern",
          "Redis for caching",
          "HTTP status codes (200, 202, 400, 500)",
          "Retry strategies with exponential backoff",
        ],
        systemPosition:
          "API gateway layer handling payment requests from clients, forwarding to payment gateway",
      },
      annotations: [
        {
          startLine: 6,
          endLine: 10,
          action: "Define idempotency status states",
          reason: "Track request lifecycle to handle duplicates correctly",
          highlightedConcepts: ["structure"],
        },
        {
          startLine: 31,
          endLine: 49,
          action: "Validate idempotency key format",
          reason:
            "Enforce UUIDv4 to prevent collisions and ensure client uniqueness",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 101,
          endLine: 123,
          action: "Check existing record and handle status",
          reason:
            "Deduplication logic—return cached result or allow retry based on status",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 126,
          endLine: 130,
          action: "Mark as PENDING before processing",
          reason: "Prevent concurrent duplicate requests from both executing",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 165,
          endLine: 168,
          action: "Generate idempotency key once",
          reason:
            "Same key for all retry attempts ensures server-side deduplication",
          highlightedConcepts: ["behavior"],
        },
      ],
      highlights: [
        {
          concept: "structure",
          description:
            "Three-state model: PENDING, COMPLETED, FAILED with transitions",
        },
        {
          concept: "behavior",
          description:
            "Idempotency key lookup before processing prevents duplicates",
        },
        {
          concept: "behavior",
          description: "Client reuses same key across retries for safe retry",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      {
        scenario: "Payment processing API",
        placement:
          "Between client application and payment gateway to prevent duplicate charges",
        reasoning:
          "Network timeouts during payment processing create uncertainty—idempotency makes retries safe",
      },
      {
        scenario: "Order creation service",
        placement:
          "Within order management microservice to prevent duplicate orders from retries",
        reasoning:
          "Client retries on timeout might create multiple orders without idempotency protection",
      },
      {
        scenario: "Infrastructure provisioning",
        placement:
          "API layer for creating cloud resources (VMs, databases) to prevent duplicate creation",
        reasoning:
          "Provisioning operations are expensive—duplicate VMs from retries waste money",
      },
    ],
    interactsWith: [
      "Redis or distributed cache for idempotency key storage",
      "API gateways and load balancers that may retry requests",
      "Message queues with at-least-once delivery guarantees",
      "Payment gateways (Stripe, PayPal) requiring transaction deduplication",
    ],
    architecturalBoundaries: [
      "Requires distributed consensus for multi-region deployments (same key same region)",
      "Key storage must be transactionally consistent with business operation",
      "Doesn't prevent logical duplicates from different keys (client must generate unique keys)",
      "Effectiveness depends on key expiration window—too short breaks safety",
    ],
  },
};
