export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: 'email', message: 'Укажите email' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Введите корректный email\n(например, name@example.com)' }
  }
  
  return null
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: 'Введите пароль' }
  }
  
  if (password.length < 6) {
    return { field: 'password', message: 'Пароль должен быть не менее 6 символов' }
  }
  
  if (password.length > 128) {
    return { field: 'password', message: 'Пароль слишком длинный' }
  }
  
  return null
}

export function validateUsername(username: string): ValidationError | null {
  if (!username) {
    return { field: 'username', message: 'Укажите имя пользователя' }
  }
  
  if (username.trim().length < 2) {
    return { field: 'username', message: 'Имя пользователя должно содержать не менее 2 символов' }
  }
  
  if (username.trim().length > 30) {
    return { field: 'username', message: 'Имя пользователя не может быть длиннее 30 символов' }
  }
  
  const usernameRegex = /^[a-zA-Zа-яА-Я0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { field: 'username', message: 'Имя пользователя может содержать только буквы, цифры и нижнее подчёркивание' }
  }
  
  return null
}

export function validateConfirmPassword(password: string, confirmPassword: string): ValidationError | null {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: 'Подтвердите пароль' }
  }
  
  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: 'Пароли не совпадают' }
  }
  
  return null
}

export function validateRegistrationForm(data: {
  username: string
  email: string
  password: string
  confirmPassword: string
}): ValidationResult {
  const errors: ValidationError[] = []
  
  const usernameError = validateUsername(data.username)
  if (usernameError) errors.push(usernameError)
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.push(emailError)
  
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.push(passwordError)
  
  const confirmError = validateConfirmPassword(data.password, data.confirmPassword)
  if (confirmError) errors.push(confirmError)
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateLoginForm(data: {
  email: string
  password: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.email) {
    errors.push({ field: 'email', message: 'Введите имя пользователя' })
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Введите пароль' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateAnswer(answer: string, questionId: string): ValidationError | null {
  if (!answer || !answer.trim()) {
    return { field: questionId, message: 'Пожалуйста, ответьте на вопрос' }
  }

  if (answer.trim().length > 1000) {
    return { field: questionId, message: 'Ответ не может превышать 1000 символов' }
  }

  return null
}

export function validateSurveyForm(answers: Record<string, string>, questions: Array<{ id: string; type: string }>): ValidationResult {
  const errors: ValidationError[] = []

  questions.forEach((question) => {
    const answer = answers[question.id]
    if (question.type === 'text') {
      const error = validateAnswer(answer || '', question.id)
      if (error) errors.push(error)
    } else if (question.type === 'single') {
      if (!answer) {
        errors.push({ field: question.id, message: 'Выберите вариант ответа' })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}
