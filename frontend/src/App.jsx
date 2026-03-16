import React, { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Main from './components/Main'

function App() {
  const [page, setPage] = useState('landing')

  // 💡 마법의 낚아채기 로직 (화면이 처음 켜질 때 한 번만 실행됨)
  useEffect(() => {
    // 1. 현재 주소창을 쓱 훑어봅니다.
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // 주소창에서 'token=' 뒤에 있는 값을 가져옴

    if (token) {
      // 2. 토큰을 발견했다면! 브라우저 지갑(localStorage)에 안전하게 보관합니다.
      // (이 지갑에 넣어둬야 나중에 새로고침해도 로그인이 풀리지 않습니다!)
      localStorage.setItem('token', token);
      
      // 3. 주소창에 엄청나게 긴 토큰이 남아있으면 안 예쁘니까 깔끔하게 지워줍니다.
      window.history.replaceState({}, document.title, "/");

      // 4. 출입증 확인 끝! 대시보드(main) 화면으로 문을 열어줍니다.
      setPage('main');
    } else {
      // 만약 주소창에 토큰은 없는데, 이미 지갑에 보관된 토큰이 있다면? 
      // (유저가 이미 로그인한 상태에서 F5 새로고침을 눌렀을 때)
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setPage('main');
      }
    }
  }, []);

  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'login' && <Login setPage={setPage} />}
      {page === 'main' && <Main />}
    </>
  )
}

export default App