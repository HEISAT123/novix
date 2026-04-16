import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Question, QuestionSingle, QuestionText, Survey } from '../types/survey'
import {
  loadAllResponses,
  loadSurveys,
  persistSurveys,
} from '../lib/surveysStorage'

export type UseSurveysApi = {
  surveys: Survey[]
  refresh: () => void
  upsertSurvey: (survey: { status: string }) => void
  deleteSurvey: (id: string) => void
  stats: {
    activeSurveys: number
    respondents: number
    totalResponses: number
  }
  responsesTick: number
}

export function createEmptyQuestion(type: 'single'): QuestionSingle
export function createEmptyQuestion(type: 'text'): QuestionText
export function createEmptyQuestion(type: 'single' | 'text'): Question {
  const id = crypto.randomUUID()
  if (type === 'single') {
    return {
      id,
      type: 'single',
      text: '',
      options: ['', ''],
    }
  }
  return { id, type: 'text', text: '' }
}

export function createEmptySurvey(): Survey {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    status: 'draft',
    questions: [],
  }
}

export function useSurveys(): UseSurveysApi {
  const [surveys, setSurveys] = useState<Survey[]>(() => loadSurveys())
  const [responsesTick, setResponsesTick] = useState(0)

  useEffect(() => {
    const onChange = () => setResponsesTick((x) => x + 1)
    window.addEventListener('oprosi-responses-changed', onChange)
    return () => window.removeEventListener('oprosi-responses-changed', onChange)
  }, [])

  const refresh = useCallback(() => {
    setSurveys(loadSurveys())
  }, [])

  const upsertSurvey = useCallback((survey: Survey) => {
    setSurveys((prev) => {
      const i = prev.findIndex((s) => s.id === survey.id)
      const next =
        i === -1 ? [...prev, survey] : prev.map((s) => (s.id === survey.id ? survey : s))
      persistSurveys(next)
      return next
    })
  }, [])

  const deleteSurvey = useCallback((id: string) => {
    setSurveys((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persistSurveys(next)
      return next
    })
  }, [])

  const stats = useMemo(() => {
    const published = surveys.filter((s) => s.status === 'published').length
    const all = loadAllResponses()
    let totalResponses = 0
    for (const s of surveys) {
      totalResponses += (all[s.id] ?? []).length
    }
    return {
      activeSurveys: published,
      respondents: totalResponses,
      totalResponses,
    }
  }, [surveys, responsesTick]) // eslint-disable-line react-hooks/exhaustive-deps -- responsesTick: новые ответы

  return {
    surveys,
    refresh,
    upsertSurvey,
    deleteSurvey,
    stats,
    responsesTick,
  }
}
