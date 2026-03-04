const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);