const jwt = require("jsonwebtoken");

function extractBearerToken(authHeader = "") {
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Chưa đăng nhập (không có token)"
      });
    }

    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json({
        message: "Định dạng token không hợp lệ"
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

function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Chưa xác thực người dùng"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập"
      });
    }

    next();
  };
}

exports.verifyAdmin = (req, res, next) => {
  try {
    return requireRoles(["admin"])(req, res, next);
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi verifyAdmin",
      error: err.message
    });
  }
};

exports.verifyModerator = (req, res, next) => {
  try {
    return requireRoles(["moderator", "admin"])(req, res, next);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi verifyModerator" });
  }
};

exports.requireRoles = requireRoles;

