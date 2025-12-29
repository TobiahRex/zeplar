#!/usr/bin/env tsx
/**
 * Content Quality Dashboard Generator
 *
 * Generates a static HTML dashboard showing pattern completeness metrics.
 * Reads the latest completeness report and creates visualizations.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CompletenessReport {
  generatedAt: string;
  summary: {
    totalPatterns: number;
    averageScore: number;
    byLayer: { [key: string]: number };
    byQuality: { [key: string]: number };
    completionTiers: {
      excellent: number;
      good: number;
      partial: number;
      minimal: number;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patterns: any[];
}

async function getLatestReport(): Promise<CompletenessReport | null> {
  const reportsDir = path.join(__dirname, "reports");

  if (!fs.existsSync(reportsDir)) {
    return null;
  }

  const reportFiles = await glob("completeness-*.json", {
    cwd: reportsDir,
    absolute: true,
  });

  if (reportFiles.length === 0) {
    return null;
  }

  // Sort by filename (timestamp) descending
  reportFiles.sort().reverse();

  const latestFile = reportFiles[0];
  const content = fs.readFileSync(latestFile, "utf-8");
  return JSON.parse(content);
}

function generateDashboardHTML(report: CompletenessReport): string {
  const layerLabels = Object.keys(report.summary.byLayer);
  const layerData = Object.values(report.summary.byLayer);

  const qualityLabels = Object.keys(report.summary.byQuality);
  const qualityData = Object.values(report.summary.byQuality);

  const topPatterns = report.patterns
    .slice(0, 20)
    .map((p) => ({ name: p.name, score: p.percentage }));

  const bottomPatterns = report.patterns
    .slice(-20)
    .reverse()
    .map((p) => ({ name: p.name, score: p.percentage }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zeplar - Content Quality Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 2rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .stat-value {
      font-size: 3rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 0.5rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .chart-title {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      color: #333;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
    }

    .score-excellent { color: #10b981; }
    .score-good { color: #3b82f6; }
    .score-partial { color: #f59e0b; }
    .score-minimal { color: #ef4444; }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    footer {
      text-align: center;
      color: white;
      margin-top: 2rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Content Quality Dashboard</h1>
      <p class="subtitle">Pattern completeness metrics and quality tracking</p>
      <p class="subtitle">Last updated: ${new Date(report.generatedAt).toLocaleString()}</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalPatterns}</div>
        <div class="stat-label">Total Patterns</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.averageScore.toFixed(1)}%</div>
        <div class="stat-label">Average Completeness</div>
      </div>
      <div class="stat-card">
        <div class="stat-value score-excellent">${report.summary.completionTiers.excellent}</div>
        <div class="stat-label">Excellent (80-100%)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value score-good">${report.summary.completionTiers.good}</div>
        <div class="stat-label">Good (60-79%)</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h2 class="chart-title">Completeness by Layer</h2>
        <canvas id="layerChart"></canvas>
      </div>

      <div class="chart-card">
        <h2 class="chart-title">Completeness by Quality</h2>
        <canvas id="qualityChart"></canvas>
      </div>

      <div class="chart-card full-width">
        <h2 class="chart-title">Completion Tier Distribution</h2>
        <canvas id="tierChart"></canvas>
      </div>

      <div class="chart-card full-width">
        <h2 class="chart-title">Top 20 Patterns</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Pattern</th>
              <th>Score</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${topPatterns
              .map(
                (p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td class="${p.score >= 80 ? "score-excellent" : p.score >= 60 ? "score-good" : p.score >= 40 ? "score-partial" : "score-minimal"}">${p.score}%</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${p.score}%"></div>
                  </div>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="chart-card full-width">
        <h2 class="chart-title">Bottom 20 Patterns (Need Attention)</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Pattern</th>
              <th>Score</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${bottomPatterns
              .map(
                (p, i) => `
              <tr>
                <td>${report.summary.totalPatterns - 19 + i}</td>
                <td>${p.name}</td>
                <td class="${p.score >= 80 ? "score-excellent" : p.score >= 60 ? "score-good" : p.score >= 40 ? "score-partial" : "score-minimal"}">${p.score}%</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${p.score}%"></div>
                  </div>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <footer>
      <p>Generated by Zeplar Content Quality Tools • ${new Date().getFullYear()}</p>
    </footer>
  </div>

  <script>
    // Layer Chart
    const layerCtx = document.getElementById('layerChart').getContext('2d');
    new Chart(layerCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(layerLabels)},
        datasets: [{
          label: 'Completeness %',
          data: ${JSON.stringify(layerData)},
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    // Quality Chart
    const qualityCtx = document.getElementById('qualityChart').getContext('2d');
    new Chart(qualityCtx, {
      type: 'radar',
      data: {
        labels: ${JSON.stringify(qualityLabels)},
        datasets: [{
          label: 'Completeness %',
          data: ${JSON.stringify(qualityData)},
          backgroundColor: 'rgba(118, 75, 162, 0.2)',
          borderColor: 'rgba(118, 75, 162, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    // Tier Chart
    const tierCtx = document.getElementById('tierChart').getContext('2d');
    new Chart(tierCtx, {
      type: 'doughnut',
      data: {
        labels: ['Excellent (80-100%)', 'Good (60-79%)', 'Partial (40-59%)', 'Minimal (0-39%)'],
        datasets: [{
          data: [
            ${report.summary.completionTiers.excellent},
            ${report.summary.completionTiers.good},
            ${report.summary.completionTiers.partial},
            ${report.summary.completionTiers.minimal}
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

async function main() {
  console.log("📊 Generating content quality dashboard...\n");

  const report = await getLatestReport();

  if (!report) {
    console.error(
      "❌ No completeness reports found. Run check:completeness first.",
    );
    process.exit(1);
  }

  const html = generateDashboardHTML(report);

  // Write dashboard to file
  const dashboardDir = path.join(__dirname, "..", "dashboard");
  if (!fs.existsSync(dashboardDir)) {
    fs.mkdirSync(dashboardDir, { recursive: true });
  }

  const dashboardPath = path.join(dashboardDir, "content-quality.html");
  fs.writeFileSync(dashboardPath, html);

  console.log("✅ Dashboard generated successfully!");
  console.log(`📁 Location: ${dashboardPath}`);
  console.log();
  console.log("To view the dashboard:");
  console.log(`   open ${dashboardPath}`);
  console.log();
}

main().catch(console.error);
