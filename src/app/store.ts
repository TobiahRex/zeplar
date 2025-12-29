import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import learningReducer from "@/features/learning/learningSlice";
import explorationReducer from "@/features/exploration/explorationSlice";
import uiReducer from "@/features/ui/uiSlice";
import patternsReducer from "@/features/patterns/patternsSlice";
import { learningSagas } from "@/features/learning/learningSagas";

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    learning: learningReducer,
    exploration: explorationReducer,
    ui: uiReducer,
    patterns: patternsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false, // Disable thunk since we're using sagas
      serializableCheck: {
        // Ignore Date objects in actions and state (used for nextReviewDate, lastReviewDate)
        ignoredActions: [
          "learning/loadProgress",
          "learning/submitReviewSucceeded",
        ],
        ignoredPaths: ["learning.progress"],
      },
    }).concat(sagaMiddleware),
});

// Run sagas
sagaMiddleware.run(learningSagas);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
