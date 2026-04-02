// rankingPoint is now a 0–100 PERCENTILE (% of players below you)
// This guarantees all tiers are always populated as long as scores vary

function getTierKeyByRankingPoint(rankingPoint) {
  const point = Number(rankingPoint || 0);

  if (point >= 90) return "diamond"; // top 10%
  if (point >= 70) return "gold";    // top 30%
  if (point >= 40) return "silver";  // top 60%
  return "bronze";                   // bottom 40%
}

function getTierLabelByRankingPoint(rankingPoint) {
  const point = Number(rankingPoint || 0);

  if (point >= 90) return "다이아";
  if (point >= 70) return "골드";
  if (point >= 40) return "실버";
  return "브론즈";
}

module.exports = {
  getTierKeyByRankingPoint,
  getTierLabelByRankingPoint,
};