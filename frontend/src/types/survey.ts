export type SurveyStatus = 'draft' | 'published'

export type QuestionOption = {
  id: string
  text: string
}

export type QuestionSingle = {
  id: string
  type: 'single'
  text: string
  options: QuestionOption[]
}

export type QuestionText = {
  id: string
  type: 'text'
  text: string
}

export type Question = QuestionSingle | QuestionText

export type Survey = {
  id: string
  public_id: string | null
  title: string
  description: string
  status: SurveyStatus
  created_at?: string
  questions: Question[]
  response_count?: number
}

export type SurveyResponseRow = {
  id: string
  submittedAt: string
  answers: Record<string, string>
}

// AnswersMap: для single_choice отправляем option.id, для text - строку
export type AnswersMap = Record<string, string>
