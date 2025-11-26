const User = require("../models/user");
const Task = require("../models/task");
const Comment = require("../models/comment");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, "name email avatar role");
        res.json({ success: true, users });
    } catch (error) {
        console.error("Get users error: ", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json({ success: true, user });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, bio } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, bio },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.countDocuments({ assignedTo: userId });
    const comments = await Comment.countDocuments({ userId });
    const completed = await Task.countDocuments({
      assignedTo: userId,
      status: "completed",
    });

    res.json({
      success: true,
      stats: {
        tasks,
        comments,
        completed,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};