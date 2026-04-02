const db = require("../../config/db");
const { calculateISR, getISRGrade, getISRSummary } = require("../engines/isrEngine");
const achievementService = require("../services/achievementService");

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

function extractMemberId(req) {
  if (!req.user || typeof req.user !== "object") return null;

  return (
    req.user.member_id ||
    req.user.id ||
    req.user.memberId ||
    req.user.userId ||
    null
  );
}

async function saveISR(memberId, result) {
  await db.promise().query(
    `
    INSERT INTO isr_chart
    (
      member_id,
      isr_accuracy,
      isr_risk,
      isr_strategy,
      isr_stability,
      isr_discipline,
      isr_adaptability,
      isr_score
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      memberId,
      result.accuracy,
      result.risk,
      0, // strategy 제거
      result.stability,
      result.discipline,
      result.adaptability,
      result.isr,
    ]
  );

  await db.promise().query(
    `UPDATE members SET isr_score = ? WHERE member_id = ?`,
    [result.isr, memberId]
  );
}

async function getLogsByMemberId(memberId) {
  const [rows] = await db.promise().query(
    `SELECT * FROM gameLog WHERE member_id = ? ORDER BY created_at ASC, log_id ASC`,
    [memberId]
  );
  return rows;
}

function buildEmptyResult() {
  const emptyBase = {
    accuracy: 0,
    risk: 0,
    stability: 0,
    discipline: 0,
    adaptability: 0,
    strategy: 0,
    isr: 0,
  };

  return {
    ...emptyBase,
    judgment: 0,
    riskManagement: 0,
    consistency: 0,
    investmentHabit: 0,
    marketResponse: 0,
    grade: getISRGrade(0),
    summary: "아직 투자 기록이 없어 ISR 분석 결과를 생성할 수 없습니다.",
  };
}

function normalizeISRResult(result) {
  return {
    ...result,
    judgment: result.accuracy,
    riskManagement: result.risk,
    consistency: result.stability,
    investmentHabit: result.discipline,
    marketResponse: result.adaptability,
    grade: getISRGrade(result.isr),
    summary: getISRSummary(result),
  };
}

/* =========================
   로그인 사용자 ISR 계산
========================= */
exports.calculateMyISR = async (req, res) => {
  try {
    const memberId = Number(extractMemberId(req));

    if (!memberId) {
      return fail(res, "사용자 정보가 올바르지 않습니다.", null, 400);
    }

    const logs = await getLogsByMemberId(memberId);
    

    if (!logs.length) {


      await db.promise().query(
        `UPDATE members SET isr_score = 0 WHERE member_id = ?`,
        [memberId]
      );

      return success(
        res,
        "기록이 없어 ISR 0으로 처리되었습니다.",
        buildEmptyResult()
      );
    }

    const result = calculateISR({ logs });
    

    await saveISR(memberId, result);
    await achievementService.checkAndGrantAchievements(memberId);

    return success(res, "내 ISR 계산 완료", normalizeISRResult(result));
  } catch (err) {
    console.error("calculateMyISR error =", err);
    return fail(res, "내 ISR 계산 실패", err.message, 500);
  }
};

/* =========================
   특정 회원 ISR 계산
========================= */
exports.calculateUserISR = async (req, res) => {
  try {
    const memberId = Number(req.params.member_id);

    if (!memberId) {
      return fail(res, "member_id가 올바르지 않습니다.", null, 400);
    }

    const logs = await getLogsByMemberId(memberId);

    if (!logs.length) {
      await db.promise().query(
        `UPDATE members SET isr_score = 0 WHERE member_id = ?`,
        [memberId]
      );

      return success(
        res,
        "기록이 없어 ISR 0으로 처리되었습니다.",
        buildEmptyResult()
      );
    }

    const result = calculateISR({ logs });
    await saveISR(memberId, result);

    await achievementService.checkAndGrantAchievements(memberId);

    return success(res, "ISR 계산 완료", normalizeISRResult(result));
  } catch (err) {
    console.error("calculateUserISR error =", err);
    return fail(res, "ISR 계산 실패", err.message, 500);
  }
};

/* =========================
   전체 회원 ISR 재계산
========================= */
exports.calculateAllISR = async (req, res) => {
  try {
    const [members] = await db.promise().query(
      `SELECT member_id FROM members ORDER BY member_id ASC`
    );

    const results = [];

    for (const member of members) {
      const memberId = Number(member.member_id);
      const logs = await getLogsByMemberId(memberId);

      if (!logs.length) {
        await db.promise().query(
          `UPDATE members SET isr_score = 0 WHERE member_id = ?`,
          [memberId]
        );

        results.push({
          memberId,
          ...buildEmptyResult(),
        });

        continue;
      }

      const result = calculateISR({ logs });
      await saveISR(memberId, result);

      await achievementService.checkAndGrantAchievements(memberId);

      results.push({
        memberId,
        ...normalizeISRResult(result),
      });
    }

    return success(res, "전체 회원 ISR 재계산 완료", results);
  } catch (err) {
    console.error("calculateAllISR error =", err);
    return fail(res, "전체 회원 ISR 재계산 실패", err.message, 500);
  }
};

/* =========================
   특정 회원 최신 ISR 조회
========================= */
exports.getLatestISR = async (req, res) => {
  try {
    const memberId = Number(req.params.member_id);

    if (!memberId) {
      return fail(res, "member_id가 올바르지 않습니다.", null, 400);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        member_id,
        isr_accuracy AS accuracy,
        isr_risk AS risk,
        isr_strategy AS strategy,
        isr_stability AS stability,
        isr_discipline AS discipline,
        isr_adaptability AS adaptability,
        isr_score AS isr,
        created_at
      FROM isr_chart
      WHERE member_id = ?
      ORDER BY created_at DESC, chart_id DESC
      LIMIT 1
      `,
      [memberId]
    );

    if (!rows.length) {
      return success(res, "저장된 ISR 데이터가 없습니다.", buildEmptyResult());
    }

    const row = rows[0];
    const normalized = {
      ...row,
      judgment: Number(row.accuracy || 0),
      riskManagement: Number(row.risk || 0),
      consistency: Number(row.stability || 0),
      investmentHabit: Number(row.discipline || 0),
      marketResponse: Number(row.adaptability || 0),
      grade: getISRGrade(Number(row.isr || 0)),
      summary: getISRSummary({
        accuracy: Number(row.accuracy || 0),
        risk: Number(row.risk || 0),
        stability: Number(row.stability || 0),
        discipline: Number(row.discipline || 0),
        adaptability: Number(row.adaptability || 0),
        isr: Number(row.isr || 0),
      }),
    };

    return success(res, "최신 ISR 조회 성공", normalized);
  } catch (err) {
    console.error("getLatestISR error =", err);
    return fail(res, "최신 ISR 조회 실패", err.message, 500);
  }
};

/* =========================
   로그인 사용자 최신 ISR 조회
========================= */
exports.getMyLatestISR = async (req, res) => {
  try {
    const memberId = Number(extractMemberId(req));

    if (!memberId) {
      return fail(res, "사용자 정보가 올바르지 않습니다.", null, 400);
    }

    req.params.member_id = memberId;
    return exports.getLatestISR(req, res);
  } catch (err) {
    console.error("getMyLatestISR error =", err);
    return fail(res, "내 최신 ISR 조회 실패", err.message, 500);
  }
};