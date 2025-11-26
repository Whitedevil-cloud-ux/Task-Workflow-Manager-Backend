const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  content: {
    type: String,
    required: true
  },

  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;