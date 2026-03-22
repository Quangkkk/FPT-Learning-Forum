const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Chưa đăng nhập (không có token)"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token không tồn tại"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      message: "Token không hợp lệ",
      error: err.message
    });
  }
};
exports.verifyAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Chưa xác thực người dùng"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Không có quyền admin"
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi verifyAdmin",
      error: err.message
    });
  }
};

exports.verifyModerator = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "moderator") {
      return res.status(403).json({
        message: "Chỉ moderator mới được phép"
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

