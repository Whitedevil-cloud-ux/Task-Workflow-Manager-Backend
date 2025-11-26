const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  message: {
    type: String,
    required: true
  },

  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    default: null
  },

  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;