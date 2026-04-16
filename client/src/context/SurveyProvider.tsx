import type { ReactNode } from 'react'
import { SurveyContext } from './survey-context'
import { useSurveys } from '../hooks/useSurveys'

type Props = { children: ReactNode }

export function SurveyProvider({ children }: Props) {
  const value = useSurveys()
  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  )
}
