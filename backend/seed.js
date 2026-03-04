const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");

const seedData = async () => {
  // ================= USERS =================
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany([
      {
        name: "Student",
        email: "student@fpt.edu.vn",
        password: "123456",
        role: "student"
      },
      {
        name: "Moderator",
        email: "mod@fpt.edu.vn",
        password: "123456",
        role: "moderator"
      },
      {
        name: "Admin",
        email: "admin@fpt.edu.vn",
        password: "123456",
        role: "admin"
      }
    ]);
    console.log("🌱 Seeded users");
  }

  const student = await User.findOne({ role: "student" });
  const moderator = await User.findOne({ role: "moderator" });

  // ================= POSTS =================
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    const posts = await Post.insertMany([
      {
        title: "Không hiểu vòng lặp for trong PRF192",
        content: "Mình chưa hiểu cách hoạt động của vòng lặp for trong C.",
        topicId: "prf192",
        authorId: student._id,
        status: "approved"
      },
      {
        title: "Giải thích Inheritance trong PRO192",
        content: "Cho mình hỏi extends trong Java dùng để làm gì?",
        topicId: "pro192",
        authorId: student._id,
        status: "pending"   // 🔥 CHỜ PHÊ DUYỆT
      },
      {
        title: "LinkedList khác ArrayList thế nào?",
        content: "Trong CSD201 nên dùng cấu trúc nào?",
        topicId: "csd201",
        authorId: student._id,
        status: "approved"
      },
      {
        title: "JOIN trong DBI202 hoạt động sao?",
        content: "Inner join và left join khác nhau như thế nào?",
        topicId: "dbi202",
        authorId: student._id,
        status: "rejected"
      }
    ]);

    console.log("🌱 Seeded posts");

    // ================= COMMENTS =================
    await Comment.insertMany([
      {
        postId: posts[0]._id,
        authorId: moderator._id,
        content: "Vòng lặp for gồm 3 phần: khởi tạo, điều kiện, tăng biến."
      },
      {
        postId: posts[0]._id,
        authorId: student._id,
        content: "Cảm ơn bạn mình hiểu rồi."
      },
      {
        postId: posts[1]._id,
        authorId: moderator._id,
        content: "Bài này đang chờ admin duyệt nhé."
      }
    ]);

    console.log("🌱 Seeded comments");
  }
};

module.exports = seedData;