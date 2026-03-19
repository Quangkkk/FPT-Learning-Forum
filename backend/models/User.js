const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["student", "moderator", "admin"],
    default: "student"
  },
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("User", userSchema);
