function getTierKeyByRankingPoint(rankingPoint) {
  const point = Number(rankingPoint || 0);

  if (point >= 90) return "diamond";
  if (point >= 75) return "gold";
  if (point >= 50) return "silver";
  return "bronze";
}

function getTierLabelByRankingPoint(rankingPoint) {
  const point = Number(rankingPoint || 0);

  if (point >= 90) return "다이아";
  if (point >= 75) return "골드";
  if (point >= 50) return "실버";
  return "브론즈";
}

module.exports = {
  getTierKeyByRankingPoint,
  getTierLabelByRankingPoint,
};