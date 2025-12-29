import type { Pattern } from "../schema";

export const lazyLoading: Pattern = {
  id: "lazy-loading",
  slug: "lazy-loading",
  corpusPath: "⚡ PERFORMANCE → 🎯 Work Reduction → 😴 Lazy → 📷 Lazy Loading",

  hierarchy: {
    quality: "performance",
    strategy: "Work Reduction",
    family: "Lazy",
    level: 4,
  },

  concept: {
    name: "Lazy Loading",
    emoji: "📷",
    tagline: "Load on first access",
    definition:
      "Lazy Loading is a performance optimization pattern that defers the loading and initialization of resources until they are actually needed. Like reading a book chapter by chapter instead of memorizing the entire book at once, lazy loading only fetches data, images, components, or modules when the user is about to interact with them. This pattern monitors user behavior—scrolling position, navigation events, or explicit actions—and triggers resource loading just-in-time. Modern implementations leverage browser APIs like the Intersection Observer to detect when elements enter the viewport, progressive image loading for perceived performance, and dynamic imports for code splitting. The pattern dramatically reduces initial page load time, memory consumption, and bandwidth usage by avoiding upfront loading of resources that users may never access. It's particularly powerful for content-heavy applications like image galleries, infinite scrolling feeds, route-based code splitting, and paginated data tables where most content remains below the fold or on unvisited pages.",
    problemSolved:
      "Traditional web applications load all resources upfront, causing slow initial page loads, wasted bandwidth on unused content, and memory bloat from unnecessary data. A news website might load hundreds of article images even though users only scroll through the first few, consuming gigabytes of bandwidth and causing 10+ second page loads on mobile networks. Large single-page applications bundle all routes and components into one massive JavaScript file, forcing users to download code for admin panels they can't access or features they'll never use. Lazy Loading solves this by deferring resource loading until the moment of need. Images load only when scrolling brings them into view, route code downloads only when navigating to that page, and data fetches only when expanding a section. This transforms slow, bloated applications into fast, responsive experiences where initial load completes in under 2 seconds, bandwidth consumption drops by 50-70%, and memory usage stays proportional to actual user interaction rather than total application size.",
    tradeoffs: {
      pros: [
        "Faster initial page load and time-to-interactive",
        "Reduced bandwidth consumption and data costs",
        "Lower memory footprint and better performance on low-end devices",
        "Improved perceived performance and user experience",
        "Better scalability for content-heavy applications",
      ],
      cons: [
        "Increased complexity in loading state management",
        "Potential for layout shift if placeholders aren't sized correctly",
        "Additional network requests introduce latency for lazy-loaded content",
        "Can degrade experience if loading indicators are intrusive",
        "Requires careful error handling for failed lazy loads",
      ],
    },
    relatedPatterns: [
      "pagination",
      "virtual-scrolling",
      "cache-aside",
      "prefetching",
      "code-splitting",
      "progressive-enhancement",
    ],
  },

  structure: {
    participants: [
      {
        name: "Lazy Loader",
        role: "Orchestrator",
        responsibilities: [
          "Monitor viewport visibility or user interactions",
          "Trigger resource loading when conditions are met",
          "Manage loading states and transitions",
          "Handle errors and retry logic",
        ],
      },
      {
        name: "Visibility Detector",
        role: "Observer",
        responsibilities: [
          "Track element position relative to viewport",
          "Notify when elements enter/exit visible area",
          "Support configurable thresholds and margins",
        ],
      },
      {
        name: "Resource Loader",
        role: "Fetcher",
        responsibilities: [
          "Fetch images, data, or code modules on demand",
          "Handle network requests and error conditions",
          "Report loading progress and completion",
        ],
      },
      {
        name: "Placeholder",
        role: "Placeholder",
        responsibilities: [
          "Reserve layout space to prevent shifts",
          "Display loading indicators",
          "Show fallback content on error",
        ],
      },
      {
        name: "Cache",
        role: "Storage",
        responsibilities: [
          "Store loaded resources to prevent re-fetching",
          "Manage cache invalidation and expiration",
          "Provide instant access to previously loaded content",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User
    participant Viewport
    participant Observer as Visibility Detector
    participant Loader as Lazy Loader
    participant Resource as Resource Loader
    participant Cache

    User->>Viewport: Scroll page
    Viewport->>Observer: Element enters viewport
    Observer->>Loader: Notify visibility change
    Loader->>Cache: Check if resource cached

    alt Resource cached
        Cache-->>Loader: Return cached resource
        Loader->>Viewport: Render content immediately
    else Resource not cached
        Loader->>Resource: Trigger load
        Resource-->>Loader: Loading...
        Loader->>Viewport: Show placeholder/loading state
        Resource->>Resource: Fetch from network
        Resource-->>Loader: Resource loaded
        Loader->>Cache: Store in cache
        Loader->>Viewport: Render content
    end

    User->>Viewport: Scroll back to loaded content
    Loader->>Cache: Retrieve cached resource
    Cache-->>Loader: Return instantly
    Loader->>Viewport: Render from cache`,
    flow: [
      {
        step: 1,
        actor: "User",
        action: "Scroll or Navigate",
        description: "User scrolls page or navigates to new route",
      },
      {
        step: 2,
        actor: "Visibility Detector",
        action: "Detect Visibility",
        description:
          "Intersection Observer detects element entering viewport threshold",
      },
      {
        step: 3,
        actor: "Lazy Loader",
        action: "Check Cache",
        description:
          "Verify if resource was previously loaded to avoid redundant fetches",
      },
      {
        step: 4,
        actor: "Placeholder",
        action: "Show Loading State",
        description: "Display skeleton screen or spinner while resource loads",
      },
      {
        step: 5,
        actor: "Resource Loader",
        action: "Fetch Resource",
        description: "Download image, load component, or fetch data from API",
      },
      {
        step: 6,
        actor: "Lazy Loader",
        action: "Update State",
        description: "Transition from loading to loaded state",
      },
      {
        step: 7,
        actor: "Cache",
        action: "Store Resource",
        description: "Cache loaded resource to prevent re-loading on revisit",
      },
      {
        step: 8,
        actor: "Lazy Loader",
        action: "Render Content",
        description: "Replace placeholder with actual content",
      },
    ],
    invariants: [
      "Resources must load only when needed, never preemptively",
      "Placeholders must reserve correct dimensions to prevent layout shift",
      "Loaded resources must be cached to prevent redundant network requests",
      "Loading failures must not crash the application or block other content",
      "Visibility thresholds must be configurable for performance tuning",
      "Multiple lazy loaders must not conflict or duplicate requests",
    ],
  },

  codeExamples: [
    {
      id: "lazy-loading-images-intersection-observer",
      language: "typescript",
      title: "Image Lazy Loading with Intersection Observer",
      description:
        "Modern image lazy loading using native browser Intersection Observer API with progressive loading and error handling",
      code: `interface LazyImageOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
  errorImage?: string;
}

class LazyImageLoader {
  private observer: IntersectionObserver;
  private images: Map<HTMLImageElement, string> = new Map();
  private loadedImages: Set<HTMLImageElement> = new Set();

  constructor(options: LazyImageOptions = {}) {
    // Create Intersection Observer with configurable options
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '50px',
        threshold: options.threshold ?? 0.01,
      }
    );
  }

  /**
   * Register an image element for lazy loading
   * The actual src is stored in data-src attribute
   */
  observe(img: HTMLImageElement): void {
    const actualSrc = img.dataset.src;

    if (!actualSrc) {
      console.warn('Image missing data-src attribute', img);
      return;
    }

    // Store the actual source URL
    this.images.set(img, actualSrc);

    // Set placeholder as current src to reserve space
    if (!img.src && img.dataset.placeholder) {
      img.src = img.dataset.placeholder;
    }

    // Add loading indicator class
    img.classList.add('lazy-loading');

    // Start observing for viewport intersection
    this.observer.observe(img);
  }

  /**
   * Handle intersection events - load images when they enter viewport
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      // Only process images entering the viewport
      if (!entry.isIntersecting) return;

      const img = entry.target as HTMLImageElement;
      const src = this.images.get(img);

      if (!src || this.loadedImages.has(img)) return;

      // Load the image
      this.loadImage(img, src);

      // Stop observing this image - it's loading now
      this.observer.unobserve(img);
    });
  }

  /**
   * Load the actual image with progressive enhancement
   */
  private async loadImage(img: HTMLImageElement, src: string): Promise<void> {
    // Mark as loading
    img.classList.add('lazy-loading');

    // Create a temporary image to preload
    const tempImage = new Image();

    // Set up event handlers before setting src
    tempImage.onload = () => {
      // Swap the source
      img.src = src;

      // Update classes for CSS transitions
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');

      // Mark as loaded to prevent re-loading
      this.loadedImages.add(img);

      // Clean up
      this.images.delete(img);
    };

    tempImage.onerror = () => {
      // Handle load failure
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');

      // Set error placeholder if configured
      if (img.dataset.errorImage) {
        img.src = img.dataset.errorImage;
      }

      console.error(\`Failed to load image: \${src}\`);

      // Clean up
      this.images.delete(img);
    };

    // Trigger the load
    tempImage.src = src;
  }

  /**
   * Unobserve all images and clean up
   */
  disconnect(): void {
    this.observer.disconnect();
    this.images.clear();
    this.loadedImages.clear();
  }

  /**
   * Force load all observed images immediately
   * Useful for printing or screenshot scenarios
   */
  loadAll(): void {
    this.images.forEach((src, img) => {
      if (!this.loadedImages.has(img)) {
        this.loadImage(img, src);
      }
    });
  }
}

// Usage Example
const imageLoader = new LazyImageLoader({
  rootMargin: '100px',  // Start loading 100px before entering viewport
  threshold: 0.01,       // Trigger when 1% visible
});

// Initialize lazy loading for all images with data-src attribute
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll<HTMLImageElement>('img[data-src]');

  lazyImages.forEach((img) => {
    imageLoader.observe(img);
  });
});

// HTML Usage:
// <img
//   data-src="https://example.com/large-image.jpg"
//   data-placeholder="data:image/svg+xml,..."
//   data-error-image="/error-placeholder.png"
//   alt="Description"
//   width="800"
//   height="600"
//   class="lazy"
// />

// CSS for smooth transitions:
// .lazy-loading {
//   filter: blur(5px);
//   opacity: 0.5;
// }
// .lazy-loaded {
//   filter: blur(0);
//   opacity: 1;
//   transition: filter 0.3s, opacity 0.3s;
// }
// .lazy-error {
//   opacity: 0.3;
//   border: 2px solid red;
// }`,
      runnable: true,
      contextDilation: {
        level: "module",
        scope:
          "Complete lazy image loading system with Intersection Observer, progressive enhancement, and error handling",
        prerequisites: [
          "Intersection Observer API",
          "DOM manipulation",
          "Promises and async/await",
          "CSS transitions",
        ],
        systemPosition:
          "Client-side image optimization layer in content-heavy web applications like blogs, e-commerce product listings, or social media feeds",
      },
      annotations: [
        {
          id: "lazy-img-observer-setup",
          lines: [16, 24],
          action:
            "Create Intersection Observer with configurable viewport margins and thresholds",
          reason:
            "Intersection Observer is the modern, performant way to detect when elements enter the viewport without scroll event listeners. rootMargin allows pre-loading images before they're visible for smoother UX.",
          contextLevel: "system",
          relatedConcepts: [
            "intersection-observer",
            "viewport-detection",
            "event-throttling",
          ],
        },
        {
          id: "lazy-img-data-src",
          lines: [30, 37],
          action:
            "Store actual image URL in data-src attribute instead of src to prevent immediate browser loading",
          reason:
            "Browsers automatically load images when src is set. Using data-src prevents this, giving JavaScript control over when images load.",
          contextLevel: "module",
          relatedConcepts: ["progressive-enhancement", "html5-data-attributes"],
        },
        {
          id: "lazy-img-placeholder",
          lines: [40, 43],
          action: "Set low-resolution placeholder to reserve layout space",
          reason:
            "Placeholders prevent layout shift (CLS) by reserving the correct dimensions. Users see a blurred preview instead of blank space, improving perceived performance.",
          contextLevel: "local",
          relatedConcepts: ["cumulative-layout-shift", "core-web-vitals"],
        },
        {
          id: "lazy-img-intersection-check",
          lines: [57, 60],
          action:
            "Check if image is intersecting viewport before triggering load",
          reason:
            "Only load images that are actually visible or about to become visible. Skipping non-intersecting entries prevents unnecessary work.",
          contextLevel: "local",
        },
        {
          id: "lazy-img-unobserve",
          lines: [69, 70],
          action:
            "Stop observing image after load is triggered to prevent duplicate loads",
          reason:
            "Once an image is loading, we don't need intersection events anymore. Unobserving improves performance by reducing observer overhead.",
          contextLevel: "module",
          relatedConcepts: ["resource-cleanup", "memory-management"],
        },
        {
          id: "lazy-img-temp-image",
          lines: [79, 81],
          action:
            "Create temporary Image object to preload before swapping src",
          reason:
            "Preloading to a temp image allows detecting load success/failure before committing to the visible DOM element. This enables smooth transitions and error handling.",
          contextLevel: "module",
          relatedConcepts: ["image-preloading", "progressive-loading"],
        },
        {
          id: "lazy-img-onload",
          lines: [84, 96],
          action:
            "Swap source and update classes when image loads successfully",
          reason:
            "CSS classes trigger transitions for smooth visual effects. Marking as loaded prevents re-loading if element re-enters viewport.",
          contextLevel: "local",
          relatedConcepts: ["css-transitions", "state-management"],
        },
        {
          id: "lazy-img-onerror",
          lines: [98, 111],
          action: "Handle load failure with error placeholder and logging",
          reason:
            "Network failures, 404s, or CORS issues can prevent image loads. Graceful error handling prevents broken image icons and maintains layout.",
          contextLevel: "module",
          relatedConcepts: ["error-handling", "fallback-content"],
        },
        {
          id: "lazy-img-rootmargin",
          lines: [146, 147],
          action:
            "Configure rootMargin to start loading images before they enter viewport",
          reason:
            "Loading 100px ahead of scroll position ensures images are ready when users reach them, eliminating 'pop-in' effect and perceived lag.",
          contextLevel: "system",
          relatedConcepts: ["prefetching", "user-experience"],
        },
      ],
      highlights: [
        {
          lines: [16, 24],
          label: "Intersection Observer setup",
          sbvpDomain: "structure",
        },
        {
          lines: [57, 70],
          label: "Viewport intersection handling",
          sbvpDomain: "behavior",
        },
        {
          lines: [79, 111],
          label: "Progressive image loading with error handling",
          sbvpDomain: "behavior",
        },
        {
          lines: [146, 153],
          label: "Usage example with configuration",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "lazy-loading-react-components",
      language: "typescript",
      title: "React Component Lazy Loading with Suspense",
      description:
        "Route-based code splitting and component lazy loading using React.lazy and Suspense for optimal bundle sizes",
      code: `import React, { Suspense, lazy, ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Lazy load route components - each becomes a separate chunk
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy load heavy components only when needed
const DataVisualization = lazy(() => import('./components/DataVisualization'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

/**
 * Loading fallback component with skeleton screen
 */
interface LoadingFallbackProps {
  type?: 'page' | 'component';
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'page'
}) => {
  if (type === 'page') {
    return (
      <div className="page-loading">
        <div className="skeleton-header" />
        <div className="skeleton-nav" />
        <div className="skeleton-content">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </div>
    );
  }

  return (
    <div className="component-loading">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
};

/**
 * Error boundary to catch lazy loading failures
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Lazy load failed:', error, errorInfo);

    // Could retry the import here
    if (error.message.includes('Loading chunk')) {
      // Network error - prompt user to refresh
      console.warn('Network error loading chunk. User may need to refresh.');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lazy-load-error">
          <h2>Failed to load component</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for lazy loading with retry logic
 */
interface LazyWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyWithRetryOptions = {}
): React.LazyExoticComponent<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let retries = 0;

      const attemptImport = () => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            retries++;

            if (retries <= maxRetries) {
              console.warn(
                \`Lazy load failed, retry \${retries}/\${maxRetries}\`,
                error
              );

              // Exponential backoff
              const delay = retryDelay * Math.pow(2, retries - 1);
              setTimeout(attemptImport, delay);
            } else {
              reject(error);
            }
          });
      };

      attemptImport();
    });
  });
}

// Use retry wrapper for critical routes
const CriticalRoute = lazyWithRetry(
  () => import('./pages/CriticalRoute'),
  { maxRetries: 5, retryDelay: 1000 }
);

/**
 * App component with lazy-loaded routes
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LazyLoadErrorBoundary>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/settings">Settings</Link>
        </nav>

        {/* Suspense boundary with loading fallback */}
        <Suspense fallback={<LoadingFallback type="page" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/critical" element={<CriticalRoute />} />
          </Routes>
        </Suspense>
      </LazyLoadErrorBoundary>
    </BrowserRouter>
  );
};

/**
 * Example: Conditionally lazy load heavy component
 */
const DashboardWithConditionalChart: React.FC = () => {
  const [showChart, setShowChart] = React.useState(false);

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={() => setShowChart(true)}>
        Show Analytics Chart
      </button>

      {showChart && (
        <Suspense fallback={<LoadingFallback type="component" />}>
          <DataVisualization data={analyticsData} />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Example: Lazy load based on user permissions
 */
const AdminDashboard: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  // Only load admin panel code if user is admin
  return (
    <Suspense fallback={<LoadingFallback type="page" />}>
      <AdminPanel />
    </Suspense>
  );
};

export default App;

// Webpack bundle analysis shows chunk splitting:
// main.chunk.js - 50 KB (core app code)
// Home.chunk.js - 15 KB (home page)
// Dashboard.chunk.js - 45 KB (dashboard + charts)
// AdminPanel.chunk.js - 30 KB (admin only - rarely loaded)
//
// Without lazy loading: 140 KB initial bundle
// With lazy loading: 50 KB initial, rest loaded on-demand`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete React lazy loading system with route-based code splitting, error boundaries, retry logic, and Suspense",
        prerequisites: [
          "React 16.6+ (Suspense)",
          "React 18+ features",
          "React Router",
          "Webpack or Vite for code splitting",
        ],
        systemPosition:
          "Application architecture layer for large React SPAs with multiple routes, admin panels, or feature-gated components",
      },
      annotations: [
        {
          id: "lazy-react-import",
          lines: [4, 9],
          action:
            "Use React.lazy() with dynamic imports for route-based code splitting",
          reason:
            "Each lazy() call creates a separate chunk that Webpack/Vite splits into its own file. Routes are only downloaded when navigated to, reducing initial bundle size by 60-80%.",
          contextLevel: "system",
          relatedConcepts: [
            "code-splitting",
            "dynamic-imports",
            "tree-shaking",
          ],
        },
        {
          id: "lazy-react-skeleton",
          lines: [22, 36],
          action: "Provide skeleton screen fallback that matches page layout",
          reason:
            "Skeleton screens improve perceived performance by showing content-shaped placeholders instead of spinners. Users perceive the page as loading faster even though actual time is the same.",
          contextLevel: "module",
          relatedConcepts: [
            "skeleton-screens",
            "perceived-performance",
            "progressive-loading",
          ],
        },
        {
          id: "lazy-react-error-boundary",
          lines: [48, 90],
          action:
            "Catch lazy loading failures with Error Boundary for graceful degradation",
          reason:
            "Network failures, chunk load errors, or CDN issues can cause dynamic imports to fail. Error boundaries prevent entire app crashes and allow recovery.",
          contextLevel: "system",
          relatedConcepts: ["error-boundaries", "graceful-degradation"],
        },
        {
          id: "lazy-react-chunk-error",
          lines: [66, 72],
          action:
            'Detect "Loading chunk" errors to distinguish network vs code errors',
          reason:
            "Chunk loading errors are usually transient network issues that resolve with a refresh. Detecting this pattern allows smart retry logic or user prompts.",
          contextLevel: "module",
          relatedConcepts: ["error-classification", "retry-logic"],
        },
        {
          id: "lazy-react-retry",
          lines: [96, 135],
          action:
            "Implement retry logic with exponential backoff for failed imports",
          reason:
            "Transient network errors are common on mobile networks. Retrying with exponential backoff (1s, 2s, 4s) handles temporary failures without hammering the server.",
          contextLevel: "system",
          relatedConcepts: [
            "exponential-backoff",
            "retry-pattern",
            "fault-tolerance",
          ],
        },
        {
          id: "lazy-react-exponential-backoff",
          lines: [122, 124],
          action: "Calculate exponential backoff delay: delay * 2^(retries-1)",
          reason:
            "Exponential backoff spaces out retries to avoid overwhelming failing services. 1s → 2s → 4s → 8s gives services time to recover.",
          contextLevel: "local",
        },
        {
          id: "lazy-react-suspense",
          lines: [156, 168],
          action: "Wrap lazy routes in Suspense boundary with fallback UI",
          reason:
            "Suspense is React's mechanism for handling async operations. It shows fallback while chunks load and seamlessly transitions to content when ready.",
          contextLevel: "module",
          relatedConcepts: ["react-suspense", "async-rendering"],
        },
        {
          id: "lazy-react-conditional",
          lines: [180, 193],
          action:
            "Conditionally render Suspense based on user action to defer loading",
          reason:
            "Heavy components like charts or video players should only load when users explicitly request them, not on initial page load. This saves bandwidth and improves initial load time.",
          contextLevel: "system",
          relatedConcepts: ["conditional-rendering", "user-initiated-loading"],
        },
        {
          id: "lazy-react-permissions",
          lines: [199, 210],
          action:
            "Gate lazy loading behind permission checks to avoid loading unauthorized code",
          reason:
            "Admin panels contain sensitive code that regular users shouldn't download. Checking permissions before lazy loading improves security and reduces bundle size for non-admin users.",
          contextLevel: "system",
          relatedConcepts: [
            "access-control",
            "security",
            "role-based-rendering",
          ],
        },
      ],
      highlights: [
        {
          lines: [4, 9],
          label: "Route-based code splitting with React.lazy",
          sbvpDomain: "structure",
        },
        {
          lines: [48, 90],
          label: "Error boundary for lazy load failures",
          sbvpDomain: "behavior",
        },
        {
          lines: [96, 135],
          label: "Retry logic with exponential backoff",
          sbvpDomain: "behavior",
        },
        {
          lines: [156, 168],
          label: "Suspense boundaries with fallback UI",
          sbvpDomain: "structure",
        },
        {
          lines: [214, 223],
          label: "Bundle size comparison",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "lazy-loading-infinite-scroll",
      language: "typescript",
      title: "Infinite Scroll with Lazy Loading and Pagination",
      description:
        "Production-grade infinite scroll implementation with intersection observer, API pagination, and cache management",
      code: `interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: number;
}

interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

interface InfiniteScrollOptions {
  initialPageSize: number;
  pageSize: number;
  threshold: number;
  rootMargin: string;
  cacheSize: number;
}

/**
 * Infinite scroll manager with lazy loading and caching
 */
class InfiniteScrollLoader<T> {
  private items: T[] = [];
  private nextCursor?: string;
  private hasMore: boolean = true;
  private isLoading: boolean = false;
  private observer?: IntersectionObserver;
  private sentinel?: HTMLElement;
  private cache: Map<string, PaginatedResponse<T>> = new Map();
  private listeners: Set<(items: T[]) => void> = new Set();

  constructor(
    private fetchFunction: (
      cursor?: string,
      pageSize?: number
    ) => Promise<PaginatedResponse<T>>,
    private options: InfiniteScrollOptions
  ) {}

  /**
   * Initialize infinite scroll by loading first page and setting up observer
   */
  async initialize(sentinelElement: HTMLElement): Promise<void> {
    this.sentinel = sentinelElement;

    // Load initial batch
    await this.loadMore();

    // Set up intersection observer for automatic loading
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );

    this.observer.observe(sentinelElement);
  }

  /**
   * Handle sentinel element entering viewport - trigger next page load
   */
  private async handleIntersection(
    entries: IntersectionObserverEntry[]
  ): Promise<void> {
    const entry = entries[0];

    if (entry.isIntersecting && !this.isLoading && this.hasMore) {
      await this.loadMore();
    }
  }

  /**
   * Load next page of data with caching and deduplication
   */
  private async loadMore(): Promise<void> {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.notifyListeners(); // Update UI to show loading state

    try {
      // Check cache first
      const cacheKey = this.nextCursor ?? 'initial';
      let response = this.cache.get(cacheKey);

      if (!response) {
        // Fetch from API if not cached
        const pageSize =
          this.items.length === 0
            ? this.options.initialPageSize
            : this.options.pageSize;

        response = await this.fetchFunction(this.nextCursor, pageSize);

        // Store in cache with LRU eviction
        this.addToCache(cacheKey, response);
      }

      // Append new items
      this.items.push(...response.items);
      this.nextCursor = response.nextCursor;
      this.hasMore = response.hasMore;

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load more items:', error);
      // Keep hasMore true to allow retry
      throw error;
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Add response to cache with LRU eviction
   */
  private addToCache(key: string, response: PaginatedResponse<T>): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.options.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, response);
  }

  /**
   * Subscribe to data updates
   */
  subscribe(listener: (items: T[]) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.items]));
  }

  /**
   * Get current state
   */
  getState() {
    return {
      items: [...this.items],
      isLoading: this.isLoading,
      hasMore: this.hasMore,
      totalLoaded: this.items.length,
    };
  }

  /**
   * Reset and reload from beginning
   */
  async reset(): Promise<void> {
    this.items = [];
    this.nextCursor = undefined;
    this.hasMore = true;
    this.isLoading = false;
    this.cache.clear();

    await this.loadMore();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.observer?.disconnect();
    this.listeners.clear();
    this.cache.clear();
  }
}

// API client function
async function fetchPosts(
  cursor?: string,
  pageSize: number = 20
): Promise<PaginatedResponse<Post>> {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    ...(cursor && { cursor }),
  });

  const response = await fetch(\`/api/posts?\${params}\`);

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  return response.json();
}

// React Hook Integration
function useInfiniteScroll<T>(
  fetchFunction: (
    cursor?: string,
    pageSize?: number
  ) => Promise<PaginatedResponse<T>>,
  options: Partial<InfiniteScrollOptions> = {}
) {
  const [items, setItems] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const loaderRef = React.useRef<InfiniteScrollLoader<T>>();

  React.useEffect(() => {
    const defaultOptions: InfiniteScrollOptions = {
      initialPageSize: 20,
      pageSize: 20,
      threshold: 0.1,
      rootMargin: '100px',
      cacheSize: 10,
      ...options,
    };

    const loader = new InfiniteScrollLoader(fetchFunction, defaultOptions);
    loaderRef.current = loader;

    // Subscribe to updates
    const unsubscribe = loader.subscribe((newItems) => {
      setItems(newItems);
      const state = loader.getState();
      setIsLoading(state.isLoading);
      setHasMore(state.hasMore);
    });

    // Initialize when sentinel is available
    if (sentinelRef.current) {
      loader.initialize(sentinelRef.current);
    }

    return () => {
      unsubscribe();
      loader.destroy();
    };
  }, []);

  return {
    items,
    isLoading,
    hasMore,
    sentinelRef,
    reset: () => loaderRef.current?.reset(),
  };
}

// Usage Example Component
const InfinitePostFeed: React.FC = () => {
  const { items, isLoading, hasMore, sentinelRef } = useInfiniteScroll(
    fetchPosts,
    {
      initialPageSize: 10,
      pageSize: 20,
      rootMargin: '200px',
    }
  );

  return (
    <div className="post-feed">
      {items.map((post) => (
        <article key={post.id} className="post-card">
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <footer>
            By {post.author} • {new Date(post.timestamp).toLocaleDateString()}
          </footer>
        </article>
      ))}

      {/* Sentinel element for triggering loads */}
      <div ref={sentinelRef} className="sentinel" />

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Loading more posts...</p>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="end-message">
          You've reached the end!
        </div>
      )}

      {!hasMore && items.length === 0 && (
        <div className="empty-state">
          No posts found.
        </div>
      )}
    </div>
  );
};

export default InfinitePostFeed;`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production infinite scroll system with pagination, caching, intersection observer, and React hooks",
        prerequisites: [
          "Intersection Observer API",
          "React Hooks",
          "API pagination patterns",
          "LRU cache concepts",
        ],
        systemPosition:
          "Data presentation layer for social feeds, product listings, search results, or any paginated content in modern web applications",
      },
      annotations: [
        {
          id: "lazy-infinite-state",
          lines: [28, 36],
          action:
            "Maintain loading state, items array, pagination cursor, and cache",
          reason:
            "Infinite scroll requires tracking multiple states: what's loaded, what's loading, whether more exists, and caching previous pages to prevent redundant API calls on scroll-back.",
          contextLevel: "module",
          relatedConcepts: [
            "state-management",
            "pagination",
            "cursor-based-pagination",
          ],
        },
        {
          id: "lazy-infinite-init",
          lines: [49, 64],
          action:
            "Load initial page and set up intersection observer on sentinel element",
          reason:
            "Sentinel element (usually a div at the bottom) triggers loads when it enters viewport. This approach is more efficient than scroll event listeners.",
          contextLevel: "system",
          relatedConcepts: [
            "intersection-observer",
            "sentinel-pattern",
            "scroll-optimization",
          ],
        },
        {
          id: "lazy-infinite-intersection",
          lines: [69, 78],
          action:
            "Trigger next page load when sentinel enters viewport and not already loading",
          reason:
            "Guards prevent duplicate requests: only load if sentinel is visible, not currently loading, and more items exist. This prevents race conditions and unnecessary API calls.",
          contextLevel: "local",
        },
        {
          id: "lazy-infinite-cache-check",
          lines: [89, 92],
          action: "Check if page is cached before making API request",
          reason:
            "Users often scroll up and down. Caching prevents re-fetching pages they've already seen, reducing bandwidth and improving scroll-back performance.",
          contextLevel: "module",
          relatedConcepts: ["cache-aside", "lru-cache", "performance"],
        },
        {
          id: "lazy-infinite-dynamic-pagesize",
          lines: [95, 99],
          action: "Use larger initial page size, smaller subsequent sizes",
          reason:
            "First page should fill viewport to avoid immediate sentinel intersection. Subsequent pages can be smaller since user is actively scrolling. This balances initial load time with smooth scrolling.",
          contextLevel: "system",
          relatedConcepts: [
            "progressive-loading",
            "viewport-optimization",
            "user-experience",
          ],
        },
        {
          id: "lazy-infinite-lru",
          lines: [122, 128],
          action: "Implement LRU cache eviction when cache is full",
          reason:
            "Unlimited caching causes memory bloat. LRU (Least Recently Used) eviction keeps memory bounded while retaining frequently accessed pages. Cache size of 10 pages is typically sufficient.",
          contextLevel: "module",
          relatedConcepts: ["lru-cache", "memory-management", "cache-eviction"],
        },
        {
          id: "lazy-infinite-subscribe",
          lines: [135, 143],
          action: "Implement observer pattern for reactive state updates",
          reason:
            "Decouples loading logic from UI rendering. Multiple UI components can subscribe to the same loader, and all update automatically when state changes.",
          contextLevel: "system",
          relatedConcepts: [
            "observer-pattern",
            "reactive-programming",
            "separation-of-concerns",
          ],
        },
        {
          id: "lazy-infinite-reset",
          lines: [170, 179],
          action:
            "Provide reset functionality to clear state and reload from beginning",
          reason:
            "Users need ability to refresh feeds or apply filters. Reset clears all state (items, cursor, cache) and triggers fresh initial load.",
          contextLevel: "module",
          relatedConcepts: ["state-reset", "refresh-pattern"],
        },
        {
          id: "lazy-infinite-hook",
          lines: [218, 257],
          action:
            "Wrap loader in React hook for ergonomic component integration",
          reason:
            "Hooks provide clean API for React components: manage lifecycle, cleanup on unmount, and reactive state updates. Separates business logic from React specifics.",
          contextLevel: "system",
          relatedConcepts: [
            "react-hooks",
            "custom-hooks",
            "component-lifecycle",
          ],
        },
        {
          id: "lazy-infinite-sentinel-ref",
          lines: [286, 287],
          action:
            "Render sentinel element that triggers loads when scrolled into view",
          reason:
            "Sentinel is an invisible div that sits below content. When it enters viewport, more items load. This creates seamless infinite scroll without scroll event listeners.",
          contextLevel: "local",
          relatedConcepts: ["sentinel-pattern", "ref-forwarding"],
        },
      ],
      highlights: [
        {
          lines: [28, 44],
          label: "State management and cache structure",
          sbvpDomain: "structure",
        },
        {
          lines: [83, 118],
          label: "Load more with caching and deduplication",
          sbvpDomain: "behavior",
        },
        {
          lines: [122, 131],
          label: "LRU cache eviction",
          sbvpDomain: "behavior",
        },
        {
          lines: [218, 257],
          label: "React hook integration",
          sbvpDomain: "structure",
        },
        {
          lines: [262, 304],
          label: "Usage example with loading states",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "lazy-loading-python-django",
      language: "python",
      title: "Django Lazy Query Evaluation and Select Related",
      description:
        "Database query lazy loading with Django ORM, demonstrating lazy evaluation, prefetching, and N+1 query prevention",
      code: `from django.db import models
from django.core.paginator import Paginator
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# Models
class Author(models.Model):
    name = models.CharField(max_length=200)
    bio = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    description = models.TextField()
    published_date = models.DateField()
    isbn = models.CharField(max_length=13)

    class Meta:
        indexes = [
            models.Index(fields=['published_date']),
            models.Index(fields=['author']),
        ]

    def __str__(self):
        return self.title


class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# BAD: Triggers N+1 queries - avoid this pattern!
def get_books_bad() -> List[dict]:
    """
    Anti-pattern: Lazy loading causes N+1 query problem
    For 100 books, this triggers 101 queries: 1 for books + 100 for authors
    """
    books = Book.objects.all()[:100]  # Query 1: Fetch books

    result = []
    for book in books:
        # Query 2-101: Each iteration triggers a separate query for author!
        result.append({
            'title': book.title,
            'author': book.author.name,  # Lazy load: Triggers query!
            'published': book.published_date,
        })

    return result


# GOOD: Use select_related for efficient lazy loading
def get_books_optimized() -> List[dict]:
    """
    Optimized: select_related() performs SQL JOIN to fetch related data
    Only 1 query regardless of number of books
    """
    # Single query with JOIN: SELECT * FROM book JOIN author ON ...
    books = Book.objects.select_related('author').all()[:100]

    result = []
    for book in books:
        # No additional query - author data already loaded
        result.append({
            'title': book.title,
            'author': book.author.name,  # No query! Data cached from JOIN
            'published': book.published_date,
        })

    return result


# GOOD: Use prefetch_related for reverse relationships
def get_authors_with_books() -> List[dict]:
    """
    Optimized: prefetch_related() for many-to-many and reverse foreign keys
    Uses 2 queries total: 1 for authors + 1 for all related books
    """
    # Query 1: Fetch authors
    # Query 2: Fetch all books for these authors with WHERE author_id IN (...)
    authors = Author.objects.prefetch_related('book_set').all()

    result = []
    for author in authors:
        # No additional queries - books prefetched
        books = [book.title for book in author.book_set.all()]
        result.append({
            'name': author.name,
            'book_count': len(books),
            'books': books,
        })

    return result


# GOOD: Lazy QuerySet evaluation for memory efficiency
def process_large_dataset():
    """
    QuerySets are lazy - query doesn't execute until data is accessed
    Use iterator() for large datasets to avoid loading all into memory
    """
    # No query executed yet! QuerySet is lazy
    books_queryset = Book.objects.select_related('author').all()

    logger.info("QuerySet created, but no database query yet")

    # Now query executes because we're iterating
    # iterator() fetches in chunks to save memory
    for book in books_queryset.iterator(chunk_size=1000):
        # Process each book without loading all 1 million books into memory
        process_book(book)

    logger.info("Processing complete")


# GOOD: Lazy loading with pagination
class BookPaginator:
    """
    Implements cursor-based pagination with lazy loading
    Only fetches the requested page from database
    """

    def __init__(self, page_size: int = 20):
        self.page_size = page_size

    def get_page(self, page_number: int, filters: Optional[dict] = None) -> dict:
        """
        Lazy load only the requested page of books
        Database only queries for page_size items, not entire table
        """
        # Build queryset with filters
        queryset = Book.objects.select_related('author')

        if filters:
            if filters.get('author_name'):
                queryset = queryset.filter(author__name__icontains=filters['author_name'])
            if filters.get('min_date'):
                queryset = queryset.filter(published_date__gte=filters['min_date'])

        # Order by published date for consistent pagination
        queryset = queryset.order_by('-published_date')

        # Create paginator - still lazy, no query yet
        paginator = Paginator(queryset, self.page_size)

        # Now query executes with LIMIT and OFFSET
        # SQL: SELECT ... LIMIT 20 OFFSET 40 (for page 3)
        page = paginator.get_page(page_number)

        return {
            'items': [
                {
                    'id': book.id,
                    'title': book.title,
                    'author': book.author.name,
                    'published': book.published_date.isoformat(),
                }
                for book in page.object_list
            ],
            'page': page_number,
            'total_pages': paginator.num_pages,
            'total_items': paginator.count,
            'has_next': page.has_next(),
            'has_previous': page.has_previous(),
        }


# GOOD: Lazy property loading with caching
class BookWithLazyStats(models.Model):
    """
    Use @property with caching for expensive computed fields
    Only calculate when accessed, and cache the result
    """
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)

    class Meta:
        managed = False  # Example model for demonstration

    @property
    def average_rating(self) -> float:
        """
        Lazy load average rating only when accessed
        Uses Django ORM aggregation
        """
        if not hasattr(self, '_average_rating'):
            from django.db.models import Avg
            # Query executes here only on first access
            result = self.reviews.aggregate(avg=Avg('rating'))
            self._average_rating = result['avg'] or 0.0

        return self._average_rating

    @property
    def review_count(self) -> int:
        """Lazy load review count with caching"""
        if not hasattr(self, '_review_count'):
            # count() is more efficient than len() for database queries
            self._review_count = self.reviews.count()

        return self._review_count


# Helper function for demonstration
def process_book(book: Book) -> None:
    """Process a single book (placeholder)"""
    pass


# Django REST Framework View Example
from rest_framework import viewsets
from rest_framework.pagination import CursorPagination
from rest_framework import serializers


class BookSerializer(serializers.ModelSerializer):
    """
    Serializer with lazy-loaded related data
    """
    author_name = serializers.CharField(source='author.name', read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'author_name', 'published_date', 'review_count']


class BookCursorPagination(CursorPagination):
    """
    Cursor pagination for efficient lazy loading
    More efficient than offset pagination for large datasets
    """
    page_size = 20
    ordering = '-published_date'


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint with optimized lazy loading
    """
    serializer_class = BookSerializer
    pagination_class = BookCursorPagination

    def get_queryset(self):
        """
        Optimize queryset with select_related and annotate
        Prevents N+1 queries and adds computed fields efficiently
        """
        from django.db.models import Count

        # Single optimized query:
        # - JOINs author table
        # - Aggregates review count
        # - Only fetches current page
        return Book.objects\\
            .select_related('author')\\
            .annotate(review_count=Count('reviews'))\\
            .all()


# Usage Example
if __name__ == '__main__':
    # Bad: N+1 queries
    # books_bad = get_books_bad()  # 101 queries!

    # Good: Optimized
    books_good = get_books_optimized()  # 1 query

    # Pagination
    paginator = BookPaginator(page_size=20)
    page_1 = paginator.get_page(1)
    print(f"Loaded {len(page_1['items'])} books from page 1")
    print(f"Total pages: {page_1['total_pages']}")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Django ORM lazy loading patterns: select_related, prefetch_related, pagination, iterator, and N+1 query prevention",
        prerequisites: [
          "Django ORM",
          "SQL joins and aggregations",
          "Database indexing",
          "Python properties and caching",
        ],
        systemPosition:
          "Database access layer in Django web applications, API backends, or any Python application using Django ORM for data persistence",
      },
      annotations: [
        {
          id: "lazy-django-n-plus-one",
          lines: [42, 59],
          action:
            "Demonstrate N+1 query anti-pattern where lazy loading causes performance issues",
          reason:
            "Each book.author.name triggers a separate database query because author isn't preloaded. For 100 books, this results in 101 queries instead of 1, devastating performance.",
          contextLevel: "system",
          relatedConcepts: [
            "n-plus-one-problem",
            "orm-performance",
            "anti-patterns",
          ],
        },
        {
          id: "lazy-django-select-related",
          lines: [63, 79],
          action:
            "Use select_related() to perform SQL JOIN and eagerly load foreign keys",
          reason:
            "select_related performs a JOIN at the database level, loading related data in a single query. This eliminates N+1 queries for foreign key relationships.",
          contextLevel: "system",
          relatedConcepts: ["eager-loading", "sql-joins", "query-optimization"],
        },
        {
          id: "lazy-django-prefetch",
          lines: [83, 102],
          action:
            "Use prefetch_related() for reverse foreign keys and many-to-many relationships",
          reason:
            "Unlike select_related (which uses JOIN), prefetch_related uses a second query with WHERE IN to fetch related objects. More efficient than N+1 but uses 2 queries instead of 1.",
          contextLevel: "system",
          relatedConcepts: [
            "prefetching",
            "reverse-relationships",
            "query-batching",
          ],
        },
        {
          id: "lazy-django-iterator",
          lines: [106, 121],
          action:
            "Use iterator() to process large datasets without loading all into memory",
          reason:
            "Default QuerySet loads all results into memory. iterator(chunk_size=1000) fetches in batches, enabling processing of millions of rows without memory exhaustion.",
          contextLevel: "module",
          relatedConcepts: [
            "memory-efficiency",
            "streaming-queries",
            "batch-processing",
          ],
        },
        {
          id: "lazy-django-queryset-lazy",
          lines: [112, 114],
          action:
            "Create QuerySet without executing database query - deferred until iteration",
          reason:
            "Django QuerySets are lazy: defining filters, joins, or ordering doesn't hit the database. Query executes only when data is accessed (iteration, len(), slicing), enabling efficient query composition.",
          contextLevel: "system",
          relatedConcepts: [
            "lazy-evaluation",
            "query-composition",
            "deferred-execution",
          ],
        },
        {
          id: "lazy-django-pagination",
          lines: [135, 157],
          action:
            "Implement pagination with LIMIT/OFFSET for lazy loading of page subsets",
          reason:
            "Pagination prevents loading entire tables. LIMIT 20 OFFSET 40 only fetches rows 41-60, drastically reducing data transfer and rendering time for large datasets.",
          contextLevel: "system",
          relatedConcepts: [
            "pagination",
            "offset-pagination",
            "sql-limit-offset",
          ],
        },
        {
          id: "lazy-django-paginator",
          lines: [149, 153],
          action:
            "Use Django Paginator to automatically generate LIMIT/OFFSET queries",
          reason:
            "Paginator abstracts SQL pagination: automatically calculates offsets, provides has_next/has_previous, and generates efficient queries. Prevents loading all rows when showing 20 per page.",
          contextLevel: "module",
          relatedConcepts: ["django-paginator", "abstraction"],
        },
        {
          id: "lazy-django-property",
          lines: [188, 199],
          action:
            "Use @property decorator for lazy computation with manual caching",
          reason:
            "Properties compute on first access and cache the result. average_rating aggregation query runs only when accessed, not on model load. Cache (_average_rating) prevents re-computation on subsequent accesses.",
          contextLevel: "module",
          relatedConcepts: [
            "lazy-properties",
            "computed-fields",
            "memoization",
          ],
        },
        {
          id: "lazy-django-count",
          lines: [207, 209],
          action: "Use .count() instead of len() for database count queries",
          reason:
            "len(queryset) loads all rows into memory then counts. queryset.count() uses SQL COUNT(*), vastly more efficient for large datasets (1 query vs loading millions of rows).",
          contextLevel: "local",
          relatedConcepts: ["query-optimization", "aggregation"],
        },
        {
          id: "lazy-django-annotate",
          lines: [252, 261],
          action: "Use annotate() to add computed fields in database query",
          reason:
            "annotate(review_count=Count('reviews')) performs aggregation in SQL, not Python. Single query computes counts for all books at database level, far more efficient than Python loops.",
          contextLevel: "system",
          relatedConcepts: [
            "database-aggregation",
            "sql-group-by",
            "computed-columns",
          ],
        },
      ],
      highlights: [
        {
          lines: [42, 59],
          label: "N+1 query anti-pattern",
          sbvpDomain: "philosophy",
        },
        {
          lines: [63, 79],
          label: "select_related optimization",
          sbvpDomain: "behavior",
        },
        {
          lines: [83, 102],
          label: "prefetch_related for reverse relationships",
          sbvpDomain: "behavior",
        },
        {
          lines: [106, 121],
          label: "iterator() for memory-efficient processing",
          sbvpDomain: "behavior",
        },
        {
          lines: [135, 169],
          label: "Pagination with lazy loading",
          sbvpDomain: "structure",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Client-side image galleries and content-heavy pages",
      "Single-page application route-based code splitting",
      "Infinite scroll feeds and paginated data tables",
      "Database ORM query optimization layers",
      "API response pagination endpoints",
      "CDN-delivered modular JavaScript bundles",
    ],
    interactsWith: [
      "pagination",
      "virtual-scrolling",
      "cache-aside",
      "prefetching",
      "progressive-enhancement",
    ],
    architecturalBoundaries: [
      "Frontend rendering layer - Browser to CDN for lazy-loaded chunks",
      "Client-API boundary - Paginated requests as user scrolls",
      "ORM-Database boundary - Lazy query evaluation and JOIN optimization",
      "Module bundler - Code splitting at build time for route-based lazy loading",
    ],
  },

  implementations: [
    {
      id: "react-lazy",
      name: "React.lazy",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Built-in React feature for lazy loading components with dynamic imports. Works with Suspense for loading states. Automatically code-splits at component boundaries when used with bundlers like Webpack or Vite.",
      links: {
        docs: "https://react.dev/reference/react/lazy",
      },
      codeSnippet: `import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}`,
    },
    {
      id: "intersection-observer",
      name: "Intersection Observer API",
      type: "platform",
      languages: ["javascript", "typescript"],
      description:
        "Native browser API for detecting when elements enter or exit the viewport. More performant than scroll event listeners. Standard approach for image lazy loading, infinite scroll, and viewport-based animations.",
      links: {
        docs: "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API",
      },
      codeSnippet: `const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
}, { rootMargin: '50px' });

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img);
});`,
    },
    {
      id: "django-orm",
      name: "Django ORM Lazy Loading",
      type: "framework",
      languages: ["python"],
      description:
        "Django's QuerySet implements lazy evaluation - queries don't execute until data is accessed. Provides select_related() and prefetch_related() to optimize lazy loading and prevent N+1 queries.",
      links: {
        docs: "https://docs.djangoproject.com/en/stable/topics/db/queries/",
      },
      codeSnippet: `# Lazy - query doesn't execute
books = Book.objects.filter(published_year=2024)

# Optimized lazy loading with JOIN
books = Book.objects.select_related('author').all()

# Prefetch reverse relationships
authors = Author.objects.prefetch_related('book_set').all()`,
    },
    {
      id: "next-dynamic",
      name: "Next.js Dynamic Imports",
      type: "framework",
      languages: ["javascript", "typescript"],
      description:
        "Next.js built-in dynamic import with automatic code splitting and SSR support. Extends React.lazy with server-side rendering capabilities and loading customization.",
      links: {
        docs: "https://nextjs.org/docs/advanced-features/dynamic-import",
      },
      codeSnippet: `import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(
  () => import('../components/Heavy'),
  {
    loading: () => <p>Loading...</p>,
    ssr: false // Disable server-side rendering
  }
);

export default function Page() {
  return <DynamicComponent />;
}`,
    },
    {
      id: "lazysizes",
      name: "lazysizes",
      type: "library",
      languages: ["javascript"],
      description:
        "High-performance lazy loading library for images and iframes. Features automatic size detection, responsive images, and low-quality image placeholders. SEO-friendly with noscript fallbacks.",
      links: {
        github: "https://github.com/aFarkas/lazysizes",
      },
      codeSnippet: `<!-- Add lazysizes script -->
<script src="lazysizes.min.js" async></script>

<!-- Lazy load images -->
<img
  data-src="image.jpg"
  data-srcset="image-320w.jpg 320w, image-800w.jpg 800w"
  data-sizes="auto"
  class="lazyload"
  alt="Description"
/>`,
    },
    {
      id: "hibernate-lazy",
      name: "Hibernate Lazy Loading",
      type: "framework",
      languages: ["java"],
      description:
        "JPA/Hibernate ORM lazy loading for entity relationships. Uses proxy objects to defer loading until accessed. Configurable via annotations (@OneToMany, @ManyToOne with fetch=LAZY).",
      links: {
        docs: "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#fetching",
      },
      codeSnippet: `@Entity
public class Author {
    @Id
    private Long id;

    // Lazy load books collection
    @OneToMany(mappedBy = "author", fetch = FetchType.LAZY)
    private List<Book> books;
}

// Prevent N+1 with JOIN FETCH
TypedQuery<Author> query = em.createQuery(
    "SELECT a FROM Author a JOIN FETCH a.books",
    Author.class
);`,
    },
    {
      id: "loadable-components",
      name: "Loadable Components",
      type: "library",
      languages: ["javascript", "typescript"],
      description:
        "Advanced code splitting library for React with SSR support, prefetching, and retry logic. More features than React.lazy including library splitting and critical CSS extraction.",
      links: {
        docs: "https://loadable-components.com/",
        github: "https://github.com/gregberge/loadable-components",
      },
      codeSnippet: `import loadable from '@loadable/component';

const OtherComponent = loadable(() => import('./OtherComponent'), {
  fallback: <div>Loading...</div>,
});

// Prefetch on hover
function MyComponent() {
  return (
    <div>
      <OtherComponent />
      <button onMouseOver={() => OtherComponent.preload()}>
        Hover to prefetch
      </button>
    </div>
  );
}`,
    },
    {
      id: "vite-lazy",
      name: "Vite Dynamic Imports",
      type: "platform",
      languages: ["javascript", "typescript"],
      description:
        "Vite's native dynamic import support with instant hot module replacement during development. Automatically code-splits dynamic imports into separate chunks in production builds.",
      links: {
        docs: "https://vitejs.dev/guide/features.html#dynamic-import",
      },
      codeSnippet: `// Vite automatically code-splits this
const module = await import('./my-module.js');

// Glob imports with lazy loading
const modules = import.meta.glob('./dir/*.js');
const component = await modules['./dir/foo.js']();`,
    },
  ],

  usedInSystems: [
    {
      systemId: "facebook",
      systemName: "Facebook News Feed",
      howUsed:
        "Facebook's news feed uses aggressive lazy loading to handle billions of posts, images, and videos. Only the first 5-10 posts load initially, with infinite scroll triggering lazy loads as users scroll. Images use low-quality image placeholders (LQIP) - tiny blurred thumbnails embedded in initial HTML that get replaced with high-res versions when scrolled into view. Video components lazy load only when posts enter viewport, preventing simultaneous loading of dozens of videos. React components for comments, reactions, and share dialogs lazy load on user interaction, not page load. Code splitting segregates News Feed from Messenger, Marketplace, and other features - users only download News Feed code initially, loading other features on navigation. Pattern composition: Lazy Loading + Intersection Observer + LQIP + Code Splitting + Virtual Scrolling. Rationale: With 2 billion daily users scrolling through unlimited content, loading everything upfront would require minutes and gigabytes of data. Lazy loading reduces initial page load from 10+ seconds to under 2 seconds. Impact: 60% reduction in initial bundle size; 70% reduction in bandwidth for average session; Time-to-Interactive improved from 8s to 1.8s; enabled scaling to billions of users on mobile networks.",
      source: "https://engineering.fb.com/2020/05/08/web/facebook-redesign/",
    },
    {
      systemId: "youtube",
      systemName: "YouTube Video Platform",
      howUsed:
        "YouTube implements multi-layer lazy loading across video thumbnails, player components, comments, and recommendations. Homepage loads only visible thumbnails (first 20 videos) using Intersection Observer, deferring below-fold thumbnails until scrolling. The video player itself is a massive component (500+ KB) that lazy loads only when users click play - initial page shows thumbnail and metadata only. Comments section lazy loads when scrolling to page bottom, preventing comment data from blocking initial video load. Recommended videos sidebar lazy loads additional suggestions as users scroll, implementing infinite scroll for related content. Code splitting separates YouTube Music, YouTube TV, and Creator Studio - these features download only when explicitly accessed. Pattern composition: Lazy Loading + Code Splitting + Intersection Observer + Infinite Scroll + Responsive Images. Rationale: Average YouTube page could contain 100+ video thumbnails, massive player library, hundreds of comments, and endless recommendations - loading all upfront would take 30+ seconds on mobile. Lazy loading enables <3 second page loads. Impact: Initial bundle reduced from 2.5 MB to 400 KB; Time-to-Interactive improved by 75%; Enabled instant navigation between videos without full page reloads; Support for 2 billion monthly users across 100+ countries with varying network speeds.",
      source: "https://web.dev/case-studies/youtube",
    },
    {
      systemId: "amazon",
      systemName: "Amazon Product Listings",
      howUsed:
        "Amazon's product listing pages use lazy loading extensively for images, reviews, and related products. Product gallery images lazy load as users interact with thumbnails - only the primary image loads initially, with 5-10 additional angles loading on hover or click. Customer review section (often 1000+ reviews) lazy loads with pagination - first 10 reviews load with page, more load when clicking 'Next' or scrolling to bottom. 'Customers Also Bought' section lazy loads after primary product data, preventing recommendations from blocking purchase flow. Product videos lazy load only when thumbnail is clicked, not automatically. On search result pages, only first 16 product images load, with remaining 48+ images lazy loading as user scrolls. Pattern composition: Lazy Loading + Pagination + Intersection Observer + Prefetching (next page) + Progressive Images. Rationale: Product pages can have 50+ images, 1000+ reviews, 100+ recommendations - loading all upfront increases page load by 10+ seconds, directly impacting conversion rate. Amazon data shows 100ms delay = 1% revenue loss. Lazy loading keeps pages under 2 seconds. Impact: 40% reduction in initial page weight; Page load time improved from 5.2s to 1.8s; Conversion rate increased 2-3% from faster loads; Bandwidth costs reduced by $50M+ annually across billions of page views.",
      source: "https://www.amazon.science/blog/how-amazon-com-became-fast",
    },
    {
      systemId: "instagram",
      systemName: "Instagram Feed",
      howUsed:
        "Instagram's infinite scroll feed is built entirely on lazy loading principles. Initial load fetches 5-10 posts with low-resolution image placeholders (Instagram pioneered LQIP). As users scroll, high-res images lazy load using Intersection Observer with 200px rootMargin (loads slightly before entering viewport for seamless experience). Video posts lazy load thumbnail initially, upgrading to video only when 50% visible to save bandwidth. Stories carousel at top lazy loads story rings and content only for visible users (first 8), loading more as user swipes. Profile pages lazy load grid images as user scrolls - initial load shows 12 thumbnails, infinite scroll loads 24 more per viewport. Direct Messages lazy loads conversation threads, media, and reactions only when thread is opened. Code splitting separates Feed, Explore, Reels, and Shop into separate bundles. Pattern composition: Lazy Loading + LQIP + Infinite Scroll + Intersection Observer + Code Splitting + Prefetching. Rationale: Unlimited scrolling through photos and videos from 1000+ followers would require downloading gigabytes. Lazy loading enables instant app startup and smooth scrolling. Mobile-first design requires extreme optimization for cellular networks. Impact: App startup time reduced from 8s to 2.5s; 50% reduction in data usage for average session; Smooth 60fps scrolling on mid-range Android devices; Scaled to 2 billion monthly active users with minimal infrastructure cost increase.",
    },
    {
      systemId: "linkedin",
      systemName: "LinkedIn Professional Network",
      howUsed:
        "LinkedIn uses lazy loading across feed, profiles, job listings, and messaging. News feed implements infinite scroll with intersection observer, loading 10 posts initially and 5 more per scroll event. Profile pages lazy load sections: 'Experience' and 'Education' load immediately, but 'Skills', 'Recommendations', and 'Activity' lazy load when scrolled into view or clicked. Job search results use virtualized list with lazy loading - only 20 visible jobs render in DOM, with content lazy loading as user scrolls through 1000+ results. Company pages lazy load employee grids, job listings, and updates in separate chunks. Messaging interface lazy loads conversation history (100+ messages) in batches as user scrolls up. LinkedIn Learning courses lazy load video players and transcripts only when lesson is clicked. Code splitting separates Feed, Jobs, Learning, and Sales Navigator into 200+ KB chunks each. Pattern composition: Lazy Loading + Virtual Scrolling + Code Splitting + Pagination + Intersection Observer. Rationale: Professional profiles contain massive amounts of data (10+ years of experience, 500+ connections, unlimited posts). Loading entire profiles upfront would require 5+ seconds and 5+ MB. Lazy loading enables sub-2-second loads while preserving rich content. Impact: Initial bundle size reduced from 3.2 MB to 600 KB; Time-to-Interactive improved by 65%; Profile page load time reduced from 6s to 2s; Supported growth from 500M to 900M users without proportional infrastructure scaling.",
      source:
        "https://engineering.linkedin.com/blog/2020/optimizing-performance",
    },
  ],

  philosophy: {
    coreProblem:
      "Loading all resources upfront wastes bandwidth, memory, and time on content users may never access",
    designPrinciple:
      "Load resources just-in-time when they're about to be needed, not preemptively",
    historicalContext:
      "Emerged with broadband internet and AJAX in early 2000s; popularized by infinite scroll in social media feeds; became standard practice with mobile-first web development and bundle size consciousness",
    alternativesRejected: [
      "Eager loading everything - wastes bandwidth and slows initial load",
      "Manual load triggers only - poor UX requiring explicit user actions",
      "Aggressive prefetching - still wastes resources on unviewed content",
    ],
    mentalModel:
      "Like reading a book chapter by chapter instead of memorizing the entire book at once - you only process what you're currently engaging with, keeping memory and effort proportional to actual needs",
  },

  visualization: {
    staticDiagram: `sequenceDiagram
    participant User
    participant Viewport
    participant LazyLoader
    participant Cache
    participant Network

    User->>Viewport: Scroll down
    Viewport->>LazyLoader: Element entering viewport
    LazyLoader->>Cache: Check cache
    alt Cached
        Cache-->>LazyLoader: Return cached resource
    else Not cached
        LazyLoader->>Network: Fetch resource
        Network-->>LazyLoader: Resource data
        LazyLoader->>Cache: Store in cache
    end
    LazyLoader->>Viewport: Render content`,
    realWorldAnalogy:
      "Lazy loading is like a restaurant kitchen that only starts cooking dishes when customers order them, rather than pre-cooking everything on the menu at opening time. This prevents food waste, keeps the kitchen manageable, and ensures customers get fresh food when they actually want it.",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Product listing page with 500 items. Lazy load images as user scrolls, reducing initial page load from 10 seconds to 2 seconds.",
        patternRole:
          "Dramatically improves time-to-interactive and conversion rates",
        companies: ["Amazon", "eBay", "Shopify"],
      },
      {
        domain: "Social Media",
        scenario:
          "Infinite scroll feed with unlimited posts. Lazy load content as user scrolls, keeping memory usage constant regardless of scroll depth.",
        patternRole:
          "Enables unlimited content consumption without memory leaks",
        companies: ["Facebook", "Instagram", "Twitter"],
      },
      {
        domain: "Single-Page Applications",
        scenario:
          "Admin dashboard with 20 routes. Code-split each route so users only download the features they access.",
        patternRole:
          "Reduces initial bundle from 2MB to 400KB, improving startup time by 75%",
        companies: ["Gmail", "Notion", "Figma"],
      },
    ],
  },

  tags: [
    "performance",
    "optimization",
    "frontend",
    "lazy-evaluation",
    "code-splitting",
    "bandwidth",
  ],
  difficulty: "intermediate",
};
