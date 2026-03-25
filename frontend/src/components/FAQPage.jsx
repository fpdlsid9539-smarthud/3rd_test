import React, { useEffect, useState } from 'react'
import './FAQPage.css'

const API = 'http://localhost:5000/api/faq'

const FAQPage = () => {
  const [faqList, setFaqList] = useState([])
  const [questionList, setQuestionList] = useState([])

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [nickname, setNickname] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)

  const [answerMap, setAnswerMap] = useState({})
  const token = localStorage.getItem('token')

  const fetchData = async () => {
    const faqRes = await fetch(API)
    const faqData = await faqRes.json()

    const qRes = await fetch(`${API}/questions`)
    const qData = await qRes.json()

    if (faqData.success) setFaqList(faqData.data)
    if (qData.success) setQuestionList(qData.data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (!title || !content) return alert('입력하세요')

    await fetch(`${API}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        nickname,
        is_anonymous: isAnonymous,
      }),
    })

    setTitle('')
    setContent('')
    setNickname('')
    fetchData()
  }

  const handleAnswer = async (id) => {
    await fetch(`${API}/questions/${id}/answer`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answer: answerMap[id],
      }),
    })

    fetchData()
  }

  const handleDelete = async (id) => {
    await fetch(`${API}/questions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    fetchData()
  }

  return (
    <div className='faq-page'>

      {/* 🔥 1. 자주 묻는 질문 */}
      <div className='faq-section'>
        <h1>자주 묻는 질문</h1>

        {faqList.map((faq) => (
          <div key={faq.faq_id} className='faq-item'>
            <h3>Q. {faq.question}</h3>
            <p>A. {faq.answer}</p>
          </div>
        ))}
      </div>

      {/* 🔥 2. 질문 작성 */}
      <div className='faq-form'>
        <h2>질문 남기기</h2>

        <input
          placeholder='제목'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder='내용'
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {!isAnonymous && (
          <input
            placeholder='닉네임'
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}

        <label>
          <input
            type='checkbox'
            checked={isAnonymous}
            onChange={() => setIsAnonymous(!isAnonymous)}
          />
          익명
        </label>

        <button onClick={handleSubmit}>등록</button>
      </div>

      {/* 🔥 3. 유저 질문 */}
      <div className='faq-questions'>
        <h2>유저 질문</h2>

        {questionList.map((q) => (
          <div key={q.question_id} className='question-item'>
            <h3>Q. {q.title}</h3>
            <p>{q.content}</p>

            <small>
              작성자: {q.is_anonymous ? '익명' : q.nickname}
            </small>

            {q.admin_answer ? (
              <div className='answer'>A. {q.admin_answer}</div>
            ) : (
              token && (
                <>
                  <textarea
                    placeholder='답변 작성'
                    onChange={(e) =>
                      setAnswerMap({ ...answerMap, [q.question_id]: e.target.value })
                    }
                  />
                  <button onClick={() => handleAnswer(q.question_id)}>답변</button>
                  <button onClick={() => handleDelete(q.question_id)}>삭제</button>
                </>
              )
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

export default FAQPage