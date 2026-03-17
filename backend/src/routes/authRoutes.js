const express = require("express");
const router = express.Router();

// ✅ authController 은 module.exports = { ... } 형태이므로 객체 전체를 가져옴
const authController = require("../controllers/authController");
const authMiddleware = require("../../middlewares/authMiddleware");
const autoRefreshMiddleware = require("../../middlewares/autoRefreshMiddleware");
const validateNickname = require("../../middlewares/validateNickname");

router.get("/", authController.loginPage);
router.get("/test", authController.test);

/* 소셜 로그인 */
router.get("/kakao", authController.kakaoLogin);
router.get("/kakao/callback", authController.kakaoCallback);

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

/* 로그인 사용자 — authMiddleware 로 통일, autoRefreshMiddleware 추가 */
router.get("/me",      authMiddleware, autoRefreshMiddleware, authController.getMe);
router.patch("/me",    authMiddleware, autoRefreshMiddleware, validateNickname, authController.updateMe);
router.get("/meta",    authMiddleware, autoRefreshMiddleware, authController.getProfileMeta);
router.post("/logout", authMiddleware, authController.logout);

// /refresh: 토큰이 아직 유효할 때 명시적으로 재발급 요청하는 엔드포인트
router.post("/refresh", authMiddleware, authController.refreshToken);

module.exports = router;