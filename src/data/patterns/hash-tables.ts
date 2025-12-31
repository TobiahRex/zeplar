import type { Pattern } from "../schema";

export const hashTables: Pattern = {
  id: "hash-tables",
  slug: "hash-tables",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → #️⃣ Hash Tables",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Hash Tables",
    emoji: "#️⃣",
    tagline: "O(1) key lookup",
    definition:
      "A hash table (also called hash map or dictionary) is a data structure that provides extremely fast key-value lookups by using a hash function to compute an index into an array of buckets where the desired value is stored. Think of it like a library's card catalog: instead of searching every book sequentially, you hash the book title to get a specific drawer number, then go directly to that drawer. The hash function takes a key (string, number, object) and deterministically maps it to an integer index in the array. For example, hash('john') might yield 42, so the value for 'john' is stored at array[42]. When multiple keys hash to the same index (a collision), the hash table uses collision resolution strategies like chaining (store a linked list at each bucket) or open addressing (probe for the next empty slot). Hash tables power critical operations in programming: JavaScript objects, Python dictionaries, database indexing, caching (Redis, Memcached), sets, and counting frequencies. The average-case time complexity is O(1) for insert, delete, and lookup—making hash tables one of the most performant data structures for key-based access.",
    problemSolved:
      "Searching for an item in an unsorted array requires O(n) time—you must check every element. Even sorted arrays require O(log n) time with binary search. Hash tables solve this by providing O(1) average-case lookup, regardless of data size. This is critical when you need to check membership (does this user exist?), count occurrences (word frequency in a document), or maintain mappings (username to user ID). Without hash tables, operations like finding duplicates in an array, implementing caches, or building indexes would be prohibitively slow. For example, detecting duplicate URLs when crawling 10 million web pages would take O(n²) comparisons with arrays, but only O(n) with a hash set. Hash tables enable constant-time access patterns essential for real-time systems, databases, compilers (symbol tables), and network routers (IP routing tables). They transform linear-time algorithms into constant-time operations by trading space for speed.",
    tradeoffs: {
      pros: [
        "O(1) average-case time for insert, delete, and lookup operations",
        "Extremely fast for key-based access patterns regardless of dataset size",
        "Simple interface (get, set, delete) easy to understand and use",
        "Flexible key types (strings, numbers, objects if hashable)",
        "Excellent for caching, deduplication, and frequency counting",
      ],
      cons: [
        "O(n) worst-case time when hash collisions cause all keys to cluster in one bucket",
        "Requires extra memory for the array and overhead for collision handling",
        "No ordering of keys—cannot iterate in sorted order or find min/max efficiently",
        "Hash function quality critical—poor functions lead to many collisions and degraded performance",
        "Resize operations (rehashing) are expensive when load factor exceeds threshold",
      ],
    },
    relatedPatterns: [
      "hash-index",
      "hash-sharding",
      "consistent-hashing",
      "bloom-filters",
      "dynamic-programming",
      "graphs",
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
      id: "hash-tables-ts-basic",
      language: "typescript",
      title: "TODO: Hash Tables Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Hash Tables
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
