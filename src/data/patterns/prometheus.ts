import type { Pattern } from "../schema";

export const prometheus: Pattern = {
  id: "prometheus",
  slug: "prometheus",
  corpusPath: "👁️ OBSERVABILITY → 📊 Metrics → 📈 Prometheus",

  hierarchy: {
    quality: "observability",
    strategy: "Metrics Collection",
    family: "Metrics",
    level: 4,
  },

  concept: {
    name: "Prometheus",
    emoji: "📈",
    tagline: "Pull-based metrics monitoring and alerting system",
    definition:
      "Prometheus is an open-source monitoring and alerting toolkit designed for reliability and scalability in cloud-native environments. Unlike traditional push-based metrics systems, Prometheus actively scrapes metrics from instrumented applications via HTTP endpoints, typically at /metrics. It stores all metrics as time-series data indexed by metric name and key-value pairs called labels, enabling multi-dimensional querying through its powerful PromQL query language. Prometheus features built-in service discovery mechanisms that automatically detect and monitor new service instances in dynamic environments like Kubernetes, eliminating manual configuration. The system includes an Alertmanager component that evaluates alerting rules against collected metrics and triggers notifications through various channels (email, Slack, PagerDuty). As a CNCF graduated project, Prometheus has become the de facto standard for Kubernetes monitoring, with native support from most cloud-native tools and platforms. Its pull model provides clear ownership boundaries—services expose metrics, Prometheus scrapes them—making debugging simpler than push-based systems where metrics can get lost in transit.",
    problemSolved:
      "Traditional monitoring systems face significant challenges in cloud-native environments: push-based architectures require services to know where to send metrics, creating tight coupling and failure points; inflexible data models make it difficult to slice metrics by multiple dimensions (service, region, version); manual service configuration doesn't scale with hundreds of ephemeral containers. Prometheus solves these through pull-based scraping that works even when network paths change, multi-dimensional labels that enable powerful aggregation queries, and service discovery that automatically tracks dynamic infrastructure. The /metrics endpoint standard makes instrumentation consistent across services and languages. Built-in alerting with Alertmanager provides automated incident detection based on PromQL queries, eliminating the need for separate alerting infrastructure. Short-term storage with configurable retention focuses Prometheus on real-time monitoring while long-term storage integrations (Thanos, Cortex) handle historical analysis.",
    tradeoffs: {
      pros: [
        "Pull-based model prevents tight coupling and works with firewalls/NAT",
        "Multi-dimensional labels enable powerful slice-and-dice queries via PromQL",
        "Service discovery automatically detects new instances in Kubernetes/cloud",
        "Built-in Alertmanager for rule-based alerting without external dependencies",
        "CNCF graduated project with massive ecosystem support",
        "Simple /metrics text format makes instrumentation easy across languages",
      ],
      cons: [
        "Single-server architecture limits horizontal scalability (millions of series)",
        "No built-in long-term storage—requires external systems like Thanos/Cortex",
        "Pull model requires network access from Prometheus to all targets",
        "Label cardinality explosions can cause memory exhaustion and query slowdowns",
        "Limited multi-tenancy support in standalone Prometheus",
      ],
    },
    relatedPatterns: [
      "opentelemetry",
      "red-method",
      "use-method",
      "service-discovery",
      "time-series-database",
      "alertmanager",
      "grafana",
    ],
  },

  structure: {
    participants: [
      {
        name: "Prometheus Server",
        role: "Scraper and Storage",
        responsibilities: [
          "Scrape metrics from instrumented services at configured intervals",
          "Store time-series data in local TSDB with compression",
          "Evaluate PromQL queries for dashboards and APIs",
          "Execute alerting rules and send alerts to Alertmanager",
        ],
      },
      {
        name: "Instrumented Service",
        role: "Metrics Exporter",
        responsibilities: [
          "Expose /metrics HTTP endpoint in Prometheus text format",
          "Track application metrics (counters, gauges, histograms, summaries)",
          "Apply appropriate labels to enable multi-dimensional queries",
          "Serve metrics synchronously when Prometheus scrapes",
        ],
      },
      {
        name: "Service Discovery",
        role: "Target Provider",
        responsibilities: [
          "Automatically discover service instances to scrape",
          "Provide target metadata (labels, addresses, ports)",
          "Update Prometheus configuration as services scale up/down",
        ],
      },
      {
        name: "Alertmanager",
        role: "Alert Router",
        responsibilities: [
          "Receive alerts from Prometheus Server",
          "Deduplicate, group, and route alerts based on rules",
          "Send notifications via email, Slack, PagerDuty, webhooks",
          "Handle alert silencing and inhibition",
        ],
      },
      {
        name: "Time-Series Database",
        role: "Storage Backend",
        responsibilities: [
          "Persist metrics with timestamp and labels",
          "Compress historical data to reduce disk usage",
          "Support efficient range queries for PromQL",
          "Enforce retention policies to expire old data",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant SD as Service Discovery
    participant PS as Prometheus Server
    participant IS as Instrumented Service
    participant AM as Alertmanager
    participant TSDB as Time-Series DB

    SD->>PS: Provide scrape targets
    loop Every scrape_interval (15s)
        PS->>IS: GET /metrics
        IS-->>PS: Metrics in text format
        PS->>TSDB: Store time-series data
    end

    loop Every evaluation_interval (15s)
        PS->>TSDB: Evaluate alerting rules
        TSDB-->>PS: Query results
        alt Alert fires
            PS->>AM: Send alert
            AM->>AM: Deduplicate & group
            AM-->>External: Notify (email/Slack)
        end
    end`,
    flow: [
      {
        step: 1,
        actor: "Service Discovery",
        action: "Discover Targets",
        description:
          "Service discovery mechanism (Kubernetes, Consul, EC2) provides list of service instances with IP addresses, ports, and metadata labels",
      },
      {
        step: 2,
        actor: "Prometheus Server",
        action: "Configure Scrape Jobs",
        description:
          "Prometheus updates scrape configuration with discovered targets, applying relabeling rules and setting scrape intervals",
      },
      {
        step: 3,
        actor: "Prometheus Server",
        action: "Scrape Metrics",
        description:
          "At configured intervals (typically 15s), Prometheus sends HTTP GET to /metrics endpoint of each target",
      },
      {
        step: 4,
        actor: "Instrumented Service",
        action: "Expose Metrics",
        description:
          "Service calculates current metric values and returns them in Prometheus text format with labels",
      },
      {
        step: 5,
        actor: "Prometheus Server",
        action: "Parse and Store",
        description:
          "Prometheus parses metrics, validates labels, and writes time-series data to local TSDB with timestamps",
      },
      {
        step: 6,
        actor: "Prometheus Server",
        action: "Compress Data",
        description:
          "TSDB compresses older data blocks and enforces retention policies to manage disk usage",
      },
      {
        step: 7,
        actor: "Prometheus Server",
        action: "Evaluate Alerting Rules",
        description:
          "At evaluation intervals, Prometheus executes PromQL alerting rules against TSDB and generates alerts when conditions match",
      },
      {
        step: 8,
        actor: "Alertmanager",
        action: "Process Alerts",
        description:
          "Alertmanager receives alerts, deduplicates across Prometheus replicas, groups related alerts, and routes to notification channels",
      },
      {
        step: 9,
        actor: "Alertmanager",
        action: "Send Notifications",
        description:
          "Alertmanager dispatches notifications via configured integrations (email, Slack, PagerDuty) with appropriate severity and context",
      },
      {
        step: 10,
        actor: "Prometheus Server",
        action: "Serve Queries",
        description:
          "External tools (Grafana, APIs) query Prometheus via PromQL for dashboards, analytics, and capacity planning",
      },
    ],
    invariants: [
      "All metrics must be exposed via HTTP /metrics endpoint in Prometheus text format",
      "Pull-based scraping—services never push metrics to Prometheus",
      "Labels are immutable within a time series; changing labels creates a new series",
      "Scrape intervals must be consistent to ensure accurate rate calculations",
      "Retention period is enforced; data older than retention is automatically deleted",
      "Alertmanager deduplicates alerts from multiple Prometheus replicas",
      "Metric names must follow [a-zA-Z_:][a-zA-Z0-9_:]* pattern",
    ],
  },

  codeExamples: [
    {
      id: "prometheus-express-prom-client",
      language: "typescript",
      title: "TypeScript Express with prom-client",
      description:
        "Complete Express.js instrumentation with prom-client library, demonstrating custom metrics, default metrics, and PromQL query examples for real-time observability",
      code: `import express from 'express';
import client from 'prom-client';

// REASON: Initialize Prometheus client registry to hold all metrics
// ACTION: Create default registry for auto-collection and custom metrics
const register = new client.Registry();

// REASON: Default metrics (CPU, memory, event loop lag) provide system health visibility
// ACTION: Collect default Node.js metrics every 10 seconds
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// ===================================================================
// CUSTOM METRICS - Demonstrate all four Prometheus metric types
// ===================================================================

// REASON: Counters track cumulative values that only increase (requests, errors, bytes sent)
// ACTION: Create counter for total HTTP requests with method and status labels
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// REASON: Gauges track values that can go up or down (active connections, queue size)
// ACTION: Create gauge for current active requests
const activeRequests = new client.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
  registers: [register]
});

// REASON: Histograms track distribution of values (latency, response size) with configurable buckets
// ACTION: Define latency histogram with buckets optimized for web responses (ms)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// REASON: Summaries calculate percentiles client-side (P50, P90, P99) without pre-defined buckets
// ACTION: Create summary for payload sizes to track data transfer patterns
const httpResponseSize = new client.Summary({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register]
});

// REASON: Business metrics track domain-specific KPIs (orders, revenue, user signups)
// ACTION: Create counter for successful orders to measure business impact
const ordersTotal = new client.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['product', 'region'],
  registers: [register]
});

const app = express();
app.use(express.json());

// ===================================================================
// MIDDLEWARE - Automatic request instrumentation
// ===================================================================

// REASON: Instrument ALL requests to capture latency, status codes, and throughput
// ACTION: Middleware tracks request lifecycle with timer start/end
app.use((req, res, next) => {
  const start = Date.now();

  // Track active requests
  activeRequests.inc();

  // REASON: Intercept response finish to record metrics after request completes
  // ACTION: Hook into res.on('finish') to capture final status and duration
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;

    // Record all metrics with consistent labels
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode
    });

    httpRequestDuration.observe({
      method: req.method,
      route,
      status: res.statusCode
    }, duration);

    // Track response size if available
    const responseSize = parseInt(res.get('Content-Length') || '0');
    if (responseSize > 0) {
      httpResponseSize.observe({
        method: req.method,
        route
      }, responseSize);
    }

    activeRequests.dec();
  });

  next();
});

// ===================================================================
// APPLICATION ROUTES - Business logic with custom metrics
// ===================================================================

app.get('/api/users/:id', async (req, res) => {
  try {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    res.json({
      id: req.params.id,
      name: 'John Doe',
      region: 'us-east-1'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { product, quantity, region } = req.body;

    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

    // REASON: Increment business metrics to track revenue-impacting events
    // ACTION: Record successful order with product and region labels for analysis
    ordersTotal.inc({ product, region });

    res.status(201).json({
      orderId: Math.random().toString(36).substring(7),
      product,
      quantity,
      status: 'confirmed'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ===================================================================
// METRICS ENDPOINT - Prometheus scrapes this every 15s
// ===================================================================

// REASON: Prometheus pull model requires HTTP endpoint exposing metrics
// ACTION: Return all metrics in Prometheus text format at /metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ===================================================================
// HEALTH ENDPOINTS - Kubernetes liveness/readiness probes
// ===================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ===================================================================
// CONTEXT DILATION: Real-time Incident Detection
// ===================================================================
// Traditional log aggregation: 5-10 minute delay from log generation → indexing → alerting
// Prometheus metrics: 15-second scrape interval = 20x faster incident detection
//
// Example: API latency spike at 14:32:00
//   - Logs: Alert fires at 14:37-14:42 (5-10min delay) - users already impacted
//   - Prometheus: Alert fires at 14:32:15 (15s delay) - catch issue immediately
//
// Impact: Reduced MTTR (Mean Time To Recovery) from 15+ minutes to <2 minutes
//         99.9% → 99.99% uptime improvement (5.25 hours → 52 minutes downtime/year)

const PORT = 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`Metrics available at http://localhost:\${PORT}/metrics\`);
  console.log(\`\\nExample PromQL queries:\`);
  console.log(\`  - Request rate: rate(http_requests_total[5m])\`);
  console.log(\`  - P95 latency: histogram_quantile(0.95, http_request_duration_seconds_bucket)\`);
  console.log(\`  - Error rate: rate(http_requests_total{status=~"5.."}[5m])\`);
  console.log(\`  - Active requests: http_requests_active\`);
});

// ===================================================================
// PROMETHEUS CONFIGURATION (prometheus.yml)
// ===================================================================
/*
scrape_configs:
  - job_name: 'express-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
        labels:
          env: 'production'
          service: 'user-api'
*/

// ===================================================================
// ALERTING RULES (alerts.yml)
// ===================================================================
/*
groups:
  - name: express_api_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value }} requests/sec"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency on {{ $labels.route }}"
          description: "P95 latency is {{ $value }}s (threshold: 1s)"
*/`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Express.js application instrumentation with Prometheus client, custom metrics, default metrics, and alerting configuration",
        prerequisites: [
          "Express.js",
          "HTTP middleware",
          "Prometheus text format",
          "PromQL basics",
        ],
        systemPosition:
          "Application layer instrumentation exposing /metrics for Prometheus scraping, integrated with Alertmanager for incident detection",
      },
      annotations: [
        {
          id: "prom-default-metrics",
          lines: [9, 14],
          action: "Collect default Node.js runtime metrics automatically",
          reason:
            "Default metrics (CPU, memory, GC, event loop) provide baseline system health without manual instrumentation",
          contextLevel: "module",
          relatedConcepts: ["observability", "system-metrics"],
        },
        {
          id: "prom-counter",
          lines: [23, 28],
          action: "Define counter metric for cumulative HTTP requests",
          reason:
            "Counters track totals that only increase; use rate() in PromQL to calculate requests/second",
          contextLevel: "local",
          relatedConcepts: ["metrics", "counters"],
        },
        {
          id: "prom-histogram",
          lines: [38, 45],
          action: "Create histogram with buckets for latency distribution",
          reason:
            "Histograms enable percentile calculations (P50, P95, P99) via histogram_quantile() in PromQL; buckets must cover expected range",
          contextLevel: "module",
          relatedConcepts: ["histograms", "percentiles", "latency-tracking"],
        },
        {
          id: "prom-middleware",
          lines: [81, 111],
          action: "Instrument all requests with automatic metric recording",
          reason:
            "Middleware captures request lifecycle; res.on('finish') ensures metrics recorded after response sent with final status code",
          contextLevel: "system",
          relatedConcepts: ["middleware", "request-tracking"],
        },
        {
          id: "prom-business-metrics",
          lines: [129, 132],
          action: "Increment business metric for successful order",
          reason:
            "Business metrics track revenue-impacting events; labels enable slicing by product/region for analysis",
          contextLevel: "local",
          relatedConcepts: ["business-metrics", "kpis"],
        },
        {
          id: "prom-metrics-endpoint",
          lines: [147, 151],
          action: "Expose /metrics endpoint for Prometheus scraping",
          reason:
            "Prometheus pull model requires HTTP endpoint; text format is efficient and human-readable",
          contextLevel: "system",
          relatedConcepts: ["pull-based-metrics", "http-endpoints"],
        },
        {
          id: "prom-context-dilation",
          lines: [162, 173],
          action:
            "Compare incident detection speed: logs (5-10min) vs metrics (15s)",
          reason:
            "Real-time metrics enable 20x faster alerting than batch log aggregation, reducing MTTR and improving uptime",
          contextLevel: "ecosystem",
          relatedConcepts: [
            "incident-detection",
            "mttr",
            "real-time-monitoring",
          ],
        },
        {
          id: "prom-alerting-rules",
          lines: [197, 222],
          action: "Define alerting rules for error rate and latency thresholds",
          reason:
            "Automated alerts based on PromQL queries detect incidents without manual monitoring; 'for' clause prevents flapping",
          contextLevel: "system",
          relatedConcepts: ["alerting", "slos", "incident-response"],
        },
      ],
      highlights: [
        {
          lines: [23, 59],
          label: "Metric type definitions",
          sbvpDomain: "structure",
        },
        {
          lines: [81, 111],
          label: "Request instrumentation middleware",
          sbvpDomain: "behavior",
        },
        {
          lines: [162, 173],
          label: "Real-time incident detection impact",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "prometheus-fastapi-python",
      language: "python",
      title: "Python FastAPI with prometheus_client",
      description:
        "Production FastAPI instrumentation with Prometheus client, demonstrating middleware for automatic metrics, custom business metrics, multi-process mode, and Grafana dashboard integration",
      code: `from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest, REGISTRY, CollectorRegistry
from prometheus_client import multiprocess, CollectorRegistry as MultiProcessRegistry
from prometheus_client.core import GaugeMetricFamily
import time
import os

# ===================================================================
# MULTI-PROCESS SETUP - Required for production gunicorn deployments
# ===================================================================

# REASON: Gunicorn spawns multiple worker processes; metrics must aggregate across all
# ACTION: Use prometheus_client multiprocess mode with shared directory
if 'prometheus_multiproc_dir' in os.environ:
    registry = MultiProcessRegistry()
    multiprocess.MultiProcessCollector(registry)
else:
    registry = REGISTRY

app = FastAPI(title="E-Commerce API with Prometheus")

# ===================================================================
# CUSTOM METRICS - Application and business KPIs
# ===================================================================

# REASON: Track request patterns for RED method (Rate, Errors, Duration)
# ACTION: Create counter for total requests with method, endpoint, status labels
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=registry
)

# REASON: Histograms track latency distribution for SLO monitoring
# ACTION: Define buckets covering API latency range (10ms to 10s)
http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=registry
)

# REASON: Business metrics measure revenue-impacting events
# ACTION: Track orders and revenue with product and region dimensions
orders_total = Counter(
    'orders_total',
    'Total orders processed',
    ['product', 'region', 'status'],
    registry=registry
)

revenue_total = Counter(
    'revenue_total',
    'Total revenue in cents',
    ['product', 'region'],
    registry=registry
)

# REASON: Gauges track current state (inventory, active users, queue depth)
# ACTION: Monitor inventory levels to prevent stockouts
inventory_items = Gauge(
    'inventory_items',
    'Current inventory count',
    ['product', 'warehouse'],
    registry=registry
)

# REASON: Info metrics provide static metadata (version, build, config)
# ACTION: Expose application version for deployment tracking
app_info = Info(
    'app',
    'Application metadata',
    registry=registry
)
app_info.info({'version': '1.2.3', 'environment': 'production'})

# ===================================================================
# MIDDLEWARE - Automatic request instrumentation
# ===================================================================

# REASON: Instrument every request automatically without polluting route handlers
# ACTION: Middleware captures request lifecycle for consistent metrics
@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    # Start timer for latency tracking
    start_time = time.time()

    # Extract route path for consistent labeling (not raw URL with IDs)
    endpoint = request.url.path

    try:
        response = await call_next(request)
        status = response.status_code
    except Exception as e:
        # Track errors even if handler fails
        status = 500
        raise
    finally:
        # REASON: Record metrics after request completes to capture accurate duration
        # ACTION: Increment counter and observe histogram with consistent labels
        duration = time.time() - start_time

        http_requests_total.labels(
            method=request.method,
            endpoint=endpoint,
            status=status
        ).inc()

        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=endpoint
        ).observe(duration)

    return response

# ===================================================================
# APPLICATION ROUTES - Business logic with custom metrics
# ===================================================================

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    """Fetch product details with inventory check"""
    # Simulate database query
    await asyncio.sleep(0.05)

    return {
        "id": product_id,
        "name": "Widget Pro",
        "price": 2999,
        "inventory": 42
    }

@app.post("/api/orders")
async def create_order(order: dict):
    """Process order and update business metrics"""
    product = order.get("product", "unknown")
    region = order.get("region", "us-east-1")
    quantity = order.get("quantity", 1)
    price = order.get("price", 0)

    # Simulate order processing
    await asyncio.sleep(0.1)

    # REASON: Track successful orders for business analytics
    # ACTION: Increment order counter and revenue with granular labels
    orders_total.labels(
        product=product,
        region=region,
        status='completed'
    ).inc()

    revenue_total.labels(
        product=product,
        region=region
    ).inc(price * quantity)

    # REASON: Decrement inventory to track stock levels
    # ACTION: Update gauge to trigger low-inventory alerts
    inventory_items.labels(
        product=product,
        warehouse=region
    ).dec(quantity)

    return {
        "order_id": "ORD123",
        "status": "completed",
        "product": product,
        "quantity": quantity
    }

# ===================================================================
# CONTEXT DILATION: Cardinality Management
# ===================================================================
# High-cardinality labels (user_id, session_id, request_id) cause memory explosion:
#   - 1M users × 10 metrics = 10M time series
#   - Prometheus memory: ~1KB per series = 10GB RAM
#   - Query performance: O(n) scan across all series
#
# Solution: Use low-cardinality labels (product, region, status)
#   - 100 products × 5 regions × 3 statuses = 1,500 series
#   - Prometheus memory: 1.5MB
#   - Query performance: Fast aggregations
#
# Rule: Keep total series count <100k per Prometheus instance
#       Never use unbounded labels (UUIDs, emails, IPs)

@app.post("/api/orders/bad-example")
async def create_order_bad(order: dict):
    """
    ANTI-PATTERN: Using user_id as label creates cardinality explosion
    """
    # DON'T DO THIS: user_id creates millions of unique time series
    orders_total.labels(
        product=order['product'],
        user_id=order['user_id'],  # ❌ HIGH CARDINALITY
        status='completed'
    ).inc()

    # Instead: Aggregate by product/region, track user metrics separately
    # Use logging or tracing for user-level details

# ===================================================================
# METRICS ENDPOINT - Prometheus scrapes this
# ===================================================================

@app.get("/metrics")
async def metrics():
    """Expose metrics in Prometheus text format"""
    return Response(
        content=generate_latest(registry),
        media_type="text/plain; version=0.0.4"
    )

# ===================================================================
# GRAFANA DASHBOARD JSON - Visualize metrics
# ===================================================================

GRAFANA_DASHBOARD = """
{
  "dashboard": {
    "title": "E-Commerce API Metrics",
    "panels": [
      {
        "title": "Request Rate (req/sec)",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\\"5..\\"}[5m])",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Orders per Minute",
        "targets": [
          {
            "expr": "rate(orders_total[1m]) * 60",
            "legendFormat": "{{product}} - {{region}}"
          }
        ]
      },
      {
        "title": "Revenue per Hour",
        "targets": [
          {
            "expr": "rate(revenue_total[1h]) * 3600 / 100",
            "legendFormat": "{{product}}"
          }
        ]
      },
      {
        "title": "Inventory Levels",
        "targets": [
          {
            "expr": "inventory_items",
            "legendFormat": "{{product}} @ {{warehouse}}"
          }
        ]
      }
    ]
  }
}
"""

@app.get("/grafana/dashboard")
async def grafana_dashboard():
    """Return Grafana dashboard JSON for import"""
    return GRAFANA_DASHBOARD

# ===================================================================
# PRODUCTION DEPLOYMENT - Gunicorn with multiprocess mode
# ===================================================================

# Start command:
#   export prometheus_multiproc_dir=/tmp/prometheus_metrics
#   mkdir -p $prometheus_multiproc_dir
#   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production FastAPI application with Prometheus instrumentation, multi-process support, business metrics, and Grafana integration",
        prerequisites: [
          "FastAPI",
          "Prometheus client library",
          "Multi-process metrics aggregation",
          "Grafana dashboards",
        ],
        systemPosition:
          "Application layer metrics exposition with middleware instrumentation, integrated with Grafana for visualization and alerting",
      },
      annotations: [
        {
          id: "prom-multiprocess",
          lines: [14, 18],
          action: "Configure multi-process mode for gunicorn workers",
          reason:
            "Gunicorn spawns multiple processes; multiprocess mode aggregates metrics across workers using shared directory",
          contextLevel: "system",
          relatedConcepts: [
            "multi-process",
            "worker-pools",
            "metric-aggregation",
          ],
        },
        {
          id: "prom-histogram-buckets",
          lines: [36, 42],
          action: "Define histogram buckets covering expected latency range",
          reason:
            "Buckets must span actual values; too narrow = inaccurate percentiles, too wide = wasted memory",
          contextLevel: "module",
          relatedConcepts: ["histograms", "latency-tracking"],
        },
        {
          id: "prom-business-metrics",
          lines: [45, 57],
          action:
            "Track business KPIs (orders, revenue) with dimensional labels",
          reason:
            "Business metrics measure product success; labels enable slice-by-product/region analysis for growth tracking",
          contextLevel: "system",
          relatedConcepts: ["business-metrics", "revenue-tracking"],
        },
        {
          id: "prom-middleware-pattern",
          lines: [81, 115],
          action: "Middleware automatically instruments all requests",
          reason:
            "Centralized instrumentation ensures consistent metrics without polluting route handlers; try/finally guarantees recording even on errors",
          contextLevel: "system",
          relatedConcepts: ["middleware", "aspect-oriented"],
        },
        {
          id: "prom-gauge-update",
          lines: [162, 166],
          action: "Decrement inventory gauge on order completion",
          reason:
            "Gauges track current state; inventory changes trigger low-stock alerts for proactive replenishment",
          contextLevel: "local",
          relatedConcepts: ["gauges", "inventory-management"],
        },
        {
          id: "prom-cardinality",
          lines: [174, 186],
          action: "Explain cardinality explosion with user_id labels",
          reason:
            "High-cardinality labels (UUIDs, IPs) create millions of series causing OOM; keep series <100k per instance",
          contextLevel: "ecosystem",
          relatedConcepts: [
            "cardinality-management",
            "memory-optimization",
            "anti-patterns",
          ],
        },
        {
          id: "prom-grafana-integration",
          lines: [215, 268],
          action: "Define Grafana dashboard JSON for metric visualization",
          reason:
            "Dashboards provide real-time visibility into RED metrics, business KPIs, and inventory levels for operational awareness",
          contextLevel: "system",
          relatedConcepts: ["grafana", "visualization", "dashboards"],
        },
        {
          id: "prom-production-deployment",
          lines: [276, 280],
          action: "Production deployment with gunicorn multiprocess mode",
          reason:
            "Shared metrics directory enables aggregation across workers; essential for accurate counts in production",
          contextLevel: "system",
          relatedConcepts: ["production-deployment", "gunicorn", "scaling"],
        },
      ],
      highlights: [
        {
          lines: [28, 74],
          label: "Metric definitions with labels",
          sbvpDomain: "structure",
        },
        {
          lines: [81, 115],
          label: "Automatic request instrumentation",
          sbvpDomain: "behavior",
        },
        {
          lines: [174, 186],
          label: "Cardinality explosion prevention",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "prometheus-spring-micrometer",
      language: "java",
      title: "Java Spring Boot with Micrometer",
      description:
        "Enterprise Spring Boot application instrumented with Micrometer abstraction layer, demonstrating auto-configuration, custom metrics with tags, AlertManager integration, and automated incident response",
      code: `package com.example.metrics;

import io.micrometer.core.instrument.*;
import io.micrometer.prometheus.PrometheusConfig;
import io.micrometer.prometheus.PrometheusMeterRegistry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * REASON: Micrometer provides vendor-neutral metrics abstraction
 * ACTION: Configure Prometheus registry for Spring Boot application
 *
 * Micrometer abstracts metric libraries, allowing switch between Prometheus,
 * Datadog, New Relic without changing application code.
 */
@SpringBootApplication
public class MetricsApplication {

    public static void main(String[] args) {
        SpringApplication.run(MetricsApplication.class, args);
    }

    /**
     * REASON: Add common tags to all metrics for consistent filtering
     * ACTION: Configure registry customizer with application metadata
     *
     * Common tags (app name, env, region) enable multi-application dashboards
     * and environment-specific alerting rules.
     */
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
            .commonTags(
                "application", "order-service",
                "environment", System.getenv().getOrDefault("ENV", "dev"),
                "region", System.getenv().getOrDefault("REGION", "us-east-1")
            );
    }
}

/**
 * REASON: Custom metrics track business and technical KPIs
 * ACTION: Define metric beans for dependency injection across application
 */
@Configuration
class MetricsConfig {

    /**
     * REASON: Counters track cumulative events (orders, payments, errors)
     * ACTION: Create counter with tags for multi-dimensional analysis
     */
    @Bean
    public Counter orderCounter(MeterRegistry registry) {
        return Counter.builder("orders.placed")
            .description("Total orders placed")
            .tags("type", "online")
            .register(registry);
    }

    /**
     * REASON: Timers measure both duration and count of operations
     * ACTION: Configure timer with percentile histogram for accurate P95/P99
     *
     * publishPercentileHistogram=true generates _bucket metrics for
     * histogram_quantile() aggregation across instances.
     */
    @Bean
    public Timer checkoutTimer(MeterRegistry registry) {
        return Timer.builder("checkout.duration")
            .description("Checkout process duration")
            .publishPercentileHistogram()
            .serviceLevelObjectives(
                Duration.ofMillis(100),
                Duration.ofMillis(500),
                Duration.ofSeconds(1),
                Duration.ofSeconds(5)
            )
            .register(registry);
    }

    /**
     * REASON: Gauges track current values (queue depth, cache size, connections)
     * ACTION: Monitor active checkout sessions for capacity planning
     */
    @Bean
    public AtomicInteger activeCheckouts() {
        return new AtomicInteger(0);
    }

    @Bean
    public Gauge activeCheckoutsGauge(MeterRegistry registry, AtomicInteger activeCheckouts) {
        return Gauge.builder("checkout.active", activeCheckouts, AtomicInteger::get)
            .description("Number of active checkout sessions")
            .register(registry);
    }
}

/**
 * REASON: REST controller with automatic and custom instrumentation
 * ACTION: Inject metrics and record business events
 */
@RestController
@RequestMapping("/api")
class OrderController {

    private final Counter orderCounter;
    private final Timer checkoutTimer;
    private final AtomicInteger activeCheckouts;
    private final MeterRegistry registry;

    public OrderController(
        Counter orderCounter,
        Timer checkoutTimer,
        AtomicInteger activeCheckouts,
        MeterRegistry registry
    ) {
        this.orderCounter = orderCounter;
        this.checkoutTimer = checkoutTimer;
        this.activeCheckouts = activeCheckouts;
        this.registry = registry;
    }

    /**
     * REASON: Track checkout operations with latency and success rate
     * ACTION: Use Timer.Sample for precise duration measurement
     *
     * Timer.Sample captures start time; stop() records duration and
     * automatically increments count.
     */
    @PostMapping("/checkout")
    public CheckoutResponse checkout(@RequestBody CheckoutRequest request) {
        Timer.Sample sample = Timer.start(registry);
        activeCheckouts.incrementAndGet();

        try {
            // Simulate payment processing
            Thread.sleep((long) (Math.random() * 200));

            // REASON: Increment order counter on successful checkout
            // ACTION: Add tags for product category to enable filtering
            orderCounter.increment();

            Counter.builder("checkout.success")
                .tags("product", request.getProduct())
                .register(registry)
                .increment();

            return new CheckoutResponse("SUCCESS", "ORD-" + System.currentTimeMillis());

        } catch (Exception e) {
            // REASON: Track errors separately for error rate alerting
            // ACTION: Increment error counter with exception type tag
            Counter.builder("checkout.errors")
                .tags("exception", e.getClass().getSimpleName())
                .register(registry)
                .increment();

            throw new RuntimeException("Checkout failed", e);

        } finally {
            // REASON: Always record duration and decrement active count
            // ACTION: Stop timer in finally block to ensure metrics recorded
            sample.stop(checkoutTimer);
            activeCheckouts.decrementAndGet();
        }
    }

    /**
     * REASON: Distribution summaries track size distributions (payload, batch)
     * ACTION: Monitor order value distribution for pricing analysis
     */
    @PostMapping("/orders")
    public OrderResponse createOrder(@RequestBody OrderRequest request) {
        DistributionSummary orderValue = DistributionSummary.builder("order.value")
            .description("Order value in cents")
            .tags("product", request.getProduct())
            .publishPercentileHistogram()
            .register(registry);

        orderValue.record(request.getTotalCents());

        return new OrderResponse("ORDER-123", "CONFIRMED");
    }
}

/**
 * ===================================================================
 * ALERTMANAGER CONFIGURATION - Automated incident response
 * ===================================================================
 *
 * File: alertmanager.yml
 *
 * REASON: AlertManager routes alerts to appropriate teams with grouping
 * ACTION: Configure routes, receivers, and inhibition rules
 */
/*
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'

# REASON: Group related alerts to reduce notification noise
# ACTION: Group by service and severity, wait 30s for batching
route:
  receiver: 'team-ops'
  group_by: ['alertname', 'service', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    # REASON: Critical alerts go to PagerDuty for immediate response
    # ACTION: Route critical severity to on-call engineer
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      group_wait: 10s
      repeat_interval: 1h

    # REASON: Warning alerts go to Slack for team awareness
    # ACTION: Route warnings to team channel for investigation
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}: {{ .GroupLabels.service }}'

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-team-platform'
        title: 'Warning: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'team-ops'
    slack_configs:
      - channel: '#ops'

# REASON: Inhibit low-severity alerts when critical alert fires
# ACTION: Suppress warning/info if critical alert active
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['service', 'region']
*/

/**
 * ===================================================================
 * PROMETHEUS ALERTING RULES - SLO-based incident detection
 * ===================================================================
 *
 * File: alerts.yml
 *
 * REASON: Automated alerting on SLO violations and anomalies
 * ACTION: Define PromQL rules for error budget and latency
 */
/*
groups:
  - name: checkout_service_alerts
    interval: 30s
    rules:
      # REASON: Alert on high error rate (SLO: 99.9% success = 0.1% errors)
      # ACTION: Fire critical alert if error rate > 1% for 5 minutes
      - alert: HighCheckoutErrorRate
        expr: |
          (
            rate(checkout_errors_total[5m]) /
            rate(checkout_duration_seconds_count[5m])
          ) > 0.01
        for: 5m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: "High checkout error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"
          runbook: "https://wiki.company.com/runbooks/checkout-errors"

      # REASON: Alert on P95 latency SLO violation
      # ACTION: Fire warning if P95 > 1s, critical if > 5s
      - alert: HighCheckoutLatency
        expr: |
          histogram_quantile(0.95,
            rate(checkout_duration_seconds_bucket[5m])
          ) > 1.0
        for: 10m
        labels:
          severity: warning
          team: payments
        annotations:
          summary: "High P95 checkout latency"
          description: "P95 latency is {{ $value | humanizeDuration }} (SLO: 1s)"

      - alert: CriticalCheckoutLatency
        expr: |
          histogram_quantile(0.95,
            rate(checkout_duration_seconds_bucket[5m])
          ) > 5.0
        for: 5m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: "CRITICAL: Checkout latency exceeds 5s"
          description: "P95 latency is {{ $value | humanizeDuration }}"
          runbook: "https://wiki.company.com/runbooks/latency-spike"

      # REASON: Alert on capacity issues (queue buildup)
      # ACTION: Warn when active checkouts exceed capacity threshold
      - alert: CheckoutQueueBuildup
        expr: checkout_active > 100
        for: 3m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Checkout queue building up"
          description: "{{ $value }} active checkouts (capacity: 100)"
*/

/**
 * ===================================================================
 * CONTEXT DILATION: Automated Incident Response Impact
 * ===================================================================
 *
 * Manual Monitoring (Pre-Prometheus):
 *   - Engineers check dashboards every 30-60 minutes
 *   - Incidents detected by user complaints (hours delay)
 *   - MTTR: 2-4 hours (detection + investigation + fix)
 *   - Uptime: 99.9% (8.76 hours downtime/year)
 *
 * Automated Alerting (Prometheus + AlertManager):
 *   - Alerts fire within 15-30 seconds of SLO violation
 *   - PagerDuty wakes on-call engineer immediately
 *   - MTTR: 15-30 minutes (instant detection, faster resolution)
 *   - Uptime: 99.99% (52 minutes downtime/year)
 *
 * Business Impact:
 *   - E-commerce: $10k/minute downtime × 90% reduction = $400k/year saved
 *   - SaaS: Prevent customer churn from outages (>$1M ARR impact)
 *   - Platform: Enable confident deployments without fear of silent failures
 *
 * Key Insight: Real-time alerting transforms reactive firefighting into
 *              proactive incident management, reducing toil and stress.
 */

// DTOs
record CheckoutRequest(String product, int quantity, String userId) {}
record CheckoutResponse(String status, String orderId) {}
record OrderRequest(String product, int totalCents) {
    public int getTotalCents() { return totalCents; }
    public String getProduct() { return product; }
}
record OrderResponse(String orderId, String status) {}`,
      runnable: false,
      contextDilation: {
        level: "ecosystem",
        scope:
          "Enterprise Spring Boot application with Micrometer metrics, Prometheus exposition, AlertManager integration, and automated incident response workflow",
        prerequisites: [
          "Spring Boot",
          "Micrometer abstraction",
          "Prometheus AlertManager",
          "PagerDuty integration",
        ],
        systemPosition:
          "Application layer metrics with auto-configuration, integrated with AlertManager for SLO-based alerting and PagerDuty for incident response",
      },
      annotations: [
        {
          id: "spring-micrometer-abstraction",
          lines: [15, 21],
          action: "Use Micrometer for vendor-neutral metrics",
          reason:
            "Micrometer abstracts Prometheus, Datadog, New Relic; switch backends without code changes",
          contextLevel: "ecosystem",
          relatedConcepts: ["abstraction-layer", "vendor-neutrality"],
        },
        {
          id: "spring-common-tags",
          lines: [34, 42],
          action: "Configure common tags for all metrics",
          reason:
            "Common tags (app, env, region) enable multi-app dashboards and environment-specific alerts",
          contextLevel: "system",
          relatedConcepts: ["tagging", "multi-tenancy"],
        },
        {
          id: "spring-timer-slo",
          lines: [67, 81],
          action: "Configure timer with SLO buckets for percentile accuracy",
          reason:
            "publishPercentileHistogram() generates buckets for histogram_quantile(); SLOs define bucket boundaries",
          contextLevel: "module",
          relatedConcepts: ["slos", "percentiles", "latency-tracking"],
        },
        {
          id: "spring-timer-sample",
          lines: [124, 127],
          action: "Use Timer.Sample for precise duration measurement",
          reason:
            "Timer.Sample captures start; stop() records duration and count atomically, ensuring accurate metrics",
          contextLevel: "local",
          relatedConcepts: ["timers", "duration-tracking"],
        },
        {
          id: "spring-error-tracking",
          lines: [143, 149],
          action: "Track errors with exception type tags",
          reason:
            "Exception tags enable root cause analysis; separate error counter from success counter",
          contextLevel: "module",
          relatedConcepts: ["error-tracking", "observability"],
        },
        {
          id: "alertmanager-routing",
          lines: [193, 217],
          action: "Configure AlertManager routing by severity",
          reason:
            "Critical alerts → PagerDuty (immediate), warnings → Slack (async); reduces alert fatigue",
          contextLevel: "system",
          relatedConcepts: ["alert-routing", "incident-response"],
        },
        {
          id: "alertmanager-inhibition",
          lines: [238, 245],
          action: "Inhibit low-severity alerts when critical fires",
          reason:
            "Prevent notification storm; critical alert implies warning/info issues",
          contextLevel: "system",
          relatedConcepts: ["alert-deduplication", "noise-reduction"],
        },
        {
          id: "prometheus-slo-alerts",
          lines: [263, 280],
          action: "Define SLO-based alerting rules for error rate",
          reason:
            "SLO: 99.9% success → alert at 0.1% errors; PromQL calculates error rate from counters",
          contextLevel: "system",
          relatedConcepts: ["slos", "error-budgets", "sre"],
        },
        {
          id: "context-incident-response",
          lines: [327, 354],
          action: "Compare manual vs automated monitoring impact",
          reason:
            "Automated alerting reduces MTTR from hours to minutes, improving uptime 99.9% → 99.99% and saving $400k/year",
          contextLevel: "ecosystem",
          relatedConcepts: [
            "incident-response",
            "mttr",
            "business-impact",
            "sre",
          ],
        },
      ],
      highlights: [
        {
          lines: [67, 81],
          label: "Timer with SLO buckets",
          sbvpDomain: "structure",
        },
        {
          lines: [124, 155],
          label: "Request instrumentation with error tracking",
          sbvpDomain: "behavior",
        },
        {
          lines: [327, 354],
          label: "Automated incident response impact",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservices monitoring in Kubernetes clusters",
      "Application performance monitoring (APM)",
      "Infrastructure monitoring (CPU, memory, disk)",
      "SLO tracking and error budget management",
      "Capacity planning and autoscaling decisions",
      "Incident detection and automated alerting",
      "Business metrics dashboards (orders, revenue, engagement)",
    ],
    interactsWith: [
      "grafana",
      "alertmanager",
      "service-discovery",
      "kubernetes",
      "opentelemetry",
    ],
    architecturalBoundaries: [
      "/metrics endpoint exposition at application layer",
      "Prometheus Server scraping and storage",
      "Alertmanager for alert processing and routing",
      "Grafana for visualization and dashboards",
      "Long-term storage systems (Thanos, Cortex, VictoriaMetrics)",
    ],
  },

  implementations: [
    {
      id: "prometheus-server",
      name: "Prometheus Server",
      type: "platform",
      languages: ["go"],
      description:
        "Official Prometheus server with TSDB, PromQL engine, and built-in alerting. Supports service discovery for Kubernetes, Consul, EC2, and 20+ integrations. Single-binary deployment with low resource overhead.",
      links: {
        docs: "https://prometheus.io/docs/",
        github: "https://github.com/prometheus/prometheus",
      },
      codeSnippet: `# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true`,
    },
    {
      id: "grafana",
      name: "Grafana",
      type: "platform",
      languages: ["typescript", "go"],
      description:
        "Industry-standard visualization platform for Prometheus metrics. Supports PromQL queries, templated dashboards, alerting, and 150+ data sources. Open-source with enterprise features.",
      links: {
        docs: "https://grafana.com/docs/",
        github: "https://github.com/grafana/grafana",
      },
      codeSnippet: `{
  "dashboard": {
    "panels": [{
      "targets": [{
        "expr": "rate(http_requests_total[5m])",
        "legendFormat": "{{method}} {{status}}"
      }]
    }]
  }
}`,
    },
    {
      id: "alertmanager",
      name: "Alertmanager",
      type: "service",
      languages: ["go"],
      description:
        "Handles alerts from Prometheus Server with deduplication, grouping, routing, and silencing. Integrates with PagerDuty, Slack, email, webhooks. Part of Prometheus ecosystem.",
      links: {
        docs: "https://prometheus.io/docs/alerting/latest/alertmanager/",
        github: "https://github.com/prometheus/alertmanager",
      },
      codeSnippet: `route:
  receiver: 'team-ops'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'key'`,
    },
    {
      id: "thanos",
      name: "Thanos",
      type: "platform",
      languages: ["go"],
      description:
        "Long-term storage and global query view for Prometheus. Stores metrics in object storage (S3, GCS) with unlimited retention. Enables querying across multiple Prometheus instances.",
      links: {
        docs: "https://thanos.io/",
        github: "https://github.com/thanos-io/thanos",
      },
    },
    {
      id: "cortex",
      name: "Cortex",
      type: "platform",
      languages: ["go"],
      description:
        "Horizontally scalable, multi-tenant Prometheus-as-a-Service. Supports long-term storage, cross-cluster federation, and high availability. Used by Grafana Cloud and major SaaS platforms.",
      links: {
        docs: "https://cortexmetrics.io/",
        github: "https://github.com/cortexproject/cortex",
      },
    },
    {
      id: "victoria-metrics",
      name: "VictoriaMetrics",
      type: "platform",
      languages: ["go"],
      description:
        "High-performance Prometheus alternative with 10x better compression and query speed. Drop-in replacement with PromQL support. Single-node and cluster modes available.",
      links: {
        docs: "https://docs.victoriametrics.com/",
        github: "https://github.com/VictoriaMetrics/VictoriaMetrics",
      },
    },
    {
      id: "prom-client-node",
      name: "prom-client (Node.js)",
      type: "library",
      languages: ["typescript", "javascript"],
      description:
        "Official Prometheus client for Node.js. Supports all metric types, custom collectors, and default metrics (CPU, memory, GC). Used by 100k+ npm projects.",
      links: {
        docs: "https://github.com/siimon/prom-client",
        github: "https://github.com/siimon/prom-client",
        npm: "https://www.npmjs.com/package/prom-client",
      },
      codeSnippet: `import client from 'prom-client';
const counter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total requests',
  labelNames: ['method', 'status']
});
counter.inc({ method: 'GET', status: 200 });`,
    },
    {
      id: "prometheus-client-python",
      name: "prometheus_client (Python)",
      type: "library",
      languages: ["python"],
      description:
        "Official Prometheus client for Python. Multi-process support for gunicorn/uwsgi. Includes decorators, context managers, and WSGI middleware.",
      links: {
        docs: "https://github.com/prometheus/client_python",
        github: "https://github.com/prometheus/client_python",
      },
      codeSnippet: `from prometheus_client import Counter
counter = Counter('requests', 'Requests')
counter.inc()`,
    },
  ],

  usedInSystems: [
    {
      systemId: "soundcloud",
      systemName: "SoundCloud Audio Streaming Platform",
      howUsed:
        "SoundCloud pioneered Prometheus adoption in 2012, instrumenting 2000+ microservices handling 200M users. Prometheus monitors audio transcoding latency, API request rates, and database query performance across their Go-based architecture. Custom exporters track business metrics like track uploads per second, playback starts, and social graph queries. Service discovery via Consul automatically adds new service instances to scraping targets. AlertManager routes critical alerts (transcoding failures, database connection exhaustion) to PagerDuty, while warnings go to Slack. Grafana dashboards provide real-time visibility into the RED metrics (Rate, Errors, Duration) for every service. Long-term metrics stored in InfluxDB for capacity planning. Pattern composition: Prometheus (metrics) + Consul (service discovery) + AlertManager (alerting) + Grafana (visualization). Rationale: With millions of uploads daily and unpredictable viral content, real-time observability prevents cascading failures and enables rapid incident response. Impact: Reduced MTTR from 45 minutes to 5 minutes; detected and mitigated 99% of incidents before user impact; enabled confident deployments of 200+ services/week.",
      source:
        "https://developers.soundcloud.com/blog/prometheus-monitoring-at-soundcloud",
    },
    {
      systemId: "digitalocean",
      systemName: "DigitalOcean Cloud Infrastructure",
      howUsed:
        "DigitalOcean uses Prometheus to monitor 100% of their cloud infrastructure: 100k+ virtual machine instances, block storage, load balancers, and managed databases. Prometheus tracks host-level metrics (CPU, memory, disk I/O, network throughput) via node_exporter on every hypervisor. Custom exporters monitor API gateway request latency, database connection pools, and queue depths. Kubernetes clusters expose cAdvisor metrics for container monitoring. Multi-dimensional labels (region, availability zone, instance type) enable powerful PromQL queries for capacity planning. AlertManager integration detects infrastructure anomalies: disk space exhaustion, memory pressure, abnormal API error rates. Thanos provides long-term storage (1 year retention) for historical analysis and billing. Grafana dashboards give SRE teams real-time visibility into platform health. Pattern composition: Prometheus (metrics) + Thanos (long-term storage) + Kubernetes (orchestration) + AlertManager (alerting). Rationale: Managing hundreds of thousands of instances requires automated monitoring and alerting; manual approaches don't scale. Impact: Achieved 99.99% infrastructure uptime; detected 95% of incidents via automated alerts; reduced manual toil by 80%; enabled data-driven capacity planning that saved $10M in infrastructure costs.",
      source: "https://www.digitalocean.com/blog/",
    },
    {
      systemId: "grafana-labs",
      systemName: "Grafana Labs Observability Platform",
      howUsed:
        "Grafana Labs self-monitors their SaaS platform (Grafana Cloud) using Prometheus, handling 10 billion metrics per day. Prometheus monitors their Loki (logs), Mimir (metrics), and Tempo (traces) services. Custom metrics track ingestion rates, query latency, and compaction performance. Multi-tenant architecture uses label-based isolation to separate customer metrics. Cortex (now Mimir) provides horizontally scalable Prometheus storage with 13-month retention. AlertManager manages 1000+ alerting rules for SLO violations: query latency P99 > 1s, ingestion lag > 30s, disk usage > 80%. Prometheus federation aggregates metrics from 50+ regional clusters into global dashboards. Recording rules pre-compute expensive queries for instant dashboard loading. Pattern composition: Prometheus (collection) + Cortex/Mimir (storage) + Grafana (visualization) + AlertManager (alerting) + Recording Rules (optimization). Rationale: As observability vendors, Grafana Labs must practice what they preach—reliable monitoring of their own infrastructure builds customer trust. Impact: Maintained 99.95% SLA across 100+ customers; reduced query latency P99 from 5s to 500ms; detected 99.9% of incidents before customer reports; enabled transparent SLO reporting to customers.",
      source: "https://grafana.com/blog/",
    },
    {
      systemId: "gitlab",
      systemName: "GitLab DevOps Platform",
      howUsed:
        "GitLab instruments their production environment (gitlab.com) with Prometheus, monitoring 10M+ users performing Git operations, CI/CD pipelines, and issue tracking. Prometheus tracks Rails application metrics (request rate, latency, error rate), background job queue depths (Sidekiq), and database query performance (PostgreSQL). Custom exporters monitor Git repository size, merge request throughput, and CI pipeline duration. Kubernetes service discovery automatically scrapes metrics from 500+ pods. AlertManager routes alerts based on severity and component: database slowness → database team, CI failures → CI team. SLO-based alerting ensures 99.95% availability for critical paths (Git clone, push, CI pipeline execution). Grafana dashboards display RED metrics for every service, with drill-down into specific endpoints. Thanos stores 1 year of metrics for capacity planning and postmortem analysis. Pattern composition: Prometheus (metrics) + Kubernetes (orchestration) + Thanos (long-term storage) + AlertManager (routing) + Grafana (visualization). Rationale: With 30M projects and continuous deployment (50+ deploys/day), real-time observability prevents deployment-induced outages and enables rapid rollbacks. Impact: Achieved 99.95% availability SLA; reduced deployment-related incidents by 90%; decreased MTTR from 30 minutes to 10 minutes; enabled confident feature flag rollouts affecting millions of users.",
      source: "https://about.gitlab.com/handbook/engineering/monitoring/",
    },
    {
      systemId: "shopify",
      systemName: "Shopify E-Commerce Platform",
      howUsed:
        "Shopify relies on Prometheus to monitor their platform during high-traffic events like Black Friday (80M+ concurrent visitors). Prometheus tracks checkout latency, payment gateway success rates, and inventory update throughput. Custom metrics monitor business KPIs: orders per second, revenue per minute, cart abandonment rates. Multi-dimensional labels (shop_id, region, product_category) enable merchant-specific dashboards. AlertManager integration provides tiered alerting: P0 (checkout failures) → immediate PagerDuty, P1 (latency spikes) → Slack warnings. Recording rules pre-compute complex queries (revenue aggregations, conversion funnels) for instant dashboard updates during traffic spikes. Horizontal pod autoscaling in Kubernetes uses Prometheus metrics (request rate, CPU, memory) to scale services dynamically. Thanos federation aggregates metrics from 10+ regional Prometheus clusters for global visibility. Pattern composition: Prometheus (metrics) + Kubernetes HPA (autoscaling) + Thanos (federation) + AlertManager (tiering) + Recording Rules (optimization). Rationale: Black Friday generates 10x normal traffic; real-time monitoring and automated alerting prevent revenue loss from outages or degraded performance. Impact: Processed $6.3B in sales during Black Friday 2022 with 99.99% checkout availability; detected and mitigated 15 potential incidents before user impact; enabled dynamic scaling that handled 10x traffic without manual intervention; reduced infrastructure costs by 20% via metric-driven rightsizing.",
      source: "https://shopify.engineering/",
    },
  ],

  philosophy: {
    coreProblem:
      "Cloud-native applications with hundreds of microservices and ephemeral containers require automated, scalable monitoring that adapts to dynamic infrastructure",
    designPrinciple:
      "Pull-based metrics collection with multi-dimensional labels enables powerful queries and works reliably in firewalled, NAT-heavy environments where push-based systems fail",
    historicalContext:
      "Created at SoundCloud in 2012 to monitor their Go-based microservices architecture. Donated to CNCF in 2016 and graduated in 2018, becoming the de facto standard for Kubernetes monitoring.",
    alternativesRejected: [
      "Push-based systems (Graphite, StatsD) - tight coupling, lost metrics in transit, doesn't work with firewalls/NAT",
      "Single-dimensional metrics - inflexible, can't slice by multiple dimensions (service + region + version)",
      "Manual service configuration - doesn't scale with ephemeral containers",
      "External alerting services - added complexity, vendor lock-in",
    ],
    mentalModel:
      "Prometheus is like a census taker that walks door-to-door (pulls) asking standardized questions (/metrics endpoint), rather than waiting for people to mail in responses (push). The census taker knows which houses to visit (service discovery) and records answers in a structured database (TSDB) for later analysis (PromQL).",
  },

  visualization: {
    staticDiagram: `graph LR
    SD[Service Discovery] -->|Targets| PS[Prometheus Server]
    PS -->|Scrape /metrics| S1[Service 1]
    PS -->|Scrape /metrics| S2[Service 2]
    PS -->|Store| TSDB[(Time-Series DB)]
    PS -->|Alerts| AM[AlertManager]
    AM -->|Notify| PD[PagerDuty]
    AM -->|Notify| SL[Slack]
    TSDB -->|Query| GR[Grafana]
    PS -->|Long-term| TH[Thanos/Cortex]`,
    realWorldAnalogy:
      "Prometheus is like a health inspector who visits restaurants (services) on a regular schedule, checking temperature logs and cleanliness scores (/metrics endpoint). The inspector has a list of all restaurants in the district (service discovery) and records findings in a logbook (TSDB). If critical violations are found (alerting rules), the inspector immediately notifies the health department (AlertManager → PagerDuty). Historical inspection records help identify trends and plan resources.",
    useCases: [
      {
        domain: "E-Commerce",
        scenario:
          "Black Friday traffic surges 10x. Prometheus monitors checkout latency, payment success rates, and inventory levels in real-time. AlertManager fires PagerDuty alerts when checkout P95 latency exceeds 1s, enabling rapid response before customer complaints.",
        patternRole:
          "Real-time SLO monitoring with automated alerting prevents revenue loss",
        companies: ["Shopify", "Amazon", "eBay"],
      },
      {
        domain: "SaaS Platforms",
        scenario:
          "Multi-tenant application serves 1000+ customers. Prometheus tracks per-tenant metrics (API calls, storage usage, active users) with tenant_id labels. Recording rules aggregate across tenants for platform-wide dashboards while enabling customer-specific insights.",
        patternRole:
          "Multi-dimensional labels enable per-customer observability at scale",
        companies: ["GitLab", "Grafana Labs", "DigitalOcean"],
      },
      {
        domain: "Streaming Media",
        scenario:
          "Viral content causes unpredictable load spikes. Prometheus monitors transcoding queue depth, CDN hit rates, and player buffering events. Kubernetes HPA uses Prometheus metrics to autoscale transcoding workers, handling viral traffic without manual intervention.",
        patternRole:
          "Metrics-driven autoscaling adapts infrastructure to demand",
        companies: ["SoundCloud", "Spotify", "Netflix"],
      },
    ],
  },

  tags: [
    "observability",
    "metrics",
    "monitoring",
    "alerting",
    "prometheus",
    "time-series",
    "cloud-native",
    "kubernetes",
    "sre",
  ],
  difficulty: "intermediate",
};
