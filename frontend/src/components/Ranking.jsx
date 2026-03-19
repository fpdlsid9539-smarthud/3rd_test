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
        <section className='league-grid'>
          {leagueConfig.map((league) => {
            const rows = leagueData[league.id] || []

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
                  {rows.slice(0, 10).map((row) => {
                    const isMe = row.memberId === currentUserId

                    return (
                      <li
                        className={`league-user-item ${isMe ? 'my-row' : ''}`}
                        key={row.memberId}
                      >
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
      )}
    </main>
  )
}

export default Ranking