const { educationLessons } = require("../data/educationData");

const userEducationProgress = {};

function getUserKey(req) {
  if (!req.user?.member_id) {
    throw new Error("member_id가 토큰에 없습니다.");
  }

  return String(req.user.member_id);
}

function getOrCreateUserProgress(userKey) {
  if (!userEducationProgress[userKey]) {
    userEducationProgress[userKey] = {
      completedLessonIds: [],
      rewardClaimedLessonIds: [],
      totalEarnedPoints: 0,
    };
  }

  return userEducationProgress[userKey];
}

function buildEducationResponse(userProgress) {
  const lessons = educationLessons.map((lesson) => ({
    ...lesson,
    isCompleted: userProgress.completedLessonIds.includes(lesson.id),
    isRewardClaimed: userProgress.rewardClaimedLessonIds.includes(lesson.id),
  }));

  const totalCount = educationLessons.length;
  const completedCount = userProgress.completedLessonIds.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    lessons,
    progress: {
      completedCount,
      totalCount,
      percent,
    },
    totalEarnedPoints: userProgress.totalEarnedPoints,
  };
}

exports.getEducationData = (req, res) => {
  try {
    const userKey = getUserKey(req);
    const userProgress = getOrCreateUserProgress(userKey);

    return res.status(200).json({
      success: true,
      message: "교육 데이터 조회 성공",
      data: buildEducationResponse(userProgress),
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

exports.completeLesson = (req, res) => {
  try {
    const { lessonId } = req.params;
    const userKey = getUserKey(req);
    const userProgress = getOrCreateUserProgress(userKey);

    const lesson = educationLessons.find((item) => item.id === lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "해당 학습 항목을 찾을 수 없습니다.",
        error: null,
      });
    }

    const alreadyCompleted = userProgress.completedLessonIds.includes(lessonId);
    const alreadyRewardClaimed =
      userProgress.rewardClaimedLessonIds.includes(lessonId);

    if (!alreadyCompleted) {
      userProgress.completedLessonIds.push(lessonId);
    }

    let awardedPoints = 0;

    if (!alreadyRewardClaimed) {
      userProgress.rewardClaimedLessonIds.push(lessonId);
      userProgress.totalEarnedPoints += lesson.xp;
      awardedPoints = lesson.xp;
    }

    return res.status(200).json({
      success: true,
      message:
        awardedPoints > 0
          ? "학습 완료 및 포인트 지급 성공"
          : "학습 완료 처리 성공",
      data: {
        awardedPoints,
        ...buildEducationResponse(userProgress),
      },
    });
  } catch (error) {
    console.error("completeLesson error:", error);

    return res.status(500).json({
      success: false,
      message: "학습 완료 처리 실패",
      error: error.message,
    });
  }
};