const axios = require("axios");
const jwt = require("jsonwebtoken");
const db = require("../../config/db");

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

/* JWT 생성 */
function createToken(member) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET이 설정되지 않았습니다.");
  }

  return jwt.sign(
    {
      member_id: member.member_id ?? null,
      provider: member.provider,
      provider_id: member.provider_id,
      nickname: member.nickname,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

/* 업적 데이터 */
const ACHIEVEMENTS = [
  "Winning Streak",
  "Drawdown Survivor",
  "Risk Manager",
  "Chart Reader",
  "Trend Rider",
];

/* 칭호/티어 계산 */
function getTitle(member) {
  const isr = Number(member.isr_score || 0);
  const points = Number(member.points || 0);

  if (isr >= 80) return "철벽의 방어자";
  if (isr >= 60) return "리스크 전략가";
  if (points >= 100000) return "야수의 심장";
  return "시장 입문자";
}

function getTier(member) {
  const isr = Number(member.isr_score || 0);

  if (isr >= 90) return "다이아 I";
  if (isr >= 80) return "플래티넘 II";
  if (isr >= 65) return "골드 III";
  if (isr >= 50) return "실버 IV";
  return "브론즈 I";
}

function getRecentAchievements(member) {
  const result = [];
  const isr = Number(member.isr_score || 0);
  const points = Number(member.points || 0);

  if (points >= 10000) result.push("Winning Streak");
  if (isr >= 50) result.push("Risk Manager");
  if (points >= 5000) result.push("Chart Reader");

  if (result.length === 0) {
    result.push("Getting Started");
  }

  return result.slice(0, 3);
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
  };
}

function buildLoginResponseData(result, token) {
  return {
    isNewUser: result.isNewUser,
    member: buildMemberPayload(result.member),
    recentAchievements: getRecentAchievements(result.member),
    token,
  };
}

function renderLoginSuccessPage(providerLabel, data) {
  const achievementHtml = data.recentAchievements.length
    ? data.recentAchievements.map((item) => `<li>${item}</li>`).join("")
    : "<li>업적 없음</li>";

  return `
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>${providerLabel} 로그인 성공</title>
      </head>
      <body style="font-family:sans-serif; padding:40px; line-height:1.8;">
        <h1>${providerLabel} 로그인 성공</h1>

        <h2>
          ${data.member.nickname}
          <span style="font-size:18px; border:1px solid #d4a017; border-radius:12px; padding:4px 10px; margin-left:8px;">
            ${data.member.title}
          </span>
          <span style="font-size:18px; border:1px solid #999; border-radius:12px; padding:4px 10px; margin-left:8px;">
            ${data.member.tier}
          </span>
        </h2>

        <ul>
          <li><strong>member_id:</strong> ${data.member.member_id}</li>
          <li><strong>provider:</strong> ${data.member.provider}</li>
          <li><strong>provider_id:</strong> ${data.member.provider_id}</li>
          <li><strong>points:</strong> ${data.member.points}</li>
          <li><strong>isr_score:</strong> ${data.member.isr_score}</li>
          <li><strong>신규회원 여부:</strong> ${data.isNewUser ? "예" : "아니오"}</li>
        </ul>

        <h3>최근 업적</h3>
        <ul>${achievementHtml}</ul>

        <h3>토큰</h3>
        <textarea style="width:100%; height:120px;">${data.token}</textarea>

        <p style="margin-top:20px;">
          <a href="/api/auth">소셜 로그인 화면으로 돌아가기</a>
        </p>
      </body>
    </html>
  `;
}

/* DB 함수 */
async function findMember(provider, providerId) {
  const [rows] = await db.promise().query(
    "SELECT * FROM members WHERE provider = ? AND provider_id = ?",
    [provider, providerId]
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

async function createMember(provider, providerId, nickname) {
  const safeNickname =
    nickname && nickname.trim()
      ? nickname.trim()
      : `${provider}_${String(providerId).slice(0, 8)}`;

  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO members (provider, provider_id, nickname) VALUES (?, ?, ?)",
      [provider, providerId, safeNickname]
    );

    const newMemberId = result.insertId;

    await conn.query(
      "INSERT INTO member_achievements (member_id, ach_id, is_equipped) VALUES (?, 1, TRUE)",
      [newMemberId]
    );

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

async function loginOrRegister(provider, providerId, nickname) {
  const member = await findMember(provider, providerId);

  if (member) {
    await grantDefaultAchievementIfMissing(member.member_id);
    return {
      isNewUser: false,
      member,
    };
  }

  const newMember = await createMember(provider, providerId, nickname);
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
    const [rows] = await db.promise().query(
      "SELECT * FROM members WHERE member_id = ?",
      [req.user.member_id]
    );

    if (!rows[0]) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    const member = rows[0];

    return success(res, "현재 로그인 사용자 조회 성공", {
      member: buildMemberPayload(member),
      recentAchievements: getRecentAchievements(member),
    });
  } catch (err) {
    return fail(res, "회원 조회 실패", err.message, 500);
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { nickname } = req.body;

    if (!nickname || !nickname.trim()) {
      return fail(res, "닉네임은 필수입니다.", null, 400);
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length > 100) {
      return fail(res, "닉네임은 100자 이하로 입력해주세요.", null, 400);
    }

    const [updateResult] = await db.promise().query(
      "UPDATE members SET nickname = ? WHERE member_id = ?",
      [trimmedNickname, req.user.member_id]
    );

    if (updateResult.affectedRows === 0) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    const [rows] = await db.promise().query(
      "SELECT * FROM members WHERE member_id = ?",
      [req.user.member_id]
    );

    const updatedMember = rows[0];
    const newToken = createToken(updatedMember);

    return success(res, "회원 정보 수정 성공", {
      member: buildMemberPayload(updatedMember),
      recentAchievements: getRecentAchievements(updatedMember),
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
    const [rows] = await db.promise().query(
      "SELECT * FROM members WHERE member_id = ?",
      [req.user.member_id]
    );

    if (!rows[0]) {
      return fail(res, "회원 정보를 찾을 수 없습니다.", null, 404);
    }

    const member = rows[0];

    return success(res, "프로필 메타 조회 성공", {
      title: getTitle(member),
      tier: getTier(member),
      recentAchievements: getRecentAchievements(member),
      availableAchievements: ACHIEVEMENTS,
    });
  } catch (err) {
    return fail(res, "프로필 메타 조회 실패", err.message, 500);
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
    `&response_type=code`;

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
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = response.data;

  return {
    provider: "kakao",
    providerId: String(data.id),
    nickname:
      data?.properties?.nickname ||
      data?.kakao_account?.profile?.nickname ||
      "kakao_user",
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
      user.nickname
    );

    const token = createToken(result.member);
    const responseData = buildLoginResponseData(result, token);

    return res.send(renderLoginSuccessPage("카카오", responseData));
  } catch (err) {
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

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile` +
    `&prompt=select_account`;

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
      user.nickname
    );

    const token = createToken(result.member);
    const responseData = buildLoginResponseData(result, token);

    return res.send(renderLoginSuccessPage("구글", responseData));
  } catch (err) {
    return fail(
      res,
      "구글 로그인 실패",
      err.response?.data || err.message,
      500
    );
  }
};