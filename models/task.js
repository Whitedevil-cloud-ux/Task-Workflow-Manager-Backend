const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    title: {
        type: String, 
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium"
    },

    status: {
        type: String,
        enum: ["backlog", "todo", "in_progress", "completed"],
        default: "todo"
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User",   
        required: true
    },

    dueDate: {
        type: Date,
        default: null
    },

    workflowStage: {
        type: Schema.Types.ObjectId,
        ref: "WorkflowStage",
        required: true
    },

    attachments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Attachment"
        }
    ],

    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],

    subtasks: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            title: { type: String, required: true },
            isDone: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;