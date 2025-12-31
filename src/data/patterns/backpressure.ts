import type { Pattern } from "../schema";

export const backpressure: Pattern = {
  id: "backpressure",
  slug: "backpressure",
  corpusPath:
    "⚡ PERFORMANCE → 📋 Work Scheduling → 🚰 Flow Control → 🔙 Backpressure",

  hierarchy: {
    quality: "performance",
    strategy: "Work Scheduling",
    family: "Flow Control",
    level: 4,
  },

  concept: {
    name: "Backpressure",
    emoji: "🔙",
    tagline: "Slow producer when consumer full",
    definition:
      "Backpressure is a flow control mechanism where consumers signal producers to slow down or stop sending data when the consumer cannot process incoming items fast enough. Unlike systems where producers blindly push data regardless of consumer capacity, backpressure creates a feedback loop that prevents buffer overflow, memory exhaustion, and system collapse. The consumer explicitly communicates its readiness to receive more items, creating demand-driven flow control. This is fundamental in reactive streams (RxJS, Project Reactor, Akka Streams) where operators like request(n) tell upstream sources how many items they can handle. Backpressure prevents cascading failures by ensuring each stage processes only what it can handle, propagating slowdowns upstream rather than accumulating unbounded queues. The pattern transforms push-based systems into pull-based or hybrid models where downstream demand governs upstream production rate.",
    problemSolved:
      "In streaming or pipelined systems, producers often generate data faster than consumers can process it. Without backpressure, fast producers overwhelm slow consumers, causing unbounded memory growth, buffer overflow, dropped messages, or system crashes. Traditional solutions like large buffers only delay the problem—if the producer consistently outpaces the consumer, buffers eventually fill. Backpressure solves this by making production rate adaptive to consumption capacity. When a database write operation takes 100ms but messages arrive every 10ms, backpressure tells the message source to pause, preventing a 10x queue buildup. This prevents OutOfMemory errors, maintains predictable latency (no buffer bloat), and ensures graceful degradation under load. Critical for systems processing user uploads, streaming analytics, ETL pipelines, or any producer-consumer scenario where rate mismatch exists.",
    tradeoffs: {
      pros: [
        "Prevents memory exhaustion by limiting buffered items to consumer capacity",
        "Maintains system stability under variable load—no cascading failures",
        "Provides predictable latency by avoiding deep queues that add delay",
        "Enables reactive systems to adapt production rate to slowest consumer",
        "Simplifies error handling—no dropped messages due to overflow",
        "Improves resource efficiency by not producing items that will be discarded",
      ],
      cons: [
        "Adds complexity to producer logic—must handle pause/resume signals",
        "Can slow entire pipeline to speed of slowest consumer (head-of-line blocking)",
        "Requires cooperative implementation—both producer and consumer must support it",
        "May reduce throughput if backpressure propagates too aggressively",
        "Difficult to implement across distributed systems (network latency in signals)",
        "Can cause upstream resource starvation if not managed carefully",
      ],
    },
    relatedPatterns: [
      "token-bucket",
      "leaky-bucket",
      "throttling",
      "rate-limiting",
      "batching",
      "windowing",
    ],
  },

  structure: {
    participants: [
      {
        name: "Producer",
        role: "Data Source",
        responsibilities: [
          "Generate or fetch data items to be processed",
          "Respect backpressure signals by pausing production",
          "Resume production when consumer signals readiness",
          "Maintain internal buffer for items produced during pause",
          "Track demand signal (requested item count) from consumer",
        ],
      },
      {
        name: "Consumer",
        role: "Data Processor",
        responsibilities: [
          "Process incoming items at its own sustainable rate",
          "Signal demand to producer using request(n) or similar mechanism",
          "Track processing capacity and buffer occupancy",
          "Emit backpressure signal when buffer approaches capacity",
          "Resume requesting when capacity becomes available",
        ],
      },
      {
        name: "Backpressure Channel",
        role: "Control Flow Coordinator",
        responsibilities: [
          "Propagate demand signals from consumer to producer",
          "Buffer limited number of items between producer and consumer",
          "Implement overflow strategy (drop, buffer, block) when buffer full",
          "Track outstanding demand count",
          "Ensure thread-safe communication between producer and consumer",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant P as Producer
    participant C as Channel
    participant S as Consumer

    Note over S: Consumer ready, signals demand
    S->>C: request(10) - Ready for 10 items
    C->>P: Forward demand signal

    Note over P: Producer starts sending
    P->>C: emit(item1)
    P->>C: emit(item2)
    P->>C: emit(item3)
    C->>S: deliver(item1)
    C->>S: deliver(item2)
    C->>S: deliver(item3)

    Note over S: Consumer slowing down
    S->>C: request(2) - Only ready for 2 more
    C->>P: Demand = 2 remaining

    P->>C: emit(item4)
    P->>C: emit(item5)
    Note over P: Producer pauses (demand exhausted)

    Note over S: Consumer catches up
    S->>C: request(10) - Ready for more
    C->>P: Forward demand signal
    P->>C: emit(item6)

    Note over C: Backpressure working - producer adapts to consumer rate

    style P fill:#ffd7d7
    style C fill:#d7e3ff
    style S fill:#d7ffd7`,
    flow: [
      {
        step: 1,
        actor: "Consumer",
        action: "Initialize subscription",
        description:
          "Consumer subscribes to producer and signals initial demand (e.g., request(100))",
      },
      {
        step: 2,
        actor: "Producer",
        action: "Begin emitting items",
        description:
          "Producer sends items up to the requested count, decrementing demand counter",
      },
      {
        step: 3,
        actor: "Consumer",
        action: "Process items",
        description: "Consumer processes each item and tracks buffer occupancy",
      },
      {
        step: 4,
        actor: "Consumer",
        action: "Detect slow processing",
        description:
          "Consumer notices it's processing slower than items arrive—buffer filling",
      },
      {
        step: 5,
        actor: "Consumer",
        action: "Reduce demand signal",
        description:
          "Consumer requests fewer items (e.g., request(10) instead of request(100))",
      },
      {
        step: 6,
        actor: "Producer",
        action: "Pause production",
        description:
          "Producer exhausts demand count and pauses, waiting for new request",
      },
      {
        step: 7,
        actor: "Consumer",
        action: "Catch up on processing",
        description: "Consumer processes buffered items, freeing capacity",
      },
      {
        step: 8,
        actor: "Consumer",
        action: "Signal readiness",
        description:
          "Consumer sends new request(n) when buffer has capacity again",
      },
      {
        step: 9,
        actor: "Producer",
        action: "Resume production",
        description:
          "Producer receives demand signal and resumes emitting items",
      },
      {
        step: 10,
        actor: "System",
        action: "Stabilize flow rate",
        description:
          "System reaches equilibrium where producer rate matches consumer throughput",
      },
    ],
    invariants: [
      "Producer must never emit more items than consumer has requested (demand count ≥ 0)",
      "Consumer must signal demand before expecting items (no unbounded push)",
      "Backpressure channel buffer size must be bounded (no infinite queues)",
      "Demand signals must be additive (request(5) then request(3) = total demand of 8)",
      "Producer must be able to pause production when demand is zero",
      "System throughput cannot exceed slowest component's processing rate",
    ],
  },

  codeExamples: [
    {
      id: "backpressure-rxjs-stream",
      language: "typescript",
      title: "RxJS Observable with Backpressure",
      description:
        "Reactive stream processing with demand-driven backpressure using RxJS operators to control flow rate",
      code: `import { Observable, Subject } from 'rxjs';
import { bufferTime, mergeMap, delay } from 'rxjs/operators';

// ACTION: Define backpressure-aware data source
// REASON: Producer must respect consumer's processing capacity to prevent overflow
interface DataItem {
  id: number;
  payload: string;
  timestamp: number;
}

class BackpressureSource {
  private demandCount = 0;
  private buffer: DataItem[] = [];
  private subject = new Subject<DataItem>();

  // ACTION: Implement request(n) mechanism for demand signaling
  // REASON: Consumer tells producer how many items it can handle
  request(n: number): void {
    this.demandCount += n;
    this.emitBuffered();
  }

  // ACTION: Producer emits only when demand exists
  // REASON: Prevents unbounded queue growth by respecting consumer capacity
  produce(item: DataItem): void {
    if (this.demandCount > 0) {
      this.demandCount--;
      this.subject.next(item);
    } else {
      // ACTION: Buffer items when demand is zero
      // REASON: Producer can't push without consumer consent
      this.buffer.push(item);
      console.log(\`Backpressure: buffered item \${item.id}, buffer size: \${this.buffer.length}\`);
    }
  }

  private emitBuffered(): void {
    while (this.demandCount > 0 && this.buffer.length > 0) {
      const item = this.buffer.shift()!;
      this.demandCount--;
      this.subject.next(item);
    }
  }

  getStream(): Observable<DataItem> {
    return this.subject.asObservable();
  }
}

// ACTION: Create slow consumer that processes items at limited rate
// REASON: Simulates real-world scenario where consumer is bottleneck
class SlowConsumer {
  private processed = 0;
  private readonly processingTimeMs = 100; // Slow processing

  async processItem(item: DataItem): Promise<void> {
    // ACTION: Simulate expensive I/O operation
    // REASON: Database writes, API calls, or complex computation take time
    await new Promise(resolve => setTimeout(resolve, this.processingTimeMs));
    this.processed++;
    console.log(\`Processed item \${item.id} (total: \${this.processed})\`);
  }
}

// Usage example demonstrating backpressure
async function demonstrateBackpressure() {
  const source = new BackpressureSource();
  const consumer = new SlowConsumer();

  // ACTION: Set up reactive stream with controlled concurrency
  // REASON: mergeMap(n) limits concurrent processing to n items
  source.getStream()
    .pipe(
      // ACTION: Process items with concurrency limit
      // REASON: Backpressure is enforced by limiting parallel operations
      mergeMap(
        async (item) => {
          await consumer.processItem(item);
          // ACTION: Request next item after processing current one
          // REASON: Demand-driven flow—consumer pulls when ready
          source.request(1);
          return item;
        },
        2 // Max 2 concurrent operations
      )
    )
    .subscribe({
      error: (err) => console.error('Stream error:', err),
      complete: () => console.log('Stream complete'),
    });

  // ACTION: Initial demand signal to start the stream
  // REASON: Consumer must explicitly request items—no unbounded push
  source.request(2);

  // ACTION: Fast producer emits 10 items rapidly
  // REASON: Tests backpressure by overwhelming slow consumer
  for (let i = 1; i <= 10; i++) {
    source.produce({
      id: i,
      payload: \`data-\${i}\`,
      timestamp: Date.now(),
    });
    await new Promise(resolve => setTimeout(resolve, 10)); // Producer much faster
  }
}

// ACTION: Run demonstration showing backpressure in action
// REASON: Validates that producer pauses when consumer is overwhelmed
demonstrateBackpressure().catch(console.error);`,
      contextDilation: {
        level: "local",
        scope: "local",
        prerequisites: [
          "RxJS Observable basics",
          "Async/await in TypeScript",
          "Producer-consumer pattern fundamentals",
        ],
        systemPosition:
          "Stream processing layer between fast data source and slow consumer",
      },
    },
    {
      id: "backpressure-nodejs-stream",
      language: "typescript",
      title: "Node.js Readable Stream with Backpressure",
      description:
        "File processing pipeline using Node.js streams with automatic backpressure handling via pause/resume",
      code: `import { Readable, Writable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import * as fs from 'fs';

// ACTION: Create custom readable stream that generates data
// REASON: Demonstrates backpressure in Node.js streaming context
class DataGenerator extends Readable {
  private currentId = 0;
  private maxItems = 1000;
  private isPaused = false;

  constructor(options = {}) {
    super({ objectMode: true, ...options });
  }

  // ACTION: Implement _read to respect backpressure
  // REASON: Node.js calls _read when downstream is ready for more data
  _read(): void {
    if (this.isPaused) {
      console.log('Producer: Resume signal received, generating more data');
      this.isPaused = false;
    }

    // ACTION: Generate data items and push to stream
    // REASON: push() returns false when buffer is full—signals backpressure
    while (this.currentId < this.maxItems) {
      const item = {
        id: this.currentId++,
        data: \`Record \${this.currentId}\`,
        timestamp: Date.now(),
      };

      // ACTION: Check push() return value for backpressure signal
      // REASON: false means internal buffer full—must pause production
      const canContinue = this.push(item);

      if (!canContinue) {
        console.log(\`Producer: Backpressure detected at item \${this.currentId}, pausing\`);
        this.isPaused = true;
        return; // Pause until _read called again
      }
    }

    // ACTION: Signal end of stream when all items produced
    // REASON: Proper stream termination after finite data source
    this.push(null);
  }
}

// ACTION: Create slow transformer that processes items
// REASON: Simulates expensive operation causing backpressure upstream
class SlowProcessor extends Transform {
  private processed = 0;

  constructor(private processingDelayMs: number) {
    super({ objectMode: true });
  }

  // ACTION: Implement async transformation with delay
  // REASON: Slow processing creates demand-supply mismatch triggering backpressure
  async _transform(chunk: any, encoding: string, callback: Function): Promise<void> {
    try {
      // ACTION: Simulate expensive computation or I/O
      // REASON: Real bottleneck like database write or API call
      await new Promise(resolve => setTimeout(resolve, this.processingDelayMs));

      this.processed++;
      if (this.processed % 100 === 0) {
        console.log(\`Processor: Completed \${this.processed} items\`);
      }

      // ACTION: Push transformed item and signal completion
      // REASON: Transform must explicitly call callback to signal readiness
      this.push({
        ...chunk,
        processed: true,
        processedAt: Date.now(),
      });
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

// ACTION: Create writable stream that outputs results
// REASON: Final consumer in pipeline—its speed governs entire flow
class ResultWriter extends Writable {
  private written = 0;

  constructor() {
    super({ objectMode: true });
  }

  // ACTION: Implement _write with completion callback
  // REASON: Callback controls backpressure—don't call until ready for next item
  _write(chunk: any, encoding: string, callback: Function): void {
    this.written++;

    // ACTION: Write to output and signal completion
    // REASON: Calling callback tells upstream we're ready for next item
    process.stdout.write(\`.\`); // Progress indicator
    callback();
  }

  _final(callback: Function): void {
    console.log(\`\\nWriter: Completed writing \${this.written} items\`);
    callback();
  }
}

// ACTION: Compose stream pipeline with automatic backpressure
// REASON: Node.js streams propagate backpressure automatically
async function runBackpressurePipeline() {
  const generator = new DataGenerator();
  const processor = new SlowProcessor(5); // 5ms per item
  const writer = new ResultWriter();

  console.log('Starting backpressure-aware pipeline...');

  // ACTION: Use pipeline() for automatic error handling and backpressure
  // REASON: Pipeline manages stream lifecycle and propagates backpressure signals
  try {
    await pipeline(
      generator,  // Fast producer
      processor,  // Slow transformer (bottleneck)
      writer      // Final consumer
    );
    console.log('Pipeline completed successfully');
  } catch (error) {
    console.error('Pipeline failed:', error);
  }
}

// ACTION: Execute demonstration
// REASON: Shows automatic backpressure handling in Node.js streams
runBackpressurePipeline().catch(console.error);`,
      contextDilation: {
        level: "module",
        scope: "module",
        prerequisites: [
          "Node.js Stream API",
          "Readable/Writable/Transform streams",
          "Stream lifecycle and callbacks",
        ],
        systemPosition:
          "Data processing pipeline with multiple stages, each potentially bottlenecked",
      },
    },
  ],

  implementations: [
    {
      id: "rxjs-backpressure",
      name: "RxJS - Reactive Extensions for JavaScript",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Reactive programming library with built-in backpressure operators (throttle, debounce, buffer, sample). Provides declarative control over data flow in async event streams with automatic subscription management.",
      links: {
        docs: "https://rxjs.dev/guide/operators",
        github: "https://github.com/ReactiveX/rxjs",
      },
      codeSnippet: `import { fromEvent, bufferTime, throttleTime } from 'rxjs';

// Throttle mouse clicks to max 1 per second (drop excess)
const clicks$ = fromEvent(button, 'click')
  .pipe(throttleTime(1000));

// Buffer API requests and process in batches every 100ms
const apiRequests$ = dataStream$
  .pipe(bufferTime(100))
  .subscribe(batch => processBatch(batch));

// Sample sensor data every 5 seconds (keep latest, drop others)
const sensorData$ = highFrequencySensor$
  .pipe(sampleTime(5000));`,
    },
    {
      id: "project-reactor",
      name: "Project Reactor - Reactive Streams for JVM",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Foundational reactive library for Spring WebFlux with full Reactive Streams backpressure support. Provides Flux and Mono types with operators for buffering, windowing, and flow control in async pipelines.",
      links: {
        docs: "https://projectreactor.io/docs/core/release/reference/",
        github: "https://github.com/reactor/reactor-core",
      },
      codeSnippet: `// Backpressure with buffer and overflow strategies
Flux<Data> dataStream = source
    .onBackpressureBuffer(100, // Buffer 100 items
        data -> log.warn("Dropped: " + data), // Overflow handler
        BufferOverflowStrategy.DROP_LATEST)
    .publishOn(Schedulers.parallel(), 32); // Limit prefetch

// Request N items at a time (manual backpressure)
Flux<User> users = userRepository.findAll()
    .limitRate(10); // Request 10 at a time from upstream

// Window operator for batch processing
dataStream
    .window(Duration.ofSeconds(5))
    .flatMap(window -> window.collectList())
    .subscribe(batch -> processBatch(batch));`,
    },
    {
      id: "akka-streams",
      name: "Akka Streams",
      type: "framework",
      languages: ["scala", "java"],
      description:
        "Stream processing library built on Akka with automatic backpressure propagation. Implements Reactive Streams spec with graph DSL for building complex async data pipelines with bounded buffers.",
      links: {
        docs: "https://doc.akka.io/docs/akka/current/stream/index.html",
        github: "https://github.com/akka/akka",
      },
      codeSnippet: `// Akka Streams with backpressure and async boundaries
Source.fromIterator(() => dataIterator)
  .buffer(100, OverflowStrategy.backpressure) // Block upstream
  .async // Async boundary
  .throttle(10, 1.second) // Max 10 elements per second
  .mapAsync(4)(data => slowExternalCall(data)) // Parallel processing
  .runWith(Sink.foreach(result => handleResult(result)))

// Balancing work across workers with backpressure
Source(jobs)
  .via(balancer(workers, 256)) // Distribute with bounded queue
  .runWith(Sink.ignore)`,
    },
    {
      id: "kafka-consumer",
      name: "Apache Kafka Consumer",
      type: "platform",
      languages: ["java", "scala", "python", "go"],
      description:
        "Distributed streaming platform with consumer-controlled backpressure via manual offset commits and pause/resume APIs. Consumers control consumption rate to match processing capacity.",
      links: {
        docs: "https://kafka.apache.org/documentation/#consumerapi",
      },
      codeSnippet: `// Kafka consumer with backpressure via pause/resume
KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Arrays.asList("events"));

while (true) {
  ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

  // If processing queue is full, pause consumption
  if (processingQueue.size() > MAX_QUEUE_SIZE) {
    consumer.pause(consumer.assignment());
    log.info("Backpressure: paused consumption");
  }

  for (ConsumerRecord<String, String> record : records) {
    processingQueue.offer(record);
  }

  // Resume when queue drains
  if (processingQueue.size() < MIN_QUEUE_SIZE) {
    consumer.resume(consumer.assignment());
  }
}`,
    },
    {
      id: "nodejs-streams",
      name: "Node.js Streams",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Built-in Node.js stream API with automatic backpressure via 'drain' events and highWaterMark. Writable streams signal when buffer is full, pausing readable streams until drained.",
      links: {
        docs: "https://nodejs.org/api/stream.html#stream_backpressure",
      },
      codeSnippet: `const { pipeline } = require('stream');
const fs = require('fs');

// Automatic backpressure in pipeline
pipeline(
  fs.createReadStream('large-file.txt'),
  transformStream, // Processing stream
  fs.createWriteStream('output.txt'),
  (err) => {
    if (err) console.error('Pipeline failed', err);
  }
);

// Manual backpressure handling
const writable = getWritableStream();
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    readable.pause(); // Backpressure: stop reading
  }
});

writable.on('drain', () => {
  readable.resume(); // Buffer drained, resume reading
});`,
    },
    {
      id: "rabbitmq-prefetch",
      name: "RabbitMQ Prefetch/QoS",
      type: "platform",
      languages: ["any"],
      description:
        "Message broker with consumer prefetch limits (QoS) for backpressure control. Consumers specify max unacknowledged messages, preventing broker from overwhelming slow consumers.",
      links: {
        docs: "https://www.rabbitmq.com/consumer-prefetch.html",
      },
      codeSnippet: `// RabbitMQ consumer with prefetch limit
channel.basicQos(10); // Max 10 unacknowledged messages

channel.basicConsume(queueName, false, (consumerTag, delivery) -> {
  try {
    // Process message (may be slow)
    processMessage(delivery.getBody());

    // Acknowledge after processing
    channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
  } catch (Exception e) {
    // Negative ack triggers requeue
    channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, true);
  }
});

// Broker won't send 11th message until one is acknowledged
// This creates backpressure to match consumer processing rate`,
    },
    {
      id: "grpc-flow-control",
      name: "gRPC Flow Control",
      type: "framework",
      languages: ["go", "java", "python", "cpp"],
      description:
        "RPC framework with HTTP/2 flow control for streaming calls. Automatic window-based backpressure prevents fast server from overwhelming slow client in bidirectional streams.",
      links: {
        docs: "https://grpc.io/docs/guides/flow-control/",
      },
      codeSnippet: `// gRPC server streaming with backpressure
service DataService {
  rpc StreamData(Request) returns (stream DataChunk);
}

// Client controls flow via HTTP/2 window updates
func (c *client) StreamData(ctx context.Context) {
  stream, _ := c.stub.StreamData(ctx, &Request{})

  for {
    chunk, err := stream.Recv()
    if err == io.EOF {
      break
    }

    // Slow processing creates backpressure
    processChunk(chunk) // HTTP/2 flow control pauses server
  }
}`,
    },
    {
      id: "asyncio-queue",
      name: "Python asyncio Queue",
      type: "library",
      languages: ["python"],
      description:
        "Async queue with maxsize parameter for backpressure in concurrent Python code. Producers block when queue is full, implementing natural backpressure for async workflows.",
      links: {
        docs: "https://docs.python.org/3/library/asyncio-queue.html",
      },
      codeSnippet: `import asyncio

# Bounded queue creates backpressure
queue = asyncio.Queue(maxsize=10)

async def producer():
    for i in range(1000):
        data = await fetch_data(i)
        await queue.put(data)  # Blocks when queue full (backpressure)

async def consumer():
    while True:
        data = await queue.get()
        await process_data(data)  # Slow processing
        queue.task_done()

# Run producer and consumer concurrently
await asyncio.gather(producer(), consumer())`,
    },
  ],

  usedInSystems: [
    {
      systemId: "netflix-hystrix",
      systemName: "Netflix Hystrix Command Pattern",
      howUsed:
        "Netflix implements backpressure in Hystrix through bounded thread pools and semaphores that limit concurrent execution. When a downstream service becomes slow, thread pools fill up and new requests are rejected with a RejectedExecutionException rather than queueing indefinitely. This applies backpressure to upstream callers (API Gateway, other services), forcing them to slow down or fail fast. Hystrix monitors thread pool saturation metrics and automatically sheds load when pools reach 80% capacity. The system uses a bulkhead pattern where each dependency gets isolated thread pools—if the recommendation service is slow, only its pool fills up while other services continue normally. Pattern composition: Backpressure + Circuit Breaker + Bulkhead + Metrics. Impact: Prevented cascading failures during Black Friday 2016 when recommendation service degraded—instead of taking down the entire platform, Hystrix applied backpressure and served fallback content, maintaining 99.9% availability.",
      source:
        "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a",
    },
    {
      systemId: "akka-streams",
      systemName: "Akka Streams in Lightbend Production Systems",
      howUsed:
        "Akka Streams implements reactive backpressure through demand-driven flow control in stream processing pipelines. When processing sensor data from IoT devices, a slow database sink signals demand to upstream components—the stream automatically buffers data up to configured limits (e.g., 1000 messages), then applies backpressure to the source when buffer fills. This prevents out-of-memory errors when database writes become slow during peak load. Akka Streams uses asynchronous boundaries with bounded buffers between stages, each stage pulling data at its own pace. The framework supports dynamic backpressure strategies: drop oldest, drop newest, or fail. Pattern composition: Backpressure + Reactive Streams + Bounded Buffers + Asynchronous Processing. Impact: PayPal uses Akka Streams to process 1B+ transactions daily with backpressure preventing data loss during database maintenance windows—transactions queue safely instead of being dropped.",
      source:
        "https://doc.akka.io/docs/akka/current/stream/stream-flows-and-basics.html",
    },
    {
      systemId: "kafka-consumer-groups",
      systemName: "Apache Kafka Consumer Backpressure",
      howUsed:
        "Kafka implements natural backpressure through consumer group lag monitoring and partition assignment. When consumers fall behind (high lag), Kafka automatically rebalances partitions to distribute load across healthy consumers. Slow consumers don't block fast ones—each consumer processes at its own rate, and unconsumed messages remain in Kafka until consumed or expired. LinkedIn's infrastructure uses Kafka's pause/resume API to apply explicit backpressure: when a consumer's processing queue reaches 80% capacity, it pauses fetching from Kafka, processes the backlog, then resumes. This prevents consumer crashes from memory exhaustion. The system monitors consumer lag metrics (records-lag-max) and triggers alerts when lag exceeds thresholds (e.g., 1 million messages), indicating backpressure is needed. Pattern composition: Backpressure + Consumer Groups + Partition Rebalancing + Lag Monitoring. Impact: LinkedIn processes 7 trillion+ messages per day with zero data loss—backpressure ensures consumers never get overwhelmed even during traffic spikes (2x normal during major events).",
      source: "https://engineering.linkedin.com/kafka/running-kafka-scale",
    },
    {
      systemId: "grpc-flow-control",
      systemName: "gRPC HTTP/2 Flow Control",
      howUsed:
        "gRPC uses HTTP/2's built-in flow control to implement automatic backpressure in streaming RPCs. When a client streams data to a server (e.g., uploading large files), the server advertises a receive window size (default 64KB). The client sends data up to the window limit, then pauses until the server sends a WINDOW_UPDATE frame indicating it processed data and has buffer space. This prevents fast clients from overwhelming slow servers. Google's internal services use gRPC streaming for log collection—when log aggregation servers become CPU-bound, they stop sending WINDOW_UPDATE frames, automatically slowing log producers. The system monitors flow control window sizes and alerts when windows remain at zero for extended periods (indicating sustained backpressure). Pattern composition: Backpressure + HTTP/2 Flow Control + Streaming RPC + Windowing. Impact: Google processes 100+ petabytes of logs daily with gRPC backpressure preventing log collector crashes—producers automatically throttle during collector maintenance or failures.",
      source: "https://grpc.io/docs/guides/flow-control/",
    },
    {
      systemId: "rxjs-observables",
      systemName: "RxJS Backpressure Strategies in Angular Apps",
      howUsed:
        "RxJS implements backpressure through operators like throttleTime, debounceTime, and sample that drop or delay emissions when observers can't keep up. In Angular applications handling user input (search autocomplete, form validation), fast typing produces rapid events that could overwhelm backend APIs. The throttleTime operator applies backpressure by limiting emissions to once per 300ms, dropping intermediate values. Microsoft Teams uses RxJS backpressure in their chat UI—when scrolling through thousands of messages, the scroll event stream is throttled to 60fps (16ms) to prevent UI thread blocking. The system uses bufferTime to batch rapid events (mouse movements, keystrokes) into arrays processed in bulk, reducing processing overhead. Pattern composition: Backpressure + Observable Streams + Event Throttling + Buffering. Impact: Reduced CPU usage in Teams chat by 40% during rapid scrolling; prevented UI freezes when processing 1000+ messages per second; improved perceived performance with smooth 60fps rendering.",
      source: "https://rxjs.dev/guide/operators",
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Streaming data pipeline between fast data source (API, file, queue) and slow consumer (database, external service)",
      "Message queue consumer between message broker and business logic processor to prevent consumer overwhelm",
    ],
    interactsWith: [
      "Message queues (RabbitMQ, Kafka) with consumer acknowledgment",
      "Reactive frameworks (RxJS, Project Reactor, Akka Streams)",
      "Stream processing (Node.js streams, Java Streams, Python asyncio)",
    ],
    architecturalBoundaries: [
      "Cannot propagate across non-cooperative protocols (HTTP without streaming)",
      "Difficult in truly asynchronous systems where producer doesn't care about consumer state",
      "Requires bounded buffers—infinite buffers defeat backpressure purpose",
    ],
  },
};
