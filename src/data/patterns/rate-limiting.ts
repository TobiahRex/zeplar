import type { Pattern } from "../schema";

export const rateLimiting: Pattern = {
  id: "rate-limiting",
  slug: "rate-limiting",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🚰 Flow Control → 🚦 Rate Limiting",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Flow Control",
    level: 4,
  },

  concept: {
    name: "Rate Limiting",
    emoji: "🚦",
    tagline: "Control the flow to protect the system",
    definition:
      "Rate Limiting is a protective pattern that controls the flow of requests to a system by restricting how many operations a client can perform within a specified time window. Like a traffic cop directing vehicles through an intersection, it ensures orderly access to shared resources by enforcing quotas on API calls, database queries, or any resource-consuming operation. The pattern operates through various algorithms—token bucket (refills tokens at a steady rate), leaky bucket (processes requests at a constant rate), sliding window (tracks exact request timestamps), or fixed window (resets counters at interval boundaries). When a client exceeds their allocated quota, requests are rejected with a 429 (Too Many Requests) status code and informative headers indicating when they can retry. Rate limiting serves multiple critical functions: protecting infrastructure from overload during traffic spikes, preventing abuse from malicious actors or runaway scripts, ensuring fair resource distribution across legitimate users, and enabling predictable capacity planning. Modern implementations often employ distributed counters stored in Redis or similar systems to maintain consistency across load-balanced servers, and sophisticated strategies like per-endpoint limits, tiered quotas based on user subscription levels, and burst allowances that permit short-term spikes while maintaining average rates over longer windows.",
    problemSolved:
      "Without rate limiting, systems are vulnerable to multiple catastrophic failure modes. A single misbehaving client—whether a buggy script in an infinite loop, a malicious DDoS attack, or a legitimate user accidentally triggering excessive requests—can monopolize all available resources, denying service to thousands of other users. API abuse can lead to runaway infrastructure costs as auto-scaling provisions unlimited capacity to handle artificially inflated load. Downstream dependencies become overwhelmed when upstream services forward uncontrolled request volumes, triggering cascading failures throughout distributed systems. Shared databases face connection pool exhaustion and query timeouts when bombarded with unlimited queries. Third-party API costs spiral out of control when services lack quotas on outbound calls. Rate limiting solves these problems by establishing guardrails that protect both the service provider and legitimate users, transforming potentially catastrophic overload scenarios into controlled, predictable rejections with clear guidance on when to retry.",
    tradeoffs: {
      pros: [
        "Protects services from overload and abuse",
        "Ensures fair access across clients",
        "Prevents runaway costs from API abuse",
        "Enables predictable capacity planning",
      ],
      cons: [
        "Can reject legitimate traffic during spikes",
        "Adds latency for limit checking",
        "Requires distributed state for multi-node systems",
        "Complex to tune limits appropriately",
      ],
    },
    relatedPatterns: [
      "throttling",
      "token-bucket",
      "leaky-bucket",
      "circuit-breaker",
    ],
  },

  structure: {
    participants: [
      {
        name: "Rate Limiter",
        role: "Traffic Controller",
        responsibilities: [
          "Track request counts per client/key",
          "Enforce rate limits and reject excess",
          "Reset counters at window boundaries",
        ],
      },
      {
        name: "Counter Store",
        role: "State Manager",
        responsibilities: [
          "Store request counts per key",
          "Support atomic increment operations",
          "Handle TTL/expiration",
        ],
      },
      {
        name: "Client",
        role: "Requester",
        responsibilities: [
          "Include identification (API key, IP, user ID)",
          "Handle rate limit responses (429 Too Many Requests)",
          "Implement backoff when limited",
        ],
      },
    ],
    diagram: `flowchart TD
    A[Request] --> B{Check Rate Limit}
    B -->|Under Limit| C[Increment Counter]
    C --> D[Process Request]
    D --> E[Return Response]
    B -->|Over Limit| F[Return 429]
    F --> G[Include Retry-After header]`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Send Request",
        description:
          "Client sends request with identifying information (API key, user ID, or IP address)",
      },
      {
        step: 2,
        actor: "Rate Limiter",
        action: "Extract Key",
        description:
          "Extract rate limit key from request headers, authentication token, or IP address",
      },
      {
        step: 3,
        actor: "Rate Limiter",
        action: "Check Limit",
        description:
          "Look up current count for this client in the time window from distributed store",
      },
      {
        step: 4,
        actor: "Rate Limiter",
        action: "Decision",
        description:
          "If under limit, increment counter and allow request; if over limit, reject with 429 status",
      },
      {
        step: 5,
        actor: "Rate Limiter",
        action: "Add Headers",
        description:
          "Include rate limit metadata in response (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)",
      },
      {
        step: 6,
        actor: "Client",
        action: "Handle Response",
        description:
          "Process successful response or implement backoff strategy on 429 rejection",
      },
    ],
    invariants: [
      "Request count must not exceed limit within window",
      "Counter must reset at window boundary",
      "Limit checks must be atomic (no race conditions)",
      "429 response must include rate limit headers",
    ],
  },

  codeExamples: [
    {
      id: "rate-limit-typescript",
      language: "typescript",
      title: "Sliding Window Rate Limiter",
      description: "A simple in-memory rate limiter using sliding window log",
      code: `interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private limit: number,
    private windowMs: number
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing timestamps and filter to current window
    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    const allowed = timestamps.length < this.limit;

    if (allowed) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
    }

    return {
      allowed,
      remaining: Math.max(0, this.limit - timestamps.length),
      resetAt: timestamps.length > 0
        ? timestamps[0] + this.windowMs
        : now + this.windowMs,
    };
  }
}

// Usage
const limiter = new RateLimiter(100, 60_000); // 100 req/min

function handleRequest(userId: string) {
  const result = limiter.check(userId);

  if (!result.allowed) {
    return {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': result.remaining,
        'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000),
      },
    };
  }

  // Process request...
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope: "A sliding window rate limiter tracking requests per key",
        prerequisites: ["Sliding window algorithm", "HTTP status codes"],
        systemPosition: "API Gateway or middleware layer",
      },
      annotations: [
        {
          id: "rate-limit-storage",
          lines: [8, 8],
          action: "Store request timestamps per key",
          reason:
            "Sliding window log algorithm needs to track when each request occurred",
          contextLevel: "local",
        },
        {
          id: "rate-limit-filter",
          lines: [20, 21],
          action: "Filter timestamps to current window only",
          reason:
            "Removes old requests outside the sliding window, accurately counting recent activity",
          contextLevel: "local",
          relatedConcepts: ["sliding-window"],
        },
        {
          id: "rate-limit-check",
          lines: [23, 27],
          action: "Allow if under limit, record the request",
          reason:
            "Only add timestamp if request is allowed—rejected requests should not count against limit",
          contextLevel: "local",
        },
        {
          id: "rate-limit-headers",
          lines: [44, 48],
          action: "Return 429 with rate limit headers",
          reason:
            "Standard headers tell clients how many requests remain and when to retry",
          contextLevel: "module",
          relatedConcepts: ["http-429", "retry-after"],
        },
      ],
      highlights: [
        {
          lines: [20, 27],
          label: "Sliding window logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [44, 48],
          label: "Rate limit response headers",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "rate-limit-token-bucket-python",
      language: "python",
      title: "Token Bucket Rate Limiter",
      description:
        "Production-grade token bucket algorithm with burst allowance and Redis backend",
      code: `from time import time
from typing import Optional
import redis

class TokenBucketRateLimiter:
    """
    Token bucket algorithm allows burst traffic while maintaining average rate.
    Tokens refill at a steady rate; each request consumes one token.
    """

    def __init__(
        self,
        redis_client: redis.Redis,
        capacity: int,
        refill_rate: float,
        key_prefix: str = "rate_limit"
    ):
        self.redis = redis_client
        self.capacity = capacity          # Maximum tokens in bucket
        self.refill_rate = refill_rate    # Tokens added per second
        self.key_prefix = key_prefix

    def check_rate_limit(self, key: str) -> dict:
        """
        Check if request is allowed and consume a token if so.
        Returns dict with allowed status and rate limit metadata.
        """
        bucket_key = f"{self.key_prefix}:{key}"
        now = time()

        # Lua script for atomic token bucket operation
        lua_script = """
        local bucket_key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        -- Get current bucket state
        local bucket = redis.call('HMGET', bucket_key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now

        -- Calculate tokens to add based on elapsed time
        local elapsed = now - last_refill
        local tokens_to_add = elapsed * refill_rate
        tokens = math.min(capacity, tokens + tokens_to_add)

        -- Check if request can be allowed
        local allowed = tokens >= 1

        if allowed then
            tokens = tokens - 1
        end

        -- Update bucket state
        redis.call('HMSET', bucket_key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', bucket_key, 3600)  -- TTL of 1 hour

        return {allowed and 1 or 0, math.floor(tokens)}
        """

        # Execute atomic operation
        result = self.redis.eval(
            lua_script,
            1,
            bucket_key,
            self.capacity,
            self.refill_rate,
            now
        )

        allowed = bool(result[0])
        remaining = int(result[1])

        return {
            'allowed': allowed,
            'limit': self.capacity,
            'remaining': remaining,
            'reset_at': int(now + (self.capacity - remaining) / self.refill_rate)
        }

# Usage in FastAPI middleware
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# 100 requests per minute with burst allowance
limiter = TokenBucketRateLimiter(
    redis_client=redis_client,
    capacity=100,           # Allow bursts up to 100 requests
    refill_rate=100/60      # Refill at 100 tokens per minute (1.67/sec)
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Use API key or IP address as rate limit key
    client_key = request.headers.get("X-API-Key") or request.client.host

    result = limiter.check_rate_limit(client_key)

    if not result['allowed']:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded"},
            headers={
                "X-RateLimit-Limit": str(result['limit']),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(result['reset_at']),
                "Retry-After": str(result['reset_at'] - int(time()))
            }
        )

    # Add rate limit headers to successful responses
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(result['limit'])
    response.headers["X-RateLimit-Remaining"] = str(result['remaining'])
    response.headers["X-RateLimit-Reset"] = str(result['reset_at'])

    return response`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production token bucket rate limiter with Redis backend and FastAPI integration",
        prerequisites: [
          "Token bucket algorithm",
          "Redis Lua scripting",
          "FastAPI middleware",
          "Atomic operations",
        ],
        systemPosition:
          "API Gateway or middleware layer with distributed state in Redis",
      },
      annotations: [
        {
          id: "token-bucket-lua",
          lines: [31, 59],
          action:
            "Execute token bucket logic atomically using Lua script in Redis",
          reason:
            "Lua scripts execute atomically in Redis, preventing race conditions when multiple servers check/update the same rate limit bucket simultaneously",
          contextLevel: "system",
          relatedConcepts: [
            "atomic-operations",
            "distributed-systems",
            "redis-lua",
          ],
        },
        {
          id: "token-refill-logic",
          lines: [42, 45],
          action:
            "Calculate tokens to add based on elapsed time since last refill",
          reason:
            "Token bucket refills continuously at a steady rate, allowing bursts when tokens accumulate but enforcing average rate over time",
          contextLevel: "local",
          relatedConcepts: ["token-bucket", "burst-allowance"],
        },
        {
          id: "token-consumption",
          lines: [47, 52],
          action: "Consume one token if available, otherwise reject request",
          reason:
            "Only requests with available tokens are allowed; bucket capacity caps maximum burst size",
          contextLevel: "local",
        },
        {
          id: "rate-limit-headers",
          lines: [98, 108],
          action: "Return 429 with standard rate limit headers",
          reason:
            "Headers inform clients about limits, remaining quota, and when to retry, enabling intelligent backoff strategies",
          contextLevel: "module",
          relatedConcepts: ["http-429", "client-backoff"],
        },
      ],
      highlights: [
        {
          lines: [31, 59],
          label: "Atomic Lua script for distributed rate limiting",
          sbvpDomain: "structure",
        },
        {
          lines: [42, 52],
          label: "Token bucket refill and consumption logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [88, 116],
          label: "FastAPI middleware integration",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "rate-limit-redis-fixed-window",
      language: "go",
      title: "Fixed Window Rate Limiter with Redis",
      description:
        "High-performance fixed window implementation using Redis INCR for distributed systems",
      code: `package ratelimit

import (
    "context"
    "fmt"
    "strconv"
    "time"

    "github.com/redis/go-redis/v9"
)

type FixedWindowLimiter struct {
    client      *redis.Client
    limit       int64
    windowSize  time.Duration
    keyPrefix   string
}

func NewFixedWindowLimiter(client *redis.Client, limit int64, window time.Duration) *FixedWindowLimiter {
    return &FixedWindowLimiter{
        client:     client,
        limit:      limit,
        windowSize: window,
        keyPrefix:  "rate_limit",
    }
}

type RateLimitResult struct {
    Allowed   bool
    Limit     int64
    Remaining int64
    ResetAt   time.Time
}

// Allow checks if a request should be allowed under the rate limit
func (rl *FixedWindowLimiter) Allow(ctx context.Context, key string) (*RateLimitResult, error) {
    now := time.Now()

    // Create window-specific key: rate_limit:user123:1704067200
    // This ensures clean resets at window boundaries
    windowStart := now.Truncate(rl.windowSize).Unix()
    redisKey := fmt.Sprintf("%s:%s:%d", rl.keyPrefix, key, windowStart)

    // Use Redis pipeline for efficiency
    pipe := rl.client.Pipeline()

    // Increment counter atomically
    incrCmd := pipe.Incr(ctx, redisKey)

    // Set expiration on first increment (NX flag ensures only set if new key)
    pipe.Expire(ctx, redisKey, rl.windowSize+time.Second)

    // Execute pipeline
    _, err := pipe.Exec(ctx)
    if err != nil {
        return nil, fmt.Errorf("redis pipeline failed: %w", err)
    }

    // Get current count
    count := incrCmd.Val()

    // Calculate result
    allowed := count <= rl.limit
    remaining := rl.limit - count
    if remaining < 0 {
        remaining = 0
    }

    // Window resets at next boundary
    resetAt := now.Truncate(rl.windowSize).Add(rl.windowSize)

    return &RateLimitResult{
        Allowed:   allowed,
        Limit:     rl.limit,
        Remaining: remaining,
        ResetAt:   resetAt,
    }, nil
}

// HTTP middleware example for Gin framework
import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func RateLimitMiddleware(limiter *FixedWindowLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Use API key or IP address as identifier
        clientKey := c.GetHeader("X-API-Key")
        if clientKey == "" {
            clientKey = c.ClientIP()
        }

        result, err := limiter.Allow(c.Request.Context(), clientKey)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Rate limit check failed",
            })
            c.Abort()
            return
        }

        // Add rate limit headers to all responses
        c.Header("X-RateLimit-Limit", strconv.FormatInt(result.Limit, 10))
        c.Header("X-RateLimit-Remaining", strconv.FormatInt(result.Remaining, 10))
        c.Header("X-RateLimit-Reset", strconv.FormatInt(result.ResetAt.Unix(), 10))

        if !result.Allowed {
            retryAfter := int(result.ResetAt.Sub(time.Now()).Seconds())
            c.Header("Retry-After", strconv.Itoa(retryAfter))

            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
                "retry_after": retryAfter,
            })
            c.Abort()
            return
        }

        c.Next()
    }
}

