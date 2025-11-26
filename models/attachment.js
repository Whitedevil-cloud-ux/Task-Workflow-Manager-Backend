const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
    taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },

  url: {
    type: String,
    required: true
  },

  fileType: {
    type: String,
    default: "unknown"
  },

  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: { type: Date, default: Date.now }
});

const Attachment = mongoose.model("Attachment", attachmentSchema);
module.exports = Attachment;