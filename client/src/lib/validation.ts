export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Санитизация ввода для защиты от XSS
export function sanitizeInput(input: string): string {
  if (!input) return input
  return input
    .replace(/[<>]/g, '') // Удаляем угловые скобки
    .replace(/javascript:/gi, '') // Удаляем javascript: протокол
    .replace(/on\w+=/gi, '') // Удаляем обработчики событий
    .trim()
}

// Проверка на потенциально опасный контент
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:/i,
  ]
  return xssPatterns.some(pattern => pattern.test(input))
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
  
  if (containsXSS(username)) {
    return { field: 'username', message: 'Имя пользователя содержит недопустимые символы' }
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
  } else {
    const emailError = validateEmail(data.email)
    if (emailError) errors.push(emailError)
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Введите пароль' })
  } else {
    const passwordError = validatePassword(data.password)
    if (passwordError) errors.push(passwordError)
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

  if (containsXSS(answer)) {
    return { field: questionId, message: 'Ответ содержит недопустимые символы' }
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

// Валидация заголовка опроса
export function validateSurveyTitle(title: string): ValidationError | null {
  if (!title || !title.trim()) {
    return { field: 'title', message: 'Укажите название опроса' }
  }

  if (containsXSS(title)) {
    return { field: 'title', message: 'Название содержит недопустимые символы' }
  }

  if (title.trim().length > 255) {
    return { field: 'title', message: 'Название не может превышать 255 символов' }
  }

  return null
}

// Валидация описания опроса
export function validateSurveyDescription(description: string): ValidationError | null {
  if (description && containsXSS(description)) {
    return { field: 'description', message: 'Описание содержит недопустимые символы' }
  }

  if (description && description.trim().length > 5000) {
    return { field: 'description', message: 'Описание не может превышать 5000 символов' }
  }

  return null
}

// Валидация текста вопроса
export function validateQuestionText(text: string): ValidationError | null {
  if (!text || !text.trim()) {
    return { field: 'text', message: 'Укажите текст вопроса' }
  }

  if (containsXSS(text)) {
    return { field: 'text', message: 'Текст вопроса содержит недопустимые символы' }
  }

  if (text.trim().length > 1000) {
    return { field: 'text', message: 'Текст вопроса не может превышать 1000 символов' }
  }

  return null
}

// Валидация варианта ответа
export function validateOptionText(text: string): ValidationError | null {
  if (!text || !text.trim()) {
    return { field: 'option', message: 'Укажите вариант ответа' }
  }

  if (containsXSS(text)) {
    return { field: 'option', message: 'Вариант ответа содержит недопустимые символы' }
  }

  if (text.trim().length > 500) {
    return { field: 'option', message: 'Вариант ответа не может превышать 500 символов' }
  }

  return null
}
