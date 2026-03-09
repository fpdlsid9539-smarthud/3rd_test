const members = require("../data/memberData");

const DEV_MEMBER_ID = 1;

function devAuth(req, res, next) {
  const user = members.find((m) => m.member_id === DEV_MEMBER_ID);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `개발용 유저(member_id=${DEV_MEMBER_ID})를 찾을 수 없습니다.`,
    });
  }

  req.user = user;
  next();
}

module.exports = devAuth;