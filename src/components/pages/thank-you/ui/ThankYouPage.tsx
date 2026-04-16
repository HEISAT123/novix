import { Link } from 'react-router-dom'
import styles from './ThankYouPage.module.scss'

export default function ThankYouPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.icon} aria-hidden>
          ✓
        </div>
        <h1 className={styles.title}>Спасибо за прохождение!</h1>
        <Link to="/" className={styles.homeLink}>На главную</Link>
      </div>
    </div>
  )
}
