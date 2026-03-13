const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../../middlewares/authMiddleware");


router.get("/", authController.loginPage);


router.get("/test", authController.test);

/* 소셜 로그인 */
router.get("/kakao", authController.kakaoLogin);
router.get("/kakao/callback", authController.kakaoCallback);

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

/* 로그인 사용자 */
router.get("/me", authMiddleware, authController.getMe);
router.patch("/me", authMiddleware, authController.updateMe);
router.get("/meta", authMiddleware, authController.getProfileMeta);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;