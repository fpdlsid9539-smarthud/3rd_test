const express = require("express");
const router = express.Router();
const multer = require("multer");

const authController = require("../controllers/authController");
const authMiddleware = require("../../middlewares/authMiddleware");
const autoRefreshMiddleware = require("../../middlewares/autoRefreshMiddleware");
const validateNickname = require("../../middlewares/validateNickname");

/* ─── Multer: memory storage → base64 saved in DB ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const validExt = allowed.test(file.originalname.toLowerCase().split('.').pop());
    const validMime = allowed.test(file.mimetype);
    if (validExt && validMime) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다."));
    }
  },
});

/* ─── Routes ─────────────────────────────────── */
router.get("/", authController.loginPage);
router.get("/test", authController.test);

/* 소셜 로그인 */
router.get("/kakao", authController.kakaoLogin);
router.get("/kakao/callback", authController.kakaoCallback);
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

/* 로그인 사용자 */
router.get("/me",          authMiddleware, autoRefreshMiddleware, authController.getMe);
router.patch("/me",        authMiddleware, autoRefreshMiddleware, validateNickname, authController.updateMe);
router.patch("/me/image",  authMiddleware, upload.single("profile_image"), authController.updateProfileImage);
router.get("/meta",        authMiddleware, autoRefreshMiddleware, authController.getProfileMeta);
router.post("/logout",     authMiddleware, authController.logout);
router.post("/refresh",    authMiddleware, authController.refreshToken);

module.exports = router;