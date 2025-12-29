#!/usr/bin/env tsx
/**
 * Mermaid Diagram Validator
 *
 * Validates all Mermaid diagrams in pattern files for syntax correctness
 * and accessibility (high-contrast colors).
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DiagramIssue {
  patternId: string;
  patternName: string;
  location: string; // e.g., "structure.diagram", "codeExample[0].diagram"
  diagramCode: string;
  issues: string[];
  warnings: string[];
}

interface ValidationReport {
  generatedAt: string;
  totalPatterns: number;
  totalDiagrams: number;
  diagramsWithIssues: number;
  issues: DiagramIssue[];
}

const LOW_CONTRAST_PATTERNS = [
  /#[fF]{3,6}/, // Light grays/whites
  /#[eE]{3,6}/,
  /#[dD]{3,6}/,
  /yellow/i,
  /lime/i,
  /cyan/i,
  /lightgray/i,
  /whitesmoke/i,
];

function containsLowContrastColors(diagramCode: string): boolean {
  return LOW_CONTRAST_PATTERNS.some((pattern) => pattern.test(diagramCode));
}

function extractDiagramsFromPattern(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pattern: any,
): Array<{
  location: string;
  code: string;
}> {
  const diagrams: Array<{ location: string; code: string }> = [];

  // Structure diagram
  if (pattern.structure?.diagram) {
    diagrams.push({
      location: "structure.diagram",
      code: pattern.structure.diagram,
    });
  }

  // Visualization diagrams
  if (pattern.visualization?.staticDiagram) {
    diagrams.push({
      location: "visualization.staticDiagram",
      code: pattern.visualization.staticDiagram,
    });
  }

  if (pattern.visualization?.animatedDiagram) {
    diagrams.push({
      location: "visualization.animatedDiagram",
      code: pattern.visualization.animatedDiagram,
    });
  }

  // Code example diagrams (if any have embedded diagrams)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pattern.codeExamples?.forEach((example: any, index: number) => {
    if (example.diagram) {
      diagrams.push({
        location: `codeExample[${index}].diagram`,
        code: example.diagram,
      });
    }
  });

  return diagrams;
}

function validateMermaidSyntax(diagramCode: string): {
  valid: boolean;
  errors: string[];
} {
  const trimmed = diagramCode.trim();

  // Basic syntax checks
  const errors: string[] = [];

  if (trimmed.length === 0) {
    errors.push("Empty diagram");
    return { valid: false, errors };
  }

  // Check for basic Mermaid structure
  const mermaidKeywords = [
    "graph",
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "journey",
    "gantt",
    "pie",
    "gitGraph",
  ];

  const hasValidKeyword = mermaidKeywords.some((keyword) =>
    trimmed.toLowerCase().includes(keyword.toLowerCase()),
  );

  if (!hasValidKeyword) {
    errors.push(
      "Does not contain valid Mermaid diagram type keyword (graph, sequenceDiagram, etc.)",
    );
  }

  // Check for unclosed brackets/parentheses
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push(
      `Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`,
    );
  }
  if (openParens !== closeParens) {
    errors.push(
      `Unmatched parentheses: ${openParens} open, ${closeParens} close`,
    );
  }
  if (openBraces !== closeBraces) {
    errors.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
  }

  // Check for common syntax errors
  if (trimmed.includes("-->") && !trimmed.includes("graph")) {
    if (!mermaidKeywords.some((kw) => trimmed.includes(kw))) {
      errors.push("Arrow syntax '-->' used but no graph type declared");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function validatePattern(patternPath: string): Promise<DiagramIssue[]> {
  const patternModule = await import(patternPath);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pattern: any;
  if (patternModule.default) {
    pattern = patternModule.default;
  } else {
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
  }

  if (!pattern) {
    return [];
  }

  const diagrams = extractDiagramsFromPattern(pattern);
  const issues: DiagramIssue[] = [];

  for (const { location, code } of diagrams) {
    const validation = validateMermaidSyntax(code);
    const warnings: string[] = [];

    // Check for accessibility issues
    if (containsLowContrastColors(code)) {
      warnings.push(
        "Contains low-contrast colors (may have accessibility issues)",
      );
    }

    // Check for placeholder content
    const lowerCode = code.toLowerCase();
    if (
      lowerCode.includes("placeholder") ||
      lowerCode.includes("todo") ||
      lowerCode.includes("tbd")
    ) {
      warnings.push("Contains placeholder text (TODO/TBD/Placeholder)");
    }

    if (!validation.valid || warnings.length > 0) {
      issues.push({
        patternId: pattern.id,
        patternName: pattern.concept.name,
        location,
        diagramCode: code.length > 200 ? code.substring(0, 200) + "..." : code,
        issues: validation.errors,
        warnings,
      });
    }
  }

  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const patternFilter = args[0];

  console.log("🔍 Validating Mermaid diagrams...\n");

  const patternsDir = path.join(__dirname, "..", "src", "data", "patterns");
  const patternFiles = await glob("*.ts", {
    cwd: patternsDir,
    absolute: true,
  });

  const allIssues: DiagramIssue[] = [];
  let totalDiagrams = 0;

  for (const file of patternFiles) {
    const slug = path.basename(file, ".ts");

    if (patternFilter && slug !== patternFilter) continue;

    try {
      const patternModule = await import(file);
      const pattern =
        patternModule.default ||
        Object.values(patternModule).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (exp: any) => exp && exp.id && exp.concept,
        );

      if (pattern) {
        const diagrams = extractDiagramsFromPattern(pattern);
        totalDiagrams += diagrams.length;

        const issues = await validatePattern(file);
        if (issues.length > 0) {
          allIssues.push(...issues);
        }
      }
    } catch (error) {
      console.error(`Error validating ${slug}:`, error);
    }
  }

  // Generate report
  const report: ValidationReport = {
    generatedAt: new Date().toISOString(),
    totalPatterns: patternFilter ? 1 : patternFiles.length,
    totalDiagrams,
    diagramsWithIssues: allIssues.length,
    issues: allIssues,
  };

  // Save report
  const reportsDir = path.join(__dirname, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(
    reportsDir,
    `diagram-validation-${Date.now()}.json`,
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("=".repeat(80));
  console.log("MERMAID DIAGRAM VALIDATION REPORT");
  console.log("=".repeat(80));
  console.log();
  console.log(`📊 Total Patterns: ${report.totalPatterns}`);
  console.log(`📈 Total Diagrams: ${report.totalDiagrams}`);
  console.log(`❌ Diagrams with Issues: ${report.diagramsWithIssues}`);
  console.log();

  if (allIssues.length > 0) {
    console.log("Issues Found:");
    console.log();

    allIssues.forEach((issue, index) => {
      console.log(
        `${index + 1}. ${issue.patternName} (${issue.patternId}) - ${issue.location}`,
      );

      if (issue.issues.length > 0) {
        console.log("   ERRORS:");
        issue.issues.forEach((err) => {
          console.log(`     ❌ ${err}`);
        });
      }

      if (issue.warnings.length > 0) {
        console.log("   WARNINGS:");
        issue.warnings.forEach((warn) => {
          console.log(`     ⚠️  ${warn}`);
        });
      }

      console.log();
    });
  } else {
    console.log("✅ All diagrams passed validation!");
  }

  console.log(`📁 Full report saved to: ${reportPath}`);
  console.log();

  // Exit with error code if issues found
  process.exit(allIssues.filter((i) => i.issues.length > 0).length > 0 ? 1 : 0);
}

main().catch(console.error);
