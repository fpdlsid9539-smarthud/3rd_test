import React, { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Main from './components/Main'
import FAQPage from './components/FAQPage'
import PaymentSuccess from './components/PaymentSuccess'

function App() {
  const [page, setPage] = useState(null)

  useEffect(() => {
    const syncPage = () => {
      const hash = window.location.hash.replace('#', '')

      // 1. 결제 성공 페이지 먼저 처리
      if (window.location.pathname === '/payment/success') {
        setPage('payment_success')
        return
      }

      // 2. URL 토큰 처리
      const urlParams = new URLSearchParams(window.location.search)
      const tokenFromUrl = urlParams.get('token')

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl)

        const cleanUrl =
          window.location.origin + window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, cleanUrl)
      }

      // 3. 해시 페이지 처리
      if (hash === 'FAQ') {
        setPage('main')
        return
      }

      if (hash === 'HOME') {
        setPage('landing')
        return
      }

      // 4. 저장된 토큰 기준 기본 페이지 결정
      const savedToken = localStorage.getItem('token')

      if (savedToken) {
        setPage('main')
      } else {
        setPage('landing')
      }
    }

    syncPage()
    window.addEventListener('hashchange', syncPage)
    window.addEventListener('storage', syncPage)

    return () => {
      window.removeEventListener('hashchange', syncPage)
      window.removeEventListener('storage', syncPage)
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