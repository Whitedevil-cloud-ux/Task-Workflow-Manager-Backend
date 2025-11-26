const WorkflowStage = require("../models/workflowstage");
const Task = require("../models/task");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// --------------------------------------------------
// GET ALL STAGES
// --------------------------------------------------
exports.getStages = async (req, res) => {
  try {
    const stages = await WorkflowStage.find().sort({ order: 1 });
    res.json({ success: true, stages });
  } catch (error) {
    console.error("Get stages error: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------------------
// CREATE NEW STAGE (AUTO ORDER)
// --------------------------------------------------
exports.createStage = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Stage name is required" });
    }

    const count = await WorkflowStage.countDocuments();
    const nextOrder = count + 1;

    const stage = await WorkflowStage.create({
      name,
      order: nextOrder,
      color: color || "#3b82f6",
    });

    res.status(201).json({ success: true, stage });
  } catch (err) {
    console.error("Create stage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------------------
// UPDATE STAGE
// --------------------------------------------------
exports.updateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid ID" });

    const stage = await WorkflowStage.findById(id);
    if (!stage) return res.status(404).json({ message: "Stage not found" });

    stage.name = name ?? stage.name;
    stage.color = color ?? stage.color;

    await stage.save();

    res.json({ success: true, stage });
  } catch (error) {
    console.error("Update stage error: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------------------
// DELETE STAGE
// --------------------------------------------------
exports.deleteStage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid ID" });

    const tasksCount = await Task.countDocuments({ workflowStage: id });
    if (tasksCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete a stage that has assigned tasks" });
    }

    await WorkflowStage.findByIdAndDelete(id);

    // reorder properly
    const remaining = await WorkflowStage.find().sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].order = i + 1;
      await remaining[i].save();
    }

    res.json({ success: true, message: "Stage deleted" });
  } catch (err) {
    console.error("Delete stage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------------------
// REORDER STAGES
// --------------------------------------------------
exports.reorderStages = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds array required" });
    }

    // Validate each ID
    for (const id of orderedIds) {
      if (!isValidId(id)) {
        return res.status(400).json({ message: "Invalid ID in orderedIds" });
      }
    }

    // Bulk reorder
    const bulk = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1 } },
      },
    }));

    await WorkflowStage.bulkWrite(bulk);

    const stages = await WorkflowStage.find().sort({ order: 1 });
    res.json({ success: true, stages });
  } catch (err) {
    console.error("Reorder stages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
