import React, { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Main from './components/Main'
import PaymentSuccess from './components/PaymentSuccess'

function App() {
  const [page, setPage] = useState(null) // null = 아직 판단 중 (깜빡임 방지)

  useEffect(() => {
    // 1. 제일 먼저 결제 성공 페이지 접속인지 확인합니다.
    if (window.location.pathname === '/payment/success') {
      setPage('payment_success')
      return
    }

    // 2. URL 에 token 이 있으면 저장 후 URL 정리
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)
      window.history.replaceState({}, document.title, '/')
      setPage('main')
      return
    }

    // 3. 이미 저장된 토큰이 있으면 바로 main
    const savedToken = localStorage.getItem('token')
    setPage(savedToken ? 'main' : 'landing')
  }, []) // 👈 useEffect는 여기서 닫힙니다.

  // 판단 전에는 아무것도 렌더링하지 않음 (토큰 미확정 상태로 API 호출 방지)
  if (page === null) return null

  // 화면 렌더링
  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'main' && <Main />}
      {page === 'payment_success' && <PaymentSuccess />}
    </>
  )
} // 👈 App 함수는 여기서 최종적으로 닫혀야 합니다!

export default App