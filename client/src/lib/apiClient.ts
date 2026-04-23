const API_BASE_URL = 'http://localhost:8000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    let message = 'Ошибка запроса к серверу'
    try {
      const errorData = await response.json()
      message = (errorData as { detail?: string }).detail || message
    } catch {
      // Если не удалось распарсить JSON, используем стандартное сообщение
    }
    throw new ApiError(message, response.status)
  }
  return response.json()
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  })
  return handleResponse(response) as Promise<T>
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  })
  return handleResponse(response) as Promise<T>
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  })
  return handleResponse(response) as Promise<T>
}

export async function del<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  })
  return handleResponse(response) as Promise<T>
}
