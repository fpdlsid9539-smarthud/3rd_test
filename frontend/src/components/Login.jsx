import React from 'react'
import './Login.css'
import logoLong from '../assets/logo-long.svg'

const BACKEND_URL = 'http://localhost:5000'

const Login = () => {
  const handleKakaoLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/kakao`
  }

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`
  }

  return (
    <div className='login'>
      <div className='login-container'>
        <img src={logoLong} alt="logo-long" className='login-logo' />

        <div className='login-description'>
          서비스 사용을 위해서는 소셜 로그인만 가능합니다.
        </div>

        <div>
          <button
            type="button"
            className='kakao_btn'
            onClick={handleKakaoLogin}
          >
            카카오로 시작하기
          </button>

          <div className='login-divide'>
            <div className='divide-slave' />
            <span>또는</span>
            <div className='divide-slave' />
          </div>

          <button
            type="button"
            className='join-btn'
            onClick={handleGoogleLogin}
          >
            구글로 시작하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login