const { createToken, verifyToken, extractBearerToken } = require("../src/utils/jwt");

const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // 토큰 만료 15분 전부터 재발급

function autoRefreshMiddleware(req, res, next) {
  try {
    // 기존 인증 미들웨어가 req.user 를 세팅했는지 확인
    if (!req.user) {
      return next();
    }

    const token = extractBearerToken(req.headers.authorization || "");
    if (!token) {
      return next();
    }

    // verifyToken 으로 검증 + 디코딩을 동시에 처리 (jwt.js 의 getJwtSecret() 일관성 유지)
    const decoded = verifyToken(token);

    if (!decoded || !decoded.exp) {
      return next();
    }

    const expiresInMs = decoded.exp * 1000 - Date.now();

    // 만료까지 15분 미만이면 새 토큰 발급
    if (expiresInMs < REFRESH_THRESHOLD_MS) {
      const newToken = createToken(req.user);
      res.setHeader("x-new-token", newToken);
      // 클라이언트가 CORS 헤더로 읽을 수 있도록 노출
      res.setHeader("Access-Control-Expose-Headers", "x-new-token");
    }

    return next();
  } catch (err) {
    // 재발급 실패는 조용히 무시 — 원래 요청은 그대로 진행
    console.warn("autoRefreshMiddleware 오류 (무시됨):", err.message);
    return next();
  }
}

module.exports = autoRefreshMiddleware;
