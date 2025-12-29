import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CardFlip, CardFront, CardBack } from "./Flashcard";
import {
  selectCurrentCardKey,
  selectSessionProgress,
  selectSession,
  submitReviewRequested,
  nextCard,
  endSession,
} from "../learningSlice";
import { selectCardById } from "@/features/patterns/patternsSlice";
import type { Quality } from "@/lib/sm2";

export function StudySession() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAppSelector(selectSession);
  const currentCardKey = useAppSelector(selectCurrentCardKey);
  const progress = useAppSelector(selectSessionProgress);
  const [isFlipped, setIsFlipped] = useState(false);

  // Get card from Redux entities slice
  const currentCard = useAppSelector((state) =>
    currentCardKey ? selectCardById(state, currentCardKey) : null,
  );

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRate = useCallback(
    (quality: Quality) => {
      if (!currentCardKey) return;

      // Dispatch request action - saga handles SM2 calculation and persistence
      dispatch(submitReviewRequested({ cardKey: currentCardKey, quality }));
      setIsFlipped(false);

      // Move to next card or end session
      if (progress.current < progress.total) {
        dispatch(nextCard());
      }
    },
    [dispatch, currentCardKey, progress.current, progress.total],
  );

  const handleEndSession = useCallback(() => {
    dispatch(endSession());
    navigate("/");
  }, [dispatch, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space" && !isFlipped) {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        const keyToQuality: Record<string, Quality> = {
          "1": 0,
          "2": 1,
          "3": 2,
          "4": 3,
          "5": 4,
          "6": 5,
        };
        if (e.key in keyToQuality) {
          handleRate(keyToQuality[e.key]);
        }
      }

      if (e.code === "Escape") {
        handleEndSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleFlip, handleRate, handleEndSession]);

  // Session complete - navigate to summary
  useEffect(() => {
    if (
      !session.isActive &&
      session.results.length > 0 &&
      progress.current > progress.total
    ) {
      navigate("/study/summary");
    }
  }, [
    session.isActive,
    session.results.length,
    progress.current,
    progress.total,
    navigate,
  ]);

  if (!currentCard) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No cards to study</p>
        <Button onClick={handleEndSession} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Card {progress.current} of {progress.total}
          </span>
          <Button variant="ghost" size="sm" onClick={handleEndSession}>
            End Session (Esc)
          </Button>
        </div>
        <Progress value={(progress.completed / progress.total) * 100} />
      </div>

      {/* Flashcard */}
      <CardFlip
        isFlipped={isFlipped}
        front={<CardFront card={currentCard} onFlip={handleFlip} />}
        back={<CardBack card={currentCard} onRate={handleRate} />}
      />
    </div>
  );
}
