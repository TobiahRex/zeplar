import type { Pattern } from "../schema";

export const writeTimeout: Pattern = {
  id: "write-timeout",
  slug: "write-timeout",
  corpusPath:
    "🛡️ RELIABILITY → 💔 Fault Tolerance → ⏱️ Timeout → ✍️ Write Timeout",

  hierarchy: {
    quality: "reliability",
    strategy: "Fault Tolerance",
    family: "Timeout",
    level: 4,
  },

  concept: {
    name: "Write Timeout",
    emoji: "✍️",
    tagline: "Max time sending data",
    definition:
      "The Write Timeout pattern establishes a maximum duration for sending data over an established connection, protecting against slow consumers and network congestion that prevent data transmission. While read timeout governs receiving data, write timeout controls the sending phase. Think of it like mailing a package—connection timeout is finding the post office, write timeout is how long you're willing to wait in line to hand over the package. Once a connection exists and the application attempts to write data to the socket, the write timeout bounds how long that operation can block. If the write operation doesn't complete within the timeout (the data doesn't fully transmit to the network buffer), the write is aborted and a timeout error is raised. This commonly occurs when the receiving end has a full TCP receive buffer and isn't consuming data fast enough, creating backpressure that blocks the sender. Write timeouts prevent senders from hanging indefinitely on slow consumers, protecting against scenarios where network congestion or overwhelmed recipients cause transmission to stall. The pattern is especially important for streaming protocols, large file uploads, and systems pushing data to potentially slow or unresponsive clients.",
    problemSolved:
      "Applications that send data over network connections can hang indefinitely if the receiving end cannot keep up with the transmission rate or if network conditions prevent data from flowing. This occurs when clients have slow network connections (mobile networks, congested routes), receiving buffers are full because the consumer is processing data slowly, or intermediary network devices apply flow control. Without write timeouts, sender threads remain blocked trying to push bytes onto the network, consuming resources while making no progress. This is particularly problematic in scenarios like streaming video to slow clients, uploading large files over unreliable connections, or pushing real-time data to overwhelmed subscribers. Write Timeout solves this by failing fast when data transmission stalls, allowing the sender to detect slow consumers, free resources tied to blocked writes, and take corrective action (drop the client, buffer data, or apply backpressure upstream). This prevents one slow consumer from blocking the entire producer and enables graceful degradation when network conditions deteriorate.",
    tradeoffs: {
      pros: [
        "Prevents sender threads from blocking indefinitely on slow consumers",
        "Detects network congestion and slow clients quickly",
        "Enables load shedding of clients that cannot keep up",
        "Frees resources that would otherwise remain blocked in write operations",
        "Allows graceful handling of slow or unresponsive data consumers",
      ],
      cons: [
        "May abort legitimate large data transfers on slow but functional connections",
        "Requires careful tuning based on expected data size and network speed",
        "Can cause spurious failures on temporarily congested networks",
        "Partial writes may leave data in inconsistent state without proper handling",
        "Mobile clients on slow networks may see more failures",
      ],
    },
    relatedPatterns: [
      "timeout",
      "read-timeout",
      "connection-timeout",
      "request-timeout",
      "backpressure",
      "flow-control",
    ],
  },

  structure: {
    participants: [
      {
        name: "Write Buffer Manager",
        role: "Data Transmitter",
        responsibilities: [
          "Attempt to write data to socket send buffer",
          "Monitor progress of write operation",
          "Detect when send buffer is full (backpressure)",
          "Abort write if timeout exceeded",
        ],
      },
      {
        name: "Write Timeout Timer",
        role: "Write Duration Monitor",
        responsibilities: [
          "Start timer when write operation begins",
          "Trigger timeout if write doesn't complete within duration",
          "Cancel timer when write successfully completes",
          "Track how long write has been blocking",
        ],
      },
      {
        name: "Backpressure Detector",
        role: "Flow Control Monitor",
        responsibilities: [
          "Check if receiver's TCP receive buffer is full",
          "Identify slow consumers unable to keep up",
          "Signal backpressure to application layer",
          "Enable load shedding or adaptive strategies",
        ],
      },
      {
        name: "Connection Terminator",
        role: "Cleanup Handler",
        responsibilities: [
          "Close socket when write timeout occurs",
          "Release blocked write operation resources",
          "Free sender thread for other work",
          "Propagate timeout error to caller",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Sender
    participant Socket
    participant SendBuffer as TCP Send Buffer
    participant Receiver

    Sender->>Socket: Connection established ✓
    Sender->>Socket: write(data)
    Note over Socket: ⏱️ Start Write Timeout

    alt Send buffer has space
        Socket->>SendBuffer: Copy data to buffer
        SendBuffer->>Receiver: Transmit bytes
        Note over SendBuffer: ⏱️ Cancel timer
        SendBuffer-->>Socket: Write complete ✓
        Socket-->>Sender: Success (bytes written)

    else Send buffer full (backpressure)
        Note over SendBuffer: 🚧 Buffer full<br/>Receiver slow
        Note over Socket: ⏱️ Write blocked<br/>waiting for space

        alt Receiver catches up before timeout
            Receiver->>SendBuffer: ACK (buffer freed)
            Socket->>SendBuffer: Resume write
            SendBuffer-->>Socket: Write complete ✓
            Socket-->>Sender: Success (delayed)

        else Timeout expires
            Note over Socket: ⏱️ Timeout fired<br/>(5s, no progress)
            Socket->>Socket: Close connection
            Socket-->>Sender: WriteTimeoutError
            Note over Receiver: ✗ Slow consumer<br/>disconnected
        end
    end`,
    flow: [
      {
        step: 1,
        actor: "Write Buffer Manager",
        action: "Begin Write Operation",
        description:
          "Application calls write(data) on established socket connection to send data to receiver",
      },
      {
        step: 2,
        actor: "Write Timeout Timer",
        action: "Start Timer",
        description:
          "Begin countdown for write timeout (e.g., 5 seconds for write to complete)",
      },
      {
        step: 3,
        actor: "Write Buffer Manager",
        action: "Attempt Buffer Write",
        description:
          "Try to copy data to TCP send buffer. If buffer full, operation blocks.",
      },
      {
        step: 4,
        actor: "Backpressure Detector",
        action: "Monitor Send Buffer",
        description:
          "Check if send buffer has space or is full due to slow receiver",
      },
      {
        step: 5,
        actor: "Write Timeout Timer",
        action: "Check Progress",
        description:
          "Monitor if write is making progress or blocked on full buffer",
      },
      {
        step: 6,
        actor: "Connection Terminator",
        action: "Handle Completion or Timeout",
        description:
          "On success: cancel timer, return bytes written. On timeout: destroy socket, throw WriteTimeoutError",
      },
    ],
    invariants: [
      "Write timeout starts when write operation begins, not when connection established",
      "Timer applies to blocking write operations, not total data transmission time",
      "Timeout must close socket and free sender resources (thread, memory)",
      "Write timeout should be shorter than request timeout but potentially longer than read timeout",
      "Partial writes may leave data in inconsistent state - application must handle",
      "Backpressure detection is a warning signal; timeout is hard failure enforcement",
    ],
  },

  codeExamples: [
    {
      id: "write-timeout-ts-basic",
      language: "typescript",
      title: "Write Timeout with Streaming Response Handling",
      description:
        "TypeScript implementation of write timeout for HTTP streaming responses with configurable timeout, backpressure detection, and graceful client disconnection",
      code: `import { IncomingMessage, ServerResponse } from 'http';
import { Writable } from 'stream';

interface WriteTimeoutConfig {
  timeoutMs: number;
  onTimeout?: (clientId: string) => void;
  onSlowConsumer?: (clientId: string, bufferSize: number) => void;
}

class WriteTimeoutError extends Error {
  constructor(message: string, public clientId: string) {
    super(message);
    this.name = 'WriteTimeoutError';
  }
}

/**
 * Wraps a response stream with write timeout protection.
 * Monitors how long write operations block and terminates slow consumers.
 */
class TimeoutProtectedWriter {
  private writeTimeoutHandle: NodeJS.Timeout | null = null;
  private lastWriteStartTime: number = 0;
  private totalBytesWritten: number = 0;
  private isTimedOut: boolean = false;

  constructor(
    private response: ServerResponse,
    private config: WriteTimeoutConfig,
    private clientId: string
  ) {}

  /**
   * Write data with timeout protection.
   * Returns false if write would block (backpressure detected).
   */
  async write(chunk: Buffer | string): Promise<boolean> {
    if (this.isTimedOut) {
      throw new WriteTimeoutError(
        \`Write timeout already triggered for client \${this.clientId}\`,
        this.clientId
      );
    }

    this.lastWriteStartTime = Date.now();

    // Set timeout for this write operation
    this.writeTimeoutHandle = setTimeout(() => {
      this.handleTimeout();
    }, this.config.timeoutMs);

    return new Promise((resolve, reject) => {
      // Attempt to write chunk to response stream
      const canContinueWriting = this.response.write(chunk, (err) => {
        // Clear timeout - write completed
        if (this.writeTimeoutHandle) {
          clearTimeout(this.writeTimeoutHandle);
          this.writeTimeoutHandle = null;
        }

        if (err) {
          reject(err);
        } else {
          const writeDuration = Date.now() - this.lastWriteStartTime;
          this.totalBytesWritten += Buffer.byteLength(chunk);

          console.log(
            \`[Client \${this.clientId}] Wrote \${Buffer.byteLength(chunk)} bytes in \${writeDuration}ms\`
          );

          resolve(canContinueWriting);
        }
      });

      // If write returned false, TCP buffer is full - backpressure!
      if (!canContinueWriting) {
        const bufferSize = this.response.writableLength || 0;
        console.warn(
          \`[Client \${this.clientId}] Backpressure detected! Buffer size: \${bufferSize} bytes\`
        );

        if (this.config.onSlowConsumer) {
          this.config.onSlowConsumer(this.clientId, bufferSize);
        }
      }
    });
  }

  private handleTimeout(): void {
    this.isTimedOut = true;
    const timeBlocked = Date.now() - this.lastWriteStartTime;

    console.error(
      \`[Client \${this.clientId}] Write timeout after \${timeBlocked}ms. Terminating connection.\`
    );

    if (this.config.onTimeout) {
      this.config.onTimeout(this.clientId);
    }

    // Force close the connection - client is too slow
    this.response.destroy(
      new WriteTimeoutError(
        \`Write operation blocked for \${timeBlocked}ms, exceeding timeout of \${this.config.timeoutMs}ms\`,
        this.clientId
      )
    );
  }

  end(): void {
    if (this.writeTimeoutHandle) {
      clearTimeout(this.writeTimeoutHandle);
    }

    console.log(
      \`[Client \${this.clientId}] Connection ended. Total bytes written: \${this.totalBytesWritten}\`
    );

    this.response.end();
  }
}

/**
 * Example: Streaming video to multiple clients with write timeout protection
 */
class VideoStreamingServer {
  private clients = new Map<string, TimeoutProtectedWriter>();
  private clientCounter = 0;

  handleClient(req: IncomingMessage, res: ServerResponse): void {
    const clientId = \`client-\${++this.clientCounter}\`;

    console.log(\`[Client \${clientId}] Connected from \${req.socket.remoteAddress}\`);

    // Create timeout-protected writer for this client
    const writer = new TimeoutProtectedWriter(
      res,
      {
        timeoutMs: 5000, // 5 second write timeout
        onTimeout: (id) => {
          console.log(\`Removing slow client: \${id}\`);
          this.clients.delete(id);
        },
        onSlowConsumer: (id, bufferSize) => {
          // Could implement adaptive bitrate reduction here
          console.log(\`Client \${id} buffer at \${bufferSize} bytes - consider reducing quality\`);
        },
      },
      clientId
    );

    this.clients.set(clientId, writer);

    // Set response headers for streaming
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(\`[Client \${clientId}] Disconnected\`);
      this.clients.delete(clientId);
    });
  }

  /**
   * Broadcast video chunk to all connected clients.
   * Automatically removes clients that timeout.
   */
  async broadcastChunk(videoChunk: Buffer): Promise<void> {
    const writePromises: Promise<void>[] = [];

    for (const [clientId, writer] of this.clients.entries()) {
      const writePromise = writer
        .write(videoChunk)
        .then((canContinue) => {
          if (!canContinue) {
            // Backpressure detected - could pause here if needed
            console.log(\`Client \${clientId} experiencing backpressure\`);
          }
        })
        .catch((err) => {
          if (err instanceof WriteTimeoutError) {
            console.error(\`Client \${clientId} timed out and was removed\`);
            this.clients.delete(clientId);
          } else {
            console.error(\`Error writing to client \${clientId}:\`, err.message);
            this.clients.delete(clientId);
          }
        });

      writePromises.push(writePromise);
    }

    // Wait for all writes to complete or timeout
    await Promise.allSettled(writePromises);
  }

  getActiveClientCount(): number {
    return this.clients.size;
  }
}

// Usage Example
const server = new VideoStreamingServer();

// Simulate streaming video frames
async function streamVideo() {
  const frameSize = 1024 * 100; // 100KB per frame
  let frameNumber = 0;

  setInterval(async () => {
    const frame = Buffer.alloc(frameSize, frameNumber++);

    console.log(
      \`Broadcasting frame \${frameNumber} (\${frameSize} bytes) to \${server.getActiveClientCount()} clients\`
    );

    await server.broadcastChunk(frame);
  }, 33); // ~30 FPS
}

streamVideo();`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Write timeout protection for streaming HTTP responses in a Node.js server. Covers timeout-protected writer, backpressure detection, and multi-client broadcasting.",
        prerequisites: [
          "Understanding of TCP flow control and send buffers",
          "Knowledge of Node.js streams and backpressure",
          "Familiarity with HTTP chunked transfer encoding",
          "Concept of blocking vs non-blocking I/O operations",
        ],
        systemPosition:
          "Sits at the HTTP server layer between application logic and the TCP socket. Wraps ServerResponse to add timeout protection for write operations. Used in real-time streaming services, live video broadcasts, SSE endpoints, and any scenario pushing data to potentially slow clients.",
      },
      annotations: [
        {
          id: "write-timeout-promise-wrapper",
          lines: [45, 79],
          action:
            "Wrap response.write() in a Promise with timeout protection and completion tracking",
          reason:
            "Node.js response.write() is asynchronous but doesn't return a Promise natively. We promisify it to use async/await and integrate timeout logic. The timeout is set BEFORE the write and cleared in the callback AFTER completion. This measures actual write blocking time, not just wall-clock time. The callback-based approach ensures we detect when the write truly completes (data flushed to socket buffer) versus when it's merely queued.",
          contextLevel: "local",
          relatedConcepts: ["promisification", "async-io", "tcp-flow-control"],
        },
        {
          id: "write-timeout-backpressure-detection",
          lines: [70, 79],
          action:
            "Check write() return value and emit warning when backpressure is detected",
          reason:
            "response.write() returns false when the internal buffer is full, signaling backpressure—the client isn't consuming data fast enough. This is distinct from a timeout: backpressure is a warning (buffer filling up), timeout is a hard limit (write blocked too long). Detecting backpressure early allows adaptive strategies like reducing video quality, pausing streams, or warning monitoring systems before hitting the timeout threshold.",
          contextLevel: "module",
          relatedConcepts: ["backpressure", "flow-control", "adaptive-bitrate"],
        },
        {
          id: "write-timeout-forced-disconnect",
          lines: [96, 103],
          action:
            "Destroy the response socket when write timeout is exceeded, terminating the slow client",
          reason:
            "When a write blocks longer than the timeout, the client is unresponsive or too slow. Calling response.destroy() immediately closes the TCP connection, freeing server resources (memory buffers, file descriptors, event listeners). Without forced termination, the server would hang indefinitely trying to send data to a dead or slow client, eventually exhausting resources and blocking other clients. This is the core value of write timeout—preventing one slow consumer from degrading the entire service.",
          contextLevel: "module",
          relatedConcepts: [
            "resource-cleanup",
            "load-shedding",
            "slow-consumer",
          ],
        },
        {
          id: "write-timeout-per-operation-timeout",
          lines: [47, 50],
          action:
            "Set a new timeout for each write operation, not a global connection timeout",
          reason:
            "Write timeout is per-operation, not per-connection. Each write() call gets its own timeout because write durations vary based on data size and network conditions. A long-lived streaming connection might have hundreds of successful writes before one blocks due to client network congestion. Per-operation timeouts allow fine-grained detection of when a specific write stalls, while still supporting long-lived connections. This contrasts with connection timeout (total time connected) and idle timeout (time since last activity).",
          contextLevel: "module",
          relatedConcepts: [
            "timeout-types",
            "operation-granularity",
            "streaming-protocols",
          ],
        },
        {
          id: "write-timeout-cleanup-on-success",
          lines: [52, 56],
          action:
            "Clear the timeout immediately when write completes successfully",
          reason:
            "Timeouts are a safety net for blocked operations. Once the write succeeds, the timeout is no longer needed and must be cleared to prevent false positives. If we didn't clear it, the timeout could fire after the write completed, incorrectly terminating a healthy client. This pattern (set timeout → perform operation → clear timeout on success) is fundamental to operation-level timeout implementations. The callback ensures cleanup happens exactly when the OS confirms the write flushed to the socket buffer.",
          contextLevel: "local",
          relatedConcepts: ["timeout-lifecycle", "cleanup-pattern"],
        },
        {
          id: "write-timeout-broadcast-isolation",
          lines: [173, 201],
          action:
            "Isolate write failures per-client using Promise.allSettled to prevent one timeout from affecting others",
          reason:
            "When broadcasting to 100 clients, if one client times out, only that client should be removed—the other 99 continue receiving data. Promise.allSettled (not Promise.all) achieves this: it waits for all writes to complete or fail independently, without short-circuiting on the first failure. Each client's write error is caught and handled individually, removing the failed client from the map while others continue. This prevents cascading failures where one slow client kills the broadcast for everyone.",
          contextLevel: "module",
          relatedConcepts: [
            "failure-isolation",
            "promise-combinators",
            "multicast-resilience",
          ],
        },
        {
          id: "write-timeout-state-tracking",
          lines: [22, 25],
          action:
            "Track write operation state including start time, bytes written, and timeout status",
          reason:
            "State tracking enables observability and debugging. lastWriteStartTime measures how long the current write has been blocking. totalBytesWritten tracks data volume for capacity planning. isTimedOut prevents write-after-timeout bugs where new writes attempt after timeout fired. This state is essential for monitoring slow clients, calculating bandwidth, and generating meaningful error messages with context (how long blocked, how much data successfully sent before failure).",
          contextLevel: "module",
          relatedConcepts: [
            "observability",
            "state-machine",
            "operation-metrics",
          ],
        },
        {
          id: "write-timeout-error-context",
          lines: [35, 41],
          action:
            "Include client ID and timing context in timeout errors for debugging",
          reason:
            "Production debugging requires context: which client timed out, when, and why. Custom WriteTimeoutError includes clientId for tracing the specific connection and timeout details for root cause analysis. This enables correlating timeout events with client IP, geographic location, network provider, or device type in logs. Generic errors like 'write failed' are useless at scale; contextual errors enable pattern recognition (e.g., 'all timeouts from mobile clients on network X').",
          contextLevel: "module",
          relatedConcepts: [
            "error-context",
            "distributed-tracing",
            "production-debugging",
          ],
        },
        {
          id: "write-timeout-streaming-use-case",
          lines: [211, 230],
          action:
            "Simulate video streaming workload to demonstrate write timeout under realistic load",
          reason:
            "Write timeout is most critical in streaming scenarios where servers push continuous data to clients. This example broadcasts 100KB frames at 30 FPS (3MB/s) to multiple clients—exactly the scenario where write timeout is essential. If a mobile client's network drops to 1MB/s, their receive buffer fills, write() blocks, and timeout triggers. Without write timeout, the server would block indefinitely trying to push frames to the slow client, consuming memory and preventing that server thread from handling other clients. The example demonstrates the pattern's value proposition: automatic slow client removal maintains service quality for healthy clients.",
          contextLevel: "system",
          relatedConcepts: [
            "streaming-video",
            "real-time-systems",
            "quality-of-service",
          ],
        },
      ],
      highlights: [
        {
          lines: [47, 50],
          sbvpDomain: "behavior",
          label: "Per-Operation Timeout Registration",
        },
        {
          lines: [52, 67],
          sbvpDomain: "behavior",
          label: "Timeout Clearance and Write Completion Tracking",
        },
        {
          lines: [70, 79],
          sbvpDomain: "structure",
          label: "Backpressure Detection via Write Return Value",
        },
        {
          lines: [88, 103],
          sbvpDomain: "philosophy",
          label: "Forced Disconnection for Slow Consumers",
        },
        {
          lines: [173, 201],
          sbvpDomain: "behavior",
          label: "Isolated Failure Handling with Promise.allSettled",
        },
        {
          lines: [35, 41],
          sbvpDomain: "structure",
          label: "Contextual Error with Client Tracing",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Write timeouts are configured at the socket and stream writing layer, sitting between application data emission and network transmission. In HTTP servers, they're applied to response streams (ServerResponse objects in Node.js, HttpServletResponse in Java) to prevent threads from blocking when writing responses to slow clients. Streaming endpoints (video broadcasts, server-sent events, WebSocket streams) configure write timeout on the underlying socket before pushing data chunks. Database drivers implement write timeouts when sending large query payloads or bulk insert data to prevent hanging on unresponsive database servers. Message queue publishers (Kafka producers, RabbitMQ publishers) set write timeouts to detect when message brokers cannot keep up with message rates. File upload handlers apply write timeouts when streaming request body data from clients to prevent resource exhaustion from stalled uploads. The configuration typically happens during socket creation or stream initialization: socket.setTimeout(5000) for raw TCP, response.socket.setTimeout(10000) for HTTP, or producer configuration in message queue clients. Write timeout values are generally shorter than read timeouts (5-10s vs 30-60s) because write operations should be fast—data is being sent to buffers, not processed on remote systems. The pattern is essential in any system that pushes data to potentially slow or unresponsive consumers, protecting the sender from being blocked by receiver capacity limitations.",

      "In real-time streaming architectures (video CDNs, live sports broadcasts, financial data feeds), write timeouts are configured at multiple layers. Edge servers streaming video to clients set 5-10 second write timeouts on HTTP response sockets—if a client on a slow mobile network can't consume video frames fast enough, write() blocks until their TCP receive buffer has space, and timeout fires after 5s of blocking. This prevents one slow client from consuming server resources indefinitely. Origin servers streaming to edge servers use longer write timeouts (30s) since edge-to-origin connections are typically high-bandwidth datacenter links. WebSocket streaming implementations wrap socket.write() with timeout protection, using Promise.race() to enforce 10-second write deadlines per message frame. Server-Sent Events (SSE) endpoints set write timeouts on response streams to detect disconnected clients—when client closes browser tab, TCP connection may remain 'established' for minutes (half-open connection), and write timeout is the fastest way to detect and cleanup. The configuration sits in the application's streaming controller layer, between business logic generating data and transport layer sending data. This placement allows adaptive strategies: when write timeout approaches, reduce video bitrate (adaptive streaming), drop optional frames, or buffer data and retry. The key architectural insight is that write timeout is a sender-side protection mechanism—it's the sender deciding 'I won't wait more than 5s for you to accept my data', enabling load shedding of slow consumers before resource exhaustion occurs.",

      "Database connection pooling frameworks integrate write timeout at the SQL command execution layer. When applications execute INSERT statements with large payloads (batch inserts, COPY commands in PostgreSQL, LOAD DATA in MySQL), the driver must send megabytes of data to the database server. If the database is overloaded (CPU saturated, disk I/O congested, replication lagging), its receive buffer fills and write() operations block. Connection pool libraries like HikariCP (Java), pgbouncer (PostgreSQL), and node-postgres configure write timeouts (socketTimeout, queryTimeout) to prevent connections from blocking indefinitely during data transmission. The timeout is set per-connection in the pool configuration and enforced at the socket level. When timeout fires during a bulk insert, the driver closes the connection and returns it to the pool as 'failed', triggering connection health checks and potential reconnection. This placement—between SQL execution layer and TCP socket—is critical because write timeout must trigger BEFORE connection pool's idle timeout, otherwise the pool would mark healthy connections as idle-timed-out when they're actually blocked on writes. Advanced implementations track write progress: if 80% of data transmitted successfully before timeout, retry the operation with a larger timeout; if timeout occurs immediately, suspect network partition. The system context here is write timeout protecting finite connection pool capacity from being monopolized by slow write operations, ensuring pool availability for other queries.",

      "Message queue producers (Kafka, RabbitMQ, NATS) implement write timeout at the producer client layer, between message serialization and socket transmission. When publishing messages to brokers, the producer must write message bytes to the TCP connection's send buffer. If broker is slow to acknowledge (disk sync lag, replication catching up, consumer processing backlog), its TCP receive buffer fills, causing backpressure to the producer's write operations. Kafka producers expose socket.send.buffer.bytes and timeout.ms configuration—when write() blocks for longer than timeout.ms (default 30s), producer fails the send with TimeoutException. RabbitMQ uses channel-level flow control combined with socket write timeouts: when broker sends channel.flow(false), producer stops writes, and timeout determines how long to wait before failing. The placement is in the producer's network I/O layer, after message batching but before network transmission. This positioning enables intelligent retry: timeout during write suggests broker capacity issue (exponential backoff), while timeout during connection establishment suggests network partition (failover to replica). Modern streaming platforms like Apache Pulsar implement write timeout with adaptive batching: if write timeout is approaching due to slow broker, reduce batch size to avoid timeout, sacrificing throughput for latency. The architectural boundary is producer application thread → serialization buffer → socket send buffer → network → broker receive buffer, with write timeout protecting the producer thread from indefinite blocking when broker falls behind. This is critical for high-throughput systems where producer threads are expensive resources that must remain available to accept upstream data.",

      "HTTP proxy servers and API gateways (nginx, Envoy, HAProxy, Zuul) configure write timeouts at the reverse proxy layer between backend service responses and client connections. When proxying responses, the gateway receives data from backend, then writes it to client socket. If client is slow (mobile network, poor connectivity, processing large response), the client's TCP receive buffer fills, causing write() calls to block. Nginx's proxy_send_timeout directive (default 60s) limits how long nginx waits for client to accept response data. Envoy's downstream_connection_idle_timeout serves similar purpose. The timeout placement is in the proxy's event loop between backend data arrival handler and client socket write handler. When timeout fires, proxy closes client connection and logs 'client timed out', freeing proxy worker thread/event loop slot. This placement is architecturally significant because proxies often operate in non-blocking I/O mode (epoll/kqueue event loops), and write timeout is implemented via write-readiness events: register socket for WRITE event, if socket isn't write-ready within timeout, assume client is too slow and close. Advanced proxies implement hierarchical timeouts: upstream_timeout (reading from backend), processing_timeout (internal buffering), downstream_timeout (writing to client). Write timeout specifically protects the downstream (client) write phase. The pattern composes with buffering strategies: nginx buffers backend response in memory (proxy_buffer_size), then uses write timeout to drain buffer to client. If write timeout is exceeded, buffered data is discarded and connection closed. This system context—protecting proxy resources from slow clients while maintaining backend service throughput—is the canonical use case for write timeout in distributed systems.",
    ],
    architecturalBoundaries: [
      "HTTP Server Response Layer: Node.js ServerResponse.setTimeout(), Express res.socket.setTimeout(), Koa context.socket.setTimeout(). Applied to response streams before writing response bodies to clients. Typical values: 5-10s for API responses, 30s for file downloads, 60s for streaming endpoints. Timeout fires when client cannot consume response data fast enough (slow network, client processing lag). Must handle partial response scenarios—cannot retry after partial write. Often combined with backpressure detection (writable.writableLength monitoring) to implement adaptive strategies before timeout. Used in streaming video servers, real-time data APIs, server-sent events, long-polling implementations. Framework placement: middleware layer setting timeout before route handlers stream data.",

      "Database Driver Socket Layer: PostgreSQL pg library socket_timeout, MySQL2 socketTimeout, MongoDB socketTimeoutMS. Controls write timeout when sending query payloads to database server. Typical values: 10-30s for normal queries, 60-300s for bulk operations (COPY, LOAD DATA). Timeout protects against database server overload where connection accepted but server cannot process incoming data fast enough. Critical for connection pool health—write timeout prevents pool connections from being monopolized by hung writes. Placement: driver's protocol layer after SQL serialization, before TCP socket write. Must coordinate with query_timeout (server-side query execution time limit) and connection_timeout (handshake time). Used in batch processing systems, ETL pipelines, high-throughput OLTP applications. Special consideration: partial write of large query may require transaction rollback.",

      "Message Queue Producer Layer: Kafka producer timeout.ms and delivery.timeout.ms, RabbitMQ publisher confirms with timeout, NATS publish deadlines. Controls write timeout when publishing messages to broker. Typical values: Kafka default 30s, RabbitMQ 60s, NATS 5s (low-latency messaging). Timeout occurs when broker's receive buffer is full due to replication lag, disk sync pressure, or consumer backlog. Enables producer-side backpressure handling—when write timeout approaches, reduce message rate, drop low-priority messages, or apply buffering. Placement: producer client's serialization pipeline between message batching and socket write. Kafka specifically implements write timeout at request level (produce request must complete within timeout). Critical for financial trading systems, IoT sensor networks, log aggregation pipelines where producer must not block indefinitely.",

      "Streaming Media Servers: WebSocket socket write timeout, WebRTC data channel bufferedAmountLowThreshold, HLS segment delivery timeout. Controls write timeout when pushing media frames to connected clients. Typical values: 2-5s for real-time (gaming, video conferencing), 10-30s for buffered streaming (VOD). Timeout detects clients that cannot keep up with media bitrate (network congestion, underpowered device). Enables adaptive bitrate streaming—when write timeout approaches, switch to lower quality stream. Placement: media server's frame broadcaster between encoder output and socket write per client. Must handle multi-client scenarios where one slow client doesn't block broadcast to all. Used in Twitch-like platforms, video conferencing (Zoom, Meet), cloud gaming services. Combines with congestion control algorithms (BBR, CUBIC) to optimize throughput while preventing timeout.",
    ],
    interactsWith: [
      "timeout",
      "read-timeout",
      "connection-timeout",
      "request-timeout",
      "backpressure",
      "flow-control",
      "circuit-breaker",
      "retry",
      "load-shedding",
      "adaptive-bitrate",
      "connection-pool",
      "streaming",
    ],
  },

  implementations: [
    {
      id: "nodejs-socket-write-timeout",
      name: "Node.js Socket Write Timeout",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Node.js net.Socket and stream.Writable with socket.setTimeout() for write operation timeout. Fires 'timeout' event when socket remains unwritable for specified duration.",
      links: {
        docs: "https://nodejs.org/api/net.html#socketsettimeouttimeout-callback",
      },
      codeSnippet: `import { Socket } from 'net';
import { ServerResponse } from 'http';

// Raw TCP socket write timeout
const socket = new Socket();
socket.connect({ host: 'example.com', port: 1234 }, () => {
  // Set 5-second write timeout
  socket.setTimeout(5000);

  socket.on('timeout', () => {
    console.error('Socket write timeout - receiver too slow');
    socket.destroy(new Error('Write timeout'));
  });

  // Attempt to write large data
  const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
  const canWrite = socket.write(largeBuffer, (err) => {
    if (err) console.error('Write failed:', err);
    else {
      socket.setTimeout(0); // Clear timeout on success
      console.log('Write completed');
    }
  });

  if (!canWrite) {
    console.warn('Backpressure detected - socket buffer full');
  }
});

// HTTP response write timeout
function handleRequest(req: any, res: ServerResponse) {
  // Set write timeout on response socket
  res.socket?.setTimeout(10000); // 10s timeout

  res.socket?.on('timeout', () => {
    console.error('Client too slow consuming response');
    res.destroy();
  });

  // Stream large response
  const dataStream = getLargeDataStream();
  dataStream.pipe(res);
}`,
    },
    {
      id: "go-net-write-timeout",
      name: "Go net.Conn Write Deadline",
      type: "library",
      languages: ["go"],
      description:
        "Go's net.Conn interface provides SetWriteDeadline() for per-write timeout enforcement. Used in HTTP servers, TCP servers, and gRPC implementations.",
      links: {
        docs: "https://pkg.go.dev/net#Conn",
      },
      codeSnippet: `package main

import (
    "net"
    "time"
    "log"
)

func handleConnection(conn net.Conn) {
    defer conn.Close()

    data := make([]byte, 1024*1024) // 1MB data

    // Set write deadline (5 seconds from now)
    conn.SetWriteDeadline(time.Now().Add(5 * time.Second))

    n, err := conn.Write(data)
    if err != nil {
        if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
            log.Printf("Write timeout: only %d bytes written", n)
            return
        }
        log.Printf("Write error: %v", err)
        return
    }

    log.Printf("Successfully wrote %d bytes", n)

    // Clear deadline for subsequent operations
    conn.SetWriteDeadline(time.Time{})
}

// HTTP server with write timeout
func httpServerWithWriteTimeout() {
    server := &http.Server{
        Addr:         ":8080",
        WriteTimeout: 10 * time.Second, // Timeout for writing response
        ReadTimeout:  5 * time.Second,  // Timeout for reading request
        IdleTimeout:  60 * time.Second, // Timeout for keep-alive
    }

    server.ListenAndServe()
}`,
    },
    {
      id: "python-socket-write-timeout",
      name: "Python Socket Write Timeout",
      type: "library",
      languages: ["python"],
      description:
        "Python socket.settimeout() applies to both read and write operations. For send operations, raises socket.timeout exception when buffer full for duration exceeding timeout.",
      links: {
        docs: "https://docs.python.org/3/library/socket.html#socket.socket.settimeout",
      },
      codeSnippet: `import socket
import time

def send_with_timeout(sock: socket.socket, data: bytes, timeout: float = 5.0):
    """Send data with write timeout."""
    sock.settimeout(timeout)

    try:
        total_sent = 0
        while total_sent < len(data):
            # This will timeout if receiver's buffer is full
            sent = sock.send(data[total_sent:])
            if sent == 0:
                raise RuntimeError("Socket connection broken")
            total_sent += sent
            print(f"Sent {sent} bytes ({total_sent}/{len(data)})")

    except socket.timeout:
        print(f"Write timeout after {timeout}s ({total_sent} bytes sent)")
        raise
    except Exception as e:
        print(f"Write error: {e}")
        raise
    finally:
        sock.settimeout(None)  # Clear timeout

# HTTP server with write timeout
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver

class TimeoutHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Set write timeout on response socket
        self.connection.settimeout(10.0)  # 10s write timeout

        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.end_headers()

            # Stream large response
            chunk_size = 8192
            for i in range(1000):  # 8MB total
                self.wfile.write(b'x' * chunk_size)

        except socket.timeout:
            print("Client too slow - write timeout")
            self.connection.close()`,
    },
    {
      id: "kafka-producer-timeout",
      name: "Kafka Producer Write Timeout",
      type: "platform",
      languages: ["java", "scala"],
      description:
        "Apache Kafka producer with timeout.ms and delivery.timeout.ms controlling write timeout for message publishing. Protects against slow broker acknowledgments.",
      links: {
        docs: "https://kafka.apache.org/documentation/#producerconfigs_timeout.ms",
      },
      codeSnippet: `// Kafka producer with write timeout configuration
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// timeout.ms: Max time to wait for broker acknowledgment of single produce request
props.put("timeout.ms", 30000); // 30 seconds

// delivery.timeout.ms: Max time for entire send operation (includes retries)
props.put("delivery.timeout.ms", 120000); // 2 minutes

// request.timeout.ms: Max time to wait for response from broker
props.put("request.timeout.ms", 30000); // 30 seconds

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

try {
    // Async send with callback
    producer.send(
        new ProducerRecord<>("my-topic", "key", "value"),
        (metadata, exception) -> {
            if (exception != null) {
                if (exception instanceof TimeoutException) {
                    System.err.println("Write timeout: broker too slow");
                } else {
                    System.err.println("Send failed: " + exception);
                }
            } else {
                System.out.println("Sent to partition " + metadata.partition());
            }
        }
    );
} finally {
    producer.close();
}`,
    },
    {
      id: "nginx-proxy-send-timeout",
      name: "Nginx Proxy Send Timeout",
      type: "platform",
      languages: ["nginx"],
      description:
        "Nginx reverse proxy with proxy_send_timeout directive controlling write timeout when sending responses to clients. Critical for streaming and large file downloads.",
      links: {
        docs: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_send_timeout",
      },
      codeSnippet: `# Nginx configuration for write timeout to clients
http {
    # Global defaults
    send_timeout 60s;  # Default write timeout to clients

    server {
        listen 80;
        server_name api.example.com;

        # API endpoint with short timeout
        location /api/ {
            proxy_pass http://backend;

            # Timeout for writing response to client (not backend read)
            proxy_send_timeout 10s;  # Client must consume data within 10s

            # Timeout for reading from backend
            proxy_read_timeout 30s;

            # Timeout for connecting to backend
            proxy_connect_timeout 5s;

            # Buffer settings affect write backpressure
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        # Streaming endpoint with longer timeout
        location /stream/ {
            proxy_pass http://streaming-backend;

            # Allow slower clients for streaming
            proxy_send_timeout 60s;

            # Disable buffering for real-time streaming
            proxy_buffering off;

            # HTTP/1.1 for chunked transfer encoding
            proxy_http_version 1.1;
            chunked_transfer_encoding on;
        }

        # Large file download with extended timeout
        location /downloads/ {
            root /var/www/files;

            # Allow slow downloads (mobile networks)
            send_timeout 300s;  # 5 minutes

            # Limit rate to prevent buffer exhaustion
            limit_rate 1m;  # 1 MB/s per connection
        }
    }
}`,
    },
    {
      id: "websocket-write-timeout",
      name: "WebSocket Write Timeout",
      type: "framework",
      languages: ["javascript", "typescript", "python"],
      description:
        "WebSocket implementations with write timeout for frame transmission. Detects slow clients unable to keep up with message rate.",
      links: {
        docs: "https://github.com/websockets/ws#how-to-detect-and-close-broken-connections",
      },
      codeSnippet: `// Node.js WebSocket server with write timeout (using 'ws' library)
import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

function sendWithTimeout(
  ws: WebSocket,
  data: string,
  timeoutMs: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.terminate(); // Force close slow client
      reject(new Error(\`Write timeout after \${timeoutMs}ms\`));
    }, timeoutMs);

    ws.send(data, (err) => {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    });
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Broadcast data to client with timeout protection
  const broadcastInterval = setInterval(async () => {
    try {
      await sendWithTimeout(ws, JSON.stringify({
        timestamp: Date.now(),
        data: 'real-time update'
      }), 5000);

    } catch (err) {
      console.error('Slow client removed:', err);
      clearInterval(broadcastInterval);
      ws.terminate();
    }
  }, 1000);

  ws.on('close', () => {
    clearInterval(broadcastInterval);
    console.log('Client disconnected');
  });
});`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-video-streaming",
      systemName: "Netflix Video Streaming CDN",
      howUsed:
        "Netflix's video streaming infrastructure implements aggressive write timeouts at edge servers to handle millions of concurrent video streams to clients with varying network conditions. When an edge server streams video chunks to a client (via HTTP adaptive bitrate streaming or chunked transfer encoding), it sets a 5-10 second write timeout on the response socket. If a client on a slow mobile network (3G, congested WiFi) cannot consume video frames fast enough, the TCP send buffer fills, causing write() operations to block. When the write timeout fires, Netflix's edge server immediately terminates the slow client connection, freeing server resources (socket buffers, HTTP/2 stream slots, memory) for other clients. This prevents one slow client from consuming disproportionate server resources. The write timeout value varies by streaming protocol: 5s for low-latency streaming (live sports), 10s for buffered VOD content. Netflix combines write timeout with adaptive bitrate logic—when backpressure is detected (write() returning false) but timeout hasn't fired yet, the encoder reduces bitrate for that client, attempting to match client's network capacity. If timeout fires despite bitrate reduction, client is considered unserviceable and dropped. During peak viewing hours (8-11pm), write timeouts prevent thread pool exhaustion in edge servers: without timeouts, slow clients would monopolize worker threads, creating cascading failures where new client connections are rejected due to thread exhaustion. Pattern composition: Write Timeout + Adaptive Bitrate Streaming + Backpressure Detection + Thread Pool Isolation + Circuit Breaker (when too many timeouts from specific ISP/region, reduce traffic). Impact: Reduced P95 server resource utilization by 30%, prevented cascading failures during peak hours, improved quality of experience for healthy clients by removing slow clients that would otherwise degrade service capacity.",
      source:
        "https://netflixtechblog.com/serving-100-gbps-from-an-open-connect-appliance-cdb51dda3b99",
    },
    {
      systemId: "kafka-broker-producer",
      systemName: "Apache Kafka Producer to Broker Communication",
      howUsed:
        "Apache Kafka's producer client uses write timeout (timeout.ms configuration) to protect producer threads from blocking indefinitely when sending messages to brokers. When a producer publishes messages, it batches them and writes the batch to the broker's TCP connection. If the broker is slow to acknowledge (disk fsync lag, replication to followers catching up, page cache eviction), the broker's TCP receive buffer fills, causing producer's write() to block. Kafka's default timeout.ms of 30 seconds ensures producers don't wait forever—if write doesn't complete within 30s, producer fails the batch with TimeoutException and can retry to a different broker replica. This timeout is critical during broker rolling upgrades: when a broker restarts, it stops accepting writes for 10-20 seconds while recovering state. Without write timeout, producers would block indefinitely waiting for the unavailable broker. With timeout, producer detects failure in 30s and fails over to healthy replicas. Kafka's write timeout interacts with other timeouts: delivery.timeout.ms (120s default) covers end-to-end time including retries, while timeout.ms covers individual write operations. During rebalance events (consumer groups reshuffling partitions), brokers may pause processing while rebalancing, causing writes to stall—timeout prevents producer threads from being tied up during rebalances. Financial trading platforms using Kafka tune timeout.ms aggressively (5-10s) to detect broker issues quickly and failover to backup datacenters. High-throughput IoT platforms use longer timeouts (60s) to accommodate periodic broker maintenance without failing writes. Pattern composition: Write Timeout + Producer Batching + Automatic Failover + Request-level Retry + Idempotent Writes (to handle retry after timeout). Impact: Enabled zero-downtime broker upgrades by failing over producers within 30s, prevented producer thread exhaustion during broker overload, reduced end-to-end publish latency P99 by 40% through faster failure detection and retry.",
      source:
        "https://kafka.apache.org/documentation/#producerconfigs_timeout.ms",
    },
    {
      systemId: "postgresql-pgbouncer-pool",
      systemName: "PgBouncer Connection Pooler with Write Timeout",
      howUsed:
        "PgBouncer, PostgreSQL's connection pooler, implements write timeout (server_reset_query_timeout parameter) to prevent connection pool exhaustion from hung database write operations. When application executes large INSERT/UPDATE queries or COPY commands through PgBouncer, the pooler must forward query data to PostgreSQL server. If database is overloaded (checkpoint sync, vacuum operation, replication lag), server's receive buffer fills, causing PgBouncer's write() to block. Without timeout, pool connections would remain blocked indefinitely, exhausting the pool and preventing other queries from executing. PgBouncer's default server_lifetime (3600s) combined with query_timeout protects against this: if write operation doesn't complete within configured timeout, PgBouncer closes the connection to PostgreSQL and removes it from the pool as failed. This forces application to get error quickly and retry, while the pool marks the server connection as potentially unhealthy. During PostgreSQL failover scenarios (primary crash, replica promotion), write timeout enables fast detection: when primary becomes unavailable, PgBouncer's write timeout (typically 10-30s) detects the failure faster than TCP keepalive (minutes) or application-level timeouts (could be infinite). E-commerce platforms using PgBouncer tune write timeout based on query types: transaction queries get 10s timeout (should be fast), analytics queries get 300s timeout (legitimately slow), bulk ETL operations get 600s timeout. The timeout placement is critical—between PgBouncer and PostgreSQL, not between application and PgBouncer, because PgBouncer needs to detect server issues independently. Pattern composition: Write Timeout + Connection Pooling + Health Checks + Failover Detection + Query Timeout (server-side, separate concern). Impact: Reduced pool exhaustion incidents by 90%, enabled sub-minute failover detection during primary crashes, improved application throughput during database overload by failing fast instead of queueing infinitely.",
      source: "https://www.pgbouncer.org/config.html",
    },
    {
      systemId: "envoy-proxy-downstream",
      systemName: "Envoy Proxy Downstream Write Timeout",
      howUsed:
        "Envoy proxy, used in service mesh architectures (Istio, AWS App Mesh), implements downstream write timeout (stream_idle_timeout) to protect proxy resources when writing responses to slow clients. When Envoy proxies a request, it reads response from upstream service, then writes response to downstream client. If downstream client is slow (mobile device, poor network, overloaded client), client's TCP receive buffer fills, causing Envoy's write operations to block. Envoy's stream_idle_timeout (default 300s, often tuned to 30-60s) enforces write timeout: if no bytes can be written to client for timeout duration, Envoy terminates the connection, freeing proxy worker thread and memory buffers. This is critical in Kubernetes service meshes where Envoy sidecars have limited memory (512MB-1GB) and must handle thousands of concurrent connections. A single slow client could consume 10-50MB buffering response data waiting for client to accept it—without write timeout, 20 slow clients would exhaust proxy memory. Envoy's timeout is particularly important for streaming gRPC (bidirectional streams) and HTTP/2 server push: these protocols allow server to push data proactively, and write timeout prevents indefinite blocking when client can't keep up. During rolling deployments, Envoy's write timeout interacts with connection draining: when pod is terminating, Envoy stops accepting new connections but completes in-flight responses; write timeout ensures draining completes within bounded time (drain_timeout) by terminating slow clients. Istio configurations for high-throughput APIs tune stream_idle_timeout to 10s for REST APIs (should complete fast), 60s for file downloads, 300s for long-polling/SSE endpoints. Pattern composition: Write Timeout + Connection Draining + Circuit Breaker (track downstream timeout rate) + Retry Budget + Request Hedging. Impact: Reduced Envoy sidecar OOM kills by 95%, improved pod termination time from 5 minutes to 30 seconds, enabled handling 10x more concurrent connections per proxy by preventing slow clients from monopolizing resources.",
      source:
        "https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/core/v3/protocol.proto#config-core-v3-httpprotocoloptions",
    },
    {
      systemId: "rabbitmq-publisher-confirms",
      systemName: "RabbitMQ Publisher Confirms with Timeout",
      howUsed:
        "RabbitMQ's publisher confirms mechanism implements write timeout to ensure message publishers don't block indefinitely waiting for broker acknowledgments. When publisher sends message to RabbitMQ broker, it writes message bytes to TCP connection. If broker is slow (disk I/O congestion, queue mirroring lag, memory pressure causing flow control), broker's receive buffer fills or broker stops reading from socket, causing publisher's write() to block. RabbitMQ client libraries (AMQP 0.9.1 implementations) configure socket write timeout (SocketFactory.setSocketTimeout in Java, socket_timeout in Python pika library) typically 10-60 seconds. When timeout fires during write, publisher fails with SocketTimeoutException, enabling application to retry to alternate broker node in cluster. This timeout is critical during RabbitMQ broker failures: when broker crashes, TCP connection remains 'established' from client perspective until TCP keepalive (2+ minutes) detects failure. Write timeout detects failure in 10s: when client attempts to publish after broker crash, write blocks (no broker reading from socket), timeout fires, client closes connection and reconnects to surviving cluster node. Financial messaging systems using RabbitMQ tune write timeout aggressively (5-10s) combined with publisher confirms: if message write + confirm doesn't complete within 10s total, failover to backup cluster. Log aggregation systems use longer timeouts (60s) to tolerate periodic broker disk sync pauses. RabbitMQ's flow control (memory/disk alarms) interacts with write timeout: when broker enters flow control, it stops reading from client sockets, causing publisher writes to block until alarm clears or timeout fires. Pattern composition: Write Timeout + Publisher Confirms (reliability) + Cluster Failover + Message Persistence + Flow Control. Impact: Reduced publisher thread exhaustion during broker overload by 80%, enabled sub-10s failover during broker crashes, improved end-to-end message latency P99 by preventing indefinite blocking on slow brokers.",
      source: "https://www.rabbitmq.com/docs/confirms#publisher-confirms",
    },
  ],

  references: [
    {
      title: "Node.js Socket Timeout Documentation",
      url: "https://nodejs.org/api/net.html#socketsettimeouttimeout-callback",
      type: "documentation",
      author: "Node.js Foundation",
    },
    {
      title: "Kafka Producer Timeout Configuration",
      url: "https://kafka.apache.org/documentation/#producerconfigs_timeout.ms",
      type: "documentation",
      author: "Apache Kafka",
    },
    {
      title: "Nginx Proxy Send Timeout",
      url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_send_timeout",
      type: "documentation",
      author: "Nginx",
    },
    {
      title: "Envoy Proxy Stream Idle Timeout",
      url: "https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/core/v3/protocol.proto",
      type: "documentation",
      author: "Envoy Proxy",
    },
    {
      title: "RabbitMQ Publisher Confirms",
      url: "https://www.rabbitmq.com/docs/confirms",
      type: "documentation",
      author: "RabbitMQ",
    },
    {
      title: "Netflix Video Streaming Infrastructure",
      url: "https://netflixtechblog.com/serving-100-gbps-from-an-open-connect-appliance-cdb51dda3b99",
      type: "article",
      author: "Netflix Technology Blog",
    },
  ],

  philosophy: {
    coreProblem:
      "Sender threads can block indefinitely when writing data to slow or unresponsive receivers, causing resource exhaustion and cascading failures",
    designPrinciple:
      "Enforce maximum time for write operations to complete, enabling fast detection of slow consumers and preventing sender resource exhaustion through aggressive load shedding",
    historicalContext:
      "Write timeout became critical with rise of streaming protocols and real-time systems. Early HTTP servers assumed fast local networks and didn't implement write timeouts, leading to thread exhaustion from slow mobile clients. Netflix's CDN architecture pioneered aggressive write timeouts (5-10s) to handle millions of heterogeneous clients. Message queue systems (Kafka, RabbitMQ) adopted write timeout to protect producers from broker overload. Service mesh proxies (Envoy, Istio) made write timeout configurable to handle diverse traffic patterns in microservices.",
    alternativesRejected: [
      "Infinite write timeout - causes sender thread/resource exhaustion when receivers are slow",
      "Very long timeout (5+ minutes) - delays detection of slow consumers, allowing resource exhaustion",
      "Same timeout for read and write - write should be faster (buffer operation), needs shorter timeout",
      "Application-level timeout only - doesn't protect against kernel-level blocking in socket write()",
      "Backpressure detection without timeout - signals slowness but doesn't enforce hard limit",
      "TCP keepalive as write timeout - keepalive detects broken connections (minutes), not slow writes (seconds)",
    ],
    mentalModel:
      "Write timeout is like a mail carrier's delivery deadline: if you're not home to receive the package within 30 seconds of knocking, they leave instead of waiting indefinitely at your door",
  },

  visualization: {
    staticDiagram: `graph TB
    Sender[Sender Thread] -->|write data| SendBuf[TCP Send Buffer]
    SendBuf -->|transmit| Network[Network]
    Network -->|deliver| RecvBuf[TCP Receive Buffer]
    RecvBuf -->|consume| Receiver[Receiver]

    Timer[Write Timeout Timer] -.->|monitors| SendBuf

    SendBuf -->|buffer full| Backpressure{Backpressure<br/>detected}
    Backpressure -->|within timeout| Wait[Wait for space]
    Backpressure -->|timeout exceeded| Fail[Close connection]

    Wait -->|space available| Success[Write complete ✓]
    Fail -->|abort| Error[WriteTimeoutError ✗]

    style Sender fill:#e1f5e1
    style Success fill:#90ee90
    style Error fill:#ffe1e1
    style Backpressure fill:#fff4e1
    style Timer fill:#e1e5ff`,
    realWorldAnalogy:
      "Write timeout is like a restaurant server bringing food to a table: if the diners don't have space on the table to accept the plates within 10 seconds, the server moves on to other tables instead of standing there indefinitely holding the food",
    useCases: [
      {
        domain: "Video Streaming CDN",
        scenario:
          "Netflix edge servers use 5-10s write timeout to drop slow clients unable to consume video frames fast enough",
        patternRole:
          "Prevents slow mobile clients from exhausting edge server resources (threads, memory, sockets)",
        companies: ["Netflix", "YouTube", "Twitch", "CDN providers"],
      },
      {
        domain: "Message Queue Producers",
        scenario:
          "Kafka producers use 30s write timeout to detect broker overload and failover to healthy replicas",
        patternRole:
          "Protects producer threads from blocking indefinitely when brokers cannot keep up with message rate",
        companies: ["Kafka", "RabbitMQ", "NATS", "Pulsar"],
      },
      {
        domain: "Database Connection Pools",
        scenario:
          "PgBouncer uses 10-30s write timeout for bulk INSERT operations to detect database overload",
        patternRole:
          "Prevents connection pool exhaustion from hung write operations to slow databases",
        companies: ["PgBouncer", "HikariCP", "c3p0"],
      },
      {
        domain: "API Gateway Proxies",
        scenario:
          "Envoy proxy uses 30-60s downstream write timeout when sending responses to slow HTTP clients",
        patternRole:
          "Protects proxy resources from being monopolized by slow clients during response transmission",
        companies: ["Envoy", "Nginx", "HAProxy", "Istio"],
      },
      {
        domain: "WebSocket Streaming",
        scenario:
          "Real-time collaboration tools use 2-5s write timeout for WebSocket frame delivery to detect disconnected clients",
        patternRole:
          "Enables fast cleanup of stale WebSocket connections and prevents broadcast blocking",
        companies: ["Slack", "Discord", "Google Docs"],
      },
    ],
  },

  tags: [
    "reliability",
    "fault-tolerance",
    "timeout",
    "write-operations",
    "network",
    "backpressure",
    "flow-control",
    "streaming",
  ],
  difficulty: "intermediate",
};
