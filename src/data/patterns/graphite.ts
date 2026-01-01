import type { Pattern } from "../schema";

export const graphite: Pattern = {
  id: "graphite",
  slug: "graphite",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 📉 Time-Series Storage",

  hierarchy: {
    quality: "observability",
    strategy: "Metrics Collection",
    family: "Time-Series Databases",
    level: 4,
  },

  concept: {
    name: "Graphite",
    emoji: "📉",
    tagline: "Fixed-size time-series storage with automatic rollup aggregation",
    definition:
      "Graphite is a battle-tested time-series database and visualization system designed for storing, retrieving, and graphing numeric metrics that change over time. At its core, Graphite consists of three components working in concert: Carbon (a daemon that receives metrics over a simple text protocol and writes them to disk), Whisper (a fixed-size database format that stores time-series data in round-robin archives), and the Graphite Web application (a Django-based interface for querying and visualizing metrics). The system's defining characteristic is its fixed-size database architecture—when you create a metric, you define retention policies upfront (for example, '10-second resolution for 6 hours, 1-minute resolution for 7 days, 10-minute resolution for 1 year'), and Whisper automatically aggregates older data into coarser granularities to maintain constant storage size. Metrics are organized hierarchically with dot-separated names like 'servers.web01.cpu.usage', enabling pattern-based queries that aggregate across multiple servers. Carbon accepts metrics via a dead-simple plaintext protocol over TCP or UDP: 'metric_name value timestamp', making instrumentation trivial from any programming language. The Graphite web interface provides a function-rich query language for transformations like 'sumSeries(servers.*.requests)' to aggregate request counts across all servers, or 'movingAverage(api.response_time, 60)' to smooth noisy metrics. Graphite's power lies in its simplicity and predictability—fixed storage means no database growth surprises, automatic rollups mean no manual data cleanup, and the plaintext protocol means trivial integration.",
    problemSolved:
      "Before specialized time-series databases, engineering teams faced a painful tradeoff when monitoring infrastructure and applications: either store every metric data point and watch storage costs explode while query performance degraded, or implement complex application-level aggregation and risk losing critical granular data during incidents. Traditional relational databases like MySQL or PostgreSQL were never designed for time-series workloads—they struggle with the write-heavy pattern of metrics ingestion (thousands of inserts per second), inefficiently store redundant timestamps, and lack time-based retention policies forcing manual data deletion. Graphite solves this by providing a purpose-built system with automatic aggregation and bounded storage. The Whisper database format uses round-robin archives where old data is automatically downsampled: minute-by-minute CPU metrics from last week are still available as hourly averages without consuming more disk space. This eliminates the operational burden of database growth management while maintaining long-term trend visibility. The hierarchical metric naming enables intuitive organization and powerful wildcard queries—tracking 'servers.*.disk.usage' automatically includes new servers without configuration changes. Graphite's UDP protocol support allows fire-and-forget metric emission that never blocks application code, even if the metrics system is down. The combination of fixed storage, automatic aggregation, simple protocol, and flexible querying made Graphite the foundation of monitoring at companies like Etsy, GitHub, and Spotify in the 2010s. Without Graphite (or similar tools), teams resort to sampling metrics, accepting data loss, or building custom aggregation pipelines—all approaches that fail during the high-traffic incidents when complete data is most critical.",
    tradeoffs: {
      pros: [
        "Fixed-size database with automatic rollup aggregation provides completely predictable storage costs and eliminates database growth management",
        "Extremely fast time-range queries because Whisper stores data sequentially in time order on disk, enabling efficient sequential reads",
        "Dead-simple plaintext protocol (metric value timestamp) makes instrumentation trivial from any language without dependencies or libraries",
        "Hierarchical dot-notation metric naming enables intuitive organization and powerful pattern-based queries using wildcards",
        "Built-in graphing interface provides immediate visualization without needing separate dashboarding tools",
        "UDP protocol support allows fire-and-forget metric emission that never blocks application threads",
      ],
      cons: [
        "Fixed retention policies must be defined upfront and cannot be changed without losing historical data or manual migration",
        "Limited aggregation functions (average, sum, min, max) compared to modern databases that support percentiles and statistical operations",
        "Whisper's one-metric-per-file design can cause filesystem performance issues with millions of unique metrics on ext3/ext4",
        "No built-in authentication or encryption in Carbon protocol requires external security layers for production use",
        "Horizontal scaling requires manual sharding and relay configuration unlike modern databases with automatic clustering",
        "Eventual consistency issues when using Carbon relays can cause transient data inconsistencies during network partitions",
      ],
    },
    relatedPatterns: [
      "influxdb",
      "prometheus",
      "statsd",
      "grafana",
      "red-method",
      "use-method",
    ],
  },

  structure: {
    participants: [
      {
        name: "Application",
        role: "Metric Producer",
        responsibilities: [
          "Emit metrics using plaintext protocol (metric_name value timestamp)",
          "Send metrics to Carbon daemon via TCP or UDP",
          "Organize metrics hierarchically using dot-notation naming",
        ],
      },
      {
        name: "Carbon Daemon",
        role: "Metric Receiver and Storage Writer",
        responsibilities: [
          "Listen for incoming metrics on configured port (default 2003)",
          "Parse plaintext metric protocol and validate data",
          "Write metrics to Whisper database files on disk",
          "Relay metrics to other Carbon instances for replication",
        ],
      },
      {
        name: "Whisper Database",
        role: "Fixed-Size Time-Series Storage",
        responsibilities: [
          "Store time-series data in fixed-size round-robin archives",
          "Automatically aggregate old data into coarser retention tiers",
          "Provide fast time-range reads via sequential file access",
          "Maintain configured retention policies per metric",
        ],
      },
      {
        name: "Graphite Web",
        role: "Query Interface and Visualization",
        responsibilities: [
          "Accept metric queries via HTTP API",
          "Execute render queries with function transformations",
          "Aggregate data across multiple metrics using wildcards",
          "Generate graphs and return data in JSON, CSV, or image formats",
        ],
      },
      {
        name: "StatsD (Optional)",
        role: "Aggregation Proxy",
        responsibilities: [
          "Receive high-frequency metrics via UDP from applications",
          "Aggregate counters, timers, and gauges locally",
          "Flush aggregated metrics to Carbon at regular intervals",
          "Reduce write load on Graphite backend",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant App as Application
    participant StatsD as StatsD (Optional)
    participant Carbon as Carbon Daemon
    participant Whisper as Whisper DB
    participant Web as Graphite Web

    Note over App,Web: Metric Ingestion Flow

    App->>StatsD: UDP: api.requests:1|c<br/>(fire-and-forget counter)
    App->>Carbon: TCP: servers.web01.cpu 45.2 1234567890<br/>(direct metric)

    StatsD->>StatsD: Aggregate metrics<br/>for 10 seconds
    StatsD->>Carbon: Flush: api.requests 1247 1234567890

    Carbon->>Whisper: Write metric to<br/>round-robin archive
    Whisper->>Whisper: Store in appropriate<br/>retention tier

    Note over Whisper: Automatic Aggregation:<br/>10s→1min→10min→1hour

    Note over App,Web: Query Flow

    Web->>Whisper: Query: servers.*.cpu<br/>from=-6hours
    Whisper-->>Web: Return time-series data<br/>at appropriate resolution
    Web->>Web: Apply functions:<br/>sumSeries, movingAverage
    Web-->>App: JSON/PNG response<br/>with rendered graph`,
    flow: [
      {
        step: 1,
        actor: "Application",
        action: "Emit Metric",
        description:
          "Application sends metric using plaintext protocol: 'metric_name value timestamp' via TCP or UDP to Carbon daemon",
      },
      {
        step: 2,
        actor: "Carbon Daemon",
        action: "Receive and Parse",
        description:
          "Carbon listens on port 2003, parses incoming metric line, validates format and extracts metric name, value, and timestamp",
      },
      {
        step: 3,
        actor: "Carbon Daemon",
        action: "Route to Storage",
        description:
          "Carbon determines appropriate Whisper database file based on metric name (one file per metric), creates file if it doesn't exist",
      },
      {
        step: 4,
        actor: "Whisper Database",
        action: "Write to Round-Robin Archive",
        description:
          "Whisper writes data point to appropriate retention tier based on timestamp, automatically aggregating older data into coarser resolutions",
      },
      {
        step: 5,
        actor: "Whisper Database",
        action: "Automatic Rollup",
        description:
          "Whisper aggregates data from higher-resolution tier (10-second) into lower-resolution tiers (1-minute, 10-minute) according to retention policy",
      },
      {
        step: 6,
        actor: "Graphite Web",
        action: "Query Request",
        description:
          "User or dashboard sends render query to Graphite Web API with metric pattern, time range, and optional functions",
      },
      {
        step: 7,
        actor: "Graphite Web",
        action: "Fetch from Whisper",
        description:
          "Graphite Web reads time-series data from Whisper files matching metric pattern (supports wildcards like servers.*.cpu)",
      },
      {
        step: 8,
        actor: "Graphite Web",
        action: "Apply Functions",
        description:
          "Execute query functions like sumSeries, movingAverage, or scale to transform raw time-series data before returning",
      },
      {
        step: 9,
        actor: "Graphite Web",
        action: "Return Response",
        description:
          "Return processed data as JSON, CSV, or rendered PNG graph to client application or dashboard",
      },
    ],
    invariants: [
      "Whisper database files have fixed size determined by retention policy, never grow unbounded",
      "Each unique metric name maps to exactly one Whisper database file on disk",
      "Data points are automatically aggregated from high-resolution to low-resolution tiers as they age",
      "Metric names follow hierarchical dot-notation convention (component.host.metric)",
      "Carbon daemon must have exclusive write access to Whisper files (no concurrent writers)",
      "Retention policies cannot be changed after Whisper file creation without data migration",
    ],
  },

  codeExamples: [
    {
      id: "graphite-python-client",
      language: "python",
      title: "Sending Metrics to Graphite from Python",
      description:
        "Python application emitting metrics to Graphite using plaintext protocol over TCP socket",
      code: `import socket
import time
from typing import Union

class GraphiteClient:
    """
    Simple Graphite client for sending metrics via plaintext protocol.

    Graphite expects metrics in the format:
    metric_path value timestamp\\n

    Example: servers.web01.cpu.usage 45.2 1609459200\\n
    """

    def __init__(self, host: str = 'localhost', port: int = 2003):
        """
        Initialize Graphite client.

        Args:
            host: Carbon daemon hostname
            port: Carbon plaintext receiver port (default 2003)
        """
        self.host = host
        self.port = port
        self.sock = None

    def connect(self):
        """Establish TCP connection to Carbon daemon."""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((self.host, self.port))
            print(f"Connected to Graphite at {self.host}:{self.port}")
        except Exception as e:
            print(f"Failed to connect to Graphite: {e}")
            raise

    def send_metric(self, metric_path: str, value: Union[int, float], timestamp: int = None):
        """
        Send a single metric to Graphite.

        Args:
            metric_path: Dot-separated metric name (e.g., 'servers.web01.cpu.usage')
            value: Numeric metric value
            timestamp: Unix timestamp (defaults to current time)
        """
        if timestamp is None:
            timestamp = int(time.time())

        # Format: metric_path value timestamp\\n
        message = f"{metric_path} {value} {timestamp}\\n"

        try:
            if self.sock is None:
                self.connect()

            self.sock.sendall(message.encode('utf-8'))
            print(f"Sent metric: {message.strip()}")
        except Exception as e:
            print(f"Failed to send metric: {e}")
            # Attempt to reconnect on next send
            self.sock = None
            raise

    def send_metrics_batch(self, metrics: list[tuple[str, Union[int, float], int]]):
        """
        Send multiple metrics in a single TCP transmission.

        Args:
            metrics: List of tuples (metric_path, value, timestamp)
        """
        if self.sock is None:
            self.connect()

        # Build batch message
        message = ""
        for metric_path, value, timestamp in metrics:
            message += f"{metric_path} {value} {timestamp}\\n"

        try:
            self.sock.sendall(message.encode('utf-8'))
            print(f"Sent {len(metrics)} metrics in batch")
        except Exception as e:
            print(f"Failed to send batch: {e}")
            self.sock = None
            raise

    def close(self):
        """Close connection to Graphite."""
        if self.sock:
            self.sock.close()
            self.sock = None
            print("Disconnected from Graphite")


# Example usage: Monitoring web server metrics
if __name__ == "__main__":
    client = GraphiteClient(host='graphite.example.com', port=2003)

    # Metric naming convention: component.host.metric
    host = "web01"
    timestamp = int(time.time())

    # Send individual metrics
    client.send_metric(f"servers.{host}.cpu.usage", 45.2, timestamp)
    client.send_metric(f"servers.{host}.memory.used", 2048, timestamp)
    client.send_metric(f"servers.{host}.disk.free", 50000, timestamp)

    # Send batch of metrics (more efficient)
    metrics_batch = [
        (f"servers.{host}.network.bytes_in", 1024000, timestamp),
        (f"servers.{host}.network.bytes_out", 512000, timestamp),
        (f"servers.{host}.network.packets_in", 5000, timestamp),
        (f"servers.{host}.network.packets_out", 3000, timestamp),
    ]
    client.send_metrics_batch(metrics_batch)

    # Application-level metrics
    client.send_metric("application.api.requests", 1247, timestamp)
    client.send_metric("application.api.response_time", 245, timestamp)
    client.send_metric("application.api.errors", 5, timestamp)

    client.close()`,
      runnable: false,
      contextDilation: {
        level: "module",
        scope:
          "Production-ready Graphite client implementing plaintext protocol for metric emission",
        prerequisites: [
          "TCP sockets",
          "Unix timestamps",
          "Metric naming conventions",
        ],
        systemPosition:
          "Instrumentation layer in application that emits operational metrics to Graphite monitoring system",
      },
      annotations: [
        {
          id: "graphite-protocol",
          lines: [9, 14],
          action: "Define Graphite plaintext protocol format",
          reason:
            "Graphite expects simple text format 'metric_path value timestamp\\n' making it trivial to implement clients in any language without libraries",
          contextLevel: "module",
        },
        {
          id: "graphite-tcp-connection",
          lines: [28, 36],
          action: "Establish persistent TCP connection to Carbon daemon",
          reason:
            "TCP provides reliable delivery and connection reuse for efficient metric transmission, though UDP is also supported for fire-and-forget semantics",
          contextLevel: "module",
        },
        {
          id: "graphite-metric-naming",
          lines: [85, 88],
          action: "Use hierarchical dot-notation for metric organization",
          reason:
            "Convention 'component.host.metric' enables powerful wildcard queries like 'servers.*.cpu.usage' to aggregate across all servers",
          contextLevel: "system",
        },
      ],
      highlights: [
        {
          lines: [9, 14],
          label: "Simple plaintext protocol specification",
          sbvpDomain: "structure",
        },
        {
          lines: [38, 56],
          label: "Metric emission with automatic timestamp",
          sbvpDomain: "behavior",
        },
        {
          lines: [85, 102],
          label:
            "Example metric naming convention following Graphite best practices",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Metrics Storage Backend - Graphite serves as the long-term storage and query engine for time-series metrics, positioned behind aggregation layers like StatsD or Collectd. Applications and infrastructure tools send metrics to intermediary aggregators which batch and forward to Graphite's Carbon daemon. The Whisper database stores metrics on disk with automatic rollup aggregation, while Graphite Web provides HTTP API for dashboards (Grafana, custom UIs) to query and visualize data. Common architecture: Application → StatsD (UDP aggregation) → Carbon → Whisper → Graphite Web API → Grafana dashboard. This placement isolates applications from storage details and reduces write load through aggregation.",

      "Multi-Tier Monitoring Infrastructure - Large deployments use Graphite in hierarchical configurations with carbon-relay for sharding and carbon-cache clusters for write scaling. Metrics flow through multiple tiers: edge relays receive metrics and shard across backend carbon-cache instances based on consistent hashing of metric names. Each carbon-cache writes to local Whisper databases, while graphite-web federates queries across the cluster. This architecture scales to millions of metrics per second by distributing both ingestion and storage. Example: Etsy's architecture used 100+ carbon-cache nodes behind carbon-relay clusters to handle infrastructure and application metrics at massive scale.",

      "Integration with StatsD Aggregation Layer - Graphite is commonly paired with StatsD as a two-tier metrics pipeline: applications emit high-frequency events (counters, timers, gauges) to local StatsD instances via UDP fire-and-forget. StatsD aggregates metrics every 10 seconds (configurable flush interval) and sends aggregated summaries to Graphite. This dramatically reduces Graphite write load: 1000 application requests/sec become a single counter metric to Graphite every 10 seconds. StatsD automatically calculates timer percentiles (p50, p95, p99) and rate metrics from counters before forwarding to Graphite. Used extensively at GitHub, Flickr, and Etsy.",

      "Grafana Data Source for Visualization - Graphite serves as a native data source for Grafana dashboards, providing the query backend while Grafana handles visualization, alerting, and multi-datasource correlation. Teams configure Grafana to query Graphite's HTTP API using Graphite's function-rich query language (sumSeries, movingAverage, derivative). This separation of concerns allows Graphite to focus on efficient time-series storage while Grafana provides user-friendly dashboarding. Common in organizations migrating from Graphite's built-in graphing to Grafana's more powerful visualization capabilities.",
    ],
    architecturalBoundaries: [
      "Metric Ingestion Layer - Carbon daemon serves as the ingestion boundary, accepting metrics via plaintext protocol (TCP port 2003) or pickle protocol (TCP port 2004 for Python pickled data). Carbon provides pluggable aggregation, relay, and caching components: carbon-aggregator pre-aggregates metrics based on rules before storage, carbon-relay shards metrics across multiple carbon-cache instances, and carbon-cache writes to Whisper databases. This boundary isolates applications from storage implementation, enabling operational changes (sharding, replication) without application changes.",

      "Storage and Retention Tier - Whisper database files define the retention boundary, with each metric stored in a fixed-size round-robin database file. Retention policies configured per metric pattern determine granularity and duration: 10-second resolution for 6 hours → 1-minute resolution for 7 days → 10-minute resolution for 1 year. Data automatically ages from high-resolution to low-resolution tiers. This boundary ensures bounded storage growth and automatic data lifecycle management, critical for operating at scale without manual intervention.",

      "Query and Visualization API - Graphite Web provides HTTP API boundary for metric queries and graph rendering. The /render endpoint accepts queries with metric patterns (wildcards supported), time ranges, and function transformations. Functions like sumSeries(), movingAverage(), and aliasByNode() enable powerful data transformations at query time. API returns data in multiple formats (JSON, CSV, PNG) for consumption by dashboards, alerting systems, or custom applications. This boundary separates storage from presentation, allowing multiple visualization tools (Grafana, custom dashboards) to leverage Graphite's storage.",

      "Federation and Clustering Boundary - Carbon-relay provides the sharding and federation boundary for horizontal scaling. Relay uses consistent hashing to distribute metrics across multiple carbon-cache backend instances based on metric name. Each backend stores a subset of metrics in local Whisper databases. Graphite-web federates queries across backends to provide unified query interface. This boundary enables scaling from single-node deployments to distributed clusters handling millions of metrics without application awareness of the topology.",
    ],
    interactsWith: [
      "statsd",
      "grafana",
      "collectd",
      "diamond",
      "influxdb",
      "prometheus",
      "alerting-systems",
    ],
  },

  implementations: [
    {
      id: "graphite-project",
      name: "Graphite Project (Official)",
      type: "platform",
      languages: ["python"],
      description:
        "The official Graphite project consisting of Carbon (metric ingestion daemon), Whisper (time-series database), and Graphite Web (Django-based query API and visualization). Battle-tested at scale by companies like Etsy, GitHub, and Booking.com. Supports clustering via carbon-relay and carbon-aggregator for large deployments.",
      links: {
        docs: "https://graphite.readthedocs.io/",
        github: "https://github.com/graphite-project/graphite-web",
      },
      codeSnippet: `# Install Graphite components
pip install graphite-web carbon whisper

# Configure Carbon storage schemas (/opt/graphite/conf/storage-schemas.conf)
[default]
pattern = .*
retentions = 10s:6h,1min:7d,10min:1y

# Configure Carbon aggregation rules (/opt/graphite/conf/storage-aggregation.conf)
[min]
pattern = \\.min$
aggregationMethod = min

[max]
pattern = \\.max$
aggregationMethod = max

[sum]
pattern = \\.count$
aggregationMethod = sum

[default_average]
pattern = .*
aggregationMethod = average

# Start Carbon daemon
carbon-cache.py --config=/opt/graphite/conf/carbon.conf start

# Send metrics via plaintext protocol
echo "servers.web01.cpu 45.2 \`date +%s\`" | nc graphite.example.com 2003

# Query via Graphite Web API
curl "http://graphite.example.com/render?target=servers.*.cpu&from=-6hours&format=json"

# Key features:
# - Fixed-size Whisper databases with automatic rollup
# - Plaintext and pickle protocols for metric ingestion
# - Powerful query language with 100+ functions
# - Horizontal scaling via carbon-relay clustering
#
# When to use:
# - Need predictable storage costs with automatic data aggregation
# - Simple metric ingestion without complex data models
# - Integration with StatsD or Collectd aggregation layers
# - Teams comfortable with Python ecosystem and Django`,
    },
    {
      id: "go-carbon",
      name: "go-carbon (High-Performance Carbon)",
      type: "platform",
      languages: ["go"],
      description:
        "High-performance drop-in replacement for Python Carbon daemon written in Go. Provides 10x write throughput compared to Python Carbon while maintaining protocol compatibility. Includes built-in carbonserver for efficient metric reads without graphite-web. Used in production at Booking.com and other high-scale deployments.",
      links: {
        github: "https://github.com/go-graphite/go-carbon",
        docs: "https://github.com/go-graphite/go-carbon/wiki",
      },
      codeSnippet: `# Install go-carbon
go install github.com/go-graphite/go-carbon@latest

# Configuration (go-carbon.conf)
[common]
user = "carbon"
graph-prefix = "carbon.agents.{host}"
metric-endpoint = "local"
max-cpu = 4

[whisper]
data-dir = "/var/lib/graphite/whisper"
schemas-file = "/etc/go-carbon/storage-schemas.conf"
aggregation-file = "/etc/go-carbon/storage-aggregation.conf"

[cache]
max-size = 1000000
write-strategy = "max"

[udp]
listen = ":2003"
enabled = true

[tcp]
listen = ":2003"
enabled = true

[carbonserver]
listen = "127.0.0.1:8080"
enabled = true
# Enables direct metric reads without graphite-web

[carbonlink]
listen = "127.0.0.1:7002"
enabled = true

# Start go-carbon
go-carbon -config /etc/go-carbon/go-carbon.conf

# Performance characteristics:
# - 10x write throughput vs Python Carbon
# - Lower memory footprint (Go vs Python)
# - Built-in carbonserver reduces query latency
# - Compatible with existing Whisper databases
#
# When to use:
# - Need high metric ingestion rates (>100k metrics/sec)
# - Want to reduce infrastructure costs through efficiency
# - Drop-in replacement for existing Graphite deployments
# - Teams comfortable with Go ecosystem`,
    },
    {
      id: "statsd-graphite",
      name: "StatsD with Graphite Backend",
      type: "library",
      languages: ["javascript"],
      description:
        "Etsy's StatsD daemon designed specifically to aggregate metrics before sending to Graphite. Receives high-frequency application metrics via UDP, aggregates locally, and flushes summaries to Graphite every 10 seconds. Dramatically reduces Graphite write load while providing fire-and-forget metric emission for applications.",
      links: {
        github: "https://github.com/statsd/statsd",
        docs: "https://github.com/statsd/statsd/blob/master/docs/graphite.md",
      },
      codeSnippet: `// StatsD configuration for Graphite backend (config.js)
{
  graphitePort: 2003,
  graphiteHost: "graphite.example.com",
  port: 8125,
  backends: [ "./backends/graphite" ],

  // Flush aggregated metrics every 10 seconds
  flushInterval: 10000,

  // Graphite-specific options
  graphite: {
    legacyNamespace: false,
    globalPrefix: "stats",
    prefixCounter: "counters",
    prefixTimer: "timers",
    prefixGauge: "gauges",
    prefixSet: "sets"
  }
}

// Application sends metrics to StatsD
const StatsD = require('node-statsd');
const client = new StatsD({
  host: 'localhost',
  port: 8125
});

// High-frequency counters (aggregated by StatsD)
app.get('/api/users', (req, res) => {
  client.increment('api.requests');
  client.increment('api.users.requests');

  const start = Date.now();
  // ... handle request ...
  const duration = Date.now() - start;

  // Timers automatically calculate percentiles
  client.timing('api.users.response_time', duration);

  res.json(users);
});

// Gauges for current values
client.gauge('api.connections.active', server.connections);

// StatsD aggregates and flushes to Graphite:
// - counters: api.requests → rate per second
// - timers: api.users.response_time → mean, p50, p95, p99, max
// - gauges: api.connections.active → current value

// Key benefits:
// - 1000 requests/sec → 1 Graphite metric every 10s
// - Automatic percentile calculation for timers
// - UDP fire-and-forget never blocks application
// - Aggregation layer protects Graphite from write storms
#
# When to use:
# - High-frequency application metrics (>100 events/sec)
# - Need percentile calculations for latency metrics
# - Want to protect Graphite from write load spikes
# - Fire-and-forget metric emission semantics`,
    },
  ],

  usedInSystems: [
    {
      systemId: "etsy-monitoring",
      systemName: "Etsy Infrastructure Monitoring",
      howUsed:
        "Etsy pioneered the Graphite + StatsD architecture for monitoring their e-commerce platform serving millions of users. They developed StatsD specifically to aggregate application metrics before sending to Graphite, solving the problem of overwhelming their metrics backend during traffic spikes. Every web server, worker, and application component emits metrics via StatsD using UDP fire-and-forget semantics—request counts, latency timers, error rates, business metrics like checkout conversion rates. StatsD aggregates these high-frequency events (thousands per second) and flushes summaries to Graphite every 10 seconds. Etsy's Graphite deployment uses carbon-relay for sharding across 100+ carbon-cache instances, storing metrics in Whisper databases with tiered retention: 10-second resolution for 6 hours, 1-minute for 1 week, 10-minute for 1 year. They use Graphite's query API with custom dashboards to visualize system health, correlate deployments with error spikes, and track business KPIs. The architecture proved so successful that both StatsD and Graphite became industry standards, adopted by GitHub, Flickr, and hundreds of other companies. Pattern composition: StatsD (aggregation) + Graphite (storage) + Custom Dashboards (visualization). Impact: Enabled real-time monitoring at scale without performance impact on application servers; reduced Graphite write load by 100x through aggregation; provided deployment-to-production visibility in under 30 seconds.",
      source:
        "https://codeascraft.com/2011/02/15/measure-anything-measure-everything/",
    },
    {
      systemId: "github-monitoring",
      systemName: "GitHub Infrastructure Monitoring",
      howUsed:
        "GitHub uses Graphite as their primary metrics storage backend for monitoring Git operations, web traffic, API requests, and infrastructure health across thousands of servers. They deploy Graphite in a clustered configuration with carbon-relay instances that shard metrics across multiple carbon-cache backends using consistent hashing. Each backend writes to local Whisper databases, and graphite-web federates queries across the cluster. GitHub instruments their Rails application using custom metrics libraries that emit to local StatsD instances, which aggregate and forward to Graphite. They track critical metrics like Git clone rates, repository creation rates, webhook delivery latency, and background job queue depths. Graphite's hierarchical metric naming enables queries like 'servers.github-*.git.clone_count' to aggregate clone operations across all Git servers. They use Graphite's retention policies to balance storage costs with data granularity: high-resolution metrics for recent data, hourly summaries for historical trends. During the 2018 MySQL cluster incident, Graphite metrics were crucial for understanding the failure progression and verifying recovery. The system handles millions of metrics with predictable storage costs due to Whisper's fixed-size databases. Pattern composition: Application Instrumentation + StatsD Aggregation + Clustered Graphite + Federated Queries. Impact: Provided complete visibility into GitHub's distributed infrastructure; enabled rapid incident detection and debugging; supported capacity planning through historical trend analysis.",
      source: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
    },
    {
      systemId: "booking-monitoring",
      systemName: "Booking.com Observability Platform",
      howUsed:
        "Booking.com operates one of the world's largest Graphite deployments, ingesting over 5 million metrics per second from their global hotel booking platform. They use go-carbon (high-performance Go implementation) instead of Python Carbon to achieve 10x write throughput with lower resource consumption. Their architecture uses multiple tiers of carbon-relay instances that shard metrics based on metric name prefixes across hundreds of go-carbon backend instances. Each go-carbon instance writes to local Whisper databases with carefully tuned retention policies balancing granularity and storage: 1-second resolution for 1 hour (real-time debugging), 10-second for 6 hours (recent incidents), 1-minute for 7 days (weekly patterns), 10-minute for 90 days (trend analysis). They instrument everything: application latency, database query performance, cache hit rates, payment gateway response times, A/B test metrics, and business KPIs like booking conversion rates. Grafana dashboards query Graphite's HTTP API to visualize metrics across different dimensions (region, device type, user segment). The system's reliability is critical—metrics data helps detect anomalies before they impact customers and provides incident response teams with the data needed for rapid troubleshooting. Booking.com contributed improvements back to the go-carbon project based on their scale requirements. Pattern composition: High-Frequency Instrumentation + go-carbon Clustering + Whisper Storage + Grafana Visualization + Automated Alerting. Impact: Achieved 5M metrics/sec ingestion with predictable costs; reduced incident detection time from minutes to seconds; enabled data-driven A/B testing and capacity planning.",
      source:
        "https://github.com/go-graphite/go-carbon (Booking.com contributions)",
    },
  ],

  philosophy: {
    coreProblem:
      "Time-series metrics data grows unbounded over time, and traditional databases are not optimized for the write-heavy, time-range query patterns of operational monitoring",
    designPrinciple:
      "Use fixed-size round-robin databases with automatic rollup aggregation to provide bounded storage and predictable costs while maintaining long-term trend visibility",
    historicalContext:
      "Graphite was created in 2006 by Chris Davis at Orbitz when the team realized they were drowning in monitoring data stored in MySQL. They needed a way to track thousands of metrics from web servers without the database growing uncontrollably. Chris designed Whisper's round-robin database format inspired by RRDtool but with a simpler architecture. The key innovation was automatic aggregation: old data automatically downsamples to coarser granularities (minute→hour→day) without manual intervention, keeping storage constant. By 2008, Graphite became open source and was adopted by Etsy, where it became the foundation for their 'measure everything' culture. Etsy's creation of StatsD in 2011 as an aggregation layer for Graphite established the standard architecture for metrics collection that persists today. Graphite's simplicity—plaintext protocol, hierarchical naming, fixed storage—made it accessible to startups and enterprises alike. While newer systems like Prometheus and InfluxDB have emerged with different tradeoffs (pull vs push, dimensional data models, clustering), Graphite remains widely deployed due to its predictability, simplicity, and the massive ecosystem built around it.",
    alternativesRejected: [
      "Relational Databases (MySQL/PostgreSQL) - General-purpose databases struggle with write-heavy time-series workloads, lack time-based retention policies, and require manual index management. Graphite's specialized storage engine provides orders of magnitude better performance.",
      "Unbounded Storage Without Aggregation - Storing every metric at full resolution forever becomes prohibitively expensive and slow to query. Graphite's automatic rollup provides the right balance: high resolution recent data, low resolution historical trends.",
      "Pull-Based Metrics Collection (like Prometheus) - Graphite chose push-based ingestion because it's simpler to implement (no service discovery required) and works better with short-lived processes and batch jobs that may not be running when scrapes occur.",
      "Complex Data Models - Graphite deliberately uses simple hierarchical naming instead of dimensional labels to minimize query complexity and maximize query performance. This tradeoff favors simplicity over flexibility.",
    ],
    mentalModel:
      "Graphite is like a photo album that automatically summarizes your pictures over time: you start with high-resolution daily photos, but after a month, they're condensed into weekly highlights, and after a year, just monthly summaries. You can't zoom into individual moments from years ago, but you can still see the overall trends without the album growing infinitely large.",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph Applications
      App1[Web Server]
      App2[API Service]
      App3[Background Jobs]
    end

    subgraph Aggregation
      StatsD[StatsD Daemon<br/>UDP Aggregation]
    end

    subgraph Ingestion
      CarbonRelay[Carbon Relay<br/>Metric Sharding]
      CarbonCache1[Carbon Cache 1]
      CarbonCache2[Carbon Cache 2]
    end

    subgraph Storage
      Whisper1[Whisper DB 1<br/>10s→1m→10m]
      Whisper2[Whisper DB 2<br/>10s→1m→10m]
    end

    subgraph Query
      GraphiteWeb[Graphite Web<br/>HTTP API]
      Grafana[Grafana Dashboard]
    end

    App1 -->|UDP Fire-and-Forget| StatsD
    App2 -->|UDP Fire-and-Forget| StatsD
    App3 -->|UDP Fire-and-Forget| StatsD

    StatsD -->|TCP Aggregated| CarbonRelay

    CarbonRelay -->|Shard by Metric Name| CarbonCache1
    CarbonRelay -->|Shard by Metric Name| CarbonCache2

    CarbonCache1 -->|Write| Whisper1
    CarbonCache2 -->|Write| Whisper2

    Whisper1 -.->|Automatic Rollup<br/>High Res → Low Res| Whisper1
    Whisper2 -.->|Automatic Rollup<br/>High Res → Low Res| Whisper2

    Grafana -->|Query Metrics| GraphiteWeb
    GraphiteWeb -->|Read Time-Series| Whisper1
    GraphiteWeb -->|Read Time-Series| Whisper2

    style StatsD fill:#e1f5ff
    style CarbonRelay fill:#ffe1e1
    style Whisper1 fill:#e1ffe1
    style Whisper2 fill:#e1ffe1
    style GraphiteWeb fill:#fff4e1`,
    realWorldAnalogy:
      "Graphite is like a weather station that records temperature every 10 seconds but automatically summarizes old data: yesterday's readings are stored minute-by-minute, last month's are hourly averages, and last year's are daily summaries. The storage device never grows because old detailed data is continuously rolled up into summaries. You can still answer 'how hot was it last July?' (from daily averages) but not 'what was the exact temperature at 3:47pm on July 15th last year?'",
    useCases: [
      {
        domain: "Web Application Performance",
        scenario:
          "Track API request rates, response times, and error rates across hundreds of web servers. Use StatsD to aggregate high-frequency metrics and Graphite to store trends over time.",
        patternRole:
          "Provides bounded storage for millions of request metrics with automatic aggregation from per-second to hourly granularity",
        companies: ["Etsy", "GitHub", "Booking.com"],
      },
      {
        domain: "Infrastructure Monitoring",
        scenario:
          "Monitor CPU, memory, disk, and network metrics from thousands of servers. Use Collectd or Diamond to gather system metrics and send to Graphite for storage and visualization.",
        patternRole:
          "Stores infrastructure metrics with tiered retention policies, enabling both real-time alerting and long-term capacity planning",
        companies: ["Airbnb", "Spotify", "Reddit"],
      },
      {
        domain: "Business Metrics",
        scenario:
          "Track e-commerce conversion rates, user signups, payment transactions, and revenue metrics. Correlate business KPIs with infrastructure changes and deployments.",
        patternRole:
          "Provides unified storage for both technical and business metrics, enabling correlation analysis between system health and business outcomes",
        companies: ["Etsy", "Shopify", "Wayfair"],
      },
    ],
  },

  references: [
    {
      title: "Graphite Documentation",
      url: "https://graphite.readthedocs.io/",
      type: "documentation",
      author: "Graphite Project",
    },
    {
      title: "Measure Anything, Measure Everything",
      url: "https://codeascraft.com/2011/02/15/measure-anything-measure-everything/",
      type: "article",
      author: "Etsy Engineering",
    },
    {
      title: "StatsD: Metrics for the Masses",
      url: "https://github.com/statsd/statsd",
      type: "documentation",
      author: "Etsy (Original Authors)",
    },
    {
      title: "Practical Monitoring by Mike Julian (Chapter on Graphite)",
      url: "https://www.practicalmonitoring.com/",
      type: "book",
      author: "Mike Julian",
    },
  ],

  tags: [
    "observability",
    "metrics",
    "time-series",
    "monitoring",
    "storage",
    "visualization",
    "aggregation",
  ],
  difficulty: "intermediate",
};
