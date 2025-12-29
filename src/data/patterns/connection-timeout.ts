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
        scope: "local",
        systemPosition:
          "Connection timeout sits at the lowest level of network I/O, wrapping socket connection establishment. It's configured in HTTP clients, database drivers, and TCP socket libraries before any application-level protocol logic executes.",
        zoomLevels: [
          "Micro: AbortController.abort() or setTimeout triggering connection cancellation",
          "Local: Race between connection promise and timeout promise",
          "Module: Reusable connection wrapper with configurable timeout",
          "System: Infrastructure-wide timeout policies in service mesh or API gateway",
        ],
        prerequisites: [
          "Understanding of TCP three-way handshake (SYN, SYN-ACK, ACK)",
          "Knowledge of Promise.race() or AbortController for cancellation",
          "Familiarity with the difference between connection, read, and request timeouts",
        ],
      },
      annotations: [
        {
          id: "connection-timeout-abort-signal",
          lines: [11, 12, 18, 19],
          action:
            "Create AbortController to enable cancelling in-flight connection attempt",
          reason:
            "AbortController provides the mechanism to cancel fetch() requests mid-flight. When timeout fires, abort() sends cancellation signal to the fetch API, which stops the TCP handshake and throws an AbortError. Without this, setTimeout alone would fire but the connection attempt would continue, wasting resources. The controller couples timeout logic to connection lifecycle—critical for actually releasing resources on timeout.",
          contextLevel: "local",
          relatedConcepts: ["abort-controller", "promise-cancellation"],
        },
        {
          id: "connection-timeout-cleanup",
          lines: [21, 24],
          action:
            "Clear timeout in both success and error paths to prevent memory leaks",
          reason:
            "Dangling setTimeout callbacks leak memory if not cleared. If connection succeeds before timeout, the timeout must be cancelled—otherwise it fires unnecessarily and attempts to abort an already-completed connection. If connection fails for non-timeout reasons (DNS error, network unreachable), we also clear the timeout to avoid double error reporting. Cleanup discipline is essential in timeout patterns.",
          contextLevel: "local",
          relatedConcepts: ["resource-cleanup", "timer-management"],
        },
        {
          id: "connection-timeout-error-differentiation",
          lines: [26, 30],
          action: "Distinguish timeout errors from other connection failures",
          reason:
            "Different error types warrant different handling strategies. Timeout errors suggest the server is unreachable or overloaded—retry with exponential backoff or failover to replica makes sense. DNS errors or network unreachable errors indicate different problems requiring different responses. Checking error.name === 'AbortError' specifically identifies timeout vs other fetch failures, enabling nuanced error handling and clearer logging/monitoring.",
          contextLevel: "module",
          relatedConcepts: ["error-classification", "failure-handling"],
        },
      ],
      highlights: [
        {
          id: "connection-timeout-race-condition",
          lines: [15, 19],
          domain: "behavior",
          title: "Race Between Connection and Timeout",
          explanation:
            "The pattern creates a race: connection establishment races against timeout timer. Whichever completes first wins—successful connection returns response and clears timeout; timeout fires and aborts connection. This race structure is the essence of timeout patterns: we're betting the operation completes before the deadline, but enforcing consequences if it doesn't.",
        },
        {
          id: "connection-timeout-tcp-specific",
          lines: [38, 45],
          domain: "structure",
          title: "TCP Socket Connection Timeout",
          explanation:
            "Node.js Socket API provides lower-level control over TCP connection timeout compared to fetch. The timeout applies specifically to socket.connect()—the TCP handshake phase. This granular control is essential for database connections, custom TCP protocols, or scenarios where HTTP-level timeouts are insufficient. Socket-level timeout gives precise control over the connection establishment phase.",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement:
      "Connection timeouts are configured at the lowest level of client libraries: HTTP client creation (axios.create, fetch wrappers), database connection strings or pool configuration, gRPC channel creation, and WebSocket initialization. They belong in infrastructure setup code, not business logic, and should be set once during application bootstrap based on network latency characteristics and SLAs.",
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
};
