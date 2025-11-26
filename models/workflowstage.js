const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const workflowStageSchema = new Schema({
    name: {
    type: String,
    required: true
  },

  order: {
    type: Number,
    default: 0
  },

  color: {
    type: String,
    default: "#3b82f6"
  },

  createdAt: { type: Date, default: Date.now }
});

const WorkflowStage = mongoose.model("WorkflowStage", workflowStageSchema);
module.exports = WorkflowStage;