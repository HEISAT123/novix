import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SaveSurveyPopup.module.scss'

interface SaveSurveyPopupProps {
  onClose: () => void
}

const SaveSurveyPopup: React.FC<SaveSurveyPopupProps> = ({
  onClose,
}) => {
  const navigate = useNavigate()

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleGoToMain = () => {
    navigate('/')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup}>
        <h2 className={styles.title}>Опрос сохранён!</h2>
      </div>
    </div>
  )
}

export default SaveSurveyPopup
