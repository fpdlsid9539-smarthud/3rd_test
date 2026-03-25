const db = require('../config/db');

function fail(res, message, error = null, status = 403) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

module.exports = async (req, res, next) => {
  try {
    const memberId =
      req.user?.member_id ??
      req.user?.memberId ??
      req.user?.id ??
      null;

    if (!memberId) {
      return fail(res, '인증 정보가 없습니다.', null, 401);
    }

    const [rows] = await db.promise().query(
      `
      SELECT member_id, role
      FROM members
      WHERE member_id = ?
      LIMIT 1
      `,
      [memberId]
    );

    if (!rows.length) {
      return fail(res, '사용자를 찾을 수 없습니다.', null, 404);
    }

    if (rows[0].role !== 'admin') {
      return fail(res, '관리자 권한이 필요합니다.', null, 403);
    }

    next();
  } catch (err) {
    console.error('adminMiddleware error =', err);
    return fail(res, '관리자 권한 확인 실패', err.message, 500);
  }
};