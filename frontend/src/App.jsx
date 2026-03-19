import React, { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Main from './components/Main'

function App() {
  const [page, setPage] = useState(null) // null = 아직 판단 중 (깜빡임 방지)

  useEffect(() => {
    // 1. URL 에 token 이 있으면 저장 후 URL 정리
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)
      window.history.replaceState({}, document.title, '/')
      setPage('main')
      return
    }

    // 2. 이미 저장된 토큰이 있으면 바로 main
    const savedToken = localStorage.getItem('token')
    setPage(savedToken ? 'main' : 'landing')
  }, [])

  // 판단 전에는 아무것도 렌더링하지 않음 (토큰 미확정 상태로 API 호출 방지)
  if (page === null) return null

  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'main' && <Main />}
    </>
  )
}

export default App
