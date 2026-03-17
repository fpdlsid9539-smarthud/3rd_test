const db = require("../../config/db");
const { educationLessons } = require("../data/educationData");

function getUserKey(req) {
  if (!req.user?.member_id) {
    throw new Error("member_id가 토큰에 없습니다.");
  }

  return Number(req.user.member_id);
}

function buildLessonReason(lessonId) {
  return `lesson_complete:${lessonId}`;
}

async function getUserCompletedLessonIds(memberId) {
  const [rows] = await db.promise().query(
    `
    SELECT reason
    FROM point_history
    WHERE member_id = ?
      AND reason LIKE 'lesson_complete:%'
    `,
    [memberId]
  );

  return rows
    .map((row) => String(row.reason || ""))
    .filter((reason) => reason.startsWith("lesson_complete:"))
    .map((reason) => reason.replace("lesson_complete:", ""));
}

async function getUserTotalEarnedPoints(memberId) {
  const [rows] = await db.promise().query(
    `
    SELECT COALESCE(SUM(change_amount), 0) AS totalEarnedPoints
    FROM point_history
    WHERE member_id = ?
      AND reason LIKE 'lesson_complete:%'
    `,
    [memberId]
  );

  return Number(rows[0]?.totalEarnedPoints || 0);
}

async function buildEducationResponse(memberId) {
  const completedLessonIds = await getUserCompletedLessonIds(memberId);
  const completedSet = new Set(completedLessonIds);

  const lessons = educationLessons.map((lesson) => ({
    ...lesson,
    status: lesson.status || "default",
    isCompleted: completedSet.has(lesson.id),
    isRewardClaimed: completedSet.has(lesson.id),
  }));

  const totalCount = educationLessons.length;
  const completedCount = completedLessonIds.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const totalEarnedPoints = await getUserTotalEarnedPoints(memberId);

  return {
    lessons,
    progress: {
      completedCount,
      totalCount,
      percent,
    },
    totalEarnedPoints,
  };
}

exports.getEducationData = async (req, res) => {
  try {
    const memberId = getUserKey(req);

    const data = await buildEducationResponse(memberId);

    return res.status(200).json({
      success: true,
      message: "교육 데이터 조회 성공",
      data,
    });
  } catch (error) {
    console.error("getEducationData error:", error);

    return res.status(500).json({
      success: false,
      message: "교육 데이터 조회 실패",
      error: error.message,
    });
  }
};

exports.completeLesson = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const { lessonId } = req.params;
    const memberId = getUserKey(req);

    const lesson = educationLessons.find((item) => item.id === lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "해당 학습 항목을 찾을 수 없습니다.",
        error: null,
      });
    }

    const reason = buildLessonReason(lessonId);
    const lessonPoint = Number(lesson.xp || 0);

    await connection.beginTransaction();

    // 이미 이 학습으로 포인트를 받은 적 있는지 확인
    const [historyRows] = await connection.query(
      `
      SELECT history_id
      FROM point_history
      WHERE member_id = ? AND reason = ?
      LIMIT 1
      `,
      [memberId, reason]
    );

    let awardedPoints = 0;

    if (historyRows.length === 0) {
      // members.points 실제 적립
      const [updateResult] = await connection.query(
        `
        UPDATE members
        SET points = points + ?
        WHERE member_id = ?
        `,
        [lessonPoint, memberId]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("존재하지 않는 회원입니다.");
      }

      // point_history 기록
      await connection.query(
        `
        INSERT INTO point_history (member_id, change_amount, reason)
        VALUES (?, ?, ?)
        `,
        [memberId, lessonPoint, reason]
      );

      awardedPoints = lessonPoint;
    }

    await connection.commit();

    const data = await buildEducationResponse(memberId);

    return res.status(200).json({
      success: true,
      message:
        awardedPoints > 0
          ? "학습 완료 및 포인트 지급 성공"
          : "학습 완료 처리 성공",
      data: {
        awardedPoints,
        ...data,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("completeLesson error:", error);

    return res.status(500).json({
      success: false,
      message: "학습 완료 처리 실패",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};