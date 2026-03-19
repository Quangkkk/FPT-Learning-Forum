const User = require("../models/User");
const Post = require("../models/Post");
const Report = require("../models/Report");

exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const pendingCount = await Post.countDocuments({ status: "pending" });
    const reportCount = await Report.countDocuments();

    res.json({
      users: userCount,
      posts: postCount,
      pending: pendingCount,
      reports: reportCount
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
