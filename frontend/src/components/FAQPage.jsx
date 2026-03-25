import React, { useEffect, useMemo, useRef, useState } from 'react'
import './FAQPage.css'

const BACKEND_URL = 'http://localhost:5000'

const QUESTION_EMPTY_FORM = {
  title: '',
  content: '',
  category: '일반',
  is_anonymous: true,
  nickname: '',
}

const FAQPage = () => {
  const [faqList, setFaqList] = useState([])
  const [questionList, setQuestionList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [openFaqId, setOpenFaqId] = useState(null)

  const [questionForm, setQuestionForm] = useState(QUESTION_EMPTY_FORM)
  const [questionSaving, setQuestionSaving] = useState(false)

  const questionFormRef = useRef(null)

  const getFaqCategory = (faq) => {
    const text = `${faq?.question || ''} ${faq?.answer || ''}`.toLowerCase()

    if (
      text.includes('로그인') ||
      text.includes('카카오') ||
      text.includes('구글') ||
      text.includes('계정')
    ) {
      return '로그인'
    }

    if (
      text.includes('퀴즈') ||
      text.includes('교육') ||
      text.includes('학습')
    ) {
      return '학습'
    }

    if (
      text.includes('투자') ||
      text.includes('주식') ||
      text.includes('실전') ||
      text.includes('가상')
    ) {
      return '투자'
    }

    if (
      text.includes('포인트') ||
      text.includes('랭킹') ||
      text.includes('isr')
    ) {
      return '성장'
    }

    return '기타'
  }

  const fetchFaq = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/faq`)
      const data = await res.json()

      if (data?.success && Array.isArray(data.data)) {
        setFaqList(data.data)
      } else {
        setFaqList([])
      }
    } catch (err) {
      console.error('FAQ 불러오기 실패:', err)
      setFaqList([])
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/faq/questions/list/public`)
      const data = await res.json()

      if (data?.success && Array.isArray(data.data)) {
        setQuestionList(data.data)
      } else {
        setQuestionList([])
      }
    } catch (err) {
      console.error('질문 목록 불러오기 실패:', err)
      setQuestionList([])
    }
  }

  useEffect(() => {
    fetchFaq()
    fetchQuestions()
  }, [])

  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('faq_scroll_target')

    if (scrollTarget === 'question') {
      setTimeout(() => {
        questionFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 200)
    }

    sessionStorage.removeItem('faq_scroll_target')
  }, [])

  const categories = useMemo(() => {
    const dynamicCategories = faqList.map((faq) => getFaqCategory(faq))
    return ['전체', ...Array.from(new Set(dynamicCategories))]
  }, [faqList])

  const filteredFaqList = useMemo(() => {
    return faqList.filter((faq) => {
      const category = getFaqCategory(faq)
      const keyword = searchKeyword.trim().toLowerCase()
      const targetText = `${faq.question || ''} ${faq.answer || ''}`.toLowerCase()

      const categoryMatched =
        selectedCategory === '전체' || selectedCategory === category

      const keywordMatched =
        keyword === '' || targetText.includes(keyword)

      return categoryMatched && keywordMatched
    })
  }, [faqList, selectedCategory, searchKeyword])

  const toggleFaq = (faqId) => {
    setOpenFaqId((prev) => (prev === faqId ? null : faqId))
  }

  const handleQuestionChange = (e) => {
    const { name, value, type, checked } = e.target

    setQuestionForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetQuestionForm = () => {
    setQuestionForm(QUESTION_EMPTY_FORM)
  }

  const handleQuestionSubmit = async (e) => {
    e.preventDefault()

    if (!questionForm.title.trim()) {
      alert('제목을 입력하세요.')
      return
    }

    if (!questionForm.content.trim()) {
      alert('내용을 입력하세요.')
      return
    }

    if (!questionForm.is_anonymous && !questionForm.nickname.trim()) {
      alert('닉네임을 입력하세요.')
      return
    }

    try {
      setQuestionSaving(true)

      const payload = {
        title: questionForm.title.trim(),
        content: questionForm.content.trim(),
        category: questionForm.category,
        is_anonymous: questionForm.is_anonymous ? 1 : 0,
        nickname: questionForm.is_anonymous ? '' : questionForm.nickname.trim(),
      }

      const res = await fetch(`${BACKEND_URL}/api/faq/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || '질문 등록 실패')
      }

      alert('질문이 등록되었습니다.')
      resetQuestionForm()
      fetchQuestions()
    } catch (err) {
      console.error(err)
      alert(err.message || '질문 등록 중 오류가 발생했습니다.')
    } finally {
      setQuestionSaving(false)
    }
  }

  return (
    <div className='faq-page'>
      <div className='faq-breadcrumb'>대시보드 &gt; FAQ</div>

      <div className='faq-card faq-page-hero'>
        <p className='faq-page-subtitle'>HELP CENTER</p>
        <h1>FAQ / 질문하기</h1>
        <p className='faq-page-desc'>
          자주 묻는 질문을 확인하고, 원하는 답이 없으면 질문을 남겨주세요.
        </p>
      </div>

      <div className='faq-card faq-main-card'>
        <div className='faq-section-header'>
          <div>
            <p className='faq-page-subtitle'>FAQ</p>
            <h2>자주 묻는 질문</h2>
          </div>
        </div>

        <div className='faq-toolbar'>
          <div className='faq-categories'>
            {categories.map((category) => (
              <button
                key={category}
                type='button'
                className={`faq-chip ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <input
            type='text'
            className='faq-search'
            placeholder='질문 검색'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className='faq-accordion-list'>
          {filteredFaqList.length === 0 ? (
            <p className='faq-empty'>검색 결과가 없습니다.</p>
          ) : (
            filteredFaqList.map((faq) => {
              const isOpen = openFaqId === faq.faq_id
              const category = getFaqCategory(faq)

              return (
                <div key={faq.faq_id} className='faq-accordion'>
                  <button
                    type='button'
                    className={`faq-question-row ${isOpen ? 'open' : ''}`}
                    onClick={() => toggleFaq(faq.faq_id)}
                  >
                    <div className='faq-question-left'>
                      <span className='faq-badge'>{category}</span>
                      <span className='faq-question-text'>Q. {faq.question}</span>
                    </div>
                    <span className='faq-toggle'>{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div className='faq-answer-box'>
                      <p>A. {faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className='faq-card faq-question-card' ref={questionFormRef}>
        <div className='faq-section-header'>
          <div>
            <p className='faq-page-subtitle'>QUESTION</p>
            <h2>질문 남기기</h2>
            <p className='faq-page-desc'>
              궁금한 내용을 남겨주시면 확인 후 답변을 반영하겠습니다.
            </p>
          </div>
        </div>

        <form className='faq-question-form' onSubmit={handleQuestionSubmit}>
          <div className='faq-question-grid'>
            <div className='faq-question-field'>
              <label>카테고리</label>
              <select
                name='category'
                value={questionForm.category}
                onChange={handleQuestionChange}
              >
                <option value='일반'>일반</option>
                <option value='로그인'>로그인</option>
                <option value='학습'>학습</option>
                <option value='투자'>투자</option>
                <option value='결제'>결제</option>
                <option value='기타'>기타</option>
              </select>
            </div>

            <div className='faq-question-field faq-question-check'>
              <label>익명 여부</label>
              <label className='faq-question-checkbox'>
                <input
                  type='checkbox'
                  name='is_anonymous'
                  checked={questionForm.is_anonymous}
                  onChange={handleQuestionChange}
                />
                익명으로 등록하기
              </label>
            </div>
          </div>

          {!questionForm.is_anonymous && (
            <div className='faq-question-field'>
              <label>닉네임</label>
              <input
                type='text'
                name='nickname'
                value={questionForm.nickname}
                onChange={handleQuestionChange}
                placeholder='표시할 닉네임을 입력하세요'
              />
            </div>
          )}

          <div className='faq-question-field'>
            <label>제목</label>
            <input
              type='text'
              name='title'
              value={questionForm.title}
              onChange={handleQuestionChange}
              placeholder='질문 제목을 입력하세요'
            />
          </div>

          <div className='faq-question-field'>
            <label>내용</label>
            <textarea
              name='content'
              value={questionForm.content}
              onChange={handleQuestionChange}
              placeholder='궁금한 내용을 남겨주세요'
              rows='5'
            />
          </div>

          <div className='faq-question-actions'>
            <button type='submit' disabled={questionSaving}>
              {questionSaving ? '등록 중...' : '질문 등록하기'}
            </button>
            <button
              type='button'
              className='secondary'
              onClick={resetQuestionForm}
              disabled={questionSaving}
            >
              초기화
            </button>
          </div>
        </form>
      </div>

      <div className='faq-card faq-question-list-card'>
        <div className='faq-section-header'>
          <div>
            <p className='faq-page-subtitle'>RECENT</p>
            <h2>최근 질문</h2>
          </div>
        </div>

        {questionList.length === 0 ? (
          <p className='faq-empty'>등록된 질문이 없습니다.</p>
        ) : (
          <div className='faq-question-list'>
            {questionList.map((item) => (
              <div key={item.question_id} className='faq-question-item'>
                <div className='faq-question-item-top'>
                  <span className='faq-question-category'>{item.category}</span>
                  <span className='faq-question-author'>
                    {Number(item.is_anonymous) === 1
                      ? '익명'
                      : item.nickname || '사용자'}
                  </span>
                </div>

                <div className='faq-question-title'>{item.title}</div>
                <div className='faq-question-content'>{item.content}</div>

                <div className='faq-question-bottom'>
                  <span>{item.status === 'answered' ? '답변완료' : '답변대기'}</span>
                  <span>{item.created_at_label || ''}</span>
                </div>

                {item.admin_answer ? (
                  <div className='faq-question-answer'>
                    <strong>운영진 답변</strong>
                    <p>{item.admin_answer}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FAQPage