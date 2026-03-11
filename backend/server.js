require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require("./routes/router.js");
const loginRouter = require("./routes/loginRouter.js");
const devRouter = require("./routes/dev/devRouter.js");
const quizRouter = require("./routes/quiz/quizRouter.js");
const stockRouter = require("./routes/stock/stockRouter.js");
const achievementsRouter = require("./routes/achievements/achievementsRouter.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", router);
app.use("/login", loginRouter);
app.use("/dev", devRouter);
app.use("/quiz", quizRouter);
app.use("/stocks", stockRouter);
app.use("/achievements", achievementsRouter);

app.get("/__whoami", (req, res) => {
  res.json({ ok: true, pid: process.pid, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`서버 실행중: http://localhost:${PORT}`);
});