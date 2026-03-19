require("dotenv").config();

const express = require("express");
const cors = require("cors");

const router = require("./src/routes/router");
const authRoutes = require("./src/routes/authRoutes");
const stockRoutes = require("./src/routes/stockRoutes");
const quizRoutes = require("./src/routes/quizRoutes");
const achievementRoutes = require("./src/routes/achievementRoutes");
const educationRoutes = require("./src/routes/educationRoutes");
const isrRoutes = require("./src/routes/isrRoutes");
const rankingRoutes = require("./src/routes/rankingRoutes");
const billingRoutes = require("./src/routes/billingRoutes");
const app = express();

// CORS: 로컬 기본값 + .env 의 FRONTEND_URL 을 허용 origin 에 추가
const BASE_ORIGINS = ["http://localhost:5173", "http://localhost:5000"];
const allowedOrigins = process.env.FRONTEND_URL
  ? [...BASE_ORIGINS, process.env.FRONTEND_URL]
  : BASE_ORIGINS;

app.use(
  cors({
    origin: (origin, callback) => {
      // origin 이 없는 경우(서버 간 요청, curl 등)는 허용
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS 차단: 허용되지 않은 origin — ${origin}`));
    },
    credentials: true,
    exposedHeaders: ["x-new-token"], // 토큰 자동 재발급 헤더 노출
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/education", educationRoutes);
app.use("/api", achievementRoutes);
app.use("/api/isr", isrRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/billing", billingRoutes);
app.get("/__whoami", (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    time: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ 서버 실행중: http://localhost:${PORT}`);
  console.log(`✅ CORS 허용 origins:`, allowedOrigins);
});