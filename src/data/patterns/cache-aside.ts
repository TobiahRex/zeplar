import type { Pattern } from "../schema";

export const cacheAside: Pattern = {
  id: "cache-aside",
  slug: "cache-aside",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 💾 Caching → 📖 Cache-Aside (Lazy Loading)",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Caching",
    level: 4,
  },

  concept: {
    name: "Cache-Aside",
    emoji: "📦",
    tagline: "Load on demand, cache for speed",
    definition:
      "Cache-Aside (also called Lazy Loading) is a caching strategy where the application code explicitly manages both the cache and the primary data store. Unlike write-through or read-through caching where the cache sits transparently between the application and database, Cache-Aside puts the application in full control of caching logic. The pattern follows a simple flow: when data is requested, the application first checks the cache. On a cache hit, data is returned immediately from fast memory (Redis, Memcached). On a cache miss, the application queries the slower, durable database, then populates the cache with the fetched data before returning it to the caller. This 'load on demand' approach ensures that only actively accessed data occupies limited cache memory, preventing cache pollution from rarely-used records. For writes, the application updates the database first (preserving it as the source of truth), then invalidates or updates the cached entry to prevent stale data. Think of it like keeping your most-used kitchen tools on the counter (cache) rather than walking to the garage toolbox (database) every time—you only bring tools to the counter when you need them, and they stay there until you explicitly remove them.",
    problemSolved:
      "Database queries are orders of magnitude slower than memory lookups—disk I/O takes milliseconds while RAM access takes microseconds. When applications repeatedly fetch the same data (user profiles, product catalogs, configuration settings), every query wastes database resources and adds latency to user requests. As traffic scales, the database becomes a bottleneck: connection pools exhaust, query queues grow, and response times degrade. Cache-Aside solves this by storing hot data in fast, in-memory storage. The first request for an item hits the database (cold cache), but subsequent requests serve from memory at sub-millisecond latency. This dramatically reduces database load—Facebook reported 99%+ cache hit rates for user profiles, meaning only 1 in 100 requests actually query the database. The pattern also provides resilience: if the cache fails, the application degrades gracefully by falling back to the database rather than failing completely. However, it introduces the cache invalidation problem: when data changes, the cache must be updated or invalidated to prevent serving stale data, requiring careful coordination between writes and cache entries.",
    tradeoffs: {
      pros: [
        "Reduces load on the primary data store",
        "Dramatically improves read latency for cached data",
        "Application controls caching logic precisely",
        "Cache failures do not prevent data access",
      ],
      cons: [
        "Data can become stale (cache invalidation is hard)",
        "First request always hits the database (cold cache)",
        "Adds complexity to application code",
        "Requires careful TTL tuning",
      ],
    },
    relatedPatterns: [
      "write-through",
      "write-behind",
      "read-through",
      "refresh-ahead",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Cache Controller",
        responsibilities: [
          "Check cache before querying data store",
          "Populate cache after data store fetch",
          "Invalidate cache when data changes",
        ],
      },
      {
        name: "Cache",
        role: "Fast Storage",
        responsibilities: [
          "Store key-value pairs in memory",
          "Provide fast O(1) lookups",
          "Expire entries based on TTL",
        ],
      },
      {
        name: "Data Store",
        role: "Source of Truth",
        responsibilities: [
          "Persist all data durably",
          "Handle writes and complex queries",
          "Serve cache misses",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant Cache as Cache
    participant DB as Database

    App->>Cache: GET key
    alt Cache Hit
        Cache-->>App: Return data
    else Cache Miss
        Cache-->>App: null
        App->>DB: Query data
        DB-->>App: Return data
        App->>Cache: SET key = data
    end`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Check Cache",
        description: "Look up the requested data in the cache by key",
      },
      {
        step: 2,
        actor: "Cache",
        action: "Return or Miss",
        description: "Return cached data if exists, otherwise indicate miss",
      },
      {
        step: 3,
        actor: "Application",
        action: "Query Database",
        description: "On cache miss, fetch data from the primary data store",
      },
      {
        step: 4,
        actor: "Application",
        action: "Populate Cache",
        description: "Store the fetched data in cache with appropriate TTL",
      },
      {
        step: 5,
        actor: "Application",
        action: "Return Data",
        description: "Return data to the caller (from cache or database)",
      },
    ],
    invariants: [
      "Cache miss must always fall back to data store",
      "Cache should never be the only copy of data",
      "Write operations should invalidate or update cache",
      "TTL should be set to balance freshness and performance",
    ],
  },

  codeExamples: [
    {
      id: "cache-aside-typescript",
      language: "typescript",
      title: "Cache-Aside with Generic Repository",
      description:
        "A generic cache-aside implementation that wraps any data fetcher",
      code: `interface Cache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class CacheAsideRepository<T> {
  constructor(
    private cache: Cache<T>,
    private dataStore: {
      fetch: (id: string) => Promise<T>;
      save: (id: string, data: T) => Promise<void>;
    },
    private ttlSeconds: number = 300
  ) {}

  async get(id: string): Promise<T> {
    // Step 1: Check cache first
    const cached = await this.cache.get(id);
    if (cached !== null) {
      return cached;
    }

    // Step 2: Cache miss - fetch from data store
    const data = await this.dataStore.fetch(id);

    // Step 3: Populate cache for next time
    await this.cache.set(id, data, this.ttlSeconds);

    return data;
  }

  async save(id: string, data: T): Promise<void> {
    // Write to data store first (source of truth)
    await this.dataStore.save(id, data);

    // Invalidate cache to ensure consistency
    await this.cache.delete(id);
  }
}`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "A repository class implementing cache-aside for any entity type",
        prerequisites: [
          "TypeScript generics",
          "Async/await",
          "Repository pattern",
        ],
        systemPosition: "Data access layer between service logic and database",
      },
      annotations: [
        {
          id: "cache-check",
          lines: [17, 21],
          action: "Check cache before hitting the database",
          reason:
            "Cache hits are orders of magnitude faster than database queries—always try cache first",
          contextLevel: "local",
        },
        {
          id: "cache-miss",
          lines: [23, 24],
          action: "Fetch from data store on cache miss",
          reason:
            "The database is the source of truth; cache is just an optimization layer",
          contextLevel: "local",
        },
        {
          id: "cache-populate",
          lines: [26, 27],
          action: "Store fetched data in cache with TTL",
          reason:
            "Subsequent requests for this data will hit the cache instead of the database",
          contextLevel: "local",
          relatedConcepts: ["ttl", "cache-warming"],
        },
        {
          id: "write-invalidate",
          lines: [35, 36],
          action: "Delete from cache after writing to database",
          reason:
            "Invalidation ensures the next read fetches fresh data; prevents serving stale data",
          contextLevel: "module",
          relatedConcepts: ["cache-invalidation", "consistency"],
        },
      ],
      highlights: [
        {
          lines: [17, 27],
          label: "Read path: check cache, fallback to DB, populate cache",
          sbvpDomain: "behavior",
        },
        {
          lines: [31, 36],
          label: "Write path: update DB, invalidate cache",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cache-aside-python-redis",
      language: "python",
      title: "Cache-Aside with Redis and SQLAlchemy",
      description:
        "Production-ready Python implementation using Redis for caching and SQLAlchemy for database access",
      code: `import json
import redis
from typing import Optional, Dict, Any, Callable
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class User:
    id: int
    username: str
    email: str
    profile_data: Dict[str, Any]

class CacheAsideUserRepository:
    """
    Repository implementing Cache-Aside pattern for user data.
    Redis serves as L1 cache, PostgreSQL as source of truth.
    """

    def __init__(
        self,
        redis_client: redis.Redis,
        db_session: Session,
        default_ttl: int = 300  # 5 minutes
    ):
        self.redis = redis_client
        self.db = db_session
        self.default_ttl = default_ttl
        self.cache_key_prefix = "user:"

    def _make_cache_key(self, user_id: int) -> str:
        """Generate consistent cache keys"""
        return f"{self.cache_key_prefix}{user_id}"

    def get_user(self, user_id: int) -> Optional[User]:
        """
        Fetch user with cache-aside pattern:
        1. Check Redis cache first
        2. On miss, query database
        3. Populate cache with result
        """
        cache_key = self._make_cache_key(user_id)

        # Step 1: Check cache first (fast path)
        cached_data = self.redis.get(cache_key)
        if cached_data is not None:
            logger.info(f"Cache HIT for user {user_id}")
            user_dict = json.loads(cached_data)
            return User(**user_dict)

        logger.info(f"Cache MISS for user {user_id}")

        # Step 2: Cache miss - fetch from database (slow path)
        user = self._fetch_from_database(user_id)

        if user is None:
            # Cache negative result to prevent cache penetration attacks
            self.redis.setex(
                cache_key,
                timedelta(seconds=60),  # Shorter TTL for null results
                json.dumps(None)
            )
            return None

        # Step 3: Populate cache for subsequent requests
        self._write_to_cache(cache_key, user, self.default_ttl)

        return user

    def _fetch_from_database(self, user_id: int) -> Optional[User]:
        """Query database for user data"""
        from models import UserModel  # SQLAlchemy model

        stmt = select(UserModel).where(UserModel.id == user_id)
        result = self.db.execute(stmt).scalar_one_or_none()

        if result is None:
            return None

        return User(
            id=result.id,
            username=result.username,
            email=result.email,
            profile_data=result.profile_data
        )

    def _write_to_cache(self, cache_key: str, user: User, ttl: int) -> None:
        """Store user data in Redis with TTL"""
        try:
            user_json = json.dumps(asdict(user))
            self.redis.setex(cache_key, timedelta(seconds=ttl), user_json)
            logger.debug(f"Cached user data at {cache_key} with TTL {ttl}s")
        except Exception as e:
            # Cache write failure should not break the application
            logger.error(f"Failed to write to cache: {e}")

    def update_user(
        self,
        user_id: int,
        update_fn: Callable[[User], User]
    ) -> User:
        """
        Update user with write-through invalidation:
        1. Update database (source of truth)
        2. Invalidate cache entry
        3. Return updated user
        """
        from models import UserModel

        # Fetch current user from database
        stmt = select(UserModel).where(UserModel.id == user_id)
        db_user = self.db.execute(stmt).scalar_one_or_none()

        if db_user is None:
            raise ValueError(f"User {user_id} not found")

        # Convert to domain object and apply updates
        user = User(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            profile_data=db_user.profile_data
        )
        updated_user = update_fn(user)

        # Write to database first (source of truth)
        db_user.username = updated_user.username
        db_user.email = updated_user.email
        db_user.profile_data = updated_user.profile_data
        self.db.commit()

        # Invalidate cache to ensure consistency
        cache_key = self._make_cache_key(user_id)
        self.redis.delete(cache_key)
        logger.info(f"Invalidated cache for user {user_id} after update")

        return updated_user

    def get_multiple_users(self, user_ids: list[int]) -> Dict[int, Optional[User]]:
        """
        Batch fetch users with cache-aside pattern.
        Uses Redis MGET for efficient batch cache lookup.
        """
        cache_keys = [self._make_cache_key(uid) for uid in user_ids]

        # Batch cache lookup with MGET
        cached_values = self.redis.mget(cache_keys)

        results: Dict[int, Optional[User]] = {}
        missing_ids: list[int] = []

        # Process cache hits and identify misses
        for user_id, cached_data in zip(user_ids, cached_values):
            if cached_data is not None:
                user_dict = json.loads(cached_data)
                results[user_id] = User(**user_dict) if user_dict else None
            else:
                missing_ids.append(user_id)

        logger.info(
            f"Batch lookup: {len(user_ids) - len(missing_ids)} hits, "
            f"{len(missing_ids)} misses"
        )

        # Fetch missing users from database
        if missing_ids:
            from models import UserModel

            stmt = select(UserModel).where(UserModel.id.in_(missing_ids))
            db_users = self.db.execute(stmt).scalars().all()

            # Populate cache and results
            for db_user in db_users:
                user = User(
                    id=db_user.id,
                    username=db_user.username,
                    email=db_user.email,
                    profile_data=db_user.profile_data
                )
                results[db_user.id] = user

                # Cache the fetched user
                cache_key = self._make_cache_key(db_user.id)
                self._write_to_cache(cache_key, user, self.default_ttl)

            # Mark remaining IDs as not found
            for user_id in missing_ids:
                if user_id not in results:
                    results[user_id] = None

        return results

# Usage example
def example_usage():
    # Setup
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        db=0,
        decode_responses=False
    )

    from database import get_db_session
    db_session = get_db_session()

    repo = CacheAsideUserRepository(
        redis_client=redis_client,
        db_session=db_session,
        default_ttl=300
    )

    # Read path: cache-aside lookup
    user = repo.get_user(user_id=123)
    if user:
        print(f"Retrieved: {user.username}")

    # Write path: update with cache invalidation
    updated_user = repo.update_user(
        user_id=123,
        update_fn=lambda u: User(
            id=u.id,
            username="new_username",
            email=u.email,
            profile_data=u.profile_data
        )
    )

    # Batch lookup
    users = repo.get_multiple_users([123, 456, 789])
    print(f"Found {len([u for u in users.values() if u])} users")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete repository pattern with Redis caching, batch operations, and error handling",
        prerequisites: [
          "Python dataclasses",
          "Redis client library",
          "SQLAlchemy ORM",
          "Type hints",
        ],
        systemPosition:
          "Data access layer in web service, bridging API handlers and PostgreSQL database with Redis cache",
      },
      annotations: [
        {
          id: "ca-py-cache-check",
          lines: [45, 52],
          action: "Check Redis cache before database query",
          reason:
            "Redis lookup is 100x faster than PostgreSQL query; cache hits avoid expensive database round-trip and connection pool usage",
          contextLevel: "local",
          relatedConcepts: ["redis", "serialization"],
        },
        {
          id: "ca-py-cache-penetration",
          lines: [59, 66],
          action: "Cache negative results (null values) with shorter TTL",
          reason:
            "Prevents cache penetration attacks where malicious actors repeatedly query non-existent IDs to bypass cache and overload database",
          contextLevel: "system",
          relatedConcepts: ["security", "ddos-prevention"],
        },
        {
          id: "ca-py-write-invalidate",
          lines: [135, 140],
          action: "Delete cache entry after database update",
          reason:
            "Invalidation ensures next read fetches fresh data; simpler than cache update which risks consistency issues if update fails",
          contextLevel: "module",
          relatedConcepts: ["cache-invalidation", "eventual-consistency"],
        },
        {
          id: "ca-py-batch-mget",
          lines: [150, 152],
          action: "Use Redis MGET for batch cache lookup",
          reason:
            "MGET fetches multiple keys in one network round-trip; avoids N+1 cache query problem when loading related entities",
          contextLevel: "system",
          relatedConcepts: ["batch-operations", "n-plus-one"],
        },
      ],
      highlights: [
        {
          lines: [45, 73],
          label: "Read path: cache check → database fallback → cache populate",
          sbvpDomain: "behavior",
        },
        {
          lines: [109, 140],
          label: "Write path: database update → cache invalidation",
          sbvpDomain: "behavior",
        },
        {
          lines: [147, 189],
          label: "Batch operations with MGET optimization",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cache-aside-go-inmemory",
      language: "go",
      title: "Cache-Aside with Go In-Memory Cache",
      description:
        "Thread-safe in-memory cache implementation with TTL support and concurrent access patterns",
      code: `package repository

import (
    "context"
    "encoding/json"
    "errors"
    "sync"
    "time"
)

// User domain model
type User struct {
    ID       int64             \`json:"id"\`
    Username string            \`json:"username"\`
    Email    string            \`json:"email"\`
    Metadata map[string]string \`json:"metadata"\`
}

// CacheEntry wraps cached data with expiration metadata
type CacheEntry struct {
    Data      []byte
    ExpiresAt time.Time
}

// InMemoryCache provides thread-safe caching with TTL support
type InMemoryCache struct {
    mu      sync.RWMutex
    entries map[string]*CacheEntry

    // Background cleanup
    cleanupInterval time.Duration
    stopCleanup     chan struct{}
}

func NewInMemoryCache(cleanupInterval time.Duration) *InMemoryCache {
    cache := &InMemoryCache{
        entries:         make(map[string]*CacheEntry),
        cleanupInterval: cleanupInterval,
        stopCleanup:     make(chan struct{}),
    }

    // Start background cleanup goroutine
    go cache.cleanupExpiredEntries()

    return cache
}

func (c *InMemoryCache) Get(key string) ([]byte, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    entry, exists := c.entries[key]
    if !exists {
        return nil, false
    }

    // Check if entry has expired
    if time.Now().After(entry.ExpiresAt) {
        return nil, false
    }

    return entry.Data, true
}

func (c *InMemoryCache) Set(key string, data []byte, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()

    c.entries[key] = &CacheEntry{
        Data:      data,
        ExpiresAt: time.Now().Add(ttl),
    }
}

func (c *InMemoryCache) Delete(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()

    delete(c.entries, key)
}

func (c *InMemoryCache) cleanupExpiredEntries() {
    ticker := time.NewTicker(c.cleanupInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            c.mu.Lock()
            now := time.Now()
            for key, entry := range c.entries {
                if now.After(entry.ExpiresAt) {
                    delete(c.entries, key)
                }
            }
            c.mu.Unlock()
        case <-c.stopCleanup:
            return
        }
    }
}

func (c *InMemoryCache) Close() {
    close(c.stopCleanup)
}

// Database interface (your actual DB implementation)
type UserDatabase interface {
    GetUserByID(ctx context.Context, id int64) (*User, error)
    UpdateUser(ctx context.Context, user *User) error
}

// UserRepository implements cache-aside pattern
type UserRepository struct {
    cache *InMemoryCache
    db    UserDatabase
    ttl   time.Duration
}

func NewUserRepository(db UserDatabase, ttl time.Duration) *UserRepository {
    return &UserRepository{
        cache: NewInMemoryCache(1 * time.Minute),
        db:    db,
        ttl:   ttl,
    }
}

func (r *UserRepository) cacheKey(userID int64) string {
    return fmt.Sprintf("user:%d", userID)
}

func (r *UserRepository) GetUser(ctx context.Context, userID int64) (*User, error) {
    key := r.cacheKey(userID)

    // Step 1: Check cache first (read lock for concurrent reads)
    if cached, found := r.cache.Get(key); found {
        var user User
        if err := json.Unmarshal(cached, &user); err != nil {
            // Corrupted cache entry - delete and fallback to DB
            r.cache.Delete(key)
        } else {
            // Cache hit - return immediately
            return &user, nil
        }
    }

    // Step 2: Cache miss - fetch from database
    user, err := r.db.GetUserByID(ctx, userID)
    if err != nil {
        return nil, fmt.Errorf("database query failed: %w", err)
    }

    if user == nil {
        return nil, errors.New("user not found")
    }

    // Step 3: Populate cache for next time
    if data, err := json.Marshal(user); err == nil {
        r.cache.Set(key, data, r.ttl)
    }
    // Note: Cache write failure is non-fatal - we still return the user

    return user, nil
}

func (r *UserRepository) UpdateUser(ctx context.Context, user *User) error {
    // Step 1: Update database first (source of truth)
    if err := r.db.UpdateUser(ctx, user); err != nil {
        return fmt.Errorf("database update failed: %w", err)
    }

    // Step 2: Invalidate cache entry to prevent stale reads
    key := r.cacheKey(user.ID)
    r.cache.Delete(key)

    return nil
}

// GetUsers demonstrates batch cache lookup pattern
func (r *UserRepository) GetUsers(
    ctx context.Context,
    userIDs []int64,
) (map[int64]*User, error) {
    results := make(map[int64]*User)
    missingIDs := []int64{}

    // Check cache for each user
    for _, id := range userIDs {
        key := r.cacheKey(id)
        if cached, found := r.cache.Get(key); found {
            var user User
            if err := json.Unmarshal(cached, &user); err == nil {
                results[id] = &user
                continue
            }
        }
        missingIDs = append(missingIDs, id)
    }

    // Fetch missing users from database
    if len(missingIDs) > 0 {
        // In production, implement batch database query
        for _, id := range missingIDs {
            user, err := r.db.GetUserByID(ctx, id)
            if err != nil {
                continue // Skip failed lookups
            }
            if user != nil {
                results[id] = user

                // Cache the fetched user
                if data, err := json.Marshal(user); err == nil {
                    r.cache.Set(r.cacheKey(id), data, r.ttl)
                }
            }
        }
    }

    return results, nil
}

// Usage example
func ExampleUsage() {
    // Setup repository with 5-minute cache TTL
    db := &PostgresUserDB{} // Your database implementation
    repo := NewUserRepository(db, 5*time.Minute)

    ctx := context.Background()

    // First call: cache miss, queries database
    user1, err := repo.GetUser(ctx, 123)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("User: %s\\n", user1.Username)

    // Second call: cache hit, returns from memory
    user2, err := repo.GetUser(ctx, 123)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("User: %s (from cache)\\n", user2.Username)

    // Update invalidates cache
    user1.Email = "new@example.com"
    if err := repo.UpdateUser(ctx, user1); err != nil {
        log.Fatal(err)
    }

    // Next read will be cache miss and fetch fresh data
    user3, err := repo.GetUser(ctx, 123)
    fmt.Printf("User: %s (fresh from DB)\\n", user3.Username)

    // Batch lookup
    users, _ := repo.GetUsers(ctx, []int64{123, 456, 789})
    fmt.Printf("Loaded %d users\\n", len(users))
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete in-memory cache implementation with TTL, background cleanup, and repository pattern",
        prerequisites: [
          "Go concurrency (goroutines, channels)",
          "Mutexes and read-write locks",
          "JSON serialization",
          "Context pattern",
        ],
        systemPosition:
          "Data access layer in Go microservice, providing cached database access for HTTP handlers",
      },
      annotations: [
        {
          id: "ca-go-rwmutex",
          lines: [26, 27],
          action:
            "Use RWMutex to allow concurrent reads while protecting writes",
          reason:
            "Read-write lock enables multiple goroutines to read cache simultaneously while ensuring exclusive access for writes; critical for high-throughput services",
          contextLevel: "system",
          relatedConcepts: ["concurrency", "thread-safety", "performance"],
        },
        {
          id: "ca-go-cleanup",
          lines: [79, 98],
          action: "Background goroutine periodically removes expired entries",
          reason:
            "In-memory caches grow unbounded without cleanup; ticker-based goroutine prevents memory leaks while avoiding overhead of checking expiration on every read",
          contextLevel: "system",
          relatedConcepts: ["memory-management", "goroutines"],
        },
        {
          id: "ca-go-cache-lookup",
          lines: [136, 148],
          action: "Check cache with corruption handling",
          reason:
            "Cache corruption (invalid JSON) should not break application; detect and recover by deleting bad entry and falling back to database",
          contextLevel: "module",
          relatedConcepts: ["error-handling", "resilience"],
        },
        {
          id: "ca-go-non-fatal-cache",
          lines: [162, 164],
          action: "Treat cache write failure as non-fatal",
          reason:
            "Cache is an optimization, not critical path; if marshaling fails, we still return the user data successfully retrieved from database",
          contextLevel: "system",
          relatedConcepts: ["cache-resilience", "graceful-degradation"],
        },
      ],
      highlights: [
        {
          lines: [26, 46],
          label: "Thread-safe cache structure with background cleanup",
          sbvpDomain: "structure",
        },
        {
          lines: [136, 166],
          label: "Cache-aside read path with corruption handling",
          sbvpDomain: "behavior",
        },
        {
          lines: [168, 178],
          label: "Write-through invalidation pattern",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cache-aside-node-cache-library",
      language: "typescript",
      title: "Cache-Aside with node-cache Library",
      description:
        "Production implementation using node-cache for rapid prototyping and single-instance applications",
      code: `import NodeCache from 'node-cache';
import { promisify } from 'util';
import type { Database } from './database';

// Domain model
interface Product {
  id: string;
  name: string;
  price: number;
  inventory: number;
  category: string;
  lastUpdated: Date;
}

// Cache statistics for monitoring
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keyCount: number;
}

/**
 * ProductRepository implementing Cache-Aside with node-cache.
 *
 * node-cache provides:
 * - Automatic TTL expiration
 * - In-memory storage (fast but non-distributed)
 * - Built-in statistics tracking
 * - Event emitters for cache lifecycle
 *
 * Best for: Single-instance apps, development, low-latency prototypes
 * Not for: Distributed systems (use Redis instead)
 */
export class ProductRepository {
  private cache: NodeCache;
  private db: Database;

  // Metrics tracking
  private metrics = {
    hits: 0,
    misses: 0,
    dbQueries: 0,
    cacheWrites: 0,
    invalidations: 0,
  };

  constructor(
    db: Database,
    options: {
      ttlSeconds?: number;
      checkPeriod?: number;
      maxKeys?: number;
    } = {}
  ) {
    this.db = db;

    // Configure node-cache with best practices
    this.cache = new NodeCache({
      stdTTL: options.ttlSeconds ?? 300,        // Default 5 minutes
      checkperiod: options.checkPeriod ?? 60,   // Cleanup every 60s
      useClones: true,                          // Deep clone to prevent mutations
      deleteOnExpire: true,                     // Auto-delete expired
      maxKeys: options.maxKeys ?? 10000,        // Prevent unbounded growth
    });

    // Set up event listeners for observability
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Track when keys expire
    this.cache.on('expired', (key: string, value: unknown) => {
      console.log(\`Cache key expired: \${key}\`);
    });

    // Alert when cache is flushed
    this.cache.on('flush', () => {
      console.warn('Cache flushed - all keys deleted');
      this.metrics.hits = 0;
      this.metrics.misses = 0;
    });

    // Monitor memory warnings
    this.cache.on('del', (key: string, value: unknown) => {
      console.debug(\`Cache key deleted: \${key}\`);
    });
  }

  private cacheKey(productId: string): string {
    return \`product:\${productId}\`;
  }

  /**
   * Get product with cache-aside pattern.
   * Demonstrates: cache check → DB fallback → cache populate
   */
  async getProduct(productId: string): Promise<Product | null> {
    const key = this.cacheKey(productId);

    // Step 1: Check cache first
    const cached = this.cache.get<Product>(key);

    if (cached !== undefined) {
      this.metrics.hits++;
      console.log(\`Cache HIT for product \${productId}\`);
      return cached;
    }

    this.metrics.misses++;
    console.log(\`Cache MISS for product \${productId}\`);

    // Step 2: Cache miss - query database
    this.metrics.dbQueries++;
    const product = await this.db.query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      // Cache negative results to prevent cache penetration
      this.cache.set(key, null, 60); // Shorter TTL for nulls
      return null;
    }

    // Step 3: Populate cache with TTL
    this.metrics.cacheWrites++;
    this.cache.set(key, product);

    return product;
  }

  /**
   * Update product with write-through cache invalidation.
   * Demonstrates: DB update → cache invalidate
   */
  async updateProduct(
    productId: string,
    updates: Partial<Omit<Product, 'id'>>
  ): Promise<Product> {
    // Step 1: Update database (source of truth)
    const updated = await this.db.query<Product>(
      \`UPDATE products
       SET name = COALESCE($2, name),
           price = COALESCE($3, price),
           inventory = COALESCE($4, inventory),
           last_updated = NOW()
       WHERE id = $1
       RETURNING *\`,
      [productId, updates.name, updates.price, updates.inventory]
    );

    if (!updated) {
      throw new Error(\`Product \${productId} not found\`);
    }

    // Step 2: Invalidate cache to ensure consistency
    const key = this.cacheKey(productId);
    const deleted = this.cache.del(key);

    if (deleted > 0) {
      this.metrics.invalidations++;
      console.log(\`Invalidated cache for product \${productId}\`);
    }

    return updated;
  }

  /**
   * Batch get with intelligent cache utilization.
   * Uses cache.mget() for efficient multi-key lookup.
   */
  async getProducts(productIds: string[]): Promise<Map<string, Product>> {
    const results = new Map<string, Product>();
    const cacheKeys = productIds.map((id) => this.cacheKey(id));

    // Batch cache lookup with mget
    const cachedData = this.cache.mget<Product>(cacheKeys);

    // Identify cache hits and misses
    const missingIds: string[] = [];

    for (const productId of productIds) {
      const key = this.cacheKey(productId);
      const cached = cachedData[key];

      if (cached !== undefined) {
        this.metrics.hits++;
        results.set(productId, cached);
      } else {
        this.metrics.misses++;
        missingIds.push(productId);
      }
    }

    console.log(
      \`Batch lookup: \${productIds.length - missingIds.length} hits, \${
        missingIds.length
      } misses\`
    );

    // Fetch missing products from database
    if (missingIds.length > 0) {
      this.metrics.dbQueries++;
      const dbProducts = await this.db.query<Product[]>(
        'SELECT * FROM products WHERE id = ANY($1)',
        [missingIds]
      );

      // Populate cache and results
      for (const product of dbProducts) {
        results.set(product.id, product);
        this.cache.set(this.cacheKey(product.id), product);
        this.metrics.cacheWrites++;
      }
    }

    return results;
  }

  /**
   * Warm cache with frequently accessed products.
   * Useful after deployment or cache flush.
   */
  async warmCache(productIds: string[]): Promise<void> {
    console.log(\`Warming cache for \${productIds.length} products\`);

    const products = await this.db.query<Product[]>(
      'SELECT * FROM products WHERE id = ANY($1)',
      [productIds]
    );

    for (const product of products) {
      this.cache.set(this.cacheKey(product.id), product);
      this.metrics.cacheWrites++;
    }

    console.log(\`Cache warmed with \${products.length} products\`);
  }

  /**
   * Invalidate cache entries by pattern (category, etc.)
   */
  invalidateByCategory(category: string): number {
    const keys = this.cache.keys();
    let deleted = 0;

    for (const key of keys) {
      const product = this.cache.get<Product>(key);
      if (product?.category === category) {
        this.cache.del(key);
        deleted++;
      }
    }

    this.metrics.invalidations += deleted;
    console.log(\`Invalidated \${deleted} products in category \${category}\`);

    return deleted;
  }

  /**
   * Get cache statistics for monitoring and alerting
   */
  getStats(): CacheStats {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0
      ? this.metrics.hits / totalRequests
      : 0;

    const nodeStats = this.cache.getStats();

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: hitRate,
      keyCount: nodeStats.keys,
    };
  }

  /**
   * Reset cache and metrics (useful for testing)
   */
  reset(): void {
    this.cache.flushAll();
    this.metrics = {
      hits: 0,
      misses: 0,
      dbQueries: 0,
      cacheWrites: 0,
      invalidations: 0,
    };
  }
}

// Usage examples
async function exampleUsage() {
  const db = new Database(/* config */);
  const repo = new ProductRepository(db, {
    ttlSeconds: 300,    // 5 minutes
    maxKeys: 5000,      // Limit to 5000 products in cache
  });

  // Single product lookup
  const product = await repo.getProduct('prod_123');
  if (product) {
    console.log(\`Product: \${product.name} - $\${product.price}\`);
  }

  // Update with automatic cache invalidation
  await repo.updateProduct('prod_123', {
    price: 29.99,
    inventory: 100,
  });

  // Batch lookup
  const products = await repo.getProducts([
    'prod_123',
    'prod_456',
    'prod_789',
  ]);
  console.log(\`Loaded \${products.size} products\`);

  // Cache warming for popular products
  await repo.warmCache(['prod_001', 'prod_002', 'prod_003']);

  // Monitor cache performance
  const stats = repo.getStats();
  console.log(\`Cache hit rate: \${(stats.hitRate * 100).toFixed(2)}%\`);
  console.log(\`Total keys: \${stats.keyCount}\`);

  // Alert if hit rate drops below threshold
  if (stats.hitRate < 0.7) {
    console.warn('Low cache hit rate detected!');
  }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready repository with node-cache library, monitoring, batch operations, and cache warming strategies",
        prerequisites: [
          "Node.js event emitters",
          "node-cache library",
          "TypeScript generics",
          "Async/await patterns",
        ],
        systemPosition:
          "Service layer in Node.js API server, providing cached product catalog access with observability",
      },
      annotations: [
        {
          id: "ca-lib-config",
          lines: [58, 66],
          action: "Configure node-cache with production best practices",
          reason:
            "useClones prevents cache pollution from object mutations; maxKeys prevents unbounded memory growth; checkperiod enables automatic cleanup of expired entries",
          contextLevel: "system",
          relatedConcepts: [
            "memory-management",
            "cache-configuration",
            "production-readiness",
          ],
        },
        {
          id: "ca-lib-events",
          lines: [71, 88],
          action: "Set up event listeners for cache lifecycle monitoring",
          reason:
            "Cache events provide observability into expirations, deletions, and flushes; critical for debugging cache-related issues and monitoring cache health",
          contextLevel: "system",
          relatedConcepts: ["observability", "event-driven", "monitoring"],
        },
        {
          id: "ca-lib-mget",
          lines: [183, 186],
          action: "Use cache.mget() for efficient batch cache lookup",
          reason:
            "mget retrieves multiple keys in one operation; avoids N separate cache lookups when loading related products or batch processing",
          contextLevel: "module",
          relatedConcepts: ["batch-operations", "performance"],
        },
        {
          id: "ca-lib-warming",
          lines: [225, 241],
          action: "Implement cache warming for frequently accessed data",
          reason:
            "Proactively loading hot data prevents thundering herd problem after deployment/restart; ensures high cache hit rates from service start",
          contextLevel: "system",
          relatedConcepts: ["cache-warming", "cold-start", "thundering-herd"],
        },
      ],
      highlights: [
        {
          lines: [58, 88],
          label: "Library configuration and event monitoring setup",
          sbvpDomain: "structure",
        },
        {
          lines: [99, 132],
          label: "Cache-aside pattern with node-cache API",
          sbvpDomain: "behavior",
        },
        {
          lines: [225, 241],
          label: "Cache warming strategy for cold start mitigation",
          sbvpDomain: "philosophy",
        },
        {
          lines: [269, 282],
          label: "Statistics and monitoring for cache health",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Service Layer",
      "Data Access Layer",
      "API Handlers",
      "Read Replicas",
    ],
    interactsWith: [
      "write-through",
      "circuit-breaker",
      "rate-limiting",
      "database-connection-pool",
    ],
    architecturalBoundaries: [
      "Between application and database",
      "Between services and external APIs",
      "At API gateway for response caching",
    ],
  },

  implementations: [
    {
      id: "redis",
      name: "Redis",
      type: "service",
      languages: ["any"],
      description:
        "In-memory data structure store used as cache, message broker, and streaming engine. Supports rich data types (strings, hashes, lists, sets, sorted sets), TTL expiration, pub/sub, transactions, and Lua scripting. Highly performant with sub-millisecond latency. Offers persistence options (RDB snapshots, AOF logs) and clustering for horizontal scaling.",
      links: {
        docs: "https://redis.io/docs/",
        github: "https://github.com/redis/redis",
      },
      codeSnippet: `import redis
from datetime import timedelta

# Python redis-py client
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_user(user_id: int):
    cache_key = f"user:{user_id}"

    # Check cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Cache miss - fetch from DB
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)

    # Populate cache with 5 minute TTL
    r.setex(cache_key, timedelta(minutes=5), json.dumps(user))
    return user

def update_user(user_id: int, data: dict):
    # Update database first
    db.execute("UPDATE users SET ... WHERE id = %s", user_id)

    # Invalidate cache
    r.delete(f"user:{user_id}")`,
    },
    {
      id: "memcached",
      name: "Memcached",
      type: "service",
      languages: ["any"],
      description:
        "High-performance distributed memory caching system designed for simplicity and speed. Uses LRU eviction when memory is full. No persistence, no replication, no complex data structures—just simple key-value storage optimized for read-heavy workloads. Multi-threaded architecture for excellent CPU utilization. Widely used by Facebook, Twitter, Wikipedia.",
      links: {
        docs: "https://memcached.org/",
        github: "https://github.com/memcached/memcached",
      },
      codeSnippet: `from pymemcache.client import base

# Python pymemcache client
client = base.Client(('localhost', 11211))

def get_product(product_id: str):
    cache_key = f"product:{product_id}"

    # Check cache
    cached = client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Fetch from database
    product = db.query("SELECT * FROM products WHERE id = %s", product_id)

    # Cache with 10 minute TTL
    client.set(cache_key, json.dumps(product), expire=600)
    return product

# Best for: Simple key-value caching, session storage, page fragments
# When to use: Need distributed cache across multiple servers,
#              read-heavy workload, simple data structures suffice`,
    },
    {
      id: "node-cache",
      name: "node-cache",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Simple in-process caching module for Node.js with automatic key expiration and statistics tracking. Supports event emitters for cache lifecycle hooks (set, expired, del, flush). Configurable memory limits and cleanup intervals. Best for single-instance applications or development environments.",
      links: {
        npm: "https://www.npmjs.com/package/node-cache",
        github: "https://github.com/node-cache/node-cache",
      },
      codeSnippet: `import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,      // 5 minutes default
  checkperiod: 60,  // Cleanup every 60s
  useClones: true   // Deep clone values
});

async function getProduct(productId: string) {
  const key = \`product:\${productId}\`;

  // Check cache
  const cached = cache.get(key);
  if (cached) return cached;

  // Fetch from DB
  const product = await db.query('SELECT * FROM products WHERE id = $1', [productId]);

  // Store in cache
  cache.set(key, product);
  return product;
}

// Best for: Single-instance apps, development, prototyping
// When to use: No need for distributed cache, low memory footprint OK`,
    },
    {
      id: "caffeine",
      name: "Caffeine",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "High-performance Java caching library providing near-optimal hit rates through Window TinyLFU eviction policy. Supports automatic loading, asynchronous computation, size-based and time-based eviction, weak keys/values, and removal notifications. Built for Java 8+ with CompletableFuture support. Significantly faster than Guava Cache in benchmarks.",
      links: {
        docs: "https://github.com/ben-manes/caffeine/wiki",
        github: "https://github.com/ben-manes/caffeine",
      },
      codeSnippet: `import com.github.benmanes.caffeine.cache.*;
import java.time.Duration;

// Manual cache with explicit loading
Cache<String, User> userCache = Caffeine.newBuilder()
    .expireAfterWrite(Duration.ofMinutes(5))
    .maximumSize(10_000)
    .recordStats()
    .build();

public User getUser(String userId) {
    // Check cache, load if absent
    return userCache.get(userId, key -> {
        // This function called only on cache miss
        return database.queryUser(key);
    });
}

// LoadingCache for automatic population
LoadingCache<String, User> autoCache = Caffeine.newBuilder()
    .expireAfterWrite(Duration.ofMinutes(5))
    .build(userId -> database.queryUser(userId));

User user = autoCache.get("user123");  // Loads automatically on miss

// Best for: JVM applications, high-throughput services, Spring Boot apps
// When to use: Need advanced eviction policies, high performance, detailed stats`,
    },
    {
      id: "guava-cache",
      name: "Guava Cache",
      type: "library",
      languages: ["java"],
      description:
        "Google's in-memory caching library for Java with LoadingCache and manual Cache implementations. Supports size-based eviction, time-based expiration (write/access), weak/soft references, removal listeners, and statistics. Widely adopted in Java ecosystem. Mature and stable, but Caffeine offers better performance for new projects.",
      links: {
        docs: "https://github.com/google/guava/wiki/CachesExplained",
        github: "https://github.com/google/guava",
      },
      codeSnippet: `import com.google.common.cache.*;
import java.util.concurrent.TimeUnit;

// LoadingCache with automatic loading
LoadingCache<String, User> cache = CacheBuilder.newBuilder()
    .maximumSize(1000)
    .expireAfterWrite(10, TimeUnit.MINUTES)
    .recordStats()
    .removalListener(notification -> {
        System.out.println("Removed: " + notification.getKey());
    })
    .build(new CacheLoader<String, User>() {
        @Override
        public User load(String userId) throws Exception {
            return userRepository.findById(userId);
        }
    });

// Usage - loads from DB on cache miss
User user = cache.get("user123");

// Invalidate on update
public void updateUser(User user) {
    userRepository.save(user);
    cache.invalidate(user.getId());
}

// Best for: Legacy Java apps, existing Guava users, stable APIs
// When to use: Already using Guava utilities, need battle-tested solution`,
    },
    {
      id: "django-cache",
      name: "Django Cache Framework",
      type: "framework",
      languages: ["python"],
      description:
        "Django's built-in caching framework with pluggable backends (Memcached, Redis, Database, Filesystem, Local Memory). Provides per-site cache, per-view cache, template fragment caching, and low-level cache API. Integrates seamlessly with Django ORM and middleware. Supports cache key versioning and automatic cache invalidation.",
      links: {
        docs: "https://docs.djangoproject.com/en/stable/topics/cache/",
        github: "https://github.com/django/django",
      },
      codeSnippet: `# settings.py - Configure Redis backend
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'myapp',
        'TIMEOUT': 300,  # 5 minutes
    }
}

# Low-level cache API
from django.core.cache import cache

def get_user_profile(user_id):
    cache_key = f'user_profile_{user_id}'

    # Try cache first
    profile = cache.get(cache_key)
    if profile is not None:
        return profile

    # Cache miss - query database
    profile = UserProfile.objects.get(id=user_id)

    # Store in cache
    cache.set(cache_key, profile, timeout=300)
    return profile

# Invalidate on update
def update_profile(user_id, data):
    UserProfile.objects.filter(id=user_id).update(**data)
    cache.delete(f'user_profile_{user_id}')

# Best for: Django web applications, Python REST APIs
# When to use: Building Django apps, need framework integration`,
    },
    {
      id: "aspnet-memory-cache",
      name: "ASP.NET Memory Cache",
      type: "framework",
      languages: ["csharp"],
      description:
        ".NET in-memory caching abstraction with IMemoryCache interface. Supports absolute/sliding expiration, cache priorities, size limits, and eviction callbacks. Dependency injection friendly. Available in ASP.NET Core and .NET 5+. Best for single-server deployments; use IDistributedCache (Redis, SQL Server) for multi-server scenarios.",
      links: {
        docs: "https://learn.microsoft.com/en-us/aspnet/core/performance/caching/memory",
        github: "https://github.com/dotnet/runtime",
      },
      codeSnippet: `using Microsoft.Extensions.Caching.Memory;

public class UserService
{
    private readonly IMemoryCache _cache;
    private readonly IUserRepository _repository;

    public UserService(IMemoryCache cache, IUserRepository repository)
    {
        _cache = cache;
        _repository = repository;
    }

    public async Task<User> GetUserAsync(string userId)
    {
        var cacheKey = $"user:{userId}";

        // Try get from cache
        if (_cache.TryGetValue(cacheKey, out User cachedUser))
            return cachedUser;

        // Cache miss - fetch from database
        var user = await _repository.GetByIdAsync(userId);

        // Cache with sliding expiration
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromMinutes(5))
            .SetAbsoluteExpiration(TimeSpan.FromHours(1))
            .RegisterPostEvictionCallback(OnEviction);

        _cache.Set(cacheKey, user, cacheOptions);
        return user;
    }

    public async Task UpdateUserAsync(User user)
    {
        await _repository.UpdateAsync(user);
        _cache.Remove($"user:{user.Id}");
    }

    private void OnEviction(object key, object value,
        EvictionReason reason, object state)
    {
        Console.WriteLine($"Cache entry {key} evicted: {reason}");
    }
}

// Best for: .NET web APIs, ASP.NET Core apps, single-instance services
// When to use: Building .NET apps, need framework DI integration`,
    },
    {
      id: "varnish",
      name: "Varnish Cache",
      type: "platform",
      languages: ["any"],
      description:
        "HTTP accelerator and reverse proxy designed for caching web content. Sits between clients and web servers, caching full HTTP responses. Uses VCL (Varnish Configuration Language) for flexible cache policies. Handles millions of requests per second. Supports edge side includes (ESI), gzip compression, and health checks. Used by high-traffic sites like The New York Times, Wikipedia, and Tumblr.",
      links: {
        docs: "https://varnish-cache.org/docs/",
        github: "https://github.com/varnishcache/varnish-cache",
      },
      codeSnippet: `# VCL configuration for cache-aside HTTP caching
vcl 4.1;

backend default {
    .host = "127.0.0.1";
    .port = "8080";
}

sub vcl_recv {
    # Only cache GET and HEAD requests
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    # Don't cache authenticated requests
    if (req.http.Authorization || req.http.Cookie) {
        return (pass);
    }
}

sub vcl_backend_response {
    # Cache successful responses for 5 minutes
    if (beresp.status == 200) {
        set beresp.ttl = 5m;
        set beresp.http.Cache-Control = "public, max-age=300";
    }

    # Don't cache errors
    if (beresp.status >= 400) {
        set beresp.ttl = 0s;
    }
}

# Invalidate cache via PURGE requests
sub vcl_recv {
    if (req.method == "PURGE") {
        return (purge);
    }
}

# Best for: High-traffic websites, API gateways, CDN origin shields
# When to use: Need HTTP-level caching, handle millions req/sec, reduce origin load`,
    },
    {
      id: "cloudflare-cdn",
      name: "Cloudflare CDN Cache",
      type: "service",
      languages: ["any"],
      description:
        "Global edge caching network with 300+ data centers worldwide. Automatically caches static assets; configurable caching for dynamic content via Cache Rules and Workers. Supports cache purging (single URL, tags, wildcard, full), tiered caching, and custom cache keys. Provides analytics on cache hit rates. Free tier available; enterprise features include custom cache TTLs and bypass cache on cookie.",
      links: {
        docs: "https://developers.cloudflare.com/cache/",
      },
      codeSnippet: `// Cloudflare Worker - Custom cache-aside logic
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)

  // Check cache first
  let response = await cache.match(cacheKey)

  if (!response) {
    // Cache miss - fetch from origin
    response = await fetch(request)

    // Cache successful responses
    if (response.ok) {
      const clonedResponse = response.clone()
      const headers = new Headers(clonedResponse.headers)
      headers.set('Cache-Control', 'public, max-age=300')

      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      })

      event.waitUntil(cache.put(cacheKey, cachedResponse))
    }
  }

  return response
}

// Cache invalidation via API
// curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache"
//   -H "Authorization: Bearer {token}"
//   -d '{"files":["https://example.com/api/users/123"]}'

// Best for: Global web apps, static sites, API responses, image/video delivery
// When to use: Need edge caching, reduce latency worldwide, DDoS protection`,
    },
    {
      id: "fastly-cdn",
      name: "Fastly CDN",
      type: "service",
      languages: ["any"],
      description:
        "Programmable edge cloud platform with instant cache purging (150ms globally). Uses Varnish under the hood but adds real-time purging, VCL customization, and edge compute via Compute@Edge (WebAssembly). Supports surrogate keys for bulk invalidation, streaming logs, and A/B testing at edge. Preferred by developer-focused companies like GitHub, Stripe, and Shopify.",
      links: {
        docs: "https://developer.fastly.com/reference/cache/",
      },
      codeSnippet: `# Fastly VCL - Custom cache-aside configuration
sub vcl_recv {
  # Cache based on URL and query params
  set req.http.X-Cache-Key = req.url;

  # Bypass cache for authenticated users
  if (req.http.Cookie:session_id) {
    return(pass);
  }
}

sub vcl_fetch {
  # Cache API responses for 5 minutes
  if (beresp.http.Content-Type ~ "application/json") {
    set beresp.ttl = 300s;
    set beresp.http.Surrogate-Key = "api " req.url.path;
  }

  # Stale-while-revalidate: serve stale for 24h, revalidate in background
  set beresp.stale_while_revalidate = 24h;
}

# Instant cache purging via API (150ms global propagation)
# curl -X POST https://api.fastly.com/service/{service_id}/purge/api/users/123
#   -H "Fastly-Key: {api_token}"

# Surrogate key purging (invalidate all API responses)
# curl -X POST https://api.fastly.com/service/{service_id}/purge/api
#   -H "Fastly-Key: {api_token}"

// Best for: Real-time apps, developer platforms, media streaming, e-commerce
// When to use: Need instant cache invalidation, VCL customization, edge compute`,
    },
    {
      id: "aws-elasticache",
      name: "AWS ElastiCache",
      type: "service",
      languages: ["any"],
      description:
        "Fully managed in-memory caching service supporting Redis and Memcached. Handles provisioning, patching, backups, monitoring, and failure recovery. Redis mode offers clustering (sharding), replication, Multi-AZ failover, encryption, and Redis 7.x features. Integrates with CloudWatch for metrics and VPC for network isolation. Pay-per-use pricing with reserved instance discounts.",
      links: {
        docs: "https://docs.aws.amazon.com/elasticache/",
      },
      codeSnippet: `# Python boto3 - ElastiCache Redis client
import boto3
import redis

# Connect to ElastiCache Redis cluster
r = redis.Redis(
    host='myapp.abcdef.ng.0001.use1.cache.amazonaws.com',
    port=6379,
    decode_responses=True,
    ssl=True,
    ssl_cert_reqs=None
)

def get_user_data(user_id):
    cache_key = f"user:{user_id}"

    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Fetch from RDS/DynamoDB
    user = dynamodb.get_item(TableName='Users', Key={'id': user_id})

    # Cache with TTL
    r.setex(cache_key, 300, json.dumps(user))
    return user

# Terraform configuration for ElastiCache cluster
resource "aws_elasticache_cluster" "app_cache" {
  cluster_id           = "myapp-cache"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  # Multi-AZ with automatic failover
  automatic_failover_enabled = true

  # Encryption at rest and in transit
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

// Best for: AWS-hosted apps, microservices on ECS/EKS, serverless with Lambda
// When to use: Already on AWS, need managed cache, want automatic failover`,
    },
    {
      id: "azure-cache-redis",
      name: "Azure Cache for Redis",
      type: "service",
      languages: ["any"],
      description:
        "Fully managed Redis service on Azure with enterprise-grade SLA (99.9% uptime). Supports Redis clustering, geo-replication, persistence (RDB/AOF), and private endpoint connectivity. Offers Premium tier with Redis Enterprise features: active-active geo-distribution, RediSearch, RedisJSON, RedisBloom. Integrates with Azure Monitor, Key Vault, and Virtual Networks. Automatic patching and scaling.",
      links: {
        docs: "https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/",
      },
      codeSnippet: `// C# - Azure Cache for Redis with StackExchange.Redis
using StackExchange.Redis;

public class CacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _cache;

    public CacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _cache = redis.GetDatabase();
    }

    public async Task<User> GetUserAsync(string userId)
    {
        var cacheKey = $"user:{userId}";

        // Check cache
        var cached = await _cache.StringGetAsync(cacheKey);
        if (cached.HasValue)
        {
            return JsonSerializer.Deserialize<User>(cached);
        }

        // Fetch from Cosmos DB or SQL Database
        var user = await _cosmosRepository.GetUserAsync(userId);

        // Cache with 5 minute expiration
        await _cache.StringSetAsync(
            cacheKey,
            JsonSerializer.Serialize(user),
            TimeSpan.FromMinutes(5)
        );

        return user;
    }

    public async Task UpdateUserAsync(User user)
    {
        await _cosmosRepository.UpdateAsync(user);
        await _cache.KeyDeleteAsync($"user:{user.Id}");
    }
}

# Azure CLI - Create Premium Redis cache with geo-replication
az redis create \\
  --resource-group myResourceGroup \\
  --name myPremiumCache \\
  --location eastus \\
  --sku Premium \\
  --vm-size P1 \\
  --enable-non-ssl-port false \\
  --zones 1 2

// Best for: Azure-hosted apps, .NET applications, globally distributed systems
// When to use: On Azure cloud, need geo-replication, enterprise Redis features`,
    },
  ],

  usedInSystems: [
    {
      systemId: "facebook",
      systemName: "Facebook Social Network",
      howUsed:
        "Facebook operates one of the world's largest Memcached deployments, processing billions of cache requests per second across thousands of servers. The social graph—friendships, likes, comments, profile data—is queried constantly but changes infrequently, making it ideal for cache-aside. When a user loads their news feed, the application first checks Memcached clusters for friend profiles, post metadata, and interaction counts. On cache hits (99%+ of requests), data returns in sub-millisecond latency from RAM. On cache misses, MySQL/TAO databases are queried and results populate Memcached with TTLs ranging from 5 minutes (volatile data like online status) to hours (stable data like profile photos). Facebook's architecture uses regional Memcached pools with consistent hashing for key distribution. Pattern composition: Cache-Aside + Lease-Get Protocol (prevents thundering herd) + Invalidation via McSqueal (database commit log parser) + Geographic Replication. Rationale: With 3 billion users generating trillions of social graph queries daily, databases cannot handle this load; cache-aside reduces database queries by 99%, enabling horizontal scaling through cheap commodity cache servers. Impact: Handles 1 billion cache requests per second; reduced average page load time from 2.5s to under 1s; enabled scaling from 100M to 3B users without proportional database infrastructure growth; cache hit rates above 99% mean only 1 in 100 requests hit expensive databases.",
      source:
        "https://engineering.fb.com/2013/06/25/core-data/scaling-memcache-at-facebook/",
    },
    {
      systemId: "twitter",
      systemName: "Twitter Social Network",
      howUsed:
        "Twitter employs Redis extensively in cache-aside configuration for timeline assembly and tweet delivery. When users load their timeline, Twitter's fanout service checks Redis for cached timeline fragments containing tweet IDs. Cache hits return timelines instantly; cache misses trigger queries to Manhattan (Twitter's distributed database) and populate Redis with 10-minute TTLs. Tweet content itself is cached separately—when rendering a timeline of 50 tweets, the system performs batch Redis lookups (MGET) for tweet text, media URLs, author profiles, and engagement counts. Cache misses fetch from primary storage and warm the cache. During viral events (breaking news, celebrity tweets), Redis absorbs massive read spikes that would crush databases. Pattern composition: Cache-Aside + Probabilistic Early Expiration (prevents cache stampede) + Batch Operations (MGET/MSET for efficiency) + Redis Cluster (automatic sharding). Rationale: Twitter's timeline queries are read-heavy (500M tweets/day but billions of timeline views); cache-aside enables serving timelines in under 200ms while protecting databases during traffic spikes of 100k+ tweets per second. Impact: Reduced timeline assembly latency from 800ms to sub-200ms; handled Super Bowl traffic (10x normal load) without database saturation; cache hit rates of 95%+ for tweet metadata; enabled real-time delivery of breaking news to 300M+ concurrent users during global events.",
      source:
        "https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/turbocharging-the-timeline",
    },
    {
      systemId: "instagram",
      systemName: "Instagram Photo Sharing",
      howUsed:
        "Instagram leverages Redis in cache-aside pattern to handle image metadata queries for billions of photos. When users scroll their feed, the app requests image metadata (URLs, captions, like counts, poster info) which first hits Redis clusters. Cache hits return instantly from memory; misses query Cassandra datastores and populate Redis with 30-minute TTLs for stable metadata and 5-minute TTLs for volatile engagement metrics. High-resolution image URLs are particularly cache-hot since the same photo appears in multiple feeds (follower timelines, explore page, hashtag results). Instagram employs multi-layer caching: L1 cache in CDN edge nodes, L2 cache in regional Redis clusters, L3 fallback to origin Cassandra. During viral post explosions (celebrity posts getting millions of views in minutes), cache-aside prevents database overload by serving hot content from memory. Pattern composition: Cache-Aside + CDN Caching (multi-tier) + Lazy Loading (only cache viewed content) + Probabilistic Cache Warming (pre-populate trending content). Rationale: With 2 billion users sharing 95 million photos daily, every photo metadata query hitting the database would require massive infrastructure; cache-aside enables serving metadata at Instagram's scale using 1/100th the database capacity. Impact: Reduced P95 feed load latency from 1.2s to 300ms; cache hit rates of 98%+ for image metadata; handled 1 billion daily active users with minimal database scaling; viral posts (10M+ views in first hour) served entirely from cache without database impact.",
      source:
        "https://instagram-engineering.com/what-powers-instagram-hundreds-of-instances-dozens-of-technologies-adf2e22da2ad",
    },
    {
      systemId: "stackoverflow",
      systemName: "Stack Overflow Q&A Platform",
      howUsed:
        "Stack Overflow implements cache-aside using Redis to optimize question and answer delivery. When users view a question page, the application checks Redis for cached HTML fragments containing question text, answers, vote counts, and user reputation. Cache hits (85%+ of requests) serve instantly; misses query SQL Server databases, render HTML, and cache with TTLs based on content age (old questions cached for hours, active questions for minutes). Accepted answers and high-vote content are cached aggressively since they rarely change but are viewed millions of times. Stack Overflow's architecture caches at multiple granularities: full-page HTML for anonymous users, partial fragments for authenticated users, and raw data objects for API clients. Pattern composition: Cache-Aside + Fragment Caching (cache reusable HTML blocks) + Smart Invalidation (purge cache on edits/votes) + Tag-based Invalidation (clear related questions when tags update). Rationale: Stack Overflow serves 100M+ monthly visitors with a surprisingly small infrastructure (10 web servers); cache-aside enables this efficiency by preventing repeated database queries for popular questions viewed thousands of times daily. Impact: Reduced database CPU usage by 90%; serves 5,000 requests/second with sub-50ms response times; scaled from 10M to 100M monthly users without major database upgrades; cache hit rates of 85%+ mean only 750 requests/second hit the database despite 5k total requests/second.",
      source: "https://stackexchange.com/performance",
    },
    {
      systemId: "github",
      systemName: "GitHub Code Hosting Platform",
      howUsed:
        "GitHub employs Redis in cache-aside pattern to optimize repository metadata queries across 100M+ repositories. When users browse repositories, the application checks Redis for cached repository stats (star counts, fork counts, contributor lists, recent commits). Cache hits return metadata instantly; misses trigger queries to MySQL/Git datastores and populate Redis with contextual TTLs (stable data like creation date cached for hours, volatile data like star counts for minutes). File tree navigation is heavily cached—when browsing popular repositories like React or TensorFlow (millions of views), the same file structures are served from Redis rather than repeatedly parsing Git objects. Pattern composition: Cache-Aside + Conditional Caching (only cache public repos) + Cache Layering (CDN + Redis + database) + Background Cache Warming (pre-populate trending repos). Rationale: With 100 million repositories and billions of monthly page views, every metadata query hitting Git storage would require massive I/O; cache-aside reduces Git object database load by 95%, enabling responsive browsing even for repositories with complex histories. Impact: Reduced repository page load times from 800ms to 200ms for cached content; handles 1 billion monthly page views with 95%+ cache hit rates; viral repositories (100k+ daily views) served entirely from cache; reduced Git storage I/O by 95%, extending disk lifespan and reducing infrastructure costs by millions annually.",
      source:
        "https://github.blog/2019-09-09-how-we-sped-up-github-pages-builds-by-8x/",
    },
  ],

  philosophy: {
    coreProblem:
      "Databases are slow and expensive to scale; memory is fast but limited and volatile",
    designPrinciple:
      "Keep hot data in fast storage while using durable storage as the source of truth",
    historicalContext:
      "Caching became essential as web applications scaled beyond what single databases could handle in the 2000s",
    alternativesRejected: [
      "No caching - databases become bottleneck",
      "Write-through only - complex for read-heavy workloads",
      "Cache as source of truth - data loss on cache failure",
    ],
    mentalModel:
      "Like keeping frequently used tools on your workbench instead of walking to the toolshed every time. The toolshed (database) has everything, but the workbench (cache) has what you need right now.",
  },

  visualization: {
    staticDiagram: `flowchart LR
    A[Request] --> B{In Cache?}
    B -->|Yes| C[Return Cached]
    B -->|No| D[Query DB]
    D --> E[Store in Cache]
    E --> F[Return Data]`,
    realWorldAnalogy:
      "Cache-Aside is like keeping a copy of your favorite recipes on the kitchen counter. When you want to cook, you check the counter first. If the recipe is not there, you go get it from the cookbook shelf, then leave a copy on the counter for next time.",
    useCases: [
      {
        domain: "Social Media",
        scenario:
          "User profile data is requested millions of times per day. Cache-Aside stores profiles in Redis, reducing database load by 99%.",
        patternRole:
          "Enables sub-millisecond response times for profile lookups",
        companies: ["Facebook", "Twitter", "Instagram"],
      },
      {
        domain: "E-commerce",
        scenario:
          "Product catalog pages are viewed far more often than updated. Cache-Aside serves product details from memory, hitting the database only for cache misses.",
        patternRole:
          "Handles traffic spikes during sales without database overload",
        companies: ["Amazon", "eBay", "Shopify"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "read-optimization",
    "scalability",
    "latency",
  ],
  difficulty: "beginner",
};
