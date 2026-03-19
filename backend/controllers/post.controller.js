const Post = require("../models/Post");
const Comment = require("../models/Comment");

exports.getPosts = async (req, res) => {
  const { topicId } = req.query;
  const filter = topicId ? { topicId } : {};

  const posts = await Post.find(filter).sort({ createdAt: -1 });
  res.json(posts);
};

exports.getPostDetail = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const comments = await Comment.find({ postId: req.params.id });

  res.json({ post, comments });
};

exports.createPost = async (req, res) => {
  const post = await Post.create(req.body);
  res.json(post);
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  await Post.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: "Updated" });
};

exports.createComment = async (req, res) => {
  const comment = await Comment.create({
    postId: req.params.id,
    authorId: req.body.authorId,
    content: req.body.content
  });

  res.json(comment);
};