// Usage example
func main() {
    // Initialize Redis client
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Create limiter: 1000 requests per minute
    limiter := NewFixedWindowLimiter(rdb, 1000, time.Minute)

    // Setup Gin router
    r := gin.Default()
    r.Use(RateLimitMiddleware(limiter))

    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "Request processed successfully",
        })
    })

    r.Run(":8080")
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready distributed rate limiter using Redis with Go and Gin framework",
        prerequisites: [
          "Fixed window algorithm",
          "Redis operations",
          "Go concurrency",
          "HTTP middleware",
        ],
        systemPosition:
          "API Gateway or service middleware with shared Redis cluster for distributed state",
      },
      annotations: [
        {
          id: "fixed-window-key",
          lines: [39, 42],
          action: "Generate time-windowed Redis key using truncated timestamp",
          reason:
            "Truncating to window boundary ensures all requests in same window share the same key, and old windows naturally expire",
          contextLevel: "local",
          relatedConcepts: ["fixed-window", "time-bucketing"],
        },
        {
          id: "redis-incr-atomic",
          lines: [47, 53],
          action: "Use Redis INCR for atomic increment and set expiration",
          reason:
            "INCR is atomic across distributed systems; prevents race conditions when multiple servers increment simultaneously",
          contextLevel: "system",
          relatedConcepts: ["atomic-operations", "distributed-locking"],
        },
        {
          id: "window-reset-calculation",
          lines: [69, 70],
          action: "Calculate when the current window resets",
          reason:
            "Clients need to know when they can retry; reset time is at the next window boundary",
          contextLevel: "local",
        },
        {
          id: "middleware-headers",
          lines: [105, 108],
          action: "Add standard rate limit headers to response",
          reason:
            "Headers provide visibility into quota usage and enable clients to implement adaptive retry strategies",
          contextLevel: "module",
          relatedConcepts: ["http-headers", "client-feedback"],
        },
      ],
      highlights: [
        {
          lines: [39, 42],
          label: "Window-based key generation",
          sbvpDomain: "structure",
        },
        {
          lines: [47, 60],
          label: "Atomic Redis pipeline operations",
          sbvpDomain: "behavior",
        },
        {
          lines: [88, 121],
          label: "HTTP middleware integration with headers",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "API Gateway",
      "Load Balancer",
      "Application Middleware",
      "CDN Edge",
    ],
    interactsWith: ["circuit-breaker", "throttling", "queue", "cache-aside"],
    architecturalBoundaries: [
      "Public API endpoints",
      "Inter-service calls",
      "Database queries",
      "Third-party API calls",
    ],
  },

  implementations: [
    {
      id: "redis-rate-limit",
      name: "Redis Rate Limiting",
      type: "service",
      languages: ["any"],
      description: "Use Redis INCR with TTL for distributed rate limiting",
      links: {
        docs: "https://redis.io/commands/incr/",
      },
    },
    {
      id: "express-rate-limit",
      name: "express-rate-limit",
      type: "library",
      languages: ["javascript", "typescript"],
      description: "Basic rate limiting middleware for Express.js",
      links: {
        npm: "https://www.npmjs.com/package/express-rate-limit",
        github: "https://github.com/express-rate-limit/express-rate-limit",
      },
    },
    {
      id: "kong-rate-limit",
      name: "Kong Rate Limiting",
      type: "platform",
      languages: ["any"],
      description: "API Gateway plugin for rate limiting",
      links: {
        docs: "https://docs.konghq.com/hub/kong-inc/rate-limiting/",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "github",
      systemName: "GitHub",
      howUsed:
        "GitHub API limits authenticated requests to 5,000/hour and unauthenticated to 60/hour",
      source: "https://docs.github.com/en/rest/rate-limit",
    },
    {
      systemId: "stripe",
      systemName: "Stripe",
      howUsed:
        "Stripe API uses rate limiting to protect against abuse, with limits varying by endpoint",
      source: "https://stripe.com/docs/rate-limits",
    },
    {
      systemId: "twitter",
      systemName: "Twitter/X",
      howUsed:
        "Twitter API enforces per-endpoint rate limits with 15-minute windows",
    },
  ],

  philosophy: {
    coreProblem:
      "Without limits, a system can be overwhelmed by excessive requests, whether malicious or accidental",
    designPrinciple:
      "Protect shared resources by limiting how much any single client can consume",
    historicalContext:
      "Rate limiting became essential with public APIs, where abuse and bots can easily overwhelm services",
    alternativesRejected: [
      "No limits - vulnerable to abuse and overload",
      "Hard blocking - too aggressive, punishes legitimate spikes",
      "Queue everything - unbounded queues lead to memory exhaustion",
    ],
    mentalModel:
      "Like a water faucet with a flow restrictor: no matter how hard you turn the handle, only so much water can flow per second",
  },

  visualization: {
    staticDiagram: `flowchart LR
    subgraph Requests
        R1[100 req/s]
        R2[50 req/s]
        R3[200 req/s]
    end
    L[Rate Limiter<br/>100 req/s max]
    subgraph Output
        O1[100 req/s ✓]
        O2[50 req/s ✓]
        O3[100 req/s ✓<br/>100 rejected]
    end
    R1 --> L --> O1
    R2 --> L --> O2
    R3 --> L --> O3`,
    realWorldAnalogy:
      "Rate limiting is like a nightclub with a capacity limit. Even if 500 people want to enter, only 200 can be inside at once. New arrivals must wait for others to leave.",
    useCases: [
      {
        domain: "APIs",
        scenario:
          "A developer accidentally deploys code that polls an API in a tight loop. Rate limiting caps them at 100 requests/minute, protecting the service.",
        patternRole: "Prevents accidental or malicious overload",
        companies: ["GitHub", "Stripe", "Twilio"],
      },
      {
        domain: "E-commerce",
        scenario:
          "During a flash sale, bots attempt to buy all inventory. Rate limiting per IP ensures human customers get a fair chance.",
        patternRole: "Enables fair access during high-demand events",
        companies: ["Nike", "Ticketmaster"],
      },
    ],
  },

  tags: ["performance", "reliability", "api", "throttling", "protection"],
  difficulty: "intermediate",
};
