require("dotenv").config();
const http = require("http");
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
const DirectMessage = require("./models/DirectMessage");
const Category = require("./models/Category");
const Topic = require("./models/Topic");

/** Chỉ hiển thị danh mục này trên diễn đàn công khai (ẩn Marketing và category khác). */
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
    const [categoriesDocs, topicsDocs] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Topic.find().sort({ name: 1 }).lean()
    ]);
    if (!categoriesDocs.length || !topicsDocs.length) return STATIC_FORUM_FALLBACK;

    const topics = {};
    const topicsByCategory = new Map();

    for (const t of topicsDocs) {
      topics[t.slug] = { name: t.name };

      const categoryKey = String(t.categoryId);
      const current = topicsByCategory.get(categoryKey) || [];
      current.push(t.slug);
      topicsByCategory.set(categoryKey, current);
    }

    return {
      categories: categoriesDocs.map((cat) => ({
        id: cat.slug,
        name: cat.name,
        topics: topicsByCategory.get(String(cat._id)) || []
      })),
      topics
    };
  } catch {
    return STATIC_FORUM_FALLBACK;
  }
}

async function getPublicForumTopicIdValues() {
  try {
    const topicsDocs = await Topic.find().select("slug _id").lean();
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

const avatarUploadDir = path.join(__dirname, "uploads", "avatars");
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
    cb(null, avatarUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const baseName = path
      .basename(file.originalname || "avatar", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 50);

    cb(null, `${Date.now()}-${baseName || "avatar"}${ext}`);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (_req, file, cb) => {
    if (String(file.mimetype || "").startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Chi ho tro upload file anh"));
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


// ================= AUTH =================
app.get("/api/forum", async (req, res) => {
  try {
    const payload = await buildForumPayload();
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Forum error", error: err.message });
  }
});
function normalizeFollowTargetId(raw) {
  const s = String(raw ?? "").trim();
  if (!s || !mongoose.Types.ObjectId.isValid(s)) return null;
  return s;
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findUserByUsername(name, excludeUserId = null) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) return null;

  const filter = {
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" }
  };

  if (excludeUserId && mongoose.Types.ObjectId.isValid(String(excludeUserId))) {
    filter._id = { $ne: excludeUserId };
  }

  return User.findOne(filter).select("_id name").lean();
}

async function followUserHandler(req, res) {
  try {
    const targetId =
      normalizeFollowTargetId(req.params?.id) ||
      normalizeFollowTargetId(req.body?.userId) ||
      normalizeFollowTargetId(req.body?.targetUserId);

    if (!targetId) {
      return res.status(400).json({ message: "Thiếu hoặc sai ID người dùng" });
    }
    if (String(req.user.id) === String(targetId)) {
      return res.status(400).json({ message: "Không thể theo dõi chính mình" });
    }

    const target = await User.findById(targetId).select("_id active").lean();
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (target.active === false) {
      return res.status(403).json({ message: "Không thể theo dõi tài khoản đã khóa" });
    }

    await User.updateOne({ _id: req.user.id }, { $addToSet: { following: targetId } });

    const [followerCount, me] = await Promise.all([
      User.countDocuments({ following: targetId }),
      User.findById(req.user.id).select("following").lean()
    ]);

    return res.json({
      message: "Đã theo dõi",
      isFollowing: true,
      followerCount,
      viewerFollowingCount: Array.isArray(me?.following) ? me.following.length : 0
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi theo dõi", error: err.message });
  }
}

async function unfollowUserHandler(req, res) {
  try {
    const targetId =
      normalizeFollowTargetId(req.params?.id) ||
      normalizeFollowTargetId(req.body?.userId) ||
      normalizeFollowTargetId(req.body?.targetUserId);

    if (!targetId) {
      return res.status(400).json({ message: "Thiếu hoặc sai ID người dùng" });
    }

    await User.updateOne({ _id: req.user.id }, { $pull: { following: targetId } });

    const [followerCount, me] = await Promise.all([
      User.countDocuments({ following: targetId }),
      User.findById(req.user.id).select("following").lean()
    ]);

    return res.json({
      message: "Đã bỏ theo dõi",
      isFollowing: false,
      followerCount,
      viewerFollowingCount: Array.isArray(me?.following) ? me.following.length : 0
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi bỏ theo dõi", error: err.message });
  }
}

function decodeOptionalJwtUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ") || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function packDmRest(doc) {
  const from = doc.from;
  const to = doc.to;
  return {
    _id: doc._id,
    text: doc.text,
    createdAt: doc.createdAt,
    fromId: from?._id != null ? String(from._id) : String(doc.from),
    toId: to?._id != null ? String(to._id) : String(doc.to),
    fromName: from?.name || "",
    toName: to?.name || "",
    reactions: Array.isArray(doc.reactions)
      ? doc.reactions.map((r) => ({
        userId: String(r.userId),
        emoji: r.emoji
      }))
      : []
  };
}

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .lean();

    const followerAgg = await User.aggregate([
      { $project: { following: { $ifNull: ["$following", []] } } },
      { $unwind: "$following" },
      { $group: { _id: "$following", followerCount: { $sum: 1 } } }
    ]);
    const followerMap = Object.fromEntries(
      followerAgg.map((x) => [String(x._id), x.followerCount])
    );

    let viewerFollowing = new Set();
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ") && process.env.JWT_SECRET) {
      try {
        const bearer = authHeader.split(" ")[1];
        const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
        const me = await User.findById(decoded.id).select("following").lean();
        if (me?.following?.length) {
          viewerFollowing = new Set(me.following.map((id) => String(id)));
        }
      } catch {
        /* ignore */
      }
    }

    const payload = users.map((u) => {
      const id = String(u._id);
      const followingList = u.following || [];
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || "",
        role: u.role,
        active: u.active,
        isVerify: u.isVerify,
        followerCount: followerMap[id] || 0,
        followingCount: followingList.length,
        isFollowing: viewerFollowing.has(id)
      };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải danh sách người dùng", error: err.message });
  }
});

app.post("/api/follow", verifyToken, followUserHandler);
app.post("/api/unfollow", verifyToken, unfollowUserHandler);
app.post("/api/users/:id/follow", verifyToken, followUserHandler);
app.post("/api/users/:id/unfollow", verifyToken, unfollowUserHandler);

app.get("/api/users/:id/profile", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const u = await User.findById(id).select("name email avatar role active following isVerify").lean();
    if (!u) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const viewer = decodeOptionalJwtUser(req);
    const viewerId = viewer ? String(viewer.id) : null;

    const followerCount = await User.countDocuments({ following: id });
    const followingCount = (u.following || []).length;
    const postCount = await Post.countDocuments({ authorId: id });

    let isFollowing = false;
    if (viewerId && viewerId !== id) {
      const me = await User.findById(viewerId).select("following").lean();
      isFollowing = (me?.following || []).some((x) => String(x) === id);
    }

    const isSelf = viewerId === id;
    const showEmail = isSelf || viewer?.role === "admin";

    return res.json({
      _id: u._id,
      name: u.name,
      avatar: u.avatar || "",
      role: u.role,
      active: u.active !== false,
      isVerify: u.isVerify,
      email: showEmail ? u.email : undefined,
      followerCount,
      followingCount,
      postCount,
      isFollowing: Boolean(viewerId && viewerId !== id && isFollowing)
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi tải profile", error: err.message });
  }
});

app.patch("/api/users/:id/profile", verifyToken, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khong hop le" });
    }

    const isSelf = String(req.user.id) === id;
    const isAdmin = req.user.role === "admin";
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Ban khong co quyen cap nhat ho so nay" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }

    const normalizedName = String(req.body?.name || "").trim();
    const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
    const normalizedPassword = String(req.body?.password || "");

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ message: "Ten va email la bat buoc" });
    }

    const existingUsername = await findUserByUsername(normalizedName, id);
    if (existingUsername) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    if (normalizedPassword && normalizedPassword.length < 6) {
      return res.status(400).json({ message: "Mat khau toi thieu 6 ky tu" });
    }

    const existing = await User.findOne({ email: normalizedEmail }).select("_id").lean();
    if (existing && String(existing._id) !== id) {
      return res.status(409).json({ message: "Email da duoc su dung" });
    }

    user.name = normalizedName;
    user.email = normalizedEmail;
    if (normalizedPassword) {
      user.password = normalizedPassword;
    }
    await user.save();

    return res.json({
      message: "Cap nhat ho so thanh cong",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        role: user.role,
        active: user.active !== false,
        isVerify: user.isVerify
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Loi cap nhat ho so", error: err.message });
  }
});

app.patch("/api/users/:id/avatar", verifyToken, (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload avatar that bai" });
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khong hop le" });
    }

    const isSelf = String(req.user.id) === id;
    const isAdmin = req.user.role === "admin";
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Ban khong co quyen cap nhat avatar nay" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui long chon anh dai dien" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return res.json({
      message: "Cap nhat avatar thanh cong",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        role: user.role,
        active: user.active !== false,
        isVerify: user.isVerify
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Loi cap nhat avatar", error: err.message });
  }
});

app.get("/api/users/:id/posts", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const exists = await User.exists({ _id: id });
    if (!exists) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const limit = Math.min(30, Math.max(1, parseInt(String(req.query.limit || "12"), 10) || 12));

    const posts = await Post.find({ authorId: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title topicId createdAt status")
      .lean();

    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi tải bài viết", error: err.message });
  }
});

app.get("/api/search/users", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json([]);
    }

    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      $or: [{ name: pattern }, { email: pattern }]
    })
      .select("name email role active")
      .limit(10)
      .lean();

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi tìm thành viên", error: err.message });
  }
});

app.get("/api/search/posts", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json([]);
    }

    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const bypass = canBypassForumTopicFilter(req);
    const allowed = bypass ? null : await getPublicForumTopicIdValues();

    const filter = {
      $or: [{ title: pattern }, { content: pattern }]
    };

    if (!bypass && allowed?.length) {
      filter.topicId = { $in: allowed };
    }

    const posts = await Post.find(filter)
      .populate("authorId", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi tìm bài viết", error: err.message });
  }
});

app.get("/api/messages/conversations", verifyToken, async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.id);
    const rows = await DirectMessage.aggregate([
      { $match: { $or: [{ from: me }, { to: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$from", me] }, "$to", "$from"]
          },
          lastText: { $first: "$text" },
          lastAt: { $first: "$createdAt" }
        }
      },
      { $sort: { lastAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "peer"
        }
      },
      { $unwind: { path: "$peer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          peerId: "$_id",
          peerName: "$peer.name",
          lastText: 1,
          lastAt: 1
        }
      }
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải hội thoại", error: err.message });
  }
});

app.get("/api/messages/with/:otherUserId", verifyToken, async (req, res) => {
  try {
    const me = req.user.id;
    const other = req.params.otherUserId;
    if (!mongoose.Types.ObjectId.isValid(other)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    if (String(me) === String(other)) {
      return res.status(400).json({ message: "Không thể xem hội thoại với chính mình" });
    }

    const list = await DirectMessage.find({
      $or: [
        { from: me, to: other },
        { from: other, to: me }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(300)
      .populate("from", "name")
      .populate("to", "name")
      .lean();

    res.json(list.map(packDmRest));
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải tin nhắn", error: err.message });
  }
});

app.get("/api/notifications", verifyToken, async (req, res) => {
  try {
    const meId = req.user.id;
    const meObjectId = new mongoose.Types.ObjectId(meId);

    const [directMessages, moderatedPosts, postComments] = await Promise.all([
      DirectMessage.find({ to: meId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("from", "name")
        .select("from text createdAt")
        .lean(),
      Post.find({
        authorId: meId,
        status: { $in: ["approved", "rejected"] }
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select("title status moderationReason updatedAt")
        .lean(),
      Comment.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "posts",
            localField: "postId",
            foreignField: "_id",
            as: "post"
          }
        },
        { $unwind: "$post" },
        {
          $match: {
            "post.authorId": meObjectId,
            authorId: { $ne: meObjectId }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author"
          }
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            content: 1,
            createdAt: 1,
            "post._id": 1,
            "post.title": 1,
            "author.name": 1
          }
        },
        { $limit: 20 }
      ])
    ]);

    const dmItems = directMessages.map((dm) => ({
      _id: `dm-${dm._id}`,
      title: `Tin nhắn mới từ ${dm.from?.name || "Thành viên"}`,
      desc: dm.text,
      type: "message",
      read: false,
      createdAt: dm.createdAt
    }));

    const postStatusItems = moderatedPosts.map((post) => ({
      _id: `post-status-${post._id}`,
      title:
        post.status === "approved"
          ? "Bài viết của bạn đã được duyệt"
          : "Bài viết của bạn bị từ chối",
      desc:
        post.status === "rejected" && post.moderationReason
          ? `${post.title || "(Không tiêu đề)"} - Lý do: ${post.moderationReason}`
          : post.title || "(Không tiêu đề)",
      type: "post",
      read: false,
      createdAt: post.updatedAt || post.createdAt || new Date()
    }));

    const commentItems = postComments.map((c) => ({
      _id: `comment-${c._id}`,
      title: `Bài viết của bạn có bình luận mới`,
      desc: `${c.author?.name || "Thành viên"}: ${c.content || ""}`,
      type: "post",
      read: false,
      createdAt: c.createdAt,
      postId: c.post?._id
    }));

    const items = [...dmItems, ...postStatusItems, ...commentItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi tải thông báo", error: err.message });
  }
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

    const existing = await User.findOne({ email: normalizedEmail }).select("_id").lean();
    const existingUsername = await findUserByUsername(normalizedName);
    if (existingUsername) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    if (rawPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    if (existing) {
      return res.status(409).json({ message: "Email đã được đăng ký" });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: rawPassword,
      role: "student",
      active: true,
      isVerify: false,
      verifyToken,
      verifyTokenExpires
    });

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
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Cấu hình máy chủ thiếu JWT_SECRET" });
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    if (!normalizedEmail || !rawPassword) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Không tìm thấy tài khoản với email này" });
    }

    if (user.password !== rawPassword) {
      return res.status(400).json({ message: "Mật khẩu không đúng" });
    }

    if (user.active === false) {
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
      avatar: user.avatar || "",
      role: user.role,
      active: user.active !== false,
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

    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("authorId", "name email")
      .lean();

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

app.patch("/api/posts/:id/reactions", verifyToken, async (req, res) => {
  try {
    const emoji = String(req.body?.emoji || "").trim();
    if (!emoji) {
      return res.status(400).json({ message: "Thiếu emoji" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const userId = String(req.user.id);
    const reactions = Array.isArray(post.reactions) ? post.reactions : [];
    const idx = reactions.findIndex(
      (r) => String(r.userId) === userId && String(r.emoji) === emoji
    );
    if (idx >= 0) reactions.splice(idx, 1);
    else reactions.push({ userId, emoji });
    post.reactions = reactions;
    await post.save();

    return res.json({ _id: post._id, reactions: post.reactions });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi cập nhật cảm xúc bài viết", error: err.message });
  }
});

app.patch("/api/comments/:id/reactions", verifyToken, async (req, res) => {
  try {
    const emoji = String(req.body?.emoji || "").trim();
    if (!emoji) {
      return res.status(400).json({ message: "Thiếu emoji" });
    }
    const c = await Comment.findById(req.params.id);
    if (!c) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }
    const reactions = Array.isArray(c.reactions) ? c.reactions : [];
    const userId = String(req.user.id);
    const idx = reactions.findIndex(
      (r) => String(r.userId) === userId && String(r.emoji) === emoji
    );
    if (idx >= 0) reactions.splice(idx, 1);
    else reactions.push({ userId, emoji });
    c.reactions = reactions;
    await c.save();

    const out = await Comment.findById(c._id).populate("authorId", "name email").lean();
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi cập nhật cảm xúc", error: err.message });
  }
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

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

require("./socket/directChat")(io, {
  DirectMessage,
  User,
  jwt,
  JWT_SECRET: process.env.JWT_SECRET
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
