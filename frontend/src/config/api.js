const API_BASE_URL = 'http://localhost:5000'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'API 요청 실패')
  }

  return data
}

export const api = {
  get: (path) =>
    request(path, {
      method: 'GET',
    }),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (path) =>
    request(path, {
      method: 'DELETE',
    }),
}