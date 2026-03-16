import React, { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Main from './components/Main'

function App() {
  const [page, setPage] = useState('landing')

  // 💡 마법의 낚아채기 로직 (화면이 처음 켜질 때 한 번만 실행됨)
  useEffect(() => {
    // 1. 현재 주소창을 쓱 훑어봅니다.
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // 주소창에서 'token=' 뒤에 있는 값을 가져옴

    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, "/");
      setPage('main');
      return
    }

    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setPage('main')
    } else {
      setPage('landing')
    }
  }, []);

  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'main' && <Main />}
    </>
  )
}

export default App