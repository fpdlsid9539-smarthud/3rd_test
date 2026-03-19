import React, { useEffect, useMemo, useState } from 'react'
import './Education.css'
import arrowDown from '../assets/icons/arrow-down-line.svg'
import check from '../assets/icons/check.svg'

const API_BASE_URL = 'http://localhost:5000'

const getAccessToken = () => {
  return localStorage.getItem('token') || ''
}

const Education = () => {
  const [searchText, setSearchText] = useState('')
  const [openLessonId, setOpenLessonId] = useState(null)

  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('all')

  const [educationLessons, setEducationLessons] = useState([])
  const [progress, setProgress] = useState({
    completedCount: 0,
    totalCount: 0,
    percent: 0,
  })
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [processingLessonId, setProcessingLessonId] = useState(null)

  const getVisibleLessons = (lessons, statusFilter, difficultyFilter) => {
    let visible = [...lessons]

    if (statusFilter === 'all') {
      visible = visible.filter((lesson) => !lesson.isCompleted)
    }

    if (statusFilter === 'new') {
      visible = visible.filter(
        (lesson) => !lesson.isCompleted && lesson.status === 'new'
      )
    }

    if (statusFilter === 'completed') {
      visible = visible.filter((lesson) => lesson.isCompleted)
    }

    if (difficultyFilter !== 'all') {
      visible = visible.filter(
        (lesson) => lesson.difficulty === difficultyFilter
      )
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

        if (!token) {
          throw new Error('UNAUTHORIZED')
        }

        const res = await fetch(`${API_BASE_URL}/api/education`, {
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

        const lessons = data.lessons || []
        const progressData = data.progress || {
          completedCount: 0,
          totalCount: 0,
          percent: 0,
        }

        setEducationLessons(lessons)
        setProgress(progressData)
        setTotalEarnedPoints(data.totalEarnedPoints || 0)

        setOpenLessonId(null)
      } catch (err) {
        console.error('교육 데이터 조회 실패:', err)

        if (err.message === 'UNAUTHORIZED') {
          setError('로그인이 필요합니다.')
        } else {
          setError('교육 데이터를 불러오지 못했습니다.')
        }

        setEducationLessons([])
        setProgress({
          completedCount: 0,
          totalCount: 0,
          percent: 0,
        })
        setTotalEarnedPoints(0)
        setOpenLessonId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchEducationData()
  }, [])

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

  useEffect(() => {
    if (filteredLessons.length === 0) {
      setOpenLessonId(null)
      return
    }

    if (openLessonId === null) {
      return
    }

    const stillExists = filteredLessons.some((lesson) => lesson.id === openLessonId)

    if (!stillExists) {
      setOpenLessonId(filteredLessons[0].id)
    }
  }, [filteredLessons, openLessonId])

  const handleToggleLesson = (lessonId) => {
    setOpenLessonId((prev) => (prev === lessonId ? null : lessonId))
  }

  const handleCompleteLesson = async (lessonId) => {
    try {
      setProcessingLessonId(lessonId)
      setActionMessage('')
      setError('')

      const token = getAccessToken()

      if (!token) {
        throw new Error('UNAUTHORIZED')
      }

      const res = await fetch(`${API_BASE_URL}/api/education/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const nextLessons = data.lessons || []

      setEducationLessons(nextLessons)
      setProgress(
        data.progress || {
          completedCount: 0,
          totalCount: 0,
          percent: 0,
        }
      )
      setTotalEarnedPoints(data.totalEarnedPoints || 0)

      window.dispatchEvent(new Event('pointsUpdated'));
      
      if ((data.awardedPoints || 0) > 0) {
        setActionMessage(`학습 완료! ${data.awardedPoints}pt를 획득했습니다.`)
      }

      const nextVisibleLessons = getVisibleLessons(
        nextLessons,
        selectedStatusFilter,
        selectedDifficultyFilter
      )

      setOpenLessonId(nextVisibleLessons.length > 0 ? nextVisibleLessons[0].id : null)
    } catch (err) {
      console.error('학습 완료 처리 실패:', err)

      if (err.message === 'UNAUTHORIZED') {
        setError('로그인이 필요합니다.')
      } else {
        setError('학습 완료 처리에 실패했습니다.')
      }
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

        <div className='education-top-meta'>
          <div className='education-meta-chip'>오늘 목표 {progress.completedCount}개 완료</div>
          <div className='education-meta-chip'>누적 포인트 {totalEarnedPoints}pt</div>
        </div>

        <div className='education-progress-wrap'>
          <div className='education-progress-top'>
            <span>학습 진행도</span>
            <span>
              {progress.completedCount}/{progress.totalCount}
            </span>
          </div>

          <div className='education-progress-bar'>
            <div
              className='education-progress-fill'
              style={{ width: `${progress.percent}%` }}
            />
          </div>
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
              onClick={() => setSelectedDifficultyFilter('all')}
            >
              전체 난이도
            </button>

            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'beginner' ? 'active' : ''}`}
              onClick={() => setSelectedDifficultyFilter('beginner')}
            >
              초급
            </button>

            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'intermediate' ? 'active' : ''}`}
              onClick={() => setSelectedDifficultyFilter('intermediate')}
            >
              중급
            </button>

            <button
              type='button'
              className={`education-filter-btn ${selectedDifficultyFilter === 'advanced' ? 'active' : ''}`}
              onClick={() => setSelectedDifficultyFilter('advanced')}
            >
              상급
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className='education-empty-box' style={{ marginBottom: '12px' }}>
          {actionMessage}
        </div>
      )}

      {error && (
        <div className='education-empty-box' style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <div className='education-list'>
        {loading ? (
          <div className='education-empty-box'>교육 데이터를 불러오는 중입니다.</div>
        ) : filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => {
            const isOpen = openLessonId === lesson.id

            return (
              <div
                className={`education-accordion-item ${isOpen ? 'open' : ''}`}
                key={lesson.id}
              >
                <button
                  type='button'
                  className='education-accordion-header'
                  onClick={() => handleToggleLesson(lesson.id)}
                >
                  <div className='education-header-main'>
                    <div className='education-icon-box'>{lesson.icon}</div>

                    <div className='education-header-text'>
                      <div className='education-header-title-row'>
                        <span className='education-lesson-title'>{lesson.title}</span>

                        {lesson.status === 'new' && !lesson.isCompleted && (
                          <span className='education-badge education-badge-new'>
                            신규
                          </span>
                        )}

                        {lesson.isCompleted && (
                          <span className='education-badge education-badge-completed'>
                            완료
                          </span>
                        )}
                      </div>

                      <div className='education-sub-info'>
                        <span>{lesson.level}</span>
                        <span>•</span>
                        <span>+{lesson.xp}pt</span>
                      </div>
                    </div>
                  </div>

                  <img
                    src={arrowDown}
                    alt='collapsed'
                    className={`arrow ${isOpen ? 'rotated' : ''}`}
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

                    {!lesson.isCompleted && (
                      <button
                        type='button'
                        className='education-xp-btn'
                        onClick={() => handleCompleteLesson(lesson.id)}
                        disabled={processingLessonId === lesson.id}
                      >
                        {processingLessonId === lesson.id ? '처리 중...' : '학습 완료'}
                        <img src={check} alt='check' className='icons' />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
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