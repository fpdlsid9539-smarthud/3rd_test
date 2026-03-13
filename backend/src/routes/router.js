const express = require("express");
const router = express.Router();
const db = require("../../config/db");

console.log("ROUTER LOADED ✅", new Date().toISOString());

router.get("/", (req, res) => {
  res.send(`
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>FinSight Backend</title>
      </head>
      <body style="font-family:sans-serif; padding:40px; line-height:1.8;">
        <h1>FinSight Backend 연결 성공 🚀</h1>
        <hr />
        <ul>
          <li><a href="/ping">📡 DB 연결 확인 (/ping)</a></li>
          <li><a href="/members">👥 Members 조회 (/members)</a></li>
          <li><a href="/api/auth">🔐 소셜 로그인 화면으로 이동 (/api/auth)</a></li>
          <li><a href="/api/achievements">🏆 업적 목록 조회 (/api/achievements)</a></li>
          <li><a href="/api/titles">🎖️ 칭호 목록 조회 (/api/titles)</a></li>
          <li><a href="/api/titles/default">🥇 기본 칭호 조회 (/api/titles/default)</a></li>
          <li><a href="/api/stocks">📈 전체 종목 목록 조회 (/api/stocks)</a></li>
          <li><a href="/api/stocks/005930">💹 삼성전자 현재가 조회 (/api/stocks/005930)</a></li>
          <li><a href="/api/stocks/005930/chart">🕯️ 삼성전자 차트 조회 (/api/stocks/005930/chart)</a></li>
          <li><a href="/api/quiz">🧠 퀴즈 API 확인 (/api/quiz)</a></li>
          <li><a href="/api/quiz/today">📘 오늘의 퀴즈 조회 (/api/quiz/today)</a></li>
          <li><a href="/docs">📄 Swagger 문서 (/docs)</a></li>
          <li><a href="/__whoami">🪪 서버 정보 확인 (/__whoami)</a></li>
        </ul>
      </body>
    </html>
  `);
});

router.get("/ping", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT 1 AS ok");
    return res.json({
      success: true,
      message: "DB 연결 성공",
      data: rows[0]
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "DB 연결 실패",
      error: err.message
    });
  }
});

router.get("/members", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM members");
    return res.json({
      success: true,
      message: "members 조회 성공",
      data: rows
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "members 조회 실패",
      error: err.message
    });
  }
});

module.exports = router;