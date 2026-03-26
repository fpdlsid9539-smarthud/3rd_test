import React, { useEffect, useState } from 'react'
import './Navigation.css'
import logoLong from '../assets/finsight.svg'
import dashboard from '../assets/icons/dashboard.svg'
import collapse_menu from '../assets/icons/collapse_menu.svg'
import education from '../assets/icons/education.svg'
import card from '../assets/icons/card.svg'
import rank from '../assets/icons/rank.svg'
import quiz from '../assets/icons/quiz.svg'
import stocks from '../assets/icons/stocks.svg'
import faq from '../assets/icons/megaphone.svg'

const Navigation = ({
  setActiveMenu,
  activeMenu,
  membershipType,
  collapsed,
  setCollapsed,
  role,
}) => {
  const isStrategyOpen = activeMenu === 'Quiz' || activeMenu === 'Stocks'
  const [open, setOpen] = useState(isStrategyOpen)

  const isPremium = membershipType === 'premium'
  const isMembershipLoaded = membershipType !== null

  useEffect(() => {
    if (isStrategyOpen) {
      setOpen(true)
    }
  }, [isStrategyOpen])

  const handleCancel = async () => {
    const confirmed = window.confirm('정말 구독취소하시겠습니까?')
    if (!confirmed) return

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      const res = await fetch('http://localhost:5000/api/billing/premium/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const contentType = res.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        throw new Error('구독취소 API 응답이 올바르지 않습니다. 서버를 다시 확인해주세요.')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '구독취소 실패')
      }

      alert(data.message || '구독취소가 되었습니다.')
      window.location.reload()
    } catch (err) {
      alert(err.message || '오류가 발생했습니다.')
    }
  }

  return (
    <aside className={`navigation${collapsed ? ' collapsed' : ''}`}>
      <nav className='nav-content'>
        <div className='nav-wrapper'>
          <div className='nav-header'>
            <button
              type='button'
              className='nav-logo-button'
              onClick={() => setActiveMenu('Dashboard')}
              aria-label='대시보드로 이동'
            >
              <img src={logoLong} alt='logo' className='nav-logo' />
            </button>

            <button
              type='button'
              className='collapse-button'
              onClick={() => {
                const next = !collapsed
                localStorage.setItem('nav_collapsed', next)
                setCollapsed(next)
              }}
              aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
            >
              <img src={collapse_menu} alt='collapse menu' className='collapse-menu' />
            </button>
          </div>

          <ul className='nav-list'>
            <li
              className={`nav-menu ${activeMenu === 'Dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('Dashboard')}
              title={collapsed ? '대시보드' : undefined}
            >
              <div className='nav-line'>
                <img src={dashboard} alt='Dashboard' className='icons icon-btn' />
                <span>대시보드</span>
              </div>
            </li>

            <li
              className={`nav-menu ${activeMenu === 'Education' ? 'active' : ''}`}
              onClick={() => setActiveMenu('Education')}
              title={collapsed ? '교육실' : undefined}
            >
              <div className='nav-line'>
                <img src={education} alt='Education' className='icons icon-btn' />
                <span>교육실</span>
              </div>
            </li>

            <li
              className={`nav-menu ${activeMenu === 'Quiz' ? 'active' : ''}`}
              onClick={() => setActiveMenu('Quiz')}
              title={collapsed ? '퀴즈' : undefined}
            >
              <div className='nav-line'>
                <img src={quiz} alt='퀴즈' className='icons icon-btn' />
                <span>퀴즈</span>
              </div>
            </li>

            <li
              className={`nav-menu ${activeMenu === 'Stocks' ? 'active' : ''}`}
              onClick={() => setActiveMenu('Stocks')}
              title={collapsed ? '주식' : undefined}
            >
              <div className='nav-line'>
                <img src={stocks} alt='주식' className='icons icon-btn' />
                <span>주식</span>
              </div>
            </li>

            <li
              className={`nav-menu ${activeMenu === 'Ranking' ? 'active' : ''}`}
              onClick={() => setActiveMenu('Ranking')}
              title={collapsed ? '랭킹' : undefined}
            >
              <div className='nav-line'>
                <img src={rank} alt='Ranking' className='icons icon-btn' />
                <span>랭킹</span>
              </div>
            </li>

            <li
              className={`nav-menu ${activeMenu === 'FAQ' ? 'active' : ''}`}
              onClick={() => setActiveMenu('FAQ')}
              title={collapsed ? 'FAQ' : undefined}
            >
              <div className='nav-line'>
                <img src={faq} alt='FAQ' className='icons icon-btn' />
                <span>FAQ</span>
              </div>
            </li>
          </ul>
        </div>

        <div className='billing-nav'>
          <div className='billing-action-wrap'>
            <button
              type='button'
              className={`billing-nav-button ${isPremium ? 'disabled' : ''}`}
              onClick={() => {
                if (isMembershipLoaded && !isPremium) {
                  setActiveMenu('Billing')
                } else {
                  handleCancel()
                }
              }}
            >
              {!isMembershipLoaded
                ? '확인 중...'
                : isPremium
                  ? '구독 취소'
                  : (
                    <>
                      <img src={card} alt='결제' className='icons' />
                      <span>구독하기</span>
                    </>
                  )}
            </button>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default Navigation