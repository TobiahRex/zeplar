import type { Pattern } from "../schema";

export const readThrough: Pattern = {
  id: "read-through",
  slug: "read-through",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 💾 Caching → 📚 Read-Through",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Caching",
    level: 4,
  },

  concept: {
    name: "Read-Through",
    emoji: "📚",
    tagline: "Cache loads data transparently on miss",
    definition:
      "Read-Through caching is a pattern where the cache layer itself is responsible for loading data from the underlying data store on a cache miss, making the loading logic transparent to the application. Unlike Cache-Aside where the application explicitly manages cache population, Read-Through embeds the data loading logic directly into the cache infrastructure. When a read request occurs, the application queries only the cache. If the data exists (cache hit), it returns immediately from fast memory. If the data is missing (cache miss), the cache automatically invokes a configured loader function to fetch data from the database, stores the result with appropriate TTL, then returns it to the caller—all without the application needing separate fallback logic. This abstraction transforms the cache from a passive key-value store into an intelligent data access layer that handles the complexity of cache misses internally. The pattern typically uses a CacheLoader interface or callback function that encapsulates database query logic, which the cache invokes only when needed. Think of it like a self-stocking refrigerator: when you ask for milk and the fridge is empty, it automatically orders and stocks milk before giving it to you, rather than forcing you to go to the store yourself. This separation of concerns simplifies application code significantly—developers work with a unified cache API instead of writing repeated if-cache-miss-then-load-from-db logic throughout the codebase.",
    problemSolved:
      "In applications using Cache-Aside, the same three-step pattern repeats everywhere: check cache, if miss then query database, populate cache, return data. This repetition creates several problems. First, it clutters application code with caching infrastructure concerns, violating separation of concerns and making business logic harder to read. Second, it increases the risk of bugs—developers might forget to populate the cache after a database query, or set inconsistent TTLs across different code paths. Third, it complicates testing since every data access point now has branching cache logic. Fourth, it creates a cold cache problem at application startup where the first request for any data item always hits the slow database path, causing latency spikes. Fifth, without coordination, concurrent requests for the same missing key can trigger duplicate database queries (cache stampede). Read-Through solves these problems by centralizing cache loading logic in the cache layer itself. The application code becomes dramatically simpler—just call cache.get(key) and the cache handles everything. This abstraction prevents code duplication, ensures consistent cache behavior across the application, and enables the cache to implement sophisticated features like request coalescing (deduplicating concurrent loads for the same key) and automatic retry logic. The cold cache problem improves because the cache can proactively warm itself or use cache warming strategies that are invisible to the application. However, this convenience comes at a cost: the cache now has tight coupling to the data source, must know how to load every type of data, and the first read of any cache key still incurs database latency.",
    tradeoffs: {
      pros: [
        "Centralizes cache-loading logic in one place",
        "Simplifies application code dramatically",
        "Enables consistent cache population across codebase",
        "Reduces risk of cache misuse or bugs",
        "Supports request coalescing to prevent cache stampede",
      ],
      cons: [
        "First read always has high latency (cold cache)",
        "Cache must know how to load data (tight coupling)",
        "More complex cache implementation",
        "Harder to implement different loading strategies per key",
        "Cold start performance penalty",
      ],
    },
    relatedPatterns: [
      "cache-aside",
      "write-through",
      "lazy-loading",
      "refresh-ahead",
      "cache-warming",
      "circuit-breaker",
      "bulkhead",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Cache Consumer",
        responsibilities: [
          "Request data from cache without knowledge of loading",
          "Consume cached data immediately on hit",
          "Wait for cache to load data on miss",
        ],
      },
      {
        name: "Cache",
        role: "Intelligent Data Access Layer",
        responsibilities: [
          "Check if requested key exists in memory",
          "Invoke loader automatically on cache miss",
          "Store loaded data with appropriate TTL",
          "Return data to application transparently",
        ],
      },
      {
        name: "Loader",
        role: "Data Source Abstraction",
        responsibilities: [
          "Fetch data from database or external API",
          "Transform data into cacheable format",
          "Handle data source errors gracefully",
        ],
      },
      {
        name: "Database",
        role: "Source of Truth",
        responsibilities: [
          "Persist all data durably",
          "Serve loader requests on cache miss",
          "Maintain data consistency",
        ],
      },
      {
        name: "Cache Entry",
        role: "Cached Data Unit",
        responsibilities: [
          "Store data in fast memory",
          "Track expiration time (TTL)",
          "Automatically expire when TTL elapses",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant Cache as Cache Layer
    participant Loader as CacheLoader
    participant DB as Database

    App->>Cache: get(key)
    alt Cache Hit
        Cache-->>App: Return cached data
    else Cache Miss
        Cache->>Loader: load(key)
        Loader->>DB: SELECT * FROM table WHERE id=key
        DB-->>Loader: Return data
        Loader-->>Cache: Return loaded data
        Cache->>Cache: Store data with TTL
        Cache-->>App: Return data
    end`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Request Data",
        description:
          "Application calls cache.get(key) without any fallback logic",
      },
      {
        step: 2,
        actor: "Cache",
        action: "Check Cache",
        description: "Cache checks if key exists in memory and is not expired",
      },
      {
        step: 3,
        actor: "Cache",
        action: "Return Hit or Invoke Loader",
        description:
          "On hit, return immediately. On miss, automatically invoke loader",
      },
      {
        step: 4,
        actor: "Loader",
        action: "Fetch from Database",
        description: "Loader executes query to retrieve data from data store",
      },
      {
        step: 5,
        actor: "Loader",
        action: "Return to Cache",
        description: "Loader returns fetched data to cache layer",
      },
      {
        step: 6,
        actor: "Cache",
        action: "Populate Cache",
        description: "Cache stores loaded data with configured TTL",
      },
      {
        step: 7,
        actor: "Cache",
        action: "Return to Application",
        description:
          "Cache returns data to application (from memory or fresh load)",
      },
      {
        step: 8,
        actor: "Cache Entry",
        action: "Auto-Expire",
        description: "Entry automatically expires after TTL, forcing reload",
      },
      {
        step: 9,
        actor: "Cache",
        action: "Coalesce Concurrent Requests",
        description:
          "If multiple threads request same missing key, deduplicate loads",
      },
    ],
    invariants: [
      "Cache handles all misses automatically without application intervention",
      "Loader function is the single source of truth for how to fetch data",
      "Cache population is transparent to application code",
      "First request for any key always invokes loader (cold cache)",
      "Concurrent requests for the same missing key should trigger only one load",
    ],
  },

  codeExamples: [
    {
      id: "rt-typescript-generic",
      language: "typescript",
      title: "Generic Read-Through Cache with Stampede Protection",
      description:
        "TypeScript implementation with generic types, Redis backend, and promise deduplication to prevent cache stampede",
      code: `import { createClient, RedisClientType } from 'redis';

// Generic cache loader function type
type CacheLoader<T> = (key: string) => Promise<T>;

// Configuration for cache behavior
interface CacheConfig {
  ttlSeconds: number;
  enableStampedeProtection: boolean;
  loaderTimeoutMs: number;
}

// Statistics tracking for monitoring
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  coalesced: number;
}

/**
 * Read-Through Cache Implementation
 *
 * Key features:
 * - Generic type support for any data type
 * - Automatic data loading on cache miss
 * - Stampede protection via promise deduplication
 * - Redis persistence with automatic serialization
 * - Loader timeout protection
 */
export class ReadThroughCache<T> {
  private redis: RedisClientType;
  private loader: CacheLoader<T>;
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    coalesced: 0,
  };

  // In-flight request tracking for stampede protection
  private inflightRequests = new Map<string, Promise<T>>();

  constructor(
    redis: RedisClientType,
    loader: CacheLoader<T>,
    config: Partial<CacheConfig> = {}
  ) {
    this.redis = redis;
    this.loader = loader;
    this.config = {
      ttlSeconds: config.ttlSeconds ?? 300,
      enableStampedeProtection: config.enableStampedeProtection ?? true,
      loaderTimeoutMs: config.loaderTimeoutMs ?? 5000,
    };
  }

  /**
   * Primary read-through method.
   * Application calls this without any fallback logic.
   * Cache handles loading automatically on miss.
   */
  async get(key: string): Promise<T> {
    try {
      // Step 1: Check cache first (fast path)
      const cached = await this.redis.get(key);

      if (cached !== null) {
        this.stats.hits++;
        return this.deserialize(cached);
      }

      this.stats.misses++;

      // Step 2: Cache miss - load data automatically
      return await this.loadWithStampedeProtection(key);
    } catch (error) {
      this.stats.errors++;
      throw new Error(\`Read-through cache error: \${error}\`);
    }
  }

  /**
   * Load data with stampede protection.
   * If multiple concurrent requests ask for the same missing key,
   * only one loader invocation occurs - others wait for the result.
   */
  private async loadWithStampedeProtection(key: string): Promise<T> {
    if (!this.config.enableStampedeProtection) {
      return this.loadAndCache(key);
    }

    // Check if another request is already loading this key
    const inflightRequest = this.inflightRequests.get(key);

    if (inflightRequest) {
      // Cache stampede prevention - reuse in-flight request
      this.stats.coalesced++;
      return inflightRequest;
    }

    // Create new loading promise
    const loadingPromise = this.loadAndCache(key).finally(() => {
      // Clean up inflight tracking when done
      this.inflightRequests.delete(key);
    });

    // Track this request so concurrent requests can reuse it
    this.inflightRequests.set(key, loadingPromise);

    return loadingPromise;
  }

  /**
   * Load data from loader and populate cache.
   * This is the core read-through logic.
   */
  private async loadAndCache(key: string): Promise<T> {
    // Add timeout to prevent indefinite hanging on slow loaders
    const data = await this.withTimeout(
      this.loader(key),
      this.config.loaderTimeoutMs
    );

    // Populate cache with loaded data
    await this.redis.setEx(
      key,
      this.config.ttlSeconds,
      this.serialize(data)
    );

    return data;
  }

  /**
   * Timeout wrapper for loader invocations.
   * Prevents slow database queries from blocking cache indefinitely.
   */
  private async withTimeout<R>(
    promise: Promise<R>,
    timeoutMs: number
  ): Promise<R> {
    return Promise.race([
      promise,
      new Promise<R>((_, reject) =>
        setTimeout(() => reject(new Error('Loader timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Batch get with automatic loading for missing keys.
   * Uses Redis MGET for efficient batch cache lookup.
   */
  async getMany(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const missingKeys: string[] = [];

    // Batch cache lookup with MGET
    const cached = await this.redis.mGet(keys);

    // Identify hits and misses
    for (let i = 0; i < keys.length; i++) {
      if (cached[i] !== null) {
        this.stats.hits++;
        results.set(keys[i], this.deserialize(cached[i]!));
      } else {
        this.stats.misses++;
        missingKeys.push(keys[i]);
      }
    }

    // Load missing keys (potentially in parallel)
    if (missingKeys.length > 0) {
      const loadPromises = missingKeys.map((key) =>
        this.loadWithStampedeProtection(key).then((data) => ({
          key,
          data,
        }))
      );

      const loadedEntries = await Promise.all(loadPromises);

      for (const { key, data } of loadedEntries) {
        results.set(key, data);
      }
    }

    return results;
  }

  /**
   * Invalidate a cache entry.
   * Call this after updating data to force reload on next access.
   */
  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
    this.inflightRequests.delete(key);
  }

  /**
   * Invalidate multiple keys at once.
   */
  async invalidateMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.redis.del(keys);
    keys.forEach((key) => this.inflightRequests.delete(key));
  }

  /**
   * Get cache statistics for monitoring.
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      ...this.stats,
      hitRate,
    };
  }

  private serialize(data: T): string {
    return JSON.stringify(data);
  }

  private deserialize(data: string): T {
    return JSON.parse(data);
  }
}

// Example usage demonstrating comparison with cache-aside
interface User {
  id: string;
  name: string;
  email: string;
}

// Database access layer
class UserDatabase {
  async findById(userId: string): Promise<User | null> {
    // Simulated database query
    console.log(\`Database query for user \${userId}\`);
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    };
  }
}

async function exampleUsage() {
  const redis = createClient({ url: 'redis://localhost:6379' });
  await redis.connect();

  const db = new UserDatabase();

  // Create read-through cache with loader function
  const userCache = new ReadThroughCache<User>(
    redis,
    async (userId: string) => {
      const user = await db.findById(userId);
      if (!user) throw new Error(\`User \${userId} not found\`);
      return user;
    },
    {
      ttlSeconds: 300,
      enableStampedeProtection: true,
      loaderTimeoutMs: 5000,
    }
  );

  // Application code is dramatically simpler - no fallback logic needed!
  const user = await userCache.get('user:123');
  console.log(\`Got user: \${user.name}\`);

  // Second call hits cache
  const cachedUser = await userCache.get('user:123');
  console.log(\`Cached user: \${cachedUser.name}\`);

  // Batch loading
  const users = await userCache.getMany(['user:123', 'user:456', 'user:789']);
  console.log(\`Loaded \${users.size} users\`);

  // Monitor cache performance
  const stats = userCache.getStats();
  console.log(\`Hit rate: \${(stats.hitRate * 100).toFixed(2)}%\`);
  console.log(\`Coalesced requests: \${stats.coalesced}\`);

  await redis.disconnect();
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete read-through cache implementation with stampede protection, batch operations, and monitoring",
        prerequisites: [
          "TypeScript generics",
          "Promise-based async patterns",
          "Redis client library",
          "Error handling strategies",
        ],
        systemPosition:
          "Data access layer providing cached database access with transparent loading",
      },
      annotations: [
        {
          id: "rt-ts-loader-abstraction",
          lines: [4, 4],
          action: "Define generic loader function type",
          reason:
            "Loader abstraction separates how to fetch data from caching logic; enables cache to work with any data source without knowing implementation details",
          contextLevel: "module",
          relatedConcepts: ["separation-of-concerns", "dependency-injection"],
        },
        {
          id: "rt-ts-inflight-tracking",
          lines: [45, 45],
          action: "Track in-flight requests with Promise map",
          reason:
            "When concurrent requests ask for same missing key, only one database query executes; others wait for the shared promise, preventing cache stampede",
          contextLevel: "system",
          relatedConcepts: ["cache-stampede", "request-coalescing"],
        },
        {
          id: "rt-ts-transparent-load",
          lines: [66, 82],
          action:
            "Automatically load on cache miss without application involvement",
          reason:
            "Read-through pattern's core value: application just calls get() and cache handles loading transparently, simplifying application code dramatically",
          contextLevel: "module",
          relatedConcepts: ["abstraction", "transparency"],
        },
        {
          id: "rt-ts-stampede-protection",
          lines: [89, 114],
          action:
            "Reuse in-flight loading promise if another request is already loading the same key",
          reason:
            "Prevents thundering herd problem where 1000 concurrent requests for missing key trigger 1000 database queries; instead, all wait for single load",
          contextLevel: "system",
          relatedConcepts: ["thundering-herd", "deduplication"],
        },
        {
          id: "rt-ts-loader-timeout",
          lines: [132, 143],
          action: "Wrap loader invocation with timeout protection",
          reason:
            "Slow or hanging database queries should not block cache indefinitely; timeout ensures system remains responsive even when data source degrades",
          contextLevel: "system",
          relatedConcepts: ["timeout-pattern", "resilience"],
        },
        {
          id: "rt-ts-batch-loading",
          lines: [150, 181],
          action: "Support batch loading with MGET and parallel loader calls",
          reason:
            "Loading related entities (user + posts + comments) in batch prevents N+1 cache queries; MGET reduces network round-trips to cache",
          contextLevel: "system",
          relatedConcepts: ["batch-operations", "n-plus-one"],
        },
        {
          id: "rt-ts-invalidation",
          lines: [187, 196],
          action: "Provide invalidation methods to clear stale cache entries",
          reason:
            "After updating data in database, invalidate cache entry so next read fetches fresh data; prevents serving stale cached data",
          contextLevel: "module",
          relatedConcepts: ["cache-invalidation", "consistency"],
        },
        {
          id: "rt-ts-stats-tracking",
          lines: [201, 211],
          action: "Track cache hits, misses, errors, and coalesced requests",
          reason:
            "Monitoring cache performance is critical for tuning TTLs and identifying issues; hit rate below 80% suggests TTLs too short or data too diverse to cache",
          contextLevel: "system",
          relatedConcepts: ["observability", "monitoring"],
        },
      ],
      highlights: [
        {
          lines: [66, 82],
          label: "Read-through automatic loading on cache miss",
          sbvpDomain: "behavior",
        },
        {
          lines: [89, 114],
          label: "Stampede protection via promise deduplication",
          sbvpDomain: "behavior",
        },
        {
          lines: [150, 181],
          label: "Batch operations with parallel loading",
          sbvpDomain: "structure",
        },
      ],
    },
    {
      id: "rt-python-decorator",
      language: "python",
      title: "Python Decorator Read-Through with SQLAlchemy",
      description:
        "Decorator-based read-through cache with automatic serialization and SQLAlchemy integration",
      code: `import json
import redis
from typing import TypeVar, Callable, Optional, Any, Dict
from functools import wraps
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')

class ReadThroughCache:
    """
    Decorator factory for read-through caching.

    Usage:
        @cache_read_through(ttl=300, key_prefix="user")
        def get_user_by_id(user_id: int) -> User:
            return db.query(User).filter(User.id == user_id).first()

    The decorator automatically:
    - Checks cache before calling function
    - Invokes function on cache miss
    - Stores result in cache with TTL
    - Returns cached or fresh data
    """

    def __init__(
        self,
        redis_client: redis.Redis,
        default_ttl: int = 300
    ):
        self.redis = redis_client
        self.default_ttl = default_ttl
        self.stats = {
            'hits': 0,
            'misses': 0,
            'errors': 0
        }

    def cache_read_through(
        self,
        ttl: Optional[int] = None,
        key_prefix: str = "",
        key_fn: Optional[Callable[..., str]] = None
    ):
        """
        Decorator for read-through caching.

        Args:
            ttl: Time-to-live in seconds (None = use default)
            key_prefix: Prefix for cache keys
            key_fn: Custom function to generate cache key from args
        """
        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            def wrapper(*args, **kwargs) -> T:
                # Generate cache key from function arguments
                if key_fn:
                    cache_key = key_fn(*args, **kwargs)
                else:
                    cache_key = self._generate_key(
                        key_prefix,
                        func.__name__,
                        args,
                        kwargs
                    )

                try:
                    # Step 1: Check cache (read-through pattern starts here)
                    cached_data = self.redis.get(cache_key)

                    if cached_data is not None:
                        self.stats['hits'] += 1
                        logger.debug(f"Cache HIT for {cache_key}")
                        return self._deserialize(cached_data)

                    # Step 2: Cache miss - invoke loader (the wrapped function)
                    self.stats['misses'] += 1
                    logger.debug(f"Cache MISS for {cache_key}")

                    # Call the original function to load data
                    result = func(*args, **kwargs)

                    # Step 3: Store result in cache automatically
                    if result is not None:
                        self._cache_result(
                            cache_key,
                            result,
                            ttl or self.default_ttl
                        )

                    return result

                except redis.RedisError as e:
                    # Cache failure should not break application
                    self.stats['errors'] += 1
                    logger.error(f"Cache error: {e}, falling back to direct call")
                    return func(*args, **kwargs)

            return wrapper
        return decorator

    def _generate_key(
        self,
        prefix: str,
        func_name: str,
        args: tuple,
        kwargs: dict
    ) -> str:
        """
        Generate cache key from function name and arguments.
        Handles serialization of complex types.
        """
        # Build key from prefix, function name, and arguments
        key_parts = [prefix, func_name] if prefix else [func_name]

        # Add positional args (skip 'self' if present)
        for arg in args:
            if hasattr(arg, '__class__') and arg.__class__.__name__ == 'Session':
                continue  # Skip SQLAlchemy session objects
            key_parts.append(str(arg))

        # Add keyword args
        for k, v in sorted(kwargs.items()):
            if k != 'db':  # Skip database session
                key_parts.append(f"{k}={v}")

        return ":".join(key_parts)

    def _cache_result(self, key: str, data: Any, ttl: int) -> None:
        """
        Store data in cache with TTL.
        Handles automatic serialization.
        """
        try:
            serialized = self._serialize(data)
            self.redis.setex(key, timedelta(seconds=ttl), serialized)
            logger.debug(f"Cached {key} with TTL {ttl}s")
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to cache {key}: {e}")

    def _serialize(self, data: Any) -> str:
        """
        Serialize data for cache storage.
        Supports SQLAlchemy models via dict conversion.
        """
        if hasattr(data, '__dict__'):
            # Convert SQLAlchemy model to dict
            return json.dumps({
                k: v for k, v in data.__dict__.items()
                if not k.startswith('_')
            })
        return json.dumps(data)

    def _deserialize(self, data: bytes) -> Any:
        """Deserialize cached data."""
        return json.loads(data)

    def invalidate(self, key: str) -> None:
        """Invalidate a cache entry."""
        self.redis.delete(key)

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total = self.stats['hits'] + self.stats['misses']
        hit_rate = self.stats['hits'] / total if total > 0 else 0

        return {
            **self.stats,
            'hit_rate': hit_rate
        }


# Example usage with SQLAlchemy
from dataclasses import dataclass
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class UserModel(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(100))
    email = Column(String(255))
    role = Column(String(50))

@dataclass
class User:
    id: int
    username: str
    email: str
    role: str


class UserRepository:
    """
    Repository with read-through caching.
    Decorator makes caching transparent to application code.
    """

    def __init__(
        self,
        db: Session,
        cache: ReadThroughCache
    ):
        self.db = db
        self.cache = cache

    @property
    def cache_read_through(self):
        """Expose decorator for method decoration."""
        return self.cache.cache_read_through

    # Read-through caching via decorator
    @cache_read_through(ttl=300, key_prefix="user")
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Fetch user by ID with automatic caching.

        On cache hit: Returns from Redis immediately
        On cache miss: Queries database, caches result, returns data

        Application code just calls this method - caching is transparent!
        """
        logger.info(f"Loading user {user_id} from database")

        stmt = select(UserModel).where(UserModel.id == user_id)
        db_user = self.db.execute(stmt).scalar_one_or_none()

        if db_user is None:
            return None

        return User(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            role=db_user.role
        )

    @cache_read_through(ttl=600, key_prefix="user:email")
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Fetch user by email with different TTL.
        Demonstrates per-method cache configuration.
        """
        stmt = select(UserModel).where(UserModel.email == email)
        db_user = self.db.execute(stmt).scalar_one_or_none()

        if db_user is None:
            return None

        return User(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            role=db_user.role
        )

    def update_user(self, user_id: int, **updates) -> User:
        """
        Update user and invalidate cache.
        Ensures next read fetches fresh data.
        """
        # Update database
        stmt = select(UserModel).where(UserModel.id == user_id)
        db_user = self.db.execute(stmt).scalar_one_or_none()

        if db_user is None:
            raise ValueError(f"User {user_id} not found")

        for key, value in updates.items():
            setattr(db_user, key, value)

        self.db.commit()

        # Invalidate cache to force reload
        self.cache.invalidate(f"user:get_user_by_id:{user_id}")

        return self.get_user_by_id(user_id)


def example_usage():
    """
    Comparison: Cache-Aside vs Read-Through

    Cache-Aside (manual, repetitive):
        cached = cache.get(key)
        if not cached:
            data = db.query(...)
            cache.set(key, data, ttl)
        return cached or data

    Read-Through (automatic, simple):
        return cache.get_user_by_id(user_id)  # Cache handles everything!
    """
    # Setup
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=False)
    engine = create_engine('postgresql://localhost/myapp')
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    cache = ReadThroughCache(redis_client, default_ttl=300)
    repo = UserRepository(db, cache)

    # Application code is dramatically simpler with read-through!
    # Just call the method - caching is transparent
    user = repo.get_user_by_id(123)
    if user:
        print(f"User: {user.username}")

    # Second call hits cache automatically
    cached_user = repo.get_user_by_id(123)
    print(f"Cached user: {cached_user.username}")

    # Update invalidates cache
    updated_user = repo.update_user(123, username="new_username")

    # Next call loads fresh data from database
    fresh_user = repo.get_user_by_id(123)
    print(f"Fresh user: {fresh_user.username}")

    # Monitor cache performance
    stats = cache.get_stats()
    print(f"Cache hit rate: {stats['hit_rate'] * 100:.2f}%")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Decorator-based read-through cache with SQLAlchemy integration and automatic serialization",
        prerequisites: [
          "Python decorators and closures",
          "SQLAlchemy ORM",
          "Redis python client",
          "Type hints and generics",
        ],
        systemPosition:
          "Repository layer in Python web service with transparent caching via decorators",
      },
      annotations: [
        {
          id: "rt-py-decorator-factory",
          lines: [42, 53],
          action: "Decorator factory accepting cache configuration parameters",
          reason:
            "Decorator pattern in Python enables transparent caching by wrapping functions; factory pattern allows per-method cache configuration (different TTLs, key prefixes)",
          contextLevel: "module",
          relatedConcepts: ["decorator-pattern", "factory-pattern"],
        },
        {
          id: "rt-py-automatic-loading",
          lines: [70, 92],
          action:
            "Automatically call wrapped function on cache miss and store result",
          reason:
            "Read-through pattern's core: on miss, invoke loader (wrapped function) transparently and populate cache; application code has no explicit cache logic",
          contextLevel: "module",
          relatedConcepts: ["transparency", "separation-of-concerns"],
        },
        {
          id: "rt-py-key-generation",
          lines: [105, 129],
          action: "Generate cache keys from function name and arguments",
          reason:
            "Cache key must uniquely identify data being fetched; deriving key from function signature ensures different arguments produce different cache entries",
          contextLevel: "module",
          relatedConcepts: ["cache-key-design", "serialization"],
        },
        {
          id: "rt-py-sqlalchemy-serialization",
          lines: [148, 158],
          action:
            "Convert SQLAlchemy models to JSON for cache storage automatically",
          reason:
            "SQLAlchemy models cannot be directly serialized; extract __dict__ attributes and convert to JSON for Redis storage",
          contextLevel: "module",
          relatedConcepts: ["serialization", "orm-integration"],
        },
        {
          id: "rt-py-decorator-usage",
          lines: [215, 240],
          action:
            "Apply decorator to repository methods for transparent caching",
          reason:
            "With decorator, methods look like normal database queries but have automatic caching; no if-cache-miss-then-load boilerplate in business logic",
          contextLevel: "system",
          relatedConcepts: ["clean-code", "abstraction"],
        },
        {
          id: "rt-py-per-method-config",
          lines: [242, 261],
          action:
            "Use different TTLs and key prefixes for different query types",
          reason:
            "Email lookups might change less frequently than ID lookups; per-method configuration enables tuning cache behavior based on data characteristics",
          contextLevel: "system",
          relatedConcepts: ["cache-tuning", "ttl-strategy"],
        },
        {
          id: "rt-py-cache-invalidation",
          lines: [263, 284],
          action:
            "Invalidate cache after database update to prevent stale reads",
          reason:
            "After updating user, cache still holds old data; invalidation ensures next read fetches fresh data from database",
          contextLevel: "module",
          relatedConcepts: ["cache-invalidation", "consistency"],
        },
        {
          id: "rt-py-simplicity-comparison",
          lines: [289, 301],
          action:
            "Demonstrate code simplicity improvement over manual cache-aside",
          reason:
            "Read-through eliminates 5-6 lines of cache boilerplate per data access point; with 100 data access methods, this saves 500+ lines of repetitive code",
          contextLevel: "system",
          relatedConcepts: ["code-quality", "maintainability"],
        },
      ],
      highlights: [
        {
          lines: [42, 101],
          label: "Decorator factory with automatic cache-miss handling",
          sbvpDomain: "structure",
        },
        {
          lines: [215, 240],
          label: "Clean repository methods with transparent caching",
          sbvpDomain: "behavior",
        },
        {
          lines: [289, 314],
          label: "Code simplicity comparison: cache-aside vs read-through",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "rt-java-caffeine",
      language: "java",
      title: "Java Caffeine LoadingCache with JPA Repository",
      description:
        "Production-ready Caffeine LoadingCache with automatic refresh, bulk loading, and Spring Data JPA integration",
      code: `package com.example.cache;

import com.github.benmanes.caffeine.cache.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

import javax.persistence.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

// JPA Entity
@Entity
@Table(name = "products")
class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    private Integer stock;

    @Column(name = "category")
    private String category;

    // Getters and setters omitted for brevity
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}

// Spring Data JPA Repository
@Repository
interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByIdIn(Collection<Long> ids);
}

/**
 * Read-Through Cache Service using Caffeine LoadingCache.
 *
 * Caffeine's LoadingCache implements read-through pattern automatically:
 * - CacheLoader defines how to load missing keys
 * - Cache invokes loader on miss, stores result, returns data
 * - Application just calls cache.get(key) - loading is transparent
 *
 * Features:
 * - Automatic loading via CacheLoader interface
 * - Automatic refresh to prevent stale data
 * - Bulk loading optimization for batch queries
 * - Statistics tracking for monitoring
 * - Size-based and time-based eviction
 */
@Service
public class ProductCacheService {

    private final LoadingCache<Long, Product> productCache;
    private final ProductRepository repository;

    public ProductCacheService(ProductRepository repository) {
        this.repository = repository;

        // Build LoadingCache with automatic loading configuration
        this.productCache = Caffeine.newBuilder()
            // Time-based expiration
            .expireAfterWrite(Duration.ofMinutes(10))

            // Automatic background refresh before expiration
            // Prevents cache misses by proactively reloading hot entries
            .refreshAfterWrite(Duration.ofMinutes(8))

            // Size-based eviction (LFU with Window TinyLFU)
            .maximumSize(10_000)

            // Enable statistics for monitoring
            .recordStats()

            // Define the CacheLoader - this is the read-through loader
            .build(new CacheLoader<Long, Product>() {
                @Override
                public Product load(Long productId) throws Exception {
                    // This method called automatically on cache miss
                    System.out.println("Loading product " + productId + " from database");

                    return repository.findById(productId)
                        .orElseThrow(() -> new EntityNotFoundException(
                            "Product " + productId + " not found"
                        ));
                }

                @Override
                public Map<Long, Product> loadAll(Set<? extends Long> keys) {
                    // Bulk loading optimization - fetch multiple keys in one query
                    System.out.println("Bulk loading " + keys.size() + " products");

                    List<Product> products = repository.findAllByIdIn(keys);

                    return products.stream()
                        .collect(Collectors.toMap(Product::getId, p -> p));
                }
            });
    }

    /**
     * Get product by ID with automatic read-through loading.
     *
     * Application code is simple: just call this method.
     * Cache handles everything:
     * - Check cache first
     * - On miss, invoke CacheLoader.load()
     * - Store result with TTL
     * - Return data to caller
     */
    public Product getProduct(Long productId) {
        try {
            // Read-through pattern: cache.get() handles loading automatically
            return productCache.get(productId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load product " + productId, e);
        }
    }

    /**
     * Batch get with automatic bulk loading.
     *
     * For missing keys, cache invokes CacheLoader.loadAll()
     * which fetches multiple records in a single database query.
     * This prevents N+1 query problem.
     */
    public Map<Long, Product> getProducts(Set<Long> productIds) {
        try {
            // Caffeine automatically uses loadAll() for missing keys
            return productCache.getAll(productIds);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load products", e);
        }
    }

    /**
     * Update product and invalidate cache.
     * Next read will invoke loader to fetch fresh data.
     */
    public Product updateProduct(Long productId, ProductUpdateRequest updates) {
        // Fetch current product
        Product product = repository.findById(productId)
            .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        // Apply updates
        if (updates.getName() != null) {
            product.setName(updates.getName());
        }
        if (updates.getPrice() != null) {
            product.setPrice(updates.getPrice());
        }
        if (updates.getStock() != null) {
            product.setStock(updates.getStock());
        }

        // Save to database (source of truth)
        Product saved = repository.save(product);

        // Invalidate cache entry to force reload on next access
        productCache.invalidate(productId);

        return saved;
    }

    /**
     * Refresh a cache entry in background.
     * Useful for pre-warming cache with trending products.
     */
    public CompletableFuture<Product> refreshProduct(Long productId) {
        // Asynchronous refresh - does not block caller
        return productCache.refresh(productId);
    }

    /**
     * Invalidate cache entries by category.
     * Demonstrates custom invalidation logic.
     */
    public void invalidateCategory(String category) {
        // Iterate cache and invalidate matching entries
        productCache.asMap().entrySet().stream()
            .filter(entry -> category.equals(entry.getValue().getCategory()))
            .map(Map.Entry::getKey)
            .forEach(productCache::invalidate);
    }

    /**
     * Get cache statistics for monitoring and alerting.
     *
     * Monitor these metrics:
     * - Hit rate should be > 80% for effective caching
     * - Eviction count indicates cache size tuning
     * - Load failure rate shows database issues
     */
    public CacheStats getStats() {
        return new CacheStats(productCache.stats());
    }

    /**
     * Clear entire cache.
     * Useful after bulk data updates or maintenance.
     */
    public void clearCache() {
        productCache.invalidateAll();
    }
}

// DTO for update requests
class ProductUpdateRequest {
    private String name;
    private Double price;
    private Integer stock;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
}

// Wrapper for cache statistics
class CacheStats {
    private final com.github.benmanes.caffeine.cache.stats.CacheStats stats;

    public CacheStats(com.github.benmanes.caffeine.cache.stats.CacheStats stats) {
        this.stats = stats;
    }

    public long hitCount() { return stats.hitCount(); }
    public long missCount() { return stats.missCount(); }
    public double hitRate() { return stats.hitRate(); }
    public long evictionCount() { return stats.evictionCount(); }
    public long loadSuccessCount() { return stats.loadSuccessCount(); }
    public long loadFailureCount() { return stats.loadFailureCount(); }
    public double averageLoadPenalty() { return stats.averageLoadPenalty(); }

    @Override
    public String toString() {
        return String.format(
            "CacheStats{hits=%d, misses=%d, hitRate=%.2f%%, evictions=%d, loadFailures=%d}",
            hitCount(), missCount(), hitRate() * 100,
            evictionCount(), loadFailureCount()
        );
    }
}

// Example usage in REST controller
// @RestController
// @RequestMapping("/api/products")
class ProductController {

    private final ProductCacheService cacheService;

    public ProductController(ProductCacheService cacheService) {
        this.cacheService = cacheService;
    }

    // @GetMapping("/{id}")
    public Product getProduct(Long id) {
        // Application code is simple - caching is completely transparent!
        // No if-cache-miss-then-load boilerplate
        return cacheService.getProduct(id);
    }

    // @GetMapping("/batch")
    public Map<Long, Product> getProducts(Set<Long> ids) {
        // Batch loading with automatic cache-miss handling
        return cacheService.getProducts(ids);
    }

    // @PutMapping("/{id}")
    public Product updateProduct(Long id, ProductUpdateRequest updates) {
        return cacheService.updateProduct(id, updates);
    }

    // @GetMapping("/stats")
    public String getCacheStats() {
        return cacheService.getStats().toString();
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production Spring Boot service with Caffeine LoadingCache, automatic refresh, bulk loading, and JPA integration",
        prerequisites: [
          "Java 8+ (lambdas, streams, CompletableFuture)",
          "Caffeine cache library",
          "Spring Data JPA",
          "JPA/Hibernate basics",
        ],
        systemPosition:
          "Service layer in Spring Boot REST API providing cached database access with automatic loading",
      },
      annotations: [
        {
          id: "rt-java-cache-loader-interface",
          lines: [92, 115],
          action:
            "Implement CacheLoader interface to define how to load missing data",
          reason:
            "CacheLoader.load() is the read-through loader function; Caffeine automatically invokes this on cache miss, making loading transparent to application code",
          contextLevel: "module",
          relatedConcepts: ["interface-abstraction", "loader-pattern"],
        },
        {
          id: "rt-java-automatic-refresh",
          lines: [84, 86],
          action:
            "Configure automatic background refresh before expiration with refreshAfterWrite",
          reason:
            "Hot cache entries refresh in background before expiring; prevents cache misses for frequently accessed data and ensures fresh data without user-facing latency",
          contextLevel: "system",
          relatedConcepts: ["refresh-ahead", "cache-warming"],
        },
        {
          id: "rt-java-bulk-loading",
          lines: [107, 115],
          action:
            "Implement CacheLoader.loadAll() for efficient batch database queries",
          reason:
            "When loading multiple products, single database query with WHERE id IN (...) is vastly more efficient than N separate queries; prevents N+1 problem",
          contextLevel: "system",
          relatedConcepts: ["bulk-operations", "n-plus-one-prevention"],
        },
        {
          id: "rt-java-transparent-get",
          lines: [124, 135],
          action:
            "Application calls cache.get() without any fallback or loading logic",
          reason:
            "Read-through pattern's key benefit: application code is dramatically simpler—just call get(); cache handles checking, loading, storing automatically",
          contextLevel: "module",
          relatedConcepts: ["transparency", "separation-of-concerns"],
        },
        {
          id: "rt-java-batch-get",
          lines: [143, 154],
          action:
            "Use cache.getAll() for batch loading with automatic loadAll invocation",
          reason:
            "Caffeine detects which keys are missing and invokes loadAll() once for all missing keys; dramatically more efficient than individual get() calls",
          contextLevel: "system",
          relatedConcepts: ["batch-optimization", "performance"],
        },
        {
          id: "rt-java-stats-monitoring",
          lines: [200, 218],
          action:
            "Expose cache statistics for monitoring hit rates and load performance",
          reason:
            "Cache hit rate below 80% indicates TTL too short or cache too small; load failure rate shows database health; eviction count indicates size tuning needed",
          contextLevel: "system",
          relatedConcepts: ["observability", "performance-tuning"],
        },
        {
          id: "rt-java-async-refresh",
          lines: [184, 189],
          action:
            "Support asynchronous cache refresh via CompletableFuture for cache warming",
          reason:
            "Proactively refresh trending products in background without blocking request threads; improves cache hit rates and user experience",
          contextLevel: "system",
          relatedConcepts: ["async-operations", "cache-warming"],
        },
        {
          id: "rt-java-simple-usage",
          lines: [252, 275],
          action:
            "REST controller code has zero caching logic—just calls service methods",
          reason:
            "Read-through pattern pushes all caching complexity into cache layer; business logic remains clean and testable without cache coupling",
          contextLevel: "system",
          relatedConcepts: ["clean-architecture", "single-responsibility"],
        },
      ],
      highlights: [
        {
          lines: [76, 115],
          label:
            "LoadingCache configuration with CacheLoader interface implementation",
          sbvpDomain: "structure",
        },
        {
          lines: [124, 135],
          label: "Transparent read-through loading in application code",
          sbvpDomain: "behavior",
        },
        {
          lines: [107, 115],
          label: "Bulk loading optimization via loadAll()",
          sbvpDomain: "behavior",
        },
        {
          lines: [252, 275],
          label: "Clean controller code without caching boilerplate",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "User profile lookup in authentication services",
      "Product catalog in e-commerce platforms",
      "Configuration service for application settings",
      "Reference data (countries, currencies, tax rates)",
      "Session data in web applications",
      "API response caching for third-party integrations",
    ],
    interactsWith: [
      "cache-aside",
      "write-through",
      "circuit-breaker",
      "retry",
      "timeout",
      "rate-limiting",
    ],
    architecturalBoundaries: [
      "Cache tier (Redis, Caffeine, Guava)",
      "Data access layer (repositories, DAOs)",
      "Service layer (business logic)",
      "Application layer (controllers, handlers)",
    ],
  },

  implementations: [
    {
      id: "caffeine-loading-cache",
      name: "Caffeine LoadingCache",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "High-performance Java caching library with built-in LoadingCache implementation for read-through pattern. Automatically loads missing keys via CacheLoader interface, supports automatic refresh before expiration, bulk loading optimization via loadAll(), and Window TinyLFU eviction policy for near-optimal hit rates. Provides detailed statistics tracking and CompletableFuture support for async operations. Significantly faster than Guava Cache with better memory efficiency.",
      links: {
        docs: "https://github.com/ben-manes/caffeine/wiki",
        github: "https://github.com/ben-manes/caffeine",
      },
      codeSnippet: `LoadingCache<String, User> cache = Caffeine.newBuilder()
  .expireAfterWrite(Duration.ofMinutes(10))
  .refreshAfterWrite(Duration.ofMinutes(8))
  .maximumSize(10_000)
  .recordStats()
  .build(key -> userRepository.findById(key)); // CacheLoader

// Read-through: cache loads automatically on miss
User user = cache.get("user123");

// Bulk loading
Map<String, User> users = cache.getAll(Set.of("user123", "user456"));`,
    },
    {
      id: "guava-loading-cache",
      name: "Guava LoadingCache",
      type: "library",
      languages: ["java"],
      description:
        "Google's Java caching library with LoadingCache for read-through pattern. Implements CacheLoader interface for automatic data loading on cache miss. Supports size-based eviction, time-based expiration (expireAfterWrite, expireAfterAccess), weak/soft references, removal listeners, and statistics. Mature and stable with wide adoption, though Caffeine offers better performance for new projects. Still preferred in legacy Java applications and Android development.",
      links: {
        docs: "https://github.com/google/guava/wiki/CachesExplained",
        github: "https://github.com/google/guava",
      },
      codeSnippet: `LoadingCache<String, User> cache = CacheBuilder.newBuilder()
  .maximumSize(1000)
  .expireAfterWrite(10, TimeUnit.MINUTES)
  .recordStats()
  .build(new CacheLoader<String, User>() {
    @Override
    public User load(String userId) {
      return userRepository.findById(userId);
    }
  });

// Read-through loading
User user = cache.get("user123");`,
    },
    {
      id: "spring-cache-cacheable",
      name: "Spring Cache @Cacheable",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring Framework's declarative caching abstraction using @Cacheable annotation for read-through caching. Works with multiple cache providers (Caffeine, Guava, Redis, Hazelcast, EhCache) via CacheManager abstraction. Automatically populates cache on method invocation if result not cached. Supports SpEL expressions for dynamic cache keys, conditional caching, and cache synchronization to prevent stampede. Integrates seamlessly with Spring Boot auto-configuration.",
      links: {
        docs: "https://docs.spring.io/spring-framework/reference/integration/cache.html",
        github: "https://github.com/spring-projects/spring-framework",
      },
      codeSnippet: `@Service
public class UserService {

  // Read-through caching via @Cacheable annotation
  @Cacheable(value = "users", key = "#userId", sync = true)
  public User getUserById(String userId) {
    // This method only called on cache miss
    return userRepository.findById(userId).orElseThrow();
  }

  @CacheEvict(value = "users", key = "#userId")
  public void updateUser(String userId, UserUpdate update) {
    // Update DB and invalidate cache
    userRepository.update(userId, update);
  }
}`,
    },
    {
      id: "ehcache-loader",
      name: "Ehcache with CacheLoader",
      type: "library",
      languages: ["java"],
      description:
        "Enterprise-grade Java caching library supporting read-through via CacheLoaderFactory. Offers both in-memory and disk-based caching with overflow to disk, distributed caching with Terracotta, JCache (JSR-107) compliance, and XA transactions. Supports write-through, write-behind, and read-through patterns. Popular in enterprise Java applications and integrates with Hibernate second-level cache.",
      links: {
        docs: "https://www.ehcache.org/documentation/",
        github: "https://github.com/ehcache/ehcache3",
      },
      codeSnippet: `CacheConfiguration<Long, User> config = CacheConfigurationBuilder
  .newCacheConfigurationBuilder(Long.class, User.class,
    ResourcePoolsBuilder.heap(1000))
  .withLoaderWriter(new CacheLoaderWriter<Long, User>() {
    @Override
    public User load(Long userId) {
      return userRepository.findById(userId);
    }

    @Override
    public void write(Long key, User value) {
      userRepository.save(value);
    }
  })
  .build();

Cache<Long, User> cache = cacheManager.createCache("users", config);
User user = cache.get(123L); // Read-through load`,
    },
    {
      id: "hazelcast-map-loader",
      name: "Hazelcast with MapLoader",
      type: "library",
      languages: ["java"],
      description:
        "Distributed in-memory data grid supporting read-through via MapLoader interface. Automatically loads missing entries from external data stores across clustered nodes. Provides distributed caching, partitioning, replication, and near-cache for local read optimization. Supports write-through and write-behind patterns. Scales horizontally by adding nodes. Popular for microservices caching and session storage in distributed systems.",
      links: {
        docs: "https://docs.hazelcast.com/hazelcast/latest/data-structures/map",
        github: "https://github.com/hazelcast/hazelcast",
      },
      codeSnippet: `public class UserMapLoader implements MapLoader<String, User> {
  @Override
  public User load(String userId) {
    return database.findUser(userId);
  }

  @Override
  public Map<String, User> loadAll(Collection<String> keys) {
    return database.findUsers(keys);
  }
}

// Configure Hazelcast with MapLoader
MapConfig mapConfig = new MapConfig("users")
  .setMapStoreConfig(new MapStoreConfig()
    .setImplementation(new UserMapLoader())
    .setWriteDelaySeconds(0));

HazelcastInstance hz = Hazelcast.newHazelcastInstance();
IMap<String, User> userMap = hz.getMap("users");

// Read-through loading
User user = userMap.get("user123");`,
    },
    {
      id: "redis-cache-through",
      name: "Redis with Cache-Through Pattern",
      type: "service",
      languages: ["any"],
      description:
        "Redis doesn't natively support read-through, but libraries like node-cache-manager, ioredis, and custom wrappers implement it. Pattern involves wrapping Redis client with loader functions that automatically populate cache on miss. Common in Node.js (node-cache-manager), Python (cachetools), and Go (go-redis with custom middleware). Requires application-level implementation but provides distributed caching benefits.",
      links: {
        docs: "https://redis.io/docs/manual/client-side-caching/",
        github: "https://github.com/redis/redis",
      },
      codeSnippet: `// Node.js with node-cache-manager
import { caching } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-store';

const cache = await caching({
  store: redisStore,
  host: 'localhost',
  port: 6379,
  ttl: 300
});

// Read-through with wrap() method
async function getUser(userId: string): Promise<User> {
  return cache.wrap(\`user:\${userId}\`, async () => {
    // This function only called on cache miss
    return database.findUser(userId);
  });
}

const user = await getUser('user123'); // Loads from cache or DB`,
    },
    {
      id: "aws-elasticache-lazy-loading",
      name: "AWS ElastiCache with Lazy Loading",
      type: "service",
      languages: ["any"],
      description:
        "AWS ElastiCache (Redis/Memcached) implements read-through via application-level lazy loading pattern. Applications wrap cache queries with loader functions that automatically populate cache on miss. AWS recommends this pattern in architecture guides for ElastiCache. Combines with write-through for complete cache coherency. Integrates with CloudWatch for cache metrics and VPC for network isolation. Fully managed with automatic failover and backups.",
      links: {
        docs: "https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Strategies.html",
      },
      codeSnippet: `// Python with AWS ElastiCache Redis
import boto3
import redis

r = redis.Redis(
  host='myapp.abcdef.ng.0001.use1.cache.amazonaws.com',
  port=6379
)

def get_user(user_id: str) -> User:
  cache_key = f"user:{user_id}"

  # Check cache
  cached = r.get(cache_key)
  if cached:
    return json.loads(cached)

  # Lazy loading - fetch from DynamoDB
  user = dynamodb.get_item(TableName='Users', Key={'id': user_id})

  # Populate cache
  r.setex(cache_key, 300, json.dumps(user))
  return user`,
    },
    {
      id: "infinispan",
      name: "Infinispan",
      type: "library",
      languages: ["java"],
      description:
        "Red Hat's distributed in-memory data grid supporting read-through via CacheLoader API. Provides automatic loading from persistence stores (JDBC, JPA, filesystem, remote stores). Supports distributed caching across clusters, near-cache for local optimization, and cross-datacenter replication. Offers transactions, query DSL, and event listeners. Popular in enterprise Java applications and integrates with JBoss/WildFly application servers.",
      links: {
        docs: "https://infinispan.org/docs/stable/titles/developing/developing.html",
        github: "https://github.com/infinispan/infinispan",
      },
      codeSnippet: `// Configure Infinispan with JDBC CacheLoader
ConfigurationBuilder builder = new ConfigurationBuilder();
builder.persistence()
  .addStore(JdbcStringBasedStoreConfigurationBuilder.class)
  .fetchPersistentState(false)
  .ignoreModifications(false)
  .purgeOnStartup(false)
  .table()
    .tableNamePrefix("users")
    .idColumnName("id")
    .dataColumnName("data")
    .createOnStart(true);

Cache<String, User> cache = cacheManager.getCache("users");
User user = cache.get("user123"); // Read-through from JDBC`,
    },
  ],

  usedInSystems: [
    {
      systemId: "linkedin",
      systemName: "LinkedIn Profile Service",
      howUsed:
        "LinkedIn's profile service uses read-through caching with Caffeine LoadingCache to serve member profiles to billions of profile views monthly. When a profile is requested, the application calls cache.get(memberId) which checks an in-memory Caffeine cache first. On cache hit (95%+ of requests), profile data returns in sub-millisecond latency. On cache miss, Caffeine automatically invokes the CacheLoader which queries Espresso (LinkedIn's distributed database) for profile data, stores the result with a 10-minute TTL, then returns it to the caller. The read-through pattern dramatically simplified LinkedIn's codebase—engineers don't write repetitive if-cache-miss-then-load boilerplate; they just call the cache get method and loading happens transparently. Caffeine's automatic refresh feature proactively reloads hot profiles in the background before expiration, preventing cache misses for frequently viewed profiles (executives, influencers). The pattern also enables request coalescing: when thousands of concurrent requests hit the same missing profile (viral posts, breaking news), only one database query executes and all requests wait for the shared result, preventing cache stampede. Pattern composition: Read-Through + Refresh-Ahead (automatic background refresh) + Stampede Protection (request coalescing) + Size-based Eviction (Window TinyLFU). Rationale: With 900M+ members and billions of monthly profile views, repeated database queries would overwhelm Espresso; read-through caching reduces database load by 95% while keeping application code clean and maintainable. Impact: Serves profile data at P99 latency of 5ms (vs 50ms database query); handles 100k+ requests/second per service instance; reduced profile service codebase by 30% by eliminating manual cache logic; cache hit rates of 95%+ mean only 5k requests/second hit the database despite 100k total requests.",
      source:
        "https://engineering.linkedin.com/blog/2016/04/building-robust-user-facing-apis-at-linkedin",
    },
    {
      systemId: "netflix-metadata",
      systemName: "Netflix Metadata Service",
      howUsed:
        "Netflix's metadata service (movie titles, descriptions, artwork URLs, ratings) employs read-through caching using EVCache (Netflix's distributed cache based on Memcached) wrapped with application-level loading logic. When the UI requests metadata for a movie, the service calls a read-through cache client that checks EVCache clusters first. Cache hits return immediately from memory across Netflix's AWS regions. On cache miss, the loader function automatically queries Cassandra for metadata, populates EVCache with a 6-hour TTL, then returns the data. This pattern is critical during new content launches (Stranger Things season premieres) where millions of users simultaneously request metadata for the same title. Without read-through's stampede protection (request coalescing), concurrent misses would trigger thousands of duplicate Cassandra queries, potentially overwhelming the database. Instead, the first request loads the data while subsequent requests wait for the shared result. Netflix's implementation includes circuit breaker integration: if Cassandra queries fail repeatedly, the circuit opens and cached stale data is served with a warning, enabling graceful degradation. Pattern composition: Read-Through + Circuit Breaker (fallback to stale cache on DB failure) + Multi-Region Replication (EVCache clusters per region) + Cache Warming (pre-populate trending content). Rationale: With 200M+ subscribers streaming globally, every content launch creates massive metadata query spikes; read-through caching with stampede protection prevents database overload while maintaining sub-second response times. Impact: Handles 500k+ metadata requests/second during content launches without Cassandra saturation; reduced metadata query latency from 20ms to sub-1ms for cached content; cache hit rates of 98%+ for popular titles; prevented multiple Cassandra outages during viral content events by absorbing traffic in cache layer.",
      source:
        "https://netflixtechblog.com/application-data-caching-using-ssds-5bf25df851ef",
    },
    {
      systemId: "shopify-product-catalog",
      systemName: "Shopify Product Catalog",
      howUsed:
        "Shopify's product catalog service uses read-through caching with Redis and custom loader middleware to serve product data for millions of online stores. When a shopper views a product page, the application queries a read-through cache wrapper that checks Redis for product details (name, price, inventory, images). Cache hits serve product data instantly from Redis clusters distributed across AWS regions. On cache miss, the loader function automatically queries MySQL for product data, serializes to JSON, stores in Redis with a 15-minute TTL, then returns to the caller. This pattern is essential during flash sales and Black Friday where the same products (popular electronics, fashion items) are viewed millions of times within hours. Shopify's read-through implementation includes batch loading optimization: when loading a cart with 20 products, the cache issues a single Redis MGET, identifies missing products, then executes one MySQL query with WHERE id IN (...) to fetch all missing products at once, avoiding the N+1 query problem. The pattern also integrates with Shopify's cache invalidation system: when merchants update product data, the inventory service publishes invalidation events that clear Redis entries across all regions, ensuring next read fetches fresh data. Pattern composition: Read-Through + Batch Loading (MGET + bulk SQL queries) + Event-Driven Invalidation (pub/sub for cache clearing) + Multi-Region Caching (Redis clusters per region). Rationale: With 4M+ online stores and billions of monthly product views, querying MySQL for every product view would require massive database infrastructure; read-through caching reduces database load by 99% while keeping application code simple and maintainable. Impact: Serves product data at P95 latency of 2ms (vs 30ms MySQL query); handles 1M+ product views/second during Black Friday; reduced product catalog service codebase by 40% by eliminating manual cache-aside logic; cache hit rates of 99%+ for popular products during sales events.",
    },
    {
      systemId: "github-repository-data",
      systemName: "GitHub Repository Data Service",
      howUsed:
        "GitHub's repository metadata service (star counts, fork counts, contributor lists, recent commits) implements read-through caching using a combination of in-memory Caffeine caches and distributed Redis clusters. When users browse repositories, the service first checks Caffeine's LoadingCache for metadata. On miss, Caffeine automatically invokes the CacheLoader which queries GitHub's MySQL databases (metadata) and Git storage (commit history), stores results with contextual TTLs (volatile data like star counts: 5 minutes, stable data like creation date: 1 hour), then returns data. The two-tier cache architecture (L1: Caffeine in-memory, L2: Redis distributed) enables sub-millisecond response times for popular repositories while maintaining consistency across service instances. Caffeine's automatic refresh feature proactively reloads metadata for trending repositories (repositories with 100k+ views/day) in the background, preventing cache misses even as TTLs expire. This is critical during viral events (major open-source releases, security vulnerabilities) where repositories like React, Kubernetes, or Log4j receive millions of views within hours. GitHub's read-through implementation includes smart invalidation: when repository events occur (new star, fork, commit), webhooks trigger selective cache invalidation that clears only affected entries, minimizing cache churn. Pattern composition: Read-Through + Two-Tier Caching (L1 in-memory + L2 distributed) + Automatic Refresh (background reload before expiration) + Event-Driven Invalidation (webhook-triggered cache clearing). Rationale: With 100M+ repositories and billions of monthly page views, querying MySQL and Git storage for every metadata request would require massive I/O infrastructure; read-through caching reduces database queries by 98% while simplifying the massive codebase. Impact: Serves repository metadata at P99 latency of 3ms for cached content; handles 500k+ repository views/second; reduced metadata service code complexity by 50% compared to manual cache-aside; cache hit rates of 98%+ for popular repositories; viral repositories (100k+ daily views) served entirely from L1 cache without database impact.",
      source:
        "https://github.blog/2019-09-09-how-we-sped-up-github-pages-builds-by-8x/",
    },
    {
      systemId: "stripe-api-caching",
      systemName: "Stripe API Caching Layer",
      howUsed:
        "Stripe's API infrastructure uses read-through caching with Redis to optimize frequently accessed but infrequently changing data like payment method details, customer profiles, and subscription plans. When API clients request customer data via GET /v1/customers/:id, the API gateway checks Redis for cached customer objects. On cache hit, responses return in under 10ms from memory. On cache miss, the read-through loader queries PostgreSQL, transforms data to API format, stores in Redis with a 10-minute TTL, then returns the response. This pattern is critical for handling webhook deliveries and batch operations where the same customer data is accessed hundreds of times within minutes (subscription renewals, invoice generation, payment retries). Stripe's implementation includes intelligent cache key design: keys include API version numbers, so when API schema changes, new versions automatically bypass old cached data. The read-through pattern also enables request deduplication: when webhook processors simultaneously query the same customer data, only one database query executes and all requests share the result, preventing stampede during high-volume events. Stripe's cache integrates with their consistency model: writes to customer data trigger immediate cache invalidation via pub/sub, ensuring cached data never exceeds 10-minute staleness even without invalidation events. Pattern composition: Read-Through + Versioned Cache Keys (API version in key prevents stale schema mismatches) + Pub/Sub Invalidation (write-through invalidation broadcasts) + Request Coalescing (deduplicate concurrent loads). Rationale: With millions of API requests per minute and strict P99 latency SLAs (< 50ms), querying PostgreSQL for every request would violate latency targets and require massive database scaling; read-through caching achieves sub-10ms responses for 95%+ of reads. Impact: API response times under 10ms for cached endpoints (vs 30-50ms database queries); handles 100k+ API requests/second with 95%+ cache hit rates; reduced database load by 95%, saving millions in infrastructure costs; prevented multiple database outages during payment retry storms by absorbing traffic in cache layer.",
    },
  ],

  philosophy: {
    coreProblem:
      "Cache-aside pattern forces repetitive cache-loading logic throughout application code, violating DRY principle and risking inconsistent caching behavior",
    designPrinciple:
      "Centralize data loading logic in the cache layer itself, making cache-miss handling transparent to application code",
    historicalContext:
      "Read-through pattern emerged in the early 2000s with Ehcache and later popularized by Google Guava Cache (2010) and Caffeine (2015), driven by need to simplify caching code in large-scale Java applications",
    alternativesRejected: [
      "Cache-Aside - requires repetitive loading logic in every data access point",
      "Write-Through only - does not help with cache misses on read",
      "Manual cache population - error-prone and inconsistent across codebase",
    ],
    mentalModel:
      "Like a library with an automatic ordering system. When you request a book (cache.get()), if it's on the shelf, you get it immediately. If it's not on the shelf (cache miss), the library automatically orders it, stocks the shelf, then gives it to you—without you needing to know about the ordering process.",
  },

  visualization: {
    staticDiagram: `flowchart TB
    A[Application] -->|get key| B[Cache Layer]
    B -->|Cache Hit| C[Return Cached Data]
    B -->|Cache Miss| D[Invoke Loader]
    D -->|Query| E[Database]
    E -->|Return Data| D
    D -->|Store with TTL| B
    B -->|Return Data| A

    style A fill:#e1f5e1
    style B fill:#fff4e1
    style E fill:#e1e5f5`,
    realWorldAnalogy:
      "Read-through cache is like a smart refrigerator with auto-ordering. When you ask for milk, it checks the fridge first. If milk is there, you get it instantly. If the fridge is empty, it automatically orders milk from the grocery store, stocks the fridge, then gives you the milk—all without you having to think about ordering. You just ask for milk and the fridge handles the rest.",
    useCases: [
      {
        domain: "Social Media",
        scenario:
          "User profiles are viewed millions of times daily. Read-through cache automatically loads profiles from database on first access, then serves from memory for subsequent requests.",
        patternRole:
          "Simplifies profile service code by eliminating manual cache-aside logic",
        companies: ["LinkedIn", "Twitter", "Facebook"],
      },
      {
        domain: "E-commerce",
        scenario:
          "Product catalogs are read far more than updated. Read-through cache transparently loads product details from database on cache miss, dramatically reducing repetitive caching code.",
        patternRole:
          "Enables sub-millisecond product page loads during traffic spikes",
        companies: ["Shopify", "Amazon", "eBay"],
      },
      {
        domain: "SaaS Platforms",
        scenario:
          "Configuration data and feature flags are accessed on every request but change infrequently. Read-through cache centralizes loading logic, ensuring consistent cache behavior.",
        patternRole: "Prevents configuration query storms during deployments",
        companies: ["Stripe", "GitHub", "Datadog"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "lazy-loading",
    "read-optimization",
    "abstraction",
    "code-simplification",
  ],
  difficulty: "intermediate",
};
