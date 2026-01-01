const Task = require("../models/task");
const WorkflowStage = require("../models/workflowstage");
const mongoose = require("mongoose");
const Activity = require("../models/activity");
const { pushNotification } = require("../services/notificationService");
const { analyzeTaskRisk } = require("../services/riskAnalyzer");
const { explainTaskRisk } = require("../services/AIService");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- Activity Logger ---
async function logActivity(action, userId, taskId, details = "") {
  try {
    const activity = await Activity.create({
      action,
      userId,
      taskId,
      details
    });

    const populated = await Activity.findById(activity._id)
      .populate("userId", "name avatar email")
      .populate("taskId", "title");

    // Emit to ALL users (or later: restrict to teams)
    if (global.io) {
      global.io.emit("activity", populated);
    }

    return activity;
  } catch (err) {
    console.error("Activity log error:", err);
  }
}


// -----------------------------
// CREATE TASK
// -----------------------------
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, workflowStage } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!assignedTo) return res.status(400).json({ message: "assignedTo is required" });
    if (!workflowStage) return res.status(400).json({ message: "workflowStage is required" });

    const stage = await WorkflowStage.findById(workflowStage);
    if (!stage) return res.status(400).json({ message: "Invalid workflow stage" });

    const task = await Task.create({
      title,
      description: description || "",
      priority: priority || "Medium",
      createdBy: req.user.id,
      assignedTo,
      dueDate: dueDate || null,
      workflowStage,
      status: stage.name.toLowerCase().includes("complete") ? "completed" : "todo",
    });

    // Push notification 
    await pushNotification(
      assignedTo,
      `You have been assigned a new task: "${title}"`,
      task._id
    );

    // *** LOG ACTIVITY ***
    await logActivity("TASK_CREATED", req.user.id, task._id, `Created task "${title}"`);

    const populated = await Task.findById(task._id)
      .populate("createdBy", "name email avatar role")
      .populate("assignedTo", "name email avatar role")
      .populate("workflowStage");

    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    console.error("Create task error ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------------------
// GET ALL TASKS
// -----------------------------------------
exports.getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      createdBy,
      workflowStage,
      search,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;
    if (workflowStage) filter.workflowStage = workflowStage;
    if (search) filter.title = { $regex: search, $options: "i" };

    const tasks = await Task.find(filter)
      .populate("createdBy", "name email avatar")
      .populate("assignedTo", "name email avatar")
      .populate("workflowStage")
      .sort({ createdAt: -1 });

    res.json({ success: true, total: tasks.length, tasks });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------------------
// GET SINGLE TASK
// -----------------------------------------
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid task ID" });

    const task = await Task.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("assignedTo", "name email avatar")
      .populate("workflowStage");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ success: true, task });
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------------------
// UPDATE TASK
// -----------------------------------------
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this task" });
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    )
      .populate("createdBy", "name email avatar")
      .populate("assignedTo", "name email avatar")
      .populate("workflowStage");

    
    // Update notification
    await pushNotification(
      task.assignedTo,
      `Task "${task.title}" was updated`,
      task._id
    );

    // *** LOG ACTIVITY ***
    await logActivity("TASK_UPDATED", req.user.id, id, "Updated task");

    return res.json({
      success: true,
      message: "Task updated successfully",
      task: updated
    });

  } catch (err) {
    console.error("Update task error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------------------
// DELETE TASK
// -----------------------------------------
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this task" });
    }

    await Task.findByIdAndDelete(id);

    await pushNotification(
      task.assignedTo,
      `Task "${task.title}" was deleted`,
      task._id
    );


    // *** LOG ACTIVITY ***
    await logActivity("TASK_DELETED", req.user.id, id, "Deleted task");

    return res.json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------------------
// UPDATE STATUS (drag/drop)
// -----------------------------------------
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { workflowStageId } = req.body;

    if (!isValidId(id) || !isValidId(workflowStageId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      task.createdBy.toString() !== req.user.id &&
      task.assignedTo.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const stage = await WorkflowStage.findById(workflowStageId);
    if (!stage) return res.status(400).json({ message: "Invalid workflow stage" });

    task.workflowStage = workflowStageId;
    task.status =
      stage.name.toLowerCase().includes("complete")
        ? "completed"
        : stage.name.toLowerCase().includes("progress")
        ? "in_progress"
        : stage.name.toLowerCase().includes("todo")
        ? "todo"
        : "backlog";

    await task.save();

    // Update notification
    await pushNotification(
      task.assignedTo,
      `Task "${task.title}" moved to ${stage.name}`,
      task._id
    );


    // *** LOG ACTIVITY ***
    await logActivity("STATUS_CHANGED", req.user.id, id, `Moved to ${stage.name}`);

    const populated = await Task.findById(id)
      .populate("createdBy")
      .populate("assignedTo")
      .populate("workflowStage");

    res.json({ success: true, task: populated });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------------------
// ASSIGN USER
// -----------------------------------------
exports.assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) return res.status(400).json({ message: "assignedTo is required" });
    if (!isValidId(id) || !isValidId(assignedTo))
      return res.status(400).json({ message: "Invalid ID format" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    task.assignedTo = assignedTo;
    task.updatedAt = Date.now();
    await task.save();

    // Assignment notification
    await pushNotification(
      assignedTo,
      `You have been assigned task "${task.title}"`,
      task._id
    );


    // *** LOG ACTIVITY ***
    await logActivity("TASK_ASSIGNED", req.user.id, id, `Assigned to ${assignedTo}`);

    const populated = await Task.findById(id)
      .populate("createdBy")
      .populate("assignedTo")
      .populate("workflowStage");

    res.json({ success: true, task: populated });
  } catch (err) {
    console.error("Assign task error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD SUBTASK
exports.addSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.subtasks.push({ title });
    await task.save();

    res.json({ success: true, subtasks: task.subtasks });
  } catch (err) {
    console.error("Add subtask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE SUBTASK
exports.updateSubtask = async (req, res) => {
  try {
    const { taskId, subId } = req.params;
    const { title, isDone } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const subtask = task.subtasks.id(subId);
    if (!subtask) return res.status(404).json({ message: "Subtask not found" });

    if (title !== undefined) subtask.title = title;
    if (isDone !== undefined) subtask.isDone = isDone;

    await task.save();

    res.json({ success: true, subtasks: task.subtasks });
  } catch (err) {
    console.error("Update subtask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE SUBTASK
exports.deleteSubtask = async (req, res) => {
  try {
    const { taskId, subId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.subtasks.pull(subId);
    await task.save();

    res.json({ success: true, subtasks: task.subtasks });
  } catch (err) {
    console.error("Delete subtask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------------------
// GET TASK RISK ANALYSIS (AI + Deterministic)
// -----------------------------------------
exports.getTaskRisk = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const activities = await Activity.find({ taskId: id })
      .sort({ createdAt: -1 })
      .limit(10);

    const riskResult = analyzeTaskRisk(task, activities);

    const aiExplanation = await explainTaskRisk(riskResult);

    return res.json({
      success: true,
      risk: {
        score: riskResult.score,
        level: riskResult.level,
        summary: aiExplanation.summary,
        reasons: aiExplanation.reasons,
        suggestedAction: aiExplanation.suggestedAction,
      },
    });

  } catch (err) {
    console.error("Task risk analysis error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------------------
// CREATE TASK FROM NLP
// -----------------------------------------
exports.createTaskFromNLP = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const users = await mongoose.model("User").find({}, "name _id");

    const parsed = await require("../services/AIService")
      .parseTaskFromText({ text, users });

    const assignee = users.find(
      (u) =>
        parsed.assigneeName &&
        u.name.toLowerCase() === parsed.assigneeName.toLowerCase()
    );

    if (!assignee) {
      return res.status(400).json({
        message: "Assignee not found",
        parsed,
      });
    }

    const stage = await WorkflowStage.findOne();
    if (!stage) {
      return res.status(400).json({ message: "No workflow stage found" });
    }

    const task = await Task.create({
      title: parsed.title,
      description: parsed.description || "",
      priority: parsed.priority || "Medium",
      createdBy: req.user.id,
      assignedTo: assignee._id,
      dueDate: 
        parsed.dueDate && parsed.dueDate !== "null"
          ? new Date(parsed.dueDate)
          : null,
      workflowStage: stage._id,
      status: "todo",
    });

    await logActivity(
      "TASK_CREATED_NLP",
      req.user.id,
      task._id,
      "Created via NLP"
    );

    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name email avatar role")
      .populate("assignedTo", "name email avatar role")
      .populate("workflowStage");

    res.status(201).json({ success: true, task: populatedTask });
  } catch (err) {
    console.error("NLP task error", err);
    res.status(500).json({ message: "Server error" });
  }
};

