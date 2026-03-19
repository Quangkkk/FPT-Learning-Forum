const express = require("express");
const router = express.Router();
const {
  getPosts,
  getPostDetail,
  createPost,
  updateStatus,
  createComment
} = require("../controllers/post.controller");

router.get("/", getPosts);
router.get("/:id", getPostDetail);
router.post("/", createPost);
router.patch("/:id/status", updateStatus);
router.post("/:id/comments", createComment);

module.exports = router;
