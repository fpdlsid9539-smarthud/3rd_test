import React, { useEffect, useState } from 'react'
import profile from '../assets/chicken running machine.gif'
import './Dashboard.css'
import { api } from '../config/api'
import bronze from '../assets/icons/ranked/bronze.png'
import silver from '../assets/icons/ranked/silver.png'
import gold from '../assets/icons/ranked/gold.png'
import diamond from '../assets/icons/ranked/diamond.png'

const Dashboard = () => {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await api.get('/api/auth/me')
        setMember(data.data.member)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return <div className='dash-container'>대시보드 불러오는 중...</div>
  }

  if (error) {
    return <div className='dash-container'>오류: {error}</div>
  }

  return (
    <div className='dash-container'>
      {/* breadcrumb */}
      <div className='breadcrumb'>대시보드</div>
      <div className='dash-title'>
        <h1>어서오세요, <strong>{member?.nickname || '사용자'}</strong>님!</h1>
        <p>일일 퀘스트 <span className='daily-percent'>0% 달성했어요!</span></p>
      </div>
      {/* content */}
      <div className='dash-master'> {/* grid */}
        <div>
          <div className='dash-slave'>
            <div className='dash-box'>
              <span>⏰진행 현황</span>
              <div className='dash-tool'>
                <div className='tool-box'>
                  <span>📋퀘스트 현황</span>
                  <canvas className='dash-quest'></canvas>
                </div>
                <div className='tool-box'>
                  <span>🎯ISR 지표</span>
                  <canvas className='dash-isr'></canvas>
                </div>
              </div>
            </div>

            {/* stocks */}
            <div className='dash-thread'>
              <div className='dash-box'>
                <span>💖찜한 주식</span>
                <div className='stock-box'>
                  <ul className='stock-list'>
                    <li className='stock-item'>
                      <p>stock_name</p>
                      <p>주식금액</p>
                      <p>변동금액</p>
                      <p>변동률</p>
                    </li>
                  </ul>
                </div>
              </div>
              <div className='dash-box'>
                <span>💹보유 주식</span>
                <div className='stock-box'>
                  <ul className='stock-list'>
                    <li className='stock-item'>
                      <p>stock_name</p>
                      <p>주식금액</p>
                      <p>변동금액</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ranks */}
        <div className='dash-rank'>
          <span>🏆리그 순위표</span>
          <div className='rank-box'>
            <ul className='rank-league'>
              <li className='league'>
                <img src={bronze} alt="브론즈 티어" className='league-badge' />
              </li>
              <li className='league'>
                <img src={silver} alt="실버 티어" className='league-badge' />
              </li>
              <li className='league'>
                <img src={gold} alt="골드 티어" className='league-badge' />
              </li>
              <li className='league'>
                <img src={diamond} alt="다이아 티어" className='league-badge' />
              </li>
            </ul>
            {/* league list */}
            <ul className='rank-list'>
              <li className='rank-item'>
                <div className='item-profile'>
                  <div className='rank-num'>1</div>
                  <img src={profile} alt="account_image" className='rank-profile' />
                  <span>{member?.nickname || 'nickname'}</span>
                </div>
                <div className='rank-num'>{member?.points ?? 0}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard