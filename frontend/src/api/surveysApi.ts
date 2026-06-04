import { get, post, put, del } from '../lib/apiClient'
import type { AnswersMap, Question, Survey } from '../types/survey'

export interface SurveyListItem {
  id: string
  public_id: string | null
  title: string
  status: 'draft' | 'published'
}

export interface SurveyDetail extends Survey {
  public_id: string | null
  created_at: string
}

export interface CreateSurveyRequest {
  title: string
  description?: string
}

export interface UpdateSurveyRequest {
  title: string
  description?: string
}

export interface AddQuestionRequest {
  text: string
  type: 'single_choice' | 'text'
  options?: string[]
}

export interface UpdateQuestionRequest {
  text: string
  type: 'single_choice' | 'text'
  options?: string[]
}

export interface SubmitResponseRequest {
  answers: AnswersMap
}

export interface ResponseItem {
  question_id: string
  respondent_session_id: string
  answer: string | null
  selected_option_id?: string | null
  created_at: string | null
}

export interface QuestionOption {
  id: string
  text: string
}

export interface ApiQuestion {
  id: string
  text: string
  type: 'single_choice' | 'text'
  order_index: number
  options?: QuestionOption[]
}

export interface ApiSurveyDetail {
  id: string
  public_id: string | null
  title: string
  description: string
  status?: 'draft' | 'published'
  created_at?: string
  questions?: ApiQuestion[]
}

export async function getSurveys(): Promise<SurveyListItem[]> {
  return get<SurveyListItem[]>('/surveys/')
}

export async function getSurvey(surveyId: string): Promise<ApiSurveyDetail> {
  return get<ApiSurveyDetail>(`/surveys/${surveyId}`)
}

export async function createSurvey(data: CreateSurveyRequest): Promise<ApiSurveyDetail> {
  return post<ApiSurveyDetail>('/surveys/', data)
}

export async function updateSurvey(surveyId: string, data: UpdateSurveyRequest): Promise<{ message: string }> {
  return put<{ message: string }>(`/surveys/${surveyId}`, data)
}

export async function deleteSurvey(surveyId: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/surveys/${surveyId}`)
}

export async function publishSurvey(surveyId: string): Promise<{ message: string; public_url: string }> {
  return post<{ message: string; public_url: string }>(`/surveys/${surveyId}/publish`, {})
}

export async function unpublishSurvey(surveyId: string): Promise<{ message: string }> {
  return post<{ message: string }>(`/surveys/${surveyId}/unpublish`, {})
}

export async function addQuestion(surveyId: string, data: AddQuestionRequest): Promise<{ message: string; question: ApiQuestion }> {
  return post<{ message: string; question: ApiQuestion }>(`/surveys/${surveyId}/questions`, data)
}

export async function updateQuestion(surveyId: string, questionId: string, data: UpdateQuestionRequest): Promise<{ message: string; question: ApiQuestion }> {
  return put<{ message: string; question: ApiQuestion }>(`/surveys/${surveyId}/questions/${questionId}`, data)
}

export async function deleteQuestion(surveyId: string, questionId: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/surveys/${surveyId}/questions/${questionId}`)
}

export async function submitResponse(surveyId: string, data: SubmitResponseRequest): Promise<{ message: string }> {
  return post<{ message: string }>(`/surveys/${surveyId}/responses`, data)
}

export async function getResponses(surveyId: string): Promise<ResponseItem[]> {
  return get<ResponseItem[]>(`/surveys/${surveyId}/responses`)
}

export async function getPublicSurvey(publicId: string): Promise<ApiSurveyDetail> {
  return get<ApiSurveyDetail>(`/surveys/public/${publicId}`)
}

export async function submitPublicResponse(publicId: string, data: SubmitResponseRequest): Promise<{ message: string }> {
  return post<{ message: string }>(`/surveys/public/${publicId}/responses`, data)
}

function convertApiQuestionToQuestion(apiQuestion: ApiQuestion): Question {
  if (apiQuestion.type === 'single_choice') {
    return {
      id: apiQuestion.id,
      type: 'single',
      text: apiQuestion.text,
      options: (apiQuestion.options || []).map(opt => ({
        id: opt.id,
        text: opt.text,
      })),
    }
  }
  return {
    id: apiQuestion.id,
    type: 'text',
    text: apiQuestion.text,
  }
}

export function convertApiSurveyToSurvey(apiSurvey: ApiSurveyDetail): Survey {
  return {
    id: apiSurvey.id,
    public_id: apiSurvey.public_id,
    title: apiSurvey.title,
    description: apiSurvey.description,
    status: apiSurvey.status || 'published',
    created_at: apiSurvey.created_at || new Date().toISOString(),
    questions: (apiSurvey.questions || []).map(convertApiQuestionToQuestion),
  }
}