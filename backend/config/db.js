const mongoose = require("mongoose");
const seedUsers = require("../seed/seed");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
    await seedUsers();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
