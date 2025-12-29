import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { patternList } from "@/data/patterns";
import { startSessionRequested } from "@/features/learning/learningSlice";

// Color mapping for quality badges
const qualityColors: Record<string, string> = {
  performance: "bg-amber-500/20 text-amber-400",
  reliability: "bg-blue-500/20 text-blue-400",
  scalability: "bg-green-500/20 text-green-400",
  security: "bg-red-500/20 text-red-400",
  observability: "bg-purple-500/20 text-purple-400",
  maintainability: "bg-cyan-500/20 text-cyan-400",
  consistency: "bg-emerald-500/20 text-emerald-400",
};

// Icons for qualities
const qualityIcons: Record<string, string> = {
  performance: "⚡",
  reliability: "🛡️",
  scalability: "📈",
  security: "🔒",
  observability: "👁️",
  maintainability: "🔧",
};

export default function PatternSelection() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(
    new Set(patternList.map((p) => p.id)), // Default: all selected
  );

  // Group patterns by quality
  const patternsByQuality = patternList.reduce(
    (acc, pattern) => {
      const quality = pattern.hierarchy.quality;
      if (!acc[quality]) {
        acc[quality] = [];
      }
      acc[quality].push(pattern);
      return acc;
    },
    {} as Record<string, typeof patternList>,
  );

  const handleSelectAll = () => {
    setSelectedPatterns(new Set(patternList.map((p) => p.id)));
  };

  const handleClearAll = () => {
    setSelectedPatterns(new Set());
  };

  const handleToggleQuality = (quality: string) => {
    const qualityPatternIds = patternsByQuality[quality].map((p) => p.id);
    const allSelected = qualityPatternIds.every((id) =>
      selectedPatterns.has(id),
    );

    setSelectedPatterns((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all in this quality
        qualityPatternIds.forEach((id) => next.delete(id));
      } else {
        // Select all in this quality
        qualityPatternIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleTogglePattern = (patternId: string) => {
    setSelectedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(patternId)) {
        next.delete(patternId);
      } else {
        next.add(patternId);
      }
      return next;
    });
  };

  const handleStartStudy = () => {
    if (selectedPatterns.size === 0) {
      alert("Please select at least one pattern to study");
      return;
    }

    // Start session with selected pattern IDs - saga will generate cards
    const selectedPatternIds = Array.from(selectedPatterns);
    dispatch(startSessionRequested({ patternIds: selectedPatternIds }));
    navigate("/study");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo/logo.svg" alt="Zeplar logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold tracking-tight">
              Select Patterns to Study
            </h1>
          </div>
          <p className="text-muted-foreground">
            Choose which patterns you want to practice today
          </p>
        </header>

        {/* Selection controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button onClick={handleSelectAll} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={handleClearAll} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedPatterns.size} of {patternList.length} patterns
                  selected
                </span>
                <Button
                  onClick={handleStartStudy}
                  size="lg"
                  disabled={selectedPatterns.size === 0}
                >
                  Start Study Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pattern selection by quality */}
        <div className="space-y-4">
          {Object.entries(patternsByQuality).map(([quality, patterns]) => {
            const allSelected = patterns.every((p) =>
              selectedPatterns.has(p.id),
            );
            const someSelected = patterns.some((p) =>
              selectedPatterns.has(p.id),
            );

            return (
              <Card key={quality}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        onChange={() => handleToggleQuality(quality)}
                        className="w-5 h-5 rounded border-2 cursor-pointer"
                      />
                      <span className="text-2xl">{qualityIcons[quality]}</span>
                      <div>
                        <CardTitle className="capitalize">{quality}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {patterns.length} patterns
                        </p>
                      </div>
                    </div>
                    <Badge className={`${qualityColors[quality]} border-0`}>
                      {
                        patterns.filter((p) => selectedPatterns.has(p.id))
                          .length
                      }{" "}
                      selected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {patterns.map((pattern) => (
                      <label
                        key={pattern.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPatterns.has(pattern.id)}
                          onChange={() => handleTogglePattern(pattern.id)}
                          className="w-4 h-4 rounded border-2 cursor-pointer"
                        />
                        <span className="text-xl">{pattern.concept.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {pattern.concept.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {pattern.concept.tagline}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom action button */}
        <div className="flex justify-center">
          <Button
            onClick={handleStartStudy}
            size="lg"
            className="px-12"
            disabled={selectedPatterns.size === 0}
          >
            Start Study Session ({selectedPatterns.size} patterns)
          </Button>
        </div>
      </div>
    </div>
  );
}
