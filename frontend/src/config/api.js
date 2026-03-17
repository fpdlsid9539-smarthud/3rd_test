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

  // 서버가 새 토큰을 발급했으면 자동으로 교체 (silent refresh)
  const newToken = response.headers.get('x-new-token')
  if (newToken) {
    localStorage.setItem('token', newToken)
  }

  // 토큰 만료 / 인증 실패 → 로그아웃 처리
  if (response.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/'
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
  }

  const data = await response.json()

  if (!response.ok || data.success === false) {
    // 서버가 보낸 error 필드까지 포함해서 던짐 (디버깅용)
    const detail = data.error ? ` (${data.error})` : ''
    throw new Error((data.message || 'API 요청 실패') + detail)
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