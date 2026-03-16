import React, { useState } from 'react'
import './Login.css'
import logoLong from '../assets/logo-long.svg'

const Login = ({ setPage }) => {

  const [id, setId] = useState('')
  const [pw, setPw] = useState('')

  const handleKakaoLogin = (e) => {
    e.preventDefault();
    window.location.href = `http://localhost:5173/auth/kakao`
  }

  return (
    <div className='login'>
      <form className='login-container'>
        <img src={logoLong} alt="logo-long" className='login-logo' />
        <div className='login-type'>
          <div className='login-id'>
            <input type="text"
              className='login-input'
              value={id}
              placeholder='카카오메일 아이디, 이메일, 전화번호'
              onChange={e => setId(e.target.value)} />
            <span><strong>TIP</strong> 카카오메일이 있다면 메일 아이디만 입력해 보세요.</span>
          </div>
          <input type="password"
            className='login-input'
            value={pw}
            placeholder='비밀번호'
            onChange={e => setPw(e.target.value)} />
        </div>

        <div className=''>
          <button
            type="button"
            className='kakao_btn'
            alt="Login"
            onClick={handleKakaoLogin}
          >
            로그인
          </button>

          <div className='login-divide'>
            <div className='divide-slave' />
            <span>또는</span>
            <div className='divide-slave' />
          </div>

          <button
            type="button"
            className='join-btn'
            alt="Join"
            onClick={() => setPage('main')}
          >
            회원가입
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login