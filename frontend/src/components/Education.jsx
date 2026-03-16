import React, { useMemo, useState } from 'react'
import './Education.css'
import { educationLessons, getEducationProgress } from './educationData'
import arrowDown from '../assets/icons/arrow-down-line.svg'

const Education = () => {
  const [searchText, setSearchText] = useState('')
  const [openLessonId, setOpenLessonId] = useState('stock-intro')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const progress = getEducationProgress()

  const filteredLessons = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()

    let filtered = educationLessons

    if (selectedFilter === 'new') {
      filtered = filtered.filter((lesson) => lesson.badge === '신규')
    }

    if (selectedFilter === 'basic') {
      filtered = filtered.filter((lesson) => lesson.badge === '기초')
    }

    if (keyword) {
      filtered = filtered.filter((lesson) => {
        return (
          lesson.title.toLowerCase().includes(keyword) ||
          lesson.summary.toLowerCase().includes(keyword)
        )
      })
    }

    return filtered
  }, [searchText, selectedFilter])

  const handleToggleLesson = (lessonId) => {
    setOpenLessonId((prev) => (prev === lessonId ? null : lessonId))
  }

  return (
    <div className='education-container'>
      <div className='breadcrumb'>대시보드 &gt; 교육실</div>

      <div className='education-top-card'>
        <div className='education-title-wrap'>
          <h1>주식의 <strong>기초를 알아가자!</strong></h1>
          <p>기초를 알아야 <span className='daily-percent'>발전</span>해요!</p>
        </div>

        <div className='education-top-meta'>
          <div className='education-meta-chip'>오늘 목표 {progress.completedCount}개 완료</div>
          <div className='education-meta-chip'>연속 학습 3일째</div>
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
            ></div>
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
          <button
            type='button'
            className={`education-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            전체
          </button>
          <button
            type='button'
            className={`education-filter-btn ${selectedFilter === 'new' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('new')}
          >
            신규
          </button>
          <button
            type='button'
            className={`education-filter-btn ${selectedFilter === 'basic' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('basic')}
          >
            기초
          </button>
        </div>
      </div>


      <div className='education-list'>
        {filteredLessons.length > 0 ? (
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
                        <span className='education-badge'>{lesson.badge}</span>
                      </div>

                      <div className='education-sub-info'>
                        <span>{lesson.level}</span>
                        <span>•</span>
                        <span>{lesson.duration}</span>
                        <span>•</span>
                        <span>+{lesson.xp}pt</span>
                      </div>
                    </div>
                  </div>

                  <img src={arrowDown} alt="collapsed" className='arrow' />
                </button>

                {isOpen && (
                  <div className='education-accordion-body'>
                    <div className='education-lesson-summary'>
                      {lesson.summary}
                    </div>

                    <button type='button' className='education-xp-btn'>
                      학습 시작
                    </button>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className='education-empty-box'>
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default Education