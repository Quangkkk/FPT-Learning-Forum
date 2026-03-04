const mongoose = require("mongoose");

const forumSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("Forum", forumSchema, "forum");