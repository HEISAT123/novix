import { Link } from 'react-router-dom'
import styles from './ThankYouPage.module.scss'

const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function ThankYouPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.icon} aria-hidden>
          <CheckIcon />
        </div>
        <h1 className={styles.title}>Спасибо за прохождение!</h1>
        <Link to="/" className={styles.homeLink}>На главный</Link>
      </div>
    </div>
  )
}
