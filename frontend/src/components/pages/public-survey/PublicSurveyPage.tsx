import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPublicSurvey, submitPublicResponse } from '../../../api/surveysApi'
import { convertApiSurveyToSurvey } from '../../../api/surveysApi'
import { validateAnswer, validateSurveyForm, type ValidationError } from '../../../lib/validation'
import { appendResponse } from '../../../lib/surveysStorage'
import type { AnswersMap, Survey } from '../../../types/survey'
import styles from './PublicSurveyPage.module.scss'

export default function PublicSurveyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSurveyLoading, setIsSurveyLoading] = useState(true)
  const [answers, setAnswers] = useState<AnswersMap>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadSurvey = async () => {
      if (!id) return

      setIsSurveyLoading(true)
      try {
        const apiSurvey = await getPublicSurvey(id)
        setSurvey(convertApiSurveyToSurvey(apiSurvey))
      } catch (error) {
        console.error('Failed to load public survey:', error)
        setSurvey(null)
      } finally {
        setIsSurveyLoading(false)
      }
    }
    loadSurvey()
  }, [id])

  const setAnswer = (qid: string, value: string) => {
    setAnswers((a) => ({ ...a, [qid]: value }))
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return errors[fieldName]
  }

  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const handleFieldBlur = (questionId: string, value: string, questionType: string) => {
    if (!value) return

    if (questionType === 'text') {
      const error = validateAnswer(value, questionId)
      if (error) {
        setErrors((prev) => ({ ...prev, [questionId]: error.message }))
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!survey) return

    setErrors({})

    const validation = validateSurveyForm(answers, survey.questions)

    if (!validation.isValid) {
      const errorsMap: Record<string, string> = {}
      validation.errors.forEach((err: ValidationError) => {
        errorsMap[err.field] = err.message
      })
      setErrors(errorsMap)
      return
    }

    setIsLoading(true)

    try {
      await submitPublicResponse(survey.public_id, { answers })
      // Сохраняем ответ в localStorage для статистики
      appendResponse(survey.id, answers)
      // Отправляем событие для обновления статистики
      window.dispatchEvent(new Event('oprosi-responses-changed'))
      navigate(`/survey/${survey.public_id}/thanks`, { replace: true })
    } catch (err) {
      let errorMessage = 'Ошибка при отправке ответов'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message)
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      setErrors({ form: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSurveyLoading) return <div className={styles.note}>Загрузка…</div>
  if (!survey) return <div className={styles.note}><Link to="/">Опрос не найден. На главную</Link></div>
  if (survey.status !== 'published') return <div className={styles.note}><Link to="/">Опрос не опубликован. На главную</Link></div>

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>{survey.title}</h1>
        {survey.description && <p className={styles.desc}>{survey.description}</p>}

        {errors.form && <div className={styles.error}>{errors.form}</div>}

        {survey.questions.map((q, i) => (
          <div key={q.id} className={styles.question}>
            <p className={styles.qText}>Вопрос {i + 1}. "{q.text || '…'}"</p>
            {q.type === 'single' && q.options.map((opt, j) => (
              <label key={`${opt.id}-${j}`} className={styles.radioLabel}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => {
                    setAnswer(q.id, opt.id)
                    clearFieldError(q.id)
                  }}
                />
                <span className={styles.radioDot} aria-hidden />
                <span className={styles.radioText}>{opt.text}</span>
              </label>
            ))}
            {q.type === 'single' && getFieldError(q.id) && <span className={styles.fieldError}>{getFieldError(q.id)}</span>}
            {q.type === 'text' && (
              <input
                className={styles.input}
                value={answers[q.id] ?? ''}
                onChange={(e) => {
                  setAnswer(q.id, e.target.value)
                  clearFieldError(q.id)
                }}
                onBlur={() => handleFieldBlur(q.id, answers[q.id] || '', q.type)}
                placeholder="Введите ответ…"
              />
            )}
            {q.type === 'text' && getFieldError(q.id) && <span className={styles.fieldError}>{getFieldError(q.id)}</span>}
          </div>
        ))}
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>
    </div>
  )
}
