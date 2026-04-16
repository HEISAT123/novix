import { useContext } from 'react'
import { SurveyContext } from '../context/survey-context'
import type { UseSurveysApi } from './useSurveys'

export function useSurveyContext(): UseSurveysApi {
  const ctx = useContext(SurveyContext)
  if (!ctx) {
    throw new Error('useSurveyContext must be used within SurveyProvider')
  }
  return ctx
}
