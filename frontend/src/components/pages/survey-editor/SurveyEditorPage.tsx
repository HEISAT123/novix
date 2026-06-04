import { useCallback, useEffect, useState } from 'react'
import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSurveyContext } from '../../../hooks/useSurveyContext'
import { createEmptyQuestion, createEmptySurvey } from '../../../hooks/useSurveys'
import type { Question, QuestionOption, Survey } from '../../../types/survey'
import { surveyTitleOnly, withBrand } from '../../../lib/documentTitle'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { validateSurveyTitle, validateSurveyDescription, validateQuestionText, validateOptionText } from '../../../lib/validation'
import styles from './SurveyEditorPage.module.scss'
import PublishSurveyPopup from '../../popup/publish-survey-popup/PublishSurveyPopup'
import SaveSurveyPopup from '../../popup/save-survey-popup/SaveSurveyPopup'
import trashcanIcon from '../../../assets/trashcan.svg'

// Функция для генерации UUID (альтернатива crypto.randomUUID для старых браузеров)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

function isSingleQuestion(question: Question): question is Question & { type: 'single'; options: QuestionOption[] } {
  return question.type === 'single'
}

function normalizeSurvey(raw: Survey): Survey {
  return {
    ...raw,
    questions: raw.questions.map((q) => {
      if (!isSingleQuestion(q)) return q
      const opts = [...(q.options || [])].map((o) => ({
        id: typeof o === 'string' ? o : o.id,
        text: typeof o === 'string' ? o : o.text,
      }))
      while (opts.length < MIN_OPTIONS) opts.push({ id: '', text: '' })
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

  const titleError = validateSurveyTitle(survey.title)
  if (titleError) errors.push(titleError.message)

  const descriptionError = validateSurveyDescription(survey.description)
  if (descriptionError) errors.push(descriptionError.message)

  survey.questions.forEach((question, index) => {
    const questionError = validateQuestionText(question.text)
    if (questionError) errors.push(questionError.message)

    if (isSingleQuestion(question)) {
      const nonEmptyOptions = question.options.filter(opt => opt.text.trim())
      if (nonEmptyOptions.length < 2) {
        errors.push(`Вопрос ${index + 1} должен иметь хотя бы 2 непустых варианта ответа`)
      }
      question.options.forEach((opt, optIndex) => {
        const optionError = validateOptionText(opt.text)
        if (optionError) errors.push(optionError.message)
      })
    }
  })

  return errors
}

export default function SurveyEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { upsertSurvey, getSurveyById, addQuestion, deleteQuestion, publishSurvey, unpublishSurvey } = useSurveyContext()
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [openQuestionTypeMenu, setOpenQuestionTypeMenu] = useState<string | null>(null)
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null)
  const [showPublishPopup, setShowPublishPopup] = useState(false)
  const [publishedSurveyLink, setPublishedSurveyLink] = useState('')
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [savedSurveyId, setSavedSurveyId] = useState<string | null>(null)

  useDocumentTitle(
    id === 'new'
      ? withBrand('Создание опроса')
      : withBrand(surveyTitleOnly(survey?.title, 'Без названия')),
  )

  useEffect(() => {
    const loadSurvey = async () => {
      if (id === 'new') {
        setSurvey(createEmptySurvey())
        setIsLoading(false)
        return
      }

      if (id) {
        setIsLoading(true)
        try {
          const fullSurvey = await getSurveyById(id)
          if (fullSurvey) {
            setSurvey(normalizeSurvey(fullSurvey))
          } else {
            setSurvey(null)
          }
        } catch (error) {
          console.error('Failed to load survey:', error)
          setSurvey(null)
        }
        setIsLoading(false)
      }
    }
    loadSurvey()
  }, [id])

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

  const commit = useCallback(async (next: Survey, replaceId: boolean, shouldPublish: boolean = false) => {
    const errors = validateSurvey(next)
    if (errors.length > 0) {
      setValidationError(errors[0])
      return
    }

    setValidationError('')
    setIsSaving(true)

    try {
      const normalized = normalizeSurvey(next)
      
      // Создаём или обновляем опрос
      const surveyId = await upsertSurvey(normalized)
      setSavedSurveyId(surveyId)

      // Получаем текущие вопросы
      let currentQuestions: Question[] = []
      try {
        const freshSurvey = await getSurveyById(surveyId)
        if (freshSurvey) {
          currentQuestions = freshSurvey.questions
        }
      } catch (e) {}

      // Добавляем новые вопросы
      for (const question of normalized.questions) {
        const exists = currentQuestions.some(eq => eq.id === question.id)
        if (!exists) {
          await addQuestion(surveyId, question)
        }
      }

      // Удаляем вопросы, которых больше нет
      for (const existingQuestion of currentQuestions) {
        const stillExists = normalized.questions.some(nq => nq.id === existingQuestion.id)
        if (!stillExists) {
          await deleteQuestion(surveyId, existingQuestion.id)
        }
      }

      // Публикуем, если нужно
      if (shouldPublish) {
        const link = await publishSurvey(surveyId)
        
        // Обновляем локальное состояние опроса с сервера
        const freshSurvey = await getSurveyById(surveyId)
        if (freshSurvey) {
          setSurvey(normalizeSurvey(freshSurvey))
        }
        
        setPublishedSurveyLink(link)
        setShowPublishPopup(true)
      } else {
        setShowSavePopup(true)
      }

      // Переходим на новую страницу ПОСЛЕ закрытия popup
      if (replaceId && id === 'new' && !shouldPublish) {
        // Перенаправление будет выполнено после закрытия popup
      }

    } catch (error) {
      // Не показываем ошибку, если это повторное сохранение уже существующего опроса
      if (!survey.public_id) {
        setValidationError('Ошибка при сохранении. Попробуйте снова.')
      }
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [id, navigate, upsertSurvey, getSurveyById, addQuestion, deleteQuestion, publishSurvey])

  if (!survey && !isLoading) return <div className={styles.page}><Link to="/">Опрос не найден</Link></div>
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
            maxLength={255}
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
                  <div key={opt.id || i} className={styles.optionRow}>
                    <span className={styles.radioFake} aria-hidden />
                    <input
                      className={styles.optionInput}
                      value={opt.text}
                      placeholder={`Вариант ${i + 1}`}
                      maxLength={100}
                      onChange={(e) =>
                        setSurvey((s) =>
                          s
                            ? ({
                                ...s,
                                questions: s.questions.map((x) => {
                                  if (x.id !== q.id || !isSingleQuestion(x)) return x
                                  const next = [...x.options]
                                  next[i] = { ...next[i], text: e.target.value }
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
                                    if (x.id !== q.id || !isSingleQuestion(x)) return x
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
                            if (x.id !== q.id || !isSingleQuestion(x)) return x
                            return { ...x, options: [...x.options, { id: generateUUID(), text: '' }] }
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
          <div className={styles.statusToggle}>
            <button
              type="button"
              className={`${styles.statusOption} ${survey.status === 'draft' && (id !== 'new' || savedSurveyId) && !isSaving ? styles.statusActive : ''}`}
              onClick={() => {
                if (survey.status === 'published') {
                  unpublishSurvey(survey.id).then(() => {
                    setSurvey((s) => s ? { ...s, status: 'draft' } : s)
                  })
                } else if (!isSaving) {
                  commit(survey, true)
                }
              }}
              disabled={isSaving}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {isSaving && survey.status === 'draft' ? 'Сохранение...' : (id !== 'new' || savedSurveyId) ? 'Черновик' : 'Сохранить черновик'}
            </button>
            <button
              type="button"
              className={`${styles.statusOption} ${survey.status === 'published' && !isSaving ? styles.statusActive : ''}`}
              onClick={() => {
                if (survey.status === 'draft' && !isSaving) {
                  const errors = validateSurvey(survey)
                  if (errors.length > 0) {
                    setValidationError(errors[0])
                    return
                  }
                  setValidationError('')
                  commit(survey, true, true)
                }
              }}
              disabled={isSaving}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {isSaving && survey.status !== 'published' ? 'Публикация...' : survey.status === 'published' ? 'Опубликован' : 'Опубликовать'}
            </button>
          </div>
        </div>
        {validationError && (
          <div className={styles.error}>
            {validationError}
          </div>
        )}
        {survey.status === 'published' && survey.public_id && (
          <div className={styles.statusRow}>
            <p className={styles.helperLinks}>
              <Link to={`/survey/${survey.public_id}`}>Открыть опрос</Link> · <Link to={`/results/${survey.id}`}>Результаты</Link>
            </p>
          </div>
        )}
      </div>
      
      {/* НАСТОЯЩИЙ ПОПАП */}
      {showPublishPopup && (
        <PublishSurveyPopup
          surveyLink={publishedSurveyLink}
          onClose={() => setShowPublishPopup(false)}
        />
      )}
      
      {showSavePopup && (
        <SaveSurveyPopup
          onClose={() => {
            setShowSavePopup(false)
            if (id === 'new' && savedSurveyId) {
              navigate(`/edit/${savedSurveyId}`, { replace: true })
            }
          }}
        />
      )}
    </div>
  )
}

