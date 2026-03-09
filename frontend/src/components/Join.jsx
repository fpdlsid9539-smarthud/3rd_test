import React, { useState } from 'react'
import api from '../config/axios';

const Join = () => {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const sendUserData = async (e) => {
    e.preventDefault();
    // console.log(id, pw, nick);

    // 서버로 id, pw, nick을 전송
    try {
      const res = await api.post('/api/members', {
        id: id,
        pw: pw,
        nick: nick,
      });
      console.log(res.data);
      alert("가입 성공");
    } catch (error) {
      console.log(error);
      alert(error);
    }
    setId("");
    setPw("");
    setNick("");
  }

  return (
    <div>
      <form onSubmit={sendUserData}>
        <div className='flx-col'>
          <span>아이디</span>
          <input type="text" value={id} placeholder='아이디 입력' onChange={e => setId(e.target.value)} />
        </div>
        <div className='flx-col'>
          <span>비밀번호</span>
          <input type="password" value={pw} placeholder='비밀번호 입력' onChange={e => setPw(e.target.value)} />
        </div>
        <div className='flx-col'>
          <span>별명</span>
          <input type="text" value={nick} placeholder='별명 입력' onChange={e => setNick(e.target.value)} />
        </div>
        <input type="submit" value="회원가입" className='normal'/>
      </form>
    </div>
  )
}

export default Join