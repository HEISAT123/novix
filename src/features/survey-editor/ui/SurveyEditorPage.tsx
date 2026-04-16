import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSurveyContext } from '../../../hooks/useSurveyContext'
import { createEmptyQuestion, createEmptySurvey } from '../../../hooks/useSurveys'
import type { Question, Survey } from '../../../types/survey'
import styles from './SurveyEditorPage.module.scss'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

function normalizeSurvey(raw: Survey): Survey {
  return {
    ...raw,
    questions: raw.questions.map((q) => {
      if (q.type !== 'single') return q
      let opts = [...(q.options || [])].map((o) => String(o))
      while (opts.length < MIN_OPTIONS) opts.push('')
      if (opts.length > MAX_OPTIONS) opts = opts.slice(0, MAX_OPTIONS)
      return { ...q, options: opts }
    }),
  }
}

export default function SurveyEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { surveys, upsertSurvey } = useSurveyContext()
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const fromStore = useMemo(() => {
    if (id === 'new') return null
    const found = surveys.find((s) => s.id === id)
    return found ? normalizeSurvey(found) : null
  }, [id, surveys])

  const newSurvey = useMemo(() => createEmptySurvey(), [])
  const loadedSurvey: Survey | null = id === 'new' ? newSurvey : fromStore
  const [survey, setSurvey] = useState<Survey | null>(() => loadedSurvey)

  const commit = useCallback((next: Survey, replaceId: boolean) => {
    const normalized = normalizeSurvey(next)
    upsertSurvey(normalized)
    if (replaceId && id === 'new') navigate(`/edit/${normalized.id}`, { replace: true })
  }, [id, navigate, upsertSurvey])

  if (id !== 'new' && !loadedSurvey) return <div className={styles.page}><Link to="/">Опрос не найден</Link></div>
  if (!survey) return <div className={styles.page}>Загрузка…</div>

  const qIndex = (q: Question) => survey.questions.indexOf(q) + 1
  const removeQuestion = (qid: string) => {
    setSurvey((s) => (s ? { ...s, questions: s.questions.filter((q) => q.id !== qid) } : s))
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <label className={styles.field}>
          <span className={styles.label}>Название опроса</span>
          <input
            className={styles.input}
            placeholder="Введите название опроса"
            value={survey.title}
            onChange={(e) => setSurvey((s) => (s ? { ...s, title: e.target.value } : s))}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Описание <span className={styles.label_transperant}>(необязательно)</span></span>
          <textarea
            className={styles.input}
            placeholder="Добавьте описание..."
            value={survey.description}
            onChange={(e) => setSurvey((s) => (s ? { ...s, description: e.target.value } : s))}
          />
        </label>
        <h2 className={styles.sectionTitle}>Вопросы</h2>
        {survey.questions.map((q) => (
          <div key={q.id} className={styles.question}>
            <div className={styles.questionHead}>
              <span>Вопрос {qIndex(q)}</span>
              <button
                type="button"
                className={styles.deleteQuestionBtn}
                onClick={() => removeQuestion(q.id)}
                aria-label="Удалить вопрос"
                title="Удалить вопрос"
              >
                ×
              </button>
            </div>
            <input
              className={styles.input}
              placeholder="Введите вопрос..."
              value={q.text}
              onChange={(e) =>
                setSurvey((s) =>
                  s
                    ? ({
                        ...s,
                        questions: s.questions.map((x) =>
                          x.id === q.id ? ({ ...x, text: e.target.value } as Question) : x,
                        ),
                      })
                    : s,
                )
              }
            />
            {q.type === 'single' && q.options.map((opt, i) => (
              <div key={i} className={styles.optionRow}>
                <span className={styles.radioFake} aria-hidden />
                <input
                  className={styles.input}
                  value={opt}
                  placeholder={`Вариант ${i + 1}`}
                  onChange={(e) =>
                    setSurvey((s) =>
                      s
                        ? ({
                            ...s,
                            questions: s.questions.map((x) => {
                              if (x.id !== q.id || x.type !== 'single') return x
                              const next = [...x.options]
                              next[i] = e.target.value
                              return { ...x, options: next }
                            }),
                          })
                        : s,
                    )
                  }
                />
                {q.options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    className={styles.removeOptionBtn}
                    onClick={() =>
                      setSurvey((s) =>
                        s
                          ? ({
                              ...s,
                              questions: s.questions.map((x) => {
                                if (x.id !== q.id || x.type !== 'single') return x
                                if (x.options.length <= MIN_OPTIONS) return x
                                return { ...x, options: x.options.filter((_, idx) => idx !== i) }
                              }),
                            })
                          : s,
                      )
                    }
                    aria-label="Удалить вариант"
                    title="Удалить вариант"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {q.type === 'single' && q.options.length < MAX_OPTIONS && (
              <button
                type="button"
                className={styles.addOptionBtn}
                onClick={() =>
                  setSurvey((s) =>
                    s
                      ? ({
                          ...s,
                          questions: s.questions.map((x) => {
                            if (x.id !== q.id || x.type !== 'single') return x
                            if (x.options.length >= MAX_OPTIONS) return x
                            return { ...x, options: [...x.options, ''] }
                          }),
                        })
                      : s,
                  )
                }
              >
                + Добавить вариант
              </button>
            )}
            {q.type === 'single' && (
              <p className={styles.optionsCounter}>
                Варианты: {q.options.length}/{MAX_OPTIONS}
              </p>
            )}
          </div>
        ))}
        <div className={styles.actions}>
          <button type="button" className={styles.ghostBtn} onClick={() => setAddMenuOpen((v) => !v)}><span style={{fontSize:'25px', marginRight:'5px', top:'3px', position:"relative", color:'var(--primary)'}}>+</span> Добавить вопрос</button>
          {addMenuOpen && (
            <div className={styles.menu}>
              <button type="button" onClick={() => setSurvey((s) => s ? ({ ...s, questions: [...s.questions, createEmptyQuestion('single')] }) : s)}>Один вариант (radio)</button>
              <button type="button" onClick={() => setSurvey((s) => s ? ({ ...s, questions: [...s.questions, createEmptyQuestion('text')] }) : s)}>Текстовый ответ</button>
            </div>
          )}
          <div className={styles.actions_save}>
          <button type="button" className={styles.outlineBtn} onClick={() => commit(survey, true)}>Сохранить</button>
          <button type="button" className={styles.primaryBtn} onClick={() => { upsertSurvey({ ...survey, status: 'published' }); navigate('/') }}>Опубликовать</button>
          </div>
        </div>
        {survey.status === 'published' && (
          <p className={styles.helperLinks}>
            <Link to={`/survey/${survey.id}`}>Открыть опрос</Link> · <Link to={`/results/${survey.id}`}>Результаты</Link>
          </p>
        )}
      </div>
    </div>
  )
}
