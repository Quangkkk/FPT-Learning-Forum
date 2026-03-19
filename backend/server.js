require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const seedUsers = require("./seed");
const app = express();
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

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


// ================= AUTH =================
app.get("/api/forum", (req, res) => {
  res.json({
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
  });
});
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= POSTS =================
app.get("/api/posts", async (req, res) => {
  const { topicId } = req.query;
  const filter = topicId ? { topicId } : {};

  const posts = await Post.find(filter).sort({ createdAt: -1 });
  res.json(posts);
});

app.get("/api/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  const comments = await Comment.find({ postId: req.params.id });

  res.json({ post, comments });
});

app.post("/api/posts", async (req, res) => {
  const post = await Post.create(req.body);
  res.json(post);
});

app.patch("/api/posts/:id/status", async (req, res) => {
  const { status } = req.body;
  await Post.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: "Updated" });
});


// ================= COMMENTS =================
app.post("/api/posts/:id/comments", async (req, res) => {
  const comment = await Comment.create({
    postId: req.params.id,
    authorId: req.body.authorId,
    content: req.body.content
  });

  res.json(comment);
});


// ================= REPORTS =================
app.get("/api/reports", async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.json(reports);
});

app.post("/api/reports", async (req, res) => {
  const report = await Report.create(req.body);
  res.json(report);
});


app.get("/api/admin/stats", async (req, res) => {
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
app.use("/api/admin", require("./routes/admin.routes"));

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});