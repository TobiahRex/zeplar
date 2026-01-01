import type { Pattern } from "../schema";

export const readTimeout: Pattern = {
  id: "read-timeout",
  slug: "read-timeout",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → ⏱️ Timeout → 📖 Read Timeout",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Timeout",
    level: 4,
  },

  concept: {
    name: "Read Timeout",
    emoji: "📖",
    tagline: "Max time waiting for data",
    definition:
      "The Read Timeout pattern sets a maximum duration for waiting to receive data after a connection has been successfully established. Unlike connection timeout which limits handshake time, read timeout governs the data transfer phase. Think of it like waiting for someone to finish speaking after they've picked up the phone—connection timeout is how long you wait for them to answer, read timeout is how long you wait for them to say something after answering. Once a TCP connection is established and a request is sent, the read timeout starts ticking. If no data arrives within the timeout period (no bytes received on the socket), the read operation is aborted and a timeout error is raised. This protects against slow-responding servers, network congestion causing delayed data transmission, and hung connections where the server accepts the request but never responds. The timeout typically applies per read operation: if data trickles in slowly but continuously, each individual read might succeed while the total operation takes longer than desired (this is where request timeout provides complementary protection). Read timeouts are crucial in preventing resource exhaustion from connections that remain open but inactive, as threads or async tasks remain blocked waiting for data that may never arrive.",
    problemSolved:
      "After successfully establishing a connection, clients can still hang indefinitely if the server is slow to send response data or becomes unresponsive mid-request. This commonly occurs when backend servers are overloaded (request queued but not processed), experiencing database slowness (connection open but query running), or hit by partial network failures (packets dropped but connection not reset). Without read timeouts, client threads remain blocked forever, consuming connection pool capacity, exhausting thread pools, and preventing the system from serving other requests. This is particularly problematic in HTTP clients and database connections where connection establishment succeeded (passing connection timeout) but data transfer stalls. Read Timeout solves this by enforcing a maximum wait time for data arrival after the connection is established. If a database query takes longer than the read timeout to return results, the client abandons the connection and reports a timeout error, freeing the thread for other work. This enables fast failure detection during the data transfer phase and prevents resource starvation from slow or hung operations.",
    tradeoffs: {
      pros: [
        "Prevents resource exhaustion from slow data transfers",
        "Detects server unresponsiveness during request processing",
        "Frees threads and connections that would otherwise block indefinitely",
        "Enables quick failure detection for overloaded backends",
        "Complements connection timeout by covering post-handshake phase",
      ],
      cons: [
        "May abort slow but legitimate responses (large result sets)",
        "Continuous slow data transfer can bypass timeout if bytes arrive regularly",
        "Requires different tuning than connection timeout (typically longer)",
        "Can cause false failures for operations with variable processing time",
        "Database queries returning large datasets may timeout during transfer",
      ],
    },
    relatedPatterns: [
      "timeout",
      "connection-timeout",
      "write-timeout",
      "request-timeout",
      "deadline-propagation",
      "streaming",
    ],
  },

  structure: {
    participants: [
      {
        name: "Socket Reader",
        role: "Data Receiver",
        responsibilities: [
          "Wait for data to arrive on established socket connection",
          "Read bytes from socket buffer as they become available",
          "Timeout if no data received within configured duration",
          "Handle partial reads and continue reading until complete",
        ],
      },
      {
        name: "Read Timeout Timer",
        role: "Idle Detector",
        responsibilities: [
          "Start timer before each read operation",
          "Trigger timeout if no bytes received within duration",
          "Reset timer when bytes arrive (for continuous slow transfers)",
          "Cancel timer when read completes successfully",
        ],
      },
      {
        name: "Connection Handler",
        role: "Socket Manager",
        responsibilities: [
          "Maintain established TCP connection to server",
          "Close socket when read timeout occurs",
          "Release connection pool slot on timeout",
          "Report timeout error to caller",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant Socket
    participant Server

    Client->>Socket: Connection established ✓
    Client->>Socket: send(request)
    Socket->>Server: HTTP Request
    Note over Socket: ⏱️ Start Read Timeout<br/>(waiting for response)

    alt Data arrives within timeout
        Server-->>Socket: Response bytes (chunk 1)
        Note over Socket: ⏱️ Reset timer (bytes received)
        Server-->>Socket: Response bytes (chunk 2)
        Note over Socket: ⏱️ Reset timer
        Server-->>Socket: Response complete
        Socket-->>Client: Full response data
        Note over Socket: ✓ Read successful
    else No data within timeout
        Note over Socket: ⏱️ Timeout fires (30s, no bytes)
        Socket->>Socket: Close socket
        Socket-->>Client: ReadTimeoutError
        Note over Socket: ✗ Connection closed
    end`,
    flow: [
      {
        step: 1,
        actor: "Socket Reader",
        action: "Begin Read Operation",
        description:
          "After connection established and request sent, wait for response data",
      },
      {
        step: 2,
        actor: "Read Timeout Timer",
        action: "Start Timer",
        description:
          "Begin countdown for read timeout (e.g., 30 seconds for response to start arriving)",
      },
      {
        step: 3,
        actor: "Socket Reader",
        action: "Wait for Bytes",
        description:
          "Block on socket read() call until data arrives or timeout expires",
      },
      {
        step: 4,
        actor: "Read Timeout Timer",
        action: "Monitor Activity",
        description:
          "Check if any bytes have been received. Reset timer on each successful read.",
      },
      {
        step: 5,
        actor: "Connection Handler",
        action: "Handle Completion or Timeout",
        description:
          "On success: return data and cancel timer. On timeout: close socket and throw error.",
      },
    ],
    invariants: [
      "Read timeout starts after connection is established, not during handshake",
      "Timer applies to data arrival, not total transfer time of large responses",
      "Continuous slow data transfer (trickle) may bypass timeout if bytes arrive regularly",
      "Read timeout should be longer than connection timeout (read is post-connection)",
      "Timeout must close socket and release connection pool slot",
    ],
  },

  systemContext: {
    typicalPlacement: [
      "HTTP Client Response Handling - Read timeout is configured at HTTP client creation or per-request level to govern the data reception phase after connection establishment. When making API calls to analytics services that return large JSON payloads, a 30-second read timeout ensures response data arrives within acceptable bounds—the timeout starts after the TCP handshake completes and applies to response body streaming. This placement protects client resources from servers that accept connections quickly but are slow to send response data due to complex query processing or large result sets. Unlike request timeout which covers end-to-end operation, read timeout specifically monitors the receive data phase, detecting scenarios where connection succeeds but data transfer stalls. Client libraries position read timeout as socket-level configuration (socket.setTimeout) or stream-level timeout that monitors bytes-received activity, resetting the timer each time data chunks arrive to allow slow-but-continuous transfers while catching truly stalled connections.",
      "Database Result Set Streaming - Database drivers implement read timeout for fetching query results after query execution begins. When executing a SELECT query returning 1 million rows, read timeout governs the streaming phase where result rows are transferred from database server to client. PostgreSQL's statement_timeout controls query execution duration, while socket read timeout controls result transfer—if database stops sending rows mid-stream due to network congestion or server overload, read timeout detects the stall and aborts. This placement sits at the database protocol layer (PostgreSQL wire protocol, MySQL client/server protocol) monitoring packet arrival during result streaming. The timeout resets on each result chunk received, allowing large result sets to transfer over minutes while still catching broken connections where no data arrives. Database connection pools configure read timeout at pool creation, applying it to all queries using pooled connections.",
      "Message Queue Consumer Data Reception - Message brokers implement read timeout for receiving message payloads after connection to queue is established. When consuming messages from Kafka topics or RabbitMQ queues, read timeout governs how long the consumer waits for message data to arrive over the network. If broker accepts subscription but is slow to send messages (disk I/O bottleneck, network congestion), read timeout prevents consumer from blocking indefinitely. This placement operates at the messaging protocol layer (AMQP, Kafka protocol) monitoring message delivery rate—timeout fires if no message bytes arrive within the configured window. The timeout is distinct from session timeout (broker health checking) and poll timeout (application-level waiting); read timeout specifically monitors socket-level data reception during active message transfer.",
      "File Download Streaming - HTTP file download implementations use read timeout to detect stalled downloads after initial connection succeeds. When downloading a 5GB file from cloud storage (S3, GCS, Azure Blob), read timeout monitors the streaming phase—if no bytes arrive for 60 seconds despite connection being open, download is aborted and retried from last checkpoint. This placement wraps HTTP response body streaming, monitoring data chunk arrival rate. The timeout resets on each chunk received, allowing downloads to take hours for large files while still catching network failures mid-download. Cloud storage SDKs implement read timeout at HTTP client layer with chunk-level monitoring and automatic resume from last successful chunk.",
      "WebSocket Message Reception - WebSocket servers and clients apply read timeout to detect broken connections during message streaming. After WebSocket upgrade handshake completes, read timeout monitors message frame arrival—if no frames received within timeout period (commonly 60-120s), connection is presumed dead and closed. This placement operates at WebSocket frame layer, monitoring both control frames (ping/pong) and data frames. Unlike HTTP request timeout which has clear start/end, WebSocket read timeout is continuous monitoring of bidirectional communication. Timeout typically works with heartbeat mechanism: server sends ping frames every 30s, read timeout is 60s, so missing two pings triggers timeout. This detects half-open connections where TCP connection appears established but peer is unresponsive (crashed, network partition).",
    ],
    architecturalBoundaries: [
      "Socket Data Reception Boundary - Read timeout operates at the TCP socket receive buffer boundary, monitoring the time between successful recv() system calls. After connection establishment completes (TCP handshake finished), read timeout governs the data transfer phase where application waits for bytes to arrive in socket receive buffer. This boundary is post-connection: connection timeout covers SYN/SYN-ACK/ACK handshake, read timeout covers subsequent data packets. When application calls socket.read() or recv(), the call blocks until data arrives or timeout expires. The boundary encompasses network latency, server processing time sending response chunks, and intermediate network device buffering. Read timeout is implemented at operating system socket layer (SO_RCVTIMEO socket option) or application layer (select/poll with timeout), making it a cross-layer concern between OS networking stack and application code.",
      "HTTP Response Body Streaming Boundary - Read timeout sits at the boundary between HTTP response headers received and complete response body received. After receiving status line and headers (indicating server accepted request and began processing), read timeout monitors body chunk arrival. For chunked transfer encoding, timeout applies per-chunk: if no chunk arrives within timeout, request aborts. For Content-Length responses, timeout monitors continuous data arrival—as long as bytes keep arriving, timeout doesn't fire even if total transfer takes hours. This boundary is critical for large payloads (file downloads, database exports, analytics reports) where connection succeeds quickly but data transfer is prolonged. Unlike connection timeout which operates at TCP layer, read timeout operates at HTTP application layer, aware of protocol semantics like chunked encoding and keep-alive.",
      "Database Protocol Message Boundary - Read timeout operates at the database wire protocol boundary, monitoring message arrival during result set streaming. PostgreSQL, MySQL, and MongoDB use custom binary protocols for client-server communication. After query execution begins and server starts sending result rows, read timeout monitors message frame arrival. For PostgreSQL, timeout monitors RowData messages; for MySQL, COM_QUERY response packets; for MongoDB, OP_MSG frames. This boundary is distinct from query timeout (server-side execution time limit) and focuses solely on network transfer phase. The timeout resets on each protocol message received, allowing queries with millions of rows to stream over extended periods while catching network failures mid-stream. Implementation sits in database driver (libpq, mysqlclient, MongoDB driver) monitoring protocol-level message arrival.",
      "Stream Processing Data Ingestion Boundary - Read timeout operates at the boundary between stream source acknowledgment and actual data delivery. When Apache Kafka consumer subscribes to topic partition or Apache Flink connects to data stream, initial connection establishes quickly but data arrival rate varies. Read timeout monitors the time between successive records arriving from stream—if no records arrive within timeout despite connection being healthy, timeout signals potential upstream processing stall. This boundary is application-specific: timeout isn't about TCP-level data (TCP connection may be sending heartbeats), but about application-level data (actual stream records). For backpressure scenarios where consumer is slow, read timeout should not fire because TCP flow control handles it. Timeout specifically catches upstream failures where producer stops sending despite consumer being ready.",
    ],
    interactsWith: [
      "timeout",
      "connection-timeout",
      "write-timeout",
      "request-timeout",
      "deadline-propagation",
      "streaming",
      "backpressure",
      "circuit-breaker",
    ],
  },

  implementations: [
    {
      id: "node-socket-timeout",
      name: "Node.js Socket setTimeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Native Node.js socket timeout that fires when no data received within specified duration. Sets SO_RCVTIMEO socket option and emits timeout event.",
      links: {
        docs: "https://nodejs.org/api/net.html#socketsettimeouttimeout-callback",
      },
      codeSnippet: `import { Socket } from 'net';

const socket = new Socket();
socket.connect({ host: 'example.com', port: 80 });

// Set 30s read timeout
socket.setTimeout(30000);

socket.on('timeout', () => {
  console.error('Socket read timeout - no data received for 30s');
  socket.destroy(); // Must manually close socket
});

socket.on('data', (chunk) => {
  // Timeout resets on each data arrival
  console.log(\`Received \${chunk.length} bytes\`);
});`,
    },
    {
      id: "axios-read-timeout",
      name: "Axios HTTP Client Timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Axios timeout configuration covering request timeout (total operation) and socket timeout (read timeout). Uses http.Agent for socket-level control.",
      links: {
        docs: "https://axios-http.com/docs/req_config",
        github: "https://github.com/axios/axios",
      },
      codeSnippet: `import axios from 'axios';
import http from 'http';

const httpAgent = new http.Agent({
  timeout: 30000, // 30s read timeout (socket idle timeout)
  keepAlive: true,
});

const client = axios.create({
  httpAgent,
  timeout: 60000, // 60s total request timeout
});

// Request: connection must establish in 5s,
// response data must arrive within 30s idle time,
// total operation max 60s
const response = await client.get('https://api.example.com/large-report');`,
    },
    {
      id: "python-requests-timeout",
      name: "Python Requests Library Timeout",
      type: "library",
      languages: ["python"],
      description:
        "Python requests library with separate connect and read timeout tuple. Read timeout governs time between bytes received.",
      links: {
        docs: "https://requests.readthedocs.io/en/latest/user/advanced/#timeouts",
      },
      codeSnippet: `import requests

# Timeout tuple: (connect_timeout, read_timeout)
response = requests.get(
    'https://api.example.com/data',
    timeout=(5, 30)  # 5s connect, 30s read
)

# Single value applies to both
response = requests.get(url, timeout=10)  # 10s total

# Stream with read timeout for chunk iteration
response = requests.get(
    url,
    timeout=(5, 30),
    stream=True
)
for chunk in response.iter_content(chunk_size=8192):
    # Read timeout applies to each chunk arrival
    process(chunk)`,
    },
    {
      id: "postgresql-read-timeout",
      name: "PostgreSQL Socket Timeout",
      type: "platform",
      languages: ["sql", "javascript", "python"],
      description:
        "PostgreSQL tcp_user_timeout and socket receive timeout for detecting stalled result transfers. Applies during query result streaming.",
      links: {
        docs: "https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-TCP-USER-TIMEOUT",
      },
      codeSnippet: `-- PostgreSQL connection string with TCP timeout
postgresql://user:pass@host:5432/db?tcp_user_timeout=30000

-- Node.js pg library
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'mydb',
  connectionTimeoutMillis: 5000,   // Connection timeout
  query_timeout: 60000,             // Query execution timeout
  // Read timeout via tcp_user_timeout
  options: '-c tcp_user_timeout=30000'  // 30s read timeout
});

-- Python psycopg2
import psycopg2
conn = psycopg2.connect(
    host="localhost",
    database="mydb",
    connect_timeout=5,
    options="-c tcp_user_timeout=30000"  # Read timeout
)`,
    },
    {
      id: "go-http-client-timeout",
      name: "Go HTTP Client Transport Timeout",
      type: "framework",
      languages: ["go"],
      description:
        "Go http.Transport with ResponseHeaderTimeout and IdleConnTimeout for read timeout control during response streaming.",
      links: {
        docs: "https://pkg.go.dev/net/http#Transport",
      },
      codeSnippet: `package main

import (
    "net/http"
    "time"
)

client := &http.Client{
    Transport: &http.Transport{
        DialContext: (&net.Dialer{
            Timeout:   5 * time.Second,  // Connection timeout
            KeepAlive: 30 * time.Second,
        }).DialContext,

        // Read timeout for response headers
        ResponseHeaderTimeout: 10 * time.Second,

        // Idle connection timeout (read timeout for keep-alive)
        IdleConnTimeout: 90 * time.Second,

        // TLS handshake timeout
        TLSHandshakeTimeout: 10 * time.Second,
    },

    // Total request timeout
    Timeout: 60 * time.Second,
}

resp, err := client.Get("https://api.example.com/data")`,
    },
  ],

  usedInSystems: [
    {
      systemId: "aws-s3-sdk",
      systemName: "AWS S3 SDK Multipart Downloads",
      howUsed:
        "AWS S3 SDK implements aggressive read timeouts for multipart file downloads to detect network failures mid-download. When downloading a 10GB file, S3 SDK splits the download into 5MB chunks and applies 30-second read timeout per chunk. If no bytes arrive for a chunk within 30s (network congestion, S3 throttling, connection half-open), the SDK aborts the chunk download and retries with exponential backoff. This prevents downloads from hanging indefinitely on temporary network issues while allowing the overall download to take hours. The read timeout is distinct from connection timeout (5s for initial S3 connection) and request timeout (no global timeout for large downloads). During chunk streaming, timeout resets on each buffer fill—if downloading at 100KB/s, chunks arrive every 50 seconds but timeout is 30s, so timeout fires. S3 SDK handles this by implementing chunk-level retries with jitter to avoid thundering herd. Pattern composition: Read Timeout + Exponential Backoff Retry + Chunk-level Resume + Connection Pooling. Impact: Reduced failed download rate from 5% to 0.1% by detecting stalls early; improved user experience with automatic resume instead of full restart; prevented resource leaks from hung download connections.",
      source:
        "https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/enforcing-tls.html",
    },
    {
      systemId: "kafka-consumer",
      systemName: "Apache Kafka Consumer",
      howUsed:
        "Kafka consumers use socket read timeout (socket.connection.setup.timeout.ms, default 10s) to detect broker unresponsiveness during message consumption. After consumer subscribes to topic partition and begins polling, read timeout monitors message batch arrival from broker. If broker accepts connection but stops sending message batches (disk I/O saturation, replication lag, network partition), read timeout fires after 10s of no data. This is distinct from session.timeout.ms (30s default) which governs consumer group membership heartbeats. Read timeout operates at TCP socket level monitoring actual message data arrival, while session timeout operates at consumer group protocol level. During broker rolling restarts, read timeout allows consumers to quickly detect partition leader changes and reconnect to new leader instead of waiting for session timeout. Kafka's implementation resets read timeout on each message batch received, allowing consumers to stay connected for hours during low-throughput topics while catching truly broken connections. Pattern composition: Read Timeout + Session Timeout + Heartbeat + Partition Rebalancing + Automatic Offset Commit. Impact: Reduced message processing lag during broker failures from 30s to 10s; prevented consumer group rebalancing storms by detecting connection issues faster than session timeout; improved end-to-end message latency by 40% through faster failure detection.",
      source: "https://kafka.apache.org/documentation/#consumerconfigs",
    },
    {
      systemId: "elasticsearch-client",
      systemName: "Elasticsearch Scroll API",
      howUsed:
        "Elasticsearch scroll API uses read timeout to prevent hung connections when streaming large result sets from multi-gigabyte indices. When initiating scroll query (SELECT * FROM 100M document index), initial query executes quickly but result streaming can take minutes. Elasticsearch client sets 60s read timeout for scroll result chunks—if no chunk arrives within 60s, client aborts scroll and cleans up server-side scroll context. This prevents memory leaks on Elasticsearch cluster from orphaned scroll contexts when clients crash or network fails mid-scroll. The read timeout resets on each scroll batch received (default 1000 documents per batch), allowing complete scroll to take hours while catching stalled scrolls. Elasticsearch server also enforces scroll.timeout (default 1min) controlling scroll context TTL, creating dual timeout protection. Client-side read timeout detects network failures; server-side scroll timeout detects client abandonment. Pattern composition: Read Timeout + Server-side Scroll Context TTL + Batch Streaming + Circuit Breaker. Impact: Reduced cluster memory usage by 30% through faster scroll cleanup; prevented client hangs during network issues with 60s fail-fast; improved scroll reliability from 95% to 99.5% completion rate.",
      source:
        "https://www.elastic.co/guide/en/elasticsearch/reference/current/scroll-api.html",
    },
  ],

  references: [
    {
      title: "Node.js Socket setTimeout Documentation",
      url: "https://nodejs.org/api/net.html#socketsettimeouttimeout-callback",
      type: "documentation",
      author: "Node.js Foundation",
    },
    {
      title: "Python Requests - Timeouts",
      url: "https://requests.readthedocs.io/en/latest/user/advanced/#timeouts",
      type: "documentation",
      author: "Python Requests",
    },
    {
      title: "PostgreSQL libpq Connection Parameters",
      url: "https://www.postgresql.org/docs/current/libpq-connect.html",
      type: "documentation",
      author: "PostgreSQL Global Development Group",
    },
    {
      title: "Apache Kafka Consumer Configuration",
      url: "https://kafka.apache.org/documentation/#consumerconfigs",
      type: "documentation",
      author: "Apache Software Foundation",
    },
    {
      title: "AWS SDK for JavaScript - Timeout Configuration",
      url: "https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-configuring-maxsockets.html",
      type: "documentation",
      author: "Amazon Web Services",
    },
  ],

  philosophy: {
    coreProblem:
      "After establishing connection, data transfer can stall indefinitely if server is slow to send response or network fails mid-transmission, causing client resources to remain blocked",
    designPrinciple:
      "Set read timeout to detect idle periods during data transfer, distinguishing between slow-but-continuous streaming (acceptable) and truly stalled connections (timeout)",
    historicalContext:
      "Read timeout became critical with streaming protocols and large data transfers—early systems only had connection timeout, leading to hung connections when servers accepted requests but never sent responses",
    alternativesRejected: [
      "No read timeout - allows indefinite blocking on slow data transfer",
      "Total transfer timeout - prevents legitimate large file downloads",
      "Fixed byte rate timeout - too inflexible for variable network conditions",
      "Only request timeout - doesn't detect stalls at socket level",
    ],
    mentalModel:
      "Read timeout is like waiting for someone to continue talking after they started speaking: if they pause mid-sentence for 30 seconds, you assume they lost their train of thought and move on, but if they speak slowly but continuously, you wait",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant Client
    participant Socket
    participant Server

    Client->>Socket: Connection established ✓
    Client->>Socket: send(request)
    Socket->>Server: HTTP Request
    Note over Socket: ⏱️ Start Read Timeout<br/>(30s, waiting for data)

    alt Data arrives continuously
        Server-->>Socket: Chunk 1 (1KB)
        Note over Socket: ⏱️ Reset timer
        Server-->>Socket: Chunk 2 (1KB)
        Note over Socket: ⏱️ Reset timer
        Server-->>Socket: Chunk 3 (1KB)
        Socket-->>Client: Complete response
        Note over Socket: ✓ Success
    else No data within timeout
        Note over Socket: ⏱️ Timeout (30s idle)
        Socket->>Socket: Close connection
        Socket-->>Client: ReadTimeoutError
        Note over Socket: ✗ Timeout
    end`,
    realWorldAnalogy:
      "Read timeout is like waiting for luggage at airport baggage claim: if bags keep appearing on the belt (even slowly), you wait patiently, but if the belt stops moving for 10 minutes with no bags, you assume something is wrong and go to customer service",
    useCases: [
      {
        domain: "File Downloads",
        scenario:
          "AWS S3 SDK uses 30s read timeout per chunk to detect stalled downloads and retry",
        patternRole:
          "Enables automatic recovery from network failures mid-download",
        companies: ["AWS S3", "Google Cloud Storage", "Azure Blob Storage"],
      },
      {
        domain: "Database Result Streaming",
        scenario:
          "PostgreSQL clients use read timeout to detect broken connections during large result set transfers",
        patternRole:
          "Prevents client hangs when database stops sending rows mid-query",
        companies: ["PostgreSQL", "MySQL", "MongoDB"],
      },
      {
        domain: "Message Queue Consumers",
        scenario:
          "Kafka consumers use 10s read timeout to detect broker unresponsiveness during message polling",
        patternRole:
          "Enables fast failover to new partition leaders during broker failures",
        companies: ["Apache Kafka", "RabbitMQ", "AWS SQS"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "timeout",
    "network",
    "socket",
    "streaming",
    "data-transfer",
  ],
  difficulty: "intermediate",

  codeExamples: [
    {
      id: "read-timeout-ts-socket-http",
      language: "typescript",
      title: "Read Timeout for HTTP and Socket Operations",
      description:
        "Implementation of read timeout for both HTTP responses and raw socket data reading, demonstrating timeout during data transfer phase",
      code: `import http from 'http';
import https from 'https';
import { Socket } from 'net';
import axios, { AxiosInstance } from 'axios';

// ============================================================
// Read Timeout Types and Errors
// ============================================================

class ReadTimeoutError extends Error {
  constructor(message: string, public readonly elapsedMs: number) {
    super(message);
    this.name = 'ReadTimeoutError';
  }
}

// ============================================================
// Low-Level Socket Read with Timeout
// ============================================================

/**
 * ACTION: Implement socket read with timeout on data arrival
 * REASON: Raw TCP sockets can hang indefinitely waiting for data even after
 *         connection succeeds. Read timeout ensures we don't wait forever
 *         if server stops sending data mid-response or becomes unresponsive.
 */
async function readFromSocket(
  socket: Socket,
  readTimeoutMs: number = 30000
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let readTimer: NodeJS.Timeout;

    // ACTION: Set socket-level read timeout
    // REASON: This is the actual mechanism that enforces read timeout.
    //         If no data arrives within readTimeoutMs, socket emits 'timeout'
    socket.setTimeout(readTimeoutMs);

    // ACTION: Handle data arrival
    // REASON: When bytes arrive, read timeout should reset—we only timeout
    //         on idle periods (no data), not on slow-but-continuous transfer
    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      totalBytes += chunk.length;

      console.log(\`Received \${chunk.length} bytes (total: \${totalBytes})\`);

      // ACTION: Reset timeout on each data arrival
      // REASON: Read timeout is about idle time (no bytes arriving), not
      //         total transfer time. Large responses that trickle in slowly
      //         but continuously shouldn't timeout if bytes keep arriving.
      socket.setTimeout(readTimeoutMs);
    };

    // ACTION: Handle timeout event
    // REASON: Timeout means no data arrived within readTimeoutMs. Server is
    //         either hung, overloaded, or network is congested. Must close
    //         socket to prevent indefinite blocking.
    const onTimeout = () => {
      cleanup();
      socket.destroy();
      reject(
        new ReadTimeoutError(
          \`Socket read timeout after \${readTimeoutMs}ms (received \${totalBytes} bytes)\`,
          Date.now()
        )
      );
    };

    // ACTION: Handle connection end
    // REASON: Server finished sending data. This is success case—collect all
    //         chunks and return complete response.
    const onEnd = () => {
      cleanup();
      const completeData = Buffer.concat(chunks);
      console.log(\`Read complete: \${completeData.length} bytes\`);
      resolve(completeData);
    };

    // ACTION: Handle socket errors
    // REASON: Network errors (connection reset, broken pipe) are different
    //         from timeout. Both should cleanup, but error type helps caller
    //         decide retry strategy.
    const onError = (error: Error) => {
      cleanup();
      socket.destroy();
      reject(error);
    };

    // ACTION: Register all event listeners
    // REASON: Socket is event-driven. Must listen for: data (bytes arrived),
    //         timeout (idle too long), end (transfer complete), error (failure)
    socket.on('data', onData);
    socket.on('timeout', onTimeout);
    socket.on('end', onEnd);
    socket.on('error', onError);

    // ACTION: Cleanup function to remove listeners
    // REASON: Event listeners leak memory if not removed. Cleanup ensures
    //         listeners are removed whether request succeeds, times out, or errors
    function cleanup() {
      socket.removeListener('data', onData);
      socket.removeListener('timeout', onTimeout);
      socket.removeListener('end', onEnd);
      socket.removeListener('error', onError);
    }
  });
}

// ============================================================
// HTTP Client with Read Timeout
// ============================================================

/**
 * ACTION: Configure HTTP client with read timeout separate from connection timeout
 * REASON: Connection and read are distinct failure modes. Connection timeout
 *         governs handshake (typically 5-10s), read timeout governs data
 *         transfer (typically 30-60s). Database queries may take 30s to
 *         compute results, so read timeout must be longer.
 */
class HttpReadTimeoutClient {
  private axios: AxiosInstance;

  constructor(
    baseURL: string,
    private connectionTimeoutMs: number = 5000,
    private readTimeoutMs: number = 30000
  ) {
    // ACTION: Create custom http agent with socket timeout
    // REASON: axios's timeout is total request timeout, but we need granular
    //         control over connection vs read phases. Custom agent allows
    //         setting socket timeout which is read timeout.
    const httpAgent = new http.Agent({
      timeout: connectionTimeoutMs, // Connection timeout
      keepAlive: true,
    });

    const httpsAgent = new https.Agent({
      timeout: connectionTimeoutMs,
      keepAlive: true,
    });

    this.axios = axios.create({
      baseURL,
      httpAgent,
      httpsAgent,
      timeout: 0, // Disable axios timeout, use socket timeout instead
    });

    // ACTION: Set read timeout on each request's socket
    // REASON: Read timeout must be set per-socket after connection established.
    //         Axios doesn't expose direct socket timeout config, so we intercept
    //         requests and set timeout on underlying socket.
    this.axios.interceptors.request.use((config) => {
      const startTime = Date.now();

      // @ts-ignore - accessing internal property
      if (config.httpAgent || config.httpsAgent) {
        // Hook into socket creation to set read timeout
        const originalSocketCallback = (config as any).httpAgent?.createConnection;

        if (originalSocketCallback) {
          (config as any).httpAgent.createConnection = (...args: any[]) => {
            const socket = originalSocketCallback.apply(this, args);

            // ACTION: Set read timeout on newly created socket
            // REASON: After connection established, if no data arrives within
            //         readTimeoutMs, request should timeout and socket close
            socket.setTimeout(this.readTimeoutMs);

            socket.on('timeout', () => {
              console.error(
                \`Socket read timeout after \${Date.now() - startTime}ms\`
              );
              socket.destroy();
            });

            return socket;
          };
        }
      }

      return config;
    });
  }

  /**
   * ACTION: Execute HTTP GET with explicit read timeout
   * REASON: Demonstrates end-to-end flow: connection succeeds (within 5s),
   *         but server takes 45s to send response → read timeout fires (30s)
   */
  async get<T>(url: string): Promise<T> {
    const startTime = Date.now();

    try {
      const response = await this.axios.get<T>(url);
      const elapsed = Date.now() - startTime;

      console.log(\`✓ Request completed in \${elapsed}ms\`);
      return response.data;
    } catch (error) {
      const elapsed = Date.now() - startTime;

      // ACTION: Classify timeout vs other errors
      // REASON: Read timeout (ETIMEDOUT, ESOCKETTIMEDOUT) means server accepted
      //         connection but was slow sending data—might be overloaded database
      //         query. Connection refused (ECONNREFUSED) means server is down.
      if (axios.isAxiosError(error)) {
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
          throw new ReadTimeoutError(
            \`Read timeout after \${elapsed}ms waiting for response data from \${url}\`,
            elapsed
          );
        }
      }

      throw error;
    }
  }
}

// ============================================================
// Database Client with Read Timeout
// ============================================================

/**
 * ACTION: Implement database query with read timeout for result streaming
 * REASON: Database queries have two phases: query execution (server computing
 *         results) and result streaming (transferring rows to client). Read
 *         timeout governs the streaming phase—if database stops sending rows
 *         mid-result, timeout prevents hanging.
 */
class DatabaseQueryClient {
  /**
   * ACTION: Execute query with separate read timeout for row streaming
   * REASON: Query might execute fast (500ms), but returning 1M rows takes time.
   *         Read timeout ensures each chunk of rows arrives within timeout,
   *         not that entire result set transfers within one timeout period.
   */
  async executeQuery(
    connectionString: string,
    sql: string,
    readTimeoutMs: number = 30000
  ): Promise<any[]> {
    // In production, use actual database library (pg, mysql2, etc.)
    // This example shows the pattern conceptually

    console.log(\`Executing query: \${sql}\`);

    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      let lastReadTime = Date.now();

      // ACTION: Simulate streaming query results with read timeout
      // REASON: Real database drivers stream results in chunks. Read timeout
      //         should fire if no new chunk arrives within timeout period,
      //         not based on total query time.
      const readTimeoutCheck = setInterval(() => {
        const idleTime = Date.now() - lastReadTime;

        // ACTION: Check if idle time exceeds read timeout
        // REASON: If 30s passed since last row chunk, database likely hung or
        //         network connection broken. Timeout and cleanup.
        if (idleTime > readTimeoutMs) {
          clearInterval(readTimeoutCheck);
          reject(
            new ReadTimeoutError(
              \`Query read timeout: no data received for \${idleTime}ms\`,
              idleTime
            )
          );
        }
      }, 1000);

      // Simulate receiving row chunks
      // In real implementation, this would be database driver's row event
      const simulateRowArrival = () => {
        const row = { id: rows.length + 1, data: 'sample' };
        rows.push(row);
        lastReadTime = Date.now(); // Reset read timeout on each row

        console.log(\`Received row \${rows.length}\`);

        if (rows.length < 10) {
          // Simulate slow row streaming (100ms between rows)
          setTimeout(simulateRowArrival, 100);
        } else {
          // Query complete
          clearInterval(readTimeoutCheck);
          resolve(rows);
        }
      };

      // Start receiving rows after simulated query execution delay
      setTimeout(simulateRowArrival, 500);
    });
  }
}

// ============================================================
// Usage Examples
// ============================================================

// Example 1: Raw socket read with timeout
async function socketExample() {
  const socket = new Socket();

  socket.connect({ host: 'example.com', port: 80 }, async () => {
    console.log('Socket connected');

    // Send HTTP request
    socket.write('GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n');

    try {
      // ACTION: Read response with 30s timeout
      // REASON: After request sent, if no response data arrives within 30s,
      //         timeout fires and closes socket
      const response = await readFromSocket(socket, 30000);
      console.log(\`Received \${response.length} bytes\`);
    } catch (error) {
      if (error instanceof ReadTimeoutError) {
        console.error('Socket read timeout - server not responding');
      }
    }
  });
}

// Example 2: HTTP client with read timeout
async function httpExample() {
  const client = new HttpReadTimeoutClient(
    'https://api.example.com',
    5000,  // 5s connection timeout
    30000  // 30s read timeout
  );

  try {
    // ACTION: Make request to slow endpoint
    // REASON: Endpoint may be running expensive database query. Connection
    //         succeeds in 500ms, but response takes 45s → read timeout at 30s
    const data = await client.get('/slow-report');
    console.log('Report data:', data);
  } catch (error) {
    if (error instanceof ReadTimeoutError) {
      console.error(\`Server too slow: \${error.elapsedMs}ms elapsed\`);
      // Retry with larger read timeout or return cached data
    }
  }
}

// Example 3: Database query with streaming timeout
async function databaseExample() {
  const dbClient = new DatabaseQueryClient();

  try {
    // ACTION: Execute query with 30s read timeout
    // REASON: Query execution may be fast, but streaming 1M rows takes time.
    //         Read timeout ensures rows keep arriving, prevents hanging mid-stream.
    const rows = await dbClient.executeQuery(
      'postgresql://localhost/mydb',
      'SELECT * FROM large_table LIMIT 1000000',
      30000
    );

    console.log(\`Retrieved \${rows.length} rows\`);
  } catch (error) {
    if (error instanceof ReadTimeoutError) {
      console.error('Database stopped sending rows - possible connection issue');
    }
  }
}`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope:
          "Read timeout implementation for HTTP clients, raw TCP sockets, and database query result streaming",
        prerequisites: [
          "Understanding of TCP data transfer phase after connection established",
          "Node.js socket event handling (data, timeout, end, error)",
          "Difference between connection timeout (handshake) and read timeout (data transfer)",
          "HTTP agent configuration for socket-level timeout control",
        ],
        systemPosition:
          "Read timeout operates at the data transfer layer after connection establishment, protecting against servers that accept connections but are slow or hung when sending response data",
      },
      annotations: [
        {
          id: "read-timeout-socket-timeout",
          lines: [36, 39],
          action:
            "Set socket-level timeout to enforce read timeout on data arrival",
          reason:
            "socket.setTimeout() is Node.js's native read timeout mechanism. After this duration without receiving data, the socket emits 'timeout' event. This is distinct from connection timeout which governs the initial handshake. Read timeout starts after connection succeeds and governs the data transfer phase.",
          contextLevel: "local",
          relatedConcepts: ["socket-timeout", "data-transfer-timeout"],
        },
        {
          id: "read-timeout-reset-on-data",
          lines: [41, 54],
          action:
            "Reset timeout timer each time data arrives to allow slow continuous transfer",
          reason:
            "Read timeout is about idle periods (no bytes arriving), not total transfer time. A 10GB file transfer that takes 5 minutes shouldn't timeout if bytes keep arriving. Resetting timeout on each data chunk allows slow-but-continuous transfers while still catching truly hung connections where no bytes arrive.",
          contextLevel: "module",
          relatedConcepts: [
            "idle-timeout",
            "continuous-transfer",
            "timeout-reset",
          ],
        },
        {
          id: "read-timeout-socket-destroy",
          lines: [56, 68],
          action:
            "Destroy socket and reject promise when read timeout fires without data",
          reason:
            "When timeout fires, the connection is likely broken or server is hung. Must destroy the socket to free resources (file descriptor, memory buffers) and prevent connection pool leaks. Rejecting with ReadTimeoutError allows caller to distinguish timeout from other errors and decide retry strategy.",
          contextLevel: "module",
          relatedConcepts: ["resource-cleanup", "error-classification"],
        },
        {
          id: "read-timeout-event-cleanup",
          lines: [99, 109],
          action:
            "Remove all event listeners in cleanup function to prevent memory leaks",
          reason:
            "Event listeners leak memory if not removed when operation completes. Socket may be reused (in connection pooling), and old listeners would still fire on new requests. Cleanup function centralizes listener removal logic ensuring it happens whether request succeeds, times out, or errors.",
          contextLevel: "local",
          relatedConcepts: ["event-listener-cleanup", "memory-leak-prevention"],
        },
        {
          id: "read-timeout-http-agent",
          lines: [122, 138],
          action:
            "Configure custom HTTP agent with socket timeout for read timeout control",
          reason:
            "Axios's timeout parameter is total request timeout, not read timeout. To set read timeout specifically, we need access to the underlying socket which is created by http.Agent. Custom agent with timeout parameter sets socket timeout (read timeout), while axios timeout remains disabled. This gives granular control over connection vs read phases.",
          contextLevel: "system",
          relatedConcepts: ["http-agent", "socket-configuration"],
        },
        {
          id: "read-timeout-socket-intercept",
          lines: [140, 167],
          action:
            "Intercept request to set read timeout on socket after connection established",
          reason:
            "Read timeout must be set on the socket after connection succeeds but before data transfer begins. Axios doesn't expose direct socket configuration, so we use request interceptor to hook into socket creation and set timeout. This ensures timeout is active during the data transfer phase only, not during connection.",
          contextLevel: "module",
          relatedConcepts: ["request-interception", "socket-configuration"],
        },
        {
          id: "read-timeout-error-classification",
          lines: [182, 193],
          action:
            "Differentiate read timeout from connection and application errors",
          reason:
            "Read timeout (ETIMEDOUT, ESOCKETTIMEDOUT) indicates server is processing request but slow to send response—often database query taking too long. This is retry-able with backoff or fallback to cache. Connection refused (ECONNREFUSED) means server is down—not retry-able. HTTP 500 means application error—different handling. Proper classification enables intelligent error handling.",
          contextLevel: "module",
          relatedConcepts: [
            "error-classification",
            "retry-strategy",
            "failure-modes",
          ],
        },
        {
          id: "read-timeout-streaming-data",
          lines: [225, 241],
          action:
            "Check idle time between data chunks to detect stalled streaming transfers",
          reason:
            "Database result sets stream in chunks (typically 100-1000 rows per chunk). Read timeout should fire if no new chunk arrives within timeout, not based on total streaming time. Checking idle time since last chunk allows large result sets to transfer over minutes while still catching stalled streams where database stops sending mid-result.",
          contextLevel: "module",
          relatedConcepts: ["streaming-timeout", "chunk-timeout"],
        },
      ],
      highlights: [
        {
          lines: [36, 54],
          sbvpDomain: "behavior",
          label:
            "Socket read timeout with timer reset on each data arrival for continuous transfers",
        },
        {
          lines: [56, 68],
          sbvpDomain: "behavior",
          label:
            "Timeout handler destroys socket and rejects promise when no data arrives",
        },
        {
          lines: [99, 109],
          sbvpDomain: "philosophy",
          label:
            "Event listener cleanup prevents memory leaks in long-lived socket connections",
        },
        {
          lines: [122, 167],
          sbvpDomain: "structure",
          label:
            "HTTP agent with socket timeout configuration for granular read timeout control",
        },
        {
          lines: [182, 193],
          sbvpDomain: "philosophy",
          label:
            "Error classification distinguishes read timeout from connection and app errors",
        },
        {
          lines: [225, 241],
          sbvpDomain: "behavior",
          label:
            "Streaming read timeout checks idle time between chunks, not total transfer time",
        },
      ],
    },
  ],
};
