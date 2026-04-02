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
   1) 판단력 (Accuracy)
   - SUCCESS / (SUCCESS + FAIL)
   - PENDING 제외
========================= */
function calculateAccuracy(logs) {
  const validLogs = (logs || []).filter(
    (l) => l.status === "SUCCESS" || l.status === "FAIL"
  );

  if (!validLogs.length) return 0;

  const successCount = validLogs.filter((l) => l.status === "SUCCESS").length;
  return clamp((successCount / validLogs.length) * 100);
}

/* =========================
   2) 위험관리 (Risk)
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
   3) 일관성 (Stability)
   - 손익 변동성만 반영
   - 최근 7일 활동일수 제거
========================= */
function calculateStability(logs) {
  const validLogs = (logs || []).filter(
    (l) => l.status === "SUCCESS" || l.status === "FAIL"
  );

  if (!validLogs.length) return 0;

  const pnls = validLogs.map((l) => Number(l.pnl_amount || 0));
  const mean = avg(pnls);
  const deviation = stddev(pnls);

  let pnlScore = 50;
  if (Math.abs(mean) > 0) {
    pnlScore = 100 - (deviation / Math.abs(mean)) * 100;
  }

  return clamp(pnlScore);
}

/* =========================
   4) 투자습관 (Discipline)
   - PENDING 적을수록 높음
   - 퀴즈 목표 달성률 제거
========================= */
function calculateDiscipline(logs) {
  const logData = Array.isArray(logs) ? logs : [];
  if (!logData.length) return 0;

  const pendingCount = logData.filter((l) => l.status === "PENDING").length;
  const pendingScore = 100 - (pendingCount / logData.length) * 100;

  return clamp(pendingScore);
}

/* =========================
   5) 시장대응력 (Adaptability)
   - 시장 추세별 성공률 평균
   - 최근 퀴즈 성장도 제거
========================= */
function calculateAdaptability(logs) {
  const logData = Array.isArray(logs) ? logs : [];
  if (!logData.length) return 0;

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

  return clamp(trendScores.length ? avg(trendScores) : 0);
}

/* =========================
   ISR 등급
========================= */
function getISRGrade(score) {
  const value = Number(score || 0);

  if (value >= 90) {
    return {
      code: "S",
      label: "Elite 투자자",
      description: "매우 안정적이며 균형 잡힌 투자 패턴을 가진 상위 투자자입니다.",
    };
  }

  if (value >= 80) {
    return {
      code: "A",
      label: "안정형 투자자",
      description: "리스크 관리와 판단력이 안정적인 투자 성향입니다.",
    };
  }

  if (value >= 70) {
    return {
      code: "B",
      label: "성장형 투자자",
      description: "기본적인 투자 능력은 갖추었으며 일부 개선 여지가 있습니다.",
    };
  }

  if (value >= 60) {
    return {
      code: "C",
      label: "개선형 투자자",
      description: "투자 습관과 판단력 개선이 필요한 단계입니다.",
    };
  }

  return {
    code: "D",
    label: "위험형 투자자",
    description: "고위험 투자 패턴이 많아 전반적인 개선이 필요합니다.",
  };
}

/* =========================
   ISR 한 줄 요약
========================= */
function getISRSummary(result = {}) {
  const accuracy = Number(result.accuracy || 0);
  const risk = Number(result.risk || 0);
  const stability = Number(result.stability || 0);
  const discipline = Number(result.discipline || 0);
  const adaptability = Number(result.adaptability || 0);

  if (risk >= 80 && stability >= 70) {
    return "안정적인 판단과 위험 관리를 기반으로 투자하는 유형입니다.";
  }

  if (accuracy >= 70 && risk < 60) {
    return "판단력은 괜찮지만 손실 관리 측면의 개선이 필요한 투자 유형입니다.";
  }

  if (discipline < 60) {
    return "미완료 거래 비율이 높아 투자 습관 개선이 필요한 상태입니다.";
  }

  if (adaptability < 60) {
    return "특정 시장 상황에는 강하지만 시장 변화 대응력은 더 키울 필요가 있습니다.";
  }

  return "전반적으로 기본 투자 역량을 갖추고 있으며 꾸준한 개선이 가능한 유형입니다.";
}

/* =========================
   최종 ISR
========================= */
function calculateISR({ logs = [] }) {
  const accuracy = calculateAccuracy(logs);
  const risk = calculateRisk(logs);
  const stability = calculateStability(logs);
  const discipline = calculateDiscipline(logs);
  const adaptability = calculateAdaptability(logs);

  const isr =
    accuracy * 0.30 +
    risk * 0.25 +
    stability * 0.20 +
    discipline * 0.15 +
    adaptability * 0.10;

  return {
    accuracy: Number(clamp(accuracy).toFixed(2)),
    risk: Number(clamp(risk).toFixed(2)),
    stability: Number(clamp(stability).toFixed(2)),
    discipline: Number(clamp(discipline).toFixed(2)),
    strategy: 0,
    adaptability: Number(clamp(adaptability).toFixed(2)),
    isr: Number(clamp(isr).toFixed(2)),
  };
}

module.exports = {
  calculateISR,
  getISRGrade,
  getISRSummary,
};