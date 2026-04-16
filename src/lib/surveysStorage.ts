import type { AnswersMap, Survey, SurveyResponseRow } from '../types/survey'

const SURVEYS_KEY = 'oprosi_surveys_v1'
const RESPONSES_KEY = 'oprosi_responses_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadSurveys(): Survey[] {
  return readJson<Survey[]>(SURVEYS_KEY, [])
}

export function persistSurveys(surveys: Survey[]): void {
  localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys))
}

export function loadAllResponses(): Record<string, SurveyResponseRow[]> {
  return readJson<Record<string, SurveyResponseRow[]>>(RESPONSES_KEY, {})
}

export function getResponsesForSurvey(surveyId: string): SurveyResponseRow[] {
  const all = loadAllResponses()
  return all[surveyId] ?? []
}

export function appendResponse(
  surveyId: string,
  answers: AnswersMap,
): SurveyResponseRow {
  const all = loadAllResponses()
  const list = all[surveyId] ?? []
  const row: SurveyResponseRow = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    answers,
  }
  list.push(row)
  all[surveyId] = list
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent('oprosi-responses-changed'))
  return row
}
