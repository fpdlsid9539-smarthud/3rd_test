const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET이 설정되지 않았습니다.");
  }
  return process.env.JWT_SECRET;
}

function createToken(member) {
  return jwt.sign(
    {
      member_id: member.member_id ?? null,
      provider: member.provider,
      provider_id: member.provider_id,
      nickname: member.nickname,
    },
    getJwtSecret(),
    { expiresIn: "1h" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function extractBearerToken(authHeader = "") {
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
}

module.exports = {
  createToken,
  verifyToken,
  extractBearerToken,
};