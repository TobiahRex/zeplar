import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { StudySession } from "@/features/learning/components/StudySession";
import {
  selectSession,
  startSessionRequested,
} from "@/features/learning/learningSlice";

export default function Study() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);

  // Start session if not active (saga handles card generation)
  useEffect(() => {
    if (!session.isActive) {
      dispatch(startSessionRequested());
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
