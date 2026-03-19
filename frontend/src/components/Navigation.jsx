import React, { useEffect, useState } from 'react'
import './Navigation.css'
import logoLong from '../assets/logo-long.svg'
import dashboard from '../assets/icons/dashboard.svg'
import education from '../assets/icons/education.svg'
import strategy from '../assets/icons/strategy.svg'
import arrowDown from '../assets/icons/arrow-down-line.svg'
import rank from '../assets/icons/rank.svg'

const Navigation = ({ setActiveMenu, activeMenu, membershipType }) => {
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
    <aside className='navigation'>
      <nav className='nav-content'>
        <button
          type='button'
          className='nav-logo-button'
          onClick={() => setActiveMenu('Dashboard')}
          aria-label='대시보드로 이동'
        >
          <img src={logoLong} alt='logo' className='nav-logo' />
        </button>

        <ul className='nav-list'>
          <li
            className={`nav-menu ${activeMenu === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Dashboard')}
          >
            <div className='nav-line'>
              <img src={dashboard} alt='Dashboard' className='icons icon-btn' />
              <span>대시보드</span>
            </div>
          </li>

          <li
            className={`nav-menu ${activeMenu === 'Education' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Education')}
          >
            <div className='nav-line'>
              <img src={education} alt='Education' className='icons icon-btn' />
              <span>교육실</span>
            </div>
          </li>

          <li className={`nav-mixed ${open ? 'open' : ''}`}>
            <div
              className={`nav-menu ${isStrategyOpen ? 'active' : ''}`}
              onClick={() => setOpen(!open)}
            >
              <div className='nav-line'>
                <img src={strategy} alt='Strategy Room' className='icons icon-btn' />
                <span>전략실</span>
              </div>
              <img src={arrowDown} alt='collapsed' className='arrow' />
            </div>

            <ul className='sub-list'>
              <li
                className={`line-item ${activeMenu === 'Quiz' ? 'active' : ''}`}
                onClick={() => setActiveMenu('Quiz')}
              >
                <div className='sub-item' />
                <span>퀴즈</span>
              </li>

              <li
                className={`line-item ${activeMenu === 'Stocks' ? 'active' : ''}`}
                onClick={() => setActiveMenu('Stocks')}
              >
                <div className='sub-item' />
                <span>주식</span>
              </li>
            </ul>
          </li>

          <li
            className={`nav-menu ${activeMenu === 'Ranking' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Ranking')}
          >
            <div className='nav-line'>
              <img src={rank} alt='Ranking' className='icons icon-btn' />
              <span>랭킹</span>
            </div>
          </li>

          <li className='billing-action-wrap'>
            <button
              type='button'
              className={`billing-nav-button ${isPremium ? 'disabled' : ''}`}
              onClick={() => {
                if (isMembershipLoaded && !isPremium) {
                  setActiveMenu('Billing')
                }
              }}
              disabled={!isMembershipLoaded || isPremium}
            >
              {!isMembershipLoaded
                ? '확인 중...'
                : isPremium
                ? '프리미엄 이용 중'
                : '결제하기'}
            </button>

            {isPremium && (
              <>
                <p className='billing-nav-message'>이미 프리미엄 회원입니다.</p>
                <button
                  type='button'
                  className='billing-cancel-mini-btn'
                  onClick={handleCancel}
                >
                  구독취소
                </button>
              </>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Navigation