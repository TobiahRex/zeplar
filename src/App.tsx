import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { usePersistence } from '@/lib/persistence'
import { useAppDispatch } from '@/app/hooks'
import { loadPatterns, generateCards } from '@/features/patterns/patternsSlice'

export default function App() {
  const dispatch = useAppDispatch()

  // Hydrate and persist learning state
  usePersistence()

  // Load patterns and generate cards on app initialization
  useEffect(() => {
    dispatch(loadPatterns())
    dispatch(generateCards())
  }, [dispatch])

  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return <RouterProvider router={router} />
}
