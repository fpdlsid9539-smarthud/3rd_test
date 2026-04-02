import React, { useState, useEffect } from 'react'
import { api } from '../config/api'
import './QuizPage.css'

const POINT_TABLE = {
  하: { correct: 1000, wrong: 0 },
  중: { correct: 2000, wrong: 0 },
  상: { correct: 3000, wrong: 0 },
}
const PERFECT_BONUS = { 하: 5000, 중: 10000, 상: 20000 }

const MAX_QUESTIONS = 10
const MAX_AI_MIX_COUNT = 3
const DIFFICULTIES = ['하', '중', '상']

const shuffleArray = (arr = []) => [...arr].sort(() => Math.random() - 0.5)

const buildKeywordCandidates = (quizzes = [], difficulty = '하') => {
  const stopWords = new Set([
    '주식', '투자', '시장', '다음', '무엇', '대한', '관련', '설명', '가장',
    '옳은', '틀린', '보기', '경우', '하는', '있는', '입니다', '이다', '수',
    '및', '를', '을', '이', '가', '은', '는', '에', '의', '로', '과', '와',
  ])

  const tokens = quizzes
    .flatMap((quiz) => {
      const sourceText = [
        quiz.question,
        quiz.explanation,
        quiz.option_1,
        quiz.option_2,
        quiz.option_3,
        quiz.option_4,
      ]
        .filter(Boolean)
        .join(' ')

      return sourceText
        .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((v) => v.trim())
        .filter((v) => v.length >= 2)
    })
    .filter((token) => !stopWords.has(token))

  const unique = [...new Set(tokens)].slice(0, 8)

  return ['주식', '기초', `난이도${difficulty}`, ...unique].slice(0, 10)
}

