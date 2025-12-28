import { configureStore } from '@reduxjs/toolkit'
import learningReducer from '@/features/learning/learningSlice'
import explorationReducer from '@/features/exploration/explorationSlice'
import uiReducer from '@/features/ui/uiSlice'
import patternsReducer from '@/features/patterns/patternsSlice'

export const store = configureStore({
  reducer: {
    learning: learningReducer,
    exploration: explorationReducer,
    ui: uiReducer,
    patterns: patternsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
