import React, { useState } from 'react'
import api from '../config/axios';

const MemberUpdate = () => {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const handleUpdate = async (e) => {
    e.preventDefault();
    // console.log(id, pw, nick);

    // 서버로 id, pw, nick을 전송
    try {
      const res = await api.patch('/api/members', {
        id, pw, nick,
      });
      console.log(res.data);
      alert("업데이트 성공");
    } catch (error) {
      console.log(error);
      alert(error);
    }
    setId("");
    setPw("");
    setNick("");
  };
  return (
    <div>
      <form onSubmit={handleUpdate}>
        <div className='flx-col'>
          <span>아이디</span>
          <input type="text" value={id} placeholder='아이디 입력' onChange={e => setId(e.target.value)} required />
        </div>
        <div className='flx-col'>
          <span>비밀번호</span>
          <input type="password" value={pw} placeholder='비밀번호 입력' onChange={e => setPw(e.target.value)} required />
        </div>
        <div className='flx-col'>
          <span>변경할 별명</span>
          <input type="text" value={nick} placeholder='별명 입력' onChange={e => setNick(e.target.value)} />
        </div>
        <input type="submit" value="별명 업데이트" className='normal'/>
      </form>
    </div>
  )
}

export default MemberUpdate