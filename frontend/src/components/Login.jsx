import React, { useState } from 'react'
import api from '../config/axios';

const Login = () => {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/login', {
        id: id,
        pw: pw,
      });
      if (res.data?.success) {
        alert("로그인 성공");
      }
      console.log(res.data)
    } catch (error) {
      console.log(error);
      alert(error);
    }
    setId("");
    setPw("");
  }

  return (
    <div>
      <form onSubmit={handleLogin}>
        <div className='flx-col'>
          <span>아이디</span>
          <input type="text" value={id} placeholder='아이디 입력' onChange={e => setId(e.target.value)} />
        </div>
        <div className='flx-col'>
          <span>비밀번호</span>
          <input type="password" value={pw} placeholder='비밀번호 입력' onChange={e => setPw(e.target.value)} />
        </div>
        <input type="submit" value="로그인" className='normal'/>
      </form>
    </div>
  )
}

export default Login