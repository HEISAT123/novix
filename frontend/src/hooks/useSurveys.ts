import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AnswersMap, Question, QuestionSingle, QuestionText, Survey } from '../types/survey'
import {
  loadAllResponses,
} from '../lib/surveysStorage'
import {
  addQuestion as apiAddQuestion,
  convertApiSurveyToSurvey,
  createSurvey as apiCreateSurvey,
  deleteQuestion as apiDeleteQuestion,
  deleteSurvey as apiDeleteSurvey,
  getResponses as apiGetResponses,
  getSurvey as apiGetSurvey,
  getSurveys as apiGetSurveys,
  publishSurvey as apiPublishSurvey,
  unpublishSurvey as apiUnpublishSurvey,
  submitResponse as apiSubmitResponse,
  updateQuestion as apiUpdateQuestion,
  updateSurvey as apiUpdateSurvey,
  type ResponseItem,
} from '../api/surveysApi'

export type UseSurveysApi = {
  surveys: Survey[]
  isLoading: boolean
  refresh: () => void
  getSurveyById: (id: string) => Promise<Survey | null>
  upsertSurvey: (survey: Survey) => Promise<string>
  publishSurvey: (surveyId: string) => Promise<string>
  unpublishSurvey: (surveyId: string) => Promise<void>
  deleteSurvey: (id: string) => void
  addQuestion: (surveyId: string, question: Question) => Promise<void>
  updateQuestion: (surveyId: string, questionId: string, question: Question) => Promise<void>
  deleteQuestion: (surveyId: string, questionId: string) => Promise<void>
  submitResponse: (surveyId: string, answers: AnswersMap) => Promise<void>
  getResponses: (surveyId: string) => Promise<ResponseItem[]>
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
    public_id: null,
    title: '',
    description: '',
    status: 'draft',
    questions: [],
  }
}

export function useSurveys(): UseSurveysApi {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [responsesTick, setResponsesTick] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const getSurveyById = useCallback(async (id: string): Promise<Survey | null> => {
    try {
      const apiSurvey = await apiGetSurvey(id)
      return convertApiSurveyToSurvey(apiSurvey)
    } catch (error) {
      console.error('Failed to load survey:', error)
      return null
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      const apiSurveys = await apiGetSurveys()
      console.log('API surveys from server:', apiSurveys)
      
      // Загружаем количество ответов для каждого опроса
      const surveysWithCounts = await Promise.all(
        apiSurveys.map(async (s) => {
          try {
            const responses = await apiGetResponses(s.id)
            // Группируем по respondent_session_id для подсчёта уникальных респондентов
            const uniqueRespondents = new Set(responses.map(r => r.respondent_session_id))
            return {
              ...s,
              response_count: uniqueRespondents.size
            }
          } catch (error) {
            console.error(`Failed to load responses for survey ${s.id}:`, error)
            return {
              ...s,
              response_count: 0
            }
          }
        })
      )
      
      const convertedSurveys = surveysWithCounts.map(s => ({
        id: s.id,
        public_id: s.public_id,
        title: s.title,
        description: '',
        status: s.status,
        questions: [],
        response_count: s.response_count
      }))
      console.log('Converted surveys:', convertedSurveys)
      setSurveys(convertedSurveys)
    } catch (error) {
      console.error('Failed to load surveys:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onChange = () => {
      setResponsesTick((x) => x + 1)
      refresh()
    }
    window.addEventListener('oprosi-responses-changed', onChange)
    return () => window.removeEventListener('oprosi-responses-changed', onChange)
  }, [refresh])

  const upsertSurvey = useCallback(async (survey: Survey) => {
    try {
      const isNewSurvey = !survey.public_id
      if (isNewSurvey) {
        const apiSurvey = await apiCreateSurvey({
          title: survey.title,
          description: survey.description,
        })
        const convertedSurvey = convertApiSurveyToSurvey(apiSurvey)
        setSurveys((prev) => [...prev, { ...convertedSurvey, questions: survey.questions }])
        return convertedSurvey.id
      } else {
        await apiUpdateSurvey(survey.id, {
          title: survey.title,
          description: survey.description,
        })
        setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...survey, public_id: s.public_id } : s)))
        return survey.id
      }
    } catch (error) {
      console.error('Failed to upsert survey:', error)
      throw error
    }
  }, [])

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - без вызова refresh()
  const publishSurvey = useCallback(async (surveyId: string): Promise<string> => {
    try {
      console.log('🔵 publishSurvey called with ID:', surveyId);
      const result = await apiPublishSurvey(surveyId)
      console.log('✅ publishSurvey completed');
      // Обновляем список опросов, чтобы получить актуальный public_id
      await refresh()
      return result.public_url
    } catch (error) {
      console.error('Failed to publish survey:', error)
      throw error
    }
  }, [refresh])

  const unpublishSurvey = useCallback(async (surveyId: string): Promise<void> => {
    try {
      await apiUnpublishSurvey(surveyId)
      await refresh()
    } catch (error) {
      console.error('Failed to unpublish survey:', error)
      throw error
    }
  }, [refresh])

  const deleteSurvey = useCallback(async (id: string) => {
    try {
      await apiDeleteSurvey(id)
      setSurveys((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete survey:', error)
    }
  }, [])

  const addQuestion = useCallback(async (surveyId: string, question: Question) => {
    try {
      const options = question.type === 'single' ? question.options : undefined
      await apiAddQuestion(surveyId, {
        text: question.text,
        type: question.type === 'single' ? 'single_choice' : 'text',
        options,
      })
    } catch (error) {
      console.error('Failed to add question:', error)
      throw error
    }
  }, [])

  const updateQuestion = useCallback(async (surveyId: string, questionId: string, question: Question) => {
    try {
      const options = question.type === 'single' ? question.options : undefined
      await apiUpdateQuestion(surveyId, questionId, {
        text: question.text,
        type: question.type === 'single' ? 'single_choice' : 'text',
        options,
      })
    } catch (error) {
      console.error('Failed to update question:', error)
      throw error
    }
  }, [])

  const deleteQuestion = useCallback(async (surveyId: string, questionId: string) => {
    try {
      await apiDeleteQuestion(surveyId, questionId)
    } catch (error) {
      console.error('Failed to delete question:', error)
      throw error
    }
  }, [])

  const submitResponse = useCallback(async (surveyId: string, answers: AnswersMap) => {
    try {
      await apiSubmitResponse(surveyId, { answers })
    } catch (error) {
      console.error('Failed to submit response:', error)
      throw error
    }
  }, [])

  const getResponses = useCallback(async (surveyId: string) => {
    try {
      return await apiGetResponses(surveyId)
    } catch (error) {
      console.error('Failed to get responses:', error)
      return []
    }
  }, [])

  const stats = useMemo(() => {
    const published = surveys.filter((s) => s.status === 'published').length
    const all = loadAllResponses()
    console.log('All responses from localStorage:', all)
    console.log('Surveys:', surveys)
    
    let totalResponses = 0
    for (const s of surveys) {
      const surveyResponses = all[s.id] ?? []
      console.log(`Survey ${s.id} has ${surveyResponses.length} responses`)
      totalResponses += surveyResponses.length
    }
    
    console.log('Total responses:', totalResponses)
    
    return {
      activeSurveys: published,
      respondents: totalResponses,
      totalResponses,
    }
  }, [surveys, responsesTick])

  return {
    surveys,
    isLoading,
    refresh,
    getSurveyById,
    upsertSurvey,
    publishSurvey,
    unpublishSurvey,
    deleteSurvey,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    submitResponse,
    getResponses,
    stats,
    responsesTick,
  }
}

