// console.log("LOGIN ROUTER LOADED");

const express = require("express");
const axios = require("axios");
const loginRouter = express.Router();
const db = require("../config/db");

loginRouter.get("/test", (req, res) => {
  res.json({ ok: true, message: "login router connected" });
});


/**
 * provider_id로 기존 회원 조회
 */
async function findMemberByProviderId(providerId) {
  const [rows] = await db.promise().query(
    "SELECT * FROM members WHERE provider_id = ?",
    [providerId]
  );
  return rows[0] || null;
}

/**
 * 신규 회원 생성
 */
async function createMember(provider, providerId, nickname) {
  const [result] = await db.promise().query(
    "INSERT INTO members (provider, provider_id, nickname) VALUES (?, ?, ?)",
    [provider, providerId, nickname]
  );

  const [rows] = await db.promise().query(
    "SELECT * FROM members WHERE member_id = ?",
    [result.insertId]
  );

  return rows[0];
}

/**
 * 닉네임 안전 처리
 * 소셜에서 닉네임이 없을 수 있으니 fallback 준비
 */
function makeSafeNickname(provider, providerId, nickname) {
  if (nickname && nickname.trim() !== "") {
    return nickname.trim();
  }
  return `${provider}_${String(providerId).slice(0, 8)}`;
}

/**
 * 공통 로그인/회원가입 처리
 */
async function loginOrRegister(provider, providerId, nickname) {
  let member = await findMemberByProviderId(providerId);

  if (member) {
    return {
      isNewUser: false,
      member,
    };
  }

  const safeNickname = makeSafeNickname(provider, providerId, nickname);
  member = await createMember(provider, providerId, safeNickname);

  return {
    isNewUser: true,
    member,
  };
}

/**
 * 카카오 사용자 정보 가져오기
 */
async function getKakaoUserInfo(accessToken) {
  const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  const data = response.data;

  return {
    provider: "kakao",
    providerId: String(data.id),
    nickname:
      data?.properties?.nickname ||
      data?.kakao_account?.profile?.nickname ||
      null,
  };
}

/**
 * 구글 사용자 정보 가져오기
 */
async function getGoogleUserInfo(accessToken) {
  const response = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = response.data;

  return {
    provider: "google",
    providerId: String(data.id),
    nickname: data.name || null,
  };
}

/**
 * 카카오 로그인
 * POST /auth/kakao
 * body: { accessToken: "..." }
 */
loginRouter.post("/auth/kakao", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        message: "카카오 accessToken이 필요합니다.",
      });
    }

    const userInfo = await getKakaoUserInfo(accessToken);

    const result = await loginOrRegister(
      userInfo.provider,
      userInfo.providerId,
      userInfo.nickname
    );

    return res.status(200).json({
      message: result.isNewUser
        ? "카카오 회원가입 및 로그인 성공"
        : "카카오 로그인 성공",
      isNewUser: result.isNewUser,
      member: result.member,
    });
  } catch (err) {
    console.error("카카오 로그인 오류:", err.response?.data || err.message);

    return res.status(500).json({
      message: "카카오 로그인 처리 중 오류가 발생했습니다.",
      error: err.response?.data || err.message,
    });
  }
});

/**
 * 구글 로그인
 * POST /auth/google
 * body: { accessToken: "..." }
 */
loginRouter.post("/auth/google", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        message: "구글 accessToken이 필요합니다.",
      });
    }

    const userInfo = await getGoogleUserInfo(accessToken);

    const result = await loginOrRegister(
      userInfo.provider,
      userInfo.providerId,
      userInfo.nickname
    );

    return res.status(200).json({
      message: result.isNewUser
        ? "구글 회원가입 및 로그인 성공"
        : "구글 로그인 성공",
      isNewUser: result.isNewUser,
      member: result.member,
    });
  } catch (err) {
    console.error("구글 로그인 오류:", err.response?.data || err.message);

    return res.status(500).json({
      message: "구글 로그인 처리 중 오류가 발생했습니다.",
      error: err.response?.data || err.message,
    });
  }
});

module.exports = loginRouter;