import type { Pattern } from "../schema";

export const invertedIndex: Pattern = {
  id: "inverted-index",
  slug: "inverted-index",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 🔍 Indexing → 📝 Inverted Index",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Indexing",
    level: 4,
  },

  concept: {
    name: "Inverted Index",
    emoji: "📝",
    tagline: "Full-text search",
    definition:
      "Inverted Index maps terms to the documents containing them, enabling fast full-text search by looking up term locations rather than scanning every document. Think of it like a book's index at the back—instead of reading every page to find mentions of 'machine learning,' you look up that term in the index to see pages 17, 43, 89. In search engines, each document is tokenized into terms. For document 1: 'quick brown fox,' document 2: 'lazy brown dog,' the inverted index stores: 'quick' → [doc 1], 'brown' → [doc 1, doc 2], 'fox' → [doc 1], 'lazy' → [doc 2], 'dog' → [doc 2]. Searching for 'brown fox' becomes two index lookups ('brown' → [1, 2], 'fox' → [1]) intersected to find [doc 1]. This transforms O(N documents) linear scans into O(K terms) index lookups where K is query size. The index also stores term positions for phrase queries, term frequencies for ranking, and precomputed scores for relevance.",
    problemSolved:
      "Searching text documents without indexes requires scanning every document, which becomes impossibly slow as collections grow. Searching for 'distributed systems' in 1 million documents by reading each document takes minutes. SQL LIKE queries cannot efficiently search for terms within text fields, making them unsuitable for full-text search. Traditional indexes on entire text fields do not support partial word matches or relevance ranking. Inverted Index solves this by pre-building a lookup structure that maps every unique term to its document locations. Searching millions of documents becomes a few hash lookups and set intersections, completing in milliseconds. This is critical for search engines, log analysis, document management systems, e-commerce product search, and any application requiring fast full-text queries with relevance ranking.",
    tradeoffs: {
      pros: [
        "Enables sub-second full-text search across millions of documents through fast term lookups and intersections",
        "Supports advanced features like phrase queries, fuzzy matching, and relevance ranking with TF-IDF scoring",
        "Scales logarithmically with document count rather than linearly, maintaining performance as dataset grows",
        "Allows complex boolean queries (AND, OR, NOT) to be evaluated efficiently using set operations",
      ],
      cons: [
        "Requires significant storage overhead, often 50-100% of original document size for comprehensive indexing",
        "Index updates expensive as each document modification requires tokenization and posting list updates",
        "Building initial index is computationally intensive, taking hours or days for large document collections",
        "Cannot efficiently support queries on frequently changing fields without expensive real-time reindexing",
      ],
    },
    relatedPatterns: ["b-tree-index", "trie", "tf-idf", "elasticsearch"],
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
      id: "inverted-index-ts-basic",
      language: "typescript",
      title: "TODO: Inverted Index Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Inverted Index
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
