const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin, verifyModerator } = require("../middleware/auth.middleware");

const User = require("../models/User");
const Topic = require("../models/Topic");
const Category = require("../models/Category");


// ================= USERS =================
router.patch("/users/:id/toggle", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

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
        console.error("TOGGLE USER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// ================= TOPICS =================

// ❌ PUBLIC
router.get("/topics", async (req, res) => {
    try {
        const topics = await Topic.find().populate("categoryId", "name");
        res.json(topics);
    } catch (err) {
        console.error("GET TOPICS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ✅ MODERATOR / ADMIN
router.post("/topics", verifyToken, verifyModerator, async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        if (!name || !categoryId) {
            return res.status(400).json({ message: "Name và categoryId là bắt buộc" });
        }

        let slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "");

        // chống trùng slug
        const existing = await Topic.findOne({ slug });
        if (existing) slug += "-" + Date.now();

        const topic = await Topic.create({
            name,
            slug,
            categoryId
        });

        res.status(201).json({ message: "Topic created", topic });

    } catch (err) {
        console.error("CREATE TOPIC ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ✅ MODERATOR / ADMIN
router.patch("/topics/:id", verifyToken, verifyModerator, async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        const topic = await Topic.findById(req.params.id);
        if (!topic) {
            return res.status(404).json({ message: "Topic không tồn tại" });
        }

        if (name) {
            topic.name = name;

            let slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w\-]+/g, "");

            const existing = await Topic.findOne({ slug });
            if (existing && existing._id.toString() !== topic._id.toString()) {
                slug += "-" + Date.now();
            }

            topic.slug = slug;
        }

        if (categoryId) {
            topic.categoryId = categoryId;
        }

        await topic.save();

        res.json({ message: "Topic updated", topic });

    } catch (err) {
        console.error("UPDATE TOPIC ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ✅ MODERATOR / ADMIN
router.delete("/topics/:id", verifyToken, verifyModerator, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);

        if (!topic) {
            return res.status(404).json({ message: "Topic không tồn tại" });
        }

        await topic.deleteOne();

        res.json({ message: "Topic deleted" });

    } catch (err) {
        console.error("DELETE TOPIC ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// ================= CATEGORIES =================

// ❌ PUBLIC
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        console.error("GET CATEGORY ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ✅ ADMIN
router.post("/categories", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Name là bắt buộc" });
        }

        let slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "");

        const existing = await Category.findOne({ slug });
        if (existing) slug += "-" + Date.now();

        const category = await Category.create({ name, slug });

        res.status(201).json({ message: "Category created", category });

    } catch (err) {
        console.error("CREATE CATEGORY ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ✅ ADMIN
router.patch("/categories/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category không tồn tại" });
        }

        if (name) {
            category.name = name;

            let slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w\-]+/g, "");

            const existing = await Category.findOne({ slug });
            if (existing && existing._id.toString() !== category._id.toString()) {
                slug += "-" + Date.now();
            }

            category.slug = slug;
        }

        await category.save();

        res.json({ message: "Category updated", category });

    } catch (err) {
        console.error("UPDATE CATEGORY ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ✅ ADMIN
router.delete("/categories/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category không tồn tại" });
        }

        const topicExists = await Topic.findOne({ categoryId: category._id });
        if (topicExists) {
            return res.status(400).json({
                message: "Không thể xóa category đang có topic"
            });
        }

        await category.deleteOne();

        res.json({ message: "Category deleted" });

    } catch (err) {
        console.error("DELETE CATEGORY ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
