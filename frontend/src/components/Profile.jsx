import React from 'react'
import './Profile.css'
import notification from '../assets/icons/notification.svg'
import account from '../assets/icons/account.svg'
import logout from '../assets/icons/logout.svg'
import profile from '../assets/chicken running machine.gif'
import vivereBeginner from '../assets/icons/achievement/vivere_beginner.png'

const Profile = () => {
  return (
    <div className='profile'>
      <div className='profile-content'>
        <div className='profile-set'>
          <img src={notification} alt="notification" className='icons set-icons' />
          <img src={account} alt="account" className='icons set-icons' />
          <img src={logout} alt="logout" className='icons set-icons' />
        </div>
        <div className='profile-master'>
          <div className='profile-account'>
            <img src={profile} alt="profile image" className='profile-pic' />
            <div className='profile-premium'>👑</div>
          </div>
          <h2 className='profile-name'>Vivere</h2>
          <div className='profile-stats'>
            <div className='stats-description'>
              <span className='description-top'>브론즈</span>
              <p>99</p>
            </div>
            <hr />
            <div className='stats-description'>
              <span className='description-top'>ISR</span>
              <p>isr_score</p>
            </div>
          </div>
        </div>
        <div className='total-description'>
          <span className='description-top'>시즌 누적 포인트</span>
          <p className='description-slave'>21,421<span>pt</span></p>
        </div>
        <div className='profile-stock'>
          <h2>투자 현황</h2>
          <div className='stock-list'>
            <div className='stock-content'>
              <span className='description-top'>원금</span>
              <p className='description-slave'>16,567<span>pt</span></p>
            </div>
            <div className='stock-content'>
              <span className='description-top'>총수익</span>
              <p className='description-slave gain'>1,967<span>pt</span></p>
            </div>
            <div className='stock-content'>
              <span className='description-top'>수익률</span>
              <p className='description-slave gain'>11.8<span>%</span></p>
            </div>
          </div>
        </div>
        <div className='profile-stock'>
          <h2>달성한 업적</h2>
          <div className='achievment-list'>
            <div className='achievment-item'>
              <img src={vivereBeginner} alt="achievments" className='img-block' />
              <div className='achievment-description'>
                <p className='description-slave'>Vivere 주린이</p>
                <span className='description-top'>기본 지급 칭호</span>
              </div>
            </div>
            <div className='achievment-item'>
              <img src={vivereBeginner} alt="achievments" className='img-block' />
              <div className='achievment-description'>
                <p className='description-slave'>Vivere 주린이</p>
                <span className='description-top'>기본 지급 칭호</span>
              </div>
            </div>
            <div className='achievment-item'>
              <img src={vivereBeginner} alt="achievments" className='img-block' />
              <div className='achievment-description'>
                <p className='description-slave'>Vivere 주린이</p>
                <span className='description-top'>기본 지급 칭호</span>
              </div>
            </div>
            <div className='achievment-item'>
              <img src={vivereBeginner} alt="achievments" className='img-block' />
              <div className='achievment-description'>
                <p className='description-slave'>Vivere 주린이</p>
                <span className='description-top'>기본 지급 칭호</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile