import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import activeSurveysIcon from '../../../../assets/activeSurveys.svg'
import totalResponsesIcon from '../../../../assets/totalResponses.svg'
import { useAuth } from '../../../../context/useAuth'
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
  const { user } = useAuth()
  const [showAuthMessage, setShowAuthMessage] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    deleteSurvey(id)
  }

  const handleCopyLink = async (publicId: string | null) => {
    console.log('handleCopyLink called with publicId:', publicId)
    if (!publicId) {
      console.error('publicId is null or undefined')
      return
    }
    try {
      const link = `${window.location.origin}/survey/${publicId}`
      console.log('Copying link:', link)
      await navigator.clipboard.writeText(link)
      setCopiedId(publicId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleCreateSurveyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault()
      setShowAuthMessage(true)
      setTimeout(() => setShowAuthMessage(false), 3000)
    }
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
                <div className={styles.surveyCardActions}>
                  {s.status === 'published' && s.public_id && (
                    <button
                      type="button"
                      className={styles.shareBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('Button clicked, public_id:', s.public_id)
                        handleCopyLink(s.public_id)
                      }}
                      aria-label="Скопировать ссылку"
                      title="Скопировать ссылку"
                    >
                      {copiedId === s.public_id ? '✓' : '🔗'}
                    </button>
                  )}
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
        <Link to="/edit/new" className={styles.primaryBtn} onClick={handleCreateSurveyClick}>
          Создать опрос
        </Link>
        {showAuthMessage && !user && (
          <p className={styles.authMessage}>Если хотите создать опрос, зарегистрируйтесь</p>
        )}
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
