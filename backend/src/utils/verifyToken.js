const autoRefreshMiddleware = require("../middlewares/autoRefreshMiddleware");

router.get("/me", verifyToken, autoRefreshMiddleware, authController.getMe);
router.patch("/me", verifyToken, autoRefreshMiddleware, authController.updateMe);