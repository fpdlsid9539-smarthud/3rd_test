function devAuth(req, res, next) {
  req.user = {
    member_id: 1,
    provider: "dev",
    provider_id: "dev_1",
    nickname: "개발용유저"
  };
  next();
}

module.exports = devAuth;