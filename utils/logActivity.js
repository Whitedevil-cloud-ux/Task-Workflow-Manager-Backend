const Activity = require("../models/activity");

module.exports = async function logActivity({
  userId,
  action,
  taskId = null,
  details = ""
}) {
  try {
    await Activity.create({
      userId,
      action,
      taskId,
      details
    });
  } catch (err) {
    console.error("Activity Log Error:", err);
  }
};