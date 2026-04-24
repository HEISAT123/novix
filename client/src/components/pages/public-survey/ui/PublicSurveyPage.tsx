import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { loadSurveys } from '../../../../lib/surveysStorage'
import { appendResponse } from '../../../../lib/surveysStorage'
import { validateAnswer, validateSurveyForm, type ValidationError } from '../../../../lib/validation'
import type { AnswersMap } from '../../../../types/survey'
import styles from './PublicSurveyPage.module.scss'

export default function PublicSurveyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const allSurveys = loadSurveys()
  const survey = allSurveys.find((s) => s.id === id)
  const [answers, setAnswers] = useState<AnswersMap>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

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

    // Convert indices to actual option values
    const finalAnswers: AnswersMap = {}
    for (const [qid, value] of Object.entries(answers)) {
      const question = survey.questions.find((q) => q.id === qid)
      if (question?.type === 'single') {
        const index = parseInt(value, 10)
        finalAnswers[qid] = question.options[index] || value
      } else {
        finalAnswers[qid] = value
      }
    }

    const validation = validateSurveyForm(finalAnswers, survey.questions)

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
      appendResponse(survey.id, finalAnswers)
      navigate(`/survey/${survey.id}/thanks`, { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Ошибка при отправке ответов' })
    } finally {
      setIsLoading(false)
    }
  }

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
              <label key={`${opt}-${j}`} className={styles.radioLabel}>
                <input
                  type="radio"
                  name={q.id}
                  value={j.toString()}
                  checked={answers[q.id] === j.toString()}
                  onChange={() => {
                    setAnswer(q.id, j.toString())
                    clearFieldError(q.id)
                  }}
                />
                <span className={styles.radioDot} aria-hidden />
                <span className={styles.radioText}>{opt}</span>
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
