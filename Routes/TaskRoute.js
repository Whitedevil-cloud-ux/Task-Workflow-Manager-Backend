const express = require("express");
const router = express.Router();
const taskController = require("../Controllers/TaskController");
const auth = require("../Middlewares/AuthMiddleware");

router.post("/", auth, taskController.createTask);
router.get("/", auth, taskController.getTasks);
router.get("/:id", auth, taskController.getTaskById);
router.put("/:id", auth, taskController.updateTask);
router.delete("/:id", auth, taskController.deleteTask);

router.patch("/:id/status", auth, taskController.updateTaskStatus);
router.patch("/:id/assign", auth, taskController.assignTask);

router.post("/:id/subtasks", auth, taskController.addSubtask);
router.put("/:taskId/subtasks/:subId", auth, taskController.updateSubtask);
router.delete("/:taskId/subtasks/:subId", auth, taskController.deleteSubtask);

module.exports = router;
