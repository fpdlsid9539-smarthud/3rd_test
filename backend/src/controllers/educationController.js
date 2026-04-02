const db = require("../../config/db");
const achievementService = require("../services/achievementService");

function getUserKey(req) {
  if (!req.user?.member_id) {
    throw new Error("member_id가 토큰에 없습니다.");
  }
  return Number(req.user.member_id);
}

function buildLessonReason(lessonId) {
  return `lesson_complete:${lessonId}`;
}

async function getUserMembershipType(memberId) {
  const [rows] = await db.promise().query(
    "SELECT membership_type FROM members WHERE member_id = ? LIMIT 1",
    [memberId]
  );
  if (rows.length === 0) throw new Error("회원을 찾을 수 없습니다.");
  return rows[0]?.membership_type || "free";
}

async function getUserCompletedLessonIds(memberId) {
  const [rows] = await db.promise().query(
    "SELECT reason FROM point_history WHERE member_id = ? AND reason LIKE 'lesson_complete:%'",
    [memberId]
  );
  return rows
    .map((row) => String(row.reason || ""))
    .map((reason) => reason.replace("lesson_complete:", ""));
}

async function getUserTotalEarnedPoints(memberId) {
  const [rows] = await db.promise().query(
    "SELECT COALESCE(SUM(change_amount), 0) AS totalEarnedPoints FROM point_history WHERE member_id = ? AND reason LIKE 'lesson_complete:%'",
    [memberId]
  );
  return Number(rows?.totalEarnedPoints || 0);
}

// 🟢 프론트엔드가 요구하는 구조로 응답 데이터를 생성하는 함수
async function buildEducationResponse(memberId) {
  const membership_type = await getUserMembershipType(memberId);
  const completedLessonIds = await getUserCompletedLessonIds(memberId);
  const totalEarnedPoints = await getUserTotalEarnedPoints(memberId);

  // 1. DB에서 모든 교육 데이터 가져오기
  const [dbLessons] = await db.promise().query(
    "SELECT * FROM education_lessons ORDER BY created_at ASC"
  );

  // 2. 프론트엔드 형식으로 매핑
  const lessons = dbLessons.map(lesson => ({
    id: lesson.lesson_id,
    title: lesson.title,
    xp: lesson.xp,
    status: lesson.status,
    difficulty: lesson.difficulty,
    icon: lesson.icon,
    level: lesson.level_name,
    summary: lesson.summary,
    isCompleted: completedLessonIds.includes(lesson.lesson_id)
  }));

  // 3. 학습 진행도 계산
  const totalCount = lessons.length;
  const completedCount = lessons.filter(l => l.isCompleted).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 4. 프론트엔드(Education.jsx)가 기대하는 객체 구조로 반환
  return {
    membership_type,
    totalEarnedPoints,
    lessons,
    progress: {
      completedCount,
      totalCount,
      percent
    }
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

    // 1. DB에서 해당 학습 정보 조회
    const [lessonRows] = await connection.query(
      "SELECT xp FROM education_lessons WHERE lesson_id = ? LIMIT 1",
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 학습 항목을 찾을 수 없습니다.",
      });
    }

    const lessonPoint = Number(lessonRows.xp || 0);
    const reason = buildLessonReason(lessonId);

    await connection.beginTransaction();

    // 중복 완료 체크
    const [historyRows] = await connection.query(
      "SELECT history_id FROM point_history WHERE member_id = ? AND reason = ? LIMIT 1",
      [memberId, reason]
    );

    let awardedPoints = 0;
    if (historyRows.length === 0) {
      // 포인트 업데이트
      await connection.query(
        "UPDATE members SET points = points + ? WHERE member_id = ?",
        [lessonPoint, memberId]
      );
      // 내역 저장
      await connection.query(
        "INSERT INTO point_history (member_id, change_amount, reason) VALUES (?, ?, ?)",
        [memberId, lessonPoint, reason]
      );
      awardedPoints = lessonPoint;
    }

    await connection.commit();

    const achievementResult = await achievementService.checkAndGrantAchievements(memberId);
    const data = await buildEducationResponse(memberId);

    return res.status(200).json({
      success: true,
      message: awardedPoints > 0 ? "학습 완료 및 포인트 지급 성공" : "학습 완료 처리 성공",
      data: {
        awardedPoints,
        achievements: achievementResult,
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