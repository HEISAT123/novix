import { createContext } from 'react'
import type { UseSurveysApi } from '../hooks/useSurveys'

export const SurveyContext = createContext<UseSurveysApi | null>(null)
