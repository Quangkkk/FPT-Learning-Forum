const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, trim: true, maxlength: 16 }
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    reactions: {
      type: [reactionSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);