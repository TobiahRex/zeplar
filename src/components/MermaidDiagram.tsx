import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// High-contrast theme configuration matching app styling
const mermaidConfig = {
  startOnLoad: false,
  theme: "dark" as const,
  themeVariables: {
    // Primary colors - high contrast
    primaryColor: "#3b82f6", // blue-500
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#60a5fa", // blue-400

    // Secondary colors
    secondaryColor: "#8b5cf6", // violet-500
    secondaryTextColor: "#ffffff",
    secondaryBorderColor: "#a78bfa", // violet-400

    // Tertiary colors
    tertiaryColor: "#10b981", // emerald-500
    tertiaryTextColor: "#ffffff",
    tertiaryBorderColor: "#34d399", // emerald-400

    // Neutral colors for background contrast
    noteBkgColor: "#1e293b", // slate-800
    noteTextColor: "#f1f5f9", // slate-100
    noteBorderColor: "#475569", // slate-600

    // State diagram specific
    labelColor: "#ffffff",
    labelTextColor: "#000000",

    // Sequence diagram
    actorBkg: "#3b82f6",
    actorBorder: "#60a5fa",
    actorTextColor: "#ffffff",
    actorLineColor: "#94a3b8", // slate-400
    signalColor: "#f1f5f9",
    signalTextColor: "#f1f5f9",

    // Flowchart
    edgeLabelBackground: "#1e293b",
    clusterBkg: "#0f172a", // slate-900
    clusterBorder: "#475569",

    // Background and grid
    background: "transparent",
    mainBkg: "#1e293b",
    lineColor: "#64748b", // slate-500

    // Font
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "14px",
  },
  flowchart: {
    htmlLabels: true,
    curve: "basis" as const,
    padding: 20,
  },
  sequence: {
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    messageMargin: 40,
  },
  stateDiagram: {
    padding: 20,
  },
};

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;

      try {
        // Initialize mermaid with our theme
        mermaid.initialize(mermaidConfig);

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram",
        );
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <p className="text-sm text-red-400 font-mono">
          Failed to render diagram: {error}
        </p>
        <details className="mt-2">
          <summary className="text-xs text-red-400/70 cursor-pointer">
            Show diagram code
          </summary>
          <pre className="mt-2 text-xs text-red-400/50 overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram rounded-lg bg-slate-900/50 p-6 border border-slate-700/50 overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
