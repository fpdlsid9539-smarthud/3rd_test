import React, { useEffect, useMemo, useState } from 'react'
import './Ranking.css'
import defaultProfile from '../assets/chicken running machine.gif'
import bronze from '../assets/icons/ranked/bronze.png'
import silver from '../assets/icons/ranked/silver.png'
import gold from '../assets/icons/ranked/gold.png'
import diamond from '../assets/icons/ranked/diamond.png'
import { api } from '../config/api'

const toHttpsImage = (url) => {
  if (!url) return ''
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url
}

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

        const result = await api.get('/api/ranking')
        const data = result?.data?.data ?? result?.data ?? result

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
      <div className='breadcrumb'>대시보드 &gt; 랭킹</div>

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
                      alt={`${league.title} 리그`}
                      className='league-emblem-badge'
                    />
                    <span>{league.title} 리그</span>
                  </div>

                  <ul className='league-user-list'>
                    {displayRows.map((row) => {
                      const isMe = row.memberId === currentUserId;
                      return (
                        <li className={`league-user-item ${isMe ? 'pinned-my-row' : ''}`} key={row.memberId}>
                          <div className='league-user-main'>
                            <span className='league-rank'>{row.leagueRank}</span>
                            <img
                              src={toHttpsImage(row.profileImage) || defaultProfile}
                              alt={`${row.nickname} 프로필`}
                              className='league-profile'
                            />
                            <span className='league-name'>{row.nickname}</span>
                          </div>

                          <span className='league-score'>
                            {Number(row.leaguePoint || 0).toLocaleString('ko-KR')}pt
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
            <h2>시즌 랭킹 가이드</h2>

            <div className="guide-content-wrap">
              {/* 1. 랭킹 산정 방식 */}
              <article className="guide-block">
                <h3>1. 랭킹 점수 산정 방식</h3>
                <p className='ranking-guide-text'>
                  FinSight의 랭킹 시스템은 단순한 누적 점수가 아닌, 유저가 보유한 총 포인트를 기준으로 전체 유저 중 자신이 상위 몇 %에 해당하는지 계산하는 방식으로 운영됩니다.
                </p>
                <p className='ranking-guide-text'>
                  모든 유저를 포인트 순으로 나열하여 0~100 사이의 백분위 지표를 구하며, 이 지표에 따라 티어가 실시간으로 배정됩니다. 
                </p>
                <ul className="guide-point-list">
                  <li><strong>다이아:</strong> 상위 10% 이내 (백분위 90 이상)</li>
                  <li><strong>골드:</strong> 상위 30% 이내 (백분위 70 이상 ~ 90 미만)</li>
                  <li><strong>실버:</strong> 상위 60% 이내 (백분위 40 이상 ~ 70 미만)</li>
                  <li><strong>브론즈:</strong> 하위 40% (백분위 40 미만)</li>
                </ul>
                <p className='ranking-guide-text'>
                  꾸준한 활동(퀴즈, 모의투자 등)으로 포인트를 모아 다른 유저들을 추월하고 최상위 랭커에 도전해 보세요!
                </p>
              </article>

              {/* 2. 티어(리그) 안내 */}
              <article className="guide-block">
                <h3>2. 리그 배정 기준</h3>
                <p className='ranking-guide-text'>
                  산정된 랭킹 점수 커트라인에 따라 4개의 리그 중 하나에 자동으로 배정됩니다.
                </p>
                <ul className="guide-tier-list">
                  <li>
                    <img src={bronze} alt="Bronze badge" className="guide-league-badge" />
                    <span className="tier-name">랭킹 하위권 및 신규 가입 유저</span>
                  </li>
                  <li>
                    <img src={silver} alt="Silver badge" className="guide-league-badge" />
                    <span className="tier-name">랭킹 중위권 유저</span>
                    </li>
                  <li>
                    <img src={gold} alt="Gold badge" className="guide-league-badge" />
                    <span className="tier-name">랭킹 상위권 유저</span>
                    </li>
                  <li>
                    <img src={diamond} alt="Diamond badge" className="guide-league-badge" />
                    <span className="tier-name">랭킹 최상위권 (Top 랭커)</span>
                    </li>
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