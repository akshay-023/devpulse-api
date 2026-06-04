const { generateToken } = require("../config/passport");

const githubCallback = (req, res) => {
  const token = generateToken(req.user);

  res.status(200).json({
    status: "success",
    message: "GitHub authentication successful",
    token,
    user: req.user,
  });
};

const getMe = async (req, res) => {
  res.status(200).json({
    status: "success",
    user: req.user,
  });
};

const logout = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully. Please remove token on client side.",
  });
};

module.exports = {
  githubCallback,
  getMe,
  logout,
};