import type { Pattern } from "../schema";

export const writeThrough: Pattern = {
  id: "write-through",
  slug: "write-through",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 💾 Caching → ✍️ Write-Through",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Caching",
    level: 4,
  },

  concept: {
    name: "Write-Through Cache",
    emoji: "✍️",
    tagline: "Write once, store twice, stay consistent",
    definition:
      "Write-Through is a caching strategy where write operations update both the cache and the underlying data store synchronously in a single atomic transaction. Unlike Cache-Aside where the application manages cache population separately, Write-Through treats the cache as a mandatory intermediary—every write flows through the cache layer which then propagates it to the database. When the application writes data, the cache layer accepts the write, stores it in fast memory, and immediately forwards it to the persistent data store before acknowledging success to the caller. Only after both storage layers confirm the write does the operation complete. This dual-write approach guarantees strong consistency between cache and database: the cache never contains stale data because it's updated atomically with the source of truth. The pattern eliminates the cache invalidation problem that plagues Cache-Aside—there's never a window where cache and database disagree. However, this consistency comes at a cost: write latency increases since every write must complete two storage operations sequentially. For read-heavy workloads where data rarely changes but must remain perfectly consistent when it does (user profiles, configuration settings, product catalogs), Write-Through provides the best of both worlds—fast reads from cache, guaranteed consistency on writes, and simplified application logic since cache management is transparent.",
    problemSolved:
      "Cache-Aside patterns suffer from the notorious cache invalidation problem: after updating the database, the application must remember to invalidate or update the cached copy. Miss this step, and users see stale data. Race conditions compound the problem—if two concurrent writes update the database in sequence but invalidate cache in reverse order, the cache ends up with outdated data. Debugging these consistency bugs is nightmarish because they're intermittent and environment-dependent. Write-Through eliminates this entire class of bugs by making cache updates atomic with database writes. The cache layer coordinates the dual write, ensuring both succeed or both fail. Applications gain strong consistency guarantees without complex invalidation logic scattered across business code. The pattern also simplifies recovery: since cache is always consistent with the database, cold starts are graceful—populate cache on first read rather than hoping it's warm. However, Write-Through introduces write amplification: every write becomes two writes, doubling write latency. For write-heavy workloads, this overhead can be prohibitive. The pattern also requires transactional support: if the database write succeeds but cache write fails (or vice versa), the system must rollback to prevent split-brain consistency issues. Despite these tradeoffs, Write-Through shines for read-heavy systems where data changes infrequently but consistency is non-negotiable.",
    tradeoffs: {
      pros: [
        "Strong consistency between cache and database",
        "Eliminates complex cache invalidation logic",
        "Cache always contains fresh data after writes",
        "Simplified application code without manual cache management",
        "Graceful recovery from cache failures",
      ],
      cons: [
        "Higher write latency due to synchronous dual writes",
        "Write amplification—every write hits both storage layers",
        "Wasted cache writes for data that's never read",
        "Requires transactional coordination between cache and database",
        "Database still bottleneck for write throughput",
      ],
    },
    relatedPatterns: [
      "write-back",
      "cache-aside",
      "read-through",
      "write-behind",
      "refresh-ahead",
      "two-phase-commit",
      "database-replication",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Client",
        responsibilities: [
          "Issue write requests to cache layer",
          "Handle success/failure responses",
          "Read data through cache or directly",
        ],
      },
      {
        name: "Cache",
        role: "Write Coordinator",
        responsibilities: [
          "Accept write requests from application",
          "Update local cache storage",
          "Forward writes to database synchronously",
          "Rollback cache on database write failure",
        ],
      },
      {
        name: "Database",
        role: "Source of Truth",
        responsibilities: [
          "Persist all data durably",
          "Confirm or reject write operations",
          "Serve as fallback for cache misses",
        ],
      },
      {
        name: "Cache Entry",
        role: "Data Holder",
        responsibilities: [
          "Store key-value pairs in memory",
          "Track TTL and expiration metadata",
          "Support atomic updates",
        ],
      },
      {
        name: "Write Coordinator",
        role: "Transaction Manager",
        responsibilities: [
          "Coordinate dual writes atomically",
          "Handle rollback on partial failures",
          "Maintain consistency invariants",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant Cache as Cache Layer
    participant DB as Database

    App->>Cache: WRITE key=value
    Cache->>Cache: Update cache entry
    Cache->>DB: WRITE key=value
    alt Database Success
        DB-->>Cache: ACK
        Cache-->>App: Success
    else Database Failure
        DB-->>Cache: NACK/Error
        Cache->>Cache: Rollback cache entry
        Cache-->>App: Failure
    end

    App->>Cache: READ key
    alt Cache Hit
        Cache-->>App: Return cached value
    else Cache Miss
        Cache->>DB: SELECT key
        DB-->>Cache: Return value
        Cache->>Cache: Populate cache
        Cache-->>App: Return value
    end`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Write Request",
        description: "Application issues write operation to cache layer",
      },
      {
        step: 2,
        actor: "Cache",
        action: "Update Cache",
        description:
          "Cache layer updates in-memory entry with new value immediately",
      },
      {
        step: 3,
        actor: "Cache",
        action: "Forward to Database",
        description:
          "Cache synchronously writes to database, waiting for confirmation",
      },
      {
        step: 4,
        actor: "Database",
        action: "Process Write",
        description: "Database persists data and returns success or error",
      },
      {
        step: 5,
        actor: "Cache",
        action: "Confirm or Rollback",
        description:
          "On success, confirm to application; on failure, rollback cache and propagate error",
      },
      {
        step: 6,
        actor: "Application",
        action: "Read Request",
        description: "Application reads data, checking cache first",
      },
      {
        step: 7,
        actor: "Cache",
        action: "Serve from Cache",
        description:
          "Cache hit returns immediately; cache miss fetches from database and populates cache",
      },
      {
        step: 8,
        actor: "Application",
        action: "Receive Data",
        description:
          "Application receives data with guarantee of consistency with database",
      },
    ],
    invariants: [
      "Cache and database always consistent after successful writes",
      "Write operations are atomic across cache and database",
      "Failed writes must rollback cache to prevent inconsistency",
      "Cache entries never contain data newer than database",
    ],
  },

  codeExamples: [
    {
      id: "wt-typescript-redis-pg",
      language: "typescript",
      title: "Write-Through Cache with Redis and PostgreSQL",
      description:
        "Production-grade write-through implementation with transaction support and rollback handling",
      code: `import Redis from 'ioredis';
import { Pool, PoolClient } from 'pg';

// Domain model
interface User {
  id: string;
  username: string;
  email: string;
  profile: {
    displayName: string;
    bio: string;
    avatarUrl: string;
  };
  updatedAt: Date;
}

// Write-through cache configuration
interface CacheConfig {
  ttlSeconds: number;
  enableRollback: boolean;
  writeTimeout: number;
}

/**
 * Write-Through Cache Repository for User entities.
 *
 * Guarantees strong consistency between Redis cache and PostgreSQL database
 * through synchronous dual writes with automatic rollback on failure.
 */
export class WriteThroughUserRepository {
  private redis: Redis;
  private pgPool: Pool;
  private config: CacheConfig;

  // Metrics for monitoring write performance
  private metrics = {
    writeThroughSuccess: 0,
    writeThroughFailure: 0,
    rollbackCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(
    redis: Redis,
    pgPool: Pool,
    config: CacheConfig = {
      ttlSeconds: 300,
      enableRollback: true,
      writeTimeout: 5000,
    }
  ) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.config = config;
  }

  private cacheKey(userId: string): string {
    return \`user:wt:\${userId}\`;
  }

  /**
   * Write-Through update: writes to cache AND database synchronously.
   *
   * Action: Coordinate atomic write across Redis and PostgreSQL
   * Reason: Ensures cache never contains data inconsistent with database;
   *         eliminates stale data bugs from async invalidation
   * Context Level: module
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const client = await this.pgPool.connect();
    const cacheKey = this.cacheKey(userId);
    let previousCacheValue: string | null = null;

    try {
      // Step 1: Read current state for rollback capability
      if (this.config.enableRollback) {
        previousCacheValue = await this.redis.get(cacheKey);
      }

      // Step 2: Begin database transaction
      await client.query('BEGIN');

      // Step 3: Update database (source of truth)
      const updateResult = await client.query<User>(
        \`UPDATE users
         SET username = COALESCE($2, username),
             email = COALESCE($3, email),
             profile = COALESCE($4::jsonb, profile),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *\`,
        [userId, updates.username, updates.email, JSON.stringify(updates.profile)]
      );

      if (updateResult.rows.length === 0) {
        throw new Error(\`User \${userId} not found\`);
      }

      const updatedUser = this.mapRowToUser(updateResult.rows[0]);

      // Step 4: Write to cache AFTER database confirms success
      // Action: Update Redis with latest data from database
      // Reason: Cache should reflect committed database state, not speculative updates;
      //         prevents cache pollution if database write fails validation
      // Context Level: system
      await this.redis.setex(
        cacheKey,
        this.config.ttlSeconds,
        JSON.stringify(updatedUser)
      );

      // Step 5: Commit database transaction
      await client.query('COMMIT');

      this.metrics.writeThroughSuccess++;
      return updatedUser;
    } catch (error) {
      // Rollback database transaction
      await client.query('ROLLBACK');

      // Action: Restore previous cache state on transaction failure
      // Reason: If database write fails, cache must rollback to prevent
      //         serving data that doesn't exist in source of truth;
      //         maintains cache-database consistency invariant
      // Context Level: system
      if (this.config.enableRollback && previousCacheValue !== null) {
        await this.redis.setex(
          cacheKey,
          this.config.ttlSeconds,
          previousCacheValue
        );
        this.metrics.rollbackCount++;
      } else if (this.config.enableRollback) {
        // No previous value—delete cache entry
        await this.redis.del(cacheKey);
      }

      this.metrics.writeThroughFailure++;
      throw new Error(\`Write-through failed: \${error.message}\`);
    } finally {
      client.release();
    }
  }

  /**
   * Create user with write-through pattern.
   *
   * Action: Insert into database first, then populate cache
   * Reason: Database generates ID and timestamps; cache should store
   *         complete record with all server-generated fields
   * Context Level: module
   */
  async createUser(userData: Omit<User, 'id' | 'updatedAt'>): Promise<User> {
    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Insert into database (generates ID, timestamps)
      const insertResult = await client.query<User>(
        \`INSERT INTO users (username, email, profile, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *\`,
        [userData.username, userData.email, JSON.stringify(userData.profile)]
      );

      const newUser = this.mapRowToUser(insertResult.rows[0]);

      // Write to cache after successful database insert
      await this.redis.setex(
        this.cacheKey(newUser.id),
        this.config.ttlSeconds,
        JSON.stringify(newUser)
      );

      await client.query('COMMIT');
      this.metrics.writeThroughSuccess++;

      return newUser;
    } catch (error) {
      await client.query('ROLLBACK');
      this.metrics.writeThroughFailure++;
      throw new Error(\`User creation failed: \${error.message}\`);
    } finally {
      client.release();
    }
  }

  /**
   * Read path: check cache first, fallback to database on miss.
   * Simpler than cache-aside because writes maintain consistency.
   */
  async getUser(userId: string): Promise<User | null> {
    const cacheKey = this.cacheKey(userId);

    // Action: Check cache first for fast path
    // Reason: Cache guaranteed consistent due to write-through updates;
    //         safe to serve cached data without staleness concerns
    // Context Level: local
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.metrics.cacheHits++;
      return JSON.parse(cached) as User;
    }

    this.metrics.cacheMisses++;

    // Cache miss—fetch from database
    const result = await this.pgPool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = this.mapRowToUser(result.rows[0]);

    // Populate cache for subsequent reads
    await this.redis.setex(
      cacheKey,
      this.config.ttlSeconds,
      JSON.stringify(user)
    );

    return user;
  }

  /**
   * Delete user with write-through pattern.
   *
   * Action: Delete from database first, then remove from cache
   * Reason: Database is source of truth; cache should reflect deletion
   *         atomically to prevent serving deleted records
   * Context Level: module
   */
  async deleteUser(userId: string): Promise<void> {
    const client = await this.pgPool.connect();
    const cacheKey = this.cacheKey(userId);

    try {
      await client.query('BEGIN');

      // Delete from database
      const deleteResult = await client.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
      );

      if (deleteResult.rowCount === 0) {
        throw new Error(\`User \${userId} not found\`);
      }

      // Remove from cache after successful database deletion
      await this.redis.del(cacheKey);

      await client.query('COMMIT');
      this.metrics.writeThroughSuccess++;
    } catch (error) {
      await client.query('ROLLBACK');
      this.metrics.writeThroughFailure++;
      throw new Error(\`User deletion failed: \${error.message}\`);
    } finally {
      client.release();
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      profile: row.profile,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get performance metrics for monitoring.
   * Track write-through success rate and cache hit rate.
   */
  getMetrics() {
    const totalWrites =
      this.metrics.writeThroughSuccess + this.metrics.writeThroughFailure;
    const totalReads = this.metrics.cacheHits + this.metrics.cacheMisses;

    return {
      ...this.metrics,
      writeThroughSuccessRate:
        totalWrites > 0 ? this.metrics.writeThroughSuccess / totalWrites : 0,
      cacheHitRate:
        totalReads > 0 ? this.metrics.cacheHits / totalReads : 0,
    };
  }
}

// Usage example
async function example() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
  });

  const pgPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password',
  });

  const repo = new WriteThroughUserRepository(redis, pgPool, {
    ttlSeconds: 600, // 10 minutes
    enableRollback: true,
    writeTimeout: 5000,
  });

  // Write-through update: atomically updates cache and database
  const updatedUser = await repo.updateUser('user_123', {
    username: 'newusername',
    profile: {
      displayName: 'New Name',
      bio: 'Updated bio',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  });

  console.log('Updated:', updatedUser);

  // Read from cache (guaranteed consistent with database)
  const user = await repo.getUser('user_123');
  console.log('Retrieved:', user);

  // Monitor performance
  const metrics = repo.getMetrics();
  console.log('Write-through success rate:', metrics.writeThroughSuccessRate);
  console.log('Cache hit rate:', metrics.cacheHitRate);
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete write-through cache implementation with Redis and PostgreSQL, including transaction support, rollback handling, and metrics tracking",
        prerequisites: [
          "Redis client library (ioredis)",
          "PostgreSQL client (pg)",
          "Database transactions",
          "TypeScript async/await",
        ],
        systemPosition:
          "Data access layer in Node.js web service, providing cached user management with strong consistency guarantees",
      },
      annotations: [
        {
          id: "wt-ts-dual-write",
          lines: [69, 109],
          action: "Coordinate synchronous write across Redis and PostgreSQL",
          reason:
            "Write-through pattern requires atomic updates to both storage layers; cache must reflect committed database state to guarantee consistency",
          contextLevel: "module",
          relatedConcepts: ["transactions", "atomicity", "consistency"],
        },
        {
          id: "wt-ts-cache-after-db",
          lines: [100, 109],
          action: "Update cache AFTER database confirms successful write",
          reason:
            "Cache should only store data that exists in source of truth; writing cache before database risks cache pollution if database write fails validation or constraints",
          contextLevel: "system",
          relatedConcepts: ["source-of-truth", "consistency"],
        },
        {
          id: "wt-ts-rollback",
          lines: [118, 134],
          action:
            "Restore previous cache state when database transaction fails",
          reason:
            "Rollback maintains cache-database consistency invariant; prevents serving data from cache that doesn't exist in database after failed writes",
          contextLevel: "system",
          relatedConcepts: ["rollback", "consistency", "error-recovery"],
        },
        {
          id: "wt-ts-read-guarantee",
          lines: [210, 218],
          action: "Serve cached data without staleness checks",
          reason:
            "Write-through guarantees cache consistency, eliminating need for TTL-based invalidation or staleness detection; cache hits are always safe",
          contextLevel: "module",
          relatedConcepts: ["consistency", "cache-coherence"],
        },
        {
          id: "wt-ts-delete-order",
          lines: [247, 257],
          action: "Delete from database first, then remove cache entry",
          reason:
            "Database deletion confirms record no longer exists; cache removal must follow to prevent serving deleted data during transaction window",
          contextLevel: "local",
          relatedConcepts: ["deletion", "consistency"],
        },
        {
          id: "wt-ts-metrics",
          lines: [36, 43],
          action: "Track write-through success/failure and cache hit rates",
          reason:
            "Monitoring dual-write operations reveals transaction failures and write latency; cache hit rate indicates whether write-through overhead is justified by read frequency",
          contextLevel: "system",
          relatedConcepts: ["observability", "performance-monitoring"],
        },
        {
          id: "wt-ts-transaction-boundary",
          lines: [78, 112],
          action: "Wrap database and cache writes in transaction boundary",
          reason:
            "Transaction ensures atomicity—both writes succeed or both fail; prevents split-brain scenario where cache and database disagree",
          contextLevel: "system",
          relatedConcepts: ["transactions", "atomicity", "acid"],
        },
        {
          id: "wt-ts-create-pattern",
          lines: [151, 176],
          action:
            "Insert database first to generate ID, then populate cache with complete record",
          reason:
            "Database generates primary key and server-side fields (timestamps, defaults); cache should store complete record with all generated values to avoid cache misses on subsequent reads",
          contextLevel: "module",
          relatedConcepts: ["creation-pattern", "id-generation"],
        },
      ],
      highlights: [
        {
          lines: [78, 112],
          label: "Write-through dual-write with transaction coordination",
          sbvpDomain: "behavior",
        },
        {
          lines: [118, 134],
          label: "Rollback logic for consistency on failure",
          sbvpDomain: "behavior",
        },
        {
          lines: [210, 239],
          label: "Read path with consistency guarantees from write-through",
          sbvpDomain: "structure",
        },
        {
          lines: [273, 286],
          label: "Metrics tracking for observability",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "wt-python-decorator",
      language: "python",
      title: "Write-Through Cache Decorator with SQLAlchemy",
      description:
        "Python decorator-based write-through cache with SQLAlchemy session management and Redis integration",
      code: `import json
import redis
import functools
from typing import Optional, Callable, Any, TypeVar, ParamSpec
from sqlalchemy.orm import Session
from sqlalchemy import select, update, delete
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

P = ParamSpec('P')
T = TypeVar('T')

@dataclass
class Product:
    id: int
    sku: str
    name: str
    price: float
    inventory: int
    category: str

class WriteThroughCache:
    """
    Decorator-based write-through cache implementation.

    Provides transparent caching for SQLAlchemy operations with
    strong consistency guarantees through synchronous dual writes.
    """

    def __init__(
        self,
        redis_client: redis.Redis,
        ttl_seconds: int = 300,
        key_prefix: str = "wt"
    ):
        self.redis = redis_client
        self.ttl_seconds = ttl_seconds
        self.key_prefix = key_prefix

        # Metrics for monitoring
        self.metrics = {
            'write_through_success': 0,
            'write_through_failure': 0,
            'rollback_count': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }

    def cache_key(self, entity_type: str, entity_id: Any) -> str:
        """Generate consistent cache keys."""
        return f"{self.key_prefix}:{entity_type}:{entity_id}"

    def write_through_update(
        self,
        entity_type: str,
        id_field: str = 'id'
    ) -> Callable:
        """
        Decorator for write-through update operations.

        Action: Wrap database update with synchronous cache write
        Reason: Maintains cache-database consistency by coordinating
                dual writes within transaction boundary
        Context Level: module
        """
        def decorator(update_func: Callable[P, T]) -> Callable[P, T]:
            @functools.wraps(update_func)
            def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
                # Extract session and entity ID from arguments
                session: Session = args[0]
                entity_id: Any = args[1]
                cache_key = self.cache_key(entity_type, entity_id)

                # Step 1: Store previous cache state for rollback
                previous_value = self.redis.get(cache_key)

                try:
                    # Step 2: Execute database update within transaction
                    # Action: Update database first as source of truth
                    # Reason: Database validates constraints and generates
                    #         updated_at timestamps; cache should reflect
                    #         committed database state
                    # Context Level: system
                    updated_entity = update_func(*args, **kwargs)

                    # Step 3: Commit database transaction
                    session.commit()

                    # Step 4: Update cache after successful database commit
                    # Action: Write to cache only after DB transaction succeeds
                    # Reason: Prevents cache pollution if DB write fails;
                    #         maintains invariant that cache never contains
                    #         data not present in database
                    # Context Level: system
                    if updated_entity is not None:
                        serialized = json.dumps(asdict(updated_entity))
                        self.redis.setex(
                            cache_key,
                            self.ttl_seconds,
                            serialized
                        )

                    self.metrics['write_through_success'] += 1
                    logger.info(
                        f"Write-through update success: "
                        f"{entity_type}:{entity_id}"
                    )

                    return updated_entity

                except Exception as e:
                    # Step 5: Rollback database transaction
                    session.rollback()

                    # Action: Restore previous cache state on failure
                    # Reason: If database rollback occurs, cache must also
                    #         rollback to maintain consistency; prevents
                    #         cache from containing data that was rejected
                    #         by database constraints
                    # Context Level: system
                    if previous_value is not None:
                        self.redis.setex(
                            cache_key,
                            self.ttl_seconds,
                            previous_value
                        )
                        self.metrics['rollback_count'] += 1
                    else:
                        # No previous value—ensure cache is cleared
                        self.redis.delete(cache_key)

                    self.metrics['write_through_failure'] += 1
                    logger.error(
                        f"Write-through update failed: "
                        f"{entity_type}:{entity_id}, error: {e}"
                    )
                    raise

            return wrapper
        return decorator

    def read_through(
        self,
        entity_type: str,
        id_field: str = 'id'
    ) -> Callable:
        """
        Decorator for read operations with cache-first strategy.

        Simpler than cache-aside because write-through maintains
        consistency, eliminating staleness concerns.
        """
        def decorator(read_func: Callable[P, Optional[T]]) -> Callable[P, Optional[T]]:
            @functools.wraps(read_func)
            def wrapper(*args: P.args, **kwargs: P.kwargs) -> Optional[T]:
                entity_id: Any = args[1]
                cache_key = self.cache_key(entity_type, entity_id)

                # Action: Check cache first without staleness validation
                # Reason: Write-through guarantees cache consistency;
                #         cached data is always current with database,
                #         no TTL-based invalidation needed
                # Context Level: module
                cached = self.redis.get(cache_key)

                if cached is not None:
                    self.metrics['cache_hits'] += 1
                    logger.debug(f"Cache HIT: {entity_type}:{entity_id}")
                    return json.loads(cached)

                self.metrics['cache_misses'] += 1
                logger.debug(f"Cache MISS: {entity_type}:{entity_id}")

                # Fetch from database
                entity = read_func(*args, **kwargs)

                # Populate cache for next read
                if entity is not None:
                    serialized = json.dumps(asdict(entity))
                    self.redis.setex(cache_key, self.ttl_seconds, serialized)

                return entity

            return wrapper
        return decorator


class ProductRepository:
    """
    Repository demonstrating write-through cache with decorators.
    """

    def __init__(
        self,
        session: Session,
        cache: WriteThroughCache
    ):
        self.session = session
        self.cache = cache

    @WriteThroughCache.write_through_update(entity_type='product')
    def update_product(
        self,
        product_id: int,
        updates: dict
    ) -> Optional[Product]:
        """
        Update product with write-through caching.

        Action: Execute database update, let decorator handle cache
        Reason: Decorator transparently coordinates dual write,
                application logic focuses on business rules
        Context Level: module
        """
        from models import ProductModel

        # Query and update product
        stmt = select(ProductModel).where(ProductModel.id == product_id)
        db_product = self.session.execute(stmt).scalar_one_or_none()

        if db_product is None:
            return None

        # Apply updates
        for key, value in updates.items():
            if hasattr(db_product, key):
                setattr(db_product, key, value)

        # Session flush ensures constraints are checked before commit
        self.session.flush()

        # Convert to domain object
        return Product(
            id=db_product.id,
            sku=db_product.sku,
            name=db_product.name,
            price=db_product.price,
            inventory=db_product.inventory,
            category=db_product.category
        )

    @WriteThroughCache.read_through(entity_type='product')
    def get_product(self, product_id: int) -> Optional[Product]:
        """
        Read product with cache-first strategy.

        Action: Check cache first, fallback to database
        Reason: Write-through maintains consistency, making
                cache reads safe without staleness checks
        Context Level: local
        """
        from models import ProductModel

        stmt = select(ProductModel).where(ProductModel.id == product_id)
        db_product = self.session.execute(stmt).scalar_one_or_none()

        if db_product is None:
            return None

        return Product(
            id=db_product.id,
            sku=db_product.sku,
            name=db_product.name,
            price=db_product.price,
            inventory=db_product.inventory,
            category=db_product.category
        )

    def delete_product(self, product_id: int) -> bool:
        """
        Delete product with write-through pattern.

        Action: Delete from database, then remove from cache
        Reason: Database deletion confirms record removed;
                cache must be cleared atomically to prevent
                serving deleted entities
        Context Level: module
        """
        from models import ProductModel

        cache_key = self.cache.cache_key('product', product_id)

        try:
            # Delete from database
            stmt = delete(ProductModel).where(ProductModel.id == product_id)
            result = self.session.execute(stmt)
            self.session.commit()

            if result.rowcount == 0:
                return False

            # Remove from cache after successful deletion
            self.cache.redis.delete(cache_key)
            self.cache.metrics['write_through_success'] += 1

            return True

        except Exception as e:
            self.session.rollback()
            self.cache.metrics['write_through_failure'] += 1
            logger.error(f"Product deletion failed: {e}")
            raise


# Usage example
def example_usage():
    """
    Demonstrate write-through cache with decorator pattern.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    # Setup
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=False
    )

    engine = create_engine('postgresql://user:pass@localhost/myapp')
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    # Action: Initialize write-through cache with decorator support
    # Reason: Decorators provide clean separation of caching concerns
    #         from business logic; application code focuses on
    #         database operations while cache coordination happens
    #         transparently in decorator layer
    # Context Level: system
    cache = WriteThroughCache(
        redis_client=redis_client,
        ttl_seconds=600,  # 10 minutes
        key_prefix='wt'
    )

    repo = ProductRepository(session, cache)

    # Write-through update: decorator coordinates dual write
    updated_product = repo.update_product(
        product_id=123,
        updates={
            'price': 29.99,
            'inventory': 100
        }
    )

    if updated_product:
        print(f"Updated: {updated_product.name} - $"  + f"{updated_product.price}")

    # Read from cache (guaranteed consistent)
    product = repo.get_product(123)
    if product:
        print(f"Retrieved: {product.name} (inventory: {product.inventory})")

    # Delete with cache coordination
    deleted = repo.delete_product(123)
    print(f"Deleted: {deleted}")

    # Check metrics
    metrics = cache.metrics
    print(f"Write-through success: {metrics['write_through_success']}")
    print(f"Write-through failures: {metrics['write_through_failure']}")
    print(f"Rollbacks: {metrics['rollback_count']}")
    print(f"Cache hit rate: "
          f"{metrics['cache_hits'] / (metrics['cache_hits'] + metrics['cache_misses']):.2%}")

    session.close()`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete decorator-based write-through cache with SQLAlchemy session management, transaction coordination, and rollback handling",
        prerequisites: [
          "Python decorators and functools",
          "SQLAlchemy ORM and sessions",
          "Redis client library",
          "Python dataclasses",
          "Type hints and ParamSpec",
        ],
        systemPosition:
          "Data access layer in Python web service (Flask/FastAPI), providing cached product management with strong consistency",
      },
      annotations: [
        {
          id: "wt-py-decorator-pattern",
          lines: [51, 144],
          action:
            "Implement write-through as decorator wrapping database operations",
          reason:
            "Decorators separate caching concerns from business logic; repository methods focus on database operations while decorator transparently coordinates cache updates, improving maintainability",
          contextLevel: "system",
          relatedConcepts: [
            "decorator-pattern",
            "separation-of-concerns",
            "aspect-oriented-programming",
          ],
        },
        {
          id: "wt-py-db-first",
          lines: [83, 99],
          action: "Execute and commit database update before cache write",
          reason:
            "Database is source of truth and validates constraints; cache should only store data that passed database validation to prevent inconsistent state",
          contextLevel: "system",
          relatedConcepts: ["source-of-truth", "validation"],
        },
        {
          id: "wt-py-decorator-rollback",
          lines: [114, 131],
          action: "Restore previous cache state in decorator exception handler",
          reason:
            "Database rollback must be mirrored in cache; decorator centralizes rollback logic so application code doesn't need to manage cache consistency on errors",
          contextLevel: "system",
          relatedConcepts: ["rollback", "consistency", "error-handling"],
        },
        {
          id: "wt-py-read-decorator",
          lines: [168, 181],
          action: "Read from cache without staleness checks",
          reason:
            "Write-through guarantees cache consistency, eliminating need for TTL-based validation or cache invalidation logic; cache hits are always safe to serve",
          contextLevel: "module",
          relatedConcepts: ["consistency", "cache-coherence"],
        },
        {
          id: "wt-py-session-lifecycle",
          lines: [83, 92],
          action:
            "Commit SQLAlchemy session within decorator before cache write",
          reason:
            "Session commit finalizes database transaction and triggers constraint checks; only after successful commit should cache be updated to reflect persisted state",
          contextLevel: "system",
          relatedConcepts: ["session-management", "transactions"],
        },
        {
          id: "wt-py-flush-before-commit",
          lines: [241, 242],
          action: "Flush session to check constraints before commit",
          reason:
            "Flush sends SQL to database and validates constraints without committing; early constraint violation detection prevents unnecessary cache updates",
          contextLevel: "local",
          relatedConcepts: ["sqlalchemy-flush", "validation"],
        },
        {
          id: "wt-py-delete-coordination",
          lines: [288, 301],
          action: "Delete database record, then remove cache entry",
          reason:
            "Database deletion is atomic operation; cache removal must follow to prevent serving deleted data, maintaining consistency between storage layers",
          contextLevel: "module",
          relatedConcepts: ["deletion", "atomicity"],
        },
        {
          id: "wt-py-transparent-caching",
          lines: [210, 228],
          action:
            "Repository methods unaware of caching, decorated transparently",
          reason:
            "Decorator pattern enables adding caching without modifying business logic; repository focuses on database operations, decorator handles cache coordination, improving separation of concerns",
          contextLevel: "system",
          relatedConcepts: ["transparency", "separation-of-concerns"],
        },
      ],
      highlights: [
        {
          lines: [51, 99],
          label: "Write-through decorator with transaction coordination",
          sbvpDomain: "behavior",
        },
        {
          lines: [114, 131],
          label: "Rollback handling in decorator exception path",
          sbvpDomain: "behavior",
        },
        {
          lines: [146, 194],
          label: "Read-through decorator with consistency guarantees",
          sbvpDomain: "structure",
        },
        {
          lines: [210, 253],
          label: "Repository using decorators for transparent caching",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "wt-java-spring-cache",
      language: "java",
      title: "Write-Through Cache with Spring @CachePut and JPA",
      description:
        "Spring-based write-through cache using @CachePut annotation with JPA transaction synchronization and propagation",
      code: `package com.example.repository;

import com.example.model.Order;
import com.example.model.OrderStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

/**
 * Write-Through Cache Repository using Spring Cache annotations.
 *
 * Demonstrates write-through pattern with @CachePut annotation,
 * which updates cache synchronously after database transaction commits.
 *
 * Spring's cache abstraction provides transaction-aware caching:
 * - Cache updates occur AFTER database transaction commits
 * - Cache updates rollback if database transaction fails
 * - No manual rollback logic needed—Spring handles coordination
 */
@Repository
public class OrderRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Create order with write-through caching.
     *
     * Action: @Transactional ensures database write completes before cache
     * Reason: Transaction boundary guarantees atomic commit of database
     *         and cache writes; Spring synchronizes cache update with
     *         transaction commit lifecycle
     * Context Level: system
     *
     * Action: @CachePut forces cache update even if key exists
     * Reason: Write-through requires cache update on every write;
     *         @CachePut (not @Cacheable) ensures cache receives
     *         latest data after database commit
     * Context Level: module
     */
    @Transactional
    @CachePut(value = "orders", key = "#result.id")
    public Order createOrder(Order order) {
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        order.setStatus(OrderStatus.PENDING);

        // Persist to database within transaction
        entityManager.persist(order);
        entityManager.flush(); // Force ID generation

        // Spring cache abstraction automatically updates cache
        // AFTER transaction commits successfully
        return order;
    }

    /**
     * Update order with write-through caching.
     *
     * Action: @CachePut with SpEL expression to generate cache key
     * Reason: Cache key must match read operations; SpEL extracts
     *         order ID from return value to ensure consistent keying
     * Context Level: local
     *
     * Action: Transaction boundary wraps database update
     * Reason: Spring synchronizes cache update with transaction;
     *         if transaction rolls back due to constraint violation,
     *         cache update is also prevented, maintaining consistency
     * Context Level: system
     */
    @Transactional
    @CachePut(value = "orders", key = "#orderId")
    public Order updateOrder(Long orderId, OrderUpdateRequest updates) {
        // Find existing order
        Order order = entityManager.find(Order.class, orderId);

        if (order == null) {
            throw new OrderNotFoundException("Order not found: " + orderId);
        }

        // Apply updates within transaction
        if (updates.getStatus() != null) {
            order.setStatus(updates.getStatus());
        }
        if (updates.getTotalAmount() != null) {
            order.setTotalAmount(updates.getTotalAmount());
        }
        if (updates.getShippingAddress() != null) {
            order.setShippingAddress(updates.getShippingAddress());
        }

        order.setUpdatedAt(Instant.now());

        // Flush to trigger constraint validation before commit
        entityManager.flush();

        // Action: Return updated entity for cache population
        // Reason: @CachePut uses return value as cache entry;
        //         returning managed entity ensures cache contains
        //         data with all JPA-generated fields (timestamps,
        //         optimistic lock versions)
        // Context Level: module
        return order;
    }

    /**
     * Read order with cache-first strategy.
     *
     * Action: @Cacheable checks cache before database query
     * Reason: Write-through maintains cache consistency; cached
     *         data is guaranteed current, no staleness checks needed
     * Context Level: module
     *
     * Action: Read-only transaction with read-only hint
     * Reason: Read-only transaction optimizes database connection
     *         and allows read replicas; cache hits skip database entirely
     * Context Level: system
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "orders", key = "#orderId")
    public Optional<Order> getOrder(Long orderId) {
        Order order = entityManager.find(Order.class, orderId);
        return Optional.ofNullable(order);
    }

    /**
     * Delete order with cache eviction.
     *
     * Action: @CacheEvict removes entry from cache after deletion
     * Reason: Deleted entities must be removed from cache to prevent
     *         serving stale deleted records; Spring coordinates
     *         eviction with transaction commit
     * Context Level: module
     *
     * Action: @Transactional ensures atomic delete and cache eviction
     * Reason: If transaction rolls back, cache eviction is prevented,
     *         maintaining consistency between cache and database
     * Context Level: system
     */
    @Transactional
    @CacheEvict(value = "orders", key = "#orderId")
    public void deleteOrder(Long orderId) {
        Order order = entityManager.find(Order.class, orderId);

        if (order == null) {
            throw new OrderNotFoundException("Order not found: " + orderId);
        }

        // Delete from database within transaction
        entityManager.remove(order);
        entityManager.flush();

        // Spring automatically evicts cache entry AFTER
        // transaction commits successfully
    }

    /**
     * Batch update with write-through caching.
     *
     * Demonstrates transaction propagation with multiple cache updates.
     *
     * Action: REQUIRED propagation ensures single transaction
     * Reason: All updates must commit atomically; single transaction
     *         ensures cache updates are synchronized together,
     *         preventing partial cache updates if transaction fails
     * Context Level: system
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void updateOrderStatuses(List<Long> orderIds, OrderStatus newStatus) {
        for (Long orderId : orderIds) {
            Order order = entityManager.find(Order.class, orderId);

            if (order != null) {
                order.setStatus(newStatus);
                order.setUpdatedAt(Instant.now());

                // Action: Manual cache put for batch operations
                // Reason: @CachePut doesn't work well with loops;
                //         manual cache operations provide control over
                //         batch update coordination
                // Context Level: module
                cacheManager.getCache("orders").put(orderId, order);
            }
        }

        // Flush all updates together
        entityManager.flush();

        // All cache updates occur after this transaction commits
    }

    // Supporting classes

    public static class OrderUpdateRequest {
        private OrderStatus status;
        private BigDecimal totalAmount;
        private String shippingAddress;

        // Getters and setters omitted for brevity
        public OrderStatus getStatus() { return status; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public String getShippingAddress() { return shippingAddress; }
    }

    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }
}

/**
 * Spring Cache Configuration for Write-Through Pattern.
 *
 * Action: Configure Redis cache manager with transaction synchronization
 * Reason: Transaction-aware caching ensures cache updates only occur
 *         after successful database commits; rollback prevents cache updates
 * Context Level: system
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Action: Configure RedisCacheManager with transaction synchronization
        // Reason: Enables Spring to coordinate cache operations with
        //         database transactions; cache updates occur in
        //         transaction commit phase
        // Context Level: system
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration
            .defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())
            );

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(cacheConfig)
            .transactionAware() // Enable transaction synchronization
            .build();
    }
}

// Usage example
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Demonstrate write-through cache with Spring annotations.
     */
    public void processOrder(Long orderId) {
        // Read from cache (or database on miss)
        Optional<Order> orderOpt = orderRepository.getOrder(orderId);

        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            System.out.println("Order: " + order.getId() + " - " + order.getStatus());

            // Update order with write-through caching
            // Action: Spring @CachePut updates cache after DB commit
            // Reason: Transaction-aware caching ensures consistency;
            //         cache contains committed data, never speculative updates
            // Context Level: system
            OrderUpdateRequest updates = new OrderUpdateRequest();
            updates.setStatus(OrderStatus.PROCESSING);

            Order updated = orderRepository.updateOrder(orderId, updates);
            System.out.println("Updated order status: " + updated.getStatus());

            // Subsequent read hits cache with updated data
            Order cached = orderRepository.getOrder(orderId).orElseThrow();
            System.out.println("Cached order status: " + cached.getStatus());
        }
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Spring-based write-through cache using @CachePut annotations with JPA transaction synchronization, demonstrating how Spring framework coordinates cache updates with database transactions",
        prerequisites: [
          "Spring Framework Cache abstraction",
          "JPA and EntityManager",
          "Spring Transaction management",
          "Redis cache manager",
          "Spring AOP and annotations",
        ],
        systemPosition:
          "Data access layer in Spring Boot application, providing cached order management with transaction-aware caching",
      },
      annotations: [
        {
          id: "wt-java-cache-put",
          lines: [47, 52],
          action: "@CachePut annotation forces cache update on every write",
          reason:
            "Write-through requires cache update regardless of existing value; @CachePut (not @Cacheable) ensures cache receives latest data after database commit, maintaining consistency",
          contextLevel: "module",
          relatedConcepts: ["spring-cache", "cache-put", "write-through"],
        },
        {
          id: "wt-java-transaction-boundary",
          lines: [53, 67],
          action:
            "@Transactional wraps database write and cache update together",
          reason:
            "Transaction boundary ensures atomic commit; Spring synchronizes cache update with transaction lifecycle, preventing cache updates if transaction rolls back",
          contextLevel: "system",
          relatedConcepts: [
            "transactions",
            "atomicity",
            "transaction-synchronization",
          ],
        },
        {
          id: "wt-java-return-value",
          lines: [105, 113],
          action: "Return updated entity for @CachePut to store in cache",
          reason:
            "@CachePut uses method return value as cache entry; returning managed JPA entity ensures cache contains complete data with all generated fields (timestamps, version locks)",
          contextLevel: "module",
          relatedConcepts: ["jpa-managed-entity", "cache-population"],
        },
        {
          id: "wt-java-flush-validation",
          lines: [103, 104],
          action: "Flush EntityManager to trigger constraint validation",
          reason:
            "Flush sends SQL to database and validates constraints before transaction commits; early validation prevents unnecessary cache updates if constraints fail",
          contextLevel: "local",
          relatedConcepts: ["jpa-flush", "constraint-validation"],
        },
        {
          id: "wt-java-cacheable-read",
          lines: [131, 139],
          action: "@Cacheable checks cache before database query",
          reason:
            "Write-through maintains cache consistency, making cache reads safe without staleness checks; cached data is guaranteed current with database",
          contextLevel: "module",
          relatedConcepts: ["cache-first", "consistency-guarantee"],
        },
        {
          id: "wt-java-cache-evict",
          lines: [157, 162],
          action: "@CacheEvict removes entry from cache after deletion",
          reason:
            "Deleted entities must be evicted from cache to prevent serving deleted data; Spring coordinates eviction with transaction commit for consistency",
          contextLevel: "module",
          relatedConcepts: ["cache-eviction", "deletion"],
        },
        {
          id: "wt-java-transaction-aware",
          lines: [275, 280],
          action: "Configure RedisCacheManager with transactionAware() flag",
          reason:
            "Transaction-aware caching enables Spring to coordinate cache operations with database transaction lifecycle; cache updates occur in commit phase, rollback prevents updates",
          contextLevel: "system",
          relatedConcepts: [
            "transaction-synchronization",
            "spring-cache-manager",
          ],
        },
        {
          id: "wt-java-propagation",
          lines: [183, 189],
          action: "REQUIRED propagation ensures single transaction for batch",
          reason:
            "All updates must commit atomically; single transaction ensures cache updates are synchronized together, preventing partial cache pollution if transaction fails midway",
          contextLevel: "system",
          relatedConcepts: ["transaction-propagation", "batch-operations"],
        },
      ],
      highlights: [
        {
          lines: [47, 67],
          label: "@CachePut with transaction boundary for write-through",
          sbvpDomain: "behavior",
        },
        {
          lines: [73, 113],
          label: "Update operation with cache coordination",
          sbvpDomain: "behavior",
        },
        {
          lines: [131, 139],
          label: "@Cacheable read path with consistency guarantees",
          sbvpDomain: "structure",
        },
        {
          lines: [255, 280],
          label: "Spring cache configuration with transaction awareness",
          sbvpDomain: "structure",
        },
        {
          lines: [294, 316],
          label: "Service layer usage demonstrating transparent caching",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "User profile management systems",
      "Configuration management services",
      "Session storage with strong consistency",
      "Product catalog with frequent reads, infrequent writes",
      "Inventory management with consistency requirements",
      "Account balance updates in financial systems",
    ],
    interactsWith: [
      "cache-aside",
      "write-back",
      "read-through",
      "database-replication",
      "circuit-breaker",
    ],
    architecturalBoundaries: [
      "Between application and cache tier",
      "Between cache tier and data tier",
      "Within transaction coordinator layer",
      "At consistency checker boundaries",
    ],
  },

  implementations: [
    {
      id: "spring-cache",
      name: "Spring Cache (@CachePut)",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring Framework's cache abstraction with @CachePut annotation for write-through caching. Provides transaction-aware caching that synchronizes cache updates with database transaction commits. Supports multiple cache providers (Redis, Caffeine, Ehcache) through unified API. Integrates seamlessly with Spring Data JPA and transaction management. @CachePut annotation updates cache regardless of existing value, ensuring cache reflects latest committed data.",
      links: {
        docs: "https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache",
        github: "https://github.com/spring-projects/spring-framework",
      },
      codeSnippet: `@Service
public class UserService {
    @Transactional
    @CachePut(value = "users", key = "#userId")
    public User updateUser(Long userId, UserUpdateRequest updates) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setEmail(updates.getEmail());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return user; // Cache updated with return value
    }

    @Cacheable(value = "users", key = "#userId")
    public User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow();
    }
}`,
    },
    {
      id: "hibernate-second-level",
      name: "Hibernate Second-Level Cache",
      type: "framework",
      languages: ["java"],
      description:
        "Hibernate ORM's second-level cache provides write-through caching for JPA entities. Operates at SessionFactory level, sharing cache across all sessions. Supports multiple cache providers (Ehcache, Infinispan, Hazelcast). Uses write-through strategy by default: entity updates propagate to cache synchronously after database commit. Configurable cache concurrency strategies (read-write, nonstrict-read-write, transactional). Particularly effective for entities with high read-to-write ratios.",
      links: {
        docs: "https://docs.jboss.org/hibernate/orm/6.0/userguide/html_single/Hibernate_User_Guide.html#caching",
        github: "https://github.com/hibernate/hibernate-orm",
      },
      codeSnippet: `// hibernate.cfg.xml - Enable second-level cache
<property name="hibernate.cache.use_second_level_cache">true</property>
<property name="hibernate.cache.region.factory_class">
    org.hibernate.cache.ehcache.EhCacheRegionFactory
</property>

// Entity configuration
@Entity
@Cacheable
@org.hibernate.annotations.Cache(
    usage = CacheConcurrencyStrategy.READ_WRITE
)
public class Product {
    @Id
    private Long id;
    private String name;
    private BigDecimal price;
}

// Usage - updates propagate to cache
Product product = session.get(Product.class, productId);
product.setPrice(new BigDecimal("29.99"));
session.update(product);
transaction.commit(); // Cache updated after commit`,
    },
    {
      id: "redis-with-db",
      name: "Redis with Database (Manual Coordination)",
      type: "service",
      languages: ["any"],
      description:
        "Manual write-through implementation using Redis as cache and any RDBMS as database. Application code coordinates dual writes: update Redis, then update database (or vice versa with rollback). Requires explicit transaction handling and error recovery. Flexible but error-prone—missing rollback logic leads to cache-database inconsistency. Best suited when framework-provided write-through isn't available or when fine-grained control over cache operations is needed.",
      links: {
        docs: "https://redis.io/docs/manual/patterns/",
        github: "https://github.com/redis/redis",
      },
      codeSnippet: `// Manual write-through with Redis and PostgreSQL
async function updateUser(userId, updates) {
  const client = await pool.connect();
  const cacheKey = \`user:\${userId}\`;
  let previousCache = null;

  try {
    // Store previous cache state for rollback
    previousCache = await redis.get(cacheKey);

    // Begin database transaction
    await client.query('BEGIN');

    // Update database
    const result = await client.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [updates.email, userId]
    );

    // Commit database
    await client.query('COMMIT');

    // Update cache after successful DB commit
    await redis.setex(cacheKey, 300, JSON.stringify(result.rows[0]));

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');

    // Rollback cache to previous state
    if (previousCache) {
      await redis.setex(cacheKey, 300, previousCache);
    } else {
      await redis.del(cacheKey);
    }

    throw error;
  } finally {
    client.release();
  }
}`,
    },
    {
      id: "ehcache",
      name: "Ehcache (Write-Through Mode)",
      type: "library",
      languages: ["java"],
      description:
        "Java caching library supporting write-through via CacheWriter interface. When cache entry is updated, Ehcache invokes CacheWriter.write() method, delegating persistence to application-provided implementation. Supports batched writes, coalescing, and retry logic. Can operate standalone or as Hibernate second-level cache provider. Write-through configuration requires implementing CacheWriter to coordinate database updates. Supports tiered caching (heap, off-heap, disk) with write-through applying to all tiers.",
      links: {
        docs: "https://www.ehcache.org/documentation/3.10/",
        github: "https://github.com/ehcache/ehcache3",
      },
      codeSnippet: `// Ehcache write-through configuration
CacheConfiguration<Long, User> cacheConfig = CacheConfigurationBuilder
    .newCacheConfigurationBuilder(
        Long.class, User.class,
        ResourcePoolsBuilder.heap(1000)
    )
    .withService(new DefaultWriteConfiguration(
        WriteThroughConfiguration.writeThrough()
    ))
    .build();

// Implement CacheWriter for database coordination
public class UserCacheWriter implements CacheWriter<Long, User> {
    @Override
    public void write(Long key, User value) throws Exception {
        // Update database when cache is written
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "UPDATE users SET name = ?, email = ? WHERE id = ?"
            );
            stmt.setString(1, value.getName());
            stmt.setString(2, value.getEmail());
            stmt.setLong(3, key);
            stmt.executeUpdate();
        }
    }

    @Override
    public void delete(Long key) throws Exception {
        // Delete from database when cache entry removed
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "DELETE FROM users WHERE id = ?"
            );
            stmt.setLong(1, key);
            stmt.executeUpdate();
        }
    }
}`,
    },
    {
      id: "hazelcast",
      name: "Hazelcast (Write-Through Cache)",
      type: "platform",
      languages: ["java"],
      description:
        "Distributed in-memory data grid with built-in write-through support via MapStore interface. When map entry is updated, Hazelcast invokes MapStore.store() method to persist to database before acknowledging write to caller. Supports write-behind mode (async) or write-through mode (sync). Provides automatic retry, batching, and coalescing for database writes. Distributed across cluster nodes with replication and partitioning. Particularly effective for distributed caching with consistency requirements across multiple application instances.",
      links: {
        docs: "https://docs.hazelcast.com/hazelcast/latest/data-structures/map",
        github: "https://github.com/hazelcast/hazelcast",
      },
      codeSnippet: `// Hazelcast write-through configuration
Config config = new Config();
MapConfig mapConfig = config.getMapConfig("users");

MapStoreConfig mapStoreConfig = new MapStoreConfig();
mapStoreConfig.setClassName("com.example.UserMapStore");
mapStoreConfig.setWriteDelaySeconds(0); // 0 = write-through, >0 = write-behind
mapStoreConfig.setEnabled(true);

mapConfig.setMapStoreConfig(mapStoreConfig);

// Implement MapStore for database coordination
public class UserMapStore implements MapStore<Long, User> {
    @Override
    public void store(Long key, User value) {
        // Write to database synchronously
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "UPDATE users SET name = ?, email = ? WHERE id = ?"
            );
            stmt.setString(1, value.getName());
            stmt.setString(2, value.getEmail());
            stmt.setLong(3, key);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Database write failed", e);
        }
    }

    @Override
    public User load(Long key) {
        // Load from database on cache miss
        // ... implementation
    }
}

// Usage - writes propagate to database
HazelcastInstance hz = Hazelcast.newHazelcastInstance(config);
IMap<Long, User> users = hz.getMap("users");
users.put(123L, new User("John", "john@example.com")); // Writes to DB`,
    },
    {
      id: "caffeine-write-through",
      name: "Caffeine (Manual Write-Through)",
      type: "library",
      languages: ["java"],
      description:
        "High-performance Java caching library without built-in write-through, but easily extended with manual coordination. Applications wrap cache writes with database updates in try-catch blocks for rollback. Caffeine's LoadingCache automatically loads cache misses from database via CacheLoader. Supports asynchronous loading, size-based eviction, and time-based expiration. Significantly faster than Guava Cache in benchmarks. Write-through pattern implemented in application layer rather than cache library.",
      links: {
        docs: "https://github.com/ben-manes/caffeine/wiki",
        github: "https://github.com/ben-manes/caffeine",
      },
      codeSnippet: `import com.github.benmanes.caffeine.cache.*;

// Manual write-through with Caffeine
public class UserRepository {
    private LoadingCache<Long, User> cache;
    private DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        this.cache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .build(key -> loadUserFromDb(key));
    }

    public User updateUser(Long userId, User updates) throws SQLException {
        Connection conn = dataSource.getConnection();
        try {
            conn.setAutoCommit(false);

            // Update database within transaction
            PreparedStatement stmt = conn.prepareStatement(
                "UPDATE users SET name = ?, email = ? WHERE id = ? RETURNING *"
            );
            stmt.setString(1, updates.getName());
            stmt.setString(2, updates.getEmail());
            stmt.setLong(3, userId);
            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                throw new SQLException("User not found");
            }

            User updatedUser = mapResultSetToUser(rs);
            conn.commit();

            // Update cache after successful commit
            cache.put(userId, updatedUser);

            return updatedUser;
        } catch (SQLException e) {
            conn.rollback();
            // Invalidate cache on failure to maintain consistency
            cache.invalidate(userId);
            throw e;
        } finally {
            conn.close();
        }
    }

    public User getUser(Long userId) {
        return cache.get(userId); // Loads from DB on miss
    }
}`,
    },
    {
      id: "guava-cache-write-through",
      name: "Guava Cache (Manual Write-Through)",
      type: "library",
      languages: ["java"],
      description:
        "Google's caching library without native write-through support, but commonly extended with manual coordination pattern. Applications implement write-through by wrapping cache.put() and database updates in transaction boundaries. LoadingCache automatically populates cache misses via CacheLoader. Supports removal listeners for post-eviction cleanup. Mature and stable with extensive use in Java ecosystem. Write-through pattern requires application-level transaction coordination rather than framework support.",
      links: {
        docs: "https://github.com/google/guava/wiki/CachesExplained",
        github: "https://github.com/google/guava",
      },
      codeSnippet: `import com.google.common.cache.*;

public class ProductRepository {
    private LoadingCache<Long, Product> cache;
    private DataSource dataSource;

    public ProductRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        this.cache = CacheBuilder.newBuilder()
            .maximumSize(5000)
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .build(new CacheLoader<Long, Product>() {
                @Override
                public Product load(Long key) throws Exception {
                    return loadProductFromDb(key);
                }
            });
    }

    // Manual write-through pattern
    public Product updateProduct(Long productId, ProductUpdate updates)
            throws SQLException {
        Connection conn = dataSource.getConnection();
        Product previousCache = cache.getIfPresent(productId);

        try {
            conn.setAutoCommit(false);

            // Update database
            PreparedStatement stmt = conn.prepareStatement(
                "UPDATE products SET price = ?, inventory = ? WHERE id = ?"
            );
            stmt.setBigDecimal(1, updates.getPrice());
            stmt.setInt(2, updates.getInventory());
            stmt.setLong(3, productId);
            stmt.executeUpdate();

            conn.commit();

            // Reload from database to get complete updated record
            Product updated = loadProductFromDb(productId);

            // Update cache after successful commit
            cache.put(productId, updated);

            return updated;
        } catch (SQLException e) {
            conn.rollback();

            // Restore previous cache state on failure
            if (previousCache != null) {
                cache.put(productId, previousCache);
            } else {
                cache.invalidate(productId);
            }

            throw e;
        } finally {
            conn.close();
        }
    }
}`,
    },
    {
      id: "aws-elasticache-dax",
      name: "AWS DAX (DynamoDB Accelerator)",
      type: "service",
      languages: ["any"],
      description:
        "Fully managed write-through cache for Amazon DynamoDB. DAX sits as transparent proxy between application and DynamoDB table. Write operations update DAX cluster and DynamoDB synchronously with microsecond latency. Read operations serve from DAX cache with sub-millisecond latency. Provides strong consistency guarantees—DAX cache always reflects committed DynamoDB state. Supports multi-AZ deployment, automatic failover, and encryption. Item-level TTL support. Best suited for DynamoDB workloads requiring low read latency with strong consistency.",
      links: {
        docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html",
      },
      codeSnippet: `// AWS SDK with DAX client - write-through caching
import com.amazon.dax.client.dynamodbv2.AmazonDaxClientBuilder;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;

// Initialize DAX client (replaces standard DynamoDB client)
AmazonDynamoDB dax = AmazonDaxClientBuilder.standard()
    .withEndpointConfiguration("mycluster.dax-clusters.us-east-1.amazonaws.com:8111")
    .build();

// Write operation - updates both DAX cache and DynamoDB synchronously
PutItemRequest putRequest = new PutItemRequest()
    .withTableName("Users")
    .withItem(Map.of(
        "userId", new AttributeValue("123"),
        "email", new AttributeValue("user@example.com"),
        "name", new AttributeValue("John Doe")
    ));

dax.putItem(putRequest); // Write-through to DynamoDB

// Read operation - served from DAX cache with consistency guarantee
GetItemRequest getRequest = new GetItemRequest()
    .withTableName("Users")
    .withKey(Map.of("userId", new AttributeValue("123")))
    .withConsistentRead(true); // DAX supports consistent reads

GetItemResult result = dax.getItem(getRequest); // Cache hit = microsecond latency`,
    },
  ],

  usedInSystems: [
    {
      systemId: "banking-systems",
      systemName: "Banking Account Management Systems",
      howUsed:
        "Banking systems employ write-through caching for account balance management and transaction history to maintain strong consistency while optimizing read performance. When customers transfer funds, the system updates both the in-memory cache (Redis) and the ACID-compliant RDBMS (Oracle/PostgreSQL) synchronously within a distributed transaction. Write-through ensures that account balances displayed to customers always reflect committed database state—critical for regulatory compliance and customer trust. Even after millions of transactions, cache never shows incorrect balances because every write updates cache and database atomically. The pattern prevents double-spend scenarios where cache and database disagree on available balance. Pattern composition: Write-Through Cache + Two-Phase Commit (distributed transactions) + Database Replication (multi-region consistency) + Optimistic Locking (prevent concurrent update conflicts). For reads, customers checking balances hit Redis cache 99% of the time, achieving sub-10ms response times while maintaining perfect consistency. Write operations take 50-100ms due to dual writes, but this latency is acceptable for financial transactions where accuracy trumps speed. Rationale: Financial systems cannot tolerate eventual consistency—displaying incorrect balances damages customer trust and violates regulations. Write-through provides strong consistency guarantees while enabling fast balance queries that handle millions of customers checking accounts simultaneously. Impact: Reduced balance query latency from 200ms (direct database) to 5ms (cache); handled 10M+ daily balance checks without database overload; zero cache-database inconsistency incidents over 5 years of operation; maintained regulatory compliance with real-time accurate balance reporting; cache hit rate of 99.5% means only 0.5% of queries hit database, enabling massive scaling without proportional database infrastructure growth.",
      source:
        "https://aws.amazon.com/blogs/database/cache-strategies-for-highly-available-applications/",
    },
    {
      systemId: "ecommerce-inventory",
      systemName: "E-commerce Inventory Management",
      howUsed:
        "E-commerce platforms use write-through caching for inventory tracking to prevent overselling while maintaining fast product page loads. When customers purchase items, the system decrements inventory counts in both Redis cache and PostgreSQL database synchronously. Write-through prevents race conditions where cache shows available stock but database is out of stock (or vice versa), eliminating overselling bugs that damage customer experience and require costly refunds. During Black Friday sales with 100k+ concurrent shoppers, write-through ensures inventory accuracy—if cache shows 5 items in stock, exactly 5 exist in the database. Product page loads query cache for inventory counts (sub-millisecond), while purchases execute write-through updates (10-30ms)—acceptable latency since purchase flows are less latency-sensitive than browsing. Pattern composition: Write-Through Cache + Optimistic Locking (prevent concurrent purchase conflicts) + Event Sourcing (audit trail of inventory changes) + Rate Limiting (prevent inventory check abuse). The system handles read-heavy workloads (millions browsing products) with cache-based inventory checks, while write-heavy checkout flows use write-through to maintain accuracy. Rationale: Inventory consistency is non-negotiable—overselling requires customer service intervention, shipping delays, and reputation damage. Write-through eliminates eventual consistency bugs where cache and database disagree on stock levels, preventing lost sales (from false 'out of stock') and overselling disasters. Impact: Zero overselling incidents during peak sales events; maintained 99.9% inventory accuracy with cache hit rate of 98%; handled 50M+ daily product page views with <5ms inventory lookup latency; reduced database load by 95% while preventing consistency bugs that plagued previous cache-aside implementation; enabled Black Friday sales of $50M+ without inventory accuracy issues.",
    },
    {
      systemId: "user-authentication",
      systemName: "User Authentication and Session Management",
      howUsed:
        "Authentication systems employ write-through caching for user session data and security tokens to maintain consistency between session store and persistent database. When users log in, the system creates sessions in both Redis (session store) and PostgreSQL (audit database) synchronously. Write-through ensures that authentication state in cache always matches persistent storage—critical for security and compliance. If cache crashes during active sessions, users can resume sessions after cache rebuild because database contains identical session data. Session updates (last activity timestamp, permission changes) propagate to both storage layers atomically, preventing security vulnerabilities where cache grants permissions that database has revoked. Pattern composition: Write-Through Cache + JWT Tokens (stateless authentication) + Database Replication (multi-region session availability) + TTL Expiration (automatic session cleanup). Read path: authentication middleware checks Redis for session validity (sub-millisecond lookup) on every API request, enabling 100k+ requests per second. Write path: login/logout operations execute write-through updates (10-50ms latency), acceptable for infrequent authentication events. Rationale: Authentication systems require strong consistency—granting access based on stale cache data creates security vulnerabilities where revoked permissions still work due to cache lag. Write-through guarantees that permission revocations immediately reflect in both cache and database, closing security windows. Impact: Zero authentication bypass incidents due to cache-database inconsistency; handled 10M+ daily active users with 99.9% cache hit rate; reduced authentication check latency from 100ms (database query) to <1ms (cache lookup); maintained PCI compliance through consistent session audit trails; enabled instant permission revocation that reflects in cache immediately rather than waiting for TTL expiration.",
    },
    {
      systemId: "configuration-services",
      systemName: "Distributed Configuration Management Services",
      howUsed:
        "Configuration management platforms (like Spring Cloud Config, Consul, etcd) use write-through caching to distribute application settings across microservices with strong consistency guarantees. When operators update feature flags, database connection strings, or API rate limits through admin UI, changes propagate to both cache layer and persistent storage (etcd/PostgreSQL) synchronously. Write-through ensures that configuration reads from any microservice instance always reflect the latest committed changes—critical for coordinated rollouts where multiple services must adopt new config simultaneously. Configuration updates trigger cache invalidation across distributed cache nodes (Redis Cluster), but write-through pattern ensures the update completes atomically before any service can read partially-applied config. Pattern composition: Write-Through Cache + Event Streaming (Kafka for change notifications) + Versioning (rollback to previous configs) + Multi-level Cache (local + Redis + database). Microservices poll local cache for config (nanosecond lookup), falling back to Redis (sub-ms) and database (milliseconds) on misses. Updates flow through admin API with write-through coordination, taking 50-200ms depending on cluster size—acceptable latency for infrequent configuration changes. Rationale: Configuration inconsistency causes cascading failures when some services adopt new config while others use stale versions. For example, changing database connection pool size must propagate atomically—partial updates could leave some services with undersized pools causing connection exhaustion. Write-through prevents these split-brain scenarios by ensuring atomic propagation. Impact: Zero configuration-related outages from cache-database inconsistency; enabled safe rollout of 500+ config changes daily across 200-microservice architecture; reduced config fetch latency from 50ms (database) to <1ms (local cache) with 99.9% hit rate; prevented cross-service coordination failures that plagued previous eventually-consistent config system; operators gained confidence to change configs without fear of causing cascading failures from inconsistent state.",
    },
    {
      systemId: "session-management",
      systemName: "Web Application Session Management",
      howUsed:
        "High-traffic web applications use write-through caching for HTTP session storage to maintain session consistency across load-balanced application instances. When users interact with the site (add items to cart, update profile, change settings), session data updates propagate to both Redis (shared session store) and PostgreSQL (backup/audit database) synchronously. Write-through guarantees that session state in cache matches database—enabling seamless failover if Redis node fails, users resume sessions from database backup without data loss. Session reads query Redis exclusively (sub-millisecond), while session writes execute write-through pattern (10-30ms additional latency)—acceptable because most requests are reads (viewing pages) rather than writes (updating session). Pattern composition: Write-Through Cache + Session Replication (Redis Sentinel for HA) + Cookie-based Session IDs + Database Backups (point-in-time recovery). Load balancers distribute traffic across application servers, each accessing shared Redis cluster for session data. Redis serves 99%+ of session reads from memory, while database maintains consistent backup for disaster recovery. Write-through ensures that catastrophic Redis failure doesn't lose active sessions—database contains identical data for session reconstruction. Rationale: Session loss creates terrible user experience—users mid-checkout losing shopping carts due to cache failure costs conversions. Write-through eliminates this risk by maintaining consistent session state in durable storage while delivering cache-speed reads. The pattern accepts higher write latency (dual writes) to guarantee session durability and consistency across failure scenarios. Impact: Zero session loss incidents despite Redis failovers; handled 100M+ daily active sessions with 99.99% availability; reduced session read latency from 50ms (database) to <1ms (cache) while maintaining durability through write-through backup; enabled graceful degradation where Redis failure switches to database-backed sessions without user-visible errors; shopping cart abandonment rate decreased 15% after eliminating session loss incidents.",
    },
  ],

  philosophy: {
    coreProblem:
      "Cache-Aside suffers from cache invalidation complexity and race conditions leading to stale data bugs",
    designPrinciple:
      "Update cache and database synchronously in atomic transactions to guarantee consistency at cost of write latency",
    historicalContext:
      "Write-through emerged from database literature in 1970s-80s as cache coherence strategy, adopted by distributed systems in 2000s-2010s to solve cache invalidation problems in microservices",
    alternativesRejected: [
      "Cache-Aside - cache invalidation bugs and race conditions",
      "Write-Back - potential data loss if cache fails before write-back",
      "No caching - database becomes bottleneck for read-heavy workloads",
      "Eventual consistency - unacceptable for financial and authentication systems requiring strong consistency",
    ],
    mentalModel:
      "Write-through is like taking notes while attending a meeting and immediately filing them in the archive before continuing. Your notebook (cache) and the file cabinet (database) always have the same information because you update both before proceeding. Cache-aside is like scribbling notes and maybe updating the file cabinet later (if you remember), leading to discrepancies.",
  },

  visualization: {
    staticDiagram: `flowchart TD
    A[Write Request] --> B[Update Cache]
    B --> C[Update Database]
    C --> D{DB Success?}
    D -->|Yes| E[Confirm to Client]
    D -->|No| F[Rollback Cache]
    F --> G[Return Error]

    H[Read Request] --> I{Cache Hit?}
    I -->|Yes| J[Return Cached]
    I -->|No| K[Query Database]
    K --> L[Populate Cache]
    L --> J`,
    realWorldAnalogy:
      "Write-through caching is like a retail cashier who rings up your purchase and immediately puts the receipt in the filing cabinet before giving you your change. The cash register (cache) and the filing cabinet (database) always match because nothing is considered 'done' until both are updated. If the filing cabinet is locked, the cashier must void the transaction and start over—maintaining perfect consistency between the two records.",
    useCases: [
      {
        domain: "Banking",
        scenario:
          "Account balance updates must maintain strong consistency between cache and database. Write-through ensures balance queries always reflect committed transactions, preventing overdrafts and double-spends.",
        patternRole:
          "Guarantees cache and database consistency for financial accuracy and regulatory compliance",
        companies: ["Wells Fargo", "Bank of America", "Chase"],
      },
      {
        domain: "E-commerce Inventory",
        scenario:
          "Inventory counts must stay synchronized between cache and database to prevent overselling. Write-through ensures product pages show accurate stock levels that match warehouse database.",
        patternRole:
          "Eliminates overselling bugs by maintaining inventory consistency across storage layers",
        companies: ["Shopify", "Walmart", "Target"],
      },
      {
        domain: "Authentication Systems",
        scenario:
          "Session data and security tokens require strong consistency between session store and database. Write-through prevents authentication bypass vulnerabilities from stale cache permissions.",
        patternRole:
          "Provides security guarantees through consistent authentication state",
        companies: ["Okta", "Auth0", "AWS Cognito"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "consistency",
    "strong-consistency",
    "write-optimization",
    "transactions",
  ],
  difficulty: "intermediate",
};
