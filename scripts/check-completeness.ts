#!/usr/bin/env tsx
/**
 * Content Completeness Checker
 *
 * Evaluates pattern files against quality standards and generates completeness scores.
 * Scores patterns 0-100 across all 6 layers (L1-L6) with detailed reporting.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LayerScore {
  layer: string;
  maxPoints: number;
  earnedPoints: number;
  checks: {
    name: string;
    passed: boolean;
    weight: number;
  }[];
}

interface PatternScore {
  id: string;
  slug: string;
  name: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  quality: string;
  layers: LayerScore[];
}

interface SummaryStats {
  totalPatterns: number;
  averageScore: number;
  byLayer: { [key: string]: number };
  byQuality: { [key: string]: number };
  completionTiers: {
    excellent: number; // 80-100%
    good: number; // 60-79%
    partial: number; // 40-59%
    minimal: number; // 0-39%
  };
}

interface CompletenessReport {
  generatedAt: string;
  summary: SummaryStats;
  patterns: PatternScore[];
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function hasRealMermaidDiagram(diagram: string): boolean {
  if (!diagram || diagram.trim().length === 0) return false;
  const trimmed = diagram.trim().toLowerCase();
  // Check if it's a placeholder
  if (
    trimmed.includes("placeholder") ||
    trimmed.includes("todo") ||
    trimmed.includes("tbd")
  )
    return false;
  // Check if it contains actual Mermaid syntax
  return (
    trimmed.includes("graph") ||
    trimmed.includes("sequencediagram") ||
    trimmed.includes("statediagram") ||
    trimmed.includes("flowchart")
  );
}

function countCodeLines(code: string): number {
  return code
    .split("\n")
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith("//"))
    .length;
}

function hasLayer3Trifecta(codeExample: {
  contextDilation?: unknown;
  annotations?: unknown[];
  highlights?: unknown[];
}): { hasContext: boolean; hasAnnotations: boolean; hasHighlights: boolean } {
  return {
    hasContext: !!codeExample.contextDilation,
    hasAnnotations:
      !!codeExample.annotations && codeExample.annotations.length > 0,
    hasHighlights:
      !!codeExample.highlights && codeExample.highlights.length > 0,
  };
}

async function evaluatePattern(patternPath: string): Promise<PatternScore> {
  // Dynamically import the pattern file to get actual pattern object
  const patternModule = await import(patternPath);

  // The pattern should be the default export or a named export
  // Try different export patterns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pattern: any;

  if (patternModule.default) {
    pattern = patternModule.default;
  } else {
    // Find the first export that looks like a pattern (has required fields)
    const exports = Object.values(patternModule);

    pattern = exports.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (exp: any) =>
        exp &&
        typeof exp === "object" &&
        exp.id &&
        exp.concept &&
        exp.hierarchy,
    );

    if (!pattern) {
      throw new Error(`Could not find pattern export in ${patternPath}`);
    }
  }

  const layers: LayerScore[] = [];

  // L1: Concept (20 points)
  const l1Checks = [
    {
      name: "Definition length ≥150 words",
      passed: countWords(pattern.concept.definition || "") >= 150,
      weight: 5,
    },
    {
      name: "Problem solved ≥100 words",
      passed: countWords(pattern.concept.problemSolved || "") >= 100,
      weight: 5,
    },
    {
      name: "3+ pros",
      passed: (pattern.concept.tradeoffs?.pros?.length || 0) >= 3,
      weight: 3,
    },
    {
      name: "3+ cons",
      passed: (pattern.concept.tradeoffs?.cons?.length || 0) >= 3,
      weight: 3,
    },
    {
      name: "3+ related patterns",
      passed: (pattern.concept.relatedPatterns?.length || 0) >= 3,
      weight: 4,
    },
  ];

  layers.push({
    layer: "L1-Concept",
    maxPoints: 20,
    earnedPoints: l1Checks.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    ),
    checks: l1Checks,
  });

  // L2: Structure (20 points)
  const l2Checks = [
    {
      name: "3+ participants",
      passed: (pattern.structure?.participants?.length || 0) >= 3,
      weight: 5,
    },
    {
      name: "5+ flow steps",
      passed: (pattern.structure?.flow?.length || 0) >= 5,
      weight: 5,
    },
    {
      name: "Real Mermaid diagram",
      passed: hasRealMermaidDiagram(pattern.structure?.diagram || ""),
      weight: 7,
    },
    {
      name: "3+ invariants",
      passed: (pattern.structure?.invariants?.length || 0) >= 3,
      weight: 3,
    },
  ];

  layers.push({
    layer: "L2-Structure",
    maxPoints: 20,
    earnedPoints: l2Checks.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    ),
    checks: l2Checks,
  });

  // L3: Code Expression (20 points)
  const codeExamples = pattern.codeExamples || [];
  const hasEnoughExamples = codeExamples.length >= 2;
  const hasLongCodeExample = codeExamples.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ex: any) => countCodeLines(ex.code || "") >= 100,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trifectaResults = codeExamples.map((ex: any) => hasLayer3Trifecta(ex));
  const hasCompleteTrifecta = trifectaResults.some(
    (t) => t.hasContext && t.hasAnnotations && t.hasHighlights,
  );

  const l3Checks = [
    {
      name: "2+ code examples",
      passed: hasEnoughExamples,
      weight: 7,
    },
    {
      name: "Code length ≥100 lines",
      passed: hasLongCodeExample,
      weight: 6,
    },
    {
      name: "Has complete Layer 3 Trifecta",
      passed: hasCompleteTrifecta,
      weight: 7,
    },
  ];

  layers.push({
    layer: "L3-CodeExpression",
    maxPoints: 20,
    earnedPoints: l3Checks.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    ),
    checks: l3Checks,
  });

  // L4: System Integration (20 points)
  const systemContext = pattern.systemContext || {};
  const l4Checks = [
    {
      name: "2+ placement scenarios",
      passed: (systemContext.typicalPlacement?.length || 0) >= 2,
      weight: 10,
    },
    {
      name: "2+ architectural boundaries",
      passed: (systemContext.architecturalBoundaries?.length || 0) >= 2,
      weight: 10,
    },
  ];

  layers.push({
    layer: "L4-SystemIntegration",
    maxPoints: 20,
    earnedPoints: l4Checks.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    ),
    checks: l4Checks,
  });

  // L5: Technology Mapping (10 points)
  const implementations = pattern.implementations || [];
  const l5Checks = [
    {
      name: "5+ technology implementations",
      passed: implementations.length >= 5,
      weight: 10,
    },
  ];

  layers.push({
    layer: "L5-TechnologyMapping",
    maxPoints: 10,
    earnedPoints: l5Checks.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    ),
    checks: l5Checks,
  });

  // L6: System Composition (10 points)
  const usedInSystems = pattern.usedInSystems || [];
  const l6Checks = [
    {
      name: "2+ case studies",
      passed: usedInSystems.length >= 2,
      weight: 10,
    },
  ];

  layers.push({
    layer: "L6-SystemComposition",
    maxPoints: 10,
    earnedPoints: l6Checks.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    ),
    checks: l6Checks,
  });

  const totalEarned = layers.reduce(
    (sum, layer) => sum + layer.earnedPoints,
    0,
  );
  const maxScore = 100;

  return {
    id: pattern.id,
    slug: pattern.slug,
    name: pattern.concept.name,
    quality: pattern.hierarchy.quality,
    totalScore: totalEarned,
    maxScore,
    percentage: Math.round((totalEarned / maxScore) * 100),
    layers,
  };
}

async function generateReport(
  patternFilter?: string,
): Promise<CompletenessReport> {
  const patternsDir = path.join(__dirname, "..", "src", "data", "patterns");

  // Find all pattern files
  const patternFiles = await glob("*.ts", {
    cwd: patternsDir,
    absolute: true,
  });

  const scores: PatternScore[] = [];

  for (const file of patternFiles) {
    const slug = path.basename(file, ".ts");

    // Skip if pattern filter is specified and doesn't match
    if (patternFilter && slug !== patternFilter) continue;

    try {
      const score = await evaluatePattern(file);
      scores.push(score);
    } catch (error) {
      console.error(`Error evaluating ${slug}:`, error);
    }
  }

  // Calculate summary statistics
  const totalPatterns = scores.length;
  const averageScore =
    scores.reduce((sum, s) => sum + s.percentage, 0) / totalPatterns;

  const byLayer: { [key: string]: number } = {};
  const layerNames = [
    "L1-Concept",
    "L2-Structure",
    "L3-CodeExpression",
    "L4-SystemIntegration",
    "L5-TechnologyMapping",
    "L6-SystemComposition",
  ];

  layerNames.forEach((layerName) => {
    const layerScores = scores.map((s) => {
      const layer = s.layers.find((l) => l.layer === layerName);
      return layer ? (layer.earnedPoints / layer.maxPoints) * 100 : 0;
    });
    byLayer[layerName] =
      layerScores.reduce((sum, score) => sum + score, 0) / layerScores.length;
  });

  const byQuality: { [key: string]: number } = {};
  const qualities = [...new Set(scores.map((s) => s.quality))];
  qualities.forEach((quality) => {
    const qualityScores = scores.filter((s) => s.quality === quality);
    byQuality[quality] =
      qualityScores.reduce((sum, s) => sum + s.percentage, 0) /
      qualityScores.length;
  });

  const completionTiers = {
    excellent: scores.filter((s) => s.percentage >= 80).length,
    good: scores.filter((s) => s.percentage >= 60 && s.percentage < 80).length,
    partial: scores.filter((s) => s.percentage >= 40 && s.percentage < 60)
      .length,
    minimal: scores.filter((s) => s.percentage < 40).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPatterns,
      averageScore,
      byLayer,
      byQuality,
      completionTiers,
    },
    patterns: scores.sort((a, b) => b.percentage - a.percentage),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const patternFilter = args[0]; // Optional: specify pattern slug to check only one

  console.log("🔍 Analyzing pattern completeness...\n");

  const report = await generateReport(patternFilter);

  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write JSON report
  const reportPath = path.join(reportsDir, `completeness-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary to console
  console.log("=".repeat(80));
  console.log("CONTENT COMPLETENESS REPORT");
  console.log("=".repeat(80));
  console.log();
  console.log(`📊 Total Patterns: ${report.summary.totalPatterns}`);
  console.log(`📈 Average Score: ${report.summary.averageScore.toFixed(1)}%`);
  console.log();

  console.log("Completion Tiers:");
  console.log(
    `  ✅ Excellent (80-100%): ${report.summary.completionTiers.excellent}`,
  );
  console.log(
    `  👍 Good (60-79%):      ${report.summary.completionTiers.good}`,
  );
  console.log(
    `  ⚠️  Partial (40-59%):   ${report.summary.completionTiers.partial}`,
  );
  console.log(
    `  ❌ Minimal (0-39%):    ${report.summary.completionTiers.minimal}`,
  );
  console.log();

  console.log("Average by Layer:");
  Object.entries(report.summary.byLayer).forEach(([layer, score]) => {
    const bar = "█".repeat(Math.round(score / 5));
    console.log(`  ${layer.padEnd(25)} ${score.toFixed(1)}% ${bar}`);
  });
  console.log();

  console.log("Average by Quality:");
  Object.entries(report.summary.byQuality)
    .sort(([, a], [, b]) => b - a)
    .forEach(([quality, score]) => {
      const bar = "█".repeat(Math.round(score / 5));
      console.log(`  ${quality.padEnd(25)} ${score.toFixed(1)}% ${bar}`);
    });
  console.log();

  if (patternFilter) {
    // Detailed output for single pattern
    const pattern = report.patterns[0];
    if (pattern) {
      console.log(`Detailed Score for ${pattern.name} (${pattern.slug}):`);
      console.log(`  Total: ${pattern.percentage}%`);
      console.log();
      pattern.layers.forEach((layer) => {
        console.log(`  ${layer.layer}:`);
        console.log(`    ${layer.earnedPoints}/${layer.maxPoints} points`);
        layer.checks.forEach((check) => {
          const status = check.passed ? "✅" : "❌";
          console.log(`      ${status} ${check.name} (${check.weight}pts)`);
        });
        console.log();
      });
    }
  } else {
    // Top 10 patterns
    console.log("Top 10 Patterns:");
    report.patterns.slice(0, 10).forEach((p, i) => {
      console.log(
        `  ${(i + 1).toString().padStart(2)}. ${p.name.padEnd(40)} ${p.percentage}%`,
      );
    });
  }

  console.log();
  console.log(`📁 Full report saved to: ${reportPath}`);
  console.log();
}

main().catch(console.error);
