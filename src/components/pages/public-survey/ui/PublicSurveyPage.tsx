import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSurveyContext } from '../../../../hooks/useSurveyContext'
import { appendResponse } from '../../../../lib/surveysStorage'
import type { AnswersMap } from '../../../../types/survey'
import styles from './PublicSurveyPage.module.scss'

export default function PublicSurveyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { surveys } = useSurveyContext()
  const survey = useMemo(() => surveys.find((s) => s.id === id), [surveys, id])
  const [answers, setAnswers] = useState<AnswersMap>({})

  const setAnswer = (qid: string, value: string) => {
    setAnswers((a) => ({ ...a, [qid]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!survey) return
    appendResponse(survey.id, answers)
    navigate(`/survey/${survey.id}/thanks`, { replace: true })
  }

  if (!survey) return <div className={styles.note}><Link to="/">Опрос не найден. На главную</Link></div>
  if (survey.status !== 'published') return <div className={styles.note}><Link to="/">Опрос не опубликован. На главную</Link></div>

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>{survey.title}</h1>
        {survey.description && <p className={styles.desc}>{survey.description}</p>}
        {survey.questions.map((q, i) => (
          <div key={q.id} className={styles.question}>
            <p className={styles.qText}>Вопрос {i + 1}. "{q.text || '…'}"</p>
            {q.type === 'single' && q.options.map((opt, j) => (
              <label key={`${opt}-${j}`} className={styles.radioLabel}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswer(q.id, opt)}
                  required
                />
                <span className={styles.radioDot} aria-hidden />
                <span className={styles.radioText}>{opt}</span>
              </label>
            ))}
            {q.type === 'text' && (
              <input
                className={styles.input}
                required
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Введите ответ…"
              />
            )}
          </div>
        ))}
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn}>Отправить</button>
        </div>
      </form>
    </div>
  )
}
