import type { Pattern } from "../schema";

export const readReplicas: Pattern = {
  id: "read-replicas",
  slug: "read-replicas",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → 📋 Replication → 📖 Read Replicas",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Replication",
    level: 4,
  },

  concept: {
    name: "Read Replicas",
    emoji: "📖",
    tagline: "Scale reads horizontally",
    definition:
      "The Read Replicas pattern scales database read throughput by replicating data from a primary (master) database to one or more read-only replica databases. Write operations (INSERT, UPDATE, DELETE) are directed exclusively to the primary database, which maintains the authoritative copy of all data. The primary asynchronously streams changes to replicas via replication logs (binary logs in MySQL, WAL in PostgreSQL), keeping replicas eventually consistent with the primary. Read operations (SELECT queries) are distributed across replicas using load balancing, allowing horizontal scaling of read capacity. Each replica maintains a complete copy of the database, enabling massive parallelization of read traffic—adding more replicas linearly increases total read throughput. The pattern is particularly effective for read-heavy workloads where reads outnumber writes by 10:1 or more, such as content delivery systems, analytics dashboards, and reporting platforms. Replication typically operates in streaming mode with lag times of milliseconds to seconds, meaning replicas may serve slightly stale data. Applications must tolerate eventual consistency for reads, while writes remain strongly consistent on the primary. This architecture enables systems like Instagram and Twitter to handle billions of read queries per day while maintaining fast response times and database availability during traffic spikes.",
    problemSolved:
      "Database systems face a fundamental scalability challenge: a single database server has finite read capacity determined by CPU, memory, disk I/O, and network bandwidth. As applications grow, read traffic eventually saturates the database, causing query queuing, increased latency, and connection pool exhaustion. Unlike application servers that scale horizontally by adding instances, traditional databases are vertically scaled by upgrading to larger machines—an expensive, limited approach. The problem intensifies for read-heavy workloads: social media feeds, e-commerce product catalogs, and content platforms execute 10-100 read queries for every write. Funneling all reads through a single primary database creates a bottleneck that degrades user experience and limits business growth. Read Replicas solve this by distributing read load across multiple database instances. When the primary handles 10,000 queries/second and reaches capacity, adding 4 replicas increases total read capacity to 50,000 queries/second (primary + 4 replicas). Replicas also provide geographic distribution—placing replicas in multiple regions reduces latency for global users by serving reads from nearby databases. Additionally, replicas offer operational benefits: analytics queries run on replicas without impacting production traffic, backups are taken from replicas to avoid primary load, and replicas provide disaster recovery failover targets.",
    tradeoffs: {
      pros: [
        "Horizontally scales read throughput by adding more replicas",
        "Reduces read latency through geographic distribution of replicas",
        "Isolates heavy analytics queries from production primary database",
        "Provides high availability and disaster recovery failover targets",
        "Enables zero-downtime schema changes on replicas before primary",
        "Protects primary database from read traffic spikes",
      ],
      cons: [
        "Introduces replication lag causing eventually consistent reads",
        "Adds complexity in routing writes to primary and reads to replicas",
        "Requires application logic to handle stale data on replicas",
        "Increases storage costs linearly with number of replicas",
        "Write throughput remains limited by single primary database",
        "Replication lag can cause read-after-write consistency issues",
      ],
    },
    relatedPatterns: [
      "cache-aside",
      "write-through",
      "leader-follower",
      "multi-leader",
      "leaderless",
      "sharding",
      "read-quorum",
      "write-quorum",
    ],
  },

  structure: {
    participants: [
      {
        name: "Primary Database",
        role: "Write Authority",
        responsibilities: [
          "Handle all write operations (INSERT, UPDATE, DELETE)",
          "Maintain authoritative source of truth for all data",
          "Stream replication logs to all replicas",
          "Serve read queries when strong consistency required",
        ],
      },
      {
        name: "Read Replica",
        role: "Read-Only Copy",
        responsibilities: [
          "Apply replication log entries to stay synchronized",
          "Serve read-only SELECT queries with eventual consistency",
          "Monitor replication lag and health status",
          "Reject write attempts with read-only error",
        ],
      },
      {
        name: "Application Client",
        role: "Request Router",
        responsibilities: [
          "Route write operations to primary database",
          "Route read operations to replicas using load balancing",
          "Handle replication lag and eventual consistency",
          "Implement read-after-write consistency when needed",
        ],
      },
      {
        name: "Load Balancer",
        role: "Read Traffic Distributor",
        responsibilities: [
          "Distribute read queries across healthy replicas",
          "Monitor replica health and remove unhealthy instances",
          "Implement balancing algorithm (round-robin, least-connections)",
        ],
      },
      {
        name: "Replication Stream",
        role: "Data Synchronizer",
        responsibilities: [
          "Transfer change events from primary to replicas",
          "Maintain ordered sequence of database changes",
          "Handle network interruptions and retry logic",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant LB as Load Balancer
    participant P as Primary DB
    participant R1 as Replica 1
    participant R2 as Replica 2
    participant Log as Replication Stream

    Note over C,R2: Write Path
    C->>P: INSERT user (id=123, name='Alice')
    P->>P: Execute write & commit
    P-->>C: Write acknowledged
    P->>Log: Stream change event
    Log->>R1: Apply: INSERT user (123, 'Alice')
    Log->>R2: Apply: INSERT user (123, 'Alice')

    Note over C,R2: Read Path (Eventual Consistency)
    C->>LB: SELECT * FROM users WHERE id=123
    LB->>R1: Route read query
    R1-->>LB: User data (may be stale)
    LB-->>C: Return result

    Note over C,R2: Read Path (Strong Consistency)
    C->>P: SELECT * FROM users WHERE id=123
    P-->>C: Fresh user data`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Submit Write",
        description: "Client sends INSERT/UPDATE/DELETE to primary database",
      },
      {
        step: 2,
        actor: "Primary Database",
        action: "Execute Write",
        description:
          "Primary executes write transaction and commits to storage",
      },
      {
        step: 3,
        actor: "Primary Database",
        action: "Log Change",
        description: "Primary writes change to replication log (binlog/WAL)",
      },
      {
        step: 4,
        actor: "Replication Stream",
        action: "Stream to Replicas",
        description: "Asynchronously transmit change events to all replicas",
      },
      {
        step: 5,
        actor: "Read Replica",
        action: "Apply Change",
        description: "Replica applies change to its local database copy",
      },
      {
        step: 6,
        actor: "Client",
        action: "Submit Read",
        description: "Client sends SELECT query for read operation",
      },
      {
        step: 7,
        actor: "Load Balancer",
        action: "Route to Replica",
        description:
          "Distribute read to healthy replica using balancing algorithm",
      },
      {
        step: 8,
        actor: "Read Replica",
        action: "Execute Query",
        description:
          "Replica executes SELECT and returns data (may be slightly stale)",
      },
      {
        step: 9,
        actor: "Load Balancer",
        action: "Return Result",
        description: "Forward query result back to client",
      },
    ],
    invariants: [
      "All write operations must execute on primary database only",
      "Replicas must never accept write operations",
      "Replication stream maintains total ordering of changes",
      "Replicas eventually converge to primary state",
      "Primary availability is critical for write operations",
      "Replica failures must not block primary writes",
    ],
  },

  codeExamples: [
    {
      id: "read-replicas-typescript-basic",
      language: "typescript",
      title: "Read Replica Routing with PostgreSQL",
      description:
        "TypeScript implementation routing writes to primary and reads to replicas with connection pooling",
      code: `import { Pool } from 'pg';

// ============================================================
// Database Configuration
// ============================================================
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;  // Connection pool size
}

const primaryConfig: DatabaseConfig = {
  host: 'primary-db.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'production',
  user: 'app_user',
  password: process.env.DB_PASSWORD!,
  max: 20,  // Primary handles writes + some reads
};

const replicaConfigs: DatabaseConfig[] = [
  {
    host: 'replica-1.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'production',
    user: 'app_user',
    password: process.env.DB_PASSWORD!,
    max: 50,  // Replicas handle high read volume
  },
  {
    host: 'replica-2.us-west-2.rds.amazonaws.com',
    port: 5432,
    database: 'production',
    user: 'app_user',
    password: process.env.DB_PASSWORD!,
    max: 50,
  },
];

// ============================================================
// Database Pool Manager
// ============================================================
// ACTION: Maintain separate connection pools for primary and replicas
// REASON: Isolates write and read traffic, prevents read spikes from
//         exhausting write connections on primary
// CONTEXT: Connection pools reuse database connections, avoiding
//          expensive TCP handshake and authentication on every query
// ============================================================
class DatabasePoolManager {
  private primaryPool: Pool;
  private replicaPools: Pool[];
  private currentReplicaIndex = 0;

  constructor() {
    // ACTION: Create dedicated pool for primary database
    // REASON: Primary handles all writes and requires guaranteed
    //         connection availability for critical write operations
    this.primaryPool = new Pool(primaryConfig);

    // ACTION: Create pool for each replica
    // REASON: Multiple pools enable load balancing and fault isolation
    //         If one replica fails, others continue serving traffic
    this.replicaPools = replicaConfigs.map(config => new Pool(config));

    // Set up error handlers
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.primaryPool.on('error', (err) => {
      console.error('Primary pool error:', err);
      // Alert on-call: primary database issues are critical
    });

    this.replicaPools.forEach((pool, index) => {
      pool.on('error', (err) => {
        console.error(\`Replica \${index} pool error:\`, err);
        // Log warning: replica failures are less critical
      });
    });
  }

  // ACTION: Get primary pool for write operations
  // REASON: Writes must execute on primary to maintain data consistency
  //         and ensure all replicas receive changes via replication
  getPrimaryPool(): Pool {
    return this.primaryPool;
  }

  // ACTION: Get replica pool using round-robin load balancing
  // REASON: Distributes read load evenly across replicas, preventing
  //         any single replica from becoming a bottleneck
  // ALGORITHM: Round-robin is simple and effective for similar replicas
  //            More sophisticated: least-connections, weighted, latency-based
  getReplicaPool(): Pool {
    if (this.replicaPools.length === 0) {
      // Fallback: if no replicas available, use primary
      console.warn('No replicas available, using primary for read');
      return this.primaryPool;
    }

    // Round-robin: cycle through replicas
    const pool = this.replicaPools[this.currentReplicaIndex];
    this.currentReplicaIndex =
      (this.currentReplicaIndex + 1) % this.replicaPools.length;

    return pool;
  }

  async close(): Promise<void> {
    await this.primaryPool.end();
    await Promise.all(this.replicaPools.map(pool => pool.end()));
  }
}

const dbManager = new DatabasePoolManager();

// ============================================================
// User Repository with Read/Write Routing
// ============================================================
interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

class UserRepository {
  // ============================================================
  // Write Operations: Route to Primary
  // ============================================================

  // ACTION: Create user on primary database
  // REASON: Write operations must execute on primary to ensure
  //         consistency and trigger replication to replicas
  async createUser(username: string, email: string): Promise<User> {
    const pool = dbManager.getPrimaryPool();

    // ACTION: Execute INSERT on primary with RETURNING clause
    // REASON: RETURNING avoids extra SELECT to fetch inserted data,
    //         reducing round-trips and ensuring we get exact inserted values
    const result = await pool.query<User>(
      \`INSERT INTO users (username, email, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *\`,
      [username, email]
    );

    return result.rows[0];
  }

  // ACTION: Update user on primary database
  // REASON: Updates modify data and must execute on primary
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const pool = dbManager.getPrimaryPool();

    const result = await pool.query<User>(
      \`UPDATE users
       SET username = COALESCE($2, username),
           email = COALESCE($3, email)
       WHERE id = $1
       RETURNING *\`,
      [userId, updates.username, updates.email]
    );

    if (result.rows.length === 0) {
      throw new Error(\`User \${userId} not found\`);
    }

    return result.rows[0];
  }

  // ============================================================
  // Read Operations: Route to Replicas
  // ============================================================

  // ACTION: Fetch user from replica with eventual consistency
  // REASON: Read-only queries can use replicas, reducing primary load
  //         and enabling horizontal read scaling
  // TRADEOFF: Data may be slightly stale due to replication lag
  async getUserById(userId: number): Promise<User | null> {
    const pool = dbManager.getReplicaPool();

    // ACTION: Execute SELECT on replica
    // REASON: Replicas handle read traffic, freeing primary for writes
    // REPLICATION LAG: Typical lag is 10-100ms, but can spike to seconds
    //                  during high write volume or network issues
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }

  // ACTION: Search users on replica for list queries
  // REASON: Expensive queries (LIKE, pagination) run on replicas to
  //         protect primary from slow query impact
  async searchUsers(query: string, limit = 20): Promise<User[]> {
    const pool = dbManager.getReplicaPool();

    const result = await pool.query<User>(
      \`SELECT * FROM users
       WHERE username ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2\`,
      [\`%\${query}%\`, limit]
    );

    return result.rows;
  }

  // ============================================================
  // Read-After-Write Consistency Pattern
  // ============================================================

  // ACTION: Read from primary immediately after write
  // REASON: Prevents read-after-write inconsistency where user
  //         creates data but replica hasn't received it yet
  // USE CASE: After user registration, show profile page with
  //           guaranteed fresh data
  async createAndFetchUser(
    username: string,
    email: string
  ): Promise<User> {
    // Write to primary
    const user = await this.createUser(username, email);

    // ACTION: Immediately read from primary, not replica
    // REASON: Replicas may not have received new user yet
    //         Reading from primary guarantees consistency
    // ALTERNATIVE: Wait for replication lag + read from replica
    //              (more complex, typically not worth it)
    return user; // Already returned from INSERT...RETURNING
  }

  // ============================================================
  // Critical Read: Force Primary for Strong Consistency
  // ============================================================

  // ACTION: Read from primary when strong consistency required
  // REASON: Some operations (authentication, payment verification)
  //         cannot tolerate stale data
  // TRADEOFF: Increases primary load but ensures correctness
  async getUserByIdStrong(userId: number): Promise<User | null> {
    // ACTION: Explicitly use primary pool for strong consistency
    // REASON: Authentication checks must use latest data to prevent
    //         security issues (e.g., user deleted account but replica
    //         still shows active)
    const pool = dbManager.getPrimaryPool();

    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }
}

// ============================================================
// Advanced: Monitoring Replication Lag
// ============================================================
// ACTION: Monitor replication lag to detect synchronization issues
// REASON: High lag indicates replicas serving very stale data,
//         potentially causing user-visible inconsistencies
// ============================================================
class ReplicationMonitor {
  async checkReplicationLag(): Promise<void> {
    const pool = dbManager.getPrimaryPool();

    // ACTION: Query primary for replication status
    // REASON: PostgreSQL tracks replication lag for each replica
    const result = await pool.query(\`
      SELECT
        client_addr,
        state,
        sent_lsn,
        write_lsn,
        flush_lsn,
        replay_lsn,
        sync_state,
        EXTRACT(EPOCH FROM (NOW() - replay_timestamp)) AS lag_seconds
      FROM pg_stat_replication
    \`);

    for (const row of result.rows) {
      const lagSeconds = parseFloat(row.lag_seconds || '0');

      // ACTION: Alert if lag exceeds threshold
      // REASON: Lag > 30 seconds indicates serious replication issues
      //         User experience degrades with stale data
      if (lagSeconds > 30) {
        console.error(
          \`High replication lag detected: \${row.client_addr} is \${lagSeconds}s behind\`
        );
        // Send alert to ops team
      } else if (lagSeconds > 5) {
        console.warn(
          \`Elevated replication lag: \${row.client_addr} is \${lagSeconds}s behind\`
        );
      }
    }
  }

  // Run lag check every 10 seconds
  startMonitoring(): NodeJS.Timeout {
    return setInterval(() => this.checkReplicationLag(), 10000);
  }
}

// ============================================================
// Usage Example
// ============================================================
async function example() {
  const repo = new UserRepository();
  const monitor = new ReplicationMonitor();

  // Start monitoring replication health
  monitor.startMonitoring();

  // Write operation: goes to primary
  const newUser = await repo.createUser('alice', 'alice@example.com');
  console.log('Created user:', newUser);

  // Read operation: goes to replica (may be slightly stale)
  const user = await repo.getUserById(newUser.id);
  console.log('Fetched user from replica:', user);

  // Update operation: goes to primary
  const updated = await repo.updateUser(newUser.id, {
    email: 'alice.smith@example.com',
  });
  console.log('Updated user:', updated);

  // Search operation: expensive query on replica
  const results = await repo.searchUsers('alice');
  console.log(\`Found \${results.length} users matching 'alice'\`);

  // Strong consistency read: goes to primary
  const strongUser = await repo.getUserByIdStrong(newUser.id);
  console.log('Fetched user from primary (strong consistency):', strongUser);
}`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete read replica implementation with connection pooling, load balancing, and replication lag monitoring",
        prerequisites: [
          "PostgreSQL replication",
          "Connection pooling",
          "Eventual consistency",
          "Read-after-write consistency",
        ],
        systemPosition:
          "Data access layer routing database operations to primary for writes and replicas for reads in production web service",
      },
      annotations: [
        {
          id: "rr-connection-pools",
          lines: [47, 69],
          action:
            "Create separate connection pools for primary and each replica",
          reason:
            "Isolating read and write traffic prevents read spikes from exhausting write connections on primary. Replicas can scale independently to handle high read volume without impacting write throughput.",
          contextLevel: "system",
          relatedConcepts: ["connection-pooling", "resource-isolation"],
        },
        {
          id: "rr-round-robin",
          lines: [88, 108],
          action: "Implement round-robin load balancing across replica pools",
          reason:
            "Round-robin distributes read queries evenly across all replicas, preventing any single replica from becoming bottlenecked. Simple algorithm works well when replicas have similar capacity and are in same region.",
          contextLevel: "module",
          relatedConcepts: ["load-balancing", "round-robin"],
        },
        {
          id: "rr-write-routing",
          lines: [124, 143],
          action: "Route all write operations to primary database exclusively",
          reason:
            "Primary is the authoritative source of truth. All writes must execute on primary to maintain consistency and trigger replication to replicas. RETURNING clause avoids extra SELECT, reducing round-trips.",
          contextLevel: "module",
          relatedConcepts: ["write-authority", "data-consistency"],
        },
        {
          id: "rr-read-routing",
          lines: [157, 174],
          action: "Route read-only queries to replicas using load balancer",
          reason:
            "Replicas handle read traffic, freeing primary CPU and I/O for writes. Horizontal scaling: adding more replicas linearly increases total read capacity. Tradeoff: eventual consistency means data may be 10-100ms stale.",
          contextLevel: "system",
          relatedConcepts: ["eventual-consistency", "horizontal-scaling"],
        },
        {
          id: "rr-read-after-write",
          lines: [192, 210],
          action:
            "Read from primary immediately after write for read-after-write consistency",
          reason:
            "Prevents user from creating data then immediately querying replica that hasn't received update yet. Critical for good UX: user expects to see their own writes immediately. RETURNING clause already provides fresh data.",
          contextLevel: "module",
          relatedConcepts: ["read-after-write-consistency", "user-experience"],
        },
        {
          id: "rr-strong-consistency",
          lines: [212, 233],
          action:
            "Force primary reads for operations requiring strong consistency",
          reason:
            "Authentication, payment verification, and security checks cannot tolerate stale data. Reading from primary ensures latest state, preventing security vulnerabilities. Tradeoff: increases primary load but necessary for correctness.",
          contextLevel: "system",
          relatedConcepts: ["strong-consistency", "security"],
        },
        {
          id: "rr-lag-monitoring",
          lines: [235, 277],
          action: "Monitor replication lag using pg_stat_replication view",
          reason:
            "Replication lag > 30 seconds indicates serious issues (network problems, primary overload, slow replica). High lag causes user-visible staleness and should trigger alerts. Monitoring enables proactive issue detection.",
          contextLevel: "system",
          relatedConcepts: ["observability", "replication-lag", "alerting"],
        },
      ],
      highlights: [
        {
          lines: [47, 108],
          label: "Connection pool management with primary/replica isolation",
          sbvpDomain: "structure",
        },
        {
          lines: [124, 174],
          label: "Write routing to primary, read routing to replicas",
          sbvpDomain: "behavior",
        },
        {
          lines: [192, 233],
          label: "Read-after-write consistency and strong consistency patterns",
          sbvpDomain: "philosophy",
        },
        {
          lines: [235, 277],
          label: "Replication lag monitoring and alerting",
          sbvpDomain: "behavior",
        },
      ],
    },
    {
      id: "read-replicas-python-django",
      language: "python",
      title: "Django Multi-Database Read Replica Routing",
      description:
        "Django database router implementation for automatic read/write splitting with replica failover",
      code: `from typing import Optional, Type, Any, List
from django.conf import settings
from django.db import connections
from django.db.models import Model
import random
import logging

logger = logging.getLogger(__name__)

# ============================================================
# Django Database Configuration
# ============================================================
# settings.py configuration for primary and replicas
# ============================================================

# DATABASES = {
#     'default': {  # Primary database (write)
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'production',
#         'USER': 'app_user',
#         'PASSWORD': os.getenv('DB_PASSWORD'),
#         'HOST': 'primary-db.us-east-1.rds.amazonaws.com',
#         'PORT': '5432',
#         'CONN_MAX_AGE': 600,  # Connection pooling
#     },
#     'replica_1': {  # Read replica in us-east-1
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'production',
#         'USER': 'app_user',
#         'PASSWORD': os.getenv('DB_PASSWORD'),
#         'HOST': 'replica-1.us-east-1.rds.amazonaws.com',
#         'PORT': '5432',
#         'CONN_MAX_AGE': 600,
#     },
#     'replica_2': {  # Read replica in us-west-2
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'production',
#         'USER': 'app_user',
#         'PASSWORD': os.getenv('DB_PASSWORD'),
#         'HOST': 'replica-2.us-west-2.rds.amazonaws.com',
#         'PORT': '5432',
#         'CONN_MAX_AGE': 600,
#     },
# }

# DATABASE_ROUTERS = ['myapp.database_router.PrimaryReplicaRouter']

# ============================================================
# Custom Database Router for Read/Write Splitting
# ============================================================
# ACTION: Implement Django database router to route reads and writes
# REASON: Django's ORM doesn't natively route to replicas; custom
#         router intercepts database operations and directs them
#         to appropriate database based on operation type
# DJANGO ROUTER METHODS:
#   - db_for_read: Which database to use for SELECT queries
#   - db_for_write: Which database to use for INSERT/UPDATE/DELETE
#   - allow_relation: Whether to allow relations between databases
#   - allow_migrate: Which database to run migrations on
# ============================================================

class PrimaryReplicaRouter:
    """
    Database router that routes:
    - Writes (INSERT/UPDATE/DELETE) → primary ('default')
    - Reads (SELECT) → replicas ('replica_1', 'replica_2', ...)
    - Supports replica failover if replica is unavailable
    """

    # ACTION: Define list of replica database aliases
    # REASON: Centralized configuration makes it easy to add/remove
    #         replicas without changing routing logic
    REPLICA_DATABASES = ['replica_1', 'replica_2']

    def db_for_read(
        self,
        model: Type[Model],
        **hints: Any
    ) -> Optional[str]:
        """
        ACTION: Route read operations to random replica
        REASON: Distributes read load across replicas using random
                selection (simpler than round-robin, effective for
                stateless requests)
        HINTS: Django passes hints like 'instance' for related lookups
        """

        # ACTION: Check if hints specify a particular database
        # REASON: Some operations (e.g., reading within transaction)
        #         must use same database as write operation
        if 'instance' in hints:
            # If we're reading a related object that was just written,
            # use the same database to ensure read-after-write consistency
            instance = hints['instance']
            if instance._state.db and instance._state.db != 'default':
                return instance._state.db

        # ACTION: Select random replica for load balancing
        # REASON: Random selection is simple and effective for distributing
        #         load across replicas when requests are stateless
        # ALTERNATIVE: Round-robin requires shared state across processes
        try:
            replica = self._select_healthy_replica()
            logger.debug(f"Routing read for {model.__name__} to {replica}")
            return replica
        except Exception as e:
            # ACTION: Fallback to primary if no replicas available
            # REASON: Graceful degradation ensures application keeps working
            #         even if all replicas fail
            logger.warning(f"No healthy replicas, using primary for read: {e}")
            return 'default'

    def db_for_write(
        self,
        model: Type[Model],
        **hints: Any
    ) -> str:
        """
        ACTION: Route all write operations to primary database
        REASON: Primary is authoritative source of truth; all writes
                must execute there to trigger replication to replicas
        INVARIANT: Writes NEVER go to replicas (they're read-only)
        """
        logger.debug(f"Routing write for {model.__name__} to primary")
        return 'default'

    def allow_relation(
        self,
        obj1: Model,
        obj2: Model,
        **hints: Any
    ) -> bool:
        """
        ACTION: Allow relations between objects from same database
        REASON: Django needs to know if ForeignKey/ManyToMany relations
                are valid across databases
        STRATEGY: Allow all relations since all databases have same schema
        """
        return True

    def allow_migrate(
        self,
        db: str,
        app_label: str,
        model_name: Optional[str] = None,
        **hints: Any
    ) -> bool:
        """
        ACTION: Only run migrations on primary database
        REASON: Migrations modify schema; should execute on primary
                and replicate to replicas via normal replication
        CRITICAL: Never run migrations on replicas
        """
        return db == 'default'

    def _select_healthy_replica(self) -> str:
        """
        ACTION: Select random replica and verify it's healthy
        REASON: Prevents routing to replica that's down or lagging severely
        HEALTH CHECK: Attempt to get connection; if fails, try another
        """
        # ACTION: Shuffle replicas to randomize selection
        # REASON: Ensures uniform distribution across replicas over time
        replicas = self.REPLICA_DATABASES.copy()
        random.shuffle(replicas)

        # ACTION: Try each replica until one succeeds
        # REASON: Failover to another replica if first choice is down
        for replica in replicas:
            try:
                # ACTION: Test connection by getting from pool
                # REASON: Verifies replica is accessible before routing query
                # TRADEOFF: Adds latency but prevents failed queries
                connection = connections[replica]
                connection.ensure_connection()
                return replica
            except Exception as e:
                logger.warning(f"Replica {replica} unhealthy: {e}")
                continue

        # If all replicas failed, raise exception to fallback to primary
        raise Exception("No healthy replicas available")

# ============================================================
# Context Manager for Forcing Primary Reads
# ============================================================
# ACTION: Provide context manager to force primary reads
# REASON: Some operations require strong consistency and cannot
#         tolerate replication lag
# USE CASES: Authentication, payment processing, admin operations
# ============================================================

from contextlib import contextmanager
from django.db import transaction

@contextmanager
def use_primary_for_reads():
    """
    Context manager that forces all reads to use primary database
    within the context, ensuring strong consistency.

    Usage:
        with use_primary_for_reads():
            user = User.objects.get(id=user_id)  # Reads from primary
            # Guaranteed to see latest data
    """
    # ACTION: Use database transaction on primary
    # REASON: Transaction pins all operations to primary database,
    #         overriding router's replica selection
    # DJANGO BEHAVIOR: Operations within transaction always use
    #                  the database where transaction started
    with transaction.atomic(using='default'):
        yield

# ============================================================
# Repository Pattern with Read Replica Awareness
# ============================================================

from django.contrib.auth.models import User
from typing import List, Optional

class UserRepository:
    """
    Repository demonstrating read replica patterns:
    - Normal reads use replicas (eventual consistency)
    - Post-write reads use primary (read-after-write consistency)
    - Critical reads use primary (strong consistency)
    """

    def create_user(
        self,
        username: str,
        email: str,
        password: str
    ) -> User:
        """
        ACTION: Create user and immediately read from primary
        REASON: Ensures user sees their account immediately after
                registration without waiting for replication
        """
        # ACTION: Create user (routes to primary via db_for_write)
        # REASON: Write operations always execute on primary
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # ACTION: Refresh from primary to ensure fresh data
        # REASON: Even though object was just created, explicitly
        #         reading from primary documents intent and ensures
        #         any database triggers/defaults are captured
        with use_primary_for_reads():
            user.refresh_from_db()

        return user

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        ACTION: Fetch user from replica (eventual consistency)
        REASON: User profile reads can tolerate slight staleness
        REPLICATION LAG: Typically 10-100ms, data is fresh enough
                        for most use cases
        """
        try:
            # Routes to replica via db_for_read
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def get_user_for_auth(self, user_id: int) -> Optional[User]:
        """
        ACTION: Fetch user from primary for authentication
        REASON: Authentication must use latest data to prevent
                security issues (e.g., user disabled but replica
                still shows active)
        SECURITY: Critical operations require strong consistency
        """
        with use_primary_for_reads():
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return None

    def search_users(self, query: str, limit: int = 20) -> List[User]:
        """
        ACTION: Search users on replica
        REASON: Expensive LIKE queries should run on replica to
                protect primary from slow query impact
        """
        # Routes to replica via db_for_read
        return list(
            User.objects.filter(
                username__icontains=query
            ).order_by('-date_joined')[:limit]
        )

    def update_user_email(self, user_id: int, new_email: str) -> User:
        """
        ACTION: Update user and read from primary
        REASON: User should see email change immediately,
                not wait for replication lag
        """
        with transaction.atomic(using='default'):
            # ACTION: Use select_for_update to prevent race conditions
            # REASON: Locks row on primary during update, preventing
            #         concurrent modifications
            user = User.objects.select_for_update().get(id=user_id)
            user.email = new_email
            user.save()

            # Refresh from primary to get any database-modified fields
            user.refresh_from_db()

        return user

# ============================================================
# Replication Lag Monitoring
# ============================================================

from django.db import connection

class ReplicationMonitor:
    """Monitor replication lag for PostgreSQL replicas"""

    @staticmethod
    def check_replication_lag() -> List[dict]:
        """
        ACTION: Query primary for replication lag metrics
        REASON: High lag indicates replicas serving very stale data
        RETURNS: List of replica stats with lag in seconds
        """
        with connection.cursor() as cursor:
            # ACTION: Query PostgreSQL replication status
            # REASON: pg_stat_replication view shows lag for each replica
            cursor.execute("""
                SELECT
                    client_addr,
                    application_name,
                    state,
                    sync_state,
                    EXTRACT(EPOCH FROM (NOW() - replay_timestamp)) AS lag_seconds,
                    replay_lag
                FROM pg_stat_replication
            """)

            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]

            # ACTION: Log warnings for high lag
            # REASON: Enables alerting and debugging replication issues
            for replica in results:
                lag = replica.get('lag_seconds', 0) or 0
                if lag > 30:
                    logger.error(
                        f"CRITICAL: Replica {replica['client_addr']} "
                        f"is {lag:.1f}s behind"
                    )
                elif lag > 5:
                    logger.warning(
                        f"WARNING: Replica {replica['client_addr']} "
                        f"is {lag:.1f}s behind"
                    )

            return results

    @staticmethod
    def health_check_replica(replica_alias: str) -> bool:
        """
        ACTION: Check if replica is healthy and reachable
        REASON: Enables removing unhealthy replicas from routing
        """
        try:
            conn = connections[replica_alias]
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                return result == (1,)
        except Exception as e:
            logger.error(f"Replica {replica_alias} health check failed: {e}")
            return False

# ============================================================
# Usage Example
# ============================================================

def example_usage():
    repo = UserRepository()

    # Write: goes to primary
    user = repo.create_user(
        username='alice',
        email='alice@example.com',
        password='secure_password'
    )
    print(f"Created user {user.id} on primary")

    # Read: goes to replica (eventual consistency)
    fetched = repo.get_user_by_id(user.id)
    print(f"Fetched user from replica: {fetched}")

    # Critical read: goes to primary (strong consistency)
    auth_user = repo.get_user_for_auth(user.id)
    print(f"Fetched user from primary for auth: {auth_user}")

    # Update: goes to primary
    updated = repo.update_user_email(user.id, 'alice.smith@example.com')
    print(f"Updated user email on primary: {updated.email}")

    # Expensive query: goes to replica
    results = repo.search_users('alice')
    print(f"Found {len(results)} users matching 'alice' (from replica)")

    # Monitor replication health
    monitor = ReplicationMonitor()
    lag_stats = monitor.check_replication_lag()
    for stat in lag_stats:
        print(f"Replica {stat['client_addr']}: {stat['lag_seconds']:.2f}s lag")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production Django database router with automatic read/write splitting, replica health checks, and replication lag monitoring",
        prerequisites: [
          "Django ORM",
          "Database routers",
          "PostgreSQL replication",
          "Connection management",
        ],
        systemPosition:
          "ORM layer in Django web application automatically routing database operations to primary and replicas based on operation type",
      },
      annotations: [
        {
          id: "rr-django-router",
          lines: [57, 78],
          action:
            "Implement Django database router to intercept database operations",
          reason:
            "Django doesn't natively support read replicas. Custom router intercepts ORM queries and directs them to appropriate database. Router methods (db_for_read, db_for_write) are called automatically by Django's ORM for every database operation.",
          contextLevel: "system",
          relatedConcepts: ["orm-routing", "django-architecture"],
        },
        {
          id: "rr-read-routing",
          lines: [80, 110],
          action:
            "Route read operations to random replica with fallback to primary",
          reason:
            "Random selection distributes load across replicas without shared state (simpler than round-robin in multi-process environments). Fallback to primary ensures graceful degradation if all replicas fail.",
          contextLevel: "module",
          relatedConcepts: ["random-load-balancing", "graceful-degradation"],
        },
        {
          id: "rr-write-routing",
          lines: [112, 124],
          action: "Route all write operations exclusively to primary database",
          reason:
            "Primary is authoritative source of truth. All writes must execute on primary to maintain consistency and trigger replication. Writes to replicas would be rejected as read-only.",
          contextLevel: "module",
          relatedConcepts: ["write-authority", "replication-source"],
        },
        {
          id: "rr-health-check",
          lines: [147, 169],
          action:
            "Health check replicas before routing to detect unavailability",
          reason:
            "Attempting connection to replica before routing query prevents failed requests. If replica is down, try another or fallback to primary. Adds latency but prevents errors.",
          contextLevel: "module",
          relatedConcepts: ["health-checking", "failover"],
        },
        {
          id: "rr-force-primary",
          lines: [171, 195],
          action:
            "Context manager to force primary reads for strong consistency",
          reason:
            "Some operations (authentication, payments, admin) cannot tolerate replication lag. Transaction on primary pins all reads to primary, overriding router's replica selection. Ensures latest data.",
          contextLevel: "system",
          relatedConcepts: ["strong-consistency", "transaction-pinning"],
        },
        {
          id: "rr-create-and-read",
          lines: [212, 236],
          action: "Create user on primary then immediately read from primary",
          reason:
            "Read-after-write consistency: user expects to see their account immediately after registration. Reading from replica might miss newly created user due to replication lag. Explicit primary read ensures good UX.",
          contextLevel: "module",
          relatedConcepts: ["read-after-write-consistency", "user-experience"],
        },
        {
          id: "rr-auth-read",
          lines: [251, 265],
          action: "Force primary read for authentication to ensure security",
          reason:
            "Authentication must use latest user state (active, password hash, permissions). Replica lag could show disabled user as active, creating security vulnerability. Strong consistency is critical for auth.",
          contextLevel: "system",
          relatedConcepts: ["security", "strong-consistency"],
        },
        {
          id: "rr-lag-monitoring",
          lines: [304, 345],
          action: "Query pg_stat_replication view to monitor replication lag",
          reason:
            "Replication lag > 30 seconds indicates serious issues (network problems, overloaded primary, slow replica). Monitoring enables alerting and debugging. High lag causes user-visible staleness and should trigger investigation.",
          contextLevel: "system",
          relatedConcepts: [
            "observability",
            "replication-lag",
            "postgresql-monitoring",
          ],
        },
      ],
      highlights: [
        {
          lines: [57, 145],
          label: "Django database router with read/write splitting logic",
          sbvpDomain: "structure",
        },
        {
          lines: [147, 169],
          label: "Replica health checking with failover",
          sbvpDomain: "behavior",
        },
        {
          lines: [171, 195],
          label: "Force primary reads context manager",
          sbvpDomain: "behavior",
        },
        {
          lines: [304, 345],
          label: "Replication lag monitoring and alerting",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Web application database layer for read-heavy workloads",
      "API backend serving high-volume read requests",
      "Analytics and reporting systems querying production data",
      "Content delivery platforms (blogs, news, social media)",
    ],
    interactsWith: [
      "cache-aside",
      "write-through",
      "connection-pooling",
      "load-balancing",
      "circuit-breaker",
      "health-check",
    ],
    architecturalBoundaries: [
      "Between application tier and database tier",
      "Within database tier: primary vs replica distinction",
      "Across geographic regions for global read distribution",
    ],
  },
};
