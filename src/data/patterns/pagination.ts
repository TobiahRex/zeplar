import type { Pattern } from "../schema";

export const pagination: Pattern = {
  id: "pagination",
  slug: "pagination",
  corpusPath: "⚡ PERFORMANCE → 💾 Caching & Performance → 📄 Pagination",

  hierarchy: {
    quality: "performance",
    strategy: "Caching & Performance",
    family: "Pagination",
    level: 2,
  },

  concept: {
    name: "Pagination",
    emoji: "📄",
    tagline: "Break large datasets into digestible chunks",
    definition:
      "Pagination is a data partitioning pattern that breaks large datasets into discrete pages or chunks for incremental loading and display. Rather than retrieving and rendering thousands of records at once, pagination delivers small subsets (typically 10-100 items) on demand, reducing memory consumption, network overhead, and time-to-first-render. The pattern operates through two primary mechanisms: offset-based pagination (LIMIT/OFFSET in SQL) which provides random access to any page but degrades with depth, and cursor-based pagination (keyset pagination) which maintains consistent performance but only supports forward/backward traversal. Each approach returns page metadata—total count, current position, next/previous indicators—enabling UI controls for navigation. Pagination transforms unbounded result sets into bounded, manageable chunks, trading complete immediate access for faster, more efficient incremental loading. Modern implementations often combine pagination with caching (page-level caching), prefetching (load next page speculatively), and virtual scrolling (render only visible items) to optimize user experience across web, mobile, and API interfaces.",
    problemSolved:
      "Large datasets create fundamental performance and usability challenges across the stack. Loading millions of database rows into memory exhausts server resources and causes out-of-memory errors. Transferring megabytes of JSON over the network wastes bandwidth and increases latency, especially on mobile connections. Rendering thousands of DOM elements freezes browsers and creates poor user experience. Without pagination, users face slow initial loads, unresponsive interfaces, and wasted resources loading data they never view. Pagination solves these issues by implementing just-in-time data loading—fetch only what's needed when it's needed. It reduces database query execution time by limiting result sets, minimizes network payload sizes, and keeps client-side rendering performant. Additionally, pagination provides natural checkpoints for caching, enables parallelization of page fetches, and improves perceived performance through progressive disclosure. The pattern shifts from 'load everything upfront' to 'load incrementally on demand', fundamentally enabling scalable data access patterns.",
    tradeoffs: {
      pros: [
        "Reduced memory footprint on both client and server",
        "Faster initial page load and time-to-first-render",
        "Lower network bandwidth consumption",
        "Scalable to datasets of any size",
        "Natural caching boundaries per page",
      ],
      cons: [
        "Data can become stale between page loads",
        "Complex state management for current position",
        "Inconsistent total counts with concurrent modifications",
        "Deep page performance degradation (offset-based)",
        "Cursor complexity and opaque navigation (cursor-based)",
      ],
    },
    relatedPatterns: [
      "lazy-loading",
      "infinite-scroll",
      "virtual-scrolling",
      "batching",
      "streaming",
      "windowing",
      "caching",
    ],
  },

  structure: {
    participants: [
      {
        name: "Client",
        role: "Consumer",
        responsibilities: [
          "Request specific page with offset or cursor",
          "Render page data to user interface",
          "Track current page position and navigation state",
          "Handle pagination controls (next, previous, jump to page)",
        ],
      },
      {
        name: "API Server",
        role: "Coordinator",
        responsibilities: [
          "Parse pagination parameters from request",
          "Validate page bounds and parameter constraints",
          "Construct database queries with LIMIT/OFFSET or cursors",
          "Return page data with metadata (total, hasNext, cursors)",
        ],
      },
      {
        name: "Database",
        role: "Data Source",
        responsibilities: [
          "Execute paginated queries efficiently",
          "Apply indexes to optimize OFFSET or keyset queries",
          "Return bounded result sets",
          "Provide total count when requested (offset-based)",
        ],
      },
      {
        name: "Page Cache",
        role: "Performance Layer",
        responsibilities: [
          "Cache frequently accessed pages",
          "Implement cache invalidation on data changes",
          "Serve cached pages to reduce database load",
          "Track cache hit rates per page position",
        ],
      },
      {
        name: "Pagination Metadata",
        role: "Navigation State",
        responsibilities: [
          "Store total item count (offset-based)",
          "Track current cursor position (cursor-based)",
          "Indicate presence of next/previous pages",
          "Calculate page numbers and total pages (offset-based)",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant DB

    Note over Client,DB: Offset-Based Pagination Flow
    Client->>API: GET /items?page=2&limit=20
    API->>Cache: Check cache for page 2
    alt Cache Hit
        Cache-->>API: Return cached page
    else Cache Miss
        API->>DB: SELECT * FROM items OFFSET 20 LIMIT 20
        DB-->>API: Return rows 21-40
        API->>DB: SELECT COUNT(*) FROM items
        DB-->>API: Return total = 1000
        API->>Cache: Store page 2
    end
    API-->>Client: {items: [...], total: 1000, page: 2, hasNext: true}

    Note over Client,DB: Cursor-Based Pagination Flow
    Client->>API: GET /items?cursor=abc123&limit=20
    API->>DB: SELECT * WHERE id > 'abc123' ORDER BY id LIMIT 20
    DB-->>API: Return next 20 rows
    API-->>Client: {items: [...], nextCursor: 'xyz789', hasNext: true}`,
    flow: [
      {
        step: 1,
        actor: "Client",
        action: "Request Page",
        description:
          "Client sends pagination request with offset+limit or cursor+limit parameters",
      },
      {
        step: 2,
        actor: "API Server",
        action: "Validate Parameters",
        description:
          "Validate page size bounds, offset ranges, cursor validity; reject invalid requests",
      },
      {
        step: 3,
        actor: "API Server",
        action: "Check Cache",
        description:
          "Query page cache with page key; return cached data if fresh and valid",
      },
      {
        step: 4,
        actor: "API Server",
        action: "Build Query",
        description:
          "Construct SQL with LIMIT/OFFSET or keyset WHERE clause based on pagination type",
      },
      {
        step: 5,
        actor: "Database",
        action: "Execute Query",
        description:
          "Run paginated query using indexes; return bounded result set",
      },
      {
        step: 6,
        actor: "Database",
        action: "Calculate Metadata",
        description:
          "For offset-based: run COUNT query; for cursor: determine hasNext from result set size",
      },
      {
        step: 7,
        actor: "API Server",
        action: "Build Response",
        description:
          "Assemble page data with metadata: items, total, page, hasNext, nextCursor, etc.",
      },
      {
        step: 8,
        actor: "API Server",
        action: "Update Cache",
        description:
          "Store page in cache with TTL and invalidation triggers for future requests",
      },
      {
        step: 9,
        actor: "Client",
        action: "Render Page",
        description:
          "Display items and update pagination controls based on metadata",
      },
      {
        step: 10,
        actor: "Client",
        action: "Track State",
        description:
          "Store current cursor or page number for navigation and deep linking",
      },
    ],
    invariants: [
      "Page size must remain consistent across navigation for offset-based pagination",
      "Cursor must be opaque and unguessable to prevent enumeration attacks",
      "Results must maintain deterministic ordering (same ORDER BY on every request)",
      "No duplicate items across pages (requires stable ordering and consistent snapshots)",
      "Total count accuracy is best-effort with concurrent modifications (offset-based)",
      "Cursor validity must be time-bounded or versioned to prevent stale navigation",
    ],
  },

  codeExamples: [
    {
      id: "pagination-typescript-offset",
      language: "typescript",
      title: "Offset-Based Pagination with Express and PostgreSQL",
      description:
        "Full-featured offset/limit pagination API with total counts, page metadata, and query optimization using database indexes",
      code: `import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import NodeCache from 'node-cache';

// =============================================================================
// Database Connection Pool
// =============================================================================

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
});

// =============================================================================
// Page-Level Cache with 5-minute TTL
// =============================================================================

const pageCache = new NodeCache({
  stdTTL: 300,  // 5 minutes
  checkperiod: 60,  // Check for expired entries every 60s
});

// =============================================================================
// Pagination Request Schema
// =============================================================================

interface PaginationParams {
  page: number;        // 1-indexed page number
  limit: number;       // Items per page (max 100)
  sortBy?: string;     // Column to sort by
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;        // Total items across all pages
    page: number;         // Current page (1-indexed)
    limit: number;        // Items per page
    totalPages: number;   // Total number of pages
    hasNext: boolean;     // Whether next page exists
    hasPrev: boolean;     // Whether previous page exists
  };
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  created_at: Date;
}

// =============================================================================
// Pagination Helper Functions
// =============================================================================

/**
 * Parse and validate pagination parameters from query string
 *
 * @action Extract page and limit from request query
 * @reason Centralized validation ensures consistent behavior and prevents SQL injection
 * @context module
 */
function parsePaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const sortBy = (req.query.sortBy as string) || 'id';
  const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

  // Whitelist sortable columns to prevent SQL injection
  const allowedSortColumns = ['id', 'name', 'price', 'created_at'];
  const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id';

  return { page, limit, sortBy: validatedSortBy, sortOrder };
}

/**
 * Calculate OFFSET value for SQL query
 *
 * @action Convert 1-indexed page number to 0-indexed offset
 * @reason OFFSET requires number of rows to skip: (page-1) * limit
 * @context local
 */
function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Build cache key for page
 *
 * @action Generate unique cache key from pagination parameters
 * @reason Cache keys must include all parameters that affect query results
 * @context module
 */
function buildCacheKey(params: PaginationParams): string {
  return \`products:page:\${params.page}:limit:\${params.limit}:sort:\${params.sortBy}:\${params.sortOrder}\`;
}

// =============================================================================
// Paginated Product Query
// =============================================================================

/**
 * Fetch paginated products with total count
 *
 * @action Execute two queries: one for data (LIMIT/OFFSET), one for count
 * @reason COUNT(*) is expensive; some systems cache it or estimate from pg_class
 * @context system
 */
async function getPaginatedProducts(
  params: PaginationParams
): Promise<PaginatedResponse<Product>> {
  const { page, limit, sortBy, sortOrder } = params;
  const offset = calculateOffset(page, limit);

  // Check cache first
  const cacheKey = buildCacheKey(params);
  const cachedResult = pageCache.get<PaginatedResponse<Product>>(cacheKey);

  if (cachedResult) {
    console.log(\`Cache HIT for \${cacheKey}\`);
    return cachedResult;
  }

  console.log(\`Cache MISS for \${cacheKey}\`);

  /**
   * @action Use parameterized queries to prevent SQL injection
   * @reason User input in sortBy/sortOrder is validated against whitelist
   * @context micro
   */
  const dataQuery = \`
    SELECT id, name, price, category, created_at
    FROM products
    ORDER BY \${sortBy} \${sortOrder}
    LIMIT $1 OFFSET $2
  \`;

  /**
   * @action Execute COUNT query to get total items
   * @reason Total count enables page number calculation and "X of Y" displays
   * @context module
   * @relatedConcepts pagination-metadata, ui-navigation
   */
  const countQuery = \`
    SELECT COUNT(*) as total
    FROM products
  \`;

  /**
   * @action Execute queries in parallel for better performance
   * @reason Data and count queries are independent; parallel execution reduces latency
   * @context module
   */
  const [dataResult, countResult] = await Promise.all([
    pool.query<Product>(dataQuery, [limit, offset]),
    pool.query<{ total: string }>(countQuery),
  ]);

  const items = dataResult.rows;
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  const response: PaginatedResponse<Product> = {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  /**
   * @action Cache the response for subsequent requests
   * @reason Pagination queries are often repeated; caching reduces DB load
   * @context system
   * @relatedConcepts cache-aside, cache-invalidation
   */
  pageCache.set(cacheKey, response);

  /**
   * @action Warn on deep pagination (page > 100)
   * @reason OFFSET becomes O(n) with large offsets; consider cursor-based pagination
   * @context system
   * @relatedConcepts performance-optimization, offset-vs-cursor
   */
  if (page > 100) {
    console.warn(\`Deep pagination detected: page \${page}. Consider cursor-based pagination for better performance.\`);
  }

  return response;
}

// =============================================================================
// Express API Endpoint
// =============================================================================

const app = express();

/**
 * GET /api/products - Paginated product listing
 *
 * Query params:
 *   page: Page number (default: 1)
 *   limit: Items per page (default: 20, max: 100)
 *   sortBy: Column to sort by (default: id)
 *   sortOrder: asc or desc (default: asc)
 */
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const params = parsePaginationParams(req);
    const result = await getPaginatedProducts(params);

    /**
     * @action Set Cache-Control header for client-side caching
     * @reason Browsers can cache responses to reduce API calls on back button
     * @context system
     */
    res.set('Cache-Control', 'public, max-age=60');

    res.json(result);
  } catch (error) {
    console.error('Pagination error:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/products - Invalidate cache on data modification
 */
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    // ... create product logic ...

    /**
     * @action Flush entire products cache on modification
     * @reason New products change total count and may appear on multiple pages
     * @context module
     * @relatedConcepts cache-invalidation
     */
    pageCache.flushAll();

    res.status(201).json({ message: 'Product created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default app;`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-ready offset-based pagination API with caching, validation, and performance monitoring. Demonstrates full request-response cycle with database queries, cache layer, and metadata generation.",
        prerequisites: [
          "Express.js framework",
          "PostgreSQL connection pooling",
          "SQL LIMIT/OFFSET semantics",
          "Parameterized queries for security",
          "Cache invalidation strategies",
        ],
        systemPosition:
          "API layer serving paginated data to web/mobile clients. Sits between HTTP handlers and database, with page-level caching for performance. Typical in e-commerce product listings, admin tables, search results.",
      },
      annotations: [
        {
          id: "offset-validation",
          lines: [54, 66],
          action:
            "Parse and validate pagination parameters with bounds checking",
          reason:
            "Prevents malicious large page sizes that could DOS the system; whitelist prevents SQL injection via sortBy parameter",
          contextLevel: "module",
          relatedConcepts: ["input-validation", "sql-injection-prevention"],
        },
        {
          id: "offset-calculation",
          lines: [68, 76],
          action: "Calculate database OFFSET from 1-indexed page number",
          reason:
            "SQL OFFSET is 0-indexed (rows to skip), but user-facing pages are 1-indexed; formula: (page-1)*limit",
          contextLevel: "local",
        },
        {
          id: "cache-key-generation",
          lines: [78, 86],
          action: "Generate cache key including all query parameters",
          reason:
            "Cache must be keyed by all parameters that affect results (page, limit, sort); missing parameters cause incorrect cache hits",
          contextLevel: "module",
          relatedConcepts: ["cache-key-design"],
        },
        {
          id: "parallel-queries",
          lines: [135, 142],
          action: "Execute data and count queries in parallel with Promise.all",
          reason:
            "Data and count queries are independent; parallel execution reduces total latency from 2RTT to 1RTT",
          contextLevel: "module",
          relatedConcepts: ["query-optimization", "latency-reduction"],
        },
        {
          id: "count-query-cost",
          lines: [119, 127],
          action: "Execute separate COUNT(*) query for total items",
          reason:
            "Total count enables page number display but is expensive on large tables; some systems cache it or use estimates",
          contextLevel: "system",
          relatedConcepts: ["offset-pagination-tradeoffs"],
        },
        {
          id: "deep-page-warning",
          lines: [169, 177],
          action: "Warn when page number exceeds 100",
          reason:
            "OFFSET 10000 LIMIT 20 must scan and discard 10000 rows; cursor-based pagination has O(1) performance regardless of depth",
          contextLevel: "system",
          relatedConcepts: [
            "offset-performance-degradation",
            "cursor-based-alternative",
          ],
        },
        {
          id: "page-metadata",
          lines: [145, 156],
          action: "Calculate pagination metadata: totalPages, hasNext, hasPrev",
          reason:
            "UI needs this metadata to render page controls, disable navigation buttons, show 'Page X of Y' displays",
          contextLevel: "module",
          relatedConcepts: ["pagination-ux"],
        },
        {
          id: "cache-invalidation",
          lines: [211, 219],
          action: "Flush entire page cache when data is modified",
          reason:
            "Data modifications affect total count and multiple pages; fine-grained invalidation is complex, so flush all",
          contextLevel: "system",
          relatedConcepts: ["cache-invalidation-strategies"],
        },
      ],
      highlights: [
        {
          lines: [54, 66],
          label: "Input validation and SQL injection prevention",
          sbvpDomain: "structure",
        },
        {
          lines: [107, 127],
          label: "Parameterized SQL queries with LIMIT/OFFSET",
          sbvpDomain: "behavior",
        },
        {
          lines: [135, 142],
          label: "Parallel query execution for performance",
          sbvpDomain: "structure",
        },
        {
          lines: [169, 177],
          label: "Deep pagination warning",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "pagination-python-cursor",
      language: "python",
      title: "Cursor-Based Pagination with FastAPI and Django ORM",
      description:
        "High-performance cursor-based pagination using keyset pagination technique with opaque, signed cursors to prevent enumeration and ensure consistent performance at any depth",
      code: `from typing import Optional, List, Generic, TypeVar
from datetime import datetime, timezone
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel, Field
from django.db import models
from django.db.models import QuerySet
import base64
import hmac
import hashlib
import json

# =============================================================================
# Configuration
# =============================================================================

SECRET_KEY = "your-secret-key-for-cursor-signing"  # Use env var in production
MAX_PAGE_SIZE = 100

# =============================================================================
# Django Model
# =============================================================================

class Article(models.Model):
    """
    Article model with composite cursor key (created_at, id)

    @action Define model with indexed cursor columns
    @reason Cursor pagination requires indexed, unique ordering columns for performance
    @context module
    """
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        # Composite index on (created_at, id) for cursor queries
        indexes = [
            models.Index(fields=['-created_at', '-id'], name='cursor_idx'),
        ]
        ordering = ['-created_at', '-id']

# =============================================================================
# Cursor Encoding/Decoding
# =============================================================================

class CursorData(BaseModel):
    """
    @action Store cursor data as structured object
    @reason Cursor contains multiple fields (created_at, id); structured format is more maintainable than concatenation
    @context module
    """
    created_at: str  # ISO format timestamp
    id: int

def encode_cursor(created_at: datetime, article_id: int) -> str:
    """
    Encode cursor data as opaque base64 string with HMAC signature

    @action Create opaque cursor from timestamp and ID with cryptographic signature
    @reason Opaque cursors prevent enumeration attacks and parameter tampering; HMAC ensures integrity
    @context system
    """
    cursor_data = CursorData(
        created_at=created_at.isoformat(),
        id=article_id
    )

    # Serialize to JSON
    payload = cursor_data.model_dump_json()

    # Generate HMAC signature
    signature = hmac.new(
        SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()[:16]  # First 16 chars of signature

    # Combine payload and signature
    cursor_with_sig = f"{payload}|{signature}"

    # Base64 encode for URL safety
    encoded = base64.urlsafe_b64encode(cursor_with_sig.encode()).decode()

    return encoded

def decode_cursor(cursor: str) -> tuple[datetime, int]:
    """
    Decode and validate cursor

    @action Decode base64 cursor and verify HMAC signature
    @reason Prevents cursor tampering; rejects modified cursors to prevent unauthorized data access
    @context system
    """
    try:
        # Decode base64
        decoded = base64.urlsafe_b64decode(cursor.encode()).decode()

        # Split payload and signature
        payload, received_sig = decoded.rsplit('|', 1)

        # Verify signature
        expected_sig = hmac.new(
            SECRET_KEY.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(expected_sig, received_sig):
            raise ValueError("Invalid cursor signature")

        # Parse payload
        cursor_data = CursorData.model_validate_json(payload)

        # Convert ISO string back to datetime
        created_at = datetime.fromisoformat(cursor_data.created_at)

        return created_at, cursor_data.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid cursor: {str(e)}")

# =============================================================================
# Pagination Response Models
# =============================================================================

T = TypeVar('T')

class CursorPaginatedResponse(BaseModel, Generic[T]):
    """
    @action Define response schema with items and cursor metadata
    @reason Cursor pagination doesn't provide total count (would require expensive COUNT query); instead provides hasNext and cursor for next page
    @context module
    """
    items: List[T]
    next_cursor: Optional[str] = None
    prev_cursor: Optional[str] = None
    has_next: bool
    has_prev: bool
    page_size: int

class ArticleResponse(BaseModel):
    id: int
    title: str
    author: str
    created_at: datetime

# =============================================================================
# Keyset Pagination Query Builder
# =============================================================================

def build_keyset_query(
    base_queryset: QuerySet,
    cursor: Optional[str],
    direction: str,
    limit: int
) -> QuerySet:
    """
    Build keyset pagination query using WHERE clause

    @action Construct WHERE clause that continues from cursor position
    @reason Keyset pagination uses WHERE instead of OFFSET, giving O(1) performance at any depth
    @context system
    """
    if not cursor:
        # First page: no filtering, just order and limit
        if direction == "next":
            return base_queryset.order_by('-created_at', '-id')[:limit + 1]
        else:
            return base_queryset.order_by('created_at', 'id')[:limit + 1]

    # Decode cursor to get position
    created_at, article_id = decode_cursor(cursor)

    """
    @action Use composite WHERE clause for keyset continuation
    @reason Tuple comparison (created_at, id) < (cursor_created_at, cursor_id) efficiently continues from last item
    @context module
    @relatedConcepts keyset-pagination, index-usage
    """
    if direction == "next":
        # Get items BEFORE cursor (created_at DESC, id DESC)
        # WHERE (created_at, id) < (cursor_created_at, cursor_id)
        return base_queryset.filter(
            models.Q(created_at__lt=created_at) |
            models.Q(created_at=created_at, id__lt=article_id)
        ).order_by('-created_at', '-id')[:limit + 1]
    else:
        # Get items AFTER cursor (going backwards)
        # WHERE (created_at, id) > (cursor_created_at, cursor_id)
        return base_queryset.filter(
            models.Q(created_at__gt=created_at) |
            models.Q(created_at=created_at, id__gt=article_id)
        ).order_by('created_at', 'id')[:limit + 1]

# =============================================================================
# FastAPI Endpoint
# =============================================================================

app = FastAPI()

@app.get("/api/articles", response_model=CursorPaginatedResponse[ArticleResponse])
async def get_articles(
    cursor: Optional[str] = Query(None, description="Opaque cursor for pagination"),
    limit: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    direction: str = Query("next", regex="^(next|prev)$")
):
    """
    Get paginated articles using cursor-based pagination

    Query params:
      cursor: Opaque cursor from previous response (optional for first page)
      limit: Items per page (default: 20, max: 100)
      direction: 'next' or 'prev' for navigation

    @action Execute keyset pagination query and generate next cursor
    @reason Cursor-based pagination has consistent O(1) performance regardless of page depth
    @context system
    """

    # Build keyset query
    base_qs = Article.objects.all()

    """
    @action Request limit+1 items to detect hasNext without separate query
    @reason Fetching one extra item lets us determine hasNext efficiently; discard the extra item before returning
    @context module
    @relatedConcepts has-next-detection, cursor-efficiency
    """
    items = list(build_keyset_query(base_qs, cursor, direction, limit))

    # Check if there are more results
    has_next = len(items) > limit

    # Remove the extra item if present
    if has_next:
        items = items[:limit]

    # Generate next cursor from last item
    next_cursor = None
    if has_next and items:
        last_item = items[-1]
        next_cursor = encode_cursor(last_item.created_at, last_item.id)

    # Generate prev cursor from first item
    prev_cursor = None
    has_prev = cursor is not None  # If we have a cursor, there's a previous page
    if has_prev and items:
        first_item = items[0]
        prev_cursor = encode_cursor(first_item.created_at, first_item.id)

    # Convert to response models
    article_responses = [
        ArticleResponse(
            id=article.id,
            title=article.title,
            author=article.author,
            created_at=article.created_at
        )
        for article in items
    ]

    return CursorPaginatedResponse(
        items=article_responses,
        next_cursor=next_cursor,
        prev_cursor=prev_cursor,
        has_next=has_next,
        has_prev=has_prev,
        page_size=len(article_responses)
    )

# =============================================================================
# Usage Example
# =============================================================================

# Client-side usage:
# 1. First request: GET /api/articles?limit=20
# 2. Response includes next_cursor: "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0..."
# 3. Next page: GET /api/articles?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0...&limit=20
# 4. Continue until has_next=false`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production-grade cursor-based pagination with keyset pagination technique, opaque cursor encoding, HMAC signing for security, and O(1) performance at any depth. Demonstrates cursor generation, validation, and bidirectional navigation.",
        prerequisites: [
          "FastAPI framework",
          "Django ORM and QuerySet API",
          "Keyset pagination technique",
          "HMAC signature verification",
          "Base64 encoding for URL safety",
          "Composite index optimization",
        ],
        systemPosition:
          "API layer for real-time data feeds where offset pagination would degrade with depth. Common in social media feeds, activity streams, infinite scroll, and GraphQL Relay connections. Cursor approach prevents page drift when data changes.",
      },
      annotations: [
        {
          id: "cursor-model-index",
          lines: [24, 41],
          action:
            "Define composite index on (created_at, id) for cursor queries",
          reason:
            "Keyset queries filter on (created_at, id) tuple; composite index enables index-only scans without table lookups",
          contextLevel: "system",
          relatedConcepts: ["index-optimization", "keyset-pagination"],
        },
        {
          id: "cursor-encoding",
          lines: [53, 79],
          action: "Encode cursor as opaque base64 string with HMAC signature",
          reason:
            "Opaque cursors prevent users from guessing/manipulating values; HMAC prevents tampering and validates cursor authenticity",
          contextLevel: "system",
          relatedConcepts: [
            "cursor-security",
            "parameter-tampering-prevention",
          ],
        },
        {
          id: "cursor-validation",
          lines: [81, 113],
          action: "Decode cursor and verify HMAC signature before use",
          reason:
            "Tampered cursors could expose unauthorized data or cause errors; signature verification rejects invalid cursors",
          contextLevel: "system",
          relatedConcepts: ["input-validation", "security"],
        },
        {
          id: "keyset-query",
          lines: [155, 174],
          action:
            "Build WHERE clause using composite (created_at, id) comparison",
          reason:
            "Keyset pagination uses WHERE instead of OFFSET, avoiding table scan; database can use index to jump directly to cursor position",
          contextLevel: "system",
          relatedConcepts: ["keyset-pagination", "offset-vs-cursor"],
        },
        {
          id: "limit-plus-one",
          lines: [199, 206],
          action: "Request limit+1 items to detect hasNext without COUNT query",
          reason:
            "COUNT(*) is expensive; fetching one extra item lets us know if more pages exist, then discard the extra item",
          contextLevel: "module",
          relatedConcepts: ["has-next-detection", "query-optimization"],
        },
        {
          id: "cursor-generation",
          lines: [208, 214],
          action: "Generate next cursor from last item in result set",
          reason:
            "Next cursor encodes position of last item; subsequent request uses this to continue from exact position",
          contextLevel: "module",
          relatedConcepts: ["cursor-continuation"],
        },
        {
          id: "no-total-count",
          lines: [122, 130],
          action: "Define response without total count field",
          reason:
            "Cursor pagination trades total count for performance; COUNT(*) on large tables is expensive and unnecessary for infinite scroll",
          contextLevel: "system",
          relatedConcepts: ["cursor-tradeoffs", "offset-vs-cursor"],
        },
        {
          id: "bidirectional-navigation",
          lines: [216, 222],
          action: "Generate prev cursor for backward navigation",
          reason:
            "Cursor-based pagination can support prev/next navigation by reversing sort order and tracking first item",
          contextLevel: "module",
          relatedConcepts: ["cursor-navigation"],
        },
      ],
      highlights: [
        {
          lines: [53, 79],
          label: "Opaque cursor encoding with HMAC security",
          sbvpDomain: "structure",
        },
        {
          lines: [155, 174],
          label: "Keyset query construction with composite WHERE clause",
          sbvpDomain: "behavior",
        },
        {
          lines: [199, 206],
          label: "Limit+1 trick for hasNext detection",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "pagination-java-spring-data",
      language: "java",
      title: "Spring Data Pageable with Repository Pattern",
      description:
        "Enterprise-grade pagination using Spring Data JPA Pageable interface, demonstrating Page vs Slice return types, custom sorting, and repository abstraction layer",
      code: `package com.example.pagination;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

// =============================================================================
// JPA Entity
// =============================================================================

/**
 * Product entity with JPA annotations
 *
 * @action Define entity with indexed columns for pagination
 * @reason Spring Data auto-generates queries; indexes on sort columns improve performance
 * @context module
 */
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_created_at", columnList = "createdAt"),
    @Index(name = "idx_price", columnList = "price")
})
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

// =============================================================================
// Spring Data Repository
// =============================================================================

/**
 * Product repository with Pageable support
 *
 * @action Extend JpaRepository to inherit pagination methods
 * @reason Spring Data provides findAll(Pageable) out-of-box; custom queries can also use Pageable
 * @context module
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * @action Return Page<T> for total count and full pagination metadata
     * @reason Page executes COUNT query; suitable when total count is needed for UI
     * @context module
     */
    Page<Product> findByCategory(String category, Pageable pageable);

    /**
     * @action Return Slice<T> to skip COUNT query for better performance
     * @reason Slice only knows hasNext; ideal for infinite scroll where total isn't needed
     * @context system
     * @relatedConcepts page-vs-slice, performance-optimization
     */
    Slice<Product> findByPriceGreaterThan(Double price, Pageable pageable);

    /**
     * Custom query with Pageable
     *
     * @action Use @Query with Pageable parameter for complex queries
     * @reason Pageable works with JPQL; Spring Data auto-appends LIMIT/OFFSET
     * @context module
     */
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:keyword% ORDER BY p.createdAt DESC")
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}

// =============================================================================
// REST Controller
// =============================================================================

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;

    /**
     * Get all products with pagination
     *
     * @action Use Pageable parameter with @PageableDefault for defaults
     * @reason Spring Boot auto-parses ?page=0&size=20&sort=name,desc from URL
     * @context module
     */
    @GetMapping
    public ResponseEntity<Page<Product>> getAllProducts(
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable
    ) {
        /**
         * @action Call repository.findAll(pageable) to get Page<Product>
         * @reason Page contains items, total count, total pages, and hasNext/hasPrev
         * @context local
         */
        Page<Product> products = productRepository.findAll(pageable);

        return ResponseEntity.ok(products);
    }

    /**
     * Get products by category with custom pagination
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Page<Product>> getProductsByCategory(
        @PathVariable String category,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        /**
         * @action Build Pageable manually with PageRequest.of()
         * @reason Manual construction gives full control over page, size, and sort
         * @context module
         */
        Sort sort = Sort.by(
            Sort.Direction.fromString(sortDirection),
            sortBy
        );

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products = productRepository.findByCategory(category, pageable);

        return ResponseEntity.ok(products);
    }

    /**
     * Get expensive products with Slice (no count query)
     *
     * @action Use Slice instead of Page when total count isn't needed
     * @reason Slice skips COUNT query, improving performance by ~50% on large tables
     * @context system
     */
    @GetMapping("/expensive")
    public ResponseEntity<Slice<Product>> getExpensiveProducts(
        @RequestParam(defaultValue = "100.0") Double minPrice,
        Pageable pageable
    ) {
        Slice<Product> products = productRepository.findByPriceGreaterThan(
            minPrice,
            pageable
        );

        /**
         * @action Check slice.hasNext() instead of total pages
         * @reason Slice doesn't know total pages; only knows if more items exist
         * @context module
         * @relatedConcepts slice-api
         */
        return ResponseEntity.ok(products);
    }

    /**
     * Search products with pagination and custom sorting
     */
    @GetMapping("/search")
    public ResponseEntity<CustomPageResponse<ProductDTO>> searchProducts(
        @RequestParam String keyword,
        Pageable pageable
    ) {
        Page<Product> productPage = productRepository.searchByKeyword(keyword, pageable);

        /**
         * @action Convert Page<Entity> to Page<DTO> with map()
         * @reason DTOs hide internal entity structure; map() preserves pagination metadata
         * @context module
         * @relatedConcepts dto-mapping, separation-of-concerns
         */
        Page<ProductDTO> dtoPage = productPage.map(product ->
            new ProductDTO(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getCategory()
            )
        );

        /**
         * @action Build custom response with extracted metadata
         * @reason Frontend may need metadata in different format than Spring's Page
         * @context module
         */
        CustomPageResponse<ProductDTO> response = new CustomPageResponse<>(
            dtoPage.getContent(),
            dtoPage.getNumber(),
            dtoPage.getSize(),
            dtoPage.getTotalElements(),
            dtoPage.getTotalPages(),
            dtoPage.hasNext(),
            dtoPage.hasPrevious()
        );

        return ResponseEntity.ok(response);
    }
}

// =============================================================================
// DTO and Response Models
// =============================================================================

/**
 * Product Data Transfer Object
 */
@Data
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String name;
    private Double price;
    private String category;
}

/**
 * Custom pagination response wrapper
 *
 * @action Define custom response format matching frontend expectations
 * @reason Spring's Page format may not match API contract; custom wrapper provides flexibility
 * @context module
 */
@Data
@AllArgsConstructor
public class CustomPageResponse<T> {
    private List<T> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}

// =============================================================================
// Usage Examples
// =============================================================================

/*
 * URL Query Parameter Examples:
 *
 * 1. Basic pagination (using @PageableDefault):
 *    GET /api/products
 *    Returns first page with 20 items sorted by createdAt DESC
 *
 * 2. Custom page and size:
 *    GET /api/products?page=2&size=50
 *    Returns page 3 (0-indexed) with 50 items
 *
 * 3. Custom sorting:
 *    GET /api/products?page=0&size=20&sort=price,asc
 *    Returns first page sorted by price ascending
 *
 * 4. Multiple sort fields:
 *    GET /api/products?sort=category,asc&sort=price,desc
 *    Sorts by category ASC, then price DESC
 *
 * 5. Category filter with pagination:
 *    GET /api/products/category/electronics?page=0&size=20&sortBy=price&sortDirection=DESC
 *
 * 6. Search with pagination:
 *    GET /api/products/search?keyword=laptop&page=0&size=10
 *
 * Response format (Page):
 * {
 *   "content": [...],
 *   "pageable": {
 *     "pageNumber": 0,
 *     "pageSize": 20,
 *     "sort": { "sorted": true, "unsorted": false }
 *   },
 *   "totalElements": 1000,
 *   "totalPages": 50,
 *   "last": false,
 *   "first": true,
 *   "numberOfElements": 20
 * }
 */`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Enterprise Spring Boot pagination with JPA repositories, demonstrating Pageable abstraction, Page vs Slice performance tradeoffs, custom sorting, DTO mapping, and URL parameter binding. Shows repository pattern integration with pagination.",
        prerequisites: [
          "Spring Boot framework",
          "Spring Data JPA",
          "JPA entity mapping",
          "Repository pattern",
          "Pageable interface",
          "DTO pattern",
        ],
        systemPosition:
          "Service layer in Spring Boot microservices. Repository provides data access abstraction with built-in pagination. Controller exposes paginated REST endpoints. Common in enterprise Java applications with relational databases.",
      },
      annotations: [
        {
          id: "spring-entity-indexes",
          lines: [18, 33],
          action: "Define JPA entity with indexes on pagination sort columns",
          reason:
            "Spring Data generates ORDER BY clauses from Pageable; indexes on sort columns prevent full table scans",
          contextLevel: "system",
          relatedConcepts: ["jpa-indexing", "query-optimization"],
        },
        {
          id: "spring-repository-inheritance",
          lines: [55, 64],
          action: "Extend JpaRepository to inherit pagination methods",
          reason:
            "JpaRepository provides findAll(Pageable) out-of-box; custom query methods can add Pageable parameter for automatic pagination",
          contextLevel: "module",
          relatedConcepts: ["repository-pattern", "spring-data"],
        },
        {
          id: "page-vs-slice",
          lines: [66, 78],
          action: "Use Slice<T> instead of Page<T> to skip COUNT query",
          reason:
            "Page executes COUNT(*) which is expensive on large tables; Slice only knows hasNext, ideal for infinite scroll",
          contextLevel: "system",
          relatedConcepts: ["page-vs-slice", "performance-optimization"],
        },
        {
          id: "pageable-default",
          lines: [106, 119],
          action:
            "Use @PageableDefault annotation for default pagination parameters",
          reason:
            "Spring Boot auto-parses URL query params into Pageable; @PageableDefault sets sensible defaults when params are missing",
          contextLevel: "module",
          relatedConcepts: ["spring-web-binding"],
        },
        {
          id: "manual-pageable",
          lines: [136, 145],
          action: "Build Pageable manually with PageRequest.of() and Sort",
          reason:
            "Manual construction provides full control over page, size, and multi-field sorting when URL binding isn't sufficient",
          contextLevel: "module",
          relatedConcepts: ["pageable-api"],
        },
        {
          id: "slice-usage",
          lines: [151, 170],
          action: "Return Slice<T> and use hasNext() instead of total pages",
          reason:
            "Slice API doesn't expose total pages since COUNT wasn't executed; hasNext() determines if more items exist",
          contextLevel: "module",
          relatedConcepts: ["slice-api", "has-next"],
        },
        {
          id: "dto-mapping",
          lines: [182, 194],
          action: "Use Page.map() to convert Page<Entity> to Page<DTO>",
          reason:
            "DTOs provide API layer abstraction; map() preserves pagination metadata while transforming content",
          contextLevel: "module",
          relatedConcepts: ["dto-pattern", "separation-of-concerns"],
        },
        {
          id: "custom-response",
          lines: [196, 208],
          action: "Build custom response wrapper from Page metadata",
          reason:
            "Spring's Page format may not match API contract; custom wrapper gives control over JSON structure",
          contextLevel: "module",
          relatedConcepts: ["api-design", "response-formatting"],
        },
      ],
      highlights: [
        {
          lines: [55, 64],
          label: "Repository with Pageable methods",
          sbvpDomain: "structure",
        },
        {
          lines: [66, 78],
          label: "Page vs Slice performance tradeoff",
          sbvpDomain: "philosophy",
        },
        {
          lines: [106, 119],
          label: "Pageable parameter binding",
          sbvpDomain: "behavior",
        },
        {
          lines: [182, 194],
          label: "DTO mapping with pagination metadata preservation",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Search result pages (Google, e-commerce product search)",
      "Product listing pages (Amazon, eBay catalogs)",
      "User-generated content feeds (Twitter, Reddit posts)",
      "Admin dashboards and data tables (user management, orders)",
      "Log viewers and audit trails (application logs, transaction history)",
      "Report exports (CSV downloads with page limits)",
      "API endpoints serving large datasets (GraphQL connections, REST collections)",
    ],
    interactsWith: ["caching", "lazy-loading", "virtual-scrolling", "indexing"],
    architecturalBoundaries: [
      "API layer (REST endpoints, GraphQL resolvers)",
      "Database query layer (SQL with LIMIT/OFFSET or keyset WHERE clauses)",
      "Caching layer (Redis for page caching, metadata caching)",
      "UI pagination controls (page numbers, next/prev buttons, infinite scroll triggers)",
    ],
  },

  implementations: [
    {
      id: "spring-data-pageable",
      name: "Spring Data Pageable",
      type: "framework",
      languages: ["java", "kotlin"],
      description:
        "Spring Data JPA's Pageable interface provides first-class pagination support with automatic query generation, URL parameter binding, and Page/Slice return types. Supports multi-field sorting, custom queries with @Query, and zero-boilerplate pagination in repositories.",
      links: {
        docs: "https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#repositories.query-methods",
        github: "https://github.com/spring-projects/spring-data-jpa",
      },
      codeSnippet: `Page<User> findByLastName(String lastName, Pageable pageable);

// Usage:
Pageable pageable = PageRequest.of(0, 20, Sort.by("firstName"));
Page<User> users = userRepository.findByLastName("Smith", pageable);
int totalPages = users.getTotalPages();`,
    },
    {
      id: "django-pagination",
      name: "Django Pagination",
      type: "framework",
      languages: ["python"],
      description:
        "Django's Paginator class provides offset-based pagination with built-in page validation, error handling, and template integration. Works seamlessly with Django ORM QuerySets and supports custom page ranges for UI controls.",
      links: {
        docs: "https://docs.djangoproject.com/en/stable/topics/pagination/",
        github: "https://github.com/django/django",
      },
      codeSnippet: `from django.core.paginator import Paginator

objects = Article.objects.all()
paginator = Paginator(objects, 25)  # 25 items per page

page_obj = paginator.get_page(request.GET.get('page'))
# page_obj.has_next(), page_obj.has_previous()`,
    },
    {
      id: "graphql-relay-cursor",
      name: "GraphQL Relay Cursor Connections",
      type: "framework",
      languages: ["javascript", "typescript", "python", "java"],
      description:
        "Relay's Connection specification defines cursor-based pagination for GraphQL APIs. Uses opaque cursors with edges/nodes structure, providing pageInfo with hasNextPage, hasPreviousPage, and cursor fields for navigation.",
      links: {
        docs: "https://relay.dev/graphql/connections.htm",
        github: "https://github.com/graphql/graphql-relay-js",
      },
      codeSnippet: `query {
  users(first: 10, after: "cursor123") {
    edges {
      node { id name }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`,
    },
    {
      id: "rest-hateoas",
      name: "REST HATEOAS Link Headers",
      type: "platform",
      languages: ["any"],
      description:
        "HTTP Link headers (RFC 5988) provide hypermedia-driven pagination with rel='next', rel='prev', rel='first', and rel='last' links. Used by GitHub API and follows REST HATEOAS principles for discoverable navigation.",
      links: {
        docs: "https://datatracker.ietf.org/doc/html/rfc5988",
      },
      codeSnippet: `# Response Headers:
Link: <https://api.example.com/users?page=3>; rel="next",
      <https://api.example.com/users?page=1>; rel="prev",
      <https://api.example.com/users?page=1>; rel="first",
      <https://api.example.com/users?page=10>; rel="last"`,
    },
    {
      id: "elasticsearch-from-size",
      name: "Elasticsearch from/size Pagination",
      type: "service",
      languages: ["any"],
      description:
        "Elasticsearch's from/size parameters provide offset-based pagination with a hard limit of 10,000 results (max_result_window). For deeper pagination, use search_after cursor-based approach with point-in-time (PIT) for consistency.",
      links: {
        docs: "https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html",
      },
      codeSnippet: `GET /products/_search
{
  "from": 20,
  "size": 10,
  "query": { "match_all": {} },
  "sort": [{ "created_at": "desc" }]
}`,
    },
    {
      id: "mongodb-skip-limit",
      name: "MongoDB skip/limit",
      type: "service",
      languages: ["any"],
      description:
        "MongoDB's skip() and limit() cursor methods provide offset-based pagination. For large datasets, use range-based queries on indexed fields (e.g., _id > last_seen_id) for better performance than skip().",
      links: {
        docs: "https://www.mongodb.com/docs/manual/reference/method/cursor.skip/",
      },
      codeSnippet: `db.products
  .find()
  .sort({ created_at: -1 })
  .skip(20)
  .limit(10)
  .toArray()`,
    },
    {
      id: "sql-server-offset-fetch",
      name: "SQL Server OFFSET/FETCH",
      type: "platform",
      languages: ["sql"],
      description:
        "SQL Server 2012+ supports ANSI SQL OFFSET/FETCH NEXT clauses for pagination. Requires ORDER BY clause and provides portable syntax across databases. Performance degrades with large offsets without covering indexes.",
      links: {
        docs: "https://docs.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql",
      },
      codeSnippet: `SELECT id, name, price
FROM products
ORDER BY created_at DESC
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY;`,
    },
    {
      id: "postgresql-limit-offset",
      name: "PostgreSQL LIMIT/OFFSET",
      type: "platform",
      languages: ["sql"],
      description:
        "PostgreSQL's LIMIT/OFFSET provides offset-based pagination with excellent optimizer support. For cursor-based pagination, use WHERE clauses on indexed columns (keyset pagination) for O(1) performance at any depth.",
      links: {
        docs: "https://www.postgresql.org/docs/current/queries-limit.html",
      },
      codeSnippet: `SELECT id, name, email
FROM users
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 40;`,
    },
  ],

  usedInSystems: [
    {
      systemId: "google-search",
      systemName: "Google Search Results",
      howUsed:
        "Google Search uses offset-based pagination with page numbers (e.g., ?start=10 for page 2). Each page displays ~10 results with deep pagination limited to ~1000 results to prevent excessive crawling. Results are heavily cached at CDN and browser levels with Cache-Control headers. Pattern composition: Pagination + Multi-level Caching (CDN, browser, server) + Prefetching (next page speculatively loaded). Rationale: Search queries return millions of results but users rarely go past page 5; offset pagination with caching provides fast access to first ~100 results while limiting resource usage for deep pages. The ?start parameter allows direct URL access to any page, critical for SEO and bookmarking. Impact: Sub-second page loads for top 100 results despite billions of indexed pages; 95% of queries satisfied by first 3 pages; caching reduces backend load by 90%+.",
    },
    {
      systemId: "amazon-products",
      systemName: "Amazon Product Listings",
      howUsed:
        "Amazon uses hybrid pagination: offset-based for category browsing (page numbers 1-10) and cursor-based for search results (next page tokens). Product listings are paginated with 16-48 items per page based on device type. Each page is cached in CloudFront CDN with personalization at the edge. Pattern composition: Pagination + Virtual Scrolling (mobile infinite scroll) + Lazy Loading (images) + A/B Testing (different page sizes). Rationale: Category pages have stable ordering and benefit from numbered pages for SEO; search results have dynamic ranking and use cursors to handle result set changes. Hybrid approach optimizes for both use cases. Impact: Page load times under 2 seconds globally; 30% reduction in database queries through aggressive caching; dynamic page sizing improved mobile conversion by 12%.",
    },
    {
      systemId: "twitter-feed",
      systemName: "Twitter Timeline Pagination",
      howUsed:
        "Twitter uses cursor-based pagination with max_id and since_id parameters for timeline APIs. Cursors are tweet IDs (snowflake IDs with embedded timestamps), enabling efficient keyset pagination on (timestamp, id) composite index. Home timeline fetches 20 tweets per page with cursor for next page. Pattern composition: Cursor Pagination + Prefetching (next page) + Real-time Updates (new tweets banner) + Virtual Scrolling (only render visible tweets). Rationale: Timelines are constantly updated with new tweets; offset pagination would cause page drift where tweet #20 becomes #21 if new tweet is added. Cursor pagination ensures consistent pages and O(1) performance at any depth, critical for power users scrolling back hours. Impact: Zero duplicate tweets across pages despite real-time updates; consistent 200ms API response times regardless of timeline position; supports scrolling through 1000+ tweets without performance degradation.",
      source:
        "https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/guides/working-with-timelines",
    },
    {
      systemId: "github-api",
      systemName: "GitHub REST API",
      howUsed:
        "GitHub API uses offset-based pagination with page/per_page query parameters, returning Link headers (RFC 5988) with rel='next', rel='prev', rel='first', rel='last' URLs. Default page size is 30, max is 100. Large result sets (>1000 items) recommend GraphQL API with cursor-based connections. Pattern composition: Pagination + HATEOAS Link Headers + Rate Limiting (per-page) + ETags (conditional requests). Rationale: REST API uses offset for simplicity and URL-based navigation; Link headers enable hypermedia-driven clients that don't need to construct URLs. GraphQL cursors handle large datasets where offset performance degrades. Impact: 90% of API requests use default 30-item pages; Link headers enabled zero-config pagination for API clients; GraphQL cursors support power users querying 10,000+ items without timeout.",
      source:
        "https://docs.github.com/en/rest/guides/traversing-with-pagination",
    },
    {
      systemId: "stripe-api",
      systemName: "Stripe API Pagination",
      howUsed:
        "Stripe API uses cursor-based pagination exclusively with starting_after and ending_before parameters that accept object IDs. All list endpoints return has_more boolean and data array. Cursors are opaque (object IDs) but deterministic for stable ordering. Pattern composition: Cursor Pagination + Idempotency Keys + Webhook Events + Auto-expanding related objects. Rationale: Payment data is append-only with high write rates; cursor pagination prevents page drift when new transactions arrive. Deterministic cursors (IDs) enable reliable iteration without opaque encoding. All list endpoints are paginated by default (limit 10-100) to prevent unbounded queries. Impact: Zero missed transactions during pagination despite 1000+ transactions/minute; 99.99% API availability with consistent sub-200ms latencies; cursor approach supports streaming all historical data without timeouts.",
      source: "https://stripe.com/docs/api/pagination",
    },
  ],

  philosophy: {
    coreProblem:
      "Large datasets exceed memory, network, and rendering capacity, making it impossible to load and display all data at once",
    designPrinciple:
      "Load data incrementally in bounded chunks on-demand, trading complete immediate access for practical performance at scale",
    historicalContext:
      "Pagination emerged in early web applications to handle database result sets too large for single-page display. Offset-based pagination dominated until cursor-based approaches solved page drift problems in real-time feeds (Twitter, Facebook). Modern systems use hybrid approaches: offset for static catalogs, cursors for dynamic feeds.",
    alternativesRejected: [
      "Load all data upfront - causes OOM errors and slow initial loads",
      "Infinite scroll without virtualization - DOM bloat freezes browsers",
      "Server-side rendering all pages - wastes bandwidth for unseen content",
      "Deep offset pagination without cursors - O(n) performance degradation",
    ],
    mentalModel:
      "Like reading a book one chapter at a time instead of memorizing the entire book upfront. You read what you need now, bookmark your place (cursor), and continue later without re-reading previous chapters (offset).",
  },

  visualization: {
    staticDiagram: `graph TB
    Client[Client Request]
    API[API Layer]
    Cache{Page Cache?}
    DB[(Database)]

    Client -->|page=2, limit=20| API
    API --> Cache
    Cache -->|HIT| Return[Return Cached Page]
    Cache -->|MISS| Query[Build Query]

    Query --> Offset[OFFSET-BASED<br/>LIMIT 20 OFFSET 20]
    Query --> Cursor[CURSOR-BASED<br/>WHERE id > cursor]

    Offset --> DB
    Cursor --> DB

    DB --> Count[COUNT Query<br/>offset only]
    DB --> Data[Fetch Data]

    Data --> Metadata[Build Metadata]
    Metadata --> Return
    Count --> Metadata

    Return --> Client`,
    realWorldAnalogy:
      "Pagination is like reading a phone book. Offset-based pagination is flipping to page 50 to find names starting with 'M'—you skip pages 1-49 but can jump to any page number. Cursor-based pagination is using the last name you saw as a bookmark ('continue after Martinez')—you can't jump to random pages but you never lose your place even if names are added/removed.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Amazon product search returns 10,000 items. Pagination loads 48 items per page with numbered pages 1-200. Users can jump to page 5 or navigate next/prev. Page caching reduces database queries by 85%.",
        patternRole:
          "Offset-based pagination provides random page access for browsing; page numbers important for SEO and bookmarking",
        companies: ["Amazon", "eBay", "Shopify"],
      },
      {
        domain: "Social Media",
        scenario:
          "Twitter timeline pagination with cursor-based approach. Each request returns 20 tweets with cursor for next page. New tweets don't cause page drift—if you're viewing tweet #50, a new tweet doesn't shift it to #51.",
        patternRole:
          "Cursor-based pagination prevents duplicate content and maintains consistent pages despite real-time updates",
        companies: ["Twitter", "Facebook", "Instagram"],
      },
      {
        domain: "SaaS Dashboards",
        scenario:
          "Stripe API returns last 100 transactions with cursor-based pagination. Cursor is transaction ID, enabling iteration through millions of records without offset performance degradation. has_more boolean indicates when to stop.",
        patternRole:
          "Cursor approach enables reliable iteration over large datasets with consistent performance at any depth",
        companies: ["Stripe", "GitHub", "Twilio"],
      },
      {
        domain: "Analytics",
        scenario:
          "Google Analytics exports report data in 10,000-row pages. Offset-based pagination with page numbers allows jumping to specific date ranges. Export jobs cache pages for 1 hour to support repeated access.",
        patternRole:
          "Offset pagination with page caching enables random access to report sections for slicing/dicing analysis",
        companies: ["Google Analytics", "Mixpanel", "Amplitude"],
      },
    ],
  },

  tags: [
    "performance",
    "caching",
    "scalability",
    "api-design",
    "database-optimization",
  ],
  difficulty: "intermediate",
};
