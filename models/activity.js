const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activityLogSchema = new Schema({
  action: {
    type: String, 
    required: true
  },

  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task"
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

  details: {
    type: String,
    default: ""
  },

  createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model("Activity", activityLogSchema);
module.exports = Activity;