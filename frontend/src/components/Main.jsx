import React, { useEffect, useState } from 'react'
import './Main.css'
import Navigation from './Navigation'
import Dashboard from './Dashboard'
import Profile from './Profile'
import Education from './Education'
import Quiz from './QuizPage'
import Stocks from './Stocks'
import Ranking from './Ranking'
import Billing from './Billing'
import FAQPage from './FAQPage'

const Main = () => {
  const VALID_MENUS = [
    'Dashboard',
    'Education',
    'Quiz',
    'Stocks',
    'Ranking',
    'Billing',
    'FAQ',
  ]

  const PROTECTED_MENUS = ['Quiz', 'Stocks', 'Billing']

  const getInitialMenu = () => {
    const hash = window.location.hash.replace('#', '')
    return VALID_MENUS.includes(hash) ? hash : 'Dashboard'
  }

  const [activeMenu, setActiveMenu] = useState(getInitialMenu)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [membershipType, setMembershipType] = useState(null)
  const [navCollapsed, setNavCollapsed] = useState(
    () => localStorage.getItem('nav_collapsed') === 'true'
  )
  const [profileCollapsed, setProfileCollapsed] = useState(
    () => localStorage.getItem('profile_collapsed') === 'true'
  )
  const [role, setRole] = useState('user')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash
      window.history.replaceState({}, document.title, cleanUrl)
    }

    const token = localStorage.getItem('token')
    const loggedIn = !!token
    setIsLoggedIn(loggedIn)

    const initialHash = window.location.hash.replace('#', '')
    if (PROTECTED_MENUS.includes(initialHash) && !loggedIn) {
      window.location.hash = 'Dashboard'
      setActiveMenu('Dashboard')
    }

    if (loggedIn) {
      fetchMembership(token)
      fetchRole(token)
    } else {
      setMembershipType(null)
      setRole('user')
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (!VALID_MENUS.includes(hash)) return

      const currentLoggedIn = !!localStorage.getItem('token')

      if (PROTECTED_MENUS.includes(hash) && !currentLoggedIn) {
        window.location.hash = 'Dashboard'
        return
      }

      setActiveMenu(hash)
    }

    window.addEventListener('hashchange', handleHashChange)

    // api.js 가 401 을 받으면 hard-redirect 대신 이 이벤트를 발생시킴
    const handleAuthExpired = () => {
      window.location.hash = ''
      window.location.href = '/'
    }
    window.addEventListener('auth:expired', handleAuthExpired)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('profile_collapsed', String(profileCollapsed))
  }, [profileCollapsed])

  // 토큰 만료 전 자동 갱신 — 45분마다 실행 (만료 1시간 기준, 여유 있게 갱신)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const intervalId = setInterval(async () => {
      const currentToken = localStorage.getItem('token')
      if (!currentToken) return

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}` },
          }
        )
        const data = await res.json()
        const newToken = data?.data?.token
        if (newToken) {
          localStorage.setItem('token', newToken)
        }
      } catch (err) {
        console.warn('토큰 자동 갱신 실패 (무시됨):', err.message)
      }
    }, 45 * 60 * 1000) // 45분마다

    return () => clearInterval(intervalId)
  }, [])

  const fetchMembership = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/billing/membership`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setMembershipType('free')
        return
      }

      const membership = data?.data?.membership_type || 'free'
      setMembershipType(membership)
    } catch (err) {
      console.error('멤버십 조회 실패:', err)
      setMembershipType('free')
    }
  }

  const fetchRole = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      // response shape: { success, data: { member: { role } } }  or  { success, data: { role } }
      const userRole =
        data?.data?.member?.role ??
        data?.data?.role ??
        'user'
      setRole(userRole)
    } catch (err) {
      console.error('role 조회 실패:', err)
      setRole('user')
    }
  }

  const handleMenuChange = (menu) => {
    const token = localStorage.getItem('token')
    const loggedIn = !!token
    setIsLoggedIn(loggedIn)

    if (PROTECTED_MENUS.includes(menu) && !loggedIn) {
      alert('로그인 후 이용할 수 있습니다.')
      window.location.hash = 'Dashboard'
      setActiveMenu('Dashboard')
      return
    }

    window.location.hash = menu
    setActiveMenu(menu)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderContent = () => {
    const token = localStorage.getItem('token')
    const loggedIn = !!token

    switch (activeMenu) {
      case 'Dashboard':
        return <Dashboard />
      case 'Education':
        return <Education />
      case 'Quiz':
        return loggedIn ? <Quiz /> : <Dashboard />
      case 'Stocks':
        return loggedIn ? <Stocks /> : <Dashboard />
      case 'Ranking':
        return <Ranking />
      case 'Billing':
        return (
          <Billing
            membershipType={membershipType}
            setMembershipType={setMembershipType}
          />
        )
      case 'FAQ':
        return <FAQPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`main-body
      ${navCollapsed ? ' nav-collapsed' : ''}
      ${profileCollapsed ? 'profile-collapsed' : ''}`
    }>

      <aside className='navigation-area'>
        <Navigation
          setActiveMenu={handleMenuChange}
          activeMenu={activeMenu}
          membershipType={membershipType}
          collapsed={navCollapsed}
          setCollapsed={setNavCollapsed}
          role={role}
        />
      </aside>

      <main className='content-area'>
        {renderContent()}
      </main>

      <aside className='profile-area'>
        <Profile
          collapsed={profileCollapsed}
          setCollapsed={setProfileCollapsed}
        />
      </aside>
    </div>
  )
}

export default Main