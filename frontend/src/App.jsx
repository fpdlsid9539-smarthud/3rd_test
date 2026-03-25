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

      // ✅ FAQ는 로그인 없이 접근 가능
      if (hash === 'FAQ') {
        setPage('faq')
        return
      }

      // 결제 성공
      if (window.location.pathname === '/payment/success') {
        setPage('payment_success')
        return
      }

      // 토큰 처리
      const urlParams = new URLSearchParams(window.location.search)
      const tokenFromUrl = urlParams.get('token')

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl)
        window.history.replaceState({}, document.title, '/')
        setPage('main')
        return
      }

      const savedToken = localStorage.getItem('token')

      if (savedToken) {
        setPage('main')
      } else {
        setPage('landing')
      }
    }

    syncPage()
    window.addEventListener('hashchange', syncPage)

    return () => {
      window.removeEventListener('hashchange', syncPage)
    }
  }, [])

  if (page === null) return null

  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'main' && <Main />}
      {page === 'faq' && <FAQPage />} {/* ✅ 핵심 */}
      {page === 'payment_success' && <PaymentSuccess />}
    </>
  )
}

export default App