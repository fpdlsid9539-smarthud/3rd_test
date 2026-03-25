const db = require("../../config/db");

const TOSS_SECRET_KEY = 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

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

exports.getMembership = async (req, res) => {
  try {
    const memberId = req.user?.member_id;

    if (!memberId) {
      return fail(res, "인증된 사용자 정보가 없습니다.", null, 401);
    }

    const [rows] = await db.promise().query(
      `SELECT membership_type
       FROM members
       WHERE member_id = ?`,
      [memberId]
    );

    if (rows.length === 0) {
      return fail(res, "회원을 찾을 수 없습니다.", null, 404);
    }

    return success(res, "멤버십 조회 성공", {
      membership_type: rows[0].membership_type,
    });
  } catch (err) {
    return fail(res, "멤버십 조회 실패", err.message, 500);
  }
};

exports.upgradeToPremium = async (req, res) => {
  try {
    const memberId = req.user?.member_id;

    if (!memberId) {
      return fail(res, "인증된 사용자 정보가 없습니다.", null, 401);
    }

    const [rows] = await db.promise().query(
      `SELECT member_id, membership_type
       FROM members
       WHERE member_id = ?`,
      [memberId]
    );

    if (rows.length === 0) {
      return fail(res, "회원을 찾을 수 없습니다.", null, 404);
    }

    if (rows[0].membership_type === "premium") {
      return success(res, "이미 프리미엄 회원입니다.", {
        member_id: memberId,
        membership_type: "premium",
      });
    }

    await db.promise().query(
      `UPDATE members
       SET membership_type = 'premium'
       WHERE member_id = ?`,
      [memberId]
    );

    return success(res, "프리미엄 회원으로 전환되었습니다.", {
      member_id: memberId,
      membership_type: "premium",
    });
  } catch (err) {
    return fail(res, "프리미엄 전환 실패", err.message, 500);
  }
};

exports.cancelPremium = async (req, res) => {
  try {
    const memberId = req.user?.member_id;

    if (!memberId) {
      return fail(res, "인증된 사용자 정보가 없습니다.", null, 401);
    }

    const [rows] = await db.promise().query(
      `SELECT member_id, membership_type
       FROM members
       WHERE member_id = ?`,
      [memberId]
    );

    if (rows.length === 0) {
      return fail(res, "회원을 찾을 수 없습니다.", null, 404);
    }

    if (rows[0].membership_type === "free") {
      return success(res, "이미 무료 회원입니다.", {
        member_id: memberId,
        membership_type: "free",
      });
    }

    await db.promise().query(
      `UPDATE members
       SET membership_type = 'free'
       WHERE member_id = ?`,
      [memberId]
    );

    return success(res, "구독취소가 되었습니다.", {
      member_id: memberId,
      membership_type: "free",
    });
  } catch (err) {
    return fail(res, "구독취소 실패", err.message, 500);
  }
};

exports.confirmPayment = async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  const memberId = req.user.member_id || req.user.id;

  try {
    // 1. 토스 서버로 승인(Confirm) 요청 보내기
    // 시크릿 키 뒤에 콜론(:)을 붙여 Base64 인코딩을 해야 합니다.
    const encryptedSecretKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
    
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    });

    const tossData = await response.json();

    if (!response.ok) {
      console.error("토스 결제 승인 실패:", tossData);
      return res.status(400).json({ success: false, message: '결제 승인 실패', error: tossData });
    }

    // 2. 승인이 성공하면 DB 업데이트 (무료회원 -> 프리미엄)
    await db.promise().query(
      `UPDATE members SET membership_type = 'premium' WHERE member_id = ?`,
      [memberId]
    );

    return res.status(200).json({
      success: true,
      message: '결제 승인 및 프리미엄 전환 완료',
      data: tossData
    });

  } catch (err) {
    console.error('서버 결제 처리 에러:', err);
    return res.status(500).json({ success: false, message: '서버 에러' });
  }
};