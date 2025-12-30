const router = require("express").Router();
const auth = require("../Middlewares/AuthMiddleware");
const { enhanceTaskController } = require("../Controllers/AIController");

// POST /api/ai/enhance-task
router.post("/enhance-task", auth, enhanceTaskController);

module.exports = router;
