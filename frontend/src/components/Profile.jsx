import React, { useEffect, useState } from 'react'
import './Profile.css'
import notification from '../assets/icons/notification.svg'
import account from '../assets/icons/account.svg'
import logout from '../assets/icons/logout.svg'
import profile from '../assets/chicken running machine.gif'
import vivereBeginner from '../assets/icons/achievement/vivere_beginner.png'
import { api } from '../config/api.js'

const Profile = () => {
  const [member, setMember] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.get('/api/auth/me')
        setMember(data.data.member)
        setRecentAchievements(data.data.recentAchievements || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = () => {
    if (!confirm("로그아웃 하시겠어요?")) return;

    localStorage.removeItem('token');
    localStorage.removeItem('member');
    localStorage.removeItem('nickname');
    sessionStorage.clear();

    alert('안전하게 로그아웃 되었습니다! 👋');
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className='profile'>
        <div className='profile-content'>불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='profile'>
        <div className='profile-content'>오류: {error}</div>
      </div>
    )
  }

  return (
    <div className='profile'>
      <div className='profile-content'>
        <div className='profile-set'>
          <img src={notification} alt="notification" className='icons set-icons' />
          <img src={account} alt="account" className='icons set-icons' />
          <img
            src={logout}
            alt="logout"
            className='icons set-icons'
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className='profile-master'>
          <div className='profile-account'>
            <img src={profile} alt="profile image" className='profile-pic' />
            <div className='profile-premium'>👑</div>
          </div>

          <h2 className='profile-name'>{member?.nickname || '사용자'}</h2>

          <div className='profile-stats'>
            <div className='stats-description'>
              <span className='description-top'>{member?.tier || '브론즈 I'}</span>
              <p>{member?.points ?? 0}</p>
            </div>
            <hr />
            <div className='stats-description'>
              <span className='description-top'>ISR</span>
              <p>{member?.isr_score ?? 0}</p>
            </div>
          </div>
        </div>

        <div className='total-description'>
          <span className='description-top'>시즌 누적 포인트</span>
          <p className='description-slave'>
            {member?.points ?? 0}
            <span>pt</span>
          </p>
        </div>

        <div className='profile-stock'>
          <h2>투자 현황</h2>
          <div className='stock-list'>
            <div className='stock-content'>
              <span className='description-top'>원금</span>
              <p className='description-slave'>0<span>pt</span></p>
            </div>
            <div className='stock-content'>
              <span className='description-top'>총수익</span>
              <p className='description-slave gain'>0<span>pt</span></p>
            </div>
            <div className='stock-content'>
              <span className='description-top'>수익률</span>
              <p className='description-slave gain'>0<span>%</span></p>
            </div>
          </div>
        </div>

        <div className='profile-stock'>
          <h2>달성한 업적</h2>
          <div className='achievment-list'>
            {recentAchievements.length > 0 ? (
              recentAchievements.map((item, index) => (
                <div className='achievment-item' key={`${item}-${index}`}>
                  <img src={vivereBeginner} alt="achievments" className='img-block' />
                  <div className='achievment-description'>
                    <p className='description-slave'>{item}</p>
                    <span className='description-top'>최근 획득 업적</span>
                  </div>
                </div>
              ))
            ) : (
              <div className='achievment-item'>
                <img src={vivereBeginner} alt="achievments" className='img-block' />
                <div className='achievment-description'>
                  <p className='description-slave'>업적 없음</p>
                  <span className='description-top'>표시할 업적이 없습니다.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile