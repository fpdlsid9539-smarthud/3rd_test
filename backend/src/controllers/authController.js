const axios = require("axios");
const db = require("../../config/db");
const { createToken } = require("../utils/jwt");

/* 공통 응답 */
function success(res, message, data = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

/* 칭호/티어 계산 — achievements 테이블의 실제 name 값 사용 */
function getTitle(member) {
  const isr = Number(member.isr_score || 0);
  const points = Number(member.points || 0);

  if (isr >= 90) return "💎 전설의 투자자";
  if (isr >= 80) return "🛡️ 철벽의 방어자";
  if (points >= 100000) return "🦁 야수의 심장";
  return "🌱 Vivere 주린이";
}

function getTier(member) {
  const isr = Number(member.isr_score || 0);

  if (isr >= 90) return "다이아";
  if (isr >= 70) return "골드";
  if (isr >= 50) return "실버";
  return "브론즈";
}

/* DB 에서 회원의 실제 업적 목록을 조회 (최근 획득순 3개) */
async function getRecentAchievements(memberId) {
  const [rows] = await db.promise().query(
    `SELECT a.name
     FROM member_achievements ma
     JOIN achievements a ON ma.ach_id = a.ach_id
     WHERE ma.member_id = ?
     ORDER BY ma.obtained_at DESC
     LIMIT 3`,
    [memberId]
  );

  if (!rows.length) {
    return ["🌱 Vivere 주린이"];
  }

  return rows.map((r) => r.name);
}

function buildMemberPayload(member) {
  return {
    member_id: member.member_id,
    provider: member.provider,
    provider_id: member.provider_id,
    nickname: member.nickname,
    title: getTitle(member),
    tier: getTier(member),
    points: member.points ?? 0,
    isr_score: member.isr_score ?? 0,
    created_at: member.created_at ?? null,
    profile_image: member.profile_image,
  };
}

async function buildLoginResponseData(result, token) {
  return {
    isNewUser: result.isNewUser,
    member: buildMemberPayload(result.member),
    recentAchievements: await getRecentAchievements(result.member.member_id),
    token,
  };
}

function buildFrontendRedirectUrl(data) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const params = new URLSearchParams({
    token: data.token,
    nickname: data.member.nickname || "",
    provider: data.member.provider || "",
  });

  return `${frontendUrl}/?${params.toString()}`;
}

/* DB 함수 */
async function findMember(provider, providerId) {
  const [rows] = await db.promise().query(
    "SELECT * FROM members WHERE provider = ? AND provider_id = ?",
    [provider, providerId]
  );

  return rows[0] || null;
}

async function findMemberById(memberId) {
  const [rows] = await db.promise().query(
    "SELECT * FROM members WHERE member_id = ?",
    [memberId]
  );

  return rows[0] || null;
}

async function grantDefaultAchievementIfMissing(memberId) {
  const [rows] = await db.promise().query(
    "SELECT * FROM member_achievements WHERE member_id = ? AND ach_id = 1",
    [memberId]
  );

  if (!rows.length) {
    await db.promise().query(
      "INSERT INTO member_achievements (member_id, ach_id, is_equipped) VALUES (?, 1, TRUE)",
      [memberId]
    );
  }
}

/* =========================
   기본 찜/보유 주식 시드
========================= */
async function seedDefaultStocksForMember(memberId, conn = null) {
  const executor = conn || db.promise();

  await executor.query(
    `
    INSERT IGNORE INTO liked_stocks (member_id, stock_code)
    VALUES (?, '005930'), (?, '035420')
    `,
    [memberId, memberId]
  );

  await executor.query(
    `
    INSERT IGNORE INTO owned_stocks (member_id, stock_code, quantity, avg_price)
    VALUES (?, '000660', 3, 210000), (?, '005930', 10, 73000)
    `,
    [memberId, memberId]
  );
}

/* =========================
   테스트용 기본 gameLog 시드
   - 원치 않으면 이 함수 호출만 빼면 됨
========================= */
async function seedDefaultGameLogForMember(memberId, conn = null) {
  const executor = conn || db.promise();

  const [rows] = await executor.query(
    `SELECT COUNT(*) AS cnt FROM gameLog WHERE member_id = ?`,
    [memberId]
  );

  const count = Number(rows[0]?.cnt || 0);

  if (count > 0) {
    return;
  }

  await executor.query(
    `
    INSERT INTO gameLog
    (
      member_id, stock_code, prediction, bet_amount, pnl_amount, penalty_amount, status, created_at,
      strategy_type_user, strategy_type_actual, holding_time, market_trend
    )
    VALUES
    (?, '005930', 'UP',   100000, 12000, 0,    'SUCCESS', NOW(), 'SWING', 'SWING', 5,  'BULL'),
    (?, '000660', 'DOWN',  80000, -10000, 2000,'FAIL',    NOW(), 'SHORT', 'SHORT', 2,  'BEAR'),
    (?, '035420', 'UP',    50000, 7000,  0,    'SUCCESS', NOW(), 'LONG',  'LONG',  14, 'SIDEWAYS'),
    (?, '005930', 'UP',    60000, 0,     0,    'PENDING', NOW(), 'SWING', 'SWING', 3,  'BULL')
    `,
    [memberId, memberId, memberId, memberId]
  );
}


async function createMember(provider, providerId, nickname, profile_image) {
  const safeNickname =
    nickname && nickname.trim()
      ? nickname.trim()
      : `${provider}_${String(providerId).slice(0, 8)}`;

  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO members (provider, provider_id, nickname, profile_image) VALUES (?, ?, ?, ?)",
      [provider, providerId, safeNickname, profile_image]
    );

    const newMemberId = result.insertId;

    await conn.query(
      "INSERT INTO member_achievements (member_id, ach_id, is_equipped) VALUES (?, 1, TRUE)",
      [newMemberId]
    );

    await seedDefaultStocksForMember(newMemberId, conn);
    await seedDefaultGameLogForMember(newMemberId, conn);

    const [rows] = await conn.query(
      "SELECT * FROM members WHERE member_id = ?",
      [newMemberId]
    );

    await conn.commit();
    return rows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function loginOrRegister(provider, providerId, nickname, profile_image) {
  const member = await findMember(provider, providerId);

  if (member) {
    if (profile_image) {
      await db.promise().query(
        "UPDATE members SET profile_image = ? WHERE member_id = ?",
        [profile_image, member.member_id]
      );
      member.profile_image = profile_image; // 프론트로 보낼 객체도 최신 프사로 갱신
    }

    await grantDefaultAchievementIfMissing(member.member_id);
    await seedDefaultStocksForMember(member.member_id);
    await seedDefaultGameLogForMember(member.member_id);

    const refreshedMember = await findMemberById(member.member_id);

    return {
      isNewUser: false,
      member: refreshedMember,
    };
  }

  const newMember = await createMember(provider, providerId, nickname, profile_image);
  return {
    isNewUser: true,
    member: newMember,
  };
}

/* 기본 화면 */
exports.loginPage = (req, res) => {
  res.send(`
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>소셜 로그인</title>
      </head>
      <body style="font-family:sans-serif; padding:40px;">
        <h1>소셜 로그인</h1>
        <p><a href="/api/auth/kakao">카카오 로그인</a></p>
        <p><a href="/api/auth/google">구글 로그인</a></p>
      </body>
    </html>
  `);
};

exports.test = (req, res) => {
  return success(res, "auth router 연결 성공");
};

exports.getMe = async (req, res) => {
  try {
    const member = await findMemberById(req.user.member_id);

    if (!member) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    return success(res, "현재 로그인 사용자 조회 성공", {
      member: buildMemberPayload(member),
      recentAchievements: await getRecentAchievements(member),
    });
  } catch (err) {
    return fail(res, "회원 조회 실패", err.message, 500);
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { nickname } = req.body;

    const [updateResult] = await db.promise().query(
      "UPDATE members SET nickname = ? WHERE member_id = ?",
      [nickname, req.user.member_id]
    );

    if (updateResult.affectedRows === 0) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    const updatedMember = await findMemberById(req.user.member_id);
    const newToken = createToken(updatedMember);

    return success(res, "회원 정보 수정 성공", {
      member: buildMemberPayload(updatedMember),
      recentAchievements: await getRecentAchievements(updatedMember.member_id),
      token: newToken,
    });
  } catch (err) {
    return fail(res, "회원 정보 수정 실패", err.message, 500);
  }
};

exports.logout = async (req, res) => {
  try {
    return success(res, "로그아웃 성공", {
      message: "클라이언트에서 저장된 토큰을 삭제해주세요.",
    });
  } catch (err) {
    return fail(res, "로그아웃 실패", err.message, 500);
  }
};

exports.getProfileMeta = async (req, res) => {
  try {
    const member = await findMemberById(req.user.member_id);

    if (!member) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    return success(res, "프로필 메타 조회 성공", {
      title: getTitle(member),
      tier: getTier(member),
      recentAchievements: await getRecentAchievements(member.member_id),
    });
  } catch (err) {
    return fail(res, "프로필 메타 조회 실패", err.message, 500);
  }
};

/* 토큰 재발급 */
exports.refreshToken = async (req, res) => {
  try {
    const member = await findMemberById(req.user.member_id);

    if (!member) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    const newToken = createToken(member);

    return success(res, "토큰 재발급 성공", {
      token: newToken,
      member: buildMemberPayload(member),
    });
  } catch (err) {
    return fail(res, "토큰 재발급 실패", err.message, 500);
  }
};

/* Kakao */
exports.kakaoLogin = (req, res) => {
  if (!process.env.KAKAO_REST_API_KEY || !process.env.KAKAO_REDIRECT_URI) {
    return fail(res, "카카오 환경변수가 설정되지 않았습니다.", null, 500);
  }

  const url =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${process.env.KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(process.env.KAKAO_REDIRECT_URI)}` +
    `&response_type=code` +
    `&prompt=select_account`;

  return res.redirect(url);
};

async function getKakaoAccessToken(code) {
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("client_id", process.env.KAKAO_REST_API_KEY);
  params.append("redirect_uri", process.env.KAKAO_REDIRECT_URI);
  params.append("code", code);

  const response = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    }
  );

  return response.data.access_token;
}

async function getKakaoUserInfo(accessToken) {
  const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}`, },
  });

  const data = response.data;

  const profileNeedsAgreement =
    data?.kakao_account?.profile_needs_agreement;

  if (profileNeedsAgreement) {
    console.warn("카카오 프로필 동의 필요 - 콘솔에서 동의항목 설정 확인 필요");
  }

  const profile_image =
    data?.kakao_account?.profile?.profile_image_url ||
    data?.kakao_account?.profile?.thumbnail_image_url ||
    data?.properties?.profile_image ||
    null;

  return {
    provider: "kakao",
    providerId: String(data.id),
    nickname:
      data?.properties?.nickname ||
      data?.kakao_account?.profile?.nickname || "kakao_user",
    profile_image,
  };
}

exports.kakaoCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      return fail(res, "카카오 로그인 실패", error_description || error, 400);
    }

    if (!code) {
      return fail(res, "카카오 로그인 실패", "인가 코드가 없습니다.", 400);
    }

    const accessToken = await getKakaoAccessToken(code);
    const user = await getKakaoUserInfo(accessToken);

    const result = await loginOrRegister(
      user.provider,
      user.providerId,
      user.nickname,
      user.profile_image,
    );

    const token = createToken(result.member);
    const responseData = await buildLoginResponseData(result, token);

    return res.redirect(buildFrontendRedirectUrl(responseData));
  } catch (err) {
    console.error("카카오 로그인 상세 오류:", err.response?.data || err.message);
    return fail(
      res,
      "카카오 로그인 실패",
      err.response?.data || err.message,
      500
    );
  }
};

/* Google */
exports.googleLogin = (req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    return fail(res, "구글 환경변수가 설정되지 않았습니다.", null, 500);
  }

  const scope = encodeURIComponent("openid email profile");
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&prompt=consent%20select_account`;

  return res.redirect(url);
};

async function getGoogleAccessToken(code) {
  const params = new URLSearchParams();
  params.append("code", code);
  params.append("client_id", process.env.GOOGLE_CLIENT_ID);
  params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
  params.append("redirect_uri", process.env.GOOGLE_REDIRECT_URI);
  params.append("grant_type", "authorization_code");

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

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
    nickname: data.name || "google_user",
    profile_image: data.picture || "",
  };
}

exports.googleCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      return fail(res, "구글 로그인 실패", error_description || error, 400);
    }

    if (!code) {
      return fail(res, "구글 로그인 실패", "인가 코드가 없습니다.", 400);
    }

    const accessToken = await getGoogleAccessToken(code);
    const user = await getGoogleUserInfo(accessToken);

    const result = await loginOrRegister(
      user.provider,
      user.providerId,
      user.nickname,
      user.profile_image,
    );

    const token = createToken(result.member);
    const responseData = await buildLoginResponseData(result, token);

    return res.redirect(buildFrontendRedirectUrl(responseData));
  } catch (err) {
    console.error("구글 로그인 상세 오류:", err.response?.data || err.message);
    return fail(
      res,
      "구글 로그인 실패",
      err.response?.data || err.message,
      500
    );
  }
};