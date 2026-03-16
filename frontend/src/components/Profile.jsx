import React, { useEffect, useState } from 'react'
import './Profile.css'
import notification from '../assets/icons/notification.svg'
import account from '../assets/icons/account.svg'
import logout from '../assets/icons/logout.svg'
import profile from '../assets/chicken running machine.gif'
import vivereBeginner from '../assets/icons/achievement/vivere_beginner.png'

const BACKEND_URL = 'http://localhost:5000'

const Profile = () => {
  const [member, setMember] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl)
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }

    const token = localStorage.getItem('token')

    if (!token) {
      setError('로그인 토큰이 없습니다.')
      setLoading(false)
      return
    }

    fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.message || '사용자 정보를 불러오지 못했습니다.')
        }

        setMember(data.data.member)
        setRecentAchievements(data.data.recentAchievements || [])
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // 💡 출입증(토큰)을 찢어버리는 로그아웃 함수
  const handleLogout = () => {
    // 1. 브라우저 지갑(localStorage)에서 'token'을 완전히 삭제합니다.
    localStorage.removeItem('token');
    
    // (선택) 아까 App.jsx에서 닉네임이나 다른 걸 저장했다면 같이 지워줍니다.
    // localStorage.removeItem('nickname'); 

    alert('안전하게 로그아웃 되었습니다! 👋');

    // 2. 화면을 아예 새로고침해서 맨 처음(Landing 또는 Login)으로 쫓아냅니다.
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