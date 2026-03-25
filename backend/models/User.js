const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: String,
  avatar: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ["student", "moderator", "admin"],
    default: "student"
  },
  active: {
    type: Boolean,
    default: true
  },
  isVerify: {
    type: Boolean,
    default: false
  },
  verifyToken: {
    type: String,
    default: ""
  },
  verifyTokenExpires: {
    type: Date,
    default: null
  },
  following: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: []
  }
});

module.exports = mongoose.model("User", userSchema);
