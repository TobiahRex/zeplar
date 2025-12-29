import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectSession,
  selectProgress,
  selectStats,
  startSessionRequested,
} from "@/features/learning/learningSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAllL1Cards } from "@/lib/cardGenerator";
import { patternList } from "@/data/patterns";

export default function SessionSummary() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const progress = useAppSelector(selectProgress);
  const stats = useAppSelector(selectStats);

  // Redirect if no session completed
  useEffect(() => {
    if (session.isActive || session.results.length === 0) {
      navigate("/dashboard");
    }
  }, [session.isActive, session.results.length, navigate]);

  // Calculate stats
  const cardsReviewed = session.results.length;
  const correctAnswers = session.results.filter((r) => r.quality >= 3).length;
  const accuracyPercent =
    cardsReviewed > 0 ? Math.round((correctAnswers / cardsReviewed) * 100) : 0;

  // Calculate session duration
  const sessionDuration = session.startedAt
    ? Math.round(
        (new Date().getTime() - new Date(session.startedAt).getTime()) /
          1000 /
          60,
      )
    : 0;

  // Count cards due tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const allCards = generateAllL1Cards(patternList);
  const cardsDueTomorrow = allCards.filter((card) => {
    const cardProgress = progress[card.id];
    if (!cardProgress) return true; // New cards count as due

    const nextReview = new Date(cardProgress.nextReviewDate);
    return nextReview <= tomorrow && nextReview > new Date();
  }).length;

  const handleContinueStudying = () => {
    // Saga will generate cards and start session
    dispatch(startSessionRequested());
    navigate("/study");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Logo header */}
        <header className="flex items-center justify-center gap-3 pb-2">
          <img
            src="/logo/logo.svg"
            alt="Zeplar logo"
            className="w-8 h-8 opacity-70"
          />
          <h2 className="text-lg font-semibold opacity-70">Zeplar</h2>
        </header>

        {/* Celebration header */}
        <div className="text-center space-y-2">
          <div className="text-6xl">🎉</div>
          <h1 className="text-4xl font-bold">Session Complete!</h1>
          <p className="text-muted-foreground">
            Great work on your {stats.streak > 0 ? `${stats.streak} day` : ""}{" "}
            learning streak!
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cards Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{cardsReviewed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Correct Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-500">
                {correctAnswers}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {accuracyPercent}% accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Session Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {sessionDuration}
                <span className="text-xl text-muted-foreground ml-1">min</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Due Tomorrow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-500">
                {cardsDueTomorrow}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                cards to review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Layer Unlock Notifications */}
        {(() => {
          // TODO: Track newly unlocked layers during session in learningSlice
          // For now, this is a placeholder that will show when tracking is implemented
          const newlyUnlockedLayers: Array<{
            layer: string;
            patternName: string;
          }> = [];

          return (
            newlyUnlockedLayers.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-lg text-white">
                <h3 className="text-xl font-bold mb-2">
                  🎉 New Layers Unlocked!
                </h3>
                {newlyUnlockedLayers.map((unlock) => (
                  <p key={unlock.layer}>
                    {unlock.patternName} - {unlock.layer}
                  </p>
                ))}
              </div>
            )
          );
        })()}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleContinueStudying} className="flex-1" size="lg">
            Continue Studying
          </Button>
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Streak motivation */}
        {stats.streak > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔥</div>
                <div>
                  <p className="font-semibold">{stats.streak} day streak!</p>
                  <p className="text-sm text-muted-foreground">
                    Keep it up! Come back tomorrow to maintain your streak.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
