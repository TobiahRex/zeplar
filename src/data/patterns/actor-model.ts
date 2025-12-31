import type { Pattern } from "../schema";

export const actorModel: Pattern = {
  id: "actor-model",
  slug: "actor-model",
  corpusPath:
    "⚡ PERFORMANCE → 🔀 Work Distribution → ⚡ Parallelism → 📨 Actor Model",

  hierarchy: {
    quality: "performance",
    strategy: "Work Distribution",
    family: "Parallelism",
    level: 4,
  },

  concept: {
    name: "Actor Model",
    emoji: "📨",
    tagline: "Message-passing concurrency",
    definition:
      "The Actor Model is a mathematical model of concurrent computation where independent 'actors' are the universal primitives of concurrent computation. Each actor is an autonomous entity that communicates exclusively through asynchronous message passing, never sharing state directly. Think of actors like people in an organization: each person has their own desk (private state), receives messages in their inbox (mailbox), and can send messages to others, create new team members (spawn actors), or decide how to handle the next message. This eliminates the need for locks, mutexes, and other synchronization primitives that plague traditional shared-memory concurrency.",
    problemSolved:
      "The Actor Model solves the fundamental challenges of concurrent and distributed programming: race conditions, deadlocks, and the complexity of shared mutable state. Traditional threading models require developers to carefully coordinate access to shared memory using locks, which is error-prone and doesn't scale well. The Actor Model eliminates these issues by enforcing message isolation—actors never share state, only send immutable messages. This makes concurrent systems easier to reason about, naturally distributed (actors can run on different machines), and resilient to failures (supervisor actors can restart failed child actors without affecting the whole system).",
    tradeoffs: {
      pros: [
        "No shared state eliminates race conditions and deadlock potential",
        "Natural distribution - actors can run locally or across network boundaries transparently",
        "Built-in fault tolerance through supervision hierarchies",
        "Location transparency - caller doesn't need to know where actor is running",
        "Easier to reason about - each actor processes one message at a time sequentially",
      ],
      cons: [
        "Message overhead can impact performance for fine-grained operations",
        "Debugging is harder - no call stack, only message traces",
        "Potential for mailbox overflow if actor can't keep up with messages",
        "Learning curve - requires thinking differently about concurrency",
        "Message ordering guarantees vary by implementation (eventual consistency)",
      ],
    },
    relatedPatterns: [
      "worker-pools",
      "async-await",
      "fork-join",
      "message-queue",
      "event-sourcing",
    ],
  },

  structure: {
    participants: [
      {
        name: "Actor",
        role: "Computational entity",
        responsibilities: [
          "Maintain private state that no other actor can access directly",
          "Process messages from mailbox one at a time sequentially",
          "Send messages to other actors (address-based communication)",
          "Create (spawn) new actors dynamically",
          "Decide behavior for next message (become pattern)",
        ],
      },
      {
        name: "Mailbox",
        role: "Message queue",
        responsibilities: [
          "Buffer incoming messages in FIFO order",
          "Provide message to actor when ready to process",
          "Handle backpressure if messages arrive faster than processing",
        ],
      },
      {
        name: "Supervisor",
        role: "Failure management",
        responsibilities: [
          "Monitor child actors for failures",
          "Decide restart strategy (one-for-one, all-for-one)",
          "Maintain supervision hierarchy",
        ],
      },
      {
        name: "Actor System",
        role: "Runtime environment",
        responsibilities: [
          "Manage actor lifecycle (creation, scheduling, termination)",
          "Route messages between actors",
          "Provide location transparency",
          "Handle actor failures according to supervision strategy",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant C as Client
    participant A1 as Actor 1
    participant M as Mailbox
    participant A2 as Actor 2

    C->>A1: Send Message
    A1->>M: Queue Message
    M->>A1: Dequeue Next
    A1->>A1: Process (update state)
    A1->>A2: Send Message
    A2->>M: Queue Message
    Note over A1: Each actor processes<br/>messages sequentially`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Send Message",
        description:
          "Client sends an immutable message to target actor's address",
      },
      {
        step: 2,
        actor: "Actor System",
        action: "Route Message",
        description: "Runtime routes message to actor's mailbox",
      },
      {
        step: 3,
        actor: "Mailbox",
        action: "Enqueue",
        description: "Message is added to mailbox queue (FIFO)",
      },
      {
        step: 4,
        actor: "Actor",
        action: "Dequeue Message",
        description: "Actor takes next message from mailbox when ready",
      },
      {
        step: 5,
        actor: "Actor",
        action: "Process Message",
        description:
          "Actor executes message handler, may update private state, send messages, or spawn actors",
      },
      {
        step: 6,
        actor: "Actor",
        action: "Decide Behavior",
        description:
          "Actor optionally changes behavior for next message (become pattern)",
      },
      {
        step: 7,
        actor: "Actor",
        action: "Return to Step 4",
        description: "Actor processes next message from mailbox",
      },
    ],
    invariants: [
      "Actors never share state - all communication via messages",
      "Messages are immutable and delivered at-most-once (or exactly-once with guarantees)",
      "Each actor processes one message at a time (no concurrent execution within actor)",
      "Actor addresses are unique and location-transparent",
      "Mailbox ordering typically FIFO per sender",
      "Failed actors don't break parent - supervision handles recovery",
    ],
  },

  codeExamples: [
    {
      id: "actor-model-ts-basic",
      language: "typescript",
      title: "Basic Actor System Implementation",
      description:
        "A minimal actor system demonstrating message passing, mailboxes, and state isolation. Shows how actors process messages sequentially while maintaining encapsulated state.",
      code: `type Message = { type: string; payload: any };
type ActorRef = { id: string; send: (msg: Message) => void };

class Actor {
  private state: any = {};
  private mailbox: Message[] = [];
  private processing = false;

  constructor(
    public id: string,
    private messageHandler: (state: any, msg: Message, context: ActorContext) => any
  ) {}

  send(message: Message): void {
    this.mailbox.push(message);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.mailbox.length === 0) return;

    this.processing = true;
    const message = this.mailbox.shift()!;

    try {
      const context = {
        self: this.getRef(),
        spawn: (id: string, handler: any) => actorSystem.spawn(id, handler),
        send: (target: ActorRef, msg: Message) => target.send(msg)
      };

      this.state = await this.messageHandler(this.state, message, context);
    } catch (error) {
      console.error(\`Actor \${this.id} failed:\`, error);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }

  getRef(): ActorRef {
    return { id: this.id, send: (msg) => this.send(msg) };
  }
}

// Usage Example: Counter Actor
const counterActor = new Actor("counter", (state = { count: 0 }, msg, ctx) => {
  switch (msg.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "GET":
      console.log("Count:", state.count);
      return state;
    default:
      return state;
  }
});

counterActor.send({ type: "INCREMENT", payload: null });
counterActor.send({ type: "INCREMENT", payload: null });
counterActor.send({ type: "GET", payload: null });`,
      contextDilation: {
        level: "module",
        scope:
          "Basic actor system - single-threaded simulation showing core concepts",
        prerequisites: ["TypeScript basics", "async/await", "closures"],
        systemPosition:
          "Foundation layer - would be part of actor runtime in production systems like Akka or Orleans",
      },
      annotations: [
        {
          id: "mailbox-queue",
          lines: [7, 7],
          action: "Mailbox stores incoming messages as a queue",
          reason:
            "Messages must be buffered because actors process one at a time. Queue ensures ordering and decouples sender from receiver timing.",
          contextLevel: "local",
          relatedConcepts: ["message-queue", "backpressure"],
        },
        {
          id: "state-encapsulation",
          lines: [6, 6],
          action: "Private state object accessible only to this actor",
          reason:
            "State encapsulation is the foundation of actor model - eliminates race conditions by preventing concurrent access to shared state.",
          contextLevel: "module",
          relatedConcepts: ["data-hiding", "immutability"],
        },
        {
          id: "sequential-processing",
          lines: [8, 8],
          action:
            "Processing flag ensures only one message is handled at a time",
          reason:
            "Even though messages arrive asynchronously, actor processes them sequentially. This makes actor code simple - no locks needed!",
          contextLevel: "local",
          relatedConcepts: ["mutual-exclusion", "serialization"],
        },
        {
          id: "message-handler",
          lines: [27, 32],
          action:
            "Message handler receives current state and returns new state",
          reason:
            "Pure function pattern (state in, state out) makes testing easy and enables hot code reload. State updates are explicit and traceable.",
          contextLevel: "module",
          relatedConcepts: ["pure-functions", "immutability"],
        },
        {
          id: "actor-context",
          lines: [25, 29],
          action: "Context provides self-reference and system capabilities",
          reason:
            "Actors need to spawn children, send to self, or interact with system. Context is the controlled interface for these capabilities.",
          contextLevel: "system",
          relatedConcepts: ["dependency-injection", "capability-security"],
        },
      ],
      highlights: [
        {
          lines: [6, 8],
          label: "Actor State (Structure)",
          sbvpDomain: "structure",
        },
        {
          lines: [18, 23],
          label: "Message Processing Flow (Behavior)",
          sbvpDomain: "behavior",
        },
        {
          lines: [47, 55],
          label: "Counter Example (Visualization)",
          sbvpDomain: "visualization",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Backend services requiring high concurrency (web servers, chat systems, game servers)",
      "Distributed systems where location transparency is valuable (microservices, cluster computing)",
      "Fault-tolerant systems needing supervision and restart capabilities",
      "Event-driven architectures processing streams of messages",
    ],
    interactsWith: [
      "message-queue",
      "event-sourcing",
      "saga-pattern",
      "cqrs",
      "service-mesh",
    ],
    architecturalBoundaries: [
      "Not ideal for fine-grained compute-intensive tasks due to message overhead",
      "Works within service boundaries or across distributed nodes",
      "Natural fit for domain-driven design with aggregate actors",
    ],
  },

  implementations: [
    {
      id: "akka",
      name: "Akka (Scala/Java)",
      type: "framework",
      languages: ["java"],
      description:
        "Battle-tested actor framework for JVM. Provides clustering, persistence, streams, and more. Used by LinkedIn, PayPal, Walmart.",
      links: {
        docs: "https://akka.io/docs/",
        github: "https://github.com/akka/akka",
      },
      codeSnippet: `import akka.actor.*;

class CounterActor extends AbstractActor {
  private int count = 0;

  @Override
  public Receive createReceive() {
    return receiveBuilder()
      .matchEquals("increment", m -> count++)
      .matchEquals("get", m -> getSender().tell(count, getSelf()))
      .build();
  }
}`,
    },
    {
      id: "orleans",
      name: "Orleans (.NET)",
      type: "framework",
      languages: ["typescript"],
      description:
        "Virtual actor framework from Microsoft. Automatic activation/deactivation, distributed by default. Powers Halo, Gears of War.",
      links: {
        docs: "https://learn.microsoft.com/en-us/dotnet/orleans/",
        github: "https://github.com/dotnet/orleans",
      },
    },
    {
      id: "erlang-otp",
      name: "Erlang/OTP",
      type: "platform",
      languages: ["rust"],
      description:
        "Original actor platform. Erlang processes ARE actors. Extreme fault tolerance via supervision trees. Powers WhatsApp, RabbitMQ.",
      links: {
        docs: "https://www.erlang.org/docs",
        github: "https://github.com/erlang/otp",
      },
    },
    {
      id: "actix",
      name: "Actix (Rust)",
      type: "framework",
      languages: ["rust"],
      description:
        "High-performance actor framework for Rust. Type-safe messages, async/await support.",
      links: {
        docs: "https://actix.rs/docs/",
        github: "https://github.com/actix/actix",
      },
    },
    {
      id: "proto-actor",
      name: "Proto.Actor",
      type: "framework",
      languages: ["go", "typescript"],
      description:
        "Cross-platform actor framework (Go, C#, Kotlin, TypeScript). Virtual actors, clustering, persistence.",
      links: {
        docs: "https://proto.actor/",
        github: "https://github.com/asynkron/protoactor-go",
      },
    },
  ],

  usedInSystems: [
    {
      systemId: "whatsapp-messaging",
      systemName: "WhatsApp Message Routing",
      howUsed:
        "WhatsApp uses Erlang actors to handle billions of messages daily. Each chat session is an actor process, providing natural isolation and fault tolerance. Actors manage user connections, message routing, and delivery guarantees. The supervision hierarchy ensures failed connections don't crash the whole system.",
      source: "https://www.erlang.org/blog/20-years-of-open-source-erlang/",
    },
    {
      systemId: "discord-guild-system",
      systemName: "Discord Guild (Server) Management",
      howUsed:
        "Discord uses Elixir (Erlang-based) actors to manage millions of concurrent guild instances. Each guild is an actor maintaining state for channels, members, and permissions. Actors provide natural sharding - guilds distribute across nodes. Hot code reload lets them deploy without downtime.",
      source:
        "https://discord.com/blog/how-discord-stores-billions-of-messages",
    },
    {
      systemId: "microsoft-halo",
      systemName: "Halo 4/5 Game Services",
      howUsed:
        "Microsoft Orleans powers Halo's backend services. Each game session, player profile, and matchmaking queue is a virtual actor. Orleans provides automatic activation (actors spawn on-demand) and location transparency (clients don't know which server hosts the actor).",
      source:
        "https://www.microsoft.com/en-us/research/project/orleans-virtual-actors/",
    },
  ],
};
