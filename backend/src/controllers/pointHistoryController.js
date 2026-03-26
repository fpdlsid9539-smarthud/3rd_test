const db = require("../../config/db");

function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

function extractMemberId(req) {
  const rawId =
    req.user?.member_id ??
    req.user?.id ??
    req.user?.memberId ??
    null;

  const memberId = Number(rawId);
  return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
}

function getDisplayType(reason) {
  const reasonStr = String(reason || "").toLowerCase();

  // 1. 일일 O/X 퀴즈
  if (
    reasonStr.includes("ox_quiz") ||
    reasonStr.includes("ox quiz") ||
    reasonStr.includes("daily_ox")
  ) {
    return "일일O/X퀴즈";
  }

  // 2. 일반 전략실 퀴즈 (그 외 quiz 전부)
  if (
    reasonStr.includes("quiz") ||
    reasonStr.includes("퀴즈") ||
    reasonStr.includes("correct") ||
    reasonStr.includes("wrong")
  ) {
    return "교육실 퀴즈";
  }

  // 3. 교육실
  if (
    reasonStr.includes("lesson") ||
    reasonStr.includes("education") ||
    reasonStr.includes("교육")
  ) {
    return "교육실 학습완료";
  }

  // 4. 주식
  if (
    reasonStr.includes("stock") ||
    reasonStr.includes("buy") ||
    reasonStr.includes("sell") ||
    reasonStr.includes("주식") ||
    reasonStr.includes("매수") ||
    reasonStr.includes("매도")
  ) {
   let formattedReason = reason;
    if (reason.endsWith("매수")) {
      formattedReason = `[매수] ${reason.replace(" 매수", "").trim()}`;
    } else if (reason.endsWith("매도")) {
      formattedReason = `[매도] ${reason.replace(" 매도", "").trim()}`;
    }
    
    return formattedReason; 
  }
}

exports.getPointNotifications = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "인증이 필요합니다.", null, 401);
    }

    const sql = `
      SELECT
        history_id,
        change_amount,
        reason,
        created_at
      FROM point_history
      WHERE member_id = ?
        AND change_amount !=0
        AND is_hidden = 0
      ORDER BY created_at DESC
    `;

    const [rows] = await db.promise().query(sql, [memberId]);

    const notifications = rows.map((row) => {
      return {
        history_id: row.history_id,
        type: getDisplayType(row.reason),
        changeAmount: Number(row.change_amount || 0),
        createdAt: row.created_at,
      };
    });

    return success(res, "포인트 알림 조회 성공", notifications);
  } catch (err) {
    console.error("포인트 알림 오류:", err);
    return fail(res, "포인트 알림 조회 실패", err.message);
  }
};

exports.hidePointNotification = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const historyId = Number(req.params.historyId);

    if (!memberId) {
      return fail(res, "인증이 필요합니다.", null, 401);
    }

    if (!Number.isInteger(historyId) || historyId <= 0) {
      return fail(res, "올바른 history_id가 아닙니다.", null, 400);
    }

    const sql = `
      UPDATE point_history
      SET is_hidden = 1
      WHERE history_id = ?
        AND member_id = ?
    `;

    const [result] = await db.promise().query(sql, [historyId, memberId]);

    if (!result.affectedRows) {
      return fail(res, "숨길 포인트 내역을 찾지 못했습니다.", null, 404);
    }

    return success(res, "포인트 내역 숨김 처리 성공");
  } catch (err) {
    console.error("포인트 내역 숨김 오류:", err);
    return fail(res, "포인트 내역 숨김 처리 실패", err.message);
  }
};