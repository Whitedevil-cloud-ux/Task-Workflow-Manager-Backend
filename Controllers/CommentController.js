const Comment = require("../models/comment");
const Task = require("../models/task");
const mongoose = require("mongoose");
const { pushNotification } = require("../services/notificationService");
const Activity = require("../models/activity");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ====================================
// Helper: Log Activity + Emit Socket
// ====================================
async function logActivity(action, userId, taskId, details = "") {
  try {
    const activity = await Activity.create({
      action,
      userId,
      taskId,
      details
    });

    const populated = await Activity.findById(activity._id)
      .populate("userId", "name email avatar")
      .populate("taskId", "title");

    if (global.io) {
      global.io.emit("activity", populated);
    }

    return populated;
  } catch (err) {
    console.error("Activity log error:", err);
  }
}

// ====================================
// GET COMMENTS FOR TASK
// ====================================
exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!isValidId(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const comments = await Comment.find({ taskId })
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, comments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================
// ADD COMMENT TO TASK
// ====================================
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (!isValidId(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const newComment = await Comment.create({
      taskId,
      userId: req.user.id,
      content,
    });

    const populated = await Comment.findById(newComment._id)
      .populate("userId", "name email avatar");

    // ------------------------
    // 🔥 Real-time comment
    // ------------------------
    if (global.io) {
      global.io.emit("comment_added", populated);
    }

    // ------------------------
    // 🔥 Add activity event
    // ------------------------
    await logActivity(
      "COMMENT_ADDED",
      req.user.id,
      taskId,
      `New comment added: "${content.substring(0, 40)}${content.length > 40 ? "..." : ""}"`
    );

    // ------------------------
    // 🔥 Notify assigned user (if not same user)
    // ------------------------
    if (task.assignedTo.toString() !== req.user.id) {
      await pushNotification(
        task.assignedTo,
        `${populated.userId.name} commented on "${task.title}"`,
        task._id
      );
    }

    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    console.error("Failed to add comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================
// UPDATE COMMENT
// ====================================
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!isValidId(id))
      return res.status(400).json({ message: "Invalid comment ID" });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    comment.content = content;
    await comment.save();

    const populated = await Comment.findById(id).populate(
      "userId",
      "name email avatar"
    );

    // Realtime update
    if (global.io) {
      global.io.emit("comment_updated", populated);
    }

    await logActivity(
      "COMMENT_UPDATED",
      req.user.id,
      comment.taskId,
      `Comment updated`
    );

    res.json({ success: true, comment: populated });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================
// DELETE COMMENT
// ====================================
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id))
      return res.status(400).json({ message: "Invalid comment ID" });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await Comment.findByIdAndDelete(id);

    if (global.io) {
      global.io.emit("comment_deleted", { _id: id, taskId: comment.taskId });
    }

    await logActivity(
      "COMMENT_DELETED",
      req.user.id,
      comment.taskId,
      "Comment deleted"
    );

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
