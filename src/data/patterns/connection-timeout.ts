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
      "A timeout specifically for the connection establishment phase, limiting how long a client will wait to establish a network connection before giving up.",
    problemSolved:
      "When connecting to unresponsive or overloaded servers, clients can hang indefinitely during connection establishment. Connection timeouts prevent resource exhaustion by bounding wait time.",
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
    },
  ],
};
