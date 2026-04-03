require("dotenv").config({ path: __dirname + "/.env" });

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
const pointHistoryRoutes = require("./src/routes/pointHistoryRoutes");
const faqRoutes = require("./src/routes/faqRoutes");
const newsController = require("./src/controllers/newsController");

const app = express();

console.log("[ENV CHECK]", {
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  GROQ_API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL,
});

const BASE_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://3rd-test-khaki.vercel.app",
  "https://3rd-test-git-main-shkims-projects-92f4c7c6.vercel.app",
  "https://3rd-test-l9pc4h59k-shkims-projects-92f4c7c6.vercel.app",
  "https://3rd-test-cqvv5youa-shkims-projects-92f4c7c6.vercel.app",
];

const allowedOrigins = process.env.FRONTEND_URL
  ? [...BASE_ORIGINS, process.env.FRONTEND_URL]
  : BASE_ORIGINS;

app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowedExact = !origin || allowedOrigins.includes(origin);

      const isVercelPreview =
        typeof origin === "string" &&
        /^https:\/\/3rd-test-[a-z0-9-]+-shkims-projects-92f4c7c6\.vercel\.app$/.test(origin);

      if (isAllowedExact || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error(`CORS 차단: 허용되지 않은 origin — ${origin}`));
    },
    credentials: true,
    exposedHeaders: ["x-new-token"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/faq", faqRoutes);
app.use("/", router);
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/quiz", quizRoutes);
app.get("/api/news", newsController.getTodayStockNews);
app.use("/api/education", educationRoutes);
app.use("/api", achievementRoutes);
app.use("/api/isr", isrRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/points", pointHistoryRoutes);

app.get("/__whoami", (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    time: new Date().toISOString(),
    env: {
      GROQ_API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
      GROQ_MODEL: process.env.GROQ_MODEL || null,
    },
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ 서버 실행중 (PORT=${PORT})`);
  console.log("✅ CORS 허용 origins:", allowedOrigins);
});