import React from 'react'
import './Footer.css'
import finsight from '../assets/finsight.svg'

const Footer = () => {
  return (
    <div className='footer'>
      <img src={finsight} alt="logo" className='footer-logo'/>
      <div className='footer-description'>
        <div className='footer-liner'>
          <span>이용약관</span>
          <span>개인정보처리</span>
        </div>
        <p>© 2026 FinSight. All Rights Reserved</p>
      </div>
    </div>
  )
}

export default Footer