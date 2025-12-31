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
