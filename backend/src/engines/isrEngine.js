function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

function stddev(arr) {
  if (!arr.length) return 0;
  const mean = avg(arr);
  const variance =
    arr.reduce((sum, n) => sum + Math.pow(Number(n || 0) - mean, 2), 0) /
    arr.length;
  return Math.sqrt(variance);
}

/* =========================
   1) Accuracy
   - 게임 성공률 70%
   - 퀴즈 정답률 30%
========================= */
function calculateAccuracy(logs, quizRows) {
  const validLogs = (logs || []).filter(
    (l) => l.status === "SUCCESS" || l.status === "FAIL"
  );

  const gameAccuracy = validLogs.length
    ? (validLogs.filter((l) => l.status === "SUCCESS").length / validLogs.length) * 100
    : 0;

  const quizAccuracy = (quizRows || []).length
    ? ((quizRows.filter((q) => Number(q.is_correct) === 1).length / quizRows.length) * 100)
    : 0;

  if (!validLogs.length && !quizRows.length) return 0;

  return clamp(gameAccuracy * 0.7 + quizAccuracy * 0.3);
}

/* =========================
   2) Risk
   - 평균 손실/평균 베팅
   - penalty_amount 반영
========================= */
function calculateRisk(logs) {
  const data = Array.isArray(logs) ? logs : [];
  if (!data.length) return 0;

  const avgBet = avg(data.map((l) => Number(l.bet_amount || 0)));
  if (avgBet <= 0) return 0;

  const losses = data.filter((l) => Number(l.pnl_amount || 0) < 0);
  const avgLoss = losses.length
    ? avg(losses.map((l) => Math.abs(Number(l.pnl_amount || 0))))
    : 0;

  const avgPenalty = avg(data.map((l) => Number(l.penalty_amount || 0)));

  const lossScore = 100 - (avgLoss / avgBet) * 100;
  const penaltyScore = 100 - (avgPenalty / avgBet) * 100;

  return clamp(lossScore * 0.8 + penaltyScore * 0.2);
}

/* =========================
   3) Stability
   - 손익 변동성
   - 최근 7일 활동일수
========================= */
function calculateStability(logs) {
  const data = Array.isArray(logs) ? logs : [];
  if (!data.length) return 0;

  const pnls = data.map((l) => Number(l.pnl_amount || 0));
  const mean = avg(pnls);
  const deviation = stddev(pnls);

  let pnlScore = 50;
  if (Math.abs(mean) > 0) {
    pnlScore = 100 - (deviation / Math.abs(mean)) * 100;
  }

  const recent7 = new Set();
  const now = new Date();

  data.forEach((l) => {
    if (!l.created_at) return;
    const d = new Date(l.created_at);
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff <= 7) {
      recent7.add(d.toISOString().slice(0, 10));
    }
  });

  const activeDaysScore = (recent7.size / 7) * 100;

  return clamp(pnlScore * 0.7 + activeDaysScore * 0.3);
}

/* =========================
   4) Discipline
   - PENDING 적을수록 높음
   - 최근 7일 퀴즈 목표 달성률 반영
========================= */
function calculateDiscipline(logs, quizRows) {
  const logData = Array.isArray(logs) ? logs : [];
  const quizData = Array.isArray(quizRows) ? quizRows : [];

  let pendingScore = 100;
  if (logData.length) {
    const pendingCount = logData.filter((l) => l.status === "PENDING").length;
    pendingScore = 100 - (pendingCount / logData.length) * 100;
  }

  const dailyMap = {};
  const now = new Date();

  quizData.forEach((q) => {
    if (!q.solved_at) return;
    const d = new Date(q.solved_at);
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff <= 7) {
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = (dailyMap[key] || 0) + 1;
    }
  });

  const days = Object.keys(dailyMap);
  const dailyGoal = 3;
  const goalRates = days.map((day) =>
    Math.min(100, (dailyMap[day] / dailyGoal) * 100)
  );
  const questScore = days.length ? avg(goalRates) : 0;

  if (!logData.length && !quizData.length) return 0;

  return clamp(pendingScore * 0.6 + questScore * 0.4);
}

