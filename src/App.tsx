import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { usePersistence } from "@/lib/persistence";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  loadPatterns,
  generateCards,
  selectAllPatterns,
} from "@/features/patterns/patternsSlice";
import { initializeLayerUnlocks } from "@/features/learning/learningSlice";

export default function App() {
  const dispatch = useAppDispatch();
  const patterns = useAppSelector(selectAllPatterns);

  // Hydrate and persist learning state
  usePersistence();

  // Load patterns and generate cards on app initialization
  useEffect(() => {
    dispatch(loadPatterns());
    dispatch(generateCards());
  }, [dispatch]);

  // Initialize layer unlocks for all patterns
  useEffect(() => {
    if (patterns.length > 0) {
      const patternIds = patterns.map((p) => p.id);
      dispatch(initializeLayerUnlocks(patternIds));
    }
  }, [dispatch, patterns]);

  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return <RouterProvider router={router} />;
}
