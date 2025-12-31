import type { Pattern } from "../schema";

export const messageQueue: Pattern = {
  id: "message-queue",
  slug: "message-queue",
  corpusPath: "🏗️ ARCHITECTURE → 📨 Messaging → 📬 Message Queue",

  hierarchy: {
    quality: "scalability",
    strategy: "Messaging",
    family: "Asynchronous Communication",
    level: 3,
  },

  concept: {
    name: "Message Queue",
    emoji: "📬",
    tagline: "Decouple services through asynchronous message passing",
    definition:
      "A Message Queue is an asynchronous communication pattern where services exchange information by sending messages through an intermediary queue, enabling temporal decoupling (sender and receiver don't need to be available simultaneously) and spatial decoupling (services don't need to know each other's location). Producers publish messages to named queues; consumers pull or receive messages from these queues and process them independently. The queue acts as a buffer, storing messages durably until consumers acknowledge successful processing. This pattern transforms synchronous, blocking request-response interactions into asynchronous, non-blocking message passing. Message queues provide ordering guarantees (FIFO queues ensure messages process in order), delivery guarantees (at-least-once, at-most-once, or exactly-once semantics), and retry mechanisms (failed messages can be reprocessed or moved to dead-letter queues). They enable load leveling (absorb traffic spikes by queueing excess messages), horizontal scaling (add more consumers to increase processing throughput), and fault tolerance (messages persist even if consumers crash). Modern message queues support patterns like publish-subscribe (one message, many consumers), competing consumers (many workers sharing a queue), priority queues (process high-priority messages first), and delayed/scheduled message delivery. They're fundamental infrastructure for building resilient, scalable distributed systems.",
    problemSolved:
      "Synchronous service communication creates tight coupling and fragility. When Service A calls Service B synchronously, A blocks waiting for B's response. If B is slow, A's resources (threads, connections) are tied up. If B is down, A fails immediately. This tight coupling means services must scale together—if A handles 10K req/s but B only handles 1K req/s, the system bottlenecks at 1K. During traffic spikes, sudden load can overwhelm downstream services, causing cascading failures. Message queues solve these problems through decoupling: producers send messages and immediately continue—they don't wait for processing. Consumers process messages at their own pace, naturally load-leveling spikes (queue grows during spikes, drains when traffic subsides). Services can be offline temporarily—messages wait in the queue until consumers restart. Failures are isolated: a consumer crash doesn't fail the producer. Services scale independently: add more consumers without changing producers. The queue provides a natural circuit breaker: if consumers fall behind, the queue grows (observable metric) before system failure. Additionally, message queues enable event-driven architectures where producers don't know (or care) who consumes their messages—new consumers can subscribe without modifying producers.",
    tradeoffs: {
      pros: [
        "Temporal decoupling: Producers and consumers operate independently",
        "Load leveling: Absorb traffic spikes by buffering excess messages",
        "Fault tolerance: Messages persist even if consumers crash",
        "Independent scaling: Scale producers and consumers separately",
        "Asynchronous processing: Producers don't block waiting for results",
      ],
      cons: [
        "Eventual consistency: Message processing is asynchronous, not immediate",
        "Complexity: Requires monitoring queue depth, consumer lag, and dead-letter queues",
        "Message ordering challenges: Guaranteed order requires single consumer or partitioning",
        "Duplicate messages: At-least-once delivery may process messages multiple times",
        "Debugging difficulty: Harder to trace request flows than synchronous calls",
      ],
    },
    relatedPatterns: [
      "event-sourcing",
      "cqrs",
      "pub-sub",
      "event-driven-architecture",
      "saga",
      "backpressure",
    ],
  },

  structure: {
    participants: [
      {
        name: "Producer",
        role: "Message Publisher",
        responsibilities: [
          "Create and publish messages to queues",
          "Include message payload and metadata",
          "Handle publish failures and retries",
        ],
      },
      {
        name: "Message Queue",
        role: "Message Broker",
        responsibilities: [
          "Durably store messages until acknowledged",
          "Maintain message ordering (FIFO queues)",
          "Provide delivery guarantees (at-least-once, exactly-once)",
          "Route messages to dead-letter queues on repeated failures",
        ],
      },
      {
        name: "Consumer",
        role: "Message Processor",
        responsibilities: [
          "Poll or subscribe to receive messages",
          "Process message payload (business logic)",
          "Acknowledge successful processing or reject/requeue on failure",
        ],
      },
      {
        name: "Dead Letter Queue",
        role: "Failed Message Repository",
        responsibilities: [
          "Store messages that failed processing after max retries",
          "Enable manual inspection and reprocessing",
          "Alert on poison messages",
        ],
      },
    ],
    diagram: `flowchart LR
    subgraph Producers
        P1[Service A] --> Q1
        P2[Service B] --> Q1
        P3[Service C] --> Q2
    end

    subgraph Message Broker
        Q1[Order Queue<br/>FIFO]
        Q2[Notification Queue<br/>Standard]
        DLQ[Dead Letter Queue]
    end

    subgraph Consumers
        Q1 --> C1[Order Processor 1]
        Q1 --> C2[Order Processor 2]
        Q2 --> C3[Email Service]
        Q2 --> C4[SMS Service]
    end

    C1 -.->|Failed 3x| DLQ
    C2 -.->|Failed 3x| DLQ

    style Q1 fill:#d4edda
    style DLQ fill:#f8d7da
    style C1 fill:#fff3cd`,
    flow: [
      {
        step: 1,
        actor: "Producer",
        action: "Publish Message",
        description:
          "Producer sends message with payload and metadata to queue",
      },
      {
        step: 2,
        actor: "Message Queue",
        action: "Store Message",
        description:
          "Queue durably persists message and returns acknowledgment to producer",
      },
      {
        step: 3,
        actor: "Consumer",
        action: "Poll/Receive",
        description:
          "Consumer polls queue or receives push notification of new message",
      },
      {
        step: 4,
        actor: "Consumer",
        action: "Process Message",
        description: "Consumer executes business logic on message payload",
      },
      {
        step: 5,
        actor: "Consumer",
        action: "Acknowledge",
        description:
          "Consumer acknowledges successful processing; queue deletes message",
      },
      {
        step: 6,
        actor: "Consumer (Failure)",
        action: "Reject/Requeue",
        description:
          "On failure, consumer rejects message; queue retries or sends to DLQ",
      },
    ],
    invariants: [
      "Messages persist until acknowledged by consumer",
      "FIFO queues maintain message order within a partition",
      "At-least-once delivery may result in duplicate processing",
      "Dead-letter queues capture poison messages after max retries",
      "Queue depth indicates consumer lag or processing bottlenecks",
    ],
  },

  codeExamples: [
    {
      id: "message-queue-rabbitmq",
      language: "typescript",
      title: "RabbitMQ Message Queue with Dead Letter Queue",
      description:
        "Producer-consumer pattern with retry logic and dead-letter queue handling",
      code: `import amqp from 'amqplib';

// Producer: Publish messages to order queue
async function publishOrder(order: any) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queueName = 'orders';
  const dlqName = 'orders.dlq';

  // Declare main queue with DLQ configuration
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': dlqName,
      'x-message-ttl': 300000, // 5 min TTL
    },
  });

  // Declare dead-letter queue
  await channel.assertQueue(dlqName, { durable: true });

  const message = JSON.stringify(order);
  channel.sendToQueue(queueName, Buffer.from(message), {
    persistent: true,
    messageId: order.id,
    timestamp: Date.now(),
  });

  console.log(\`Published order: \${order.id}\`);
  await channel.close();
  await connection.close();
}

// Consumer: Process messages with retry logic
async function consumeOrders() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queueName = 'orders';
  await channel.assertQueue(queueName, { durable: true });

  // Prefetch 1 message at a time for even load distribution
  channel.prefetch(1);

  console.log('Waiting for orders...');

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;

      try {
        const order = JSON.parse(msg.content.toString());
        console.log(\`Processing order: \${order.id}\`);

        // Simulate processing
        await processOrder(order);

        // Acknowledge successful processing
        channel.ack(msg);
        console.log(\`Order \${order.id} processed successfully\`);
      } catch (error) {
        console.error(\`Failed to process order: \${error.message}\`);

        // Check retry count from header
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        const maxRetries = 3;

        if (retryCount < maxRetries) {
          // Requeue with incremented retry count
          console.log(\`Retrying order (attempt \${retryCount})\`);
          channel.nack(msg, false, true);

          // Update retry count header
          msg.properties.headers = msg.properties.headers || {};
          msg.properties.headers['x-retry-count'] = retryCount;
        } else {
          // Max retries exceeded - send to DLQ
          console.log(\`Max retries exceeded, sending to DLQ\`);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    },
    { noAck: false }
  );
}

async function processOrder(order: any): Promise<void> {
  // Simulate external API call
  if (Math.random() < 0.2) {
    throw new Error('Payment gateway timeout');
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Usage
await publishOrder({ id: '12345', amount: 99.99 });
consumeOrders();`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-grade message queue with retry logic, DLQ handling, and load distribution",
        prerequisites: [
          "RabbitMQ server",
          "Message acknowledgments",
          "AMQP protocol",
        ],
        systemPosition:
          "Asynchronous order processing pipeline in e-commerce system",
      },
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Asynchronous task processing",
      "Event-driven microservices",
      "Background job workers",
      "Email/notification systems",
      "Data ingestion pipelines",
    ],
    interactsWith: [
      "databases",
      "external-apis",
      "monitoring",
      "logging",
      "circuit-breakers",
    ],
    architecturalBoundaries: [
      "Service-to-service decoupling",
      "Load balancing across consumers",
      "Failure isolation via DLQs",
      "Traffic spike buffering",
    ],
  },

  // L5: Technology Mapping
  implementations: [
    {
      id: "rabbitmq",
      name: "RabbitMQ",
      type: "platform",
      languages: [
        "java",
        "python",
        "typescript",
        "go",
        "csharp",
        "ruby",
        "php",
      ],
      description:
        "Open-source message broker supporting AMQP, MQTT, STOMP protocols. Advanced routing (direct, topic, fanout exchanges), per-message TTL, priority queues, publisher confirms. Used by Instagram, Reddit for task queues. Best for flexible routing and reliable delivery.",
      links: {
        docs: "https://www.rabbitmq.com/documentation.html",
        github: "https://github.com/rabbitmq/rabbitmq-server",
      },
      codeSnippet: `const amqp = require('amqplib');
const conn = await amqp.connect('amqp://localhost');
const ch = await conn.createChannel();
await ch.assertQueue('tasks', { durable: true });
ch.sendToQueue('tasks', Buffer.from('work'), { persistent: true });`,
    },
    {
      id: "apache-kafka",
      name: "Apache Kafka",
      type: "platform",
      languages: ["java", "python", "typescript", "go", "csharp"],
      description:
        "Distributed event streaming platform designed for high-throughput (millions msg/sec). Durable log-based storage with configurable retention, partitioning for parallelism, consumer groups. Used by LinkedIn, Uber, Netflix. Best for event streaming and log aggregation.",
      links: {
        docs: "https://kafka.apache.org/documentation/",
        github: "https://github.com/apache/kafka",
      },
      codeSnippet: `const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
await producer.send({
  topic: 'orders',
  messages: [{ key: 'order1', value: 'order data' }]
});`,
    },
    {
      id: "aws-sqs",
      name: "AWS SQS (Simple Queue Service)",
      type: "service",
      languages: ["any via HTTP API"],
      description:
        "Fully managed message queue service with standard (best-effort ordering, unlimited throughput) and FIFO queues (exact order, 300 msg/sec). Dead-letter queues, message visibility timeout, long polling. Integrates with Lambda, ECS, SNS. Zero infrastructure management.",
      links: {
        docs: "https://docs.aws.amazon.com/sqs/",
      },
      codeSnippet: `import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
const client = new SQSClient({ region: 'us-east-1' });
await client.send(new SendMessageCommand({
  QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/orders',
  MessageBody: JSON.stringify({ orderId: '12345' })
}));`,
    },
    {
      id: "azure-service-bus",
      name: "Azure Service Bus",
      type: "service",
      languages: ["any via AMQP/HTTP"],
      description:
        "Enterprise message broker with queues and topics (pub-sub). FIFO support, sessions (ordered message groups), transactions, scheduled delivery, automatic dead-lettering. Geo-disaster recovery. Best for Azure-native enterprise applications.",
      links: {
        docs: "https://docs.microsoft.com/en-us/azure/service-bus-messaging/",
      },
      codeSnippet: `const { ServiceBusClient } = require('@azure/service-bus');
const client = new ServiceBusClient(connectionString);
const sender = client.createSender('orders');
await sender.sendMessages({ body: { orderId: '12345' } });`,
    },
    {
      id: "google-pub-sub",
      name: "Google Cloud Pub/Sub",
      type: "service",
      languages: ["any via gRPC/HTTP"],
      description:
        "Fully managed real-time messaging with global message delivery. Push and pull subscriptions, message ordering (within ordering key), exactly-once delivery (preview), dead-letter topics. At-least-once delivery by default. Tight GCP integration.",
      links: {
        docs: "https://cloud.google.com/pubsub/docs",
      },
      codeSnippet: `const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();
const topic = pubsub.topic('orders');
await topic.publishMessage({ data: Buffer.from(JSON.stringify(order)) });`,
    },
    {
      id: "redis-streams",
      name: "Redis Streams",
      type: "library",
      languages: ["any with Redis client"],
      description:
        "In-memory message queue with consumer groups, message persistence (AOF/RDB), range queries, consumer acknowledgments. Extremely low latency (<1ms). Best for low-latency, high-throughput scenarios where persistence is secondary.",
      links: {
        docs: "https://redis.io/docs/data-types/streams/",
        github: "https://github.com/redis/redis",
      },
      codeSnippet: `const redis = require('redis');
const client = redis.createClient();
await client.xAdd('orders', '*', { orderId: '12345', amount: '99.99' });`,
    },
    {
      id: "nats",
      name: "NATS",
      type: "platform",
      languages: ["go", "java", "python", "typescript", "rust"],
      description:
        "Cloud-native messaging system with focus on simplicity and performance. JetStream for persistence and exactly-once. Subject-based addressing, request-reply, queue groups. Lightweight (~20MB binary). Best for cloud-native microservices.",
      links: {
        docs: "https://docs.nats.io/",
        github: "https://github.com/nats-io/nats-server",
      },
      codeSnippet: `const { connect, JSONCodec } = require('nats');
const nc = await connect({ servers: 'localhost:4222' });
nc.publish('orders', JSONCodec().encode({ orderId: '12345' }));`,
    },
    {
      id: "amazon-sqs-sns",
      name: "AWS SNS + SQS (Fan-out Pattern)",
      type: "service",
      languages: ["any via HTTP API"],
      description:
        "SNS (pub-sub) delivers messages to multiple SQS queues simultaneously. Enables fan-out: one event, many consumers. Message filtering, SMS/email/HTTP endpoints, mobile push. Combined pattern for event broadcasting.",
      links: {
        docs: "https://docs.aws.amazon.com/sns/",
      },
    },
    {
      id: "apache-pulsar",
      name: "Apache Pulsar",
      type: "platform",
      languages: ["java", "python", "go", "csharp"],
      description:
        "Distributed pub-sub messaging with multi-tenancy, geo-replication, tiered storage. Unified messaging (queuing + streaming), guaranteed ordering, exactly-once semantics. Used by Yahoo, Splunk. Next-gen Kafka alternative.",
      links: {
        docs: "https://pulsar.apache.org/docs/",
        github: "https://github.com/apache/pulsar",
      },
    },
    {
      id: "amazon-mq",
      name: "Amazon MQ",
      type: "service",
      languages: ["any via AMQP/MQTT"],
      description:
        "Managed ActiveMQ and RabbitMQ service. Drop-in replacement for on-prem brokers migrating to AWS. Supports JMS, AMQP, MQTT, STOMP. Best for lift-and-shift migrations.",
      links: {
        docs: "https://docs.aws.amazon.com/amazon-mq/",
      },
    },
  ],

  // L6: System Composition
  usedInSystems: [
    {
      systemId: "slack-kafka-job-queue",
      systemName: "Slack - Kafka-Based Job Queue",
      howUsed:
        "Slack replaced Redis in-memory job queue with Kafka for durable storage to prevent memory exhaustion and job loss during failures. Developed Kafkagate (stateless Go service) to enqueue jobs to Kafka and JQRelay (Go service) to relay from Kafka topics to Redis clusters. This added durability layer while maintaining Redis performance for hot queue operations. Pattern composition: Message Queue (Kafka for durability) + In-Memory Cache (Redis for speed) + Load Balancing + Monitoring. Set up load testing environments to stress Kafka cluster before production, properly sizing with headroom for broker failures and leadership changes. Rationale: In-memory Redis lacked durability—crashes lost jobs. Kafka provides durable message storage with high throughput. Impact: Zero job loss during failures, maintained low latency, enabled capacity planning through queue depth metrics, prevented cascading failures from queue exhaustion.",
      source: "https://slack.engineering/scaling-slacks-job-queue/",
    },
    {
      systemId: "linkedin-kafka",
      systemName: "LinkedIn - Kafka Event Streaming",
      howUsed:
        "LinkedIn developed and open-sourced Apache Kafka in 2011 to handle millions of events per second from activity streams, metrics, and logs. Kafka replaced multiple point-to-point integrations with unified event streaming platform. Shifted from message delivery focus to high-throughput distributed event streaming with producer-topic-partition-consumer architecture. Handles user activity tracking, metrics aggregation, log collection, real-time analytics. Pattern composition: Message Queue (event buffering) + Pub-Sub (multiple consumers per topic) + Event Sourcing (durable log) + Stream Processing. Used by Uber, Netflix, Airbnb. Rationale: Traditional message brokers couldn't handle LinkedIn's scale (billions of messages/day) or provide durable log for replay. Impact: Unified data pipeline, reduced integration complexity from O(n²) to O(n), enabled real-time analytics, became industry standard for event streaming.",
      source:
        "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying",
    },
    {
      systemId: "uber-kafka-distributed-tracing",
      systemName: "Uber - Multi-Service Message Queue Architecture",
      howUsed:
        "Uber uses Kafka extensively for event-driven communication across 2000+ microservices. Key use cases: ride state changes (requested → matched → in-progress → completed), payment processing events, driver location updates, surge pricing calculations. Kafka topics partition by city/region for geographic isolation. Combined with distributed tracing (Jaeger) to trace message flows across services. Pattern composition: Message Queue (Kafka) + Distributed Tracing + Partitioning (geographic sharding) + CQRS (separate read/write models). Enables asynchronous processing of ride lifecycle events while maintaining trace context. Rationale: Synchronous service calls couldn't scale to millions of rides/day. Kafka provides buffering, decoupling, and fault tolerance. Impact: Handles billions of events daily, enables independent service scaling, provides failure isolation, supports global expansion.",
      source:
        "https://www.uber.com/blog/kafka-async-queuing-with-consumer-proxy/",
    },
    {
      systemId: "shopify-background-jobs",
      systemName: "Shopify - Background Job Processing",
      howUsed:
        "Shopify processes millions of background jobs daily for order fulfillment, inventory updates, email notifications, webhook deliveries using Redis-backed job queues. Jobs include: image processing (resize product photos), email campaigns (millions of emails), webhook retries (notify merchants of order events), data exports. Pattern composition: Message Queue (Redis/Sidekiq) + Retry with Exponential Backoff + Dead Letter Queue + Priority Queues. Critical jobs (payment confirmation) get higher priority than batch jobs (analytics). DLQs capture poison messages for manual intervention. Rationale: Synchronous processing would block web requests. Asynchronous jobs enable responsive UI while background workers handle heavy lifting. Impact: Responsive storefront (page loads <200ms), reliable webhook delivery even during partner downtime, graceful degradation during traffic spikes (Black Friday), horizontal worker scaling.",
      source: "https://shopify.engineering/",
    },
  ],

  philosophy: {
    coreProblem:
      "Synchronous service communication creates tight coupling where failures cascade, traffic spikes overwhelm systems, and services must scale together, leading to fragile distributed systems.",
    designPrinciple:
      "Decouple services temporally and spatially through asynchronous message passing. Producers and consumers operate independently, connected only by message contracts, enabling fault tolerance and independent scaling.",
    historicalContext:
      "Message queuing originated in mainframe systems (IBM MQ, 1990s) for reliable message delivery. AMQP standardized messaging protocols (2006). Modern cloud-native queues (AWS SQS, 2006; Kafka, 2011) focused on scalability and managed services. Shift from request-response to event-driven architectures.",
    alternativesRejected: [
      "Synchronous RPC: Blocks caller, tight coupling, cascading failures",
      "Database polling: Inefficient, poor latency, doesn't scale",
      "Shared database: Couples services through schema, hard to scale independently",
    ],
    mentalModel:
      "Like a post office mailbox: you drop letters (messages) without waiting for delivery. The postal service (queue) ensures delivery, retries on failure, and recipients pick up mail on their schedule. Sender and receiver never meet directly.",
  },

  visualization: {
    staticDiagram: `flowchart LR
    subgraph Producers
        A[Order Service] -->|New Order| Q1
        B[Payment Service] -->|Payment Success| Q2
        C[Inventory Service] -->|Stock Update| Q3
    end

    subgraph Message Broker
        Q1[Order Queue]
        Q2[Payment Queue]
        Q3[Inventory Queue]
    end

    subgraph Consumers
        Q1 --> D[Fulfillment Worker 1]
        Q1 --> E[Fulfillment Worker 2]
        Q2 --> F[Notification Service]
        Q3 --> G[Analytics Service]
    end

    D -.->|Failed 3x| DLQ[Dead Letter Queue]
    E -.->|Failed 3x| DLQ

    style Q1 fill:#d4edda
    style DLQ fill:#f8d7da`,
    realWorldAnalogy:
      "Like a restaurant kitchen order queue: servers (producers) submit orders to the kitchen queue without waiting. Cooks (consumers) take orders from the queue and prepare them at their own pace. During rush hour, orders queue up but don't overwhelm cooks—they work through backlog steadily. If a dish is impossible to make, it goes to the manager (DLQ) for handling.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Order placed → payment processed → inventory updated → fulfillment started → shipping label created → customer notified. Each step is a message, allowing services to process asynchronously.",
        patternRole:
          "Decouple order processing pipeline for independent scaling and failure isolation",
        companies: ["Amazon", "Shopify", "Etsy"],
      },
      {
        domain: "Social Media",
        scenario:
          "User posts photo → image resized (3 sizes) → faces detected → inappropriate content filtered → notifications sent to followers → feed updated. Heavy processing done asynchronously.",
        patternRole:
          "Offload expensive processing from web tier to background workers",
        companies: ["Instagram", "Twitter", "TikTok"],
      },
      {
        domain: "Finance",
        scenario:
          "Trade executed → risk calculated → compliance checked → settlement initiated → confirmations sent. Each step has different SLAs and failure modes.",
        patternRole:
          "Ensure reliable, ordered processing of financial transactions with audit trail",
        companies: ["Stripe", "Robinhood", "Square"],
      },
      {
        domain: "IoT",
        scenario:
          "Millions of sensor readings/sec → queue buffers data → analytics workers process in batches → anomalies trigger alerts → historical data archived.",
        patternRole:
          "Handle bursty, high-volume data ingestion with load leveling",
        companies: ["Tesla", "Nest", "Ring"],
      },
    ],
  },

  tags: [
    "messaging",
    "asynchronous",
    "decoupling",
    "scalability",
    "event-driven",
  ],
  difficulty: "beginner",
};
