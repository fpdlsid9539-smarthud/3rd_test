import React from 'react'
import profile from '../assets/chicken running machine.gif'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className='dash-container'>
      {/* breadcrumb */}
      <div className='breadcrumb'>대시보드</div>
      <div className='dash-title'>
        <h1>어서오세요, <strong>Vivere</strong>님!</h1>
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
                브론즈 <img src="" alt="" />
              </li>
              <li className='league'>
                실버 <img src="" alt="" />
              </li>
              <li className='league'>
                골드 <img src="" alt="" />
              </li>
              <li className='league'>
                다이아 <img src="" alt="" />
              </li>
            </ul>
            {/* league list */}
            <ul className='rank-list'>
              <li className='rank-item'>
                <div className='item-profile'>
                  <div className='rank-num'>1</div>
                  <img src={profile} alt="account image" className='rank-profile' />
                  <span>nickname</span>
                </div>
                <div className='rank-num'>score</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard