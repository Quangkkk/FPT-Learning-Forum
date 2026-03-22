const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  topicId: String,
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  isAnonymous: {        // 👈 thêm dòng này
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);