const QuizPage = () => {
  const [step, setStep] = useState('DIFFICULTY')
  const [difficulty, setDifficulty] = useState(null)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [userAnswer, setUserAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [shuffledOptions, setShuffledOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  const [isOxModalOpen, setIsOxModalOpen] = useState(false)
  const [oxQuizData, setOxQuizData] = useState(null)
  const [oxTodayCount, setOxTodayCount] = useState(0)
  const [oxResult, setOxResult] = useState(null)
  const [oxType, setOxType] = useState(null)

  const [attemptNum, setAttemptNum] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [sessionLog, setSessionLog] = useState([])
  const [allQuizzes, setAllQuizzes] = useState([])

  const [quizRankingTab, setQuizRankingTab] = useState('accuracy')
  const [quizRankings, setQuizRankings] = useState([])
  const [rankingLoading, setRankingLoading] = useState(false)

  const [wrongNotes, setWrongNotes] = useState([])
  const [wrongNotesLoading, setWrongNotesLoading] = useState(false)
  const [showWrongNotes, setShowWrongNotes] = useState(false)
  const [openWrongNoteIds, setOpenWrongNoteIds] = useState({})

  const [llmKeywords, setLlmKeywords] = useState('')
  const [llmQuizLoading, setLlmQuizLoading] = useState(false)

  const sessionLength = allQuizzes.length || MAX_QUESTIONS

  useEffect(() => {
    const fetchUserAuth = async () => {
      try {
        const res = await api.get('/api/auth/me')
        const payload = res?.data?.data ?? res?.data ?? {}
        const memberData = payload?.member || payload || {}
        const membership = String(memberData?.membership_type || '').toLowerCase()
        setIsPremium(['premium', 'premium_member', 'paid'].includes(membership))
      } catch (err) {
        console.error('유저 정보 로딩 실패', err)
      }
    }
    fetchUserAuth()
  }, [])

  useEffect(() => {
    if (step === 'DIFFICULTY') {
      fetchQuizRankings(quizRankingTab)
      fetchWrongNotes()
    }
  }, [step, quizRankingTab])

  const fetchQuizRankings = async (tab) => {
    setRankingLoading(true)
    try {
      const res = await api.get(`/api/quiz/ranking?type=${tab}`)
      const data = res?.data?.data ?? res?.data ?? []
      setQuizRankings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('랭킹 로딩 실패', err)
      setQuizRankings([])
    } finally {
      setRankingLoading(false)
    }
  }

  const fetchWrongNotes = async () => {
    setWrongNotesLoading(true)
    try {
      const res = await api.get('/api/quiz/wrong-notes/me')
      const data = res?.data?.data ?? res?.data ?? []
      const nextWrongNotes = Array.isArray(data) ? data : []
      setWrongNotes(nextWrongNotes)

      const initialOpenState = {}
      nextWrongNotes.slice(0, 5).forEach((item, index) => {
        initialOpenState[item.history_id] = index === 0
      })
      setOpenWrongNoteIds(initialOpenState)
    } catch (err) {
      console.error('오답노트 로딩 실패', err)
      setWrongNotes([])
      setOpenWrongNoteIds({})
    } finally {
      setWrongNotesLoading(false)
    }
  }

  const toggleWrongNoteItem = (historyId) => {
    setOpenWrongNoteIds((prev) => ({
      ...prev,
      [historyId]: !prev[historyId],
    }))
  }

  const handleOpenOxModal = async () => {
    setIsOxModalOpen(true)
    setOxResult(null)
    setOxQuizData(null)
    setOxType(null)

    try {
      const res = await api.get('/api/quiz/ox')
      const payload = res?.data?.data ?? res?.data ?? {}

      if (payload.isLimitReached) {
        setOxTodayCount(1)
        return
      }

      setOxQuizData(payload.quiz || null)
      setOxTodayCount(payload.todayCount || 0)
      setOxType(payload.type || null)
    } catch (err) {
      console.error('OX 퀴즈 로딩 실패 =', err)
      alert('O/X 퀴즈를 불러오지 못했습니다.')
      setIsOxModalOpen(false)
    }
  }

  const handleOxSubmit = async (answer) => {
    try {
      const res = await api.post('/api/quiz/ox/submit', { userAnswer: answer })
      const payload = res?.data?.data ?? res?.data ?? {}
      setOxResult(payload)
      window.dispatchEvent(new Event('pointsUpdated'))
    } catch (err) {
      console.error('OX 제출 실패 =', err)
      alert('정답 제출 중 오류가 발생했습니다.')
    }
  }

  const loadQuestionByIndex = (quizList, nextIndex) => {
    const list = quizList ?? allQuizzes
    const selected = list[nextIndex]

    if (!selected) {
      setStep('SUMMARY')
      return
    }

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

  const createMixedQuizSession = async (selectedLevel, dbQuizzes) => {
    const selectedDbCount = Math.max(1, MAX_QUESTIONS - MAX_AI_MIX_COUNT)
    const shuffledDb = shuffleArray(dbQuizzes)
    const selectedDb = shuffledDb
      .slice(0, selectedDbCount)
      .map((quiz) => ({ ...quiz, source: 'db' }))

    const aiNeedCount = Math.max(0, MAX_QUESTIONS - selectedDb.length)
    const keywordCandidates = buildKeywordCandidates(selectedDb, selectedLevel)
    const seedQuestions = selectedDb.slice(0, 5).map((quiz) => quiz.question)

    const aiPromises = Array.from({ length: aiNeedCount }).map((_, index) =>
      api.post('/api/quiz/generate', {
        difficulty: selectedLevel,
        keywords: keywordCandidates,
        seedQuestions,
        mixIndex: index + 1,
      })
    )

    const aiResults = await Promise.allSettled(aiPromises)

    const aiQuizzes = aiResults
      .map((result, index) => {
        if (result.status !== 'fulfilled') return null

        const payload = result.value?.data?.data ?? result.value?.data ?? {}
        if (!payload?.question) return null

        return {
          quiz_id: `ai-mix-${Date.now()}-${index}`,
          difficulty: selectedLevel,
          source: 'ai',
          question: payload.question,
          option_1: payload.option_1,
          option_2: payload.option_2,
          option_3: payload.option_3,
          option_4: payload.option_4,
          answer: Number(payload.answer),
          explanation: payload.explanation,
        }
      })
      .filter(Boolean)

    return shuffleArray([...selectedDb, ...aiQuizzes]).slice(0, MAX_QUESTIONS)
  }

  const startSession = async (selectedLevel) => {
    setDifficulty(selectedLevel)
    setLoading(true)
    setAttemptNum(0)
    setCorrectCount(0)
    setTotalPoints(0)
    setSessionLog([])
    setShowWrongNotes(false)

    try {
      const response = await api.get('/api/quiz/all')
      const payload = response?.data?.data ?? response?.data ?? []
      const filtered = payload.filter((q) => q.difficulty === selectedLevel)

      if (filtered.length === 0) {
        alert(`DB에 난이도 '${selectedLevel}'인 문제가 하나도 없습니다!`)
        return
      }

      const mixedSession = await createMixedQuizSession(selectedLevel, filtered)

      if (!mixedSession.length) {
        alert('퀴즈 세션을 생성하지 못했습니다.')
        return
      }

      setAllQuizzes(mixedSession)
      loadQuestionByIndex(mixedSession, 0)
    } catch (err) {
      console.error(err)
      alert(err?.message || '백엔드 서버와 통신할 수 없습니다!')
    } finally {
      setLoading(false)
    }
  }

  const generateLLMQuiz = async () => {
    const parsedKeywords = llmKeywords
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

    if (parsedKeywords.length === 0) {
      alert('키워드를 입력해주세요. 예: PER, 공매도')
      return
    }

    setLlmQuizLoading(true)

    try {
      const res = await api.post('/api/quiz/generate', {
        keywords: parsedKeywords,
      })

      const payload = res?.data?.data ?? res?.data ?? {}

      if (!payload?.question) {
        throw new Error('AI 퀴즈 생성 결과가 올바르지 않습니다.')
      }

      const aiQuiz = {
        quiz_id: `ai-${Date.now()}`,
        difficulty: 'AI',
        source: 'ai',
        question: payload.question,
        option_1: payload.option_1,
        option_2: payload.option_2,
        option_3: payload.option_3,
        option_4: payload.option_4,
        answer: Number(payload.answer),
        explanation: payload.explanation,
      }

      setDifficulty('AI')
      setCurrentQuiz(aiQuiz)
      setAttemptNum(0)
      setCorrectCount(0)
      setTotalPoints(0)
      setSessionLog([])
      setAllQuizzes([aiQuiz])
      setShowWrongNotes(false)

      const options = [
        { originalNum: 1, text: aiQuiz.option_1 },
        { originalNum: 2, text: aiQuiz.option_2 },
        { originalNum: 3, text: aiQuiz.option_3 },
        { originalNum: 4, text: aiQuiz.option_4 },
      ].sort(() => Math.random() - 0.5)

      setShuffledOptions(options)
      setUserAnswer(null)
      setIsCorrect(null)
      setResultData(null)
      setStep('PLAYING')
    } catch (err) {
      console.error('AI 퀴즈 생성 실패 =', err)
      alert(err?.response?.data?.message || err?.message || 'AI 퀴즈 생성에 실패했습니다.')
    } finally {
      setLlmQuizLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer) {
      alert('보기를 선택해주세요!')
      return
    }

    try {
      const isAiQuiz =
        String(currentQuiz?.quiz_id).startsWith('ai-') || currentQuiz?.source === 'ai'

      if (isAiQuiz) {
        const aiDifficulty = difficulty === 'AI' ? '하' : difficulty

        const res = await api.post('/api/quiz/check-ai', {
          question: currentQuiz.question,
          answer: userAnswer,
          correctAnswer: currentQuiz.answer,
          explanation: currentQuiz.explanation,
          difficulty: aiDifficulty,
        })

        const payload = res?.data?.data ?? res?.data ?? {}
        const correct = Boolean(payload.isCorrect)
        const pts = Number(
          payload.rewardPoints ??
          POINT_TABLE[aiDifficulty]?.[correct ? 'correct' : 'wrong'] ??
          0
        )

        const newCorrectCount = correctCount + (correct ? 1 : 0)
        const newTotalPoints = totalPoints + pts

        setIsCorrect(correct)
        setResultData(payload)
        setCorrectCount(newCorrectCount)
        setTotalPoints(newTotalPoints)
        setSessionLog((prev) => [
          ...prev,
          {
            question: currentQuiz.question,
            correct,
            points: pts,
            source: 'ai',
          },
        ])

        window.dispatchEvent(new Event('pointsUpdated'))
        setStep('RESULT')
        return
      }

      const res = await api.post('/api/quiz/check', {
        quiz_id: currentQuiz.quiz_id,
        answer: userAnswer,
        difficulty,
      })

      const payload = res?.data?.data ?? res?.data ?? {}
      const correct = Boolean(payload.isCorrect)
      const pts = Number(
        payload.rewardPoints ??
          POINT_TABLE[difficulty]?.[correct ? 'correct' : 'wrong'] ??
          0
      )

      const newCorrectCount = correctCount + (correct ? 1 : 0)
      const newTotalPoints = totalPoints + pts

      setIsCorrect(correct)
      setResultData(payload)
      setCorrectCount(newCorrectCount)
      setTotalPoints(newTotalPoints)
      setSessionLog((prev) => [
        ...prev,
        {
          question: currentQuiz.question,
          correct,
          points: pts,
          source: 'db',
        },
      ])

      window.dispatchEvent(new Event('pointsUpdated'))
      setStep('RESULT')
    } catch (err) {
      console.error('퀴즈 제출 실패 =', err)
      alert(err?.response?.data?.message || err?.message || '정답 확인에 실패했습니다.')
    }
  }

  const handleNext = async () => {
    const nextIndex = attemptNum + 1
    const isAiSingleQuiz =
      difficulty === 'AI' && String(currentQuiz?.quiz_id).startsWith('ai-')

    if (isAiSingleQuiz) {
      setStep('DIFFICULTY')
      return
    }

    if (nextIndex >= sessionLength) {
      const finalCorrectCount = correctCount
      const isPerfect = finalCorrectCount === sessionLength

      if (isPerfect && difficulty !== 'AI') {
        try {
          await api.post('/api/quiz/bonus', { difficulty })
          window.dispatchEvent(new Event('pointsUpdated'))
        } catch (err) {
          console.error('보너스 지급 실패', err)
        }
      }

      fetchWrongNotes()
      setStep('SUMMARY')
      return
    }

    loadQuestionByIndex(null, nextIndex)
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
    setLlmKeywords('')
    setShowWrongNotes(false)
    fetchWrongNotes()
  }

  const getOxTypeLabel = (type) => {
    if (type === 'market') return '📊 시장 기반'
    if (type === 'concept') return '🤖 AI 개념'
    return 'OX 퀴즈'
  }

  const renderQuizRanking = () => (
    <div className='quiz-ranking-container'>
      <div className='quiz-ranking-header'>
        <div className='quiz-ranking-title'>
          <h2>퀴즈 명예의 전당</h2>
        </div>

        <div className='quiz-ranking-tabs'>
          <button
            className={`qr-tab ${quizRankingTab === 'accuracy' ? 'active' : ''}`}
            onClick={() => setQuizRankingTab('accuracy')}
          >
            정답률 TOP
          </button>
          <button
            className={`qr-tab ${quizRankingTab === 'total' ? 'active' : ''}`}
            onClick={() => setQuizRankingTab('total')}
          >
            다득점 TOP
          </button>
          <button
            className={`qr-tab ${quizRankingTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setQuizRankingTab('weekly')}
          >
            주간 TOP
          </button>
        </div>
      </div>

      <div className='quiz-ranking-list'>
        {rankingLoading ? (
          <div className='qr-empty'>순위를 분석 중입니다...</div>
        ) : quizRankings.length > 0 ? (
          quizRankings.map((user, index) => (
            <div className='qr-item' key={user.id || index}>
              <div className='qr-item-left'>
                <span className={`qr-rank num-${index + 1}`}>{index + 1}</span>
                <div className='qr-profile-placeholder'>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt='profile' className='qr-profile-img' />
                  ) : (
                    user.nickname?.substring(0, 1)
                  )}
                </div>
                <span className='qr-nickname'>{user.nickname}</span>
              </div>
              <div className='qr-item-right'>
                <span className='qr-score'>
                  {quizRankingTab === 'total'
                    ? `${user.score}문제`
                    : `${Number(user.score).toFixed(1)}%`}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className='qr-empty'>아직 랭킹 데이터가 없습니다.</div>
        )}
      </div>
    </div>
  )

  const renderWrongNotes = () => (
    <div className='quiz-ranking-container'>
      <div className='quiz-ranking-header'>
        <div className='quiz-ranking-title'>
          <h2>오답노트</h2>
        </div>
      </div>

      <div className='quiz-ranking-list'>
        {wrongNotesLoading ? (
          <div className='qr-empty'>오답노트 불러오는 중...</div>
        ) : wrongNotes.length > 0 ? (
          wrongNotes.slice(0, 5).map((item) => {
            const isOpen = Boolean(openWrongNoteIds[item.history_id])

            return (
              <div
                className={`wrong-note-card ${isOpen ? 'open' : ''}`}
                key={item.history_id}
              >
                <button
                  type='button'
                  className='wrong-note-toggle'
                  onClick={() => toggleWrongNoteItem(item.history_id)}
                >
                  <div className='wrong-note-toggle-left'>
                    <div className='wrong-note-question'>
                      [{item.difficulty}] {item.question}
                    </div>
                    <div className='wrong-note-answer-meta'>
                      내 답: {item.selected_answer}번 / 정답: {item.correct_answer}번
                    </div>
                  </div>

                  <span className={`wrong-note-arrow ${isOpen ? 'open' : ''}`}>
                    ▼
                  </span>
                </button>

                <div className={`wrong-note-body ${isOpen ? 'open' : ''}`}>
                  <div className='wrong-note-options'>
                    {[1, 2, 3, 4].map((num) => {
                      const optionText = item[`option_${num}`]
                      const isMyAnswer = Number(item.selected_answer) === num
                      const isCorrectAnswer = Number(item.correct_answer) === num

                      return (
                        <div
                          key={num}
                          className={`wrong-note-option ${
                            isCorrectAnswer
                              ? 'correct'
                              : isMyAnswer
                              ? 'my-answer'
                              : ''
                          }`}
                        >
                          <strong className='wrong-note-option-num'>{num}번</strong>
                          <span>{optionText}</span>

                          {isMyAnswer && (
                            <span className='wrong-note-badge my-answer'>
                              (내 선택)
                            </span>
                          )}

                          {isCorrectAnswer && (
                            <span className='wrong-note-badge correct'>
                              (정답)
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className='qr-empty'>오답노트가 없습니다.</div>
        )}
      </div>
    </div>
  )

  const renderDifficulty = () => (
    <>
      <div className='quiz-section'>
        <p className='quiz-subtitle'>먼저, 도전할 난이도를 선택해 주세요!</p>

        <div className='quiz-top-tools'>
          <input
            type='text'
            value={llmKeywords}
            onChange={(e) => setLlmKeywords(e.target.value)}
            placeholder='예: PER, 공매도, 코스피'
            className='quiz-keyword-input'
          />
          <button
            className='btn btn-primary quiz-ai-generate-btn'
            onClick={generateLLMQuiz}
            disabled={llmQuizLoading}
          >
            {llmQuizLoading ? '생성 중...' : 'AI 문제 생성'}
          </button>
        </div>

        {loading && <p className='quiz-loading'>문제를 불러오는 중...</p>}

        <div className='difficulty-buttons'>
          {DIFFICULTIES.map((level) => {
            const isLocked = level === '상' && !isPremium

            return (
              <div key={level} className={`diff-btn-wrapper ${isLocked ? 'locked' : ''}`}>
                <button
                  className='btn btn-difficulty'
                  onClick={() => startSession(level)}
                  disabled={loading || isLocked}
                >
                  {isLocked && <span className='lock-icon'>🔒</span>}
                  난이도 {level}
                </button>

                {isLocked && (
                  <div className='premium-tooltip'>구독 후 이용 가능합니다</div>
                )}
              </div>
            )
          })}

          <button className='ox-floating-btn' onClick={handleOpenOxModal}>
            일일 O/X
          </button>

          {isOxModalOpen && (
            <div className='ox-modal-overlay'>
              <div className='ox-modal-content'>
                <div className='ox-modal-header'>
                  <div className='ox-header-title'>
                    <h2>FinSight 일일 O/X 퀴즈</h2>
                  </div>
                  <button className='ox-modal-close' onClick={() => setIsOxModalOpen(false)}>
                    ✕
                  </button>
                </div>

                <div className='ox-modal-body'>
                  <p className='ox-guide-text'>
                    하루에 단 한 번 참여 가능합니다. (정답 시 500P, 참가상 100P)
                  </p>

                  {oxType && !oxResult && (
                    <div
                      style={{
                        marginBottom: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: '#f4f7ff',
                        color: '#315efb',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {getOxTypeLabel(oxType)}
                    </div>
                  )}

                  {oxTodayCount >= 1 && !oxResult ? (
                    <div className='ox-status-box finished'>
                      <h3>오늘의 퀴즈 완료!</h3>
                      <p>내일 새로운 주가 퀴즈로 만나요</p>
                      <button className='btn btn-primary' onClick={() => setIsOxModalOpen(false)}>
                        닫기
                      </button>
                    </div>
                  ) : oxResult ? (
                    <div className={`ox-status-box result ${oxResult.isCorrect ? 'correct' : 'wrong'}`}>
                      <div
                        style={{
                          marginBottom: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: '#f4f7ff',
                          color: '#315efb',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {getOxTypeLabel(oxResult.type)}
                      </div>
                      <h3>{oxResult.isCorrect ? '정답입니다!' : '아쉬워요!'}</h3>
                      <p className='ox-reward'><span>{oxResult.rewardPoints}pt</span> 지급 완료</p>
                      <div className='ox-explanation-card'>
                        <div className='exp-answer'>정답: <strong>{oxResult.correctAnswer}</strong></div>
                        <p className='exp-text'>{oxResult.explanation}</p>
                      </div>
                      <button className='btn btn-primary' onClick={() => setIsOxModalOpen(false)}>
                        돌아가기
                      </button>
                    </div>
                  ) : oxQuizData ? (
                    <div className='ox-quiz-play'>
                      <div className='ox-question-card'>
                        {oxQuizData.referenceDate && (
                          <div className='ox-reference-date'>
                            ({oxQuizData.referenceDate} 기준)
                          </div>
                        )}
                        <p className='ox-question-text'>{oxQuizData.question}</p>
                      </div>
                      <div className='ox-btn-group'>
                        <button className='btn-ox btn-o' onClick={() => handleOxSubmit('O')}>
                          <span className='ox-char'>O</span>
                          <span className='ox-label'>그렇다</span>
                        </button>
                        <button className='btn-ox btn-x' onClick={() => handleOxSubmit('X')}>
                          <span className='ox-char'>X</span>
                          <span className='ox-label'>아니다</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className='ox-loading'>
                      <div className='spinner'></div>
                      <p>OX 퀴즈를 준비 중입니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderQuizRanking()}
      {renderWrongNotes()}

      <div className='point-guide'>
        <div>
          <h4>포인트 안내</h4>
          <table className='point-table'>
            <thead>
              <tr><th>난이도</th><th>정답</th><th>만점</th></tr>
            </thead>
            <tbody>
              <tr><td>하</td><td className='plus'>+1,000</td><td className='plus'>+{PERFECT_BONUS.하.toLocaleString('ko-KR')}</td></tr>
              <tr><td>중</td><td className='plus'>+2,000</td><td className='plus'>+{PERFECT_BONUS.중.toLocaleString('ko-KR')}</td></tr>
              <tr><td>상</td><td className='plus'>+3,000</td><td className='plus'>+{PERFECT_BONUS.상.toLocaleString('ko-KR')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )

  const renderPlaying = () => (
    <div className='quiz-section'>
      <h1>퀴즈 <strong>난이도 {difficulty}</strong></h1>
      <div className='progress-wrap'>
        <div className='progress-meta'>
          <span>{difficulty === 'AI' ? 'AI 생성 문제' : `${attemptNum + 1} / ${sessionLength} 문제`}</span>
          <span className='progress-correct'>정답 {correctCount}개</span>
        </div>
        <div className='progress-bar'>
          <div
            className='progress-fill'
            style={{
              width: `${difficulty === 'AI' ? 100 : (attemptNum / sessionLength) * 100}%`
            }}
          />
        </div>
      </div>
      <div className='quiz-card'>
        <h3 className='quiz-question'>
          {difficulty === 'AI'
            ? `AI 문제. ${currentQuiz?.question}`
            : `Q${attemptNum + 1}. ${currentQuiz?.question}`}
        </h3>
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
        <button className='btn btn-submit' onClick={submitAnswer}>정답 제출하기</button>
      </div>
    </div>
  )

  const renderResult = () => {
    const isAiSingleQuiz = difficulty === 'AI'
    const isLastQuestion = attemptNum + 1 >= sessionLength
    const pts = Number(
      resultData?.rewardPoints ??
      POINT_TABLE[difficulty]?.[isCorrect ? 'correct' : 'wrong'] ??
      0
    )

    return (
      <div className='quiz-section result-section'>
        <div className='progress-wrap'>
          <div className='progress-meta'>
            <span>{isAiSingleQuiz ? 'AI 생성 문제 결과' : `${attemptNum + 1} / ${sessionLength} 문제`}</span>
            <span className='progress-correct'>정답 {correctCount}개</span>
          </div>
          <div className='progress-bar'>
            <div
              className='progress-fill'
              style={{
                width: `${isAiSingleQuiz ? 100 : ((attemptNum + 1) / sessionLength) * 100}%`
              }}
            />
          </div>
        </div>
        <div className={`result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
          <span>{isCorrect ? '정답입니다!' : '아쉽게도 오답입니다.'}</span>
          <span className={`result-pts ${isCorrect ? 'plus' : 'minus'}`}>
            {pts > 0 ? '+' : ''}{pts.toLocaleString('ko-KR')} P
          </span>
        </div>
        <div className='explanation-card'>
          <h3 className='explanation-title'>
            {isCorrect ? '💡 기본 해설' : '🤖 AI 해설'}
          </h3>
          <p className='explanation-text'>
            {isCorrect
              ? (resultData?.explanation || currentQuiz?.explanation)
              : (resultData?.llmExplanation || resultData?.explanation || currentQuiz?.explanation)}
          </p>
        </div>
        <div className='result-actions'>
          <button className='btn btn-primary' onClick={handleNext}>
            {isAiSingleQuiz
              ? '퀴즈 메인으로'
              : (isLastQuestion ? '결과 보기' : `다음 문제 (${attemptNum + 2} / ${sessionLength})`)}
          </button>
          <button className='btn btn-secondary' onClick={resetAll}>그만하기</button>
        </div>
      </div>
    )
  }

  const renderSummary = () => {
    const isPerfect = correctCount === sessionLength
    const finalPoints = totalPoints + (isPerfect && difficulty !== 'AI' ? PERFECT_BONUS[difficulty] : 0)

    return (
      <div className='quiz-section summary-section'>
        <div className='quiz-title'>
          <h1>{isPerfect ? '🏆 완벽해요!' : '📊 세션 결과'}</h1>
        </div>
        <div className='summary-score'>
          <div className='summary-fraction'>
            <span className='summary-correct'>{correctCount}</span>
            <span className='summary-total'> / {sessionLength}</span>
          </div>
          <p className='summary-label'>정답</p>
        </div>
        {isPerfect && difficulty !== 'AI' && (
          <div className='bonus-banner'>
            🎊 {sessionLength}문제 전부 정답! 보너스 +{PERFECT_BONUS[difficulty].toLocaleString('ko-KR')} 포인트 지급!
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
              <span className='log-question'>{log.source === 'ai' ? '[AI] ' : ''}{log.question}</span>
              <span className={`log-pts ${log.correct ? 'plus' : 'minus'}`}>
                {log.points > 0 ? '+' : ''}{log.points.toLocaleString('ko-KR')} P
              </span>
            </li>
          ))}
        </ul>

        <div className='result-actions'>
          <button
            className='btn btn-secondary'
            onClick={() => setShowWrongNotes((prev) => !prev)}
          >
            {showWrongNotes ? '퀴즈 오답노트 숨기기' : '퀴즈 오답노트 보기'}
          </button>
        </div>

        {showWrongNotes && renderWrongNotes()}

        <div className='result-actions'>
          <button className='btn btn-primary' onClick={() => startSession(difficulty)}>같은 난이도 다시 도전</button>
          <button className='btn btn-secondary' onClick={resetAll}>난이도 다시 선택</button>
        </div>
      </div>
    )
  }

  return (
    <div className='quiz-container'>
      <div className='breadcrumb'>대시보드 &gt; 퀴즈</div>

      <div className='quiz-title'>
        <h1>나의 기초를 <strong>도전해보자!</strong></h1>
        <p>교육실에서 배운 내용을 적용해보세요.</p>
      </div>

      {step === 'DIFFICULTY' && renderDifficulty()}
      {step === 'PLAYING' && currentQuiz && renderPlaying()}
      {step === 'RESULT' && currentQuiz && renderResult()}
      {step === 'SUMMARY' && renderSummary()}
    </div>
  )
}

export default QuizPage