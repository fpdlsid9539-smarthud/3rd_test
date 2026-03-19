import React, { useEffect, useMemo, useState } from 'react'
import profile from '../assets/chicken running machine.gif'
import './Dashboard.css'
import { api } from '../config/api'
import bronze from '../assets/icons/ranked/bronze.png'
import silver from '../assets/icons/ranked/silver.png'
import gold from '../assets/icons/ranked/gold.png'
import diamond from '../assets/icons/ranked/diamond.png'

const EMPTY_ISR = {
  accuracy: 0,
  risk: 0,
  stability: 0,
  discipline: 0,
  strategy: 0,
  adaptability: 0,
  isr: 0,
}

const EMPTY_QUEST = {
  todaySolved: 0,
  todayCorrect: 0,
  totalSolved: 0,
  totalCount: 0,
  accuracy: 0,
  dailyGoal: 3,
  dailyPercent: 0,
}

const Dashboard = () => {
  const [member, setMember] = useState(null)
  const [likedStocks, setLikedStocks] = useState([])
  const [ownedStocks, setOwnedStocks] = useState([])
  const [rankingList, setRankingList] = useState([])
  const [isrData, setIsrData] = useState(EMPTY_ISR)
  const [questStatus, setQuestStatus] = useState(EMPTY_QUEST)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          memberRes,
          likedRes,
          ownedRes,
          isrRes,
          rankingRes,
          questRes,
        ] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/stocks/liked'),
          api.get('/api/stocks/owned'),
          api.get('/api/isr/me'),
          api.get('/api/ranking'),
          api.get('/api/quiz/status/me'),
        ])

        if (memberRes.status === 'fulfilled') {
          const payload = memberRes.value
          const memberData =
            payload?.data?.member ||
            payload?.data ||
            payload?.member ||
            null

          setMember(memberData)
        } else {
          setMember(null)
        }

        if (likedRes.status === 'fulfilled') {
          const payload = likedRes.value
          const likedData = payload?.data || payload?.stocks || []
          setLikedStocks(Array.isArray(likedData) ? likedData : [])
        } else {
          setLikedStocks([])
        }

        if (ownedRes.status === 'fulfilled') {
          const payload = ownedRes.value
          const ownedData = payload?.data || payload?.stocks || []
          setOwnedStocks(Array.isArray(ownedData) ? ownedData : [])
        } else {
          setOwnedStocks([])
        }

        if (isrRes.status === 'fulfilled') {
          const payload = isrRes.value
          const rawIsr = payload?.data || payload?.isr || EMPTY_ISR

          setIsrData({
            accuracy: Number(rawIsr?.accuracy || 0),
            risk: Number(rawIsr?.risk || 0),
            stability: Number(rawIsr?.stability || 0),
            discipline: Number(rawIsr?.discipline || 0),
            strategy: Number(rawIsr?.strategy || 0),
            adaptability: Number(rawIsr?.adaptability || 0),
            isr: Number(rawIsr?.isr || 0),
          })
        } else {
          setIsrData(EMPTY_ISR)
        }

        if (rankingRes.status === 'fulfilled') {
          const payload = rankingRes.value
          const rankingData = payload?.data || {}
          const leagues = rankingData?.leagues || {}

          const mergedRanking = [
            ...(leagues.diamond || []),
            ...(leagues.gold || []),
            ...(leagues.silver || []),
            ...(leagues.bronze || []),
          ]

          setRankingList(Array.isArray(mergedRanking) ? mergedRanking : [])
        } else {
          setRankingList([])
        }

        if (questRes.status === 'fulfilled') {
          const payload = questRes.value
          const questData = payload?.data || {}

          setQuestStatus({
            todaySolved: Number(questData.todaySolved || 0),
            todayCorrect: Number(questData.todayCorrect || 0),
            totalSolved: Number(questData.totalSolved || 0),
            totalCount: Number(questData.totalCount || 0),
            accuracy: Number(questData.accuracy || 0),
            dailyGoal: Number(questData.dailyGoal || 3),
            dailyPercent: Number(questData.dailyPercent || 0),
          })
        } else {
          setQuestStatus(EMPTY_QUEST)
        }

        if (memberRes.status === 'rejected') {
          throw memberRes.reason
        }
      } catch (err) {
        console.error('대시보드 로딩 에러 =', err)
        setError(err.message || '대시보드 로딩 실패')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const formatNumber = (value) => {
    const num = Number(value || 0)
    return num.toLocaleString('ko-KR')
  }

  const formatSignedNumber = (value) => {
    const num = Number(value || 0)
    const prefix = num > 0 ? '+' : ''
    return `${prefix}${num.toLocaleString('ko-KR')}`
  }

  const formatSignedPercent = (value) => {
    const num = Number(value || 0)
    const prefix = num > 0 ? '+' : ''
    return `${prefix}${num.toFixed(2)}%`
  }

  const formatScore = (value) => {
    return Number(value || 0).toFixed(2)
  }

  const isrItems = useMemo(
    () => [
      { key: 'accuracy', label: 'Accuracy', value: isrData.accuracy },
      { key: 'risk', label: 'Risk', value: isrData.risk },
      { key: 'stability', label: 'Stability', value: isrData.stability },
      { key: 'discipline', label: 'Discipline', value: isrData.discipline },
      { key: 'strategy', label: 'Strategy', value: isrData.strategy },
      { key: 'adaptability', label: 'Adaptability', value: isrData.adaptability },
    ],
    [isrData]
  )

  const todaySolvedDisplay = Math.min(
    Number(questStatus.todaySolved || 0),
    Number(questStatus.dailyGoal || 3)
  )

  if (loading) {
    return <div className='dash-container'>대시보드 불러오는 중...</div>
  }

  if (error) {
    return <div className='dash-container'>오류: {error}</div>
  }

  return (
    <div className='dash-container'>
      <div className='breadcrumb'>대시보드</div>

      <div className='dash-title'>
        <h1>
          어서오세요, <strong>{member?.nickname || '사용자'}</strong>님!
        </h1>
        <p>
          일일 퀘스트{' '}
          <span className='daily-percent'>
            {Number(questStatus.dailyPercent || 0).toFixed(2)}% 달성했어요!
          </span>
        </p>
      </div>

      <div className='dash-master'>
        <div>
          <div className='dash-slave'>
            <div className='dash-box'>
              <span>⏰진행 현황</span>
              <div className='dash-tool'>
                <div className='tool-box'>
                  <span>📋퀘스트 현황</span>
                  <div className='quest-status-box'>
                    <div className='quest-summary'>
                      <div className='quest-summary-label'>오늘 달성률</div>
                      <div className='quest-summary-score'>
                        {Number(questStatus.dailyPercent || 0).toFixed(2)}%
                      </div>
                      <div className='quest-summary-desc'>
                        오늘 {questStatus.dailyGoal}문제 목표 기준
                      </div>
                    </div>

                    <ul className='quest-list'>
                      <li className='quest-item'>
                        <span>오늘 푼 퀴즈</span>
                        <strong>
                          {todaySolvedDisplay} / {questStatus.dailyGoal}
                        </strong>
                      </li>

                      <li className='quest-item'>
                        <span>오늘 정답 수</span>
                        <strong>{questStatus.todayCorrect}</strong>
                      </li>

                      <li className='quest-item'>
                        <span>누적 풀이 수</span>
                        <strong>
                          {questStatus.totalSolved} / {questStatus.totalCount}
                        </strong>
                      </li>

                      <li className='quest-item'>
                        <span>누적 정답률</span>
                        <strong>
                          {Number(questStatus.accuracy || 0).toFixed(2)}%
                        </strong>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className='tool-box'>
                  <span>🎯ISR 지표</span>
                  <div className='isr-summary'>
                    <div className='isr-summary-label'>현재 ISR</div>
                    <div className='isr-summary-score'>{formatScore(isrData.isr)}</div>
                    <div className='isr-summary-desc'>
                      판단력·생존력·성과 품질·행동 통제력·사고 체계·시장 대응력 종합
                    </div>
                  </div>

                  <ul className='isr-list'>
                    {isrItems.map((item) => (
                      <li key={item.key} className='isr-item'>
                        <div className='isr-item-top'>
                          <span className='isr-name'>{item.label}</span>
                          <span className='isr-value'>{formatScore(item.value)}</span>
                        </div>
                        <div className='isr-bar'>
                          <div
                            className='isr-bar-fill'
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, Number(item.value || 0))
                              )}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className='dash-thread'>
              <div className='dash-box'>
                <span>💖찜한 주식</span>
                <div className='stock-box'>
                  <ul className='stock-list'>
                    <li className='stock-item stock-head liked-grid'>
                      <p>주식</p>
                      <p>금액</p>
                      <p>변동</p>
                    </li>
                    {likedStocks.length === 0 ? (
                      <li className='stock-empty'>찜한 주식이 없습니다.</li>
                    ) : (
                      likedStocks.map((stock) => (
                        <li
                          key={stock.id || stock.stockCode}
                          className='stock-item stock-head liked-grid'
                        >
                          <p>{stock.stockName || stock.stockCode}</p>
                          <p>{formatNumber(stock.price)}</p>
                          <p>{formatSignedNumber(stock.change)}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className='dash-box'>
                <span>💹보유 주식</span>
                <div className='stock-box'>
                  <ul className='stock-list'>
                    <li className='stock-item stock-head liked-grid'>
                      <p>주식</p>
                      <p>원금</p>
                      <p>변동</p>
                      <p>변동률</p>
                    </li>
                    {ownedStocks.length === 0 ? (
                      <li className='stock-empty'>보유 주식이 없습니다.</li>
                    ) : (
                      ownedStocks.map((stock) => (
                        <li
                          key={stock.id || stock.stockCode}
                          className='stock-item owned-grid'
                        >
                          <p>{stock.stockName || stock.stockCode}</p>
                          <p>{formatNumber(stock.totalPrice)}</p>
                          <p>{formatSignedNumber(stock.changeAmount)}</p>
                          <p>{formatSignedPercent(stock.changeRate)}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='dash-rank'>
          <span>🏆리그 순위표</span>
          <div className='rank-box'>
            <ul className='rank-league'>
              <li className='league'>
                <img src={bronze} alt='브론즈 티어' className='league-badge' />
              </li>
              <li className='league'>
                <img src={silver} alt='실버 티어' className='league-badge' />
              </li>
              <li className='league'>
                <img src={gold} alt='골드 티어' className='league-badge' />
              </li>
              <li className='league'>
                <img src={diamond} alt='다이아 티어' className='league-badge' />
              </li>
            </ul>

            <ul className='rank-list'>
              {rankingList.length === 0 ? (
                <li className='stock-empty'>랭킹 데이터가 없습니다.</li>
              ) : (
                rankingList.slice(0, 7).map((rankMember, index) => (
                  <li key={rankMember.memberId} className='rank-item'>
                    <div className='item-profile'>
                      <div className='rank-num'>{index + 1}</div>
                      <img
                        src={rankMember.profileImage || profile}
                        alt='account_image'
                        className='rank-profile'
                      />
                      <span>{rankMember.nickname || '사용자'}</span>
                    </div>
                    <div className='rank-num'>
                      {formatNumber(rankMember.points)}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard