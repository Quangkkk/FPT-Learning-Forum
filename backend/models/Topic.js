const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, 
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Topic", topicSchema);
