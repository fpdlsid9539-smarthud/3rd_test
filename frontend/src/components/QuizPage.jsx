import React, { useState } from 'react'
import { api } from '../config/api'

const QuizPage = () => {
  const [step, setStep] = useState('DIFFICULTY')
  const [difficulty, setDifficulty] = useState(null)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [userAnswer, setUserAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [shuffledOptions, setShuffledOptions] = useState([])
  const [loading, setLoading] = useState(false)

  const startQuiz = async (selectedLevel) => {
    setDifficulty(selectedLevel)
    setLoading(true)

    try {
      const response = await api.get('/api/quiz/all')

      if (response.success) {
        const allQuizzes = response.data
        const filteredQuizzes = allQuizzes.filter((q) => q.difficulty === selectedLevel)

        if (filteredQuizzes.length === 0) {
          alert(`DB에 난이도 '${selectedLevel}'인 문제가 하나도 없습니다!`)
          setLoading(false)
          return
        }

        const randomIdx = Math.floor(Math.random() * filteredQuizzes.length)
        const selectedQuiz = filteredQuizzes[randomIdx]

        setCurrentQuiz(selectedQuiz)

        const options = [
          { originalNum: 1, text: selectedQuiz.option_1 },
          { originalNum: 2, text: selectedQuiz.option_2 },
          { originalNum: 3, text: selectedQuiz.option_3 },
          { originalNum: 4, text: selectedQuiz.option_4 },
        ]

        options.sort(() => Math.random() - 0.5)
        setShuffledOptions(options)

        setUserAnswer(null)
        setIsCorrect(null)
        setStep('PLAYING')
      }
    } catch (err) {
      console.error(err)
      alert(err.message || '백엔드 서버와 통신할 수 없습니다!')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer) {
      alert('보기를 선택해주세요!')
      return
    }

    try {
      const response = await api.post('/api/quiz/check', {
        quiz_id: currentQuiz.quiz_id,
        answer: userAnswer,
      })

      setIsCorrect(response.data.isCorrect)
      setStep('RESULT')
    } catch (err) {
      alert(err.message || '정답 확인에 실패했습니다.')
    }
  }

  if (step === 'DIFFICULTY') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2>📝 주식/금융 퀴즈</h2>
        <p style={{ color: 'gray', marginBottom: '30px' }}>도전할 난이도를 선택해 주세요!</p>

        {loading && <p>문제를 불러오는 중...</p>}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {['하', '중', '상'].map((level) => (
            <button
              key={level}
              onClick={() => startQuiz(level)}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                backgroundColor: '#007BFF',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: '0.2s',
              }}
            >
              난이도 {level}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'PLAYING' && currentQuiz) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>📝 퀴즈 풀기 (난이도: {difficulty})</h2>
        <div style={{ border: '2px solid #007BFF', padding: '25px', borderRadius: '10px', backgroundColor: 'white' }}>
          <h3 style={{ marginTop: 0, lineHeight: '1.4' }}>Q. {currentQuiz.question}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {shuffledOptions.map((opt, index) => (
              <button
                key={opt.originalNum}
                onClick={() => setUserAnswer(opt.originalNum)}
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontSize: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: userAnswer === opt.originalNum ? '#007BFF' : '#f8f9fa',
                  color: userAnswer === opt.originalNum ? 'white' : 'black',
                  border: userAnswer === opt.originalNum ? '2px solid #0056b3' : '1px solid #ddd',
                }}
              >
                {index + 1}. {opt.text}
              </button>
            ))}
          </div>

          <button
            onClick={submitAnswer}
            style={{
              width: '100%',
              padding: '15px',
              marginTop: '25px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            정답 제출하기
          </button>
        </div>
      </div>
    )
  }

  if (step === 'RESULT' && currentQuiz) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {isCorrect ? (
          <h1 style={{ color: '#28a745' }}>🎉 정답입니다!</h1>
        ) : (
          <h1 style={{ color: '#dc3545' }}>🥲 아쉽게도 오답입니다.</h1>
        )}

        <div
          style={{
            border: '1px solid #ddd',
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: '#f9faff',
            textAlign: 'left',
            marginTop: '20px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>💡 주식 용어 정리 (해설)</h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{currentQuiz.explanation}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button
            onClick={() => startQuiz(difficulty)}
            style={{
              flex: 1,
              padding: '15px',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            같은 난이도 계속 풀기
          </button>
          <button
            onClick={() => setStep('DIFFICULTY')}
            style={{
              flex: 1,
              padding: '15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            난이도 다시 선택
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default QuizPage