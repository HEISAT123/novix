export const APP_NAME = 'NovixVote'

export function withBrand(page: string): string {
  return `${page} · ${APP_NAME}`
}

export function surveyTitleOnly(title: string | undefined | null, fallback = 'Опрос'): string {
  const trimmed = title?.trim()
  return trimmed || fallback
}

export function surveyWithSuffix(
  title: string | undefined | null,
  suffix: string,
  fallback = 'Опрос',
): string {
  return `${surveyTitleOnly(title, fallback)} · ${suffix}`
}
