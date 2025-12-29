#!/usr/bin/env tsx
/**
 * Code Example Test Runner
 *
 * Extracts and tests code examples from pattern files to verify they compile/run.
 * Focus on TypeScript examples with optional support for other languages.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CodeExampleResult {
  patternId: string;
  patternName: string;
  exampleId: string;
  exampleTitle: string;
  language: string;
  passed: boolean;
  skipped: boolean;
  skipReason?: string;
  errors?: string[];
  output?: string;
}

interface TestReport {
  generatedAt: string;
  totalPatterns: number;
  totalExamples: number;
  tested: number;
  skipped: number;
  passed: number;
  failed: number;
  results: CodeExampleResult[];
}

async function testTypeScriptCode(
  code: string,
  exampleId: string,
): Promise<{ passed: boolean; errors?: string[]; output?: string }> {
  // Create temporary file
  const tempDir = path.join(__dirname, "..", ".test-temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `${exampleId}.ts`);

  try {
    // Write code to temp file
    fs.writeFileSync(tempFile, code);

    // Try to compile with TypeScript
    const { stdout } = await execAsync(
      `npx tsc --noEmit --skipLibCheck ${tempFile}`,
      { cwd: path.join(__dirname, "..") },
    );

    // If no errors, compilation succeeded
    return {
      passed: true,
      output: stdout || "✅ TypeScript compilation successful",
    };
  } catch (error) {
    // TypeScript compilation failed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    const errorOutput = err.stderr || err.stdout || err.message;
    return {
      passed: false,
      errors: [errorOutput],
    };
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function testCodeExample(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pattern: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  example: any,
): Promise<CodeExampleResult> {
  const result: CodeExampleResult = {
    patternId: pattern.id,
    patternName: pattern.concept.name,
    exampleId: example.id,
    exampleTitle: example.title,
    language: example.language,
    passed: false,
    skipped: false,
  };

  // Skip if marked as not runnable
  if (example.runnable === false) {
    result.skipped = true;
    result.skipReason = "Marked as runnable: false";
    return result;
  }

  // Skip if code is too short (likely just a snippet)
  if (!example.code || example.code.trim().length < 50) {
    result.skipped = true;
    result.skipReason = "Code too short (< 50 chars)";
    return result;
  }

  // Test based on language
  if (example.language === "typescript") {
    const testResult = await testTypeScriptCode(example.code, example.id);
    result.passed = testResult.passed;
    result.errors = testResult.errors;
    result.output = testResult.output;
  } else if (example.language === "python") {
    // Python testing (optional - requires Python installed)
    try {
      const tempDir = path.join(__dirname, "..", ".test-temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFile = path.join(tempDir, `${example.id}.py`);
      fs.writeFileSync(tempFile, example.code);

      await execAsync(`python3 -m py_compile ${tempFile}`);
      result.passed = true;
      result.output = "✅ Python compilation successful";

      fs.unlinkSync(tempFile);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      result.passed = false;
      result.errors = [err.stderr || err.message];
    }
  } else if (example.language === "go") {
    // Go testing (optional - requires Go installed)
    result.skipped = true;
    result.skipReason = "Go testing not implemented (requires go toolchain)";
  } else if (example.language === "java") {
    // Java testing (optional - requires Java installed)
    result.skipped = true;
    result.skipReason =
      "Java testing not implemented (requires javac toolchain)";
  } else {
    // Unsupported language
    result.skipped = true;
    result.skipReason = `Language '${example.language}' not supported for testing`;
  }

  return result;
}

async function testPattern(patternPath: string): Promise<CodeExampleResult[]> {
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

  if (!pattern || !pattern.codeExamples) {
    return [];
  }

  const results: CodeExampleResult[] = [];

  for (const example of pattern.codeExamples) {
    try {
      const result = await testCodeExample(pattern, example);
      results.push(result);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      results.push({
        patternId: pattern.id,
        patternName: pattern.concept.name,
        exampleId: example.id,
        exampleTitle: example.title,
        language: example.language,
        passed: false,
        skipped: false,
        errors: [err.message],
      });
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const patternFilter = args[0];

  console.log("🧪 Testing code examples...\n");

  const patternsDir = path.join(__dirname, "..", "src", "data", "patterns");
  const patternFiles = await glob("*.ts", {
    cwd: patternsDir,
    absolute: true,
  });

  const allResults: CodeExampleResult[] = [];

  for (const file of patternFiles) {
    const slug = path.basename(file, ".ts");

    if (patternFilter && slug !== patternFilter) continue;

    try {
      const results = await testPattern(file);
      allResults.push(...results);
    } catch (error) {
      console.error(`Error testing ${slug}:`, error);
    }
  }

  // Generate report
  const tested = allResults.filter((r) => !r.skipped).length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed && !r.skipped).length;
  const skipped = allResults.filter((r) => r.skipped).length;

  const report: TestReport = {
    generatedAt: new Date().toISOString(),
    totalPatterns: patternFilter ? 1 : patternFiles.length,
    totalExamples: allResults.length,
    tested,
    skipped,
    passed,
    failed,
    results: allResults,
  };

  // Save report
  const reportsDir = path.join(__dirname, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, `code-examples-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("=".repeat(80));
  console.log("CODE EXAMPLE TEST REPORT");
  console.log("=".repeat(80));
  console.log();
  console.log(`📊 Total Patterns: ${report.totalPatterns}`);
  console.log(`📈 Total Examples: ${report.totalExamples}`);
  console.log(`🧪 Tested: ${tested}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log();

  if (failed > 0) {
    console.log("Failed Examples:");
    console.log();

    const failedResults = allResults.filter((r) => !r.passed && !r.skipped);
    failedResults.forEach((result, index) => {
      console.log(
        `${index + 1}. ${result.patternName} - ${result.exampleTitle} (${result.language})`,
      );
      console.log(`   ID: ${result.exampleId}`);
      if (result.errors) {
        result.errors.forEach((err) => {
          console.log(`   ❌ ${err.substring(0, 200)}`);
        });
      }
      console.log();
    });
  }

  // Show skip reasons summary
  const skipReasons = allResults
    .filter((r) => r.skipped)
    .reduce(
      (acc, r) => {
        const reason = r.skipReason || "Unknown";
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

  if (Object.keys(skipReasons).length > 0) {
    console.log("Skip Reasons:");
    Object.entries(skipReasons).forEach(([reason, count]) => {
      console.log(`  • ${reason}: ${count}`);
    });
    console.log();
  }

  console.log(`📁 Full report saved to: ${reportPath}`);
  console.log();

  // Exit with error if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
