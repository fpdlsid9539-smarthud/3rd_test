import React, { useEffect, useMemo, useState } from 'react'
import './Ranking.css'
import defaultProfile from '../assets/chicken running machine.gif'
import bronze from '../assets/icons/ranked/bronze.png'
import silver from '../assets/icons/ranked/silver.png'
import gold from '../assets/icons/ranked/gold.png'
import diamond from '../assets/icons/ranked/diamond.png'

const API_BASE_URL = 'http://localhost:5000'

const getAccessToken = () => {
  return localStorage.getItem('token') || ''
}

const leagueConfig = [
  { id: 'bronze', title: '브론즈', badge: bronze },
  { id: 'silver', title: '실버', badge: silver },
  { id: 'gold', title: '골드', badge: gold },
  { id: 'diamond', title: '다이아', badge: diamond },
]

const Ranking = () => {
  const [seasonName, setSeasonName] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [leagueData, setLeagueData] = useState({
    bronze: [],
    silver: [],
    gold: [],
    diamond: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true)
        setError('')

        const token = getAccessToken()

        if (!token) {
          throw new Error('UNAUTHORIZED')
        }

        const res = await fetch(`${API_BASE_URL}/api/ranking`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          throw new Error('UNAUTHORIZED')
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const result = await res.json()
        const data = result?.data || {}

        setSeasonName(data.seasonName || '포인트 랭킹')
        setCurrentUserId(data.currentUserId || null)
        setLeagueData({
          bronze: data.leagues?.bronze || [],
          silver: data.leagues?.silver || [],
          gold: data.leagues?.gold || [],
          diamond: data.leagues?.diamond || [],
        })
      } catch (err) {
        console.error('랭킹 조회 실패:', err)

        if (err.message === 'UNAUTHORIZED') {
          setError('로그인이 필요합니다.')
        } else {
          setError('랭킹 데이터를 불러오지 못했습니다.')
        }

        setSeasonName('')
        setCurrentUserId(null)
        setLeagueData({
          bronze: [],
          silver: [],
          gold: [],
          diamond: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  const hasAnyRows = useMemo(() => {
    return leagueConfig.some((league) => (leagueData[league.id] || []).length > 0)
  }, [leagueData])

  const getDisplayRows = (rows) => {
    const myIndex = rows.findIndex((row) => row.memberId === currentUserId)

    if (myIndex === -1 || myIndex < 10) {
      return rows.slice(0, 10)
    }

    // 3. 내 순위가 10등 밖으로 밀려났다면? (1~9등까지 보여주고, 마지막 10번째 자리에 나를 끼워 넣음!)
    const top9 = rows.slice(0, 9)
    return [...top9, rows[myIndex]]
  }

  return (
    <main className='ranking-container'>
      <div className='ranking-breadcrumb'>대시보드 &gt; 랭킹</div>

      <section className='ranking-summary-card'>
        <h1>
          모두의 성적, <strong>시즌 랭킹!</strong>
        </h1>
        <p>
          <span className='summary-highlight'>{seasonName || '포인트 랭킹'}</span> 에서
          나의 순위는 어디에?
        </p>
      </section>

      {loading ? (
        <div className='ranking-empty-box'>랭킹 데이터를 불러오는 중입니다.</div>
      ) : error ? (
        <div className='ranking-empty-box'>{error}</div>
      ) : !hasAnyRows ? (
        <div className='ranking-empty-box'>표시할 랭킹 데이터가 없습니다.</div>
      ) : (
        <>
          <section className='league-grid'>
            {leagueConfig.map((league) => {
              const rows = leagueData[league.id] || []
              const displayRows = getDisplayRows(rows)

              return (
                <article className='league-card' key={league.id}>
                  <div className='league-emblem-wrap'>
                    <img
                      src={league.badge}
                      alt={`${league.title} 티어`}
                      className='league-emblem-badge'
                    />
                  </div>

                  <ul className='league-user-list'>
                    {/* 🟢 기존의 복잡했던 pinnedMyRow와 normalRows를 하나로 합쳐서 깔끔하게 출력합니다 */}
                    {displayRows.map((row) => {
                      const isMe = row.memberId === currentUserId;

                      return (
                        // 내 프로필일 경우 기존에 쓰시던 pinned-my-row 클래스를 붙여서 색상 하이라이트 유지!
                        <li className={`league-user-item ${isMe ? 'pinned-my-row' : ''}`} key={row.memberId}>
                          <span className='league-rank'>{row.leagueRank}</span>

                          <div className='league-user-main'>
                            <img
                              src={row.profileImage || defaultProfile}
                              alt={`${row.nickname} 프로필`}
                              className='league-profile'
                            />
                            <span className='league-name'>{row.nickname}</span>
                          </div>

                          <span className='league-score'>
                            {Number(row.rankingPoint || 0).toFixed(1)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              )
            })}
          </section>

          <section className='ranking-guide-card'>
            <h2>📊 시즌 랭킹 가이드</h2>

            <div className="guide-content-wrap">
              {/* 1. 랭킹 산정 방식 */}
              <article className="guide-block">
                <h3>1. 랭킹 점수 산정 방식 (상대 평가)</h3>
                <p className='ranking-guide-text'>
                  FinSight의 랭킹 점수는 유저가 획득한 <span className='guide-highlight-blue'>총 포인트</span>를 기준으로 산정됩니다.
                  현재 전체 1등 유저의 포인트를 <span className='guide-highlight-blue'>100점(만점) 기준</span>으로 두고, 내 포인트가 1등 대비 어느 정도인지 상대적으로 계산합니다.
                </p>
                <p className='ranking-guide-formula'>
                  내 랭킹 점수 = <span>(내 포인트 ÷ 현재 1등 포인트) × 100</span>
                </p>
                <ul className="guide-examples-list">
                  <li><strong>상황 A :</strong> 내가 현재 전체 1등(100,000pt)이라면 → 랭킹 점수 <span className='highlight-value'>100.0점</span> 배정</li>
                  <li><strong>상황 B :</strong> 내 포인트가 50,000pt이고 1등이 100,000pt라면 → 랭킹 점수 <span className='highlight-value'>50.0점</span> 배정</li>
                  <li><strong>상황 C :</strong> 내 포인트는 그대로인데 1등이 200,000pt로 오르면 → 랭킹 점수 <span className='highlight-value'>25.0점</span>으로 하락</li>
                </ul>
                <p className='ranking-guide-warning'>
                  ※ 1등 유저의 포인트가 더 높아지면, 내 포인트가 그대로여도 랭킹 점수(%)는 하락할 수 있습니다. 랭킹 방어를 위해 꾸준히 포인트를 모아보세요!
                </p>
              </article>

              {/* 2. 티어(리그) 안내 */}
              <article className="guide-block">
                <h3>2. 리그 배정 기준</h3>
                <p className='ranking-guide-text'>
                  산정된 랭킹 점수(상대 점수) 커트라인에 따라 4개의 리그 중 하나에 자동으로 배정됩니다.
                </p>
                <ul className="guide-tier-list">
                  <li><img src={bronze} alt="Bronze badge" className="guide-league-badge"/><span className="tier-name"></span> 랭킹 하위권 및 신규 가입 유저</li>
                  <li><img src={silver} alt="Silver badge" className="guide-league-badge"/><span className="tier-name"></span> 랭킹 중위권 유저</li>
                  <li><img src={gold} alt="Gold badge" className="guide-league-badge"/><span className="tier-name"></span> 랭킹 상위권 유저</li>
                  <li><img src={diamond} alt="Diamond badge" className="guide-league-badge"/><span className="tier-name"></span> 랭킹 최상위권 (Top 랭커)</li>
                </ul>
              </article>

              {/* 3. 포인트 획득 방법 (생태계 안내) */}
              <article className="guide-block">
                <h3>3. 포인트는 어떻게 모으나요?</h3>
                <ul className="guide-point-list">
                  <li><strong> 가상 주식 매매:</strong> 전략실에서 모의 투자를 진행하고 수익금만큼 포인트를 늘려보세요.</li>
                  <li><strong> 기초 지식 퀴즈:</strong> 교육실 퀴즈(하/중/상)를 풀고 정답 포인트와 완벽(100점) 보너스를 획득하세요.</li>
                  <li><strong> 일일 O/X 퀴즈:</strong> 매일 1회 제공되는 실제 주가 데이터 기반의 O/X 퀴즈를 맞히면 500pt가 지급됩니다.</li>
                  <li><strong> 업적 및 칭호:</strong> 숨겨진 다양한 퀘스트를 달성하여 대량의 추가 포인트를 노려보세요!</li>
                </ul>
              </article>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default Ranking