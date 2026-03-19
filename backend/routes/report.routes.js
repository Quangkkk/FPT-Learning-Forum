const express = require("express");
const router = express.Router();
const {
  getReports,
  createReport
} = require("../controllers/report.controller");

router.get("/", getReports);
router.post("/", createReport);

module.exports = router;
