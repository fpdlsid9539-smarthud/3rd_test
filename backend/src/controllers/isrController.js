let db = null;

try {
  db = require("../../config/db");
} catch (err) {
  console.warn("[ISR] DB 모듈 로드 실패:", err.message);
}

const {
  calculateISR,
  getISRGrade,
  getISRSummary,
} = require("../engines/isrEngine");
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

  return Number(
    req.user.member_id ||
      req.user.id ||
      req.user.memberId ||
      req.user.userId ||
      0
  ) || null;
}

function hasDb() {
  return !!(db && typeof db.promise === "function");
}

async function safeQuery(sql, params = []) {
  if (!hasDb()) {
    throw new Error("DB_NOT_AVAILABLE");
  }

  return db.promise().query(sql, params);
}

function buildDemoResult(seed = null) {
  const result = calculateISR({
    logs: [],
    seed,
  });

  return normalizeISRResult(result);
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
    mode: "EMPTY",
    hasRealLogs: false,
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

function normalizeISRResult(result = {}) {
  const normalized = {
    ...result,
    accuracy: Number(result.accuracy || 0),
    risk: Number(result.risk || 0),
    stability: Number(result.stability || 0),
    discipline: Number(result.discipline || 0),
    adaptability: Number(result.adaptability || 0),
    strategy: Number(result.strategy || 0),
    isr: Number(result.isr || 0),
    judgment: Number(result.accuracy || 0),
    riskManagement: Number(result.risk || 0),
    consistency: Number(result.stability || 0),
    investmentHabit: Number(result.discipline || 0),
    marketResponse: Number(result.adaptability || 0),
    grade: getISRGrade(Number(result.isr || 0)),
    summary: getISRSummary(result),
    mode: result.mode || "REAL",
    hasRealLogs: Boolean(result.hasRealLogs),
  };

  return normalized;
}

async function saveISR(memberId, result) {
  if (!hasDb()) return false;

  await safeQuery(
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
      Number(result.accuracy || 0),
      Number(result.risk || 0),
      Number(result.strategy || 0),
      Number(result.stability || 0),
      Number(result.discipline || 0),
      Number(result.adaptability || 0),
      Number(result.isr || 0),
    ]
  );

  await safeQuery(`UPDATE members SET isr_score = ? WHERE member_id = ?`, [
    Number(result.isr || 0),
    memberId,
  ]);

  return true;
}

async function getLogsByMemberId(memberId) {
  const [rows] = await safeQuery(
    `
    SELECT *
    FROM gameLog
    WHERE member_id = ?
    ORDER BY created_at ASC, log_id ASC
    `,
    [memberId]
  );

  return Array.isArray(rows) ? rows : [];
}

async function updateMemberISRScore(memberId, isrScore) {
  if (!hasDb()) return false;

  await safeQuery(`UPDATE members SET isr_score = ? WHERE member_id = ?`, [
    Number(isrScore || 0),
    memberId,
  ]);

  return true;
}

async function safeGrantAchievements(memberId) {
  try {
    if (
      achievementService &&
      typeof achievementService.checkAndGrantAchievements === "function"
    ) {
      await achievementService.checkAndGrantAchievements(memberId);
    }
  } catch (err) {
    console.error("[ISR] 업적 지급 실패:", err.message);
  }
}

function buildStoredRowResult(row) {
  const result = {
    accuracy: Number(row.accuracy || 0),
    risk: Number(row.risk || 0),
    strategy: Number(row.strategy || 0),
    stability: Number(row.stability || 0),
    discipline: Number(row.discipline || 0),
    adaptability: Number(row.adaptability || 0),
    isr: Number(row.isr || 0),
    mode: "REAL",
    hasRealLogs: true,
    created_at: row.created_at || null,
  };

  return normalizeISRResult(result);
}

