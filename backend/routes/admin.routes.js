const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const User = require("../models/User");

// ✅ Toggle active/deactive
router.patch("/users/:id/toggle", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        // ❗ không cho tự deactivate chính mình
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: "Không thể tự khóa chính mình" });
        }

        user.active = !user.active;
        await user.save();

        res.json({
            message: user.active ? "Đã kích hoạt user" : "Đã khóa user",
            user
        });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;
