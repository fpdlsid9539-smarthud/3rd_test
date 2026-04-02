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
  judgment: 0,
  riskManagement: 0,
  consistency: 0,
  investmentHabit: 0,
  marketResponse: 0,
  grade: {
    code: 'D',
    label: '위험형 투자자',
    description: '아직 투자 기록이 없어 분석 결과가 없습니다.',
  },
  summary: '아직 투자 기록이 없어 ISR 분석 결과를 생성할 수 없습니다.',
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
  const [userLeague, setUserLeague] = useState(null)
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

          const changeRate = Number(stock?.myChangeRate ?? stock?.rate ?? 0)

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

          judgment: Number(rawIsr?.judgment ?? rawIsr?.accuracy ?? 0),
          riskManagement: Number(rawIsr?.riskManagement ?? rawIsr?.risk ?? 0),
          consistency: Number(rawIsr?.consistency ?? rawIsr?.stability ?? 0),
          investmentHabit: Number(rawIsr?.investmentHabit ?? rawIsr?.discipline ?? 0),
          marketResponse: Number(rawIsr?.marketResponse ?? rawIsr?.adaptability ?? 0),

          grade: rawIsr?.grade || EMPTY_ISR.grade,
          summary: rawIsr?.summary || EMPTY_ISR.summary,
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

        const rawMember = memberRes.status === 'fulfilled'
          ? (getResponseData(memberRes.value)?.member || getResponseData(memberRes.value) || {})
          : {}
        const currentMemberId = getMemberIdValue(rawMember)

        const detectedLeague = currentMemberId
          ? (['bronze', 'silver', 'gold', 'diamond'].find((key) =>
            normalizedLeagues[key].some(
              (m) => getMemberIdValue(m) === currentMemberId
            )
          ) || null)
          : null

        setUserLeague(detectedLeague)
        setSelectedLeague(detectedLeague)

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

  const getStockPrincipal = (stock) => {
    const directTotalPrice = Number(
      stock?.totalPrice ??
      stock?.principal ??
      stock?.price ??
      0
    )

    if (directTotalPrice > 0) return directTotalPrice

    const quantity = Number(stock?.quantity || 0)
    const avgPrice = Number(stock?.avgPrice ?? stock?.avg_price ?? 0)
    return quantity * avgPrice
  }

  const getStockProfit = (stock) => {
    return Number(
      stock?.changeAmount ??
      stock?.change_amount ??
      stock?.profit ??
      stock?.pnl_amount ??
      0
    )
  }

  const investmentSummary = useMemo(() => {
    return ownedStocks.reduce(
      (acc, stock) => {
        acc.totalInvested += getStockPrincipal(stock)
        acc.totalProfit += getStockProfit(stock)
        return acc
      },
      { totalInvested: 0, totalProfit: 0 }
    )
  }, [ownedStocks])

  const displayTotalInvested =
    Number(investmentSummary.totalInvested || 0) > 0
      ? investmentSummary.totalInvested
      : Number(member?.bet_amount || 0)

  const displayTotalProfit =
    Number(investmentSummary.totalProfit || 0) !== 0
      ? investmentSummary.totalProfit
      : Number(member?.pnl_amount || 0)

  const totalProfitRate =
    Number(displayTotalInvested) > 0
      ? (Number(displayTotalProfit) / Number(displayTotalInvested)) * 100
      : 0

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
    return Number(value || 0).toFixed(1)
  }

  const formatRankingPoint = (value) => {
    return Number(value || 0).toFixed(1)
  }

  const isrDescription = '수익률이 아니라 사용자의 투자 과정과 행동의 질을 평가하는 기준.'

  const isrItems = useMemo(
    () => [
      {
        key: 'accuracy',
        label: '판단력',
        value: isrData.accuracy,
        description: '성공/실패 기준으로 투자 방향을 얼마나 정확하게 판단했는지 보여줍니다.',
      },
      {
        key: 'risk',
        label: '위험관리',
        value: isrData.risk,
        description: '손실 대비 베팅 규모와 패널티를 기준으로 손실을 얼마나 잘 통제했는지 보여줍니다.',
      },
      {
        key: 'stability',
        label: '일관성',
        value: isrData.stability,
        description: '손익 변동성이 너무 크지 않은지 기준으로 투자 패턴의 안정성을 보여줍니다.',
      },
      {
        key: 'discipline',
        label: '투자습관',
        value: isrData.discipline,
        description: 'PENDING 비율을 기준으로 미완료 행동이 적고 규칙적으로 투자하는지 보여줍니다.',
      },
      {
        key: 'strategy',
        label: '전략성',
        value: isrData.strategy,
        description: '투자 전략을 얼마나 일관되고 적절하게 사용했는지 보여줍니다.',
      },
      {
        key: 'adaptability',
        label: '시장대응력',
        value: isrData.adaptability,
        description: '시장 상황 변화에 얼마나 유연하게 대응하는지 보여줍니다.',
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
      return rankingList
    }

    const selectedList = (leagueRanks[selectedLeague] || [])
      .slice()
      .sort((a, b) => {
        // Sort by leagueRank ascending if available, otherwise fall back to rankingPoint descending
        const rankA = Number(a.leagueRank || 0)
        const rankB = Number(b.leagueRank || 0)
        if (rankA > 0 && rankB > 0) return rankA - rankB
        return Number(b.rankingPoint || 0) - Number(a.rankingPoint || 0)
      })

    return selectedList
  }, [selectedLeague, rankingList, leagueRanks])

  const isMyRankMember = (rankMember) => {
    const currentMemberId = getMemberIdValue(member)
    const rankMemberId = getMemberIdValue(rankMember)

    if (!currentMemberId || !rankMemberId) return false
    return currentMemberId === rankMemberId
  }

  const handleLeagueClick = (leagueKey) => {
    if (selectedLeague === leagueKey) return   // ← bail early, no re-render
    setSelectedLeague(leagueKey)
  }

  const selectedLeagueLabel = useMemo(() => {
    if (!selectedLeague) return null
    const foundLeague = LEAGUE_META.find((league) => league.key === selectedLeague)
    return foundLeague?.label || null
  }, [selectedLeague])

  const rankingTitle = selectedLeagueLabel
    ? `${selectedLeagueLabel} 리그 순위표`
    : '전체 리그 순위표'

  if (loading) {
    return <div className='dash-container'>대시보드 불러오는 중.</div>
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
        <div className='tool-box'>
          <span>퀘스트 현황</span>
          <div className='quest-status-box'>
            <div className='dash-summary'>
              <div className='dash-score'>
                {Number(questStatus.dailyPercent || 0).toFixed(1)}
                <span>%</span>
              </div>
              <div className='dash-summary-desc'>
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
                  {Number(questStatus.accuracy || 0).toFixed(1)}%
                </strong>
              </li>
            </ul>
          </div>
        </div>

        <div className='tool-box'>
          <div className='isr-header'>
            <span>ISR 지표</span>
            <div className='isr-tooltip-wrap'>
              <span className='isr-tooltip-icon'>ⓘ</span>
              <span className='isr-tooltip-text'>{isrDescription}</span>
            </div>
          </div>

          <div className='dash-summary'>
            <div className='dash-score'>{formatScore(isrData.isr)}</div>
            <div className='isr-one-line'>
              <strong>한 줄 분석</strong>
              <p>{isrData?.summary || '아직 분석 결과가 없습니다.'}</p>
            </div>
          </div>

          <div>
            <div className='isr-grade-box'>
              <div className='isr-grade-code'>
                {isrData?.grade?.code || 'D'}
              </div>
              <div className='isr-grade-texts'>
                <strong>{isrData?.grade?.label || '위험형 투자자'}</strong>
                <p>{isrData?.grade?.description || '아직 분석 결과가 없습니다.'}</p>
              </div>
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

        <div className='tool-box'>
          <span>{rankingTitle}</span>
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
                          src={rankMember.profileImage2 || rankMember.profileImage || profile}
                          alt='account_image'
                          className='rank-profile'
                        />
                        <span>
                          {rankMember.nickname || '사용자'}
                        </span>
                      </div>

                      <div className='rank-point'>
                        {Number(rankMember.points || 0).toLocaleString('ko-KR')}pt
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
          <span>찜한 주식</span>
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
                    <p className='numbers'>{formatNumber(stock.price)}pt</p>
                    <p className={`numbers 
                        ${Number(stock.changeRate || stock.changeRate || 0) >= 0
                        ? 'gain'
                        : 'loss'
                      }`}>
                      {formatSignedNumber(stock.change)}pt
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className='dash-box'>
          <span>보유 주식</span>
          <div className='stock-box'>
            <ul className='stock-list'>
              <li className='stock-item stock-head owned-grid'>
                <p>주식</p>
                <p className='numbers'>보유</p>
                <p className='numbers'>원금</p>
                <p className='numbers'>변동</p>
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
                    <p className='numbers'>{stock.quantity}</p>
                    <p className='numbers'>{formatNumber(stock.principal)}pt</p>
                    <p className={`numbers 
                        ${Number(stock.myChangeRate || stock.myChangeRate || 0) >= 0
                        ? 'gain'
                        : 'loss'
                      }`}>
                      {formatSignedNumber(stock.changeAmount)}pt({formatSignedPercent(stock.myChangeRate)})
                    </p>
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