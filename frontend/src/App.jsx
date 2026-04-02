import React, { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Main from './components/Main'
import FAQPage from './components/FAQPage'
import PaymentSuccess from './components/PaymentSuccess'

function App() {
  const [page, setPage] = useState(null)

  useEffect(() => {
    // ── 1. 결제 성공 페이지 먼저 처리 ──────────────────────────────
    if (window.location.pathname === '/payment/success') {
      setPage('payment_success')
      return
    }

    // ── 2. OAuth 콜백: URL 에 token 이 있으면 저장 후 즉시 main 으로 ──
    //    이 분기에서 return 하므로 storage 이벤트 이중 실행 문제 없음
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)

      // 쿼리스트링만 제거 (hash 는 그대로 유지)
      const cleanUrl =
        window.location.origin + window.location.pathname + window.location.hash
      window.history.replaceState({}, document.title, cleanUrl)

      // 토큰이 방금 저장됐으므로 바로 main 으로 — 아래 분기로 내려가지 않음
      setPage('main')
      return
    }

    // ── 3. 해시 기반 라우팅 (hashchange 이벤트로도 재실행) ──────────
    const syncFromHash = () => {
      const hash = window.location.hash.replace('#', '')

      if (hash === 'FAQ') {
        setPage('main')
        return
      }

      if (hash === 'HOME') {
        setPage('landing')
        return
      }

      // ── 4. 저장된 토큰 기준 기본 페이지 결정 ──────────────────────
      const savedToken = localStorage.getItem('token')
      setPage(savedToken ? 'main' : 'landing')
    }

    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)

    return () => {
      window.removeEventListener('hashchange', syncFromHash)
    }
  }, [])

  if (page === null) return null

  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'main' && <Main />}
      {page === 'faq' && <FAQPage setPage={setPage} />}
      {page === 'payment_success' && <PaymentSuccess />}
    </>
  )
}

export default App