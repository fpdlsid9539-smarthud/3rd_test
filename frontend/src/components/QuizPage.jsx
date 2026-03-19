import React, { useState } from 'react'
import { api } from '../config/api'
import './Quizpage.css'

const POINT_TABLE = {
  하: { correct: 1000, wrong: -500 },
  중: { correct: 2000, wrong: -1000 },
  상: { correct: 3000, wrong: -1500 },
}
const PERFECT_BONUS = { 하: 5000, 중: 10000, 상: 20000 };

const MAX_QUESTIONS = 10
const DIFFICULTIES = ['하', '중', '상']

const QuizPage = () => {
  const [step, setStep] = useState('DIFFICULTY') // 'DIFFICULTY' | 'PLAYING' | 'RESULT' | 'SUMMARY'
  const [difficulty, setDifficulty] = useState(null)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [userAnswer, setUserAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [shuffledOptions, setShuffledOptions] = useState([])
  const [loading, setLoading] = useState(false)

  // Session tracking
  const [attemptNum, setAttemptNum] = useState(0)       // 0-based current question index
  const [correctCount, setCorrectCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [sessionLog, setSessionLog] = useState([])      // [{question, correct, points}]
  const [allQuizzes, setAllQuizzes] = useState([])      // cached quiz list

  /* ─────────────────────────────────────────
     Actions
  ───────────────────────────────────────── */
  const startSession = async (selectedLevel) => {
    setDifficulty(selectedLevel)
    setLoading(true)
    setAttemptNum(0)
    setCorrectCount(0)
    setTotalPoints(0)
    setSessionLog([])

    try {
      const response = await api.get('/api/quiz/all')
      if (!response.success) throw new Error('퀴즈 로딩 실패')

      const filtered = response.data.filter((q) => q.difficulty === selectedLevel)
      if (filtered.length === 0) {
        alert(`DB에 난이도 '${selectedLevel}'인 문제가 하나도 없습니다!`)
        return
      }

      setAllQuizzes(filtered)
      await loadNextQuestion(filtered, 0)
    } catch (err) {
      console.error(err)
      alert(err.message || '백엔드 서버와 통신할 수 없습니다!')
    } finally {
      setLoading(false)
    }
  }

  const loadNextQuestion = async (quizList, nextIndex) => {
    const list = quizList ?? allQuizzes
    const selected = list[Math.floor(Math.random() * list.length)]
    setCurrentQuiz(selected)

    const options = [
      { originalNum: 1, text: selected.option_1 },
      { originalNum: 2, text: selected.option_2 },
      { originalNum: 3, text: selected.option_3 },
      { originalNum: 4, text: selected.option_4 },
    ].sort(() => Math.random() - 0.5)

    setShuffledOptions(options)
    setUserAnswer(null)
    setIsCorrect(null)
    setResultData(null)
    setAttemptNum(nextIndex)
    setStep('PLAYING')
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
        difficulty,
      })

      const correct = response.data.isCorrect
      const pts = POINT_TABLE[difficulty]?.[correct ? 'correct' : 'wrong'] ?? 0
      const newCorrectCount = correctCount + (correct ? 1 : 0)
      const newTotalPoints = totalPoints + pts

      setIsCorrect(correct)
      setResultData(response.data)
      setCorrectCount(newCorrectCount)
      setTotalPoints(newTotalPoints)
      setSessionLog(prev => [...prev, {
        question: currentQuiz.question,
        correct,
        points: pts,
      }])
      window.dispatchEvent(new Event('pointsUpdated'))
      setStep('RESULT')
    } catch (err) {
      alert(err.message || '정답 확인에 실패했습니다.')
    }
  }

  const handleNext = async () => {
    const nextIndex = attemptNum + 1

    if (nextIndex >= MAX_QUESTIONS) {
      // Session complete — check perfect bonus
      const isPerfect = correctCount + (isCorrect ? 1 : 0) === MAX_QUESTIONS
      if (isPerfect) {
        try {
          await api.post('/api/quiz/bonus', { difficulty })
          window.dispatchEvent(new Event('pointsUpdated'))
        } catch (err) {
          console.error('보너스 지급 실패', err)
        }
      }
      setStep('SUMMARY')
      return
    }

    await loadNextQuestion(null, nextIndex)
  }

  const resetAll = () => {
    setStep('DIFFICULTY')
    setDifficulty(null)
    setCurrentQuiz(null)
    setUserAnswer(null)
    setIsCorrect(null)
    setResultData(null)
    setShuffledOptions([])
    setAttemptNum(0)
    setCorrectCount(0)
    setTotalPoints(0)
    setSessionLog([])
    setAllQuizzes([])
  }

  /* ─────────────────────────────────────────
     Render sections
  ───────────────────────────────────────── */
  const renderDifficulty = () => (
    <div className='quiz-section'>
      <div className='quiz-title'>
        <h1>나의 기초를 <strong>도전해보자!</strong></h1>
        <p>교육실에서 배운 내용을 적용해보세요.</p>
      </div>
      <p className='quiz-subtitle'>먼저, 도전할 난이도를 선택해 주세요!</p>
      {loading && <p className='quiz-loading'>문제를 불러오는 중...</p>}
      <div className='difficulty-buttons'>
        {DIFFICULTIES.map((level) => (
          <button
            key={level}
            className='btn btn-difficulty'
            onClick={() => startSession(level)}
            disabled={loading}
          >
            난이도 {level}
          </button>
        ))}
      </div>
      <div className='point-guide'>
        <div>
          <h4>포인트 안내</h4>
          <table className='point-table'>
            <thead>
              <tr><th>난이도</th><th>정답</th><th>오답</th><th>만점</th></tr>
            </thead>
            <tbody>
              <tr><td>하</td><td className='plus'>+1,000</td><td className='minus'>-500</td><td className='plus'>+{PERFECT_BONUS.하}</td></tr>
              <tr><td>중</td><td className='plus'>+2,000</td><td className='minus'>-1,000</td><td className='plus'>+{PERFECT_BONUS.중}</td></tr>
              <tr><td>상</td><td className='plus'>+3,000</td><td className='minus'>-1,500</td><td className='plus'>+{PERFECT_BONUS.상}</td></tr>
            </tbody>
          </table>
        </div>
        <p className='bonus-note'></p>
      </div>
    </div>
  )

  const renderPlaying = () => (
    <div className='quiz-section'>
      <div className='quiz-title'>
        <h1>📝 퀴즈 <strong>난이도 {difficulty}</strong></h1>
      </div>

      {/* Progress bar */}
      <div className='progress-wrap'>
        <div className='progress-meta'>
          <span>{attemptNum + 1} / {MAX_QUESTIONS} 문제</span>
          <span className='progress-correct'>정답 {correctCount}개</span>
        </div>
        <div className='progress-bar'>
          <div className='progress-fill' style={{ width: `${(attemptNum / MAX_QUESTIONS) * 100}%` }} />
        </div>
      </div>

      <div className='quiz-card'>
        <h3 className='quiz-question'>Q{attemptNum + 1}. {currentQuiz?.question}</h3>
        <div className='option-list'>
          {shuffledOptions.map((opt, index) => (
            <button
              key={opt.originalNum}
              className={`btn btn-option ${userAnswer === opt.originalNum ? 'selected' : ''}`}
              onClick={() => setUserAnswer(opt.originalNum)}
            >
              <span className='option-num'>{index + 1}</span>
              {opt.text}
            </button>
          ))}
        </div>
        <button className='btn btn-submit' onClick={submitAnswer}>
          정답 제출하기
        </button>
      </div>
    </div>
  )

  const renderResult = () => {
    const isLastQuestion = attemptNum + 1 >= MAX_QUESTIONS
    const pts = POINT_TABLE[difficulty]?.[isCorrect ? 'correct' : 'wrong'] ?? 0

    return (
      <div className='quiz-section result-section'>
        <div className='progress-wrap'>
          <div className='progress-meta'>
            <span>{attemptNum + 1} / {MAX_QUESTIONS} 문제</span>
            <span className='progress-correct'>정답 {correctCount}개</span>
          </div>
          <div className='progress-bar'>
            <div className='progress-fill' style={{ width: `${((attemptNum + 1) / MAX_QUESTIONS) * 100}%` }} />
          </div>
        </div>

        <div className={`result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
          <span>{isCorrect ? '🎉 정답입니다!' : '🥲 아쉽게도 오답입니다.'}</span>
          <span className={`result-pts ${isCorrect ? 'plus' : 'minus'}`}>
            {pts > 0 ? '+' : ''}{pts.toLocaleString('ko-KR')} P
          </span>
        </div>

        <div className='explanation-card'>
          <h3 className='explanation-title'>💡 주식 용어 정리 (해설)</h3>
          <p className='explanation-text'>{currentQuiz?.explanation}</p>
        </div>

        <div className='result-actions'>
          <button className='btn btn-primary' onClick={handleNext}>
            {isLastQuestion ? '결과 보기' : `다음 문제 (${attemptNum + 2} / ${MAX_QUESTIONS})`}
          </button>
          <button className='btn btn-secondary' onClick={resetAll}>
            그만하기
          </button>
        </div>
      </div>
    )
  }

  const renderSummary = () => {
    const isPerfect = correctCount === MAX_QUESTIONS
    const finalPoints = totalPoints + (isPerfect ? PERFECT_BONUS : 0)

    return (
      <div className='quiz-section summary-section'>
        <div className='quiz-title'>
          <h1>{isPerfect ? '🏆 완벽해요!' : '📊 세션 결과'}</h1>
        </div>

        <div className='summary-score'>
          <div className='summary-fraction'>
            <span className='summary-correct'>{correctCount}</span>
            <span className='summary-total'> / {MAX_QUESTIONS}</span>
          </div>
          <p className='summary-label'>정답</p>
        </div>

        {isPerfect && (
          <div className='bonus-banner'>
            🎊 10문제 전부 정답! 보너스 +{PERFECT_BONUS.toLocaleString('ko-KR')} 포인트 지급!
          </div>
        )}

        <div className='summary-points'>
          <span>획득 포인트 결과</span>
          <strong className={finalPoints >= 0 ? 'plus' : 'minus'}>
            {finalPoints >= 0 ? '+' : ''}{finalPoints.toLocaleString('ko-KR')} P
          </strong>
        </div>

        <ul className='session-log'>
          {sessionLog.map((log, i) => (
            <li key={i} className={`log-item ${log.correct ? 'correct' : 'wrong'}`}>
              <span className='log-num'>Q{i + 1}</span>
              <span className='log-question'>{log.question}</span>
              <span className={`log-pts ${log.correct ? 'plus' : 'minus'}`}>
                {log.points > 0 ? '+' : ''}{log.points.toLocaleString('ko-KR')} P
              </span>
            </li>
          ))}
        </ul>

        <div className='result-actions'>
          <button className='btn btn-primary' onClick={() => startSession(difficulty)}>
            같은 난이도 다시 도전
          </button>
          <button className='btn btn-secondary' onClick={resetAll}>
            난이도 다시 선택
          </button>
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────
     Single return
  ───────────────────────────────────────── */
  return (
    <div className='quiz-container'>
      <div className='breadcrumb'>대시보드 &gt; 전략실 &gt; 퀴즈</div>

      {step === 'DIFFICULTY' && renderDifficulty()}
      {step === 'PLAYING' && currentQuiz && renderPlaying()}
      {step === 'RESULT' && currentQuiz && renderResult()}
      {step === 'SUMMARY' && renderSummary()}
    </div>
  )
}

export default QuizPage