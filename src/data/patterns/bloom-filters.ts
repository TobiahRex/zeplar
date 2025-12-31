import type { Pattern } from "../schema";

export const bloomFilters: Pattern = {
  id: "bloom-filters",
  slug: "bloom-filters",
  corpusPath:
    "⚡ PERFORMANCE → ⚙️ Work Optimization → 📊 Data Structure → 📝 Bloom Filters",

  hierarchy: {
    quality: "performance",
    strategy: "Work Optimization",
    family: "Data Structure",
    level: 4,
  },

  concept: {
    name: "Bloom Filters",
    emoji: "📝",
    tagline: "Probabilistic membership",
    definition:
      "A Bloom filter is a space-efficient probabilistic data structure that tests whether an element is a member of a set, with the interesting property that it can definitively say 'no' but only 'probably yes'. Think of it like a very efficient bouncer at a club who has a remarkable memory for faces they've never seen before, but occasionally thinks they recognize someone they haven't met. The structure uses a bit array and multiple hash functions: to add an item, you hash it with each function and set the corresponding bits to 1. To check membership, you hash the item and see if all those bits are set. If any bit is 0, the item definitely wasn't added; if all bits are 1, the item was probably added (but might be a false positive from other items setting those same bits). For example, a browser might use a Bloom filter to check if a URL is in a set of known malicious sites before making an expensive database lookup. The filter uses just a few kilobytes but can represent millions of URLs with a controllable false positive rate.",
    problemSolved:
      "Many systems need to check membership in large sets millions of times per second, but storing the complete set in memory or querying a database for every check is prohibitively expensive in terms of memory or latency. Bloom filters solve this by providing extremely fast membership tests (just a few hash computations and bit lookups) with tiny memory footprint, accepting a small false positive rate as a tradeoff. Without Bloom filters, applications either consume massive amounts of memory storing complete sets, suffer slow performance from repeated database queries, or implement complex caching strategies. Bloom filters enable efficient pre-filtering: quickly eliminate the majority of negative cases, and only perform expensive lookups for the probable positives.",
    tradeoffs: {
      pros: [
        "Extremely memory efficient; can represent millions of items in kilobytes where a hash table would require megabytes",
        "Constant-time O(k) operations where k is the number of hash functions, regardless of set size",
        "No false negatives; if the filter says 'no', you can be absolutely certain the item isn't in the set",
        "Supports very fast membership testing without any disk I/O or network calls",
        "Can be easily combined with other Bloom filters using bitwise OR to merge sets",
      ],
      cons: [
        "False positives are unavoidable and increase as the filter fills up; requires expensive fallback queries to verify",
        "Cannot remove elements from the filter once added without complex counting Bloom filter variants",
        "Requires knowing the expected number of elements upfront to choose optimal size and hash functions",
        "No way to retrieve or enumerate the items stored in the filter; it's purely a yes/no membership test",
        "Hash function quality critically impacts performance; poor hash functions increase false positive rates",
      ],
    },
    relatedPatterns: [
      "hash-tables",
      "caching",
      "probabilistic-data-structures",
      "compression",
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
      id: "bloom-filters-ts-basic",
      language: "typescript",
      title: "TODO: Bloom Filters Implementation",
      description: "TODO: Describe the code example",
      code: `// TODO: Add runnable TypeScript example for Bloom Filters
// This should demonstrate the core concept of the pattern

function example() {
  // Implementation here
}`,
    },
  ],
};
