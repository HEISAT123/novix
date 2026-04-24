import type { ReactNode } from 'react'
import { useAuth } from './useAuth'
import { SurveyContext } from './survey-context'
import { useSurveys } from '../hooks/useSurveys'

type Props = { children: ReactNode }

export function SurveyProvider({ children }: Props) {
  const { user } = useAuth()
  const value = useSurveys(user?.id ?? null)
  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  )
}
