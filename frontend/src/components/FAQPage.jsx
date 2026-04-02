import React, { useEffect, useMemo, useRef, useState } from 'react'
import './FAQPage.css'
import minus from '../assets/icons/minus.svg'
import plus from '../assets/icons/plus.svg'
import close from '../assets/icons/close.svg'

const API = 'http://localhost:5000/api/faq'

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

const getStoredToken = () => localStorage.getItem('token') || ''

const FAQPage = ({ setPage, scrollTarget = 'top' }) => {
  const [faqList, setFaqList] = useState([])
  const [questionList, setQuestionList] = useState([])

  const [search, setSearch] = useState('')
  const [sortType, setSortType] = useState('latest')
  const [openFaqId, setOpenFaqId] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [nickname, setNickname] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [editPassword, setEditPassword] = useState('')

  const [editQuestionId, setEditQuestionId] = useState(null)
  const [managePasswordMap, setManagePasswordMap] = useState({})

  const [commentList, setCommentList] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [guestCommentNickname, setGuestCommentNickname] = useState('')
  const [guestCommentPassword, setGuestCommentPassword] = useState('')
  const [guestCommentDeletePasswordMap, setGuestCommentDeletePasswordMap] = useState({})

  const [token, setToken] = useState(getStoredToken())

  const topRef = useRef(null)
  const questionRef = useRef(null)

  const fetchComments = async (questionId, currentToken = getStoredToken()) => {
    try {
      const res = await fetch(`${API}/questions/${questionId}/comments`, {
        headers: {
          ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        },
      })
      const data = await res.json()

      if (data.success) {
        setCommentList(data.data)
      } else {
        setCommentList([])
      }
    } catch (err) {
      console.error('댓글 조회 실패:', err)
      setCommentList([])
    }
  }

  const fetchData = async (currentToken = getStoredToken()) => {
    try {
      const faqRes = await fetch(API)
      const faqData = await faqRes.json()

      const qRes = await fetch(`${API}/questions`, {
        headers: {
          ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        },
      })
      const qData = await qRes.json()

      if (faqData.success) setFaqList(faqData.data)

      if (qData.success) {
        setQuestionList(qData.data)

        if (selectedQuestion) {
          const updatedQuestion = qData.data.find(
            (item) => Number(item.question_id) === Number(selectedQuestion.question_id)
          )

          if (updatedQuestion) {
            setSelectedQuestion(updatedQuestion)
            fetchComments(updatedQuestion.question_id, currentToken)
          } else {
            setSelectedQuestion(null)
            setCommentList([])
          }
        }
      }
    } catch (err) {
      console.error('FAQ 데이터 조회 실패:', err)
    }
  }

  useEffect(() => {
    const currentToken = getStoredToken()
    setToken(currentToken)
    fetchData(currentToken)

    const syncAll = () => {
      const latestToken = getStoredToken()
      setToken(latestToken)
      fetchData(latestToken)
    }

    window.addEventListener('focus', syncAll)
    window.addEventListener('storage', syncAll)
    window.addEventListener('hashchange', syncAll)

    return () => {
      window.removeEventListener('focus', syncAll)
      window.removeEventListener('storage', syncAll)
      window.removeEventListener('hashchange', syncAll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrollTarget === 'question' && questionRef.current) {
      setTimeout(() => {
        questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [scrollTarget])

  const filteredFaq = useMemo(() => {
    return faqList.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [faqList, search])

  const filteredQuestions = useMemo(() => {
    const result = questionList.filter((item) =>
      `${item.title} ${item.content} ${item.member_nickname || ''} ${item.nickname || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )

    if (sortType === 'latest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    if (sortType === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }

    return result
  }, [questionList, search, sortType])

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setNickname('')
    setIsAnonymous(true)
    setEditPassword('')
    setEditQuestionId(null)
  }

  const fillEditForm = (q) => {
    setSelectedQuestion(q)
    setOpenForm(true)
    setEditQuestionId(q.question_id)
    setTitle(q.title || '')
    setContent(q.content || '')
    setNickname(q.nickname || q.member_nickname || '')
    setIsAnonymous(Number(q.is_anonymous) === 1)
    setEditPassword('')

    setTimeout(() => {
      const formSection = document.getElementById('faq-form-section')
      formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const openQuestionDetail = (q) => {
    setSelectedQuestion(q)
    setOpenForm(false)
    setCommentContent('')
    setGuestCommentNickname('')
    setGuestCommentPassword('')
    fetchComments(q.question_id)
  }

  const closeQuestionDetail = () => {
    setSelectedQuestion(null)
    setOpenForm(false)
    setEditQuestionId(null)
    setCommentList([])
    setCommentContent('')
    setGuestCommentNickname('')
    setGuestCommentPassword('')
    resetForm()
  }

  const handleSubmit = async () => {
    const currentToken = getStoredToken()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력하세요.')
      return
    }

    if (!currentToken && !isAnonymous && !nickname.trim()) {
      alert('닉네임을 입력하세요.')
      return
    }

    if (!currentToken && !editPassword.trim()) {
      alert('비로그인 사용자는 수정/삭제용 비밀번호를 입력해야 합니다.')
      return
    }

    try {
      const url = editQuestionId
        ? `${API}/questions/${editQuestionId}`
        : `${API}/questions`

      const method = editQuestionId ? 'PATCH' : 'POST'

      const bodyData = {
        title,
        content,
        is_anonymous: isAnonymous,
      }

      if (!currentToken) {
        bodyData.nickname = nickname
        bodyData.edit_password = editPassword
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        },
        body: JSON.stringify(bodyData),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || (editQuestionId ? '질문 수정 실패' : '질문 등록 실패'))
        return
      }

      alert(editQuestionId ? '질문이 수정되었습니다.' : '질문이 등록되었습니다.')
      resetForm()
      setOpenForm(false)
      fetchData(currentToken)
    } catch (err) {
      console.error('질문 처리 실패:', err)
      alert('질문 처리 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteByOwner = async (q) => {
    const currentToken = getStoredToken()
    const password = managePasswordMap[q.question_id] || ''

    if (!q.member_id && q.has_password && !password.trim()) {
      alert('비밀번호를 입력하세요.')
      return
    }

    const ok = window.confirm('이 질문을 삭제하시겠습니까?')
    if (!ok) return

    try {
      const res = await fetch(`${API}/questions/${q.question_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        },
        body: JSON.stringify({
          edit_password: password,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '질문 삭제 실패')
        return
      }

      setManagePasswordMap((prev) => ({
        ...prev,
        [q.question_id]: '',
      }))

      await fetchData(currentToken)

      if (selectedQuestion && Number(selectedQuestion.question_id) === Number(q.question_id)) {
        setSelectedQuestion(null)
      }
    } catch (err) {
      console.error('질문 삭제 실패:', err)
      alert('질문 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCommentSubmit = async () => {
    const currentToken = getStoredToken()

    if (!selectedQuestion?.question_id) {
      alert('질문 정보를 찾을 수 없습니다.')
      return
    }

    if (!commentContent.trim()) {
      alert('댓글 내용을 입력하세요.')
      return
    }

    const bodyData = {
      content: commentContent,
    }

    if (!currentToken) {
      if (!guestCommentNickname.trim()) {
        alert('비로그인 사용자는 댓글 닉네임을 입력하세요.')
        return
      }

      if (!guestCommentPassword.trim()) {
        alert('비로그인 사용자는 댓글 비밀번호를 입력하세요.')
        return
      }

      bodyData.guest_nickname = guestCommentNickname
      bodyData.guest_password = guestCommentPassword
    }

    try {
      const res = await fetch(
        `${API}/questions/${selectedQuestion.question_id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
          },
          body: JSON.stringify(bodyData),
        }
      )

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '댓글 등록 실패')
        return
      }

      setCommentContent('')
      setGuestCommentNickname('')
      setGuestCommentPassword('')

      await fetchData(currentToken)
      await fetchComments(selectedQuestion.question_id, currentToken)
    } catch (err) {
      console.error('댓글 등록 실패:', err)
      alert('댓글 등록 중 오류가 발생했습니다.')
    }
  }

  const handleCommentDelete = async (comment) => {
    const currentToken = getStoredToken()
    const ok = window.confirm('이 댓글을 삭제하시겠습니까?')
    if (!ok) return

    const bodyData = {}

    if (!comment.member_id) {
      const password = guestCommentDeletePasswordMap[comment.comment_id] || ''

      if (!password.trim()) {
        alert('댓글 비밀번호를 입력하세요.')
        return
      }

      bodyData.guest_password = password
    }

    try {
      const res = await fetch(
        `${API}/questions/${selectedQuestion.question_id}/comments/${comment.comment_id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
          },
          body: JSON.stringify(bodyData),
        }
      )

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '댓글 삭제 실패')
        return
      }

      setGuestCommentDeletePasswordMap((prev) => ({
        ...prev,
        [comment.comment_id]: '',
      }))

      await fetchData(currentToken)
      await fetchComments(selectedQuestion.question_id, currentToken)
    } catch (err) {
      console.error('댓글 삭제 실패:', err)
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  const guard = (fn) => (e) => {
    if (e.altKey) return
    fn(e)
  }

  return (
    <div className='faq-page' ref={topRef}>
      <div className='faq-topbar'>
        <div className='faq-header'>
          <h1 className='faq-title'>도움말 센터</h1>
          <p className='faq-desc'>
            자주 묻는 질문을 확인하고, 필요한 경우 바로 질문을 남길 수 있습니다.
          </p>
        </div>
        <button
          type='button'
          className='faq-secondary-btn'
          onClick={guard(() => setOpenForm((prev) => !prev))}
        >
          {openForm ? '질문 작성 닫기' : '질문 남기기'}
        </button>
      </div>

      {openForm && (
        <section className='faq-panel' id='faq-form-section' ref={questionRef}>
          <div className='faq-panel-head'>
            <h2>{editQuestionId ? '질문 수정' : '질문 남기기'}</h2>
          </div>

          <div className='faq-form'>
            <div className='faq-form-field'>
              <label>제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='질문 제목을 입력하세요'
                maxLength={80}
              />
              <div className='faq-field-meta'>{title.length}/80</div>
            </div>

            <div className='faq-form-field'>
              <label>내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='궁금한 내용을 조금 더 자세히 적어주세요'
                rows='5'
                maxLength={1000}
              />
              <div className='faq-field-meta'>{content.length}/1000</div>
            </div>

            <div className='faq-anonymous-section'>
              <label className='faq-check-label'>
                <input
                  type='checkbox'
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(!isAnonymous)}
                />
                익명으로 작성
              </label>

              {!token && !isAnonymous && (
                <div className='faq-form-field faq-nickname-stack'>
                  <label>닉네임</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder='보여질 닉네임을 입력하세요'
                    maxLength={20}
                  />
                  <div className='faq-field-meta'>{nickname.length}/20</div>
                </div>
              )}
            </div>

            {!token && (
              <div className='faq-form-field faq-password-stack'>
                <label>수정/삭제용 비밀번호</label>
                <input
                  type='password'
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder='비로그인 사용자는 비밀번호를 입력하세요'
                  maxLength={30}
                />
              </div>
            )}

            <div className='faq-form-actions'>
              <button type='button' className='faq-primary-btn' onClick={guard(handleSubmit)}>
                {editQuestionId ? '질문 수정 저장' : '질문 등록'}
              </button>
              <button type='button' className='faq-secondary-btn' onClick={guard(resetForm)}>
                초기화
              </button>
            </div>
          </div>
        </section>
      )}

      {!selectedQuestion && (
        <>
          <div className='faq-toolbar'>
            <input
              className='faq-search-input'
              placeholder='FAQ / 질문 검색'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type='button'
              className='faq-open-form-btn'
              onClick={(e) => setSearch(e.target.value)}
            >
              검색
            </button>
          </div>

          <section className='faq-panel'>
            <div className='faq-panel-head'>
              <h2>자주 묻는 질문</h2>
            </div>

            <div className='faq-list'>
              {filteredFaq.length === 0 ? (
                <div className='faq-empty'>검색 결과가 없습니다.</div>
              ) : (
                filteredFaq.map((faq) => {
                  const isOpen = openFaqId === faq.faq_id

                  return (
                    <div key={faq.faq_id} className='landing-faq-accordion'>
                      <button
                        type='button'
                        className='landing-faq-question-row'
                        onClick={guard(() => toggleFaq(faq.faq_id))}
                      >
                        <span className='faq-question-text'>{faq.question}</span>
                        <span className='landing-faq-toggle'>
                          <img src={isOpen ? minus : plus} alt='toggle' />
                        </span>
                      </button>

                      {isOpen && (
                        <div className='landing-faq-answer-box'>
                          <span>{faq.answer}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <section className='faq-panel'>
            <div className='faq-panel-head'>
              <h2>유저 질문</h2>

              <div className='faq-sort-bar'>
                <button
                  type='button'
                  className={sortType === 'latest' ? 'active' : ''}
                  onClick={guard(() => setSortType('latest'))}
                >
                  최신순
                </button>

                <button
                  type='button'
                  className={sortType === 'oldest' ? 'active' : ''}
                  onClick={guard(() => setSortType('oldest'))}
                >
                  오래된순
                </button>
              </div>
            </div>

            <div className='question-board-head'>
              <div className='question-col-title'>제목</div>
              <div className='question-col-writer'>작성자</div>
            </div>

            <div className='question-board'>
              {filteredQuestions.length === 0 ? (
                <div className='question-board-empty'>등록된 질문이 없습니다.</div>
              ) : (
                filteredQuestions.map((q) => (
                  <button
                    key={q.question_id}
                    type='button'
                    className='question-board-row simple'
                    onClick={guard(() => openQuestionDetail(q))}
                  >
                    <div className='question-board-title'>
                      <div className='question-board-title-line'>
                        <span className='question-board-title-text'>{q.title}</span>
                        {q.is_answered && (
                          <span className='question-badge answered'>답변완료</span>
                        )}
                      </div>
                    </div>

                    <div className='question-board-writer'>
                      {q.is_anonymous ? '익명' : q.member_nickname || q.nickname}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {selectedQuestion && (
        <section className='faq-panel question-detail-panel'>
          <div className='question-detail-header'>
            <div className='question-detail-title-row'>
              <div className='question-detail-title-wrap'>
                <h2>{selectedQuestion.title}</h2>
                {selectedQuestion.is_answered && (
                  <span className='question-badge answered'>답변완료</span>
                )}
              </div>

              <div className='question-detail-meta'>
                <span>
                  작성자:{' '}
                  {selectedQuestion.is_anonymous
                    ? '익명'
                    : selectedQuestion.member_nickname || selectedQuestion.nickname}
                </span>
                <span>질문 등록: {formatDateTime(selectedQuestion.created_at)}</span>
              </div>
            </div>

            <button
              type='button'
              className='faq-secondary-btn'
              onClick={closeQuestionDetail}
            >
              목록으로
            </button>
          </div>

          <div className='question-detail-content'>
            <div className='question-detail-body'>{selectedQuestion.content}</div>
          </div>

          <div className='comment-section'>
            <div className='comment-section-head'>
              <h3>댓글</h3>
            </div>

            <div className='comment-write-box'>
              {!token && (
                <div className='comment-guest-meta'>
                  <input
                    value={guestCommentNickname}
                    onChange={(e) => setGuestCommentNickname(e.target.value)}
                    placeholder='비로그인 닉네임'
                    maxLength={20}
                  />
                  <input
                    type='password'
                    value={guestCommentPassword}
                    onChange={(e) => setGuestCommentPassword(e.target.value)}
                    placeholder='댓글 비밀번호'
                    maxLength={30}
                  />
                </div>
              )}

              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder='댓글을 남겨주세요'
                rows='3'
              />

              <div className='comment-write-actions'>
                <button
                  type='button'
                  className='faq-primary-btn'
                  onClick={handleCommentSubmit}
                >
                  댓글 등록
                </button>
              </div>
            </div>

            <div className='comment-list'>
              {commentList.length === 0 ? (
                <div className='comment-empty'>아직 등록된 댓글이 없습니다.</div>
              ) : (
                commentList.map((comment) => (
                  <React.Fragment key={comment.comment_id}>
                    <div className='comment-item'>
                      <div className='comment-meta'>
                        <span className='comment-writer'>{comment.writer_name}</span>
                        <span className='comment-date'>
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>

                      <div className='comment-content'>{comment.content}</div>
                    </div>

                    {comment.is_mine && (
                      <div className='comment-actions'>
                        <button
                          type='button'
                          className='faq-secondary-btn'
                          onClick={() => handleCommentDelete(comment)}
                        >
                          댓글 삭제
                        </button>
                      </div>
                    )}

                    {comment.is_guest_comment && (
                      <div className='comment-guest-delete'>
                        <input
                          type='password'
                          placeholder='댓글 비밀번호'
                          value={guestCommentDeletePasswordMap[comment.comment_id] || ''}
                          onChange={(e) =>
                            setGuestCommentDeletePasswordMap((prev) => ({
                              ...prev,
                              [comment.comment_id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type='button'
                          className='faq-secondary-btn'
                          onClick={() => handleCommentDelete(comment)}
                        >
                          댓글 삭제
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>

          {selectedQuestion.is_mine ? (
            <div className='question-user-tools'>
              <div className='question-user-tools-title'>내 질문 관리</div>
              <div className='question-user-tools-row'>
                <button
                  type='button'
                  className='faq-secondary-btn'
                  onClick={() => fillEditForm(selectedQuestion)}
                >
                  수정
                </button>

                <button
                  type='button'
                  className='faq-secondary-btn'
                  onClick={() => handleDeleteByOwner(selectedQuestion)}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : !selectedQuestion.member_id ? (
            <div className='question-user-tools'>
              <div className='question-user-tools-title'>작성자용 수정 / 삭제</div>

              {selectedQuestion.has_password ? (
                <>
                  <div className='question-user-tools-row'>
                    <input
                      type='password'
                      placeholder='비밀번호 입력'
                      value={managePasswordMap[selectedQuestion.question_id] || ''}
                      onChange={(e) =>
                        setManagePasswordMap({
                          ...managePasswordMap,
                          [selectedQuestion.question_id]: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className='question-user-tools-row'>
                    <button
                      type='button'
                      className='faq-secondary-btn'
                      onClick={() => fillEditForm(selectedQuestion)}
                    >
                      수정
                    </button>

                    <button
                      type='button'
                      className='faq-secondary-btn'
                      onClick={() => handleDeleteByOwner(selectedQuestion)}
                    >
                      삭제
                    </button>
                  </div>
                </>
              ) : (
                <div className='question-user-legacy-note'>
                  이 비회원 질문은 예전 방식으로 작성되어 비밀번호가 설정되지 않았습니다.
                </div>
              )}
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

export default FAQPage