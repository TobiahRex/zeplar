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
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
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
};
