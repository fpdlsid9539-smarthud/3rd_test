const express = require("express");
const router = express.Router();

const ACHIEVEMENTS = [
  { ach_id: 1, category: "학습", title: "🐣 Vivere 주린이", description: "가입 시 지급되는 기본 칭호", reward_point: 0 },
  { ach_id: 2, category: "학습", title: "📚 차트 리더", description: "퀴즈 누적 10회 정답 달성", reward_point: 500 },
  { ach_id: 3, category: "학습", title: "🎓 금융 학자", description: "퀴즈 누적 50회 정답 달성", reward_point: 2000 },
  { ach_id: 4, category: "실력", title: "💰 짜릿한 첫 승", description: "주가 예측(UP/DOWN) 첫 성공", reward_point: 1000 },
  { ach_id: 5, category: "실력", title: "🔥 연승 가도", description: "주가 예측 3연속 성공", reward_point: 2000 },
  { ach_id: 6, category: "실력", title: "🔮 예언자", description: "주가 예측 7연속 성공", reward_point: 5000 },
  { ach_id: 7, category: "실력", title: "🎯 족집게 도사", description: "누적 예측 성공 50회 달성", reward_point: 10000 },
  { ach_id: 8, category: "리스크", title: "🛡️ 강철 멘탈", description: "실패 후 다음 예측에서 손실 복구 성공", reward_point: 1500 },
  { ach_id: 9, category: "리스크", title: "⚖️ 리스크 매니저", description: "ISR 점수 50점 달성", reward_point: 2000 },
  { ach_id: 10, category: "리스크", title: "🏰 포트폴리오 수호자", description: "ISR 점수 80점 달성", reward_point: 5000 },
  { ach_id: 11, category: "성장", title: "🌱 레벨 업", description: "유저 레벨 5 도달", reward_point: 1000 },
  { ach_id: 12, category: "성장", title: "🏅 시장 베테랑", description: "유저 레벨 20 도달", reward_point: 5000 },
  { ach_id: 13, category: "성장", title: "🦁 야수의 심장", description: "보유 포인트의 50% 이상을 한 번에 베팅", reward_point: 1000 },
  { ach_id: 14, category: "꾸준함", title: "🏃 작심삼일 극복", description: "3일 연속 예측 참여", reward_point: 500 },
  { ach_id: 15, category: "꾸준함", title: "🗓️ 시장의 습관", description: "30일 연속 예측 참여", reward_point: 10000 },
  { ach_id: 16, category: "다양성", title: "🍱 분산 투자자", description: "서로 다른 5개 종목 예측 참여", reward_point: 1000 },
  { ach_id: 17, category: "다양성", title: "🗺️ KOSPI 탐험가", description: "서로 다른 15개 종목 예측 참여", reward_point: 5000 },
  { ach_id: 18, category: "반전", title: "🔄 역발상 투자자", description: "하락장 속에서 홀로 상승 예측 성공", reward_point: 3000 },
  { ach_id: 19, category: "최고", title: "👑 리스크 지니어스", description: "ISR 점수 95점 달성", reward_point: 20000 },
  { ach_id: 20, category: "최고", title: "🌟 Vivere 레전드", description: "시즌 랭킹 1위 달성", reward_point: 50000 }
];

const TITLES = [
  { title: "🌱 Vivere 주린이", description: "기본 지급 칭호 (가입 직후)" },
  { title: "📖 차트 수강생", description: "퀴즈 참여율이 높은 유저 (퀴즈 정답률 80% 이상)" },
  { title: "🦁 야수의 심장", description: "리스크가 크더라도 베팅 금액을 크게(보유 포인트의 50% 이상) 거는 상남자 스타일" },
  { title: "🐢 성실한 거북이", description: "매일 조금씩 꾸준하게 베팅하고 출석하는 유저" },
  { title: "🛡️ 철벽의 방어자", description: "ISR 점수가 매우 높고, 잃지 않는 안전한 투자를 하는 유저" },
  { title: "🎯 족집게 도사", description: "최근 예측 승률이 70% 이상인 유저" },
  { title: "🌊 추세 탑승객", description: "3일 이상 연속 상승(또는 하락) 중인 종목에 순응하여 베팅해 수익을 낸 유저" },
  { title: "🔄 역발상 투자자", description: "남들이 다 하락을 예상할 때(또는 하락장일 때) UP에 베팅하여 성공한 유저" },
  { title: "🏦 KOSPI 수집가", description: "30개 종목을 골고루 다 건드려보는 유저" },
  { title: "💎 전설의 투자자", description: "최상위 랭커 또는 ISR 점수 90점 이상 달성자" }
];


router.get("/achievements", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "업적 목록 조회 성공",
    data: ACHIEVEMENTS
  });
});

router.get("/titles", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "칭호 목록 조회 성공",
    data: TITLES
  });
});


router.get("/titles/default", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "기본 칭호 조회 성공",
    data: ACHIEVEMENTS.find((item) => item.ach_id === 1) || null
  });
});

module.exports = router;