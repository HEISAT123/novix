import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { copyTextToClipboard } from '../../../lib/clipboard'
import styles from './PublishSurveyPopup.module.scss'

interface PublishSurveyPopupProps {
  surveyLink: string
  onClose: () => void
}

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const PublishSurveyPopup: React.FC<PublishSurveyPopupProps> = ({
  surveyLink,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(surveyLink)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Ваша ссылка:</h2>
        <input
          type="text"
          value={surveyLink}
          readOnly
          className={styles.linkInput}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button type="button" onClick={handleCopyLink} className={styles.copyButton}>
          <CopyIcon />
          <span>{copied ? 'Скопировано!' : 'Скопировать ссылку'}</span>
        </button>
        <div className={styles.qrCode}>
          <QRCodeSVG value={surveyLink} size={160} />
        </div>
      </div>
    </div>
  )
}

export default PublishSurveyPopup
