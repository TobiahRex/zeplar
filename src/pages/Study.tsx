import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { StudySession } from "@/features/learning/components/StudySession";
import { selectSession, startSession } from "@/features/learning/learningSlice";
import { generateAllL1Cards } from "@/lib/cardGenerator";
import { patternList } from "@/data/patterns";

export default function Study() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);

  // Start session if not active
  useEffect(() => {
    if (!session.isActive) {
      const cards = generateAllL1Cards(patternList);
      const cardKeys = cards.map((c) => c.id);

      if (cardKeys.length > 0) {
        dispatch(startSession(cardKeys));
      }
    }
  }, [dispatch, session.isActive]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Logo header */}
        <header className="flex items-center justify-center gap-3 pb-4">
          <img src="/logo/logo.svg" alt="Zeplar logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold tracking-tight">Zeplar</h1>
        </header>

        <StudySession />
      </div>
    </div>
  );
}