/* =========================
   로그인 사용자 ISR 계산
========================= */
exports.calculateMyISR = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 정보가 올바르지 않습니다.", null, 400);
    }

    if (!hasDb()) {
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "DB 연결이 없어 시연용 ISR을 반환합니다.",
        demoResult
      );
    }

    const logs = await getLogsByMemberId(memberId);

    if (!logs.length) {
      const demoResult = buildDemoResult(memberId);

      try {
        await updateMemberISRScore(memberId, demoResult.isr);
      } catch (err) {
        console.error("[ISR] members.isr_score 업데이트 실패:", err.message);
      }

      return success(
        res,
        "기록이 없어 시연용 ISR로 처리되었습니다.",
        demoResult
      );
    }

    const result = calculateISR({
      logs,
      seed: memberId,
    });

    try {
      await saveISR(memberId, result);
    } catch (err) {
      console.error("[ISR] saveISR 실패:", err.message);
    }

    await safeGrantAchievements(memberId);

    return success(res, "내 ISR 계산 완료", normalizeISRResult(result));
  } catch (err) {
    console.error("calculateMyISR error =", err);

    const memberId = extractMemberId(req);
    if (memberId) {
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "DB 오류로 인해 시연용 ISR을 반환합니다.",
        demoResult
      );
    }

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

    if (!hasDb()) {
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "DB 연결이 없어 시연용 ISR을 반환합니다.",
        demoResult
      );
    }

    const logs = await getLogsByMemberId(memberId);

    if (!logs.length) {
      const demoResult = buildDemoResult(memberId);

      try {
        await updateMemberISRScore(memberId, demoResult.isr);
      } catch (err) {
        console.error("[ISR] members.isr_score 업데이트 실패:", err.message);
      }

      return success(
        res,
        "기록이 없어 시연용 ISR로 처리되었습니다.",
        demoResult
      );
    }

    const result = calculateISR({
      logs,
      seed: memberId,
    });

    try {
      await saveISR(memberId, result);
    } catch (err) {
      console.error("[ISR] saveISR 실패:", err.message);
    }

    await safeGrantAchievements(memberId);

    return success(res, "ISR 계산 완료", normalizeISRResult(result));
  } catch (err) {
    console.error("calculateUserISR error =", err);

    const memberId = Number(req.params.member_id);
    if (memberId) {
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "DB 오류로 인해 시연용 ISR을 반환합니다.",
        demoResult
      );
    }

    return fail(res, "ISR 계산 실패", err.message, 500);
  }
};

/* =========================
   전체 회원 ISR 재계산
========================= */
exports.calculateAllISR = async (req, res) => {
  try {
    if (!hasDb()) {
      return success(res, "DB 연결이 없어 전체 ISR 재계산 대신 빈 배열을 반환합니다.", []);
    }

    const [members] = await safeQuery(
      `SELECT member_id FROM members ORDER BY member_id ASC`
    );

    const results = [];

    for (const member of members) {
      const memberId = Number(member.member_id);

      try {
        const logs = await getLogsByMemberId(memberId);

        if (!logs.length) {
          const demoResult = buildDemoResult(memberId);

          try {
            await updateMemberISRScore(memberId, demoResult.isr);
          } catch (err) {
            console.error("[ISR] members.isr_score 업데이트 실패:", err.message);
          }

          results.push({
            memberId,
            ...demoResult,
          });

          continue;
        }

        const result = calculateISR({
          logs,
          seed: memberId,
        });

        try {
          await saveISR(memberId, result);
        } catch (err) {
          console.error("[ISR] saveISR 실패:", err.message);
        }

        await safeGrantAchievements(memberId);

        results.push({
          memberId,
          ...normalizeISRResult(result),
        });
      } catch (memberErr) {
        console.error(`[ISR] member ${memberId} 재계산 실패:`, memberErr.message);

        results.push({
          memberId,
          ...buildDemoResult(memberId),
        });
      }
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

    if (!hasDb()) {
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "DB 연결이 없어 시연용 최신 ISR을 반환합니다.",
        demoResult
      );
    }

    const [rows] = await safeQuery(
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
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "저장된 ISR 데이터가 없어 시연용 ISR을 반환합니다.",
        demoResult
      );
    }

    const normalized = buildStoredRowResult(rows[0]);
    return success(res, "최신 ISR 조회 성공", normalized);
  } catch (err) {
    console.error("getLatestISR error =", err);

    const memberId = Number(req.params.member_id);
    if (memberId) {
      const demoResult = buildDemoResult(memberId);
      return success(
        res,
        "DB 오류로 인해 시연용 최신 ISR을 반환합니다.",
        demoResult
      );
    }

    return fail(res, "최신 ISR 조회 실패", err.message, 500);
  }
};

/* =========================
   로그인 사용자 최신 ISR 조회
========================= */
exports.getMyLatestISR = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

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