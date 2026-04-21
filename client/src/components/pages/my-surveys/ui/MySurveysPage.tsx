import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import activeSurveysIcon from '../../../../assets/activeSurveys.svg'
import totalResponsesIcon from '../../../../assets/totalResponses.svg'
import { useSurveyContext } from '../../../../hooks/useSurveyContext'
import { getResponsesForSurvey } from '../../../../lib/surveysStorage'
import styles from './MySurveysPage.module.scss'

function StatCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statCardIcon} aria-hidden>
        {icon}
      </span>
      <p className={styles.statCardLabel}>{label}</p>
    </div>
  )
}

export default function MySurveysPage() {
  const navigate = useNavigate()
  const { surveys, stats, deleteSurvey } = useSurveyContext()

  const handleDelete = (id: string) => {
    deleteSurvey(id)
  }

  return (
    <div className={styles.page}>
      <section className={styles.statsRow} aria-label="Сводка">
        <StatCard
          icon={
            <img
              src={activeSurveysIcon}
              width={22}
              height={22}
              className={styles.statCardIconImage}
              alt=""
              aria-hidden
            />
          }
          label={`Активных опросов: ${stats.activeSurveys}`}
        />
        <StatCard
          icon={
            <img
              src={totalResponsesIcon}
              width={22}
              height={22}
              className={styles.statCardIconImage}
              alt=""
              aria-hidden
            />
          }
          label={`Всего ответов: ${stats.totalResponses}`}
        />
      </section>

      <section className={styles.surveyGrid} aria-label="Список опросов">
        {surveys.length === 0 ? (
          <p className={styles.emptyHint}>Пока нет опросов. Создайте первый.</p>
        ) : (
          surveys.map((s) => (
            <article
              key={s.id}
              className={styles.surveyCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/edit/${s.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/edit/${s.id}`)
                }
              }}
            >
              <div className={styles.surveyCardHead}>
                <h2 className={styles.surveyCardTitle}>{s.title || 'Без названия'}</h2>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(s.id)
                  }}
                  aria-label="Удалить опрос"
                  title="Удалить опрос"
                >
                  ×
                </button>
              </div>
              <span className={s.status === 'published' ? styles.badgeOk : styles.badgeMuted}>
                {s.status === 'published' ? 'Опубликован' : 'Черновик'}
              </span>
              <p className={styles.surveyCardMeta}>
                {(() => {
                  const n = getResponsesForSurvey(s.id).length
                  return `${n} ${pluralAnswers(n)}`
                })()}
              </p>
            </article>
          ))
        )}
      </section>

      <div className={styles.pageFooterCta}>
        <Link to="/edit/new" className={styles.primaryBtn}>
          Создать опрос
        </Link>
      </div>
    </div>
  )
}

function pluralAnswers(n: number): string {
  const m = n % 100
  const m10 = n % 10
  if (m >= 11 && m <= 14) return 'ответов'
  if (m10 === 1) return 'ответ'
  if (m10 >= 2 && m10 <= 4) return 'ответа'
  return 'ответов'
}
