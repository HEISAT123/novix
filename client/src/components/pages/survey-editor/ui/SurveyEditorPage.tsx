import { useCallback, useEffect, useMemo, useState } from 'react'
import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../../context/useAuth'
import { useSurveyContext } from '../../../../hooks/useSurveyContext'
import { createEmptyQuestion, createEmptySurvey } from '../../../../hooks/useSurveys'
import type { Question, Survey } from '../../../../types/survey'
import styles from './SurveyEditorPage.module.scss'
import PublishSurveyPopup from '../../../popup/publish-survey-popup/PublishSurveyPopup'
import SaveSurveyPopup from '../../../popup/save-survey-popup/SaveSurveyPopup'
import trashcanIcon from '../../../../assets/trashcan.svg'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

function normalizeSurvey(raw: Survey): Survey {
  return {
    ...raw,
    questions: raw.questions.map((q) => {
      if (q.type !== 'single') return q
      const opts = [...(q.options || [])].map((o) => String(o))
      while (opts.length < MIN_OPTIONS) opts.push('')
      return { ...q, options: opts }
    }),
  }
}

const autoResizeTextarea = (element: HTMLTextAreaElement) => {
  element.style.height = 'auto'
  element.style.height = element.scrollHeight + 'px'
}

const validateSurvey = (survey: Survey): string[] => {
  const errors: string[] = []

  if (survey.questions.length === 0) {
    errors.push('Добавьте хотя бы один вопрос')
  }

  if (!survey.title.trim()) {
    errors.push('Название опроса не может быть пустым')
  }
  
  survey.questions.forEach((question, index) => {
    if (!question.text.trim()) {
      errors.push(`Вопрос ${index + 1} не может быть пустым`)
    }
    
    if (question.type === 'single') {
      const nonEmptyOptions = question.options.filter(opt => opt.trim())
      if (nonEmptyOptions.length < 2) {
        errors.push(`Вопрос ${index + 1} должен иметь хотя бы 2 непустых варианта ответа`)
      }
      question.options.forEach((opt, optIndex) => {
        if (opt.length > 100) {
          errors.push(`Вариант ${optIndex + 1} вопроса ${index + 1} не может превышать 100 символов`)
        }
      })
    }
  })
  
  return errors
}

