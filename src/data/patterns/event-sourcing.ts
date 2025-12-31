import type { Pattern } from "../schema";

export const eventSourcing: Pattern = {
  id: "event-sourcing",
  slug: "event-sourcing",
  corpusPath: "🏗️ ARCHITECTURE → 💾 Data Patterns → 📜 Event Sourcing",

  hierarchy: {
    quality: "consistency",
    strategy: "Data Patterns",
    family: "State Management",
    level: 4,
  },

  concept: {
    name: "Event Sourcing",
    emoji: "📜",
    tagline: "Store state changes as immutable sequence of events",
    definition:
      "Event Sourcing is a data persistence pattern where instead of storing the current state of an entity, the system stores the complete sequence of state-changing events that occurred over the entity's lifetime. The current state is derived by replaying all events from the beginning. Each event is an immutable, append-only fact describing something that happened in the past (OrderPlaced, PaymentProcessed, OrderShipped). Events are stored in an event store—a specialized append-only database optimized for sequential writes and event replay. To reconstruct current state, the system loads all events for an entity and applies them sequentially, building up state through event handlers. This provides a complete audit trail (every state change is recorded), enables temporal queries (what was the state at any point in time?), supports event replay (reprocess events to fix bugs or build new projections), and facilitates event-driven architectures (events can be published to subscribers). Event sourcing separates write model (append events) from read model (materialized projections), often combined with CQRS. The pattern excels in domains requiring full auditability (finance, healthcare), temporal reasoning (what changed and when?), or complex business workflows where understanding the history is crucial.",
    problemSolved:
      "Traditional CRUD (Create, Read, Update, Delete) databases face several limitations: State overwrites lose history—you know the current balance but not how it got there. Audit trails are bolted-on afterthoughts, prone to data loss or tampering. Temporal queries are impossible—you can't answer 'What was account X's balance on December 1st at 3pm?' without complex, error-prone audit tables. Debugging production issues is difficult without knowing the sequence of operations that led to the current state. Complex business rules involving time-based logic (undo, cancellation, refunds) are hard to implement correctly. Concurrent updates create lost update problems or require complex locking. Event sourcing solves these problems by making events the source of truth. Every state change is captured as an event, providing automatic, unforgeable audit trail. Temporal queries are natural: replay events up to timestamp T. Debugging is simplified: examine the event sequence to understand what happened. Complex business logic becomes event handling: OrderCancelled event triggers RefundProcessed event. Concurrency is managed through optimistic concurrency control on event sequence numbers. Events enable event-driven integration: publish events to other systems without coupling. The complete history enables powerful analytics and machine learning on how state evolved over time.",
    tradeoffs: {
      pros: [
        "Complete audit trail: Every state change recorded immutably",
        "Temporal queries: Reconstruct state at any point in time",
        "Event replay: Reprocess events to fix bugs or build new views",
        "Event-driven integration: Publish domain events to subscribers",
        "Debug friendly: Event log reveals exactly what happened",
      ],
      cons: [
        "Query complexity: Current state requires event replay or projections",
        "Event schema evolution: Changing event structure impacts historical data",
        "Storage overhead: Events accumulate indefinitely (snapshotting helps)",
        "Eventual consistency: Projections lag behind event stream",
        "Learning curve: Different mental model than traditional CRUD",
      ],
    },
    relatedPatterns: [
      "cqrs",
      "event-driven-architecture",
      "domain-driven-design",
      "saga",
      "message-queue",
    ],
  },

  structure: {
    participants: [
      {
        name: "Command Handler",
        role: "Event Generator",
        responsibilities: [
          "Validate commands against business rules",
          "Load event history for aggregate",
          "Generate new events representing state changes",
        ],
      },
      {
        name: "Event Store",
        role: "Append-Only Event Log",
        responsibilities: [
          "Persist events in append-only, immutable log",
          "Provide event streams by aggregate ID",
          "Guarantee event ordering within aggregate",
          "Support optimistic concurrency control",
        ],
      },
      {
        name: "Event",
        role: "State Change Record",
        responsibilities: [
          "Describe something that happened (past tense)",
          "Include all data needed to apply state change",
          "Be immutable once persisted",
        ],
      },
      {
        name: "Projection",
        role: "Read Model Builder",
        responsibilities: [
          "Subscribe to event stream",
          "Build optimized read models from events",
          "Handle event schema evolution",
        ],
      },
      {
        name: "Snapshot",
        role: "Performance Optimization",
        responsibilities: [
          "Store aggregate state at point in time",
          "Enable fast state reconstruction",
          "Reduce event replay overhead",
        ],
      },
    ],
    diagram: `flowchart TB
    subgraph Commands
        C1[Create Account] --> CH[Command Handler]
        C2[Deposit Money] --> CH
        C3[Withdraw Money] --> CH
    end

    subgraph Event Store
        CH -->|AccountCreated| ES[(Event Store)]
        CH -->|MoneyDeposited| ES
        CH -->|MoneyWithdrawn| ES
    end

    subgraph Event Stream
        ES --> E1[AccountCreated<br/>balance: 0]
        ES --> E2[MoneyDeposited<br/>amount: 100]
        ES --> E3[MoneyWithdrawn<br/>amount: 30]
    end

    subgraph Projections
        E1 --> P1[Account Balance View]
        E2 --> P1
        E3 --> P1
        E1 --> P2[Transaction History]
        E2 --> P2
        E3 --> P2
    end

    subgraph Current State
        P1 --> State[Balance: 70]
    end

    style ES fill:#d4edda
    style State fill:#fff3cd`,
    flow: [
      {
        step: 1,
        actor: "Command Handler",
        action: "Receive Command",
        description: "Application submits command (e.g., WithdrawMoney)",
      },
      {
        step: 2,
        actor: "Command Handler",
        action: "Load Events",
        description: "Load event history for aggregate from event store",
      },
      {
        step: 3,
        actor: "Command Handler",
        action: "Replay Events",
        description: "Apply events sequentially to reconstruct current state",
      },
      {
        step: 4,
        actor: "Command Handler",
        action: "Validate Command",
        description:
          "Check business rules (e.g., sufficient balance for withdrawal)",
      },
      {
        step: 5,
        actor: "Command Handler",
        action: "Generate Event",
        description:
          "Create new event describing state change (MoneyWithdrawn)",
      },
      {
        step: 6,
        actor: "Event Store",
        action: "Persist Event",
        description: "Append event to log with optimistic concurrency check",
      },
      {
        step: 7,
        actor: "Projection",
        action: "Update Read Model",
        description: "Asynchronously update projections from published events",
      },
    ],
    invariants: [
      "Events are immutable once persisted",
      "Event order within aggregate is guaranteed",
      "Current state is derived by replaying events",
      "Snapshots are optimization, not source of truth",
      "Event schema changes must be backward compatible",
    ],
  },

  codeExamples: [
    {
      id: "event-sourcing-bank-account",
      language: "typescript",
      title: "Event Sourced Bank Account with Snapshots",
      description:
        "Complete event sourcing implementation with snapshots for performance",
      code: `// Events
interface Event {
  aggregateId: string;
  version: number;
  timestamp: Date;
}

interface AccountCreated extends Event {
  type: 'AccountCreated';
  initialBalance: number;
}

interface MoneyDeposited extends Event {
  type: 'MoneyDeposited';
  amount: number;
}

interface MoneyWithdrawn extends Event {
  type: 'MoneyWithdrawn';
  amount: number;
}

type AccountEvent = AccountCreated | MoneyDeposited | MoneyWithdrawn;

// Aggregate
class BankAccount {
  private id: string;
  private balance: number = 0;
  private version: number = 0;
  private uncommittedEvents: AccountEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  // Command: Create account
  static create(id: string, initialBalance: number): BankAccount {
    const account = new BankAccount(id);
    account.applyEvent({
      type: 'AccountCreated',
      aggregateId: id,
      version: 1,
      timestamp: new Date(),
      initialBalance,
    });
    return account;
  }

  // Command: Deposit money
  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');

    this.applyEvent({
      type: 'MoneyDeposited',
      aggregateId: this.id,
      version: this.version + 1,
      timestamp: new Date(),
      amount,
    });
  }

  // Command: Withdraw money
  withdraw(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.balance < amount) throw new Error('Insufficient funds');

    this.applyEvent({
      type: 'MoneyWithdrawn',
      aggregateId: this.id,
      version: this.version + 1,
      timestamp: new Date(),
      amount,
    });
  }

  // Apply event to state
  private applyEvent(event: AccountEvent): void {
    switch (event.type) {
      case 'AccountCreated':
        this.balance = event.initialBalance;
        break;
      case 'MoneyDeposited':
        this.balance += event.amount;
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.amount;
        break;
    }
    this.version = event.version;
    this.uncommittedEvents.push(event);
  }

  // Replay events to reconstruct state
  static fromEvents(id: string, events: AccountEvent[]): BankAccount {
    const account = new BankAccount(id);
    events.forEach(event => account.replayEvent(event));
    return account;
  }

  private replayEvent(event: AccountEvent): void {
    switch (event.type) {
      case 'AccountCreated':
        this.balance = event.initialBalance;
        break;
      case 'MoneyDeposited':
        this.balance += event.amount;
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.amount;
        break;
    }
    this.version = event.version;
  }

  getUncommittedEvents(): AccountEvent[] {
    return this.uncommittedEvents;
  }

  markEventsCommitted(): void {
    this.uncommittedEvents = [];
  }

  getBalance(): number {
    return this.balance;
  }

  getVersion(): number {
    return this.version;
  }
}

// Event Store
interface Snapshot {
  aggregateId: string;
  version: number;
  state: { balance: number };
  timestamp: Date;
}

class EventStore {
  private events: Map<string, AccountEvent[]> = new Map();
  private snapshots: Map<string, Snapshot> = new Map();
  private readonly SNAPSHOT_INTERVAL = 10;

  async save(aggregateId: string, events: AccountEvent[], expectedVersion: number): Promise<void> {
    const existingEvents = this.events.get(aggregateId) || [];

    // Optimistic concurrency check
    if (existingEvents.length !== expectedVersion) {
      throw new Error(\`Concurrency conflict: expected version \${expectedVersion}, actual \${existingEvents.length}\`);
    }

    // Append events
    this.events.set(aggregateId, [...existingEvents, ...events]);

    // Create snapshot if threshold reached
    const totalEvents = existingEvents.length + events.length;
    if (totalEvents % this.SNAPSHOT_INTERVAL === 0) {
      await this.createSnapshot(aggregateId);
    }
  }

  async load(aggregateId: string): Promise<AccountEvent[]> {
    // Try to load from snapshot
    const snapshot = this.snapshots.get(aggregateId);
    const allEvents = this.events.get(aggregateId) || [];

    if (snapshot) {
      // Return events after snapshot
      return allEvents.filter(e => e.version > snapshot.version);
    }

    return allEvents;
  }

  private async createSnapshot(aggregateId: string): Promise<void> {
    const events = this.events.get(aggregateId) || [];
    const account = BankAccount.fromEvents(aggregateId, events);

    this.snapshots.set(aggregateId, {
      aggregateId,
      version: account.getVersion(),
      state: { balance: account.getBalance() },
      timestamp: new Date(),
    });

    console.log(\`Snapshot created for \${aggregateId} at version \${account.getVersion()}\`);
  }

  async loadFromSnapshot(aggregateId: string): Promise<BankAccount | null> {
    const snapshot = this.snapshots.get(aggregateId);
    if (!snapshot) return null;

    const account = new BankAccount(aggregateId);
    // Restore from snapshot
    const events = await this.load(aggregateId);
    return BankAccount.fromEvents(aggregateId, events);
  }
}

// Usage
const eventStore = new EventStore();

// Create account
const account = BankAccount.create('acc-123', 100);
await eventStore.save('acc-123', account.getUncommittedEvents(), 0);
account.markEventsCommitted();

// Deposit money
account.deposit(50);
await eventStore.save('acc-123', account.getUncommittedEvents(), 1);

// Withdraw money
account.withdraw(30);
await eventStore.save('acc-123', account.getUncommittedEvents(), 2);

// Rebuild from events
const events = await eventStore.load('acc-123');
const rebuiltAccount = BankAccount.fromEvents('acc-123', events);
console.log(\`Balance: \${rebuiltAccount.getBalance()}\`); // 120`,
      runnable: true,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready event sourcing with snapshots, optimistic concurrency, and event replay",
        prerequisites: [
          "Domain-Driven Design",
          "CQRS",
          "Event-driven architecture",
        ],
        systemPosition: "Core banking domain in financial services application",
      },
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Financial transactions",
      "Order processing",
      "Inventory management",
      "Healthcare records",
      "Audit-heavy domains",
    ],
    interactsWith: [
      "cqrs",
      "message-queue",
      "projections",
      "distributed-tracing",
    ],
    architecturalBoundaries: [
      "Aggregate boundaries (consistency)",
      "Event store (append-only writes)",
      "Projection store (read models)",
      "Event publishers (integration)",
    ],
  },

  // L5: Technology Mapping
  implementations: [
    {
      id: "eventstoredb",
      name: "EventStoreDB",
      type: "platform",
      languages: ["java", "csharp", "typescript", "go", "python"],
      description:
        "Purpose-built event store database created by Greg Young (event sourcing pioneer). Optimized for append-only event streams with projections, persistent subscriptions, competing consumers. Supports stream-level concurrency control, built-in projections (JavaScript), clustering for HA.",
      links: {
        docs: "https://www.eventstore.com/eventstoredb",
        github: "https://github.com/EventStore/EventStore",
      },
      codeSnippet: `import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';
const client = EventStoreDBClient.connectionString('esdb://localhost:2113');
const event = jsonEvent({
  type: 'MoneyDeposited',
  data: { amount: 100, accountId: 'acc-123' }
});
await client.appendToStream('account-acc-123', event);`,
    },
    {
      id: "axon-framework",
      name: "Axon Framework",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Comprehensive Java framework for CQRS and Event Sourcing. Includes Axon Server (dedicated event store and message routing). Automatic aggregate lifecycle, event upcasting, sagas for long-running processes, snapshot support. Production-ready with Spring Boot integration.",
      links: {
        docs: "https://docs.axoniq.io/",
        github: "https://github.com/AxonFramework/AxonFramework",
      },
      codeSnippet: `@Aggregate
public class BankAccount {
  @AggregateIdentifier private String accountId;
  private double balance;

  @CommandHandler
  public BankAccount(CreateAccountCommand cmd) {
    apply(new AccountCreatedEvent(cmd.getAccountId(), cmd.getInitialBalance()));
  }

  @EventSourcingHandler
  public void on(AccountCreatedEvent evt) {
    this.accountId = evt.getAccountId();
    this.balance = evt.getInitialBalance();
  }
}`,
    },
    {
      id: "marten",
      name: "Marten",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET library using PostgreSQL as event store. Leverages PostgreSQL JSONB for event storage, built-in projections, stream aggregation. Async daemon for projection updates. Best for .NET teams wanting event sourcing without separate database.",
      links: {
        docs: "https://martendb.io/events/",
        github: "https://github.com/JasperFx/marten",
      },
      codeSnippet: `var store = DocumentStore.For(opts => {
  opts.Connection("connection-string");
  opts.Events.AddEventType<MoneyDeposited>();
});

await using var session = store.LightweightSession();
session.Events.Append("account-123", new MoneyDeposited(100));
await session.SaveChangesAsync();`,
    },
    {
      id: "eventuate",
      name: "Eventuate",
      type: "framework",
      languages: ["java", "scala"],
      description:
        "Event sourcing and CQRS framework supporting microservices. Eventuate Local (Apache Kafka-based) and Eventuate SaaS. Includes sagas for orchestrating distributed transactions, event-driven microservices patterns. Used for Spring/Micronaut/Quarkus.",
      links: {
        docs: "https://eventuate.io/docs/",
        github: "https://github.com/eventuate-local/eventuate-local",
      },
    },
    {
      id: "kafka-event-sourcing",
      name: "Apache Kafka (as Event Store)",
      type: "platform",
      languages: ["java", "python", "typescript", "go"],
      description:
        "Kafka topics as event logs. Compacted topics for snapshots, partitioning for aggregate isolation, offset tracking for replay. Scalable to billions of events. Requires custom implementation for projections and queries. Best for high-throughput event streaming.",
      links: {
        docs: "https://kafka.apache.org/documentation/",
        github: "https://github.com/apache/kafka",
      },
      codeSnippet: `const producer = kafka.producer();
await producer.send({
  topic: 'bank-account-events',
  messages: [{
    key: 'account-123',
    value: JSON.stringify({ type: 'MoneyDeposited', amount: 100 })
  }]
});`,
    },
    {
      id: "eventuous",
      name: "Eventuous",
      type: "library",
      languages: ["csharp"],
      description:
        "Lightweight .NET event sourcing library. Works with EventStoreDB and other stores. Focus on simplicity and functional programming. Supports command handling, aggregates, projections, subscriptions.",
      links: {
        docs: "https://eventuous.dev/",
        github: "https://github.com/Eventuous/eventuous",
      },
    },
    {
      id: "lagom",
      name: "Lagom",
      type: "framework",
      languages: ["java", "scala"],
      description:
        "Lightbend microservices framework with built-in event sourcing and CQRS. Akka-powered persistence, cluster sharding, read-side projections. Opinionated framework for reactive microservices.",
      links: {
        docs: "https://www.lagomframework.com/documentation/",
        github: "https://github.com/lagom/lagom",
      },
    },
    {
      id: "prooph",
      name: "Prooph",
      type: "library",
      languages: ["php"],
      description:
        "PHP event sourcing toolkit. Event store implementation, CQRS support, sagas, projections. Works with MySQL, PostgreSQL, MongoDB. Comprehensive ecosystem for event-driven PHP applications.",
      links: {
        docs: "https://docs.prooph.de/",
        github: "https://github.com/prooph/event-sourcing",
      },
    },
  ],

  // L6: System Composition
  usedInSystems: [
    {
      systemId: "fintech-event-sourcing",
      systemName: "FinTech Investment Platform - Transaction Portfolio Service",
      howUsed:
        "Investment platform implemented event sourcing only in Transaction-Portfolio Service due to strict compliance requirements for financial data. Service owns account balances, transaction history, and stock holdings using PostgreSQL for ACID compliance. Every transaction (buy, sell, deposit, withdrawal) stored as immutable event, providing unforgeable audit trail for regulatory compliance. Pattern composition: Event Sourcing + CQRS (separate read/write models) + PostgreSQL (event store + projections) + Hexagonal Architecture. Write model appends events (TradeExecuted, DividendReceived), read model materializes current portfolio balances in optimized tables. Rationale: Financial regulations require complete audit trail of all transactions. Event sourcing naturally provides this while enabling temporal queries like 'Portfolio value on December 31, 2023 for tax reporting.' Impact: Passed regulatory audits, enabled complex tax reporting, simplified trade reconciliation, built analytics on event stream.",
      source:
        "https://dev.to/lukasniessen/event-sourcing-cqrs-and-micro-services-real-fintech-example-from-my-consulting-career-1j9b",
    },
    {
      systemId: "bank-account-event-sourcing",
      systemName: "Banking Microservice - Account Service",
      howUsed:
        "Bank account domain microservice using event sourcing for transaction processing and balance management. Architecture: EventStoreDB for internal event storage/replay, Apache Pulsar for inter-service communication, PostgreSQL for projections, Spring Boot + Kotlin. Account service acts as gatekeeper for customer account activity, listening to upstream events (DepositInitiated) and validating credits while emitting AccountCredited events. Pattern composition: Event Sourcing + CQRS + Message Queue (Pulsar) + Projections. Events include AccountOpened, AccountCredited, AccountDebited, AccountClosed. Enables answering regulatory queries like 'Account X balance on Date Y at Time Z' by replaying events. Rationale: Banking requires immutable transaction history for compliance, audit, and dispute resolution. Event sourcing provides this inherently. Impact: Simplified compliance reporting, enabled complex queries on transaction history, improved debugging (replay events to reproduce issues), natural integration with event-driven architecture.",
      source:
        "https://medium.com/@allousas/exploring-event-sourcing-a-scalable-bank-account-19b9d55302e0",
    },
    {
      systemId: "ecommerce-order-management",
      systemName: "E-commerce Order Management with Event Sourcing",
      howUsed:
        "Order management system using event sourcing to track complete order lifecycle from creation to fulfillment. Events: OrderPlaced, PaymentAuthorized, PaymentCaptured, OrderShipped, OrderDelivered, OrderCancelled, RefundIssued. Each event immutably recorded with timestamp, user, and full context. Pattern composition: Event Sourcing + CQRS (order write model vs order query model) + Saga (multi-step order fulfillment) + Compensation (cancellations and refunds). Read models materialized for different views: customer order history (chronological), warehouse fulfillment queue (status-based), analytics (aggregate metrics). Snapshots created every 50 events to optimize replay performance. Rationale: E-commerce orders have complex state machines with cancellations, partial shipments, returns. Event sourcing makes these workflows explicit and auditable. Impact: Reduced customer service time (complete order history visible), enabled complex analytics (conversion funnels, abandonment analysis), simplified returns processing.",
      source: "https://microservices.io/patterns/data/event-sourcing.html",
    },
    {
      systemId: "healthcare-patient-records",
      systemName: "Healthcare Patient Record System",
      howUsed:
        "Electronic health record (EHR) system using event sourcing for patient medical history. Events: PatientRegistered, DiagnosisRecorded, MedicationPrescribed, LabResultReceived, TreatmentCompleted. HIPAA compliance requires complete audit trail of who accessed what data when—event sourcing provides this inherently. Pattern composition: Event Sourcing + Temporal Queries + Encryption at Rest + Access Control Events. Every read operation generates AuditLogAccessed event for compliance. Can reconstruct patient state at any historical point for medical legal cases. Snapshots for performance (patient records grow indefinitely). Rationale: Medical records must be immutable (cannot alter diagnosis after the fact), fully auditable (malpractice protection), and temporally queryable (patient condition at specific date). Impact: Simplified HIPAA compliance, enabled medical research on anonymized event streams, improved patient safety (complete medication history visible), streamlined legal discovery.",
      source:
        "https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing",
    },
  ],

  philosophy: {
    coreProblem:
      "Traditional databases store only current state, losing the history of how that state evolved. This makes audit trails afterthoughts, temporal queries impossible, and debugging production issues difficult without knowing the sequence of operations.",
    designPrinciple:
      "Make events the source of truth. Store every state change as an immutable event, derive current state by replaying events. This transforms the database from a 'place' (current state) to a 'narrative' (sequence of what happened).",
    historicalContext:
      "Event sourcing concepts originated in accounting (double-entry bookkeeping) and database logs (write-ahead logs, transaction logs). Martin Fowler documented the pattern in 2005. Greg Young popularized it with EventStoreDB (2010) and CQRS integration. Widely adopted in finance, e-commerce, and compliance-heavy domains.",
    alternativesRejected: [
      "CRUD with audit tables: Audit as afterthought, easy to lose data, hard to query history",
      "Change Data Capture: Captures DB changes, not business events; tightly coupled to DB schema",
      "Immutable ledger databases: Store all versions but don't model domain events explicitly",
    ],
    mentalModel:
      "Like a bank statement: you don't store just your current balance ($1,247.32). You store every transaction (deposits, withdrawals) and derive the balance by summing them. This lets you answer 'What was my balance on June 15?' and 'Why did my balance change?'",
  },

  visualization: {
    staticDiagram: `flowchart TB
    subgraph Commands
        C1[Deposit $100] --> A[Bank Account]
        C2[Withdraw $30] --> A
    end

    subgraph Event Store
        A -->|Event 1| E1[AccountCreated<br/>balance: 0]
        A -->|Event 2| E2[MoneyDeposited<br/>amount: 100]
        A -->|Event 3| E3[MoneyWithdrawn<br/>amount: 30]
    end

    subgraph Replay
        E1 --> R[Replay Events]
        E2 --> R
        E3 --> R
        R --> State[Current State<br/>Balance: 70]
    end

    subgraph Projections
        E2 --> P1[Account Balance View]
        E3 --> P1
        E2 --> P2[Transaction History]
        E3 --> P2
    end

    style E1 fill:#d4edda
    style E2 fill:#d4edda
    style E3 fill:#d4edda
    style State fill:#fff3cd`,
    realWorldAnalogy:
      "Like Git version control for data: instead of overwriting files, Git stores every commit (change). You can checkout any historical version, see what changed and when, and understand how the codebase evolved. Event sourcing is Git for your domain model.",
    useCases: [
      {
        domain: "Finance",
        scenario:
          "Trading platform must show complete trade history, calculate cost basis for taxes, and provide audit trail for regulators. Event sourcing stores every trade as immutable event.",
        patternRole:
          "Provide unforgeable audit trail and enable temporal financial reporting",
        companies: ["Stripe", "Robinhood", "Interactive Brokers"],
      },
      {
        domain: "E-commerce",
        scenario:
          "Order lifecycle involves many state changes (placed → paid → shipped → delivered → returned). Event sourcing captures complete order history for customer service and analytics.",
        patternRole:
          "Track complex order state machines with full auditability",
        companies: ["Amazon", "Shopify"],
      },
      {
        domain: "Healthcare",
        scenario:
          "Patient records must be immutable, fully auditable for HIPAA compliance, and support temporal queries for medical legal cases.",
        patternRole:
          "Ensure medical record integrity and compliance with regulations",
        companies: ["Epic Systems", "Cerner"],
      },
      {
        domain: "Gaming",
        scenario:
          "Multiplayer game needs to replay matches, detect cheating by analyzing event sequences, and restore game state from any point.",
        patternRole:
          "Enable game replay, cheat detection, and state restoration",
        companies: ["Riot Games", "Blizzard"],
      },
    ],
  },

  tags: [
    "event-driven",
    "audit",
    "compliance",
    "temporal-queries",
    "domain-driven-design",
  ],
  difficulty: "advanced",
};
