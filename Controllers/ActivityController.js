const Activity = require("../models/activity");

exports.getActivities = async (req, res) => {
  try {
    const logs = await Activity.find()
      .populate("userId", "name email avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(40);

    res.json({ success: true, activities: logs });
  } catch (err) {
    console.error("Activity fetch error", err);
    res.status(500).json({ message: "Server error" });
  }
};
