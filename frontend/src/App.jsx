import React, { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Main from './components/Main'

function App() {
  const [page, setPage] = useState('landing')

  return (
    <>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'login' && <Login setPage={setPage} />}
      {page === 'main' && <Main />}
    </>
  )
}

export default App