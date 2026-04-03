const { verifyToken } = require("../src/utils/jwt");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 없습니다.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET이 설정되지 않았습니다.",
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
      error: err.message,
    });
  }
};