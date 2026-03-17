import { React, useState } from 'react'
import './Navigation.css'
import logoLong from '../assets/logo-long.svg'
import dashboard from '../assets/icons/dashboard.svg'
import education from '../assets/icons/education.svg'
import strategy from '../assets/icons/strategy.svg'
import arrowDown from '../assets/icons/arrow-down-line.svg'
import rank from '../assets/icons/rank.svg'

const Navigation = ({ setActiveMenu }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className='navigation'>
      <nav className='nav-content'>
        <img src={logoLong} alt="logo" className='nav-logo' />
        <ul className='nav-list'>
          <li className='nav-menu' onClick={() => setActiveMenu('Dashboard')}>
            <div className='nav-line'>
              <img src={dashboard} alt="Dashboard" className='icons icon-btn' /><span>대시보드</span>
            </div>
          </li>
          <li className='nav-menu' onClick={() => setActiveMenu('Education')}>
            <div className='nav-line'>
              <img src={education} alt="Education" className='icons icon-btn' /><span>교육실</span>
            </div>
          </li>
          <li className={`nav-mixed ${open ? "open" : ""}`} >
            <div className='nav-menu' onClick={() => setOpen(!open)}>
              <div className='nav-line'>
                <img src={strategy} alt="Strategy Room" className='icons icon-btn' /><span>전략실</span>
              </div>
              <img src={arrowDown} alt="collapsed" className='arrow ' />
            </div>
            <ul className='sub-list'>
              <li className='line-item' onClick={() => setActiveMenu('Quiz')}>
                <div className='sub-item' /><span>퀴즈</span>
              </li>
              <li className='line-item' onClick={() => setActiveMenu('Stocks')}>
                <div className='sub-item' /><span>주식</span>
              </li>
            </ul>
          </li>
          <li className='nav-menu' onClick={() => setActiveMenu('Ranking')}>
            <div className='nav-line'>
              <img src={rank} alt="Ranking" className='icons icon-btn' /><span>랭킹</span>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Navigation