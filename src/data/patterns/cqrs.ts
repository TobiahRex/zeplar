import type { Pattern } from "../schema";

export const cqrs: Pattern = {
  id: "cqrs",
  slug: "cqrs",
  corpusPath: "🏗️ ARCHITECTURE → 📊 Data Patterns → ⚡ CQRS",

  hierarchy: {
    quality: "performance",
    strategy: "Data Patterns",
    family: "Read-Write Separation",
    level: 4,
  },

  concept: {
    name: "CQRS",
    emoji: "⚡",
    tagline:
      "Command Query Responsibility Segregation - separate reads from writes",
    definition:
      "CQRS (Command Query Responsibility Segregation) is an architectural pattern that separates read operations (queries) from write operations (commands) using different models, rather than a single unified model for both. Commands modify state (CreateOrder, UpdateInventory) and are validated against business rules; queries retrieve data (GetOrderById, SearchProducts) optimized for presentation. The write model (command side) focuses on business logic, validation, and state transitions, often using domain-driven design with aggregates. The read model (query side) is optimized for fast retrieval with denormalized views, often stored in different databases or caching layers. Separation enables independent scaling (read-heavy systems scale queries separately), technology diversity (write to PostgreSQL, read from Elasticsearch), and optimization (complex joins avoided through precomputed projections). In basic CQRS, both models share the same database but use different object representations. In advanced CQRS, models use separate databases with eventual consistency—writes publish events that asynchronously update read models. CQRS naturally pairs with event sourcing (commands produce events, queries consume projections) but works independently. The pattern excels in domains with vastly different read/write characteristics, complex business logic on writes, or need for multiple specialized read representations.",
    problemSolved:
      "Traditional CRUD architectures use a single model for both reads and writes, creating conflicts: Write operations require validation, business rules, transactions, and normalized data structures for integrity. Read operations need fast retrieval, denormalized data for joins, caching, and specialized indexes for queries. Trying to satisfy both with one model leads to compromises: ORMs become bloated with eager/lazy loading configurations, database schemas balance normalization vs query performance poorly, caching strategies conflict with transactional consistency, and scaling becomes difficult (can't scale reads without scaling writes). Performance suffers when complex read queries slow down write transactions. Development velocity degrades as the shared model grows complex, trying to serve all use cases. CQRS solves this by acknowledging that reads and writes have fundamentally different concerns and optimizing each independently. Write models focus on correctness, business invariants, and consistency. Read models focus on speed, denormalization, and presentation-specific views. This separation enables: independent scaling (add read replicas without touching write database), technology diversity (write to SQL, read from Elasticsearch for full-text search), simpler code (no 'god model' trying to serve all use cases), and better performance (each side optimized for its workload).",
    tradeoffs: {
      pros: [
        "Independent scaling: Scale reads and writes separately",
        "Performance: Optimize each side for its workload (writes for consistency, reads for speed)",
        "Technology diversity: Use best database for each concern",
        "Simpler models: Separate models easier to understand than unified god-model",
        "Security: Fine-grained permissions on commands vs queries",
      ],
      cons: [
        "Eventual consistency: Read models lag behind writes",
        "Complexity: Two models, synchronization logic, more code",
        "Learning curve: Developers must understand command/query separation",
        "Debugging: Harder to trace data flow through multiple models",
        "Over-engineering risk: Unnecessary for simple CRUD applications",
      ],
    },
    relatedPatterns: [
      "event-sourcing",
      "event-driven-architecture",
      "domain-driven-design",
      "materialized-view",
      "read-replicas",
    ],
  },

  structure: {
    participants: [
      {
        name: "Command",
        role: "Write Intent",
        responsibilities: [
          "Express user intent to change state (CreateOrder, CancelOrder)",
          "Include all data needed for validation",
          "Be imperative (do this) not interrogative (what is this)",
        ],
      },
      {
        name: "Command Handler",
        role: "Business Logic Executor",
        responsibilities: [
          "Validate commands against business rules",
          "Execute state changes on write model",
          "Publish events for read model synchronization",
        ],
      },
      {
        name: "Write Model",
        role: "Source of Truth",
        responsibilities: [
          "Enforce business invariants and constraints",
          "Persist state changes transactionally",
          "Emit domain events on state change",
        ],
      },
      {
        name: "Query",
        role: "Read Intent",
        responsibilities: [
          "Express data retrieval request (GetOrderById, SearchOrders)",
          "Specify filtering, sorting, pagination",
          "Return DTOs optimized for presentation",
        ],
      },
      {
        name: "Query Handler",
        role: "Data Retriever",
        responsibilities: [
          "Execute queries against read model",
          "Apply filtering and sorting",
          "Return denormalized data optimized for view",
        ],
      },
      {
        name: "Read Model",
        role: "Optimized Projections",
        responsibilities: [
          "Store denormalized views for fast queries",
          "Subscribe to events from write model",
          "Update projections asynchronously",
        ],
      },
    ],
    diagram: `flowchart TB
    subgraph Command Side - Write
        C1[Create Order Command] --> CH[Command Handler]
        CH --> WM[(Write Model<br/>SQL DB)]
        CH --> E[Domain Events]
    end

    subgraph Query Side - Read
        E -->|Event| Sync[Projection Builder]
        Sync --> RM1[(Order List View<br/>Elasticsearch)]
        Sync --> RM2[(Order Details View<br/>Redis Cache)]

        Q1[Get Order Query] --> QH[Query Handler]
        QH --> RM2
    end

    subgraph Client
        UI[User Interface] --> C1
        UI --> Q1
    end

    style WM fill:#fff3cd
    style RM1 fill:#d4edda
    style RM2 fill:#d4edda`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Submit Command",
        description: "User submits command (e.g., CreateOrderCommand)",
      },
      {
        step: 2,
        actor: "Command Handler",
        action: "Validate & Execute",
        description:
          "Validate business rules, execute logic, persist to write model",
      },
      {
        step: 3,
        actor: "Write Model",
        action: "Publish Event",
        description:
          "Write model publishes domain event (OrderCreated) after successful write",
      },
      {
        step: 4,
        actor: "Projection Builder",
        action: "Update Read Model",
        description: "Asynchronously update read models from event stream",
      },
      {
        step: 5,
        actor: "Client",
        action: "Submit Query",
        description: "User queries data (e.g., GetOrderByIdQuery)",
      },
      {
        step: 6,
        actor: "Query Handler",
        action: "Fetch from Read Model",
        description:
          "Query handler retrieves denormalized data from optimized read model",
      },
    ],
    invariants: [
      "Commands modify state, queries never do",
      "Write model is source of truth",
      "Read models are eventually consistent",
      "Commands should be task-based (PlaceOrder, not SetOrderStatus)",
      "Queries return DTOs, not domain entities",
    ],
  },

  codeExamples: [
    {
      id: "cqrs-mediatr",
      language: "typescript",
      title: "CQRS with MediatR-style Pattern",
      description:
        "Complete CQRS implementation with command/query handlers and event synchronization",
      code: `// Commands
interface Command {
  type: string;
}

interface CreateOrderCommand extends Command {
  type: 'CreateOrder';
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
}

interface CancelOrderCommand extends Command {
  type: 'CancelOrder';
  orderId: string;
}

// Queries
interface Query<TResult> {
  type: string;
}

interface GetOrderByIdQuery implements Query<OrderDetailDto> {
  type: 'GetOrderById';
  orderId: string;
}

interface SearchOrdersQuery implements Query<OrderListDto[]> {
  type: 'SearchOrders';
  userId?: string;
  status?: string;
  limit: number;
  offset: number;
}

// DTOs
interface OrderDetailDto {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: Array<{ productName: string; quantity: number; price: number }>;
  createdAt: Date;
}

interface OrderListDto {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
}

// Write Model (Domain Entity)
class Order {
  constructor(
    public id: string,
    public userId: string,
    public items: Array<{ productId: string; quantity: number; price: number }>,
    public status: 'pending' | 'confirmed' | 'cancelled' = 'pending'
  ) {}

  cancel(): void {
    if (this.status === 'cancelled') {
      throw new Error('Order already cancelled');
    }
    this.status = 'cancelled';
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

// Command Handlers
class CreateOrderCommandHandler {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<string> {
    // Validate business rules
    if (!command.items.length) {
      throw new Error('Order must have at least one item');
    }

    // Create domain entity
    const orderId = crypto.randomUUID();
    const order = new Order(orderId, command.userId, command.items as any);

    // Persist to write model (transactional)
    await this.orderRepository.save(order);

    // Publish domain event
    await this.eventBus.publish({
      type: 'OrderCreated',
      orderId,
      userId: command.userId,
      total: order.getTotal(),
      timestamp: new Date(),
    });

    return orderId;
  }
}

class CancelOrderCommandHandler {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async handle(command: CancelOrderCommand): Promise<void> {
    // Load from write model
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) throw new Error('Order not found');

    // Execute business logic
    order.cancel();

    // Persist changes
    await this.orderRepository.save(order);

    // Publish event
    await this.eventBus.publish({
      type: 'OrderCancelled',
      orderId: command.orderId,
      timestamp: new Date(),
    });
  }
}

// Query Handlers
class GetOrderByIdQueryHandler {
  constructor(private readDatabase: ReadDatabase) {}

  async handle(query: GetOrderByIdQuery): Promise<OrderDetailDto> {
    // Query optimized read model
    const result = await this.readDatabase.query(
      'SELECT * FROM order_details_view WHERE id = $1',
      [query.orderId]
    );

    if (!result.rows[0]) throw new Error('Order not found');
    return result.rows[0];
  }
}

class SearchOrdersQueryHandler {
  constructor(private readDatabase: ReadDatabase) {}

  async handle(query: SearchOrdersQuery): Promise<OrderListDto[]> {
    // Build dynamic query
    let sql = 'SELECT id, status, total, created_at FROM order_list_view WHERE 1=1';
    const params: any[] = [];

    if (query.userId) {
      params.push(query.userId);
      sql += \` AND user_id = $\${params.length}\`;
    }

    if (query.status) {
      params.push(query.status);
      sql += \` AND status = $\${params.length}\`;
    }

    sql += \` ORDER BY created_at DESC LIMIT $\${params.length + 1} OFFSET $\${params.length + 2}\`;
    params.push(query.limit, query.offset);

    const result = await this.readDatabase.query(sql, params);
    return result.rows;
  }
}

// Event Synchronization (Update Read Models)
class OrderProjectionBuilder {
  constructor(
    private readDatabase: ReadDatabase,
    private eventBus: EventBus
  ) {
    this.subscribe();
  }

  private subscribe(): void {
    this.eventBus.subscribe('OrderCreated', async (event: any) => {
      await this.readDatabase.query(
        'INSERT INTO order_list_view (id, user_id, status, total, created_at) VALUES ($1, $2, $3, $4, $5)',
        [event.orderId, event.userId, 'pending', event.total, event.timestamp]
      );

      await this.readDatabase.query(
        'INSERT INTO order_details_view (id, user_id, status, total, items, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [event.orderId, event.userId, 'pending', event.total, JSON.stringify([]), event.timestamp]
      );
    });

    this.eventBus.subscribe('OrderCancelled', async (event: any) => {
      await this.readDatabase.query(
        'UPDATE order_list_view SET status = $1 WHERE id = $2',
        ['cancelled', event.orderId]
      );

      await this.readDatabase.query(
        'UPDATE order_details_view SET status = $1 WHERE id = $2',
        ['cancelled', event.orderId]
      );
    });
  }
}

// Mediator Pattern for Command/Query Dispatch
class Mediator {
  private handlers = new Map<string, any>();

  register(type: string, handler: any): void {
    this.handlers.set(type, handler);
  }

  async send<T>(request: Command | Query<T>): Promise<T> {
    const handler = this.handlers.get(request.type);
    if (!handler) throw new Error(\`No handler for \${request.type}\`);
    return handler.handle(request);
  }
}

// Usage
const mediator = new Mediator();
mediator.register('CreateOrder', createOrderHandler);
mediator.register('CancelOrder', cancelOrderHandler);
mediator.register('GetOrderById', getOrderByIdHandler);
mediator.register('SearchOrders', searchOrdersHandler);

// Execute command
const orderId = await mediator.send({
  type: 'CreateOrder',
  userId: 'user-123',
  items: [{ productId: 'prod-1', quantity: 2 }],
});

// Execute query
const order = await mediator.send({
  type: 'GetOrderById',
  orderId,
});`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production CQRS architecture with command/query separation, event-driven synchronization, and mediator pattern",
        prerequisites: [
          "Domain-Driven Design",
          "Event-driven architecture",
          "Mediator pattern",
        ],
        systemPosition: "Order management system in e-commerce platform",
      },
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservices with high read/write ratio",
      "Event-driven architectures",
      "Systems requiring multiple read representations",
      "Performance-critical applications",
      "Complex business logic domains",
    ],
    interactsWith: [
      "event-sourcing",
      "message-queue",
      "caching",
      "read-replicas",
      "api-gateway",
    ],
    architecturalBoundaries: [
      "Command/Query separation",
      "Write model (source of truth)",
      "Read models (projections)",
      "Event bus (synchronization)",
    ],
  },

  // L5: Technology Mapping
  implementations: [
    {
      id: "mediatr",
      name: "MediatR",
      type: "library",
      languages: ["csharp"],
      description:
        "Popular .NET mediator implementation for CQRS. Supports request/response (queries), pub/sub (events), sync/async processing. Decouples components via central handler registration. Used in millions of .NET applications. Simple, zero-dependency library.",
      links: {
        docs: "https://github.com/jbogard/MediatR/wiki",
        github: "https://github.com/jbogard/MediatR",
      },
      codeSnippet: `public class CreateOrderCommand : IRequest<string> {
  public string UserId { get; set; }
  public List<OrderItem> Items { get; set; }
}

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, string> {
  public async Task<string> Handle(CreateOrderCommand cmd, CancellationToken ct) {
    // Business logic
    return orderId;
  }
}

// Usage
var orderId = await mediator.Send(new CreateOrderCommand { ... });`,
    },
    {
      id: "axon-cqrs",
      name: "Axon Framework",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Comprehensive CQRS + Event Sourcing framework for Java/Kotlin. Includes command handling, query handling, event processing, sagas, distributed command bus via Axon Server. Production-ready with Spring Boot integration, monitoring, and scaling support.",
      links: {
        docs: "https://docs.axoniq.io/",
        github: "https://github.com/AxonFramework/AxonFramework",
      },
      codeSnippet: `@CommandHandler
public void handle(CreateOrderCommand cmd) {
  apply(new OrderCreatedEvent(cmd.getOrderId(), cmd.getUserId()));
}

@QueryHandler
public OrderDto handle(GetOrderQuery query) {
  return orderRepository.findById(query.getOrderId());
}`,
    },
    {
      id: "nservicebus",
      name: "NServiceBus",
      type: "framework",
      languages: ["csharp"],
      description:
        "Enterprise service bus for .NET with built-in CQRS support. Handles message routing, retries, saga orchestration, distributed transactions. Commercial product (Particular Software) with extensive tooling and monitoring. Best for enterprise .NET applications.",
      links: {
        docs: "https://docs.particular.net/nservicebus/",
      },
      codeSnippet: `public class CreateOrderHandler : IHandleMessages<CreateOrderCommand> {
  public async Task Handle(CreateOrderCommand msg, IMessageHandlerContext ctx) {
    // Process command
    await ctx.Publish(new OrderCreated { OrderId = orderId });
  }
}`,
    },
    {
      id: "brighter",
      name: "Brighter",
      type: "library",
      languages: ["csharp"],
      description:
        ".NET command dispatcher and processor supporting CQRS, task queues, and messaging pipelines. Open-source alternative to NServiceBus with command dispatching, quality-of-service policies (timeout, retry, circuit breaker), and async message processing.",
      links: {
        docs: "https://www.goparamore.io/",
        github: "https://github.com/BrighterCommand/Brighter",
      },
    },
    {
      id: "cqrs-es-nodejs",
      name: "Node CQRS",
      type: "library",
      languages: ["typescript"],
      description:
        "Lightweight CQRS/Event Sourcing framework for Node.js. Supports in-memory and MongoDB event stores, snapshots, sagas, projections. Minimal dependencies, functional programming style. Good for Node.js microservices.",
      links: {
        github: "https://github.com/snatalenko/node-cqrs",
      },
    },
    {
      id: "cqrs-typescript",
      name: "@nestjs/cqrs",
      type: "library",
      languages: ["typescript"],
      description:
        "CQRS module for NestJS framework. Provides command bus, query bus, event bus, sagas. Integrates with NestJS dependency injection. Lightweight implementation following CQRS principles without heavyweight infrastructure.",
      links: {
        docs: "https://docs.nestjs.com/recipes/cqrs",
        github: "https://github.com/nestjs/cqrs",
      },
      codeSnippet: `@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  async execute(command: CreateOrderCommand): Promise<string> {
    // Handle command
    this.eventBus.publish(new OrderCreatedEvent(orderId));
    return orderId;
  }
}`,
    },
    {
      id: "lagom-cqrs",
      name: "Lagom Framework",
      type: "framework",
      languages: ["java", "scala"],
      description:
        "Reactive microservices framework (Lightbend) with built-in CQRS and event sourcing. Akka-powered persistence, read-side projections, cluster sharding. Opinionated framework for building scalable reactive systems with CQRS at core.",
      links: {
        docs: "https://www.lagomframework.com/documentation/",
        github: "https://github.com/lagom/lagom",
      },
    },
    {
      id: "eventuate-cqrs",
      name: "Eventuate",
      type: "framework",
      languages: ["java", "scala"],
      description:
        "Event sourcing and CQRS platform supporting microservices. Eventuate Local (Kafka-based) and Eventuate SaaS. Handles event storage, projections, sagas, distributed transactions. Works with Spring, Micronaut, Quarkus.",
      links: {
        docs: "https://eventuate.io/docs/",
      },
    },
    {
      id: "wolverine",
      name: "Wolverine",
      type: "framework",
      languages: ["csharp"],
      description:
        "Next-generation .NET mediator and messaging library with CQRS support. Successor to Jasper. High-performance message processing, transactional middleware, Marten integration for event sourcing. Focus on developer productivity.",
      links: {
        docs: "https://wolverine.netlify.app/",
        github: "https://github.com/JasperFx/wolverine",
      },
    },
  ],

  // L6: System Composition
  usedInSystems: [
    {
      systemId: "netflix-tudum-cqrs",
      systemName: "Netflix - Tudum Fan Website",
      howUsed:
        "Netflix launched Tudum fan website (late 2021) with CQRS architecture to optimize read performance for content serving. Initial design: write-optimized data published to Kafka topic, page data service consumed messages and stored in Cassandra query database for reads. Pattern composition: CQRS + Kafka (event bus) + Cassandra (read store). However, team later concluded CQRS wasn't optimal for their use case—replaced with RAW Hollow in-memory object store for better performance. Lesson learned: CQRS adds complexity; evaluate if eventual consistency and dual-model overhead justify benefits. Rationale initially: Separate read/write scaling for content management. Why changed: In-memory store provided better performance without CQRS complexity for their specific workload. Impact: Highlights importance of matching pattern to problem—CQRS isn't always the answer.",
      source:
        "https://www.infoq.com/news/2025/08/netflix-tudum-cqrs-raw-hollow/",
    },
    {
      systemId: "microsoft-azure-cqrs",
      systemName: "Microsoft - Azure CQRS Reference Architecture",
      howUsed:
        "Microsoft published Azure CQRS pattern documentation showing two implementation approaches: Basic CQRS (shared database, separate models) and Advanced CQRS (separate databases for read/write). Advanced pattern uses Azure Event Grid for event publishing, Azure Functions for event processing, Cosmos DB for write operations, Azure SQL for read models. Pattern composition: CQRS + Event-Driven Architecture + Azure Services. Use cases: E-commerce (write orders to SQL, read from cache), IoT (write telemetry to time-series DB, read aggregates from SQL), Content Management (write to SQL, read from search index). Separating read/write models simplifies design, improves scalability, allows technology diversity per concern. Challenges: Eventual consistency (reads lag writes), code duplication (two models), synchronization complexity. When to use: Collaborative domains (multiple users updating simultaneously), complex domain logic on writes, different non-functional requirements for reads vs writes. Impact: Proven pattern for Azure-native applications requiring independent read/write scaling.",
      source:
        "https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs",
    },
    {
      systemId: "ecommerce-cqrs",
      systemName: "E-commerce Platform - Order Management with CQRS",
      howUsed:
        "Large e-commerce platform implemented CQRS for order management to handle vastly different read/write characteristics. Write side: Order creation, payment processing, inventory updates (strict consistency, complex validation). Read side: Order history, search, analytics (eventual consistency acceptable, optimized for queries). Architecture: Write model in PostgreSQL (normalized, transactional), read models in Elasticsearch (full-text search), Redis (order status cache), MongoDB (analytics projections). Event bus (RabbitMQ) synchronizes write → read models. Pattern composition: CQRS + Event Sourcing (optional, for audit) + Multiple Read Stores + Cache. Commands: CreateOrder, CancelOrder, UpdateShippingAddress. Queries: SearchOrders, GetOrderById, GetUserOrderHistory. Rationale: Write operations require ACID transactions and validation. Read operations need speed, full-text search, denormalization for complex joins. Impact: Scaled to 50K orders/sec writes, 500K reads/sec. Independent scaling of read replicas. 10x query performance improvement with specialized read stores.",
      source: "https://microservices.io/patterns/data/cqrs.html",
    },
    {
      systemId: "fintech-cqrs-event-sourcing",
      systemName: "FinTech - Transaction Processing with CQRS + Event Sourcing",
      howUsed:
        "Financial technology platform combined CQRS with Event Sourcing for transaction processing and portfolio management. Write side: Event sourced transactions (TradeExecuted, DividendReceived, FeeCharged) stored in event store, ensuring immutable audit trail for compliance. Read side: Multiple projections for different views—account balance (real-time), tax reports (annual aggregates), analytics (historical trends). Pattern composition: CQRS + Event Sourcing + Multiple Projections + PostgreSQL (write/events) + Elasticsearch (search) + Redis (real-time balance). Commands validated against business rules before generating events. Queries served from optimized projections updated asynchronously. Rationale: Financial regulations require complete audit trail (event sourcing). Different stakeholders need different views of same data (CQRS projections). Impact: Passed regulatory audits, enabled complex reporting, improved query performance 50x, simplified tax calculations, enabled real-time portfolio tracking.",
      source:
        "https://dev.to/lukasniessen/event-sourcing-cqrs-and-micro-services-real-fintech-example-from-my-consulting-career-1j9b",
    },
  ],

  philosophy: {
    coreProblem:
      "Single unified model for reads and writes creates compromises where neither concern is optimally served. Write operations need consistency and validation; read operations need speed and denormalization. One model can't excel at both.",
    designPrinciple:
      "Separate concerns: use different models optimized for their specific workloads. Write model focuses on business rules and consistency. Read models focus on fast, optimized data retrieval. Connect them via events for eventual consistency.",
    historicalContext:
      "CQRS coined by Greg Young (2010) as extension of CQS (Command Query Separation) principle by Bertrand Meyer (1988). Popularized with Domain-Driven Design and event sourcing. Microsoft documented pattern for Azure (2012). Widely adopted in microservices architectures.",
    alternativesRejected: [
      "Shared CRUD model: One size fits all, optimizes neither reads nor writes",
      "Read replicas only: Helps scaling but doesn't address model optimization",
      "Materialized views: Partial solution, tightly coupled to write schema",
    ],
    mentalModel:
      "Like a restaurant with separate front-of-house (queries/reads) and back-of-house (commands/writes). Front serves customers quickly from prepared displays (read models). Back focuses on food preparation and inventory management (write model). They communicate via order tickets (events), not by sharing the same space.",
  },

  visualization: {
    staticDiagram: `flowchart LR
    subgraph Write Side
        C[Commands] --> WM[Write Model<br/>PostgreSQL]
        WM --> E[Domain Events]
    end

    subgraph Event Bus
        E --> Bus[Message Queue]
    end

    subgraph Read Side
        Bus --> P1[Projection 1]
        Bus --> P2[Projection 2]
        Bus --> P3[Projection 3]

        P1 --> RM1[(List View<br/>Elasticsearch)]
        P2 --> RM2[(Details View<br/>Redis Cache)]
        P3 --> RM3[(Analytics<br/>MongoDB)]

        Q[Queries] --> RM1
        Q --> RM2
        Q --> RM3
    end

    style WM fill:#fff3cd
    style RM1 fill:#d4edda
    style RM2 fill:#d4edda
    style RM3 fill:#d4edda`,
    realWorldAnalogy:
      "Like a library: when you check out a book (command), the librarian updates the master catalog (write model), records the transaction, and later updates the 'available books' display (read model). When you search for books (query), you use the optimized card catalog or computer search (read model), not the transaction ledger.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Order writes require validation (inventory check, payment processing). Order reads need fast search, filtering, sorting. CQRS optimizes each concern separately.",
        patternRole:
          "Separate write validation from read optimization, enabling independent scaling",
        companies: ["Amazon", "Shopify", "eBay"],
      },
      {
        domain: "Social Media",
        scenario:
          "Posts created with complex validation (spam detection, content moderation). Feed reads need instant, personalized, denormalized data. Different databases for each.",
        patternRole:
          "Handle high write volume while serving personalized read feeds at scale",
        companies: ["Twitter", "Facebook", "LinkedIn"],
      },
      {
        domain: "Finance",
        scenario:
          "Transactions require strict validation and audit trail. Reports need aggregated data, multiple projections for different stakeholders (traders, compliance, tax).",
        patternRole:
          "Ensure transactional integrity on writes while providing optimized views for reporting",
        companies: ["Stripe", "Robinhood", "Square"],
      },
      {
        domain: "Gaming",
        scenario:
          "Player actions (write) require validation against game rules. Leaderboards, stats, replays (read) need fast, denormalized access with different data structures.",
        patternRole:
          "Optimize game state writes separately from analytics and leaderboard reads",
        companies: ["Riot Games", "Blizzard"],
      },
    ],
  },

  tags: [
    "architecture",
    "scalability",
    "performance",
    "event-driven",
    "domain-driven-design",
  ],
  difficulty: "advanced",
};
