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
            <h2>시즌 랭킹 안내</h2>

            <p className='ranking-guide-text'>
              현재 랭킹 점수는 <span className='guide-highlight-blue'>포인트 보유량</span>을
              기준으로 산정되며, 현재 전체 1등 유저의 포인트를{' '}
              <span className='guide-highlight-blue'>100점 기준</span>으로 계산합니다.
            </p>

            <p className='ranking-guide-formula'>
              랭킹 점수 = <span>내 포인트 ÷ 현재 1등 포인트 × 100</span>
            </p>

            <div className='ranking-guide-example'>
              <div className='guide-example-title'>예시</div>
              <p>1등 유저 포인트가 100,000pt라면 1등 점수는 100점입니다.</p>
              <p>내 포인트가 80,000pt라면 내 랭킹 점수는 80점으로 반영됩니다.</p>
            </div>

            <p className='ranking-guide-warning'>
              ※ 이 랭킹은 절대 점수가 아닌 상대 평가 방식이며, 1등 유저의 포인트가
              변동되면 다른 유저의 랭킹 점수도 함께 변동될 수 있습니다.
            </p>
          </section>
        </>
      )}
    </main>
  )
}

export default Ranking