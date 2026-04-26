import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../context/useAuth'
import { validateEmail, validatePassword, validateUsername, validateConfirmPassword, validateRegistrationForm, type ValidationError } from '../../../../lib/validation'
import styles from './RegisterPage.module.scss'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    const validation = validateRegistrationForm({ username, email, password, confirmPassword })
    
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
      await register(email, password, username)
      navigate('/', { replace: true })
    } catch (err) {
      let errorMessage = 'Ошибка при регистрации'
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
    if (!value) return
    
    let error: ValidationError | null = null
    if (fieldName === 'username') error = validateUsername(value)
    else if (fieldName === 'email') error = validateEmail(value)
    else if (fieldName === 'password') error = validatePassword(value)
    else if (fieldName === 'confirmPassword') error = validateConfirmPassword(password, value)
    
    if (error) {
      setErrors((prev) => ({ ...prev, [fieldName]: error.message }))
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.desc}>Создайте аккаунт для управления опросами</p>
        
        {errors.form && <div className={styles.error}>{errors.form}</div>}
        
        <div className={styles.field}>
          <label htmlFor="username" className={styles.label}>Имя пользователя</label>
          <input
            id="username"
            type="text"
            className={`${styles.input} ${getFieldError('username') ? styles.inputError : ''}`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              clearFieldError('username')
            }}
            onBlur={() => handleFieldBlur('username', username)}
            placeholder="Имя пользователя"
          />
          {getFieldError('username') && <span className={styles.fieldError}>{getFieldError('username')}</span>}
        </div>
        
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
            placeholder="Минимум 6 символов"
          />
          {getFieldError('password') && <span className={styles.fieldError}>{getFieldError('password')}</span>}
        </div>
        
        <div className={styles.field}>
          <label htmlFor="confirmPassword" className={styles.label}>Подтвердите пароль</label>
          <input
            id="confirmPassword"
            type="password"
            className={`${styles.input} ${getFieldError('confirmPassword') ? styles.inputError : ''}`}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              clearFieldError('confirmPassword')
            }}
            onBlur={() => handleFieldBlur('confirmPassword', confirmPassword)}
            placeholder="••••••••"
          />
          {getFieldError('confirmPassword') && <span className={styles.fieldError}>{getFieldError('confirmPassword')}</span>}
        </div>
        
        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.primaryBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </div>
        
        <p className={styles.footer}>
          Уже есть аккаунт? <Link to="/login" className={styles.link}>Войти</Link>
        </p>
      </form>
    </div>
  )
}
