require("dotenv").config();

const express = require("express");
const cors = require("cors");

const router = require("./src/routes/router");
const authRoutes = require("./src/routes/authRoutes");
const stockRoutes = require("./src/routes/stockRoutes");
const quizRoutes = require("./src/routes/quizRoutes");
const achievementRoutes = require("./src/routes/achievementRoutes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* 기본 라우터 */
app.use("/", router);

/* 인증 */
app.use("/api/auth", authRoutes);

/* 주식 */
app.use("/api/stocks", stockRoutes);

/* 퀴즈 */
app.use("/api/quiz", quizRoutes);

/* 업적/칭호 */
app.use("/api", achievementRoutes);


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
});