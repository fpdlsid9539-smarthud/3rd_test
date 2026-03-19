import React from 'react'
import './Landing.css'
import kakao from '../assets/kakao.svg'
import google from '../assets/google.svg'
import home from '../assets/icons/home.svg'
import service from '../assets/icons/bar-chart.svg'
import contact from '../assets/icons/mail.svg'
import Footer from './Footer'
import finsight from '../assets/finsight.svg'
import idk from '../assets/idk.jpg'

const BACKEND_URL = 'http://localhost:5000'

const Landing = () => {
  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('member')
    localStorage.removeItem('nickname')
    sessionStorage.clear()
  }

  const handleKakaoLogin = () => {
    clearAuth()
    window.location.href = `${BACKEND_URL}/api/auth/kakao`
  }

  const handleGoogleLogin = () => {
    clearAuth()
    window.location.href = `${BACKEND_URL}/api/auth/google`
  }

  return (
    <div>
      <div className='container'>
        <main>
          <div className='title'>
            <img src={finsight} alt="logo" className='logo' />
            <h1>투자를 게임처럼 배우다!</h1>
          </div>

          <div className='title-description'>
            <p>주식 차트 분석, 투자 판단, 그리고 나만의 투자 성향 분석까지.</p>
            <p>실전 데이터를 기반으로 투자 감각을 훈련하는 금융 트레이닝 플랫폼입니다.</p>
          </div>

          <div className='intro-container'>
            <img src={idk} alt="ikd" className='landing-idk' />
            <div className='intro-title'>
              <h2>많은 사람들이 투자에 관심이 있지만</h2>
              <div className='intro-description'>
                <ul>
                  <li>어디서부터 시작해야 할지 모르고</li>
                  <li>차트와 용어가 어렵고</li>
                  <li>실제 돈을 투자하기에는 부담스럽습니다.</li>
                </ul>
                <p>그래서 투자를 안전하게 연습할 수 있는 공간을 만들었습니다.</p>
              </div>
            </div>
          </div>

          <div>
            <div className='ad-flex'>
              <div className='ad-title'>
                <h2>게임처럼 성장하세요</h2>
                <div className='intro-description'>
                  <p>이 플랫폼은 단순한 학습 사이트가 아닙니다.</p>
                  <ul>
                    <li>포인트를 모으고,</li>
                    <li>투자 판단을 연습하고,</li>
                    <li>랭킹에 도전할 수 있습니다.</li>
                  </ul>
                  <p>목표는 단 하나, <strong>더 나은 투자 판단 능력 만들기.</strong></p>
                </div>
              </div>

              <div className='ad-title'>
                <h2>실제 돈은 사용하지 않습니다!</h2>
                <div className='intro-description'>
                  <p>이 플랫폼은 투자 연습을 위한 트레이닝 공간입니다.</p>
                  <ul>
                    <li>실제 돈 사용 없음.</li>
                    <li>위험 없는 투자 연습하기.</li>
                    <li>데이터 기반 학습하기.</li>
                  </ul>
                  <p>실수를 통해 배우고 투자 감각을 키워보세요.</p>
                </div>
              </div>
            </div>

            <div className='ad-title'>
              <h2>당신의 투자 성향은 어떤 모습인가요?</h2>
              <div className='ad-description'>
                <p>지금 시작하고 나만의 투자 성향 카드를 만들어보세요.</p>
              </div>
            </div>
          </div>
        </main>

        <aside className='floating-nav'>
          <div className='landing-navigation'>
            <div className='landing-navigation-menu'>
              <img src={home} alt="home" className='landing-menu' />
              <p>홈</p>
            </div>
            <div className='landing-navigation-menu'>
              <img src={service} alt="service" className='landing-menu' />
              <p>서비스</p>
            </div>
            <div className='landing-navigation-menu'>
              <img src={contact} alt="contact" className='landing-menu' />
              <p>연락</p>
            </div>
          </div>

          <div className='box'>
            <p>
              서비스 사용을 위해서는
              <br />
              소셜 로그인이 필요합니다.
            </p>

            <button className='kakao_btn' onClick={handleKakaoLogin}>
              <img src={kakao} alt="카카오" />
              <span>카카오로 시작하기</span>
            </button>

            <button className='google_btn' onClick={handleGoogleLogin}>
              <img src={google} alt="구글" />
              <span>구글로 시작하기</span>
            </button>
          </div>
        </aside>
      </div>

      <div className='white-section' />
      <Footer />
    </div>
  )
}

export default Landing