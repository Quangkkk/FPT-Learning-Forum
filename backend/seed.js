const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Category = require("./models/Category");
const Topic = require("./models/Topic");

const seedData = async () => {
  // ================= USERS =================
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany([
      { name: "Student", email: "student@fpt.edu.vn", password: "123456", role: "student", active: true },
      { name: "Moderator", email: "mod@fpt.edu.vn", password: "123456", role: "moderator", active: true },
      { name: "Admin", email: "admin@fpt.edu.vn", password: "123456", role: "admin", active: true }
    ]);
    console.log("🌱 Seeded users");
  }

  const student = await User.findOne({ role: "student" });
  const moderator = await User.findOne({ role: "moderator" });

  // ================= CATEGORIES =================
  const categoryCount = await Category.countDocuments();
  let category;
  if (categoryCount === 0) {
    category = await Category.create({
      name: "Công nghệ thông tin",
      slug: "cong-nghe-thong-tin"
    });
    console.log("🌱 Seeded category");
  } else {
    category = await Category.findOne();
  }

  // ================= TOPICS =================
  const topicCount = await Topic.countDocuments();
  let topicsMap = {};
  if (topicCount === 0) {
    const topics = await Topic.insertMany([
      { name: "PRF192 - Programming Fundamentals", categoryId: category._id, slug: "prf192" },
      { name: "PRO192 - Object-Oriented Programming", categoryId: category._id, slug: "pro192" },
      { name: "CSD201 - Data Structures & Algorithms", categoryId: category._id, slug: "csd201" },
      { name: "DBI202 - Database Systems", categoryId: category._id, slug: "dbi202" },
      { name: "SWP391 - Software Project", categoryId: category._id, slug: "swp391" },
      { name: "MAD101 - Mobile Development", categoryId: category._id, slug: "mad101" },
      { name: "WED201 - Web Design", categoryId: category._id, slug: "wed201" }
    ]);

    // map topic slug -> topic._id
    topics.forEach(t => (topicsMap[t.slug] = t._id));
    console.log("🌱 Seeded topics");
  } else {
    const topics = await Topic.find();
    topics.forEach(t => (topicsMap[t.slug] = t._id));
  }

  // ================= POSTS =================
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    const posts = await Post.insertMany([
      {
        title: "Không hiểu vòng lặp for trong PRF192",
        content: "Mình chưa hiểu cách hoạt động của vòng lặp for trong C.",
        topicId: topicsMap["prf192"],
        authorId: student._id,
        status: "approved"
      },
      {
        title: "Giải thích Inheritance trong PRO192",
        content: "Cho mình hỏi extends trong Java dùng để làm gì?",
        topicId: topicsMap["pro192"],
        authorId: student._id,
        status: "pending"
      },
      {
        title: "LinkedList khác ArrayList thế nào?",
        content: "Trong CSD201 nên dùng cấu trúc nào?",
        topicId: topicsMap["csd201"],
        authorId: student._id,
        status: "approved"
      },
      {
        title: "JOIN trong DBI202 hoạt động sao?",
        content: "Inner join và left join khác nhau như thế nào?",
        topicId: topicsMap["dbi202"],
        authorId: student._id,
        status: "rejected"
      }
    ]);

    console.log("🌱 Seeded posts");

    // ================= COMMENTS =================
    await Comment.insertMany([
      { postId: posts[0]._id, authorId: moderator._id, content: "Vòng lặp for gồm 3 phần: khởi tạo, điều kiện, tăng biến." },
      { postId: posts[0]._id, authorId: student._id, content: "Cảm ơn bạn mình hiểu rồi." },
      { postId: posts[1]._id, authorId: moderator._id, content: "Bài này đang chờ admin duyệt nhé." }
    ]);

    console.log("🌱 Seeded comments");
  }
};

module.exports = seedData;
