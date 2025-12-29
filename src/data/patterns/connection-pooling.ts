import type { Pattern } from "../schema";

export const connectionPooling: Pattern = {
  id: "connection-pooling",
  slug: "connection-pooling",
  corpusPath:
    "⚡ PERFORMANCE → 🎯 Work Reduction → 🏗️ Structural → 🏊 Connection Pooling",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Structural",
    level: 4,
  },

  concept: {
    name: "Connection Pooling",
    emoji: "🏊",
    tagline: "Reuse connections instead of creating new ones",
    definition:
      "Connection Pooling maintains a cache of reusable database or network connections, like a taxi stand where cabs wait for passengers instead of driving around looking for fares. When an application needs to communicate with a database or external service, establishing a new connection involves expensive operations: TCP handshakes, TLS negotiation, authentication, and resource allocation. Instead of creating a new connection for each request and tearing it down afterward, a connection pool pre-allocates a set of connections at startup and keeps them alive. When a client needs to make a query, it borrows an available connection from the pool, uses it, and returns it for others to reuse. The pool manages connection lifecycle: creating new connections when demand grows (up to a maximum limit), validating connections before checkout (ensuring they're not stale), and culling idle connections to free resources. This pattern transforms expensive connection setup from a per-request cost to a shared, amortized cost across thousands of requests, dramatically reducing latency and resource consumption.",
    problemSolved:
      "In database-driven applications, creating a new connection for every query creates severe performance bottlenecks and resource exhaustion. A typical database connection requires 50-200ms to establish: DNS resolution, TCP three-way handshake, TLS negotiation, authentication, and session initialization. For applications handling thousands of requests per second, this connection overhead dominates response time and wastes server resources on handshake operations instead of actual work. Additionally, databases limit concurrent connections (PostgreSQL defaults to 100, MySQL to 150)—once exhausted, new requests block waiting for connections to become available, creating cascading delays. Connection Pooling solves this by maintaining warm, authenticated connections ready for immediate use. Checkout takes microseconds instead of milliseconds. The pool enforces concurrency limits, preventing runaway connection growth from overwhelming the database. Health checks detect and replace stale connections (closed by firewall timeouts or database restarts) before they cause query failures. The result: predictable latency, controlled resource usage, and higher throughput with fewer database connections.",
    tradeoffs: {
      pros: [
        "Reduces connection latency from 50-200ms to sub-millisecond checkout",
        "Controls maximum concurrent connections to prevent database overload",
        "Amortizes handshake cost across thousands of requests",
        "Enables connection reuse across multiple requests/users",
        "Provides centralized connection health monitoring and validation",
      ],
      cons: [
        "Connection leaks from unreturned connections starve the pool",
        "Stale connections can cause query failures if not validated",
        "Requires tuning pool size based on workload characteristics",
        "Adds complexity for connection lifecycle and error handling",
        "Shared connections require careful transaction boundary management",
      ],
    },
    relatedPatterns: [
      "object-pooling",
      "bulkhead",
      "circuit-breaker",
      "rate-limiting",
      "timeout",
      "health-checks",
      "lazy-initialization",
      "resource-cleanup",
    ],
  },

  structure: {
    participants: [
      {
        name: "Connection Pool Manager",
        role: "Resource Coordinator",
        responsibilities: [
          "Maintain pool of available connections",
          "Create new connections when pool is empty (up to max limit)",
          "Validate connection health before checkout",
          "Track connection usage and enforce timeouts",
          "Cull idle connections to free resources",
        ],
      },
      {
        name: "Pooled Connection",
        role: "Reusable Resource",
        responsibilities: [
          "Maintain persistent connection to database/service",
          "Execute queries/requests when checked out",
          "Reset state between uses (rollback transactions, clear temp tables)",
          "Report health status to pool manager",
        ],
      },
      {
        name: "Client Application",
        role: "Connection Consumer",
        responsibilities: [
          "Request connection from pool when needed",
          "Execute database operations using borrowed connection",
          "Return connection to pool after use (or on error)",
          "Handle pool exhaustion gracefully (wait, timeout, or fallback)",
        ],
      },
      {
        name: "Health Checker",
        role: "Connection Validator",
        responsibilities: [
          "Validate connections before checkout (test query)",
          "Detect stale connections closed by database or network",
          "Remove unhealthy connections from pool",
          "Trigger connection replacement when pool shrinks",
        ],
      },
      {
        name: "Pool Configuration",
        role: "Policy Definer",
        responsibilities: [
          "Define min/max pool size based on workload",
          "Set connection timeout and idle timeout values",
          "Configure validation strategy (on checkout, on idle)",
          "Specify connection creation/destruction behavior",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant Pool as Connection Pool
    participant Conn as Pooled Connection
    participant DB as Database

    Note over Pool: Pool initialized with<br/>minIdle connections

    Client->>Pool: Request connection
    Pool->>Pool: Check available connections

    alt Connection available
        Pool->>Conn: Validate health (optional)
        Conn->>DB: SELECT 1 (test query)
        DB-->>Conn: OK
        Pool-->>Client: Return connection
    else Pool empty, under max
        Pool->>DB: Create new connection
        DB-->>Pool: Connection established
        Pool-->>Client: Return new connection
    else Pool exhausted (at max)
        Pool-->>Client: Wait or error
    end

    Client->>Conn: Execute query
    Conn->>DB: SELECT * FROM users
    DB-->>Conn: Result set
    Conn-->>Client: Query results

    Client->>Pool: Release connection
    Pool->>Conn: Reset state
    Conn->>DB: ROLLBACK (if transaction)
    Pool->>Pool: Return to available pool

    Note over Pool: Connection ready<br/>for next client`,
    flow: [
      {
        step: 1,
        actor: "Pool Manager",
        action: "Initialize Pool",
        description:
          "Create minimum number of connections at startup to avoid cold-start latency",
      },
      {
        step: 2,
        actor: "Client",
        action: "Request Connection",
        description:
          "Application requests connection from pool when it needs to execute database operations",
      },
      {
        step: 3,
        actor: "Pool Manager",
        action: "Check Availability",
        description:
          "Pool checks if idle connection exists, creates new one if under max limit, or blocks/errors if pool exhausted",
      },
      {
        step: 4,
        actor: "Health Checker",
        action: "Validate Connection",
        description:
          "Execute test query (SELECT 1) to ensure connection is alive and responsive before checkout",
      },
      {
        step: 5,
        actor: "Pool Manager",
        action: "Checkout Connection",
        description:
          "Mark connection as in-use and return to client, tracking checkout time for leak detection",
      },
      {
        step: 6,
        actor: "Client",
        action: "Execute Operations",
        description:
          "Client uses connection to execute queries, transactions, or other database operations",
      },
      {
        step: 7,
        actor: "Client",
        action: "Release Connection",
        description:
          "Client returns connection to pool (ideally via try-finally or defer to ensure cleanup)",
      },
      {
        step: 8,
        actor: "Pooled Connection",
        action: "Reset State",
        description:
          "Rollback uncommitted transactions, clear temporary tables, reset session variables to prevent state leakage",
      },
      {
        step: 9,
        actor: "Pool Manager",
        action: "Return to Pool",
        description:
          "Mark connection as available for next client, update idle time tracking",
      },
      {
        step: 10,
        actor: "Pool Manager",
        action: "Cull Idle Connections",
        description:
          "Periodically close connections idle beyond threshold to free resources, maintaining minimum pool size",
      },
    ],
    invariants: [
      "Pool size never exceeds configured maximum to prevent database overload",
      "All connections checked out must eventually be returned (or timeout and reclaimed)",
      "Connection state must be reset between checkouts to prevent data leakage",
      "Health checks must run before checkout to prevent stale connection errors",
      "Pool maintains minimum idle connections to avoid cold-start latency",
      "Connection checkout must timeout to prevent indefinite blocking",
    ],
  },

  codeExamples: [
    {
      id: "cp-typescript-postgres",
      language: "typescript",
      title: "PostgreSQL Connection Pool with pg Library",
      description:
        "Production-grade PostgreSQL connection pool with health checks, timeout handling, and graceful shutdown",
      code: `import { Pool, PoolClient, QueryResult } from 'pg';
import { EventEmitter } from 'events';

interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  // Pool sizing
  min: number;              // Minimum idle connections
  max: number;              // Maximum total connections
  // Timeouts
  connectionTimeoutMillis: number;  // Max wait for connection checkout
  idleTimeoutMillis: number;        // Close idle connections after this time
  // Health checks
  testOnBorrow: boolean;            // Validate connection before checkout
  validationQuery: string;          // Query to test connection health
}

class DatabasePool extends EventEmitter {
  private pool: Pool;
  private config: PoolConfig;
  private checkoutCount = 0;
  private errorCount = 0;

  constructor(config: PoolConfig) {
    super();
    this.config = config;

    // Create PostgreSQL connection pool
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.min,
      max: config.max,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      idleTimeoutMillis: config.idleTimeoutMillis,
    });

    this.setupEventHandlers();
  }

  /**
   * Set up pool event handlers for monitoring and debugging
   */
  private setupEventHandlers(): void {
    // Emitted whenever a client is checked out from the pool
    this.pool.on('connect', (client: PoolClient) => {
      this.checkoutCount++;
      this.emit('checkout', { totalCheckouts: this.checkoutCount });
    });

    // Emitted when a client connection encounters an error
    this.pool.on('error', (err: Error, client: PoolClient) => {
      this.errorCount++;
      this.emit('connectionError', err);
      console.error('Unexpected connection error:', err);
    });

    // Emitted when a client is acquired from the pool
    this.pool.on('acquire', (client: PoolClient) => {
      this.emit('acquire', {
        waiting: this.pool.waitingCount,
        idle: this.pool.idleCount,
        total: this.pool.totalCount
      });
    });

    // Emitted when a client is released back to the pool
    this.pool.on('remove', (client: PoolClient) => {
      this.emit('remove', {
        idle: this.pool.idleCount,
        total: this.pool.totalCount
      });
    });
  }

  /**
   * Execute a query using a connection from the pool.
   * Connection is automatically returned to pool after query completes.
   */
  async query<T = any>(
    queryText: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    let client: PoolClient | undefined;

    try {
      // Checkout connection from pool
      client = await this.pool.connect();

      // Optionally validate connection health before use
      if (this.config.testOnBorrow) {
        await this.validateConnection(client);
      }

      // Execute the actual query
      const result = await client.query<T>(queryText, params);

      const duration = Date.now() - startTime;
      this.emit('queryComplete', { duration, rowCount: result.rowCount });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.emit('queryError', { error, duration });
      throw error;
    } finally {
      // CRITICAL: Always release connection back to pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute multiple operations in a transaction.
   * Ensures connection is used exclusively until transaction completes.
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await callback(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release connection back to pool after transaction
      client.release();
    }
  }

  /**
   * Validate connection health by executing a simple test query.
   * Throws error if connection is stale or broken.
   */
  private async validateConnection(client: PoolClient): Promise<void> {
    try {
      await client.query(this.config.validationQuery);
    } catch (error) {
      throw new Error(\`Connection validation failed: \${error}\`);
    }
  }

  /**
   * Get current pool statistics for monitoring
   */
  getStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingRequests: this.pool.waitingCount,
      totalCheckouts: this.checkoutCount,
      totalErrors: this.errorCount,
    };
  }

  /**
   * Gracefully close all connections in the pool.
   * Should be called during application shutdown.
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.emit('poolClosed');
  }
}

// Usage Example
async function example() {
  const pool = new DatabasePool({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'dbuser',
    password: 'dbpass',
    min: 5,                          // Keep 5 idle connections warm
    max: 20,                         // Allow up to 20 total connections
    connectionTimeoutMillis: 3000,   // Wait max 3s for connection checkout
    idleTimeoutMillis: 30000,        // Close connections idle for 30s
    testOnBorrow: true,              // Validate before checkout
    validationQuery: 'SELECT 1',     // Simple health check query
  });

  // Monitor pool health
  pool.on('checkout', (stats) => {
    console.log('Connection checked out:', stats);
  });

  pool.on('connectionError', (error) => {
    console.error('Pool connection error:', error);
    // Alert monitoring system
  });

  try {
    // Simple query - connection automatically returned
    const users = await pool.query('SELECT * FROM users WHERE active = $1', [true]);
    console.log(\`Found \${users.rowCount} active users\`);

    // Transaction - connection held until commit/rollback
    await pool.transaction(async (client) => {
      await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
      await client.query('INSERT INTO audit_log (action) VALUES ($1)', ['user_created']);
      // Both queries committed together
    });

    // Check pool health
    console.log('Pool stats:', pool.getStats());
  } finally {
    // Graceful shutdown - close all connections
    await pool.close();
  }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready PostgreSQL connection pool with comprehensive error handling, monitoring, and lifecycle management",
        prerequisites: [
          "PostgreSQL",
          "Node.js pg library",
          "TypeScript async/await",
          "Event emitters",
        ],
        systemPosition:
          "Data access layer in web application, shared across all request handlers for database connectivity",
      },
      annotations: [
        {
          id: "cp-ts-pool-config",
          lines: [5, 17],
          action:
            "Define comprehensive pool configuration for connection management",
          reason:
            "Production pools need tunable parameters for sizing (min/max), timeouts (checkout, idle), and health checks to balance performance vs resource usage",
          contextLevel: "module",
          relatedConcepts: ["resource-management", "configuration-tuning"],
        },
        {
          id: "cp-ts-pool-init",
          lines: [29, 44],
          action: "Initialize pg Pool with configuration parameters",
          reason:
            "pg library handles connection lifecycle automatically—creating connections on demand, validating health, and culling idle connections based on config",
          contextLevel: "module",
          relatedConcepts: ["lazy-initialization", "library-integration"],
        },
        {
          id: "cp-ts-event-handlers",
          lines: [50, 78],
          action: "Attach event handlers to monitor pool health and activity",
          reason:
            "Pool events provide visibility into connection lifecycle, enabling metrics collection, alerting on errors, and debugging connection leaks",
          contextLevel: "system",
          relatedConcepts: ["observability", "monitoring", "event-driven"],
        },
        {
          id: "cp-ts-query-method",
          lines: [84, 117],
          action:
            "Provide query method that handles connection checkout and return",
          reason:
            "Wrapping checkout/release in a method ensures connections are always returned via finally block, preventing leaks even when queries fail",
          contextLevel: "module",
          relatedConcepts: ["resource-cleanup", "error-handling"],
        },
        {
          id: "cp-ts-validation",
          lines: [94, 97],
          action:
            "Optionally validate connection health with test query before use",
          reason:
            "Health checks detect stale connections (closed by database restart or firewall timeout) before they cause query failures, trading small latency cost for reliability",
          contextLevel: "local",
          relatedConcepts: ["health-checks", "fault-tolerance"],
        },
        {
          id: "cp-ts-finally",
          lines: [113, 117],
          action: "Use finally block to guarantee connection return to pool",
          reason:
            "Critical safety mechanism—if connection isn't released, pool is permanently depleted until timeout reclaims it. Finally runs even on exceptions.",
          contextLevel: "micro",
          relatedConcepts: [
            "resource-leak-prevention",
            "defensive-programming",
          ],
        },
        {
          id: "cp-ts-transaction",
          lines: [123, 142],
          action:
            "Provide transaction method that holds connection until commit/rollback",
          reason:
            "Transactions require exclusive connection use across multiple queries. Pattern ensures BEGIN/COMMIT/ROLLBACK are executed on same connection, with automatic rollback on error.",
          contextLevel: "module",
          relatedConcepts: ["acid-transactions", "connection-affinity"],
        },
        {
          id: "cp-ts-rollback",
          lines: [136, 138],
          action: "Rollback transaction on error before releasing connection",
          reason:
            "Prevents half-committed transactions from corrupting data. Rollback returns connection to clean state for next use.",
          contextLevel: "local",
          relatedConcepts: ["error-recovery", "state-cleanup"],
        },
      ],
      highlights: [
        {
          lines: [5, 17],
          label: "Pool configuration parameters",
          sbvpDomain: "structure",
        },
        {
          lines: [50, 78],
          label: "Observability event handlers",
          sbvpDomain: "philosophy",
        },
        {
          lines: [84, 117],
          label: "Connection checkout with automatic cleanup",
          sbvpDomain: "behavior",
        },
        {
          lines: [123, 142],
          label: "Transaction with connection affinity",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cp-python-dbapi",
      language: "python",
      title: "Python Database Connection Pool with SQLAlchemy",
      description:
        "SQLAlchemy connection pool with overflow handling, connection recycling, and pre-ping health checks",
      code: `from sqlalchemy import create_engine, pool, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DBAPIError, TimeoutError
from contextlib import contextmanager
from typing import Generator
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConnectionPool:
    """
    Production-grade database connection pool using SQLAlchemy.

    Features:
    - QueuePool with overflow for burst traffic
    - Pre-ping validation to detect stale connections
    - Connection recycling to prevent long-lived connection issues
    - Comprehensive event listeners for monitoring
    """

    def __init__(
        self,
        connection_url: str,
        pool_size: int = 10,
        max_overflow: int = 5,
        pool_timeout: int = 30,
        pool_recycle: int = 3600,
        pool_pre_ping: bool = True,
    ):
        """
        Initialize connection pool with SQLAlchemy.

        Args:
            connection_url: Database URL (postgresql://user:pass@host/db)
            pool_size: Core pool size (always maintained)
            max_overflow: Additional connections during burst (temp)
            pool_timeout: Max seconds to wait for connection checkout
            pool_recycle: Recycle connections after N seconds (prevent stale)
            pool_pre_ping: Test connection health before checkout
        """
        self.engine = create_engine(
            connection_url,
            poolclass=pool.QueuePool,      # Thread-safe queue-based pool
            pool_size=pool_size,            # Core connections
            max_overflow=max_overflow,      # Burst capacity
            pool_timeout=pool_timeout,      # Checkout timeout
            pool_recycle=pool_recycle,      # Recycle after 1 hour
            pool_pre_ping=pool_pre_ping,    # Health check before checkout
            echo_pool=True,                 # Log pool events (debug)
        )

        self._setup_event_listeners()
        self._checkout_count = 0
        self._error_count = 0

    def _setup_event_listeners(self) -> None:
        """
        Attach SQLAlchemy event listeners for pool monitoring.
        """

        @event.listens_for(self.engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            """Called when new connection is created."""
            logger.info("New database connection created")

        @event.listens_for(self.engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            """Called when connection is checked out from pool."""
            self._checkout_count += 1
            connection_record.checkout_time = time.time()
            logger.debug(f"Connection checked out (total: {self._checkout_count})")

        @event.listens_for(self.engine, "checkin")
        def receive_checkin(dbapi_conn, connection_record):
            """Called when connection is returned to pool."""
            checkout_duration = time.time() - getattr(connection_record, 'checkout_time', time.time())
            logger.debug(f"Connection checked in after {checkout_duration:.3f}s")

        @event.listens_for(self.engine, "close")
        def receive_close(dbapi_conn, connection_record):
            """Called when connection is closed/removed from pool."""
            logger.info("Connection removed from pool")

        @event.listens_for(self.engine, "invalidate")
        def receive_invalidate(dbapi_conn, connection_record, exception):
            """Called when connection is invalidated due to error."""
            self._error_count += 1
            logger.error(f"Connection invalidated: {exception}")

    @contextmanager
    def connection(self) -> Generator:
        """
        Context manager for automatic connection checkout and return.

        Usage:
            with pool.connection() as conn:
                result = conn.execute(text("SELECT * FROM users"))
        """
        conn = self.engine.connect()
        try:
            yield conn
        except Exception as e:
            logger.error(f"Query error: {e}")
            raise
        finally:
            # CRITICAL: Always return connection to pool
            conn.close()

    @contextmanager
    def transaction(self) -> Generator:
        """
        Context manager for transactional operations.
        Automatically commits on success, rolls back on error.

        Usage:
            with pool.transaction() as trans:
                trans.execute(text("INSERT INTO users ..."))
                trans.execute(text("INSERT INTO audit_log ..."))
                # Automatic commit if no exception
        """
        conn = self.engine.connect()
        trans = conn.begin()
        try:
            yield conn
            trans.commit()
        except Exception as e:
            trans.rollback()
            logger.error(f"Transaction rolled back: {e}")
            raise
        finally:
            conn.close()

    def execute(self, query: str, params: dict = None):
        """
        Execute a single query using a connection from the pool.
        Connection is automatically returned after query completes.

        Args:
            query: SQL query string (use :param for parameters)
            params: Dictionary of query parameters

        Returns:
            Query result
        """
        with self.connection() as conn:
            result = conn.execute(text(query), params or {})
            return result

    def get_pool_status(self) -> dict:
        """
        Get current pool statistics for monitoring.

        Returns:
            Dictionary with pool size, checked out, overflow, etc.
        """
        pool_status = self.engine.pool.status()
        return {
            "pool_size": self.engine.pool.size(),
            "checked_out": self.engine.pool.checkedout(),
            "overflow": self.engine.pool.overflow(),
            "status": pool_status,
            "total_checkouts": self._checkout_count,
            "total_errors": self._error_count,
        }

    def dispose(self) -> None:
        """
        Close all connections in the pool.
        Should be called during application shutdown.
        """
        logger.info("Disposing connection pool...")
        self.engine.dispose()
        logger.info("Pool disposed successfully")


# Usage Example
def example_usage():
    # Initialize pool with PostgreSQL
    pool = DatabaseConnectionPool(
        connection_url="postgresql://user:password@localhost:5432/myapp",
        pool_size=10,          # Keep 10 connections always open
        max_overflow=5,        # Allow 5 additional during burst (total 15)
        pool_timeout=30,       # Wait max 30s for connection
        pool_recycle=3600,     # Recycle connections after 1 hour
        pool_pre_ping=True,    # Test connection before each use
    )

    try:
        # Simple query - connection auto-returned
        result = pool.execute(
            "SELECT * FROM users WHERE active = :active",
            {"active": True}
        )
        for row in result:
            print(f"User: {row.name}")

        # Manual connection management with context manager
        with pool.connection() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            print(f"Total users: {count}")

        # Transaction - multiple queries committed together
        with pool.transaction() as trans:
            trans.execute(
                text("INSERT INTO users (name, email) VALUES (:name, :email)"),
                {"name": "Alice", "email": "alice@example.com"}
            )
            trans.execute(
                text("INSERT INTO audit_log (action, user) VALUES (:action, :user)"),
                {"action": "user_created", "user": "Alice"}
            )
            # Automatic COMMIT on context exit (or ROLLBACK on exception)

        # Monitor pool health
        stats = pool.get_pool_status()
        print(f"Pool status: {stats}")

        # Handle pool exhaustion
        try:
            # This will timeout if pool is exhausted for 30s
            result = pool.execute("SELECT * FROM large_table")
        except TimeoutError:
            logger.error("Connection pool exhausted - consider scaling")
            # Implement fallback: serve cached data, return error, etc.

    finally:
        # Graceful shutdown - close all connections
        pool.dispose()


# Advanced: Custom pool with connection validation
class ValidatedConnectionPool(DatabaseConnectionPool):
    """
    Extended pool with custom validation logic.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Add custom connection validation
        @event.listens_for(self.engine, "checkout")
        def validate_connection(dbapi_conn, connection_record, connection_proxy):
            """
            Validate connection health with custom query.
            Useful for detecting connections broken by firewall/load balancer.
            """
            cursor = dbapi_conn.cursor()
            try:
                cursor.execute("SELECT 1")
                cursor.close()
            except Exception as e:
                # Connection is stale - invalidate and let pool create new one
                logger.warning(f"Connection validation failed: {e}")
                raise DBAPIError.instance(
                    statement="SELECT 1",
                    params=None,
                    orig=e,
                    connection_invalidated=True
                )`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production SQLAlchemy connection pool with QueuePool, overflow handling, pre-ping validation, and comprehensive monitoring",
        prerequisites: [
          "Python SQLAlchemy",
          "Context managers",
          "Database connection strings",
          "Event-driven programming",
        ],
        systemPosition:
          "Data access layer in Python web application (Flask, Django, FastAPI), initialized at startup and shared across all request handlers",
      },
      annotations: [
        {
          id: "cp-py-pool-config",
          lines: [22, 42],
          action:
            "Configure SQLAlchemy QueuePool with core pool size and overflow capacity",
          reason:
            "QueuePool maintains core pool size always, creates overflow connections during burst traffic (then disposes), balancing warm connections vs memory usage",
          contextLevel: "module",
          relatedConcepts: [
            "queue-pool",
            "overflow-handling",
            "burst-capacity",
          ],
        },
        {
          id: "cp-py-pool-init",
          lines: [43, 54],
          action:
            "Create SQLAlchemy engine with QueuePool and comprehensive configuration",
          reason:
            "pool_recycle prevents long-lived connections from becoming stale (database timeout, firewall drops); pool_pre_ping adds health check before each checkout",
          contextLevel: "system",
          relatedConcepts: ["connection-recycling", "health-checks"],
        },
        {
          id: "cp-py-event-listeners",
          lines: [59, 96],
          action:
            "Attach event listeners for pool lifecycle monitoring and debugging",
          reason:
            "SQLAlchemy events provide hooks into connection lifecycle: creation, checkout, return, invalidation. Essential for metrics, alerting, and debugging leaks.",
          contextLevel: "system",
          relatedConcepts: ["observability", "event-hooks", "monitoring"],
        },
        {
          id: "cp-py-context-manager",
          lines: [98, 113],
          action:
            "Provide context manager for automatic connection checkout and return",
          reason:
            "Context managers (with statement) guarantee connection return via __exit__, even on exceptions. Pythonic pattern for resource management.",
          contextLevel: "module",
          relatedConcepts: ["context-managers", "raii", "resource-cleanup"],
        },
        {
          id: "cp-py-transaction",
          lines: [115, 139],
          action:
            "Provide transaction context manager with automatic commit/rollback",
          reason:
            "Transactions need connection affinity—all operations must use same connection. Context manager ensures BEGIN/COMMIT/ROLLBACK executed on same connection, with automatic rollback on exception.",
          contextLevel: "module",
          relatedConcepts: ["acid-transactions", "error-recovery"],
        },
        {
          id: "cp-py-rollback",
          lines: [129, 132],
          action:
            "Rollback transaction on exception before releasing connection",
          reason:
            "Explicit rollback prevents partial commits from corrupting data. Returns connection to clean state for next checkout.",
          contextLevel: "local",
          relatedConcepts: ["atomicity", "state-cleanup"],
        },
        {
          id: "cp-py-pool-status",
          lines: [156, 169],
          action: "Expose pool statistics for health monitoring and alerting",
          reason:
            "Production systems need visibility into pool health: size, checked out count, overflow usage. High checkout count or errors indicate scaling needs.",
          contextLevel: "system",
          relatedConcepts: ["metrics", "capacity-planning"],
        },
        {
          id: "cp-py-pre-ping",
          lines: [52, 52],
          action:
            "Enable pool_pre_ping to validate connections before checkout",
          reason:
            "Pre-ping executes lightweight test query before checkout, detecting stale connections (closed by server restart, firewall timeout) before they cause query failures",
          contextLevel: "module",
          relatedConcepts: ["health-checks", "stale-connection-detection"],
        },
        {
          id: "cp-py-custom-validation",
          lines: [237, 255],
          action: "Add custom connection validation logic via event listener",
          reason:
            "For advanced scenarios (load balancers dropping idle connections, multi-region databases), custom validation can execute domain-specific health checks",
          contextLevel: "system",
          relatedConcepts: ["extensibility", "custom-health-checks"],
        },
      ],
      highlights: [
        {
          lines: [43, 54],
          label: "QueuePool configuration with overflow and recycling",
          sbvpDomain: "structure",
        },
        {
          lines: [59, 96],
          label: "Comprehensive event listeners for observability",
          sbvpDomain: "philosophy",
        },
        {
          lines: [98, 113],
          label: "Context manager for automatic connection cleanup",
          sbvpDomain: "behavior",
        },
        {
          lines: [115, 139],
          label: "Transaction context manager with rollback",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "cp-java-hikari",
      language: "java",
      title: "Java Connection Pool with HikariCP",
      description:
        "High-performance HikariCP connection pool with leak detection, connection lifetime limits, and JMX monitoring",
      code: `import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.concurrent.TimeUnit;

/**
 * Production-grade connection pool using HikariCP.
 *
 * HikariCP is the fastest connection pool for Java, used by Spring Boot by default.
 * Features:
 * - FastList: Custom ArrayList replacement optimized for get/remove
 * - ConcurrentBag: Lock-free collection for connections
 * - Leak detection: Warns when connections aren't returned
 * - Connection lifetime management: Prevents stale connections
 */
public class DatabaseConnectionPool {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionPool.class);

    private final HikariDataSource dataSource;
    private final HikariPoolMXBean poolMBean;

    /**
     * Initialize HikariCP connection pool with production-grade configuration.
     */
    public DatabaseConnectionPool(DatabaseConfig config) {
        HikariConfig hikariConfig = new HikariConfig();

        // Connection parameters
        hikariConfig.setJdbcUrl(config.getJdbcUrl());
        hikariConfig.setUsername(config.getUsername());
        hikariConfig.setPassword(config.getPassword());
        hikariConfig.setDriverClassName("org.postgresql.Driver");

        // Pool sizing
        hikariConfig.setMinimumIdle(5);              // Min idle connections
        hikariConfig.setMaximumPoolSize(20);         // Max total connections

        // Timeout configuration
        hikariConfig.setConnectionTimeout(30000);     // 30s to get connection
        hikariConfig.setIdleTimeout(600000);          // 10min before closing idle
        hikariConfig.setMaxLifetime(1800000);         // 30min max connection age
        hikariConfig.setValidationTimeout(5000);      // 5s for health check

        // Health checks
        hikariConfig.setConnectionTestQuery("SELECT 1");  // Validation query

        // Leak detection (warns if connection held > 10s)
        hikariConfig.setLeakDetectionThreshold(10000);

        // Pool name for monitoring
        hikariConfig.setPoolName("MyApp-DB-Pool");

        // Performance optimizations
        hikariConfig.addDataSourceProperty("cachePrepStmts", "true");
        hikariConfig.addDataSourceProperty("prepStmtCacheSize", "250");
        hikariConfig.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        // Initialize pool
        this.dataSource = new HikariDataSource(hikariConfig);
        this.poolMBean = dataSource.getHikariPoolMXBean();

        logger.info("Connection pool initialized: {}", hikariConfig.getPoolName());
    }

    /**
     * Get DataSource for use with frameworks (Spring, Hibernate).
     * Frameworks handle connection checkout/return automatically.
     */
    public DataSource getDataSource() {
        return dataSource;
    }

    /**
     * Execute a query using a connection from the pool.
     * Connection is automatically returned via try-with-resources.
     */
    public <T> T executeQuery(String sql, Object[] params, ResultSetHandler<T> handler)
            throws SQLException {
        // try-with-resources ensures connection is returned even on exception
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            // Bind parameters
            if (params != null) {
                for (int i = 0; i < params.length; i++) {
                    stmt.setObject(i + 1, params[i]);
                }
            }

            // Execute query
            try (ResultSet rs = stmt.executeQuery()) {
                return handler.handle(rs);
            }
        } catch (SQLException e) {
            logger.error("Query execution failed: {}", sql, e);
            throw e;
        }
        // Connection automatically returned to pool here via AutoCloseable
    }

    /**
     * Execute an update (INSERT, UPDATE, DELETE) using pool connection.
     */
    public int executeUpdate(String sql, Object[] params) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            if (params != null) {
                for (int i = 0; i < params.length; i++) {
                    stmt.setObject(i + 1, params[i]);
                }
            }

            return stmt.executeUpdate();
        } catch (SQLException e) {
            logger.error("Update execution failed: {}", sql, e);
            throw e;
        }
    }

    /**
     * Execute multiple operations in a transaction.
     * Connection is held exclusively until commit/rollback.
     */
    public <T> T executeTransaction(TransactionCallback<T> callback) throws SQLException {
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);  // Start transaction

            T result = callback.doInTransaction(conn);

            conn.commit();              // Commit on success
            return result;
        } catch (Exception e) {
            if (conn != null) {
                try {
                    conn.rollback();    // Rollback on error
                    logger.warn("Transaction rolled back due to error", e);
                } catch (SQLException rollbackEx) {
                    logger.error("Rollback failed", rollbackEx);
                }
            }
            throw new SQLException("Transaction failed", e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);  // Reset auto-commit
                    conn.close();              // Return to pool
                } catch (SQLException e) {
                    logger.error("Failed to close connection", e);
                }
            }
        }
    }

    /**
     * Get pool statistics for monitoring and alerting.
     */
    public PoolStats getPoolStats() {
        return new PoolStats(
            poolMBean.getTotalConnections(),
            poolMBean.getActiveConnections(),
            poolMBean.getIdleConnections(),
            poolMBean.getThreadsAwaitingConnection()
        );
    }

    /**
     * Gracefully shutdown the connection pool.
     * Waits for active connections to be returned before closing.
     */
    public void shutdown() {
        logger.info("Shutting down connection pool...");
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            logger.info("Connection pool closed successfully");
        }
    }

    /**
     * Suspend pool - stops accepting new connections.
     * Useful for maintenance or graceful degradation.
     */
    public void suspend() {
        poolMBean.suspendPool();
        logger.warn("Connection pool suspended");
    }

    /**
     * Resume pool after suspension.
     */
    public void resume() {
        poolMBean.resumePool();
        logger.info("Connection pool resumed");
    }

    // Helper interfaces
    @FunctionalInterface
    public interface ResultSetHandler<T> {
        T handle(ResultSet rs) throws SQLException;
    }

    @FunctionalInterface
    public interface TransactionCallback<T> {
        T doInTransaction(Connection conn) throws Exception;
    }

    public static class PoolStats {
        public final int totalConnections;
        public final int activeConnections;
        public final int idleConnections;
        public final int threadsWaiting;

        public PoolStats(int total, int active, int idle, int waiting) {
            this.totalConnections = total;
            this.activeConnections = active;
            this.idleConnections = idle;
            this.threadsWaiting = waiting;
        }

        @Override
        public String toString() {
            return String.format(
                "PoolStats{total=%d, active=%d, idle=%d, waiting=%d}",
                totalConnections, activeConnections, idleConnections, threadsWaiting
            );
        }
    }
}

// Configuration POJO
class DatabaseConfig {
    private String jdbcUrl;
    private String username;
    private String password;

    public DatabaseConfig(String jdbcUrl, String username, String password) {
        this.jdbcUrl = jdbcUrl;
        this.username = username;
        this.password = password;
    }

    public String getJdbcUrl() { return jdbcUrl; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
}

// Usage Example
class Example {
    public static void main(String[] args) {
        DatabaseConfig config = new DatabaseConfig(
            "jdbc:postgresql://localhost:5432/myapp",
            "dbuser",
            "dbpass"
        );

        DatabaseConnectionPool pool = new DatabaseConnectionPool(config);

        try {
            // Simple query - connection auto-returned
            String userName = pool.executeQuery(
                "SELECT name FROM users WHERE id = ?",
                new Object[]{123},
                rs -> rs.next() ? rs.getString("name") : null
            );
            System.out.println("User: " + userName);

            // Update operation
            int rowsUpdated = pool.executeUpdate(
                "UPDATE users SET last_login = NOW() WHERE id = ?",
                new Object[]{123}
            );
            System.out.println("Updated " + rowsUpdated + " rows");

            // Transaction - multiple operations committed together
            pool.executeTransaction(conn -> {
                try (PreparedStatement stmt1 = conn.prepareStatement(
                        "INSERT INTO users (name, email) VALUES (?, ?)")) {
                    stmt1.setString(1, "Alice");
                    stmt1.setString(2, "alice@example.com");
                    stmt1.executeUpdate();
                }

                try (PreparedStatement stmt2 = conn.prepareStatement(
                        "INSERT INTO audit_log (action) VALUES (?)")) {
                    stmt2.setString(1, "user_created");
                    stmt2.executeUpdate();
                }

                return null;  // Automatically committed
            });

            // Monitor pool health
            PoolStats stats = pool.getPoolStats();
            System.out.println("Pool status: " + stats);

            // Check if pool is under pressure
            if (stats.threadsWaiting > 5) {
                System.err.println("WARNING: Pool exhaustion detected!");
                // Alert monitoring system, consider scaling
            }

        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        } finally {
            // Graceful shutdown
            pool.shutdown();
        }
    }
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise-grade HikariCP connection pool with leak detection, connection lifetime management, JMX monitoring, and graceful shutdown",
        prerequisites: [
          "Java JDBC",
          "HikariCP library",
          "Try-with-resources",
          "JMX monitoring",
        ],
        systemPosition:
          "Data access layer in Java enterprise application (Spring Boot, Jakarta EE), initialized at startup and shared across all request threads",
      },
      annotations: [
        {
          id: "cp-java-hikari-config",
          lines: [33, 64],
          action:
            "Configure HikariCP with comprehensive pool sizing, timeouts, and health checks",
          reason:
            "HikariCP requires tuning multiple dimensions: pool size (min/max), timeouts (connection, idle, max lifetime), and validation. Max lifetime prevents long-lived connections from becoming stale.",
          contextLevel: "system",
          relatedConcepts: [
            "connection-lifetime",
            "timeout-configuration",
            "pool-sizing",
          ],
        },
        {
          id: "cp-java-leak-detection",
          lines: [57, 57],
          action:
            "Enable leak detection to warn when connections aren't returned",
          reason:
            "Leak detection tracks how long connections are checked out. If held beyond threshold (10s), logs warning with stack trace showing where connection was acquired—critical for debugging leaks.",
          contextLevel: "system",
          relatedConcepts: ["leak-detection", "debugging", "observability"],
        },
        {
          id: "cp-java-prep-stmt-cache",
          lines: [63, 65],
          action:
            "Enable prepared statement caching for performance optimization",
          reason:
            "Prepared statements are compiled by database—caching them across requests avoids re-compilation overhead. Can improve throughput by 20-30% for query-heavy workloads.",
          contextLevel: "module",
          relatedConcepts: ["statement-caching", "performance-optimization"],
        },
        {
          id: "cp-java-try-resources",
          lines: [88, 91],
          action:
            "Use try-with-resources to guarantee connection return to pool",
          reason:
            "Try-with-resources automatically calls close() on AutoCloseable resources (Connection, PreparedStatement, ResultSet), ensuring cleanup even on exceptions. Critical safety mechanism.",
          contextLevel: "module",
          relatedConcepts: ["raii", "automatic-cleanup", "resource-safety"],
        },
        {
          id: "cp-java-transaction",
          lines: [132, 166],
          action:
            "Implement transaction handling with manual commit/rollback control",
          reason:
            "Transactions require disabling auto-commit, executing multiple operations on same connection, then commit or rollback. Finally block ensures connection state reset and return to pool.",
          contextLevel: "module",
          relatedConcepts: [
            "acid-transactions",
            "connection-affinity",
            "error-recovery",
          ],
        },
        {
          id: "cp-java-rollback",
          lines: [145, 151],
          action: "Rollback transaction on error and log failure details",
          reason:
            "Explicit rollback prevents partial commits. Nested try-catch handles rare case where rollback itself fails (connection lost mid-transaction).",
          contextLevel: "local",
          relatedConcepts: ["atomicity", "defensive-programming"],
        },
        {
          id: "cp-java-auto-commit-reset",
          lines: [157, 157],
          action: "Reset auto-commit to true before returning connection",
          reason:
            "Connection state must be cleaned between uses. Leaving auto-commit disabled would break next client's queries. State reset is critical for pooled resources.",
          contextLevel: "local",
          relatedConcepts: ["state-cleanup", "connection-reset"],
        },
        {
          id: "cp-java-jmx-monitoring",
          lines: [171, 178],
          action: "Expose pool statistics via HikariCP JMX MBean",
          reason:
            "JMX provides real-time visibility into pool health: total connections, active, idle, threads waiting. Essential for monitoring, alerting, and capacity planning.",
          contextLevel: "system",
          relatedConcepts: ["jmx", "monitoring", "observability"],
        },
        {
          id: "cp-java-graceful-shutdown",
          lines: [184, 191],
          action: "Gracefully shutdown pool, waiting for active connections",
          reason:
            "HikariCP.close() waits for checked-out connections to be returned (up to timeout) before closing pool. Prevents abrupt connection termination mid-query.",
          contextLevel: "system",
          relatedConcepts: ["graceful-shutdown", "lifecycle-management"],
        },
      ],
      highlights: [
        {
          lines: [33, 67],
          label: "Comprehensive HikariCP configuration",
          sbvpDomain: "structure",
        },
        {
          lines: [57, 57],
          label: "Leak detection for debugging",
          sbvpDomain: "philosophy",
        },
        {
          lines: [88, 106],
          label: "Try-with-resources for automatic cleanup",
          sbvpDomain: "behavior",
        },
        {
          lines: [132, 166],
          label: "Transaction with manual commit/rollback",
          sbvpDomain: "behavior",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Data Access Layer - Shared pool for all database queries",
      "API Gateway - Connection pool for upstream service calls",
      "Message Queue Consumer - Pool for database writes from queue",
      "Microservice - Dedicated pool per downstream dependency",
      "Web Application - HTTP connection pool for external APIs",
    ],
    interactsWith: [
      "timeout",
      "circuit-breaker",
      "retry",
      "bulkhead",
      "health-checks",
      "rate-limiting",
    ],
    architecturalBoundaries: [
      "Application → Database - Most common placement",
      "Service → Service - HTTP connection pooling for microservices",
      "Application → Cache - Redis/Memcached connection pools",
      "Application → Message Queue - Connection pools for Kafka, RabbitMQ producers/consumers",
    ],
  },

  implementations: [
    {
      id: "hikaricp",
      name: "HikariCP",
      type: "library",
      languages: ["java", "kotlin"],
      description:
        "Fastest JDBC connection pool for Java. Default in Spring Boot. Features: zero-overhead pool management via FastList and ConcurrentBag, leak detection, connection lifetime management, JMX monitoring. Benchmarks show 2-3x faster than alternatives (C3P0, DBCP).",
      links: {
        docs: "https://github.com/brettwooldridge/HikariCP",
        github: "https://github.com/brettwooldridge/HikariCP",
      },
      codeSnippet: `HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost/mydb");
config.setUsername("user");
config.setPassword("password");
config.setMaximumPoolSize(20);
config.setMinimumIdle(5);
config.setConnectionTimeout(30000);
config.setIdleTimeout(600000);
config.setMaxLifetime(1800000);

HikariDataSource ds = new HikariDataSource(config);
Connection conn = ds.getConnection();
// Use connection
conn.close();  // Returns to pool`,
    },
    {
      id: "pg-pool",
      name: "node-postgres (pg) Pool",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "PostgreSQL client for Node.js with built-in connection pooling. Features: automatic connection management, query timeouts, prepared statements, SSL support. Most popular PostgreSQL client in Node.js ecosystem (10M+ weekly downloads).",
      links: {
        docs: "https://node-postgres.com/",
        github: "https://github.com/brianc/node-postgres",
        npm: "https://www.npmjs.com/package/pg",
      },
      codeSnippet: `const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'password',
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const result = await pool.query('SELECT * FROM users');
console.log(result.rows);`,
    },
    {
      id: "sqlalchemy-pool",
      name: "SQLAlchemy Connection Pool",
      type: "library",
      languages: ["python"],
      description:
        "Production-grade pooling for Python with multiple pool implementations: QueuePool (default), NullPool (no pooling), StaticPool (single connection), AssertionPool (testing). Features: overflow handling, pre-ping validation, connection recycling, event hooks.",
      links: {
        docs: "https://docs.sqlalchemy.org/en/20/core/pooling.html",
        github: "https://github.com/sqlalchemy/sqlalchemy",
      },
      codeSnippet: `from sqlalchemy import create_engine, pool

engine = create_engine(
    "postgresql://user:password@localhost/mydb",
    poolclass=pool.QueuePool,
    pool_size=10,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True,  # Test connection before use
)

with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users"))`,
    },
    {
      id: "c3p0",
      name: "c3p0",
      type: "library",
      languages: ["java"],
      description:
        "Mature JDBC connection pool with automatic recovery, statement caching, and extensive configuration. Features: broken connection recovery, prepared statement pooling, configurable validation queries. Legacy choice—consider HikariCP for new projects.",
      links: {
        docs: "https://www.mchange.com/projects/c3p0/",
        github: "https://github.com/swaldman/c3p0",
      },
      codeSnippet: `ComboPooledDataSource cpds = new ComboPooledDataSource();
cpds.setJdbcUrl("jdbc:postgresql://localhost/mydb");
cpds.setUser("user");
cpds.setPassword("password");
cpds.setMinPoolSize(5);
cpds.setMaxPoolSize(20);
cpds.setAcquireIncrement(5);
cpds.setMaxIdleTime(3600);

Connection conn = cpds.getConnection();`,
    },
    {
      id: "pgbouncer",
      name: "PgBouncer",
      type: "service",
      languages: ["any"],
      description:
        "Lightweight connection pooler for PostgreSQL running as separate service. Supports three pooling modes: session (traditional), transaction (aggressive), statement (max throughput). Enables 1000s of application connections to share 100s of database connections. Critical for high-concurrency Postgres deployments.",
      links: {
        docs: "https://www.pgbouncer.org/",
        github: "https://github.com/pgbouncer/pgbouncer",
      },
      codeSnippet: `# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5`,
    },
    {
      id: "redis-pool",
      name: "redis-py Connection Pool",
      type: "library",
      languages: ["python"],
      description:
        "Redis connection pool for Python. Features: automatic connection management, retry logic, SSL support, cluster-aware pooling. Essential for high-throughput Redis applications to avoid connection overhead.",
      links: {
        docs: "https://redis-py.readthedocs.io/",
        github: "https://github.com/redis/redis-py",
      },
      codeSnippet: `import redis

pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    max_connections=50,
    decode_responses=True
)

r = redis.Redis(connection_pool=pool)
r.set('key', 'value')
value = r.get('key')`,
    },
    {
      id: "ioredis",
      name: "ioredis",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Redis client for Node.js with built-in connection pooling and cluster support. Features: automatic reconnection, pub/sub, pipelining, Lua scripting, sentinel support. Most feature-complete Redis client for Node.js.",
      links: {
        docs: "https://github.com/luin/ioredis",
        github: "https://github.com/luin/ioredis",
        npm: "https://www.npmjs.com/package/ioredis",
      },
      codeSnippet: `const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

await redis.set('key', 'value');
const value = await redis.get('key');`,
    },
    {
      id: "go-sql-db",
      name: "database/sql Pool",
      type: "library",
      languages: ["go"],
      description:
        "Built-in connection pooling in Go's standard library. Features: automatic connection management, prepared statement caching, connection lifetime control. No external dependencies required. Used by all Go database drivers (pgx, mysql, sqlite).",
      links: {
        docs: "https://pkg.go.dev/database/sql",
      },
      codeSnippet: `import "database/sql"
import _ "github.com/lib/pq"

db, err := sql.Open("postgres", "postgres://user:pass@localhost/mydb")
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(10 * time.Minute)

rows, err := db.Query("SELECT * FROM users")
defer rows.Close()`,
    },
  ],

  usedInSystems: [
    {
      systemId: "instagram",
      systemName: "Instagram",
      howUsed:
        "Instagram uses PgBouncer extensively to pool PostgreSQL connections across their massive Django application fleet. With thousands of Django workers handling millions of requests per second, direct database connections would exhaust PostgreSQL's connection limits (default 100-200). PgBouncer runs on each application host in transaction pooling mode, allowing 1000+ application connections to multiplex over 20-30 database connections. Each Django worker opens connections to PgBouncer (cheap, local TCP connection), and PgBouncer maintains a small pool of expensive PostgreSQL connections. This architecture enabled Instagram to scale from 10M to 2B+ users on PostgreSQL without rewriting their Django codebase. Pattern composition: Connection Pooling (PgBouncer) + Read Replicas (replica pools) + Sharding (dedicated pools per shard) + Circuit Breaker (pool exhaustion triggers degradation). Rationale: PostgreSQL connection limit is hard constraint; without pooling, peak traffic would exhaust connections and cause cascading failures. Impact: Reduced database connections from 50,000+ to 500 (100x reduction); enabled scaling to 2B users; prevented PostgreSQL connection exhaustion during traffic spikes; reduced connection handshake overhead by 99%.",
      source:
        "https://instagram-engineering.com/scaling-instagram-infrastructure-3afe8c4d4bfd",
    },
    {
      systemId: "discord",
      systemName: "Discord",
      howUsed:
        "Discord uses HikariCP for connection pooling across their Java-based API services. With 150M+ monthly active users sending billions of messages, efficient database access is critical. Each API instance maintains a HikariCP pool sized at 10-20 connections to Cassandra and PostgreSQL. HikariCP's leak detection helped Discord identify and fix connection leaks that were causing pool exhaustion during peak hours (millions of concurrent users in voice channels during gaming events). The pool's max lifetime setting (30 minutes) prevents long-lived connections from becoming stale when database nodes are replaced during deployments. Pattern composition: Connection Pooling (HikariCP) + Circuit Breaker (handle database outages) + Bulkhead (separate pools per database) + Health Checks (pre-ping validation). Rationale: Java applications create expensive JDBC connections; pooling amortizes handshake cost across millions of requests. Leak detection is essential for debugging in high-concurrency environments. Impact: Reduced P99 database latency from 150ms to 20ms by eliminating connection setup overhead; leak detection reduced production incidents by 60%; enabled handling 15M+ concurrent users without database connection exhaustion.",
      source:
        "https://discord.com/blog/how-discord-stores-billions-of-messages",
    },
    {
      systemId: "uber",
      systemName: "Uber",
      howUsed:
        "Uber uses connection pooling extensively across their microservices for database (MySQL, PostgreSQL) and cache (Redis) access. Their Go services use the standard library database/sql pool with custom metrics and monitoring. Pool sizing is critical during demand spikes (New Year's Eve, major events)—undersized pools cause request queuing and latency spikes, while oversized pools exhaust database connections. Uber's platform team provides standardized pool configurations tuned per service tier: high-QPS services get larger pools (50+ connections), batch processing services use smaller pools (5-10). They discovered that connection lifetime limits (5-10 minutes) are essential in multi-region deployments where load balancers can redirect connections to different database replicas, causing session state issues. Pattern composition: Connection Pooling + Adaptive Pool Sizing (scale pool based on load) + Circuit Breaker (handle database outages) + Metrics (track pool utilization). Rationale: With 1000+ microservices making database calls, unmanaged connections would create 100,000+ database connections, far exceeding database capacity. Impact: Reduced database connection count from 50,000+ to 5,000 across microservices fleet; prevented connection exhaustion during 10x traffic spikes on New Year's Eve; reduced P95 latency by 40% by eliminating connection setup overhead.",
      source: "https://eng.uber.com/microservice-architecture/",
    },
    {
      systemId: "shopify",
      systemName: "Shopify",
      howUsed:
        "Shopify uses connection pooling via ActiveRecord (Rails default) and custom pooling for Redis/Memcached. During flash sales (limited product drops, Black Friday), connection pooling prevents database connection exhaustion that would take down merchant storefronts. Shopify's default ActiveRecord pool size is 5 connections per Rails worker, carefully tuned to balance concurrency vs memory usage. They monitor pool checkout time (time spent waiting for available connection)—if checkout time exceeds 100ms, it triggers autoscaling to add more Rails workers. For Redis, Shopify uses custom connection pooling with pool sizes of 50-100 connections per host, enabling thousands of Rails workers to share a small number of Redis connections. Pattern composition: Connection Pooling + Autoscaling (scale workers when pool exhausted) + Read Replicas (separate pools for read/write) + Cache-Aside (reduce database pool pressure). Rationale: Rails applications are inherently multi-threaded; without pooling, each thread would create new database connections, quickly exhausting PostgreSQL's connection limit. Impact: Enabled handling 80M+ shoppers during Black Friday without database outages; reduced database connection count by 90%; pool checkout monitoring enabled proactive autoscaling, reducing P99 latency from 2s to 200ms during flash sales.",
      source:
        "https://shopify.engineering/how-shopify-reduced-storefront-response-times-rewrite",
    },
    {
      systemId: "stripe",
      systemName: "Stripe",
      howUsed:
        "Stripe uses connection pooling across their Ruby and Go services for PostgreSQL and MongoDB access. Given Stripe's strict reliability requirements (99.999% uptime for payment processing), connection pooling is configured conservatively: small pool sizes (5-10 connections per service instance) with aggressive health checks and short max lifetimes (5 minutes). This prevents cascading failures where stale connections cause payment processing delays. Stripe's Go services use pgx connection pool with custom instrumentation tracking pool utilization, checkout duration, and connection age. They discovered that connection validation (pre-ping) is essential for multi-AZ deployments—network partitions can leave connections open but non-functional, causing silent payment failures. Pattern composition: Connection Pooling + Health Checks (pre-ping validation) + Circuit Breaker (fail fast on pool exhaustion) + Observability (detailed pool metrics) + Bulkhead (separate pools per database). Rationale: Payment processing requires predictable latency and zero silent failures; connection pooling with aggressive validation ensures every query uses a healthy connection. Impact: Achieved 99.999% payment success rate; reduced connection-related payment failures by 95%; pool metrics enabled capacity planning and prevented database overload during payment volume spikes (holiday shopping).",
      source: "https://stripe.com/blog/online-migrations",
    },
  ],

  philosophy: {
    coreProblem:
      "Creating a new database or network connection for every request wastes time on expensive handshakes and exhausts server resources",
    designPrinciple:
      "Amortize expensive connection setup across many requests by maintaining a pool of warm, reusable connections",
    historicalContext:
      "Connection pooling emerged in the 1990s with enterprise Java applications hitting database connection limits. Apache Commons DBCP (2001) and c3p0 (2003) were early standardizers. Modern pools like HikariCP (2013) focus on zero-overhead performance through careful data structure design.",
    alternativesRejected: [
      "Create connection per request - wastes 50-200ms on handshake overhead",
      "Single shared connection - doesn't scale with concurrent requests",
      "Unlimited connections - exhausts database connection limits",
      "Application-level caching - doesn't solve concurrency control",
    ],
    mentalModel:
      "Like a taxi stand at an airport where cabs wait for passengers instead of driving around looking for fares. Pre-positioned taxis (warm connections) can serve passengers (requests) immediately, while new cabs (connections) only arrive when the stand is empty.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Application["Application (1000s requests/sec)"]
        R1[Request 1]
        R2[Request 2]
        R3[Request 3]
        RN[Request N]
    end

    subgraph Pool["Connection Pool (20 connections)"]
        C1[Connection 1<br/>IDLE]
        C2[Connection 2<br/>IN USE]
        C3[Connection 3<br/>IDLE]
        C4[Connection 4<br/>IDLE]
    end

    subgraph Database["PostgreSQL (max 100 connections)"]
        DB[(Database)]
    end

    R1 -->|checkout| C1
    R2 -->|checkout| C2
    R3 -->|wait| Pool
    RN -->|wait| Pool

    C1 -.->|reused| DB
    C2 -.->|reused| DB
    C3 -.->|reused| DB
    C4 -.->|reused| DB

    style C1 fill:#90EE90
    style C2 fill:#FFB6C1
    style C3 fill:#90EE90
    style C4 fill:#90EE90
    style Pool fill:#E6F3FF
    style Database fill:#FFE6E6`,
    realWorldAnalogy:
      "Connection pooling is like a taxi stand at a busy airport. Instead of every arriving passenger calling a taxi from scratch (finding driver, negotiating price, getting car from garage), a small fleet of taxis waits at the stand ready to go. Passengers get immediate service, taxis serve many passengers per shift (connection reuse), and the airport doesn't need parking for thousands of taxis (resource efficiency). When the stand is full (pool at max size), passengers wait in line until a taxi returns.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "During Black Friday flash sale, Shopify's storefront serves 100,000 requests/second. Without connection pooling, each request would create a new PostgreSQL connection (150ms overhead), adding 15,000 seconds of wasted latency per second—impossible. Connection pool with 20 connections per Rails worker handles all requests with sub-millisecond checkout time.",
        patternRole:
          "Enables high-concurrency request handling without database connection exhaustion",
        companies: ["Shopify", "Amazon", "Stripe"],
      },
      {
        domain: "Social Media",
        scenario:
          "Instagram's Django application fleet has 10,000+ workers handling 500M requests/hour. PostgreSQL's connection limit (100-200) would be instantly exhausted. PgBouncer connection pooler sits between Django and PostgreSQL, multiplexing 10,000 application connections over 200 database connections using transaction-level pooling.",
        patternRole:
          "Multiplexes thousands of application connections over hundreds of database connections",
        companies: ["Instagram", "Facebook", "Twitter"],
      },
      {
        domain: "Gaming",
        scenario:
          "Discord's API serves 15M concurrent users in voice channels during peak gaming hours. Each API instance maintains HikariCP pool with 20 connections to Cassandra. Without pooling, 1000 API instances would require 1M+ database connections (far exceeding Cassandra capacity). Connection pooling reduces to 20,000 connections.",
        patternRole:
          "Prevents database connection exhaustion in massively concurrent systems",
        companies: ["Discord", "Riot Games", "Blizzard"],
      },
    ],
  },

  tags: [
    "performance",
    "resource-management",
    "database",
    "connection-management",
    "pooling",
    "scalability",
  ],
  difficulty: "intermediate",
};
