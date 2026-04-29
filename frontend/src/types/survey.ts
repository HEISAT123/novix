export type SurveyStatus = 'draft' | 'published'

export type QuestionSingle = {
  id: string
  type: 'single'
  text: string
  options: string[]
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

export type AnswersMap = Record<string, string>
