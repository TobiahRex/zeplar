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
        scope: "local",
        dilation: 2,
        prerequisites: [
          "RxJS Observable basics",
          "Async/await in TypeScript",
          "Producer-consumer pattern fundamentals",
        ],
        systemPosition:
          "Stream processing layer between fast data source and slow consumer",
      },
      annotations: [
        {
          startLine: 10,
          endLine: 14,
          action: "Define data item interface",
          reason: "Type safety for items flowing through backpressure system",
          highlightedConcepts: ["structure"],
        },
        {
          startLine: 21,
          endLine: 25,
          action: "Implement request(n) demand signaling",
          reason:
            "Consumer controls flow by telling producer how many items it can handle",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 28,
          endLine: 39,
          action: "Producer respects demand count",
          reason: "Prevents overflow by pausing production when demand is zero",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 50,
          endLine: 58,
          action: "Simulate slow consumer with processing delay",
          reason:
            "Represents real bottleneck like database writes or API calls",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 69,
          endLine: 79,
          action: "mergeMap with concurrency limit",
          reason:
            "RxJS operator enforces backpressure by limiting parallel operations",
          highlightedConcepts: ["behavior"],
        },
      ],
      highlights: [
        {
          concept: "structure",
          description:
            "BackpressureSource class with demand tracking and buffering",
        },
        {
          concept: "behavior",
          description:
            "Demand-driven flow control via request(n) and conditional emission",
        },
        {
          concept: "behavior",
          description:
            "Concurrency limiting in mergeMap prevents consumer overwhelm",
        },
      ],
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
        scope: "module",
        dilation: 3,
        prerequisites: [
          "Node.js Stream API",
          "Readable/Writable/Transform streams",
          "Stream lifecycle and callbacks",
        ],
        systemPosition:
          "Data processing pipeline with multiple stages, each potentially bottlenecked",
      },
      annotations: [
        {
          startLine: 17,
          endLine: 21,
          action: "_read() method implementation",
          reason:
            "Node.js calls this when downstream ready—signal to resume production",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 31,
          endLine: 37,
          action: "Check push() return value",
          reason:
            "false signals internal buffer full—must pause until _read called",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 59,
          endLine: 75,
          action: "Async transformation with callback",
          reason:
            "Slow processing triggers backpressure—callback controls flow",
          highlightedConcepts: ["behavior"],
        },
        {
          startLine: 123,
          endLine: 128,
          action: "pipeline() composes streams",
          reason:
            "Automatic backpressure propagation from slow consumer to fast producer",
          highlightedConcepts: ["structure", "behavior"],
        },
      ],
      highlights: [
        {
          concept: "structure",
          description:
            "Three-stage pipeline: DataGenerator → SlowProcessor → ResultWriter",
        },
        {
          concept: "behavior",
          description:
            "Automatic backpressure via push() return value and _read() calls",
        },
        {
          concept: "behavior",
          description:
            "Callback-based flow control in Transform and Writable streams",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      {
        scenario: "Streaming data pipeline",
        placement:
          "Between fast data source (API, file, queue) and slow consumer (database, external service)",
        reasoning:
          "Prevents memory overflow when producer consistently faster than consumer",
      },
      {
        scenario: "Message queue consumer",
        placement:
          "Between message broker and business logic processor to prevent consumer overwhelm",
        reasoning:
          "Broker can deliver messages faster than application can process them",
      },
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
