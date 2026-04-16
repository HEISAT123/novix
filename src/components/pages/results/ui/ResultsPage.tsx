import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSurveyContext } from '../../../../hooks/useSurveyContext'
import { getResponsesForSurvey } from '../../../../lib/surveysStorage'
import type { QuestionSingle, SurveyResponseRow } from '../../../../types/survey'
import styles from './ResultsPage.module.scss'

const BAR_COLORS = ['var(--bar-1)', 'var(--bar-2)', 'var(--bar-3)', 'var(--bar-4)']

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, responsesTick } = useSurveyContext()
  const survey = useMemo(() => surveys.find((s) => s.id === id), [surveys, id])
  const [tab, setTab] = useState<'answers' | 'summary'>('answers')

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
      <p className={styles.sub}>{survey.title || 'Опрос'} · {responses.length} ответов</p>
      <div className={styles.tabs}>
        <button type="button" onClick={() => setTab('answers')} className={tab === 'answers' ? styles.tabActive : styles.tab}>Ответы</button>
        <button type="button" onClick={() => setTab('summary')} className={tab === 'summary' ? styles.tabActive : styles.tab}>Сводка</button>
      </div>
      {tab === 'answers' ? (
        <div className={styles.stack}>
          {survey.questions.map((q, i) => (
            <article key={q.id} className={styles.card}>
              <header className={styles.cardHead}>
                <span className={styles.cardLabel}>Вопрос {i + 1}</span>
                <span className={styles.cardMuted}>Все ответы</span>
              </header>
              <h3 className={styles.cardTitle}>{q.text || '—'}</h3>
              {q.type === 'single' && <SingleStats question={q} responses={responses} total={responses.length} />}
              {q.type === 'text' && <TextList answers={responses.map((r) => r.answers[q.id]).filter((x): x is string => Boolean(x))} />}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.card}>
          <ul>
            {survey.questions.map((q) => (
              <li key={q.id}>{q.text || '—'}: {responses.filter((r) => r.answers[q.id]).length}</li>
            ))}
          </ul>
        </div>
      )}
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
        return (
          <li key={opt} className={styles.barRow}>
            <span>{opt}</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
            </div>
            <span>{pct}%</span>
          </li>
        )
      })}
    </ul>
  )
}

function TextList({ answers }: { answers: string[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of answers) {
      const k = a.trim()
      if (!k) continue
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [answers])

  if (grouped.length === 0) return <p className={styles.empty}>Пока нет ответов.</p>

  return (
    <ul className={styles.textAnswers}>
      {grouped.slice(0, 8).map(([t, c]) => (
        <li key={t} className={styles.textRow}>
          <span className={styles.textAvatar} aria-hidden />
          <span className={styles.textValue}>{t}</span>
          <span className={styles.textMeta}>♡ {c}</span>
        </li>
      ))}
    </ul>
  )
}
