const router = require("express").Router();
const auth = require("../Middlewares/AuthMiddleware");
const { enhanceTaskController, suggestSubtasksController } = require("../Controllers/AIController");

// POST /api/ai/enhance-task
router.post("/enhance-task", auth, enhanceTaskController);

// POST /api/ai/suggest-subtasks
router.post("/suggest-subtasks", auth, suggestSubtasksController);

module.exports = router;
