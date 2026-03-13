import React, { useState } from 'react';
import axios from 'axios';

const QuizPage = () => {
  const [step, setStep] = useState('DIFFICULTY');
  const [difficulty, setDifficulty] = useState(null); 
  const [currentQuiz, setCurrentQuiz] = useState(null); 
  const [userAnswer, setUserAnswer] = useState(null); 
  const [isCorrect, setIsCorrect] = useState(null); 

  // 💡 새로 추가됨: 화면에 보여줄 섞인 보기 배열을 저장하는 공간
  const [shuffledOptions, setShuffledOptions] = useState([]);

  // 1️⃣ 난이도 선택 후 랜덤 문제 가져오기
  const startQuiz = async (selectedLevel) => {
    setDifficulty(selectedLevel);
    try {
      const response = await axios.get('http://localhost:5000/api/quiz/all');
      if (response.data.success) {
        const allQuizzes = response.data.data;
        const filteredQuizzes = allQuizzes.filter(q => q.difficulty === selectedLevel);
        
        if (filteredQuizzes.length === 0) {
          alert(`DB에 난이도 '${selectedLevel}'인 문제가 하나도 없습니다!`);
          return;
        }

        // 1. 랜덤으로 문제 하나 고르기
        const randomIdx = Math.floor(Math.random() * filteredQuizzes.length);
        const selectedQuiz = filteredQuizzes[randomIdx];
        
        setCurrentQuiz(selectedQuiz);
        
        // 2. 💡 마법의 시간: 보기 4개를 배열로 만들어서 섞어버리기!
        // originalNum을 기억해둬야 정답 맞출 때 진짜 몇 번 보기였는지 알 수 있습니다.
        const options = [
          { originalNum: 1, text: selectedQuiz.option_1 },
          { originalNum: 2, text: selectedQuiz.option_2 },
          { originalNum: 3, text: selectedQuiz.option_3 },
          { originalNum: 4, text: selectedQuiz.option_4 },
        ];
        
        // 자바스크립트의 sort()를 이용해 순서를 랜덤으로 뒤죽박죽 섞습니다.
        options.sort(() => Math.random() - 0.5);
        setShuffledOptions(options); // 섞인 배열을 상태에 저장!

        setUserAnswer(null);
        setIsCorrect(null);
        setStep('PLAYING');
      }
    } catch (err) {
      console.error(err);
      alert("백엔드 서버와 통신할 수 없습니다!");
    }
  };

  // 2️⃣ 정답 제출하기
  const submitAnswer = () => {
    if (!userAnswer) {
      alert("보기를 선택해주세요!");
      return;
    }

    // 유저가 고른 보기의 '원래 번호(originalNum)'와 DB의 정답 번호(1~4)를 비교합니다!
    const correct = (userAnswer === currentQuiz.answer);
    
    setIsCorrect(correct);
    setStep('RESULT'); 
  };

  if (step === 'DIFFICULTY') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2>📝 주식/금융 퀴즈</h2>
        <p style={{ color: 'gray', marginBottom: '30px' }}>도전할 난이도를 선택해 주세요!</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {['하', '중', '상'].map(level => (
            <button 
              key={level} 
              onClick={() => startQuiz(level)}
              style={{ padding: '20px 40px', fontSize: '20px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' }}
            >
              난이도 {level}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'PLAYING' && currentQuiz) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>📝 퀴즈 풀기 (난이도: {difficulty})</h2>
        <div style={{ border: '2px solid #007BFF', padding: '25px', borderRadius: '10px', backgroundColor: 'white' }}>
          <h3 style={{ marginTop: 0, lineHeight: '1.4' }}>Q. {currentQuiz.question}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {/* 💡 기존의 1,2,3,4 순서 대신, 아까 섞어둔 shuffledOptions 배열을 뿌려줍니다 */}
            {shuffledOptions.map((opt, index) => (
              <button
                key={opt.originalNum}
                // 클릭하면 화면상의 순서(index)가 아니라, 그 보기의 원래 번호(originalNum)를 기억합니다!
                onClick={() => setUserAnswer(opt.originalNum)}
                style={{
                  padding: '15px', textAlign: 'left', fontSize: '16px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: userAnswer === opt.originalNum ? '#007BFF' : '#f8f9fa',
                  color: userAnswer === opt.originalNum ? 'white' : 'black',
                  border: userAnswer === opt.originalNum ? '2px solid #0056b3' : '1px solid #ddd',
                }}
              >
                {/* 유저가 볼 때는 1, 2, 3, 4 순서대로 예쁘게 나오도록 index + 1 을 사용합니다 */}
                {index + 1}. {opt.text}
              </button>
            ))}
          </div>
          
          <button 
            onClick={submitAnswer} 
            style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
          >
            정답 제출하기
          </button>
        </div>
      </div>
    );
  }

  if (step === 'RESULT' && currentQuiz) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {isCorrect ? (
          <h1 style={{ color: '#28a745' }}>🎉 정답입니다!</h1>
        ) : (
          <h1 style={{ color: '#dc3545' }}>🥲 아쉽게도 오답입니다.</h1>
        )}
        
        {/* 💡 성준님이 꽉꽉 채워넣으신 모든 보기에 대한 해설이 여기에 출력됩니다! */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', backgroundColor: '#f9faff', textAlign: 'left', marginTop: '20px' }}>
          <h3 style={{ marginTop: 0 }}>💡 주식 용어 정리 (해설)</h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{currentQuiz.explanation}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button onClick={() => startQuiz(difficulty)} style={{ flex: 1, padding: '15px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
            같은 난이도 계속 풀기
          </button>
          <button onClick={() => setStep('DIFFICULTY')} style={{ flex: 1, padding: '15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
            난이도 다시 선택
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizPage;