import React from 'react'
import styles from './DeleteSurveyPopup.module.scss'

interface DeleteSurveyPopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteSurveyPopup: React.FC<DeleteSurveyPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Удалить опрос?</h3>
        <p className={styles.description}>Это действие нельзя отменить.</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.deleteBtn} onClick={onConfirm}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteSurveyPopup
