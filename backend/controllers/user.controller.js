const User = require("../models/User");

exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};
