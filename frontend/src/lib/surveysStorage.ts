import type { AnswersMap, SurveyResponseRow } from '../types/survey'

const RESPONSES_KEY = 'oprosi_responses_v1'

// Функция для генерации UUID (альтернатива crypto.randomUUID для старых браузеров)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
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
    id: generateUUID(),
    submittedAt: new Date().toISOString(),
    answers,
  }
  list.push(row)
  all[surveyId] = list
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent('oprosi-responses-changed'))
  return row
}
