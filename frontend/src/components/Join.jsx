import React, { useState } from 'react'
import api from '../config/axios';
import './Join.css'
import kakao from '../assets/kakao.svg'
import google from '../assets/google.svg'
import home from '../assets/icons/home.svg'
import service from '../assets/icons/bar-chart.svg'
import contact from '../assets/icons/mail.svg'

const Join = () => {

  return (
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
          가입 또는 로그인이 필요합니다.
        </p>
        <button className='kakao_btn'>
          <img src={kakao} alt="카카오" />
          <span>카카오로 시작하기</span>
        </button>
        <button className='google_btn'>
          <img src={google} alt="카카오" />
          <span>구글로 시작하기</span>
        </button>
      </div>
    </aside>
  )
}

export default Join