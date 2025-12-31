import type { Pattern } from "../schema";

export const connectionTimeout: Pattern = {
  id: "connection-timeout",
  slug: "connection-timeout",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → ⏱️ Timeouts → 🔗 Connection Timeout",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Timeouts",
    level: 4,
  },

  concept: {
    name: "Connection Timeout",
    emoji: "🔗",
    tagline: "Max time to establish connection",
    definition:
      "Connection Timeout is a network resilience pattern that enforces a maximum time limit specifically for establishing a TCP connection to a remote server, separate from timeouts for reading response data or overall request duration. The pattern addresses a critical failure mode: when attempting to connect to an unresponsive server (crashed, firewalled, or network-partitioned), clients can hang indefinitely during the TCP handshake phase, blocking threads and exhausting connection resources. Connection timeouts prevent this resource exhaustion by aborting connection attempts that exceed a configured threshold (typically 5-30 seconds). The timeout starts when the client initiates the TCP SYN packet and ends when the full three-way handshake completes (SYN, SYN-ACK, ACK). If the handshake doesn't complete within the timeout window, the client closes the socket and returns an error, freeing the thread to handle other work. This is distinct from read timeouts (time waiting for response data after connection established) and request timeouts (end-to-end operation time). Connection timeouts are essential for preventing thread pool exhaustion in high-concurrency systems: without them, a single unresponsive dependency can consume all available threads waiting for connections that will never complete, causing cascading failures across the entire application. The pattern is particularly critical in microservices architectures where services make dozens of outbound connections—one misbehaving dependency shouldn't deadlock the entire system. Most HTTP clients and database drivers implement connection timeouts as a configuration parameter, with sensible defaults that balance network latency variations against failure detection speed.",
    problemSolved:
      "Network connections fail in ways that can cause indefinite blocking: servers crash mid-handshake, firewalls silently drop SYN packets, network partitions prevent responses, or overloaded servers delay accepting connections. Without connection timeouts, clients wait forever for connections that will never complete, blocking precious resources (threads, event loop slots, file descriptors). In a thread-per-request server with 200 thread pool, if 200 requests attempt to connect to a dead server, all threads block indefinitely in connect(), preventing the server from handling ANY requests—even those to healthy dependencies. The entire service becomes unresponsive due to one failed dependency. This problem compounds in microservices: Service A calls Service B (dead), tying up A's threads. Service C calls A, but A can't respond (all threads blocked), so C's threads block too. The failure cascades through the dependency graph. Connection timeouts solve this by bounding block time: after 10 seconds (typical timeout), the thread is released with a timeout error, allowing the application to handle the failure gracefully (return cached data, use fallback service, return error to user). The freed thread can then serve other requests. Connection timeouts also enable rapid failover: in a replicated database setup with primary and standby, if the primary crashes, connection timeout determines how quickly the client detects the failure and switches to standby—a 5s timeout means 5s max downtime, while indefinite blocking means permanent downtime. The pattern is fundamental to building systems that fail fast and preserve capacity under partial failures.",
    tradeoffs: {
      pros: [
        "Prevents indefinite blocking on dead servers",
        "Releases resources quickly when connections fail",
        "Enables faster failover to alternative servers",
        "Protects against network partition issues",
      ],
      cons: [
        "May fail connections during temporary network slowness",
        "Requires tuning for different network conditions",
        "Too short timeouts cause false failures",
        "Too long timeouts defeat the purpose",
      ],
    },
    relatedPatterns: ["timeout", "read-timeout", "circuit-breaker", "retry"],
  },

  structure: {
    participants: [
      {
        name: "Connection Manager",
        role: "Establishes connections",
        responsibilities: [
          "Initiate TCP connection to remote server",
          "Monitor connection establishment progress",
          "Abort if timeout exceeded",
        ],
      },
      {
        name: "Timeout Timer",
        role: "Enforces time limit",
        responsibilities: [
          "Start timer when connection attempt begins",
          "Signal timeout if limit exceeded",
          "Cancel timer on successful connection",
        ],
      },
      {
        name: "Error Handler",
        role: "Handles timeout failures",
        responsibilities: [
          "Close partial connection on timeout",
          "Release system resources",
          "Propagate timeout error to caller",
        ],
      },
    ],
    diagram: `graph TB
    Start([Initiate Connection]) --> StartTimer[⏱️ Start Timeout Timer]
    StartTimer --> Attempt[TCP SYN]
    Attempt --> Race{Race: Connection<br/>vs Timeout}

    Race -->|Connection Succeeds| Cancel[Cancel Timer]
    Cancel --> Success([Return Connection])

    Race -->|Timeout Fires| Close[Close Socket]
    Close --> Fail([Throw TimeoutError])

    style Start fill:#e1f5e1
    style Success fill:#e1f5e1
    style Fail fill:#ffe1e1
    style StartTimer fill:#fff4e1
    style Race fill:#e1e5ff`,
    flow: [
      {
        step: 1,
        actor: "Connection Manager",
        action: "Initiate Connection",
        description: "Start TCP connection to target host:port",
      },
      {
        step: 2,
        actor: "Timeout Timer",
        action: "Start Timer",
        description: "Begin countdown for connection timeout limit",
      },
      {
        step: 3,
        actor: "Connection Manager",
        action: "Wait for SYN-ACK",
        description: "Wait for server to respond to connection request",
      },
      {
        step: 4,
        actor: "Timeout Timer",
        action: "Monitor Progress",
        description: "Check if timeout has been exceeded",
      },
      {
        step: 5,
        actor: "Error Handler",
        action: "Handle Outcome",
        description:
          "On success: return connection. On timeout: close socket and throw error",
      },
    ],
    invariants: [
      "Timer must start before connection attempt begins",
      "Connection must be closed on timeout",
      "Timeout duration must be less than overall request timeout",
      "Resources must be released regardless of outcome",
    ],
  },

  codeExamples: [
    {
      id: "connection-timeout-ts-fetch",
      language: "typescript",
      title: "HTTP Connection Timeout with AbortController",
      description:
        "Implementation of connection timeout using fetch with AbortController",
      code: `interface ConnectionTimeoutConfig {
  connectionTimeoutMs: number;
  url: string;
  options?: RequestInit;
}

async function fetchWithConnectionTimeout({
  connectionTimeoutMs,
  url,
  options = {},
}: ConnectionTimeoutConfig): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, connectionTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        \`Connection timeout after \${connectionTimeoutMs}ms connecting to \${url}\`
      );
    }

    throw error;
  }
}

// TCP socket connection timeout example (Node.js)
import { Socket } from "net";

function connectWithTimeout(
  host: string,
  port: number,
  timeoutMs: number
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let isConnected = false;

    // Set connection timeout
    const timeoutId = setTimeout(() => {
      if (!isConnected) {
        socket.destroy();
        reject(new Error(\`Connection timeout after \${timeoutMs}ms to \${host}:\${port}\`));
      }
    }, timeoutMs);

    socket.connect(port, host, () => {
      isConnected = true;
      clearTimeout(timeoutId);
      resolve(socket);
    });

    socket.on("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Usage
try {
  const response = await fetchWithConnectionTimeout({
    url: "https://api.example.com/data",
    connectionTimeoutMs: 5000, // 5 second connection timeout
  });

  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error("Connection failed:", error.message);
}`,
      runnable: true,
      contextDilation: {
        level: "local",
        scope: "local",
        systemPosition:
          "Connection timeout sits at the lowest level of network I/O, wrapping socket connection establishment. It's configured in HTTP clients, database drivers, and TCP socket libraries before any application-level protocol logic executes.",
        prerequisites: [
          "Understanding of TCP three-way handshake (SYN, SYN-ACK, ACK)",
          "Knowledge of Promise.race() or AbortController for cancellation",
          "Familiarity with the difference between connection, read, and request timeouts",
        ],
      },
      annotations: [
        {
          id: "connection-timeout-config",
          lines: [1, 4],
          action:
            "Define configuration interface for connection timeout parameters",
          reason:
            "Type-safe configuration prevents runtime errors from invalid timeout values. Separating connectionTimeoutMs, url, and options makes the API explicit about what's being configured. This interface pattern enables compile-time validation of timeout values and provides clear documentation of required vs optional parameters.",
          contextLevel: "local",
          relatedConcepts: ["type-safety", "api-design"],
        },
        {
          id: "connection-timeout-abort-signal",
          lines: [11, 14],
          action:
            "Create AbortController to enable cancelling in-flight connection attempt",
          reason:
            "AbortController provides the mechanism to cancel fetch() requests mid-flight. When timeout fires, abort() sends cancellation signal to the fetch API, which stops the TCP handshake and throws an AbortError. Without this, setTimeout alone would fire but the connection attempt would continue, wasting resources. The controller couples timeout logic to connection lifecycle—critical for actually releasing resources on timeout.",
          contextLevel: "local",
          relatedConcepts: ["abort-controller", "promise-cancellation"],
        },
        {
          id: "connection-timeout-timer-setup",
          lines: [12, 14],
          action:
            "Set timer that aborts the fetch operation after timeout expires",
          reason:
            "setTimeout creates the deadline enforcement mechanism. After connectionTimeoutMs milliseconds, if the fetch hasn't completed, controller.abort() is called which cancels the underlying TCP connection attempt. This timer runs in parallel with the fetch operation, creating a race condition between successful connection and timeout—whichever happens first wins.",
          contextLevel: "local",
          relatedConcepts: ["timer-management", "race-conditions"],
        },
        {
          id: "connection-timeout-signal-propagation",
          lines: [16, 20],
          action: "Pass AbortController signal to fetch to enable cancellation",
          reason:
            "The signal parameter connects the AbortController to the fetch API's internal cancellation mechanism. When controller.abort() is called, the signal fires, causing fetch to immediately stop the connection attempt and reject with AbortError. Without passing the signal, the AbortController would be useless—there'd be no way to actually cancel the in-flight request.",
          contextLevel: "local",
          relatedConcepts: ["signal-propagation", "api-integration"],
        },
        {
          id: "connection-timeout-cleanup",
          lines: [22, 23],
          action:
            "Clear timeout in both success and error paths to prevent memory leaks",
          reason:
            "Dangling setTimeout callbacks leak memory if not cleared. If connection succeeds before timeout, the timeout must be cancelled—otherwise it fires unnecessarily and attempts to abort an already-completed connection. If connection fails for non-timeout reasons (DNS error, network unreachable), we also clear the timeout to avoid double error reporting. Cleanup discipline is essential in timeout patterns.",
          contextLevel: "local",
          relatedConcepts: ["resource-cleanup", "timer-management"],
        },
        {
          id: "connection-timeout-error-differentiation",
          lines: [26, 32],
          action: "Distinguish timeout errors from other connection failures",
          reason:
            "Different error types warrant different handling strategies. Timeout errors suggest the server is unreachable or overloaded—retry with exponential backoff or failover to replica makes sense. DNS errors or network unreachable errors indicate different problems requiring different responses. Checking error.name === 'AbortError' specifically identifies timeout vs other fetch failures, enabling nuanced error handling and clearer logging/monitoring.",
          contextLevel: "module",
          relatedConcepts: ["error-classification", "failure-handling"],
        },
        {
          id: "connection-timeout-socket-implementation",
          lines: [38, 57],
          action:
            "Implement low-level TCP socket connection timeout using Node.js net module",
          reason:
            "Socket-level timeout provides finer control than HTTP-level timeouts. This demonstrates the pattern at the TCP layer where connection timeout literally controls the three-way handshake (SYN, SYN-ACK, ACK). The Promise wrapper enables async/await usage while the timer + socket.destroy() pattern prevents indefinite blocking during connection establishment. This is what HTTP libraries use internally.",
          contextLevel: "module",
          relatedConcepts: ["tcp-sockets", "low-level-networking"],
        },
        {
          id: "connection-timeout-promise-wrapper",
          lines: [44, 51],
          action:
            "Wrap socket connection in Promise to enable async/await and timeout cancellation",
          reason:
            "Node.js socket.connect() uses callbacks, but modern code uses Promises. The Promise wrapper allows timer-based cancellation: if timeout fires before connection completes, socket.destroy() is called which aborts the TCP handshake and rejects the promise. The isConnected flag prevents race condition where both timeout and successful connection fire simultaneously.",
          contextLevel: "module",
          relatedConcepts: ["callback-to-promise", "async-patterns"],
        },
        {
          id: "connection-timeout-race-condition-handling",
          lines: [47, 50],
          action:
            "Use isConnected flag to prevent race between timeout and successful connection",
          reason:
            "Without the isConnected guard, a race condition exists: connection completes at 4.999s, timeout fires at 5s. Both clearTimeout and socket.destroy could execute, or the timeout could destroy a successfully connected socket. The flag ensures cleanup only happens if connection hasn't succeeded, making the timeout and success callbacks mutually exclusive.",
          contextLevel: "local",
          relatedConcepts: ["race-condition-prevention", "state-management"],
        },
        {
          id: "connection-timeout-error-handling",
          lines: [53, 56],
          action:
            "Handle socket errors separately from timeout to differentiate failure modes",
          reason:
            "Socket errors (ECONNREFUSED, ENETUNREACH, DNS failures) are different from timeout errors. Connection refused means the server actively rejected the connection—retrying immediately won't help. Network unreachable suggests routing issues. Timeout suggests the server is overloaded or network is congested. Separating error handling enables appropriate retry strategies and clearer debugging.",
          contextLevel: "module",
          relatedConcepts: ["error-handling", "failure-modes"],
        },
        {
          id: "connection-timeout-usage-example",
          lines: [60, 70],
          action:
            "Demonstrate practical usage with realistic timeout value and error handling",
          reason:
            "The 5-second timeout is a production-reasonable value—long enough for cross-region connections, short enough to fail fast on dead servers. The try-catch pattern shows how calling code should handle timeout failures. This example guides developers on appropriate timeout values (not 100ms, not 60s) and shows that timeout errors should be caught and handled, not allowed to crash the application.",
          contextLevel: "module",
          relatedConcepts: ["best-practices", "production-configuration"],
        },
      ],
      highlights: [
        {
          lines: [1, 4],
          sbvpDomain: "structure",
          label: "Type-safe configuration interface for connection timeout",
        },
        {
          lines: [11, 14],
          sbvpDomain: "behavior",
          label: "AbortController enables request cancellation on timeout",
        },
        {
          lines: [16, 20],
          sbvpDomain: "behavior",
          label: "Race between successful connection and timeout deadline",
        },
        {
          lines: [22, 32],
          sbvpDomain: "behavior",
          label:
            "Cleanup and error differentiation for timeout vs connection failures",
        },
        {
          lines: [38, 57],
          sbvpDomain: "structure",
          label: "Low-level TCP socket connection timeout implementation",
        },
        {
          lines: [44, 51],
          sbvpDomain: "behavior",
          label:
            "Promise wrapper with race condition prevention via isConnected flag",
        },
        {
          lines: [60, 70],
          sbvpDomain: "philosophy",
          label: "Production usage with realistic 5-second timeout value",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Connection timeouts are configured at the lowest level of client libraries: HTTP client creation (axios.create, fetch wrappers), database connection strings or pool configuration, gRPC channel creation, and WebSocket initialization. They belong in infrastructure setup code, not business logic, and should be set once during application bootstrap based on network latency characteristics and SLAs.",
    ],
    architecturalBoundaries: [
      "HTTP Clients: Axios timeout config, fetch AbortSignal, request library options",
      "Database Drivers: PostgreSQL connect_timeout, MySQL connectTimeout, MongoDB socketTimeoutMS",
      "Message Queues: AMQP connection timeout, Kafka connection.timeout.ms",
      "Service Mesh: Envoy upstream connection timeout, Linkerd connection timeout policy",
      "Cloud Services: AWS SDK httpOptions.connectTimeout, Azure SDK timeout configs",
    ],
    interactsWith: [
      "timeout",
      "read-timeout",
      "request-timeout",
      "circuit-breaker",
      "retry",
      "connection-pooling",
    ],
  },

  implementations: [
    {
      id: "axios-timeout",
      name: "Axios HTTP Timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Popular HTTP client for Node.js and browsers with configurable connection and request timeouts. Supports both global instance-level timeouts and per-request overrides.",
      links: {
        github: "https://github.com/axios/axios",
        docs: "https://axios-http.com/docs/req_config",
      },
      codeSnippet: `import axios from 'axios';

// Global timeout configuration
const client = axios.create({
  timeout: 5000, // 5s total request timeout (connect + response)
  // Note: Axios doesn't separate connection timeout from total timeout
});

// Per-request timeout override
const response = await client.get('/api/users', {
  timeout: 10000, // 10s for this request
});

// Separate connection timeout using http/https agents (Node.js)
import http from 'http';
const clientWithConnectTimeout = axios.create({
  httpAgent: new http.Agent({
    timeout: 3000, // 3s connection timeout
  }),
  timeout: 10000, // 10s total timeout
});`,
    },
    {
      id: "fetch-abort-signal",
      name: "Fetch API with AbortSignal",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Native browser and Node.js fetch API with timeout via AbortController. Standard web API for request cancellation including connection timeouts.",
      links: {
        docs: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal#implementing_a_timeout",
      },
      codeSnippet: `// Timeout using AbortSignal.timeout (Node 18+, modern browsers)
const response = await fetch('https://api.example.com/data', {
  signal: AbortSignal.timeout(5000), // 5s timeout
});

// Manual timeout with AbortController (older environments)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('https://api.example.com/data', {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timeout after 5s');
  }
  throw error;
}`,
    },
    {
      id: "node-http-timeout",
      name: "Node.js http/https Timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Built-in Node.js http module with socket-level timeout control. Provides setTimeout for connection and idle timeouts on request and socket objects.",
      links: {
        docs: "https://nodejs.org/api/http.html#httprequestoptions-callback",
      },
      codeSnippet: `import https from 'https';

const request = https.request({
  hostname: 'api.example.com',
  path: '/data',
  method: 'GET',
  timeout: 5000, // Socket timeout (idle timeout)
}, (response) => {
  // Handle response
});

// Socket connection timeout
request.on('socket', (socket) => {
  socket.setTimeout(3000); // 3s connection timeout
  socket.on('timeout', () => {
    request.destroy(new Error('Connection timeout'));
  });
});

request.on('timeout', () => {
  request.destroy(new Error('Request timeout'));
});

request.end();`,
    },
    {
      id: "postgres-connect-timeout",
      name: "PostgreSQL Connection Timeout",
      type: "platform",
      languages: ["sql"],
      description:
        "PostgreSQL database connection string parameter for TCP connection timeout. Prevents hanging on unavailable database servers.",
      links: {
        docs: "https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-CONNECT-TIMEOUT",
      },
      codeSnippet: `// PostgreSQL connection string with timeout
const connectionString = 'postgresql://user:pass@host:5432/db?connect_timeout=10';

// Using pg library (Node.js)
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'mydb',
  connectionTimeoutMillis: 5000, // 5s connection timeout
  query_timeout: 30000, // 30s query timeout (separate)
  idle_in_transaction_session_timeout: 10000, // 10s idle in transaction
});

// Python psycopg2
import psycopg2
conn = psycopg2.connect(
    host="localhost",
    database="mydb",
    connect_timeout=5  # 5s connection timeout
)`,
    },
    {
      id: "mongodb-timeout",
      name: "MongoDB Connection Timeout",
      type: "platform",
      languages: ["javascript", "typescript", "python", "java"],
      description:
        "MongoDB driver with connectTimeoutMS and socketTimeoutMS parameters. Controls initial connection handshake and idle socket timeouts.",
      links: {
        docs: "https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/#connection-options",
      },
      codeSnippet: `import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017', {
  connectTimeoutMS: 5000,  // 5s TCP connection timeout
  socketTimeoutMS: 30000,  // 30s socket read timeout
  serverSelectionTimeoutMS: 10000, // 10s server discovery timeout
});

// Connection string format
const uri = 'mongodb://host:27017/db?connectTimeoutMS=5000&socketTimeoutMS=30000';

// Python PyMongo
from pymongo import MongoClient
client = MongoClient(
    'mongodb://localhost:27017',
    connectTimeoutMS=5000,
    socketTimeoutMS=30000
)`,
    },
    {
      id: "grpc-timeout",
      name: "gRPC Connection and Deadline",
      type: "framework",
      languages: ["go", "java", "python", "cpp"],
      description:
        "gRPC framework with KeepAlive parameters for connection timeout and per-call deadlines. Configurable via channel options for connection health monitoring.",
      links: {
        docs: "https://grpc.io/docs/guides/deadlines/",
      },
      codeSnippet: `// Go gRPC client with connection timeout
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/keepalive"
)

conn, err := grpc.Dial(
    "localhost:50051",
    grpc.WithKeepaliveParams(keepalive.ClientParameters{
        Time:                10 * time.Second, // Ping interval
        Timeout:             3 * time.Second,  // Connection timeout
        PermitWithoutStream: true,
    }),
)

// Per-call deadline (request timeout)
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
response, err := client.GetData(ctx, &request)`,
    },
    {
      id: "redis-connect-timeout",
      name: "Redis Connection Timeout",
      type: "library",
      languages: ["javascript", "typescript", "python", "go"],
      description:
        "Redis client libraries with connectTimeout and socket timeout configuration. Prevents indefinite blocking on unavailable Redis servers.",
      links: {
        docs: "https://github.com/redis/node-redis#client-configuration",
      },
      codeSnippet: `// Node.js redis client
import { createClient } from 'redis';

const client = createClient({
  socket: {
    connectTimeout: 5000,  // 5s connection timeout
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

// ioredis (alternative Node.js client)
import Redis from 'ioredis';
const redis = new Redis({
  host: 'localhost',
  connectTimeout: 5000,  // 5s connection timeout
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Python redis-py
import redis
r = redis.Redis(
    host='localhost',
    socket_connect_timeout=5,  # 5s connection timeout
    socket_timeout=10  # 10s socket timeout
)`,
    },
    {
      id: "kafka-timeout",
      name: "Kafka Connection Timeout",
      type: "platform",
      languages: ["java", "scala", "python"],
      description:
        "Apache Kafka producer and consumer with connection timeout configuration. Controls broker connection establishment timeout via client properties.",
      links: {
        docs: "https://kafka.apache.org/documentation/#producerconfigs_connections.max.idle.ms",
      },
      codeSnippet: `// Kafka producer configuration (Java)
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("connections.max.idle.ms", 540000); // 9min idle timeout
props.put("request.timeout.ms", 30000); // 30s request timeout

// Kafka consumer
Properties consumerProps = new Properties();
consumerProps.put("bootstrap.servers", "localhost:9092");
consumerProps.put("session.timeout.ms", 10000); // 10s session timeout
consumerProps.put("heartbeat.interval.ms", 3000); // 3s heartbeat

// Python kafka-python
from kafka import KafkaProducer
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    connections_max_idle_ms=540000,
    request_timeout_ms=30000
)`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-zuul",
      systemName: "Netflix Zuul API Gateway",
      howUsed:
        "Netflix Zuul uses aggressive connection timeouts to protect against slow backend services. Each backend service has a configured connection timeout (typically 500ms-1s) based on P99 latency SLAs. When connecting to the recommendation service, if TCP handshake doesn't complete within 500ms, Zuul immediately fails the connection and triggers circuit breaker logic or serves fallback content. This prevents thread pool exhaustion from slow connection attempts—without timeouts, threads would block indefinitely waiting for connections, eventually overwhelming the gateway. Zuul uses Ribbon client library which implements connection timeout per target service, allowing fine-grained control: critical services get 1s timeouts, non-critical services get 300ms. During AWS network partitions affecting cross-AZ connectivity, aggressive timeouts allow Zuul to quickly fail over to healthy AZs instead of waiting for kernel-level TCP timeouts (2+ minutes). Pattern composition: Connection Timeout + Circuit Breaker + Thread Pool Isolation + Multi-AZ Failover. Impact: Reduced P99 latency by 40% during partial failures; prevented gateway crashes from slow backend connections; improved failure recovery time from 2 minutes to 1 second.",
      source:
        "https://netflixtechblog.com/zuul-2-the-netflix-journey-to-asynchronous-non-blocking-systems-45947377fb5c",
    },
    {
      systemId: "aws-elb",
      systemName: "AWS Elastic Load Balancer",
      howUsed:
        "AWS ELB uses connection timeouts to prevent resource exhaustion from slow or unresponsive backend instances. Application Load Balancers have a configurable idle timeout (default 60s) that closes connections if no data is transmitted within that period. When establishing connections to backend EC2 instances, ELB uses a 10-second connection timeout—if TCP handshake doesn't complete (instance overloaded, network partition, security group misconfiguration), ELB marks the instance unhealthy and routes traffic to healthy instances. During scaling events where new instances are launching, connection timeouts prevent ELB from queueing requests to instances that aren't yet ready to serve traffic. Classic Load Balancers use a 60s timeout for backend connections, giving backend applications time to establish database connections during startup. Pattern composition: Connection Timeout + Health Checks + Instance Draining + Cross-AZ Failover. Impact: Improved user-facing latency by failing fast on unhealthy backends; reduced false-positive health check failures during instance startup; enabled safe deployment of slow-starting applications.",
      source:
        "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html#connection-idle-timeout",
    },
    {
      systemId: "kubernetes-ingress",
      systemName: "Kubernetes Nginx Ingress Controller",
      howUsed:
        "Kubernetes Nginx Ingress uses connection timeouts to protect against unresponsive pods during rolling deployments and pod failures. The ingress controller configures upstream-connect-timeout (default 60s) for establishing connections to backend pods. When a pod is terminating during deployment, Kubernetes marks it as NotReady but it may take seconds to fully stop accepting connections—aggressive connection timeouts (5-10s) allow Ingress to quickly fail over to new pods instead of waiting. For long-running HTTP requests (file uploads, streaming), Ingress uses proxy-read-timeout (60s default) separate from connection timeout. During cluster upgrades affecting pod networking (CNI plugin updates), 10s connection timeouts prevent request pileup by failing fast when pod networking is broken. The controller supports per-Ingress timeout configuration via annotations (nginx.ingress.kubernetes.io/proxy-connect-timeout), enabling fine-tuning for different workload types. Pattern composition: Connection Timeout + Readiness Probes + Rolling Updates + Multi-Pod Load Balancing. Impact: Reduced deployment-induced errors by 80%; improved user experience during pod failures with 10s failover instead of 60s timeout; enabled safe CNI plugin upgrades without manual intervention.",
      source:
        "https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#custom-timeouts",
    },
    {
      systemId: "grpc-clients",
      systemName: "gRPC Client Libraries",
      howUsed:
        "gRPC client libraries across languages (Go, Java, Python, Node.js) use WithBlock() and WithTimeout() options to enforce connection timeouts during channel creation. When a gRPC client connects to a server, WithTimeout(5*time.Second) ensures the TCP + TLS handshake completes within 5 seconds—if the server is unreachable or overloaded, the client fails fast instead of blocking indefinitely. Google's internal services use 10-30s connection timeouts for gRPC channels, allowing time for TLS handshake, DNS resolution, and connection pooling while preventing indefinite blocking. For streaming RPCs (bidirectional streams), gRPC uses separate keep-alive timeouts (20s default) to detect broken connections—if no data received within 20s, connection is closed and retried. During Kubernetes pod rolling updates, 5s connection timeouts allow clients to quickly discover new pod IPs via DNS instead of waiting for kernel TCP timeout (2+ minutes). Pattern composition: Connection Timeout + TLS Handshake Timeout + Keep-Alive Timeout + DNS Resolution Timeout. Impact: Reduced client startup time by failing fast on unreachable servers; improved user experience with 5s error messages instead of 2min hangs; enabled safe service mesh deployments with rapid connection recycling.",
      source: "https://grpc.io/docs/guides/keepalive/",
    },
    {
      systemId: "postgresql-pgbouncer",
      systemName: "PgBouncer PostgreSQL Connection Pooler",
      howUsed:
        "PgBouncer uses connection timeouts to prevent connection pool exhaustion from slow database connections. The server_connect_timeout parameter (default 15s) controls how long PgBouncer waits for PostgreSQL server to accept new connections—if database is overloaded or experiencing failover, connections timing out within 15s free up pool slots for retries instead of blocking indefinitely. During PostgreSQL primary failover (promoted replica becoming new primary), aggressive connection timeouts (5-10s) allow PgBouncer to quickly detect the failover and reconnect to the new primary. For client connections, client_idle_timeout (default 0/disabled) closes idle client connections after inactivity, preventing resource leaks from applications that don't properly close connections. PgBouncer's query_timeout (default 0/disabled) is separate from connection timeout—it controls max query execution time, while connection timeout only applies to connection establishment. Pattern composition: Connection Timeout + Connection Pooling + Failover Detection + Idle Connection Cleanup. Impact: Reduced failover detection time from 2min to 10s; prevented pool exhaustion during database overload; improved application resilience with automatic retry after connection timeout.",
      source: "https://www.pgbouncer.org/config.html",
    },
  ],
};