export default function SurveyEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveys, upsertSurvey } = useSurveyContext()
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [openQuestionTypeMenu, setOpenQuestionTypeMenu] = useState<string | null>(null)
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null)
  const [showPublishPopup, setShowPublishPopup] = useState(false)
  const [publishedSurveyLink, setPublishedSurveyLink] = useState('')
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [validationError, setValidationError] = useState('')

  const fromStore = useMemo(() => {
    if (id === 'new') return null
    const found = surveys.find((s) => s.id === id)
    return found ? normalizeSurvey(found) : null
  }, [id, surveys])

  const newSurvey = useMemo(() => createEmptySurvey(user?.id ?? null), [user?.id])
  const loadedSurvey: Survey | null = id === 'new' ? newSurvey : fromStore
  const [survey, setSurvey] = useState<Survey | null>(() => loadedSurvey)

  useEffect(() => {
    if (descriptionRef.current) {
      autoResizeTextarea(descriptionRef.current)
    }
  }, [survey?.description])

  const handleAddMenuToggle = () => {
    setAddMenuOpen(!addMenuOpen)
  }

  const handleQuestionTypeMenuToggle = (questionId: string) => {
    setOpenQuestionTypeMenu(openQuestionTypeMenu === questionId ? null : questionId)
  }

  const handleQuestionTypeChange = (questionId: string, newType: 'single' | 'text') => {
    setSurvey((s) =>
      s
        ? ({
            ...s,
            questions: s.questions.map((x) =>
              x.id === questionId
                ? ({
                    ...x,
                    type: newType,
                    ...(newType === 'single' ? { options: ['', ''] } : {}),
                  } as Question)
                : x,
            ),
          })
        : s,
    )
    setOpenQuestionTypeMenu(null)
  }

  const commit = useCallback((next: Survey, replaceId: boolean) => {
    const errors = validateSurvey(next)
    if (errors.length > 0) {
      setValidationError(errors[0])
      return
    }
    
    setValidationError('')
    const normalized = normalizeSurvey(next)
    upsertSurvey(normalized)
    if (replaceId && id === 'new') navigate(`/edit/${normalized.id}`, { replace: true })
    setShowSavePopup(true)
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
            ref={descriptionRef}
            className={styles.input}
            placeholder="Добавьте описание..."
            value={survey.description}
            maxLength={1180}
            onChange={(e) => {
              const lines = e.target.value.split('\n')
              if (lines.length <= 10) {
                setSurvey((s) => (s ? { ...s, description: e.target.value } : s))
                if (descriptionRef.current) {
                  autoResizeTextarea(descriptionRef.current)
                }
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              const lines = target.value.split('\n')
              if (lines.length > 10) {
                target.value = lines.slice(0, 10).join('\n')
                setSurvey((s) => (s ? { ...s, description: target.value } : s))
                if (descriptionRef.current) {
                  autoResizeTextarea(descriptionRef.current)
                }
              }
            }}
          />
        </label>
        <h2 className={styles.sectionTitle}>Вопросы</h2>
        {survey.questions.map((q) => (
          <div key={q.id} className={styles.question}>
            <div className={styles.questionHead}>
              <div className={styles.questionTitleRow}>
                <span className={styles.questionNumber}>Вопрос {qIndex(q)}</span>
                <input
                  className={styles.questionInput}
                  placeholder="Введите вопрос..."
                  value={q.text}
                  maxLength={100}
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
              </div>
              <div className={styles.questionActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => removeQuestion(q.id)}
                  aria-label="Удалить вопрос"
                  title="Удалить вопрос"
                >
                  <img src={trashcanIcon} alt="Удалить" width="20" height="20" />
                </button>
                <div className={styles.questionTypeSelectWrapper}>
                  <button
                    className={styles.questionTypeSelect}
                    onClick={() => handleQuestionTypeMenuToggle(q.id)}
                  >
                    {q.type === 'single' ? 'Один вариант' : 'Короткий текст'}
                  </button>
                  {openQuestionTypeMenu === q.id && (
                    <div className={styles.questionTypeMenu}>
                      <button
                        type="button"
                        onClick={() => handleQuestionTypeChange(q.id, 'single')}
                        className={q.type === 'single' ? styles.active : ''}
                      >
                        Один вариант
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionTypeChange(q.id, 'text')}
                        className={q.type === 'text' ? styles.active : ''}
                      >
                        Короткий текст
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {q.type === 'single' && (
              <div className={styles.optionsList}>
                {q.options.map((opt, i) => (
                  <div key={i} className={styles.optionRow}>
                    <span className={styles.radioFake} aria-hidden />
                    <input
                      className={styles.optionInput}
                      value={opt}
                      placeholder={`Вариант ${i + 1}`}
                      maxLength={100}
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
                                    const next = x.options.filter((_, idx) => idx !== i)
                                    return { ...x, options: next }
                                  }),
                                })
                              : s,
                          )
                        }
                        aria-label="Удалить вариант"
                        title="Удалить вариант"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <div className={styles.textAnswerPreview}>
                <div className={styles.textInputPlaceholder}>Введите ответ...</div>
              </div>
            )}
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
                            return { ...x, options: [...x.options, ''] }
                          }),
                        })
                      : s,
                  )
                }
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Добавить вариант
              </button>
            )}
          </div>
        ))}
        <div className={styles.actions}>
          <div className={styles.addQuestionWrapper}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={handleAddMenuToggle}
            ><span className={styles.plusIcon}>+</span> Добавить вопрос</button>
            {addMenuOpen && (
              <div className={styles.menu}>
                <button type="button" onClick={() => { setSurvey((s) => s ? ({ ...s, questions: [...s.questions, createEmptyQuestion('single')] }) : s); setAddMenuOpen(false); }}>Один вариант</button>
                <button type="button" onClick={() => { setSurvey((s) => s ? ({ ...s, questions: [...s.questions, createEmptyQuestion('text')] }) : s); setAddMenuOpen(false); }}>Текстовый ответ</button>
              </div>
            )}
          </div>
          <div className={styles.actions_save}>
          <button type="button" className={styles.outlineBtn} onClick={() => commit(survey, true)}>Сохранить черновик</button>
          <button type="button" className={styles.primaryBtn} onClick={() => { 
              const errors = validateSurvey(survey)
              if (errors.length > 0) {
                setValidationError(errors[0])
                return
              }
              
              setValidationError('')
              const publishedSurvey = { ...survey, status: 'published' as const }
              upsertSurvey(publishedSurvey)
              setPublishedSurveyLink(`${window.location.origin}/survey/${publishedSurvey.id}`)
              setShowPublishPopup(true)
            }}>Опубликовать</button>
          </div>
        </div>
        {validationError && (
          <div className={styles.error}>
            {validationError}
          </div>
        )}
        {survey.status === 'published' && (
          <p className={styles.helperLinks}>
            <Link to={`/survey/${survey.id}`}>Открыть опрос</Link> · <Link to={`/results/${survey.id}`}>Результаты</Link>
          </p>
        )}
      </div>
      {showPublishPopup && (
        <PublishSurveyPopup
          surveyLink={publishedSurveyLink}
          onClose={() => setShowPublishPopup(false)}
        />
      )}
      {showSavePopup && (
        <SaveSurveyPopup
          onClose={() => setShowSavePopup(false)}
        />
      )}
    </div>
  )
}
