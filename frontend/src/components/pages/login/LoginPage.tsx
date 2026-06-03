import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { validateEmail, validateLoginForm, type ValidationError } from '../../../lib/validation'
import styles from './LoginPage.module.scss'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const validation = validateLoginForm({ email, password })
    
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
      await login(email, password)
      navigate('/', { replace: true })
      window.location.reload()
    } catch (err) {
      let errorMessage = 'Ошибка при входе'
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

  const handleFieldBlur = (fieldName: string, value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, [fieldName]: fieldName === 'email' ? 'Введите email' : 'Введите пароль' }))
      return
    }

    if (fieldName === 'email') {
      const error = validateEmail(value)
      if (error) {
        setErrors((prev) => ({ ...prev, [fieldName]: error.message }))
      } else {
        clearFieldError(fieldName)
      }
      return
    }

    clearFieldError(fieldName)
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.desc}>Войдите, чтобы управлять своими опросами</p>
        
        {errors.form && <div className={styles.error}>{errors.form}</div>}
        
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${getFieldError('email') ? styles.inputError : ''}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError('email')
            }}
            onBlur={() => handleFieldBlur('email', email)}
            placeholder="your@email.com"
          />
          {getFieldError('email') && <span className={styles.fieldError}>{getFieldError('email')}</span>}
        </div>
        
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>Пароль</label>
          <input
            id="password"
            type="password"
            className={`${styles.input} ${getFieldError('password') ? styles.inputError : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError('password')
            }}
            onBlur={() => handleFieldBlur('password', password)}
            placeholder="••••••••"
          />
          {getFieldError('password') && <span className={styles.fieldError}>{getFieldError('password')}</span>}
        </div>
        
        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.primaryBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </div>
        
        <p className={styles.footer}>
          Нет аккаунта? <Link to="/register" className={styles.link}>Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  )
}
