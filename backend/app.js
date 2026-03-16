const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');

const apiRouter = require("./routes/apiRouter");
const pageRouter = require('../backend/routes/pageRouter');

// CORS오류 처리를 위한 미들웨어 적용
app.use(cors());

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// 요청을 보내준 body 정보를 parsing하는 미들웨어
// - <form> 데이터(x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// - json 데이터(application/json)
app.use(express.json());

app.use('/', pageRouter);
app.use('/api', apiRouter);

app.listen(3000, () => {
  console.log("SERVER 3000, OPERATIONAL")
});

/* 
  CORS Policy
  : Cross-Origin-Resources-Sharing 정책
  : 교차-출처-리소스-공유 정책
  - Origin (출처)
  예) http://localhost:3000/data?search=cat
    * Protocal : http://
    * HostName : localhost
    * PortNum : 3000
    * Origin : Protocal + HostName + PortNum
  - 내가 요청하고자 하는 자원의 Origin이 나의 현재 위치와 동일하지 않다면, 브라우저가 거절하는 정책
  - CORS 정책 해결은 서버가 하는 일!

  express 서버에서 CORS 오류 해결 방법
    : 외부 라이브러리 설치 : npm i cors
    : cors 라이브로리를 전역 미들웨어로 등록

  CORS 오류 처리가 필요한 이유?
    : front와 back의 주소가 서로 다른 경우(특히 개발중), 둘 사이의 통신을 허용하게 해주기 위해 필요.
    : 같은 서버에서 웹 프론트와 api가 동시에 제공되는 경우 불필요.
    : 모든 출처를 허용하는 것은 개발 당시 편의를 위함이고, 반드시 배포전에 보안상 해제해야함.
  
  CORS 미들웨어 위치
    : 다른 라우터 또는 미들웨어 보다 최상단에 위치해야한다.
*/

/* 
  기존에 만들었던 express 서버에서 api 서버로 전환 방법

  1. router.js에서 서버가 client의 요청 응답 변경
    - 기존 : res.send / res.redirect 등
    - 변경 : res.json / res.status().json
  2. CORS 오류를 막기위한 CORS 미들웨어 설정
    - 개발시 React와 Express의 주고사 다름
    - 그럴 React와 Express로 요청할 경우 CORS 오류 발생.
    - CORS 오류를 막기 위해서 cors 미들웨어를 설치하고, 정굑(최상단)
    ※개발 완료후 배포시 해당 cors미들웨어 삭제 필요!
  3. axios(fetch)를 통한 통신을 위한 body parsing 미들웨어 추가
    - 기존 : urlencoded 미들웨어
    - 변경 : urlencoded 미들웨어 / json 미들웨어

  4. frontend 프로젝트를 build
    - npm run build
    - dist 폴더내에 index.html 파일 생성
    - 이 index.html 파일을 express를 통해서 제공해주면 된다.
  5. express.static 미들웨어에, frontend/dist 폴더 추가
    - 기존 : public
    - 변경 : public + frontend/dist
  6. React의 라우팅을 사용
    - index.html 파일의 서빙 주소를 '/'가 아니라 '/*splat'으로 해준다
    ※ express 4버전 이하에서는 '*' 주소를 사용해야 한다.
*/