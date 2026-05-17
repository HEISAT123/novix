const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    let errorDetails: unknown = null

    try {
      const errorData = await response.json()
      errorDetails = errorData
      message = (errorData as { detail?: string; message?: string; error?: string }).detail ||
                (errorData as { detail?: string; message?: string; error?: string }).message ||
                (errorData as { detail?: string; message?: string; error?: string }).error ||
                message

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
    } catch {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: await response.text()
      })
    }
    throw new ApiError(message, response.status, errorDetails)
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
  const url = `${API_BASE_URL}${path}`
  console.log('[apiClient] GET запрос:', url)
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  })
  return handleResponse(response) as Promise<T>
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  console.log('[apiClient] POST запрос:', url, 'body:', body)
  const response = await fetch(url, {
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
