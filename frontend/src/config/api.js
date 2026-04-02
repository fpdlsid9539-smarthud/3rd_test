const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (networkErr) {
    // fetch() itself threw — server unreachable or CORS preflight blocked
    throw new Error(`네트워크 오류: 서버에 연결할 수 없습니다. (${networkErr.message})`)
  }

  // 서버가 새 토큰을 발급했으면 자동으로 교체 (silent refresh)
  const newToken = response.headers.get('x-new-token')
  if (newToken) {
    localStorage.setItem('token', newToken)
  }

  // 토큰 만료 / 인증 실패 → 이벤트로 알리고 throw (hard redirect 금지 — React 상태 파괴함)
  if (response.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new CustomEvent('auth:expired'))
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
  }

  const data = await response.json()

  if (!response.ok || data.success === false) {
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