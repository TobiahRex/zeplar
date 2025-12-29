import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/app/hooks";
import {
  selectStats,
  selectProgress,
  selectActivityByDate,
  selectLayerUnlocks,
} from "@/features/learning/learningSlice";
import { patternList } from "@/data/patterns";
import type { Pattern } from "@/data/schema";
import { ContributionGraph } from "@/components/ContributionGraph";
import { MasteryBreakdown } from "@/components/MasteryBreakdown";
import { PatternCardModal } from "@/components/PatternCardModal";
import { generateAllL1Cards } from "@/lib/cardGenerator";
import { getMasteryPercentage } from "@/lib/sm2";

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

// Color mapping for strategy badges
const strategyColors: Record<string, string> = {
  "Fault Tolerance": "bg-indigo-500/20 text-indigo-400",
  "Work Reduction": "bg-orange-500/20 text-orange-400",
  "Work Scheduling": "bg-pink-500/20 text-pink-400",
  Redundancy: "bg-teal-500/20 text-teal-400",
  Recovery: "bg-emerald-500/20 text-emerald-400",
  "Availability Monitoring": "bg-purple-500/20 text-purple-400",
  "Distributed Transactions": "bg-violet-500/20 text-violet-400",
  "Event Reliability": "bg-cyan-500/20 text-cyan-400",
  "Flow Control": "bg-yellow-500/20 text-yellow-400",
  "Overload Protection": "bg-red-500/20 text-red-400",
  "Query Optimization": "bg-blue-500/20 text-blue-400",
  "Rate Control": "bg-fuchsia-500/20 text-fuchsia-400",
  "Safe Retries": "bg-lime-500/20 text-lime-400",
  "State Management": "bg-rose-500/20 text-rose-400",
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
  "Data Access Patterns": "bg-blue-500/20 text-blue-400",
  "Data Integrity": "bg-teal-500/20 text-teal-400",
  Degradation: "bg-orange-500/20 text-orange-400",
  "Event-Driven Architecture": "bg-purple-500/20 text-purple-400",
  "Load Management": "bg-red-500/20 text-red-400",
  Monitoring: "bg-cyan-500/20 text-cyan-400",
  "Stream Processing": "bg-indigo-500/20 text-indigo-400",
  "Traffic Management": "bg-pink-500/20 text-pink-400",
  "Transaction Management": "bg-emerald-500/20 text-emerald-400",
  "Transactional Messaging": "bg-amber-500/20 text-amber-400",
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
  const activityByDate = useAppSelector(selectActivityByDate);
  const layerUnlocks = useAppSelector(selectLayerUnlocks);

  // Modal state for pattern card viewer
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePatternClick = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setIsModalOpen(true);
  };

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

  // Group patterns by quality for accordion navigation
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

  // Calculate unique patterns studied in last year
  const patternsStudiedLastYear = Object.values(progress)
    .filter((cardProgress) => {
      if (!cardProgress.lastReviewDate) return false;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return new Date(cardProgress.lastReviewDate) >= oneYearAgo;
    })
    .reduce((patterns, cardProgress) => {
      patterns.add(cardProgress.patternId);
      return patterns;
    }, new Set<string>()).size;

  // Calculate total cards reviewed in last year
  const totalCardsLastYear = Object.values(activityByDate).reduce(
    (sum, count) => sum + count,
    0,
  );

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
              <CardTitle>Start Studying</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {cardsDue} cards due today
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link to="/study" className="block">
                  <Button className="w-full" size="lg">
                    <span className="text-lg">🎯</span>
                    <span className="ml-2">Study All Patterns</span>
                  </Button>
                </Link>
                <Link to="/select" className="block">
                  <Button className="w-full" variant="outline" size="lg">
                    <span className="text-lg">✨</span>
                    <span className="ml-2">Choose Specific Patterns</span>
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Select patterns to customize your study session
                </p>
              </div>
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

        {/* Activity Contribution Graph */}
        <Card>
          <CardContent className="pt-6">
            <ContributionGraph
              activityByDate={activityByDate}
              patternsStudied={patternsStudiedLastYear}
              totalCards={totalCardsLastYear}
            />
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

        {/* Pattern Mastery by Layer - Collapsed by default */}
        <Card>
          <CardHeader>
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none">
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <CardTitle>
                  Layer-by-Layer Progression ({patternList.length} patterns)
                </CardTitle>
              </summary>
              <p className="text-sm text-muted-foreground mt-2 ml-6">
                Track your L1, L2, and L3 mastery for each pattern
              </p>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patternList.map((pattern) => {
                    const layerStatus = layerUnlocks[pattern.id];
                    if (!layerStatus) return null;

                    return (
                      <MasteryBreakdown
                        key={pattern.id}
                        patternId={pattern.id}
                        patternName={pattern.concept.name}
                        patternEmoji={pattern.concept.emoji}
                        family={pattern.hierarchy.family}
                        layerUnlocks={layerStatus}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </details>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Pattern Library ({patternList.length} patterns)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Patterns organized by system quality - expand to explore
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(patternsByQuality).map(([quality, patterns]) => (
              <details key={quality} className="group">
                <summary className="flex items-center justify-between p-4 rounded-lg border bg-card cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{qualityIcons[quality]}</span>
                    <div>
                      <h3 className="font-semibold capitalize">{quality}</h3>
                      <p className="text-sm text-muted-foreground">
                        {patterns.length} patterns
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 transition-transform group-open:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </summary>

                <div className="mt-2 ml-4 space-y-3 pb-2">
                  {patterns.map((pattern) => {
                    const mastery = getPatternMastery(pattern.id);
                    const { strategy, family } = pattern.hierarchy;

                    return (
                      <div
                        key={pattern.id}
                        className="p-4 rounded-lg border bg-card space-y-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handlePatternClick(pattern)}
                      >
                        {/* Top row: emoji, name, mastery */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {pattern.concept.emoji}
                            </span>
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
                            className={`${strategyColors[strategy] || "bg-slate-500 text-white"} border-0 text-xs`}
                          >
                            {strategy}
                          </Badge>
                          <Badge
                            className={`${familyColors[family] || "bg-gray-500 text-white"} border-0 text-xs`}
                          >
                            {family}
                          </Badge>
                          {pattern.difficulty && (
                            <Badge
                              className={`${difficultyColors[pattern.difficulty]} border-0 text-xs`}
                            >
                              {pattern.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pattern Card Modal */}
      <PatternCardModal
        pattern={selectedPattern}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
