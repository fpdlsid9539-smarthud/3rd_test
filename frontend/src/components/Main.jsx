import React, { useEffect, useState } from 'react'
import './Main.css'
import Navigation from './Navigation'
import Dashboard from './Dashboard'
import Profile from './Profile'
import Education from './Education'
import Quiz from './QuizPage'
import Stocks from './Stocks'
import Ranking from './Ranking'

const Main = () => {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }

    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleMenuChange = (menu) => {
    const protectedMenus = ['Quiz', 'Stocks']

    const token = localStorage.getItem('token')
    const loggedIn = !!token
    setIsLoggedIn(loggedIn)

    if (protectedMenus.includes(menu) && !loggedIn) {
      alert('로그인 후 이용할 수 있습니다.')
      setActiveMenu('Dashboard')
      return
    }

    setActiveMenu(menu)
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
      default:
        return <Dashboard />
    }
  }

  return (
    <div className='main-body'>
      <Navigation setActiveMenu={handleMenuChange} activeMenu={activeMenu}/>

      <div className="content-area">
        {renderContent()}
      </div>

      <Profile />
    </div>
  )
}

export default Main