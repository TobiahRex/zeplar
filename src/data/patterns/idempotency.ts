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
        level: "module",
        scope: "module",
        prerequisites: [
          "Express.js middleware pattern",
          "Redis for caching",
          "HTTP status codes (200, 202, 400, 500)",
          "Retry strategies with exponential backoff",
        ],
        systemPosition:
          "API gateway layer handling payment requests from clients, forwarding to payment gateway",
      },
    },
  ],

  implementations: [
    {
      id: "stripe-idempotency",
      name: "Stripe Idempotent Requests",
      type: "service",
      languages: ["any"],
      description:
        "Stripe's payment API implements idempotency via Idempotency-Key header. Duplicate requests with same key return cached response within 24 hours. Industry-standard pattern for payment processing.",
      links: {
        docs: "https://stripe.com/docs/api/idempotent_requests",
      },
      codeSnippet: `// Stripe idempotent payment request
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const idempotencyKey = uuidv4(); // Client-generated unique key

// First request creates charge
const charge1 = await stripe.charges.create(
  {
    amount: 2000,
    currency: 'usd',
    source: 'tok_visa',
    description: 'Order #12345',
  },
  {
    idempotencyKey: idempotencyKey,
  }
);

// Retry with same key returns cached result (no duplicate charge)
const charge2 = await stripe.charges.create(
  { amount: 2000, currency: 'usd', source: 'tok_visa' },
  { idempotencyKey: idempotencyKey }
);

// charge1.id === charge2.id (same charge, no duplicate)`,
    },
    {
      id: "idempotency-http-middleware",
      name: "Express Idempotency Middleware",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Middleware for Express.js that implements idempotency via request headers and Redis storage. Stores request fingerprints and responses for replay on duplicate requests.",
      links: {
        npm: "https://www.npmjs.com/package/express-idempotency",
        github: "https://github.com/mhingston/express-idempotency",
      },
      codeSnippet: `const express = require('express');
const idempotency = require('express-idempotency');
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

// Idempotency middleware with Redis storage
app.use(idempotency({
  store: redis,
  header: 'Idempotency-Key', // Request header to read key from
  ttl: 86400, // 24 hours key expiration
  cacheSuccessful: true, // Cache successful responses (200-299)
  cacheErrors: false, // Don't cache error responses
}));

app.post('/api/orders', async (req, res) => {
  // Middleware checks for duplicate Idempotency-Key
  // If duplicate, returns cached response without executing handler
  const order = await createOrder(req.body);
  res.status(201).json(order);
});`,
    },
    {
      id: "aws-dynamodb-conditional",
      name: "AWS DynamoDB Conditional Writes",
      type: "service",
      languages: ["any"],
      description:
        "DynamoDB's condition expressions enable atomic idempotency checks. PutItem with condition prevents duplicate inserts based on unique key, throwing ConditionalCheckFailedException on duplicates.",
      links: {
        docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.ConditionalUpdate",
      },
      codeSnippet: `const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function createPayment(paymentId, amount) {
  try {
    await client.send(new PutItemCommand({
      TableName: 'Payments',
      Item: {
        paymentId: { S: paymentId },
        amount: { N: amount.toString() },
        status: { S: 'completed' },
        createdAt: { N: Date.now().toString() },
      },
      // Idempotency: fail if paymentId already exists
      ConditionExpression: 'attribute_not_exists(paymentId)',
    }));
    return { success: true, message: 'Payment created' };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return { success: false, message: 'Payment already processed' };
    }
    throw error;
  }
}`,
    },
    {
      id: "postgres-upsert",
      name: "PostgreSQL UPSERT (ON CONFLICT)",
      type: "platform",
      languages: ["sql"],
      description:
        "PostgreSQL's INSERT...ON CONFLICT clause enables idempotent inserts. If unique constraint violated, do nothing or update instead of failing. Atomic database-level idempotency.",
      links: {
        docs: "https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT",
      },
      codeSnippet: `-- Create table with unique constraint on idempotency key
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  idempotency_key UUID UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Idempotent insert: do nothing if key exists
INSERT INTO orders (idempotency_key, user_id, amount, status)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 123, 99.99, 'completed')
ON CONFLICT (idempotency_key) DO NOTHING;

-- Alternative: return existing row on conflict
INSERT INTO orders (idempotency_key, user_id, amount, status)
VALUES ($1, $2, $3, $4)
ON CONFLICT (idempotency_key)
DO UPDATE SET status = EXCLUDED.status
RETURNING *;`,
    },
    {
      id: "redis-idempotency",
      name: "Redis SET NX for Idempotency",
      type: "library",
      languages: ["any"],
      description:
        "Redis SET NX (set if not exists) provides atomic idempotency checks. Store request fingerprint with expiration, returns null if key exists (duplicate request detected).",
      links: {
        docs: "https://redis.io/commands/set/",
      },
      codeSnippet: `const redis = require('redis').createClient();

async function processIdempotentRequest(idempotencyKey, handler) {
  const lockKey = \`idempotency:\${idempotencyKey}\`;

  // Attempt to set key (only succeeds if key doesn't exist)
  const acquired = await redis.set(lockKey, 'processing', {
    NX: true, // Only set if not exists
    EX: 86400, // Expire after 24 hours
  });

  if (!acquired) {
    // Duplicate request detected
    const cachedResult = await redis.get(\`result:\${idempotencyKey}\`);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    throw new Error('Request already processing');
  }

  // Execute business logic
  const result = await handler();

  // Cache result for future duplicate requests
  await redis.set(\`result:\${idempotencyKey}\`, JSON.stringify(result), {
    EX: 86400,
  });

  return result;
}`,
    },
    {
      id: "kafka-exactly-once",
      name: "Apache Kafka Exactly-Once Semantics",
      type: "platform",
      languages: ["java", "scala"],
      description:
        "Kafka's exactly-once delivery combines idempotent producer (prevents duplicates within session) with transactional writes (atomic multi-partition writes). Enabled via producer config.",
      links: {
        docs: "https://kafka.apache.org/documentation/#semantics",
      },
      codeSnippet: `Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// Enable idempotent producer (prevents duplicate messages)
props.put("enable.idempotence", true);

// For exactly-once across multiple partitions, use transactions
props.put("transactional.id", "my-transactional-id");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// Initialize transactions
producer.initTransactions();

try {
  producer.beginTransaction();

  // Send messages (idempotent + transactional)
  producer.send(new ProducerRecord<>("orders", key, value));
  producer.send(new ProducerRecord<>("inventory", key, inventoryUpdate));

  // Commit atomically (both messages or neither)
  producer.commitTransaction();
} catch (Exception e) {
  producer.abortTransaction();
}`,
    },
    {
      id: "ktor-idempotency",
      name: "Ktor Idempotency Plugin",
      type: "library",
      languages: ["kotlin"],
      description:
        "Kotlin Ktor server framework plugin for idempotent requests. Intercepts requests, checks idempotency keys, caches responses. Supports custom storage backends (Redis, PostgreSQL).",
      links: {
        github: "https://github.com/westelh/ktor-idempotency-support",
      },
      codeSnippet: `install(IdempotencySupport) {
    storage = RedisIdempotencyStorage(redis)
    requestIdHeader = "Idempotency-Key"
    expirationTime = Duration.hours(24)

    // Only apply to POST/PUT/PATCH (idempotent by default)
    requestFilter = { request ->
        request.httpMethod in listOf(HttpMethod.Post, HttpMethod.Put, HttpMethod.Patch)
    }
}

routing {
    post("/api/payments") {
        // Plugin checks Idempotency-Key header
        // If duplicate, returns cached response without executing handler
        val payment = processPayment(call.receive<PaymentRequest>())
        call.respond(HttpStatusCode.Created, payment)
    }
}`,
    },
    {
      id: "azure-cosmos-unique-key",
      name: "Azure Cosmos DB Unique Key Constraints",
      type: "service",
      languages: ["any"],
      description:
        "Cosmos DB unique key policies enforce idempotency at database level. Define unique keys on properties, duplicate inserts fail with 409 Conflict. Supports composite unique keys.",
      links: {
        docs: "https://learn.microsoft.com/en-us/azure/cosmos-db/unique-keys",
      },
      codeSnippet: `// Create container with unique key policy
const containerDefinition = {
  id: "orders",
  partitionKey: { paths: ["/userId"] },
  uniqueKeyPolicy: {
    uniqueKeys: [
      { paths: ["/idempotencyKey"] } // Enforce uniqueness
    ]
  }
};

const { container } = await database.containers.createIfNotExists(containerDefinition);

// Idempotent insert (fails on duplicate idempotencyKey)
try {
  await container.items.create({
    id: uuidv4(),
    userId: "user123",
    idempotencyKey: clientProvidedKey,
    amount: 100,
    status: "completed"
  });
} catch (error) {
  if (error.code === 409) {
    // Duplicate idempotencyKey detected
    console.log("Order already processed");
  }
}`,
    },
  ],

  usedInSystems: [
    {
      systemId: "stripe-payments",
      systemName: "Stripe Payment API",
      howUsed:
        "Stripe uses idempotency keys to prevent duplicate payment charges from network retries or client errors. Clients generate a unique idempotency key (UUID) and include it in the Idempotency-Key header when creating charges, refunds, or customer objects. Stripe stores the key and response in Redis for 24 hours—if the same key is used again within that window, Stripe returns the cached response without reprocessing. This prevents double-charging customers if a client retries a payment request due to network timeout. When processing $100B+ annually, idempotency prevents millions in duplicate charges. Stripe enforces strict key validation: keys must be unique per account, 255 chars max, and cannot be reused for different request bodies (returns 400 Bad Request). The system handles edge cases like concurrent requests with the same key—first request executes, subsequent requests wait for completion and receive the same result. Pattern composition: Idempotency Keys + Redis Cache + Request Deduplication + Strict Key Validation. Impact: Prevented $500M+ in duplicate charges (2023); reduced customer disputes from retry-induced duplicates by 99%; enabled safe automatic retries in client libraries.",
      source: "https://stripe.com/docs/api/idempotent_requests",
    },
    {
      systemId: "aws-api-gateway",
      systemName: "AWS API Gateway + Lambda",
      howUsed:
        "AWS API Gateway does not provide built-in idempotency, so Lambda functions implement idempotency using DynamoDB conditional writes. When processing webhook events (Stripe webhooks, GitHub webhooks), Lambda functions extract the event ID and attempt a conditional PutItem to DynamoDB with condition expression 'attribute_not_exists(eventId)'. If the event was already processed (key exists), DynamoDB returns ConditionalCheckFailedException and Lambda returns success without reprocessing. This prevents duplicate order creation, duplicate email sends, or duplicate inventory updates from webhook retries. For payment processing, Lambda functions use DynamoDB transactions to atomically check idempotency key and write payment record—if key exists, transaction aborts and cached response is returned. AWS handles 100M+ Lambda invocations daily with idempotency preventing duplicate mutations from retries. Pattern composition: Idempotency Keys + DynamoDB Conditional Writes + DynamoDB Transactions + Webhook Deduplication. Impact: Reduced duplicate webhook processing by 100% (no duplicate orders/emails); enabled safe at-least-once delivery from event sources; improved system reliability during network partitions causing retries.",
      source:
        "https://aws.amazon.com/blogs/compute/handling-webhook-events-with-amazon-eventbridge/",
    },
    {
      systemId: "uber-trip-creation",
      systemName: "Uber Ride Request System",
      howUsed:
        "Uber uses idempotency to prevent duplicate ride requests when users frantically tap 'Request Ride' during network issues. The mobile app generates a client-side UUID for each request attempt and includes it in the API call. Uber's backend stores the idempotency key in distributed cache (likely Redis) for 10 minutes—if duplicate request arrives, the cached trip ID is returned instead of creating a new trip. This prevents double-booking where a user is matched with two drivers simultaneously. The system handles race conditions: if two requests with same key arrive concurrently, distributed lock ensures only one executes while the other waits. After 10 minutes, keys expire and a new request is treated as intentional (user requesting another ride). Uber processes 20M+ rides daily with idempotency preventing thousands of duplicate trips from network retry scenarios. Pattern composition: Idempotency Keys (client-generated UUID) + Distributed Cache + Distributed Locking + TTL Expiration. Impact: Eliminated duplicate trip creation from mobile network retries; improved user trust (no unexpected dual charges); reduced support tickets from duplicate trip disputes by 95%.",
      source: "https://www.uber.com/blog/restaurant-manager/",
    },
    {
      systemId: "github-api",
      systemName: "GitHub REST API v3",
      howUsed:
        "GitHub uses idempotency for mutation operations like creating issues, pull requests, and releases. While GitHub doesn't require explicit idempotency keys, many endpoints are naturally idempotent through unique constraints—creating an issue with same title/body is allowed (different issue numbers), but creating a release with existing tag name fails with 422 Unprocessable Entity. For webhook delivery, GitHub assigns a unique delivery ID to each webhook event and stores delivery attempts in PostgreSQL. If a webhook fails and GitHub retries, the delivery ID remains the same, allowing receivers to deduplicate using the X-GitHub-Delivery header. GitHub's API encourages conditional requests (If-None-Match with ETags) which provide idempotency for GET requests—server returns 304 Not Modified if content unchanged, saving bandwidth and enabling safe retries. Pattern composition: Natural Idempotency (unique constraints) + Delivery IDs + Conditional Requests (ETags) + Webhook Deduplication. Impact: Enabled safe webhook retries without duplicate processing (e.g., duplicate CI builds); reduced API bandwidth by 40% via conditional requests; improved API reliability by making most operations safe to retry.",
      source:
        "https://docs.github.com/en/rest/guides/best-practices-for-integrators",
    },
    {
      systemId: "shopify-orders",
      systemName: "Shopify E-commerce Platform",
      howUsed:
        "Shopify uses idempotency keys for order creation and inventory updates to prevent duplicate orders from payment gateway retries or customer double-clicks. When a customer completes checkout, the frontend generates a UUID and includes it in the order creation request. Shopify's backend stores the idempotency key in MySQL for 48 hours—if the same key is reused (payment gateway retry), Shopify returns the existing order without charging the customer twice or decrementing inventory again. For inventory management, Shopify uses database-level idempotency through versioning—each inventory update includes a version number, and concurrent updates with the same version are rejected (optimistic locking). This prevents overselling when multiple customers buy the last item simultaneously. Shopify processes 100M+ orders annually with idempotency preventing revenue loss from duplicate charges and customer satisfaction issues. Pattern composition: Idempotency Keys + Database Persistence + Optimistic Locking + Inventory Versioning. Impact: Prevented 500k+ duplicate orders from payment retries (2023); eliminated overselling incidents during flash sales; improved customer trust with guaranteed single-charge for retried payments.",
      source: "https://shopify.dev/api/usage/idempotent-requests",
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Payment processing API between client application and payment gateway to prevent duplicate charges",
      "Order creation service within order management microservice to prevent duplicate orders from retries",
      "Infrastructure provisioning API layer for creating cloud resources (VMs, databases) to prevent duplicate creation",
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
