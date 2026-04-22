import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSurveyContext } from '../../../../hooks/useSurveyContext'
import { getResponsesForSurvey } from '../../../../lib/surveysStorage'
import type { QuestionSingle, SurveyResponseRow } from '../../../../types/survey'
import styles from './ResultsPage.module.scss'

const BAR_COLORS = ['var(--bar-1)', 'var(--bar-2)', 'var(--bar-3)', 'var(--bar-4)']

const pluralize = (n: number, forms: [string, string, string]): string => {
  const lastTwo = n % 100
  const lastOne = n % 10
  
  if (lastTwo >= 11 && lastTwo <= 19) return forms[2]
  if (lastOne === 1) return forms[0]
  if (lastOne >= 2 && lastOne <= 4) return forms[1]
  return forms[2]
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, responsesTick } = useSurveyContext()
  const survey = useMemo(() => surveys.find((s) => s.id === id), [surveys, id])

  const responses = useMemo(
    () => (survey ? getResponsesForSurvey(survey.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick нужен для обновления ответов
    [survey, responsesTick],
  )

  if (!survey) {
    return <div className={styles.page}><Link to="/">Опрос не найден. На главную</Link></div>
  }

  return (
    <div className={styles.page}>
      <p className={styles.sub}>{survey.title || 'Опрос'} · {responses.length} {pluralize(responses.length, ['ответ', 'ответа', 'ответов'])}</p>
      <div className={styles.stack}>
        {survey.questions.map((q, i) => (
          <article key={q.id} className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.cardLabel}>Вопрос {i + 1}</span>
              <h3 className={styles.cardTitle}>{q.text || '—'}</h3>
            </header>
            {q.type === 'single' && <SingleStats question={q} responses={responses} total={responses.length} />}
            {q.type === 'text' && <TextList answers={responses.map((r) => r.answers[q.id]).filter((x): x is string => Boolean(x))} />}
          </article>
        ))}
      </div>
    </div>
  )
}

function SingleStats({ question, responses, total }: { question: QuestionSingle; responses: SurveyResponseRow[]; total: number }) {
  const opts = question.options.map((o) => o.trim()).filter(Boolean)
  const denom = total || 1
  return (
    <ul className={styles.barList}>
      {opts.map((opt, i) => {
        const c = responses.filter((r) => r.answers[question.id] === opt).length
        const pct = Math.round((c / denom) * 100)
        const displayOpt = opt.length > 100 ? opt.slice(0, 100) + '...' : opt
        return (
          <li key={opt} className={styles.barRow}>
            <span className={styles.radioIcon} aria-hidden />
            <span className={styles.optionText}>{displayOpt}</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
            </div>
            <span className={styles.percentage}>{pct}%</span>
          </li>
        )
      })}
    </ul>
  )
}

function TextList({ answers }: { answers: string[] }) {
  const [showAll, setShowAll] = useState(false)
  
  const displayAnswers = useMemo(() => {
    const validAnswers = answers.filter(a => a.trim())
    return showAll ? validAnswers : validAnswers.slice(-5)
  }, [answers, showAll])

  if (answers.length === 0) return <p className={styles.empty}>Пока нет ответов.</p>

  return (
    <div>
      {!showAll && <h3 className={styles.latestAnswersHeader}>Последние 5 ответов:</h3>}
      <ul className={styles.textAnswers}>
        {displayAnswers.map((answer, index) => (
          <li key={index} className={styles.textRow}>
            <span className={styles.textValue}>{answer}</span>
          </li>
        ))}
      </ul>
      {answers.length > 5 && (
        <div className={styles.showAllBtnWrapper}>
          <button 
            type="button" 
            className={styles.showAllBtn}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Скрыть ответы' : 'Показать все ответы'}
          </button>
        </div>
      )}
    </div>
  )
}
