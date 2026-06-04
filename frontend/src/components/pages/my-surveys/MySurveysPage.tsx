import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import activeSurveysIcon from '../../../assets/activeSurveys.svg'
import totalResponsesIcon from '../../../assets/totalResponses.svg'
import { useAuth } from '../../../context/useAuth'
import { useSurveyContext } from '../../../hooks/useSurveyContext'
import { copyTextToClipboard } from '../../../lib/clipboard'
import { withBrand } from '../../../lib/documentTitle'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import styles from './MySurveysPage.module.scss'
import DeleteSurveyPopup from '../../popup/delete-survey-popup/DeleteSurveyPopup'

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
  useDocumentTitle(withBrand('Мои опросы'))
  const navigate = useNavigate()
  const { surveys, stats, deleteSurvey, isLoading } = useSurveyContext()
  const { user } = useAuth()
  const [showAuthMessage, setShowAuthMessage] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrSurveyId, setQrSurveyId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleShowQr = (publicId: string | null, e: React.MouseEvent) => {
    e.stopPropagation()
    if (publicId) {
      setQrSurveyId(publicId)
    }
  }

  const handleCloseQr = () => {
    setQrSurveyId(null)
  }

  const getSurveyLink = (publicId: string) => {
    return `${window.location.origin}/survey/${publicId}`
  }

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteSurvey(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null)
  }

  const handleCopyLink = async (publicId: string | null) => {
    if (!publicId) return
    const link = `${window.location.origin}/survey/${publicId}`
    const ok = await copyTextToClipboard(link)
    if (ok) {
      setCopiedId(publicId)
      setTimeout(() => setCopiedId(null), 2000)
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
          label={`Всего ответов: ${surveys.reduce((sum, s) => sum + (s.response_count || 0), 0)}`}
        />
      </section>

      <section className={styles.surveyGrid} aria-label="Список опросов">
        {isLoading ? (
          <p className={styles.emptyHint}>Загрузка опросов...</p>
        ) : surveys.length === 0 ? (
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
                    <>
                      <button
                        type="button"
                        className={styles.qrBtn}
                        onClick={(e) => handleShowQr(s.public_id, e)}
                        aria-label="Показать QR-код"
                        title="Показать QR-код"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="8" height="8" rx="1" />
                          <rect x="14" y="2" width="8" height="8" rx="1" />
                          <rect x="2" y="14" width="8" height="8" rx="1" />
                          <rect x="14" y="14" width="4" height="4" rx="0.5" />
                          <rect x="20" y="14" width="4" height="4" rx="0.5" />
                          <rect x="14" y="20" width="4" height="4" rx="0.5" />
                          <rect x="20" y="20" width="4" height="4" rx="0.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`${styles.shareBtn} ${copiedId === s.public_id ? styles.shareBtnCopied : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyLink(s.public_id)
                        }}
                        aria-label="Скопировать ссылку"
                        title="Скопировать ссылку"
                      >
                        {copiedId === s.public_id ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteRequest(s.id, e)}
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
                {`${s.response_count || 0} ${pluralAnswers(s.response_count || 0)}`}
              </p>
            </article>
          ))
        )}
      </section>

      {qrSurveyId && (
        <div className={styles.qrOverlay} onClick={handleCloseQr}>
          <div className={styles.qrPopup} onClick={(e) => e.stopPropagation()}>
            <h3>QR-код опроса</h3>
            <div className={styles.qrCode}>
              <QRCodeSVG value={getSurveyLink(qrSurveyId)} size={200} />
            </div>
            <button className={styles.closeQrBtn} onClick={handleCloseQr}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      <DeleteSurveyPopup
        isOpen={!!deleteConfirmId}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

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
