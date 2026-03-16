module.exports = (req, res, next) => {
  const { nickname } = req.body;

  if (!nickname || !nickname.trim()) {
    return res.status(400).json({
      success: false,
      message: "닉네임은 필수입니다.",
    });
  }

  const trimmedNickname = nickname.trim();

  if (trimmedNickname.length > 100) {
    return res.status(400).json({
      success: false,
      message: "닉네임은 100자 이하로 입력해주세요.",
    });
  }

  req.body.nickname = trimmedNickname;
  next();
};