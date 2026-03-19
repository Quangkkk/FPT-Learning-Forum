const Report = require("../models/Report");

exports.getReports = async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.json(reports);
};

exports.createReport = async (req, res) => {
  const report = await Report.create(req.body);
  res.json(report);
};
