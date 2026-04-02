import React, { useEffect, useMemo, useState } from 'react'
import './Education.css'
import arrowDown from '../assets/icons/arrow-down-line.svg'
import check from '../assets/icons/check.svg'
import finsightLogo from '../assets/finsight.svg'
import crownIcon from '../assets/icons/premium.svg'

const API_BASE_URL = 'http://localhost:5000'

const getAccessToken = () => {
  return localStorage.getItem('token') || ''
}

const parseJwt = (token) => {
  try {
    if (!token) return null
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('JWT 파싱 실패:', error)
    return null
  }
}

const getMemberIdFromToken = () => {
  const token = getAccessToken()
  const payload = parseJwt(token)

  return (
    payload?.member_id ??
    payload?.id ??
    payload?.memberId ??
    null
  )
}

const getDailyCountsStorageKey = (memberId) => {
  return memberId ? `educationDailyCounts_${memberId}` : 'educationDailyCounts_guest'
}

const Education = () => {
  const [searchText, setSearchText] = useState('')
  const [openLessonId, setOpenLessonId] = useState(null)
  const [showAllLessons, setShowAllLessons] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)

  const [countdown, setCountdown] = useState(0)

  const [dailyCounts, setDailyCounts] = useState({
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  })

  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('all')

  const [educationLessons, setEducationLessons] = useState([])
  const [progress, setProgress] = useState({
    completedCount: 0,
    totalCount: 0,
    percent: 0,
  })
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0)
  const [membershipType, setMembershipType] = useState('free')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [processingLessonId, setProcessingLessonId] = useState(null)

  const [memberId, setMemberId] = useState(null)

  useEffect(() => {
    const resolvedMemberId = getMemberIdFromToken()
    setMemberId(resolvedMemberId)
  }, [])

  useEffect(() => {
    if (!memberId) {
      setDailyCounts({
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      })
      return
    }

    const today = new Date().toDateString()
    const storageKey = getDailyCountsStorageKey(memberId)
    const storedData = JSON.parse(localStorage.getItem(storageKey) || '{}')

    if (storedData.date === today) {
      setDailyCounts(
        storedData.counts || {
          beginner: 0,
          intermediate: 0,
          advanced: 0,
        }
      )
    } else {
      const resetCounts = { beginner: 0, intermediate: 0, advanced: 0 }
      setDailyCounts(resetCounts)
      localStorage.setItem(
        storageKey,
        JSON.stringify({ date: today, counts: resetCounts })
      )
    }
  }, [memberId])

  const getVisibleLessons = (lessons, statusFilter, difficultyFilter) => {
    let visible = [...lessons]

    if (statusFilter === 'all') {
      visible = visible.filter((lesson) => !lesson.isCompleted)
    }

    if (statusFilter === 'new') {
      visible = visible.filter((lesson) => !lesson.isCompleted && lesson.status === 'new')
    }

    if (statusFilter === 'completed') {
      visible = visible.filter((lesson) => lesson.isCompleted)
    }

    if (difficultyFilter !== 'all') {
      visible = visible.filter((lesson) => lesson.difficulty === difficultyFilter)
    }

    return visible
  }

  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        setLoading(true)
        setError('')
        setActionMessage('')

        const token = getAccessToken()
        if (!token) throw new Error('UNAUTHORIZED')

        const resolvedMemberId = getMemberIdFromToken()
        setMemberId(resolvedMemberId)

        const res = await fetch(`${API_BASE_URL}/api/education`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.status === 401) throw new Error('UNAUTHORIZED')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const result = await res.json()
        const data = result?.data || {}

        setEducationLessons(data.lessons || [])
        setProgress(data.progress || { completedCount: 0, totalCount: 0, percent: 0 })
        setTotalEarnedPoints(data.totalEarnedPoints || 0)
        setMembershipType(data.membership_type || 'free')
        setOpenLessonId(null)
      } catch (err) {
        console.error('교육 데이터 조회 실패:', err)
        setError(
          err.message === 'UNAUTHORIZED'
            ? '로그인이 필요합니다.'
            : '교육 데이터를 불러오지 못했습니다.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchEducationData()
  }, [])

  useEffect(() => {
    let timer
    if (openLessonId && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [openLessonId, countdown])

  const filteredLessons = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    let filtered = getVisibleLessons(
      educationLessons,
      selectedStatusFilter,
      selectedDifficultyFilter
    )

    if (keyword) {
      filtered = filtered.filter((lesson) => {
        const title = (lesson.title || '').toLowerCase()
        const summary = (lesson.summary || '').toLowerCase()
        return title.includes(keyword) || summary.includes(keyword)
      })
    }

    return filtered
  }, [searchText, selectedStatusFilter, selectedDifficultyFilter, educationLessons])

  const displayedLessons = useMemo(() => {
    return filteredLessons.slice(0, visibleCount)
  }, [filteredLessons, visibleCount])

  // 🟢 수정 3: 검색이나 필터를 바꾸면 다시 초기 5개로 리셋
  useEffect(() => {
    setVisibleCount(5)
    setOpenLessonId(null)
    setCountdown(0)
  }, [searchText, selectedStatusFilter, selectedDifficultyFilter])

  // 🟢 추가: 더보기 / 접기 버튼 동작 함수
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10) // 10개씩 추가
  }

  const handleCollapse = () => {
    setVisibleCount((prev) => {
      const newCount = prev - 10
      return newCount < 5 ? 5 : newCount
    })
  }

  useEffect(() => {
    if (filteredLessons.length === 0) {
      setOpenLessonId(null)
      setCountdown(0)
      return
    }
    if (openLessonId === null) return

    const stillExists = filteredLessons.some((lesson) => lesson.id === openLessonId)
    if (!stillExists) {
      setOpenLessonId(null)
      setCountdown(0)
    }
  }, [filteredLessons, openLessonId])

  const showSubscribeGuide = () => {
    setActionMessage('상급 학습은 구독 후 이용할 수 있습니다.')
  }

  const handleDifficultyFilter = (difficulty) => {
    setSelectedDifficultyFilter(difficulty)

    if (difficulty === 'advanced' && membershipType !== 'premium') {
      showSubscribeGuide()
    }
  }

  const handleToggleLesson = (lessonId) => {
    const lesson = educationLessons.find((l) => l.id === lessonId)
    if (!lesson) return

    const isAdvancedLocked =
      lesson.difficulty === 'advanced' && membershipType !== 'premium'

    if (isAdvancedLocked) {
      showSubscribeGuide()
      return
    }

    if (openLessonId === lessonId) {
      setOpenLessonId(null)
      setCountdown(0)
    } else {
      setOpenLessonId(lessonId)

      if (!lesson.isCompleted) {
        if (dailyCounts[lesson.difficulty] >= 5) {
          setCountdown(0)
        } else {
          setCountdown(5)
        }
      } else {
        setCountdown(0)
      }
    }
  }

  const handleCompleteLesson = async (lessonId) => {
    try {
      setProcessingLessonId(lessonId)
      setActionMessage('')
      setError('')

      const token = getAccessToken()
      if (!token) throw new Error('UNAUTHORIZED')

      const res = await fetch(`${API_BASE_URL}/api/education/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) throw new Error('UNAUTHORIZED')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const result = await res.json()
      const data = result?.data || {}

      const completedLesson = educationLessons.find((l) => l.id === lessonId)

      if (completedLesson && memberId) {
        const difficulty = completedLesson.difficulty
        const newCounts = {
          ...dailyCounts,
          [difficulty]: (dailyCounts[difficulty] || 0) + 1,
        }

        setDailyCounts(newCounts)

        const storageKey = getDailyCountsStorageKey(memberId)
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            date: new Date().toDateString(),
            counts: newCounts,
          })
        )
      }

      setEducationLessons(data.lessons || [])
      setProgress(data.progress || { completedCount: 0, totalCount: 0, percent: 0 })
      setTotalEarnedPoints(data.totalEarnedPoints || 0)
      setMembershipType(data.membership_type || membershipType)

      window.dispatchEvent(new Event('pointsUpdated'))

      if ((data.awardedPoints || 0) > 0) {
        setActionMessage(`학습 완료! ${data.awardedPoints}pt를 획득했습니다.`)
      }

      setOpenLessonId(null)
      setCountdown(0)
    } catch (err) {
      setError(
        err.message === 'UNAUTHORIZED'
          ? '로그인이 필요합니다.'
          : '학습 완료 처리에 실패했습니다.'
      )
    } finally {
      setProcessingLessonId(null)
    }
  }

  return (
    <div className='education-container'>
      <div className='breadcrumb'>대시보드 &gt; 교육실</div>

      <div className='education-top-card'>
        <div className='education-title-wrap'>
          <h1>
            주식의 <strong>기초를 알아가자!</strong>
          </h1>
          <p>
            기초를 알아야 <span className='daily-percent'>발전</span>해요!
          </p>
        </div>

        <div className='education-progress-wrap'>
          <div className='education-progress-top'>
            <span>학습 진행도</span>
            <span>
              {progress.completedCount}/{progress.totalCount}
            </span>
          </div>
          <div className='education-progress-bar'>
            <div className='education-progress-fill' style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        <div className='education-top-meta'>
          <div className='education-meta-chip'>
            초급 {dailyCounts.beginner}/5
          </div>
          <div className='education-meta-chip'>
            중급 {dailyCounts.intermediate}/5
          </div>
          <div className='education-meta-chip'>
            상급 {dailyCounts.advanced}/5
          </div>
          <div className='education-meta-chip'>누적 포인트 {totalEarnedPoints}pt</div>
        </div>
      </div>

      <div className='education-search-box'>
        <input
          type='text'
          placeholder='배우고 싶은 개념을 검색해보세요'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className='education-search-input'
        />
        <div className='education-filter-row'>
          <div className='education-filter-group left'>
            <button
              type='button'
              className={`education-filter-btn ${selectedStatusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter('all')}
            >
              전체
            </button>
            <button
              type='button'
              className={`education-filter-btn ${selectedStatusFilter === 'new' ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter('new')}
            >
              신규
            </button>
            <button
              type='button'
              className={`education-filter-btn ${selectedStatusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter('completed')}
            >
              완료
            </button>
          </div>

          <div className='education-filter-group right'>
            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleDifficultyFilter('all')}
            >
              전체 난이도
            </button>
            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'beginner' ? 'active' : ''}`}
              onClick={() => handleDifficultyFilter('beginner')}
            >
              초급
            </button>
            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'intermediate' ? 'active' : ''}`}
              onClick={() => handleDifficultyFilter('intermediate')}
            >
              중급
            </button>
            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'advanced' ? 'active' : ''}
                education-filter-btn-premium ${membershipType !== 'premium' ? 'locked' : ''}`}
              onClick={() => {
                // 프리미엄 회원이 아닐 경우 아예 클릭 이벤트를 무시합니다.
                if (membershipType !== 'premium') return;
                handleDifficultyFilter('advanced');
              }}
            >
              <span className='education-filter-crown' >
                {membershipType !== 'premium' && <img src={crownIcon} alt='premium crown' />}
                상급
              </span>
              {membershipType !== 'premium' && (
                <div className="premium-tooltip">
                  구독 후 이용 가능합니다
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {actionMessage && <div className='education-empty-box education-message-box'>{actionMessage}</div>}
      {error && <div className='education-empty-box education-message-box'>{error}</div>}

      <div className='education-list'>
        {loading ? (
          <div className='education-empty-box'>교육 데이터를 불러오는 중입니다.</div>
        ) : filteredLessons.length > 0 ? (
          <>
            {displayedLessons.map((lesson) => {
              const isOpen = openLessonId === lesson.id
              const isQuotaFull = dailyCounts[lesson.difficulty] >= 5
              const isAdvancedLocked =
                lesson.difficulty === 'advanced' && membershipType !== 'premium'

              return (
                <div
                  className={`education-accordion-item ${isOpen ? 'open' : ''} ${isAdvancedLocked ? 'locked' : ''}`}
                  key={lesson.id}
                >
                  <button
                    type='button'
                    className='education-accordion-header'
                    onClick={() => handleToggleLesson(lesson.id)}
                  >
                    <div className='education-header-main'>
                      <div className='education-icon-box'>
                        <img src={finsightLogo} alt='Finsight Logo' className='education-logo' />
                      </div>
                      <div className='education-header-text'>
                        <div className='education-header-title-row'>
                          <span className='education-lesson-title'>{lesson.title}</span>
                          {lesson.status === 'new' && !lesson.isCompleted && (
                            <span className='education-badge education-badge-new'>신규</span>
                          )}
                          {lesson.isCompleted && (
                            <span className='education-badge education-badge-completed'>완료</span>
                          )}
                        </div>
                        <div className='education-sub-info'>
                          <span>{lesson.level}</span>
                          <span>•</span>
                          <span>+{lesson.xp}pt</span>
                          {!lesson.isCompleted && (
                            <span>(오늘 {dailyCounts[lesson.difficulty] || 0}/5)</span>
                          )}
                        </div>

                      </div>
                    </div>
                    {isAdvancedLocked && (
                      <div className='education-lock-hover-msg'>
                        구독 후 이용할 수 있습니다
                      </div>
                    )}
                    <img
                      src={arrowDown}
                      alt='collapsed'
                      className={`arrow ${isOpen ? 'rotated' : ''} ${isAdvancedLocked ? 'locked-arrow' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className='education-accordion-body'>
                      <div className='education-lesson-summary'>
                        {(lesson.summary || '')
                          .split('\n')
                          .filter((line) => line.trim() !== '')
                          .map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                      </div>

                      {!lesson.isCompleted &&
                        (isQuotaFull ? (
                          <button type='button' className='education-xp-btn quota-full' disabled>
                            오늘의 정해진 {lesson.level} 교육 할당량을 모두 달성했습니다.
                          </button>
                        ) : (
                          <button
                            type='button'
                            className={`education-xp-btn ${countdown > 0 ? 'counting' : ''}`}
                            onClick={() => handleCompleteLesson(lesson.id)}
                            disabled={processingLessonId === lesson.id || countdown > 0}
                          >
                            {countdown > 0
                              ? `${countdown}초 후 완료`
                              : processingLessonId === lesson.id
                                ? '처리 중...'
                                : '학습 완료'}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredLessons.length > 5 && (
              <div className='education-more-wrap'>

                {/* 5개 이상 열렸을 때만 '학습 접기' 버튼 표시 */}
                {visibleCount > 5 && (
                  <button
                    type='button'
                    className='education-more-btn'
                    onClick={handleCollapse}
                  >
                    <span className='education-more-btn-text'>학습 접기 (10개)</span>
                    <span className='education-more-btn-arrow'>▲</span>
                  </button>
                )}

                {/* 현재 보여주는 개수가 전체 개수보다 작을 때만 '학습 더보기' 버튼 표시 */}
                {visibleCount < filteredLessons.length && (
                  <button
                    type='button'
                    className='education-more-btn'
                    onClick={handleLoadMore}
                  >
                    <span className='education-more-btn-text'>학습 더보기 (10개)</span>
                    <span className='education-more-btn-arrow'>▼</span>
                  </button>
                )}

              </div>
            )}
          </>
        ) : (
          <div className='education-empty-box'>
            {selectedStatusFilter === 'completed'
              ? '조건에 맞는 완료 학습이 없습니다.'
              : '조건에 맞는 학습이 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default Education