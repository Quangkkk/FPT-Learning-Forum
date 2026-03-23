require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const seedUsers = require("./seed");
const app = express();
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// CONNECT DB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedUsers();
  })
  .catch(err => console.error(err));

// MODELS
const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Report = require("./models/Report");
const Category = require("./models/Category");
const Topic = require("./models/Topic");

/** Chỉ hiển thị danh mục này trên diễn đàn công khai (ẩn Marketing và category khác). */
const PUBLIC_FORUM_CATEGORY_SLUG = "cong-nghe-thong-tin";

const STATIC_FORUM_FALLBACK = {
  categories: [
    {
      id: "cong-nghe-thong-tin",
      name: "Công nghệ thông tin",
      topics: [
        "prf192",
        "pro192",
        "csd201",
        "dbi202",
        "swp391",
        "mad101",
        "wed201"
      ]
    }
  ],
  topics: {
    prf192: { name: "PRF192 - Programming Fundamentals" },
    pro192: { name: "PRO192 - Object-Oriented Programming" },
    csd201: { name: "CSD201 - Data Structures & Algorithms" },
    dbi202: { name: "DBI202 - Database Systems" },
    swp391: { name: "SWP391 - Software Project" },
    mad101: { name: "MAD101 - Mobile Development" },
    wed201: { name: "WED201 - Web Design" }
  }
};

async function buildForumPayload() {
  try {
    const cat = await Category.findOne({ slug: PUBLIC_FORUM_CATEGORY_SLUG }).lean();
    if (!cat) return STATIC_FORUM_FALLBACK;

    const topicsDocs = await Topic.find({ categoryId: cat._id }).sort({ name: 1 }).lean();
    if (!topicsDocs.length) return STATIC_FORUM_FALLBACK;

    const topics = {};
    const topicSlugs = [];
    for (const t of topicsDocs) {
      topics[t.slug] = { name: t.name };
      topicSlugs.push(t.slug);
    }

    return {
      categories: [
        {
          id: cat.slug,
          name: cat.name,
          topics: topicSlugs
        }
      ],
      topics
    };
  } catch {
    return STATIC_FORUM_FALLBACK;
  }
}

async function getPublicForumTopicIdValues() {
  try {
    const cat = await Category.findOne({ slug: PUBLIC_FORUM_CATEGORY_SLUG }).lean();
    if (!cat) return null;

    const topicsDocs = await Topic.find({ categoryId: cat._id }).select("slug _id").lean();
    if (!topicsDocs.length) return null;

    const values = [];
    for (const t of topicsDocs) {
      values.push(t.slug, String(t._id));
    }
    return values;
  } catch {
    return null;
  }
}

function canBypassForumTopicFilter(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ") || !process.env.JWT_SECRET) return false;
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return decoded.role === "moderator" || decoded.role === "admin";
  } catch {
    return false;
  }
}
const { verifyToken, verifyAdmin, verifyModerator } = require("./middleware/auth.middleware");
const adminRoutes = require("./routes/admin.routes");
const { sendVerificationEmail } = require("./config/mailer");

const postUploadDir = path.join(__dirname, "uploads", "posts");
const postStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(postUploadDir, { recursive: true });
    cb(null, postUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const baseName = path
      .basename(file.originalname || "file", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 50);

    cb(null, `${Date.now()}-${baseName || "upload"}${ext}`);
  }
});
const postUpload = multer({ storage: postStorage });


// ================= AUTH =================
app.get("/api/forum", async (req, res) => {
  try {
    const payload = await buildForumPayload();
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Forum error", error: err.message });
  }
});
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    if (!normalizedName || !normalizedEmail || !rawPassword) {
      return res.status(400).json({ message: "Name, email, password là bắt buộc" });
    }

    if (rawPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing.isVerify) {
      return res.status(409).json({ message: "Email đã được đăng ký" });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let user;
    if (existing) {
      existing.name = normalizedName;
      existing.password = rawPassword;
      existing.role = "student";
      existing.active = true;
      existing.isVerify = false;
      existing.verifyToken = verifyToken;
      existing.verifyTokenExpires = verifyTokenExpires;
      user = await existing.save();
    } else {
      user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password: rawPassword,
        role: "student",
        active: true,
        isVerify: false,
        verifyToken,
        verifyTokenExpires
      });
    }

    const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientBaseUrl}/verify-email?token=${encodeURIComponent(verifyToken)}`;

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl
    });

    return res.status(201).json({
      message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản."
    });
  } catch (err) {
    return res.status(500).json({ message: "Register error", error: err.message });
  }
});

app.get("/api/auth/verify-email", async (req, res) => {
  const token = String(req.query.token || "").trim();

  if (!token) {
    return res.status(400).json({ message: "Thiếu token xác minh" });
  }

  try {
    const user = await User.findOne({ verifyToken: token });

    if (!user) {
      return res.status(400).json({ message: "Link xác minh không hợp lệ hoặc đã hết hạn" });
    }

    if (user.isVerify) {
      return res.json({ message: "Email đã được xác minh thành công " });
    }

    const isExpired = !user.verifyTokenExpires || user.verifyTokenExpires <= new Date();

    if (isExpired) {
      const refreshedToken = crypto.randomBytes(32).toString("hex");
      const refreshedTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.verifyToken = refreshedToken;
      user.verifyTokenExpires = refreshedTokenExpires;
      await user.save();

      const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const verifyUrl = `${clientBaseUrl}/verify-email?token=${encodeURIComponent(refreshedToken)}`;

      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl
      });

      return res.status(400).json({
        message: "Link xác minh đã hết hạn. Hệ thống đã gửi link mới vào email của bạn."
      });
    }

    // Keep token for idempotent behavior: repeated clicks should show
    // "already verified" instead of "invalid link".
    user.isVerify = true;
    await user.save();

    return res.json({ message: "Xác minh email thành công" });
  } catch (err) {
    return res.status(500).json({ message: "Verify error", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    if (!normalizedEmail || !rawPassword) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== rawPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa"
      });
    }

    // if (user.isVerify === false) {
    //   return res.status(403).json({ message: "Email chưa xác minh. Vui lòng kiểm tra email." });
    // }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      isVerify: user.isVerify
    };

    res.json({
      token,
      user: safeUser
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= POSTS =================

app.post("/api/posts", verifyToken, postUpload.fields([
  { name: "image", maxCount: 10 },
  { name: "video", maxCount: 10 }
]), async (req, res) => {
  try {
    const { title, content, topicId } = req.body

    const normalizedTitle = String(title || "").trim()
    const normalizedContent = String(content || "").trim()
    const normalizedTopicId = String(topicId || "").trim()

    if (!normalizedTitle || !normalizedContent || !normalizedTopicId) {
      return res.status(400).json({ message: "Thiếu tiêu đề, nội dung hoặc chủ đề" })
    }

    const role = req.user?.role;
    const canPostAnyTopic = role === "moderator" || role === "admin";
    if (!canPostAnyTopic) {
      const allowed = await getPublicForumTopicIdValues();
      if (allowed?.length && !allowed.includes(normalizedTopicId)) {
        return res.status(400).json({
          message: "Chỉ được đăng bài trong các chủ đề thuộc Công nghệ thông tin"
        });
      }
    }

    const normalizedAnonymous = String(req.body.isAnonymous || "false").toLowerCase() === "true"

    const imageUrls = (req.files?.image || []).map((file) => `/uploads/posts/${file.filename}`)
    const videoUrls = (req.files?.video || []).map((file) => `/uploads/posts/${file.filename}`)

    const post = await Post.create({
      title: normalizedTitle,
      content: normalizedContent,
      topicId: normalizedTopicId,
      authorId: req.user.id,
      isAnonymous: normalizedAnonymous,
      imageUrls,
      videoUrls
    })

    res.json(post)
  } catch (err) {
    res.status(500).json({ message: "Create post error" })
  }
})
app.get("/api/posts", async (req, res) => {
  try {
    const { topicId } = req.query;
    const filter = {};
    const bypass = canBypassForumTopicFilter(req);
    const allowed = bypass ? null : await getPublicForumTopicIdValues();

    if (topicId) {
      const tid = String(topicId);
      if (!bypass && allowed?.length && !allowed.includes(tid)) {
        return res.json([]);
      }
      filter.topicId = tid;
    } else if (!bypass && allowed?.length) {
      filter.topicId = { $in: allowed };
    }

    const posts = await Post.find(filter)
      .populate("authorId", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error loading posts" });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("authorId", "email name");

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const bypass = canBypassForumTopicFilter(req);
    if (!bypass) {
      const allowed = await getPublicForumTopicIdValues();
      if (allowed?.length && !allowed.includes(String(post.topicId))) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
    }

    const comments = await Comment.find({ postId: req.params.id });

    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/posts/:id/status", verifyToken, verifyModerator, async (req, res) => {
  const { status, reason } = req.body;

  try {
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    }

    const normalizedReason = String(reason || '').trim()

    if (status === 'rejected' && !normalizedReason) {
      return res.status(400).json({ message: 'Cần nhập lý do khi hủy bài' })
    }

    await Post.findByIdAndUpdate(req.params.id, {
      status,
      moderationReason: status === 'rejected' ? normalizedReason : ''
    });

    res.json({ message: "Post status updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating post" });
  }
});


// ================= COMMENTS =================
app.post("/api/posts/:id/comments", verifyToken, async (req, res) => {
  const comment = await Comment.create({
    postId: req.params.id,
    authorId: req.user.id,
    content: req.body.content
  });

  res.json(comment);
});


// ================= REPORTS =================
app.get("/api/reports", verifyToken, verifyModerator, async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.json(reports);
});

app.post("/api/reports", verifyToken, async (req, res) => {
  const report = await Report.create({
    ...req.body,
    reporterId: req.user.id
  });
  res.json(report);
});

app.patch("/api/reports/:id/status", verifyToken, verifyModerator, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const normalizedReason = String(reason || "").trim();

    if (!["resolved", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái report không hợp lệ" });
    }

    if (!normalizedReason) {
      return res.status(400).json({ message: "Cần nhập lý do xử lý report" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report không tồn tại" });
    }

    report.status = status;
    report.processReason = normalizedReason;
    await report.save();

    return res.json({ message: "Report updated", report });
  } catch (err) {
    return res.status(500).json({ message: "Error updating report" });
  }
});


app.use("/api/admin", adminRoutes);

app.get("/api/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments()
    const postCount = await Post.countDocuments()
    const pendingCount = await Post.countDocuments({ status: "pending" })
    const reportCount = await Report.countDocuments()

    res.json({
      users: userCount,
      posts: postCount,
      pending: pendingCount,
      reports: reportCount
    })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});