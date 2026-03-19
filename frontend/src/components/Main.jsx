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

const Main = () => {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [membershipType, setMembershipType] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }

    const token = localStorage.getItem('token')
    const loggedIn = !!token
    setIsLoggedIn(loggedIn)

    if (loggedIn) {
      fetchMembership(token)
    } else {
      setMembershipType(null)
    }
  }, [])

  const fetchMembership = async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/billing/membership', {
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

  const handleMenuChange = (menu) => {
    const protectedMenus = ['Quiz', 'Stocks', 'Billing']

    const token = localStorage.getItem('token')
    const loggedIn = !!token
    setIsLoggedIn(loggedIn)

    if (protectedMenus.includes(menu) && !loggedIn) {
      alert('로그인 후 이용할 수 있습니다.')
      setActiveMenu('Dashboard')
      return
    }

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
      default:
        return <Dashboard />
    }
  }

  return (
    <div className='main-body'>
      <aside className='navigation-area'>
        <Navigation
          setActiveMenu={handleMenuChange}
          activeMenu={activeMenu}
          membershipType={membershipType}
        />
      </aside>

      <main className='content-area'>
        {renderContent()}
      </main>

      <aside className='profile-area'>
        <Profile />
      </aside>
    </div>
  )
}

export default Main