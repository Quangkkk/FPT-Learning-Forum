const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    targetType: String,
    targetId: String,
    reason: String,
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);