require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/posts", require("./routes/post.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/forum", require("./routes/forum.routes"));

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
