import React, { useCallback, useEffect, useMemo, useState } from 'react'
import profile from '../assets/chicken running machine.gif'
import './Dashboard.css'
import { api } from '../config/api'
import bronze from '../assets/icons/ranked/bronze.png'
import silver from '../assets/icons/ranked/silver.png'
import gold from '../assets/icons/ranked/gold.png'
import diamond from '../assets/icons/ranked/diamond.png'
import NewsTicker from './NewsTicker'

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

const LEAGUE_META = [
  { key: 'bronze', label: '브론즈', image: bronze, alt: '브론즈 티어' },
  { key: 'silver', label: '실버', image: silver, alt: '실버 티어' },
  { key: 'gold', label: '골드', image: gold, alt: '골드 티어' },
  { key: 'diamond', label: '다이아', image: diamond, alt: '다이아 티어' },
]

const Dashboard = () => {
  const [member, setMember] = useState(null)
  const [likedStocks, setLikedStocks] = useState([])
  const [ownedStocks, setOwnedStocks] = useState([])
  const [rankingList, setRankingList] = useState([])
  const [leagueRanks, setLeagueRanks] = useState({
    bronze: [],
    silver: [],
    gold: [],
    diamond: [],
  })
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [isrData, setIsrData] = useState(EMPTY_ISR)
  const [questStatus, setQuestStatus] = useState(EMPTY_QUEST)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getResponseData = (response) => {
    return response?.data?.data ?? response?.data ?? null
  }

  const toArray = (response) => {
    const data = getResponseData(response)
    return Array.isArray(data) ? data : []
  }

  const toObject = (response, fallback = {}) => {
    const data = getResponseData(response)
    return data && typeof data === 'object' && !Array.isArray(data) ? data : fallback
  }

  const getMemberIdValue = (target) => {
    if (!target) return null

    const rawId =
      target?.member_id ??
      target?.memberId ??
      target?.id ??
      null

    if (rawId === null || rawId === undefined || rawId === '') return null
    return String(rawId)
  }

  const normalizeRankMember = (rankMember = {}) => {
    return {
      ...rankMember,
      memberId: rankMember.memberId ?? rankMember.member_id ?? null,
      nickname: rankMember.nickname ?? '사용자',
      profileImage: rankMember.profileImage ?? rankMember.profile_image ?? profile,
      points: Number(rankMember.points ?? 0),
      rankingPoint: Number(rankMember.rankingPoint ?? rankMember.isr ?? rankMember.score ?? 0),
      leagueRank: Number(rankMember.leagueRank ?? rankMember.rank ?? 0),
    }
  }

  const loadDashboard = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)

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
        const raw = getResponseData(memberRes.value) || {}
        const memberData =
          raw?.member ||
          raw?.data?.member ||
          raw ||
          null
        setMember(memberData)
      } else {
        setMember(null)
      }

      if (likedRes.status === 'fulfilled') {
        const likedData = toArray(likedRes.value).map((stock) => ({
          ...stock,
          stockCode: String(stock?.stockCode ?? stock?.symbol ?? ''),
          stockName: stock?.stockName ?? stock?.name ?? '',
          price: Number(stock?.price ?? 0),
          change: Number(stock?.change ?? stock?.changeAmount ?? 0),
          changeRate: Number(stock?.changeRate ?? stock?.rate ?? 0),
        }))
        setLikedStocks(likedData)
      } else {
        setLikedStocks([])
      }

      if (ownedRes.status === 'fulfilled') {
        const ownedData = toArray(ownedRes.value).map((stock) => {
          const quantity = Number(stock?.quantity ?? 0)
          const avgPrice = Number(stock?.avgPrice ?? stock?.avg_price ?? 0)
          const price = Number(stock?.price ?? 0)

          const principal =
            Number(stock?.principal ?? stock?.principalAmount ?? 0) || (avgPrice * quantity)

          const totalPrice =
            Number(stock?.totalPrice ?? stock?.currentAmount ?? 0) || (price * quantity)

          const changeAmount =
            Number(stock?.changeAmount ?? stock?.profitLoss ?? 0) || ((price - avgPrice) * quantity)

          const changeRate = Number(stock?.changeRate ?? stock?.rate ?? 0)

          return {
            ...stock,
            stockCode: String(stock?.stockCode ?? stock?.symbol ?? ''),
            stockName: stock?.stockName ?? stock?.name ?? '',
            quantity,
            avgPrice,
            price,
            principal,
            totalPrice,
            changeAmount,
            changeRate,
          }
        })

        setOwnedStocks(ownedData)
      } else {
        setOwnedStocks([])
      }

      if (isrRes.status === 'fulfilled') {
        const rawIsr = toObject(isrRes.value, EMPTY_ISR)
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
        const rankingData = toObject(rankingRes.value, {})
        const leagues = rankingData?.leagues || {}

        const normalizedLeagues = {
          bronze: Array.isArray(leagues.bronze) ? leagues.bronze.map(normalizeRankMember) : [],
          silver: Array.isArray(leagues.silver) ? leagues.silver.map(normalizeRankMember) : [],
          gold: Array.isArray(leagues.gold) ? leagues.gold.map(normalizeRankMember) : [],
          diamond: Array.isArray(leagues.diamond) ? leagues.diamond.map(normalizeRankMember) : [],
        }

        setLeagueRanks(normalizedLeagues)

        const mergedRanking = [
          ...normalizedLeagues.bronze,
          ...normalizedLeagues.silver,
          ...normalizedLeagues.gold,
          ...normalizedLeagues.diamond,
        ]
          .sort((a, b) => Number(b.rankingPoint || 0) - Number(a.rankingPoint || 0))
          .map((memberItem, index) => ({
            ...memberItem,
            overallRank: index + 1,
          }))

        setRankingList(mergedRanking)
      } else {
        setLeagueRanks({
          bronze: [],
          silver: [],
          gold: [],
          diamond: [],
        })
        setRankingList([])
      }

      if (questRes.status === 'fulfilled') {
        const questData = toObject(questRes.value, {})
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

      setError('')
    } catch (err) {
      console.error('대시보드 로딩 에러 =', err)
      setError(err?.message || '대시보드 로딩 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard(true)

    const handleDashboardRefresh = () => {
      loadDashboard(false)
    }

    window.addEventListener('pointsUpdated', handleDashboardRefresh)
    return () => window.removeEventListener('pointsUpdated', handleDashboardRefresh)
  }, [loadDashboard])

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

  const formatRankingPoint = (value) => {
    return Number(value || 0).toFixed(1)
  }

  const isrDescription = '사용자의 투자 과정과 행동의 질을 평가하는 기준.'

  const isrItems = useMemo(
    () => [
      {
        key: 'accuracy',
        label: 'Accuracy',
        value: isrData.accuracy,
        description: '사용자의 판단력의 정확도를 수치화. (수치가 높으면 능숙 / 낮으면 숙지 필요)',
      },
      {
        key: 'risk',
        label: 'Risk',
        value: isrData.risk,
        description: '손실 대비 베팅 규모, 무리한 투자 여부 수치화. (수치 높을수록 손실 관리 잘함)',
      },
      {
        key: 'stability',
        label: 'Stability',
        value: isrData.stability,
        description: '투자 자본 변동성, 수익 안전성을 수치화. (높은 점수일수록 증가율 안전적으로 오름, 낮음은 변동 심함)',
      },
      {
        key: 'discipline',
        label: 'Discipline',
        value: isrData.discipline,
        description: '손절 여부 및 목표 전햑 준수 여부, 미완료 행동을 수치화. (규칙적으로 투자를 하는지(높음), 아니면 랜덤으로 하는지(낮음))',
      },
      {
        key: 'strategy',
        label: 'Strategy',
        value: isrData.strategy,
        description: '주식을 어떤 목적으로 구매. (초단타, 며칠 ~ 몇 주, 장기 투자)',
      },
      {
        key: 'adaptability',
        label: 'Adaptability',
        value: isrData.adaptability,
        description: '사용자가 주식의 변동에 적응하는지 수치화. (높으면 잘 따름, 낮으면 한가지 방법으로만 투자하는 성향)',
      },
    ],
    [isrData]
  )

  const todaySolvedDisplay = Math.min(
    Number(questStatus.todaySolved || 0),
    Number(questStatus.dailyGoal || 3)
  )

  const displayedRankingList = useMemo(() => {
    if (!selectedLeague) {
      return rankingList.slice(0, 7)
    }

    const selectedList = (leagueRanks[selectedLeague] || [])
      .slice()
      .sort((a, b) => Number(b.rankingPoint || 0) - Number(a.rankingPoint || 0))

    return selectedList.slice(0, 7)
  }, [selectedLeague, rankingList, leagueRanks])

  const isMyRankMember = (rankMember) => {
    const currentMemberId = getMemberIdValue(member)
    const rankMemberId = getMemberIdValue(rankMember)

    if (!currentMemberId || !rankMemberId) return false
    return currentMemberId === rankMemberId
  }

  const handleLeagueClick = (leagueKey) => {
    setSelectedLeague(leagueKey)
  }

  if (loading) {
    return <div className='dash-container'>대시보드 불러오는 중...</div>
  }

  if (error) {
    return <div className='dash-container'>오류: {error}</div>
  }

  return (
    <div className='dash-container'>
      <div className='breadcrumb'>대시보드</div>

      <NewsTicker />

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
        <div className='dash-tool'>
          <div className='tool-box'>
            <span>📋퀘스트 현황</span>
            <div className='quest-status-box'>
              <div className='quest-summary'>
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
            <div className='isr-header'>
              <span>🎯ISR 지표</span>
              <div className='isr-tooltip-wrap'>
                <span className='isr-tooltip-icon'>ⓘ</span>
                <span className='isr-tooltip-text'>{isrDescription}</span>
              </div>
            </div>
            <div className='isr-summary'>
              <div className='isr-summary-score'>{formatScore(isrData.isr)}</div>
              <div className='isr-summary-desc'>
                판단력·생존력·성과 품질·행동 통제력·사고 체계·시장 대응력 종합
              </div>
            </div>

            <ul className='isr-list'>
              {isrItems.map((item) => (
                <li key={item.key} className='isr-item'>
                  <div className='isr-item-top'>
                    <div className='isr-name'>
                      <span>{item.label}</span>
                      <div className='isr-tooltip-wrap'>
                        <span className='isr-tooltip-icon'>ⓘ</span>
                        <span className='isr-tooltip-text'>{item.description}</span>
                      </div>
                    </div>
                    <p className='isr-value'>{formatScore(item.value)}</p>
                  </div>
                  <div className='isr-bar'>
                    <div
                      className='isr-bar-fill'
                      style={{
                        width: `${Math.max(0, Math.min(100, Number(item.value || 0)))}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='dash-rank'>
          <span>🏆리그 순위표</span>
          <div className='rank-box'>
            <ul className='rank-league'>
              {LEAGUE_META.map((league) => (
                <li key={league.key} className='league'>
                  <button
                    type='button'
                    className={`league-button ${selectedLeague === league.key ? 'active' : ''}`}
                    onClick={() => handleLeagueClick(league.key)}
                    title={`${league.label} 리그 보기`}
                  >
                    <img
                      src={league.image}
                      alt={league.alt}
                      className='league-badge'
                    />
                  </button>
                </li>
              ))}
            </ul>

            <ul className='rank-list'>
              {displayedRankingList.length === 0 ? (
                <li className='stock-empty'>랭킹 데이터가 없습니다.</li>
              ) : (
                displayedRankingList.map((rankMember, index) => {
                  const isMine = isMyRankMember(rankMember)

                  return (
                    <li
                      key={rankMember.memberId || rankMember.member_id || index}
                      className={`rank-item ${isMine ? 'rank-item-mine' : ''}`}
                    >
                      <div className='item-profile'>
                        <div className='rank-num'>
                          {selectedLeague
                            ? (rankMember.leagueRank || index + 1)
                            : (rankMember.overallRank || index + 1)}
                        </div>
                        <img
                          src={rankMember.profileImage || profile}
                          alt='account_image'
                          className='rank-profile'
                        />
                        <span className={isMine ? 'rank-name-mine' : ''}>
                          {rankMember.nickname || '사용자'}
                        </span>
                      </div>
                      <div className={`rank-num ${isMine ? 'rank-score-mine' : ''}`}>
                        {formatRankingPoint(rankMember.rankingPoint)}
                      </div>
                    </li>
                  )
                })
              )}
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
                <p className='numbers'>금액</p>
                <p className='numbers'>변동</p>
              </li>
              {likedStocks.length === 0 ? (
                <li className='stock-empty'>찜한 주식이 없습니다.</li>
              ) : (
                likedStocks.map((stock) => (
                  <li
                    key={stock.id || stock.stockCode}
                    className='stock-item liked-grid'
                  >
                    <p>{stock.stockName || stock.stockCode}</p>
                    <p className='numbers'>{formatNumber(stock.price)}</p>
                    <p className='numbers'>{formatSignedNumber(stock.change)}</p>
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
              <li className='stock-item stock-head owned-grid'>
                <p>주식</p>
                <p className='numbers'>금액</p>
                <p className='numbers'>변동</p>
                <p className='numbers'>변동률</p>
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
                    <p className='numbers'>{formatNumber(stock.principal)}</p>
                    <p className='numbers'>{formatSignedNumber(stock.changeAmount)}</p>
                    <p className='numbers'>{formatSignedPercent(stock.changeRate)}</p>
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