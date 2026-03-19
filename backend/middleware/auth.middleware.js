const jwt = require("jsonwebtoken");

// ✅ Verify token (bắt buộc)
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ Không có header
    if (!authHeader) {
      return res.status(401).json({
        message: "Chưa đăng nhập (không có token)"
      });
    }

    // format: Bearer <token>
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token không tồn tại"
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // lưu user vào request
    req.user = decoded;

    // DEBUG (có thể bật khi cần)
    // console.log("DECODED:", decoded);

    next();
  } catch (err) {
    return res.status(403).json({
      message: "Token không hợp lệ",
      error: err.message
    });
  }
};
// ✅ Check admin
exports.verifyAdmin = (req, res, next) => {
  try {
    // ❌ chưa có user (chưa chạy verifyToken)
    if (!req.user) {
      return res.status(401).json({
        message: "Chưa xác thực người dùng"
      });
    }

    // ❌ không phải admin
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
