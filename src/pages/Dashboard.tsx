import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/app/hooks";
import {
  selectStats,
  selectProgress,
  selectLayerUnlocks,
} from "@/features/learning/learningSlice";
import { patternList } from "@/data/patterns";
import { MasteryBreakdown } from "@/components/MasteryBreakdown";
import { generateAllL1Cards } from "@/lib/cardGenerator";
import { getMasteryPercentage } from "@/lib/sm2";
import { getRecentSessions } from "@/lib/db";

// Color mapping for quality badges
const qualityColors: Record<string, string> = {
  performance: "bg-amber-500/20 text-amber-400",
  reliability: "bg-blue-500/20 text-blue-400",
  scalability: "bg-green-500/20 text-green-400",
  security: "bg-red-500/20 text-red-400",
  observability: "bg-purple-500/20 text-purple-400",
  maintainability: "bg-cyan-500/20 text-cyan-400",
};

// Color mapping for strategy badges
const strategyColors: Record<string, string> = {
  "Fault Tolerance": "bg-indigo-500/20 text-indigo-400",
  "Work Reduction": "bg-orange-500/20 text-orange-400",
  "Work Scheduling": "bg-pink-500/20 text-pink-400",
  Redundancy: "bg-teal-500/20 text-teal-400",
  Recovery: "bg-emerald-500/20 text-emerald-400",
};

// Color mapping for family badges
const familyColors: Record<string, string> = {
  "Circuit Breakers": "bg-rose-500/20 text-rose-400",
  Retries: "bg-sky-500/20 text-sky-400",
  "Retry Strategies": "bg-sky-500/20 text-sky-400",
  Caching: "bg-lime-500/20 text-lime-400",
  Bulkheads: "bg-violet-500/20 text-violet-400",
  Timeouts: "bg-fuchsia-500/20 text-fuchsia-400",
  "Flow Control": "bg-yellow-500/20 text-yellow-400",
};

// Difficulty colors
const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-red-500/20 text-red-400",
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

export default function Dashboard() {
  const stats = useAppSelector(selectStats);
  const progress = useAppSelector(selectProgress);
  const layerUnlocks = useAppSelector(selectLayerUnlocks);
  const [heatmapData, setHeatmapData] = useState<number[]>([]);

  // Calculate cards due
  const allCards = generateAllL1Cards(patternList);
  const now = new Date();
  const cardsDue = allCards.filter((card) => {
    const cardProgress = progress[card.id];
    if (!cardProgress) return true; // New cards are "due"
    return new Date(cardProgress.nextReviewDate) <= now;
  }).length;

  // Calculate pattern mastery
  const getPatternMastery = (patternId: string) => {
    const patternCards = allCards.filter((c) => c.patternId === patternId);
    if (patternCards.length === 0) return 0;

    const total = patternCards.reduce((sum, card) => {
      return sum + getMasteryPercentage(progress[card.id]);
    }, 0);

    return Math.round(total / patternCards.length);
  };

  // Group patterns by quality for summary
  const qualityCounts = patternList.reduce(
    (acc, p) => {
      acc[p.hierarchy.quality] = (acc[p.hierarchy.quality] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Load 7-day heatmap data from IndexedDB
  useEffect(() => {
    async function loadHeatmap() {
      const sessions = await getRecentSessions(30); // Get more than needed

      // Get last 7 days
      const last7Days: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        // Count cards reviewed on this day
        const dayCount = sessions
          .filter((s) => s.startedAt.split("T")[0] === dateStr)
          .reduce((sum, s) => sum + s.cardsReviewed, 0);

        last7Days.push(dayCount);
      }

      setHeatmapData(last7Days);
    }

    loadHeatmap();
  }, []);

  // Fire emoji scaling based on streak
  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return "";
    if (streak < 3) return "🔥";
    if (streak < 7) return "🔥🔥";
    if (streak < 14) return "🔥🔥🔥";
    return "🔥🔥🔥🔥";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo/logo.svg" alt="Zeplar logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold tracking-tight">Zeplar</h1>
          </div>
          <p className="text-muted-foreground">
            Master software patterns through spaced repetition
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cards Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{cardsDue}</p>
              <Link to="/study">
                <Button className="mt-4 w-full" size="lg">
                  Start Study Session
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Streak</span>
                <span className="font-bold">
                  {getStreakEmoji(stats.streak)} {stats.streak} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Reviews</span>
                <span className="font-bold">{stats.totalReviews}</span>
              </div>
              {stats.lastStudyDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Study</span>
                  <span className="font-bold">{stats.lastStudyDate}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 7-day heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center">
              {heatmapData.map((count, index) => {
                // Determine color based on count
                let bgColor = "bg-muted"; // 0 cards
                if (count >= 6) bgColor = "bg-blue-600";
                else if (count >= 1) bgColor = "bg-blue-400";

                // Get day label
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dayLabel = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });

                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 h-10 rounded ${bgColor} flex items-center justify-center text-xs font-semibold ${count === 0 ? "text-muted-foreground" : "text-white"}`}
                      title={`${count} cards reviewed`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quality summary badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(qualityCounts).map(([quality, count]) => (
            <Badge
              key={quality}
              className={`${qualityColors[quality]} border-0 px-3 py-1.5 text-sm`}
            >
              {qualityIcons[quality]} {quality} ({count})
            </Badge>
          ))}
        </div>

        {/* Pattern Mastery by Layer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Pattern Mastery by Layer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patternList.map((pattern) => {
              const layerStatus = layerUnlocks[pattern.id];
              if (!layerStatus) return null;

              return (
                <MasteryBreakdown
                  key={pattern.id}
                  patternId={pattern.id}
                  patternName={pattern.concept.name}
                  layerUnlocks={layerStatus}
                />
              );
            })}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>
              Pattern Library ({patternList.length} patterns)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patternList.map((pattern) => {
              const mastery = getPatternMastery(pattern.id);
              const { quality, strategy, family } = pattern.hierarchy;

              return (
                <div
                  key={pattern.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  {/* Top row: emoji, name, mastery */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pattern.concept.emoji}</span>
                      <div>
                        <h3 className="font-semibold">
                          {pattern.concept.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {pattern.concept.tagline}
                        </p>
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <Progress value={mastery} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {mastery}% mastery
                      </p>
                    </div>
                  </div>

                  {/* Bottom row: hierarchy badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={`${qualityColors[quality]} border-0 text-xs`}
                    >
                      {qualityIcons[quality]} {quality}
                    </Badge>
                    <Badge
                      className={`${strategyColors[strategy] || "bg-slate-500 text-white"} border-0 text-xs`}
                    >
                      {strategy}
                    </Badge>
                    <Badge
                      className={`${familyColors[family] || "bg-gray-500 text-white"} border-0 text-xs`}
                    >
                      {family}
                    </Badge>
                    <Badge
                      className={`${difficultyColors[pattern.difficulty]} border-0 text-xs`}
                    >
                      {pattern.difficulty}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
