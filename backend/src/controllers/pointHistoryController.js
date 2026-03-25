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
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const [rows] = await db.promise().query(sql, [memberId]);

    const notifications = rows.map((row) => {
      const reason = String(row.reason || "").trim();
      const reasonStr = reason.toLowerCase();

      let displayType = "포인트 변동";

      if (
        reasonStr.includes("lesson") ||
        reasonStr.includes("교육")
      ) {
        displayType = "교육실 학습완료";
      } else if (
        reasonStr.includes("quiz") ||
        reasonStr.includes("퀴즈") ||
        reasonStr.includes("correct") ||
        reasonStr.includes("wrong")
      ) {
        displayType = "전략실 퀴즈";
      } else if (
        reason.includes("매수") ||
        reason.includes("매도") ||
        reason.includes("찜하기") ||
        reason.includes("찜 해제") ||
        reasonStr.includes("stock") ||
        reasonStr.includes("buy") ||
        reasonStr.includes("sell") ||
        reasonStr.includes("like") ||
        reasonStr.includes("주식")
      ) {
        displayType = reason || "전략실 주식 매매";
      } else {
        displayType = reason || "포인트 변동";
      }

      return {
        history_id: row.history_id,
        type: displayType,
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