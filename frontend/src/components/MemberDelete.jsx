import React, { useState } from 'react'
import api from '../config/axios';

const MemberDelete = () => {
	const [id, setId] = useState("");
	const [pw, setPw] = useState("");
	const handleDelete = async (e) => {
		e.preventDefault();
		// console.log(id, pw, nick);
		const result = window.confirm("정말 탈퇴 하시겠습니까?");
		if (!result) return; // cancel deletion
		try {
			const res = await api.delete('/api/members', {
				data: { id, pw }
			});
			console.log(res.data);
			alert("회원탈퇴 되었습니다.");
		} catch (error) {
			console.log(error);
			alert(error);
		}
		setId("");
		setPw("");
	};

	return (
		<div>
			<form onSubmit={handleDelete}>
				<div className='flx-col'>
					<span>아이디</span>
					<input type="text" value={id} placeholder='아이디 입력' onChange={e => setId(e.target.value)} required />
				</div>
				<div className='flx-col'>
					<span>비밀번호</span>
					<input type="password" value={pw} placeholder='비밀번호 입력' onChange={e => setPw(e.target.value)} required />
				</div>
				<input type="submit" value="회원 탈퇴" className='danger'/>
			</form>
		</div>
	)
}

export default MemberDelete