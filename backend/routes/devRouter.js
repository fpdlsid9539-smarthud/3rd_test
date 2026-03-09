const express = require("express");
const router = express.Router();
const devAuth = require("../middleware/devAuth");

/**
 * 현재 개발용 유저 확인
 * GET /dev/me
 */
router.get("/me", devAuth, async (req, res) => {
  res.json({
    success: true,
    message: "현재 개발용 유저 조회 성공",
    user: req.user,
  });
});

/**
 * 대시보드용 최소 정보 예시
 * GET /dev/dashboard
 */
router.get("/dashboard", devAuth, async (req, res) => {
  res.json({
    success: true,
    data: {
      member_id: req.user.member_id,
      nickname: req.user.nickname,
      points: req.user.points,
      isr_score: req.user.isr_score,
      provider: req.user.provider,
    },
  });
});

module.exports = router;