/* =========================
   5) Strategy
   - strategy_type_user 와 strategy_type_actual 일치율
   - 퀴즈 난이도 성과 반영
========================= */
function calculateStrategy(logs, quizRows) {
  const logData = Array.isArray(logs) ? logs : [];
  const quizData = Array.isArray(quizRows) ? quizRows : [];

  const validStrategyLogs = logData.filter(
    (l) => l.strategy_type_user && l.strategy_type_actual
  );

  const matchRate = validStrategyLogs.length
    ? (validStrategyLogs.filter(
        (l) =>
          String(l.strategy_type_user).toUpperCase() ===
          String(l.strategy_type_actual).toUpperCase()
      ).length /
        validStrategyLogs.length) *
      100
    : 0;

  const difficultyWeight = {
    "하": 1,
    "중": 1.5,
    "상": 2,
    easy: 1,
    normal: 1.5,
    medium: 1.5,
    hard: 2,
  };

  let totalWeight = 0;
  let correctWeight = 0;

  quizData.forEach((q) => {
    const w = difficultyWeight[q.difficulty] || 1;
    totalWeight += w;
    if (Number(q.is_correct) === 1) correctWeight += w;
  });

  const quizStrategyScore = totalWeight > 0 ? (correctWeight / totalWeight) * 100 : 0;

  if (!validStrategyLogs.length && !quizData.length) return 0;

  return clamp(matchRate * 0.6 + quizStrategyScore * 0.4);
}

/* =========================
   6) Adaptability
   - 시장 추세별 성공률 평균
   - 최근 성과 개선도
========================= */
function calculateAdaptability(logs, quizRows) {
  const logData = Array.isArray(logs) ? logs : [];
  const quizData = Array.isArray(quizRows) ? quizRows : [];

  const grouped = {};

  logData.forEach((l) => {
    const trend = l.market_trend || "UNKNOWN";
    if (!grouped[trend]) grouped[trend] = [];
    grouped[trend].push(l);
  });

  const trendScores = Object.values(grouped).map((group) => {
    const valid = group.filter((l) => l.status === "SUCCESS" || l.status === "FAIL");
    if (!valid.length) return 0;
    const successCount = valid.filter((l) => l.status === "SUCCESS").length;
    return (successCount / valid.length) * 100;
  });

  const marketAdaptScore = trendScores.length ? avg(trendScores) : 0;

  const sortedQuiz = [...quizData]
    .filter((q) => q.solved_at)
    .sort((a, b) => new Date(a.solved_at) - new Date(b.solved_at));

  let growthScore = 0;
  if (sortedQuiz.length >= 4) {
    const half = Math.floor(sortedQuiz.length / 2);
    const firstHalf = sortedQuiz.slice(0, half);
    const secondHalf = sortedQuiz.slice(half);

    const firstRate =
      (firstHalf.filter((q) => Number(q.is_correct) === 1).length / firstHalf.length) * 100;
    const secondRate =
      (secondHalf.filter((q) => Number(q.is_correct) === 1).length / secondHalf.length) * 100;

    growthScore = clamp(50 + (secondRate - firstRate));
  } else {
    growthScore = marketAdaptScore;
  }

  if (!logData.length && !quizData.length) return 0;

  return clamp(marketAdaptScore * 0.7 + growthScore * 0.3);
}

/* =========================
   최종 ISR
========================= */
function calculateISR({ logs = [], quizRows = [] }) {
  const accuracy = calculateAccuracy(logs, quizRows);
  const risk = calculateRisk(logs);
  const stability = calculateStability(logs);
  const discipline = calculateDiscipline(logs, quizRows);
  const strategy = calculateStrategy(logs, quizRows);
  const adaptability = calculateAdaptability(logs, quizRows);

  const isr =
    accuracy * 0.30 +
    risk * 0.20 +
    stability * 0.15 +
    discipline * 0.15 +
    strategy * 0.10 +
    adaptability * 0.10;

  return {
    accuracy: Number(clamp(accuracy).toFixed(2)),
    risk: Number(clamp(risk).toFixed(2)),
    stability: Number(clamp(stability).toFixed(2)),
    discipline: Number(clamp(discipline).toFixed(2)),
    strategy: Number(clamp(strategy).toFixed(2)),
    adaptability: Number(clamp(adaptability).toFixed(2)),
    isr: Number(clamp(isr).toFixed(2)),
  };
}

module.exports = {
  calculateISR,
};