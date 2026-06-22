import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { convertApiSurveyToSurvey, getPublicSurvey } from '../../../api/surveysApi'
import { surveyTitleOnly } from '../../../lib/documentTitle'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { Survey } from '../../../types/survey'
import styles from './ThankYouPage.module.scss'

const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface PageText {
  text: string,
  withLink?: boolean,
  withIcon?: boolean
}

export default function ThankYouPage({text = 'Спасибо за прохождение!', withLink = true, withIcon = true}: PageText) {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)

  useDocumentTitle(survey ? surveyTitleOnly(survey.title) : 'Опрос')

  useEffect(() => {
    const loadSurvey = async () => {
      if (!id) return

      try {
        const apiSurvey = await getPublicSurvey(id)
        setSurvey(convertApiSurveyToSurvey(apiSurvey))
      } catch (error) {
        console.error('Failed to load survey for thank-you page:', error)
        setSurvey(null)
      }
    }
    loadSurvey()
  }, [id])

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        {withIcon === true && (
        <div className={styles.icon} aria-hidden>
          <CheckIcon />
        </div>)}
        <h1 className={styles.title}>{text}</h1>
        {withLink === true && (<Link to="/" className={styles.homeLink}>На главный</Link>)}
      </div>
    </div>
  )
}
