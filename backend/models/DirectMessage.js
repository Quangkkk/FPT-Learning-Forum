const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, trim: true, maxlength: 16 }
  },
  { _id: false }
);

const directMessageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    reactions: {
      type: [reactionSchema],
      default: []
    }
  },
  { timestamps: true }
);

directMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
directMessageSchema.index({ to: 1, from: 1, createdAt: -1 });

module.exports = mongoose.model("DirectMessage", directMessageSchema);
