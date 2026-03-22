const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ["image", "video"],
    required: true
  },
  name: String,
  mimeType: String,
  url: {
    type: String,
    required: true
  }
}, { _id: false });

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
  },

  moderationReason: {
    type: String,
    default: ""
  },

  imageUrls: {
    type: [String],
    default: []
  },

  videoUrls: {
    type: [String],
  media: {
    type: [mediaSchema],
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
