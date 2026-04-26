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
  upsertSurvey: (survey: Survey) => void
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

export function createEmptySurvey(userId: string | null = null): Survey {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    status: 'draft',
    questions: [],
    userId,
  }
}

export function useSurveys(currentUserId: string | null): UseSurveysApi {
  const [allSurveys, setAllSurveys] = useState<Survey[]>(() => loadSurveys())
  const [responsesTick, setResponsesTick] = useState(0)

  const surveys = useMemo(() => {
    if (!currentUserId) return []
    return allSurveys.filter((s) => s.userId === currentUserId)
  }, [allSurveys, currentUserId])

  useEffect(() => {
    const onChange = () => setResponsesTick((x) => x + 1)
    window.addEventListener('oprosi-responses-changed', onChange)
    return () => window.removeEventListener('oprosi-responses-changed', onChange)
  }, [])

  useEffect(() => {
    setAllSurveys(loadSurveys())
  }, [currentUserId])

  const refresh = useCallback(() => {
    setAllSurveys(loadSurveys())
  }, [])

  const upsertSurvey = useCallback((survey: Survey) => {
    setAllSurveys((prev) => {
      const i = prev.findIndex((s) => s.id === survey.id)
      const next =
        i === -1 ? [...prev, survey] : prev.map((s) => (s.id === survey.id ? survey : s))
      persistSurveys(next)
      return next
    })
  }, [])

  const deleteSurvey = useCallback((id: string) => {
    setAllSurveys((prev) => {
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
