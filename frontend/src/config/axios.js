import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:3000",
    // 현재 사용하는 서버 주소 입력 -> 배포시 변경
});

export default api;