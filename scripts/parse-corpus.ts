#!/usr/bin/env tsx
/**
 * Corpus Parser
 *
 * Parses the pattern corpus markdown file and extracts all Level 4 patterns.
 * Generates a JSON manifest with pattern metadata for automated file generation.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CorpusPattern {
  name: string;
  emoji: string;
  tagline: string;
  corpusPath: string;
  lineNumber: number;
  hierarchy: {
    quality: string;
    strategy: string;
    family: string;
    level: 4;
  };
}

interface ParseContext {
  currentQuality: string;
  currentStrategy: string;
  currentFamily: string;
  qualityEmoji: string;
  strategyEmoji: string;
  familyEmoji: string;
}

function parseCorpus(filePath: string): CorpusPattern[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const patterns: CorpusPattern[] = [];
  let inLevel4Section = false;
  const context: ParseContext = {
    currentQuality: "",
    currentStrategy: "",
    currentFamily: "",
    qualityEmoji: "",
    strategyEmoji: "",
    familyEmoji: "",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Detect Level 4 section headers (e.g., "# Level 4: Specific Patterns (Children of Each Family)")
    if (line.match(/^# Level 4:/)) {
      inLevel4Section = true;
      continue;
    }

    // Detect when we leave Level 4 section (Level 5 header)
    if (line.match(/^# Level 5:/)) {
      inLevel4Section = false;
      continue;
    }

    // Only process lines within Level 4 section
    if (!inLevel4Section) {
      continue;
    }

    // Level 3 Family headers within Level 4 (e.g., "## ⚡ PERFORMANCE → 🎯 Work Reduction → ⏱️ Temporal Patterns")
    const familyHeaderMatch = line.match(
      /^## ([^\s]+)\s+([A-Z]+)\s+→\s+([^\s]+)\s+([^→]+?)\s+→\s+([^\s]+)\s+(.+?)\s+Patterns$/,
    );

    if (familyHeaderMatch) {
      context.qualityEmoji = familyHeaderMatch[1];
      context.currentQuality = familyHeaderMatch[2].toLowerCase();
      context.strategyEmoji = familyHeaderMatch[3];
      context.currentStrategy = familyHeaderMatch[4].trim();
      context.familyEmoji = familyHeaderMatch[5];
      context.currentFamily = familyHeaderMatch[6].trim();
      continue;
    }

    // 2-level headers (Quality → Family) for Security/Observability/Maintainability (e.g., "## 🔒 SECURITY → 🎟️ Token-Based Auth Patterns")
    const twoLevelHeaderMatch = line.match(
      /^## ([^\s]+)\s+([A-Z]+)\s+→\s+([^\s]+)\s+(.+?)\s+Patterns$/,
    );

    if (twoLevelHeaderMatch) {
      context.qualityEmoji = twoLevelHeaderMatch[1];
      context.currentQuality = twoLevelHeaderMatch[2].toLowerCase();
      context.strategyEmoji = ""; // No strategy level for these
      context.currentStrategy = ""; // No strategy level for these
      context.familyEmoji = twoLevelHeaderMatch[3];
      context.currentFamily = twoLevelHeaderMatch[4].trim();
      continue;
    }

    // Level 4 patterns (e.g., "- **⏸️ Debouncing** — _Wait for silence before executing_")
    const patternMatch = line.match(
      /^- \*\*([^\s]+)\s+([^*]+)\*\* — _([^_]+)_$/,
    );

    if (patternMatch && context.currentQuality && context.currentFamily) {
      const emoji = patternMatch[1];
      const name = patternMatch[2].trim();
      const tagline = patternMatch[3].trim();

      // Build corpus path with optional strategy level
      const corpusPath = context.currentStrategy
        ? `${context.qualityEmoji} ${context.currentQuality.toUpperCase()} → ${context.strategyEmoji} ${context.currentStrategy} → ${context.familyEmoji} ${context.currentFamily} → ${emoji} ${name}`
        : `${context.qualityEmoji} ${context.currentQuality.toUpperCase()} → ${context.familyEmoji} ${context.currentFamily} → ${emoji} ${name}`;

      patterns.push({
        name,
        emoji,
        tagline,
        corpusPath,
        lineNumber,
        hierarchy: {
          quality: context.currentQuality,
          strategy: context.currentStrategy,
          family: context.currentFamily,
          level: 4,
        },
      });
    }
  }

  return patterns;
}

function main() {
  const corpusPath = path.join(
    __dirname,
    "../docs/brainstorming/software-patterns/patterns-coprus.md",
  );

  console.log("📚 Parsing pattern corpus...");
  console.log(`   Source: ${corpusPath}\n`);

  const patterns = parseCorpus(corpusPath);

  console.log(`✅ Extracted ${patterns.length} Level 4 patterns\n`);

  // Group by quality for summary
  const byQuality: Record<string, number> = {};
  patterns.forEach((p) => {
    byQuality[p.hierarchy.quality] = (byQuality[p.hierarchy.quality] || 0) + 1;
  });

  console.log("📊 Breakdown by Quality:");
  Object.entries(byQuality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([quality, count]) => {
      console.log(`   ${quality.padEnd(16)} ${count} patterns`);
    });

  // Save manifest
  const manifestPath = path.join(__dirname, "../corpus-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(patterns, null, 2));

  console.log(`\n💾 Saved manifest: ${manifestPath}`);
  console.log(`\n🎯 Ready to generate ${patterns.length} pattern files!`);
}

main();
