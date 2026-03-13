import React, { useState } from 'react'
import './Main.css'
import Navigation from './Navigation'
import Dashboard from './Dashboard'
import Profile from './Profile'
import Education from './Education'
import Quiz from './QuizPage'
import Stocks from './Stocks'
import Ranking from './Ranking'


const Main = () => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const renderContent = () => {
    switch (activeMenu) {
      case 'Dashboard': return <Dashboard />;
      case 'Education': return <Education />;
      case 'Quiz': return <Quiz />;
      case 'Stocks': return <Stocks />;
      case 'Ranking': return <Ranking />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className='main-body'>
      <Navigation setActiveMenu={setActiveMenu}/>

      <div className="content-area">
        {renderContent()}
      </div>
      
      <Profile />
    </div>
  )
}

export default Main