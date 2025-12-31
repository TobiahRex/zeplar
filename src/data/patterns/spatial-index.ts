import type { Pattern } from "../schema";

export const spatialIndex: Pattern = {
  id: "spatial-index",
  slug: "spatial-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → 🗺️ Spatial Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "Spatial Index",
    emoji: "🗺️",
    tagline: "R-Tree, Quadtree",
    definition:
      "Spatial indexes are data structures optimized for efficiently querying multi-dimensional spatial data like geographic coordinates, bounding boxes, or geometric shapes. Think of it like organizing a library by putting maps in geographic sections—maps of Europe on one shelf, Asia on another—so finding maps of France doesn't require scanning every book. Common implementations include R-trees (which group nearby rectangles hierarchically), Quadtrees (which recursively subdivide 2D space into quadrants), and KD-trees (which partition points along alternating dimensions). For example, a ride-sharing app with 100,000 drivers uses an R-tree spatial index to find available drivers within 2 miles of a user's location in milliseconds. Instead of calculating distance to all 100,000 drivers (expensive), the R-tree eliminates 99% of candidates in logarithmic time by traversing bounding boxes. The query 'find all drivers near (lat: 37.77, lon: -122.41)' checks only 100-200 drivers in the relevant geographic cells, returning results 500-1000x faster than linear scan.",
    problemSolved:
      "Querying spatial data with linear scans becomes prohibitively expensive as dataset size grows. For example, finding all restaurants within 5 miles of a point requires calculating distances to every restaurant in the database—with 1 million restaurants, that's 1 million distance calculations per query taking 100+ milliseconds. Searching for overlapping regions (like 'find all delivery zones containing this address') is even worse, requiring expensive polygon intersection tests. Traditional B-tree indexes designed for 1D sorted data don't work for 2D/3D spatial queries—latitude and longitude can't be sorted into a single dimension while preserving proximity. Spatial indexes solve this by organizing data in multi-dimensional hierarchies. An R-tree groups nearby restaurants into bounding boxes at multiple levels: city-level boxes, neighborhood boxes, street boxes. Queries eliminate entire regions without testing individual points, reducing 1 million comparisons to 10-20 bounding box checks plus 10-50 distance calculations.",
    tradeoffs: {
      pros: [
        "Dramatically accelerates spatial queries like range searches, nearest neighbors, and intersection tests, often achieving 100-1000x speedup versus linear scans",
        "Scales efficiently to millions or billions of spatial objects while maintaining logarithmic query time, making real-time geospatial applications practical",
        "Supports various query types including point queries, range queries, nearest neighbor searches, and complex geometric operations like polygon overlap",
        "Adapts to data distribution by adjusting tree structure based on actual spatial clustering, providing good performance across different geographic densities",
      ],
      cons: [
        "Adds significant complexity to implement and maintain compared to simple B-tree indexes, with intricate splitting, balancing, and update algorithms",
        "Increases storage overhead by storing bounding boxes, tree structure metadata, and potentially overlapping regions, adding 30-100% space cost",
        "Creates update performance challenges since inserting or moving objects may require expensive tree restructuring and rebalancing operations",
        "Suffers from the curse of dimensionality in high dimensions (4+) where tree efficiency degrades and query performance approaches linear scan",
      ],
    },
    relatedPatterns: [
      "b-tree-index",
      "hash-index",
      "composite-index",
      "consistent-hashing",
      "partitioning",
    ],
  },

  structure: {
    participants: [
      {
        name: "TODO: Participant name",
        role: "TODO: Participant role",
        responsibilities: ["TODO: Responsibility 1", "TODO: Responsibility 2"],
      },
    ],
    diagram: `graph TB
    Start([Start]) --> Action[TODO: Add Mermaid diagram]
    Action --> End([End])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1`,
    flow: [
      {
        step: 1,
        actor: "TODO: Actor name",
        action: "TODO: Action",
        description: "TODO: Description",
      },
    ],
    invariants: ["TODO: List pattern invariants and constraints"],
  },

  codeExamples: [
    {
      id: "spatial-index-ts-basic",
      language: "typescript",
      title: "TODO: Spatial Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Spatial Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
