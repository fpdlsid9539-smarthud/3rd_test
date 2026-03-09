import './App.css'
import Join from './components/Join'
import Login from './components/Login'
import MemberDelete from './components/MemberDelete'
import MemberUpdate from './components/MemberUpdate'

function App() {

  return (
    <div className='container'>
      <h1>React - Node 연동하기</h1>
      <Join/>
      <hr />
      <Login/>
      <hr />
      <MemberUpdate/>
      <hr />
      <MemberDelete/>
      <hr />
    </div>
  )
}

export default App